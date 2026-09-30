// ---------------------------------------------------------------------------------------
// MERGE: a model built from primitives (a chest: forty straps, posts, rivets and planks) is forty meshes and forty outlines, eighty
// draw calls for one prop. Its parts never move against each other, so the ones that look the same (same kind of material, same colour,
// same settings) are baked into one geometry per look, within each group that moves on its own (a chest's body and its lid). Parts that
// something holds on to (a keyhole whose colour changes, a gem that pulses: any mesh with a name, or any material marked
// `userData.noMerge`) are left as they are. The console way: a model's static parts are one draw per material, not one per part.
//
//   mergeStatic(group)             merges the group's direct mesh children, by look
//   mergeStatic(group, { deep: true })     and in every child group too (each merged within itself)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline } from '../outline.js';

const look = (m) => [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.transparent, m.opacity, m.side, m.map?.uuid,
  m.vertexColors, m.flatShading, m.blending, m.depthWrite, m.envMap?.uuid, m.envMapIntensity].join('|');

export function mergeStatic(group, { deep = false, keep = null } = {}) {
  if (deep) for (const c of group.children) if (!c.isMesh && c.children.length) mergeStatic(c, { deep, keep });
  const sets = new Map();
  for (const c of group.children) {
    if (!c.isMesh || c.isInstancedMesh || c.isSkinnedMesh || c.name || c.userData.noMerge || c.material.userData?.noMerge || keep?.has(c)) continue;
    if (c.children.some((k) => !k.userData.isOutline)) continue; // (a part with parts of its own stays)
    const outline = c.children.some((k) => k.userData.isOutline);
    const key = `${look(c.material)}|${outline}|${c.castShadow}|${c.renderOrder}`;
    if (!sets.has(key)) sets.set(key, []);
    sets.get(key).push(c);
  }
  let saved = 0;
  for (const list of sets.values()) {
    if (list.length < 2) continue;
    const src = list[0], geos = [];
    for (const c of list) {
      c.updateMatrix();
      let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && !(n === 'color' && src.material.vertexColors) && !(n === 'uv' && src.material.map)) g.deleteAttribute(n);
      g.applyMatrix4(c.matrix);
      geos.push(g);
    }
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const m = new THREE.Mesh(merged, src.material);
    m.castShadow = src.castShadow; m.receiveShadow = src.receiveShadow; m.renderOrder = src.renderOrder;
    if (src.children.some((k) => k.userData.isOutline)) addOutline(m, src.children.find((k) => k.userData.isOutline).material);
    for (const c of list) group.remove(c);
    group.add(m);
    saved += list.length - 1;
  }
  return saved;
}
