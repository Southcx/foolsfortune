import { deflect } from '../parry.js';
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { stream } from '../../core/rng.js';
const simRand = stream('courier/moves/kick'); // (the simulation's chance: core/rng.js, the same twice)

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
    // (the foot's arc, shin to toe, on both legs: the one that kicks is the one that leaves a ribbon. Its look: vfx/library.js 'swing.kick')
    for (const s of ['R', 'L']) this.game.vfx?.swing('swing.kick').follow((a, b) => { const B = this.game.character?.bones; if (this.state !== 'kick' || this.st < WIND - 0.04 || this.st > ACTIVE_TO + 0.04 || !B) return false; B[`shin${s}`].getWorldPosition(a); B[`toe${s}`].getWorldPosition(b); a.lerp(b, 0.45); return true; });
  }

  get engaged() { return this.state === 'kick'; }
  faceYaw() { return this.state === 'kick' ? this.P.yaw : null; }

  fixed(dt) {
    const P = this.P, c = this.cfg, g = this.game;
    this.cool -= dt;
    if (this.state === 'idle') {
      if (!P.peekLatch('KeyV') || this.cool > 0 || P.sliding || P.mantle || P.freeze) return;
      if ((g.belt ? !g.belt.allows('kick') : (g.weapon?.drawT ?? 0) > 0.25) || this.mgr.toolOut) return; // (no kicking with a weapon out: V is the Sondelass's guard, and nothing with the Psygun)
      const carry = this.mgr.get('carry');
      if (carry?.item || carry?.state !== 'idle') return; // (your hands are full)
      if (this.mgr.active && !['balance', 'blink'].includes(this.mgr.active.id)) return;
      P.latch('KeyV');
      this.state = 'kick';
      this.st = 0;
      this.hit.clear();
      this.hitAny = false;
      this.parried = false;
      if (this.w > 0.05 && this.clip) { this.prev = this.clip; this.prevU = this.lastU ?? 0.98; } else this.prev = null; // (a kick while the last one still holds the body: crossfade from where it was)
      this.clip = simRand() < 0.5 ? 'kick_a' : 'kick_b';
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
        g.events?.emit('kick.hit', { hits: n });
      }
    }
  }

  /** A projectile coming in near the strike: send it back where we're looking (the rule is parry.js's, shared with the blade). */
  tryParry() {
    const c = this.cfg;
    const pr = deflect(this.game, { at: this.center(), radius: c.parryRadius, speedMin: c.parrySpeed, outMin: c.parryOut, assist: c.parryAssist, iframes: c.parryIframes, by: 'kick' });
    if (pr) this.parried = true;
  }

  reset() { this.state = 'idle'; this.st = 0; }

  /**
   * The body plays a soccer kick (CMU mocap, retargeted: scripts/cmu_clips.json kick_a / kick_b),
   * its timeline squeezed onto the strike's: the draw back over the wind-up, the swing up to the
   * moment the foot lands, the follow-through and recovery after. After the strike the last frame is held while the
   * kick's weight eases out (the techs' blend: no snap back), a kick begun while the last still holds the body crossfades
   * from where it was over 0.12 s, the clip's pelvis is taken relative to its own first frame (the mocap stands up to a
   * metre forward of the base pose's origin: played as it was, the body lurched forward and back), and the toes keep
   * the base pose (the capture's toes jump up to 50 degrees in a frame). docs/CASEBOOK.md, "The kick's bad loop".
   */
  animate(ch, base) {
    if (this.w < 0.005 || !this.clip) return;
    const C = ch.clips, clip = C.clips[this.clip];
    if (!clip) return;
    const t = this.state === 'kick' ? this.st : DONE;
    const K = [[0, 0.05], [WIND, 0.3], [0.19, 0.5], [ACTIVE_TO, 0.62], [DONE, 0.98]]; // (strike time, clip phase)
    let u = K[K.length - 1][1];
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, b] = [K[i - 1], K[i]]; u = a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); break; }
    this.lastU = u;
    const mask = (this.toeless ||= C.mask({ 'toe*': 0 }, 1));
    const bx = base.p[0], bz = base.p[2];
    const pose = (name, ph) => {
      const c = C.clips[name], P = C.sample(name, ph * c.dur, ch.P.tmp, false);
      const s0 = ((this.root0 ||= {})[name] ||= Array.from(C.sample(name, 0.05 * c.dur, C.pose(), false).p));
      P.p[0] = bx + (P.p[0] - s0[0]); P.p[2] = bz + (P.p[2] - s0[2]); // (the clip's own travel, from where the body stands)
      return P;
    };
    const fade = this.prev && this.state === 'kick' ? Math.max(0, 1 - this.st / 0.12) : 0;
    if (fade > 0 && C.clips[this.prev]) C.blend(base, pose(this.prev, this.prevU), this.w, mask);
    C.blend(base, pose(this.clip, u), this.w * (1 - fade), mask);
  }

  label() { return 'KICK'; }
}
