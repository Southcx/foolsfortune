// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, THE ARENA (docs/plans/FIGHTER.md 5; South, 2026-10-31: "adding all the other SSBM-like and platform fighter mechanics
// to include a shield and grab and beyond ... Go wild!"): the platform fighter's stage, Battlefield's layout laid to the Courier's body,
// and the fighter kit on it (world/strawmanwell/fighter/kit.js), on here only.
//   the stage       a main stage 22 m wide, its two ends ledges to hang from; two thin side platforms at 1.3 m (jumped up through,
//                   dropped through with S + Space); a top one at 2.6 m, reached from a side one; an underside narrower than its top
//                   (Battlefield's), so a recovery from below meets a wall, not a floor
//   the blast lines 35 m from mid-stage on both sides and above, 17 m below (pins mark the sides), where a fresh full forward smash KOs a
//                   weight-100 body at about 110% (platformfighter.js koPercent)
//   the lecterns    F at one: the foes' level (1 to 9), how many (1 to 3), training (off, stand, shield, jump), the reset; the way back to
//                   the wings is the door at the stage's left end (F; W is the up tilt here, never a door)
// The look is a placeholder (the stage kit's boards and flats): Calissa dresses the theatre.
//
// Prior art: Super Smash Bros. Melee's Battlefield (the main stage and its three soft platforms, its ledges, Magus420's measurements
// scaled to the Courier's jump: FIGHTER.md 5); the Brawl's stage (stagesmachine.js buildBrawl) for the soft ledges and the blast pins.
//
//   default export: a stage module (stagemods.js's contract)   ARENA (its numbers, lane metres)
// ---------------------------------------------------------------------------------------
import { COLOR, DEPTH, BACK } from '../stagekit.js';
import { AT } from '../layout.js';
import { FighterKit } from '../fighter/kit.js';

/** The stage in lane metres: its middle, half its width and its thickness, the underside, the platforms ([from, to, height] about the
 *  middle), the blast lines (from mid-stage), where the Courier and the foes start, the lecterns and the door (about the middle). */
export const ARENA = {
  mid: 45, half: 11, thick: 2.5, under: { half: 9.2, to: -4.2 },
  sides: [[-9.2, -3.6, 1.3], [3.6, 9.2, 1.3]], top: [-2.8, 2.8, 2.6],
  blast: { side: 35, up: 35, down: 17 },
  courier: -4.5, foes: [4.5, 6.2, 2.8],
  door: -10.1, lecterns: { level: -8.4, foes: -6.8, train: 7.9, reset: 9.5 },
};

const kitOf = (well) => well.stages?.arena?.kit || null;
const here = (well) => well.stage?.id === 'arena';

export default {
  id: 'arena',
  build(well, S) {
    const A = ARENA, X = (x) => AT.x + A.mid + x, Y = (y) => AT.y + y, len = S.lane.len;
    // the theatre: the back flat, lamps (no ends and no catch floor: the blast lines are the stage's edges)
    S.box(-16, len + 16, -24, 42, COLOR.flat, { dz: -BACK, d: 0.2, outline: false });
    for (const [x, y] of [[-8, 7.5], [0, 9], [8, 7.5]]) S.lamp(A.mid + x, y);
    // the main stage and its underside
    S.box(A.mid - A.half, A.mid + A.half, -A.thick, 0, COLOR.boards);
    S.box(A.mid - A.under.half, A.mid + A.under.half, A.under.to, -A.thick, COLOR.spool);
    // the soft platforms (the room's thin platforms: mechanics.js)
    const thins = [];
    for (const [a, b, top] of [...A.sides, A.top]) {
      const { collider } = S.box(A.mid + a, A.mid + b, top - 0.2, top, COLOR.thin, { d: DEPTH - 0.6 });
      well.mech.thin(collider, X(a), X(b), Y(top)); thins.push({ x0: X(a), x1: X(b), y: Y(top) });
    }
    // the blast lines' pins, the lecterns
    for (const x of [-A.blast.side, A.blast.side]) S.box(A.mid + x - 0.08, A.mid + x + 0.08, -A.blast.down, 16, COLOR.mark, { collide: false, dz: -BACK + 0.3, d: 0.05 });
    for (const x of Object.values(A.lecterns)) S.box(A.mid + x - 0.35, A.mid + x + 0.35, 0, 1.2, COLOR.spool, { dz: -1.2, d: 0.5, collide: false });
    const stage = {
      z: S.z, mid: X(0), x0: X(-A.half), x1: X(A.half), top: Y(0),
      solids: [{ x0: X(-A.half), x1: X(A.half), top: Y(0), bottom: Y(-A.thick) }, { x0: X(-A.under.half), x1: X(A.under.half), top: Y(-A.thick), bottom: Y(A.under.to) }],
      thins,
      ledges: [{ x: X(-A.half), y: Y(0), out: -1, by: null }, { x: X(A.half), y: Y(0), out: 1, by: null }],
      blast: { x0: X(-A.blast.side), x1: X(A.blast.side), y0: Y(-A.blast.down), y1: Y(A.blast.up) },
      spawn: [X(A.courier)], foeSpawns: A.foes.map(X),
      lecterns: Object.fromEntries(Object.entries(A.lecterns).map(([k, x]) => [k, { x: X(x) }])),
    };
    const kit = new FighterKit(well); kit.build(stage, S.group);
    // the lecterns' plates: drawn again when one is changed
    const plates = {};
    stage.plates = () => {
      for (const [k, [text, sub]] of Object.entries(kit.plateText())) {
        const key = text + sub; if (plates[k]?.key === key) continue;
        const old = plates[k]?.mesh; old?.removeFromParent(); old?.material?.dispose?.(); old?.geometry?.dispose?.();
        plates[k] = { key, mesh: S.label(text, A.mid + A.lecterns[k], 2.2, { dz: -1.2 + 0.28, width: 1.5, sub }) };
      }
    };
    stage.plates();
    return { goal: null, door: [A.mid + A.door, 0], checks: [[A.mid + A.courier, 0]], noRetry: true, noDoorKey: true, kit };
  },
  enter(well) { kitOf(well)?.enter(); },
  leave(well) { kitOf(well)?.leave(); },
  pre(well) { if (here(well)) kitOf(well)?.pre(); },
  post(well) { if (here(well)) kitOf(well)?.post(); },
  update(well, dt) { const K = kitOf(well); if (!K) return; K.watch(); K.update(dt); },
  camera(well, dt) { kitOf(well)?.camera(dt); },
  spots(well) { return kitOf(well)?.spots() || []; },
  use(well, ref) { return !!kitOf(well)?.use(ref); },
  clear(well) { kitOf(well)?.dispose(); },
};
