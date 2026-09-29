import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../audio.js';

// Kick (a Movement Art) and parry. V is a kick: a quick
// strike with the leg, forward, that knocks pots over (and cracks them), sends crates and
// clapperjars flying, and rings targets. The first moments of it are also a parry: kick a
// projectile that's coming at you and it goes back the way you're looking, faster, and you
// are untouchable for a beat (`player.invuln`, ready for when there's damage to avoid).
const UP = new THREE.Vector3(0, 1, 0);
const WIND = 0.09, PARRY_TO = 0.26, ACTIVE_TO = 0.3, DONE = 0.5;
const sm = (u) => u * u * (3 - 2 * u);

export class Kick extends Tech {
  constructor(mgr) {
    super(mgr, 'kick');
    this.passive = true;
    this.state = 'idle';
    this.st = 0;
    this.hit = new Set();
    this.cool = 0;
  }

  get engaged() { return this.state === 'kick'; }
  faceYaw() { return this.state === 'kick' ? this.P.yaw : null; }

  fixed(dt) {
    const P = this.P, c = this.cfg, g = this.game;
    this.cool -= dt;
    if (this.state === 'idle') {
      if (!P.peekLatch('KeyV') || this.cool > 0 || P.sliding || P.mantle || P.freeze) return;
      const carry = this.mgr.get('carry');
      if (carry?.item || carry?.state !== 'idle') return; // (your hands are full)
      if (this.mgr.active && !['balance', 'blink'].includes(this.mgr.active.id)) return;
      P.latch('KeyV');
      this.state = 'kick';
      this.st = 0;
      this.hit.clear();
      this.hitAny = false;
      this.parried = false;
      this.fwd = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw));
      sfx.whoosh();
      g.events?.emit('kick.swing', {});
      return;
    }
    this.st += dt;
    if (this.st >= WIND && this.st <= ACTIVE_TO) {
      if (this.st <= PARRY_TO && !this.parried) this.tryParry();
      this.strike();
    }
    if (this.st >= DONE) { this.state = 'idle'; this.cool = c.cooldown; }
  }

  /** Where the foot lands: ahead of the hips and about waist high. */
  center() {
    const P = this.P;
    return new THREE.Vector3(P.pos.x, P.pos.y + 0.75, P.pos.z).addScaledVector(this.fwd, 0.85);
  }

  strike() {
    const P = this.P, c = this.cfg, g = this.game;
    const at = this.center();
    const R = c.radius;
    const dir = P.lookDir(new THREE.Vector3()).setY(0).normalize();
    if (dir.lengthSq() < 0.01) dir.copy(this.fwd);
    const near = (t, pad = 0) => Math.hypot(t.x - at.x, (t.y - at.y) * 0.8, t.z - at.z) < R + pad;
    let n = 0;
    const shove = (body, mass, kind) => {
      const k = Math.min(mass * c.launch, kind === 'heavy' ? c.heavyCap : 1e9);
      g.physics.kick(body, dir.clone().multiplyScalar(k).addScaledVector(UP, Math.min(mass * 2.2, k * 0.5)), body.translation());
    };
    for (const e of g.breakables?.items || []) {
      if (!e.alive || this.hit.has(e) || !e.body?.isDynamic?.() || e.carried) continue;
      const t = e.body.translation();
      if (!near(t, (e.size || 0.3) * 0.35)) continue;
      this.hit.add(e); n++;
      const p = new THREE.Vector3(t.x, t.y, t.z);
      g.breakables.damage(e, c.damage, p, dir, 1.2);
      if (e.alive) shove(e.body, e.body.mass());
    }
    for (const e of g.level?.dynamic || []) {
      if (this.hit.has(e) || !e.body?.isDynamic?.() || e.carried || !e.body.isValid()) continue;
      const t = e.body.translation();
      if (!near(t, (e.size || 0.5) * 0.5)) continue;
      this.hit.add(e); n++;
      shove(e.body, e.body.mass(), e.carry);
    }
    for (const cl of g.clappers?.list || []) {
      if (!cl.alive || this.hit.has(cl)) continue;
      if (!near(cl.pos, 0.2)) continue;
      this.hit.add(cl); n++;
      g.clappers.knock(cl, dir.clone().multiplyScalar(c.knock).setY(3));
    }
    if (g.movers?.hitTargetsNear(new THREE.Vector3(at.x, at.y - 0.4, at.z), R, { cause: 'kick' })) n++;
    if (n) {
      if (!this.hitAny) {
        this.hitAny = true;
        P.shake = Math.max(P.shake, 0.12);
        sfx.thunk?.(1, 3);
        g.events?.emit('kick', { hits: n });
      }
    }
  }

  /** A projectile coming in near the strike: send it back where we're looking. */
  tryParry() {
    const P = this.P, c = this.cfg, g = this.game;
    const at = this.center();
    for (const pr of g.projectiles || []) {
      const b = pr.body;
      if (!b?.isValid?.() || pr.parried) continue;
      const t = b.translation(), v = b.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      if (sp < c.parrySpeed) continue;
      const d = Math.hypot(t.x - at.x, t.y - at.y, t.z - at.z);
      if (d > c.parryRadius) continue;
      // (coming toward us)
      if ((v.x * (P.pos.x - t.x) + v.z * (P.pos.z - t.z)) <= 0) continue;
      const out = P.lookDir(new THREE.Vector3());
      const speed = Math.max(sp * 1.25, c.parryOut);
      let v2 = out.clone().multiplyScalar(speed);
      // (a little help: a target close to where you're looking gets the ball, dropping with gravity taken into account)
      const from = new THREE.Vector3(t.x, t.y, t.z);
      let bestA = c.parryAssist;
      for (const m of g.movers?.list || []) {
        if (!m.target) continue;
        const to = m.cur.p.clone().sub(from), d = to.length();
        const a = Math.acos(THREE.MathUtils.clamp(to.clone().normalize().dot(out), -1, 1));
        if (a < bestA) { bestA = a; const flight = d / speed; v2 = to.divideScalar(flight); v2.y += 0.5 * 9.81 * flight; }
      }
      b.setLinvel(v2, true);
      pr.parried = true;
      pr.reflected = true;
      this.parried = true;
      P.invuln = Math.max(P.invuln, c.parryIframes);
      P.shake = Math.max(P.shake, 0.3);
      P.fovPunch = Math.max(P.fovPunch || 0, 5);
      g.fx?.shockwave?.(new THREE.Vector3(t.x, t.y, t.z), 1.4);
      g.hud?.popup('PARRY');
      sfx.parry();
      g.events?.emit('parry', { speed: sp });
      return;
    }
  }

  reset() { this.state = 'idle'; this.st = 0; }

  // ---- pose: the right leg through a kick (over whatever the body is doing) ----
  hands(ch) {
    if (this.w < 0.02 || this.state !== 'kick') return;
    const P = this.P, w = this.w, t = this.st;
    const leg = ch.leg.R;
    let k;
    if (t < WIND) k = sm(t / WIND) * -0.35; // draw the knee up and back
    else if (t < ACTIVE_TO) k = -0.35 + 1.35 * sm((t - WIND) / (ACTIVE_TO - WIND - 0.1));
    else k = 1 - sm(Math.min(1, (t - ACTIVE_TO) / (DONE - ACTIVE_TO)));
    k = THREE.MathUtils.clamp(k, -0.4, 1);
    const fwd = new THREE.Vector3(Math.sin(P.bodyYaw), 0, Math.cos(P.bodyYaw));
    const rest = leg.foot.getWorldPosition(new THREE.Vector3());
    const hip = leg.thigh.getWorldPosition(new THREE.Vector3());
    const target = hip.clone().addScaledVector(fwd, 0.95 * k).add(new THREE.Vector3(0, -0.95 + 0.85 * Math.max(0, k) + 0.35 * Math.max(0, -k), 0));
    target.lerp(rest, 1 - w);
    const pole = hip.clone().addScaledVector(fwd, 0.9).add(new THREE.Vector3(0, 0.3, 0));
    ch.solveLeg(leg, target, pole);
  }

  label() { return 'KICK'; }
}
