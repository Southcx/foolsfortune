// ---------------------------------------------------------------------------------------
// PRESENTATION: how the picture is made, in the manner of the sixth-generation consoles the game borrows its look from.
//
//  - RESOLUTION. The PS2 drew most games at 640x448 (interlaced) and the television smoothed it; the GameCube at 640x480. The scene is
//    drawn at a fixed number of lines (480 by default) whatever the window, and the browser scales the picture up to the window with a
//    bilinear filter: soft, cheap, and the size of the window no longer decides the cost of a frame. The interface (the log, the HUD)
//    is HTML over it and stays sharp, as a console's text overlays did on an upscaled frame. 'pixel' scales with nearest-neighbour
//    instead, for the crisper look of an emulator at integer scale.
//  - SHADING. Smooth (Gouraud) shading, as the hardware of the era did it: every flat-shaded material is drawn smooth, and a procedural
//    mesh built as separate triangles (a pot, a shard) gets smooth normals across its soft curves and keeps its hard edges (a crease
//    angle, the way a modelling tool's "auto smooth" does it). Flat shading is still one switch away.
//  - SHADOWS. One sun shadow map at a modest size (1024), filtered but not softened: a console's single shadow, not a PC's.
//
//   T.visual.resolution: 'ps2' (480 lines) | '540' | '720' | 'native'      T.visual.upscale: 'bilinear' | 'pixel'
//   T.visual.smooth: true | false        T.visual.shadowRes: 512 | 1024 | 2048
//   const p = new Presentation(game, { renderer, sun });   p.apply()   (on start, on resize, when a setting changes)   p.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';
import { weld } from './weld.js';

export const RESOLUTIONS = { ps2: 480, 540: 540, 720: 720, native: 0 };
const CREASE = Math.cos(THREE.MathUtils.degToRad(50));
const WALK = 600; // (objects shaded a frame by the once-a-second pass: about ten frames for the whole scene)

/** Smooth normals for a triangle-soup geometry, in place: each vertex averages the faces at its position within the crease angle. */
export function creaseNormals(geo, smooth) {
  const pos = geo.attributes.position, n = geo.attributes.normal;
  if (!pos || !n || geo.index || pos.count % 3) return;
  const cnt = pos.count, fn = new Float32Array(cnt * 3); // (the face normal of each vertex's triangle)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < cnt; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    b.sub(a); c.sub(a); b.cross(c).normalize();
    for (let k = 0; k < 3; k++) { fn[(i + k) * 3] = b.x; fn[(i + k) * 3 + 1] = b.y; fn[(i + k) * 3 + 2] = b.z; }
  }
  if (!smooth) { n.array.set(fn); n.needsUpdate = true; return; }
  const { rep, start, list } = weld(pos); // (vertices at one place: render/weld.js)
  const out = n.array;
  for (let i = 0; i < cnt; i++) {
    const r = rep[i], ix = fn[i * 3], iy = fn[i * 3 + 1], iz = fn[i * 3 + 2];
    let x = 0, y = 0, z = 0;
    for (let k = start[r], e = start[r + 1]; k < e; k++) {
      const j = list[k] * 3, jx = fn[j], jy = fn[j + 1], jz = fn[j + 2];
      if (ix * jx + iy * jy + iz * jz >= CREASE) { x += jx; y += jy; z += jz; }
    }
    const l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
  }
  n.needsUpdate = true;
}

export class Presentation {
  constructor(game, { renderer, sun }) {
    this.game = game; this.renderer = renderer; this.sun = sun;
    this.mats = new WeakSet(); this.geos = new WeakMap();
    this.scanT = 0;
    addEventListener('resize', () => this.apply());
  }

  /** The render size, the upscale filter, the shadow map, and the shading of everything in the scene. */
  apply() {
    const r = this.renderer, V = T.visual;
    const lines = RESOLUTIONS[V.resolution] ?? 480;
    const dpr = Math.min(devicePixelRatio, 2);
    const ratio = lines ? Math.min(dpr, lines / innerHeight) : dpr;
    r.setPixelRatio(ratio);
    r.setSize(innerWidth, innerHeight);
    r.domElement.style.imageRendering = V.upscale === 'pixel' ? 'pixelated' : 'auto';
    if (this.game.fx) this.game.fx.pixelRatio = ratio;
    const sr = V.shadowRes || 1024, sh = this.sun.shadow;
    if (sh.mapSize.x !== sr) { sh.mapSize.set(sr, sr); sh.map?.dispose(); sh.map = null; }
    this.shade(true);
  }

  /** Smooth or flat, for every material that was built flat and every triangle-soup geometry drawn with one. */
  shade(all = false) {
    const smooth = T.visual.smooth !== false;
    this.game.scene.traverse((o) => this.shadeOne(o, all, smooth));
  }

  /** One object made smooth or flat to match (shade()'s body, also walked a slice a frame by update()). */
  shadeOne(o, all, smooth) {
    {
      if (!o.isMesh || o.userData.isOutline) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      let faceted = false;
      for (const m of mats) {
        if (!this.mats.has(m)) { this.mats.add(m); if (m.flatShading) m.userData.faceted = true; }
        if (!m.userData.faceted) continue;
        faceted = true;
        if (m.flatShading === smooth) { m.flatShading = !smooth; m.needsUpdate = true; }
      }
      const g = o.geometry;
      if (faceted && g && !g.index && !o.isInstancedMesh && !o.isBatchedMesh && (all || this.geos.get(g) !== smooth)) {
        if (this.geos.get(g) !== smooth) { creaseNormals(g, smooth); this.geos.set(g, smooth); }
      }
    }
  }

  /** New things arrive (a pot respawns, a shard falls): a quiet pass once a second shades them to match, walked WALK objects a frame
   *  (the whole scene, 5,000 objects, in one frame was 2 to 3 ms headless and, with the light budget's scan on the same frame, the
   *  periodic spike the owner's Firefox showed at 18 to 43 ms: R4 and R5's diagnostics, v132). */
  update(dt) {
    if (!this.walk) { this.scanT -= dt; if (this.scanT > 0) return; this.scanT = 1; this.walk = [this.game.scene]; }
    const smooth = T.visual.smooth !== false;
    for (let n = 0; n < WALK && this.walk.length; n++) { const o = this.walk.pop(); this.shadeOne(o, false, smooth); for (const c of o.children) this.walk.push(c); }
    if (!this.walk.length) this.walk = null;
  }
}
