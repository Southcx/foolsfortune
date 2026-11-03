// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S BLUEPRINTS (plain names; South, 2026-11-03: "take a stab at drafting some adobe buildings? Make em super fancy and with
// varied silhouettes. We should have a healthy dense mixture of large, medium, and small destructible structures"): the one table of
// every kind of earthen building the proving ground's toy city may stand, large (blueprintslarge.js), medium (blueprintsmedium.js) and
// small (blueprintssmall.js), and a building made from one in the shape Dovina's rules carve and collapse (progress/mechs/destruction.js
// newBuilding's: { id, w, h, d, mat, hp, start, foot0 }), with two things more: `role` (a look role a cell, read by the dress) and
// `props` (what hangs off its cells). Pure data: no three.js. Looks only until Dovina wires it (her BUILDINGS row taking a plan).
// Prior art: her newBuilding (the layout, the hits), the house's split of a table from its kinds (vfx/mechs/parts/: one file a slot).
//
//   ADOBE[id] = { label, size: 'large' | 'medium' | 'small', w, d, plan(seed) }   ADOBE_IDS   SIZES
//   adobeBuilding(id, seed) -> b { id, w, h, d, mat, hp, role, props, tint, start, foot0, fallen, dropped } | null
// ---------------------------------------------------------------------------------------
import { MATERIALS } from '../../../progress/mechs/destruction.js';
import { LARGE } from './blueprintslarge.js';
import { MEDIUM } from './blueprintsmedium.js';
import { SMALL } from './blueprintssmall.js';

export const ADOBE = { ...LARGE, ...MEDIUM, ...SMALL };
export const ADOBE_IDS = Object.keys(ADOBE);
export const SIZES = { large: Object.keys(LARGE), medium: Object.keys(MEDIUM), small: Object.keys(SMALL) };

/** A cell's hits by material where her table on this branch has none yet (her fire branch's paper and furnishing). */
const HP = { 1: 0.15, 2: 0.6, 3: 1.2, 4: 2.4, 5: 4, 6: 0.1, 7: 0.3 };
/** Her foot: the cells under 3 layers (FOOT.min; her footOf for a kind with no floor). */
const FOOT = 3;

/** A building of a blueprint: its cells, their hits, its look roles and props, counted as hers are counted. */
export function adobeBuilding(id, seed = 1) {
  const K = ADOBE[id]; if (!K) return null;
  const p = K.plan(seed), n = p.mat.length, hp = new Float32Array(n);
  let start = 0, foot0 = 0;
  for (let i = 0; i < n; i++) {
    const m = p.mat[i]; if (!m) continue;
    hp[i] = MATERIALS[m]?.hp ?? HP[m] ?? 1; start++;
    if (Math.floor(i / (p.w * p.d)) < FOOT) foot0++;
  }
  return { id, w: p.w, h: p.h, d: p.d, mat: p.mat, hp, role: p.role, props: p.props, tint: p.tint, start, foot0, fallen: false, dropped: p.dropped };
}
