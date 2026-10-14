// ---------------------------------------------------------------------------------------
// THE PARK'S SHAPES IN THE WORLD (docs/plans/SKIFF-RACING.md section 10): what park.js lays as numbers, built and run.
//   - BRIDGES (decks): a track's stretch marked `bridges` is left out of the height field (park.js, track.js DECK) and built here as a
//     stone deck on piers with a collider, so another line passes under it (Suzuka's crossover); the board rides it through
//     raceway.rideHeight (deckAt: the deck under the Courier, when they are above it).
//   - WATER: the lakes and fords as flat sheets (a placeholder look, Calissa's to dress); the board skims them (rideHeight).
//   - THE ANTLION PITS: a cone at the sand's angle of repose (33 degrees: dry sand will not lie steeper, which is the antlion's whole
//     trick: the sides give way under whatever climbs them). Inside the rim the sand flows down toward the middle and drags the board
//     with it, harder the deeper; at the bottom the antlion's maw (a placeholder of jaws) takes a board that reaches it: a bail, and you
//     are set back on the nearest track. Events: raceway.pit { pit, by: 'environment' } (taken).
//
// Prior art: Suzuka's figure eight and every racer's bridge over its own line; Mario Kart's Dry Dry Desert and Sonic Riders' Sand Ruins
// (quicksand that pulls you to the middle), Star Wars' Sarlacc; the real antlion (Myrmeleontidae), whose pit is dug to the angle of repose
// so its slope fails under prey; Wave Race 64's water as a surface to ride.
//
//   buildDecks(R) -> [deck]   deckAt(R, x, z, y) -> top | null   buildWater(R)   buildPits(R) -> [pit]   stepPits(R, dt)   PIT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { addOutline } from '../../render/outline.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RW } from './track.js';

/** A deck's thickness (m), the spacing of its samples and piers (m), the least clearance under it for a pier to stand (m: a pier never
 *  stands in a line that passes under). A pit's flow (m/s^2 toward the middle at its bottom, none at the rim), the maw's reach (m) and
 *  real seconds before a taken board is set back. */
export const DECK = { thick: 1.4, step: 3, pier: 18, keep: 6 };
export const PIT = { flow: 9, maw: 7, back: 2.6 };

const paint = (geo, color) => { const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g; };

export function buildDecks(R) {
  const g = R.game, W = g.physics.world, geos = [], decks = [];
  for (const T of R.tracks) for (const D of T.decks) {
    const pts = [];
    for (let s = D.s0; s <= D.s1; s += DECK.step) { const F = T.frame(s); pts.push({ x: RW.x + F.x, z: RW.z + F.z, y: RW.y + F.y, w: F.w + 1, fx: F.fx, fz: F.fz }); }
    decks.push({ track: T.id, pts });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z) + 0.2, yaw = Math.atan2(b.x - a.x, b.z - a.z), cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, top = (a.y + b.y) / 2;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), pitch = Math.atan2(b.y - a.y, len);
      const qp = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pitch));
      geos.push(paint(new THREE.BoxGeometry(a.w * 2, DECK.thick, len).applyQuaternion(qp).translate(cx, top - DECK.thick / 2, cz), 0xc98a62));
      for (const side of [-1, 1]) geos.push(paint(new THREE.BoxGeometry(0.6, 0.9, len).translate(side * (a.w - 0.3), 0.45, 0).applyQuaternion(qp).translate(cx, top, cz), 0x8a4a3a)); // (a low parapet each side)
      const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, top - DECK.thick / 2, cz).setRotation(qp));
      W.createCollider(RAPIER.ColliderDesc.cuboid(a.w, DECK.thick / 2, len / 2).setCollisionGroups(GROUPS.static).setFriction(0.9), body);
    }
    // piers, where nothing passes under: the ground below more than DECK.keep under the deck only near the line beneath, so a pier stands
    // where the deck's own ground is
    for (let i = 0; i < pts.length; i += Math.round(DECK.pier / DECK.step)) {
      const p = pts[i], foot = R.heightAt(p.x, p.z), under = R.tracks.some((T2) => { const n = T2.nearest(p.x - RW.x, p.z - RW.z, null, 2); return n && n.d < T2.frame(n.s).w + 4 && Math.abs(T2.frame(n.s).y - (p.y - RW.y)) > 3; });
      if (under || p.y - foot < 1.5) continue;
      const h = p.y - DECK.thick - foot + 1; geos.push(paint(new THREE.BoxGeometry(2.4, h, 2.4).translate(p.x, foot - 1 + h / 2, p.z), 0xd9906a));
    }
  }
  if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true })); m.castShadow = m.receiveShadow = true; m.userData.zone = 'raceway'; m.name = 'raceway-decks'; addOutline(m); g.scene.add(m); R.deckMesh = m; }
  return decks;
}
/** The deck's top under world x, z, if the Courier at height y is above it (riding it, not passing under), else null. */
export function deckAt(R, x, z, y) {
  for (const D of R.decks) for (let i = 0; i < D.pts.length - 1; i++) {
    const a = D.pts[i], b = D.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz, u = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    if (Math.hypot(x - a.x - dx * u, z - a.z - dz * u) > a.w) continue;
    const top = a.y + (b.y - a.y) * u; if (y > top - 2.5) return top;
  }
  return null;
}

export function buildWater(R) {
  const g = R.game, mat = new THREE.MeshStandardMaterial({ color: 0x3a8fc0, transparent: true, opacity: 0.72, roughness: 0.08, metalness: 0.1, depthWrite: false });
  const geos = R.P.lakes.map((L) => new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2).scale(L.rx, 1, L.rz).rotateY(-L.rot || 0).translate(RW.x + L.x, RW.y + L.y, RW.z + L.z));
  if (!geos.length) return;
  const m = (R.waterMesh = new THREE.Mesh(mergeGeometries(geos), mat)); m.userData.zone = 'raceway'; m.name = 'raceway-water'; m.renderOrder = 2; g.scene.add(m);
}

export function buildPits(R) {
  const g = R.game, out = [];
  for (const Pt of R.P.pits) {
    const bottom = new THREE.Vector3(RW.x + Pt.x, RW.y + Pt.y - Pt.r * R.P.repose, RW.z + Pt.z), group = new THREE.Group();
    // the maw: a dark throat and two jaws (a placeholder: the antlion's look is Calissa's)
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9, flatShading: true });
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 0.8, 2.5, 10), dark).translateY(-0.8));
    const jaws = [-1, 1].map((sd) => { const j = new THREE.Mesh(new THREE.ConeGeometry(0.6, 5, 5).translate(0, 2.5, 0), dark); j.position.set(sd * 1.6, 0, 0); j.rotation.z = -sd * 0.5; group.add(j); return j; });
    group.position.copy(bottom); group.userData.zone = 'raceway'; g.scene.add(group);
    out.push({ ...Pt, bottom, group, jaws, snap: 0 });
  }
  return out;
}
/** Each step: the pits' sand flows to the middle and drags a board on it there; the maw takes what reaches it. */
export function stepPits(R, dt) {
  const g = R.game, P = g.player, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null;
  for (const Pt of R.pits) {
    Pt.snap = Math.max(0, Pt.snap - dt * 2); Pt.jaws.forEach((j, i) => { j.rotation.z = (i ? -1 : 1) * (0.5 - 0.45 * Math.sin(Math.min(1, Pt.snap) * Math.PI)); });
    const dx = Pt.bottom.x - P.pos.x, dz = Pt.bottom.z - P.pos.z, d = Math.hypot(dx, dz);
    if (d > Pt.r) continue;
    if (S && S.phase === 'ride' && !S.air && !S.grind?.on) { const k = PIT.flow * (1 - d / Pt.r) * dt / Math.max(1, d); S.v.x += dx * k; S.v.z += dz * k; } // (the sand runs to the middle)
    if (d < PIT.maw && P.pos.y - Pt.bottom.y < 4 && !R.pitT) {
      Pt.snap = 1.2; R.pitT = PIT.back;
      g.events?.emit('raceway.pit', { pit: Pt.id, by: 'environment' });
      if (S && S.phase === 'ride') S.bail('pit');
    }
  }
  if (R.pitT && (R.pitT -= dt) <= 0) { R.pitT = 0; R.respawn(); }
}
