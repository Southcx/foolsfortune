// ---------------------------------------------------------------------------------------
// A DOMAIN'S LOOK: the seven domains of the Courier's psyche (progress/domains.js), wherever a domain is drawn (the god hand's arts
// selector, the Codex's STATUS shelf, a domain's power row). A domain's identity is its colour and its sign (its icon): those hold on
// every island. The kiln-glaze tile and the museum label are Anagami's dressing of that colour (REGISTERS.md row 8, the owner,
// 2026-10-13): `glaze` names the real glaze Anagami fires it as, and another island's dress may wear the same colour its own way. The
// colour is never a feeling's hue: the seven feelings own the saturated wheel colours (progress/weather.js COLOR), and a domain is a
// skill of the psyche, not a feeling, so its colours sit in the kiln's palette (stoneware and porcelain glazes).
//
//   ouranurgy       Ru celadon                   the blue of the sky after rain
//   manifestation   fire-flashed shino           a cream glaze blushing orange where the flame licked it
//   divination      yohen tenmoku                a black glaze with star spots in it, iridescent violet-silver
//   psychokinesis   oxblood (sang de boeuf)      copper red, pale at the rim where it thinned
//   possession      Jun ware                     a milky blue with a purple splash
//   alteration      flambe                       copper red running into blue as it fired
//   spellscription  cobalt underglaze            blue brushed on white porcelain
//
// Prior art: the glazes themselves, as each entry's `label` says (museum-label style); the tile is drawn as the pixel kit draws
// (ui/pixel.js: drawn at 1x, shown scaled by whole numbers), one ImageData pass, no shader.
//
//   DOMAIN_LOOK[id] = { id, glaze, colours: { body, accent?, edge?, ground? }, icon: 'domain.<id>', pal: 'domain.<id>', iconHex, glint?: { core, edge }, label }
//     colours are CSS hex strings; `icon` and `pal` go to uiIcon / iconEl (ui/icons/icons.js); `iconHex` is the colour the icon's
//     palette is ramped from (ui/icons/icons.js paintRamp), `glint` the highlights' colours where they are not the body's lit
//   glazeTile(id, { w = 48, h = 12 }) -> canvas (1x, cached): the glaze's character (the tenmoku's spots, the flambe's run, the shino's
//     flash, the cobalt brushed on white); show it scaled by whole numbers, `image-rendering: pixelated`, behind a domain's power row
//   THE_WORLD_GOLD   kintsugi gold (CSS hex), for the radar's highlights
//   BISQUE           unglazed fired clay (CSS hex), for the radar's ground
// ---------------------------------------------------------------------------------------
import { DOMAINS } from '../progress/domains.js';

export const THE_WORLD_GOLD = '#d4a53c';
export const BISQUE = '#c9a882';

const LOOK = {
  ouranurgy: {
    glaze: 'Ru celadon', colours: { body: '#9cc3b8' }, iconHex: '#9cc3b8',
    label: 'Ru ware. Northern Song, Ru kilns at Qingliang Temple, Henan, c. 1086-1125. A celadon "the blue of the sky after rain", its glaze finely crackled.',
  },
  manifestation: {
    glaze: 'fire-flashed shino', colours: { body: '#e8d6c0', accent: '#d9814a' }, iconHex: '#d8a882',
    label: 'Shino ware. Momoyama period, Mino province, Japan, late 16th century. A thick feldspar glaze, pinholed, flashed orange where the fire licked it.',
  },
  divination: {
    glaze: 'yohen tenmoku', colours: { body: '#1a1418', accent: '#b9b4e8', edge: '#7a6fc4' }, iconHex: '#3a3038', glint: { core: '#b9b4e8', edge: '#7a6fc4' },
    label: 'Yohen tenmoku. Southern Song, Jian kilns, Fujian, 12th to 13th century. A black glaze whose spots fired to stars, iridescent blue going to violet.',
  },
  psychokinesis: {
    glaze: 'oxblood (sang de boeuf)', colours: { body: '#8e1f1f' }, iconHex: '#a2282a',
    label: 'Sang de boeuf. Qing, Kangxi reign, Jingdezhen, c. 1705-1712. A copper-red glaze fired in a starved kiln, pale where it thinned at the rim.',
  },
  possession: {
    glaze: 'Jun ware', colours: { body: '#7d93c4', accent: '#8a4f9e' }, iconHex: '#7d93c4',
    label: 'Jun ware. Northern Song to Jin, Yuxian, Henan, 12th century. An opalescent blue, splashed purple with copper before the firing.',
  },
  alteration: {
    glaze: 'flambe', colours: { body: '#a8324a', accent: '#4a5fa8' }, iconHex: '#a8324a',
    label: 'Flambe. Qing, Jingdezhen, 18th century; after it Sevres and Bernard Moore. Copper red run into streaks of blue by the fire.',
  },
  spellscription: {
    glaze: 'cobalt underglaze on white porcelain', colours: { body: '#2a4fa0', ground: '#f2efe6' }, iconHex: '#2a4fa0',
    label: 'Blue-and-white. Yuan, Jingdezhen, 14th century. Cobalt brushed on the raw porcelain under a clear glaze, as a scribe writes.',
  },
};

export const DOMAIN_LOOK = Object.fromEntries(Object.keys(DOMAINS).map((id) => [id, { id, ...LOOK[id], icon: `domain.${id}`, pal: `domain.${id}` }]));

// ---- the tile ---------------------------------------------------------------------------------------------------------------------
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const shade = (c, k) => c.map((v) => v * k);
const lift = (c, k) => c.map((v) => v + (255 - v) * k);
/** A hash in 0..1 for a pixel and a salt: the tile's grain, the same every time it is drawn. */
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** Smooth value noise at a scale (cells of `cell` pixels). */
function noise(x, y, cell, s) {
  const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Each glaze as a rule: (x, y, w, h) -> [r, g, b]. */
const PAINT = {
  ouranurgy(x, y, w, h) { // a soft celadon, paler at the top where it ran thin, and the crackle (a few darker lines)
    const c = rgb('#9cc3b8'), n = noise(x, y, 6, 1);
    let col = mix(lift(c, 0.18), shade(c, 0.9), y / h * 0.8 + (n - 0.5) * 0.3);
    const cr = Math.abs(noise(x, y, 9, 2) - 0.5) < 0.022 || Math.abs(noise(x + 31, y, 7, 3) - 0.5) < 0.018;
    if (cr) col = shade(col, 0.78);
    return col;
  },
  manifestation(x, y, w, h) { // the cream, its pinholes, and the flame's flash rising from the lower edge
    const cream = rgb('#e8d6c0'), flash = rgb('#d9814a');
    const k = Math.max(0, Math.min(1, (y / h) * 1.3 - 0.35 + (noise(x, y, 7, 4) - 0.5) * 0.9 + (noise(x, 0, 16, 5) - 0.5) * 0.6));
    let col = mix(cream, flash, k * k * (3 - 2 * k));
    if (hash(x, y, 6) < 0.025) col = shade(col, 0.7); // (a pinhole)
    return col;
  },
  divination(x, y) { // the black, a brown hare's-fur streak through it, and the stars: violet-silver spots in a violet halo, a few with one cool highlight (kept off Wonder's cyan)
    const body = rgb('#1a1418'), core = rgb('#b9b4e8'), edge = rgb('#7a6fc4');
    let col = mix(body, [70, 46, 30], Math.max(0, noise(x * 3, y, 3, 7) - 0.62) * 1.4);
    const sx = Math.floor(x / 6), sy = Math.floor(y / 6);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const cx = sx + i, cy = sy + j; if (hash(cx, cy, 8) > 0.55) continue;
      const px = cx * 6 + 1 + hash(cx, cy, 9) * 4, py = cy * 6 + 1 + hash(cx, cy, 10) * 4, d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
      if (d < 0.9) col = hash(cx, cy, 11) < 0.35 && x + 0.5 < px && y + 0.5 < py ? [214, 222, 240] : core; // (a 1 px cool highlight)
      else if (d < 2.1) col = mix(col, edge, 0.5 * (2.1 - d));
    }
    return col;
  },
  psychokinesis(x, y, w, h) { // deep copper red, darker where it pooled low, pale where it thinned at the rim (the top edge)
    const c = rgb('#8e1f1f'), n = noise(x, y, 5, 12);
    let col = mix(lift(c, 0.12), shade(c, 0.62), Math.min(1, y / h + (n - 0.5) * 0.35));
    if (y < 2) col = mix(col, [228, 214, 196], y === 0 ? 0.6 : 0.25); // (the white rim, the mouth of the pot)
    return col;
  },
  possession(x, y, w, h) { // milky opal blue, and a purple splash with a soft edge
    const blue = rgb('#7d93c4'), splash = rgb('#8a4f9e'), n = noise(x, y, 4, 13);
    let col = mix(lift(blue, 0.15), blue, n);
    const d = Math.hypot((x - w * 0.62) / (w * 0.22), (y - h * 0.45) / (h * 0.55)) + (noise(x, y, 4, 14) - 0.5) * 0.7;
    if (d < 1) col = mix(col, splash, Math.min(1, (1 - d) * 2.2));
    return col;
  },
  alteration(x, y, w, h) { // copper red running down into blue in streaks: the boundary drips lower in some columns than others
    const red = rgb('#a8324a'), blue = rgb('#4a5fa8');
    const drip = 0.35 + noise(x, 0, 3, 15) * 0.35 + (hash(x, 0, 16) < 0.18 ? 0.2 : 0);
    const k = Math.max(0, Math.min(1, (y / h - drip) * 3.2 + 0.5));
    let col = mix(red, blue, k);
    col = mix(col, lift(col, 0.3), Math.max(0, noise(x, y * 0.25, 2, 17) - 0.7) * 1.6); // (the streaks' sheen)
    return col;
  },
  spellscription(x, y, w, h) { // white porcelain, a rim line top and bottom, and one cobalt stroke brushed across, dry at its tail
    const white = rgb('#f2efe6'), cobalt = rgb('#2a4fa0');
    if (y === 1 || y === h - 2) return mix(white, cobalt, 0.75);
    const t = x / w, cy = h * 0.5 + Math.sin(t * Math.PI * 1.6) * h * 0.14, half = h * (0.24 - 0.17 * t);
    const inStroke = Math.abs(y + 0.5 - cy) <= half && !(t > 0.62 && hash(x >> 1, y, 18) < (t - 0.62) * 2.2);
    return inStroke ? mix(cobalt, shade(cobalt, 0.7), noise(x, y, 3, 19) * 0.8 * (1 - t)) : mix(white, [228, 224, 214], noise(x, y, 8, 20));
  },
};

const TILES = new Map();
/** A domain's glaze tile at 1x (a canvas, cached by id and size); a blank 1 x 1 for an id it does not know. */
export function glazeTile(id, { w = 48, h = 12 } = {}) {
  const key = `${id}|${w}x${h}`;
  if (TILES.has(key)) return TILES.get(key);
  const c = document.createElement('canvas');
  const paint = PAINT[id];
  if (!paint) { c.width = c.height = 1; return c; }
  c.width = w; c.height = h;
  const g = c.getContext('2d'), d = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b] = paint(x, y, w, h), i = (y * w + x) * 4;
    d.data[i] = Math.round(r); d.data[i + 1] = Math.round(gg); d.data[i + 2] = Math.round(b); d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  TILES.set(key, c);
  return c;
}
