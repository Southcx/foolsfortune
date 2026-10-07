// ---------------------------------------------------------------------------------------
// THE CAVE'S KIT: what the Great Dunemaw's caverns are made of (docs/plans/DUNEMAW.md; the systems: Dovina's DUNEMAW-SYSTEMS.md; the
// bodies and colliders: Petra's). Each piece is built to be READ at a glance, because the fight and the runs are read:
//
//   PILLAR      a column of the cave's stone with a seam of Lachryma running up it, glowing faintly even at rest: it can break, it is
//               ammunition (Dovina: "the pillars and stalactites must read as ammunition"). crack(stage) adds glowing cracks when the
//               Pithos rams it; at the last it is spent (cracked through, dark). In the bowl (DUNEMAW-ARENA.md) its second ram FELLS it:
//               fall(dir) tips it over its foot to lie as a log (cover, and one more ram), and rubble() breaks the log to a heap
//   STALACTITE  three kinds, told apart from across a cavern: STONE (plain, solid), BRITTLE (pale, cracked, grit falling from it; shake()
//               before it drops), WARPED (labradorite, and the glitch's tear on it: it ghosts out on the Dunemaw's beat; setSolid(k))
//   THE SLIP    sand and liquid Lachryma flowing together: a material for a river's surface, its streaks running along `flow`
//   A CLUTCH    the slip jellies' eggs (3 to 6), soft translucent spheres in the slip, a dark brood curled in each, pulsing; hatch(i)
//               splits an egg's shell (a brood climbs out: Petra's body, dressBrood() its look), burst(i) breaks it with a splash
//   THE BROOD   a slip jelly at half its size, its egg's shell still capping its head and the egg's labradorite in its skin
//
// Prior art: Monster Hunter's arenas and Shadow of the Colossus' pillars (the room as a weapon, read before it is used), Mario's and
// Prince of Persia's crumbling platforms (a tell before the fall), the Metroid Prime scan of a weak wall (a seam that says "this
// breaks"), Ori's Ginso tree and Hollow Knight's Deepnest (a cave that is alive), and the frogspawn and salmon roe of a stream bed.
//
//   new Pillar({ height, radius, fx })   .crack(stage 1..3)   .fall(dir)   .rubble()   .update(t, dt)   .state ('whole'|'cracked'|'falling'|'fallen'|'rubble')
//   new Stalactite({ kind, length, fx })   .shake()   .setSolid(k)   .shatter()   .update(t)
//   slipMaterial({ flow: Vector2, speed })   (its uniforms on .userData.u: uT)
//   new Clutch({ eggs, fx })   .update(t)   .hatch(i)   .burst(i)   .alive (eggs left)        dressBrood(root)   (a slip jelly's root, as a hatchling)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAB_GLSL, mindTime } from './labradorite.js';
import { LIQUID_GLSL, liquidUniforms } from './liquid.js';

const STONE = 0x9b7a5c, PALE = 0xd8c4a4;

/** A material that shows a seam and stages of cracks glowing with the Lachryma (shared by the pillar and the stalactite). */
function seamed(color, u, { seam = 1, flat = true } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: flat });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCkP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCkP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vCkP; uniform float uStage, uSeam, uSpent;\n${LAB_GLSL}\nfloat ckGlow;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ float a = atan(vCkP.z, vCkP.x), y = vCkP.y;
  float seam = 1.0 - smoothstep(0.0, 0.06, abs(sin(a * 1.0 + y * 0.35 + 0.6))); // (a seam winding up it: it can break)
  float cracks = 0.0;
  for (int i = 1; i <= 3; i++) { float fi = float(i); if (uStage < fi - 0.5) break;
    cracks = max(cracks, 1.0 - smoothstep(0.0, 0.05, abs(sin(a * (2.0 + fi) + y * (0.8 + 0.5 * fi) + fi * 1.7) + 0.3 * sin(y * 3.0 + fi)))); }
  ckGlow = seam * uSeam * 0.35 + cracks;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.03, 0.06), clamp(cracks + uSpent * 0.5, 0.0, 0.9)); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += labradorite(vCkP.y * 0.3 + uMindT * 0.08) * ckGlow * (1.0 - uSpent) * 0.9;`);
  };
  m.customProgramCacheKey = () => `cave-seamed-${seam}`;
  return m;
}

export class Pillar {
  constructor({ height = 10, radius = 1.4, fx = null } = {}) {
    this.u = { uStage: { value: 0 }, uSeam: { value: 1 }, uSpent: { value: 0 }, uMindT: mindTime };
    const g = new THREE.CylinderGeometry(radius * 0.85, radius * 1.15, height, 9, 8); g.translate(0, height / 2, 0);
    const pos = g.attributes.position; // (a cave's column: rough, its girth swelling and pinching)
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / height, k = 1 + 0.12 * Math.sin(y * 7.0 + pos.getX(i)) + 0.18 * Math.sin(y * Math.PI) ; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    g.computeVertexNormals();
    this.mesh = new THREE.Mesh(g, seamed(STONE, this.u)); this.mesh.name = 'cave-pillar';
    this.pivot = new THREE.Group(); this.pivot.add(this.mesh); // (it tips over its own foot)
    this.group = new THREE.Group(); this.group.add(this.pivot); this.shakeT = 0;
    this.height = height; this.radius = radius; this.fx = fx; this.state = 'whole'; this.fallK = 0; this.dir = new THREE.Vector3(1, 0, 0);
    // the heap it breaks to, laid along where the log lay (hidden till then)
    const chunks = [], rnd = lcg(height * 7 + radius);
    for (let i = 0; i < 16; i++) { const c = new THREE.DodecahedronGeometry(radius * (0.35 + 0.45 * rnd()), 0); c.rotateX(rnd() * 3); c.rotateY(rnd() * 3); c.translate((i / 15) * height * 0.9 + (rnd() - 0.5) * radius, radius * 0.25 * rnd(), (rnd() - 0.5) * radius * 1.6); chunks.push(c); }
    this.heap = new THREE.Mesh(mergeGeometries(chunks), this.mesh.material); this.heap.name = 'cave-pillar-rubble'; this.heap.visible = false; this.group.add(this.heap);
  }
  /** The Pithos rammed it: a stage of cracks (1 to 3); at 3 it is spent. */
  crack(stage) { this.u.uStage.value = Math.max(this.u.uStage.value, stage); this.shakeT = 0.4; if (stage >= 3) this.u.uSpent.value = 1; if (this.state === 'whole') this.state = 'cracked'; }
  /** Its second ram fells it: it tips over its foot toward `dir` (the way the ram was going, in the parent's frame) and lies as a log. */
  fall(dir = this.dir) {
    if (this.state === 'falling' || this.state === 'fallen' || this.state === 'rubble') return;
    this.crack(2); this.state = 'falling'; this.fallK = 0; this.dir.set(dir.x, 0, dir.z).normalize();
    this.axis = new THREE.Vector3().crossVectors(_up, this.dir).normalize();
  }
  /** The log rammed again: it breaks to a heap of rubble where it lay (an island the slide does not move). */
  rubble() {
    if (this.state === 'rubble') return;
    this.state = 'rubble'; this.pivot.visible = false; this.heap.visible = true; this.u.uSpent.value = 1;
    this.heap.rotation.y = Math.atan2(-this.dir.z, this.dir.x); this.dust(14, true);
  }
  dust(n, along = false) { // (a burst of the cave's dust, and stone chips, where it lands)
    const fx = this.fx; if (!fx?.alpha) return; this.group.updateMatrixWorld(true);
    for (let i = 0; i < n; i++) {
      const d = along ? (i / n) * this.height : this.height * 0.85, at = this.group.localToWorld(_p.set(this.dir.x * d + (Math.random() - 0.5) * this.radius * 2, 0.3, this.dir.z * d + (Math.random() - 0.5) * this.radius * 2));
      fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 3), life: 1.6 + Math.random(), size: 0.6, sizeEnd: 2.4, color: new THREE.Color(0x8a6e55), alpha: 0.45, drag: 1.8, gravity: -0.2 });
      if (i % 3 === 0) fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5), life: 1.2, size: 0.12, sizeEnd: 0.1, color: new THREE.Color(STONE), alpha: 1, drag: 0.3, gravity: 12 });
    }
  }
  update(t, dt = 1 / 60) {
    if (this.shakeT > 0) { this.shakeT -= dt; this.mesh.position.x = (Math.random() - 0.5) * 0.08 * this.shakeT; } else this.mesh.position.x = 0;
    if (this.state === 'falling') { // (slow to leave the vertical, then all at once, as a felled thing goes; a bounce where it lands)
      this.fallK = Math.min(1, this.fallK + dt / 1.3); const k = this.fallK, ang = (Math.PI / 2) * k * k * k + (k >= 1 ? 0 : 0);
      this.pivot.quaternion.setFromAxisAngle(this.axis, ang); this.pivot.position.y = this.radius * 0.9 * k * k;
      if (k >= 1) { this.state = 'fallen'; this.bounceT = 0.35; this.dust(18, true); }
    } else if (this.state === 'fallen' && this.bounceT > 0) {
      this.bounceT -= dt; const b = Math.max(0, this.bounceT) / 0.35; this.pivot.quaternion.setFromAxisAngle(this.axis, Math.PI / 2 - 0.06 * Math.sin(b * Math.PI) * b);
    }
  }
  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.heap.geometry.dispose(); }
}

export class Stalactite {
  constructor({ kind = 'stone', length = 4, radius = 0.9, fx = null } = {}) {
    this.kind = kind; this.fx = fx; this.radius = radius;
    this.u = { uStage: { value: kind === 'brittle' ? 2 : 0 }, uSeam: { value: kind === 'stone' ? 0 : 1 }, uSpent: { value: 0 }, uMindT: mindTime, uSolid: { value: 1 }, uT: { value: 0 } };
    const g = new THREE.ConeGeometry(radius, length, 8, 6); g.rotateX(Math.PI); g.translate(0, -length / 2, 0); // (hangs from its root at the origin)
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = -pos.getY(i) / length, k = 1 + 0.15 * Math.sin(y * 9.0 + pos.getZ(i) * 3.0); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    // the top: a flat to land on (a stump, cut off where a jump lands), and the cone hanging under it
    g.computeVertexNormals();
    let mat;
    if (kind === 'warped') {
      mat = new THREE.ShaderMaterial({ name: 'cave-warped', uniforms: this.u, transparent: true,
        vertexShader: `varying vec3 vW, vN; uniform float uT, uSolid;
void main() { vec3 p = position; float step = floor(uT * 8.0);
  p.x += (fract(sin(step * 12.9 + p.y) * 4375.5) - 0.5) * 0.25 * (1.0 - uSolid); // (the tear: it jumps in steps as it ghosts out)
  vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `varying vec3 vW, vN; uniform float uT, uSolid;
${LAB_GLSL}
void main() { vec3 V = normalize(cameraPosition - vW); float f = abs(dot(V, vN));
  vec3 c = mix(labSoft(labPhase(vW, -V)) * 0.7, labradorite(labPhase(vW, -V) + 0.3), pow(1.0 - f, 2.0));
  float band = step(0.5, fract(vW.y * 3.0 + uT * 4.0)); // (scanlines through it as it ghosts)
  gl_FragColor = vec4(c, mix(0.25 + 0.2 * band, 1.0, uSolid)); }` });
    } else mat = seamed(kind === 'brittle' ? PALE : STONE, this.u);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.name = `stalactite-${kind}`;
    this.group = new THREE.Group(); this.group.add(this.mesh);
    if (kind === 'brittle') { // (grit falling from it: a thin trickle, always, so it reads from across the cavern)
      this.grit = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24 * 3), 3)), new THREE.PointsMaterial({ color: PALE, size: 0.06 }));
      this.grit.name = 'stalactite-grit'; this.group.add(this.grit); this.gritY = Array.from({ length: 24 }, (_, i) => -length - (i / 24) * 6);
    }
    this.length = length; this.shakeT = 0;
  }
  /** The tell before a brittle one falls (0.8 sim seconds: Dovina's, Wanda's creak). */
  shake(dur = 0.8) { this.shakeT = dur; }
  /** Fallen and rammed (or slammed on): it shatters, used once. Shards and dust where it lay. */
  shatter() {
    this.group.visible = false; const fx = this.fx; if (!fx?.alpha) return; this.group.updateMatrixWorld(true);
    const col = new THREE.Color(this.kind === 'brittle' ? PALE : STONE);
    for (let i = 0; i < 20; i++) { const at = this.mesh.localToWorld(_p.set(0, -(i / 20) * this.length, 0)); fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6), life: 1.1, size: 0.14 * (1 + this.radius), sizeEnd: 0.1, color: col, alpha: 1, drag: 0.3, gravity: 12 });
      if (i % 2) fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2), life: 1.6, size: 0.5, sizeEnd: 1.8, color: new THREE.Color(0x8a6e55), alpha: 0.4, drag: 1.8, gravity: -0.2 }); }
  }
  /** A warped one's presence: 1 solid, 0 gone (on the Dunemaw's beat: `dunemaw.beat`). */
  setSolid(k) { this.u.uSolid.value = k; this.mesh.visible = k > 0.02; }
  update(t, dt = 1 / 60) {
    this.u.uT.value = t;
    if (this.shakeT > 0) { this.shakeT -= dt; const k = 0.05 + 0.1 * (1 - this.shakeT); this.mesh.rotation.set((Math.random() - 0.5) * k, 0, (Math.random() - 0.5) * k); } else this.mesh.rotation.set(0, 0, 0);
    if (this.grit) { const p = this.grit.geometry.attributes.position; this.gritY.forEach((y, i) => { let ny = y - dt * (3 + i % 3); if (ny < -this.length - 6) ny = -this.length; this.gritY[i] = ny; p.setXYZ(i, Math.sin(i * 7.1) * 0.08, ny, Math.cos(i * 3.3) * 0.08); }); p.needsUpdate = true; }
  }
  dispose() { this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
}

/** The slip: sand and liquid Lachryma flowing together, for a river's surface (a plane or a heightfield's mesh). */
export function slipMaterial({ flow = new THREE.Vector2(1, 0), speed = 4 } = {}) {
  const u = { uT: { value: 0 }, uFlow: { value: flow.clone().normalize() }, uSpeed: { value: speed }, uMindT: mindTime, ...liquidUniforms() };
  const m = new THREE.MeshStandardMaterial({ name: 'cave-slip', color: 0x8a6440, roughness: 0.35, metalness: 0.1 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSlW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSlW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSlW; uniform float uT, uSpeed; uniform vec2 uFlow;\n${LAB_GLSL}\n${LIQUID_GLSL}\nfloat slLab;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec2 q = vec2(dot(vSlW.xz, uFlow), dot(vSlW.xz, vec2(-uFlow.y, uFlow.x))); // (along the flow, across it)
  float a = liqTap(vec2(q.x * 0.05 - uT * uSpeed * 0.05, q.y * 0.18)).r, b = liqTap(vec2(q.x * 0.09 - uT * uSpeed * 0.08, q.y * 0.31) + 0.3).b;
  float streak = a * 0.6 + b * 0.4;
  slLab = smoothstep(0.5, 0.8, streak); // (the Lachryma's ribbons in the sand)
  diffuseColor.rgb *= 0.45 + 0.9 * streak; }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += labSoft(dot(vSlW.xz, vec2(0.05, 0.04)) + uMindT * 0.05) * slLab * 0.6;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(0.55, 0.12, slLab); // (glossy where it runs liquid)');
  };
  m.customProgramCacheKey = () => 'cave-slip';
  m.userData.u = u;
  return m;
}

export class Clutch {
  constructor({ eggs = 5, radius = 0.2, fx = null } = {}) {
    this.u = { uT: { value: 0 }, uMindT: mindTime }; this.fx = fx; this.radius = radius;
    const shell = (this.shellMat = new THREE.ShaderMaterial({ name: 'cave-egg', uniforms: this.u, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN, vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vN, vW; uniform float uT;
${LAB_GLSL}
void main() { vec3 V = normalize(cameraPosition - vW); float f = abs(dot(V, vN));
  vec3 c = mix(vec3(0.85, 0.78, 0.95), labSoft(labPhase(vW, -V)), 0.35) * (0.6 + 0.4 * pow(1.0 - f, 2.0));
  gl_FragColor = vec4(c, 0.25 + 0.55 * pow(1.0 - f, 1.5)); }` }));
    const yolk = new THREE.MeshStandardMaterial({ name: 'cave-brood', color: 0x2a1e38, roughness: 0.4, emissive: 0x1a0a30 });
    this.group = new THREE.Group(); this.group.name = 'clutch'; this.eggs = [];
    const half = new THREE.SphereGeometry(radius, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), low = new THREE.SphereGeometry(radius, 16, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    for (let i = 0; i < eggs; i++) {
      const a = (i / eggs) * Math.PI * 2 + 0.3, r = i ? 0.3 + 0.08 * (i % 2) : 0, e = new THREE.Group();
      e.position.set(Math.cos(a) * r, radius * 0.8, Math.sin(a) * r);
      const top = new THREE.Mesh(half, shell), bot = new THREE.Mesh(low, shell); e.add(top, bot); // (two halves: the shell splits at its equator when it hatches)
      const b = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.45, 10, 8), yolk); b.scale.set(1, 0.7, 1.2); e.add(b); // (the brood, curled)
      this.group.add(e); this.eggs.push({ g: e, top, bot, brood: b, phase: i * 1.3, alive: true, hatchK: -1 });
    }
  }
  get alive() { return this.eggs.filter((E) => E.alive).length; }
  /** An egg hatches: its shell's cap lifts and tips off, the brood is out (Petra spawns the body there; `dressBrood` its look). */
  hatch(i) { const E = this.eggs[i]; if (E?.alive) { E.alive = false; E.hatchK = 0; E.brood.visible = false; this.splash(E, 6); } }
  /** An egg broken (a blow, or the whole clutch): a wet splash of slip and the shell's pieces. */
  burst(i) { const E = this.eggs[i]; if (E?.alive || E?.hatchK >= 0) { E.alive = false; E.hatchK = -1; E.g.visible = false; this.splash(E, 14); } }
  splash(E, n) {
    const fx = this.fx; if (!fx?.alpha) return; E.g.updateMatrixWorld(true); const at = E.g.getWorldPosition(_p).clone();
    for (let k = 0; k < n; k++) {
      fx.alpha.emit({ pos: at.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 2.4, 1 + Math.random() * 2.2, (Math.random() - 0.5) * 2.4), life: 0.9, size: 0.06, sizeEnd: 0.03, color: new THREE.Color(k % 3 ? 0x8a6440 : 0xd9c8ff), alpha: 0.9, drag: 0.5, gravity: 9 });
    }
  }
  update(t, dt = 1 / 60) {
    this.u.uT.value = t;
    for (const E of this.eggs) {
      if (E.hatchK >= 0 && E.hatchK < 1) { E.hatchK = Math.min(1, E.hatchK + dt / 0.7); const k = E.hatchK; E.top.position.set(0.12 * k * this.radius * 4, this.radius * 1.4 * Math.sin(k * Math.PI * 0.8), 0); E.top.rotation.z = -k * 2.2; if (k >= 1) E.top.visible = false; }
      if (!E.alive) continue;
      const k = 1 + 0.06 * Math.sin(t * 2.2 + E.phase); E.g.scale.set(k, 1 / k, k); E.brood.rotation.y = t * 0.6 + E.phase;
    }
  }
  dispose() { this.group.traverse((o) => { o.geometry?.dispose?.(); }); this.shellMat.dispose(); }
}

/** A slip jelly's root dressed as fresh brood from a clutch: half its size, the egg's cap still on its head, the egg's labradorite
 *  sheen in its skin (its melt and its moves stay the slip jelly's own). Returns an undo. */
export function dressBrood(root, { size = 0.5 } = {}) {
  const was = root.scale.clone(); root.scale.multiplyScalar(size);
  root.updateWorldMatrix(true, true); // (its parents too: a box from a stale parent puts the cap anywhere)
  const box = new THREE.Box3().setFromObject(root), wp = root.getWorldPosition(new THREE.Vector3()), ws = root.getWorldScale(new THREE.Vector3());
  const capR = Math.max(0.05, (box.max.x - box.min.x) * 0.3) || 0.2;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2.4), new THREE.MeshStandardMaterial({ color: 0xe2d6f0, roughness: 0.25, transparent: true, opacity: 0.8, emissive: 0x2a1a44, emissiveIntensity: 0.5 }));
  cap.name = 'brood-cap'; cap.rotation.z = 0.35; cap.scale.set(capR / ws.x, capR / ws.y, capR / ws.z); cap.position.y = ((box.max.y - wp.y) / ws.y) * 0.9; root.add(cap);
  return () => { root.remove(cap); cap.geometry.dispose(); cap.material.dispose(); root.scale.copy(was); };
}

function lcg(seed) { let a = Math.floor(seed * 1000) % 2147483647 || 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }
const _up = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3();
