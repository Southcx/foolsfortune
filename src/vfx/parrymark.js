// ---------------------------------------------------------------------------------------
// THE PARRY MARK: what can be parried wears Lachryma (the owner, 2026-10-06; docs/plans/PARRY.md, OVERLAY.md). Every projectile that can
// be turned back, and the striking part of a creature's windup that can be answered (for its eta), is outlined in Lachryma: a shell of
// near-black ink round its silhouette with the oil film creeping through it. NOTHING ELSE EVER WEARS IT, so the eye learns one thing:
// that outline means "answer this". On a windup the outline thickens as the strike nears.
//
// THE WINDOW (the owner, 2026-10-10: "more apparent with a glint or color change that you're in the window to hit the 'V' key"): while
// a V pressed now would answer it, the mark runs HOT. The ink flips to Lachryma lit from inside (a white core, the film's colours at its
// rims, twice as wide) and holds exactly as long as V would answer, dropping back to ink the frame it would not (or the mark goes,
// the blow landed or parried). As it opens, THE WINDOW'S GLINT: a four-point star flares on the striking part's crest and is gone in
// 0.16 real seconds. What is hot is asked of the parry's own rule every frame (courier/parry.js: `pressAnswers` for a windup, the blow's
// window and the press's quarter second, Held Breath widening both; `shotAnswers` for a shot, inside the reach a press keeps), so the
// look can never drift from the press. Shape, width and brightness carry it as well as colour (read in greyscale). `parry.window
// { kind, by }` is said once as each opens (a ting for it is Wanda's).
//
// Prior art: Cuphead's pink parry objects (one colour means "parry this", and nothing else in the game uses it), Sekiro's perilous
// kanji and deflect flash and Elden Ring's weapon glint (a windup that marks itself), Ghost of Tsushima's glint on a blow that can be
// parried (the moment, flashed on the weapon), and the inverted hull outline of every cel-shaded game since Jet Set Radio (the mesh
// drawn again, its back faces pushed out along the normals: a silhouette line that needs no post pass). The hot line's white core
// between coloured rims is a neon tube's, drawn as two narrower hulls over the first, on the same program.
//
//   game.parryMark = new ParryMark(game)   const h = parryMark.mark(object3D, { eta? })   h.eta(seconds | null)   h.clear()
//   .update(rawDt, camera)   (eta: the seconds to the strike; null for a projectile, which wears it at full width while it can be parried)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { pressAnswers, shotAnswers, PRESS_WINDOW } from '../courier/parry.js';

const V = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform float uPx, uW, uAsp; varying vec3 vW;
uniform float uSq, uWob, uPh, uH, uFoot, uFootPh; uniform vec2 uLean; uniform vec4 uDent;
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  { // (a slip jelly's own bend: its squash, wobble, lean, toes and dent, as creatures/jelly/deform.js does it; its defaults change nothing)
    float h = clamp(position.y / uH, 0.0, 1.0), s = max(uSq, 0.15);
    float waist = 0.25 + 0.75 * sin(3.14159 * clamp(h * 1.05, 0.0, 1.0));
    transformed.xz *= mix(1.0, inversesqrt(s), waist); transformed.y *= s;
    transformed.xz *= 1.0 + uWob * sin(uPh - h * 5.5) * (0.25 + h);
    transformed.xz += uLean * h * h;
    if (uFoot > 0.0 && dot(position.xz, position.xz) > 1e-10) { // (the toes: atan(0, 0) is undefined, and a NaN times nothing is still NaN)
      float low = 1.0 - smoothstep(0.0, 0.3, h), ta = atan(position.x, position.z) * 4.0 - uFootPh;
      transformed.y += uFoot * low * max(0.0, sin(ta)) * 0.11 * uH;
      transformed.xz *= 1.0 + uFoot * low * sin(ta + 1.2) * 0.14;
    }
    float dd = length(position - uDent.xyz);
    transformed -= objectNormal * uDent.w * exp(-dd * dd * 7.0);
  }
  #include <skinning_vertex>
  vec4 wp = modelMatrix * vec4(transformed, 1.0); vW = wp.xyz;
  vec4 cp = projectionMatrix * viewMatrix * wp;
  vec3 n = normalize(mat3(viewMatrix) * mat3(modelMatrix) * objectNormal);
  vec2 dir = normalize((projectionMatrix * vec4(n, 0.0)).xy + 1e-6);
  cp.xy += dir * vec2(1.0 / uAsp, 1.0) * uW * uPx * cp.w;                       // (pushed out along the normal by a constant number of pixels)
  gl_Position = cp;
}`;
// uHot: 0 the ink (its oil film running through it); 1 hot, the rim (the film's colours, lit); 2 hot, the core (white)
const F = /* glsl */`uniform float uT, uA, uHot; varying vec3 vW;
void main() {
  float ph = dot(vW, vec3(0.9, 1.3, 0.7)) * 2.0 - uT * 0.6;
  vec3 film = 0.5 + 0.5 * cos(6.2832 * (ph + vec3(0.0, 0.33, 0.67)));
  vec3 ink = vec3(0.004, 0.003, 0.007) + film * film * 0.1;
  vec3 hot = mix(0.02 + 0.75 * film * film, vec3(1.0), clamp(uHot - 1.0, 0.0, 1.0)); // (the rims dark enough to keyline the white: rule 105)
  gl_FragColor = vec4(mix(ink, hot, min(uHot, 1.0)), uA);
}`;

const WIDTH = 3.6; // (pixels at the 480-line present)
const HOT = { rim: 7, core: 4.8, inner: 2 }; // (the hot line, twice the ink's width: the film to 7 px, white to 4.8, the film again to 2: a neon tube)
const GLINT = { life: 0.16, px: 56, turn: 0.5, pool: 4 }; // (real seconds; its span at the peak, 480-line pixels; its twist, radians)

/** The window's glint: a four-point star, long thin arms and a hot centre, keylined dark so it holds on pale sand, with the oil film's
 *  colours between the keyline and the white (a conic sweep). One texture, drawn once. */
function glintTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'); g.translate(s / 2, s / 2);
  const star = (R, inner) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? R * inner : R; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); };
  g.fillStyle = 'rgba(21,8,6,0.9)'; star(63, 0.3);
  const film = g.createConicGradient(0, 0, 0);
  for (const [u, col] of [[0, '#7ff0ff'], [0.25, '#ff7ad9'], [0.5, '#ffe27a'], [0.75, '#8a7bff'], [1, '#7ff0ff']]) film.addColorStop(u, col);
  g.fillStyle = film; star(58, 0.24);
  g.fillStyle = '#ffffff'; star(50, 0.16);
  const core = g.createRadialGradient(0, 0, 0, 0, 0, 18); core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(0.6, 'rgba(255,255,255,0.9)'); core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A rest-shape point bent as a jelly's body is (its squash and lean: enough to find its crest). */
function bent(p, D) {
  const h = THREE.MathUtils.clamp(p.y / D.uH.value, 0, 1), s = Math.max(D.uSq.value, 0.15), waist = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, h * 1.05));
  const k = 1 + (1 / Math.sqrt(s) - 1) * waist;
  p.x = p.x * k + D.uLean.value.x * h * h; p.z = p.z * k + D.uLean.value.y * h * h; p.y *= s;
}
/** The jelly's bend, by name (creatures/jelly/deform.js's uniforms, handed over by reference to a shell over a bent body). */
const BEND = ['uSq', 'uLean', 'uWob', 'uPh', 'uH', 'uFoot', 'uFootPh', 'uDent'];
const _o = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(), _cam = new THREE.Vector3(), _m = new THREE.Matrix4();

export class ParryMark {
  constructor(game = null) {
    this.game = game;
    this.t = { value: 0 }; this.px = { value: 2 / 480 }; this.asp = { value: 16 / 9 };
    this.base = new THREE.ShaderMaterial({ name: 'parry-mark', uniforms: { uT: this.t, uPx: this.px, uAsp: this.asp, uW: { value: WIDTH }, uA: { value: 1 }, uHot: { value: 0 }, uSq: { value: 1 }, uLean: { value: new THREE.Vector2() }, uWob: { value: 0 }, uPh: { value: 0 }, uH: { value: 1 }, uFoot: { value: 0 }, uFootPh: { value: 0 }, uDent: { value: new THREE.Vector4(0, 0, 0, 0) } }, vertexShader: V, fragmentShader: F, side: THREE.BackSide, transparent: true, depthWrite: false });
    this.marks = new Set();
    this.glints = []; // (a few sprites, made on the first glint: the glyphs' own program, vfx/glyphs.js, a SpriteMaterial with a map and no fog)
  }

  /** Outline every mesh in `obj` in Lachryma. Returns a handle: eta(seconds to the strike, or null), clear(). */
  mark(obj, { eta = null } = {}) {
    const own = () => { const m = this.base.clone(); m.uniforms.uT = this.t; m.uniforms.uPx = this.px; m.uniforms.uAsp = this.asp; return m; }; // (one program; its width, fade and heat its own)
    const mat = own(), core = own(), inner = own(); core.uniforms.uHot.value = 2; core.uniforms.uW.value = HOT.core; inner.uniforms.uHot.value = 1; inner.uniforms.uW.value = HOT.inner;
    const shells = [], cores = [];
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.parryShell || o.userData.isOutline) return;
      for (const [m, list, lift] of [[mat, shells, 1], [core, cores, 2], [inner, cores, 3]]) { // (each narrower hull drawn over the last)
        const s = o.isSkinnedMesh ? new THREE.SkinnedMesh(o.geometry, m) : new THREE.Mesh(o.geometry, m);
        if (o.isSkinnedMesh) s.bind(o.skeleton, o.bindMatrix);
        s.userData.parryShell = true; s.parrySrc = o; s.renderOrder = (o.renderOrder || 0) + lift; s.frustumCulled = false; s.raycast = () => {};
        s.visible = list === shells; // (the core and the inner film are drawn only while the mark is hot: they cost nothing the rest of the time)
        o.add(s); list.push(s);
      }
    });
    const h = {
      mat, shells, cores, obj, hot: false, want: false, kind: null, tip: null, bend: null, twins: [],
      eta: (e) => { h.e = e; },
      clear: () => { for (const s of [...shells, ...cores]) s.parent?.remove(s); mat.dispose(); core.dispose(); inner.dispose(); for (const m of h.twins) m.dispose(); this.marks.delete(h); },
    };
    h.e = eta; this.marks.add(h);
    return h;
  }

  /** Once a frame: the film runs, a windup's outline thickens toward its window, and whatever a V pressed now would answer runs hot. */
  update(raw = 1 / 60, camera = null) {
    this.t.value += raw; if (camera?.aspect) this.asp.value = camera.aspect;
    const g = this.game;
    if (g) { // (asked of the parry's rule afresh each frame: a mark nothing vouches for this frame is not hot)
      for (const c of g.creatures?.list || []) {
        const w = c.windup; if (!w?.mark) continue;
        if (c.deform?.u && !w.mark.bend) this.bend(w.mark, c.mat, c.deform.u);
        if (c.alive && !c.ally && pressAnswers(g, w)) { w.mark.want = true; w.mark.kind = w.kind; }
      }
      for (const pr of g.projectiles || []) if (pr.mark && shotAnswers(g, pr)) { pr.mark.want = true; pr.mark.kind = 'shot'; }
    }
    for (const h of this.marks) {
      const hot = h.want; h.want = false;
      if (hot && !h.hot) this.opened(h, camera);
      if (hot !== h.hot) { h.hot = hot; for (const s of h.cores) s.visible = hot; }
      const U = h.mat.uniforms;
      if (hot) { U.uW.value = HOT.rim; U.uA.value = 1; U.uHot.value = 1; continue; }
      // (the ink thickens over the 0.8 s before a V would answer: eta is the time to the blow's window, shown so by creatures.shownEta)
      const e = h.e, k = e == null ? 1 : THREE.MathUtils.clamp(1 - (e - 0.25 - PRESS_WINDOW) / 0.8, 0.25, 1);
      U.uW.value = WIDTH * (0.5 + 0.5 * k); U.uA.value = 0.55 + 0.45 * k; U.uHot.value = 0;
    }
    this.glintsUpdate(raw, camera);
  }

  /** A mark over a slip jelly's body takes the body's own bend (its vertex shader squashes it: the shell drawn from the geometry kept
   *  its rest shape, a tall dome of ink over a body crouched for a lunge). Each band's twin shares the band's width, fade and heat. */
  bend(h, mat, D) {
    h.bend = D; h.bendMat = mat; const twins = new Map();
    for (const s of [...h.shells, ...h.cores]) {
      if (s.parrySrc?.material !== mat) continue;
      let m = twins.get(s.material);
      if (!m) { m = s.material.clone(); for (const k of ['uT', 'uPx', 'uAsp', 'uW', 'uA', 'uHot']) m.uniforms[k] = s.material.uniforms[k]; for (const k of BEND) m.uniforms[k] = D[k]; twins.set(s.material, m); h.twins.push(m); }
      s.material = m;
    }
  }

  /** A window opened: said once (`parry.window`), and the glint flared on the striking part's crest. */
  opened(h, camera) {
    this.game?.events?.emit('parry.window', { kind: h.kind || 'blow', by: 'creature' });
    if (!camera || !this.game?.scene) return;
    h.tip = this.crest(h.obj, camera, h.tip || new THREE.Vector3(), h.bend, h.bendMat);
    let q = this.glints.find((x) => !x.h);
    if (!q) {
      if (this.glints.length >= GLINT.pool) q = this.glints.reduce((a, b) => (a.t > b.t ? a : b)); // (the oldest gives way)
      else {
        this.tex ||= glintTexture();
        const S = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.NormalBlending, fog: false }));
        S.renderOrder = 31; S.visible = false; this.game.scene.add(S); q = { S, h: null, t: 0 }; this.glints.push(q);
      }
    }
    q.h = h; q.t = 0; q.at = h.tip.clone(); q.spin = Math.random() * 0.4;
  }

  /** The striking part's crest as the camera sees it, in `obj`'s own frame: of its vertices, the one highest up the view and farthest
   *  from the part's pivot (a sleeve's cuff, a jelly's crown). Read once as the window opens; a few hundred vertices. */
  crest(obj, camera, out, D = null, bendMat = null) {
    obj.updateWorldMatrix(true, true);
    obj.getWorldPosition(_o); _up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    let best = -Infinity; out.copy(_o);
    obj.traverse((m) => {
      if (!m.isMesh || m.userData.parryShell || !m.geometry?.attributes?.position) return;
      const P = m.geometry.attributes.position, step = Math.max(1, Math.floor(P.count / 600));
      for (let i = 0; i < P.count; i += step) {
        _w.fromBufferAttribute(P, i);
        if (D && m.material === bendMat) bent(_w, D); // (a jelly's body, squashed as its shader squashes it)
        _w.applyMatrix4(m.matrixWorld);
        const sc = (_w.x - _o.x) * _up.x + (_w.y - _o.y) * _up.y + (_w.z - _o.z) * _up.z + 0.5 * _w.distanceTo(_o);
        if (sc > best) { best = sc; out.copy(_w); }
      }
    });
    return obj.worldToLocal(out);
  }

  /** The glints: each flares to its span in 0.04 s and shrinks away by 0.16 s, turning a little, sized in the present's pixels at its
   *  depth (crisp at any distance), drawn a little nearer the eye than the crest so its own part never hides it (walls still do). */
  glintsUpdate(raw, camera) {
    for (const q of this.glints) {
      if (!q.h) continue;
      q.t += raw;
      const u = q.t / GLINT.life;
      if (u >= 1 || !camera) { q.h = null; q.S.visible = false; continue; }
      if (this.marks.has(q.h)) q.at.copy(q.h.tip).applyMatrix4(q.h.obj.matrixWorld); // (it rides the part; a mark gone leaves it where it was)
      camera.getWorldPosition(_cam);
      const toEye = _w.copy(_cam).sub(q.at), d = toEye.length(), pull = Math.min(0.5, d * 0.4);
      q.S.position.copy(q.at).addScaledVector(toEye.normalize(), pull);
      const depth = Math.max(0.05, -_w.copy(q.S.position).applyMatrix4(_m.copy(camera.matrixWorldInverse)).z);
      const k = u < 0.25 ? 1 - (1 - u / 0.25) ** 3 : (1 - (u - 0.25) / 0.75) ** 2; // (a fast bloom, a slower shrink)
      const span = GLINT.px * k * this.px.value * depth * Math.tan(THREE.MathUtils.degToRad((camera.fov || 60) / 2));
      q.S.scale.set(span, span, 1); q.S.material.rotation = q.spin + GLINT.turn * u; q.S.material.opacity = 1; q.S.visible = span > 0;
    }
  }
}
