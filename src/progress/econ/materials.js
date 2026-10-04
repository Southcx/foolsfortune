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
// Prior art: Potion Craft (ingredients as paths on a map, the potion a point you steer), the v0.1 document (kinds, trade-offs, hidden
// combinations kept in a "Grimoire of Echoes"), and the colour wheel of every painter's colour theory (hue as an angle, saturation as the
// distance from the grey centre).
//
//   KINDS[id] = { id, name, hue: [from, to], shape }      makeMaterial(kind, seed, tier) -> { kind, tier, hue, sat, path }
//   press(colour, materials) -> { colour, trail }          colour = { h: 0..360, s: 0..1 }   distance(a, b) -> 0..1
// ---------------------------------------------------------------------------------------

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

/** A material of `kind` from `seed`, at `tier` (0 common .. 4 the rarest: a rarer material walks further). Its path is a list of steps
 *  [dHue (degrees), dSat], three to five of them, shaped by its kind. */
export function makeMaterial(kind, seed = 1, tier = 0) {
  const K = KINDS[kind] || KINDS.edge, r = seeded(seed * 7919 + tier * 104729 + kind.length);
  const hue = K.hue[0] + r() * (K.hue[1] - K.hue[0]), sat = 0.35 + r() * 0.5;
  const reach = 18 + tier * 12, steps = 3 + Math.floor(r() * 3), path = [];
  for (let i = 0; i < steps; i++) {
    const turn = K.shape === 'spiral' ? (i % 2 ? 1 : -1) * (0.6 + 0.4 * r()) : K.shape === 'zigzag' ? (i % 2 ? 1 : -1) : K.shape === 'arc' ? 0.7 : 0;
    path.push([+(reach * (0.6 + 0.4 * r()) / steps * (1 + turn)).toFixed(1), +((r() - 0.5 + turn * 0.25) * 0.3 / steps * (1 + tier * 0.3)).toFixed(3)]);
  }
  return { kind, tier, hue: +hue.toFixed(1), sat: +sat.toFixed(2), path };
}

const wrap = (h) => ((h % 360) + 360) % 360, clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Press materials in order: the colour walks each one's path in turn. Returns where it ends and every point it passed. */
export function press(colour, materials) {
  let { h, s } = colour;
  const trail = [{ h, s }];
  for (const m of materials) for (const [dh, ds] of m.path) { h = wrap(h + dh); s = clamp01(s + ds); trail.push({ h, s }); }
  return { colour: { h, s }, trail };
}

/** How far apart two colours are on the wheel (0 the same .. 1 opposite and at the edge). */
export function distance(a, b) {
  const ax = a.s * Math.cos(a.h * Math.PI / 180), ay = a.s * Math.sin(a.h * Math.PI / 180);
  const bx = b.s * Math.cos(b.h * Math.PI / 180), by = b.s * Math.sin(b.h * Math.PI / 180);
  return Math.min(1, Math.hypot(ax - bx, ay - by) / 2);
}
