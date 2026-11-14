// ---------------------------------------------------------------------------------------
// THE WELL'S BOARD'S SIMULATOR (docs/plans/WELL-BOARD.md 6): the board played by bots, thousands of runs, headless, and its numbers
// reported: how a run ends, how long it is, what comes home, and what the choice of die is worth (the planning bot against one that
// throws any die). The numbers in progress/wellboard/layout.js are tuned against this, never by feel alone (scripts/casino.mjs's way).
//
//   node scripts/wellboard.mjs [--n runs] [--seed first] [--endless] [--seats k] [--show seed]
// ---------------------------------------------------------------------------------------
import { play } from '../src/progress/casino/table.js';
import { WELL_BOARD } from '../src/progress/wellboard/rules.js';
import { boardBot, STYLE } from '../src/progress/wellboard/bot.js';
import { layOut, KINDS, BOARD } from '../src/progress/wellboard/layout.js';
import { payOf, MINUTES } from '../src/progress/wellboard/pay.js';
import { wellPay } from '../src/progress/econ/islands.js';
import { ECON } from '../src/progress/econ/table.js';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i + 1] ?? true) : d; };
const n = +opt('n', 1000), seed0 = +opt('seed', 1), endless = args.includes('--endless'), seats = +opt('seats', 1);
const pct = (a, b) => `${((100 * a) / Math.max(1, b)).toFixed(0)}%`, f1 = (x) => x.toFixed(1);

if (opt('show', null)) { // one board, drawn as text
  const G = { f: 'F', g: 'T', c: 'c', s: '+', h: '!', r: 'R', d: 'D' }, ch = (s) => (s.kind === 'shift' ? (s.shift > 0 ? '>' : '<') : s.kind === 'foe' ? 'X' : G[s.kind[0]]);
  for (let d = 0; d < BOARD.floors; d++) {
    const F = layOut(+opt('show'), d, { last: d === BOARD.floors - 1 }), main = [], side = [];
    for (const s of Object.values(F.spaces)) (s.side ? side : main).push(s);
    console.log(`floor ${d + 1}  main ${main.map(ch).join(' ')}   ${F.side.which} from ${F.side.from} to ${F.side.to}: ${side.map(ch).join(' ')}`);
  }
  console.log('F fight  T trial  c cache  + spring  ! hazard  R rest  < > shift  D door  X the FOE');
  process.exit(0);
}

function run(label, style, opts = {}) {
  const out = {}, pay = [], mins = [], turns = [], floors = [], deep = [], cracks = []; let pieces = 0;
  for (let s = seed0; s < seed0 + n; s++) {
    const bots = [...Array(seats)].map(() => (V, P, r) => boardBot(V, P, r, style));
    const { result, state } = play(WELL_BOARD, { seats, bots, seed: s, opts: { seed: s * 7919, endless, ...opts }, steps: 4000 });
    if (!result) { out.unfinished = (out.unfinished || 0) + 1; continue; }
    const me = result.seats[0]; out[me.out] = (out[me.out] || 0) + 1;
    const landed = state.log.filter((x) => x.land === 0).length;
    pay.push(payOf(me)); turns.push(result.turns / seats); floors.push(me.floors); deep.push(me.deepest); cracks.push(me.cracks); pieces += me.haul.length;
    mins.push(me.floors * MINUTES.floor + (result.turns / seats) * MINUTES.turn + landed * 0);
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), m = mean(mins), p = mean(pay);
  console.log(`${label.padEnd(34)} ends: ${Object.entries(out).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ').padEnd(44)} turns ${f1(mean(turns)).padStart(5)}  floors played ${f1(mean(floors)).padStart(4)}  deepest ${f1(mean(deep))}  haul ${f1(pieces / n)}  cubes ${f1(p).padStart(6)}  minutes ${f1(m).padStart(5)}  x aim ${(p / Math.max(0.1, m) / ECON.perMinute).toFixed(2)}`);
}

console.log(`THE WELL'S BOARD x${n}${endless ? ' (endless)' : ''}, ${seats} seat${seats > 1 ? 's' : ''}; the aim ${ECON.perMinute} cubes a minute of play; today's Dunemaw run pays wellPay(3, 1) = ${wellPay(3, 1)}`);
run('plans, skill 0.80 (the default)', {});
run('throws any die, skill 0.80', { plan: 0 });
run('plans, skill 0.60 (learning)', { skill: 0.6 });
run('throws any die, skill 0.60', { plan: 0, skill: 0.6 });
run('plans, skill 0.95 (masterful)', { skill: 0.95 });
run('plans, 0.80, leaves at 2 cracks', { nerve: 2 });
run('plans, 0.80, never leaves', { nerve: 99 });
run('plans, 0.80, no re-roll', {}, { rerolls: 0 });
run('plans, 0.80, three re-rolls', {}, { rerolls: 3 });
