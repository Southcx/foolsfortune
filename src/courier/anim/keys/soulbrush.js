// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S KEY POSES, ONE CLUB IN BOTH PLACES (Petra's round, 2026-11-01: the Arena's slots out of their measured clip timings
// and into a keyed table, as the Lockheart's). The brush in the right hand, swung as a club.
//   KEYS      the world's club string (tools/soulbrush/club.js, the moveset's id 'club': c1, c2, c3; in the air the same), stills of
//             Brush_Combo1 .. 3 (30 fps) held in 60 Hz frames adding up to each move's `to` (0.88, 0.95, 1.45 clip s: 53, 57, 87), each
//             strike key where the clip's measured strike window opens (0.33, 0.33, 0.60 s)
//   FIGHTER   the Arena's slots the Soul Brush fills (progress/fightertoolkits.js brush, fighterkits.js): jab1, jab2 and ftilt the
//             world's three, one look in both places; every other slot a frame of the brush's own clips (Brush_*) with bone turns (a
//             key's `fix`) solved by aiming each limb along the move's line in the body's frame (+Z ahead, +Y up, +X the left)
// Where the moves come from: Okami's brush techniques (the Cherry Bomb lobbed, the Power Slash a line drawn through them, the
// Galestorm), Splatoon's Inkling (the roller laid along the floor, the Super Jump on a jet of paint, the Splashdown), the
// calligrapher's finishing sweep, a sumi splash flicked overhead.
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: the kit's frames)
// ---------------------------------------------------------------------------------------

/** The world's string: lead-in, strike, follow-through, settle (the cutlass's shape, keys/cutlass.js). */
export const KEYS = {
  // the club drawn back on the right, swung flat across the front, wrapped round to the left
  c1: [
    { pose: 'lead', clip: 'Brush_Combo1', frame: 6, hold: 20, snap: 3 },
    { pose: 'strike', clip: 'Brush_Combo1', frame: 12, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Brush_Combo1', frame: 17, hold: 14, snap: 3 },
    { pose: 'settle', clip: 'Brush_Combo1', frame: 24, hold: 11, snap: 6 },
  ],
  // the backhand: back across from the left, out to the right
  c2: [
    { pose: 'lead', clip: 'Brush_Combo2', frame: 7, hold: 20, snap: 3 },
    { pose: 'strike', clip: 'Brush_Combo2', frame: 13, hold: 10, snap: 2, active: true },
    { pose: 'follow', clip: 'Brush_Combo2', frame: 19, hold: 14, snap: 3 },
    { pose: 'settle', clip: 'Brush_Combo2', frame: 26, hold: 13, snap: 6 },
  ],
  // the heavy stroke: raised and brought down over the head into the floor
  c3: [
    { pose: 'lead', clip: 'Brush_Combo3', frame: 14, hold: 36, snap: 4 },
    { pose: 'strike', clip: 'Brush_Combo3', frame: 20, hold: 10, snap: 2, active: true },
    { pose: 'follow', clip: 'Brush_Combo3', frame: 27, hold: 20, snap: 3 },
    { pose: 'settle', clip: 'Brush_Combo3', frame: 36, hold: 21, snap: 6 },
  ],
};

const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's Soul Brush. jab3 the brush sweep (the spin's turn); utilt the ink flick overhead; dtilt the floor stroke, bent low in a
 *  wide stance; dash the brush's dive; nspecial the Cherry Bomb lobbed underarm to overhead; sspecial the Power Slash, a long lunge, the
 *  brush straight out; bspecial the Galestorm (the spin, drawn turned); uspecial the Super Jump, the brush down and the knees tucked;
 *  dspecial the Splashdown (the charged slam); dsmash the spin; the airs the club's strokes with the knees drawn up, the up air the
 *  flick overhead, the down air the air slam. */
export const FIGHTER = {
  jab1: beats(KEYS.c1), jab2: beats(KEYS.c2), ftilt: beats(KEYS.c3),
  jab3: lsf(
    at('Brush_Spin', 4),
    at('Brush_Spin', 14),
    at('Brush_Spin', 24)),
  utilt: lsf(
    at('Brush_Flick', 0),
    at('Brush_Flick', 4, { spine: [-0.321, -0.011, 0.057], upper_armR: [1.406, 0.088, 0.104], forearmR: [-0.001, 0.001, -1.564] }),
    at('Brush_Flick', 10, { upper_armR: [-0.257, 0.198, -1.312], forearmR: [0.653, -0.367, -1.003] })),
  dtilt: lsf(
    at('Brush_BrushSlide', 0),
    at('Brush_BrushSlide', 5, { spine: [0.707, -0.079, -0.23], thighR: [0.717, -0.242, -0.628], shinR: [-1.409, 0.047, -0.055], thighL: [0.505, 0.096, 0.369], shinL: [-1.751, -0.126, 0.105], upper_armR: [1.703, 0.54, 0.476], forearmR: [-0.202, -0.011, 0.111] }),
    at('Brush_BrushSlide', 12)),
  dash: lsf(
    at('Brush_Dive', 0),
    at('Brush_Dive', 2),
    at('Brush_Dive', 8)),
  nspecial: lsf(
    at('Brush_Flick', 0, { upper_armR: [-0.636, 0.127, -0.381], forearmR: [-2.457, 0.459, -0.166] }),
    at('Brush_Flick', 5, { spine: [0.007, 0.001, -0.054], upper_armR: [0.882, 0.116, 0.245], forearmR: [-0.167, 0.084, -0.928] }),
    at('Brush_Flick', 12)),
  sspecial: lsf(
    at('Brush_Paint', 18),
    at('Brush_Paint', 24, { spine: [0.127, -0.002, -0.063], thighR: [0.776, -0.046, -0.112], shinR: [-0.521, -0.114, 0.422], thighL: [-0.069, 0.002, -0.068], shinL: [-0.186, -0.013, 0.136], upper_armR: [-0.048, 0.008, -0.313], forearmR: [0.039, 0.009, 0.458] }),
    at('Brush_Paint', 32)),
  bspecial: lsf(
    at('Brush_Spin', 6),
    at('Brush_Spin', 16),
    at('Brush_Spin', 26)),
  uspecial: lsf(
    at('Brush_ChargeHold', 4),
    at('Brush_ChargeHold', 12, { thighR: [-0.948, 0.5, -0.924], shinR: [0.401, 0.052, 0.254], thighL: [-0.215, -0.017, 0.156], shinL: [0.452, 0.052, 0.226], upper_armR: [-2.609, -0.46, 0.128], forearmR: [-0.251, 0.026, -0.206], upper_armL: [-1.503, 0.974, -1.031], forearmL: [0.004, 0, 0.088] }),
    at('Brush_ChargeHold', 20, { upper_armR: [-2.463, -0.466, 0.167], forearmR: [-0.17, 0.003, -0.031] })),
  dspecial: lsf(
    at('Brush_ChargeSlam', 2),
    at('Brush_ChargeSlam', 7),
    at('Brush_ChargeSlam', 14)),
  dsmash: lsf(
    at('Brush_Spin', 7),
    at('Brush_Spin', 16),
    at('Brush_Spin', 26)),
  nair: lsf(
    at('Brush_Combo1', 8),
    at('Brush_Combo1', 12, { thighR: [-0.881, 0.34, -0.698], shinR: [-0.082, -0.009, 0.224], thighL: [0.611, 0.104, 0.327], shinL: [0.188, 0.011, 0.119] }),
    at('Brush_Combo1', 18)),
  fair: lsf(
    at('Brush_Combo2', 8),
    at('Brush_Combo2', 13, { thighR: [-0.805, 0.342, -0.77], shinR: [0.025, 0.003, 0.257], thighL: [0.336, 0.053, 0.307], shinL: [0.525, 0.038, 0.141] }),
    at('Brush_Combo2', 19)),
  uair: lsf(
    at('Brush_Flick', 0),
    at('Brush_Flick', 4, { thighR: [-0.825, 0.246, -0.552], shinR: [0.358, 0.05, 0.273], upper_armR: [1.43, -0.231, -0.266], forearmR: [-0.01, 0.011, -1.669] }),
    at('Brush_Flick', 10)),
  dair: lsf(
    at('Brush_AirSlam', 1),
    at('Brush_AirSlam', 5),
    at('Brush_AirSlam', 12)),
};
