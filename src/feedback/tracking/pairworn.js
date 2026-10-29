// ---------------------------------------------------------------------------------------
// TRACKING, A PAIR WORN: the counts a pair's special opens by (progress/toolpairs.js PAIR_OPEN; TOOLS-TOGETHER.md 8): a creature downed and
// the sub's verb lent, each with the belt's pair worn (`pair.<n>.down`, `pair.<n>.lend`), and the special said once when its pair opens it.
// Placeholder words, Espada's.
//
//   pairWornRules({ on, L, log, g })   (tracking/rules.js calls it)   events: pair.open { pair, card, by } (once a pair a build)
// ---------------------------------------------------------------------------------------
import { pairOf, pairSpecialOpen, PAIR_SPECIALS } from '../../progress/toolpairs.js';

export function pairWornRules({ on, L, log, g }) {
  const worn = () => pairOf(g?.belt?.main, g?.belt?.sub);
  const told = (P) => { if (L.get(`pair.${P.n}.open`) || !pairSpecialOpen(P.n, L)) return; L.inc(`pair.${P.n}.open`);
    g?.events?.emit('pair.open', { pair: P.n, card: P.card, by: 'courier' });
    log.say('gain', `${P.card}: your ${P.tools.join(' and ')} together open ${PAIR_SPECIALS[P.n]?.label || 'their special'}. ${PAIR_SPECIALS[P.n]?.line || ''}`); };
  on('creature.struck', (e) => { if (e.by !== 'courier' || !e.kill) return; const P = worn(); if (!P) return; L.inc(`pair.${P.n}.down`); told(P); });
  on('tool.lend', (e) => { if (e.by !== 'courier') return; const P = worn(); if (!P) return; L.inc(`pair.${P.n}.lend`); told(P); });
}
