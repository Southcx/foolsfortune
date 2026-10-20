// ---------------------------------------------------------------------------------------
// THE RAIL FOES ON THE WORKBENCH (`crossing:foes`, the group 'the crossing' on the MODELS tab): every rail foe's body (vfx/railfoes.js)
// in a grid, each its feeling in turn, on a slab of the crossing's mid value (the shots must read on them as on the crude). Its sliders
// on the right (lil-gui, as the bracelet's stage's): the tell's k (or a demo loop: the tell rising over 3 real seconds, a blow at its
// top), the blocker's weak point revealed, the gunship's core opened, the grappler's pose; a button downs every body, and they come back.
//
// Prior art: the workbench's other stages (workbench/braceletstage.js's sliders, shipstage.js's line-up), a model sheet of a game's
// cast (the Gummi ship's enemy list, KH2's Jiminy's Journal).
//
//   railFoeStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .placed, .bodies, .P)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { railFoeBody, RAIL_FOE_ROLES } from '../vfx/railfoes.js';
import { DISPLAY_ORDER } from '../progress/weather.js';

export function railFoeStage() {
  const obj = new THREE.Group(), N = 6, STEP = 7;
  obj.userData.placed = true;
  obj.userData.view = { pos: new THREE.Vector3(0, 16, -26), look: new THREE.Vector3(0, 0, 4) };
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(N * STEP + 6, 4 * STEP + 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5c5866, roughness: 0.9 }));
  slab.position.set(0, -2.6, 4); obj.add(slab);
  const charge = new THREE.Object3D(); obj.add(charge); // (the escort's charge: the gunship's place)
  const bodies = [], extra = new THREE.Group(); obj.add(extra);
  const make = (role, i) => {
    const b = railFoeBody(role, DISPLAY_ORDER[i % DISPLAY_ORDER.length]);
    b.object.position.set(((i % N) - (N - 1) / 2) * -STEP, 0, Math.floor(i / N) * STEP - 3);
    obj.add(b.object);
    if (b.link) { extra.add(b.link.object); b.link.target = charge; b.link.radius = 3.2; }
    return b;
  };
  RAIL_FOE_ROLES.forEach((r, i) => bodies.push(make(r, i)));
  charge.position.copy(bodies[RAIL_FOE_ROLES.indexOf('gunship')].object.position);

  const P = { tell: 0, demo: true, reveal: false, core: false, pose: 'swing', down: () => { bodies.forEach((b) => b.down()); } };
  const gui = new GUI({ title: 'the rail foes' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'railFoeSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('railFoeSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'railFoeSlidersCss', textContent: 'body #railFoeSliders.lil-gui { display: block !important; }' }));
  gui.add(P, 'tell', 0, 1, 0.01).name('the tell (k)').listen();
  gui.add(P, 'demo').name('demo: the tell rising, a blow');
  gui.add(P, 'reveal').name('the blocker revealed (Flash, Bomb)');
  gui.add(P, 'core').name("the gunship's core open");
  gui.add(P, 'pose', ['swing', 'attached', 'thrown']).name("the grappler's pose");
  gui.add(P, 'down').name('down them all');

  let last = 0, beat = -1;
  obj.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    if (P.demo) { P.tell = (t % 3) / 3; const b = Math.floor(t / 3); if (b !== beat) { beat = b; bodies.forEach((x) => x.hit()); } }
    bodies.forEach((b, i) => {
      b.tell(P.tell); b.weak?.reveal(P.reveal); if (b.role === 'gunship') b.openCore(P.core); if (b.role === 'grappler') b.pose(P.pose);
      if (!b.update(dt)) { b.dispose(); bodies[i] = make(b.role, i); }
    });
  };
  obj.userData.bodies = bodies; obj.userData.P = P;
  obj.userData.dispose = () => { bodies.forEach((b) => b.dispose()); gui.destroy(); };
  return obj;
}
