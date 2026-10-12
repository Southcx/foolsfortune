// ---------------------------------------------------------------------------------------
// THE PORTAL (S5 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a hole in the world rimmed in crude. The Portal shell's
// linked pair (44: two ovals, each showing the other's view) and the Rift's hole in the ground that swallows a creature and closes
// like an eye (43). Lachryma's own door: the lip is crude, near-black with the oil film's colours on it (vfx/oxidation.js), its tendrils
// reaching out past the edge and drawn back in; the opening is an EYE, an almond whose lids meet as it closes (`open` 0..1).
//
//   'portal'   through it, the view out of its partner: rendered to a small texture (the 480-line era's size) from the partner's place,
//              looking out of its face, and looked up by the direction the eye looks through this one, so it is a window and not a
//              picture: walk past it and the far place turns as it should. Drawn when the pair opens, and again `liveHz` times a real
//              second (0, the default, holds the first: one render of the world each time it is drawn, never one a frame unless asked)
//   'rift'     no partner: the Emocean under the island, crude turning in a slow whirl round a dark heart, the film's bands on it
//
// The lip wavers at one slow rate; every band of the film fades to its mean under a few pixels (the oxidation ramp's rule: no crawl).
//
// Prior art: Portal's portals (Valve, 2007: a linked pair, each the other's view, rendered from the partner's place), Ratchet & Clank's
// Rift Inducer (a hole that takes what stands over it), the render-to-texture mirrors and windows of the sixth generation (a second camera
// into a small target), and the "eye" of the vesica piscis (two circles' meeting) that the Gnostic doors and the owner's circles share.
//
//   const P = create({ mode, width, height, open, tint, res, liveHz, k })   scene.add(P.object)   (faces +Z; stand it, or lay it flat)
//   P.link(Q)   a pair: each shows the other's view        P.refresh(renderer, scene)   this one's view out, drawn now (its partner's picture)
//   P.set({ open, k, tint, phase, pos })   P.update(dt, renderer, scene) (the live refresh, when liveHz > 0)   P.dispose()
//   vfxLayer(game, handle, layer, color)   the effect library's `caster` layer: { shader: 'portal', mode: 'rift', width, height } (a rift
//                                          on the ground at the effect's place, opening and closing as an eye over its life)
//   prewarm(scene) -> park()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ownUniforms, NOISE_GLSL, GROUND_Y } from './casterkit.js';
import { OXIDATION_GLSL } from '../oxidation.js';

const MARGIN = 1.45; // (the plane is this much larger than the opening: room for the tendrils)
const FOV = 100;

const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = /* glsl */`
uniform sampler2D uView; uniform float uHave, uTanY, uAspect, uOpen, uK, uTime, uPhase, uRift;
uniform mat3 uToLocal; uniform vec3 uTint;
varying vec2 vUv; varying vec3 vW;
${NOISE_GLSL}
${OXIDATION_GLSL}
void main() {
  vec2 q = (vUv - 0.5) * 2.0 * ${MARGIN.toFixed(2)}; // (-1..1 is the opening at its widest)
  float ang = atan(q.y, q.x);
  float lid = uOpen * pow(max(1.0 - q.x * q.x, 0.0), 0.6); // (the eye: an almond whose lids meet as it closes)
  float wob = 0.06 * fbm3(vec3(cos(ang) * 1.7, sin(ang) * 1.7, uTime * 0.35)); // (the lip wavers, slowly)
  float inside = lid + wob * min(1.0, lid * 4.0) - abs(q.y); // (the waver dies at the corners: no sliver past them)
  // the tendrils: crude reaching out past the lip and drawn back, in a few slow fingers
  float reach = 0.35 * uOpen * smoothstep(0.0, 1.0, fbm3(vec3(ang * 2.2, uTime * 0.25, 3.0)) * 0.5 + 0.55);
  float finger = fbm3(vec3(ang * 5.0, -inside * 3.0 + uTime * 0.5, 1.7));
  float tendril = inside < 0.0 ? smoothstep(0.0, 0.08, finger * reach + inside * 1.4 + 0.05) * smoothstep(-0.5, -0.0, inside) * smoothstep(1.15, 0.85, abs(q.x)) : 0.0; // (none past the eye's corners)
  if (inside <= 0.0 && tendril <= 0.001) discard;
  float aa = max(fwidth(inside), 1e-4);
  float lip = 1.0 - smoothstep(0.0, 0.16 * uOpen + aa, inside); // (the crude rim: 1 on the lip, 0 well inside)
  // the film on the crude: its interference bands, faded to their mean when they would be finer than a few pixels
  float h = fbm3(vec3(q * 2.2, uTime * 0.08)) + ang * 0.16 + uPhase, haa = fwidth(h) * 6.0;
  float band = mix(0.5 + 0.5 * cos(h * 18.85), 0.5, smoothstep(0.2, 0.6, haa));
  vec3 ink = vec3(0.006, 0.005, 0.01);
  vec3 crude = ink + oxFilm(h * 3.0 + uPhase) * band * 0.07 + uTint * 0.03; // (the film faint on black, as on fresh crude)
  vec3 col;
  if (uRift < 0.5 && uHave > 0.5) { // through the door: the partner's view, by the direction the eye looks through this one
    vec3 d = uToLocal * normalize(vW - cameraPosition); // (in this portal's frame: going in is -Z, and out of the partner it is the same)
    float swirl = (1.0 - smoothstep(0.0, 0.5, inside)) * 0.35 * sin(uTime * 0.7);
    d.xy = mat2(cos(swirl), -sin(swirl), sin(swirl), cos(swirl)) * d.xy;
    vec2 uv = 0.5 + 0.5 * (d.xy / max(-d.z, 0.05)) / vec2(uTanY * uAspect, uTanY);
    col = texture2D(uView, clamp(uv, 0.002, 0.998)).rgb;
    col *= 0.55 + 0.45 * smoothstep(0.0, 0.45, inside); // (deeper toward the lip, as a tunnel's mouth)
  } else { // the rift: the Emocean below, crude turning slowly round a dark heart
    float rr = length(vec2(q.x, q.y / max(uOpen, 0.05)));
    float a2 = ang + uTime * 0.25 + 1.6 / (rr + 0.25);
    float hh = fbm3(vec3(cos(a2) * rr * 2.0, sin(a2) * rr * 2.0, uTime * 0.1)) + uPhase;
    float b2 = mix(0.5 + 0.5 * cos(hh * 15.0), 0.5, smoothstep(0.2, 0.6, fwidth(hh) * 6.0));
    col = ink + oxFilm(hh * 2.0 + rr) * b2 * 0.1 * smoothstep(0.05, 0.9, rr) + uTint * 0.08 * (1.0 - rr);
  }
  col = mix(col, crude, max(lip, step(inside, 0.0)));
  float alpha = inside > 0.0 ? smoothstep(0.0, aa * 1.5, inside) : 0.0;
  alpha = max(alpha, tendril);
  gl_FragColor = vec4(col, alpha * uK);
}`;

let MAT = null, GEO = null;
function material() {
  return (MAT ||= new THREE.ShaderMaterial({
    name: 'caster-portal', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uView: { value: null }, uHave: { value: 0 }, uTanY: { value: 1 }, uAspect: { value: 1 }, uOpen: { value: 1 }, uK: { value: 1 }, uTime: { value: 0 }, uPhase: { value: 0 }, uRift: { value: 0 }, uToLocal: { value: new THREE.Matrix3() }, uTint: { value: new THREE.Color() } },
  }));
}

const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _v = new THREE.Vector3();

export class Portal {
  constructor({ mode = 'portal', width = 1.4, height = 2.2, open = 1, tint = 0xb49be6, phase = Math.random(), res = [256, 192], liveHz = 0, k = 1 } = {}) {
    this.mode = mode; this.liveHz = liveHz; this.acc = 0; this.pair = null; this.res = res;
    this.u = { uView: { value: null }, uHave: { value: 0 }, uTanY: { value: Math.tan(THREE.MathUtils.degToRad(FOV / 2)) }, uAspect: { value: res[0] / res[1] }, uOpen: { value: open }, uK: { value: k }, uTime: { value: Math.random() * 30 }, uPhase: { value: phase }, uRift: { value: mode === 'rift' ? 1 : 0 }, uToLocal: { value: new THREE.Matrix3() }, uTint: { value: new THREE.Color(tint) } };
    const mat = material();
    this.object = new THREE.Mesh(GEO ||= new THREE.PlaneGeometry(1, 1), mat);
    this.object.name = 'caster-portal'; this.object.frustumCulled = false; this.object.renderOrder = 6; this.object.userData.moodExempt = true; this.object.userData.casterPortal = true;
    this.object.scale.set(width * MARGIN, height * MARGIN, 1);
    ownUniforms(this.object, mat, this.u);
    this.object.userData.beforeDraw = () => { this.u.uToLocal.value.setFromMatrix4(_m.extractRotation(this.object.matrixWorld)).transpose(); };
  }
  get k() { return this.u.uK.value; }
  /** A linked pair: each shows the view out of the other. */
  link(other) { this.pair = other; other.pair = this; this.u.uRift.value = 0; other.u.uRift.value = 0; this.show(); other.show(); return this; }
  show() { const v = this.pair?.view; this.u.uView.value = v?.texture ?? null; this.u.uHave.value = v ? 1 : 0; }
  /** This portal's view out (what its partner shows), drawn now: one render of the world from here into a small target. */
  refresh(renderer, scene) {
    if (!renderer || !scene) return this;
    this.view ||= new THREE.WebGLRenderTarget(this.res[0], this.res[1], { type: THREE.HalfFloatType, depthBuffer: true });
    this.cam ||= new THREE.PerspectiveCamera(FOV, this.res[0] / this.res[1], 0.05, 200);
    this.object.updateMatrixWorld();
    this.object.getWorldPosition(this.cam.position).add(_v.set(0, 0, 0.05).applyQuaternion(this.object.getWorldQuaternion(_q)));
    this.cam.quaternion.copy(_q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)); // (looking out of its face, +Z)
    this.cam.updateMatrixWorld();
    const hidden = [];
    scene.traverse((o) => { if (o.userData.casterPortal && o.visible) { o.visible = false; hidden.push(o); } }); // (no portal inside a portal)
    const was = renderer.getRenderTarget(), shadows = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false; // (the sun's shadow is the frame's: not drawn again for this)
    renderer.setRenderTarget(this.view); renderer.clear(); renderer.render(scene, this.cam);
    renderer.setRenderTarget(was); renderer.shadowMap.autoUpdate = shadows;
    for (const o of hidden) o.visible = true;
    this.pair?.show();
    return this;
  }
  set(p = {}) {
    const u = this.u;
    if (p.open !== undefined) u.uOpen.value = THREE.MathUtils.clamp(p.open, 0, 1);
    if (p.k !== undefined) u.uK.value = p.k;
    if (p.phase !== undefined) u.uPhase.value = p.phase;
    if (p.tint !== undefined) u.uTint.value.set(p.tint);
    if (p.liveHz !== undefined) this.liveHz = p.liveHz;
    if (p.pos) this.object.position.copy(p.pos);
    return this;
  }
  update(dt, renderer, scene) {
    this.u.uTime.value = (this.u.uTime.value + dt) % 600;
    this.object.visible = this.u.uK.value > 0.002 && this.u.uOpen.value > 0.002;
    if (this.liveHz > 0 && this.pair && renderer) { this.acc += dt * this.liveHz; if (this.acc >= 1) { this.acc %= 1; this.refresh(renderer, scene); } }
  }
  dispose() { this.object.parent?.remove(this.object); this.object.onBeforeRender = () => {}; this.view?.dispose(); if (this.pair?.pair === this) { this.pair.pair = null; this.pair.show(); } }
}
export const create = (opts) => new Portal(opts);

/** The effect library's layer (vfx/vfx.js `caster`): a rift lying on the ground at the effect's place, opening as an eye in its first
 *  fifth and closing in its last (an effect held forever opens and stays). */
export function vfxLayer(game, h, L, color) {
  const P = new Portal({ mode: 'rift', width: (L.width ?? 2) * (h.ctx.scale ?? 1), height: (L.height ?? 1.3) * (h.ctx.scale ?? 1), tint: color(L.tint ?? 'lach', h.ctx), open: 0, k: 0 });
  P.object.rotation.x = -Math.PI / 2;
  game.scene.add(P.object);
  return {
    group: P.object, effect: P,
    frame(h, t, k, raw) {
      const open = L.dur === Infinity ? Math.min(1, h.t / 0.6) : Math.min(1, t / 0.2, (1 - t) / 0.2);
      P.set({ pos: _v.copy(h.pos).setY(h.pos.y + 0.02), open: open * open * (3 - 2 * open), k }); P.update(raw);
    },
    dispose: () => P.dispose(),
  };
}

export function prewarm(scene) {
  const P = new Portal({ mode: 'rift' }); P.object.position.set(0, GROUND_Y, 0); scene.add(P.object);
  return () => P.dispose();
}
