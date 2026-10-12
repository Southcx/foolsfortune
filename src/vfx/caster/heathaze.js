// ---------------------------------------------------------------------------------------
// HEAT HAZE (S1 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): the world seen through hot air, bent inside a volume. A
// flame's cone (the Flamer, 21), the air over a clay volcano (the Volcano, 29), and the Piercer's glass tube hanging along its line
// (15). What is behind it is the frame drawn so far (vfx/caster/casterkit.js sceneGrab: one copy a frame, shared by every haze), looked
// up a few pixels aside along a slow noise that rises as hot air rises; strongest where the eye looks straight through the volume and
// nothing at its silhouette, so it has no edge, only a place where the world starts to swim. A warm breath of the heat's own colour
// over it (a flame's), or a glass rim (the Piercer's tube).
//
// The look (docs/ART.md): the made world is warm clay and the heat is the kiln's; the bend is at most a few pixels of the 480 lines and
// its noise is a metre across, rising at a walking pace: low frequency only, so it swims and never crawls (CLAUDE.md, Feel and comfort).
//
// Prior art: Half-Life 2's refract shader and the heat haze of the PS2's framebuffer reads (Jak and Daxter's lava, Ratchet & Clank's
// Pyrocitor over the flame), Unity's grab pass, Codrops' "Animated Heat Distortion Effects with WebGL" (Lucas Bebber, 2016: the frame
// through scrolling noise, masked); what it teaches: hot air bends light because it is thinner (schlieren photography), and it rises.
//
//   const H = create({ shape, radius, length, strength, rise, scale, tint, warmth, glass, k })   scene.add(H.object)
//     shape: 'sphere' | 'cone' (apex at the origin, opening along +Y or `dir`) | 'column' (from the ground up) | 'tube' (`from` -> `to`)
//   H.set({ ...the same, from, to, dir, pos })   H.update(dt)   H.dispose()   H.k (0..1, its strength now)
//   vfxLayer(game, handle, layer, color)   the effect library's `caster` layer (vfx/vfx.js): { shader: 'heathaze', shape, radius, length }
//   prewarm(scene) -> park()             one copy compiled with the warm-up, 50 m under the world
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { ownUniforms, sceneGrab, NOISE_GLSL, GROUND_Y } from './casterkit.js';

const VERT = /* glsl */`
varying vec3 vW, vN, vV;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0), mv = viewMatrix * w;
  vW = w.xyz; vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform sampler2D uGrab; uniform vec2 uGrabSize;
uniform float uK, uTime, uStrength, uRise, uScale, uWarmth, uGlass, uEdge, uHave;
uniform vec3 uTint;
varying vec3 vW, vN, vV;
${NOISE_GLSL}
void main() {
  if (uHave < 0.5) discard; // (no frame to bend: the canvas drawn straight, glow off)
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float body = pow(facing, uEdge); // (0 at the silhouette: no edge, only where the world starts to swim)
  vec3 q = vW * uScale - vec3(0.0, uTime * uRise * uScale, -uTime * 0.21);
  float nx = fbm3(q), ny = fbm3(q + vec3(5.2, 1.3, 2.7));
  vec2 uv = gl_FragCoord.xy / uGrabSize;
  vec2 d = vec2(nx, ny + 0.35 * abs(nx)) * (uStrength / uGrabSize.y) * body * uK; // (a little more up than down: the air is rising)
  vec4 g = texture2D(uGrab, uv + d); vec3 c = g.rgb; // (its alpha: where nothing was drawn, the page shows through and so does this)
  c += uTint * uWarmth * body * uK * (0.55 + 0.45 * nx); // (the heat's own breath)
  float rim = pow(1.0 - facing, 3.0) * uGlass * uK; // (a glass tube's edge: the Piercer's)
  c = mix(c, vec3(0.92, 0.96, 1.0) * 1.4, rim * 0.5);
  gl_FragColor = vec4(c, clamp(body * uK * g.a + rim, 0.0, 1.0));
}`;

let MAT = null;
const GEO = {};
function material() {
  return (MAT ||= new THREE.ShaderMaterial({
    name: 'caster-heathaze', vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uGrab: { value: null }, uGrabSize: { value: new THREE.Vector2(1, 1) }, uK: { value: 1 }, uTime: { value: 0 }, uStrength: { value: 6 }, uRise: { value: 1.2 }, uScale: { value: 1.6 }, uWarmth: { value: 0.15 }, uGlass: { value: 0 }, uEdge: { value: 1.5 }, uHave: { value: 0 }, uTint: { value: new THREE.Color(0xff8a3c) } },
  }));
}
function geometry(shape) {
  if (GEO[shape]) return GEO[shape];
  let g;
  if (shape === 'cone') g = new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -0.5, 0).rotateX(Math.PI); // (apex at the origin, opening up +Y)
  else if (shape === 'column' || shape === 'tube') g = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true).translate(0, 0.5, 0); // (from the origin up +Y)
  else g = new THREE.SphereGeometry(1, 24, 16);
  return (GEO[shape] = g);
}

const UP = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();

export class HeatHaze {
  constructor({ shape = 'sphere', radius = 1, length = 2, strength = 6, rise = 1.2, scale = 1.6, tint = 0xff8a3c, warmth = 0.15, glass = 0, edge = 1.5, k = 1 } = {}) {
    this.shape = shape; this.radius = radius; this.length = length;
    this.u = { uK: { value: k }, uTime: { value: Math.random() * 50 }, uStrength: { value: strength }, uRise: { value: rise }, uScale: { value: scale }, uWarmth: { value: warmth }, uGlass: { value: glass }, uEdge: { value: edge }, uTint: { value: new THREE.Color(tint) }, uGrab: { value: null }, uGrabSize: { value: new THREE.Vector2(1, 1) }, uHave: { value: 0 } };
    const mat = material();
    this.object = new THREE.Mesh(geometry(shape), mat);
    this.object.name = 'caster-heathaze'; this.object.frustumCulled = false; this.object.renderOrder = 8; this.object.userData.moodExempt = true;
    ownUniforms(this.object, mat, this.u);
    this.object.userData.beforeDraw = (renderer) => { const G = sceneGrab(renderer); this.u.uHave.value = G ? 1 : 0; if (G) { this.u.uGrab.value = G.texture; this.u.uGrabSize.value = G.size; } };
    this.fit();
  }
  get k() { return this.u.uK.value; }
  /** Change any of its numbers; `from`/`to` lay a tube or column along a line, `dir` turns a cone, `pos` moves it. */
  set(p = {}) {
    const u = this.u;
    for (const [key, name] of [['k', 'uK'], ['strength', 'uStrength'], ['rise', 'uRise'], ['scale', 'uScale'], ['warmth', 'uWarmth'], ['glass', 'uGlass'], ['edge', 'uEdge']]) if (p[key] !== undefined) u[name].value = p[key];
    if (p.tint !== undefined) u.uTint.value.set(p.tint);
    if (p.radius !== undefined) this.radius = p.radius;
    if (p.length !== undefined) this.length = p.length;
    if (p.pos) this.object.position.copy(p.pos);
    if (p.from && p.to) { this.object.position.copy(p.from); _d.subVectors(p.to, p.from); this.length = Math.max(1e-3, _d.length()); this.object.quaternion.setFromUnitVectors(UP, _d.normalize()); }
    else if (p.dir) this.object.quaternion.setFromUnitVectors(UP, _d.copy(p.dir).normalize());
    this.fit();
    return this;
  }
  fit() {
    const r = this.radius;
    if (this.shape === 'sphere') this.object.scale.setScalar(r); else this.object.scale.set(r, this.length, r);
  }
  update(dt) { this.u.uTime.value = (this.u.uTime.value + dt) % 600; this.object.visible = this.u.uK.value > 0.002; }
  dispose() { this.object.parent?.remove(this.object); this.object.onBeforeRender = () => {}; }
}
export const create = (opts) => new HeatHaze(opts);

/** The effect library's layer (vfx/vfx.js `caster`): at the effect's place, a cone along its direction, a tube from `from` to `to`. */
export function vfxLayer(game, h, L, color) {
  const H = new HeatHaze({ shape: L.shape, radius: (L.radius ?? 1) * (h.ctx.scale ?? 1), length: (L.length ?? 2) * (h.ctx.scale ?? 1), strength: L.strength, rise: L.rise, scale: L.noise, tint: color(L.tint ?? 0xff8a3c, h.ctx), warmth: L.warmth, glass: L.glass, k: 0 });
  game.scene.add(H.object);
  return {
    group: H.object, effect: H,
    frame(h, t, k, raw) { H.set(h.ctx.from && h.ctx.to ? { from: h.ctx.from, to: h.ctx.to, k } : { pos: h.pos, dir: H.shape === 'cone' ? h.dir : undefined, k }); H.update(raw); },
    dispose: () => H.dispose(),
  };
}

/** One copy compiled with the warm-up, parked 50 m under the world. Returns what puts it away. */
export function prewarm(scene) {
  const H = new HeatHaze(); H.object.position.set(0, GROUND_Y, 0); scene.add(H.object);
  return () => H.dispose();
}
