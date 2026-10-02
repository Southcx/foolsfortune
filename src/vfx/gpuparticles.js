// ---------------------------------------------------------------------------------------
// GPU PARTICLES: point sprites whose whole life is worked out on the GPU. A particle is written ONCE, when it is emitted (where, how fast,
// when, how long, its size and colour, its drag and gravity, the floor it settles on); from then on the vertex shader knows where it is
// at any moment from those numbers alone (the closed form of motion under gravity and linear drag), and nothing about it is touched
// again. The CPU's cost is the emit, not the particle: a burst of two thousand sparks costs what writing two thousand small records
// costs, and the frame after costs nothing. The pool is a ring: when it is full the oldest is written over.
//
// The old pool moved every particle on the CPU every frame and re-sent all of them to the GPU, which capped it at 1500 a pool.
//
// Motion (per axis, drag k, gravity g down):   v(t) = (v0 + g/k) e^{-kt} - g/k       x(t) = x0 + (v0 + g/k)(1 - e^{-kt})/k - g t / k
// (and the plain ballistic form when k is 0). The fall stops at the particle's floor (it slides to a rest there: no bounce).
//
// Prior art: "stateless" GPU particles (the analytic particle systems of the PS2 era's VU1 microcode, where a particle's position was a
// function of its age; Lutz Latta's "Building a Million Particle System", 2004, for the GPU form; Unity VFX Graph's and Niagara's
// GPU emitters).
//
//   const p = new GpuParticles(scene, { max: 16384, additive, map })   p.emit({ pos, vel, life, size, sizeEnd, color, alpha, drag,
//   gravity, floor, twinkle })   p.update(dt)   p.scale = (pixels per unit at distance 1)   p.live (an estimate, for the diagnostics)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const BASE_FLOOR = -14; // (the basement's floor: basement.js BASE_Y)

const VERT = `
attribute vec4 aPos;   // x y z, born
attribute vec4 aVel;   // vx vy vz, life
attribute vec4 aCol;   // r g b a
attribute vec4 aP1;    // size0 size1 drag gravity
attribute vec4 aP2;    // floor twinkle seed -
uniform float uTime, uScale;
varying vec4 vColor;
void main() {
  float age = uTime - aPos.w, life = aVel.w;
  if ( age < 0.0 || age >= life ) { gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 ); gl_PointSize = 0.0; vColor = vec4( 0.0 ); return; }
  float k = aP1.z, g = aP1.w;
  vec3 p;
  if ( k > 1e-4 ) {
    float f = ( 1.0 - exp( -k * age ) ) / k;
    p.xz = aPos.xz + aVel.xz * f;
    p.y = aPos.y + ( aVel.y + g / k ) * f - g * age / k;
  } else {
    p = aPos.xyz + aVel.xyz * age;
    p.y -= 0.5 * g * age * age;
  }
  p.y = max( p.y, aP2.x );
  float t = age / life;
  vColor = vec4( aCol.rgb, aCol.a * ( 1.0 - t ) * min( 1.0, t * 12.0 + 0.3 ) );
  float s = mix( aP1.x, aP1.y, t );
  if ( aP2.y > 0.0 ) s *= 0.35 + 0.65 * abs( sin( age * aP2.y + aP2.z ) );
  vec4 mv = modelViewMatrix * vec4( p, 1.0 );
  gl_PointSize = s * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform sampler2D map; varying vec4 vColor;
void main() { vec4 t = texture2D( map, gl_PointCoord ); gl_FragColor = vec4( vColor.rgb, vColor.a * t.a ); }`;

export class GpuParticles {
  constructor(scene, { max = 16384, additive = false, map } = {}) {
    this.max = max; this.head = 0; this.time = 0; this.maxLife = 0;
    const g = (this.geo = new THREE.BufferGeometry());
    const mk = (name) => { const a = new THREE.BufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
    this.aPos = mk('aPos'); this.aVel = mk('aVel'); this.aCol = mk('aCol'); this.aP1 = mk('aP1'); this.aP2 = mk('aP2');
    this.aPos.array.fill(-1e9); // (born at the dawn of time: dead until written)
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3)); // (three.js wants one; the shader ignores it)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.death = new Float32Array(max);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, uTime: { value: 0 }, uScale: { value: 600 } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 3 : 2;
    scene.add(this.points);
    this.lo = Infinity; this.hi = -1; // (the slots written this frame: sent to the GPU as one range)
  }

  set scale(v) { this.mat.uniforms.uScale.value = v; }

  emit(o) {
    const i = this.head; this.head = (this.head + 1) % this.max;
    const j = i * 4, P = this.aPos.array, V = this.aVel.array, C = this.aCol.array, A = this.aP1.array, B = this.aP2.array;
    const life = o.life || 0.5;
    P[j] = o.pos.x; P[j + 1] = o.pos.y; P[j + 2] = o.pos.z; P[j + 3] = this.time;
    V[j] = o.vel?.x || 0; V[j + 1] = o.vel?.y || 0; V[j + 2] = o.vel?.z || 0; V[j + 3] = life;
    const c = o.color || { r: 1, g: 1, b: 1 };
    C[j] = c.r; C[j + 1] = c.g; C[j + 2] = c.b; C[j + 3] = o.alpha ?? 1;
    A[j] = o.size ?? 0.1; A[j + 1] = o.sizeEnd ?? A[j]; A[j + 2] = o.drag ?? 1; A[j + 3] = o.gravity ?? 0;
    // the floor it settles on: the ground floor's, the basement's, or none (out in the dunes, far below both, the ground is its own)
    const y = o.pos.y;
    B[j] = o.floor ?? (y < BASE_FLOOR - 5 ? -1e9 : y < -2 ? BASE_FLOOR + 0.02 : 0.02); B[j + 1] = o.twinkle || 0; B[j + 2] = Math.random() * 100;
    this.death[i] = this.time + life;
    if (i < this.lo) this.lo = i;
    if (i > this.hi) this.hi = i;
  }

  update(dt) {
    this.time += dt;
    this.mat.uniforms.uTime.value = this.time;
    if (this.hi < 0) return;
    // (ranges add up until the next draw sends them, and three.js merges and clears them then: a frame with several ticks keeps them all)
    for (const a of [this.aPos, this.aVel, this.aCol, this.aP1, this.aP2]) { a.addUpdateRange(this.lo * 4, (this.hi - this.lo + 1) * 4); a.needsUpdate = true; }
    this.lo = Infinity; this.hi = -1;
  }

  /** How many are alive (counted: for the diagnostics, not every frame). */
  get live() { let n = 0; const d = this.death, t = this.time; for (let i = 0; i < d.length; i++) if (d[i] > t) n++; return n; }
}
