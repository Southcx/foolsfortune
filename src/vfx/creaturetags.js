// ---------------------------------------------------------------------------------------
// CREATURE TAGS: a creature's tag as THE SCAN (docs/plans/OVERLAY.md 10.5f: the owner's pick, direction C of board v8). One bracket
// framing the creature's eyes, a dashed leader line, a small CRT lozenge (a hex-cornered screen) holding the creature as a pixel sprite,
// its readout beside it as bare lines (no plate, no barcode, no id), the sigil-eye as the lens on the lozenge's side, and the status
// motes orbiting its head. Familiarity shows twice: in the lines (Dovina's one reader, tools/veritome/creaturetag.js, OVERLAY.md 17) and
// in the sprite's sharpness (its pixel grid a step finer a level, 11 x 9 at UNKNOWN to 44 x 36 at UNDERSTOOD; never the picture).
//
// The sprite's picture (plateOf, OVERLAY.md 17): the Compendium's best plate of the kind, cut out by the creature's box in it (a plate
// taken before the box was kept: its centre) and pixelated in the screen's four tones; a plate waiting undeveloped in the memory: the
// shadow held still with a plate's corner marks; never photographed: the model's shadow silhouette (its meshes rendered alone once a
// kind, with their own materials so a shader's shape counts, transparent ones included, framed by what was drawn, its aspect kept).
// An aberrant's sprite has rows slid and a magenta cast and its readout is torn, held still.
//
// The readout (laid out for the 480-line present): a label column, the bar or track in the middle, every value right-aligned in one
// column; a row's pitch at least 1.5x its text's cap height; statuses at most two rows. Lines read three ways (OVERLAY.md 17): plain as
// the mock drew it; scrambled churns in the running hand (ui/runninghand.js, final: measured first, placed by its bounds, given the
// row's whole width after its label, words dropped rather than shrunk past reading); latent holds still in the window colour with a
// plate's corner marks; scrambled or latent turned plain plays its decrypt (0.6 real s, a wipe behind a VFD cursor). No event.
//
// Which creatures (the owner, 2026-10-18: "only when using a scan mode with the Veritome, or if you're locked-on to them"): the one
// locked on (game.lock); and, while the Veritome is out with its lens raised (game.veritome.lens), every creature in the viewfinder's
// aperture (viewfinder.js) within the capture's reach, at most MAX, nearest the aperture's centre first. Nothing else ever wears one.
// The settings: `visual.creatureTags` 'scan' (the lens and the lock-on) | 'lockon' (the lock-on only) | 'off'; `visual.creatureTagsMinimal`
// true keeps the lozenge, its sprite, the name and the health line (Dovina's reads kept: a scrambled line stays scrambled). Each is
// anchored to its eyes projected each frame; tags are kept off each other, off every tagged creature's bracket and leader, the screen's
// edges (with the lens up, the aperture's), the Sight's corner and the Lachrimeter.
//
// Cost: nothing at boot (no mesh, no canvas, no program until the first tag is wanted). Then one mesh, one material, one program and one
// draw call for every tag together: the brackets, leaders and motes as quads in a dynamic buffer, each tag's plate a quad on one atlas
// canvas (a white strip at its foot for the strokes), a tag's region redrawn and uploaded only when its lines change, its scramble
// churns or a decrypt plays. A kind's silhouette is rendered once at 128 x 128 and read back; a plate is decoded once a thumb. Hidden
// with the HUD (but kept through the lens's own want: hideui.js), on the title, in the god hand, on the rail's crossing and in a cinematic.
//
// Prior art: Digimon World's and the Pokédex's scan (the creature as a sprite on a small screen; the unseen one as a shadow), Watch
// Dogs' profiler (a glance reads a line; the leader line), Dennō Coil's glasses (the data over the world, legible or broken), Mass
// Effect's and Uplink's decrypt, Pokémon Snap's report (the latent line), the game's own data bug (vfx/databug.js) for the tear; VFD
// tubes for the counts (10.5d); a print's grain coarse to fine (the sharpness by familiarity). Ported from Calissa's round-7 mock
// (r7-tags.src.html, figure 3, plateC / tagC) to r170, at the 480-line present (one canvas pixel a dot, times the device's k).
//
//   game.creatureTags = new CreatureTags(game)   (added to game.overlayScene; it updates itself there)   .shown -> [creature]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { readTag, plateOf } from '../tools/veritome/creaturetag.js';
import { st } from '../creatures/creatures.js';
import { EMO } from '../progress/combat/emo.js';
import { TYPES, BONUS } from '../progress/combat/types.js';
import { poles } from '../progress/combat/temperament.js';
import { FONT, THEMES, theme } from '../ui/theme.js';
import { runningHand } from '../ui/runninghand.js';
import { cellsOf } from '../npc/neuralesespelling.js';
import { T as TUNE } from '../core/config.js';

const MAX = 3, REACH = 18, POLL = 0.25, CHURN = 0.25, DECRYPT = 0.6, T_IN = 0.25, T_OUT = 0.17; // (REACH: the lens's capture, veritome.js CAPTURE.range)
const MINIMAL = new Set(['name', 'health']); // (visual.creatureTagsMinimal: the lines kept)
const W = 228, M = 18, SW = 58, SH = 50, GX = 68, HMAX = 168, RISE = 30;
// the readout's grid, in dots: a label column, values right-aligned at the row's end, rows at least 1.5x the cap height apart
const LBL = 40, GAP = 5, ROW = 17, NAME_H = 20, HID_H = 20, FN_H = 24;
const PX = { label: 11, word: 12, num: 14, small: 11, name: 14 };
const HAND_S = 0.8, HAND_FN = 0.95; // (the running hand's scale: a letter about 10 dots tall, 15 px at 720 lines)
// the sprite: a base of 44 x 36 cells, shown on a grid a step finer a familiarity level, over the same area of the screen
const BW = 44, BH = 36, AW = 50.6, AH = 41.4, GRIDS = [[11, 9], [15, 12], [22, 18], [29, 24], [44, 36]];
const INK = '#0d0a12', LIGHT = '#e6deff', VFD = '#7dffd2', VFD_GLOW = 'rgba(60,255,190,.85)', MAG = '#ff2a9a', CYAN = '#22e6ff';
const FILM_HI = ['#8a5cff', '#3fc4f0', '#f6cd5a', '#ff5aa8'], FILM_LIT = ['#b49cff', '#7fe3ff', '#ffd56b', '#ff86c8'];
const PAL = { lab: '#8fd8b0', dim: '#8fd8b0', val: VFD, glow: VFD_GLOW, word: '#e2fff0', wordGlow: 'rgba(60,255,190,.35)' };
const TONES = ['#0b3d2a', '#2a9e6e', '#7dffd2', '#e9fff7'], SHADOW = '#020a06';
const COUNT = `'Jersey 15', ${FONT.sys}`; // (the count face, src/ui/theme.js)
const LABEL = { habit: 'NOW', health: 'HP', emo: 'EMO', statuses: 'STATUS', weak: 'WEAK', grain: 'GRAIN' };
// the statuses' motes: doubt and charm are the mock's; the others are placeholders (a colour and a 7 x 7 glyph each) until the auras' table
const ST = { doubt: '#5fd0ff', charm: '#ff86b6', stun: '#ffd56b', blind: '#c9b8ff', confusion: '#9dff8a' };
const GLYPH = {
  doubt: ['.####..', '#....#.', '....#..', '...#...', '...#...', '.......', '...#...'], charm: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
  stun: ['...#...', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '...#...'], blind: ['.......', '.#####.', '#..#..#', '#.###.#', '#..#..#', '.#####.', '.......'],
  confusion: ['.#####.', '#.....#', '#.###.#', '#.#.#.#', '#.#...#', '#.####.', '.......'], other: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
};
// a scrambled line's neuralese: the mock's phrases and pool (every one a real root, spelt by cellsOf)
const PHR = { name: 'THERA KE', habit: 'ONO PONO KE', health: 'SOMA FORTA', emo: 'EMO KRESA', statuses: 'NUSA META', weak: 'KORA KRAKA' };
const POOL = ['VIDA', 'SEMA', 'SHIRA', 'MAIA', 'VOYD', 'LOGA', 'KAVA', 'VERA', 'DEO', 'NUSA', 'SOMA', 'LITHA'];
const CELLS = new Map(); const cells = (w) => { let c = CELLS.get(w); if (!c) { try { c = cellsOf(w.toLowerCase()); } catch { c = []; } CELLS.set(w, c); } return c; };

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function schill(g, x0, x1) { const gr = g.createLinearGradient(x0, 0, x1, 0), n = FILM_LIT.length * 2; for (let i = 0; i <= n; i++) gr.addColorStop(i / n, FILM_LIT[i % 4]); return gr; }
function film(g, x0, y0, x1, y1) { const gr = g.createLinearGradient(x0, y0, x1, y1); FILM_HI.forEach((c, i) => gr.addColorStop(i / 3, c)); return gr; }
const _c = new THREE.Color(); const lin = (hex, a) => { _c.set(hex); return [_c.r, _c.g, _c.b, a]; };
const C_INK = lin(INK, 0.85), C_VFD = lin(VFD, 1), C_WHITE = [1, 1, 1, 1], C_TRAIL = {};
const windowColour = () => (THEMES[theme.id] || THEMES.kiln).mid;
const lum = (d, k) => Math.sqrt((0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]) / 255);

/** A base sprite (BW x BH: a luminance and a coverage a cell) from pixels: the drawn shape's own bounds fitted in, its aspect kept;
 *  a pixel counts when it is opaque or lit (so a transparent or additive flame is part of the shape). */
function baseFromPixels(d, S, flip) {
  const at = (i, j) => ((flip ? S - 1 - j : j) * S + i) * 4, on = (k) => d[k + 3] > 24 || Math.max(d[k], d[k + 1], d[k + 2]) > 24;
  let x0 = S, y0 = S, x1 = -1, y1 = -1;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (on(at(i, j))) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
  if (x1 < x0) return null;
  const cs = Math.max((x1 - x0 + 1) / BW, (y1 - y0 + 1) / BH), ox = (x0 + x1 + 1) / 2 - cs * BW / 2, oy = (y0 + y1 + 1) / 2 - cs * BH / 2;
  const L = new Float32Array(BW * BH), A = new Float32Array(BW * BH), n = 3;
  for (let j = 0; j < BH; j++) for (let i = 0; i < BW; i++) {
    let hit = 0, l = 0;
    for (let v = 0; v < n; v++) for (let u = 0; u < n; u++) {
      const px = Math.floor(ox + (i + (u + 0.5) / n) * cs), py = Math.floor(oy + (j + (v + 0.5) / n) * cs);
      if (px < 0 || py < 0 || px >= S || py >= S) continue; const k = at(px, py); if (on(k)) { hit++; l += lum(d, k); }
    }
    A[j * BW + i] = hit / (n * n); L[j * BW + i] = hit ? l / hit : 0;
  }
  return { L, A };
}
/** A plate cut to the creature: its box (centre x, y and height h, 0..1 of the plate), or the plate's middle when the plate kept none. */
function baseFromPlate(img, box) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return null;
  const b = box && Number.isFinite(box.x) ? box : { x: 0.5, y: 0.5, h: 0.45 };
  let ch = Math.min(ih, Math.max(0.18, (b.h || 0.45) * 2.2) * ih), cw = ch * BW / BH; if (cw > iw) { cw = iw; ch = cw * BH / BW; }
  const cx = Math.max(0, Math.min(iw - cw, b.x * iw - cw / 2)), cy = Math.max(0, Math.min(ih - ch, b.y * ih - ch / 2));
  const cv = canvasOf(BW, BH), x = cv.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(img, cx, cy, cw, ch, 0, 0, BW, BH);
  const d = x.getImageData(0, 0, BW, BH).data, L = new Float32Array(BW * BH), A = new Float32Array(BW * BH).fill(1);
  for (let i = 0; i < BW * BH; i++) L[i] = lum(d, i * 4);
  return { L, A };
}
function ellipseBase() { const L = new Float32Array(BW * BH), A = new Float32Array(BW * BH); for (let j = 0; j < BH; j++) for (let i = 0; i < BW; i++) { const u = (i + 0.5) / BW * 2 - 1, v = (j + 0.5) / BH * 2 - 1; A[j * BW + i] = u * u + v * v < 0.9 ? 1 : 0; L[j * BW + i] = 0.5; } return { L, A }; }
/** The base shown on a coarser grid: each cell the mean of the base cells it covers (filled past half), luminance spread over the shape. */
function gridOf(base, gw, gh) {
  const out = new Array(gw * gh).fill(null); let lo = 1, hi = 0;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const a0 = Math.floor(i * BW / gw), a1 = Math.max(a0 + 1, Math.floor((i + 1) * BW / gw)), b0 = Math.floor(j * BH / gh), b1 = Math.max(b0 + 1, Math.floor((j + 1) * BH / gh));
    let a = 0, l = 0, n = 0; for (let y = b0; y < b1; y++) for (let x = a0; x < a1; x++) { const q = y * BW + x; a += base.A[q]; l += base.L[q] * base.A[q]; n++; }
    if (a / n < 0.45) continue; const v = l / a; out[j * gw + i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  const span = Math.max(0.05, hi - lo); for (let i = 0; i < out.length; i++) if (out[i] != null) out[i] = (out[i] - lo) / span;
  return out;
}

/** Every tag in one mesh: the quads of every bracket, leader and mote (vertex colours over the atlas's white strip), then each shown
 *  tag's plate as a quad on its region of the atlas canvas. One dynamic buffer, one material, one program, one draw call. Coordinates
 *  in dots for the strokes (written as CSS px), CSS px for the plates. */
class Sheet {
  constructor(cap = 12000) {
    this.cap = cap; const n = cap + 6 * MAX; this.p = new Float32Array(n * 3); this.c = new Float32Array(n * 4); this.u = new Float32Array(n * 2);
    this.n = 0; this.s = 1; this.col = C_VFD; this.plates = []; this.k = 0; this.pw = 1; this.ph = 1; this.wv = 0.5;
    const g = this.geo = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage); this.ca = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage); this.ua = new THREE.BufferAttribute(this.u, 2).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('color', this.ca); g.setAttribute('uv', this.ua); g.setDrawRange(0, 0);
    this.cv = canvasOf(1, 1); this.tex = new THREE.CanvasTexture(this.cv);
    Object.assign(this.tex, { colorSpace: THREE.SRGBColorSpace, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.tex, vertexColors: true, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; this.mesh.name = 'creaturetags';
  }
  /** The atlas at k device pixels a dot: MAX plates stacked, a white strip of 4 rows at the foot (what the strokes sample). */
  size(k) {
    if (k === this.k) return; this.k = k; this.pw = (W + 2 * M) * k; this.ph = (HMAX + 2 * M) * k;
    this.cv.width = this.pw; this.cv.height = MAX * this.ph + 4; this.tex.dispose();
    const g = this.cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, MAX * this.ph, this.pw, 4);
    this.wv = 1 - (MAX * this.ph + 2) / this.cv.height; this.tex.needsUpdate = true;
  }
  /** A plate drawn: copied into its region (i) and the atlas uploaded. */
  put(i, src) { const g = this.cv.getContext('2d'); g.clearRect(0, i * this.ph, this.pw, this.ph); g.drawImage(src, 0, i * this.ph); this.tex.needsUpdate = true; }
  begin(s) { this.n = 0; this.s = s; this.plates.length = 0; }
  w(x, y, u, v, col) { const i = this.n++; this.p[i * 3] = x; this.p[i * 3 + 1] = -y; this.p[i * 3 + 2] = 0; this.c.set(col, i * 4); this.u[i * 2] = u; this.u[i * 2 + 1] = v; }
  v(x, y) { const s = this.s; this.w(Math.round(x * s), Math.round(y * s), 0.5, this.wv, this.col); }
  quad(ax, ay, bx, by, cx, cy, dx, dy) { if (this.n + 6 > this.cap) return; this.v(ax, ay); this.v(bx, by); this.v(cx, cy); this.v(ax, ay); this.v(cx, cy); this.v(dx, dy); }
  rect(x, y, w, h) { this.quad(x, y, x + w, y, x + w, y + h, x, y + h); }
  seg(ax, ay, bx, by, w) { // (a square-capped stroke: its ends pushed out half a width, so a bracket's corner closes)
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, ux = dx / L * w / 2, uy = dy / L * w / 2;
    this.quad(ax - ux - uy, ay - uy + ux, bx + ux - uy, by + uy + ux, bx + ux + uy, by + uy - ux, ax - ux + uy, ay - uy - ux);
  }
  /** A polyline (flat x, y pairs), solid or dashed 2 on 2 off along its whole length (the mock's setLineDash([2, 2])). */
  path(P, n, w, dash, upto = 1) {
    let total = 0; for (let i = 1; i < n; i++) total += Math.hypot(P[i * 2] - P[i * 2 - 2], P[i * 2 + 1] - P[i * 2 - 1]);
    let left = total * upto, at = 0;
    for (let i = 1; i < n && left > 0; i++) {
      const ax = P[i * 2 - 2], ay = P[i * 2 - 1], L = Math.hypot(P[i * 2] - ax, P[i * 2 + 1] - ay); if (L < 1e-3) continue;
      const ux = (P[i * 2] - ax) / L, uy = (P[i * 2 + 1] - ay) / L, len = Math.min(L, left); left -= len;
      if (!dash) { this.seg(ax, ay, ax + ux * len, ay + uy * len, w); continue; }
      for (let s = 0; s < len;) { const ph = (at + s) % 4, run = ph < 2 ? Math.min(2 - ph, len - s) : Math.min(4 - ph, len - s); if (ph < 2) this.seg(ax + ux * s, ay + uy * s, ax + ux * (s + run), ay + uy * (s + run), w); s += run; }
      at += len;
    }
  }
  arc(cx, cy, r, a0, a1, w, segs = 14) { for (let i = 0; i < segs; i++) { const u = a0 + (a1 - a0) * i / segs, v = a0 + (a1 - a0) * (i + 1) / segs; this.seg(cx + Math.cos(u) * r, cy + Math.sin(u) * r, cx + Math.cos(v) * r, cy + Math.sin(v) * r, w); } }
  /** A plate to lay over the strokes this frame: region i of the atlas over (x, y, w, h) in CSS px. */
  plate(i, x, y, w, h) { this.plates.push(i, x, y, w, h); }
  end() {
    const H = this.cv.height;
    for (let q = 0; q < this.plates.length; q += 5) {
      const [i, x, y, w, h] = this.plates.slice(q, q + 5), v0 = 1 - i * this.ph / H, v1 = 1 - (i + 1) * this.ph / H;
      this.w(x, y, 0, v0, C_WHITE); this.w(x + w, y, 1, v0, C_WHITE); this.w(x + w, y + h, 1, v1, C_WHITE);
      this.w(x, y, 0, v0, C_WHITE); this.w(x + w, y + h, 1, v1, C_WHITE); this.w(x, y + h, 0, v1, C_WHITE);
    }
    this.geo.setDrawRange(0, this.n); this.pa.needsUpdate = true; this.ca.needsUpdate = true; this.ua.needsUpdate = true;
  }
}

/** One tag's screen: a canvas drawn at k device pixels a dot (copied into its region i of the atlas), and the scratch canvases its
 *  hand and tear use. */
class Panel {
  constructor(i) { this.i = i; this.cv = canvasOf(1, 1); this.k = 0; this.hand = canvasOf(1, 1); this.tA = canvasOf(1, 1); this.work = null; this.tint = null; this.owner = null; }
  size(k) {
    if (k === this.k) return; this.k = k;
    this.cv.width = (W + 2 * M) * k; this.cv.height = (HMAX + 2 * M) * k;
    for (const c of [this.hand, this.tA]) { c.width = 200 * k; c.height = 40 * k; }
    if (this.work) { this.work.width = this.tint.width = this.cv.width; this.work.height = this.tint.height = this.cv.height; }
  }
  tear() { if (!this.work) { this.work = canvasOf(this.cv.width, this.cv.height); this.tint = canvasOf(this.cv.width, this.cv.height); } return this.work; }
}

// ---------------------------------------------------------------------------------------------------------------- the readout's drawing
// (the mock's T, label, words, num, bar and emoTrack, in the game's faces, on the grid above; KK is the plate's k, for glows in device px)
let KK = 1;
const base = (y, h, px) => Math.round(y + h / 2 + px * 0.36); // (a row's baseline: its caps centred in it)
function T(g, s, x, y, font, col, align, glow) {
  g.save(); g.font = font; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(13,10,18,.92)'; g.lineWidth = 2; g.strokeText(s, x, y);
  if (glow) { g.shadowColor = glow; g.shadowBlur = 3 * KK; } g.fillStyle = col; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w;
}
function fitFont(g, str, maxW, size, face, weight = '') { let s = size; const f = () => `${weight}${s}px ${face}`; g.font = f(); while (g.measureText(str).width > maxW && s > 8) { s -= 0.5; g.font = f(); } return g.font; }
const label = (g, s, x, y, h) => { const f = fitFont(g, s, LBL - 3, PX.label, COUNT); return T(g, s, x, base(y, h, PX.label), f, PAL.lab); };
/** A value at the row's end (right-aligned in the one column); its width back, so the middle stops short of it. */
const words = (g, s, XR, y, h, maxW = 200) => T(g, s, XR, base(y, h, PX.word), fitFont(g, s, maxW, PX.word, FONT.sys), PAL.word, 'right', PAL.wordGlow);
const num = (g, s, XR, y, h, px = PX.num, col = PAL.val) => T(g, s, XR, base(y, h, px), `${px}px ${COUNT}`, col, 'right', PAL.glow);
function bar(g, x, yc, w, f, fam) {
  const h = 5, y = Math.round(yc - h / 2), lit = (xx, ww) => { g.save(); g.shadowColor = PAL.glow; g.shadowBlur = 3 * KK; g.fillStyle = PAL.val; g.fillRect(xx, y, ww, h); g.restore(); };
  g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6);
  if (fam <= 2) {
    const n = fam === 1 ? 4 : 8, on = Math.round(f * n), gw = (w - (n - 1) * 1.6) / n;
    for (let i = 0; i < n; i++) { const xx = x + i * (gw + 1.6); if (i < on) lit(xx, gw); else { g.strokeStyle = hexA(PAL.dim, 0.55); g.lineWidth = 0.7; g.strokeRect(xx + 0.35, y + 0.35, gw - 0.7, h - 0.7); } }
    return;
  }
  g.strokeStyle = hexA(PAL.dim, 0.55); g.lineWidth = 0.7; g.strokeRect(x + 0.35, y + 0.35, w - 0.7, h - 0.7); lit(x, w * f);
}
function emoTrack(g, x, yc, w, cur, needle) {
  const [b0, b1] = EMO.optimal, z = [[0, b0], [b0, b1], [b1, 1]], y = Math.round(yc + 2);
  g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(x - 0.8, y - 3.8, w + 1.6, 5.6);
  z.forEach(([a, b], i) => {
    const xa = x + w * a + (i ? 0.8 : 0), xb = x + w * b - (i < 2 ? 0.8 : 0);
    if (i === cur) { g.save(); g.shadowColor = PAL.glow; g.shadowBlur = 3 * KK; g.fillStyle = PAL.val; g.fillRect(xa, y - 3, xb - xa, 4); g.restore(); }
    else { g.strokeStyle = hexA(PAL.dim, 0.6); g.lineWidth = 0.7; g.strokeRect(xa + 0.35, y - 2.65, xb - xa - 0.7, 3.3); }
  });
  if (needle != null) { const nx = x + w * needle; g.fillStyle = PAL.word; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.moveTo(nx, y - 3.6); g.lineTo(nx - 2.4, y - 7.4); g.lineTo(nx + 2.4, y - 7.4); g.closePath(); g.stroke(); g.fill(); }
}
function glyphPx(g, id, x, y, d, col) {
  const gl = GLYPH[id] || GLYPH.other;
  g.fillStyle = 'rgba(13,10,18,.85)'; gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(x + (i - 3.5) * d - d * 0.6, y + (j - 3.5) * d - d * 0.6, d * 2.2, d * 2.2); }));
  g.fillStyle = col; gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(x + (i - 3.5) * d, y + (j - 3.5) * d, d, d); }));
}
/** A plain row (row r: { key, h, line, s? }; fam the tag's level): its label, its value at the end, the bar between them. */
function rowPlain(g, r, fam, x, y, w) {
  const h = r.h, XR = x + w, L = r.line, MX = x + LBL, mid = y + h / 2, room = (vw) => XR - vw - GAP - MX;
  if (r.key === 'name') { const s = String(L.text || '').toUpperCase(); T(g, s, x, base(y, h, PX.name), fitFont(g, s, w, PX.name, FONT.title, '700 '), PAL.word, 'left', PAL.wordGlow); return; }
  if (r.key === 'habit') { label(g, 'NOW', x, y, h); words(g, L.text, XR, y, h, w - LBL); return; }
  if (r.key === 'health') {
    label(g, 'HP', x, y, h); let vw = 0;
    if (fam >= 4 && L.text) { const [hp, max] = L.text.split('/').map((s) => s.trim()); vw = num(g, '/' + max, XR, y, h, PX.small, PAL.lab); vw += num(g, hp, XR - vw, y, h); }
    bar(g, MX, mid, vw ? room(vw) : XR - MX, L.value ?? 0, fam); return;
  }
  if (r.key === 'emo') {
    label(g, 'EMO', x, y, h); const exact = typeof L.value === 'number', band = exact ? (L.value < EMO.optimal[0] ? 0 : L.value > EMO.optimal[1] ? 2 : 1) : ['low', 'optimal', 'hot'].indexOf(L.value);
    const vw = exact ? num(g, L.value.toFixed(2).replace(/^0/, ''), XR, y, h) : num(g, String(L.value).toUpperCase(), XR, y, h, PX.small);
    emoTrack(g, MX, mid, Math.max(16, room(vw)), band, exact ? L.value : null); return;
  }
  if (r.key === 'statuses') {
    if (!r.s) { label(g, 'STATUS', x, y, h); words(g, 'NONE', XR, y, h); return; }
    const [id, v] = r.s, col = ST[id] || LIGHT; glyphPx(g, id, x + 4, mid, 1, col);
    const s = id.toUpperCase(); T(g, s, x + 10, base(y, h, PX.label), fitFont(g, s, LBL - 12, PX.label, COUNT), col);
    const vw = num(g, String(v), XR, y, h, PX.num, col), bw = room(vw);
    g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(MX - 0.5, mid - 1.5, bw + 1, 3); g.fillStyle = hexA(col, 0.35); g.fillRect(MX, mid - 1, bw, 2); g.fillStyle = col; g.fillRect(MX, mid - 1, bw * v / 100, 2); return;
  }
  if (r.key === 'weak') {
    label(g, 'WEAK', x, y, h); if (!L.value) { words(g, 'NONE', XR, y, h); return; }
    const w2 = num(g, `×${(1 + BONUS.trump).toFixed(2).replace(/0$/, '')}`, XR, y, h); words(g, (TYPES[L.value]?.name || L.value).toUpperCase(), XR - w2 - 4, y, h, w - LBL - w2 - 4); return;
  }
  if (r.key === 'grain') { label(g, 'GRAIN', x, y, h); words(g, poles(L.value || {}).slice(0, 2).map((p) => p.toUpperCase()).join('·') || 'EVEN', XR, y, h, w - LBL); }
}

// ---------------------------------------------------------------------------------------------------------------- the tags
export class CreatureTags {
  constructor(game) {
    this.game = game; this.tags = new Map(); this.sprites = new Map(); this.plates = new Map(); this.shown = []; this.sheet = null; this.panels = [];
    this.pollT = 0; this.churnT = 0; this.t = 0; this.k = 0; this.dot = 1; this.themeId = null;
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.right = new THREE.Vector3(); this.PTS = new Float32Array(16);
    this.rects = Array.from({ length: 40 }, () => ({ x0: 0, y0: 0, x1: 0, y1: 0 })); this.nR = 0;
    const S = game.overlayScene; if (!S || typeof document === 'undefined') return;
    this.root = new THREE.Group(); this.root.name = 'creaturetags'; this.root.userData.overlayHidden = true;
    this.bounds = { x0: 0, y0: 0, x1: 1, y1: 480 };
    // (hud: false, so the lens's own want for the HUD out of the way does not take the tags with it: update() applies the HUD's rule)
    this.slot = S.add(this.root, { anchor: 'tl', x: 0, y: 0, z: 0, hud: false, update: (dt, slot) => this.update(dt, slot) });
    const fonts = [`700 ${PX.name}px ${FONT.title}`, `${PX.word}px ${FONT.sys}`, `${PX.num}px 'Jersey 15'`];
    Promise.all(fonts.map((f) => document.fonts?.load?.(f).catch(() => null))).then(() => { for (const T of this.tags.values()) T.dirty = true; });
  }

  /** May this thing wear a tag at all? */
  ok(c) { return !!c && c.alive !== false && c.kind && !c.ally && !c.friend && !c.spirit && c.pos && c.root?.visible !== false; }
  /** The mesh, its material and the plates' canvases, made when the first tag is wanted (so nothing compiles at boot). */
  ensure() {
    if (this.sheet) return; this.sheet = new Sheet(); this.root.add(this.sheet.mesh);
    this.panels = Array.from({ length: MAX }, (_, i) => new Panel(i));
  }
  /** The Veritome out with its lens raised: the scan. */
  get scanning() { const V = this.game.veritome; return !!(V?.lens && V.toolOut); }
  /** The HUD's rule (overlayscene.js hidden()), but the lens's own want is not the player hiding it. */
  hudOff() {
    const B = document.body.classList, ui = this.game.ui; if (B.contains('ui2')) return true;
    if (!B.contains('ui1') || B.contains('uilog')) return false;
    if (!this.scanning || (ui?.level ?? 0) > 0) return true;
    for (const id of ui?.wants || []) if (id !== 'lens') return true;
    return false;
  }

  /** Where its eyes are (a clapperjar's eyes bone; else two thirds up its body, the head's offset polled with its lines). */
  eye(c, T, out) {
    if (c.bones?.eyes) return c.bones.eyes.getWorldPosition(out);
    return out.set(c.pos.x, c.pos.y + T.eyeDy, c.pos.z);
  }
  /** A world point to the view, in dots (x right, y down); false behind the camera. */
  project(p, out) {
    const cam = this.game.camera; this.v2.copy(p).project(cam);
    if (this.v2.z > 1 || this.v2.z < -1) return false;
    out.x = (this.v2.x + 1) / 2 * this.Wd; out.y = (1 - this.v2.y) / 2 * 480; out.inView = Math.abs(this.v2.x) < 1 && Math.abs(this.v2.y) < 1; return true;
  }

  /** Who wears a tag now (the settings and the rule in the header): the one locked on; with the lens up, the others in its aperture. */
  choose() {
    const g = this.game, mode = TUNE.visual?.creatureTags ?? 'scan', out = []; if (mode === 'off') return out;
    const lockRef = g.lock?.target?.ref; if (this.ok(lockRef)) out.push(lockRef);
    if (mode !== 'scan' || !this.scanning || !g.camera) return out;
    const eye = g.camera.getWorldPosition(this.v), B = this.bounds, cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2, near = [], tmp = {}, p = new THREE.Vector3();
    for (const list of [g.creatures?.list, g.clappers?.list]) for (const c of list || []) {
      if (c === lockRef || !this.ok(c)) continue;
      p.set(c.pos.x, c.pos.y + 0.6, c.pos.z); if (p.distanceTo(eye) > REACH) continue;
      if (!this.project(p, tmp) || tmp.x < B.x0 || tmp.x > B.x1 || tmp.y < B.y0 || tmp.y > B.y1) continue;
      near.push([Math.hypot(tmp.x - cx, tmp.y - cy), c]);
    }
    near.sort((a, b) => a[0] - b[0]); for (const [, c] of near) { if (out.length >= MAX) break; out.push(c); }
    return out;
  }

  // ------------------------------------------------------------------------------------------------------------ the sprite's picture
  /** What the sprite shows now: { mode: 'plate' | 'latent' | 'shadow', base }. The plate's image is decoded once a thumb. */
  spriteOf(T) {
    const c = T.c, pl = T.plate;
    if (pl?.read === 'plain' && pl.thumb) {
      let P = this.plates.get(c.kind);
      if (!P || P.thumb !== pl.thumb) {
        P = { thumb: pl.thumb, base: null }; this.plates.set(c.kind, P);
        const img = new Image(), kind = c.kind;
        img.onload = () => { try { P.base = baseFromPlate(img, pl.box); } catch (e) { console.warn('creature tag plate', e); } for (const o of this.tags.values()) if (o.c.kind === kind) o.dirty = true; };
        img.src = pl.thumb;
      }
      if (P.base) return { mode: 'plate', base: P.base };
    }
    return { mode: pl?.read === 'latent' ? 'latent' : 'shadow', base: this.silhouette(c) };
  }
  silhouette(c) {
    let s = this.sprites.get(c.kind); if (s) return s;
    try { s = this.sampleMesh(c); } catch (e) { console.warn('creature tag sprite', e); s = null; }
    s ||= ellipseBase(); this.sprites.set(c.kind, s); return s;
  }
  /** Its meshes rendered alone, with their own materials (a shader's shape, a transparent flame), from the side the camera sees, at
   *  128 x 128, read back once; the frame is generous and the shape is cut to what was drawn. */
  sampleMesh(c) {
    const r = this.game.overlayScene.r, root = c.root, S = 128; if (!root || !r) return null;
    root.updateMatrixWorld(true);
    if (!this.sScene) {
      this.sScene = new THREE.Scene(); this.sSun = new THREE.DirectionalLight(0xffffff, 2.4); this.sScene.add(new THREE.AmbientLight(0xffffff, 0.8), this.sSun, this.sSun.target);
      this.sCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100); this.sRT = new THREE.WebGLRenderTarget(S, S); this.sBuf = new Uint8Array(S * S * 4);
    }
    const box = new THREE.Box3(), bb = new THREE.Box3(), proxies = [];
    root.traverseVisible((o) => {
      if (!o.isMesh || o.isPoints || o.isSprite || !o.material || /databug|glint|aura|shadow|tag/i.test(o.name || '')) return;
      let p;
      if (o.isSkinnedMesh && o.skeleton) { p = new THREE.SkinnedMesh(o.geometry, o.material); p.bind(o.skeleton, o.bindMatrix); p.bindMode = o.bindMode; }
      else p = new THREE.Mesh(o.geometry, o.material);
      p.matrixAutoUpdate = false; p.matrix.copy(o.matrixWorld); p.frustumCulled = false; this.sScene.add(p); proxies.push(p);
      if (o.isSkinnedMesh && o.computeBoundingBox) { try { o.computeBoundingBox(); bb.copy(o.boundingBox).applyMatrix4(o.matrixWorld); } catch { bb.makeEmpty(); } }
      else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); }
      box.union(bb);
    });
    if (!proxies.length || box.isEmpty()) { for (const p of proxies) this.sScene.remove(p); return null; }
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), half = Math.max(size.x, size.y, size.z) * 0.9 + 0.05;
    const cam = this.sCam, to = this.game.camera ? new THREE.Vector3().subVectors(this.game.camera.position, ctr).setY(0) : new THREE.Vector3(0, 0, 1);
    if (to.lengthSq() < 1e-6) to.set(0, 0, 1); to.normalize();
    cam.left = cam.bottom = -half; cam.right = cam.top = half; cam.position.copy(ctr).addScaledVector(to, half * 4 + 2); cam.lookAt(ctr); cam.near = 0.01; cam.far = half * 8 + 4; cam.updateProjectionMatrix();
    this.sSun.position.copy(cam.position).add(new THREE.Vector3(-to.z, 1.2, to.x).multiplyScalar(half * 3)); this.sSun.target.position.copy(ctr); this.sSun.target.updateMatrixWorld();
    const was = r.getRenderTarget(), auto = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    try {
      r.setRenderTarget(this.sRT); r.setClearColor(0x000000, 0); r.autoClear = true; r.clear(); r.render(this.sScene, cam);
      r.readRenderTargetPixels(this.sRT, 0, 0, S, S, this.sBuf);
    } finally { r.setRenderTarget(was); r.setClearColor(cc, ca); r.autoClear = auto; for (const p of proxies) this.sScene.remove(p); }
    return baseFromPixels(this.sBuf, S, true);
  }

  // ------------------------------------------------------------------------------------------------------------ the lines, polled
  /** Read its tag and its plate; note what changed (a decrypt for a line now plain that was not); make its scramble's words. */
  read(T) {
    const c = T.c; let tag = readTag(this.game, c); if (!tag) return;
    if (c.head && !c.bones?.eyes) { const h = c.head(); T.eyeDy = 0.68 * Math.max(0.2, h.y - 0.35 - c.pos.y); }
    T.plate = plateOf(this.game, c.kind); const min = !!TUNE.visual?.creatureTagsMinimal;
    if (min) tag = { ...tag, lines: tag.lines.filter((l) => MINIMAL.has(l.key)) };
    const sig = (min ? 'm' : '') + tag.level + '|' + (T.plate?.read || '-') + (T.plate?.thumb?.length || 0) + '|' + JSON.stringify(tag.lines);
    if (sig === T.sig) return; T.sig = sig; T.tag = tag; T.dirty = true;
    for (const L of tag.lines) {
      let R = T.rs.get(L.key);
      if (!R) { T.rs.set(L.key, (R = { read: L.read, tokens: null, dec: -1, len: L.len || 0 })); }
      else if (R.read !== 'plain' && L.read === 'plain' && L.key !== 'name') R.dec = this.t;
      R.read = L.read; if (L.read !== 'plain') { R.len = L.len || R.len; if (!R.tokens) R.tokens = this.tokensFor(L.key, R.len, T.seed); }
    }
    T.aberrant = !!((c.aberrant || c.stray) && !c.dataBugMended);
    const on = tag.lines.find((l) => l.key === 'statuses' && l.read === 'plain')?.value;
    T.motes.length = 0;
    if (on && !min) {
      for (const n of on.on || []) T.motes.push([n, 100]);
      for (const [t, k] of Object.entries(on.build || {})) { const n = TYPES[t]?.builds || t; if (!T.motes.some((m) => m[0] === n)) T.motes.push([n, Math.round(k * 100)]); }
    }
    T.rows = this.rows(T); T.h = Math.min(HMAX, Math.max(SH + 4, T.rows.reduce((a, r) => a + r.h, 0) + 2));
  }
  /** A scrambled line's words: its phrase, then roots from the pool until it is about as long as the hidden text (`len`). */
  tokensFor(key, len, seed) {
    const head = (PHR[key] || PHR.statuses).split(' '), R = rng(seed + key.length * 31), want = Math.max(2, Math.min(9, Math.round(len / 2.2)));
    const toks = head.slice(); let n = toks.reduce((a, t) => a + cells(t).length, 0);
    while (n < want) { const t = POOL[Math.floor(R() * POOL.length)]; toks.push(t); n += cells(t).length; }
    while (n > want + 1 && toks.length > 1) n -= cells(toks.pop()).length;
    return toks;
  }

  // ------------------------------------------------------------------------------------------------------------ the frame
  update(dt, slot) {
    const g = this.game, S = g.overlayScene, B = document.body.classList;
    this.t += dt;
    const hide = !!(g.title?.active || g.god?.controlling || g.emocean?.stage?.active || B.contains('cine') || !g.camera || this.hudOff());
    if (hide) { this.root.userData.overlayHidden = true; return; }
    const view = slot.view, pr = S.r.getPixelRatio(); this.dot = view.h / 480; this.Wd = view.w / this.dot;
    const k = Math.max(1, Math.round(pr * this.dot)); if (k !== this.k) { this.k = k; for (const T of this.tags.values()) T.dirty = true; }
    if (theme.id !== this.themeId) { this.themeId = theme.id; for (const T of this.tags.values()) T.dirty = true; }
    // where a tag may sit: the screen, or with the lens up the viewfinder's aperture (its pages' margins are drawn over the canvas)
    const scan = this.scanning, A = scan ? g.veritome.vf?.aperture?.(view.w, view.h) : null, Bd = this.bounds;
    if (A) { Bd.x0 = A.x / this.dot; Bd.y0 = A.y / this.dot; Bd.x1 = (A.x + A.w) / this.dot; Bd.y1 = (A.y + A.h) / this.dot; } else { Bd.x0 = 0; Bd.y0 = 0; Bd.x1 = this.Wd; Bd.y1 = 480; }
    // who, and their lines (a few times a real second)
    if ((this.pollT -= dt) <= 0) {
      this.pollT = POLL; const want = this.choose(); if (want.length) this.ensure();
      for (const c of want) if (!this.tags.has(c)) {
        const panel = this.panels.find((p) => !p.owner); if (!panel) break; panel.owner = c;
        this.tags.set(c, { c, panel, vis: 0, x: 0, y: 0, placed: false, sig: '', tag: null, rows: [], rs: new Map(), dirty: true, motes: [], h: 60, seed: 7 + (c.id ?? this.tags.size) * 13, eyeDy: 0.6, want: true, aberrant: false, plate: null });
      }
      for (const [c, T] of this.tags) { T.want = want.includes(c) && this.ok(c); if (T.want) this.read(T); }
    }
    if (!this.sheet) { this.root.userData.overlayHidden = true; return; }
    this.sheet.size(this.k);
    // the churn: a scrambled line swaps a word a quarter of a real second (never a strobe: the ghosts move with it)
    const churn = (this.churnT -= dt) <= 0; if (churn) this.churnT = CHURN;
    // retire; then every bracket first, so no tag is laid over another creature's bracket; then the tags in turn, each adding its leader
    this.sheet.begin(this.dot); this.nR = 0;
    if (!scan) { this.rect(this.Wd - 182, 0, this.Wd, 178); this.rect(this.Wd - 118, 250, this.Wd, 480); } // (the Sight, the Lachrimeter: stepped out under the lens)
    this.shown.length = 0; const live = [];
    for (const [c, T] of this.tags) {
      T.vis = T.want ? Math.min(1, T.vis + dt / T_IN) : Math.max(0, T.vis - dt / T_OUT);
      if (!T.want && T.vis <= 0) { T.panel.owner = null; this.tags.delete(c); continue; }
      if (!T.tag || !this.bracket(T)) continue;
      const b = T.b; this.rect(b.x0 - 3, b.y0 - 3, b.x1 + 3, b.y1 + 3); live.push(T);
    }
    for (const T of live) {
      this.place(T, dt);
      let decrypting = false; for (const R of T.rs.values()) if (R.dec >= 0) { if (this.t - R.dec < DECRYPT) decrypting = true; else R.dec = -1; }
      if (churn) for (const R of T.rs.values()) if (R.read === 'scrambled' && R.tokens) { const i = Math.floor(Math.random() * R.tokens.length); R.tokens[i] = POOL[Math.floor(Math.random() * POOL.length)]; T.dirty = true; T.ghost = Math.random() * 1e5; }
      if (T.dirty || decrypting) { T.panel.size(this.k); this.draw(T); T.dirty = decrypting; }
      this.marks(T); this.show(T); this.shown.push(T.c);
    }
    this.sheet.end();
    this.root.userData.overlayHidden = this.tags.size === 0;
  }

  /** Its bracket in dots, round its eyes projected; false when off screen. */
  bracket(T) {
    const c = T.c, e = (T.pe ||= {}); this.eye(c, T, this.v);
    if (!this.project(this.v, e)) return false;
    const cam = this.game.camera; this.right.setFromMatrixColumn(cam.matrixWorld, 0);
    const r = (T.pr ||= {}); this.project(this.v2.copy(this.v).addScaledVector(this.right, (c.radius || 0.4) * 0.45), r);
    const sp = Math.max(3, Math.min(42, Math.abs(r.x - e.x) || 6)), pad = Math.max(5, Math.min(12, sp * 0.5)), vy = pad * 1.1 + sp * 0.12;
    const bb = (T.b ||= {}); bb.x0 = e.x - sp - pad; bb.x1 = e.x + sp + pad; bb.y0 = e.y - vy; bb.y1 = e.y + vy; bb.ex = e.x; bb.ey = e.y; bb.sp = sp;
    return true;
  }
  /** Its leader for a tag at (x, y): from the bracket's corner nearest the lozenge, a diagonal, then straight to the lozenge. */
  leader(T, x, y, P) {
    const b = T.b, ax = x + 29, below = y + SH / 2 > b.ey, fx = ax < b.ex ? b.x0 : b.x1, fy = below ? b.y1 : b.y0;
    const end = below ? y - 3 : y + SH + 3, room = Math.abs(end - fy), rise = Math.min(RISE, Math.max(0, room - 4));
    P[0] = fx; P[1] = fy; P[2] = ax; P[3] = below ? fy + rise : fy - rise; P[4] = ax; P[5] = end; return P;
  }
  /** Lay its tag out in dots, above its bracket, kept off the obstacles (tags, brackets, leaders laid so far, the instruments, the edges). */
  place(T, dt) {
    const h = Math.max(SH + 4, T.h), b = T.b, Q = this.PTS;
    const Bd = this.bounds, clamp = (x, y) => [Math.max(Bd.x0 + 20, Math.min(Bd.x1 - W - 6, x)), Math.max(Bd.y0 + 6, Math.min(Bd.y1 - h - 6, y))];
    const over = (x0, y0, x1, y1, skip) => { for (let i = 0; i < this.nR; i++) { const R = this.rects[i]; if (R === skip) continue; if (x0 < R.x1 && x1 > R.x0 && y0 < R.y1 && y1 > R.y0) return R; } return null; };
    const own = this.ownRect(T);
    const hit = (x, y) => { // (the tag's box, and its leader's straight run, which must not cross another's things)
      const R = over(x - 16, y, x + W, y + h); if (R) return R;
      this.leader(T, x, y, Q); return over(Q[2] - 1.5, Math.min(Q[3], Q[5]), Q[2] + 1.5, Math.max(Q[3], Q[5]), own);
    };
    let [tx, ty] = clamp(b.ex - 74, b.y0 - RISE - SH - 64);
    for (let n = 0; n < 6; n++) {
      const R = hit(tx, ty); if (!R) break;
      const opts = [[R.x0 - W - 4, ty], [R.x1 + 20, ty], [tx, R.y1 + 4], [tx, R.y0 - h - 4], [b.x1 + 24, b.ey - h / 2], [b.x0 - W - 8, b.ey - h / 2]].map(([x, y]) => clamp(x, y)).filter(([x, y]) => !hit(x, y));
      if (!opts.length) break; opts.sort((a, c) => Math.hypot(a[0] - tx, a[1] - ty) - Math.hypot(c[0] - tx, c[1] - ty)); [tx, ty] = opts[0];
    }
    if (!T.placed) { T.x = tx; T.y = ty; T.placed = true; } else { const a = 1 - Math.exp(-14 * dt); T.x += (tx - T.x) * a; T.y += (ty - T.y) * a; }
    // what it now takes up: its box, and its leader (the straight run, and the diagonal in three steps)
    const x = Math.round(T.x), y = Math.round(T.y); this.rect(x - 16, y, x + W, y + h); this.leader(T, x, y, Q);
    this.rect(Q[2] - 2, Math.min(Q[3], Q[5]), Q[2] + 2, Math.max(Q[3], Q[5]));
    for (let i = 1; i <= 3; i++) { const u = i / 4, px = Q[0] + (Q[2] - Q[0]) * u, py = Q[1] + (Q[3] - Q[1]) * u; this.rect(px - 3, py - 3, px + 3, py + 3); }
    return true;
  }
  /** The obstacle that is this tag's own bracket (its leader starts there, so the leader may touch it). */
  ownRect(T) { const b = T.b; for (let i = 0; i < this.nR; i++) { const R = this.rects[i]; if (R.x0 === b.x0 - 3 && R.y0 === b.y0 - 3) return R; } return null; }
  rect(x0, y0, x1, y1) { if (this.nR >= this.rects.length) return; const R = this.rects[this.nR++]; R.x0 = x0; R.y0 = y0; R.x1 = x1; R.y1 = y1; }

  /** The plane: its canvas over the tag's place, unfolding from a line as it comes (and folding as it goes). */
  show(T) {
    const P = T.panel, d = this.dot, x = Math.round(T.x), y = Math.round(T.y), sy = Math.max(0.02, Math.min(1, (T.vis - 0.35) / 0.65));
    const w = (W + 2 * M) * d, hh = (HMAX + 2 * M) * d;
    if (T.vis > 0.35) this.sheet.plate(P.i, Math.round((x - M) * d), Math.round((y - M) * d), w, hh * sy);
  }

  /** The bracket at its eyes, the leader to the lozenge, and its status motes: quads in the shared buffer. */
  marks(T) {
    const S = this.sheet, b = T.b, x = Math.round(T.x), y = Math.round(T.y), P = this.PTS;
    const lead = Math.min(1, T.vis * 2.2);
    // the bracket (the mock's, with both eyes inside it): four corners, ink under the VFD line
    const Lx = Math.max(4, (b.x1 - b.x0) * 0.24), Ly = Math.max(3, (b.y1 - b.y0) * 0.3);
    for (const pass of [0, 1]) {
      S.col = pass ? C_VFD : C_INK; const w = pass ? 1.3 : 3.1;
      for (let q = 0; q < 4; q++) { const sx = q === 0 || q === 3 ? 1 : -1, sy = q < 2 ? 1 : -1, cx = sx > 0 ? b.x0 : b.x1, cy = sy > 0 ? b.y0 : b.y1; S.seg(cx + sx * Lx * lead, cy, cx, cy, w); S.seg(cx, cy, cx, cy + sy * Ly * lead, w); }
    }
    this.leader(T, x, y, P); S.col = C_INK; S.path(P, 3, 3, true, lead); S.col = C_VFD; S.path(P, 3, 1.2, true, lead);
    // the status motes, orbiting the head, a trail behind each, a ring of its build-up from STUDIED
    if (!T.motes.length || T.vis < 1) return;
    const hx = b.ex, hy = b.y0 - 6, rx = Math.max(18, b.sp * 2.4 + 10), ry = rx * 0.24, ph = this.t * 0.9;
    T.motes.forEach(([id, v], i) => {
      const an = ph + i / T.motes.length * Math.PI * 2, mx = hx + Math.cos(an) * rx, my = hy + Math.sin(an) * ry, col = ST[id] || LIGHT;
      for (let t = 1; t <= 3; t++) { const a2 = an - t * 0.11; S.col = C_TRAIL[id + t] ||= lin(col, 0.5 - t * 0.13); S.rect(hx + Math.cos(a2) * rx - 1, hy + Math.sin(a2) * ry - 1, 2, 2); }
      const gl = GLYPH[id] || GLYPH.other, d = 1.3;
      S.col = C_INK; gl.forEach((row, j) => { for (let q = 0; q < 7; q++) if (row[q] === '#') S.rect(mx + (q - 3.5) * d - d * 0.6, my + (j - 3.5) * d - d * 0.6, d * 2.2, d * 2.2); });
      S.col = C_TRAIL[id] ||= lin(col, 1); gl.forEach((row, j) => { for (let q = 0; q < 7; q++) if (row[q] === '#') S.rect(mx + (q - 3.5) * d, my + (j - 3.5) * d, d, d); });
      if ((T.tag?.level ?? 0) >= 3) { S.col = C_INK; S.arc(mx, my, 8, 0, Math.PI * 2, 2.6, 16); S.col = C_TRAIL[id]; S.arc(mx, my, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v / 100, 1.3, 16); }
    });
  }

  // ------------------------------------------------------------------------------------------------------------ the tag's canvas
  /** Its rows from Dovina's lines: a hidden line a taller row (the hand), statuses at most two rows when they read plain. */
  rows(T) {
    const out = [];
    for (const L of T.tag.lines) {
      if (L.key === 'statuses' && L.read === 'plain' && T.motes.length) { for (const s of T.motes.slice(0, 2)) out.push({ key: 'statuses', h: ROW, line: L, s }); continue; }
      out.push({ key: L.key, h: L.key === 'name' ? NAME_H : L.key === 'functions' ? FN_H : L.read === 'plain' ? ROW : HID_H, line: L });
    }
    return out;
  }

  /** The plate: the mock's plateC (the lozenge, the sprite, the lens, the bus, the rows), then the tear for an aberrant. */
  draw(T) {
    const P = T.panel, k = P.k, ab = T.aberrant, tgt = ab ? P.tear() : P.cv, g = tgt.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tgt.width, tgt.height); g.setTransform(k, 0, 0, k, M * k, M * k); KK = k;
    const rows = T.rows, fam = Math.max(0, Math.min(4, T.tag.level | 0)), h = T.h, spr = this.spriteOf(T), lit = spr.mode !== 'plate';
    { // the readout's scrim: a dark screen-glass behind the lines, so they read over bright sand and sky (no plate: it fades out at its far edge)
      const sg = g.createLinearGradient(GX - 8, 0, W, 0); sg.addColorStop(0, 'rgba(4,8,6,.5)'); sg.addColorStop(0.75, 'rgba(4,8,6,.38)'); sg.addColorStop(1, 'rgba(4,8,6,0)');
      g.fillStyle = sg; g.fillRect(GX - 8, 0, W - GX + 8, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = 1; yy < h; yy += 2) g.fillRect(GX - 8, yy, W - GX + 8, 0.7);
    }
    const ch = 12, loz = () => { g.beginPath(); g.moveTo(ch, 0); g.lineTo(SW - ch, 0); g.lineTo(SW, SH / 2); g.lineTo(SW - ch, SH); g.lineTo(ch, SH); g.lineTo(0, SH / 2); g.closePath(); };
    // the bezel and the glass (lit behind a shadow; dark behind a plate's picture)
    loz(); g.strokeStyle = '#05030a'; g.lineWidth = 6; g.stroke(); loz(); g.strokeStyle = film(g, 0, 0, SW, SH); g.lineWidth = 1; g.stroke();
    loz(); const gl = g.createRadialGradient(SW / 2, SH / 2, 4, SW / 2, SH / 2, SW * 0.62); gl.addColorStop(0, lit ? '#1a7a55' : '#0b2a1d'); gl.addColorStop(1, '#020a06'); g.fillStyle = gl; g.fill();
    g.save(); loz(); g.clip();
    // the sprite: its picture on a grid a step finer a familiarity level
    const [gw, gh] = GRIDS[fam], cw = AW / gw, chh = AH / gh, sx0 = (SW - AW) / 2, sy0 = (SH - AH) / 2 + 1, grid = gridOf(spr.base, gw, gh), gap = Math.min(0.35, cw * 0.15);
    const slid0 = Math.round(gh * 0.28), slid1 = Math.round(gh * 0.45), slide = Math.max(1, Math.round(gw / 11));
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const l = grid[j * gw + i]; if (l == null) continue; let ii = i, col;
      if (ab && j >= slid0 && j <= slid1) ii = i + slide; // (a slid band of rows)
      col = lit ? SHADOW : l < 0.3 ? TONES[0] : l < 0.55 ? TONES[1] : l < 0.8 ? TONES[2] : TONES[3];
      if (ab && (i * 7 + j * 3) % 11 === 0) col = MAG;
      g.fillStyle = col; g.fillRect(sx0 + ii * cw, sy0 + j * chh, cw - gap, chh - gap);
    }
    if (spr.mode === 'latent') { // (a plate of it waits undeveloped: the shadow held still in a plate's corner marks, in the window colour)
      const col = windowColour(), a = sx0 + 3, b2 = sx0 + AW - 3, c0 = sy0 + 1, c1 = sy0 + AH - 1, L = 6; g.strokeStyle = col; g.lineWidth = 1.2;
      for (const [cx, cy, sx, sy] of [[a, c0, 1, 1], [b2, c0, -1, 1], [b2, c1, -1, -1], [a, c1, 1, -1]]) { g.beginPath(); g.moveTo(cx + sx * L, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * L); g.stroke(); }
    }
    if (ab) { g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(217,26,128,.22)'; g.fillRect(0, SH * 0.45, SW, SH); } g.globalCompositeOperation = 'source-over';
    for (let yy = 0; yy < SH; yy += 2) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, yy, SW, 0.8); }
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.beginPath(); g.arc(SW * 0.5, SH * 1.6, SH * 1.35, -2.2, -1.25); g.stroke();
    g.restore();
    loz(); g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 4 * k; g.strokeStyle = hexA(VFD, 0.7); g.lineWidth = 0.7; g.stroke(); g.restore();
    // the lens: the sigil-eye on the lozenge's side
    g.strokeStyle = '#05030a'; g.lineWidth = 3; g.beginPath(); g.arc(-3, SH / 2, 12.5, 0, 7); g.stroke(); g.strokeStyle = film(g, -15, 0, 9, 0); g.lineWidth = 1; g.beginPath(); g.arc(-3, SH / 2, 12.5, 0, 7); g.stroke();
    this.sigil(g, -3, SH / 2, 8.5, fam, k);
    // the readout beside it: bare lines, a hairline under each, joined to the screen by a short bus
    g.strokeStyle = hexA(VFD, 0.5); g.lineWidth = 0.7; g.beginPath(); g.moveTo(SW + 1, SH / 2); g.lineTo(GX - 5, SH / 2); g.moveTo(GX - 5, 3); g.lineTo(GX - 5, h - 3); g.stroke();
    let y = 0; const ww = W - GX;
    for (const r of rows) {
      const R = T.rs.get(r.key), dec = R && R.dec >= 0 ? Math.min(1, (this.t - R.dec) / DECRYPT) : 1;
      if (r.line.read === 'plain') {
        if (dec < 1) { // the decrypt: the plain line wiped in behind a VFD cursor, the scramble it was still to the right of it
          const fx = GX + ww * dec;
          g.save(); g.beginPath(); g.rect(GX - 4, y, fx - GX + 4, r.h); g.clip(); this.row(g, T, r, fam, GX, y, ww); g.restore();
          if (R.tokens) { g.save(); g.beginPath(); g.rect(fx, y, GX + ww - fx + 2, r.h); g.clip(); this.hidden(g, T, { ...r, line: { ...r.line, read: 'scrambled' } }, GX, y, ww); g.restore(); }
          g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; g.fillStyle = VFD; g.fillRect(fx, y + 2, 1.4, r.h - 4); g.restore();
        } else this.row(g, T, r, fam, GX, y, ww);
      } else this.hidden(g, T, r, GX, y, ww);
      y += r.h; g.fillStyle = hexA(VFD, 0.22); g.fillRect(GX, y - 0.6, ww, 0.6);
    }
    if (ab) this.compose(P, h);
    this.sheet.put(P.i, P.cv);
  }

  row(g, T, r, fam, x, y, w) {
    if (r.key !== 'functions') { rowPlain(g, r, fam, x, y, w); return; }
    // the neuralese its mind would take (UNDERSTOOD, while stunned): the words you know in the hand, a dashed cell a blank
    const { words: ws = [], blanks = 0 } = r.line.value || {}; let cx = x;
    if (ws.length) cx += this.hand(g, T.panel, ws.map((s) => s.toUpperCase()), x, y, r.h, w - 16 * Math.min(blanks, 3), 'functions', 'left') + 4;
    g.save(); g.setLineDash([1.5, 1.5]); g.strokeStyle = hexA(VFD, 0.6); g.lineWidth = 0.8;
    for (let i = 0; i < blanks && cx + 12 <= x + w; i++, cx += 14) g.strokeRect(cx + 0.5, y + 5.5, 11, r.h - 11);
    g.restore();
  }
  /** A scrambled or latent row: its label (the tag keeps its shape at every level), then the hand across the rest of the row. */
  hidden(g, T, r, x, y, w) {
    if (r.key === 'name') { T_(g, '???', x, base(y, r.h, PX.name)); return; }
    const lw = LABEL[r.key] ? LBL : 0, R = T.rs.get(r.key);
    if (lw) label(g, LABEL[r.key], x, y, r.h);
    if (!R?.tokens) return;
    this.hand(g, T.panel, R.tokens, x + lw, y, r.h, w - lw, r.line.read === 'latent' ? 'latent' : 'scrambled', 'right', T.ghost || T.seed);
  }

  /** Neuralese in the running hand (ui/runninghand.js, final, drawn as it is): measured first (a scale that reads as script, smaller
   *  only to fit the row's height; words dropped to fit its width), drawn white into a scratch canvas by its bounds, then tinted:
   *  scrambled is the schiller with three cells caught mid-change; latent the window colour, still, with a plate's corner marks. */
  hand(g, P, tokens, x, y, rowH, maxW, mode, align, seed = 7) {
    const k = P.k, H = P.hand, hx = H.getContext('2d'), pad = 2;
    let toks = tokens.slice(), s = mode === 'functions' ? HAND_FN : HAND_S, m = null;
    const measure = () => { m = runningHand(null, toks.map((t) => ({ cells: cells(t) })), { x: 0, y: 0, scale: s }); };
    measure();
    if (m.height + m.lw > rowH - 3) { s *= (rowH - 3) / (m.height + m.lw); measure(); }
    while (m.width + m.lw > maxW && toks.length > 1) { toks = toks.slice(0, -1); measure(); }
    if (m.width + m.lw > maxW) { s *= maxW / (m.width + m.lw); measure(); }
    const wd = m.width + m.lw, hd = m.height + m.lw, sw = Math.ceil((wd + 2 * pad) * k), sh = Math.ceil((hd + 2 * pad) * k);
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, H.width, H.height); hx.setTransform(k, 0, 0, k, 0, 0);
    runningHand(hx, toks.map((t) => ({ cells: cells(t) })), { x: pad + m.lw / 2 - m.x0, y: pad + m.lw / 2 - m.y0, scale: s, ink: '#fff' });
    const x0 = align === 'right' ? x + maxW - wd : x, y0 = y + (rowH - hd) / 2;
    const tA = P.tA, ta = tA.getContext('2d');
    const tint = (fill) => { ta.setTransform(1, 0, 0, 1, 0, 0); ta.globalCompositeOperation = 'copy'; ta.drawImage(H, 0, 0); ta.globalCompositeOperation = 'source-in'; ta.setTransform(k, 0, 0, k, 0, 0); ta.fillStyle = fill; ta.fillRect(0, 0, 200, 40); ta.globalCompositeOperation = 'source-over'; };
    const put = (dx = 0, dy = 0) => g.drawImage(tA, 0, 0, sw, sh, x0 - pad + dx, y0 - pad + dy, sw / k, sh / k);
    tint('rgba(13,10,18,.85)'); for (const [dx, dy] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) put(dx, dy);
    if (mode === 'latent') { // (still, in the window colour, a plate's corner marks at its ends: Dovina's latent read)
      const col = windowColour(); tint(col); g.save(); g.shadowColor = hexA(col, 0.9); g.shadowBlur = 3 * k; put(); g.restore();
      const a = x0 - 3, b = x0 + wd + 3, c0 = y + 1.5, c1 = y + rowH - 2; g.fillStyle = col;
      for (const [cx, cy, sx, sy] of [[a, c0, 1, 1], [b, c0, -1, 1], [b, c1, -1, -1], [a, c1, 1, -1]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 4, cy); g.lineTo(cx, cy + sy * 4); g.closePath(); g.fill(); }
      return wd;
    }
    if (mode === 'functions') { tint(VFD); g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; put(); g.restore(); return wd; }
    tint(schill(ta, 0, wd * 1.3)); put();
    // the churn, caught: three cells mid-change, ghosted magenta and cyan; a VFD cursor where it would resolve from
    const R = rng(Math.floor(seed) * 7 + 3); g.save(); g.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 3; q++) {
      const cx = x0 + R() * Math.max(1, wd - 8), cw = 5 + R() * 6; g.save(); g.beginPath(); g.rect(cx, y + 1, cw, rowH - 2); g.clip();
      tint('rgba(255,42,154,.6)'); put(0, -1.2); tint('rgba(34,230,255,.5)'); put(0.7, 1.1); g.restore();
    }
    g.restore(); g.save(); g.fillStyle = VFD; g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; g.fillRect(x0 - 3.5, y0, 1.2, hd); g.restore();
    return wd;
  }

  /** The sigil-eye in hard light (the mock's sigilDial): four outer arcs light one a familiarity level, the eye gaining parts. */
  sigil(g, cx, cy, R, fam, k) {
    const L = R / 22, D2R = Math.PI / 180;
    const cut = (path, w, c, dash) => {
      g.lineCap = 'round'; g.setLineDash(dash ? dash.map((d) => d * L) : []); g.strokeStyle = 'rgba(13,10,18,.85)'; g.lineWidth = (w + 1.6) * L; path(); g.stroke();
      g.save(); g.shadowColor = c === VFD ? VFD_GLOW : 'rgba(164,140,242,.8)'; g.shadowBlur = 2.5 * k; g.strokeStyle = c || LIGHT; g.lineWidth = w * L; path(); g.stroke(); g.restore(); g.setLineDash([]);
    };
    const circ = (x, y, r) => () => { g.beginPath(); g.arc(x, y, r, 0, 7); };
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3); gr.addColorStop(0, 'rgba(13,10,18,.7)'); gr.addColorStop(0.75, 'rgba(13,10,18,.45)'); gr.addColorStop(1, 'rgba(13,10,18,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 1.35, 0, 7); g.fill();
    for (let q = 0; q < 4; q++) { const a0 = (-90 + q * 90 + 7) * D2R, a1 = (-90 + q * 90 + 83) * D2R, p = () => { g.beginPath(); g.arc(cx, cy, R * 1.24, a0, a1); }; if (q < fam) cut(p, 2.4, VFD); else cut(p, 1, 'rgba(169,156,204,.45)', [1.5, 3]); }
    const hw = R * 0.78, hh = R * 0.42, kk = (hw * hw - hh * hh) / (2 * hh), rr = kk + hh, ang = Math.atan2(hw, kk);
    const almond = () => { g.beginPath(); g.arc(cx, cy + kk, rr, -Math.PI / 2 - ang, -Math.PI / 2 + ang); g.arc(cx, cy - kk, rr, Math.PI / 2 - ang, Math.PI / 2 + ang); };
    if (!fam) { cut(almond, 1, 'rgba(169,156,204,.6)', [1.4, 2.4]); return; }
    if (fam >= 2) cut(circ(cx, cy, R), 1.4);
    if (fam >= 4) {
      cut(circ(cx, cy, R * 0.88), 0.7);
      [[[-hw, 0], [-R * 0.88, 0]], [[hw, 0], [R * 0.88, 0]], [[0, -hh * 0.9], [0, -R * 0.62], [R * 0.32, -R * 0.62], [R * 0.46, -R * 0.72]], [[0, hh * 0.9], [0, R * 0.62], [-R * 0.32, R * 0.62], [-R * 0.46, R * 0.72]]]
        .forEach((t) => cut(() => { g.beginPath(); t.forEach(([x, y], i) => (i ? g.lineTo(cx + x, cy + y) : g.moveTo(cx + x, cy + y))); }, 0.7));
    }
    cut(almond, 1.4);
    if (fam >= 3) { [-1, 1].forEach((sx) => cut(circ(cx + sx * (hw + R * 0.09), cy, R * 0.08), 1)); cut(circ(cx, cy, hh * 0.86), 1); }
    g.fillStyle = VFD; g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; g.beginPath(); g.arc(cx, cy, hh * 0.4, 0, 7); g.fill(); g.restore();
  }

  /** An aberrant's tear, held still (the mock's compose with chroma 2.8 and ab): a wide chromatic split, a block of the readout slid
   *  sideways, a magenta cast over the lower half, a hairline where it sheared and dead pixels at its foot. */
  compose(P, h) {
    const K = P.k, src = P.work, out = P.cv, g = out.getContext('2d'), Wc = src.width, Hc = src.height, tc = P.tint, tx = tc.getContext('2d');
    const tint = (col, from = src) => { tx.globalCompositeOperation = 'copy'; tx.drawImage(from, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, Wc, Hc); tx.globalCompositeOperation = 'source-over'; return tc; };
    const by0 = Math.round((M + h * 0.3) * K), bh = Math.round(h * 0.2 * K), bx0 = Math.round((M + GX + LBL) * K), bw = Wc - bx0, sh = Math.round(7 * K), sp = Math.round(2.8 * K);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, Wc, Hc);
    // the split (the block cut out of the copies, as the mock's)
    g.save(); g.beginPath(); g.rect(0, 0, Wc, by0); g.rect(0, by0 + bh, Wc, Hc - by0 - bh); g.rect(0, by0, bx0, bh); g.clip();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.62; g.drawImage(tint(MAG), -sp, 0); g.drawImage(tint(CYAN), sp, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(src, 0, 0); g.restore();
    // the slid block, its magenta ghost behind it
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55; g.drawImage(tint(MAG), bx0, by0, bw, bh, bx0 + sh - Math.round(2 * K), by0, bw, bh); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(src, bx0, by0, bw, bh, bx0 + sh, by0, bw, bh);
    // the magenta cast over the torn half, held still
    const hy = Math.round(0.48 * (h + 2 * M) * K); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.26; g.drawImage(tint('#d91a80'), 0, hy, Wc, Hc - hy, 0, hy, Wc, Hc - hy); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // the edges of the tear: a hairline of light where the block sheared, dead pixels at its foot
    g.fillStyle = 'rgba(255,90,180,.9)'; g.fillRect(bx0 + sh, by0, Math.round(0.8 * K) || 1, bh);
    const q = Math.round(3 * K); for (const [dx, dy, c] of [[0, 0, '#d91a80'], [1, 0, '#000'], [0, 1, '#000'], [1, 1, '#d91a80'], [3, -1, '#d91a80'], [-2, 1, '#22e6ff']]) { g.fillStyle = c; g.fillRect(bx0 + dx * q, by0 + bh + dy * q, q, q); }
  }
}
/** The name unknown: ??? carved in the name face (OVERLAY.md 16). */
function T_(g, s, x, y) { T(g, s, x, y, `700 ${PX.name}px ${FONT.title}`, PAL.word); }
