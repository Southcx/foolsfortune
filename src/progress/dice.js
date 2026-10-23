// ---------------------------------------------------------------------------------------
// THE PNEUKA STONES' DICE (docs/plans/DICE.md; the owner, 2026-10-23: the stones that process Lachryma are the Pneuka stones, and they
// are dice). The set's rules beside the stones' (progress/stones.js keeps how a set drinks): the seven dice and their suits, the PALM
// DIE (the stones in the god hand's form, one die in its palm), and Luck's re-roll.
//
// The palm die, ruled by the owner: overflow "goes into the Lockheart first if applicable, then converted into solid Lachryma cubes via
// the palm die". So the pool's overflow is shared out in that order: the Lockheart, worn and not at its cap, drinks its share (the worn
// stone's `overflow.lockheart`); a stone's `bleed` share is lost, as before (amethyst's trade); the palm die condenses the rest into
// cubes at its size's rate, up to its size's cap a game day, and grows along the solids (d4, d6, d8, d12, d20) on what it has
// condensed, always at a worse rate than the Lockheart's (the bespoke tool converts better; the palm die is for everyone). The cap keeps a new faucet inside the aim (scripts/economy.mjs prints it; ECONOMY.md): a fighter overflows thousands of
// Lachryma a real hour, so the rate alone would pay twice the aim.
//
// Prior art: Entropy Tactics' Hungry Die (the owner's: a die that grows on what it is fed); the Lockheart's conversion (a coffin of
// Lachryma into cubes, 0.12 a unit plain, 0.24 brimming: the ceiling the palm die stays under); Stardew Valley's daily shipping cap feel (a sink-side cap, not
// a punishment); Shannon's surprisal for Luck's bits (progress/luck.js).
//
//   SET [{ die, sides, solid, suit }]   PALM = { sizes, rate, capPerSide, grow }   palmSides(condensed) -> 4 .. 20   palmCap(sides)
//   REROLL = { perDay, bitsPerExtra, max }   rerollsOf(bits) -> re-rolls a game day
//   new PalmDie(game) -> game.palmDie: .sides  .condensed  .today  feed(amount) -> cubes   save section 'palmdie' (scope player)
//   events: palm.condense { n, sides, by }   palm.grow { from, to, by }
// ---------------------------------------------------------------------------------------
import { stoneOf } from './stones.js';
import { today } from '../core/calendar.js';

/** The standard set and its suits (the owner, 2026-10-23, through Espada; DICE.md 2): d4 Wands, d6 Pentacles, d8 Swords, d10 Cups,
 *  d12 the zodiac, Western and Chinese (twelve signs, twelve animals); d20 the Major Arcana I to XX (the Fool and the World outside it:
 *  the alpha and omega); the d% open. As items on the spread the d12 and the d20 span every suit, so they light as a wild card does. */
export const SET = [
  { die: 'd4', sides: 4, solid: 'tetrahedron', suit: 'wands' },
  { die: 'd6', sides: 6, solid: 'cube', suit: 'pentacles' },
  { die: 'd8', sides: 8, solid: 'octahedron', suit: 'swords' },
  { die: 'd10', sides: 10, solid: 'pentagonal trapezohedron', suit: 'cups' },
  { die: 'd%', sides: 10, solid: 'pentagonal trapezohedron', suit: null },
  { die: 'd12', sides: 12, solid: 'dodecahedron', suit: 'wild', zodiac: { western: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'], chinese: ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'] } },
  { die: 'd20', sides: 20, solid: 'icosahedron', suit: 'wild', majors: ['magician', 'priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'strength', 'hermit', 'wheel', 'justice', 'hanged', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement'] },
];

/** The palm die. `rate`: cubes condensed per unit of Lachryma, by size, always under the Lockheart's (the owner, 2026-10-23: "the
 *  Lockheart as a bespoke tool would be more effective at conversion, but even players who don't want to use a Lockheart can still
 *  convert"): its brass key turns a full coffin into 12 cubes a 100 (0.12), a brimming one 0.24, with no cap a game day; the d20 is
 *  two thirds of the plain rate;
 *  `capPerSide`: cubes a game day per side (a d4 8, a d20 40: 0.08 of the aim an hour at most); `grow`: cubes condensed in all to reach
 *  each size (a d6 after 40, about five game days of steady overflow; a d20 after 700, some forty). */
export const PALM = {
  sizes: [4, 6, 8, 12, 20],
  rate: { 4: 0.03, 6: 0.04, 8: 0.05, 12: 0.065, 20: 0.08 },
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
