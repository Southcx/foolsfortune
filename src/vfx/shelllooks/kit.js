// ---------------------------------------------------------------------------------------
// THE CASTER SHELLS' LOOKS, THEIR SMALL TOOLS: what the look table (vfx/shelllooks.js) and its family files beside this one
// (vfx/shelllooks/<family>.js) share: a look held on a creature until it falls, a look held at a place, a creature's middle and its
// body as one mesh, where the aim meets the world, and the layer helper of the library's data. No words or numbers drawn.
//
// Prior art: the small "task" verbs every ability shares in Unreal's GAS, as the shell runner's own kit (tools/psygun/shellkit.js).
//
//   L(layer)   DUR(row)   centre(c, out)   bodyMesh(c)   onCreature(g, name, c, t, ctx, over, until)   atPlace(g, name, pos, t, ctx)
//   aimAt(g, ray, range)   courierAt(g, out)   leaveGhost(g, opts) (the Courier's afterimage, vfx/afterimage.js, ticked here)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Afterimages } from '../afterimage.js';

/** A layer of an effect (only for readability, as library.js's). */
export const L = (o) => o;
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
/** Where the aim meets the world (or `range` m along it), and the face's normal. */
export function aimAt(g, ray, range = 60) {
  const hit = ray && g.physics?.raycast?.(ray.origin, ray.dir, range, g.player?.collider, undefined, (k) => !k.isSensor());
  if (hit) return { at: hit.point.clone(), normal: hit.normal.clone() };
  return { at: ray ? ray.origin.clone().addScaledVector(ray.dir, range * 0.5) : new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0) };
}
/** The Courier's feet, or the origin. */
export const courierAt = (g, out = new THREE.Vector3()) => (g.player ? out.copy(g.player.pos) : out.set(0, 0, 0));

// the shells' own afterimages (Swap's silhouette left behind, Echo's ghost): one set, ticked by a held effect while any is showing
let GHOSTS = null, tick = null;
/** Leave the Courier's pose on show behind them (Blink Dash's afterimage, vfx/afterimage.js), fading over `life` real seconds. */
export function leaveGhost(g, { ph = 0.6, life = 0.9, opacity = 0.4, drift = null } = {}) {
  GHOSTS ||= new Afterimages(g, { opacity, life });
  const ok = GHOSTS.leave({ ph, life, opacity, drift });
  if (ok && (!tick || tick.stopped || !tick.alive)) tick = g.vfx.play('shell.ghost', { follow: (h, raw) => { GHOSTS.update(raw); return GHOSTS.list.length > 0; } });
  return ok;
}
