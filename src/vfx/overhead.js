// ---------------------------------------------------------------------------------------
// OVERHEAD: what stands over each spot round the eye, as a small map of heights: the topmost thing a ray from high above meets (a
// roof, an awning, a tree's collider, the ground). Whatever falls from the sky asks it, and is never drawn under a roof, through a
// wall's top or below the ground (the owner, R46: the weather's "interesting clipping effects"). It is one float texture of N by N
// cells round the eye, world-anchored (a cell's texel is its world cell mod N, and it remembers which cell it holds, so the map never
// swims as the eye moves), refreshed a few rays a frame, nearest cells first.
//
// Prior art: the rain occlusion map of the seventh generation (Assassin's Creed's and Unreal's "rain occlusion": a top-down depth of
// the scene round the camera, that the rain tests against), done here with the physics' rays instead of a second render, which keeps
// it to a few dozen rays a frame and no draw calls.
//
//   const O = new Overhead(game, { n, cell })   O.update(cameraPos, raysPerFrame)   O.u (uniforms: uOcc, uOccK)   OVERHEAD_GLSL
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { G, groups } from '../core/physics.js';

const OPEN = -1e4; // (nothing over this spot: open to the sky all the way down)
const ONLY_STATIC = groups(0xffff, G.STATIC); // (the level: roofs, walls, the ground; never the Courier, a pot or a creature)
const _o = { x: 0, y: 0, z: 0 }, _d = { x: 0, y: -1, z: 0 };

/** The shader's side: overheadY(world xz) -> the height of the topmost thing over it (OPEN if unknown or nothing). */
export const OVERHEAD_GLSL = /* glsl */`
uniform sampler2D uOcc; uniform vec2 uOccK; // (the map; its cell size in metres, its size in cells)
float overheadY(vec2 xz) {
  vec2 c = floor(xz / uOccK.x);
  vec4 o = texture2D(uOcc, (mod(c, uOccK.y) + 0.5) / uOccK.y);
  return (o.g == c.x && o.b == c.y) ? o.r : ${OPEN.toFixed(1)}; // (a texel holding another cell is not known here: open)
}`;

export class Overhead {
  constructor(game, { n = 32, cell = 1.75 } = {}) {
    this.game = game; this.n = n; this.cell = cell;
    this.data = new Float32Array(n * n * 4).fill(1e9); // (cell ids no world cell has: all unknown)
    this.tex = new THREE.DataTexture(this.data, n, n, THREE.RGBAFormat, THREE.FloatType);
    this.tex.minFilter = this.tex.magFilter = THREE.NearestFilter; this.tex.needsUpdate = true;
    this.u = { uOcc: { value: this.tex }, uOccK: { value: new THREE.Vector2(cell, n) } };
    // the order a refresh visits the cells round the eye: nearest first
    const half = n / 2, order = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) order.push([i - half, j - half]);
    order.sort((a, b) => a[0] * a[0] + a[1] * a[1] - (b[0] * b[0] + b[1] * b[1]));
    this.order = order; this.k = 0;
    this.pred = (c) => !c.isSensor();
  }

  /** A few more cells measured (from high over the eye down to well below it). */
  update(pos, rays = 48) {
    const P = this.game.physics; if (!P?.raycast) return;
    const cx = Math.floor(pos.x / this.cell), cz = Math.floor(pos.z / this.cell), n = this.n, top = pos.y + 40;
    for (let r = 0; r < rays; r++) {
      const [di, dj] = this.order[this.k]; this.k = (this.k + 1) % this.order.length;
      const x = cx + di, z = cz + dj;
      _o.x = (x + 0.5) * this.cell; _o.y = top; _o.z = (z + 0.5) * this.cell;
      const hit = P.raycast(_o, _d, 120, undefined, ONLY_STATIC, this.pred);
      const t = ((((z % n) + n) % n) * n + (((x % n) + n) % n)) * 4;
      this.data[t] = hit ? hit.point.y : OPEN; this.data[t + 1] = x; this.data[t + 2] = z;
    }
    this.tex.needsUpdate = true;
  }

  dispose() { this.tex.dispose(); }
}
