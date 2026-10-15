// ---------------------------------------------------------------------------------------
// THE LICENCES (docs/plans/SKIFF-RACING.md section 12): short tests on a stretch of a track, each under one rule that teaches one of the
// board's verbs (the carve, snaking, the grind, the hull, the vein lane, a trick, a clean line), with a bronze, silver and gold time.
// Ridden in from a flying start, the clock starting at the test's first gate; the rule broken, or the end reached slower than bronze,
// and it is failed (said, and Backspace tries again at once). Each medal pays once, ever (a test passed, not a farm: as the race's).
// The medal times are drafts from each stretch's length (a pace in m/s for each medal), until the owner's own runs set them.
// Events (with `by`): licence.fail { test, why }; a pass is the race's finish (mode licence) with test and medal.
//
// Prior art: Gran Turismo's licence tests (a short stretch, a rule, bronze to gold, retried at once), Pilotwings' lessons, Tony Hawk's
// Pro Skater's goals that teach one trick each, Forza's driving school.
//
//   LICENCES [{ id, label, track, from, to, rule, n, pace, line }]   const C = new Licences(game, race)   C.medalOf(test, seconds)
//   (a mode's ruleset: the race calls plan, begin, update, gate, result, stop)   LICENCE (the numbers)
// ---------------------------------------------------------------------------------------
import { ECON } from '../../progress/econ/table.js';

/** The tests. `from`: the gate it starts at (0 the line), `to`: the gate it ends at; `rule` and its `n`; `siphon`: the test's siphon stands (siphons.js); `pace`: the medals' pace off the usual (a slow test's times are kinder). Words: placeholders for Espada's. */
export const LICENCES = [
  { id: 'carve', label: 'Carve', track: 'sun', from: 0, to: 2, rule: 'noflare', line: 'To gate 2 without a flare: carve for your speed.' },
  { id: 'snake', label: 'Snake', track: 'sun', from: 0, to: 1, rule: 'snakes', n: 3, line: 'To gate 1 with three snaking carves: each the other way, soon after the last.' },
  { id: 'grind', label: 'Grind', track: 'sun', from: 0, to: 3, rule: 'grind', n: 40, line: 'To gate 3, grinding 40 metres of rail on the way.' },
  { id: 'hull', label: 'Hull', track: 'gorge', from: 0, to: 3, rule: 'hull', n: 0.6, line: 'Through the canyon to gate 3 with your pool still over 60%.' },
  { id: 'pit', label: 'Pit lane', track: 'sun', from: 5, to: 6, rule: 'refill', n: 0.75, siphon: true, pace: 0.85, line: 'Under the siphon, it drinks your pool to a quarter: ride the vein lane, and reach gate 6 with it over 75%.' },
  { id: 'air', label: 'Big air', track: 'sun', from: 6, to: 7, rule: 'trick', n: 1, line: 'Off the lip, land a spin square, and on to gate 7.' },
  { id: 'clean', label: 'Clean lap', track: 'coaster', from: 0, to: 8, rule: 'clean', line: 'To gate 8 of the Coaster without a bump, a wall or a bail.' },
];
/** The medals' pace (m/s over the stretch), metres of run-up before the first gate, the pay a medal (minutes of play, once). */
export const LICENCE = { pace: { gold: 27, silver: 24, bronze: 20 }, runUp: 150, pay: { gold: 3, silver: 2, bronze: 1 } };

export class Licences {
  constructor(game, race) {
    this.game = game; this.race = race; this.test = null;
    const ev = game.events, live = () => this.test && race.running && race.state === 'run' && race.ruleset === this;
    ev?.on('skiff.carve', (e) => { if (live() && e.by === 'courier' && race.skiff?.rules?.snake > 0) this.count++; });
    ev?.on('skiff.grind.end', (e) => { if (live() && e.by === 'courier') this.metres += e.metres || 0; });
    ev?.on('skiff.trick', (e) => { if (live() && e.by === 'courier') this.tricks++; });
    ev?.on('skiff.refill', (e) => { if (live() && e.by === 'courier' && e.fresh) this.lanes++; });
    for (const k of ['skiff.hull', 'skiff.bail']) ev?.on(k, (e) => { if (live() && this.test.rule === 'clean' && e.by === 'courier') this.fail(k === 'skiff.bail' ? 'bail' : e.kind); });
  }
  testOf(id) { return LICENCES.find((t) => t.id === id); }
  /** A stretch's length along its line (m). */
  span(T, t) { const L = T.length, a = t.from ? T.gates[t.from - 1] : T.line, b = T.gates[t.to - 1]; return { a, len: ((b - a) % L + L) % L }; }
  /** Its medal for a time, or null (slower than bronze). */
  medalOf(t, seconds, T) {
    const len = this.span(T, t).len, k = t.pace || 1;
    for (const m of ['gold', 'silver', 'bronze']) if (seconds <= len / (LICENCE.pace[m] * k)) return m;
    return null;
  }
  plan(trackId, opts) {
    const t = this.testOf(opts.test) || LICENCES[0], T = this.race.R.trackOf(t.track), { a } = this.span(T, t);
    this.pending = t; return { track: t.track, from: a - LICENCE.runUp, flyAt: a, gate: t.from, flying: true, laps: 1 };
  }
  begin() {
    this.test = this.pending; this.count = 0; this.metres = 0; this.tricks = 0; this.lanes = 0;
  }
  update(race) {
    const t = this.test, S = race.skiff; if (!t) return;
    if (t.rule === 'noflare' && S?.flaring) return this.fail('flare');
  }
  fail(why) {
    const g = this.game, t = this.test; if (!t) return false;
    g.events?.emit('licence.fail', { test: t.id, why, by: 'courier' });
    this.race.end('failed'); return false;
  }
  /** At a gate: the end reached? Then the rule's count and the pool are judged. */
  gate(race, i) {
    const t = this.test; if (!t || i + 1 < t.to) return false;
    const L = this.game.lachryma, share = L ? L.value / L.max : 1;
    const short = (t.rule === 'snakes' && this.count < t.n && 'snakes') || (t.rule === 'grind' && this.metres < t.n && 'grind') || (t.rule === 'trick' && this.tricks < t.n && 'trick')
      || (t.rule === 'refill' && !this.lanes && 'lane') || ((t.rule === 'hull' || t.rule === 'refill') && share < t.n && 'pool') || (!this.medalOf(t, race.t, race.T) && 'slow');
    if (short) { this.fail(short); return false; }
    return true;
  }
  result(race, out) {
    const t = this.test, g = this.game; out.seconds = +race.t.toFixed(2); out.test = t.id; out.medal = this.medalOf(t, out.seconds, race.T);
    if (out.medal && !(g.ledger?.get?.(`licence.${t.id}.${out.medal}`) > 0)) g.cubes?.earn(Math.round(LICENCE.pay[out.medal] * ECON.perMinute), 'trial');
  }
  stop() { this.test = null; }
}
