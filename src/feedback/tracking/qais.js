// ---------------------------------------------------------------------------------------
// TRACKING, QAIS: the log's lines for the development window (src/debug/qais/, docs/plans/QAIS.md). QAIS counts nothing in the ledger
// (it is not play); the log says a report filed, a round sent, and where /goto set the Courier down. The words are placeholders for
// Espada's. tracking.js calls it from listen().
//
//   qaisRules({ on, log })
// ---------------------------------------------------------------------------------------

export function qaisRules({ on, log }) {
  on('qais.report.filed', (e) => log.say('system', `Report ${e.id} filed${e.kept === 'file' ? ' (saved as a file: this page has no store)' : ''}: ${e.title}.`));
  on('qais.round.sent', (e) => log.say('system', e.woke
    ? `Round ${e.round} sent to the brigade: ${e.pass} passed, ${e.fail} failed, ${e.skip} skipped, ${e.reports} reported. ${e.who} has been woken.`
    : `Round ${e.round} marked sent, but ${e.who}'s session could not be woken (${e.why}).`));
  on('courier.goto', (e) => log.say('system', e.ok ? `You stand at ${e.to}.` : `There is no standing at ${e.to} from here.`, { throttle: 1 }));
}
