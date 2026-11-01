// ---------------------------------------------------------------------------------------
// TRACKING, QAIS: the log's lines for the development window (src/debug/qais/, docs/plans/QAIS.md). QAIS counts nothing in the ledger
// (it is not play); the log says a report filed, a round sent, where /goto set the Courier down, and a lend panel switch (progress/lend.js). The words are placeholders for
// Espada's. tracking.js calls it from listen().
//
//   qaisRules({ on, log })
// ---------------------------------------------------------------------------------------
import { LENDS } from '../../progress/lend.js';
import { PRESETS } from '../../debug/presets.js';

export function qaisRules({ on, log }) {
  on('qais.report.filed', (e) => log.say('system', `Report ${e.id} filed${e.kept === 'file' ? ' (saved as a file: this page has no store)' : ''}: ${e.title}.`));
  on('qais.round.sent', (e) => log.say('system', e.woke
    ? `Round ${e.round} sent to the brigade: ${e.pass} passed, ${e.fail} failed, ${e.skip} skipped, ${e.reports} reported. ${e.who} has been woken.`
    : `Round ${e.round} marked sent, but ${e.who}'s session could not be woken (${e.why}).`));
  on('courier.goto', (e) => log.say('system', e.ok ? `Moved to ${e.to}.` : `Cannot go to ${e.to} from here.`, { throttle: 1 }));
  on('presets.ask', () => Object.entries(PRESETS).forEach(([id, P], i) => log.say('system', `${id}: ${P.label}. ${P.for}.`, { key: `preset.${i}`, throttle: 0.2 }))); // (the presets' list, DEBUG's /presets: debug/presets.js)
  on('lend.set', (e) => log.say('system', `Lend: ${LENDS[e.category]?.label || e.category} ${e.on ? 'on' : 'off'}.`, { key: 'lend', throttle: 0.2 }));
}
