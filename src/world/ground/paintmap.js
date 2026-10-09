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
//   pm.at(x, y, z) -> { k, aspect, crude } | null   pm.wipe(ax, az, bx, bz, y, width, want, crude, centre?) -> { got, aspect, smear }
//   pm.slick(x, y, z, r, k) (crude that fades: a fight's)   pm.count(x, y, z, r, crude) -> cells   pm.onRecentre (set by stains.js: the blots laid again)   ASPECT_COLOR
//   (one cell is 0.25 m, so a puddle's edge reads round; a window of 256 cells, 64 m, round the focus; paint fades over LIFE real seconds)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { OPPOSITE, ASPECTS, COLOR } from '../../progress/weather.js';

const N = 256, CELL = 0.25, SPAN = N * CELL, LIFE = 150, SLICK_LIFE = 40, NONE = -1e4, NEAR = 0.8, FLAT = 0x3b2b22; // (a slick: crude thrown or welled up in a fight, flat (no feeling), gone in 40 real seconds)
/** Which cells a wipe or a count takes: true a blot's crude, 'slick' a slick's, false paint. */
const KIND = (crude) => (crude === 'slick' ? 2 : crude ? 1 : 0);
export const ASPECT_COLOR = Object.fromEntries(ASPECTS.map((a) => [a, new THREE.Color(COLOR[a])]));

export class PaintMap {
  constructor() {
    this.k = new Float32Array(N * N);       // paint, 0..1
    this.asp = new Int8Array(N * N).fill(-1); // its feeling (index into ASPECTS)
    this.crude = new Uint8Array(N * N); // 1: crude, a blot's (world/ground/stains.js), which keeps; 2: a slick, crude that fades; 0: paint, which fades
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

  /** Lay `k` of a feeling in a disc of radius r at (x, y, z). Returns the area newly covered (m²). One feeling a cell: the same feeling
   *  thickens, another takes the cell (the last writer wins, a crisp edge), its opposite cancels it toward bare ground (LACHRYMA-LOOP.md
   *  3, rule 5). `crude`: laid as a blot's crude, which keeps (and paint over crude is laid over it, crude over paint takes the cell). */
  stamp(x, y, z, r, aspect, k = 1, crude = false) {
    const a = ASPECTS.indexOf(aspect); if (a < 0) return 0;
    let fresh = 0;
    const c = Math.ceil(r / CELL), opp = ASPECTS.indexOf(OPPOSITE[aspect]);
    const ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const px = this.x0 + (i + 0.5) * CELL, pz = this.z0 + (j + 0.5) * CELL, d = Math.hypot(px - x, pz - z); if (d > r) continue;
      const n = j * N + i, add = crude ? k : k * (1 - 0.5 * (d / r) ** 2); // (crude lies flat to its edge: a blot's crude is its cells)
      if (this.h[n] !== NONE && Math.abs(this.h[n] - y) > NEAR && this.k[n] > 0.05) continue; // (another floor's paint: leave it)
      if (this.crude[n] && !crude && this.k[n] > 0.05) continue; // (paint does not cover crude: it is wiped up, the mop's, or cleaned)
      if (this.k[n] < 0.05) fresh += CELL * CELL;
      if (this.k[n] >= 0.05 && this.asp[n] === opp && !crude && !this.crude[n]) { this.k[n] = Math.max(0, this.k[n] - add); if (this.k[n] < 0.05) { this.k[n] = 0; this.asp[n] = -1; } this.live.add(n); continue; } // (opposites cancel)
      if (this.asp[n] === a && this.crude[n] === (crude ? 1 : 0)) this.k[n] = Math.min(1, this.k[n] + add); // (the same: it thickens)
      else { this.asp[n] = a; this.k[n] = Math.min(1, Math.max(add, crude ? this.k[n] : 0)); this.crude[n] = crude ? 1 : 0; } // (another: the last writer takes it)
      this.h[n] = y; this.live.add(n);
    }
    this.dirty = true;
    return fresh;
  }

  /** A slick: crude with no feeling laid in a disc (a jelly's spit, a slam's ring, a cast's puddle: LACHRYMA-LOOP.md 0, "every liquid
   *  hazard is crude"), over bare ground and paint, never over a blot; it fades in SLICK_LIFE real seconds. */
  slick(x, y, z, r, k = 1) {
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) > r) continue;
      const n = j * N + i; if (this.crude[n] === 1 && this.k[n] > 0.05) continue;
      if (this.h[n] !== NONE && Math.abs(this.h[n] - y) > NEAR && this.k[n] > 0.05) continue;
      this.asp[n] = -1; this.crude[n] = 2; this.k[n] = Math.max(this.k[n], k); this.h[n] = y; this.live.add(n);
    }
    this.dirty = true;
  }

  /** The mop's wipe: a strip `w` wide from a to b (the stroke this frame), rim cells first, up to `want` cell-fulls. `crude` true: only
   *  a blot's crude, 'slick': only a slick's, false: only paint. Returns { got, aspect, smear: where the edge of it was pushed to (0.5 m on along the stroke) } (rule 7). */
  wipe(ax, az, bx, bz, y, w, want, crude, centre = null) {
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1e-6, ux = dx / len, uz = dz / len, half = w / 2;
    const x0 = Math.min(ax, bx) - half, x1 = Math.max(ax, bx) + half, z0 = Math.min(az, bz) - half, z1 = Math.max(az, bz) + half;
    const cells = [];
    for (let j = Math.floor((z0 - this.z0) / CELL); j <= Math.floor((z1 - this.z0) / CELL); j++) for (let i = Math.floor((x0 - this.x0) / CELL); i <= Math.floor((x1 - this.x0) / CELL); i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] <= 0 || this.crude[n] !== KIND(crude) || Math.abs(this.h[n] - y) > NEAR) continue;
      const px = this.x0 + (i + 0.5) * CELL - ax, pz = this.z0 + (j + 0.5) * CELL - az, along = px * ux + pz * uz, across = Math.abs(px * uz - pz * ux);
      if (across > half || along < -half || along > len + half) continue;
      const cx = centre ? this.x0 + (i + 0.5) * CELL - centre.x : 0, cz = centre ? this.z0 + (j + 0.5) * CELL - centre.z : 0;
      cells.push([n, centre ? -(cx * cx + cz * cz) : -across]); // (the rim first: farthest from the blot's middle, else the strip's edge)
    }
    cells.sort((p, q) => p[1] - q[1]);
    let got = 0, aspect = null;
    for (const [n] of cells) { if (got >= want) break; const t = Math.min(this.k[n], want - got); this.k[n] -= t; got += t; aspect = ASPECTS[this.asp[n]]; if (this.k[n] <= 0.02) { this.k[n] = 0; this.asp[n] = -1; this.crude[n] = 0; } }
    if (got) this.dirty = true;
    return { got, aspect, smear: got > 0 ? { x: bx + ux * 0.5, z: bz + uz * 0.5 } : null };
  }

  /** Drink up to `want` cell-fulls of paint within r of (x, y, z) (the mop). Returns what was taken. */
  drink(x, y, z, r, want) {
    let got = 0;
    const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c && got < want; dj++) for (let di = -c; di <= c && got < want; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = j * N + i; if (this.k[n] <= 0 || this.crude[n] || Math.abs(this.h[n] - y) > NEAR) continue; // (paint: crude is the blots', wipe())
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) > r) continue;
      const t = Math.min(this.k[n], want - got); this.k[n] -= t; got += t;
    }
    if (got) this.dirty = true;
    return got;
  }

  /** How many cells within r of (x, z) hold something (crude, or paint), at height y. */
  count(x, y, z, r, crude = true) {
    let n = 0; const c = Math.ceil(r / CELL), ci = Math.floor((x - this.x0) / CELL), cj = Math.floor((z - this.z0) / CELL);
    for (let dj = -c; dj <= c; dj++) for (let di = -c; di <= c; di++) {
      const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const m = j * N + i; if (this.k[m] <= 0.02 || this.crude[m] !== KIND(crude) || Math.abs(this.h[m] - y) > NEAR) continue;
      if (Math.hypot(this.x0 + (i + 0.5) * CELL - x, this.z0 + (j + 0.5) * CELL - z) <= r) n++;
    }
    return n;
  }

  /** The paint at a point of the ground (within 0.8 m of the height it was laid at), or null. */
  at(x, y, z) {
    const n = this.cell(x, z); if (n < 0 || this.k[n] < 0.08 || Math.abs(this.h[n] - y) > NEAR) return null;
    return { k: this.k[n], aspect: this.asp[n] >= 0 ? ASPECTS[this.asp[n]] : null, crude: !!this.crude[n], slick: this.crude[n] === 2 };
  }

  /** Once a frame: fade the paint, follow the focus (whole cells; what leaves the window is gone), upload when changed. */
  update(dt, fx, fz) {
    const want0 = Math.floor((fx - SPAN / 2) / CELL) * CELL, want1 = Math.floor((fz - SPAN / 2) / CELL) * CELL;
    if (Math.abs(want0 - this.x0) > SPAN / 4 || Math.abs(want1 - this.z0) > SPAN / 4) this.recentre(want0, want1);
    const fade = dt / LIFE;
    for (const n of this.live) { if (this.crude[n] === 1 && this.k[n] > 0) continue; this.k[n] -= this.crude[n] === 2 ? dt / SLICK_LIFE : fade; if (this.k[n] <= 0) { this.k[n] = 0; this.asp[n] = -1; this.h[n] = NONE; this.crude[n] = 0; this.live.delete(n); } } // (crude keeps: a blot stays until it is wiped)
    if (this.live.size) this.dirty = true;
    this.upT -= dt;
    if (this.dirty && this.upT <= 0) { this.upload(); this.upT = 0.1; this.dirty = false; } // (ten uploads a second at most)
  }

  recentre(x0, z0) {
    const di = Math.round((x0 - this.x0) / CELL), dj = Math.round((z0 - this.z0) / CELL);
    const k = new Float32Array(N * N), a = new Int8Array(N * N).fill(-1), h = new Float32Array(N * N).fill(NONE), cr = new Uint8Array(N * N), live = new Set();
    for (const n of this.live) {
      const i = (n % N) - di, j = Math.floor(n / N) - dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const m = j * N + i; k[m] = this.k[n]; a[m] = this.asp[n]; h[m] = this.h[n]; cr[m] = this.crude[n]; live.add(m);
    }
    this.k = k; this.asp = a; this.h = h; this.crude = cr; this.live = live; this.x0 = x0; this.z0 = z0;
    this.onRecentre?.(); // (what keeps, the blots, is laid again into the new window: stains.js)
    this.uniforms.uPmWin.value.set(x0, z0, SPAN, 1 / N);
    this.dirty = true;
  }

  upload() {
    const C = this.colData, Hh = this.hData, tmp = new THREE.Color();
    for (let n = 0; n < N * N; n++) {
      const p = this.k[n], o = n * 4;
      if (p > 0.02 && this.crude[n] !== 2) { if (this.asp[n] < 0) tmp.setHex(FLAT); else tmp.copy(ASPECT_COLOR[ASPECTS[this.asp[n]]]); if (this.crude[n]) tmp.multiplyScalar(this.asp[n] < 0 ? 1 : 0.42); Hh[n] = this.h[n]; C[o + 3] = Math.round(255 * Math.min(1, this.crude[n] ? Math.max(p, 0.6) : p)); } // (crude: the feeling's colour gone dark and flat, a stand-in look: Calissa's)
      else { C[o] = C[o + 1] = C[o + 2] = 0; C[o + 3] = 0; Hh[n] = NONE; continue; } // (black under nothing: an edge filters toward the colour, not away from it; a slick's cells are drawn where they lie, vfx/slicks.js)
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
