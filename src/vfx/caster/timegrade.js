// ---------------------------------------------------------------------------------------
// THE TIME GRADE (caster shader S7): inside a sphere, the colour drained and the grain frozen, for the Clock's shells (51 Stasis, 52
// Slow Field, 54 Rewind, 58 Stop-Motion: docs/plans/CASTER-SHELLS.md). Time stopped looks like an old photograph: the colour goes out
// of what is inside (to a cool grey, lightness kept), a film grain lies over it that does not move (the grain is the clock: frozen
// when time is, stepping when time steps), and its edge is a faint line of glass. Two ways time can be bent show in the picture too:
//   HOLD   the inside drawn at so many frames a real second (Stop-Motion's twelve, on the music): between steps the last one is kept
//   SMEAR  the inside's frames fed back into themselves (a slow field's long motion blur: the PS2's frame accumulation, in a sphere)
//
// It is a screen volume: one full-screen pass in the glow's chain (render/glow.js `post.volumes`), before the glitch and the bloom.
// Up to four spheres at once in the one pass; a pixel whose ray misses them all is one fetch of the frame. Each sphere is found by its
// ray's chord through it (deepest through the middle, nothing at the silhouette), so its edge is soft; standing inside one, the whole
// view is graded. Without depth, what stands in front of a sphere is graded with it.
//
// Comfort (CLAUDE.md, no aliasing crawl): the grain is fixed to the screen's pixels and never animates by itself (it steps only with
// HOLD, at most 24 times a real second, and a step is a small change, not a flash); the rim is a few pixels' Gaussian on the chord.
//
// Prior art: the bleach bypass and the desaturated "time stop" of film and games (Max Payne's bullet time, The World's stopped time in
// JoJo's Bizarre Adventure: colour drained inside the stand's reach, the edge a sphere), stop-motion's "on twos" (Spider-Verse's
// animation on twos and threes), and the PS2's frame-feedback blur (render/glow.js FRAME ACCUMULATION) for SMEAR.
//
//   const z = create(game, { radius, drain, grain, rim, hold, smear })   (game.post: the glow; game.scene)
//   z.group (the sphere's centre: place it)   z.set({ ... })   z.k = 0..1 (its strength)   z.update(dt)   z.dispose()
//   prewarm(game)   (the boot's warm-up: the pass made and registered, so the glow's compile() compiles it)
//   layer(game, L, ctx)   the effect library's `caster` layer (vfx/vfx.js): `{ type: 'caster', shader: 'timegrade', radius, ... }`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const MAX = 4;
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
#define MAX ${MAX}
uniform sampler2D tSrc, tHist; uniform mat4 uInvProj, uCamWorld; uniform vec3 uCamPos, uTone; uniform vec2 uRes;
uniform vec4 uZone[MAX], uLook[MAX]; uniform float uHold, uSmear, uGrainSeed; uniform bool uFresh;
varying vec2 vUv;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb;
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
  float m = 0.0, rim = 0.0, drain = 0.0, grain = 0.0;
  for (int i = 0; i < MAX; i++) {
    vec4 Z = uZone[i], Lk = uLook[i];
    if (Lk.w <= 0.0) continue;
    vec3 oc = uCamPos - Z.xyz; float b = dot(oc, dir), cc = dot(oc, oc) - Z.w * Z.w, D = b * b - cc;
    float mi = 0.0, ri = 0.0;
    if (cc < 0.0) mi = 1.0; // (standing inside: all of it)
    else if (D > 0.0 && b < 0.0) { float ch = sqrt(D) / Z.w; mi = smoothstep(0.0, 0.3, ch); ri = exp(-ch * ch / 0.006); } // (the chord through it, 0 at the silhouette, 1 through the middle)
    mi *= Lk.w; ri *= Lk.w * Lk.z;
    if (mi > m) { drain = Lk.x; grain = Lk.y; }
    m = max(m, mi); rim = max(rim, ri);
  }
  if (m <= 0.0 && rim <= 0.0) { gl_FragColor = vec4(c, 1.0); return; }
  // the grade: lightness kept, the colour drained toward a cool grey, a grain fixed to the screen
  float L = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 g = mix(c, vec3(L) * uTone, drain);
  g *= 1.0 + (h1(floor(vUv * uRes) + uGrainSeed) - 0.5) * grain * 0.38;
  if (!uFresh) { vec3 h = texture2D(tHist, vUv).rgb; g = mix(g, h, max(uHold, uSmear)); } // (HOLD keeps the last step; SMEAR feeds the frames back)
  vec3 o = mix(c, g, m) + vec3(0.62, 0.7, 0.8) * rim * 0.32; // (the edge: a faint line of glass)
  gl_FragColor = vec4(o, 1.0);
}`;

const PASSES = new WeakMap(); // (one pass a post: every zone in the world draws through it, four at a time)
const _v = new THREE.Vector3();

class TimeGradePass {
  constructor(post) { this.list = new Set(); this.mat = null; this.hist = null; this.flip = 0; this.fresh = true; this.acc = 0; this.seed = 0; this.last = 0; (post.volumes ||= []).push(this); }
  get on() { for (const z of this.list) if (z.k > 0.001) return true; this.fresh = true; return false; }
  make() {
    if (this.mat) return;
    const u = { tSrc: { value: null }, tHist: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
      uTone: { value: new THREE.Vector3(0.94, 0.98, 1.07) }, uRes: { value: new THREE.Vector2(1, 1) },
      uZone: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) }, uLook: { value: Array.from({ length: MAX }, () => new THREE.Vector4()) },
      uHold: { value: 0 }, uSmear: { value: 0 }, uGrainSeed: { value: 0 }, uFresh: { value: true } };
    this.mat = new THREE.ShaderMaterial({ name: 'caster-timegrade', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, depthTest: false, depthWrite: false });
  }
  render(post, src, camera) {
    this.make();
    if (!this.hist) { const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }); this.hist = [rt(), rt()]; } // (made on the first zone, never before)
    const w = src.width, h = src.height;
    if (this.hist[0].width !== w || this.hist[0].height !== h) { for (const t of this.hist) t.setSize(w, h); this.fresh = true; }
    const u = this.mat.uniforms, zs = [...this.list].filter((z) => z.k > 0.001).sort((a, b) => b.k - a.k).slice(0, MAX);
    // HOLD: the inside steps at the fastest zone's rate (0: live); SMEAR: the strongest zone's
    const now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (this.last || now))); this.last = now;
    let fps = 0, smear = 0; for (const z of zs) { if (z.p.hold > 0) fps = Math.max(fps, z.p.hold); smear = Math.max(smear, z.p.smear * z.k); }
    let hold = 0;
    if (fps > 0) { this.acc += dt; if (this.acc >= 1 / fps) { this.acc %= 1 / fps; this.seed = (this.seed + 1) % 97; } else hold = 1; }
    u.uHold.value = hold; u.uSmear.value = Math.min(0.95, smear); u.uGrainSeed.value = this.seed; u.uFresh.value = this.fresh;
    u.uInvProj.value.copy(camera.projectionMatrixInverse); u.uCamWorld.value.copy(camera.matrixWorld); camera.getWorldPosition(u.uCamPos.value);
    u.uRes.value.set(w, h);
    for (let i = 0; i < MAX; i++) {
      const z = zs[i];
      if (!z) { u.uLook.value[i].set(0, 0, 0, 0); continue; }
      z.group.getWorldPosition(_v); const r = z.p.radius * z.group.getWorldScale(new THREE.Vector3()).x;
      u.uZone.value[i].set(_v.x, _v.y, _v.z, Math.max(0.01, r));
      u.uLook.value[i].set(z.p.drain, z.p.grain, z.p.rim, z.k);
    }
    const out = this.hist[this.flip], past = this.hist[1 - this.flip];
    u.tSrc.value = src.texture; u.tHist.value = past.texture;
    post.pass(this.mat, out);
    this.flip = 1 - this.flip; this.fresh = false;
    return out;
  }
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); }
}

export const TIMEGRADE_DEFAULTS = { radius: 2.5, drain: 0.92, grain: 0.5, rim: 0.6, hold: 0, smear: 0 };

export class TimeGrade {
  constructor(game, o = {}) {
    this.game = game; this.k = o.k ?? 1;
    this.p = { ...TIMEGRADE_DEFAULTS };
    this.set(o);
    this.group = new THREE.Group(); this.group.name = 'caster-timegrade';
    if (o.pos) this.group.position.copy(o.pos);
    (o.parent || game.scene)?.add(this.group);
    const post = game.post;
    if (post) { this.pass = PASSES.get(post) || new TimeGradePass(post); PASSES.set(post, this.pass); this.pass.list.add(this); }
  }
  set(o = {}) { for (const k of Object.keys(TIMEGRADE_DEFAULTS)) if (o[k] !== undefined) this.p[k] = o[k]; return this; }
  update() {}
  dispose() { this.pass?.list.delete(this); this.group.parent?.remove(this.group); }
}

/** The boot's warm-up (main.js): the pass made and put in the glow's chain now, so the glow's compile() compiles it with its own. */
export function prewarm(game) { const post = game.post; if (post && !PASSES.get(post)) PASSES.set(post, new TimeGradePass(post)); return null; }

export const create = (game, opts) => new TimeGrade(game, opts);

/** The effect library's `caster` layer: the sphere at the effect's place, its strength the layer's `k` curve, its radius the scale. */
export function layer(game, L) {
  const z = new TimeGrade(game, { ...L, k: 0 });
  return { group: z.group, u: { uTint: { value: new THREE.Color() } }, set: (k) => { z.k = Math.max(0, k); }, update: () => {}, dispose: () => z.dispose() };
}
