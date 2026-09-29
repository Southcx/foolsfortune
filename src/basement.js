import * as THREE from 'three';
import { PALETTE, T } from './config.js';
import { sfx } from './audio.js';
import { TECH_CPS, TECH_PITS } from './techlab.js';

// ---------------------------------------------------------------------------
// The basement: a movement lab under the workshop, hub-and-spoke.
//
//   HUB (40 x 40 m, under the building): the metrics gym. Fixed, labelled
//   references every future space is measured against: a step/mantle ladder,
//   clearance gates, slope ramps, a long-jump lane with the measured chain
//   distances marked, a metrics board, and the index: eight pads that teleport
//   to each room's checkpoint. Drop in through the hole in the ground floor's
//   south-east corner; the geyser beside the landing fires you back up.
//
//   RING (16 m wide, around the hub): eight rooms in a loop, one movement
//   skill each, a checkpoint at every entrance and split times between them.
//     1 S   run, slide, hop       floor: slots (1.5 m) and hurdles, speed gates
//     2 SE  mantle                blocks 1.4 / 2.4 / 3.0 m up to the platforms
//     3 E   gaps                  3.5 m sprint jump, 5.5 m double, 7.5 m jump + dash
//     4 NE  wallrun + wall jump   wall, a pillar in the way, a panel across
//     5 N   zigzag                wallrun / wall jump between staggered panels
//     6 NW  climb                 2.8 m (jump + mantle), 3.4 m (double + mantle)
//     7 W   speed                 slide ramp to top speed, 7 m gap
//     8 SW  low                   slide chute, 1.5 m tunnel, back to 1
//   Rooms 3-7 are over a reset floor: touch it and you're back at the room's
//   checkpoint. R respawns at the last checkpoint, H returns to the hub.
//
// Distances are sized at ~85% of what the controller measured at default
// tuning (see RUBRIC), so a clean human input makes them.
// ---------------------------------------------------------------------------

export const BASE_Y = -14;
export const HOLE = { x0: 4.5, x1: 9, z0: -15.5, z1: -12.4 }; // ground-floor hole, runs to the south wall
const HUB = 20, OUT = 36, P = 3; // hub half-size, outer half-size, platform height
const Wt = 0.5; // wall thickness

// measured at default tuning (takeoff to landing at the same height, metres)
export const RUBRIC = [
  // (re-measured in round 10 with the test teleport placing the body at the feet: the first
  // numbers started every test from 0.85 m up and read ~2% long)
  ['walk jump', 2.45], ['sprint jump', 4.0], ['slide-hop', 5.3], ['sprint + double jump', 6.7],
  ['max-speed jump', 7.9], ['slide-hop + double', 8.5], ['sprint jump + dash', 9.1],
  ['sprint + dash + double', 12.9], ['slide-hop + dash + double', 13.7], ['max speed + dash + double', 15.2],
];

// room checkpoints (feet position relative to the basement floor, facing yaw) in loop order;
// `zone` (x0, x1, z0, z1) is the trigger: the whole entrance, so any line through it counts
const CHECKPOINTS = [
  { room: 1, name: 'run / slide / hop', pos: [-17, 0, -30], yaw: Math.PI / 2, zone: [-20, -16.5, -36, -20] },
  { room: 2, name: 'mantle', pos: [22.5, 0, -28], yaw: Math.PI / 2, zone: [20.3, 23.5, -36, -20] },
  { room: 3, name: 'gaps', pos: [30, P, -18], yaw: 0, zone: [26, 34, -20, -17] },
  { room: 4, name: 'wallrun + wall jump', pos: [35.2, P, 21.3], yaw: 0, zone: [27, 36, 20.3, 23] },
  { room: 5, name: 'zigzag', pos: [17, P, 28], yaw: -Math.PI / 2, zone: [16, 19.7, 24, 36] },
  { room: 6, name: 'climb', pos: [-22.5, P, 30], yaw: -Math.PI / 2, zone: [-24, -20.3, 24, 36] },
  { room: 7, name: 'speed', pos: [-30, 9.2, 18.3], yaw: Math.PI, zone: [-36, -24, 16, 19.7] },
  { room: 8, name: 'low', pos: [-33, P, -21.2], yaw: Math.PI, zone: [-36, -24, -24, -20.3] },
];
// reset floors (x0, x1, z0, z1) -> checkpoint index
const PITS = [
  [[20, OUT, -20, 20], 2], [[20, OUT, 20, OUT], 3], [[-HUB, HUB, 20, OUT], 4], [[-OUT, -HUB, 20, OUT], 5], [[-OUT, -HUB, -20, 20], 6],
];

export const glowMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });

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

/**
 * Text on a surface. Flat labels read upright walking toward -z at rotY 0
 * (+x at -PI/2, -x at PI/2, +z at PI). Vertical ones face +z at rotY 0.
 */
export function label(scene, text, pos, { rotY = 0, width = 2.2, sub = null, opacity = 0.8, vertical = false } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 160 / 512),
    new THREE.MeshBasicMaterial({ map: labelTexture(text, sub), transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(...pos);
  m.rotation.order = 'YXZ';
  m.rotation.set(vertical ? 0 : -Math.PI / 2, rotY, 0);
  scene.add(m);
  return m;
}

export function strip(scene, pos, size) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), glowMat);
  m.position.set(...pos);
  scene.add(m);
  return m;
}

/** Static geometry: call from Level.build() before finalizeStatic(). */
export function buildBasement(L, W, D) {
  const C = PALETTE, B = BASE_Y, S = L.scene;
  const top = -0.5; // underside of the ground floor
  const H = top - B;
  const solid = { outline: false, shadow: false };
  // axis-aligned box from ranges (y relative to the basement floor)
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([(x0 + x1) / 2, B + (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  // an inclined slab rising along +z from (za, ya) to (zb, yb), visual + collider
  const incline = (x0, x1, za, ya, zb, yb, color = C.wood) => {
    const th = 0.3, len = Math.hypot(zb - za, yb - ya), ang = Math.atan2(yb - ya, zb - za);
    const nrm = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
    // (0.05 longer than the slope, all of it at the low end: the top meets its platform
    // flush, where a proud lip would bump a slide going over the crest)
    const dir = new THREE.Vector3(0, yb - ya, zb - za).normalize();
    const c = new THREE.Vector3((x0 + x1) / 2, B + (ya + yb) / 2, (za + zb) / 2).addScaledVector(nrm, -th / 2).addScaledVector(dir, -0.025);
    L.box([c.x, c.y, c.z], [x1 - x0, th, len + 0.05], color, { rotX: -ang });
  };
  // walls: a line with openings [[a, b, y0?, y1?], ...] along it
  const wallX = (x, z0, z1, gaps = [], color = C.wall) => wallRun('x', x, z0, z1, gaps, color);
  const wallZ = (z, x0, x1, gaps = [], color = C.wall) => wallRun('z', z, x0, x1, gaps, color);
  function wallRun(axis, at, a0, a1, gaps, color) {
    const seg = (a, b, y0, y1) => {
      if (b - a < 0.01 || y1 - y0 < 0.01) return;
      if (axis === 'x') blk(at - Wt / 2, at + Wt / 2, y0, y1, a, b, color, solid);
      else blk(a, b, y0, y1, at - Wt / 2, at + Wt / 2, color, solid);
    };
    let a = a0;
    for (const [g0, g1, gy0 = 0, gy1 = H] of [...gaps].sort((p, q) => p[0] - q[0])) {
      seg(a, g0, 0, H);
      seg(g0, g1, 0, gy0); // below the opening
      seg(g0, g1, gy1, H); // above it
      a = g1;
    }
    seg(a, a1, 0, H);
  }

  // ---- shell ----
  blk(-OUT - 0.5, OUT + 0.5, -0.5, 0, -OUT - 0.5, OUT + 0.5, C.dark, { outline: false }); // floor
  // ceiling outside the building footprint (the ground floor slab covers the rest)
  const cy = [H, H + 0.5];
  blk(-OUT - 0.5, -W - 0.5, ...cy, -OUT - 0.5, OUT + 0.5, C.deep, solid);
  blk(W + 0.5, OUT + 0.5, ...cy, -OUT - 0.5, OUT + 0.5, C.deep, solid);
  blk(-W - 0.5, W + 0.5, ...cy, -OUT - 0.5, -D - 0.5, C.deep, solid);
  blk(-W - 0.5, W + 0.5, ...cy, D + 0.5, OUT + 0.5, C.deep, solid);
  wallX(-OUT - Wt / 2, -OUT, OUT); wallX(OUT + Wt / 2, -OUT, OUT);
  wallZ(-OUT - Wt / 2, -OUT, OUT, [[-2.5, 2.5, 0, 3.5]]); // (room 1's south door: the tech lab)
  wallZ(OUT + Wt / 2, -OUT, OUT);
  // hub walls: one door to room 1
  wallZ(-HUB, -HUB, HUB, [[-2, 2, 0, 3.5]]);
  wallZ(HUB, -HUB, HUB); wallX(-HUB, -HUB, HUB); wallX(HUB, -HUB, HUB);
  // ring dividers (corner | side), with the openings the route uses
  wallX(HUB, -OUT, -HUB, [[-35.5, -21]]); // 1 | 2
  wallZ(-HUB, HUB, OUT, [[21.5, 35.5]]); // 2 | 3
  wallZ(HUB, HUB, OUT, [[21.5, 35.5]]); // 3 | 4
  wallX(HUB, HUB, OUT, [[21, 35.5]]); // 4 | 5
  wallX(-HUB, HUB, OUT, [[21, 35.5]]); // 5 | 6
  wallZ(HUB, -OUT, -HUB, [[-35.5, -21.5]]); // 6 | 7
  wallZ(-HUB, -OUT, -HUB, [[-35.5, -21.5]]); // 7 | 8
  wallX(-HUB, -OUT, -HUB, [[-35.5, -31.5, 0, 4]]); // 8 | 1 (only the tunnel mouth)

  // 2 m measuring grid on floors that aren't reset floors
  const gridLine = (x0, x1, z0, z1) => blk(x0, x1, 0.005, 0.015, z0, z1, C.deep, { outline: false, collide: false, shadow: false });
  for (let v = -HUB + 2; v < HUB; v += 2) { gridLine(-HUB, HUB, v - 0.025, v + 0.025); gridLine(v - 0.025, v + 0.025, -HUB, HUB); }
  for (let v = -HUB + 2; v < HUB; v += 2) gridLine(v - 0.025, v + 0.025, -OUT, -HUB); // room 1
  // reset floors: a dark skin over the pits
  for (const [[x0, x1, z0, z1]] of PITS) blk(x0, x1, 0.005, 0.02, z0, z1, C.outline, { outline: false, collide: false, shadow: false });

  buildHub(S, blk, incline);

  // ---- 1 S: run, slide, hop (heading +x) ----
  const slot = (x) => { blk(x - 0.3, x + 0.3, 1.5, 4, -OUT, -HUB, C.dark); strip(S, [x - 0.31, B + 1.49, -28], [0.02, 0.05, 16]); };
  const hurdle = (x, h) => blk(x - 0.2, x + 0.2, 0, h, -OUT, -HUB, C.wood);
  slot(-3); hurdle(3, 0.6); slot(9); hurdle(14, 0.7);
  label(S, '1', [-18.2, B + 0.02, -28], { rotY: -Math.PI / 2, width: 1.2, sub: 'run / slide / hop' });
  label(S, 'SLIDE', [-5, B + 0.02, -28], { rotY: -Math.PI / 2, width: 1.6, sub: '1.5 m slot' });
  label(S, 'HOP', [1.2, B + 0.02, -28], { rotY: -Math.PI / 2, width: 1.4, sub: '0.6 / 0.7 m' });
  for (const x of [-8, 18]) { blk(x - 0.1, x + 0.1, 0, 3, -OUT, -35.6, C.dark); blk(x - 0.1, x + 0.1, 0, 3, -20.4, -HUB, C.dark); strip(S, [x, B + 3, -28], [0.1, 0.1, 16]); }
  label(S, 'SPEED GATE', [-8, B + 3.4, -20.3], { rotY: Math.PI, width: 2.4, vertical: true });

  // ---- 2 SE: mantle up to the platforms (heading +x, then +z) ----
  blk(25, 29, 0, 1.4, -OUT, -27);
  blk(29, OUT, 0, 2.4, -OUT, -27);
  blk(26, OUT, 0, P, -27, -20);
  label(S, '2', [22.5, B + 0.02, -31], { rotY: -Math.PI / 2, width: 1.2, sub: 'mantle' });
  label(S, '1.4 m', [24.98, B + 0.9, -31.5], { rotY: -Math.PI / 2, width: 1.2, vertical: true });
  label(S, '2.4 m', [28.98, B + 1.9, -31.5], { rotY: -Math.PI / 2, width: 1.2, vertical: true });
  label(S, '3.0 m', [31, B + 2.7, -27.02], { rotY: Math.PI, width: 1.2, vertical: true });

  // ---- 3 E: gaps (heading +z), platforms x 27..33 over a reset floor ----
  const plat = (x0, x1, z0, z1, h = P, color = C.mid) => blk(x0, x1, 0, h, z0, z1, color);
  plat(27, 33, -20, -13);
  plat(27, 33, -9.5, -4.5);
  plat(27, 33, 1, 8);
  plat(27, 33, 15.5, 20);
  label(S, '3', [30, B + P + 0.02, -17], { rotY: Math.PI, width: 1.2, sub: 'gaps' });
  label(S, '3.5 m', [30, B + P + 0.02, -14], { rotY: Math.PI, width: 1.3, sub: 'sprint jump' });
  label(S, '5.5 m', [30, B + P + 0.02, -5.5], { rotY: Math.PI, width: 1.3, sub: 'double jump' });
  label(S, '7.5 m', [30, B + P + 0.02, 7], { rotY: Math.PI, width: 1.3, sub: 'jump, dash' });

  // ---- 4 NE: wallrun + wall jump (heading +z) ----
  plat(27, OUT, 20, 23);
  blk(OUT - 1.75, OUT, 0, H, 28, 29.5, C.dark); // pillar on the wall: jump across before it
  blk(31.85, 32.15, 0, 9, 25, 32, C.wood); // panel
  strip(S, [32.16, B + P + 2.3, 28.5], [0.02, 0.1, 7]);
  strip(S, [OUT - 0.01, B + P + 2.3, 25.5], [0.02, 0.1, 5]);
  plat(HUB, OUT, 33, OUT);
  label(S, '4', [31, B + P + 0.02, 21.4], { rotY: Math.PI, width: 1.2, sub: 'wallrun, wall jump' });

  // ---- 5 N: zigzag (heading -x) between staggered panels ----
  plat(14, HUB, 24, OUT);
  plat(-HUB, -14, 24, OUT);
  for (const [x0, x1, z] of [[4, 12, 30], [-2, 6, 26], [-8, 0, 30], [-14, -6, 26]]) {
    blk(x0, x1, 0, 10, z - 0.15, z + 0.15, C.wood);
    strip(S, [(x0 + x1) / 2, B + P + 2.3, z + (z > 28 ? -0.16 : 0.16)], [x1 - x0, 0.1, 0.02]);
  }
  label(S, '5', [17, B + P + 0.02, 30], { rotY: Math.PI / 2, width: 1.2, sub: 'zigzag' });

  // ---- 6 NW: climb (heading -x) ----
  plat(-26, -HUB, 24, OUT);
  plat(-31, -26, 24, OUT, P + 2.8);
  plat(-OUT, -31, 14, OUT, 9.2);
  label(S, '6', [-22.5, B + P + 0.02, 32], { rotY: Math.PI / 2, width: 1.2, sub: 'climb' });
  label(S, '2.8 m', [-25.98, B + P + 1.6, 30], { rotY: Math.PI / 2, width: 1.3, vertical: true, sub: 'jump + mantle' });
  label(S, '3.4 m', [-30.98, B + P + 4.3, 30], { rotY: Math.PI / 2, width: 1.3, vertical: true, sub: 'double + mantle' });

  // ---- 7 W: speed (heading -z): top platform, ramp, 7 m gap ----
  plat(-OUT, -24, 14, 20, 9.2);
  incline(-33, -27, -3, 3.2, 14, 9.2);
  plat(-33, -27, -5, -3, 3.2);
  plat(-33, -27, -20, -12);
  label(S, '7', [-30, B + 9.22, 17], { width: 1.2, sub: 'speed: slide the ramp' });
  label(S, '7 m', [-30, B + 3.22, -4], { width: 1.2, sub: 'jump at top speed' });
  blk(-33.4, -33.2, 0, 7, -4.6, -4.4, C.dark); blk(-26.8, -26.6, 0, 7, -4.6, -4.4, C.dark); strip(S, [-30, B + 7, -4.5], [6.6, 0.1, 0.1]);

  // ---- 8 SW: slide chute, 1.5 m tunnel, back to 1 ----
  plat(-OUT, -24, -24, -20);
  incline(-OUT, -30, -31, 0, -24, P);
  blk(-30, -HUB, 0, 7, -31, -24, C.mid); // a wall beside the chute (no running over the tunnel roof)
  blk(-30, -21, 1.5, 4, -OUT, -31, C.dark); // tunnel roof: 1.5 m (standing is 1.7, crouched 1.35)
  strip(S, [-25.5, B + 1.49, -31.02], [9, 0.05, 0.02]);
  label(S, '8', [-30, B + P + 0.02, -21.5], { width: 1.2, sub: 'low' });
  label(S, 'TUNNEL', [-32.5, B + 0.02, -33.5], { rotY: -Math.PI / 2, width: 1.6, sub: '1.5 m' });

  // checkpoint rings
  for (const cp of CHECKPOINTS) {
    const [x, y, z] = cp.pos;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 4, 28), glowMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, B + y + 0.04, z);
    S.add(ring);
  }

  // lights (few: every light costs every lit pixel)
  for (const p of [[0, 9, 0], [0, 8, -28], [28, 10, 0], [0, 10, 28], [-28, 11, 0]]) {
    const l = new THREE.PointLight(0xffa066, 30, 45, 1.1);
    l.position.set(p[0], B + p[1], p[2]);
    S.add(l);
  }

  // the way down: glowing edge around the hole, and a sign
  const { x0, x1, z1 } = HOLE;
  strip(S, [(x0 + x1) / 2, 0.012, z1 + 0.05], [x1 - x0, 0.02, 0.08]);
  strip(S, [x0 - 0.05, 0.012, (-D + z1) / 2], [0.08, 0.02, z1 + D]);
  strip(S, [x1 + 0.05, 0.012, (-D + z1) / 2], [0.08, 0.02, z1 + D]);
  label(S, 'BASEMENT', [(x0 + x1) / 2, 0.015, z1 + 0.75], { rotY: 0, width: 2.2, sub: 'movement lab: drop in' });
}

// ---- the hub: the metrics gym ----------------------------------------------------
function buildHub(S, blk, incline) {
  const C = PALETTE, B = BASE_Y;
  // step / mantle ladder (x -17..17, z 0..2.5): colour by what it takes
  const heights = [0.25, 0.4, 0.5, 0.75, 1.0, 1.4, 1.9, 2.4, 2.8, 3.2, 3.6, 4.0];
  const tone = (h) => (h <= 0.4 ? C.pale : h <= 1.9 ? C.potLight : h <= 2.84 ? C.pot : h <= 3.58 ? C.mid : C.dark);
  heights.forEach((h, i) => {
    const x = -16.5 + i * 3;
    blk(x - 0.8, x + 0.8, 0, h, 0, 2.5, tone(h));
    label(S, `${h} m`, [x, B + Math.min(h, 2) / 2 + 0.05, -0.02], { rotY: Math.PI, width: 1.3, vertical: true });
  });
  label(S, 'HEIGHTS', [-19.7, B + 1.2, 1.25], { rotY: Math.PI / 2, width: 2.6, vertical: true, sub: 'step · mantle · jump+mantle · double+mantle' });

  // clearance gates (z 6): bar heights; the courier is 1.7 m standing (1.9 with the hair), 1.35 m crouched
  [1.2, 1.5, 1.75, 1.9, 2.2].forEach((h, i) => {
    const x = -17 + i * 3.2;
    blk(x - 1.1, x - 0.9, 0, h + 0.3, 5.9, 6.1, C.dark);
    blk(x + 0.9, x + 1.1, 0, h + 0.3, 5.9, 6.1, C.dark);
    blk(x - 1.1, x + 1.1, h, h + 0.3, 5.9, 6.1, C.dark);
    label(S, `${h} m`, [x, B + 0.02, 4.8], { rotY: Math.PI, width: 1.1 });
  });
  label(S, 'CLEARANCE', [-10.6, B + 0.02, 3.6], { rotY: Math.PI, width: 2.4, sub: 'stand 1.7 (hair 1.9) · crouch 1.35' });

  // slope ramps (x 3..18, z 5..), 1.5 m rise; 46° is the steepest you can walk up
  [10, 20, 30, 40, 46, 55].forEach((deg, i) => {
    const x = 3 + i * 3, rise = 1.5, run = rise / Math.tan(deg * Math.PI / 180);
    incline(x - 1.2, x + 1.2, 5, 0, 5 + run, rise, i < 5 ? C.wood : C.dark);
    blk(x - 1.2, x + 1.2, 0, rise, 5 + run, 5 + run + 1, C.mid);
    label(S, `${deg}°`, [x, B + 0.02, 4.2], { rotY: Math.PI, width: 1 });
  });
  label(S, 'SLOPES', [10.5, B + 0.02, 3.2], { rotY: Math.PI, width: 2, sub: 'slides speed up downhill' });

  // long-jump lane along the north wall: runway from x -19, takeoff line at -9, 1 m ticks
  const x0 = -9;
  blk(x0 - 0.05, x0 + 0.05, 0.005, 0.03, 15, 19.5, C.glow, { outline: false, collide: false, shadow: false });
  for (let d = 1; d <= 27; d++) {
    const long = d % 5 === 0;
    blk(x0 + d - 0.02, x0 + d + 0.02, 0.005, 0.02, long ? 15 : 18.8, 19.5, C.pale, { outline: false, collide: false, shadow: false });
    if (d % 2 === 0) label(S, `${d}`, [x0 + d, B + 0.02, 18.2], { rotY: -Math.PI / 2, width: 0.9, opacity: 0.6 });
  }
  RUBRIC.forEach(([name, dist], i) => {
    const x = x0 + dist;
    blk(x - 0.03, x + 0.03, 0.005, 0.025, 15, 17.8, C.glow, { outline: false, collide: false, shadow: false });
    label(S, name, [x, B + 0.02, 15.6 + (i % 3) * 0.75], { rotY: -Math.PI / 2, width: 2.2, opacity: 0.7 });
  });
  label(S, 'LONG JUMP', [-14, B + 0.02, 17.2], { rotY: -Math.PI / 2, width: 2.4, sub: 'take off at the line' });
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

/** Breakable targets: jars along room 1 to shoot on the move (they come back). */
export function spawnBasement(Bk) {
  const B = BASE_Y, C = PALETTE;
  const kinds = ['jar', 'amphora', 'pitcher', 'melon', 'spindle'];
  const spots = [[-12, -35.2], [-1, -35.2], [6, -35.2], [16, -35.2], [-10, -20.8], [5, -20.8], [12, -20.8]];
  spots.forEach(([x, z], i) => Bk.spawn({ kind: kinds[i % kinds.length], pos: [x, B + 0.002, z], color: i % 2 ? C.potLight : C.pot, respawn: 6 }));
}

// ---- runtime: checkpoints, reset floors, the index pads, speed gates, splits ---------
const STORE = 'foolsfortune.course.v1';

export class Course {
  constructor(game) {
    this.game = game;
    this.current = -1; // last checkpoint touched
    this.t = 0;
    this.running = false;
    this.lapT = null; // running lap time (from room 1's checkpoint)
    this.lapRooms = new Set();
    this.best = {};
    try { this.best = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { /* storage unavailable */ }
    // the ring's checkpoints (a lap, with splits), then the tech lab's (no splits)
    this.ringN = CHECKPOINTS.length;
    this.cps = [...CHECKPOINTS, ...TECH_CPS.map((c) => ({ ...c, tech: true }))]
      .map((c) => ({ ...c, v: new THREE.Vector3(c.pos[0], BASE_Y + c.pos[1], c.pos[2]) }));
    this.pits = [...PITS, ...TECH_PITS.map(([r, i, below]) => [r, i + this.ringN, below])];
    this.hubSpawn = { v: new THREE.Vector3(0, BASE_Y, -10), yaw: 0 };
    this.labSpawn = { v: new THREE.Vector3(0, BASE_Y, -38), yaw: Math.PI };
    this.gates = [
      { axis: 'x', at: -8, a0: -36, a1: -20, y: [0, 3] },
      { axis: 'x', at: 18, a0: -36, a1: -20, y: [0, 3] },
      { axis: 'z', at: -4.5, a0: -33.2, a1: -26.8, y: [2, 8] },
    ];
    this.prev = new THREE.Vector3();
    this.el = document.getElementById('course');
    this.buildPads();
    this.buildBoard();
  }

  // metrics board on the hub's south wall: live values from the tuning, and the rubric
  buildBoard() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.board = { c, tex: new THREE.CanvasTexture(c) };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.5), new THREE.MeshBasicMaterial({ map: this.board.tex, transparent: true }));
    m.position.set(-11, BASE_Y + 4.6, -HUB + 0.27);
    this.game.scene.add(m);
    this.refreshBoard();
  }

  refreshBoard() {
    const M = T.movement, g = this.board.c.getContext('2d');
    const v = M.jumpVelocity, G = M.gravity;
    const air = (2 * v) / G, h = (v * v) / (2 * G), h2 = h + ((v * M.airJumpMult) ** 2) / (2 * G);
    g.clearRect(0, 0, 1024, 640);
    g.fillStyle = 'rgba(28,13,8,0.82)';
    g.fillRect(0, 0, 1024, 640);
    g.strokeStyle = '#ffb27a'; g.lineWidth = 3; g.strokeRect(6, 6, 1012, 628);
    g.fillStyle = '#ffb27a'; g.font = 'bold 40px ui-monospace, Menlo, Consolas, monospace';
    g.fillText('METRICS', 30, 58);
    g.font = '24px ui-monospace, Menlo, Consolas, monospace';
    g.fillStyle = '#fbe3cf';
    const live = [
      ['walk / sprint / crouch', `${M.walkSpeed} / ${M.sprintSpeed} / ${M.crouchSpeed} m/s`],
      ['slide boost / top speed', `${M.slideSpeed} / ${M.maxSpeed} m/s`],
      ['wallrun speed / time', `${M.wallrunSpeed} m/s / ${M.wallrunMaxTime} s`],
      ['jump height / double', `${h.toFixed(2)} / ${h2.toFixed(2)} m`],
      ['sprint jump (flat)', `${(M.sprintSpeed * air).toFixed(2)} m`],
      ['step / mantle / jump+mantle', `${M.stepHeight} / ${M.mantleMax} / ${(h + M.mantleMax).toFixed(2)} m`],
      ['stand / crouch height', '1.7 / 1.35 m'],
      ['dash', `${M.dashSpeed} m/s, ${M.dashCost} Lachryma`],
    ];
    g.fillStyle = '#ffb27a'; g.font = 'bold 26px ui-monospace, Menlo, Consolas, monospace';
    g.fillText('LIVE (from the tuning panel)', 30, 104);
    g.font = '23px ui-monospace, Menlo, Consolas, monospace';
    live.forEach(([k, val], i) => { g.fillStyle = '#e8ab86'; g.fillText(k, 30, 140 + i * 31); g.fillStyle = '#fff1dc'; g.fillText(val, 470, 140 + i * 31); });
    g.fillStyle = '#ffb27a'; g.font = 'bold 26px ui-monospace, Menlo, Consolas, monospace';
    g.fillText('MEASURED CHAINS (default tuning)', 30, 424);
    g.font = '21px ui-monospace, Menlo, Consolas, monospace';
    RUBRIC.forEach(([k, d], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      g.fillStyle = '#e8ab86'; g.fillText(k, 30 + col * 500, 458 + row * 32);
      g.fillStyle = '#fff1dc'; g.fillText(`${d} m`, 30 + col * 500 + 380, 458 + row * 32);
    });
    this.board.tex.needsUpdate = true;
  }

  // the index: eight pads in the hub, stand on one to jump to that room (plus one to the
  // tech lab); and the lab's own row of pads by its door
  buildPads() {
    const S = this.game.scene, B = BASE_Y;
    const pad = (x, z, cp, text, sub, rotY = Math.PI, dz = 1.4) => {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), new THREE.MeshBasicMaterial({ color: PALETTE.glow, transparent: true, opacity: 0.45 }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, B + 0.03, z);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 4, 28), glowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, B + 0.04, z);
      S.add(disc, ring);
      label(S, text, [x, B + 1.9, z + dz], { rotY, width: 1.3, vertical: true, sub });
      return { x, z, cp, disc, hold: 0 };
    };
    this.pads = this.cps.slice(0, this.ringN).map((cp, i) => pad(-14 + i * 4, -6, i, `${cp.room}`, cp.name));
    this.pads.push(pad(18, -6, 'lab', 'LAB', 'movement techs'));
    this.cps.slice(this.ringN).forEach((cp, k) => this.pads.push(pad(-10 + k * 4, -41.5, this.ringN + k, cp.room, cp.name, 0, -1.4)));
    label(S, 'INDEX', [0, B + 3.2, -4.4], { rotY: Math.PI, width: 3, vertical: true, sub: 'stand on a pad · R checkpoint · H hub' });
  }

  toLab() {
    this.teleport(this.labSpawn.v, this.labSpawn.yaw);
    this.running = false;
    this.current = -1;
    this.lapT = null;
    sfx.geyser();
  }

  inBasement() { return this.game.player.pos.y < -2; }

  teleport(v, yaw) {
    const p = this.game.player;
    p.pos.copy(v); p.prevPos.copy(v); p.renderPos.copy(v);
    p.vel.set(0, 0, 0);
    p.yaw = yaw; p.pitch = 0; p.bodyYaw = yaw;
    p.wallrun = null; p.mantle = null; p.sliding = false; p.dashT = 0; p.riding = null; p.exiting = 0;
    p.techs?.reset();
    this.game.character?.setHidden(false);
    p.airJumps = T.movement.airJumps; p.dashCharges = T.movement.dashCharges; p.slideBoostCd = 0;
    p.place();
    this.game.lachryma.reset(); // save-scumming is allowed here
    this.game.fx.absorbSparkle(v.clone().setY(v.y + 1));
    this.prev.copy(v);
  }

  goTo(i, sound = 'dash') {
    const cp = this.cps[i];
    if (this.current !== i) this.lapRooms.clear();
    this.current = i;
    this.teleport(cp.v, cp.yaw);
    this.t = 0;
    this.running = true;
    if (i === 0) this.lapT = 0;
    sfx[sound]();
  }

  respawn() { if (this.current < 0) this.toHub(); else this.goTo(this.current); }

  toHub() {
    this.teleport(this.hubSpawn.v, this.hubSpawn.yaw);
    this.running = false;
    this.current = -1;
    this.lapT = null;
    sfx.geyser();
  }

  touch(i) {
    if (i === this.current && this.running) return;
    if (this.cps[i].tech) {
      // a tech station: somewhere to come back to, no splits
      this.current = i; this.t = 0; this.running = true; this.lapT = null; this.lapRooms.clear();
      this.game.hud.popup(`${this.cps[i].room} · ${this.cps[i].name.toUpperCase()}`);
      sfx.lockOn(2);
      return;
    }
    const g = this.game, n = this.ringN;
    const prev = this.current;
    const inOrder = this.running && prev >= 0 && prev < n && (prev + 1) % n === i;
    if (inOrder) {
      // a clean split: straight from the previous room's checkpoint
      const key = `room${this.cps[prev].room}`, t = this.t;
      const pb = !(this.best[key] <= t);
      if (pb) this.best[key] = t;
      g.hud.popup(`${this.cps[prev].room} · ${t.toFixed(2)}s${pb ? ' · BEST' : ` · best ${this.best[key].toFixed(2)}`}`);
      this.lapRooms.add(prev);
    } else this.lapRooms.clear();
    if (i === 0) {
      // full lap: every room in order, back to room 1
      if (inOrder && this.lapT !== null && this.lapRooms.size === n) {
        const lap = this.lapT;
        const pb = !(this.best.lap <= lap);
        if (pb) this.best.lap = lap;
        g.hud.popup(`LAP ${lap.toFixed(2)}s${pb ? ' · BEST' : ''}`);
      }
      this.lapT = 0;
      this.lapRooms.clear();
    }
    try { localStorage.setItem(STORE, JSON.stringify(this.best)); } catch { /* storage unavailable */ }
    this.current = i;
    this.t = 0;
    this.running = true;
    sfx.lockOn(2);
  }

  update(dt) {
    const g = this.game, p = g.player, inp = g.input;
    const here = this.inBasement();
    if (this.el) this.el.style.display = here ? 'block' : 'none';
    const stats = document.getElementById('stats');
    if (stats) stats.style.visibility = here ? 'hidden' : 'visible'; // the shatter count means nothing down here
    if (!here) { this.running = false; this.prev.copy(p.pos); return; }
    if (inp.wasPressed('KeyR')) { this.respawn(); return; }
    if (inp.wasPressed('KeyH')) { this.toHub(); return; }
    this.t += dt;
    if (this.lapT !== null) this.lapT += dt;

    const feet = p.pos;
    // checkpoints
    this.cps.forEach((cp, i) => {
      const [x0, x1, z0, z1] = cp.zone;
      if (Math.abs(feet.y - cp.v.y) < 1.5 && feet.x > x0 && feet.x < x1 && feet.z > z0 && feet.z < z1) this.touch(i);
    });
    // reset floors
    // (a pit's own trigger height if it has one: the lab's are dug below its floor, where
    // the ring's are the basement floor itself under raised rooms)
    for (const [[x0, x1, z0, z1], cpi, below = BASE_Y + 0.4] of this.pits) {
      if (feet.y < below && feet.x > x0 && feet.x < x1 && feet.z > z0 && feet.z < z1) {
        this.goTo(cpi, 'fizzle');
        g.hud.popup('RESET');
        return;
      }
    }
    // index pads
    for (const pad of this.pads) {
      const on = Math.abs(feet.y - BASE_Y) < 0.5 && Math.hypot(feet.x - pad.x, feet.z - pad.z) < 0.8;
      pad.hold = on ? pad.hold + dt : 0;
      pad.disc.material.opacity = 0.45 + Math.min(1, pad.hold / 0.35) * 0.5;
      if (pad.hold > 0.35) { pad.hold = 0; if (pad.cp === 'lab') this.toLab(); else this.goTo(pad.cp, 'geyser'); return; }
    }
    // speed gates
    for (const gt of this.gates) {
      const a = gt.axis === 'x' ? this.prev.x : this.prev.z, b = gt.axis === 'x' ? feet.x : feet.z;
      const side = gt.axis === 'x' ? feet.z : feet.x;
      const hy = feet.y - BASE_Y;
      if ((a - gt.at) * (b - gt.at) < 0 && side > gt.a0 && side < gt.a1 && hy > gt.y[0] - 0.5 && hy < gt.y[1]) {
        g.hud.popup(`GATE ${Math.hypot(p.vel.x, p.vel.z).toFixed(1)} m/s`);
      }
    }
    this.prev.copy(feet);

    if (this.el) {
      const cp = this.cps[this.current];
      const best = cp && this.best[`room${cp.room}`];
      this.el.innerHTML = cp && this.running
        ? `<b>${cp.room}</b> ${cp.name} · <b>${this.t.toFixed(2)}</b>s${best ? ` · best ${best.toFixed(2)}` : ''}${this.lapT !== null ? ` · lap ${this.lapT.toFixed(1)}s` : ''}`
        : 'HUB · stand on a pad · R checkpoint · H hub';
    }
  }
}
