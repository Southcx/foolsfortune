// ---------------------------------------------------------------------------------------
// THE DUEL'S PIECES, MODELLED: the shapes of a puzzle duel's house pieces, each at a cell of side 1, facing +Z (the slab's face),
// centred, for the duel's view to instance (vfx/duelview/pieces.js). A GEM is a feeling (Dovina's COLOURS, board.js) read first by its
// colour and confirmed by its SILHOUETTE, one a feeling so the board reads in greyscale and to the colour-blind (South, 2026-10-27: "the
// gems need to be readily identifiable"; PUZZLE-DUELS.md 20): Wonder a four-point star (a glint), Mirth a sun (a disc with eight rays),
// Desire a heart, Fury a flame (jagged tongues), Gall a hexagon (a cell of the curd), Grief a tear (point up), Dread a crescent (the moon
// half eaten). Any four differ in outline at a 44 px cell: round, pointed, notched and faceted families, never two alike.
// Each gem is a bevelled plaque (its face self-lit: pieces.js) on a KEYLINE: the same outline offset outward and flat behind it, dark
// ink by default and the colour of a state when one holds (preview, picked, weak, the foe's foresight). Everything else is clay: junk a
// cracked dark tile (cracks in its vertex colours), stone a basalt block, the bomb a raku pot with its neck, a fogged piece a plain
// stone of the fog; an ember (Dread's junk, burning down) a coal of glazed clay, its count glowing pips; an orb a drop of Lachryma. The
// two bodies are figurines on a clay ledge (PUZZLE-DUELS.md 13.7): the Courier's in white clay, the foe's its feeling's idol.
//
// Prior art: Bejeweled's shapes-per-colour (the colour-blind cut that became the default: square, diamond, round, hexagon, triangle),
// Candy Crush's candies (one shape a colour, a white highlight and a dark rim), Puyo Puyo's faces on its blobs, Puzzle Quest's gem
// icons, colour-blind design's rule (never colour alone: shape and value too; WeAreColorblind), the haniwa and dogu figurines.
//
//   gemGeometry(aspect) -> BufferGeometry   keylineGeometry(aspect, d) (flat, behind)   plateGeometry(kind) (junk's and the ember's rim)
//   glintGeometry()   emberGeometry() pipGeometry()   junkGeometry() (vertex colours) stoneGeometry() fogStoneGeometry() bombGeometry()
//   slimeGeometry(rim)   orbGeometry() cubeGeometry()   courierFigurine() -> BufferGeometry (vertex colours)   foeIdol()   ledgeGeometry() (vertex colours)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const R = 0.4; // (a gem's radius in a cell)
const CUT = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 2, curveSegments: 10 };
export const GEM_BACK = -(CUT.depth / 2 + CUT.bevelThickness) - 0.012; // (the keyline's z: just behind the plaque's back)

/** A closed outline from points [[x, y], ...] (y up). */
const outline = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
const polar = (n, rOf, a0 = Math.PI / 2) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + a0; const r = rOf(a, i); return [Math.cos(a) * r, Math.sin(a) * r]; });

/** A crescent: a disc (radius r1) with a disc (r2) bitten out of it at (bx, by), as points. */
function crescent(r1, r2, bx, by, n = 28) {
  const d = Math.hypot(bx, by), b = Math.atan2(by, bx), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), al = Math.acos(a / r1), pts = [];
  for (let i = 0; i <= n; i++) { const t = b + al + (i / n) * (Math.PI * 2 - 2 * al); pts.push([Math.cos(t) * r1, Math.sin(t) * r1]); } // (the outer arc, the long way round)
  const ex = Math.cos(b - al) * r1, ey = Math.sin(b - al) * r1, sx = Math.cos(b + al) * r1, sy = Math.sin(b + al) * r1;
  const f0 = Math.atan2(ey - by, ex - bx); let f1 = Math.atan2(sy - by, sx - bx); while (f1 > f0) f1 -= Math.PI * 2; // (the bite's arc back, clockwise about its own centre)
  for (let i = 1; i < n; i++) { const t = f0 + (i / n) * (f1 - f0); pts.push([bx + Math.cos(t) * r2, by + Math.sin(t) * r2]); }
  return pts;
}

/** A feeling's silhouette as points (y up). */
function gemPoints(aspect) {
  const r = R;
  if (aspect === 'wonder') return polar(8, (a, i) => (i % 2 ? r * 0.42 : r * 1.02)); // (the four-point star: a glint)
  if (aspect === 'mirth') return polar(64, (a) => r * (0.8 + 0.2 * Math.pow(Math.max(0, Math.cos(8 * (a - Math.PI / 2))), 6))); // (the sun: a disc, eight short rays)
  if (aspect === 'desire') { const s = new THREE.Shape(); s.moveTo(0, -r * 0.92); // (the heart, its point down)
    s.bezierCurveTo(-r * 1.32, r * 0.05, -r * 0.62, r * 1.12, 0, r * 0.44); s.bezierCurveTo(r * 0.62, r * 1.12, r * 1.32, r * 0.05, 0, -r * 0.92);
    return s.getPoints(14).slice(0, -1).map((p) => [p.x, p.y]); }
  if (aspect === 'fury') return [[0, 1.08], [0.2, 0.46], [0.5, 0.74], [0.44, 0.1], [0.84, -0.18], [0.6, -0.86], [-0.6, -0.86], [-0.84, -0.18], [-0.44, 0.1], [-0.5, 0.74], [-0.2, 0.46]].map(([x, y]) => [x * r, y * r]); // (the flame: three tongues up, a broad foot)
  if (aspect === 'gall') return polar(6, () => r * 0.98, 0); // (the hexagon, flat top)
  if (aspect === 'grief') { const c = -r * 0.24, rr = r * 0.74, a0 = Math.PI / 2 - Math.acos(rr / (r * 1.06 - c)), pts = [[0, r * 1.06]]; // (the tear, its point up)
    for (let i = 0; i <= 20; i++) { const a = a0 - (i / 20) * (Math.PI + 2 * a0); pts.push([Math.cos(a) * rr, c + Math.sin(a) * rr]); }
    return pts; }
  if (aspect === 'dread') return crescent(r * 0.98, r * 0.78, r * 0.46, r * 0.3); // (the crescent: the bite to the upper right)
  return polar(12, () => r * 0.8);
}
const ccw = (pts) => (THREE.ShapeUtils.isClockWise(pts.map(([x, y]) => new THREE.Vector2(x, y))) ? [...pts].reverse() : pts);

/** An outline (counter-clockwise) pushed outward by d: each corner along its bisector, its miter held to 1.7 d (a keyline, never a spike). */
function offsetPoints(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) { const [px, py] = pts[(i + n - 1) % n], [x, y] = pts[i], [nx, ny] = pts[(i + 1) % n];
    let ax = y - py, ay = -(x - px), bx = ny - y, by = -(nx - x); const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1; ax /= la; ay /= la; bx /= lb; by /= lb;
    let mx = ax + bx, my = ay + by; const lm = Math.hypot(mx, my) || 1; mx /= lm; my /= lm; const k = Math.min(1.7, 1 / Math.max(0.2, mx * ax + my * ay));
    out.push([x + mx * d * k, y + my * d * k]); }
  return out;
}

const GEMS = new Map();
/** A feeling's gem: its silhouette cut as a bevelled plaque (the bevel's facets carry its highlight and its shade). */
export function gemGeometry(aspect) {
  let g = GEMS.get(aspect); if (g) return g;
  g = new THREE.ExtrudeGeometry(outline(ccw(gemPoints(aspect))), CUT); g.translate(0, 0, -CUT.depth / 2); g.computeVertexNormals();
  GEMS.set(aspect, g); return g;
}
/** A gem's keyline: its outline offset by d past the bevel's reach, flat, just behind the plaque. */
export function keylineGeometry(aspect, d = 0.06) {
  const g = new THREE.ShapeGeometry(outline(offsetPoints(ccw(gemPoints(aspect)), CUT.bevelSize + d))); g.translate(0, 0, GEM_BACK); return g;
}
/** A plate behind junk (a rounded square) or an ember (a round): its rim, in the ember's light. */
export function plateGeometry(kind) {
  const g = kind === 'ember' ? new THREE.CircleGeometry(0.47, 24) : new THREE.ShapeGeometry(outline(polar(40, (a) => 0.49 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 6) + Math.pow(Math.abs(Math.sin(a)), 6), 1 / 6), 0)));
  g.translate(0, 0, -0.12); return g;
}
/** A glint: a small four-point star (the weak colour's spark). */
export const glintGeometry = () => new THREE.ShapeGeometry(outline(polar(8, (a, i) => (i % 2 ? 0.05 : 0.2))));

/** A slime (an aberrant slip jelly's junk, ABERRANTS.md 5): a glossy blob sagging to its foot, a lip of it run down one side; `rim`
 *  the same blob a little larger for its keyline behind it. */
export function slimeGeometry(rim = false) {
  const g = new THREE.IcosahedronGeometry(0.4, 3), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const sag = v.y < 0 ? 1 + 0.18 * (-v.y / 0.4) : 1 - 0.1 * (v.y / 0.4); // (a drop settling: wide at its foot, its top drawn in)
    v.x *= sag; v.z *= 0.62 * sag; v.y *= 0.9; if (v.y < -0.2 && v.x > 0.05) v.y -= 0.08 * Math.sin((v.x / 0.4) * Math.PI); p.setXYZ(i, v.x, v.y, v.z); } // (a lip run down)
  if (rim) { g.scale(1.1, 1.1, 0.5); g.translate(0, 0, -0.08); }
  g.computeVertexNormals(); return g;
}

/** An ember: a coal of glazed clay, a lump flattened toward the face. */
export function emberGeometry() { const g = new THREE.IcosahedronGeometry(0.38, 1); g.scale(1, 0.88, 0.6); g.computeVertexNormals(); return g; }
/** An ember's pip: one turn left to burn. */
export const pipGeometry = () => new THREE.IcosahedronGeometry(0.075, 0);
/** Junk: a dark clay tile, cracked across its face (the cracks in its vertex colours, under the instance's). */
export function junkGeometry() {
  const tile = paint(new RoundedBoxGeometry(0.84, 0.84, 0.2, 1, 0.08), 0xffffff), cracks = [];
  const seg = (x0, y0, x1, y1, w = 0.034) => { const L = Math.hypot(x1 - x0, y1 - y0), g = new THREE.BoxGeometry(L, w, 0.02); g.rotateZ(Math.atan2(y1 - y0, x1 - x0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0.1); cracks.push(paint(g, 0x120c0a)); };
  seg(-0.36, 0.3, -0.1, 0.08); seg(-0.1, 0.08, 0.05, 0.14); seg(0.05, 0.14, 0.34, -0.28); seg(-0.1, 0.08, -0.26, -0.22, 0.026); seg(0.16, -0.02, 0.3, 0.24, 0.022);
  const g = mergeGeometries([tile, ...cracks]); g.computeVertexNormals(); return g;
}
/** A fogged piece: a plain stone of the fog (no hue, no silhouette: dread.js fogShows 'shape'), so the stacks read by their height. */
export const fogStoneGeometry = () => new RoundedBoxGeometry(0.8, 0.8, 0.14, 2, 0.12);
export const stoneGeometry = () => new THREE.BoxGeometry(0.95, 0.95, 0.26);
export const cubeGeometry = () => new THREE.BoxGeometry(1, 1, 1);
export function bombGeometry() {
  const body = new THREE.IcosahedronGeometry(0.36, 1); body.translate(0, -0.04, 0);
  const neck = new THREE.CylinderGeometry(0.1, 0.13, 0.12, 8); neck.translate(0, 0.34, 0);
  const ni = (x) => (x.index ? x.toNonIndexed() : x), g = mergeGeometries([ni(body), ni(neck)]); g.computeVertexNormals(); return g;
}
/** A drop of Lachryma, its point up (a lathe). */
export function orbGeometry() {
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, y = -0.3 + t * 0.66, r = t < 0.42 ? Math.sin((t / 0.42) * Math.PI / 2) * 0.27 : 0.27 * Math.pow(Math.max(0, 1 - (t - 0.42) / 0.58), 1.35); pts.push(new THREE.Vector2(Math.max(0.002, r), y)); }
  pts[0].x = 0.002; return new THREE.LatheGeometry(pts, 10);
}

/** Vertex colours on a geometry, one colour (sRGB hex, taken to linear as THREE.Color does). */
function paint(g, hex) {
  g = g.index ? g.toNonIndexed() : g; const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g;
}
/** The little clay ledge a figurine stands on (its shadow on the slab says it stands on the face). */
export function ledgeGeometry() { const g = new THREE.BoxGeometry(0.66, 0.1, 0.34); g.translate(0, -0.42, 0.06); return paint(g, 0x8a5638); }

/** The Courier's figurine: white clay, a pale head, the dark of the mask's eye band; on its ledge. */
export function courierFigurine() {
  const body = new THREE.CylinderGeometry(0.13, 0.2, 0.42, 10); body.translate(0, -0.16, 0);
  const head = new THREE.SphereGeometry(0.15, 12, 8); head.translate(0, 0.19, 0);
  const band = new THREE.BoxGeometry(0.22, 0.05, 0.06); band.translate(0, 0.2, 0.12);
  const g = mergeGeometries([paint(body, 0xe6d8c3), paint(head, 0xefe4d2), paint(band, 0x2a2236), ledgeGeometry()]);
  g.computeVertexNormals(); return g;
}
/** The foe's idol: a ten-pointed star of its feeling (coloured by its material), the board's stand-in for the Figment. */
export function foeIdol() {
  const g = new THREE.ExtrudeGeometry(outline(polar(10, (a) => { const i = Math.round(((a - Math.PI / 2) / (Math.PI * 2)) * 10); return i % 2 ? 0.2 : 0.42; })), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 1 });
  g.center(); g.computeVertexNormals(); return g;
}
