// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S BLUEPRINTS (plain names; South, 2026-11-03: "take a stab at drafting some adobe buildings? Make em super fancy and with
// varied silhouettes. We should have a healthy dense mixture of large, medium, and small destructible structures"): the one table of
// every kind of earthen building the proving ground's toy city may stand, large (blueprintslarge.js), medium (blueprintsmedium.js) and
// small (blueprintssmall.js), and a building made from one in the shape Dovina's rules carve and collapse (progress/mechs/destruction.js
// newBuilding's: { id, w, h, d, mat, hp, start, foot0 }), with two things more: `role` (a look role a cell, read by the dress) and
// `props` (what hangs off its cells). Pure data: no three.js. Calissa's drafting (2026-11-03), moved here by Dovina's ruling the same
// game day: the cells are the city's rules (they carve, burn and collapse), so they live beside them; her dress (vfx/mechs/city/) reads
// the roles and props. Each kind is a row of BUILDINGS (destruction.js), its walls of adobe (MAT.adobe).
// Prior art: her newBuilding (the layout, the hits), the house's split of a table from its kinds (vfx/mechs/parts/: one file a slot).
//
//   ADOBE[id] = { label, size: 'large' | 'medium' | 'small', w, d, plan(seed) }   ADOBE_IDS   SIZES
//   adobePlan(id, seed) -> { w, h, d, mat, role, props, tint, dropped } | null   (destruction.js newBuilding(id, seed) makes the building)
// ---------------------------------------------------------------------------------------
import { LARGE } from './blueprintslarge.js';
import { MEDIUM } from './blueprintsmedium.js';
import { SMALL } from './blueprintssmall.js';

export const ADOBE = { ...LARGE, ...MEDIUM, ...SMALL };
export const ADOBE_IDS = Object.keys(ADOBE);
export const SIZES = { large: Object.keys(LARGE), medium: Object.keys(MEDIUM), small: Object.keys(SMALL) };

/** A blueprint's plan for one seed (its cells, look roles and props), or null; destruction.js newBuilding gives it hits and counts. */
export const adobePlan = (id, seed = 1) => ADOBE[id]?.plan(seed) || null;
