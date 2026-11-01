// ---------------------------------------------------------------------------------------
// A STRAW FIGHTER'S MIND (docs/plans/FIGHTER.md 5): what one of the Arena's foes presses, as a controller would. A plain state machine,
// not the creatures' utility reasoner (creatures/ai/): a fighter's choices are a frame's, and its level is Melee's CPU level, a dial on
// how quick and how sure each habit is. It reads the fighter it plays and the Courier, and writes an intent in the kernel's own shape
// (fighter/kernel.js), so it can do nothing a player could not.
//   on stage     walk or dash at the Courier; in reach, a jab string, a tilt, a smash, a grab of a shield; under one in the air, an
//                up aerial; a blow coming, the shield (or a spot dodge, higher up); never off the edge on its own
//   held         mash out
//   struck       DI the launch away from the nearest blast line (survival DI), SDI out of a long hitlag
//   tumbling     a tech before the floor (in place or a roll), or a getup after a knockdown
//   off stage    back: drift in, the double jump below the ledge, the up special (or the hook's tether from afar) to it
//   on the ledge a getup, after a beat
//   training     the lectern's say: stand, shield, or jump (nothing else)
// The level: reaction frames 30 - 3 x level (Melee's level 9 reacts in a few), the shield, tech, DI and recovery each a chance that
// grows with it, smashes and grabs from level 3 up.
//
// Prior art: Melee's CPU levels (1 to 9: reaction and habits by level, SmashWiki's CPU page); the Primid's walk-at-you of Subspace
// Emissary (dummymind.js, the Brawl's); a fighting game's input-reading AI (the kernel takes its presses as it takes a pad's).
//
//   const M = new FoeMind(foe, kit)   M.intent() -> I   M.level (1..9, the kit's)
// ---------------------------------------------------------------------------------------
import { stream } from '../../../core/rng.js';
import { KIT } from './moves.js';
const rand = stream('world/strawmanwell/fighter/foemind'); // (the simulation's chance: core/rng.js, the same twice)

const blank = () => ({ x: 0, y: 0, jump: false, jumpP: false, atkP: false, smashP: false, smashH: false, specP: false, shieldH: false, shieldP: false, grabP: false, downP: false, tapX: 0, dirP: null, mash: false });

export class FoeMind {
  constructor(foe, kit) { this.foe = foe; this.kit = kit; this.wait = 0; this.plan = null; this.hold = 0; this.lastSt = null; this.shieldT = 0; }
  get level() { return this.kit.level; }
  chance(per) { return rand() < Math.min(0.97, per * this.level); }

  intent() {
    const F = this.foe.F, T = this.kit.courier, St = this.kit.stage, I = blank(), L = this.level;
    if (F.st !== this.lastSt) { this.lastSt = F.st; this.stF = 0; } else this.stF++;
    const train = this.kit.training;
    if (train !== 'off') return this.trainee(F, I, train);
    if (!T || !F.live) return I;
    const react = Math.max(2, 30 - 3 * L), dx = T.x - F.x, adx = Math.abs(dx), dy = T.y - F.y, toward = Math.sign(dx) || F.face;
    const mid = (St.x0 + St.x1) / 2, onStage = F.x > St.x0 - 0.1 && F.x < St.x1 + 0.1 && F.y > St.top - 0.6;
    // held: mash; struck: DI away from the nearest blast line, SDI in a long hitlag
    if (F.st === 'held') { I.mash = this.chance(0.07); return I; }
    if (F.hl > 0 && F.launch) {
      if (this.chance(0.09)) { const inward = Math.sign(mid - F.x) || 1; I.x = inward * 0.7; I.y = 0.7; }
      if (F.hlFull > 6 && this.stF % 3 === 0 && this.chance(0.05)) I.dirP = [Math.sign(mid - F.x) || 1, 1];
      return I;
    }
    // tumbling toward the floor: a tech (a shield press a few frames before it)
    if ((F.st === 'hitstun' || F.tumble) && F.vy < 0 && !this.teched) {
      const floor = St.top, gap = F.y - floor;
      if (gap > 0 && gap < 0.9 && F.x > St.x0 && F.x < St.x1) { this.teched = true; if (this.chance(0.1)) { I.shieldP = true; if (rand() < 0.5) I.x = rand() < 0.5 ? -1 : 1; } }
    }
    if (F.grounded) this.teched = false;
    if (F.st === 'down') { if (this.stF > KIT.downBounce + react) { const r = rand(); if (r < 0.3) I.atkP = true; else if (r < 0.6) { I.tapX = rand() < 0.5 ? -1 : 1; I.x = I.tapX; } else I.jumpP = true; } return I; }
    if (F.st === 'ledge') { if (this.stF > 10 + react * 2) { const r = rand(); if (r < 0.4) I.dirP = [0, 1]; else if (r < 0.6) I.jumpP = true; else if (r < 0.8) I.shieldP = true; else I.atkP = true; } return I; }
    if (F.st === 'hold') { if (this.stF > 8 + react) { const out = F.x < mid ? -1 : 1; I.dirP = rand() < 0.5 ? [out, 0] : [0, rand() < 0.5 ? 1 : -1]; } return I; }
    if (!onStage && !F.grounded) return this.recover(F, I, St, mid);
    // a blow coming: the shield, or a spot dodge
    const threat = T.st === 'attack' && T.move && T.mf < T.move.active[1] && adx < 1.9 && Math.abs(dy) < 1.6;
    if (F.shielding) { this.shieldT--; I.shieldH = this.shieldT > 0 || threat; return I; }
    if (threat && F.grounded && this.chance(0.07) && (this.wait <= 0)) { I.shieldH = true; I.shieldP = true; this.shieldT = 12 + react; this.wait = react; if (L >= 7 && rand() < 0.25) { I.downP = true; } return I; }
    this.wait--;
    if (this.wait > 0) return this.carry(I);
    this.wait = react + Math.round(rand() * react);
    // in the air near it: an aerial
    if (!F.grounded) {
      I.x = toward * 0.8;
      if (adx < 1.4 && Math.abs(dy) < 1.4 && this.chance(0.08)) { I.atkP = true; I.x = dx * F.face > 0 ? toward : -toward; I.y = dy > 0.6 ? 1 : dy < -0.6 ? -1 : 0; }
      return this.keep(I);
    }
    // in reach: a jab string, a tilt, a smash, a grab
    if (adx < 1.25 && Math.abs(dy) < 0.9) {
      const r = rand();
      if (F.face !== toward) { I.atkP = true; I.x = toward; return I; } // (behind it: the forward tilt, turned)
      if (T.shielding && this.chance(0.08)) I.grabP = true;
      else if (r < 0.32) { I.atkP = true; this.plan = { jab: 2 }; }
      else if (r < 0.48) { I.atkP = true; I.x = toward; }
      else if (r < 0.58) { I.atkP = true; I.y = -1; }
      else if (r < 0.68 && L >= 3) { I.smashP = true; I.x = toward; this.hold = Math.round(rand() * 20 * L / 9); }
      else if (r < 0.76 && L >= 3) I.grabP = true;
      else if (r < 0.84) { I.atkP = true; I.y = 1; }
      return I;
    }
    // under it in the air: up air
    if (adx < 1.0 && dy > 1.0 && dy < 3 && this.chance(0.06)) { I.jumpP = true; this.plan = { aerial: 'up', at: 8 }; return I; }
    // at it: walk, or dash from afar; never over the edge on its own
    const edge = F.x + toward * 1.2 < St.x0 + 0.4 || F.x + toward * 1.2 > St.x1 - 0.4;
    if (!edge || adx > 0.6) {
      I.x = edge ? 0 : toward;
      if (adx > 4 && !F.running) this.plan = { dash: toward, n: 0 };
    }
    this.goal = I.x;
    return I;
  }

  /** What was planned keeps being pressed between decisions (a walk, a dash's two taps, a jab string, a charge, an aerial off a jump). */
  carry(I) {
    const F = this.foe.F, p = this.plan;
    if (this.goal) I.x = this.goal;
    if (this.hold > 0) { this.hold--; I.smashH = true; }
    if (p?.dash) { p.n++; if (p.n === 1 || p.n === 3) I.tapX = p.dash; I.x = p.dash; if (p.n > 3) this.plan = null; }
    if (p?.jab && F.st === 'attack' && /^jab/.test(F.m) && F.mf > F.move.active[1]) { I.atkP = true; if (--p.jab <= 0) this.plan = null; }
    if (p?.aerial && !F.grounded && --p.at <= 0) { I.atkP = true; I.y = 1; this.plan = null; }
    if (p?.aerial) I.jump = true;
    if (Math.abs(F.x - (this.kit.stage.x0 + this.kit.stage.x1) / 2) > (this.kit.stage.x1 - this.kit.stage.x0) / 2 - 0.6 && F.grounded && Math.sign(I.x) === Math.sign(F.x - (this.kit.stage.x0 + this.kit.stage.x1) / 2)) I.x = 0; // (the edge: stop)
    return I;
  }
  keep(I) { this.goal = I.x; return I; }

  /** Off the stage: back toward it, the double jump below the ledge, then the up special (or the tether from afar). */
  recover(F, I, St, mid) {
    const toward = Math.sign(mid - F.x) || 1, edgeX = toward > 0 ? St.x0 : St.x1, far = Math.abs(F.x - edgeX), below = St.top - F.y;
    I.x = toward;
    if (!this.chance(0.07) && rand() < 0.02) return I; // (a low level now and then forgets itself)
    if (F.airJumps > 0 && F.vy < 0.5 && (below > -0.3 || far > 2.5) && F.st === 'air') { I.jumpP = true; I.jump = true; return I; }
    if (F.st === 'air' && F.airJumps <= 0 && F.vy < 0) {
      if (far > 2.2 && Math.abs(below - 0.8) < 1.6 && F.face === toward) { I.specP = true; I.x = toward; return I; } // (the hook's tether)
      if (below > -0.6) { I.specP = true; I.y = 1; I.x = toward * 0.4; return I; } // (the up special)
    }
    return I;
  }

  /** The training lectern's say: stand, shield, or jump. */
  trainee(F, I, mode) {
    if (F.st === 'held') return I;
    if (mode === 'shield' && (F.grounded || F.shielding)) { I.shieldH = true; I.shieldP = this.stF === 0 && F.st !== 'shield'; }
    if (mode === 'jump' && F.grounded && F.st === 'idle' && this.stF % 50 === 20) { I.jumpP = true; I.jump = true; }
    if (F.st === 'ledge' && this.stF > 40) I.dirP = [0, 1];
    if (F.st === 'down' && this.stF > KIT.downBounce + 20) I.jumpP = true;
    if (!F.grounded && F.st === 'air' && (F.x < this.kit.stage.x0 || F.x > this.kit.stage.x1)) return this.recover(F, I, this.kit.stage, (this.kit.stage.x0 + this.kit.stage.x1) / 2);
    return I;
  }
}
