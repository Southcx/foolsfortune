// ---------------------------------------------------------------------------------------
// TRACKING, A ROOM'S HELP: what the keys do in a place, said once a session on arriving there (`room.help { room }`: the basement's
// rooms, the god hand), in the words of the device last touched. The rule is Dovina's (progress/devicewords.js: a line's {action}s said
// for the device); a room's own line for a device is HELP's `.touch` / `.pad`, else Espada's DEVICE_HELP (feedback/help/devicehelp.js);
// null or '' says nothing on that device. Said again in a room once the device has changed. Nothing is counted.
//
//   roomHelpRules({ on, log, g })   (tracking/rules.js calls it)   HELP
// ---------------------------------------------------------------------------------------
import { DEVICE_HELP } from '../help/devicehelp.js';
import { deviceText } from '../../progress/devicewords.js';

/** What the keys do in a place (it used to sit on the screen as a banner): the keyboard's line, its {action}s said for the device. */
export const HELP = {
  hub: 'The index console picks a room ({use} at it).',
  'hub.debug': 'The Tab panel holds the debug jumps (the last checkpoint, the hub).', // (said after the hub's line in the DEBUG save only: QA-A and QA-C read it in STORY)
  siege: 'THE SIEGE: {godhand} raises the hand. Raids come here.',
  skiff: 'Solar skiffing: W hoists the sail, S furls it and brakes, A and D steer, Space hops, Shift flares, F steps off and leaves it parked, Y recalls it. Hold Q or E at speed to carve left or right, and let go for a push. In a glide W dives, S pulls up, Q and E bank, A and D spin.',
  weir: 'THE WEIR: with the Sondelass your main (the Pneuka Box, P), X draws it (1 the cutlass, 2 the rod, 3 the hook). With the rod, 4 to 0 choose a feeling (each once you know it), - and = change the lure, hold LMB and let go to cast, MMB pings the water. With the grappling hook, LMB throws, hold to reel, RMB pays out. The gate on the north beach goes to Raku\'s bazaar, where the Treasury\'s chests and the Tithe now stand. Y brings the skiff.',
  dunes: 'THE DUNES: {skiff} brings the Solar Skiff.',
  hand: 'The hand: LMB uses the art; 1 to 7 pick a domain, again for its next art, or hold RMB for the wheel; MMB draws the sign of a miracle. N surveys, Q and E turn the view, the wheel zooms, WASD pans, M opens the map, ~ returns to the Courier.',
};

export function roomHelpRules({ on, log, g }) {
  const helped = new Set();
  on('room.help', (e) => { // (in the words of the device last touched: the room's own line for it (HELP's `.touch` / `.pad`, else Espada's DEVICE_HELP,
    //  feedback/help/devicehelp.js; null or '' says nothing there), else its {action}s said for the device, progress/devicewords.js; said
    //  again in a room once the device has changed. The `.debug` line names the Tab panel: a keyboard's only)
    const dev = g.input?.device || 'keyboard', seen = `${e.room}.${dev}`;
    const own = dev === 'keyboard' ? undefined : HELP[seen] !== undefined ? HELP[seen] : DEVICE_HELP[dev]?.[e.room];
    if (!HELP[e.room] || own === null || own === '' || helped.has(seen)) return; helped.add(seen);
    const line = own || deviceText(HELP[e.room], dev);
    log.say('system', line + (dev === 'keyboard' && g.mode === 'debug' && HELP[`${e.room}.debug`] ? ` ${HELP[`${e.room}.debug`]}` : ''));
  });
}
