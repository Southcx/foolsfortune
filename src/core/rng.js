// ---------------------------------------------------------------------------------------
// SEEDED RANDOM: the same seed gives the same sequence on every machine, so a Well laid out from wellSeed(well, day) is the same Well
// for everyone that day, and a Cogitomap that carries the seed leads back to it. mulberry32 (Tommy Ettinger's, public domain): one
// 32-bit state, fast, and good enough for level layout (it is what progress/econ/odds.js uses for its simulations).
//
//   const r = seeded(seed)   r() -> 0..1   r.int(n) -> 0..n-1   r.pick(list)   r.chance(p) -> bool   r.range(a, b)
//
// THE SIMULATION'S STREAMS (docs/plans/COOP.md, C1): what the simulation decides by chance (a creature's mind, a drop, a crack) draws
// from a named stream, never Math.random, so the same session seed plays the same twice (a stress run found once is found again; a
// replay replays; co-op peers agree). One stream per module (`stream('creatures/jelly')`), so one system drawing more does not shift
// another's. Cosmetic chance (particles, sound, the title) stays free: it decides nothing.
//
//   const R = stream(name)   R() R.int R.pick R.chance R.range   (module level is fine: reseeding resets it in place)
//   reseed(seed)   (main.js at boot, the stress test per run)   sessionSeed() -> the seed now in force
// ---------------------------------------------------------------------------------------
export function seeded(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (list) => list[Math.floor(r() * list.length)];
  r.chance = (p) => r() < p;
  r.range = (lo, hi) => lo + r() * (hi - lo);
  return r;
}

/** A string's hash (FNV-1a), so a stream's seed is fixed by its name and the session's seed. */
const hashName = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

let SEED = 1;
const STREAMS = new Map(); // name -> { state }

/** The simulation's stream of this name: a generator whose state reseed() resets in place (so a module may hold it from load). */
export function stream(name) {
  let S = STREAMS.get(name);
  if (S) return S.r;
  S = { a: (SEED ^ hashName(name)) >>> 0 };
  const r = () => { S.a = (S.a + 0x6d2b79f5) | 0; let t = Math.imul(S.a ^ (S.a >>> 15), 1 | S.a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (list) => list[Math.floor(r() * list.length)];
  r.chance = (p) => r() < p;
  r.range = (lo, hi) => lo + r() * (hi - lo);
  S.r = r; S.name = name;
  STREAMS.set(name, S);
  return r;
}
/** Every stream back to the start of the sequence this seed gives. */
export function reseed(seed) {
  SEED = seed >>> 0;
  for (const S of STREAMS.values()) S.a = (SEED ^ hashName(S.name)) >>> 0;
}
export const sessionSeed = () => SEED;
/** A direction on the unit sphere from a stream, into `v` (three's randomDirection() draws on Math.random: never in the simulation). */
export function randDir(r, v) { const u = r() * 2 - 1, t = r() * Math.PI * 2, f = Math.sqrt(1 - u * u); return v.set(f * Math.cos(t), u, f * Math.sin(t)); }
