// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE FLAT STAGE (docs/plans/FIGHTER.md 5.1; GAPS G102): the platform fighter's second stage, Final Destination's flat
// layout for one against one, beside the Arena (stages/arena.js, Battlefield's), built by the same builder (stages/fighterstage.js) with
// the same fighter kit and rules (world/strawmanwell/fighter/kit.js); only the layout differs.
//   the stage       one main stage 27.5 m wide, its two ends ledges to hang from; no thin platforms, nothing to land on or hide under;
//                   an underside in two steps tapering in (Final Destination's), so a recovery from below meets a wall, not a floor
//   the blast lines 28.5 m from mid-stage on both sides, 18.8 m above, 21.9 m below: the Arena's measured lines moved by Melee's own
//                   difference between the two stages (below)
//   the lecterns    F at one: the foe's level (1 to 9), the kit, training, the reset; no FOES lectern (one against one, always: the
//                   kit's count stays 1); the door back to the wings at the stage's left end (F; W is the up tilt here)
// The look is a placeholder (the stage kit's boards and flats): Calissa dresses the theatre.
//
// The numbers, each the Arena's scaled by Melee's Final Destination against Battlefield (libmelee stages.py, read from the game's
// memory, in Melee units): the main stage's edge 85.57 against 68.4 (x 1.25: 11 m to 13.75 m); the side blast lines 246 against 224
// (x 1.10: 26 m to 28.5 m); the top 188 against 200 (x 0.94: 20 m to 18.8 m); the bottom 140 against 108.8 (x 1.29: 17 m to 21.9 m).
// So the flat stage is not tighter all round: Melee's Final Destination tightens only the top (vertical KOs a little sooner, with no
// platform to land on between juggles) and lets out the sides (from mid-stage about 7 points of percent later by koPercent, the ledge
// 14.75 m from the line against the Arena's 15) and the bottom (a longer fall to recover from under a wider stage). The starts and the
// lecterns keep the Arena's share of the stage (the Courier at -5.6, as -4.5 is of 11).
//
// Prior art: Super Smash Bros. Melee's Final Destination (the flat stage of the competitive list, the one-against-one stage, the
// counterpick beside Battlefield; libmelee's blast zones and ledges), Battlefield beside it (stages/arena.js).
//
//   default export: a stage module (stagemods.js's contract, fighterstage.js)   FLAT (its numbers, lane metres)
// ---------------------------------------------------------------------------------------
import { fighterStage } from './fighterstage.js';

/** The stage in lane metres (fighterstage.js's layout): no platforms, the underside in two steps, the starts (three foe spawns for the
 *  kit's three straw fighters, only the first fighting here), the lecterns and the door about the middle. */
export const FLAT = {
  mid: 45, half: 13.75, thick: 2.5, under: [{ half: 12, to: -4.2 }, { half: 8.5, to: -7 }],
  platforms: [],
  blast: { side: 28.5, up: 18.8, down: 21.9 },
  courier: -5.6, foes: [5.6, 7.4, 3.6],
  door: -12.85, lecterns: { level: -11.15, kit: -9.55, train: 10.65, reset: 12.25 },
  lamps: [[-10, 7.5], [0, 9], [10, 7.5]],
};

export default fighterStage('flatstage', FLAT);
