// ---------------------------------------------------------------------------------------
// QUERENT'S BOTS (docs/plans/CASINO.md section 7): an opponent good enough to measure the game with, and the seed of the
// folk's seats at Raku's tables. Its hand sense is Mahjong's tile efficiency in miniature: a card is worth what it connects to (its pairs,
// its neighbours a rank or two off), and the least connected is thrown. It steals what finishes a meld, declares the Fate Clause the moment
// it can (by draw), and answers the arcana simply. `style` leans it: `thief` (0..1) steals for less than a finished meld.
//
// Prior art: Mahjong AI's shanten and tile efficiency (the ukeire count, simplified), the house's other bots (zodiacBot, horizonBot).
//
//   querentBot(view, pending, r, style?)   linkOf(card, hand)
// ---------------------------------------------------------------------------------------
import { isWin } from './score.js';

/** How much a card in a hand connects: another of its rank counts most, a neighbour a rank off next, two off a little. */
export function linkOf(c, hand) {
  let k = 0; for (const o of hand) { if (o === c) continue; const d = Math.abs(o.r - c.r); k += d === 0 ? 2 : d === 1 ? 1.2 : d === 2 ? 0.5 : 0; }
  return k;
}
const melded = (hand) => { let n = 0; for (const c of hand) if (hand.filter((o) => o.r === c.r).length >= 3 || (hand.some((o) => o.r === c.r + 1) && hand.some((o) => o.r === c.r + 2))) n++; return n; };

export function querentBot(V, P, r, style = {}) {
  const pick = (score) => { let b = P.moves[0], bs = -Infinity; for (const m of P.moves) { const s = score(m) + r() * 1e-3; if (s > bs) { bs = s; b = m; } } return b; };
  switch (P.kind) {
    case 'fate': return pick((m) => (m.fate === 'draw' ? 2 : m.fate === 'steal' ? 1 : 0));
    case 'win': return P.moves.find((m) => m.win) || P.moves[0];
    case 'acquire': return pick((m) => {
      if (m.draw) return 1;
      const top = V.tops[m.steal]; if (!top || top.hidden) return -1;
      if (isWin([...V.hand, top], V.quads) || isWin([...V.hand, top].slice(1), V.quads)) return 10;
      return melded([...V.hand, top]) - melded(V.hand) >= 3 ? 1 + (style.thief ?? 0.4) : -1;
    });
    case 'discard': return pick((m) => -linkOf(V.hand[m.discard], V.hand) - (V.hand[m.discard].r >= 11 ? 0.1 : 0));
    case 'fool': return pick((m) => (m.arcana === 8 ? 3 : m.arcana === 21 ? 2 : 0));
    case 'hierophant': return pick((m) => V.hand.filter((c) => c.r === m.rank).length);
    case 'lovers': return pick((m) => V.players[m.target].arcana);
    case 'judgment': return pick((m) => V.players[m.target].stole);
    case 'wheel': return pick((m) => m.throw.reduce((a, i) => a + (linkOf(V.hand[i], V.hand) < 1 ? 1 : -2), 0));
    default: return P.moves[0]; // (the Hermit keeps its order; the Sun looks at whoever is first)
  }
}
