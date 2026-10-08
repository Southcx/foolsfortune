// ---------------------------------------------------------------------------------------
// MATERIALS AND THE SPIRIT PRESS: what fights, Wells and gardens give for Soul Alchemy, and how pressing them moves the Courier's colour
// (docs/ECONOMY.md, "The livelihoods"; docs/plans/SYSTEMS.md, D1 and D2). A material is one of a few broad KINDS, so nobody hunts a single
// item by name (the owner: no minutiae), but within its kind each material carries a HUE, a SATURATION and a PATH: a short winding route
// across the colour wheel that pressing it walks the Courier's colour along. Soul Alchemy is navigation, choosing and ordering materials
// to reach a colour, not a straight hue shift. Data and pure functions; the press itself is Petra's and Calissa's (SYSTEMS.md, D2).
//
// The kinds are the owner's design document v0.1's material categories (section 5.3), each with the stretch of the wheel it lives in.
// A material's path is drawn from its kind's shape and its own seed, so two of a kind wind alike but not the same.
//
// Prior art: Newton's Opticks (a mixture is the centre of gravity of its parts: complements mix to grey), Potion Craft (ingredients as paths on a map, the potion a point you steer), the v0.1 document (kinds, trade-offs, hidden
// combinations kept in a "Grimoire of Echoes"), and the colour wheel of every painter's colour theory (hue as an angle, saturation as the
// distance from the grey centre).
//
//   KINDS[id] = { id, name, hue: [from, to], shape }      makeMaterial(kind, seed, tier) -> { kind, tier, hue, sat, path }
//   press(colour, materials, { extra }) -> { colour, trail }   pullStep(c, to, share, wind)   colour = { h: 0..360, s: 0..1 }   distance(a, b) -> 0..1
// ---------------------------------------------------------------------------------------
import { ECON } from './table.js';

/** The kinds, after v0.1: where on the wheel each lives (hue, degrees) and the shape of the paths it walks. */
export const KINDS = {
  eldritch:   { id: 'eldritch',   name: 'eldritch artefacts', hue: [250, 300], shape: 'spiral' },  // idols, shards of defiance
  arcane:     { id: 'arcane',     name: 'arcane relics',      hue: [190, 240], shape: 'zigzag' },  // rune-etched cogs, lenses
  finery:     { id: 'finery',     name: 'finery',             hue: [310, 360], shape: 'arc' },     // charms, pigments
  mechanism:  { id: 'mechanism',  name: 'mechanisms',         hue: [30, 60],   shape: 'zigzag' },  // gyroscopes, synaptic webs
  edge:       { id: 'edge',       name: 'edges and tools',    hue: [0, 30],    shape: 'line' },    // claws, balanced gears
  art:        { id: 'art',        name: 'art',                hue: [60, 120],  shape: 'arc' },     // origami cranes, sand mandalas
  provision:  { id: 'provision',  name: 'provisions',         hue: [120, 180], shape: 'spiral' },  // heartfruit, essences of stillness
};
export const KIND_IDS = Object.keys(KINDS);

/** A small seeded generator (mulberry32), so a material made from a seed is always the same. */
function seeded(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** A material of `kind` from `seed`, at `tier` (0 common .. 4 the rarest). It carries its own colour (`hue`, `sat`: what it is) and a
 *  `path`: three to five steps, each `[share, wind]`. Pressing it walks the soul colour `share` of the way toward the material's own
 *  colour at each step (the painter's rule: a mixture lies between its parts, Newton's centre of gravity), bent sideways by `wind` of
 *  that step's length (its kind's shape: a spiral swings both ways, a zigzag alternates, an arc leans one way, a line runs straight).
 *  A rarer material pulls further. So a lump's colour says where it goes, and a complement greys by itself: the straight way to the
 *  opposite colour runs through the grey centre (Calissa's ruling 1, 2026-10-08; the 30-degree complement window is gone). */
export function makeMaterial(kind, seed = 1, tier = 0) {
  const K = KINDS[kind] || KINDS.edge, r = seeded(seed * 7919 + tier * 104729 + kind.length), P = ECON.alchemy.pull;
  const hue = K.hue[0] + r() * (K.hue[1] - K.hue[0]), sat = P.sat[0] + r() * (P.sat[1] - P.sat[0]);
  const steps = 3 + Math.floor(r() * 3), total = Math.min(0.9, P.share[0] + tier * P.share[1]), dir = r() < 0.5 ? -1 : 1, path = [];
  const each = 1 - Math.pow(1 - total, 1 / steps); // (each step's share, so the steps together pull `total` of the way)
  for (let i = 0; i < steps; i++) {
    const w = K.shape === 'spiral' ? (i % 2 ? 1 : -1) * (0.6 + 0.4 * r()) : K.shape === 'zigzag' ? (i % 2 ? 1 : -1) : K.shape === 'arc' ? dir * 0.7 : 0;
    path.push([+each.toFixed(4), +(w * P.wind).toFixed(3)]);
  }
  return { kind, tier, hue: +hue.toFixed(1), sat: +sat.toFixed(2), path };
}

const wrap = (h) => ((h % 360) + 360) % 360, clamp01 = (v) => Math.max(0, Math.min(1, v));
const toXY = (c) => [c.s * Math.cos(c.h * Math.PI / 180), c.s * Math.sin(c.h * Math.PI / 180)];
const fromXY = (x, y, h0) => { const s = Math.hypot(x, y); return { h: s < 1e-6 ? h0 : wrap(Math.atan2(y, x) * 180 / Math.PI), s: clamp01(s) }; };

/** One step of a pull: `share` of the way from colour `c` toward colour `to`, bent `wind` of the step's length to its left. */
export function pullStep(c, to, share, wind = 0) {
  const [ax, ay] = toXY(c), [bx, by] = toXY(to), dx = (bx - ax) * share, dy = (by - ay) * share;
  return fromXY(ax + dx - dy * wind, ay + dy + dx * wind, c.h);
}

/** Press materials in order: the colour walks each one's path in turn (`extra` more steps of each one's own pull: a spirit at work).
 *  Returns where it ends and every point it passed. The one walk: the press and its preview both use it, so the preview is the press. */
export function press(colour, materials, { extra = 0 } = {}) {
  let c = { h: colour.h, s: colour.s };
  const trail = [{ ...c }];
  for (const m of materials) {
    const to = { h: m.hue, s: m.sat }, steps = [...m.path];
    for (let i = 0; i < extra && m.path.length; i++) steps.push([m.path[0][0], 0]);
    for (const [share, wind] of steps) { c = pullStep(c, to, share, wind); trail.push({ ...c }); }
  }
  return { colour: c, trail };
}

/** How far apart two colours are on the wheel (0 the same .. 1 opposite and at the edge). */
export function distance(a, b) {
  const ax = a.s * Math.cos(a.h * Math.PI / 180), ay = a.s * Math.sin(a.h * Math.PI / 180);
  const bx = b.s * Math.cos(b.h * Math.PI / 180), by = b.s * Math.sin(b.h * Math.PI / 180);
  return Math.min(1, Math.hypot(ax - bx, ay - by) / 2);
}
