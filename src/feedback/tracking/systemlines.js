// ---------------------------------------------------------------------------------------
// TRACKING, THE SYSTEM'S OWN LINES: lines that belong to no one domain: a sign's help, the effects and workbench windows, replays, a
// knack opened or switched, a debug chest, and the placeholder lines for a route map and a refused dive. Under them, the lines of the
// chat line's commands and the debug rave that have a count or a line (the trail). Moved out of tracking.js whole, the words unchanged
// (they are Espada's). Prior art: as tracking.js's (Old School RuneScape's counters, Final Fantasy XI's one sentence an event).
//
//   systemLineRules({ on, log })
//   commandEchoRules({ on, L, log })   (feedback/tracking/rules.js calls them)
// ---------------------------------------------------------------------------------------
import { KNACKS } from '../../progress/knacks.js';

export function systemLineRules({ on, log }) {
  on('sign.help', (e) => log.say('system', `${e.sign}: ${e.help}`));
  on('vfx.test', (e) => log.say('system', e.found ? `You play ${e.fx}.` : `There is no effect called ${e.fx}.`, { key: 'vfx', win: 0.5 }));
  on('workbench.open', () => log.say('system', 'You open the workbench.', { key: 'wb.open', win: 0.5 }));
  on('workbench.close', () => log.say('system', 'You close the workbench.', { key: 'wb.close', win: 0.5 }));
  on('vfx.list', (e) => log.say('system', `Effects: ${e.names.join(', ')}.`));
  // the knacks and the ostraca's places (progress/knacks.js, world/ostraca.js; the words are placeholders for Espada's)
  on('knack.open', (e) => log.say('system', `New knack: ${KNACKS[e.knack]?.name || e.knack}${KNACKS[e.knack]?.does ? ` (${KNACKS[e.knack].does})` : ''}. It is on. Type /knack ${e.knack} off to switch it off.`));
  on('rutter.get', (e) => log.say('gain', `You make a route map (rank ${e.rank}). This game day it is worth about ${e.worth} cubes.`)); // (Espada's words; the ledger's counts are Dovina's)
  on('rail.refuse', (e) => { if (e.what === 'dive') log.say('info', `Your ${e.ship} cannot dive. It keeps to the surface.`, { key: 'rail.refuse', throttle: 2 }); }); // (a heavy hull: progress/rail/ships.js; Espada's words)
  on('debug.chest', (e) => { // (docs/plans/DEBUG-CHESTS.md; Espada's words; nothing counted)
    if (e.first) log.say('system', `Debug chest (${e.kit}). Nothing it gives is counted.`);
    log.say('system', e.n ? `The debug chest gives: ${e.what.join(', ')}.` : 'The debug chest is empty for you: you hold all it gives.', { key: `debug.${e.kit}`, throttle: 0.5 });
  });
  on('knack.set', (e) => log.say('system', `You switch ${KNACKS[e.knack]?.name || e.knack} ${e.on ? 'on' : 'off'}.`));
  // the title (title/): which game was chosen (the words are Espada's to set: docs/HANDOFFS.md)
  // replays (debug/replay.js): what is being played, and when it gives the controls back
  on('replay.play', (e) => log.say('system', `Playing a replay: ${Math.round(e.frames / 60)} seconds of play${e.exact ? '' : ', begun mid-session (the loose world is as it boots)'}.`));
  on('replay.end', () => log.say('system', 'The replay ends here. The controls are yours.'));
  on('replay.save', (e) => log.say('system', `This session's replay is saved: ${Math.round(e.frames / 60)} seconds${e.full ? ' (the first twenty minutes: it was full)' : ''}.`));
  on('replay.record', () => log.say('system', 'A new replay begins here.'));
}

export function commandEchoRules({ on, L, log }) {
  on('tuning.tuned', (e) => log.say('info', `${e.count} tuning ${e.count === 1 ? 'knob stands' : 'knobs stand'} away from the defaults (Tab): what you see is not the stock game.`)); // (debug/tuned.js)
  on('cavern.force', () => log.say('info', 'You drop through the Great Dunemaw into the great cavern.', { key: 'cavernforce', throttle: 0.5 })); // (/cavern: world/well/dunemaw.js)
  on('aberrant.look', (e) => log.say('info', e.mode === 'invert' ? 'Aberrants are drawn inverted, to compare.' : 'Aberrants wear their own look.', { key: 'aberrant.look', throttle: 0.5 })); // (/aberrant: vfx/databug.js, DEBUG)
  on('rail.force', (e) => log.say('info', e.setPieces?.length ? `The next sea stage sails into ${e.setPieces.join(', then ')}.` : 'The next sea stage is the sea\'s to choose.', { key: 'railforce', throttle: 0.5 })); // (/crossing: world/emocean/stage.js)
  on('rave.start', () => L.inc('rave.count'));
}
