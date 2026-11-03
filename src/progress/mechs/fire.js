// ---------------------------------------------------------------------------------------
// FIRE IN THE TOY CITY (docs/plans/MECHS.md 12; South, 2026-11-02: "improve the environmental destruction element of the mecha module. I
// notice we have a veritable lack of fire as a mechanic"; Calissa's proposal, cut here). Fire lives on the toy city's own cells
// (destruction.js: 1 m cells of a material), stepped as a cellular automaton a few times a real second: a burning cell spends its fuel and
// lights its neighbours by chance (up most, sideways less, down least: fire climbs), and when its fuel is gone it burns AWAY, its cell
// emptied, so the collapse that a fist runs runs here too: floors burn through, and a burning building comes down under its own weight.
// What does not burn answers the heat by its kind: glass cracks and bursts, steel heated through goes soft (half its span: SOFT), brick
// and stone scorch (a look). Water puts it out and leaves the cell wet a while; a Ground Pound smothers it. Bodies feel it: the mech's
// heat (its battery drained, its legs cracked at full heat), the straw giant alight (its barrier held down, its stagger climbing), and the
// dune colossus, which does not burn but is fired to glass by it (vitrified) (brittle, and unable to burrow while it is).
//
// Pure and seeded: the runtime (world/hangar/cityfire.js) owns when it steps, what lights it and what it emits.
//
// Prior art: Far Cry 2 (fire that spreads by material and wind and is a weapon you start), Breath of the Wild (fire climbs grass, updrafts,
// what is made of wood burns), Noita and the falling-sand games (fire as a cell rule on the same grid as everything else), Minecraft's fire
// tick (a burning block lights flammable neighbours by chance and burns away), Red Faction Guerrilla (a weakened structure falls under its
// own weight), Battlefield's levolution, SimCity's fires (a city that burns building to building), the water tower as a fire bucket.
//
//   BURN[mat] = { burn (0..1 a chance's weight), fuel (real s), away (burns away at its end) }   STATE   FIRE   BURNT   HEAT   GIANT_FIRE
//   newFire(b) -> b.fire { state, fuel, heat, t, by }   burnable(b, i)   ignite(b, i, by) -> bool   igniteRay(b, from, dir, chance, rnd, by) -> n
//   igniteNear(b, at, r, chance, rnd, by) -> n   stepFire(b, dt, rnd, { quench }) -> { burning, away: [i], glass: [i], scorched, soft, out }
//   douse(b, at, r) -> n   burningOf(b) -> n   heatStep(k, inFire, dt) -> k   (all positions in the building's own cells)
// ---------------------------------------------------------------------------------------
import { MAT, SOFT } from './destruction.js';

/** What burns: `burn` weights a neighbour's chance to catch, `fuel` how long a cell burns (real s), `away` whether it is gone after (a
 *  timber floor burns through; nothing here is left as a charred cell standing, so the collapse does the rest). Sized so a timber house
 *  is alight end to end in about half a real minute and down in about a minute and a half: one fight's length, never a stage's. */
export const BURN = {
  [MAT.timber]: { burn: 0.8, fuel: 20, away: true },
  [MAT.paper]: { burn: 1, fuel: 5, away: true },        // a stall's paper is gone in a breath
  [MAT.furnishing]: { burn: 0.9, fuel: 12, away: true }, // the rooms burn inside a brick house's shell
};
/** A cell's fire state (b.fire.state): none; burning; scorched (brick or stone that sat beside fire: a look only); soft (steel heated
 *  through: destruction.js SOFT, half its span and hits); wet (doused: it cannot catch for FIRE.wet real s). */
export const STATE = { none: 0, burning: 1, scorched: 2, soft: SOFT, wet: 4 };

/** The automaton's numbers, each with its reason.
 *  hz: steps a real second (Calissa's 4: a burning building is a few hundred cells, so a step is cheap, and fire reads as creeping).
 *  spread: a neighbour's chance a real second to catch, times its `burn`: sideways 0.35 (a room alight in about 3 s), up x2.5 (a floor
 *    above in about 1 s: fire climbs), down x0.3 (it falls only when the floor gives).
 *  scorch: real s beside fire before brick or stone is scorched, its hits halved (`scorchHp`: a burned-out shell crumbles at a fist, so
 *    fire is how a brick house is opened: burn it, then knock it down); soften: before steel goes soft (a frame that has sat in a fire 15 s sags);
 *  glass: hits a real second beside fire (glass has 0.15: it bursts in about 2 s, the shower before the flames come through).
 *  wet: real s a doused cell cannot catch (long enough to finish a fire off, short enough that it can burn again).
 *  douse: how far a water tower's burst puts fire out (m: its tank, 12 m of spray) and the Ground Pound's smother (5 m, its own reach). */
export const FIRE = {
  hz: 4,
  spread: { side: 0.35, up: 0.875, down: 0.105 },
  scorch: 5, scorchHp: 0.5, soften: 15, glass: 0.08, wet: 30,
  douse: { water: 12, pound: 5 },
  light: { shot: 0.35, beam: 0.8, flame: 2.0, chunk: 1, giant: 0.3 }, // (a chance's weight on a burnable cell: a shot once, the beam along its ray, the flamer a real second, a burning chunk on landing, a burning giant a real second against a building)
};

/** The mech in fire: its heat k (0..1) rises `rise` a real second while a burning cell is within `near` m of its footprint and falls
 *  `fall` out of it; it drains `drainKW` x k from the battery (the clay battery's 48 MJ: a real minute at full heat costs half of it), and
 *  at full heat cracks its legs `crack.k` every `crack.every` real s (stand in it and it hurts; walk through it and it does not). */
/** Burnt down (South's adobe city, 2026-11-03: earth does not burn, so no adobe building burns to the ground; its vigas, awnings and goods
 *  do): a building whose fire burned away `share` of the cells it was built with counts as burned down when anything fells it within
 *  `within` real s of the last cell its fire took (fire's work finished by a fist: the scorched shell is at half its hits, FIRE.scorchHp).
 *  0.15: the market stall's, the granary's and the casa's fires take 20 to 45% (scripts/mechs.mjs), the mud-and-cedar ones under 5%;
 *  a real minute: the fire seen and the blow its answer, not a building that burned last night. */
export const BURNT = { share: 0.15, within: 60 };
export const HEAT = { rise: 0.5, fall: 0.25, near: 3, drainKW: 400, crack: { region: 'legs', k: 0.15, every: 2 } };

/** The giants and fire. The straw giant burns: lit by the flamer (FIRE.light.flame a real second), a charged beam, or a burning building
 *  beside it (FIRE.light.giant a real second within `touch` m); alight `fuel` real s, its barrier held down, its stagger gauge rising
 *  `stagger` a real second, its body taking `k` of a full blow a real second (30 s: about 1.2 blows, and a staggered giant to throw: fire
 *  is a setup, not a kill); a water tower puts it out. The dune colossus does not burn: flame fires its sand to glass at `rate` a real second, and
 *  at 1 it is glass for `hold` real s, taking blows x`blowK` and unable to burrow (glass does not sink): the answer to its burrow. */
export const GIANT_FIRE = {
  straw: { burns: true, fuel: 30, k: 0.04, stagger: 6, touch: 3 },
  colossus: { burns: false, vitrify: { rate: 0.25, hold: 12, blowK: 1.5, fed: 0.5, ebb: 0.5 } }, // (fed: real s the glaze holds after the flame leaves it, the flame arriving every fire step; ebb: then it fades at half the rate it builds)
};

/** A building's fire, alongside its cells (the same index as b.mat). `t` the scorch and soften clocks; `by` who started it. */
export function newFire(b) {
  const n = b.mat.length;
  b.fire = { state: new Uint8Array(n), fuel: new Float32Array(n), t: new Float32Array(n), by: null, lit: 0 };
  return b.fire;
}
const F = (b) => b.fire || newFire(b);
export const burnable = (b, i) => !!BURN[b.mat[i]] && F(b).state[i] !== STATE.burning && F(b).state[i] !== STATE.wet;

/** Light one cell. True when it caught. */
export function ignite(b, i, by = 'courier') {
  if (!burnable(b, i)) return false;
  const f = F(b); f.state[i] = STATE.burning; f.fuel[i] = BURN[b.mat[i]].fuel; f.t[i] = 0; if (!f.lit) f.by = by; f.lit++;
  return true;
}
const idx = (b, x, y, z) => x + b.w * (z + b.d * y);
const inside = (b, x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < b.w && y < b.h && z < b.d;

/** Each burnable cell within `r` cells of `at` catches with `chance` x its burn (a shot's splash, a burning chunk's landing). */
export function igniteNear(b, at, r, chance, rnd, by) {
  let n = 0; const R = Math.ceil(r);
  for (let y = Math.max(0, Math.floor(at[1]) - R); y <= Math.min(b.h - 1, Math.floor(at[1]) + R); y++)
    for (let z = Math.max(0, Math.floor(at[2]) - R); z <= Math.min(b.d - 1, Math.floor(at[2]) + R); z++)
      for (let x = Math.max(0, Math.floor(at[0]) - R); x <= Math.min(b.w - 1, Math.floor(at[0]) + R); x++) {
        const i = idx(b, x, y, z); if (!BURN[b.mat[i]] || Math.hypot(x - at[0], y - at[1], z - at[2]) > r) continue;
        if (rnd() < chance * BURN[b.mat[i]].burn && ignite(b, i, by)) n++;
      }
  return n;
}

/** Along a ray (the charged beam, a flamer's tongue): each burnable cell it passes within 1 cell catches with `chance` x its burn. */
export function igniteRay(b, from, dir, chance, rnd, by, len = 200) {
  let n = 0; const L = Math.hypot(dir[0], dir[1], dir[2]) || 1, d = dir.map((v) => v / L);
  for (let s = 0; s <= len; s += 0.5) {
    const x = Math.round(from[0] + d[0] * s), y = Math.round(from[1] + d[1] * s), z = Math.round(from[2] + d[2] * s);
    if (!inside(b, x, y, z)) { if (s > Math.max(b.w, b.h, b.d) * 2) break; continue; }
    const i = idx(b, x, y, z); if (BURN[b.mat[i]] && rnd() < chance * BURN[b.mat[i]].burn && ignite(b, i, by)) n++;
  }
  return n;
}

/** Where a burning cell reaches: its six faces, and through open air the flame above it (up to `FIRE.reach.up` cells, fainter each) and
 *  beside it (`FIRE.reach.side`): fire crosses a room to the furniture and climbs to the floor over it, but never through a wall. Each
 *  [dx, dy, dz, way, weight, the cells between that must be air]. */
const NB = [];
for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 2; k++) NB.push([dx * k, 0, dz * k, 'side', k === 1 ? 1 : 0.4, Array.from({ length: k - 1 }, (_, m) => [dx * (m + 1), 0, dz * (m + 1)])]);
for (let k = 1; k <= 3; k++) NB.push([0, k, 0, 'up', [1, 0.6, 0.35][k - 1], Array.from({ length: k - 1 }, (_, m) => [0, m + 1, 0])]);
NB.push([0, -1, 0, 'down', 1, []]);

/** One step of `dt` real s. `quench` (0..1) slows the spread and burns fuel off as rain does (Grief's, the runtime's to give: 0 in the
 *  yard). Returns what changed: the cells still burning, those burned away (emptied: the runtime runs the collapse and re-meshes), the
 *  glass that burst, how many scorched or went soft, and `out` when the building's fire has gone out. */
export function stepFire(b, dt, rnd, { quench = 0 } = {}) {
  const f = F(b), away = [], glass = [], lit = []; let burning = 0, scorched = 0, soft = 0;
  const spreadK = 1 - 0.8 * quench;
  for (let i = 0; i < b.mat.length; i++) {
    if (f.state[i] === STATE.wet) { f.t[i] -= dt; if (f.t[i] <= 0) { f.state[i] = STATE.none; f.t[i] = 0; } continue; }
    if (f.state[i] !== STATE.burning) continue;
    if (!b.mat[i]) { f.state[i] = STATE.none; continue; } // (carved out from under it)
    burning++;
    f.fuel[i] -= dt * (1 + quench);
    const x = i % b.w, r = (i - x) / b.w, z = r % b.d, y = (r - z) / b.d;
    for (const [dx, dy, dz, way, w, between] of NB) {
      if (!inside(b, x + dx, y + dy, z + dz)) continue;
      const j = idx(b, x + dx, y + dy, z + dz), m = b.mat[j]; if (!m) continue;
      if (between.length && between.some(([ax, ay, az]) => b.mat[idx(b, x + ax, y + ay, z + az)])) continue; // (only through open air)
      if (BURN[m]) { if (f.state[j] !== STATE.burning && f.state[j] !== STATE.wet && rnd() < FIRE.spread[way] * w * BURN[m].burn * dt * spreadK) lit.push(j); continue; }
      if (between.length) continue; // (heat on what does not burn: only what touches the flame)
      if (m === MAT.glass) { b.hp[j] -= FIRE.glass * dt; if (b.hp[j] <= 0) { b.mat[j] = 0; b.hp[j] = 0; glass.push(j); } continue; }
      if (m === MAT.steel && f.state[j] !== SOFT) { f.t[j] += dt; if (f.t[j] >= FIRE.soften) { f.state[j] = SOFT; b.hp[j] *= 0.5; soft++; } continue; }
      if ((m === MAT.brick || m === MAT.stone || m === MAT.adobe) && f.state[j] === STATE.none) { f.t[j] += dt; if (f.t[j] >= FIRE.scorch) { f.state[j] = STATE.scorched; b.hp[j] *= FIRE.scorchHp; scorched++; } }
    }
    if (f.fuel[i] <= 0) { f.state[i] = STATE.none; f.fuel[i] = 0; if (BURN[b.mat[i]]?.away) { b.mat[i] = 0; b.hp[i] = 0; away.push(i); } }
  }
  for (const j of lit) ignite(b, j, f.by || 'courier');
  const now = burning - away.length + lit.length;
  return { burning: Math.max(0, now), away, glass, scorched, soft, out: burning > 0 && now <= 0 };
}

/** Water or a smother: every burning cell within `r` cells of `at` goes out and is wet for FIRE.wet real s. Returns how many. */
export function douse(b, at, r) {
  const f = b.fire; if (!f) return 0; let n = 0;
  for (let i = 0; i < b.mat.length; i++) {
    if (f.state[i] !== STATE.burning) continue;
    const x = i % b.w, q = (i - x) / b.w, z = q % b.d, y = (q - z) / b.d;
    if (Math.hypot(x - at[0], y - at[1], z - at[2]) > r) continue;
    f.state[i] = STATE.wet; f.t[i] = FIRE.wet; n++;
  }
  return n;
}

/** How many of a building's cells are burning. */
export const burningOf = (b) => { const f = b.fire; if (!f) return 0; let n = 0; for (let i = 0; i < f.state.length; i++) if (f.state[i] === STATE.burning) n++; return n; };

/** The mech's heat after `dt` real s, in fire or out of it. */
export const heatStep = (k, inFire, dt) => Math.max(0, Math.min(1, k + (inFire ? HEAT.rise : -HEAT.fall) * dt));
