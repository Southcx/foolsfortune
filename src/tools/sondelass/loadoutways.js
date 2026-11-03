// ---------------------------------------------------------------------------------------
// A LOCKED MOVE'S TWO WAYS (docs/plans/GAPS.md G139; MELEE-LOADOUT-EARNING.md section 2, Dovina's earning): the count way (the patient)
// and the feat way (the skilled) of each move of the melee loadout's catalogue, as the loadout editor's cards and the Codex's tree show
// them, each with how far the ledger has it ("12 of 60"). Dovina's `unlock` predicates (progress/combat/moves.js) decide; they are
// closures with no words, so this table names what each one counts, as written in her plan's table ("As written"), keyed by the
// ledger keys her helpers read (`hits(move, n)` is `sond.move.<move>.hit`, `finishes` `.finish`, `uses(key, n)` a count, `best` a record).
// A row of hers that carries its own `ways` wins (the ask: docs/handoffs/dovina/2026-11-03-from-calissa-move-ways.md). The words are
// placeholders for Espada's.
//
// Prior art: Old School RuneScape's quest and skill requirements (each one shown with what you have of it), Monster Hunter's weapon
// tree (a branch with what it asks), God Hand's technique shop growing out of the Combo Tree.
//
//   waysOf(id) -> { count: [way], feat: [way] } | null      way = { key, n, best? }
//   wayWords(way, labelOf, catalogue) -> its line ('Land Slash 60 times')     wayHave(way, L) -> the ledger's number now
// ---------------------------------------------------------------------------------------
import * as RULES from '../../progress/combat/moves.js';

const H = (move, n) => ({ key: `sond.move.${move}.hit`, n });
const F = (move, n) => ({ key: `sond.move.${move}.finish`, n });
const U = (key, n) => ({ key, n });
const B = (key, n) => ({ key, n, best: true });
const KICK = (n) => U('kick.hit', n);

/** id -> [count ways, feat ways]: Dovina's predicates, read off progress/combat/moves.js. */
const TABLE = {
  quickSlash: [[H('c1', 60)], [F('c1', 5)]], bodyBlow: [[H('c1', 60)], [F('c1', 5)]],
  backhand: [[H('c2', 60)], [F('c2', 5)]], guardBreak: [[H('c2', 60)], [F('c2', 5), U('sond.effect.guardBreak', 3)]],
  lungeSlash: [[H('c3', 60)], [F('c3', 5)]], lowSweep: [[H('c3', 60)], [F('c3', 5), U('sond.effect.trip', 3)]],
  heavyChop: [[H('c4', 60)], [F('c4', 5)]], pushKick: [[H('c4', 60), KICK(60)], [F('c4', 5), U('sond.effect.knock', 5)]],
  spinSlash: [[H('backhand', 60)], [B('sond.struck.best', 3)]], powerSlash: [[H('heavyChop', 60)], [F('heavyChop', 5)]],
  risingCut: [[H('quickSlash', 60)], [U('move.launch', 10)]], guardCrush: [[U('cut.stinger', 30)], [U('sond.effect.guardBreak', 1)]],
  backstepSlash: [[H('c3', 30)], [U('parry.sondelass', 10)]],
  frontKick: [[H('c2', 60), KICK(60)], [F('c2', 5)]], roundKick: [[H('c1', 60), KICK(60)], [F('c1', 5), U('sond.effect.knock', 5)]],
  sideKick: [[H('c4', 60), KICK(60)], [F('c4', 5), U('sond.effect.knock', 5)]], kneeStrike: [[H('c3', 60), KICK(60)], [F('c3', 5)]],
  lowKick: [[H('c3', 60), KICK(60)], [F('c3', 5), U('sond.effect.trip', 3)]], straightPunch: [[H('c3', 60), KICK(60)], [F('c3', 5)]],
  hookPunch: [[H('c2', 60), KICK(60)], [F('c2', 5)]],
  flyingKick: [[H('pushKick', 60), KICK(150)], [U('sond.effect.knock', 10)]], tornadoKick: [[H('roundKick', 60), KICK(150)], [B('sond.struck.best', 3)]],
  spinHeelKick: [[H('sideKick', 60), KICK(150)], [F('sideKick', 5)]], risingKick: [[H('frontKick', 60), KICK(150)], [U('move.launch', 10)]],
  flurry: [[H('bodyBlow', 60), KICK(150)], [F('bodyBlow', 5)]], breakKick: [[H('guardBreak', 60), KICK(150)], [U('sond.effect.guardBreak', 3)]],
  tidecutter: [[U('cut.hit', 500)], []],
};

/** A move's two ways: Dovina's row's own `ways` if it carries them, else the table. */
export function waysOf(id) {
  const own = RULES.MOVES?.sondelass?.[id]?.ways; if (own?.count || own?.feat) return { count: own.count || [], feat: own.feat || [] };
  const t = TABLE[id]; return t ? { count: t[0], feat: t[1] } : null;
}

/** A way's line (words placeholders for Espada's). */
export function wayWords(w, labelOf, catalogue) {
  if (w.words) return w.words;
  const mv = /^sond\.move\.(\w+)\.(hit|finish)$/.exec(w.key), name = (id) => (catalogue?.[id] ? labelOf(catalogue[id]) : id);
  if (mv) return mv[2] === 'hit' ? `Land ${name(mv[1])} ${w.n} times` : `Finish ${w.n} strings with ${name(mv[1])}`;
  const n = w.n, s = n === 1 ? '' : 's';
  return ({
    'kick.hit': `Land ${n} unarmed kicks`, 'cut.stinger': `Land ${n} Stingers`, 'cut.hit': `Land ${n.toLocaleString('en-GB')} cutlass blows`,
    'sond.effect.guardBreak': n === 1 ? 'Break a guard' : `Break ${n} guards`, 'sond.effect.trip': `Trip ${n} creature${s}`, 'sond.effect.knock': `Knock ${n} creature${s} away`,
    'move.launch': `Launch ${n} creature${s}`, 'sond.struck.best': `Strike ${n} with one blow`, 'parry.sondelass': `Parry ${n} time${s} with the Sondelass`,
  })[w.key] || `${w.key} ${n}`;
}

/** The ledger's number for a way now (a record for a `best` way); a read that throws is 0. */
export function wayHave(w, L) { try { return +(w.best ? L?.best?.(w.key) : L?.get?.(w.key)) || 0; } catch { return 0; } }
