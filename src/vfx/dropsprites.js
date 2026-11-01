// ---------------------------------------------------------------------------------------
// THE DROP SPRITES (South, 2026-11-01: "placeholder graphics for item drops ... a 2d billboard sprite ... the generic version of the
// broader item category. 48x48 sprite icons"; Dovina's list, progress/creaturedrops.js DROP_CATEGORIES). One sprite a broader kind of
// thing, the generic of the kind: a heartfruit for a provision, an origami crane for an artwork, a mint sprig for the cool taste, a
// brass key for a Possibilikey. Placeholders: the real art is the maker's.
//
// Drawn the way the house draws its icons (ui/icons/hand.js): each sprite is a few flat shapes laid on a 24 x 24 grid in its own few
// colours, then the hand's rules: every coloured pixel bevelled from the top left (the edge facing the light a step lighter, the edge
// away a step darker), and a keyline of one dark pixel round the whole, so a drop reads on sand, clay, water or night alike. The grid
// is drawn at 2x into a 48 x 48 canvas (a whole number, never resampled: ui/pixel.js's law), nearest-filtered in the world.
//
// Prior art: Stardew Valley's and Terraria's item drops (a 16- or 24-pixel thing keylined dark, bobbing on the ground), Old School
// RuneScape's ground items, Kingdom Hearts' prizes bursting out of a Heartless; the icons' hand (ui/icons/hand.js) for the bevel and
// the keyline.
//
//   installDropSprites(game) -> game.dropSprites   .texture(cat) -> THREE.Texture | null (cached; null for a kind not drawn)
//   .canvas(cat) -> the 48 x 48 canvas (the Codex or a window may show it)   DROP_SPRITES (the kinds drawn)   DROP_SPRITE (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The art's grid, the whole number it is drawn at, and the keyline's colour. */
export const DROP_SPRITE = { grid: 24, scale: 2, keyline: '#1a1410', light: 0.22, shade: 0.24 };

// ---------------------------------------------------------------- a tiny raster: colour indices on the grid
const N = DROP_SPRITE.grid;
class Raster {
  constructor() { this.c = new Array(N * N).fill(null); }
  set(x, y, col) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < N && y < N) this.c[y * N + x] = col; }
  get(x, y) { return x >= 0 && y >= 0 && x < N && y < N ? this.c[y * N + x] : null; }
  /** Every cell whose middle passes `inside(px, py)`. */
  fill(inside, col) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inside(x + 0.5, y + 0.5)) this.set(x, y, col); return this; }
  disc(cx, cy, r, col) { return this.fill((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r, col); }
  ell(cx, cy, rx, ry, col, rot = 0) {
    const c = Math.cos(rot), s = Math.sin(rot);
    return this.fill((x, y) => { const dx = x - cx, dy = y - cy, u = dx * c + dy * s, v = -dx * s + dy * c; return (u / rx) ** 2 + (v / ry) ** 2 <= 1; }, col);
  }
  ring(cx, cy, r0, r1, col) { return this.fill((x, y) => { const d = Math.hypot(x - cx, y - cy); return d >= r0 && d <= r1; }, col); }
  rect(x0, y0, x1, y1, col) { return this.fill((x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, col); }
  poly(pts, col) {
    return this.fill((x, y) => { let inn = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inn = !inn; } return inn; }, col);
  }
  line(x0, y0, x1, y1, col, w = 1) {
    const h = w / 2;
    return this.fill((x, y) => { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L)); return Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t)) <= h; }, col);
  }
  /** A thick quadratic curve from a to c bent toward b. */
  curve(a, b, c, col, w = 1) { for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t, x = u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], y = u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]; this.disc(x, y, w / 2, col); } return this; }
  dot(x, y, col) { this.set(x, y, col); return this; }
}

// ---------------------------------------------------------------- the sprites: each a few shapes in its own colours
const R = () => new Raster();
const DRAW = {
  // PROVISION: a heartfruit, its two lobes and point, a leaf on its stem
  'mat.provision': () => R()
    .disc(8.6, 11.5, 5.6, '#d8384a').disc(15.4, 11.5, 5.6, '#d8384a').poly([[3.4, 13], [20.6, 13], [12, 21.5]], '#d8384a')
    .line(12, 9, 12.5, 4.5, '#6b4424', 1.4).ell(16.2, 4.6, 3.6, 1.7, '#5fae4a', -0.45).dot(9, 9, '#ffd2c8').dot(8, 10, '#ff9a92'),
  // ARTWORK: an origami crane, its wings up, neck and tail out, the fold lines darker
  'mat.art': () => R()
    .poly([[8, 16], [14.5, 2.5], [17, 16]], '#e2d8c0').poly([[8, 16], [14.5, 2.5], [12.6, 16]], '#fbf6ea')
    .poly([[4, 17], [12, 13.6], [20, 17], [12, 20.4]], '#efe6d2').line(5.5, 17, 2.6, 7.4, '#efe6d2', 1.6).line(2.6, 7.4, 1.2, 9.6, '#efe6d2', 1.2)
    .line(18.5, 17, 22.4, 9, '#efe6d2', 1.6).line(12, 14, 12, 20, '#c4b89c', 0.7).dot(2, 7, '#c8402e'),
  // FINERY: a charm on a cord (a jade drop in a gold cap) and a dab of vermilion pigment beside it
  'mat.finery': () => R()
    .curve([3, 3], [11, 11], [20, 3], '#7a4a2a', 1.2).line(11.5, 7.6, 11.5, 10, '#d9b24a', 1.2)
    .disc(11.5, 15, 4.6, '#3fa27a').poly([[8, 13], [15, 13], [11.5, 8.5]], '#3fa27a').rect(9.5, 9.6, 13.5, 11, '#e2b84a')
    .dot(10, 13, '#a8f0cc').ell(18.6, 19.4, 3.2, 2.2, '#e0452e', 0.3).dot(18, 18, '#ff9a7a'),
  // ARCANE RELIC: a rune-cut lens in a brass rim, a glint on the glass
  'mat.arcane': () => R()
    .disc(12, 12, 9.4, '#c9973a').disc(12, 12, 6.6, '#8fd6e8')
    .line(9, 9, 15, 15, '#2f7d95', 0.9).line(15, 9, 9, 15, '#2f7d95', 0.9).ring(12, 12, 3.2, 4, '#2f7d95')
    .dot(9, 8, '#ffffff').dot(8, 9, '#ffffff').rect(10.5, 1, 13.5, 3.2, '#c9973a'),
  // EDGE: a curved claw, ivory, dark at the root
  'mat.edge': () => {
    const r = R();
    r.fill((x, y) => { const a = Math.hypot(x - 18, y - 19), b = Math.hypot(x - 21, y - 21.5); return a <= 15 && b > 11.5 && x < 19 && y < 21; }, '#efe3c4');
    r.fill((x, y) => { const a = Math.hypot(x - 18, y - 19), b = Math.hypot(x - 21, y - 21.5); return a <= 15 && b > 11.5 && x < 19 && y < 21 && y > 14 && x > 11; }, '#8a6a46');
    return r;
  },
  // MECHANISM: a little gyroscope, two brass hoops crossing round a spinning heart on an axle
  'mat.mechanism': () => {
    const r = R();
    r.line(12, 1.5, 12, 22.5, '#7a6a5a', 1.4);
    r.fill((x, y) => { const v = ((x - 12) / 9.5) ** 2 + ((y - 12) / 9.5) ** 2; return v <= 1 && v >= 0.66; }, '#d6a640');
    r.fill((x, y) => { const v = ((x - 12) / 9.5) ** 2 + ((y - 12) / 3.4) ** 2; return v <= 1 && v >= 0.45; }, '#b07a2a');
    return r.disc(12, 12, 2.6, '#e8eef2').dot(11, 11, '#ffffff');
  },
  // ELDRITCH ARTEFACT: a squat stone idol with one great eye
  'mat.eldritch': () => R()
    .ell(12, 15, 8.2, 6.6, '#6e5f86').ell(12, 8.5, 6, 5, '#6e5f86').rect(5, 19, 19, 21, '#4e4262')
    .line(4, 14, 2, 17, '#6e5f86', 2).line(20, 14, 22, 17, '#6e5f86', 2)
    .ell(12, 9, 3.8, 2.8, '#f2ecd8').disc(12, 9, 1.9, '#a548d6').dot(12, 9, '#14081e').dot(11, 8, '#ffffff'),
  // COOL: a sprig of mint
  'ing.cool': () => R()
    .line(12, 22, 12, 4, '#3f7a3a', 1.2)
    .ell(8.5, 16, 3.6, 2, '#5cc46a', 0.5).ell(15.5, 16, 3.6, 2, '#5cc46a', -0.5)
    .ell(8.8, 10.5, 3.2, 1.8, '#6ad47a', 0.6).ell(15.2, 10.5, 3.2, 1.8, '#6ad47a', -0.6).ell(12, 4.2, 1.8, 2.8, '#7ae08a'),
  // SWEET: a piece of honeycomb, amber cells in wax walls
  'ing.sweet': () => {
    const r = R(), hex = (cx, cy, s, col) => r.poly([0, 1, 2, 3, 4, 5].map((i) => [cx + s * Math.cos((i * Math.PI) / 3), cy + s * Math.sin((i * Math.PI) / 3)]), col);
    const cells = [[7, 7], [7, 15], [13.6, 11], [13.6, 19], [13.6, 3], [20, 7], [20, 15]];
    for (const [x, y] of cells) hex(x, y, 4.6, '#c98a1e');
    for (const [x, y] of cells) hex(x, y, 3, '#f5b733');
    return r.dot(6, 6, '#ffe28a').dot(13, 10, '#ffe28a').dot(19, 14, '#ffe28a');
  },
  // RICH: a pat of butter on a leaf
  'ing.rich': () => R()
    .ell(12, 15, 10.6, 5.4, '#4f9a44', -0.2).line(3, 17, 21, 13, '#3a7a34', 0.8)
    .rect(7, 8, 16, 13, '#f6dc6a').rect(7, 8, 16, 9, '#fff1a8').rect(16, 9, 17, 13, '#d9b440'),
  // HEAT: a red chilli, its green cap
  'ing.heat': () => R()
    .curve([6, 6], [7, 20], [20, 20], '#d62a1e', 4).curve([7, 7], [8, 18], [19, 19.4], '#ff6a4a', 1)
    .ell(6.2, 5.2, 3, 2, '#3e8c34', 0.6).line(5, 4.6, 3, 1.5, '#2f6e2a', 1.3),
  // BITTER: a dark serrated leaf, its midrib pale
  'ing.bitter': () => {
    const pts = [], rot = (x, y) => { const c = Math.cos(0.62), sn = Math.sin(0.62), dx = x - 12, dy = y - 12; return [12 + dx * c - dy * sn, 12 + dx * sn + dy * c]; };
    const half = (i) => { const t = i / 14; return Math.sin(Math.PI * t) * (5.4 - 1.6 * (1 - t)) + (i % 2 && i > 1 && i < 13 ? 1.2 : 0); };
    for (let i = 0; i <= 14; i++) pts.push(rot(12 + half(i), 1 + i * 1.45));
    for (let i = 14; i >= 0; i--) pts.push(rot(12 - half(i), 1 + i * 1.45));
    const r = R().poly(pts, '#2f5a32'), L = (x0, y0, x1, y1, col, w) => r.line(...rot(x0, y0), ...rot(x1, y1), col, w);
    L(12, 21, 12, 2.5, '#9ac28a', 0.8); L(12, 8, 15, 5.6, '#6f9a66', 0.6); L(12, 12, 9, 9.4, '#6f9a66', 0.6); L(12, 16, 15, 13.4, '#6f9a66', 0.6); L(12, 21, 12, 24, '#4a3424', 1.2);
    return r;
  },
  // SALT AND TEARS: an onion, its papery skin split on its white layers
  'ing.salt': () => R()
    .disc(12, 14, 8, '#b8875a').poly([[8.5, 8], [15.5, 8], [12, 2]], '#b8875a').line(12, 3, 12.6, 0.8, '#7a5a3a', 1)
    .poly([[12, 9], [17, 13], [16, 21], [11, 20]], '#f4ecdf').line(13, 11, 14.4, 19.5, '#d8cfbd', 0.6).dot(8, 11, '#e2b88a').line(9, 20, 15, 20, '#e6d6b8', 1),
  // SOUR: a stoppered cruet of vinegar
  'ing.sour': () => R()
    .ell(12, 16.5, 6.4, 5.6, '#cfe6e4').rect(10, 6, 14, 12, '#cfe6e4').ell(12, 17.5, 5, 4, '#b77a2a').rect(9.5, 2.5, 14.5, 6, '#8a5a34')
    .line(8, 14, 8, 18, '#ffffff', 0.9).rect(17.5, 12, 19, 16, '#cfe6e4'),
  // UMAMI: a folded strip of kombu
  'ing.umami': () => R()
    .poly([[2, 6], [15, 4], [17, 9], [4, 11]], '#3e5a3a').poly([[4, 11], [17, 9], [20, 15], [6, 17]], '#2c4430').poly([[6, 17], [20, 15], [22, 20], [8, 22]], '#3e5a3a')
    .dot(5, 7, '#e6efe2').dot(12, 6, '#e6efe2').dot(10, 19, '#e6efe2').line(4, 11, 17, 9, '#22341f', 0.7).line(6, 17, 20, 15, '#22341f', 0.7),
  // BODY: a small crock of miso, its lid tied
  'ing.body': () => R()
    .ell(12, 15, 8.6, 6.8, '#8a5232').rect(4, 9, 20, 12, '#8a5232').ell(12, 8.5, 8, 2.6, '#c99a64').rect(10.5, 5, 13.5, 7.5, '#6a3e26')
    .rect(3.5, 12, 20.5, 13.6, '#d8c49a').line(5, 16, 5, 19, '#b07048', 0.8),
  // SHARD: a spire of Lachrymite, one face lit
  shard: () => R()
    .poly([[12, 1], [18, 9], [16, 22], [8, 22], [6, 9]], '#7f5ad6').poly([[12, 1], [12, 22], [8, 22], [6, 9]], '#b39af2')
    .line(12, 2, 12, 21, '#d6c6ff', 0.6).dot(9, 10, '#ffffff').poly([[18, 13], [21, 16], [19, 22], [17, 22]], '#5fd0c8'),
  // ROE: a quivering cluster of eggs, each with its glint
  roe: () => {
    const r = R(), eggs = [[8, 9], [14, 8], [11, 14], [17, 13], [6, 15], [12, 19], [18, 18], [8, 20]];
    for (const [x, y] of eggs) r.disc(x, y, 3.2, '#f08a2a');
    for (const [x, y] of eggs) r.disc(x, y, 2, '#ffb05a');
    for (const [x, y] of eggs) r.dot(x - 1, y - 1, '#fff2d0');
    return r;
  },
  // POSSIBILIKEY: a plain brass key
  key: () => R()
    .ring(7, 8, 3, 5.6, '#d6a83a').line(11, 11.5, 20, 20.5, '#d6a83a', 2.4).line(16.5, 16.5, 14, 19, '#d6a83a', 2).line(19.5, 19.5, 17, 22, '#d6a83a', 2)
    .dot(5, 5, '#fff0b0'),
  // CURIO: a small trinket on a ribbon
  curio: () => R()
    .poly([[8, 1], [12, 9], [9, 10], [5, 2]], '#c8302e').poly([[16, 1], [12, 9], [15, 10], [19, 2]], '#a8261e')
    .disc(12, 15.5, 6, '#e0b44a').disc(12, 15.5, 3.6, '#b8862a').poly([[12, 12.5], [13, 15], [15.5, 15.5], [13, 16.5], [12, 19], [11, 16.5], [8.5, 15.5], [11, 15]], '#ffe58a'),
  // SHELL: a caster shell, brass-cased, its tip violet
  shell: () => R()
    .rect(8, 9, 16, 21, '#d4a23c').rect(7, 20, 17, 22, '#b07e2a').poly([[8, 9.5], [16, 9.5], [14.5, 4], [12, 1.5], [9.5, 4]], '#9a6ce0')
    .line(9.5, 10, 9.5, 20, '#ffe08a', 1).rect(8, 14, 16, 15, '#a87a2a').dot(11, 4, '#e2d2ff'),
  // FISH: a plain fish, side on
  fish: () => R()
    .ell(11, 12, 8.6, 4.8, '#7aa6c4').poly([[18, 12], [23, 7], [23, 17]], '#5a86a8').ell(10, 14, 6.6, 2, '#c6dcea')
    .poly([[9, 7.4], [13, 7.6], [11, 5]], '#5a86a8').dot(5, 11, '#14202a').dot(5, 10, '#ffffff').line(7, 9.5, 7, 14.5, '#5a86a8', 0.6),
  // SLAB: a banded block of stone, a corner chipped
  slab: () => R()
    .poly([[2, 6], [20, 4], [22, 19], [4, 21]], '#b98a5a').poly([[2.6, 10], [20.6, 8], [21, 11.5], [3, 13.6]], '#8f6640')
    .poly([[3.4, 16], [21.4, 14], [21.8, 16.6], [3.8, 18.6]], '#d8b88a').poly([[17, 4.4], [20, 4], [20.6, 7.4]], null),
};
export const DROP_SPRITES = Object.keys(DRAW);

/** The hand's rules over a raster: the bevel from the top left, then the keyline, drawn at the whole number into a 48 x 48 canvas. */
function paint(r) {
  const S = DROP_SPRITE, k = S.scale, cv = document.createElement('canvas'); cv.width = cv.height = N * k;
  const x2 = cv.getContext('2d'), tone = (hex, f) => { const n = parseInt(hex.slice(1), 16); const ch = (v) => Math.round(Math.max(0, Math.min(255, f > 0 ? v + (255 - v) * f : v * (1 + f)))); return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = r.get(x, y);
    if (c) {
      const lit = r.get(x, y - 1) === null || r.get(x - 1, y) === null, dark = r.get(x, y + 1) === null || r.get(x + 1, y) === null;
      x2.fillStyle = lit && !dark ? tone(c, S.light) : dark && !lit ? tone(c, -S.shade) : c;
    } else {
      let near = false; for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) if (r.get(x + i, y + j)) { near = true; break; }
      if (!near) continue; x2.fillStyle = S.keyline;
    }
    x2.fillRect(x * k, y * k, k, k);
  }
  return cv;
}

export class DropSprites {
  constructor() { this.cv = new Map(); this.tex = new Map(); }
  canvas(cat) {
    if (this.cv.has(cat)) return this.cv.get(cat);
    const d = DRAW[cat], cv = d && typeof document !== 'undefined' ? paint(d()) : null;
    this.cv.set(cat, cv); return cv;
  }
  texture(cat) {
    if (this.tex.has(cat)) return this.tex.get(cat);
    const cv = this.canvas(cat); let t = null;
    if (cv) { t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; }
    this.tex.set(cat, t); return t;
  }
}

/** Once, at boot: the drops' runtime (Dovina's world/drops/creaturedrops.js) asks `game.dropSprites` before drawing its own disc. */
export function installDropSprites(game) { return (game.dropSprites = new DropSprites()); }
