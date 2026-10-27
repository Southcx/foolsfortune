// ---------------------------------------------------------------------------------------
// THE SHIP KIT'S FITTINGS: what gives a hull of the Vessoul's its age-of-sail presence at its life size (the owner, 2026-10-27: "more
// sailing-ship like presence with figureheads and ornate rudders and railing; flatter decks too"), written into the ship's one static
// mesh (shipkit/hullkit.js) at a Courier's measure (1.8 m tall: a rail at the hip, a step a stride's rise):
//   balustrade   turned balusters (foot, belly, neck) under a gold cap rail, a foot rail, a newel post with a finial at each end
//   gunwale      the deck edge as a path for it, a level's own run (the break of a raised quarterdeck is a step in the loft, not a ramp)
//   stairs       a flight between two deck levels: treads, stringers, gold handrails on posts
//   ladder       a ship's ladder up a face: two rails and their rungs
//   rudder       a rudder hung on the sternpost: its blade, gold pintles, a carved lozenge each face, a gold trailing edge, a carved head
//   gallery      a stern gallery (or a carved transom, `tiers` 1 and no balcony): rows of lit lights in gold frames, cornices, a
//                balcony with its balustrade, quarter galleries on the hull's corners under domed tops, a gold crest
// Prior art: USS Constitution's and HMS Victory's stern galleries and quarter galleries (the lights in rows, the balcony, the carved
// taffrail), the Vasa's carved transom and rudder head, a turned baluster's foot, belly and neck (the joiner's lathe), a ship's
// companion ladder; Skies of Arcadia's Delphinus and Rogue Galaxy's Dorgenark (sky galleons that keep the gallery and the rudder).
//
//   deckBreak    a raised deck's edge: its breast rail, gold moulding and stairs down (a quarterdeck aft, a forecastle `fore`)
//   capstan      the drum, its gold band and bars
//
//   balustrade(M, pts, { h, every, r, post, cap, capR, foot })   gunwale(hull, z0, z1, side, { n, inset, dy }) -> pts
//   railRuns(M, hull, [[z0, z1], ...], opts)   deckBreak(M, hull, { z, fore, stairs: [x, ...], w, post, cap, tread, gold })   capstan(M, { at, r, col, band, bars })
//   stairs(M, { x, w, z0, z1, y0, y1, col, gold })   ladder(M, { x, z, y0, y1, w, face, col })
//   rudder(M, { z, yTop, yBot, chord, t, col, gold, inlay })   gallery(M, { z, y0, w, tiers, h, col, frame, glass, gold, balcony, quarter, rows })
//   (points are [x, y, z]; the ship's frame: +Z the bow, Y up)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { deckAt, deckHalf, PLANK } from './hullkit.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** A baluster from the deck point p up `h`: a turned foot, a belly and a neck (four sides each: at 480 lines it reads as turned). */
function baluster(M, p, h, r, col) {
  const [x, y, z] = p, at = (k) => [x, y + h * k, z];
  M.cyl(at(0), at(0.14), r * 1.35, r * 1.1, 4, col, 0, { caps: false, phase: Math.PI / 4 });
  M.cyl(at(0.14), at(0.45), r * 0.75, r * 1.55, 4, col, 0, { caps: false, phase: Math.PI / 4 });
  M.cyl(at(0.45), at(1), r * 1.55, r * 0.7, 4, col, 0, { caps: false, phase: Math.PI / 4 });
}

/** Turned balusters along a path of deck points (each [x, y, z]), every `every` metres, under a gold cap rail `h` up and over a foot
 *  rail; a newel post with a gold finial at each end. */
export function balustrade(M, pts, { h = 1.05, every = 0.8, r = 0.05, post = 0xeef0ee, cap = 0xf2c14e, capR = 0.075, foot = true, newels = true } = {}) {
  if (pts.length < 2) return;
  const up = (p, dy) => [p[0], p[1] + dy, p[2]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = _a.fromArray(a).distanceTo(_b.fromArray(b)), n = Math.max(1, Math.round(L / every));
    for (let k = i ? 0 : 1; k < n; k++) { const t = k / n; baluster(M, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], h - capR, r, post); }
    M.cyl(up(a, h), up(b, h), capR, capR, 4, cap, 0, { caps: false, smooth: false, phase: Math.PI / 4 }); // (the cap rail)
    if (foot) M.cyl(up(a, 0.1), up(b, 0.1), capR * 0.7, capR * 0.7, 4, post, 0, { caps: false, smooth: false, phase: Math.PI / 4 });
  }
  if (newels) for (const p of [pts[0], pts[pts.length - 1]]) {
    M.box([p[0], p[1] + h / 2, p[2]], [r * 4, h + capR, r * 4], post, 0);
    M.gem(up(p, h + capR + 0.08), r * 2.6, 0.2, 0.08, 6, cap, 0);
  }
}

/** A deck edge as a path: from z0 to z1 on one side (+1 starboard .. -1), `inset` in from the side, `n` points (the loft's own, so a
 *  run must stay on one deck level). */
export function gunwale(hull, z0, z1, side, { n = 10, inset = 0.25, dy = 0 } = {}) {
  const cam = hull.camber ?? 0.04, out = [];
  for (let i = 0; i <= n; i++) { const z = z0 + ((z1 - z0) * i) / n; out.push([side * Math.max(0.05, deckHalf(hull, z) - inset), deckAt(hull, z) - cam + dy, z]); }
  return out;
}

/** Balustrades down both gunwales, a run each [z0, z1] (each on one deck level). */
export function railRuns(M, hull, runs, opts = {}) {
  for (const [z0, z1] of runs) for (const s of [1, -1]) balustrade(M, gunwale(hull, z0, z1, s, { n: Math.max(2, Math.round(Math.abs(z1 - z0) / 2.5)), inset: opts.inset ?? 0.25 }), opts);
}

/** A raised deck's edge at z (its break in the loft): a breast rail along it at the upper level, open at each flight of stairs (x in
 *  `stairs`), a gold moulding along the step's top, and the stairs down to the deck below. `fore`: a forecastle (raised forward of z). */
export function deckBreak(M, hull, { z, fore = false, stairs: xs = [], w = 1.3, post, cap, tread, gold = 0xf2c14e, inset = 0.25 }) {
  const up = fore ? 1 : -1, cam = hull.camber ?? 0.04, half = Math.min(deckHalf(hull, z + up * 0.4), deckHalf(hull, z - up * 0.4)) - inset;
  const yAt = (zz, x) => deckAt(hull, zz) - cam * Math.min(1, Math.abs(x) / Math.max(0.1, half)), yU = deckAt(hull, z + up * 0.4) - cam;
  const cuts = xs.map((x) => [x - w / 2 - 0.2, x + w / 2 + 0.2]).sort((a, b) => a[0] - b[0]), zr = z + up * 0.2;
  let x0 = -half; for (const [a, b] of [...cuts, [half, half]]) { if (a - x0 > 0.4) balustrade(M, [[x0, yU, zr], [Math.min(a, half), yU, zr]], { post, cap }); x0 = b; }
  M.box([0, yU - 0.06, z], [half * 2 + inset, 0.14, 0.16], gold, 0); // (the moulding along the break)
  for (const x of xs) { const yu = yAt(z + up * 0.4, x), yl = yAt(z - up * 0.4, x), run = (yu - yl) * 1.05; stairs(M, { x, w, z0: z - up * run, z1: z + up * 0.02, y0: yl, y1: yu, col: tread, gold }); }
}

/** A capstan on the deck at `at`: its drum, a gold band, the bars through its head. */
export function capstan(M, { at, r = 0.55, col, band = 0xf2c14e, bars = 0x2a2f3a }) {
  const [x, y, z] = at;
  M.cyl([x, y, z], [x, y + 1.0, z], r, r * 0.78, 8, col, 0); M.cyl([x, y + 0.45, z], [x, y + 0.55, z], r * 0.92, r * 0.9, 8, band, 0, { caps: false });
  M.cyl([x, y + 1.0, z], [x, y + 1.12, z], r * 0.95, r * 0.9, 8, band, 0);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; M.cyl([x - Math.cos(a) * r * 2.6, y + 0.9, z - Math.sin(a) * r * 2.6], [x + Math.cos(a) * r * 2.6, y + 0.9, z + Math.sin(a) * r * 2.6], 0.05, 0.05, 4, bars, 0, { caps: false, smooth: false }); }
}

/** A flight of stairs across x (centred at x, `w` wide) from (z0, y0) up to (z1, y1): treads a stride's rise apart, two stringers, gold
 *  handrails on two posts a side. */
export function stairs(M, { x = 0, w = 1.3, z0, z1, y0, y1, col = 0xc8b48a, gold = 0xf2c14e, rails = true }) {
  const n = Math.max(2, Math.round((y1 - y0) / 0.24)), rise = (y1 - y0) / n, run = (z1 - z0) / n;
  for (let i = 0; i < n; i++) { const y = y0 + rise * (i + 1), z = z0 + run * (i + 0.5); M.box([x, y - 0.04, z], [w, 0.08, Math.abs(run) * 1.12], col, PLANK); }
  const ang = Math.atan2(y1 - y0, Math.abs(z1 - z0)), Ls = Math.hypot(y1 - y0, z1 - z0), dir = Math.sign(z1 - z0);
  for (const s of [1, -1]) {
    M.xf(new THREE.Matrix4().makeTranslation(x + s * (w / 2 + 0.05), (y0 + y1) / 2 - 0.05, (z0 + z1) / 2).multiply(new THREE.Matrix4().makeRotationX(-dir * ang)), (G) => G.box([0, 0, 0], [0.1, 0.28, Ls], col, 0));
    if (!rails) continue;
    const hx = x + s * (w / 2 + 0.05), top = [hx, y1 + 0.95, z1], bot = [hx, y0 + 0.95, z0];
    M.cyl(bot, top, 0.04, 0.04, 4, gold, 0, { caps: false, smooth: false });
    for (const p of [bot, top]) M.cyl([p[0], p[1] - 0.95, p[2]], p, 0.045, 0.04, 4, gold, 0, { caps: false });
  }
}

/** A ship's ladder up a face: from y0 to y1 at (x, z), `w` wide, standing off the face by its `face` (the way it faces: [dx, dz]). */
export function ladder(M, { x, z, y0, y1, w = 0.6, face = [0, -1], col = 0x2a2f3a }) {
  const [fx, fz] = face, sx = -fz, sz = fx, off = 0.12;
  for (const s of [1, -1]) { const px = x + fx * off + sx * s * w / 2, pz = z + fz * off + sz * s * w / 2; M.cyl([px, y0, pz], [px, y1 + 0.9, pz], 0.035, 0.035, 4, col, 0, { caps: false, smooth: false }); }
  for (let y = y0 + 0.3; y < y1 + 0.05; y += 0.3) M.cyl([x + fx * off - sx * w / 2, y, z + fz * off - sz * w / 2], [x + fx * off + sx * w / 2, y, z + fz * off + sz * w / 2], 0.025, 0.025, 4, col, 0, { caps: false, smooth: false });
}

/** A rudder hung on the sternpost at z (its forward edge), from yTop down to yBot, `chord` aft, `t` thick: the blade, gold pintles, a
 *  carved lozenge on each face (its inlay in `inlay`), a gold trailing edge and a carved head over the post. */
export function rudder(M, { z, yTop, yBot, chord, t = 0.3, col, gold = 0xf2c14e, inlay = 0xc8322b }) {
  const H = yTop - yBot, pts = [[z, yTop], [z, yBot], [z - chord, yBot + H * 0.08], [z - chord * 0.92, yTop - H * 0.42], [z - chord * 0.42, yTop - H * 0.08]];
  const h = t / 2, c = [0, yBot + H * 0.55, z - chord * 0.5];
  for (const s of [1, -1]) for (let i = 1; i < pts.length - 1; i++) M.tri([s * h, pts[0][1], pts[0][0]], [s * h, pts[i][1], pts[i][0]], [s * h, pts[i + 1][1], pts[i + 1][0]], col, 0.1, [-s * 5, c[1], c[2]]);
  for (let i = 0; i < pts.length; i++) {
    const [za, ya] = pts[i], [zb, yb] = pts[(i + 1) % pts.length], trail = i === 1 || i === 2;
    M.quad([h, ya, za], [h, yb, zb], [-h, yb, zb], [-h, ya, za], trail ? gold : col, 0, c);
    if (trail) M.cyl([0, ya, za], [0, yb, zb], h * 1.25, h * 1.25, 4, gold, 0, { caps: false, smooth: false, phase: Math.PI / 4 }); // (the trailing edge gilded)
  }
  for (let k = 0; k < 4; k++) { const y = yTop - H * (0.12 + k * 0.24); M.box([0, y, z - chord * 0.09], [t * 1.6, H * 0.045, chord * 0.26], gold, 0); } // (the pintles and their straps)
  const lz = z - chord * 0.55, ly = yBot + H * 0.68, lw = chord * 0.22, lh = H * 0.13; // (the lozenge high on the blade, where it shows over the water)
  for (const s of [1, -1]) {
    const x = s * (h + 0.012);
    M.poly([[x, ly + lh, lz], [x, ly, lz + lw], [x, ly - lh, lz], [x, ly, lz - lw]], gold, 0, [-s * 5, ly, lz]);
    const x2 = s * (h + 0.024); M.poly([[x2, ly + lh * 0.6, lz], [x2, ly, lz + lw * 0.6], [x2, ly - lh * 0.6, lz], [x2, ly, lz - lw * 0.6]], inlay, 0, [-s * 5, ly, lz]);
  }
  M.cyl([0, yTop - H * 0.07, z - t * 0.3], [0, yTop, z - t * 0.3], t * 0.85, t * 0.75, 6, gold, 0); // (the rudder head's band, under the counter)
  M.gem([0, yTop - H * 0.08, z - chord * 0.42], t * 0.75, t * 0.9, t * 0.5, 6, gold, 0, { axis: [0, 0.4, -1] }); // (the carved scroll at its after corner)
}

/** A stern gallery on the transom at z (its face turned aft), from y0 up: `tiers` rows of lit lights `h` tall across `w`, each under a
 *  gold cornice; a balcony with its balustrade under each tier (`balcony`), quarter galleries on the corners (`quarter`: the hull's
 *  half-width there), a gold crest over the top. `rows`: lights a tier. A carved transom is one tier and no balcony. Returns its top. */
export function gallery(M, { z, y0, w, tiers = 1, h = 1.6, col, frame = 0xf2c14e, glass = 0xffd27a, gold = 0xf2c14e, balcony = false, quarter = 0, rows = 5, post = 0xeef0ee }) {
  const out = [0, y0 + tiers * h * 0.5, z + 5];
  for (let t = 0; t < tiers; t++) {
    const yb = y0 + t * h, ww = w * (1 - 0.06 * t), lw = (ww * 0.8) / rows, zf = z - 0.03;
    M.box([0, yb + h / 2, z - 0.06], [ww, h, 0.12], col, 0.1);
    for (let i = 0; i < rows; i++) {
      const x = -ww * 0.4 + lw * (i + 0.5), wy = yb + h * 0.22, wh = h * 0.56;
      M.quad([x - lw * 0.36, wy, zf - 0.1], [x + lw * 0.36, wy, zf - 0.1], [x + lw * 0.36, wy + wh, zf - 0.1], [x - lw * 0.36, wy + wh, zf - 0.1], glass, 0.42, [x, wy, zf + 1]);
      M.box([x, wy + wh / 2, zf - 0.13], [lw * 0.12, wh, 0.06], frame, 0); // (the mullion)
      M.box([x - lw * 0.5, wy + wh / 2, zf - 0.14], [lw * 0.14, wh + 0.1, 0.1], frame, 0); // (the pilaster between lights)
    }
    M.box([ww * 0.4, yb + h * 0.5, zf - 0.14], [lw * 0.14, h * 0.66, 0.1], frame, 0);
    M.box([0, yb + h - 0.08, zf - 0.2], [ww * 1.02, 0.16, 0.26], gold, 0); // (its cornice)
    M.box([0, yb + h * 0.17, zf - 0.16], [ww * 0.86, 0.08, 0.16], gold, 0); // (the sill)
    if (balcony) {
      const d = 1.1, by = yb + 0.02; M.box([0, by - 0.06, zf - d / 2], [ww * 0.9, 0.12, d], col, PLANK);
      balustrade(M, [[-ww * 0.45, by, zf - d + 0.06], [ww * 0.45, by, zf - d + 0.06]], { h: 0.95, every: 0.5, r: 0.04, post, cap: gold });
      for (const s of [1, -1]) M.cyl([s * ww * 0.42, by - 0.06, zf - d + 0.1], [s * ww * 0.42, by - 0.06 - h * 0.35, zf - 0.05], 0.07, 0.05, 4, gold, 0); // (its brackets)
    }
    if (quarter) for (const s of [1, -1]) {
      const qx = s * (quarter + 0.25), qz = z + 1.2;
      M.box([qx, yb + h / 2, qz], [0.7, h * 0.94, 2.2], col, 0.1, { top: [0.8, 0.9] });
      for (const k of [-0.45, 0.45]) M.quad([qx + s * 0.36, yb + h * 0.3, qz + k - 0.3], [qx + s * 0.36, yb + h * 0.3, qz + k + 0.3], [qx + s * 0.36, yb + h * 0.74, qz + k + 0.3], [qx + s * 0.36, yb + h * 0.74, qz + k - 0.3], glass, 0.42, [qx - s, yb + h / 2, qz]);
      M.box([qx, yb + h - 0.05, qz], [0.86, 0.12, 2.4], gold, 0);
      if (t === tiers - 1) M.gem([qx, yb + h + 0.05, qz], 0.55, 0.9, 0.05, 6, gold, 0); // (the quarter gallery's domed top)
    }
  }
  // the crest: a gold fan over the top tier, rays from its middle
  const cy = y0 + tiers * h, R = Math.min(1.6, w * 0.16);
  for (let i = 0; i < 7; i++) { const a0 = (i / 7) * Math.PI, a1 = ((i + 0.7) / 7) * Math.PI; M.tri([0, cy, z - 0.18], [Math.cos(a0) * R, cy + Math.sin(a0) * R, z - 0.18], [Math.cos(a1) * R, cy + Math.sin(a1) * R, z - 0.18], gold, 0, out); }
  M.gem([0, cy + R * 0.25, z - 0.3], R * 0.22, R * 0.3, R * 0.2, 6, glass, 0.5, { axis: [0, 0, -1] });
  return cy + R;
}
