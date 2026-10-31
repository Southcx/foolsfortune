// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S GRID LOOK: the Flood stage's falling-sand grid (world/strawmanwell/grid.js) drawn, a PLACEHOLDER: Calissa replaces it
// with the real look (the stage's matter in the Clay dress, the house's liquid for Lachryma, crude's oil film). One plane the grid's size
// standing in the stage's plane, a DataTexture of one texel a cell (nearest filtering: the cells read as cells), written only in the
// columns the grid changed and uploaded at most UPLOAD times a real second: stone grey, sand tan, clay terracotta, Lachryma a translucent
// violet-blue, crude near-black with a faint sheen, ice pale cyan, a burning cell an ember, empty clear.
//
// Prior art: Noita's and the Powder Toy's one-texel-a-cell canvas, the grid's row 0 at the texture's row 0 (both at the foot: three's
// DataTexture is not flipped, and a PlaneGeometry's v runs up).
//
//   const look = new GridLook(grid, origin)   scene.add(look.mesh)   look.update()   (each frame)   look.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GRID, CELL } from '../../progress/strawmanwell.js';

/** At most this many texture uploads a real second (the brief's ceiling: a 160 x 90 RGBA texture is 58 KB an upload; the grid steps 30 a
 *  real second and a quarter of its rows a step, so 15 shows every other step's news). */
const UPLOAD = 15;
/** The placeholder's colours, RGBA 0..255 by kind (Lachryma's alpha 190, ~0.75: the stage seen through it). */
const COLOUR = {
  [CELL.empty]: [0, 0, 0, 0], [CELL.stone]: [118, 116, 122, 255], [CELL.sand]: [214, 184, 132, 255], [CELL.clay]: [176, 92, 60, 255],
  [CELL.lachryma]: [120, 118, 230, 190], [CELL.crude]: [22, 20, 26, 245], [CELL.ice]: [196, 238, 246, 235],
};
const EMBER = [255, 140, 40, 255];
/** A cell's own small shade, from its position (a grain to sand and stone; crude's sheen, a violet glint on one cell in six). */
const hash = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 13; return (h >>> 0) / 4294967296; };

export class GridLook {
  constructor(grid, origin) {
    this.grid = grid; this.origin = origin;
    const w = grid.w, h = grid.h;
    this.data = new Uint8Array(w * h * 4);
    this.texture = new THREE.DataTexture(this.data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.texture.magFilter = THREE.NearestFilter; this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false; this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.geometry = new THREE.PlaneGeometry(w * GRID.size, h * GRID.size);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'strawmanwell.grid';
    this.mesh.position.set(origin.x + (w * GRID.size) / 2, origin.y + (h * GRID.size) / 2, origin.z);
    this.seen = new Uint32Array(w); // (this reader's own column counts: grid.takeChanged)
    this.pending = false; this.last = -Infinity;
    for (let x = 0; x < w; x++) this._column(x);
    this.texture.needsUpdate = true; this.seen.set(grid.ver);
  }

  _column(x) {
    const g = this.grid, w = g.w, d = this.data;
    for (let y = 0; y < g.h; y++) {
      const i = y * w + x, k = g.cells[i], o = i * 4;
      const c = g.fire[i] ? EMBER : COLOUR[k] || COLOUR[CELL.empty];
      let r = c[0], gg = c[1], b = c[2];
      if (k === CELL.sand || k === CELL.clay) { const s = 0.96 + 0.08 * hash(x >> 2, y >> 2); r *= s; gg *= s; b *= s; } // (a grain a metre across, faint: a cell's own speckle crawled at 480 lines; stone flat)
      else if (k === CELL.crude && !g.fire[i] && hash(x, y) > 0.83) { r += 34; gg += 24; b += 52; } // (the sheen)
      else if (g.fire[i]) { const s = 0.7 + 0.3 * hash(x + g.tick, y); gg *= s; } // (the ember's flicker, a step at a time)
      d[o] = Math.min(255, r); d[o + 1] = Math.min(255, gg); d[o + 2] = Math.min(255, b); d[o + 3] = c[3];
    }
  }

  /** The changed columns written into the texture; an upload when there is news and the last was 1 / UPLOAD real s ago. */
  update() {
    const cols = this.grid.takeChanged(this.seen);
    for (const x of cols) this._column(x);
    if (cols.length) this.pending = true;
    const now = performance.now();
    if (this.pending && now - this.last >= 1000 / UPLOAD) { this.texture.needsUpdate = true; this.pending = false; this.last = now; }
  }

  dispose() {
    this.mesh.removeFromParent();
    this.geometry.dispose(); this.material.dispose(); this.texture.dispose();
  }
}
