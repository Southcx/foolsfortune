// ---------------------------------------------------------------------------------------
// THE DEBUG CHEST'S LOOK (docs/plans/DEBUG-CHESTS.md; the debug chest itself, `DebugChest` and `DEBUG_KITS`, is Petra's system in
// src/debug/): a plain crate wearing the missing-texture checker, magenta and black, the one pattern every player reads as "this is not
// the game". It borrows nothing the world uses: no glaze, no chest tier, no kiln pattern, no outline colour of the folk's. Unlit, so it
// reads the same by day, by night and in a Well; still a world mark (no words, no numbers on it).
//
//   the CRATE   a box 0.9 x 0.55 x 0.6 m standing on its origin, its lid a separate slab so the top seam reads as a lid
//   the CHECK   eight squares to a metre, magenta (0xff00ff) and black, square on every face whatever its size (box-mapped by metres),
//               nearest up close and mipmapped down to a dark magenta far off (no crawl)
//   bump()      the lid hops once (0.35 s), for each F that tops it up
//
// Prior art: the Source engine's missing-texture checker (Valve: the magenta-and-black of every unloaded material), the dev-room crates
// and QASmoke chests of studio test builds (Bethesda, Nintendo's debug rooms), and Unity's and Unreal's own pink "missing" materials.
//
//   const C = debugChestModel()   scene.add(C.group)   C.bump()   C.update(dt)   C.dispose()   (+Z its front; 0.6 m tall with the lid)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../render/outline.js';

const SIZE = { w: 0.9, h: 0.47, d: 0.6, lid: 0.08 };
const PER_M = 8; // (checker squares to a metre)
let tex = null;

/** The checker: one 2 x 2 tile, repeated by the geometry's metre UVs; nearest up close, mipmapped far (it averages to dark magenta). */
function checker() {
  if (tex) return tex;
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#000000'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#ff00ff'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8);
  tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace; tex.name = 'debug-chest-checker';
  return tex;
}

/** A box whose UVs are its faces' sizes in metres over two squares (one tile of the checker is two squares), so every face is square. */
function meteredBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, n = g.attributes.normal, s = PER_M / 2;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [fw, fh] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * fw * s, uv.getY(i) * fh * s);
  }
  return g;
}

export function debugChestModel() {
  const mat = new THREE.MeshBasicMaterial({ map: checker(), name: 'debug-chest', fog: false });
  const group = new THREE.Group(); group.name = 'debug-chest';
  const body = new THREE.Mesh(meteredBox(SIZE.w, SIZE.h, SIZE.d), mat); body.position.y = SIZE.h / 2;
  const lid = new THREE.Mesh(meteredBox(SIZE.w + 0.03, SIZE.lid, SIZE.d + 0.03), mat);
  const hinge = new THREE.Group(); hinge.position.set(0, SIZE.h, -SIZE.d / 2 - 0.015); lid.position.set(0, SIZE.lid / 2, SIZE.d / 2 + 0.015);
  hinge.add(lid); group.add(body, hinge);
  for (const m of [body, lid]) { m.castShadow = false; m.receiveShadow = false; addOutline(m); } // (no shadow: a debug chest needs none, and its depth program would compile in play)
  let t = 1;
  return {
    group,
    bump() { t = 0; },
    update(dt) {
      if (t >= 1) return;
      t = Math.min(1, t + dt / 0.35);
      hinge.rotation.x = -Math.sin(Math.PI * t) * 0.45; // (the lid lifts and drops once)
    },
    dispose() { body.geometry.dispose(); lid.geometry.dispose(); mat.dispose(); group.removeFromParent(); },
  };
}
