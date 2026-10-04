import * as THREE from 'three';
import { PALETTE } from '../../core/config.js';
import { BASE_Y, label, strip } from './basement.js';
import { ARCHES } from './techwing.js';
import { gearGeometry, BRASS, STONE } from '../props/movers.js';
import { addOutline } from '../../render/outline.js';

// ---------------------------------------------------------------------------
// The clockwork mill: a wing of THE MOVEMENT LAB east of the tech lab (through its east
// arch), and the kiln stack beyond it. Everything that moves is a Mover
// (src/world/props/movers.js): riders are carried, and keep the platform's speed when they leave it.
//
//   COG WALK    x 41..62    a chasm crossed on four meshing cogs (each carries you round)
//   MILLSTONE   x 67..77    a stone wheel, raised 0.6 m, that turns under your feet
//   BELTS       z -45..-38  conveyors with and against you, and gates that lift and drop
//   LIFTS       x 63..70    two freight lifts up to a 10 m gantry along the south wall
//   SHUTTLE     x 78..92    a 14 m gap in the gantry, crossed on a shuttle (jump off it fast)
//   FERRIS      x 83.5..92  a wheel of gondolas: board low, ride up, hop onto the deck
//   STEAM       x 39..47    an updraft column up to a 9 m ledge
//   KILN STACK  x 101..131  a 57 m well with rail carts at the bottom, a freight lift and a ladder
// ---------------------------------------------------------------------------

export const MILL = { x0: 36.5, x1: 101, z0: -72, z1: -36.5 };
export const KILN = { x0: 101.5, x1: 131, z0: -72, z1: -36.5 };
export const CHASM = { x0: 41, x1: 62, z0: -63, z1: -45, bottom: -4 };
export const STACK = { x0: 107, x1: 125, z0: -68, z1: -46, bottom: -57 };
const H = 13.5, Wt = 0.5;

// checkpoints: feet relative to the basement floor, facing yaw, trigger zone
export const MILL_CPS = [
  { room: 'M1', name: 'cog walk', pos: [38.5, 0, -54], yaw: Math.PI / 2, zone: [37, 41, -58, -50] },
  { room: 'M2', name: 'millstone · belts', pos: [64, 0, -42], yaw: Math.PI / 2, zone: [62, 66, -45, -38] },
  { room: 'M3', name: 'lifts · gantry', pos: [65, 0, -62], yaw: Math.PI, zone: [62, 71, -64, -60] },
  { room: 'M4', name: 'ferris wheel', pos: [88, 0, -45.5], yaw: Math.PI, zone: [84, 92, -47.5, -44] },
  { room: 'M5', name: 'steam', pos: [50, 0, -66], yaw: Math.PI, zone: [48, 53, -70, -62] },
  { room: 'K1', name: 'kiln stack · brink', pos: [104, 0, -57], yaw: Math.PI / 2, zone: [102, 106, -66, -48] },
  { room: 'K2', name: 'kiln stack · floor', pos: [110, STACK.bottom, -66], yaw: Math.PI / 2, zone: [107.5, 113, -67.5, -64.5] },
];
// reset floors: rectangle -> index into MILL_CPS, and the height (relative to the basement floor) to fall below
export const MILL_PITS = [[[CHASM.x0, CHASM.x1, CHASM.z0, CHASM.z1], 0, CHASM.bottom + 1.2]];

/** Angle (in the XZ plane's convention: direction (cos g, 0, -sin g)) from a to b. */
const dirAngle = (a, b) => Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
const mod1 = (v) => ((v % 1) + 1) % 1;

/**
 * Phase for gear j so its teeth mesh with gear i (whose phase is known): i has some tooth
 * offset toward j; j needs the gap there. (Turn them opposite ways, w_j = -w_i n_i / n_j.)
 */
export function meshPhase(alpha, phaseI, nI, nJ) {
  const pI = (Math.PI * 2) / nI, pJ = (Math.PI * 2) / nJ;
  const dI = mod1((alpha - phaseI) / pI); // 0 = a tooth points at j
  // (seen from the contact point the two gears' tooth offsets mirror each other: j needs the
  // half-pitch complement)
  return alpha + Math.PI - mod1(0.5 - dI) * pJ;
}

export function buildMill(L, env) {
  const C = PALETTE, S = L.scene, B = BASE_Y, M = env.movers;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([(x0 + x1) / 2, B + (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const solid = { outline: false, shadow: false };
  const cy = (y) => B + y;

  // floor with holes, row by row along z
  const floor = (R, holes) => {
    const zs = [...new Set([R.z0 - 0.5, R.z1, ...holes.flatMap((h) => [h.z0, h.z1])])].sort((a, b) => a - b);
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], zm = (za + zb) / 2;
      const cuts = holes.filter((h) => zm > h.z0 && zm < h.z1).sort((a, b) => a.x0 - b.x0);
      let xa = R.x0 - 0.5;
      for (const h of cuts) { if (h.x0 > xa) blk(xa, h.x0, -0.5, 0, za, zb, C.dark, { outline: false }); xa = h.x1; }
      if (R.x1 + 0.5 > xa) blk(xa, R.x1 + 0.5, -0.5, 0, za, zb, C.dark, { outline: false });
    }
  };
  // a room shell: walls (the west one with an optional door), ceiling, lights
  const shell = (R, { doorWest = null, doorEast = null, lights = [] } = {}) => {
    blk(R.x0 - 0.5, R.x1 + 0.5, H, H + 0.5, R.z0 - 0.5, R.z1, C.deep, solid);
    blk(R.x0 - 0.5, R.x1 + 0.5, 0, H, R.z0 - Wt, R.z0, C.wall, solid);
    blk(R.x0 - 0.5, R.x1 + 0.5, 0, H, R.z1, R.z1 + Wt, C.wall, solid);
    const sideWall = (x, door) => {
      if (!door) { blk(x, x + Wt, 0, H, R.z0 - 0.5, R.z1, C.wall, solid); return; }
      const [d0, d1, dh] = door;
      blk(x, x + Wt, 0, H, R.z0 - 0.5, d0, C.wall, solid);
      blk(x, x + Wt, 0, H, d1, R.z1, C.wall, solid);
      blk(x, x + Wt, dh, H, d0, d1, C.wall, solid);
    };
    if (doorWest !== false) sideWall(R.x0 - Wt, doorWest); // (false: the wall is the next wing's)
    sideWall(R.x1, doorEast);
    for (const p of lights) {
      const l = new THREE.PointLight(0xffa066, p[3] ?? 30, 42, 1.1);
      l.position.set(p[0], B + p[1], p[2]);
      S.add(l);
    }
  };

  // ============================== the mill hall ==============================
  floor(MILL, [CHASM]);
  shell(MILL, { doorWest: false, doorEast: ARCHES.kiln, lights: [[48, 9, -54], [72, 9, -54], [92, 9, -54], [72, 9, -42, 24]] });
  label(S, 'CLOCKWORK MILL', [40, B + 0.02, -43], { rotY: -Math.PI / 2, width: 3.2, sub: 'moving ground · you keep its speed' });

  // ---- COG WALK: a chasm, four meshing cogs ----
  {
    const P = CHASM;
    blk(P.x0, P.x1, P.bottom - 0.5, P.bottom, P.z0, P.z1, C.outline, { outline: false });
    blk(P.x0 - 0.5, P.x0 + 0.01, P.bottom, -0.02, P.z0, P.z1, C.dark, solid);
    blk(P.x1 - 0.01, P.x1 + 0.5, P.bottom, -0.02, P.z0, P.z1, C.dark, solid);
    blk(P.x0, P.x1, P.bottom, -0.02, P.z0 - 0.5, P.z0 + 0.01, C.dark, solid);
    blk(P.x0, P.x1, P.bottom, -0.02, P.z1 - 0.01, P.z1 + 0.5, C.dark, solid);
    // (the chasm's floor is a reset floor: a dark skin, like the ring's)
    strip(S, [(P.x0 + P.x1) / 2, B + 0.01, P.z1 + 0.04], [P.x1 - P.x0, 0.02, 0.08]);
    strip(S, [(P.x0 + P.x1) / 2, B + 0.01, P.z0 - 0.04], [P.x1 - P.x0, 0.02, 0.08]);
    const R = 2.5, n = 12, y = -0.2;
    const centres = [43.9, 48.9, 53.9, 58.9].map((x) => [x, -54]);
    let phase = 0, w = 0.55;
    centres.forEach((c, i) => {
      if (i > 0) phase = meshPhase(dirAngle(centres[i - 1], c), phase, n, n);
      const col = i % 2 ? BRASS : C.mid;
      const cog = M.cog({ pos: [c[0], cy(y), c[1]], R, w, phase, name: `cog${i}` });
      cog.mesh(gearGeometry({ R, teeth: n, tooth: 0.32, thick: 0.4 }), col);
      cog.cylinder(R - 0.05, 0.4, col, [0, 0, 0], { visual: false });
      cog.mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.16, 12), C.dark, [0, 0.24, 0]);
      // spokes painted on the face so the turning reads
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        cog.mesh(new THREE.BoxGeometry(1.6, 0.03, 0.14), C.dark, [Math.cos(a) * 1.45, 0.205, -Math.sin(a) * 1.45], { outline: false, rot: [0, a, 0] });
      }
      w = -w;
    });
    label(S, 'COG WALK', [39.4, B + 0.02, -49], { rotY: -Math.PI / 2, width: 1.9, sub: 'each cog carries you round' });
  }

  // ---- MILLSTONE: a stone wheel raised 0.6 m, turning ----
  {
    const stone = M.cog({ pos: [72, cy(0.3), -54], R: 5, w: 0.4, name: 'millstone' });
    stone.cylinder(5, 0.6, STONE, [0, 0, 0], { segs: 36 });
    // furrows (a millstone is dressed with them), and a runner ring
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      stone.mesh(new THREE.BoxGeometry(4.4, 0.03, 0.12), C.dark, [Math.cos(a) * 2.6, 0.305, -Math.sin(a) * 2.6], { outline: false, rot: [0, a, 0] });
    }
    stone.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), C.dark, [0, 0.33, 0]);
    // the shaft through the middle (static: it only turns the visual)
    blk(71.65, 72.35, 0.6, H, -54.35, -53.65, C.wood);
    label(S, 'MILLSTONE', [72, B + 0.63, -49.3], { rotY: Math.PI, width: 2, vertical: false, sub: 'it turns under you' });
  }

  // ---- BELTS and GATES along the north wall ----
  {
    const belts = [[62, 72, 3], [72, 82, -3], [82, 92, 3]];
    for (const [x0, x1, v] of belts) {
      // (flush with the floor: the controller only steps onto fixed ground, so a lip on a mover would stop you)
      const b = M.belt({ pos: [(x0 + x1) / 2, cy(-0.049), -41.5], vel: [v, 0, 0], size: [x1 - x0, 0.1, 7] });
      b.build(C.dark, v > 0 ? C.glow : C.pale);
    }
    // gates: a wall that lifts and drops, staggered
    [[78, 0], [88, 2.0], [96, 4.0]].forEach(([x, off], i) => {
      const g = M.shuttle({ pos: [x, cy(1.7), -41.5], to: [0, 3.5, 0], move: 0.7, dwell: 1.6, offset: off, name: `gate${i}` });
      g.box([0.5, 3.4, 7], C.pot, [0, 0, 0]);
      g.mesh(new THREE.BoxGeometry(0.56, 0.18, 7.06), C.glow, [0, 1.7, 0], { outline: false });
    });
    label(S, 'BELTS · GATES', [66, B + 0.1, -46.4], { rotY: -Math.PI / 2, width: 2.2, sub: 'with, against, and time the gates' });
  }

  // ---- LIFTS up to the gantry ----
  {
    const gy = 10; // gantry walking height
    // gantry along the south wall, with the shuttle gap
    blk(62, 78, gy - 0.4, gy, -72, -69, C.wood);
    blk(92, 98, gy - 0.4, gy, -72, -69, C.wood);
    blk(94, 98, 0, gy - 0.4, -72, -69, C.dark); // the east end stands on a pillar (a ladder down its face)
    blk(62, 78, gy, gy + 1.0, -69.06, -69, C.dark, { collide: false, outline: false }); // (a low rail, visual only)
    blk(92, 98, gy, gy + 1.0, -69.06, -69, C.dark, { collide: false, outline: false });
    env.ladders.add({ x: 96, z: -69, y0: B, y1: B + gy, n: new THREE.Vector3(0, 0, 1) });
    // two lifts (offset so one is always coming), guide posts at the corners
    [[64.5, 0], [68.5, 3.4]].forEach(([x, off], i) => {
      const lift = M.shuttle({ pos: [x, cy(-0.2), -67.5], to: [0, gy, 0], move: 4.5, dwell: 2.2, offset: off, name: `lift${i}` });
      lift.box([3, 0.4, 3], C.pot, [0, 0, 0]);
      lift.mesh(new THREE.BoxGeometry(3.06, 0.1, 3.06), C.glow, [0, 0.16, 0], { outline: false });
      for (const sx of [-1, 1]) blk(x + sx * 1.65 - 0.1, x + sx * 1.65 + 0.1, 0, gy + 3, -69, -66, C.dark, { outline: false });
    });
    blk(62.6, 70.4, gy + 3, gy + 3.3, -69, -66, C.dark, { outline: false });
    label(S, 'LIFTS', [66.5, B + 0.02, -63.4], { rotY: Math.PI, width: 1.6, sub: 'up to the gantry · 10 m' });
    label(S, 'GANTRY', [70, B + gy + 0.02, -70.5], { rotY: Math.PI, width: 1.6, sub: 'the gap: ride the shuttle, jump off fast' });
    // the shuttle across the gap
    const sh = M.shuttle({ pos: [79.5, cy(gy - 0.2), -70.5], to: [11, 0, 0], move: 5, dwell: 1.8, name: 'shuttle' });
    sh.box([3, 0.4, 3], C.pot, [0, 0, 0]);
    sh.mesh(new THREE.BoxGeometry(3.06, 0.1, 3.06), C.glow, [0, 0.16, 0], { outline: false });
    // a rail beneath the gap
    blk(78, 92, gy - 1.0, gy - 0.8, -71.2, -70.8, C.dark, { collide: false, outline: false });
    blk(78, 92, gy - 1.0, gy - 0.8, -70.2, -69.8, C.dark, { collide: false, outline: false });
  }

  // ---- FERRIS WHEEL: board low, ride up, hop onto the deck ----
  {
    const hub = [88, 6.5, -55], R = 4.5, N = 6, w = 0.3;
    const g = new THREE.Group();
    g.position.set(hub[0], cy(hub[1]), hub[2]);
    S.add(g);
    for (const z of [-1.7, 1.7]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.14, 6, 40), M.mat(C.wood));
      rim.position.z = z; g.add(rim); addOutline(rim);
      for (let k = 0; k < 6; k++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(R * 2, 0.18, 0.18), M.mat(C.mid));
        sp.position.z = z; sp.rotation.z = (k / 6) * Math.PI; g.add(sp);
      }
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.8, 10), M.mat(BRASS));
    axle.rotation.x = Math.PI / 2; g.add(axle); addOutline(axle);
    M.spinner(g, new THREE.Vector3(0, 0, 1), w, 0);
    // the supports: an A-frame each side
    for (const z of [-2.4, 2.4]) {
      blk(hub[0] - 0.3, hub[0] + 0.3, 0, hub[1], hub[2] + z - 0.15, hub[2] + z + 0.15, C.dark, { outline: false });
    }
    for (let i = 0; i < N; i++) {
      const gd = M.orbiter({ center: [hub[0], cy(hub[1]), hub[2]], r: R, w, a0: -Math.PI / 2 + (i / N) * Math.PI * 2, name: `gondola${i}` });
      gd.box([2.4, 0.3, 2.6], C.pot, [0, 0, 0]);
      gd.mesh(new THREE.BoxGeometry(2.46, 0.08, 2.66), C.glow, [0, 0.14, 0], { outline: false });
      // hangers to the rim (visual)
      for (const z of [-1.2, 1.2]) gd.mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08), C.dark, [0, 0.8, z], { outline: false });
      gd.mesh(new THREE.BoxGeometry(0.1, 0.1, 2.6), BRASS, [0, 1.45, 0], { outline: false });
    }
    // deck on a tower (west of the wheel), ladder down its face
    blk(77.5, 81.9, 0, 10.6, -57, -53, C.pot);
    env.ladders.add({ x: 77.5, z: -55, y0: B, y1: B + 10.6, n: new THREE.Vector3(-1, 0, 0) });
    label(S, 'FERRIS WHEEL', [88, B + 0.02, -48.8], { rotY: Math.PI, width: 2.2, sub: 'board low · deck at the top' });
    label(S, 'DECK', [79.7, B + 10.62, -56.4], { rotY: Math.PI, width: 1, sub: 'hop off here' });
  }

  // ---- STEAM: an updraft column to a ledge ----
  {
    blk(37, 42, 0, 9, -72, -66, C.pot);
    env.ladders.add({ x: 42, z: -69, y0: B, y1: B + 9, n: new THREE.Vector3(1, 0, 0) });
    M.updraft({ x: 47.2, z: -69, r: 1.5, y0: B + 0.05, y1: B + 11, speed: 9, accel: 30 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 6, 24), new THREE.MeshBasicMaterial({ color: C.glow }));
    ring.rotation.x = Math.PI / 2; ring.position.set(47.2, B + 0.06, -69); S.add(ring);
    blk(46, 48.4, 0, 0.3, -70.2, -67.8, C.dark, { outline: false, collide: false });
    label(S, 'STEAM', [47.2, B + 0.02, -65.6], { rotY: Math.PI, width: 1.5, sub: 'ride the updraft to the ledge' });
  }

  // ---- decoration: wall gears, an overhead line shaft, the hopper ----
  {
    const geo = (o) => gearGeometry(o);
    const wallGear = (pos, R, n, w, phase, color, thick = 0.35) => {
      const m = new THREE.Mesh(geo({ R, teeth: n, tooth: Math.min(0.5, R * 0.14), thick, hole: R * 0.14, windows: R > 2 ? 6 : 0 }), M.mat(color));
      m.position.set(pos[0], cy(pos[1]), pos[2]);
      m.rotation.x = Math.PI / 2;
      m.castShadow = true;
      S.add(m); addOutline(m);
      M.spinner(m, new THREE.Vector3(0, 1, 0), w, phase);
      return m;
    };
    // a train on the south wall and a pair on the north wall: sized for one tooth pitch (R = n / 6),
    // set exactly a radius sum apart along the given directions, phased to mesh
    const trainOn = (start, links, z, w0, colors) => {
      let pos = [...start], n0 = links[0][0], phase = 0, w = w0;
      wallGear([pos[0], pos[1], z], n0 / 6, n0, w, phase, colors[0]);
      for (let i = 1; i < links.length; i++) {
        const [n, deg] = links[i], phi = (deg * Math.PI) / 180;
        const dist = links[i - 1][0] / 6 + n / 6;
        pos = [pos[0] + Math.cos(phi) * dist, pos[1] + Math.sin(phi) * dist];
        phase = meshPhase(phi, phase, links[i - 1][0], n);
        w = (-w * links[i - 1][0]) / n;
        wallGear([pos[0], pos[1], z], n / 6, n, w, phase, colors[i % colors.length]);
      }
    };
    trainOn([45, 9.2], [[20], [14, -12], [18, 8]], -71.6, 0.28, [C.mid, BRASS, C.wood]);
    trainOn([84, 8.6], [[18], [11, 12]], -36.8, 0.22, [C.wood, BRASS]);
    // overhead line shaft with pulleys (spins about x)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 56, 10), M.mat(BRASS));
    shaft.rotation.z = Math.PI / 2; shaft.position.set(68, cy(12.5), -40); S.add(shaft); addOutline(shaft);
    M.spinner(shaft, new THREE.Vector3(0, 1, 0), 1.6, 0);
    for (let x = 48; x < 96; x += 8) {
      const pu = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 14), M.mat(C.wood));
      pu.rotation.z = Math.PI / 2; pu.position.set(x, cy(12.5), -40); S.add(pu); addOutline(pu);
      M.spinner(pu, new THREE.Vector3(0, 1, 0), 1.6, 0);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 8.6, 0.05), M.mat(C.dark));
      belt.position.set(x, cy(8.2), -40); S.add(belt); // a belt down to the (static) machines
    }
    // the hopper above the millstone
    const hop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 0.5, 2, 4), M.mat(C.wood));
    hop.position.set(72, cy(12.2), -54); hop.rotation.y = Math.PI / 4; S.add(hop); addOutline(hop);
  }

  // ============================== the kiln stack ==============================
  {
    const K = KILN, P = STACK;
    floor(K, [P]);
    shell(K, { doorWest: false, lights: [[116, 9, -57, 40], [111, -10, -57, 70], [111, -30, -57, 80], [111, -50, -57, 90]] });
    // the well: walls from the bottom up, a parapet on three sides, a brink to the west
    blk(P.x0 - 0.5, P.x0 + 0.01, P.bottom, -0.02, P.z0 - 0.5, P.z1 + 0.5, C.dark, { outline: false });
    blk(P.x1 - 0.01, P.x1 + 0.5, P.bottom, -0.02, P.z0 - 0.5, P.z1 + 0.5, C.dark, { outline: false });
    blk(P.x0, P.x1, P.bottom, -0.02, P.z0 - 0.5, P.z0 + 0.01, C.dark, { outline: false });
    blk(P.x0, P.x1, P.bottom, -0.02, P.z1 - 0.01, P.z1 + 0.5, C.dark, { outline: false });
    blk(P.x0 - 0.5, P.x1 + 0.5, P.bottom - 1, P.bottom, P.z0 - 0.5, P.z1 + 0.5, C.outline, { outline: false });
    // parapets (1.1 m) north, south and east (the lift landing at z -52..-49 stays open)
    blk(P.x0, P.x1, 0, 1.1, P.z1, P.z1 + 0.3, C.pot);
    blk(P.x0, P.x1, 0, 1.1, P.z0 - 0.3, P.z0, C.pot);
    blk(P.x1, P.x1 + 0.3, 0, 1.1, P.z0, -52, C.pot);
    blk(P.x1, P.x1 + 0.3, 0, 1.1, -49, P.z1, C.pot);
    // the west edge: a glowing brink line
    strip(S, [P.x0 - 0.04, B + 0.012, (P.z0 + P.z1) / 2], [0.08, 0.02, P.z1 - P.z0]);
    // depth markers on the west wall: a glow line and a label every 10 m
    for (let d = 10; d <= 50; d += 10) {
      // (glow bands on all four walls: the well is dark, this is what shows how deep you are)
      strip(S, [P.x1 - 0.02, B - d, (P.z0 + P.z1) / 2], [0.04, 0.08, P.z1 - P.z0 - 0.6]);
      strip(S, [(P.x0 + P.x1) / 2, B - d, P.z0 + 0.02], [P.x1 - P.x0 - 0.6, 0.08, 0.04]);
      strip(S, [(P.x0 + P.x1) / 2, B - d, P.z1 - 0.02], [P.x1 - P.x0 - 0.6, 0.08, 0.04]);
      strip(S, [P.x0 + 0.02, B - d, (P.z0 + P.z1) / 2], [0.04, 0.08, P.z1 - P.z0 - 0.6]);
      label(S, `${d} m`, [P.x0 + 0.03, B - d + 0.55, -62], { rotY: Math.PI / 2, width: 1.6, vertical: true });
      label(S, `${d} m`, [P.x0 + 0.03, B - d + 0.55, -52], { rotY: Math.PI / 2, width: 1.6, vertical: true });
    }
    label(S, 'KILN STACK', [104, B + 0.02, -66], { rotY: -Math.PI / 2, width: 2.6, sub: '57 m · slam onto the carts below' });
    label(S, 'BRINK', [104, B + 0.02, -57], { rotY: -Math.PI / 2, width: 1.4, sub: 'look down, C' });
    // the ladder on the west wall, floor to brink
    env.ladders.add({ x: P.x0, z: -64, y0: B + P.bottom, y1: B, n: new THREE.Vector3(1, 0, 0) });
    // rails and the two carts at the bottom
    for (const z of [-62, -56]) {
      blk(P.x0 + 1, P.x1 - 1, P.bottom, P.bottom + 0.06, z - 0.9, z - 0.78, C.deep, { collide: false, outline: false });
      blk(P.x0 + 1, P.x1 - 1, P.bottom, P.bottom + 0.06, z + 0.78, z + 0.9, C.deep, { collide: false, outline: false });
    }
    const y = B + P.bottom + 0.5;
    M.cart({ id: 'cart-a', pos: [110, y, -62], to: [12, 0, 0], move: 5.5, dwell: 0.8, size: [3, 0.5, 3] });
    M.cart({ id: 'cart-b', pos: [122, y, -56], to: [-12, 0, 0], move: 5.5, dwell: 0.8, size: [3, 0.5, 3] });
    // the freight lift up the east wall
    const lift = M.shuttle({ pos: [123.5, B + P.bottom - 0.2, -50.5], to: [0, -P.bottom, 0], move: 22, dwell: 5, name: 'freight' });
    lift.box([3, 0.4, 3], C.pot, [0, 0, 0]);
    lift.mesh(new THREE.BoxGeometry(3.06, 0.1, 3.06), C.glow, [0, 0.16, 0], { outline: false });
    blk(P.x1 - 0.2, P.x1, P.bottom, -0.02, -52.1, -51.9, C.dark, { outline: false, collide: false });
    blk(P.x1 - 0.2, P.x1, P.bottom, -0.02, -49.1, -48.9, C.dark, { outline: false, collide: false });
    label(S, 'FREIGHT LIFT', [128, B + 0.02, -50.5], { rotY: Math.PI / 2, width: 2.2, sub: 'the slow way up' });
    for (const z of [-62, -56]) strip(S, [116, B + P.bottom + 0.03, z], [P.x1 - P.x0 - 2, 0.02, 0.05]);
    label(S, 'CARTS', [116, B + P.bottom + 0.06, -59], { rotY: -Math.PI / 2, width: 1.6, sub: 'a moving target: land on one' });
  }
  env.ladders.build(L, 0.3);
}
