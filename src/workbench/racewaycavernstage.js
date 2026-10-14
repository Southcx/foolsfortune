// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S CAVERN STAGE ('raceway:cavern'): the Raceway's cavern (vfx/racewaycavern.js) dressed over the real thing's numbers,
// without the Raceway: the track's own function (world/raceway/track.js track(), pure) gives the branch and the ground, a small field of
// sand is laid over the gorge on the terrain's own grid and triangles (render/terrain.js's cells, so the skin lies on it as in the
// game), Dovina's roof, stalactites and crystals are built by her own buildCavern (world/raceway/cavern.js) into the stage, and her vein
// slabs as raceway.js lays them. A rider runs the branch (raceway.sb) for the edge strings' bright run; a vein is ridden every three
// real seconds. (Dread's fog lies on the circuit, not in here: vfx/racewayfog.js.)
//
// Prior art: the house's own stand-in stages (workbench/racewaylooksstage.js, sandfallstage.js: a look at its real numbers, its place
// imitated only as far as the look asks).
//
//   racewayCavernStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .api { auto, vein(i), rider(sb) })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { Events } from '../core/events.js';
import { track, RW, BRANCH } from '../world/raceway/track.js';
import { buildCavern } from '../world/raceway/cavern.js';
import { RacewayCavern } from '../vfx/racewaycavern.js';

const RIDE = { speed: 18, veinEvery: 3 }; // (the rider's m a real second along the branch; a vein ridden every so many real seconds)

/** The Raceway as far as the cavern's look asks: its track, heights, local points and edge lines (raceway.js's, on the function). */
function standIn(holder) {
  const T = track(), v = new THREE.Vector3();
  const R = {
    T, built: true, line: 'cavern', sb: 0, d: 0, s: 0, plates: [], game: { scene: holder },
    heightAt: (x, z) => RW.y + T.heightAt(x - RW.x, z - RW.z),
    local: (lx, lz) => new THREE.Vector3(RW.x + lx, RW.y + T.heightAt(lx, lz), RW.z + lz),
    normalAt: (x, z, out = new THREE.Vector3()) => { const e = 0.7, hx = R.heightAt(x + e, z) - R.heightAt(x - e, z), hz = R.heightAt(x, z + e) - R.heightAt(x, z - e); return out.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize(); },
    edgeLines(step = 4, line = 'main') {
      const Bn = line === 'cavern' ? T.branch : null, len = Bn ? Bn.length : T.length, out = [{ side: -1, pts: [] }, { side: 1, pts: [] }];
      for (let s = 0; s < len; s += step) { const F = Bn ? Bn.frame(s) : T.frame(s); for (const E of out) { const lat = E.side * (F.w + 0.5), p = R.local(F.x - F.fz * lat, F.z + F.fx * lat); p.y += 1; E.pts.push(p); } }
      return out;
    },
  };
  // the vein slabs, as raceway.js buildMarks lays them (the look hides them)
  const veinMat = new THREE.MeshBasicMaterial({ color: 0x7fdcff, transparent: true, opacity: 0.75, depthWrite: false });
  for (const P of BRANCH.pads) {
    const Fr = T.branch.frame(P.at + P.len / 2), c = R.local(Fr.x - Fr.fz * P.lat, Fr.z + Fr.fx * P.lat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(P.w * 2, P.len).rotateX(-Math.PI / 2), veinMat);
    m.position.copy(c).setY(c.y + 0.08); m.rotation.y = Math.atan2(Fr.fx, Fr.fz); holder.add(m);
    R.plates.push({ line: 'cavern', vein: true, s0: P.at, s1: P.at + P.len, lat: P.lat, w: P.w, mesh: m, index: R.plates.length });
  }
  // the sand over the gorge, on the terrain's grid and its triangles (a, c, b and b, c, d)
  const Bn = T.branch, pad = 40, step = RW.step, half = RW.half;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < Bn.N; i++) { x0 = Math.min(x0, Bn.X[i]); x1 = Math.max(x1, Bn.X[i]); z0 = Math.min(z0, Bn.Z[i]); z1 = Math.max(z1, Bn.Z[i]); }
  const i0 = Math.floor((x0 - pad + half) / step), i1 = Math.ceil((x1 + pad + half) / step), j0 = Math.floor((z0 - pad + half) / step), j1 = Math.ceil((z1 + pad + half) / step);
  const W = i1 - i0 + 1, pos = [], index = [];
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const lx = -half + i * step, lz = -half + j * step; v.set(RW.x + lx, RW.y + T.heightAt(lx, lz), RW.z + lz); pos.push(v.x, v.y, v.z); }
  for (let j = 0; j < j1 - j0; j++) for (let i = 0; i < W - 1; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; index.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(index); g.computeVertexNormals();
  const sand = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xe0a870, roughness: 0.95 })); sand.receiveShadow = true; holder.add(sand);
  R.centre = new THREE.Vector3(RW.x + (x0 + x1) / 2, RW.y, RW.z + (z0 + z1) / 2);
  return R;
}

export function racewayCavernStage(game) {
  const wb = game.workbench, root = new THREE.Group(); root.name = 'stage:raceway:cavern';
  const holder = new THREE.Group(); root.add(holder);
  const R = standIn(holder), events = new Events();
  R.cavern = buildCavern(R); // (Dovina's own placeholders, into the stage)
  holder.position.copy(R.centre).negate(); // (the gorge's middle at the stage's origin)
  holder.updateMatrixWorld(true);
  // the looks build in world space at the Raceway's own coordinates: dressed into the holder too
  const cavern = new RacewayCavern(game, { parent: holder, vfx: wb.vfx, events, raceway: () => R, board: () => true, looks: () => null, lend: () => {} }); // (its lamps real in the stage: no budget here)
  cavern.dress(R);
  const api = {
    auto: true,
    vein(i) { const P = R.plates[i % R.plates.length]; if (P) { events.emit('skiff.plate', { plate: P.index, power: 1, by: 'courier' }); } },
    rider(sb) { R.sb = ((sb % R.T.branch.length) + R.T.branch.length) % R.T.branch.length; },
  };
  const gui = new GUI({ title: "the Raceway's cavern" }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'racewayCavernButtons'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('racewayCavernCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'racewayCavernCss', textContent: 'body #racewayCavernButtons.lil-gui { display: block !important; }' }));
  gui.add(api, 'auto').name('on a loop');
  gui.add({ 'ride vein 1': () => api.vein(0) }, 'ride vein 1'); gui.add({ 'ride vein 2': () => api.vein(1) }, 'ride vein 2');
  let last = 0, vk = -1;
  root.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    if (api.auto) {
      api.rider(R.sb + RIDE.speed * dt);
      const k = Math.floor(t / RIDE.veinEvery); if (k !== vk) { vk = k; api.vein(k); }
    }
    cavern.update(dt);
  };
  // the camera in the gorge under the roof, looking along it (the branch's middle, as the stage's own frame has it)
  { const Bn = R.T.branch, f = Bn.frame(Bn.length * 0.45), g2 = Bn.frame(Bn.length * 0.45 + 30), o = R.centre;
    const p = new THREE.Vector3(RW.x + f.x - o.x, RW.y + f.y - o.y + 3, RW.z + f.z - o.z), q = new THREE.Vector3(RW.x + g2.x - o.x, RW.y + g2.y - o.y + 1, RW.z + g2.z - o.z);
    root.userData.view = { pos: p, look: q }; }
  root.userData.placed = true; root.userData.bare = true; // (its own ground)
  root.userData.cavern = cavern; root.userData.api = api; root.userData.raceway = R;
  root.userData.dispose = () => { cavern.undress(); gui.destroy(); };
  return root;
}
