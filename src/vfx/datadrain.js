// ---------------------------------------------------------------------------------------
// THE DATA DRAIN: a creature's data pulled out of it, as Skeith pulled Orca's in .hack (the owner, 2026-10-06: "think about the opening
// scene where Orca gets data drained! SO COOL!!"). Played when a mind is rewritten (the Veritome's reprogramming: reprogram.run), and
// by anything else that takes a thing apart as data. Three pieces, one look:
//
//   THE BRACELET  at the hand that drains: six solid petals opening and turning, cyan and magenta by turns
//   THE BEAM      from the bracelet to the creature: a ribbon of light with a dark edge, its stripes running the way the data runs (inward)
//   THE POLYGONS  the creature broken into flickering cubes laid on its own surface (its meshes' vertices, where they are now), which
//                 stutter, lift off and stream in a spiral down the beam into the bracelet; the creature's body blinks out in steps as
//                 they go and is given back whole at the end (a drain rewrites a creature, it does not kill it)
//
// With it, the screen's own data drain (vfx/glitch.js MOMENTS 'reprogram.run': blocks pulled toward the creature on the screen).
// One instanced mesh of cubes (360), a ribbon and a petal ring, made once (prewarm, for the warm-up) and parked out of sight.
//
// Prior art: .hack//Infection's Data Drain (CyberConnect2, 2002: the Twilight Bracelet's petals, the beam, the target's polygons
// flickering and torn away into it), Kingdom Hearts' data-world dissolves, Tron's derezzing (a body as voxels, falling apart in blocks),
// and Rez's wireframe data-space.
//
//   game.dataDrain = new DataDrain(game)   .play(creature | { pos, radius, height, root? }, from: Vector3, dur = 1.6)   .update(rawDt)
//   .active   .prewarm() -> park()   (off with T.visual.glitch, as the screen's glitch is)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';

const N = 360, PETALS = 6;
const CYAN = new THREE.Color(0x46f0ff), MAGENTA = new THREE.Color(0xff3fd2), WHITE = new THREE.Color(0xffffff);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color();

/** Points on a creature's surface: its meshes' vertices where they are now (a skinned or deformed mesh: its rest shape, placed). */
function surfacePoints(target, n) {
  const pts = [], src = [];
  target.root?.updateMatrixWorld(true); // (where its meshes are now, not where they were last drawn)
  target.root?.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position && o.visible !== false) src.push(o); });
  for (let i = 0; i < n * 2 && src.length && pts.length < n; i++) {
    const o = src[i % src.length], P = o.geometry.attributes.position, k = Math.floor(Math.random() * P.count);
    const q = new THREE.Vector3().fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld);
    if (q.distanceTo(target.pos) < 3 * ((target.radius || 0.5) + (target.height || 1))) pts.push(q); // (a vertex far off is a mesh drawn elsewhere: left out)
  }
  while (pts.length < n) { // (no mesh to read: a capsule round its position)
    const a = Math.random() * Math.PI * 2, y = Math.random() * (target.height || 1), r = (target.radius || 0.5) * (0.7 + 0.3 * Math.random());
    pts.push(new THREE.Vector3(target.pos.x + Math.cos(a) * r, target.pos.y + y, target.pos.z + Math.sin(a) * r));
  }
  return pts;
}

export class DataDrain {
  constructor(game) {
    this.game = game; this.made = false; this.run = null;
    game.events?.on?.('reprogram.run', (e) => { // (a mind rewritten: drained from the Courier's hand; a refusal shows the resist mark instead, not this)
      const c = game.reprogram?.c, P = game.player?.pos;
      if (!c || !P || e.refused?.length >= (e.effects?.length || 1)) return;
      this.play(c, P.clone().setY(P.y + 1.15));
    });
  }

  make() {
    if (this.made) return; this.made = true;
    const g = new THREE.Group(); g.name = 'datadrain'; g.userData.zoneFree = true; g.visible = false;
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false };
    this.cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'datadrain-cubes', fog: false, toneMapped: false }), N); // (solid, unlit: it reads on white sand as on a dark Well)
    this.cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.cubes.frustumCulled = false;
    // the beam: a flat ribbon along +z, its stripes scrolling inward
    this.beamU = { uT: { value: 0 }, uA: { value: 0 } };
    const beamGeo = new THREE.PlaneGeometry(1, 1, 1, 1); beamGeo.translate(0, 0.5, 0); beamGeo.rotateX(Math.PI / 2);
    this.beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
      name: 'datadrain-beam', uniforms: this.beamU, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vU; uniform float uT, uA;
void main() {
  float across = 1.0 - abs(vU.x - 0.5) * 2.0, core = pow(across, 6.0), edge = pow(across, 1.5);
  float stripe = step(0.55, fract(vU.y * 14.0 + uT * 6.0)); // (running toward the bracelet)
  vec3 c = mix(vec3(1.0, 0.25, 0.82), vec3(0.27, 0.94, 1.0), smoothstep(0.2, 0.7, across)) * (0.55 + 0.45 * stripe) + vec3(core);
  c = mix(vec3(0.05, 0.0, 0.1), c, smoothstep(0.0, 0.25, across)); // (a dark edge, so the beam reads on the bright sand)
  gl_FragColor = vec4(c, uA * smoothstep(0.0, 0.08, across));
}` }));
    this.beam.frustumCulled = false;
    // the bracelet: six petals of a lattice (thin rhombi), opening and turning
    const petalGeo = new THREE.BufferGeometry(); petalGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.04, 0, 0.11, 0.26, 0, 0, 0.56, 0, 0, 0.04, 0, 0, 0.56, 0, -0.11, 0.26, 0], 3)); // (a rhombus petal, solid)
    this.ring = new THREE.Group();
    this.petals = [];
    for (let i = 0; i < PETALS; i++) {
      const l = new THREE.Mesh(petalGeo, new THREE.MeshBasicMaterial({ name: 'datadrain-petal', color: i % 2 ? MAGENTA : CYAN, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide }));
      l.rotation.z = (i / PETALS) * Math.PI * 2; this.ring.add(l); this.petals.push(l);
    }
    g.add(this.cubes, this.beam, this.ring);
    this.group = g;
    this.game.scene?.add(g);
  }

  /** For the boot's warm-up (main.js): shown, so its programs compile with the rest; returns what hides it again. */
  prewarm() { this.make(); this.group.visible = true; return () => { this.group.visible = !!this.run; }; }

  get active() { return !!this.run; }

  /** Drain a creature (or anything with pos, radius, height and a root) into `from` over `dur` real seconds. */
  play(target, from, dur = 1.6) {
    if (!target?.pos || !from || T.visual.glitch === false) return;
    this.make();
    this.stop();
    const pts = surfacePoints(target, N);
    for (const q of pts) { const dx = q.x - target.pos.x, dz = q.z - target.pos.z, r = Math.hypot(dx, dz) || 1; q.x += (dx / r) * 0.12; q.z += (dz / r) * 0.12; } // (a hair out from the body: a mesh deformed in its shader stands outside its rest vertices)
    this.run = { target, from: from.clone(), dur, t: 0, pts, seed: pts.map(() => Math.random()), spin: Math.random() * 6.28, was: target.root?.visible };
    this.group.visible = true;
  }

  stop() { if (!this.run) return; if (this.run.target.root) this.run.target.root.visible = this.run.was ?? true; this.run = null; if (this.group) this.group.visible = false; }

  update(raw) {
    const R = this.run; if (!R) return;
    R.t += raw;
    const x = R.t / R.dur;
    if (x >= 1) { this.stop(); return; }
    const C = R.target, to = _v.copy(C.pos).setY(C.pos.y + (C.height || 1) * 0.5);
    // the bracelet: opens over the first fifth, turns, closes at the end
    const open = Math.min(1, x / 0.2) * (1 - Math.max(0, (x - 0.9) / 0.1));
    this.ring.position.copy(R.from); this.ring.lookAt(to); this.ring.rotateZ(R.t * 3.2);
    this.ring.scale.setScalar(0.4 + 0.9 * open);
    this.petals.forEach((p, i) => { p.rotation.x = (1 - open) * 1.2 * (i % 2 ? 1 : -1); p.material.opacity = open; });
    // the beam: from the bracelet to the creature, up fast, held, gone with the last of the data
    const len = R.from.distanceTo(to);
    this.beam.position.copy(R.from); this.beam.lookAt(to); this.beam.scale.set(0.34 + 0.08 * Math.sin(R.t * 40), 1, len);
    this.beamU.uT.value = R.t; this.beamU.uA.value = Math.min(1, x / 0.12) * (1 - Math.max(0, (x - 0.85) / 0.15));
    // the creature's body blinks out in steps while its data goes (and is given back at the end: stop())
    if (C.root) C.root.visible = x < 0.25 ? true : x > 0.8 ? Math.random() < 0.5 : Math.random() < 0.3;
    // the polygons: each flickers on the surface, lifts off at its own moment, and spirals down the beam
    const axis = _w.subVectors(R.from, to).normalize();
    for (let i = 0; i < N; i++) {
      const s = R.seed[i], go = THREE.MathUtils.clamp((x - 0.2 - s * 0.55) / 0.35, 0, 1), e = go * go * (3 - 2 * go);
      const p = _s.copy(R.pts[i]).lerp(R.from, e);
      const sw = Math.sin(e * Math.PI) * 0.6 * (C.radius || 0.5), a = R.spin + s * 40 + e * 9; // (the spiral round the beam)
      p.x += Math.cos(a) * sw * (1 - Math.abs(axis.x)); p.z += Math.sin(a) * sw * (1 - Math.abs(axis.z)); p.y += Math.sin(a * 1.3) * sw * 0.5;
      const flick = Math.random() < 0.15 + 0.5 * (1 - e) * Math.min(1, x / 0.2) ? 0 : 1; // (stuttering, more before they go)
      const size = (0.09 + 0.14 * s) * (1 - e * 0.8) * flick * Math.min(1, x / 0.1);
      _q.setFromEuler(new THREE.Euler(s * 6 + R.t * 4, s * 9, 0));
      this.cubes.setMatrixAt(i, _m.compose(p, _q, _v.set(size, size, size)));
      this.cubes.setColorAt(i, _c.copy(s < 0.45 ? CYAN : s < 0.8 ? MAGENTA : WHITE).multiplyScalar(1.3));
    }
    this.cubes.instanceMatrix.needsUpdate = true; this.cubes.instanceColor.needsUpdate = true;
  }
}
