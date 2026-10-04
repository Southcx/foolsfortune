// ---------------------------------------------------------------------------------------
// THE RETICLE: precognition, since it is psychic fishing after all. A lock-on drawn on the fish itself, in the world: four corner
// brackets that close in as something is about to happen, an arc around it that is what the fish has left in it (its stamina),
// and at the centre a mark for WHAT it is about to do, shown a beat before it does it: a pair of chevrons the way it is going to
// pull (lean the other way), a chevron down for a dive (haul back), a chevron up for a leap (bow to it), a burst for a thrash
// (brace), three dots for a rest (reel). The colour says how hard: cool for a rest, amber for a pull, gold for a leap, red for
// the thrash. There are no words and no numbers on it; the fight's whole state is here, on the fish, and in the line.
//
// Prior art: Zelda's Z-target brackets (a marker on the thing you are locked to, closing in), Hades' and Monster Hunter's attack
// telegraphs (the danger shows before it lands, keyed by colour and shape), and Persona's all-seeing foresight. One billboard quad
// with a procedural shader (no texture, no scrolling): the brackets spin in as they lock, the rest is static.
//
// Its brackets are the Mind's (vfx/labradorite.js): black labradorite, softly rainbow; the arc and the mark keep the colour of what is
// about to happen. Made with { mind: true } (the lock-on), the whole of it is the Mind's: each stroke ink-edged with the schiller in it.
//
//   const r = new Reticle(scene, { mind })
//   r.set({ pos, size, color, icon: 'chevron'|'burst'|'dots'|'none', dir: [x, y] (screen), lock: 0..1, stam: 0..1, flash: 0..1 })
//   r.hide()      r.update(dt, camera)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { backOut } from '../../../vfx/chevron.js';
import { LAB_GLSL, mindTime, mindTick } from '../../../vfx/labradorite.js';

const V = `varying vec2 vUv; varying vec3 vW; uniform float uSize;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz + vec3(position.xy * uSize, 0.0);
  mv.xy += position.xy * uSize;
  gl_Position = projectionMatrix * mv;
}`;

const F = `varying vec2 vUv; varying vec3 vW;
uniform vec3 uColor; uniform float uLock, uStam, uIcon, uFlash, uAlpha, uPop, uMind; uniform vec2 uDir;
${LAB_GLSL}
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// a stroke at distance d: the line itself, and (wider) the ink it is laid in
float core(float d, float a, float b) { return 1.0 - smoothstep(a, b, d); }
void main() {
  vec2 p = (vUv * 2.0 - 1.0) / max(0.05, uPop);
  float r = length(p), a = atan(p.y, p.x);
  // the corner brackets, closing as it locks (and spinning into place)
  float sc = mix(1.42, 1.0, uLock) - 0.1 * uFlash;
  vec2 q = abs(rot((1.0 - uLock) * 0.85) * p / sc);
  float dBx = abs(q.x - 0.8) + (step(q.y, 0.8) * step(0.46, q.y) > 0.5 ? 0.0 : 9.0);
  float dBy = abs(q.y - 0.8) + (step(q.x, 0.8) * step(0.46, q.x) > 0.5 ? 0.0 : 9.0);
  float dBr = min(dBx, dBy);
  float brackets = core(dBr, 0.02, 0.055);
  float bInk = core(dBr, 0.05, 0.1);
  // the arc: what the fish has left in it, clockwise from the top
  float ang = mod(1.5707963 - a + 6.2831853, 6.2831853);
  float dRing = abs(r - 0.6);
  float ring = core(dRing, 0.014, 0.034);
  float arc = ring * step(ang, clamp(uStam, 0.0, 1.0) * 6.2831853);
  float arcBg = ring * 0.2;
  // the mark at the centre
  float icon = 0.0;
  if (uIcon > 0.5 && uIcon < 1.5) { // chevrons, along uDir
    vec2 d = normalize(uDir + vec2(1e-4)); vec2 s = vec2(dot(p, d), dot(p, vec2(-d.y, d.x)));
    float best = 9.0;
    for (int i = 0; i < 2; i++) {
      float ox = -0.2 + float(i) * 0.27;
      best = min(best, min(seg(s, vec2(ox - 0.15, 0.2), vec2(ox + 0.07, 0.0)), seg(s, vec2(ox + 0.07, 0.0), vec2(ox - 0.15, -0.2))));
    }
    icon = core(best, 0.03, 0.062);
  } else if (uIcon > 1.5 && uIcon < 2.5) { // a burst
    float st = r - (0.17 + 0.1 * cos(8.0 * a + 0.4));
    icon = max(core(abs(st), 0.012, 0.04), (1.0 - smoothstep(-0.02, 0.02, st)) * 0.55);
  } else if (uIcon > 2.5 && uIcon < 3.5) { // three dots
    float d3 = min(length(p - vec2(-0.22, 0.0)), min(length(p), length(p - vec2(0.22, 0.0))));
    icon = core(d3, 0.05, 0.075);
  }
  float glow = uFlash * 0.5 * (1.0 - smoothstep(0.0, 1.05, r)) * 0.4;
  // the Mind's colour where this fragment is, seen from the eye (a billboard: the view is along the camera's axis)
  vec3 lab = labSoft(labPhase(vW, normalize(cameraPosition - vW)) + 0.08 * a);
  if (uMind > 0.5) {
    // all of it the Mind's: ink-edged strokes with the schiller in them (normal blending)
    float m = max(max(brackets, arc), max(arcBg * 0.6, icon));
    float ink = max(bInk, max(core(dRing, 0.03, 0.07) * (0.3 + 0.7 * step(ang, clamp(uStam, 0.0, 1.0) * 6.2831853)), icon));
    vec3 c = mix(LAB_INK, lab * (1.15 + 0.6 * uFlash), clamp(m + glow, 0.0, 1.0));
    gl_FragColor = vec4(c, clamp(max(ink * 0.85, m), 0.0, 1.0) * uAlpha);
  } else {
    // the brackets the Mind's, the arc and the mark the colour of what is coming (additive)
    float rest = clamp(max(max(arc, arcBg), icon) + glow, 0.0, 1.0);
    vec3 c = lab * brackets * 1.2 + uColor * (1.0 + 0.6 * uFlash) * rest;
    gl_FragColor = vec4(c, max(brackets, rest) * uAlpha);
  }
}`;

const ICONS = { none: 0, chevron: 1, burst: 2, dots: 3 };

export class Reticle {
  constructor(scene, { mind = false } = {}) {
    this.uni = {
      uMind: { value: mind ? 1 : 0 }, uMindT: mindTime,
      uSize: { value: 1 }, uColor: { value: new THREE.Color(0xffb27a) }, uLock: { value: 0 }, uStam: { value: 1 }, uIcon: { value: 0 },
      uFlash: { value: 0 }, uAlpha: { value: 0 }, uPop: { value: 1 }, uDir: { value: new THREE.Vector2(1, 0) },
    };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: this.uni, vertexShader: V, fragmentShader: F, transparent: true, depthTest: false, depthWrite: false, blending: mind ? THREE.NormalBlending : THREE.AdditiveBlending, fog: false,
    }));
    this.mesh.renderOrder = 32; this.mesh.frustumCulled = false; this.mesh.visible = false;
    scene.add(this.mesh);
    this.k = 0; this.want = 0; this.flash = 0; this.lockS = 0; this.iconLast = -1;
  }

  /** What to draw this frame. Call every frame it should be up; call hide() (or stop calling) and it fades. */
  set({ pos, size = 1, color = 0xffb27a, icon = 'none', dir = [1, 0], lock = 0, stam = 1, flash = 0 }) {
    this.mesh.position.copy(pos);
    this.want = 1; this.size = size;
    this.uni.uColor.value.set(color);
    const ic = ICONS[icon] ?? 0;
    if (ic !== this.iconLast) { this.iconLast = ic; this.flash = Math.max(this.flash, 0.6); } // (a new mark: a flash)
    this.uni.uIcon.value = ic;
    this.uni.uDir.value.set(dir[0], dir[1]);
    this.lockT = lock; this.uni.uStam.value = stam;
    this.flash = Math.max(this.flash, flash);
    this.live = 0.1; // (set() keeps it alive for a moment)
  }

  hide() { this.want = 0; }

  update(dt, camera) {
    mindTick();
    this.live = (this.live ?? 0) - dt;
    if (this.live <= 0) this.want = 0;
    this.k = this.want > this.k ? Math.min(this.want, this.k + dt * 7) : Math.max(this.want, this.k - dt * 6); // (to want, and no further)
    if (this.k <= 0) { this.mesh.visible = false; this.iconLast = -1; return; }
    this.mesh.visible = true;
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.lockS = THREE.MathUtils.damp(this.lockS, this.lockT ?? 0, 14, dt);
    const d = camera.position.distanceTo(this.mesh.position);
    // (about the same size on the screen whatever the distance, and never smaller than the fish)
    this.uni.uSize.value = Math.max(this.size ?? 1, d * 0.075) * (0.5 + 0.5 * this.k);
    this.uni.uLock.value = this.lockS; this.uni.uFlash.value = this.flash;
    this.uni.uAlpha.value = this.k;
    const pop = backOut(this.k);
    this.uni.uPop.value = Math.max(0.1, pop);
  }
}
