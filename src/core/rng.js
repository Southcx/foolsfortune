// ---------------------------------------------------------------------------------------
// SEEDED RANDOM: the same seed gives the same sequence on every machine, so a Well laid out from wellSeed(well, day) is the same Well
// for everyone that day, and a Cogitomap that carries the seed leads back to it. mulberry32 (Tommy Ettinger's, public domain): one
// 32-bit state, fast, and good enough for level layout (it is what progress/econ/odds.js uses for its simulations).
//
//   const r = seeded(seed)   r() -> 0..1   r.int(n) -> 0..n-1   r.pick(list)   r.chance(p) -> bool
// ---------------------------------------------------------------------------------------
export function seeded(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (list) => list[Math.floor(r() * list.length)];
  r.chance = (p) => r() < p;
  return r;
}
