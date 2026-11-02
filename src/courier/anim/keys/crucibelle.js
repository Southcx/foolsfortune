// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S KEY POSES, ONE BELL IN BOTH PLACES (Petra's round, 2026-11-01: the Arena's slots out of their measured clip
// timings and into a keyed table, as the Lockheart's). The bell in the right hand, rung by the swing.
//   KEYS      the world's toll string (tools/crucibelle/crucibelle.js, id 'crucibelle': toll, t1, t2, t3), stills of its own clips
//             (30 fps) held in 60 Hz frames adding up to each clip less its `from` (34, 34, 34, 53), each strike key where the toll's
//             `at` lands (the key track's clock starts at the move's `from`)
//   FIGHTER   the Arena's slots the Crucibelle fills (progress/fightertoolkits.js crucibelle, fighterkits.js): jab1, jab2 and ftilt the
//             world's t1 to t3, one look in both places; every other slot a frame of the bell's own clips (Bell_*) with bone turns (a
//             key's `fix`) solved by aiming each limb along the move's line in the body's frame (+Z ahead, +Y up, +X the left)
// Where the moves come from: the carillon's top bell and the gong struck low, the town crier's hand bell rung on the run, Ocarina of
// Time's songs (a note sent out), the Noh play Dojoji (the bell brought down), Quasimodo up the bell's rope, Kirby's Mike.
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: the kit's frames)
// ---------------------------------------------------------------------------------------

/** The world's string: lead-in, strike, follow-through, settle (the cutlass's shape, keys/cutlass.js). */
export const KEYS = {
  // the bell raised and rung up
  toll: [
    { pose: 'lead', clip: 'Bell_Toll', frame: 5, hold: 6, snap: 2 },
    { pose: 'strike', clip: 'Bell_Toll', frame: 8, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Bell_Toll', frame: 12, hold: 10, snap: 3 },
    { pose: 'settle', clip: 'Bell_Toll', frame: 18, hold: 10, snap: 6 },
  ],
  // rung right to left
  t1: [
    { pose: 'lead', clip: 'Bell_TollCombo1', frame: 5, hold: 8, snap: 2 },
    { pose: 'strike', clip: 'Bell_TollCombo1', frame: 8, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Bell_TollCombo1', frame: 13, hold: 9, snap: 3 },
    { pose: 'settle', clip: 'Bell_TollCombo1', frame: 19, hold: 9, snap: 6 },
  ],
  // rung back, left to right
  t2: [
    { pose: 'lead', clip: 'Bell_TollCombo2', frame: 5, hold: 8, snap: 2 },
    { pose: 'strike', clip: 'Bell_TollCombo2', frame: 8, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Bell_TollCombo2', frame: 13, hold: 9, snap: 3 },
    { pose: 'settle', clip: 'Bell_TollCombo2', frame: 19, hold: 9, snap: 6 },
  ],
  // the great toll, brought over and down
  t3: [
    { pose: 'lead', clip: 'Bell_TollCombo3', frame: 10, hold: 14, snap: 3 },
    { pose: 'strike', clip: 'Bell_TollCombo3', frame: 14, hold: 10, snap: 2, active: true },
    { pose: 'follow', clip: 'Bell_TollCombo3', frame: 19, hold: 14, snap: 3 },
    { pose: 'settle', clip: 'Bell_TollCombo3', frame: 27, hold: 15, snap: 6 },
  ],
};

const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's Crucibelle. utilt the high note, the bell straight up; dtilt the low note struck at the floor, bent low and wide; dash
 *  the town crier, rung high at a lunge; nspecial the fever's peak; sspecial a note thrown, the arm out; bspecial Dojoji, the bell
 *  raised in both hands and brought down (drawn turned); uspecial up the bell's rope, both arms high; dspecial the toll. */
export const FIGHTER = {
  jab1: beats(KEYS.t1), jab2: beats(KEYS.t2), ftilt: beats(KEYS.t3),
  utilt: lsf(
    at('Bell_NoteHigh', 10),
    at('Bell_NoteHigh', 17, { upper_armR: [0.024, -0.007, -0.571], forearmR: [-0.191, 0.117, -1.096] }),
    at('Bell_NoteHigh', 21)),
  dtilt: lsf(
    at('Bell_Note1', 9),
    at('Bell_Note1', 15, { spine: [0.66, -0.068, -0.213], thighR: [-0.547, -0.08, 0.285], shinR: [-0.708, 0.028, -0.076], thighL: [-0.126, 0.011, -0.173], shinL: [-0.754, -0.041, 0.105], upper_armR: [1.42, -0.198, -0.23], forearmR: [-1.284, 0.627, -0.819] }),
    at('Bell_Note1', 17)),
  dash: lsf(
    at('Bell_Toll', 3),
    at('Bell_Toll', 8, { spine: [0.065, 0, -0.017], thighR: [0.521, -0.048, -0.18], shinR: [-0.204, -0.015, 0.143], thighL: [-0.202, -0.016, 0.158], shinL: [-0.118, 0.003, -0.048], upper_armR: [0.508, -0.163, -0.608], forearmR: [0.213, -0.144, -1.186] }),
    at('Bell_Toll', 14)),
  nspecial: lsf(
    at('Bell_FeverPeak', 6),
    at('Bell_FeverPeak', 11),
    at('Bell_FeverPeak', 20)),
  sspecial: lsf(
    at('Bell_Note3', 10),
    at('Bell_Note3', 15, { upper_armR: [0.645, -0.242, -0.699], forearmR: [-0.327, 0.26, -1.338] }),
    at('Bell_Note3', 17)),
  bspecial: lsf(
    at('Bell_TollCombo3', 8, { upper_armR: [-0.25, 0.093, -0.711], forearmR: [-1.144, 0.521, -0.785], upper_armL: [-0.594, -0.072, 0.235], forearmL: [-0.742, -0.13, 0.331] }),
    at('Bell_TollCombo3', 14, { spine: [0.243, -0.01, -0.099], upper_armR: [0.698, 0.023, 0.063], forearmR: [-0.787, 0.056, -0.136] }),
    at('Bell_TollCombo3', 22)),
  uspecial: lsf(
    at('Bell_SongCast', 4),
    at('Bell_SongCast', 11, { thighR: [-1.292, -0.051, 0.067], shinR: [0.58, -0.036, -0.121], upper_armR: [-0.598, 0.565, -1.511], forearmR: [-0.021, 0.011, -0.947], upper_armL: [-0.765, -0.838, 1.672], forearmL: [-1.062, -0.093, 0.159] }),
    at('Bell_SongCast', 18)),
  dspecial: lsf(
    at('Bell_Toll', 2),
    at('Bell_Toll', 7),
    at('Bell_Toll', 13)),
};
