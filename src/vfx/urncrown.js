// ---------------------------------------------------------------------------------------
// THE URN CROWN: the Great Slip Jelly's broken urn (the owner, 2026-10-06: "a broken urn stuck on its head like a weird crown, and
// breaking off the urn reveals a weakpoint"; docs/plans/DUNEMAW.md, the FOE). It grew in the urn as a brood jelly and outgrew it: the
// urn split, and its top half stayed on its head, mouth up, the broken edge biting down round it. This is the crown's look and its
// breaking; the fight (its toughness, what cracks it, what the core takes) is Dovina's, its body and the strikes Petra's.
//
//   THE URN    the shoulder, neck and lip of a ru ware urn (the Song court's sky-blue celadon, its glaze crazed in a fine crackle), its
//              lower edge broken jagged
//   THE CRACKS three stages (crack(1..3)): each stage a new set of cracks running up from the broken edge, glowing with the Lachryma
//              pressing out from inside (the labradorite's colours), brighter at each stage; a stage set shakes the urn
//   THE BURST  at the third, burst(): the urn flies off in shards (they tumble and fall, and are gone), and THE CORE is bare: a lens
//              of labradorite turned to light, pulsing, the weak point
//
// Prior art: Monster Hunter's part breaks (a head that cracks in stages, then breaks off, and the monster changes), Kirby's and
// Metroid's armoured bosses (the armour first, then the weak point), Zelda's Dodongo and the Hinox's armour, kintsugi in reverse (the
// crack shown with light, not gold), and ru ware itself (the crazing of its glaze, prized).
//
//   const U = new UrnCrown({ radius })   head.add(U.group)   U.crack(stage)   U.burst(dir?)   U.update(rawDt)   U.stage   U.core (the weak point's mesh)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LAB_GLSL, mindTime } from './labradorite.js';

/** The urn's glaze: ru ware's sky-blue celadon, crazed; and in the red channel the cracks, their stage as the grey (1, 2 or 3 thirds). */
function urnTexture() {
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  // the crackle (green channel): a fine web, as ru ware's glaze is crazed
  g.strokeStyle = 'rgb(0,255,0)'; g.lineWidth = 1;
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { let x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 50; y += (rnd() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  // the cracks (red channel): from the broken edge (v 0: the canvas's bottom) up, three sets
  g.globalCompositeOperation = 'lighter';
  for (let stage = 1; stage <= 3; stage++) {
    g.strokeStyle = `rgb(${Math.round(stage * 85)},0,0)`;
    for (let i = 0; i < 4 + stage * 2; i++) {
      let x = rnd() * S, y = S; g.lineWidth = 6 - stage; g.beginPath(); g.moveTo(x, y);
      const len = 0.3 + 0.25 * stage;
      while (y > S * (1 - len)) { x += (rnd() - 0.5) * 36; y -= 10 + rnd() * 22; g.lineTo(x, y); if (rnd() < 0.15) { const bx = x, by = y; g.moveTo(bx, by); g.lineTo(bx + (rnd() - 0.5) * 60, by - 20 - rnd() * 30); g.moveTo(bx, by); } }
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

/** The urn's top half as a lathe: the broken edge (jagged) at the bottom, the shoulder, the neck, the lip. Unit size (radius 1). */
function urnGeometry() {
  const prof = [];
  const P = [[1.0, 0.0], [1.06, 0.12], [1.02, 0.3], [0.86, 0.48], [0.6, 0.6], [0.5, 0.74], [0.52, 0.84], [0.62, 0.9], [0.58, 0.93], [0.46, 0.9]];
  for (const [r, y] of P) prof.push(new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 40);
  // the broken edge: the lowest ring of vertices pushed up and down, jagged
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    if (uv.getY(i) > 0.01) continue;
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const jag = 0.12 * Math.abs(Math.sin(a * 7.0)) + 0.08 * Math.abs(Math.sin(a * 17.0 + 1.3)) + 0.05 * Math.sin(a * 31.0);
    pos.setY(i, pos.getY(i) + jag);
  }
  g.computeVertexNormals();
  return g;
}

export class UrnCrown {
  constructor({ radius = 0.5 } = {}) {
    this.u = { uStage: { value: 0 }, uFlash: { value: 0 }, uMindT: mindTime, uCrack: { value: urnTexture() } };
    const m = this.mat = new THREE.MeshStandardMaterial({ name: 'urn-crown', color: 0x9cc7c8, roughness: 0.3, metalness: 0.0, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUrnUv; varying vec3 vUrnW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvUrnUv = uv; vUrnW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform sampler2D uCrack; uniform float uStage, uFlash; varying vec2 vUrnUv; varying vec3 vUrnW;\n${LAB_GLSL}\nfloat urnCrack;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{ vec4 k = texture2D(uCrack, vUrnUv);
  diffuseColor.rgb = mix(vec3(0.36, 0.58, 0.62), vec3(0.28, 0.5, 0.6), vUrnUv.y) * (1.0 - 0.35 * k.g); // (ru's sky-blue celadon, crazed: deep enough to hold its colour under a warm light)
  float lvl = k.r * 3.0; urnCrack = step(0.5, lvl) * step(lvl, uStage + 0.5); // (a crack shows once its stage has come)
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.03, 0.08), urnCrack * 0.85); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += labradorite(dot(vUrnW, vec3(0.7, 1.3, 0.5)) + uMindT * 0.1) * urnCrack * (0.6 + 0.6 * uStage / 3.0 + 1.5 * uFlash); // (the Lachryma pressing out)`);
    };
    m.customProgramCacheKey = () => 'urn-crown';
    this.urn = new THREE.Mesh(urnGeometry(), m); this.urn.name = 'urn-crown';
    this.urn.scale.setScalar(radius); this.urn.position.y = -radius * 0.15; // (the broken edge bites down round the head)
    // the core: a lens of labradorite turned to light, under the urn, the weak point
    this.coreU = { uT: { value: 0 }, uMindT: mindTime, uA: { value: 0 } };
    this.core = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.55, 24, 16), new THREE.ShaderMaterial({
      name: 'urn-core', uniforms: this.coreU, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vN, vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vN, vW; uniform float uT, uA;
${LAB_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vW); float f = dot(V, vN);
  float pulse = 0.75 + 0.25 * sin(uT * 6.0); // (it pulses: the weak point, breathing)
  vec3 c = labradorite(labPhase(vW, -V) + uT * 0.2) * (0.8 + 1.6 * pow(f, 2.0)) * pulse + vec3(1.0) * pow(f, 8.0) * 0.8;
  gl_FragColor = vec4(c, uA * (0.55 + 0.45 * f));
}` }));
    this.core.name = 'urn-core'; this.core.scale.set(1, 0.7, 1); this.core.position.y = radius * 0.1; this.core.visible = false;
    // the shards: the urn in pieces, flying off at the burst
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(radius * 0.22, 0), new THREE.MeshStandardMaterial({ name: 'urn-shard', color: 0x5f939c, roughness: 0.3, flatShading: true }), 18);
    this.shards.visible = false; this.shards.frustumCulled = false;
    this.group = new THREE.Group(); this.group.name = 'urn-crown'; this.group.add(this.urn, this.core, this.shards);
    this.radius = radius; this.stage = 0; this.shake = 0; this.flying = null; this.t = 0;
  }

  /** A stage of cracks (1, 2, 3): the new cracks glow and the urn shakes. */
  crack(stage) {
    if (stage <= this.stage || this.flying) return;
    this.stage = Math.min(3, stage); this.u.uStage.value = this.stage; this.u.uFlash.value = 1; this.shake = 0.35;
  }

  /** The urn bursts off: the shards fly (away from `dir`, the blow's way, and up), the core is bare. */
  burst(dir = new THREE.Vector3(0, 0, 1)) {
    if (this.flying) return;
    this.crack(3);
    this.urn.visible = false; this.core.visible = true; this.shards.visible = true;
    const r = this.radius;
    this.flying = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2, p = new THREE.Vector3(Math.cos(a) * r, r * (0.2 + Math.random() * 0.6), Math.sin(a) * r);
      const v = p.clone().setY(0).normalize().multiplyScalar(2 + Math.random() * 3).addScaledVector(dir, 2).add(new THREE.Vector3(0, 3 + Math.random() * 3, 0));
      return { p, v, q: new THREE.Quaternion(), w: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), sp: 6 + Math.random() * 10, t: 0 };
    });
  }

  update(raw = 1 / 60) {
    const dt = Math.min(raw, 0.05); this.t += dt;
    this.u.uFlash.value = Math.max(0, this.u.uFlash.value - dt * 2);
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); const k = this.shake * 0.12; this.urn.rotation.set((Math.random() - 0.5) * k, 0, (Math.random() - 0.5) * k); } else this.urn.rotation.set(0, 0, 0);
    this.coreU.uT.value = this.t;
    if (this.core.visible) this.coreU.uA.value = Math.min(1, this.coreU.uA.value + dt * 3);
    if (this.flying) {
      const m = new THREE.Matrix4(), dq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
      let live = 0;
      this.flying.forEach((s, i) => {
        s.t += dt; s.v.y -= 12 * dt; s.p.addScaledVector(s.v, dt); dq.setFromAxisAngle(s.w, s.sp * dt); s.q.premultiply(dq);
        const k = Math.max(0, 1 - Math.max(0, s.t - 1.4) / 0.4); if (k > 0) live++;
        this.shards.setMatrixAt(i, m.compose(s.p, s.q, one.setScalar(k)));
      });
      this.shards.instanceMatrix.needsUpdate = true;
      if (!live) { this.shards.visible = false; this.flying = []; }
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.urn.geometry.dispose(); this.mat.dispose(); this.u.uCrack.value.dispose(); this.core.geometry.dispose(); this.core.material.dispose(); this.shards.geometry.dispose(); this.shards.material.dispose(); }
}
