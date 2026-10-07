// ---------------------------------------------------------------------------------------
// TRACKING, THE PLACES' OWN LINES: what the workshop, the garden's hand and the Gnomon's trial say that is not a count (the counts are
// Dovina's, in tracking/garden.js and tracking/dunemaw.js). The workshop welcomes you when the session opens (main.js), and says so when
// a new build has set progress afresh (core/progress.js). The garden's hand names its art when it takes one up (world/garden/hand.js, the keys 1 to
// 6); the Solar Skiffing trial says its start and an end short of the last ring (world/dunes/solar.js). Words are placeholders for
// Espada's. tracking.js calls it from listen().
//
//   placeRules({ on, log })
// ---------------------------------------------------------------------------------------

const ART = { grab: 'Grab: take up the Jar or a spirit, tap a spirit to pet it, the right button to flick it.', pull: 'Pull: raise the clay.', press: 'Press: lower the clay.', carve: 'Carve: cut a channel for water.', smooth: 'Smooth: even the clay.', place: 'Place: a feature in a plot.' };

export function placeRules({ on, log }) {
  on('session.open', (e) => {
    log.say('system', 'Welcome to the workshop. Press B for the Codex: arts, ledger and records.');
    if (e.fresh) log.say('system', 'A new build of the game: your arts, ledger, records and Codex start afresh. (Settings are kept.)');
  });
  on('garden.art', (e) => log.say('system', `Your hand: ${ART[e.art] || e.art}`, { key: 'garden.art', throttle: 0.3 }));
  on('trial.solar.start', (e) => log.say('info', `The Gnomon's shadow begins to sweep: 90 seconds. ${e.lit} of 24 rings are lit.`, { key: 'solar.start', throttle: 1 }));
  on('trial.solar.end', (e) => log.say('info', e.why === 'time' ? "The Gnomon's shadow has swept the dial. Time." : 'You leave the course.', { key: 'solar.end', throttle: 1 }));
}
