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

const ART = { grab: 'Grab: lift your Pneuka Jar, a spirit or a feature. Tap a spirit to pet it; the right button flicks it.', paint: 'Paint: lay a ground on the clay; the right button clears it. R turns the ground.', water: 'Water: pour with the left button, drink with the right; Shift sets a spring, Ctrl a drain. R turns the feeling.', flatten: 'Flatten: level the clay to where the stroke began.', roughen: 'Roughen: break up the clay.', pull: 'Pull: raise the clay.', press: 'Press: lower the clay.', carve: 'Carve: cut a channel for water.', smooth: 'Smooth: make the clay level.', place: 'Place: put a feature in a plot.' };

export function placeRules({ on, log }) {
  on('session.open', (e) => {
    log.say('system', 'Welcome to the workshop. Press B for the Codex: arts, ledger and records.');
    if (e.fresh) log.say('system', 'A new build of the game: your arts, ledger, records and Codex start afresh. (Settings are kept.)');
  });
  on('garden.refuse', (e) => log.say('warn', { god: 'Not while you are the god hand.', death: 'Not while your Pneuka Jar is broken.', stage: 'Not during a crossing.', busy: 'Wait a moment.' }[e.why] || 'Not now.', { key: 'garden.refuse', throttle: 1 })); // (world/garden/realm.js)
  on('garden.jar.back', () => log.say('info', 'Your Pneuka Jar lands back at the gate.', { key: 'garden.jar.back', throttle: 2 })); // (thrown off into the sky: world/garden/realm.js)
  on('garden.art', (e) => log.say('system', `Your hand: ${ART[e.art] || e.art}${e.ground ? ` Ground: ${e.ground}.` : ''}${e.feeling ? ` Water: ${e.feeling === 'draught' ? 'your draught' : e.feeling}.` : ''}`, { key: 'garden.art', throttle: 0.3 })); // (words a placeholder, Espada's)
  on('garden.reset.ask', () => log.say('warn', 'Again to put this planetoid back as it was: its clay, its ground and its water.', { key: 'garden.reset', throttle: 1 }));
  on('garden.reset', () => log.say('info', 'The planetoid is back as it was. Ctrl+Z undoes it.', { key: 'garden.reset', throttle: 1 }));
  on('spirit.name', (e) => log.say('info', `${e.was[0].toUpperCase()}${e.was.slice(1)} is named ${e.spirit}.`, { key: 'spirit.name', throttle: 0.5 })); // (words a placeholder, Espada's)
  on('spirit.spar.start', (e) => log.say('info', `Your ${e.a} and your ${e.b} square up.`, { key: 'spar', throttle: 1 })); // (words placeholders, Espada's)
  on('spirit.spar', (e) => log.say('info', `The spar ends after ${e.seconds} real seconds. Each grows stronger: ${e.stats.join(' and ')}.`, { key: 'spar', throttle: 1 }));
  on('garden.track', (e) => log.say('info', `A track: ${e.metres} m round. A spirit's page starts a race on it.`, { key: 'garden.track', throttle: 1 })); // (words placeholders, Espada's)
  on('spirit.race.start', (e) => log.say('info', `The race begins: ${e.runners.join(', ')}.`, { key: 'race', throttle: 1 }));
  on('spirit.race', (e) => log.say('info', e.winner ? `${e.winner[0].toUpperCase()}${e.winner.slice(1)} wins, in ${e.seconds} real seconds.` : 'Nobody finishes the race.', { key: 'race', throttle: 1 }));
  on('garden.move', (e) => log.say('info', `Moved. Its formation there: ×${e.mult}${e.vein ? ', on a spirit vein' : ''}.`, { key: 'garden.move', throttle: 0.5 }));
  on('garden.grant', (e) => { if (e.by === 'courier') log.say('info', `The ${e.kind === 'bed' ? 'terrace' : 'pavilion'} gives you one more ${e.kind}.`); }); // (Dovina's: progress/garden.js grant)
  on('trial.solar.start', (e) => log.say('info', `The Gnomon's shadow starts to move. Time: 90 real seconds. Rings lit: ${e.lit} of 24.`, { key: 'solar.start', throttle: 1 }));
  on('trial.solar.end', (e) => log.say('info', e.why === 'time' ? "The Gnomon's shadow crosses the dial. Time is up." : 'You leave the course.', { key: 'solar.end', throttle: 1 }));
}
