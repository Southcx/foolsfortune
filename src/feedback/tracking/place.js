// ---------------------------------------------------------------------------------------
// TRACKING, THE PLACES' OWN LINES: what the workshop, the Inner Realm and the Gnomon's trial say that is not a count (the counts are
// Dovina's, in tracking/garden.js and tracking/dunemaw.js). The workshop welcomes you when the session opens (main.js), and says so when
// a new build has set progress afresh (core/progress.js). In the Inner Realm the hand names its art when it takes one up
// (world/garden/hand.js, the keys 1 to 6), and a terrace or a pavilion placed says the bed or the slot it grants (progress/garden.js).
// The Solar Skiffing trial says its start and an end short of the last ring (world/dunes/solar.js). Words are placeholders for
// Espada's. feedback/tracking/rules.js calls it.
//
//   placeRules({ on, log })
// ---------------------------------------------------------------------------------------

const ART = { grab: 'Grab: lift the Jar or a spirit. Tap a spirit to pet it; the right button flicks it.', pull: 'Pull: raise the clay.', press: 'Press: lower the clay.', carve: 'Carve: cut a channel for water.', smooth: 'Smooth: make the clay level.', place: 'Place: put a feature in a plot.' };

export function placeRules({ on, log }) {
  on('session.open', (e) => {
    log.say('system', 'Welcome to the workshop. Press B for the Codex: arts, ledger and records.');
    if (e.fresh) log.say('system', 'A new build of the game: your arts, ledger, records and Codex start afresh. (Settings are kept.)');
  });
  on('garden.art', (e) => log.say('system', `Your hand: ${ART[e.art] || e.art}`, { key: 'garden.art', throttle: 0.3 }));
  on('garden.grant', (e) => { if (e.by === 'courier') log.say('info', `The ${e.kind === 'bed' ? 'terrace' : 'pavilion'} gives you one more ${e.kind}.`); }); // (Dovina's: progress/garden.js grant)
  on('trial.solar.start', (e) => log.say('info', `The Gnomon's shadow starts to move. Time: 90 real seconds. Rings lit: ${e.lit} of 24.`, { key: 'solar.start', throttle: 1 }));
  on('trial.solar.end', (e) => log.say('info', e.why === 'time' ? "The Gnomon's shadow crosses the dial. Time is up." : 'You leave the course.', { key: 'solar.end', throttle: 1 }));
}
