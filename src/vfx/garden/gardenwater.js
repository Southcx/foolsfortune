// ---------------------------------------------------------------------------------------
// THE GARDEN'S WATER, DRAWN (the glossary: the garden's water; docs/plans/SPIRIT-GARDEN.md section 7, item 29; the owner: "the water and
// Lachryma are going to be one of the most important visual elements in the game", R58). Petra's simulation keeps a depth, a speed and
// a mix of the five feelings a cell of each planetoid's clay grid (world/garden/water.js); this draws it as Lachryma, luminous in its
// feeling's colour:
//
//   THE SURFACE  on the planetoid's own vertices (vfx/garden/planetoidmesh.js: the shared icosphere the ground is drawn on, so there
//                are no slivers at the crown and no hole at the pole), each at the drawn ground plus the water's depth there plus
//                LOOK.lift; a lake is level (its level is the wet cells' level, read at each vertex), a film on a slope follows it.
//                A vertex with no water near is tucked under the ground, and only the triangles with a wet corner are drawn
//   THE SHORE    by the depth interpolated across each triangle: under LOOK.draw (5 mm) the water is not drawn, and it fades in to
//                6 cm, so the shore runs smooth through a triangle and the water always stands 1.5 cm or more over the ground where it
//                is seen (CASEBOOK rule 1: no two faces in one plane), a film on a wall stood off along the wall's own normal
//   THE BODY     the feeling's canon colour (progress/weather.js COLOR), dark where the light goes in and glowing from inside as it
//                deepens (the liquid pack's glowing cells), more by night (at night Lachryma glows); two feelings in one water are an
//                AGATE, wedged by the marbling and never blended (the glossary); opposites that meet (wonder and grief, mirth and dread)
//                cancel to FAIR WATER (the code's word: world/garden/waterworks.js), drawn milky as nacre
//   THE SKIN     the marbling's two crossing layers as its normal, laid triplanar in the planetoid's space and calmed with distance
//                (18 to 70 m, as vfx/water.js calms); the film's colours in its veins and at its meniscus; the garden's sky in it by
//                Fresnel (the haze to the zenith: vfx/garden/gardensky.js); the sun's tight highlight and glints where the fine
//                bubbles cross it (the water's sparkle, welcome: R58), fading out past 18 m; calmed and its gloss varied (the owner,
//                2026-10-08: "a little too plastic-y"), clearer in the shallows, with a faint web of the caustics (vfx/liquid.js
//                liqCaustics) on the surface over them
//   THE FOAM     made of bubbles (liqFoam) where it runs fast and shallow (over 1.5 m/s, under 0.3 m)
//   THE GROUND   under and after it: the planetoid's aWet (how wet, drying over 20 real seconds; the depth over it), which the grounds
//                darken, gloss and lay caustics on (vfx/garden/gardengrounds.js)
// One material for every planetoid's water (one program, drawn in one pass: a double-sided transparent material is drawn back faces then front
// faces by default, a program each, and a sheet of water has no second layer to order; parked in the warm-up: waterParked, CASEBOOK rules 17 and 18).
//
// Prior art: the heightfield water of every terrain engine and From Dust's coloured water (a grid of depths over the ground), Valve's
// crossing normal layers (Vlachos, SIGGRAPH 2010), Roystan's toon water (a shore drawn by depth, foam by threshold), Super Mario
// Sunshine's water that changes with distance, triplanar mapping (GPU Gems 3 ch. 1; Ben Golus 2017, the UDN blend), and agateware's
// wedged clays (the glossary's agate).
//
//   const L = new WaterLook(planetWater, planet, { sky })   L.mesh   L.update(dt)   L.stats (the last update: { ms, wet, faces })
//   waterMaterial() (the one material)   waterParked() -> a mesh for the warm-up   WATER_LOOK (data: tune live)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FEELINGS } from '../../world/garden/water.js';
import { COLOR } from '../../progress/weather.js';
import { sphereMaps, tracked, sendRuns } from './planetoidmesh.js';
import { GROUND_UNIFORMS } from './gardengrounds.js';
import { liquidUniforms, LIQUID_GLSL } from '../liquid.js';

/** The look's numbers: metres (`lift` over the ground, `draw` the least depth drawn, `cell` the least a cell holds to count wet,
 *  `tuck` under the ground where dry), real seconds (`dry`: wet ground drying; `wetEvery`: how often the ground's wetness is written),
 *  `flowMax` m/s (the simulation's speed spikes at thin depth: clamped, and weighted by depth) and `ease` real seconds (the flow eased
 *  over it, so foam grows and fades), `settle` real seconds (a vertex's depth eased over it, so the shore moves and never pops), `scale`
 *  (the marbling's, a metre: every 6 m), `nacre` (fair water's colour, sRGB). */
export const WATER_LOOK = { lift: 0.01, draw: 0.005, cell: 0.003, tuck: -0.06, dry: 20, wetEvery: 0.1, flowMax: 4, ease: 0.35, settle: 0.12, scale: 0.16, nacre: 0xf1ecf4 };

let MAT = null;
const U = {
  uWFeel: { value: FEELINGS.map((f) => new THREE.Color(COLOR[f])) }, uWNacre: { value: new THREE.Color(WATER_LOOK.nacre) },
  uWHaze: { value: new THREE.Color(0.86, 0.46, 0.56) }, uWZenith: { value: new THREE.Color(0.16, 0.2, 0.58) }, uWScale: { value: WATER_LOOK.scale },
};

const VERT_DECL = /* glsl */`
attribute vec4 aWater;
attribute vec4 aMixA;
attribute float aMixB;
varying vec4 vWater;
varying vec4 vMixA;
varying float vMixB;
varying vec3 vWp;
varying vec3 vWn;
varying vec3 vWFlow;
`;
const VERT_BODY = /* glsl */`
  vWater = aWater; vMixA = aMixA; vMixB = aMixB; vWp = transformed; vWn = objectNormal;
  { vec3 d = normalize(position), e = vec3(d.z, 0.0, -d.x); float l = length(e); e = l > 1e-4 ? e / l : vec3(1.0, 0.0, 0.0); vWFlow = e * aWater.z + cross(d, e) * aWater.w; } // (the flow along the clay's east and north)
`;
const FRAG_DECL = /* glsl */`
varying vec4 vWater;
varying vec4 vMixA;
varying float vMixB;
varying vec3 vWp;
varying vec3 vWn;
varying vec3 vWFlow;
uniform vec3 uWFeel[5];
uniform vec3 uWNacre, uWHaze, uWZenith;
uniform float uWScale, uGTime, uGNight;
`;
// (the shore first: a fragment shallower than LOOK.draw is not water)
const FRAG_SHORE = /* glsl */`
  if (vWater.x < ${WATER_LOOK.draw.toFixed(4)}) discard;
`;
// (before the alpha map: every sample the later stages read, the body's colour and its opacity)
const FRAG_BODY = /* glsl */`
  float wD = vWater.x, wDeep = smoothstep(0.05, 1.2, wD), wFar = smoothstep(18.0, 70.0, length(vViewPosition)), wT = uGTime * 0.35;
  vec3 wFw = fwidth(vWp); float wPx = max(wFw.x, max(wFw.y, wFw.z)); // (the pixel's footprint, for the caustics' lines: taken where every fragment runs)
  vec3 wNb = normalize(mix(normalize(vWn), normalize(vWp), 0.92 * smoothstep(0.006, 0.04, wD) * (1.0 - smoothstep(0.4, 1.5, vWater.y)))), wPert = vec3(0.0); float wH = 0.0, wGlow = 0.0, wVein = 0.0, wBub = 0.0, wFoam = 0.0; // (still water's level is a sphere about the heart: its normal is the heart's up, not its triangles' (the shore's triangles lean), so no facet catches the sky; running water keeps its slope's)
  {
    vec3 w3 = pow(abs(wNb), vec3(4.0)); w3 /= w3.x + w3.y + w3.z + 1e-5;
    float S = uWScale, speed = vWater.y, st = mix(0.95, 0.6, wDeep * (1.0 - smoothstep(0.4, 1.5, speed))) * (1.0 - 0.7 * wFar); // (calmed, 2026-10-08: the owner found the water "a little too plastic-y"; a still deep pool calmest)
    float foamAmt = smoothstep(1.5, 3.0, speed) * smoothstep(0.02, 0.06, wD) * (1.0 - smoothstep(0.12, 0.3, wD)) * 0.55; // (fast and shallow, but never on a film)
    vec2 fl = vec2(0.0);
    #define W_PLANE(Q, PERT, W) { vec2 q = Q; vec3 n = liqNormal(q, S, wT, st); wPert += PERT * W; wH += liqHeight(q, S, wT) * W; wGlow += liqGlow(q, S * 0.6, wT) * W; wVein += liqTap(q * S + vec2(wT * 0.021, wT * 0.013)).a * W; wBub += liqTap(q * 0.9 + vec2(wT * 0.05, -wT * 0.03)).g * W; if (foamAmt > 0.01) wFoam += liqFoam(q, 0.7, uGTime, foamAmt) * W; }
    if (w3.x > 0.05) W_PLANE(vWp.zy, vec3(0.0, n.z, n.x), w3.x)
    if (w3.y > 0.05) W_PLANE(vWp.xz, vec3(n.x, 0.0, n.z), w3.y)
    if (w3.z > 0.05) W_PLANE(vWp.xy, vec3(n.x, n.z, 0.0), w3.z)
    #undef W_PLANE
  }
  vec3 wCol;
  {
    // the leading feeling and the next (the shares interpolated: a dry corner brings none, so the wet corners' mix holds to the shore)
    float s[5]; s[0] = vMixA.x; s[1] = vMixA.y; s[2] = vMixA.z; s[3] = vMixA.w; s[4] = vMixB;
    float sum = s[0] + s[1] + s[2] + s[3] + s[4] + 1e-4;
    int a = 0; for (int k = 1; k < 5; k++) if (s[k] > s[a]) a = k;
    int b = a == 0 ? 1 : 0; for (int k = 0; k < 5; k++) if (k != a && s[k] > s[b]) b = k;
    float sa = s[a] / sum, sb = s[b] / sum;
    float cancel = clamp(2.0 * min(s[0], s[3]) / sum + 2.0 * min(s[1], s[4]) / sum, 0.0, 1.0); // (wonder against grief, mirth against dread)
    bool opposed = (a == 0 && b == 3) || (a == 3 && b == 0) || (a == 1 && b == 4) || (a == 4 && b == 1);
    // the agate: the second feeling wedged into the first along the marbling, its share of the water, never blended
    float r = opposed ? 0.0 : smoothstep(0.08, 0.5, sb / max(sa + sb, 1e-4)), th = mix(1.0, 0.44, r), aa = fwidth(wH) * 1.5 + 0.004;
    float m = smoothstep(th - aa, th + aa, wH);
    wCol = mix(uWFeel[a], uWFeel[b], m);
    // fair water: opposites cancelled, milky, the film's colours in it as in nacre
    vec3 nacre = uWNacre * (0.85 + 0.15 * liqFilm(wH * 1.3 + 0.2));
    wCol = mix(wCol, nacre, smoothstep(0.25, 0.85, cancel));
  }
  diffuseColor.rgb = pow(wCol, vec3(1.6)) * mix(0.5, 0.2, wDeep); // (lit at the top, darker and deeper in colour as it deepens: the light goes in)
  diffuseColor.a = smoothstep(${WATER_LOOK.draw.toFixed(4)}, 0.06, wD) * mix(0.55, 0.95, wDeep); // (clearer in the shallows: the ground and its caustics show through)
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.9, 0.94, 0.95), wCol, 0.25), wFoam * 0.8); // (foam keeps a breath of its feeling)
  diffuseColor.a = max(diffuseColor.a, wFoam * 0.8 * smoothstep(${WATER_LOOK.draw.toFixed(4)}, 0.03, wD));
`;
const FRAG_SURFACE = /* glsl */`
  roughnessFactor = mix(mix(0.12, 0.26, smoothstep(0.3, 0.7, wH)), 0.6, wFoam); metalnessFactor = 0.0; // (the gloss varied with the marbling: never one even coat)
`;
const FRAG_NORMAL = /* glsl */`
  normal = normalize((viewMatrix * vec4(normalize(wNb + wPert), 0.0)).xyz);
  #ifdef DOUBLE_SIDED
    normal *= faceDirection;
  #endif
`;
const FRAG_GLOW = /* glsl */`
  {
    vec3 V = normalize(vViewPosition), Rv = reflect(-V, normal), Rw = (vec4(Rv, 0.0) * viewMatrix).xyz;
    float ndv = clamp(dot(normal, V), 0.0, 1.0), fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
    vec3 sky = mix(uWHaze, uWZenith, smoothstep(0.0, 0.7, dot(normalize(Rw), normalize(vWp))));
    vec3 core = pow(wCol, vec3(1.3));
    vec3 e = core * (0.12 + 0.6 * wDeep) * (0.6 + (0.8 + 0.8 * uGNight) * wGlow * wGlow) * (0.8 + 1.1 * uGNight); // (light pooled inside it, deeper and by night brighter; by day softer and more even: broad bright pools read as a gel's sheen)
    float film = wH * 0.9 + fres * 0.7 + wT * 0.01;
    e += liqFilm(film) * pow(wVein, 2.0) * 0.12 * (1.0 - wFoam);                                       // (the film in its veins)
    e += liqFilm(film + 0.3) * (1.0 - smoothstep(${WATER_LOOK.draw.toFixed(4)}, 0.08, wD)) * 0.18;   // (the meniscus at the shore)
    e += sky * fres * 0.32 * (1.0 - wFoam);                                                           // (the garden's sky in it, short of a mirror)
    {                                                                                                  // (a faint web of the caustics on the surface over the shallows, the floor's light: vfx/liquid.js)
      vec3 n3 = pow(abs(wNb), vec3(4.0)); n3 /= n3.x + n3.y + n3.z + 1e-5;
      vec3 c = vec3(0.0), wq = vWp; float t = uGTime * 0.8;
      if (n3.x > 0.05) c += liqCaustics(wq.zy, 1.0, t, wPx) * n3.x;
      if (n3.y > 0.05) c += liqCaustics(wq.xz, 1.0, t, wPx) * n3.y;
      if (n3.z > 0.05) c += liqCaustics(wq.xy, 1.0, t, wPx) * n3.z;
      e += c * mix(vec3(1.0), core, 0.35) * 0.09 * (1.0 - wDeep) * (1.0 - wFoam) * (1.0 - wFar);
    }
    #if NUM_DIR_LIGHTS > 0
      vec3 H = normalize(directionalLights[0].direction + V);
      float glint = smoothstep(0.86, 0.93, wBub) * pow(max(dot(normal, H), 0.0), 40.0) * (1.0 - smoothstep(10.0, 18.0, length(vViewPosition)));
      e += directionalLights[0].color * glint * 0.9;                                                  // (its sparkle: near only, never noise far off)
    #endif
    totalEmissiveRadiance += e;
  }
`;
const KEY = 'garden-water-1';

/** The one material every planetoid's water is drawn with (made on first need; shared, never disposed: CASEBOOK rules 17 and 24). */
export function waterMaterial() {
  if (MAT) return MAT;
  const LIQ = liquidUniforms();
  MAT = new THREE.MeshStandardMaterial({ name: 'garden-water', transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, roughness: 0.07, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  MAT.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, LIQ, { uGTime: GROUND_UNIFORMS.uGTime, uGNight: GROUND_UNIFORMS.uGNight }); // (the grounds' clock and night: one clock for the garden's looks)
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
    sh.fragmentShader = FRAG_DECL + LIQUID_GLSL + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${FRAG_SHORE}`)
      .replace('#include <alphamap_fragment>', `${FRAG_BODY}\n#include <alphamap_fragment>`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${FRAG_SURFACE}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${FRAG_NORMAL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${FRAG_GLOW}`);
  };
  MAT.customProgramCacheKey = () => KEY;
  MAT.userData.shared = true; MAT.userData.noMerge = true;
  return MAT;
}

/** The attributes a water geometry carries (positions, normals, the water a vertex, its mix in bytes). */
function waterGeometry(n, index) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', tracked(new THREE.BufferAttribute(new Float32Array(n * 3), 3)));
  g.setAttribute('normal', tracked(new THREE.BufferAttribute(new Float32Array(n * 3), 3)));
  g.setAttribute('aWater', tracked(new THREE.BufferAttribute(new Float32Array(n * 4), 4))); // (depth, speed, flow east, flow north)
  g.setAttribute('aMixA', tracked(new THREE.BufferAttribute(new Uint8Array(n * 4), 4, true))); // (wonder, mirth, desire, grief)
  g.setAttribute('aMixB', tracked(new THREE.BufferAttribute(new Uint8Array(n), 1, true))); // (dread)
  if (index) { const I = new THREE.BufferAttribute(index, 1); I.setUsage(THREE.DynamicDrawUsage); g.setIndex(I); }
  return g;
}

/** A small mesh of the water's material for the warm-up (parked hidden; never disposed). */
export function waterParked() {
  const g = waterGeometry(3, null), P = g.attributes.position.array, W = g.attributes.aWater.array, A = g.attributes.aMixA.array;
  P.set([0, 0, 0, 1, 0, 0, 0, 0, 1]); g.attributes.normal.array.set([0, 1, 0, 0, 1, 0, 0, 1, 0]);
  for (let i = 0; i < 3; i++) { W[i * 4] = 0.5; A[i * 4] = 255; }
  const m = new THREE.Mesh(g, waterMaterial()); m.name = 'garden-water-parked'; m.frustumCulled = false;
  return m;
}

export class WaterLook {
  constructor(water, planet, { sky = null } = {}) {
    this.W = water; this.P = planet; this.L = planet.look; this.sky = sky; this.seen = -1; this.clayV = -1; this.wetT = 0; this.dryOwed = 0;
    const S = this.S = this.L.sphere, n = S.n, M = this.M = sphereMaps(S), C = water.clay;
    // each vertex's bilinear weights on its four cells, and the clay's unsculpted ground under that sum (fixed for the planetoid)
    this.wt = new Float32Array(n * 4); this.baseBil = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = M.fu[i], v = M.fv[i], w = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
      let b = 0; for (let q = 0; q < 4; q++) { this.wt[i * 4 + q] = w[q]; b += w[q] * C.base[M.cells[i * 4 + q]]; }
      this.baseBil[i] = b;
    }
    this.depth = new Float32Array(n).fill(WATER_LOOK.tuck); this.wet = new Float32Array(n); this.vlev = new Float32Array(n); this.vgen = new Float64Array(n);
    this.touch = new Int32Array(n); this.last = new Int32Array(n); this.lastN = 0; this.wetList = new Int32Array(n); this.fseen = new Int32Array(S.faces); this.gen = 0;
    this.acc = new Float32Array(n * 3); this.wetBytes = new Int32Array(n); this.list = new Int32Array(n); this.fx = new Float32Array(n); this.fy = new Float32Array(n); this.fgen = new Int32Array(n).fill(-9); this.sgen = new Int32Array(n).fill(-9); this.easeD = 1; this.drawT = 0;
    this.geo = waterGeometry(n, new (S.index.constructor)(S.faces * 3));
    this.geo.setDrawRange(0, 0); this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
    this.mesh = new THREE.Mesh(this.geo, waterMaterial());
    this.mesh.name = `garden-water-${planet.id}`; this.mesh.position.copy(planet.c); this.mesh.renderOrder = 2; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.stats = { ms: 0, wet: 0, faces: 0 };
  }

  update(dt) {
    const W = this.W, C = W.clay; this.drawT += dt;
    this.mesh.visible = W.total > 0.01 && this.L.group.visible !== false;
    if (this.sky?.u) { U.uWHaze.value.copy(this.sky.u.uHaze.value); U.uWZenith.value.copy(this.sky.u.uZenith.value); }
    if ((W.version !== this.seen || C.version !== this.clayV) && W.total > 0.01) { this.seen = W.version; this.clayV = C.version; this.draw(this.drawT); this.drawT = 0; }
    else if (W.total <= 0.01 && this.stats.wet) { this.seen = W.version; this.draw(this.drawT); this.drawT = 0; } // (the last of it gone: every vertex tucked away again)
    this.dryOwed += dt;
    if ((this.wetT -= dt) <= 0) { this.wetT = WATER_LOOK.wetEvery; this.ground(this.dryOwed); this.dryOwed = 0; }
  }

  /** The surface brought up to the water: levels, depths, mixes, flow, normals and the triangles drawn. */
  draw(secs = 1 / 60) {
    const t0 = performance.now(), W = this.W, C = W.clay, S = this.S, M = this.M, n = S.n, LK = WATER_LOOK, empty = W.total <= 0.01;
    const g = this.geo, Pa = g.attributes.position.array;
    const Wt = W.w, cells = M.cells, wt = this.wt, Hc = C.h, mix = W.mixes, touch = this.touch, depth = this.depth, vlev = this.vlev, vgen = this.vgen, gen = ++this.gen;
    const dt = Math.max(1 / 240, Math.min(0.25, secs)), ease = 1 - Math.exp(-dt / LK.ease); this.easeD = 1 - Math.exp(-dt / LK.settle);
    let nt2 = 0, nw = 0;
    // 1. every vertex with water in a cell round it: the water's level there (the wet cells' level, so a lake is level to its bank),
    //    its depth (that level over its ground, held to the deepest wet cell round it: up a bank it goes below nothing), mix and flow
    if (!empty) for (let i = 0; i < n; i++) {
      let sw = 0, sl = 0, mx = 0, vx = 0, vy = 0, m0 = 0, m1 = 0, m2 = 0, m3 = 0, m4 = 0;
      for (let q = 0; q < 4; q++) {
        const c = cells[i * 4 + q], w = Wt[c]; if (!(w > LK.cell)) continue;
        const f = wt[i * 4 + q]; if (w > mx) mx = w; sw += f; sl += f * (C.base[c] + Hc[c] + w); vx += f * W.vx[c]; vy += f * W.vy[c];
        const o = c * 5; m0 += f * mix[o]; m1 += f * mix[o + 1]; m2 += f * mix[o + 2]; m3 += f * mix[o + 3]; m4 += f * mix[o + 4];
      }
      if (sw < 1e-6) { // (no water round it now, but drawn wet a frame ago: it recedes from where it was, never vanishes with its faces)
        if (this.sgen[i] !== gen - 1 || !(depth[i] > LK.draw) || !Number.isFinite(vlev[i])) continue;
        vgen[i] = gen; touch[nt2++] = i;
        if (this.put(i, Math.max(-1, Math.min(vlev[i] - this.groundOf(i), 0)), 0, 0, -1) > LK.draw) this.wetList[nw++] = i;
        continue;
      }
      const lv = sl / sw, d = Math.max(-1, Math.min(lv - this.groundOf(i), mx));
      vlev[i] = lv; vgen[i] = gen; touch[nt2++] = i;
      vx /= sw; vy /= sw; const sp = Math.hypot(vx, vy), k = (sp > LK.flowMax ? LK.flowMax / sp : 1) * THREE.MathUtils.smoothstep(mx, 0.02, 0.08); // (the simulation's speed spikes where the water is a film)
      // the flow eased over LOOK.ease real seconds: the simulation's speed is noisy step to step, and foam keyed on it must grow and fade, never pop
      if (this.fgen[i] !== gen - 1) { this.fx[i] = vx * k; this.fy[i] = vy * k; } else { this.fx[i] += (vx * k - this.fx[i]) * ease; this.fy[i] += (vy * k - this.fy[i]) * ease; }
      this.fgen[i] = gen;
      const s = 255 / sw;
      if (this.put(i, d, this.fx[i], this.fy[i], Math.round(m0 * s), Math.round(m1 * s), Math.round(m2 * s), Math.round(m3 * s), Math.round(m4 * s)) > LK.draw) this.wetList[nw++] = i;
    }
    // 2. the triangles with a wet corner; a corner with no water round it takes the level of the face's wet corners (a bank, or the edge
    //    of a lake where the clay's cells are narrow near a pole): never deeper than nothing, so the shore falls inside the triangle
    const idx = S.index, X = g.index.array, fseen = this.fseen; let nf = 0;
    for (let a = 0; a < nw; a++) {
      const i = this.wetList[a];
      for (let q = M.vOff[i]; q < M.vOff[i + 1]; q++) {
        const f = M.v2f[q]; if (fseen[f] === gen) continue; fseen[f] = gen;
        const v0 = idx[f * 3], v1 = idx[f * 3 + 1], v2 = idx[f * 3 + 2];
        X[nf * 3] = v0; X[nf * 3 + 1] = v1; X[nf * 3 + 2] = v2; nf++;
        for (const v of [v0, v1, v2]) {
          if (vgen[v] === gen || vgen[v] === gen + 0.5) continue;
          let lv = -Infinity; for (const u of [v0, v1, v2]) if (vgen[u] === gen && depth[u] > LK.draw && vlev[u] > lv) lv = vlev[u];
          const d = Math.max(-1, Math.min(lv - this.groundOf(v), 0));
          vlev[v] = lv; vgen[v] = gen + 0.5; touch[nt2++] = v; this.put(v, d, 0, 0, 0, 0, 0, 0, 0); // (gen + 0.5: written, but with no water of its own: no other corner reads its level)
        }
      }
    }
    // 3. the normals: straight up, or area-weighted over the faces wet at every corner
    const Na = g.attributes.normal.array, D = S.dir, acc = this.acc;
    for (let a = 0; a < nt2; a++) { const i = touch[a]; acc[i * 3] = acc[i * 3 + 1] = acc[i * 3 + 2] = 0; }
    for (let f0 = 0; f0 < nf; f0++) {
      const v0 = X[f0 * 3], v1 = X[f0 * 3 + 1], v2 = X[f0 * 3 + 2];
      if (!(depth[v0] > LK.draw && depth[v1] > LK.draw && depth[v2] > LK.draw)) continue;
      const ax = Pa[v1 * 3] - Pa[v0 * 3], ay = Pa[v1 * 3 + 1] - Pa[v0 * 3 + 1], az = Pa[v1 * 3 + 2] - Pa[v0 * 3 + 2], bx = Pa[v2 * 3] - Pa[v0 * 3], by = Pa[v2 * 3 + 1] - Pa[v0 * 3 + 1], bz = Pa[v2 * 3 + 2] - Pa[v0 * 3 + 2];
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
      acc[v0 * 3] += cx; acc[v0 * 3 + 1] += cy; acc[v0 * 3 + 2] += cz; acc[v1 * 3] += cx; acc[v1 * 3 + 1] += cy; acc[v1 * 3 + 2] += cz; acc[v2 * 3] += cx; acc[v2 * 3 + 1] += cy; acc[v2 * 3 + 2] += cz;
    }
    for (let a = 0; a < nt2; a++) {
      const i = touch[a], x = acc[i * 3], y = acc[i * 3 + 1], z = acc[i * 3 + 2], l = Math.hypot(x, y, z);
      if (l > 1e-9) { Na[i * 3] = x / l; Na[i * 3 + 1] = y / l; Na[i * 3 + 2] = z / l; } else { Na[i * 3] = D[i * 3]; Na[i * 3 + 1] = D[i * 3 + 1]; Na[i * 3 + 2] = D[i * 3 + 2]; }
    }
    // 4. what was water before and is not now reads as dry to the ground (nothing to send: it is not drawn)
    for (let a = 0; a < this.lastN; a++) { const i = this.last[a]; if (vgen[i] !== gen && vgen[i] !== gen + 0.5) depth[i] = LK.tuck; }
    this.last.set(touch.subarray(0, nt2)); this.lastN = nt2;
    g.index.clearUpdateRanges(); if (nf) g.index.addUpdateRange(0, nf * 3); g.index.needsUpdate = true; g.setDrawRange(0, nf * 3);
    for (const k of ['position', 'normal', 'aWater', 'aMixA', 'aMixB']) sendRuns(g.attributes[k], touch, nt2, n); // (touch is sorted in place by the first: the rest send the same runs)
    g.boundingSphere.radius = this.L.reach + 1;
    this.stats = { ms: +(performance.now() - t0).toFixed(3), wet: nw, faces: nf };
  }
  /** The clay's own ground under a vertex (the bilinear sum the simulation stands its water on). */
  groundOf(i) { const c = this.M.cells, w = this.wt, H = this.W.clay.h; let g = this.baseBil[i]; for (let q = 0; q < 4; q++) g += w[i * 4 + q] * H[c[i * 4 + q]]; return g; }
  /** A vertex written: where it stands (on the drawn ground, lifted along the ground's own normal for a film, so a wall's water stands
   *  off the wall, and straight up for a lake, whose level is level), its water and its mix. Its depth eases toward what the water says
   *  over LOOK.settle real seconds when it was drawn the last time too (a film reaching a corner moves the shore across the triangle,
   *  never flips the triangle in one frame). The depth drawn, returned. */
  put(i, d, vx, vy, m0, m1, m2, m3, m4) {
    const L = this.L, D = this.S.dir, GN = L.geo.attributes.normal.array, g = this.geo, Pa = g.attributes.position.array, Wa = g.attributes.aWater.array, A = g.attributes.aMixA.array;
    if (this.sgen[i] === this.gen - 1) d = this.depth[i] + (d - this.depth[i]) * this.easeD;
    this.sgen[i] = this.gen; this.depth[i] = d;
    const rg = L.R * (L.base[i] + L.h[i]), a = d + WATER_LOOK.lift, k = THREE.MathUtils.smoothstep(d, 0.08, 0.5);
    let ox = GN[i * 3] + (D[i * 3] - GN[i * 3]) * k, oy = GN[i * 3 + 1] + (D[i * 3 + 1] - GN[i * 3 + 1]) * k, oz = GN[i * 3 + 2] + (D[i * 3 + 2] - GN[i * 3 + 2]) * k;
    const ol = Math.hypot(ox, oy, oz) || 1;
    Pa[i * 3] = D[i * 3] * rg + (ox / ol) * a; Pa[i * 3 + 1] = D[i * 3 + 1] * rg + (oy / ol) * a; Pa[i * 3 + 2] = D[i * 3 + 2] * rg + (oz / ol) * a;
    Wa[i * 4] = d; Wa[i * 4 + 1] = Math.hypot(vx, vy); Wa[i * 4 + 2] = vx; Wa[i * 4 + 3] = vy;
    if (m0 >= 0) { A[i * 4] = m0; A[i * 4 + 1] = m1; A[i * 4 + 2] = m2; A[i * 4 + 3] = m3; g.attributes.aMixB.array[i] = m4; } // (m0 < 0: the mix it had)
    return d;
  }

  /** The ground's wetness: 1 under water, drying to nothing over WATER_LOOK.dry real seconds, and the depth over it (the grounds read
   *  both: vfx/garden/gardengrounds.js). Written into the planetoid's aWet where a byte changed. */
  ground(secs) {
    const n = this.S.n, depth = this.depth, wet = this.wet, Wb = this.wetBytes, attr = this.L.geo.attributes.aWet; if (!attr) return;
    const Aw = attr.array, fall = secs / WATER_LOOK.dry, list = this.list; let c = 0;
    for (let i = 0; i < n; i++) {
      const d = depth[i];
      if (d > WATER_LOOK.draw) wet[i] = 1; else if (wet[i] > 0) wet[i] = Math.max(0, wet[i] - fall); else if (!Wb[i]) continue;
      const a = Math.round(wet[i] * 255), b = d > WATER_LOOK.draw ? Math.round(Math.min(1, d / 1.5) * 255) : 0, key = a | (b << 8);
      if (key === Wb[i]) continue;
      Wb[i] = key; Aw[i * 2] = a; Aw[i * 2 + 1] = b; list[c++] = i;
    }
    sendRuns(attr, list, c, n);
  }
}
