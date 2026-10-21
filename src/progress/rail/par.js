// ---------------------------------------------------------------------------------------
// A LEG'S PAR AND MEDAL, measured from the very leg sailed (docs/plans/RAIL-STANDARDS.md 3): what an expert scores on it, what a good
// player downs on it, so the rank and the medal answer to this leg at this waypoint's strength and storm, never to a table measured
// once on another crossing and left to go stale (the audit, 2026-10-21: par was three set pieces' constants, the whole trip ranked
// against the last one's, pirates 9% off). The stream (legs.js `flow`) is played by each player below; the score's rules (score.js)
// are applied to what each downs, with that player's habits.
//
// Prior art: Star Fox 64's medal (a hit count a stage: Corneria 150, Zoness 250: a number of downs, so a fast killer earns more of
// them; videogameschronicle.com's medal guide), Ikaruga's grade letters against fixed thresholds a chapter (shmups.wiki), Panzer
// Dragoon Orta's shot-down ratio, and the house's own simulators (scripts/rail.mjs's PROFILES, whose habits are kept here).
//
//   PLAYERS[name] = { kill (legs.js KILL's shape), pb, wind, order, lock, acc }
//   legScore(plan, player) -> { score, downs, came, escaped, bosses }   (expected, deterministic: a seeded stream of the plan's own)
//   legPar(plan) -> score   legMedal(plan) -> downs   legResult({ plan, score, downed, continued }) -> { par, medalAt, rank, medal }
//   tripResult(legs: [{ bars, score, par, medal }], { continues, adrift }) -> { rank, medal, share }
// ---------------------------------------------------------------------------------------
import { flow, KILL } from './legs.js';
import { ROSTER } from './showcase.js';
import { SCORE, chain, chainDown, volleyBonus, downScore } from './score.js';

/** The three players. `kill`: how fast they find and down (legs.js KILL: `each` a bar a foe, `flock` a swarm body, `good` shots a bar
 *  landed, `lights` eight lights); the habits are rail.mjs's: `pb` downs at point blank, `wind` downs in a windup, `order` the chance the
 *  next down keeps the chain's feeling, `lock` the bars a volley is let go (halved: a volley every other bar at most), `acc` a lance's
 *  share of hits (a volley pays only if every lock is downed). The expert lands the charybdistest's 39.5 shots a bar. */
export const PLAYERS = {
  novice: { kill: { ...KILL, good: 12, each: 1 / 3, flock: 1 / 6, lights: 2 / 3 }, pb: 0.05, wind: 0.05, order: 0.4, lock: 0.25, acc: 0.35 },
  good: { kill: KILL, pb: 0.15, wind: 0.15, order: 0.65, lock: 0.6, acc: 0.6 },
  expert: { kill: { ...KILL, good: 39.5, each: 1 / 9, flock: 1 / 18, lights: 1 / 4 }, pb: 0.3, wind: 0.3, order: 0.92, lock: 0.9, acc: 0.85 },
};
/** The medal's count sits a quarter of the way from what a good player downs to what an expert downs (Star Fox 64's medals ask more
 *  than a clear: Corneria's 150 is a strong run's, not a pass's), and the boss law's director pays its end to all (it is fought out). */
export const MEDAL = { between: 0.25 };
/** What a director's end and parts pay when beaten (score.js SCORE.end and .part): the set piece's whole worth to a player who fights
 *  it out, as the boss law makes every player do. */
const DIRECTOR = {
  shoal: SCORE.end.scattered,
  pirates: SCORE.end.sunk + 6 * SCORE.part.port + 4 * SCORE.part.rigging,
  leviathan: SCORE.end.felled + 4 * SCORE.part.gill + 6 * SCORE.part.tooth,
};

/** A seeded stream from a plan (its type, strength, storm): the same leg scores the same twice. */
function streamOf(plan, salt = 0) {
  let h = 2166136261 ^ salt; for (const ch of `${plan.type}|${plan.strength}|${plan.storm}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = h >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A player's expected run of one leg: the stream played at their pace, each down paid by the score's rules with their habits, the
 *  chain kept in kill order, a volley every other bar where the lock-on works (never overhead), the director's end paid. Averaged over
 *  `runs` seeded draws of the habits (the stream itself is deterministic). */
export function legScore(plan, player = PLAYERS.good, runs = 12) {
  const P = typeof player === 'string' ? PLAYERS[player] : player;
  const ev = flow(plan, P.kill);
  const downs = [], bosses = [];
  let came = 0, escaped = 0;
  for (const e of ev) {
    if (!e.wave || !e.k || e.bar >= plan.bars) continue;
    const R = ROSTER[e.wave.role], n = e.k.n - e.k.left, held = R?.moves?.until === 'beaten';
    came += e.k.n; escaped += held ? 0 : e.k.left;
    if (held) { bosses.push(e); continue; } // (a boss holds until beaten: counted below as felled)
    for (let i = 0; i < n; i++) downs.push({ at: e.alive[0] + (e.alive[1] - e.alive[0]) * (i + 1) / Math.max(1, n), cls: e.wave.cls ?? 0, wave: e, chains: e.wave.role !== 'swarm' }); // (a swarm stands outside the chain, as the shoal's fish do: RAIL-STANDARDS.md 3)
  }
  downs.sort((a, b) => a.at - b.at);
  const lockBars = plan.phases.filter((p) => p.view !== 'above').reduce((n, p) => n + (p.to - p.from), 0);
  let total = 0;
  for (let r = 0; r < runs; r++) {
    const rnd = streamOf(plan, r + 1), ch = chain(); let score = 0, last = null;
    for (const d of downs) {
      const pay = downScore({ cls: d.cls, pointBlank: rnd() < P.pb, windup: rnd() < P.wind });
      score += pay;
      if (!d.chains) continue;
      const aspect = d.wave === last || rnd() < P.order ? (ch.aspect || 'a') : (ch.aspect === 'a' ? 'b' : 'a'); last = d.wave;
      score += chainDown(ch, aspect, pay);
    }
    for (let b = 0; b < lockBars; b++) if (rnd() < P.lock / 2) { let all = true; for (let i = 0; i < 8; i++) if (rnd() >= 0.5 + P.acc / 2) all = false; score += all ? volleyBonus(8, 8) : 0; }
    total += score;
  }
  const director = plan.events.find((e) => e.director)?.director;
  const bossPay = (DIRECTOR[director] || 0) + bosses.reduce((n, e) => n + downScore({ cls: e.wave.cls ?? 0 }) * 3, 0); // (a boss of the roster fought out: three times its class, its parts' worth)
  return { score: Math.round(total / runs + bossPay), downs: downs.length + bosses.length + (director ? 1 : 0), came, escaped, bosses: bosses.length + (director ? 1 : 0) };
}

const cache = new Map();
const keyOf = (plan) => `${plan.type}|${plan.strength}|${plan.storm}|${plan.first}|${plan.bars}`;
function both(plan) {
  const k = keyOf(plan); if (cache.has(k)) return cache.get(k);
  const v = { expert: legScore(plan, PLAYERS.expert), good: legScore(plan, PLAYERS.good) };
  if (cache.size > 64) cache.clear(); cache.set(k, v); return v;
}
/** Par: the expert's expected score on this very leg (S at par, then halving: score.js SCORE.rank). */
export const legPar = (plan) => both(plan).expert.score;
/** The medal's count of downs on this leg (MEDAL.between of the way from the good player's to the expert's). */
export function legMedal(plan) { const { good, expert } = both(plan); return Math.round(good.downs + (expert.downs - good.downs) * MEDAL.between); }
/** A leg's result as sailed: its par, its medal's count, the rank its score earns, and whether the medal is won (no continue on it). */
export function legResult({ plan, score = 0, downed = 0, continued = false }) {
  const par = legPar(plan), medalAt = legMedal(plan);
  let rank = 'D'; for (const [r, share] of SCORE.rank) if (score >= par * share) { rank = r; break; }
  return { par, medalAt, rank, medal: !continued && downed >= medalAt };
}
/** A trip's result from its legs (RAIL-OVERHAUL.md 9: the legs' ranks weighed by their bars): the score's share of par summed over
 *  the legs' bars, banded as a leg's is; the medal only when every fighting leg (par above 0) won its own, with no continue. A
 *  continue or an adrift run caps the rank at C (score.js's rule, as voyage.js keeps it). */
export function tripResult(legs = [], { continues = 0, adrift = false } = {}) {
  const fighting = legs.filter((l) => l.par > 0), bars = fighting.reduce((n, l) => n + (l.bars || 1), 0);
  if (!fighting.length) return { rank: 'D', medal: false, share: 0 };
  const share = fighting.reduce((n, l) => n + Math.min(2, l.score / l.par) * (l.bars || 1), 0) / bars;
  let rank = 'D'; for (const [r, s] of SCORE.rank) if (share >= s) { rank = r; break; }
  if ((continues || adrift) && 'SAB'.includes(rank)) rank = 'C';
  return { rank, medal: !continues && fighting.every((l) => l.medal), share: +share.toFixed(3) };
}
