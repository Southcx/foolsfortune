// ---------------------------------------------------------------------------------------
// THE TRICK COMBO (docs/plans/SKIFF-RACING.md section 9; SSX Tricky's boost meter, Tony Hawk's combo): the Solar Skiff's tricks linked
// into one chain. Each trick (a spin landed square, a grab let go in the air, a grind, a late pop, a carve let go, a sun ring flown, a
// landing down a slope) adds its points; each kind of trick in the chain past the first raises the multiplier. The chain lives while the
// board is in the air, on a rail or in a carve, and for `link` real seconds on the sand after a trick; when that runs out the chain is
// BANKED: its points times the multiplier fill banked flares (a flare's worth of push each, spent by Shift before the pool, free of
// Lachryma). A wobbled landing banks it at once; a bail or a respawn LOSES it. It replaces the flat Lachryma a trick gave the pool (the
// owner, 2026-10-14): tricks pay in speed, the pool stays the shield's and the arts'.
// Events (each with `by`): skiff.combo { kind, n, points, mult } (a link), skiff.combo.bank { points, n, mult, stocks },
// skiff.combo.drop { points, n, why }. The banked flares' look and the chain's gauge are Calissa's (no words, no numbers on the screen).
//
// Prior art: SSX Tricky (tricks fill the boost meter; a bail empties what the run added), Tony Hawk's Pro Skater 2 and 3 (the combo
// and its multiplier, the manual as the link on the ground, a variety bonus), Sonic Riders (tricks refill the air tank), Crash Team
// Racing's reserves (boost banked to spend later).
//
//   const C = new SkiffCombo(skiff)   C.add(kind, points)   C.step(dt, live)   C.bank()   C.drop(why)   C.spend(dt) -> bool   C.stocks
//   COMBO (the numbers)
// ---------------------------------------------------------------------------------------

/** Real seconds on the sand to the next trick; each trick's points (grab and grind by the real second and the metre); the multiplier's
 *  step for each kind past the first, and its cap; points to a banked flare, the most banked; a banked flare's real seconds of flare. */
export const COMBO = {
  link: 2.0,
  points: { spin: 100, grab: 80, tweak: 50, grind: 6, pop: 50, perfect: 100, carve: [40, 90, 160], ring: 60, slope: 50 },
  kinds: 0.5, maxMult: 4,
  stock: 1000, stocks: 3, flare: 1.5,
};

export class SkiffCombo {
  constructor(skiff) { this.skiff = skiff; this.stocks = 0; this.reset(); }
  get events() { return this.skiff.game.events; }
  reset() { this.n = 0; this.points = 0; this.kinds = new Set(); this.t = 0; }
  get mult() { return Math.min(COMBO.maxMult, 1 + COMBO.kinds * Math.max(0, this.kinds.size - 1)); }
  get total() { return Math.round(this.points * this.mult); }

  /** A trick linked: its points into the chain, the link's clock wound again. */
  add(kind, points) {
    if (!(points > 0)) return;
    this.n++; this.points += points; this.kinds.add(kind); this.t = COMBO.link;
    this.events?.emit('skiff.combo', { kind, n: this.n, points: this.total, mult: this.mult, by: 'courier' });
  }
  /** Each step of the ride: `live` (in the air, on a rail, in a carve) holds the clock; on the sand it runs, and at nought the chain banks. */
  step(dt, live) { if (!this.n) return; if (live) { this.t = COMBO.link; return; } if ((this.t -= dt) <= 0) this.bank(); }
  bank() {
    if (!this.n) return;
    const points = this.total, n = this.n, mult = this.mult;
    this.stocks = Math.min(COMBO.stocks, this.stocks + points / COMBO.stock);
    this.reset();
    this.events?.emit('skiff.combo.bank', { points, n, mult, stocks: +this.stocks.toFixed(2), by: 'courier' });
  }
  drop(why) {
    if (!this.n) return;
    const points = this.total, n = this.n; this.reset();
    this.events?.emit('skiff.combo.drop', { points, n, why, by: 'courier' });
  }
  /** Shift's flare, from a banked one first: true while one lasts (this step's share spent). */
  spend(dt) { if (this.stocks <= 0.001) return false; this.stocks = Math.max(0, this.stocks - dt / COMBO.flare); return true; }
}
