// ---------------------------------------------------------------------------------------
// THE HIGHWAY'S LOOK (Calissa's; the rhythm mode's highway, music/rhythm/highway.js, is Wanda's and keeps the state: the chart, the lit
// lanes and their grades, the combo, the ratings): the board drawn in Anagami's Clay dress (OVERLAY.md 15.4), never a stock bar chart.
//   THE BOARD    on the desk, a clay frame (earthenware with the grog in it, a pool of the window colour's glaze round its lip, a dark
//                keyline) round a well of deep glaze; ten lanes as channels in two hands of five, each lined in its note's colour (the
//                Crucibelle's DEGREE_COLOR), a clay spine with gold studs between the hands. On touch the board is the screen: each lane
//                stood over its pad's rect (core/touchlanes.js `rect(lane)`, five columns a half, the whole height), the pads along the
//                foot. Drawn once a size and kept (one canvas), so a frame only lays the moving things over it.
//   THE NOTES    glazed beads in their degree's colour (a pool deep at the foot, a sheen top left, a keyline), the upper hand's with a
//                pearl of white in them (the highway's white core); a long note trails a thin run of its glaze. A missed one goes dull.
//   THE RAIL     the judgement line as a gold rail (a rod lit from above), a glazed socket in each lane's colour sitting on it that
//                presses in while its key or pad is held. A press lights its lane from the rail up: the labradorite's film for a
//                perfect (vfx/oxidation.js filmColour), its colour for a great, faint for a good; a miss darkens it; a ring breaks out
//                of the socket on a perfect or a great.
//   THE COMBO    no numbers (the highway's rule): the board's inner rim and the rail warm gold as the combo runs, full at 50, and past
//                it the film walks round the rim. The song so far is a gold thread along the top with a bead at its head.
//   THE PADS     on touch only: under each column a glazed clay tile in its lane's colour (ui/touch/tile.js's idiom: foot, face, grog,
//                glaze pool, sheen, keyline), its key's number small in the corner; held, it sits down into its foot and darkens; a
//                judged press flashes it and stands the grade on it a beat as pips (three of the film a perfect, two gold a great, one
//                cream a good, a crack of ember a miss). The ratings (ui/rating.js, the maker's words) are stood over the rail.
//
// Prior art: Guitar Hero's fretboard (the gems as glossy beads, the board's edges lit by star power), Beatmania IIDX's two hands and its
// lane flashes, Project Sekai's and Cytus's phone lanes over the whole screen judged at pads along the foot, DJMax's lane beams; the
// glaze pool and sheen are the touch tile's (ui/touch/tile.js), the film the labradorite's (vfx/oxidation.js).
//
//   const L = new HighwayLook(highway, game)   L.show()   L.draw(t, { combo, progress, dt })   L.hide()   L.layout()   HIGHWAY_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DEGREE_COLOR } from '../tools/crucibelle/songs.js';
import { LANE_KEYS } from '../core/touchlanes.js';
import { filmColour } from './oxidation.js';
import { FONT } from '../ui/theme.js';

/** The numbers (CSS px; seconds): the desk board's lane, the gap between the hands, the frame, the well's height, the rail above the
 *  well's foot; seconds of notes over the rail; the touch pads' height (a share of the screen, capped), their inset; the combo at full
 *  glow; how long a grade stands on a pad. */
export const HIGHWAY_LOOK = { lane: 40, gap: 28, frame: 16, well: 380, rail: 46, ahead: 1.6, pad: 0.24, padMax: 120, padMin: 72, inset: 5, foot: 5, full: 50, grade: 0.6, gold: '#ffd36a' };

const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const rgba = (c, a = 1, m = 1) => { const [r, g, b] = rgb(c); return `rgba(${Math.round(r * m)},${Math.round(g * m)},${Math.round(b * m)},${a})`; };
const rr = (g, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const seeded = (n) => () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);
const windowGlaze = () => {
  const s = getComputedStyle(document.documentElement), v = (k, d) => (s.getPropertyValue(k).trim() || d);
  return { top: v('--jtop', '104,50,32'), bot: v('--jbot', '34,15,9') };
};
const onTouch = () => document.body.classList.contains('hud-touch');
const canvasOf = (w, h, dpr) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr)); const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; };
const _f = new THREE.Color();
const filmCss = (t, a = 1) => { filmColour(t, _f); return `rgba(${Math.round(Math.min(1, _f.r * 1.3) * 255)},${Math.round(Math.min(1, _f.g * 1.3) * 255)},${Math.round(Math.min(1, _f.b * 1.3) * 255)},${a})`; };

/** Grog speckled over a clipped face (the earthenware's), the same on every draw of a size. */
function grog(g, x, y, w, h, n) {
  const rnd = seeded(Math.round(w * 7 + h * 3));
  for (let i = 0; i < n; i++) { const light = rnd() < 0.45; g.fillStyle = light ? 'rgba(255,236,214,.2)' : 'rgba(40,18,8,.36)'; g.fillRect(x + rnd() * w, y + rnd() * h, light ? 0.8 : 1.1, light ? 0.8 : 1.1); }
}

/** A glazed clay tile in one colour (a pad, a socket): its foot, its clay face, the glaze's pool, the sheen, the keyline. Kept. */
const TILES = new Map();
function glazedTile(w, h, dpr, colour, pressed, foot) {
  const key = `${w}x${h}|${dpr}|${colour}|${pressed}|${foot}`; if (TILES.has(key)) return TILES.get(key);
  const [c, g] = canvasOf(w, h + foot, dpr), s = Math.min(w, h), r = s * 0.2, inset = Math.max(3, s * 0.1), y0 = pressed ? foot : 0;
  rr(g, 1, foot + 0.5, w - 2, h - 2, r); g.fillStyle = '#2a120b'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  rr(g, 1, y0 + 1, w - 2, h - 2, r);
  const clay = g.createLinearGradient(0, y0, s * 0.4, y0 + h); clay.addColorStop(0, '#9a5638'); clay.addColorStop(1, '#5a2b1d');
  g.fillStyle = clay; g.fill(); g.save(); g.clip(); grog(g, 0, y0, w, h, Math.sqrt(w * h) * 1.4); g.restore();
  rr(g, inset, y0 + inset, w - 2 * inset, h - 2 * inset, r * 0.7);
  const pool = g.createRadialGradient(w * 0.42, y0 + h * 0.36, s * 0.05, w * 0.5, y0 + h * 0.5, Math.max(w, h) * 0.62);
  pool.addColorStop(0, rgba(colour, 0.98, pressed ? 0.7 : 0.95)); pool.addColorStop(0.75, rgba(colour, 0.98, pressed ? 0.32 : 0.45)); pool.addColorStop(1, rgba(colour, 1, 0.3));
  g.fillStyle = pool; g.fill(); g.lineWidth = Math.max(1.2, s * 0.03); g.strokeStyle = 'rgba(255,226,196,.3)'; g.stroke();
  g.save(); rr(g, inset, y0 + inset, w - 2 * inset, h - 2 * inset, r * 0.7); g.clip();
  const sh = g.createRadialGradient(w * 0.3, y0 + h * 0.26, 0, w * 0.3, y0 + h * 0.26, s * 0.42);
  sh.addColorStop(0, `rgba(255,248,236,${pressed ? 0.12 : 0.3})`); sh.addColorStop(1, 'rgba(255,248,236,0)');
  g.fillStyle = sh; g.fillRect(0, y0, w, h); g.restore();
  rr(g, 1, y0 + 1, w - 2, h - 2, r); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  if (TILES.size > 160) TILES.clear();
  TILES.set(key, c);
  return c;
}

/** A note's bead: a capsule of glaze in its colour, deep at the foot, a sheen and a glint top left, a dark keyline; the upper hand's
 *  with a pearl of white in it. Kept. */
const BEADS = new Map();
function bead(w, h, dpr, colour, upper, dull) {
  const key = `${w}x${h}|${dpr}|${colour}|${upper}|${dull}`; if (BEADS.has(key)) return BEADS.get(key);
  const p = 3, [c, g] = canvasOf(w + 2 * p, h + 2 * p, dpr), r = h / 2;
  g.translate(p, p);
  rr(g, 0.5, 1.5, w - 1, h - 1, r); g.fillStyle = 'rgba(8,4,12,.55)'; g.fill();
  rr(g, 0.5, 0.5, w - 1, h - 1, r);
  const m = dull ? 0.42 : 1, body = g.createLinearGradient(0, 0, 0, h);
  body.addColorStop(0, rgba(colour, 1, Math.min(1.25, 1.18 * m))); body.addColorStop(0.55, rgba(colour, 1, 0.9 * m)); body.addColorStop(1, rgba(colour, 1, 0.42 * m));
  g.fillStyle = body; g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(20,10,16,.9)'; g.stroke();
  if (upper) { const pw = Math.max(6, w * 0.26), ph = Math.max(4, h * 0.4); rr(g, w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, ph / 2); g.fillStyle = dull ? 'rgba(210,210,220,.4)' : 'rgba(255,255,255,.92)'; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(20,10,16,.5)'; g.stroke(); }
  if (!dull) {
    g.save(); rr(g, 2, 1.5, w - 4, h * 0.45, h * 0.22); g.clip();
    const sh = g.createLinearGradient(0, 0, 0, h * 0.5); sh.addColorStop(0, 'rgba(255,252,244,.55)'); sh.addColorStop(1, 'rgba(255,252,244,0)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h); g.restore();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(r * 0.9, h * 0.3, Math.max(1.2, r * 0.28), Math.max(0.8, r * 0.16), -0.3, 0, Math.PI * 2); g.fill();
  }
  if (BEADS.size > 120) BEADS.clear();
  BEADS.set(key, c);
  return c;
}

export class HighwayLook {
  constructor(highway, game = null) {
    this.hw = highway; this.game = game; this.canvas = null; this.g = null; this.board = null; this.size = '';
    this.grade = new Array(10).fill(null); this.gradeT = new Float32Array(10).fill(9); this.ring = new Float32Array(10).fill(1);
    this.clock = 0; this.onResize = () => { this.size = ''; };
  }
  show() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      Object.assign(this.canvas.style, { position: 'fixed', pointerEvents: 'none', zIndex: 5 });
      this.g = this.canvas.getContext('2d');
    }
    document.body.appendChild(this.canvas); addEventListener('resize', this.onResize); this.size = ''; this.layout();
  }
  hide() { this.canvas?.remove(); removeEventListener('resize', this.onResize); }

  /** Where everything stands for this screen (the desk's board, or touch's whole screen over the pads), and the board drawn once. */
  layout() {
    const touch = onTouch(), dpr = Math.min(2, devicePixelRatio || 1), key = `${touch}|${innerWidth}x${innerHeight}|${dpr}`;
    if (key === this.size) return;
    this.size = key; this.touch = touch; this.dpr = dpr;
    const K = HIGHWAY_LOOK, c = this.canvas, lanes = [];
    if (touch) {
      const W = innerWidth, H = innerHeight, rect = (l) => this.game?.touch?.lanes?.rect?.(l) || { x: (l >= 5 ? W / 2 : 0) + (l % 5) * (W / 10), y: 0, w: W / 10, h: H };
      for (let l = 0; l < 10; l++) { const q = rect(l); lanes.push({ x: q.x, w: q.w }); }
      const pad = Math.round(Math.max(K.padMin, Math.min(K.padMax, H * K.pad)));
      this.L = { W, H, top: 0, line: H - pad - 16, foot: H, pad, lanes, bw: Math.min(72, lanes[0].w * 0.64), bh: 22 };
      Object.assign(c.style, { left: '0px', top: '0px', bottom: '', transform: '', width: `${W}px`, height: `${H}px` });
      Object.assign(this.hw.ratings.el.style, { bottom: `${pad + 40}px` });
    } else {
      const F = K.frame, W = K.lane * 10 + K.gap + 2 * F, H = K.well + 2 * F;
      for (let l = 0; l < 10; l++) lanes.push({ x: F + l * K.lane + (l >= 5 ? K.gap : 0), w: K.lane });
      this.L = { W, H, top: F, line: F + K.well - K.rail, foot: F + K.well, pad: 0, lanes, bw: K.lane - 8, bh: 16 };
      Object.assign(c.style, { left: '50%', top: '', bottom: '8%', transform: 'translateX(-50%)', width: `${W}px`, height: `${H}px` });
      Object.assign(this.hw.ratings.el.style, { bottom: `calc(8% + ${F + K.rail + 30}px)` });
    }
    c.width = Math.round(this.L.W * dpr); c.height = Math.round(this.L.H * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.board = this.drawBoard();
  }

  /** The still board: the frame (desk) or the columns (touch), the lanes' channels, the spine between the hands. */
  drawBoard() {
    const { W, H, top, foot, lanes } = this.L, K = HIGHWAY_LOOK, [c, g] = canvasOf(W, H, this.dpr);
    if (!this.touch) {
      const F = K.frame, G = windowGlaze();
      rr(g, 1, 2, W - 2, H - 2, 18); g.fillStyle = '#2a120b'; g.fill();
      rr(g, 1, 0.5, W - 2, H - 3, 18);
      const clay = g.createLinearGradient(0, 0, W * 0.3, H); clay.addColorStop(0, '#9a5638'); clay.addColorStop(1, '#5a2b1d');
      g.fillStyle = clay; g.fill(); g.save(); g.clip(); grog(g, 0, 0, W, H, (W + H) * 3); g.restore();
      rr(g, 5, 4.5, W - 10, H - 11, 14);
      const pool = g.createLinearGradient(0, 0, 0, H); pool.addColorStop(0, `rgba(${G.top},.95)`); pool.addColorStop(1, `rgba(${G.bot},.98)`);
      g.lineWidth = 7; g.strokeStyle = pool; g.stroke(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,226,196,.3)'; g.stroke();
      rr(g, 1, 0.5, W - 2, H - 3, 18); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
      rr(g, F - 2, F - 2, W - 2 * F + 4, K.well + 4, 8); g.fillStyle = '#1c0d08'; g.fill();
      rr(g, F, F, W - 2 * F, K.well, 6);
      const well = g.createLinearGradient(0, F, 0, F + K.well); well.addColorStop(0, 'rgba(14,8,22,.9)'); well.addColorStop(1, 'rgba(24,12,30,.96)');
      g.fillStyle = well; g.fill();
    } else {
      const fade = g.createLinearGradient(0, 0, 0, H); fade.addColorStop(0, 'rgba(14,8,22,.18)'); fade.addColorStop(0.6, 'rgba(14,8,22,.5)'); fade.addColorStop(1, 'rgba(14,8,22,.72)');
      g.fillStyle = fade; g.fillRect(0, 0, W, H);
    }
    for (let l = 0; l < 10; l++) {
      const { x, w } = lanes[l], col = DEGREE_COLOR[l % 5], y1 = this.touch ? this.L.line : foot;
      const ch = g.createLinearGradient(0, top, 0, y1); ch.addColorStop(0, rgba(col, 0.02)); ch.addColorStop(1, rgba(col, this.touch ? 0.16 : 0.12));
      g.fillStyle = ch; g.fillRect(x + 2, top, w - 4, y1 - top);
      g.fillStyle = rgba(col, 0.28); g.fillRect(x + 2, top, 1, y1 - top); g.fillRect(x + w - 3, top, 1, y1 - top);
      if (l >= 5) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + w / 2 - 1, top, 2, y1 - top); }
    }
    const sx = this.touch ? W / 2 - 3 : lanes[4].x + lanes[4].w, sw = this.touch ? 6 : K.gap, y1 = this.touch ? H : foot;
    const spine = g.createLinearGradient(sx, 0, sx + sw, 0); spine.addColorStop(0, '#5a2b1d'); spine.addColorStop(0.45, '#9a5638'); spine.addColorStop(1, '#4a2216');
    g.fillStyle = spine; g.fillRect(sx, top, sw, y1 - top); g.fillStyle = '#1c0d08'; g.fillRect(sx, top, 1, y1 - top); g.fillRect(sx + sw - 1, top, 1, y1 - top);
    if (!this.touch) for (let y = top + 30; y < foot - 20; y += 64) { g.fillStyle = '#3a1a0e'; g.beginPath(); g.arc(sx + sw / 2, y + 1, 3.6, 0, Math.PI * 2); g.fill(); g.fillStyle = HIGHWAY_LOOK.gold; g.beginPath(); g.arc(sx + sw / 2, y, 3, 0, Math.PI * 2); g.fill(); }
    return c;
  }

  /** A judged press seen (the highway lit its lane): its grade kept for the pad's pips, the socket's ring started. */
  seen(l, grade) { this.grade[l] = grade; this.gradeT[l] = 0; this.ring[l] = grade === 'perfect' || grade === 'great' ? 0 : 1; }

  held(l) {
    if (this.touch) return (this.game?.touch?.lanes?.held?.[l] || 0) > 0;
    return !!this.game?.input?.isDown?.(LANE_KEYS[l]);
  }

  draw(t, { combo = 0, progress = 0, dt = 1 / 60 } = {}) {
    const g = this.g, hw = this.hw; if (!g) return;
    this.layout();
    const K = HIGHWAY_LOOK, { W, H, top, line, lanes, bw, bh } = this.L, px = (line - top) / K.ahead, glow = Math.min(1, combo / K.full);
    this.clock += dt;
    g.clearRect(0, 0, W, H); g.drawImage(this.board, 0, 0, W, H);
    // the lanes lit from the rail up (a perfect in the film, a great its colour, a good faint, a miss dark)
    for (let l = 0; l < 10; l++) {
      const k = hw.lit[l], gr = hw.litGrade[l], { x, w } = lanes[l], col = DEGREE_COLOR[l % 5];
      this.gradeT[l] += dt; this.ring[l] = Math.min(1, this.ring[l] + dt * 3);
      if (k <= 0) continue;
      if (gr === 'miss') { g.fillStyle = `rgba(70,6,16,${0.55 * k})`; g.fillRect(x + 2, top, w - 4, line - top); }
      else {
        const beam = g.createLinearGradient(0, line, 0, top), a = (gr === 'good' ? 0.3 : 0.62) * k;
        const c0 = gr === 'perfect' ? filmCss(this.clock * 0.4 + l * 0.1, a) : rgba(col, a);
        beam.addColorStop(0, c0); beam.addColorStop(1, gr === 'perfect' ? filmCss(this.clock * 0.4 + l * 0.1 + 0.25, 0) : rgba(col, 0));
        g.fillStyle = beam; g.fillRect(x + 2, top, w - 4, line - top);
      }
      hw.lit[l] = Math.max(0, k - dt * 5);
    }
    // the notes: glazed beads falling to the rail
    const dpr = this.dpr;
    for (const n of hw.chart?.notes || []) {
      const dy = (n.t - t) * px; if (dy > line - top + 14) break;
      if (n.grade && n.grade !== 'miss') continue;
      const y = line - dy; if (y < top - 14 || y > H + 14) continue;
      const { x, w } = lanes[n.lane], col = DEGREE_COLOR[n.lane % 5], miss = n.grade === 'miss', cx = x + w / 2;
      const len = Math.min(n.d, 1.2) * px * 0.6;
      if (len > bh) { g.fillStyle = rgba(col, miss ? 0.14 : 0.32); rr(g, cx - 3, Math.max(top, y - len), 6, Math.min(len, y - top), 3); g.fill(); }
      const b = bead(bw, bh, dpr, col, n.lane >= 5, miss);
      g.drawImage(b, cx - bw / 2 - 3, y - bh / 2 - 3, bw + 6, bh + 6);
    }
    this.drawRail(g, glow);
    this.drawRim(g, glow, progress);
    if (this.touch) this.drawPads(g);
  }

  /** The gold rail, warming with the combo, and a glazed socket a lane on it (pressed in while held, a ring out of it on a hit). */
  drawRail(g, glow) {
    const { W, line, lanes } = this.L, K = HIGHWAY_LOOK, x0 = this.touch ? 0 : K.frame, x1 = this.touch ? W : W - K.frame;
    if (glow > 0.05) { const halo = g.createLinearGradient(0, line - 18, 0, line + 18); halo.addColorStop(0, 'rgba(255,211,106,0)'); halo.addColorStop(0.5, `rgba(255,211,106,${0.32 * glow})`); halo.addColorStop(1, 'rgba(255,211,106,0)'); g.fillStyle = halo; g.fillRect(x0, line - 18, x1 - x0, 36); }
    const rod = g.createLinearGradient(0, line - 3, 0, line + 4);
    rod.addColorStop(0, '#fff3c4'); rod.addColorStop(0.35, K.gold); rod.addColorStop(0.75, '#b8862e'); rod.addColorStop(1, '#5a3a10');
    g.fillStyle = '#1c0d08'; g.fillRect(x0, line - 4, x1 - x0, 9); g.fillStyle = rod; g.fillRect(x0, line - 3, x1 - x0, 7);
    g.fillStyle = `rgba(255,252,236,${0.35 + 0.55 * glow})`; g.fillRect(x0, line - 2, x1 - x0, 1);
    for (let l = 0; l < 10; l++) {
      const { x, w } = lanes[l], col = DEGREE_COLOR[l % 5], sw = Math.min(w - 6, this.touch ? 56 : 34), sh = this.touch ? 14 : 12, down = this.held(l);
      const tile = glazedTile(sw, sh, this.dpr, col, down, 3);
      g.drawImage(tile, x + w / 2 - sw / 2, line - sh / 2 - 1, sw, sh + 3);
      const r = this.ring[l];
      if (r < 1) { const gr = this.grade[l]; g.lineWidth = 2.5 * (1 - r) + 0.5; g.strokeStyle = gr === 'perfect' ? filmCss(this.clock * 0.4 + l * 0.1, 1 - r) : `rgba(255,211,106,${1 - r})`; g.beginPath(); g.ellipse(x + w / 2, line, sw / 2 + r * w * 0.45, sh / 2 + r * 18, 0, 0, Math.PI * 2); g.stroke(); }
    }
  }

  /** The combo's glow along the board (the frame's inner rim on the desk, the screen's sides and the spine on touch), the film walking
   *  round it past full; the song so far as a gold thread along the top. */
  drawRim(g, glow, progress) {
    const { W, H, top, foot } = this.L, K = HIGHWAY_LOOK, a = 0.12 + 0.78 * glow, full = glow >= 1;
    const ink = full ? filmCss(this.clock * 0.15, a) : `rgba(255,211,106,${a})`;
    g.save(); g.shadowColor = full ? filmCss(this.clock * 0.15 + 0.3, 0.9) : 'rgba(255,200,90,.9)'; g.shadowBlur = 4 + 14 * glow; g.lineWidth = 1.5 + 1.5 * glow; g.strokeStyle = ink;
    if (!this.touch) { rr(g, K.frame + 0.5, K.frame + 0.5, W - 2 * K.frame - 1, K.well - 1, 6); g.stroke(); }
    else if (glow > 0.02) { g.beginPath(); g.moveTo(1.5, 0); g.lineTo(1.5, H); g.moveTo(W - 1.5, 0); g.lineTo(W - 1.5, H); g.moveTo(W / 2 - 3, 0); g.lineTo(W / 2 - 3, foot); g.moveTo(W / 2 + 3, 0); g.lineTo(W / 2 + 3, foot); g.stroke(); }
    g.restore();
    const x0 = this.touch ? 0 : K.frame + 6, x1 = this.touch ? W : W - K.frame - 6, y = this.touch ? 2 : top - 7, p = Math.min(1, Math.max(0, progress)), xe = x0 + (x1 - x0) * p;
    g.fillStyle = 'rgba(28,13,8,.75)'; g.fillRect(x0, y - 1, x1 - x0, 3);
    g.fillStyle = K.gold; g.fillRect(x0, y - 0.5, xe - x0, 2);
    if (p > 0) { g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(xe, y + 0.5, 2.6, 0, Math.PI * 2); g.fill(); g.lineWidth = 1; g.strokeStyle = '#1c0d08'; g.stroke(); }
  }

  /** Touch's pads: a glazed tile under each column, pressed in while held, flashed and wearing its grade a beat after a judged press. */
  drawPads(g) {
    const { H, pad, lanes } = this.L, K = HIGHWAY_LOOK, f = K.foot, y = H - pad + K.inset;
    for (let l = 0; l < 10; l++) {
      const { x, w } = lanes[l], col = DEGREE_COLOR[l % 5], pw = Math.round(w - 2 * K.inset), ph = Math.round(pad - 2 * K.inset - f), down = this.held(l), y0 = y + (down ? f : 0);
      g.drawImage(glazedTile(pw, ph, this.dpr, col, down, f), x + K.inset, y, pw, ph + f);
      if (l >= 5) { g.fillStyle = down ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(x + w / 2, y0 + ph / 2, Math.min(9, pw * 0.1), Math.min(6, ph * 0.07), 0, 0, Math.PI * 2); g.fill(); }
      g.font = `14px ${FONT.sys}`; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = 'rgba(28,13,8,.8)'; g.fillText(`${(l + 1) % 10}`, x + K.inset + 9, y0 + 8);
      g.fillStyle = 'rgba(239,230,210,.75)'; g.fillText(`${(l + 1) % 10}`, x + K.inset + 8, y0 + 7);
      const gt = this.gradeT[l], gr = this.grade[l];
      if (gt >= K.grade || !gr) continue;
      const k = 1 - gt / K.grade, flash = gt < 0.12 ? 1 - gt / 0.12 : 0, cx = x + w / 2, cy = y0 + ph / 2;
      if (flash > 0) { rr(g, x + K.inset + 1, y0 + 1, pw - 2, ph - 2, Math.min(pw, ph) * 0.2); g.fillStyle = gr === 'miss' ? `rgba(60,6,14,${0.6 * flash})` : gr === 'perfect' ? filmCss(this.clock * 0.4 + l * 0.1, 0.75 * flash) : `rgba(255,248,230,${(gr === 'good' ? 0.3 : 0.55) * flash})`; g.fill(); }
      if (gr === 'miss') { g.lineWidth = 2.5; g.strokeStyle = `rgba(255,122,42,${k})`; g.beginPath(); g.moveTo(cx - pw * 0.22, cy - ph * 0.25); g.lineTo(cx - pw * 0.04, cy - ph * 0.02); g.lineTo(cx + pw * 0.06, cy - ph * 0.12); g.lineTo(cx + pw * 0.2, cy + ph * 0.24); g.stroke(); continue; }
      const n = gr === 'perfect' ? 3 : gr === 'great' ? 2 : 1, step = 15, py = y0 + ph - 14;
      for (let i = 0; i < n; i++) {
        const px = cx + (i - (n - 1) / 2) * step;
        g.fillStyle = '#1c0d08'; g.beginPath(); g.arc(px, py + 1, 5.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = gr === 'perfect' ? filmCss(this.clock * 0.4 + i * 0.25, k) : gr === 'great' ? `rgba(255,211,106,${k})` : `rgba(239,230,210,${k})`;
        g.beginPath(); g.arc(px, py, 4.5, 0, Math.PI * 2); g.fill();
      }
    }
  }
}
