// ---------------------------------------------------------------------------------------
// THE PAIRS' ACHIEVEMENTS (docs/plans/TOOLS-TOGETHER.md 8: "Each pair has one pair special, opened by an achievement done with that pair
// worn"): one a pair of the 21, the GENERAL category's "Pairs" sub, a predicate over the counts kept with the pair worn
// (feedback/tracking/pairs.js): 50 creatures downed, or 40 of the sub's verb lent, whichever first (progress/toolpairs.js PAIR_OPEN).
// Names are the pairs' cards (Espada's words may come). And one for every pair's special opened.
//
// Prior art: Persona's social links (a card's bond deepened by time spent with it), the house's own achievements.js (its helpers passed in).
//
//   pairAchievements({ F })   (achievements.js calls it inside buildAchievements)
// ---------------------------------------------------------------------------------------
import { PAIRS, PAIR_OPEN, PAIR_SPECIALS, pairSpecialOpen } from './toolpairs.js';

export function pairAchievements({ F }) {
  for (const P of PAIRS) {
    const cur = (L) => Math.max(Math.min(PAIR_OPEN.downs, L.get(`pair.${P.n}.down`) || 0), Math.round(Math.min(PAIR_OPEN.lends, L.get(`pair.${P.n}.lend`) || 0) * PAIR_OPEN.downs / PAIR_OPEN.lends));
    F(`pr${P.n}`, 'general', 'Pairs', 2, 'mechanic', P.card, `With your ${P.tools.join(' and ')} worn together, down ${PAIR_OPEN.downs} creatures or lend ${PAIR_OPEN.lends} times. Opens ${PAIR_SPECIALS[P.n].label}.`, cur, PAIR_OPEN.downs);
  }
  F('pr22', 'general', 'Pairs', 5, 'collect', 'The Fool\'s Journey', 'Open every pair\'s special.', (L) => PAIRS.filter((P) => pairSpecialOpen(P.n, L)).length, PAIRS.length);
}
