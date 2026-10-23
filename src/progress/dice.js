// ---------------------------------------------------------------------------------------
// THE PNEUKA STONES' DICE (docs/plans/DICE.md; the owner, 2026-10-23: the stones that process Lachryma are the Pneuka stones, and they
// are dice). The set's rules beside the stones' (progress/stones.js keeps how a set drinks): the seven dice and their suits, the PALM
// DIE (the stones in the god hand's form, one die in its palm), and Luck's re-roll.
//
// The palm die, ruled by the owner: overflow "goes into the Lockheart first if applicable, then converted into solid Lachryma cubes via
// the palm die". So the pool's overflow is shared out in that order: the Lockheart, worn and not at its cap, drinks its share (the worn
// stone's `overflow.lockheart`); a stone's `bleed` share is lost, as before (amethyst's trade); the palm die condenses the rest into
// cubes at its size's rate, up to its size's cap a game day, and grows along the solids (d4, d6, d8, d12, d20) on what it has
// condensed. The cap keeps a new faucet inside the aim (scripts/economy.mjs prints it; ECONOMY.md): a fighter overflows thousands of
// Lachryma a real hour, so the rate alone would pay twice the aim.
//
// Prior art: Entropy Tactics' Hungry Die (the owner's: a die that grows on what it is fed); the Lockheart's conversion (a coffin of
// Lachryma into cubes, 0.12 a unit at its best: the palm die's d20 rate); Stardew Valley's daily shipping cap feel (a sink-side cap, not
// a punishment); Shannon's surprisal for Luck's bits (progress/luck.js).
//
//   SET [{ die, sides, solid, suit }]   PALM = { sizes, rate, capPerSide, grow }   palmSides(condensed) -> 4 .. 20   palmCap(sides)
//   REROLL = { perDay, bitsPerExtra, max }   rerollsOf(bits) -> re-rolls a game day
//   new PalmDie(game) -> game.palmDie: .sides  .condensed  .today  feed(amount) -> cubes   save section 'palmdie' (scope player)
//   events: palm.condense { n, sides, by }   palm.grow { from, to, by }
// ---------------------------------------------------------------------------------------
import { stoneOf } from './stones.js';
import { today } from '../core/calendar.js';

/** The standard set, each die its Platonic solid's suit (Plato's Timaeus; DICE.md 2); the d10 pair the Tree's. */
export const SET = [
  { die: 'd4', sides: 4, solid: 'tetrahedron', suit: 'wands' },
  { die: 'd6', sides: 6, solid: 'cube', suit: 'pentacles' },
  { die: 'd8', sides: 8, solid: 'octahedron', suit: 'swords' },
  { die: 'd10', sides: 10, solid: 'pentagonal trapezohedron', suit: null },
  { die: 'd%', sides: 10, solid: 'pentagonal trapezohedron', suit: null },
  { die: 'd12', sides: 12, solid: 'dodecahedron', suit: 'wild' },
  { die: 'd20', sides: 20, solid: 'icosahedron', suit: 'cups' },
];

/** The palm die. `rate`: cubes condensed per unit of Lachryma, by size (the d20's is the Lockheart's best, 12 cubes from 100);
 *  `capPerSide`: cubes a game day per side (a d4 8, a d20 40: 0.08 of the aim an hour at most); `grow`: cubes condensed in all to reach
 *  each size (a d6 after 40, about five game days of steady overflow; a d20 after 700, some forty). */
export const PALM = {
  sizes: [4, 6, 8, 12, 20],
  rate: { 4: 0.05, 6: 0.06, 8: 0.08, 12: 0.1, 20: 0.12 },
  capPerSide: 2,
  grow: { 4: 0, 6: 40, 8: 120, 12: 300, 20: 700 },
};
export const palmSides = (condensed = 0) => PALM.sizes.filter((s) => condensed >= PALM.grow[s]).pop();
export const palmCap = (sides) => PALM.capPerSide * sides;

/** Luck's re-roll (DICE.md 3, the owner: "sure"): one a game day, one more for every `bitsPerExtra` bits of Luck, at most `max`. */
export const REROLL = { perDay: 1, bitsPerExtra: 100, max: 3 };
export const rerollsOf = (bits = 0) => Math.min(REROLL.max, REROLL.perDay + Math.floor(Math.max(0, bits) / REROLL.bitsPerExtra));

export class PalmDie {
  constructor(game) {
    this.game = game;
    this.condensed = 0; this.carry = 0; this.day = -1; this.todayCubes = 0;
    game.save?.section('palmdie', {
      scope: 'player', version: 1,
      dump: () => ({ condensed: this.condensed, carry: +this.carry.toFixed(3), day: this.day, todayCubes: this.todayCubes }),
      load: (d) => { this.condensed = +d?.condensed || 0; this.carry = +d?.carry || 0; this.day = d?.day ?? -1; this.todayCubes = +d?.todayCubes || 0; },
      reset: () => { this.condensed = 0; this.carry = 0; this.day = -1; this.todayCubes = 0; },
    });
    this.hooked = false;
  }
  get sides() { return palmSides(this.condensed); }
  get today() { this.roll(); return { cubes: this.todayCubes, cap: palmCap(this.sides) }; }
  roll() { const d = today(); if (d !== this.day) { this.day = d; this.todayCubes = 0; } }

  /** What of an overflow reaches the palm die: after the Lockheart's share (worn and not at its cap) and the stone's bleed. */
  share(amount) {
    const g = this.game, o = stoneOf(g.vessel?.look?.stones).overflow || {}, lock = g.lockheart;
    const lockTakes = lock?.worn && lock.charge < lock.cap ? (o.lockheart ?? 0.8) : 0; // (the Lockheart first, if it can take it: the owner's order)
    return Math.max(0, amount * (1 - lockTakes) * (1 - (o.bleed ?? 0)));
  }
  /** Condense Lachryma into cubes at the die's rate, within its cap for the game day. Returns the whole cubes earned. */
  feed(amount) {
    if (!(amount > 0)) return 0;
    this.roll();
    const sides = this.sides, room = palmCap(sides) - this.todayCubes;
    if (room <= 0) return 0;
    this.carry += amount * PALM.rate[sides];
    const n = Math.min(room, Math.floor(this.carry));
    if (n <= 0) return 0;
    this.carry -= n; this.todayCubes += n; this.condensed += n;
    this.game.cubes?.earn(n, 'palm');
    this.game.events?.emit('palm.condense', { n, sides, by: 'courier' });
    const after = this.sides;
    if (after !== sides) this.game.events?.emit('palm.grow', { from: sides, to: after, by: 'courier' });
    this.game.save?.dirty('palmdie');
    return n;
  }
  /** Hooked once the pool exists (as the Lockheart's passive is): every overflow, whatever drank first. */
  update() {
    const pool = this.game.lachryma;
    if (this.hooked || !pool) return;
    this.hooked = true;
    pool.on('overflow', (e) => { if (e.source !== 'lockheart') this.feed(this.share(e.amount)); });
  }
}
