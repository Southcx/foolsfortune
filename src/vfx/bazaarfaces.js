// ---------------------------------------------------------------------------------------
// THE BAZAAR'S FACES (docs/plans/CASINO.md section 9; Dovina's handoff of 2026-10-15, items 2 to 5): every face Raku's tables show,
// painted once into one canvas atlas, so the cards, the dice, the Zodiac tiles, the chips and the three cloths are one texture and one
// stock material (vfx/bazaarpieces.js builds the bodies). No words: only what a real card, die, tile or chip carries.
//   (THE FOOT, 2026-10-24: one row of sixteen cards at y 2048: the Arcana's own back and the twelve of the set's (vfx/cardbackset.js); three cells spare.)
//   (GROWN 2026-10-15, the casino clarity pass, Calissa's brief section 5: the atlas is 2048 x 2048, grown to 2048 x 2304 on 2026-10-24 for the Arcana back's cell at its foot; cards 128 x 208 with a big corner
//   index, dice faces 64 x 64, tiles 64 x 96, chips 64 x 64, SEAT CELLS (eight colours x rim, token, plate: vfx/seatlook.js), and DIM
//   TWINS of the cards, dice faces and tiles, drawn smaller and sunk into the felt for what may not be touched. Words are the DOM's.)
//   - THE HOUSE DECK: the 78 cards of a Tarot, drawn in a 64 x 104 frame and fired at 2x (the title's falling cards' size and back: title/scene.js, its moons and
//     stars in plum and cream, repainted here with the labradorite's schiller in the great moon). The 22 Major Arcana on a plum field,
//     each its numeral (0 to XXI), its second index at the foot (its number in neuralese on its bus, vfx/wornnumerals.js: South via Espada, 2026-10-29) and a picture of its reading drawn plain (the Fool at the cliff, the Tower struck, the Star over the
//     pool); the 56 Minor on cream, pips of their suit (cups, swords, pentacles, wands) in the playing-card layouts, the courts a figure
//     under its headgear, an index in two corners: big, the suit's symbol under it and its playing-card pip (hearts for cups, spades for
//     swords, diamonds for pentacles, clubs for wands) beside the symbol; each suit in its own colour (cups blue, swords green, pentacles
//     yellow, wands red), on the card's face only.
//   - THE DICE: a cell a face (32 x 32), each die of the standard set its own glaze (d4 celadon, d6 shino, d8 lapis, d10 tenmoku, d12
//     copper red, d20 plum with the schiller in its numerals), Raku's attack die in gold; each face its neuralese numeral on its bus, the bus up (Espada's numerals, South 2026-10-29); the d4's three corner
//     numbers a face, the one read is the one on top.
//   - THE ZODIAC'S TILES: twelve, a numeral and its sign; open, locked (gold) and the back.
//   - RAKU'S CHIPS: three values by colour (1 ivory, 5 cinnabar, 25 lapis) and the gold token, each a top and an edge's stripes.
//   - THE CLOTHS: felt, a gold border, the game's sigil: Querent the querent's spread (the Celtic Cross), Zodiac the wheel of the twelve
//     signs round a sun, Event Horizon a black hole in its accretion ring, Supernova Run a star bursting in shock rings, Nebula Bluff a
//     nebula's cloud round six pale stars (the six dice of a set).
//   - YOUR STONES (GROWN 2026-10-24, the palm die's numerals): the stone skin, a pale body the stones' mineral tints and dark numerals,
//     at every size (`stone4` .. `stone20`: the d20 in the dice's rows, the rest in the free corner of the cloths' row, AT.stone), so the
//     palm die, the fingers' stones and the flee's d20 are Raku's bodies; and `glow()`, a half-size mask of the stone skins' numerals
//     alone, white on black (an emissive map: the flee's numerals lit gold on the dark tsuitate).
//   - THE SPENT DIE: one cell of grey, crazed clay with no numeral (`die('ash')`, every face), worn by a die decaying or lost in Supernova
//     Run's reaction (vfx/bazaarlayoutastroll.js).
//
// Prior art: the Rider-Waite-Smith deck (Pamela Colman Smith, 1909: the pictures' readings), the Tarot de Marseille's numerals and pip
// layouts, playing cards' corner indices, Chessex's and Crystal Caste's dice (opposite faces summing to one more than the sides, the
// underlined 6 and 9), casino chips' edge inserts (Paulson's), Shut the Box's numbered tiles, the title's own card back.
//
//   freeBazaarAtlas()   (its GPU copies let go: painted and uploaded again on next use)
//   bazaarAtlas() -> { tex, glow(), card(i, dim?), die(skin, face, dim?), tile(n, state, dim?), chip(kind, part), cup(), cloth(id), seat(colour, kind) }
//   (each a uv rect [u0, v0, u1, v1]; `dim` asks the sunk twin)
//   cardFace(i) -> a 128 x 208 canvas of one card, painted alone at full size (the atlas is drawn at ATLAS_SCALE: ui/readingtable.js)
//   CARD_BACK (the house deck's back)   ARCANA_BACK (the Major Arcana's, face down)   cardIndex(c) (a Querent card { r, s } -> its index)   DIE_SKINS   SUIT_INK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { numeralFit } from './wornnumerals.js';
import { schillerInk } from './oxidation.js';
import { SUIT_COLOURS } from '../progress/casino/table.js';
import { drawHouseBack, drawArcanaBack } from './cardbacks.js';
import { BACK_SET, backCell, onBackChange, drawBackSet } from './cardbackset.js';
import { SEAT_NAMES, SEAT_KINDS, drawSeatCell, seatCellIndex } from './seatlook.js';

const W = 2048, H = 2304; // (the foot, 2048 to 2304, holds the Arcana's back: one cell no row of the square had room for)
/** The atlas drawn at this fraction of W x H (the resolution pass, 2026-10-25: an iPhone's memory; docs/plans/art/texture-budget.md): a card
 *  painted in its 64 x 104 frame lands at 1x, not 2x, 24 MB on the GPU become 6. Its painter still draws in W x H units; a reader that
 *  shows one face in the page (ui/readingtable.js) paints it alone at full size (`cardFace`). */
const ATLAS_SCALE = 0.5;
/** Where each kind of face lies in the atlas (pixels). 128 x 208 cards (16 x 5), 64 dice (32 x 5), 64 x 96 tiles, 64 chips, 24 seat cells
 *  of 64, five cloths of 256 in a row, then the dim twins (cards 48 x 78, dice 32, tiles 32 x 48) in the foot. */
const AT = { card: { x: 0, y: 0, w: 128, h: 208, cols: 16 }, die: { x: 0, y: 1040, s: 64, cols: 32 }, tile: { x: 0, y: 1360, w: 64, h: 96 },
  chip: { x: 0, y: 1456, s: 64 }, seat: { x: 512, y: 1456, s: 64 }, cloth: { x: 0, y: 1520, s: 256, cols: 5 },
  stone: { x: 1280, y: 1520, s: 64, cols: 12 }, // (your stones d4 .. d12, 40 cells in the 768 x 256 the five cloths leave)
  dimCard: { x: 0, y: 1776, w: 48, h: 78, cols: 42 }, dimDie: { x: 0, y: 1932, s: 32, cols: 64 }, dimTile: { x: 0, y: 1996, w: 32, h: 48 },
  foot: { x: 0, y: 2048, w: 128, h: 208, cols: 16 } }; // (the foot's one row of sixteen cards: the Arcana's own back, then the twelve of the set: vfx/cardbackset.js)
export const CARD_BACK = 78;
const CARD_EDGE = 79;
/** The Arcana's back (cardbacks.js): the Major Arcana face down, off the grid, in the atlas's foot. `card(ARCANA_BACK)` is the back the Arcana wears now
 *  (cardbackset.js: its own, or one of the set at 81 .. 92, each a foot cell); the foot's backs have no dim twin. `card(CARD_BACK)` is the house deck's now. */
export const ARCANA_BACK = 80;
/** A Querent card ({ r: 1..14, s: 0..3 }) as its index in the deck: the 22 Major Arcana first, then the suits in the seat suits' order. */
export const cardIndex = (c) => 22 + c.s * 14 + (c.r - 1);
/** The suits' inks (cups blue, swords green, pentacles yellow, wands red: SUIT_COLOURS, Dovina's data; cups, swords, pentacles, wands).
 *  A suit's colour is only ever on a card's face, with its symbol and its playing-card pip; a seat's colour never is. */
export const SUIT_INK = SUIT_COLOURS.map((c) => c.hex);
const OUTLINE = '#1c1220';
const K = { cream: '#efe2c4', paper: '#f4ead2', gold: '#e8c35a', goldDeep: '#a87a22', plum: '#3a2148', deep: '#24132e', ink: '#2a1a24', felt: '#1f6b4a' };
/** The dice's glazes: body, numeral, and whether the numeral carries the schiller. */
export const DIE_SKINS = {
  4: { body: '#7fb7a0', ink: '#1c3a30' }, 6: { body: '#efe6d2', ink: '#5a1e2a' }, 8: { body: '#2f5aa8', ink: '#f2d27a' },
  10: { body: '#7a3e18', ink: '#f4e3c0' }, 12: { body: '#a8322a', ink: '#f2d27a' }, 20: { body: '#2a1a3a', ink: null },
  atk: { body: '#d9a441', ink: '#3a1a12' }, cup: { body: '#3b2418', ink: '#d9a441' },
  stone: { body: '#f6f2ec', ink: '#241820' }, // (your own dice: a pale body a stone's colour tints, its numerals dark: vfx/godhand/palmdie.js, vfx/duelview/flee.js)
};
/** The cloths in the atlas, in their order (an unknown table's id falls back to the first). */
const CLOTHS = ['querent', 'zodiac', 'eventhorizon', 'supernova', 'nebula'];
const SKIN_ORDER = ['4', '6', '8', '10', '12', '20', 'atk4', 'atk6', 'atk8', 'atk10', 'atk12', 'atk20'];
const STONE_SIDES = [4, 6, 8, 10, 12]; // (the stone skin's sizes in AT.stone, in this order; the d20 is in the dice's rows)
/** Paint every stone cell (its own d20 in the dice's rows, the rest in AT.stone) in `skin`: the atlas's, and the glow mask's. */
function stoneCells(g, dieAt, skin) {
  for (let f = 0; f < 20; f++) dieCell(g, dieAt.stone20 + f, 20, f, skin);
  for (const n of STONE_SIDES) for (let f = 0; f < n; f++) dieCell(g, dieAt[`stone${n}`] + f, n, f, skin, AT.stone);
}

/** Your stones on their own (a phone's memory, Petra's measure 2026-10-25: the palm die and the flee's d20 held the whole 2048 x 2304
 *  house atlas and its glow on the GPU from boot, about 31 MB, for 60 cells): the stone skin's faces, d20 then d4 .. d12, at the atlas's
 *  cell size, 512 x 512, baked; its glow the same cells' numerals white on black. `die(skin, f)` the face's uvs here. */
const STONE_AT = { x: 0, y: 0, s: 64, cols: 8 };
let STONES = null;
export function stoneAtlas() {
  if (STONES) return STONES;
  const at = {}; let k = 0; for (const n of [20, ...STONE_SIDES]) { at[n] = k; k += n; }
  const W = STONE_AT.cols * STONE_AT.s, H = Math.ceil(k / STONE_AT.cols) * STONE_AT.s;
  const paint = (skin, ground) => (g) => { g.imageSmoothingEnabled = false; g.fillStyle = ground; g.fillRect(0, 0, W, H); for (const n of [20, ...STONE_SIDES]) for (let f = 0; f < n; f++) dieCell(g, at[n] + f, n, f, skin, STONE_AT); };
  const tex = bakedCanvasTexture(paint(DIE_SKINS.stone, K.deep), W, H);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.anisotropy = 4;
  const rect = (x, y, w, h, inset) => [(x + inset) / W, 1 - (y + h - inset) / H, (x + w - inset) / W, 1 - (y + inset) / H];
  let glow = null;
  STONES = {
    tex,
    glow: () => { if (!glow) { glow = bakedCanvasTexture(paint({ body: '#000', ink: '#fff' }, '#000'), W, H); glow.colorSpace = THREE.SRGBColorSpace; } return glow; },
    die: (skin, f) => { const c = at[+String(skin).replace('stone', '')] + f, S = STONE_AT.s; return rect(STONE_AT.x + (c % STONE_AT.cols) * S, STONE_AT.y + Math.floor(c / STONE_AT.cols) * S, S, S, 1); },
  };
  return STONES;
}

let ATLAS = null;
/** Where each die skin's faces start in the die cells (laid out before any painting, so the uvs never wait on a canvas). */
function dieLayout() {
  let k = 0; const dieAt = {};
  for (const key of SKIN_ORDER) { dieAt[key] = k; k += +key.replace('atk', ''); }
  dieAt.cup = k++; dieAt.ash = k++;
  const dieCount = k;
  dieAt.stone20 = k; k += 20; // (after dieCount: no dim twin, the dim rows are full)
  let j = 0; for (const n of STONE_SIDES) { dieAt[`stone${n}`] = j; j += n; } // (indices in AT.stone)
  return { dieAt, dieCount };
}
/** Every face painted into the atlas's canvas (called once, and again only if the canvas is asked for after it went to the GPU). */
function paintAtlas(g, dieAt, dieCount) {
  const cv = g.canvas; g.imageSmoothingEnabled = false;
  g.fillStyle = K.deep; g.fillRect(0, 0, W, H);
  const card = (i, draw) => cell(g, AT.card, i, () => { g.scale(2, 2); draw(); }); // (a card is drawn in its 64 x 104 frame, fired at 2x)
  for (let i = 0; i < 22; i++) card(i, () => major(g, i));
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) card(cardIndex({ r, s }), () => minor(g, r, s));
  card(CARD_BACK, () => drawHouseBack(g)); cell(g, AT.foot, 0, () => { g.scale(2, 2); drawArcanaBack(g); });
  BACK_SET.forEach((b, k) => cell(g, AT.foot, 1 + k, () => { g.scale(2, 2); drawBackSet(g, b.id); })); card(CARD_EDGE, () => { g.fillStyle = K.cream; g.fillRect(0, 0, 64, 104); });
  for (const key of SKIN_ORDER) { const atk = key.startsWith('atk'), sides = +key.replace('atk', ''); for (let f = 0; f < sides; f++) dieCell(g, dieAt[key] + f, sides, f, atk ? DIE_SKINS.atk : DIE_SKINS[sides]); }
  dieCell(g, dieAt.cup, 0, 0, DIE_SKINS.cup);
  ashCell(g, dieAt.ash);
  stoneCells(g, dieAt, DIE_SKINS.stone);
  for (let n = 1; n <= 12; n++) for (const [j, st] of ['open', 'locked'].entries()) tileCell(g, (n - 1) * 2 + j, n, st);
  tileCell(g, 24, 0, 'back');
  [['1', '#efe6d2', '#5a1e2a'], ['5', '#b8322a', '#f4e3c0'], ['25', '#2f5aa8', '#e8c35a'], ['gold', '#e8c35a', '#7a4a12']].forEach(([, body, ink], j) => chipCells(g, j, body, ink));
  SEAT_NAMES.forEach((name) => SEAT_KINDS.forEach((kind) => { const c = seatCellIndex(name, kind), S = AT.seat.s; g.save(); g.translate(AT.seat.x + c * S, AT.seat.y); drawSeatCell(g, name, kind, S); g.restore(); }));
  CLOTHS.forEach((id, j) => clothCell(g, j, id));
  // the dim twins: the same faces, smaller, desaturated and sunk toward the felt's ink (a piece the table will not take right now)
  const dim = (sx, sy, sw, sh, dx, dy, dw, dh) => { // (an opaque source, so the veil is exact)
    const px = cv.width / W; // (the source rect in the canvas's own pixels: the atlas may be drawn at ATLAS_SCALE)
    g.save(); g.imageSmoothingEnabled = true; g.drawImage(cv, sx * px, sy * px, sw * px, sh * px, dx, dy, dw, dh);
    g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.8)'; g.fillRect(dx, dy, dw, dh);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(23,17,31,0.58)'; g.fillRect(dx, dy, dw, dh); g.restore();
  };
  for (let i = 0; i < 80; i++) dim(AT.card.x + (i % AT.card.cols) * AT.card.w, AT.card.y + Math.floor(i / AT.card.cols) * AT.card.h, AT.card.w, AT.card.h,
    AT.dimCard.x + (i % AT.dimCard.cols) * AT.dimCard.w, AT.dimCard.y + Math.floor(i / AT.dimCard.cols) * AT.dimCard.h, AT.dimCard.w, AT.dimCard.h);
  for (let c = 0; c < dieCount; c++) dim(AT.die.x + (c % AT.die.cols) * AT.die.s, AT.die.y + Math.floor(c / AT.die.cols) * AT.die.s, AT.die.s, AT.die.s,
    AT.dimDie.x + (c % AT.dimDie.cols) * AT.dimDie.s, AT.dimDie.y + Math.floor(c / AT.dimDie.cols) * AT.dimDie.s, AT.dimDie.s, AT.dimDie.s);
  for (let c = 0; c < 25; c++) dim(AT.tile.x + c * AT.tile.w, AT.tile.y, AT.tile.w, AT.tile.h, AT.dimTile.x + c * AT.dimTile.w, AT.dimTile.y, AT.dimTile.w, AT.dimTile.h);
  // the house deck's dim twin is the back it wears now (read here, so a repaint after a change of back draws the new one)
  const c = backCell('house'), foot = c >= ARCANA_BACK;
  dim(foot ? AT.foot.x + (c - ARCANA_BACK) * AT.foot.w : AT.card.x + (c % AT.card.cols) * AT.card.w, foot ? AT.foot.y : AT.card.y + Math.floor(c / AT.card.cols) * AT.card.h, AT.card.w, AT.card.h,
    AT.dimCard.x + (CARD_BACK % AT.dimCard.cols) * AT.dimCard.w, AT.dimCard.y + Math.floor(CARD_BACK / AT.dimCard.cols) * AT.dimCard.h, AT.dimCard.w, AT.dimCard.h);
}
/** The one atlas (painted on first ask; shared by every table). A baked canvas (render/bakedcanvas.js: a phone's memory, Petra's
 *  measure 2026-10-24, 22.5 MB of canvas held beside its GPU copy): its pixels go once the GPU has them, painted again only when asked
 *  for (`canvas`, a change of the house deck's back). A reader of `canvas` calls `release()` when done with it. */
/** The house atlas's GPU copies let go, if it was made (a phone's memory, 2026-10-25: 6.3 MB at 1024 x 1152, its glow mask as much again if made, on an emulated
 *  iPhone XR, kept on the GPU after the bazaar was left). The hall's teardown calls it. */
export function freeBazaarAtlas() { ATLAS?.free(); }

export function bazaarAtlas() {
  if (ATLAS) return ATLAS;
  const { dieAt, dieCount } = dieLayout();
  const tex = bakedCanvasTexture((g) => paintAtlas(g, dieAt, dieCount), W, H, { scale: ATLAS_SCALE });
  onBackChange((deck) => { if (deck === 'house') { tex.source.data = null; tex.needsUpdate = true; } }); // (painted again with the new back on its next upload)
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.anisotropy = 4;
  const rect = (x, y, w, h, inset = 0.5) => [(x + inset) / W, 1 - (y + h - inset) / H, (x + w - inset) / W, 1 - (y + inset) / H];
  const cardRect = (i, dim) => dim ? rect(AT.dimCard.x + (i % AT.dimCard.cols) * AT.dimCard.w, AT.dimCard.y + Math.floor(i / AT.dimCard.cols) * AT.dimCard.h, AT.dimCard.w, AT.dimCard.h)
    : rect(AT.card.x + (i % AT.card.cols) * AT.card.w, AT.card.y + Math.floor(i / AT.card.cols) * AT.card.h, AT.card.w, AT.card.h);
  const chipIx = { 1: 0, 5: 1, 25: 2, gold: 3 };
  const dieCell_ = (skin, f) => dieAt[skin] + (skin === 'ash' ? 0 : f);
  let glow = null;
  ATLAS = {
    tex,
    /** The painted canvas (painted again if it already went to the GPU); `release()` when done with it. */
    get canvas() { return tex.image; },
    release: () => { tex.source.data = null; },
    /** Its GPU copies let go (the hall's teardown: the atlas and the glow mask are baked canvases, painted and uploaded again the next
     *  time a table, a reading or a piece draws with them, so nothing need ask first). */
    free: () => { tex.dispose(); glow?.dispose(); },
    /** The stone skins' numerals alone, white on black, at half size (the same uvs): painted on first ask. */
    glow: () => {
      if (glow) return glow;
      glow = bakedCanvasTexture((g2) => { g2.fillStyle = '#000'; g2.fillRect(0, 0, W, H); stoneCells(g2, dieAt, { body: '#000', ink: '#fff' }); }, W, H, { scale: 0.5 });
      glow.colorSpace = THREE.SRGBColorSpace; return glow;
    },
    card: (i, dim = false) => { if (i === ARCANA_BACK) i = backCell('arcana'); else if (i === CARD_BACK && !dim) i = backCell('house'); return i >= ARCANA_BACK ? rect(AT.foot.x + (i - ARCANA_BACK) * AT.foot.w, AT.foot.y, AT.foot.w, AT.foot.h) : cardRect(i, dim); },
    edge: () => ATLAS.card(CARD_EDGE),
    die: (skin, f, dim = false) => { const c = dieCell_(skin, f), A = /^stone(4|6|8|10|12)$/.test(skin) ? AT.stone : dim ? AT.dimDie : AT.die; return rect(A.x + (c % A.cols) * A.s, A.y + Math.floor(c / A.cols) * A.s, A.s, A.s, 1); },
    cup: () => { const c = dieAt.cup; return rect(AT.die.x + (c % AT.die.cols) * AT.die.s, AT.die.y + Math.floor(c / AT.die.cols) * AT.die.s, AT.die.s, AT.die.s, 8); },
    tile: (n, st, dim = false) => { const c = st === 'back' ? 24 : (n - 1) * 2 + (st === 'locked' ? 1 : 0), A = dim ? AT.dimTile : AT.tile; return rect(A.x + c * A.w, A.y, A.w, A.h); },
    chip: (kind, part) => rect(AT.chip.x + (chipIx[kind] * 2 + (part === 'edge' ? 1 : 0)) * AT.chip.s, AT.chip.y, AT.chip.s, AT.chip.s, 1),
    seat: (colour, kind) => rect(AT.seat.x + seatCellIndex(colour, kind) * AT.seat.s, AT.seat.y, AT.seat.s, AT.seat.s, 1),
    cloth: (id) => { const j = Math.max(0, CLOTHS.indexOf(id)); return rect(AT.cloth.x + (j % AT.cloth.cols) * AT.cloth.s, AT.cloth.y + Math.floor(j / AT.cloth.cols) * AT.cloth.s, AT.cloth.s, AT.cloth.s, 1); },
  };
  return ATLAS;
}

// ------------------------------------------------------------------ drawing helpers (a cell's own coordinates)
/** One card of the atlas (`i` as `card(i)` takes it: a face 0..77, the house back 78, the edge 79, the Arcana's own back 80, a set back
 *  81 ..) painted alone on a 128 x 208 canvas, the atlas's cell at full size, for the page (ui/readingtable.js), never cropped from the
 *  atlas (drawn at ATLAS_SCALE, and painted whole to crop one). */
export function cardFace(i) {
  const c = document.createElement('canvas'); c.width = AT.card.w; c.height = AT.card.h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = K.deep; g.fillRect(0, 0, c.width, c.height);
  g.save(); g.scale(2, 2);
  if (i < 22) major(g, i);
  else if (i === CARD_BACK) drawHouseBack(g);
  else if (i === CARD_EDGE) { g.fillStyle = K.cream; g.fillRect(0, 0, 64, 104); }
  else if (i === ARCANA_BACK) drawArcanaBack(g);
  else if (i > ARCANA_BACK) drawBackSet(g, BACK_SET[i - ARCANA_BACK - 1]?.id);
  else { for (let s = 0; s < 4; s++) for (let r = 1; r <= 14; r++) if (cardIndex({ r, s }) === i) minor(g, r, s); }
  g.restore();
  return c;
}
function cell(g, A, i, draw) { g.save(); g.translate(A.x + (i % A.cols) * A.w, A.y + Math.floor(i / A.cols) * A.h); g.beginPath(); g.rect(0, 0, A.w, A.h); g.clip(); draw(); g.restore(); }
const fill = (g, c) => { g.fillStyle = c; g.fill(); };
const circ = (g, x, y, r, c) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fill(g, c); };
const ring = (g, x, y, r, w, c) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.lineWidth = w; g.strokeStyle = c; g.stroke(); };
const box = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const poly = (g, pts, c) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); fill(g, c); };
const line = (g, x1, y1, x2, y2, w, c) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.stroke(); };
function star(g, x, y, r1, r2, n, c, rot = -Math.PI / 2) { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, r = i % 2 ? r2 : r1; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } poly(g, p, c); }
function moon(g, x, y, r, c, bg, off = 0.45) { circ(g, x, y, r, c); circ(g, x + r * off, y - r * 0.15, r * 0.85, bg); }
/** A figure: a head and a robe (the deck's people are one shape, told by what they hold). */
function figure(g, x, y, s, c, head = c) { poly(g, [[x, y - s * 0.55], [x - s * 0.45, y + s], [x + s * 0.45, y + s]], c); circ(g, x, y - s * 0.75, s * 0.26, head); }
const sch = (ph) => '#' + schillerInk(ph, new THREE.Color(), { sheen: 1, floor: 0.6 }).convertLinearToSRGB().getHexString();
function text(g, s, x, y, px, c, align = 'center') { g.font = `bold ${px}px Georgia, 'Times New Roman', serif`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = c; g.fillText(s, x, y); }
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

// ------------------------------------------------------------------ the Major Arcana
function major(g, i) {
  box(g, 0, 0, 64, 104, K.cream); box(g, 2, 2, 60, 100, K.goldDeep); box(g, 3, 3, 58, 98, K.plum);
  box(g, 6, 15, 52, 76, K.deep); // (the picture's window)
  text(g, ROMAN[i], 32, 9, i > 17 ? 10 : 12, K.gold);
  numeralFit(g, i, { x: 32, y: 96.5, w: 40, h: 8.5, ink: K.gold, lw: 1.1 }); // (the second index: its number in neuralese at the foot, where a bar and a dot stood)
  g.save(); g.beginPath(); g.rect(6, 15, 52, 76); g.clip(); PICTURES[i](g); g.restore();
}
const G = K.gold, C = K.cream, D = K.deep, P = K.plum;
/** Each arcanum's picture, its reading drawn plain (Rider-Waite-Smith's scenes, reduced to what reads at 64 x 104). */
const PICTURES = [
  (g) => { circ(g, 46, 28, 7, G); poly(g, [[6, 70], [40, 70], [44, 91], [6, 91]], P); figure(g, 30, 52, 11, C); line(g, 36, 44, 46, 36, 1.5, G); circ(g, 47, 35, 2.5, sch(0.2)); circ(g, 20, 66, 3, C); }, // 0 the Fool: at the cliff's edge, the sun behind, the little dog
  (g) => { figure(g, 32, 58, 13, C); line(g, 32, 40, 40, 26, 2, G); g.lineWidth = 1.5; g.strokeStyle = G; g.beginPath(); g.ellipse(27, 26, 5, 3, 0, 0, Math.PI * 2); g.ellipse(37, 26, 5, 3, 0, 0, Math.PI * 2); g.stroke(); box(g, 14, 80, 36, 4, P); }, // I the Magician: the wand raised, the lemniscate
  (g) => { box(g, 10, 22, 7, 66, '#11080f'); box(g, 47, 22, 7, 66, C); figure(g, 32, 56, 11, sch(0.55)); moon(g, 32, 84, 6, C, D, 0.5); }, // II the High Priestess: the pillars, the moon at her feet
  (g) => { for (let k = 0; k < 6; k++) star(g, 20 + k * 4.8, 24, 2.2, 1, 5, G); figure(g, 32, 58, 13, '#6a9a4a'); for (let k = 0; k < 5; k++) line(g, 10 + k * 10, 90, 12 + k * 10, 78, 1.5, G); }, // III the Empress: the crown of stars, the wheat
  (g) => { box(g, 18, 40, 28, 44, P); box(g, 14, 36, 6, 8, G); box(g, 44, 36, 6, 8, G); figure(g, 32, 58, 11, '#b8452e'); circ(g, 22, 54, 3, G); line(g, 42, 46, 42, 60, 2, G); }, // IV the Emperor: the throne, the orb and ankh
  (g) => { line(g, 32, 22, 32, 70, 2, G); line(g, 25, 30, 39, 30, 2, G); line(g, 27, 36, 37, 36, 2, G); line(g, 29, 42, 35, 42, 2, G); line(g, 18, 88, 30, 74, 2, C); line(g, 46, 88, 34, 74, 2, G); }, // V the Hierophant: the triple cross, the crossed keys
  (g) => { circ(g, 32, 28, 9, G); figure(g, 20, 68, 10, C); figure(g, 44, 68, 10, '#e8a0a0'); line(g, 26, 40, 38, 40, 1, sch(0.3)); }, // VI the Lovers: two under the angel's sun
  (g) => { for (let k = 0; k < 5; k++) star(g, 16 + k * 8, 22, 2.2, 1, 5, G); box(g, 16, 46, 32, 22, P); figure(g, 32, 46, 9, C); circ(g, 22, 80, 6, '#11080f'); circ(g, 42, 80, 6, C); }, // VII the Chariot: the canopy of stars, the black and white sphinxes
  (g) => { circ(g, 32, 60, 13, G); circ(g, 32, 61, 8, '#c9902a'); circ(g, 29, 58, 1.2, D); circ(g, 35, 58, 1.2, D); g.lineWidth = 1.5; g.strokeStyle = C; g.beginPath(); g.ellipse(27, 30, 5, 3, 0, 0, Math.PI * 2); g.ellipse(37, 30, 5, 3, 0, 0, Math.PI * 2); g.stroke(); }, // VIII Strength: the lion, the lemniscate
  (g) => { poly(g, [[32, 34], [16, 90], [48, 90]], '#6a6a7a'); circ(g, 32, 34, 6, '#6a6a7a'); line(g, 44, 40, 48, 88, 1.5, G); box(g, 39, 40, 9, 10, G); star(g, 43.5, 45, 3.5, 1.5, 6, C); }, // IX the Hermit: the hood, the lantern and its star
  (g) => { ring(g, 32, 52, 18, 3, G); ring(g, 32, 52, 9, 1.5, sch(0.4)); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; line(g, 32, 52, 32 + Math.cos(a) * 18, 52 + Math.sin(a) * 18, 1.5, G); } circ(g, 32, 52, 3, C); }, // X the Wheel of Fortune
  (g) => { line(g, 32, 22, 32, 64, 2, C); line(g, 30, 26, 34, 26, 2, C); line(g, 16, 70, 48, 70, 2, G); line(g, 32, 64, 32, 70, 2, G); for (const x of [18, 46]) { line(g, 32, 70, x, 80, 1, G); poly(g, [[x - 7, 80], [x + 7, 80], [x, 86]], G); } }, // XI Justice: the sword, the scales
  (g) => { line(g, 12, 22, 52, 22, 3, '#6a9a4a'); line(g, 32, 22, 32, 40, 1.5, C); poly(g, [[32, 40], [22, 70], [42, 70]], C); circ(g, 32, 76, 6, C); ring(g, 32, 76, 9, 1.5, G); }, // XII the Hanged Man: from the tau, the halo
  (g) => { circ(g, 32, 40, 10, C); circ(g, 28, 40, 2.5, D); circ(g, 36, 40, 2.5, D); box(g, 28, 47, 8, 4, C); line(g, 46, 20, 46, 88, 2, '#8a6a4a'); g.lineWidth = 3; g.strokeStyle = C; g.beginPath(); g.arc(34, 22, 14, -0.1, 1.2); g.stroke(); poly(g, [[12, 70], [26, 66], [26, 80]], '#11080f'); circ(g, 19, 73, 2.5, C); }, // XIII Death: the skull, the scythe, the white rose
  (g) => { figure(g, 32, 50, 12, C); poly(g, [[10, 74], [18, 74], [16, 84], [12, 84]], G); poly(g, [[46, 58], [54, 58], [52, 68], [48, 68]], G); line(g, 18, 74, 46, 62, 2, sch(0.7)); circ(g, 32, 28, 4, G); }, // XIV Temperance: the stream poured from cup to cup
  (g) => { star(g, 32, 30, 10, 4, 5, '#b8452e', Math.PI / 2); poly(g, [[16, 46], [22, 36], [24, 48]], C); poly(g, [[48, 46], [42, 36], [40, 48]], C); box(g, 22, 58, 20, 26, P); line(g, 22, 70, 14, 84, 1, G); line(g, 42, 70, 50, 84, 1, G); }, // XV the Devil: the reversed star, the horns, the chains
  (g) => { box(g, 22, 34, 20, 56, '#8a7a6a'); poly(g, [[20, 34], [44, 34], [40, 24], [24, 24]], G); poly(g, [[48, 14], [36, 34], [42, 36], [30, 54], [46, 32], [40, 30]], C); box(g, 28, 50, 6, 8, G); box(g, 30, 68, 6, 8, G); circ(g, 14, 64, 2, G); circ(g, 50, 74, 2, G); }, // XVI the Tower: struck, its crown thrown
  (g) => { star(g, 32, 34, 12, 4, 8, G); for (const [x, y] of [[12, 22], [52, 22], [14, 48], [50, 48], [20, 30], [44, 30], [32, 56]]) star(g, x, y, 3, 1.2, 8, C); box(g, 6, 76, 52, 15, sch(0.5)); figure(g, 32, 72, 7, C); }, // XVII the Star: the great star and seven, the pool
  (g) => { circ(g, 32, 34, 12, '#d9d0e8'); circ(g, 37, 31, 10, D); box(g, 8, 50, 9, 30, '#6a6a7a'); box(g, 47, 50, 9, 30, '#6a6a7a'); box(g, 6, 82, 52, 9, sch(0.15)); circ(g, 32, 84, 3, '#b8452e'); }, // XVIII the Moon: the face, the two towers, the crayfish in the pool
  (g) => { for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; line(g, 32 + Math.cos(a) * 12, 38 + Math.sin(a) * 12, 32 + Math.cos(a) * (k % 2 ? 18 : 22), 38 + Math.sin(a) * (k % 2 ? 18 : 22), 2, G); } circ(g, 32, 38, 11, '#f2d27a'); circ(g, 28, 36, 1.2, '#7a4a12'); circ(g, 36, 36, 1.2, '#7a4a12'); figure(g, 32, 76, 8, C); }, // XIX the Sun: the face, the child below
  (g) => { poly(g, [[14, 30], [44, 20], [46, 30]], G); box(g, 30, 22, 2, 10, C); box(g, 26, 26, 10, 2, C); box(g, 6, 76, 52, 15, '#4a6a8a'); for (const x of [18, 32, 46]) figure(g, x, 70, 7, C); }, // XX Judgement: the trumpet and its banner, the risen
  (g) => { g.lineWidth = 4; g.strokeStyle = '#6a9a4a'; g.beginPath(); g.ellipse(32, 54, 15, 26, 0, 0, Math.PI * 2); g.stroke(); figure(g, 32, 54, 10, sch(0.85)); for (const [x, y] of [[12, 22], [52, 22], [12, 86], [52, 86]]) circ(g, x, y, 3.5, G); }, // XXI the World: the wreath, the dancer, the four
];

// ------------------------------------------------------------------ the Minor Arcana
/** A suit's mark at (x, y), `s` its size in pixels. */
function suit(g, s, x, y, z, c = SUIT_INK[s]) {
  if (c === SUIT_INK[s]) suitMark(g, s, x, y, z * 1.22, OUTLINE); // (a dark keyline under a suit's own colour: yellow and green must read on cream)
  suitMark(g, s, x, y, z, c);
}
function suitMark(g, s, x, y, z, c) {
  if (s === 0) { g.beginPath(); g.arc(x, y - z * 0.15, z * 0.42, 0, Math.PI); fill(g, c); box(g, x - z * 0.42, y - z * 0.2, z * 0.84, z * 0.12, c); box(g, x - 0.6, y + z * 0.2, 1.4, z * 0.22, c); box(g, x - z * 0.25, y + z * 0.38, z * 0.5, z * 0.1, c); }
  else if (s === 1) { poly(g, [[x, y - z * 0.5], [x + z * 0.1, y + z * 0.2], [x - z * 0.1, y + z * 0.2]], c); box(g, x - z * 0.28, y + z * 0.18, z * 0.56, z * 0.1, c); box(g, x - 0.6, y + z * 0.26, 1.4, z * 0.22, c); }
  else if (s === 2) { ring(g, x, y, z * 0.42, Math.max(1, z * 0.1), c); star(g, x, y, z * 0.34, z * 0.14, 5, c); }
  else { line(g, x - z * 0.3, y + z * 0.45, x + z * 0.3, y - z * 0.45, Math.max(1.2, z * 0.14), c); circ(g, x + z * 0.12, y - z * 0.1, z * 0.1, '#6a9a4a'); circ(g, x - z * 0.12, y + z * 0.12, z * 0.1, '#6a9a4a'); }
}
/** A playing-card pip (hearts for cups, spades for swords, diamonds for pentacles, clubs for wands: SUIT_COLOURS' pip), drawn as a path so no font is needed. */
function pip(g, s, x, y, z, c = SUIT_INK[s]) {
  const one = (k, col) => {
    g.fillStyle = col; g.beginPath();
    if (s === 0) { g.moveTo(x, y + k * 0.5); g.bezierCurveTo(x - k * 0.75, y, x - k * 0.5, y - k * 0.55, x, y - k * 0.2); g.bezierCurveTo(x + k * 0.5, y - k * 0.55, x + k * 0.75, y, x, y + k * 0.5); g.fill(); }
    else if (s === 1) { g.moveTo(x, y - k * 0.5); g.bezierCurveTo(x + k * 0.75, y, x + k * 0.5, y + k * 0.4, x + k * 0.1, y + k * 0.2); g.lineTo(x + k * 0.2, y + k * 0.5); g.lineTo(x - k * 0.2, y + k * 0.5); g.lineTo(x - k * 0.1, y + k * 0.2); g.bezierCurveTo(x - k * 0.5, y + k * 0.4, x - k * 0.75, y, x, y - k * 0.5); g.fill(); }
    else if (s === 2) { g.moveTo(x, y - k * 0.55); g.lineTo(x + k * 0.4, y); g.lineTo(x, y + k * 0.55); g.lineTo(x - k * 0.4, y); g.closePath(); g.fill(); }
    else { for (const [u, v] of [[0, -0.28], [-0.28, 0.12], [0.28, 0.12]]) { g.beginPath(); g.arc(x + u * k, y + v * k, k * 0.24, 0, Math.PI * 2); g.fill(); } g.fillRect(x - k * 0.06, y, k * 0.12, k * 0.5); }
  };
  one(z * 1.2, OUTLINE); one(z, c);
}
/** Pip places on a 1 x 1 field (the playing card's layouts, the Tarot de Marseille's for 7 to 10). */
const PIPS = { 2: [[0.5, 0.15], [0.5, 0.85]], 3: [[0.5, 0.15], [0.5, 0.5], [0.5, 0.85]], 4: [[0.28, 0.15], [0.72, 0.15], [0.28, 0.85], [0.72, 0.85]],
  5: [[0.28, 0.15], [0.72, 0.15], [0.5, 0.5], [0.28, 0.85], [0.72, 0.85]], 6: [[0.28, 0.15], [0.72, 0.15], [0.28, 0.5], [0.72, 0.5], [0.28, 0.85], [0.72, 0.85]] };
PIPS[7] = [...PIPS[6], [0.5, 0.32]]; PIPS[8] = [...PIPS[6], [0.5, 0.32], [0.5, 0.68]];
PIPS[9] = [[0.28, 0.12], [0.72, 0.12], [0.28, 0.37], [0.72, 0.37], [0.5, 0.5], [0.28, 0.63], [0.72, 0.63], [0.28, 0.88], [0.72, 0.88]];
PIPS[10] = [[0.28, 0.12], [0.72, 0.12], [0.5, 0.25], [0.28, 0.37], [0.72, 0.37], [0.28, 0.63], [0.72, 0.63], [0.5, 0.75], [0.28, 0.88], [0.72, 0.88]];
const INDEX = [null, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];
function minor(g, r, s) {
  const ink = SUIT_INK[s];
  box(g, 0, 0, 64, 104, K.cream); box(g, 2, 2, 60, 100, ink); box(g, 3, 3, 58, 98, K.paper);
  const corner = () => { // (the index big, the tarot suit's symbol under it, the playing-card pip under the symbol: the corner column only, x under 17, the pip field starts at x 22)
    text(g, INDEX[r], 11, 11, r === 10 || r === 12 ? 13 : 17, ink); suit(g, s, 8, 28, 8); pip(g, s, 10, 41, 6.5);
  };
  corner(); g.save(); g.translate(64, 104); g.rotate(Math.PI); corner(); g.restore();
  if (r === 1) { ring(g, 32, 52, 15, 1, K.gold); suit(g, s, 32, 52, 22); return; }
  if (r <= 10) { for (const [u, v] of PIPS[r]) suit(g, s, 32 + (u - 0.5) * 26, 20 + v * 64, 9); return; }
  // the courts: a figure, what it wears says which (a page's cap, a knight's plume, a queen's crown, a king's crown and cross)
  box(g, 14, 22, 36, 60, '#e6d6b4'); figure(g, 32, 56, 13, ink, K.cream);
  if (r === 11) box(g, 27, 32, 10, 3, K.goldDeep);
  else if (r === 12) { box(g, 26, 32, 12, 4, '#8a8a9a'); line(g, 36, 32, 42, 24, 2, '#b8452e'); }
  else { poly(g, [[25, 34], [25, 28], [28, 31], [32, 26], [36, 31], [39, 28], [39, 34]], K.gold); if (r === 14) { box(g, 31, 21, 2, 6, K.gold); box(g, 29, 23, 6, 2, K.gold); } }
  suit(g, s, 32, 72, 12, K.cream);
}
// ------------------------------------------------------------------ the dice
/** One face of a die: its glaze, its numeral (or the d6's pips; the d4's three corner numbers, read from the vertex on top). */
function dieCell(g, c, sides, f, skin, A = AT.die) {
  const S = 32, x0 = A.x + (c % A.cols) * A.s, y0 = A.y + Math.floor(c / A.cols) * A.s;
  g.save(); g.translate(x0, y0); g.scale(2, 2); g.beginPath(); g.rect(0, 0, S, S); g.clip(); // (drawn in a 32 frame, fired at 2x)
  box(g, 0, 0, S, S, skin.body);
  const ink = skin.ink || sch(f / Math.max(1, sides));
  if (sides === 0) { box(g, 0, 0, S, 3, skin.ink); box(g, 0, 29, S, 3, skin.ink); for (let k = 0; k < 4; k++) star(g, 4 + k * 8, 16, 2.5, 1, 4, skin.ink, 0); } // (the dealer's cup: a gold lip and stars)
  else if (sides === 6) { for (const [u, v] of D6_PIPS[f + 1]) circ(g, 6 + u * 20, 6 + v * 20, 3.6, ink); }
  else if (sides === 4) { // (the corners of the cell's triangle: bazaarpieces.js maps each face's vertices onto these)
    const vs = D4_FACES[f]; D4_CORNERS.forEach(([u, v], k) => { const x = 16 + (u - 0.5) * 22, y = 16 + (v - 0.5) * 22; g.save(); g.translate(x, y); g.rotate(Math.atan2(y - 18, x - 16) + Math.PI / 2); numeralAt(g, vs[k] + 1, 0, 0, 8, 9, ink); g.restore(); });
  } else numeralAt(g, f + 1, 16, 16, sides === 20 ? 22 : 18, sides === 20 ? 20 : 19, ink); // (a neuralese numeral, its bus up: 6 and 9 never confused; Espada's numerals, South 2026-10-29)
  g.restore();
}
/** A neuralese numeral (Espada's, NEURALESE.md 2b: a digit's sum hung on its pin from the bus) centred on (cx, cy), fitted to w x h. */
const numeralAt = (g, n, cx, cy, w, h, ink) => numeralFit(g, n, { x: cx, y: cy, w, h, ink, even: false });
/** The spent die: grey clay crazed, a dark crack across, no numeral (every face of it the same cell). */
function ashCell(g, c) {
  const S = 32, x0 = AT.die.x + (c % AT.die.cols) * AT.die.s, y0 = AT.die.y + Math.floor(c / AT.die.cols) * AT.die.s;
  g.save(); g.translate(x0, y0); g.scale(2, 2); box(g, 0, 0, S, S, '#8a8580'); box(g, 2, 2, 28, 28, '#9c968f');
  for (const [a, b, e, f] of [[3, 9, 14, 15], [14, 15, 29, 7], [14, 15, 18, 29], [18, 29, 26, 24], [6, 27, 18, 29]]) line(g, a, b, e, f, 1, '#3a3430');
  g.restore();
}
const D6_PIPS = { 1: [[0.5, 0.5]], 2: [[0, 0], [1, 1]], 3: [[0, 0], [0.5, 0.5], [1, 1]], 4: [[0, 0], [1, 0], [0, 1], [1, 1]], 5: [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]], 6: [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]] };
/** The d4: face f is opposite vertex f; its corners hold the other three vertices, in this order (bazaarpieces.js keeps the same). */
export const D4_FACES = [[1, 2, 3], [0, 3, 2], [0, 1, 3], [0, 2, 1]];
/** Where a d4 face's three corners sit in its cell (0..1, y down): a triangle pointing up. */
export const D4_CORNERS = [[0.5, 0.06], [0.06, 0.86], [0.94, 0.86]];

// ------------------------------------------------------------------ the Zodiac's tiles, the chips, the cloths
const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
function tileCell(g, c, n, st) {
  g.save(); g.translate(AT.tile.x + c * AT.tile.w, AT.tile.y); g.scale(2, 2); // (a 32 x 48 frame, fired at 2x)
  if (st === 'back') { box(g, 0, 0, 32, 48, K.plum); g.strokeStyle = K.gold; g.strokeRect(2.5, 2.5, 27, 43); star(g, 16, 24, 7, 3, 8, K.gold); g.restore(); return; }
  const locked = st === 'locked';
  box(g, 0, 0, 32, 48, locked ? K.gold : '#efe6d2'); box(g, 2, 2, 28, 44, locked ? '#f2d27a' : K.paper);
  text(g, String(n), 16, 16, n > 9 ? 17 : 21, locked ? K.plum : '#5a1e2a');
  text(g, SIGNS[n - 1] + '︎', 16, 36, 12, locked ? '#7a4a12' : '#2f5aa8');
  g.restore();
}
function chipCells(g, j, body, ink) {
  const S = 32, x = AT.chip.x + j * 2 * AT.chip.s, y = AT.chip.y;
  // the top: rings, the edge inserts, Raku's kiln mark in the middle
  g.save(); g.translate(x, y); g.scale(2, 2); box(g, 0, 0, S, S, body);
  ring(g, 16, 16, 14, 1, ink); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; box(g, 16 + Math.cos(a) * 12.5 - 1.5, 16 + Math.sin(a) * 12.5 - 1.5, 3, 3, ink); }
  ring(g, 16, 16, 8, 1, ink); poly(g, [[16, 10], [21, 19], [11, 19]], ink); box(g, 13, 19, 6, 2, ink);
  // the edge: the inserts as stripes
  g.translate(S, 0); box(g, 0, 0, S, S, body); for (let k = 0; k < 8; k++) box(g, k * 4 + 1, 0, 2, S, ink);
  g.restore();
}
function clothCell(g, j, id) {
  const S = 256, x0 = AT.cloth.x + (j % AT.cloth.cols) * S, y0 = AT.cloth.y + Math.floor(j / AT.cloth.cols) * S, c = 128;
  g.save(); g.translate(x0, y0); g.beginPath(); g.rect(0, 0, S, S); g.clip();
  const felt = { querent: '#1f6b4a', zodiac: '#1b4f5e', eventhorizon: '#2a1a3e', supernova: '#3e1a1c', nebula: '#16243e' }[id];
  box(g, 0, 0, S, S, felt);
  let seed = j * 977 + 13; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 2600; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.05)'; g.fillRect(Math.floor(rnd() * S), Math.floor(rnd() * S), 1, 1); } // (the felt's nap)
  ring(g, c, c, 122, 6, K.goldDeep); ring(g, c, c, 122, 3, K.gold); ring(g, c, c, 112, 1, K.gold);
  for (let k = 0; k < 24; k++) { const a = (k * Math.PI) / 12; star(g, c + Math.cos(a) * 117, c + Math.sin(a) * 117, 2.5, 1, 4, K.cream, a); }
  g.strokeStyle = K.gold; g.lineWidth = 1.5;
  if (id === 'querent') { // the querent's spread (the Celtic Cross): the cross of six and the staff of four, in gold outline; the suits at the seats
    const card = (x, y, w = 14, h = 22) => g.strokeRect(x - w / 2, y - h / 2, w, h);
    card(c - 18, c); g.save(); g.translate(c - 18, c); g.rotate(Math.PI / 2); g.strokeStyle = sch(0.5); g.strokeRect(-7, -11, 14, 22); g.restore();
    card(c - 18, c - 30); card(c - 18, c + 30); card(c - 48, c); card(c + 12, c);
    for (let k = 0; k < 4; k++) card(c + 44, c + 39 - k * 26, 12, 20);
    [[c, c + 96], [c - 96, c], [c, c - 96], [c + 96, c]].forEach(([x, y], s) => suit(g, s, x, y, 14, K.gold));
  } else if (id === 'zodiac') { // the wheel of the twelve signs round a sun
    ring(g, c, c, 78, 1.5, K.gold); ring(g, c, c, 52, 1.5, K.gold);
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6 - Math.PI / 2, b = a + Math.PI / 12; line(g, c + Math.cos(a) * 52, c + Math.sin(a) * 52, c + Math.cos(a) * 78, c + Math.sin(a) * 78, 1, K.gold); text(g, SIGNS[k] + '︎', c + Math.cos(b) * 65, c + Math.sin(b) * 65, 13, k % 2 ? K.cream : K.gold); }
    for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; line(g, c + Math.cos(a) * 20, c + Math.sin(a) * 20, c + Math.cos(a) * 34, c + Math.sin(a) * 34, 2, K.gold); }
    circ(g, c, c, 18, K.gold); circ(g, c, c, 12, '#f2d27a');
  } else if (id === 'supernova') { // a star bursting: its rays, the shock rings running out in the schiller, the spent dice's sparks
    for (let k = 0; k < 3; k++) ring(g, c, c, 44 + k * 24, 2 - k * 0.4, sch(0.2 + k * 0.25));
    for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, r = k % 2 ? 34 : 58; line(g, c + Math.cos(a) * 14, c + Math.sin(a) * 14, c + Math.cos(a) * r, c + Math.sin(a) * r, k % 2 ? 1 : 2, K.gold); }
    circ(g, c, c, 16, K.gold); circ(g, c, c, 10, '#fff2c8');
    for (let k = 0; k < 20; k++) { const a = k * 2.4, r = 70 + ((k * 37) % 30); star(g, c + Math.cos(a) * r, c + Math.sin(a) * r, 2.5, 1, 4, k % 3 ? K.cream : K.gold, a); }
  } else if (id === 'nebula') { // a nebula's cloud, lit from within, round six pale stars (a set's six dice)
    for (let k = 0; k < 26; k++) { const a = k * 2.1, r = 20 + ((k * 29) % 54); g.globalAlpha = 0.18; circ(g, c + Math.cos(a) * r, c + Math.sin(a) * r * 0.7, 18 + (k % 4) * 6, k % 3 ? '#6a3a8a' : '#2f5aa8'); }
    g.globalAlpha = 1;
    for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 - Math.PI / 2; star(g, c + Math.cos(a) * 62, c + Math.sin(a) * 62, 5, 2, 4, K.cream, 0); ring(g, c + Math.cos(a) * 62, c + Math.sin(a) * 62, 9, 1, sch(k / 6)); }
    ring(g, c, c, 62, 1, K.gold); star(g, c, c, 8, 3, 8, K.gold);
  } else { // a black hole in its accretion ring, the light bent round it
    for (let k = 0; k < 40; k++) { g.save(); g.translate(c, c); g.rotate(k * 0.157); g.scale(1, 0.34); ring(g, 0, 0, 56 + (k % 5) * 4, 2, sch(k / 40)); g.restore(); }
    g.save(); g.translate(c, c); g.scale(1, 1); ring(g, 0, 0, 34, 3, sch(0.3)); g.restore();
    circ(g, c, c, 30, '#06030a'); ring(g, c, c, 31, 1, K.gold);
    for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8; star(g, c + Math.cos(a) * 96, c + Math.sin(a) * 96, 2, 0.8, 4, K.cream, 0); }
  }
  g.restore();
}
