// ---------------------------------------------------------------------------------------
// THE JELLY DEFORMER: a soft body without a skeleton. A model with no rig is moved by four numbers fed to its vertex shader, each
// driven by a spring on the CPU:
//   squash   the height scaled by s and the width by 1/sqrt(s) (the volume kept), the most at the waist and none at the very foot
//   lean     the top displaced by an offset, growing with the square of the height: the base stays on the ground, the top lags
//   wobble   a ripple travelling up the body, its size decaying (a hit, a landing, a fright)
//   dent     a dimple pushed in along the normal around a point (where it was struck), springing back out
// Normals are left as they were (a jelly forgives it), so the lighting stays smooth.
//
// Prior art: squash and stretch, the first of Disney's twelve principles (Thomas & Johnston, The Illusion of Life), done the way the
// sixth generation did soft creatures without bones (Dragon Quest's slimes, Kirby: a scale on one axis and its inverse on the others,
// the volume kept); Slime Rancher's slimes (a vertex shader bending a mesh by a spring's offset, the top lagging the base); and the
// damped harmonic spring of every "juicy" game feel talk (Jan Willem Nijman, Martin Jonasson & Petri Purho, "Juice it or lose it").
//
//   const d = new JellyDeform(material, height)   d.kick(squashV, leanV2, wobble)   d.dent(localPoint, depth)   d.update(dt, accel2)
//   d.target.squash = 0.8  (where the squash spring rests: a crouch, a sleep, a puddle)
//
// THE MELT (optional, { melt: true }): the surface of a creature of sloppy wet sand, sliding down it forever. A pattern of wet and dry
// sand laid round the body (on a circle, so it has no seam) and scrolled slowly down it, about six centimetres a second: tall wet
// streaks that run toward the foot, wetter and darker low down, glossy where wet and matte where dry, a coarse grain that does not
// move. A scrolled pattern is the honest way to show a surface that is always running (the sixth generation's waterfalls and lava,
// Wind Waker's and Ocarina of Time's scrolled textures), and it is slow and soft, so it never shimmers.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class JellyDeform {
  constructor(material, height, { melt = false } = {}) {
    this.melt = melt;
    this.u = {
      uTime: { value: 0 },
      uSq: { value: 1 }, uLean: { value: new THREE.Vector2() }, uWob: { value: 0 }, uPh: { value: 0 },
      uDent: { value: new THREE.Vector4(0, 0, 0, 0) }, uH: { value: height },
    };
    this.sq = 1; this.sqV = 0;
    this.lean = new THREE.Vector2(); this.leanV = new THREE.Vector2();
    this.wob = 0; this.ph = 0; this.dentK = 0;
    this.target = { squash: 1, lean: new THREE.Vector2() };
    this.k = { squash: 140, squashD: 9, lean: 70, leanD: 7, wobDecay: 2.4, wobRate: 11 };
    const u = this.u;
    material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
uniform float uSq, uWob, uPh, uH; uniform vec2 uLean; uniform vec4 uDent; varying vec3 vJP;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vJP = position;
{
	float h = clamp( position.y / uH, 0.0, 1.0 );
	float s = max( uSq, 0.15 );
	float waist = 0.25 + 0.75 * sin( 3.14159 * clamp( h * 1.05, 0.0, 1.0 ) );
	transformed.xz *= mix( 1.0, inversesqrt( s ), waist );
	transformed.y *= s;
	transformed.xz *= 1.0 + uWob * sin( uPh - h * 5.5 ) * ( 0.25 + h );
	transformed.xz += uLean * h * h;
	float dd = length( position - uDent.xyz );
	transformed -= objectNormal * uDent.w * exp( -dd * dd * 7.0 );
}`);
      if (melt) sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uTime, uH; varying vec3 vJP;
float jh( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }
float jn( vec3 p ) {
	vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( mix( jh( i ), jh( i + vec3( 1, 0, 0 ) ), f.x ), mix( jh( i + vec3( 0, 1, 0 ) ), jh( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
	            mix( mix( jh( i + vec3( 0, 0, 1 ) ), jh( i + vec3( 1, 0, 1 ) ), f.x ), mix( jh( i + vec3( 0, 1, 1 ) ), jh( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
float jWet;
{
	// round the body (a circle: no seam), up it, and scrolled down it
	float a = atan( vJP.x, vJP.z ), h = clamp( vJP.y / uH, 0.0, 1.0 );
	vec2 ring = vec2( cos( a ), sin( a ) );
	float run = vJP.y * 2.2 + uTime * 0.13;
	float streak = jn( vec3( ring * 2.6, run * 0.35 ) ) * 0.65 + jn( vec3( ring * 6.0, run * 0.9 ) ) * 0.35;
	jWet = smoothstep( 0.5, 0.78, streak + 0.28 * ( 1.0 - h ) );
	float grain = jn( vec3( ring * 14.0, vJP.y * 16.0 ) );
	vec3 dry = vec3( 0.80, 0.65, 0.44 ), wet = vec3( 0.47, 0.35, 0.22 );
	diffuseColor.rgb *= mix( dry, wet, jWet ) * ( 0.9 + 0.18 * grain ); // (the material's colour tints it: white is plain sand)
}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix( 0.92, 0.22, jWet );`);
    };
    material.customProgramCacheKey = () => (melt ? 'jelly-melt' : 'jelly');
  }
  /** A push: on the squash spring's speed, the lean spring's speed, and the wobble. */
  kick(squashV = 0, leanV = null, wobble = 0) {
    this.sqV += squashV;
    if (leanV) this.leanV.add(leanV);
    this.wob = Math.min(0.35, this.wob + wobble);
  }
  dent(local, depth) { this.u.uDent.value.set(local.x, local.y, local.z, 0); this.dentK = depth; }
  /** accel: the body's horizontal acceleration in its own frame (x, z): the top is thrown back against it. */
  update(dt, accel = null) {
    const K = this.k;
    this.sqV += ((this.target.squash - this.sq) * K.squash - this.sqV * K.squashD) * dt;
    this.sq += this.sqV * dt;
    const tx = this.target.lean.x - (accel ? accel.x * 0.035 : 0), tz = this.target.lean.y - (accel ? accel.y * 0.035 : 0);
    this.leanV.x += ((tx - this.lean.x) * K.lean - this.leanV.x * K.leanD) * dt;
    this.leanV.y += ((tz - this.lean.y) * K.lean - this.leanV.y * K.leanD) * dt;
    this.lean.addScaledVector(this.leanV, dt);
    this.lean.clampLength(0, 0.6);
    this.wob *= Math.exp(-K.wobDecay * dt); this.ph += dt * K.wobRate;
    this.dentK *= Math.exp(-6 * dt);
    const u = this.u;
    u.uTime.value += dt; // (the melt runs on the creature's own time: a halted jelly stops running too)
    u.uSq.value = this.sq; u.uLean.value.copy(this.lean); u.uWob.value = this.wob; u.uPh.value = this.ph; u.uDent.value.w = this.dentK;
  }
  /** Hold still (a halt): nothing moves until it is let go. */
  freeze() { this.sqV = 0; this.leanV.set(0, 0); }
}
