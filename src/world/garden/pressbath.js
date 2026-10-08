// ---------------------------------------------------------------------------------------
// THE PRESS'S BATH, THE ADAPTER (docs/plans/SOUL-ALCHEMY.md 4.4 to 4.10): what the station's logic (world/garden/press.js) calls,
// handed to Calissa's look, which replaced Petra's stand-in (v116) without the logic changing: the BASIN (the stone, its kerb and its
// carved seals, the ware ring: vfx/alchemy/basin.js), the BATH (the liquid, its dish, its spreads and breaks, the inward rings, the
// draught's current; the tiles, the soul bead and the ghost bead: vfx/alchemy/bath.js), the PATHS (the ghost path, the queue, the
// line blend, the lumps: vfx/alchemy/paths.js), all drawn on the MARKS (one instanced program: vfx/alchemy/marks.js), every colour
// from `wheelColour(h, s)` (vfx/wheelcolour.js), so a bead and its tile are the same function.
//
// Prior art: the section 4 labels (test tiles in a glaze bath, the tsukubai, Albers' neutral ground, Potion Craft's previewed path).
//
//   const B = new PressBath(frame, parent)   frame: { O, U, N, E, R (the bath's radius) }   B.at(h, s, out) -> world point
//   B.tiles(list)   B.bead(c, { viewing, draught, walking }?)   B.ghost(trail)   B.queue(trail, ends?)   B.drop(c)   B.clearDrops()
//   B.lumps(list)   B.dispose()   (the options and `ends` are optional: without them the bead always shows and the queue has no rings)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wheelColour } from '../../vfx/wheelcolour.js';
import { Marks } from '../../vfx/alchemy/marks.js';
import { Basin, NORTH_HUE, wheelPoint } from '../../vfx/alchemy/basin.js';
import { Bath } from '../../vfx/alchemy/bath.js';
import { Paths } from '../../vfx/alchemy/paths.js';

export { NORTH_HUE };
export const colourOf = (h, s, out) => wheelColour(h, s, out); // (the stand-in's name, kept for its callers: wheelColour itself)
const _inv = new THREE.Matrix4();

export class PressBath {
  constructor(frame, parent) {
    this.f = frame; const { O, U, R } = frame;
    const g = this.group = new THREE.Group(); g.name = 'press-bath'; parent.add(g);
    g.position.copy(O); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(frame.E, U, frame.N.clone().negate())); // (local x east, y up, -z north)
    this.marks = new Marks(g); this.basin = new Basin(g, this.marks, { R }); this.bath = new Bath(g, this.marks, { R }); this.paths = new Paths(g, this.marks, { R });
    this.qLen = 0; this.sealed = false; this.t0 = performance.now();
  }
  get drops() { return { count: Math.min(this.paths.nDrops, 96) }; } // (the line blend's droplets laid since the last clear: the station's test reads it)

  /** A colour's place on the bath, in the bath's own frame (y up): hue the bearing clockwise from north, saturation the distance out. */
  local(h, s, out = new THREE.Vector3()) { wheelPoint(h, s, this.f.R, out); out.y = 0.03; return out; }
  at(h, s, out = new THREE.Vector3()) { return this.group.localToWorld(this.local(h, s, out)); }

  /** The tiles: [{ h, s, r (radius now), bare (the rank's radius), rank?, stars? }] (distance units: half the wheel's chord). */
  tiles(list) { if (!this.sealed) { this.basin.seals(list.map((t) => t.h)); this.sealed = true; } this.bath.tiles(list); }
  bead(c, opts = {}) {
    const now = performance.now(), dt = Math.min(0.1, (now - this.t0) / 1000); this.t0 = now;
    this.basin.update(dt, opts.viewing === false ? 0 : 1); this.bath.bead(c, opts); this.marks.update();
  }
  /** The hovered lump's ghost path and its ghost bead (null: none): drawn from where the waiting lumps leave the bead. */
  ghost(trail) {
    const from = trail && this.qLen > 1 ? Math.min(trail.length - 1, this.qLen - 1) : 0, rev = this.paths.ghost(trail, from);
    const e = trail?.length > 1 ? trail[trail.length - 1] : null;
    this.bath.ghostBead(rev >= 1 ? e : null, !!e && e.s < trail[from].s - 0.02);
    this.marks.flush();
  }
  queue(trail, ends = null) { this.qLen = trail?.length || 0; this.paths.queue(trail, ends); }
  /** The line blend: a droplet where the bead stood, in its colour then. */
  drop(c) { this.paths.drop(c); }
  clearDrops() { this.paths.clearDrops(); this.marks.flush(); }
  /** The lumps: [{ pos (world), h, s, big, m }]. */
  lumps(list) {
    _inv.copy(this.group.matrixWorld).invert();
    this.paths.lumps(list.map((L) => ({ ...L, pos: L.pos.clone().applyMatrix4(_inv) })));
    this.marks.flush();
  }
  dispose() { this.group.removeFromParent(); this.basin.dispose(); this.bath.dispose(); this.paths.dispose(); this.marks.dispose(); }
}
