// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S RACEWAY LOOKS STAGE ('raceway:looks'): the Raceway's looks (vfx/racewaylooks.js) on a stand-in of the track, since the
// Raceway itself is Dovina's and builds only in its place: a straight strip of sand with three sun plates, the start arch with its three
// lamps, two gates' pillar pairs (the first lit as next), the Solar Skiff with its carve's sparks, and the ghost beside it. The stand-in
// Raceway answers what the looks ask of the real one (T.frame, T.line, T.gates, local, heightAt, normalAt, plates[].mesh) on the flat;
// the arch and the pillars are raceway.js's shapes at its numbers. The events are fired by hand on the stage's own bus, on a loop (an
// eight-second race: 3, 2, 1, GO, a gate passed; a seven-second carve: tiers 1, 2, 3, let go; a plate ridden every two seconds), or from
// its buttons with the loop off.
// Round 2: the straight is the first leg of a stadium loop (two straights, two bends, about 297 m) that answers edgeLines(step), with a
// rider going round it (R.s) for the edge strings' bright run; a glazed rail on the back straight that the skiff grinds (skiff.grind,
// skiff.grind.end); a sun ring hung over the far bend, flown through (skiff.ring).
//
// Prior art: the sandfall's stage beside it (workbench/sandfallstage.js: a look at its real numbers on a stand-in of its place).
//
//   racewayLooksStage(game) -> Object3D (userData.tick(t), .dispose(), .view, .api { auto, count(n), go(), next(i), carve(tier),
//     release(), plate(i), rider(s), grind(), grindEnd(why), ring(), night(k), ready })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { Events } from '../core/events.js';
import { Skiff } from '../courier/skiff/boat.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RacewayLooks } from '../vfx/racewaylooks.js';
import { SolarRing } from '../vfx/solarring.js';
import { addOutline } from '../render/outline.js';

const TRACK = { w: 7, line: -14, gates: [24, 36], plates: [0, 8, 16], len: 7, plateW: 2.6 }; // (half width; s of the line, gates, plates)
const SKIFF_AT = new THREE.Vector3(14, 0.6, 6), GHOST_AT = new THREE.Vector3(10, 0.6, 6); // (the board hovers 0.6 m over the sand)
// the stadium loop: the straight up x = 0 from z = -30, a bend of radius 25 to x = 50, back down, and round; the rail on the back
// straight (its top line, x = 50, z 28 -> -12, 0.9 m up); the ring over the far bend (4 m up, facing +x)
const LOOP = { r: 25, straight: 70, w: 7.5, rail: { x: 50, z0: 28, z1: -12, y: 0.9 }, ring: new THREE.Vector3(25, 4, 65), ringR: 3.2 };
LOOP.len = 2 * LOOP.straight + 2 * Math.PI * LOOP.r;
/** The loop's centre and way at u metres round it. */
function loopFrame(u) {
  const { r, straight: S } = LOOP, a = Math.PI * r; u = ((u % LOOP.len) + LOOP.len) % LOOP.len;
  if (u < S) return { x: 0, z: -30 + u, fx: 0, fz: 1 };
  if (u < S + a) { const t = (u - S) / r; return { x: r - r * Math.cos(t), z: 40 + r * Math.sin(t), fx: Math.sin(t), fz: Math.cos(t) }; }
  if (u < 2 * S + a) return { x: 2 * r, z: 40 - (u - S - a), fx: 0, fz: -1 };
  const t = (u - 2 * S - a) / r; return { x: r + r * Math.cos(t), z: -30 - r * Math.sin(t), fx: -Math.sin(t), fz: -Math.cos(t) };
}

/** A stand-in Raceway on the flat: the line runs up +Z along x = 0. */
function standIn(root) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const T = { line: TRACK.line, gates: TRACK.gates, frame: (s) => ({ x: 0, z: s, fx: 0, fz: 1, w: TRACK.w, y: 0 }) };
  const plates = TRACK.plates.map((z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(TRACK.plateW * 2, TRACK.len).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    m.position.set(0, 0.08, z); root.add(m); return { s0: z - TRACK.len / 2, s1: z + TRACK.len / 2, lat: 0, w: TRACK.plateW, mesh: m }; }); // (her gold slab: the looks hide it)
  // raceway.js's edgeLines on the loop: both edges a metre over the sand, every `step` metres from u = 0
  const edgeLines = (step = 4) => { const out = [{ side: -1, pts: [] }, { side: 1, pts: [] }];
    for (let u = 0; u < LOOP.len; u += step) { const F = loopFrame(u); for (const E of out) { const lat = E.side * LOOP.w; E.pts.push(v(F.x - F.fz * lat, 1, F.z + F.fx * lat)); } }
    return out; };
  return { T, plates, s: 10, d: 0, edgeLines, local: (lx, lz) => v(lx, 0, lz), heightAt: () => 0, normalAt: (x, z, out = new THREE.Vector3()) => out.set(0, 1, 0) };
}

/** railsrings.js's rail at its numbers (a lintel on columns, one merged vertex-coloured mesh with its outline) and its ring. */
function railAndRing(root, R) {
  const L = LOOP.rail, pts = [], n = Math.ceil(Math.abs(L.z1 - L.z0) / 2);
  for (let i = 0; i <= n; i++) pts.push(new THREE.Vector3(L.x, L.y, L.z0 + (L.z1 - L.z0) * (i / n)));
  const cum = [0]; for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const paint = (geo, color) => { const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < g.attributes.position.count; i++) c.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
  const geos = [];
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1], m = new THREE.Matrix4().lookAt(p, q, new THREE.Vector3(0, 1, 0)).setPosition(p.clone().lerp(q, 0.5)); geos.push(paint(new THREE.BoxGeometry(0.5, 0.32, p.distanceTo(q) + 0.05).applyMatrix4(m), 0x8a4a3a)); }
  for (let d = 0; d <= cum[n]; d += 8) { const p = pts[0].clone().lerp(pts[n], d / cum[n]), foot = -0.4, h = p.y - 0.16 - foot; geos.push(paint(new THREE.CylinderGeometry(0.22, 0.3, h, 6).translate(p.x, foot + h / 2, p.z), 0xd9906a)); }
  const mesh = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true }));
  mesh.castShadow = mesh.receiveShadow = true; addOutline(mesh); root.add(mesh);
  R.railMesh = mesh; R.rails = [{ pts, cum, len: cum[n] }];
  const look = new SolarRing({ radius: LOOP.ringR }), dir = new THREE.Vector3(1, 0, 0);
  look.group.position.copy(LOOP.ring); look.group.lookAt(LOOP.ring.clone().add(dir)); look.set({ lit: true }); root.add(look.group);
  R.rings = [{ i: 0, pos: LOOP.ring.clone(), dir, look, wait: 0 }];
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
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(170, 170).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8b070, roughness: 0.92 }));
  sand.position.set(25, 0, 5); sand.receiveShadow = true; root.add(sand);
  ruins(root);
  const R = standIn(root), events = new Events();
  railAndRing(root, R);
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
    rider(s) { R.s = ((s % LOOP.len) + LOOP.len) % LOOP.len; },
    grind() { // (the skiff set on the rail's start, heading along it; the tick runs it down the rail)
      const P = R.rails[0].pts; skiff.group.position.copy(P[0]).add(new THREE.Vector3(0, 0.55, 0)); board.heading = Math.atan2(P[1].x - P[0].x, P[1].z - P[0].z);
      skiff.group.rotation.set(0, board.heading, 0); board.vel.set(Math.sin(board.heading), 0, Math.cos(board.heading)).multiplyScalar(14); grindS = 0;
      events.emit('skiff.grind', { by: 'courier' });
    },
    grindEnd(why = 'end') { if (grindS == null) return; events.emit('skiff.grind.end', { metres: +grindS.toFixed(1), why, by: 'courier' }); grindS = null; },
    home() { skiff.group.position.copy(SKIFF_AT); skiff.group.rotation.set(0, 0, 0); board.heading = 0; board.vel.set(0, 0, 0); },
    ring() { R.rings[0].look.pass(); events.emit('skiff.ring', { ring: 0, by: 'courier' }); },
    night(k) { looks.nightOf = () => k; looks.nightT = 9; },
  };
  let grindS = null;
  const gui = new GUI({ title: "the Raceway's looks" }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'racewayLooksButtons'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('racewayLooksCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'racewayLooksCss', textContent: 'body #racewayLooksButtons.lil-gui { display: block !important; }' }));
  gui.add(api, 'auto').name('on a loop');
  const B = { grind: () => api.grind(), 'grind: let go': () => api.grindEnd('hop'), 'fly the ring': () => api.ring(), 'count 3': () => api.count(3), 'count 2': () => api.count(2), 'count 1': () => api.count(1), GO: () => api.go(), 'next gate': () => api.next((race.next + 1) % 3), 'carve tier 1': () => api.carve(1), 'carve tier 2': () => api.carve(2), 'carve tier 3': () => api.carve(3), 'let go': () => api.release(), 'ride a plate': () => api.plate(Math.floor(Math.random() * 3)) };
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
    if (grindS != null) { // (on the rail at 14 m/s, let go at its end)
      grindS += 14 * dt; const L = R.rails[0], f = Math.min(1, grindS / L.len);
      skiff.group.position.copy(L.pts[0]).lerp(L.pts[L.pts.length - 1], f).add(new THREE.Vector3(0, 0.55, 0));
      if (f >= 1) { api.grindEnd('end'); if (api.auto) api.home(); }
    }
    if (api.auto) {
      api.rider(R.s + 12 * dt); // (the rider round the loop, for the edge strings' run)
      const g = Math.floor(t / 9); if (g !== gk) { gk = g; api.grind(); }
      const r = Math.floor((t + 2) / 5); if (r !== rgk) { rgk = r; api.ring(); }
    }
    for (const Rg of R.rings) Rg.look.update(dt);
    looks.update(dt);
  };
  let gk = -1, rgk = -1;
  root.userData.placed = true; root.userData.bare = true; // (its own ground)
  root.userData.view = { pos: new THREE.Vector3(-30, 40, -70), look: new THREE.Vector3(20, 0, 15) };
  root.userData.looks = looks; root.userData.api = api; root.userData.skiff = skiff; root.userData.ghost = ghost;
  root.userData.dispose = () => { looks.stopCarve(); looks.undressGhost(); looks.undress(); for (const Rg of R.rings) Rg.look.dispose(); gui.destroy(); };
  return root;
}
