// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK: the Well (Dovina's room, world/strawmanwell/; plan docs/plans/STRAWMANS-WELL.md 1) dressed as Pip's toy theatre:
// a Pollock's paper theatre built out of Pip's sewing basket at giant scale, lit from the footlights, a stage a lane seen side-on from
// the stalls, Hercules' painted parallax (PS1, 1997, its first stage) hung in layers behind each. One look, five parts, each a module of
// its own that dresses the placeholder colours it owns (vfx/strawmanwell/boxes.js reads Dovina's merged boxes back out) and adds what
// the placeholders lack; nothing here moves a surface or a collider:
//   the theatre   the boards, the apron's lip and its footlights, the borders and the fly ropes, the stage's ends as wing flats, the doors,
//                 the wings (the hub) as backstage, Strawman's spot (theatre.js)
//   the flats     each stage's backdrop painted in layers behind the plane, the far ones hazy, the back flat's place taken (flats.js)
//   the props     the sewing kit in the placeholder boxes' places: spools, pins, thread, tape, felt, buttons, thimbles (props.js)
//   the troupe    the straw dummies as Pip's earlier tries at Strawman, and their percent (dummies.js)
//   the grid      the Flood's falling-sand grid drawn by cell kind (gridlook.js, which the Flood stage builds)
// The room is built on arrival and taken down whole on leaving (the Well's area): the look dresses it when it is built and lets go of
// its own textures when it is torn down; what it adds goes into the lanes' groups, so the kit's teardown takes the meshes with it.
//
// Prior art: Pollock's Toy Theatres (the printed proscenium, the wings in grooves, the cut-out flats and the rows of sea), Hercules
// (PS1: the painted parallax, warm and rich, the far layers hazy), LittleBigPlanet's craft-material world (things you could own, at a
// giant scale), Paper Mario's stage (a world of flats); this house's Sandbox hall (dressing a placeholder room by its colours).
//
//   game.wellLook = new WellLook(game)   .update(dt)   (each frame)   .ctx (while dressed)   WELL_LOOK (the shared palette and numbers)
//   a part: dress(ctx) -> { lane?(id), update?(dt, camera), dispose() }   ctx: { game, well, room, add(obj, laneId), lanes, at, color, depth, back, palette,
//     boxes: { laneGroup(id), mergedOf(id, color), boxesOf(mesh), ownBoxes(id, color), hide(mesh) } }
// ---------------------------------------------------------------------------------------
import { LANES, AT } from '../../world/strawmanwell/layout.js';
import { COLOR, DEPTH, BACK } from '../../world/strawmanwell/stagekit.js';
import { laneGroup, mergedOf, boxesOf, ownBoxes, hide } from './boxes.js';
import { dressTheatre } from './theatre.js';
import { dressFlats } from './flats.js';
import { dressProps } from './props.js';
import { dressTroupe } from './dummies.js';

/** The one palette every part draws from (Pip's sewing basket under stage light), and the light's warmth. */
export const WELL_LOOK = {
  palette: {
    linen: 0xe9dcc0, burlap: 0xb8945e, burlapDark: 0x7d5e36, walnut: 0x6b4226, maple: 0xc89a5c, brass: 0xd8a944, steel: 0xb8c0c8,
    velvet: 0x7a1424, velvetDeep: 0x3e0a14, gold: 0xe2b04a, chalk: 0xf4efe2, ink: 0x2a1a12,
    mustard: 0xd6a32a, teal: 0x2f7f7a, rose: 0xc8606a, sage: 0x8aa070, sky: 0x9cc4d8,
  },
  footlight: 0xffd6a0, haze: 0x3a2618,
};

const PARTS = [dressTheatre, dressFlats, dressProps, dressTroupe];

export class WellLook {
  constructor(game) { this.game = game; this.room = null; this.parts = []; this.laneId = null; this.ctx = null; }

  dress() {
    const g = this.game, W = g.strawmanWell, room = W.room;
    const add = (obj, id) => { const gr = room.getObjectByName(`strawmanwell.${id}`) || room; gr.add(obj); return obj; };
    this.ctx = { game: g, well: W, room, add, lanes: LANES, at: AT, color: COLOR, depth: DEPTH, back: BACK, palette: WELL_LOOK.palette,
      boxes: { laneGroup: (id) => laneGroup(W, id), mergedOf: (id, c) => mergedOf(W, id, c), boxesOf, ownBoxes: (id, c) => ownBoxes(W, id, c), hide } };
    this.parts = PARTS.map((f) => { try { return f(this.ctx) || null; } catch (e) { console.warn('wellLook', f.name, e); return null; } }).filter(Boolean);
    this.room = room; this.laneId = null;
  }

  undress() {
    for (const p of this.parts) { try { p.dispose?.(); } catch (e) { console.warn('wellLook', e); } }
    this.parts = []; this.room = null; this.ctx = null; this.laneId = null;
  }

  update(dt = 1 / 60) {
    const W = this.game.strawmanWell;
    if (!W) return;
    if (W.built && W.room && W.room !== this.room) { if (this.room) this.undress(); this.dress(); }
    else if (!W.built && this.room) { this.undress(); return; }
    if (!this.room) return;
    const id = W.stage?.id ?? null;
    if (id !== this.laneId) { this.laneId = id; for (const p of this.parts) p.lane?.(id); }
    const cam = this.game.camera;
    for (const p of this.parts) p.update?.(dt, cam);
  }
}
