// ---------------------------------------------------------------------------------------
// CREATURE TAGS: a creature's tag as THE SCAN (docs/plans/OVERLAY.md 10.5f: the owner's pick, direction C of board v8). One bracket
// framing the creature's eyes, a dashed leader line, a small CRT lozenge (a hex-cornered screen) holding the creature's own silhouette
// sampled into a 22 x 18 pixel sprite, its readout beside it as bare lines (no plate, no barcode, no id), the sigil-eye as the lens on
// the lozenge's side, and the status motes orbiting its head. Familiarity shows twice: in the lines (Dovina's one reader,
// tools/veritome/creaturetag.js, OVERLAY.md 17) and in the sprite (a shadow at UNKNOWN, a solid shape at GLIMPSED, two tones at
// OBSERVED, full tones from STUDIED). An aberrant's sprite has rows slid and a magenta cast and its readout is torn, held still.
//
// The three reads (OVERLAY.md 17): a plain line is drawn as the mock drew it; a scrambled line churns in the running hand (its
// neuralese, real roots, swapping a word every quarter of a real second, sized by the reader's `len`); a latent line holds still in
// the window colour (ui/theme.js) with a plate's corner marks; a line that was scrambled or latent and is now plain plays its decrypt
// (0.6 real s: the plain line wiping in left to right behind a VFD cursor). No event: the tag remembers what it last drew.
//
// Which creatures: the one locked on (game.lock), and up to two others nearest in view within 14 m while any of them is awake (not
// asleep); none when none. Clapperjars come from their own list (creatures/clappers.js). Each is anchored to its eyes projected each
// frame, the tags kept off each other, the screen's edges and the Sight's corner; a tag's canvas is redrawn only when its lines change
// (or its scramble churns, or a decrypt plays).
//
// Cost: one draw call a tag (its canvas, drawn once and redrawn on a change) and one for every bracket, leader and mote together
// (a dynamic buffer of quads, no allocation a frame). The sprite is sampled once a kind: its meshes rendered alone at 96 x 96 off
// screen and read back. Hook: `game.veritome.plateOf(kind)`, when it exists and gives an image, is pixelated instead (Dovina is asked).
// Hidden with the HUD (the overlay scene's rule), on the title, in the god hand, on the rail's crossing and in a cinematic.
//
// Prior art: Digimon World's and the Pokédex's scan (the creature as a sprite on a small screen; the unseen one as a shadow), Watch
// Dogs' profiler (a glance reads a line; the leader line), Dennō Coil's glasses (the data over the world, legible or broken), Mass
// Effect's and Uplink's decrypt (characters churning, then settling), Pokémon Snap's report (the latent line), the game's own data bug
// (vfx/databug.js: one still error, a magenta cast) for the tear; VFD tubes for the counts (10.5d). Ported from Calissa's round-7 mock
// (r7-tags.src.html, figure 3, plateC / tagC) to r170, at the 480-line present (one canvas pixel a dot, times the device's k).
//
//   game.creatureTags = new CreatureTags(game)   (added to game.overlayScene; it updates itself there)   .shown -> [creature]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { readTag } from '../tools/veritome/creaturetag.js';
import { st } from '../creatures/creatures.js';
import { EMO } from '../progress/combat/emo.js';
import { TYPES, BONUS } from '../progress/combat/types.js';
import { poles } from '../progress/combat/temperament.js';
import { FONT, THEMES, theme } from '../ui/theme.js';
import { runningHand } from '../ui/runninghand.js';
import { cellsOf } from '../npc/neuralesespelling.js';

const MAX = 3, NEAR = 14, POLL = 0.25, CHURN = 0.25, DECRYPT = 0.6, T_IN = 0.25, T_OUT = 0.17;
const W = 196, M = 18, SW = 58, SH = 50, GX = 68, HMAX = 168, GW = 22, GH = 18, RISE = 30;
const INK = '#0d0a12', LIGHT = '#e6deff', VFD = '#7dffd2', VFD_GLOW = 'rgba(60,255,190,.85)', MAG = '#ff2a9a', CYAN = '#22e6ff';
const FILM_HI = ['#8a5cff', '#3fc4f0', '#f6cd5a', '#ff5aa8'], FILM_LIT = ['#b49cff', '#7fe3ff', '#ffd56b', '#ff86c8'];
const PAL = { lab: '#8fd8b0', dim: '#8fd8b0', val: VFD, glow: VFD_GLOW, word: '#e2fff0', wordGlow: 'rgba(60,255,190,.35)' };
const TONES = ['#0b3d2a', '#2a9e6e', '#7dffd2', '#e9fff7'];
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
const C_INK = lin(INK, 0.85), C_VFD = lin(VFD, 1), C_TRAIL = {};
const windowColour = () => (THEMES[theme.id] || THEMES.kiln).mid;

/** The fallback hand (only while ui/runninghand.js draws nothing): each syllable's consonant as a pad and a stem, placed and shaped by
 *  the orthography (cellsOf), its vowel marks round it, the words hung from one bus. Spelt, but not the final hand's drawing. */
function fallbackHand(x, words, { x: ox = 0, y: oy = 0, scale: s = 1, ink = '#fff' } = {}) {
  x.save(); x.strokeStyle = ink; x.fillStyle = ink; x.lineWidth = Math.max(0.7, s * 0.85); x.lineCap = 'round';
  let cx = ox; const top = oy + 2.5 * s, base = oy + 8.5 * s;
  for (const w of words) {
    const x0 = cx;
    for (const c of w.cells) {
      if (c.vowels.includes('e')) { x.beginPath(); x.arc(cx + 1.2 * s, base - 2 * s, 1.2 * s, Math.PI * 0.4, Math.PI * 1.7); x.stroke(); cx += 3 * s; }
      const L = c.onset[0], l = cx, r = cx + 5 * s, mid = cx + 2.5 * s;
      const px = !L ? mid : L.place === 'lips' ? l : L.place === 'back' ? r : mid, py = L?.place === 'tip' ? top : base;
      x.beginPath();
      if (!L) x.arc(mid, base - 2 * s, 1.6 * s, 0, Math.PI * 2);
      else if (L.manner === 'liquid') { x.moveTo(l, top); x.quadraticCurveTo(L.mark === 'in' ? r + 2 * s : l - 1 * s, base + 1 * s, r, top); }
      else { x.moveTo(px, top); x.lineTo(px, base); if (L.manner === 'nasal') { x.moveTo(px + (px === r ? -1.6 : 1.6) * s, top + s); x.lineTo(px + (px === r ? -1.6 : 1.6) * s, base); } }
      if (L?.manner === 'fricative') { const my = (top + base) / 2; x.moveTo(px - 1.4 * s, my - 0.8 * s); x.lineTo(px + 1.4 * s, my + 0.8 * s); if (L.mark !== 'tick') { x.moveTo(px - 1.4 * s, my + 1.2 * s); x.lineTo(px + 1.4 * s, my + 2.8 * s); } }
      x.stroke();
      if (L) { x.beginPath(); x.arc(px, py, 1.1 * s, 0, Math.PI * 2); L.voiced ? x.fill() : x.stroke(); }
      if (c.onset[1]) { x.beginPath(); x.moveTo(mid - s, base + 1.6 * s); x.lineTo(mid + 1.6 * s, base + 1.6 * s); x.stroke(); }
      if (c.vowels.includes('i')) { x.beginPath(); x.moveTo(mid - 1.2 * s, top - 1.8 * s); x.lineTo(mid + 1.8 * s, top - 2.4 * s); x.stroke(); }
      if (c.vowels.includes('u')) { x.beginPath(); x.arc(mid, base + 2.4 * s, 0.8 * s, 0, Math.PI * 2); x.fill(); }
      cx = r + 1.5 * s;
      if (c.vowels.includes('o')) { x.beginPath(); x.arc(cx, base - 3 * s, 1.3 * s, -Math.PI / 2, Math.PI / 2); x.stroke(); cx += 2.5 * s; }
      if (c.coda) { x.beginPath(); x.moveTo(cx - 0.5 * s, top + s); x.lineTo(cx - 0.5 * s, base); x.moveTo(cx - 2 * s, top + s); x.lineTo(cx + s, top + s); x.stroke(); cx += 2 * s; }
    }
    x.beginPath(); x.moveTo(x0, base + 0.4 * s); x.lineTo(cx, base + 0.4 * s); x.stroke(); cx += 3.5 * s;
  }
  x.restore(); return { width: cx - ox - 3.5 * s, height: 11 * s, x0: ox, y0: oy };
}

/** The sprite from pixels: the mock's sampler (the silhouette's bounds fitted into GW x GH, a cell's luminance or null). */
function sampleGrid(d, S, alphaOk, flip) {
  let x0 = S, y0 = S, x1 = 0, y1 = 0;
  const at = (i, j) => ((flip ? S - 1 - j : j) * S + i) * 4;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (!alphaOk || d[at(i, j) + 3] > 150) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
  if (x1 < x0) return null;
  const cs = Math.max((x1 - x0 + 1) / GW, (y1 - y0 + 1) / GH), ox = (x0 + x1) / 2 - cs * GW / 2, oy = (y0 + y1) / 2 - cs * GH / 2, out = new Array(GW * GH).fill(null);
  let lo = 1, hi = 0;
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const px = Math.floor(ox + (i + 0.5) * cs), py = Math.floor(oy + (j + 0.5) * cs); if (px < 0 || py < 0 || px >= S || py >= S) continue;
    const k = at(px, py); if (alphaOk && d[k + 3] <= 150) continue;
    const l = Math.sqrt((0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]) / 255); out[j * GW + i] = l; lo = Math.min(lo, l); hi = Math.max(hi, l);
  }
  const span = Math.max(0.05, hi - lo); for (let i = 0; i < out.length; i++) if (out[i] != null) out[i] = (out[i] - lo) / span; // (tones spread over the shape)
  return out;
}
function ellipseGrid() { const out = []; for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const u = (i + 0.5) / GW * 2 - 1, v = (j + 0.5) / GH * 2 - 1; out.push(u * u + v * v < 0.9 ? 1 - (u + v + 2) / 4 : null); } return out; }

/** The quads of every bracket, leader and mote: one dynamic buffer, one draw call. Coordinates in dots, written as CSS px. */
class Strokes {
  constructor(cap = 12000) {
    this.cap = cap; this.p = new Float32Array(cap * 3); this.c = new Float32Array(cap * 4); this.n = 0; this.s = 1; this.col = C_VFD;
    const g = this.geo = new THREE.BufferGeometry();
    this.pa = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage); this.ca = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('color', this.ca); g.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 1; this.mesh.name = 'creaturetags-strokes';
  }
  begin(s) { this.n = 0; this.s = s; }
  v(x, y) { const i = this.n++, s = this.s; this.p[i * 3] = Math.round(x * s); this.p[i * 3 + 1] = -Math.round(y * s); this.p[i * 3 + 2] = 0; this.c.set(this.col, i * 4); }
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
  end() { this.geo.setDrawRange(0, this.n); this.pa.needsUpdate = true; this.ca.needsUpdate = true; }
}

/** One tag's screen: a canvas (its texture) on a plane, drawn at k device pixels a dot, and the scratch canvases its hand and tear use. */
class Panel {
  constructor() {
    this.cv = canvasOf(1, 1); this.tex = new THREE.CanvasTexture(this.cv);
    Object.assign(this.tex, { colorSpace: THREE.SRGBColorSpace, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; this.mesh.name = 'creaturetags-panel'; // (visible at boot, so the warm-up compiles it)
    this.k = 0; this.hand = canvasOf(1, 1); this.tA = canvasOf(1, 1); this.work = null; this.tint = null; this.owner = null;
  }
  size(k) {
    if (k === this.k) return; this.k = k;
    this.cv.width = (W + 2 * M) * k; this.cv.height = (HMAX + 2 * M) * k; this.tex.dispose();
    for (const c of [this.hand, this.tA]) { c.width = 300 * k; c.height = 40 * k; }
    if (this.work) { this.work.width = this.tint.width = this.cv.width; this.work.height = this.tint.height = this.cv.height; }
  }
  tear() { if (!this.work) { this.work = canvasOf(this.cv.width, this.cv.height); this.tint = canvasOf(this.cv.width, this.cv.height); } return this.work; }
}

// ---------------------------------------------------------------------------------------------------------------- the readout's drawing
// (the mock's T, label, words, num, bar, emoTrack and rowPlain, in the game's faces; KK is the plate's k, for glows in device pixels)
let KK = 1;
function T(g, s, x, y, font, col, align, glow) {
  g.save(); g.font = font; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(13,10,18,.92)'; g.lineWidth = 2.4; g.strokeText(s, x, y);
  if (glow) { g.shadowColor = glow; g.shadowBlur = 3.5 * KK; } g.fillStyle = col; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w;
}
const label = (g, s, x, y) => T(g, s, x, y, `14px ${COUNT}`, PAL.lab);
const words = (g, s, x, y, col, al) => T(g, s, x, y, `14px ${FONT.sys}`, col || PAL.word, al, PAL.wordGlow);
const num = (g, s, x, y, px, col, al) => T(g, s, x, y, `${px}px ${COUNT}`, col || PAL.val, al, PAL.glow);
function fitFont(g, str, maxW, size, face, weight = '') { let s = size; const f = () => `${weight}${s}px ${face}`; g.font = f(); while (g.measureText(str).width > maxW && s > 9) { s -= 0.5; g.font = f(); } return g.font; }
function bar(g, x, y, w, h, f, fam) {
  const lit = (xx, ww) => { g.save(); g.shadowColor = PAL.glow; g.shadowBlur = 3 * KK; g.fillStyle = PAL.val; g.fillRect(xx, y, ww, h); g.restore(); };
  g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6);
  if (fam <= 2) {
    const n = fam === 1 ? 4 : 8, on = Math.round(f * n), gw = (w - (n - 1) * 1.6) / n;
    for (let i = 0; i < n; i++) { const xx = x + i * (gw + 1.6); if (i < on) lit(xx, gw); else { g.strokeStyle = hexA(PAL.dim, 0.55); g.lineWidth = 0.7; g.strokeRect(xx + 0.35, y + 0.35, gw - 0.7, h - 0.7); } }
    return;
  }
  g.strokeStyle = hexA(PAL.dim, 0.55); g.lineWidth = 0.7; g.strokeRect(x + 0.35, y + 0.35, w - 0.7, h - 0.7); lit(x, w * f);
}
function emoTrack(g, x, y, w, cur, needle) {
  const [b0, b1] = EMO.optimal, z = [[0, b0], [b0, b1], [b1, 1]];
  g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(x - 0.8, y - 3.8, w + 1.6, 5.6);
  z.forEach(([a, b], i) => {
    const xa = x + w * a + (i ? 0.8 : 0), xb = x + w * b - (i < 2 ? 0.8 : 0);
    if (i === cur) { g.save(); g.shadowColor = PAL.glow; g.shadowBlur = 3 * KK; g.fillStyle = PAL.val; g.fillRect(xa, y - 3, xb - xa, 4); g.restore(); }
    else { g.strokeStyle = hexA(PAL.dim, 0.6); g.lineWidth = 0.7; g.strokeRect(xa + 0.35, y - 2.65, xb - xa - 0.7, 3.3); }
  });
  if (needle != null) { const nx = x + w * needle; g.fillStyle = PAL.word; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.moveTo(nx, y - 3.6); g.lineTo(nx - 2.6, y - 8); g.lineTo(nx + 2.6, y - 8); g.closePath(); g.stroke(); g.fill(); }
}
function glyphPx(g, id, x, y, d, col) {
  const gl = GLYPH[id] || GLYPH.other;
  g.fillStyle = 'rgba(13,10,18,.85)'; gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(x + (i - 3.5) * d - d * 0.6, y + (j - 3.5) * d - d * 0.6, d * 2.2, d * 2.2); }));
  g.fillStyle = col; gl.forEach((row, j) => [...row].forEach((c, i) => { if (c === '#') g.fillRect(x + (i - 3.5) * d, y + (j - 3.5) * d, d, d); }));
}
/** A plain row, as the mock's rowPlain (row r: { key, h, line, s? }; fam the tag's level). */
function rowPlain(g, r, fam, x, y, w) {
  const b = y + r.h - 4, XR = x + w, L = r.line;
  if (r.key === 'name') { const s = String(L.text || '').toUpperCase(); g.font = fitFont(g, s, w, 15, FONT.title, '700 '); T(g, s, x, y + r.h - 5, g.font, PAL.word, 'left', PAL.wordGlow); return; }
  if (r.key === 'habit') { label(g, 'NOW', x, b); words(g, L.text, XR, b, null, 'right'); return; }
  if (r.key === 'health') {
    label(g, 'HP', x, b); const bx = x + 18, bw = (fam >= 4 ? XR - 36 : XR) - bx; bar(g, bx, y + r.h / 2 - 2.5, bw, 5, L.value ?? 0, fam);
    if (fam >= 4 && L.text) { const [hp, max] = L.text.split('/').map((s) => s.trim()); num(g, hp, XR - 14, b + 1, 16, PAL.val, 'right'); num(g, '/' + max, XR, b + 1, 12, PAL.lab, 'right'); }
    return;
  }
  if (r.key === 'emo') {
    label(g, 'EMO', x, b); const exact = typeof L.value === 'number', band = exact ? (L.value < EMO.optimal[0] ? 0 : L.value > EMO.optimal[1] ? 2 : 1) : ['low', 'optimal', 'hot'].indexOf(L.value);
    const right = exact ? 20 : 36, bx = x + 24; emoTrack(g, bx, y + r.h / 2 + 2, XR - right - bx, band, exact ? L.value : null);
    if (exact) num(g, L.value.toFixed(2).replace(/^0/, ''), XR, b + 1, 16, PAL.val, 'right'); else num(g, String(L.value).toUpperCase(), XR, b, 13, PAL.val, 'right');
    return;
  }
  if (r.key === 'statuses') {
    if (!r.s) { label(g, 'STATUS', x, b); words(g, 'NONE', XR, b, null, 'right'); return; }
    const [id, v] = r.s, col = ST[id] || LIGHT; glyphPx(g, id, x + 4, y + r.h / 2, 1, col); words(g, id.toUpperCase(), x + 11, b, PAL.word);
    const bx = x + 60, bw = XR - 17 - bx; g.fillStyle = 'rgba(13,10,18,.7)'; g.fillRect(bx - 0.5, y + r.h / 2 - 1, bw + 1, 3); g.fillStyle = hexA(col, 0.35); g.fillRect(bx, y + r.h / 2 - 0.5, bw, 2);
    g.fillStyle = col; g.fillRect(bx, y + r.h / 2 - 0.5, bw * v / 100, 2); num(g, String(v), XR, b + 1, 14, col, 'right'); return;
  }
  if (r.key === 'weak') {
    label(g, 'WEAK', x, b); if (!L.value) { words(g, 'NONE', XR, b, null, 'right'); return; }
    const w2 = num(g, `×${(1 + BONUS.trump).toFixed(2).replace(/0$/, '')}`, XR, b + 1, 14, PAL.val, 'right'); words(g, (TYPES[L.value]?.name || L.value).toUpperCase(), XR - w2 - 3, b, null, 'right'); return;
  }
  if (r.key === 'grain') { label(g, 'GRAIN', x, b); const s = poles(L.value || {}).slice(0, 2).map((p) => p.toUpperCase()).join('·') || 'EVEN'; g.font = fitFont(g, s, w - 44, 14, FONT.sys); T(g, s, XR, b, g.font, PAL.word, 'right', PAL.wordGlow); }
}

// ---------------------------------------------------------------------------------------------------------------- the tags
export class CreatureTags {
  constructor(game) {
    this.game = game; this.tags = new Map(); this.sprites = new Map(); this.shown = [];
    this.pollT = 0; this.churnT = 0; this.t = 0; this.k = 0; this.dot = 1; this.handScale = 0; this.cellW = 7; this.fallback = false; this.themeId = null;
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3(); this.right = new THREE.Vector3(); this.PTS = new Float32Array(16); this.rects = Array.from({ length: MAX + 2 }, () => ({ x0: 0, y0: 0, x1: 0, y1: 0 })); this.nR = 0;
    const S = game.overlayScene; if (!S || typeof document === 'undefined') return;
    this.root = new THREE.Group(); this.root.name = 'creaturetags';
    this.strokes = new Strokes(); this.root.add(this.strokes.mesh);
    this.panels = Array.from({ length: MAX }, () => { const p = new Panel(); this.root.add(p.mesh); return p; });
    this.slot = S.add(this.root, { anchor: 'tl', x: 0, y: 0, z: 0, update: (dt, slot) => this.update(dt, slot) });
    const fonts = [`700 15px ${FONT.title}`, `14px ${FONT.sys}`, "14px 'Jersey 15'"];
    Promise.all(fonts.map((f) => document.fonts?.load?.(f).catch(() => null))).then(() => { for (const T of this.tags.values()) T.dirty = true; });
  }

  /** May this thing wear a tag at all? */
  ok(c) { return !!c && c.alive !== false && c.kind && !c.ally && !c.friend && !c.spirit && c.pos && c.root?.visible !== false; }
  awake(c) { return !(st(c, 'sleep') > 0) && !(st(c, 'melt') > 0) && c.brain?.lod !== 'far' && c.state !== 'sleep'; }

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

  /** Who wears a tag now: the one locked on, and up to two others nearest in view within NEAR while any is awake. */
  choose() {
    const g = this.game, P = g.player?.pos, lockRef = g.lock?.target?.ref, out = [], near = [], tmp = {};
    let awake = false;
    if (this.ok(lockRef)) { out.push(lockRef); if (this.awake(lockRef)) awake = true; }
    if (P) for (const list of [g.creatures?.list, g.clappers?.list]) for (const c of list || []) {
      if (c === lockRef || !this.ok(c)) continue; const d = c.pos.distanceTo(P); if (d > NEAR) continue;
      if (!this.project(this.v.set(c.pos.x, c.pos.y + 0.6, c.pos.z), tmp) || !tmp.inView) continue;
      near.push([d, c]); if (this.awake(c)) awake = true;
    }
    if (!awake) return out; // (the locked one keeps its tag; the others wait for something awake)
    near.sort((a, b) => a[0] - b[0]); for (const [, c] of near) { if (out.length >= MAX) break; out.push(c); }
    return out;
  }

  // ------------------------------------------------------------------------------------------------------------ the sprite, once a kind
  sprite(c) {
    const plate = this.game.veritome?.plateOf?.(c.kind), have = this.sprites.get(c.kind);
    if (plate && have?.from !== 'plate') { // (the Veritome's best plate of the kind, pixelated instead: the hook Dovina is asked for)
      try { const S = 120, cv = canvasOf(S, S), x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(plate, 0, 0, S, S); const grid = sampleGrid(x.getImageData(0, 0, S, S).data, S, false, false); if (grid) { this.sprites.set(c.kind, { grid, from: 'plate' }); return grid; } } catch { /* the mesh's, below */ }
    }
    if (have) return have.grid;
    let grid = null; try { grid = this.sampleMesh(c); } catch (e) { console.warn('creature tag sprite', e); }
    this.sprites.set(c.kind, { grid: grid || ellipseGrid(), from: grid ? 'mesh' : 'none' });
    return this.sprites.get(c.kind).grid;
  }
  /** Its meshes rendered alone, lit from the upper left, from the side the camera sees, at 96 x 96, and read back once. */
  sampleMesh(c) {
    const r = this.game.overlayScene.r, root = c.root, S = 96; if (!root || !r) return null;
    root.updateMatrixWorld(true);
    if (!this.sScene) {
      this.sScene = new THREE.Scene(); this.sSun = new THREE.DirectionalLight(0xffffff, 2.4); this.sScene.add(new THREE.AmbientLight(0xffffff, 0.7), this.sSun, this.sSun.target);
      this.sCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100); this.sRT = new THREE.WebGLRenderTarget(S, S); this.sBuf = new Uint8Array(S * S * 4);
    }
    const box = new THREE.Box3(), bb = new THREE.Box3(), proxies = [];
    root.traverseVisible((o) => {
      if (!o.isMesh || o.isPoints || o.isSprite || /databug|glint|aura|shadow/i.test(o.name || '')) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || (m.transparent && (m.opacity ?? 1) < 0.35) || m.blending === THREE.AdditiveBlending) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const p = new THREE.Mesh(o.geometry, new THREE.MeshLambertMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null }));
      p.matrixAutoUpdate = false; p.matrix.copy(o.matrixWorld); this.sScene.add(p); proxies.push(p); box.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
    });
    if (!proxies.length || box.isEmpty()) return null;
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), half = Math.max(size.x, size.y, size.z) * 0.6 + 0.01;
    const cam = this.sCam, to = this.game.camera ? new THREE.Vector3().subVectors(this.game.camera.position, ctr).setY(0) : new THREE.Vector3(0, 0, 1);
    if (to.lengthSq() < 1e-6) to.set(0, 0, 1); to.normalize();
    cam.left = cam.bottom = -half; cam.right = cam.top = half; cam.position.copy(ctr).addScaledVector(to, half * 4 + 2); cam.lookAt(ctr); cam.near = 0.01; cam.far = half * 8 + 4; cam.updateProjectionMatrix();
    this.sSun.position.copy(cam.position).add(new THREE.Vector3(-to.z, 1.2, to.x).multiplyScalar(half * 3)); this.sSun.target.position.copy(ctr); this.sSun.target.updateMatrixWorld();
    const was = r.getRenderTarget(), auto = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    try {
      r.setRenderTarget(this.sRT); r.setClearColor(0x000000, 0); r.autoClear = true; r.clear(); r.render(this.sScene, cam);
      r.readRenderTargetPixels(this.sRT, 0, 0, S, S, this.sBuf);
    } finally { r.setRenderTarget(was); r.setClearColor(cc, ca); r.autoClear = auto; for (const p of proxies) { this.sScene.remove(p); p.material.dispose(); } }
    return sampleGrid(this.sBuf, S, true, true);
  }

  // ------------------------------------------------------------------------------------------------------------ the lines, polled
  /** Read its tag; note what changed (a decrypt for a line now plain that was not); make its scramble's words. */
  read(T) {
    const c = T.c, tag = readTag(this.game, c); if (!tag) return;
    if (c.head && !c.bones?.eyes) { const h = c.head(); T.eyeDy = 0.68 * Math.max(0.2, h.y - 0.35 - c.pos.y); }
    const sig = tag.level + '|' + JSON.stringify(tag.lines);
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
    if (on) {
      for (const n of on.on || []) T.motes.push([n, 100]);
      for (const [t, k] of Object.entries(on.build || {})) { const n = TYPES[t]?.builds || t; if (!T.motes.some((m) => m[0] === n)) T.motes.push([n, Math.round(k * 100)]); }
    }
  }
  /** A scrambled line's words: its phrase, then roots from the pool until it is about as long as the hidden text (`len`). */
  tokensFor(key, len, seed) {
    const base = (PHR[key] || PHR.statuses).split(' '), R = rng(seed + key.length * 31), want = Math.max(2, Math.min(9, Math.round(len / 2.2)));
    const toks = base.slice(); let n = toks.reduce((a, t) => a + cells(t).length, 0);
    while (n < want) { const t = POOL[Math.floor(R() * POOL.length)]; toks.push(t); n += cells(t).length; }
    while (n > want + 1 && toks.length > 1) n -= cells(toks.pop()).length;
    return toks;
  }

  // ------------------------------------------------------------------------------------------------------------ the frame
  update(dt, slot) {
    const g = this.game, S = g.overlayScene, B = document.body.classList;
    this.t += dt;
    const hide = !!(g.title?.active || g.god?.controlling || g.emocean?.stage?.active || B.contains('cine') || !g.camera);
    if (hide) { this.root.userData.overlayHidden = true; return; }
    const view = slot.view, pr = S.r.getPixelRatio(); this.dot = view.h / 480; this.Wd = view.w / this.dot;
    const k = Math.max(1, Math.round(pr * this.dot)); if (k !== this.k) { this.k = k; for (const T of this.tags.values()) T.dirty = true; }
    if (theme.id !== this.themeId) { this.themeId = theme.id; for (const T of this.tags.values()) T.dirty = true; }
    // who, and their lines (a few times a real second)
    if ((this.pollT -= dt) <= 0) {
      this.pollT = POLL; const want = this.choose();
      for (const c of want) if (!this.tags.has(c)) {
        const panel = this.panels.find((p) => !p.owner); if (!panel) break; panel.owner = c;
        const T = { c, panel, vis: 0, x: 0, y: 0, placed: false, sig: '', tag: null, rs: new Map(), dirty: true, motes: [], h: 60, seed: 7 + (c.id ?? this.tags.size) * 13, eyeDy: 0.6, want: true, aberrant: false };
        T.grid = this.sprite(c); this.tags.set(c, T);
      }
      for (const [c, T] of this.tags) { T.want = want.includes(c) && this.ok(c); if (T.want) this.read(T); }
    }
    // the churn: a scrambled line swaps a word a quarter of a real second (never a strobe: the ghosts move with it)
    const churn = (this.churnT -= dt) <= 0; if (churn) this.churnT = CHURN;
    // place, draw, retire
    this.strokes.begin(this.dot); this.nR = 0;
    this.rect(this.Wd - 182, 0, this.Wd, 178); this.rect(this.Wd - 118, 250, this.Wd, 480); // (the Sight, the Lachrimeter)
    this.shown.length = 0;
    for (const [c, T] of this.tags) {
      T.vis = T.want ? Math.min(1, T.vis + dt / T_IN) : Math.max(0, T.vis - dt / T_OUT);
      if (!T.want && T.vis <= 0) { T.panel.owner = null; T.panel.mesh.visible = false; this.tags.delete(c); continue; }
      if (!T.tag) { T.panel.mesh.visible = false; continue; }
      if (!this.place(T, dt)) { T.panel.mesh.visible = false; continue; }
      let decrypting = false; for (const R of T.rs.values()) if (R.dec >= 0) { if (this.t - R.dec < DECRYPT) decrypting = true; else R.dec = -1; }
      if (churn) for (const R of T.rs.values()) if (R.read === 'scrambled' && R.tokens) { const i = Math.floor(Math.random() * R.tokens.length); R.tokens[i] = POOL[Math.floor(Math.random() * POOL.length)]; T.dirty = true; T.ghost = Math.random() * 1e5; }
      if (T.dirty || decrypting) { T.panel.size(this.k); this.draw(T); T.dirty = decrypting; }
      this.marks(T); this.show(T); this.shown.push(c);
    }
    this.strokes.end();
    this.root.userData.overlayHidden = this.tags.size === 0;
  }

  /** Lay its tag out in dots: the bracket at its eyes, the tag above it, kept off the others and the edges; false when off screen. */
  place(T, dt) {
    const c = T.c, e = (T.pe ||= {}); this.eye(c, T, this.v);
    if (!this.project(this.v, e)) return false;
    const cam = this.game.camera; this.right.setFromMatrixColumn(cam.matrixWorld, 0);
    const r = (T.pr ||= {}); this.project(this.v2.copy(this.v).addScaledVector(this.right, (c.radius || 0.4) * 0.45), r);
    const sp = Math.max(3, Math.min(42, Math.abs(r.x - e.x) || 6)), pad = Math.max(5, Math.min(12, sp * 0.5)), vy = pad * 1.1 + sp * 0.12;
    const bb = (T.b ||= {}); bb.x0 = e.x - sp - pad; bb.x1 = e.x + sp + pad; bb.y0 = e.y - vy; bb.y1 = e.y + vy; bb.ex = e.x; bb.ey = e.y; bb.sp = sp;
    const h = Math.max(SH + 4, T.h), Wd = this.Wd;
    let tx = e.x - 45 - 29, ty = T.b.y0 - RISE - SH - 64;
    const clamp = (x, y) => [Math.max(20, Math.min(Wd - W - 6, x)), Math.max(6, Math.min(480 - h - 6, y))];
    const hit = (x, y) => { for (let i = 0; i < this.nR; i++) { const R = this.rects[i]; if (x - 16 < R.x1 && x + W > R.x0 && y < R.y1 && y + h > R.y0) return R; } return null; };
    [tx, ty] = clamp(tx, ty);
    for (let n = 0; n < 4; n++) {
      const R = hit(tx, ty); if (!R) break;
      const opts = [[R.x0 - W - 4, ty], [R.x1 + 20, ty], [tx, R.y1 + 4], [tx, R.y0 - h - 4]].map(([x, y]) => clamp(x, y)).filter(([x, y]) => !hit(x, y));
      if (!opts.length) break; opts.sort((a, b) => Math.hypot(a[0] - tx, a[1] - ty) - Math.hypot(b[0] - tx, b[1] - ty)); [tx, ty] = opts[0];
    }
    if (!T.placed) { T.x = tx; T.y = ty; T.placed = true; } else { const a = 1 - Math.exp(-14 * dt); T.x += (tx - T.x) * a; T.y += (ty - T.y) * a; }
    this.rect(Math.round(T.x) - 16, Math.round(T.y), Math.round(T.x) + W, Math.round(T.y) + h);
    return true;
  }
  rect(x0, y0, x1, y1) { const R = this.rects[this.nR++]; R.x0 = x0; R.y0 = y0; R.x1 = x1; R.y1 = y1; }

  /** The plane: its canvas over the tag's place, unfolding from a line as it comes (and folding as it goes). */
  show(T) {
    const P = T.panel, d = this.dot, x = Math.round(T.x), y = Math.round(T.y), sy = Math.max(0.02, Math.min(1, (T.vis - 0.35) / 0.65));
    const w = (W + 2 * M) * d, hh = (HMAX + 2 * M) * d;
    P.mesh.visible = T.vis > 0.35; P.mesh.scale.set(w, hh * sy, 1);
    P.mesh.position.set(Math.round((x - M) * d + w / 2), -Math.round((y - M) * d + hh * sy / 2), 0);
  }

  /** The bracket at its eyes, the leader to the lozenge, and its status motes: quads in the shared buffer. */
  marks(T) {
    const S = this.strokes, b = T.b, x = Math.round(T.x), y = Math.round(T.y), P = this.PTS;
    const lead = Math.min(1, T.vis * 2.2);
    // the bracket (the mock's, with both eyes inside it): four corners, ink under the VFD line
    const Lx = Math.max(4, (b.x1 - b.x0) * 0.24), Ly = Math.max(3, (b.y1 - b.y0) * 0.3);
    for (const pass of [0, 1]) {
      S.col = pass ? C_VFD : C_INK; const w = pass ? 1.3 : 3.1;
      for (let q = 0; q < 4; q++) { const sx = q === 0 || q === 3 ? 1 : -1, sy = q < 2 ? 1 : -1, cx = sx > 0 ? b.x0 : b.x1, cy = sy > 0 ? b.y0 : b.y1; S.seg(cx + sx * Lx * lead, cy, cx, cy, w); S.seg(cx, cy, cx, cy + sy * Ly * lead, w); }
    }
    // the leader: from the bracket's corner nearest the lozenge, a diagonal, then straight to the lozenge (dashed, the mock's)
    const ax = x + 29, below = y + SH / 2 > b.ey, fx = ax < b.ex ? b.x0 : b.x1, fy = below ? b.y1 : b.y0;
    const end = below ? y - 3 : y + SH + 3, room = Math.abs(end - fy), rise = Math.min(RISE, Math.max(0, room - 4));
    P[0] = fx; P[1] = fy; P[2] = ax; P[3] = below ? fy + rise : fy - rise; P[4] = ax; P[5] = end;
    S.col = C_INK; S.path(P, 3, 3, true, lead); S.col = C_VFD; S.path(P, 3, 1.2, true, lead);
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
  /** Its rows from Dovina's lines (a row per status when they read plain). */
  rows(T) {
    const out = [];
    for (const L of T.tag.lines) {
      if (L.key === 'statuses' && L.read === 'plain' && T.motes.length) { for (const s of T.motes.slice(0, 3)) out.push({ key: 'statuses', h: 15, line: L, s }); continue; }
      out.push({ key: L.key, h: L.key === 'name' ? 20 : L.key === 'functions' ? 30 : 15, line: L });
    }
    return out;
  }

  /** The plate: the mock's plateC (the lozenge, the sprite, the lens, the bus, the rows), then the tear for an aberrant. */
  draw(T) {
    const P = T.panel, k = P.k, ab = T.aberrant, tgt = ab ? P.tear() : P.cv, g = tgt.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tgt.width, tgt.height); g.setTransform(k, 0, 0, k, M * k, M * k); KK = k;
    const rows = this.rows(T), fam = T.tag.level, h = Math.min(HMAX, Math.max(SH + 4, rows.reduce((a, r) => a + r.h, 0) + 4)); T.h = h;
    const ch = 12, loz = () => { g.beginPath(); g.moveTo(ch, 0); g.lineTo(SW - ch, 0); g.lineTo(SW, SH / 2); g.lineTo(SW - ch, SH); g.lineTo(ch, SH); g.lineTo(0, SH / 2); g.closePath(); };
    // the bezel and the glass
    loz(); g.strokeStyle = '#05030a'; g.lineWidth = 6; g.stroke(); loz(); g.strokeStyle = film(g, 0, 0, SW, SH); g.lineWidth = 1; g.stroke();
    loz(); const gl = g.createRadialGradient(SW / 2, SH / 2, 4, SW / 2, SH / 2, SW * 0.62); gl.addColorStop(0, fam ? '#0b2a1d' : '#1a7a55'); gl.addColorStop(1, '#020a06'); g.fillStyle = gl; g.fill();
    g.save(); loz(); g.clip();
    // the sprite: its own silhouette, sampled; familiarity is how many tones it gets
    const p = 2.3, sx0 = (SW - GW * p) / 2, sy0 = (SH - GH * p) / 2 + 1, spr = T.grid;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const l = spr[j * GW + i]; if (l == null) continue; let ii = i, col;
      if (ab && j >= 5 && j <= 8) ii = i + 2; // (a slid band of rows)
      if (fam === 0) col = '#020a06'; else if (fam === 1) col = TONES[1]; else if (fam === 2) col = l < 0.5 ? TONES[0] : TONES[2]; else col = l < 0.3 ? TONES[0] : l < 0.6 ? TONES[1] : l < 0.85 ? TONES[2] : TONES[3];
      if (ab && (i * 7 + j * 3) % 11 === 0) col = MAG;
      g.fillStyle = col; g.fillRect(sx0 + ii * p, sy0 + j * p, p - 0.35, p - 0.35);
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
    g.strokeStyle = hexA(VFD, 0.5); g.lineWidth = 0.7; g.beginPath(); g.moveTo(SW + 1, SH / 2); g.lineTo(GX - 5, SH / 2); g.moveTo(GX - 5, 4); g.lineTo(GX - 5, h - 4); g.stroke();
    let y = 0; const ww = W - GX;
    for (const r of rows) {
      const R = T.rs.get(r.key), dec = R && R.dec >= 0 ? Math.min(1, (this.t - R.dec) / DECRYPT) : 1;
      if (r.line.read === 'plain') {
        if (dec < 1) { // the decrypt: the plain line wiped in behind a VFD cursor, the scramble it was still to the right of it
          const fx = GX + ww * dec;
          g.save(); g.beginPath(); g.rect(GX - 4, y, fx - GX + 4, r.h); g.clip(); this.row(g, T, r, fam, GX, y, ww); g.restore();
          if (R.tokens) { g.save(); g.beginPath(); g.rect(fx, y, GX + ww - fx + 2, r.h); g.clip(); this.hidden(g, T, r, { ...r, line: { ...r.line, read: 'scrambled' } }, GX, y, ww); g.restore(); }
          g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; g.fillStyle = VFD; g.fillRect(fx, y + 2, 1.4, r.h - 4); g.restore();
        } else this.row(g, T, r, fam, GX, y, ww);
      } else this.hidden(g, T, r, r, GX, y, ww);
      g.fillStyle = hexA(VFD, 0.22); g.fillRect(GX, y + r.h - 0.6, ww, 0.6); y += r.h;
    }
    if (ab) this.compose(P, h);
    P.tex.needsUpdate = true;
  }

  row(g, T, r, fam, x, y, w) {
    if (r.key !== 'functions') { rowPlain(g, r, fam, x, y, w); return; }
    // the neuralese its mind would take (UNDERSTOOD, while stunned): the words you know in the hand at 2x, a dashed cell a blank
    const { words: ws = [], blanks = 0 } = r.line.value || {}; let cx = x;
    if (ws.length) cx += this.hand(g, T.panel, ws.map((s) => s.toUpperCase()), x, y, r.h, w, 'functions', 'left') + 4;
    g.save(); g.setLineDash([1.5, 1.5]); g.strokeStyle = hexA(VFD, 0.6); g.lineWidth = 0.8;
    for (let i = 0; i < blanks && cx + 12 <= x + w; i++, cx += 14) g.strokeRect(cx + 0.5, y + 6.5, 11, r.h - 12);
    g.restore();
  }
  /** A scrambled or latent row: its label (the tag keeps its shape at every level), then the hand, right-aligned at the hidden length. */
  hidden(g, T, r, rr, x, y, w) {
    if (r.key === 'name') { T_(g, '???', x, y + r.h - 5); return; }
    const lw = LABEL[r.key] ? label(g, LABEL[r.key], x, y + r.h - 4) : 0, R = T.rs.get(r.key);
    if (!R?.tokens) return;
    this.hand(g, T.panel, R.tokens, x + lw + 6, y, r.h, w - lw - 6, rr.line.read === 'latent' ? 'latent' : 'scrambled', 'right', T.ghost || T.seed);
  }

  /** Neuralese in the running hand (ui/runninghand.js: final, drawn as it is; the fallback only while it draws nothing), tinted:
   *  scrambled is the schiller with three cells caught mid-change; latent the window colour, still, with a plate's corner marks. */
  hand(g, P, tokens, x, y, rowH, maxW, mode, align, seed = 7) {
    const k = P.k, H = P.hand, hx = H.getContext('2d'), big = mode === 'functions', glyphH = big ? rowH - 6 : rowH - 4;
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, H.width, H.height); hx.setTransform(k, 0, 0, k, 0, 0);
    const ws = tokens.map((t) => ({ cells: cells(t) }));
    if (!this.handScale) { // (the hand's own size, measured once: a glyph row scaled to a reading line's height)
      let m = null; try { m = runningHand(hx, [{ cells: cells('SOMA') }], { x: 2, y: 2, scale: 1, ink: '#fff', joined: true }); } catch { m = null; }
      this.fallback = !(m?.width > 0 && m?.height > 0); this.handBase = this.fallback ? 11 : m.height; this.handScale = 1;
      hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, H.width, H.height); hx.setTransform(k, 0, 0, k, 0, 0);
    }
    const s = glyphH / this.handBase, o = { x: 4, y: 24, scale: s, ink: '#fff', joined: true }; // (the hand's y is its bus; it says its bounds)
    let res = null; hx.save();
    if (!this.fallback) { try { res = runningHand(hx, ws, o); } catch { res = null; } if (!(res?.width > 0)) { this.fallback = true; hx.restore(); hx.save(); hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, H.width, H.height); hx.setTransform(k, 0, 0, k, 0, 0); } }
    if (this.fallback) res = fallbackHand(hx, ws, o);
    hx.restore();
    const bx = Math.max(0, (res.x0 ?? o.x) - 2), by = Math.max(0, (res.y0 ?? o.y) - 2);
    const wd = Math.min(res.width, maxW, 290), hd = Math.min(res.height, 36), x0 = align === 'right' ? x + maxW - wd : x, y0 = y + (rowH - hd) / 2;
    const tA = P.tA, ta = tA.getContext('2d'), sw = Math.ceil((wd + 4) * k), sh = Math.ceil((hd + 4) * k);
    const tint = (fill) => { ta.setTransform(1, 0, 0, 1, 0, 0); ta.globalCompositeOperation = 'copy'; ta.drawImage(H, 0, 0); ta.globalCompositeOperation = 'source-in'; ta.setTransform(k, 0, 0, k, 0, 0); ta.fillStyle = fill; ta.fillRect(0, 0, 300, 40); ta.globalCompositeOperation = 'source-over'; };
    const put = (dx = 0, dy = 0) => g.drawImage(tA, Math.round(bx * k), Math.round(by * k), sw, sh, x0 - 2 + dx, y0 - 2 + dy, wd + 4, hd + 4);
    tint('rgba(13,10,18,.85)'); for (const [dx, dy] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) put(dx, dy);
    if (mode === 'latent') { // (still, in the window colour, a plate's corner marks at its ends: Dovina's latent read)
      const col = windowColour(); tint(col); g.save(); g.shadowColor = hexA(col, 0.9); g.shadowBlur = 3 * k; put(); g.restore();
      const a = x0 - 2.5, b = x0 + wd + 2.5, c0 = y + 1, c1 = y + rowH - 1; g.fillStyle = col;
      for (const [cx, cy, sx, sy] of [[a, c0, 1, 1], [b, c0, -1, 1], [b, c1, -1, -1], [a, c1, 1, -1]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 4, cy); g.lineTo(cx, cy + sy * 4); g.closePath(); g.fill(); }
      return wd;
    }
    if (mode === 'functions') { tint(VFD); g.save(); g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; put(); g.restore(); return wd; }
    tint(schill(ta, 0, wd * 1.3)); put();
    // the churn, caught: three cells mid-change, ghosted magenta and cyan; a VFD cursor where it would resolve from
    const R = rng(Math.floor(seed) * 7 + 3); g.save(); g.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 3; q++) {
      const cx = x0 + R() * Math.max(1, wd - 8), cw = 5 + R() * 6; g.save(); g.beginPath(); g.rect(cx, y, cw, rowH); g.clip();
      tint('rgba(255,42,154,.6)'); put(0, -1.4); tint('rgba(34,230,255,.5)'); put(0.7, 1.3); g.restore();
    }
    g.restore(); g.save(); g.fillStyle = VFD; g.shadowColor = VFD_GLOW; g.shadowBlur = 3 * k; g.fillRect(x0 - 2.8, y + 3, 1.2, rowH - 6); g.restore();
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
    const by0 = Math.round((M + h * 0.3) * K), bh = Math.round(h * 0.2 * K), bx0 = Math.round((M + W * 0.36) * K), bw = Wc - bx0, sh = Math.round(7 * K), sp = Math.round(2.8 * K);
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
function T_(g, s, x, y) { T(g, s, x, y, `700 15px ${FONT.title}`, PAL.word); }
