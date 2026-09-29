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
    this.blendIn = 30;
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
      this.clip = Math.random() < 0.5 ? 'kick_a' : 'kick_b';
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

  /**
   * The body plays a soccer kick (CMU mocap, retargeted: tools/cmu_clips.json kick_a / kick_b),
   * its timeline squeezed onto the strike's: the draw back over the wind-up, the swing up to the
   * moment the foot lands, the follow-through and recovery after.
   */
  animate(ch, base) {
    if (this.w < 0.005 || this.state !== 'kick') return;
    const C = ch.clips, name = this.clip || 'kick_a', clip = C.clips[name];
    if (!clip) return;
    const t = this.st;
    const K = [[0, 0.05], [WIND, 0.3], [0.19, 0.5], [ACTIVE_TO, 0.62], [DONE, 0.98]]; // (strike time, clip phase)
    let u = K[K.length - 1][1];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, b] = [K[i - 1], K[i]]; u = a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); break; }
    C.blend(base, C.sample(name, u * clip.dur, ch.P.tmp, false), this.w);
  }

  label() { return 'KICK'; }
}
