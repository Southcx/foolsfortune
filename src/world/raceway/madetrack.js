// ---------------------------------------------------------------------------------------
// A MADE TRACK IN THE WORLD (docs/plans/TRACK-EDITOR.md 3): the track the editor wrote (progress/trackdef.js), built on the Raceway's build
// lot as a track the race engine rides like the park's own: its line (track.js), its start arch, its gate pillars, its start pillar (F there
// races it), its pieces (ramps and hills the board rides through `rise`, pillars, walls and arches as colliders, sun plates, vein lanes and
// geysers as the Raceway's own furniture), and its traps (world/raceway/traps.js). Built and taken down whole: an edit rebuilds it, the
// lot's ground never changes (it is laid flat for this: park.js), so nothing of the park's field is worked out again.
// The looks here are placeholders in the kit's clay (a flat-shaded box, a wedge), for Calissa to dress; the line is drawn as two edge
// ribbons and a faint centre ribbon on the lot's sand.
//
// Prior art: Trackmania's blocks laid on its stadium's flat floor; the house's own kit (world/raceway/kit.js: the arch, the gate pillars,
// the start pillar), and its marks (the plates, the lanes, the geysers).
//
//   R.made = new MadeTrack(R)   .set(def) -> T (the built track, id 'made') | null   .clear()   .T   .def   .rise(lx, lz) -> metres
//   .medals { gold, silver, bronze } (real s, three laps)   .ref (the ruler's reference race, real s)   .group
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { addOutline } from '../../render/outline.js';
import { SlipGeyser } from '../../vfx/slipgeyser.js';
import { track, RW } from './track.js';
import { LOT, MEDAL_K, toTrackDef, gatesFor, hashOf } from '../../progress/trackdef.js';
import { PIECES, pieceHeight, pieceRadius } from '../../progress/trackpieces.js';
import { refLap } from '../../progress/skiffruler.js';
import { GEYSER } from './kit.js';

const CELL = 24; // (metres a cell of the pieces' grid: rise() looks at one cell and its neighbours)
const TRI_FLAGS = RAPIER.TriMeshFlags?.FIX_INTERNAL_EDGES ?? 0;
const CLAY = { stone: 0xd9906a, dark: 0x8a4a3a, band: 0xffd696, ramp: 0xc8845e, edge: 0xf2d4a8, centre: 0xffe0b0 };

/** A made track's track.js object: measured once, then laid again with its gates spaced by its length. */
export function buildTrack(def) {
  const ground = () => LOT.y, T0 = track(toTrackDef(def), ground);
  return track(toTrackDef(def, gatesFor(T0)), ground);
}

export class MadeTrack {
  constructor(R) { this.R = R; this.T = null; this.def = null; this.pieces = []; this.grid = new Map(); this.bodies = []; this.nearKeys = []; this.medals = null; this.ref = 0; }
  get game() { return this.R.game; }
  /** World point of a lot-local point at the floor (plus `up`). */
  w(lx, lz, up = 0) { return new THREE.Vector3(RW.x + LOT.x + lx, RW.y + LOT.y + up, RW.z + LOT.z + lz); }

  /** Build a made track on the lot (the old one taken down first). Returns its track, or null if the line could not be laid. */
  set(def) {
    this.clear();
    let T = null; try { T = buildTrack(def); } catch { T = null; }
    if (!T || !(T.length > 50)) return null;
    this.T = T; this.def = def; T.key = `made.${hashOf(def)}`; // (its ghosts and records are this geometry's: an edit is a new track)
    // the ruler's reference race, and medals at the Sun Circuit's ratio to its own (MEDAL_K: 0.718 for gold)
    this.ref = refLap(T, () => 1, { race: true }).seconds;
    this.medals = Object.fromEntries(Object.entries(MEDAL_K).map(([m, k]) => [m, Math.round(this.ref * k)]));
    const g = this.game, group = (this.group = new THREE.Group()); group.userData.zone = 'raceway'; g.scene.add(group);
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true });
    this.drawLine(); this.drawKit();
    this.pieces = def.pieces.map((P) => ({ ...P, r: pieceRadius(P) }));
    for (const P of this.pieces) { this.index(P); this.drawPiece(P); }
    this.R.traps?.build(def, T);
    group.updateMatrixWorld(true);
    return T;
  }
  /** Take the made track down: its meshes, colliders, the Raceway's lists' entries of it, its traps. */
  clear() {
    const g = this.game, R = this.R;
    R.traps?.clear();
    if (this.group) { this.group.traverse((o) => { o.geometry?.dispose?.(); }); this.group.removeFromParent(); this.group = null; }
    for (const b of this.bodies) g.physics?.world?.removeRigidBody(b); this.bodies = [];
    for (const G of this.geysers || []) { G.look.group.removeFromParent(); G.look.dispose?.(); } this.geysers = [];
    R.geysers = R.geysers.filter((G) => !G.made); R.plates = R.plates.filter((P) => P.track !== 'made'); R.pillars = (R.pillars || []).filter((P) => P.track !== 'made');
    for (const [k, N] of this.nearKeys) { const l = R.nearGrid?.get(k); if (l) { const i = l.indexOf(N); if (i >= 0) l.splice(i, 1); } } this.nearKeys = [];
    this.grid = new Map(); this.pieces = []; this.T = null; this.def = null;
    this.mat?.dispose(); this.mat = null;
  }

  // ---------------------------------------------------------------- what the board rides
  index(P) {
    if (!PIECES[P.kind]?.ride) return;
    const r = P.r, x0 = Math.floor((P.x - r) / CELL), x1 = Math.floor((P.x + r) / CELL), z0 = Math.floor((P.z - r) / CELL), z1 = Math.floor((P.z + r) / CELL);
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) { const k = `${a},${b}`; if (!this.grid.has(k)) this.grid.set(k, []); this.grid.get(k).push(P); }
  }
  /** The ridden pieces' height over the lot's floor at a park-local point (0 off them, or off the lot). */
  /** Whether a track's rule (Spellscription's: trackdef.js RULES) holds on the made track. */
  rule(id) { return !!this.def?.rules?.includes(id); }
  rise(lx, lz) {
    if (!this.grid.size) return 0;
    const x = lx - LOT.x, z = lz - LOT.z; if (Math.abs(x) > LOT.half || Math.abs(z) > LOT.half) return 0;
    const l = this.grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`); if (!l) return 0;
    let h = 0; for (const P of l) h = Math.max(h, pieceHeight(P, x, z));
    return h;
  }

  // ---------------------------------------------------------------- the placeholders
  painted(geo, color) { const g2 = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g2.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g2.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g2; }
  solid(geo, pos, yaw, half) {
    const m = new THREE.Mesh(geo, this.mat); m.position.copy(pos); m.rotation.y = yaw; m.castShadow = m.receiveShadow = true; addOutline(m); this.group.add(m);
    const W = this.game.physics?.world; if (!W || !half) return m;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(q));
    W.createCollider(RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z).setCollisionGroups(GROUPS.static).setFriction(0.9), b); this.bodies.push(b);
    return m;
  }
  near(p, r, what) { const R = this.R, N = { key: `made${this.nearKeys.length}`, x: p.x, y: p.y, z: p.z, r, what }, k = `${Math.floor(N.x / 20)},${Math.floor(N.z / 20)}`; if (!R.nearGrid) R.nearGrid = new Map(); if (!R.nearGrid.has(k)) R.nearGrid.set(k, []); R.nearGrid.get(k).push(N); this.nearKeys.push([k, N]); }
  ribbon(offset, width, color, step = 2) {
    const T = this.T, pos = [], idx = []; let n = 0;
    for (let s = 0; s <= T.length + 0.01; s += step) {
      const F = T.frame(s % T.length), rx = -F.fz, rz = F.fx, lat = offset(F);
      for (const e of [-width / 2, width / 2]) { const lx = F.x + rx * (lat + e), lz = F.z + rz * (lat + e); pos.push(RW.x + lx, RW.y + LOT.y + 0.06 + this.rise(lx, lz), RW.z + lz); }
      if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n); n++;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.group.add(m); return m;
  }
  drawLine() { this.ribbon((F) => -F.w, 0.5, CLAY.edge); this.ribbon((F) => F.w, 0.5, CLAY.edge); this.ribbon(() => 0, 0.25, CLAY.centre, 3); }
  pillarGeo(h, w = 1.5) { return this.painted(new THREE.BoxGeometry(w, h, w), CLAY.stone); }
  drawKit() {
    const T = this.T, side = (s, lat) => { const F = T.frame(s); return { x: F.x - F.fz * lat, z: F.z + F.fx * lat, yaw: Math.atan2(F.fx, F.fz) }; };
    const at = (p, up) => new THREE.Vector3(RW.x + p.x, RW.y + LOT.y + up, RW.z + p.z);
    // the start's arch, the gates' pillars (the kit's), the start pillar (F there races it: race.js offer)
    { const F = T.frame(T.line), a = side(T.line, -(F.w + 3)), b = side(T.line, F.w + 3);
      for (const p of [a, b]) { this.solid(this.pillarGeo(12, 2.2), at(p, 6), p.yaw, { x: 1.1, y: 6, z: 1.1 }); this.near(at(p, 0), 1.4, 'arch'); }
      const len = Math.hypot(a.x - b.x, a.z - b.z) + 2.6; this.solid(this.painted(new THREE.BoxGeometry(len, 1.4, 2), CLAY.dark), at({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, 12.6), a.yaw + Math.PI / 2, { x: len / 2, y: 0.7, z: 1 }); }
    for (const s of T.gates) { const F = T.frame(s); for (const lat of [-(F.w + 2.5), F.w + 2.5]) { const p = side(s, lat); this.solid(this.pillarGeo(8), at(p, 4), p.yaw, { x: 0.75, y: 4, z: 0.75 }); this.near(at(p, 0), 1, 'pillar'); } }
    { const F = T.frame(T.line), p = side(T.line, -(F.w + 7)), pos = at(p, 7.5);
      this.solid(this.painted(new THREE.CylinderGeometry(0.8, 3, 16, 6), 0xf0c8f0), pos, 0, { x: 2.4, y: 8, z: 2.4 }); this.R.pillars.push({ track: 'made', pos: at(p, 0) }); }
  }
  drawPiece(P) {
    const K = PIECES[P.kind], g = this.game, R = this.R, T = this.T, yaw = P.yaw || 0, s = Math.sin(yaw), c = Math.cos(yaw);
    const toLot = (a, cc) => ({ x: P.x + a * s + cc * c, z: P.z + a * c - cc * s }); // (a piece's own frame to the lot: `a` along, `cc` across)
    if (K.ride) {
      // a grid of the ridden surface (its own height function), and its front wall where a wedge ends in a lip; a trimesh to stand on
      const Rd = K.ride, na = Rd.shape === 'hill' ? 14 : 10, nc = Rd.shape === 'hill' ? 14 : 2, pos = [], idx = [];
      for (let i = 0; i <= na; i++) for (let j = 0; j <= nc; j++) { const a = -Rd.len / 2 + (Rd.len * i) / na, cc = -Rd.w / 2 + (Rd.w * j) / nc, q = toLot(a, cc); pos.push(RW.x + LOT.x + q.x, RW.y + LOT.y + pieceHeight(P, q.x, q.z) + 0.02, RW.z + LOT.z + q.z); }
      for (let i = 0; i < na; i++) for (let j = 0; j < nc; j++) { const k = i * (nc + 1) + j; idx.push(k, k + nc + 1, k + 1, k + 1, k + nc + 1, k + nc + 2); }
      if (Rd.shape === 'wedge') { const base = pos.length / 3, l = toLot(Rd.len / 2, -Rd.w / 2), r = toLot(Rd.len / 2, Rd.w / 2);
        for (const q of [l, r]) pos.push(RW.x + LOT.x + q.x, RW.y + LOT.y + Rd.h, RW.z + LOT.z + q.z); for (const q of [l, r]) pos.push(RW.x + LOT.x + q.x, RW.y + LOT.y, RW.z + LOT.z + q.z);
        idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(this.painted(geo, CLAY.ramp), this.mat); m.castShadow = m.receiveShadow = true; addOutline(m); this.group.add(m);
      const W = g.physics?.world; if (W) { const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed()); W.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(pos), new Uint32Array(idx), TRI_FLAGS).setCollisionGroups(GROUPS.static).setFriction(0.9), b); this.bodies.push(b); }
      return;
    }
    if (K.solid) {
      for (const p of K.solid.parts) { const q = toLot(p.z, p.x), pos = this.w(q.x, q.z, p.y); this.solid(this.painted(new THREE.BoxGeometry(p.sx, p.sy, p.sz), p.sy > 2 ? CLAY.stone : CLAY.dark), pos, yaw, { x: p.sx / 2, y: p.sy / 2, z: p.sz / 2 }); if (p.y < 4) this.near(this.w(q.x, q.z), Math.max(p.sx, p.sz) / 2, P.kind); }
      return;
    }
    if (K.mark === 'geyser') {
      const look = new SlipGeyser({ height: 24, radius: GEYSER.r, seed: 90 + (this.geysers?.length || 0) }), pos = this.w(P.x, P.z);
      look.group.position.copy(pos); look.group.userData.zone = 'raceway'; g.scene.add(look.group);
      const G = { look, pos, thrown: false, made: true }; (this.geysers ||= []).push(G); R.geysers.push(G); return;
    }
    // a plate or a vein lane: on the line where it lies (its s and lat), laid along it as the kit's are (kit.js buildMarks)
    const n = T.nearest(P.x + LOT.x, P.z + LOT.z); if (!n) return;
    const Sz = K.size, mat = new THREE.MeshBasicMaterial({ color: K.mark === 'lane' ? 0x7fdcff : 0xffd36b, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const slab = (sAt, len) => { const F = T.frame(sAt), m = new THREE.Mesh(new THREE.PlaneGeometry(Sz.w * 2, len).rotateX(-Math.PI / 2), mat); m.position.set(RW.x + F.x - F.fz * n.lat, RW.y + LOT.y + 0.08, RW.z + F.z + F.fx * n.lat); m.rotation.y = Math.atan2(F.fx, F.fz); this.group.add(m); return m; };
    const s0 = (n.s - Sz.len / 2 + T.length) % T.length, Pl = { track: 'made', line: 'main', s0, s1: s0 + Sz.len, lat: n.lat, w: Sz.w, index: R.plates.length, ...(K.mark === 'lane' ? { lane: true, vein: true, meshes: [] } : {}) };
    if (K.mark === 'lane') { for (let u = 0; u < Sz.len; u += 5) Pl.meshes.push(slab(s0 + u + 2.5, 5.2)); Pl.mesh = Pl.meshes[0]; } else Pl.mesh = slab(n.s, Sz.len);
    R.plates.push(Pl);
  }
}
