// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S BRACELET STAGE (working name, Espada's and the owner's to rule; docs/plans/BRACELET.md): the one ring (vfx/bracelet.js)
// on the Vessoul's three forms side by side, worn where the game wears it (vfx/braceletwear.js WEAR): the god hand's wrist, the Pneuka
// Jar's neck, the Courier's left wrist; and in front, two loose rings for reference, every socket closed and every socket open with a
// charm in each. Its sliders on the right (lil-gui, as the tuning panel is): the glow's spend, domain and Dissonance Level, each socket
// open or closed, a charm set in a socket, and the charm's flash; a demo loop drives the glow as the hand's acts would.
//
// Prior art: the caster shader stages beside it (workbench/castershaderstage.js), Unreal's material instance editor (a preview with its
// parameters beside it), a jeweller's tray (the same ring on a hand, a neck, a wrist).
//
//   braceletStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .placed, .bracelets { hand, jar, courier, closed, open }, .P, .apply())
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import handB64 from '../assets/godhand.glb?b64';
import jarB64 from '../assets/pneuka.glb?b64';
import { Bracelet, SOCKETS } from '../vfx/bracelet.js';
import { CHARM_IDS } from '../vfx/braceletcharms.js';
import { wearBracelet } from '../vfx/braceletwear.js';
import { godHandPainting, pneukaJarPainting } from '../vfx/vessoulpaint.js';
import { base64Buffer } from '../core/base64.js';

const bytes = base64Buffer; // (one loop, not a callback a byte: core/base64.js)

export function braceletStage(game) {
  const obj = new THREE.Group(), B = {}, loader = new GLTFLoader();
  obj.userData.placed = true;
  obj.userData.view = { pos: new THREE.Vector3(0, 1.5, 3.6), look: new THREE.Vector3(0, 0.8, 0) };
  const P = { spend: 0.4, domain: 'psychokinesis', dissonance: 0, demo: false, socket: 'psychokinesis', charmId: 'TWIN', ...Object.fromEntries(SOCKETS.map((d) => [d, true])) };
  const worn = () => [B.hand, B.jar, B.courier].filter(Boolean);
  const apply = () => { for (const b of worn()) { b.glow({ spend: P.spend, domain: P.domain, dissonance: P.dissonance }); b.setSockets(Object.fromEntries(SOCKETS.map((d) => [d, P[d]]))); } };

  // the god hand, upright, its wrist at 0.55 m
  loader.parseAsync(bytes(handB64), '').then((gl) => {
    const m = gl.scene, mat = godHandPainting(); m.traverse((o) => { if (o.isMesh) { o.material = mat; o.frustumCulled = false; } });
    m.scale.setScalar(0.8); m.position.set(-1.1, 0.55, 0); obj.add(m); m.updateMatrixWorld(true);
    B.hand = wearBracelet(game, 'hand', m.getObjectByName('handR')); apply(); seed(B.hand);
  }).catch((e) => console.warn('bracelet stage: the hand', e));
  // the Pneuka Jar, on the floor
  loader.parseAsync(bytes(jarB64), '').then((gl) => {
    const m = gl.scene, mat = pneukaJarPainting(), core = new THREE.MeshStandardMaterial({ color: 0xf2e6d0, roughness: 0.4, emissive: 0xffc070, emissiveIntensity: 0.6 });
    m.traverse((o) => { if (o.isMesh) { o.material = o.material?.name === 'CourierEnergy' ? core : mat; o.frustumCulled = false; } });
    m.position.set(0, 0, 0); obj.add(m); m.updateMatrixWorld(true);
    B.jar = wearBracelet(game, 'jar', m.getObjectByName('chest')); apply(); seed(B.jar);
  }).catch((e) => console.warn('bracelet stage: the jar', e));
  // the Courier: a copy of the body as it stands now, its live bracelet left off, its left wrist near 1.2 m to the right
  const C = game.character?.model;
  if (C) {
    const m = SkeletonUtils.clone(C);
    const strip = []; m.traverse((o) => { if (/^Bracelet\./.test(o.name)) strip.push(o); }); strip.forEach((o) => o.removeFromParent());
    m.traverse((o) => { o.frustumCulled = false; });
    const holder = new THREE.Group(); holder.add(m); holder.position.set(1.3, 0, 0); holder.rotation.y = -0.4; obj.add(holder); holder.updateMatrixWorld(true);
    B.courier = wearBracelet(game, 'courier', m.getObjectByName('handL'));
    B.courierBody = holder;
  }
  // the two loose rings in front, lying on a little stand: every socket closed / every socket open, a charm in each
  const loose = (x, open) => {
    const b = new Bracelet(game, { form: 'hand' }); const stand = new THREE.Group(); stand.position.set(x, 0.32, 0.9); stand.rotation.x = 0.9; obj.add(stand);
    b.attach(stand, new THREE.Vector3(), 0.2);
    if (open) { b.showAll(); b.flashMesh.visible = false; b.glow({ spend: 0.35, domain: 'divination' }); }
    return b;
  };
  const charms = { ouranurgy: 'TWIN', psychokinesis: 'WIDE', alteration: 'ECHO', manifestation: 'GENTLE' };
  function seed(b) { for (const [s, id] of Object.entries(charms)) b.setCharm(s, id); }
  B.closed = loose(-0.3, false); B.open = loose(0.3, true);
  if (B.courier) seed(B.courier);
  apply();

  // the sliders
  const gui = new GUI({ title: 'the bracelet' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'braceletSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('braceletSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'braceletSlidersCss', textContent: 'body #braceletSliders.lil-gui { display: block !important; }' })); // (the workbench steps the HUD's panels out: these are the stage's own)
  const g1 = gui.addFolder('the glow');
  g1.add(P, 'spend', 0, 1, 0.01).name('spend (share of the pool)').listen().onChange(apply);
  g1.add(P, 'domain', SOCKETS).name('domain in use').listen().onChange(apply);
  g1.add(P, 'dissonance', 0, 5, 1).name('Dissonance Level').listen().onChange(apply);
  g1.add(P, 'demo').name('demo: the hand at work');
  const g2 = gui.addFolder('the sockets (open at level 30)');
  for (const d of SOCKETS) g2.add(P, d).onChange(apply);
  g2.add({ all: () => { SOCKETS.forEach((d) => { P[d] = true; }); g2.controllers.forEach((c) => c.updateDisplay()); apply(); } }, 'all').name('all open');
  g2.add({ none: () => { SOCKETS.forEach((d) => { P[d] = false; }); g2.controllers.forEach((c) => c.updateDisplay()); apply(); } }, 'none').name('all closed');
  const g3 = gui.addFolder('the charms');
  g3.add(P, 'socket', SOCKETS);
  g3.add(P, 'charmId', ['none', ...CHARM_IDS]).name('charm');
  g3.add({ set: () => { const id = P.charmId === 'none' ? null : P.charmId; charms[P.socket] = id; for (const b of worn()) b.setCharm(P.socket, id); } }, 'set').name('set it in the socket');
  g3.add({ flash: () => { for (const b of [...worn(), B.open]) b.charm(charms[P.socket] || P.charmId); } }, 'flash').name('the charm triggers (flash)');

  let last = 0, demoT = 0, beat = 0;
  obj.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    if (P.demo) { // (the hand at work: a power every 1.4 real s in turn, a charm now and then, the Dissonance Level climbing)
      demoT += dt;
      if (demoT > 1.4) { demoT = 0; beat++; P.domain = SOCKETS[beat % SOCKETS.length]; P.spend = 0; for (const b of worn()) { b.glow({ domain: P.domain, spend: 0 }); b.pulse(0.4 + 0.6 * ((beat * 7) % 5) / 4); } if (beat % 3 === 0) for (const b of worn()) b.charm('TWIN'); if (beat % 5 === 0) { P.dissonance = (P.dissonance + 1) % 6; apply(); } }
    }
    for (const b of [...worn(), B.closed, B.open]) b?.update(dt);
  };
  obj.userData.bracelets = B; obj.userData.P = P; obj.userData.apply = apply;
  obj.userData.dispose = () => { for (const b of [...worn(), B.closed, B.open]) b?.dispose(); gui.destroy(); };
  return obj;
}
