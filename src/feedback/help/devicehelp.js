// ---------------------------------------------------------------------------------------
// DEVICE HELP: the log's once-a-room control hints in the words of the device last touched (Espada's words; the room lines' keyboard
// versions are tracking.js's HELP; which line is said is Dovina's to rule, docs/plans/MOBILE.md 6.1, and the first rule is the plain one:
// the device `game.input.device` names, else the keyboard's). On touch a hint names the tiles as they read (HOP, FLARE, BRAKE, BOOST, NOSE,
// TAIL, JUMP, USE, DASH), the stick on the left and the drag on the right; on a pad, its buttons by their Xbox letters (core/bindings.js).
// A room with nothing built yet for a device says only what holds on every device, and never a control that is not there.
//
// Prior art: every console port's prompts that swap with the last device touched (Hollow Knight, Celeste, Genshin Impact's three sets).
//
// `foot` is for the first steps on foot on a device (no room emits it yet: Dovina's rule picks when); '' says nothing on that device.
//
//   DEVICE_HELP[device][room] = line | ''   helpLine(room, device, keyboardLine) -> line | null
// ---------------------------------------------------------------------------------------

export const DEVICE_HELP = {
  touch: {
    hub: 'The index console picks a room: walk up to it and tap USE.',
    siege: 'THE SIEGE: raise the hand here. Raids come here.',
    skiff: 'Solar skiffing: the sail fills by itself; hold BRAKE to slow. Slide your left thumb to steer, and past the outer ring to carve, then back inside for a push. Hold HOP and let go to hop; hold FLARE to flare; tap BOOST to spend a banked flare. Swipe left or right on the right side to shoulder. In the air FLARE and BRAKE become NOSE and TAIL: hold them for a grab, and hold HOP to glide. Drag on the right to look.',
    weir: "THE WEIR: the gate on the north beach goes to Raku's bazaar, where the Treasury's chests and the Tithe now stand. The skiff button in the top bar brings the skiff.",
    dunes: 'THE DUNES: the skiff button in the top bar brings the Solar Skiff.',
    hand: '', // (the god hand on touch comes in M1: nothing said until it is there)
    foot: 'On foot: your left thumb walks, a drag on the right looks. JUMP jumps, held to climb and run along walls; DASH dashes once you have learned it; USE works whatever it names.',
  },
  pad: {
    hub: 'The index console picks a room (X at it).',
    siege: 'THE SIEGE: Right on the d-pad raises the hand. Raids come here.',
    hand: '', // (the god hand on a pad: not mapped yet)
    skiff: 'Solar skiffing: RT hoists the sail, LT furls it and brakes, the left stick steers, A hops (hold, then let go), X flares, Y spends a banked flare, Up steps off, Down recalls the skiff. Hold LB or RB at speed to carve, and let go for a push; tap one twice to shoulder. In the air X and B grab the nose and the tail, and A held glides.',
    weir: "THE WEIR: the gate on the north beach goes to Raku's bazaar, where the Treasury's chests and the Tithe now stand. Down on the d-pad brings the skiff.",
    dunes: 'THE DUNES: Down on the d-pad brings the Solar Skiff.',
    foot: 'On foot: the left stick walks, the right stick looks. A jumps, B crouches, X uses, Y draws your main tool, RB parries.',
  },
};

/** The line for a room on a device: its own ('' is silence), else the keyboard's; null when there is nothing to say. */
export function helpLine(room, device, keyboardLine) {
  const own = device && device !== 'keyboard' ? DEVICE_HELP[device]?.[room] : undefined;
  return own !== undefined ? own || null : keyboardLine || null;
}
