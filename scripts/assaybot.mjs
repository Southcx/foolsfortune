// ---------------------------------------------------------------------------------------
// THE ASSAY'S BOT CHECK (docs/plans/APTITUDE.md 8, "against a known player"; 9 step 2): a bot with set settings plays each passive reading
// and each standard trial, headless, and the measuring must give its settings back. This tests the measuring, not a person; no bot's
// play is ever kept as a reading (the Aptitude module drops an agent's samples, and that is checked too).
//
//   node scripts/assaybot.mjs        one PASS/FAIL line a check, the recovered number beside the set one; exit 1 on a FAIL
// ---------------------------------------------------------------------------------------
import { APTITUDES, readOf, Aptitude } from '../src/progress/aptitude.js';
import { TRIALS, scoreTrial, zScore } from '../src/progress/assaytrials.js';

let seed = 20261029;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => { let u = 0; while (!u) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
let fails = 0;
const check = (name, got, want, tol, rel = true) => {
  const ok = got != null && Math.abs(got - want) <= (rel ? tol * Math.abs(want) : tol);
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: set ${want}, read ${got == null ? 'nothing' : +got.toFixed(2)} (within ${rel ? `${tol * 100}%` : tol})`);
};

// ---- the passive readings: a bot's events through each aptitude's own value(), read by readOf (the window's numbers)
const EVENTS = {
  parry: (v) => ({ what: 'blow', lead: v / 1000 }),
  pitch: (v) => ({ pitchOff: 0, beat: v }),
  timing: (v) => ({ asyncSd: v }),
  colour: (v) => ({ d: v / 100 }),
  aim: (v) => ({ run: { shots: 100, hits: Math.round(v) } }),
  pull: (v) => ({ ans: v / 100 }),
  risk: (v) => ({ power: 1 + v / 100 }),
};
const SET = { parry: [120, 30], pitch: [1.5, 0.4], timing: [28, 5], colour: [18, 5], aim: [62, 8], pull: [74, 9], risk: [40, 8] }; // (each: its median, its spread)
for (const [id, A] of Object.entries(APTITUDES)) {
  if (A.tally) continue; // (the tallies: below, through the module itself)
  const make = EVENTS[id]; if (!make) { console.log(`FAIL  ${id}: no bot event written for it`); fails++; continue; }
  const [m, sd] = SET[id], S = { n: 0, list: [], early: [] };
  for (let i = 0; i < 40; i++) { const v = A.value(make(Math.max(0, m + sd * gauss()))); if (v == null) continue; if (!S.n) { S.first = v; S.best = v; } S.n++; S.list.push(v); if (S.early.length < 5) S.early.push(v); }
  check(`passive ${id} median`, readOf(S, A.better).median, m, 0.15);
}

// ---- the module drops what does not count: another's event, an agent driving, a practice
{
  const on = {}, game = { events: { on: (ev, f) => { (on[ev] ||= []).push(f); }, emit: () => {} }, ledger: null, save: null, agent: null };
  const apt = new Aptitude(game), fire = (e) => (on['move.parry'] || []).forEach((f) => f(e));
  fire({ what: 'blow', lead: 0.1, by: 'creature' }); fire({ what: 'blow', lead: 0.1, by: 'courier', practice: true });
  game.agent = { task: 'playtest' }; fire({ what: 'blow', lead: 0.1, by: 'courier' }); game.agent = null;
  const dropped = apt.read('parry').n === 0; fire({ what: 'blow', lead: 0.1, by: 'courier' });
  const kept = apt.read('parry').n === 1;
  if (!(dropped && kept)) fails++;
  console.log(`${dropped && kept ? 'PASS' : 'FAIL'}  an agent's, another's and a practice's samples are dropped; the Courier's is kept`);
}

// ---- the tallies: a bot that answers a set share of its decisions, through the module's own marks and flushes
{
  const on = {}, game = { events: { on: (ev, f) => { (on[ev] ||= []).push(f); }, emit: () => {} }, ledger: null, save: null, agent: null };
  const apt = new Aptitude(game), fire = (ev, e) => (on[ev] || []).forEach((f) => f(e));
  // holding back: 30 legs, each 8 outlined shots met, 70% sent home by the roll; one practice leg, all taken, must not count
  for (let leg = 0; leg < 30; leg++) { for (let i = 0; i < 8; i++) rand() < 0.7 ? fire('move.parry', { tool: 'sloop', what: 'shot', by: 'courier' }) : fire('rail.hit', { kind: 'outlined', by: 'creature' }); fire('rail.hit', { kind: 'plain', by: 'creature' }); fire('rail.leg.end', { by: 'courier' }); }
  for (let i = 0; i < 8; i++) fire('rail.hit', { kind: 'outlined', by: 'creature' }); fire('rail.leg.end', { practice: true, by: 'courier' });
  const I = apt.read('inhibition'); check('tally inhibition median (30 legs, 70% answered)', I.median, 70, 0.12);
  if (I.n !== 30) fails++; console.log(`${I.n === 30 ? 'PASS' : 'FAIL'}  tally inhibition: a practice leg is dropped (30 samples, read ${I.n})`);
  // reading others: 40 games of 1 to 3 callouts each, 60% right; a practice game must not count
  for (let gm = 0; gm < 40; gm++) { const calls = 1 + Math.floor(rand() * 3); let right = 0; for (let i = 0; i < calls; i++) if (rand() < 0.6) right++; fire('casino.result', { game: 'nebula', calls, right, by: 'courier' }); }
  const before = apt.read('others').n; fire('casino.result', { game: 'nebula', calls: 9, right: 0, practice: true, by: 'courier' });
  const O = apt.read('others'); check('tally others median (40 games, 60% right)', O.median, 60, 0.2);
  if (O.n !== before) fails++; console.log(`${O.n === before ? 'PASS' : 'FAIL'}  tally others: a practice table is dropped`);
}

// ---- the staircases: a bot whose 79.4% point is set (its curve a logistic in log units, its guessing rate the trial's chance)
function stairBot(T, theta, slope = 0.25) {
  const g = 1 / T.choices, target = 0.794, k = Math.log((1 - g) / (target - g) - 1); // (logistic: p(x) = g + (1-g) / (1 + exp(-(ln x - ln m) / slope)))
  const m = Math.exp(Math.log(theta) + slope * k);
  return (x) => rand() < g + (1 - g) / (1 + Math.exp(-(Math.log(x) - Math.log(m)) / slope));
}
for (const [id, theta] of [['pitch', 12], ['pitch', 40], ['colour', 1.5], ['colour', 6]]) {
  const T = TRIALS[id], runs = [];
  for (let r = 0; r < 200; r++) {
    const bot = stairBot(T, theta), answers = []; let level = T.start, turns = 0, dir = 0, run = 0;
    // play the staircase as the room would: the bot answers at the level shown, the trial is scored from the answers alone
    for (let i = 0; i < 400 && turns < T.reversals; i++) {
      const ok = bot(level); answers.push(ok);
      let move = 0; if (ok) { if (++run >= 3) { run = 0; move = -1; } } else { run = 0; move = 1; }
      if (move) { if (dir && move !== dir) turns++; dir = move; level = Math.min(T.ceil, Math.max(T.floor, move < 0 ? level / T.step : level * T.step)); }
    }
    const s = scoreTrial(id, { answers }); if (s.ok) runs.push(s.value);
  }
  check(`trial ${id} threshold (median of 200 runs)`, median(runs), theta, 0.2);
}

// ---- Go / No-Go: a bot with a set d' and criterion (equal-variance signal detection)
for (const [dp, c] of [[1.5, 0], [2.5, 0.4]]) {
  const T = TRIALS.gonogo, runs = [];
  for (let r = 0; r < 200; r++) {
    const rec = { hits: 0, misses: 0, fas: 0, crs: 0 };
    for (let i = 0; i < T.trials; i++) {
      const noGo = rand() < T.noGo, x = gauss() + (noGo ? 0 : dp); // (go lights carry the signal: press when x is past the criterion)
      const press = x > dp / 2 + c;
      if (noGo) press ? rec.fas++ : rec.crs++; else press ? rec.hits++ : rec.misses++;
    }
    runs.push(scoreTrial('gonogo', rec).value);
  }
  check(`trial gonogo d' (criterion ${c}; median of 200 runs)`, median(runs), dp, 0.3, false);
}

// ---- the reaction box: a bot with a set median and 5% guesses
{
  const T = TRIALS.react, runs = [];
  for (let r = 0; r < 200; r++) { const times = []; for (let i = 0; i < T.trials; i++) times.push(rand() < 0.05 ? 40 + 50 * rand() : 245 + 30 * gauss()); runs.push(scoreTrial('react', { times }).value); }
  check('trial react median ms (median of 200 runs)', median(runs), 245, 10, false);
}

// ---- tapping: a bot with a set spread round a latency (the latency must not leak into the reading)
{
  const T = TRIALS.rhythm, runs = [];
  for (let r = 0; r < 200; r++) { const a = []; for (let i = 0; i < T.taps; i++) a.push(-35 + (i < T.settle ? 80 * gauss() : 22 * gauss())); runs.push(scoreTrial('rhythm', { async: a }).value); }
  check('trial rhythm spread ms (median of 200 runs, a 35 ms latency beside it)', median(runs), 22, 0.12);
}

// ---- the z-score itself
check('zScore(0.975)', zScore(0.975), 1.959964, 1e-6, false);

console.log(fails ? `assaybot: ${fails} FAILED` : 'assaybot: all PASS');
process.exit(fails ? 1 : 0);
