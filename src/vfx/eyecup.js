// ---------------------------------------------------------------------------------------
// THE EYE: the EYE CUP glaze's kiln pattern (courier/vessel/glazes.js `eyecup`, vfx/finish.js PATTERN 6; the Great Slip Jelly's drop,
// Dovina's `pattern.crowneye`): a staring eye on every part of the vessel, the evil looked back at, in the black-figure hand of the
// ware of the town that was (vfx/blackfigure.js WARE: the black, the red clay, added white, added red). The eyes are PLACED, not tiled:
// each sits on one part of the armour where it reads (EYES below, measured on courier.glb in its bind pose, so they ride the body as
// it moves), and the mask's eyes are the maker's own painted ones, made over (MASK_EYES, in the painting's UVs).
//
//   THE ARMOUR  the red clay, an eye on each part: one on the chest, its pupil the chest's stone (the cup's tondo stares out); a
//               mirrored pair on the back, either side of the Lachrymato Bottle (the cup's other face); one on the back of each hand,
//               on the maker's painted disc; one on the outside of each thigh. Below the knees the black, as a cup's foot is, with
//               two lines reserved in it.
//   THE TRIM    the black, as a cup's lip and handles are.
//   THE MASK    the black: a black-figure face (the black is how black-figure paints flesh, a Gorgon's in a cup's tondo too). The
//               painting's pale eyes and brows in added white, its marks in added red, and in each eye the iris and pupil.
//   AN EYE      an almond of two arcs, the upper lid higher, outlined in the black with a line incised through it to the red; the white
//               of added white; a round iris touching the lids, rimmed in the black with an incised ring, the iris in the crown's blue
//               (vfx/foelook.js: the Eye Cup cast's eye, the drop's own); a black pupil and a catchlight; the brow, an arc of the black;
//               a pair's inner corners hooked as the Greek eye's are. Every line fades as it shrinks under a pixel or two, so a far
//               body never sparkles with them (CLAUDE.md: no aliasing crawl).
//
// Prior art: the Attic black-figure eye-cup (kylix type A, c. 540 to 500 BC: Exekias's Dionysos cup, Munich 2044, its eyes on the
// outside between the handles, a Gorgon's face in the tondo; the eyes apotropaic, staring back the evil eye), black-figure technique
// itself (the black fired in a reducing kiln and kept black as the body re-oxidised red; details incised through it; added white and
// added red), the hamsa (an eye in the hand), and signed-distance shapes for the eye (Quilez's 2D distance functions), drawn in the
// part's own bind space as the other kiln patterns are.
//
//   EYE_GLSL   (in the fragment's head, after finish.js's HEAD) the anchors as constants and:
//     vec3 eyeCupArmour(vec3 obj, vec3 nObj, float pxObj, vec3 col, vec3 black, vec3 clay, out float blk)   the armour's eyes and foot
//     vec3 eyeCupMask(vec2 uv, float luma, float pxUv, vec3 black, out float blk)                         the mask made over
//     (blk: how much of the result is the black, for its gloss)
//   EYES, MASK_EYES   the data (bind-space metres; the mask's in its painting's UVs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WARE } from './blackfigure.js';

// each armour eye: where it sits (bind space, metres), the way the surface faces there, the way its outer corner points and the way its
// top points (both laid flat on the surface), its half-width, whether its inner corner hooks (a pair's eyes do; a lone eye is plain), and
// how wide open it is (the lids' height, 1 the eye-cups' almond) and how wide its iris (1 touching the lids of an eye open 1)
export const EYES = [
  { at: 'chest', p: [0, 1.276, 0.158], n: [0, 0.05, 1], outer: [1, 0, 0], up: [0, 1, 0], r: 0.072, hook: false, open: 1.55, iris: 1.4 }, // (wide open, its iris wide: the stone sits in it as its pupil)
  { at: 'back L', p: [0.104, 1.285, -0.136], n: [0.34, 0.2, -0.92], outer: [1, 0, 0], up: [0, 1, 0], r: 0.042, hook: true },
  { at: 'back R', p: [-0.104, 1.285, -0.136], n: [-0.34, 0.2, -0.92], outer: [-1, 0, 0], up: [0, 1, 0], r: 0.042, hook: true },
  { at: 'hand L', p: [0.725, 1.394, 0.012], n: [0, 1, 0], outer: [0, 0, -1], up: [-1, 0, 0], r: 0.05, hook: true }, // (up: toward the shoulder, so the eye stands upright when the arm hangs)
  { at: 'hand R', p: [-0.725, 1.394, 0.012], n: [0, 1, 0], outer: [0, 0, -1], up: [1, 0, 0], r: 0.05, hook: true },
  { at: 'thigh L', p: [0.272, 0.665, -0.004], n: [1, 0.04, 0], outer: [0, 0, -1], up: [0, 1, 0], r: 0.062, hook: true },
  { at: 'thigh R', p: [-0.272, 0.665, -0.004], n: [-1, 0.04, 0], outer: [0, 0, -1], up: [0, 1, 0], r: 0.062, hook: true },
];
/** The black of the cup's foot: below this height (bind space, metres), with two lines reserved in it just under its top. */
export const FOOT = { top: 0.47, lines: [0.445, 0.428], line: 0.004 };
/** The mask's own painted eyes (courier_mask.png, in its UVs: glTF's, v down): the centre of each (the pale's centroid) and the way its
 *  outer corner lies in u. The iris and pupil are sized to the painting's eye (its half-height about 0.094). */
export const MASK_EYES = [{ c: [0.166, 0.609], outer: -1 }, { c: [0.523, 0.609], outer: 1 }];
const MASK_IRIS = { rim: 0.05, iris: 0.042, pupil: 0.02, glint: 0.007 };
/** The mask's painting read by its lightness (linear): its pale (the eyes, the brows) and its marks (the swirls under the eyes, at 0.066)
 *  apart from its ground (0.029) and the shadow round the eyes (0.166), which go to the black. */
const MASK_READ = { white: [0.3, 0.45], red: [0.045, 0.058, 0.1, 0.13] };

const v3 = (a) => new THREE.Vector3(...a);
const f = (x) => (Math.round(x * 1e4) / 1e4).toFixed(4);
const vec = (v) => `vec3(${f(v.x)}, ${f(v.y)}, ${f(v.z)})`;
const lin = (css) => { const c = new THREE.Color(css); return `vec3(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`; };
/** Each eye's frame: its outer and up laid flat on the surface, so the eye is drawn true where it sits. */
function frames() {
  return EYES.map((e) => {
    const n = v3(e.n).normalize(), u = v3(e.outer).addScaledVector(n, -v3(e.outer).dot(n)).normalize();
    const v = v3(e.up).addScaledVector(n, -v3(e.up).dot(n)).addScaledVector(u, -v3(e.up).dot(u)).normalize();
    return { p: v3(e.p), r: e.r, n, u, v, hook: e.hook ? 1 : 0, open: e.open || 1, iris: e.iris || 1 };
  });
}

function glsl() {
  const F = frames(), N = F.length;
  const arr = (type, xs) => `${type}[${N}](${xs.join(', ')})`;
  return `
const int EYE_COUNT = ${N};
const vec4 EYE_P[${N}] = ${arr('vec4', F.map((e) => `vec4(${vec(e.p).slice(5, -1)}, ${f(e.r)})`))};
const vec4 EYE_N[${N}] = ${arr('vec4', F.map((e) => `vec4(${vec(e.n).slice(5, -1)}, ${f(e.iris)})`))};
const vec4 EYE_U[${N}] = ${arr('vec4', F.map((e) => `vec4(${vec(e.u).slice(5, -1)}, ${e.hook}.0)`))};
const vec4 EYE_V[${N}] = ${arr('vec4', F.map((e) => `vec4(${vec(e.v).slice(5, -1)}, ${f(e.open)})`))};
const vec3 EYE_WHITE = ${lin(WARE.white)}; const vec3 EYE_RED = ${lin(WARE.red)}; const vec3 EYE_IRIS = ${lin(0x1a4a8a)};
// 1 inside (d < 0), eased over a pixel either side
float eyeIn(float d, float w) { return 1.0 - smoothstep(-w, w, d); }
// a line or a dot this wide (in the eye's units) at this pixel: whole when it is two pixels or more, gone under half of one
float eyeKeep(float size, float px) { return 1.0 - smoothstep(size * 0.5, size * 2.0, px); }
// one eye at e (its own units: x toward the outer corner, y up, the corners of the lids at x = +-1; open: the lids' height), over col
vec3 eyeCupEye(vec2 e, float px, float hook, float open, float iris, vec3 col, vec3 black, vec3 clay, inout float blk) {
  float w = px * 0.75;
  vec2 cU = vec2(0.0, -0.75), cL = vec2(0.0, 0.98), l = vec2(e.x, e.y / open);                  // (l: the lids' space, the iris stays round)
  float dA = max(length(l - cU) - 1.25, length(l - cL) - 1.40) * min(open, 1.0);                 // (the almond: two arcs through the corners)
  if (hook > 0.5) dA = min(dA, length(e - vec2(-1.0, -0.12)) - 0.13);                              // (a pair's inner corner, hooked)
  float bw = 0.07 * clamp(1.0 - e.x * e.x * 0.9, 0.0, 1.0);
  float dB = max(abs(length(l - cU) - 1.64) - bw / open, 0.15 - l.y) * open;                     // (the brow, an arc over the lid)
  float k;
  k = eyeIn(dB, w) * eyeKeep(0.12, px); col = mix(col, black, k); blk = max(blk, k);
  k = eyeIn(abs(dA - 0.035) - 0.095, w); col = mix(col, black, k); blk = max(blk, k);                // (the outline)
  k = eyeIn(abs(dA - 0.05) - 0.014, w) * eyeKeep(0.028, px); col = mix(col, clay, k); blk -= k * blk; // (incised through it, to the red)
  float s = eyeIn(dA + 0.06, w); col = mix(col, EYE_WHITE, s); blk *= 1.0 - s;                     // (the white)
  vec2 ic = vec2(0.0, 0.04); float r = length(e - ic) / iris;
  k = eyeIn(r - 0.43, w) * s; col = mix(col, black, k); blk = max(blk, k);                          // (the iris's rim)
  k = eyeIn(abs(r - 0.395) - 0.013, w) * s * eyeKeep(0.026, px); col = mix(col, clay, k);           // (an incised ring in it)
  k = eyeIn(r - 0.345, w) * s; col = mix(col, EYE_IRIS, k); blk *= 1.0 - k;                         // (the iris)
  k = eyeIn(r - 0.165, w) * s; col = mix(col, black, k); blk = max(blk, k);                         // (the pupil)
  k = eyeIn(length(e - ic - vec2(-0.1, 0.13)) - 0.065, w) * s * eyeKeep(0.13, px); col = mix(col, EYE_WHITE, k); blk *= 1.0 - k;
  return col;
}
vec3 eyeCupArmour(vec3 obj, vec3 nObj, float pxObj, vec3 col, vec3 black, vec3 clay, out float blk) {
  blk = 0.0;
  // the foot: the black below the knees, two lines reserved in it
  float wf = pxObj * 0.75;
  float foot = 1.0 - smoothstep(-wf, wf, obj.y - ${f(FOOT.top)});
  foot *= 1.0 - eyeIn(abs(obj.y - ${f(FOOT.lines[0])}) - ${f(FOOT.line)}, wf) * eyeKeep(${f(FOOT.line * 2)}, pxObj);
  foot *= 1.0 - eyeIn(abs(obj.y - ${f(FOOT.lines[1])}) - ${f(FOOT.line)}, wf) * eyeKeep(${f(FOOT.line * 2)}, pxObj);
  col = mix(col, black, foot); blk = foot;
  vec3 nN = normalize(nObj);
  for (int i = 0; i < EYE_COUNT; i++) {
    vec3 d = obj - EYE_P[i].xyz; float r = EYE_P[i].w;
    if (abs(dot(d, EYE_N[i].xyz)) > r * 1.2 || dot(nN, EYE_N[i].xyz) < 0.25) continue;                     // (only the surface the eye is on)
    vec2 e = vec2(dot(d, EYE_U[i].xyz), dot(d, EYE_V[i].xyz)) / r;
    if (dot(e, e) > 3.8) continue;
    float px = pxObj / r, far = 1.0 - smoothstep(0.3, 0.7, px);                                      // (an eye of a pixel or two: the ground)
    col = mix(col, eyeCupEye(e, px, EYE_U[i].w, EYE_V[i].w, EYE_N[i].w, col, black, clay, blk), far);
    break;
  }
  return col;
}
// the mask, made over: its painting read by lightness (pale: added white; the marks: added red; the rest the black), an iris in each eye
vec3 eyeCupMask(vec2 uv, float luma, float pxUv, vec3 black, out float blk) {
  float white = smoothstep(${f(MASK_READ.white[0])}, ${f(MASK_READ.white[1])}, luma);
  float red = smoothstep(${f(MASK_READ.red[0])}, ${f(MASK_READ.red[1])}, luma) * (1.0 - smoothstep(${f(MASK_READ.red[2])}, ${f(MASK_READ.red[3])}, luma));
  vec3 col = mix(mix(black, EYE_RED, red), EYE_WHITE, white); blk = 1.0 - max(white, red);
  float w = pxUv * 0.75;
  ${MASK_EYES.map((m) => `{ vec2 e = uv - vec2(${f(m.c[0])}, ${f(m.c[1])}); float r = length(e), k;
    k = eyeIn(r - ${f(MASK_IRIS.rim)}, w) * white; col = mix(col, black, k); blk = max(blk, k);
    k = eyeIn(abs(r - ${f(MASK_IRIS.rim * 0.92)}) - ${f(MASK_IRIS.rim * 0.03)}, w) * white * eyeKeep(${f(MASK_IRIS.rim * 0.06)}, pxUv); col = mix(col, EYE_RED, k);
    k = eyeIn(r - ${f(MASK_IRIS.iris)}, w) * white; col = mix(col, EYE_IRIS, k); blk *= 1.0 - k;
    k = eyeIn(r - ${f(MASK_IRIS.pupil)}, w) * white; col = mix(col, black, k); blk = max(blk, k);
    k = eyeIn(length(e - vec2(${f(-m.outer * 0.006)}, -0.008)) - ${f(MASK_IRIS.glint)}, w) * white * eyeKeep(${f(MASK_IRIS.glint * 2)}, pxUv); col = mix(col, EYE_WHITE, k); blk *= 1.0 - k; }`).join('\n  ')}
  return col;
}`;
}
/** The eyes' GLSL (finish.js puts it in the fragment's head). */
export const EYE_GLSL = glsl();
