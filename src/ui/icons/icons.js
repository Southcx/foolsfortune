// ---------------------------------------------------------------------------------------
// THE UI ICONS: every picture a choice card shows (ui/choicecard.js) and a keyword carries (ui/keywords.js), painted from the icons'
// hand (ui/icons/hand.js) into a canvas at 1x, recoloured to a palette, and shown scaled by a WHOLE number of device pixels, never
// resampled (the pixel kit's rule, ui/pixel.js). One drawing, many palettes: GOLD is the icons' own (the window's accent: a keyword is
// gold wherever it stands), GREY a card not yet opened, BETTER and WORSE a compared number's arrow (green and red, and solid against
// hollow so the colour is never alone), LINE the sea chart's pale labradorite.
//
// The ids: 'kw.<keyword>' (ui/icons/keywordart.js, the twelve of CLARITY.md section 5), 'mount.<tool>' (ui/icons/mountart.js, the seven at
// sea), 'chip.<stat>' (ui/icons/chipart.js: range, angle, energy, charges, cooldown, duration; and lock, check, up, down, upHollow,
// downHollow), and the Figment attack telegraphs' glyphs: 'answer.<id>', 'status.<id>', 'figmentMark.<id>'
// (ui/icons/figmenttelegraphart.js, which the world draws from its own atlas: vfx/figmenttelegraph/figmenttelegraphatlas.js).
//
// Prior art: the 8- and 16-bit consoles' palette swaps (one sprite, a palette for each state: Final Fantasy's recoloured windows and
// enemies), and the pixel kit's integer scaling here (a pixel is always a square of pixels).
//
//   uiIcon(id, pal = 'gold') -> canvas (1x, cached)        hasIcon(id)        ICON_IDS
//   iconEl(id, { pal, px = 2, title }) -> <canvas>          px: CSS pixels an art pixel (whole), drawn crisp at the screen's ratio
//   ICON_PALS                                              the palettes by name (twelve [r, g, b] each)
// ---------------------------------------------------------------------------------------
import { PAL } from '../pixel.js';
import { ramp } from '../seachart/icons.js';
import { toneGrid } from './hand.js';
import { KEYWORD_ART } from './keywordart.js';
import { MOUNT_ART } from './mountart.js';
import { CHIP_ART } from './chipart.js';
import { ANSWER_ART, STATUS_ART, FIGMENT_MARK_ART } from './figmenttelegraphart.js';

const ART = {};
for (const [pre, set] of [['kw', KEYWORD_ART], ['mount', MOUNT_ART], ['chip', CHIP_ART], ['answer', ANSWER_ART], ['status', STATUS_ART], ['figmentMark', FIGMENT_MARK_ART]]) for (const [k, rows] of Object.entries(set)) ART[`${pre}.${k}`] = rows;
export const ICON_IDS = Object.keys(ART);
export const hasIcon = (id) => id in ART;

const css2rgb = (c) => (c.startsWith('#') ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).map(Number));
export const ICON_PALS = {
  ...Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(css2rgb)])),
  better: ramp(0x62d36e), worse: ramp(0xe0584e), line: ramp(0xb6a8d8),
};

const CACHE = new Map(), GRIDS = new Map();
/** An icon at 1x in a palette (a 1 x 1 blank for an id it does not know). */
export function uiIcon(id, pal = 'gold') {
  const key = `${id}|${pal}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas');
  if (!ART[id]) { c.width = c.height = 1; return c; }
  if (!GRIDS.has(id)) GRIDS.set(id, toneGrid(ART[id]));
  const { w, h, tones } = GRIDS.get(id), L = ICON_PALS[pal] || ICON_PALS.gold;
  c.width = w; c.height = h;
  const g = c.getContext('2d'), d = g.createImageData(w, h);
  for (let i = 0; i < tones.length; i++) {
    const t = tones[i]; if (t < 0) continue;
    const [r, gg, b] = L[t]; d.data[i * 4] = r; d.data[i * 4 + 1] = gg; d.data[i * 4 + 2] = b; d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  CACHE.set(key, c);
  return c;
}

/** An icon as an element: `px` CSS pixels an art pixel, drawn at a whole number of device pixels (so it is crisp at any ratio). */
export function iconEl(id, { pal = 'gold', px = 2, title = '' } = {}) {
  const src = uiIcon(id, pal), dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1, s = Math.max(1, Math.round(px * dpr));
  const c = document.createElement('canvas');
  c.className = 'uicon'; c.width = src.width * s; c.height = src.height * s;
  c.style.width = `${c.width / dpr}px`; c.style.height = `${c.height / dpr}px`;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  if (title) { c.title = title; c.setAttribute('aria-label', title); c.setAttribute('role', 'img'); } else c.setAttribute('aria-hidden', 'true');
  return c;
}
