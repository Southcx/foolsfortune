// ---------------------------------------------------------------------------------------
// THE VOXEL SWARM ON THE WORKBENCH (`crossing:swarm`, the group 'the crossing' on the MODELS tab): the swarm's look (vfx/voxels/
// swarmlook.js) flown by the CPU flock (creatures/ai/flock.js) at 48 boids in its three shapes, in turn or held by its slider: a RIVER (a
// band pouring across the frame), a RIBBON (a helix wrapped round the ship's lane), a BLOOM (bursting out of a point and scattering);
// a few boids downed a second into the voxel batch (vfx/voxels/voxelbatch.js), and three rail foes (vfx/railfoes.js) thrown apart in
// their voxels every few real seconds, on a slab of the crude sea's dark. The stage owns its own batch and swarm (the crossing's are in
// the world's scene); the camera sits where the rail's chase view would, behind and above, looking down the lane (+Z).
//
// Prior art: the workbench's other stages (workbench/railfoestage.js's grid and sliders), Resogun's attract mode (a swarm and a blast on
// a loop), the sardine run's shapes (the river, the bait ball's helix, the burst when a predator strikes).
//
//   voxelSwarmStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .placed, .bare, .P { shape, kind, feeling, downs, foes(), burstNow() })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { Flock } from '../creatures/ai/flock.js';
import { VoxelBatch } from '../vfx/voxels/voxelbatch.js';
import { SwarmLook } from '../vfx/voxels/swarmlook.js';
import { railFoeBody } from '../vfx/railfoes.js';
import { DISPLAY_ORDER } from '../progress/weather.js';

const N = 48, SHAPES = ['river', 'ribbon', 'bloom'], HOLD = 8, FOES = ['darter', 'swooper', 'heavy', 'carrier', 'school', 'sniper'];

export function voxelSwarmStage(game) {
  const obj = new THREE.Group();
  obj.userData.placed = true; obj.userData.bare = true;
  obj.userData.view = { pos: new THREE.Vector3(0, 7, -16), look: new THREE.Vector3(0, 1.5, 12) };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 140).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x15111c, roughness: 0.35, metalness: 0.2 }));
  sea.position.set(0, -3, 20); obj.add(sea);
  const sun = new THREE.DirectionalLight(0xffe8d2, 2.2); sun.position.set(-6, 14, -4); const hemi = new THREE.HemisphereLight(0x8fa0c8, 0x2a1a22, 1.6);
  obj.add(sun, sun.target, hemi);
  const batch = new VoxelBatch(game).build(obj), swarm = new SwarmLook(game, { batch }).build(obj);

  const flock = new Flock({ max: N, sep: [0.7, 1.8], align: [2.5, 1], coh: [4, 0.9], speed: 9, turn: 4 });
  const boids = Array.from({ length: N }, () => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), alive: false }));
  const P = { shape: 'cycle', kind: 'fry', feeling: 'wonder', downs: true, foes: () => throwFoes(), burstNow: () => { for (let i = 0; i < 8; i++) downOne(); } };
  let shape = null, shapeT = 0, clock = 0, downT = 0, foeT = 1.2, foeK = 0;

  /** The flock laid out for a shape: where they start, how they go. */
  function begin(s) {
    shape = s; shapeT = 0; flock.clear();
    for (let i = 0; i < N; i++) {
      const u = Math.random(), v = Math.random(), w = Math.random();
      if (s === 'river') flock.add(-22 + u * 6, 0.5 + v * 3, 6 + w * 12, 9, 0, 1);
      else if (s === 'ribbon') { const a = u * Math.PI * 2; flock.add(Math.cos(a) * 4, 2 + Math.sin(a) * 4, -2 + w * 4, 0, 0, 9); }
      else flock.add((u - 0.5) * 0.6, 2 + (v - 0.5) * 0.6, 14 + (w - 0.5) * 0.6, (u - 0.5) * 18, (v - 0.5) * 14, (w - 0.5) * 18);
    }
  }
  const seek = (i, out) => {
    const t = shapeT;
    if (shape === 'river') { out.set(26, 2 + Math.sin(t * 0.9 + i * 0.13) * 1.2, 12 + Math.sin(t * 0.6) * 4); return 1.1; }
    if (shape === 'ribbon') { const a = t * 2.2 + (i / N) * Math.PI * 2; out.set(Math.cos(a) * 4.5, 2 + Math.sin(a) * 4.5, 4 + t * 3.5 + (i / N) * 6); return 1.6; }
    out.set(0, 2, 14); return t < 0.8 ? 0 : t < 3.5 ? 0.15 : 1.2; // (the bloom: out first, then gathered again)
  };
  const speed = (i) => (shape === 'bloom' && shapeT < 0.8 ? 14 : shape === 'ribbon' ? 11 : 9);
  function downOne() {
    const live = []; for (let i = 0; i < N; i++) if (flock.alive[i]) live.push(i);
    if (!live.length) return;
    const i = live[(Math.random() * live.length) | 0];
    swarm.down(i, { power: 1 }); flock.remove(i);
  }
  const foes = [];
  function throwFoes() {
    for (let k = 0; k < 3; k++) {
      const role = FOES[(foeK++) % FOES.length], b = railFoeBody(role, DISPLAY_ORDER[(foeK + k) % DISPLAY_ORDER.length]);
      b.object.position.set((k - 1) * 7, 1.5, 18 + (k % 2) * 3); b.object.rotation.y = Math.PI; obj.add(b.object); obj.updateMatrixWorld(true);
      const at = b.object.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.2, -0.4));
      batch.burst({ object: b.object, key: `railfoe.${role}`, at: obj.localToWorld(at), dir: new THREE.Vector3(0, 0, 1), power: 1.2, aspect: DISPLAY_ORDER[(foeK + k) % DISPLAY_ORDER.length] });
      batch.chip(obj.localToWorld(at.clone()), new THREE.Vector3(0, 0, 1), 6, 0xffe2b0);
      foes.push(b); b.object.visible = false; // (gone at once: what flies is its voxels)
    }
    while (foes.length > 6) foes.shift().dispose();
  }

  const gui = new GUI({ title: 'the voxel swarm' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'swarmSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('swarmSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'swarmSlidersCss', textContent: 'body #swarmSliders.lil-gui { display: block !important; }' }));
  gui.add(P, 'shape', ['cycle', ...SHAPES]).name('shape').onChange(() => begin(P.shape === 'cycle' ? 'river' : P.shape));
  gui.add(P, 'kind', ['fry', 'moth']).name('body').onChange((v) => swarm.setKind(v));
  gui.add(P, 'feeling', DISPLAY_ORDER).name('feeling').onChange((v) => swarm.setAspect(v));
  gui.add(P, 'downs').name('down a few a second');
  gui.add(P, 'burstNow').name('down eight now');
  gui.add(P, 'foes').name('three foes in voxels');
  swarm.setAspect(P.feeling);
  begin('river');

  let last = 0;
  obj.userData.tick = (t) => {
    const dt = Math.min(0.05, Math.max(0, t - last)); last = t; clock += dt; shapeT += dt;
    if (P.shape === 'cycle' && shapeT > HOLD) begin(SHAPES[(SHAPES.indexOf(shape) + 1) % SHAPES.length]);
    if (P.shape !== 'cycle' && shapeT > HOLD) begin(P.shape);
    flock.step(dt, { seek, speed });
    if (P.downs && shapeT > 1.5 && (downT += dt) > 0.25) { downT = 0; downOne(); }
    if ((foeT -= dt) <= 0) { foeT = 3; throwFoes(); }
    for (let i = 0; i < N; i++) { const b = boids[i]; b.alive = !!flock.alive[i]; if (b.alive) flock.get(i, b.pos, b.vel); }
    obj.updateMatrixWorld(true);
    const M = obj.matrixWorld, frame = { toWorld: (l, out) => out.copy(l).applyMatrix4(M), dirWorld: (v, out) => out.copy(v).transformDirection(M).multiplyScalar(v.length()) };
    swarm.set(boids, frame, dt);
    batch.update(dt);
  };
  obj.userData.P = P; obj.userData.batch = batch; obj.userData.swarm = swarm; obj.userData.begin = begin;
  obj.userData.dispose = () => { foes.forEach((b) => b.dispose()); batch.dispose(); swarm.dispose(); gui.destroy(); };
  return obj;
}
