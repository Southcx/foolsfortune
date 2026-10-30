// ---------------------------------------------------------------------------------------
// VANTAGES: hand-placed lookouts, where Wonder is woken (the owner, 2026-10-11: "wonder about exploring vistas that we specifically
// curate"; docs/plans/FEELINGS-AWAKENING.md section 2). A vantage is a spot to stand on and a view to look at: reached the first time the
// Courier stands in it, on their feet, and looks out its way for a moment (VANTAGE.hold real seconds), said once as `vantage.reach
// { vantage, by }`; its rule keeps the first (`vantage.<id>`, feedback/tracking/moves.js) and the awakening reads the count. Each is a
// place too (`vantage.<id>`), so a test can be set down at it. The view's framing (the camera turning to it, what is placed in it) is
// Calissa's; the spots are these.
//
// Prior art: Breath of the Wild's towers and Assassin's Creed's viewpoints (a climb whose prize is the view), Journey's and Firewatch's
// lookouts (the stop the game makes room for), Ōkami's scenes that teach a stroke where the land opens out.
//
//   VANTAGES [{ id, name, at(game) -> [x,y,z] | Vector3 | null, r, look(game) -> [x,y,z] | Vector3 | null (null: any way out) }]
//   new Vantages(game).update(rawDt)   .reached(id)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUNE, OASIS, POND } from './dunes/dunes.js';
import { crestOf, archOf } from './dunes/areacut.js';

/** `hold` real seconds stood in it looking out; `cone` the half-angle (degrees) of the look that counts; `rise` how far above or below
 *  the spot the feet may be; `every` how often it is asked (real s); `level` for a vantage with no one view: the look within this of the
 *  horizon (degrees). */
export const VANTAGE = { hold: 0.8, cone: 30, rise: 1.0, every: 0.2, level: 35 };

const OX = DUNE.x + OASIS.x, OY = DUNE.y + OASIS.y, OZ = DUNE.z + OASIS.z;
/** The first five, one a region (FEELINGS-AWAKENING.md section 5): the nearest first, for Wonder in the first hour. */
export const VANTAGES = [
  // the upper floor's atrium rail, looking down on the hall and the kiln (world/level.js: the slab's atrium, F2 7 m)
  { id: 'workshop.atrium', name: 'the atrium rail', at: () => [0, 7, -7], r: 2.2, look: () => [0, 0.5, 7] },
  // the Weir's pier end, over the pond and its pergola (tools/sondelass/angling/weir.js: the pier to POND.z - 4)
  { id: 'weir.pier', name: "the Weir's pier", at: () => [OX, OY, OZ + POND.z - 4.5], r: 1.8, look: () => [OX, OY + 1, OZ + POND.z + POND.rz] },
  // the jetty's end, the Emocean to the horizon (world/dunes/beach.js: the jetty runs out east)
  { id: 'shore.horizon', name: 'the jetty, at the horizon', at: (g) => g.dunes?.beach?.jetty?.end, r: 3,
    look: (g) => { const e = g.dunes?.beach?.jetty?.end; return e ? [e.x + 200, e.y + 2, e.z] : null; } },
  // the bowl's ledge, over the sleeping Great Slip Jelly (world/well/bowl.js: the Lip Stone's stand, facing the bowl)
  { id: 'bowl.ledge', name: "the bowl's ledge", at: (g) => g.bowl?.lipStand?.pos, r: 3, look: (g) => g.bowl?.world?.(0, 0, 0) },
  // the Gnomon's crown, 140 m over the sand (world/dunes/dunes.js: its collider's top), any way out
  { id: 'gnomon.crown', name: "the Gnomon's crown", at: (g) => { const s = g.dunes?.gnomon; return s ? [s.x, s.y + 140, s.z] : null; }, r: 9, look: () => null },
  // the crystal ridges' crest: the highest sand in the ridges (world/dunes/areacut.js crestOf), the ridges and the barrier below, any way out
  { id: 'ridges.crest', name: "the ridges' crest", at: (g) => crestOf(g, 'ridges'), r: 5, look: () => null },
  // the ruins' arch: the lintel of the tallest arch in the ruins (world/dunes/dunes.js arches), the ruins laid out below
  { id: 'ruins.arch', name: "the ruins' arch", at: (g) => archOf(g, 'ruins'), r: 2.6, look: () => null },
];

const v3 = (p, out) => (!p ? null : p.isVector3 ? out.copy(p) : out.set(p[0], p[1], p[2]));
const _at = new THREE.Vector3(), _to = new THREE.Vector3(), _f = new THREE.Vector3();

export class Vantages {
  constructor(game) {
    this.game = game; this.t = 0; this.held = {};
    for (const V of VANTAGES) game.places?.add?.(`vantage.${V.id}`, { name: V.name, at: () => v3(V.at(game), new THREE.Vector3()), note: 'a vantage (Wonder)', deck: true, near: 0.05 }); // (set down on the spot, at its own height: a rail, a pier, a crown)
  }

  /** Has it been reached (its first kept)? */
  reached(id) { return !!this.game.ledger?.firsts?.[`vantage.${id}`]; }

  update(raw = 1 / 60) {
    if ((this.t += raw) < VANTAGE.every) return;
    const dt = this.t; this.t = 0;
    const g = this.game, P = g.player, cam = g.camera;
    if (!P || !cam || !P.grounded || g.god?.active) { this.held = {}; return; }
    cam.getWorldDirection(_f);
    const cos = Math.cos(VANTAGE.cone * Math.PI / 180), level = Math.sin(VANTAGE.level * Math.PI / 180);
    for (const V of VANTAGES) {
      if (this.reached(V.id) || !v3(V.at(g), _at)) { this.held[V.id] = 0; continue; }
      const p = P.pos, inside = Math.hypot(p.x - _at.x, p.z - _at.z) < V.r && Math.abs(p.y - _at.y) < VANTAGE.rise;
      let looking = false;
      if (inside) {
        const target = v3(V.look(g), _to);
        looking = target ? _to.sub(cam.getWorldPosition(_at)).normalize().dot(_f) > cos : Math.abs(_f.y) < level;
      }
      this.held[V.id] = inside && looking ? (this.held[V.id] || 0) + dt : 0;
      if (this.held[V.id] >= VANTAGE.hold) { this.held[V.id] = 0; g.events?.emit('vantage.reach', { vantage: V.id, by: 'courier' }); }
    }
  }
}
