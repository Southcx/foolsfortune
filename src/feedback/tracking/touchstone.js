// ---------------------------------------------------------------------------------------
// TRACKING, THE TOUCHSTONE: the log's lines for the Assay's room (world/touchstone/): arriving, a standard trial announced as one (APTITUDE.md
// 10.4: "sometimes it's good to know you're being tested"), its keys, and one left before its end. The trial's number is Dovina's line
// (tracking/aptitude.js, on aptitude.trial). Placeholder words, Espada's to word.
//
//   touchstoneRules({ on, L, log, g })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { TRIALS } from '../../progress/assaytrials.js';

const HOW = { gonogo: 'Press Space or tap on a plain light; do nothing on an outlined one.', pitch: 'Press A or 1 for the first, D or 2 for the second (on touch, tap that half).', colour: 'Press A, W or D, or 1, 2 or 3 (on touch, tap that third).', rhythm: 'Press Space or tap on each beat.', react: 'Press Space or tap the moment it flashes.' };

export function touchstoneRules({ on, L, log }) {
  on('touchstone.enter', () => { L.inc('touchstone.visit'); log.say('info', 'The Touchstone: a quiet room for the Assay\'s five standard trials. Press F at a plinth to begin one.', { key: 'touchstone', throttle: 20 }); });
  on('assay.trial.start', (e) => { const T = TRIALS[e.trial]; if (!T) return; L.inc(`assay.trial.${e.trial}.start`);
    log.say('system', `Standard trial: ${T.label}. ${T.line} ${HOW[e.trial] || ''} Press F to stop (on touch, hold a finger down).`, { key: 'assay.start', throttle: 0.5 }); });
  on('assay.trial.stop', (e) => { const T = TRIALS[e.trial]; if (T) log.say('info', `${T.label} stopped early. Nothing was recorded.`, { key: 'assay.stop', throttle: 0.5 }); });
}
