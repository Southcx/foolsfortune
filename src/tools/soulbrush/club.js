// ---------------------------------------------------------------------------------------
// THE CLUB: the Soul Brush as a melee weapon. Where the cutlass is quick and cuts, the brush is heavy and hits: a hammer with a head of
// wet hair. Its blows are slower than a blade's (the same CC0 Universal Animation Library sword clips, played at four fifths of their
// speed, so the weight is in the timing and not in new poses), they BAT what they meet rather than cut it (a clapperjar struck by the
// light blows is sent flying; the third, overhead blow, or a blow on one already in the air, leaves it reeling), and every swing FLICKS slip
// off the bristles in the direction the head was going, which splats where it lands and is wet enough to dive into.
//
//   LMB        a three-blow combo (the third an overhead that strikes the ground)
//   LMB held   after the blow, the brush goes up and back and gathers (Zelda's spin-attack charge): let go to bring it down,
//              the harder the longer it was held. On the ground: a SLAM, a ring that throws what is near (what breaks, breaks where it
//              lands), a pool of slip where it struck. In the air: they go down with it, and it strikes where they land.
//
// Prior art, and what was taken:
//  - Splatoon's Inkbrush and Octobrush: the flick. A swing throws a fan of ink along the swing, the brush's only ranged reach.
//  - Zelda's hold-to-charge (the spin attack, the Megaton Hammer's ground pound) and the ground pound of every platformer since Mario 64:
//    a held button that commits, a slam that answers with a shockwave, and a hit-stop on contact (game.time.pulse) for the weight.
//  - Dark Souls' great hammers: a light string that staggers, a heavy that finishes, a lunge that steps into the blow.
// The head is tested as a fat swept segment (ferrule to point) against breakables, clapperjars and loose pieces, once per blow each.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { hasTag } from '../../core/tags.js';
import { arcAt } from '../viewmodel.js';
import { BRUSH } from './model.js';
import { measureSwing, sweep as sweepArc, magnet } from '../melee.js';
import { stream, randDir } from '../../core/rng.js';
const simRand = stream('tools/soulbrush/club'); // (the simulation's chance: core/rng.js, the same twice)

// clip time (the clip's own seconds): the hit window, the chain window; `rate` slows the clip for the brush's weight
// (when the head can hurt is measured from each clip: melee.js; `hit` here is only when the flick of slip leaves the bristles)
const BLOWS = [
  { clip: 'swordA', dur: 0.43, rate: 0.8, hit: [0.2, 0.3], chain: [0.22, 0.43], rec: 'swordARec', dmg: 1.0, lunge: 2.6, power: 1.4, bat: true },
  { clip: 'swordB', dur: 0.53, rate: 0.8, hit: [0.2, 0.3], chain: [0.24, 0.53], rec: 'swordBRec', dmg: 1.1, lunge: 2.6, power: 1.5, bat: true },
  { clip: 'swordC', dur: 1.3, rate: 0.85, hit: [0.6, 0.7], chain: [], dmg: 1.8, lunge: 4, power: 2.0, bat: false, ground: 0.67, fade: 0.45 },
];
// the slam: Regular_C's overhead, held at the top (the head up behind them, 0.55 s into the clip) and brought down (it crosses in front
// of them at 0.67)
const SLAM = { clip: 'swordC', raised: 0.55, from: 0.56, dur: 1.2, rate: 1.3, strike: 0.67, hold: 0.32, full: 1.1, cost: 4, radius: 2.4, reach: 1.45 };
const REACH = BRUSH.tip - BRUSH.ferrule + 0.45; // (the head is further out than a sword's tip, and some forgiveness)
const DMG = 30, HEAD_R = 0.3; // (a pot takes a few blows: the brush alters things; it is a poor way to break them)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3();

function segDist(a, b, p) {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? THREE.MathUtils.clamp(_c.subVectors(p, a).dot(_d) / l2, 0, 1) : 0;
  return _c.copy(a).addScaledVector(_d, t).distanceTo(p);
}

export class Club {
  constructor(tool) {
    this.tool = tool;
    this.blow = null; this.t = 0; this.n = -1; this.buffer = 0; this.idle = 9;
    this.hit = new Set();
    // (the head's arc through the air on a blow: its look is vfx/library.js 'swing.brush')
    tool.game?.vfx?.swing('swing.brush').follow((a, b) => { const B = this.blow; if (!B || this.t < B.hit[0] - 0.12 || this.t > B.hit[1] + 0.08) return false; this.tool.model.headSegment(a, b); return true; });
    this.charge = -1; // -1: not charging; else seconds held up
    this.slam = null; // { t, power, air, struck }
    this.flicked = false;
    this.tipPrev = new THREE.Vector3(); this.tipVel = new THREE.Vector3(); this.hasPrev = false;
  }
  get game() { return this.tool.game; }
  get P() { return this.tool.P; }
  get busy() { return !!this.blow || this.charge >= 0 || !!this.slam; }
  get playing() { return this.busy || !!this.rec; }

  cancel() { this.blow = null; this.rec = null; this.charge = -1; this.slam = null; this.buffer = 0; }

  aimDir(out) {
    const g = this.game, P = this.P;
    if (g.lock?.active) {
      g.lock.point(_e);
      out.copy(_e).sub(_a.set(P.pos.x, P.pos.y + 0.9, P.pos.z)).setY(0);
      if (out.lengthSq() > 1e-4) return out.normalize();
    }
    return P.lookDir(out).setY(0).normalize();
  }

  // ---------------------------------------------------------------- blows
  start(n) {
    const P = this.P, g = this.game, def = BLOWS[n];
    this.blow = def; this.t = 0; this.tPrev = 0; this.n = n; this.hit.clear(); this.buffer = 0; this.flicked = false; this.held = 0; this.rec = null;
    def.track ??= measureSwing(g.character, def.clip);
    const f = this.aimDir(_a);
    let lunge = def.lunge * (P.grounded ? 1 : 0.4);
    const m = !g.lock?.active && magnet(g, P, f, { range: 4.4, cone: 1.0 }); // (drawn to the best thing in front of them: melee.js)
    if (m) { f.set(m.pos.x - P.pos.x, 0, m.pos.z - P.pos.z).normalize(); lunge = Math.min(lunge, Math.max(0, m.dist - m.r - 1.2) * 3); }
    P.bodyYaw = Math.atan2(f.x, f.z);
    if (g.lock?.active) { g.lock.point(_e); lunge = Math.min(lunge, Math.max(0, _e.distanceTo(P.pos) - 1.5) * 3); }
    P.impulse(_b.copy(f).multiplyScalar(lunge), 'brush');
    sfx.brushSwing?.(n === 2 ? 1.4 : 1);
    g.events?.emit('brush.swing', { n });
  }

  update(dt, inp) {
    const P = this.P;
    this.idle += dt;
    if (this.rec) { const r = this.rec; r.t += dt * (Math.hypot(P.vel.x, P.vel.z) > 2 ? 2.2 : 1); if (r.t >= r.dur) this.rec = null; }
    if (this.slam) return this.slamUpdate(dt);
    if (this.charge >= 0) {
      this.charge += dt;
      this.tool.model.setInk(Math.max(this.tool.model.ink, Math.min(1, this.charge / SLAM.full)));
      if (!inp.isDown('Mouse0')) this.release();
      return;
    }
    if (!this.blow) {
      if (this.idle > 0.9) this.n = -1;
      if (inp.wasPressed('Mouse0') && P.techs.active?.id !== 'swim') this.start((this.n + 1) % BLOWS.length);
      return;
    }
    const b = this.blow;
    this.tPrev = this.t; this.t += dt * b.rate;
    this.held = inp.isDown('Mouse0') ? this.held + dt : -1;
    if (inp.wasPressed('Mouse0')) this.buffer = 0.35;
    this.buffer -= dt;
    if (!this.flicked && this.t >= b.hit[0]) { this.flicked = true; this.flick(1); }
    this.sweep(b);
    if (b.ground && !this.struckGround && this.t >= b.ground) { this.struckGround = true; if (P.grounded) this.strike(0.45, 'bashed'); }
    // held through the blow: it goes up, and gathers
    if (this.held >= SLAM.hold && this.t >= (b.hit[1] + b.dur) / 2 - 0.1) { this.blow = null; this.charge = 0; this.struckGround = false; sfx.brushCharge?.(); return; }
    if (b.chain.length && this.buffer > 0 && this.t >= b.chain[0] && this.t <= b.chain[1]) { this.struckGround = false; this.start(this.n + 1); return; }
    if (this.t >= b.dur) { this.blow = null; this.idle = 0; this.struckGround = false; if (b.rec) this.rec = { clip: b.rec, t: 0, dur: 0.75 }; }
  }

  /** Let go of a charge: it comes down. */
  release() {
    const P = this.P, g = this.game;
    const k = THREE.MathUtils.clamp(this.charge / SLAM.full, 0, 1);
    this.charge = -1;
    if (k < 0.25 || !g.lachryma.spend(SLAM.cost, 'brushslam')) { this.idle = 0; sfx.fizzle?.(); return; }
    const air = !P.grounded;
    const f = this.aimDir(_b); P.bodyYaw = Math.atan2(f.x, f.z); // (it comes down where they are looking, or on what they are locked to)
    this.slam = { t: SLAM.from, power: 0.6 + 0.8 * k, air, struck: false, wait: 0 };
    if (air) { P.vel.y = Math.min(P.vel.y, -16); P.impulse(_a.set(0, -6, 0), 'brush'); }
    this.flicked = false;
    sfx.brushSwing?.(1.8);
    g.events?.emit('brush.swing', { n: 3, slam: true, air });
  }

  slamUpdate(dt) {
    const s = this.slam, P = this.P;
    if (s.air && !s.struck) {
      // (it waits at the moment of striking until they land)
      s.t = Math.min(s.t + dt * SLAM.rate, SLAM.strike - 0.02);
      s.wait += dt;
      if (P.grounded || s.wait > 2.5) { s.t = SLAM.strike; s.struck = true; this.strike(s.power * (1 + Math.min(0.6, s.wait * 0.5)), 'slam', true); }
      return;
    }
    s.t += dt * SLAM.rate;
    if (!this.flicked && s.t >= 0.42) { this.flicked = true; this.flick(1.6); }
    if (!s.struck && s.t >= SLAM.strike) { s.struck = true; this.strike(s.power, 'slam', true); }
    if (s.t >= SLAM.dur) { this.slam = null; this.idle = 0; }
  }

  /** The head strikes the ground: a ring that breaks what is near and throws what is not, and a pool of slip where it hit. */
  strike(power, cause, big = false) {
    const g = this.game, P = this.P, m = this.tool.model;
    m.group.updateMatrixWorld(true);
    m.headWorld(_p);
    // where it strikes: in FRONT of them, at the brush's reach, the way they face. (The overhead clip is a sword's: the brush, longer and
    // held further down, can be anywhere at the frame of the strike, often over their shoulder, so its head only says how far, never where.)
    const fwd = _e.set(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    _p.set(P.pos.x, _p.y, P.pos.z).addScaledVector(fwd, SLAM.reach);
    const down = g.physics.raycast(_a.copy(_p).setY(Math.max(_p.y, P.pos.y) + 0.6), _b.set(0, -1, 0), 2.6, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    const at = down ? down.point.clone() : _p.clone().setY(P.pos.y);
    const R = SLAM.radius * power * (big ? 1 : 0.7);
    // a shove, not a blast: what is near is thrown, and what breaks is broken by where it lands
    const c0 = at.clone().setY(at.y + 0.3), B = g.breakables;
    for (const ent of [...B.items]) {
      if (!ent.alive || ent.def?.trial || ent.def?.hang) continue;
      const t = ent.body.translation();
      if (_a.set(t.x, t.y, t.z).distanceTo(c0) > R) continue;
      B.instigate(ent, 'courier'); B.push(ent.body, c0, R, 7 * power);
    }
    for (const s of [...B.slices, ...B.debris]) if (s.body?.isValid?.()) B.push(s.body, c0, R, 7 * power);
    for (const cl of [...g.clappers.list]) {
      if (!cl.alive) continue;
      const d = cl.pos.distanceTo(c0);
      if (d > R * 1.3) continue;
      g.clappers.knock(cl, cl.pos.clone().sub(c0).setY(0).normalize().multiplyScalar(7 * power * (1 - d / (R * 1.3))).setY(4 + 2 * power));
      if (big && d < R * 0.6) g.clappers.stun(cl, 2.5, g.shells.glowOutline, g.shells.xray);
    }
    g.techs?.get('slam')?.ring(at, R);
    if (down) g.shells?.addPool(down.point, down.normal, true);
    const n = big ? 22 : 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + simRand() * 0.3;
      const v = _c.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(3 + simRand() * 4 * power).setY(2.5 + simRand() * 3);
      g.shells?.addDroplet(at.clone().setY(at.y + 0.2), v.clone(), 0.03 + simRand() * 0.04, true);
    }
    P.shake = Math.max(P.shake, (big ? 0.55 : 0.3) * power);
    P.fovPunch = Math.max(P.fovPunch || 0, big ? 8 : 4);
    g.time.pulse('brushslam', 0.06, big ? 0.09 : 0.05, { release: 0.15 });
    sfx.brushSlam?.(power);
    g.events?.emit('brush.slam', { power: +power.toFixed(2), air: !!this.slam?.air, big });
  }

  /** Slip off the bristles, flung the way the head is moving (Splatoon's flick). */
  flick(k) {
    const g = this.game, m = this.tool.model;
    if (!g.shells) return;
    m.tipWorld(_p);
    const v = this.tipVel.lengthSq() > 4 ? _a.copy(this.tipVel).normalize() : this.P.lookDir(_a);
    const speed = 7 + 3 * k;
    for (let i = 0; i < 6 + 4 * k; i++) {
      const d = _b.copy(v).add(randDir(simRand, _c).multiplyScalar(0.28)).normalize().multiplyScalar(speed * (0.7 + simRand() * 0.5));
      d.y += 2;
      g.shells.addDroplet(_p.clone(), d.clone(), 0.03 + simRand() * 0.035, true);
    }
  }

  /** The head through everything it swept since the last frame (a sector measured from the clip: melee.js), and the loose pieces it
   *  passes through (by its segment: they are small and many). */
  sweep(b) {
    const g = this.game, m = this.tool.model, P = this.P;
    m.group.updateMatrixWorld(true);
    m.headSegment(_a, _b);
    const fallback = this.tipVel.lengthSq() > 1 ? this.tipVel.clone().normalize() : P.lookDir(new THREE.Vector3());
    let struck = 0;
    sweepArc(g, P, P.bodyYaw, b.track, this.tPrev, this.t, {
      reach: REACH, seen: this.hit,
      hit: (kind, ent, at, dir) => {
        struck++;
        if (kind === 'thing') { ent.struck?.(at, dir, b.power, 'courier', 'club'); return; }
        if (kind === 'pot') {
          const amt = DMG * b.dmg;
          if (hasTag(ent, 'breakable') && ent.hp - amt <= 0) g.breakables.shatter(ent, at, dir, b.power, 'bashed', 'courier');
          else {
            g.breakables.damage(ent, amt, at, dir, b.power, false, 'courier');
            if (ent.alive && hasTag(ent, 'pushable')) g.physics.kick(ent.body, dir.clone().setY(Math.max(0.35, dir.y)).multiplyScalar(ent.body.mass() * 4.5 * b.power));
          }
          g.events?.emit('brush.hit', { what: 'pot', n: this.n });
        } else if (kind === 'creature') {
          g.creatures.strike(ent, at, dir, 1.2 * b.power, 'bashed');
          g.events?.emit('brush.hit', { what: ent.kind, n: this.n });
        } else {
          const c = ent;
          if (c.ally) { struck--; return; }
          // a light blow bats it away; the overhead, or a blow on one already flying (a juggle), breaks it
          if (b.bat && c.state !== 'knocked') { g.clappers.knock(c, dir.clone().setY(0).normalize().multiplyScalar(9 * b.power).setY(4.5)); g.events?.emit('brush.hit', { what: 'clapper', n: this.n, bat: true }); }
          else { g.clappers.knock(c, dir.clone().setY(0).normalize().multiplyScalar(11 * b.power).setY(6)); g.clappers.stun(c, 2.5, g.shells.glowOutline, g.shells.xray); g.events?.emit('brush.hit', { what: 'clapper', n: this.n, stun: true }); }
        }
      },
    });
    const dir = fallback;
    // the loose pieces: batted about
    for (const list of [g.breakables.slices, g.breakables.shards]) for (const s of list || []) {
      if (!s.body?.isValid?.() || this.hit.has(s)) continue;
      const t = s.body.translation();
      _p.set(t.x, t.y, t.z);
      if (_p.distanceToSquared(P.pos) > 25 || segDist(_a, _b, _p) > HEAD_R + 0.15) continue;
      this.hit.add(s);
      g.breakables.instigate(s, 'courier');
      g.physics.kick(s.body, dir.clone().setY(Math.max(0.4, dir.y)).multiplyScalar(s.body.mass() * 6 * b.power));
    }
    if (struck) this.impact(b.dmg);
  }

  impact(dmg) {
    const g = this.game, P = this.P;
    sfx.brushHit?.(dmg);
    P.shake = Math.max(P.shake, 0.14 * dmg);
    g.time.pulse('hit', 0.06, 0.045 + 0.035 * dmg, { release: 0.14 });
    this.tool.model.headWorld(_p);
    g.fx.impact(_p.clone(), this.tipVel.clone().normalize().negate(), { color: 0xe8ab86, sparks: 2, dust: 12 });
  }

  /** After the brush is placed for the frame: the head's velocity (for the flick and the hair's lag). */
  afterHands(dt) {
    const m = this.tool.model;
    m.tipWorld(_p);
    if (this.hasPrev && dt > 1e-4) this.tipVel.subVectors(_p, this.tipPrev).divideScalar(dt).clampLength(0, 60);
    else this.tipVel.set(0, 0, 0);
    if (!Number.isFinite(this.tipVel.x + this.tipVel.y + this.tipVel.z)) this.tipVel.set(0, 0, 0);
    this.tipPrev.copy(_p); this.hasPrev = true;
  }

  /** The first-person arc for what is playing: { arc, u } (tools/viewmodel.js). */
  fpArc() {
    if (this.charge >= 0) return { arc: 'raise', u: Math.min(1, this.charge * 4) };
    if (this.slam) return { arc: 'over', u: arcAt(this.slam.t, [0.42, SLAM.strike], SLAM.dur) };
    const b = this.blow;
    if (!b) return null;
    return { arc: ['r2l', 'l2r', 'over'][this.n] || 'r2l', u: arcAt(this.t, b.hit, b.dur) };
  }

  /** The clip layer ({ pose, w }) while a blow, the charge or the slam is playing. */
  pose(C, out) {
    if (this.charge >= 0) {
      // up and back, and a little tremble as it gathers
      C.sample(SLAM.clip, SLAM.raised + Math.sin(this.charge * 30) * 0.004 * Math.min(1, this.charge), out, false);
      return { pose: out, w: 1 };
    }
    if (this.slam) { C.sample(SLAM.clip, this.slam.t, out, false); return { pose: out, w: 1 - THREE.MathUtils.smoothstep(this.slam.t, SLAM.dur - 0.2, SLAM.dur) }; }
    const b = this.blow;
    if (!b) {
      const r = this.rec; // (the combo stopped: the recovery clip brings the brush back, and lets go as they move off)
      if (!r) return null;
      C.sample(r.clip, r.t, out, false);
      return { pose: out, w: 1 - THREE.MathUtils.smoothstep(r.t, r.dur - 0.3, r.dur) };
    }
    C.sample(b.clip, this.t, out, false);
    const w = Math.min(1, this.t / 0.05) * (b.fade ? 1 - THREE.MathUtils.smoothstep(this.t, b.dur - b.fade, b.dur) : 1);
    return { pose: out, w };
  }
}
