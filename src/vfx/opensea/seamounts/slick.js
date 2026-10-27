// ---------------------------------------------------------------------------------------
// THE SLICK'S LOOK (the Soul Brush at sea: Dovina's SEA_MOUNTS.soulbrush, Petra's world/opensea/seamounts.js `slicks` and `sea.slick`), a
// part of the mounts' look (vfx/opensea/seamounts.js). Paint laid astern on the water: a disc draped over the drawn sea (a polar grid
// whose heights are the sea's each frame), its edge wandering, spreading to its radius in a beat, glossy (a Fresnel sheen, a thin bright
// rim where it thins), in the brush's feeling's colour and its paint motif (vfx/paintmotifs.js's seven, drawn here in its own small
// program at a ship's scale: frost, dapples, ripples, cracks of light, curds, streaks, marbling), plain ink where no feeling is known,
// fading over its life. A shot or a broadside ball through it SETS IT ALIGHT (Dovina: a look only): fire runs out from where it crossed,
// the paint gone to ember under flames and smoke blown downwind, and charred after, until it fades.
// Prior art: Splatoon's ink and Super Mario Sunshine's goop (a flat bright body, a gloss), Assassin's Creed IV's fire barrels (a burning
// slick a ship is steered through), Sea of Thieves' Kraken ink on the water, oil on water's thin-film rim.
//
//   new SlickLook(M)   .laid(e)   .update(dt)   .parked() -> [mesh]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../../progress/weather.js';
import { PAINT_MOTIF } from '../../paintmotifs.js';

/** rings x spokes: the disc's grid; lift: over the sea (m); grow: real s to its radius; fade: real s out once gone; burn: real s a fire
 *  holds after the last shot through, its front's run (m/s), flames and smoke a real s, how high a shot may pass and still light it (m);
 *  ink: the colour with no feeling known; cap: slicks drawn at once. */
export const SLICK_LOOK = { rings: 7, spokes: 40, lift: 0.18, grow: 1.4, fade: 1.2, burn: { hold: 4, run: 14, flames: 70, smoke: 10, over: 5 }, ink: 0x1d1a26, cap: 4 };
const SL = SLICK_LOOK, B = SL.burn;

const VERT = /* glsl */`
attribute vec2 aPolar;
varying vec3 vW; varying vec2 vP;
void main() { vW = position; vP = aPolar; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */`
uniform vec3 uColor; uniform float uK, uGrow, uBurn, uChar, uTime, uMotif, uSeed, uFront; uniform vec2 uIgnite;
varying vec3 vW; varying vec2 vP;
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { return vn(p) * 0.55 + vn(p * 2.1 + 7.3) * 0.3 + vn(p * 4.3 + 1.7) * 0.15; }
float vor(vec2 p) { vec2 i = floor(p), f = fract(p); float a = 9.0, b = 9.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(x, y), c = o + vec2(h21(i + o), h21(i + o + 5.1)) - f; float d = dot(c, c);
    if (d < a) { b = a; a = d; } else if (d < b) b = d; }
  return sqrt(b) - sqrt(a); }
// (the motif's light part 0..1 at q, in metres: one picture a feeling, paintmotifs.js's, at a hull's scale)
float motif(vec2 q, int m) {
  if (m == 1) { vec2 h = q / 1.6; h.y *= 1.1547; h.x += h.y * 0.5; vec2 f = fract(h) - 0.5; float e = max(abs(f.x), max(abs(f.y), abs(f.x + f.y))); return smoothstep(0.42, 0.5, e); }
  if (m == 2) { vec2 g = q / 2.0; g.x += floor(g.y) * 0.5; vec2 f = fract(g) - 0.5; return 1.0 - smoothstep(0.18, 0.26, length(f) + 0.06 * h21(floor(g))); }
  if (m == 3) { float s = sin(q.x * 1.3 + 2.0 * fbm(q * 0.25) * 3.0 + uTime * 0.4); return smoothstep(0.6, 0.95, s); }
  if (m == 4) { return 1.0 - smoothstep(0.0, 0.09, vor(q / 2.6)); }
  if (m == 5) { return smoothstep(0.58, 0.66, fbm(q * 0.6)) * (0.6 + 0.4 * vn(q * 3.0)); }
  if (m == 6) { float x = q.x * 2.2 + fbm(q * 0.2) * 2.0; return smoothstep(0.85, 1.0, sin(x)) * step(0.35, vn(vec2(floor(x / 6.283), q.y * 0.35))); }
  float c = fbm(q * 0.18 + vec2(uTime * 0.02, 0.0)) * 9.0; return smoothstep(0.82, 1.0, abs(fract(c) * 2.0 - 1.0));
}
void main() {
  float ang = vP.y, r = vP.x;
  float e = uGrow * (0.84 + 0.12 * vn(vec2(ang * 1.9 + uSeed, uSeed)) + 0.04 * sin(ang * 9.0 + uTime * 0.7 + uSeed));
  float mask = 1.0 - smoothstep(e - 0.07, e, r); if (mask <= 0.002) discard;
  vec2 q = vW.xz;
  vec3 col = uColor;
  float lite = motif(q, int(uMotif + 0.5));
  col *= mix(0.72, 1.32, lite);
  vec3 V = normalize(cameraPosition - vW); float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
  float rim = smoothstep(e - 0.16, e - 0.03, r) * (1.0 - smoothstep(e - 0.03, e, r));
  col = mix(col, vec3(0.92, 0.95, 1.0), fres * 0.45) + rim * 0.25 + vec3(0.6, 0.55, 0.7) * pow(vn(q * 0.7 + uTime * 0.3), 6.0) * 0.5;
  // the fire: the paint gone to ember inside the front, tongues of light flickering over it, charred after
  float lit = uBurn * (1.0 - smoothstep(uFront - 3.0, uFront, length(q - uIgnite)));
  float fl = fbm(q * 0.5 + vec2(0.0, -uTime * 2.2)), em = smoothstep(0.35, 0.8, fl);
  vec3 ember = mix(vec3(0.08, 0.025, 0.01), vec3(1.0, 0.42, 0.06), em) + vec3(1.0, 0.85, 0.4) * pow(em, 5.0);
  vec3 charr = mix(vec3(0.06, 0.045, 0.04), vec3(0.5, 0.14, 0.03), step(0.86, vn(q * 1.4)) * 0.8);
  col = mix(col, charr, uChar * 0.85); col = mix(col, ember, lit);
  float a = mask * uK * mix(0.8, 0.95, fres);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** The disc's grid: a centre and `rings` rings of `spokes`, each vertex's (radius share, angle). */
function discGeometry() {
  const R = SL.rings, N = SL.spokes, n = 1 + R * N, pos = new Float32Array(n * 3), pol = new Float32Array(n * 2), idx = [];
  for (let r = 1; r <= R; r++) for (let s = 0; s < N; s++) { const i = 1 + (r - 1) * N + s; pol[i * 2] = r / R; pol[i * 2 + 1] = (s / N) * Math.PI * 2; }
  for (let s = 0; s < N; s++) idx.push(0, 1 + ((s + 1) % N), 1 + s);
  for (let r = 1; r < R; r++) for (let s = 0; s < N; s++) { const a = 1 + (r - 1) * N + s, b = 1 + (r - 1) * N + ((s + 1) % N), c = a + N, d = b + N; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aPolar', new THREE.BufferAttribute(pol, 2)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); return g;
}

export class SlickLook {
  constructor(M) {
    this.M = M; this.looks = new Map(); // (a runtime slick (or one heard with none to read) -> its look)
    this.pool = Array.from({ length: SL.cap }, () => {
      const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color() }, uK: { value: 0 }, uGrow: { value: 0 }, uBurn: { value: 0 }, uChar: { value: 0 }, uTime: { value: 0 }, uMotif: { value: 0 }, uSeed: { value: 0 }, uFront: { value: 0 }, uIgnite: { value: new THREE.Vector2() } } });
      const m = new THREE.Mesh(discGeometry(), mat); m.visible = false; m.frustumCulled = false; m.renderOrder = 3; m.userData.zone = 'opensea'; m.name = 'sea-slick';
      M.game.scene?.add(m); return { mesh: m, mat, busy: false };
    });
  }
  parked() { return [this.pool[0].mesh]; }

  /** sea.slick { at, r, life }: its look, in the brush's feeling now. */
  laid(e) {
    const M = this.M, s = M.fight?.mounts?.slicks?.find((x) => x.at === e.at) || { at: e.at.clone?.() ?? new THREE.Vector3(e.at.x, e.at.y, e.at.z), r: e.r, t: e.life, own: true };
    if (this.looks.has(s)) return;
    const P = this.pool.find((p) => !p.busy) || this.oldest(); if (!P) return;
    const aspect = M.game.paintmap?.aspectOf?.() || null;
    P.busy = true; P.mesh.visible = true;
    const U = P.mat.uniforms; U.uColor.value.setHex(aspect ? COLOR[aspect] : SL.ink); U.uMotif.value = aspect ? PAINT_MOTIF[aspect] : 0; U.uSeed.value = Math.random() * 50;
    U.uBurn.value = 0; U.uChar.value = 0; U.uFront.value = 0; U.uK.value = 0; U.uGrow.value = 0;
    this.looks.set(s, { s, P, life: e.life || s.t || 20, age: 0, gone: -1, burnT: 0, burn: 0, flameA: 0, smokeA: 0, born: M.t });
    M.game.water?.disturb?.(s.at.x, s.at.z, 0.5, 'land', M.surf(s.at.x, s.at.z));
  }
  oldest() { let o = null; for (const L of this.looks.values()) if (!o || L.born < o.born) o = L; if (!o) return null; this.free(o); return o.P; }
  free(L) { L.P.busy = false; L.P.mesh.visible = false; this.looks.delete(L.s); }

  update(dt) {
    const M = this.M, list = M.fight?.mounts?.slicks || [], shots = M.fight?.shots || [];
    for (const L of [...this.looks.values()]) {
      const s = L.s, U = L.P.mat.uniforms;
      if (!M.live) { this.free(L); continue; }
      if (s.own) s.t -= dt;
      const there = s.own ? s.t > 0 : list.includes(s);
      if (!there && L.gone < 0) L.gone = 0;
      if (L.gone >= 0 && (L.gone += dt) >= SL.fade) { this.free(L); continue; }
      L.age += dt;
      const grow = Math.min(1, L.age / SL.grow), left = L.gone >= 0 ? 0 : Math.max(0, s.t ?? 0), fade = L.gone >= 0 ? 1 - L.gone / SL.fade : Math.min(1, left / (L.life * 0.3) + 0.15);
      U.uGrow.value = 1 - (1 - grow) * (1 - grow); U.uK.value = Math.min(1, fade) * Math.min(1, L.age * 3); U.uTime.value = M.t;
      // a shot through it (low enough over the water to touch it) lights it
      const R = s.r * U.uGrow.value * 0.9;
      for (const sh of shots) { const dx = sh.pos.x - s.at.x, dz = sh.pos.z - s.at.z; if (dx * dx + dz * dz < R * R && sh.pos.y < M.surf(sh.pos.x, sh.pos.z) + B.over) this.ignite(L, sh.pos); }
      if (L.burnT > 0) { L.burnT -= dt; L.burn = Math.min(1, L.burn + dt * 3); U.uFront.value = Math.min(s.r * 1.3, U.uFront.value + B.run * dt); U.uChar.value = Math.min(1, U.uChar.value + dt * 0.25); }
      else L.burn = Math.max(0, L.burn - dt * 0.7);
      U.uBurn.value = L.burn * Math.min(1, fade * 1.5);
      this.drape(L, s);
      if (L.burn > 0.05) this.fire(L, s, dt, Math.min(U.uFront.value, R));
    }
  }
  ignite(L, at) {
    const U = L.P.mat.uniforms;
    if (L.burnT <= 0 && L.burn < 0.05) { U.uIgnite.value.set(at.x, at.z); U.uFront.value = 0; const fx = this.M.fx; for (let i = 0; i < 14; i++) fx?.add?.emit({ pos: new THREE.Vector3(at.x, this.M.surf(at.x, at.z) + 0.5, at.z), vel: new THREE.Vector3((Math.random() - 0.5) * 8, 3 + Math.random() * 5, (Math.random() - 0.5) * 8), life: 0.5, size: 0.5, sizeEnd: 0.1, color: 0xffc060, colorEnd: 0xff3a10, alpha: 1, drag: 1.5, gravity: 2, floor: -1e9 }); }
    L.burnT = B.hold;
  }
  /** The disc laid over the sea where it is now. */
  drape(L, s) {
    const M = this.M, pos = L.P.mesh.geometry.attributes.position, pol = L.P.mesh.geometry.attributes.aPolar, r = s.r * 1.08;
    for (let i = 0; i < pos.count; i++) { const k = pol.getX(i) * r, a = pol.getY(i), x = s.at.x + Math.cos(a) * k, z = s.at.z + Math.sin(a) * k; pos.setXYZ(i, x, M.surf(x, z) + SL.lift, z); }
    pos.needsUpdate = true;
  }
  /** Flames over what has caught, smoke over them, both blown downwind. */
  fire(L, s, dt, R) {
    const M = this.M, fx = M.fx; if (!fx || R <= 0.5) return;
    const W = M.game.opensea?.wind, wx = W ? Math.sin(W.to) * W.k * 3 : 0, wz = W ? Math.cos(W.to) * W.k * 3 : 0, I = L.P.mat.uniforms.uIgnite.value;
    const spot = () => { for (let k = 0; k < 4; k++) { const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * R, x = I.x + Math.cos(a) * d, z = I.y + Math.sin(a) * d; if (Math.hypot(x - s.at.x, z - s.at.z) < s.r * 0.85) return [x, z]; } return [s.at.x, s.at.z]; };
    for (L.flameA += dt * B.flames * L.burn; L.flameA >= 1; L.flameA--) { const [x, z] = spot(); fx.add?.emit({ pos: new THREE.Vector3(x, M.surf(x, z) + 0.4, z), vel: new THREE.Vector3(wx * 0.5 + (Math.random() - 0.5), 3 + Math.random() * 4, wz * 0.5 + (Math.random() - 0.5)), life: 0.55 + Math.random() * 0.4, size: 1.1 + Math.random() * 0.8, sizeEnd: 0.2, color: 0xffb048, colorEnd: 0xd8300c, alpha: 0.9, drag: 1.2, gravity: -2.5, floor: -1e9 }); }
    for (L.smokeA += dt * B.smoke * L.burn; L.smokeA >= 1; L.smokeA--) { const [x, z] = spot(); fx.alpha?.emit({ pos: new THREE.Vector3(x, M.surf(x, z) + 2.5, z), vel: new THREE.Vector3(wx, 2.2 + Math.random() * 1.5, wz), life: 2.8, size: 1.8, sizeEnd: 5.5, color: 0x2b2624, alpha: 0.42, drag: 0.5, gravity: -0.6, floor: -1e9 }); }
  }
}
