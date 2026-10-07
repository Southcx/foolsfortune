// ---------------------------------------------------------------------------------------
// THE PLANETOID BODY: a small body on small worlds (docs/plans/SPIRIT-GARDEN.md section 1 and 3; the owner: "SMG from the get-go"). Gravity
// pulls toward the heart of the nearest planetoid (Super Mario Galaxy's spherical gravity: the nearest surface wins, so a body thrown
// between two is caught by the one it comes closer to); it stands on a sphere's surface, hops along it, and is up where the ground is.
// The Pneuka Jar in the garden is one (world/garden/realm.js drives it from WASD), and so is every spirit there (a wander drives
// it). It is not the Courier's controller: the core movement takes world +Y as up and is never touched (the gold standard).
//
// Its feel: a hop a step (a Chao's waddle, Katamari's bounce): the longer a direction is held, the longer each hop, up to `long`;
// Space a high jump; in the air a little steering. A hand may hold it (`held`) and let it go with a velocity (a throw), and a launch
// lotus flies it on an authored arc (`launch`).
//
// Prior art: Super Mario Galaxy (spherical gravity, the planetoid you are nearest owns you, the launch star's authored flight), Sonic's
// Chao (the hop), Katamari Damacy's small world.
//
//   const H = new PlanetBody({ planets: [{ c: Vector3, r }], pos, radius, hop })   H.step(dt, { move: Vector3 (world, length 0..1), jump })
//   H.pos  H.vel  H.up  H.planet  H.grounded  H.forward  H.held  H.flight   H.launch(to, seconds, toPlanet)   H.release(vel)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const GRAVITY = 20; // (m/s²: twice the Courier's world, so a small world's hop lands quickly: Galaxy's floatiness is in the hop, not the fall)
const HOP = { short: [3.0, 2.6], long: [4.4, 4.6], growth: 0.7, every: 0.06, jump: 8.5, air: 7, friction: 10 }; // ([up, along] m/s; the hop grows to long over `growth` s held)
const _n = new THREE.Vector3(), _t = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class PlanetBody {
  constructor({ planets, pos, radius = 0.45, hop = {} }) {
    this.planets = planets; this.radius = radius; this.hop = { ...HOP, ...hop };
    this.pos = pos.clone(); this.vel = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0); this.forward = new THREE.Vector3(0, 0, 1);
    this.planet = this.nearest(this.pos); this.grounded = false; this.held = false; this.flight = null;
    this.heldFor = 0; this.wait = 0; this.hops = 0;
  }

  /** The planetoid that owns a point: the one whose surface is nearest. */
  nearest(p) {
    let best = this.planets[0], bd = Infinity;
    for (const P of this.planets) { const d = p.distanceTo(P.c) - P.r; if (d < bd) { bd = d; best = P; } }
    return best;
  }
  /** The surface point of a planet under a direction from its heart. */
  surface(P, dir, lift = 0) { return P.c.clone().addScaledVector(dir.clone().normalize(), P.r + this.radius + lift); }

  /** Flown by a launch lotus: from where it is to `to` in `seconds`, over an arc, landing owned by `toPlanet`. */
  launch(to, seconds = 2, toPlanet = null) {
    const from = this.pos.clone(), mid = from.clone().lerp(to, 0.5), up = this.up.clone().add(toPlanet ? to.clone().sub(toPlanet.c).normalize() : this.up).normalize();
    this.flight = { from, to: to.clone(), ctrl: mid.addScaledVector(up, from.distanceTo(to) * 0.45), t: 0, seconds, planet: toPlanet };
    this.grounded = false; this.vel.set(0, 0, 0);
  }
  /** Let go by a hand: it flies with `vel`, and gravity takes it again. */
  release(vel) { this.held = false; this.vel.copy(vel); this.grounded = false; }

  step(dt, { move = null, jump = false } = {}) {
    if (this.held) return;
    const F = this.flight;
    if (F) { // (a lotus's flight: a quadratic arc, eased, the body turning to its landing's up)
      F.t = Math.min(1, F.t + dt / F.seconds);
      const k = F.t * F.t * (3 - 2 * F.t), u = 1 - k;
      this.pos.set(0, 0, 0).addScaledVector(F.from, u * u).addScaledVector(F.ctrl, 2 * u * k).addScaledVector(F.to, k * k);
      if (F.planet) this.up.lerp(_n.copy(this.pos).sub(F.planet.c).normalize(), Math.min(1, dt * 4)).normalize();
      if (F.t >= 1) { this.flight = null; if (F.planet) this.planet = F.planet; this.grounded = true; this.wait = 0.15; }
      return;
    }
    const H = this.hop, P = this.planet = this.nearest(this.pos);
    _n.copy(this.pos).sub(P.c); const d = _n.length(); _n.divideScalar(d || 1);
    this.up.lerp(_n, Math.min(1, dt * 10)).normalize();
    // the wish along the ground (tangent to the sphere under it)
    const want = move ? _t.copy(move).addScaledVector(_n, -move.dot(_n)) : _t.set(0, 0, 0);
    const wl = Math.min(1, want.length());
    if (wl > 0.05) { this.forward.copy(want).normalize(); this.heldFor += dt; } else this.heldFor = 0;
    if (this.grounded) {
      this.wait -= dt;
      if (jump) { this.vel.copy(_n).multiplyScalar(H.jump).addScaledVector(this.forward, wl * H.short[1]); this.grounded = false; this.hops++; }
      else if (wl > 0.05 && this.wait <= 0) { // (a hop a step, longer the longer it is held)
        const k = Math.min(1, this.heldFor / H.growth), up = THREE.MathUtils.lerp(H.short[0], H.long[0], k), along = THREE.MathUtils.lerp(H.short[1], H.long[1], k) * wl;
        this.vel.copy(_n).multiplyScalar(up).addScaledVector(this.forward, along); this.grounded = false; this.hops++;
      } else this.vel.multiplyScalar(Math.max(0, 1 - H.friction * dt)); // (standing: it settles)
    } else if (wl > 0.05) this.vel.addScaledVector(this.forward, H.air * wl * dt); // (a little steering in the air)
    // gravity toward the heart of the planetoid that owns it
    this.vel.addScaledVector(_n, -GRAVITY * dt);
    this.pos.addScaledVector(this.vel, dt);
    // the ground: every planetoid is solid (a throw can land on any of them)
    for (const Q of this.planets) {
      _a.copy(this.pos).sub(Q.c); const dq = _a.length(), min = Q.r + this.radius;
      if (dq >= min) continue;
      _a.divideScalar(dq || 1);
      this.pos.copy(Q.c).addScaledVector(_a, min);
      const vn = this.vel.dot(_a);
      if (vn < 0) this.vel.addScaledVector(_a, -vn);
      if (Q === P) { if (!this.grounded) this.wait = H.every; this.grounded = true; this.vel.addScaledVector(_b.copy(_a), -this.vel.dot(_a)); }
    }
    if (this.grounded && this.pos.distanceTo(P.c) > P.r + this.radius + 0.08) this.grounded = false; // (left the ground: over a rim)
  }
}
