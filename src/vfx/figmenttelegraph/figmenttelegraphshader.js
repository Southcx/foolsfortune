// ---------------------------------------------------------------------------------------
// THE FIGMENT ATTACK TELEGRAPHS' PROGRAM: one shader for every Figment attack telegraph (docs/plans/FIGMENT-TELEGRAPHS.md), so the
// whole vocabulary costs one program (the casebook's rule 124: variants are uniforms, never defines). Two modes on one uniform:
//   THE GROUND (uMode 0)  a grid draped on the ground (vfx/figmenttelegraph/figmenttelegraphdrape.js) on which the area is drawn from its numbers:
//     a union of signed distances (vfx/figmenttelegraph/figmenttelegraphshapes.js PRIM), so one cast's overlapping areas are one edge; the floor's
//     safe pockets cut out of it. Step 1, the EDGE: the Mind's ink (the parry mark's near-black with the labradorite's schiller in
//     it) a constant 2.8 pixels wide, a pale keyline outside it so it reads on dark ground (the casebook's rule 105), dashed while its
//     size is not known (the caution edge); no fill. Step 2, the FILL: the area filling away from the maker as the windup runs, a
//     pale line at its front, reaching the edge on the strike frame (uFill is the windup's own clock, set by the look); untyped, it is
//     ink with the schiller. Step 3, WHAT KIND: the fill takes the damage type's two colours and its MOTIF (impact's facets, ego's hex
//     lattice, influence's ripples, illusion's turning curls, delirium's bubbles: vfx/library.js `damage.<type>`, docs/ART.md
//     section 2), so the type reads in greys. Step 4's chevrons are laid in it as stamps from the glyph atlas. A friendly area (a
//     sibling's, a spirit's) is its outline alone in the Courier's draught colour: never ink, never filled. The arena's rim is a band
//     with a marquee running round it.
//   THE GLYPHS (uMode 1)  camera-facing quads from the same atlas (the status, the eye, the target and its pips, the guard, the
//     bait, the high ground), each sized in metres and held between a smallest and a largest size on the screen, so a glyph is never
//     thinner than its pixels at play distance and never fills the view.
// Every mark is pulled toward the eye by uBias metres along its own ray (the drape's slack: a coarse grid over a curved floor never
// sinks into it), which moves nothing on the screen and is still beaten by anything standing a body's height in front of it.
//
// Prior art: WildStar's telegraphs (the fill to the edge as the clock), WoW 11.1's swirlies (a crisp outline and a distinct inside),
// FFXIV's caution marker (a broken ring: size unknown), Inigo Quilez's 2D distance functions and fwidth-wide lines (crisp at any
// distance, no crawl), the decal's depth offset toward the camera of every engine that lays marks on terrain.
//
//   figmentTelegraphMaterial({ mode, atlas }) -> ShaderMaterial    (every one shares the program; each mark its own uniforms)
//   TYPE_INDEX, TYPE_TINTS                                   (the damage types, in order, and their two colours each)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from '../labradorite.js';
import { MAX } from './figmenttelegraphshapes.js';

export const TYPE_INDEX = { impact: 0, ego: 1, influence: 2, illusion: 3, delirium: 4 };
/** Each damage type's dark and light (vfx/library.js `damage.<type>`): impact bone and gold, ego lapis, influence rose and warm gold,
 *  illusion the labradorite (drawn from its palette, these only its fallback), delirium ink with its violet. */
export const TYPE_TINTS = {
  impact: [0x5a3c14, 0xf2e6c8], ego: [0x1e3a9a, 0xa8c0ff], influence: [0xa04a68, 0xffd7a8], illusion: [0x2a2a7a, 0x9ad8f0], delirium: [0x2a1438, 0xc458d0],
};

const V = /* glsl */`
uniform float uMode, uBias, uPxK, uMinPx, uMaxPx;
attribute vec2 corner;
attribute vec4 glyph;
attribute vec3 shift;
attribute vec3 tint;
varying vec3 vW;
varying vec2 vUv;
varying vec4 vG;
varying vec3 vTint;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vUv = vec2(0.0); vG = glyph; vTint = tint;
  if (uMode > 0.5) {
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float d = length(cameraPosition - w.xyz);
    float s = clamp(glyph.y, d * uPxK * uMinPx, d * uPxK * uMaxPx);       // (metres, held between its least and most pixels)
    vec3 c = w.xyz + vec3(0.0, s * 0.5 * glyph.w, 0.0) + (right * shift.x + up * shift.y) * s;
    w.xyz = c + (right * corner.x + up * corner.y) * s * 0.5 * shift.z;
    vUv = corner * 0.5 + 0.5;
  }
  vW = w.xyz;
  vec4 v = viewMatrix * w;
  v.xyz *= max(0.05, 1.0 - uBias / max(length(v.xyz), 1e-3));          // (toward the eye along its own ray: nothing moves on the screen)
  gl_Position = projectionMatrix * v;
}`;

const F = /* glsl */`
uniform float uMode, uT, uAlpha;
uniform sampler2D uAtlas; uniform vec4 uAtlasGrid;
uniform vec4 uFrame;
uniform vec4 uPrimA[${MAX.prims}]; uniform vec2 uPrimB[${MAX.prims}]; uniform int uPrimN;
uniform vec3 uPocket[${MAX.pockets}]; uniform int uPocketN;
uniform vec4 uStamp[${MAX.stamps}]; uniform float uStampCell[${MAX.stamps}]; uniform int uStampN;
uniform float uFill, uType, uFriendly, uCaution, uLocked;
uniform vec3 uTintA, uTintB, uFriend, uStampTint;
varying vec3 vW;
varying vec2 vUv;
varying vec4 vG;
varying vec3 vTint;
${LAB_GLSL}
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// a glyph of the atlas: cell index, uv in the art (0..1, v down), its gradients for the mip
vec4 atlasAt(float cell, vec2 uv, vec2 gx, vec2 gy) {
  float col = mod(cell, uAtlasGrid.x), row = floor(cell / uAtlasGrid.x);
  vec2 k = vec2(1.0 - 2.0 * uAtlasGrid.z) / uAtlasGrid.xy;
  vec2 st = (vec2(col, row) + uAtlasGrid.z) / uAtlasGrid.xy + clamp(uv, 0.0, 1.0) * k;
  return textureGrad(uAtlas, st, gx * k, gy * k);
}
// the icons' hand in colour: tone 0 the keyline (ink), the light shape in its tint, the lit edge toward white
vec3 handColour(float g, vec3 tint) {
  vec3 c = mix(vec3(0.006, 0.005, 0.01), tint, smoothstep(0.06, 0.9, g));
  return mix(c, vec3(1.0), smoothstep(0.93, 1.0, g) * 0.35);
}
void over(inout vec4 dst, vec3 c, float a) { float o = a + dst.a * (1.0 - a); dst.rgb = o > 1e-4 ? (c * a + dst.rgb * dst.a * (1.0 - a)) / o : dst.rgb; dst.a = o; }

// one primitive: its signed distance (m), how far the fill has to run to reach it (0 at the maker's side, 1 at the edge), the metres
// that 0..1 spans, and a coordinate along its edge (m: the caution edge's dashes)
void prim(int i, vec2 p, out float sd, out float u, out float ext, out float s) {
  vec4 A = uPrimA[i]; vec2 B = uPrimB[i];
  float kind = A.x; vec2 q = p - A.yz;
  vec2 dir = vec2(sin(A.w), cos(A.w));
  float r = length(q);
  if (kind < 0.5) { sd = r - B.x; u = r / max(B.x, 1e-3); ext = B.x; s = atan(q.x, q.y) * B.x; }                    // circle
  else if (kind < 1.5) { sd = max(r - B.y, B.x - r); u = (r - B.x) / max(B.y - B.x, 1e-3); ext = B.y - B.x; s = atan(q.x, q.y) * r; } // ring
  else if (kind < 2.5) {                                                                                                 // cone (a pie)
    vec2 a = vec2(q.x * dir.y - q.y * dir.x, dot(q, dir)); vec2 c = vec2(sin(B.x), cos(B.x));
    vec2 b = vec2(abs(a.x), a.y);
    float l = length(b) - B.y, m = length(b - c * clamp(dot(b, c), 0.0, B.y));
    sd = max(l, m * sign(c.y * b.x - c.x * b.y)); u = r / max(B.y, 1e-3); ext = B.y;
    s = abs(l) < m ? atan(a.x, a.y) * B.y : length(b);
  } else if (kind < 3.5) {                                                                                               // rect (a line)
    vec2 a = vec2(q.x * dir.y - q.y * dir.x, dot(q, dir) - B.y * 0.5);
    vec2 d = abs(a) - vec2(B.x, B.y) * 0.5;
    sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); u = (a.y + B.y * 0.5) / max(B.y, 1e-3); ext = B.y;
    s = d.x > d.y ? a.y : a.x;
  } else if (kind < 4.5) { sd = r - B.x; u = length(p) / max(B.y, 1e-3); ext = B.y; s = atan(q.x, q.y) * B.x; }        // floor
  else {                                                                                                                 // the arena's rim
    sd = max(r - B.x, (B.x - B.y) - r);
    float d = abs(mod(atan(q.x, q.y) - A.w + 3.14159265, 6.2831853) - 3.14159265);
    u = d / 3.14159265; ext = B.x * 3.14159265; s = atan(q.x, q.y) * B.x;
  }
}

// the damage type's motif, 0..1, on the ground about the maker (wq: metres from it, unturned, so a pattern never swims with a turn)
float motif(float type, vec2 wq, float t) {
  if (type < 0.5) {                                                    // impact: facets, square-cut and lit from one side (still)
    vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * wq / 1.7; vec2 f = fract(q) - 0.5;
    float e = max(abs(f.x), abs(f.y)), w = fwidth(q.x) * 1.2;
    float facet = (f.x > 0.0 ? 0.3 : 0.0) + (f.y > 0.0 ? 0.0 : 0.4);
    return mix(0.35 + facet, 0.0, smoothstep(0.43 - w, 0.43 + w, e));
  }
  if (type < 1.5) {                                                    // ego: the hex lattice that holds (still)
    vec2 q = wq / 1.5; const vec2 k = vec2(1.0, 1.7320508);
    vec4 hc = floor(vec4(q, q - vec2(0.5, 1.0)) / k.xyxy) + 0.5;
    vec4 h = vec4(q - hc.xy * k, q - (hc.zw + 0.5) * k);
    vec2 hv = dot(h.xy, h.xy) < dot(h.zw, h.zw) ? h.xy : h.zw;
    float e = max(abs(hv.x) * 0.5 + abs(hv.y) * 0.8660254, abs(hv.x)), w = fwidth(q.x) * 1.2;
    return mix(0.3, 1.0, smoothstep(0.42 - w, 0.42 + w, e));
  }
  if (type < 2.5) {                                                    // influence: ripples spreading slow and even from the maker
    float ph = (length(wq) - t * 0.7) / 1.9, w = fwidth(ph) * 1.5;
    float f = abs(fract(ph) - 0.5);
    return 0.3 + 0.7 * (1.0 - smoothstep(0.12 - w, 0.12 + w, f));
  }
  if (type < 3.5) {                                                    // illusion: curls that turn, never at rest
    vec2 q = wq / 3.4, id = floor(q), f = fract(q) - 0.5;
    float h = h21(id), a = atan(f.y, f.x) + (h > 0.5 ? 1.0 : -1.0) * t * 0.6, r = length(f);
    float sp = abs(fract((a / 6.2831853) * 2.0 + r * 4.5) - 0.5), w = fwidth(r * 4.5) * 1.5 + 0.02;
    return mix(0.25, 1.0, (1.0 - smoothstep(0.14 - w, 0.14 + w, sp)) * (1.0 - smoothstep(0.42, 0.5, r)));
  }
  vec2 q = wq / 1.3 + vec2(0.0, t * 0.12), id = floor(q), f = fract(q) - 0.5;   // delirium: bubbles drifting, coming apart
  vec2 o = (vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5) * 0.3;
  float rr = 0.12 + 0.2 * h21(id), d = abs(length(f - o) - rr), w = fwidth(q.x) * 1.2;
  return 0.25 + 0.75 * (1.0 - smoothstep(0.035 - w * 0.5, 0.035 + w, d)) * step(0.3, h21(id + 1.3));
}

void main() {
  vec4 outc = vec4(0.0);
  if (uMode > 0.5) {
    vec4 g = atlasAt(vG.x, vec2(vUv.x, 1.0 - vUv.y), dFdx(vUv), dFdy(vUv)); // (the gradients size the mip: their sign is nothing to it)
    outc = vec4(handColour(g.r, vTint), g.a * vG.z);
  } else {
    vec2 d = vW.xz - uFrame.xy, p = vec2(d.x * uFrame.w - d.y * uFrame.z, d.x * uFrame.z + d.y * uFrame.w);
    float sdU = 1e5, nearD = 1e5, sNear = 0.0, filled = 0.0, front = 1e5, marquee = 0.0;
    vec2 dpx = dFdx(p), dpy = dFdy(p);                                   // (taken here, in uniform flow: no derivative inside a branch)
    float pxm = max(length(dpx), length(dpy)) * 0.75;                    // (metres a pixel, about)
    for (int i = 0; i < ${MAX.prims}; i++) {
      if (i >= uPrimN) break;
      float sd, u, ext, s; prim(i, p, sd, u, ext, s);
      sdU = min(sdU, sd);
      if (abs(sd) < nearD) { nearD = abs(sd); sNear = s; }
      float inside = 1.0 - smoothstep(-pxm, pxm, sd);
      filled = max(filled, inside * (uFill > 1.5 ? 1.0 : smoothstep(-pxm, pxm, (uFill - u) * ext)));
      if (uFill >= 0.0 && uFill < 1.0 && sd < 0.0) front = min(front, abs(u - uFill) * ext);
      if (uPrimA[i].x > 4.5 && sd < 0.0) {                               // (the rim's marquee: dashes running round it at one steady rate)
        float n = max(8.0, floor(6.2831853 * uPrimB[i].x / 3.5)), a = atan(p.x - uPrimA[i].y, p.y - uPrimA[i].z) / 6.2831853;
        float f = fract(a * n - uT * 0.5), w = clamp(pxm * n / (6.2831853 * uPrimB[i].x) * 1.5, 0.01, 0.3);
        marquee = max(marquee, smoothstep(0.0, w, f) * (1.0 - smoothstep(0.45, 0.45 + w, f)) * (1.0 - smoothstep(-pxm * 3.0, 0.0, sd)));
      }
    }
    for (int i = 0; i < ${MAX.pockets}; i++) {                           // (the floor's safe pockets, cut out of it)
      if (i >= uPocketN) break;
      float sk = length(p - uPocket[i].xy) - uPocket[i].z;
      sdU = max(sdU, -sk); filled *= smoothstep(-pxm, pxm, sk); if (sk < 0.0) front = 1e5;
    }
    float fw = max(fwidth(sdU), 1e-5), e = sdU / fw;                     // (the distance in pixels: the line holds its width at any range)
    float line = 1.0 - smoothstep(1.4 - 0.6, 1.4 + 0.6, abs(e));        // (the edge: 2.8 px, centred on the true edge)
    float key = smoothstep(0.8, 1.4, e) * (1.0 - smoothstep(2.6, 3.2, e)); // (its keyline: 1.2 px of pale just outside)
    if (uCaution > 0.5 && uLocked < 0.5) {                               // (the caution edge: dashed, size not yet known)
      float dl = 1.6, ph = fract(sNear / dl), w = clamp(fw / dl * 1.5, 0.01, 0.2);
      float on = smoothstep(0.0, w, ph) * (1.0 - smoothstep(0.55, 0.55 + w, ph));
      line *= on; key *= on;
    }
    vec3 view = normalize(cameraPosition - vW);
    float ph = labPhase(vW, view);
    vec2 wq = vW.xz - uFrame.xy;
    float m = uType > -0.5 ? motif(uType, wq, uT) : 0.0;               // (on a uniform: its fwidths are taken in uniform flow)
    m = mix(0.6, m, clamp(2.0 - pxm * 6.0, 0.0, 1.0));                   // (a motif too fine for its pixels, far or at a slant, settles to its mean: no crawl)
    if (uFriendly > 0.5) {                                               // (friendly: the outline alone, the draught's colour, a dark rim)
      over(outc, uFriend * 0.22, key * 0.85);
      over(outc, uFriend, line);
    } else {
      if (filled > 0.001) {
        vec3 fc; float fa;
        if (uType < -0.5) { fc = labInk(ph, 0.3); fa = 0.55; }            // (when, untyped: the Mind's ink filling, its schiller faint in it: never read as a type's colour)
        else {
          fc = uType > 2.5 && uType < 3.5 ? mix(LAB_INK, labSoft(ph + m * 0.35), 0.35 + 0.65 * m) : mix(uTintA, uTintB, m);
          fa = 0.42 + 0.3 * m;
        }
        over(outc, LAB_INK, 0.22 * filled);                               // (a shade under it first: a pale tint on pale sand still reads as an inside)
        over(outc, fc, fa * filled);
      }
      if (marquee > 0.0) over(outc, uType < -0.5 ? labSoft(ph) : uTintB, marquee * 0.75);
      if (front < 1e4) {                                                 // (the fill's front: pale, the clock's hand)
        float fe = front / max(pxm, 1e-5);
        vec3 fcol = uType < -0.5 ? labSoft(ph) * 1.3 : uTintB * 1.1;
        over(outc, fcol, (1.0 - smoothstep(0.6, 1.6, fe)) * 0.9);
      }
      for (int i = 0; i < ${MAX.stamps}; i++) {                          // (step 4: the chevrons laid on the ground)
        if (i >= uStampN) break;
        vec4 S = uStamp[i]; vec2 sd2 = vec2(sin(S.z), cos(S.z)), sr = vec2(sd2.y, -sd2.x);
        vec2 dq = p - S.xy, q = vec2(dot(dq, sr), dot(dq, sd2)) / S.w;
        if (abs(q.x) > 0.5 || abs(q.y) > 0.5) continue;
        vec2 gx = vec2(dot(dpx, sr), -dot(dpx, sd2)) / S.w, gy = vec2(dot(dpy, sr), -dot(dpy, sd2)) / S.w;
        vec4 g = atlasAt(uStampCell[i], vec2(0.5 + q.x, 0.5 - q.y), gx, gy);
        over(outc, handColour(g.r, uStampTint), g.a);
      }
      over(outc, mix(vec3(0.82, 0.8, 0.95), labSoft(ph), 0.3), key * 0.9);  // (the keyline: pale, so the ink reads on dark ground)
      over(outc, labInk(ph, 0.35), line);                                   // (the edge: the Mind's ink)
    }
  }
  outc.a *= uAlpha;
  if (outc.a < 0.004) discard;
  gl_FragColor = outc;
  #include <colorspace_fragment>
}`;

/** A Figment attack telegraph's material: mode 'ground' (a draped mark) or 'glyphs' (the boards). Each is its own uniforms over the one program. */
export function figmentTelegraphMaterial({ mode = 'ground', atlas = null } = {}) {
  const v4 = (n) => Array.from({ length: n }, () => new THREE.Vector4());
  const m = new THREE.ShaderMaterial({
    name: 'figmentTelegraph',
    uniforms: {
      uMode: { value: mode === 'glyphs' ? 1 : 0 }, uBias: { value: mode === 'glyphs' ? 0.1 : 0.3 }, uPxK: { value: 2 * Math.tan((55 * Math.PI) / 360) / 480 },
      uMinPx: { value: 18 }, uMaxPx: { value: 64 }, uT: { value: 0 }, uAlpha: { value: 1 }, uMindT: mindTime,
      uAtlas: { value: atlas }, uAtlasGrid: { value: new THREE.Vector4(8, 4, 0.125, 0) },
      uFrame: { value: new THREE.Vector4(0, 0, 0, 1) },
      uPrimA: { value: v4(MAX.prims) }, uPrimB: { value: Array.from({ length: MAX.prims }, () => new THREE.Vector2()) }, uPrimN: { value: 0 },
      uPocket: { value: Array.from({ length: MAX.pockets }, () => new THREE.Vector3()) }, uPocketN: { value: 0 },
      uStamp: { value: v4(MAX.stamps) }, uStampCell: { value: new Array(MAX.stamps).fill(0) }, uStampN: { value: 0 },
      uFill: { value: -1 }, uType: { value: -1 }, uFriendly: { value: 0 }, uCaution: { value: 0 }, uLocked: { value: 0 },
      uTintA: { value: new THREE.Color() }, uTintB: { value: new THREE.Color() }, uFriend: { value: new THREE.Color() }, uStampTint: { value: new THREE.Color(0xe6dcff) },
    },
    vertexShader: V, fragmentShader: F,
    transparent: true, depthWrite: false, depthTest: mode !== 'glyphs', side: THREE.DoubleSide, forceSinglePass: true, fog: false,
  });
  m.userData.shared = true; // (made once for the whole game: a place taken down never disposes it, casebook rule 24)
  return m;
}
