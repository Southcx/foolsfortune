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
  hub: 'Press {use} at the Index to choose a room.',
  'hub.debug': 'The Tab panel has the debug jumps (the last checkpoint, the hub).', // (said after the hub's line in the DEBUG save only: QA-A and QA-C read it in STORY)
  siege: 'The siege. Press {godhand} to raise the god hand. Raids happen here.',
  skiff: 'Solar Skiffing. W hoists the sail. S furls it and brakes. A and D steer. Space hops. Shift flares. F steps off and parks the skiff. Y recalls it. Hold Q or E at speed to carve left or right. Release for a push. In a glide, W dives, S pulls up, Q and E bank, A and D spin.',
  weir: 'The Weir. Set the Sondelass as Main in the Pneuka Box (P), then press X to draw it. 1 is the cutlass, 2 the rod, 3 the hook. With the rod, press 4 to 0 to choose a feeling you know. - and = change the lure. Hold LMB and release to cast. MMB pings the water. With the grappling hook, LMB throws, hold LMB to reel, RMB pays out. The gate on the north beach leads to Raku\'s Bazaar, with the Treasury\'s chests and the Tithe. Press Y to bring the skiff.',
  'skiff.touch': 'Solar Skiffing. The sail fills by itself. Hold BRAKE to slow. Slide your left thumb to steer. Slide past the outer ring to carve, then back inside for a push. Hold HOP and release to hop. Hold FLARE to flare. Tap BOOST to spend a banked flare. Swipe left or right on the right side to shoulder. In the air, FLARE and BRAKE become NOSE and TAIL. Hold them for a grab. Hold HOP to glide. Drag on the right to look.', // (Espada's words, the device's own lines)
  'skiff.pad': 'Solar Skiffing. RT hoists the sail. LT furls it and brakes. The left stick steers. Hold A and release to hop. X flares. Y spends a banked flare. Up steps off. Down recalls the skiff. Hold LB or RB at speed to carve, and release for a push. Tap one twice to shoulder. In the air, X and B grab the nose and the tail. Hold A to glide.',
  'weir.touch': "The Weir. The gate on the north beach leads to Raku's Bazaar, with the Treasury's chests and the Tithe. Tap the skiff button in the top bar to bring the skiff.", // (the rod and the hook come to touch with the tools, M3)
  'weir.pad': "The Weir. The gate on the north beach leads to Raku's Bazaar, with the Treasury's chests and the Tithe. Press Down on the d-pad to bring the skiff.",
  'hand.touch': "The god hand. Draw the art with one finger. Tap a domain on the strip, and tap again for its next art. Hold a finger still for the wheel. Hold SIGN and draw a miracle's sign. Pan with two fingers, pinch to zoom, twist to turn the view.",
  'hand.pad': null, // (the god hand is not mapped on a pad yet: nothing said rather than mouse buttons)
  dunes: 'The Dunes. Press {skiff} to bring the Solar Skiff.',
  hand: 'The god hand. LMB uses the art. Press 1 to 7 to pick a domain, and again for its next art, or hold RMB for the wheel. MMB draws a miracle\'s sign. N surveys. Q and E turn the view. The mouse wheel zooms. WASD pans. M opens the map. ~ returns to the Courier.',
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
