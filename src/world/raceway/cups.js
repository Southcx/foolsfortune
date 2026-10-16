// ---------------------------------------------------------------------------------------
// THE CUPS (docs/plans/SKIFF-RACING.md section 12): three races in a row on the three tracks against the same rivals, points for each
// place (10, 6, 4, 2), the cup to whoever has most at the end (a tie to the better last race). The next race begins a few real seconds
// after the last finishes; retiring or leaving ends the cup. Winning a cup pays once, ever. The Sibling Cup races the siblings (opened as
// their race is: rw21, or lent in DEBUG).
// Events (with `by`): cup.start { cup }, cup.race { cup, round, place, points, total }, cup.finish { cup, place, points }, cup.end { cup }.
//
// Prior art: Mario Kart's Grand Prix (four races, points by place, a trophy), F-Zero's cups, Gran Turismo's championships.
//
//   CUPS [{ id, label, roster, tracks }]   const K = new Cups(game, race)   K.start(id)   K.update(dt)   K.on   CUP (the numbers)
// ---------------------------------------------------------------------------------------
import { ECON } from '../../progress/econ/table.js';

/** The cups (working names: Espada's). */
export const CUPS = [
  { id: 'clay', label: 'Clay Cup', roster: 'clapperjars', tracks: ['sun', 'gorge', 'coaster'], line: 'The three tracks against the clapperjars.' },
  { id: 'sibling', label: 'Sibling Cup', roster: 'siblings', tracks: ['coaster', 'gorge', 'sun'], line: 'The three tracks against your siblings.' },
];
/** Points by place; real seconds between a finish and the next grid; minutes of play a cup's first win pays. */
export const CUP = { points: [10, 6, 4, 2], between: 5, pay: { clay: 12, sibling: 20 } };

export class Cups {
  constructor(game, race) {
    this.game = game; this.race = race; this.on = null;
    game.events?.on('race.finish', (e) => { if (this.on && e.cup) this.raced(e); });
    game.events?.on('race.end', (e) => { if (this.on && e.cup) this.stop(); });
  }
  cupOf(id) { return CUPS.find((c) => c.id === id); }
  start(id) {
    const C = this.cupOf(id); if (!C || this.race.running) return false;
    this.on = { C, round: 0, totals: { you: 0, 0: 0, 1: 0, 2: 0 }, last: {}, waitT: null };
    this.game.events?.emit('cup.start', { cup: C.id, by: 'courier' });
    this.next(); return true;
  }
  next() { const K = this.on; this.race.start(K.C.tracks[K.round], { mode: 'race', roster: K.C.roster, cup: true }); }
  raced(e) {
    const K = this.on, P = CUP.points;
    for (const o of e.order || [{ who: 'you', place: e.place }]) { K.totals[o.who] = (K.totals[o.who] || 0) + (P[o.place - 1] || 0); K.last[o.who] = o.place; }
    K.round++;
    this.game.events?.emit('cup.race', { cup: K.C.id, round: K.round, place: e.place, points: P[e.place - 1] || 0, total: K.totals.you, by: 'courier' });
    if (K.round >= K.C.tracks.length) this.finish(); else K.waitT = CUP.between;
  }
  finish() {
    const K = this.on, g = this.game, who = Object.keys(K.totals);
    who.sort((a, b) => K.totals[b] - K.totals[a] || (K.last[a] || 9) - (K.last[b] || 9));
    const place = who.indexOf('you') + 1, first = place === 1 && !(g.ledger?.get?.(`cup.${K.C.id}.win`) > 0);
    g.events?.emit('cup.finish', { cup: K.C.id, place, points: K.totals.you, by: 'courier' });
    if (first) g.cubes?.earn(Math.round(CUP.pay[K.C.id] * ECON.perMinute), 'trial');
    this.on = null;
  }
  stop() { const K = this.on; this.on = null; if (K) this.game.events?.emit('cup.end', { cup: K.C.id, by: 'courier' }); }
  update(dt) {
    const K = this.on; if (!K || K.waitT == null) return;
    if (!this.race.R?.active) { this.stop(); return; }
    if ((K.waitT -= dt) <= 0) { K.waitT = null; this.next(); }
  }
}
