// ---------------------------------------------------------------------------------------
// THE SHOT FIELD: every foe's shot in a crossing, up to 400 in flight (docs/plans/RAIL-OVERHAUL.md sections 4, 5 and 7; the split with
// Petra, 2026-10-08: the shot runtime is Dovina's). It flies what the pattern library fires (progress/rail/patterns.js: the same
// motions, stepped a frame at a time where `positionAt` gives a closed form), in the RAIL'S FRAME (x across, y up, z along), and decides
// what a shot meeting the ship means:
//
//   ASTRAL / UMBRAL   a shot's kind (Ikaruga's polarity as the Astral and Umbral forms): of the ship's own form it is ABSORBED (drunk:
//                     the pool and the surge), of the other it hurts; 'gift' takes the ship's form when fired (the calm's)
//   OUTLINED          wears the parry mark: only the roll answers it, sending it home to its thrower (Sin & Punishment's return)
//   THE ROLL          its window turns any other shot aside (Star Fox 64's barrel roll)
//   MOTIONS           straight, accel, decel (then a ring), split (into a fan), wave, curve, homing (proportional navigation, its turn
//                     capped, a lifetime, then dumb; leading or weaving: the Itano circus), laser (a line that warns, then burns and
//                     sweeps), snake (a laser following a weaving head: its trail is the beam), a warning glint before a dash
//
// The ship it hits is the stage's (courier/ship/ship.js, Petra's), read through a small contract so this file needs nothing else:
//   ship.local (Vector3)  ship.form ('astral' | 'umbral')  ship.turning (bool: the roll's window)  ship.hurtR? (the hurtbox: T.ship.hurt
//   x SHIPS[hull].hurtbox)  ship.vel? (for a leading homer)  ship.hit(s) -> taken?  ship.absorb(s)  ship.turned?(s)  ship.returned?(s)
//
// Drawn as instanced meshes, one draw a kind (astral, umbral, the outline's ring, the warning line, the beam), every instance written
// each frame since the frame moves with the rail (as courier/ship/shots.js does). Looks are placeholders for Calissa (section 8:
// astral bright, white-gold cored; umbral black, a pale rim; the outline Cuphead's pink).
//
// Prior art: every shmup's bullet pool (a fixed array, nothing allocated in the loop), BulletML's actions (accel, changeDirection, fire
// on a timer), proportional navigation (a missile turns at N times the line of sight's rate: the Itano circus's homers), Ikaruga's
// polarity, Star Fox 64's roll, Sin & Punishment's return.
//
//   const F = new ShotField({ rail, cap })   F.build(scene)   F.fire(shot, { from, ship })   (a pattern's shot: patterns.js emit's shape)
//   F.update(dt, { ship, waves })   F.clear()   F.show(on)   F.live   F.peak   F.counts { absorbed, hit, spent (in the mercy), turned, returned }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';

export const CAP = 400;
const LASERS = 16, TRAIL = 18, SHOT_R = 0.3, BEAM_R = 0.45;
const UP = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const v3 = (a, out) => (Array.isArray(a) ? out.set(a[0], a[1], a[2]) : out.copy(a));

/** The side axis of a heading (up x dir), for waves and turns: patterns.js's own. */
function sideOf(dir, out) { out.crossVectors(UP, dir); if (out.lengthSq() < 1e-8) out.set(1, 0, 0); return out.normalize(); }
/** Distance from a point to a segment. */
function segDist(p, a, b) { _c.subVectors(b, a); const l2 = _c.lengthSq(); let t = l2 ? _d.subVectors(p, a).dot(_c) / l2 : 0; t = Math.max(0, Math.min(1, t)); return _d.copy(a).addScaledVector(_c, t).distanceTo(p); }

export class ShotField {
  constructor({ rail, cap = CAP } = {}) {
    this.rail = rail; this.cap = cap;
    this.shots = Array.from({ length: cap }, () => ({ on: false, p: new THREE.Vector3(), dir: new THREE.Vector3(), base: new THREE.Vector3(), los: new THREE.Vector3(),
      trail: new Float32Array(TRAIL * 3), trailN: 0, trailK: 0, trailT: 0 }));
    this.beams = Array.from({ length: LASERS }, () => ({ on: false, o: new THREE.Vector3(), dir: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }));
    this.free = []; for (let i = cap - 1; i >= 0; i--) this.free.push(i);
    this.live = 0; this.peak = 0; this.counts = { absorbed: 0, hit: 0, spent: 0, turned: 0, returned: 0, fired: 0, dropped: 0 };
  }

  // ---------------------------------------------------------------- the looks (placeholders: Calissa's)
  build(scene) {
    const add = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; m.userData.zoneFree = true; m.visible = false; scene.add(m); return m; };
    const ball = new THREE.IcosahedronGeometry(SHOT_R, 1), n = this.cap + LASERS * TRAIL;
    this.astralMesh = add(ball, new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), n);
    this.umbralMesh = add(ball, new THREE.MeshBasicMaterial({ color: 0x120a18 }), n);
    const ring = new THREE.TorusGeometry(SHOT_R * 1.5, 0.06, 4, 12);
    this.outlineMesh = add(ring, new THREE.MeshBasicMaterial({ color: 0xff4fa0 }), this.cap);
    const rod = new THREE.CylinderGeometry(1, 1, 1, 6); rod.rotateX(Math.PI / 2); rod.translate(0, 0, 0.5);
    this.warnMesh = add(rod, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }), LASERS);
    this.beamMesh = add(rod, new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), LASERS);
    this.meshes = [this.astralMesh, this.umbralMesh, this.outlineMesh, this.warnMesh, this.beamMesh];
    return this.meshes;
  }
  show(on) { for (const m of this.meshes || []) m.visible = on; }

  // ---------------------------------------------------------------- firing
  /** One shot of a pattern (patterns.js emit's shape: { pos, dir, speed, kind, outlined, motion, warn }), positions in the rail's frame;
   *  `from` the foe that threw it (where a laser stays anchored, where a returned shot goes home), `ship` to give a gift its form. */
  fire(s, { from = null, ship = null } = {}) {
    this.counts.fired++;
    const m = s.motion || { type: 'straight' };
    if (m.type === 'laser') return this.beam(s, from, ship);
    const i = this.free.pop(); if (i === undefined) { this.counts.dropped++; return null; }
    const x = this.shots[i];
    x.on = true; x.i = i; v3(s.pos, x.p); v3(s.dir, x.dir).normalize(); x.base.copy(x.p); x.speed = s.speed ?? 14; x.s0 = x.speed;
    x.kind = s.kind === 'gift' ? (ship?.form || 'astral') : s.kind || 'astral'; x.outlined = !!s.outlined; x.m = m; x.warn = s.warn || 0;
    x.t = 0; x.from = from; x.back = false; x.turned = false; x.life = m.type === 'homing' ? m.life : 0; x.los.set(0, 0, 0);
    x.trailN = 0; x.trailK = 0; x.trailT = 0;
    this.live++; this.peak = Math.max(this.peak, this.live);
    return x;
  }
  beam(s, from, ship) {
    const b = this.beams.find((q) => !q.on); if (!b) { this.counts.dropped++; return null; }
    const m = s.motion;
    b.on = true; v3(s.pos, b.o); v3(s.dir, b.dir).normalize(); b.from = from; b.t = 0; b.warn = m.warn; b.burn = m.burn; b.reach = m.reach || 60;
    b.a0 = m.from || 0; b.a1 = m.to || 0; b.kind = s.kind === 'gift' ? (ship?.form || 'astral') : s.kind || 'astral'; b.struck = false;
    return b;
  }

  // ---------------------------------------------------------------- the frame
  update(dt, { ship = null, waves = null } = {}) {
    if (dt <= 0) return;
    for (const x of this.shots) if (x.on) this.step(x, dt, ship, waves);
    for (const b of this.beams) if (b.on) this.stepBeam(b, dt, ship);
    this.draw();
  }

  step(x, dt, ship, waves) {
    x.t += dt;
    const m = x.m, t = x.t - x.warn;
    if (t < 0) { if (x.from?.alive) x.p.copy(x.from.local); return; } // (the glint before a dash: it waits where its thrower is)
    switch (m.type) {
      case 'accel': x.speed = Math.min(m.vmax ?? 99, x.speed + (m.a || 0) * dt); break;
      case 'decel': x.speed = Math.max(0, x.s0 * (1 - t / m.T)); if (t >= m.T) { this.spread(x, m.burst, 360, m.childSpeed, true); return this.kill(x); } break;
      case 'split': if (t >= m.T) { this.spread(x, m.m, m.spread, m.childSpeed, false); return this.kill(x); } break;
      case 'curve': if (t > m.delay) x.dir.applyAxisAngle(UP, m.omega * dt); break;
      case 'homing': this.home(x, dt, ship); break;
      default: break;
    }
    if (m.type === 'wave' || m.type === 'snake') {
      x.base.addScaledVector(x.dir, x.speed * dt);
      x.p.copy(x.base).addScaledVector(sideOf(x.dir, _a), m.A * Math.sin(2 * Math.PI * m.f * t + (m.phase || 0)));
      if (m.type === 'snake') this.trail(x, dt);
    } else x.p.addScaledVector(x.dir, x.speed * dt);
    // gone: out of the frame, or flown its time
    if (x.t > 9 || x.p.z < -25 || x.p.z > 220 || Math.abs(x.p.x) > 90 || Math.abs(x.p.y) > 60) return this.kill(x);
    if (x.back) { const f = waves?.hitAt?.(x.p, SHOT_R + 0.2); if (f) { waves.strike(f, f.returned ?? 999, { cause: 'parry', at: x.p, dir: x.dir, returned: true }); this.kill(x); } return; }
    if (!ship || x.turned) return;
    const R = (ship.hurtR ?? T.ship.hurt) + SHOT_R;
    let near = x.p.distanceToSquared(ship.local) < R * R;
    if (!near && m.type === 'snake') near = this.trailHits(x, ship.local, R);
    if (near) this.meet(x, ship);
  }

  /** A shot meeting the ship: drunk, turned, sent home or taken (see the header). */
  meet(x, ship) {
    if (!x.outlined && x.kind === (ship.form || 'astral')) { this.counts.absorbed++; ship.absorb?.(x); return this.kill(x); }
    if (ship.turning) {
      if (x.outlined) { // (the roll's window sends an outlined shot home, faster)
        x.back = true; x.t = 0; x.warn = 0; x.m = { type: 'straight' }; x.speed = Math.max(x.speed * 1.6, 34);
        if (x.from?.alive) x.dir.copy(x.from.local).sub(x.p).normalize(); else x.dir.negate();
        this.counts.returned++; ship.returned?.(x); return;
      }
      x.turned = true; x.dir.set(x.dir.x * -0.4 + (x.p.x - ship.local.x) * 0.3, 0.6, -0.3).normalize(); this.counts.turned++; ship.turned?.(x); return;
    }
    const spent = ship.mercy > 0; // (the mercy after a hit: the shot is spent on the ship, not taken: counted apart)
    if (ship.hit?.(x) !== false) { this.counts[spent ? 'spent' : 'hit']++; this.kill(x); }
  }

  /** Proportional navigation: turn at N times the line of sight's rate (pure pursuit while it is off by more than 60 degrees), never
   *  faster than `turn`; leading aims where the ship will be; weaving swings across; past its lifetime it flies dumb. */
  home(x, dt, ship) {
    const m = x.m;
    if (!ship || x.life <= 0) return;
    x.life -= dt;
    _a.copy(ship.local); if (m.lead && ship.vel) _a.addScaledVector(ship.vel, x.p.distanceTo(ship.local) / Math.max(1, x.speed));
    _a.sub(x.p); const dist = _a.length(); if (dist < 1e-3) return; _a.divideScalar(dist); // (the line of sight)
    let want;
    const off = Math.acos(Math.max(-1, Math.min(1, x.dir.dot(_a))));
    if (x.los.lengthSq() === 0 || off > Math.PI / 3) want = _b.copy(_a); // (pure pursuit to bring it round)
    else { _c.subVectors(_a, x.los).divideScalar(dt); want = _b.copy(x.dir).addScaledVector(_c, (m.N || 3) * dt).normalize(); } // (PN)
    if (m.wobble) want.addScaledVector(sideOf(x.dir, _c), Math.sin(x.t * 7) * m.wobble * 0.1).normalize();
    x.los.copy(_a);
    const ang = Math.acos(Math.max(-1, Math.min(1, x.dir.dot(want)))), max = m.turn * dt;
    if (ang <= max) x.dir.copy(want);
    else { _c.crossVectors(x.dir, want); if (_c.lengthSq() < 1e-10) _c.copy(UP); x.dir.applyAxisAngle(_c.normalize(), max); }
  }

  /** A shell's children: a ring (decel) or a fan about its heading (split), each a plain shot of its kind. */
  spread(x, n, arc, speed, ring) {
    sideOf(x.dir, _a);
    for (let i = 0; i < n; i++) {
      const deg = ring ? 360 * i / n : (n > 1 ? -arc / 2 + arc * i / (n - 1) : 0), r = deg * Math.PI / 180;
      _w.copy(x.dir).multiplyScalar(Math.cos(r)).addScaledVector(_a, Math.sin(r));
      this.fire({ pos: x.p, dir: _w, speed, kind: x.kind, outlined: x.outlined, motion: { type: 'straight' } }, { from: x.from });
    }
  }

  /** A snake's trail: its head's last places, every so often, which the beam is drawn along and which hurt. */
  trail(x, dt) {
    x.trailT -= dt; if (x.trailT > 0) return;
    x.trailT = (x.m.length || 14) / Math.max(1, x.speed) / TRAIL;
    x.trail.set([x.p.x, x.p.y, x.p.z], x.trailK * 3); x.trailK = (x.trailK + 1) % TRAIL; x.trailN = Math.min(TRAIL, x.trailN + 1);
  }
  trailHits(x, at, R) {
    for (let k = 0; k < x.trailN; k++) { const j = k * 3; if (_a.set(x.trail[j], x.trail[j + 1], x.trail[j + 2]).distanceToSquared(at) < R * R) return true; }
    return false;
  }

  /** A laser: anchored at its thrower, a warning line for `warn`, then a beam for `burn` sweeping from its first angle to its last
   *  (about up, slower than the ship can run: patterns.js's sweepBeam); a beam of the ship's form is drunk, not felt. */
  stepBeam(b, dt, ship) {
    b.t += dt;
    if (b.from?.alive) b.o.copy(b.from.local);
    const k = b.t <= b.warn ? 0 : Math.min(1, (b.t - b.warn) / Math.max(0.01, b.burn));
    _a.copy(b.dir).applyAxisAngle(UP, b.a0 + (b.a1 - b.a0) * k);
    b.a.copy(b.o); b.b.copy(b.o).addScaledVector(_a, b.reach);
    if (b.t > b.warn + b.burn) { b.on = false; return; }
    if (b.t <= b.warn || !ship || b.struck) return;
    if (segDist(ship.local, b.a, b.b) < (ship.hurtR ?? T.ship.hurt) + BEAM_R) {
      if (b.kind === (ship.form || 'astral')) { this.counts.absorbed++; ship.absorb?.(b); b.struck = true; return; }
      if (ship.turning) return; // (the roll carries you through)
      const spent = ship.mercy > 0;
      if (ship.hit?.(b) !== false) { this.counts[spent ? 'spent' : 'hit']++; b.struck = true; } // (a beam hurts once: the ship's mercy does the rest)
    }
  }

  kill(x) { if (!x.on) return; x.on = false; x.from = null; this.free.push(x.i); this.live--; }
  clear() { for (const x of this.shots) this.kill(x); for (const b of this.beams) b.on = false; this.draw(); }

  // ---------------------------------------------------------------- drawing
  draw() {
    if (!this.astralMesh || !this.rail) return;
    const R = this.rail, A = this.astralMesh, U = this.umbralMesh, O = this.outlineMesh;
    let na = 0, nu = 0, no = 0;
    const put = (mesh, k, p, dir, scale) => {
      R.toWorld(p, _w); R.dirWorld(dir, _d); _q.setFromUnitVectors(Z, _d.lengthSq() > 1e-8 ? _d.normalize() : Z);
      _m.compose(_w, _q, _s.setScalar(scale)); mesh.setMatrixAt(k, _m);
    };
    for (const x of this.shots) {
      if (!x.on) continue;
      const mesh = x.kind === 'umbral' ? U : A, k = x.kind === 'umbral' ? nu++ : na++;
      put(mesh, k, x.p, x.dir, x.t < x.warn ? 1.6 : 1); // (a glint swells before it dashes)
      if (x.outlined && !x.back) put(O, no++, x.p, x.dir, 1);
      if (x.m.type === 'snake') for (let j = 0; j < x.trailN; j++) { const q = j * 3; _b.set(x.trail[q], x.trail[q + 1], x.trail[q + 2]); put(mesh, x.kind === 'umbral' ? nu++ : na++, _b, x.dir, 0.8); }
    }
    let nw = 0, nb = 0;
    for (const b of this.beams) {
      if (!b.on) continue;
      const hot = b.t > b.warn, mesh = hot ? this.beamMesh : this.warnMesh;
      R.toWorld(b.a, _w); R.toWorld(b.b, _c); _d.subVectors(_c, _w); const len = _d.length();
      _q.setFromUnitVectors(Z, _d.divideScalar(len || 1)); const r = hot ? BEAM_R : 0.06;
      _m.compose(_w, _q, _s.set(r, r, len)); mesh.setMatrixAt(hot ? nb++ : nw++, _m);
    }
    for (const [mesh, n] of [[A, na], [U, nu], [O, no], [this.warnMesh, nw], [this.beamMesh, nb]]) { mesh.count = n; mesh.instanceMatrix.needsUpdate = true; }
  }
}
