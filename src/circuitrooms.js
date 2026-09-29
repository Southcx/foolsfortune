import * as THREE from 'three';
import { PALETTE } from './config.js';
import { BASE_Y, label, strip } from './basement.js';

// ---------------------------------------------------------------------------------------
// The circuits' own halls (the third, THE MILL RACE, is the mill itself: see circuits.js). Both halls
// are annexes standing far out in the basement's layer (x 3000), so they can be as tall and as long
// as the course wants, with nothing else in the way. Teleport-only, from the hub's index. Every
// number is sized from the gymnasium's rubric (docs/CIRCUITS.md): gaps at about 85% or less of
// what the controller clears, ledges and pillars inside what hang, latch and mantle reach.
//
//   THE BRAID    x 3000..3074, z -18..18   a 6 m pit, five junction platforms across it, and three
//                                          lines between each pair: a balance beam, overhead bars,
//                                          and islands to blink or double-jump between. Change line
//                                          at any junction.
//   THE SPINDLE  x 3000..3077, z 200..261  up a stair of skills (slide, gap, a wallrun, a latch,
//                                          a hang, a mantle, a dash gap, an updraft), then down a
//                                          long chute and across a last gap.
// ---------------------------------------------------------------------------------------
const B = BASE_Y;
const H = Math.PI / 2;

// ------------------------------------------------------------------ THE BRAID
const BOX = 3000, BOZ = 0;
const BJ = [0, 17, 34, 51, 68]; // junction x (local); each is 3 m deep and spans the whole width
const gateZone = (x0, x1, y0, y1, z0, z1) => [x0, x1, B + y0, B + y1, z0, z1];
export const BRAID_DEF = {
  id: 'braid', name: 'THE BRAID', blurb: 'three lines across a pit: beams, bars, blinks. Change line at any junction',
  spawn: { at: [BOX + 0.6, 0, BOZ], yaw: H },
  bounds: [BOX - 6, BOX + 78, BOZ - 22, BOZ + 22],
  resetY: -3.6,
  par: { gold: 34, silver: 46, bronze: 65 },
  stages: BJ.map((xj, i) => [{
    label: i === 0 ? 'START' : i === BJ.length - 1 ? 'FINISH' : `JUNCTION ${i}`,
    zone: gateZone(BOX + xj + (i === 0 ? 2 : 0.4), BOX + xj + 3, -1, 4, BOZ - 14, BOZ + 14), yaw: H,
  }]),
};

// ------------------------------------------------------------------ THE SPINDLE
const SOX = 3000, SOZ = 200;
export const SPINDLE_DEF = {
  id: 'spindle', name: 'THE SPINDLE', blurb: 'up through a chain of skills, down a long chute',
  spawn: { at: [SOX + 1.5, 0, SOZ + 6], yaw: H },
  bounds: [SOX - 6, SOX + 80, SOZ - 64, SOZ + 18],
  resetY: -4.6,
  par: { gold: 48, silver: 64, bronze: 88 },
  stages: [
    { label: 'START', b: [6, 8, -1, 3, 2, 10], yaw: H },
    { label: 'FIRST GAP', b: [15, 20, -1, 3, 2, 10], yaw: H },
    { label: 'WALLRUN', b: [32.4, 38, -2.6, 1, 2, 10], yaw: H },
    { label: 'PILLAR', b: [38, 41, 1.6, 5, 2, 10], yaw: H },
    { label: 'LEDGE', b: [41, 47, 4.3, 8, 2, 10], yaw: H },
    { label: 'MANTLE', b: [47, 52, 7.3, 11, 2, 10], yaw: H },
    { label: 'DASH GAP', b: [59.6, 66, 7.3, 11, 2, 10], yaw: H },
    { label: 'THE TOP', b: [67.8, 74, 16.3, 20, -10, 10], yaw: Math.PI },
    { label: 'CHUTE END', b: [68, 74, 3.6, 8, -46, -40], yaw: Math.PI, minSpeed: 6 },
    { label: 'FINISH', b: [67, 75, -1, 3, -58, -52], yaw: Math.PI, minSpeed: 8 },
  ].map((g) => [{ label: g.label, yaw: g.yaw, minSpeed: g.minSpeed, zone: gateZone(SOX + g.b[0], SOX + g.b[1], g.b[2], g.b[3], SOZ + g.b[4], SOZ + g.b[5]) }]),
};

export function buildCircuitRooms(L, env) {
  const C = PALETTE, S = L.scene, R = env.rigging;
  const solid = { outline: false, shadow: false };
  const rod = (x, z, y0, y1, r = 0.03) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 5), new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.9 }));
    m.position.set(x, B + (y0 + y1) / 2, z);
    S.add(m);
  };
  const light = (x, y, z, i = 26) => { const l = new THREE.PointLight(0xffa066, i, 46, 1.05); l.position.set(x, B + y, z); S.add(l); };
  // a closed hall: a dark floor at the bottom of the pit, four walls, a ceiling
  const hall = (blk, x0, x1, z0, z1, top, depth = 6) => {
    blk(x0 - 1, x1 + 1, -depth - 0.5, -depth, z0 - 1, z1 + 1, C.outline, { outline: false });
    blk(x0 - 1, x0, -depth, top, z0 - 1, z1 + 1, C.wall, solid);
    blk(x1, x1 + 1, -depth, top, z0 - 1, z1 + 1, C.wall, solid);
    blk(x0 - 1, x1 + 1, -depth, top, z0 - 1, z0, C.wall, solid);
    blk(x0 - 1, x1 + 1, -depth, top, z1, z1 + 1, C.wall, solid);
    blk(x0 - 1, x1 + 1, top, top + 0.5, z0 - 1, z1 + 1, C.deep, solid);
  };

  // =============================== THE BRAID ===============================
  {
    const ox = BOX, oz = BOZ;
    const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
      L.box([ox + (x0 + x1) / 2, B + (y0 + y1) / 2, oz + (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
    hall(blk, -3, 74, -18, 18, 12);
    for (const xj of BJ) {
      blk(xj, xj + 3, -6, 0, -14, 14, C.mid);
      strip(S, [ox + xj + 3.02, B + 0.02, oz], [0.05, 0.04, 28]);
      light(ox + xj + 1.5, 10, oz, 14);
    }
    for (const x of [8, 25, 42, 59]) light(ox + x, 10, oz - 9, 10), light(ox + x, 10, oz + 9, 10);
    label(S, 'THE BRAID', [ox + 1.5, B + 0.02, oz - 11.5], { rotY: -H, width: 3, sub: 'three lines · change at any junction' });
    label(S, 'BEAMS', [ox + 1.5, B + 0.02, oz - 8.6], { rotY: -H, width: 1.4, sub: 'walk · Shift trots and wobbles' });
    label(S, 'BARS', [ox + 1.5, B + 0.02, oz + 1.6], { rotY: -H, width: 1.2, sub: 'jump up · W / S along · Space swings' });
    label(S, 'BLINKS', [ox + 1.5, B + 0.02, oz + 8.6], { rotY: -H, width: 1.4, sub: 'islands: blink or double jump' });
    // segment s runs from junction s (its far edge) to junction s + 1: 14 m of pit
    const beamW = [0.3, 0.2, 0.3, 0.2];
    const bars = [
      [[0.4, 6.0], [8.6, 13.6]],                 // one 2.6 m swing between two long bars
      [[0.4, 4.4], [6.4, 10.0], [12.0, 13.6]],   // three bars, 2.0 m apart
      [[0.4, 5.5], [8.5, 13.6]],                 // one 3.0 m swing
      [[0.4, 4.0], [6.6, 9.6], [12.2, 13.6]],    // three, 2.6 m apart
    ];
    const isl = [
      [[4.5, 6.5], [11, 13]],
      [[5, 6.5], [11.5, 13]],
      [[5.2, 6.7], [11.9, 13.4]],
      [[5.4, 6.6], [12, 13.2]],
    ];
    for (let s = 0; s < 4; s++) {
      const xa = BJ[s] + 3, xb = BJ[s + 1];
      R.addBeam(L, [ox + xa, B, oz - 10], [ox + xb, B, oz - 10], { width: beamW[s] });
      for (const [a, b] of bars[s]) {
        R.addBar([ox + xa + a, B + 2.5, oz], [ox + xa + b, B + 2.5, oz]);
        rod(ox + xa + a, oz, 2.5, 12); rod(ox + xa + b, oz, 2.5, 12);
      }
      for (const [a, b] of isl[s]) blk(xa + a, xa + b, -6, 0, 9.1, 10.9, C.pot);
    }
  }

  // =============================== THE SPINDLE ===============================
  {
    const ox = SOX, oz = SOZ;
    const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
      L.box([ox + (x0 + x1) / 2, B + (y0 + y1) / 2, oz + (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
    // (an inclined slab rising along +z from (za, ya) to (zb, yb); the top meets its platform flush)
    const incline = (x0, x1, za, ya, zb, yb, color = C.wood) => {
      const th = 0.3, len = Math.hypot(zb - za, yb - ya), ang = Math.atan2(yb - ya, zb - za);
      const nrm = new THREE.Vector3(0, Math.cos(ang), -Math.sin(ang));
      const dir = new THREE.Vector3(0, yb - ya, zb - za).normalize();
      const c = new THREE.Vector3(ox + (x0 + x1) / 2, B + (ya + yb) / 2, oz + (za + zb) / 2).addScaledVector(nrm, -th / 2).addScaledVector(dir, -0.025);
      L.box([c.x, c.y, c.z], [x1 - x0, th, len + 0.05], color, { rotX: -ang });
    };
    hall(blk, -3, 77, -61, 14, 27);
    const P = (x0, x1, top, z0 = 2, z1 = 10, color = C.mid) => blk(x0, x1, -6, top, z0, z1, color);
    // ---- ascent, along the north lane (z 2..10)
    P(0, 11, 0);                                   // the start pad, and a low slot to slide under
    blk(3.5, 5.5, 1.5, 3.6, 2, 10, C.dark);
    P(14.5, 20, 0);                                // 3.5 m across (a sprint jump)
    blk(20, 32, -6, 9, 10, 10.8, C.wall);          // a wall to run: 12 m along, over a pit
    strip(S, [ox + 26, B + 0.02, oz + 9.98], [12, 0.05, 0.05]);
    P(32, 38, -1.5);                               // the far side (a wallrun ends lower)
    P(38, 41, 2.7, 2, 10, C.pot);                  // a pillar, 4.2 m above the last: latch up it
    P(41, 47, 5.4);                                // a ledge 2.7 m above the pillar: hang, pull up
    P(47, 52, 8.4);                                // and 3.0 m above that: a mantle
    P(59.6, 66, 8.4);                              // 7.6 m across: a jump and a dash
    env.movers.updraft({ x: ox + 62.6, z: oz + 6, r: 1.5, y0: B + 8.45, y1: B + 8.4 + 11, speed: 9, accel: 30 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 6, 24), new THREE.MeshBasicMaterial({ color: C.glow }));
    ring.rotation.x = Math.PI / 2; ring.position.set(ox + 62.6, B + 8.5, oz + 6); S.add(ring);
    P(67.7, 74, 17.4, -10, 10, C.pot);             // the top: a ledge the steam's reach away
    // ---- descent: a 19 degree chute south along the east side, then a last gap
    incline(68, 74, -46, 5.0, -10, 17.4, C.wood);
    blk(67.5, 68, -6, 18.6, -46, -10, C.wall, solid);
    blk(74, 74.5, -6, 18.6, -46, -10, C.wall, solid);
    P(67, 75, 0, -58, -52, C.pot);                 // the finish, 6 m beyond the chute's foot
    // ---- lights and labels
    for (const [x, z] of [[8, 6], [26, 6], [44, 6], [62, 6], [70, -6], [70, -30], [70, -50]]) light(ox + x, 22, oz + z, 28);
    label(S, 'THE SPINDLE', [ox + 1.5, B + 0.02, oz + 3.2], { rotY: -H, width: 3, sub: 'slide · jump · wallrun · latch · hang · mantle · dash · steam' });
    label(S, 'SLOT', [ox + 4.5, B + 0.02, oz + 1.6], { rotY: -H, width: 1, sub: '1.5 m: slide under' });
    label(S, 'WALL', [ox + 26, B + 0.02, oz + 8.4], { rotY: -H, width: 1.1, sub: 'jump along it · hold W' });
    label(S, 'PILLAR', [ox + 39.5, B + 2.72, oz + 6], { rotY: -H, width: 1.2, sub: '4.2 m: C beside it, in the air' });
    label(S, 'STEAM', [ox + 62.6, B + 8.42, oz + 3.2], { rotY: -H, width: 1.2, sub: 'jump into it · steer to the top' });
    label(S, 'CHUTE', [ox + 71, B + 17.42, oz - 12], { rotY: Math.PI, width: 1.4, sub: 'slide down · keep your speed' });
    label(S, 'FINISH', [ox + 71, B + 0.02, oz - 53], { rotY: Math.PI, width: 1.4, sub: '8 m/s or the clock adds a second' });
  }
  env.ladders?.build?.(L, 0.3);
}
