// ---------------------------------------------------------------------------------------
// THE RACEWAY'S SANDFALL (docs/plans/SKIFF-RACING.md 6; the owner, 2026-10-13: "an elegant and cheap solution like a scrolling UV
// texture on a curved, waterfall-like plane"): the sand spilling over the Raceway's lip and down its 26 m face. ONE curved sheet: it
// leaves the lip outward along the track's way, curls over and falls nearly straight down, held a little off the face; frayed at its
// sides and its foot. Behind it a wider, fainter sheet for depth, and at its foot a few puffs of dust. All three are one geometry and
// one material: ONE draw call, under 1,000 triangles (16 x 24 + 8 x 12 cells + 5 camera-facing quads: 970), one program.
//
// The fall is drawn as it falls: the streaks are the noise sampled in the sand's own time (tau, the seconds since a grain left the
// lip, from its fall d down the sheet: tau = (sqrt(w0^2 + 2 g d) - w0) / g), so a streak stretches as it speeds up, faster and
// longer lower down; two layers (the marbling and the bubbles of the liquid pack, vfx/liquid.js) fall at different rates and drift
// sideways at different rates, so it never visibly loops. The Dunes' sand (0xe8b070, the terrain's), its shade (the Dunemaw door's
// 0xb8834e) and its crests lighter (the spray's 0xf0c890, world/ground/groundmarks.js SAND).
//
// Prior art: the scrolling-UV waterfalls of the sixth generation (Wind Waker's falls and Spyro's: a strip of noise scrolled down a
// bent sheet, its edges alpha'd away), Dune's sandfalls off the Shield Wall (a curtain that curls before it drops), Journey's sand
// pouring from the broken ceilings; the Great Dunemaw's own sandfall door (vfx/dunemaw.js Sandfall: its two falling layers, its frayed
// sides, its liquid pack, all reused here as an idea; its program is a flat door's and stays its own). Free fall's speed sqrt(2 g d)
// for the warp along v; the billboard puff of every console's dust (Shadow of the Colossus's sand at a footfall).
//
//   const f = new Sandfall(game, { top, dir, width, height, curve?, lean?, speed?, zone? })   scene.add(f.object)   f.update(dt)   f.dispose()
//     top: the lip's middle (world); dir: the way out over it (horizontal); width, height: metres. curve: how far the sand is thrown out
//     before it turns down (m); lean: how much further out the foot is than the turn (m, to keep it off a face that slopes out).
//   f.set({ speed, width, curve, lean })   (the Workbench's sliders: width, curve and lean rebuild the sheet)
//   const park = prewarmSandfall(scene)   (main.js, before the compile)   park()   (after the prime draw: one copy kept, never disposed)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LIQUID_GLSL, liquidUniforms } from './liquid.js';

export const SANDFALL = {
  across: 16, down: 24, // (the front sheet's cells)
  backAcross: 8, backDown: 12, backWiden: 1.18, backOff: 0.9, backAlpha: 0.38, // (the sheet behind: wider, set back toward the face, fainter)
  puffs: 5, puffSize: 5.5, puffRise: 4, // (the dust at the foot: camera-facing quads)
  curve: 2.6, lean: 3.4, spread: 1.08, // (thrown out before the turn; the foot's further lean; the foot's width over the lip's)
  w0: 1.6, g: 9.8, speed: 1, // (the speed a grain leaves the lip at, m a real second; gravity; the time's scale)
  sand: 0xe8b070, shade: 0xb8834e, crest: 0xf0c890,
};

const V = /* glsl */`
attribute vec4 aSand; // (x: 0 the front sheet, 1 the back sheet, 2 a puff; yz: a puff's corner; w: a puff's seed)
varying vec2 vU; varying float vD, vX, vKind, vLife; varying vec2 vC;
uniform float uT, uPuffSize, uPuffRise;
#include <fog_pars_vertex>
void main() {
  vKind = aSand.x; vU = uv; vD = uv.y; vX = position.x; vC = aSand.yz; vLife = 0.0;
  vec4 mvPosition;
  if (aSand.x > 1.5) { // a puff: its centre is the vertex, its corner set out in the view's plane; it rises, swells and thins on a loop
    float life = fract(uT * 0.22 + aSand.w); vLife = life;
    vec3 c = position + vec3(0.0, life * uPuffRise, 0.0);
    mvPosition = modelViewMatrix * vec4(c, 1.0);
    mvPosition.xy += aSand.yz * uPuffSize * (0.55 + 0.75 * life);
  } else mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const F = /* glsl */`
varying vec2 vU; varying float vD, vX, vKind, vLife; varying vec2 vC;
uniform float uT, uLen, uW, uW0, uG, uBackAlpha;
uniform vec3 uSand, uShade, uCrest;
${LIQUID_GLSL}
#include <fog_pars_fragment>
void main() {
  vec3 col; float a;
  if (vKind > 1.5) { // the dust: a soft disc with a noisy rim, in at its birth and out as it rises
    float r = length(vC) * 2.0, n = liqTap(vC * 0.35 + vec2(vLife * 0.2, 0.0) + vX * 0.013).g;
    a = (1.0 - smoothstep(0.35, 1.0, r + 0.25 * (n - 0.5))) * smoothstep(0.0, 0.18, vLife) * (1.0 - smoothstep(0.45, 1.0, vLife)) * 0.42;
    col = mix(uSand, uCrest, 0.45 + 0.3 * n);
  } else {
    float d = vD * uLen, v = vD; // (metres down the sheet; 0..1)
    float tau = (sqrt(uW0 * uW0 + 2.0 * uG * d) - uW0) / uG; // (the grain's own time since the lip: the warp along v)
    float x = vX;
    // two layers, falling and drifting at their own rates: threads, not blobs (fine across, long down)
    vec2 p1 = vec2(x * 0.36 + 0.07 * sin(uT * 0.31 + tau * 0.8), (tau - uT) * 0.55);
    vec2 p2 = vec2(x * 0.83 + 0.41 + uT * 0.013, (tau - uT * 1.37) * 1.05 + 0.29);
    float s1 = liqTap(p1).r, s2 = liqTap(p2).g, s3 = liqTap(p1 * vec2(2.1, 0.7) + 0.53).a;
    float grains = s1 * 0.55 + s2 * 0.45;
    // the frayed sides: the edge eaten into by the streaks, wider and rougher lower down
    float across = 1.0 - abs(vU.x - 0.5) * 2.0;
    float fray = 0.12 + 0.22 * v;
    a = smoothstep(0.0, fray, across - (0.5 - grains) * fray * 0.9);
    a *= smoothstep(0.0, 0.03, v); // (in at the lip)
    a *= 1.0 - smoothstep(0.78, 1.0, v + (grains - 0.5) * 0.18); // (thinned into the dust at the foot)
    a *= mix(0.62, 1.0, smoothstep(0.3, 0.7, grains)); // (thin between the threads)
    col = mix(uShade, uSand, smoothstep(0.25, 0.75, grains));
    col = mix(col, uCrest, smoothstep(0.62, 0.9, s3 * 0.6 + grains * 0.4) * 0.8); // (the crests, lighter)
    col *= mix(1.08, 0.78, smoothstep(0.08, 0.9, v)); // (the curl in the sun, the fall in the cliff's shade)
    if (vKind > 0.5) { a *= uBackAlpha; col *= 0.82; }
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
    name: 'raceway-sandfall', vertexShader: V, fragmentShader: F, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...liquidUniforms(),
      uT: { value: 0 }, uLen: { value: 1 }, uW: { value: 1 }, uW0: { value: S.w0 }, uG: { value: S.g }, uBackAlpha: { value: S.backAlpha },
      uPuffSize: { value: S.puffSize }, uPuffRise: { value: S.puffRise },
      uSand: { value: new THREE.Color(S.sand) }, uShade: { value: new THREE.Color(S.shade) }, uCrest: { value: new THREE.Color(S.crest) },
    },
  });
}

export class Sandfall {
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
  const f = new Sandfall(null, { width: 4, height: 4 });
  f.object.position.set(0, -50, 0); f.object.frustumCulled = false; f.object.userData.zoneFree = true; f.object.visible = true; scene.add(f.object);
  return () => { f.object.visible = false; };
}
