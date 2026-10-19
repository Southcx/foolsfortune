// ---------------------------------------------------------------------------------------
// THE PUZZLE DUELS' SIMULATOR (docs/plans/PUZZLE-DUELS.md section 10): duels between bots, headless, under each Figment's ruleset, and
// what they say: how long a duel runs (turns a side), how it ends (the line, a full side, the cap), junk sent a turn, the longest
// chain, and every settle that hit its cap or looped (a ruleset's bug). The action points and the line's rate are tuned against this.
//
//   node scripts/duel.mjs [--rules fury|grief|mirth|all] [--n duels] [--ap points | --ap0 a --ap1 b] [--pool p] [--seed first] [--sample tries]
//                         [--forms hand,courier]   (--ap0 10 --ap1 5: a side of two players against one Figment, section 12)
// ---------------------------------------------------------------------------------------
import { newDuel, DUEL } from '../src/progress/duel/duel.js';
import { play } from '../src/progress/duel/bot.js';
import { RULESETS } from '../src/progress/duel/rulesets.js';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const which = opt('rules', 'all'), n = +opt('n', 10), seed0 = +opt('seed', 1), sample = +opt('sample', 40);
const forms = opt('forms', 'hand,courier').split(',');
DUEL.ap = +opt('ap', DUEL.ap);
const ap = [+opt('ap0', DUEL.ap), +opt('ap1', DUEL.ap)], pool = +opt('pool', DUEL.pool);

for (const key of which === 'all' ? Object.keys(RULESETS) : [which]) {
  const ends = {}, wins = [0, 0, 0]; let plies = 0, sent = 0, caps = 0, chain = 0, kinds = {}, breaks = 0, drunk = 0;
  const t0 = Date.now();
  for (let seed = seed0; seed < seed0 + n; seed++) {
    const s = newDuel({ ruleset: RULESETS[key], seed, forms, ap, pool });
    for (let guard = 0; s.winner === null && guard < DUEL.turnCap * 2 + 2; guard++) {
      for (const e of play(s, { sample })) {
        if (e.type === 'chain') chain = Math.max(chain, e.step);
        if (e.type.startsWith('duel.')) ends[e.type] = (ends[e.type] || 0) + 1;
        if (['run', 'push', 'punt', 'swap', 'drag', 'rotate', 'drop', 'form', 'shot', 'hook', 'drill', 'toll', 'flail', 'coup'].includes(e.type)) kinds[e.type] = (kinds[e.type] || 0) + 1;
      }
    }
    plies += s.ply; breaks += s.sides[0].breaks + s.sides[1].breaks; drunk += s.sides[0].drunk + s.sides[1].drunk; sent += s.sides[0].total + s.sides[1].total; caps += s.capHits;
    wins[s.winner === -1 ? 2 : s.winner]++;
  }
  console.log(`${key.toUpperCase()} x${n} at ${ap.join('/')} AP: turns a side ${(plies / n / 2).toFixed(1)}; ends ${JSON.stringify(ends)}; wins first ${wins[0]} second ${wins[1]} drawn ${wins[2]};`
    + ` junk a turn ${(sent / Math.max(1, plies)).toFixed(2)}; longest chain ${chain}; breaks a duel ${(breaks / n).toFixed(1)}; motes drunk a duel ${(drunk / n).toFixed(1)}; settles capped ${caps}; actions ${JSON.stringify(kinds)}; ${((Date.now() - t0) / n / 1000).toFixed(1)} real s a duel`);
}
