// ---------------------------------------------------------------------------------------
// THE CAVERN (working name, Espada's to rule; docs/plans/SKIFF-RACING.md section 9): the Raceway's alternate course, built over the
// gorge its branch cuts (world/raceway/track.js BRANCH: the ground and its walls are the one height field, so the board rides and
// collides with it as with the rest). What makes it a cavern is laid here: a roof of stone slabs across the gorge wherever its walls
// stand `roof` metres or more (a slab left out now and then: a shaft of sun), stalactites under it toward the walls (clear of the
// running line), and Lachryma crystals in the walls, glowing (no lamps: emissive, the light budget untouched). Placeholders where they
// are looks: the rock, the crystals, the dark inside are Calissa's. No colliders: nothing here is in reach of the board's line (the
// roof stands over the gorge at the sand's height, the stalactites end over `CLEAR` metres up). Inside it since round 4: the pool (park.js
// lays its water), crystal pillars standing through the floor (collided: a lane to weave), and a sandfall through a skylight.
//
// Prior art: the cave sections of racers (Crash Team Racing's Dragon Mines, Mario Kart's Wario's Gold Mine and DK Pass's tunnels, SSX
// Tricky's Mercury City under the ice, F-Zero's tunnels: a dark lane with lights in the walls); Wind Cave (South Dakota), whose air
// breathes along its passages (the course wind's share in it).
//
//   buildCavern(raceway) -> { mesh, crystals }   (built once, with the Raceway)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../../render/outline.js';
import { BRANCH, RW } from './track.js';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { RacewaySandfall } from '../../vfx/racewaysandfall.js';

/** The slabs' spacing and length (m), their overhang past the walls; every `skylight`th slab left out; the stalactites' clearance over the
 *  floor (m, the least); a crystal cluster every `crystal` metres each side. */
export const ROOF = { every: 6, len: 6.6, over: 5, thick: 2.4, skylight: 7, CLEAR: 10, crystal: 9 }; // (CLEAR 7 -> 10: the owner's "more ceiling clearance", round 4)
const COLOUR = { rock: 0x6e4a3c, under: 0x4a3028, drip: 0x8a6a58, crystal: 0x7fdcff };

const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const paint = (geo, color) => {
  const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g;
};

export function buildCavern(R) {
  const g = R.game, Bn = R.T.branch, rock = [], glow = [];
  let k = 0;
  for (let sb = 0; sb <= Bn.length; sb += ROOF.every, k++) {
    const f = Bn.frame(sb); if (f.wall < BRANCH.roof) continue;
    const yaw = Math.atan2(f.fx, f.fz), c = new THREE.Vector3(RW.x + f.x, RW.y + f.y, RW.z + f.z), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const span = 2 * (f.w + BRANCH.wall) + ROOF.over * 2, top = f.wall + 0.4;
    if (k % ROOF.skylight !== 3) {
      const slab = new THREE.BoxGeometry(span, ROOF.thick, ROOF.len).translate(0, top - ROOF.thick / 2, 0);
      rock.push(paint(slab.applyQuaternion(q).translate(c.x, c.y, c.z), k % 2 ? COLOUR.rock : COLOUR.under));
      // stalactites toward the walls: never over the middle of the floor, never under CLEAR over it
      for (let j = 0; j < 2; j++) {
        const side = j ? 1 : -1, lat = side * f.w * (0.55 + 0.4 * hash(k * 2 + j)), len = Math.min(1.5 + 2.5 * hash(k * 7 + j), top - ROOF.thick - ROOF.CLEAR);
        if (len < 0.8) continue;
        const cone = new THREE.ConeGeometry(0.5 + 0.4 * hash(k + j * 3), len, 6).rotateX(Math.PI).translate(lat, top - ROOF.thick - len / 2, (hash(k * 3 + j) - 0.5) * ROOF.len * 0.7);
        rock.push(paint(cone.applyQuaternion(q).translate(c.x, c.y, c.z), COLOUR.drip));
      }
    }
    // Lachryma in the walls: a cluster each side every so often, low on the wall
    if (sb % ROOF.crystal < ROOF.every) for (const side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const h = 0.6 + 1.4 * hash(sb + j * 5 + side), o = new THREE.OctahedronGeometry(0.35 + 0.35 * hash(sb * 3 + j + side), 0).scale(0.7, 1.8, 0.7);
        o.rotateZ(side * (0.4 + 0.5 * hash(sb + j))).translate(side * (f.w + 0.4 + 0.4 * j), 0.4 + h, (j - 1) * 0.7);
        glow.push(o.applyQuaternion(q).translate(c.x, c.y, c.z)); // (at the wall's foot, where it begins to rise)
      }
    }
  }
  // the crystal pillars: stone standing up through the floor, crowned with Lachryma (collided: a lane to weave, the owner's "more
  // intrigue"), and the skylight fall: sand pouring through a gap in the roof onto the floor (Calissa's curtain, hung from the roof's edge)
  const W = g.physics?.world, pillarGeos = [];
  for (const [sb, lat, r] of BRANCH.pillars || []) {
    const f = Bn.frame(sb), x = RW.x + f.x - f.fz * lat, z = RW.z + f.z + f.fx * lat, y0 = RW.y + f.y - 1, h = f.wall + 1;
    pillarGeos.push(paint(new THREE.CylinderGeometry(r * 0.8, r, h, 7).translate(x, y0 + h / 2, z), COLOUR.under));
    const o = new THREE.OctahedronGeometry(r * 0.9, 0).scale(1, 2.2, 1).translate(x, y0 + 2.8, z); glow.push(o);
    if (W) { const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y0 + h / 2, z)); W.createCollider(RAPIER.ColliderDesc.cylinder(h / 2, r * 0.9).setCollisionGroups(GROUPS.static).setFriction(0.9), b); }
  }
  if (pillarGeos.length) rock.push(...pillarGeos);
  const out = {};
  if (BRANCH.skyfall && RacewaySandfall) {
    const f = Bn.frame(BRANCH.skyfall.at), dir = new THREE.Vector3(f.fx, 0, f.fz), top = new THREE.Vector3(RW.x + f.x, RW.y + f.y + f.wall + 0.4, RW.z + f.z).addScaledVector(dir, -2);
    out.skyfall = { top, dir, width: f.w * 0.9, height: f.wall + 1, foot: 2 };
    out.skyfall.look = new RacewaySandfall(g, { ...out.skyfall, curve: 0.8, lean: 1.2, zone: 'raceway' }); g.scene.add(out.skyfall.look.object);
    R.sandfalls?.push({ track: 'sun', ...out.skyfall });
  }
  if (rock.length) {
    const mesh = (out.mesh = new THREE.Mesh(mergeGeometries(rock), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, flatShading: true })));
    mesh.castShadow = mesh.receiveShadow = true; mesh.userData.zone = 'raceway'; mesh.name = 'raceway-cavern'; addOutline(mesh); g.scene.add(mesh);
  }
  if (glow.length) {
    const m = new THREE.MeshStandardMaterial({ color: COLOUR.crystal, emissive: COLOUR.crystal, emissiveIntensity: 1.3, roughness: 0.2, metalness: 0.1, flatShading: true });
    const mesh = (out.crystals = new THREE.Mesh(mergeGeometries(glow), m)); mesh.userData.zone = 'raceway'; mesh.name = 'raceway-cavern-crystals'; g.scene.add(mesh);
  }
  return out;
}
