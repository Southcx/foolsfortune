// ---------------------------------------------------------------------------------------
// THE SPRAY'S AIM: where a drop of the Soul Brush's paint goes, and where the stream will land (docs/plans/LACHRYMA-LOOP.md section 3,
// rules 1 to 4; the causes it answers in docs/plans/research/PAINTING.md section 4: the old spray threw away the pitch, tilted every drop
// at random, scattered it flat 10 degrees either way, and left one drop a faint dot).
//   - A drop flies along the aim, the full look ray converged on what the crosshair is over, STRAIGHT for `straight` metres, then falls.
//     Its speed varies by no more than `jitter`.
//   - The SPREAD is a cone: 3 degrees standing, 5 moving, 12 in the air. Drawn biased to the middle; sustained fire (the HEAT) lets the
//     wide draws come, and a jump resets it.
//   - A SPLAT grows with the throw (`near` metres at the brush, `far` at `at` metres and past), stretched along a shallow hit; every drop
//     shows. A droplet trails the arc every metre.
//   - The RETICLE: the centre drop's own flight, simulated, puts an inner point where the stream lands and a ring for the spread there.
//     A world mark, no words (CLAUDE.md); its look is a stand-in, Calissa's to make.
//
// Prior art: Splatoon's shot (two flight states, straight then falling; the Splattershot's spread, its jump spread and its bias toward the
// centre; the ground reticle), Super Mario Sunshine's FLUDD squirt (a stream aimed with the camera, planted feet for precision).
//
//   const S = new PaintSpray(game)   S.update(dt, firing, P)   S.muzzle(P) -> where it leaves   S.aim(from, out) -> dir   S.launch(from, dir, rand) -> velocity
//   S.fly(drop, dt) (gravity once past `straight`)   S.splat(drop, normal) -> { r, stretch }   S.predict(from, dir) -> { point, dist }
//   S.reticle(on, from, aspectColor)   SPRAY (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const SPRAY = {
  speed: 16, straight: 5, gravity: 14, jitter: 0.03, // (m/s; metres before it falls; m/s^2 after; the speed's share of variance)
  spread: { still: 3, moving: 5, air: 12 }, // (degrees, the cone's half-angle)
  heat: { build: 1.2, cool: 2.5 }, // (seconds of fire to the full spread's chance; how fast it cools when you stop)
  splat: { near: 0.35, far: 0.7, at: 6 }, // (metres of splat radius at the brush and at `at` metres of throw)
  trail: 1, // (metres between droplets along the arc)
};
const DEG = Math.PI / 180, UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();

export class PaintSpray {
  constructor(game) {
    this.game = game; this.heat = 0; this.wasGrounded = true; this.spreadNow = SPRAY.spread.still;
    // the reticle's stand-in: a point and a ring laid on what the stream lands on
    const mat = (o) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
    this.dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), mat(0.9)); this.ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40), mat(0.55));
    this.mark = new THREE.Group(); this.mark.add(this.dot, this.ring); this.mark.visible = false; this.mark.renderOrder = 30; this.mark.name = 'paint-reticle';
    game.scene?.add(this.mark);
  }

  /** The spread now (degrees): the body's state, and the heat of sustained fire (a jump resets it). */
  update(dt, firing, P) {
    const S = SPRAY.spread, air = !P.grounded, moving = Math.hypot(P.vel.x, P.vel.z) > 0.6;
    if (air && this.wasGrounded && P.vel.y > 1) this.heat = 0; // (a jump: the spread starts over, Splatoon's rule)
    this.wasGrounded = !air;
    this.heat = firing ? Math.min(1, this.heat + dt / SPRAY.heat.build) : Math.max(0, this.heat - dt / SPRAY.heat.cool);
    this.spreadNow = air ? S.air : moving ? S.moving : S.still;
    return this.spreadNow;
  }

  /** Where the stream leaves from: a steady point before the chest (FLUDD's nozzle sits still on Mario's back), not the bristles' tip,
   *  which sweeps through the hold's pose; the look of the spray is still drawn from the tip (vfx/brushload.js). */
  muzzle(P, out = new THREE.Vector3()) {
    const f = P.lookDir(_b); f.y = 0; if (f.lengthSq() < 1e-4) f.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)); f.normalize();
    return out.set(P.pos.x + f.x * 0.55, P.pos.y + 1.15, P.pos.z + f.z * 0.55);
  }

  /** The aim from `from`: the camera's centre ray, converged on what it meets within 40 m (so the stream lands where the crosshair is). */
  aim(from, out = new THREE.Vector3()) {
    const g = this.game, cam = g.camera;
    if (g.lock?.active) { g.lock.point(_a); return out.copy(_a).sub(from).normalize(); }
    cam.getWorldPosition(_a); cam.getWorldDirection(_b);
    const hit = g.physics?.raycast(_a, _b, 40, g.player?.collider, undefined, (c) => !c.isSensor?.());
    const at = hit ? hit.point : _a.addScaledVector(_b, 40);
    out.set(at.x - from.x, at.y - from.y, at.z - from.z);
    if (out.lengthSq() < 1) out.copy(_b); // (the crosshair on the brush itself: along the view)
    return out.normalize();
  }

  /** A drop's velocity: along `dir`, turned off it by a draw from the cone (biased to the middle while cool), its speed varied a little. */
  launch(dir, rand) {
    const cone = this.spreadNow * DEG, k = 1 + 3 * (1 - this.heat); // (cool: most draws near the centre; hot: the full cone as often)
    const off = cone * Math.pow(rand(), k), around = rand() * Math.PI * 2;
    const side = _a.copy(Math.abs(dir.y) < 0.95 ? UP : _b.set(1, 0, 0)).cross(dir).normalize();
    const v = dir.clone().applyQuaternion(_q.setFromAxisAngle(side, off)).applyAxisAngle(dir, around);
    return v.multiplyScalar(SPRAY.speed * (1 + (rand() - 0.5) * 2 * SPRAY.jitter));
  }

  /** One step of a drop's flight (`drop.travel` its metres flown): straight, then falling. Returns the step's displacement. */
  fly(d, dt, out = new THREE.Vector3()) {
    out.copy(d.v).multiplyScalar(dt);
    d.travel = (d.travel || 0) + out.length();
    if (d.travel > SPRAY.straight) d.v.y -= SPRAY.gravity * dt;
    return out;
  }

  /** A drop's splat where it lands: its radius by the throw, and how far it stretches along a shallow hit (1: round). */
  splat(d, normal) {
    const S = SPRAY.splat, k = Math.min(1, (d.travel || 0) / S.at), r = S.near + (S.far - S.near) * k;
    const graze = 1 - Math.abs(_a.copy(d.v).normalize().dot(normal)); // (0 straight down onto it, near 1 skimming it)
    return { r, stretch: 1 + 1.6 * Math.max(0, graze - 0.3) };
  }

  /** Where the centre of the stream lands from `from` along `dir`: the same flight, stepped (null if it lands on nothing within 3 s). */
  predict(from, dir) {
    const ph = this.game.physics, d = { v: dir.clone().multiplyScalar(SPRAY.speed), travel: 0 }, p = from.clone(), step = new THREE.Vector3();
    for (let i = 0; i < 180; i++) {
      this.fly(d, 1 / 60, step); const len = step.length(); if (len < 1e-5) break;
      const hit = ph?.raycast(p, _b.copy(step).divideScalar(len), len, this.game.player?.collider, undefined, (c) => !c.isSensor?.());
      if (hit) return { point: hit.point.clone(), normal: hit.normal.clone(), dist: d.travel - len + hit.distance };
      p.add(step);
    }
    return null;
  }

  /** The reticle on the ground: shown while the stream is aimed (`on`), the ring the spread's width where it lands. */
  reticle(on, from, dir, color) {
    const m = this.mark;
    const at = on ? this.predict(from, dir) : null;
    m.visible = !!at; if (!at) return;
    m.position.copy(at.point).addScaledVector(at.normal, 0.03);
    m.quaternion.setFromUnitVectors(_a.set(0, 0, 1), at.normal);
    const ringR = Math.max(0.25, Math.tan(this.spreadNow * DEG) * at.dist) + SPRAY.splat.far * 0.5; this.ring.scale.setScalar(ringR);
    if (color != null) { this.dot.material.color.set(color); this.ring.material.color.set(color); }
  }

  dispose() { this.mark.parent?.remove(this.mark); this.dot.geometry.dispose(); this.ring.geometry.dispose(); this.dot.material.dispose(); this.ring.material.dispose(); }
}
