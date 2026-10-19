// ---------------------------------------------------------------------------------------
// THE CASTER SHELLS' LOOKS, THEIR SMALL TOOLS: what the look table (vfx/shelllooks.js) and its family files beside this one
// (vfx/shelllooks/<family>.js) share: a look held on a creature until it falls, a look held at a place, a creature's middle and its
// body as one mesh, where the aim meets the world, and the layer helper of the library's data. No words or numbers drawn.
//
// Prior art: the small "task" verbs every ability shares in Unreal's GAS, as the shell runner's own kit (tools/psygun/shellkit.js).
//
//   L(layer)   DUR(row)   centre(c, out)   bodyMesh(c)   onCreature(g, name, c, t, ctx, over, until)   atPlace(g, name, pos, t, ctx)
//   aimAt(g, ray, range)   toGround(g, pos, reach)   leaveGhost(g, opts) (the Courier's afterimage, vfx/afterimage.js, ticked here)
//   the ludicrous layers (the owner, 2026-10-13: "borderline ludicrous"; Ratchet & Clank's rule, the weapon too big for the screen):
//   groundRing(o) a shockwave's front out along the ground   scorch(o) the ground burnt under a blow   debris(o) chips that land and lie
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Afterimages } from '../afterimage.js';

/** A layer of an effect (only for readability, as library.js's). */
export const L = (o) => o;

// ---- the ludicrous layers: three pieces every big blow of the ten shares (docs/plans/CASTER-SHELLS.md, before section 6). Each is a
// layer on the programs already warm: the decal (vfx.js, its two drawn pictures) and the sprites' alpha pool; never a mesh a chip.
/** A shockwave's front running out flat along the ground, `from` to `to` m across over `dur` real s. Two layers (an effect's layers are
 *  flattened: vfx.js): a dark band just inside the front, the scorch's darken (the decal's one program, another blend state), so the
 *  ring reads on the Dunes' white sand where added light alone is lost; and the added front over it, for dark ground. */
export const groundRing = ({ to = 10, from = 0.5, dur = 0.7, tint = 'tint', at = 0, k = 1.6, y = 0.06 } = {}) => [
  L({ type: 'decal', tex: 'shockring', blend: 'darken', order: 3, at, dur, scale: [[0, from * 0.92], [1, to * 0.92]], k: [[0, 1], [0.5, 0.75], [1, 0]], tint: 0x9a968e, glow: 0.85, offset: [0, y - 0.005, 0] }),
  L({ type: 'decal', tex: 'shockring', at, dur, scale: [[0, from], [1, to]], k: [[0, k], [0.5, k * 0.55], [1, 0]], tint, glow: 1.4, offset: [0, y, 0] }),
];
/** The ground burnt under a blow, `size` m across: it lies `dur` real s, then fades (darkening what is there: no light of its own). */
export const scorch = ({ size = 3, dur = 6, at = 0, tint = 0xd0d8e0, y = 0.04 } = {}) =>
  L({ type: 'decal', tex: 'scorch', blend: 'darken', at, dur, scale: [[0, size * 0.55], [0.05, size], [1, size]], k: [[0, 0], [0.03, 1], [0.7, 1], [1, 0]], tint, glow: 0.9, offset: [0, y, 0] });
/** Debris thrown up that lands and lies, whole for two thirds of its life, then fading (its alpha over 1: sprites.js holds it). */
export const debris = ({ count = 20, speed = [4, 9], cone = 65, size = [0.1, 0.2], life = [4, 6], color = [0xb4603f, 0x8c4a33, 0xc46a45], shape = 'chip', at = 0, spawn, r, gravity = 14, pool = 'alpha' } = {}) =>
  L({ type: 'sprites', pool: pool === 'add' ? undefined : 'alpha', at, count, shape, spawn, r, dir: 'cone', axis: 'up', cone, speed, size, life, gravity, drag: 0.5, color, alpha: 3, alphaEnd: 0, floor: 'ground', powerCount: false });
/** How long a held look stays: the shell's `dur`, or 3 real seconds. */
export const DUR = (row) => row.n.dur ?? 3;

const _v = new THREE.Vector3();
/** A creature's middle. */
export const centre = (c, out) => out.set(c.pos.x, c.pos.y + (c.height || 1) * 0.5, c.pos.z);
/** A creature's body as one mesh, for a look worn on it (S4's craze): its own `body`, or the first mesh under it. */
export function bodyMesh(c) {
  if (c?.body?.isMesh) return c.body;
  let hit = null;
  (c?.root || c?.group || c?.mesh)?.traverse?.((o) => { if (!hit && o.isMesh) hit = o; });
  return hit;
}
/** Play `name` held on a creature (at its middle, or over its head) until it falls, `until(c)` says so, or `t` real seconds pass. */
export function onCreature(g, name, c, t, ctx = {}, over = false, until = null) {
  return g.vfx.play(name, { ...ctx, pos: centre(c, _v), follow: (h) => {
    if (!c.alive || h.t > t || until?.(c, h)) return false;
    centre(c, h.pos); if (over) h.pos.y = c.pos.y + (c.height || 1) + 0.4;
    return true;
  } });
}
/** Play `name` at a place, let go after `t` real seconds (Infinity: it ends on its own). */
export const atPlace = (g, name, pos, t, ctx = {}) => g.vfx.play(name, { ...ctx, pos, follow: (h) => h.t <= t });
/** Where the aim meets the world (or `range` m along it), the face's normal, and whether it met anything (`hit`). */
export function aimAt(g, ray, range = 60) {
  const hit = ray && g.physics?.raycast?.(ray.origin, ray.dir, range, g.player?.collider, undefined, (k) => !k.isSensor());
  if (hit) return { at: hit.point.clone(), normal: hit.normal.clone(), hit: true };
  return { at: ray ? ray.origin.clone().addScaledVector(ray.dir, range * 0.5) : new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0), hit: false };
}
const DOWN = new THREE.Vector3(0, -1, 0);
/** The ground under `pos` within `reach` m (static things only: not a creature's body), moved there in place; `pos` as it was if none. A
 *  round spent on a creature's middle lays its ground ring and scorch on the ground under it, not in the air. */
export function toGround(g, pos, reach = 4) {
  const ph = g.physics, hit = ph?.raycast?.(pos, DOWN, reach, g.player?.collider, undefined, (k) => !k.isSensor() && !k.parent()?.isDynamic() && !ph.entityOf(k)?.type);
  if (hit) pos.copy(hit.point);
  return pos;
}

// the shells' own afterimages (Swap's silhouette left behind, Echo's ghost): one set, ticked by a held effect while any is showing
let GHOSTS = null, tick = null;
/** Leave the Courier's pose on show behind them (Blink Dash's afterimage, vfx/afterimage.js), fading over `life` real seconds. */
export function leaveGhost(g, { ph = 0.6, life = 0.9, opacity = 0.4, drift = null } = {}) {
  GHOSTS ||= new Afterimages(g, { opacity, life });
  const ok = GHOSTS.leave({ ph, life, opacity, drift });
  if (ok && (!tick || tick.stopped || !tick.alive)) tick = g.vfx.play('shell.ghost', { follow: (h, raw) => { GHOSTS.update(raw); return GHOSTS.list.length > 0; } });
  return ok;
}
