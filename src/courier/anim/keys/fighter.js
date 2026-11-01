// ---------------------------------------------------------------------------------------
// THE FIGHTER'S KEY POSES (docs/plans/KEY-POSES.md 7; FIGHTER.md 6; Dovina's Arena, 2026-11-01): the Courier's moves in Strawman's Well's
// platform fighter (progress/platformfighter.js MOVES) as three stills each, lead, strike and follow, each a frame of the clip the kit
// already draws the move with (world/strawmanwell/fighter/moves.js POSES). Only the pose is chosen here: the keys' hold, snap and active
// come from the frame data (platformfighter.js fillKeys: the lead-in through the startup, the strike through the active frames, the
// follow-through to the move's total), so the drawn move is the rule's own timing. Registered as `registerKeys('fighter', KEYS,
// fillKeys)` where the kit and the rule land together (KEY-POSES.md 6: Petra's); keys/index.js only passes it on (FIGHTER_KEYS).
//
// The frames (30 fps clip frames) are measured, then checked on the contact sheet (scripts/posesheet.mjs --keys fighter:...): the
// strike is the striking limb at its farthest (a punch's or kick's reach, an uppercut's height: tools/melee.js measureSwing's reach and
// y; the fastest frame caught the guard hand's pull-back), the lead a few frames before it (the smashes deeper: a wind-up for the
// charge to hold), the follow four or five past it. A move that shares a clip with
// another shares its frames for now (the up moves on Fist_Uppercut; the aerials' legs are the ground clips' until each gets a `fix`).
// The grab is not in MOVES: its keys carry GRAB's own timing (startup 7, active 7..8, total 30).
//
// Prior art: Sakurai's lead-in, strike and recovery; Melee's frame data (SmashWiki) read as holds; the cutlass's table (keys/cutlass.js).
//
//   KEYS[move] = [{ pose: 'lead' | 'strike' | 'follow', clip, frame, fix? }]   (+ hold, snap, active once filled)
// ---------------------------------------------------------------------------------------

/** A move's three keys on one clip, at its lead, strike and follow frames. */
const keys = (clip, lead, strike, follow) => [
  { pose: 'lead', clip, frame: lead },
  { pose: 'strike', clip, frame: strike },
  { pose: 'follow', clip, frame: follow },
];

export const KEYS = {
  jab1: keys('Fist_Combo1', 1, 4, 8),
  jab2: keys('Fist_Combo2', 5, 8, 12),
  jab3: keys('Fist_Combo3', 3, 6, 10),
  ftilt: keys('Fist_Kick', 12, 17, 22),
  utilt: keys('Fist_Uppercut', 7, 11, 15),
  dtilt: keys('Fist_Sweep', 14, 20, 25),
  dash: keys('Fist_FlyingKick', 11, 16, 22),
  fsmash: keys('Fist_Roundhouse', 6, 13, 18),
  usmash: keys('Fist_Uppercut', 5, 11, 15),
  dsmash: keys('Fist_Sweep', 12, 20, 25),
  nair: keys('Fist_Kick', 12, 17, 22),
  fair: keys('Fist_Combo3', 3, 6, 10),
  bair: keys('Fist_Roundhouse', 8, 13, 18),
  uair: keys('Fist_Uppercut', 7, 11, 15),
  dair: keys('Fist_GroundPound', 11, 15, 19),
  nspecial: keys('Gun_Shoot', 5, 8, 12),
  sspecial: keys('Sond_Cast', 15, 19, 24),
  uspecial: keys('Fist_Uppercut', 7, 11, 15),
  dspecial: keys('Bell_Toll', 6, 10, 14),
  fthrow: keys('Fist_Shove', 4, 8, 13),
  bthrow: keys('Fist_Roundhouse', 8, 13, 18),
  uthrow: keys('Fist_Uppercut', 7, 11, 15),
  dthrow: keys('Fist_GroundPound', 11, 15, 19),
  // the grab (GRAB in platformfighter.js: startup 7, active 7..8, total 30), its timing written out (fillKeys leaves it as given)
  grab: [
    { pose: 'lead', clip: 'Fist_Shove', frame: 4, hold: 6, snap: 2 },
    { pose: 'strike', clip: 'Fist_Shove', frame: 8, hold: 2, snap: 1, active: true },
    { pose: 'follow', clip: 'Fist_Shove', frame: 13, hold: 22, snap: 3 },
  ],
};
