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
    if (zone > 3.5) m = smoothstep(-uWP[4].z, 0.0, d) * (1.0 - smoothstep(F, F * 2.2, d)) * 0.95;
    else if (zone > 2.5) m = max(exp(-(d - F) * (d - F) / 6.0) * 0.85, smoothstep(-2.0, 0.5, d) * (1.0 - smoothstep(0.5, 2.5, d)) * 0.5);
    else if (zone > 1.5) m = smoothstep(-1.2, 0.3, d) * (1.0 - smoothstep(0.3, 1.6, d)) * 0.45 * (1.0 - s / ${f(WAVE.pocket + WAVE.pocketW)});
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
  float tau = smoothstep(0.0, tl, -s);
  tau = max(tau, 0.14 * (1.0 - smoothstep(0.0, tl, s)) * step(-0.01, s)); // (the crest already pitching just ahead of the break: a feather)
  gone = smoothstep(-tube * 0.84, -tube * 1.02, s);
  float shrink = 1.0 - 0.75 * gone;
  float rx = F * (0.35 + 0.7 * tau) * shrink, ry = H * 0.46 * shrink, phi = a * tau * 2.5761; // (lipCurve: 0.82 pi)
  float dd = rx * sin(phi), hh = H - ry + ry * cos(phi) - gone * H * 0.35 * a;
  vec2 uv = cuv + dd * tr;
  // the outward normal of the ellipse at phi, in the wave's (d, h) plane, turned into the park's
  vec2 nd = normalize(vec2(sin(phi) / max(rx, 0.05), cos(phi) / max(ry, 0.05)));
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
