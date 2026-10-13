// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S RACEWAY LOOKS STAGE ('raceway:looks'): the Raceway's looks (vfx/racewaylooks.js) on a stand-in of the track, since the
// Raceway itself is Dovina's and builds only in its place: a straight strip of sand with three sun plates, the start arch with its three
// lamps, two gates' pillar pairs (the first lit as next), the Solar Skiff with its carve's sparks, and the ghost beside it. The stand-in
// Raceway answers what the looks ask of the real one (T.frame, T.line, T.gates, local, heightAt, normalAt, plates[].mesh) on the flat;
// the arch and the pillars are raceway.js's shapes at its numbers. The events are fired by hand on the stage's own bus, on a loop (an
// eight-second race: 3, 2, 1, GO, a gate passed; a seven-second carve: tiers 1, 2, 3, let go; a plate ridden every two seconds), or from
// its buttons with the loop off.
//
// Prior art: the sandfall's stage beside it (workbench/sandfallstage.js: a look at its real numbers on a stand-in of its place).
//
//   racewayLooksStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .api { auto, count(n), go(), next(i), carve(tier),
//     release(), plate(i), ready })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { Events } from '../core/events.js';
import { Skiff } from '../courier/skiff/boat.js';
import { RacewayLooks } from '../vfx/racewaylooks.js';

const TRACK = { w: 7, line: -14, gates: [24, 36], plates: [0, 8, 16], len: 7, plateW: 2.6 }; // (half width; s of the line, gates, plates)
const SKIFF_AT = new THREE.Vector3(14, 0.6, 6), GHOST_AT = new THREE.Vector3(10, 0.6, 6); // (the board hovers 0.6 m over the sand)

/** A stand-in Raceway on the flat: the line runs up +Z along x = 0. */
function standIn(root) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = { line: TRACK.line, gates: TRACK.gates, frame: (s) => ({ x: 0, z: s, fx: 0, fz: 1, w: TRACK.w, y: 0 }) };
  const plates = TRACK.plates.map((z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(TRACK.plateW * 2, TRACK.len).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    m.position.set(0, 0.08, z); root.add(m); return { s0: z - TRACK.len / 2, s1: z + TRACK.len / 2, lat: 0, w: TRACK.plateW, mesh: m }; }); // (her gold slab: the looks hide it)
  return { T, plates, local: (lx, lz) => v(lx, 0, lz), heightAt: () => 0, normalAt: (x, z, out = new THREE.Vector3()) => out.set(0, 1, 0) };
}

/** raceway.js's ruin pillar (clay, a gold band, a dark cap) and the arch's lintel, at its numbers, standing on the flat. */
function ruins(root) {
  const clay = new THREE.MeshStandardMaterial({ color: 0xd9906a, roughness: 0.9, flatShading: true }), band = new THREE.MeshStandardMaterial({ color: 0xffd696, roughness: 0.9 }), cap = new THREE.MeshStandardMaterial({ color: 0x8a4a3a, roughness: 0.9, flatShading: true });
  const pillar = (x, z, h, w) => {
    const g = new THREE.Group(); g.position.set(x, h / 2 - 1.5, z);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, w), clay));
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.25, w * 1.02), band); b.position.y = h * 0.22; g.add(b);
    const c = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, w * 1.1, 4).rotateY(Math.PI / 4), cap); c.position.y = h / 2 + w * 0.5; g.add(c);
    root.add(g);
  };
  const top = 11, ax = TRACK.w + 3; pillar(-ax, TRACK.line, top + 1.5, 2.2); pillar(ax, TRACK.line, top + 1.5, 2.2);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(ax * 2 + 2.6, 1.4, 2.0), cap); lintel.position.set(0, top + 0.6, TRACK.line); root.add(lintel);
  for (const z of TRACK.gates) for (const sg of [-1, 1]) pillar(sg * (TRACK.w + 2.5), z, 8, 1.5);
}

export function racewayLooksStage(game) {
  const wb = game.workbench, root = new THREE.Group(); root.name = 'stage:raceway:looks';
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(80, 110).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92 }));
  sand.position.z = 12; sand.receiveShadow = true; root.add(sand);
  ruins(root);
  const R = standIn(root), events = new Events();
  // the skiff, its ghost, and the board the carve's sparks ask for (the stage's own: heading +Z, carving to the right)
  const skiff = new Skiff(root), ghost = new THREE.Group(); ghost.position.copy(GHOST_AT); root.add(ghost);
  { const m = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.35, depthWrite: false }), hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 2.6), m); hull.position.y = -0.5; ghost.add(hull); } // (her placeholder, until the model is parsed)
  const board = { group: skiff.group, heading: 0, carve: null, vel: new THREE.Vector3(0, 0, 0) };
  const race = { running: false, state: 'idle', next: 0 };
  const looks = new RacewayLooks(game, { parent: root, vfx: wb.vfx, events, race: () => race, board: () => (skiff.ready ? board : null), skiffModel: () => (skiff.ready ? skiff.model : null), player: () => skiff.group.position });
  looks.dress(R);
  let posed = false;
  skiff.load(game).then(() => {
    skiff.group.position.copy(SKIFF_AT); skiff.visible = true;
    skiff.set({ sail: 1, side: 1, fill: 0.8, boom: 0.7, glow: 0, t: 0, speed: 10 }); skiff.posePhase('Skiff_RideIdle', 0); skiff.group.updateMatrixWorld(true);
    posed = true; looks.dressGhost(ghost);
  });
  // the events by hand
  const api = {
    auto: true, get ready() { return posed && !!looks.ghost?.holo; },
    start() { race.running = true; race.state = 'grid'; race.next = 0; events.emit('race.start', { by: 'courier' }); },
    count(n) { if (!race.running) api.start(); events.emit('race.count', { n, by: 'courier' }); },
    go() { race.state = 'run'; race.next = 0; events.emit('race.go', { by: 'courier' }); },
    next(i) { race.running = true; race.state = 'run'; if (i > race.next) events.emit('race.gate', { gate: race.next + 1, lap: 1, split: null, by: 'courier' }); race.next = i; },
    end() { race.running = false; race.state = 'idle'; events.emit('race.end', { why: 'left', by: 'courier' }); },
    carve(tier) { board.carve = { dir: 1, t: 0, tier }; events.emit('skiff.carve.charge', { tier, by: 'courier' }); },
    release() { const tier = board.carve?.tier || 1; board.carve = null; events.emit('skiff.carve', { tier, by: 'courier' }); },
    plate(i) { looks.plateHit(i); },
  };
  const gui = new GUI({ title: "the Raceway's looks" }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'racewayLooksButtons'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('racewayLooksCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'racewayLooksCss', textContent: 'body #racewayLooksButtons.lil-gui { display: block !important; }' }));
  gui.add(api, 'auto').name('on a loop');
  const B = { 'count 3': () => api.count(3), 'count 2': () => api.count(2), 'count 1': () => api.count(1), GO: () => api.go(), 'next gate': () => api.next((race.next + 1) % 3), 'carve tier 1': () => api.carve(1), 'carve tier 2': () => api.carve(2), 'carve tier 3': () => api.carve(3), 'let go': () => api.release(), 'ride a plate': () => api.plate(Math.floor(Math.random() * 3)) };
  for (const k of Object.keys(B)) gui.add(B, k);
  // the loop: an eight-second race, a seven-second carve, a plate every two seconds
  let last = 0, rk = -1, ck = -1, pk = -1;
  root.userData.tick = (t) => {
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    if (api.auto) {
      const r = t % 8, rs = r < 1 ? 0 : r < 2 ? 1 : r < 3 ? 2 : r < 5.5 ? 3 : 4;
      if (rs !== rk) { rk = rs; if (rs === 0) { api.end(); api.count(3); } else if (rs === 1) api.count(2); else if (rs === 2) api.count(1); else if (rs === 3) api.go(); else api.next(1); }
      const c = t % 7, cs = c < 1.2 ? 1 : c < 2.4 ? 2 : c < 3.6 ? 3 : 4;
      if (cs !== ck) { ck = cs; if (cs <= 3) api.carve(cs); else api.release(); }
      const p = Math.floor(t / 2) % 3; if (p !== pk) { pk = p; api.plate(p); }
    }
    looks.update(dt);
  };
  root.userData.placed = true; root.userData.bare = true; // (its own ground)
  root.userData.view = { pos: new THREE.Vector3(30, 16, -30), look: new THREE.Vector3(4, 3, 10) };
  root.userData.looks = looks; root.userData.api = api; root.userData.skiff = skiff; root.userData.ghost = ghost;
  root.userData.dispose = () => { looks.stopCarve(); looks.undressGhost(); looks.undress(); gui.destroy(); };
  return root;
}
