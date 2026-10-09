// ---------------------------------------------------------------------------------------
// THE PAINT MAP: where Lachryma lies on the ground, as a grid the world can ask and the ground's shaders can draw. The Soul Brush's
// paint lays a feeling on it (and the mop drinks it back), and what stands in it is asked of it (stains of spilled crude are their own
// meshes: world/ground/stains.js): a creature in painted ground takes the feeling's status, a Brush Slide over it runs on (docs/plans/SUNSHINE-SYSTEMS.md: phase 2,
// and Dovina's numbers).
//
// Prior art: Super Mario Sunshine's pollution layers (doldecomp/sms PollutionLayer: a bitmap projected flat onto the floor, stamped by
// the spray, asked by the collision), Splatoon's paint kept in a texture laid over the level, and our own trail map
// (world/ground/trailmap.js: a window that follows the focus, re-centred in whole cells so nothing swims). Kept on the CPU, as
// Sunshine's was, so the game asks it without a read-back; uploaded to two small textures for the look.
//
//   const pm = new PaintMap()   pm.update(dt, focusX, focusZ)   pm.patch(material) (the ground's shaders: tops of things only)
//   pm.stamp(x, y, z, r, aspect, k) -> m² newly covered   pm.drink(x, y, z, r, want) -> paint taken (0..want, in cell-fulls)
//   pm.at(x, y, z) -> { k, aspect } | null   ASPECT_COLOR
//   (one cell is 0.25 m, so a puddle's edge reads round; a window of 256 cells, 64 m, round the focus; paint fades over LIFE real seconds)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ASPECTS, COLOR } from '../../progress/weather.js';

const N = 256, CELL = 0.25, SPAN = N * CELL, LIFE = 150, NONE = -1e4, NEAR = 0.8;
export const ASPECT_COLOR = Object.fromEntries(ASPECTS.map((a) => [a, new THREE.Color(COLOR[a])]));

export class PaintMap {
  constructor() {
    this.k = new Float32Array(N * N);       // paint, 0..1
    this.asp = new Int8Array(N * N).fill(-1); // its feeling (index into ASPECTS)
    this.h = new Float32Array(N * N).fill(NONE); // the height it lies at
    this.x0 = -SPAN / 2; this.z0 = -SPAN / 2; // (the window's corner, in whole cells)
    this.live = new Set(); this.dirty = true; this.upT = 0;
    this.colData = new Uint8Array(N * N * 4); this.hData = new Float32Array(N * N);
    this.colTex = new THREE.DataTexture(this.colData, N, N, THREE.RGBAFormat); this.colTex.magFilter = this.colTex.minFilter = THREE.LinearFilter;
    this.hTex = new THREE.DataTexture(this.hData, N, N, THREE.RedFormat, THREE.FloatType); this.hTex.magFilter = this.hTex.minFilter = THREE.NearestFilter;
    this.colTex.needsUpdate = this.hTex.needsUpdate = true;
    this.uniforms = { uPmCol: { value: this.colTex }, uPmH: { value: this.hTex }, uPmWin: { value: new THREE.Vector4(this.x0, this.z0, SPAN, 1 / N) } };
  }

  cell(x, z) { const i = Math.floor((x - this.x0) / CELL), j = Math.floor((z - this.z0) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; }

  /** Lay `k` of a feeling in a disc of radius r at (x, y, z). Returns the area newly covered (m²). */
  stamp(x, y, z, r, aspect, k = 1) {
    const a = ASPECTS.indexOf(aspect); if (a < 0) return 0;
    let fresh = 0;
    const c = Math.ceil(r / CELL);
    const ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const px = this.x0 + (i + 0.5) * CELL, pz = this.z0 + (j + 0.5) * CELL, d = Math.hypot(px - x, pz - z); if (d > r) continue;
      const n = j * N + i, add = k * (1 - (d / r) ** 2);
      if (this.h[n] !== NONE && Math.abs(this.h[n] - y) > NEAR && this.k[n] > 0.05) continue; // (another floor's paint: leave it)
      if (this.k[n] < 0.05) fresh += CELL * CELL;
      if (add > this.k[n] * 0.5) this.asp[n] = a; // (the newer feeling takes the cell when it is laid thicker than half what is there)
      this.k[n] = Math.min(1, this.k[n] + add); this.h[n] = y; this.live.add(n);
    }
    this.dirty = true;
    return fresh;
  }

  /** Drink up to `want` cell-fulls of paint within r of (x, y, z) (the mop). Returns what was taken. */
  drink(x, y, z, r, want) {
    let got = 0;
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c && got < want; dj++) for (let di = -c; di <= c && got < want; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] <= 0 || Math.abs(this.h[n] - y) > NEAR) continue;
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) > r) continue;
      const t = Math.min(this.k[n], want - got); this.k[n] -= t; got += t;
    }
    if (got) this.dirty = true;
    return got;
  }

  /** The paint at a point of the ground (within 0.8 m of the height it was laid at), or null. */
  at(x, y, z) {
    const n = this.cell(x, z); if (n < 0 || this.k[n] < 0.08 || Math.abs(this.h[n] - y) > NEAR) return null;
    return { k: this.k[n], aspect: ASPECTS[this.asp[n]] };
  }

  /** Once a frame: fade the paint, follow the focus (whole cells; what leaves the window is gone), upload when changed. */
  update(dt, fx, fz) {
    const want0 = Math.floor((fx - SPAN / 2) / CELL) * CELL, want1 = Math.floor((fz - SPAN / 2) / CELL) * CELL;
    if (Math.abs(want0 - this.x0) > SPAN / 4 || Math.abs(want1 - this.z0) > SPAN / 4) this.recentre(want0, want1);
    const fade = dt / LIFE;
    for (const n of this.live) { this.k[n] -= fade; if (this.k[n] <= 0) { this.k[n] = 0; this.asp[n] = -1; this.h[n] = NONE; this.live.delete(n); } }
    if (this.live.size) this.dirty = true;
    this.upT -= dt;
    if (this.dirty && this.upT <= 0) { this.upload(); this.upT = 0.1; this.dirty = false; } // (ten uploads a second at most)
  }

  recentre(x0, z0) {
    const di = Math.round((x0 - this.x0) / CELL), dj = Math.round((z0 - this.z0) / CELL);
    const k = new Float32Array(N * N), a = new Int8Array(N * N).fill(-1), h = new Float32Array(N * N).fill(NONE), live = new Set();
    for (const n of this.live) {
      const i = (n % N) - di, j = Math.floor(n / N) - dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const m = j * N + i; k[m] = this.k[n]; a[m] = this.asp[n]; h[m] = this.h[n]; live.add(m);
    }
    this.k = k; this.asp = a; this.h = h; this.live = live; this.x0 = x0; this.z0 = z0;
    this.uniforms.uPmWin.value.set(x0, z0, SPAN, 1 / N);
    this.dirty = true;
  }

  upload() {
    const C = this.colData, Hh = this.hData, tmp = new THREE.Color();
    for (let n = 0; n < N * N; n++) {
      const p = this.k[n], o = n * 4;
      if (p > 0.02) { tmp.copy(ASPECT_COLOR[ASPECTS[this.asp[n]]]); Hh[n] = this.h[n]; C[o + 3] = Math.round(255 * Math.min(1, p)); }
      else { C[o] = C[o + 1] = C[o + 2] = 0; C[o + 3] = 0; Hh[n] = NONE; continue; } // (black under nothing: an edge filters toward the colour, not away from it)
      const a = C[o + 3] / 255; C[o] = Math.round(tmp.r * a * 255); C[o + 1] = Math.round(tmp.g * a * 255); C[o + 2] = Math.round(tmp.b * a * 255); // (premultiplied)
    }
    this.colTex.needsUpdate = true; this.hTex.needsUpdate = true;
  }

  /** Draw the map on a material's up-facing surfaces (chained after any patch it has; one program per material kind). */
  patch(material) {
    if (material.userData.paintmap) return material;
    const U = this.uniforms, prev = material.onBeforeCompile;
    const before = material.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? material.customProgramCacheKey() : prev.toString();
    material.onBeforeCompile = (sh, r) => {
      prev?.call(material, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vPmPos;\nvarying vec3 vPmN;\n' + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  { mat4 pmM = modelMatrix;\n  #ifdef USE_INSTANCING\n    pmM = pmM * instanceMatrix;\n  #endif\n    vPmPos = (pmM * vec4(transformed, 1.0)).xyz; }')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  vPmN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = `varying vec3 vPmPos;
varying vec3 vPmN;
uniform sampler2D uPmCol; uniform sampler2D uPmH; uniform vec4 uPmWin;
` + sh.fragmentShader.replace('#include <alphamap_fragment>', `{
    vec2 pmUv = (vPmPos.xz - uPmWin.xy) / uPmWin.z;
    if (pmUv.x > 0.0 && pmUv.y > 0.0 && pmUv.x < 1.0 && pmUv.y < 1.0) {
      vec4 pc = texture2D(uPmCol, pmUv);
      float near = 1.0 - smoothstep(0.5, 0.9, abs(vPmPos.y - texture2D(uPmH, pmUv).r));
      float up = smoothstep(0.55, 0.8, normalize(vPmN).y);
      float grain = fract(sin(dot(floor(vPmPos.xz * 6.0), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 col = pc.rgb / max(pc.a, 0.05); // (the colour un-premultiplied: the texture filters colour and coverage together)
      float k = smoothstep(0.25, 0.5, pc.a + (grain - 0.5) * 0.12) * near * up; // (a wet edge, a little ragged)
      diffuseColor.rgb = mix(diffuseColor.rgb, col, k * 0.8);
      pmGlow = col * k * 0.2; // (Lachryma glows a little; the dark of crude, hardly at all)
    }
  }
  #include <alphamap_fragment>`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += pmGlow;')
        .replace('void main() {', 'vec3 pmGlow = vec3(0.0);\nvoid main() {');
    };
    material.customProgramCacheKey = () => `pm|${before}`;
    material.userData.paintmap = true; material.needsUpdate = true;
    return material;
  }
}
