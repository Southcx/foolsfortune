// ---------------------------------------------------------------------------
// The basement: a movement lab under the workshop, hub-and-spoke.
//
//   HUB (40 x 40 m, under the building): the metrics gym. Fixed, labelled
//   references every future space is measured against: a step/mantle ladder,
//   clearance gates, slope ramps, a long-jump lane with the measured chain
//   distances marked, a metrics board, and the index: a console (F) that lists the
//   rooms, one teleport each, and the calibration numbers. Drop in through the hole in the ground floor's
//   south-east corner; the geyser beside the landing fires you back up.
//
//   THE COURSE (16 m wide, around the hub): one room, a loop of eight stations,
//   one movement skill each (they were eight rooms behind dividers: now it is one
//   space you can read end to end), a checkpoint at every station and split times.
//     1 S   run, slide, hop       floor: slots (1.5 m) and hurdles, speed gates
//     2 SE  mantle                blocks 1.4 / 2.4 / 3.0 m up to the platforms
//     3 E   gaps                  3.5 m sprint jump, 5.5 m double, 7.5 m jump + dash
//     4 NE  wallrun + wall jump   wall, a pillar in the way, a panel across
//     5 N   zigzag                wallrun / wall jump between staggered panels
//     6 NW  climb                 2.8 m (jump + mantle), 3.4 m (double + mantle)
//     7 W   speed                 slide ramp to top speed, 7 m gap
//     8 SW  low                   slide chute, 1.5 m tunnel, back to 1
//   Stations 3-7 are over a reset floor: touch it and you're back at the station's
//   checkpoint. The Tab panel's actions go back to the last checkpoint or to the hub (they were R and H).
//
//   THE MOVEMENT LAB (south, through the course's south door): one hall of five
//   wings open to each other through arches (world/basement/techwing.js ARCHES): the hands, the
//   rigging, the techs, the clockwork mill and the kiln stack. One Index entry.
//
// The runtime lives beside it: the course (world/basement/course.js, `Course`, re-exported here for its one importer) and the Index's
// rooms (world/rooms.js).
//
// Distances are sized at ~85% of what the controller measured at default
// tuning (see RUBRIC), so a clean human input makes them.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE, T } from '../../core/config.js';
import { FONT } from '../../ui/theme.js';
import { ROOM_GLAZE_ID as RG } from '../../vfx/roomglazes.js'; // (the hub's salt-glazed walls, the Index's celadon: Calissa's room glazes)
import { bakedCanvasTexture } from '../../render/bakedcanvas.js';
import { TR } from '../testroom/layout.js';

export { Course } from './course.js'; // (the runtime moved to course.js; boot/course.js still asks for it here)


export const BASE_Y = -14;
export const HOLE = { x0: 4.5, x1: 9, z0: -15.5, z1: -12.4 }; // ground-floor hole, runs to the south wall
export const HUB = 20; // hub half-size
const OUT = 36, P = 3; // outer half-size, platform height
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
export const CHECKPOINTS = [
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
export const PITS = [
  [[20, OUT, -20, 20], 2], [[20, OUT, 20, OUT], 3], [[-HUB, HUB, 20, OUT], 4], [[-OUT, -HUB, 20, OUT], 5], [[-OUT, -HUB, -20, 20], 6],
];

export const glowMat = new THREE.MeshBasicMaterial({ color: PALETTE.glow });

/** A label's tablet, one texture a text however many tablets say it, baked (its canvas let go once the GPU has it) at the graphics
 *  tier's label scale: the basement's 162 labels were 162 canvases of 512 x 160, 51 MB beside their GPU copies (a phone, 2026-10-24). */
const LABELS = new Map();
function labelTexture(text, sub) {
  const key = `${text}\n${sub || ''}`;
  let t = LABELS.get(key);
  if (t) return t;
  t = bakedCanvasTexture((g) => {
    g.fillStyle = '#fbe3cf';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // (the last argument squeezes a long line to fit the tablet instead of clipping it)
    g.font = `700 70px ${FONT.title}`;
    g.fillText(text, 256, sub ? 58 : 80, 490);
    if (sub) { g.font = `500 34px ${FONT.ui}`; g.fillText(sub, 256, 126, 496); }
  }, 512, 160, { scale: T.visual.labelScale ?? 1 });
  t.anisotropy = 8;
  LABELS.set(key, t);
  return t;
}

/**
 * Text on a surface. Flat labels read upright walking toward -z at rotY 0
 * (+x at -PI/2, -x at PI/2, +z at PI). Vertical ones face +z at rotY 0.
 */
// what a sign would have said about the keys: said once by the log when they come up to the sign, never painted on it (CLAUDE.md:
// marks in the world are not text; docs/ART.md precept 7). `signHelp(game, pos)` asks, every frame, from the course's update.
export const SIGN_HELP = [];
export function signHelp(game, p) {
  for (const h of SIGN_HELP) {
    if (h.said) continue;
    if ((h.x - p.x) ** 2 + (h.z - p.z) ** 2 < 12 && Math.abs(h.y - p.y) < 3) { h.said = true; game.events?.emit('sign.help', { sign: h.sign, help: h.help }); }
  }
}

export function label(scene, text, pos, { rotY = 0, width = 2.2, sub = null, opacity = 0.8, vertical = false, help = null } = {}) {
  if (help) SIGN_HELP.push({ x: pos[0], y: pos[1], z: pos[2], sign: text, help, said: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 160 / 512),
    new THREE.MeshBasicMaterial({ map: labelTexture(text, sub), transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  m.renderOrder = 2;
  m.userData.maxDist = Math.max(22, width * 11); // (unreadable further off: not drawn, render/zones.js)
  // (flat labels sit a hair higher: 2 cm z-fought with the floor at a low grazing angle)
  if (!vertical) pos = [pos[0], pos[1] + 0.02, pos[2]];
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
  // (east of the Workshop the slab's top is the ground the Throwing Room stands on: its floor fills its own footprint, and two faces in
  // one plane fought for the pixels, the owner's R45 report. The slab goes round it: world/testroom/layout.js TR)
  blk(W + 0.5, OUT + 0.5, ...cy, -OUT - 0.5, TR.wing.z0, C.deep, solid); // (and round the combat wing south of it: TR.wing, the same width)
  blk(W + 0.5, OUT + 0.5, ...cy, TR.z1, OUT + 0.5, C.deep, solid);
  blk(TR.x1, OUT + 0.5, ...cy, TR.wing.z0, TR.z1, C.deep, solid);
  blk(-W - 0.5, W + 0.5, ...cy, -OUT - 0.5, -D - 0.5, C.deep, solid);
  blk(-W - 0.5, W + 0.5, ...cy, D + 0.5, OUT + 0.5, C.deep, solid);
  wallX(-OUT - Wt / 2, -OUT, OUT); wallX(OUT + Wt / 2, -OUT, OUT);
  wallZ(-OUT - Wt / 2, -OUT, OUT, [[-2.5, 2.5, 0, 3.5]]); // (room 1's south door: the tech lab)
  wallZ(OUT + Wt / 2, -OUT, OUT);
  // hub walls: one door to room 1
  wallZ(-HUB, -HUB, HUB, [[-2, 2, 0, 3.5]], RG.hubWall);
  wallZ(HUB, -HUB, HUB, [], RG.hubWall); wallX(-HUB, -HUB, HUB, [], RG.hubWall); wallX(HUB, -HUB, HUB, [], RG.hubWall);
  // (the ring was eight rooms behind dividers; it is one room now, THE COURSE, with eight stations round it. The one wall kept is
  // the low station's: it makes the tunnel the only way through from the chute to the start)
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
