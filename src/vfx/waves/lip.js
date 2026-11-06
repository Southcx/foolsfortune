// ---------------------------------------------------------------------------------------
// THE LIP (docs/ref/WAVE-RIDING.md 5): the curl thrown over the barrel, one strip swept along the crest from just ahead of the break
// point (the crest feathering) back through the tube (s from +throwLen to -tube), its cross-section the pool's own `lipCurve` built on
// the GPU from the same uniforms the water reads (vfx/waves/waveglsl.js `wpLipAt`), so the curl stands exactly where the rules' cover
// test (wavepool.js `barrelAt`) says it does. One small grid (64 along, 22 across), no CPU work a frame.
//   OUTSIDE   the curl's back, the water's own look: the sky by Fresnel, the deep teal thinning to jade toward the tip
//   INSIDE    what the tube is: the light through the lip (DICE's translucency, its thickness from the curve's parameter: thin at the
//             tip), the sky behind it, the light rippling through it in slow bands (the liquid's glowing cells drawn along the crest),
//             and at a grazing look the labradorite film's faint schiller (the house's Lachryma, a hint, never a sheen)
//   THE TIP   foam, then feathered into spray by a dithered cut on the noise (an opaque strip, never a sorted blend); the spray's
//             particles carry it on (vfx/waves/spray.js)
//   THE END   past the tube's end the curl shrinks and drops into the whitewater, dissolving on the same noise
//
// Prior art: Horizon Forbidden West's water (Guerrilla, SIGGRAPH 2022: a baked cross-section of the breaking wave swept along the
// wavefront, the peel a rising phase; here the section is a function), Fournier and Reeves 1986 (the curl as an ellipse thrown off the
// crest), DICE's GDC 2011 translucency, Riptide GP's and Wave Race 64's readable curls, Sea of Thieves' crest colour.
//
//   const L = new WavePoolLip(game, { U, lean })   L.mesh   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { WAVEPOOL_GLSL } from '../../world/raceway/surf/wavepool.js';
import { LIQUID_GLSL, liquidUniforms } from '../liquid.js';
import { WAVE_PARTS_GLSL, WAVE_SHADE_GLSL, SKY_FALLBACK_GLSL } from './waveglsl.js';

/** The strip's samples along the crest and across the curl (desk, lean). */
export const WAVE_LIP = { along: [72, 40], across: [22, 14] };

const VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WAVEPOOL_GLSL}
${WAVE_PARTS_GLSL}
uniform vec3 uRW;
varying vec3 vW; varying vec3 vNo; varying float vA; varying float vS; varying float vTau; varying float vGone; varying float vOn;
void main() {
  float s = mix(uWP[5].w, -uWP[5].z * 1.05, position.x), a = position.y;
  vec3 n; float gone; vec4 L = wpLipAt(s, a, n, gone);
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
varying vec3 vW; varying vec3 vNo; varying float vA; varying float vS; varying float vTau; varying float vGone; varying float vOn;
void main() {
  if (vOn < 0.5 || vTau < 0.02) discard;
  float t = uTime;
  float n1 = liqTap(vW.xz * 0.11 + vec2(t * 0.06, -t * 0.04)).g * 0.6 + liqTap(LIQ_ROT * vW.xz * 0.27 + vec2(-t * 0.05, t * 0.07)).g * 0.4;
  // the tip feathering into spray, the end dissolving into the whitewater (a dithered cut: opaque, never sorted)
  float feather = smoothstep(0.82, 1.0, vA), cut = feather * 0.85 + vGone * 1.1;
  float dith = wpHash(gl_FragCoord.xy) * 0.18;
  if (n1 + dith < cut) discard;
  vec3 V = normalize(cameraPosition - vW), N = normalize(vNo);
  bool inner = dot(N, V) < 0.0; if (inner) N = -N;
  vec3 pn = liqNormal(vW.xz + vec2(vA * 3.0, 0.0), 0.2, t, 0.6); N = normalize(N + vec3(pn.x, 0.0, pn.z) * 0.5);
  float ndv = clamp(dot(N, V), 0.0, 1.0), fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 sky = wpSky(reflect(-V, N)), L = normalize(uSun);
  float thin = mix(0.45, 1.0, vA) * vTau;
  vec3 body = mix(WP_DEEP, WP_BODY, 0.55 + 0.4 * vA);
  vec3 col;
  if (inner) {
    // inside the tube: the light through the lip, rippling in bands along the crest, the sky behind it
    float bands = liqGlow(vec2(vS * 0.35 - t * 0.6, vA * 2.0), 0.6, t) * 0.7 + 0.3;
    col = body * 0.55 + wpThrough(V, N, thin) * (0.9 + 0.6 * bands) + WP_GLOW * 0.12 * thin * (0.5 + 0.5 * uDay);
    col = mix(col, sky * 0.6, fres * 0.35);
    col += liqFilm(vA * 0.8 + vS * 0.02 + fres * 0.6 + t * 0.01) * fres * 0.05; // (the film's schiller, at a grazing look only)
  } else {
    col = mix(body, WP_DEEP, 0.3 * (1.0 - vA)) + wpThrough(V, N, thin * 0.75);
    col = mix(col, sky * 0.85, clamp(fres, 0.0, 0.55));
    float sp = max(dot(N, normalize(L + V)), 0.0);
    col += uSunC * (pow(sp, 90.0) * 0.35 + pow(sp, 12.0) * 0.03);
  }
  // the tip's foam: the noise thresholded crisp toward the edge, white and a shadowed rim
  float fmask = smoothstep(0.62, 0.96, vA) + vGone * 0.6, th = 1.0 - fmask * 0.9, w = max(fwidth(n1) * 0.9, 0.012);
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
