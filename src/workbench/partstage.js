// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S STAGE 'crossing:parts' (the group 'the crossing' on the MODELS tab): the boss parts' read (docs/plans/RAIL-FLOW.md
// section 4, Dovina's: "a part lined in gold while it can be hit, crazing as it is hurt, gone when broken"), one part of each big
// object close up, cycling its four steps on an eight real-second loop: intact (0 .. 2), hurt 0.5 (2 .. 4), hurt 0.9 (4 .. 6), broken
// (6 .. 8), a blow landing every real second (the gold line's flash). The parts: Charybdis's eye and baleen comb (vfx/charybdis.js), a
// gill of Old Nobody's (vfx/leviathan.js), a gunport of the False Light's (vfx/brig.js), the gunship's guns (vfx/railfoes.js). Its
// camera (`userData.cam`: 'eye', 'comb', 'gill', 'gunport', 'gunship') sits before the part; `userData.pose(cam, step)` holds one step
// for a still (the contact sheet's).
//
// Prior art: workbench/bossstage.js (every part cycled through its states on a loop), a fighting game's training mode, a material's
// test ball (one swatch per step, side by side in the sheet).
//
//   partStage(game) -> Object3D   (userData.tick(t), userData.shot(camera), userData.cam, userData.pose(cam, step 0..3), userData.looks)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { CharybdisLook } from '../vfx/charybdis.js';
import { LeviathanLook } from '../vfx/leviathan.js';
import { BrigLook } from '../vfx/brig.js';
import { railFoeBody } from '../vfx/railfoes.js';

export const PART_STEPS = [{ state: 'intact', hurt: 0 }, { state: 'intact', hurt: 0.5 }, { state: 'damaged', hurt: 0.9 }, { state: 'broken', hurt: 1 }];
export const PART_CAMS = ['eye', 'comb', 'gill', 'gunport', 'gunship'];

export function partStage(game) {
  const root = new THREE.Group(); root.name = 'stage:crossing:parts'; root.userData.placed = true; root.userData.bare = true;
  root.add(new THREE.HemisphereLight(0xfff0d8, 0x140c20, 1.1));
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.6); sun.position.set(30, 60, 40); root.add(sun, sun.target);
  const back = new THREE.Mesh(new THREE.SphereGeometry(400, 16, 8), new THREE.MeshBasicMaterial({ color: 0x1a1420, side: THREE.BackSide })); root.add(back);
  const C = new CharybdisLook({ fx: game.vfx || null }); C.set({ y: 7, feel: 'grief' }); C.place(new THREE.Vector3(0, 0, 0)); root.add(C.group);
  const L = new LeviathanLook({}); L.group.position.set(120, 0, 0); root.add(L.group);
  const B = new BrigLook({}); B.group.position.set(-120, 0, 0); root.add(B.group);
  const G = railFoeBody('gunship', 'fury'); G.object.position.set(0, 0, 120); G.object.scale.setScalar(2); root.add(G.object);
  const parts = { eye: C.part('eye.0'), comb: C.part('baleen.0'), gill: L.part('gill.left.1'), gunport: B.part(`gunport.2`) };
  const at = new THREE.Vector3(), look = new THREE.Vector3(), d = new THREE.Vector3();
  let step = -1, pt = 0, held = null;
  const apply = (s) => {
    const S = PART_STEPS[s];
    for (const p of Object.values(parts)) { p.set(S.state === 'broken' ? 'broken' : 'intact'); if (S.state === 'damaged') p.set('damaged'); p.hurt(S.hurt); }
    if (S.state === 'broken') { G.down('gunL'); G.down('gunR'); }
    else { G.dispose(); Object.assign(G, railFoeBody('gunship', 'fury')); G.object.position.set(0, 0, 120); G.object.scale.setScalar(2); root.add(G.object); G.hurt('gunL', S.hurt); G.hurt('gunR', S.hurt); }
  };
  const camFor = (v) => {
    root.updateMatrixWorld(true);
    if (v === 'gunship') { G.object.localToWorld(look.set(0, 0.3, 0.5)); at.copy(look).add(d.set(3.2, 4.4, 6.5)); return; }
    const p = parts[v] || parts.eye, dist = { eye: 4.2, comb: 9, gill: 6, gunport: 2.6 }[v] || 5;
    p.world(look); d.copy(p.telegraphAnchor.userData.facing).transformDirection(p.object.matrixWorld);
    at.copy(look).addScaledVector(d, dist).add(d.set(0, v === 'comb' ? 1.5 : 0.4, 0));
  };
  const tick = (t) => {
    const dt = THREE.MathUtils.clamp(t - pt, 0, 0.1); pt = t;
    const s = held ?? Math.floor((t % 8) / 2);
    if (s !== step) { step = s; apply(s); }
    if (held == null && Math.floor(t) !== Math.floor(t - dt)) { for (const p of Object.values(parts)) p.hit(1); G.hit('gunL'); G.hit('gunR'); }
    C.update(dt); L.update(dt); B.update(dt); G.update(dt);
    camFor(root.userData.cam || 'eye');
  };
  root.userData.tick = tick;
  root.userData.shot = (cam) => { cam.position.copy(at); cam.up.set(0, 1, 0); cam.lookAt(look); cam.fov = 40; cam.updateProjectionMatrix(); };
  root.userData.pose = (cam, s) => { root.userData.cam = cam; held = s; step = -1; tick(pt + 0.05); tick(pt + 0.05); };
  root.userData.looks = { charybdis: C, oldnobody: L, falselight: B, gunship: G, parts };
  root.userData.dispose = () => { C.dispose(); L.group.parent?.remove(L.group); B.group.parent?.remove(B.group); G.dispose(); back.geometry.dispose(); back.material.dispose(); };
  return root;
}
