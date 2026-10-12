// ---------------------------------------------------------------------------------------
// THE HOLOGRAM (caster shader S8): a body of hard light, for shell 63 Double (a hologram of you the creatures chase), 76 Holowall (a
// hex wall of hard light) and 93 Visibomb's view (docs/plans/CASTER-SHELLS.md). The body is drawn as light, not matter: bright at its
// edges where you see it side-on (fresnel), faint through its middle, ruled with scanlines, a brighter band sweeping up it, and now
// and then a band of it slipping sideways for a beat, as a projection whose signal is not quite held. A Holowall wears a hex lattice.
// Its colour is the mind's (labradorite's blue-cyan) unless told otherwise: a Holowall takes your glaze's.
//
// It is a material, put on any mesh (a skinned one too: the Courier's own body for the Double) or on the hex panel it builds itself:
// additive, no depth written, no draw call beyond the mesh's own, one shared material for every hologram (each body's numbers set as
// it is drawn, so many holograms share one program).
//
// Comfort (CLAUDE.md, no aliasing crawl): the scanlines are fixed to the screen's 480 lines (a line every three, a cosine, never a
// hard step), so they cannot crawl over a moving body; the hex lines are drawn to their screen width (fwidth); the flicker is a
// slow wander between 0.82 and 1 with a dip at most a few times a real second when asked (`flicker`), never a strobe; a slip is a
// few centimetres and a tenth of a second.
//
// Prior art: Star Wars' blue holograms (the scanlines and the dropout), Metal Gear Solid's and Halo's hard-light decoys and Cortana,
// Ratchet & Clank's Decoy Glove and Holoshield Glove, and the fresnel-rim hologram shader every engine ships (Unity's and Unreal's
// samples: rim, scanlines, a glitch offset in the vertex).
//
//   const h = create(game, { target, tint, alpha, scan, sweep, slip, flicker, hex, size })   target: an Object3D whose meshes it
//     wears (their materials given back on dispose); none: a hex panel of `size` metres (the Holowall)
//   h.group (place it)   h.set({ ... })   h.k = 0..1 (fade)   h.blink()   (a flicker now: a Double turning)   h.update(dt)   h.dispose()
//   prewarm(game) -> park   (the boot's warm-up: its programs compiled, then park() takes the stand-ins away)
//   layer(game, L, ctx)   the effect library's `caster` layer (vfx/vfx.js): `{ type: 'caster', shader: 'hologram' }`; ctx.target wears it
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform float uSeed, uSlip, uBand; uniform vec3 uSide;
varying vec3 vW, vN, vL;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vL = position;
  vec4 w = modelMatrix * vec4(transformed, 1.0);
  // the slip: a band of the body shoved sideways on the screen for a beat (only some bands, only while the seed says so)
  float band = floor(w.y / uBand), hb = h1(vec2(band, uSeed));
  w.xyz += uSide * step(1.0 - uSlip * 0.45, hb) * (h1(vec2(band, uSeed + 7.0)) - 0.5) * uSlip * 0.22;
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * objectNormal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */`
uniform vec3 uTint; uniform float uAlpha, uScan, uSweep, uFlick, uT, uHex, uHexSize;
varying vec3 vW, vN, vL;
// the distance to a hex lattice's lines (cells s across), in the panel's own plane
float hexLines(vec2 p, float s) {
  p /= s; vec2 r = vec2(1.0, 1.7320508); vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h, b = mod(p - h, r) - h; vec2 g = dot(a, a) < dot(b, b) ? a : b;
  g = abs(g); return (0.5 - max(dot(g, normalize(vec2(1.0, 1.7320508))), g.x)) * s;
}
void main() {
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  float f = pow(1.0 - abs(dot(n, v)), 2.0);
  float scan = 1.0 - uScan * 0.55 * (0.5 + 0.5 * cos(gl_FragCoord.y * 2.0943951)); // (a line every three of the screen's lines)
  float sweep = exp(-pow((fract(vW.y * 0.32 - uT * 0.22) - 0.5) * 9.0, 2.0)) * uSweep;
  float hx = 0.0;
  if (uHex > 0.0) { float d = hexLines(vL.xy, uHexSize), w = fwidth(d) * 1.2; hx = (1.0 - smoothstep(0.0, 0.012 + w, d)) * uHex; }
  vec3 c = uTint * (0.16 + 1.35 * f + 0.7 * sweep + 1.1 * hx) * scan * uFlick;
  gl_FragColor = vec4(c * uAlpha, 1.0);
}`;

let MAT = null; // (one material for every hologram: each body's numbers are set as it is drawn)
function material() {
  if (MAT) return MAT;
  const u = { uTint: { value: new THREE.Color() }, uAlpha: { value: 1 }, uScan: { value: 1 }, uSweep: { value: 1 }, uFlick: { value: 1 }, uT: { value: 0 }, uHex: { value: 0 }, uHexSize: { value: 0.3 },
    uSeed: { value: 0 }, uSlip: { value: 0 }, uBand: { value: 0.18 }, uSide: { value: new THREE.Vector3(1, 0, 0) } };
  MAT = new THREE.ShaderMaterial({ name: 'caster-hologram', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  return MAT;
}

export const HOLOGRAM_DEFAULTS = { tint: 0x5fd0f0, alpha: 0.9, scan: 1, sweep: 1, slip: 0.35, flicker: 0.3, hex: 0, hexSize: 0.28, size: [2.4, 1.6] };
const _side = new THREE.Vector3();

export class Hologram {
  constructor(game, o = {}) {
    this.game = game; this.k = o.k ?? 1; this.t = 0; this.seed = 0; this.seedT = 0; this.slipT = 0; this.flick = 1; this.dip = 0;
    this.p = { ...HOLOGRAM_DEFAULTS, ...(o.target ? {} : { hex: 1 }) };
    this.set(o);
    this.tint = new THREE.Color(this.p.tint);
    this.group = new THREE.Group(); this.group.name = 'caster-hologram';
    this.worn = [];
    const draw = (mesh) => { // (each body's numbers, set as it is drawn: the one material shared)
      const was = mesh.onBeforeRender;
      mesh.onBeforeRender = (r, s, cam, geo, mat) => {
        const U = mat.uniforms; if (!U?.uFlick) return was?.call(mesh, r, s, cam, geo, mat);
        U.uTint.value.copy(this.tint); U.uAlpha.value = this.p.alpha * this.k; U.uScan.value = this.p.scan; U.uSweep.value = this.p.sweep;
        U.uFlick.value = this.flick; U.uT.value = this.t; U.uHex.value = this.p.hex; U.uHexSize.value = this.p.hexSize;
        U.uSeed.value = this.seed; U.uSlip.value = this.slipT > 0 ? this.p.slip : 0; U.uSide.value.copy(_side.setFromMatrixColumn(cam.matrixWorld, 0));
        mat.uniformsNeedUpdate = true;
      };
      this.worn.push({ mesh, mat: mesh.material, was, cast: mesh.castShadow });
      mesh.material = material(); mesh.castShadow = false;
    };
    if (o.target) o.target.traverse((m) => { if (m.isMesh) draw(m); });
    else { // (the Holowall's panel: its hex lattice in its own plane)
      const [w, h] = this.p.size, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material());
      m.position.y = h / 2; this.panel = m; this.group.add(m); draw(m);
    }
    if (o.pos) this.group.position.copy(o.pos);
    if (!o.target) (o.parent || game.scene)?.add(this.group);
  }
  set(o = {}) { for (const k of Object.keys(HOLOGRAM_DEFAULTS)) if (o[k] !== undefined) this.p[k] = o[k]; if (o.tint !== undefined) this.tint?.set(o.tint); return this; }
  /** A flicker now (a Double turning, a Holowall struck): a dip and a slip, over in a fifth of a real second. */
  blink() { this.dip = 1; this.slipT = Math.max(this.slipT, 0.12); }
  update(dt) {
    this.t += dt;
    // the slip: now and then, by `flicker`, a band slides for a tenth of a second; the seed steps while it holds
    this.slipT = Math.max(0, this.slipT - dt);
    if (this.slipT <= 0 && Math.random() < this.p.flicker * dt * 1.5) this.slipT = 0.1;
    if ((this.seedT -= dt) <= 0) { this.seed = (this.seed + 1 + Math.floor(Math.random() * 5)) % 991; this.seedT = 0.06; }
    // the flicker: a slow wander and a dip, never a strobe
    this.dip = Math.max(0, this.dip - dt * 5);
    this.flick = (0.91 + 0.09 * Math.sin(this.t * 2.3) * Math.sin(this.t * 0.7 + 1.3)) * (1 - 0.5 * this.dip);
    if (Math.random() < this.p.flicker * dt * 0.6) this.dip = Math.max(this.dip, 0.6);
  }
  dispose() {
    for (const w of this.worn) { w.mesh.material = w.mat; w.mesh.onBeforeRender = w.was || (() => {}); w.mesh.castShadow = w.cast; }
    this.worn = [];
    if (this.panel) this.panel.geometry.dispose();
    this.group.parent?.remove(this.group);
  }
}

/** A plane and a one-bone skinned plane wearing `mat`, parked under the world for the warm-up's compile (both programs: a body and a
 *  skinned body), and the function that takes them away again (the material stays: its programs live while it does). */
function parkPair(game, mat) {
  const g = () => new THREE.PlaneGeometry(0.1, 0.1), sg = g(), n = sg.attributes.position.count;
  sg.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4));
  sg.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Float32Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : 1)), 4));
  const bone = new THREE.Bone(), sk = new THREE.SkinnedMesh(sg, mat); sk.add(bone); sk.bind(new THREE.Skeleton([bone]));
  const parts = [new THREE.Mesh(g(), mat), sk];
  for (const o of parts) { o.position.set(0, -50, 0); o.frustumCulled = false; o.userData.zoneFree = true; game.scene.add(o); }
  return () => { for (const o of parts) { o.parent?.remove(o); o.geometry.dispose(); } };
}

/** The boot's warm-up (main.js): the hologram's two programs compiled with the rest, never in play. */
export function prewarm(game) { return parkPair(game, material()); }

export const create = (game, opts) => new Hologram(game, opts);

/** The effect library's `caster` layer: the effect's `ctx.target` worn as a hologram, or a Holowall panel at its place. */
export function layer(game, L, ctx = {}) {
  const h = new Hologram(game, { ...L, k: 0, target: ctx.target, tint: L.tint === undefined || L.tint === 'tint' ? (ctx.tint ?? HOLOGRAM_DEFAULTS.tint) : L.tint });
  if (ctx.target) game.scene?.add(h.group); // (a stand-in for the effect to place: the body stays where it is)
  const u = { uTint: { value: h.tint } };
  return { group: h.group, u, set: (k) => { h.k = Math.max(0, k); }, update: (raw) => h.update(raw), dispose: () => h.dispose() };
}
