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
// Prior art: the streaming residency of every console engine (Unreal's level streaming keeps a level's actors while its GPU copies come
// and go; id Tech's megatexture pages); three.js's own dispose(), which drops the GPU's copy and keeps the source, re-uploaded on use.
//
//   game.areas = new Areas(game)   .register(id, { zones: [...], near: [...] })   .update(rawDt) (each tick)   .prepare(id)   .settle()
//   .resident(id) -> bool   .stats() -> [{ id, resident, evicted: { geometries, textures, mb } }]   .lastMs (the last pass, real ms)
// ---------------------------------------------------------------------------------------

const GRACE = 3; // (real seconds out of an area and its neighbours before it is let go: a step back through a door costs nothing)

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
  }

  /** An area: the render zones it is (render/zones.js), and the ones from which it can be seen or walked into (kept resident there). */
  register(id, { zones, near = [] }) {
    this.map.set(id, { id, zones: new Set(zones), near: new Set(near), resident: true, away: 0, evicted: null });
    return this;
  }

  resident(id) { return this.map.get(id)?.resident ?? true; }

  /** Let the GPU copies of every area in `due` go, in one pass over the scene: only what nothing outside them draws. */
  evict(due) {
    const t0 = performance.now(), Z = this.game.zones, owner = new Map(), texs = [], SHARED = 'shared';
    const own = (res, A) => { const o = owner.get(res); if (o === undefined) owner.set(res, A); else if (o !== A) owner.set(res, SHARED); };
    const walk = (root, A) => root.traverse((o) => {
      if (o.geometry) own(o.geometry, A);
      if (o.material) { texs.length = 0; for (const m of Array.isArray(o.material) ? o.material : [o.material]) _texOf(m, texs); for (const t of texs) own(t, A); }
    });
    for (const o of this.game.scene.children) {
      const z = o.userData.zoneFree ? null : o.userData.zone !== undefined ? o.userData.zone : Z.place(o, false);
      walk(o, (z !== null && due.find((A) => A.zones.has(z))) || SHARED);
    }
    const ov = this.game.overlayScene?.scene; if (ov) walk(ov, SHARED);
    for (const A of due) { A.resident = false; A.evicted = { geos: [], texs: [], bytes: 0 }; }
    for (const [res, A] of owner) {
      if (A === SHARED) continue;
      if (res.isTexture) { if (unkept(res)) continue; A.evicted.bytes += texBytes(res); A.evicted.texs.push(res); } else { A.evicted.bytes += geoBytes(res); A.evicted.geos.push(res); }
      res.dispose();
    }
    this.lastMs = +(performance.now() - t0).toFixed(1);
  }

  /** Upload the area's textures again now (behind a cover: the seam, a door), not on the first frame that draws them. */
  prepare(id) {
    const A = typeof id === 'string' ? this.map.get(id) : id; if (!A || A.resident) return;
    const r = this.game.renderer;
    if (r?.initTexture) for (const t of A.evicted?.texs || []) { try { r.initTexture(t); } catch { /* (drawn, it uploads anyway) */ } }
    A.resident = true; A.away = 0; A.evicted = null;
  }

  update(dt) {
    const cur = this.game.zones?.current;
    if (cur === undefined || cur === null) return; // (nowhere yet, or between places: nothing changes)
    const covered = !!this.game.seam?.busy, due = [];
    for (const A of this.map.values()) {
      const here = A.zones.has(cur) || A.near.has(cur);
      if (here) { A.away = 0; if (!A.resident) this.prepare(A); continue; }
      if (!A.resident) continue;
      A.away += dt;
      if (covered || A.away >= GRACE) due.push(A); // (at once behind a cover: the pass is a few tens of real ms)
    }
    if (due.length) this.evict(due);
  }

  /** Let every area go that is neither here nor beside here, now (the end of the warm-up, under the loading screen: boot drew them all). */
  settle() {
    const cur = this.game.zones?.current; if (cur === undefined || cur === null) return;
    const due = [...this.map.values()].filter((A) => A.resident && !A.zones.has(cur) && !A.near.has(cur));
    if (due.length) this.evict(due);
  }

  stats() { return [...this.map.values()].map((A) => ({ id: A.id, resident: A.resident, evicted: A.evicted ? { geometries: A.evicted.geos.length, textures: A.evicted.texs.length, mb: +(A.evicted.bytes / 1048576).toFixed(1) } : null })); }
}
