// ---------------------------------------------------------------------------------------
// THE CASINO'S SIMULATOR (docs/plans/CASINO.md section 8): each game of Raku's tables played by bots, thousands of times, headless, and
// its odds reported: who wins from which seat, how long a game runs, what the house keeps, how often each hand and arcana turns up. The
// numbers in the games' tables are tuned against this (the economy's way: scripts/economy.mjs), never by feel alone.
//
//   node scripts/casino.mjs [--game zodiac|eventhorizon|querent|supernova|nebula|all] [--n games] [--seats k] [--seed first]
// ---------------------------------------------------------------------------------------
import { play } from '../src/progress/casino/table.js';
import { ZODIAC, zodiacBot } from '../src/progress/casino/zodiac.js';
import { EVENT_HORIZON, horizonBot, EH } from '../src/progress/casino/eventhorizon.js';
import { QUERENT } from '../src/progress/casino/querent/rules.js';
import { querentBot } from '../src/progress/casino/querent/bots.js';
import { SUPERNOVA, supernovaBot } from '../src/progress/casino/supernova.js';
import { NEBULA, nebulaBot } from '../src/progress/casino/nebula.js';

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
function supernova(n = 4000, seats = 2) {
  const w = Array(seats).fill(0), styles = [0.2, 0.5, 0.8, 0.5, 0.5, 0.5]; let novas = 0, pts = [], turns = 0, dice = 0, maxed = 0, capped = 0;
  const bots = styles.slice(0, seats).map((b) => (V, P, r) => supernovaBot(V, P, r, { build: b }));
  for (let s = seed0; s < seed0 + n; s++) {
    const { result, state } = play(SUPERNOVA, { seats, bots, seed: s, opts: { first: s % seats } });
    w[result.winner]++; novas += result.novas.reduce((a, b) => a + b, 0); pts.push(result.points[result.winner]); turns += result.turns; if (result.turns >= 240) capped++;
    for (const h of state.hands) { dice += h.length; if (h.length >= 12) maxed++; }
  }
  pts.sort((a, b) => a - b);
  console.log(`SUPERNOVA ${seats}p x${n} (build ${styles.slice(0, seats).join('/')}, first seat turning): seat wins ${w.map((x) => pct(x, n)).join(' ')}; Supernovas a game ${(novas / n).toFixed(2)}; winning points median ${pts[pts.length >> 1]}; turns a game ${(turns / n).toFixed(1)} (capped ${capped}); dice in hand at the end ${(dice / n / seats).toFixed(1)} (full ${pct(maxed, n * seats)})`);
}
function supernovaStyles(n = 4000) {
  for (const b of [0, 0.25, 0.5, 0.75, 1]) {
    let won = 0;
    for (let s = seed0; s < seed0 + n; s++) { const bots = [(V, P, r) => supernovaBot(V, P, r, { build: b }), (V, P, r) => supernovaBot(V, P, r, { build: 0.5 })]; const { result } = play(SUPERNOVA, { seats: 2, bots, seed: s, opts: { first: s % 2 } }); if (result.winner === 0) won++; }
    console.log(`  SUPERNOVA build ${b} vs 0.5: wins ${pct(won, n)}`);
  }
}
function nebula(n = 2000, seats = 2) {
  const w = Array(seats).fill(0), style = [{ bluff: 0.25, read: 0.5, doubt: 0.3, leak: 0.6, noise: 0.1 }, { bluff: 0.4, read: 0.4, doubt: 0.25, leak: 0.5, noise: 0.15 }, { bluff: 0.1, read: 0.7, doubt: 0.35, leak: 0.7, noise: 0.05 }, { bluff: 0.3, read: 0.5, doubt: 0.3, leak: 0.5, noise: 0.1 }];
  let rounds = 0, bluffs = 0, caught = 0, outcomes = {};
  const bots = [...Array(seats)].map((_, q) => (V, P, r) => nebulaBot(V, P, r, style[q % 4]));
  for (let s = seed0; s < seed0 + n; s++) {
    const { result, state } = play(NEBULA, { seats, bots, seed: s, opts: { first: s % seats, styles: [...Array(seats)].map((_, q) => style[q % 4]) } });
    w[result.winner]++; rounds += result.rounds; bluffs += result.bluffs.reduce((a, b) => a + b, 0); caught += result.caught.reduce((a, b) => a + b, 0);
    for (const x of state.log) if (x.how) outcomes[x.how] = (outcomes[x.how] || 0) + 1;
  }
  console.log(`NEBULA ${seats}p x${n}: seat wins ${w.map((x) => pct(x, n)).join(' ')} (styles: steady, liar, reader, steady); rounds a game ${(rounds / n).toFixed(1)}; bluffs caught ${pct(caught, bluffs)}; rounds end by ${JSON.stringify(outcomes)}`);
}
function nebulaTells(n = 2000) {
  for (const read of [0, 0.5, 1]) {
    let won = 0; const a = { bluff: 0.25, read, doubt: 0.3, leak: 0.6, noise: 0.1 }, b = { bluff: 0.25, read: 0.5, doubt: 0.3, leak: 0.6, noise: 0.1 };
    for (let s = seed0; s < seed0 + n; s++) { const { result } = play(NEBULA, { seats: 2, bots: [(V, P, r) => nebulaBot(V, P, r, a), (V, P, r) => nebulaBot(V, P, r, b)], seed: s, opts: { first: s % 2, styles: [a, b] } }); if (result.winner === 0) won++; }
    console.log(`  NEBULA reading tells ${read} vs 0.5: wins ${pct(won, n)}`);
  }
}
const N = opt('n', null), K = opt('seats', null);
if (which === 'all' || which === 'zodiac') for (const k of K ? [+K] : [2, 3, 4]) zodiac(N ? +N : 2000, k);
if (which === 'all' || which === 'eventhorizon') for (const k of K ? [+K] : [1, 2, 4]) horizon(N ? +N : 20000, k);
if (which === 'all' || which === 'querent') for (const k of K ? [+K] : [2, 3, 4]) querent(N ? +N : 300, k);
if (which === 'all' || which === 'supernova') { for (const k of K ? [+K] : [2, 3, 4]) supernova(N ? +N : 4000, k); supernovaStyles(N ? +N : 4000); }
if (which === 'all' || which === 'nebula') { for (const k of K ? [+K] : [2, 3, 4]) nebula(N ? +N : 2000, k); nebulaTells(N ? +N : 2000); }
