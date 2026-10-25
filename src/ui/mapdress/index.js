// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS (docs/plans/art/map-board-v1.md; the owner's ruling, 2026-10-25: the island level is board v1's B1, the glazed Clay
// dress with the areas as a ring of tiles; an area's page is B2's ink scroll laid out as panel C; Dovina's docs/plans/MAP.md). The look
// of the map (M), split from its engine as the Pneuka Box's underside was: Petra's feedback/cartography.js keeps the cells, the save,
// input, zoom and the canvas's life, and hands this folder data; this folder draws it and keeps nothing.
//   island.js      islandLook: the island level, a ring of glazed tiles for any number of areas
//   areapage.js    areaPage: an area's page, the ground as sumi on washi
//   checklist.js   checklist: an area's N of M rows with blank slots, its rooms with TRACK, its line to come back for
//   mapwindow.js   mapWindow: the System window round them, desk and phone layouts
//   ink.js         the inks, faces, silhouettes and paper they share
// 2D canvas and DOM only: 0 shader programs, 0 textures, 0 draw calls of the world's.
//
// Prior art: Okami's scroll map, Final Fantasy XII's region and area maps, Hollow Knight's charted names, Outer Wilds' ship log,
// Metroid Prime's floors, Spyro's and Xenoblade's checklists (each cited in its own file).
//
//   import { islandLook, islandHit, areaPage, checklist, mapWindow, disposeMapDress } from '../ui/mapdress/index.js'
//   disposeMapDress()   (the map closed: the sketch's canvas and the paper let go)
// ---------------------------------------------------------------------------------------
export { islandLook, islandHit, ISLAND_LOOK } from './island.js';
export { areaPage, disposeAreaPage, SKETCH } from './areapage.js';
export { checklist, CHECKLIST_LOOK } from './checklist.js';
export { mapWindow, mapLayout, MAP_WINDOW } from './mapwindow.js';
export { SILHOUETTES, INK } from './ink.js';
import { disposeAreaPage } from './areapage.js';

/** Everything the dress holds while the map is open, let go. */
export function disposeMapDress() { disposeAreaPage(); }
