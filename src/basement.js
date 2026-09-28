import * as THREE from 'three';
import { PALETTE } from './config.js';

// ---------------------------------------------------------------------------
// The basement: a movement course under the workshop, Titanfall-flavoured.
// Drop in through the hole in the ground floor's south-east corner; the
// Lachryma geyser beside the landing fires you back up.
//
// Clockwise loop (all platforms 2.5 m, the floor under everything is safe):
//   stairs -> platform A -> WALLRUN over an 8 m gap -> platform B ->
//   GAP JUMPS west (2 / 3 / 4.5 m, the last one wants a double jump or a
//   slide-hop) -> platform C -> SLIDE RAMP -> SLIDE/CROUCH TUNNEL ->
//   MANTLE blocks (0.9 / 1.4 / 1.9 m) -> platform D -> ZIGZAG WALLRUN east
//   (outer wall, inner panels) -> back to the landing and the geyser.
// The floor has a 2 m grid for judging distances.
// ---------------------------------------------------------------------------

export const BASE_Y = -7;
export const HOLE = { x0: 4.5, x1: 9, z0: -15.5, z1: -12.4 }; // runs to the south wall

const glowMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });

function labelTexture(text, sub) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#fbe3cf';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 76px ui-monospace, Menlo, Consolas, monospace';
  g.fillText(text, 256, sub ? 58 : 80);
  if (sub) { g.font = '36px ui-monospace, Menlo, Consolas, monospace'; g.fillText(sub, 256, 126); }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/** Flat text on a surface. rotY turns it to face the approach direction. */
function label(scene, text, pos, { rotY = 0, width = 2.2, sub = null, opacity = 0.75, vertical = false } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 160 / 512),
    new THREE.MeshBasicMaterial({ map: labelTexture(text, sub), transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(...pos);
  // flat: text reads upright walking toward -z at rotY 0 (+x at -PI/2, -x at PI/2, +z at PI)
  m.rotation.order = 'YXZ';
  m.rotation.set(vertical ? 0 : -Math.PI / 2, rotY, 0);
  scene.add(m);
  return m;
}

function strip(scene, pos, size) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), glowMat);
  m.position.set(...pos);
  scene.add(m);
}

/** Static geometry: call from Level.build() before finalizeStatic(). */
export function buildBasement(L, W, D) {
  const C = PALETTE, B = BASE_Y, S = L.scene;
  const shell = { outline: false, shadow: false };
  // shell
  L.box([0, B - 0.25, 0], [W * 2 + 1, 0.5, D * 2 + 1], C.dark, { outline: false });
  const hh = -0.5 - B; // up to the underside of the ground floor
  L.box([-(W + 0.25), B + hh / 2, 0], [0.5, hh, D * 2 + 1], C.wall, shell);
  L.box([W + 0.25, B + hh / 2, 0], [0.5, hh, D * 2 + 1], C.wall, shell);
  L.box([0, B + hh / 2, -(D + 0.25)], [W * 2 + 1, hh, 0.5], C.wall, shell);
  L.box([0, B + hh / 2, D + 0.25], [W * 2 + 1, hh, 0.5], C.wall, shell);
  // 2 m measuring grid
  for (let z = -D + 1; z < D; z += 2) L.box([0, B + 0.005, z], [W * 2, 0.01, 0.05], C.deep, { outline: false, collide: false, shadow: false });
  for (let x = -W + 2; x < W; x += 2) L.box([x, B + 0.005, 0], [0.05, 0.01, D * 2], C.deep, { outline: false, collide: false, shadow: false });
  // columns holding the floor up (and something to look at)
  for (const [x, z] of [[-2, -5], [2, 3], [-2, 7], [1.5, -8.5]]) L.box([x, B + hh / 2, z], [0.5, hh, 0.5], C.deep, { shadow: false });

  const plat = (x0, x1, z0, z1, h = 2.5, color = C.mid) => L.box([(x0 + x1) / 2, B + h / 2, (z0 + z1) / 2], [x1 - x0, h, z1 - z0], color);

  // 1. stairs up to platform A (visual steps, ramp collider)
  for (let k = 1; k <= 10; k++) L.box([8, B + (k * 0.25) / 2, -11.5 + (k - 0.5) * 0.5], [3, k * 0.25, 0.5], k % 2 ? C.wood : C.mid, { collide: false });
  L.rampCollider(8, 3, -11.5, B, -6.5, B + 2.5);
  plat(5.5, 9.6, -6.5, -0.5);
  label(S, 'STAIRS', [8, B + 0.02, -12.3], { rotY: Math.PI, width: 1.8 });

  // 2. wallrun over the gap to platform B: the outer wall on the right, a panel on the left
  L.box([5.35, B + 3.5, 3.5], [0.3, 5, 7], C.wood);
  strip(S, [5.515, B + 3.3, 3.5], [0.02, 0.1, 7]);
  strip(S, [9.985, B + 3.3, 3.5], [0.02, 0.1, 8]);
  label(S, 'WALLRUN', [7.55, B + 2.52, -1.3], { rotY: Math.PI, width: 2.4, sub: 'jump, hold W along a wall' });
  plat(5.5, 9.6, 7.5, 14.6);

  // 3. gap jumps west: 2 m, 3 m, 4.5 m
  plat(2.3, 3.5, 10.6, 12.6);
  plat(-1.9, -0.7, 10.6, 12.6);
  plat(-9.6, -6.4, 8.5, 14.6);
  label(S, '2 m', [6.3, B + 2.52, 11.6], { rotY: Math.PI / 2, width: 1.2 });
  label(S, '3 m', [2.9, B + 2.52, 11.6], { rotY: Math.PI / 2, width: 1.1 });
  label(S, '4.5 m', [-1.3, B + 2.52, 11.6], { rotY: Math.PI / 2, width: 1.1, sub: 'double jump' });

  // 4. slide ramp off platform C, into a low tunnel
  {
    const top = 2.5, len = 6, th = 0.3;
    const ang = Math.atan2(top, len);
    const nrm = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
    const c = new THREE.Vector3(-8, B + top / 2, 8.5 - len / 2).addScaledVector(nrm, -th / 2);
    L.box([c.x, c.y, c.z], [3.2, th, Math.hypot(top, len) + 0.1], C.wood, { rotX: -ang });
    // fill underneath (no crawlspace to get stuck in)
    for (let z = 8.5 - len; z < 8.5 - 0.01; z += 0.5) {
      const h = ((z - (8.5 - len)) / len) * top - 0.05;
      if (h > 0.05) L.box([-8, B + h / 2, z + 0.25], [3.2, h, 0.5], C.mid, { outline: false });
    }
  }
  label(S, 'SLIDE', [-8, B + 2.52, 9.3], { rotY: 0, width: 1.8, sub: 'hold C down the ramp' });
  // tunnel: 1.2 m clearance (standing is 1.7, crouched 1.1)
  L.box([-8, B + 1.85, 0], [3.2, 1.3, 3], C.dark);
  L.box([-6.25, B + 1.25, 0], [0.3, 2.5, 3], C.mid);
  strip(S, [-8, B + 1.19, 1.49], [3.2, 0.06, 0.02]);

  // 5. mantle blocks
  for (const [z, h] of [[-3.9, 0.9], [-6.4, 1.4], [-8.9, 1.9]]) {
    L.box([-8, B + h / 2, z], [3.2, h, 0.8], C.mid);
    label(S, `${h} m`, [-8, B + 0.02, z + 1.0], { rotY: 0, width: 1.1 });
  }
  label(S, 'MANTLE', [-8, B + 0.02, -2.2], { rotY: 0, width: 1.8, sub: 'jump into a ledge, hold W' });
  plat(-9.6, -6.4, -14.6, -10.5);

  // 6. zigzag wallrun east: outer south wall and two inner panels
  for (const [x0, x1] of [[-3.5, 0.5], [2.3, 4.3]]) {
    L.box([(x0 + x1) / 2, B + 3.4, -10.35], [x1 - x0, 5.2, 0.3], C.wood);
    strip(S, [(x0 + x1) / 2, B + 3.3, -10.51], [x1 - x0, 0.1, 0.02]);
  }
  strip(S, [-3.5, B + 3.3, -14.985], [5, 0.1, 0.02]);
  strip(S, [2.2, B + 3.3, -14.985], [4, 0.1, 0.02]);
  label(S, 'ZIGZAG', [-7.4, B + 2.52, -12.6], { rotY: -Math.PI / 2, width: 2, sub: 'wallrun, wall jump across' });

  // a free-standing wall in the open middle, for wallrun / wall-jump practice
  L.box([-1.5, B + 2.75, 1], [0.3, 5.5, 6], C.wood);
  strip(S, [-1.34, B + 3.3, 1], [0.02, 0.1, 6]);
  strip(S, [-1.66, B + 3.3, 1], [0.02, 0.1, 6]);

  // lights (few: every light costs every lit pixel in the building)
  for (const p of [[6, B + 5.2, -6], [-6, B + 5.2, 5]]) {
    const l = new THREE.PointLight(0xffa066, 22, 22, 1.2);
    l.position.set(...p);
    S.add(l);
  }

  // the way down: glowing edge around the hole, and a sign
  const { x0, x1, z0, z1 } = HOLE;
  strip(S, [(x0 + x1) / 2, 0.012, z1 + 0.05], [x1 - x0, 0.02, 0.08]);
  strip(S, [x0 - 0.05, 0.012, (-D + z1) / 2], [0.08, 0.02, z1 + D]);
  strip(S, [x1 + 0.05, 0.012, (-D + z1) / 2], [0.08, 0.02, z1 + D]);
  label(S, 'BASEMENT', [(x0 + x1) / 2, 0.015, z1 + 0.75], { rotY: 0, width: 2.2, sub: 'movement course: drop in' });
}

/** Ground-floor slab with the hole cut out (replaces the single floor box). */
export function groundFloor(L, W, D, color) {
  const { x0, x1, z0, z1 } = HOLE;
  const y = -0.25, t = 0.5, X0 = -W - 0.5, X1 = W + 0.5, Z0 = -D - 0.5, Z1 = D + 0.5;
  const slab = (a, b, c, d) => L.box([(a + b) / 2, y, (c + d) / 2], [b - a, t, d - c], color, { outline: false });
  slab(X0, x0, Z0, Z1);
  slab(x1, X1, Z0, Z1);
  slab(x0, x1, z1, Z1);
  if (z0 > Z0) slab(x0, x1, Z0, z0);
}

export const inHole = (x, z, pad = 0) => x > HOLE.x0 - pad && x < HOLE.x1 + pad && z > HOLE.z0 - pad && z < HOLE.z1 + pad;

/** Breakable targets around the course (they come back after a while). */
export function spawnBasement(Bk) {
  const B = BASE_Y, C = PALETTE;
  const spots = [[9.1, 2.5, -1.1], [9.1, 2.5, 14.1], [-9.1, 2.5, 14.1], [-9.1, 2.5, -14.1], [-9.2, 1.9, -8.9], [3.5, 0, 5.5], [-4.5, 0, -6], [0, 0, 12.5]];
  const kinds = ['jar', 'amphora', 'pitcher', 'melon', 'spindle'];
  spots.forEach(([x, h, z], i) => Bk.spawn({ kind: kinds[i % kinds.length], pos: [x, B + h + 0.002, z], color: i % 2 ? C.potLight : C.pot, respawn: 8 }));
}
