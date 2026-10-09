// ---------------------------------------------------------------------------------------
// THE TELEGRAPHS' LOOK: what Divination draws of a creature's windup (docs/plans/TELEGRAPHS.md; the owner, 2026-10-09: "Attack
// Telegraphs are tied to Divination and are visualized in Lachryma HUD colors"). It takes the telegraph `markOf` gives
// (progress/combat/telegraphs.js: each field present only from the Divination step that earns it) and draws exactly that, never
// more: step 1 the area's EDGE on the ground in the Mind's ink, step 2 the FILL to the edge on the windup's own clock, step 3 the
// damage type's colour and motif and the STATUS glyph, step 4 the ANSWER glyph. Shapes with no ground draw on the thing instead: a
// gaze the eye on the gazer, adds a head marker over each add (a pip a second left from step 2), a raidwide the arena's RIM.
//
//   AT MOST SIX at once (TELEGRAPH.max): a seventh takes the place of the oldest. They are never culled by distance, by a render
//   zone or by the effect budget: six ground meshes and one batch of glyphs, drawn over everything but the ground's own depth.
//   THE CLOCK is the windup's: `h.eta(seconds)` from the creature's own countdown every frame (creatures.js counts `w.t`; Perception's
//   `shownEta` as the parry mark has it); between two calls it runs on the sim step handed to update(), the step the windup itself
//   runs on. The fill reaches the edge on the strike frame and the mark is gone with the blow (`hide`, or of itself just after).
//   STILL TRUE every frame (the casebook's rule 107): `alive()` is asked each frame; a maker downed or a cast broken takes its mark.
//   THE GROUND it lies on: `look.ground = (x, z, yHint) -> y | null` (a place's own height: the bowl's dish, the Dunes' sand); unset, a
//   physics ray down, asked once a world cell (vfx/telegraphs/telegraphdrape.js).
//
// Prior art: FFXIV's ground markers and head markers (the shape, the answer drawn on it), WildStar's fill to the edge, WoW 11.1's
// crisp-edged swirlies, GW2's lesson that culled or stacked telegraphs are worse than none (a cap, one edge a cast, never culled),
// Into the Breach's intent marks, and Monster Hunter's rule that the body comes first (this only adds to the creature's tell).
//
//   game.telegraphs = new TelegraphLook(game)   .update(dt, camera)   (dt: the sim step; main.js, every frame)
//   const h = telegraphs.show(id, mark, { origin, facing, eta, total?, points?, target?, width?, rot?, pockets?, radius?, centre?,
//             rim?: { centre, radius, band? }, on?, height?, adds?, left?, bait?, locked?, friendly?, color?, alive?, hold? })
//     mark      markOf(...)'s telegraph (null hides `id`)                origin, facing   the maker's feet and which way it faces
//     eta       real seconds to the strike now; total: the whole windup (mark.fill when the step shows it)
//     points    where a shape at the Courier is laid (a circle `at: 'courier'`, the baited drops, a tracked shape, puddles left)
//     on        the gazer (Object3D | Vector3 | (out) -> out), height above its feet; adds: the adds (each the same); left: seconds left
//     pockets   a floor's safe islands [{ x, z, r }]; rim: a raidwide's arena; bait: what a bait answer is led into [{ x, y, z }]
//     friendly  an ally's area (a sibling's, a spirit's): the outline alone, in the Courier's draught colour (or `color`)
//   h.eta(seconds)   h.set({ ...any of the opts })   h.next(eta)   (out-in: the second half, the band)   h.hide()
//   telegraphs.hide(id)   .clear()   .count   .prewarm() -> park   (the boot's warm-up: one mark and one glyph, compiled)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindTick } from '../labradorite.js';
import { TELEGRAPH } from '../../progress/combat/telegraphs.js';
import { COLOR } from '../../progress/weather.js';
import { shapesOf, frameOf, toWorld } from './telegraphshapes.js';
import { telegraphMaterial, TYPE_INDEX, TYPE_TINTS } from './telegraphshader.js';
import { telegraphAtlas, cellOf } from './telegraphatlas.js';
import { TelegraphDrape, heightCache } from './telegraphdrape.js';

const BOARDS = 96, FADE_IN = 0.12, GRACE = 0.08;
/** The light of each glyph: the answers the Mind's pale; a status its aura's colour (vfx/library.js `aura.<status>`). */
const GLYPH_TINT = {
  answer: 0xe6dcff, tmark: 0xe6dcff, stun: 0xf2cc5a, doubt: 0x6a96f0, charm: 0xf4a6bc, blind: 0x9ad8f0, confusion: 0xb48ae0,
  slow: 0x7fb2ff, halt: 0xbfe6ff, sleep: 0xd9c8ff, soaked: 0x8fd0c8,
};
const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _c = new THREE.Color(), _down = new THREE.Vector3(0, -1, 0);

export class TelegraphLook {
  constructor(game, { scene = game?.scene, max = TELEGRAPH.max } = {}) {
    this.game = game; this.max = max; this.t = 0;
    this.live = new Map(); // id -> telegraph
    this.ground = null;
    this.rayGround = heightCache((x, z, y) => this.rayAt(x, z, y));
    const atlas = telegraphAtlas();
    this.pool = Array.from({ length: max }, (_, i) => {
      const drape = new TelegraphDrape(), mat = telegraphMaterial({ mode: 'ground', atlas });
      const mesh = new THREE.Mesh(drape.geometry, mat);
      mesh.name = `telegraph.mark.${i}`; mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 4; mesh.raycast = () => {};
      mesh.userData.zoneFree = true;
      return { drape, mat, mesh, busy: null };
    });
    this.boards = this.makeBoards(atlas);
    this.group = new THREE.Group(); this.group.name = 'telegraphs'; this.group.userData.zoneFree = true;
    for (const p of this.pool) this.group.add(p.mesh);
    this.group.add(this.boards.mesh);
    scene?.add(this.group);
  }

  get count() { return this.live.size; }

  // ------------------------------------------------------------------ the glyphs: one batch of camera-facing quads
  makeBoards(atlas) {
    const n = BOARDS, g = new THREE.BufferGeometry();
    const at = (k) => new THREE.BufferAttribute(new Float32Array(n * 4 * k), k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', at(3)); g.setAttribute('glyph', at(4)); g.setAttribute('shift', at(3)); g.setAttribute('tint', at(3));
    const corner = new Float32Array(n * 8), idx = new Uint16Array(n * 6);
    for (let i = 0; i < n; i++) {
      corner.set([-1, -1, 1, -1, 1, 1, -1, 1], i * 8);
      idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    }
    g.setAttribute('corner', new THREE.BufferAttribute(corner, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setDrawRange(0, 0);
    const mat = telegraphMaterial({ mode: 'glyphs', atlas }), mesh = new THREE.Mesh(g, mat);
    mesh.name = 'telegraph.glyphs'; mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 44; mesh.raycast = () => {};
    return { g, mat, mesh, n: 0 };
  }
  /** One glyph this frame: art id, where (world), size (m), alpha, tint (hex), stand (its foot on the point), shift [x, y, scale]. */
  board(art, p, size, alpha, tint, stand = 1, sx = 0, sy = 0, sc = 1) {
    const B = this.boards; if (B.n >= BOARDS) return;
    const g = B.g.attributes, k = B.n++;
    _c.setHex(tint);
    for (let v = 0; v < 4; v++) {
      const o = k * 4 + v;
      g.position.setXYZ(o, p.x, p.y, p.z); g.glyph.setXYZW(o, cellOf(art), size, alpha, stand);
      g.shift.setXYZ(o, sx, sy, sc); g.tint.setXYZ(o, _c.r, _c.g, _c.b);
    }
  }

  // ------------------------------------------------------------------ the ground
  /** The ground under (x, z): the place's own function, else a ray down from above the maker (static colliders only). */
  heightAt(x, z, yHint) {
    const y = this.ground?.(x, z, yHint);
    if (Number.isFinite(y)) return y;
    const r = this.rayGround(x, z, yHint);
    return Number.isFinite(r) && Math.abs(r - yHint) < 8 ? r : yHint;
  }
  rayAt(x, z, y0 = 0) {
    const ph = this.game?.physics;
    const hit = ph?.raycast?.(_r.set(x, y0 + 4, z), _down, 12, undefined, undefined, (c) => !c.parent?.() || c.parent().isFixed?.());
    return hit ? hit.point.y : NaN;
  }

  // ------------------------------------------------------------------ the interface
  show(id, mark, opts = {}) {
    if (!mark) { this.hide(id); return null; }
    let T = this.live.get(id);
    if (!T) {
      if (this.live.size >= this.max) this.hide(this.oldest());
      T = { id, born: this.t, age: 0, slot: null, o: {}, mark: null, eta: 0, total: 1, half: 0 };
      this.live.set(id, T);
      T.h = { id, eta: (e) => { if (Number.isFinite(e)) T.eta = e; }, set: (o) => Object.assign(T.o, o), next: (e) => { T.half = 1; if (Number.isFinite(e)) { T.eta = e; T.total = Math.max(0.05, e); } }, hide: () => this.hide(id) };
    }
    T.mark = mark; Object.assign(T.o, opts);
    if (Number.isFinite(opts.eta)) T.eta = opts.eta;
    T.total = Math.max(0.05, opts.total ?? (Number.isFinite(mark.fill) ? mark.fill : null) ?? T.eta ?? 1);
    const onGround = mark.ground || (mark.shape === 'raidwide' && !!T.o.rim); // (a raidwide lies on the arena's rim when it has one)
    if (onGround && !T.slot) T.slot = this.pool.find((p) => !p.busy) || null;
    if (T.slot) { T.slot.busy = T; T.slot.drape.reset(); }
    return T.h;
  }
  get(id) { return this.live.get(id)?.h || null; }
  hide(id) {
    const T = this.live.get(id); if (!T) return;
    if (T.slot) { T.slot.busy = null; T.slot.mesh.visible = false; }
    this.live.delete(id);
    if (!this.live.size) this.rayGround.clear(); // (the last mark gone: the next fight asks the ground again, a Well's floor laid anew)
  }
  clear() { for (const id of [...this.live.keys()]) this.hide(id); }
  oldest() { let o = null; for (const T of this.live.values()) if (!o || T.born < o.born) o = T; return o?.id; }

  // ------------------------------------------------------------------ once a frame
  update(dt = 1 / 60, camera = this.game?.camera) {
    const raw = this.game?.rawDt ?? dt;
    this.t += raw; mindTick();
    this.boards.n = 0;
    for (const T of [...this.live.values()]) {
      const o = T.o;
      if ((o.alive && !o.alive()) || (T.eta < -GRACE && !o.hold && T.mark.shape !== 'left')) { this.hide(T.id); continue; } // (its maker gone, or its blow landed)
      T.eta -= dt; T.age += raw;
      const alpha = Math.min(1, T.age / FADE_IN);
      const origin = this.where(o.origin, _v.set(0, 0, 0)).clone();
      const F = frameOf(origin, this.facingOf(o.facing));
      const mark = T.half && T.mark.shape === 'out-in' && T.mark.answer ? { ...T.mark, answer: 'in' } : T.mark; // (out-in's second half: back in)
      const shapes = shapesOf(mark, F, { ...o, half: T.half, points: o.points?.map?.((q) => this.where(q, new THREE.Vector3())), target: o.target ? this.where(o.target, new THREE.Vector3()) : null });
      const prog = T.mark.fill == null ? -1 : T.mark.shape === 'left' ? 2 : THREE.MathUtils.clamp(1 - T.eta / T.total, 0, 1);
      if (T.slot && shapes?.prims.length) this.drawGround(T, shapes, F, origin, prog, alpha);
      else if (T.slot) T.slot.mesh.visible = false;
      this.drawBoards(T, shapes, F, origin, prog, alpha);
    }
    const B = this.boards, a = B.g.attributes;
    B.mesh.visible = B.n > 0;
    if (B.n) { B.g.setDrawRange(0, B.n * 6); for (const k of ['position', 'glyph', 'shift', 'tint']) a[k].needsUpdate = true; }
    B.mat.uniforms.uT.value = this.t;
    if (camera?.fov) B.mat.uniforms.uPxK.value = (2 * Math.tan((camera.fov * Math.PI) / 360)) / 480;
  }

  where(q, out) {
    if (!q) return out;
    if (q.isObject3D) return q.getWorldPosition(out);
    if (typeof q === 'function') return q(out) || out;
    return out.set(q.x ?? 0, q.y ?? 0, q.z ?? 0);
  }
  facingOf(f) {
    if (f == null) return 0;
    if (typeof f === 'number') return f;
    if (f.isObject3D) { const d = f.getWorldDirection(new THREE.Vector3()); return { x: d.x, z: d.z }; }
    return { x: f.x ?? 0, z: f.z ?? 1 };
  }

  drawGround(T, S, F, origin, prog, alpha) {
    const { mesh, mat, drape } = T.slot, U = mat.uniforms, o = T.o, mark = T.mark;
    drape.lay(S.bounds, (x, z) => this.heightAt(x, z, origin.y));
    U.uFrame.value.set(F.ox, F.oz, F.fx, F.fz);
    S.prims.forEach((p, i) => { U.uPrimA.value[i].set(p.kind, p.x, p.z, p.rot || 0); U.uPrimB.value[i].set(p.a, p.b); });
    U.uPrimN.value = S.prims.length;
    S.pockets.forEach((k, i) => U.uPocket.value[i].set(k.x, k.z, k.r)); U.uPocketN.value = S.pockets.length;
    S.stamps.forEach((s, i) => { U.uStamp.value[i].set(s.x, s.z, s.angle, s.size); U.uStampCell.value[i] = cellOf(s.art); }); U.uStampN.value = S.stamps.length;
    const friendly = !!o.friendly;
    U.uFriendly.value = friendly ? 1 : 0;
    if (friendly) U.uFriend.value.setHex(o.color ?? (typeof o.friendly === 'number' ? o.friendly : this.draughtHex()));
    U.uFill.value = friendly ? -1 : prog;
    const ty = friendly || !mark.type ? -1 : TYPE_INDEX[mark.type] ?? -1;
    U.uType.value = ty;
    if (ty >= 0) { const [a, b] = TYPE_TINTS[mark.type]; U.uTintA.value.setHex(a); U.uTintB.value.setHex(b); }
    U.uCaution.value = mark.shape === 'tracked' ? 1 : 0; U.uLocked.value = o.locked ? 1 : 0;
    U.uT.value = this.t; U.uAlpha.value = alpha;
    mesh.visible = true;
  }

  /** The Courier's draught colour (game.draughtHex: its strongest feeling's), else wonder's. */
  draughtHex() { return this.game?.draughtHex ?? COLOR.wonder; }

  drawBoards(T, S, F, origin, prog, alpha) {
    const o = T.o, mark = T.mark;
    if (o.friendly) return;
    const lift = (lx, lz, y = null) => { const [x, z] = toWorld(F, lx, lz); return new THREE.Vector3(x, y ?? this.heightAt(x, z, origin.y), z); };
    // the status the blow builds, where its fill lands last (step 3)
    const statuses = mark.status ? [].concat(mark.status) : [];
    const statusAt = (p, size, dx = 0) => statuses.forEach((s, i) => this.board(`status.${s}`, p, size, alpha, GLYPH_TINT[s] ?? GLYPH_TINT.answer, 1, dx + (i - (statuses.length - 1) / 2) * 1.05, 0, 1));
    if (S?.far && statuses.length) statusAt(lift(S.far[0], S.far[1]), 1.6);
    // the answer's glyphs that stand (the guard on the rim, the high ground, the bait)
    for (const b of S?.boards || []) {
      const p = b.local ? lift(b.local[0], b.local[1]) : new THREE.Vector3(b.world.x, b.world.y ?? this.heightAt(b.world.x, b.world.z, origin.y), b.world.z);
      this.board(b.art, p, b.size, alpha, GLYPH_TINT.answer, b.stand);
    }
    // the shapes with no ground: on the thing itself
    const pips = (p, seconds, size) => { const n = Math.min(10, Math.max(0, Math.ceil(seconds - 1e-3))); for (let i = 0; i < n; i++) this.board('tmark.pip', p, size, alpha, GLYPH_TINT.tmark, 1, (i - (n - 1) / 2) * 0.34, 1.05, 0.34); };
    if (mark.shape === 'gaze') {
      const p = this.where(o.on, origin.clone()).add(_v.set(0, o.height ?? (o.on ? 0 : 2), 0)), size = o.glyphSize ?? 2.2;
      this.board(mark.answer === 'lookAway' ? 'answer.lookAway' : 'tmark.eye', p, size, alpha, GLYPH_TINT.answer, 1);
      if (prog >= 0) pips(p, Math.max(0, T.eta), size);
      if (statuses.length) statusAt(p.clone(), size * 0.6, 1.45); // (beside the eye, never over it)
    } else if (mark.shape === 'adds' || mark.shape === 'split') {
      for (const a of o.adds || []) {
        const p = this.where(a, new THREE.Vector3()).add(_v.set(0, o.addHeight ?? 1.4, 0)), size = o.glyphSize ?? 1.4;
        this.board(mark.answer === 'killFirst' ? 'answer.killFirst' : 'tmark.add', p, size, alpha, GLYPH_TINT.answer, 1);
        if (prog >= 0) pips(p, o.left ?? Math.max(0, T.eta), size);
      }
    }
  }

  // ------------------------------------------------------------------ the boot's warm-up (the casebook's rules 17, 18)
  /** Show one mark and one glyph for the compile, 50 m under the world; returns what parks them again. */
  prewarm() {
    const P = this.pool[0];
    P.drape.lay({ x0: -2, z0: -2, x1: 2, z1: 2 }, () => -50);
    P.mat.uniforms.uPrimN.value = 1; P.mat.uniforms.uPrimA.value[0].set(0, 0, 0, 0); P.mat.uniforms.uPrimB.value[0].set(1.5, 0);
    P.mesh.visible = true;
    this.board('answer.out', new THREE.Vector3(0, -50, 0), 1, 1, GLYPH_TINT.answer); this.boards.g.setDrawRange(0, 6); this.boards.mesh.visible = true;
    for (const k of ['position', 'glyph', 'shift', 'tint']) this.boards.g.attributes[k].needsUpdate = true;
    return () => { P.mesh.visible = false; P.drape.reset(); this.boards.mesh.visible = false; this.boards.n = 0; };
  }

  dispose() {
    this.clear(); this.group.parent?.remove(this.group);
    for (const p of this.pool) { p.drape.dispose(); p.mat.dispose(); }
    this.boards.g.dispose(); this.boards.mat.dispose();
  }
}
