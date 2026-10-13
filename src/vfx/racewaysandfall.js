// ---------------------------------------------------------------------------------------
// THE RACEWAY'S SANDFALL (docs/plans/SKIFF-RACING.md 6; the owner, 2026-10-13: "an elegant and cheap solution like a scrolling UV
// texture on a curved, waterfall-like plane"): the sand spilling over the Raceway's lip and down its 26 m face. ONE curved sheet: it
// leaves the lip outward along the track's way, curls over and falls nearly straight down, held a little off the face; frayed at its
// sides and its foot. Behind it a wider, fainter sheet for depth, and at its foot a few puffs of dust. All three are one geometry and
// one material: ONE draw call, under 1,000 triangles (16 x 24 + 8 x 12 cells + 5 camera-facing quads: 970), one program.
//
// The fall is drawn as it falls, procedurally (no texture: the owner, 2026-10-13, "some pretty aggressive tiling" when the liquid pack
// repeated across the 38 m sheet): the sheet is split across into thin columns (8 cm), each with its own fall speed (+-35%), phase,
// brightness (the shade to the crest) and streak length from a hash of its index, its streaks 1D value noise in the sand's own time
// (tau, the seconds since a grain left the lip, from its fall d: tau = (sqrt(w0^2 + 2 g d) - w0) / g), so a streak stretches as it
// speeds up; neighbours blended softly so they never read as stripes, and a coarser set of bundles (60 cm) under them. Over both, the
// curtains: a density field of three octaves (12, 6 and 3 m) drifting sideways, thick pours and thin gaps with a few stray grains; it
// frays the sides and pushes the lean, so neither edge nor foot is straight. The column detail fades by its own footprint (fwidth)
// into the curtain density before it is thinner than a pixel (the 480-line look: no crawl). The sheet behind takes another seed and
// a slower fall, so the two never line up. The Dunes' sand (0xe8b070, the terrain's), its shade (the Dunemaw door's 0xb8834e) and its
// crests lighter (the spray's 0xf0c890, world/ground/groundmarks.js SAND).
//
// Prior art: the scrolling-UV waterfalls of the sixth generation (Wind Waker's falls and Spyro's: a strip of noise scrolled down a
// bent sheet, its edges alpha'd away; here hashed per column rather than tiled), the hash of Dave Hoskins ("Hash without Sine", Shadertoy
// 4djSRW) and value noise (Perlin's lattice, smoothstepped), Dune's sandfalls off the Shield Wall (a curtain that curls before it drops), Journey's sand
// pouring from the broken ceilings; the Great Dunemaw's own sandfall door (vfx/dunemaw.js Sandfall: its two falling layers, its frayed
// sides, its liquid pack, all reused here as an idea; its program is a flat door's and stays its own). Free fall's speed sqrt(2 g d)
// for the warp along v; the billboard puff of every console's dust (Shadow of the Colossus's sand at a footfall).
//
//   const f = new RacewaySandfall(game, { top, dir, width, height, curve?, lean?, speed?, zone? })   scene.add(f.object)   f.update(dt)   f.dispose()
//     top: the lip's middle (world); dir: the way out over it (horizontal); width, height: metres. curve: how far the sand is thrown out
//     before it turns down (m); lean: how much further out the foot is than the turn (m, to keep it off a face that slopes out).
//   f.set({ speed, width, curve, lean })   (the Workbench's sliders: width, curve and lean rebuild the sheet)
//   const park = prewarmSandfall(scene)   (main.js, before the compile)   park()   (after the prime draw: one copy kept, never disposed)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SANDFALL = {
  across: 16, down: 24, // (the front sheet's cells)
  backAcross: 8, backDown: 12, backWiden: 1.18, backOff: 0.9, backAlpha: 0.38, // (the sheet behind: wider, set back toward the face, fainter)
  puffs: 5, puffSize: 5.5, puffRise: 4, // (the dust at the foot: camera-facing quads)
  curve: 2.6, lean: 3.4, spread: 1.08, // (thrown out before the turn; the foot's further lean; the foot's width over the lip's)
  w0: 1.6, g: 9.8, speed: 1, // (the speed a grain leaves the lip at, m a real second; gravity; the time's scale)
  column: 0.08, bundle: 0.6, // (the streaks' columns and the bundles under them, m across)
  curtains: [12, 6, 3], drift: 0.25, // (the curtains' wavelengths, m; their sideways drift, m a real second at the shortest)
  leanWobble: 1.4, backSlow: 0.72, backSeed: 41.7, // (the lean's swing along the width, m at the foot; the sheet behind: its fall's scale, its seed)
  sand: 0xe8b070, shade: 0xb8834e, crest: 0xf0c890,
};

const NOISE = /* glsl */`
float sfHash(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); } // (Hoskins, "Hash without Sine")
vec4 sfHash4(float p) { vec4 q = fract(vec4(p) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw) * q.zywx); }
float sfHash2(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float sfNoise(float x) { float i = floor(x), f = fract(x); return mix(sfHash(i), sfHash(i + 1.0), f * f * (3.0 - 2.0 * f)); }
float sfNoise2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(sfHash2(i), sfHash2(i + vec2(1.0, 0.0)), f.x), mix(sfHash2(i + vec2(0.0, 1.0)), sfHash2(i + 1.0), f.x), f.y); }
// the curtains: thick pours and thin gaps across the sheet, three octaves drifting sideways, breathing slowly down the fall
float sfCurtain(float x, float tau, float t, float seed, vec3 L, float drift) {
  float c = sfNoise2(vec2(x / L.x + t * drift / L.z * 0.15 + seed, (tau - t) * 0.05)) * 0.55
          + sfNoise2(vec2(x / L.y - t * drift / L.z * 0.4 + seed * 1.7, (tau - t) * 0.09 + 3.1)) * 0.3
          + sfNoise2(vec2(x / L.z + t * drift / L.z + seed * 2.3, (tau - t) * 0.16 + 7.7)) * 0.15;
  return c;
}`;
const V = /* glsl */`
attribute vec4 aSand; // (x: 0 the front sheet, 1 the back sheet, 2 a puff; yz: a puff's corner; w: a puff's seed)
varying vec2 vU; varying float vD, vX, vKind, vLife; varying vec2 vC;
uniform float uT, uPuffSize, uPuffRise, uLeanWobble, uBackSeed;
uniform vec3 uCurtains;
${NOISE}
#include <fog_pars_vertex>
void main() {
  vKind = aSand.x; vU = uv; vD = uv.y; vX = position.x; vC = aSand.yz; vLife = 0.0;
  vec4 mvPosition;
  if (aSand.x > 1.5) { // a puff: its centre is the vertex, its corner set out in the view's plane; it rises, swells and thins on a loop
    float life = fract(uT * 0.22 + aSand.w); vLife = life;
    vec3 c = position + vec3(0.0, life * uPuffRise, 0.0);
    mvPosition = modelViewMatrix * vec4(c, 1.0);
    mvPosition.xy += aSand.yz * uPuffSize * (0.55 + 0.75 * life);
  } else { // a sheet: the lean swung a little along the width (the foot line not straight), the back sheet on its own seed
    float seed = aSand.x * uBackSeed;
    float lw = sfNoise(position.x / uCurtains.x + 0.37 + seed) * 0.7 + sfNoise(position.x / uCurtains.y + 5.1 + seed) * 0.3 - 0.5;
    vec3 p = position; p.z += lw * 2.0 * uLeanWobble * uv.y * uv.y;
    mvPosition = modelViewMatrix * vec4(p, 1.0);
  }
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const F = /* glsl */`
varying vec2 vU; varying float vD, vX, vKind, vLife; varying vec2 vC;
uniform float uT, uLen, uW, uW0, uG, uBackAlpha, uColumn, uBundle, uDrift, uBackSlow, uBackSeed;
uniform vec3 uSand, uShade, uCrest, uCurtains;
${NOISE}
#include <fog_pars_fragment>
// one column's streak: its own speed, phase and length from the hash of its index; the streak is value noise in its own fall time
vec2 sfColumn(float k, float tau, float ftau, float t, float seed) {
  vec4 h = sfHash4(k + seed * 131.0);
  float sp = 1.0 + 0.7 * (h.x - 0.5); // (+-35%)
  float len = mix(0.07, 0.32, h.w); // (the streak's length, in seconds of fall)
  float n = mix(sfNoise((t - tau / sp) / len + h.y * 97.0), 0.5, smoothstep(0.35, 1.0, ftau / len)); // (faded to its mean before a streak is shorter than a pixel)
  return vec2(smoothstep(0.3, 0.85, n), h.z); // (the streak, the column's brightness)
}
// a set of columns of width w across x: each blended into its neighbour with a soft edge (never a hard stripe)
vec2 sfColumns(float x, float w, float tau, float ftau, float t, float seed) {
  float c = x / w - 0.5, k = floor(c), f = smoothstep(0.15, 0.85, fract(c));
  return mix(sfColumn(k, tau, ftau, t, seed), sfColumn(k + 1.0, tau, ftau, t, seed), f);
}
void main() {
  vec3 col; float a;
  if (vKind > 1.5) { // the dust: a soft disc with a noisy rim, in at its birth and out as it rises
    float r = length(vC) * 2.0, n = sfNoise2(vC * 3.0 + vec2(vLife * 1.5, 0.0) + vX * 0.13);
    a = (1.0 - smoothstep(0.35, 1.0, r + 0.25 * (n - 0.5))) * smoothstep(0.0, 0.18, vLife) * (1.0 - smoothstep(0.45, 1.0, vLife)) * 0.42;
    col = mix(uSand, uCrest, 0.45 + 0.3 * n);
  } else {
    bool back = vKind > 0.5;
    float seed = back ? uBackSeed : 0.0, t = back ? uT * uBackSlow : uT;
    float d = vD * uLen, v = vD; // (metres down the sheet; 0..1)
    float tau = (sqrt(uW0 * uW0 + 2.0 * uG * d) - uW0) / uG; // (the grain's own time since the lip: the warp along v)
    float x = vX;
    float fw = max(fwidth(x), 1e-4); // (metres across a pixel: the columns fade out before they are thinner than one)
    float dCol = 1.0 - smoothstep(0.25, 0.7, fw / uColumn), dBun = 1.0 - smoothstep(0.25, 0.7, fw / uBundle); // (gone by 1.4 px a column)
    float ftau = fwidth(tau); // (seconds of fall down a pixel)
    vec2 cs = sfColumns(x, uColumn, tau, ftau, t, seed), bs = sfColumns(x + 0.31, uBundle, tau * 0.35, ftau * 0.35, t * 0.93 * 0.35, seed + 0.5); // (the bundles' streaks longer: never blocks)
    float streak = mix(0.5, mix(bs.x, mix(bs.x, cs.x, 0.6), dCol), dBun); // (the fine set over the bundles; each fades to its mean, the finer first)
    float bright = mix(0.5, mix(bs.y, mix(bs.y, cs.y, 0.55), dCol), dBun);
    float dens = sfCurtain(x, tau, t, seed, uCurtains, uDrift);
    float thick = smoothstep(0.32, 0.62, dens); // (a pour, or a gap)
    // the frayed sides: the edge eaten into by the curtains and the streaks, wider and rougher lower down
    float across = 1.0 - abs(vU.x - 0.5) * 2.0;
    float fray = 0.1 + 0.22 * v;
    a = smoothstep(0.0, fray, across - (0.55 - dens) * fray * 1.6 - (0.5 - streak) * fray * 0.5);
    a *= smoothstep(0.0, 0.03, v); // (in at the lip)
    a *= 1.0 - smoothstep(0.76, 1.0, v + (streak - 0.5) * 0.12 + (0.5 - dens) * 0.16); // (thinned into the dust at the foot, not on a line)
    float strays = mix(0.12, smoothstep(0.75, 0.95, cs.x * cs.y + 0.15), dCol); // (in a gap only a few grains: at a distance a faint haze)
    a *= mix(strays * 0.55, 0.62 + 0.38 * streak, thick);
    col = mix(uShade, uCrest, clamp(bright * 0.55 + streak * 0.45, 0.0, 1.0));
    col = mix(col, uSand, 0.25 * (1.0 - thick)); // (the strays in the gaps lit through, the sand's own)
    col *= mix(1.08, 0.78, smoothstep(0.08, 0.9, v)); // (the curl in the sun, the fall in the cliff's shade)
    if (back) { a *= uBackAlpha; col *= 0.82; }
  }
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** The fall's middle line in its own frame (z out along dir, y up, the lip at 0): a curl thrown out `curve` metres, then down the
 *  face to its foot `lean` further out. A cubic Bezier sampled by length: [{ z, y, s }] and its whole length. */
function profile(H, curve, lean, n = 160) {
  const P = [[0, 0], [curve, 0], [curve + lean * 0.35, -Math.min(H * 0.32, curve * 2 + 3)], [curve + lean, -H]];
  const pts = []; let s = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const z = b[0] * P[0][0] + b[1] * P[1][0] + b[2] * P[2][0] + b[3] * P[3][0], y = b[0] * P[0][1] + b[1] * P[1][1] + b[2] * P[2][1] + b[3] * P[3][1];
    if (i) s += Math.hypot(z - pts[i - 1].z, y - pts[i - 1].y);
    pts.push({ z, y, s });
  }
  return { pts, len: s };
}
/** The point at length s along the profile. */
function at(prof, s) {
  const p = prof.pts; let i = 1; while (i < p.length - 1 && p[i].s < s) i++;
  const a = p[i - 1], b = p[i], k = (s - a.s) / Math.max(1e-6, b.s - a.s);
  return { z: a.z + (b.z - a.z) * k, y: a.y + (b.y - a.y) * k };
}

/** The sheets and the puffs as one geometry (front last but for the puffs: drawn in index order, the back first). */
function buildGeometry({ width, height, curve, lean }) {
  const S = SANDFALL, prof = profile(height, curve, lean), L = prof.len;
  const pos = [], uv = [], sand = [], idx = [];
  const sheet = (nx, ny, widen, off, kind) => {
    const base = pos.length / 3;
    for (let j = 0; j <= ny; j++) {
      const v = Math.pow(j / ny, 1.35), p = at(prof, v * L); // (rows close at the curl, where it bends)
      const w = width * widen * (1 + (S.spread - 1) * v);
      for (let i = 0; i <= nx; i++) {
        const u = i / nx;
        pos.push((u - 0.5) * w, p.y - off * 0.3 * v, p.z - off * v); uv.push(u, v); sand.push(kind, 0, 0, 0);
      }
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  };
  sheet(S.backAcross, S.backDown, S.backWiden, S.backOff, 1);
  sheet(S.across, S.down, 1, 0, 0);
  // the puffs: four corners at one centre each, along the foot, a little out from it
  const foot = at(prof, L);
  for (let k = 0; k < S.puffs; k++) {
    const base = pos.length / 3, x = ((k + 0.5) / S.puffs - 0.5) * width * S.spread * 0.9, seed = (k * 0.618) % 1;
    for (const [cx, cy] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { pos.push(x, foot.y + 0.6, foot.z + 1.2); uv.push(0, 1); sand.push(2, cx, cy, seed); }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSand', new THREE.Float32BufferAttribute(sand, 4));
  g.setIndex(idx);
  g.computeBoundingBox(); g.boundingBox.expandByScalar(S.puffSize * 1.4 + S.puffRise); // (the puffs are set out in the view's plane)
  g.boundingSphere = g.boundingBox.getBoundingSphere(new THREE.Sphere());
  return { g, len: L };
}

function material() {
  const S = SANDFALL;
  return new THREE.ShaderMaterial({
    name: 'raceway-sandfall', vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, fog: true, // (one pass, one program: no back pass's flipSided twin)
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uColumn: { value: S.column }, uBundle: { value: S.bundle }, uCurtains: { value: new THREE.Vector3(...S.curtains) }, uDrift: { value: S.drift },
      uLeanWobble: { value: S.leanWobble }, uBackSlow: { value: S.backSlow }, uBackSeed: { value: S.backSeed },
      uT: { value: 0 }, uLen: { value: 1 }, uW: { value: 1 }, uW0: { value: S.w0 }, uG: { value: S.g }, uBackAlpha: { value: S.backAlpha },
      uPuffSize: { value: S.puffSize }, uPuffRise: { value: S.puffRise },
      uSand: { value: new THREE.Color(S.sand) }, uShade: { value: new THREE.Color(S.shade) }, uCrest: { value: new THREE.Color(S.crest) },
    },
  });
}

export class RacewaySandfall {
  constructor(game, { top = new THREE.Vector3(), dir = new THREE.Vector3(0, 0, 1), width = 30, height = 26, curve = SANDFALL.curve, lean = SANDFALL.lean, speed = SANDFALL.speed, zone } = {}) {
    this.game = game;
    this.opts = { width, height, curve, lean }; this.speed = speed; this.t = 0;
    this.mat = material();
    const { g, len } = buildGeometry(this.opts);
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.name = 'sandfall'; this.mesh.renderOrder = 2;
    this.mat.uniforms.uLen.value = len; this.mat.uniforms.uW.value = width;
    this.object = this.mesh;
    this.object.position.copy(top).add(new THREE.Vector3(0, 0.05, 0));
    this.object.rotation.y = Math.atan2(dir.x, dir.z); // (its +z is the way out over the lip)
    if (zone) this.object.userData.zone = zone;
  }
  /** The Workbench's sliders: speed (the time's scale); width, curve and lean rebuild the sheet (a few hundred vertices). */
  set({ speed, width, curve, lean } = {}) {
    if (speed != null) this.speed = speed;
    const o = this.opts, next = { width: width ?? o.width, height: o.height, curve: curve ?? o.curve, lean: lean ?? o.lean };
    if (next.width === o.width && next.curve === o.curve && next.lean === o.lean) return;
    this.opts = next;
    const { g, len } = buildGeometry(next); this.mesh.geometry.dispose(); this.mesh.geometry = g;
    this.mat.uniforms.uLen.value = len; this.mat.uniforms.uW.value = next.width;
  }
  update(dt) { this.t += dt * this.speed; this.mat.uniforms.uT.value = this.t; }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); }
}

/** One copy 50 m under the world for main.js's compile; kept and never disposed, so its program lives (the casebook's rules 17 and 18). */
export function prewarmSandfall(scene) {
  const f = new RacewaySandfall(null, { width: 4, height: 4 });
  f.object.position.set(0, -50, 0); f.object.frustumCulled = false; f.object.userData.zoneFree = true; f.object.visible = true; scene.add(f.object);
  return () => { f.object.visible = false; };
}
