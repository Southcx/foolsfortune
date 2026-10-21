// ---------------------------------------------------------------------------------------
// THE HAZARDS ON THE WORKBENCH (`crossing:hazards`, the group 'the crossing' on the MODELS tab): a hazard's look (vfx/railhazards.js)
// in the chase view's frame on a slab of the crude's dark: a pillar in the left lane, an arch in the middle threaded (its gold flash,
// then dim: passed), an arch in the right lane left lit, and a gate across the frame with its gap in the right lane, struck (its crack,
// its chips, its glass crazing). On a 6 real second loop, rising out of the crude at its start; its sliders hold the loop or fire each.
// The stage owns its rail (the crossing's x mirrored, as stage.js's toWorld) and its voxel batch (the crossing's is in the world's scene).
//
// Prior art: the workbench's other stages (workbench/railfoestage.js's registration and sliders, voxelswarmstage.js's own batch), Star
// Fox 64's Corneria as the brief's picture (a pillar, an arch, a gate in the lane).
//
//   railHazardStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .placed, .bare, .P { loop, through(), hit(), reset() }, .look)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { RailHazards } from '../vfx/railhazards.js';
import { VoxelBatch } from '../vfx/voxels/voxelbatch.js';

const LOOP = 6;

export function railHazardStage(game) {
  const obj = new THREE.Group();
  obj.userData.placed = true; obj.userData.bare = true;
  obj.userData.view = { pos: new THREE.Vector3(0, 7, -16), look: new THREE.Vector3(0, 3, 30) };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(160, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x15111c, roughness: 0.35, metalness: 0.2 }));
  sea.position.set(0, -0.02, 40); obj.add(sea);
  const sun = new THREE.DirectionalLight(0xffe8d2, 2.2); sun.position.set(-6, 14, -4); obj.add(sun, sun.target, new THREE.HemisphereLight(0x8fa0c8, 0x2a1a22, 1.6));
  const ship = { local: new THREE.Vector3(-3, 4, 0) }; // (where the gate is struck: the ship's place in the frame)
  const stage = {
    sea: { y: 0 }, ship,
    rail: { toWorld: (l, out) => out.set(-l.x, l.y, l.z), dirWorld: (v, out) => out.set(-v.x, v.y, v.z) }, // (stage.js's, at no turn)
  };
  const batch = new VoxelBatch(game).build(obj);
  const H = new RailHazards(game, stage, { global: false, voxels: batch }).build(obj);
  let pillar, through, lit, gate;
  const reset = () => {
    H.clear();
    pillar = H.place({ kind: 'pillar', id: 'pillar', local: new THREE.Vector3(-8, 0, 28), lane: -1 });
    through = H.place({ kind: 'arch', id: 'arch.through', local: new THREE.Vector3(0, 0, 36), lane: 0 });
    lit = H.place({ kind: 'arch', id: 'arch.lit', local: new THREE.Vector3(8, 0, 22), lane: 1 });
    gate = H.place({ kind: 'gate', id: 'gate', local: new THREE.Vector3(0, 0, 54), lane: 1 });
  };
  const P = { loop: true, reset, through: () => through?.pass('through'), hit: () => { gate?.pass('hit'); pillar?.pass('hit', new THREE.Vector3(-8, 5, 28 - 1.2)); } };
  const gui = new GUI({ title: 'the hazards' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'railHazardSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('railHazardSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'railHazardSlidersCss', textContent: 'body #railHazardSliders.lil-gui { display: block !important; }' }));
  gui.add(P, 'loop').name('loop (6 s)');
  gui.add(P, 'reset').name('rise again');
  gui.add(P, 'through').name('the middle arch threaded');
  gui.add(P, 'hit').name('the gate and the pillar struck');
  reset();

  let last = 0, cycle = 0, fired = 0;
  obj.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    if (P.loop) {
      const c = Math.floor(t / LOOP), u = t - c * LOOP;
      if (c !== cycle) { cycle = c; fired = 0; reset(); }
      if (fired < 1 && u >= 2.2) { fired = 1; P.through(); }
      if (fired < 2 && u >= 3.0) { fired = 2; gate.pass('hit'); }
      if (fired < 3 && u >= 3.6) { fired = 3; pillar.pass('hit', new THREE.Vector3(-8, 5, 28 - 1.2)); }
    }
    H.update(dt); batch.update(dt);
  };
  obj.userData.P = P; obj.userData.look = H; obj.userData.live = () => ({ through: through?.lit, lit: lit?.lit });
  obj.userData.dispose = () => { H.dispose(); batch.dispose?.(); gui.destroy(); };
  return obj;
}
