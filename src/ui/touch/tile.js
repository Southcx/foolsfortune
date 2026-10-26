// ---------------------------------------------------------------------------------------
// A TOUCH TILE: one control of touch play (docs/plans/MOBILE.md 4, 6.3, 10 "Calissa's answers" 3) as a glazed clay tile in Anagami's
// dress (OVERLAY.md 15.4: Clay), never a stock button. Two canvases a tile, no per-frame DOM:
//   THE BODY   drawn once a state and kept (a cache by size, glyph, palette, word, pressed and window colour): the tile's foot (its
//              thickness, darker clay), its face of unglazed earthenware with the grog speckled in, a pool of the window colour's glaze
//              (ui/theme.js THEMES: --jtop, --jbot) breaking pale over the clay's lip, a sheen, a keyline; the action's glyph in the UI
//              icons' hand (ui/icons/, `uiIcon('touch.<id>')`, at a whole number of device pixels: the pixel kit's rule), cream on the
//              glaze ('clay'), gold when lit ('gold'); a word under it only where the glyph needs one, 14 px least, in the System's type
//              (FONT.sys). Pressed, the face sits down into its foot and the glaze darkens.
//   THE RIM    the state, in the labradorite's play (vfx/oxidation.js schillerInk: a dark ink with the film's bands walking through it):
//              `charge` 0..1 fills the rim from the top clockwise (HOP's springs loading), `lit` or pressed fills it whole; `ember` 0..1
//              warms the rim and the glaze toward the scorch's ember (FLARE), beating near the top; `pips` 0..3 stand the banked suns
//              along the top edge, the last one a pie of its share (BOOST); `dim` washes it dark (a luffed sail). Redrawn only while
//              something on it moves, at most once a frame.
//   THE HIT    the tile's own element, `touch-action: none`: pointerdown captures that pointer (multi-touch: each tile its own finger),
//              up, cancel and a lost capture let it go; a tile hidden while held lets go first, so no key is left down.
//
// Prior art: glazed tiles and their glaze breaking over an edge (Iznik and Delft tiles, a celadon's pale rim where the glaze thins),
// the mobile racers' and Genshin Impact's on-screen buttons (a large main verb, a ring that fills as a charge builds: Genshin's
// elemental burst ring), the pixel kit's palette swap for a state (ui/pixel.js) and the slip arc's schiller (vfx/skiffsliparc.js).
//
//   new TouchTile(id, { size, word, glyph, corner, onPress(id, down, inside) })   .place(x, y, size, w?)   .set({ charge, ember, pips,
//   lit, dim, hidden })   .label(word, corner) (a named tile, glyph null: its thing's label large, a small word in its corner: USE)
//   .face({ glyph, word, corner, tint }) (a face changed in place)   option fit (a glyph's tile as wide as its word)   option tint (one
//   glaze colour: a note pad's)   .widthFor(size)   .update(now)   .release()   .el   TILE (the numbers)   tileWord(id) (the words under glyphs: MOBILE.md 8.3, Espada's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { uiIcon } from '../icons/icons.js';
import { schillerInk, SCHILLER } from '../../vfx/oxidation.js';
import { FONT } from '../theme.js';

/** The numbers (CSS px): the cluster's main tile, the others (80 and 60 since the owner's ask for room, 2026-10-26: 96 and 72 before), the least, the least type; the rim's width, the foot's depth; the ember
 *  and gold; the rim's samples; the share of a tile the glyph may fill. */
export const TILE = { main: 80, size: 60, small: 44, min: 44, word: 14, big: 18, rim: 4, foot: 3, ember: '#ff7a2a', gold: '#ffd36a', ink: '#17111f', samples: 72, glyph: 0.55 };

/** The words under the glyphs that need one (Espada's words, MOBILE.md 8.3; which glyphs need one is Calissa's call, Espada's to
 *  overrule: the glyph says HOP, FLARE, BOOST, JUMP, WALK, UNDO and the arts alone). */
const WORDS = { alt: 'ALT', sign: 'SIGN', brake: 'BRAKE', nose: 'NOSE', tail: 'TAIL', spring: 'SPRING', drain: 'DRAIN', turn: 'TURN' }; // (TOP VIEW is said by its glyph alone: a 44 px top-bar tile has no room for 14 px words)
export const tileWord = (id) => WORDS[id] || null;

const CSS = `
.tt{position:fixed;left:0;top:0;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
  -webkit-tap-highlight-color:transparent;pointer-events:auto;z-index:6;contain:strict}
.tt>canvas{position:absolute;left:0;top:0;pointer-events:none}
.tt.hidden{display:none}
`;
let styled = false;
export function tileStyle() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style'); s.setAttribute('data-touchtiles', ''); s.textContent = CSS; document.head.appendChild(s);
}

const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const glaze = () => {
  const s = getComputedStyle(document.documentElement), v = (k, d) => (s.getPropertyValue(k).trim() || d);
  return { top: v('--jtop', '104,50,32'), bot: v('--jbot', '34,15,9') };
};
/** A glaze of one colour (a note pad's: its note's), deep in the middle and darker where it pools: as the window colour's two stops. */
const tinted = (hex) => {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255, k = (v, m) => Math.round(v * m);
  return { top: `${k(r, 0.92)},${k(g, 0.92)},${k(b, 0.92)}`, bot: `${k(r, 0.42)},${k(g, 0.42)},${k(b, 0.42)}` };
};
/** A small seeded stream (the grog's speckles fall the same on every tile of a size). */
const seeded = (n) => () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);

const BODIES = new Map();
/** The tile's body (foot, face, glaze, glyph, word) at a size and state, drawn once and kept. */
function body(w, h, dpr, { glyph, pal, word, corner, pressed, tint }) {
  const G = tint != null ? tinted(tint) : glaze(), key = `${w}x${h}|${dpr}|${glyph}|${pal}|${word}|${corner}|${pressed}|${G.top}|${G.bot}`;
  if (BODIES.has(key)) return BODIES.get(key);
  const f = TILE.foot, c = document.createElement('canvas'), s = Math.min(w, h);
  c.width = Math.round(w * dpr); c.height = Math.round((h + f) * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const y0 = pressed ? f : 0, r = s * 0.2, inset = Math.max(4, s * 0.11);
  // the foot: the tile's thickness, under the face
  rr(g, 1, f + 0.5, w - 2, h - 2, r); g.fillStyle = '#2a120b'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  // the face: unglazed earthenware, lit from the top left, the grog speckled in
  rr(g, 1, y0 + 1, w - 2, h - 2, r);
  const clay = g.createLinearGradient(0, y0, s * 0.4, y0 + h); clay.addColorStop(0, '#9a5638'); clay.addColorStop(1, '#5a2b1d');
  g.fillStyle = clay; g.fill();
  g.save(); g.clip();
  const rnd = seeded(w * 7 + h * 3);
  for (let i = 0; i < Math.sqrt(w * h) * 1.4 * (w / s); i++) { const x = rnd() * w, y = y0 + rnd() * h, light = rnd() < 0.45; g.fillStyle = light ? 'rgba(255,236,214,.22)' : 'rgba(40,18,8,.38)'; g.fillRect(x, y, light ? 0.8 : 1.1, light ? 0.8 : 1.1); }
  g.restore();
  // the glaze: a pool of the window colour, deep in the middle, breaking pale where it thins over the clay's lip
  rr(g, inset, y0 + inset, w - 2 * inset, h - 2 * inset, r * 0.7);
  const pool = g.createRadialGradient(w * 0.42, y0 + h * 0.36, s * 0.05, w * 0.5, y0 + h * 0.5, Math.max(w, h) * 0.62);
  pool.addColorStop(0, `rgba(${G.top},.98)`); pool.addColorStop(0.75, `rgba(${G.bot},.98)`); pool.addColorStop(1, `rgba(${G.bot},1)`);
  g.fillStyle = pool; g.fill();
  g.lineWidth = Math.max(1.5, s * 0.03); g.strokeStyle = 'rgba(255,226,196,.28)'; g.stroke();
  if (pressed) { g.fillStyle = 'rgba(12,5,2,.22)'; g.fill(); }
  // the sheen: the glaze's gloss, a soft window of light top left
  g.save(); rr(g, inset, y0 + inset, w - 2 * inset, h - 2 * inset, r * 0.7); g.clip();
  const sh = g.createRadialGradient(s * 0.3, y0 + s * 0.24, 0, s * 0.3, y0 + s * 0.24, s * 0.34);
  sh.addColorStop(0, `rgba(255,248,236,${pressed ? 0.1 : 0.2})`); sh.addColorStop(1, 'rgba(255,248,236,0)');
  g.fillStyle = sh; g.fillRect(0, y0, w, h); g.restore();
  // the keyline round the face
  rr(g, 1, y0 + 1, w - 2, h - 2, r); g.lineWidth = 1.5; g.strokeStyle = '#1c0d08'; g.stroke();
  const ink = pal === 'gold' ? TILE.gold : '#efe6d2', text = (t, x, y, px, a = 'center') => {
    g.font = `${px}px ${FONT.sys}`; g.textAlign = a; g.textBaseline = 'alphabetic';
    g.fillStyle = '#1c0d08'; g.fillText(t, x + 1, y + 1); g.fillStyle = ink; g.fillText(t, x, y);
  };
  if (glyph) { // the glyph, at a whole number of device pixels an art pixel; the word under it
    const icon = uiIcon(glyph.includes('.') ? glyph : `touch.${glyph}`, pal), wordH = word ? TILE.word + 2 : 0;
    const pad = Math.max(3, s * 0.08), room = (h - wordH - 2 * pad) * dpr; // (the glyph and its word inside the face: the owner's GRAPPLE and DRAW, 2026-10-26, had their words cut off at 44 px)
    const k = Math.max(1, Math.min(Math.round((s * TILE.glyph * dpr) / Math.max(icon.width, 1)), Math.floor(room / Math.max(icon.height, 1)))); // (a whole number, never past the room the word leaves)
    const iw = icon.width * k, ih = icon.height * k, cx = Math.round((w * dpr - iw) / 2), cy = Math.round(((h - wordH) * dpr - ih) / 2 + y0 * dpr + (word ? pad * 0.5 * dpr : 0));
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(icon, cx, cy, iw, ih); g.restore();
    if (word) text(word, w / 2, Math.min(cy / dpr + ih / dpr + TILE.word, y0 + h - pad), TILE.word);
  } else if (word) text(word, w / 2, y0 + h / 2 + TILE.big * 0.36 + (corner ? TILE.word * 0.3 : 0), TILE.big); // (a named tile: its thing's label, larger)
  if (corner) { g.globalAlpha = 0.72; text(corner, inset + 2, y0 + inset + TILE.word - 1, TILE.word, 'left'); g.globalAlpha = 1; } // (USE, small in the corner)
  if (BODIES.size > 256) BODIES.clear(); // (a window-colour change leaves the old ones behind: let them go wholesale)
  BODIES.set(key, c);
  return c;
}

/** The rim's path as points round the face, from the top's middle clockwise, at a size (kept). */
const RIMS = new Map();
function rimPoints(W, Hh) {
  const key = `${W}x${Hh}`; if (RIMS.has(key)) return RIMS.get(key);
  const i = TILE.rim / 2 + 2.5, w = W - 2 * i, h = Hh - 2 * i, r = Math.min(W, Hh) * 0.2 - i * 0.6, N = Math.round(TILE.samples * Math.max(1, W / Hh)), sw = w - 2 * r, sh = h - 2 * r, q = (Math.PI * r) / 2, per = 2 * sw + 2 * sh + 4 * q, pts = [];
  for (let n = 0; n <= N; n++) {
    let d = ((n / N) * per + sw / 2) % per; // (from the top's middle)
    const seg = [sw, q, sh, q, sw, q, sh, q];
    const corners = [[i + w - r, i + r, -Math.PI / 2], [i + w - r, i + h - r, 0], [i + r, i + h - r, Math.PI / 2], [i + r, i + r, Math.PI]];
    const lines = [[i + r, i, 1, 0], [i + w, i + r, 0, 1], [i + w - r, i + h, -1, 0], [i, i + h - r, 0, -1]];
    let k = 0; while (k < 7 && d > seg[k]) { d -= seg[k]; k++; }
    if (k % 2 === 0) { const [x, y, dx, dy] = lines[k / 2]; pts.push([x + dx * d, y + dy * d]); }
    else { const [cx, cy, a0] = corners[(k - 1) / 2], a = a0 + d / r; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  }
  RIMS.set(key, pts);
  return pts;
}

const _c = new THREE.Color(), _e = new THREE.Color(TILE.ember);

export class TouchTile {
  constructor(id, { size = TILE.size, word, glyph, corner = null, onPress = null, fit = false, tint = null } = {}) {
    tileStyle();
    this.fit = fit; this.tint = tint;
    this.id = id; this.glyph = glyph === undefined ? id : glyph; this.word = word === undefined ? tileWord(this.glyph || id) : word; this.corner = corner; this.onPress = onPress;
    this.size = Math.max(TILE.min, size); this.w = this.size;
    this.state = { charge: 0, ember: 0, pips: 0, lit: false, dim: false, hidden: true, pressed: false };
    this.pid = null; this.dirty = true; this.drawnAt = -1; this.lastBody = null;
    const el = (this.el = document.createElement('div')); el.className = 'tt hidden'; el.dataset.tile = id;
    this.bodyCv = document.createElement('canvas'); this.rimCv = document.createElement('canvas'); el.append(this.bodyCv, this.rimCv);
    el.addEventListener('pointerdown', (e) => {
      if (this.pid != null || this.state.hidden) return;
      e.preventDefault(); e.stopPropagation(); this.pid = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch { /* a synthetic pointer */ }
      this.press(true);
    });
    const end = (e) => {
      if (e.pointerId !== this.pid) return;
      const b = el.getBoundingClientRect(), inside = e.type === 'pointerup' && e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
      this.pid = null; this.press(false, inside);
    };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    document.body.appendChild(el);
  }

  press(down, inside = false) {
    if (this.state.pressed === down) return;
    this.state.pressed = down; this.dirty = true;
    this.onPress?.(this.id, down, inside);
  }
  /** Let go, as if the finger lifted outside (a tile hidden or swapped while held). */
  release() { if (this.pid != null) { try { this.el.releasePointerCapture(this.pid); } catch { /* gone */ } this.pid = null; } this.press(false, false); }

  /** A named tile's words: its thing's label and the corner's. Redrawn only when they change. */
  label(word, corner = this.corner) { if (word === this.word && corner === this.corner) return this; this.word = word; this.corner = corner; this.dirty = true; return this; }
  /** A face changed in place (a tool's verb on FIRE, DRAW turned STOW, a duel's FORM): its glyph, word, corner and tint, any of them;
   *  redrawn only when one changes. */
  face({ glyph = this.glyph, word = this.word, corner = this.corner, tint = this.tint } = {}) {
    if (glyph === this.glyph && word === this.word && corner === this.corner && tint === this.tint) return this;
    this.glyph = glyph; this.word = word; this.corner = corner; this.tint = tint; this.dirty = true; return this;
  }
  /** How wide a named tile wants to be for its label (its height `size`): never narrower than square. A glyph's tile is square, unless
   *  made to `fit` its word (a word wider than the tile: GIVE LINE, REPROGRAM), so the word is never shrunk under the least type. */
  widthFor(size = this.size) {
    if (!this.word || (this.glyph && !this.fit)) return size;
    const g = (TouchTile.measure ||= document.createElement('canvas').getContext('2d')), big = !this.glyph;
    g.font = `${big ? TILE.big : TILE.word}px ${FONT.sys}`;
    return Math.max(size, Math.ceil(g.measureText(this.word).width + size * (big ? 0.5 : 0.34)));
  }

  /** Stand at (x, y), its top left in CSS px, at a size (its height; a named tile as wide as its label wants), never under the least. */
  place(x, y, size = this.size, w = null) {
    size = Math.max(TILE.min, Math.round(size)); w = Math.max(size, Math.round(w ?? this.widthFor(size)));
    if (size !== this.size || w !== this.w) { this.size = size; this.w = w; this.dirty = true; }
    this.x = Math.round(x); this.y = Math.round(y); // (where it stands, kept: a neighbour lays itself by it without reading the page)
    this.el.style.width = `${w}px`; this.el.style.height = `${size + TILE.foot}px`;
    this.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  /** The state: any of charge, ember, pips, lit, dim, hidden (hidden while held lets go first). */
  set(st) {
    const S = this.state;
    for (const k of ['charge', 'ember', 'pips']) if (st[k] !== undefined) { const v = Math.max(0, +st[k] || 0); if (Math.abs(v - S[k]) > 0.004) { S[k] = v; this.dirty = true; } }
    for (const k of ['lit', 'dim']) if (st[k] !== undefined && !!st[k] !== S[k]) { S[k] = !!st[k]; this.dirty = true; }
    if (st.hidden !== undefined && !!st.hidden !== S.hidden) {
      S.hidden = !!st.hidden; this.el.classList.toggle('hidden', S.hidden);
      if (S.hidden) this.release(); else this.dirty = true;
    }
    return this;
  }

  /** Something on the rim moves: the schiller walks under a charge, a lit or pressed rim, an ember. */
  get moving() { const S = this.state; return !S.hidden && (S.charge > 0 || S.ember > 0 || S.lit || S.pressed); }

  /** Draw what changed (the body from its cache; the rim while it moves, at most once a frame). `now` in real seconds. */
  update(now) {
    if (this.state.hidden || (!this.dirty && !this.moving) || now === this.drawnAt) return;
    this.drawnAt = now; this.dirty = false;
    const S = this.state, w = this.w, h = this.size, f = TILE.foot, dpr = Math.max(1, Math.min(3, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1));
    for (const cv of [this.bodyCv, this.rimCv]) { const W = Math.round(w * dpr), H = Math.round((h + f) * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; cv.style.width = `${w}px`; cv.style.height = `${h + f}px`; this.lastBody = null; } }
    const B = body(w, h, dpr, { glyph: this.glyph, pal: S.lit || S.pressed ? 'gold' : this.iconPal || 'clay', word: this.word, corner: this.corner, pressed: S.pressed, tint: this.tint });
    if (this.lastBody !== B) { const g = this.bodyCv.getContext('2d'); g.clearRect(0, 0, this.bodyCv.width, this.bodyCv.height); g.drawImage(B, 0, 0); this.lastBody = B; }
    this.drawRim(now, w, h, dpr, S.pressed ? f : 0);
  }

  drawRim(now, w, h, dpr, y0) {
    const S = this.state, g = this.rimCv.getContext('2d'), s = Math.min(w, h);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.rimCv.width, this.rimCv.height); g.setTransform(dpr, 0, 0, dpr, 0, y0 * dpr);
    const P = rimPoints(w, h), N = P.length - 1, ph = now * SCHILLER.rate;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const loop = () => { g.beginPath(); g.moveTo(...P[0]); for (let n = 1; n <= N; n++) g.lineTo(...P[n]); };
    // the rim's ground: the ink, dark, always (the glaze's edge has a line to fill)
    loop(); g.lineWidth = TILE.rim; g.strokeStyle = 'rgba(23,17,31,.75)'; g.stroke();
    // the charge: the schiller walking round from the top's middle, as far as it has filled (all of it lit or pressed)
    const k = S.lit || S.pressed ? 1 : Math.min(1, S.charge), m = Math.round(N * k);
    for (let n = 0; n < m; n++) {
      schillerInk(ph + (n / N) * 0.5, _c, { floor: 0.55, sheen: 1, bright: 1.45 });
      if (S.ember > 0) _c.lerp(_e, Math.min(1, S.ember));
      g.beginPath(); g.moveTo(...P[n]); g.lineTo(...P[n + 1]); g.lineWidth = TILE.rim - 0.5; g.strokeStyle = _c.getStyle(); g.stroke();
    }
    if (S.charge >= 1 && !S.lit) { loop(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,246,208,.8)'; g.stroke(); } // (full: a bright thread round it)
    // the ember: the rim and the glaze warming toward the scorch, beating as it nears the top
    if (S.ember > 0.01) {
      const e = Math.min(1, S.ember), beat = e > 0.8 ? 0.75 + 0.25 * Math.sin(now * 10) : 1;
      g.save(); g.shadowColor = TILE.ember; g.shadowBlur = 10 * e * beat;
      loop(); g.globalAlpha = 0.25 + 0.75 * e * beat; g.lineWidth = TILE.rim; g.strokeStyle = TILE.ember; g.stroke(); g.restore();
      const in0 = Math.max(4, s * 0.11), wash = g.createLinearGradient(0, h, 0, h * (1 - e));
      wash.addColorStop(0, `rgba(255,122,42,${0.42 * e * beat})`); wash.addColorStop(1, 'rgba(255,122,42,0)');
      rr(g, in0, in0, w - 2 * in0, h - 2 * in0, s * 0.14); g.fillStyle = wash; g.fill();
    }
    // the banked suns along the top edge, the last one a pie of its share
    if (S.pips > 0.01) {
      const n = Math.min(3, Math.ceil(S.pips - 1e-3)), rr0 = Math.max(4, s * 0.065), gap = rr0 * 2.7, x0 = w / 2 - ((n - 1) * gap) / 2, y = Math.max(rr0 + 3, s * 0.13);
      for (let i = 0; i < n; i++) {
        const x = x0 + i * gap, share = Math.min(1, S.pips - i);
        g.beginPath(); g.arc(x, y, rr0 + 1.5, 0, Math.PI * 2); g.fillStyle = '#1c0d08'; g.fill();
        g.beginPath(); g.arc(x, y, rr0, 0, Math.PI * 2); g.fillStyle = '#4a2c0a'; g.fill();
        g.beginPath(); g.moveTo(x, y); g.arc(x, y, rr0, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2); g.closePath(); g.fillStyle = TILE.gold; g.fill();
        g.beginPath(); g.arc(x - rr0 * 0.3, y - rr0 * 0.3, rr0 * 0.3, 0, Math.PI * 2); g.fillStyle = 'rgba(255,246,208,.9)'; g.fill();
      }
    }
    // a luffed sail: the tile washed dark while it cannot be used
    if (S.dim) { rr(g, 1, 1, w - 2, h - 2, s * 0.2); g.fillStyle = 'rgba(16,8,4,.55)'; g.fill(); }
  }

  dispose() { this.release(); this.el.remove(); }
}
