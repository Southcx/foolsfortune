// ---------------------------------------------------------------------------------------
// THE TELEGRAPHS' DRAPE: the grid a ground telegraph is drawn on, laid over the ground so the mark conforms to it (TELEGRAPHS.md
// section 3: "on the ground, conforming to it ... never a flat disc floating over a slope"). A square of the world round the area,
// in whole cells snapped to the world (a cell of 0.5, 1, 2 or 4 m, the finest that keeps it within 48 a side), each vertex set on the
// ground under it, a few centimetres up (the casebook's rule 1). Heights are asked of a ground function once a world cell and kept
// (a mark that follows the Courier across the bowl asks only for the cells it newly covers). What a coarse grid cannot follow (a
// chord across a curved floor) the program hides by pulling the mark toward the eye (vfx/telegraphs/telegraphshader.js `uBias`).
//
// Prior art: the stains' drape (vfx/stains.js: a disc's vertices lifted to the ground under each), the projected decal's grid of
// every terrain engine before deferred decals (a patch of the terrain's own cells under the mark), and a height cache keyed by cell.
//
//   const D = new TelegraphDrape({ max: 48 })   D.geometry   D.lay(bounds { x0, z0, x1, z1 }, heightAt (x, z) -> y) -> true if relaid
//   heightCache(fn (x, z, y) -> height) -> (x, z, y) -> height   (one ask a world cell and floor band of 4 m, cleared past 60,000)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const STEPS = [0.5, 1, 2, 4], LIFT = 0.04;

export class TelegraphDrape {
  constructor({ max = 48 } = {}) {
    this.max = max; const n = max + 1;
    this.pos = new Float32Array(n * n * 3);
    const idx = new Uint16Array(max * max * 6);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geometry.setDrawRange(0, 0);
    this.key = '';
  }

  /** Lay the grid over a world box. Relaid only when its snapped cells change (the key), so a mark held still costs nothing. */
  lay(b, heightAt) {
    const span = Math.max(b.x1 - b.x0, b.z1 - b.z0), step = STEPS.find((s) => span / s <= this.max) ?? span / this.max;
    const i0 = Math.floor(b.x0 / step), j0 = Math.floor(b.z0 / step);
    const nx = Math.min(this.max, Math.max(1, Math.ceil(b.x1 / step) - i0)), nz = Math.min(this.max, Math.max(1, Math.ceil(b.z1 / step) - j0));
    const key = `${step}|${i0}|${j0}|${nx}|${nz}`;
    if (key === this.key) return false;
    this.key = key;
    const P = this.pos, idx = this.geometry.index.array, row = nx + 1;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = (i0 + i) * step, z = (j0 + j) * step, o = (j * row + i) * 3;
      P[o] = x; P[o + 1] = heightAt(x, z) + LIFT; P[o + 2] = z;
    }
    let k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * row + i, c = a + row;
      idx[k++] = a; idx[k++] = c; idx[k++] = a + 1; idx[k++] = a + 1; idx[k++] = c; idx[k++] = c + 1;
    }
    this.geometry.attributes.position.needsUpdate = true; this.geometry.index.needsUpdate = true;
    this.geometry.setDrawRange(0, k);
    this.geometry.computeBoundingSphere();
    return true;
  }

  /** Forget the lay (the ground changed: a new place). */
  reset() { this.key = ''; }
  dispose() { this.geometry.dispose(); }
}

/** A ground asked once a world cell (rounded to 5 cm) and a floor band (4 m: a room over a room asks again), and remembered: what a
 *  physics ray costs is paid once a place. */
export function heightCache(fn) {
  const M = new Map();
  const at = (x, z, y = 0) => {
    const k = `${Math.round(x * 20)},${Math.round(z * 20)},${Math.round(y / 4)}`;
    let h = M.get(k);
    if (h === undefined) { if (M.size > 60000) M.clear(); h = fn(x, z, y); M.set(k, h); }
    return h;
  };
  at.clear = () => M.clear();
  return at;
}
