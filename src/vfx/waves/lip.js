// ---------------------------------------------------------------------------------------
// THE LIP (docs/ref/WAVE-RIDING.md 5): the curl thrown over the barrel, one strip swept along the crest from just ahead of the break
// point (the crest feathering) back through the tube (s from +throwLen to -tube), its cross-section the pool's own `lipCurve` built on
// the GPU from the same uniforms the water reads (vfx/waves/waveglsl.js `wpLipAt`), so the curl stands exactly where the rules' cover
// test (wavepool.js `barrelAt`) says it does. One small grid (180 along, 34 across on the desk), no CPU work a frame.
//   OUTSIDE   the curl's back, the water's own look: the sky by Fresnel, the deep teal thinning to jade toward the tip
//   INSIDE    what the tube is: the light through the lip (DICE's translucency, its thickness from the curve's parameter: thin at the
//             tip), the sky behind it, the light rippling through it in slow bands (the liquid's glowing cells drawn along the crest),
//             and at a grazing look the labradorite film's faint schiller (the house's Lachryma, a hint, never a sheen)
//   THE TIP   foam, the lip thick to its edge, and past it THE FINGERS (Hokusai's "The Great Wave off Kanagawa", c. 1831: the crest
//             breaking into clawing tendrils of foam): the strip run on past the tip (a from 1 to 1 + LIP_FINGERS.len) reaching forward
//             and hooking down, cut per fragment by a fractal mask along the crest (ridges at three scales, each finger its own length,
//             tapering and splitting toward its end, the noise on its edge), all foam; the spray's particles fly off them (spray.js)
//   THE END   past the tube's end the curl shrinks and drops into the whitewater, dissolving on the same noise
//
// Prior art: Horizon Forbidden West's water (Guerrilla, SIGGRAPH 2022: a baked cross-section of the breaking wave swept along the
// wavefront, the peel a rising phase; here the section is a function), Fournier and Reeves 1986 (the curl as an ellipse thrown off the
// crest), DICE's GDC 2011 translucency, Riptide GP's and Wave Race 64's readable curls, Sea of Thieves' crest colour.
//
//   const L = new WavePoolLip(game, { U, lean })   L.mesh   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WAVEPOOL_GLSL, WAVE } from '../../world/raceway/surf/wavepool.js';
import { LIQUID_GLSL, liquidUniforms } from '../liquid.js';
import { WAVE_PARTS_GLSL, WAVE_SHADE_GLSL, SKY_FALLBACK_GLSL } from './waveglsl.js';

/** The strip's samples along the crest and across the curl (desk, lean); the fingers: their share of the strip past the tip (of a),
 *  their reach (a share of F) and how far down they hook (a share of their reach). */
export const WAVE_LIP = { along: [180, 96], across: [34, 20] };
export const LIP_FINGERS = { len: 0.3, reach: 0.24, hook: 0.85 };

const VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WAVEPOOL_GLSL}
${WAVE_PARTS_GLSL}
uniform vec3 uRW;
varying vec3 vW; varying vec3 vNo; varying float vA; varying float vS; varying float vTau; varying float vGone; varying float vOn; varying float vQ;
void main() {
  float s = mix(uWP[5].w, -uWP[5].z * 1.05, position.x), aa = position.y * ${(1 + LIP_FINGERS.len).toFixed(3)}, a = min(aa, 1.0);
  float q = max(aa - 1.0, 0.0) / ${LIP_FINGERS.len.toFixed(3)};
  vec3 n; float gone; vec4 L = wpLipAt(s, a, n, gone);
  if (q > 0.0) { // (the fingers: on from the tip, reaching forward over the trough and hooking down)
    float Hh, Ff; wpWave(wpBreakUV() + s * uWP[3].zw, Hh, Ff);
    vec2 trP = wpToPark(uWP[3].xy) - wpToPark(vec2(0.0));
    float len = Ff * ${LIP_FINGERS.reach.toFixed(3)} * L.w * (1.0 - 0.8 * gone);
    L.xy += trP * len * q; L.z += len * (0.35 * q - ${LIP_FINGERS.hook.toFixed(3)} * q * q);
    n = normalize(mix(n, vec3(trP.x, -0.6, trP.y), 0.5 * q));
  }
  vQ = q;
  vec2 uv = wpUV(L.xy);
  vOn = step(0.0, uv.x) * step(uv.x, uWP[1].x) * step(0.0, uv.y) * step(uv.y, uWP[1].y); // (a curl past the basin's walls is not drawn)
  vec4 wp = vec4(L.x + uRW.x, L.z + uRW.y, L.y + uRW.z, 1.0);
  vW = wp.xyz; vNo = n; vA = a; vS = s; vTau = L.w; vGone = gone;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform sampler2D uSky;
//SKY
${LIQUID_GLSL}
${WAVE_SHADE_GLSL}
varying vec3 vW; varying vec3 vNo; varying float vA; varying float vS; varying float vTau; varying float vGone; varying float vOn; varying float vQ;
// the crest's claws: ridges along the crest at three scales (a finger, its split, its knuckles), each finger its own length; 1 inside
float lipFinger(float s, float q, float n) {
  float c = s * 1.75 + 1.6 * sin(s * 0.29) + 0.8 * sin(s * 0.71 + 2.0), k = floor(c / 6.28318);
  float r1 = 0.5 + 0.5 * cos(c), r2 = 0.5 + 0.5 * cos(c * 2.13 + 1.3 + 0.9 * sin(s * 0.53)), r3 = 0.5 + 0.5 * cos(c * 4.7 + 0.6);
  float reach = 0.45 + 0.55 * fract(sin(k * 91.7 + 3.1) * 4373.5); // (each finger its own length)
  float w = r1 - (0.3 + 0.55 * q) + (r2 - 0.5) * 0.5 * smoothstep(0.35, 0.8, q) + (r3 - 0.5) * 0.18 + (n - 0.5) * 0.35;
  return step(0.0, w) * step(q, reach);
}
void main() {
  if (vOn < 0.5 || vTau < 0.02) discard;
  float t = uTime;
  float n1 = liqTap(vW.xz * 0.11 + vec2(t * 0.06, -t * 0.04)).g * 0.6 + liqTap(LIQ_ROT * vW.xz * 0.27 + vec2(-t * 0.05, t * 0.07)).g * 0.4;
  // the tip thick to its edge, the fingers past it, the end dissolving into the whitewater (a dithered cut: opaque, never sorted)
  float feather = smoothstep(0.93, 1.0, vA) * 0.3, cut = feather + vGone * 1.1;
  float dith = wpHash(gl_FragCoord.xy) * 0.18;
  if (n1 + dith < cut) discard;
  if (vQ > 0.0 && lipFinger(vS, vQ, n1 + dith * 0.5) < 0.5) discard;
  vec3 V = normalize(cameraPosition - vW), N = normalize(vNo);
  bool inner = dot(N, V) < 0.0; if (inner) N = -N;
  vec3 pn = liqNormal(vW.xz + vec2(vA * 3.0, 0.0), 0.2, t, 0.6); N = normalize(N + vec3(pn.x, 0.0, pn.z) * 0.5);
  float ndv = clamp(dot(N, V), 0.0, 1.0), fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 sky = wpSky(reflect(-V, N)), L = normalize(uSun);
  float thin = mix(0.45, 1.0, vA) * vTau;
  vec3 body = mix(WP_DEEP, WP_BODY, 0.55 + 0.4 * vA);
  vec3 col;
  if (inner) {
    // inside the tube: dark where the lip is thick (its root over the crest, the water's whole weight), luminous jade where it thins to
    // the tip and the light comes through, darker the deeper into the tube from the mouth; slow bands of light along it (a tube is
    // read by that gradient: the roof's dark heel to the bright curtain, the mouth the brightest thing in the frame)
    float lit = pow(clamp(vA, 0.0, 1.0), 1.4) * vTau, deep = 0.45 + 0.55 * smoothstep(-${WAVE.tube.toFixed(1)}, 0.0, vS);
    float bands = liqGlow(vec2(vS * 0.35 - t * 0.6, vA * 2.0), 0.6, t) * 0.7 + 0.3;
    vec3 heel = WP_DEEP * 0.32, glass = mix(WP_BODY, WP_GLOW, 0.35) * 1.25;
    col = mix(heel, glass, lit) * deep + wpThrough(V, N, thin) * lit * (0.6 + 0.25 * bands) * deep; // (the bands soft: down the tube they converge to rays, Calissa 2026-11-06)
    col = mix(col, sky * 0.6, fres * 0.25 * lit);
    col += liqFilm(vA * 0.8 + vS * 0.02 + fres * 0.6 + t * 0.01) * fres * 0.05; // (the film's schiller, at a grazing look only)
  } else {
    col = mix(body, WP_DEEP, 0.3 * (1.0 - vA)) + wpThrough(V, N, thin * 0.75);
    col = mix(col, sky * 0.85, clamp(fres, 0.0, 0.55));
    float sp = max(dot(N, normalize(L + V)), 0.0);
    col += uSunC * (pow(sp, 90.0) * 0.35 + pow(sp, 12.0) * 0.03);
  }
  // the tip's foam: the noise thresholded crisp toward the edge, white and a shadowed rim
  float fmask = smoothstep(0.62, 0.96, vA) + vGone * 0.6 + vQ * 2.0, th = 1.0 - fmask * 0.9, w = max(fwidth(n1) * 0.9, 0.012);
  float foam = smoothstep(th - w, th + w, n1), rim = clamp(smoothstep(th - 0.13 - w, th - 0.13 + w, n1) - foam, 0.0, 1.0);
  vec3 foamLit = WP_FOAM * (0.6 + 0.4 * max(dot(N, L), 0.0)) * (0.55 + 0.45 * uDay) + sky * 0.1;
  col = mix(col, WP_FOAM_SH * (0.5 + 0.5 * uDay), rim * 0.5);
  col = mix(col, inner ? foamLit * 0.85 + WP_GLOW * 0.1 : foamLit, foam);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function stripGeometry(na, nb) {
  const pos = new Float32Array((na + 1) * (nb + 1) * 3); let k = 0;
  for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) { pos[k++] = i / na; pos[k++] = j / nb; pos[k++] = 0; }
  const idx = new Uint16Array(na * nb * 6); k = 0;
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1; idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

export class WavePoolLip {
  constructor(game, { U, lean = false }) {
    const sky = game.sky, li = lean ? 1 : 0;
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { ...liquidUniforms() }]);
    uniforms.uSky = { value: sky?.texture ?? new THREE.DataTexture(new Uint8Array([214, 168, 140, 255]), 1, 1) };
    if (!sky?.texture) uniforms.uSky.value.needsUpdate = true;
    Object.assign(uniforms, U);
    this.mat = new THREE.ShaderMaterial({ name: 'wavepool-lip', uniforms, vertexShader: VERT, fragmentShader: FRAG.replace('//SKY', sky?.GLSL ?? SKY_FALLBACK_GLSL), fog: true, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(stripGeometry(WAVE_LIP.along[li], WAVE_LIP.across[li]), this.mat);
    this.mesh.frustumCulled = false; this.mesh.name = 'wavepool-lip'; this.mesh.userData.zone = 'raceway';
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
