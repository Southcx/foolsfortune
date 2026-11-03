// ---------------------------------------------------------------------------------------
// TRACKING, THE TESTING ROOM: the rule that hears a drill's end (progress/combat/throwingroom.js: the drills, their scores and medals) and
// says the run in one line. A run on the stock game is counted, its best kept and its medal won; a run on a tuned game (debug/tuned.js)
// is said, marked tuned, and never recorded. The room's pots and Strawman never reach the ledger. Words: placeholders for Espada's.
// tracking.js calls it from listen().
//
// The status bench (world/throwingroom/statusbench.js): the first strike of each roly-poly in a visit says its status in a line; never counted.
//
//   throwingRoomRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { DRILLS, score, medalOf, KEYS } from '../../progress/combat/throwingroom.js';
import { STATUS_BENCH_WORDS } from '../../world/throwingroom/statusbench.js';
/** A Figment attack telegraph's answer, said (FIGMENT_SHAPES' `answer`; words placeholders for Espada's). */
const ANSWER_WORDS = { out: 'get out of it', in: 'get inside it', behind: 'get behind it', sidestep: 'step aside', highGround: 'climb', lookAway: 'look away', guard: 'guard', killFirst: 'strike the adds first' };

export function throwingRoomRules({ on, L, log }) {
  // drill.end { id, run: { hits, shots, times, group }, tuned: [keys], by }
  // paintrange.read { three, six, nine, by }: the paint range's rings covered after a hold (world/throwingroom/paintrange.js): measured, never counted
  on('paintrange.read', (e) => log.say('info', `Paint range: 3 m ${Math.round(e.three * 100)}%, 6 m ${Math.round(e.six * 100)}%, 9 m ${Math.round(e.nine * 100)}%.`, { key: 'paintrange', throttle: 0.5 }));
  // statusbench.status { status, dur, by }: a roly-poly struck, the first time in a visit; statusbench.light { light, by }: the lectern's pick
  on('statusbench.status', (e) => log.say('battle', `${e.status[0].toUpperCase() + e.status.slice(1)} (${e.dur} s): ${STATUS_BENCH_WORDS[e.status] || ''}`, { key: `statusbench.${e.status}`, throttle: 0.5 }));
  on('telegraphfloor.set', (e) => (e.on || e.key === 'on') && log.say('info', e.on ? `The telegraph floor: ${e.shape === 'all' ? 'every shape in turn' : `the ${e.shape}`}, ${e.eta} s, the mark to ${e.step}.` : 'The telegraph floor: the caster rests.', { key: 'telegraphfloor.set', throttle: 0.5 })); // (words placeholders, Espada's)
  on('telegraph.cast', (e) => log.say('battle', e.hit ? `Caught by the ${e.shape}. The answer: ${ANSWER_WORDS[e.answer] || e.answer}.` : `Answered the ${e.shape}.`, { key: 'telegraph.cast', throttle: 0.3 }));
  on('parryrange.set', (e) => (e.on || e.key === 'on') && log.say('info', e.on ? `The parry range: ${e.ball}, ${e.speed}, ${e.count === 'one' ? 'one ball' : e.count === 'pair' ? 'a pair' : 'a volley'}, ${e.from === 'across' ? 'from the side' : 'down the line'}.` : 'The parry range: the pitcher rests.', { key: 'parryrange.set', throttle: 0.5 })); // (parryrange.set { ball, speed, count, from, on }: the lectern's choice; never counted; words placeholders)
  on('statusbench.light', (e) => log.say('info', e.light === 'each' ? 'The status bench: each roly-poly in turn.' : e.light === 'none' ? 'The status bench: none lit.' : `The status bench: the ${e.light} roly-poly lit.`, { key: 'statusbench.light', throttle: 0.5 }));
  on('drill.end', (e) => {
    const D = DRILLS[e.id];
    if (!D || e.by !== 'courier') return;
    const s = score(e.id, e.run), medal = medalOf(e.id, s), tuned = (e.tuned || []).length > 0;
    const said = `${D.name}: ${s} ${D.unit}${medal ? `, ${medal}` : ''}`;
    if (tuned) { log.say('info', `${said} (tuned: not recorded).`); return; }
    L.inc(KEYS.runs(e.id)); L.inc('drill.hits', e.run?.hits || 0); // (Steady Hand's count: knacks.js)
    if (D.better === 'lo') L.lo(KEYS.best(e.id), s); else L.hi(KEYS.best(e.id), s);
    if (medal) L.inc(KEYS.medal(e.id, medal));
    log.say('gain', `${said}.`);
  });
}
