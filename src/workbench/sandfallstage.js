// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S SANDFALL STAGE ('raceway:sandfall'): the Raceway's sandfall (vfx/sandfall.js) at the Raceway's own numbers, down a
// stand-in of its face: the lip at control point 18 (100 m), the foot at 19 (74 m) some 6 m further out, the landing hill beyond
// (world/raceway/track.js, Dovina's), the track 28 m wide and the sheet 38 m (her `width`: the track's plus 10). Its sliders (lil-gui, as
// the caster shaders' stages) for speed, width, curve and lean, so the owner can judge it before the Raceway drives it.
//
// Prior art: the caster shaders' stages beside it (workbench/castershaderstage.js: a look on a ground of its own, its sliders on the right).
//
//   sandfallStage(game) -> Object3D (userData.tick(t), userData.dispose(), userData.view, userData.placed, userData.sandfall)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { Sandfall, SANDFALL } from '../vfx/sandfall.js';

const RACEWAY = { width: 38, height: 28, drop: 26, run: 6 }; // (her sandfall's width and height, the face's drop and run)

/** The face in the stage's frame (+z out over the lip, the lip at y 0): the plateau, the face sloping out, the landing hill. */
function cliff() {
  const g = new THREE.Group(), sand = new THREE.MeshStandardMaterial({ color: 0xa06a48, roughness: 0.92, side: THREE.DoubleSide });
  const D = RACEWAY.drop, R = RACEWAY.run, W = 60;
  const prof = [[-30, 0.6], [-6, 0.2], [0, 0], [0.8, -2.5], [1.6, -8], [R * 0.6, -18], [R, -D], [R + 6, -D - 1.5], [R + 40, -D - 9]]; // (z, y)
  const pos = [], idx = [];
  prof.forEach(([z, y], i) => { pos.push(-W / 2, y, z, W / 2, y, z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, sand));
  // (the stand-in's sand darker than the Dunes', as the face stands in its own shade: so the sheet reads against it)
  // the track's two berms on the lip, so its width reads
  for (const x of [-14, 14]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 24), new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.9 })); b.position.set(x, 0.5, -12); g.add(b); }
  return g;
}

export function sandfallStage(game) {
  const obj = new THREE.Group(); obj.add(cliff());
  const gui = new GUI({ title: 'the Raceway\'s sandfall' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'sandfallSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('sandfallSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'sandfallSlidersCss', textContent: 'body #sandfallSliders.lil-gui { display: block !important; }' })); // (the workbench steps the HUD's panels out: these are the stage's own)
  const P = { speed: SANDFALL.speed, width: RACEWAY.width, curve: SANDFALL.curve, lean: SANDFALL.lean };
  const f = new Sandfall(game, { top: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(0, 0, 1), width: P.width, height: RACEWAY.height, curve: P.curve, lean: P.lean });
  obj.add(f.object);
  const apply = () => f.set(P);
  gui.add(P, 'speed', 0, 3, 0.05).name('speed (time\'s scale)').onChange(apply);
  gui.add(P, 'width', 6, 60, 0.5).name('width (m)').onChange(apply);
  gui.add(P, 'curve', 0, 8, 0.1).name('curve (m thrown out)').onChange(apply);
  gui.add(P, 'lean', 0, 10, 0.1).name('lean (m, the foot out)').onChange(apply);
  obj.userData.placed = true; obj.userData.bare = true; // (its own ground: the workbench's floor would cut the face)
  obj.userData.view = { pos: new THREE.Vector3(34, -6, 44), look: new THREE.Vector3(0, -13, 3) };
  obj.userData.sandfall = f; obj.userData.raceway = RACEWAY;
  let last = 0;
  obj.userData.tick = (t) => { const dt = Math.min(0.1, Math.max(0, t - last)); last = t; f.update(dt); };
  obj.userData.dispose = () => { f.dispose(); gui.destroy(); };
  return obj;
}
