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
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export class JellyDeform {
  constructor(material, height) {
    this.u = {
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
uniform float uSq, uWob, uPh, uH; uniform vec2 uLean; uniform vec4 uDent;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
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
    };
    material.customProgramCacheKey = () => 'jelly';
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
    u.uSq.value = this.sq; u.uLean.value.copy(this.lean); u.uWob.value = this.wob; u.uPh.value = this.ph; u.uDent.value.w = this.dentK;
  }
  /** Hold still (a halt): nothing moves until it is let go. */
  freeze() { this.sqV = 0; this.leanV.set(0, 0); }
}
