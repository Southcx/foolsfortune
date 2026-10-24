// ---------------------------------------------------------------------------------------
// A MADE TRACK IN THE WORLD (docs/plans/TRACK-EDITOR.md 3, 12): the track the editor wrote (progress/trackdef.js), built on the Raceway's
// build lot AS A HOUSE TRACK. Its line is a track.js track like the Sun Circuit's, on the lot's floor; the park's own ground is reshaped
// over the lot to its corridor (the running surface at each point's height, banked by its bends, its kickers, ramps and whoops, the berms
// and the blend back to the floor), in the terrain the park draws and in a physics height field laid over the lot, so the board rides it
// as it rides any track, through the same heightAt. Its furniture is the park's, built by the park's builders for this one track: the
// start's arch, the gates' pillars, the start pillar, columns, walls and arches (kit.js kitOf), the plates, lanes and geysers (marksOf),
// the rails and the sun rings (railsrings.js railsOf, ringsOf); its traps by world/raceway/traps.js. Built and taken down whole: an edit
// rebuilds it, and the lot's ground is laid flat again first.
//
// Prior art: Trackmania's blocks laid on its stadium's flat floor; ModNation Racers' ground fitted round a road laid as a line; the house's
// own track.js corridor and kit.
//
//   R.made = new MadeTrack(R)   .set(def) -> T (the built track, id 'made') | null   .clear()   .T   .def   .rule(id)   .heightAt(lx, lz) -> y | null
//   .reshape() (the lot's ground to the track: after the park's ground is built again)   .medals { gold, silver, bronze } (real s, three laps)
//   .ref (the ruler's reference race, real s)   .group
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { RW } from './track.js';
import { LOT, MEDAL_K, buildTrack, hashOf } from '../../progress/trackdef.js';
import { refLap } from '../../progress/skiffruler.js';
import { kitSink, kitOf, marksOf, nearAdd, nearDrop } from './kit.js';
import { railsOf, railMesh, ringsOf } from './railsrings.js';

const EDGE_FADE = 30; // (metres inside the lot's edge over which the track's ground eases back to the floor: no step where the lot meets the sand)
const LINE = { edge: 0x8a4a3a, centre: 0xffd696 }; // (the line's ribbons: the editor's view of it from 130 m, and the start's guide)

export class MadeTrack {
  constructor(R) { this.R = R; this.T = null; this.def = null; this.bodies = []; this.near = []; this.medals = null; this.ref = 0; this.patch = null; }
  get game() { return this.R.game; }

  /** Build a made track on the lot (the old one taken down first). Returns its track, or null if the line could not be laid. */
  set(def) {
    this.clear();
    let T = null; try { T = buildTrack(def); } catch { T = null; }
    if (!T || !(T.length > 50)) return null;
    const g = this.game, R = this.R;
    this.T = T; this.def = def; T.key = `made.${hashOf(def)}`; // (its ghosts and records are this geometry's: an edit is a new track)
    // the ruler's reference race, and medals at the Sun Circuit's ratio to its own (MEDAL_K: 0.718 for gold)
    this.ref = refLap(T, () => 1, { race: true }).seconds;
    this.medals = Object.fromEntries(Object.entries(MEDAL_K).map(([m, k]) => [m, Math.round(this.ref * k)]));
    this.reshape();
    const group = (this.group = new THREE.Group()); group.userData.zone = 'raceway'; g.scene.add(group);
    const add = (o) => group.add(o);
    // the park's builders, for this one track: rails first (the kit keeps its columns off them), then the kit, the marks, the rings
    const geos = [], rails = railsOf(R, T, geos); R.rails.push(...rails); if (geos.length) group.add(railMesh(geos));
    kitOf(R, T, kitSink(R, group, { bodies: this.bodies, onNear: (N) => { nearAdd(R, N); this.near.push(N); } }));
    marksOf(R, T, add);
    R.rings.push(...ringsOf(R, T, add, R.rings.length));
    this.drawLine();
    R.traps?.use(T);
    group.updateMatrixWorld(true);
    return T;
  }
  /** Take the made track down: its meshes, colliders, its entries in the Raceway's lists, its traps; the lot laid flat again. */
  clear() {
    const g = this.game, R = this.R;
    if (this.T && R.traps?.T === this.T) R.traps.clear();
    for (const G of R.geysers.filter((x) => x.track === 'made')) { G.look.group.removeFromParent(); G.look.dispose?.(); }
    for (const Rg of R.rings.filter((x) => x.track === 'made')) { Rg.look.group.removeFromParent(); Rg.look.dispose?.(); }
    if (this.group) { this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); this.group.removeFromParent(); this.group = null; }
    for (const b of this.bodies) g.physics?.world?.removeRigidBody(b); this.bodies = [];
    const mine = (x) => x.track !== 'made';
    R.geysers = R.geysers.filter(mine); R.plates = R.plates.filter(mine); R.pillars = (R.pillars || []).filter(mine); R.rails = R.rails.filter(mine); R.rings = R.rings.filter(mine);
    for (const N of this.near) nearDrop(R, N); this.near = [];
    const had = !!this.T; this.T = null; this.def = null;
    if (had) this.reshape();
  }
  /** Whether a track's rule (trackdef.js RULES) holds on the made track. */
  rule(id) { return !!this.def?.rules?.includes(id); }

  // ---------------------------------------------------------------- the ground
  /** The made track's ground at a park-local point on the lot (y over the layer's floor), or null off the lot: its corridor on the
   *  lot's floor, eased back to the floor at the lot's edge. Read where the park's built ground is not (raceway.heightAt's fallback). */
  heightAt(lx, lz) {
    const x = lx - LOT.x, z = lz - LOT.z, d = Math.max(Math.abs(x), Math.abs(z)); if (d > LOT.half) return null;
    if (!this.T) return null;
    const k = Math.min(1, (LOT.half - d) / EDGE_FADE);
    return LOT.y + (this.T.heightAt(lx, lz) - LOT.y) * k * k * (3 - 2 * k);
  }
  /** The lot's ground to the made track (or flat, with none): written into the park's terrain where it is built (its heights, which the
   *  Raceway's heightAt reads, and its drawn vertices and normals over the lot), and a physics height field over the lot. The lot lies
   *  on the terrain's grid (its corners are whole samples), so the made track's ground is the park's own, cell for cell. */
  reshape() {
    const R = this.R, TR = R.chunks, step = RW.step, n = Math.round((2 * LOT.half) / step) + 1;
    const hs = new Float32Array(n * n), x0 = LOT.x - LOT.half, z0 = LOT.z - LOT.half;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) hs[i * n + j] = this.heightAt(x0 + i * step, z0 + j * step) ?? LOT.y;
    if (TR) writeTerrain(TR, Math.round((x0 + RW.half) / step), Math.round((z0 + RW.half) / step), n, hs, step);
    // the physics: a height field over the lot (the park's own under it stays flat, and never higher)
    const W = this.game.physics?.world; if (!W) return;
    if (this.patch) { W.removeRigidBody(this.patch); this.patch = null; }
    if (!this.T) return;
    this.patch = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(RW.x + LOT.x, RW.y, RW.z + LOT.z));
    W.createCollider(RAPIER.ColliderDesc.heightfield(n - 1, n - 1, hs, { x: 2 * LOT.half, y: 1, z: 2 * LOT.half }).setFriction(0.9).setCollisionGroups(GROUPS.static), this.patch);
  }

  // ---------------------------------------------------------------- the line's guide (a placeholder: the editor reads it from 130 m)
  drawLine() {
    const T = this.T, R = this.R, mk = (offset, width, color, step) => {
      const pos = [], idx = []; let k = 0;
      for (let s = 0; s <= T.length + 0.01; s += step) {
        const F = T.frame(s % T.length), rx = -F.fz, rz = F.fx, lat = offset(F);
        for (const e of [-width / 2, width / 2]) { const lx = F.x + rx * (lat + e), lz = F.z + rz * (lat + e); pos.push(RW.x + lx, R.heightAt(RW.x + lx, RW.z + lz) + 0.08, RW.z + lz); }
        if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); k++;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      this.group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false })));
    };
    mk((F) => -F.w, 1.2, LINE.edge, 2); mk((F) => F.w, 1.2, LINE.edge, 2); mk(() => 0, 0.4, LINE.centre, 3);
  }
}

/** Heights `hs` (n x n, column-major as the terrain's: i along x) written into a ChunkTerrain from its sample (i0, j0): its kept heights,
 *  its drawn vertices (each chunk edge's skirt foot following, as deep as it hung) and normals, and only those rows sent to the card.
 *  (render/terrain.js's layout: Petra's; asked to take this in as a method, docs/handoffs/petra/.) */
function writeTerrain(TR, i0, j0, n, hs, step) {
  const N = TR.n, C = TR.chunk, H = TR.heights, geo = TR.geometry, pos = geo.attributes.position, nor = geo.attributes.normal, P = pos.array, Nn = nor.array;
  const edge = (I, J) => I % C === 0 || J % C === 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const I = i0 + i, J = j0 + j, y = hs[i * n + j], o = (J * N + I) * 3, was = P[o + 1];
    H[I * N + J] = y; P[o + 1] = y;
    if (edge(I, J)) { const sk = TR.skirtAt(I, J) * 3 + 1; P[sk] = y - (was - P[sk]); }
  }
  const Hc = (I, J) => H[Math.min(N - 1, Math.max(0, I)) * N + Math.min(N - 1, Math.max(0, J))];
  const Ia = Math.max(0, i0 - 1), Ib = Math.min(N - 1, i0 + n), Ja = Math.max(0, j0 - 1), Jb = Math.min(N - 1, j0 + n);
  for (let J = Ja; J <= Jb; J++) for (let I = Ia; I <= Ib; I++) {
    const nx = Hc(I - 1, J) - Hc(I + 1, J), nz = Hc(I, J - 1) - Hc(I, J + 1), ny = 2 * step, l = Math.hypot(nx, ny, nz), o = (J * N + I) * 3;
    Nn[o] = nx / l; Nn[o + 1] = ny / l; Nn[o + 2] = nz / l;
    if (edge(I, J)) Nn.set([Nn[o], Nn[o + 1], Nn[o + 2]], TR.skirtAt(I, J) * 3);
  }
  const s0 = TR.skirtAt(Ia - (Ia % C), Ja), s1 = TR.skirtAt(Math.min(N - 1, Ib + ((C - (Ib % C)) % C)), Jb);
  for (const A of [pos, nor]) {
    A.clearUpdateRanges();
    for (let J = Ja; J <= Jb; J++) A.addUpdateRange((J * N + Ia) * 3, (Ib - Ia + 1) * 3);
    A.addUpdateRange(s0 * 3, (s1 - s0 + 1) * 3); A.needsUpdate = true;
  }
}
