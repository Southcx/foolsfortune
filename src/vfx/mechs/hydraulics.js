// ---------------------------------------------------------------------------------------
// A MECH'S HYDRAULICS / THE JOINT BOTTLES / THE FRAME'S FILIGREE (plain names; South, 2026-11-02: "You know how the courier has the
// texture mask with the squiggly ornamental lines that you use to show the lachryma charging patterns? Can we give the mecha something
// similar? ... hydraulic operation motifs with the individual joints being like lachrymato spherical bottles ... seeing Lachryma
// splashing around inside your mech joints could be really interesting visually, plus it gives us more options and stronger
// directional vision for refining the limbs breaking off in fights"). A look on the parts body (vfx/mechs/partsbody.js):
//   THE BOTTLES   every ball joint the body registers (`balls`) is a Lachrymato Bottle made round: under its clear shell (kit.js
//                 `jointBall`, the `j` program) Lachryma stands to a level, the Courier's own (the skin's colour and glow, read live
//                 from the dressed core, so a firing at the kiln fills the joints anew), the film turning at its rim. Its surface is a
//                 plane through the fill that springs against the joint's own acceleration in the world (a step sloshes the knees, a
//                 swing the elbows, a hit throws it all up: `kick`), rippling while it moves; seen through the cut, its top is the film.
//                 The fill is the battery (`set({ fill })`); a FRACTURED joint leaks (its level falls to LEAK.to of the rest and drips),
//                 Its heart (the skin's ball at its middle) glows through the Lachryma while sealed, the waist's the brightest (the
//                 dantian, the frame's target point: parts/cores.js). A SNAPPED one bursts: its Lachryma thrown out of the socket (`spill`), the bottle left empty and dark.
//   THE FILIGREE  the waking traces (vfx/mechs/mount.js: the running hand over the plates) made the Courier's filigree's three
//                 channels (vfx/filigree.js): ABSORB, the cable filling the battery, pulses running IN along the traces toward the
//                 cradle; CHANNEL, the frame spending (a boost, a special, a blow), pulses running OUT from it, brighter as it spends;
//                 HURT, a blow taken, the traces flashed pale and hot and easing back. Each an envelope, never a blink.
// Looks only: the battery, the cable, the joints' states and the blows are the runtime's (world/hangar/mechpilot.js drives `set`,
// `channel`, `hurt`; the body calls `kick` on its jiggle and `spill` on a snap).
// Prior art: the Lachrymato Bottle (vfx/bottle.js: a liquid cut by a sprung plane, its back faces the surface), the Courier's filigree
// (vfx/filigree.js: absorption, channelling, damage), Evangelion's LCL and the Units' bleeding joints, Gundam's field-motor joints and
// Armored Core's hydraulic actuators, the ball-jointed doll's ball, the hip flask and the lava lamp (a liquid you watch move).
//
//   new MechHydraulics(body)   H.update(dt)   H.set({ fill, absorb })   H.channel(k)   H.hurt(k)   H.kick(v)   H.spill(id)   HYDRAULICS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The liquid inside a ball (share of its radius), the spring of its surface (k stiffness, c damping, `push` how far a m/s² tips it,
 *  `max` the tip at most), the ripple, a fractured joint's leak, and the filigree's envelopes (rise and ease, a real second). */
export const HYDRAULICS = {
  inner: 0.86, k: 26, c: 4.2, push: 0.022, max: 1.15, wave: 0.05, waveEase: 1.6, kickWave: 0.06,
  heart: { joint: 0.35, dantian: 1.8, rest: 0.25 }, leak: { to: 0.35, rate: 0.08, drip: [0.9, 2.2] }, spill: 'mech.joint.spill',
  absorb: { rise: 2.5, ease: 1.2 }, channel: { rise: 8, ease: 1.6 }, hurt: { rise: 14, ease: 0.9 },
};
const H = HYDRAULICS;

const LIQ_V = /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vC;
void main() { vP = position; vC = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LIQ_F = /* glsl */`uniform vec3 uPlane, uA, uB; uniform float uLevel, uT, uWave, uR, uDark, uMechFade, uHeart; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vC;
vec3 film(float t) { return 0.5 + 0.5 * cos(6.2832 * (t + vec3(0.0, 0.33, 0.67))); }
float fb2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
void main() {
  if (uMechFade > 0.0 && fb2(0.5 * gl_FragCoord.xy) * 0.25 + fb2(gl_FragCoord.xy) + 0.03 < uMechFade) discard;
  vec3 q = vP / uR;
  float wave = uWave * (sin(q.x * 9.0 + uT * 7.0) * sin(q.z * 8.0 - uT * 5.5) + 0.5 * sin((q.x + q.z) * 15.0 + uT * 11.0));
  if (dot(q, uPlane) > uLevel + wave) discard;                                // (above the surface: the empty glass)
  vec3 V = normalize(cameraPosition - vW);
  vec3 toC = vC - cameraPosition; float along = dot(toC, -V), miss = length(toC + V * along);                 // (how near the eye's ray passes the heart)
  vec3 heart = uB * uHeart * exp(-pow(miss / (uR * 0.42), 2.0)) * 1.6;                                      // (the skin's heart lit through the Lachryma)
  if (!gl_FrontFacing) {                                                       // (a back face seen through the cut: the surface)
    float f = q.x * 2.3 + q.z * 1.9 + uT * 0.07;
    gl_FragColor = vec4((mix(uA * 0.55 + uB * 0.35, film(f), 0.35) + heart) * (1.0 - uDark), 1.0);
  } else {
    float ndv = abs(dot(normalize(vN), V)), rim = pow(1.0 - ndv, 2.0), depth = clamp(uLevel - dot(q, uPlane), 0.0, 2.0);
    vec3 body = mix(uB * 0.9, uA * 0.55, clamp(depth * 0.8, 0.0, 1.0));       // (lit near the surface, deeper toward the bottom)
    vec3 c = body + film(rim * 1.4 + q.y * 0.6 + uT * 0.05) * rim * 0.55 + uB * 0.25 * (1.0 - ndv);
    gl_FragColor = vec4((c + heart) * (1.0 - uDark), 1.0);
  }
  #include <colorspace_fragment>
}`;

const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _q = new THREE.Quaternion(), _n = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const env = (cur, want, E, dt) => cur + (want - cur) * Math.min(1, dt * (want > cur ? E.rise : E.ease));

export class MechHydraulics {
  constructor(body) {
    this.body = body; this.bottles = []; this.sig = ''; this.fill = 0.72; this.t = 0;
    this.k = { absorb: 0, channel: 0, hurt: 0 }; this.want = { absorb: 0, channel: 0, hurt: 0 };
    this.colA = new THREE.Color(0xd8ccff); this.colB = new THREE.Color(0x8a6cff); this.geo = new THREE.SphereGeometry(1, 28, 18);
  }
  /** The battery's share and whether the cable is filling it. */
  set({ fill, absorb } = {}) { if (fill !== undefined) this.fill = Math.max(0, Math.min(1, fill)); if (absorb !== undefined) this.want.absorb = absorb ? 1 : 0; }
  /** The frame spending (0..1: a boost, a special, a blow thrown); held while it spends, eased out after. */
  channel(k = 1) { this.want.channel = Math.max(this.want.channel, Math.min(1, k)); }
  /** A blow taken (0..1): the traces flashed and the bottles thrown about. */
  hurt(k = 1) { this.want.hurt = Math.max(this.want.hurt, Math.min(1, k)); this.kick(1.5 + 2 * k); }
  /** Every bottle's surface thrown up (the body's jiggle: a hit, the mount's lock, a landing). */
  kick(v = 1) { for (const b of this.bottles) { b.vx += (Math.random() - 0.5) * v * 0.9; b.vz += (Math.random() - 0.5) * v * 0.9; b.wave = Math.min(0.22, b.wave + Math.abs(v) * H.kickWave); } }
  /** A snapped joint's bottle burst: its Lachryma thrown out of the socket, the bottle left empty. */
  spill(id) {
    for (const b of this.bottles) if (b.id === id && b.level > 0.02) {
      b.obj.updateMatrixWorld(true); _p.set(...b.at).applyMatrix4(b.obj.matrixWorld);
      try { this.body.game?.vfx?.play?.(H.spill, { pos: _p.clone(), scale: Math.max(1, b.r * 2.2), tint: this.colB.getHex() }); } catch { /* (headless) */ }
      b.level = 0;
    }
  }

  /** The bottles laid again whenever the body's balls change (a build, a slot swapped). */
  sync() {
    const B = this.body.balls || [], sig = B.map((b) => `${b.id}:${b.r.toFixed(3)}:${b.obj.uuid}`).join('|');
    if (sig === this.sig) return; this.sig = sig;
    for (const b of this.bottles) { b.mesh.removeFromParent(); b.mat.dispose(); }
    this.bottles = [];
    const fadeU = this.body.fadeU || { value: 0 };
    for (const b of B) {
      const r = b.r * H.inner;
      const mat = new THREE.ShaderMaterial({ name: 'mech-joint-lachryma', vertexShader: LIQ_V, fragmentShader: LIQ_F, side: THREE.DoubleSide,
        uniforms: { uPlane: { value: new THREE.Vector3(0, 1, 0) }, uLevel: { value: 0.3 }, uT: { value: 0 }, uWave: { value: 0 }, uR: { value: r },
          uA: { value: this.colA }, uB: { value: this.colB }, uDark: { value: 0 }, uHeart: { value: 0 }, uMechFade: fadeU } });
      const mesh = new THREE.Mesh(this.geo, mat); mesh.scale.setScalar(r); mesh.position.set(...b.at); mesh.name = `mech.lachryma.${b.id}`;
      mesh.renderOrder = 1; mesh.userData.mark = 'lachryma'; b.obj.add(mesh);
      this.bottles.push({ id: b.id, obj: b.obj, at: b.at, r, mesh, mat, nx: 0, nz: 0, vx: 0, vz: 0, wave: 0, level: this.fill, last: null, vel: new THREE.Vector3(), drip: 1 + Math.random() });
    }
  }

  update(dt) {
    dt = Math.min(Math.max(dt || 0, 0), 1 / 20); this.sync(); this.t += dt;
    // the Courier's Lachryma: the dressed core's skin colour and glow, live
    const F = this.body.mats?.core?.userData?.finish;
    if (F?.uFinOn?.value > 0.5) { this.colA.copy(F.uFinA.value); this.colB.copy(F.uFinB.value).lerp(this.colA, 0.25); }
    // the filigree's three channels on the waking traces' shared uniforms (mount.js)
    for (const [c, E] of [['absorb', H.absorb], ['channel', H.channel], ['hurt', H.hurt]]) this.k[c] = env(this.k[c], this.want[c], E, dt);
    this.want.channel *= Math.exp(-dt * 6); this.want.hurt *= Math.exp(-dt * 9);
    const W = this.body.userData?.wakeU; if (W?.uAbsorb) { W.uAbsorb.value = this.k.absorb; W.uChannel.value = this.k.channel; W.uHurt.value = this.k.hurt; }
    const state = this.body.state || {}, g = this.body.game;
    for (const b of this.bottles) {
      // the surface's plane sprung against the joint's acceleration, in its own frame
      b.obj.updateMatrixWorld(true); _p.set(...b.at).applyMatrix4(b.obj.matrixWorld);
      if (b.last && dt > 0) {
        _v.copy(_p).sub(b.last).divideScalar(dt);
        if (_v.lengthSq() > 3600) _v.copy(b.vel); // (a placement jump, not motion)
        _a.copy(_v).sub(b.vel).divideScalar(dt).clampLength(0, 120); b.vel.copy(_v);
      } else _a.set(0, 0, 0);
      (b.last ||= new THREE.Vector3()).copy(_p);
      b.obj.getWorldQuaternion(_q).invert(); _a.applyQuaternion(_q); _n.copy(_up).applyQuaternion(_q); // (gravity's up and the push, in the joint's frame)
      const tx = _n.x - _a.x * H.push, tz = _n.z - _a.z * H.push;
      b.vx += (H.k * (tx - b.nx) - H.c * b.vx) * dt; b.vz += (H.k * (tz - b.nz) - H.c * b.vz) * dt;
      b.nx = Math.max(-H.max, Math.min(H.max, b.nx + b.vx * dt)); b.nz = Math.max(-H.max, Math.min(H.max, b.nz + b.vz * dt));
      const ny = Math.max(0.15, _n.y); b.mat.uniforms.uPlane.value.set(b.nx, ny, b.nz).normalize();
      b.wave = Math.max(Math.hypot(b.vx, b.vz) * H.wave, b.wave * Math.exp(-dt * H.waveEase));
      // its level: the battery, a fractured joint leaking, a snapped one empty
      const st = state[b.id], want = st === 'snapped' ? 0 : st === 'fractured' ? this.fill * H.leak.to : this.fill;
      b.level += (want - b.level) * Math.min(1, dt * (want < b.level ? H.leak.rate * 6 : 0.8));
      if (st === 'fractured' && b.level > 0.05 && (b.drip -= dt) < 0) {
        b.drip = H.leak.drip[0] + Math.random() * (H.leak.drip[1] - H.leak.drip[0]);
        try { g?.vfx?.play?.('mech.joint.drip', { pos: _p.clone(), scale: Math.max(0.8, b.r * 1.6), tint: this.colB.getHex() }); } catch { /* (headless) */ }
      }
      const U = b.mat.uniforms; U.uLevel.value = b.level * 2 - 1; U.uWave.value = b.wave; U.uT.value = this.t; U.uDark.value = st === 'snapped' ? 1 : 0;
      U.uHeart.value = (this.body.sealK ?? 0) * (b.id === 'waist' ? H.heart.dantian : H.heart.joint) + (b.id === 'waist' ? H.heart.rest : 0); // (the dantian the brightest: the target point)
      b.mesh.visible = b.level > 0.01;
    }
  }

  dispose() { for (const b of this.bottles) { b.mesh.removeFromParent(); b.mat.dispose(); } this.bottles = []; this.geo.dispose(); }
}
