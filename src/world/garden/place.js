// ---------------------------------------------------------------------------------------
// THE INNER REALM, AS A PLACE: the Spirit Garden's six planetoids, their launch lotuses and the places their systems are worked
// (docs/plans/SPIRIT-GARDEN.md section 3). A small galaxy far over the world (GARDEN_AT, its own zone), entered at a Shrine as the
// Pneuka Jar (world/garden/realm.js). Each planetoid is a sphere you can hop round in 5 to 15 real seconds; a lotus on one faces each
// neighbour and flies the Jar there. Its systems stand where the spec puts them: the gate and the Pneuka Box's shed on the Dantian, the
// beds on the Herb Terraces, the press on the Athanor, the dividend's slots on the Pavilions of Echoes, the cocoon tree in the Mulberry
// Grove, the needle of the Chimney (Espada's names). The shapes are stand-ins for Calissa's look (Dual Hearts: soft light, clouds,
// spirit veins). The lotuses and the gate are records here (where each stands, where a flight lands); their looks are Calissa's
// (vfx/garden/launchlotus.js, vfx/garden/facilitylooks.js). Round the Dantian's waist seven berths are kept for the feelings' moonlets
// (MOONLET_RING: the inner ring, world/garden/orbit.js), each a jump's height over the ground, no plot under it and its clay held.
//
// Prior art: Super Mario Galaxy's planetoids and launch stars (a hub made of small worlds, a tiny world a jump away), Dual Hearts'
// dream islands, the xianxia cave abode (the dantian at the heart, the pill furnace, the herb fields, the meditation peak).
//
//   PLANETOID_SITES [{ id, name, r, at, color }]   LINKS [[from, to]]   GARDEN_AT   MOONLET_RING   moonletBerth(i) -> unit dir
//   const P = new GardenSite(game)   P.group   P.planets [{ id, c, r }]   P.addPlanet({ id, r, c, name, look })   P.regrow(P, r)   P.relay(P)
//   P.lotuses [{ i, planet, to, pos, land, toPlanet }]   P.features [{ kind, i, planet, pos, mesh? }]   P.show(on)   P.sync(counts)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLANETOIDS as NAMES } from '../../npc/realmnames.js';
import { Planetoid } from '../../vfx/garden/planetoid.js';
import { GardenSky } from '../../vfx/garden/gardensky.js';
import { SpiritVein } from '../../vfx/garden/veins.js';
import { CocoonTree } from '../../vfx/garden/cocoontree.js';
import { Hokora } from '../../vfx/garden/hokora.js';

/** Where the garden hangs: far over the workshop's north, no other zone near (render/zonemap.js 'garden'). */
export const GARDEN_AT = new THREE.Vector3(0, 1200, 3000);
/** The six planetoids (radius in metres; `at` from GARDEN_AT); their names are Espada's (npc/realmnames.js: the Athanor is the furnace,
 *  the Mulberry Grove the spirits', the Chimney the peak). */
// (the ids renamed to the canon, 2026-10-07)
export const PLANETOID_SITES = [
  { id: 'dantian', r: 20, at: [0, 0, 0], color: 0x9fb4d6 },
  { id: 'terraces', r: 12, at: [-50, 12, -22], color: 0x9cc58a },
  { id: 'athanor', r: 10, at: [-34, -8, 44], color: 0x7a6560 },
  { id: 'pavilions', r: 14, at: [46, 8, 36], color: 0xcdb2dc },
  { id: 'mulberryGrove', r: 16, at: [48, -6, -38], color: 0x7cb59a },
  { id: 'chimney', r: 8, at: [0, 40, -66], color: 0xa29c94 },
].map((p) => ({ ...p, name: NAMES[p.id]?.name || p.id }));
/** The lotuses' flights, both ways: the Dantian to each, and round the ring. */
export const LINKS = [['dantian', 'terraces'], ['dantian', 'athanor'], ['dantian', 'pavilions'], ['dantian', 'mulberryGrove'], ['mulberryGrove', 'chimney'], ['terraces', 'athanor'], ['pavilions', 'mulberryGrove'], ['terraces', 'chimney']];
export const MAX_BEDS = 8, MAX_SLOTS = 8;
/** Where the carving bench stands on the Athanor (latitude, longitude: below the plate shrine's hokora; world/garden/bench.js). */
export const BENCH_AT = [28, 90];
/** The inner ring: the seven feelings' moonlets (progress/seeds.js SEEDS['moonlet.<f>']) hung round the Dantian's waist, `gap` metres over
 *  its ground along the line of their hearts: the jump's top (1.8 m: planetbody.js HOP.jump) takes the Pneuka Jar past halfway, where
 *  the moonlet's pull wins, and a hop's (under 0.5 m) never does. Their bearings sit in the gaps between the Dantian's four lotus
 *  flights (25 degrees or more from each), a little above and below the equator by turn (`lat`); `keep` metres of the Dantian's clay
 *  under each held still (no stroke raises a hill into one), and no plot is laid there. */
export const MOONLET_RING = { gap: 3, keep: 6, lat: [4, -4], bearings: [-75, -10, 24, 90, 154, 188, 222], order: ['wonder', 'mirth', 'desire', 'fury', 'gall', 'grief', 'dread'] };
/** The unit direction from the Dantian's heart to berth i. */
export const moonletBerth = (i) => dirOf(MOONLET_RING.lat[i % 2], MOONLET_RING.bearings[i % MOONLET_RING.bearings.length]);

const UP = new THREE.Vector3(0, 1, 0), _s = new THREE.Vector3();
/** A direction on a sphere from latitude and longitude (degrees; latitude 90 is the top). */
export const dirOf = (lat, lon) => { const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)); };

export class GardenSite {
  constructor(game) {
    this.game = game;
    const g = this.group = new THREE.Group(); g.name = 'garden'; g.userData.zone = 'garden'; g.visible = false;
    this.planets = PLANETOID_SITES.map((p) => ({ ...p, c: new THREE.Vector3(...p.at).add(GARDEN_AT) }));
    this.by = Object.fromEntries(this.planets.map((p) => [p.id, p]));
    this.mats = {
      lotus: new THREE.MeshStandardMaterial({ color: 0xffc6dc, emissive: 0xff8fb8, emissiveIntensity: 0.6, roughness: 0.5, name: 'garden-lotus' }), // (the seed in the god hand's grip: world/garden/hand.js)
      wood: new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.8, name: 'garden-wood' }),
      lake: new THREE.MeshStandardMaterial({ color: 0x9fe0ff, emissive: 0x4fb6ff, emissiveIntensity: 0.5, roughness: 0.2, name: 'garden-lake' }),
      soil: new THREE.MeshStandardMaterial({ color: 0x5a3e2a, roughness: 1, name: 'garden-soil' }),
      roof: new THREE.MeshStandardMaterial({ color: 0xb5513c, roughness: 0.7, name: 'garden-roof' }),
    };
    this.build();
    game.scene.add(g);
  }

  /** A transform standing on planet P at direction `dir` (its up the sphere's normal), `lift` metres off the ground. */
  stand(P, dir, lift = 0, yaw = 0) {
    const n = dir.clone().normalize(), m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n).multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw));
    m.compose(P.c.clone().addScaledVector(n, (P.radiusAt ? P.radiusAt(n) : P.r) + lift), q, new THREE.Vector3(1, 1, 1));
    return m;
  }

  build() {
    const g = this.group;
    // the planetoids: Calissa's (vfx/garden/planetoid.js: the skin, the roots, each kind dressed), on the one ground: her unsculpted shape
    // is the base, the clay's height goes on top (world/garden/clay.js), and her `surface` asks that ground (O(1), not a search)
    this.planets.forEach((P, k) => this.makePlanet(P, k));
    this.sky = new GardenSky(); g.add(this.sky.group);
    this.LINKS = LINKS.slice(); // (the pairs the veins join, in the veins' order: world/garden/plots.js moves their ends; a bought planetoid adds its own)
    this.veins = LINKS.map(([a, b]) => this.vein(this.by[a], this.by[b]));
    this.lotuses = [];
    for (const [a, b] of LINKS) for (const [f, t] of [[a, b], [b, a]]) this.lotuses.push(this.lotusAt(this.by[f], this.by[t]).rec); // (drawn as Calissa's flowers: vfx/garden/launchlotus.js)
    this.buildFeatures();
  }

  /** One planetoid: Calissa's look on the one ground (her unsculpted shape the base, the clay's height on top: world/garden/clay.js). */
  makePlanet(P, k) {
    {
      const look = new Planetoid({ kind: P.look || P.id, radius: P.r, seed: k + 1, surface(dir) { _s.copy(dir).normalize(); return P.radiusAt ? P.radiusAt(_s) : P.r * this.shape(_s.x, _s.y, _s.z); } }); // (`look`: the kind of look a planetoid grown from a seed wears, its id another)
      look.group.position.copy(P.c); this.group.add(look.group);
      P.look = look; P.mesh = look.mesh; P.tint?.(look); // (a grown planetoid's colours, its feeling's or what it was fed: world/garden/orbit.js)
      P.base = (d) => P.r * look.shape(d.x, d.y, d.z);
      P.radiusAt = (d) => P.base(d); // (the realm adds the clay's height: world/garden/realm.js)
      // its highest reach, the shape's (the Chimney's needle runs to 28 m on an 8 m world) plus the clay's band: what is solid, whose
      // gravity it is and what the hand's ray meets are all asked out to here, never the bare radius (GARDEN-SWEEP #6)
      let top = P.r; for (let i = 0, n = 2048; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, q = Math.sqrt(1 - y * y), a = i * 2.399963; top = Math.max(top, P.base(_s.set(Math.cos(a) * q, y, Math.sin(a) * q))); }
      P.rMax = top * 1.04 + P.r / 3; // (the clay's band: a third of the radius, world/garden/clay.js)
    }
  }
  /** A spirit vein between two planetoids (Calissa's), added to the site. */
  vein(A, B) { const d = B.c.clone().sub(A.c).normalize(), V = new SpiritVein(A.c.clone().addScaledVector(d, A.r * 0.9), B.c.clone().addScaledVector(d, -B.r * 0.9)); this.group.add(V.mesh); return V; }
  /** Where a launch lotus on A toward B stands, and its record (the flight's start and landing). */
  lotusAt(A, B) {
    const dir = B.c.clone().sub(A.c).normalize().lerp(UP, 0.25).normalize(), land = A.c.clone().sub(B.c).normalize().lerp(UP, 0.25).normalize();
    return { m: this.stand(A, dir, 0.02), rec: { i: this.lotuses?.length || 0, planet: A, to: B, pos: A.c.clone().addScaledVector(dir, A.radiusAt(dir)), land: B.c.clone().addScaledVector(land, B.radiusAt(land)), toPlanet: B } };
  }
  /** A planetoid after the first six (Myggdrasil's, given; one grown from a seed: world/garden/orbit.js), made as they were. `look`: the
   *  kind of look it wears (vfx/garden/planetoid.js), its id when none is said. */
  addPlanet({ id, r, c, name, look = null, tint = null }) {
    const P = { id, r, at: c.clone().sub(GARDEN_AT).toArray(), c: c.clone(), name, color: 0xb0b8c8, added: true, look, tint };
    this.planets.push(P); this.by[id] = P; this.makePlanet(P, this.planets.length - 1);
    return P;
  }
  /** A planetoid drawn again at a new radius in place (a seed fed past a size: world/garden/orbit.js): its look made anew; what stands
   *  on it is the realm's to move out to the new ground (world/garden/realm.js regrow). */
  regrow(P, r) {
    const old = P.look; old.group.parent?.remove(old.group); old.dispose();
    P.r = r; this.makePlanet(P, this.planets.indexOf(P));
    return P;
  }
  /** The lotus records that start on or land on P worked out again from the ground as it is now (after a regrow). */
  relay(P) {
    for (const [k, L] of this.lotuses.entries()) if (L.planet === P || L.toPlanet === P) { const { rec } = this.lotusAt(L.planet, L.toPlanet); rec.i = L.i; this.lotuses[k] = rec; }
  }
  /** Lotuses both ways and a vein between a later planetoid and a neighbour (the flowers are Calissa's: vfx/garden/launchlotus.js). */
  link(A, B) {
    this.LINKS.push([A.id, B.id]); const V = this.vein(A, B); this.veins.push(V);
    for (const [f, t] of [[A, B], [B, A]]) { const { rec } = this.lotusAt(f, t); rec.i = this.lotuses.length; this.lotuses.push(rec); }
    return V;
  }

  /** The features: where each system is worked. */
  buildFeatures() {
    const g = this.group, D = this.by.dantian, F = [];
    // the Dantian: the gate out (Calissa's moon gate: vfx/garden/facilitylooks.js), the shed (the Pneuka Box), the lake of your own Lachryma on its crown
    { const m = this.stand(D, dirOf(62, 0), 0); F.push({ kind: 'gate', planet: D, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    // the inner ring's berths: no plot laid under a moonlet, its clay held (MOONLET_RING; kept clear, never offered)
    MOONLET_RING.order.forEach((f, i) => { const d = moonletBerth(i); F.push({ kind: 'moonletBerth', i, planet: D, pos: D.c.clone().addScaledVector(d, D.radiusAt(d)), mesh: { visible: false } }); });
    { const d = new THREE.Vector3(0.5, 0.75, 0.42).normalize(); F.push({ kind: 'shed', planet: D, pos: D.c.clone().addScaledVector(d, D.radiusAt(d)) }); } // (Calissa's shed, her lake on the crown)
    // the Herb Terraces: the beds, a ring round its shoulder (shown as many as the garden has)
    const T = this.by.terraces;
    for (let i = 0; i < MAX_BEDS; i++) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.3), this.mats.soil); mesh.applyMatrix4(this.stand(T, dirOf(58, (i / MAX_BEDS) * 360), 0.1, (i / MAX_BEDS) * Math.PI * 2)); mesh.castShadow = true; g.add(mesh);
      F.push({ kind: 'bed', i, planet: T, pos: mesh.position.clone(), mesh });
    }
    // the Athanor: the spirit press on its crown, over the vent (Calissa's model, stood there by world/garden/press.js from `m`)
    { const R = this.by.athanor, m = this.stand(R, UP, 0);
      F.push({ kind: 'athanor', planet: R, pos: new THREE.Vector3().setFromMatrixPosition(m), m });
      // the plate shrine's hokora on the crown's east shoulder, its own F (SOUL-ALCHEMY.md 4.2; Calissa's model, vfx/garden/hokora.js)
      const h = this.stand(R, dirOf(42, 90), 0, -Math.PI / 2), hk = new THREE.Group(); hk.applyMatrix4(h); hk.name = 'hokora';
      hk.add(new Hokora().group);
      g.add(hk); F.push({ kind: 'hokora', planet: R, pos: new THREE.Vector3().setFromMatrixPosition(h) });
      { const d = dirOf(...BENCH_AT); F.push({ kind: 'bench', planet: R, pos: R.c.clone().addScaledVector(d, R.radiusAt(d)), mesh: { visible: false } }); } } // (the carving bench below it: no plot there, its clay held; F is the shrine's)
    // the Pavilions of Echoes: a pavilion for each slot
    const V = this.by.pavilions, pavGeo = mergeGeometries([new THREE.BoxGeometry(1.6, 1.6, 1.6).translate(0, 0.8, 0), new THREE.ConeGeometry(1.6, 1, 4).rotateY(Math.PI / 4).translate(0, 2.1, 0)], false);
    for (let i = 0; i < MAX_SLOTS; i++) {
      const mesh = new THREE.Mesh(pavGeo, this.mats.roof); mesh.applyMatrix4(this.stand(V, dirOf(52, (i / MAX_SLOTS) * 360), 0, (i / MAX_SLOTS) * Math.PI * 2)); mesh.castShadow = true; g.add(mesh);
      F.push({ kind: 'slot', i, planet: V, pos: mesh.position.clone(), mesh });
    }
    // the Mulberry Grove: the cocoon tree on its crown (Calissa's: vfx/garden/cocoontree.js; what hangs in it is world/garden/awaken.js's)
    { const R = this.by.mulberryGrove, m = this.stand(R, UP, 0);
      this.tree = new CocoonTree({ slots: 3 }); this.tree.group.applyMatrix4(m); g.add(this.tree.group);
      F.push({ kind: 'cocoon', planet: R, pos: new THREE.Vector3().setFromMatrixPosition(m) }); }
    // the Chimney: a needle of rock, and the mat at its foot (the tribulation is Round 4's)
    { const R = this.by.chimney, d = dirOf(40, 180); F.push({ kind: 'tribulationMat', planet: R, pos: R.c.clone().addScaledVector(d, R.radiusAt(d)) }); } // (the mat at the needle's foot: Calissa's needle above it)
    this.features = F;
  }

  /** As many beds and slots shown as the garden has (progress/garden.js). */
  sync({ beds = 0, slots = 0 } = {}) {
    for (const f of this.features) if (f.mesh) f.mesh.visible = f.kind === 'bed' ? f.i < beds : f.kind === 'slot' ? f.i < slots : true;
  }
  show(on) { this.group.visible = on; }
  /** The looks that move: the furnace's vent, the veins' light, the sky round the eye. */
  update(raw, camera) { for (const P of this.planets) P.look.update(raw); for (const V of this.veins) V.update(raw); this.sky.update(raw, camera); this.tree.update(raw); }
}
