// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S LOOK, ITS GLSL (docs/ref/WAVE-RIDING.md 5): the pieces the water and the lip share, on top of the pool's own surface
// (world/raceway/surf/wavepool.js `WAVEPOOL_GLSL`, fed by `uniformsOf`: the one water function, ridden and drawn). Ported here, beside
// it and from it, so the look never drifts from the rules:
//   wpBed(uv)              the pool's bed (wavepool.js `bedAt`): the beach rising out, the reef's shelf, the deep wall's fall
//   wpFoamMask(...)        the foam mask (wavepool.js `foamAt`): the whitewater bore, the lip's landing line, the crest pitching, the wash
//   wpLipAt(s, a, out ..)  the lip's arc (wavepool.js `lipCurve`) at s along the crest from the break point, a from the crest to the tip,
//                          laid in the park (its xz, its height) with its outward normal
//   wpToPark(uv)           the pool's frame back to the park's (the inverse of `wpUV`)
//   WAVE_SHADE_GLSL        the shading both share: the sky by Fresnel, Beer-Lambert on the water's own column, the light through a thin
//                          wave (DICE's approximation), the cartoon foam (Wind Waker's thresholded noise, crisp over a pixel)
//
// Prior art: GPU Gems ch. 1 (the summed sines, their normals taken on the GPU), Horizon Forbidden West's water (SIGGRAPH 2022: one
// cross-section swept along the wavefront), DICE's GDC 2011 translucency (light through a thin body by a distorted back-light term and
// a thickness), Sea of Thieves (SIGGRAPH 2018: the crest's sub-surface colour, foam where the peaks are), Wind Waker (line foam).
//
//   import { WAVE_PARTS_GLSL, WAVE_SHADE_GLSL, SKY_FALLBACK_GLSL } from './waveglsl.js'
// ---------------------------------------------------------------------------------------
import { POOL, WAVE } from '../../world/raceway/surf/wavepool.js';

/** Where the curl collapses into the bore, as shares of the tube's length behind the break: begun, and shrunk to nothing (the look's
 *  alone: the rules' tube ends at WAVE.tube). The lip's strip runs on to LIP_END[1] so it never stops in a cut edge. */
export const LIP_END = [0.78, 1.3];

const f = (x) => (Number.isInteger(x) ? `${x}.0` : `${x}`);

/** The bed, the foam mask, the lip and the frame's inverse (after WAVEPOOL_GLSL). */
export const WAVE_PARTS_GLSL = /* glsl */`
vec2 wpToPark(vec2 uv) {
  vec2 q = uv - uWP[1].xy * 0.5; float c = cos(uWP[0].z), s = sin(uWP[0].z);
  return uWP[0].xy + vec2(q.x * c + q.y * s, -q.x * s + q.y * c);
}
vec2 wpClampUV(vec2 uv) { return clamp(uv, vec2(0.0, -uWP[1].w), uWP[1].xy); }
float wpBed(vec2 uv) {
  float vb = uWP[1].z, beach = uWP[1].w, y = uWP[0].w;
  if (uv.y < 0.0) return y + (-uv.y / beach) * ${f(POOL.rim)} - ${f(POOL.depth.foot)} * (1.0 - smoothstep(-beach, 0.0, uv.y));
  float d = uv.y < vb ? ${f(POOL.depth.foot)} + ${f(POOL.depth.reef - POOL.depth.foot)} * smoothstep(0.0, vb, uv.y)
                      : ${f(POOL.depth.reef)} + ${f(POOL.depth.deep - POOL.depth.reef)} * smoothstep(vb, vb + 30.0, uv.y);
  return y - d;
}
float wpFoamMask(float s, float d, float zone, float H, float F, float v) {
  float m = 0.0;
  if (H > 0.3) {
    if (zone > 3.5) m = (smoothstep(-uWP[4].z, 0.0, d) * 0.42 + exp(-(d - 0.3 * F) * (d - 0.3 * F) / (0.25 * F * F)) * 0.5) * (1.0 - smoothstep(F, F * 2.2, d)); // (the bore frothiest along its tumbling front, patchy behind)
    else if (zone > 2.5) m = max(exp(-(d - 1.31 * F) * (d - 1.31 * F) / 32.0) * 0.85, smoothstep(-4.6, 1.2, d) * (1.0 - smoothstep(1.2, 5.8, d)) * 0.5);
    else if (zone > 1.5) m = smoothstep(-2.8, 0.7, d) * (1.0 - smoothstep(0.7, 3.7, d)) * 0.45 * (1.0 - s / ${f(WAVE.pocket + WAVE.pocketW)});
  }
  return max(m, (1.0 - smoothstep(-uWP[1].w, 6.0, v)) * 0.6);
}
// the break point in the pool's frame, and the crest's two axes there (uv): along it toward the shoulder, across it in its travel
vec2 wpBreakUV() { return vec2(uWP[2].z, uWP[1].z); }
// the lip at s (m from the break point along the crest) and a (0 the crest .. 1 the tip): its park xz and height (xyz) and in w the
// throw tau it was drawn at; nOut its outward normal (park space, y up), gone how far it has collapsed into the whitewater (0..1)
vec4 wpLipAt(float s, float a, out vec3 nOut, out float gone) {
  vec2 cuv = wpBreakUV() + s * uWP[3].zw, tr = uWP[3].xy;
  float H, F; wpWave(cuv, H, F);
  float tube = uWP[5].z, tl = uWP[5].w;
  float tau = smoothstep(-${f(WAVE.lead)}, tl, -s); // (WAVE.lead: the lip begins to rise ahead of the break)
  // (no feather ahead of the break: standing alone on the crest it read as a fin, South 2026-11-06)
  gone = smoothstep(-tube * ${f(LIP_END[0])}, -tube * ${f(LIP_END[1])}, s); // (the curl collapsing into the bore: shrunk to nothing on the crest line, never cut off)
  float shrink = 1.0 - gone;
  // lipCurve (WAVE.lip): one tube with the face, about (rx, H): up from the crest with the face's vertical, over, and down to the tip
  // the curl's rise along the crest (wavepool.js lipRise): its upper half low at the lead, whole behind the break, sagging to the bore
  float rise = (${f(WAVE.rise[0])} + ${f(1 - WAVE.rise[0])} * smoothstep(-${f(WAVE.lead)}, ${f(WAVE.rise[1])}, -s)) * (1.0 - ${f(WAVE.sag[0])} * smoothstep(-${f(WAVE.sag[1])}, -${f(WAVE.sag[2])}, s));
  float rx = F * ${f(WAVE.lip.rx)} * shrink, psi = 3.14159265 - a * tau * ${f(WAVE.lip.sweep)}, r = H * (psi > 0.0 ? ${f(WAVE.lip.up)} * rise : ${f(WAVE.lip.down)}) * shrink;
  float dd = rx + rx * cos(psi), hh = H + r * sin(psi) - gone * H * 0.35 * a;
  vec2 uv = cuv + dd * tr;
  // the outward normal of the ellipse at psi (away from the tube's axis), in the wave's (d, h) plane, turned into the park's
  vec2 nd = normalize(vec2(cos(psi) / max(rx, 0.05), sin(psi) / max(r, 0.05)));
  vec2 trP = wpToPark(uv + tr) - wpToPark(uv);
  nOut = normalize(vec3(trP.x * nd.x, nd.y, trP.y * nd.x));
  return vec4(wpToPark(uv), uWP[0].w + wpSwell(uv, uWP[6].z) + hh, tau);
}
`;

/** The shading both the water and the lip share. Needs uSky + skyUv, LIQUID_GLSL, and the uniforms below. */
export const WAVE_SHADE_GLSL = /* glsl */`
uniform vec3 uSun, uSunC, uRW; uniform float uTime, uDay;
const vec3 WP_DEEP = vec3(0.012, 0.11, 0.24), WP_BODY = vec3(0.035, 0.5, 0.56), WP_GLOW = vec3(0.16, 0.86, 0.66), WP_FOAM = vec3(0.97, 0.965, 0.92), WP_FOAM_SH = vec3(0.62, 0.8, 0.84);
float wpHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 wpSky(vec3 d) { d.y = abs(d.y) * 0.85 + 0.15; return texture2D(uSky, skyUv(normalize(d))).rgb; }
// light through a thin body (DICE, GDC 2011): the back-light bent a little by the normal, to a power, by how thin it is there;
// the sky behind it lights it too (the face is a lens of water held up to the sky)
vec3 wpThrough(vec3 V, vec3 N, float thin) {
  vec3 L = normalize(uSun);
  float back = pow(clamp(dot(V, -normalize(L + N * 0.45)), 0.0, 1.0), 4.0) * 1.6;
  vec3 skyB = wpSky(-V + vec3(0.0, 0.25, 0.0));
  return WP_GLOW * thin * (skyB * (0.45 + 0.25 * uDay) + uSunC * back);
}
// THE TUBE round its circumference, shared by the face under the lip (water.js) and the curl (lip.js) so the two are one surface: ang 0
// the face's foot .. 0.4 the crest (where the strip begins) .. 1 the lip's tip; mouth 0 deep in the tube .. 1 at its open end. The wall
// teal, the roof dark and green under the water's whole weight with a soft occlusion where the curl closes over the crest, the curtain
// luminous where the lip thins and the light comes through, the whole brighter toward the mouth (Clark Little's and Chris Burkard's
// barrel photographs, the tube shots of "Riding Giants" and "Momentum Generation": the hollow read by that gradient round it).
float wpTubeThin(float ang, float tau) { return smoothstep(0.5, 1.0, ang) * tau; }
vec3 wpTube(float ang, float mouth, vec3 V, vec3 N, float tau) {
  float roof = smoothstep(0.3, 0.55, ang) * (1.0 - smoothstep(0.72, 0.95, ang));
  float closeK = exp(-(ang - 0.43) * (ang - 0.43) / 0.012);
  vec3 wall = mix(WP_BODY * 0.62, WP_DEEP * 0.55 + WP_GLOW * 0.06, smoothstep(0.05, 0.42, ang));
  vec3 roofC = vec3(0.012, 0.13, 0.11);
  vec3 curtain = mix(WP_BODY, WP_GLOW, 0.45) * 0.85;
  vec3 c = mix(wall, roofC, roof);
  c = mix(c, curtain, smoothstep(0.66, 0.99, ang) * tau);
  c *= 1.0 - 0.4 * closeK;
  c += wpThrough(V, N, wpTubeThin(ang, tau)) * 0.5;
  return c * mix(0.5, 1.2, mouth) * (0.6 + 0.4 * uDay);
}
// the cartoon foam: two scrolls of the bubbles' noise against the mask, crisp over a pixel; .x the foam, .y its shadowed rim
vec2 wpFoam(vec2 xz, vec2 flow, float mask, float t) {
  float n = liqTap(xz * 0.075 + flow * t * 0.075).g * 0.6 + liqTap(LIQ_ROT * xz * 0.16 - flow.yx * t * 0.05 + vec2(t * 0.02, 0.0)).g * 0.4;
  float th = 1.0 - mask * 0.92, w = max(fwidth(n) * 0.9, 0.012);
  float foam = smoothstep(th - w, th + w, n), rim = smoothstep(th - 0.13 - w, th - 0.13 + w, n) - foam;
  return vec2(foam, clamp(rim, 0.0, 1.0)) * step(0.01, mask); // (no early return: fwidth wants every fragment)
}
`;

/** A painted sky where none was given (the workbench, a test): a warm haze, so skyUv and uSky still mean something. */
export const SKY_FALLBACK_GLSL = /* glsl */`
vec2 skyUv(vec3 d) { return vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); }
`;
