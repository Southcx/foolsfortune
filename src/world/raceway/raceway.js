// ---------------------------------------------------------------------------------------
// THE RACEWAY (Espada's name; docs/plans/SKIFF-RACING.md section 5): a test circuit for the Solar Skiff, built of the
// Dunes' kit (their sand and its shader, their sky and light, their ruin pillars, columns and slip geysers) in a place of its own at
// the Dunes' layer, far east of them (render/zonemap.js 'raceway'). The ground is the track's one height function (world/raceway/
// track.js), sampled into the same chunked terrain and physics height field the Dunes use; the board reads it through the same few
// calls it asks of the Dunes (active, heightAt, rideHeight, normalAt, wind), so courier/skiff/skiff.js rides it unchanged. Here the
// wind is the course's own: it follows the track (Wind Waker HD's Swift Sail), swung off it where the track says. Built the first
// time it is entered, never for a session that does not come. Reached from the Index (THE RACEWAY); raced from the start's pillar
// (world/raceway/race.js).
// The looks are Calissa's: the sandfall (vfx/racewaysandfall.js); the sun plates' glyphs, the arch's lamps and the gates' marks dress
// the placeholders here when `game.racewayLooks` is in; the gates' pillars are the Dunes' own.
//
// Prior art: the test tracks of racing games (Gran Turismo's licence courses, MK8's Time Trial as the first place a track is learned);
// Motorstorm's and SSX's courses cut into open ground; the Dunes themselves (world/dunes/dunes.js), whose parts are all reused.
//
//   game.raceway = new Raceway(game)   .active   .heightAt(x, z)   .rideHeight   .normalAt   .wind   .s (the Courier's place on the line)
//   .plateAt(pos) -> plate | null   .glideAt(pos) -> bool   .arrive()   .respawn(s?)   .update(dt)   .T (the track)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../../core/physics.js';
import { ChunkTerrain } from '../../render/terrain.js';
import { addOutline } from '../../render/outline.js';
import { mergeStatic } from '../../render/merge.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Barrier } from '../dunes/barrier.js';
import { SlipGeyser } from '../../vfx/slipgeyser.js';
import { RacewaySandfall } from '../../vfx/racewaysandfall.js';
import { track, RW, FEATURES } from './track.js';

const GEYSER = { up: 18, r: 4, over: 4 }; // (as the Dunes' slip geysers: world/dunes/geysers.js LAUNCH)
const WIND = { speed: 8 }; // (the course wind's strength; its way is the track's, turned by the track's own angle)
const OFF = { far: 40, secs: 3 }; // (metres past the track's edge, and real seconds there, before the board is set back on the track)

export class Raceway {
  constructor(game) {
    this.game = game;
    this.T = track();
    this.s = this.T.line; this.d = 0; this.lat = 0; this.offT = 0;
    this.wind = { dir: new THREE.Vector2(1, 0), speed: WIND.speed, gust: 1 };
    this.built = false;
    this.geysers = []; this.plates = [];
    const F = this.T.frame(this.T.line);
    this.startPillar = this.local(F.x - F.fz * -(F.w + 7), F.z + F.fx * -(F.w + 7)); // (left of the line, beyond the berm: F there begins a race)
  }
  get center() { return new THREE.Vector3(RW.x, RW.y, RW.z); }
  /** A local point (metres from the Raceway's middle) on the ground, in the world. */
  local(lx, lz) { const x = RW.x + lx, z = RW.z + lz; return new THREE.Vector3(x, this.heightAt(x, z), z); }
  /** Is the Courier here? */
  get active() { const p = this.game.player?.pos; if (!p) return false; return Math.hypot(p.x - RW.x, p.z - RW.z) < RW.edge + 40 && p.y < -150 && p.y > -600; }

  /** World height of the ground at world x, z: the field's own samples where it is built (what is drawn and collided), else the function. */
  heightAt(x, z) {
    const lx = x - RW.x, lz = z - RW.z, G = this.grid;
    if (!G || Math.abs(lx) >= RW.half || Math.abs(lz) >= RW.half) return RW.y + this.T.heightAt(lx, lz);
    const fx = (lx + RW.half) / RW.step, fz = (lz + RW.half) / RW.step, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, n = G.n, H = G.heights;
    const h00 = H[i * n + j], h10 = H[(i + 1) * n + j], h01 = H[i * n + j + 1], h11 = H[(i + 1) * n + j + 1];
    return RW.y + (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
  }
  rideHeight(x, z) { return this.heightAt(x, z); }
  normalAt(x, z, out = new THREE.Vector3()) {
    const e = 0.7, hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
  }
  /** Where on the line s is, in the world, and which way it runs (yaw, as the Courier's: atan2(fx, fz)). */
  at(s) { const F = this.T.frame(s); return { pos: this.local(F.x, F.z), yaw: Math.atan2(F.fx, F.fz), w: F.w }; }

  // ------------------------------------------------------------------ built the first time it is entered
  build() {
    if (this.built) return; this.built = true;
    const g = this.game, T = this.T;
    // the ground: the Dunes' own sand material on a field of this place's heights, and its height field to stand on
    const mat = g.dunes?.terrain?.material || new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92 });
    const TR = (this.chunks = new ChunkTerrain({ height: (x, z) => T.heightAt(x, z), half: RW.half, step: RW.step, chunk: 32, outer: RW.outer, outerStep: 20, material: mat }));
    this.grid = { n: TR.n, heights: TR.heights };
    const mesh = (this.terrain = TR.mesh); mesh.position.set(RW.x, RW.y, RW.z); mesh.receiveShadow = true; mesh.userData.zone = 'raceway'; g.scene.add(mesh);
    const body = g.physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(RW.x, RW.y, RW.z));
    g.physics.world.createCollider(RAPIER.ColliderDesc.heightfield(TR.n - 1, TR.n - 1, TR.heights, { x: RW.half * 2, y: 1, z: RW.half * 2 }).setFriction(0.9).setCollisionGroups(GROUPS.static), body);
    this.barrier = new Barrier(g, { center: this.center, radius: RW.edge, y0: RW.y - 20, y1: RW.y + 300 });
    this.buildKit();
    this.buildMarks();
    g.racewayLooks?.dress(this); // (Calissa's: the sun plates' glyphs, the arch's lamps, the gates' marks; the slabs hidden)
  }

  /** The Dunes' ruins, set out as a circuit's furniture: the start's arch, a pair of pillars at each gate, the slalom's columns, the
   *  start's pillar (a small Gnomon), all one batch (render/merge.js) with their colliders. */
  buildKit() {
    const g = this.game, T = this.T, W = g.physics.world, group = (this.group = new THREE.Group()); group.userData.zone = 'raceway';
    const vc = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true });
    const painted = (geo, color) => { const g2 = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g2.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g2.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g2.attributes)) if (!['position', 'normal', 'color'].includes(k)) g2.deleteAttribute(k); return g2; };
    const solid = (geo, pos, quat, collider) => {
      const m = new THREE.Mesh(geo, vc); m.position.copy(pos); m.quaternion.copy(quat); m.castShadow = m.receiveShadow = true; addOutline(m); group.add(m);
      const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(quat)); W.createCollider(collider.setCollisionGroups(GROUPS.static).setFriction(0.9), b);
    };
    const yawQ = (yaw) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    // a ruin pillar (the Dunes' own: clay, a gold band, a dark cap), standing h tall
    const pillar = (p, h, w = 1.6, yaw = 0) => {
      const geo = mergeGeometries([painted(new THREE.BoxGeometry(w, h, w), 0xd9906a), painted(new THREE.BoxGeometry(w * 1.02, 0.25, w * 1.02).translate(0, h * 0.22, 0), 0xffd696), painted(new THREE.ConeGeometry(w * 0.72, w * 1.1, 4).rotateY(Math.PI / 4).translate(0, h / 2 + w * 0.5, 0), 0x8a4a3a)]);
      solid(geo, p.clone().setY(p.y + h / 2 - 1.5), yawQ(yaw), RAPIER.ColliderDesc.cuboid(w / 2, h / 2, w / 2));
    };
    const side = (s, lat) => { const F = T.frame(s); return this.local(F.x - F.fz * lat, F.z + F.fx * lat); }; // (lat: metres to the track's right)
    const yawAt = (s) => { const F = T.frame(s); return Math.atan2(F.fx, F.fz); };
    // the start's arch over the line, and a gate's pair of pillars at each of the eight gates
    { const s = T.line, F = T.frame(s), a = side(s, -(F.w + 3)), b = side(s, F.w + 3), top = Math.max(a.y, b.y) + 11;
      pillar(a, top - a.y + 1.5, 2.2, yawAt(s)); pillar(b, top - b.y + 1.5, 2.2, yawAt(s));
      const mid = a.clone().add(b).multiplyScalar(0.5).setY(top + 0.6), len = a.distanceTo(b.clone().setY(a.y)) + 2.6;
      solid(painted(new THREE.BoxGeometry(len, 1.4, 2.0), 0x8a4a3a), mid, yawQ(yawAt(s) + Math.PI / 2), RAPIER.ColliderDesc.cuboid(len / 2, 0.7, 1.0)); }
    for (const s of T.gates) { const F = T.frame(s); pillar(side(s, -(F.w + 2.5)), 8, 1.5, yawAt(s)); pillar(side(s, F.w + 2.5), 8, 1.5, yawAt(s)); }
    // the slalom: broken columns in the line, every so often, side to side
    { const S = FEATURES.slalom, s0 = T.sOf(...S.from), s1 = T.sOf(...S.to); let k = 0;
      for (let s = s0; s < s1; s += S.every, k++) { const p = side(s, (k % 2 ? 1 : -1) * S.lat), h = 4 + (k % 3), w = 1.3;
        solid(painted(new THREE.CylinderGeometry(w * 0.8, w, h, 8), k % 2 ? 0xd9906a : 0x8a4a3a), p.clone().setY(p.y + h / 2 - 0.6), yawQ(k), RAPIER.ColliderDesc.cylinder(h / 2, w * 0.9)); } }
    // the start's pillar: a small Gnomon (F at its foot: a race)
    { const p = this.startPillar, spire = painted(new THREE.CylinderGeometry(0.8, 3, 16, 6), 0xf6d9b8);
      solid(spire, p.clone().setY(p.y + 7.5), yawQ(0), RAPIER.ColliderDesc.cylinder(8, 2.4)); }
    g.scene.add(group);
    group.updateMatrixWorld(true);
    mergeStatic(group);
  }

  /** The sun plates, the geysers and the sandfall: placeholders where they are looks (Calissa's), real where they act. */
  buildMarks() {
    const g = this.game, T = this.T, F = FEATURES;
    const plateMat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const P of F.plates) {
      const s = T.sOf(P.cp, P.at), Fr = T.frame(s + P.len / 2), c = this.local(Fr.x - Fr.fz * P.lat, Fr.z + Fr.fx * P.lat);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(P.w * 2, P.len).rotateX(-Math.PI / 2), plateMat);
      m.position.copy(c).setY(c.y + 0.08); m.rotation.y = Math.atan2(Fr.fx, Fr.fz); m.userData.zone = 'raceway'; m.renderOrder = 3; g.scene.add(m);
      this.plates.push({ s0: s, s1: s + P.len, lat: P.lat, w: P.w, mesh: m, index: this.plates.length });
    }
    for (const [i, G] of F.geysers.entries()) {
      const s = T.sOf(G.cp, G.at), Fr = T.frame(s), pos = this.local(Fr.x - Fr.fz * G.lat, Fr.z + Fr.fx * G.lat);
      const look = new SlipGeyser({ height: 24, radius: GEYSER.r, seed: 40 + i }); look.group.position.copy(pos); look.group.userData.zone = 'raceway'; g.scene.add(look.group);
      this.geysers.push({ look, pos, thrown: false });
    }
    // the sandfall, down the face under the lip: where it hangs is data, its look Calissa's
    { const L = F.glideLip, s = T.sOf(L.cp, 3), Fr = T.frame(s), top = this.local(Fr.x, Fr.z), base = T.frame(T.sOf(L.cp + 1, 0)), w = Fr.w * 2 + 10;
      const h = top.y - (RW.y + base.y) + 2;
      this.sandfall = { top: top.clone(), dir: new THREE.Vector3(Fr.fx, 0, Fr.fz), width: w, height: h };
      this.sandfall.look = new RacewaySandfall(g, { ...this.sandfall, zone: 'raceway' }); this.sandfall.mesh = this.sandfall.look.object; g.scene.add(this.sandfall.mesh); } // (Calissa's curtain: vfx/racewaysandfall.js, placed at `top` along `dir`)
  }

  // ------------------------------------------------------------------ what the board asks
  /** A sun plate under the Courier (riding its stretch of the line, within its width), or null. */
  plateAt(pos) {
    if (!this.plates.length || this.d > 30) return null;
    const L = this.T.length;
    for (const P of this.plates) { const u = ((this.s - P.s0) % L + L) % L; if (u <= P.s1 - P.s0 && Math.abs(this.lat - P.lat) < P.w && pos.y - this.heightAt(pos.x, pos.z) < 2) return P; }
    return null;
  }
  /** Over the glide lip's stretch (the wings open by themselves there: MK8's glider ramp)? */
  glideAt() { const G = FEATURES.glideLip, s0 = this.T.sOf(G.cp, G.from), L = this.T.length, u = ((this.s - s0) % L + L) % L; return this.d < 40 && u <= G.to - G.from; }

  /** Into the Raceway from the Index: set down on foot beside the start's pillar, facing the line. */
  arrive() {
    const g = this.game; this.build();
    g.player.killY = RW.y - 90;
    const p = this.startPillar, at = this.at(this.T.line), to = p.clone().addScaledVector(new THREE.Vector3(Math.sin(at.yaw), 0, Math.cos(at.yaw)), -6).add(new THREE.Vector3(Math.sin(at.yaw + Math.PI / 2), 0, Math.cos(at.yaw + Math.PI / 2)).multiplyScalar(4));
    to.y = this.heightAt(to.x, to.z) + 0.05;
    g.course.teleport(to, Math.atan2(p.x - to.x, p.z - to.z));
    this.s = this.T.line;
    g.events?.emit('raceway.enter', { by: 'courier' });
  }
  /** Set back on the track at s (or where they are along it), mounted, facing along it (MK8's Lakitu). */
  respawn(s = this.s) {
    const g = this.game, at = this.at(s); at.pos.y += 0.6;
    g.course.teleport(at.pos, at.yaw);
    this.s = s; this.offT = 0;
    g.player.techs?.get?.('skiff')?.mount();
    g.events?.emit('race.respawn', { by: 'courier' });
  }

  // ------------------------------------------------------------------ per frame
  update(dt) {
    if (!this.built) return;
    const g = this.game, cam = g.camera, here = this.active;
    this.chunks.update(cam.position.x - RW.x, cam.position.z - RW.z);
    if (!here) return;
    this.sandfall?.look?.update(dt);
    this.barrier.update(dt);
    const P = g.player, lx = P.pos.x - RW.x, lz = P.pos.z - RW.z;
    // the Courier's place on the line, followed along it (never jumping to a switchback's other leg), found afresh when far off it
    const n = (this.d < 60 ? this.T.nearest(lx, lz, this.s) : null) || this.T.nearest(lx, lz);
    if (n) { this.s = n.s; this.d = n.d; this.lat = n.lat; }
    // the course's wind: along the track, turned off it by the track's own angle
    const F = this.T.frame(this.s), a = Math.atan2(F.fz, F.fx) + F.wind;
    this.wind.dir.set(Math.cos(a), Math.sin(a)); this.wind.gust = 1 + 0.05 * Math.sin(performance.now() * 0.0003); this.wind.speed = WIND.speed * this.wind.gust;
    // the slip geysers: on their cycle, throwing whatever is in the column up (as the Dunes')
    for (const G of this.geysers) {
      G.look.update(dt);
      if (!G.look.launching) { G.thrown = false; continue; }
      if (G.thrown || Math.hypot(P.pos.x - G.pos.x, P.pos.z - G.pos.z) > GEYSER.r || P.pos.y - G.pos.y > GEYSER.over) continue;
      G.thrown = true; P.impulse(new THREE.Vector3(0, Math.max(0, GEYSER.up - P.vel.y), 0), 'geyser');
      const S = g.techs?.active; if (S?.id === 'skiff') { S.air = true; S.spin = 0; S.airT = 0; }
      g.events?.emit('geyser.launch', { by: 'environment' });
    }
    // far off the track on the board for a while: set back on it
    const riding = g.techs?.active?.id === 'skiff' && g.techs.active.phase === 'ride';
    this.offT = riding && this.d > F.w + OFF.far ? this.offT + dt : 0;
    if (this.offT > OFF.secs) this.respawn(this.s);
  }
}
