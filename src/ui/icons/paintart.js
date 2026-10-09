// ---------------------------------------------------------------------------------------
// THE PAINT'S ICONS: what the Soul Brush's radial picks (tools/soulbrush/radial.js PICKS: the seven feelings, and Clean), each a
// silhouette of its own, so no slot is told by its colour alone (CLARITY.md; GALL-AND-FURY.md section 15), 14 x 14 in the icons' hand
// (ui/icons/hand.js) and coloured by the feeling's own ramp (ui/icons/icons.js `paintRamp`):
//   wonder   a six-armed ice crystal, a snowflake (the diamond dust; Ego's hexagons)
//   mirth    the sun, a bright disc and its eight rays (the sunshower)
//   desire   a heart, lit on its left lobe
//   fury     a flame of three tongues round a hot heart (heat: the hail's sparks)
//   gall     a fly, its glassy wings up (rot: the miasma's flies)
//   grief    a tear, lit on its upper side (the long rain)
//   dread    a bolt, the far thunder of its pall
//   clean    a four-pointed sparkle and a small one (Fair: washed ground shining, Super Mario Sunshine's sparkle)
// A locked slot shows its picture in grey under the lock (radial.js). The paint on the ground carries each feeling's motif instead
// (vfx/paintmotifs.js), from the same weather: ice, sun, wind, heat, rot, rain, thunder.
//
// Prior art: the elemental icons of Pokemon's and Final Fantasy's menus (one silhouette a type, read before its colour), the manga
// symbol vocabulary (the anger vein, the sweat drop), and the weather icons every forecast uses (a sun, a bolt, a drop).
//
//   PAINT_ART[id] -> rows (14 x 14)
// ---------------------------------------------------------------------------------------
import { grid } from './hand.js';

/** Is the pixel centre (x + 0.5, y + 0.5) inside a polygon of [x, y] points? (even-odd) */
const inPoly = (pts, x, y) => {
  const px = x + 0.5, py = y + 0.5; let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const BOLT = [[7, 0], [12.6, 0], [9.2, 5.4], [12.4, 5.4], [3.6, 14], [6.1, 7.6], [2.6, 7.6]];

export const PAINT_ART = {
  wonder: grid(14, 14, (x, y) => {
    const px = x + 0.5 - 7, py = y + 0.5 - 7, r = Math.hypot(px, py), q = Math.PI / 3;
    if (r > 7) return null;
    if (r <= 1.6) return '+';
    const m = ((Math.atan2(py, px) - Math.PI / 2) % q + q) % q, off = Math.min(m, q - m), along = r * Math.cos(off), across = r * Math.sin(off);
    if (across < 0.72 && r <= 6.9) return '#'; // (six arms)
    const bx = along - 4.1, by = across; // (a pair of twigs on each arm, at 60 degrees to it, toward the tip)
    return bx > 0 && bx < 2.1 && Math.abs(by - bx * 1.2) < 0.7 ? '#' : null;
  }),
  mirth: grid(14, 14, (x, y) => {
    const px = x - 6.5, py = y - 6.5, r = Math.hypot(px, py), q = Math.PI / 4;
    if (r <= 3.7) return '+';
    const m = ((Math.atan2(py, px) % q) + q) % q, off = Math.min(m, q - m);
    return r >= 5.1 && r <= 7.1 && off * r < 0.95 ? '#' : null; // (eight rays, apart from the disc)
  }),
  desire: grid(14, 14, (x, y) => {
    const u = (x + 0.5 - 7) / 5.9, v = -(y + 0.5 - 7.5) / 6.1, f = (u * u + v * v - 1) ** 3 - u * u * v * v * v;
    if (f > 0) return null;
    return Math.hypot(x + 0.5 - 4.2, y + 0.5 - 3.9) < 1.5 ? '+' : '#';
  }),
  fury: grid(14, 14, (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const tongue = (tx, ty, bx, by, hw) => { if (py < ty || py > by) return false; const k = (py - ty) / (by - ty), cx = tx + (bx - tx) * k; return Math.abs(px - cx) <= hw * Math.pow(k, 0.75); };
    const body = ((px - 7) / 5.2) ** 2 + ((py - 9.6) / 4.2) ** 2 <= 1;
    const core = ((px - 7.2) / 2.4) ** 2 + ((py - 10.6) / 2.4) ** 2 <= 1 || tongue(7.8, 5.6, 7.2, 10, 2.1);
    if (core) return '+'; // (the hot heart)
    return body || tongue(8.2, 0.2, 7, 8, 4.2) || tongue(2.6, 3.6, 4.4, 9, 2.6) || tongue(12.2, 2.8, 10.2, 9, 2.4) ? '#' : null;
  }),
  gall: grid(14, 14, (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    const body = ((px - 7) / 2.3) ** 2 + ((py - 9.2) / 3.9) ** 2 <= 1, head = Math.hypot(px - 7, py - 4.4) <= 1.9;
    if (head) return Math.abs(px - 7) > 0.9 && py < 4.6 ? 'x' : '#'; // (its two eyes)
    if (body) return Math.abs(py - 8.6) < 0.5 || Math.abs(py - 10.8) < 0.5 ? 'x' : '#'; // (its banded belly)
    const wing = (cx, ang) => { const c = Math.cos(ang), s = Math.sin(ang), dx = px - cx, dy = py - 5.2, u = dx * c + dy * s, v = -dx * s + dy * c; return (u / 3.4) ** 2 + (v / 1.7) ** 2 <= 1; };
    return wing(3.3, 0.55) || wing(10.7, -0.55) ? '-' : null;
  }),
  grief: grid(14, 14, (x, y) => {
    const px = x + 0.5, py = y + 0.5, r = 4.6, cy = 8.9;
    const inBall = Math.hypot(px - 7, py - cy) <= r, inCone = py < cy && py >= 0.4 && Math.abs(px - 7) <= ((py - 0.4) / (cy - 0.4)) * r * 0.95;
    if (!inBall && !inCone) return null;
    return Math.hypot(px - 5.3, py - 7.9) < 1.5 ? '+' : '#';
  }),
  dread: grid(14, 14, (x, y) => (inPoly(BOLT, x, y) ? (y < 2 ? '+' : '#') : null)),
  clean: grid(14, 14, (x, y) => {
    const star = (cx, cy, R) => { const dx = Math.abs(x + 0.5 - cx), dy = Math.abs(y + 0.5 - cy); return dx ** (2 / 3) + dy ** (2 / 3) <= R ** (2 / 3); };
    if (star(5.6, 8.0, 5.9)) return Math.hypot(x + 0.5 - 5.6, y + 0.5 - 8) < 1.6 ? '+' : '#';
    return star(11.5, 2.6, 2.6) ? '+' : null;
  }),
};
