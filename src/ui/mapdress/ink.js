// ---------------------------------------------------------------------------------------
// THE MAP'S DRESS: ITS INKS (docs/plans/art/map-board-v1.md; the owner's ruling, 2026-10-25: the island level is board v1's B1, an
// area's page is B2's hand). What the island level and an area's page both draw with: the washi's and the sumi's colours, the glaze
// read from the window colour, the gold, the faces, the ground's silhouettes as small paths, a stable hash for a brush's wobble, and
// the paper's fibres as one small pattern (made once a map's opening, let go on close). 2D canvas only: 0 shader programs.
//
// Prior art: Okami's scroll map (sumi on washi, the paper as the world), Japanese ink-wash (sumi-e: a wash's pooled edge, the dry
// brush's hatch), Hollow Knight's Cornifer sketches (the map as a hand's record), the house's Clay dress (ui/goalswindow.js clayDress).
//
//   INK, GOLD, FILM, FACE                       the colours and faces
//   glaze() -> { top, bot }                     the window colour as 'r,g,b' strings (ui/theme.js THEMES, its --jtop / --jbot)
//   silhouette(key | 'M..' path) -> Path2D      a ground's silhouette in a 24 x 24 box (SILHOUETTES' keys, or an SVG path)
//   hash(str | n, salt) -> 0..1                 stable, for a brush's wobble and the gold flecks
//   paperPattern(ctx) -> CanvasPattern          the washi's fibres (cached; disposePaper() lets it go)
// ---------------------------------------------------------------------------------------
import { FONT } from '../theme.js';
import { FILM, GOLD } from '../brineframe.js';

export { FILM, GOLD };

/** The washi and the sumi (board v1, panel C), the bisque of a place not yet been to, and the seal's vermilion. */
export const INK = {
  paper: '#ece0c4', paperShade: '#d9c7a3', paperEdge: '#b89c74',
  sumi: '#2a1810', sepia: '132,82,44', deep: '78,44,22', hatch: 'rgba(70,42,22,.34)',
  lip: 'rgba(255,240,212,.55)', fleck: '#e0b04a', kintsugi: '#e7b94c',
  bisque: '#d6bf9c', bisqueDark: '#b49a76', crack: 'rgba(92,62,38,.75)',
  vermilion: '#c23a22', you: '#b8321e', thread: 'rgba(176,122,30,.9)',
  salt: '#efe6d2', panel: '#2a140c', panelLight: '#4a2618',
};

export const FACE = {
  name: FONT.title, // (Cinzel: names)
  count: `'Jersey 15', ${FONT.sys}`, // (the counts face, OVERLAY.md 10.2)
  lore: FONT.lore, // (IM Fell: a way's name)
  ui: FONT.ui,
};

/** The window colour as 'r,g,b' strings, read from the page (ui/theme.js sets --jtop and --jbot on the root); kiln's if unset. */
export function glaze() {
  let top = '', bot = '';
  try { const s = getComputedStyle(document.documentElement); top = s.getPropertyValue('--jtop').trim(); bot = s.getPropertyValue('--jbot').trim(); } catch { /* no page: kiln */ }
  return { top: top || '104,50,32', bot: bot || '34,15,9' };
}
/** 'r,g,b' lightened (k > 0) or darkened (k < 0), as an rgba() with alpha a. */
export function tone(rgb, k = 0, a = 1) {
  const c = rgb.split(',').map(Number).map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/** A ground's silhouette in a 24 x 24 box, pressed into a tile (board v1, B1). A key, or an SVG path of its own. */
export const SILHOUETTES = {
  generic: 'M2 20 Q7 8 12 12 Q17 6 22 20 Z',
  dunes: 'M1 19 Q6 10 11 15 Q15 8 23 16 V20 H1 Z',
  weir: 'M3 16 Q12 10 21 16 Q12 22 3 16 Z M11.2 14 L12 5 L12.8 14 Z M12 5 Q7 3 5 8 Q8 5.5 12 6 Z M12 5 Q17 3 19 8 Q16 5.5 12 6 Z',
  shore: 'M1 16 Q5 12 9 16 T17 16 T23 16 V20 H1 Z M13 9 H23 V11 H13 Z M15 11 H16 V15 H15 Z M20 11 H21 V15 H20 Z',
  ridges: 'M12 2 L16 9 L13 20 H11 L8 9 Z M5 11 L8 20 H3 Z M19 11 L21 20 H16 Z',
  gnomon: 'M11 2 H13 L14.5 19 H9.5 Z M2 21 Q12 16 22 21 Z',
  ruins: 'M4 20 V9 Q12 1 20 9 V20 H16 V11 Q12 6 8 11 V20 Z',
  well: 'M2 13 Q12 5 22 13 Q12 21 2 13 Z M7 13 Q12 9 17 13 Q12 17 7 13 Z',
  workshop: 'M8 3 H16 L15 7 Q21 11 18.5 17 L17 21 H7 L5.5 17 Q3 11 9 7 Z',
  basement: 'M2 21 V17 H6 V13 H10 V9 H14 V5 H22 V21 Z',
  raceway: 'M3 12 Q3 4 12 4 Q21 4 21 12 Q21 20 12 20 Q3 20 3 12 Z M8 12 Q8 8.5 12 8.5 Q16 8.5 16 12 Q16 15.5 12 15.5 Q8 15.5 8 12 Z',
  bazaar: 'M3 21 V14 Q3 5 12 5 Q21 5 21 14 V21 Z M11 1 H13 V5 H11 Z',
  dock: 'M10 21 L11 7 H13 L14 21 Z M8.5 4 H15.5 V7 H8.5 Z M1 21 Q12 17 23 21 Z',
  sea: 'M1 9 Q4 6 7 9 T13 9 T19 9 T23 9 V12 Q20 9 17 12 T11 12 T5 12 T1 12 Z M1 16 Q4 13 7 16 T13 16 T19 16 T23 16 V19 Q20 16 17 19 T11 19 T5 19 T1 19 Z',
  garden: 'M12 21 V12 M12 12 Q5 12 5 5 Q12 5 12 12 Z M12 14 Q19 14 19 7 Q12 7 12 14 Z M11 12 H13 V21 H11 Z',
};
const paths = new Map();
/** A silhouette as a Path2D (cached), from a key or an SVG path's own text. */
export function silhouette(s) {
  const key = s && (SILHOUETTES[s] || (/^[Mm]/.test(s) ? s : null)) || SILHOUETTES.generic;
  let p = paths.get(key);
  if (!p && typeof Path2D === 'function') { p = new Path2D(key); paths.set(key, p); }
  return p;
}

/** A stable 0..1 from a string or numbers (FNV-1a, then a mix). */
export function hash(a, salt = 0) {
  let h = 2166136261 ^ salt;
  const s = String(a);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

let paper = null;
/** The washi's fibres: a 192 px tile of long pale fibres and a few dark flecks, as a repeating pattern (made once). */
export function paperPattern(ctx) {
  if (paper?.pattern) return paper.pattern;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = c.height = 192;
  const g = c.getContext('2d');
  g.fillStyle = INK.paper; g.fillRect(0, 0, 192, 192);
  for (let i = 0; i < 260; i++) { // (the fibres: kozo's long threads)
    const x = hash(i, 1) * 192, y = hash(i, 2) * 192, a = hash(i, 3) * Math.PI, l = 6 + hash(i, 4) * 22;
    g.strokeStyle = hash(i, 5) < 0.5 ? 'rgba(255,250,236,.55)' : 'rgba(150,118,80,.16)'; g.lineWidth = 0.6 + hash(i, 6) * 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(90,60,34,.25)'; g.fillRect(hash(i, 7) * 192, hash(i, 8) * 192, 1, 1); }
  paper = { canvas: c, pattern: ctx.createPattern(c, 'repeat') };
  return paper.pattern;
}
/** The paper's tile let go (the map closed). */
export function disposePaper() { if (paper) { paper.canvas.width = paper.canvas.height = 0; paper = null; } }

/** Words wrapped to lines no wider than `w` at the context's font. */
export function wrap(ctx, text, w, max = 3) {
  const words = String(text).split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    const t = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(t).width > w) { lines.push(line); line = word; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, max);
}
