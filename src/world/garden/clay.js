// ---------------------------------------------------------------------------------------
// THE PLANETOIDS' CLAY: a planetoid's surface as a height over its radius, reshaped by the god hand (docs/plans/SPIRIT-GARDEN.md
// section 4, "sculpt" and "lead water"; the owner: "literally let you reshape your inner world like clay"). Each planetoid keeps a grid
// of heights over latitude and longitude (64 by 32: a cell about two metres at the Dantian's equator), read with a bilinear sample in
// any direction; a press, a pull, a smoothing or a carve is a soft brush on that grid, held within a band of the radius (a hill or a
// hollow, never through the heart) and held still round what stands on the ground (a feature never floats or sinks). The mesh follows
// the grid, and the planetoid bodies stand on it (world/garden/planetbody.js asks `radiusAt`). Water led from a pond runs down the
// slope the hand carved, cell by cell, until it pools (From Dust's water, a ribbon of Lachryma).
//
// Prior art: Populous's raise and lower, From Dust's sculpted ground and its water that finds the low path, Spore's planet editor
// (a sphere's height field under a brush), and the potter's thumb on a pot's wall.
//
//   const C = new Clay(planet, { band })   C.heightAt(dir)   C.radiusAt(dir)   C.brush(dir, how, strength, radius)   C.keep(dir, r)
//   C.flow(fromDir, steps) -> [dirs]   C.apply(mesh)   C.dump() -> [int]   C.load([int])   (how: 'press' | 'pull' | 'smooth' | 'carve')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const NX = 64, NY = 32;
const _d = new THREE.Vector3();
/** The grid cell's direction (unit vector) for a column and row. */
const dirOf = (i, j, out = new THREE.Vector3()) => { const lon = (i / NX) * Math.PI * 2, lat = ((j + 0.5) / NY - 0.5) * Math.PI; return out.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)); };
/** A direction's place on the grid (fractional column and row). */
const uvOf = (d) => { const lon = Math.atan2(d.x, d.z), lat = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)); return [((lon / (Math.PI * 2)) * NX + NX) % NX, (lat / Math.PI + 0.5) * NY - 0.5]; };

export class Clay {
  constructor(planet, { band = null } = {}) {
    this.P = planet; this.band = band ?? Math.min(3, planet.r * 0.15); // (a hill or a hollow of up to 3 m, less on a small world)
    this.h = new Float32Array(NX * NY); this.kept = []; this.version = 0;
  }
  /** The height over the radius in a direction (bilinear on the grid, wrapping round in longitude, clamped at the poles). */
  heightAt(dir) {
    const [u, v] = uvOf(dir), i0 = Math.floor(u), j0 = THREE.MathUtils.clamp(Math.floor(v), 0, NY - 1), j1 = Math.min(NY - 1, j0 + 1);
    const fu = u - i0, fv = THREE.MathUtils.clamp(v - j0, 0, 1), i1 = (i0 + 1) % NX, H = this.h;
    return (H[j0 * NX + i0] * (1 - fu) + H[j0 * NX + i1] * fu) * (1 - fv) + (H[j1 * NX + i0] * (1 - fu) + H[j1 * NX + i1] * fu) * fv;
  }
  radiusAt(dir) { return this.P.r + this.heightAt(dir); }
  /** Hold the ground still within `r` metres of a direction (a feature stands there). */
  keep(dir, r = 3) { this.kept.push({ d: dir.clone().normalize(), r }); }
  held(d) { let k = 1; for (const q of this.kept) { const s = this.P.r * Math.acos(THREE.MathUtils.clamp(d.dot(q.d), -1, 1)); k = Math.min(k, THREE.MathUtils.smoothstep(s, q.r, q.r + 2)); } return k; }

  /** A brush stroke at a direction: `press` lowers, `pull` raises, `carve` cuts a narrow groove, `smooth` eases toward the
   *  neighbourhood's mean. `radius` in metres along the surface; `strength` metres a full stroke. True if anything moved. */
  brush(dir, how = 'pull', strength = 0.3, radius = 3) {
    const d0 = _d.copy(dir).normalize(), H = this.h, ang = (how === 'carve' ? radius * 0.5 : radius) / this.P.r, cosMax = Math.cos(ang * 2), c = new THREE.Vector3();
    let mean = 0, n = 0, moved = false;
    if (how === 'smooth') for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { if (dirOf(i, j, c).dot(d0) > cosMax) { mean += H[j * NX + i]; n++; } }
    mean = n ? mean / n : 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const dot = dirOf(i, j, c).dot(d0); if (dot < cosMax) continue;
      const a = Math.acos(Math.min(1, dot)), w = Math.exp(-(a * a) / (2 * ang * ang)) * this.held(c), k = j * NX + i;
      if (w < 0.01) continue;
      const was = H[k];
      if (how === 'smooth') H[k] += (mean - H[k]) * Math.min(1, w * strength * 2);
      else H[k] += (how === 'pull' ? 1 : -1) * strength * w * (how === 'carve' ? 1.5 : 1);
      H[k] = THREE.MathUtils.clamp(H[k], -this.band, this.band);
      if (H[k] !== was) moved = true;
    }
    if (moved) this.version++;
    return moved;
  }

  /** Water led from a direction: downhill a cell at a time until it pools (at most `steps`); the directions it passes. */
  flow(from, steps = 80) {
    const out = [from.clone().normalize()], c = new THREE.Vector3(), step = 0.8 / this.P.r; // (0.8 m a step along the ground)
    let d = out[0].clone(), h = this.heightAt(d);
    for (let s = 0; s < steps; s++) {
      // the lowest of eight neighbours a step away (in the plane tangent to here)
      const t1 = new THREE.Vector3(0, 1, 0).cross(d); if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0); t1.normalize(); const t2 = d.clone().cross(t1);
      let best = null, bh = h - 1e-3;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.copy(d).addScaledVector(t1, Math.cos(a) * step).addScaledVector(t2, Math.sin(a) * step).normalize(); const ch = this.heightAt(c); if (ch < bh) { bh = ch; best = c.clone(); } }
      if (!best) break; // (it pools here)
      d = best; h = bh; out.push(d.clone());
    }
    return out;
  }

  /** The planetoid's mesh made to follow the grid: each vertex at its rest direction, out to the radius there. */
  apply(mesh) {
    const g = mesh.geometry, pos = g.attributes.position, base = g.userData.dirs || (g.userData.dirs = Float32Array.from(pos.array, (v, i) => v)); // (the rest shape's directions, kept once)
    if (!g.userData.unit) { for (let i = 0; i < base.length; i += 3) { _d.set(base[i], base[i + 1], base[i + 2]).normalize(); base[i] = _d.x; base[i + 1] = _d.y; base[i + 2] = _d.z; } g.userData.unit = true; }
    for (let i = 0; i < pos.count; i++) { _d.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]); const r = this.radiusAt(_d); pos.setXYZ(i, _d.x * r, _d.y * r, _d.z * r); }
    pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
  }

  /** Kept as whole centimetres (a planetoid's ground in the save: core/save.js). */
  dump() { let any = false; const a = Array.from(this.h, (v) => { const c = Math.round(v * 100); if (c) any = true; return c; }); return any ? a : null; }
  load(a) { if (!Array.isArray(a) || a.length !== this.h.length) return; for (let i = 0; i < a.length; i++) this.h[i] = (a[i] || 0) / 100; this.version++; }
}
