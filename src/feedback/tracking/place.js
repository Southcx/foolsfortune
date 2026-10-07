// ---------------------------------------------------------------------------------------
// TRACKING, THE PLACES' OWN LINES: what the garden's hand and the Gnomon's trial say that is not a count (the counts are Dovina's, in
// tracking/garden.js and tracking/dunemaw.js). The garden's hand names its art when it takes one up (world/garden/hand.js, the keys 1 to
// 6); the Solar Skiffing trial says its start and an end short of the last ring (world/dunes/solar.js). Words are placeholders for
// Espada's. tracking.js calls it from listen().
//
//   placeRules({ on, log })
// ---------------------------------------------------------------------------------------

const ART = { grab: 'Grab: lift the Jar or a spirit. Tap a spirit to pet it; the right button flicks it.', pull: 'Pull: raise the clay.', press: 'Press: lower the clay.', carve: 'Carve: cut a channel for water.', smooth: 'Smooth: make the clay level.', place: 'Place: put a feature in a plot.' };

export function placeRules({ on, log }) {
  on('garden.art', (e) => log.say('system', `Your hand: ${ART[e.art] || e.art}`, { key: 'garden.art', throttle: 0.3 }));
  on('trial.solar.start', (e) => log.say('info', `The Gnomon's shadow starts to move. Time: 90 real seconds. Rings lit: ${e.lit} of 24.`, { key: 'solar.start', throttle: 1 }));
  on('trial.solar.end', (e) => log.say('info', e.why === 'time' ? "The Gnomon's shadow crosses the dial. Time is up." : 'You leave the course.', { key: 'solar.end', throttle: 1 }));
}
