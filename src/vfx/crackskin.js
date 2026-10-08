// ---------------------------------------------------------------------------------------
// CRACKS ON A SKINNED BODY: crack ribbons (world/props/potcracks.js ribbonGeometry) that ride a body its clips move, the Pneuka Jar
// squashing, hopping and drooping (godhand/pneukajarclips.js). A crack point is read off the face a ray struck: its place and its
// normal in the body's bind pose, and its skin weights, each blended from the face's three corners by where in the face it fell (the
// four heaviest kept). The ribbon is then a SkinnedMesh bound to the body's own skeleton, so it bends with the clay: measured, under
// a centimetre off the posed surface in every clip, where a rigid ribbon drifted up to 25 cm at the top of a hop (jar.md, section E).
//
// Prior art: decals projected onto a skinned character and skinned with the weights under them (Unreal's skeletal mesh decals, the
// "decal on a skinned mesh" trick of copying the nearest triangle's weights), and the outline shell bound the same way here
// (render/outline.js addOutline).
//
//   const pt = crackPointOn(body, hit)   (null if the hit has no face)   -> { p, n, si, sw } in the body's bind space
//   const m = crackRibbon(body, paths, width, material)   (added beside the body; dispose its geometry when rebuilt)
//   const park = crackPrewarm(scene, body)   ... compile ...   park()   (the skinned crack and gold seam compiled with the rest)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ribbonGeometry, crackMat, goldMat } from '../world/props/potcracks.js';

const _a = new THREE.Vector3(), _w = new Map();

/** A crack point where `hit` (a raycast intersection on `body`) struck: bind-space place lifted `lift` along its normal, and its skin. */
export function crackPointOn(body, hit, lift = 0.003) {
  if (!hit?.face) return null;
  const G = body.geometry, P = G.attributes.position, N = G.attributes.normal, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
  const { a, b, c } = hit.face, k = hit.barycoord || new THREE.Vector3(1 / 3, 1 / 3, 1 / 3);
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  _w.clear();
  for (const [vi, wk] of [[a, k.x], [b, k.y], [c, k.z]]) {
    p.addScaledVector(_a.fromBufferAttribute(P, vi), wk);
    if (N) n.addScaledVector(_a.fromBufferAttribute(N, vi), wk);
    if (SW) for (let j = 0; j < 4; j++) { const w = SW.getComponent(vi, j); if (w > 0) { const bi = SI.getComponent(vi, j); _w.set(bi, (_w.get(bi) || 0) + w * wk); } }
  }
  if (n.lengthSq() < 1e-8) n.copy(hit.face.normal); n.normalize();
  const top = [..._w].sort((x, y) => y[1] - x[1]).slice(0, 4), sum = top.reduce((s, x) => s + x[1], 0) || 1;
  const si = [0, 0, 0, 0], sw = [0, 0, 0, 0];
  top.forEach(([bi, w], j) => { si[j] = bi; sw[j] = w / sum; });
  return { p: p.addScaledVector(n, lift), n, si, sw };
}

/** The ribbon of `paths` (points from crackPointOn) bound to `body`'s skeleton, beside it in its parent; a plain mesh on an unskinned body. */
export function crackRibbon(body, paths, width, material) {
  const g = ribbonGeometry(paths, width);
  let m;
  if (body.isSkinnedMesh) {
    // (ribbonGeometry lays 6 vertices a segment from points i, i, i+1, i, i+1, i+1: each takes its point's skin)
    const si = [], sw = [], of = [0, 0, 1, 0, 1, 1];
    for (const path of paths) for (let i = 0; i < path.length - 1; i++) for (const k of of) { const q = path[i + k]; si.push(...q.si); sw.push(...q.sw); }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    m = new THREE.SkinnedMesh(g, material);
    m.bind(body.skeleton, body.bindMatrix); m.bindMode = body.bindMode;
    m.position.copy(body.position); m.quaternion.copy(body.quaternion); m.scale.copy(body.scale);
    body.parent.add(m);
  } else { m = new THREE.Mesh(g, material); body.add(m); }
  m.frustumCulled = false; m.castShadow = false; m.name = 'crack';
  return m;
}

/** A dark crack and a gold seam on `body`'s skeleton, shown in the scene for the shader warm-up (a first blow must not compile them); the
 *  returned function takes them away again (their programs stay with their materials, which live on). */
export function crackPrewarm(scene, body) {
  if (!body?.isSkinnedMesh) return () => {};
  const P = body.geometry.attributes.position, pt = (i) => ({ p: new THREE.Vector3().fromBufferAttribute(P, i), n: new THREE.Vector3(0, 0, 1), si: [0, 0, 0, 0], sw: [1, 0, 0, 0] });
  const path = [pt(0), pt(1), pt(2)];
  const ms = [crackMat, goldMat].map((mat) => { const m = crackRibbon(body, [path], 0.02, mat); m.removeFromParent(); m.position.set(0, -50, 0); m.userData.zoneFree = true; scene.add(m); return m; });
  return () => { for (const m of ms) { m.removeFromParent(); m.geometry.dispose(); } };
}
