// ---------------------------------------------------------------------------------------
// THE BITMAP FONT: the maker's own letters, drawn on a sheet (printable ASCII from the space, sixteen to a row) in the same greys as
// the other pieces, so it takes the window colour through the palette (palette.js). It is pixel art: it is drawn at a whole-number
// scale only, never smoothed, so it goes where text has one fixed size. Each glyph's width is measured from the sheet (the first and
// last columns with ink in its cell), and a fixed gap is put between glyphs, so the spacing does not depend on how the sheet was laid out.
//
// Prior art: the bitmap fonts of every console game before outline fonts (a tile sheet of glyphs, a width table beside it: the SNES
// RPGs' variable-width text, the PS2's menus), and the AngelCode BMFont layout of a sheet and per-glyph advance.
//
//   setBitmapText(el, text)      draws the text into el as one canvas (or, until the sheet exists, writes it as plain text)
//
// Where it is used is a list (USE, below): one place, for now, so it is easily taken out again.
// ---------------------------------------------------------------------------------------
import { rampFor, swap } from './palette.js';

const SHEETS = import.meta.glob('../assets/ui/font_sheet.png', { eager: true, query: '?b64', import: 'default' });
const SHEET = Object.values(SHEETS)[0] ? `data:image/png;base64,${Object.values(SHEETS)[0]}` : null;
const FIRST = 32, COLS = 16, COUNT = 95;
export const BM = { scale: 2, gap: 1, space: 0.4 }; // (the scale in screen pixels per sheet pixel; the gap between glyphs; a space as a share of a cell)

let font = null, lut = null, tinted = null, gen = 0;
const els = new Set();

if (SHEET) {
  const img = new Image();
  img.onload = () => {
    const cw = Math.floor(img.width / COLS), ch = Math.floor(img.height / Math.ceil(COUNT / COLS));
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const a = g.getImageData(0, 0, img.width, img.height).data, glyphs = [];
    for (let i = 0; i < COUNT; i++) {
      const x0 = (i % COLS) * cw, y0 = Math.floor(i / COLS) * ch;
      let l = cw, r = -1;
      for (let x = 0; x < cw; x++) for (let y = 0; y < ch; y++) if (a[((y0 + y) * img.width + x0 + x) * 4 + 3] > 16) { l = Math.min(l, x); r = Math.max(r, x); }
      glyphs.push(r < 0 ? { x: x0, y: y0, w: Math.round(cw * BM.space), blank: true } : { x: x0 + l, y: y0, w: r - l + 1 });
    }
    font = { img, cw, ch, glyphs };
    repaint();
  };
  img.src = SHEET;
  document.addEventListener('jui-palette', (e) => { lut = e.detail.lut; repaint(); });
}
function repaint() {
  if (!font) return;
  tinted = lut ? swap(font.img, lut) : font.img;
  gen++;
  for (const el of els) if (el.isConnected) draw(el, el._bmText); else els.delete(el);
}
function draw(el, text) {
  const G = font.glyphs, s = BM.scale;
  let w = 0;
  for (const ch of text) { const q = G[ch.charCodeAt(0) - FIRST] || G[0]; w += q.w + BM.gap; }
  const c = el._bmCanvas || (el._bmCanvas = document.createElement('canvas'));
  c.width = Math.max(1, w * s); c.height = font.ch * s;
  c.style.cssText = 'image-rendering: pixelated; display: inline-block; vertical-align: middle;';
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  let x = 0;
  for (const ch of text) {
    const q = G[ch.charCodeAt(0) - FIRST] || G[0];
    if (!q.blank) g.drawImage(tinted, q.x, q.y, q.w, font.ch, x * s, 0, q.w * s, font.ch * s);
    x += q.w + BM.gap;
  }
  if (c.parentNode !== el) { el.textContent = ''; el.appendChild(c); }
  el._bmGen = gen;
}

/** Write text into an element in the bitmap font (plain text until the sheet is there). */
export function setBitmapText(el, text) {
  text = String(text);
  if (!el || (el._bmText === text && el._bmGen === gen && (font || el.textContent === text))) return;
  el._bmText = text;
  if (!font) { el.textContent = text; return; }
  els.add(el);
  draw(el, text);
}
export const bitmapFontReady = () => !!font;
// (the palette the pieces were last painted with is sent with 'jui-palette'; until then the sheet is drawn in its own greys)
export { rampFor };
