// ---------------------------------------------------------------------------------------
// THE TREASURY: five plinths (a chest of each tier, common to prismatic), the Tithe's console and the dais its sealed chests land on;
// Raku stands beside the console (npc/people.js follows the Tithe). It stood on the Weir's north beach until 2026-10-15, when the owner
// split it off into Raku's bazaar (docs/plans/CASINO.md section 9); it is a piece placed by an origin so it can stand wherever it is put.
// Its local frame: x across, z toward the front (where you stand to open a chest), the floor at y 0. Static boxes go into the level's
// geometry (level.box), so build it before the level is merged.
//
// Prior art: the Weir's own build (tools/sondelass/angling/weir.js, where these numbers were laid out), Margarite's dock (a far piece
// built at boot from an origin).
//
//   TREASURY (the layout)   buildTreasury(level, at)   stockTreasury(game, at)   at = { x, y, z, yaw }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../core/config.js';
import { label } from './basement/basement.js';
import { ECON } from '../progress/econ/table.js';

/** Local metres: the plinths in a row at z 0, the Tithe's console and its dais to their left as you face them; 24.3 m across in all. */
export const TREASURY = { plinths: [-2.3, 1.1, 4.5, 7.9, 11.3], top: 0.55, tithe: { x: -6.5, z: -0.3 }, dais: { x: -11, z: 2 } };
const TIERS = ['COMMON', 'FINE', 'RARE', 'EPIC', 'PRISMATIC'];
const STONE = 0xc9a07a;

/** A local point (x, y, z) to the world, by the origin and its yaw. */
const toWorld = (at, x, y, z) => { const c = Math.cos(at.yaw || 0), s = Math.sin(at.yaw || 0); return new THREE.Vector3(at.x + x * c + z * s, at.y + y, at.z - x * s + z * c); };

/** The plinths, the console, the dais and the words cut on the floor before them. */
export function buildTreasury(L, at) {
  const C = PALETTE, rotY = at.yaw || 0;
  const blk = (x0, x1, y0, y1, z0, z1, color = C.mid, opts = {}) => L.box(toWorld(at, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).toArray(), [x1 - x0, y1 - y0, z1 - z0], color, { rotY, ...opts });
  for (const x of TREASURY.plinths) { blk(x - 0.75, x + 0.75, 0, TREASURY.top, -0.55, 0.55, C.mid); blk(x - 0.85, x + 0.85, TREASURY.top, TREASURY.top + 0.06, -0.65, 0.65, C.dark); }
  { const { x, z } = TREASURY.tithe; blk(x - 0.55, x + 0.55, 0, 1.06, z - 0.32, z + 0.32, STONE); blk(x - 0.62, x + 0.62, 1.06, 1.12, z - 0.4, z + 0.4, C.dark); }
  { const { x, z } = TREASURY.dais; blk(x - 1.15, x + 1.15, -0.2, 0.14, z - 1.15, z + 1.15, C.dark); blk(x - 0.9, x + 0.9, 0.14, 0.16, z - 0.9, z + 0.9, C.mid, { outline: false, shadow: false }); }
  const T = (t, x, z, o = {}) => label(L.scene, t, toWorld(at, x, 0.02 + (o.y || 0), z).toArray(), { rotY, ...o });
  TIERS.forEach((n, i) => T(n, TREASURY.plinths[i], 1.35, { width: 1.5 }));
  T('THE TREASURY', (TREASURY.plinths[0] + TREASURY.plinths[4]) / 2, 3.4, { width: 3 });
  T('THE TITHE', TREASURY.tithe.x, TREASURY.tithe.z + 1.55, { width: 2 });
}

/** Chests on the plinths (they close again after a while), and the Tithe's console brought alive. The chests' ids keep the Weir's. */
export function stockTreasury(game, at) {
  const yaw = at.yaw || 0;
  TREASURY.plinths.forEach((x, tier) => game.chests.spawn(tier, toWorld(at, x, TREASURY.top + 0.06, 0), { yaw, id: `weir.${tier}`, respawn: () => (game.mode === 'debug' ? ECON.treasury.debug : ECON.treasury.respawn[tier]), floor: at.y }));
  game.chests.setTithe({ pos: toWorld(at, TREASURY.tithe.x, 0, TREASURY.tithe.z), yaw, dais: toWorld(at, TREASURY.dais.x, 0.16, TREASURY.dais.z) });
}
