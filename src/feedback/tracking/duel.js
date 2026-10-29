// ---------------------------------------------------------------------------------------
// TRACKING, A PUZZLE DUEL (docs/plans/PUZZLE-DUELS.md; the session world/duel/duelsession.js): an aberrant's duel said in the log (the
// only text feedback) and kept on the ledger: begun, the Figment broken by your junk, and its end, won (drained, or the finisher), lost, or fled.
// The words are Espada's (docs/LORE.md, "The puzzle duel's words"); the log says "duel", the genre's word.
//
//   duel.pull { foe }   duel.slip   duel.open { kind, feeling }   duel.break { kind, depth }   duel.flee { roll, reroll, need, ok }   duel.end { kind, won, how, turns, atOnce }   duel.undo { left }   (each with `by`)
//   the PvE duel (23): duel.foe { skill, n } (by creature)   duel.desperate (by creature)   duel.stagger (by courier)
//   the one-gesture duel (PUZZLE-DUELS.md 22): duel.chain { step, weak } (each step from 2)   duel.skill { tool }   duel.charge { tool } (a skill full)   duel.land { n, kind } (by creature)   duel.allclear { n }
//
//   duelRules({ on, L, log })   (feedback/tracking/rules.js calls it)   any event with `practice: true` (Strawman's) is said, never counted
// ---------------------------------------------------------------------------------------

import { SKILLS } from '../../progress/duel/skills.js';
import { DUEL_POWERS } from '../../progress/duel/powers.js';
import { FOE_SKILLS } from '../../progress/duel/foeskills.js';

const skillLabel = (tool) => SKILLS[tool]?.label || tool;
const SECRET_LINE = { dissolve: { half: 'The slip jelly sags, thin from all it has thrown.', done: 'You turn its own slime against it. With nothing left to hold it together, the slip jelly falls apart.' }, snuff: { half: 'The Wisp\'s lantern gutters.', done: 'You starve the lantern of Dread. It gutters out, and the Lantern Wisp with it.' } }; // (Espada's, 2026-10-28)
/** An aberrant's own line for its death on the Line (ABERRANTS.md 2, layer 7), by its kind; Espada's. */
const LINE_DEATH = { wisp: 'Its lantern cracks and the flame scatters. You win the duel; the Lantern Wisp is mended.', slipjelly: 'The slip jelly bursts into its slime. You win the duel; it is mended.' }; // (the jelly's: Espada's, 2026-10-29)
const ABERRANT_NAME = { wisp: 'Lantern Wisp', slipjelly: 'slip jelly' }; // (an aberrant as the log says it mid-sentence: the learn line, the drop line)
const FOE_LINE = { kindle: (e) => `The Lantern Wisp kindles ${e.n} of your Dread gems into embers.`, spew: (e) => `The slip jelly spews ${e.n} ${e.n === 1 ? 'piece' : 'pieces'} of slime onto your half.`, harden: (e) => `The slip jelly hardens ${e.n} of its slime into plain junk.`, hurl: (e) => `The aberrant hurls ${e.n} ${e.n === 1 ? 'piece' : 'pieces'} of junk onto your half.`, petrify: (e) => `The aberrant turns ${e.n} of your gems to junk.`, // (Espada's, 2026-10-28; no offset in the PvE duel, so no "less what your clears cancel")
  seal: () => 'The aberrant seals a column of yours: you cannot drag in it on your next turn.', sap: () => 'The aberrant saps your skills: each loses half its charge.', reclaim: () => 'The aberrant pushes the Line back a column toward you.' };

export function duelRules({ on: onAny, L: ledger, log }) {
  // A practice duel (Strawman's at the sparring circle: `practice: true` on every duel.* event, world/duel/duelsession.js) is said in the
  // log but never counted: its events reach these rules with a ledger that keeps nothing (Strawman never counts: STRAWMAN.md, the glossary).
  const quiet = { inc() {}, hi() {}, lo() {}, first() {}, get: (k) => ledger.get(k) };
  let L = ledger;
  const on = (type, fn) => onAny(type, (e) => { L = e?.practice ? quiet : ledger; try { fn(e); } finally { L = ledger; } });
  // the pull (world/duel/duelfoes.js): its look and sound say it; the log says only an escape (a plain placeholder line, Espada's to word)
  on('duel.slip', (e) => { if (e.by !== 'courier') return; L.inc('duel.slip'); log.say('battle', 'You pull away from the aberrant.', { key: 'duel.slip', throttle: 2 }); });
  on('duel.open', (e) => { L.inc('duel.open'); log.say('battle', e.practice ? 'Strawman stands wrong. A practice duel begins; nothing counts.' : 'An aberrant Figment seizes your mind. The duel begins.'); }); // (the practice line Espada's, 2026-10-27)
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
    L.inc(e.won ? 'duel.won' : 'duel.lost'); if (e.won && e.kind) L.inc(`duel.won.${e.kind}`); if (e.won && e.shiny) L.inc('duel.won.shiny'); // (by kind: a learned skill's count way, duel/learned.js)
    if (e.practice) { log.say('battle', e.won ? 'You win the practice duel. Nothing counts.' : 'You lose the practice duel. Nothing counts.'); return; } // (no shatter, no drain; Espada's)
    if (e.won && e.how === 'secret') return; // (its own line came with duel.secret)
    if (e.won) log.say('battle', e.how === 'finisher' ? 'You drain the Figment.' : LINE_DEATH[e.kind] || 'You win the duel. The Figment is mended.');
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
  // the PvE duel (PUZZLE-DUELS.md 23): the aberrant's foe skills and your staggering it (the session's duel.foe, duel.stagger, duel.desperate); Espada's lines, 2026-10-28
  on('duel.foe', (e) => { L.inc(`duel.foe.${e.skill}`); log.say('battle', FOE_LINE[e.skill]?.(e) || 'The aberrant strikes at your mind.', { key: `duel.foe.${e.skill}`, throttle: 1 }); });
  on('duel.desperate', () => { log.say('battle', 'Cornered, the aberrant lashes out.'); }); // (the session's, on the kernel's foe.desperate; Espada's line)
  on('duel.stagger', (e) => { if (e.by !== 'courier') return; L.inc('duel.stagger'); log.say('battle', 'You stagger the aberrant: its next moves come a turn later.', { key: 'duel.stagger', throttle: 1 }); });
  // the duel's powers (PUZZLE-DUELS.md 24; duel/powers.js: the session's duel.power { power, domain, cost, skill? }) and a foe skill seen
  // (progress/foeseen.js: knowledge, so no count); Espada's lines, 2026-10-28
  on('duel.power', (e) => { if (e.by !== 'courier') return; L.inc(`duel.power.${e.power}`); log.say('battle', e.power === 'scan' && e.skill ? `You scan the aberrant: its ${FOE_SKILLS[e.skill]?.label || 'next skill'} comes 2 turns later.` : `You cast ${DUEL_POWERS[e.power]?.label || 'a power'}.`, { key: 'duel.power', throttle: 0.5 }); });
  // an aberrant's secret win (secrets.js, ABERRANTS.md): its tell at half, its end
  on('duel.secret', (e) => {
    if (e.half) log.say('battle', SECRET_LINE[e.id]?.half || 'The aberrant falters.', { key: `duel.secret.${e.id}`, throttle: 1 });
    if (e.done) { L.inc(`duel.secret.${e.id}`); log.say('battle', SECRET_LINE[e.id]?.done || 'You find the aberrant\'s undoing.'); }
  });
  on('duel.seen', (e) => { log.say('battle', `You know ${FOE_SKILLS[e.skill]?.label || 'this skill'} now: ${FOE_SKILLS[e.skill]?.line || ''}.`); });
  on('duel.learn', (e) => { if (e.by !== 'courier') return; L.inc('duel.learn'); log.say('battle', `You learn ${DUEL_POWERS[e.power]?.label || 'a skill'} from the aberrant ${ABERRANT_NAME[e.from] || 'Figment'}. It is yours to cast in a duel now.`); }); // (Espada's, 2026-10-29)
  on('duel.drop', (e) => { if (e.by !== 'courier') return; L.inc('duel.drop', e.items.length); for (const it of e.items) L.hi('duel.drop.tier', it.tier); if (e.shiny) L.inc('duel.drop.shiny');
    const n = e.items.length, who = ABERRANT_NAME[e.creature] || 'Figment'; log.say('loot', `The ${e.shiny ? 'shiny ' : ''}aberrant ${who} leaves ${n === 1 ? 'a material' : `${n} materials`} for Soul Alchemy. ${n === 1 ? 'It goes' : 'They go'} into your Pneuka Box.`, { tone: '#ffd98a' }); }); // (Espada's, 2026-10-29; drops.js)
  on('duel.allclear', (e) => { if (e.by !== 'courier') return; L.inc('duel.allclear'); log.say('battle', 'All clear: your half of the board is empty.'); });
}
