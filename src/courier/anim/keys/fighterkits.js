// ---------------------------------------------------------------------------------------
// THE FIGHTER KITS' KEY POSES (South, 2026-11-01: "synergize the existing melee weapon combos with the two button system of Super Smash
// Bros"; Dovina's split the same night: the rules and the controls hers, fighter/toolkits.js, the poses and the looks mine). The Arena's
// move slots (jab1 .. dspecial: progress/platformfighter.js MOVES' ids) posed for a set other than the bare one, three stills a move on
// the clip the set's move already plays, read off it where its striking limb or blade is fastest or farthest (tools/melee.js
// measureSwing: the blade's tip at 0.9 m, a fist's or a foot's at 0.1; measured 2026-11-01, the frames below at the clip's 30 fps):
//   SONDELASS   the cutlass's moves in the slots Dovina gave them (its string on the jabs and the forward tilt, the launcher up, the low
//               sweep down, the charge the forward smash, the spin the down smash, the air string, the plunge the down air, the
//               stinger the neutral and up specials, the Wave Cut the down special); registered as 'fighter.sondelass'
//   BRAWLER     the bare fists' other set, my take on J of Closers (Naddic, 2014: the brawler whose skills are named for health
//               remedies): two jabs, then the barrage held on the attack (Omega-III Rush: a charge, a flurry of alternating punches
//               while it is held, finished by a side kick and a straight on its release), the rising uppercut, the dash straight;
//               registered as 'fighter.brawler'. The barrage's flurry is BARRAGE_CYCLE, four punches a cycle, one a four frames
//               (Dovina's: a hit every 4 frames), looped by the kit while held
// Keys named lead, strike and follow take the move's own frames (platformfighter.js fillKeys); any other name keeps the snap and hold
// it is given here (the barrage's punches, its finisher's second blow).
//
// Prior art: J's Omega-III Rush and his Anion Punch (wiki.biligame.com/closers/J: a charge, the rapid punches, a kick and a forward
// strike to end it; a dash straight that hooks upward on a hit); E. Honda's hundred hands and JoJo's barrages for how a flurry reads
// (the fists faster than the eye, a big blow to close it); Super Smash Bros.' rapid jab (a finisher on the button's release).
//
//   SONDELASS[move] / BRAWLER[move] = [{ pose, clip, frame, snap?, hold? }]   BARRAGE_CYCLE (the flurry's punches, looped)
// ---------------------------------------------------------------------------------------

/** A move's three keys on one clip, at its lead, strike and follow frames. */
const keys = (clip, lead, strike, follow) => [
  { pose: 'lead', clip, frame: lead },
  { pose: 'strike', clip, frame: strike },
  { pose: 'follow', clip, frame: follow },
];

/** The cutlass in the slots. A key's clip and its frames, each measured on the blade (strike: the middle of its fastest stretch). */
export const SONDELASS = {
  jab1: keys('Sond_Combo1', 1, 5, 9),             // Slash: strike 2..8, the blade farthest at 4
  jab2: keys('Sond_Combo2', 3, 7, 11),            // Rising Slash: strike 5..9, farthest at 7
  jab3: keys('Sond_Combo3', 8, 13, 17),           // Hop Slash: strike 12..14 as the feet come down
  ftilt: keys('Sond_Combo4', 6, 11, 16),          // Leap Strike: 10..12, the overhead cut at 12
  utilt: keys('Sond_Launcher', 2, 7, 12),         // the launcher: 5..8, the cut rising
  dtilt: keys('swordHeavy', 8, 14, 19),           // Low Sweep: 11..16, the blade along the floor
  dash: keys('Sond_DashSlash', 4, 9, 14),         // the dash: 7..11, 3.2 m out at 9
  fsmash: [{ pose: 'lead', clip: 'Sond_ChargeHold', frame: 10 }, { pose: 'strike', clip: 'Sond_ChargeRelease', frame: 2 }, { pose: 'follow', clip: 'Sond_ChargeRelease', frame: 9 }], // the charge held, its release 0..3
  usmash: keys('Fist_Uppercut', 6, 10, 15),       // Rising Cut: the uppercut, the blade in the fist, highest at 11
  dsmash: keys('Sond_SpinSlash', 3, 15, 27),      // Spin Slash: 6..28, four cuts round
  nair: keys('Sond_AirCombo1', 0, 3, 8),          // air1: 1..7
  fair: keys('Sond_AirCombo2', 4, 8, 13),         // air2: 4..11
  bair: keys('swordB', 3, 8, 12),                 // Backhand: 6..9
  uair: keys('swordA', 3, 7, 11),                 // Quick Slash: 5..9, low to high
  dair: keys('Sond_AirPlunge', 1, 6, 17),         // the plunge: 2..7, then the landing
  nspecial: keys('Sond_Thrust', 3, 8, 14),        // the stinger: 5..7, the point 1.9 m out from 8
  uspecial: keys('Sond_Thrust', 3, 8, 14),        // the stinger aimed up (the kit pitches the body)
  dspecial: keys('Sond_SpecialTidecutter', 30, 56, 66), // the Wave Cut: the leap, the cut 54..58
};

/** The barrage's flurry: right, left, right, left on the boxing clip's three punches (CMU 14_01: right 15, left 22, right 29), a punch
 *  a 4 frames (snapped in 1, held 3), the cycle looped while the attack is held. */
export const BARRAGE_CYCLE = [
  { pose: 'punchR', clip: 'Cmu_Flurry', frame: 15, snap: 1, hold: 3, active: true },
  { pose: 'punchL', clip: 'Cmu_Flurry', frame: 22, snap: 1, hold: 3, active: true },
  { pose: 'punchR2', clip: 'Cmu_Flurry', frame: 29, snap: 1, hold: 3, active: true },
  { pose: 'punchL', clip: 'Cmu_Flurry', frame: 22, snap: 1, hold: 3, active: true },
];

/** The iconic extremes no clip holds whole (South, 2026-11-01: "Dropkick, kamen rider kick, falcon knee ... follow references as close
 *  as practicable"): each strike a clip's frame with bone turns laid over it (a key's `fix`, keyposes.js), solved by aiming each limb
 *  along the reference's line from the side (parents first: the hips' lean, the neck, the thighs, the shins, the arms) and read back
 *  front and side against the reference. The lead-in and the follow-through are the clip's own frames round it. */
const FIX = {
  // Captain Falcon's Knee Smash (Melee's forward air; its sweetspot one frame): the right knee driven up to the chest, the heel tucked
  // under, the body leaning back off it, both arms flung back and down, the trailing leg long behind
  falconKnee: { spine: [-0.37, -0.001, 0.062], spine003: [0.386, 0.039, 0.262], thighR: [0.282, 0.02, 0.139], shinR: [1.904, -0.184, -0.131],
    thighL: [1.345, -0.106, -0.133], shinL: [-0.37, 0.059, -0.314], upper_armR: [-0.523, -0.019, 0.07], forearmR: [-1.379, -0.398, 0.48],
    upper_armL: [-1.668, 0.353, -0.321], forearmL: [-1.957, 0.528, -0.36] },
  // Kamen Rider's Rider Kick (Toei, 1971): the body one diagonal line down onto the foe, the right leg straight along it with the toe
  // pointed, the left knee drawn up and its foot tucked back, the head up and looking down the line, both arms spread up and back
  riderKick: { spine: [-0.275, 0.083, -0.312], spine004: [0.438, 0.26, 1.13], thighR: [1.476, -0.557, -0.609], shinR: [-1.129, -0.07, 0.111],
    footR: [1.204, 0.297, 0.429], thighL: [-0.652, -0.244, 0.696], shinL: [2.387, -0.461, -0.185], upper_armR: [0.021, -0.023, -1.655],
    forearmR: [-0.638, -0.122, 0.365], upper_armL: [1.473, 0.149, 0.164], forearmL: [-0.8, 0.141, -0.331] },
  // the wrestler's dropkick: the body laid flat in the air, both feet together and soles first, the arms thrown down and wide to land on
  dropkick: { spine: [-0.409, 0.379, -0.931], spine003: [0.054, 0, 0.208], thighR: [1.274, -0.327, -0.439], shinR: [-1.129, -0.07, 0.111],
    thighL: [-0.127, -0.032, 0.49], shinL: [-0.465, 0.04, -0.17], upper_armR: [-0.502, 1.028, -2.289], forearmR: [-0.979, -0.161, 0.301],
    upper_armL: [0.746, -0.337, -0.822], forearmL: [-0.918, 0.423, -0.819] },
};
export const ICONIC = {
  falconKnee: [{ pose: 'lead', clip: 'Cmu_KneeStrike', frame: 8 }, { pose: 'strike', clip: 'Cmu_KneeStrike', frame: 14, fix: FIX.falconKnee }, { pose: 'follow', clip: 'Cmu_KneeStrike', frame: 22 }],
  riderKick: [{ pose: 'lead', clip: 'Cmu_FlyingKick', frame: 24 }, { pose: 'strike', clip: 'Cmu_FlyingKick', frame: 34, fix: FIX.riderKick }, { pose: 'follow', clip: 'Cmu_FlyingKick', frame: 44 }],
  dropkick: [{ pose: 'lead', clip: 'Cmu_FlyingKick', frame: 26 }, { pose: 'strike', clip: 'Cmu_FlyingKick', frame: 34, fix: FIX.dropkick }, { pose: 'follow', clip: 'Cmu_FlyingKick', frame: 44 }],
};

/** J's set: the jabs, the barrage (its charge, then the cycle), its finisher, the uppercut, the dash straight, the specials. */
export const BRAWLER = {
  jab1: keys('Fist_Combo1', 1, 4, 8),             // the left jab, farthest at 4
  jab2: keys('Fist_Combo2', 4, 8, 12),            // the right straight, out from 7
  jab3: [{ pose: 'lead', clip: 'Cmu_Flurry', frame: 10 }, ...BARRAGE_CYCLE], // the barrage: the fists drawn in (the charge), then the flurry
  jabEnd: [                                   // its finisher on the release: the side kick, then the straight (J's kick and forward strike)
    { pose: 'lead', clip: 'Cmu_SideKick', frame: 10 },
    { pose: 'strike', clip: 'Cmu_SideKick', frame: 16 },
    { pose: 'straight', clip: 'Cmu_StraightPunch', frame: 15, snap: 2, hold: 6, active: true },
    { pose: 'recover', clip: 'Cmu_StraightPunch', frame: 24, snap: 4, hold: 12 },
  ],
  utilt: keys('Fist_Uppercut', 6, 10, 15),        // the rising uppercut: the fist highest (2.1 m) at 11
  dash: keys('Cmu_StraightPunch', 8, 15, 22),     // the dash straight: the lunging oi zuki, its strike 13..18
  uspecial: keys('Fist_Uppercut', 5, 11, 16),     // the uppercut rising (the recovery)
  sspecial: keys('Cmu_StraightPunch', 6, 15, 24), // the straight lunging 4 m
  fair: ICONIC.falconKnee,                        // the knee (the bare set's forward air's slot)
  dair: ICONIC.riderKick,                         // the Rider Kick down the diagonal
  nair: ICONIC.dropkick,                          // the dropkick, both feet out
};
