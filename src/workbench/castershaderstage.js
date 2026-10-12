// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S CASTER SHADER STAGES (the group 'caster shells' shaders'): S1 to S5 of docs/plans/CASTER-SHELLS.md, each on a little
// ground of its own with something behind it worth bending or seeing through (a striped clay wall, pots, posts), and its sliders on the
// right (lil-gui, as the tuning panel is), so the owner can judge a look before any shell uses it:
//
//   caster:heathaze      a clay volcano with hot air over it, a flame's cone along the ground, the Piercer's glass tube
//   caster:bubble        a bubble (sphere, dome or wall; hex, crackle or clear), struck every couple of seconds
//   caster:lightning     an arc between two clay insulators; or a Faraday cage's twelve edges; or Ball Lightning's tendrils
//   caster:frostbisque   a stand-in clay body, fired to bisque, frosted or crazed from a hit, on a loop
//   caster:portal        a linked pair (one here, its partner off to the side looking back at the row) and a rift on the ground
//   caster:all           the five in a row
//
// Prior art: the workbench's other stages (workbench/stages.js: a look on a loop before the game drives it), Unreal's material instance
// editor (a preview with its parameters beside it).
//
//   casterShaderStage(id, game) -> Object3D (userData.tick(t), userData.dispose(), userData.view, userData.placed)   CASTER_SHADER_STAGE_IDS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import GUI from 'lil-gui';
import { HeatHaze } from '../vfx/caster/heathaze.js';
import { Bubble, BUBBLE_PATTERNS } from '../vfx/caster/bubble.js';
import { Lightning } from '../vfx/caster/lightning.js';
import { FrostBisque, SKIN_MODES } from '../vfx/caster/frostbisque.js';
import { Portal } from '../vfx/caster/portal.js';

export const CASTER_SHADER_STAGE_IDS = ['caster:heathaze', 'caster:bubble', 'caster:lightning', 'caster:frostbisque', 'caster:portal', 'caster:all'];

const CLAY = 0xb5643f, STONE = 0x6d5a4c;
const clay = (c = CLAY, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

/** A wall with bold stripes and rings on it, so a bend or a window is plain to see. */
function backdrop(width = 6) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const x = cv.getContext('2d');
  x.fillStyle = '#c9a27c'; x.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#8a4b2e' : '#d9c09a'; x.fillRect(i * 16, 0, 8, 128); }
  x.strokeStyle = '#2d1f1a'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(32 + i * 64, 64, 22, 0, Math.PI * 2); x.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
  m.position.set(0, width / 4, -2.2);
  return m;
}
function pot(h = 0.6, c = CLAY) {
  const pts = [[0, 0], [0.18, 0.02], [0.3, 0.25], [0.32, 0.5], [0.2, 0.85], [0.14, 0.95], [0.17, 1]].map(([r, y]) => new THREE.Vector2(r * h, y * h));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 20), clay(c, 0.7));
}

// ---- each shader's station: its things in a group, its sliders in a folder, its loop
function hazeStation(gui) {
  const g = new THREE.Group(); g.add(backdrop());
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 24, 1, true), clay(0x7b4a33)); cone.position.set(-1.6, 0.55, 0); g.add(cone);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.1, 0.3) })); glow.rotation.x = -Math.PI / 2; glow.position.set(-1.6, 1.08, 0); g.add(glow);
  const column = new HeatHaze({ shape: 'column', radius: 0.75, length: 2.8, strength: 7, warmth: 0.06 }); column.object.position.set(-1.6, 1.0, 0); g.add(column.object);
  const nozzle = pot(0.4, STONE); nozzle.rotation.z = -Math.PI / 2; nozzle.position.set(0.1, 0.5, 0.6); g.add(nozzle);
  const flame = new HeatHaze({ shape: 'cone', radius: 0.8, length: 2.6, strength: 9, warmth: 0.3 }); flame.set({ pos: new THREE.Vector3(0.5, 0.5, 0.6), dir: new THREE.Vector3(1, 0.12, 0) }); g.add(flame.object);
  const tube = new HeatHaze({ shape: 'tube', radius: 0.14, strength: 5, warmth: 0, glass: 0.8 }); tube.set({ from: new THREE.Vector3(-2.8, 1.7, 1.2), to: new THREE.Vector3(2.8, 1.5, 0.4) }); g.add(tube.object);
  const all = [column, flame, tube];
  const P = { strength: 7, rise: 1.2, noise: 1.6, warmth: 0.15, glass: 0.8, edge: 1.5, k: 1 };
  const f = gui.addFolder('S1 heat haze');
  const apply = () => { for (const h of all) h.set({ strength: P.strength * (h === flame ? 1.3 : h === tube ? 0.7 : 1), rise: P.rise, scale: P.noise, warmth: h === tube ? 0 : P.warmth * (h === flame ? 1.2 : 0.5), glass: h === tube ? P.glass : 0, edge: P.edge, k: P.k }); };
  f.add(P, 'strength', 0, 24, 0.5).name('bend (px at 480 lines)').onChange(apply);
  f.add(P, 'rise', 0, 4, 0.05).name('rise (m a real second)').onChange(apply);
  f.add(P, 'noise', 0.3, 5, 0.05).name('noise (a metre)').onChange(apply);
  f.add(P, 'warmth', 0, 0.8, 0.01).name('warmth').onChange(apply);
  f.add(P, 'glass', 0, 1, 0.01).name('the tube\'s glass').onChange(apply);
  f.add(P, 'edge', 0.3, 4, 0.05).name('edge softness').onChange(apply);
  f.add(P, 'k', 0, 1, 0.01).name('strength k').onChange(apply);
  apply();
  return { group: g, tick: (dt) => all.forEach((h) => h.update(dt)), dispose: () => all.forEach((h) => h.dispose()) };
}

function bubbleStation(gui) {
  const g = new THREE.Group(); g.add(backdrop());
  for (const [x, z] of [[-0.6, 0.2], [0.4, -0.3], [0.1, 0.6]]) { const p = pot(0.7); p.position.set(x, 0, z); g.add(p); }
  const P = { shape: 'sphere', pattern: 'hex', radius: 1.6, cell: 0.32, tint: '#8fd0ff', rim: '#ffffff', film: 0.5, labradorite: 0, fill: 1, lines: 1, crack: 0, k: 1, strike: true };
  let B = null, hitT = 0;
  const build = () => {
    B?.dispose();
    B = new Bubble({ shape: P.shape, radius: P.radius, width: 4, height: 2.4, cell: P.cell, pattern: P.pattern, tint: P.tint, rim: P.rim, film: P.film, labradorite: P.labradorite, fill: P.fill, lines: P.lines, crack: P.crack, k: P.k });
    B.object.position.set(0, P.shape === 'sphere' ? P.radius : 0, P.shape === 'wall' ? 1.2 : 0); g.add(B.object);
  };
  const apply = () => B.set({ tint: P.tint, rim: P.rim, film: P.film, labradorite: P.labradorite, fill: P.fill, lines: P.lines, crack: P.crack, k: P.k, pattern: P.pattern });
  const f = gui.addFolder('S2 the bubble');
  f.add(P, 'shape', ['sphere', 'dome', 'wall']).onChange(build);
  f.add(P, 'pattern', BUBBLE_PATTERNS).onChange(apply);
  f.add(P, 'radius', 0.4, 4, 0.05).onFinishChange(build);
  f.add(P, 'cell', 0.12, 0.8, 0.01).name('cell (m)').onFinishChange(build);
  f.addColor(P, 'tint').onChange(apply); f.addColor(P, 'rim').onChange(apply);
  f.add(P, 'film', 0, 1.5, 0.01).name('thin film').onChange(apply);
  f.add(P, 'labradorite', 0, 1, 0.01).name('the Mind\'s schiller').onChange(apply);
  f.add(P, 'fill', 0, 2, 0.01).onChange(apply); f.add(P, 'lines', 0, 2, 0.01).onChange(apply);
  f.add(P, 'crack', 0, 1, 0.01).name('crack (round the blows)').onChange(apply);
  f.add(P, 'k', 0, 1, 0.01).onChange(apply);
  f.add(P, 'strike').name('struck every 2 s');
  build();
  const strike = () => { const d = new THREE.Vector3().randomDirection(); d.y = Math.abs(d.y) * 0.6 + 0.2; d.z = Math.abs(d.z) + 0.4; d.normalize(); B.object.updateMatrixWorld(); B.hit(P.shape === 'wall' ? B.object.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 3, 0.4 + Math.random() * 1.6, 0)) : B.object.localToWorld(d.clone())); };
  return { group: g, tick: (dt) => { if (P.strike && (hitT += dt) > 2) { hitT = 0; strike(); } B.update(dt); }, dispose: () => B.dispose(), strike };
}

function lightningStation(gui) {
  const g = new THREE.Group(); g.add(backdrop());
  const post = (x) => { const p = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.4, 12), clay(STONE)); s.position.y = 0.7; p.add(s); for (let i = 0; i < 3; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - i * 0.04, 0.22 - i * 0.04, 0.06, 20), clay(0xe8dcc8, 0.4)); d.position.y = 1.1 + i * 0.14; p.add(d); } p.position.x = x; g.add(p); return p; };
  post(-1.8); post(1.8);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.9, 2.6) })); g.add(ball);
  const P = { layout: 'arc', levels: 5, jag: 0.2, branches: 3, width: 0.05, glow: 4, rate: 14, tint: '#9cc8ff', core: '#ffffff', k: 1 };
  let Z = null, t = 0;
  const paths = () => {
    if (P.layout === 'arc') return [[new THREE.Vector3(-1.8, 1.5, 0), new THREE.Vector3(1.8, 1.5, 0)]];
    if (P.layout === 'cage') { const c = [-0.9, 0.9], v = []; for (const x of c) for (const y of [0.05, 1.85]) for (const z of c) v.push(new THREE.Vector3(x, y, z)); const e = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = v[i].distanceTo(v[j]); if (Math.abs(d - 1.8) < 0.01) e.push([v[i], v[j]]); } return e; }
    const o = new THREE.Vector3(0, 1.4 + 0.2 * Math.sin(t), 0); return [0, 1, 2, 3, 4].map((i) => { const a = i * 1.2566 + t * 0.6; return [o, new THREE.Vector3(Math.cos(a) * 1.6, 0.5 + 0.8 * Math.sin(a * 1.7 + t), Math.sin(a) * 1.6)]; });
  };
  const build = () => { Z?.dispose(); Z = new Lightning({ paths: paths(), levels: P.levels, jag: P.jag, branches: P.layout === 'cage' ? Math.min(1, P.branches) : P.branches, width: P.width, glow: P.glow, rate: P.rate, tint: P.tint, core: P.core, k: P.k }); g.add(Z.object); ball.visible = P.layout === 'tendrils'; if (ball.visible) ball.material.color.set(P.tint).multiplyScalar(2.2); };
  const apply = () => Z.set({ jag: P.jag, width: P.width, glow: P.glow, rate: P.rate, tint: P.tint, core: P.core, k: P.k });
  const f = gui.addFolder('S3 lightning');
  f.add(P, 'layout', ['arc', 'cage', 'tendrils']).onChange((v) => { if (v === 'tendrils') { P.tint = '#c49cff'; } else P.tint = '#9cc8ff'; f.controllers.forEach((c) => c.updateDisplay()); build(); });
  f.add(P, 'levels', 2, 7, 1).onFinishChange(build); f.add(P, 'branches', 0, 8, 1).onFinishChange(build);
  f.add(P, 'jag', 0, 0.4, 0.01).onChange(apply); f.add(P, 'width', 0.005, 0.2, 0.005).name('width (m)').onChange(apply);
  f.add(P, 'glow', 1.5, 8, 0.1).onChange(apply); f.add(P, 'rate', 0, 30, 1).name('regrow (a real second)').onChange(apply);
  f.addColor(P, 'tint').onChange(apply); f.addColor(P, 'core').onChange(apply); f.add(P, 'k', 0, 1.5, 0.01).onChange(apply);
  build();
  return { group: g, tick: (dt) => { t += dt; if (P.layout === 'tendrils') { const p = paths(); ball.position.copy(p[0][0]); Z.set({ paths: p }); } Z.update(dt); }, dispose: () => Z.dispose() };
}

function skinStation(gui) {
  const g = new THREE.Group(); g.add(backdrop());
  // a stand-in clay body: one geometry (a torso, a head, two arms), as a creature's mesh would be
  const parts = [new THREE.CapsuleGeometry(0.42, 0.8, 6, 16).translate(0, 0.95, 0), new THREE.SphereGeometry(0.3, 20, 14).translate(0, 1.85, 0), new THREE.CapsuleGeometry(0.12, 0.6, 4, 10).rotateZ(0.5).translate(-0.62, 1.1, 0), new THREE.CapsuleGeometry(0.12, 0.6, 4, 10).rotateZ(-0.5).translate(0.62, 1.1, 0)];
  const pos = [], nor = []; for (const p of parts) { const q = p.toNonIndexed(); pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  // three bodies, one a skin: fired to bisque, frosted, crazed dry
  const bodies = SKIN_MODES.map((mode, i) => { const b = new THREE.Mesh(geo, clay(0x8f7a6a, 0.6)); b.position.x = (i - 1) * 1.7; b.scale.setScalar(0.8); g.add(b); return b; });
  const P = { grow: 0.5, loop: true, seconds: 3, k: 1 };
  const F = bodies.map((b, i) => new FrostBisque({ target: b, mode: SKIN_MODES[i], origin: b.localToWorld(new THREE.Vector3(0.35, 1.2, 0.4)) }));
  const f = gui.addFolder('S4 frost and bisque (bisque, frost, craze)');
  f.add(P, 'grow', 0, 1, 0.01).listen().onChange(() => { P.loop = false; f.controllers.forEach((c) => c.updateDisplay()); });
  f.add(P, 'loop').name('grow on a loop'); f.add(P, 'seconds', 0.5, 8, 0.1).name('spread (real s)');
  f.add(P, 'k', 0, 1, 0.01);
  let t = 0;
  return { group: g, tick: (dt) => { if (P.loop) { t = (t + dt) % (P.seconds + 1.5); P.grow = Math.min(1, t / P.seconds); } for (const b of bodies) b.rotation.y = Math.sin(t * 0.5) * 0.6; F.forEach((x) => { x.set({ grow: P.grow, k: P.k }); x.update(dt); }); }, dispose: () => F.forEach((x) => x.dispose()), pin: (v) => { P.loop = false; P.grow = v; } };
}

function portalStation(gui, game, root) {
  const g = new THREE.Group(); g.add(backdrop());
  const A = new Portal({ width: 1.3, height: 2.0 }); A.object.position.set(-0.9, 1.25, 0.2); g.add(A.object);
  const B = new Portal({ width: 1.3, height: 2.0, phase: 0.5 }); B.object.position.set(0, 1.25, 9); B.object.rotation.y = Math.PI; g.add(B.object); // (off to the side, looking back at the row)
  for (let i = 0; i < 5; i++) { const p = pot(0.5 + 0.2 * (i % 2), i % 2 ? STONE : CLAY); p.position.set(-2 + i, 0, 7); g.add(p); } // (what its partner sees: pots by it)
  A.link(B);
  const rift = new Portal({ mode: 'rift', width: 1.6, height: 1.1, phase: 0.2 }); rift.object.rotation.x = -Math.PI / 2; rift.object.position.set(1.6, 0.02, 0.6); g.add(rift.object);
  const P = { open: 1, eye: true, liveHz: 0, k: 1, phase: 0 };
  const f = gui.addFolder('S5 the portal');
  f.add(P, 'open', 0, 1, 0.01).listen().onChange(() => { P.eye = false; });
  f.add(P, 'eye').name('the rift opens and closes'); f.add(P, 'liveHz', 0, 30, 1).name('live views (a real second)').onChange((v) => { A.set({ liveHz: v }); B.set({ liveHz: v }); });
  f.add(P, 'phase', 0, 1, 0.01).name('film phase').onChange((v) => { A.set({ phase: v }); B.set({ phase: v + 0.5 }); rift.set({ phase: v + 0.2 }); });
  f.add(P, 'k', 0, 1, 0.01);
  f.add({ refresh: () => { A.refresh(game.renderer, root()); B.refresh(game.renderer, root()); } }, 'refresh').name('draw the views again');
  let t = 0, drawn = false;
  return { group: g, tick: (dt) => {
    t += dt;
    if (!drawn && root()?.isScene) { drawn = true; A.refresh(game.renderer, root()); B.refresh(game.renderer, root()); }
    const eye = P.eye ? Math.min(1, Math.max(0, Math.sin(t * 0.6) * 1.6 + 0.6)) : P.open;
    A.set({ open: P.open, k: P.k }); B.set({ open: P.open, k: P.k }); rift.set({ open: eye, k: P.k });
    for (const x of [A, B, rift]) x.update(dt, game.renderer, root());
  }, dispose: () => [A, B, rift].forEach((x) => x.dispose()) };
}

const STATIONS = { 'caster:heathaze': hazeStation, 'caster:bubble': bubbleStation, 'caster:lightning': lightningStation, 'caster:frostbisque': skinStation, 'caster:portal': portalStation };

export function casterShaderStage(id, game) {
  const obj = new THREE.Group();
  const gui = new GUI({ title: 'caster shaders' }); gui.domElement.classList.add('ff-tuning'); gui.domElement.id = 'casterShaderSliders'; gui.domElement.style.zIndex = '45';
  if (!document.getElementById('casterShaderSlidersCss')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'casterShaderSlidersCss', textContent: 'body #casterShaderSliders.lil-gui { display: block !important; }' })); // (the workbench steps the HUD's panels out, feedback/hideui.js: these are the stage's own)
  const root = () => { let s = obj; while (s.parent) s = s.parent; return s; };
  const ids = id === 'caster:all' ? Object.keys(STATIONS) : [id];
  const S = ids.map((sid, i) => { const s = STATIONS[sid](gui, game, root); s.group.position.x = (i - (ids.length - 1) / 2) * 7; obj.add(s.group); return s; });
  if (ids.length > 1) gui.folders.forEach((f) => f.close());
  obj.userData.placed = true;
  obj.userData.view = ids.length > 1 ? { pos: new THREE.Vector3(0, 6, 22), look: new THREE.Vector3(0, 1.2, 0) } : { pos: new THREE.Vector3(0.6, 2.2, 6.2), look: new THREE.Vector3(0, 1.1, 0) };
  let last = 0;
  obj.userData.tick = (t) => { const dt = Math.min(0.1, Math.max(0, t - last)); last = t; for (const s of S) s.tick(dt); };
  obj.userData.stations = S;
  obj.userData.dispose = () => { for (const s of S) s.dispose(); gui.destroy(); };
  return obj;
}
