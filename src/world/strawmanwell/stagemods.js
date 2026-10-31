// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S STAGE MODULES: waves 2 to 4, a module a stage (docs/plans/STRAWMANS-WELL.md 4; FIGHTER.md for the Arena), each in its
// own file under stages/ so a stage is built, changed and taken down without touching the room (strawmanwell.js) or another stage.
//
// A stage module (the default export of stages/<id>.js), every hook optional but build:
//   id                          the lane's id (layout.js LANES), the stage's (progress/strawmanwell.js STAGES)
//   build(well, S)              lays the stage in its lane (S: the stage kit's lane builder, stagekit.js) and returns the stage:
//                               { goal: [x, y] | null, door: [x, y], checks: [[x, y], ...], ready?: () => bool (the goal counts only when
//                               true), noRetry?: bool (a fall is the stage's own business), ...its own }
//   enter(well) / leave(well)   the lane entered (after well.stage.enter) / left for another
//   pre(well, dt) / post(well, dt)   beside each fixed step while the frame is on (before / after the Player's own), every module, every
//                               step: check `well.stage?.id` for your own
//   update(well, dt)            each frame while the room is built (every module: check `well.stage?.id`)
//   camera(well, dt)            each frame after the frame's side camera, only the stage you are in (the Chase's scroll, the Flip's roll)
//   spots(well) -> [{ ref, pos, x, y? }]   what F would act on here (the chevron); use(well, ref) -> true if it was yours
//   hold(well, ref, held)       F held at a spot (the Flood's POUR's way)
//   clear(well)                 the room torn down: let go of everything you made outside the kit (the kit's own boxes go with it)
// The stage clears with well.clear() (its goal reached, the room calls it) and counts its hits with well.hit(); a verb used is well.verb(id).
//
//   MODS [module]   MOD { id: module }
// ---------------------------------------------------------------------------------------
import arsenal from './stages/arsenal.js';
import swing from './stages/swing.js';
import flip from './stages/flip.js';
import pit from './stages/pit.js';
import jar from './stages/jar.js';
import troupe from './stages/troupe.js';
import script from './stages/script.js';
import depth from './stages/depth.js';
import chase from './stages/chase.js';
import wall from './stages/wall.js';
import maze from './stages/maze.js';
import arena from './stages/arena.js';

export const MODS = [arsenal, swing, flip, pit, jar, troupe, script, depth, chase, wall, maze, arena];
export const MOD = Object.fromEntries(MODS.map((m) => [m.id, m]));
