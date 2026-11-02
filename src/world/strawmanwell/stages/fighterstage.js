// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL, A FIGHTER STAGE (docs/plans/FIGHTER.md 5): one platform-fighter stage laid from its numbers, the fighter kit on it
// (world/strawmanwell/fighter/kit.js), as a stage module (stagemods.js's contract). The Arena (stages/arena.js, Battlefield's) and the
// flat stage (stages/flatstage.js, Final Destination's) are each this with their own layout; the kit and its rules are one.
//   the stage       a main stage `half` either side of `mid`, its two ends ledges to hang from; its underside (one step or more, each
//                   narrower than the one over it, so a recovery from below meets a wall, not a floor); the thin platforms, if any
//                   ([from, to, height] about the middle: jumped up through, dropped through with S + Space)
//   the blast lines `blast.side` m from mid-stage either way, `blast.up` above and `blast.down` below (pins mark the sides)
//   the lecterns    F at one: the ones the layout lists of the kit's (level, foes, kit, train, reset); the door back to the wings at `door`
// The look is a placeholder (the stage kit's boards and flats): Calissa dresses the theatre.
//
// Prior art: Super Smash Bros. Melee's stage list (one engine, a stage a layout of collision lines, ledges and a blast zone: libmelee's
// stages.py), the house's stage modules (stagemods.js); this file was the Arena's build (stages/arena.js), moved here unchanged in
// what it lays so a second stage shares it.
//
//   fighterStage(id, layout) -> a stage module { id, build, enter, leave, pre, post, update, camera, spots, use, clear }
//   layout: { mid, half, thick, under: { half, to } | [{ half, to }], platforms?: [[a, b, top]], blast: { side, up, down },
//             courier, foes: [x, x, x], door, lecterns: { level?, foes?, kit?, train?, reset? }, lamps?: [[x, y]] }   (lane metres)
// ---------------------------------------------------------------------------------------
import { COLOR, DEPTH, BACK } from '../stagekit.js';
import { AT } from '../layout.js';
import { FighterKit } from '../fighter/kit.js';

const LAMPS = [[-8, 7.5], [0, 9], [8, 7.5]];

export function fighterStage(id, A) {
  const kitOf = (well) => well.stages?.[id]?.kit || null;
  const here = (well) => well.stage?.id === id;
  return {
    id,
    build(well, S) {
      const X = (x) => AT.x + A.mid + x, Y = (y) => AT.y + y, len = S.lane.len;
      // the theatre: the back flat, lamps (no ends and no catch floor: the blast lines are the stage's edges)
      S.box(-16, len + 16, -Math.max(24, A.blast.down + 3), 42, COLOR.flat, { dz: -BACK, d: 0.2, outline: false });
      for (const [x, y] of A.lamps || LAMPS) S.lamp(A.mid + x, y);
      // the main stage and its underside, step by step
      S.box(A.mid - A.half, A.mid + A.half, -A.thick, 0, COLOR.boards);
      const solids = [{ x0: X(-A.half), x1: X(A.half), top: Y(0), bottom: Y(-A.thick) }];
      let top = -A.thick;
      for (const U of [].concat(A.under || [])) {
        S.box(A.mid - U.half, A.mid + U.half, U.to, top, COLOR.spool);
        solids.push({ x0: X(-U.half), x1: X(U.half), top: Y(top), bottom: Y(U.to) }); top = U.to;
      }
      // the soft platforms (the room's thin platforms: mechanics.js)
      const thins = [];
      for (const [a, b, h] of A.platforms || []) {
        const { collider } = S.box(A.mid + a, A.mid + b, h - 0.2, h, COLOR.thin, { d: DEPTH - 0.6 });
        well.mech.thin(collider, X(a), X(b), Y(h)); thins.push({ x0: X(a), x1: X(b), y: Y(h) });
      }
      // the blast lines' pins, the lecterns
      for (const x of [-A.blast.side, A.blast.side]) S.box(A.mid + x - 0.08, A.mid + x + 0.08, -A.blast.down, 16, COLOR.mark, { collide: false, dz: -BACK + 0.3, d: 0.05 });
      for (const x of Object.values(A.lecterns)) S.box(A.mid + x - 0.35, A.mid + x + 0.35, 0, 1.2, COLOR.spool, { dz: -1.2, d: 0.5, collide: false });
      const stage = {
        id, z: S.z, mid: X(0), x0: X(-A.half), x1: X(A.half), top: Y(0),
        solids, thins,
        ledges: [{ x: X(-A.half), y: Y(0), out: -1, by: null }, { x: X(A.half), y: Y(0), out: 1, by: null }],
        blast: { x0: X(-A.blast.side), x1: X(A.blast.side), y0: Y(-A.blast.down), y1: Y(A.blast.up) },
        spawn: [X(A.courier)], foeSpawns: A.foes.map(X),
        lecterns: Object.fromEntries(Object.entries(A.lecterns).map(([k, x]) => [k, { x: X(x) }])),
      };
      const kit = new FighterKit(well); kit.build(stage, S.group);
      // the lecterns' plates: drawn again when one is changed (only the lecterns this layout stands)
      const plates = {};
      stage.plates = () => {
        for (const [k, [text, sub]] of Object.entries(kit.plateText())) {
          if (A.lecterns[k] == null) continue;
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
}
