// ---------------------------------------------------------------------------------------
// THE LEAF CANOPY: a tree's crown drawn from a few spheres whose every vertex is a leaf (the owner, 2026-10-08, through Dovina: "trees
// from billboarded leaf quads ... each quad keeps its sphere's normal for the lighting. A vertex shader turns the quads to the camera and
// sways them"; docs/plans/MYCELIUM.md section 4). One program for every canopy in the garden (the cocoon tree's, the Mulberry Grove's,
// Myggdrasil's gills), one draw for as many canopies as are built together.
//
//   THE SPHERES  a canopy is a few spheres { c, r }; each is an icosphere of low detail (more detail for a bigger sphere, so the leaves
//                keep one spacing), jittered so the lattice never shows, and a smaller shell inside it (darker: the crown's depth). A
//                vertex deep inside another sphere is dropped (no one sees it)
//   A LEAF       four vertices at the sphere vertex: in the colour pass the vertex shader puts them round it facing the camera (view-
//                space offsets, turned by the leaf's own angle) and sways the centre slowly by the world position and the wind; the
//                normal is the SPHERE's, so the crown is lit as one soft round mass. Each quad is a clump of leaves from the atlas,
//                leaning a third of the way to its sphere's surface (shingled, never square to the eye: CASEBOOK rule 120), shrinking
//                away near the eye (a camera inside a crown sees it open round it), a little larger far off (a crown stays a mass), and
//                not drawn at all on the far side of its sphere (the near side and the inner shell hide it). A sphere may be squashed
//                into an ellipsoid and halved (a cap's dome over its gills), and a canopy may open by its slot's GATE: each leaf shows
//                once the gate passes its phase (its distance out from the axis), so a cap opens from its middle out (canopyOpen), and
//                an entry's leaves can be hidden in the index, from the shadow pass too (canopyShow)
//   THE ATLAS    painted on a canvas once (4 x 2 cells of 128 px): gingko fans, willow blades, round leaves, mulberry leaves, and for
//                Myggdrasil a comb of gills and a cap's shingled scales (both turned out from the axis by the vertex shader: a cap's
//                gills radiate from its stipe, its scales point to its rim). Red is the gold (veins and rims), green the leaf's own light (dark at its
//                base), blue which leaf of the clump, alpha the coverage. Its mips are made here, cell by cell (no cell bleeds into
//                its neighbour), each level's alpha scaled so as much of a cell passes the cut as at full size (the canopy never thins
//                to a sparkle as it recedes: Unity's "mip maps preserve coverage"); every level a canvas, uploaded premultiplied
//   THE EDGE     alpha to coverage where the frame has samples (the scene's target has four), the alpha sharpened to one pixel by its own
//                derivative first (Ben Golus, "Anti-aliased Alpha Test: The Esoteric Alpha To Coverage"); a plain cut at one half where
//                it has none, or where the rasterizer is software (SwiftShader speckles alpha to coverage: coverageTrusted). Either way
//                the edge is stable from frame to frame: it moves only when a leaf does
//   THE COLOUR   labradorite (vfx/labradorite.js: its palette and phase, shared): a dark stone whose flash walks ultramarine, blue,
//                peacock and green with where on the crown the leaf is and where it is seen from (so a crown turns its colours as you
//                go round it), in broad bands, brighter at the crown's turn; edged and
//                veined in gold, the gold's own glow a little more by night (low and steady); lit through when the sun is behind the
//                crown. A canopy may take a TINT (Myggdrasil's tincture): its flash leans to that colour, keeping its value. The tints
//                are a 64-texel table (one uniform for every canopy): slot 0 is the plain stone the many share
//   THE SHADOW   the colour pass draws the quads; the sun's shadow pass draws the same four vertices where they really are, a square
//                lying on the sphere a little inside it (no new depth program: three's own depth material draws them), so a crown
//                casts the round shadow of its spheres
//
// Prior art: the billboard-leaf canopy of Breath of the Wild's trees and of many stylised indie trees (Ghibli-like crowns: a few spheres,
// quads turned to the eye, normals from the sphere: the "fluffy tree" shader passed round by Minions Art and others), alpha to coverage
// with sharpened alpha and coverage-preserving mips (Ben Golus, 2017), the leaves themselves (Ginkgo biloba's fan, the weeping willow,
// the white mulberry the silk moth eats, the gills of an agaric) and labradorite's schiller.
//
//   const C = new LeafCanopy({ spheres: [{ c: [0, 4, 0], r: 1.6 }], leaf: 'gingko', density: 1, tint: { color: 0xc06a3a, amount: 0.6 } })
//   group.add(C.mesh)   C.tint(color, amount)   C.dispose()
//   canopyGeometry([{ spheres, leaf, density, seed, slot, matrix }]) -> one geometry for many canopies (drawn with canopyMaterial())
//   canopyTick({ t, wind, night })   (only outside the garden: in it the grounds' clock drives the time and the night)
//   LEAF_KINDS   canopyMaterial()   canopySlot() / canopyTint(slot, color, amount) / canopyOpen(slot, k) / canopyFree(slot)
//   canopyShow(geometry, geometry.userData.ranges[i], on)   (one entry's leaves hidden or shown: Myggdrasil's caps)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';

/** The leaves the atlas holds: each a list of its cells (a kind with two is drawn from both, so no two clumps repeat). */
export const LEAF_KINDS = { gingko: [0, 6], willow: [1], round: [2, 7], mulberry: [3], gill: [4], cap: [5] };
const LEAF_MAX = 4; // (m: the largest leaf quad; a leaf's size is stored as a share of it)
const CELL = 128, COLS = 4, ROWS = 2, TINTS = 64;
const KEY = 'leaf-canopy-2';

// ---- the material: one for every canopy (made on first need; shared, never disposed)
const U = {
  tLeaf: { value: null }, tCanopyTint: { value: null }, uCanopyWind: { value: new THREE.Vector3(0.09, 0.015, 0.06) }, uLeafHard: { value: 0 },
  uGTime: GROUND_UNIFORMS.uGTime, uGNight: GROUND_UNIFORMS.uGNight, uMindT: mindTime,
};
let MAT = null, tintTex = null;
const slots = new Uint8Array(TINTS); slots[0] = 1;

const VERT_DECL = /* glsl */`
attribute vec2 aCorner;
attribute vec4 aLeaf;
attribute vec2 aTree;
uniform float uGTime;
uniform vec3 uCanopyWind;
uniform sampler2D tCanopyTint;
varying vec2 vLeafUv;
varying vec4 vLeafTint;
varying vec3 vLeafW;
varying vec3 vLeafEye;
varying float vLeafDepth;
varying float vLeafVar;
// the basis a leaf's shadow square was laid in (the builder's own: leafBasis in leafcanopy.js), to find its centre again
void leafBasis(vec3 n, out vec3 t, out vec3 b) {
  t = normalize(cross(n, abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  b = cross(n, t);
}
`;
const VERT_CENTRE = /* glsl */`
  float lsize = aLeaf.x * ${LEAF_MAX.toFixed(1)};
  { vec3 lt, lb; leafBasis(normal, lt, lb); transformed = position + normal * (0.12 * lsize) - (lt * aCorner.x + lb * aCorner.y) * (0.42 * lsize); }
`;
const VERT_PROJECT = /* glsl */`
  vec4 lwC = modelMatrix * vec4(transformed, 1.0);
  float lms = length(modelMatrix[0].xyz); // (a canopy in a scaled group: its leaves and their sway scale with it)
  float lph = aTree.y * 6.2832 + dot(lwC.xyz, vec3(0.11, 0.05, 0.09));
  float lsw = 0.62 * sin(uGTime * 0.52 + lph) + 0.38 * sin(uGTime * 0.29 + lph * 1.7 + 1.3);
  lwC.xyz += uCanopyWind * (lsw * lms * (0.35 + 0.65 * aLeaf.w)); // (the sway: slow, the outer leaves more)
  vec4 mvPosition = viewMatrix * lwC;
  float lgrow = 1.0 + clamp((-mvPosition.z - 24.0) / 60.0, 0.0, 0.5); // (far off a leaf grows a little: the crown stays a mass, never single pixels)
  lgrow *= smoothstep(0.8, 2.2, -mvPosition.z); // (and at the eye it shrinks away: the crown opens round a camera inside it, no quad near the near plane)
  vLeafEye = normalize(cameraPosition - lwC.xyz);
  if (aLeaf.w > 0.99 && dot(normalize(mat3(modelMatrix) * normal), vLeafEye) < -0.3) lgrow = 0.0; // (an outer leaf on the far side of its sphere: hidden by the near side and the inner shell, so never drawn)
  float lcell = floor(aLeaf.z * 7.0 + 0.5);
  vec2 lslot = vec2((floor(aTree.x * 255.0 + 0.5) + 0.5) / ${TINTS.toFixed(1)}, 0.25);
  lgrow *= clamp((texture2D(tCanopyTint, vec2(lslot.x, 0.75)).r * 1.15 - aTree.y) / 0.15, 0.0, 1.0); // (the slot's open gate: a leaf shows once the gate passes its phase, so a cap grown from its middle out opens as the gate rises; 1 for every plain canopy)
  float lrot = aLeaf.y * 6.2832 + 0.08 * sin(uGTime * 0.61 + lph * 2.3);
  float lc = cos(lrot), ls = sin(lrot);
  vec2 lux = vec2(lc, ls), luy = vec2(-ls, lc);
  bool lturned = lcell > 3.5 && lcell < 5.5;
  if (lturned) { vec3 lrad = normalMatrix * vec3(normal.x, 0.0, normal.z); luy = normalize(lrad.xy + luy * 0.12 + 1e-5); lux = vec2(luy.y, -luy.x); } // (gills and cap scales run out from the axis: the cell's up turned along the leaf's own outward direction as the eye sees it, easing to its random turn where that direction points at the eye, never a snap)
  vec2 loff = (lux * aCorner.x + luy * aCorner.y) * (0.5 * lsize * lms * lgrow);
  vec3 lnv = normalize(normalMatrix * normal);
  if (lturned) { float lnl = length(lnv.xy); if (lnl > 1e-3) { vec2 lnp = lnv.xy / lnl; loff -= lnp * dot(loff, lnp) * (0.6 * (1.0 - abs(dot(lnv, normalize(-mvPosition.xyz))))); } } // (seen edge on, at a dome's outline, a scale lies along the outline: the cap's edge stays a smooth curve, never a row of bumps)
  mvPosition.xy += loff;
  mvPosition.z -= dot(loff, lnv.xy) * 0.35 - (aCorner.x * 0.37 + aCorner.y * 0.21) * 0.01 * lsize * lms; // (each leaf leans a third of the way to its sphere's surface, shingled, and never lies square to the eye: no two cut through each other in a hard line, and no rasterizer meets a quad of one depth)
  gl_Position = projectionMatrix * mvPosition;
  vLeafUv = (vec2(mod(lcell, 4.0), 1.0 - floor(lcell / 4.0)) + (aCorner * 0.5 + 0.5)) * vec2(0.25, 0.5); // (cell 0 is the canvas's top left: the texture's top half)
  vLeafTint = texture2D(tCanopyTint, lslot);
  vLeafW = lwC.xyz; vLeafDepth = aLeaf.w; vLeafVar = fract(aTree.y * 7.31);
`;
const FRAG_DECL = /* glsl */`
uniform sampler2D tLeaf;
uniform float uLeafHard, uGNight;
varying vec2 vLeafUv;
varying vec4 vLeafTint;
varying vec3 vLeafW;
varying vec3 vLeafEye;
varying float vLeafDepth;
varying float vLeafVar;
${LAB_GLSL}
`;
const FRAG_COLOUR = /* glsl */`
  vec4 lf = texture2D(tLeaf, vLeafUv); // (premultiplied: filtered as it should be, divided back here)
  vec3 lfc = lf.rgb / max(lf.a, 0.004);
  vec4 lg4 = texture2D(tLeaf, vLeafUv, 0.5);
  float lgold = lg4.r / max(lg4.a, 0.004) * 0.9; // (the gold read half a mip softer than the edge: a rim of a pixel never flickers as the crown moves)
  vec3 lnV = normalize(vNormal);
  float lturn = 1.0 - abs(dot(lnV, normalize(vViewPosition))); // (0 where the crown faces the eye .. 1 at its turn)
  float lph = labPhase(vLeafW, vLeafEye) + 0.16 * (lfc.b - 0.5) + 0.21 * vLeafVar;
  float lhue = 0.3 * lph + 0.55 * lturn + 0.18 * lnV.y + 0.1 * lnV.x; // (the hue by where on the crown and from where: a crown walks its colours as you go round it, as the stone does when it is turned)
  float lband = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(lph * 12.566 + 2.5 * lturn));
  vec3 lstone = labradorite(0.07 + abs(fract(lhue) * 2.0 - 1.0) * 0.53); // (the leaf's flash kept to ultramarine, blue, peacock and green, there and back: the gold is the veins')
  { float ly = dot(lstone, vec3(0.2126, 0.7152, 0.0722)), ty = max(dot(vLeafTint.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.02);
    lstone = mix(lstone, vLeafTint.rgb * min(ly / ty, 4.0), vLeafTint.a); } // (the tint: the flash leaned to its colour, its value kept)
  vec3 lbody = mix(LAB_INK * 6.0, lstone * 0.56, 0.5 + 0.45 * lband);
  lbody *= mix(0.7, 1.0, lfc.g) * mix(0.62, 1.0, vLeafDepth);
  vec3 lgoldC = labLin(vec3(0.95, 0.77, 0.36));
  diffuseColor.rgb = mix(lbody, lgoldC * mix(0.5, 0.8, vLeafDepth), lgold);
`;
const FRAG_CUT = /* glsl */`
  {
    float lcov = lf.a;
    if (uLeafHard > 0.5) { if (lcov < 0.5) discard; diffuseColor.a = 1.0; } // (no samples: a plain cut, stable because the mips keep their coverage)
    else { float la = clamp((lcov - 0.5) / max(fwidth(lcov), 1e-4) + 0.5, 0.0, 1.0); if (la < 0.004) discard; diffuseColor.a = la; } // (alpha to coverage, sharpened to a pixel)
  }
`;
const FRAG_ROUGH = /* glsl */`
  roughnessFactor = mix(roughnessFactor, 0.42, lgold);
`;
const FRAG_GLOW = /* glsl */`
  {
    float lndv = abs(dot(normalize(vNormal), normalize(vViewPosition)));
    totalEmissiveRadiance += lstone * (lband * pow(1.0 - lndv, 1.6) * 0.07 * (1.0 - lgold)); // (the schiller at the crown's turn)
    totalEmissiveRadiance += lgoldC * (lgold * (0.02 + 0.07 * uGNight)); // (the gilding's own glow: a little more by night, steady)
  }
`;
const FRAG_THROUGH = /* glsl */`
  #if NUM_DIR_LIGHTS > 0
  {
    float lback = pow(clamp(dot(-geometryViewDir, directionalLights[0].direction), 0.0, 1.0), 4.0);
    float lrim = 1.0 - abs(dot(geometryNormal, geometryViewDir));
    reflectedLight.directDiffuse += directionalLights[0].color * mix(lstone * 0.5, lgoldC, lgold) * (lback * (0.25 + 0.75 * lrim) * 0.35 * vLeafDepth); // (lit through when the sun is behind the crown)
  }
  #endif
`;

/** The one material every canopy is drawn with. */
export function canopyMaterial() {
  if (MAT) return MAT;
  U.tLeaf.value = leafAtlas(); U.tCanopyTint.value = tintTable();
  MAT = new THREE.MeshStandardMaterial({ name: 'leaf-canopy', roughness: 0.72, metalness: 0, alphaToCoverage: coverageTrusted() }); // (decided once, before the first compile: the choice is in the program's key)
  MAT.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VERT_DECL + sh.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_CENTRE}`)
      .replace('#include <project_vertex>', VERT_PROJECT);
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader
      .replace('#include <map_fragment>', FRAG_COLOUR)
      .replace('#include <alphatest_fragment>', FRAG_CUT)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${FRAG_ROUGH}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_GLOW}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${FRAG_THROUGH}`);
  };
  MAT.customProgramCacheKey = () => KEY;
  MAT.userData.shared = true; MAT.userData.noMerge = true; MAT.userData.canopy = U; // (its uniforms, for a test to read)
  return MAT;
}

/** Can alpha to coverage be trusted here? A software rasterizer cannot: SwiftShader (the headless browser's, and a GPU-less player's)
 *  drops samples in rows even at an alpha of one, so every leaf is speckled with what is behind it (the casebook, 2026-10-08). Asked
 *  once, of a throwaway context, by its renderer's name. */
let trusted = null;
function coverageTrusted() {
  if (trusted !== null) return trusted;
  try {
    const gl = document.createElement('canvas').getContext('webgl2'), dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = gl ? `${gl.getParameter(gl.RENDERER)} ${dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''}` : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    trusted = !!gl && !/swiftshader|llvmpipe|software/i.test(name);
  } catch { trusted = false; }
  return trusted;
}
/** A canopy's mesh is told before each draw whether the frame it draws into has samples (alpha to coverage) or not (a plain cut). */
const aaOf = new WeakMap();
function coverageCheck(renderer) {
  const rt = renderer.getRenderTarget();
  let aa;
  if (rt) aa = rt.samples > 0;
  else { aa = aaOf.get(renderer); if (aa === undefined) { aa = !!renderer.getContext().getContextAttributes?.()?.antialias; aaOf.set(renderer, aa); } }
  U.uLeafHard.value = aa && MAT?.alphaToCoverage ? 0 : 1;
}

// ---- the tints: a table of 64 slots, slot 0 the plain stone; its first row a slot's tint, its second its open gate (red: 0 shut ..
// 1 open, every leaf shown; a canopy grown from its middle out, Myggdrasil's caps, opens as the gate rises: vfx/garden/myggdrasil.js)
function tintTable() {
  if (tintTex) return tintTex;
  const d = new Uint8Array(TINTS * 2 * 4); for (let i = 0; i < TINTS; i++) d[(TINTS + i) * 4] = 255;
  tintTex = new THREE.DataTexture(d, TINTS, 2, THREE.RGBAFormat, THREE.UnsignedByteType);
  tintTex.minFilter = tintTex.magFilter = THREE.NearestFilter; tintTex.generateMipmaps = false; tintTex.needsUpdate = true;
  return tintTex;
}
/** A slot of its own for a canopy that will take a tint or open by its gate (0 when the table is full: it stays the plain stone, open). */
export function canopySlot() { for (let i = 1; i < TINTS; i++) if (!slots[i]) { slots[i] = 1; return i; } return 0; }
export function canopyFree(slot) { if (slot > 0) { slots[slot] = 0; canopyTint(slot, 0x000000, 0); canopyOpen(slot, 1); } }
/** A slot's open gate, 0 (no leaf shown) .. 1 (every leaf): a leaf shows when the gate passes its phase (canopyGeometry's `grow`). */
export function canopyOpen(slot, k = 1) {
  if (!(slot > 0)) return; const T = tintTable(), i = (TINTS + slot) * 4, v = Math.round(THREE.MathUtils.clamp(k, 0, 1) * 255);
  if (T.image.data[i] !== v) { T.image.data[i] = v; T.needsUpdate = true; }
}
/** A slot's tint: `color` (hex or Color) at `amount` (0 the plain stone .. 1 its flash wholly that colour). */
export function canopyTint(slot, color, amount = 1) {
  if (!(slot > 0)) return; const T = tintTable(), d = T.image.data, c = _c.set(color); // (stored in linear light, as the stone's palette is mixed)
  d[slot * 4] = Math.round(THREE.MathUtils.clamp(c.r, 0, 1) * 255); d[slot * 4 + 1] = Math.round(THREE.MathUtils.clamp(c.g, 0, 1) * 255); d[slot * 4 + 2] = Math.round(THREE.MathUtils.clamp(c.b, 0, 1) * 255);
  d[slot * 4 + 3] = Math.round(THREE.MathUtils.clamp(amount, 0, 1) * 255); T.needsUpdate = true;
}
/** Outside the garden (a workbench stage): the canopies' time (s), wind (m of sway) and night (0..1). In the garden the grounds' clock
 *  (vfx/garden/gardengrounds.js groundTick) keeps the time and the night. */
export function canopyTick({ t = null, wind = null, night = null } = {}) {
  if (t !== null) U.uGTime.value = t % 3600;
  if (night !== null) U.uGNight.value = night;
  if (wind) U.uCanopyWind.value.copy(wind);
  mindTick();
}

// ---- the geometry
/** The basis a leaf's shadow square is laid in, from its (stored) normal: the shader's leafBasis, the same arithmetic. */
function leafBasis(n, t, b) {
  const up = Math.abs(n.y) < Math.fround(0.9); t.set(up ? 0 : 1, up ? 1 : 0, 0); t.crossVectors(n, t).normalize(); b.crossVectors(n, t);
}
const icoCache = new Map();
/** The unique directions of an icosphere of `detail` (three's subdivision: 10 (d + 1)^2 + 2 of them). */
function icoDirs(detail) {
  if (icoCache.has(detail)) return icoCache.get(detail);
  const g = new THREE.IcosahedronGeometry(1, detail), P = g.attributes.position, seen = new Map(), out = [];
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`; if (!seen.has(k)) { seen.set(k, 1); out.push(new THREE.Vector3(x, y, z).normalize()); } }
  g.dispose(); icoCache.set(detail, out); return out;
}

/** Leaves for many canopies, one geometry (drawn with canopyMaterial()). Each entry: `spheres` [{ c: [x,y,z] | Vector3, r }] in its own
 *  frame, `matrix` (that frame into the mesh's), `leaf` (a LEAF_KINDS name), `density` (1: the leaves' own spacing), `size` (m: the
 *  leaf quad; by default from the radius), `seed`, `slot` (its tint's and gate's), `shell` (the inner shell's share of the radius),
 *  `unify` (how far each normal leans to the whole crown's, so many spheres light as one mass). A sphere may say for itself: `squash`
 *  [x, y, z] (an ellipsoid: a cap's dome is a sphere squashed in y), `half` (+1 its upper half only, -1 its lower), `hole` (m: no leaf
 *  nearer its axis than this, where a stipe runs through), `leaf`, `size`, `shell` (0: none), `slot`, `grow` (each leaf's phase is how far
 *  out from the axis it lies, so the slot's gate opens it from the middle out) and `radial` (+1 or -1: each normal leans out from the
 *  axis and up or down, as gills face, whatever the ellipsoid's own). The geometry's `userData.ranges` [{ first, count }] are its
 *  entries' leaves (canopyShow). */
export function canopyGeometry(entries) {
  const L = [], ranges = []; // (the leaves: [cx, cy, cz, nx, ny, nz, size, rot, cell, depth, slot, phase])
  for (const E of entries) {
    const first = L.length / 12, rnd = lcg(E.seed ?? 1), M = E.matrix || IDENT, density = E.density ?? 1;
    const sc = new THREE.Vector3().setFromMatrixScale(M), scale = Math.max(sc.x, sc.y, sc.z), rot = new THREE.Matrix3().getNormalMatrix(M);
    const S = E.spheres.map((s) => ({ ...s, c: Array.isArray(s.c) ? new THREE.Vector3(...s.c) : s.c.clone(), q: new THREE.Vector3(...(s.squash || [1, 1, 1])), cells: LEAF_KINDS[s.leaf || E.leaf] || LEAF_KINDS.round }));
    const whole = new THREE.Vector3(); let wsum = 0; for (const s of S) { const w = s.r ** 3; whole.addScaledVector(s.c, w); wsum += w; } whole.divideScalar(wsum || 1);
    const unify = E.unify ?? 0.3, inside = (p, o) => { _w.copy(p).sub(o.c).divide(o.q).divideScalar(o.r); return _w.length() < 0.82 && (!o.half || _w.y * o.half > -0.02); };
    for (const s of S) {
      const size = (s.size ?? E.size ?? THREE.MathUtils.clamp(s.r * 0.5, 0.45, 1.6)) * scale, spacing = size * 0.5 / Math.sqrt(density) / scale;
      const ab = (s.q.x * s.q.y) ** 1.6075, ac = (s.q.x * s.q.z) ** 1.6075, bc = (s.q.y * s.q.z) ** 1.6075, area = 4 * Math.PI * s.r * s.r * ((ab + ac + bc) / 3) ** (1 / 1.6075); // (Thomsen's ellipsoid area)
      const want = area / (spacing * spacing), detail = Math.max(1, Math.round(Math.sqrt(Math.max(0, want - 2) / 10)) - 1), shell = s.shell ?? E.shell ?? 0.6;
      for (const [layer, d, rr, sz] of [[1, detail, 1, 1], [shell, Math.max(1, detail - 2), shell, 0.9]]) {
        if (!(rr > 0)) continue;
        const spin = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
        for (const dir0 of icoDirs(d)) {
          const dir = _a.copy(dir0).applyQuaternion(spin);
          if (s.half && dir.y * s.half < -0.02) continue; // (the half it keeps)
          const p = _p.copy(dir).multiply(s.q).multiplyScalar(s.r * rr * (1 + (rnd() - 0.5) * 0.12)).add(s.c);
          leafBasis(dir, _t, _b); p.addScaledVector(_t, (rnd() - 0.5) * spacing * 0.7).addScaledVector(_b, (rnd() - 0.5) * spacing * 0.7); // (jittered off the lattice)
          const out = Math.hypot(p.x - s.c.x, p.z - s.c.z);
          if (s.hole && out < s.hole) continue; // (inside the stipe that runs through it)
          if (layer === 1 && S.some((o) => o !== s && inside(p, o))) continue; // (deep inside another sphere: no one sees it)
          const n = s.radial ? _n.set((p.x - s.c.x) / (out || 1) * 0.55, 0.85 * s.radial, (p.z - s.c.z) / (out || 1) * 0.55).normalize()
            : _n.copy(dir).divide(s.q).normalize().lerp(_v.copy(p).sub(whole).normalize(), unify).normalize(); // (the ellipsoid's own normal: its gradient)
          n.applyMatrix3(rot).normalize(); p.applyMatrix4(M);
          const phase = s.grow ? THREE.MathUtils.clamp(out / (s.r * s.q.x), 0, 1) * 0.86 + rnd() * 0.1 : rnd();
          L.push(p.x, p.y, p.z, n.x, n.y, n.z, size * sz * (0.85 + rnd() * 0.3), rnd(), s.cells[Math.floor(rnd() * s.cells.length)], layer, s.slot ?? E.slot ?? 0, phase);
        }
      }
    }
    ranges.push({ first, count: L.length / 12 - first, on: true });
  }
  const g = buildLeaves(L); g.userData.ranges = ranges;
  return g;
}

/** Show (or hide) one entry's leaves in a canopy geometry (`userData.ranges[i]`): hidden, their triangles are collapsed in the index, so
 *  neither the colour pass nor the shadow pass draws them (a cap shut, its open leaves' shadow gone with them). */
export function canopyShow(geometry, range, on = true) {
  if (!range || range.on === on || !range.count) return; range.on = on;
  const I = geometry.index, a = I.array;
  for (let i = range.first, o = i * 6; i < range.first + range.count; i++, o += 6) { const v = i * 4; if (on) { a[o] = v; a[o + 1] = v + 1; a[o + 2] = v + 2; a[o + 3] = v; a[o + 4] = v + 2; a[o + 5] = v + 3; } else a.fill(v, o, o + 6); }
  I.addUpdateRange(range.first * 6, range.count * 6); I.needsUpdate = true;
}

/** The vertex buffers from the leaves: four vertices a leaf, compact (23 bytes a vertex). */
function buildLeaves(L) {
  const n = L.length / 12, V = n * 4;
  const pos = new Float32Array(V * 3), nor = new Int8Array(V * 3), cor = new Int8Array(V * 2), leaf = new Uint8Array(V * 4), tree = new Uint8Array(V * 2);
  const idx = V > 65535 ? new Uint32Array(n * 6) : new Uint16Array(n * 6);
  const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]], q = (v) => Math.max(-127, Math.min(127, Math.round(v * 127)));
  const box = new THREE.Box3(); let big = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 12, size = Math.min(L[o + 6], LEAF_MAX);
    const qn = [q(L[o + 3]), q(L[o + 4]), q(L[o + 5])], nn = _n.set(qn[0] / 127, qn[1] / 127, qn[2] / 127); // (the normal as the shader will read it)
    leafBasis(_v.set(Math.fround(nn.x), Math.fround(nn.y), Math.fround(nn.z)), _t, _b);
    const ls = Math.round((size / LEAF_MAX) * 255), lsize = (ls / 255) * LEAF_MAX; big = Math.max(big, lsize);
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k, [cx, cy] = CORNERS[k];
      _p.set(L[o], L[o + 1], L[o + 2]).addScaledVector(nn, -0.12 * lsize).addScaledVector(_t, cx * 0.42 * lsize).addScaledVector(_b, cy * 0.42 * lsize); // (the shadow square: on the sphere, a little inside)
      pos[v * 3] = _p.x; pos[v * 3 + 1] = _p.y; pos[v * 3 + 2] = _p.z; box.expandByPoint(_p);
      nor[v * 3] = qn[0]; nor[v * 3 + 1] = qn[1]; nor[v * 3 + 2] = qn[2];
      cor[v * 2] = cx * 127; cor[v * 2 + 1] = cy * 127;
      leaf[v * 4] = ls; leaf[v * 4 + 1] = Math.round(L[o + 7] * 255); leaf[v * 4 + 2] = Math.round((L[o + 8] / 7) * 255); leaf[v * 4 + 3] = Math.round(L[o + 9] * 255);
      tree[v * 2] = L[o + 10]; tree[v * 2 + 1] = Math.round(L[o + 11] * 255);
    }
    const a = i * 4; idx.set([a, a + 1, a + 2, a, a + 2, a + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3, true));
  g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2, true)); g.setAttribute('aLeaf', new THREE.BufferAttribute(leaf, 4, true)); g.setAttribute('aTree', new THREE.BufferAttribute(tree, 2, true));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingBox = box.expandByScalar(big * 1.1); g.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); // (the quads reach past their squares, grown far off: the bounds by the largest)
  g.userData.leaves = n;
  for (const A of [g.attributes.position, g.attributes.normal, g.attributes.aCorner, g.attributes.aLeaf]) A.onUpload(dropArray); // (drawn from the card's copy once it is there: the script's heap keeps the index, for a wireframe view, and the tint slots, which a tint rewrites)
  return g;
}
function dropArray() { this.array = null; }

/** One canopy: its own mesh (the shared material), its own tint slot if it takes a tint. */
export class LeafCanopy {
  constructor({ spheres, leaf = 'round', density = 1, size = null, seed = 1, tint = null, shell, unify, shadow = true } = {}) {
    this.slot = tint ? canopySlot() : 0;
    this.geometry = canopyGeometry([{ spheres, leaf, density, size: size ?? undefined, seed, slot: this.slot, shell, unify }]);
    this.mesh = canopyMesh(this.geometry, { shadow });
    if (tint) this.tint(tint.color, tint.amount ?? 1);
  }
  get leaves() { return this.geometry.userData.leaves; }
  /** Its flash leaned to `color` by `amount` (a canopy made without a tint takes a slot now). */
  tint(color, amount = 1) { if (!this.slot) { this.slot = canopySlot(); if (this.slot) this.retag(); } canopyTint(this.slot, color, amount); }
  retag() { const A = this.geometry.attributes.aTree; for (let i = 0; i < A.count; i++) A.array[i * 2] = this.slot; A.needsUpdate = true; }
  /** The time and the wind, outside the garden (canopyTick). */
  update(t, wind) { canopyTick({ t, wind }); }
  dispose() { this.mesh.parent?.remove(this.mesh); this.geometry.dispose(); canopyFree(this.slot); this.slot = 0; }
}
/** A mesh for a canopy geometry (or many canopies' one): the shared material, the edge told its frame, shadows cast and received. */
export function canopyMesh(geometry, { shadow = true } = {}) {
  const m = new THREE.Mesh(geometry, canopyMaterial()); m.name = 'leaf-canopy';
  m.castShadow = shadow; m.receiveShadow = true; m.onBeforeRender = coverageCheck; m.userData.noMerge = true;
  m.raycast = () => {}; // (leaves stop no ray; and their arrays are gone once drawn)
  return m;
}

// ---- the atlas: painted once (the canvas), its mips made here
function leafAtlas() {
  const W = CELL * COLS, H = CELL * ROWS, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const PAINT = [gingkoClump, willowClump, roundClump, mulberryClump, gillClump, capClump, gingkoClump, roundClump];
  PAINT.forEach((paint, i) => { const rnd = lcg(101 + i * 37); x.save(); x.beginPath(); x.rect((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL); x.clip(); x.translate((i % COLS) * CELL + CELL / 2, Math.floor(i / COLS) * CELL + CELL / 2); paint(x, rnd, i >= 6); x.restore(); });
  // every level a canvas (its pixels live with the canvas, not on the script's heap), uploaded premultiplied (CASEBOOK rule 22: an edge
  // fades toward the leaf's colour, never toward black; the shader divides it back); the canvas's top row is the texture's last (flipY)
  const lv0 = { data: x.getImageData(0, 0, W, H).data, width: W, height: H }, cover0 = coverOf(lv0.data, W, H), mips = [cv];
  for (let w = W >> 1, h = H >> 1, prev = lv0; w >= 1 || h >= 1; w >>= 1, h >>= 1) {
    const ww = Math.max(1, w), hh = Math.max(1, h), lv = downsample(prev, ww, hh);
    if (ww >= COLS && hh >= ROWS) keepCover(lv, ww, hh, cover0);
    mips.push(canvasOf(lv)); prev = lv; if (ww === 1 && hh === 1) break;
  }
  const T = new THREE.Texture(cv);
  T.mipmaps = mips; T.generateMipmaps = false; T.premultiplyAlpha = true; T.minFilter = THREE.LinearMipmapLinearFilter; T.magFilter = THREE.LinearFilter; T.anisotropy = 4;
  T.colorSpace = THREE.NoColorSpace; T.needsUpdate = true; T.name = 'leaf-atlas';
  return T;
}
function canvasOf(lv) { const c = document.createElement('canvas'); c.width = lv.width; c.height = lv.height; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(lv.data.buffer), lv.width, lv.height), 0, 0); return c; }
/** Half size, each cell on its own while a cell is a texel or more; colour weighted by coverage (premultiplied, then divided back). */
function downsample(prev, w, h) {
  const out = new Uint8Array(w * h * 4), P = prev.data, pw = prev.width, ph = prev.height, fx = pw / w, fy = ph / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) { const X = Math.min(pw - 1, Math.floor(x * fx) + i), Y = Math.min(ph - 1, Math.floor(y * fy) + j), k = (Y * pw + X) * 4, al = P[k + 3] + 1; r += P[k] * al; g += P[k + 1] * al; b += P[k + 2] * al; a += P[k + 3]; n += al; }
    const o = (y * w + x) * 4, cnt = fx * fy; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / cnt;
  }
  return { data: out, width: w, height: h };
}
/** Each cell's share of texels at or past the cut (one half). */
function coverOf(d, W, H) {
  const cw = W / COLS, ch = H / ROWS, out = new Float32Array(COLS * ROWS);
  for (let c = 0; c < COLS * ROWS; c++) { const ox = (c % COLS) * cw, oy = Math.floor(c / COLS) * ch; let n = 0; for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[((oy + y) * W + ox + x) * 4 + 3] >= 128) n++; out[c] = n / (cw * ch); }
  return out;
}
/** A level's alpha scaled, cell by cell, until as much of each cell passes the cut as at full size. */
function keepCover(lv, W, H, cover0) {
  const d = lv.data, cw = W / COLS, ch = H / ROWS;
  for (let c = 0; c < COLS * ROWS; c++) {
    const ox = (c % COLS) * cw, oy = Math.floor(c / COLS) * ch, want = cover0[c], A = [];
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) A.push(((oy + y) * W + ox + x) * 4 + 3);
    const covered = (s) => { let n = 0; for (const k of A) if (Math.min(255, d[k] * s) >= 128) n++; return n / A.length; };
    let lo = 0.25, hi = 6; for (let it = 0; it < 18; it++) { const m = (lo + hi) / 2; if (covered(m) < want) lo = m; else hi = m; }
    const s = (lo + hi) / 2; for (const k of A) d[k] = Math.min(255, Math.round(d[k] * s));
  }
}

// ---- the clumps: leaves radiating from a cell's middle, tips toward its edge (56 px of the 64 at most: a margin for the mips)
const GOLD = (x) => { x.strokeStyle = 'rgb(255,235,0)'; };
function shadeFill(x, len, id) { const g = x.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, `rgb(0,150,${id})`); g.addColorStop(1, `rgb(0,255,${id})`); x.fillStyle = g; }
function clump(x, rnd, n, r0, r1, draw) {
  const order = Array.from({ length: n }, (_, i) => i).sort(() => rnd() - 0.5);
  for (const i of order) { const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.6, r = r0 + rnd() * (r1 - r0); x.save(); x.rotate(a); x.translate(0, -r); x.rotate((rnd() - 0.5) * 0.5); draw(Math.floor(40 + rnd() * 200), rnd); x.restore(); }
}
function gingkoClump(x, rnd, alt) {
  clump(x, rnd, alt ? 4 : 5, 4, 12, (id, r) => {
    const len = 40 + r() * 6, R = len * 0.62, fb = -len * 0.36;
    x.lineWidth = 2.2; x.strokeStyle = `rgb(60,150,${id})`; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, fb); x.stroke(); // (the petiole)
    x.beginPath(); x.moveTo(0, fb); const pts = [];
    for (let k = 0; k <= 24; k++) { const a = -1.05 + (k / 24) * 2.1, notch = 1 - 0.28 * Math.exp(-((a / 0.12) ** 2)), wav = 1 + 0.04 * Math.sin(k * 2.7); pts.push([Math.sin(a) * R * notch * wav, fb - Math.cos(a) * R * notch * wav]); }
    for (const [px, py] of pts) x.lineTo(px, py); x.closePath(); shadeFill(x, len, id); x.fill();
    GOLD(x); x.lineWidth = 0.6; for (let k = 2; k < 23; k += 3) { x.beginPath(); x.moveTo(0, fb); x.lineTo(pts[k][0] * 0.94, fb + (pts[k][1] - fb) * 0.94); x.stroke(); } // (the fan's veins)
    x.lineWidth = 1.2; x.beginPath(); pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); // (the rim)
  });
}
function willowClump(x, rnd) {
  clump(x, rnd, 8, 2, 10, (id, r) => {
    const len = 44 + r() * 8, w = 4 + r() * 2, bend = (r() - 0.5) * 10;
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(w, -len * 0.25, w * 0.9 + bend * 0.5, -len * 0.7, bend, -len); x.bezierCurveTo(-w * 0.9 + bend * 0.5, -len * 0.7, -w, -len * 0.25, 0, 0); x.closePath();
    shadeFill(x, len, id); x.fill(); GOLD(x); x.lineWidth = 0.7; x.stroke();
    x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(bend * 0.4, -len * 0.55, bend, -len); x.stroke(); // (the midrib)
  });
}
function roundClump(x, rnd, alt) {
  clump(x, rnd, alt ? 5 : 6, 6, 16, (id, r) => {
    const len = 32 + r() * 8, rx = len * 0.4, ry = len * 0.46, cy = -len * 0.52;
    x.beginPath(); x.moveTo(0, -4); for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2, tip = 1 + 0.18 * Math.max(0, Math.cos(a)) ** 6; x.lineTo(Math.sin(a) * rx, cy - Math.cos(a) * ry * tip); } x.closePath();
    shadeFill(x, len, id); x.fill(); GOLD(x); x.lineWidth = 1.2; x.stroke();
    x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -2); x.lineTo(0, cy - ry * 1.05); for (let k = 1; k <= 3; k++) { const yy = cy + ry * 0.55 - k * ry * 0.4; x.moveTo(0, yy); x.lineTo(rx * 0.75, yy - ry * 0.25); x.moveTo(0, yy); x.lineTo(-rx * 0.75, yy - ry * 0.25); } x.stroke();
  });
}
function mulberryClump(x, rnd) {
  clump(x, rnd, 4, 6, 12, (id, r) => {
    const len = 42 + r() * 6, R = len * 0.5, cy = -len * 0.5, pts = [];
    for (let k = 0; k <= 60; k++) { const f = (k / 60) * Math.PI * 2 - Math.PI, rr = R * (0.8 + 0.2 * Math.cos(3 * f)) * (1 - 0.38 * Math.exp(-(((Math.abs(f) - Math.PI) / 0.32) ** 2))) + R * 0.035 * Math.sin(26 * f); pts.push([Math.sin(f) * rr, cy - Math.cos(f) * rr]); }
    x.beginPath(); pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); shadeFill(x, len, id); x.fill();
    GOLD(x); x.lineWidth = 1.2; x.stroke();
    x.lineWidth = 0.6; x.beginPath(); for (const a of [0, 2.1, -2.1]) { x.moveTo(0, cy + R * 0.55); x.lineTo(Math.sin(a) * R * 0.8, cy - Math.cos(a) * R * 0.8); } x.stroke(); // (three veins to the lobes)
  });
}
// the gills and the cap's scales run up their cell (the shader turns a cell's up outward from the axis: canopyGeometry's cells 4 and 5),
// over a dark backing lens, so a cap's underside reads as gills radiating from its stipe and its dome as scales shingled toward the rim
function backing(x, rnd, w, h, g = 110) {
  x.beginPath(); for (let k = 0; k <= 32; k++) { const a = (k / 32) * Math.PI * 2, rr = 1 + 0.07 * Math.sin(k * 2.9 + rnd() * 2); x.lineTo(Math.sin(a) * w * rr, -Math.cos(a) * h * rr); } x.closePath();
  x.fillStyle = `rgb(0,${g},${Math.floor(40 + rnd() * 200)})`; x.fill();
}
function gillClump(x, rnd) {
  backing(x, rnd, 50, 60, 70); // (a dark lens under the comb: the gills read as one shaded underside, never a scatter of dashes)
  for (let k = 0; k < 9; k++) {
    const id = Math.floor(40 + rnd() * 200), xo = (k - 4) * 10 + (rnd() - 0.5) * 2.5, ends = 1 - ((k - 4) / 5.2) ** 2, top = -56 * ends + rnd() * 5, bot = 56 * ends - rnd() * 5, w = 3.4 + rnd() * 1.4, bow = (rnd() - 0.5) * 3;
    x.beginPath(); x.moveTo(xo, bot); x.quadraticCurveTo(xo + w + bow, 0, xo, top); x.quadraticCurveTo(xo - w + bow, 0, xo, bot); x.closePath();
    const g = x.createLinearGradient(0, bot, 0, top); g.addColorStop(0, `rgb(0,130,${id})`); g.addColorStop(1, `rgb(0,250,${id})`); x.fillStyle = g; x.fill();
    GOLD(x); x.lineWidth = 1.2; x.beginPath(); x.moveTo(xo, bot); x.quadraticCurveTo(xo + w + bow, 0, xo, top); x.stroke(); // (the gill's free edge)
  }
}
function capClump(x, rnd) {
  backing(x, rnd, 44, 48, 120);
  for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - (row === 1 ? 1 : 0); k++) { // (the outer row first: each scale nearer the axis lies over the base of the one beyond it)
    const id = Math.floor(40 + rnd() * 200), n = row === 1 ? 2 : 3, x0 = (k - (n - 1) / 2) * 27 + (rnd() - 0.5) * 4, y0 = -30 + row * 26 + (rnd() - 0.5) * 4, w = 15 + rnd() * 3, h = 22 + rnd() * 4;
    x.beginPath(); x.moveTo(x0 - w, y0 + h * 0.45); x.bezierCurveTo(x0 - w * 1.05, y0 - h * 0.55, x0 - w * 0.4, y0 - h, x0, y0 - h); x.bezierCurveTo(x0 + w * 0.4, y0 - h, x0 + w * 1.05, y0 - h * 0.55, x0 + w, y0 + h * 0.45); x.closePath();
    const g = x.createLinearGradient(0, y0 + h * 0.45, 0, y0 - h); g.addColorStop(0, `rgb(0,120,${id})`); g.addColorStop(1, `rgb(0,250,${id})`); x.fillStyle = g; x.fill();
    GOLD(x); x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0 - w, y0 + h * 0.45); x.bezierCurveTo(x0 - w * 1.05, y0 - h * 0.55, x0 - w * 0.4, y0 - h, x0, y0 - h); x.bezierCurveTo(x0 + w * 0.4, y0 - h, x0 + w * 1.05, y0 - h * 0.55, x0 + w, y0 + h * 0.45); x.stroke(); // (its free edge)
    x.lineWidth = 0.6; x.beginPath(); x.moveTo(x0, y0 + h * 0.4); x.lineTo(x0, y0 - h * 0.8); x.stroke(); // (its ridge)
  }
}

function lcg(seed) { let a = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
const IDENT = new THREE.Matrix4();
const _a = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _w = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();
