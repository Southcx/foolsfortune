// ---------------------------------------------------------------------------------------
// THE FIGHTER'S KEY POSES ON THE COURIER (docs/plans/KEY-POSES.md 2, 3, 5; FIGHTER.md 6): how the Courier is drawn in the Arena, the
// key-pose way, from the clips the suite already has (CLAUDE.md: an existing clip for every movement).
//   a move     three key poses read off its clip (moves.js POSES): the lead-in, the strike and the follow-through, at the clip's own
//              moments (tools/melee.js measureSwing: the strike is the stretch round the limb's fastest; the lead-in a beat before it,
//              the follow-through a beat after). Held on the move's own frames, not the clip's clock: the lead-in through the startup,
//              the strike snapped to on the first active frame and held through the active ones, the follow-through held through the
//              recovery, each snapped into by platformfighter.js's SNAP (fillKeys' rule), let go over the last 4. A smash's charge holds
//              the lead-in. Gameplay never reads this: the boxes are the move's data (moves.js BOXES). A stand-in for Petra's key track
//              (courier/anim/keyposes.js, registerKeys / keysOf, not on this branch yet): the sequences move there when it lands
//   a state    held (moves.js HOLDS): the jumpsquat and the landing a crouch, the shield the block, the ledge the hang, a knockdown on
//              the belly; a dodge, a getup or a roll played through its own frames
//   hitlag     the pose frozen as it was on the frame of the hit (the animation's time held), and the drawn body only shaken: side to
//              side on the ground, up and down in the air, decaying over the freeze; the hurt capsule never moves (squash.js's way: laid
//              on after the frame is posed, taken off before anything reads the body)
// The layer rides on the Courier's techs as a passive one of the kit's own (courier/moves/techs.js's contract: blended over the core's
// animation, the body's facing held to the fighter's), added on entering the Arena and taken off on leaving.
//
// Prior art: Sakurai's three-beat attack and his hitstop shake (Famitsu columns; KEY-POSES.md's table), Guilty Gear Xrd's held key
// frames over a full-rate world, Skullgirls' snap into the key pose; the house's squash (courier/anim/squash.js) and hurt (anim/hurt.js).
//
//   const L = new CourierPose(kit)   L.tech(player) -> the passive tech (added to player.techs)   L.animate(ch, base, dt)   L.shake(ch)
//   L.lift(ch)   L.legs (the feet are the pose's: no foot IK)
// ---------------------------------------------------------------------------------------
import { Tech } from '../../../courier/moves/techs.js';
import { measureSwing } from '../../../tools/melee.js';
import { DODGE, SHIELD, TECH, LEDGE, SNAP } from '../../../progress/platformfighter.js';
import { POSES, HOLDS, KIT } from './moves.js';
import { moveOf } from './fighterstate.js';

const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const EASE = { lead: SNAP.lead + 1, strike: SNAP.strike + 1, follow: SNAP.follow + 1, out: 4 }; // (the snaps into each key: platformfighter.js SNAP, KEY-POSES.md 6)

/** The kit's passive tech on the Courier: its layer of poses, the body's facing held to the fighter's, the feet left to the pose. */
class FighterPoseTech extends Tech {
  constructor(mgr, L) { super(mgr, 'fighterPose'); this.passive = true; this.L = L; }
  usable() { return false; } // (no fixed step of its own: the kit's runs through the frame)
  get engaged() { return !!this.L.kit.on; }
  get keepsLegs() { return this.L.legs; }
  get overrides() { return this.L.legs ? 1 : 0; }
  faceYaw() { const F = this.L.kit.courier; return this.L.kit.on && F ? (F.face > 0 ? Math.PI / 2 : -Math.PI / 2) : null; }
  label() { const F = this.L.kit.courier; return this.L.kit.on && F ? F.st.toUpperCase() : ''; }
  animate(ch, base, dt) { this.L.animate(ch, base, dt); }
  tick() { this.L.kit.watch?.(); }
}

export class CourierPose {
  constructor(kit) { this.kit = kit; this.keys = new Map(); this.legs = false; this.shook = null; this.have = false; }
  tech(P) { return (this.t ||= new FighterPoseTech(P.techs, this)); }

  /** A clip's three key moments (s), measured once. */
  keyTimes(ch, clip, limb) {
    const k = `${clip}|${limb}`; if (this.keys.has(k)) return this.keys.get(k);
    const c = ch.clips.clips[clip]; if (!c) { this.keys.set(k, null); return null; }
    const dur = (c.n - 1) / ch.clips.fps;
    let s0 = dur * 0.3, s1 = dur * 0.5;
    try { const tr = measureSwing(ch, clip, { limb }); if (tr?.strike) [s0, s1] = tr.strike; } catch { /* (no measure: the fractions) */ }
    const out = { lead: Math.max(0, s0 - 0.12), strike: (s0 + s1) / 2, follow: Math.min(dur, s1 + 0.18), dur };
    this.keys.set(k, out); return out;
  }
  /** Measure every move's clip now (on entering the Arena), so no first blow waits on it. */
  warm(ch) { for (const { clip, limb } of Object.values(POSES)) this.keyTimes(ch, clip, limb); }

  animate(ch, base) {
    const F = this.kit.courier, C = ch.clips; if (!F || !this.kit.on) { this.legs = false; return; }
    this.last ||= C.pose(); this.A ||= C.pose(); this.B ||= C.pose();
    if (F.hl > 0 && this.have) { base.copy(this.last); this.legs = true; return; } // (hitlag: the frame of the hit, held)
    const w = this.target(F, ch, C);
    this.legs = w > 0.5;
    if (w > 0.001) {
      const px = base.p[0], pz = base.p[2];
      C.blend(base, this.A, w);
      base.p[0] = px; base.p[2] = pz; // (the clip's root travel stays the capsule's: the body never walks off its own place)
    }
    this.last.copy(base); this.have = true;
  }

  /** Into this.A: the pose the fighter's state wants; returns its weight (0: the core's own animation). */
  target(F, ch, C) {
    const A = this.A, B = this.B, st = F.st;
    const seq = (id, frame, startup, a1, total) => {
      const P = POSES[id]; if (!P) return 0;
      const K = this.keyTimes(ch, P.clip, P.limb); if (!K) return 0;
      if (frame < startup) { C.sample(P.clip, K.lead, A, false); return smooth((frame + 1) / EASE.lead); }
      if (frame <= a1) { C.sample(P.clip, K.lead, A, false); C.blend(A, C.sample(P.clip, K.strike, B, false), smooth((frame - startup + 1) / EASE.strike)); return 1; }
      C.sample(P.clip, K.strike, A, false); C.blend(A, C.sample(P.clip, K.follow, B, false), smooth((frame - a1) / EASE.follow));
      return 1 - smooth((frame - (total - EASE.out)) / EASE.out);
    };
    if (st === 'attack' && F.m) { const m = moveOf(F.m); return seq(F.m, F.mf, m.startup, m.active[1], m.total); }
    if (st === 'throw' && F.m) { const m = moveOf(F.m); return seq(F.m, F.f, m.startup, m.active[1], m.total); }
    if (st === 'grab') return seq('grab', F.f, 7, 8, 30);
    if (st === 'pummel') return seq('pummel', F.f, KIT.pummelAt, KIT.pummelAt + 1, 24);
    if (st === 'getup' && F.getup === 'attack') { const [a0, a1] = KIT.getupAttackAt; return seq('getupAttack', F.f, a0, a1, F.getupN); }
    if (st === 'ledgeup' && F.upKind === 'attack') { const a = Math.round(F.upN * KIT.ledgeAttackAt); return seq('ledgeAttack', F.f, a, a + 3, F.upN); }
    // the held states
    let key = st, N = 0;
    if (st === 'hitstun' || (st === 'air' && F.tumble)) key = F.tumble ? 'tumble' : 'hitstun';
    else if (st === 'tech') { key = F.techDir ? 'techroll' : 'tech'; N = F.techDir ? TECH.getup.roll : TECH.getup.stand; }
    else if (st === 'getup') { key = F.getup === 'roll' ? 'getuproll' : 'getup'; N = F.getupN; }
    else if (st === 'ledgeup') { key = F.upKind === 'roll' ? 'ledgeroll' : F.upKind === 'jump' ? 'ledgejump' : 'ledgeclimb'; N = F.upN; }
    else if (st === 'roll') N = DODGE.roll.total;
    else if (st === 'airdodge') N = DODGE.air.total;
    else if (st === 'shielddrop') N = SHIELD.drop;
    else if (st === 'ledge') N = LEDGE.catch;
    const H = HOLDS[key]; if (!H || !C.clips[H.clip]) return 0;
    if (H.at != null) C.sample(H.clip, H.at, A, false);
    else if (H.span) C.sample(H.clip, H.span[0] + (H.span[1] - H.span[0]) * Math.min(1, F.f / Math.max(1, N || 30)), A, false);
    else C.sample(H.clip, F.f / 60, A, true);
    return smooth((F.f + 1) / EASE.lead);
  }

  /** Hitlag's shake laid on the drawn body (after the frame is posed): the victim's only, decaying over the freeze. */
  shake(ch) {
    const F = this.kit.courier; this.lift(ch);
    if (!F || !(F.hl > 0) || !F.launch || !ch?.root) return;
    const k = F.hl / Math.max(1, F.hlFull), s = (F.hl & 1 ? 1 : -1) * k, [gx, ay] = KIT.shake;
    const d = F.grounded ? { x: gx * s, y: 0 } : { x: 0, y: ay * s };
    ch.root.position.x += d.x; ch.root.position.y += d.y; ch.root.updateMatrixWorld(true);
    this.shook = { ...d, at: ch.root.position.clone() };
  }
  /** The shake taken off (before anything reads the body again): only if the root is still where the shake left it (the next frame's
   *  posing sets it afresh from the feet, and then there is nothing to take off). */
  lift(ch) {
    const d = this.shook; this.shook = null; if (!d || !ch?.root || !ch.root.position.equals(d.at)) return;
    ch.root.position.x -= d.x; ch.root.position.y -= d.y; ch.root.updateMatrixWorld(true);
  }
}
