// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE PAINTED FLATS: each stage's backdrop painted in layers behind the plane (Hercules' parallax), the far
// ones hazy, the back flat's place taken (a part of the Well's look, vfx/strawmanwell/look.js). For the lane shown, its theme
// (vfx/strawmanwell/flats/<theme>.js) is painted as up to four layers of toy-theatre cut-outs between 3 and 18 m behind the plane,
// each standing in its groove on a walnut deck (flats/build.js), and the side-on camera's travel along the lane slides them past each
// other. The themes:
//   wings    the hub, backstage: the backs of flats (raw canvas, timber bracing, stencilled marks), ropes and sandbags, the basket's wicker
//   run      harvest fields and haystacks, a windmill whose sails turn, a big painted sun, the wall-run flat as stacked bales
//   climb    a tower of stacked spools and thimbles, cliffs of folded fabric, a button for a sun
//   stomp    pincushion hills and a meadow of button flowers
//   brawl    a painted arena: arches, banners, a crowd of cut-outs
//   machine  the inside of a sewing machine: its arm, gears that turn, bobbins, a painted clockwork sky
//   flood    the toy theatre's sea: rows of cut-out waves rocking in their grooves, a storm sky, a lighthouse
// Only the shown lane's sheets exist: a lane is painted when it is shown (a few regions a frame, more under the seam's cover) and let
// go when it is left. The placeholder back flat stands until the lane's flats are up, then is hidden; its collider is the kit's and
// stays. A play surface of the flat's kind nearer in (the Run's wall-run flat, a thin box behind the plane) is dressed where it
// stands: a painted cut-out over the same box, a centimetre proud of it, never moved.
//
// Prior art: Hercules (PS1, 1997: its first stage's painted parallax), Pollock's toy theatre (flats in grooves, the sea in rows),
// the console's streamed backdrop (painted behind a door, let go behind you).
//
//   dressFlats(ctx) -> { lane(id), update(dt, camera), dispose() }   (ctx: look.js)   FLATS (the painting's time a frame)
// ---------------------------------------------------------------------------------------
import { FlatLane } from './flats/build.js';
import { WINGS } from './flats/wings.js';
import { RUN } from './flats/run.js';
import { CLIMB } from './flats/climb.js';
import { STOMP } from './flats/stomp.js';
import { BRAWL } from './flats/brawl.js';
import { MACHINE } from './flats/machine.js';
import { FLOOD } from './flats/flood.js';

/** A lane's theme, by its id. */
const THEMES = { wings: WINGS, run: RUN, climb: CLIMB, stomp: STOMP, brawl: BRAWL, machine: MACHINE, flood: FLOOD };
/** How long the painting may take a frame (real ms): in play, and under the seam's cover (nothing of the world is drawn). */
export const FLATS = { slice: 6, covered: 24 };

/** The lane's merged placeholder meshes of one colour (the kit merges by colour and by whether a box is outlined: up to two). */
function mergedAll(ctx, id, color) {
  const gr = ctx.boxes.laneGroup(id); if (!gr) return [];
  return gr.children.filter((m) => m.isMesh && !m.userData.isOutline && !m.geometry?.index && m.geometry?.attributes.position.count % 36 === 0 && m.material?.color?.getHex?.() === color);
}

export function dressFlats(ctx) {
  let cur = null, steps = [], laneId = null, fresh = false;
  const backFlats = (id) => mergedAll(ctx, id, ctx.color.flat).flatMap((m) => (ctx.boxes.boxesOf(m).every((b) => b.d < 0.5) ? [m] : []));
  /** A thin box of the flat's kind (or the wing's) standing between the plane and the back flat: a play surface to dress, or null. */
  const wallRunOf = (id) => {
    const L = ctx.lanes[id]; if (!L) return null;
    for (const color of [ctx.color.flat, ctx.color.wing]) for (const m of mergedAll(ctx, id, color)) {
      const b = ctx.boxes.boxesOf(m).find((b) => b.d < 0.5 && b.c.z < L.z - 0.3 && b.c.z > L.z - ctx.back + 0.3);
      if (b) return b;
    }
    return null;
  };
  const leave = () => {
    if (cur) { cur.dispose(); for (const m of backFlats(cur.id)) m.visible = true; }
    cur = null; steps = [];
  };
  return {
    lane(id) {
      if (id === laneId) return;
      leave(); laneId = id;
      const theme = THEMES[id]; if (!theme || !ctx.lanes[id]) return;
      cur = new FlatLane(ctx, theme, id, { wallRun: wallRunOf(id) }); steps = cur.steps(); fresh = true;
    },
    update(dt) {
      // (nothing painted on a lane's first frame: its arrival has enough to draw)
      if (fresh) fresh = false;
      else if (steps.length) {
        const end = performance.now() + (ctx.game.seam?.busy ? FLATS.covered : FLATS.slice);
        do {
          const f = steps.shift();
          try { f(); } catch (e) { console.warn('wellLook flats', e); steps = []; }
        } while (steps.length && performance.now() < end);
        if (!steps.length && cur?.done) for (const m of backFlats(cur.id)) ctx.boxes.hide(m);
      }
      cur?.update(dt);
    },
    dispose() { leave(); laneId = null; },
  };
}
