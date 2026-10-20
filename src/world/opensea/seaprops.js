// ---------------------------------------------------------------------------------------
// THE OPEN SEA'S THINGS, AS PLACEHOLDERS (docs/plans/OPEN-SEA.md sections 2 and 6): every feature of the grid (progress/opensea/seagrid.js)
// put on the water where its square says, in plain shapes Calissa dresses later: an islet a low mound you can walk (its top flat, a
// cylinder's collider) with its one secret on it, a monument three stones out of the water, a wreck a hull on its side, a phenomenon a
// pale column that shows only at its hour, a seep a dark slick; and the three ports' quays on the lanes. Built once when the open sea is
// first entered (it is small: about sixty shapes and twenty colliders), each mesh in the 'opensea' render zone.
//
// Prior art: The Legend of Zelda: The Wind Waker's islets (a mound, a tree, one thing on it); greyboxing (shapes first, looks after).
//
//   buildSeaProps(room) -> { islets: [{ feature, islet, pos, r, top, secret: { kind, pos } }], quays: { island: { pos, top, open } },
//     marks: [{ feature, mesh }] }   (room: the OpenSea, for its game, its grid and its seed)   squareCentre(col, row) -> Vector3
//   SEA (the open sea's place in the world: its middle, the water's height, a square's side in metres)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { ECON } from '../../progress/econ/table.js';
import { isletOf } from '../../progress/opensea/islets.js';
import { seeded } from '../../core/rng.js';

const G = ECON.openSea.grid;
/** Where the open sea is: far east of the Raceway at the Emocean's height. A square is what a cruising sloop sails in `squareS` (10 m a real s). */
export const SEA = { x: 9800, y: -420, z: 0, square: 400, top: 1.6 };

export const squareCentre = (col, row, out = new THREE.Vector3()) =>
  out.set(SEA.x + (col - (G.cols - 1) / 2) * SEA.square, SEA.y, SEA.z + (row - G.lane) * SEA.square);

const KIT_COLOUR = { rock: 0x7a7066, atoll: 0xd8c9a0, stack: 0x6c6258, ruin: 0x9a8f80, lighthouse: 0xb8b0a4, sandbar: 0xe4d6aa };
const SECRET_COLOUR = { chest: 0xd4a53c, ostracon: 0xb07a4a, vantage: 0xe8e2d0, nest: 0x3a2a3a, fuel: 0x5a3a1a, stele: 0x8a8478, fishing: 0x6a8aa0, crystal: 0x9fe8f0 };
const mat = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...extra });

export function buildSeaProps(room) {
  const g = room.game, scene = g.scene, W = g.physics.world, out = { islets: [], quays: {}, marks: [] };
  const body = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0));
  const add = (mesh) => { mesh.userData.zone = 'opensea'; scene.add(mesh); return mesh; };
  const top = SEA.y + SEA.top;
  // the quays on the lanes: a stone platform to step onto, open at Margarite and Anagami, shut at Entropolis (the node map's lock)
  for (const [island, id] of Object.entries(room.grid.ports)) {
    const [c, r] = id.split(',').map(Number), at = squareCentre(c, r), open = island !== 'entra';
    const q = add(new THREE.Mesh(new THREE.BoxGeometry(24, 3, 12), mat(open ? 0x8e8476 : 0x4a4440)));
    q.position.set(at.x, top - 1.5, at.z);
    W.createCollider(RAPIER.ColliderDesc.cuboid(12, 1.5, 6).setTranslation(at.x, top - 1.5, at.z).setCollisionGroups(GROUPS.static), body);
    const post = add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 6), mat(open ? 0xd4a53c : 0x555050)));
    post.position.set(at.x - 9, top + 1.5, at.z - 4);
    out.quays[island] = { pos: at.clone().setY(top), top, open, post: post.position.clone(), square: id };
  }
  for (const sq of room.grid.squares) {
    const r = seeded(((sq.col * 73856093) ^ (sq.row * 19349663) ^ room.seed) >>> 0);
    sq.features.forEach((f, i) => {
      const at = squareCentre(sq.col, sq.row).add(new THREE.Vector3(r.range(-130, 130), 0, r.range(-130, 130)));
      if (sq.lane) at.z += (i ? 1 : -1) * 90; // (off the shipping line itself)
      if (f.kind === 'islet') {
        const I = isletOf(f, room.seed), rad = I.across / 2;
        const m = add(new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, SEA.top + 2, 12), mat(KIT_COLOUR[I.kit] ?? 0x7a7066)));
        m.position.set(at.x, top - (SEA.top + 2) / 2, at.z);
        W.createCollider(RAPIER.ColliderDesc.cylinder((SEA.top + 2) / 2, rad * 0.85).setTranslation(at.x, top - (SEA.top + 2) / 2, at.z).setCollisionGroups(GROUPS.static), body);
        const sp = at.clone().add(new THREE.Vector3(r.range(-rad * 0.3, rad * 0.3), 0, r.range(-rad * 0.3, rad * 0.3))).setY(top);
        const s = add(new THREE.Mesh(I.secret === 'crystal' ? new THREE.ConeGeometry(0.6, 2, 5) : new THREE.BoxGeometry(1, 0.8, 0.7), mat(SECRET_COLOUR[I.secret] ?? 0xffffff, I.secret === 'crystal' ? { emissive: 0x2a6070 } : {})));
        s.position.copy(sp).setY(top + 0.4);
        out.islets.push({ feature: f, islet: I, pos: at.clone().setY(top), r: rad * 0.85, top, secret: { kind: I.secret, pos: sp, mesh: s } });
        out.marks.push({ feature: f, mesh: m });
      } else if (f.kind === 'monument') {
        const grp = new THREE.Group();
        for (let k = 0; k < 3; k++) { const h = 3 + k * 2.2; const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), mat(0x8a8f96)); p.position.set((k - 1) * 3.2, SEA.y + h / 2 - 1.2, r.range(-1.5, 1.5)); p.rotation.z = r.range(-0.15, 0.15); grp.add(p); }
        grp.position.set(at.x, 0, at.z); add(grp); out.marks.push({ feature: f, mesh: grp });
      } else if (f.kind === 'wreck') {
        const m = add(new THREE.Mesh(new THREE.BoxGeometry(3, 2, 9), mat(0x4a3a2a)));
        m.position.set(at.x, SEA.y + 0.2, at.z); m.rotation.set(0.25, r.range(0, Math.PI), 0.6); out.marks.push({ feature: f, mesh: m });
      } else if (f.kind === 'phenomenon') {
        const m = add(new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 60, 10, 1, true), mat(0xbfe8ff, { transparent: true, opacity: 0.35, emissive: 0x6090b0, side: THREE.DoubleSide, depthWrite: false })));
        m.position.set(at.x, SEA.y + 30, at.z); m.visible = false; out.marks.push({ feature: f, mesh: m, when: f.when });
      } else if (f.kind === 'seep') {
        const m = add(new THREE.Mesh(new THREE.CircleGeometry(14, 16), mat(0x14100c, { transparent: true, opacity: 0.8 })));
        m.rotation.x = -Math.PI / 2; m.position.set(at.x, SEA.y + 0.35, at.z); out.marks.push({ feature: f, mesh: m });
      }
    });
  }
  return out;
}
