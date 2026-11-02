// ---------------------------------------------------------------------------------------
// A BOOSTER'S GIMBAL (plain name; South, 2026-11-02: "skating around with the boosters (which also need some TLC to point in the right
// direction, also be articulated)"): each nozzle of a mech's booster hung as two joints, its yoke turning about X on the mount and its
// bell about Z inside the yoke's fork (a rocket engine's two-axis gimbal), pointed so the exhaust runs opposite the thrust in the
// frame's own frame (back for a forward boost, out to the side for a strafe, down for a hop), and sprung (a damped spring an axis) so
// it slews rather than snaps. Each bell wears its plume: a white core with shock diamonds down it (the Mach disks of a jet run
// over-expanded) inside a softer sheath in the film's lilac, its length and light the thrust's share, flickering; and a vernier puff off
// the yoke at each quick boost (a reaction-control jet's short white jet, against the push). One program a part (the plume, the puff),
// additive, unlit, no shadow; nothing allocated a frame. No heat shimmer: the house's heat haze grabs the scene (vfx/caster/heathaze.js),
// a cost a nozzle cannot justify; the plume's own flicker carries the heat.
// Prior art: a gimballed rocket engine (the Saturn V's F-1, the Space Shuttle's main engines), shock diamonds (Mach disks), the
// reaction-control thrusters of the Apollo service module, Armored Core's quick-boost flare and verniers, a critically damped spring.
//
//   const B = new MechBoosters(body)   B.build(id, x) (the nozzles on the body's booster joint)   B.aim(ex, ey, ez, k) (the exhaust's
//   direction in the frame's body, k 0..1 the thrust's share)   B.puff(ex, ey, ez)   B.update(dt, sealK)   B.dispose()   BOOSTER_RIG
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOOSTER_NOZZLES, nozzleYoke, nozzleBell } from '../parts/backs.js';

/** The gimbal's numbers: the spring's natural frequency (rad/s) and damping ratio; the yoke's and the bell's reach (rad: the yoke from
 *  a little forward of straight down to up and back past horizontal, the bell either side); the exhaust at rest (down and back); the
 *  plume's length at full thrust (bell heights) and at the least; a puff's life (real s); the plume's brightness (x). */
export const BOOSTER_RIG = { w: 15, zeta: 0.72, yoke: [-0.45, 1.9], bell: 1.1, rest: [0, -0.86, -0.5], plume: 4.8, idle: 0.75, puff: 0.2, glow: 1.5 };
const PLUME_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const PLUME_FS = `uniform float uK; uniform float uTime; uniform vec3 uCore; uniform vec3 uSheath; uniform float uCoreMode;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main() {
  float v = 1.0 - vUv.y;                                       // (0 at the mouth, 1 at the tail)
  float rim = pow(abs(dot(vN, vV)), 1.4);                      // (bright through the middle, soft at the edge)
  float flick = 0.85 + 0.15 * sin(uTime * 61.0 + v * 9.0) * sin(uTime * 37.0);
  float fade = pow(1.0 - v, 1.6);
  vec3 c; float a;
  if (uCoreMode > 0.5) {
    float dia = pow(abs(cos(v * 3.14159 * 4.5 - uTime * 2.0)), 8.0) * (1.0 - v);   // (the shock diamonds down the core)
    c = mix(uSheath, uCore, 0.6 + 0.4 * fade) * (1.2 + 1.6 * dia); a = rim * fade * (0.55 + 0.6 * dia);
  } else { c = mix(uSheath, uCore, fade * 0.5); a = rim * fade * 0.45; }
  gl_FragColor = vec4(c * a * uK * flick, 1.0);
}`;
const _q = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _d = new THREE.Vector3(), _down = new THREE.Vector3(0, -1, 0);

function plumeMaterial(core) {
  return new THREE.ShaderMaterial({ name: core ? 'mech-plume-core' : 'mech-plume', vertexShader: PLUME_VS, fragmentShader: PLUME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { uK: { value: 0 }, uTime: { value: 0 }, uCore: { value: new THREE.Color(0xfff2d8) }, uSheath: { value: new THREE.Color(0xb9a4ff) }, uCoreMode: { value: core ? 1 : 0 } } });
}

export class MechBoosters {
  constructor(body) {
    this.body = body; this.nozzles = []; this.k = 0; this.kNow = 0; this.t = 0; this.puffT = 9;
    this.aimDir = new THREE.Vector3(...BOOSTER_RIG.rest).normalize(); this.puffDir = new THREE.Vector3(0, 0, -1);
    this.mats = { core: plumeMaterial(true), sheath: plumeMaterial(false), puff: plumeMaterial(true) };
    this.geo = { core: new THREE.CylinderGeometry(0.34, 0.12, 1, 16, 1, true).translate(0, -0.5, 0), sheath: new THREE.CylinderGeometry(0.9, 0.35, 1, 18, 1, true).translate(0, -0.5, 0), puff: new THREE.ConeGeometry(0.16, 1, 10, 1, true).rotateX(Math.PI).translate(0, -0.5, 0) };
  }
  /** The nozzles of booster `id` hung on the body's booster joint, the old ones taken down. */
  build(id, x) {
    const B = this.body, j = B.joints, at = j.booster;
    for (const n of this.nozzles) { n.puff.removeFromParent(); n.yoke.removeFromParent(); delete j[n.yoke.name.slice(5)]; delete j[n.bell.name.slice(5)]; }
    this.nozzles = [];
    const list = BOOSTER_NOZZLES[id]?.(x) || []; if (!at) return this;
    list.forEach((N, i) => {
      const yoke = B.J(`boosterYoke${i}`, at, [N.x, N.y, N.z]), bell = B.J(`boosterBell${i}`, yoke);
      B.put(yoke, 'booster', (S) => nozzleYoke(S, N.r)); B.put(bell, 'booster', (S) => nozzleBell(S, N.r, N.h));
      const mk = (g, m, sc) => { const o = new THREE.Mesh(this.geo[g], this.mats[m]); o.castShadow = o.receiveShadow = false; o.renderOrder = 3; o.frustumCulled = false; o.visible = false; o.scale.set(sc, 1, sc); return o; };
      const plume = new THREE.Group(); plume.name = `mech.plume${i}`; plume.position.y = -N.h * 1.05; bell.add(plume);
      const core = mk('core', 'core', N.r * 1.6), sheath = mk('sheath', 'sheath', N.r * 1.1); plume.add(core, sheath);
      const puff = mk('puff', 'puff', 1); at.add(puff); puff.position.set(N.x, N.y + 0.12, N.z); // (on the mount: its direction read in the mount's frame)
      this.nozzles.push({ yoke, bell, plume, core, sheath, puff, h: N.h, r: N.r, ax: 0.53, vx: 0, az: 0, vz: 0 });
    });
    this.snap = true; return this;
  }
  /** Where the exhaust should run (the frame's body: +X left, +Y up, +Z front) and how hard (0..1). */
  aim(ex, ey, ez, k) { this.aimDir.set(ex, ey, ez); if (this.aimDir.lengthSq() < 1e-6) this.aimDir.set(...BOOSTER_RIG.rest); this.aimDir.normalize(); this.k = Math.max(0, Math.min(1, k)); }
  /** A vernier puff against a quick boost's push (its exhaust's direction, the body's). */
  puff(ex, ey, ez) { this.puffDir.set(ex, ey, ez); if (this.puffDir.lengthSq() < 1e-6) return; this.puffDir.normalize(); this.puffT = 0; }

  /** The gimbals slewed toward the aim, the plumes drawn; after the frame's matrices are made (the aim is read in the mount's frame). */
  update(dt, sealK = 1) {
    if (!this.nozzles.length) return;
    const R = BOOSTER_RIG, B = this.body; dt = Math.min(Math.max(dt || 0, 0), 0.05); this.t += dt; this.puffT += dt;
    const at = B.joints.booster; at.getWorldQuaternion(_q); B.body.getWorldQuaternion(_qb); _q.invert().multiply(_qb); // (the body's frame into the mount's)
    _d.copy(this.aimDir).applyQuaternion(_q);
    const tz = Math.asin(Math.max(-1, Math.min(1, _d.x))), tx = Math.max(R.yoke[0], Math.min(R.yoke[1], Math.atan2(-_d.z, -_d.y))), bz = Math.max(-R.bell, Math.min(R.bell, tz));
    const w2 = R.w * R.w, c = 2 * R.zeta * R.w;
    this.kNow += (this.k - this.kNow) * Math.min(1, dt * 12);
    const lit = this.kNow * Math.min(1, sealK * 1.4), puffK = this.puffT < R.puff ? 1 - this.puffT / R.puff : 0;
    for (const n of this.nozzles) {
      if (this.snap || dt === 0) { n.ax = tx; n.az = bz; n.vx = n.vz = 0; }
      else { const h = dt / 2; for (let i = 0; i < 2; i++) { n.vx += (w2 * (tx - n.ax) - c * n.vx) * h; n.ax += n.vx * h; n.vz += (w2 * (bz - n.az) - c * n.vz) * h; n.az += n.vz * h; } }
      n.yoke.rotation.set(n.ax, 0, 0); n.bell.rotation.set(0, 0, n.az);
      const L = n.h * (R.idle + (R.plume - R.idle) * this.kNow) * (0.94 + 0.06 * Math.sin(this.t * 47 + n.r * 9));
      n.plume.scale.set(1, L, 1); n.core.visible = n.sheath.visible = lit > 0.02;
      if (puffK > 0) { _d.copy(this.puffDir).applyQuaternion(_q); n.puff.quaternion.setFromUnitVectors(_down, _d); n.puff.scale.set(1.2 + n.r, 0.6 + 1.4 * puffK, 1.2 + n.r); }
      n.puff.visible = puffK > 0 && sealK > 0.3;
      n.yoke.updateMatrixWorld(true);
    }
    this.snap = false;
    this.mats.core.uniforms.uK.value = this.mats.sheath.uniforms.uK.value = lit * R.glow; this.mats.puff.uniforms.uK.value = puffK * 1.5;
    for (const m of Object.values(this.mats)) m.uniforms.uTime.value = this.t;
  }
  dispose() { for (const g of Object.values(this.geo)) g.dispose(); for (const m of Object.values(this.mats)) m.dispose(); this.nozzles = []; }
}
