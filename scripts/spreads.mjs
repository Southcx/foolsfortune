// ---------------------------------------------------------------------------------------
// THE SPREADS' COVERAGE (docs/plans/SPREADS.md 7): before the tallies' numbers are set, measure what a spread can light and what a
// player can make of it. For each spread, many lays drawn from a seeded stream: random Majors bound (as many as the spread asks to be
// opened), laid at random, upright or reversed; then the items placed as a careful player would (each lit cell given an item of its
// best suit, a stack counting once) and as a careless one would (the Box filled in pickup order, suits at random). It reports the
// cells lit, the cells dark, and each suit's tally at the median and the 90th percentile, against the cap.
//
//   node scripts/spreads.mjs [--lays 2000] [--seed 7]
// ---------------------------------------------------------------------------------------
import { SPREADS, MAJOR_SUIT, SUITS, TALLY, light, tally, COLS, ROWS, checkFootprints, SEASON_SUIT } from '../src/progress/spreads.js';
import { ARCANA } from '../src/tools/veritome/arcana.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const LAYS = arg('lays', 2000);
let seed = arg('seed', 7) >>> 0;
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const bad = checkFootprints(Object.fromEntries(ARCANA.map((A) => [A.id, A.rank])));
if (bad.length) { console.log('FOOTPRINTS out of step with the card ranks:', bad.join('; ')); process.exitCode = 1; }

const MAJORS = Object.keys(MAJOR_SUIT).filter((c) => c !== 'fool');
const BOUND_AT = { one: 1, three: 3, horseshoe: 7, celtic: 12 }; // (how many are bound when each spread opens: SPREADS.md 5.5)
const CTX = { since: 0.5, fight: true, company: false, pool: 0.8, goals: 0.5 };
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const KIND_OF = { wands: 'shell', cups: 'bottle', swords: 'key', pentacles: 'material' };

for (const S of Object.values(SPREADS)) {
  const top0 = [], top3 = [], courts = {};
  const lit = [], dark = [], careful = Object.fromEntries(SUITS.map((s) => [s, []])), careless = Object.fromEntries(SUITS.map((s) => [s, []]));
  for (let n = 0; n < LAYS; n++) {
    const bound = shuffle(MAJORS).slice(0, BOUND_AT[S.id] + 1);
    const pair = bound[0], hand = shuffle(bound.slice(1));
    const laid = {};
    for (const p of S.positions) if (!p.pair && !p.fixed && hand.length) laid[p.id] = { card: hand.pop(), reversed: rnd() < 0.25 };
    const cells = light(S.id, laid, { ...CTX, pair, bound: new Set(bound) });
    lit.push(cells.filter((c) => !c.dark && (c.wild || SUITS.some((s) => c[s] > 0))).length);
    dark.push(cells.filter((c) => c.dark).length);
    // careful: every lit cell holds an item of the suit it carries most of (wild: any suit, the one with the least so far)
    const want = cells.map((c) => {
      if (c.dark) return null;
      const best = SUITS.filter((s) => c[s] > 0).sort((a, b) => c[b] - c[a])[0];
      return best ? { kind: KIND_OF[best] } : c.wild ? { kind: KIND_OF[pick(SUITS)] } : null;
    });
    const t1 = tally(cells, want).sums;
    // careless: 40 items in the Box at random suits, in pickup order
    const loose = Array.from({ length: COLS * ROWS }, (_, i) => (i < 40 ? { kind: KIND_OF[pick(SUITS)] } : null));
    const t2 = tally(cells, shuffle(loose)).sums;
    for (const s of SUITS) { careful[s].push(t1[s]); careless[s].push(t2[s]); }
    // the three additions (SPREADS.md 11): the day's card one of those laid, a season at random; the careful top suit and the court
    const dayC = Object.values(laid)[0]?.card, season = pick(Object.keys(SEASON_SUIT));
    const cells3 = light(S.id, laid, { ...CTX, pair, bound: new Set(bound), dayCard: dayC });
    const t3 = tally(cells3, want, { season });
    top0.push(Math.max(...SUITS.map((x) => t1[x]))); top3.push(Math.max(...SUITS.map((x) => t3.sums[x])));
    courts[t3.class.id] = (courts[t3.class.id] || 0) + 1;
  }
  const row = (o) => SUITS.map((s) => `${s} ${q(o[s], 0.5).toFixed(1)}/${q(o[s], 0.9).toFixed(1)}`).join('  ');
  console.log(`\n${S.label} (${S.positions.length} positions, ${BOUND_AT[S.id]} bound)`);
  console.log(`  cells lit   median ${q(lit, 0.5)}  p90 ${q(lit, 0.9)} of ${COLS * ROWS};  dark median ${q(dark, 0.5)}  p90 ${q(dark, 0.9)}`);
  console.log(`  careful     ${row(careful)}   (median/p90, cap ${TALLY.cap})`);
  console.log(`  careless    ${row(careless)}`);
  console.log(`  + day, season: careful top suit median ${q(top0, 0.5).toFixed(1)} -> ${q(top3, 0.5).toFixed(1)}, p90 ${q(top0, 0.9).toFixed(1)} -> ${q(top3, 0.9).toFixed(1)}`);
  const cs = Object.entries(courts).sort((a, b) => b[1] - a[1]);
  const kinds = { court: 0, major: 0 }; for (const [k, n] of cs) kinds[k.startsWith('arcana.') ? 'major' : 'court'] += n;
  console.log(`  classes      ${cs.length} seen (courts ${(kinds.court / LAYS * 100).toFixed(0)}%, Majors ${(kinds.major / LAYS * 100).toFixed(0)}%); most ${cs.slice(0, 4).map(([k, n]) => `${k} ${(n / LAYS * 100).toFixed(0)}%`).join(', ')}`);
}
