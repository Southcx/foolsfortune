// ---------------------------------------------------------------------------------------
// TRACKING, THE PLACES' OWN LINES: what the workshop, the Inner Realm and the Gnomon's trial say that is not a count (the counts are
// Dovina's, in tracking/garden.js and tracking/dunemaw.js). The workshop welcomes you when the session opens (main.js), and says so when
// a new build has set progress afresh (core/progress.js). In the Inner Realm the hand names its art when it takes one up
// (world/garden/hand.js, the keys 1 to 6), and a terrace or a pavilion placed says the bed or the slot it grants (progress/garden.js).
// The Solar Skiffing trial says its start and an end short of the last ring (world/dunes/solar.js). Words are placeholders for
// Espada's. feedback/tracking/rules.js calls it.
//
//   placeRules({ on, log, g })
//   placeEnterRules({ on, L, log, g })
// ---------------------------------------------------------------------------------------
import { said } from './lineformat.js';
import { DUNES_AREAS } from '../../progress/areas.js';
/** A rare find said (placeholder words, Espada's): progress/areas.js RARE_FINDS's `find`. */
const RARE_WORDS = { fulgurite: 'a fulgurite, dug out whole', aberrantWisp: 'an aberrant Lantern Wisp at night' };

const ART = { walk: 'Walk. Tap the ground to make your Pneuka Jar hop there.', grab: 'Grab. Lifts your Pneuka Jar, a spirit or a feature. Tap a spirit to pet it. Press the second button to flick it.', paint: 'Paint. Lays a ground on the clay. The second button clears it. Press {gaTurn} to change the ground.', water: 'Water. Press the first button to pour and the second to drink. Press {gaSpring} to set a spring and {gaDrain} to set a drain. Press {gaTurn} to change the feeling.', flatten: 'Flatten. Levels the clay to the height where the stroke began.', roughen: 'Roughen. Breaks up the clay.', pull: 'Pull. Raises the clay.', press: 'Press. Lowers the clay.', carve: 'Carve. Cuts a channel for water.', smooth: 'Smooth. Makes the clay level.', place: 'Place. Puts a feature in a plot.' };

export function placeRules({ on, log, g }) {
  // the welcome waits for the title to close (FIRST-HOUR.md 3: said at session.open it scrolled by under the title, unseen)
  let fresh = false, welcomed = false;
  on('session.open', (e) => { fresh = !!e.fresh; });
  on('title.enter', (e) => {
    if (welcomed) return; welcomed = true;
    log.say('system', said(g, 'Welcome to the workshop. Press {codex} to open the Codex. It lists your arts, ledger and records.'));
    if (fresh) log.say('system', 'New build. Your arts, ledger, records and Codex start over. Settings are kept.');
    // the mode's line points at the first step (FIRST-HOUR.md 3; Espada's words, 2026-10-22)
    log.say('system', e.mode === 'story' ? 'You wake in the workshop beside a Shrine. Rest there first. Type /goals to see your first 3 goals.' : 'DEBUG save. Every art, every tool and every room is open.');
  });
  on('garden.refuse', (e) => log.say('warn', { god: 'Not while you are the god hand.', death: 'Not while your Pneuka Jar is broken.', stage: 'Not during a sea stage.', busy: 'Busy. Try again in a moment.' }[e.why] || 'Not now.', { key: 'garden.refuse', throttle: 1 })); // (world/garden/realm.js)
  on('garden.jar.back', () => log.say('info', 'Your Pneuka Jar returned to the gate.', { key: 'garden.jar.back', throttle: 2 })); // (thrown off into the sky: world/garden/realm.js)
  on('garden.art', (e) => log.say('system', said(g, `Hand: ${e.mode === 'decor' ? 'Decorate. Places a garden piece. Click the ground to open the catalogue.' : ART[e.art] || e.art}${e.ground ? ` Ground: ${e.ground}.` : ''}${e.feeling ? ` Water: ${e.feeling === 'draught' ? 'your last drink' : e.feeling}.` : ''}`), { key: 'garden.art', throttle: 0.3 })); // (words a placeholder, Espada's)
  on('garden.reset.ask', () => log.say('warn', 'Press again to reset this planetoid\'s clay, ground and water.', { key: 'garden.reset', throttle: 1 }));
  on('garden.reset', () => log.say('info', said(g, 'Planetoid reset. Press {gaUndo} to undo.'), { key: 'garden.reset', throttle: 1 }));
  // (an overflow and its settling said at most once in 20 real s, and the settling only after an overflow that was said: at sea the
  //  ship's absorbs start a spell every few seconds, and the pair filled the log, measured in a crossing 2026-10-30)
  let brimSaid = false;
  on('mind.brim', () => { if (log.say('warn', 'Your pool overflows.', { key: 'mind.brim', throttle: 20 }) !== null) brimSaid = true; }); // (Espada's words, the glossary)
  on('mind.settle', () => { if (brimSaid) { brimSaid = false; log.say('info', 'Mental state settled.', { key: 'mind.settle', throttle: 20 }); } });
  on('mind.state', (e) => log.say('info', `Mental state: ${e.state}.`, { key: 'mind.state', throttle: 3 }));
  on('spirit.name', (e) => log.say('info', `${e.was[0].toUpperCase()}${e.was.slice(1)} named ${e.spirit}.`, { key: 'spirit.name', throttle: 0.5 })); // (words a placeholder, Espada's)
  on('spirit.spar.start', (e) => log.say('info', `Spar started: your ${e.a} against your ${e.b}.`, { key: 'spar', throttle: 1 })); // (words placeholders, Espada's)
  on('spirit.spar', (e) => log.say('info', `Spar over after ${e.seconds} real seconds. Each spirit gains ${e.stats.join(' and ')}.`, { key: 'spar', throttle: 1 }));
  on('garden.track', (e) => log.say('info', `Track laid: ${e.metres} m around. Start a race on it from a spirit's page.`, { key: 'garden.track', throttle: 1 })); // (words placeholders, Espada's)
  on('spirit.race.start', (e) => log.say('info', `Race started. Runners: ${e.runners.join(', ')}.`, { key: 'race', throttle: 1 }));
  on('spirit.race', (e) => log.say('info', e.winner ? `${e.winner[0].toUpperCase()}${e.winner.slice(1)} wins in ${e.seconds} real seconds.` : 'Race over. No runner finished.', { key: 'race', throttle: 1 }));
  on('garden.move', (e) => log.say('info', `Moved. Adjacency bonus: ×${e.mult}${e.vein ? '. On a spirit vein' : ''}.`, { key: 'garden.move', throttle: 0.5 }));
  on('garden.grant', (e) => { if (e.by === 'courier') log.say('info', `${e.kind === 'bed' ? 'Terrace' : 'Pavilion'} bonus: 1 more ${e.kind}.`); }); // (Dovina's: progress/garden.js grant)
  on('trial.solar.start', (e) => log.say('info', `Trial started. The Gnomon's shadow is moving. Time: 90 real seconds. Rings lit: ${e.lit} of 24.`, { key: 'solar.start', throttle: 1 }));
  on('trial.solar.end', (e) => log.say('info', e.why === 'time' ? "Time is up. The Gnomon's shadow has crossed the dial." : 'Course left. Trial over.', { key: 'solar.end', throttle: 1 }));
}

export function placeEnterRules({ on, L, log, g }) {
  // the room they walk into, said as they enter it (the wire compass asks: vfx/wirecompass.js); the same room again only after a while
  const entered = new Map();
  // an area of the Dunes reached (world/dunes/areacut.js DunesAreas), said once a visit: not again within 90 real s of the last time
  const reached = new Map();
  on('area.enter', (e) => { const A = DUNES_AREAS[e.area]; if (!A || e.by !== 'courier') return; const now = e.t ?? 0; if (now - (reached.get(e.area) ?? -1e9) < 90) return; reached.set(e.area, now); log.say('explore', `You reach ${A.name}.`, { key: 'area', win: 1 }); });
  // an area's rare find (progress/areas.js RARE_FINDS), counted once on its checklist (the ledger's `area.<area>.rare`)
  on('area.rare', (e) => { if (e.by !== 'courier' || !DUNES_AREAS[e.area]) return; if (L.first(`area.${e.area}.rare`)) { L.inc(`area.${e.area}.rare`); log.say('record', `Rare find in ${DUNES_AREAS[e.area].name}: ${RARE_WORDS[e.find] || e.find}!`); } });
  on('place.enter', (e) => { if (g.realm?.active) return; const now = e.t ?? 0; if (now - (entered.get(e.room) ?? -1e9) < 90) return; entered.set(e.room, now); log.say('explore', `You enter ${e.room}.`, { key: 'place', win: 1 }); }); // (no room of the workshop is entered from the garden: GARDEN-SWEEP #8)
  on('title.enter', (e) => { L.inc('title.enter'); L.inc(`title.enter.${e.mode}`); }); // (the lines, welcome first: tracking/place.js)
}
