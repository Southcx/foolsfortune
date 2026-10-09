// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S LACHRYMA STAGE: the oxidation ramp seen whole (vfx/oxidation.js). A row of baubles at the ramp's steps (fresh cream to
// crude), a row of slicks held along their own life (fresh and black, thinned to the film's bands, the sheen, nearly gone), and one slick
// spilled, oxidising and soaking away on a loop, on a patch of sand. The feats' shock is the library's `shock` (the EFFECTS tab).
// Prior art: a colour script's strip (Pixar's: the whole film's colour in one row), a contact sheet.
//
//   lachrymaStage('lachryma:ramp') -> Object3D (its loop on userData.tick(t))
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Slicks } from '../vfx/slicks.js';
import { oxidationMaterial } from '../vfx/oxidation.js';

export const LACHRYMA_STAGE_IDS = ['lachryma:ramp'];

export function lachrymaStage() {
  const obj = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: 0xc9a473, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; obj.add(sand);
  // the bauble at seven steps of the ramp, fresh to crude
  const geo = new THREE.IcosahedronGeometry(0.22, 2);
  for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(geo, oxidationMaterial(i / 6)); m.position.set(-4.2 + i * 1.4, 0.22, -2.6); obj.add(m); }
  // slicks held along their life, and one on a loop
  const S = new Slicks({ scene: obj, physics: null, paintmap: null, player: null }, { max: 8 });
  const held = [0, 0.3, 0.55, 0.8, 0.94].map((u, i) => [S.spill(new THREE.Vector3(-4.8 + i * 2.4, 0, -0.4), 0.95, 10, { seed: 0.21 + i * 0.17 }), u]);
  let live = null, pt = 0;
  const LOOP = 12;
  obj.userData.tick = (t) => {
    const raw = Math.max(0, t - pt); pt = t;
    if (!live || !S.list.includes(live)) live = S.spill(new THREE.Vector3(0, 0, 2.2), 1.6, LOOP - 1, { seed: (t * 0.37) % 1 });
    for (const [s, u] of held) s.age = u * s.life;
    S.update(raw);
  };
  return obj;
}
