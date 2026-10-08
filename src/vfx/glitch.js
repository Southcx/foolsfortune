// ---------------------------------------------------------------------------------------
// THE GLITCH: the data showing through (the owner, 2026-10-06: ".hack… datamoshing, chromatic aberration and glitching… why not lean
// into it?"). The world is made of feeling, and when something tears it (a FOE showing itself, an ultimate, a shattering, a mind being
// rewritten) the picture tears too, as The World's did in .hack. One screen pass over the frame as it is drawn (render/glow.js calls
// it on the light-linear frame, before the glow and the tone curve, so the bloom tears with it), off and free when nothing asks for it.
//
//   SPLIT   chromatic aberration: red and blue pulled apart, out from the middle and along a tear
//   TEAR    bands of rows slid sideways, each band its own height and its own shove (a broken signal's slice tear)
//   MOSH    datamosh: blocks that keep the frame before, dragged a little each frame, so the old picture bleeds through the new (a
//           lost key frame: the motion of what is there moves the pixels of what was)
//   CRUSH   in the torn blocks the colour drops to a few levels and leans to the code's cyan or magenta
//   DRAIN   .hack's data drain: blocks pulled in toward one point on the screen, faster the nearer they are, as Skeith pulled Orca in
//   DROP    the beat of silence (the owner's playlist: a cut, then the slam): the colour drains and dims for a beat, then comes back
//
// It moves in steps, not smoothly: the seed that picks the bands and blocks jumps a few times a second (a glitch that glides reads as
// a filter; one that stutters reads as broken). It is always a pulse with an end, never a state that stays: the rule on aliasing crawl
// is about a flicker that is a bug; this one is the point, and it is short. Comfort (Petra's terms, the WCAG 2.3.1 line): nothing ambient,
// every tear set off by an event and over in a bounded time; moments at most one every 0.4 real seconds, a drop-out at most one every
// 1.5, the stutter between 6 and 10 steps a second. T.visual.glitch (a setting, default on) turns it all off.
//
// Prior art: .hack//Infection's Data Drain (CyberConnect2, 2002: the target broken into flickering blocks and pulled into the bracelet)
// and its error-ridden Lost Ground, MGS2's colonel breaking down ("fission mailed": the screen torn into colour bands), Rez's wireframe
// data-space, Takeshi Murata's Monster Movie and the datamosh videos after it (P-frames moving the pixels of a deleted I-frame), and
// the camera lens's lateral chromatic aberration (red and blue focused at different sizes, worst at the edges).
//
//   game.glitch = new Glitch(game)   .update(rawDt, camera)   (each frame)
//   .pulse({ split, tear, mosh, crush, drain, drop, at, dur })   amounts 0..1; `at` a world point (Vector3) or a screen point {u, v}; dur in real seconds
//   .drop(beats = 2)          the cut before a slam: dark for that many frames (at 60 a second), then back
//   .drain(at, dur)           the data drain toward a world point
//   .on   .render(post, src) -> a target   (the glow's screen hook: src in, the torn frame out)
//   MOMENTS: which events tear the picture, and how (it listens on game.events itself)
//
// THE VEIL rides in the same pass (one program, not two): the storm's haze, split and light (vfx/stormwarp.js writes them) and the
// Umbral's grade and the line of the surface across the lens (vfx/umbral.js). It is a state, not a pulse: on while the storm or the
// deep asks for it, and set by `visual.warp`, never by `visual.glitch` (a tear and a storm are different things to turn off).
//   .veil = { haze 0..1, split 0..1, t, light (Color), below 0..1, line (0..1 up the frame, or -1), deep (Color) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
uniform sampler2D tSrc, tHist; uniform vec2 uRes, uAt; uniform float uSeed, uSplit, uTear, uMosh, uCrush, uDrain, uDrop; uniform bool uFresh;
uniform float uHaze, uVSplit, uVT, uBelow, uLine; uniform vec3 uVLight, uVDeep;
varying vec2 vUv;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
void main() {
  vec2 uv = vUv, px = vUv * uRes;
  // THE VEIL (vfx/stormwarp.js, vfx/umbral.js): the storm's haze and, under the surface, the crude's slow wobble; never on the danger
  float asp = uRes.x / uRes.y, edge = smoothstep(0.16, 0.7, length((vUv - 0.5) * vec2(asp, 1.0)));
  float lineY = uLine + 0.012 * sin(vUv.x * 6.0 + uVT * 1.3);
  float wet = uLine >= 0.0 ? step(vUv.y, lineY) : uBelow; // (below the surface's line on the lens: the Umbral)
  float keepHere = step(0.5, texture2D(tSrc, vUv).a); // (keepTrue: the danger writes 0 to the frame's alpha)
  float hz = uHaze * mix(0.3, 1.0, edge) + wet * 0.5;
  if (hz > 0.0) {
    vec2 q = vUv * vec2(asp, 1.0) * 2.2;
    vec2 n = vec2(vn(q + vec2(uVT * 0.05, uVT * 0.11)), vn(q * 1.7 + vec2(-uVT * 0.07, uVT * 0.04) + 7.3)) - 0.5;
    vec2 to = uv + n * hz * 0.018;
    uv = mix(uv, to, keepHere * step(0.5, texture2D(tSrc, to).a)); // (neither moved, nor smeared into its neighbours)
  }
  float lip = 0.0;
  if (uLine >= 0.0) { float dl = vUv.y - lineY; lip = exp(-dl * dl / 0.00015); uv.y += 0.025 * lip * sign(dl); } // (the lens's lip of crude, bending the band at it)
  // TEAR: bands of rows, each band its height and its shove (only some bands move)
  float s0 = floor(uSeed), bandH = mix(5.0, 42.0, h1(vec2(s0, 3.1)));
  float band = floor(px.y / bandH), hb = h1(vec2(band, s0));
  float torn = step(1.0 - uTear * 0.55, hb);
  float tear = torn * (hb - 0.5) * 0.18 * uTear;
  uv.x += tear;
  // DRAIN: 12-pixel blocks pulled toward the point, the near ones most, each block its own pace
  vec2 blk = floor(px / 12.0); float hd = h1(blk + floor(uSeed * 0.5));
  vec2 to = uAt - uv; float d = length(to * vec2(uRes.x / uRes.y, 1.0));
  float pull = uDrain * (1.0 - smoothstep(0.0, 0.85, d)) * (0.3 + 0.7 * hd);
  uv += to * pull * 0.7;
  // SPLIT: red out, blue in, from the middle and along the tear
  vec2 c = uv - 0.5, off = c * (uSplit * 0.035 + uVSplit * 0.008 * edge * keepHere + lip * 0.02) + vec2(tear * 0.5 + uSplit * 0.003, 0.0);
  vec3 col = vec3(texture2D(tSrc, uv + off).r, texture2D(tSrc, uv).g, texture2D(tSrc, uv - off).b);
  // MOSH: 16-pixel blocks that keep the frame before (this pass's own last output), dragged a hair each frame
  vec2 mb = floor(px / 16.0); float hm = h1(mb + vec2(17.0, floor(uSeed / 3.0)));
  if (!uFresh && hm < uMosh) {
    vec2 drag = (vec2(h1(mb + 1.3), h1(mb + 7.1)) - 0.5) * 0.012 + vec2(0.002, -0.001);
    col = texture2D(tHist, vUv - drag).rgb;
  }
  // CRUSH: the torn and drained blocks crushed to a few levels, leaning to the code's cyan or magenta
  // (in RUNS along a torn band, a few blocks long, not single blocks: a broken line of signal, not confetti)
  float runW = 12.0 * (2.0 + floor(5.0 * h1(vec2(band, s0 + 1.0))));
  vec2 run = vec2(floor(px.x / runW), band);
  float g = max(torn * uTear, pull * 1.6);
  if (h1(run * 1.7 + s0) < uCrush * g * 0.4) {
    float L = max(col.r, max(col.g, col.b)) + 1e-3;
    col = floor(col / L * 4.0 + 0.5) / 4.0 * L * mix(vec3(0.35, 1.25, 1.2), vec3(1.25, 0.35, 1.15), step(0.5, h1(run + 9.0)));
    col *= 0.7 + 0.3 * step(0.5, fract(px.y * 0.5)); // (a scanline through it)
  }
  // the veil's colour: the storm's light at the edges above; below the line, the Umbral's black-violet (the bright kept bright)
  col += uVLight * uHaze * edge * 0.05 * (1.0 - wet);
  if (wet > 0.0) { float L = dot(col, vec3(0.299, 0.587, 0.114)); vec3 g = col * vec3(0.46, 0.33, 0.72) + uVDeep * 0.4; col = mix(col, mix(g, col, smoothstep(0.8, 2.4, L)), wet); }
  col += uVLight * lip * 0.3;
  // DROP: the beat of silence
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(l * 0.12), uDrop);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

/** What tears the picture, by event: the amounts of each part, how long (real seconds), and where (`at` from the payload or the
 *  Courier); an entry may be a function of the payload (a crown's stage). Kept to moments that earn it: a glitch on every hit would be a filter, not an event. */
export const MOMENTS = {
  'well.foe': { drop: 1, beats: 3, then: { split: 0.8, tear: 0.9, mosh: 0.35, crush: 0.8, dur: 0.9 } }, // (the FOE shows itself: the cut, then the wall)
  'lockheart.ultimate': { split: 0.7, tear: 0.5, mosh: 0.25, crush: 0.5, dur: 0.7 },
  'courier.shatter': { split: 1, tear: 1, mosh: 0.6, crush: 1, dur: 1.4 },
  'reprogram.run': { drain: 1, split: 0.5, crush: 0.9, dur: 1.1, atCreature: true, unlessRefused: true }, // (a mind rewritten: the data drain)
  'slam.impact': { split: 0.35, tear: 0.25, dur: 0.25, min: { power: 0.6 } }, // (a hard slam only)
  'well.crown': (e) => (e.stage >= 3 ? { drop: 1, beats: 2, then: { split: 0.9, tear: 0.8, mosh: 0.3, crush: 0.7, dur: 0.9 } } : { split: 0.3 + 0.15 * e.stage, crush: 0.3, dur: 0.3 }), // (the Pithos's crown: a tick at each crack; the burst is the drop, Wanda's beat of silence then the wall)
};
const PARTS = ['split', 'tear', 'mosh', 'crush', 'drain', 'drop'];

export class Glitch {
  constructor(game) {
    this.game = game;
    this.pulses = []; this.amt = Object.fromEntries(PARTS.map((p) => [p, 0]));
    this.at = new THREE.Vector2(0.5, 0.5); this.atWorld = null;
    this.seed = 0; this.seedT = 0; this.dropFrames = 0; this.fresh = true;
    this.mat = null; this.hist = null; this.w = 0; this.moments = MOMENTS;
    this.veil = { haze: 0, split: 0, t: 0, light: new THREE.Color(1, 0.92, 0.74), below: 0, line: -1, deep: new THREE.Color(0x140a22) }; // (the storm's and the deep's share of the pass)
    for (const [ev, M] of Object.entries(MOMENTS)) game.events?.on?.(ev, (e) => this.moment(M, e));
  }

  make() {
    if (this.mat) return;
    this.mat = new THREE.ShaderMaterial({
      name: 'glitch-screen', vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tSrc: { value: null }, tHist: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uAt: { value: this.at }, uSeed: { value: 0 }, uFresh: { value: true },
        uHaze: { value: 0 }, uVSplit: { value: 0 }, uVT: { value: 0 }, uBelow: { value: 0 }, uLine: { value: -1 }, uVLight: { value: this.veil.light }, uVDeep: { value: this.veil.deep },
        ...Object.fromEntries(PARTS.map((p) => [`u${p[0].toUpperCase()}${p.slice(1)}`, { value: 0 }])) },
    });
  }

  /** An event's moment: its pulse (and its cut first, if it has one), placed at the payload's point, the creature, or the Courier. */
  moment(M, e = {}) {
    if (typeof M === 'function') M = M(e);
    if (T.visual.glitch === false || !M) return;
    const now = performance.now();
    if (now - (this.lastMoment || -1e9) < 400) return; // (a moment at most every 0.4 real seconds: never a strobe)
    this.lastMoment = now;
    if (M.min && Object.entries(M.min).some(([k, v]) => (e[k] ?? 1) < v)) return;
    if (M.unlessRefused && e.refused?.length >= (e.effects?.length || 1)) return; // (a mind that refused it all: no drain)
    const at = e.at || (M.atCreature && this.game.reprogram?.c?.pos) || null;
    if (M.drop) { this.drop(M.beats ?? 2); if (M.then) this.after = { ...M.then, at }; return; } // (the slam comes on the frame the cut ends)
    this.pulse({ ...M, at });
  }

  /** A tear: each part's peak (0..1), shaped up fast and down slower over `dur` real seconds. */
  pulse({ dur = 0.6, at = null, ...amts } = {}) {
    const p = { t: 0, dur: Math.max(0.05, dur), amts: {} };
    for (const k of PARTS) if (amts[k]) p.amts[k] = amts[k];
    this.pulses.push(p);
    if (at) this.aim(at);
    return p;
  }
  drop(beats = 2) { // (the cut: rare by rule, at most one every 1.5 real seconds)
    const now = performance.now(); if (T.visual.glitch === false || now - (this.lastDrop || -1e9) < 1500) return;
    this.lastDrop = now; this.dropFrames = Math.max(this.dropFrames, beats);
  }
  drain(at, dur = 1.1) { return this.pulse({ drain: 1, split: 0.5, crush: 0.9, dur, at }); }
  aim(at) { if (at.isVector3) this.atWorld = at.clone(); else { this.atWorld = null; this.at.set(at.u ?? 0.5, at.v ?? 0.5); } }

  get on() { return this.dropFrames > 0 || this.pulses.length > 0 || this.veiled; }
  get veiled() { const V = this.veil; return V.haze > 0.002 || V.below > 0.002 || V.line >= 0; }

  update(raw, camera) {
    const k = T.visual.glitch === false ? 0 : 1;
    if (!k) { this.pulses.length = 0; this.dropFrames = 0; this.after = null; }
    for (const p of PARTS) this.amt[p] = 0;
    for (const P of this.pulses) {
      P.t += raw;
      const x = P.t / P.dur, env = x < 0.08 ? x / 0.08 : Math.pow(Math.max(0, 1 - (x - 0.08) / 0.92), 1.6); // (up fast, down slower)
      for (const [part, v] of Object.entries(P.amts)) this.amt[part] = Math.max(this.amt[part], v * env * k);
    }
    this.pulses = this.pulses.filter((P) => P.t < P.dur);
    if (this.dropFrames > 0) { this.amt.drop = Math.max(this.amt.drop, k); if (--this.dropFrames === 0 && this.after) { this.pulse(this.after); this.after = null; } }
    // the seed jumps a few times a second, at an uneven pace (a stutter, not a glide)
    if ((this.seedT -= raw) <= 0) { this.seed = (this.seed + 1 + Math.floor(Math.random() * 7)) % 997; this.seedT = 0.1 + Math.random() * 0.067; } // (6 to 10 steps a second)
    if (this.atWorld && camera) { const v = this.atWorld.clone().project(camera); this.at.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5); }
    if (!this.on) this.fresh = true;
  }

  /** The glow's screen hook (render/glow.js): the frame in, the torn frame out (this pass's own target, kept as the next mosh's past). */
  render(post, src) {
    this.make();
    if (!this.hist) { const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }); this.hist = [rt(), rt()]; } // (made on the first tear, never before)
    const w = src.width, h = src.height;
    if (this.w !== w || this.h !== h) { for (const t of this.hist) t.setSize(w, h); this.w = w; this.h = h; this.fresh = true; }
    const u = this.mat.uniforms, out = this.hist[this.flip ? 1 : 0], past = this.hist[this.flip ? 0 : 1];
    u.tSrc.value = src.texture; u.tHist.value = past.texture; u.uRes.value.set(w, h); u.uSeed.value = this.seed; u.uFresh.value = this.fresh;
    for (const p of PARTS) u[`u${p[0].toUpperCase()}${p.slice(1)}`].value = this.amt[p];
    const V = this.veil; u.uHaze.value = V.haze; u.uVSplit.value = V.split; u.uVT.value = V.t; u.uBelow.value = V.below; u.uLine.value = V.line;
    post.pass(this.mat, out);
    this.flip = !this.flip; this.fresh = false;
    return out;
  }

  /** For the warm-up: the pass compiled against its own target, so the first tear is not a hitch. */
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); } // (against the glow's own half-float target: the same program as on its own, and no target of its own made for it)
}
