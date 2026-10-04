import * as THREE from 'three';

// ---------------------------------------------------------------------------------------
// GROUND MARKS: what the Courier and the Solar Skiff leave on a soft surface. It writes into a
// TrailMap (the fading path the ground shader shows) and throws a little spray (fx.alpha). It
// knows nothing about sand: a `surface` says what colour the spray is and how much of it there is,
// so snow, ash or a wet floor are one descriptor away.
//
// Prior art: Journey (the trail is part of the sand's ripple layer, not geometry; the wind wipes it
// out), Horizon / AC3 / God of War (trail maps written by feet and bodies), the classic "spray
// behind a jet-ski / speeder": a fan of short-lived particles thrown up and back, more the faster
// you go, with the wide soft wash of the hull under it.
//
//   const marks = new SandMarks(game, trailMap, SAND);
//   marks.update(dt, active)      // every frame; `active` = the ground here is soft
// ---------------------------------------------------------------------------------------
export const SAND = { spray: new THREE.Color(0xf0c890), dust: new THREE.Color(0xe7b98a), footRadius: 0.11, stride: 0.72 };

const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _v = new THREE.Vector3();

export class SandMarks {
  constructor(game, trail, surface = SAND) {
    this.game = game; this.trail = trail; this.surface = surface;
    this.prev = new THREE.Vector3(); this.have = false;
    this.walk = 0; this.side = 1;
    this.wasGrounded = true; this.fall = 0;
    this.acc = 0;
  }

  update(dt, active) {
    const g = this.game, P = g.player, cur = P.renderPos;
    if (!active) { this.have = false; return; }
    if (!this.have || cur.distanceToSquared(this.prev) > 36) { this.prev.copy(cur); this.have = true; this.walk = 0; if (this.trail) this.trail.clear(); return; }
    const surfer = g.techs?.get('surfer');
    const riding = !!surfer?.active;
    const dx = cur.x - this.prev.x, dz = cur.z - this.prev.z, moved = Math.hypot(dx, dz);
    if (riding) this.board(dt, surfer, dx, dz, moved);
    else this.feet(dt, P, dx, dz, moved);
    if (!P.grounded) this.fall = Math.max(this.fall, -P.vel.y);
    this.wasGrounded = P.grounded;
    this.prev.copy(cur);
  }

  // ---- on foot: alternate footprints, a scuff of dust, a long groove in a slide, a crater on landing
  feet(dt, P, dx, dz, moved) {
    const S = this.surface, T = this.trail, fx = this.game.fx;
    if (P.grounded && !this.wasGrounded && this.fall > 3) {
      // landing: a splash of sand and a wide, shallow print
      T.stamp(P.renderPos.x - 0.1, P.renderPos.z, P.renderPos.x + 0.1, P.renderPos.z, 0.5 + Math.min(0.5, this.fall * 0.03), 0.9);
      for (let i = 0; i < 6 + this.fall; i++) this.puff(P.renderPos, 1.4 + Math.random() * this.fall * 0.25, 0.5);
    }
    if (P.grounded) this.fall = 0;
    if (!P.grounded || moved < 1e-4) return;
    const speed = moved / Math.max(dt, 1e-4);
    _f.set(dx, 0, dz).normalize();
    _r.set(-_f.z, 0, _f.x); // (to the right of travel)
    if (P.sliding) {
      T.stamp(this.prev.x, this.prev.z, this.prev.x + dx, this.prev.z + dz, 0.32, 0.9);
      if (Math.random() < dt * 40) this.puff(_p.set(this.prev.x + dx, P.renderPos.y, this.prev.z + dz), 2.2 + speed * 0.15, 0.7, _r.clone().multiplyScalar((Math.random() < 0.5 ? -1 : 1)));
      return;
    }
    this.walk += moved;
    const stride = S.stride * (0.55 + Math.min(1, speed / 8) * 0.45);
    while (this.walk >= stride) {
      this.walk -= stride;
      this.side = -this.side;
      const fxp = this.prev.x + dx - _f.x * this.walk + _r.x * this.side * 0.16, fzp = this.prev.z + dz - _f.z * this.walk + _r.z * this.side * 0.16;
      const l = 0.15 + Math.min(0.1, speed * 0.01); // (a print is longer the faster it is made)
      T.stamp(fxp - _f.x * l, fzp - _f.z * l, fxp + _f.x * l, fzp + _f.z * l, S.footRadius, 1);
      const at = _p.set(fxp, P.renderPos.y, fzp);
      const n = 2 + Math.floor(speed * 0.25);
      for (let i = 0; i < n; i++) this.puff(at, 0.5 + speed * 0.12, 0.35, _f.clone().multiplyScalar(-1));
    }
  }

  // ---- on the Solar Skiff: a soft wash under the hull and a fine score down the middle (the bubbles and the white wake are wake.js)
  board(dt, s, dx, dz, moved) {
    const T = this.trail, P = this.game.player, speed = moved / Math.max(dt, 1e-4);
    if (moved < 1e-4) return;
    this.walk = 0;
    if (!s.air) {
      const k = Math.min(1, speed / 14);
      T.stamp(this.prev.x, this.prev.z, this.prev.x + dx, this.prev.z + dz, 0.85, 0.35 + 0.35 * k);
      T.stamp(this.prev.x, this.prev.z, this.prev.x + dx, this.prev.z + dz, 0.13, 0.95);
    }
  }

  /** One grain-cloud puff: small, tan, drifting, gone in under a second. */
  puff(at, spread, up, dir) {
    const S = this.surface, d = dir || _v.set(0, 0, 0);
    const vel = new THREE.Vector3((Math.random() - 0.5) * spread, up * (0.4 + Math.random()), (Math.random() - 0.5) * spread);
    if (dir) vel.addScaledVector(dir, spread * 0.6);
    this.game.fx.alpha.emit({ pos: at.clone().setY(at.y + 0.05), vel, life: 0.4 + Math.random() * 0.4, size: 0.07, sizeEnd: 0.34, color: S.dust, alpha: 0.45, drag: 2.2, gravity: 4, floor: at.y - 0.02 });
  }
}
