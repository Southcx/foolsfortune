// ---------------------------------------------------------------------------------------
// A DUEL'S STAMPS (plain names; South, 2026-10-29: "Get very JRPG with it. Campy. Have some fun and give the fights more pizzazz"): a word
// slammed onto the screen itself, over the world, for the moments the board alone undersells; labels and counts only, in the System's
// type, never a sentence (the log says what happened).
//   VS        at a PvE duel's open, between the two bands (duelshow.js): VS, gold, a sunburst behind it
//   A CHAIN   a duel's chain from its third step (beats.js, in place of the step's numeral on the board: one count, never two): "3 CHAIN!",
//             bigger and louder a step, its exclamation marks counting up, from the fifth in the film's colours running through the
//             letters, the sunburst spinning faster, the slam's colour split wider
// One plane on the overlay's scene (render/overlayscene.js: CSS px, after the grade), one program, warmed at the duel's open: a stamp
// slams in from big (a held frame of white), settles with a shiver and grows a hair while it holds, then pops away. One at a time: the next
// replaces it.
// Prior art: Puyo Puyo's "n Rensa!" stamp, Street Fighter's "K.O.", Persona 5's slanted callouts, Tekken's round call, the comic book's
// sound effect lettering with its starburst; the cut-in's own word and its colour split (cutin.js).
//
//   const S = new DuelStamps(view)   S.warm()   S.stamp(text, { hex, film, size, x, y, spin, life })   S.chain(step, side)   S.clear()   STAMPS (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wordTexture } from './cutin.js';
import { feelColour } from './layout.js';

/** slam: real s in from big; life: held; pop: out; size: the word's height (of the screen's shorter side); chain: a step's growth past
 *  the third and the cap; x, y: where (of the screen); rays: the sunburst's count. */
export const STAMPS = { slam: 0.09, life: 0.75, pop: 0.16, size: 0.2, chain: { from: 3, grow: 0.035, max: 0.34, film: 5 }, x: 0.5, y: 0.34, rays: 18 };
const GOLD = 0xffd36a;

const FRAG = /* glsl */`
uniform sampler2D uWord; uniform vec2 uRes, uAt; uniform vec3 uCol; uniform float uT, uH, uAsp, uRot, uSlam, uA, uFilm, uSpin, uRays, uFlashK;
varying vec2 vUv;
void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes, d = px - uAt; float c = cos(uRot), s = sin(uRot); vec2 q = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
  float h = uH * uSlam, w = h * uAsp; vec2 wu = q / vec2(w, h) + 0.5;
  vec4 o = vec4(0.0);
  float r = length(d) / h, ang = atan(d.y, d.x) + uT * uSpin; // (the sunburst: rays turning behind the word, fading out past it)
  float ray = step(0.5, fract(ang / 6.2832 * uRays)), burst = ray * (1.0 - smoothstep(0.35, max(0.4, uAsp * 0.62), r)) * smoothstep(0.08, 0.2, r);
  vec3 rc = mix(uCol, vec3(1.0), 0.25); if (uFilm > 0.5) rc = 0.55 + 0.45 * cos(6.2832 * (ang / 6.2832 + uT * 0.4 + vec3(0.0, 0.33, 0.67)));
  o = mix(o, vec4(rc * 0.9, 1.0), burst * 0.55 * uA);
  float ca = (uSlam - 1.0) * 0.05 + 0.006;
  if (wu.x > -0.06 && wu.x < 1.06 && wu.y > 0.0 && wu.y < 1.0) {
    vec2 tq = vec2(wu.x, 1.0 - wu.y); vec4 T = texture2D(uWord, tq), R = texture2D(uWord, tq + vec2(ca, 0.0)), B = texture2D(uWord, tq - vec2(ca, 0.0));
    vec3 fill = uCol; if (uFilm > 0.5) fill = 0.6 + 0.4 * cos(6.2832 * (wu.x * 0.9 - uT * 0.8 + vec3(0.0, 0.33, 0.67))); // (the film's colours run through the letters)
    fill = mix(fill, vec3(1.0), smoothstep(0.55, 1.0, 1.0 - wu.y) * 0.45); // (a highlight across the top of the letters: the shine of a printed sticker)
    vec3 tc = T.rgb * fill; float a = max(T.a, max(R.a, B.a));
    vec3 col = vec3(mix(o.r, R.r * fill.r, R.a), mix(o.g, tc.g, T.a), mix(o.b, B.b * fill.b, B.a));
    o = vec4(mix(col, vec3(1.0), uFlashK * a), max(o.a, a * uA));
  }
  o.a *= uA; gl_FragColor = o;
  #include <colorspace_fragment>
}`;
const VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export class DuelStamps {
  constructor(view) { this.view = view; this.game = view.game; this.words = new Map(); this.age = -1; this.t = 0; }

  ensure() {
    const S = this.game.overlayScene; if (this.mesh || !S || typeof document === 'undefined') return !!this.mesh;
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0.5, -0.5, 0);
    this.u = { uWord: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uAt: { value: new THREE.Vector2() }, uCol: { value: new THREE.Color(GOLD) }, uT: { value: 0 }, uH: { value: 40 }, uAsp: { value: 2 },
      uRot: { value: 0 }, uSlam: { value: 1 }, uA: { value: 0 }, uFilm: { value: 0 }, uSpin: { value: 0.6 }, uRays: { value: STAMPS.rays }, uFlashK: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ name: 'duel-stamp', uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.name = 'duel-stamp'; this.mesh.frustumCulled = false; this.mesh.renderOrder = 52; this.mesh.userData.overlayHidden = true; this.mesh.visible = false;
    this.slot = S.add(this.mesh, { anchor: 'tl', z: 402, update: (dt, slot) => this.frame(dt, slot) });
    return true;
  }

  word(text) { let w = this.words.get(text); if (!w) { w = wordTexture(text); this.words.set(text, w); } return w; }

  /** At the duel's open: the program compiled, hidden. */
  warm() {
    if (!this.ensure()) return; const S = this.game.overlayScene, r = S.r; this.u.uWord.value = this.word('VS').tex; this.mesh.visible = true;
    try { const was = r.getRenderTarget(); r.setRenderTarget(null); r.compile(this.mesh, S.camera); r.setRenderTarget(was); } catch { /* (headless: drawn on first use) */ }
    this.mesh.visible = false;
  }

  /** A word slammed on: `size` of the shorter side, at (x, y) of the screen, tilted `tilt` rad, held `life` real s. */
  stamp(text, { hex = GOLD, film = false, size = STAMPS.size, x = STAMPS.x, y = STAMPS.y, tilt = -0.08, life = STAMPS.life, spin = 0.6 } = {}) {
    if (!text || !this.ensure()) return; const W = this.word(text);
    this.u.uWord.value = W.tex; this.u.uAsp.value = W.aspect; this.u.uCol.value.setHex(hex); this.u.uFilm.value = film ? 1 : 0; this.u.uSpin.value = spin;
    this.o = { size, x, y, tilt, life }; this.age = 0; this.mesh.userData.overlayHidden = false;
  }

  /** A duel's chain from its third step: one count, louder a step (the board's numeral stands aside: beats.js). */
  chain(step, side = 0) {
    const C = STAMPS.chain; if (step < C.from) return false;
    const n = step - C.from, film = step >= C.film, hex = side === 1 ? feelColour(this.view.aspect, new THREE.Color()).getHex() : GOLD;
    this.stamp(`${step} CHAIN${'!'.repeat(Math.min(3, 1 + n))}`, { hex, film: film && side === 0, size: Math.min(C.max, STAMPS.size + C.grow * n), x: side === 1 ? 0.62 : 0.4, y: 0.3, tilt: (side === 1 ? 0.07 : -0.07) * (1 + 0.2 * n), spin: 0.6 + 0.5 * n, life: 0.55 + 0.05 * n });
    this.view.stage?.jolt?.(0.12 + 0.05 * n);
    return true;
  }

  clear() { this.age = -1; if (this.mesh) { this.mesh.userData.overlayHidden = true; this.mesh.visible = false; } }

  frame(dt, slot) {
    this.t += dt; if (this.age < 0) return; this.age += dt;
    const o = this.o, a = this.age, w = slot.view.w, h = slot.view.h, u = this.u, end = STAMPS.slam + o.life + STAMPS.pop;
    if (a > end) { this.clear(); return; }
    const sl = Math.min(1, a / STAMPS.slam), held = Math.max(0, a - STAMPS.slam), out = Math.max(0, (a - STAMPS.slam - o.life) / STAMPS.pop);
    this.mesh.scale.set(w, h, 1); u.uRes.value.set(w, h); u.uT.value = this.t; u.uAt.value.set(w * o.x, h * o.y);
    u.uH.value = Math.min(w, h) * o.size * (1 + 0.04 * held) * (1 + 0.5 * out); // (it grows a hair while it holds, then pops away bigger)
    u.uSlam.value = 1 + 1.6 * (1 - sl) * (1 - sl) + (sl >= 1 && held < 0.12 ? 0.05 * Math.sin(held * 90) * (1 - held / 0.12) : 0); // (in from big, a shiver as it lands)
    u.uRot.value = o.tilt * (1 + 0.6 * (1 - sl)); u.uA.value = (1 - out) * Math.min(1, a / 0.03); u.uFlashK.value = sl >= 1 && held < 0.05 ? 1 : 0;
  }
}
