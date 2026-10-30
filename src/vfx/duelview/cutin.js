// ---------------------------------------------------------------------------------------
// A FOE SKILL'S CUT-IN / THE LIMIT BREAK (plain names; South, 2026-10-28: "go full throttle on the aberrant's special attacks"; the
// strongest "should feel like a limit break"): before each foe skill casts (foecast.js), the duel stops for a held beat while a band
// tears across the screen: a slanted slab of ink in the aberrant's feeling, speed lines streaming through it, halftone at its edges,
// a gold and feeling-coloured rim; on its right the aberrant itself, live, cut to its head in a strip (a second small render of its
// own meshes under a key and a rim in its feeling, pushing in through the hold); on its left the skill's label in the System's type
// (Espada's words: the label alone, HURL .. RECLAIM; the log carries the sentence), slammed down with its shadow in the feeling. Then
// the band squashes to a line and is gone. `foe.desperate` is the limit break: a wider band, the screen round it dimmed, the frame
// flashed in negative as CORNERED lands, a longer hold; the skills it casts at once come after it with no cut-in of their own.
// The phase carries the foe event itself (Wanda's stings key off it: the label slams on her hit), and the cast's phase after it none.
// Drawn on the overlay's scene (render/overlayscene.js: CSS px, after the grade, at the 480-line present), one plane, one program: the
// band, the portrait and the word are all its fragment. The portrait's target and its proxies are built and drawn once at the duel's
// open (`warm`), so neither program compiles at the moment it is wanted.
// Prior art: Fire Emblem's and Super Robot Wars' eye-strip cut-ins, Persona 5's all-out attack slab and halftone, Final Fantasy VII's
// limit break (the screen held, the name in the frame), Guilty Gear's super flash, Puzzle & Dragons' enemy skill banner; the creature
// tags' own render of a creature's meshes alone (creaturetags.js sampleMesh).
//
//   const C = new FoeCutIn(view)   C.warm()   C.beat(e) -> phase | null (once an event)   C.turn(e) -> real s to wait (the turn's band)   C.veil(k) (the screen darkened, no band)   C.clear()   CUT_IN (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FONT } from '../../ui/theme.js';
import { runningHand } from '../../ui/runninghand.js';
import { FOE_SKILLS } from '../../progress/duel/foeskills.js';
import { feelColour, sm, clamp01 } from './layout.js';
import { SIDE, tex, chantTexture, compileOverlay } from './fxkit.js';
import { FEELINGS } from '../../npc/neuraleseroots.js';

/** in / hold / out: the band's beats (real s; the limit break's hold its own); band: its half height (of the screen's); y: its centre;
 *  tilt: its slope; portrait: the strip's share of the width; rt: the portrait's target width (px); fov: the strip camera's (deg);
 *  burst: real s after a limit break in which its own casts come without a cut-in; word / limitWord: when the label slams (real s from
 *  the event: Wanda's stings land there, audio/duelcasts.js CUT_IN_LEAD; the limit break's after its 1.1 s swell); lead / limitLead: the
 *  held beat after the band has gone before its cast lands (South, 2026-10-30: "the timing of the cut-ins staggered a little bit"); turn.settle:
 *  the beat the board is left to settle before the turn's band tears in over it (beats.js); light: the strip's key, rim and ambient (an
 *  elite's PORTRAIT.light scales them). */
export const CUT_IN = { in: 0.14, hold: 0.62, out: 0.16, limitHold: 1.45, word: 0.12, limitWord: 1.1, band: 0.16, limitBand: 0.24, y: 0.4, tilt: -0.09, portrait: 0.44, rt: 512, fov: 24, burst: 4,
  lead: 0.2, limitLead: 0.25, light: { key: 2.6, rim: 3.2, amb: 0.35 },
  turn: { in: 0.1, hold: 0.3, out: 0.14, word: 0.12, band: 0.085, lit: 0.35, settle: 0.3 }, vs: { in: 0.16, hold: 1.05, out: 0.18, word: 0.2, band: 0.13 }, pop: 0.06, red: 0.5 };
/** The turn's change (South, 2026-10-29: "cut-ins/highlights and vfx for when the turns switch over"; Fire Emblem's PLAYER PHASE and
 *  ENEMY PHASE): the band thinner and shorter, yours in the film. */
export const TURN_WORDS = ['YOUR TURN', "FOE'S TURN"]; // (Espada's, 2026-10-29: the duel says foe, never enemy)
const FILM = new THREE.Color(0x9ee6ff);
const INK = '#17111f', GOLD = new THREE.Color(0xffd36a);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _k = new THREE.Vector3(), _c = new THREE.Color(), _bb = new THREE.Box3();

const FRAG = /* glsl */`
uniform sampler2D uPort, uWord, uChant, uCrack, uSand; uniform vec2 uRes; uniform vec3 uFeel, uGold, uDeep, uSideHi; uniform float uMotif, uChantA; uniform float uT, uIn, uOut, uLimit, uWordAsp, uSlam, uWordOn, uFlash, uDim, uDrift, uFlip, uFocus, uPop;
uniform vec4 uBand; // (centre y px, half height px, slope, portrait share)
varying vec2 vUv;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 sp = vec2(vUv.x, 1.0 - vUv.y) * uRes, px = vec2(mix(sp.x, uRes.x - sp.x, uFlip), sp.y); float W = uRes.x; // (px: the band's own space, mirrored for yours: it tears in from the left)
  float hh = uBand.y * (1.0 - 0.97 * uOut), yb = px.y - uBand.x - (px.x - W * 0.5) * uBand.z, by = yb / max(hh, 0.5);
  float wipe = W * (1.0 - uIn * 1.2) + yb * 0.7; // (its leading edge, slanted, from the right)
  vec4 o = vec4(0.0, 0.0, 0.0, uDim * (1.0 - uOut));
  float wh = min(2.0 * uBand.y * 0.6, W * 0.34 / uWordAsp) * uSlam, ww = wh * uWordAsp; vec2 wc = vec2(W * 0.34, uBand.x + (W * 0.34 - W * 0.5) * uBand.z); // (clear of the phone's left tiles)
  if (uFocus > 0.001 && abs(by) > 1.0) { // (the focus lines: manga's speed lines raying in on the word from the screen's edges, flickering)
    vec2 d = px - wc; float r = length(d) / uRes.y, ang = atan(d.y, d.x) / 6.2832 + 0.5, seg = floor(ang * 90.0), rh = h21(vec2(seg, floor(uT * 14.0)));
    float line = step(0.62, rh) * smoothstep(0.32 + 0.25 * h21(vec2(seg, 7.0)), 0.95, r) * (1.0 - smoothstep(0.0, 0.5, abs(fract(ang * 90.0) - 0.5) * 2.0 - 0.3));
    o = mix(o, vec4(mix(vec3(1.0), uFeel * 1.4, 0.35), 1.0), clamp(line * uFocus * 0.6, 0.0, 1.0));
  }
  if (abs(by) <= 1.0 && px.x >= wipe) {
    float bx = px.x / uRes.y;
    vec3 c = mix(uDeep, uFeel * 0.2, 0.4 + 0.3 * by); // (its side's deep: lapis yours, cinnabar the aberrant's)
    float row = floor((by * 0.5 + 0.5) * 44.0), rh = h21(vec2(row, 3.0)), s = fract(bx * (0.6 + rh * 1.4) + uT * (2.2 + rh * 3.5) + rh);
    float streak = smoothstep(0.0, 0.05, s) * (1.0 - smoothstep(0.05, 0.4, s)) * step(0.5, rh);
    c += uFeel * streak * 0.6 + streak * 0.06;
    if (uMotif > 0.5 && uMotif < 1.5) { float cr = texture2D(uCrack, px / 240.0 + vec2(uT * 0.02, 0.0)).a; c = mix(c, vec3(1.0, 0.8, 0.42), cr * 0.17); } // (yours: the clay's craze, kintsugi's gold)
    else if (uMotif > 1.5 && uMotif < 2.5) { float col = floor(px.x / 22.0), on = step(0.5, h21(vec2(col, 5.0))); // (the slip jelly's: sand pouring down through the band)
      float g = texture2D(uSand, vec2(fract(px.x / 22.0), px.y / 260.0 - uT * (1.4 + h21(vec2(col, 9.0))))).a; c = mix(c, uFeel * 0.5 + vec3(0.4, 0.32, 0.15), g * on * 0.75); }
    else if (uMotif > 3.5) { // (Strawman's: a burlap band, two seams of cross-stitch along it, straw blown through it, a target behind its head)
      vec2 wv = px / 7.0; float th = max(smoothstep(0.18, 0.5, abs(fract(wv.x) - 0.5)), smoothstep(0.18, 0.5, abs(fract(wv.y) - 0.5)));
      c = mix(c, vec3(0.5, 0.36, 0.2) * (0.72 + 0.32 * th + 0.12 * h21(floor(wv * vec2(1.0, 0.25)))) + uFeel * 0.03, 0.8);
      float tph = 2.0 * uBand.y; vec2 tc = vec2(W * (0.985 - uBand.w) + (1.0 - uIn) * W * 0.3 - uDrift + W * uBand.w * 0.5, uBand.x - uBand.y + (px.x - W * 0.5) * uBand.z + tph * 0.3);
      float tr = length(px - tc) / (tph * 0.42); // (behind the portrait's head: the kiln's red on cream in five rings, as its belly's)
      if (uBand.w > 0.001 && tr < 1.0) c = mix(c, mix(mod(floor(tr * 5.0), 2.0) < 0.5 ? vec3(0.5, 0.06, 0.035) : vec3(0.88, 0.78, 0.58), vec3(0.08, 0.04, 0.02), step(0.94, tr)), 0.88);
      for (int k = 0; k < 2; k++) { float sg = k == 0 ? 1.0 : -1.0; vec2 o = vec2((fract(px.x / 18.0) - 0.5) * 18.0, (by - 0.46 * sg) * hh); // (the seams' cross-stitches, 18 px apart)
        float x = min(abs(o.x - o.y), abs(o.x + o.y)); c = mix(c, vec3(0.86, 0.76, 0.56), (1.0 - smoothstep(1.4, 2.8, x)) * step(abs(o.y), 6.5) * step(abs(o.x), 6.5)); }
      for (int k = 0; k < 2; k++) { float fk = float(k), sp = px.x + uT * (900.0 + 500.0 * fk); vec2 cell = vec2(floor(sp / 110.0), floor(px.y / 26.0)), f = vec2(fract(sp / 110.0) * 110.0 - 55.0, fract(px.y / 26.0) * 26.0 - 13.0); // (straw blown through, right to left)
        float h = h21(cell + fk * 9.0); vec2 d = normalize(vec2(1.0, (h21(cell + 4.0) - 0.5) * 0.7)) * (14.0 + 12.0 * h), o2 = f - vec2((h - 0.5) * 40.0, (h21(cell + 2.0) - 0.5) * 8.0);
        float sd = length(o2 - d * clamp(dot(o2, d) / dot(d, d), -1.0, 1.0)); c = mix(c, vec3(0.92, 0.7, 0.28) * (1.1 - 0.3 * fk), step(0.5, h) * (1.0 - smoothstep(1.3, 2.6, sd)) * (0.9 - 0.3 * fk)); } }
    else if (uMotif > 2.5) { for (int k = 0; k < 3; k++) { float fk = float(k), yy = sin(bx * (2.5 + fk) + fk * 2.1 + uT * 0.4) * 0.35 + (fk - 1.0) * 0.5; // (the Lantern Wisp's: black briars across it, lanterns hung off them)
        c = mix(c, vec3(0.02, 0.015, 0.015), smoothstep(0.11, 0.05, abs(by - yy)));
        float lx = fract(bx * 0.8 + fk * 0.37) - 0.5, ld = length(vec2(lx * 2.4, (by - yy + 0.2) * 1.3)); c += vec3(1.0, 0.6, 0.22) * smoothstep(0.22, 0.0, ld) * (0.55 + 0.45 * sin(uT * 9.0 + fk * 3.0 + bx)); } }
    for (int k = 0; k < 2; k++) { float sg = k == 0 ? 1.0 : -1.0, cy = (by - 0.74 * sg) / 0.2; // (the chant: neuralese running along both edges, the two lines counter-scrolling)
      if (abs(cy) < 1.0) { float sh = hh * 0.4, cu = fract(px.x / (sh * uChantA) - uT * 0.14 * sg); float ca2 = texture2D(uChant, vec2(cu, 0.5 - cy * 0.5)).a; c = mix(c, uSideHi, ca2 * 0.7); } }
    vec2 cell = fract(px / 6.0) - 0.5; float edge = smoothstep(0.4, 1.0, abs(by)), r = edge * 0.5;
    c = mix(c, uFeel * 0.55, (1.0 - smoothstep(r - 0.1, r, length(cell))) * edge * 0.75);
    float pw = W * uBand.w, ph = 2.0 * uBand.y; vec2 p0 = vec2(W * (0.985 - uBand.w) + (1.0 - uIn) * W * 0.3 - uDrift, uBand.x - uBand.y + (px.x - W * 0.5) * uBand.z);
    vec2 pu = (px - p0) / vec2(pw, ph);
    if (uBand.w > 0.001 && pu.x > 0.0 && pu.x < 1.0 && pu.y > 0.0 && pu.y < 1.0) {
      vec4 P = texture2D(uPort, vec2(mix(pu.x, 1.0 - pu.x, uFlip), 1.0 - pu.y)); vec3 pc = P.rgb / (1.0 + P.rgb) * 1.45; // (your own portrait never mirrored)
      c = mix(c, pc, P.a * smoothstep(0.0, 0.3, pu.x));
    }
    vec2 wu = (px - wc) / vec2(ww, wh) + 0.5; wu.y += (px.x - wc.x) * uBand.z / wh; wu.x = mix(wu.x, 1.0 - wu.x, uFlip); // (the label reads the right way round on a mirrored band)
    vec2 su = wu - vec2(0.012, -0.06);
    if (su.x > 0.0 && su.x < 1.0 && su.y > 0.0 && su.y < 1.0) c = mix(c, uFeel * 1.2, texture2D(uWord, vec2(su.x, 1.0 - su.y)).a * uWordOn * 0.9);
    float ca = (uSlam - 1.0) * 0.03 + 0.004; // (the slam's colour split: red and cyan torn off the label, settling to a hair)
    if (wu.x > -0.05 && wu.x < 1.05 && wu.y > 0.0 && wu.y < 1.0) { vec2 q = vec2(wu.x, 1.0 - wu.y); vec4 T = texture2D(uWord, q), R = texture2D(uWord, q + vec2(ca, 0.0)), Bc = texture2D(uWord, q - vec2(ca, 0.0));
      c.r = mix(c.r, R.r, R.a * uWordOn); c.g = mix(c.g, T.g, T.a * uWordOn); c.b = mix(c.b, Bc.b, Bc.a * uWordOn); }
    float rim = (1.0 - abs(by)) * hh;
    c = mix(c, uFeel * 1.5, 1.0 - smoothstep(2.0, 4.5, rim)); c = mix(c, uGold * 1.2, 1.0 - smoothstep(0.6, 1.8, rim));
    c += vec3(1.0) * (1.0 - smoothstep(0.0, 24.0, px.x - wipe)) * (1.0 - uIn) * 2.0;
    c = mix(c, vec3(1.0), uPop); // (the impact frame: the band white for a frame as it lands)
    c = mix(c, vec3(1.0) - clamp(c, 0.0, 1.0), uFlash);
    o = vec4(c, 1.0);
  }
  gl_FragColor = o;
  #include <colorspace_fragment>
}`;
const VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** A label in the System's type, white with an ink keyline, on a transparent canvas (its aspect beside it). */
export function wordTexture(text, { num = null } = {}) {
  const TH = 160, NH = num == null ? 0 : 84, H = TH + NH, c = document.createElement('canvas'), x = c.getContext('2d'), font = `bold 120px ${FONT.sys}`;
  x.font = font; const N = num == null ? null : runningHand(null, [{ num }], { scale: 8.5 }); // (a count's numeral in neuralese hung under it: Espada's, NEURALESE.md 2b)
  const w = Math.ceil(Math.max(x.measureText(text).width, N ? N.width + 40 : 0) + 70); c.width = w; c.height = H;
  const paint = () => { x.clearRect(0, 0, w, H); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 18; x.strokeStyle = INK; x.strokeText(text, w / 2, TH / 2 + 6); x.fillStyle = '#ffffff'; x.fillText(text, w / 2, TH / 2 + 6);
    if (N) { const at = { x: (w - N.width) / 2, y: TH - 2, scale: 8.5 }; runningHand(x, [{ num }], { ...at, ink: INK, lw: 17 }); runningHand(x, [{ num }], { ...at, ink: '#ffffff', lw: 7 }); } };
  paint(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  document.fonts?.load?.(font).then(() => { paint(); t.needsUpdate = true; }, () => {});
  return { tex: t, aspect: w / H };
}

export class FoeCutIn {
  /** `subject` 'foe' (the aberrant's, from the right) or 'jar' (yours: the Pneuka Jar's portrait, the band mirrored in from the left). */
  constructor(view, { subject = 'foe' } = {}) { this.subject = subject; this.flip = subject === 'jar' ? 1 : 0; this.view = view; this.game = view.game; this.words = new Map(); this.seen = new WeakSet(); this.cut = new WeakSet(); this.age = -1; this.limitAt = -99; this.t = 0; this.proxies = []; }

  /** The plane on the overlay's scene, the portrait's target, scene, camera and lights: made once. */
  ensure() {
    const S = this.game.overlayScene; if (this.mesh || !S || typeof document === 'undefined') return !!this.mesh;
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0.5, -0.5, 0);
    this.rt = new THREE.WebGLRenderTarget(CUT_IN.rt, CUT_IN.rt / 2, { type: THREE.HalfFloatType });
    this.u = { uPort: { value: this.rt.texture }, uWord: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uFeel: { value: new THREE.Color() }, uGold: { value: GOLD.clone() },
      uT: { value: 0 }, uIn: { value: 0 }, uOut: { value: 0 }, uLimit: { value: 0 }, uWordAsp: { value: 3 }, uSlam: { value: 1 }, uWordOn: { value: 0 }, uFlash: { value: 0 }, uDim: { value: 0 }, uDrift: { value: 0 }, uFlip: { value: this.flip }, uFocus: { value: 0 }, uPop: { value: 0 }, uBand: { value: new THREE.Vector4() },
      uChant: { value: null }, uCrack: { value: tex('crackle') }, uSand: { value: tex('sand') }, uDeep: { value: new THREE.Color() }, uSideHi: { value: new THREE.Color() }, uMotif: { value: 0 }, uChantA: { value: 6 } };
    this.dressSide();
    const mat = new THREE.ShaderMaterial({ name: 'duel-cutin', uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.name = 'duel-cutin';
    this.mesh.renderOrder = this.flip ? 49 : 50; this.mesh.frustumCulled = false; this.mesh.userData.overlayHidden = true;
    this.slot = S.add(this.mesh, { anchor: 'tl', z: this.flip ? 399 : 400, update: (dt, slot) => this.frame(dt, slot) });
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(CUT_IN.fov, 2, 0.05, 60);
    const Lt = CUT_IN.light; this.key = new THREE.DirectionalLight(0xfff2e0, Lt.key); this.rim = new THREE.DirectionalLight(0xffffff, Lt.rim); this.amb = new THREE.AmbientLight(0xffffff, Lt.amb);
    this.scene.add(this.key, this.key.target, this.rim, this.rim.target, this.amb);
    return true;
  }

  /** Who is who: lapis and the film yours, cinnabar and ember the aberrant's; the chant in its words (the feelings' names yours, its own feeling's its). */
  dressSide() {
    const S = SIDE[this.flip ? 0 : 1], w = FEELINGS[this.view.aspect] || 'PAVA', ch = chantTexture(this.flip ? Object.values(FEELINGS) : [w, 'PAVA', w, 'MOR']);
    this.u.uChant.value = ch; this.u.uChantA.value = ch?.image ? ch.image.width / ch.image.height : 6;
    this.u.uDeep.value.setHex(S.deep); this.u.uSideHi.value.setHex(S.hi); this.u.uGold.value.setHex(S.rim);
  }

  word(text) { let w = this.words.get(text); if (!w) { w = wordTexture(text); this.words.set(text, w); } return w; }

  /** The foe's drawn meshes as proxies in the portrait's scene (its geometry, materials and skeleton shared), and its bounds. */
  gather() {
    for (const { p } of this.proxies) this.scene.remove(p); this.proxies.length = 0; this.box = null;
    const f = this.subject === 'jar' ? null : this.view.foe, J = this.subject === 'jar' ? this.view.dive?.jar : null, root = J ? J.group : f?.root || f?.model?.group; if (!root) return false;
    root.updateMatrixWorld(true); const box = new THREE.Box3();
    root.traverseVisible((o) => {
      if (!o.isMesh || o.isPoints || o.isSprite || !o.material || /databug|glint|aura|shadow|tag/i.test(o.name || '')) return;
      let p; if (o.isSkinnedMesh && o.skeleton) { p = new THREE.SkinnedMesh(o.geometry, o.material); p.bind(o.skeleton, o.bindMatrix); p.bindMode = o.bindMode; } else p = new THREE.Mesh(o.geometry, o.material);
      p.matrixAutoUpdate = false; p.matrix.copy(o.matrixWorld); p.frustumCulled = false; this.scene.add(p); this.proxies.push({ o, p });
      if (!o.isSkinnedMesh) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(_bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }
    });
    if (box.isEmpty() && J) { const k = J.group.scale.y || 1; box.setFromCenterAndSize(_a.copy(J.group.position).setY(J.group.position.y + 0.6 * k), _b.set(0.9 * k, 1.25 * k, 0.9 * k)); } // (the Jar's body is skinned: its bounds from where it stands)
    if (box.isEmpty() && f?.pos) box.setFromCenterAndSize(_a.copy(f.pos).setY(f.pos.y + 1), _b.set(1, 2, 1));
    this.box = box.isEmpty() ? null : box; return this.proxies.length > 0;
  }

  /** The strip's camera on the foe's head from in front of it (toward the Courier's end), a quarter turned, a little low; pushed in by `k`. */
  aim(k, limit) {
    const V = this.view, B = this.box; if (!B) return;
    if (this.subject === 'jar') return this.aimJar(k);
    const size = B.getSize(_a), h = Math.max(0.4, size.y), f = V.foe, hd = typeof f?.head === 'function' ? f.head() : null; // (its own head where it says, else high on its bounds)
    const E = V.elite, P = E?.on ? E.constructor.PORTRAIT : null, lit = P?.light ?? 1; // (an aberrant with no face to cut to asks for its whole body: aberrants/jelly.js)
    const Lt = CUT_IN.light; this.key.intensity = Lt.key * lit; this.rim.intensity = Lt.rim * lit; this.amb.intensity = Lt.amb * lit;
    const ve = P?.whole ? Math.max(0.5, h * (limit ? 0.75 : 0.85)) : Math.max(0.5, h * (limit ? 0.3 : 0.38));
    const focus = P?.whole ? B.getCenter(_b) : hd?.isVector3 ? _b.copy(hd).setY(hd.y - ve * 0.6) : B.getCenter(_b).setY(B.max.y - h * 0.22);
    const yaw = (limit ? -0.18 : 0.32), dir = _a.copy(V.u).negate().setY(0).normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    const d = ve / 2 / Math.tan(THREE.MathUtils.degToRad(CUT_IN.fov / 2)) * (1 - 0.12 * k);
    this.cam.position.copy(focus).addScaledVector(dir, d); this.cam.position.y -= ve * 0.12; this.cam.up.set(limit ? Math.sin(0.12) : 0, 1, 0); this.cam.lookAt(focus);
    this.key.position.copy(this.cam.position).add(_a.set(-dir.z, 1.1, dir.x).multiplyScalar(d)); this.key.target.position.copy(focus);
    this.rim.position.copy(focus).addScaledVector(dir, -d).setY(focus.y + d * 0.6); this.rim.target.position.copy(focus);
    this.key.target.updateMatrixWorld(); this.rim.target.updateMatrixWorld();
  }

  /** The strip on the Pneuka Jar: from in front of it (toward the aberrant) and the face's side, a little low, its mouth high in frame. */
  aimJar(k) {
    const V = this.view, B = this.box, h = Math.max(0.4, B.getSize(_a).y), ve = h * 0.95, focus = B.getCenter(_b).setY(B.min.y + h * 0.55);
    const yaw = this.view.dive?.jar?.group.rotation.y ?? 0, dir = _a.set(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(this.view.show?.front ?? 1).addScaledVector(V.face, 0.45).setY(0).normalize(); // (from where the Jar faces, a quarter toward the board's face)
    const d = ve / 2 / Math.tan(THREE.MathUtils.degToRad(CUT_IN.fov / 2)) * (1 - 0.14 * k);
    this.cam.position.copy(focus).addScaledVector(dir, d); this.cam.position.y -= ve * 0.15; this.cam.up.set(0, 1, 0); this.cam.lookAt(focus);
    this.key.position.copy(this.cam.position).add(_k.set(dir.z, 1.1, -dir.x).multiplyScalar(d)); this.key.target.position.copy(focus);
    this.rim.position.copy(focus).addScaledVector(dir, -d).setY(focus.y + d * 0.6); this.rim.target.position.copy(focus);
    this.key.target.updateMatrixWorld(); this.rim.target.updateMatrixWorld();
  }

  /** The portrait's strip drawn (its target), the main renderer's state put back. */
  shoot(aspect) {
    const r = this.game.overlayScene?.r; if (!r || !this.proxies.length) return;
    for (const { o, p } of this.proxies) { p.matrix.copy(o.matrixWorld); p.visible = o.visible; }
    const h = Math.max(64, Math.round(CUT_IN.rt / Math.max(1, aspect))); if (this.rt.height !== h) this.rt.setSize(CUT_IN.rt, h);
    this.cam.aspect = CUT_IN.rt / h; this.cam.updateProjectionMatrix();
    const was = r.getRenderTarget(), auto = r.autoClear, cc = r.getClearColor(_c), ca = r.getClearAlpha(), cr = cc.clone();
    try { r.setRenderTarget(this.rt); r.setClearColor(0x000000, 0); r.autoClear = true; r.clear(); r.render(this.scene, this.cam); }
    finally { r.setRenderTarget(was); r.setClearColor(cr, ca); r.autoClear = auto; }
  }

  /** At the duel's open: the proxies gathered and drawn once and the band's program compiled, hidden. */
  warm() {
    if (this.view.state?.style !== 'pve' || !this.ensure()) return;
    this.gather(); this.feel(); this.aim(0, false); this.shoot(2.5);
    const S = this.game.overlayScene; this.mesh.visible = true; compileOverlay(S, this.mesh);
    this.mesh.visible = false;
  }

  feel() { feelColour(this.view.aspect, this.u.uFeel.value).lerp(_c.setHex(SIDE[1].base), CUT_IN.red); } // (its feeling, pulled toward cinnabar: the aberrant red-coded, its feeling still in it)

  /** The cut-in's phase for a foe event, once an event: a skill's, or the limit break's; null for the rest. */
  beat(e) {
    if (this.seen.has(e) || !this.ensure()) return null; this.seen.add(e);
    const limit = e.type === 'foe.desperate';
    if (!limit && (e.type !== 'foe.skill' || this.t - this.limitAt < CUT_IN.burst)) return null;
    const text = limit ? 'CORNERED' : (FOE_SKILLS[e.skill]?.label || e.skill || '').toUpperCase(); if (!text) return null;
    if (limit) { this.limitAt = this.t; this.view.game.glitch?.pulse?.({ split: 0.12, tear: 0.08, dur: 0.25 }); }
    return this.phase(e, text, { limit });
  }

  /** Your own big moment's band (the Jar's cut-in, `subject: 'jar'`): a power that is a big play (YOURS.powers) or the finisher, once an
   *  event, in the power's domain's colour (`hex`); the finisher's is the limit break's. */
  yours(e, text, hex, { limit = false } = {}) {
    if (this.seen.has(e) || !this.ensure() || !text) return null; this.seen.add(e);
    this.u.uFeel.value.setHex(hex ?? FILM.getHex());
    return this.phase(e, text.toUpperCase(), { limit, keepFeel: true });
  }

  /** A band held as the phase carrying `e` (the duel waits for it): the label slammed, the portrait pushing in; then, the band gone, a held
   *  beat (CUT_IN.lead) before the cast. */
  phase(e, text, { limit = false, keepFeel = false } = {}) {
    if (!this.proxies.length || !this.proxies[0].o.parent) this.gather();
    this.show(text, { limit, own: false }); if (!keepFeel && this.subject === 'foe') this.feel();
    this.cut.add(e); return { events: [e], dur: this.dur + (limit ? CUT_IN.limitLead : CUT_IN.lead), // (the event itself: the sting and the director key off it here; its cast phase after says nothing again, beats.js)
      step: (u, age) => { this.age = age; }, end: () => this.hide() };
  }

  /** The band laid out and begun: `own` keeps its own clock (the turn's, the open's) and the duel does not wait past `T.in + T.hold`. */
  show(text, { limit = false, own = false, T = null, y = CUT_IN.y, portrait = CUT_IN.portrait, focus = true } = {}) {
    const W = text ? this.word(text) : null; this.u.uWord.value = W?.tex || null; this.u.uWordAsp.value = W?.aspect || 3; this.u.uLimit.value = limit ? 1 : 0;
    this.T = T || { in: CUT_IN.in, hold: limit ? CUT_IN.limitHold : CUT_IN.hold, out: CUT_IN.out, word: limit ? CUT_IN.limitWord : CUT_IN.word, band: limit ? CUT_IN.limitBand : CUT_IN.band };
    this.dressSide(); const E = this.view.elite; this.u.uMotif.value = this.flip ? 1 : E?.on ? E.constructor.MOTIF || 0 : 0; // (the actor's own ground behind the band)
    this.limit = limit; this.mode = own ? 'own' : 'skill'; this.hasWord = !!W; this.y = y; this.port = portrait; this.focus = focus;
    this.dur = this.T.in + this.T.hold + this.T.out; this.age = 0; this.shook = false; this.mesh.userData.overlayHidden = false;
    return this.T.in + this.T.hold;
  }

  /** The turn's change: the band torn across for the side whose turn it now is (its half of the board lit), shorter and thinner than a
   *  skill's; the duel waits only for its way in and its hold (the seconds it returns), its way out runs over what follows. Yours on
   *  the Jar's cut-in (beats.js), mirrored; the foe's on the foe's, its portrait in the band. */
  turn(e) {
    if (!this.ensure() || (e.side !== 0 && e.side !== 1)) return 0;
    this.view.clash?.flash?.(e.side, CUT_IN.turn.lit);
    if (!this.proxies.length || !this.proxies[0].o.parent) this.gather();
    if (e.side === 1) this.feel(); else this.u.uFeel.value.copy(FILM);
    const has = this.proxies.length > 0;
    return this.show(TURN_WORDS[e.side], { own: true, T: CUT_IN.turn, portrait: has && e.side === 1 ? CUT_IN.portrait : 0, focus: false }); // (yours mirrored, no strip: the Jar reads only in a full band's height)
  }

  /** The open's band (VS: duelshow.js): its own clock, at `y` (of the screen's height), the label beside the portrait (or none), gone
   *  `until` real s after it begins (its hold stretched to it: the two bands of the VS leave together however apart they came). */
  vs(text, hex, y, until = null) {
    if (!this.ensure()) return 0; if (!this.proxies.length || !this.proxies[0].o.parent) this.gather();
    if (hex == null) this.feel(); else this.u.uFeel.value.setHex(hex);
    const V = CUT_IN.vs, T = until == null ? V : { ...V, hold: Math.max(0.2, until - V.in - V.out) };
    return this.show(text, { own: true, T, y, portrait: this.proxies.length ? CUT_IN.portrait : 0, focus: false });
  }

  hide() { this.age = -1; if (this.mesh && this.veilK > 0.001) return; if (this.mesh) { this.mesh.userData.overlayHidden = true; this.mesh.visible = false; } }
  clear() { this.veilK = 0; this.hide(); this.limitAt = -99; for (const { p } of this.proxies) this.scene?.remove(p); this.proxies.length = 0; }

  /** The veil: the screen darkened with no band (0 gone .. 1 black), for a death held in the dark (aberrants/wisp.js). */
  veil(k) { if (!this.ensure()) return; this.veilK = Math.max(0, k || 0); if (this.age < 0) { const on = this.veilK > 0.001; this.mesh.userData.overlayHidden = !on; if (!on) this.mesh.visible = false; } }

  /** The overlay's call each frame it is shown: the band laid out on the screen, its beats, the strip drawn. */
  frame(dt, slot) {
    this.t += dt;
    if (this.age < 0) { if (!(this.veilK > 0.001)) return; const u = this.u, w = slot.view.w, h = slot.view.h; // (the veil alone: no band, no word)
      this.mesh.scale.set(w, h, 1); u.uRes.value.set(w, h); u.uIn.value = 0; u.uOut.value = 0; u.uWordOn.value = 0; u.uFlash.value = 0; u.uFocus.value = 0; u.uPop.value = 0; u.uDim.value = this.veilK; u.uBand.value.set(-h, 0, 0, 0); return; }
    if (this.mode === 'own') { this.age += dt; if (this.age > this.dur) { this.hide(); return; } } // (the turn's and the open's bands keep their own clock: their way out runs over the beats after)
    const w = slot.view.w, h = slot.view.h, u = this.u, a = this.age, L = this.limit, T = this.T, tin = T.in, hold = T.hold;
    if (a >= this.dur) { u.uBand.value.set(-h, 0, 0, 0); u.uWordOn.value = 0; u.uFocus.value = 0; u.uPop.value = 0; u.uFlash.value = 0; u.uDim.value = 0; return; } // (a skill's band gone, its phase holding the beat before the cast: CUT_IN.lead)
    this.mesh.scale.set(w, h, 1); u.uRes.value.set(w, h); u.uT.value = this.t;
    const kin = sm(clamp01(a / tin)), kout = sm(clamp01((a - tin - hold) / T.out)), kh = clamp01((a - tin) / hold);
    u.uIn.value = kin; u.uOut.value = kout; u.uDim.value = L ? (0.3 + 0.25 * clamp01(a / CUT_IN.limitWord)) * kin : 0; u.uDrift.value = kh * w * 0.02;
    u.uPop.value = a > tin && a < tin + CUT_IN.pop ? 0.85 * (1 - (a - tin) / CUT_IN.pop) : 0; // (the impact frame as the band lands)
    u.uFocus.value = this.focus ? sm(clamp01((a - tin) / 0.08)) * (1 - kout) * (L ? 1 : 0.7) : 0;
    const band = T.band * h * (w < h ? 0.7 : 1), port = this.port; u.uBand.value.set(h * this.y, band, CUT_IN.tilt, port);
    const ws = a - T.word + 0.06, slam = clamp01(1 - ws / 0.06); u.uWordOn.value = this.hasWord && ws > 0 ? 1 : 0; u.uSlam.value = 1 + (L ? 1.6 : 1.1) * slam * slam;
    u.uFlash.value = L && ws > 0.1 && ws < 0.17 ? 1 : 0;
    if (L && ws > 0.1 && !this.shook) { this.shook = true; this.view.stage?.jolt?.(1); }
    if (port) { this.aim(kh, L); this.shoot((w * port) / (2 * band)); }
  }
}
