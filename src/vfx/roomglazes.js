// ---------------------------------------------------------------------------------------
// ROOM GLAZES: the real glazes the rooms' built surfaces and ware are fired with, as data (docs/ART.md, "The room glazes"). A room
// glaze is not a glaze (the Courier's, courier/vessel/glazes.js `GLAZES`): it is a row here, drawn on a built surface by the room glaze
// atlas (vfx/surfaces.js) or given to a pot as its colour.
//
// The choice is made in one table, `ROOM_SURFACES` (a kind of built surface -> the room glaze it is fired with); a room builder passes
// the kind's colour id, `ROOM_GLAZE_ID.kiln`, wherever it passed a palette colour, and Level.mat() dresses it (surfaces.js `dress`). The
// id is the glaze's own clay body colour, so it batches like any colour and can never be mistaken for one of the palette's.
//
// Restraint is the rule: a few glazes, each where a potter would put it, the terracotta still the ground. Prior art: the glazes' own
// history (each row says where and when); Okami's and The Wind Waker's painted surfaces, which keep a few broad colours to a surface and
// let the light do the rest; and the era's way of drawing a material (one modest tiling texture times a colour: surfaces.js).
//
// Each row:
//   body       the clay under it (and the colour id); clay: the body's pattern from surfaces.js (floor, wall, k)
//   thick/thin the glaze where it pools thick (recesses, the floor-facing faces, the pooling's blotches) / where it runs thin or breaks
//   clear      how much of the body's relief shows through (0 opaque .. 1 a clear skin)
//   peel       orange peel (the salt's dimpled skin, shino's yuzu-hada)
//   speck      specks (iron, ash, pinholes, rust) and how many (`specks`), shown most where the glaze is thin
//   cover      [floor-facing, wall-facing]: where it lies at all; runs: rivulets down the wall-facing faces; pool: the pooling's say (at the
//              cover's edge, and how much it varies thick to thin)
//   gloss      the glass's roughness; bodyRough: the bare body's; sheen: the room's light at the turn of the glass
//   fat        how thick it lies overall; recess: how much more it pools in the body's recesses (mortar, grout, a seam)
//   ware       the colour a pot of it is given (a vertex colour); wareGlossy: it goes on the glossy ware material
//   surface    false: ware only, never on a built surface (its look needs a line finer than 480 lines can hold)
//
//   ROOM_GLAZES   ROOM_SURFACES   ROOM_GLAZE_ID.<kind>   roomGlazeOf(colour) -> row | null
//   SHOWROOM_WARE   wareFor(place, i) -> { color } | {}   wareColour(key)   wareGlossy(colour)
// ---------------------------------------------------------------------------------------

export const ROOM_GLAZES = {
  // The kilns' own: natural ash glaze. Not mixed but made by the fire: in the anagama's ten-day wood firings, ash flies, lands on
  // whatever faces the flame (the kiln itself first), melts and runs. Bizen (Okayama, from the Kamakura period, 13th c.) keeps it thin
  // and dry, goma, 'sesame', the yellow ash specks; Shigaraki (Shiga, from the 13th c.) lets it pool into bidoro, 'glass', a green
  // that runs down in beads (tama-dare). Here the shoulder takes the glass and the sides the runs; the firebrick shows below.
  ash: {
    label: 'natural ash glaze', body: 0x57281a, clay: { floor: 'brick', wall: 'brick', k: 0.42 },
    thick: 0x324a2a, thin: 0x6e5424, clear: 0.45, peel: 0, speck: 0x9c844c, specks: 0.3,
    cover: [1.0, 0.0], runs: 0.85, pool: 0.45, gloss: 0.5, bodyRough: 0.88, sheen: 0.8, fat: 0.5, recess: 0.7, // (gloss 0.5: a lamp's
    // highlight broad and soft, as a wood-fired glass takes it; at 0.3 it was a hard white spot and the cap read as plastic)
    ware: 0x7a6a3a, wareGlossy: false,
  },
  // Firebrick, unglazed: fireclay brick, what a kiln and its chimney are built of; sooted dark where the flame comes out.
  firebrick: {
    label: 'firebrick, unglazed', body: 0x6a3020, clay: { floor: 'brick', wall: 'brick', k: 0.45 },
    thick: 0, thin: 0, clear: 0, peel: 0, speck: 0, specks: 0,
    cover: [0, 0], runs: 0, pool: 0, gloss: 1, bodyRough: 0.9, sheen: 0, fat: 0, recess: 0,
    ware: 0x6a3020, wareGlossy: false,
  },
  // Tin glaze, majolica white: tin oxide in a lead glaze fires an opaque white over a buff earthenware. Iraq's potters made it in the
  // 9th century to answer Chinese porcelain; it came through Moorish Spain (Málaga, then Valencia's Manises) to Italy's maiolica
  // (Deruta, Faenza, whence faience) and Delft. Where it lies thin the buff warms it, and it pinholes where it crawled.
  majolica: {
    label: 'tin glaze (majolica white)', body: 0xc9a27c, clay: { floor: 'plaster', wall: 'plaster', k: 0.1 },
    thick: 0xefe8da, thin: 0xe2ccad, clear: 0.05, peel: 0.15, speck: 0xa77e5e, specks: 0.3,
    cover: [1, 1], runs: 0, pool: 0, gloss: 0.3, bodyRough: 0.9, sheen: 0.7, fat: 0.55, recess: 0.3,
    ware: 0xece2d0, wareGlossy: true,
  },
  // Tenmoku: the iron glaze of Jian ware (the Jianyang kilns, Fujian; Song, 10th to 13th c.), black and glossy where it pools and
  // breaking to rust (kaki) where it ran thin over a rim; the tea bowls Japanese monks brought home from the temples of Mount Tianmu,
  // whence the name. Here the rust shows only as specks where it ran thin: streaks on a flat slab read as wood grain. Its lustre is the
  // lamps' highlights on the glass, not the room's sheen: on a black glaze an even sheen lies as a grey veil (it read as charcoal).
  tenmoku: {
    label: 'tenmoku', body: 0x4a3428, clay: { floor: 'plaster', wall: 'plaster', k: 0.08 },
    thick: 0x22140b, thin: 0x6b3416, clear: 0, peel: 0.1, speck: 0x8a4a20, specks: 0.25,
    cover: [1, 1], runs: 0, pool: 0, gloss: 0.18, bodyRough: 0.9, sheen: 0.3, fat: 0.8, recess: 0.3,
    ware: 0x2a1a12, wareGlossy: true,
  },
  // Hare's fur: the same Jian iron glaze, its iron drawn down the walls of the bowl into fine brown streaks as it ran. Ware only: the
  // streaks are a millimetre wide, and on a built surface they read as wood grain.
  haresFur: {
    label: "hare's fur", body: 0x4a342a, clay: { floor: 'plaster', wall: 'plaster', k: 0.08 },
    thick: 0x1a120d, thin: 0x7a4a26, clear: 0, peel: 0, speck: 0x9a6a3a, specks: 0.2,
    cover: [1, 1], runs: 0.9, pool: 0, gloss: 0.18, bodyRough: 0.9, sheen: 1.0, fat: 0.55, recess: 0.4,
    ware: 0x3a2216, wareGlossy: true, surface: false,
  },
  // Shino: Mino's (Gifu; Momoyama, late 16th c.) thick feldspar glaze, milky white, pitted (yuzu-hada, 'citron skin') and pinholed,
  // blushing orange (hi-iro, 'fire colour') where it thins over the iron in the body. The first white glaze made in Japan.
  shino: {
    label: 'shino', body: 0xd2b49a, clay: { floor: 'plaster', wall: 'plaster', k: 0.1 },
    thick: 0xece2d2, thin: 0xd88a58, clear: 0, peel: 0.35, speck: 0x8c5a3a, specks: 0.55,
    cover: [1, 1], runs: 0, pool: 0, gloss: 0.55, bodyRough: 0.9, sheen: 0.35, fat: 0.5, recess: 0.3,
    ware: 0xe6cdb2, wareGlossy: false,
  },
  // Oribe: Mino again (the Keichō era, c. 1600 to 1615), named for the tea master Furuta Oribe: a copper green poured over part of a
  // piece, glassy and dark where it pools, the bare buff beside it.
  oribe: {
    label: 'oribe', body: 0xc8a27e, clay: { floor: 'plaster', wall: 'plaster', k: 0.12 },
    thick: 0x2f5c3e, thin: 0x7a9450, clear: 0.4, peel: 0, speck: 0, specks: 0,
    cover: [1.0, 0.55], runs: 0.6, pool: 0.5, gloss: 0.2, bodyRough: 0.9, sheen: 0.9, fat: 0.5, recess: 0.6,
    ware: 0x4f7a4a, wareGlossy: true,
  },
  // Sang de boeuf, oxblood: copper red fired in reduction at Jingdezhen under the Kangxi emperor (1662 to 1722), the Lang kilns'
  // langyao. Deep red where it pools and runs to a roll at the foot; at the rim the copper burns away and it thins to white. Rare then,
  // rare here: one vase in the building.
  sangDeBoeuf: {
    label: 'sang de boeuf (oxblood)', body: 0xd8d0c0, clay: { floor: 'plaster', wall: 'plaster', k: 0.06 },
    thick: 0x701418, thin: 0xc9c6ae, clear: 0.1, peel: 0, speck: 0, specks: 0,
    cover: [1, 1], runs: 0.7, pool: 0.2, gloss: 0.15, bodyRough: 0.85, sheen: 1.0, fat: 0.62, recess: 0.5,
    ware: 0x8c1c1e, wareGlossy: true,
  },
  // Salt glaze: common salt thrown into the firebox at full heat; the sodium vapour glazes every face it reaches with a thin clear skin,
  // dimpled like orange peel. The Rhineland from the 15th c. (Siegburg, Raeren, Frechen's toffee-brown 'tiger' jugs, the Westerwald's
  // grey), then Fulham and Lambeth, and the salt-glazed brick and drainpipe of the Victorian works, put where a wall must wash and throw
  // the lamplight back. Grey where the salt lay thin, toffee where the flame flashed it.
  salt: {
    label: 'salt glaze', body: 0x8b857a, clay: { floor: 'brick', wall: 'brick', k: 0.4 },
    thick: 0x8a7258, thin: 0x878a87, clear: 0.9, peel: 0.6, speck: 0x3e3128, specks: 0.35,
    cover: [1, 1], runs: 0, pool: 0.25, gloss: 0.42, bodyRough: 0.85, sheen: 0.6, fat: 0.2, recess: 0.2,
    ware: 0x8e7a60, wareGlossy: true,
  },
  // Celadon: Longquan's (Zhejiang; Southern Song, 12th to 13th c., the blue-green kinuta), an iron glaze fired in reduction, laid on
  // thick and satin, like jade: deeper green where it pools, paling toward the grey body over an edge.
  celadon: {
    label: 'celadon', body: 0x8e897e, clay: { floor: 'plaster', wall: 'plaster', k: 0.06 },
    thick: 0x6c9682, thin: 0x96b49f, clear: 0.15, peel: 0, speck: 0, specks: 0,
    cover: [1, 1], runs: 0, pool: 0, gloss: 0.26, bodyRough: 0.9, sheen: 0.8, fat: 0.45, recess: 0.5,
    ware: 0x8fb59c, wareGlossy: true,
  },
  // Slip-trailed earthenware: Staffordshire's (late 17th c.; Thomas Toft's chargers): a red body, cream slip trailed over it in lines
  // and dots from a spouted pot, the whole under a clear lead glaze that fires it honey. Ware only: a trailed line is finer than 480
  // lines can hold without crawling.
  slipware: {
    label: 'slip-trailed earthenware', body: 0x8a3c22, clay: { floor: 'plaster', wall: 'plaster', k: 0.2 },
    thick: 0xd6a24e, thin: 0x9a4a26, clear: 0.5, peel: 0, speck: 0x3c2014, specks: 0.6,
    cover: [1, 1], runs: 0, pool: 0.3, gloss: 0.3, bodyRough: 0.9, sheen: 0.8, fat: 0.5, recess: 0.3,
    ware: 0xc98a46, wareGlossy: true, surface: false,
  },
  // Unglazed: terracotta (the palette itself: core/config.js PALETTE, the workshop's ground, never a row's id) and bisque, clay fired
  // once and waiting for its glaze (Pip's colour).
  terracotta: {
    label: 'terracotta, unglazed', body: 0xc46a45, clay: { floor: 'tiles', wall: 'plaster', k: 0.22 },
    thick: 0, thin: 0, clear: 0, peel: 0, speck: 0, specks: 0,
    cover: [0, 0], runs: 0, pool: 0, gloss: 1, bodyRough: 0.92, sheen: 0, fat: 0, recess: 0,
    ware: 0xc46a45, wareGlossy: false, surface: false,
  },
  bisque: {
    label: 'bisque', body: 0xe6cfae, clay: { floor: 'plaster', wall: 'plaster', k: 0.18 },
    thick: 0, thin: 0, clear: 0, peel: 0, speck: 0, specks: 0,
    cover: [0, 0], runs: 0, pool: 0, gloss: 1, bodyRough: 0.9, sheen: 0, fat: 0, recess: 0,
    ware: 0xe6cfae, wareGlossy: false,
  },
};

/** THE TABLE: each kind of built surface and the room glaze it is fired with. The one place the choice is made. */
export const ROOM_SURFACES = {
  kiln: 'ash', //          both kiln domes and the lintel over the ground floor's mouth: the ash the fire laid on them
  chimney: 'firebrick', // both chimneys, bare
  plinth: 'majolica', //   the gallery's plinths and bases: the sculpture (unglazed, as haniwa and dogu were) on white
  stand: 'tenmoku', //     the showroom's stepped stand: a dark ground for the pale ware
  hubWall: 'salt', //      the hub's four walls (their backs are the course's inner walls): a grey stoneware box in the red course
  index: 'celadon', //     the Index's pedestal: the hub's one glaze, Pip in bisque beside it
};

/** The colour id a room builder passes for a kind of built surface: `L.box(pos, size, ROOM_GLAZE_ID.kiln)`. */
export const ROOM_GLAZE_ID = Object.fromEntries(Object.entries(ROOM_SURFACES).map(([kind, g]) => [kind, ROOM_GLAZES[g].body]));

const BY_ID = new Map();
for (const [key, row] of Object.entries(ROOM_GLAZES)) if (row.surface !== false && key !== 'terracotta') BY_ID.set(row.body, { key, ...row });

/** The room glaze a colour id stands for, or null (a palette colour, dressed as it always was). */
export const roomGlazeOf = (color) => BY_ID.get(color) ?? null;

/** The colour a pot of this room glaze is given (a vertex colour on the ware), and whether it goes on the glossy ware material. */
/** The showroom's ware: the room glaze each place's pots are given, in turn (null: the porcelain kept white, as it was). */
export const SHOWROOM_WARE = {
  westTable: ['celadon'], //                      Longquan's bottles and vases
  eastTable: [null, 'tenmoku'], //                 the white porcelain beside Jian's black tea bowls
  stand: ['shino', 'shino', 'shino', 'oribe'], //  Mino's: shino with one oribe among them, pale on the tenmoku stand
  standTop: 'sangDeBoeuf', //                      the building's one red glaze, at the top, as rare as the real one
};
/** A pot's colour for its place on the showroom (an `extra` for the level's pot(): `{ color }`, or nothing to keep its own). */
export const wareFor = (place, i) => { const l = SHOWROOM_WARE[place], k = Array.isArray(l) ? l[i % l.length] : l; return k ? { color: ROOM_GLAZES[k].ware } : {}; };

const GLOSSY_WARE = new Set(Object.values(ROOM_GLAZES).filter((r) => r.wareGlossy).map((r) => r.ware));
export const wareGlossy = (color) => GLOSSY_WARE.has(color);
