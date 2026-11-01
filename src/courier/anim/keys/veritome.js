// ---------------------------------------------------------------------------------------
// THE VERITOME'S KEY POSES, ONE BOOK IN BOTH PLACES (Petra's round, 2026-11-01: the Arena's Veritome slots out of their measured clip
// timings and into a keyed table, as the Lockheart's; its stand-ins, jab2 Fist_Combo2 and the side special Fist_Shove, gone). The book
// shut in the right hand for a blow, open in both for a plate.
//   KEYS      the world's book bash (tools/veritome/veritome.js, id 'veritome': b1 the forehand, b2 the backhand), stills of
//             Tome_BookBash1 and 2 (30 fps) held in 60 Hz frames adding up to each clip (40, 44), the strike where the book crosses
//   FIGHTER   the Arena's slots the Veritome fills (progress/fightertoolkits.js veritome): jab1 and ftilt the world's two bashes, one
//             look in both places; every other slot a clip frame of the book's own (Tome_*) with bone turns (a key's `fix`) solved by
//             aiming each limb along the move's line in the body's frame (+Z ahead, +Y up, +X the left)
// Where the moves come from: the librarian's rap (the spine brought back across), Robin's tome (Fire Emblem: the pages fanned overhead,
// Elwind's lift on their wind), Pokemon Snap (the plate from the floor, the pester ball pitched overarm), the paparazzo's rush (lens
// first at a lunge), Fatal Frame's Camera Obscura (the Zero Shot, the flash, the capture circle).
//
//   KEYS[move] = [{ pose, clip, frame, hold, snap, active? }]   FIGHTER[slot] = [{ pose, clip, frame, fix? }] (timing: the kit's frames)
// ---------------------------------------------------------------------------------------

/** The world's two bashes: lead-in, strike, follow-through, settle. */
export const KEYS = {
  // the forehand: the book drawn back on the right, swung flat across the front, wrapped round to the left
  b1: [
    { pose: 'lead', clip: 'Tome_BookBash1', frame: 3, hold: 12, snap: 3 },
    { pose: 'strike', clip: 'Tome_BookBash1', frame: 8, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Tome_BookBash1', frame: 13, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Tome_BookBash1', frame: 18, hold: 8, snap: 6 },
  ],
  // the backhand: the book brought back from the left and out to the right, the shove behind it
  b2: [
    { pose: 'lead', clip: 'Tome_BookBash2', frame: 3, hold: 14, snap: 4 },
    { pose: 'strike', clip: 'Tome_BookBash2', frame: 9, hold: 8, snap: 2, active: true },
    { pose: 'follow', clip: 'Tome_BookBash2', frame: 15, hold: 12, snap: 3 },
    { pose: 'settle', clip: 'Tome_BookBash2', frame: 20, hold: 10, snap: 6 },
  ],
};

const beats = (keys) => keys.filter((k) => k.pose !== 'settle').map(({ pose, clip, frame }) => ({ pose, clip, frame }));
const lsf = (lead, strike, follow) => [{ pose: 'lead', ...lead }, { pose: 'strike', ...strike }, { pose: 'follow', ...follow }];
const at = (clip, frame, fix) => (fix ? { clip, frame, fix } : { clip, frame });

/** The Arena's Veritome. jab2 the spine back (the backhand off the forehand's end); utilt the pages fanned overhead; dtilt the plate
 *  taken bent low in a wide stance; dash lens first at a lunge; nspecial the Zero Shot (the lens raised, the flash); sspecial the pester
 *  ball pitched overarm, leaning back then through; bspecial the flash (drawn turned); uspecial Elwind, the book pointed down and the
 *  knees tucked; dspecial the capture circle (the Survey's hold). */
export const FIGHTER = {
  jab1: beats(KEYS.b1), ftilt: beats(KEYS.b2),
  jab2: lsf(
    at('Tome_BookBash1', 13, { upper_armR: [0.077, -0.055, -1.235], forearmR: [-0.26, 0.038, -0.29] }),
    at('Tome_BookBash1', 13, { spine: [-0.174, -0.017, 0.149], upper_armR: [-1.484, 0.438, -0.477], forearmR: [0.019, -0.011, -1.044] }),
    at('Tome_BookBash1', 16, { upper_armR: [-1.1, 0.325, -0.522], forearmR: [0.181, -0.125, -1.207] })),
  utilt: lsf(
    at('Tome_FlipPages', 5),
    at('Tome_FlipPages', 10, { upper_armR: [-0.266, 0.442, -2.069], forearmR: [0.211, -0.062, -0.572], upper_armL: [-0.84, -0.957, 1.719], forearmL: [-0.083, -0.045, 0.987] }),
    at('Tome_FlipPages', 20, { upper_armR: [-0.149, 0.176, -1.741], forearmR: [0.228, -0.047, -0.401], upper_armL: [-0.318, -0.429, 1.873], forearmL: [0.012, 0.005, 0.829] })),
  dtilt: lsf(
    at('Tome_LensRaise', 7),
    at('Tome_Shutter', 6, { spine: [0.786, -0.076, -0.197], thighR: [-0.713, -0.169, 0.448], shinR: [-0.48, 0.023, -0.093], thighL: [-0.341, 0.047, -0.27], shinL: [-0.517, -0.028, 0.104], upper_armR: [0.352, 0.023, 0.13], forearmR: [0.087, -0.021, -0.466], upper_armL: [0.793, -0.093, -0.222], forearmL: [-0.322, -0.14, 0.814] }),
    at('Tome_Shutter', 10)),
  dash: lsf(
    at('Tome_LensRaise', 4),
    at('Tome_LensRaise', 12, { spine: [0.188, -0.006, -0.086], thighR: [0.27, -0.032, -0.235], shinR: [0.072, 0.002, 0.053], thighL: [-0.553, 0.001, -0.003], shinL: [0.266, 0.006, 0.047] }),
    at('Tome_Shutter', 8)),
  nspecial: lsf(
    at('Tome_LensRaise', 10),
    at('Tome_Flash', 6),
    at('Tome_Flash', 14)),
  sspecial: lsf(
    at('Tome_BookBash1', 3, { spine: [-0.365, -0.016, 0.074], upper_armR: [-0.507, 0.325, -1.129], forearmR: [0.934, -0.23, -0.451], upper_armL: [0.086, 0.016, 0.362] }),
    at('Tome_BookBash1', 8, { spine: [0.031, 0, 0.017], upper_armR: [-0.375, 0.208, -1.006], forearmR: [-0.195, 0.051, -0.508] }),
    at('Tome_BookBash1', 13, { spine: [-0.011, -0.001, 0.029], upper_armR: [-0.841, 0.219, -0.482], forearmR: [-0.066, 0.022, -0.647] })),
  bspecial: lsf(
    at('Tome_Flash', 3),
    at('Tome_Flash', 9),
    at('Tome_Flash', 16)),
  uspecial: lsf(
    at('Tome_FlipPages', 5),
    at('Tome_FlipPages', 15, { thighR: [-1.111, -0.461, 0.722], shinR: [0.731, -0.241, -0.614], thighL: [-0.667, 0.042, -0.122], shinL: [0.764, 0.136, 0.337], upper_armR: [0.205, 0.047, 0.451], forearmR: [0.084, -0.033, -0.74], upper_armL: [0.351, -0.052, -0.288], forearmL: [-0.434, -0.191, 0.821] }),
    at('Tome_FlipPages', 25, { upper_armR: [0.3, 0.042, 0.276], forearmR: [0.018, -0.008, -0.816], upper_armL: [0.46, -0.015, -0.063], forearmL: [-0.482, -0.214, 0.825] })),
  dspecial: lsf(
    at('Tome_LensRaise', 5),
    at('Tome_Survey', 20),
    at('Tome_Survey', 35)),
};
