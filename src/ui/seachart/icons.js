// ---------------------------------------------------------------------------------------
// THE SEA CHART'S ICONS: the pixel art the sea chart is drawn with (ui/seachart/seachart.js) and a rutter's page repeats in ink
// (vfx/rutter.js). Drawn the maker's way (ui/pixel.js): at 1x, on the twelve-grey ramp (here as the characters 0..9, a, b: 0 the
// darkest grey, b the lightest; '.' is nothing), recoloured to a palette of twelve, and only then scaled by a whole number.
//
// A WAYPOINT ICON is two things: its SILHOUETTE, the shape of its class (a diamond for a threat, a ring for a haven, a radiant star for a
// boss: three sizes as well as three shapes, so the class reads in greyscale and at a glance); and its EMBLEM, the picture of its type
// inside (the shoal three glints in a school, the Wreckers their brig with the false light at the
// masthead, the eyewall a bolt, the graveyard two masts standing out of the crude like grave crosses, the maelstrom a spiral, Old
// Nobody the flukes, a bounty the hunter's sight, a calm a half sun over level water, an encounter a hanging lantern). The islands have
// their own: Anagami a bottle kiln and the Gnomon over the dunes, Margarite the lighthouse on the whale's back, Entropolis tilted towers
// under a dark moon (docs/LORE.md, section 1). Then the storm mark's flame (black, its core labradorite, in two leans for its sway), the
// sloop's mark, a strength pip, the dim star of a waypoint seen with no confidence, and the five letters the rank's chop on a rutter's
// page can carry. Every icon is drawn in THE LINE HAND (a pale labradorite: Calissa's rule, the danger in line and glow), never in a
// feeling's colour: a feeling filled into a shape would read as certain and carry two facts in one channel, so the sea chart shows it
// round the icon instead (its nimbus: ui/seachart/nimbus.js).
//
// UNCERTAIN IS OUT OF FOCUS: `blurred()` takes an icon already scaled to the screen and defocuses it (a gaussian on premultiplied
// colour, casebook rule 22, so an edge fades toward its colour and never to black), so a portent's candidates are never crisp while
// the silhouette of a known class is. Every canvas is cached by what made it.
//
// Prior art: Slay the Spire's map icons (one picture a room type, read at a glance, a silhouette before a detail), Into the Breach's
// telegraphs (shown information true and plain), the 8- and 16-bit consoles' palette swaps the pixel kit follows, and the hurricane
// cone's lesson (no crisp edge where knowledge ends) that PASSAGE.md section 4 asks for.
//
//   waypointIcon(type, look?) -> 1x canvas   silhouetteIcon(cls, look?)   emblemIcon(type, look?)   islandIcon(island, look?)
//   markIcon('flame' | 'flameB' | 'ship' | 'pip' | 'star' | 'S' .. 'D', look?, pal?)   ringIcon(r, pal)   classOfType(type) -> 'threat' | 'haven' | 'boss'
//   scaled(canvas, s) -> canvas (whole-number, nearest)   blurred(canvas, s, r) -> { canvas, pad } (r in screen pixels)
//   ramp(hex) -> twelve colours   EMBLEMS (type -> { cls })   ISLANDS (id -> its palette)   look: 'crude' (the line hand) | 'ink' (a rutter's page)
// ---------------------------------------------------------------------------------------
import { GREYS, PAL } from '../pixel.js';

// ---- the emblems (11 wide; drawn on the ramp, the light from the top left)
const ART = {
  shoal: [
    '......7.ab.',
    '.......bbba',
    '......7.ab.',
    '7.ab.......',
    '.bbba......',
    '7.ab.......',
    '.....7.ab..',
    '......bbba.',
    '.....7.ab..',
  ],
  wreckers: [
    '..b........',
    '.aba...9...',
    '..9....9...',
    '.999..999..',
    '.9a9..9a9..',
    '.999..999..',
    '..9....9...',
    'a999999999a',
    '.99999999b.',
    '..6666666..',
  ],
  eyewall: [
    '......bbbb.',
    '.....bbba..',
    '....bbba...',
    '...bbba....',
    '..bbbbbbbb.',
    '.....bbba..',
    '....bbba...',
    '...bba.....',
    '..ba.......',
    '..a........',
  ],
  graveyard: [
    '..b........',
    '..b......9.',
    'bbbbb....9.',
    '..b.....999',
    '..b......9.',
    '..b......9.',
    '..a......8.',
    '..99....99.',
    '.9..9..9..9',
    '9....99....',
  ],
  maelstrom: [
    '...9bbbb...',
    '..b....ab..',
    '.b..aaa..b.',
    'b..a...a..b',
    'b.a..b..a.b',
    'b.a.b.b.a.b',
    'b.a..ba.a.9',
    '9..a....a..',
    '.9..aaaa..9',
    '..9......9.',
    '...99999...',
  ],
  leviathan: [
    'b.........b',
    'ab.......ba',
    '.bbb...bbb.',
    '..abbbbba..',
    '....bbb....',
    '.....b.....',
    '.....b.....',
    '..99.a.99..',
    '.9..9.9..9.',
  ],
  bounty: [
    '.....b.....',
    '...bbbbb...',
    '..b..b..b..',
    '.b.......b.',
    '.b.......b.',
    'bbbb.a.bbbb',
    '.b.......b.',
    '.b.......b.',
    '..b..b..b..',
    '...bbbbb...',
    '.....b.....',
  ],
  calm: [
    '....aba....',
    '...abbba...',
    '..abbbbba..',
    '..bbbbbbb..',
    'bbbbbbbbbbb',
    '...........',
    '.999999999.',
    '...........',
    '..8888888..',
  ],
  encounter: [
    '.....9.....',
    '....9.9....',
    '.....9.....',
    '....999....',
    '...99999...',
    '...9.b.9...',
    '...9bab9...',
    '...9aba9...',
    '...99999...',
    '....999....',
  ],
};

/** Each type's class (PASSAGE.types in progress/econ/passage.js, Dovina's: kept in step; the pier may pass its own `classOf`). */
export const EMBLEMS = {
  shoal: { cls: 'threat' }, wreckers: { cls: 'threat' }, eyewall: { cls: 'threat' }, graveyard: { cls: 'threat' },
  calm: { cls: 'haven' }, encounter: { cls: 'haven' },
  maelstrom: { cls: 'boss' }, bounty: { cls: 'boss' }, leviathan: { cls: 'boss' },
};
export const classOfType = (type) => EMBLEMS[type]?.cls || 'threat';

// ---- the islands (26 wide) and the marks
const ISLAND_ART = {
  anagami: [ // (the bottle kiln of the workshop and the Gnomon's spire over the dunes)
    '...............b..........',
    '...............b..........',
    '........9......a..........',
    '.......9a9.....a..........',
    '.......9a8.....a..........',
    '......99a88....9..........',
    '.....99aa888...9..........',
    '....99aa98888..9..........',
    '....9aa998888..9..........',
    '....9a9998888..8.....77...',
    '...99a99988888.8...777777.',
    '..999a99988888889977777777',
    '.9999999998888888999999999.',
    '99999999999888899999999999',
    '.6666666666666666666666666',
    '...66666666666666666666...',
  ],
  margarite: [ // (the lighthouse on the back of the whale, its lantern an hourglass with a flame)
    '...........b..............',
    '..........aba.............',
    '.........b.b.b............',
    '..........aba.............',
    '..........888.............',
    '..........8b8.............',
    '..........888.............',
    '.........88888............',
    '.........8b8b8............',
    '.....99999999999..........',
    '...9999999999999999.......',
    '..999999999999999999...99.',
    '.9a999999999999999999999a.',
    '999999999999999999999999..',
    '.66666666666666666666666..',
    '...6666666666666666666....',
  ],
  entra: [ // (Entropolis: tilted towers, a dark moon blindfolded)
    '...................aaaa...',
    '..................a8888a..',
    '..9...............a8bb8a..',
    '..99.......9......a8888a..',
    '..999......99......aaaa...',
    '...999....999....9........',
    '...9a99...9a9...99........',
    '....9a99.99a9..9a9........',
    '....9a9999a99.99a9...9....',
    '.....99a99a999a999..99....',
    '.....999a9a99a9999.9a9....',
    '....99999999999999999a9...',
    '..999999999999999999999999',
    '.99999999999999999999999..',
    '.66666666666666666666666..',
    '...66666666666666666666...',
  ],
  open: [ // (an island not yet named: a mound)
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........9999............',
    '........99aa9999..........',
    '......99aa99999999........',
    '....999a99999999999999....',
    '..999a99999999999999999...',
    '.99999999999999999999999..',
    '.66666666666666666666666..',
    '...66666666666666666666...',
  ],
};
/** Each island's palette (the pixel kit's, or a ramp of the island's own colour). */
export const ISLANDS = { anagami: 'clay', margarite: 'pearl', entra: 'neon', open: 'line' };

const MARK_ART = {
  flame: [ // (the storm mark: Slay the Spire's burning elite, black with a labradorite core; flameB is its mirror, the other way of its sway)
    '...1.....',
    '..1a1....',
    '..1b1....',
    '.1aba1...',
    '.1a9a1.1.',
    '1a989a1a1',
    '1a8778a91',
    '1a87678a1',
    '1a87778a1',
    '.1a888a1.',
    '..11111..',
  ],
  ship: [ // (the sloop, the flying submarine: where the Courier is on the sea chart)
    '.....99......',
    '....9bb9.....',
    '.abbbbbbbbb..',
    'abbbbbbbbbbba',
    '.6666666666..',
  ],
  pip: ['ab', 'b9'],
  star: ['..7..', '..a..', '7aba7', '..a..', '..7..'],
  S: ['.bbbbb.', 'bb...bb', 'bb.....', '.bbbb..', '...bbb.', '.....bb', 'bb...bb', '.bbbbb.'],
  A: ['..bbb..', '.bb.bb.', 'bb...bb', 'bb...bb', 'bbbbbbb', 'bb...bb', 'bb...bb', 'bb...bb'],
  B: ['bbbbbb.', 'bb...bb', 'bb...bb', 'bbbbbb.', 'bb...bb', 'bb...bb', 'bb...bb', 'bbbbbb.'],
  C: ['.bbbbb.', 'bb...bb', 'bb.....', 'bb.....', 'bb.....', 'bb.....', 'bb...bb', '.bbbbb.'],
  D: ['bbbbb..', 'bb..bb.', 'bb...bb', 'bb...bb', 'bb...bb', 'bb...bb', 'bb..bb.', 'bbbbb..'],
};

// ---- the palettes: the kit's three and grey, a ramp from any colour, the feelings' ramps, the ink
const hex2rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
const css2rgb = (c) => (c.startsWith('#') ? hex2rgb(parseInt(c.slice(1), 16)) : c.match(/\d+/g).map(Number));
/** Twelve colours from one, along the ramp's own greys: the shadows cooler and the lights warmer, as a pixel artist's ramp leans. */
export function ramp(hex) {
  const [r, g, b] = hex2rgb(hex), lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 || 0.01;
  return GREYS.map((grey) => {
    const t = grey / 255;
    if (t <= lum) { const k = t / lum, cool = (1 - k) * 0.35; return [r * k * (1 - cool * 0.5), g * k * (1 - cool * 0.3), Math.min(255, b * k + 40 * cool * k + 10 * cool)].map(Math.round); }
    const k = (t - lum) / (1 - lum); return [r + (255 - r) * k, g + (250 - g) * k, b + (236 - b) * k].map(Math.round);
  });
}
const RAMPS = {
  ...Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(css2rgb)])),
  line: ramp(0xb6a8d8), // (the line hand: a pale labradorite, every icon's)
  labradorite: [[5, 4, 9], [11, 10, 20], [20, 18, 38], [29, 27, 58], [36, 48, 90], [31, 74, 102], [42, 106, 120], [63, 138, 138], [106, 122, 208], [154, 138, 230], [216, 200, 255], [255, 240, 200]], // (the Mind's black iridescence: the storm's flame)
  pearl: ramp(0xf2e2c8), neon: ramp(0xd25ae6),
  // the ink of a rutter's page: the dark of the ramp is the vellum showing through, the rest iron-gall ink
  ink: [null, null, null, null, [176, 150, 112], [150, 122, 88], [122, 94, 66], [96, 70, 48], [74, 52, 34], [58, 40, 26], [44, 30, 20], [32, 22, 15]],
};

const CACHE = new Map();
const IDX = (ch) => (ch === '.' ? -1 : ch >= '0' && ch <= '9' ? ch.charCodeAt(0) - 48 : ch === 'a' ? 10 : ch === 'b' ? 11 : -1);

/** A grid of ramp steps (an array of strings, or a function of x, y) recoloured at 1x into a canvas. */
function paint(rows, w, h, pal, key) {
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), d = g.createImageData(w, h), L = RAMPS[pal] || RAMPS.line;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = typeof rows === 'function' ? rows(x, y) : IDX(rows[y]?.[x] ?? '.');
    if (k < 0 || !L[k]) continue;
    const o = (y * w + x) * 4, [r, gg, b] = L[k]; d.data[o] = r; d.data[o + 1] = gg; d.data[o + 2] = b; d.data[o + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  if (CACHE.size > 900) CACHE.clear();
  CACHE.set(key, c);
  return c;
}
const W = (rows) => Math.max(...rows.map((r) => r.length));

// ---- the silhouettes, drawn by rule at 1x (a diamond, a ring, a radiant star), lit from the top left
const SIL = {
  threat: { size: 23, inside: (x, y) => Math.abs(x) + Math.abs(y) <= 11 },
  haven: { size: 19, inside: (x, y) => Math.hypot(x, y) <= 9.3 },
  boss: {
    size: 25,
    inside: (x, y) => {
      const r = Math.hypot(x, y), u = Math.atan2(y, x) / (Math.PI / 4), k = Math.round(u), d = Math.abs(u - k); // (d: 0 on a spike's axis, 0.5 between two)
      const card = ((k % 2) + 2) % 2 === 0, len = card ? 3.4 : 2.2, width = card ? 0.42 : 0.34; // (the four long spikes at the compass points, the four short between)
      return r <= 8.4 || r <= 8.4 + len * Math.max(0, 1 - d / width);
    },
  },
};
function silhouetteRows(cls) {
  const S = SIL[cls] || SIL.threat, n = S.size, h = (n - 1) / 2;
  const inside = (x, y) => x >= 0 && y >= 0 && x < n && y < n && S.inside(x - h, y - h);
  return (x, y) => {
    if (!inside(x, y)) return -1;
    let ring = 9; for (let k = 1; k <= 2; k++) if (!inside(x - k, y) || !inside(x + k, y) || !inside(x, y - k) || !inside(x, y + k)) { ring = k; break; }
    const lit = x - h + (y - h) < 0;
    if (ring === 1) return lit ? 11 : 8; // (the rim: bright where the light falls, a step down where it does not)
    if (ring === 2) return lit ? 6 : 4;
    return y - h < -2 ? 2 : 1; // (the inside: dark, a step lighter toward the top)
  };
}
export const SILHOUETTE_SIZE = { threat: SIL.threat.size, haven: SIL.haven.size, boss: SIL.boss.size };

// ---- the pieces
/** A class's silhouette alone (its inside dark). */
export function silhouetteIcon(cls, look = 'crude') {
  const pal = look === 'ink' ? 'ink' : 'line', n = (SIL[cls] || SIL.threat).size;
  return paint(silhouetteRows(cls), n, n, pal, `sil|${cls}|${pal}`);
}
/** A type's emblem alone (for candidates that share their silhouette). */
export function emblemIcon(type, look = 'crude') {
  const rows = ART[type] || ART.shoal, pal = look === 'ink' ? 'ink' : 'line';
  return paint(rows, W(rows), rows.length, pal, `emb|${type}|${pal}`);
}
/** A whole waypoint icon: its class's silhouette with its type's emblem centred inside. */
export function waypointIcon(type, look = 'crude') {
  const key = `wp|${type}|${look}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const sil = silhouetteIcon(classOfType(type), look), emb = emblemIcon(type, look);
  const c = document.createElement('canvas'); c.width = sil.width; c.height = sil.height;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(sil, 0, 0); g.drawImage(emb, Math.floor((sil.width - emb.width) / 2), Math.floor((sil.height - emb.height) / 2) + (emb.height % 2 ? 0 : 1));
  CACHE.set(key, c);
  return c;
}
/** An island's icon (an unknown id gets the plain mound). */
export function islandIcon(island, look = 'crude') {
  const id = ISLAND_ART[island] ? island : 'open', rows = ISLAND_ART[id], pal = look === 'ink' ? 'ink' : ISLANDS[id];
  return paint(rows, W(rows), rows.length, pal, `isl|${id}|${pal}`);
}
/** A mark: the storm's flame (and flameB, its mirror), the sloop, a strength pip, the dim star, a rank's letter. */
export function markIcon(name, look = 'crude', pal = null) {
  const mirror = name === 'flameB', rows0 = MARK_ART[mirror ? 'flame' : name] || MARK_ART.star, rows = mirror ? rows0.map((r) => [...r.padEnd(W(rows0), '.')].reverse().join('')) : rows0;
  const p = pal || (look === 'ink' ? 'ink' : name.startsWith('flame') ? 'labradorite' : name === 'ship' ? 'pearl' : name === 'star' ? 'line' : 'gold');
  return paint(rows, W(rows), rows.length, p, `mark|${name}|${p}`);
}

/** A ring of one pixel, `r` art pixels out (the hover's mark round a waypoint). */
export function ringIcon(r = 14, pal = 'gold') {
  const n = r * 2 + 3, h = (n - 1) / 2;
  return paint((x, y) => { const d = Math.hypot(x - h, y - h); return Math.abs(d - r) < 0.5 ? (x + y < n - 1 ? 11 : 9) : -1; }, n, n, pal, `ring|${r}|${pal}`);
}

/** A 1x canvas scaled by a whole number, nearest (the kit's rule: a pixel is always a square of pixels). */
export function scaled(src, s) {
  const key = src; let m = CACHE.get(key); if (!(m instanceof Map)) { m = new Map(); CACHE.set(key, m); }
  if (m.has(s)) return m.get(s);
  const c = document.createElement('canvas'); c.width = src.width * s; c.height = src.height * s;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  m.set(s, c);
  return c;
}

/** An icon scaled by `s` and out of focus by `r` screen pixels (a gaussian of that sigma on premultiplied colour), padded so the blur
 *  is not cut: { canvas, pad }. `r` is kept to quarter pixels so the cache stays small. */
export function blurred(src, s, r) {
  const q = Math.max(0, Math.round(r * 4) / 4), key = `blur|${s}|${q}`;
  let m = CACHE.get(src); if (!(m instanceof Map)) { m = new Map(); CACHE.set(src, m); }
  if (m.has(key)) return m.get(key);
  const big = scaled(src, s), pad = Math.ceil(q * 3) + 1, w = big.width + pad * 2, h = big.height + pad * 2;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(big, pad, pad);
  if (q > 0) {
    const d = g.getImageData(0, 0, w, h), a = d.data, n = w * h, buf = new Float32Array(n * 4), tmp = new Float32Array(n * 4);
    const grow = Math.floor(q / 2); // (the strokes thickened first, by a pixel for every two of blur: a one-pixel line out of focus keeps its weight instead of fading to nothing)
    if (grow > 0) {
      const src0 = new Uint8ClampedArray(a);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let best = -1, ba = 0;
        for (let j = -grow; j <= grow; j++) for (let i = -grow; i <= grow; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const o = (yy * w + xx) * 4; if (src0[o + 3] > ba || (src0[o + 3] === ba && ba && src0[o] + src0[o + 1] + src0[o + 2] > src0[best] + src0[best + 1] + src0[best + 2])) { ba = src0[o + 3]; best = o; } }
        const o = (y * w + x) * 4; if (best >= 0) { a[o] = src0[best]; a[o + 1] = src0[best + 1]; a[o + 2] = src0[best + 2]; a[o + 3] = src0[best + 3]; }
      }
    }
    for (let i = 0; i < n; i++) { const al = a[i * 4 + 3] / 255; buf[i * 4] = a[i * 4] * al; buf[i * 4 + 1] = a[i * 4 + 1] * al; buf[i * 4 + 2] = a[i * 4 + 2] * al; buf[i * 4 + 3] = al; }
    const R = Math.ceil(q * 3), K = []; let sum = 0;
    for (let k = -R; k <= R; k++) { const v = Math.exp(-(k * k) / (2 * q * q)); K.push(v); sum += v; }
    for (let k = 0; k < K.length; k++) K[k] /= sum;
    const pass = (from, to, dx, dy) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let r0 = 0, g0 = 0, b0 = 0, a0 = 0;
        for (let k = -R; k <= R; k++) {
          const xx = x + k * dx, yy = y + k * dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const o = (yy * w + xx) * 4, wt = K[k + R]; r0 += from[o] * wt; g0 += from[o + 1] * wt; b0 += from[o + 2] * wt; a0 += from[o + 3] * wt;
        }
        const o = (y * w + x) * 4; to[o] = r0; to[o + 1] = g0; to[o + 2] = b0; to[o + 3] = a0;
      }
    };
    pass(buf, tmp, 1, 0); pass(tmp, buf, 0, 1);
    for (let i = 0; i < n; i++) { const al = buf[i * 4 + 3]; a[i * 4 + 3] = Math.round(al * 255); if (al > 1e-4) { a[i * 4] = buf[i * 4] / al; a[i * 4 + 1] = buf[i * 4 + 1] / al; a[i * 4 + 2] = buf[i * 4 + 2] / al; } }
    g.putImageData(d, 0, 0);
  }
  const out = { canvas: c, pad };
  m.set(key, out);
  return out;
}
