// ---------------------------------------------------------------------------------------
// FIGMENT ATTACK TELEGRAPHS, DRAWN: the service that shows what Divination draws of a creature's windup in the third-person game
// (docs/plans/FIGMENT-TELEGRAPHS.md; the owner, 2026-10-09: "Attack Telegraphs are tied to Divination and are visualized in Lachryma
// HUD colors"; always "Figment attack telegraph", never the rail's telegraph mark, vfx/telegraph.js). It takes the Figment attack
// telegraph `figmentMarkOf` gives (progress/combat/figmenttelegraphs.js: each field present only from the Divination step that earns
// it) and draws exactly that, never more: step 1 the area's EDGE on the ground in the Mind's ink, step 2 the FILL to the edge on the
// windup's own clock, step 3 the damage type's colour and motif and the STATUS glyph, step 4 the ANSWER glyph. Shapes with no ground
// draw on the thing instead: a gaze the eye on the gazer, adds a head marker over each add (a pip a second left from step 2), a
// raidwide the arena's RIM. Its parts are in vfx/figmenttelegraph/ (the look, the shapes, the program, the drape, the glyph atlas).
//
//   AT MOST SIX at once (FIGMENT_TELEGRAPH.max): a seventh takes the place of the oldest. They are never culled by distance, by a
//   render zone or by the effect budget: six ground meshes and one batch of glyphs, drawn over everything but the ground's own depth.
//   THE CLOCK is the windup's: `h.eta(seconds)` from the creature's own countdown every frame (creatures.js counts `w.t`; Perception's
//   `shownEta` as the parry mark has it); between two calls it runs on the sim step handed to update(), the step the windup itself
//   runs on. The fill reaches the edge on the strike frame and the mark is gone with the blow (`hide`, or of itself just after).
//   STILL TRUE every frame (the casebook's rule 107): `alive()` is asked each frame; a maker downed or a cast broken takes its mark.
//   THE GROUND it lies on: `figmentTelegraphs.ground = (x, z, yHint) -> y | null` (a place's own height: the bowl's dish, the Dunes'
//   sand); unset, a physics ray down, asked once a world cell (vfx/figmenttelegraph/figmenttelegraphdrape.js).
//
// Prior art: FFXIV's ground markers and head markers, WildStar's fill to the edge, WoW 11.1's crisp-edged swirlies, GW2's lesson that
// culled or stacked AoE marks are worse than none (a cap, one edge a cast, never culled), Into the Breach's intent marks, and Monster
// Hunter's rule that the body comes first (this only adds to the creature's tell).
//
//   game.figmentTelegraphs = new FigmentTelegraphs(game)   .update(dt, camera)   (dt: the sim step; main.js, every frame)
//   const h = figmentTelegraphs.show(id, mark, { origin, facing, eta, total?, points?, target?, width?, rot?, pockets?, radius?,
//             centre?, rim?: { centre, radius, band? }, on?, height?, adds?, left?, bait?, locked?, friendly?, color?, alive?, hold? })
//     mark      figmentMarkOf(...)'s Figment attack telegraph (null hides `id`)     origin, facing   the maker's feet and which way it faces
//     eta       real seconds to the strike now; total: the whole windup (mark.fill when the step shows it)
//     points    where a shape at the Courier is laid (a circle `at: 'courier'`, the baited drops, a tracked shape, puddles left)
//     on        the gazer (Object3D | Vector3 | (out) -> out), height above its feet; adds: the adds (each the same); left: seconds left
//     pockets   a floor's safe islands [{ x, z, r }]; rim: a raidwide's arena; bait: what a bait answer is led into [{ x, y, z }]
//     friendly  an ally's area (a sibling's, a spirit's): the outline alone, in the Courier's draught colour (or `color`)
//   h.eta(seconds)   h.set({ ...any of the opts })   h.next(eta)   (out-in: the second half, the band)   h.hide()
//   figmentTelegraphs.get(id)   .hide(id)   .clear()   .count   .prewarm() -> park   (the boot's warm-up: one mark and one glyph)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindTick } from './labradorite.js';
import { FIGMENT_TELEGRAPH } from '../progress/combat/figmenttelegraphs.js';
import { COLOR } from '../progress/weather.js';
import { shapesOf, frameOf } from './figmenttelegraph/figmenttelegraphshapes.js';
import { figmentTelegraphAtlas } from './figmenttelegraph/figmenttelegraphatlas.js';
import { heightCache } from './figmenttelegraph/figmenttelegraphdrape.js';
import { makeFigmentTelegraphSlot, FigmentTelegraphGlyphs, drawFigmentTelegraphGround, drawFigmentTelegraphGlyphs, GLYPH_TINT } from './figmenttelegraph/figmenttelegraphlook.js';

const FADE_IN = 0.12, GRACE = 0.08;
const _v = new THREE.Vector3(), _r = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);

export class FigmentTelegraphs {
  constructor(game, { scene = game?.scene, max = FIGMENT_TELEGRAPH.max } = {}) {
    this.game = game; this.max = max; this.t = 0;
    this.live = new Map(); // id -> the record of one Figment attack telegraph
    this.ground = null;
    this.rayGround = heightCache((x, z, y) => this.rayAt(x, z, y));
    const atlas = figmentTelegraphAtlas();
    this.pool = Array.from({ length: max }, (_, i) => makeFigmentTelegraphSlot(atlas, i));
    this.glyphs = new FigmentTelegraphGlyphs(atlas);
    this.group = new THREE.Group(); this.group.name = 'figmentTelegraphs'; this.group.userData.zoneFree = true;
    for (const p of this.pool) this.group.add(p.mesh);
    this.group.add(this.glyphs.mesh);
    scene?.add(this.group);
  }

  get count() { return this.live.size; }

  // ------------------------------------------------------------------ the ground
  /** The ground under (x, z): the place's own function, else a ray down from above the maker (static colliders only, and never a
   *  creature's own body: Strawman's capsule is a static collider, and the mark climbed it like a tent: the casebook's rule 183). */
  heightAt(x, z, yHint) {
    const y = this.ground?.(x, z, yHint);
    if (Number.isFinite(y)) return y;
    const r = this.rayGround(x, z, yHint);
    return Number.isFinite(r) && Math.abs(r - yHint) < 8 ? r : yHint;
  }
  rayAt(x, z, y0 = 0) {
    const ph = this.game?.physics;
    const hit = ph?.raycast?.(_r.set(x, y0 + 4, z), _down, 12, undefined, undefined, (c) => (!c.parent?.() || c.parent().isFixed?.()) && ph.entityOf?.(c)?.type !== 'creature');
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
    if (onGround && !T.slot) { T.slot = this.pool.find((p) => !p.busy) || null; if (T.slot) { T.slot.busy = T; T.slot.drape.reset(); } } // (the grid is laid anew only for a mark new to its slot: a caller may show() every frame)
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
    this.glyphs.begin();
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
      if (T.slot && shapes?.prims.length) drawFigmentTelegraphGround(T.slot, T, shapes, F, prog, alpha, this, origin.y);
      else if (T.slot) T.slot.mesh.visible = false;
      drawFigmentTelegraphGlyphs(this.glyphs, T, shapes, F, origin, prog, alpha, this);
    }
    this.glyphs.end(this.t, camera);
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
  /** The Courier's draught colour (game.draughtHex: its strongest feeling's), else wonder's. */
  draughtHex() { return this.game?.draughtHex ?? COLOR.wonder; }

  // ------------------------------------------------------------------ the boot's warm-up (the casebook's rules 17, 18)
  /** Show one mark and one glyph for the compile, 50 m under the world; returns what parks them again. */
  prewarm() {
    const P = this.pool[0], G = this.glyphs;
    P.drape.lay({ x0: -2, z0: -2, x1: 2, z1: 2 }, () => -50);
    P.mat.uniforms.uPrimN.value = 1; P.mat.uniforms.uPrimA.value[0].set(0, 0, 0, 0); P.mat.uniforms.uPrimB.value[0].set(1.5, 0);
    P.mesh.visible = true;
    G.begin(); G.add('answer.out', new THREE.Vector3(0, -50, 0), 1, 1, GLYPH_TINT.answer); G.end(this.t, null);
    return () => { P.mesh.visible = false; P.drape.reset(); G.begin(); G.end(this.t, null); };
  }

  dispose() {
    this.clear(); this.group.parent?.remove(this.group);
    for (const p of this.pool) { p.drape.dispose(); p.mat.dispose(); }
    this.glyphs.dispose();
  }
}
