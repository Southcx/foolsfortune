// ---------------------------------------------------------------------------------------
// THE CAVE'S KIT: what the Great Dunemaw's caverns are made of (docs/plans/DUNEMAW.md; the systems: Dovina's DUNEMAW-SYSTEMS.md; the
// bodies and colliders: Petra's). Each piece is built to be READ at a glance, because the fight and the runs are read:
//
//   PILLAR      a column of the cave's stone with a seam of Lachryma running up it, glowing faintly even at rest: it can break, it is
//               ammunition (Dovina: "the pillars and stalactites must read as ammunition"). crack(stage) adds glowing cracks when the
//               Pithos rams it; at the last it is spent (cracked through, dark)
//   STALACTITE  three kinds, told apart from across a cavern: STONE (plain, solid), BRITTLE (pale, cracked, grit falling from it; shake()
//               before it drops), WARPED (labradorite, and the glitch's tear on it: it ghosts out on the Dunemaw's beat; setSolid(k))
//   THE SLIP    sand and liquid Lachryma flowing together: a material for a river's surface, its streaks running along `flow`
//   A CLUTCH    the slip jellies' eggs (3 to 6), soft translucent spheres in the slip, a dark brood curled in each, pulsing
//
// Prior art: Monster Hunter's arenas and Shadow of the Colossus' pillars (the room as a weapon, read before it is used), Mario's and
// Prince of Persia's crumbling platforms (a tell before the fall), the Metroid Prime scan of a weak wall (a seam that says "this
// breaks"), Ori's Ginso tree and Hollow Knight's Deepnest (a cave that is alive), and the frogspawn and salmon roe of a stream bed.
//
//   new Pillar({ height, radius })   .crack(stage 1..3)   .update(t)        new Stalactite({ kind, length })   .shake()   .setSolid(k)   .update(t)
//   slipMaterial({ flow: Vector2, speed })   (its uniforms on .userData.u: uT)        new Clutch({ eggs })   .update(t)   .burst(i)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
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
  constructor({ height = 10, radius = 1.4 } = {}) {
    this.u = { uStage: { value: 0 }, uSeam: { value: 1 }, uSpent: { value: 0 }, uMindT: mindTime };
    const g = new THREE.CylinderGeometry(radius * 0.85, radius * 1.15, height, 9, 8); g.translate(0, height / 2, 0);
    const pos = g.attributes.position; // (a cave's column: rough, its girth swelling and pinching)
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / height, k = 1 + 0.12 * Math.sin(y * 7.0 + pos.getX(i)) + 0.18 * Math.sin(y * Math.PI) ; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    g.computeVertexNormals();
    this.mesh = new THREE.Mesh(g, seamed(STONE, this.u)); this.mesh.name = 'cave-pillar';
    this.group = new THREE.Group(); this.group.add(this.mesh); this.shakeT = 0;
  }
  /** The Pithos rammed it: a stage of cracks (1 to 3); at 3 it is spent. */
  crack(stage) { this.u.uStage.value = Math.max(this.u.uStage.value, stage); this.shakeT = 0.4; if (stage >= 3) this.u.uSpent.value = 1; }
  update(t, dt = 1 / 60) { if (this.shakeT > 0) { this.shakeT -= dt; this.mesh.position.x = (Math.random() - 0.5) * 0.08 * this.shakeT; } else this.mesh.position.x = 0; }
  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

export class Stalactite {
  constructor({ kind = 'stone', length = 4, radius = 0.9 } = {}) {
    this.kind = kind;
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
  constructor({ eggs = 5, radius = 0.2 } = {}) {
    this.u = { uT: { value: 0 }, uMindT: mindTime };
    const shell = new THREE.ShaderMaterial({ name: 'cave-egg', uniforms: this.u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vN, vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vN, vW; uniform float uT;
${LAB_GLSL}
void main() { vec3 V = normalize(cameraPosition - vW); float f = abs(dot(V, vN));
  vec3 c = mix(vec3(0.85, 0.78, 0.95), labSoft(labPhase(vW, -V)), 0.35) * (0.6 + 0.4 * pow(1.0 - f, 2.0));
  gl_FragColor = vec4(c, 0.25 + 0.55 * pow(1.0 - f, 1.5)); }` });
    const yolk = new THREE.MeshStandardMaterial({ name: 'cave-brood', color: 0x2a1e38, roughness: 0.4, emissive: 0x1a0a30 });
    this.group = new THREE.Group(); this.group.name = 'clutch'; this.eggs = [];
    for (let i = 0; i < eggs; i++) {
      const a = (i / eggs) * Math.PI * 2 + 0.3, r = i ? 0.3 + 0.08 * (i % 2) : 0, e = new THREE.Group();
      e.position.set(Math.cos(a) * r, radius * 0.8, Math.sin(a) * r);
      const s = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), shell); e.add(s);
      const b = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.45, 10, 8), yolk); b.scale.set(1, 0.7, 1.2); e.add(b); // (the brood, curled)
      this.group.add(e); this.eggs.push({ g: e, brood: b, phase: i * 1.3, alive: true });
    }
  }
  burst(i) { const E = this.eggs[i]; if (E?.alive) { E.alive = false; E.g.visible = false; } }
  update(t) { this.u.uT.value = t; for (const E of this.eggs) { if (!E.alive) continue; const k = 1 + 0.06 * Math.sin(t * 2.2 + E.phase); E.g.scale.set(k, 1 / k, k); E.brood.rotation.y = t * 0.6 + E.phase; } }
  dispose() { this.group.traverse((o) => { o.geometry?.dispose?.(); }); }
}
