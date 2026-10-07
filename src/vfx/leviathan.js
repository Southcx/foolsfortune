// ---------------------------------------------------------------------------------------
// OLD NOBODY: the rogue Leviathan (the crossing's set piece, R4; the owner, 2026-10-07; docs/plans/RAIL.md section 7; docs/GLOSSARY.md: an
// Egregore, a thought-form spawned from the Emocean, authored by no one and fed by everyone; Leviathan, the largest class). Petra swims
// it and counts its parts; this is how it looks and how each part answers.
//
//   THE HIDE      crude itself: near-black glass with the oil film walking along its length (world/treasure/cubes.js oilMaterial, the
//                 slick's own colours), so it looks like the sea standing up. Forty metres; it swims by a slow wave down its body
//   FED BY EVERYONE barnacles of solid Lachryma crusted along its back and flanks in every feeling's colour at once (weather.js COLOR):
//                 the widest spread, as an Egregore has no island's Grain (docs/LORE.md)
//   NO FACE       a blunt, blank head, and on its brow one great eye, milky and blind, a scar across it (Nobody, and the Cyclops whom
//                 Nobody blinded: the name's own story)
//   THE GILLS     four a flank behind the head: dark lips that part as it breathes (two bars in four), and inside them red flesh with a
//                 glow in it, the place to shoot. One shot out stays open and dark
//   THE MAW       the lower jaw drops; six teeth of old ivory round the upper jaw (a lance each), and deep in the throat a light that
//                 swells before it spits
//   THE FINS      two long pectorals that sweep (Petra's blow; the fin's raise is the bar's warning)
//   THE BREACH    where its body crosses the surface fast, the crude sheets and sprays off it; the flukes throw a curtain of it
//   THE SHADOW    when it sounds: a dark shape on the sea that grows under you, its barnacles glinting through (draped on the swells)
//
// Prior art: Moby-Dick (the white whale's scarred brow; the beast you survive), Shadow of the Colossus (a body as the arena, its weak points
// glowing), Panzer Dragoon's sea-beasts (alongside, then gone under), Jaws's and Ecco's shadows under the boat, Spirited Away's
// No-Face (a blank face as the most frightening thing), and the Odyssey (Nobody and the one eye).
//
//   const L = new LeviathanLook({ env, fx })   L.group (its own frame: +Z the head, Y up, origin on the spine amidships; 40 m long)
//   L.set({ swim 0..1, bend rad, t })   L.gill(i 0..3, { side 1|-1, open 0..1, gone })   L.breathe(k)   L.maw(k)   L.tooth(i 0..5, gone)
//   L.throat(k)   L.fin(side, k -1..1)   L.shadow(pos, yaw, k 0..1, sea)   L.update(rawDt, sea)
//   L.gillWorld(i, side, out)   L.toothWorld(i, out)   L.throatWorld(out)   L.eyeWorld(out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { oilMaterial } from '../world/treasure/cubes.js';
import { COLOR } from './weather.js';

export const LEVIATHAN = { length: 40, girth: 3.6 };
const NR = 40, NA = 18; // (rings down its length, points round each)
const IVORY = 0xd8ccb0, FLESH = 0xc8382c;

/** Its radius at u (0 the snout .. 1 the tail): a blunt head, a great chest, a long taper to the flukes. */
const radius = (u) => LEVIATHAN.girth * (u < 0.1 ? 0.55 + 0.45 * Math.sin((u / 0.1) * Math.PI / 2) : 1 - 0.88 * THREE.MathUtils.smootherstep(u, 0.22, 0.95)); // (a whale's: the tail stock slim)

const SHADOW_F = /* glsl */`uniform float uK, uT; varying vec2 vU;
void main() {
  vec2 p = vU * 2.0 - 1.0; float body = length(vec2(p.x * 1.0, p.y * (p.y > 0.0 ? 1.0 : 1.25)));          // (a long dark shape, its head end blunt)
  float a = (1.0 - smoothstep(0.6, 1.0, body)) * uK;
  float glint = step(0.997, fract(sin(dot(floor(vU * vec2(30.0, 90.0)), vec2(12.9, 78.2))) * 43758.5)) * step(body, 0.7) * (0.5 + 0.5 * sin(uT * 3.0 + vU.y * 40.0));
  gl_FragColor = vec4(vec3(0.01, 0.008, 0.015) + vec3(0.5, 0.45, 0.6) * glint * 0.4, a * 0.85);
}`;

export class LeviathanLook {
  constructor({ env = null, fx = null } = {}) {
    this.fx = fx; this.t = 0; this.p = { swim: 0.6, bend: 0 };
    this.group = new THREE.Group(); this.group.name = 'leviathan';
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    // the hide: a tube of rings, bent each frame by its swim
    const n = (NR + 1) * NA, pos = new Float32Array(n * 3), seed = new Float32Array(n), idx = [];
    for (let r = 0; r <= NR; r++) for (let a = 0; a < NA; a++) { seed[r * NA + a] = (r / NR) * 0.7; if (r < NR) { const i = r * NA + a, j = r * NA + ((a + 1) % NA); idx.push(i, i + NA, j, j, i + NA, j + NA); } }
    const tip = n; const tail = n + 1; // (the snout's and the tail's caps)
    const P = new Float32Array((n + 2) * 3); P.set(pos);
    for (let a = 0; a < NA; a++) { idx.push(tip, a, (a + 1) % NA); idx.push(tail, NR * NA + ((a + 1) % NA), NR * NA + a); }
    const S = new Float32Array(n + 2); S.set(seed);
    this.hideG = track(new THREE.BufferGeometry());
    this.hideG.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage)); this.hideG.setAttribute('aSeed', new THREE.BufferAttribute(S, 1)); this.hideG.setIndex(idx);
    this.oil = oilMaterial({ env, envIntensity: 0.1, uni: { uOil: { value: 0.22 }, uOilPow: { value: 3.4 }, uHue: { value: 0 } } }); track(this.oil.mat);
    this.hide = new THREE.Mesh(this.hideG, this.oil.mat); this.hide.frustumCulled = false; this.hide.castShadow = true; this.group.add(this.hide);
    this.frames = Array.from({ length: NR + 1 }, () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3() }));
    // the flukes: a wide flat fin at the tail
    const flukeShape = new THREE.Shape(); flukeShape.moveTo(0, 0.6); flukeShape.quadraticCurveTo(4, 1.6, 6.5, -1.6); flukeShape.quadraticCurveTo(3.5, -0.4, 0, -1.4); flukeShape.quadraticCurveTo(-3.5, -0.4, -6.5, -1.6); flukeShape.quadraticCurveTo(-4, 1.6, 0, 0.6);
    const flukeG = track(new THREE.ShapeGeometry(flukeShape, 6)); flukeG.rotateX(Math.PI / 2); flukeG.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(flukeG.attributes.position.count).fill(0.7), 1));
    const finMat = this.oil.mat; this.flukes = new THREE.Mesh(flukeG, finMat); this.group.add(this.flukes);
    // the pectoral fins
    const finShape = new THREE.Shape(); finShape.moveTo(0, -1.0); finShape.quadraticCurveTo(4, -1.6, 9, -3.2); finShape.quadraticCurveTo(9.6, -2.2, 8.6, -1.6); finShape.quadraticCurveTo(4.5, 0.9, 0, 1.1); finShape.lineTo(0, -1.0); // (a humpback's: long, broad, its tip rounded)
   
    const finG = track(new THREE.ShapeGeometry(finShape, 6)); finG.rotateX(Math.PI / 2); finG.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(finG.attributes.position.count).fill(0.35), 1));
    this.fins = [1, -1].map((side) => { const pivot = new THREE.Group(), m = new THREE.Mesh(finG, finMat); m.scale.x = side; pivot.add(m); this.group.add(pivot); return { side, pivot, k: 0, to: 0 }; });
    for (const o of [this.flukes, ...this.fins.map((f) => f.pivot.children[0])]) { o.material.side = THREE.DoubleSide; o.castShadow = true; }
    // the barnacles: solid Lachryma in every feeling's colour, crusted on its back
    const feel = Object.values(COLOR), NB = 70;
    this.barn = new THREE.InstancedMesh(track(new THREE.OctahedronGeometry(0.22, 0)), track(new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.4, flatShading: true, emissive: 0x120e16 })), NB);
    this.barnAt = []; const rnd = mulberry(7);
    for (let i = 0; i < NB; i++) { // (crusted thickest on its head and chin, as barnacles are on a humpback; a scatter down its back)
      const head = i < NB * 0.6, u = head ? 0.03 + rnd() * 0.16 : 0.2 + rnd() * 0.5, ang = head ? Math.PI / 2 + (rnd() - 0.5) * 3.6 : Math.PI / 2 + (rnd() - 0.5) * 1.4;
      this.barnAt.push({ u, ang, s: (0.5 + rnd() * 1.0) * (rnd() < 0.15 ? 1.4 : 1), spin: rnd() * 6 }); this.barn.setColorAt(i, _c.setHex(feel[i % feel.length]).multiplyScalar(0.45));
    }
    this.barn.frustumCulled = false; this.group.add(this.barn);
    // the head's furniture rides the first rings' frame: the eye, the jaw, the teeth, the throat, the gills
    this.head = new THREE.Group(); this.group.add(this.head);
    const G0 = LEVIATHAN.girth;
    this.eye = new THREE.Mesh(track(new THREE.SphereGeometry(0.75, 14, 10)), track(new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.35, emissive: 0x8a96a0, emissiveIntensity: 0.45 })));
    this.eye.scale.set(1.2, 0.8, 0.45); this.eye.position.set(0, G0 * 0.3, G0 * 0.78); this.head.add(this.eye); // (on the brow of its blunt face)
    const scar = new THREE.Mesh(track(new THREE.BoxGeometry(0.09, 1.1, 0.08)), track(new THREE.MeshStandardMaterial({ color: 0x3e3533, roughness: 0.9 })));
    scar.position.copy(this.eye.position).add(_v.set(0, 0, 0.32)); scar.rotation.z = 0.7; this.head.add(scar);
    // the lower jaw: a hinged shell under the snout, dark flesh inside
    this.jaw = new THREE.Group(); this.jaw.position.set(0, -G0 * 0.25, -G0 * 1.15); this.head.add(this.jaw);
    const jawG = track(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)); jawG.scale(G0 * 0.85, G0 * 0.45, G0 * 1.0); jawG.translate(0, 0, G0 * 1.0);
    jawG.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(jawG.attributes.position.count).fill(0.05), 1));
    this.jaw.add(new THREE.Mesh(jawG, this.oil.mat));
    const mouth = track(new THREE.MeshStandardMaterial({ color: 0x2a0b10, roughness: 0.6, side: THREE.DoubleSide }));
    const tongue = new THREE.Mesh(track(new THREE.CircleGeometry(1, 20)), mouth); tongue.rotation.x = -Math.PI / 2; tongue.scale.set(G0 * 0.8, G0 * 0.95, 1); tongue.position.set(0, 0.02, G0 * 1.0); this.jaw.add(tongue);
    const palate = new THREE.Mesh(track(new THREE.CircleGeometry(1, 20)), mouth); palate.rotation.x = Math.PI / 2; palate.scale.set(G0 * 0.78, G0 * 0.9, 1); palate.position.set(0, -G0 * 0.25, -G0 * 0.25); this.head.add(palate);
    // the throat: a light deep in, that swells before it spits
    this.throatMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    this.throatM = new THREE.Mesh(track(new THREE.CircleGeometry(G0 * 0.26, 18)), this.throatMat); this.throatM.position.set(0, -G0 * 0.3, -G0 * 0.55); this.head.add(this.throatM);
    // six teeth of old ivory, round the upper jaw's rim
    const ivory = track(new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.5, flatShading: true }));
    this.teeth = []; const toothG = track(new THREE.ConeGeometry(0.28, 1.5, 5)); toothG.rotateX(Math.PI);
    for (let i = 0; i < 6; i++) { const a = -1 + (i / 5) * 2, m = new THREE.Mesh(toothG, ivory); m.position.set(a * G0 * 0.6, -G0 * 0.25 - 0.7, G0 * 0.55 - G0 * 0.45 * a * a); m.scale.setScalar(1 - 0.25 * Math.abs(a)); this.head.add(m); this.teeth.push({ m, gone: false }); }
    // the gills: four a flank, lips that part over red flesh
    this.gills = { 1: [], [-1]: [] };
    const lip = this.oil.mat, fleshG = track(new THREE.PlaneGeometry(0.5, 2.6)), lipG = track(new THREE.BoxGeometry(0.25, 2.8, 0.5));
    lipG.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(lipG.attributes.position.count).fill(0.2), 1));
    for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
      const root = new THREE.Group(); this.group.add(root);
      const fleshM = track(new THREE.MeshBasicMaterial({ color: FLESH })), flesh = new THREE.Mesh(fleshG, fleshM); flesh.position.z = 0.05; root.add(flesh);
      const lips = [-1, 1].map((s) => { const l = new THREE.Mesh(lipG, lip); l.position.set(s * 0.18, 0, 0.15); root.add(l); return l; });
      this.gills[side].push({ root, flesh, fleshM, lips, u: 0.17 + i * 0.035, open: 0, k: 0, gone: false });
    }
    // the shadow on the sea when it sounds
    this.su = { uK: { value: 0 }, uT: { value: 0 } };
    this.shadowM = new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2, 12, 24).rotateX(-Math.PI / 2)), track(new THREE.ShaderMaterial({ name: 'leviathan-shadow', uniforms: this.su, vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: SHADOW_F, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
    this.shadowM.visible = false; this.shadowM.frustumCulled = false; this.shadowM.renderOrder = 2;
    this.k = { maw: 0, mawTo: 0, throat: 0, throatTo: 0 }; this.prev = null; this.sprayAcc = 0;
    this.update(0);
  }

  set({ swim = this.p.swim, bend = this.p.bend, t } = {}) { this.p.swim = swim; this.p.bend = bend; if (t != null) this.t = t; }
  gill(i, { side = 1, open = 0, gone = false } = {}) { const g = this.gills[side]?.[i]; if (g) { g.open = gone ? 1 : open; g.gone = gone; } }
  breathe(k) { for (const s of [1, -1]) for (const g of this.gills[s]) if (!g.gone) g.open = k; }
  maw(k) { this.k.mawTo = THREE.MathUtils.clamp(k, 0, 1); }
  tooth(i, gone = true) { const t = this.teeth[i]; if (t) { t.gone = gone; t.m.visible = !gone; } }
  throat(k) { this.k.throatTo = THREE.MathUtils.clamp(k, 0, 1); }
  fin(side, k) { const f = this.fins.find((x) => x.side === side); if (f) f.to = THREE.MathUtils.clamp(k, -1, 1); }
  /** The shape on the sea when it sounds: where (its head's way, `yaw`), how near the surface (k), on the swells of `sea`. */
  shadow(pos, yaw, k, sea = null) {
    const M = this.shadowM; this.su.uK.value = k; M.visible = k > 0.01;
    if (M.visible && !M.parent && this.group.parent) { M.userData.zoneFree = this.group.userData.zoneFree; this.group.parent.add(M); }
    if (!M.visible) return;
    const L = LEVIATHAN.length * (0.6 + 0.4 * k), W = LEVIATHAN.girth * 2.8 * (0.6 + 0.4 * k), c = Math.cos(yaw), s = Math.sin(yaw);
    M.position.set(0, 0, 0); M.rotation.set(0, 0, 0); M.scale.set(1, 1, 1);
    const P = M.geometry.attributes.position, B = (this._sb ||= Float32Array.from(P.array));
    for (let i = 0; i < P.count; i++) { const lx = B[i * 3] * W / 2, lz = -B[i * 3 + 2] * L / 2, x = pos.x + lx * c + lz * s, z = pos.z - lx * s + lz * c; P.setXYZ(i, x, (sea?.heightAt?.(x, z) ?? pos.y) + 0.08, z); }
    P.needsUpdate = true;
  }

  gillWorld(i, side = 1, out = new THREE.Vector3()) { return this.gills[side][i].root.getWorldPosition(out); }
  toothWorld(i, out = new THREE.Vector3()) { return this.teeth[i].m.getWorldPosition(out); }
  throatWorld(out = new THREE.Vector3()) { return this.throatM.getWorldPosition(out); }
  eyeWorld(out = new THREE.Vector3()) { return this.eye.getWorldPosition(out); }

  update(raw = 1 / 60, sea = null) {
    this.t += raw; const t = this.t, Lh = LEVIATHAN.length, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    this.su.uT.value = t;
    // the spine: a slow wave down the body, growing toward the tail, and a bend to turn
    const F = this.frames, sw = this.p.swim, bend = this.p.bend;
    for (let r = 0; r <= NR; r++) { const u = r / NR, z = Lh * (0.5 - u); F[r].p.set(Math.sin(u * u * 2.2) * bend * Lh * 0.25, sw * (0.15 + 1.6 * u * u) * Math.sin(u * 5.5 - t * 1.4), z); }
    for (let r = 0; r <= NR; r++) {
      const a = F[Math.max(0, r - 1)].p, b = F[Math.min(NR, r + 1)].p, f = F[r];
      f.t.subVectors(a, b).normalize(); f.b.crossVectors(_up, f.t).normalize(); f.n.crossVectors(f.t, f.b).normalize(); // (t toward the head; b to its right... its left; n up)
    }
    const P = this.hideG.attributes.position;
    for (let r = 0; r <= NR; r++) {
      const u = r / NR, f = F[r], R = radius(u);
      const chin = THREE.MathUtils.smoothstep(u, 0.08, 0.14); // (the head's underside is its palate, flat: the jaw hangs below it)
      for (let a = 0; a < NA; a++) { const th = (a / NA) * Math.PI * 2, cx = Math.cos(th) * R; let cy = Math.sin(th) * R * (Math.sin(th) < 0 ? 0.62 : 0.85) + R * 0.22 * Math.exp(-(((th - Math.PI / 2) / 0.3) ** 2)) * THREE.MathUtils.smoothstep(u, 0.25, 0.4) * (1 - THREE.MathUtils.smoothstep(u, 0.75, 0.95)); if (cy < 0) cy = THREE.MathUtils.lerp(Math.max(cy, -LEVIATHAN.girth * 0.25), cy, chin); P.setXYZ(r * NA + a, f.p.x + f.b.x * cx + f.n.x * cy, f.p.y + f.b.y * cx + f.n.y * cy, f.p.z + f.b.z * cx + f.n.z * cy); }
    }
    const tipF = F[0], tailF = F[NR]; P.setXYZ(NR * NA + NA, tipF.p.x + tipF.t.x * 0.35, tipF.p.y + tipF.t.y * 0.35 - 0.3, tipF.p.z + tipF.t.z * 0.35); P.setXYZ(NR * NA + NA + 1, tailF.p.x, tailF.p.y, tailF.p.z); // (a blunt, flat face; the tail's tip)
    P.needsUpdate = true; this.hideG.computeVertexNormals();
    const place = (o, f) => { o.position.copy(f.p); _m.makeBasis(f.b, f.n, f.t); o.quaternion.setFromRotationMatrix(_m); };
    // the head's furniture on ring 2, the flukes past the tail, the fins at the chest
    place(this.head, F[2]); this.head.position.addScaledVector(F[2].t, -0.3);
    place(this.flukes, tailF); this.flukes.position.addScaledVector(tailF.t, -0.6); this.flukes.rotateX(Math.sin(1 * 5.5 - t * 1.4) * 0.3 * sw);
    for (const fn of this.fins) {
      const f = F[Math.round(NR * 0.27)], R = radius(0.27); place(fn.pivot, f); fn.pivot.position.addScaledVector(f.b, fn.side * R * 0.95).addScaledVector(f.n, -R * 0.35);
      fn.k = ease(fn.k, fn.to, 4); fn.pivot.rotateZ(fn.side * (-0.4 + 1.0 * fn.k + 0.08 * Math.sin(t * 1.1))); fn.pivot.rotateY(fn.side * -0.5 * Math.abs(fn.k)); // (at rest they hang; raised, the sweep is coming)
    }
    // the barnacles, ridden on the hide
    for (const [i, b] of this.barnAt.entries()) {
      const fr = b.u * NR, r0 = Math.floor(fr), f = F[r0], R = radius(b.u) * 0.97, cx = Math.cos(b.ang) * R, cy = Math.sin(b.ang) * R * (Math.sin(b.ang) < 0 ? 0.62 : 0.85);
      _v.copy(f.p).addScaledVector(f.b, cx).addScaledVector(f.n, cy); _q.setFromEuler(_e.set(b.spin, b.spin * 1.3, 0)); _s.setScalar(b.s);
      this.barn.setMatrixAt(i, _m.compose(_v, _q, _s));
    }
    this.barn.instanceMatrix.needsUpdate = true;
    // the gills: the lips part, the flesh glows with the breath; one shot out stays open and dark
    for (const side of [1, -1]) for (const g of this.gills[side]) {
      const fr = g.u * NR, f = F[Math.round(fr)], R = radius(g.u);
      place(g.root, f); g.root.position.addScaledVector(f.b, side * R * 0.98); g.root.rotateY(side * Math.PI / 2); g.root.rotateZ(side * 0.12);
      g.k = ease(g.k, g.open, 5);
      g.lips[0].position.x = -0.12 - g.k * 0.3; g.lips[1].position.x = 0.12 + g.k * 0.3; g.flesh.scale.x = 0.25 + 1.4 * g.k;
      g.fleshM.color.setHex(g.gone ? 0x1a0606 : FLESH).multiplyScalar(g.gone ? 1 : 0.4 + 0.8 * g.k * (0.8 + 0.2 * Math.sin(t * 4 + g.u * 50)));
    }
    // the maw, and the light in its throat
    this.k.maw = ease(this.k.maw, this.k.mawTo, 3); this.jaw.rotation.x = this.k.maw * 0.75;
    this.k.throat = ease(this.k.throat, this.k.throatTo, 5); const th = this.k.throat * (0.85 + 0.15 * Math.sin(t * 12));
    this.throatMat.color.setRGB(1, 0.3, 0.12).multiplyScalar(0.06 + 0.8 * th); this.throatM.scale.setScalar(0.7 + 0.6 * this.k.throat);
    this.oil.uni.uHue.value = t * 0.01; // (the film creeps along it, slowly)
    // the breach: where its body crosses the surface fast, the crude sheets and sprays off it
    const fx = this.fx; if (!fx || !sea || raw <= 0) return;
    this.group.updateMatrixWorld(true);
    const now = (this._now ||= F.map(() => new THREE.Vector3())), was = this.prev;
    for (let r = 0; r <= NR; r += 2) now[r].copy(F[r].p).applyMatrix4(this.group.matrixWorld);
    if (was) for (let r = 0; r <= NR; r += 2) {
      const p = now[r], h = sea.heightAt?.(p.x, p.z) ?? 0, vy = (p.y - was[r].y) / raw, R = radius(r / NR);
      if (Math.abs(p.y - h) > R * 0.9 || Math.abs(vy) < 2) continue; // (only where its back is breaking the surface, and fast)
      this.sprayAcc += raw * Math.abs(vy) * 2;
      while (this.sprayAcc >= 1) {
        this.sprayAcc -= 1; const a = Math.random() * Math.PI * 2, at = _v.set(p.x + Math.cos(a) * R, h + 0.2, p.z + Math.sin(a) * R);
        fx.alpha.emit({ pos: at.clone(), vel: _d.set(Math.cos(a) * 3, Math.abs(vy) * (0.5 + Math.random() * 0.6), Math.sin(a) * 3).clone(), life: 1.4, size: 0.35, sizeEnd: 0.1, color: new THREE.Color(0x120e16), alpha: 0.9, drag: 0.6, gravity: 9.8 });
        if (Math.random() < 0.35) fx.alpha.emit({ pos: at.clone(), vel: _d.set(Math.cos(a) * 1.5, Math.abs(vy) * 0.3, Math.sin(a) * 1.5).clone(), life: 1.8, size: 0.8, sizeEnd: 2.4, color: new THREE.Color(0x4a4252), alpha: 0.35, drag: 1.5, gravity: 0.5 });
      }
    }
    this.prev = (this._was ||= F.map(() => new THREE.Vector3())); for (let r = 0; r <= NR; r += 2) this.prev[r].copy(now[r]);
  }

  dispose() { this.group.parent?.remove(this.group); this.shadowM.parent?.remove(this.shadowM); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.(); this.barn.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _c = new THREE.Color();
