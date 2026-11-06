// ---------------------------------------------------------------------------------------
// THE BARREL SCREEN (docs/ref/WAVE-RIDING.md 4): the feeling of being inside the tube, on the frame, only while the lip covers you
// (`skiff.surf.cover` > 0, the surf ride's; the camera's own barrel test where that is not there yet), and nothing at all otherwise:
//   THE VIGNETTE   the frame's edges closed in round the barrel's mouth (where the light at the end of the tube is on the screen),
//                  tinted by the jade light through the lip, tightening with depth k (0 at the mouth .. 1 the foam ball)
//   THE STREAKS    faint rays of that light running out from the mouth across the frame, drifting slowly round it (light through the
//                  lip in bands, never a strobe), and a soft bloom at the mouth itself
//   THE SPIT       its burst (`spitBurst`): a ring of white thrown out from the mouth past the camera, a mist washing the frame's edges,
//                  the rays flaring, then clearing over half a real second (the drops on the lens are the weather's: vfx/waves/spray.js)
// A world mark's grammar: no words, no gauge, no stock UI. It is a screen volume (render/glow.js `post.volumes`), as the lens drops are:
// one full-screen pass on the light-linear frame, drawn only while it has something to show. Comfort (CLAUDE.md): nothing blinks; the
// cover eases in over 0.25 and out over 0.4 real s.
//
// Prior art: Kelly Slater's 2002 surfing game (Treyarch) and Surf World Series (the tube's vignette and its light at the end), the spit of a real barrel
// (the air blown out of the mouth as the lip closes), the house's lens drops (vfx/weatherfx/lensdrops.js: the volume's form).
//
//   const B = new BarrelScreen(game)   B.update(raw, { cover, k, mouth })   (mouth: a world point, or null)   B.spitBurst()   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The tint (light-linear: the jade through the lip), the ease in and out (real s), the spit's life (real s). */
export const BARREL_SCREEN = { tint: [0.22, 0.95, 0.72], easeIn: 0.25, easeOut: 0.4, spit: 0.6 };

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = /* glsl */`
uniform sampler2D tSrc; uniform float uCover, uK, uSpit, uT, uAsp, uMouthOn; uniform vec2 uMouth; uniform vec3 uTint; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb;
  vec2 m = (vUv - uMouth) * vec2(uAsp, 1.0); float r = length(m), ang = atan(m.y, m.x);
  vec2 e = (vUv - 0.5) * vec2(uAsp, 1.0); float re = length(e);
  // the vignette: closed in round the mouth, tighter the deeper; the edges tinted by the light through the lip
  float rad = mix(1.15, 0.6, uK), vig = smoothstep(rad * 0.38, rad, mix(re, r, 0.6 * uMouthOn)) * uCover;
  c = mix(c, c * uTint * 0.5 + uTint * 0.015, vig * 0.8);
  // the streaks: rays out from the mouth, drifting slowly round it
  float rays = pow(0.5 + 0.5 * sin(ang * 19.0 + uT * 0.35 + 2.0 * sin(ang * 5.0 - uT * 0.21)), 12.0) * smoothstep(0.08, 0.5, r) * (1.0 - smoothstep(0.7, 1.5, r));
  c += uTint * rays * (0.006 + 0.01 * uK) * uCover * uMouthOn; // (a trace: the glow multiplies it many times, the first firing's 0.05 drowned the lip; Calissa 2026-11-06)
  c += vec3(1.0, 0.97, 0.88) * exp(-r * r / 0.012) * 0.12 * uCover * uMouthOn;
  // the spit: a ring thrown out from the mouth, a mist on the edges, the rays flared
  if (uSpit > 0.001) {
    float ring = (1.0 - uSpit) * 1.6, w = 0.06 + 0.12 * (1.0 - uSpit);
    c += vec3(0.95, 1.0, 0.98) * exp(-pow((r - ring) / w, 2.0)) * uSpit * 0.6;
    c = mix(c, vec3(0.9, 0.96, 0.95), uSpit * 0.35 * smoothstep(0.15, 0.9, re));
    c += uTint * rays * uSpit * 0.4;
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const _v = new THREE.Vector3();
export class BarrelScreen {
  constructor(game) {
    this.game = game; this.mat = null; this.out = null; this.cover = 0; this.k = 0; this.spitK = 0; this.t = 0; this.mouth = new THREE.Vector2(0.5, 0.55); this.mouthOn = 0;
    if (game.post) (game.post.volumes ||= []).push(this);
  }
  get on() { return this.cover > 0.004 || this.spitK > 0.004; }

  update(raw, { cover = 0, k = 0, mouth = null } = {}) {
    const B = BARREL_SCREEN, target = Math.max(0, Math.min(1, cover));
    this.cover += (target - this.cover) * Math.min(1, raw / (target > this.cover ? B.easeIn : B.easeOut));
    if (target <= 0 && this.cover < 0.004) this.cover = 0;
    this.k += (Math.max(0, Math.min(1, k)) - this.k) * Math.min(1, raw * 4);
    this.spitK = Math.max(0, this.spitK - raw / B.spit); this.t += raw;
    const cam = this.game.camera;
    let on = 0;
    if (mouth && cam) {
      _v.copy(mouth).project(cam);
      if (_v.z < 1 && Math.abs(_v.x) < 1.6 && Math.abs(_v.y) < 1.6) { this.mouth.set(_v.x * 0.5 + 0.5, _v.y * 0.5 + 0.5); on = 1; }
    }
    this.mouthOn += (on - this.mouthOn) * Math.min(1, raw * 5);
  }
  spitBurst() { this.spitK = 1; }

  make() {
    if (this.mat) return;
    this.mat = new THREE.ShaderMaterial({ name: 'wave-barrelscreen', vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tSrc: { value: null }, uCover: { value: 0 }, uK: { value: 0 }, uSpit: { value: 0 }, uT: { value: 0 }, uAsp: { value: 1 }, uMouthOn: { value: 0 }, uMouth: { value: new THREE.Vector2() }, uTint: { value: new THREE.Vector3().fromArray(BARREL_SCREEN.tint) } } });
  }
  render(post, src) {
    this.make();
    if (!this.out) this.out = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    if (this.out.width !== src.width || this.out.height !== src.height) this.out.setSize(src.width, src.height);
    const u = this.mat.uniforms, ease = (x) => x * x * (3 - 2 * x);
    u.tSrc.value = src.texture; u.uCover.value = ease(this.cover); u.uK.value = this.k; u.uSpit.value = this.spitK * this.spitK; u.uT.value = this.t;
    u.uAsp.value = src.width / Math.max(1, src.height); u.uMouth.value.copy(this.mouth); u.uMouthOn.value = this.mouthOn;
    post.pass(this.mat, this.out);
    return this.out;
  }
  compile(renderer, post) { this.make(); post.quad.material = this.mat; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); }
  dispose() {
    const V = this.game.post?.volumes, i = V ? V.indexOf(this) : -1; if (i >= 0) V.splice(i, 1);
    this.mat?.dispose(); this.out?.dispose(); this.mat = null; this.out = null;
  }
}
