// ---------------------------------------------------------------------------------------
// TRACKING, THE TOUCHSTONE: the log's lines for the Assay's room (world/touchstone/): arriving, a standard trial announced as one (APTITUDE.md
// 10.4: "sometimes it's good to know you're being tested"), its keys, and one left before its end. The trial's number is Dovina's line
// (tracking/aptitude.js, on aptitude.trial). Placeholder words, Espada's to word.
//
//   touchstoneRules({ on, L, log, g })   (tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
import { TRIALS } from '../../progress/assaytrials.js';

const HOW = { gonogo: 'Space or a tap on a plain light; nothing on an outlined one.', pitch: 'A or 1: the first; D or 2: the second (a tap: its half).', colour: 'A W D or 1 2 3 (a tap: its third).', rhythm: 'Space or a tap, on the beat.', react: 'Space or a tap, as soon as it flashes.' };

export function touchstoneRules({ on, L, log }) {
  on('touchstone.enter', () => { L.inc('touchstone.visit'); log.say('info', 'The Touchstone. Nothing here but you and the stone. F at a plinth begins its trial.', { key: 'touchstone', throttle: 20 }); });
  on('assay.trial.start', (e) => { const T = TRIALS[e.trial]; if (!T) return; L.inc(`assay.trial.${e.trial}.start`);
    log.say('system', `A standard trial: ${T.label}. ${T.line} ${HOW[e.trial] || ''} F, or a finger held, stops it.`, { key: 'assay.start', throttle: 0.5 }); });
  on('assay.trial.stop', (e) => { const T = TRIALS[e.trial]; if (T) log.say('info', `${T.label} stopped. Nothing was recorded.`, { key: 'assay.stop', throttle: 0.5 }); });
}
