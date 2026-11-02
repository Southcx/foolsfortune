// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE ARENA (docs/plans/FIGHTER.md 5; South, 2026-10-31: "adding all the other SSBM-like and platform fighter mechanics
// to include a shield and grab and beyond ... Go wild!"): the platform fighter's stage, Battlefield's layout laid to the Courier's body,
// and the fighter kit on it (world/strawmanwell/fighter/kit.js), on here only.
//   the stage       a main stage 22 m wide, its two ends ledges to hang from; two thin side platforms at 1.3 m (jumped up through,
//                   dropped through with S + Space); a top one at 2.6 m, reached from a side one; an underside narrower than its top
//                   (Battlefield's), so a recovery from below meets a wall, not a floor
//   the blast lines 26 m from mid-stage on both sides, 20 m above, 17 m below (pins mark the sides), where a fresh full forward smash KOs a
//                   weight-100 body at about 110% (platformfighter.js koPercent)
//   the lecterns    F at one: the foes' level (1 to 9), how many (1 to 3), the kit (bare hands, the brawler, a worn tool), training
//                   (off, stand, shield, jump), the reset; the way back to
//                   the wings is the door at the stage's left end (F; W is the up tilt here, never a door)
// The look is a placeholder (the stage kit's boards and flats): Calissa dresses the theatre. Built by the fighter stage's builder
// (stages/fighterstage.js, shared with the flat stage, stages/flatstage.js): this file is the Arena's numbers.
//
// Prior art: Super Smash Bros. Melee's Battlefield (the main stage and its three soft platforms, its ledges, Magus420's measurements
// scaled to the Courier's jump: FIGHTER.md 5); the Brawl's stage (stagesmachine.js buildBrawl) for the soft ledges and the blast pins.
//
//   default export: a stage module (stagemods.js's contract, fighterstage.js)   ARENA (its numbers, lane metres)
// ---------------------------------------------------------------------------------------
import { fighterStage } from './fighterstage.js';

/** The stage in lane metres: its middle, half its width and its thickness, the underside, the thin platforms ([from, to, height] about
 *  the middle: the two sides, then the top), the blast lines (from mid-stage), where the Courier and the foes start, the lecterns and
 *  the door (about the middle). */
export const ARENA = {
  mid: 45, half: 11, thick: 2.5, under: { half: 9.2, to: -4.2 },
  platforms: [[-9.2, -3.6, 1.3], [3.6, 9.2, 1.3], [-2.8, 2.8, 2.6]],
  blast: { side: 26, up: 20, down: 17 }, // (measured with gravity and the angle, kotest: a fresh full forward smash from mid-stage reaches 26 m at 110%, an up smash 20 m up at about 125%: Mario's in Melee)
  courier: -4.5, foes: [4.5, 6.2, 2.8],
  door: -10.1, lecterns: { level: -8.4, foes: -6.8, kit: -5.4, train: 7.9, reset: 9.5 }, // (kit: the moves by the hand, fighter/handkit.js)
};

export default fighterStage('arena', ARENA);
