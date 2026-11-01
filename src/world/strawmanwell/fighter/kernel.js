// ---------------------------------------------------------------------------------------
// THE FIGHTER (docs/plans/FIGHTER.md 4): one platform fighter's state, frame by frame at 60 a real second, the same for the Courier and
// for a straw fighter. Every rule and number is platformfighter.js's (Melee's); the move boxes and the kit's own numbers are moves.js's.
// It reads an intent (a stick and the buttons' presses: the Courier's keys, or a straw fighter's mind) and says how its body should move
// this frame (`mo`): 'free' (the body's own movement: the core movement for the Courier, foebody.js's for a straw fighter, with the
// kit's flags over it), 'vel' (the kit's velocity, moved with collision), 'hold' (not moved) or 'place' (set where the kit says). Being
// struck, launched, teched and knocked down is kernelhurt.js's; the grab, the throws and the ledge are kernelholds.js's.
//   states  idle (stand, walk, run, crouch), jumpsquat, air (and tumble), attack, land, shield, shieldstun, shielddrop, spotdodge, roll,
//           airdodge, fall (special fall), grab, hold, pummel, throw, held, release, hitstun, tech, down, getup, ledge, ledgeup, broken,
//           dizzy, dead, respawn, out
//   intent  { x, y (the stick, -1..1, y up), jump (held), jumpP, atkP, smashP, smashH, specP, shieldH, shieldP, grabP, downP, tapX (a
//           side pressed fresh: -1|0|1), dirP (any direction pressed fresh: [x, y] | null), mash }
//
// Prior art: Melee's action states and the order of a frame (the decomp's ftCommon and ftCo_* state functions: interrupts checked
// first, then physics); Rivals of Aether's and Slippi's readable state names; the house's own techs (one owner of the body at a time).
//
//   const F = new Fighter({ id, team, who, stats, h, r, env })   F.step(I)   F.mo   F.landed()   F.boxes() -> [{ x, y, r }]   F.hurtbox()
//   F.st  F.f  F.m  F.percent  F.stocks  F.shield  F.face  F.hl  F.intan  F.invin   (the state changes: fighter/fighterstate.js)
//   (env: { verb(F, id), shot(F), tryLedge(F, tether?), now: () => frame })
// ---------------------------------------------------------------------------------------
import { FRAME, SHIELD, DODGE, LANDING, LAUNCH, lCancel, TECH, SMASH } from '../../../progress/platformfighter.js';
import { BOXES, BODY, KIT, dirOf, pickGround, pickAir, pickSmash, pickSpecial } from './moves.js';
import { go, startMove, gravity, traction, land, moveOf } from './fighterstate.js';
import { fallLanding, techOrDown, hurtStep, downStep, getupStep, techStep, breakShield } from './kernelhurt.js';
import { startGrab, grabStep, holdStep, pummelStep, throwStep, heldStep, releaseStep, ledgeStep, ledgeUpStep } from './kernelholds.js';

export class Fighter {
  constructor({ id, team, who, stats, h = BODY, r = 0.32, env }) {
    Object.assign(this, { id, team, who, stats, h, r, env });
    this.stocks = 3; this.stale = []; this.now = 0;
    this.respawnAt(0, 0);
  }

  /** A fresh stock (or the match's start): at (x, y), standing, at 0%, the shield whole. */
  respawnAt(x, y) {
    Object.assign(this, {
      x, y, vx: 0, vy: 0, kvx: 0, kvy: 0, grounded: true, face: this.face || 1, crouch: false, percent: 0, shield: SHIELD.max,
      st: 'idle', f: 0, m: null, mf: 0, charge: 0, hits: new Set(), hl: 0, hlFull: 0, launch: null, stun: 0, tumble: false,
      intan: 0, invin: 0, techLock: 0, techAt: -99, lcAt: -99, regrab: 0, fastfall: false, airJumps: this.stats.airJumps, running: false,
      runDir: 0, tapDir: 0, tapAt: -99, ledge: null, victim: null, holder: null, holdN: 0, wd: false, adx: 0, ady: 0, shieldAt: -99,
      lastBy: null, lastAt: -99, combo: 0, mo: { mode: 'free' }, active: false, rehitEvery: 0,
    });
  }

  get live() { return this.st !== 'dead' && this.st !== 'out'; }
  get hittable() { return this.live && this.st !== 'respawn' && this.intan <= 0 && this.invin <= 0; }
  get shielding() { return this.st === 'shield' || this.st === 'shieldstun'; }
  get scale() { return (this.size ?? this.h) / BODY; } // (the boxes' scale: the standing body's, a crouch keeps its reach)
  get move() { return this.m ? moveOf(this.m, this) : null; }

  /** One frame. Sets `mo`, the body's motion for this frame. */
  step(I) {
    this.now++; this.lastIntent = I; this.mo = { mode: 'free', run: false, noJump: false, kick: null, jump: null };
    this.intan = Math.max(0, this.intan - 1); this.invin = Math.max(0, this.invin - 1);
    this.techLock = Math.max(0, this.techLock - 1); this.regrab = Math.max(0, this.regrab - 1);
    if (!this.shielding) this.shield = Math.min(SHIELD.max, this.shield + SHIELD.regen);
    if (I.shieldP) { this.lcAt = this.now; if (this.techLock <= 0 && (this.st === 'hitstun' || this.tumble)) { this.techAt = this.now; this.techLock = TECH.lockout; } }
    if (this.hl > 0) { hurtStep(this, I); return; } // (hitlag: both bodies held, the victim's SDI and DI read: kernelhurt.js)
    this.f++;
    const S = STATES[this.st]; if (S) S(this, I);
    if (this.mo.mode === 'free' && !this.grounded) carry(this, I);
  }

  /** The body touched the ground this frame (after its move). */
  landed() {
    const st = this.st; this.grounded = true; this.fastfall = false; this.airJumps = this.stats.airJumps;
    if (st === 'hitstun' && !this.tumble) this.kvy = Math.max(0, this.kvy); else { this.kvx = 0; this.kvy = 0; } // (a light launch slides on; any other ends at the floor)
    if (st === 'air') { if (this.tumble) return techOrDown(this); return land(this, LANDING.plain); }
    if (st === 'fall') return land(this, KIT.landSpecial);
    if (st === 'airdodge') { // (into the ground: a wavedash, or a waveland onto a platform; its sideways speed kept)
      const wd = this.f <= 12 && Math.abs(this.vx) > 0.8; this.vy = 0;
      if (wd) this.env.verb(this, 'wavedash');
      return land(this, DODGE.air.landing, { slide: true });
    }
    if (st === 'attack') {
      const m = this.move;
      if (m.landing) { // (an aerial: its own lag, none inside its auto-cancel windows, halved by an L-cancel)
        const auto = (m.autoCancel || []).some(([a, b]) => this.mf >= a && this.mf <= b);
        const lc = !auto && this.now - this.lcAt <= LANDING.lCancelWindow;
        if (lc) this.env.verb(this, 'lCancel');
        return land(this, auto ? LANDING.plain : lc ? lCancel(m.landing) : m.landing);
      }
      if (this.m === 'uspecial' || this.m === 'sspecial') return land(this, KIT.landSpecial);
      if (m.special) return land(this, LANDING.plain);
    }
    if (st === 'hitstun') { if (this.tumble) return techOrDown(this); this.vy = 0; return; }
    if (st === 'broken') return fallLanding(this);
  }

  /** The body left the ground this frame without jumping (walked off, slid off). */
  leftGround() {
    this.grounded = false;
    const st = this.st;
    if (st === 'idle' || st === 'land' || st === 'shield' || st === 'shielddrop' || st === 'shieldstun' || st === 'spotdodge' || st === 'roll') go(this, 'air');
    else if (st === 'attack' && !this.move?.landing && !this.move?.special) go(this, 'air');
  }

  /** This frame's hit boxes in the world (only while a move is active and this body is not held in hitlag by its own hit's freeze). */
  boxes() {
    if (!this.active || !this.m) return [];
    const B = this.kit?.boxes?.[this.m] || BOXES[this.m] || [], k = this.scale, out = this.kit?.reach || 1; // (a tool's reach pushes its boxes out: fighterkits.js)
    return B.map(([ox, oy, r]) => ({ x: this.x + ox * out * k * this.face, y: this.y + oy * k, r: r * k * Math.sqrt(out) }));
  }
  /** The hurt capsule: a vertical segment and its radius. */
  hurtbox() { const r = this.r; return { x: this.x, y0: this.y + r, y1: this.y + Math.max(r, this.h - r), r }; }
}

// ---------------------------------------------------------------------------------------------------------------- helpers
/** The kit moves the body by its own velocity this frame (with collision). */
const vel = (F) => { F.mo.mode = 'vel'; };
const hold = (F) => { F.mo.mode = 'hold'; F.vx = 0; F.vy = 0; };
const side = (I) => (Math.abs(I.x) > KIT.stick ? Math.sign(I.x) : 0);

/** A launch still carrying the body after hitstun (Melee's knockback velocity decays on its own, whatever the body does): while it
 *  lasts the kit moves the body in the air, its own drift and gravity under the launch, its double jump the kit's too. */
function carry(F, I) {
  const sp = Math.hypot(F.kvx, F.kvy); if (sp < 0.05) { F.kvx = F.kvy = 0; return; }
  if (F.mo.kick) { F.kvx = F.kvy = 0; return; } // (the up special takes the body: the launch is let go)
  const ns = Math.max(0, sp - LAUNCH.decay * FRAME); F.kvx *= ns / sp; F.kvy *= ns / sp;
  const S = F.stats, want = I.x * S.walkSpeed * S.airSpeed, acc = S.airAccel * FRAME;
  F.vx += Math.max(-acc, Math.min(acc, want - F.vx));
  if (F.mo.jump === 'air' && F.airJumps > 0) { F.vy = S.jumpVelocity * S.airJumpMult; F.kvy = Math.max(0, F.kvy); if (F.who === 'courier') F.airJumps--; F.mo.jumped = true; }
  gravity(F);
  F.mo.mode = 'vel'; F.mo.vx = F.vx + F.kvx; F.mo.vy = F.vy + F.kvy; F.mo.jump = null;
}

// ---------------------------------------------------------------------------------------------------------------- the states
function idle(F, I) {
  if (!F.grounded) { go(F, 'air'); return air(F, I); }
  const sx = side(I);
  if (I.tapX) { if (F.tapDir === I.tapX && F.now - F.tapAt <= KIT.dashTap) { F.running = true; F.runDir = I.tapX; } F.tapDir = I.tapX; F.tapAt = F.now; }
  if (!sx || sx !== F.runDir) F.running = false;
  if (sx) F.face = sx; // (turned at once on the ground: Melee takes a few frames, ours none)
  F.crouch = I.y < -0.5 && !sx;
  F.airJumps = F.stats.airJumps;
  if (I.shieldH && (I.downP || (I.shieldP && I.y < -0.5))) return dodge(F, 'spotdodge');
  if (I.shieldH && I.tapX && !I.shieldP) return roll(F, I.tapX); // (a side tapped with the shield held; a shield pressed while walking is a shield)
  if (I.grabP) return startGrab(F);
  if (I.shieldH) return shieldUp(F, I.shieldP);
  if (I.smashP) { if (sx) F.face = sx; return smash(F, pickSmash(I, F)); }
  if (I.specP) { if (sx) F.face = sx; return startMove(F, pickSpecial(I, F)); }
  if (I.atkP) { const id = pickGround(I, F); if (sx && id !== 'dash') F.face = sx; return startMove(F, id); }
  if (I.jumpP) return jumpsquat(F);
  F.mo.run = F.running;
}

function smash(F, id) { startMove(F, id); }
function shieldUp(F, fresh) { go(F, 'shield'); F.shieldAt = fresh ? F.now : -99; F.env.verb(F, 'shield'); F.vy = 0; } // (a powershield wants a fresh press: kernelhurt.js)
function dodge(F, st) { go(F, st); F.env.verb(F, st === 'spotdodge' ? 'spotDodge' : 'roll'); F.vx = 0; }
function roll(F, dir) { dodge(F, 'roll'); F.rollDir = dir; }
function jumpsquat(F) { go(F, 'jumpsquat'); F.wd = false; F.jsN = Math.max(1, Math.round(F.stats.jumpsquat / FRAME)); }

function jumpsquatS(F, I) {
  traction(F); vel(F);
  if (I.shieldP) F.wd = true; // (a dodge pressed in the crouch comes out on the first frame in the air: the wavedash)
  if (I.grabP) return startGrab(F); // (the jump-cancelled grab)
  if (I.smashP && dirOf(I, F) === 'up') return smash(F, 'usmash'); // (the up smash out of the crouch)
  if (I.specP && dirOf(I, F) === 'up') return startMove(F, 'uspecial');
  if (F.f < F.jsN) return;
  // the take-off: a short hop if Space was let go inside the crouch, a full hop if held (FIGHTER.md 2)
  const full = I.jump, v = F.stats.jumpVelocity * (full ? 1 : Math.sqrt(F.stats.shortHop));
  if (!full) F.env.verb(F, 'shortHop');
  F.vx = F.vx * KIT.hopKeep + I.x * F.stats.walkSpeed * KIT.jumpH; F.vy = v; F.grounded = false;
  go(F, 'air'); F.mo.mode = 'vel'; F.mo.takeoff = true;
  if (F.wd) { F.wd = false; F.queueDodge = true; }
}

function air(F, I) {
  if (F.grounded && F.vy <= 0 && F.f > 1) { go(F, 'idle'); return; }
  if (F.queueDodge) { F.queueDodge = false; return airdodge(F, I); }
  if (I.downP && F.vy <= 0 && !F.fastfall) { F.fastfall = true; F.env.verb(F, 'fastFall'); }
  if (F.env.tryLedge(F)) return;
  if (I.shieldP && !(F.tumble && F.env.floorGap(F) < KIT.techNear)) return airdodge(F, I); // (tumbling near the floor, Shift is the tech's)
  if (I.atkP || I.smashP) { F.tumble = false; return startMove(F, pickAir(I, F)); }
  if (I.specP) { F.tumble = false; return startMove(F, pickSpecial(I, F)); }
  if (I.jumpP && F.airJumps > 0) { F.tumble = false; F.fastfall = false; F.mo.jump = 'air'; if (F.who !== 'courier') F.airJumps--; }
  // (the Courier's double jump is made by its body (courierbody.js airJump): it spends P.airJumps, read back after the step)
}

function airdodge(F, I) {
  go(F, 'airdodge'); F.tumble = false; F.fastfall = false; F.env.verb(F, 'airDodge');
  const l = Math.hypot(I.x, I.y), on = l > KIT.stick;
  F.adx = on ? (I.x / l) * DODGE.air.speed : 0; F.ady = on ? (I.y / l) * DODGE.air.speed : 0;
  F.vx = F.adx; F.vy = F.ady;
}
function airdodgeS(F, I) {
  const D = DODGE.air;
  F.intan = F.f >= D.intangible[0] && F.f <= D.intangible[1] ? 2 : F.intan;
  if (F.f <= D.intangible[1]) { F.adx *= D.decay; F.ady *= D.decay; F.vx = F.adx; F.vy = F.ady; } // (no gravity while it carries: Melee's)
  else { gravity(F); F.vx *= 0.98; }
  vel(F);
  if (F.f >= D.total) go(F, 'fall');
}

function fall(F, I) {
  if (I.downP && F.vy <= 0 && !F.fastfall) { F.fastfall = true; F.env.verb(F, 'fastFall'); }
  F.env.tryLedge(F);
  F.mo.noJump = true; F.mo.noAct = true;
}

function attack(F, I) {
  const m = F.move; if (!m) return go(F, F.grounded ? 'idle' : 'air');
  const aerial = !!m.landing, mf = F.mf;
  // the charge: held at its charge frame while its button is held (a smash's LMB, a charged special's RMB), up to SMASH.charge frames
  if (m.charge && mf === m.charge && (m.special || m.chargeShot ? I.specH : I.smashH) && F.charge < SMASH.charge) { F.charge++; if (F.charge === 10) F.env.verb(F, 'smash'); }
  else F.mf++;
  const f = F.mf, [a0, a1] = m.active;
  F.active = f >= a0 && f <= a1;
  if (F.rehitEvery && F.active && (f - a0) % F.rehitEvery === 0) F.hits.clear(); // (a multi-hit's next hit)
  if (I.shieldP && aerial) F.lcAt = F.now;
  // what the specials do on their own frames
  if (m.special === 'shot' && f === m.startup) F.env.shot(F);
  if (m.special === 'recover' && f === m.startup) { F.mo.kick = { vx: F.face * KIT.recoverX, vy: F.stats.jumpVelocity * KIT.recover }; F.vx = F.mo.kick.vx; F.vy = F.mo.kick.vy; F.grounded = false; F.fastfall = false; F.mo.noJump = true; F.mo.noAct = true; return; }
  if (m.special === 'hook' && !F.grounded && f >= a0 && f <= a1 && F.env.tryLedge(F, true)) return;
  if (m.special === 'reflect') F.reflecting = f >= KIT.reflect[0] && f <= KIT.reflect[1];
  if (m.special === 'lunge' && f >= a0 && f <= a1) { F.vx = F.face * (m.lunge || 4) / ((a1 - a0 + 1) * FRAME); if (!F.grounded) F.vy = Math.max(F.vy, 0); vel(F); } // (a lunge: its distance over its active frames)
  if (m.special === 'lunge' && f === a1 + 1) F.vx = 0; // (and it stops where it ends: no slide on)
  // a barrage (the brawler's rapid jab): looped while LMB is held, its finisher on the release (Ultimate's)
  if (m.loop && f >= m.loop[1]) { if (I.atkH) { F.mf = m.loop[0] - 1; F.hits.clear(); } else if (m.then) return startMove(F, m.then); }
  // the jab's string: LMB again once the last jab's hit is past
  if ((F.m === 'jab1' || F.m === 'jab2') && I.atkP && f > a1 && (F.m === 'jab1' || moveOf('jab3', F))) return startMove(F, F.m === 'jab1' ? 'jab2' : 'jab3');
  if (F.m === 'uspecial' && f > a1 && F.env.tryLedge(F)) return;
  if (f >= m.total) {
    F.reflecting = false;
    if (F.m === 'uspecial' && !F.grounded) return go(F, 'fall');
    return go(F, F.grounded ? 'idle' : 'air');
  }
  // the body: an aerial drifts and falls as any air state (no jumping out of it); a grounded move slides on its traction
  if (m.special === 'lunge' && f >= a0 && f <= a1) return;
  if (aerial || (!F.grounded && m.special)) { F.mo.noJump = true; F.mo.noAct = true; if (I.downP && F.vy <= 0 && !F.fastfall) { F.fastfall = true; F.env.verb(F, 'fastFall'); } return; }
  traction(F, F.m === 'dash'); vel(F);
}

function landS(F) { traction(F, F.slide); vel(F); if (F.f >= F.lagN) go(F, 'idle'); }

function shieldS(F, I) {
  F.shield -= SHIELD.drain; traction(F); vel(F); F.crouch = false;
  if (F.shield <= 0) return breakShield(F);
  if (I.jumpP) return jumpsquat(F); // (out of shield: the jump)
  if (I.atkP || I.grabP) return startGrab(F); // (out of shield: the grab)
  if (I.specP && dirOf(I, F) === 'up') return startMove(F, 'uspecial');
  if (I.smashP && dirOf(I, F) === 'up') return smash(F, 'usmash');
  if (I.tapX) return roll(F, I.tapX);
  if (I.downP) return dodge(F, 'spotdodge');
  if (!I.shieldH && F.f >= SHIELD.minHold) go(F, 'shielddrop');
}
function shieldstunS(F, I) {
  const k = Math.min(1, F.f / Math.max(1, F.stunN)); F.vx = F.pushV * (1 - k); F.vy = 0; vel(F);
  if (F.f >= F.stunN) go(F, I.shieldH ? 'shield' : 'shielddrop');
}
function shielddropS(F) { traction(F); vel(F); if (F.f >= SHIELD.drop) go(F, 'idle'); }

function spotdodgeS(F) {
  const D = DODGE.spot; F.intan = F.f >= D.intangible[0] && F.f <= D.intangible[1] ? 2 : F.intan; traction(F); vel(F);
  if (F.f >= D.total) go(F, 'idle');
}
function rollS(F) {
  const D = DODGE.roll, moving = Math.round(D.total * 0.8);
  F.intan = F.f >= D.intangible[0] && F.f <= D.intangible[1] ? 2 : F.intan;
  F.vx = F.f <= moving ? (F.rollDir * D.distance * F.scale) / (moving * FRAME) : 0; F.vy = 0; vel(F);
  if (!F.grounded) return go(F, 'air');
  if (F.f >= D.total) { if (F.rollDir === F.face) F.face = -F.face; go(F, 'idle'); } // (a roll forward ends facing back: Melee's)
}

function hitstunS(F) {
  // the launch: its own speed decaying along itself, the body's own gravity under it (platformfighter.js LAUNCH)
  const sp = Math.hypot(F.kvx, F.kvy), ns = Math.max(0, sp - LAUNCH.decay * FRAME);
  if (sp > 1e-6) { F.kvx *= ns / sp; F.kvy *= ns / sp; }
  if (F.grounded) { F.vy = 0; F.kvy = Math.max(0, F.kvy); F.vx *= 0.9; } else gravity(F);
  F.mo.mode = 'vel'; F.mo.vx = F.vx + F.kvx; F.mo.vy = F.vy + F.kvy;
  if (F.f >= F.stun) go(F, F.grounded ? 'idle' : 'air'); // (what is left of the launch still carries: carry, below)
}

function brokenS(F) { gravity(F); vel(F); }
function dizzyS(F) { traction(F); vel(F); if (F.f >= F.dizzyN) go(F, 'idle'); }
function deadS(F) { hold(F); }
function respawnS(F, I) {
  hold(F); F.intan = 2;
  const moved = Math.abs(I.x) > KIT.stick || Math.abs(I.y) > KIT.stick || I.jumpP || I.atkP || I.specP || I.smashP || I.shieldP;
  if ((moved && F.f > 20) || F.f >= KIT.respawnHold) { go(F, 'air'); F.grounded = false; F.invin = KIT.invincible; F.intan = 0; F.airJumps = F.stats.airJumps; }
}
function outS(F) { hold(F); }

const STATES = {
  idle, jumpsquat: jumpsquatS, air, airdodge: airdodgeS, fall, attack, land: landS, shield: shieldS, shieldstun: shieldstunS,
  shielddrop: shielddropS, spotdodge: spotdodgeS, roll: rollS, hitstun: hitstunS, broken: brokenS, dizzy: dizzyS, dead: deadS,
  respawn: respawnS, out: outS, tech: techStep, down: downStep, getup: getupStep,
  grab: grabStep, hold: holdStep, pummel: pummelStep, throw: throwStep, held: heldStep, release: releaseStep,
  ledge: ledgeStep, ledgeup: ledgeUpStep,
};
