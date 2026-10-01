// ---------------------------------------------------------------------------------------
// PALETTE SWAP: the maker's UI pieces (a clasp, a glass tube, the buttons, a bitmap font) are drawn in grey on a fixed ramp of a dozen
// values, so each grey is an index, not a colour. Here each is mapped through a ramp made from the window colour (theme.js: the
// darkest outline is the theme's lo, the body its top and bottom, the light its mid and hi), painted once into a canvas per piece,
// and handed to CSS as a data URL; when the window colour changes, they are painted again. Nothing per frame.
//
// Prior art: the palette swap of the 8- and 16-bit consoles (a sprite's pixels are indices into a palette in CGRAM; a Mega Man
// weapon, a Pokemon's shiny, an SNES RPG's window colour are a different palette for the same pixels) and Final Fantasy's window
// colour setting, which this follows (the colour is the player's, the shapes are the game's).
//
//   paintPieces(theme)          (theme.js calls it on every change) sets --jui-clasp, --jui-tube, --jui-btn-close/-help/-excl/-blank
//   rampFor(theme) -> lut        256 entries of [r, g, b] for a theme
//   swap(img, lut) -> canvas     an image's greys through a ramp
//
// The four buttons were redrawn here as stand-ins on the same ramp (the originals were only seen, not received): a file of the same
// name in src/assets/ui replaces each, and nothing else needs to change.
// ---------------------------------------------------------------------------------------
import clasp from '../assets/ui/ui_clasp.png?b64';
import tube from '../assets/ui/ui_tube.png?b64';
import btnClose from '../assets/ui/ui_btn_close.png?b64';
import btnHelp from '../assets/ui/ui_btn_help.png?b64';
import btnExcl from '../assets/ui/ui_btn_excl.png?b64';
import btnBlank from '../assets/ui/ui_btn_blank.png?b64';

// (inlined, as the gloves are: the game ships as one page)
const png = (b) => `data:image/png;base64,${b}`;
export const PIECES = { clasp: png(clasp), tube: png(tube), 'btn-close': png(btnClose), 'btn-help': png(btnHelp), 'btn-excl': png(btnExcl), 'btn-blank': png(btnBlank) };

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const trip = (s) => s.split(',').map(Number);
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/** The ramp: the greys the pieces are drawn in, onto the window colour (outline, shadow, body, light, highlight). */
export function rampFor(t) {
  const lo = hex(t.lo), bot = trip(t.bot), top = trip(t.top), mid = hex(t.mid), hi = hex(t.hi);
  const stops = [[0, mix(lo, [0, 0, 0], 0.5)], [20, lo], [53, mix(lo, bot, 0.6)], [86, mix(bot, top, 0.7)], [133, mix(top, mid, 0.75)], [196, mix(mid, hi, 0.55)], [233, hi], [255, [255, 252, 244]]];
  const lut = new Array(256);
  for (let v = 0, s = 0; v < 256; v++) {
    while (s < stops.length - 2 && v > stops[s + 1][0]) s++;
    const [a, ca] = stops[s], [b, cb] = stops[s + 1];
    lut[v] = mix(ca, cb, Math.min(1, Math.max(0, (v - a) / (b - a)))).map(Math.round);
  }
  return lut;
}

const cache = new Map();
function load(url) {
  if (!cache.has(url)) cache.set(url, new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; }));
  return cache.get(url);
}

/** An image's greys through a ramp (alpha kept). */
export function swap(img, lut, w = img.width, h = img.height) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (!p[i + 3]) continue;
    const v = Math.round(p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114), c3 = lut[v];
    p[i] = c3[0]; p[i + 1] = c3[1]; p[i + 2] = c3[2];
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** The tube is drawn with its slices marked by clear columns (cap | tile | cap): close them up so CSS can slice it. */
function closeTube(img) {
  const c = document.createElement('canvas'), L = 34, M0 = 36, M = 25, R0 = 63, R = img.width - R0;
  c.width = L + M + R; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, L, img.height, 0, 0, L, img.height);
  g.drawImage(img, M0, 0, M, img.height, L, 0, M, img.height);
  g.drawImage(img, R0, 0, R, img.height, L + M, 0, R, img.height);
  return c;
}
export const TUBE = { left: 34, right: 33, h: 33, glass: { top: 12, h: 5, left: 18, right: 18 } }; // (where the glass is, in the closed-up tube)

let gen = 0;
export async function paintPieces(t) {
  const my = ++gen, lut = rampFor(t), root = document.documentElement.style;
  for (const [k, url] of Object.entries(PIECES)) {
    let img = await load(url);
    if (!img || my !== gen) continue;
    if (k === 'tube') img = closeTube(img);
    root.setProperty(`--jui-${k}`, `url(${swap(img, lut).toDataURL()})`);
  }
  document.dispatchEvent(new CustomEvent('jui-palette', { detail: { lut } }));
}

// ---------------------------------------------------------------- where the pieces are worn
// (pixel art at whole-number scales only, never smoothed: the tube at 2x as the Lachryma gauge, the buttons and the clasp at 1x)
const CSS = `
.jpx { image-rendering: pixelated; }
body #lachryma .bar { height: ${TUBE.h * 2}px; margin: 0 -6px -4px; background: none; border: none; box-shadow: none; overflow: visible; }
body #lachryma .bar .glass { position: absolute; left: ${TUBE.glass.left * 2}px; right: ${TUBE.glass.right * 2}px; top: ${TUBE.glass.top * 2}px; height: ${TUBE.glass.h * 2}px;
  background: linear-gradient(180deg, #0c0503, #2a140d); overflow: hidden; }
body #lachryma .bar::after { content: ''; position: absolute; inset: 0; pointer-events: none; image-rendering: pixelated;
  border-style: solid; border-width: 0 ${TUBE.right * 2}px 0 ${TUBE.left * 2}px; border-image: var(--jui-tube) 0 ${TUBE.right} 0 ${TUBE.left} fill / 0 ${TUBE.right * 2}px 0 ${TUBE.left * 2}px / 0 round; }
body #codex .x, body #pneuka .x { width: 32px; height: 32px; padding: 0; border: none; border-radius: 0; font-size: 0; color: transparent; background: var(--jui-btn-close) 0 0 / 32px 32px no-repeat; image-rendering: pixelated; flex: none; }
body #codex .x:hover, body #pneuka .x:hover, body #codex .q:hover { filter: brightness(1.25); }
body #codex .x:active, body #pneuka .x:active, body #codex .q:active { transform: translateY(1px); }
body #codex .q { width: 32px; height: 32px; cursor: var(--jcur-pointer, pointer); background: var(--jui-btn-help) 0 0 / 32px 32px no-repeat; image-rendering: pixelated; flex: none; }
body #chatlog .tabs .min { width: 32px; height: 32px; padding: 0; margin: -10px -2px 0 auto; border: none; border-radius: 0; background: var(--jui-btn-blank) 0 0 / 32px 32px no-repeat; image-rendering: pixelated;
  font: 700 16px/30px var(--f-ui); text-align: center; color: #fff1dc; text-shadow: 1px 1px 0 #000; }
body #chatlog .tabs .min.new { color: transparent; text-shadow: none; background-image: var(--jui-btn-excl); }
body #chatlog .tabs .min:hover { background-color: transparent; filter: brightness(1.25); }
body #dialogue .dw::before { content: ''; position: absolute; left: 50%; top: -15px; width: 120px; height: 49px; margin-left: -60px; background: var(--jui-clasp) 0 0 / 120px 49px no-repeat; image-rendering: pixelated; pointer-events: none; z-index: 2; }
`;
let styled = false;
export function installPieces() {
  if (styled) return; styled = true;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const bar = document.querySelector('#lachryma .bar');
  if (bar && !bar.querySelector('.glass')) { const g = document.createElement('div'); g.className = 'glass'; while (bar.firstChild) g.appendChild(bar.firstChild); bar.appendChild(g); }
}
