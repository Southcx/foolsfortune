// ---------------------------------------------------------------------------------------
// THE PSYGUN'S KEY POSES, ONE GUNSLINGER IN BOTH PLACES (Petra's round, 2026-11-01: the Arena's psygun slots out of their measured clip
// timings and into a keyed table, as the Lockheart's; its stand-in jab2, Fist_Combo2, gone). The gun in the right hand throughout.
//   KEYS      the world's pistol-whip (the psygun's combo engine, tools/psygun/gunmoves.js, id 'psygun': whip), stills of Gun_PistolWhip
//             (30 fps) held in 60 Hz frames adding up to its `to` (0.66 clip s: 40), the strike laid on the clip's downswing (0.27 s)
//   FIGHTER   the Arena's slots the psygun fills (progress/fightertoolkits.js psygun, fighterkits.js): jab1 the world's whip, one look in
//             both places; every other slot a clip frame of the psygun's own (Gun_*) with bone turns (a key's `fix`, keyposes.js) solved
//             by aiming each limb along the move's line in the body's frame (+Z ahead, +Y up, +X the left)
// Where the moves come from: Revolver Ocelot (Metal Gear Solid: the pistol-whip and its backhand, the twirl), Equilibrium's gun kata
// (the muzzle at the chest), the Western's "dance!" (shots at the boots) and the quick draw (Lucky Luke), Samus's charge shot (both
// hands, the stance widened), TF2's rocket jump (the gun down at the floor, the knees tucked).
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: the kit's frames)
// ---------------------------------------------------------------------------------------

/** The world's whip: lead-in, strike, follow-through, settle (the cutlass's shape, keys/cutlass.js). */
export const KEYS = {
  // the gun raised by the ear, brought down and across the face, carried through low, back to the aim
  whip: [
    { pose: 'lead', clip: 'Gun_PistolWhip', frame: 3, hold: 16, snap: 3 },
    { pose: 'strike', clip: 'Gun_PistolWhip', frame: 10, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Gun_PistolWhip', frame: 15, hold: 10, snap: 3 },
    { pose: 'settle', clip: 'Gun_PistolWhip', frame: 20, hold: 6, snap: 6 },
  ],
};

const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's psygun. jab2 the butt stroke (the grip brought back across, a backhand off the whip's end); ftilt the muzzle thrust at
 *  the chest; utilt the sky shot, leaning off it; dtilt the gun down at the boots; dash the quick draw at a lunge; nspecial the charge
 *  shot two-handed in a wide stance; sspecial the fanned hammer from the hip, wide; bspecial a snap shot, one arm straight (drawn
 *  turned); uspecial the shot at the floor, the knees tucked; dspecial the twirl (its own clip). */
export const FIGHTER = {
  jab1: beats(KEYS.whip),
  jab2: lsf(
    at('Gun_PistolWhip', 15, { upper_armR: [0.525, -0.187, -0.673], forearmR: [-0.374, 0.073, -0.38] }),
    at('Gun_PistolWhip', 15, { spine: [-0.18, -0.016, 0.144], upper_armR: [-0.803, 0.319, -0.724], forearmR: [0.036, -0.023, -1.159] }),
    at('Gun_PistolWhip', 18, { upper_armR: [-1.425, 0.103, -0.119], forearmR: [-0.152, 0.034, -0.439] })),
  ftilt: lsf(
    at('Gun_Shoot', 2, { upper_armR: [-1.464, -0.66, 0.728], forearmR: [1.64, -0.124, -0.115] }),
    at('Gun_Shoot', 6, { spine: [0.105, -0.002, -0.066], upper_armR: [0.122, 0, -0.001], forearmR: [-0.322, 0.007, -0.042] }),
    at('Gun_Shoot', 12, { upper_armR: [0.032, 0, -0.016], forearmR: [-0.021, 0.001, -0.116] })),
  utilt: lsf(
    at('Gun_AimMid', 10),
    at('Gun_AimUp', 20, { spine: [-0.324, -0.006, 0.034], upper_armR: [0.048, -0.001, -0.055], forearmR: [-0.186, 0.01, -0.113] }),
    at('Gun_AimUp', 30)),
  dtilt: lsf(
    at('Gun_AimMid', 10),
    at('Gun_AimDown', 20, { upper_armR: [-0.362, 0.039, -0.21], forearmR: [-0.204, 0.067, -0.635] }),
    at('Gun_AimDown', 30)),
  dash: lsf(
    at('Gun_QuickDraw', 3),
    at('Gun_QuickDraw', 8, { spine: [0.147, -0.004, -0.076], thighR: [0.365, -0.043, -0.231], shinR: [-0.006, 0, 0.087], thighL: [-0.476, -0.01, 0.042], shinL: [0.206, 0.002, 0.019], upper_armR: [0.53, -0.108, -0.394], forearmR: [-0.143, 0.017, -0.234] }),
    at('Gun_QuickDraw', 12)),
  nspecial: lsf(
    at('Gun_Shoot', 2),
    at('Gun_Shoot', 8, { spine: [-0.034, 0.001, -0.034], thighR: [-0.007, -0.001, 0.204], shinR: [-0.331, 0.016, -0.097], thighL: [0.383, -0.009, -0.046], shinL: [-0.326, -0.017, 0.103], upper_armR: [0.086, 0.006, 0.136], forearmR: [-0.463, 0, -0.002] }),
    at('Gun_Shoot', 14)),
  sspecial: lsf(
    at('Gun_FanTheHammer', 4),
    at('Gun_FanTheHammer', 10, { spine: [-0.11, 0.002, -0.031], thighR: [0.299, 0.01, 0.068], shinR: [-0.878, 0.046, -0.099], thighL: [0.789, -0.05, -0.121], shinL: [-0.824, -0.04, 0.091] }),
    at('Gun_FanTheHammer', 20)),
  bspecial: lsf(
    at('Gun_QuickDraw', 3),
    at('Gun_QuickDraw', 8, { upper_armR: [0.585, -0.087, -0.286], forearmR: [-0.143, 0.017, -0.234] }),
    at('Gun_QuickDraw', 12)),
  uspecial: lsf(
    at('Gun_AimDown', 10),
    at('Gun_AimDown', 20, { spine: [-0.276, -0.004, 0.023], thighR: [-1.237, 0.187, -0.262], shinR: [0.907, 0.253, 0.512], thighL: [-0.393, 0.021, -0.103], shinL: [0.827, 0.095, 0.215], upper_armR: [0.718, 0.003, 0.009], forearmR: [-0.174, 0.069, -0.749] }),
    at('Gun_AimDown', 30, { upper_armR: [0.121, -0.007, -0.118], forearmR: [-0.102, 0.034, -0.645] })),
  dspecial: lsf(
    at('Gun_Twirl', 6),
    at('Gun_Twirl', 14),
    at('Gun_Twirl', 24)),
};
