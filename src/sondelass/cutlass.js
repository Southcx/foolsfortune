// ---------------------------------------------------------------------------------------
// THE CUTLASS: the Sondelass's melee form, and everything a blade needs to be a good one.
//
//   LMB       a three-stroke combo, from the Universal Animation Library's sword clips (CC0) over the upper body, so the legs keep
//             running. A stroke has a wind-up, a window in which the blade can hurt what it passes through, and a window in which
//             the next press chains; the third is the overhead one and cuts hardest. Each leaves a ribbon of light (trail.js).
//   RMB tap   the STINGER: a committed thrust. She lunges six metres in a quarter of a second, blade first, the Sword_Dash clip
//             for the whole body, and everything in the line is pierced and thrown. (moves/launch.js carries her past the core's
//             speed cap.) It costs a little of the mind.
//   RMB hold  BLADE MODE (blade.js): time all but stops, the mouse turns a line of light through the target, LMB cuts along it.
//   Z / MMB   lock on (lockon.js): the camera and the body hold the target, strokes and the stinger go toward it, A/D strafe it.
//   V (hold)  GUARD: the blade comes up (the Sword_Block clip). Pressed in time (the first 0.28 s), a projectile that arrives is
//             PARRIED: sent back where she looks (parry.js, the rule the kick shares); later, it is only turned aside. Moving with the
//             guard up is slower, and the body faces the aim.
//
// Prior art, and what was taken:
//  - Every third-person action game's light combo (Zelda's, Dark Souls' R1 string): a buffered press inside the chain window
//    continues, a late one starts over, and each stroke steps you a little way toward what you are cutting (here, toward the lock).
//  - Monster Hunter: the hit window is a slice of the clip, not the whole of it, and the blade is tested along its length every frame
//    in that slice (a swept segment, not a point) so a fast swing cannot skip through something.
//  - Devil May Cry's Stinger (a lunge that pierces and stays committed), Soul Calibur's and DMC's weapon trails (a ribbon between
//    two sockets, sampled per frame and spline-smoothed), and the hit-stop every fighting game uses (a few frames of nearly nothing
//    at the moment of contact, which is most of what makes a hit feel heavy: game.time.pulse).
//  - Zelda: Twilight Princess' lock-on and Sekiro's deflect for the guard's timing (see lockon.js and parry.js).
// The blade is tested against breakables and clapperjars by distance from the blade's segment (they are few and near); each is hit
// once per stroke.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { BLADE_LEN } from './model.js';
import { Trail } from '../vfx/trail.js';
import { BladeMode } from './blade.js';
import { deflect, guard } from '../parry.js';
import { arcAt } from '../tools/viewmodel.js';

const STROKES = [
  { clip: 'swordA', dur: 0.43, hit: [0.14, 0.32], chain: [0.26, 0.75], dmg: 1.0, lunge: 3.2, power: 1.2, trail: [0.06, 0.42] },
  { clip: 'swordB', dur: 0.53, hit: [0.12, 0.34], chain: [0.28, 0.8], dmg: 1.1, lunge: 3.2, power: 1.3, trail: [0.05, 0.44] },
  { clip: 'swordC', dur: 0.95, hit: [0.44, 0.78], chain: [], dmg: 1.9, lunge: 5, power: 2.0, trail: [0.36, 0.86] },
];
const STING = { dash: 0.26, speed: 30, dmg: 2.4, power: 3.0, reach: 2.0, radius: 0.85, cost: 6, cool: 0.5 };
const PARRY_WIN = 0.28, HOLD = 0.16;
const DMG = 62;
const _up = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _e = new THREE.Vector3();

/** Distance from point p to the segment ab. */
function segDist(a, b, p) {
  _d.subVectors(b, a);
  const l2 = _d.lengthSq();
  const t = l2 > 0 ? THREE.MathUtils.clamp(_c.subVectors(p, a).dot(_d) / l2, 0, 1) : 0;
  return _c.copy(a).addScaledVector(_d, t).distanceTo(p);
}

export class Cutlass {
  constructor(tool) {
    this.tool = tool;
    this.stroke = null; // the one being played
    this.t = 0;
    this.n = -1; // the last stroke of the combo
    this.buffer = 0;
    this.idle = 9; // time since the last stroke ended
    this.hit = new Set();
    this.combo = 0;
    const g = tool.game;
    this.trail = new Trail(g.scene, { life: 0.3, max: 48, color: 0xffb27a, tip: 0xfff1dc, fade: 1.5 });
    this.blade = new BladeMode(this);
    this.rmbT = -1; // RMB down: how long (a tap is a stinger, a hold is blade mode)
    this.stinging = false; this.stCool = 0; this.stHit = new Set(); this.stPrev = new THREE.Vector3(); this.stDir = new THREE.Vector3(0, 0, 1); this.ghostT = 0;
    this.ghosts = [];
    this.guardOn = false; this.guardT = 0; this.guardW = 0;
  }
  get busy() { return !!this.stroke || this.stinging || this.blade.active || this.guardOn; }
  get playing() { return !!this.stroke || this.blade.active || this.blade.k > 0.05 || this.guardW > 0.02; }
  get game() { return this.tool.game; }

  cancel() {
    this.stroke = null; this.buffer = 0; this.rmbT = -1; this.guardOn = false;
    this.blade.exit('stow');
    this.game.lock?.release('stow');
    this.trail.gap();
    this.tool.P.guarding = false;
  }

  // ---------------------------------------------------------------- aim
  /** Where a stroke or a thrust goes: toward the lock, or where she is looking. */
  aimDir(out, flat = true) {
    const g = this.game, P = this.tool.P;
    if (g.lock?.active) {
      const at = g.lock.point(_e);
      out.copy(at).sub(_a.set(P.pos.x, P.pos.y + 0.9, P.pos.z));
      if (flat) out.setY(THREE.MathUtils.clamp(out.y, -1, 1) * 0.3);
      if (out.lengthSq() > 1e-4) return out.normalize();
    }
    P.lookDir(out);
    if (flat) out.y = THREE.MathUtils.clamp(out.y, -0.1, 0.25);
    return out.normalize();
  }

  // ---------------------------------------------------------------- strokes
  start(def, n) {
    const P = this.tool.P, g = this.game;
    this.stroke = def; this.t = 0; this.n = n; this.hit.clear(); this.buffer = 0;
    // toward the lock (or the aim): the body turns to it, and steps into it
    const f = this.aimDir(_a);
    P.bodyYaw = Math.atan2(f.x, f.z);
    let lunge = def.lunge * (P.grounded ? 1 : 0.5);
    if (g.lock?.active) { g.lock.point(_e); lunge = Math.min(lunge, Math.max(0, _e.distanceTo(P.pos) - 1.3) * 3.2); } // (never through it)
    P.impulse(_b.copy(f).setY(0).normalize().multiplyScalar(lunge), 'cut');
    sfx.slash(false);
    this.combo = n + 1;
    g.events?.emit('cut.swing', { n });
    this.tool.track?.play('swordIdle', 0, 0.2);
  }

  update(dt, inp) {
    const P = this.tool.P, g = this.game, raw = g.rawDt || dt;
    this.idle += dt;
    this.stCool -= dt;
    // the blade is read in real seconds: what the world is doing does not change how fast she cuts
    if (this.blade.active || this.blade.k > 0) { this.blade.update(dt, inp); if (this.blade.active) return; }
    if (inp.wasPressed('Mouse1')) g.lock.toggle();
    this.guardUpdate(dt, inp);
    // RMB: a tap is the stinger, a hold is blade mode
    if (inp.wasPressed('Mouse2') && !this.stroke && !this.stinging && !this.guardOn) this.rmbT = 0;
    if (this.rmbT >= 0) {
      this.rmbT += raw;
      if (!inp.isDown('Mouse2')) { this.rmbT = -1; if (!this.busy && this.stCool <= 0) this.stinger(); }
      else if (this.rmbT >= HOLD) {
        this.rmbT = -1;
        if (!this.busy && this.blade.canEnter()) this.blade.enter();
        else if (!this.busy) { sfx.fizzle?.(); g.hud?.lachrymaPulse?.(false); }
      }
    }
    if (this.stinging) return;
    if (!this.stroke) {
      if (this.idle > 0.9) this.n = -1;
      if (inp.wasPressed('Mouse0') && P.techs.active?.id !== 'swim' && !this.guardOn) this.start(STROKES[(this.n + 1) % STROKES.length], (this.n + 1) % STROKES.length);
      return;
    }
    const s = this.stroke;
    this.t += dt;
    if (inp.wasPressed('Mouse0')) this.buffer = 0.35;
    this.buffer -= dt;
    if (this.t >= s.hit[0] && this.t <= s.hit[1]) this.sweep();
    // the next stroke: a press inside the chain window
    if (s.chain.length && this.buffer > 0 && this.t >= s.chain[0] && this.t <= s.chain[1]) { this.start(STROKES[this.n + 1], this.n + 1); return; }
    if (this.t >= s.dur) { this.stroke = null; this.idle = 0; this.trail.gap(); }
  }

  /** The blade's segment through everything near it. */
  sweep() {
    const g = this.game, m = this.tool.model, P = this.tool.P;
    m.group.updateMatrixWorld(true);
    m.bladeSegment(_a, _b);
    const dir = _d.copy(_b).sub(_a).normalize().clone();
    const s = this.stroke;
    let struck = 0;
    for (const ent of [...g.breakables.items]) {
      if (!ent.alive || this.hit.has(ent) || ent.def?.trial) continue;
      const t = ent.body.translation();
      _p.set(t.x, t.y + ent.P.height * 0.45, t.z);
      if (_p.distanceToSquared(P.pos) > 36) continue;
      if (segDist(_a, _b, _p) > 0.22 + ent.P.rMax * 0.9) continue;
      this.hit.add(ent); struck++;
      g.breakables.damage(ent, DMG * s.dmg * (g.veritome?.mult('melee') ?? 1), _p.clone(), dir.clone(), s.power);
      g.events?.emit('cut.hit', { what: 'pot', combo: this.combo });
    }
    for (const c of [...g.clappers.list]) {
      if (!c.alive || this.hit.has(c)) continue;
      _p.copy(c.pos).y += 0.35;
      if (_p.distanceToSquared(P.pos) > 36) continue;
      if (segDist(_a, _b, _p) > 0.7) continue;
      this.hit.add(c); struck++;
      g.clappers.hit(c, _p.clone(), dir.clone(), s.power, 'sliced');
      g.events?.emit('cut.hit', { what: 'clapper', combo: this.combo });
    }
    if (struck) this.impact(s.dmg, _a, _b);
  }

  /** What a hit does to the world: the sound, the shake, the flash of the cut, and the stop (a beat of nearly nothing). */
  impact(dmg, a, b) {
    const g = this.game, P = this.tool.P;
    sfx.cutHit(dmg);
    P.shake = Math.max(P.shake, 0.12 * dmg);
    g.fx.slash?.(a.clone(), b.clone(), _up);
    g.time.pulse('hit', 0.07, 0.035 + 0.03 * dmg, { release: 0.12 });
  }

  // ---------------------------------------------------------------- the stinger
  stinger() {
    const P = this.tool.P, g = this.game, launch = P.techs.get('launch');
    if (!launch || P.techs.active) return;
    if (!g.lachryma.spend(STING.cost, 'stinger')) return;
    const dir = this.aimDir(new THREE.Vector3());
    // toward the lock: no farther than the target (she stops a blade's length short of it)
    let speed = STING.speed, time = STING.dash;
    if (g.lock?.active) { g.lock.point(_e); const d = Math.max(1.2, _e.distanceTo(P.pos) - 1.4); time = THREE.MathUtils.clamp(d / speed, 0.1, STING.dash); }
    this.stinging = true; this.stHit.clear(); this.stDir.copy(dir); this.stPrev.copy(P.pos); this.ghostT = 0.06; // (the first afterimage waits: at the start it would sit on the body)
    this.stCool = STING.cool;
    this.trail.gap();
    sfx.stinger();
    g.events?.emit('cut.stinger', { locked: !!g.lock?.active });
    P.fovPunch = Math.max(P.fovPunch || 0, 9);
    this.tool.track?.play('swordIdle', 0, 0.1);
    launch.go(dir.clone().multiplyScalar(speed), {
      time, gravity: 0.12, drag: 0, tag: 'stinger', yaw: Math.atan2(dir.x, dir.z), endSpeed: 6,
      clip: 'swordDash',
      // (the clip: the wind-up in a blink, the lunge held for the whole thrust, then the way back)
      clipMap: (tt) => (tt < 0.07 ? (tt / 0.07) * 0.22 : tt < STING.dash + 0.04 ? 0.22 + ((tt - 0.07) / (STING.dash - 0.03)) * 0.33 : 0.55 + (tt - STING.dash - 0.04) * 1.6),
      onStep: (dt) => this.stingStep(dt),
      onEnd: () => { this.stinging = false; this.idle = 0; this.trail.gap(); },
    });
    const lt = P.techs.get('launch'); if (lt) lt.blendIn = 30;
  }

  /** Each fixed step of the thrust: everything within reach of the path is pierced. */
  stingStep(dt) {
    const g = this.game, P = this.tool.P, dir = this.stDir;
    const from = _a.copy(this.stPrev).setY(this.stPrev.y + 1.0);
    const to = _b.copy(P.pos).setY(P.pos.y + 1.0).addScaledVector(dir, STING.reach);
    this.stPrev.copy(P.pos);
    let struck = 0;
    for (const ent of [...g.breakables.items]) {
      if (!ent.alive || this.stHit.has(ent) || ent.def?.trial) continue;
      const t = ent.body.translation();
      _p.set(t.x, t.y + ent.P.height * 0.45, t.z);
      if (segDist(from, to, _p) > STING.radius * 0.5 + ent.P.rMax) continue;
      this.stHit.add(ent); struck++;
      g.breakables.damage(ent, DMG * STING.dmg * (g.veritome?.mult('melee') ?? 1), _p.clone(), dir.clone(), STING.power);
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7));
      g.events?.emit('cut.hit', { what: 'pot', combo: 'stinger' });
    }
    for (const c of [...g.clappers.list]) {
      if (!c.alive || this.stHit.has(c)) continue;
      _p.copy(c.pos).y += 0.35;
      if (segDist(from, to, _p) > STING.radius) continue;
      this.stHit.add(c); struck++;
      g.clappers.hit(c, _p.clone(), dir.clone(), STING.power, 'sliced');
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7));
      g.events?.emit('cut.hit', { what: 'clapper', combo: 'stinger' });
    }
    if (struck) g.time.pulse('stinger', 0.04, 0.1, { release: 0.2 });
    // afterimages: the body left behind at intervals, fading
    this.ghostT -= dt;
    if (this.ghostT <= 0) { this.ghostT = 0.045; this.afterimage(); }
  }

  afterimage() {
    const g = this.game, ch = g.character;
    if (!ch || ch.hidden) return;
    const mat = new THREE.MeshBasicMaterial({ color: 0xff9a5a, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
    const obj = ch.snapshot(mat);
    g.scene.add(obj);
    this.ghosts.push({ obj, mat, age: 0 });
  }

  // ---------------------------------------------------------------- the guard
  guardUpdate(dt, inp) {
    const P = this.tool.P, g = this.game;
    const want = inp.isDown('KeyV') && !this.stroke && !this.stinging;
    if (want && !this.guardOn) { this.guardOn = true; this.guardT = 0; sfx.guardUp?.(); g.events?.emit('guard.up', {}); }
    else if (!want && this.guardOn) this.guardOn = false;
    this.guardW = THREE.MathUtils.damp(this.guardW, this.guardOn ? 1 : 0, 16, dt);
    P.guarding = this.guardOn;
    if (!this.guardOn) return;
    this.guardT += dt;
    P.bodyYaw = P.yaw;
    // in front of her, at the blade
    const f = P.lookDir(_a).setY(0).normalize();
    const at = _b.set(P.pos.x, P.pos.y + 1.1, P.pos.z).addScaledVector(f, 0.8);
    if (this.guardT <= PARRY_WIN) {
      if (deflect(g, { at, radius: 2.2, speedMin: 3, outMin: 13, assist: 0.5, iframes: 0.4, by: 'blade' })) { this.guardT = PARRY_WIN + 1; g.lachryma.gain?.(2, 'parry'); }
    } else if (guard(g, { at, radius: 1.8 })) g.lachryma.drain?.(3, 'guard');
  }

  // ---------------------------------------------------------------- what is drawn
  /** After the tool has been placed for the frame: the blade's ribbon, and the afterimages' fade. */
  afterHands(dt) {
    const m = this.tool.model;
    const s = this.stroke;
    const swinging = s && this.t >= s.trail[0] && this.t <= s.trail[1];
    if ((swinging || this.stinging) && m.bladeOut > 0.5) {
      m.bladeSegment(_a, _b);
      this.trail.push(_a, _b);
    } else if (!swinging && !this.stinging) this.trail.gap();
    this.trail.setColors(this.stinging ? 0xffe0b0 : this.stroke && this.n === 2 ? 0xff7a4a : 0xffb27a, this.stinging ? 0xffffff : 0xfff1dc);
    this.trail.update(dt);
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const gh = this.ghosts[i];
      gh.age += dt;
      const k = 1 - gh.age / 0.4;
      if (k <= 0) { this.game.scene.remove(gh.obj); gh.obj.traverse((o) => o.geometry?.dispose()); gh.mat.dispose(); this.ghosts.splice(i, 1); continue; }
      gh.mat.opacity = 0.3 * k * k;
    }
  }

  /** The first-person arc for what is playing: { arc, u } (tools/viewmodel.js). */
  fpArc() {
    if (this.blade.active) return this.blade.swing > 0 ? { arc: this.blade.swingKind % 2 ? 'l2r' : 'r2l', u: 1 - this.blade.swing } : { arc: 'raise', u: 0.4 };
    if (this.guardW > 0.02) return { arc: 'raise', u: 0.5 * this.guardW };
    const s = this.stroke;
    if (!s) return null;
    return { arc: ['r2l', 'l2r', 'over'][this.n] || 'r2l', u: arcAt(this.t, s.hit, s.dur) };
  }

  /** The clip layer: { pose, w } while a stroke, the guard or a blade-mode cut is playing. */
  pose(C, out) {
    const b = this.blade;
    if (b.active || b.k > 0.05) {
      if (b.swing > 0) { const B = b.swingKind % 2 === 1; C.sample(B ? 'swordB' : 'swordA', (1 - b.swing) * (B ? 0.53 : 0.43), out, false); return { pose: out, w: 1 }; }
      C.sample('swordC', 0.22, out, false);
      return { pose: out, w: 0.85 * b.k };
    }
    if (this.guardW > 0.02) { C.sample('block', 0.42, out, false); return { pose: out, w: this.guardW }; }
    const s = this.stroke;
    if (!s) return null;
    C.sample(s.clip, this.t, out, false);
    const w = Math.min(1, this.t / 0.06) * (1 - THREE.MathUtils.smoothstep(this.t, s.dur - 0.2, s.dur));
    return { pose: out, w };
  }
}
