// ---------------------------------------------------------------------------------------
// THE DREAMVANE'S KEY POSES, ONE POLE IN BOTH PLACES (Petra's round, 2026-11-01: the Arena's slots out of their measured clip timings
// and into a keyed table, as the Lockheart's). The vane held as a pole, the pick at its head.
//   KEYS      the world's ground string (tools/dreamvane/pick.js, id 'dreamvane': pick, c1, c2, c3), stills of its own clips (30 fps)
//             held in 60 Hz frames adding up to each move's `to` less its `from` (pick 1.08 clip s: 65; c1 55, c2 57, c3 93), each
//             strike key where the clip's measured strike window opens (the key track's clock starts at the move's `from`)
//   FIGHTER   the Arena's slots the Dreamvane fills (progress/fightertoolkits.js dreamvane, fighterkits.js): jab1 to jab3 the world's c1
//             to c3, one look in both places; every other slot a frame of the vane's own clips (Vane_*) with bone turns (a key's `fix`)
//             solved by aiming each limb along the move's line in the body's frame (+Z ahead, +Y up, +X the left)
// Where the moves come from: Sun Wukong's Ruyi Jingu Bang (the staff run out long, the low spin round the ankles, the vault), the
// staff's leg sweep, Poseidon's trident thrown flat, Raiden's lightning called down a planted rod, the water witch's dowsing rod.
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: the kit's frames)
// ---------------------------------------------------------------------------------------

/** The world's string: lead-in, strike, follow-through, settle (the cutlass's shape, keys/cutlass.js). */
export const KEYS = {
  // the pick raised over the head and driven down into the ground ahead
  pick: [
    { pose: 'lead', clip: 'Vane_PickStrike', frame: 12, hold: 25, snap: 4 },
    { pose: 'strike', clip: 'Vane_PickStrike', frame: 17, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Vane_PickStrike', frame: 22, hold: 14, snap: 3 },
    { pose: 'settle', clip: 'Vane_PickStrike', frame: 30, hold: 18, snap: 6 },
  ],
  // the pole swung flat, right to left
  c1: [
    { pose: 'lead', clip: 'Vane_Combo1', frame: 6, hold: 20, snap: 3 },
    { pose: 'strike', clip: 'Vane_Combo1', frame: 12, hold: 9, snap: 2, active: true },
    { pose: 'follow', clip: 'Vane_Combo1', frame: 17, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Vane_Combo1', frame: 24, hold: 14, snap: 6 },
  ],
  // back across, left to right: it opens already swinging
  c2: [
    { pose: 'lead', clip: 'Vane_Combo2', frame: 1, hold: 4, snap: 2 },
    { pose: 'strike', clip: 'Vane_Combo2', frame: 5, hold: 10, snap: 2, active: true },
    { pose: 'follow', clip: 'Vane_Combo2', frame: 11, hold: 18, snap: 3 },
    { pose: 'settle', clip: 'Vane_Combo2', frame: 20, hold: 25, snap: 6 },
  ],
  // the pole brought over the top and down, the heavy end of the string
  c3: [
    { pose: 'lead', clip: 'Vane_Combo3', frame: 16, hold: 42, snap: 4 },
    { pose: 'strike', clip: 'Vane_Combo3', frame: 23, hold: 10, snap: 2, active: true },
    { pose: 'follow', clip: 'Vane_Combo3', frame: 30, hold: 20, snap: 3 },
    { pose: 'settle', clip: 'Vane_Combo3', frame: 42, hold: 21, snap: 6 },
  ],
};

const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's Dreamvane. ftilt the pause string's finisher; utilt the vane lift (its launcher's thrust); dtilt the staff sweep,
 *  low and wide; dash the Ruyi thrust, the pole run out level at a lunge; fsmash the pick driven; nspecial the Dreamquake; sspecial the
 *  trident thrown; bspecial the lightning rod, the pole held up then planted (drawn turned); uspecial the pole vault; dspecial the
 *  geyser, dowsed then the pick driven where it dowsed. */
export const FIGHTER = {
  jab1: beats(KEYS.c1), jab2: beats(KEYS.c2), jab3: beats(KEYS.c3),
  dtilt: lsf(
    at('Vane_SpinSweep', 1),
    at('Vane_SpinSweep', 7, { spine: [0.207, -0.049, -0.593], thighR: [0.125, -0.051, -0.775], shinR: [-1.361, 0.001, -0.001], thighL: [0.408, -0.059, -0.285], shinL: [-1.569, -0.101, 0.101] }),
    at('Vane_SpinSweep', 14)),
  dash: lsf(
    at('Vane_JrpgCombo1', 6),
    at('Vane_Thrust', 8, { spine: [0.115, -0.005, -0.16], thighR: [0.662, -0.096, -0.278], shinR: [-0.635, -0.143, 0.43], thighL: [0.06, 0.003, 0.115], shinL: [-0.708, -0.006, 0.017], upper_armR: [1.121, -0.049, -0.078], forearmR: [-1.017, 0.368, -0.644], upper_armL: [-0.503, -0.057, 0.22], forearmL: [-0.122, -0.002, 0.03] }),
    at('Vane_Thrust', 14)),
  utilt: lsf(
    at('Vane_Thrust', 3),
    at('Vane_Thrust', 8),
    at('Vane_Thrust', 14)),
  ftilt: lsf(
    at('Vane_JrpgCombo3', 14),
    at('Vane_JrpgCombo3', 20),
    at('Vane_JrpgCombo3', 28)),
  fsmash: lsf(
    at('Vane_PickStrike', 12),
    at('Vane_PickStrike', 17),
    at('Vane_PickStrike', 24)),
  nspecial: lsf(
    at('Vane_SpecialDreamquake', 30),
    at('Vane_SpecialDreamquake', 40),
    at('Vane_SpecialDreamquake', 52)),
  sspecial: lsf(
    at('Vane_ForkThrow', 11),
    at('Vane_ForkThrow', 17),
    at('Vane_ForkThrow', 24)),
  bspecial: lsf(
    at('Vane_PickStrike', 12, { upper_armR: [1.141, -0.08, -0.124], forearmR: [-0.868, 0.447, -0.912], upper_armL: [0.943, 0.484, 0.901], forearmL: [-0.676, 0.074, -0.211] }),
    at('Vane_PickStrike', 18),
    at('Vane_PickStrike', 24)),
  uspecial: lsf(
    at('Vane_Vault', 14),
    at('Vane_Vault', 23),
    at('Vane_Vault', 32)),
  dspecial: lsf(
    at('Vane_Dowse', 40),
    at('Vane_PickStrike', 18, { spine: [0.14, -0.004, -0.076] }),
    at('Vane_PickStrike', 26)),
};
