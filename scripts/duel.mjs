// ---------------------------------------------------------------------------------------
// THE PUZZLE DUELS' SIMULATOR (docs/plans/PUZZLE-DUELS.md section 10): duels between bots, headless, under each Figment's ruleset, and
// what they say: how long a duel runs (turns a side), how it ends (the line, a full side, the cap), junk sent a turn, the longest
// chain, and every settle that hit its cap or looped (a ruleset's bug). The action points and the line's rate are tuned against this.
//
//   node scripts/duel.mjs [--rules fury|grief|mirth|all] [--n duels] [--ap points] [--seed first] [--sample tries] [--forms hand,courier]
// ---------------------------------------------------------------------------------------
import { newDuel, DUEL } from '../src/progress/duel/duel.js';
import { play } from '../src/progress/duel/bot.js';
import { RULESETS } from '../src/progress/duel/rulesets.js';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const which = opt('rules', 'all'), n = +opt('n', 10), seed0 = +opt('seed', 1), sample = +opt('sample', 40);
const forms = opt('forms', 'hand,courier').split(',');
DUEL.ap = +opt('ap', DUEL.ap);

for (const key of which === 'all' ? Object.keys(RULESETS) : [which]) {
  const ends = {}, wins = [0, 0, 0]; let plies = 0, sent = 0, caps = 0, chain = 0, kinds = {};
  const t0 = Date.now();
  for (let seed = seed0; seed < seed0 + n; seed++) {
    const s = newDuel({ ruleset: RULESETS[key], seed, forms });
    for (let guard = 0; s.winner === null && guard < DUEL.turnCap * 2 + 2; guard++) {
      for (const e of play(s, { sample })) {
        if (e.type === 'chain') chain = Math.max(chain, e.step);
        if (e.type === 'duel.line' || e.type === 'duel.full' || e.type === 'duel.cap') ends[e.type] = (ends[e.type] || 0) + 1;
        if (['step', 'push', 'punt', 'swap', 'drag', 'rotate', 'drop', 'form'].includes(e.type) && !e.forced) kinds[e.type] = (kinds[e.type] || 0) + 1;
      }
    }
    plies += s.ply; sent += s.sides[0].total + s.sides[1].total; caps += s.capHits;
    wins[s.winner === -1 ? 2 : s.winner]++;
  }
  console.log(`${key.toUpperCase()} x${n} at ${DUEL.ap} AP: turns a side ${(plies / n / 2).toFixed(1)}; ends ${JSON.stringify(ends)}; wins first ${wins[0]} second ${wins[1]} drawn ${wins[2]};`
    + ` junk a turn ${(sent / Math.max(1, plies)).toFixed(2)}; longest chain ${chain}; settles capped ${caps}; actions ${JSON.stringify(kinds)}; ${((Date.now() - t0) / n / 1000).toFixed(1)} real s a duel`);
}
