// ---------------------------------------------------------------------------------------
// THE CUTLASS: the Sondelass's melee form, and everything a blade needs to be a good one. Its strokes are the Courier's own suite
// (Sond_*), run by the shared combo engine (tools/moveset.js, the grammar every tool keeps):
//
//   LMB         four strokes, the fourth the whole body's (a leap and a cut); after a pause at the first, a THRUST and its follow;
//               after a pause at the second, the three wide arcs of the JRPG string
//   hold LMB    the CHARGE: the blade drawn back while held, the charged slash on release
//   S + LMB     the LAUNCHER: up they go, and what it cuts goes with them; LMB in the air: two cuts, then the PLUNGE, the blade
//               driven down into the ground with a blast round them
//   sprinting   LMB: the DASH SLASH (its own 2.3 m, carried)
//   R           the TIDECUTTER: the special, a leaping wave of a cut (12 Lachryma)
//   RMB tap     the STINGER: a committed thrust. They lunge six metres in a quarter of a second, the suite's thrust held out, and
//               everything in the line is pierced and thrown. (courier/moves/launch.js carries them past the core's speed cap.)
//   RMB hold    BLADE MODE (blade.js): time all but stops, the mouse turns a line of light through the target, LMB cuts along it.
//   MMB         lock on (lockon.js): the camera and the body hold the target, strokes and the stinger go toward it, A/D strafe it.
//   V (hold)    GUARD: the blade comes up (Sond_Block). Pressed in time (the first 0.28 s), a projectile that arrives is PARRIED
//               (Sond_Parry): sent back where they look (parry.js, the rule the kick shares); later, it is only turned aside. LMB with
//               the guard up is the COUNTER: the spin slash, and the guard drops.
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
import { sfx } from '../../audio/sfx.js';
import { BLADE_LEN } from './model.js';
import { Trail } from '../../vfx/trail.js';
import { BladeMode } from './blade.js';
import { deflect, guard } from '../../courier/parry.js';
import { Moveset, rootOf } from '../moveset.js';

// The strikes are the Courier's own suite (melee.glb's Sond_*), played by the shared combo engine (tools/moveset.js): the moves below
// are its table. Clip seconds throughout; when the blade can hurt is not typed here: it is measured from the clip (melee.js).
const MOVES = {
  c1: { clip: 'Sond_Combo1', rate: 1.1, chain: [0.22, 0.75], to: 0.85, fade: 0.3, hit: { power: 1.2, dmg: 1.0 }, lunge: 3.2, arc: 'r2l' },
  c2: { clip: 'Sond_Combo2', rate: 1.1, chain: [0.26, 0.8], to: 0.9, fade: 0.3, hit: { power: 1.3, dmg: 1.1 }, lunge: 3.2, arc: 'l2r' },
  c3: { clip: 'Sond_Combo3', rate: 1.1, chain: [0.42, 0.95], to: 1.05, fade: 0.35, hit: { power: 1.5, dmg: 1.3 }, lunge: 3.6, arc: 'r2l' },
  c4: { clip: 'Sond_Combo4', body: 'whole', root: 'xz', hit: { power: 2.0, dmg: 1.9, push: 6 }, heat: 1, arc: 'over' },
  // the pause strings: after the first stroke, a thrust and its follow; after the second, the three wide arcs (the JRPG string)
  t1: { clip: 'Sond_Thrust', rate: 1.1, chain: [0.2, 0.7], to: 0.8, fade: 0.3, hit: { power: 1.5, dmg: 1.3, push: 4 }, lunge: 4, arc: 'raise' },
  t2: { clip: 'Sond_ThrustCombo', body: 'whole', root: 'xz', hit: { power: 1.8, dmg: 1.6, push: 7 }, heat: 0.7, arc: 'raise' },
  j1: { clip: 'Sond_JrpgCombo1', rate: 1.1, chain: [0.45, 0.85], to: 0.95, fade: 0.3, hit: { power: 1.3, dmg: 1.2 }, lunge: 2.6, arc: 'r2l' },
  j2: { clip: 'Sond_JrpgCombo2', rate: 1.1, chain: [0.6, 0.95], to: 1.05, fade: 0.3, hit: { power: 1.4, dmg: 1.3 }, lunge: 2.6, arc: 'l2r' },
  j3: { clip: 'Sond_JrpgCombo3', body: 'whole', hit: { power: 2.2, dmg: 2.0, push: 7, lift: 3 }, heat: 1, arc: 'over' },
  // S + LMB: the launcher lifts them (its own 0.92 m) and what it strikes; LMB in the air: two cuts and the plunge
  up: { clip: 'Sond_Launcher', body: 'whole', root: 'xyz', chain: [0.3, 1.08], hit: { power: 1.4, dmg: 1.1, lift: 9.5, push: 1 }, arc: 'over' },
  a1: { clip: 'Sond_AirCombo1', body: 'whole', gravity: 0.12, chain: [0.22, 0.8], hit: { power: 1.2, dmg: 1.0, lift: 4, push: 1.5 }, arc: 'r2l' },
  a2: { clip: 'Sond_AirCombo2', body: 'whole', gravity: 0.12, chain: [0.36, 1.0], hit: { power: 1.3, dmg: 1.1, lift: 4, push: 2 }, arc: 'l2r', heat: 0.5 },
  a3: { clip: 'Sond_AirPlunge', body: 'whole', plunge: { hold: 0.32, speed: 26 }, ring: 2.6, hit: { power: 2.2, dmg: 2.0, push: 7, lift: 5 }, heat: 1, arc: 'over' },
  // a running slash (LMB while sprinting), the charged slash (hold LMB), the counter from the guard, and the special (R)
  dash: { clip: 'Sond_DashSlash', body: 'whole', root: 'xz', hit: { power: 1.9, dmg: 1.8, push: 8 }, heat: 0.8, arc: 'r2l' },
  hold: { clip: 'Sond_ChargeHold' },
  burst: { clip: 'Sond_ChargeRelease', body: 'whole', root: 'xz', hit: { power: 1.6, dmg: 1.6, push: 9 }, heat: 1, arc: 'r2l' },
  spin: { clip: 'Sond_SpinSlash', body: 'whole', hit: { power: 1.4, dmg: 1.2, push: 6 }, heat: 0.6, arc: 'r2l' },
  tide: { clip: 'Sond_SpecialTidecutter', body: 'whole', cost: 12, ringAt: 1.86, ring: 4.2, hit: { power: 3, dmg: 3, push: 12, lift: 4 }, heat: 1, arc: 'over' },
};
const STRINGS = { ground: ['c1', 'c2', 'c3', 'c4'], pause: [{ at: 0, to: ['t1', 't2'] }, { at: 1, to: ['j1', 'j2', 'j3'] }], launcher: 'up', air: ['a1', 'a2', 'a3'], dash: 'dash', charge: { hold: 'hold', release: 'burst' }, special: 'tide' };
const REACH = BLADE_LEN * 0.55 + 0.35; // (beyond the measured tip of a hand-held thing: the cutlass's blade, and some forgiveness)
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
    const g = tool.game;
    this.trail = g.vfx?.swing('swing.cutlass', { tint: 0xffb27a, tip: 0xfff1dc }) || new Trail(g.scene, { life: 0.3, max: 48, color: 0xffb27a, tip: 0xfff1dc, fade: 1.5 }); // (its look: vfx/library.js)
    this.moves = new Moveset(tool, {
      id: 'cutlass', moves: MOVES, strings: STRINGS, reach: REACH, pot: DMG, k: 1.4, cause: 'sliced', events: { swing: 'cut.swing', hit: 'cut.hit' },
      trail: this.trail, segment: (a, b) => this.tool.model.bladeSegment(a, b),
    });
    this.blade = new BladeMode(this);
    this.rmbT = -1; // RMB down: how long (a tap is a stinger, a hold is blade mode)
    this.stinging = false; this.stCool = 0; this.stHit = new Set(); this.stPrev = new THREE.Vector3(); this.stDir = new THREE.Vector3(0, 0, 1); this.ghostT = 0;
    this.ghosts = [];
    this.guardOn = false; this.guardT = 0; this.guardW = 0; this.parryT = 9;
  }
  get busy() { return this.moves.busy || this.stinging || this.blade.active || this.guardOn; }
  get playing() { return this.moves.playing || this.blade.active || this.blade.k > 0.05 || this.guardW > 0.02 || this.parryT < 0.9; }
  get game() { return this.tool.game; }
  get combo() { return this.moves.combo; }

  cancel() {
    this.moves.cancel(); this.rmbT = -1; this.guardOn = false;
    this.blade.exit('stow');
    this.game.lock?.release('stow');
    this.trail.gap();
    this.tool.P.guarding = false;
  }

  // ---------------------------------------------------------------- aim
  /** Where a thrust goes: toward the lock, or where they are looking. */
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

  // ---------------------------------------------------------------- strokes: the moveset reads LMB (and R); the cutlass keeps RMB and V
  update(dt, inp) {
    const P = this.tool.P, g = this.game, raw = g.rawDt || dt;
    this.stCool -= dt; this.parryT += dt;
    // the blade is read in real seconds: what the world is doing does not change how fast they cut
    if (this.blade.active || this.blade.k > 0 || this.blade.queue.length) { this.blade.update(dt, inp); if (this.blade.active) return; }
    if (inp.wasPressed('Mouse1')) g.lock.toggle();
    // LMB with the guard up: the counter (the spin), and the guard drops
    if (this.guardOn && inp.wasPressed('Mouse0') && !this.moves.busy) { this.guardOn = false; this.tool.P.guarding = false; this.moves.begin('spin', 'counter'); }
    this.guardUpdate(dt, inp);
    // RMB: a tap is the stinger, a hold is blade mode
    if (inp.wasPressed('Mouse2') && !this.moves.whole && !this.stinging && !this.guardOn) this.rmbT = 0;
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
    this.moves.update(dt, inp, { allow: P.techs.active?.id !== 'swim' && !this.guardOn });
  }

  /** What a hit does to the world: the sound, the shake, the flash of the cut, and the stop (a beat of nearly nothing). */
  impact(dmg, a, b, stop = true) {
    const g = this.game, P = this.tool.P;
    sfx.cutHit(dmg);
    P.shake = Math.max(P.shake, 0.12 * dmg);
    g.fx.slash?.(a.clone(), b.clone(), _up);
    if (stop) g.time.pulse('hit', 0.07, 0.035 + 0.03 * dmg, { release: 0.12 });
  }

  // ---------------------------------------------------------------- the stinger
  stinger() {
    const P = this.tool.P, g = this.game, launch = P.techs.get('launch');
    if (!launch || P.techs.active) return;
    if (!g.lachryma.spend(STING.cost, 'stinger')) return;
    const dir = this.aimDir(new THREE.Vector3());
    // toward the lock: no farther than the target (they stop a blade's length short of it)
    let speed = STING.speed, time = STING.dash;
    if (g.lock?.active) { g.lock.point(_e); const d = Math.max(1.2, _e.distanceTo(P.pos) - 1.4); time = THREE.MathUtils.clamp(d / speed, 0.1, STING.dash); }
    this.stinging = true; this.stStopped = false; this.stHit.clear(); this.stDir.copy(dir); this.stPrev.copy(P.pos); this.ghostT = 0.06; // (the first afterimage waits: at the start it would sit on the body)
    this.stCool = STING.cool;
    this.trail.gap();
    sfx.stinger();
    g.events?.emit('cut.stinger', { locked: !!g.lock?.active });
    P.fovPunch = Math.max(P.fovPunch || 0, 9);
    this.tool.track?.play('Sond_Idle', 0, 0.1);
    const root = rootOf(g.character.clips, 'Sond_Thrust');
    // (the suite's thrust: its wind-up in a blink, the point held out for the whole lunge, then the way back; its own step taken out of the hips)
    const map = (tt) => (tt < 0.07 ? (tt / 0.07) * 0.17 : tt < STING.dash + 0.04 ? 0.17 + ((tt - 0.07) / (STING.dash - 0.03)) * 0.07 : 0.24 + (tt - STING.dash - 0.04) * 1.6);
    launch.go(dir.clone().multiplyScalar(speed), {
      time, gravity: 0.12, drag: 0, tag: 'stinger', yaw: Math.atan2(dir.x, dir.z), endSpeed: 6,
      clip: 'Sond_Thrust',
      clipMap: map,
      poseFix: root ? (pose) => { root.at(map(launch.clipT), _p); pose.p[0] -= _p.x; pose.p[2] -= _p.z; } : null,
      onStep: (dt) => this.stingStep(dt),
      onEnd: () => { this.stinging = false; this.trail.gap(); },
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
      g.breakables.damage(ent, DMG * STING.dmg, _p.clone(), dir.clone(), STING.power);
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7), false);
      g.events?.emit('cut.hit', { what: 'pot', combo: 'stinger' });
    }
    for (const c of [...g.clappers.list]) {
      if (!c.alive || this.stHit.has(c)) continue;
      _p.copy(c.pos).y += 0.35;
      if (segDist(from, to, _p) > STING.radius) continue;
      this.stHit.add(c); struck++;
      g.clappers.hit(c, _p.clone(), dir.clone(), STING.power, 'sliced');
      this.impact(STING.dmg, _c.copy(_p).addScaledVector(dir, -0.7), _e.copy(_p).addScaledVector(dir, 0.7), false);
      g.events?.emit('cut.hit', { what: 'clapper', combo: 'stinger' });
    }
    for (const c of g.creatures?.near(_c.copy(from).lerp(to, 0.5), from.distanceTo(to) * 0.5 + 1) || []) {
      if (this.stHit.has(c)) continue;
      c.center(_p);
      if (segDist(from, to, _p) > STING.radius + c.radius) continue;
      this.stHit.add(c); struck++;
      g.creatures.strike(c, _p.clone(), dir.clone(), 2.2 * STING.power, 'sliced');
      g.events?.emit('cut.hit', { what: c.kind, combo: 'stinger' });
    }
    // (a thrust goes THROUGH: one light check at its first contact, never a stop per thing pierced, which would stall the lunge)
    if (struck && !this.stStopped) { this.stStopped = true; g.time.pulse('stinger', 0.35, 0.035, { release: 0.08 }); }
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
    const want = inp.isDown('KeyV') && !this.moves.busy && !this.stinging;
    if (want && !this.guardOn) { this.guardOn = true; this.guardT = 0; sfx.guardUp?.(); g.events?.emit('guard.up', {}); }
    else if (!want && this.guardOn) this.guardOn = false;
    this.guardW = THREE.MathUtils.damp(this.guardW, this.guardOn ? 1 : 0, 16, dt);
    P.guarding = this.guardOn;
    if (!this.guardOn) return;
    this.guardT += dt;
    P.bodyYaw = P.yaw;
    // in front of them, at the blade
    const f = P.lookDir(_a).setY(0).normalize();
    const at = _b.set(P.pos.x, P.pos.y + 1.1, P.pos.z).addScaledVector(f, 0.8);
    if (this.guardT <= PARRY_WIN) {
      if (deflect(g, { at, radius: 2.2, speedMin: 3, outMin: 13, assist: 0.5, iframes: 0.4, tool: 'cutlass' })) { this.guardT = PARRY_WIN + 1; this.parryT = 0; g.lachryma.gain?.(2, 'parry'); }
    } else if (guard(g, { at, radius: 1.8, tool: 'cutlass' })) g.lachryma.drain?.(3, 'guard');
  }

  // ---------------------------------------------------------------- what is drawn
  /** After the tool has been placed for the frame: the blade's ribbon, and the afterimages' fade. */
  afterHands(dt) {
    const m = this.tool.model, c = this.moves.cur;
    if (this.stinging && m.bladeOut > 0.5) { m.bladeSegment(_a, _b); this.trail.push(_a, _b); this.trail.update(dt); }
    else if (m.bladeOut > 0.5) this.moves.afterHands(dt);
    else { this.trail.gap(); this.trail.update(dt); }
    const hot = c && (c.def.heat || 0) > 0.6;
    this.trail.setColors(this.stinging ? 0xffe0b0 : hot ? 0xff7a4a : 0xffb27a, this.stinging ? 0xffffff : 0xfff1dc);
    if (this.stinging) this.trail.power = 1.5; // (the finishers and the stinger shed more)
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
    return this.moves.fpArc();
  }

  /** The clip layer: { pose, w } while a stroke, the guard, a parry or a blade-mode cut is playing. */
  pose(C, out) {
    const b = this.blade;
    if (b.active || b.k > 0.05) {
      if (b.swing > 0) { const B = b.swingKind % 2 === 1; C.sample(B ? 'Sond_Combo2' : 'Sond_Combo1', 0.05 + (1 - b.swing) * (B ? 0.3 : 0.26), out, false); return { pose: out, w: 1 }; }
      C.sample('Sond_ChargeHold', 0.4, out, false);
      return { pose: out, w: 0.85 * b.k };
    }
    if (this.parryT < 0.9) { C.sample('Sond_Parry', 0.12 + this.parryT, out, false); return { pose: out, w: 1 - THREE.MathUtils.smoothstep(this.parryT, 0.6, 0.9) }; } // (the deflect: the suite's parry, struck through)
    if (this.guardW > 0.02) { C.sample('Sond_Block', 0.4, out, false); return { pose: out, w: this.guardW }; }
    return this.moves.pose(C, out);
  }
}
