// ---------------------------------------------------------------------------------------
// AREAS: a part of the world kept on the GPU only while the camera is in it or beside it (docs/ARCHITECTURE.md, "Areas"; the owner's
// FFXII areas, through Calissa, 2026-10-25). This is the first stage of the ruling, eviction: an area's drawing stays built in the page
// (its geometry's arrays, its materials, its colliders, its programs), and what a phone pays for it, the GPU's copies of its buffers
// and textures, is let go when the camera has been out of the area and its neighbours for a beat. Drawn again, three uploads them
// again from what the page kept (a baked canvas is drawn again: render/bakedcanvas.js); `prepare` does it at once, behind the seam's
// cover, so the first frame back is not the one that pays. Only what nothing outside the area draws is let go: a shared texture or
// geometry (the room glaze atlas, a prop's mesh used in two places) stays resident. Building and disposing the content itself is the
// next stage, area by area (ARCHITECTURE.md's order).
//
// DEHYDRATION (stage 1.5, on a phone or `?dehydrate=1`; the owner, 2026-10-25: the iPhone took the graphics back at 125 real s on
// Minimum, 82 MB of geometry held): an area let go also gives up the page's copy of its geometry. Each geometry nothing outside the area
// draws has its arrays packed into a Blob (a browser keeps a blob's bytes out of the page's own heap: WebKit in its network process,
// Chromium on disk past a size) and its attributes left empty; drawn again, `prepare` reads the Blob back and puts the arrays where
// they were. The objects, materials, colliders and every reference to them stay: only the bytes leave. Not dehydrated: a skinned or
// batched mesh, an attribute marked dynamic (code writes it while away), anything under 64 KB.
//
// Prior art: the streaming residency of every console engine (Unreal's level streaming keeps a level's actors while its GPU copies come
// and go; id Tech's megatexture pages); three.js's own dispose(), which drops the GPU's copy and keeps the source, re-uploaded on use.
//
//   game.areas = new Areas(game)   .register(id, { zones: [...], near: [...], build?, teardown? })   .ensureAt(zone)   .update(rawDt) (each tick)   .prepare(id)   .settle()
//   .resident(id) -> bool   .stats() -> [{ id, resident, dryMB, evicted: { geometries, textures, mb } }]   .lastMs (the last pass, real ms)
//   .dehydrate (on a phone)   .dryBytes (held in blobs now)
// ---------------------------------------------------------------------------------------

const GRACE = 3;
const DRY_MIN = 65536; // (bytes: a geometry smaller than this keeps its arrays, the blob's own cost not worth it) // (real seconds out of an area and its neighbours before it is let go: a step back through a door costs nothing)
const SLICE = 2; // (real ms a frame the pass over the scene may take when nothing covers the view: about 40 ms whole, perf v273's ticks)

const _texOf = (m, out) => {
  if (!m) return;
  for (const v of Object.values(m)) if (v?.isTexture) out.push(v);
  if (m.uniforms) for (const u of Object.values(m.uniforms)) { const v = u?.value; if (v?.isTexture) out.push(v); else if (Array.isArray(v)) for (const x of v) if (x?.isTexture) out.push(x); }
};
/** A texture three cannot upload again from a source of its own: a render target's, a video's (a baked canvas draws itself again:
 *  asked first, so that asking for its data does not draw it). */
const unkept = (t) => !t.userData?.baked && (t.isRenderTargetTexture || t.isVideoTexture || t.isFramebufferTexture || !t.source?.data);
/** Bytes on the GPU, roughly: a texture's pixels at four bytes (and a third more with mips), a geometry's arrays. */
const texBytes = (t) => { const im = t.userData?.baked || t.source?.data || {}; return (im.width || 0) * (im.height || 0) * 4 * (t.generateMipmaps ? 4 / 3 : 1); };
const geoBytes = (g) => { let n = g.index ? g.index.array.byteLength : 0; for (const a of Object.values(g.attributes)) n += a.array?.byteLength || 0; return n; };

export class Areas {
  constructor(game) {
    this.game = game;
    this.map = new Map();
    this.dehydrate = !!game.graphics?.machine?.mobile || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('dehydrate') === '1');
    this.dryBytes = 0; // (the bytes now held in blobs, not the page)
  }

  /** An area: the render zones it is (render/zones.js), and the ones from which it can be seen or walked into (kept resident there). */
  register(id, { zones, near = [], build = null, teardown = null }) {
    this.map.set(id, { id, zones: new Set(zones), near: new Set(near), resident: true, away: 0, evicted: null, build, teardown, built: !build });
    return this;
  }

  /** STAGE 2 (an area that builds itself: `build(game)` makes its content, sync, where the seam or a door covers it; `teardown(game)`
   *  takes it all down, geometry, colliders and listeners, its module left empty but alive): built when the camera is in it or beside it
   *  (or a teleport lands in it: `ensureAt`), torn down a GRACE away from it. Its owner's module must answer while torn down (a query
   *  about it returns nothing). Areas without `build` stay built from boot (stage 1 and dehydration). */
  ensure(A) {
    if (!A || A.built || !A.build) return;
    try { A.build(this.game); A.built = true; A.resident = true; A.away = 0; this.game.events?.emit('area.build', { area: A.id, by: 'environment' }); }
    catch (e) { console.warn('areas: build failed', A.id, e); }
  }
  /** The area a point lands in, built now (a teleport, the Index, a Shrine: course.teleport calls it before the move). */
  ensureAt(zone) { for (const A of this.map.values()) if (A.zones.has(zone) || A.near.has(zone)) this.ensure(A); }
  down(A) {
    if (!A.built || !A.teardown) return;
    try { A.teardown(this.game); } catch (e) { console.warn('areas: teardown failed', A.id, e); }
    A.built = false; A.resident = false; A.dry = null; A.evicted = null;
    this.game.events?.emit('area.teardown', { area: A.id, by: 'environment' });
  }

  resident(id) { return this.map.get(id)?.resident ?? true; }

  /** Let the GPU copies of every area in `due` go: only what nothing outside them draws. A pass over the scene, at once (`now`: behind a
   *  cover, or the end of the warm-up) or a few real ms a frame (`SLICE`), so play never pays its tens of ms in one tick (perf, v273). */
  evict(due, now = true) {
    const job = this.job = { due, owner: new Map(), roots: [...this.game.scene.children], i: 0, ms: 0 }; job.had = new Set(job.roots);
    if (now) this.step(Infinity);
    return job;
  }

  /** The eviction under way, carried on for `budget` real ms; finished, its GPU copies let go. */
  step(budget) {
    const J = this.job; if (!J) return;
    const t0 = performance.now(), Z = this.game.zones, owner = J.owner, texs = [], SHARED = 'shared';
    const own = (res, A) => { const o = owner.get(res); if (o === undefined) owner.set(res, A); else if (o !== A) owner.set(res, SHARED); };
    const skip = J.skip || (J.skip = new Set());
    const walk = (root, A) => root.traverse((o) => {
      if (o.geometry) { own(o.geometry, A); if (o.isSkinnedMesh || o.isBatchedMesh || o.isInstancedMesh || o.isPoints || o.morphTargetInfluences) skip.add(o.geometry); }
      if (o.material) { texs.length = 0; for (const m of Array.isArray(o.material) ? o.material : [o.material]) _texOf(m, texs); for (const t of texs) own(t, A); }
    });
    while (J.i < J.roots.length) {
      const o = J.roots[J.i++]; if (o.parent !== this.game.scene) continue; // (taken out since the job began)
      const z = o.userData.zoneFree ? null : o.userData.zone !== undefined ? o.userData.zone : Z.place(o, false);
      walk(o, (z !== null && J.due.find((A) => A.zones.has(z))) || SHARED);
      if (performance.now() - t0 > budget) { J.ms += performance.now() - t0; return; }
    }
    const ov = this.game.overlayScene?.scene; if (ov) walk(ov, SHARED);
    for (const o of this.game.scene.children) if (!J.had.has(o)) walk(o, SHARED); // (added since the job began: kept, whatever they are)
    for (const A of J.due) { A.resident = false; A.evicted = { geos: [], texs: [], bytes: 0 }; }
    for (const [res, A] of owner) {
      if (A === SHARED) continue;
      if (res.isTexture) { if (unkept(res)) continue; A.evicted.bytes += texBytes(res); A.evicted.texs.push(res); } else { A.evicted.bytes += geoBytes(res); A.evicted.geos.push(res); }
      res.dispose();
    }
    if (this.dehydrate) for (const A of J.due) this.dry(A, J.skip);
    this.job = null;
    this.lastMs = +(J.ms + performance.now() - t0).toFixed(1);
  }

  /** Upload the area's textures again now (behind a cover: the seam, a door), not on the first frame that draws them. */
  prepare(id) {
    const A = typeof id === 'string' ? this.map.get(id) : id; if (!A || A.resident) return;
    const r = this.game.renderer;
    if (r?.initTexture) for (const t of A.evicted?.texs || []) { try { r.initTexture(t); } catch { /* (drawn, it uploads anyway) */ } }
    if (A.dry) this.wet(A);
    A.resident = true; A.away = 0; A.evicted = null;
  }

  /** The area's own geometries' arrays packed into one Blob, their attributes left empty (see DEHYDRATION). */
  dry(A, skip) {
    const parts = [], rec = [];
    let off = 0;
    for (const g of A.evicted?.geos || []) {
      if (skip?.has(g) || g.userData?.keepArrays || geoBytes(g) < DRY_MIN) continue;
      const attrs = [];
      const take = (name, a) => {
        if (!a?.array || a.isInterleavedBufferAttribute || a.usage !== 35044 || a.array.byteLength === 0) return false; // (35044: StaticDrawUsage; code writes a dynamic one)
        const b = a.array; parts.push(new Uint8Array(b.buffer, b.byteOffset, b.byteLength).slice());
        attrs.push({ name, a, C: b.constructor, off, len: b.length, count: a.count }); off += b.byteLength;
        return true;
      };
      const all = [['index', g.index], ...Object.entries(g.attributes)].filter(([, a]) => a);
      if (!all.every(([, a]) => !a.isInterleavedBufferAttribute && a.usage === 35044 && a.array?.byteLength)) continue; // (all or nothing: a half-dried geometry is never drawn)
      for (const [n, a] of all) take(n, a);
      if (!g.boundingSphere) g.computeBoundingSphere(); if (!g.boundingBox) g.computeBoundingBox(); // (kept: culling and rays read them, not the arrays)
      for (const e of attrs) { e.a.array = new e.C(0); e.a.count = 0; }
      g.userData.dry = true;
      rec.push({ g, attrs });
    }
    if (!rec.length) return;
    A.dry = { blob: new Blob(parts), rec, bytes: off };
    this.dryBytes += off;
  }

  /** The arrays back from the Blob (async: behind the seam's cover, or a step before the door). */
  wet(A) {
    const D = A.dry; A.dry = null; if (!D) return;
    this.dryBytes -= D.bytes;
    const put = (buf) => {
      for (const { g, attrs } of D.rec) {
        for (const e of attrs) {
          const cur = e.name === 'index' ? g.index : g.attributes[e.name];
          if (cur !== e.a) continue; // (replaced while away: the new one stands)
          e.a.array = new e.C(buf.slice(e.off, e.off + e.len * e.C.BYTES_PER_ELEMENT)); e.a.count = e.count; e.a.needsUpdate = true;
        }
        g.userData.dry = false;
        g.dispose(); // (any buffer three made of the empty arrays meanwhile is let go: it is made again at the arrays' size)
      }
    };
    D.blob.arrayBuffer().then(put, (err) => console.warn('areas: an area could not be read back', A.id, err));
  }

  update(dt) {
    const cur = this.game.zones?.current;
    if (cur === undefined || cur === null) return; // (nowhere yet, or between places: nothing changes)
    const covered = !!this.game.seam?.busy, due = [];
    if (this.job && this.job.due.some((A) => A.zones.has(cur) || A.near.has(cur))) this.job = null; // (came back before it finished: nothing let go)
    if (this.job) { this.step(covered ? Infinity : SLICE); return; }
    for (const A of this.map.values()) {
      const here = A.zones.has(cur) || A.near.has(cur);
      if (here) { A.away = 0; if (!A.built) this.ensure(A); else if (!A.resident) this.prepare(A); continue; }
      if (A.teardown) { if (A.built && (A.away += dt) >= GRACE) this.down(A); continue; } // (stage 2: taken down whole, not evicted)
      if (!A.resident) continue;
      A.away += dt;
      if (covered || A.away >= GRACE) due.push(A);
    }
    if (due.length) this.evict(due, covered); // (at once behind a cover; else sliced over frames)
  }

  /** Let every area go that is neither here nor beside here, now (the end of the warm-up, under the loading screen: boot drew them all). */
  settle() {
    const cur = this.game.zones?.current; if (cur === undefined || cur === null) return;
    for (const A of this.map.values()) if (A.teardown && A.built && !A.zones.has(cur) && !A.near.has(cur)) this.down(A);
    const due = [...this.map.values()].filter((A) => A.resident && !A.teardown && !A.zones.has(cur) && !A.near.has(cur));
    if (due.length) this.evict(due);
  }

  stats() { return [...this.map.values()].map((A) => ({ id: A.id, resident: A.resident, dryMB: A.dry ? +(A.dry.bytes / 1048576).toFixed(1) : 0, evicted: A.evicted ? { geometries: A.evicted.geos.length, textures: A.evicted.texs.length, mb: +(A.evicted.bytes / 1048576).toFixed(1) } : null })); }
}
