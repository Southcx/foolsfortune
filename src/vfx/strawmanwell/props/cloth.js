// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S LOOK, THE SEWING KIT'S PROPS, THE SOFT ONES: the haberdashery of Pip's sewing basket at giant scale, each drawn into a
// placeholder box's own metres (x along it, y up it, z toward the stalls; props/kit.js):
//   a tape measure  a thin platform: the yellow tape, its ticks on the edge the stalls see (a long red one a metre), its brass hook
//                   bent down over the free end
//   a ribbon        a soft ledge: velvet or grosgrain, its ends cut swallowtail, piped in gold
//   a hanging thread what a flown piece hangs from: a thread to the flies at each end (a paper theatre's flown piece, a puppet's line)
//   felt            a slope: folded felt sheets stacked under a sheet laid along the slope, blanket-stitched along its edge
//   sequins         ice: a bed of overlapping sequins on lamé, the front lip trimmed with glass beads
//   honey           goo: a spilt pool of it, glossy, running over the lip in drips
//   a vine          the Climb's vine: a twisted floss with a knot at each foothold and felt leaves, tied off at its spool
//   a thread        any other thread box: a twisted floss along its length
// Prior art: Pollock's toy theatres (the flown pieces on their lines, the cut-out edges), Kirby's Epic Yarn and Yoshi's Woolly World
// (cloth, felt and thread as the ground), LittleBigPlanet's craft materials (sequins, stitching), the dressmaker's tape and the blanket
// stitch as they are.
//
//   tape(K, w, h, d)   ribbon(K, w, h, d, { col, trim })   hangers(K, w, h, d, fly)   felt(K, B, { sheet, layers })   sequins(K, w, h, d, seed)
//   honey(K, w, h, d, seed)   vine(K, h, knots [y], { col })   floss(K, len, axis, col)   CLOTH (the numbers)   (K: props/kit.js PropKit)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { extruded, tube, hash, shade } from './kit.js';

/** The numbers (metres). */
export const CLOTH = {
  tape: { depth: 0.45, tick: 0.5, hook: 0.28 },
  ribbon: { depth: 0.46, notch: 0.28, piping: 0.05 },
  hang: { r: 0.045, inset: 0.3, back: 0.3 },
  felt: { sheet: 0.13, layer: 0.34, stitch: 0.3, inset: 0.06 },
  sequin: { r: 0.15, dx: 0.22, dz: 0.2, tilt: 0.3, bead: 0.1 },
  honey: { thick: 0.022, drips: 7, col: 0xc8901e, lit: 0xf2c25a, deep: 0xb77d16 },
  vine: { strand: 0.042, twist: 0.42, wrap: 0.05, knot: 0.085, leaf: 0.34, leafEvery: 0.95 },
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** A tape measure as a thin platform w x h x d: the tape, ticks on its front edge and along its top's front, its hook over the right end. */
export function tape(K, w, h, d) {
  const P = K.pal, C = CLOTH.tape, y0 = -h / 2, y1 = h / 2, zf = d * C.depth, yellow = P.mustard;
  K.matte.box(-w / 2, w / 2, y0, y1, -zf, zf, yellow);
  K.matte.box(-w / 2 + 0.02, w / 2 - 0.02, y0 + 0.02, y0 + 0.05, zf, zf + 0.012, shade(yellow, 0.7));
  for (let i = 1, x = -w / 2 + C.tick; x < w / 2 - 0.15; i++, x += C.tick) {
    const big = i % 2 === 0, tw = big ? 0.045 : 0.032, col = big ? P.velvet : P.ink;
    K.matte.box(x - tw, x + tw, big ? y0 + h * 0.12 : y1 - h * 0.55, y1, zf, zf + 0.016, col);
    K.matte.box(x - tw, x + tw, y1, y1 + 0.015, zf - (big ? 0.55 : 0.32), zf, col);
  }
  K.metal.box(w / 2, w / 2 + 0.06, y0 - C.hook, y1 + 0.02, -zf * 0.8, zf * 0.8, P.brass);
  K.metal.add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8).rotateZ(Math.PI / 2).translate(w / 2 + 0.07, y0 - C.hook * 0.45, zf * 0.5), shade(P.brass, 0.75));
}

/** A ribbon as a soft ledge w x h x d: its ends cut swallowtail, gold piping along the edges the stalls see. */
export function ribbon(K, w, h, d, { col = K.pal.velvet, trim = K.pal.gold } = {}) {
  const C = CLOTH.ribbon, zf = d * C.depth, n = Math.min(C.notch, w * 0.08), p = C.piping;
  K.matte.add(extruded([[-w / 2, h / 2], [w / 2, h / 2], [w / 2 - n, 0], [w / 2, -h / 2], [-w / 2, -h / 2], [-w / 2 + n, 0]], zf * 2, -zf), col);
  const xa = -w / 2 + n * 0.7, xb = w / 2 - n * 0.7;
  K.metal.box(xa, xb, h / 2 - p - 0.005, h / 2 - 0.005, zf, zf + 0.02, trim);
  K.metal.box(xa, xb, -h / 2 + 0.005, -h / 2 + p + 0.005, zf, zf + 0.02, trim);
  for (const z of [zf - 0.16, -zf + 0.06]) K.metal.box(xa, xb, h / 2, h / 2 + 0.015, z, z + 0.1, trim);
}

/** The threads a flown piece hangs from: one up from each end of its top, near its back, to the flies (`fly`: their height over the
 *  box's middle, in its metres). */
export function hangers(K, w, h, d, fly) {
  const C = CLOTH.hang, z = -d * C.back, line = K.pal.linen;
  for (const x of [-w / 2 + C.inset, w / 2 - C.inset]) {
    K.matte.add(new THREE.CylinderGeometry(C.r, C.r, fly - h / 2, 4).translate(x, (fly + h / 2) / 2, z), line);
    K.matte.add(new THREE.SphereGeometry(C.r * 1.8, 6, 4).translate(x, h / 2 + C.r, z), shade(line, 0.85));
  }
}

/** Folded felt as a slope: B a box read back (boxes.js) tilted about the depth axis; the kit's frame is set here to its middle. What
 *  shows is the wedge between its top edge and the level of its lower top corner: a sheet laid along the slope over folded layers. */
export function felt(K, B, { sheet = K.pal.rose, layers = [K.pal.sage, K.pal.mustard, K.pal.teal, K.pal.burlap] } = {}) {
  const C = CLOTH.felt, P = K.pal, d = B.d;
  K.frame(new THREE.Matrix4().makeTranslation(B.c.x, B.c.y, B.c.z));
  const top = B.ay.clone().multiplyScalar(B.h / 2), a = top.clone().addScaledVector(B.ax, -B.w / 2), b = top.clone().addScaledVector(B.ax, B.w / 2);
  const [L, H] = a.y <= b.y ? [a, b] : [b, a], rise = H.y - L.y;
  if (rise < 0.05 || Math.abs(H.x - L.x) < 0.05) { feltSlab(K, B.w, B.h, d, sheet); return; }
  const m = (H.y - L.y) / (H.x - L.x), tv = C.sheet * Math.sqrt(1 + m * m), xs = (y) => L.x + (y - L.y + tv) / m;
  K.matte.add(extruded([[L.x, L.y], [xs(L.y), L.y], [H.x, H.y - tv], [H.x, H.y]], d, -d / 2), sheet);
  const n = Math.max(2, Math.round((rise - tv) / C.layer));
  for (let k = 0; k < n; k++) {
    const ya = L.y + ((rise - tv) * k) / n, yb = L.y + ((rise - tv) * (k + 1)) / n, dd = k % 2 ? d - C.inset * 2 : d;
    K.matte.add(extruded([[xs(ya), ya], [H.x, ya], [H.x, yb], [xs(yb), yb]], dd, -dd / 2), shade(layers[k % layers.length], 0.92));
  }
  // the blanket stitch along the sheet's front edge: a stitch every CLOTH.felt.stitch m, down into the felt from the edge
  const len = Math.hypot(H.x - L.x, rise), ux = (H.x - L.x) / len, uy = rise / len, z = d / 2 + 0.015;
  const down = V(ux >= 0 ? uy : -uy, ux >= 0 ? -ux : ux, 0), along = V(ux, uy, 0), thr = P.chalk;
  for (let s = C.stitch * 0.5; s < len - 0.1; s += C.stitch) {
    const q = V(L.x + ux * s, L.y + uy * s, z), q0 = q.clone().addScaledVector(down, 0.02), q1 = q.clone().addScaledVector(down, 0.16), hw = along.clone().multiplyScalar(0.03);
    if (q1.y < L.y + 0.03) continue;
    flat(K.matte, q0.clone().sub(hw), q0.clone().add(hw), q1.clone().add(hw), q1.clone().sub(hw), thr);
  }
}
/** A quad facing the stalls whichever way its corners were given. */
function flat(S, a, b, c, d, col) {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
  if (n.z >= 0) S.quad(a, b, c, d, col); else S.quad(a, d, c, b, col);
}

/** A slab of felt (any felt box a stage gives that is not a slope): the cloth, its front edge blanket-stitched. */
export function feltSlab(K, w, h, d, col = K.pal.teal) {
  K.matte.box(-w / 2, w / 2, -h / 2, h / 2, -d / 2, d / 2, col);
  for (let x = -w / 2 + 0.15; x < w / 2 - 0.1; x += CLOTH.felt.stitch) K.matte.box(x - 0.03, x + 0.03, h / 2 - Math.min(0.16, h * 0.6), h / 2 - 0.02, d / 2, d / 2 + 0.015, K.pal.chalk);
}

/** Sequins as ice, w x h x d (its top a hair over the boards): lamé under a bed of overlapping sequins, each tilted to catch the light;
 *  the front lip trimmed with glass beads. */
export function sequins(K, w, h, d, seed = 0) {
  const P = K.pal, C = CLOTH.sequin, y1 = h / 2, cols = [P.sky, 0xd0d8e0, 0x8fc7c0, P.chalk, 0xb4cde0];
  K.matte.box(-w / 2 + 0.03, w / 2 - 0.03, y1 - 0.03, y1 - 0.004, -d / 2 + 0.08, d / 2 - 0.06, 0x6f9aa6);
  const nx = Math.floor((w - 0.2) / C.dx), nz = Math.floor((d - 0.3) / C.dz);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = seed * 31 + j * 97 + i, x = -w / 2 + 0.12 + i * C.dx + (j % 2) * C.dx * 0.5;
    if (x > w / 2 - 0.12) continue;
    const g = new THREE.CircleGeometry(C.r, 8).rotateX(-Math.PI / 2).rotateX((hash(k) - 0.5) * C.tilt).rotateZ((hash(k + 0.5) - 0.5) * C.tilt);
    K.gloss.add(g.translate(x, y1 + 0.006 + ((i + j) % 3) * 0.004, -d / 2 + 0.16 + j * C.dz), cols[Math.floor(hash(k + 0.25) * cols.length) % cols.length]);
  }
  for (let i = 0, x = -w / 2 + 0.12; x < w / 2 - 0.08; i++, x += C.bead * 2.4) K.gloss.add(new THREE.IcosahedronGeometry(C.bead, 0).translate(x, y1 - C.bead, d / 2 + 0.02), [P.sky, P.chalk, P.steel][i % 3]);
}

/** Honey spilt as goo, w x h x d (its top a hair over the boards): a pool with a rounded edge, reaching the lip and running over it in drips. */
export function honey(K, w, h, d, seed = 0) {
  const C = CLOTH.honey, y = h / 2 - 0.02, pts = [], N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = 1 + 0.06 * Math.sin(3 * a + seed * 6) + 0.04 * Math.sin(5 * a + seed * 2);
    let x = (w / 2) * 0.95 * r * Math.cos(a), z = (d / 2) * 0.9 * r * Math.sin(a);
    if (z > (d / 2) * 0.78) z = d / 2 - 0.01;
    x = Math.max(-w / 2 * 1.02, Math.min(w / 2 * 1.02, x));
    pts.push(new THREE.Vector2(x, -z));
  }
  const pool = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: C.thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.04, bevelSegments: 2, curveSegments: 4 });
  K.gloss.add(pool.rotateX(-Math.PI / 2).translate(0, y + 0.012, 0), C.col);
  // (over the lip: a sheet of it down the boards' edge, and from it drips of every length, each a teardrop: never a row of even legs)
  K.gloss.box(-w * 0.4, w * 0.4, y - 0.08, y + 0.03, d / 2 - 0.005, d / 2 + 0.025, C.col);
  for (let i = 0; i < C.drips; i++) {
    const x = -w * 0.37 + w * 0.74 * ((i + 0.2 + hash(seed + i) * 0.6) / C.drips), L = 0.04 + 0.26 * hash(seed * 3 + i) ** 1.5, r = 0.035 + 0.035 * hash(seed + i * 5);
    K.gloss.add(new THREE.CylinderGeometry(r * 1.6, r * 0.6, L, 7).scale(1, 1, 0.5).translate(x, y - 0.06 - L / 2, d / 2 + 0.012), C.col);
    K.gloss.add(new THREE.SphereGeometry(r, 8, 6).scale(1, 1.25, 0.5).translate(x, y - 0.06 - L, d / 2 + 0.012), C.deep);
  }
  for (let i = 0; i < 3; i++) K.gloss.add(new THREE.SphereGeometry(0.05 + 0.025 * hash(seed + i * 7), 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 1).translate(-w * 0.3 + w * 0.3 * i, y + 0.03, (hash(seed + i) - 0.5) * d * 0.5), C.lit);
}

/** The Climb's vine, h long up the box's middle: two strands of floss twisted about each other, a knot at each foothold (`knots`, their
 *  heights in the box's metres), felt leaves on alternate sides, a knot where it is tied off at the top. */
export function vine(K, h, knots, { col = K.pal.sage } = {}) {
  const C = CLOTH.vine, y0 = -h / 2, dark = shade(col, 0.72);
  for (const k of [0, 1]) {
    const pts = [];
    for (let y = 0; y <= h + 1e-6; y += 0.06) { const a = (y / C.twist) * Math.PI * 2 + k * Math.PI; pts.push(V(Math.cos(a) * C.wrap, y0 + y, Math.sin(a) * C.wrap)); }
    K.matte.add(tube(pts, C.strand, 5), k ? dark : col);
  }
  for (const y of knots) K.matte.add(new THREE.SphereGeometry(C.knot, 8, 6).scale(1.15, 0.8, 1.15).translate(0, y, 0), shade(col, 0.88));
  K.matte.add(new THREE.SphereGeometry(C.knot * 1.3, 8, 6).translate(0, h / 2 - 0.05, 0), shade(col, 0.88));
  for (let i = 0, y = y0 + 0.7; y < h / 2 - 0.4; i++, y += C.leafEvery) {
    const s = i % 2 ? -1 : 1, pts = [];
    for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([u * C.leaf, 0.075 * Math.sin(Math.PI * u)]); }
    for (let j = 9; j >= 1; j--) { const u = j / 10; pts.push([u * C.leaf, -0.06 * Math.sin(Math.PI * u)]); }
    const g = extruded(pts, 0.02, 0.03).rotateZ(s > 0 ? 0.6 : Math.PI - 0.6).translate(0, y, 0);
    K.matte.add(g, i % 3 === 1 ? K.pal.teal : shade(col, 1.1));
  }
}

/** A twisted floss along a box's longest axis (any other thread box), centred. */
export function floss(K, len, axis, col = K.pal.linen) {
  const pts0 = [], pts1 = [], w = CLOTH.vine.wrap * 0.8;
  for (let t = 0; t <= len + 1e-6; t += 0.06) {
    const a = (t / CLOTH.vine.twist) * Math.PI * 2, u = t - len / 2;
    const p = (ph) => (axis === 'x' ? V(u, Math.cos(a + ph) * w, Math.sin(a + ph) * w) : V(Math.cos(a + ph) * w, u, Math.sin(a + ph) * w));
    pts0.push(p(0)); pts1.push(p(Math.PI));
  }
  K.matte.add(tube(pts0, CLOTH.vine.strand * 0.9, 5), col);
  K.matte.add(tube(pts1, CLOTH.vine.strand * 0.9, 5), shade(col, 0.78));
}
