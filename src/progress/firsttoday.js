// ---------------------------------------------------------------------------------------
// THE FIRST TODAY (docs/plans/COLLECTION-LOG.md 6; South, 2026-10-27, "determine what else we can fold in"): the first time each game day
// you do a module's own thing (a fish landed, a race finished, a duel ended, a crossing sailed, a square of the open sea charted, a bed
// tended, a hand at Raku's tables, a miracle, a Well's floor, a crystal harvested), it pays a little, once: a reason to try something else
// tonight. The game day is the play clock's (calendar.js: one real hour), so nothing is owed for being away: no streak, no login, nothing
// lost by missing a day (the wall-clock gate is refused, COLLECTION-LOG.md 5).
//
// Prior art: FFXIV's Duty Roulette (a daily bonus for the first run of each kind of duty), Animal Crossing's Nook Miles+ (a fresh errand
// a day), Destiny's first-of-the-day pursuits; refused: their login streaks.
//
//   FIRST_TODAY { pay (minutes of play at the aim), modules: { [id]: { label, on: [event types] } } }
//   game.firstToday = new FirstToday(game)   .left() -> the modules not yet done this game day   events: firsttoday.paid { module, label, cubes, left }
// ---------------------------------------------------------------------------------------
import { ECON } from './econ/table.js';
import { today } from '../core/calendar.js';

/** pay: minutes of play at the aim the first of each module pays (1: 8 cubes; ten modules in an hour, 80, about a sixth of the aim). */
export const FIRST_TODAY = {
  pay: 1,
  modules: {
    angling: { label: 'Angling', on: ['angle.catch'] },
    raceway: { label: 'The Raceway', on: ['race.finish'] },
    duel:    { label: 'A puzzle duel', on: ['duel.end'] },
    crossing: { label: 'A crossing', on: ['rail.end'] },
    opensea: { label: 'The open sea', on: ['sea.chart', 'sea.herd', 'sea.habit', 'sea.salvage'] },
    garden:  { label: 'The Spirit Garden', on: ['garden.tend'] },
    bazaar:  { label: "Raku's tables", on: ['casino.result'] },
    godhand: { label: 'The god hand', on: ['god.miracle'] },
    well:    { label: 'A Well', on: ['well.floor'] },
    dunes:   { label: 'The crystals', on: ['crystal.harvest'] },
  },
};

export class FirstToday {
  constructor(game) {
    this.game = game; this.day = -1; this.done = new Set();
    game.save?.section('firstToday', { scope: 'player', version: 1, dump: () => ({ day: this.day, done: [...this.done] }),
      load: (d) => { this.day = d?.day ?? -1; this.done = new Set(d?.done || []); }, reset: () => { this.day = -1; this.done = new Set(); } });
    for (const [id, M] of Object.entries(FIRST_TODAY.modules)) for (const type of M.on) game.events?.on?.(type, (e) => { if ((e?.by ?? 'courier') === 'courier') this.did(id); });
  }
  /** The modules not yet done this game day (the Index may show them: Petra's). */
  left() { this.turn(); return Object.keys(FIRST_TODAY.modules).filter((id) => !this.done.has(id)); }
  turn() { const d = today(); if (d !== this.day) { this.day = d; this.done = new Set(); } }
  did(id) {
    this.turn(); if (this.done.has(id)) return;
    this.done.add(id); this.game.save?.dirty?.('firstToday');
    const cubes = Math.round(FIRST_TODAY.pay * ECON.perMinute); this.game.cubes?.earn?.(cubes, 'firsttoday');
    this.game.events?.emit('firsttoday.paid', { module: id, label: FIRST_TODAY.modules[id].label, cubes, left: this.left().length, by: 'courier' });
  }
}
