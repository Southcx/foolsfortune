// ---------------------------------------------------------------------------------------
// DRIVES: what a creature wants, as numbers that creep up over time. Each drive is 0 (content) to 1 (desperate); it rises at its own
// rate (faster or slower as the moment asks: thirst rises faster in the sun and faster still for a body that is spending itself) and
// falls when the want is met (`sat`). The utility reasoner (utility.js) reads them as considerations, so a want that grows long enough
// outweighs whatever the creature was doing: it stops wandering and goes to drink.
//
// TRAITS make each one its own: a drive's rate and the weight of every action can be scaled per individual (a greedy one gets hungry
// sooner, a timid one frightens sooner, a lazy one tires sooner). Rolled once when it is made, from the kind's ranges: `rollTraits`.
//
//   const d = new Drives({ thirst: { rise: 1 / 90, start: [0.1, 0.4] }, rest: { rise: 1 / 200 } }, traits)
//   d.tick(dt, { thirst: 2 })   (this frame thirst rises twice as fast)     d.get('thirst')     d.sat('thirst', 0.4)     d.add('fear', 0.3)
//   d.urgent() -> the most pressing drive's name                         d.fall('fear', 1 / 8)  (a drive that ebbs by itself: fear, anger)
//
// Prior art: the motives of The Sims (Hunger, Energy, Social... each a bar that decays, an object that refills it), the needs of
// Dwarf Fortress and Rimworld, and Monster Hunter's monsters, which are hungry, tired and territorial on their own clock: they go to
// eat, they limp to the nest to sleep, they fight what comes into their ground.
// ---------------------------------------------------------------------------------------

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const pick = (r) => (Array.isArray(r) ? r[0] + Math.random() * (r[1] - r[0]) : r);

/** An individual's traits from the kind's ranges: { bold: [0.6, 1.4], greedy: [...], ... } -> { bold: 1.07, ... }. */
export function rollTraits(ranges = {}) {
  const t = {};
  for (const [k, r] of Object.entries(ranges)) t[k] = pick(r);
  return t;
}

export class Drives {
  /** spec: { name: { rise (per second at rest), fall (per second, by itself), start (value or [lo, hi]), trait (a trait that scales rise) } } */
  constructor(spec, traits = {}) {
    this.spec = spec; this.traits = traits;
    this.v = {};
    for (const [k, s] of Object.entries(spec)) this.v[k] = clamp01(pick(s.start ?? 0));
  }
  get(k) { return this.v[k] ?? 0; }
  set(k, x) { this.v[k] = clamp01(x); }
  add(k, x) { this.v[k] = clamp01((this.v[k] ?? 0) + x); }
  sat(k, x) { this.v[k] = clamp01((this.v[k] ?? 0) - x); }
  /** One step: every drive rises (or falls) at its rate, scaled by its trait and by `mods[name]` for this step. */
  tick(dt, mods = {}) {
    for (const [k, s] of Object.entries(this.spec)) {
      const m = (mods[k] ?? 1) * (s.trait ? this.traits[s.trait] ?? 1 : 1);
      if (s.rise) this.v[k] = clamp01(this.v[k] + s.rise * m * dt);
      if (s.fall) this.v[k] = clamp01(this.v[k] - s.fall * dt);
    }
  }
  urgent() { let best = null, bv = -1; for (const [k, v] of Object.entries(this.v)) if (v > bv) { bv = v; best = k; } return best; }
  toString() { return Object.entries(this.v).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' '); }
}
