// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S GRID LOOK: the Flood stage's falling-sand grid (Dovina's simulation, world/strawmanwell/grid.js; GRID and CELL in
// progress/strawmanwell.js) drawn as a cut-out in Pip's toy theatre (vfx/strawmanwell/look.js): one plane the grid's size standing in the
// stage's plane, each cell drawn by its kind in one small shader, every edge where matter meets the air a thin dark keyline (a paper
// theatre's cut-out, its card's edge), so the grid reads as a flat cut and stood among the others:
//   stone     the stage's own ground, a painted flat: flat warm grey card (Dovina flattened it: nothing in it may crawl at 480 lines), the
//             faint courses of painted masonry, darker as it goes down, a tailor's-chalk line along its top
//   sand      warm sand, each cell a grain (a soft dome, a shade of its own), so a falling heap is seen to fall; a lit crust on top
//   clay      terracotta in the Clay dress (the kiln's own clay, the chips' colours), mottled, faint wedging lines, a wet slip's sheen on top
//   Lachryma  the house's liquid (vfx/water.js, vfx/liquid.js): a translucent violet-blue body deepening with the depth under its
//             surface, the film's colours living in the owner's marbling's cells and veins, the labradorite's flash coming up through
//             it in broad drifting bands (vfx/labradorite.js), a bright line where it meets the air above (the body reads as a body)
//   crude     crude's oil film (vfx/oxidation.js `slickColour`, thinned: its interference lines up through the ink), its rim brightest
//   ice       glassy pale cyan, a cold glint across it, the faintest schiller (it was Lachryma), a bright bevel inside its keyline
//   burning   an ember flickering at a steady rate, hotter while it has visits left (grid.fire)
//   empty     clear, but for the keyline's outer half
// The cells' kinds are uploaded as a DataTexture (one texel a cell: its kind, its fire, how many cells of its own sort stand over it in
// its column), written only in the columns the grid changed and uploaded at most UPLOAD times a real second (Dovina's ceiling); the
// edges are found in the shader from the neighbours (nine fetches), so a column's change redraws its neighbours' edges for free. The
// liquid's taps are given their gradients from where every fragment runs (a tap inside a branch has no derivatives of its own).
//
// Prior art: Noita's and the Powder Toy's one-texel-a-cell grid; Pollock's toy-theatre cut-outs (the keyline, the painted flats); the
// house's liquid, Lachryma's film and crude's slick (vfx/water.js, vfx/liquid.js, vfx/labradorite.js, vfx/oxidation.js); Where's My
// Water? for a liquid's lit surface line on a cross-section.
//
//   const look = new GridLook(grid, origin)   scene.add(look.mesh)   look.update()   (each frame)   look.dispose()   GRID_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRID, CELL } from '../../progress/strawmanwell.js';
import { liquidUniforms, LIQUID_GLSL } from '../liquid.js';
import { LAB_GLSL, mindTime, mindTick } from '../labradorite.js';
import { OXIDATION_GLSL } from '../oxidation.js';
import { WELL_LOOK } from './look.js';

/** At most this many texture uploads a real second (Dovina's ceiling: a 160 x 90 RGBA texture is 58 KB an upload; the grid steps 30 a
 *  real second, a quarter of its rows a step, so 15 shows every other step's news); the shader's clock wraps at WRAP real s, where every
 *  scroll and flicker it reads has come round whole (the liquid's taps at 0.35 of it: 1000, an integer for every rate in liquid.js). */
export const GRID_LOOK = { upload: 15, wrap: 20000 / 7 };
const hz = (f) => (Math.round(f * GRID_LOOK.wrap) / GRID_LOOK.wrap).toFixed(6); // (a flicker's rate, come round whole at the wrap)
/** A kind's sort for the depth under its surface: the air, matter, a liquid. */
const SORT = { [CELL.empty]: 0, [CELL.stone]: 1, [CELL.sand]: 1, [CELL.clay]: 1, [CELL.ice]: 1, [CELL.lachryma]: 2, [CELL.crude]: 2 };
const lin = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; }; // (three's Color takes a hex as sRGB: its r, g, b are linear)

const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW;
void main() {
  vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */`
uniform sampler2D uCells; uniform vec2 uSize; uniform float uTime; uniform float uCell;
varying vec2 vUv; varying vec3 vW;
${LIQUID_GLSL}
${LAB_GLSL}
${OXIDATION_GLSL}
const float TAU = 6.2831853;
const vec3 INK = ${lin(WELL_LOOK.palette.ink)}, CHALK = ${lin(WELL_LOOK.palette.chalk)};
vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }
float hash(vec2 c) { return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }
// a cell's texel (outside the grid: the edge cell itself, so the grid's border draws no edge)
vec4 cellAt(ivec2 c) { return texelFetch(uCells, clamp(c, ivec2(0), ivec2(uSize) - 1), 0); }
float kindOf(vec4 t) { float k = floor(t.r * 255.0 + 0.5); return k > 6.5 ? 0.0 : k; }
bool isLiquid(float k) { return k > 3.5 && k < 5.5; }
// what the edge between this cell (k) and a neighbour (n) draws on this cell's side: x the ink keyline, y a liquid's light rim
vec2 edgeOf(float k, float n, float up) {
  if (k == n) return vec2(0.0);
  bool kE = k < 0.5, nE = n < 0.5, kL = isLiquid(k), nL = isLiquid(n);
  if (kE) return nL ? vec2(0.0) : vec2(1.0, 0.0);                    // (the air beside matter: the keyline's outer half; none beside a liquid)
  if (kL) return nE ? vec2(0.0, mix(0.45, 1.0, up)) : (nL ? vec2(0.0, 0.7) : vec2(0.0)); // (a liquid at the air, brightest on top; crude on Lachryma)
  if (nE) return vec2(1.0, 0.0);                                     // (matter at the air: the keyline's inner half)
  return vec2(0.3, 0.0);                                             // (two kinds of matter, or matter under a liquid: a seam)
}
void edge(float k, float n, float d, float up, float pw, inout float ink, inout float rim) {
  vec2 e = edgeOf(k, n, up); if (e.x + e.y <= 0.0) return;
  ink = max(ink, e.x * (1.0 - smoothstep(0.55 * pw, 1.45 * pw, d)));
  rim = max(rim, e.y * (1.0 - smoothstep(1.0 * pw, 2.2 * pw, d)));
}
// the owner's marbling and its veins, tapped with gradients handed down (gx, gy: the world's xy a pixel)
float marble(vec2 xy, float s, float t, vec2 gx, vec2 gy) {
  vec2 a = xy * s + vec2(t * 0.021, t * 0.013), b = LIQ_ROT * (xy * s * 1.73) + vec2(-t * 0.017, t * 0.026);
  return textureGrad(uLiq, a, gx * s, gy * s).r * 0.6 + textureGrad(uLiq, b, LIQ_ROT * gx * s * 1.73, LIQ_ROT * gy * s * 1.73).r * 0.4;
}
float veinsAt(vec2 xy, float s, float t, vec2 gx, vec2 gy) { return textureGrad(uLiq, xy * s + vec2(t * 0.021, t * 0.013), gx * s, gy * s).a; }
float glowAt(vec2 xy, float s, float t, vec2 gx, vec2 gy) { return textureGrad(uLiq2, xy * s + vec2(t * 0.008, -t * 0.006), gx * s, gy * s).a; }
float lineAA(float x, float w, float pw) { return 1.0 - smoothstep(w - pw, w + pw, abs(x)); } // (a line w m wide, its edge a pixel soft: never a crawl)

void main() {
  vec2 p = vUv * uSize, pw2 = fwidth(p);
  float pw = max(max(pw2.x, pw2.y), 1e-4);                           // (cells a pixel)
  vec2 gx = dFdx(vW.xy), gy = dFdy(vW.xy);
  float mpx = uCell * pw;                                             // (metres a pixel)
  ivec2 ci = clamp(ivec2(floor(p)), ivec2(0), ivec2(uSize) - 1);
  vec2 f = p - vec2(ci);
  vec4 c0 = texelFetch(uCells, ci, 0);
  float k = kindOf(c0), fire = floor(c0.g * 255.0 + 0.5), depth = floor(c0.b * 255.0 + 0.5) + (1.0 - f.y);
  float kU = kindOf(cellAt(ci + ivec2(0, 1))), kD = kindOf(cellAt(ci + ivec2(0, -1))), kL = kindOf(cellAt(ci + ivec2(-1, 0))), kR = kindOf(cellAt(ci + ivec2(1, 0)));
  // the edges: the four sides, and a corner only where both sides beside it are this cell's own kind
  float ink = 0.0, rim = 0.0;
  edge(k, kU, 1.0 - f.y, 1.0, pw, ink, rim); edge(k, kD, f.y, 0.0, pw, ink, rim);
  edge(k, kL, f.x, 0.4, pw, ink, rim); edge(k, kR, 1.0 - f.x, 0.4, pw, ink, rim);
  for (int i = 0; i < 4; i++) {
    ivec2 o = ivec2(i == 0 || i == 2 ? -1 : 1, i < 2 ? -1 : 1);
    if (kindOf(cellAt(ci + ivec2(o.x, 0))) != k || kindOf(cellAt(ci + ivec2(0, o.y))) != k) continue;
    edge(k, kindOf(cellAt(ci + o)), length(f - vec2(o.x > 0 ? 1.0 : 0.0, o.y > 0 ? 1.0 : 0.0)), o.y > 0 ? 1.0 : 0.0, pw, ink, rim);
  }
  float top = (k > 0.5 && !isLiquid(k) && kU < 0.5) ? 1.0 - smoothstep(1.2 * pw, 3.4 * pw, 1.0 - f.y) : 0.0; // (a lit band just under a top edge)
  vec2 xy = vW.xy; vec3 V = normalize(cameraPosition - vW);
  vec3 col = vec3(0.0); float alpha = 0.0;
  if (fire > 0.5) {
    // BURNING: a bed of embers, hotter with visits left, its coals the marbling (one glow across the burning cells, never a tile a
    // cell), each cell flickering a little at a steady rate
    float h = hash(vec2(ci)), fl = 0.86 + 0.14 * sin(TAU * ${hz(2.2)} * uTime + h * TAU) * sin(TAU * ${hz(3.4)} * uTime + h * 11.0);
    float coal = marble(xy, 0.9, uTime * 0.35, gx, gy);
    vec3 hot = mix(srgb(vec3(0.62, 0.1, 0.04)), srgb(vec3(1.0, 0.55, 0.14)), clamp(fire / 6.0, 0.0, 1.0));
    col = (hot * (0.75 + 0.7 * coal) + srgb(vec3(1.0, 0.86, 0.5)) * smoothstep(0.55, 0.85, coal) * 0.55) * fl; alpha = 1.0;
  } else if (k < 0.5) {
    col = INK; alpha = 0.0;
  } else if (k < 1.5) {
    // STONE: a painted flat, flat; the faint courses of painted masonry, darker downward, the chalk line on its top
    col = srgb(vec3(0.56, 0.52, 0.47)) * mix(1.0, 0.8, smoothstep(0.0, 10.0, depth));
    float row = floor(xy.y), bond = fract(xy.x / 1.75 + 0.5 * mod(row, 2.0));
    float course = max(lineAA(fract(xy.y + 0.5) - 0.5, 0.012, mpx), lineAA(bond - 0.5, 0.012 / 1.75, mpx / 1.75)) * 0.5;
    col = mix(col, col * 0.78, course);
    col = mix(col, CHALK, top * 0.85); alpha = 1.0;
  } else if (k < 2.5) {
    // SAND: each cell a grain, a shade of its own, a lit crust on top
    float grain = 1.0 + 0.08 * (hash(vec2(ci)) - 0.5) + 0.07 * (0.5 - length(f - vec2(0.42, 0.6)));
    col = srgb(vec3(0.85, 0.71, 0.49)) * grain * mix(1.0, 0.82, smoothstep(0.0, 8.0, depth));
    col = mix(col, srgb(vec3(0.97, 0.88, 0.68)), top * 0.7); alpha = 1.0;
  } else if (k < 3.5) {
    // CLAY: terracotta mottled between the kiln's clays, faint wedging lines, a wet slip's sheen on top
    float m = marble(xy, 0.3, 0.0, gx, gy);
    col = mix(srgb(vec3(0.66, 0.33, 0.21)), srgb(vec3(0.77, 0.42, 0.27)), smoothstep(0.3, 0.7, m));
    float wedge = lineAA(fract(xy.y / 0.6 + 0.08 * sin(xy.x * 1.3)) - 0.5, 0.02, mpx / 0.6) * 0.45;
    col = mix(col, col * 0.82, wedge) * mix(1.0, 0.86, smoothstep(0.0, 10.0, depth));
    col = mix(col, srgb(vec3(0.86, 0.58, 0.44)), top * 0.75); alpha = 1.0;
  } else if (k < 4.5) {
    // LACHRYMA: violet-blue, deepening under its surface, the film in the marbling's cells and veins, the labradorite's flash in bands
    float t = uTime * 0.35, dm = depth * uCell;
    col = mix(srgb(vec3(0.56, 0.5, 0.96)), srgb(vec3(0.14, 0.09, 0.44)), 1.0 - exp(-dm * 1.1));
    float cells = marble(xy, 0.35, t, gx, gy), veins = veinsAt(xy, 0.35, t, gx, gy), film = cells * 0.9 + xy.x * 0.02 + t * 0.01;
    col += liqFilm(film) * pow(veins, 1.5) * 0.24;
    float ph = labPhase(vW, V) + cells * 0.3, band = smoothstep(0.25, 0.85, 0.5 + 0.5 * sin(ph * 12.566));
    col += labradorite(ph) * band * 0.22;
    col += liqFilm(film + 0.6) * pow(glowAt(xy, 0.3, t, gx, gy), 3.0) * 0.14;
    alpha = mix(0.72, 0.94, 1.0 - exp(-dm * 1.5));
    col = mix(col, srgb(vec3(0.9, 0.87, 1.0)) + liqFilm(film + 0.3) * 0.12, rim); alpha = max(alpha, rim * 0.96);
  } else if (k < 5.5) {
    // CRUDE: the oil film, thinned (its interference lines up through the ink), brightest at its rim
    float h = marble(xy, 0.5, uTime * 0.35, gx, gy);
    col = slickColour(0.32, 0.45, h, 0.08, rim) + oxFilm(h + 0.2) * rim * 0.2; alpha = 0.96;
  } else {
    // ICE: glassy pale cyan, bluer deep, a cold glint across it, the faintest schiller, a bright bevel inside its keyline
    col = mix(srgb(vec3(0.8, 0.94, 0.97)), srgb(vec3(0.55, 0.8, 0.9)), smoothstep(0.0, 8.0, depth));
    float glint = lineAA(fract((xy.x + xy.y * 0.7) / 2.6) - 0.5, 0.09, mpx / 2.6);
    float ph = labPhase(vW, V), band = smoothstep(0.3, 0.9, 0.5 + 0.5 * sin(ph * 12.566));
    col += vec3(0.6) * glint * 0.35 + labradorite(ph) * band * 0.06;
    float bevel = max(top, kL != k ? 1.0 - smoothstep(1.4 * pw, 3.0 * pw, f.x) : 0.0);
    col = mix(col, vec3(1.0), bevel * 0.6); alpha = 0.86;
  }
  if (!isLiquid(k) && k > 0.5 && fire < 0.5) col *= vec3(1.0, 0.95, 0.88);  // (the stage's warm light on what stands)
  col = mix(col, INK, ink); alpha = max(alpha, ink);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class GridLook {
  constructor(grid, origin) {
    this.grid = grid; this.origin = origin;
    const w = grid.w, h = grid.h;
    this.data = new Uint8Array(w * h * 4);
    this.texture = new THREE.DataTexture(this.data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.texture.magFilter = this.texture.minFilter = THREE.NearestFilter; this.texture.generateMipmaps = false;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uCells: { value: this.texture }, uSize: { value: new THREE.Vector2(w, h) }, uTime: { value: 0 }, uCell: { value: GRID.size }, uMindT: mindTime, ...liquidUniforms() },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    });
    this.material.name = 'strawmanwell.gridlook';
    this.geometry = new THREE.PlaneGeometry(w * GRID.size, h * GRID.size);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'strawmanwell.grid';
    this.mesh.position.set(origin.x + (w * GRID.size) / 2, origin.y + (h * GRID.size) / 2, origin.z);
    this.seen = new Uint32Array(w); // (this reader's own column counts: grid.takeChanged)
    this.pending = false; this.last = -Infinity;
    for (let x = 0; x < w; x++) this._column(x);
    this.texture.needsUpdate = true; this.seen.set(grid.ver);
  }

  /** A column written: each cell's kind, its fire, and how many cells stand over it unbroken (0 at its surface): of its own kind for
   *  matter (stone under a clay wall is lit from its own top, never darkened through the clay), of either liquid for a liquid (Lachryma
   *  under floating crude is that much deeper). */
  _column(x) {
    const g = this.grid, w = g.w, d = this.data;
    let run = 0, above = -1, sortAbove = -1;
    for (let y = g.h - 1; y >= 0; y--) {
      const i = y * w + x, k = g.cells[i], sort = SORT[k] ?? 0, o = i * 4;
      run = sort && (k === above || (sort === 2 && sortAbove === 2)) ? run + 1 : 0; above = k; sortAbove = sort;
      d[o] = k; d[o + 1] = g.fire[i]; d[o + 2] = Math.min(255, run); d[o + 3] = 255;
    }
  }

  /** The changed columns written into the texture; an upload when there is news and the last was 1 / upload real s ago; the clock. */
  update() {
    const cols = this.grid.takeChanged(this.seen);
    for (const x of cols) this._column(x);
    if (cols.length) this.pending = true;
    const now = performance.now();
    if (this.pending && now - this.last >= 1000 / GRID_LOOK.upload) { this.texture.needsUpdate = true; this.pending = false; this.last = now; }
    this.material.uniforms.uTime.value = (now / 1000) % GRID_LOOK.wrap; mindTick();
  }

  dispose() {
    this.mesh.removeFromParent();
    this.geometry.dispose(); this.material.dispose(); this.texture.dispose();
  }
}
