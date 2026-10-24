// ---------------------------------------------------------------------------------------
// TRACKING, START AT (debug/startat.js): where `?at=` set the Courier down, or why it could not. A tester's start, not play: nothing
// counted. The words are placeholders for Espada's.
//
//   start.at { place, ok, why? }   (by 'environment')
//
//   startAtRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function startAtRules({ on, log }) {
  on('start.at', (e) => log.say(e.ok ? 'system' : 'warn', e.ok ? `Started at ${e.place}.` : `Could not start at "${e.place}": ${e.why}.`, { key: 'start.at', throttle: 1 }));
}
