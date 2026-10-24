// ---------------------------------------------------------------------------------------
// THE LENS DROPS: rain landing on the lens when you look up into it (the owner, 2026-10-24: "raindrops splashing on the screen if you
// look directly up in first person view, much like in Metroid Prime"). In the first person, while rain or hail falls on an open place
// and the view is tipped up (its direction's height over ~0.3), drops land on the glass: each a little lens of its own that shows the
// world behind it turned over and drawn small, with a dark rim and a highlight; they bead, the big ones run down leaving a thin wet
// streak, and they dry when the rain stops or you look away. In the third person only a few, and only looking well up (the camera is
// not a face). Per feeling: Grief's many, small and running long; Mirth's fewer and gold-tinted, drying fast in the sun; Fury's hail a
// brief crack of frost where a stone strikes the glass; Desire's grit specks thrown into the face by a gust you face into (the one dust
// feeling that gets any). The others: nothing.
// It is a screen volume (render/glow.js `post.volumes`): one full-screen pass on the light-linear frame, drawn only while a drop is on
// the glass (the frame as drawn so far is its `src`: no grab needed). The drops are a few dozen numbers on the CPU (a slot each, no
// object), handed over as two uniform arrays.
// Comfort (CLAUDE.md): a drop's edge is soft over a pixel and a half; nothing on the glass blinks: a drop comes in over a tenth of a
// second, a frost crack over a twentieth and out over half a second; the setting `visual.lensDrops` turns it all off.
//
// Prior art: Metroid Prime's visor (rain beading and running on Samus's visor when she looks up, steam fogging it, 2002), the camera-lens
// raindrops of the seventh generation (Gears of War, Uncharted: a screen pass refracting through drop normals), and the optics of a real
// drop on glass (a plano-convex lens: the world inverted and minified in it, its rim dark where light bends out of the eye).
//
//   const L = new LensDrops(game)   (registers on game.post)   L.update(dt, camera, { rain: { grief: k, ... }, fp, gust, open })   L.on   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';

const MAX = 40;
/** Each feeling's drops: `rate` a real second at full strength looking straight up, `r` their radius (a share of the screen's height),
 *  `kind` (0 clear, 1 gold, 2 frost, 3 grit), `run` how long a streak may get, `dry` real seconds to dry with the rain off them. */
export const LENS = {
  grief:  { rate: 11, heavy: 18, r: [0.008, 0.026], kind: 0, run: 0.55, dry: 2.6 },
  mirth:  { rate: 4, r: [0.014, 0.034], kind: 1, run: 0.22, dry: 1.4 },
  fury:   { rate: 2.4, heavy: 4, r: [0.03, 0.06], kind: 2, life: 0.55 },
  desire: { rate: 7, r: [0.0025, 0.005], kind: 3, life: 0.9, gust: true },
};

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
#define MAX ${MAX}
uniform sampler2D tSrc; uniform vec4 uD[MAX], uE[MAX]; uniform float uN, uAsp; varying vec2 vUv;
float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
void main() {
  vec3 base = texture2D(tSrc, vUv).rgb, c = base;
  vec2 P = vec2(vUv.x * uAsp, vUv.y); // (in the screen's height: a drop is round)
  for (int i = 0; i < MAX; i++) {
    if (float(i) >= uN) break;
    vec4 D = uD[i], E = uE[i];
    vec2 ctr = vec2(D.x * uAsp, D.y), d = P - ctr; float r = D.z, wet = D.w, kind = E.x;
    if (kind > 2.5) { // GRIT: a speck, dark, a little blurred
      float k = exp(-dot(d, d) / (r * r)) * wet; if (k < 0.002) continue;
      c = mix(c, vec3(0.09, 0.06, 0.035) * (0.6 + 0.4 * base), 0.85 * k);
      continue;
    }
    if (kind > 1.5) { // FROST: a crack star where a stone struck, six arms jagged, frosted white and bending what is behind it a hair
      float R = r * 3.0; if (dot(d, d) > R * R) continue;
      float lit = 0.0;
      for (int j = 0; j < 6; j++) {
        float a = E.w * 6.2832 + float(j) * 1.0472 + (h1(E.w * 13.0 + float(j)) - 0.5) * 0.7;
        vec2 ad = vec2(cos(a), sin(a)); float al = dot(d, ad), L = R * (0.45 + 0.55 * h1(E.w * 7.0 + float(j) * 3.1));
        float pe = abs(d.x * ad.y - d.y * ad.x + 0.0025 * sin(al * 160.0 + float(j)));
        lit = max(lit, exp(-pe * pe / 6e-6) * step(0.0, al) * (1.0 - smoothstep(L * 0.6, L, al)));
      }
      lit = max(lit, exp(-dot(d, d) / (r * r * 0.08))); // (the bruise where it struck)
      vec3 bent = texture2D(tSrc, vUv + d * 0.08).rgb;
      c = mix(c, mix(bent, vec3(0.9, 0.96, 1.0) * (0.7 + 0.5 * dot(base, vec3(0.33))) + 0.25, 0.7), lit * wet);
      continue;
    }
    // WATER: the streak behind a running drop (E.y its top, E.z its wetness), then the drop
    if (E.z > 0.001 && P.y > ctr.y && P.y < E.y) {
      float wob = 0.18 * r * sin(P.y * 70.0 + E.w * 30.0), sw = r * 0.32 * (1.0 - 0.6 * (P.y - ctr.y) / max(0.001, E.y - ctr.y));
      float x = (P.x - ctr.x - wob) / sw;
      float k = (1.0 - smoothstep(0.6, 1.0, abs(x))) * E.z * smoothstep(E.y, E.y - 0.03, P.y);
      if (k > 0.002) { vec3 s = texture2D(tSrc, vUv + vec2(x * sw * 0.6 / uAsp, 0.0)).rgb; c = mix(c, s * 0.92, k); }
    }
    vec2 q = d / r; q.y *= q.y < 0.0 ? 0.85 : 1.12; // (a drop hangs: fuller below)
    float d2 = dot(q, q); if (d2 > 1.0) continue;
    float l = sqrt(d2), h = sqrt(1.0 - d2), edge = 1.0 - smoothstep(0.86, 1.0, l);
    vec2 back = vec2(D.x, D.y) - d * (2.6 - 1.2 * h) / vec2(uAsp, 1.0); // (through a drop: the world turned over and drawn small)
    vec3 s = 0.5 * (texture2D(tSrc, back).rgb + texture2D(tSrc, back + q * r * 0.25 / vec2(uAsp, 1.0)).rgb); // (two taps: a drop is a soft lens)
    s *= mix(0.45, 1.0, smoothstep(0.98, 0.55, l)); // (its rim dark, where the light bends away)
    if (kind > 0.5) s *= vec3(1.12, 0.94, 0.62); // (Mirth's gold)
    float spec = exp(-dot(q - vec2(-0.32, 0.38), q - vec2(-0.32, 0.38)) * 22.0); // (the sky's highlight, up and to the left)
    s += vec3(1.0, 0.98, 0.92) * spec * (0.5 + 0.8 * dot(base, vec3(0.33)));
    c = mix(c, s, edge * wet);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const _f = new THREE.Vector3(), _r = new THREE.Vector3();
export class LensDrops {
  constructor(game) {
    this.game = game; this.mat = null; this.out = null;
    this.D = new Float32Array(MAX * 4); this.E = new Float32Array(MAX * 4); // (the drops as drawn: x y r wet, kind top trail seed)
    this.s = Array.from({ length: MAX }, () => ({ live: false, x: 0, y: 0, r: 0, wet: 0, kind: 0, top: 0, trail: 0, seed: 0, age: 0, hold: 0, vy: 0, grow: 0, life: 0, run: 0, dry: 1, vx: 0 }));
    this.acc = {}; this.n = 0;
    if (game.post) (game.post.volumes ||= []).push(this);
  }
  get on() { return this.n > 0 && T.visual.lensDrops !== false; }

  /** `rain` each feeling's amount falling here (open places only), `fp` the first person's weight, `gust` the gust at the eye. */
  update(dt, camera, { rain, fp = 0, gust = 0, wind = null, covered = false }) {
    if (T.visual.lensDrops === false) { this.n = 0; for (const s of this.s) s.live = false; return; }
    camera.getWorldDirection(_f);
    const up = THREE.MathUtils.smoothstep(_f.y, 0.3, 0.8), view = covered ? 0 : (fp + (1 - fp) * 0.1) * up; // (third person: a few, looking well up)
    let wetting = false;
    for (const a in LENS) {
      const L = LENS[a], k = rain?.[a] || 0; if (k <= 0.01) { this.acc[a] = 0; continue; }
      let rate = THREE.MathUtils.lerp(L.rate, L.heavy ?? L.rate, THREE.MathUtils.smoothstep(k, 0.65, 1)) * k;
      if (L.gust) { // (grit: a gust you face into, whatever the pitch)
        _r.set(wind ? -wind.x : 0, 0, wind ? -wind.y : 0);
        rate *= covered ? 0 : gust * THREE.MathUtils.smoothstep(_f.x * _r.x + _f.z * _r.z, 0.2, 0.8);
      } else { rate *= view; if (rate > 0.05) wetting = true; }
      this.acc[a] = (this.acc[a] || 0) + rate * dt;
      while (this.acc[a] >= 1) { this.acc[a] -= 1; this.spawn(L, camera); }
    }
    // the drops: beading, running, drying
    camera.matrixWorld.extractBasis(_r, _f, _f); // (_r the camera's right: grit slides with the wind across the view)
    const wx = wind ? Math.sign(wind.x * _r.x + wind.y * _r.z) : 1;
    let n = 0;
    for (const s of this.s) {
      if (!s.live) continue;
      s.age += dt; s.grow = Math.min(1, s.grow + dt / (s.kind === 2 ? 0.05 : 0.1));
      if (s.kind >= 2) { s.wet = s.grow * Math.max(0, 1 - Math.max(0, s.age - s.life * 0.3) / (s.life * 0.7)); if (s.kind === 3) s.x += wx * 0.04 * dt; }
      else {
        s.wet = Math.min(s.wet, 1) - dt / (wetting ? s.dry * 4 : s.dry);
        if (s.age > s.hold && s.r > 0.015) { s.vy = Math.min(0.5, s.vy + dt * (0.08 + 4 * (s.r - 0.015))); s.y -= s.vy * dt; s.x += Math.sin(s.age * 3 + s.seed * 20) * 0.004 * dt; s.trail = Math.min(1, s.trail + dt * 3); }
        s.top = Math.min(s.top, s.y + s.run); s.trail = Math.max(0, s.trail - dt * 0.35);
      }
      if (s.wet <= 0.01 || s.y < -0.1 || (s.kind >= 2 && s.age > s.life)) { s.live = false; continue; }
      const o = n * 4, r = s.r * (s.kind < 2 ? Math.sqrt(Math.max(0, s.wet)) * (0.6 + 0.4 * s.grow) : 1);
      this.D[o] = s.x; this.D[o + 1] = s.y; this.D[o + 2] = r; this.D[o + 3] = s.kind < 2 ? s.grow * Math.min(1, s.wet * 3) : s.wet;
      this.E[o] = s.kind; this.E[o + 1] = s.top; this.E[o + 2] = s.trail * Math.min(1, s.wet * 2); this.E[o + 3] = s.seed;
      n++;
    }
    this.n = n;
  }

  spawn(L, camera) {
    let s = this.s.find((x) => !x.live);
    if (!s) { s = this.s.reduce((a, b) => (b.wet < a.wet ? b : a)); } // (full: the driest gives its place)
    const rnd = Math.random;
    s.live = true; s.kind = L.kind; s.x = 0.04 + 0.92 * rnd(); s.y = 0.08 + 0.9 * rnd(); s.r = THREE.MathUtils.lerp(L.r[0], L.r[1], rnd() * rnd());
    s.wet = 1; s.age = 0; s.grow = 0; s.hold = 0.5 + 2.2 * rnd(); s.vy = 0; s.top = s.y; s.trail = 0; s.seed = rnd(); s.life = L.life || 0;
    s.run = L.run || 0; s.dry = L.dry || 1;
  }

  make() {
    if (this.mat) return;
    this.mat = new THREE.ShaderMaterial({ name: 'weather-lensdrops', vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tSrc: { value: null }, uD: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) }, uE: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) }, uN: { value: 0 }, uAsp: { value: 1 } } });
  }
  render(post, src) {
    this.make();
    if (!this.out) this.out = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    if (this.out.width !== src.width || this.out.height !== src.height) this.out.setSize(src.width, src.height);
    const u = this.mat.uniforms;
    for (let i = 0; i < this.n; i++) { u.uD.value[i].fromArray(this.D, i * 4); u.uE.value[i].fromArray(this.E, i * 4); }
    u.uN.value = this.n; u.uAsp.value = src.width / Math.max(1, src.height); u.tSrc.value = src.texture;
    post.pass(this.mat, this.out);
    return this.out;
  }
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); }
  dispose() {
    const V = this.game.post?.volumes, i = V ? V.indexOf(this) : -1; if (i >= 0) V.splice(i, 1);
    this.mat?.dispose(); this.out?.dispose();
  }
}
