// ---------------------------------------------------------------------------------------
// LENSING (caster shader S6): a black hole's bend of the frame and its accretion ring, for the Caster's own black holes (shells 94
// Inside Out and 95 Leyline: docs/plans/CASTER-SHELLS.md). A dot of nothing that the world is pulled round: what is behind it is
// bent into a ring about its shadow, and a disc of Lachryma (gold and white at its hot inner edge, cooling to violet) turns about it,
// brighter on the side that comes at you, its far side lifted over the top and folded under the bottom by the same bend.
//
// It is a screen volume: one full-screen pass in the glow's chain (render/glow.js `post.volumes`), before the glitch and the bloom, so
// the bloom takes the ring's light. Only rays that pass near the hole are marched (a sphere of influence, `uRm`); every other pixel is
// one fetch of the frame. Inside it, each ray is stepped along a light ray's path round a Schwarzschild mass (the bending as a force,
// 3/2 rs h^2 / r^5, the photon sphere at 1.5 rs and the shadow at about 2.6 rs), the disc found where the path crosses its plane, and
// the frame read where the bent ray leaves (the direction projected at infinity, so the bend fades to nothing at the sphere's edge).
// No mesh and no light of its own: the pass is its one draw call. Without depth it bends whatever is behind its pixels, near or far.
//
// Comfort (CLAUDE.md, no aliasing crawl): the shadow's edge is a soft step on the closest approach, never a hard test; the photon
// ring is a Gaussian a few pixels wide; the disc's streaks turn on two phases cross-faded (a flow map's trick), so they never wind up
// finer and finer until they shimmer.
//
// Prior art: Interstellar's Gargantua (Double Negative's DNGR: James, von Tunzelmann, Franklin and Thorne, 2015: the lensed disc and
// its Doppler beaming), Riazuelo's ray-traced Schwarzschild images, and the real-time shader ray marchers after them (the bending
// written as a force on a stepped ray, the disc found by plane crossings); a flow map's two cross-faded phases (Valve's water, 2010).
//
//   const h = create(game, { size, disc, inner, outer, tilt, spin, doppler, ring, tint, cool })   (game.post: the glow; game.scene)
//   h.group (where the hole is: place it, turn it to tilt the disc)   h.set({ ... })   h.k = 0..1 (its strength: grow, collapse)
//   h.update(dt)   h.dispose()
//   prewarm(game)   (the boot's warm-up: the pass made and registered, so the glow's compile() compiles it)
//   layer(game, L, ctx)   the effect library's `caster` layer (vfx/vfx.js): `{ type: 'caster', shader: 'lensing', size, ... }`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
uniform sampler2D tSrc; uniform mat4 uInvProj, uCamWorld, uViewProj; uniform vec3 uCamPos, uHole, uN, uHot, uCool;
uniform float uRs, uRm, uIn, uOut, uDisc, uT, uSpin, uDoppler, uRing;
varying vec2 vUv;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
// the disc's streaks: rings across its width, broken along the orbit (sampled round a circle, so there is no seam at the angle's wrap)
float streaks(float x, float a) { vec2 c = vec2(cos(a), sin(a)); return 0.6 * vn(vec2(x * 11.0, 0.0) + c * 1.7) + 0.4 * vn(vec2(x * 23.0, 5.0) + c * 3.1); }
vec2 toScreen(vec3 d, out float ok) { vec4 c = uViewProj * vec4(d, 0.0); ok = step(1e-4, c.w); return c.xy / max(c.w, 1e-4) * 0.5 + 0.5; }
void main() {
  vec3 base = texture2D(tSrc, vUv).rgb;
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
  vec3 oc = uHole - uCamPos; float tc = dot(oc, dir); vec3 perp = oc - dir * tc; float b2 = dot(perp, perp);
  bool inside = dot(oc, oc) < uRm * uRm;
  if (uRs <= 0.0 || b2 >= uRm * uRm || (tc < 0.0 && !inside)) { gl_FragColor = vec4(base, 1.0); return; } // (a ray that never comes near: the frame as it is)
  vec3 p = uCamPos + dir * (inside ? 0.0 : tc - sqrt(uRm * uRm - b2)), d = dir;
  vec3 tA = normalize(cross(uN, abs(uN.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), tB = cross(uN, tA);
  vec3 col = vec3(0.0); float a = 0.0, rmin = 1e5; bool fell = false;
  float ph1 = fract(uT * 0.08), ph2 = fract(uT * 0.08 + 0.5), wph = abs(ph1 * 2.0 - 1.0); // (the two phases of the turning, cross-faded)
  for (int i = 0; i < 80; i++) {
    vec3 rel = p - uHole; float r = length(rel);
    rmin = min(rmin, r);
    if (r < uRs) { fell = true; break; }
    if (r > uRm * 1.001 && dot(rel, d) > 0.0) break;
    float st = clamp(0.16 * (r - uRs * 0.55), uRs * 0.035, uRm * 0.18);
    vec3 hv = cross(rel, d);
    float w = 1.0 - smoothstep(uRm * 0.5, uRm, r); // (the bend fades out toward the sphere's edge: no seam where the march begins)
    vec3 pn = p + d * st;
    d = normalize(d - 1.5 * uRs * dot(hv, hv) * rel / (r * r * r * r * r) * w * st);
    // the disc: where the path crosses its plane, between its inner and outer edge
    float d0 = dot(rel, uN), d1 = dot(pn - uHole, uN);
    if (d0 * d1 < 0.0 && a < 0.995 && uDisc > 0.0) {
      vec3 q = mix(p, pn, d0 / (d0 - d1)) - uHole; float rq = length(q);
      if (rq > uIn && rq < uOut) {
        float x = (rq - uIn) / (uOut - uIn), ang = atan(dot(q, tB), dot(q, tA));
        float om = uSpin * pow(uIn / rq, 1.5) * 12.5; // (Kepler: the inner edge turns fastest)
        float n = mix(streaks(x, ang - om * ph1), streaks(x, ang - om * ph2), wph);
        float prof = smoothstep(0.0, 0.08, x) * (1.0 - smoothstep(0.55, 1.0, x));
        float dop = clamp(1.0 + uDoppler * dot(normalize(cross(uN, q)), -d), 0.25, 2.0); // (beaming: the side coming at you is the bright one)
        vec3 hue = mix(uHot, uCool, smoothstep(0.0, 0.9, x));
        vec3 e = hue * pow(1.0 - x, 1.4) * (0.45 + 1.1 * n) * dop * dop * dop * uDisc * 3.2;
        float da = clamp(prof * (0.5 + 0.6 * n) * min(uDisc, 1.0), 0.0, 0.92);
        col += (1.0 - a) * e * da; a += (1.0 - a) * da;
      }
    }
    p = pn;
  }
  float ok; vec2 uvB = toScreen(d, ok);
  vec3 back = fell ? vec3(0.0) : mix(base * 0.15, texture2D(tSrc, clamp(uvB, vec2(0.001), vec2(0.999))).rgb, ok);
  back *= smoothstep(1.45 * uRs, 1.8 * uRs, rmin); // (the shadow's edge: soft on the closest approach, never a hard test)
  float ring = exp(-pow((rmin - 1.55 * uRs) / (0.12 * uRs), 2.0)) * uRing * (fell ? 0.0 : 1.0); // (the photon ring: light that skimmed the sphere)
  vec3 outc = back * (1.0 - a) + col + uHot * ring * 1.6 * (1.0 - a);
  gl_FragColor = vec4(outc, 1.0);
}`;

const PASSES = new WeakMap(); // (one pass a post: every hole in the world draws through it, the strongest one at a time)
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();

/** The pass in the glow's chain: `on` while a hole is alive; `render(post, src, camera)` the bent frame out. */
class LensingPass {
  constructor(post) { this.list = new Set(); this.mat = null; this.out = null; (post.volumes ||= []).push(this); }
  get on() { for (const h of this.list) if (h.k > 0.001 && h.p.size > 0) return true; return false; }
  make() {
    if (this.mat) return;
    const u = { tSrc: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uViewProj: { value: new THREE.Matrix4() },
      uCamPos: { value: new THREE.Vector3() }, uHole: { value: new THREE.Vector3() }, uN: { value: new THREE.Vector3(0, 1, 0) }, uHot: { value: new THREE.Color() }, uCool: { value: new THREE.Color() },
      uRs: { value: 0 }, uRm: { value: 1 }, uIn: { value: 1 }, uOut: { value: 2 }, uDisc: { value: 1 }, uT: { value: 0 }, uSpin: { value: 1 }, uDoppler: { value: 0.5 }, uRing: { value: 1 } };
    this.mat = new THREE.ShaderMaterial({ name: 'caster-lensing', vertexShader: VERT, fragmentShader: FRAG, uniforms: u, depthTest: false, depthWrite: false });
  }
  render(post, src, camera) {
    this.make();
    let h = null; for (const x of this.list) if (x.k > 0.001 && (!h || x.k * x.p.size > h.k * h.p.size)) h = x;
    if (!this.out) this.out = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    if (this.out.width !== src.width || this.out.height !== src.height) this.out.setSize(src.width, src.height);
    const u = this.mat.uniforms, P = h.p, sc = h.group.getWorldScale(_v).x, rs = P.size * h.k * sc;
    u.tSrc.value = src.texture;
    u.uInvProj.value.copy(camera.projectionMatrixInverse); u.uCamWorld.value.copy(camera.matrixWorld);
    u.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    camera.getWorldPosition(u.uCamPos.value); h.group.getWorldPosition(u.uHole.value);
    h.group.getWorldQuaternion(_q); u.uN.value.set(0, Math.cos(P.tilt), Math.sin(P.tilt)).applyQuaternion(_q).normalize();
    u.uRs.value = rs; u.uIn.value = rs * P.inner; u.uOut.value = rs * P.outer; u.uRm.value = Math.max(rs * P.outer * 1.5, rs * 12); // (wide, so the bend has room to fade to nothing before the sphere's edge)
    u.uDisc.value = P.disc; u.uT.value = h.t; u.uSpin.value = P.spin; u.uDoppler.value = P.doppler; u.uRing.value = P.ring;
    u.uHot.value.set(P.tint); u.uCool.value.set(P.cool);
    post.pass(this.mat, this.out);
    return this.out;
  }
  /** For the warm-up: compiled against the glow's own half-float target, as glitch.js does. */
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); }
}

export const LENSING_DEFAULTS = { size: 0.5, disc: 1, inner: 2.6, outer: 7, tilt: 0.22, spin: 1.2, doppler: 0.55, ring: 1, tint: 0xfff0c8, cool: 0x8a5ad8 };

export class Lensing {
  constructor(game, o = {}) {
    this.game = game; this.k = o.k ?? 1; this.t = 0;
    this.p = { ...LENSING_DEFAULTS };
    this.set(o);
    this.group = new THREE.Group(); this.group.name = 'caster-lensing';
    if (o.pos) this.group.position.copy(o.pos);
    (o.parent || game.scene)?.add(this.group);
    const post = game.post;
    if (post) { this.pass = PASSES.get(post) || new LensingPass(post); PASSES.set(post, this.pass); this.pass.list.add(this); }
  }
  set(o = {}) { for (const k of Object.keys(LENSING_DEFAULTS)) if (o[k] !== undefined) this.p[k] = o[k]; return this; }
  update(dt) { this.t += dt; }
  dispose() { this.pass?.list.delete(this); this.group.parent?.remove(this.group); }
}

/** The boot's warm-up (main.js): the pass made and put in the glow's chain now, so the glow's compile() compiles it with its own. */
export function prewarm(game) { const post = game.post; if (post && !PASSES.get(post)) PASSES.set(post, new LensingPass(post)); return null; }

export const create = (game, opts) => new Lensing(game, opts);

/** The effect library's `caster` layer: the hole at the effect's place, its strength the layer's `k` curve, its size the scale. */
export function layer(game, L, ctx = {}) {
  const h = new Lensing(game, { ...L, k: 0, tint: L.tint === undefined || L.tint === 'tint' ? (ctx.tint ?? LENSING_DEFAULTS.tint) : L.tint });
  const u = { uTint: { value: new THREE.Color(h.p.tint) } };
  return { group: h.group, u, set: (k) => { h.k = Math.max(0, k); h.p.tint = u.uTint.value.getHex(); }, update: (raw) => h.update(raw), dispose: () => h.dispose() };
}
