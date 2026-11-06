// ---------------------------------------------------------------------------------------
// THE TILT-SHIFT PASS (plain name; South, 2026-11-06: "take the orientation of Hearthstone or MTG: arena as a base and give it tilt-shift
// look away from the viewer"; ENTROPY-TACTICS.md 7). While seated at Entropy Tactics the frame is held sharp in a band round `focus` (the
// board's focus row: screen y 0 the bottom, 1 the top; `band` the sharp share of the screen's height) and blurred away from it, more
// toward the top of the screen (away from you, the far rows and the void) than toward the bottom, with a faint chromatic split and a
// grain in what is blurred (the lens's own decay). Two separable passes (`entropy-tiltshift-h`, `-v`), nine taps each, their reach
// growing with the distance from the band. `set(on)` eases its strength in and out; it is drawn only while on or easing.
// It is a screen volume (render/glow.js `post.volumes`, as vfx/aberrantwipe.js and vfx/weatherfx/lensdrops.js are): the frame in, the
// shifted frame out, in the light-linear frame before the glitch and the bloom; its compile() warms both programs at boot.
//
// Prior art: the tilt-shift lens and its miniature look (Olivo Barbieri's photographs, the Scheimpflug principle), Hearthstone's and
// Magic: The Gathering Arena's boards (the far edge soft), the separable gaussian of every engine's depth of field (a radius by the
// screen's row, not by depth: the cheap fake miniature).
//
//   new TiltShift(game, look)   .set(on)   .focus (screen y 0..1 held sharp, 0 the bottom)   .band   .on   .render(post, src)   .compile(renderer, post)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const SHIFT = { ease: 3.5, reachUp: 0.008, reachDown: 0.0045, split: 0.0025, grain: 0.035 }; // (reach: a tap's spacing, of the screen's height, at full blur)
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }';
const COMMON = `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uK, uFocus, uBand, uUp, uDown, uT; varying vec2 vUv;
float reach() {
	float d = vUv.y - uFocus, ex = max( 0.0, abs( d ) - uBand * 0.5 ) / max( 0.05, 1.0 - uBand * 0.5 );
	return uK * smoothstep( 0.0, 1.0, ex * 1.6 ) * ( d > 0.0 ? uUp : uDown );
}`;
const BLUR = (dir, last) => `${COMMON}
uniform float uSplit, uGrain;
void main() {
	float r = reach(); vec2 st = ${dir} * r;
	${last ? 'vec2 sp = vec2( uSplit * r / max( uUp, 1e-4 ), 0.0 );' : ''}
	vec3 c = vec3( 0.0 ); float w = 0.0;
	for ( int i = -4; i <= 4; i++ ) {
		float fi = float( i ), k = exp( -fi * fi / 8.0 ); vec2 o = vUv + st * fi;
		${last ? 'c += vec3( texture2D( tSrc, o + sp ).r, texture2D( tSrc, o ).g, texture2D( tSrc, o - sp ).b ) * k;' : 'c += texture2D( tSrc, o ).rgb * k;'}
		w += k;
	}
	c /= w;
	${last ? 'float n = fract( sin( dot( floor( vUv / uTexel ) + uT * 13.0, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5; c *= 1.0 + n * uGrain * clamp( r / max( uUp, 1e-4 ), 0.0, 1.0 );' : ''}
	gl_FragColor = vec4( c, 1.0 );
}`;
// (the reach is a share of the screen's height: in x it is scaled by the aspect, so a tap is the same size both ways)
const H = BLUR('vec2( uTexel.x / uTexel.y, 0.0 )', false);
const V = BLUR('vec2( 0.0, 1.0 )', true);

export class TiltShift {
  constructor(game, look) {
    this.game = game; this.look = look; this.want = false; this.k = 0; this.focus = 0.42; this.band = 0.32; this.mats = null; this.a = null; this.b = null; this.last = 0;
    this.join();
  }
  /** On the glow's volumes (at boot, or the first time it is asked for if the glow came later). */
  join() { const P = this.game.post; if (P && !this.joined) { (P.volumes ||= []).push(this); this.joined = true; } }
  get on() { return (this.want || this.k > 0.002) && !!this.game.post?.on; }
  set(on) {
    this.join(); this.want = !!on;
    const now = performance.now() / 1000, dt = Math.min(0.1, this.last ? now - this.last : 0); this.last = now;
    this.k = THREE.MathUtils.damp(this.k, this.want ? 1 : 0, SHIFT.ease, dt); if (!this.want && this.k < 0.002) this.k = 0;
  }
  make() {
    if (this.mats) return;
    const u = () => ({ tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uK: { value: 0 }, uFocus: { value: 0.42 }, uBand: { value: 0.32 }, uUp: { value: SHIFT.reachUp }, uDown: { value: SHIFT.reachDown }, uT: { value: 0 }, uSplit: { value: SHIFT.split }, uGrain: { value: SHIFT.grain } });
    const mk = (name, frag) => new THREE.ShaderMaterial({ name, vertexShader: VERT, fragmentShader: frag, uniforms: u(), depthTest: false, depthWrite: false, toneMapped: false });
    this.mats = [mk('entropy-tiltshift-h', H), mk('entropy-tiltshift-v', V)];
  }
  render(post, src) {
    this.make();
    const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    if (!this.a) { this.a = rt(); this.b = rt(); }
    for (const t of [this.a, this.b]) if (t.width !== src.width || t.height !== src.height) t.setSize(src.width, src.height);
    const T = performance.now() / 1000;
    for (const m of this.mats) { const U = m.uniforms; U.uTexel.value.set(1 / src.width, 1 / src.height); U.uK.value = this.k; U.uFocus.value = this.focus; U.uBand.value = this.band; U.uT.value = T % 100; }
    this.mats[0].uniforms.tSrc.value = src.texture; post.pass(this.mats[0], this.a);
    this.mats[1].uniforms.tSrc.value = this.a.texture; post.pass(this.mats[1], this.b);
    return this.b;
  }
  compile(renderer, post) { this.make(); for (const m of this.mats) { post.quad.material = m; renderer.setRenderTarget(post.half); renderer.compile(post.fs, post.cam); } }
  dispose() {
    const Vs = this.game.post?.volumes, i = Vs ? Vs.indexOf(this) : -1; if (i >= 0) Vs.splice(i, 1);
    for (const m of this.mats || []) m.dispose(); this.a?.dispose(); this.b?.dispose(); this.mats = null; this.a = this.b = null; this.joined = false;
  }
}
