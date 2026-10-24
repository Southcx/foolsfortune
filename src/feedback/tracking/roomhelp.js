// ---------------------------------------------------------------------------------------
// TRACKING, A ROOM'S HELP: what the keys do in a place, said once a session on arriving there (`room.help { room }`: the basement's
// rooms, the god hand), in the words of the device last touched. The rule is Dovina's (progress/devicewords.js: a line's {action}s said
// for the device); a room's own line for a device is HELP's `.touch` / `.pad` (Espada's words, one home since 2026-10-24); null or ''
// says nothing on that device. Said again in a room once the device has changed. Nothing is counted.
//
//   roomHelpRules({ on, log, g })   (tracking/rules.js calls it)   HELP
// ---------------------------------------------------------------------------------------
import { deviceText } from '../../progress/devicewords.js';

/** What the keys do in a place (it used to sit on the screen as a banner): the keyboard's line, its {action}s said for the device. */
export const HELP = {
  hub: 'The index console picks a room ({use} at it).',
  'hub.debug': 'The Tab panel holds the debug jumps (the last checkpoint, the hub).', // (said after the hub's line in the DEBUG save only: QA-A and QA-C read it in STORY)
  siege: 'THE SIEGE: {godhand} raises the hand. Raids come here.',
  skiff: 'Solar skiffing: W hoists the sail, S furls it and brakes, A and D steer, Space hops, Shift flares, F steps off and leaves it parked, Y recalls it. Hold Q or E at speed to carve left or right, and let go for a push. In a glide W dives, S pulls up, Q and E bank, A and D spin.',
  weir: 'THE WEIR: with the Sondelass your main (the Pneuka Box, P), X draws it (1 the cutlass, 2 the rod, 3 the hook). With the rod, 4 to 0 choose a feeling (each once you know it), - and = change the lure, hold LMB and let go to cast, MMB pings the water. With the grappling hook, LMB throws, hold to reel, RMB pays out. The gate on the north beach goes to Raku\'s bazaar, where the Treasury\'s chests and the Tithe now stand. Y brings the skiff.',
  'skiff.touch': 'Solar skiffing: the sail fills by itself; hold BRAKE to slow. Slide your left thumb to steer, and past the outer ring to carve, then back inside for a push. Hold HOP and let go to hop; hold FLARE to flare; tap BOOST to spend a banked flare. Swipe left or right on the right side to shoulder. In the air FLARE and BRAKE become NOSE and TAIL: hold them for a grab, and hold HOP to glide. Drag on the right to look.', // (Espada's words, the device's own lines)
  'skiff.pad': 'Solar skiffing: RT hoists the sail, LT furls it and brakes, the left stick steers, A hops (hold, then let go), X flares, Y spends a banked flare, Up steps off, Down recalls the skiff. Hold LB or RB at speed to carve, and let go for a push; tap one twice to shoulder. In the air X and B grab the nose and the tail, and A held glides.',
  'weir.touch': "THE WEIR: the gate on the north beach goes to Raku's bazaar, where the Treasury's chests and the Tithe now stand. The skiff button in the top bar brings the skiff.", // (the rod and the hook come to touch with the tools, M3)
  'weir.pad': "THE WEIR: the gate on the north beach goes to Raku's bazaar, where the Treasury's chests and the Tithe now stand. Down on the d-pad brings the skiff.",
  'hand.touch': "The hand: draw the art with one finger. Tap a domain on the strip, and again for its next art; hold a finger still for the wheel. Hold SIGN and draw a miracle's sign. Two fingers pan, pinch to zoom, twist to turn the view.",
  'hand.pad': null, // (the god hand is not mapped on a pad yet: nothing said rather than mouse buttons)
  dunes: 'THE DUNES: {skiff} brings the Solar Skiff.',
  hand: 'The hand: LMB uses the art; 1 to 7 pick a domain, again for its next art, or hold RMB for the wheel; MMB draws the sign of a miracle. N surveys, Q and E turn the view, the wheel zooms, WASD pans, M opens the map, ~ returns to the Courier.',
};

export function roomHelpRules({ on, log, g }) {
  const helped = new Set();
  on('room.help', (e) => { // (in the words of the device last touched: the room's own line for it (HELP's `.touch` / `.pad`;
    //  null or '' says nothing there), else its {action}s said for the device, progress/devicewords.js; said
    //  again in a room once the device has changed. The `.debug` line names the Tab panel: a keyboard's only)
    const dev = g.input?.device || 'keyboard', seen = `${e.room}.${dev}`;
    const own = dev === 'keyboard' ? undefined : HELP[seen];
    if (!HELP[e.room] || own === null || own === '' || helped.has(seen)) return; helped.add(seen);
    const line = own || deviceText(HELP[e.room], dev);
    log.say('system', line + (dev === 'keyboard' && g.mode === 'debug' && HELP[`${e.room}.debug`] ? ` ${HELP[`${e.room}.debug`]}` : ''));
  });
}
