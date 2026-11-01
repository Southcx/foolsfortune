// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE ARENA AT REHEARSAL (a part of the Well's look, vfx/strawmanwell/look.js; South, 2026-11-01: "go wild on
// theatre rehearsal themes"): the platform fighter's stage (Dovina's, world/strawmanwell/stages/arena.js, its fighter kit
// world/strawmanwell/fighter/) dressed as a fight rehearsal, the show not up yet. Its backdrop is the flats' (flats/arena.js: the
// hall's bare wall, the backdrop half painted on its frame, the clutter); this part adds the rest:
//   the set         the ghost light, the work lights, the spike tape and the stage weights (arena/set.js)
//   the fighters    the kit's placeholder looks swapped for the rehearsal's (arena/fighterlooks.js: the same contract, so the kit never
//                   knows): the rolling percent and its cast stars, the shield as gauze in a hoop, the stage lift and its follow-spot,
//                   the shot's halo, the stage manager's clipboard for the frame data
//   the barrage     the brawler's held jab drawn as ghost fists, the tsuke's beats under it (arena/barrage.js)
//   the cast        each straw fighter restitched as an understudy in rehearsal blacks with Strawman's paper target pinned on
//                   (arena/understudy.js), once, as the kit makes them
// Nothing here moves a body or decides a rule: the kit's numbers are read, its looks object replaced whole when the room is dressed.
//
// Prior art: the fight rehearsal and the tech rehearsal (work lights, glow tape, the ghost light, the stage manager's desk); Super Smash
// Bros.' training stage (its grid backdrop, the bare stage: our rehearsal is its theatre); Noises Off (the play seen at rehearsal).
//
//   dressArena(ctx) -> { update(dt), dispose() } | null   (ctx: look.js)
// ---------------------------------------------------------------------------------------
import { RehearsalSet } from './set.js';
import { ArenaFighterLooks } from './fighterlooks.js';
import { dressUnderstudy } from './understudy.js';
import { BarrageLook } from './barrage.js';

const kitOf = (ctx) => ctx.well?.stages?.arena?.kit || null;

export function dressArena(ctx) {
  const lane = ctx.lanes.arena; if (!lane || !kitOf(ctx)) return null;
  const set = new RehearsalSet(ctx, lane); ctx.add(set.group, 'arena');
  const barrage = new BarrageLook(ctx); ctx.add(barrage.group, 'arena');
  /** The kit's looks made the rehearsal's (again if the kit was built anew), and every straw fighter it has made an understudy. */
  const keep = () => {
    const K = kitOf(ctx); if (!K) return;
    if (K.looks && !(K.looks instanceof ArenaFighterLooks)) { const into = K.looks.into, z = K.looks.z; K.looks.dispose(); K.looks = new ArenaFighterLooks(into); K.looks.z = z; }
    (K.foes || []).forEach((f, i) => { if (f?.model && !f.model.group.userData.understudy) dressUnderstudy(f.model, i, f.F?.team ?? 1); });
  };
  keep();
  return {
    update(dt) { keep(); set.update(dt); barrage.update(dt, kitOf(ctx)); },
    dispose() { set.dispose(); barrage.dispose(); },
  };
}
