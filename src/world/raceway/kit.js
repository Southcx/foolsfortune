// ---------------------------------------------------------------------------------------
// THE RACEWAY'S KIT (docs/plans/SKIFF-RACING.md sections 5 and 10): every track's furniture, of the Dunes' ruins, laid by the track's data
// (track.js, tracks/*.js): its start's arch, a pair of pillars at each gate, its start pillar (a small Gnomon: F there begins a race on
// it), the slalom's columns; its sun plates and the cavern's crystal veins (placeholders under Calissa's looks), its slip geysers, and a
// sandfall down the face under each of its cliffs (Calissa's curtain, vfx/racewaysandfall.js, hung where the ground is measured to be
// sheer). One merged batch of ruins with their colliders (render/merge.js) for the whole park.
//
// Prior art: the house's own Raceway kit (it was raceway.js's buildKit and buildMarks for one track), Gran Turismo's and Trackmania's
// kits of track furniture laid by data.
//
//   buildKit(raceway) (raceway.pillars [{ track, pos }], raceway.nearList: what a near miss is counted past)   buildMarks(raceway)
//   (raceway.plates (a vein lane's with `lane`), .geysers, .sandfalls)   GEYSER   nearThings(raceway, pos) -> [{ key, x, y, z, r, what }]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { addOutline } from '../../render/outline.js';
import { mergeStatic } from '../../render/merge.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SlipGeyser } from '../../vfx/slipgeyser.js';
import { RacewaySandfall } from '../../vfx/racewaysandfall.js';

export const GEYSER = { up: 18, r: 4, over: 4 }; // (as the Dunes' slip geysers: world/dunes/geysers.js LAUNCH)
const RAIL_CLEAR = 2.5; // (metres a slalom column keeps from a rail's line: the column's radius, the lintel's half-width and room for the board)
const NEAR_CELL = 20; // (metres a cell of the near-miss grid)
const SANDFALL_FOOT = 0.6; // (the slope (m down a m out) under which the face has become the hill: a sandfall's foot)

const painted = (geo, color) => { const g2 = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g2.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g2.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g2.attributes)) if (!['position', 'normal', 'color'].includes(k)) g2.deleteAttribute(k); return g2; };
/** A point beside a track's line: `lat` metres to its right at s, on the ground. */
export const sideOf = (R, T, s, lat) => { const F = T.frame(s); return R.local(F.x - F.fz * lat, F.z + F.fx * lat); };
const yawAt = (T, s) => { const F = T.frame(s); return Math.atan2(F.fx, F.fz); };

export function buildKit(R) {
  const g = R.game, W = g.physics.world, group = (R.group = new THREE.Group()); group.userData.zone = 'raceway';
  const vc = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true });
  const solid = (geo, pos, quat, collider) => {
    const m = new THREE.Mesh(geo, vc); m.position.copy(pos); m.quaternion.copy(quat); m.castShadow = m.receiveShadow = true; addOutline(m); group.add(m);
    const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(quat)); W.createCollider(collider.setCollisionGroups(GROUPS.static).setFriction(0.9), b);
  };
  const yawQ = (yaw) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const pillar = (p, h, w = 1.6, yaw = 0) => { // (a ruin pillar, the Dunes' own: clay, a gold band, a dark cap)
    const geo = mergeGeometries([painted(new THREE.BoxGeometry(w, h, w), 0xd9906a), painted(new THREE.BoxGeometry(w * 1.02, 0.25, w * 1.02).translate(0, h * 0.22, 0), 0xffd696), painted(new THREE.ConeGeometry(w * 0.72, w * 1.1, 4).rotateY(Math.PI / 4).translate(0, h / 2 + w * 0.5, 0), 0x8a4a3a)]);
    solid(geo, p.clone().setY(p.y + h / 2 - 1.5), yawQ(yaw), RAPIER.ColliderDesc.cuboid(w / 2, h / 2, w / 2));
  };
  const nearRail = (p) => R.rails.some(({ pts }) => pts.some((a, i) => { const b = pts[i + 1]; if (!b) return false; const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz; if (l2 < 1e-4) return false; const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2)); return Math.hypot(p.x - a.x - dx * u, p.z - a.z - dz * u) < RAIL_CLEAR; }));
  R.pillars = []; R.nearList = [];
  const near = (p, r, what) => R.nearList.push({ key: `near${R.nearList.length}`, x: p.x, y: p.y, z: p.z, r, what }); // (a near miss is counted past these: boardrules.js)
  for (const T of R.tracks) {
    // the start's arch over the line, and a gate's pair of pillars at each of its gates
    { const s = T.line, F = T.frame(s), a = sideOf(R, T, s, -(F.w + 3)), b = sideOf(R, T, s, F.w + 3), top = Math.max(a.y, b.y) + 11;
      pillar(a, top - a.y + 1.5, 2.2, yawAt(T, s)); pillar(b, top - b.y + 1.5, 2.2, yawAt(T, s)); near(a, 1.4, 'arch'); near(b, 1.4, 'arch');
      const mid = a.clone().add(b).multiplyScalar(0.5).setY(top + 0.6), len = a.distanceTo(b.clone().setY(a.y)) + 2.6;
      solid(painted(new THREE.BoxGeometry(len, 1.4, 2.0), 0x8a4a3a), mid, yawQ(yawAt(T, s) + Math.PI / 2), RAPIER.ColliderDesc.cuboid(len / 2, 0.7, 1.0)); }
    for (const s of T.gates) { const F = T.frame(s), a = sideOf(R, T, s, -(F.w + 2.5)), b = sideOf(R, T, s, F.w + 2.5); pillar(a, 8, 1.5, yawAt(T, s)); pillar(b, 8, 1.5, yawAt(T, s)); near(a, 1, 'pillar'); near(b, 1, 'pillar'); }
    // the slalom: broken columns in the line, side to side (none within RAIL_CLEAR of a rail: the owner's v195 / Petra's measure)
    const S = T.features.slalom;
    if (S) { const s0 = T.sOf(...S.from), s1 = T.sOf(...S.to); let k = 0;
      for (let s = s0; s < s1; s += S.every, k++) { const p = sideOf(R, T, s, (k % 2 ? 1 : -1) * S.lat), h = 4 + (k % 3), w = 1.3; if (nearRail(p)) continue;
        solid(painted(new THREE.CylinderGeometry(w * 0.8, w, h, 8), k % 2 ? 0xd9906a : 0x8a4a3a), p.clone().setY(p.y + h / 2 - 0.6), yawQ(k), RAPIER.ColliderDesc.cylinder(h / 2, w * 0.9)); near(p, w * 0.9, 'column'); } }
    // its start pillar: a small Gnomon left of the line beyond the berm (F at its foot: a race on this track)
    { const F = T.frame(T.line), p = R.local(F.x + F.fz * (F.w + 7), F.z - F.fx * (F.w + 7)), spire = painted(new THREE.CylinderGeometry(0.8, 3, 16, 6), T.id === 'sun' ? 0xf6d9b8 : T.id === 'gorge' ? 0xe0805a : 0x9ad8a0);
      solid(spire, p.clone().setY(p.y + 7.5), yawQ(0), RAPIER.ColliderDesc.cylinder(8, 2.4)); R.pillars.push({ track: T.id, pos: p }); }
  }
  // the race board at the hub: a squat stone with a sun on it (F there: the tracks, race.js openBoard)
  { const H = R.P.hub, p = R.local(H.x + 6, H.z + 2); solid(painted(new THREE.BoxGeometry(3.2, 2.4, 0.8), 0x8a4a3a), p.clone().setY(p.y + 1.1), yawQ(0), RAPIER.ColliderDesc.cuboid(1.6, 1.2, 0.4)); R.board = p; }
  g.scene.add(group); group.updateMatrixWorld(true); mergeStatic(group);
  R.nearGrid = new Map(); for (const N of R.nearList) { const k = `${Math.floor(N.x / NEAR_CELL)},${Math.floor(N.z / NEAR_CELL)}`; if (!R.nearGrid.has(k)) R.nearGrid.set(k, []); R.nearGrid.get(k).push(N); }
}
/** What a near miss could be counted past round a point: the cell it is in and the eight round it (a fresh list: the caller may add to it). */
export function nearThings(R, p) {
  const out = [], cx = Math.floor(p.x / NEAR_CELL), cz = Math.floor(p.z / NEAR_CELL); if (!R.nearGrid) return out;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = R.nearGrid.get(`${cx + a},${cz + b}`); if (l) out.push(...l); }
  return out;
}

export function buildMarks(R) {
  const g = R.game;
  const plateMat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const veinMat = plateMat.clone(); veinMat.color.set(0x7fdcff);
  const slab = (mat, Fr, lat, P) => { const c = R.local(Fr.x - Fr.fz * lat, Fr.z + Fr.fx * lat), m = new THREE.Mesh(new THREE.PlaneGeometry(P.w * 2, P.len).rotateX(-Math.PI / 2), mat); m.position.copy(c).setY(c.y + 0.08); m.rotation.y = Math.atan2(Fr.fx, Fr.fz); m.userData.zone = 'raceway'; m.renderOrder = 3; g.scene.add(m); return m; };
  R.sandfalls = [];
  for (const T of R.tracks) {
    for (const P of T.features.plates) { const s = T.sOf(P.cp, P.at); R.plates.push({ track: T.id, line: 'main', s0: s, s1: s + P.len, lat: P.lat, w: P.w, mesh: slab(plateMat, T.frame(s + P.len / 2), P.lat, P), index: R.plates.length }); }
    // the vein lanes: long strips of Lachrymite beside the line that refill the pool while ridden (F-Zero's pit: boardrules.js); laid
    // as slabs a few metres long along their stretch, so they follow its curve (a placeholder: Calissa's look)
    for (const P of T.features.lanes || []) { const s = T.sOf(P.cp, P.at), Pl = { track: T.id, line: 'main', lane: true, vein: true, s0: s, s1: s + P.len, lat: P.lat, w: P.w, index: R.plates.length, meshes: [] };
      for (let u = 0; u < P.len; u += 5) Pl.meshes.push(slab(veinMat, T.frame(s + u + 2.5), P.lat, { w: P.w, len: 5.2 }));
      Pl.mesh = Pl.meshes[0]; R.plates.push(Pl); }
    // the cavern's crystal veins: pads as the plates, on its branch, fed by Lachryma, not the sun
    for (const P of T.branch?.def?.pads || []) R.plates.push({ track: T.id, line: 'cavern', vein: true, s0: P.at, s1: P.at + P.len, lat: P.lat, w: P.w, mesh: slab(veinMat, T.branch.frame(P.at + P.len / 2), P.lat, P), index: R.plates.length });
    for (const G of T.features.geysers) {
      const s = T.sOf(G.cp, G.at), pos = sideOf(R, T, s, G.lat), look = new SlipGeyser({ height: 24, radius: GEYSER.r, seed: 40 + R.geysers.length });
      look.group.position.copy(pos); look.group.userData.zone = 'raceway'; g.scene.add(look.group); R.geysers.push({ look, pos, thrown: false });
    }
    // a sandfall down the face under each cliff: hung at the lip itself, down to where the ground stops being sheer, measured on the
    // ground as drawn (hung past the lip and measured to a control point, it began partway down: the owner, 2026-10-14)
    for (const Sf of T.features.sandfalls) {
      const s = T.sOf(Sf.cp, Sf.at || 0), Fr = T.frame(s), top = R.local(Fr.x, Fr.z), w = Fr.w * 2 + 10, dir = new THREE.Vector3(Fr.fx, 0, Fr.fz);
      const ground = (z) => R.heightAt(top.x + dir.x * z, top.z + dir.z * z);
      let foot = 4; while (foot < 40 && ground(foot) - ground(foot + 1) > SANDFALL_FOOT) foot++;
      const h = top.y - ground(foot) + 1, curve = 2.6, F = { track: T.id, top: top.clone(), dir, width: w, height: h, foot };
      F.look = new RacewaySandfall(g, { ...F, curve, lean: Math.max(1, foot - curve), zone: 'raceway' }); F.mesh = F.look.object; g.scene.add(F.mesh);
      R.sandfalls.push(F);
    }
  }
  R.sandfall = R.sandfalls.find((F) => F.track === 'sun') || R.sandfalls[0]; // (the first one's, for whoever asked for the one)
}
