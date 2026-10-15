// ---------------------------------------------------------------------------------------
// THE CASINO'S SIMULATOR (docs/plans/CASINO.md section 8): each game of Raku's tables played by bots, thousands of times, headless, and
// its odds reported: who wins from which seat, how long a game runs, what the house keeps, how often each hand and arcana turns up. The
// numbers in the games' tables are tuned against this (the economy's way: scripts/economy.mjs), never by feel alone.
//
//   node scripts/casino.mjs [--game zodiac|eventhorizon|querent|all] [--n games] [--seats k] [--seed first]
// ---------------------------------------------------------------------------------------
import { play } from '../src/progress/casino/table.js';
import { ZODIAC, zodiacBot } from '../src/progress/casino/zodiac.js';
import { EVENT_HORIZON, horizonBot, EH } from '../src/progress/casino/eventhorizon.js';
import { QUERENT } from '../src/progress/casino/querent/rules.js';
import { querentBot } from '../src/progress/casino/querent/bots.js';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const which = opt('game', 'all'), seed0 = +opt('seed', 1), pct = (a, b) => `${((100 * a) / Math.max(1, b)).toFixed(1)}%`;

function zodiac(n = 2000, seats = 2) {
  const w = Array(seats).fill(0); let st = 0, turns = 0;
  for (let s = seed0; s < seed0 + n; s++) { const { result } = play(ZODIAC, { seats, bots: [zodiacBot], seed: s }); if (result.stalled) st++; else w[result.winner]++; turns += result.turns; }
  console.log(`ZODIAC ${seats}p x${n}: seat wins ${w.map((x) => pct(x, n)).join(' ')}; stalled ${st}; turns a game ${(turns / n).toFixed(1)}`);
}
function horizon(n = 20000, seats = 1) {
  const net = Array(seats).fill(0), reads = {}; let house = 0, none = 0;
  for (let s = seed0; s < seed0 + n; s++) { const { result } = play(EVENT_HORIZON, { seats, bots: [horizonBot], seed: s }); result.net.forEach((v, i) => (net[i] += v)); house += result.houseNet; if (result.winner == null) none++; else reads[result.read] = (reads[result.read] || 0) + 1; }
  console.log(`EVENT HORIZON ${seats}p x${n}: return an ante by seat ${net.map((v) => (v / n / EH.ante).toFixed(3)).join(' ')}; the house keeps ${(house / n / EH.ante).toFixed(3)} antes a round; no hit ${pct(none, n)}; reads ${JSON.stringify(reads)}`);
}
function querent(n = 300, seats = 2) {
  const tiers = [0, 0, 0, 0], wins = Array(seats).fill(0), val = [], arc = {}; let rounds = 0, voids = 0, deaths = 0, turns = 0, errs = 0;
  for (let s = seed0; s < seed0 + n; s++) {
    try {
      const { result, state } = play(QUERENT, { seats, bots: [querentBot], seed: s, steps: 50000 });
      if (!result) { errs++; continue; }
      wins[result.winner]++; for (const w of result.wins) { tiers[w.tier]++; val.push(w.value); turns += w.turns; } rounds += result.wins.length;
      for (const x of state.log) { if (x.void != null) voids++; if (x.death != null && x.death !== 'spent') deaths++; if (x.flip != null) arc[x.flip] = (arc[x.flip] || 0) + 1; }
    } catch (e) { errs++; if (errs < 3) console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  }
  val.sort((a, b) => a - b);
  const flips = Object.values(arc).reduce((a, b) => a + b, 0);
  console.log(`QUERENT ${seats}p x${n}: errors ${errs}; seat wins ${wins.map((x) => pct(x, n)).join(' ')}; rounds won ${rounds}, void ${voids}, reset by Death ${deaths}; tiers 1/2/3 ${tiers.slice(1).map((x) => pct(x, rounds)).join(' ')}; value median ${val[val.length >> 1]}, 90th ${val[Math.floor(val.length * 0.9)]}, top ${val[val.length - 1]}; turns a won round ${(turns / Math.max(1, rounds)).toFixed(1)}; arcana flipped ${(flips / n).toFixed(1)} a game`);
}
const N = opt('n', null), K = opt('seats', null);
if (which === 'all' || which === 'zodiac') for (const k of K ? [+K] : [2, 3, 4]) zodiac(N ? +N : 2000, k);
if (which === 'all' || which === 'eventhorizon') for (const k of K ? [+K] : [1, 2, 4]) horizon(N ? +N : 20000, k);
if (which === 'all' || which === 'querent') for (const k of K ? [+K] : [2, 3, 4]) querent(N ? +N : 300, k);
