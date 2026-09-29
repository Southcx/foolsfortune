import * as THREE from 'three';
import { PALETTE } from './config.js';
import { BASE_Y, label, strip } from './basement.js';

// ---------------------------------------------------------------------------
// The tech lab: an annex south of basement room 1 (through its south door) with a
// station for each movement tech (src/moves/). Stations have checkpoints (R
// returns to the last one) and there's an index of pads at the door.
//
//   POOL     x -34..-22   4.5 m deep; dive tower, a wall to swim under, ladder out
//   LADDERS  x -18..-8    6 m tower; 8 m tower = the slam / roll platform
//   SLAM     below it     a field of pots to slam into
//   SLIP     x 0..8       slip lane, 0.8 m blob-only gap, slip-coated 6 m wall
//   BLINK    x 18..36     9 m gap over a reset pit (sprint jump + blink)
//   STOMP    x 21..27     pots on rising pillars: bounce pot to pot up onto the climb wall
//   CLIMB    x 28..36     a 4 m wall (jump into it with W held)
// ---------------------------------------------------------------------------

export const LAB = { x0: -36, x1: 36, z0: -72, z1: -36.5 };
const H = 13.5, Wt = 0.5; // (BASE_Y is read inside the functions: basement.js imports this module too)
export const POOL = { x0: -34, x1: -22, z0: -70, z1: -50, bottom: -4.5, surface: -0.35 };
export const BLINK_PIT = { x0: 18, x1: 36, z0: -61, z1: -52, depth: 3 };
// stomp stairs (x, pillar height): a pot on each; a jump reaches the first, each bounce
// (+1.66 m at default tuning) the next, and the last one the 4 m climb wall
const STOMP_STEPS = [[21.8, 0.2], [24, 1.6], [26.2, 2.9]];

// checkpoints in the lab: feet position relative to the basement floor, facing yaw
export const TECH_CPS = [
  { room: 'T1', name: 'pool', pos: [-28, 0, -44.5], yaw: Math.PI, zone: [-34, -22, -46, -43] },
  { room: 'T2', name: 'ladders', pos: [-13, 0, -48], yaw: Math.PI, zone: [-19, -7, -49.5, -46.5] },
  { room: 'T3', name: 'slam / roll', pos: [-11, 8, -69], yaw: 0, zone: [-18, -8, -70, -66] },
  { room: 'T4', name: 'slip', pos: [4, 0, -42], yaw: Math.PI, zone: [0, 8, -43.5, -40.5] },
  { room: 'T5', name: 'blink', pos: [24, 0, -44], yaw: Math.PI, zone: [18, 30, -46, -42] },
  { room: 'T6', name: 'stomp', pos: [19, 0, -69.5], yaw: Math.PI / 2, zone: [18, 20.5, -71.5, -67] },
];
// reset floors in the lab -> index into TECH_CPS, and the height (world) the feet have to
// drop below to count: well down into the pit, not just over it
export const TECH_PITS = [[[BLINK_PIT.x0, BLINK_PIT.x1, BLINK_PIT.z0, BLINK_PIT.z1], 4, -14 - 1.5]];

export function buildTechLab(L, env) {
  const C = PALETTE, S = L.scene, B = BASE_Y;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([(x0 + x1) / 2, B + (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const { x0, x1, z0, z1 } = LAB;

  // ---- floor (with holes for the pool and the blink pit), walls, ceiling ----
  const holes = [POOL, BLINK_PIT];
  // floor strips between the holes, row by row along z
  const zs = [...new Set([z0 - 0.5, z1, ...holes.flatMap((h) => [h.z0, h.z1])])].sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const za = zs[i], zb = zs[i + 1], zm = (za + zb) / 2;
    const cuts = holes.filter((h) => zm > h.z0 && zm < h.z1).sort((a, b) => a.x0 - b.x0);
    let xa = x0 - 0.5;
    for (const h of cuts) { if (h.x0 > xa) blk(xa, h.x0, -0.5, 0, za, zb, C.dark, { outline: false }); xa = h.x1; }
    if (x1 + 0.5 > xa) blk(xa, x1 + 0.5, -0.5, 0, za, zb, C.dark, { outline: false });
  }
  const solid = { outline: false, shadow: false };
  blk(x0 - 0.5, x1 + 0.5, H, H + 0.5, z0 - 0.5, z1, C.deep, solid); // ceiling
  blk(x0 - Wt, x0, 0, H, z0 - 0.5, z1, C.wall, solid);
  blk(x1, x1 + Wt, 0, H, z0 - 0.5, z1, C.wall, solid);
  blk(x0 - 0.5, x1 + 0.5, 0, H, z0 - Wt, z0, C.wall, solid);
  for (const p of [[-24, 9, -54], [4, 9, -54], [26, 9, -54]]) {
    const l = new THREE.PointLight(0xffa066, 30, 40, 1.1);
    l.position.set(p[0], B + p[1], p[2]);
    S.add(l);
  }
  label(S, 'TECH LAB', [0, B + 0.02, -39.5], { width: 3.2, sub: 'movement techs · pads below' });

  // ---- POOL: basin, dive tower, a wall to swim under, a ladder out ----
  {
    const P = POOL;
    blk(P.x0 - 0.5, P.x1 + 0.5, P.bottom - 0.5, P.bottom, P.z0 - 0.5, P.z1 + 0.5, C.dark, { outline: false });
    blk(P.x0 - 0.5, P.x0, P.bottom, 0, P.z0 - 0.5, P.z1 + 0.5, C.mid, { outline: false });
    blk(P.x1, P.x1 + 0.5, P.bottom, 0, P.z0 - 0.5, P.z1 + 0.5, C.mid, { outline: false });
    blk(P.x0, P.x1, P.bottom, 0, P.z0 - 0.5, P.z0, C.mid, { outline: false });
    blk(P.x0, P.x1, P.bottom, 0, P.z1, P.z1 + 0.5, C.mid, { outline: false });
    // the divider: swim under it (a 1.6 m gap along the bottom)
    blk(P.x0, P.x1, P.bottom + 1.6, 1.2, -60.2, -59.8, C.wood);
    env.water.add({ x0: P.x0, x1: P.x1, z0: P.z0, z1: P.z1, bottom: B + P.bottom, surface: B + P.surface });
    // dive tower on the north deck, ladder up its north face
    blk(-30, -26, 0, 5, -49.5, -47, C.pot);
    env.ladders.add({ x: -28, z: -47, y0: B, y1: B + 5, n: new THREE.Vector3(0, 0, 1) });
    // out of the pool: a ladder on the south wall of the far half
    env.ladders.add({ x: -28, z: P.z0, y0: B + P.bottom, y1: B, n: new THREE.Vector3(0, 0, 1) });
    label(S, 'POOL', [-28, B + 0.02, -44], { width: 1.8, sub: 'dive · swim under the wall · C down, Space up' });
    label(S, '5 m', [-28, B + 5.02, -48.3], { width: 1, sub: 'dive' });
  }

  // ---- LADDERS: a 6 m tower and an 8 m one (the slam / roll platform) ----
  {
    blk(-18, -14, 0, 6, -58, -54, C.pot);
    env.ladders.add({ x: -16, z: -54, y0: B, y1: B + 6, n: new THREE.Vector3(0, 0, 1) });
    blk(-18, -8, 0, 8, -72, -66, C.mid);
    env.ladders.add({ x: -16, z: -66, y0: B, y1: B + 8, n: new THREE.Vector3(0, 0, 1) });
    label(S, 'LADDERS', [-13, B + 0.02, -51], { width: 2, sub: 'W/S climb · Shift fast · C slide · Space kick off' });
    label(S, '6 m', [-16, B + 6.02, -56], { width: 1 });
    // the slam field below the 8 m edge (pots come back)
    label(S, 'SLAM · ROLL', [-11, B + 8.02, -67.5], { width: 2.2, sub: 'C in the air · hold C to land in a roll' });
    strip(S, [-13, B + 8.01, -66.05], [10, 0.02, 0.08]);
  }

  // ---- SLIP: a lane, a blob-only gap, a slip-coated wall ----
  {
    const up = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
    env.slip.addRect(new THREE.Vector3(4, B + 0.005, -56), up, X, 2, 12); // lane x 2..6, z -68..-44
    // the gap wall: only the blob fits under it (0.8 m) over the lane; walk round at the ends
    blk(-2, 2, 0, 3, -55.2, -54.8, C.wood);
    blk(6, 10, 0, 3, -55.2, -54.8, C.wood);
    blk(2, 6, 0.8, 3, -55.2, -54.8, C.wood);
    env.slip.addRect(new THREE.Vector3(4, B + 0.005, -55), up, X, 2, 0.6, false);
    // the slip wall: 6 m up onto a platform
    blk(0, 8, 0, 6, -72, -68, C.pot);
    env.slip.addRect(new THREE.Vector3(4, B + 3, -67.99), new THREE.Vector3(0, 0, 1), X, 2, 3);
    label(S, 'SLIP', [4, B + 0.02, -45.5], { width: 1.6, sub: 'hold C to dive · Space out · 8: SLIP shells' });
    label(S, '0.8 m', [4, B + 1.4, -54.75], { rotY: Math.PI, width: 1, vertical: true, sub: 'blob only' });
    label(S, '6 m', [4, B + 6.02, -70], { width: 1 });
  }

  // ---- BLINK: 9 m over a reset pit; STOMP: pots on pillars across it ----
  {
    const P = BLINK_PIT;
    blk(P.x0, P.x1, -P.depth - 0.5, -P.depth, P.z0, P.z1, C.outline, { outline: false });
    blk(P.x0, P.x1, -P.depth, 0, P.z1, P.z1 + 0.02, C.dark, solid); // (faces for the pit edges)
    blk(P.x0, P.x1, -P.depth, 0, P.z0 - 0.02, P.z0, C.dark, solid);
    strip(S, [(P.x0 + P.x1) / 2, B + 0.01, P.z1 - 0.04], [P.x1 - P.x0, 0.02, 0.08]);
    label(S, 'BLINK', [24, B + 0.02, -48.5], { width: 1.6, sub: '9 m · sprint jump, E mid-air' });
    // wall climb: a 4 m wall in the far corner
    blk(28, 36, 0, 4, -72, -66, C.mid);
    label(S, 'CLIMB 4 m', [32, B + 0.02, -64], { width: 1.8, sub: 'jump into it, W held' });
    // stomp stairs: pots on pillars, each a bounce above the last, up onto the 4 m wall
    for (const [x, h] of STOMP_STEPS) blk(x - 0.35, x + 0.35, 0, h, -69.85, -69.15, C.wood);
    label(S, 'STOMP', [20, B + 0.02, -67.5], { rotY: -Math.PI / 2, width: 1.4, sub: 'pot to pot, up' });
  }
  env.ladders.build(L, 0.3);
}

/** Breakables in the lab (they come back): the slam field and the stomp pots. */
export function spawnTechLab(Bk) {
  const C = PALETTE, B = BASE_Y;
  const kinds = ['jar', 'amphora', 'pitcher', 'melon', 'spindle'];
  let i = 0;
  for (let x = -16; x <= -9; x += 1.4) for (let z = -63; z <= -57.5; z += 1.5) Bk.spawn({ kind: kinds[i++ % kinds.length], pos: [x + ((i * 37) % 7) * 0.05, B + 0.002, z], color: i % 2 ? C.potLight : C.pot, respawn: 8 });
  for (const [x, h] of STOMP_STEPS) Bk.spawn({ kind: 'jar', pos: [x, B + h + 0.002, -69.5], color: C.potLight, respawn: 3 });
}
