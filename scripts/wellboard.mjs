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
const n = +opt('n', 400), seed0 = +opt('seed', 1), endless = args.includes('--endless'), seats = +opt('seats', 1);
const pct = (a, b) => `${((100 * a) / Math.max(1, b)).toFixed(0)}%`, f1 = (x) => x.toFixed(1);

if (opt('show', null)) { // one board, drawn as text
  const G = { fight: 'F', genre: 'T', cache: 'c', spring: '+', hazard: '!', rest: 'R', door: 'D', foe: 'X', shop: '$', item: 'i', arcana: 'A' }, ch = (s) => (s.kind === 'shift' ? (s.shift > 0 ? '>' : '<') : G[s.kind]);
  for (let d = 0; d < BOARD.floors; d++) {
    const F = layOut(+opt('show'), d, { last: d === BOARD.floors - 1 }), main = [], side = [];
    for (const s of Object.values(F.spaces)) (s.side ? side : main).push(s);
    console.log(`floor ${d + 1}  main ${main.map(ch).join(' ')}   ${F.side.which} from ${F.side.from} to ${F.side.to}: ${side.map(ch).join(' ')}`);
  }
  console.log('F fight  T trial  c cache  + spring  ! hazard  R rest  < > shift  $ shop  i item  A arcana  D door  X the FOE');
  process.exit(0);
}

function run(label, style, opts = {}, rivals = seats - 1) {
  const out = {}, pay = [], mins = [], turns = [], floors = [], deep = [], place = [0, 0, 0, 0], N = 1 + rivals; let pieces = 0, duels = 0, cards = 0, items = 0;
  for (let s = seed0; s < seed0 + n; s++) {
    const bots = [...Array(N)].map((_, q) => (V, P, r) => boardBot(V, P, r, q ? {} : style));
    const { result, state } = play(WELL_BOARD, { seats: N, bots, seed: s, opts: { seed: s * 7919, endless, ...opts }, steps: 6000 });
    if (!result) { out.unfinished = (out.unfinished || 0) + 1; continue; }
    const me = result.seats[0]; out[me.out] = (out[me.out] || 0) + 1;
    const mine = state.log.filter((x) => x.throw === 0).length;
    pay.push(payOf(me)); turns.push(mine); floors.push(me.floors); deep.push(me.deepest); pieces += me.haul.length;
    duels += state.log.filter((x) => x.duel != null).length; cards += state.log.filter((x) => x.arcana === 0).length; items += state.log.filter((x) => x.use === 0).length;
    place[result.standings.findIndex((x) => x.seat === 0)]++;
    mins.push(me.floors * MINUTES.floor + mine * MINUTES.turn);
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), m = mean(mins), p = mean(pay);
  console.log(`${label.padEnd(36)} ends: ${Object.entries(out).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ').padEnd(46)} turns ${f1(mean(turns)).padStart(5)}  floors ${f1(mean(floors)).padStart(4)}  deepest ${f1(mean(deep))}  haul ${f1(pieces / n)}  cubes ${f1(p).padStart(6)}  min ${f1(m).padStart(5)}  x aim ${(p / Math.max(0.1, m) / ECON.perMinute).toFixed(2)}  items used ${f1(items / n)}  cards ${f1(cards / n)}${N > 1 ? `  duels ${f1(duels / n)}  places ${place.slice(0, N).map((x) => pct(x, n)).join(' ')}` : ''}`);
}

console.log(`THE WELL'S BOARD x${n}${endless ? ' (endless)' : ''}, ${seats} seat${seats > 1 ? 's' : ''}; the aim ${ECON.perMinute} cubes a minute of play; today's Dunemaw run pays wellPay(3, 1) = ${wellPay(3, 1)}`);
run('alone: plans, skill 0.80', {}, {}, 0);
run('alone: throws any die, 0.80', { plan: 0 }, {}, 0);
run('alone: plans, skill 0.60', { skill: 0.6 }, {}, 0);
run('alone: plans, skill 0.95', { skill: 0.95 }, {}, 0);
run('3 rivals: plans, skill 0.80', {}, {}, 3);
run('3 rivals: throws any die, 0.80', { plan: 0 }, {}, 3);
run('3 rivals: plans, skill 0.60', { skill: 0.6 }, {}, 3);
run('3 rivals: plans, skill 0.95', { skill: 0.95 }, {}, 3);
