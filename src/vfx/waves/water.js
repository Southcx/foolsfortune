// ---------------------------------------------------------------------------------------
// THE WAVE POOL'S WATER (docs/ref/WAVE-RIDING.md 5; South, 2026-11-06: "use performant and fancy techniques for wave rendering"): the
// pool's surface drawn from the very function the board rides (world/raceway/surf/wavepool.js `WAVEPOOL_GLSL`), on two grids in one
// program:
//   THE NEAR GRID   laid in the wave's own frame (along the crest, across it) round the break point, dense (0.35 m on the desk), its
//                   centre moved with the break point each frame and snapped to its own spacing on a lattice fixed for the pass, so the
//                   vertices never swim over the water as the peel runs down the pool
//   THE FAR GRID    the whole basin, coarse, with a hole cut (per fragment) where the near grid lies, the two overlapping a band at the
//                   seam and the far one pushed back there (a polygon offset), so no crack opens between them
// Every vertex is displaced by `wpSurface`; its normal by finite differences of the same function in the vertex shader (GPU Gems ch. 1,
// there done analytically: here the wave is a piecewise profile, so the difference). Per fragment:
//   the column     the water's own depth under the eye (the surface minus the analytic bed, `wpBed`: no depth texture), Beer-Lambert
//                  over the path through it (red first: the shallows clear over the bed's pale tiles and their caustics, the deep teal)
//   the sky        by Fresnel (Schlick, 2% head-on), the painted sky in the reflection (vfx/sky.js), short of a mirror
//   the face       thinning toward the crest: the light through it (DICE's translucency approximation: a bent back-light, the sky
//                  behind it), jade where it is thinnest, so a face held against the sun glows (Sea of Thieves' crest colour)
//   the tube       the face under the lip is in its shade: the sun and sky dimmed, lit instead by the jade light coming through the lip
//   the foam       cartoon (Wind Waker, Sea of Thieves): the bubbles' noise thresholded against the ported `foamAt` mask, crisp over a
//                  pixel, a shadowed rim round each patch; scrolled with the bore's travel; the aerated bore paler under it
//   the face's     Hokusai's roughness (The Great Wave off Kanagawa): foam streaked up the face in bands down its fall line, drawn up
//   streaks        toward the crest and broken there, and a rougher face (the fine normals stronger on it, a ridge noise along the crest)
//   the glints     the swell's crests catching the sun where the fine noise crosses them, faded at a low look (the house's: vfx/water.js)
//   the wake       the ripple tank's rings (vfx/ripples.js) bend it as they bend every water in the game
// One opaque program (no sort, no depth texture), drawn on the desk and the phone alike; the phone gets coarser grids, never a simpler
// shader (CLAUDE.md, the desk's look is never cut for the phone).
//
// Prior art: GPU Gems ch. 1 (Finch: sums of sines displaced on the GPU), Horizon Forbidden West's water (Guerrilla, SIGGRAPH 2022: a
// camera-centred dense grid over a coarse one), Tessendorf's projected grids, DICE (Barré-Brisebois and Bouchard, GDC 2011:
// translucency), Sea of Thieves (Ang, SIGGRAPH 2018), Wind Waker's foam, the house's own water (vfx/water.js) whose colours these follow.
//
//   const W = new WavePoolWater(game, { U, pool, lean })   (pool: wavePool())   W.near  W.far  (meshes)   W.place(S, t)   W.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WAVEPOOL_GLSL, WAVE } from '../../world/raceway/surf/wavepool.js';
import { LIQUID_GLSL, liquidUniforms } from '../liquid.js';
import { RIPPLE_U, RIPPLE_GLSL } from '../ripples.js';
import { WAVE_PARTS_GLSL, WAVE_SHADE_GLSL, SKY_FALLBACK_GLSL, LIP_END } from './waveglsl.js';

/** The grids: the near one's reach along the crest (behind the break, ahead of it) and across it (behind the crest, ahead), its spacing
 *  on the desk and on a lean machine; the far one's spacing; the seam's overlap (m); the eps of the normals' differences. */
export const WAVE_WATER = {
  near: { s: [-150, 90], d: [-80, 52], step: 0.55, lean: 1.1 }, // (the great wave's reach: its back 34 m, its face 17, its tube 60, the lip landing 22 m out: WAVE)
  far: { step: 3, lean: 5 },
  seam: 3, eps: { near: 0.35, far: 0.9 },
};

const VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WAVEPOOL_GLSL}
${WAVE_PARTS_GLSL}
uniform vec2 uO, uA, uB; uniform vec3 uRW; uniform float uEps;
varying vec3 vW; varying vec3 vN; varying vec2 vP;
float wpH(vec2 p) { return wpSurface(wpToPark(wpClampUV(wpUV(p)))).x; }
void main() {
  vec2 p = uO + position.x * uA + position.z * uB;
  p = wpToPark(wpClampUV(wpUV(p))); // (kept inside the basin: past its walls a vertex folds onto them)
  float h = wpSurface(p).x, hx = wpH(p + vec2(uEps, 0.0)), hz = wpH(p + vec2(0.0, uEps));
  vN = normalize(vec3(-(hx - h) / uEps, 1.0, -(hz - h) / uEps));
  vec4 wp = vec4(p.x + uRW.x, h + uRW.y, p.y + uRW.z, 1.0);
  vW = wp.xyz; vP = p;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform sampler2D uSky;
//SKY
${WAVEPOOL_GLSL}
${WAVE_PARTS_GLSL}
${LIQUID_GLSL}
${RIPPLE_GLSL}
${WAVE_SHADE_GLSL}
uniform vec4 uHole; uniform vec2 uHoleO, uHoleA, uHoleB; uniform float uHoleOn;
varying vec3 vW; varying vec3 vN; varying vec2 vP;
void main() {
  if (uHoleOn > 0.5) { // (the far grid: where the near one lies, it gives way)
    vec2 q = vP - uHoleO; float hs = dot(q, uHoleA), hd = dot(q, uHoleB);
    if (hs > uHole.x && hs < uHole.y && hd > uHole.z && hd < uHole.w) discard;
  }
  vec2 uv = wpUV(vP);
  float H, F; vec4 w = wpWave(uv, H, F);
  float surf = vW.y - uRW.y, bed = wpBed(uv), col0 = surf - bed;
  if (col0 < 0.03 && uv.y < 0.0) discard; // (the beach above the wash: the sand's own mesh)
  float s = w.y, d = w.z, zone = w.w, hw = clamp(w.x / max(H, 0.5), 0.0, 1.0), t = uTime;
  vec3 V = normalize(cameraPosition - vW);
  float dist = length(cameraPosition - vW), far = smoothstep(25.0, 140.0, dist);
  vec3 N = normalize(vN);
  vec3 pn = liqNormal(vW.xz, 0.14, t, 0.9 * (1.0 - 0.75 * far)), fine = liqRipple(vW.xz, 0.38, t, 0.45 * (1.0 - far));
  float faceK = smoothstep(-0.2 * F, 0.05 * F, d) * (1.0 - smoothstep(0.9 * F, 1.3 * F, d)) * step(0.5, zone) * step(zone, 3.5) * smoothstep(3.0, 8.0, H);
  vec2 sd = vec2(s * 0.21, d * 0.045); // (the face's own frame: across the crest stretched, so bands run down the fall line)
  float ridge = liqTap(sd + vec2(0.0, -t * 0.05)).g * 0.65 + liqTap(sd * 2.3 + vec2(0.37, t * 0.03)).g * 0.35;
  N = normalize(N + vec3(pn.x + fine.x, 0.0, pn.z + fine.z) * (1.0 - 0.6 * hw) * (1.0 + 1.3 * faceK));
  vec2 crP = wpToPark(uWP[3].zw) - wpToPark(vec2(0.0)); // (the crest's way in the park)
  N = normalize(N + (ridge - 0.5) * 0.35 * faceK * vec3(crP.x, 0.0, crP.y)); // (the bands' ridges rough the face across the crest)
  vec3 rip = ripSlope(vW.xz); N = normalize(N + vec3(-rip.x, 0.0, -rip.y) * 1.2);
  if (!gl_FrontFacing && dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0), fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, N), sky = wpSky(R), L = normalize(uSun), Hh = normalize(L + V);
  float sp = max(dot(N, Hh), 0.0), graze = smoothstep(0.04, 0.4, abs(V.y));
  // the column: Beer-Lambert over the path through the water's own depth, the bed's pale tiles and caustics seen through the shallows
  float path = max(col0, 0.0) / max(abs(V.y), 0.22);
  vec3 Tr = exp(-vec3(0.9, 0.28, 0.19) * path);
  vec3 water = mix(WP_DEEP, WP_BODY, Tr.g);
  vec2 floorP = vW.xz - V.xz / max(V.y, 0.25) * col0 * 0.8 + N.xz * 0.3 * col0;
  vec2 fpx = fwidth(floorP);
  vec3 caus = liqCaustics(floorP, 1.0, t, max(fpx.x, fpx.y));
  float focus = smoothstep(0.05, 0.4, col0) * (1.0 - smoothstep(0.8, 5.0, col0) * 0.75);
  float tile = step(0.5, fract(floorP.x * 0.5)) * 0.04 + step(0.5, fract(floorP.y * 0.5)) * 0.04; // (the bed's plaster tiles, faintly)
  vec3 floorC = vec3(0.84, 0.8, 0.66) * (0.78 + tile + 0.25 * liqTap(floorP * 0.3).b) + caus * 0.5 * focus;
  vec3 col = mix(water, floorC * vec3(0.6, 0.95, 0.92), Tr);
  col += caus * focus * 0.4 * Tr;
  // the face thinning toward the crest: the light through it
  float onFace = smoothstep(-0.35 * F, 0.0, d) * (1.0 - smoothstep(0.85 * F, 1.2 * F, d)) * step(0.5, zone);
  float thin = smoothstep(0.3, 1.0, hw) * (0.35 + 0.65 * onFace) * step(0.2, H);
  // the tube: the face under the lip in its shade, lit through it
  float tube = uWP[5].z, tau = smoothstep(-${WAVE.lead.toFixed(1)}, uWP[5].w, -s), gone = smoothstep(-tube * ${LIP_END[0]}, -tube * ${LIP_END[1]}, s);
  float under = tau * (1.0 - gone) * smoothstep(-0.01 * F, 0.004 * F, d) * (1.0 - smoothstep(0.9 * F, 1.15 * F, d)) * step(3.0, H); // (to the crest itself: the curl's strip begins there)
  float mouth = smoothstep(-tube * 0.75, 2.0, s);
  col += wpThrough(V, N, thin) * (1.0 - 0.4 * under);
  col = mix(col, wpTube(0.4 * hw, mouth, V, N, tau), under * 0.94); // (the tube's wall, shaded as the curl over it is: lip.js, one surface)
  // the sky in it, short of a mirror, dimmed in the tube
  col = mix(col, sky * 0.85, clamp(fres, 0.0, 0.55) * (1.0 - 0.9 * under));
  // the sun: a soft highlight and glints where the swell's crests cross the fine noise
  float swl = wpSwell(uv, t);
  float glint = smoothstep(0.88, 0.96, liqTap(vW.xz * 0.85 + vec2(t * 0.05, -t * 0.03)).g) * pow(sp, 28.0) * smoothstep(0.1, 0.55, swl + hw * 0.5);
  vec3 sunC = uSunC * (pow(sp, 120.0) * 0.4 + pow(sp, 14.0) * 0.03 + glint * 0.5 * (1.0 - far) * graze) * (1.0 - under);
  col += min(sunC * mix(0.15, 1.0, graze), vec3(0.75));
  // the foam: the ported mask, thresholded noise scrolled with the bore's travel
  float mask = wpFoamMask(s, d, zone, H, F, uv.y);
  mask = max(mask, smoothstep(0.6, 1.0, hw) * step(1.5, zone) * 0.25 * step(s, 16.0)); // (the crest pitching)
  float streak = smoothstep(0.5, 0.72, ridge) * faceK * (0.25 + 0.75 * smoothstep(0.3, 0.95, hw)); // (Hokusai's foam bands up the face)
  mask = max(mask, streak * 0.85);
  mask *= 1.0 - 0.9 * under * (1.0 - smoothstep(0.72 * F, 0.92 * F, d)); // (no foam on the tube's wall up to the curl: the lip's landing line kept)
  vec2 flowP = wpToPark(uv + uWP[3].xy) - wpToPark(uv);
  vec2 fm = wpFoam(vW.xz, -flowP * (zone > 3.5 ? uWP[4].y * 0.6 : 0.4), mask, t);
  col = mix(col, vec3(0.62, 0.86, 0.86) * (0.6 + 0.4 * uDay), mask * 0.3 * step(3.5, zone)); // (the bore is aerated: paler under its foam)
  vec3 foamLit = WP_FOAM * (0.55 + 0.45 * max(dot(N, L), 0.0)) * (0.55 + 0.45 * uDay) + sky * 0.12;
  col = mix(col, WP_FOAM_SH * (0.5 + 0.5 * uDay), fm.y * 0.55);
  col = mix(col, foamLit * (1.0 - 0.35 * under), fm.x);
  col += (sky * 0.16 + 0.02) * smoothstep(0.08, 0.3, length(rip.xy)) * (1.0 - far);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

let FALLBACK_SKY = null;
const fallbackSky = () => (FALLBACK_SKY ||= Object.assign(new THREE.DataTexture(new Uint8Array([214, 168, 140, 255]), 1, 1), { needsUpdate: true }));

/** The pool's water material (one program: the near grid and the far differ only in uniforms). `U` the shared uniforms (uWP, uSun ..). */
export function wavePoolWaterMaterial(game, U, { hole = false, eps = 0.3 } = {}) {
  const sky = game.sky;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uO: { value: new THREE.Vector2() }, uA: { value: new THREE.Vector2(1, 0) }, uB: { value: new THREE.Vector2(0, 1) }, uEps: { value: eps },
    uHole: { value: new THREE.Vector4(1, -1, 1, -1) }, uHoleO: { value: new THREE.Vector2() }, uHoleA: { value: new THREE.Vector2(1, 0) }, uHoleB: { value: new THREE.Vector2(0, 1) }, uHoleOn: { value: hole ? 1 : 0 },
    ...liquidUniforms(),
  }]);
  uniforms.uSky = { value: sky?.texture ?? fallbackSky() };
  Object.assign(uniforms, U, RIPPLE_U); // (shared by reference: one write a frame reaches every material)
  const m = new THREE.ShaderMaterial({ name: 'wavepool-water', uniforms, vertexShader: VERT, fragmentShader: FRAG.replace('//SKY', sky?.GLSL ?? SKY_FALLBACK_GLSL), fog: true, side: THREE.DoubleSide });
  if (hole) { m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 4; }
  return m;
}

/** A flat grid of `nx` by `nz` cells, its vertices at (x0 + i * step, 0, z0 + j * step): the shader lays them on the water. */
function gridGeometry(x0, x1, z0, z1, step) {
  const nx = Math.max(1, Math.round((x1 - x0) / step)), nz = Math.max(1, Math.round((z1 - z0) / step));
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { pos[k++] = x0 + (i / nx) * (x1 - x0); pos[k++] = 0; pos[k++] = z0 + (j / nz) * (z1 - z0); }
  const n = nx * nz * 6, idx = (nx + 1) * (nz + 1) > 65535 ? new Uint32Array(n) : new Uint16Array(n);
  k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

export class WavePoolWater {
  constructor(game, { U, pool, lean = false }) {
    const C = WAVE_WATER, P = pool.POOL;
    this.U = U; this.step = lean ? C.near.lean : C.near.step;
    this.nearMat = wavePoolWaterMaterial(game, U, { eps: C.eps.near });
    this.farMat = wavePoolWaterMaterial(game, U, { hole: true, eps: C.eps.far });
    this.near = new THREE.Mesh(gridGeometry(C.near.s[0], C.near.s[1], C.near.d[0], C.near.d[1], this.step), this.nearMat);
    const fs = lean ? C.far.lean : C.far.step;
    this.far = new THREE.Mesh(gridGeometry(0, P.L, -P.beach, P.W, fs), this.farMat);
    for (const m of [this.near, this.far]) { m.frustumCulled = false; m.name = m === this.near ? 'wavepool-water-near' : 'wavepool-water-far'; m.userData.zone = 'raceway'; }
    // the far grid's frame: (u, v) metres over the pool's corner
    const ax = pool.axes ?? { ux: 1, uz: 0, vx: 0, vz: 1 }, fu = this.farMat.uniforms;
    fu.uA.value.set(ax.ux, ax.uz); fu.uB.value.set(ax.vx, ax.vz);
    fu.uO.value.set(P.x - (P.L / 2) * ax.ux - (P.W / 2) * ax.vx, P.z - (P.L / 2) * ax.uz - (P.W / 2) * ax.vz);
    const sm = C.seam; fu.uHole.value.set(C.near.s[0] + sm, C.near.s[1] - sm, C.near.d[0] + sm, C.near.d[1] - sm);
    this.ax = ax; this.centre = new THREE.Vector2();
  }

  /** The near grid moved to the break point (S the pool, t its clock), snapped to its own spacing on the pass's fixed lattice. */
  place(S, t) {
    const st = S.state(t), P = S.POOL, ax = this.ax;
    const T = [st.tu * ax.ux + st.tv * ax.vx, st.tu * ax.uz + st.tv * ax.vz], N = [st.nu * ax.ux + st.nv * ax.vx, st.nu * ax.uz + st.nv * ax.vz];
    const ub = Math.min(P.L + 30, Math.max(-30, st.ub)), du = ub - P.L / 2, dv = P.vb - P.W / 2;
    const bx = P.x + du * ax.ux + dv * ax.vx, bz = P.z + du * ax.uz + dv * ax.vz; // (the break point in the park)
    const qx = bx - P.x, qz = bz - P.z, step = this.step;
    const cs = Math.round((qx * T[0] + qz * T[1]) / step) * step, cd = Math.round((qx * N[0] + qz * N[1]) / step) * step;
    const ox = P.x + cs * T[0] + cd * N[0], oz = P.z + cs * T[1] + cd * N[1];
    const nu = this.nearMat.uniforms, fu = this.farMat.uniforms;
    nu.uO.value.set(ox, oz); nu.uA.value.set(T[0], T[1]); nu.uB.value.set(N[0], N[1]);
    fu.uHoleO.value.set(ox, oz); fu.uHoleA.value.set(T[0], T[1]); fu.uHoleB.value.set(N[0], N[1]);
    this.centre.set(ox, oz);
  }

  dispose() { for (const m of [this.near, this.far]) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); } }
}
