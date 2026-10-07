// ---------------------------------------------------------------------------------------
// THE GARDEN'S WATER, DRAWN (a stand-in, Calissa's to replace with a Lachryma liquid of hers: vfx/liquid.js): one mesh a planetoid with
// water on it, a sphere on its clay's grid (world/garden/clay.js), each point at the ground plus the water's depth there, tinted by the
// water's mix of the five feelings (their colours: world/garden/plots.js FEELING_COLOR); only the triangles wet at all three corners are
// drawn (a dry corner tucked under the ground poked through the planetoid's coarser mesh as flickering specks, 2026-10-07: CLAUDE.md's
// rule on aliasing crawl). Redrawn when the water has moved, at most twenty times a real second. Flat-shaded
// (its facets lit from the screen's own slopes: no normals are worked out).
//
// Prior art: the heightfield water of every terrain engine (a grid of heights over the ground), From Dust's coloured water.
//
//   const L = new WaterLook(planetWater, planet)   L.mesh   L.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { NX, NY, CELL_DIRS } from './clay.js';
import { FEELINGS } from './water.js';
import { FEELING_COLOR } from './plots.js';

const LOOK = { every: 0.05, wet: 0.02, lift: 0.03 }; // (real seconds between redraws; metres: drawn deeper than this, lifted off the ground)
const COLORS = FEELINGS.map((f) => new THREE.Color(FEELING_COLOR[f]));

export class WaterLook {
  constructor(water, planet) {
    this.W = water; this.P = planet; this.seen = -1; this.t = 0;
    const n = NX * NY;
    this.quads = new Uint32Array((NY - 1) * NX * 4); let q = 0;
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) { const a = j * NX + i, b = j * NX + (i + 1) % NX; this.quads.set([a, b, a + NX, b + NX], q); q += 4; }
    this.index = new THREE.BufferAttribute(new Uint32Array((NY - 1) * NX * 6), 1); this.index.setUsage(THREE.DynamicDrawUsage);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setIndex(this.index); g.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ name: 'garden-water', vertexColors: true, flatShading: true, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.1, emissive: 0x223344, emissiveIntensity: 0.4 }));
    this.mesh.name = `garden-water-${planet.id}`; this.mesh.position.copy(planet.c); this.mesh.renderOrder = 2; this.mesh.frustumCulled = false;
  }

  update(dt) {
    const W = this.W;
    this.mesh.visible = W.total > 0.01;
    if (!this.mesh.visible || W.version === this.seen || (this.t -= dt) > 0) return;
    this.t = LOOK.every; this.seen = W.version;
    const C = W.clay, P = this.mesh.geometry.attributes.position, K = this.mesh.geometry.attributes.color, M = W.mixes, c = new THREE.Color();
    for (let k = 0; k < NX * NY; k++) {
      const w = W.w[k], r = C.base[k] + C.h[k] + w + LOOK.lift;
      P.setXYZ(k, CELL_DIRS[k * 3] * r, CELL_DIRS[k * 3 + 1] * r, CELL_DIRS[k * 3 + 2] * r);
      if (w > LOOK.wet) { c.setRGB(0, 0, 0); for (let e = 0; e < 5; e++) { const s = M[k * 5 + e]; if (s) { c.r += COLORS[e].r * s; c.g += COLORS[e].g * s; c.b += COLORS[e].b * s; } } K.setXYZ(k, c.r, c.g, c.b); }
    }
    // the triangles wet at every corner
    const Q = this.quads, X = this.index.array, wet = (k) => W.w[k] > LOOK.wet; let m = 0;
    for (let q = 0; q < Q.length; q += 4) { const a = Q[q], b = Q[q + 1], c = Q[q + 2], d = Q[q + 3]; if (wet(a) && wet(c) && wet(b)) { X[m++] = a; X[m++] = c; X[m++] = b; } if (wet(b) && wet(c) && wet(d)) { X[m++] = b; X[m++] = c; X[m++] = d; } }
    this.index.needsUpdate = true; this.mesh.geometry.setDrawRange(0, m);
    P.needsUpdate = true; K.needsUpdate = true;
  }
}
