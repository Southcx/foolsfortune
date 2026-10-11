// ---------------------------------------------------------------------------------------
// TRACKING, THE TESTING ROOM: the rule that hears a drill's end (progress/combat/testroom.js: the drills, their scores and medals) and
// says the run in one line. A run on the stock game is counted, its best kept and its medal won; a run on a tuned game (debug/tuned.js)
// is said, marked tuned, and never recorded. The room's pots and Strawman never reach the ledger. Words: placeholders for Espada's.
// tracking.js calls it from listen().
//
// The status bench (world/testroom/statusbench.js): the first strike of each roly-poly in a visit says its status in a line; never counted.
//
//   testroomRules({ on, L, log })
// ---------------------------------------------------------------------------------------
import { DRILLS, score, medalOf, KEYS } from '../../progress/combat/testroom.js';
import { STATUS_BENCH_WORDS } from '../../world/testroom/statusbench.js';

export function testroomRules({ on, L, log }) {
  // drill.end { id, run: { hits, shots, times, group }, tuned: [keys], by }
  // paintrange.read { three, six, nine, by }: the paint range's rings covered after a hold (world/testroom/paintrange.js): measured, never counted
  on('paintrange.read', (e) => log.say('info', `Paint range: 3 m ${Math.round(e.three * 100)}%, 6 m ${Math.round(e.six * 100)}%, 9 m ${Math.round(e.nine * 100)}%.`, { key: 'paintrange', throttle: 0.5 }));
  // statusbench.status { status, dur, by }: a roly-poly struck, the first time in a visit; statusbench.light { light, by }: the lectern's pick
  on('statusbench.status', (e) => log.say('battle', `${e.status[0].toUpperCase() + e.status.slice(1)} (${e.dur} s): ${STATUS_BENCH_WORDS[e.status] || ''}`, { key: `statusbench.${e.status}`, throttle: 0.5 }));
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
