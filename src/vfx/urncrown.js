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
//   THE TELL   tell(k): through the ram's 1.0 s scrape the broken edge and the cracks brighten and the urn trembles (the body is the
//              telegraph: no floor marker, docs/plans/DUNEMAW-EXTREME.md)
//   ANY SIZE   the Great Slip Jelly's body stands 21 m (FOE.size, progress/combat/dunemaw.js), so the urn is 17 m across: what is drawn
//              in its own space (the glaze, the crackle, the cracks) grows with it; what is not is held to its size: the cracks' Lachryma
//              turns once across the urn whatever its size (its phase over the urn's own radius in the world), the silhouette is smooth
//              (a lathe of 120 sides round a profile eased through its points; the broken lip still the forty-sided jag the JELLY-CROWN
//              glaze copies, vfx/finish.js finLip), the underside is closed by the urn's flesh (the jelly swollen up into it: from the
//              floor the crown is seen from below), and the shards fly as big things fall (Froude scaling, as miniature effects are shot:
//              speeds by the square root of the size, real gravity, so a 17 m urn's sherds fall slow and heavy to its feet).
//
//   const U = new UrnCrown({ radius })   head.add(U.group)   U.crack(stage)   U.tell(k)   U.burst(dir?)   U.update(rawDt)   U.stage   U.core (the weak point's mesh)
//   U.top (the urn's top over the group's origin, in the group's units: what a body adds to its height for it)
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

/** The broken lip's jag at angle a: round forty sides, straight between them as a fracture runs (vfx/finish.js finLip copies it). */
const JAG = (a) => 0.12 * Math.abs(Math.sin(a * 7.0)) + 0.08 * Math.abs(Math.sin(a * 17.0 + 1.3)) + 0.05 * Math.sin(a * 31.0);
const LIP_SIDES = 40, SIDES = 120;
function lipJag(a) { const s = (Math.PI * 2) / LIP_SIDES, u = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), i = Math.floor(u / s); return JAG(i * s) + (JAG((i + 1) * s) - JAG(i * s)) * (u / s - i); }

/** The urn's top half as a lathe: the broken edge (jagged) at the bottom, the shoulder, the neck, the lip. Unit size (radius 1). The
 *  profile is eased through its ten points (a Catmull-Rom curve), so at 17 m across the shoulder reads as thrown, not cut in facets. */
function urnGeometry() {
  const P = [[1.0, 0.0], [1.06, 0.12], [1.02, 0.3], [0.86, 0.48], [0.6, 0.6], [0.5, 0.74], [0.52, 0.84], [0.62, 0.9], [0.58, 0.93], [0.46, 0.9]];
  const curve = new THREE.CatmullRomCurve3(P.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  const prof = curve.getPoints(36).map((p) => new THREE.Vector2(p.x, p.y));
  const g = new THREE.LatheGeometry(prof, SIDES);
  // the broken edge: the lowest ring of vertices pushed up and down, jagged
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    if (uv.getY(i) > 0.001) continue;
    pos.setY(i, pos.getY(i) + lipJag(Math.atan2(pos.getZ(i), pos.getX(i))));
  }
  g.computeVertexNormals();
  return g;
}

export class UrnCrown {
  constructor({ radius = 0.5 } = {}) {
    this.u = { uStage: { value: 0 }, uFlash: { value: 0 }, uTell: { value: 0 }, uUrnR: { value: radius }, uMindT: mindTime, uCrack: { value: urnTexture() } }; // (uUrnR: the urn's radius in the world, set each update)
    const m = this.mat = new THREE.MeshStandardMaterial({ name: 'urn-crown', color: 0x9cc7c8, roughness: 0.3, metalness: 0.0, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUrnUv; varying vec3 vUrnW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvUrnUv = uv; vUrnW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform sampler2D uCrack; uniform float uStage, uFlash, uTell, uUrnR; varying vec2 vUrnUv; varying vec3 vUrnW;\n${LAB_GLSL}\nfloat urnCrack;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
{ vec4 k = texture2D(uCrack, vUrnUv);
  diffuseColor.rgb = mix(vec3(0.36, 0.58, 0.62), vec3(0.28, 0.5, 0.6), vUrnUv.y) * (1.0 - 0.35 * k.g); // (ru's sky-blue celadon, crazed: deep enough to hold its colour under a warm light)
  float lvl = k.r * 3.0; urnCrack = step(0.5, lvl) * step(lvl, uStage + 0.5); // (a crack shows once its stage has come)
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.03, 0.08), urnCrack * 0.85); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += labradorite(dot(vUrnW, vec3(0.7, 1.3, 0.5)) / max(uUrnR, 0.05) + uMindT * 0.1) * urnCrack * (0.6 + 0.6 * uStage / 3.0 + 1.5 * uFlash); // (the Lachryma pressing out)
  totalEmissiveRadiance += labradorite(vUrnUv.x * 2.0 + uMindT * 0.3) * uTell * (1.6 * (1.0 - smoothstep(0.0, 0.3, vUrnUv.y)) + 2.6 * urnCrack); // (the ram's tell: the broken edge and its cracks brighten through the scrape)`);
    };
    m.customProgramCacheKey = () => 'urn-crown';
    this.urn = new THREE.Mesh(urnGeometry(), m); this.urn.name = 'urn-crown';
    this.urn.scale.setScalar(radius); this.urn.position.y = -radius * 0.15; // (the broken edge bites down round the head)
    this.urn.geometry.computeBoundingBox(); this.urnTop = this.urn.geometry.boundingBox.max.y * radius + this.urn.position.y;
    // the flesh: the jelly swollen up into the urn it outgrew, wet where the urn holds it, bulging out under the broken edge's teeth
    // (from the floor a 21 m jelly's crown is seen from below: without it the urn is a hollow shade over a pin)
    this.flesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.97, 48, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ name: 'urn-flesh', color: 0x7d5f3e, roughness: 0.6 }));
    this.flesh.name = 'urn-flesh'; this.flesh.scale.y = 0.4; this.flesh.position.y = radius * 0.08; // (its rim just inside the urn's wall, above the lowest teeth)
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
    this.group = new THREE.Group(); this.group.name = 'urn-crown'; this.group.add(this.urn, this.flesh, this.core, this.shards);
    this.radius = radius; this.stage = 0; this.shake = 0; this.flying = null; this.t = 0;
  }

  /** A stage of cracks (1, 2, 3): the new cracks glow and the urn shakes. */
  crack(stage) {
    if (stage <= this.stage || this.flying) return;
    this.stage = Math.min(3, stage); this.u.uStage.value = this.stage; this.u.uFlash.value = 1; this.shake = 0.35;
  }

  /** The ram's tell (DUNEMAW-ARENA.md: it lowers its crown and scrapes for 1.0 sim s): 0..1 through the scrape, 0 when it charges.
   *  The broken edge and the cracks brighten and the urn trembles, so the crown itself says the charge is coming. */
  tell(k) { this.u.uTell.value = THREE.MathUtils.clamp(k, 0, 1); }

  /** The urn bursts off: the shards fly (away from `dir`, the blow's way, and up), the core is bare. They fall as big things fall (Froude
   *  scaling, the miniature effects' rule: an urn λ times the metre it was drawn at keeps its speeds over √λ, real gravity, so its
   *  times run √λ long), tumble down to the feet of the body that wore it, and lie there a beat before they go. */
  burst(dir = new THREE.Vector3(0, 0, 1)) {
    if (this.flying) return;
    this.crack(3);
    this.urn.visible = false; this.flesh.visible = false; this.core.visible = true; this.shards.visible = true;
    const r = this.radius, lam = Math.max(1, r * this.group.getWorldScale(_s).x), f = Math.sqrt(lam);
    this.fall = { g: 12 / lam, floor: -this.group.position.y }; // (in the group's own units: its parent's origin is the feet)
    let top = this.group; while (top.parent) top = top.parent;
    if (top !== this.group) { this.group.updateWorldMatrix(true, false); top.attach(this.shards); } // (left in the world where it burst: the body reels and sinks without them)
    this.flying = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2, p = new THREE.Vector3(Math.cos(a) * r, r * (0.2 + Math.random() * 0.6), Math.sin(a) * r);
      const v = p.clone().setY(0).normalize().multiplyScalar(0.5 + Math.random() * 0.8).addScaledVector(dir, 0.5).add(new THREE.Vector3(0, 3 + Math.random() * 3, 0)).divideScalar(f); // (out a radius or two and up: they land round its feet)
      return { p, v, q: new THREE.Quaternion(), w: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), sp: (6 + Math.random() * 10) / f, t: 0, life: 1.4 * f, down: false };
    });
  }

  /** The urn's top over the group's origin, in the group's units (what a body adds to its own height for the crown it wears). */
  get top() { return this.urnTop; }

  update(raw = 1 / 60) {
    const dt = Math.min(raw, 0.05); this.t += dt;
    this.u.uUrnR.value = this.radius * this.group.getWorldScale(_s).x; // (the urn's radius in the world: the cracks' Lachryma reads it)
    this.u.uFlash.value = Math.max(0, this.u.uFlash.value - dt * 2);
    const tk = this.u.uTell.value * 0.03; // (a tremble through the scrape, growing)
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); const k = this.shake * 0.12 + tk; this.urn.rotation.set((Math.random() - 0.5) * k, 0, (Math.random() - 0.5) * k); } else this.urn.rotation.set((Math.random() - 0.5) * tk, 0, (Math.random() - 0.5) * tk);
    this.coreU.uT.value = this.t;
    if (this.core.visible) this.coreU.uA.value = Math.min(1, this.coreU.uA.value + dt * 3);
    if (this.flying) {
      const m = new THREE.Matrix4(), dq = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
      let live = 0;
      this.flying.forEach((s, i) => {
        s.t += dt;
        if (!s.down) { s.v.y -= this.fall.g * dt; s.p.addScaledVector(s.v, dt); dq.setFromAxisAngle(s.w, s.sp * dt); s.q.premultiply(dq); if (s.p.y < this.fall.floor) { s.p.y = this.fall.floor; s.down = true; } } // (down on the sand: it lies still)
        const k = Math.max(0, 1 - Math.max(0, s.t - s.life) / 0.4); if (k > 0) live++;
        this.shards.setMatrixAt(i, m.compose(s.p, s.q, one.setScalar(k)));
      });
      this.shards.instanceMatrix.needsUpdate = true;
      if (!live) { this.shards.visible = false; this.flying = []; }
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.shards.parent?.remove(this.shards); this.urn.geometry.dispose(); this.mat.dispose(); this.u.uCrack.value.dispose(); this.flesh.geometry.dispose(); this.flesh.material.dispose(); this.core.geometry.dispose(); this.core.material.dispose(); this.shards.geometry.dispose(); this.shards.material.dispose(); }
}
const _s = new THREE.Vector3();
