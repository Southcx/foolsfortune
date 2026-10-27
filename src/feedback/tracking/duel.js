// ---------------------------------------------------------------------------------------
// TRACKING, A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md; the session world/duel/duelsession.js): an aberrant's duel said in the log (the
// only text feedback) and kept on the ledger: begun, the Figment broken by your junk, and its end, won (drained, or the finisher), lost, or fled.
// The words are Espada's (docs/LORE.md, "The puzzle duel's words"); the log says "duel", the genre's word.
//
//   duel.pull { foe }   duel.slip   duel.open { kind, feeling }   duel.break { kind, depth }   duel.flee { roll, reroll, need, ok }   duel.end { kind, won, how, turns, atOnce }   duel.undo { left }   (each with `by`)
//   the one-gesture duel (PUZZLE-DUELS.md 22): duel.chain { step, weak } (each step from 2)   duel.skill { tool }   duel.charge { tool } (a skill full)   duel.land { n, kind } (by creature)   duel.allclear { n }
//
//   duelRules({ on, L, log })   (feedback/tracking/rules.js calls it)   any event with `practice: true` (Strawman's) is said, never counted
// ---------------------------------------------------------------------------------------

import { SKILLS } from '../../progress/duel/skills.js';

const skillLabel = (tool) => SKILLS[tool]?.label || tool;

export function duelRules({ on: onAny, L: ledger, log }) {
  // A practice duel (Strawman's at the sparring circle: `practice: true` on every duel.* event, world/duel/duelsession.js) is said in the
  // log but never counted: its events reach these rules with a ledger that keeps nothing (Strawman never counts: STRAWMAN.md, the glossary).
  const quiet = { inc() {}, hi() {}, lo() {}, first() {}, get: (k) => ledger.get(k) };
  let L = ledger;
  const on = (type, fn) => onAny(type, (e) => { L = e?.practice ? quiet : ledger; try { fn(e); } finally { L = ledger; } });
  // the pull (world/duel/duelfoes.js): its look and sound say it; the log says only an escape (a plain placeholder line, Espada's to word)
  on('duel.slip', (e) => { if (e.by !== 'courier') return; L.inc('duel.slip'); log.say('battle', 'You pull away from the aberrant.', { key: 'duel.slip', throttle: 2 }); });
  on('duel.open', (e) => { L.inc('duel.open'); log.say('battle', e.practice ? 'Strawman stands for a practice duel.' : 'An aberrant Figment seizes your mind. The duel begins.'); }); // (the practice line a placeholder, Espada's to word)
  on('duel.break', (e) => { if (e.by !== 'courier') return; L.inc('duel.break'); log.say('battle', 'You break the Figment.', { key: 'duel.break', throttle: 1 }); });
  on('duel.undo', (e) => { if (e.by !== 'courier') return; L.inc('duel.undo'); log.say('battle', 'You take back your last move.', { key: 'duel.undo', throttle: 1 }); }); // (a placeholder line, Espada's to word)
  // duel.flee { roll, reroll, need, ok, by }: the saving throw out (progress/duel/flee.js; the plan's lines, section 15); `reroll` the first roll
  // when Luck threw it again (game.rerolls spends one: progress/dice.js), said before the result (a placeholder line, Espada's to word)
  on('duel.flee', (e) => {
    if (e.by !== 'courier') return; L.inc(e.ok ? 'duel.flee.ok' : 'duel.flee.fail');
    if (e.reroll) log.say('battle', 'Your luck turns: the d20 is thrown again.');
    if (!e.ok) log.say('battle', 'You fail to flee.', { key: 'duel.flee', throttle: 1 }); else if (e.roll === 20) log.say('battle', 'You flee at once.');
  });
  on('duel.end', (e) => {
    if (e.how === 'fled') { L.inc('duel.fled'); if (!e.atOnce) log.say('battle', 'You flee the duel.'); return; } // (a natural 20 said it already: "You flee at once.")
    L.inc(e.won ? 'duel.won' : 'duel.lost');
    if (e.practice) { log.say('battle', e.won ? 'You win the practice duel.' : 'You lose the practice duel.'); return; } // (no shatter, no drain: placeholders, Espada's)
    if (e.won) log.say('battle', e.how === 'finisher' ? 'You drain the Figment.' : 'You win the duel. The Figment is mended.');
    else log.say('battle', e.how === 'yield' ? 'You yield the duel.' : 'You lose the duel. The Figment pushes your mind out.');
  });
  // the one-gesture duel's moments (the session re-emits the kernel's: world/duel/duelsession.js run()); the lines Espada's (2026-10-27).
  // A chain is said from its fourth step only, and a landing of three or more: the small ones are the board's to show and the sound's to say.
  on('duel.chain', (e) => {
    if (e.by !== 'courier') return; L.inc(`duel.chain.${Math.min(8, e.step)}`); if (e.weak) L.inc('duel.chain.weak');
    if (e.step >= 4) log.say('battle', `A chain of ${e.step}.`, { key: 'duel.chain', throttle: 1 });
  });
  on('duel.skill', (e) => { if (e.by !== 'courier') return; L.inc('duel.skill'); L.inc(`duel.skill.${e.tool}`); log.say('battle', `You use ${skillLabel(e.tool)}.`, { key: 'duel.skill', throttle: 0.5 }); });
  on('duel.charge', (e) => { if (e.by !== 'courier') return; log.say('battle', `${skillLabel(e.tool)} is ready.`, { key: `duel.charge.${e.tool}`, throttle: 2 }); });
  on('duel.land', (e) => { L.inc('duel.landed', e.n); if (e.n >= 3) log.say('battle', `${e.n} pieces of junk land on your side.`, { key: 'duel.land', throttle: 1 }); });
  // the lesson finished (the session's duel.lesson on the kernel's lesson.done): kept even in practice, since lesson.js lessonDue reads it
  onAny('duel.lesson', (e) => { if (e.by === 'courier') ledger.inc('duel.lesson'); });
  on('duel.allclear', (e) => { if (e.by !== 'courier') return; L.inc('duel.allclear'); log.say('battle', 'All clear: your half of the board is empty.'); });
}
