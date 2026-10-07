// ---------------------------------------------------------------------------------------
// THE KICK (a Movement Art, the unarmed V): with nothing in the hands, V is a brawler's whole moveset from the Courier's own suite
// (melee.glb's Fist_*), run by the shared combo engine (tools/moveset.js, the grammar every tool keeps, read on V instead of LMB):
//
//   V           a jab, a cross, a haymaker (the upper body over whatever the legs are doing), then the ROUNDHOUSE (the whole body)
//   V, pause    after the jab, a FRONT KICK and then a SHOVE; after the cross, the SWEEP (a full turn low along the floor)
//   S + V       the UPPERCUT, the launcher: up they go a little, and what it strikes goes higher; V while up: the ground pound
//   V in air    the GROUND POUND: fists overhead, a plunge, and a ring where they land
//   sprinting   V: the FLYING KICK (its own 1.3 m, carried)
//
// Everything the kick did before it still does, on every move: the first 0.26 s of a move is a PARRY (a projectile coming in near the
// strike goes back where they look: parry.js, the rule the cutlass shares); pots are cracked (and shoved when they hold), crates and
// loose props are shoved, clapperjars are sent flying (a heavy blow stuns them too), targets ring (`movers.hitTargetsNear`), and the
// foot or fist leaves its arc ('swing.kick'). New: a blow lands on a creature (`creatures.strike`, 'bashed' for the hands and 'kick'
// for the feet, at a modest power: the numbers are proposals for Dovina, in the table below). It is allowed when the belt allows it
// (no tool past a quarter drawn), never sliding, mantling or carrying, and only while no other tech has the body (a balance and a blink
// excepted: there a whole-body move plays on the upper body alone).
//
// Prior art, and what was taken:
//  - The boxer's 1-2-3 and the fighting games' target combos (Tekken's 1,2,1+2 strings, Street Fighter's chains): jab, cross, haymaker, and
//    a kick to end it; the pause string is Bayonetta's (the rhythm of the presses chooses the branch) and Sifu's sweep off a pause.
//  - Devil May Cry's gauntlets (Beowulf, Gilgamesh): the Rising Dragon uppercut as the launcher, a dive that ends in a shockwave; the
//    Yakuza brawler's running attack for the flying kick; Super Mario 64's ground pound (a hang, a straight drop, the bump at the floor).
//  - Arkham's freeflow and God of War's magnetism through melee.js: a blow started near something worth hitting turns to it.
//  - The yaw re-root of a turning clip (the "turn in place" of every locomotion system, Unreal's root-motion extraction): a move that
//    ends turned (the roundhouse ends 126 degrees round) hands its turn to the facing when it ends, so the body never unwinds.
// ---------------------------------------------------------------------------------------
import { deflect } from '../parry.js';
import * as THREE from 'three';
import { Tech } from './techs.js';
import { sfx } from '../../audio/sfx.js';
import { Moveset, rootOf } from '../../tools/moveset.js';
import { magnet, targets } from '../../tools/melee.js';
import { T } from '../../core/config.js';

const UP = new THREE.Vector3(0, 1, 0), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const PARRY_TO = 0.26; // (the opening of every move, in real seconds: the kick's parry window, as it always was)
const STEP = { range: 2.6, stand: 0.45, max: 1.3 }; // (the step in: from as far as 2.6 m, to 0.45 m from its surface, at most 1.3 m)

// The moves (clip seconds throughout; when a blow can land is measured from the clip by melee.js). `limb`/`tip` name the striking limb
// where melee.js's 'auto' would pick a flailing hand over the kicking foot. Numbers for Dovina: `hit.power` x K is a creature blow (a
// shot is 1), `hit.dmg` x the kick's damage (60) is a pot's; every unarmed blow is free, so every one is weaker than a shot but the
// finishers. `rise` (mine): the capsule really rises with the clip's hips above standing (x rise), and only the squat stays in the pose.
// `turn` (mine): the clip ends turned; the turn goes to the facing at its end. `squat` (mine): the hips never above standing in the pose.
// `ribbon: false` (mine): no ribbon (the pound's mark is its ring).
const MOVES = {
  j1: { clip: 'Fist_Combo1', rate: 1.15, chain: [0.1, 0.5], to: 0.6, fade: 0.25, lunge: 2.2, hit: { power: 0.8, dmg: 0.6, push: 1.5 } },
  j2: { clip: 'Fist_Combo2', rate: 1.15, chain: [0.14, 0.6], to: 0.7, fade: 0.25, lunge: 2.4, hit: { power: 0.9, dmg: 0.7, push: 2 } },
  j3: { clip: 'Fist_Combo3', rate: 1.1, chain: [0.2, 0.75], to: 0.85, fade: 0.3, lunge: 2.6, hit: { power: 1.1, dmg: 0.9, push: 3 } },
  rh: { clip: 'Fist_Roundhouse', body: 'whole', root: 'xz', limb: 'footR', tip: 0.22, turn: true, hit: { power: 1.6, dmg: 1.3, push: 8, cause: 'kick', heavy: true }, heat: 1 },
  // the pause strings: after the jab, the front kick and the shove; after the cross, the sweep
  fk: { clip: 'Fist_Kick', body: 'whole', root: 'xz', limb: 'footL', tip: 0.22, chain: [0.62, 1.05], hit: { power: 1.3, dmg: 1.0, push: 6, cause: 'kick' } },
  sh: { clip: 'Fist_Shove', body: 'whole', root: 'xz', rate: 1.1, hit: { power: 0.9, dmg: 0.5, push: 9, heavy: true } }, // (whole: it follows the kick's whole body)
  sw: { clip: 'Fist_Sweep', body: 'whole', root: 'xz', limb: 'footR', tip: 0.22, rate: 1.1, hit: { power: 1.0, dmg: 0.8, push: 2, lift: 3.5, cause: 'kick' } },
  // S + V: the uppercut (the capsule rises with its hop, half again: a launcher); V in the air, or while up: the ground pound
  up: { clip: 'Fist_Uppercut', body: 'whole', rise: 1.5, chain: [0.28, 0.56], hit: { power: 1.2, dmg: 1.0, lift: 8.5, push: 1 } },
  gp: { clip: 'Fist_GroundPound', body: 'whole', from: 0.24, lift: 0, squat: true, ribbon: false, plunge: { hold: 0.36, speed: 24 }, ring: 2.4, hit: { power: 1.5, dmg: 1.3, push: 6, lift: 4, heavy: true }, heat: 1 },
  // V while sprinting: the flying kick, its own 1.3 m carried
  fly: { clip: 'Fist_FlyingKick', body: 'whole', root: 'xz', limb: 'footR', tip: 0.22, hit: { power: 1.6, dmg: 1.3, push: 9, cause: 'kick', heavy: true }, heat: 0.8 },
};
const STRINGS = { ground: ['j1', 'j2', 'j3', 'rh'], pause: [{ at: 0, to: ['fk', 'sh'] }, { at: 1, to: ['sw'] }], launcher: 'up', air: ['gp'], dash: 'fly' };
const RING_H = 1.2; // (the ring's reach above their feet)
const K = 0.8; // (a creature blow is K x the move's power: a jab 0.64 of a shot, the roundhouse 1.28; Dovina's to rule on)
const LIMB = { R: ['forearmR', 'handR'], L: ['forearmL', 'handL'], footR: ['shinR', 'toeR'], footL: ['shinL', 'toeL'] };

/** The engine with the kick's own answers: a clapperjar is batted away (and stunned by a heavy blow), never broken by a bare hand. */
class FistMoves extends Moveset {
  blow(kind, ent, at, dir, h, c) {
    if (kind !== 'clapper') return super.blow(kind, ent, at, dir, h, c);
    const g = this.game, cfg = this.tool.cfg;
    if (ent.ally) return;
    g.clappers.knock(ent, new THREE.Vector3().copy(dir).setY(0).normalize().multiplyScalar(cfg.knock * (h.power ?? 1)).setY(3 + (h.lift ?? 0) * 0.5));
    if (h.heavy && g.shells) g.clappers.stun(ent, 2, g.shells.glowOutline, g.shells.xray);
    g.events?.emit(this.S.events.hit, { what: 'clapper', combo: this.combo, move: c?.id });
    this.S.onHit?.(kind, ent, at, dir, h, c);
  }

  /** The ground pound's ring, along the floor: what stands within R of them and within a body's height of their feet (the engine's
   *  ring takes every height, and a pound on the workshop floor broke the pots on the shelves above it). */
  ring(R, h) {
    const g = this.game, P = this.P;
    let struck = 0;
    for (const tg of targets(g, P.pos, R)) {
      if (this.hit.has(tg.ent) || Math.hypot(tg.pos.x - P.pos.x, tg.pos.z - P.pos.z) > R + tg.r || tg.pos.y - tg.r > P.pos.y + RING_H || tg.pos.y + tg.r < P.pos.y - 0.6) continue;
      this.hit.add(tg.ent); struck++;
      this.blow(tg.kind, tg.ent, tg.pos, new THREE.Vector3().copy(tg.pos).sub(P.pos).setY(0).normalize(), h, this.cur);
    }
    g.fx?.shockwave?.(P.pos.clone(), R);
    P.shake = Math.max(P.shake, 0.3);
    if (struck) this.impact((h?.dmg ?? 1) * 1.3, this.cur);
  }
}

export class Kick extends Tech {
  constructor(mgr) {
    super(mgr, 'kick');
    this.passive = true;
    this.blendIn = 30;
    this.parryT = 9; this.parried = false;
    this.hits = 0; this.shoved = new Set();
    const self = this;
    this.moves = new FistMoves(this, {
      id: 'kick', moves: MOVES, strings: STRINGS, button: 'KeyV', limb: 'auto', tip: 0.12, reach: 0.35, k: K, cause: 'bashed',
      get pot() { return self.cfg.damage; },
      events: { swing: 'kick.swing', hit: 'fist.hit' },
      onBegin: (c) => this.onBegin(c), onUpdate: (c, dt) => this.onUpdate(c, dt), onHit: (kind, ent) => this.onHit(kind, ent), onEnd: (c) => this.onEnd(c),
    });
    // (the striking limb's arc while a move is in its strike, forearm to fist or shin to toe: its look is vfx/library.js 'swing.kick')
    this.game.vfx?.swing('swing.kick').follow((a, b) => this.segment(a, b));
  }

  get engaged() { return this.moves.playing; }
  /** An upper-body move faces where it was aimed (the whole-body ones are faced by Launch). */
  faceYaw() { const c = this.moves.cur; return c && c.def.body !== 'whole' ? c.yaw : null; }

  /** May a move start now? The belt's word, the core's states, the hands, and no other tech holding the body. */
  allowed() {
    const P = this.P, g = this.game;
    if (P.sliding || P.mantle || P.freeze || P.dead) return false;
    if ((g.belt ? !g.belt.allows('kick') : (g.weapon?.drawT ?? 0) > 0.25) || this.mgr.toolOut) return false; // (no kicking with a tool out: V is its parry)
    const carry = this.mgr.get('carry');
    if (carry?.item || (carry && carry.state !== 'idle')) return false; // (the hands are full)
    const a = this.mgr.active;
    return !a || ['balance', 'blink'].includes(a.id) || (a.id === 'launch' && a.o?.tag?.startsWith('kick.'));
  }

  tick(dt) {
    const M = this.moves;
    if (!this.usable() || this.game.god?.controlling) { if (M.busy) M.cancel(); return; }
    const allow = this.allowed();
    M.update(dt, this.P.input, { allow });
    if (!allow && !M.busy) M.buffer = 0; // (a press made while it could not start is not kept for later)
  }

  onBegin(c) {
    this.flush();
    this.parryT = 0; this.parried = false; this.shoved.clear();
    this.P.latch('KeyV'); // (spent: nothing else reads this press)
    this.lift(c);
    if (c.def.body === 'whole') return;
    // (an upper-body move after a whole-body one: the last one's carrier is stopped, or it draws its clip over this one: casebook rule 36)
    const L = this.P.techs.get('launch');
    if (L?.active && L.o?.tag?.startsWith('kick.')) L.o.time = 0;
    this.stepIn(c);
  }

  /** A fist reaches 0.6 m, not a blade's length: an upper-body blow begun near something steps in to it (Arkham's freeflow), so the
   *  fist lands on it rather than in the air before it. The step is the core's own ground deceleration run backward: v = sqrt(2 a d). */
  stepIn(c) {
    const P = this.P, g = this.game;
    if (!P.grounded) return;
    const f = _b.set(Math.sin(c.yaw), 0, Math.cos(c.yaw));
    const m = magnet(g, P, f, { range: STEP.range, cone: 0.6 });
    if (!m) return;
    const gap = Math.min(STEP.max, Math.max(0, m.dist - m.r - STEP.stand));
    const want = Math.sqrt(2 * T.movement.groundDecel * gap), have = P.vel.x * f.x + P.vel.z * f.z;
    if (want > have + 0.2) P.impulse(f.multiplyScalar(want - Math.max(0, have)).clone(), 'brush');
  }

  /** A whole-body move carried by Launch: the kick's own root rules (`rise`, `squat`, `turn`) laid over the engine's. */
  lift(c) {
    const L = this.P.techs.get('launch'), def = c.def;
    if (def.body !== 'whole' || !L?.o || L.o.tag !== c.tag) return;
    const C = this.game.character.clips, clip = C.clips[def.clip], H0 = clip.p[1];
    if (def.squat) L.o.poseFix = (pose) => { pose.p[1] = Math.min(pose.p[1], H0); };
    if (def.rise) {
      const R = rootOf(C, def.clip), e = (t) => def.rise * Math.max(0, R.at(t, _b).y);
      L.o.gravity = 0;
      L.o.drive = (vel, dt) => {
        if (this.moves.cur !== c) return;
        const t1 = c.t + dt * (def.rate || 1);
        vel.x *= 0.8; vel.z *= 0.8; vel.y = (e(t1) - e(c.t)) / Math.max(1e-4, dt);
      };
      L.o.poseFix = (pose) => { R.at(c.t, _a); pose.p[0] -= _a.x; pose.p[2] -= _a.z; pose.p[1] = Math.min(pose.p[1], H0); };
    }
    if (def.turn) {
      const fix = L.o.poseFix, hip = C.index.spine ?? 0;
      L.o.poseFix = (pose) => {
        fix?.(pose);
        if (!c.turned) return;
        // (the hips' turn taken out of the pose, and given to the facing: the same body, standing the way it ended)
        _q2.setFromAxisAngle(UP, -c.turned);
        _q.fromArray(pose.q, hip * 4).premultiply(_q2).toArray(pose.q, hip * 4);
        _a.set(pose.p[0], 0, pose.p[2]).applyQuaternion(_q2); pose.p[0] = _a.x; pose.p[2] = _a.z;
      };
    }
  }

  /** How far round the clip's hips have turned at clip time t from its first frame, about the vertical (radians, + to their left). */
  turnOf(name, t) {
    const C = this.game.character.clips, hip = C.index.spine ?? 0, p = (this._tp ||= C.pose());
    const yaw = (u) => { C.sample(name, u, p, false); _a.set(0, 0, 1).applyQuaternion(_q.fromArray(p.q, hip * 4)); return Math.atan2(_a.x, _a.z); };
    const d = yaw(t) - yaw(0);
    return Math.atan2(Math.sin(d), Math.cos(d));
  }

  onUpdate(c, dt) {
    this.parryT += dt;
    if (this.parryT <= PARRY_TO && !this.parried) this.tryParry(c);
    const tr = c.def.track;
    if (tr && c.def.hit && c.phase !== 'fall' && c.t >= tr.strike[0] - 0.03 && c.t <= tr.strike[1] + 0.05) this.shove(c);
  }

  onHit(kind, ent) {
    this.hits++;
    if (kind === 'pot' && ent.alive && ent.body?.isDynamic?.() && !ent.carried) this.push(ent.body, ent.body.mass(), null);
    sfx.thunk?.(1, 3);
  }

  onEnd(c) {
    this.flush();
    if (!c.def.turn || c.def.body !== 'whole') return;
    // the roundhouse ends turned: the facing takes the turn, the pose gives it back (identical on screen, and nothing unwinds)
    c.turned = this.turnOf(c.def.clip, c.t);
    const P = this.P, L = P.techs.get('launch');
    P.bodyYaw = c.yaw + c.turned;
    if (L?.o?.tag === c.tag) L.o.yaw = P.bodyYaw;
  }

  reset() { this.moves.cancel(); this.flush(); }

  /** `kick.hit { hits }` once a move, with what it struck (the ledger's kicks and the best kick: tracking.js). */
  flush() { if (this.hits) this.game.events?.emit('kick.hit', { hits: this.hits }); this.hits = 0; }

  /** Where the striking limb's tip is (world): the end bone, past it along the bone before it. */
  tip(limb, out) {
    const B = this.game.character?.bones, [m, e] = LIMB[limb] || LIMB.R;
    if (!B?.[m] || !B[e]) return null;
    B[m].getWorldPosition(_a); B[e].getWorldPosition(out);
    return out.addScaledVector(_a.sub(out).normalize(), limb.startsWith('foot') ? -0.05 : -0.12);
  }

  /** The arc's two ends while the move is in its strike (the trail asks every frame; false between strikes). */
  segment(a, b) {
    const c = this.moves.cur, tr = c?.def.track, B = this.game.character?.bones;
    if (!tr || !B || c.def.ribbon === false || c.phase === 'fall' || c.t < tr.strike[0] - 0.04 || c.t > tr.strike[1] + 0.04) return false;
    const [m, e] = LIMB[tr.limb] || LIMB.R;
    B[m].getWorldPosition(a); B[e].getWorldPosition(b);
    if (tr.limb.startsWith('foot')) a.lerp(b, 0.45);
    else { a.lerp(b, 0.55); b.addScaledVector(_a.subVectors(b, a), 0.4); }
    return true;
  }

  /** What melee.js does not sweep: crates and props (`level.dynamic`) shoved, and targets rung, by the limb's tip, once a move each. */
  shove(c) {
    const g = this.game, R = this.cfg.radius * 0.75, at = this.tip(c.def.track.limb, _b);
    if (!at) return;
    for (const e of g.level?.dynamic || []) {
      if (this.shoved.has(e) || !e.body?.isDynamic?.() || e.carried || !e.body.isValid()) continue;
      const t = e.body.translation();
      if (Math.hypot(t.x - at.x, (t.y - at.y) * 0.8, t.z - at.z) > R + (e.size || 0.5) * 0.5) continue;
      this.shoved.add(e); this.hits++;
      this.push(e.body, e.body.mass(), e.carry, c.def.hit.power);
    }
    if (!this.shoved.has('target') && g.movers?.hitTargetsNear(at.clone(), R, { cause: 'kick' })) { this.shoved.add('target'); this.hits++; }
  }

  /** A shove, the kick's as it always was: along the facing, a little up, the heavy ones capped. */
  push(body, mass, kind, power = 1) {
    const cfg = this.cfg, c = this.moves.cur, yaw = c?.yaw ?? this.P.bodyYaw;
    const dir = _a.set(Math.sin(yaw), 0, Math.cos(yaw));
    const k = Math.min(mass * cfg.launch * power, kind === 'heavy' ? cfg.heavyCap : 1e9);
    this.game.physics.kick(body, dir.clone().multiplyScalar(k).addScaledVector(UP, Math.min(mass * 2.2, k * 0.5)), body.translation());
  }

  /** A projectile coming in near the strike: sent back where they look (the rule is parry.js's, shared with the blade). */
  tryParry(c) {
    const P = this.P, cfg = this.cfg, at = _b.set(Math.sin(c.yaw), 0, Math.cos(c.yaw)).multiplyScalar(0.85).add(P.pos).setY(P.pos.y + 0.75);
    if (deflect(this.game, { at, radius: cfg.parryRadius, speedMin: cfg.parrySpeed, outMin: cfg.parryOut, assist: cfg.parryAssist, iframes: cfg.parryIframes, tool: 'kick' })) this.parried = true;
  }

  /** The upper-body moves over the core's animation (the whole-body ones are Launch's); standing, their legs too. */
  animate(ch, base, dt) {
    if (this.w < 0.005) return;
    const C = ch.clips, m = this.moves.pose(C, (this.buf ||= C.pose()));
    if (m && m.w > 0.001) C.blend(base, m.pose, this.w * m.w, ch.MASK_UPPER, 0);
    this.moves.legs(ch, base, this.w, dt);
  }

  label() { return 'KICK'; }
}
