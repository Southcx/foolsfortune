// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S KEY POSES, ONE FLAIL IN BOTH PLACES (South, 2026-11-01: "The lockheart should be like a flail on a chain, yeah? Get
// creative with where you're pulling moves from while you're thinking about the identity of the weapon"; "compare against the combo and
// animation systems we already have, fold in what you can"). A coffin on a chain in the left hand: every pose throws the left arm along
// the line the coffin should fly, since the coffin is placed along the shoulder-to-hand line with the chain let out (lockheart.js hands()).
//   KEYS      the world's flail string (the Lockheart's combo engine, tools/moveset.js, id 'lockheart': f1, f2, f3), stills of its own
//             clips (Lock_FlailCombo1-3, 30 fps) held in 60 Hz frames that add up to each clip's length (52, 56, 76), each strike key
//             laid where lockheart.js's measured window opens (f1 0.27 s, f2 0.36 s, f3 0.58 s). Registered by keys/index.js
//   FIGHTER   the Arena's slots for the same tool (progress/fighterkits.js SLOTS.lockheart: jab1, jab2 and ftilt are flail1, flail2 and
//             flail3, so they ARE the world's three, one look in both places), and every other slot keyed as a flail: each strike a
//             clip's frame with bone turns (a key's `fix`, keyposes.js) solved by aiming each limb along the move's line from the side
// Where the moves come from: the thurible (the Botafumeiro of Santiago, swung on its ropes), the meteor hammer and the rope dart (the
// Chinese weights on a cord: kicked out by the foot, whirled overhead, wrapped and thrown), the kusarigama (the ground circle, the throw
// and the yank), Simon Belmont's Vampire Killer (Castlevania: the whip cocked back over the shoulder, cracked behind), King Dedede's
// hammer and the morning star (the overhead slam into a lunge), Scorpion's spear (Mortal Kombat: the throw that hauls them in).
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: fillKeys)
// ---------------------------------------------------------------------------------------

/** The world's flail: lead-in, strike, follow-through, settle (the cutlass's shape, keys/cutlass.js). */
export const KEYS = {
  // Flail 1: the coffin swung flat, right to left across the front on the let-out chain.
  f1: [
    { pose: 'lead', clip: 'Lock_FlailCombo1', frame: 6, hold: 14, snap: 3 },
    { pose: 'strike', clip: 'Lock_FlailCombo1', frame: 11, hold: 13, snap: 2, active: true },
    { pose: 'follow', clip: 'Lock_FlailCombo1', frame: 16, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Lock_FlailCombo1', frame: 24, hold: 13, snap: 6 },
  ],
  // Flail 2: the arm thrown up and the coffin brought over and down, a chop.
  f2: [
    { pose: 'lead', clip: 'Lock_FlailCombo2', frame: 11, hold: 20, snap: 4 },
    { pose: 'strike', clip: 'Lock_FlailCombo2', frame: 14, hold: 12, snap: 2, active: true },
    { pose: 'follow', clip: 'Lock_FlailCombo2', frame: 18, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Lock_FlailCombo2', frame: 24, hold: 12, snap: 6 },
  ],
  // Flail 3: the whirl, the body turned through and the coffin swept low and wide, the blow that throws them off.
  f3: [
    { pose: 'lead', clip: 'Lock_FlailCombo3', frame: 14, hold: 33, snap: 4 },
    { pose: 'strike', clip: 'Lock_FlailCombo3', frame: 22, hold: 18, snap: 2, active: true },
    { pose: 'follow', clip: 'Lock_FlailCombo3', frame: 26, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Lock_FlailCombo3', frame: 32, hold: 13, snap: 6 },
  ],
};

/** The solved bone turns of the Arena's own strikes (radians, a bone's local XYZ over its clip frame). */
const FIX = {
  // the censer: the coffin swung up over the head from front to back (the Botafumeiro's arc at Santiago), the body leaning off it
  utilt: { spine: [-0.204, -0.004, 0.024], upper_armL: [0.217, 0.017, 0.158], forearmL: [-1.31, 0.117, -0.152], upper_armR: [-0.436, -0.125, 0.549], forearmR: [-0.841, -0.077, 0.172] },
  // the floor sweep: low and long, the coffin skimmed along the floor ahead (the meteor hammer's low line)
  dtilt: { spine: [0.425, 0.01, 0.05], thighR: [-1.447, -0.048, 0.055], shinR: [-0.034, 0.004, -0.242], thighL: [1.407, 0.147, 0.174], shinL: [-0.765, 0.04, -0.099], upper_armL: [0.334, 0.167, 0.922], forearmL: [-0.209, -0.12, 1.038], upper_armR: [-0.145, -0.076, 0.96], forearmR: [-1.115, -0.128, 0.205] },
  // the bowl: the coffin underarm along the ground at a run, the body flat out behind it
  dash: { spine: [0.354, 0.007, 0.045], thighR: [-1.143, 0.08, -0.124], shinR: [-0.345, -0.002, 0.012], thighL: [1.382, 0.245, 0.296], shinL: [-0.694, 0.054, -0.149], upper_armL: [0.469, 0.291, 1.1], forearmL: [-0.488, -0.167, 0.65], upper_armR: [-0.61, -0.344, 1.008], forearmR: [-1.059, -0.073, 0.124] },
  // the forward smash's wind-up: the chain cocked back over the shoulder, the body leaning off the front foot (Simon Belmont's whip drawn back)
  fsmashL: { spine: [-0.376, -0.012, 0.065], thighR: [-0.315, 0.009, -0.057], shinR: [0.237, -0.002, -0.013], upper_armL: [-0.269, -0.068, 0.49], forearmL: [-1.523, -0.034, 0.035], upper_armR: [0.642, 0.036, 0.108], forearmR: [-0.966, 0.018, -0.035] },
  // its strike: the coffin brought over and down ahead, the body thrown after it into a long lunge (King Dedede's hammer, the morning star)
  fsmashS: { spine: [0.274, -0.011, -0.109], thighR: [-1.09, 0.041, -0.068], shinR: [-0.139, 0.002, -0.024], thighL: [1.388, 0.09, 0.108], shinL: [-0.708, 0.08, -0.215], upper_armL: [-0.432, -0.276, 1.129], forearmL: [-0.236, 0.033, -0.273], upper_armR: [0.641, 0.139, 0.413], forearmR: [-1.236, 0.039, -0.055] },
  // the whirl: up on one foot, the knee raised, the coffin spun straight up overhead (the rope dart's helicopter)
  usmash: { spine: [-0.062, -0.003, -0.01], thighR: [-1.601, -0.302, 0.293], shinR: [1.237, -0.319, -0.445], thighL: [0.414, 0.063, 0.297], shinL: [-0.125, 0.005, -0.085], upper_armL: [0.319, 0.032, 0.196], forearmL: [-1.192, 0.177, -0.261], upper_armR: [-0.61, -0.062, 0.197], forearmR: [-1.166, -0.168, 0.253] },
  // the ring: sunk low and wide, the coffin swung round at the ankles on a short chain (the kusarigama's ground circle)
  dsmash: { spine: [0.355, -0.014, -0.072], thighR: [-0.419, 0.19, -0.843], shinR: [-0.356, 0.048, -0.263], thighL: [0.257, -0.058, -0.442], shinL: [-0.69, 0.254, -0.683], upper_armL: [0.21, -0.024, -0.224], forearmL: [-0.639, 0.029, -0.089], upper_armR: [0.291, -0.039, -0.264], forearmR: [0.038, 0.003, 0.172] },
  // the rope dart's kick: the right foot thrown high to kick the weight out, the chain hand flung back to let it run
  nair: { spine: [0.011, -0.033, 0.097], thighR: [-1.753, 0.253, -0.211], shinR: [-0.78, -0.059, 0.142], thighL: [0.509, 0.411, 1.352], shinL: [-0.012, -0.007, 0.989], upper_armL: [-0.947, -0.296, 0.566], forearmL: [-1.229, 0.349, -0.49], upper_armR: [0.017, -0.014, -1.408], forearmR: [-0.907, 0.013, -0.026] },
  // the meteor: curled over the coffin and hurling it ahead and down (the meteor hammer's throw)
  fair: { spine: [-1.693, 1.005, -0.853], thighR: [-1.393, -0.193, 0.231], shinR: [-0.1, -0.012, 0.238], thighL: [-0.684, -0.269, 0.726], shinL: [-0.26, -0.037, 0.282], upper_armL: [0.509, 0.764, 1.991], forearmL: [-0.876, -0.16, 0.338], upper_armR: [0.746, 0.93, 1.817], forearmR: [-0.111, 0.009, -0.159] },
  // the back crack: the coffin flung straight behind, a look back over the shoulder (Simon's whip turned)
  bair: { spine: [-0.241, -0.024, 0.106], spine004: [-1.416, 0.068, -0.077], thighR: [-0.011, 0.002, -0.424], shinR: [-0.122, -0.006, 0.092], thighL: [-1.24, 0.054, -0.075], shinL: [0.475, 0.031, 0.126], upper_armL: [-0.57, 0.594, -1.614], forearmL: [-0.861, 0.021, -0.045], upper_armR: [0.459, -0.173, -0.71], forearmR: [-0.203, 0.028, -0.276] },
  // the halo: tucked, the coffin whirled straight up over the head
  uair: { spine: [-0.437, 0.012, -0.042], thighR: [-0.581, 0.001, -0.003], shinR: [0.242, -0.01, -0.081], thighL: [-0.788, -0.093, 0.223], shinL: [0.683, 0.002, 0.007], upper_armL: [0.481, 0.407, 1.399], forearmL: [-0.339, -0.007, 0.04], upper_armR: [0.976, -0.234, -0.436], forearmR: [0.275, -0.116, -0.799] },
  // the anchor: the knees drawn up and the coffin dropped straight down under them (a meteor spike)
  dair: { spine: [0.427, 0.063, 0.27], spine004: [0.62, 0.098, 0.343], thighR: [-1.958, -0.86, 0.598], shinR: [1.142, -0.378, -0.579], thighL: [-1.865, -0.313, 0.233], shinL: [0.699, 0.092, 0.252], upper_armL: [-0.307, 0.438, -1.927], forearmL: [-1.025, -0.046, 0.082], upper_armR: [-1.497, -0.744, 0.795], forearmR: [0.083, -0.037, -0.829] },
  // the snare: the coffin thrown straight out at the foe on the full chain, the body behind it (Scorpion's spear, the kusarigama's throw), yanked back on a hit
  sspecial: { spine: [0.313, 0.006, 0.043], thighR: [-1.214, 0.073, -0.105], shinR: [-0.142, 0.003, -0.048], thighL: [1.501, 0.252, 0.27], shinL: [-0.761, 0.067, -0.168], upper_armL: [-0.185, -0.21, 1.703], forearmL: [-0.604, -0.176, 0.551], upper_armR: [-0.546, -0.3, 0.989], forearmR: [-1.045, -0.05, 0.087] },
  // the bell rope: both hands up the chain, hung under the coffin as it swings them up (the Botafumeiro's ropes)
  uspecial: { spine: [0.083, -0.007, -0.045], thighR: [-0.444, 0.004, -0.016], shinR: [0.1, 0.001, 0.021], thighL: [0.323, 0.044, 0.266], shinL: [0.08, 0, -0.007], upper_armL: [0.21, 0.024, 0.224], forearmL: [-1.077, 0.181, -0.302], upper_armR: [0.215, -0.243, -1.694], forearmR: [-1.055, 0.077, -0.132] },
};
/** A world move's lead-in, strike and follow-through, its timing left to the rule (fillKeys). */
const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's Lockheart: the world's flail on the jabs and the forward tilt, every other slot a flail. */
export const FIGHTER = {
  jab1: beats(KEYS.f1), jab2: beats(KEYS.f2), ftilt: beats(KEYS.f3),
  utilt: lsf(at('Lock_FlailCombo2', 6), at('Lock_FlailCombo2', 11, FIX.utilt), at('Lock_FlailCombo2', 18)),
  dtilt: lsf(at('Lock_FlailCombo3', 14), at('Lock_FlailCombo3', 22, FIX.dtilt), at('Lock_FlailCombo3', 26)),
  dash: lsf(at('Lock_FlailCombo3', 8), at('Lock_FlailCombo3', 22, FIX.dash), at('Lock_FlailCombo3', 26)),
  fsmash: lsf(at('Lock_FlailCombo2', 11, FIX.fsmashL), at('Lock_FlailCombo2', 14, FIX.fsmashS), at('Lock_FlailCombo2', 18)),
  usmash: lsf(at('Lock_FlailCombo2', 6), at('Lock_FlailCombo2', 11, FIX.usmash), at('Lock_FlailCombo2', 18)),
  dsmash: lsf(at('Sond_SpinSlash', 3), at('Sond_SpinSlash', 15, FIX.dsmash), at('Sond_SpinSlash', 27)),
  nair: lsf(at('Cmu_FrontKick', 10), at('Cmu_FrontKick', 18, FIX.nair), at('Cmu_FrontKick', 10)),
  fair: lsf(at('Sond_AirCombo2', 4), at('Sond_AirCombo2', 8, FIX.fair), at('Sond_AirCombo2', 4)),
  bair: lsf(at('swordB', 3), at('swordB', 8, FIX.bair), at('swordB', 3)),
  uair: lsf(at('Sond_AirCombo1', 0), at('Sond_AirCombo1', 3, FIX.uair), at('Sond_AirCombo1', 0)),
  dair: lsf(at('Sond_AirPlunge', 1), at('Sond_AirPlunge', 6, FIX.dair), at('Sond_AirPlunge', 1)),
  nspecial: lsf(at('Lock_Hoover', 4), at('Lock_Hoover', 10), at('Lock_Hoover', 16)),   // the hoover braced: the drink (its world's own)
  sspecial: lsf(at('Lock_FlailCombo3', 14), at('Lock_FlailCombo3', 22, FIX.sspecial), at('Lock_FlailCombo3', 8)),
  uspecial: lsf(at('Lock_FlailCombo2', 6), at('Lock_FlailCombo2', 11, FIX.uspecial), at('Lock_FlailCombo2', 11, FIX.utilt)),
  dspecial: lsf(at('Lock_Open', 10), at('Lock_Open', 20), at('Lock_Open', 30)),         // the lid lifted: the Opening's tease
};
