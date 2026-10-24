// ---------------------------------------------------------------------------------------
// TRACKING, THE PERF READOUT (debug/perfreadout.js): the chat line's /perf, said. A measuring aid, not play: nothing counted. The words
// are placeholders for Espada's.
//
//   perf.readout { on }   (by 'courier')
//
//   perfReadoutRules({ on, log })   (feedback/tracking/rules.js calls it)
// ---------------------------------------------------------------------------------------
export function perfReadoutRules({ on, log }) {
  on('perf.readout', (e) => log.say('system', `The performance readout is ${e.on ? 'on' : 'off'}.`, { key: 'perf.readout', throttle: 0.5 }));
}
