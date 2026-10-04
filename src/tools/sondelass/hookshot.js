// ---------------------------------------------------------------------------------------
// THE HOOK: the Sondelass's grapnel and the line it trails. Fired along the camera's aim; it flies fast, trailing a rope that leaves the
// tool coiled and uncoils along the flight (a helix that opens out and straightens, the way a rope pays out of a harpoon gun), and what
// it bites decides what the line is for:
//
//   something solid    an ANCHOR. The line stays, taut, and the Courier is a weight on it (tools/sondelass/grapple.js is their side: reel,
//                      hang, swing, let go).
//   something loose    a CATCH. A pot, a crate, a clapperjar: the line stays, and holding LMB reels it toward their hand: the lighter
//                      end of the rope is the one that moves, so anything under 60 kg comes to them and anything heavier is an anchor.
//                      It is brought to a point in front of their chest and held there while LMB is held, and let go with a fling in
//                      the direction the aim was sweeping (tap RMB).
//   nothing            the line is drawn back.
//
//   LMB fire (while nothing is out) · hold LMB reel · hold RMB pay out · tap RMB let go · Space (in the air) jump off
//
// The rope is a real one (vfx/rope.js): a chain that hangs with slack and pulls straight when loaded, glowing amber with its load.
// It costs a little Lachryma to throw and a little to reel. The grapnel is drawn large (2.4x the one on the tool) with a light on it
// and a ribbon behind it, because it has to be seen at 40 m.
//
// Prior art: Zelda's Hookshot (a fast straight-flying hook whose target decides the outcome), Worms' Ninja Rope (the rope's length is
// the control), Just Cause and Spider-Man (the swing), Half-Life 2's gravity gun and Zelda's Ultrahand (a loose thing brought to a
// point in front of you, held, and let go with the motion of your aim).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GROUPS, G, groups } from '../../core/physics.js';
const HOOKABLE = groups(0xffff, G.STATIC | G.PROP | G.CRITTER); // (what the grapnel can bite: the world, the loose things, the creatures)
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { FishingLine } from './angling/line.js';

const RANGE = 40, SPEED = 90, COST = 2, GRAP = 2.4, HEAVY = 60, CHEST = 0.9;
const AMBER = 0xffb27a, LOAD = 0xff8a4a; // (the grapnel's glow, and the colour its rope takes on under load)
const UP = new THREE.Vector3(0, 1, 0);
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

export class Hookshot {
  constructor(tool) {
    this.tool = tool;
    const g = tool.game;
    this.flying = false; this.phase = 'idle'; // out | held | back
    this.aimBlend = 0;
    this.aimDir = new THREE.Vector3(0, 0, 1);
    this.cool = 0;
    // the grapnel: the tool's own, drawn large, with a light on it
    this.grap = tool.model.hook.clone(true);
    this.grap.visible = false;
    this.grap.scale.setScalar(GRAP);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: g.fx.haloTexture, color: AMBER, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glow.scale.setScalar(0.2); glow.position.x = 0.05;
    this.grap.add(glow); this.glow = glow;
    g.scene.add(this.grap);
    this.line = new FishingLine(g.scene, { radius: 0.018, color: 0xd9b98a, n: 76 });
    this.pos = new THREE.Vector3(); this.target = new THREE.Vector3(); this.result = null;
    // what the line is fast to
    this.att = null; // { mode: 'anchor' | 'pull', point, normal, ent, body, local }
    this.L = 0; this.reelV = 0; this.reeling = false; this.paying = false; this.rT = 0; this.rWas = false;
    this.latchT = 9; this.spin = 0; this.blocked = 0; this.losT = 0;
    this.destPrev = new THREE.Vector3(); this.destVel = new THREE.Vector3(); this.hold = false; this.travel = 0;
  }
  get game() { return this.tool.game; }
  get busy() { return this.flying || !!this.att; }
  get aiming() { return this.aimBlend > 0.05 || this.flying || !!this.att; }

  cancel() {
    if (this.att) this.release('stow');
    this.flying = false; this.phase = 'idle'; this.grap.visible = false; this.line.hide(); this.aimBlend = 0;
  }

  /** The Courier's chest: the point the line pulls. */
  chest(out) { const P = this.tool.P; return out.set(P.pos.x, P.pos.y + CHEST, P.pos.z); }

  // ---------------------------------------------------------------- aim and fire
  /** What a throw along the aim would hit: { point, normal, kind, ent, body } or null (the affordance for the chevron, and fire's own ray). */
  probe() {
    const g = this.game, P = this.tool.P;
    g.camera.getWorldPosition(_o);
    P.lookDir(_d);
    const hit = g.physics.raycast(_o, _d, RANGE, P.collider, HOOKABLE, (c) => !c.isSensor());
    if (!hit) return null;
    const ent = hit.entity, body = hit.collider.parent();
    const dyn = !!body?.isDynamic?.();
    const catchable = dyn && (ent?.type === 'clapper' || ent?.type === 'breakable' || ent?.type === 'slice' || ent?.type === 'shard' || !ent || !!ent.carry || ent?.type === 'prop');
    let kind = 'anchor';
    if (ent?.type === 'clapper') kind = 'pull';
    else if (ent?.type === 'creature' && ent.alive) kind = ent.heavy ? 'anchor' : 'pull'; // (a creature on the line: dragged to them)
    else if (catchable) kind = (body.mass?.() ?? 1) <= HEAVY ? 'pull' : 'anchor';
    return { point: hit.point.clone(), normal: hit.normal.clone(), ent, body, kind };
  }

  update(dt, inp) {
    const P = this.tool.P, g = this.game;
    this.cool -= dt;
    P.lookDir(_d);
    // RMB: hold the arm out on the aim (with a line out, on the anchor)
    const aim = inp.isDown('Mouse2') || this.flying || !!this.att;
    this.aimBlend = THREE.MathUtils.damp(this.aimBlend, aim ? 1 : 0, 14, dt);
    if (this.att) {
      g.character.shoulder('R', _s);
      this.aimDir.copy(this.att.point).sub(_s).normalize();
    } else this.aimDir.copy(_d);
    if (aim && !this.att) P.bodyYaw = P.yaw;
    if (inp.wasPressed('Mouse0') && !this.flying && !this.att && this.cool <= 0) this.fire();
  }

  fire() {
    const g = this.game;
    if (!g.lachryma.spend(COST, 'hook')) return;
    this.tool.model.group.updateMatrixWorld(true);
    this.tool.tip(this.pos);
    const r = this.probe();
    this.result = r;
    if (r) this.target.copy(r.point);
    else { g.camera.getWorldPosition(_o); this.tool.P.lookDir(_d); this.target.copy(_o).addScaledVector(_d, RANGE); }
    this.flying = true; this.phase = 'out'; this.t = 0;
    this.grap.visible = true; this.grap.scale.setScalar(GRAP);
    this.line.rope.reset(this.pos, this.pos);
    this.hangSlack = 0;
    sfx.hookFire();
    g.events?.emit('hook.fire', { hit: !!r, kind: r?.kind || 'miss' });
  }

  // ---------------------------------------------------------------- flight and drawing (every frame)
  tickFlight(dt) {
    const g = this.game, P = this.tool.P, cam = g.camera;
    if (!this.flying) return;
    this.t += dt; this.latchT += dt;
    this.tool.model.group.updateMatrixWorld(true);
    this.tool.tip(_t);
    let helix = 0, taut = 0.2, endPt = this.pos;
    if (this.phase === 'out') {
      _d.copy(this.target).sub(this.pos);
      const d = _d.length(), step = SPEED * dt;
      if (d <= step) { this.pos.copy(this.target); this.arrive(); }
      else this.pos.addScaledVector(_d.multiplyScalar(1 / d), step);
      const total = this.tool.tip(_e).distanceTo(this.target) || 1;
      helix = Math.min(1, 0.4 + this.pos.distanceTo(_t) / Math.max(4, total) * 0.8) * (this.phase === 'out' ? 1 : 0);
      taut = 0.7;
      this.spin += dt * 28;
    } else if (this.phase === 'back') {
      _d.copy(_t).sub(this.pos);
      const d = _d.length(), step = SPEED * 1.5 * dt;
      if (d <= step + 0.3) { this.flying = false; this.phase = 'idle'; this.grap.visible = false; this.line.hide(); this.cool = 0.15; return; }
      this.pos.addScaledVector(_d.multiplyScalar(1 / d), step);
      taut = 0.2; this.spin += dt * 14;
    }
    if (this.phase === 'held' && this.att) this.drawHeld(dt, _t);
    else {
      // the grapnel: pointing the way it goes, spinning on its axis
      _d.copy(this.pos).sub(_t);
      if (_d.lengthSq() > 1e-6) this.grap.quaternion.setFromUnitVectors(_e.set(1, 0, 0), _d.normalize());
      if (this.phase === 'out') this.grap.rotateX(this.spin);
      this.grap.position.copy(this.pos); this.grap.updateMatrixWorld(true);
      this.line.set(_t, this.pos, { tension: taut, aspect: LOAD, helix, cam: cam.position, dt, time: performance.now() / 1000 });
    }
    this.glow.material.opacity = Math.min(1, this.pos.distanceTo(_t) / 6) * (0.55 + 0.35 * Math.max(0, 1 - this.latchT * 3));
    void P;
  }

  /** The line with something on the end of it: from the tool's tip to the anchor, slack or loaded. */
  drawHeld(dt, tip) {
    const g = this.game, a = this.att, cam = g.camera, P = this.tool.P;
    const end = this.attachPoint(_e);
    // the grapnel sits in what it bit, biting deeper for a moment
    _d.copy(end).sub(tip).normalize();
    this.grap.quaternion.setFromUnitVectors(_c.set(1, 0, 0), _d);
    this.grap.position.copy(end);
    const bite = 1 + 0.35 * Math.max(0, 1 - this.latchT * 6);
    this.grap.scale.setScalar(GRAP * bite);
    this.grap.updateMatrixWorld(true);
    // how much line there is beyond the straight, and what it is carrying
    const dist = tip.distanceTo(end);
    let slack = Math.max(0, (this.L - CHEST) - dist);
    let taut = THREE.MathUtils.clamp(1 - slack / (0.35 + dist * 0.04), 0, 1);
    let load = a.mode === 'pull' ? (this.reeling ? 0.9 : 0.35) : Math.min(1, P.vel.length() / 14 + (this.reeling ? 0.5 : 0));
    // their weight on it (hanging, swinging, reeling, or walked to the end of it): the line is straight and loaded, and there is no spare
    // line beyond the straight: what was paid out past the bite is taken in the moment it bites (the reel's ratchet)
    if (a.mode === 'anchor' && (!P.grounded || this.reeling || this.chest(_c).distanceTo(end) >= this.L - 0.15)) { slack = 0; taut = 1; load = Math.max(load, 0.75); }
    const helix = Math.max(0, 1 - this.latchT * 3.2); // (the last of the coils runs out as it goes taut)
    this.line.set(tip, end, { tension: 0.1 + taut * (0.25 + 0.6 * load), slack, aspect: LOAD, helix: helix * 0.7, cam: cam.position, dt, time: performance.now() / 1000 });
  }

  /** Where the line is fast: the anchor, or the catch's own hitch (it moves). */
  attachPoint(out) {
    const a = this.att;
    if (a.ent?.type === 'creature') return a.ent.center(out);
    if (a.mode === 'pull' && a.body && a.body.isValid?.() !== false && a.ent?.alive !== false) {
      const t = a.body.translation(), r = a.body.rotation();
      return out.copy(a.local).applyQuaternion(_q.set(r.x, r.y, r.z, r.w)).add(_s.set(t.x, t.y, t.z));
    }
    if (a.mode === 'pull' && a.ent?.pos) return out.copy(a.ent.pos).setY(a.ent.pos.y + 0.35);
    return out.copy(a.point);
  }

  // ---------------------------------------------------------------- what it bit
  arrive() {
    const g = this.game, r = this.result, P = this.tool.P;
    if (!r) { this.phase = 'back'; return; }
    sfx.hookLatch();
    g.fx.impact(r.point, r.normal, { sparks: 10, dust: 6 });
    g.time.pulse('latch', 0.3, 0.045);
    this.latchT = 0;
    this.chest(_c);
    this.L = Math.max(1.2, _c.distanceTo(r.point) + 0.15);
    this.reelV = 0; this.travel = 0; this.hold = false; this.blocked = 0;
    this.destPrev.copy(_c); this.destVel.set(0, 0, 0); this.holdWas = false;
    if (r.kind === 'anchor') {
      this.att = { mode: 'anchor', point: r.point.clone(), normal: r.normal.clone(), ent: r.ent, body: r.body };
    } else {
      const creature = r.ent?.type === 'creature';
      const body = creature ? null : r.body;
      let local = new THREE.Vector3();
      if (creature) {
        // the bite stings, and staggers it: a thinking thing caught on a hook is knocked out of what it was doing (stun.js)
        const dir = _d.copy(r.point).sub(_c).normalize().clone();
        g.creatures.strike(r.ent, r.point.clone(), dir, 0.5, 'hooked');
        g.stun?.add(r.ent, 0.35, { by: 'courier', cause: 'hook' });
        r.ent.cancel?.('hooked');
        g.events?.emit('hook.creature', { kind: r.ent.kind, by: 'courier' });
      }
      if (body) {
        const t = body.translation(), q = body.rotation();
        local.copy(r.point).sub(_s.set(t.x, t.y, t.z)).applyQuaternion(_q.set(q.x, q.y, q.z, q.w).invert());
      }
      this.att = { mode: 'pull', point: r.point.clone(), normal: r.normal.clone(), ent: r.ent, body, local, dist0: _c.distanceTo(r.point) };
    }
    this.phase = 'held';
    g.events?.emit('grapple.attach', { kind: r.kind, dist: _c.distanceTo(r.point), what: r.ent?.type || 'prop' });
  }

  /** Let go of the line. how: 'tap' | 'jump' | 'arrive' | 'delivered' | 'snag' | 'far' | 'taken' | 'stow' | 'flung'. */
  release(how) {
    const a = this.att;
    if (!a) return;
    const g = this.game;
    this.att = null; this.reeling = false; this.paying = false; this.reelV = 0;
    if (a.mode === 'pull') {
      if (how === 'tap' || how === 'flung') {
        // let go with the motion of the aim: what they were sweeping the catch through
        const body = a.body;
        if (a.ent?.type === 'creature' && a.ent.alive) a.ent.knock?.(this.destVel.clone().clampLength(0, 14).setY(3)); // (flung)
        if (body) {
          const v = this.destVel.clone().clampLength(0, 18);
          const lv = body.linvel();
          body.setLinvel({ x: lv.x * 0.3 + v.x, y: lv.y * 0.3 + v.y + 1, z: lv.z * 0.3 + v.z }, true);
          body.wakeUp?.();
        }
        if (this.hold) g.events?.emit('hook.fling', { what: a.ent?.type === 'creature' ? a.ent.kind : a.ent?.type || 'prop', speed: this.destVel.length() });
      }
      if (how === 'delivered') g.events?.emit('hook.pull', { what: a.ent?.type === 'creature' ? a.ent.kind : a.ent?.type || 'prop', dist: a.dist0 || 0 });
    }
    this.phase = this.flying ? 'back' : 'idle';
    if (this.flying) this.phase = 'back';
    this.latchT = 9;
    g.events?.emit('grapple.release', { how, mode: a.mode });
    sfx.hookRelease?.();
  }

  // ---------------------------------------------------------------- the line's rules (fixed step)
  fixed(dt) {
    const a = this.att;
    if (!a) return;
    const P = this.tool.P, inp = P.input, g = this.game, C = T.tech.grapple || {};
    // the hands: LMB reels, RMB pays out (a tap lets go)
    const ok = this.tool.held && this.tool.form === 'hook' && inp.enabled;
    this.reeling = ok && inp.isDown('Mouse0') && g.lachryma.available > 0.2;
    const rDown = ok && inp.isDown('Mouse2');
    if (rDown) this.rT += dt;
    else { if (this.rWas && this.rT < 0.2) { this.rWas = false; this.rT = 0; this.release('tap'); return; } this.rT = 0; }
    this.rWas = rDown;
    this.paying = rDown && this.rT > 0.2;
    if (this.reeling) g.lachryma.drain?.((C.reelCost ?? 2) * dt, 'hook');
    // what it was fast to is gone (broken, taken)
    if (a.mode === 'pull' && ((a.ent && a.ent.alive === false) || (a.body && a.body.isValid?.() === false))) return this.release('gone');
    // the tool put away, water, a tech that takes the body: the line goes
    const act = P.techs.active;
    if (act && act.id !== 'grapple' && act.id !== 'sondelass') return this.release('taken');
    if (this.chest(_c).distanceTo(this.attachPoint(_e)) > RANGE * 1.6) return this.release('far');
    // a line that has caught on a corner comes away
    this.losT -= dt;
    if (this.losT <= 0) {
      this.losT = 0.12;
      const end = this.attachPoint(_e), from = this.chest(_c), d = _d.copy(end).sub(from), len = d.length();
      if (len > 1.5) {
        const hit = g.physics.raycast(from, d.multiplyScalar(1 / len), len - 0.5, P.collider, GROUPS.controllerQuery, (c) => !c.isSensor() && c.parent()?.handle !== a.body?.handle && !c.parent()?.isDynamic());
        this.blocked = hit ? this.blocked + 0.12 : 0;
        if (this.blocked > 0.36) return this.release('snag');
      }
    }
    if (a.mode === 'anchor') this.fixedAnchor(dt, C);
    else this.fixedPull(dt, C);
  }

  fixedAnchor(dt, C) {
    const P = this.tool.P;
    const dist = this.chest(_c).distanceTo(this.att.point);
    if (this.reeling) {
      this.reelV = Math.min(C.reelMax ?? 26, this.reelV + (C.reelAccel ?? 70) * dt);
      this.L = Math.max(1.0, Math.min(this.L, dist) - this.reelV * dt);
    } else this.reelV = Math.max(0, this.reelV - 90 * dt);
    if (this.paying) this.L = Math.min(C.maxLen ?? 46, this.L + (C.payV ?? 6) * (1 + this.rT * 0.6) * dt);
    if (P.grounded && !this.reeling) this.L = Math.max(this.L, dist + 0.05); // (walking pays the line out: a leash the length of the walk)
  }

  /** A catch: brought to a point in front of their chest and held while LMB is held. */
  fixedPull(dt, C) {
    const P = this.tool.P, a = this.att, g = this.game;
    const p = this.attachPoint(_e), body = a.body, ent = a.ent;
    const dist = this.chest(_c).distanceTo(p);
    P.lookDir(_d);
    // the hold point: in front of the chest along the aim
    const dest = _s.copy(_c).addScaledVector(_d, 1.7).addScaledVector(UP, 0.25);
    this.destVel.copy(dest).sub(this.destPrev).multiplyScalar(1 / Math.max(dt, 1e-4));
    this.destPrev.copy(dest);
    this.L = Math.max(1.2, Math.min(this.L + (this.paying ? 6 * dt : 0), dist + 0.2));
    // reeled in and let go of, close by: it is theirs (it drops where it is)
    if (this.holdWas && !this.reeling && dist < 2.6) { this.holdWas = false; return this.release('delivered'); }
    this.holdWas = this.hold;
    if (this.reeling) {
      this.reelV = Math.min(C.reelMax ?? 26, this.reelV + 40 * dt);
      const toD = _o.copy(dest).sub(p), dd = toD.length();
      const mass = body?.mass?.() ?? 4;
      const cap = (5 + 13 * THREE.MathUtils.clamp(1 - mass / HEAVY, 0.1, 1)) * (0.4 + 0.6 * Math.min(1, this.reelV / 12));
      const want = toD.multiplyScalar(Math.min(cap, dd * 9) / Math.max(dd, 1e-4));
      this.travel += want.length() * dt;
      if (ent?.type === 'creature') {
        // dragged: its own steering overruled while the line is in (and lifted off the ground a little if they are above it)
        const k = Math.min(1, 10 * dt);
        if (ent.vel) { ent.vel.x += (want.x - ent.vel.x) * k; ent.vel.z += (want.z - ent.vel.z) * k; }
        if (want.y > 2 && !ent.air) { ent.vy = Math.min(want.y, 4); ent.air = true; }
      } else if (ent?.type === 'clapper') {
        ent.kv?.addScaledVector(want.multiplyScalar(1), 0.6);
        ent.state = 'stunned'; ent.timer = Math.max(ent.timer || 0, 0.6);
      } else if (body) {
        const lv = body.linvel();
        const k = Math.min(1, 14 * dt);
        body.setLinvel({ x: lv.x + (want.x - lv.x) * k, y: lv.y + (want.y - lv.y) * k + 9.81 * dt, z: lv.z + (want.z - lv.z) * k }, true); // (a catch on the line does not fall)
        body.setAngvel?.({ x: 0, y: 0, z: 0 }, true);
        body.wakeUp?.();
      }
      this.hold = dd < 0.8;
    } else {
      this.reelV = Math.max(0, this.reelV - 60 * dt);
      this.hold = false;
      // slack: the catch is tethered (it cannot go farther than the line)
      if (dist > this.L + 0.3 && body) {
        const lv = body.linvel();
        _o.copy(_c).sub(p).normalize();
        const out = -(lv.x * _o.x + lv.y * _o.y + lv.z * _o.z);
        if (out > 0) body.setLinvel({ x: lv.x + _o.x * out * 0.8, y: lv.y + _o.y * out * 0.8, z: lv.z + _o.z * out * 0.8 }, true);
      }
    }
    if (dist < 1.2 && !this.reeling) { /* it is at their feet, and not being held: leave it be */ }
    void g;
  }
}
