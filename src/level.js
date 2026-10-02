import { tag } from './tags.js';
import { buildBasement, groundFloor, spawnBasement, inHole, HOLE, BASE_Y } from './basement.js';
import { buildTechLab, spawnTechLab } from './techlab.js';
import { buildMill } from './mill.js';
import { buildRigLab, spawnRigLab } from './riglab.js';
import { buildSiege, spawnSiege } from './siege.js';
import { buildCircuitRooms } from './circuitrooms.js';
import { buildWeir, spawnWeir } from './angling/weir.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { zoneOf } from './render/zones.js';
const _center = new THREE.Vector3();
import { RAPIER, GROUPS } from './physics.js';
import { PALETTE, T } from './config.js';
import { sfx } from './audio.js';
import { addOutline } from './outline.js';
import { PROFILES, prepProfile } from './pottery.js';

// Greybox terracotta workshop. Everything static is merged per colour into a
// handful of meshes; colliders are simple cuboids/cylinders/balls.

const W = 10, D = 15, H = 13.5; // half-width, half-depth, total height
const F2 = 7; // second floor walking height
export const ROOM = { W, D, H, F2 };

const rand = (a, b) => a + Math.random() * (b - a);
let _glowTex;
// soft radial falloff (a SpriteMaterial without a map draws as a hard square)
function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Level {
  constructor(scene, physics, breakables) {
    this.scene = scene;
    this.physics = physics;
    this.breakables = breakables;
    this.batches = new Map(); // colour -> { geos, outline }
    this.dynamic = [];
    this.fixedBody = physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  }

  /** One material per colour for the loose props (crates, bricks): shared, so that resting ones fall into the same prop batch. */
  propMat(color, vertexColors = false) {
    const k = `${color}|${vertexColors}`;
    this._propMats ??= new Map();
    if (!this._propMats.has(k)) { const m = this.mat(color); m.vertexColors = vertexColors; this._propMats.set(k, m); }
    return this._propMats.get(k);
  }

  mat(color, emissive) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, emissive: emissive ?? 0x000000 });
  }

  addGeo(geo, color, outline = true, shadow = true) {
    // merged by look, and by place: one batch per zone and 64 m cell (see render/zones.js), so that a room out of sight is not drawn and
    // the camera's frustum can still drop the parts of a large one behind it
    if (!geo.boundingBox) geo.computeBoundingBox();
    const c = geo.boundingBox.getCenter(_center), zone = zoneOf(c);
    const k = `${color}_${outline}_${shadow}_${zone}_${Math.floor(c.x / 64)}_${Math.floor(c.z / 64)}`;
    if (!this.batches.has(k)) this.batches.set(k, { color, outline, shadow, zone, geos: [] });
    this.batches.get(k).geos.push(geo.index ? geo.toNonIndexed() : geo);
  }

  box(pos, size, color, { outline = true, rotX = 0, rotY = 0, collide = true, shadow = true } = {}) {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1)));
    this.addGeo(g, color, outline, shadow);
    if (!collide) return null;
    const cd = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
      .setTranslation(...pos).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9);
    return this.physics.world.createCollider(cd, this.fixedBody);
  }

  /**
   * Stairs walk like a ramp: an invisible slab from (za, ya) up to (zb, yb) along +z,
   * a few cm above the step noses' midline so feet sit on the treads. Per-step boxes
   * made the character controller catch on every riser.
   */
  rampCollider(x, width, za, ya, zb, yb, lift = 0.05) {
    const th = 0.4, len = Math.hypot(zb - za, yb - ya);
    const ang = Math.atan2(yb - ya, zb - za);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-ang, 0, 0));
    const n = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
    const c = new THREE.Vector3(x, (ya + yb) / 2 + lift, (za + zb) / 2).addScaledVector(n, -th / 2);
    const cd = RAPIER.ColliderDesc.cuboid(width / 2, th / 2, len / 2).setTranslation(c.x, c.y, c.z).setRotation(q)
      .setCollisionGroups(GROUPS.static).setFriction(0.9);
    this.physics.world.createCollider(cd, this.fixedBody);
  }

  cylinder(pos, r, h, color, segs = 10, outline = true) {
    const g = new THREE.CylinderGeometry(r, r, h, segs);
    g.translate(...pos);
    this.addGeo(g, color, outline);
    const cd = RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(...pos).setCollisionGroups(GROUPS.static);
    this.physics.world.createCollider(cd, this.fixedBody);
  }

  finalizeStatic() {
    for (const { color, outline, shadow, zone, geos } of this.batches.values()) {
      const merged = mergeGeometries(geos.map((g) => { g.deleteAttribute('uv'); return g; }), false);
      const m = new THREE.Mesh(merged, this.mat(color));
      m.userData.zone = zone;
      m.receiveShadow = true;
      m.castShadow = shadow;
      if (outline) addOutline(m);
      this.scene.add(m);
    }
    this.batches.clear();
  }

  // ---------------------------------------------------------------------------
  build() {
    const C = PALETTE;
    // shell: walls and roof don't cast shadows, so sun spills through the skylights
    // onto the upper floor and down the atrium onto the ground floor
    const wall = { outline: false, shadow: false };
    groundFloor(this, W, D, C.floor); // (with the basement hole cut out)
    this.box([0, H + 0.25, 0], [W * 2 + 1, 0.5, D * 2 + 1], C.deep, wall);
    this.box([-(W + 0.25), H / 2, 0], [0.5, H, D * 2 + 1], C.wall, wall);
    this.box([W + 0.25, H / 2, 0], [0.5, H, D * 2 + 1], C.wall, wall);
    this.box([0, H / 2, -(D + 0.25)], [W * 2 + 1, H, 0.5], C.wall, wall);
    this.box([0, H / 2, D + 0.25], [W * 2 + 1, H, 0.5], C.wall, wall);
    // floor planks / tiles: subtle darker strips (visual only, broken around the basement hole)
    const lineX = (y, z, a, b) => this.box([(a + b) / 2, y, z], [b - a, 0.01, 0.06], C.deep, { outline: false, collide: false, shadow: false });
    const lineZ = (y, x, a, b) => this.box([x, y, (a + b) / 2], [0.06, 0.01, b - a], C.deep, { outline: false, collide: false, shadow: false });
    for (const y of [0.005, F2 + 0.005]) {
      const cut = y < 1;
      for (let z = -D + 1.5; z < D; z += 3) {
        if (cut && z > HOLE.z0 && z < HOLE.z1) { lineX(y, z, -W, HOLE.x0); lineX(y, z, HOLE.x1, W); } else lineX(y, z, -W, W);
      }
      for (let x = -W + 2; x < W; x += 4) {
        if (cut && x > HOLE.x0 && x < HOLE.x1) { lineZ(y, x, -D, HOLE.z0); lineZ(y, x, HOLE.z1, D); } else lineZ(y, x, -D, D);
      }
    }
    // baseboards
    for (const y of [0.15, F2 + 0.15]) {
      this.box([-(W - 0.05), y, 0], [0.1, 0.3, D * 2], C.dark, { outline: false, collide: false, shadow: false });
      this.box([W - 0.05, y, 0], [0.1, 0.3, D * 2], C.dark, { outline: false, collide: false, shadow: false });
    }
    // ground-floor ceiling beams (they stop short of the upper stair flight) + wall columns
    for (const z of [-10, -5, 0, 5, 10]) {
      this.box([0.8, 5.6, z], [W * 2 - 1.6, 0.35, 0.4], C.dark);
      if (z === -10) this.box([-(W - 0.2), H / 2, z], [0.4, H, 0.5], C.dark, { shadow: false });
      this.box([W - 0.2, H / 2, z], [0.4, H, 0.5], C.dark, { shadow: false });
      this.box([0, H - 0.9, z], [W * 2, 0.4, 0.45], C.dark, { shadow: false }); // roof beams
    }
    this.box([0, 5.95, 0], [0.3, 0.3, D * 2], C.dark, { collide: false });
    this.buildSlab();
    // windows (emissive, no collision) on both storeys
    const winMat = new THREE.MeshBasicMaterial({ color: C.cream });
    for (const [wy, skipMezz] of [[4.6, true], [10.3, false]]) {
      for (const z of [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5]) {
        for (const side of [-1, 1]) {
          if (skipMezz && side < 0 && z > -3) continue; // mezzanine side: fewer windows
          const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), winMat);
          w.position.set(side * (W - 0.01), wy, z);
          w.rotation.y = -side * Math.PI / 2;
          this.scene.add(w);
          this.box([side * (W - 0.05), wy - 0.85, z], [0.14, 0.12, 1.9], C.deep, { collide: false, shadow: false });
          this.box([side * (W - 0.05), wy, z], [0.12, 1.6, 0.08], C.deep, { collide: false, outline: false, shadow: false });
        }
      }
    }
    // skylights
    const skyMat = new THREE.MeshBasicMaterial({ color: 0xfff1dc });
    for (const z of [-7.5, -2.5, 2.5, 7.5]) {
      const sk = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2), skyMat);
      sk.position.set(0, H - 0.01, z);
      sk.rotation.x = Math.PI / 2;
      this.scene.add(sk);
    }

    this.buildMezzanine();
    this.buildPlatform();
    this.buildKiln();
    this.buildRange();
    this.buildUpperFloor();
    this.buildFeatures();
    buildBasement(this, W, D);
    if (this.env) { buildTechLab(this, this.env); buildMill(this, this.env); buildRigLab(this, this.env); buildSiege(this); buildCircuitRooms(this, this.env); buildWeir(this, this.env); }

    // workbenches
    this.bench(-3.2, -4.5, 2.6, 1.0);
    this.bench(3.2, -4.5, 2.6, 1.0);
    this.bench(0, 1.5, 4.0, 1.1);
    this.bench(-3.6, 5.5, 2.2, 1.0);
    // shelves
    for (const z of [-11.5, -7.5, -3.5]) this.shelf(W - 0.35, z, -1);
    this.shelf(-(W - 0.35), -12.2, 1);
    // pottery wheels
    this.wheel(-4.6, -9);
    this.wheel(4.4, -9.6);
    // clay blocks / low props for cover
    this.box([-1.6, 0.3, -8.5], [1.2, 0.6, 0.8], C.mid);
    this.box([6.4, 0.45, -1.2], [1.4, 0.9, 1.4], C.mid);
    this.box([-4.5, 0.25, 9.8], [1.8, 0.5, 0.9], C.mid);

    this.finalizeStatic();

    // lights
    const kilnLight = new THREE.PointLight(0xff9050, 30, 14, 1.5);
    kilnLight.position.set(0, 1.1, 9.8);
    this.scene.add(kilnLight);
    this.kilnLight = kilnLight;
  }

  // Second-floor slab with a central atrium and a hole for the upper stair flight.
  buildSlab() {
    const C = PALETTE;
    const slab = (x0, x1, z0, z1) => this.box([(x0 + x1) / 2, F2 - 0.15, (z0 + z1) / 2], [x1 - x0, 0.3, z1 - z0], C.wood);
    slab(-W, W, -D, -6);
    slab(-8.4, W, 6, D);
    slab(-W, -8.4, 12, D);
    slab(-8.4, -4, -6, 6);
    slab(-W, -8.4, -6, 0);
    slab(4, W, -6, 6);
    // atrium balustrade (gap on the east side where the geyser drops you off)
    const rail = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), along = x1 !== x0;
      this.box([(x0 + x1) / 2, F2 + 1.0, (z0 + z1) / 2], along ? [len, 0.08, 0.08] : [0.08, 0.08, len], C.dark);
      this.box([(x0 + x1) / 2, F2 + 0.08, (z0 + z1) / 2], along ? [len, 0.16, 0.1] : [0.1, 0.16, len], C.dark);
      const n = Math.max(1, Math.round(len / 0.9));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        this.box([x0 + (x1 - x0) * t, F2 + 0.5, z0 + (z1 - z0) * t], [0.07, 1.0, 0.07], C.dark, { collide: false });
      }
    };
    rail(-4, -6, 4, -6);
    rail(-4, 6, 4, 6);
    rail(-4, -6, -4, 6);
    rail(4, -6, 4, -2.7);
    rail(4, -0.5, 4, 6);
    // around the stair hole
    rail(-8.4, 0, -8.4, 12);
    rail(-W, 0, -8.4, 0);
  }

  buildUpperFloor() {
    const C = PALETTE;
    const y = F2;
    // upper stair flight: mezzanine (2.6) -> second floor (7.0) along the west wall
    const n = 20, rise = (F2 - 2.6) / n, run = 0.5, z0 = 2;
    for (let k = 1; k <= n; k++) {
      const h = 2.6 + k * rise;
      this.box([-9.2, (2.6 + h) / 2, z0 + (k - 0.5) * run], [1.6, h - 2.6, run], k % 2 ? C.wood : C.mid, { collide: false });
    }
    this.rampCollider(-9.2, 1.6, z0, 2.6, z0 + n * run, F2);
    this.box([-8.35, 4.8, 7], [0.08, 4.4, 10.2], C.dark, { collide: false });
    // gallery: plinths for the sculpture
    this.box([0, y + 0.2, 11.2], [1.8, 0.4, 1.8], C.dark);
    for (const x of [-5, -2.5, 2.5, 5]) this.box([x, y + 0.25, 13.9], [0.8, 0.5, 0.8], C.mid);
    for (const x of [-6.5, 6.5]) this.box([x, y + 0.55, 8], [0.55, 1.1, 0.55], C.mid);
    for (const x of [-3, 3]) this.box([x, y + 0.1, 8.2], [0.7, 0.2, 0.7], C.dark);
    // the kiln chimney carries on up through the gallery to the roof
    this.cylinder([0, (F2 + H) / 2, 13.4], 0.45, H - F2, C.dark, 8);
    // upstairs wall shelves (east wall, showroom end)
    for (const z of [-11.5, -8.2]) this.shelf(W - 0.35, z, -1, 3.0, y);
    // drying rack on the ground floor: plates standing on edge
    const rx = -5.0, rz = 14.3;
    for (const dx of [-1.1, 1.1]) this.box([rx + dx, 0.6, rz], [0.08, 1.2, 0.5], C.dark);
    for (const hy of [0.35, 0.85]) this.box([rx, hy, rz], [2.3, 0.05, 0.5], C.wood);
    this.dryingRack = { x: rx, z: rz };
    // showroom: long display tables + a stepped pyramid stand
    for (const x of [-6, 6]) {
      this.box([x, y + 0.9, -10.5], [1.0, 0.1, 6], C.wood);
      for (const dz of [-2.8, 0, 2.8]) for (const dx of [-0.4, 0.4]) this.box([x + dx, y + 0.425, -10.5 + dz], [0.1, 0.85, 0.1], C.dark);
    }
    this.box([0, y + 0.2, -11.5], [3.2, 0.4, 3.2], C.mid);
    this.box([0, y + 0.6, -11.5], [2.2, 0.4, 2.2], C.wood);
    this.box([0, y + 1.0, -11.5], [1.2, 0.4, 1.2], C.mid);
    // west showcase platform
    this.box([-6.2, y + 0.15, -1], [3.0, 0.3, 4.4], C.mid);
    // upper kiln where the upstairs clapperjars are born
    const kr = 1.1, kpos = new THREE.Vector3(8.7, y, 2.6);
    const g = new THREE.SphereGeometry(kr, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    g.translate(kpos.x, kpos.y, kpos.z);
    this.addGeo(g, C.dark, true);
    this.physics.world.createCollider(RAPIER.ColliderDesc.ball(kr).setTranslation(kpos.x, kpos.y, kpos.z).setCollisionGroups(GROUPS.static), this.fixedBody);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.45, 8, 0, Math.PI), new THREE.MeshBasicMaterial({ color: PALETTE.glow }));
    mouth.position.set(kpos.x - kr + 0.08, y + 0.02, kpos.z);
    mouth.rotation.y = -Math.PI / 2;
    mouth.scale.set(1, 1.2, 1);
    this.scene.add(mouth);
    const upLight = new THREE.PointLight(0xff9050, 12, 8, 1.6);
    upLight.position.set(kpos.x - kr - 0.4, y + 0.7, kpos.z);
    this.scene.add(upLight);
    this.upperKilnLight = upLight;
  }

  // Lachryma geyser (lift up the atrium) and shell reliquaries
  buildFeatures() {
    const C = PALETTE;
    // Lachryma geysers: stand in the ring and it lifts you to `top`, then carries you to `exit`
    this.geysers = [
      { pos: new THREE.Vector3(2.9, 0, -1.6), exit: new THREE.Vector3(5.2, F2, -1.6), top: F2 + 1.7, maxV: 12, r: 0.9, t: 0 },
      { pos: new THREE.Vector3(7.9, BASE_Y, -13.5), exit: new THREE.Vector3(6.7, 0, -11.2), top: 1.5, maxV: 28, r: 0.9, t: 0 },
    ];
    this.geyser = this.geysers[0];
    for (const g of this.geysers) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 5, 24), new THREE.MeshBasicMaterial({ color: C.glow }));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g.pos).y += 0.05;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), new THREE.MeshBasicMaterial({ color: C.cream, transparent: true, opacity: 0.35 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.copy(g.pos).y += 0.03;
      this.scene.add(ring, disc);
      this.box([g.pos.x, g.pos.y + 0.03, g.pos.z], [1.9, 0.06, 1.9], C.dark, { collide: false });
    }
    this.reliquaries = [];
    for (const p of [[-3.4, 0, -13.2], [8.4, F2, -4.6]]) {
      const pos = new THREE.Vector3(...p);
      this.box([pos.x, pos.y + 0.45, pos.z], [0.6, 0.9, 0.6], C.dark);
      const icon = new THREE.Group();
      const shellMat = new THREE.MeshStandardMaterial({ color: C.potLight, emissive: C.glow, emissiveIntensity: 0.5, flatShading: true });
      for (let i = 0; i < 5; i++) {
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 7), shellMat);
        const a = (i / 5) * Math.PI * 2;
        sh.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
        icon.add(sh);
      }
      icon.position.set(pos.x, pos.y + 1.2, pos.z);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: C.glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(0.8);
      icon.add(halo);
      this.scene.add(icon);
      this.reliquaries.push({ pos, icon, halo, cool: 0 });
    }
    this.clapperFloors = [
      { y: 0, x0: -5.9, x1: 5.9, z0: -13.5, z1: 9.2, spawn: new THREE.Vector3(0, 0, 9.9), heading: Math.PI },
      { y: F2, x0: -7.9, x1: 7.3, z0: -14.3, z1: 14.2, spawn: new THREE.Vector3(7.2, F2, 2.6), heading: -Math.PI / 2 },
    ];
  }

  updateFeatures(dt, game) {
    const p = game.player, fx = game.fx, feet = p.pos;
    const g = this.geyser;
    for (const gy of this.geysers) {
      gy.t += dt;
      // particle column
      if (Math.random() < 0.9) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.6;
        fx.add.emit({ pos: gy.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.1, Math.sin(a) * r)), vel: new THREE.Vector3(0, 6 + Math.random() * 6, 0),
          life: 0.9, size: 0.05, sizeEnd: 0.01, color: new THREE.Color(PALETTE.cream), drag: 0.3, twinkle: 18 });
      }
      const dx = feet.x - gy.pos.x, dz = feet.z - gy.pos.z;
      const inCol = dx * dx + dz * dz < gy.r * gy.r;
      if (inCol && feet.y > gy.pos.y - 0.5 && feet.y < gy.top - 0.4 && !p.exiting) {
        if (p.riding !== gy) { p.riding = gy; sfx.geyser(); }
        // ballistic ease-out: just enough speed to crest over `top`
        const need = Math.sqrt(2 * T.movement.gravity * Math.max(0, gy.top - feet.y));
        p.vel.y = Math.max(p.vel.y, Math.min(gy.maxV, need + 0.5));
        p.vel.x *= 0.8; p.vel.z *= 0.8;
        p.grounded = false;
        p.wallrun = null;
      } else if (p.riding === gy && feet.y > gy.top - 0.5) {
        // over the lip: carry the rider onto the landing
        p.riding = null;
        p.exiting = 1.2;
        p.exitTo = gy.exit;
      }
      if (p.riding === gy && !inCol && feet.y < gy.top - 1) p.riding = null;
    }
    if (p.exiting) {
      p.exiting -= dt;
      const d = p.exitTo.clone().sub(feet).setY(0);
      if (d.length() < 0.4 || p.grounded || p.exiting <= 0) p.exiting = 0;
      else { const v = d.normalize().multiplyScalar(5); p.vel.x = v.x; p.vel.z = v.z; }
    }
    // shell reliquaries
    for (const r of this.reliquaries) {
      r.cool -= dt;
      r.icon.rotation.y += dt * (r.cool > 0 ? 0.3 : 1.5);
      r.icon.position.y = r.pos.y + 1.2 + Math.sin(g.t * 2) * 0.05;
      r.halo.material.opacity = r.cool > 0 ? 0.1 : 0.5 + 0.2 * Math.sin(g.t * 4);
      if (r.cool <= 0 && Math.abs(feet.y - r.pos.y) < 1 && feet.distanceTo(r.pos.clone().setY(feet.y)) < 1.3) {
        const got = game.shells.refill();
        if (got > 0) {
          r.cool = T.shells.reliquaryCooldown;
          game.events?.emit('shell.refill', { got });
          sfx.absorb(8);
          fx.absorbSparkle(r.icon.position.clone());
        }
      }
    }
  }

  buildMezzanine() {
    const C = PALETTE;
    const top = 2.6, x0 = -W, x1 = -6.5;
    const cx = (x0 + x1) / 2, w = x1 - x0;
    this.box([cx, top - 0.125, 5.75], [w, 0.25, 17.5], C.wood);
    for (const z of [-2.8, 3, 8.6, 14.2]) this.box([x1 + 0.15, (top - 0.25) / 2, z], [0.25, top - 0.25, 0.25], C.dark);
    // edge lip (visual)
    this.box([x1 + 0.03, top + 0.03, 5.75], [0.06, 0.06, 17.5], C.dark, { collide: false });
    // stairs: 12 solid steps
    const n = 12, rise = top / n, run = 0.5, z0 = -9;
    for (let k = 1; k <= n; k++) {
      const h = k * rise;
      this.box([-9.2, h / 2, z0 + (k - 0.5) * run], [1.6, h, run], k % 2 ? C.wood : C.mid, { collide: false });
    }
    this.rampCollider(-9.2, 1.6, z0, 0, z0 + n * run, top);
    this.box([-8.35, 1.3, -6], [0.08, 2.6, 6.2], C.dark, { collide: false }); // stringer
  }

  buildPlatform() {
    const C = PALETTE;
    const top = 1.2;
    this.box([8, top / 2, 10.25], [4, top, 8.5], C.mid);
    // ramp rising toward +z
    const L = 3.5, th = 0.3;
    const ang = Math.atan2(top, L);
    const len = Math.hypot(top, L) + 0.1;
    const mid = new THREE.Vector3(8, top / 2, 6 - L / 2);
    const nrm = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
    const c = mid.clone().addScaledVector(nrm, -th / 2);
    this.box([c.x, c.y, c.z], [2, th, len], C.wood, { rotX: -ang });
  }

  buildKiln() {
    const C = PALETTE;
    const r = 2.2, pos = new THREE.Vector3(0, 0, 12.6);
    const g = new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.translate(pos.x, pos.y, pos.z);
    this.addGeo(g, C.dark, true);
    this.physics.world.createCollider(RAPIER.ColliderDesc.ball(r).setTranslation(pos.x, pos.y, pos.z).setCollisionGroups(GROUPS.static), this.fixedBody);
    this.cylinder([0, 4.6, 13.4], 0.45, 5, C.dark, 8);
    // glowing mouth
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.75, 8, 0, Math.PI), new THREE.MeshBasicMaterial({ color: PALETTE.glow }));
    mouth.position.set(0, 0.02, pos.z - r + 0.12);
    mouth.rotation.y = Math.PI;
    mouth.scale.set(1, 1.3, 1);
    this.scene.add(mouth);
    this.box([0, 1.05, pos.z - r + 0.2], [1.8, 0.15, 0.3], C.deep, { collide: false });
  }

  buildRange() {
    const C = PALETTE;
    this.targetDefs = [];
    const posts = [[-3.2, 7.4, 1.1], [-1.6, 8.6, 1.6], [0, 7.4, 1.25], [1.6, 8.6, 1.8], [3.2, 7.4, 1.0], [-2.4, 10.4, 2.3], [2.4, 10.4, 2.1]];
    for (const [x, z, h] of posts) {
      this.box([x, h / 2, z], [0.08, h, 0.08], C.dark);
      this.box([x, 0.04, z], [0.5, 0.08, 0.5], C.dark);
      this.targetDefs.push({ kind: 'plate', target: true, pos: [x, h - 0.12, z - 0.06], facing: [0, 0.05, -1], scale: 0.9, color: C.potLight, respawn: 2.5 });
    }
  }

  bench(x, z, w, d, h = 0.95) {
    const C = PALETTE;
    this.box([x, h - 0.05, z], [w, 0.1, d], C.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      this.box([x + sx * (w / 2 - 0.1), (h - 0.1) / 2, z + sz * (d / 2 - 0.1)], [0.1, h - 0.1, 0.1], C.dark);
    }
    this.box([x, 0.25, z], [w - 0.2, 0.05, d - 0.2], C.dark, { collide: false });
    (this.surfaces ||= []).push({ x, z, w, d, y: h });
  }

  shelf(x, z, facing, w = 3.0, base = 0) {
    const C = PALETTE;
    const depth = 0.6, levels = [0.45, 1.05, 1.65, 2.25];
    for (const s of [-1, 1]) this.box([x, base + 1.3, z + s * (w / 2)], [depth, 2.6, 0.06], C.dark);
    this.box([x - facing * 0.28, base + 1.3, z], [0.04, 2.6, w], C.deep, { collide: false });
    for (const y of levels) {
      this.box([x, base + y - 0.025, z], [depth, 0.05, w], C.wood);
      (this.shelves ||= []).push({ x, z, w, y: base + y, facing, upper: base > 0 });
    }
  }

  wheel(x, z) {
    const C = PALETTE;
    this.cylinder([x, 0.3, z], 0.3, 0.6, C.dark, 8);
    this.cylinder([x, 0.63, z], 0.42, 0.06, C.wood, 12);
    this.box([x + 0.55, 0.2, z], [0.5, 0.4, 0.5], C.mid);
    (this.wheels ||= []).push({ x, z, y: 0.66 });
  }

  // ---------------------------------------------------------------------------
  // Dynamic content: rebuilt on reset.
  spawnDynamic() {
    const B = this.breakables;
    const C = PALETTE;
    const colors = [C.pot, C.potLight, C.mid, C.pale, C.wood];
    const smalls = ['jar', 'vase', 'cup', 'bowl', 'pitcher', 'bottle', 'crown', 'twist'];
    const pot = (kind, x, y, z, scale = 1, extra = {}) =>
      B.spawn({ kind, pos: [x, y + 0.002, z], scale, color: PROFILES[kind].mat === 'porcelain' ? pick([C.cream, C.pale]) : pick(colors), ...extra });
    const big = (kind, x, z, scale, color, y = 0) =>
      B.spawn({ kind, pos: [x, y + 0.002, z], scale, color: color ?? pick([C.mid, C.wood, C.pot, C.dark]) });

    // shelves
    for (const s of this.shelves) {
      const n = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const zz = s.z - s.w / 2 + (s.w / n) * (i + 0.5) + rand(-0.1, 0.1);
        const low = s.y - (s.upper ? 7 : 0) < 1;
        const kind = low ? pick([...smalls, 'amphora', 'onion', 'stack']) : pick([...smalls, 'melon']);
        const scale = { amphora: 0.7, onion: 0.7, stack: 0.65, melon: 0.8 }[kind] ?? rand(0.8, 1.1);
        pot(kind, s.x + rand(-0.05, 0.05), s.y, zz, scale);
      }
    }
    // benches
    const benchLoads = [
      ['jar', 'crown', 'bowl', 'bottle', 'cup'],
      ['amphora', 'twist', 'melon', 'vase', 'crown'],
      ['jar', 'bottle', 'cup', 'EMBER', 'bowl', 'twist', 'onion'],
      null,
    ];
    this.surfaces.forEach((s, i) => {
      const load = benchLoads[i];
      if (!load) return;
      load.forEach((kind, k) => {
        const x = s.x - s.w / 2 + (s.w / load.length) * (k + 0.5);
        const z = s.z + rand(-0.2, 0.2);
        if (kind === 'EMBER') B.spawn({ kind: 'ember', ember: true, pos: [x, s.y + 0.002, z], scale: 0.9 });
        else pot(kind, x, s.y, z, { amphora: 0.9, melon: 0.75, onion: 0.8 }[kind] ?? rand(0.85, 1.15));
      });
    });
    // brick pyramid on the 4th bench
    const bs = this.surfaces[3];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 4 - row; i++) {
        const x = bs.x - (3 - row) * 0.13 + i * 0.26;
        this.brick([x, bs.y + 0.035 + row * 0.072, bs.z], [0.24, 0.07, 0.12]);
        this.brick([x, bs.y + 0.035 + row * 0.072, bs.z + 0.14], [0.24, 0.07, 0.12]);
      }
    }
    // wheels: something fresh off the wheel
    this.wheels.forEach((w, i) => pot(i ? 'onion' : 'spindle', w.x, w.y, w.z, 0.9));

    // slip barrels
    for (const [x, yy, z] of [[-5.3, 0, -9.6], [5.3, 0, -10.4], [-6.9, 0, 7.6], [3.8, 7, -13.8], [-3.8, 7, -13.8]]) {
      B.spawn({ kind: 'barrel', slip: true, pos: [x, yy + 0.002, z], scale: rand(0.95, 1.1), color: pick([C.wood, C.mid, C.dark]) });
    }
    // drying rack: plates on edge
    const dr = this.dryingRack;
    for (const hy of [0.375, 0.875]) {
      for (let i = 0; i < 5; i++) {
        B.spawn({ kind: 'plate', pos: [dr.x - 0.9 + i * 0.45, hy + 0.22, dr.z - 0.02], facing: [0, 0.25, -1], scale: 0.7, color: pick(colors) });
      }
    }
    // --- the big stuff -----------------------------------------------------
    // storage bay under the mezzanine
    big('tsubo', -8.55, 0.7, 1.0);
    big('gourd', -8.45, 3.6, 1.15);
    big('melon', -7.4, 2.2, 1.3);
    big('tsubo', -8.6, 6.3, 0.85);
    big('stack', -7.35, 5.1, 1.35);
    big('jomon', -8.45, 11.2, 1.1);
    big('gourd', -7.5, 9.3, 0.85);
    // jomon pots flanking the kiln
    big('jomon', -3.3, 12.9, 1.25, C.mid);
    big('jomon', 3.3, 12.9, 1.25, C.mid);
    // right wall nook
    big('gourd', 8.4, 0.4, 1.3);
    big('onion', 8.7, -1.3, 1.5);
    big('melon', 7.5, 1.4, 1.1);
    // spawn end
    big('tsubo', 5.2, -13.7, 0.95);
    big('stack', -4.8, -13.8, 1.5);
    big('jomon', -2.2, -14.1, 0.9);
    // classic urns
    for (const [x, z] of [[-7.6, -13.6], [7.6, -13.8], [-5.2, 11.9], [4.9, 11.6], [2.6, -12.4]]) {
      big('urn', x, z, rand(0.85, 1.05), pick([C.mid, C.wood, C.pot]));
    }
    // little floor clusters
    for (const [cx, cz] of [[1.8, -7.6], [-6.4, -6.2], [6.3, 5.0], [-1.0, 5.4]]) {
      for (let i = 0; i < 3; i++) pot(pick(smalls), cx + rand(-0.45, 0.45), 0, cz + rand(-0.45, 0.45), rand(0.9, 1.2));
    }
    // mezzanine edge
    for (let z = -1.5; z < 14; z += 1.25) {
      if (Math.abs(z - 6.0) < 0.3) { B.spawn({ kind: 'ember', ember: true, pos: [-7.1, 2.602, z], scale: 0.9 }); continue; }
      const kind = pick([...smalls, 'amphora', 'spindle', 'onion']);
      pot(kind, -7.05 + rand(-0.1, 0.1), 2.6, z, { spindle: 0.8, onion: 0.8 }[kind] ?? rand(0.85, 1.1));
    }
    big('urn', -7.6, 14.1, 1, undefined, 2.6);
    big('gourd', -7.7, -2.4, 0.9, undefined, 2.6);
    // right platform cluster around an ember urn
    B.spawn({ kind: 'ember', ember: true, pos: [8.2, 1.202, 10.2], scale: 1 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = rand(0.7, 1.4);
      pot(pick([...smalls, 'amphora', 'melon']), 8.2 + Math.cos(a) * r, 1.2, 10.2 + Math.sin(a) * r * 1.6, rand(0.9, 1.2));
    }
    big('tsubo', 9.0, 13.5, 0.8, undefined, 1.2);
    // floor ember near crates
    B.spawn({ kind: 'ember', ember: true, pos: [5.6, 0.002, 2.2], scale: 1.1 });
    // hanging lanterns and pots on 8-segment ropes
    const hangs = [[-3, -5, 1.6, 'lantern'], [-1, -5, 2.2, 'lantern'], [1, -5, 1.4, 'lantern'], [3, -5, 2.0, 'lantern'],
      [-2, 5, 1.8, 'jar'], [0, 5, 2.4, 'lantern'], [2, 5, 1.5, 'gourd'], [-4.5, 0, 1.2, 'lantern'], [4.5, 0, 1.9, 'lantern']];
    for (const [x, z, len, kind] of hangs) {
      const scale = kind === 'gourd' ? 0.45 : kind === 'lantern' ? rand(1.0, 1.3) : 1;
      const anchor = [x, 5.42, z];
      const h = prepProfile(kind, scale).fullHeight;
      B.spawn({ kind, scale, lantern: kind === 'lantern', color: pick(colors), pos: [x, anchor[1] - len - h * 0.95, z], hang: { anchor } });
    }
    // targets
    for (const t of this.targetDefs) B.spawn(t);

    this.spawnUpper(pot, big, colors, smalls);
    spawnBasement(B);
    spawnTechLab(B);
    spawnRigLab(B, this);
    spawnSiege(B, this);
    spawnWeir(B, this);

    // crates
    const crates = [[4.6, 3.6], [5.35, 3.6], [4.6, 4.35], [5.35, 4.35]];
    for (const [x, z] of crates) this.crate([x, 0.35, z], 0.7);
    this.crate([4.95, 1.05, 3.95], 0.7);
    for (const [x, z] of [[-6.2, -1], [-6.2, -0.25]]) this.crate([x, 0.35, z], 0.7);
    this.crate([-6.2, 1.05, -0.6], 0.7);
    // nothing parked over the basement hole
    for (const e of [...B.items]) {
      const t = e.body.translation();
      if (t.y > -0.5 && t.y < 1 && inHole(t.x, t.z, 0.4)) B.removeQuiet(e);
    }
  }

  // ---- second floor population ------------------------------------------------
  spawnUpper(pot, big, colors, smalls) {
    const B = this.breakables, C = PALETTE, y = F2;
    const sculpt = (kind, x, yy, z, scale, extra = {}) => B.spawn({ kind, pos: [x, yy + 0.002, z], scale, color: C.pot, yaw: Math.PI, ...extra });
    // gallery: the dogū, a row of haniwa, busts, endless columns
    sculpt('dogu', 0, y + 0.4, 11.2, 1.3, { color: C.mid });
    [-5, -2.5, 2.5, 5].forEach((x, i) => sculpt('haniwa', x, y + 0.5, 13.9, rand(0.95, 1.1), { variant: i % 3, color: pick([C.pot, C.potLight, C.mid]) }));
    for (const x of [-6.5, 6.5]) sculpt('bust', x, y + 1.1, 8, 1.1, { color: C.potLight });
    for (const x of [-3, 3]) sculpt('endless', x, y + 0.2, 8.2, 1.05, { color: C.wood });
    // showroom tables: rows of porcelain (diamond dust)
    for (const x of [-6, 6]) {
      for (let z = -13.1; z <= -7.9; z += 0.52) pot(pick(['cup', 'bottle', 'crown', 'twist', 'vase']), x + rand(-0.2, 0.2), y + 0.95, z, rand(0.8, 1.05));
    }
    // stepped pyramid stand
    const tiers = [[1.35, 0.4, 10], [0.85, 0.8, 7], [0.3, 1.2, 3]];
    for (const [r, h, n] of tiers) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3;
        pot(pick([...smalls, 'jar', 'melon']), Math.cos(a) * r, y + h, -11.5 + Math.sin(a) * r, 0.8);
      }
    }
    B.spawn({ kind: 'ember', ember: true, pos: [0, y + 1.202, -11.5], scale: 0.8 });
    // two teetering bowl towers by the atrium
    for (const x of [-2.2, 2.2]) {
      let h = y;
      for (let i = 0; i < 9; i++) {
        const plate = i % 2 === 0;
        const P = prepProfile(plate ? 'plate' : 'bowl', plate ? 0.7 : 1);
        B.spawn({ kind: plate ? 'plate' : 'bowl', pos: [x, h + 0.002, -7.7], scale: plate ? 0.7 : 1, color: pick(colors), yaw: 0 });
        h += P.height + 0.003;
      }
    }
    // west showcase
    big('tsubo', -6.8, -2.4, 1.0, undefined, y + 0.3);
    big('gourd', -5.6, -0.4, 1.2, undefined, y + 0.3);
    big('jomon', -6.6, 0.8, 1.0, C.mid, y + 0.3);
    big('onion', -5.4, -2.6, 1.3, undefined, y + 0.3);
    // east: ember cluster near the upper kiln
    B.spawn({ kind: 'ember', ember: true, pos: [7.2, y + 0.002, 5.6], scale: 1.1 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pot(pick(['jar', 'amphora', 'pitcher', 'melon', 'stack']), 7.2 + Math.cos(a) * 1.1, y, 5.6 + Math.sin(a) * 1.1, rand(0.8, 1.1));
    }
    big('urn', 9.2, 13.8, 1.0, undefined, y);
    big('tsubo', -1.5, 14.2, 0.9, undefined, y);
    big('gourd', 9.1, -13.9, 1.2, undefined, y);
    // the mobile: long ropes from the roof into the atrium, seen from both floors
    for (const [x, z, len, kind, sc] of [[-1.6, 0, 3.7, 'lantern', 1.4], [1.6, 0, 4.1, 'lantern', 1.3], [0, -2.2, 3.4, 'gourd', 0.6], [0, 2.2, 3.9, 'lantern', 1.5]]) {
      const anchor = [x, H - 1.12, z];
      const hh = prepProfile(kind, sc).fullHeight;
      B.spawn({ kind, scale: sc, lantern: kind === 'lantern', color: pick(colors), pos: [x, anchor[1] - len - hh * 0.95, z], hang: { anchor } });
    }
    // upstairs lanterns along the gallery
    for (const [x, z, len] of [[-5, 10, 2.4], [5, 10, 2.1], [-5, -10, 2.2], [5, -10, 2.6]]) {
      const anchor = [x, H - 1.12, z];
      const hh = prepProfile('lantern', 1.2).fullHeight;
      B.spawn({ kind: 'lantern', scale: 1.2, lantern: true, color: pick(colors), pos: [x, anchor[1] - len - hh * 0.95, z], hang: { anchor } });
    }
  }

  /** A wooden crate: up to 0.9 m it can be picked up; bigger ones are heavy (push and pull). */
  crate(pos, s) {
    // the box and its iron band in one geometry (the band's darkness a vertex colour over the wood), so a crate at rest is one
    // instance of the prop batch (render/propbatch.js) and not three draws
    const wood = new THREE.Color(PALETTE.wood), dark = new THREE.Color(PALETTE.dark);
    const paint = (g, c) => { g = g.toNonIndexed(); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
    const k = new THREE.Color(Math.min(1, dark.r / Math.max(wood.r, 1e-3)), Math.min(1, dark.g / Math.max(wood.g, 1e-3)), Math.min(1, dark.b / Math.max(wood.b, 1e-3)));
    const geo = mergeGeometries([paint(new THREE.BoxGeometry(s, s, s), new THREE.Color(1, 1, 1)), paint(new THREE.BoxGeometry(s * 1.02, s * 0.14, s * 1.02), k)]);
    const mesh = new THREE.Mesh(geo, this.propMat(PALETTE.wood, true));
    mesh.castShadow = mesh.receiveShadow = true;
    addOutline(mesh);
    const ent = this.dynProp(mesh, pos, RAPIER.ColliderDesc.cuboid(s / 2, s / 2, s / 2).setDensity(40));
    ent.size = s; ent.half = [s / 2, s / 2, s / 2]; ent.carry = s <= 0.9 ? 'lift' : 'heavy';
    return ent;
  }

  brick(pos, size) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.propMat(PALETTE.mid));
    mesh.castShadow = mesh.receiveShadow = true;
    addOutline(mesh);
    this.dynProp(mesh, pos, RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setDensity(600));
  }

  dynProp(mesh, pos, cd) {
    const body = this.physics.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(...pos).setSleeping(true).setAngularDamping(0.3));
    const col = this.physics.world.createCollider(cd.setFriction(0.8).setCollisionGroups(GROUPS.prop), body);
    mesh.position.set(...pos);
    this.scene.add(mesh);
    const ent = tag(this.breakables.addDebris(body, mesh), 'sliceable', 'pushable');
    ent.owner = this;
    ent.baseColor = mesh.material.color.clone();
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.dynamic.push(ent);
    return ent;
  }

  removeProp(e) {
    if (e.parked) { this.breakables.batch.unpark(e.parked); e.parked = null; }
    const i = this.dynamic.indexOf(e);
    if (i >= 0) this.dynamic.splice(i, 1);
    this.physics.removeSynced(e.sync);
    this.physics.removeBody(e.body);
    this.scene.remove(e.mesh);
    this.breakables.debris.delete(e);
  }

  clearDynamic() {
    for (const e of this.dynamic) {
      if (e.parked) { this.breakables.batch.unpark(e.parked); e.parked = null; }
      this.physics.removeSynced(e.sync);
      this.physics.removeBody(e.body);
      this.scene.remove(e.mesh);
      this.breakables.debris.delete(e);
    }
    this.dynamic.length = 0;
    this.breakables.clear();
  }
}
