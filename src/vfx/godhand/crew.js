// ---------------------------------------------------------------------------------------
// THE MUSTER'S CREW (Possession's Muster, godhand/powers/will.js; the owner's "hatched clapperjars", GODHAND.md section 8): the workers drawn
// as clapperjars, the folk's lowest tier, hatched out of the ground where the drag began. Each is the owner's clapperjar itself (the
// gltf the Clappers keep, cloned with SkeletonUtils: CASEBOOK rule 6) in the clapperjars' own tinted clay (the Clappers' material, so no
// new program), running on its own sprint clip, rising out of the split clay one after another (a hatch mark at the source, Jun ware's
// blue), carrying a lump of the matter it took over its head (the firm or loose layer's colour, or its Lachryma's feeling), facing the
// way it goes. A worker with no clapperjar to copy (the Clappers not loaded) is a clay cylinder, as it was.
//
// Prior art: Pikmin's carriers (a crew walking a load home, bobbing under it), Godus's and Populous's walkers, Black & White's villagers
// at their work, and the clapperjars themselves (creatures/clappers.js: the same body, the same clip, the same clay).
//
//   const C = musterCrew(game, n, from, to, colour)   C.at(i, pos, heading, carry, dt)   C.update(dt)   C.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { T } from '../../core/config.js';
import { COLOR } from '../../progress/weather.js';
import { groundOf } from '../../godhand/matter.js';
import { circleMark } from './marks.js';

const HATCH = { every: 0.18, rise: 0.4, depth: 0.7 }; // (real seconds between workers coming up; how long one takes to rise; from how deep)
let LUMP = null;

export function musterCrew(game, n, from, to, colour) {
  const K = game.clappers, src = K?.gltf?.scene, clip = K?.clips?.sprint;
  const group = new THREE.Group(); group.name = 'godhand-muster';
  const hatch = circleMark(game, from, 1.8, colour, { style: 'hatch', opacity: 0.75 }), goal = circleMark(game, to, 1.6, colour, { opacity: 0.6 });
  group.add(hatch, goal);
  const firm = groundOf().firm.colour;
  const fallback = !src ? { geo: new THREE.CylinderGeometry(0.22, 0.3, 0.7, 7), mat: new THREE.MeshStandardMaterial({ color: 0xb06a44, roughness: 0.9 }) } : null;
  LUMP ||= new THREE.IcosahedronGeometry(0.16, 0);
  const crew = Array.from({ length: n }, (_, i) => {
    const root = new THREE.Group(); let mixer = null;
    if (src) {
      const model = cloneSkinned(src);
      model.traverse((o) => { if (o.isMesh) { if (!/eye/i.test(o.name)) o.material = K.mat; o.castShadow = true; o.frustumCulled = false; } });
      root.add(model); root.scale.setScalar(T.clappers.scale);
      if (clip) { mixer = new THREE.AnimationMixer(model); const a = mixer.clipAction(clip); a.timeScale = 1.1 + 0.15 * (i % 3); a.time = i * 0.13; a.play(); }
    } else { const m = new THREE.Mesh(fallback.geo, fallback.mat); m.position.y = 0.35; root.add(m); }
    const lumpMat = new THREE.MeshStandardMaterial({ color: firm, roughness: 0.9, flatShading: false });
    const lump = new THREE.Mesh(LUMP, lumpMat); lump.position.y = src ? 0.86 / T.clappers.scale : 0.9; lump.visible = false; root.add(lump);
    root.visible = false; group.add(root);
    return { root, mixer, lump, born: i * HATCH.every, seen: false };
  });
  game.scene.add(group);
  let t = 0;
  return {
    /** Worker i stands at pos, facing heading (radians), carrying `carry` ({ firm, loose, water, feeling } or null). */
    at(i, pos, heading, carry) {
      const w = crew[i]; if (!w) return;
      const up = Math.min(1, Math.max(0, (t - w.born) / HATCH.rise)), rise = 1 - (1 - up) * (1 - up);
      w.root.visible = t >= w.born;
      w.root.position.set(pos.x, pos.y - HATCH.depth * (1 - rise), pos.z);
      w.root.rotation.y = heading;
      w.lump.visible = !!carry;
      if (carry) w.lump.material.color.setHex(carry.water > carry.firm + carry.loose ? COLOR[carry.feeling] ?? 0x7fd0e0 : carry.loose > carry.firm ? groundOf().loose.colour : firm);
    },
    update(dt) {
      t += dt;
      for (const w of crew) w.mixer?.update(dt);
      hatch.material.opacity = 0.75 * Math.max(0.35, 1 - Math.max(0, t - n * HATCH.every) * 0.2);
    },
    dispose() {
      for (const w of crew) { w.mixer?.stopAllAction(); w.lump.material.dispose(); }
      group.parent?.remove(group);
      hatch.geometry.dispose(); hatch.material.dispose(); goal.geometry.dispose(); goal.material.dispose();
      if (fallback) { fallback.geo.dispose(); fallback.mat.dispose(); } // (the clapperjars' geometry and clay are the Clappers': never disposed here)
    },
  };
}
