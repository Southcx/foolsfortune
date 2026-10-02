// ---------------------------------------------------------------------------------------
// THE PIXEL KIT: the maker's pixel art, used as pixel art. Every piece is drawn by its maker at 1x on a fixed GREYSCALE ramp of twelve
// greys (20, 46, 53, 59, 67, 78, 86, 102, 133, 179, 196, 233); the game recolours each grey to the matching step of a PALETTE (the clay
// of the workshop, the indigo of a mind, the gold of a reward), at 1x, into a canvas, and only then scales the canvas up by a WHOLE
// number (2x on a 1080-line screen, 3x on a 1440, 1x on a small window), drawn with no smoothing, so a pixel is always a square of
// pixels and nothing is ever resampled. A palette swap is a different twelve colours, not a different drawing.
//
//   await px.load()                       once (the art is decoded)
//   px.scale()                            the whole number the art is scaled by just now (device pixels per art pixel)
//   px.art(name, pal)                     the piece recoloured, at 1x (a canvas, cached): 'xclose', 'help', 'exclaim' (and '_p' pressed),
//                                         'confirm', 'confirm_p', 'endpiece', 'glove_point', 'glove_grab', 'glove_left', 'bead' (7 frames)
//   px.text(str, pal)                     a line in the maker's font (the jank font: 16 x 16 cells, ASCII from the space), proportional:
//                                         each letter as wide as its ink, a pixel between
//   px.show(canvas, { k })                a <canvas> element showing it at the integer scale (x k more), kept crisp across resizes
//   px.button(name, pal, onClick)         one of the square buttons, its pressed face while held
//   px.cursor(name, pal, hx, hy)          a CSS cursor of a glove at the integer scale (its hotspot in art pixels)
//   PAL                                   the palettes
//
// Prior art: the hardware palettes of the 8- and 16-bit consoles (a sprite drawn in indices, coloured by a palette swapped at will:
// Final Fantasy's and Dragon Quest's recoloured enemies and windows), and the integer scaling every pixel-art game since has insisted on
// (a 2x or 3x of the native art, nearest neighbour, never a fraction).
// ---------------------------------------------------------------------------------------
import fFont from '../assets/ui/px/font_jankfont.png?b64';
import fEnd from '../assets/ui/px/lachrimeter_endpiece.png?b64';
import fX from '../assets/ui/px/ui_xclose32.png?b64';
import fXp from '../assets/ui/px/ui_xclose32_pressed.png?b64';
import fHelp from '../assets/ui/px/ui_helpbutton32.png?b64';
import fHelpP from '../assets/ui/px/ui_helpbutton32_pressed.png?b64';
import fExc from '../assets/ui/px/ui_exclaimbutton32.png?b64';
import fExcP from '../assets/ui/px/ui_exclaimbutton32_pressed.png?b64';
import fOk from '../assets/ui/px/ui_largeconfirmbutton.png?b64';
import fOkP from '../assets/ui/px/ui_largeconfirmbutton_pressed.png?b64';
import fGPoint from '../assets/ui/px/ui_glovecursor_point32.png?b64';
import fGGrab from '../assets/ui/px/ui_glovecursor_grab32.png?b64';
import fGLeft from '../assets/ui/px/ui_glovepointerleft32.png?b64';
import fBead from '../assets/ui/px/vfx_beadflash.png?b64';

const SRC = {
  font: fFont, endpiece: fEnd, xclose: fX, xclose_p: fXp, help: fHelp, help_p: fHelpP, exclaim: fExc, exclaim_p: fExcP,
  confirm: fOk, confirm_p: fOkP, glove_point: fGPoint, glove_grab: fGGrab, glove_left: fGLeft, bead: fBead,
};
export const GREYS = [20, 46, 53, 59, 67, 78, 86, 102, 133, 179, 196, 233];
export const PAL = {
  clay: ['#1c0d08', '#2a120b', '#3b1c13', '#45211a', '#4f271e', '#5a2b1d', '#6f3726', '#8c4a33', '#b4603f', '#e8ab86', '#f3c9a8', '#fff1dc'],
  mind: ['#0a0612', '#170f2a', '#211638', '#271a42', '#2f1f4f', '#38255d', '#432c6e', '#563889', '#7650b8', '#b49be6', '#d2c3f4', '#f6f0ff'],
  gold: ['#1c0d08', '#3a2208', '#4a2c0a', '#55340c', '#62400f', '#704b12', '#7f5816', '#9c701e', '#c9962c', '#f2cc5a', '#ffe08a', '#fff6d0'],
  grey: GREYS.map((v) => `rgb(${v},${v},${v})`),
};
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const LUT = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map((c) => (c.startsWith('#') ? rgb(c) : c.match(/\d+/g).map(Number)))]));

class PixelKit {
  constructor() {
    this.img = {}; this.cache = new Map(); this.shown = new Set(); this.ready = false; this.glyphs = null;
    addEventListener('resize', () => this.rescale());
  }

  load() {
    if (this.loading) return this.loading;
    this.loading = Promise.all(Object.entries(SRC).map(([k, b]) => new Promise((res) => {
      const im = new Image(); im.onload = () => { this.img[k] = im; res(); }; im.onerror = () => res(); im.src = `data:image/png;base64,${b}`;
    }))).then(() => { this.ready = true; this.measureFont(); });
    return this.loading;
  }

  /** Device pixels per art pixel: a whole number, from the window's height (and the screen's pixel ratio). */
  scale() { const dpr = window.devicePixelRatio || 1; return Math.max(1, Math.min(5, Math.round((innerHeight * dpr) / 540))); }

  /** A piece recoloured to a palette, at 1x. */
  art(name, pal = 'clay') {
    const key = `${name}|${pal}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const im = this.img[name];
    const c = document.createElement('canvas');
    if (!im) { c.width = c.height = 1; return c; }
    c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data, L = LUT[pal] || LUT.clay;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue;
      let best = 0, bd = 1e9; for (let k = 0; k < GREYS.length; k++) { const e = Math.abs(GREYS[k] - a[i]); if (e < bd) { bd = e; best = k; } }
      const [r, gg, b] = L[best]; a[i] = r; a[i + 1] = gg; a[i + 2] = b; a[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    this.cache.set(key, c);
    return c;
  }

  /** The font's metrics: each cell's ink, left to right, and the band of rows any letter uses. */
  measureFont() {
    const im = this.img.font; if (!im) return;
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const a = g.getImageData(0, 0, c.width, c.height).data, W = c.width;
    const G = []; let top = 16, bot = 0;
    for (let i = 0; i < 96; i++) {
      const cx = (i % 16) * 16, cy = Math.floor(i / 16) * 16;
      let l = 16, r = -1;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (a[((cy + y) * W + cx + x) * 4 + 3] > 0) { if (x < l) l = x; if (x > r) r = x; if (y < top) top = y; if (y > bot) bot = y; }
      G.push(r < 0 ? null : { cx, cy, l, w: r - l + 1 });
    }
    this.glyphs = G; this.fontTop = top; this.fontH = bot - top + 1;
  }

  /** A line of text in the maker's font, recoloured, at 1x. */
  text(str, pal = 'clay', { space = 5, gap = 0 } = {}) {
    const key = `T|${str}|${pal}|${space}|${gap}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const font = this.art('font', pal), G = this.glyphs;
    const c = document.createElement('canvas');
    if (!G) { c.width = c.height = 1; return c; }
    const advance = (ch) => { const i = ch.charCodeAt(0) - 32, gl = G[i]; return i < 0 || i > 95 || !gl ? space : gl.w + 1 + gap; };
    let w = 0; for (const ch of str) w += advance(ch);
    c.width = Math.max(1, w); c.height = this.fontH;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    let x = 0;
    for (const ch of str) {
      const i = ch.charCodeAt(0) - 32, gl = G[i];
      if (i >= 0 && i <= 95 && gl) g.drawImage(font, gl.cx + gl.l, gl.cy + this.fontTop, gl.w, this.fontH, x, 0, gl.w, this.fontH);
      x += advance(ch);
    }
    if (this.cache.size > 400) this.cache.clear();
    this.cache.set(key, c);
    return c;
  }

  /** An element showing a 1x canvas at the integer scale (times k), crisp: it follows the window's size. */
  show(src, { k = 1, el = null } = {}) {
    const c = el || document.createElement('canvas');
    c.classList.add('px');
    c.__src = src; c.__k = k;
    this.paint(c);
    this.shown.add(c);
    return c;
  }
  paint(c) {
    const src = c.__src, s = Math.max(1, Math.round(this.scale() * c.__k)), dpr = window.devicePixelRatio || 1;
    if (c.width !== src.width * s || c.height !== src.height * s) { c.width = src.width * s; c.height = src.height * s; }
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    c.style.width = `${c.width / dpr}px`; c.style.height = `${c.height / dpr}px`;
  }
  /** Show another 1x canvas in an element made by `show`. */
  swap(c, src) { if (c.__src === src) return; c.__src = src; this.paint(c); }
  rescale() { for (const c of this.shown) { if (!c.isConnected) { this.shown.delete(c); continue; } this.paint(c); } }

  /** One of the square buttons (xclose, help, exclaim), its pressed face while held. */
  button(name, pal, onClick, title = '') {
    const b = document.createElement('button');
    b.className = 'pxbtn'; b.type = 'button'; if (title) b.title = title;
    const up = this.art(name, pal), down = this.art(`${name}_p`, pal), cv = this.show(up);
    b.appendChild(cv);
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.swap(cv, down); });
    const rel = () => this.swap(cv, up);
    b.addEventListener('pointerup', rel); b.addEventListener('pointerleave', rel);
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick?.(e); });
    return b;
  }

  /** A glove as a CSS cursor value at the integer scale (hotspot in art pixels). */
  cursor(name, pal = 'clay', hx = 0, hy = 0, fallback = 'default') {
    const src = this.art(name, pal), s = Math.max(1, Math.min(3, this.scale())); // (browsers cap a cursor at 128 px)
    const c = document.createElement('canvas'); c.width = src.width * s; c.height = src.height * s;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
    return `url(${c.toDataURL()}) ${hx * s} ${hy * s}, ${fallback}`;
  }

  /** The frames of a sheet (16 x 16 each, left to right), recoloured. */
  frames(name, pal = 'clay', fw = 16) {
    const key = `F|${name}|${pal}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const sheet = this.art(name, pal), out = [];
    for (let x = 0; x + fw <= sheet.width; x += fw) { const c = document.createElement('canvas'); c.width = fw; c.height = sheet.height; c.getContext('2d').drawImage(sheet, x, 0, fw, sheet.height, 0, 0, fw, sheet.height); out.push(c); }
    this.cache.set(key, out);
    return out;
  }
}

export const px = new PixelKit();

/** The kit's few rules (crisp scaling; a button with no chrome of its own). */
export const PX_CSS = `
canvas.px { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }
button.pxbtn { all: unset; display: inline-block; cursor: inherit; line-height: 0; }
button.pxbtn:focus-visible { outline: 1px dashed #fff1dc; outline-offset: 2px; }
`;
