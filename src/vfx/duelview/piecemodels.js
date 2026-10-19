// ---------------------------------------------------------------------------------------
// THE DUEL'S PIECES, MODELLED: the shapes of a puzzle duel's house pieces (board v11, figure 03), each at a cell of side 1, facing +Z
// (the slab's face), centred, for the duel's view to instance (vfx/duelview/pieces.js). Gems are Lachrymite, cut: each feeling a shape
// of its own so a gem reads without its colour (the colour-blind, the 480-line present): Wonder a hexagon (frost is hexagonal), Mirth
// a round (its drops), Desire a heart, Fury a diamond (its cracks' points), Gall a trefoil (its curds), Grief a tear, Dread an eye (its
// pupil a hole through to the slab: marbling's dark centre). Everything else is clay: junk a grog tile, stone a basalt block, the bomb a
// raku pot with its neck; an ember (Dread's junk, burning down) a coal of glazed clay, its count glowing pips; a
// orb is a drop of Lachryma. The two bodies are figurines on a clay ledge (a body never falls: it stands
// on the face of its cell, PUZZLE-DUELS.md 13.7): the Courier's in white clay, the foe's its feeling's idol.
//
// Prior art: Super Puzzle Fighter II Turbo's gems (cut stones, a family a colour), Bejeweled's shapes-per-colour (the colour-blind mode
// that became the default), the haniwa and dogū (clay figurines standing for a person), a Japanese raku tea bowl's crackle.
//
//   gemGeometry(aspect) -> BufferGeometry   emberGeometry() pipGeometry()   junkGeometry() stoneGeometry() bombGeometry() orbGeometry() cubeGeometry()
//   courierFigurine() -> BufferGeometry (vertex colours)   foeIdol() -> BufferGeometry   ledgeGeometry() (vertex colours)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const R = 0.4; // (a gem's radius in a cell: the mock's s * 0.4)
const CUT = { depth: 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 1, curveSegments: 6 };

/** A closed outline from points [[x, y], ...] (y up). */
const outline = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
const polar = (n, rOf) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + Math.PI / 2; const r = rOf(a); return [Math.cos(a) * r, Math.sin(a) * r]; });

function gemShape(aspect) {
  const r = R;
  if (aspect === 'wonder') return outline(polar(6, () => r));
  if (aspect === 'mirth') return outline(polar(18, () => r * 0.9));
  if (aspect === 'desire') { // (the mock's heart, its point down)
    const s = new THREE.Shape(); s.moveTo(0, -r * 0.9);
    s.bezierCurveTo(-r * 1.3, r * 0.05, -r * 0.6, r * 1.1, 0, r * 0.42); s.bezierCurveTo(r * 0.6, r * 1.1, r * 1.3, r * 0.05, 0, -r * 0.9); return s;
  }
  if (aspect === 'fury') return outline([[0, r * 1.04], [r * 0.8, 0], [0, -r * 1.04], [-r * 0.8, 0]]);
  if (aspect === 'gall') return outline(polar(36, (a) => r * (0.66 + 0.3 * Math.cos(3 * (a - Math.PI / 2)))));
  if (aspect === 'grief') { // a tear, its point up: the top, then the round of its foot (tangent from the point)
    const c = -r * 0.26, rr = r * 0.74, a0 = Math.PI / 2 - Math.acos(rr / (r * 1.02 - c)), pts = [[0, r * 1.02]];
    for (let i = 0; i <= 16; i++) { const a = a0 - (i / 16) * (Math.PI + 2 * a0); pts.push([Math.cos(a) * rr, c + Math.sin(a) * rr]); }
    return outline(pts);
  }
  if (aspect === 'dread') { // the eye: a vesica, its pupil a hole
    const s = new THREE.Shape(); s.moveTo(-r * 1.02, 0); s.quadraticCurveTo(0, r * 1.2, r * 1.02, 0); s.quadraticCurveTo(0, -r * 1.2, -r * 1.02, 0);
    const h = new THREE.Path(); h.absarc(0, 0, r * 0.26, 0, Math.PI * 2, true); s.holes.push(h); return s;
  }
  return outline(polar(12, () => r * 0.8));
}

const GEMS = new Map();
/** A feeling's gem, cut (extruded with a bevel: flat-shaded facets catch the sun). */
export function gemGeometry(aspect) {
  let g = GEMS.get(aspect); if (g) return g;
  g = new THREE.ExtrudeGeometry(gemShape(aspect), CUT); g.center(); g.computeVertexNormals();
  GEMS.set(aspect, g); return g;
}

/** An ember: a coal of glazed clay, a lump flattened toward the face. */
export function emberGeometry() { const g = new THREE.IcosahedronGeometry(0.38, 1); g.scale(1, 0.88, 0.6); g.computeVertexNormals(); return g; }
/** An ember's pip: one turn left to burn. */
export const pipGeometry = () => new THREE.IcosahedronGeometry(0.075, 0);
export const junkGeometry = () => new RoundedBoxGeometry(0.82, 0.82, 0.2, 1, 0.08);
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
