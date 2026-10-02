import * as THREE from 'three';
import { PALETTE } from './config.js';
import { BASE_Y, label, strip } from './basement.js';

// ---------------------------------------------------------------------------
// THE SIEGE: the one room where raids happen. In god-hand mode the vessel is only ever attacked
// here (src/raids.js); everywhere else the hand is left in peace to build up its Zone of Influence
// and practise its arts. A plain walled arena south of the lab, with cover to hide behind, things to
// throw and a raised dais to stand the vessel on. Teleport only: it is listed in the hub's index.
//
//   x -30..30   z -108..-76   (the lab's back wall is at z -72.5)
// ---------------------------------------------------------------------------
export const SIEGE = { x0: -30, x1: 30, z0: -108, z1: -76 };
export const SIEGE_SPAWN = { pos: [0, 0.56, -80], yaw: Math.PI }; // (on the dais; relative to the basement floor)
const H = 10, Wt = 0.5;

/** Is a world point inside the arena (any height above the basement floor)? */
export function inSiege(p) {
  return p.x > SIEGE.x0 && p.x < SIEGE.x1 && p.z > SIEGE.z0 && p.z < SIEGE.z1 && p.y > BASE_Y - 2 && p.y < BASE_Y + H + 1;
}

export function buildSiege(L) {
  const C = PALETTE, S = L.scene, B = BASE_Y;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) =>
    L.box([(x0 + x1) / 2, B + (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], color, opts);
  const { x0, x1, z0, z1 } = SIEGE;
  const solid = { outline: false, shadow: false };
  blk(x0 - 0.5, x1 + 0.5, -0.5, 0, z0 - 0.5, z1 + 0.5, C.dark, { outline: false });
  blk(x0 - 0.5, x1 + 0.5, H, H + 0.5, z0 - 0.5, z1 + 0.5, C.deep, solid);
  blk(x0 - Wt, x0, 0, H, z0 - 0.5, z1 + 0.5, C.wall, solid);
  blk(x1, x1 + Wt, 0, H, z0 - 0.5, z1 + 0.5, C.wall, solid);
  blk(x0 - 0.5, x1 + 0.5, 0, H, z0 - Wt, z0, C.wall, solid);
  blk(x0 - 0.5, x1 + 0.5, 0, H, z1, z1 + Wt, C.wall, solid);
  for (const [x, z] of [[-18, -84], [18, -84], [-18, -100], [18, -100], [0, -92]]) {
    const l = new THREE.PointLight(0xffa066, 26, 34, 1.1);
    l.position.set(x, B + 8, z);
    S.add(l);
  }
  // the dais at the south end: the vessel's place
  blk(-4, 4, 0, 0.35, -82, -77.5, C.mid);
  blk(-3, 3, 0.35, 0.55, -81.2, -78.3, C.light ?? C.mid);
  // cover: low walls and pillars, in two rings round the middle
  for (const [x, z, w, d] of [[-14, -92, 6, 0.8], [14, -92, 6, 0.8], [0, -100, 8, 0.8], [-8, -88, 0.8, 4], [8, -88, 0.8, 4]]) blk(x - w / 2, x + w / 2, 0, 1.3, z - d / 2, z + d / 2, C.mid);
  for (const [x, z] of [[-22, -84], [22, -84], [-22, -102], [22, -102]]) blk(x - 0.7, x + 0.7, 0, H, z - 0.7, z + 0.7, C.wall, solid);
  label(S, 'THE SIEGE', [0, B + 0.02, -79.2], { width: 3.4, sub: 'raids come here, and only here', help: '~ raises the hand.' });
  label(S, 'SIEGE', [0, B + 5, z0 + 0.1], { width: 4, vertical: true, sub: 'hold the vessel' });
  strip(S, [0, B + 0.03, -77.6], [8, 0.04, 0.12]);
}

export function spawnSiege(Bk, level) {
  const C = PALETTE, B = BASE_Y;
  const kinds = ['jar', 'amphora', 'pitcher', 'melon'];
  // things to lift, throw, swell and sunder, scattered behind the cover
  for (let i = 0; i < 14; i++) {
    const x = -24 + (i % 7) * 8 + ((i * 37) % 5) * 0.3, z = -86 - Math.floor(i / 7) * 10 - ((i * 13) % 4);
    Bk.spawn({ kind: kinds[i % 4], pos: [x, B + 0.002, z], color: i % 2 ? C.potLight : C.pot, respawn: 8 });
  }
  for (const [x, z, s] of [[-12, -96, 1.1], [12, -96, 1.1], [-4, -104, 0.8], [4, -104, 0.8], [-26, -92, 0.9], [26, -92, 0.9]]) level.crate([x, B + s / 2, z], s);
}
