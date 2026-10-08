// ---------------------------------------------------------------------------------------
// WATER: the surface of a pool, and beside it the liquid that Lachryma is when it has not been condensed into cubes. Both are drawn with
// the shared liquid library (vfx/liquid.js: the owner's noise photographs, two crossing layers of each), so every liquid in the game
// moves and catches the light the same way.
//
// THE WATER paints its own floor, as the sixth generation's best water did (Super Mario Sunshine's, BioShock's): where the eye meets the
// bottom (bent by the surface, deeper water further off), the sand ripples are laid and lit by CAUSTICS (a net of light writhing in
// place, in two layers a little apart: white where they meet, split into colour where they part), and that floor is seen through the water by the depth of water the eye looks through (an absorption, red first: shallows
// clear and sandy, the deeps teal to marine). Over it: the painted sky by Fresnel (Schlick, 2% head-on), short of a mirror; a broad,
// soft sun highlight on the surface's slopes (two layers of the marbling, crossing), its size and strength varied by a slow field of
// GLOSS (rougher and smoother patches, so the sheen is never one even coat: the owner, 2026-10-08, found the old tight highlight and
// sharp rings "a little too plastic-y"), and GLINTS where the fine bubbles cross it (the water's sparkle: welcome, the owner's, R58);
// the rings of the ripple tank bend the light and the floor softly (their slopes filtered, vfx/ripples.js) and never whiten; the
// CAUSTICS on the floor are the shared Voronoi net in two layers (vfx/liquid.js), with a faint web of it on the surface over the
// shallows; the CREST GLOW, light through the thin top of a wave toward the sun (Sea of Thieves); FOAM made of
// bubbles at the shore, breathing with the swell. It is opaque in the body and fades only at the very edge onto the real sand. The far
// water calms (the slopes lie down with distance, as Sunshine's mip levels did), so it never turns to noise.
//
// LIQUID LACHRYMA (kind 'lachryma') is the same plane made heavy and slow: ink, a glossy oil highlight, the dark sky in it, and the thin
// film's colours living in the marbling's cells and veins (the owner's photograph of oil is what Lachryma looks like close up), with an
// iridescent meniscus where it meets the stone. The Weir's Well is filled with it. The two kinds are one shader program: which one a
// material is, is a uniform (uLachryma), never a define, so the pond and the Well do not compile a program each (CASEBOOK rule 5).
//
// Prior art (researched for the owner's ask, R58; sources in docs/ART.md, "Liquid"): Super Mario Sunshine (two textures scrolled
// against each other, the water changing with distance, the floor and its light seen through), Valve's water and flow maps (Vlachos,
// SIGGRAPH 2010: crossing normal layers), Sea of Thieves (the sub-surface crest colour, foam where the water meets things), Roystan's
// toon water (depth colour, threshold foam at the shore), Zucconi's caustics, GPU Gems ch. 1 (the summed waves), Wind Waker and Final
// Fantasy X (a painted sky in the water, a palette chosen, not simulated).
//
//   const w = makeWaterMaterial(sky, 'water' | 'lachryma');   w.uniforms.uTime.value = t;
//   waterGeometry(volume)   -> a plane with `aDepth` (metres to the floor; 0 at the edge) for the volume { x0, x1, z0, z1, surface, bottom, depthAt? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { liquidUniforms, LIQUID_GLSL } from './liquid.js';
import { RIPPLE_U, RIPPLE_GLSL } from './ripples.js';

const VERT = `
#include <common>
#include <fog_pars_vertex>
attribute float aDepth;
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uSpeed;
varying vec3 vW; varying float vDepth; varying float vH; varying vec3 vN; varying float vGloss;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float f = uFreq, t = uTime * uSpeed;
  float a1 = wp.x * 1.3 * f + t * 1.5, a2 = wp.z * 1.7 * f - t * 1.2, a3 = (wp.x + wp.z) * 0.8 * f + t * 0.9;
  float calm = smoothstep(0.0, 0.7, aDepth);            // (the water lies still against the shore)
  float h = uAmp * (0.5 * sin(a1) + 0.4 * sin(a2) + 0.3 * sin(a3)) * calm;
  float dx = uAmp * calm * (0.5 * 1.3 * f * cos(a1) + 0.3 * 0.8 * f * cos(a3));
  float dz = uAmp * calm * (0.4 * 1.7 * f * cos(a2) + 0.3 * 0.8 * f * cos(a3));
  wp.y += h;
  vN = normalize(vec3(-dx * 1.6, 1.0, -dz * 1.6));
  vW = wp.xyz; vDepth = aDepth; vH = h / max(uAmp, 1e-4);
  vGloss = smoothstep(-0.6, 0.6, sin(wp.x * 0.23 + wp.z * 0.07 + t * 0.05) * sin(wp.z * 0.19 - wp.x * 0.11 - t * 0.04) + 0.3 * sin((wp.x - wp.z) * 0.41 + t * 0.07)); // (the gloss's slow field, rougher and smoother patches tens of metres across: a vertex has all the detail it needs)
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = `
#include <common>
#include <fog_pars_fragment>
uniform sampler2D uSky; uniform vec3 uSun; uniform float uMaxDepth; uniform float uTime; uniform float uLachryma;
varying vec3 vW; varying float vDepth; varying float vH; varying vec3 vN; varying float vGloss;
//SKYGLSL
//LIQUIDGLSL
//RIPPLEGLSL
void main() {
  vec3 V = normalize(cameraPosition - vW);
  bool under = !gl_FrontFacing;
  float dist = length(cameraPosition - vW), far = smoothstep(18.0, 70.0, dist); // (far water calms: Sunshine's distance change)
  float t; vec3 pn;
  if (uLachryma > 0.5) {
    t = uTime * 0.35;                                                            // (viscous: it moves slowly)
    pn = liqNormal(vW.xz, 0.09, t, 3.2 * (1.0 - 0.6 * far));
  } else {
    t = uTime;
    pn = liqNormal(vW.xz, 0.16, t, 1.15 * (1.0 - 0.7 * far));                    // (calmed, 2026-10-08: the owner found the ripple "a little too plastic-y")
    vec3 fine = liqRipple(vW.xz, 0.4, t, 0.55 * (1.0 - far));                    // (the fine chop: the owner's wind-streaked ripples, close up only)
    pn = normalize(vec3(pn.xz + fine.xz, 1.0).xzy);
  }
  vec3 N = normalize(vec3(vN.x + pn.x, vN.y, vN.z + pn.z));                      // (the swell's normal, the texture's slopes laid on it)
  vec3 rip = ripSlope(vW.xz);                                                     // (the rings where something touched it: vfx/ripples.js, its slope filtered)
  N = normalize(N + vec3(-rip.x, 0.0, -rip.y) * 1.35);                            // (a ring bends the light and the floor; it is not a tube of glass)
  float ripCrest = smoothstep(0.08, 0.3, length(rip.xy)) * (1.0 - far);           // (the steepest of a ring)
  if (under) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);                                 // (Schlick, water's 2% head-on)
  vec3 R = reflect(-V, N); R.y = abs(R.y) * 0.85 + 0.15;
  vec3 sky = texture2D(uSky, skyUv(normalize(R))).rgb;
  vec3 L = normalize(uSun), H = normalize(L + V);
  float sp = max(dot(N, H), 0.0);
  vec3 col; float alpha;
  if (uLachryma > 0.5) {
  // LIQUID LACHRYMA: ink, a glossy oil reflection, and the thin film's colours in the marbling's cells and veins
  float cells = liqHeight(vW.xz, 0.09, t), veins = liqTap(vW.xz * 0.09 + vec2(t * 0.021, t * 0.013)).a;
  float film = cells * 0.9 + fres * 0.7 + dot(N.xz, vec2(0.5, 0.35)) + t * 0.01;
  float sheen = 0.025 + 0.3 * fres + 0.5 * pow(veins, 1.5);                     // (ink between, the film in the veins and at the grazing angle)
  col = vec3(0.006, 0.005, 0.011) + liqFilm(film) * sheen * 0.42 + sky * (0.02 + 0.35 * fres);
  col += vec3(1.0, 0.93, 0.84) * (pow(sp, 420.0) * 2.2 + pow(sp, 60.0) * 0.12);   // (oil is glossy: a tight bright highlight)
  col += liqFilm(film + 0.6) * pow(liqGlow(vW.xz, 0.07, t), 3.0) * 0.08 * (1.0 - fres); // (light pooled inside it, deep down, between the cells)
  float rim = 1.0 - smoothstep(0.0, 0.35, vDepth);                               // (the meniscus, iridescent, where it meets the stone)
  col += liqFilm(film + 0.3) * rim * 0.5;
  col += liqFilm(film + rip.z * 2.0) * ripCrest * 0.45;                            // (on Lachryma a ring is a slow band of the film's colours)
  alpha = 0.96;
  } else {
  // WATER: the light that comes back up through it (absorbed by the path it took), the floor's caustics seen through it, the sky in it
  float path = vDepth / max(abs(V.y), 0.25);                                     // (how much water the eye looks through)
  vec3 T = exp(-vec3(0.95, 0.3, 0.2) * path);                                  // (red goes first: shallows clear, deeps teal to marine)
  vec3 deep = vec3(0.015, 0.14, 0.28), body = vec3(0.04, 0.55, 0.58);
  vec3 water = mix(deep, body, T.g);                                              // (what the water itself gives back: teal, deepening)
  // the floor, painted where the eye meets it (bent by the surface), sand rippled and lit by the caustics, seen through the water
  vec2 floorP = vW.xz - V.xz / max(V.y, 0.25) * vDepth * 0.8 + N.xz * 0.35 * vDepth;
  float sandR = liqTap(floorP * 0.35).b;
  vec2 fpx = fwidth(floorP);                                                       // (the floor's footprint a pixel, bent by the surface: where the bending is busy the net draws softer)
  vec3 caus = liqCaustics(floorP, 1.0, t, max(fpx.x, fpx.y));                     // (the Voronoi net in two layers: vfx/liquid.js)
  float focus = smoothstep(0.03, 0.3, vDepth) * (1.0 - smoothstep(0.6, 4.5, vDepth) * 0.75); // (caustics need water to focus in: none on the wet edge, fading in the deeps)
  vec3 floorC = vec3(0.86, 0.74, 0.54) * (0.72 + 0.4 * sandR) + caus * 0.55 * focus;
  col = mix(water, floorC * vec3(0.62, 0.96, 0.92), T);                           // (clear over the shallows, the floor tinted; the deeps all water)
  col += caus * focus * 0.5 * T;                                                  // (the caustics' own light seen up through the water: the two layers keep their hues)
  // the crest glow: light through the thin top of a wave, toward the sun (Sea of Thieves' sub-surface crest)
  float back = pow(max(dot(-V, L) * 0.5 + 0.5, 0.0), 3.0);
  col += vec3(0.12, 0.62, 0.52) * smoothstep(0.2, 1.0, vH) * (0.25 + 0.75 * back) * 0.45;
  // the gloss, varied: a slow field of rougher and smoother water (wind on it in patches), so the sheen is never one even coat
  float gloss = vGloss;
  col = mix(col, sky * 0.85, clamp(fres * mix(0.75, 1.0, gloss), 0.0, 0.5));    // (the sky in it, short of a mirror: the water stays water)
  col += caus * 0.035 * (1.0 - far) * T.g;                                        // (a faint web of the floor's light on the surface itself, over the shallows)
  // the sun: a broad, soft highlight on the perturbed surface (its size by the gloss), and glints where the fine bubbles cross it
  float glint = smoothstep(0.88, 0.95, liqTap(vW.xz * 0.9 + vec2(t * 0.05, -t * 0.03)).g) * pow(sp, 30.0);
  col += vec3(1.0, 0.97, 0.88) * (pow(sp, mix(70.0, 220.0, gloss)) * mix(0.45, 1.1, gloss) + pow(sp, 16.0) * 0.045 + glint * 0.5 * (1.0 - far));
  // foam made of bubbles: thick at the shore, breathing with the swell, a little on the crests
  float shore = 1.0 - smoothstep(0.0, 0.45, vDepth);
  float foam = liqFoam(vW.xz, 0.3, t, shore * shore * (0.62 + 0.1 * sin(uTime * 0.8 + vW.x * 0.4)) + smoothstep(0.85, 1.0, vH) * 0.12);
  col = mix(col, vec3(0.95, 0.98, 0.97), foam * 0.9);
  col += (sky * 0.18 + 0.03) * ripCrest;                                          // (a ring's crest catches a little more of the sky: Sunshine's rings, softly)
  alpha = smoothstep(0.0, 0.3, vDepth) * 0.97 + foam * 0.3;                    // (the water paints its own floor: it fades only at the very edge, onto the real sand)
  }
  if (under) { col *= 0.55; alpha = 0.55; }
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export function makeWaterMaterial(sky, kind = 'water') {
  const lach = kind === 'lachryma';
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uSky: { value: sky?.texture ?? null }, uSun: { value: new THREE.Vector3(0.35, 0.9, -0.25) },
    ...liquidUniforms(), uLachryma: { value: lach ? 1 : 0 }, uAmp: { value: lach ? 0.05 : 0.035 }, uFreq: { value: lach ? 0.55 : 1.0 }, uSpeed: { value: lach ? 0.32 : 1.0 }, uMaxDepth: { value: 6 },
  }]);
  Object.assign(uniforms, RIPPLE_U); // (the ripple tank's, shared as they are: merge would have copied them)
  return new THREE.ShaderMaterial({ name: lach ? 'liquid-lachryma' : 'liquid-water',
    uniforms, vertexShader: VERT, fragmentShader: FRAG.replace('//SKYGLSL', sky?.GLSL ?? '').replace('//LIQUIDGLSL', LIQUID_GLSL).replace('//RIPPLEGLSL', RIPPLE_GLSL),
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
  });
}

/** A plane over the volume, four vertices to the metre, each with the depth of the floor under it (0 at the edge, so the shore reads). */
export function waterGeometry(v) {
  const w = v.x1 - v.x0, d = v.z1 - v.z0, nx = Math.ceil(w * 4), nz = Math.ceil(d * 4);
  const g = new THREE.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, depth = new Float32Array(pos.count), full = Math.max(0.2, v.surface - v.bottom);
  const cx = (v.x0 + v.x1) / 2, cz = (v.z0 + v.z1) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
    const edge = Math.min(x - v.x0, v.x1 - x, z - v.z0, v.z1 - z);      // (how far from the rim)
    const floor = v.depthAt ? v.depthAt(x, z) : full;
    depth[i] = Math.max(0, Math.min(floor, edge * 0.9));
  }
  g.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  return g;
}
