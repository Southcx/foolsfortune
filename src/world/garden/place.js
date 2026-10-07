// ---------------------------------------------------------------------------------------
// THE INNER REALM, AS A PLACE: the Spirit Garden's six planetoids, their launch lotuses and the places their systems are worked
// (docs/plans/SPIRIT-GARDEN.md section 3). A small galaxy far over the world (GARDEN_AT, its own zone), entered at a Shrine as the
// Pneuka Jar (world/garden/realm.js). Each planetoid is a sphere you can hop round in 5 to 15 real seconds; a lotus on one faces each
// neighbour and flies the Jar there. Its systems stand where the spec puts them: the gate and the Pneuka Box's shed on the Dantian, the
// beds on the Herb Terraces, the press on the Furnace, the dividend's slots on the Pavilions of Echoes, the cocoon tree in the Spirit
// Grove, the needle of the Meditation Peak. The shapes are stand-ins for Calissa's look (Dual Hearts: soft light, clouds, spirit veins);
// the names for Espada's.
//
// Prior art: Super Mario Galaxy's planetoids and launch stars (a hub made of small worlds), Dual Hearts' dream islands, the xianxia
// cave abode (the dantian at the heart, the pill furnace, the herb fields, the meditation peak).
//
//   PLANETOIDS [{ id, name, r, at, color }]   LINKS [[from, to]]   GARDEN_AT   const P = new GardenPlace(game)   P.group   P.planets [{ id, c, r }]
//   P.lotuses [{ i, planet, to, pos, land, toPlanet }]   P.features [{ kind, i, planet, pos, mesh? }]   P.show(on)   P.sync(counts)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Where the garden hangs: far over the workshop's north, no other zone near (render/zonemap.js 'garden'). */
export const GARDEN_AT = new THREE.Vector3(0, 1200, 3000);
/** The six planetoids (radius in metres; `at` from GARDEN_AT). Names are placeholders for Espada's. */
export const PLANETOIDS = [
  { id: 'dantian', name: 'the Dantian', r: 20, at: [0, 0, 0], color: 0x9fb4d6 },
  { id: 'terraces', name: 'the Herb Terraces', r: 12, at: [-50, 12, -22], color: 0x9cc58a },
  { id: 'furnace', name: 'the Furnace', r: 10, at: [-34, -8, 44], color: 0x7a6560 },
  { id: 'pavilions', name: 'the Pavilions of Echoes', r: 14, at: [46, 8, 36], color: 0xcdb2dc },
  { id: 'grove', name: 'the Spirit Grove', r: 16, at: [48, -6, -38], color: 0x7cb59a },
  { id: 'peak', name: 'the Meditation Peak', r: 8, at: [0, 40, -66], color: 0xa29c94 },
];
/** The lotuses' flights, both ways: the Dantian to each, and round the ring. */
export const LINKS = [['dantian', 'terraces'], ['dantian', 'furnace'], ['dantian', 'pavilions'], ['dantian', 'grove'], ['grove', 'peak'], ['terraces', 'furnace'], ['pavilions', 'grove'], ['terraces', 'peak']];
export const MAX_BEDS = 8, MAX_SLOTS = 8;

const UP = new THREE.Vector3(0, 1, 0);
/** A direction on a sphere from latitude and longitude (degrees; latitude 90 is the top). */
export const dirOf = (lat, lon) => { const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };

export class GardenPlace {
  constructor(game) {
    this.game = game;
    const g = this.group = new THREE.Group(); g.name = 'garden'; g.userData.zone = 'garden'; g.visible = false;
    this.planets = PLANETOIDS.map((p) => ({ ...p, c: new THREE.Vector3(...p.at).add(GARDEN_AT) }));
    this.by = Object.fromEntries(this.planets.map((p) => [p.id, p]));
    this.mats = {
      lotus: new THREE.MeshStandardMaterial({ color: 0xffc6dc, emissive: 0xff8fb8, emissiveIntensity: 0.6, roughness: 0.5, name: 'garden-lotus' }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.8, name: 'garden-wood' }),
      lake: new THREE.MeshStandardMaterial({ color: 0x9fe0ff, emissive: 0x4fb6ff, emissiveIntensity: 0.5, roughness: 0.2, name: 'garden-lake' }),
      soil: new THREE.MeshStandardMaterial({ color: 0x5a3e2a, roughness: 1, name: 'garden-soil' }),
      roof: new THREE.MeshStandardMaterial({ color: 0xb5513c, roughness: 0.7, name: 'garden-roof' }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x9be3b8, emissive: 0x3f9f72, emissiveIntensity: 0.3, roughness: 0.8, name: 'garden-leaf' }),
      ember: new THREE.MeshStandardMaterial({ color: 0xffb27a, emissive: 0xff7a3a, emissiveIntensity: 0.9, roughness: 0.6, name: 'garden-ember' }),
    };
    this.build();
    game.scene.add(g);
  }

  /** A transform standing on planet P at direction `dir` (its up the sphere's normal), `lift` metres off the ground. */
  stand(P, dir, lift = 0, yaw = 0) {
    const n = dir.clone().normalize(), m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n).multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw));
    m.compose(P.c.clone().addScaledVector(n, P.r + lift), q, new THREE.Vector3(1, 1, 1));
    return m;
  }

  build() {
    const g = this.group, parts = new Map(), add = (mat, geo, m) => { geo.applyMatrix4(m); if (!parts.has(mat)) parts.set(mat, []); parts.get(mat).push(geo); };
    // the planetoids: one smooth sphere each, their own clay
    for (const P of this.planets) {
      const mat = new THREE.MeshStandardMaterial({ color: P.color, roughness: 0.85, name: `garden-${P.id}` });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(P.r, 5), mat); mesh.position.copy(P.c); mesh.receiveShadow = true; mesh.castShadow = true; mesh.name = `planetoid-${P.id}`;
      g.add(mesh); P.mesh = mesh;
    }
    // the lotuses: one on each end of a link, on the side facing the other
    this.lotuses = [];
    for (const [a, b] of LINKS) for (const [f, t] of [[a, b], [b, a]]) {
      const A = this.by[f], B = this.by[t], dir = B.c.clone().sub(A.c).normalize().lerp(UP, 0.25).normalize(), land = A.c.clone().sub(B.c).normalize().lerp(UP, 0.25).normalize();
      const m = this.stand(A, dir, 0.02);
      add(this.mats.lotus, new THREE.CylinderGeometry(1.1, 1.3, 0.12, 12), m);
      for (let k = 0; k < 6; k++) { const pg = new THREE.ConeGeometry(0.35, 0.9, 5); pg.rotateZ(0.6); pg.translate(0.75, 0.35, 0); pg.rotateY((k / 6) * Math.PI * 2); add(this.mats.lotus, pg, m); }
      this.lotuses.push({ i: this.lotuses.length, planet: A, to: B, pos: A.c.clone().addScaledVector(dir, A.r), land: B.c.clone().addScaledVector(land, B.r), toPlanet: B });
    }
    // the features: where each system is worked
    const D = this.by.dantian, F = [];
    // the Dantian: the gate out (a torii), the shed (the Pneuka Box), the lake of your own Lachryma on its crown
    { const m = this.stand(D, dirOf(62, 0), 0);
      for (const sx of [-1.3, 1.3]) add(this.mats.roof, new THREE.CylinderGeometry(0.16, 0.18, 3, 8).translate(sx, 1.5, 0), m.clone());
      add(this.mats.roof, new THREE.BoxGeometry(3.6, 0.3, 0.4).translate(0, 3.05, 0), m.clone()); add(this.mats.wood, new THREE.BoxGeometry(3, 0.18, 0.3).translate(0, 2.55, 0), m.clone());
      F.push({ kind: 'gate', planet: D, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    { const m = this.stand(D, dirOf(62, 90), 0, -Math.PI / 2);
      add(this.mats.wood, new THREE.BoxGeometry(2.4, 1.8, 2).translate(0, 0.9, 0), m.clone()); add(this.mats.roof, new THREE.ConeGeometry(2.1, 1.1, 4).rotateY(Math.PI / 4).translate(0, 2.35, 0), m.clone());
      F.push({ kind: 'shed', planet: D, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    add(this.mats.lake, new THREE.CylinderGeometry(5.5, 5.5, 0.1, 24), this.stand(D, UP, 0.04));
    // the Herb Terraces: the beds, a ring round its shoulder (shown as many as the garden has)
    const T = this.by.terraces;
    for (let i = 0; i < MAX_BEDS; i++) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.3), this.mats.soil); mesh.applyMatrix4(this.stand(T, dirOf(58, (i / MAX_BEDS) * 360), 0.1, (i / MAX_BEDS) * Math.PI * 2)); mesh.castShadow = true; g.add(mesh);
      F.push({ kind: 'bed', i, planet: T, pos: mesh.position.clone(), mesh });
    }
    // the Furnace: the pill furnace on its crown (the spirit press)
    { const R = this.by.furnace, m = this.stand(R, UP, 0);
      add(this.mats.wood, new THREE.CylinderGeometry(1.6, 2, 2.6, 10).translate(0, 1.3, 0), m.clone()); add(this.mats.ember, new THREE.CylinderGeometry(1.1, 1.1, 0.3, 10).translate(0, 2.7, 0), m.clone());
      F.push({ kind: 'furnace', planet: R, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    // the Pavilions of Echoes: a pavilion for each slot
    const V = this.by.pavilions, pavGeo = mergeGeometries([new THREE.BoxGeometry(1.6, 1.6, 1.6).translate(0, 0.8, 0), new THREE.ConeGeometry(1.6, 1, 4).rotateY(Math.PI / 4).translate(0, 2.1, 0)], false);
    for (let i = 0; i < MAX_SLOTS; i++) {
      const mesh = new THREE.Mesh(pavGeo, this.mats.roof); mesh.applyMatrix4(this.stand(V, dirOf(52, (i / MAX_SLOTS) * 360), 0, (i / MAX_SLOTS) * Math.PI * 2)); mesh.castShadow = true; g.add(mesh);
      F.push({ kind: 'slot', i, planet: V, pos: mesh.position.clone(), mesh });
    }
    // the Spirit Grove: the cocoon tree on its crown (merging is Round 4's)
    { const R = this.by.grove, m = this.stand(R, UP, 0);
      add(this.mats.wood, new THREE.CylinderGeometry(0.5, 0.8, 5, 8).translate(0, 2.5, 0), m.clone()); add(this.mats.leaf, new THREE.IcosahedronGeometry(3, 1).translate(0, 6, 0), m.clone());
      F.push({ kind: 'cocoon', planet: R, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    // the Meditation Peak: a needle of rock, and the mat at its foot (the tribulation is Round 4's)
    { const R = this.by.peak, m = this.stand(R, UP, -1);
      add(this.mats.wood, new THREE.ConeGeometry(3, 16, 7).translate(0, 8, 0), m.clone());
      F.push({ kind: 'peak', planet: R, pos: R.c.clone().addScaledVector(dirOf(40, 180), R.r) }); }
    this.features = F;
    // one mesh a material for everything that never moves (render/merge.js's rule: a model of many static primitives is merged)
    for (const [mat, geos] of parts) { const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); geos.forEach((x) => x.dispose()); }
  }

  /** As many beds and slots shown as the garden has (progress/garden.js). */
  sync({ beds = 0, slots = 0 } = {}) {
    for (const f of this.features) if (f.mesh) f.mesh.visible = f.kind === 'bed' ? f.i < beds : f.kind === 'slot' ? f.i < slots : true;
  }
  show(on) { this.group.visible = on; }
}
