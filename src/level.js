import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAPIER, GROUPS } from './physics.js';
import { PALETTE } from './config.js';
import { addOutline } from './outline.js';

// Greybox terracotta workshop. Everything static is merged per colour into a
// handful of meshes; colliders are simple cuboids/cylinders/balls.

const W = 10, D = 15, H = 7; // half-width, half-depth, height
export const ROOM = { W, D, H };

const rand = (a, b) => a + Math.random() * (b - a);
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

  mat(color, emissive) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, emissive: emissive ?? 0x000000 });
  }

  addGeo(geo, color, outline = true) {
    const k = `${color}_${outline}`;
    if (!this.batches.has(k)) this.batches.set(k, { color, outline, geos: [] });
    this.batches.get(k).geos.push(geo.index ? geo.toNonIndexed() : geo);
  }

  box(pos, size, color, { outline = true, rotX = 0, rotY = 0, collide = true } = {}) {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos), q, new THREE.Vector3(1, 1, 1)));
    this.addGeo(g, color, outline);
    if (collide) {
      const cd = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
        .setTranslation(...pos).setRotation(q).setCollisionGroups(GROUPS.static).setFriction(0.9);
      this.physics.world.createCollider(cd, this.fixedBody);
    }
  }

  cylinder(pos, r, h, color, segs = 10, outline = true) {
    const g = new THREE.CylinderGeometry(r, r, h, segs);
    g.translate(...pos);
    this.addGeo(g, color, outline);
    const cd = RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(...pos).setCollisionGroups(GROUPS.static);
    this.physics.world.createCollider(cd, this.fixedBody);
  }

  finalizeStatic() {
    for (const { color, outline, geos } of this.batches.values()) {
      const merged = mergeGeometries(geos.map((g) => { g.deleteAttribute('uv'); return g; }), false);
      const m = new THREE.Mesh(merged, this.mat(color));
      m.receiveShadow = true;
      m.castShadow = true;
      if (outline) addOutline(m);
      this.scene.add(m);
    }
    this.batches.clear();
  }

  // ---------------------------------------------------------------------------
  build() {
    const C = PALETTE;
    // shell
    this.box([0, -0.25, 0], [W * 2 + 1, 0.5, D * 2 + 1], C.floor, { outline: false });
    this.box([0, H + 0.25, 0], [W * 2 + 1, 0.5, D * 2 + 1], C.deep, { outline: false });
    this.box([-(W + 0.25), H / 2, 0], [0.5, H, D * 2 + 1], C.wall, { outline: false });
    this.box([W + 0.25, H / 2, 0], [0.5, H, D * 2 + 1], C.wall, { outline: false });
    this.box([0, H / 2, -(D + 0.25)], [W * 2 + 1, H, 0.5], C.wall, { outline: false });
    this.box([0, H / 2, D + 0.25], [W * 2 + 1, H, 0.5], C.wall, { outline: false });
    // floor planks / tiles: subtle darker strips (visual only)
    for (let z = -D + 1.5; z < D; z += 3) this.box([0, 0.005, z], [W * 2, 0.01, 0.06], C.deep, { outline: false, collide: false });
    for (let x = -W + 2; x < W; x += 4) this.box([x, 0.005, 0], [0.06, 0.01, D * 2], C.deep, { outline: false, collide: false });
    // baseboards
    this.box([-(W - 0.05), 0.15, 0], [0.1, 0.3, D * 2], C.dark, { outline: false, collide: false });
    this.box([W - 0.05, 0.15, 0], [0.1, 0.3, D * 2], C.dark, { outline: false, collide: false });
    // roof beams + wall columns
    for (const z of [-10, -5, 0, 5, 10]) {
      this.box([0, 5.6, z], [W * 2, 0.35, 0.4], C.dark);
      if (z !== -5) this.box([-(W - 0.2), H / 2, z], [0.4, H, 0.5], C.dark); // (skip where the stairs run)
      this.box([W - 0.2, H / 2, z], [0.4, H, 0.5], C.dark, { outline: true });
    }
    this.box([0, 5.95, 0], [0.3, 0.3, D * 2], C.dark, { collide: false });
    // windows (emissive, no collision)
    const winMat = new THREE.MeshBasicMaterial({ color: C.cream });
    for (const z of [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5]) {
      for (const side of [-1, 1]) {
        if (side < 0 && z > -3) continue; // mezzanine side: fewer windows
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), winMat);
        w.position.set(side * (W - 0.01), 4.6, z);
        w.rotation.y = -side * Math.PI / 2;
        this.scene.add(w);
        this.box([side * (W - 0.05), 3.85, z], [0.14, 0.12, 1.9], C.deep, { collide: false });
        this.box([side * (W - 0.05), 4.6, z], [0.12, 1.4, 0.08], C.deep, { collide: false, outline: false });
      }
    }

    this.buildMezzanine();
    this.buildPlatform();
    this.buildKiln();
    this.buildRange();

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
      this.box([-9.2, h / 2, z0 + (k - 0.5) * run], [1.6, h, run], k % 2 ? C.wood : C.mid);
    }
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

  shelf(x, z, facing, w = 3.0) {
    const C = PALETTE;
    const depth = 0.6, levels = [0.45, 1.05, 1.65, 2.25];
    for (const s of [-1, 1]) this.box([x, 1.3, z + s * (w / 2)], [depth, 2.6, 0.06], C.dark);
    this.box([x - facing * 0.28, 1.3, z], [0.04, 2.6, w], C.deep, { collide: false });
    for (const y of levels) {
      this.box([x, y - 0.025, z], [depth, 0.05, w], C.wood);
      (this.shelves ||= []).push({ x, z, w, y, facing });
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
    const smalls = ['jar', 'vase', 'cup', 'bowl', 'pitcher'];
    const pot = (kind, x, y, z, scale = 1, extra = {}) =>
      B.spawn({ kind, pos: [x, y + 0.002, z], scale, color: pick(colors), ...extra });

    // shelves
    for (const s of this.shelves) {
      const n = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const zz = s.z - s.w / 2 + (s.w / n) * (i + 0.5) + rand(-0.1, 0.1);
        const kind = s.y < 1 ? pick([...smalls, 'amphora']) : pick(smalls);
        const scale = kind === 'amphora' ? 0.7 : rand(0.8, 1.1);
        pot(kind, s.x + rand(-0.05, 0.05), s.y, zz, scale);
      }
    }
    // benches
    const benchLoads = [
      ['jar', 'vase', 'bowl', 'pitcher', 'cup'],
      ['amphora', 'cup', 'jar', 'vase', 'cup'],
      ['jar', 'pitcher', 'cup', 'EMBER', 'bowl', 'vase', 'jar'],
      null,
    ];
    this.surfaces.forEach((s, i) => {
      const load = benchLoads[i];
      if (!load) return;
      load.forEach((kind, k) => {
        const x = s.x - s.w / 2 + (s.w / load.length) * (k + 0.5);
        const z = s.z + rand(-0.2, 0.2);
        if (kind === 'EMBER') B.spawn({ kind: 'ember', ember: true, pos: [x, s.y + 0.002, z], scale: 0.9 });
        else pot(kind, x, s.y, z, kind === 'amphora' ? 0.9 : rand(0.85, 1.15));
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
    // wheels
    for (const w of this.wheels) pot(pick(['jar', 'vase', 'amphora']), w.x, w.y, w.z, 0.9);
    // floor urns
    for (const [x, z] of [[-7.6, -13.6], [7.6, -13.8], [-5.2, 11.9], [4.9, 11.6], [2.6, -12.4], [-7.5, 8.5]]) {
      B.spawn({ kind: 'urn', pos: [x, 0.002, z], scale: rand(0.85, 1.05), color: pick([C.mid, C.wood, C.pot]) });
    }
    // little floor clusters
    for (const [cx, cz] of [[1.8, -7.6], [-6.4, -6.2], [6.3, 5.0], [-1.0, 5.4]]) {
      for (let i = 0; i < 3; i++) pot(pick(smalls), cx + rand(-0.45, 0.45), 0, cz + rand(-0.45, 0.45), rand(0.9, 1.2));
    }
    // mezzanine edge
    for (let z = -1.5; z < 14; z += 1.25) {
      if (Math.abs(z - 6.0) < 0.3) { B.spawn({ kind: 'ember', ember: true, pos: [-7.1, 2.602, z], scale: 0.9 }); continue; }
      pot(pick([...smalls, 'amphora', 'amphora']), -7.05 + rand(-0.1, 0.1), 2.6, z, rand(0.85, 1.1));
    }
    B.spawn({ kind: 'urn', pos: [-8.8, 2.602, 11.5], scale: 1 });
    B.spawn({ kind: 'urn', pos: [-8.8, 2.602, 1.5], scale: 0.9 });
    // right platform cluster around an ember urn
    B.spawn({ kind: 'ember', ember: true, pos: [8.2, 1.202, 10.2], scale: 1 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = rand(0.7, 1.4);
      pot(pick([...smalls, 'amphora']), 8.2 + Math.cos(a) * r, 1.2, 10.2 + Math.sin(a) * r * 1.6, rand(0.9, 1.2));
    }
    B.spawn({ kind: 'urn', pos: [9.0, 1.202, 13.4], scale: 0.95 });
    // floor ember near crates
    B.spawn({ kind: 'ember', ember: true, pos: [5.6, 0.002, 2.2], scale: 1.1 });
    // hanging pots
    for (const [x, z, len] of [[-3, -5, 1.6], [-1, -5, 2.2], [1, -5, 1.4], [3, -5, 2.0], [-2, 5, 1.8], [0, 5, 2.4], [2, 5, 1.5]]) {
      const kind = pick(['jar', 'pitcher', 'amphora', 'vase']);
      const scale = kind === 'amphora' ? 0.8 : 1;
      const anchor = [x, 5.42, z];
      const hgt = { jar: 0.38, pitcher: 0.4, amphora: 0.66, vase: 0.44 }[kind] * scale;
      B.spawn({ kind, scale, color: pick(colors), pos: [x, anchor[1] - len - hgt, z], hang: { anchor } });
    }
    // targets
    for (const t of this.targetDefs) B.spawn(t);

    // crates
    const crates = [[4.6, 3.6], [5.35, 3.6], [4.6, 4.35], [5.35, 4.35]];
    for (const [x, z] of crates) this.crate([x, 0.35, z], 0.7);
    this.crate([4.95, 1.05, 3.95], 0.7);
    for (const [x, z] of [[-6.2, -1], [-6.2, -0.25]]) this.crate([x, 0.35, z], 0.7);
    this.crate([-6.2, 1.05, -0.6], 0.7);
  }

  crate(pos, s) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), this.mat(PALETTE.wood));
    const band = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 0.14, s * 1.02), this.mat(PALETTE.dark));
    mesh.add(band);
    mesh.castShadow = mesh.receiveShadow = true;
    addOutline(mesh);
    this.dynProp(mesh, pos, RAPIER.ColliderDesc.cuboid(s / 2, s / 2, s / 2).setDensity(40));
  }

  brick(pos, size) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), this.mat(PALETTE.mid));
    mesh.castShadow = mesh.receiveShadow = true;
    addOutline(mesh);
    this.dynProp(mesh, pos, RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setDensity(600));
  }

  dynProp(mesh, pos, cd) {
    const body = this.physics.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(...pos).setSleeping(true).setAngularDamping(0.3));
    const col = this.physics.world.createCollider(cd.setFriction(0.8).setCollisionGroups(GROUPS.prop), body);
    mesh.position.set(...pos);
    this.scene.add(mesh);
    const ent = this.breakables.addDebris(body, mesh);
    ent.sync = this.physics.addSynced(body, mesh);
    this.physics.register(col, ent);
    this.dynamic.push(ent);
  }

  clearDynamic() {
    for (const e of this.dynamic) {
      this.physics.removeSynced(e.sync);
      this.physics.removeBody(e.body);
      this.scene.remove(e.mesh);
      this.breakables.debris.delete(e);
    }
    this.dynamic.length = 0;
    this.breakables.clear();
  }
}
