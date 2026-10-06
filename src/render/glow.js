// ---------------------------------------------------------------------------------------
// THE GLOW: the soft bloom of the PS2. Its games drew the bright things (a lamp, a glowing jar, a window, the sky) again, small and
// blurred, over the frame, so light seemed to spill past its edges: ICO's sun-bleached haze, Dark Cloud 2's and Rogue Galaxy's
// lamps and skies, Final Fantasy X's water. It cost them a few passes at a quarter size; it costs the same here.
//
// The scene is drawn (at the console's 480 lines, render/present.js) into a buffer that keeps light brighter than white; what is
// brighter than a threshold (with a soft knee, so nothing pops) is taken down to a half and a quarter, a quarter and an eighth of the
// size, blurred, and laid back over the frame; then the tone curve and the screen's colour space, and last a light grade: the
// deepest shadows lean to the Lachryma's indigo and the brightest light toward the kiln's warmth, so the one-hue workshop has a
// cool and a warm in it (the trope compendium's art tab: values first, warm light against cool shadow).
//
// Comfort (CLAUDE.md): one layer over the screen, and stable: the downsample averages a 4 x 4 area per pixel and the threshold is
// soft, so a small highlight that moves does not make the glow sparkle.
//
// Prior art: the PS2's "glow" (a bright-pass, a downsample, a blur, an additive composite: the frame-buffer feedback of ICO, Okami,
// Rogue Galaxy), the dual-filter and the soft-knee threshold of the later engines (Kawase, Unity's bloom) for steadiness.
//
//   const post = new Glow(renderer)    post.render(scene, camera)    (T.visual.glow: strength, 0 = off; T.visual.grade: 0..1)
//   post.accum = { amt: 0..0.95, zoom, spin }   the frame accumulation (feedback blur): amt 0 is off
//   post.screen = { on, render(post, src) -> target, compile(renderer, post) }   a screen pass on the light-linear frame, before the glow (vfx/glitch.js)
//   post.target                        the buffer to compile shaders against (it renders without the tone curve)
//   post.compile()                     its own passes compiled (the warm-up: they are not in the scene, so compileAsync(scene) never sees them)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../core/config.js';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }';

// down: average 4 bilinear taps a texel apart (a 4 x 4 area), and on the first step keep only what is above the threshold
const DOWN = `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uKnee; uniform bool uFirst; varying vec2 vUv;
// (a pixel some shader left NaN or infinite would spread through the blurs into black blocks: each tap is made safe first)
// (a range test, not isnan(): a compiler may assume there are no NaNs and fold isnan() away; a comparison with NaN is always false)
bool sound( vec3 c ) { return all( greaterThanEqual( c, vec3( -1e4 ) ) ) && all( lessThanEqual( c, vec3( 1e4 ) ) ); }
vec3 safe( vec3 c ) { return sound( c ) ? clamp( c, 0.0, 64.0 ) : vec3( 0.0 ); }
vec3 tap( vec2 o ) { return safe( texture2D( tSrc, vUv + uTexel * o ).rgb ); }
void main() {
	vec3 c = ( tap( vec2( -1.0, -1.0 ) ) + tap( vec2( 1.0, -1.0 ) ) + tap( vec2( -1.0, 1.0 ) ) + tap( vec2( 1.0, 1.0 ) ) ) * 0.25;
	if ( uFirst ) {
		float l = max( c.r, max( c.g, c.b ) );
		float s = clamp( l - uThresh + uKnee, 0.0, 2.0 * uKnee ); s = s * s / ( 4.0 * uKnee + 1e-4 );
		c *= max( s, l - uThresh ) / max( l, 1e-4 );
	}
	gl_FragColor = vec4( c, 1.0 );
}`;
// blur: nine taps of a gaussian in five fetches (the linear-sampling trick), along one axis
const BLUR = `
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main() {
	vec3 c = texture2D( tSrc, vUv ).rgb * 0.2270270270;
	c += ( texture2D( tSrc, vUv + uDir * 1.3846153846 ).rgb + texture2D( tSrc, vUv - uDir * 1.3846153846 ).rgb ) * 0.3162162162;
	c += ( texture2D( tSrc, vUv + uDir * 3.2307692308 ).rgb + texture2D( tSrc, vUv - uDir * 3.2307692308 ).rgb ) * 0.0702702703;
	gl_FragColor = vec4( c, 1.0 );
}`;
// the composite: the frame, the glow over it, the tone curve, the screen's colour space, the grade
const COMP = `
uniform sampler2D tScene, tA, tB; uniform float uGlow, uGrade; uniform vec2 uTexel; varying vec2 vUv;
bool bad( vec3 c ) { return !( all( greaterThanEqual( c, vec3( -1e4 ) ) ) && all( lessThanEqual( c, vec3( 1e4 ) ) ) ); }
void main() {
	vec3 c = texture2D( tScene, vUv ).rgb;
	// (a pixel some shader left NaN takes a sound neighbour's colour: shown black, a run of them along a thin ring read as a dotted
	// black ring in the sky. The blurs are guarded separately, above.)
	if ( bad( c ) ) {
		// (rings of eight taps, one to five pixels out, until one ring finds sound pixels: a thin line of NaN is a few pixels wide)
		vec3 n = vec3( 0.0 ); float k = 0.0;
		for ( int r = 1; r <= 5; r++ ) {
			for ( int i = 0; i < 8; i++ ) {
				float a = float( i ) * 0.7853982;
				vec3 s = texture2D( tScene, vUv + vec2( cos( a ), sin( a ) ) * float( r ) * uTexel ).rgb;
				if ( !bad( s ) ) { n += s; k += 1.0; }
			}
			if ( k > 0.0 ) break;
		}
		c = k > 0.0 ? n / k : vec3( 0.0 );
	}
	c += ( texture2D( tA, vUv ).rgb * 0.6 + texture2D( tB, vUv ).rgb * 0.55 ) * uGlow;
	gl_FragColor = vec4( c, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	vec3 d = gl_FragColor.rgb;
	float l = dot( d, vec3( 0.299, 0.587, 0.114 ) );
	d += uGrade * ( 1.0 - l ) * ( 1.0 - l ) * vec3( -0.016, -0.006, 0.042 );
	d *= mix( vec3( 1.0 ), vec3( 1.035, 1.0, 0.95 ), uGrade * smoothstep( 0.45, 1.0, l ) );
	gl_FragColor.rgb = d;
}`;

// FRAME ACCUMULATION (R40): the PS2's feedback blur. The frame before is kept, drawn back a hair larger and turned (the frame buffer
// fed back into itself, as Silent Hill 2, MGS2 and Burnout smeared a dream, a death or speed), and the new frame laid over it: what
// moves leaves a trail streaming out from the middle. Off (amount 0) it costs nothing. Used for the vessel's shattering (courier/vessel/death.js).
const ACC = `
uniform sampler2D tCur, tPrev; uniform float uAmt, uZoom, uSpin; varying vec2 vUv;
void main() {
	vec2 q = vUv - 0.5; float cs = cos( uSpin ), sn = sin( uSpin );
	q = mat2( cs, -sn, sn, cs ) * q * ( 1.0 - uZoom );
	vec3 prev = texture2D( tPrev, q + 0.5 ).rgb, cur = texture2D( tCur, vUv ).rgb;
	gl_FragColor = vec4( max( cur, mix( cur, prev, uAmt ) ), 1.0 );
}`;

const rt = (o = {}) => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false, ...o });

export class Glow {
  constructor(renderer) {
    this.r = renderer;
    this.scene = rt({ depthBuffer: true, samples: 4 });
    this.half = rt(); this.q = [rt(), rt()]; this.e = [rt(), rt()];
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.fs = new THREE.Scene(); this.fs.add(this.quad);
    const mk = (frag, uniforms, toneMapped = false, name = '') => new THREE.ShaderMaterial({ name, vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped });
    this.down = mk(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 2.0 }, uKnee: { value: 0.9 }, uFirst: { value: false } }, false, 'glow-down');
    this.blur = mk(BLUR, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, false, 'glow-blur');
    this.comp = mk(COMP, { tScene: { value: null }, tA: { value: null }, tB: { value: null }, uGlow: { value: 0.5 }, uGrade: { value: 1 }, uTexel: { value: new THREE.Vector2() } }, true, 'glow-comp');
    this.acc = [rt(), rt()]; this.accW = 0; this.accFresh = true;
    this.accMat = mk(ACC, { tCur: { value: null }, tPrev: { value: null }, uAmt: { value: 0 }, uZoom: { value: 0 }, uSpin: { value: 0 } }, false, 'glow-accum');
    this.accum = { amt: 0, zoom: 0.01, spin: 0 }; // (set by whoever wants the smear: amt 0 is off)
    this.size = new THREE.Vector2();
  }
  /** Its passes compiled now, not on the first frame they draw (the warm-up: main.js). */
  compile() {
    const was = this.r.getRenderTarget();
    for (const [m, out] of [[this.down, this.half], [this.blur, this.q[0]], [this.accMat, this.acc[0]], [this.comp, null]]) { // (each against what it draws into: the composite draws to the screen)
      this.quad.material = m; this.r.setRenderTarget(out); this.r.compile(this.fs, this.cam);
    }
    this.screen?.compile?.(this.r, this);
    this.r.setRenderTarget(was);
  }
  get on() { return (T.visual.glow ?? 0) > 0 || (T.visual.grade ?? 0) > 0; }
  /** The buffer the scene is drawn into (compile shaders against it: it draws without the tone curve). */
  get target() { return this.on ? this.scene : null; }

  resize() {
    const s = this.r.getDrawingBufferSize(this.size), w = Math.max(1, s.x), h = Math.max(1, s.y);
    if (this.scene.width === w && this.scene.height === h) return;
    this.scene.setSize(w, h);
    for (const t of this.acc) t.setSize(w, h);
    this.accFresh = true;
    this.comp.uniforms.uTexel.value.set(1 / Math.max(1, w), 1 / Math.max(1, h));
    this.half.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    for (const t of this.q) t.setSize(Math.max(1, w >> 2), Math.max(1, h >> 2));
    for (const t of this.e) t.setSize(Math.max(1, w >> 3), Math.max(1, h >> 3));
  }
  pass(mat, out) { this.quad.material = mat; this.r.setRenderTarget(out); this.r.render(this.fs, this.cam); }
  downTo(src, out, first = false) {
    const u = this.down.uniforms; u.tSrc.value = src.texture; u.uTexel.value.set(1 / src.width, 1 / src.height); u.uFirst.value = first;
    this.pass(this.down, out);
  }
  blurIn(pair) {
    const u = this.blur.uniforms, [a, b] = pair;
    u.tSrc.value = a.texture; u.uDir.value.set(1 / a.width, 0); this.pass(this.blur, b);
    u.tSrc.value = b.texture; u.uDir.value.set(0, 1 / a.height); this.pass(this.blur, a);
  }

  render(scene, camera) {
    const r = this.r;
    if (!this.on) { r.render(scene, camera); return; }
    this.resize();
    const prev = r.getRenderTarget(), auto = r.autoClear;
    r.setRenderTarget(this.scene); r.autoClear = true;
    r.render(scene, camera);
    // the feedback blur, when asked for: the frame laid over the last one, fed back
    let src = this.scene;
    const A = this.accum;
    if (A.amt > 0.001) {
      const m = this.accMat.uniforms, out = this.acc[this.accW], prev = this.acc[1 - this.accW];
      m.tCur.value = this.scene.texture; m.tPrev.value = prev.texture; m.uAmt.value = this.accFresh ? 0 : A.amt; m.uZoom.value = A.zoom; m.uSpin.value = A.spin;
      this.pass(this.accMat, out);
      src = out; this.accW = 1 - this.accW; this.accFresh = false;
    } else this.accFresh = true;
    if (this.screen?.on) src = this.screen.render(this, src); // (a screen pass of the art's, when one is asked for: vfx/glitch.js, the frame in, the torn frame out)
    this.downTo(src, this.half, true);
    this.downTo(this.half, this.q[0]); this.blurIn(this.q);
    this.downTo(this.q[0], this.e[0]); this.blurIn(this.e);
    const u = this.comp.uniforms;
    u.tScene.value = src.texture; u.tA.value = this.q[0].texture; u.tB.value = this.e[0].texture;
    u.uGlow.value = T.visual.glow ?? 0; u.uGrade.value = T.visual.grade ?? 0;
    this.pass(this.comp, prev);
    r.autoClear = auto;
  }
}
