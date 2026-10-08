// ---------------------------------------------------------------------------------------
// A WAYPOINT'S FEELING ON THE SEA CHART (PASSAGE.md section 14.4; Calissa's ruling to Dovina, docs/handoffs/dovina/2026-10-08-from-calissa-
// trip-pressures.md): never filled into the icon (that would read as certain, and carry two facts in one channel), but shown ROUND it,
// as A WAYPOINT'S NIMBUS (the raincloud and the glow round a holy head at once: the Latin is a cloud; not the weather's halo, wonder's
// ring round the sun): a soft glow in the feeling's canon colour (progress/weather.js COLOR), and inside it the feeling's own motif from
// the weather's look (vfx/weather.js), so it reads for colour-blind eyes and the chart teaches what each sky looks like before you sail into it:
// wonder's diamond motes turning, mirth's facets thrown out, desire's sirocco sand blowing through, grief's long streaks falling, dread's
// smoke rising. A fair waypoint (no feeling) has no nimbus. Slow, every one of them: a drift, never a flicker. In ink (a rutter's page) the
// feeling is a watercolour wash under the icon, as a hand-coloured chart's is, and the motif is left out.
// Also here, the same colour as a bead running along a lane: the draught's trump (seachart.js).
//
// Prior art: the weather map's symbols (a sky's kind told by its shape, not only its colour), and the hand-coloured portolan.
//
//   drawNimbus(g, feel, x, y, s, t, seed, look?)   (x, y in art pixels, s the whole-number scale, t real seconds, seed a waypoint's id)
//   drawBead(g, feel, x, y, s)   feelColor(feel) -> [r, g, b] | null
// ---------------------------------------------------------------------------------------
import { COLOR } from '../../progress/weather.js';

const R = 16; // (the nimbus's reach from the waypoint's centre, art pixels)
const SPRITES = new Map();
export const feelColor = (feel) => (feel && COLOR[feel] != null ? [(COLOR[feel] >> 16) & 255, (COLOR[feel] >> 8) & 255, COLOR[feel] & 255] : null);
const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const tint = (c, k) => c.map((v) => Math.round(v + (255 - v) * k));
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
function hash01(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; }

/** The nimbus's glow, drawn once a feeling and a scale: brightest just outside the icon, gone at its reach (a dark colour lifted so it
 *  still shows on the crude). */
function nimbusSprite(feel, s) {
  const key = `${feel}|${s}`; if (SPRITES.has(key)) return SPRITES.get(key);
  const col = feelColor(feel), boost = Math.max(1, Math.min(2.2, 0.55 / Math.max(0.05, lum(col)))), n = R * 2 * s;
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  gr.addColorStop(0, rgba(col, 0.1 * boost)); gr.addColorStop(0.55, rgba(col, 0.3 * boost)); gr.addColorStop(0.8, rgba(col, 0.13 * boost)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, n, n);
  SPRITES.set(key, c);
  return c;
}

const px = (g, s, x, y, w = 1, h = 1) => g.fillRect(Math.round(x) * s, Math.round(y) * s, w * s, h * s);
const fade = (u) => Math.sin(Math.PI * Math.max(0, Math.min(1, u))); // (in and out at a particle's two ends)

/** The motifs, one a feeling: particles at whole art pixels about the centre. */
const MOTIF = {
  wonder(g, s, t, h, col) { // (diamond motes turning: a mote at its brightest shows its four points)
    for (let i = 0; i < 4; i++) {
      const a = h(i) * 6.283 + t * 0.18, r = 12 + h(i + 9) * 3, x = Math.cos(a) * r, y = Math.sin(a) * r, b = 0.5 + 0.5 * Math.sin(t * 1.1 + h(i + 3) * 6.283);
      g.fillStyle = rgba(col, 0.35 + 0.55 * b); px(g, s, x, y);
      if (b > 0.6) { g.fillStyle = rgba(col, (b - 0.6) * 1.6); px(g, s, x - 1, y); px(g, s, x + 1, y); px(g, s, x, y - 1); px(g, s, x, y + 1); }
    }
  },
  mirth(g, s, t, h, col) { // (facets thrown out: a little three-pixel shard flies from the icon's edge and fades)
    for (let i = 0; i < 3; i++) {
      const P = 2.6, u = (t / P + h(i)) % 1, a = h(i + 5) * 6.283 + i * 2.1 + t * 0.1, r = 9 + u * 7, x = Math.cos(a) * r, y = Math.sin(a) * r, q = Math.floor(u * 8) % 4;
      g.fillStyle = rgba(col, 0.85 * fade(u)); px(g, s, x, y); px(g, s, x + (q < 2 ? 1 : -1), y); px(g, s, x, y + (q % 2 ? 1 : -1));
    }
  },
  desire(g, s, t, h, col) { // (sirocco sand: grains blown across from the left)
    for (let i = 0; i < 7; i++) {
      const P = 2.2, u = (t / P + h(i)) % 1, x = -R + u * R * 2, y = (h(i + 7) - 0.5) * 22 + Math.sin(t * 2 + i) * 0.8, edge = Math.max(0, 1 - (x * x + y * y) / (R * R));
      g.fillStyle = rgba(col, 0.9 * fade(u) * edge); px(g, s, x, y);
    }
  },
  grief(g, s, t, h, col) { // (long streaks falling)
    for (let i = 0; i < 4; i++) {
      const P = 3.2, u = (t / P + h(i)) % 1, x = (h(i + 4) - 0.5) * 24, y = -14 + u * 26, edge = Math.max(0, 1 - (x * x) / (R * R));
      g.fillStyle = rgba(col, 0.75 * fade(u) * edge); px(g, s, x, y, 1, 4);
    }
  },
  dread(g, s, t, h, col) { // (smoke rising and spreading)
    for (let i = 0; i < 3; i++) {
      const P = 4, u = (t / P + h(i)) % 1, x = (h(i + 2) - 0.5) * 14 + Math.sin(t * 0.7 + i) * 2, y = 9 - u * 24, r = (1.5 + u * 2.5) * s;
      const cx = Math.round(x) * s, cy = Math.round(y) * s, gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, rgba(col, 0.55 * fade(u))); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  },
};

/** The feeling round a waypoint. `g` is the chart's context at scale `s`; (x, y) its centre in art pixels. */
export function drawNimbus(g, feel, x, y, s, t = 0, seed = '', look = 'crude') {
  const col = feelColor(feel); if (!col) return;
  if (look === 'ink') { // (the wash: a soft pool of the colour under the icon)
    const gr = g.createRadialGradient(x * s, y * s, 0, x * s, y * s, 13 * s);
    gr.addColorStop(0, rgba(col, 0.32)); gr.addColorStop(0.7, rgba(col, 0.2)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x * s, y * s, 13 * s, 0, Math.PI * 2); g.fill();
    return;
  }
  g.drawImage(nimbusSprite(feel, s), (x - R) * s, (y - R) * s);
  const motif = MOTIF[feel]; if (!motif) return;
  g.save(); g.translate(Math.round(x) * s, Math.round(y) * s);
  motif(g, s, t, (i) => hash01(`${seed}:${i}`), feel === 'dread' ? tint(col, 0.3) : tint(col, 0.35));
  g.restore();
}

/** A bead of a feeling's colour (the draught's trump running along its lane). */
export function drawBead(g, feel, x, y, s) {
  const col = feelColor(feel); if (!col) return;
  const cx = x * s, cy = y * s, r = 3 * s, gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  gr.addColorStop(0, rgba(tint(col, 0.6), 0.95)); gr.addColorStop(0.35, rgba(col, 0.6)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
}
