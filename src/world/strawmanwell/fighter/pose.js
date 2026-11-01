// ---------------------------------------------------------------------------------------
// THE FIGHTER'S KEY POSES ON THE COURIER (docs/plans/KEY-POSES.md 2, 3, 5; FIGHTER.md 6): how the Courier is drawn in the Arena, the
// key-pose way, from the clips the suite already has (CLAUDE.md: an existing clip for every movement).
//   a move     three key poses read off its clip (moves.js POSES): the lead-in, the strike and the follow-through, at the clip's own
//              moments (tools/melee.js measureSwing: the strike is the stretch round the limb's fastest; the lead-in a beat before it,
//              the follow-through a beat after). Held on the move's own frames, not the clip's clock: the lead-in through the startup,
//              the strike snapped to on the first active frame and held through the active ones, the follow-through held through the
//              recovery, each snapped into by platformfighter.js's SNAP (fillKeys' rule), let go over the last 4. A smash's charge holds
//              the lead-in. Gameplay never reads this: the boxes are the move's data (moves.js BOXES). A kit's set with Calissa's key
//              table ('fighter.brawler', 'fighter.sondelass': courier/anim/keyposes.js keysOf) takes each beat's still from its key
//              (the clip frame with its `fix` laid over: the Falcon Knee, the Rider Kick, the dropkick as their references hold them)
//   a state    held (moves.js HOLDS): the jumpsquat and the landing a crouch, the shield the block, the ledge the hang, a knockdown on
//              the belly; a dodge, a getup or a roll played through its own frames
//   hitlag     the character's own hold (courier/character.js `hold`, asked by the kit once on the hit frame, kit.js): the pose frozen as
//              it was on the next animate and held its frames of game time, the drawn body shaken (victim only) side to side on the
//              ground, up and down in the air, decaying; the hurt capsule never moves
// The layer rides on the Courier's techs as a passive one of the kit's own (courier/moves/techs.js's contract: blended over the core's
// animation, the body's facing held to the fighter's), added on entering the Arena and taken off on leaving.
//
// Prior art: Sakurai's three-beat attack and his hitstop shake (Famitsu columns; KEY-POSES.md's table), Guilty Gear Xrd's held key
// frames over a full-rate world, Skullgirls' snap into the key pose; the house's squash (courier/anim/squash.js) and hurt (anim/hurt.js).
//
//   const L = new CourierPose(kit)   L.tech(player) -> the passive tech (added to player.techs)   L.animate(ch, base, dt)
//   L.legs (the feet are the pose's: no foot IK)
// ---------------------------------------------------------------------------------------
import { Tech } from '../../../courier/moves/techs.js';
import { measureSwing } from '../../../tools/melee.js';
import { DODGE, SHIELD, TECH, LEDGE, SNAP } from '../../../progress/platformfighter.js';
import { POSES, HOLDS, KIT } from './moves.js';
import { moveOf } from './fighterstate.js';
import { KeyTrack, keysOf, registerKeys } from '../../../courier/anim/keyposes.js';
import { FIGHTER_BRAWLER_KEYS, FIGHTER_SONDELASS_KEYS, FIGHTER_LOCKHEART_KEYS } from '../../../courier/anim/keys/index.js';

// (Calissa's key tables for the kits' sets, KEY-POSES.md 6: their timing the kit's own frames below, so no fill)
registerKeys('fighter.brawler', FIGHTER_BRAWLER_KEYS); registerKeys('fighter.sondelass', FIGHTER_SONDELASS_KEYS); registerKeys('fighter.lockheart', FIGHTER_LOCKHEART_KEYS); registerKeys('fighter.lockheart', FIGHTER_LOCKHEART_KEYS);
const SETS = { unarmed: 'fighter.brawler', sondelass: 'fighter.sondelass', lockheart: 'fighter.lockheart' };
const setOf = (kit) => SETS[kit?.tool] || null;

const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const EASE = { lead: SNAP.lead + 1, strike: SNAP.strike + 1, follow: SNAP.follow + 1, out: 4 }; // (the snaps into each key: platformfighter.js SNAP, KEY-POSES.md 6)

/** The kit's passive tech on the Courier: its layer of poses, the body's facing held to the fighter's, the feet left to the pose. */
class FighterPoseTech extends Tech {
  constructor(mgr, L) { super(mgr, 'fighterPose'); this.passive = true; this.L = L; }
  usable() { return false; } // (no fixed step of its own: the kit's runs through the frame)
  get engaged() { return !!this.L.kit.on; }
  get keepsLegs() { return this.L.legs; }
  get overrides() { return this.L.legs ? 1 : 0; }
  faceYaw() { // (a back special drawn turned away: its strike is behind, fightertoolkits.js)
    const F = this.L.kit.courier; if (!this.L.kit.on || !F) return null;
    const face = F.st === 'attack' && F.m === 'bspecial' ? -F.face : F.face;
    return face > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  label() { const F = this.L.kit.courier; return this.L.kit.on && F ? F.st.toUpperCase() : ''; }
  animate(ch, base, dt) { this.L.animate(ch, base, dt); }
  tick() { this.L.kit.watch?.(); }
}

export class CourierPose {
  constructor(kit) { this.kit = kit; this.keys = new Map(); this.legs = false; }
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
    this.A ||= C.pose(); this.B ||= C.pose();
    const w = this.target(F, ch, C);
    this.legs = w > 0.5;
    if (w > 0.001) {
      const px = base.p[0], pz = base.p[2];
      C.blend(base, this.A, w);
      base.p[0] = px; base.p[2] = pz; // (the clip's root travel stays the capsule's: the body never walks off its own place)
    }
  }

  /** A move with a key table (Calissa's, courier/anim/keys/fighterkits.js): each beat's still the key's own (its clip frame and its
   *  `fix`, KeyTrack.keyPose), held on the move's frames as seq's: the lead through the startup, the strike keys through the active
   *  frames (more than one, as the barrage's flurry: each its own `hold` in turn, looped), the follow through the recovery. */
  keyed(KK, C, frame, startup, a1, total, loops = 0) {
    const A = this.A, B = this.B, T = (this.kt ||= new KeyTrack(C));
    const lead = KK.find((k) => k.pose === 'lead') || KK[0], follow = KK.find((k) => k.pose === 'follow') || KK[KK.length - 1];
    const hits = KK.filter((k) => k !== lead && k !== follow), strike = hits.length ? hits : [follow];
    if (frame < startup) { T.keyPose(lead, A); return smooth((frame + 1) / EASE.lead); }
    if (frame <= a1) {
      let i = 0;
      if (strike.length > 1) { const per = strike.map((k) => Math.max(1, (k.hold | 0) + (k.snap | 0) || 4)), n = per.reduce((a, b) => a + b, 0); let t = (loops * (a1 - startup + 1) + frame - startup) % n; while (t >= per[i]) t -= per[i++]; }
      const first = !i && !loops, prev = first ? lead : strike[(i + strike.length - 1) % strike.length], into = frame - startup;
      T.keyPose(prev, A); C.blend(A, T.keyPose(strike[i], B), first ? smooth((into + 1) / EASE.strike) : 1); return 1;
    }
    T.keyPose(strike[strike.length - 1], A); C.blend(A, T.keyPose(follow, B), smooth((frame - a1) / EASE.follow));
    return 1 - smooth((frame - (total - EASE.out)) / EASE.out);
  }

  /** Into this.A: the pose the fighter's state wants; returns its weight (0: the core's own animation). */
  target(F, ch, C) {
    const A = this.A, B = this.B, st = F.st;
    const seq = (id, frame, startup, a1, total) => {
      const set = setOf(F.kit), KK = set && keysOf(set, id), own = F.kit?.poses?.[id];
      if (KK && (!own || KK.some((k) => k.clip === own.clip))) return this.keyed(KK, C, frame, startup, a1, total, F.loops || 0); // (a key table's slot, unless the loadout put another move's clip there)
      const P = F.kit?.poses?.[id] || POSES[id]; if (!P) return 0; // (a tool's own clip for the slot, else the bare set's)
      const K = this.keyTimes(ch, P.clip, P.limb); if (!K) return 0;
      if (frame < startup) { C.sample(P.clip, K.lead, A, false); return smooth((frame + 1) / EASE.lead); }
      if (frame <= a1) { C.sample(P.clip, K.lead, A, false); C.blend(A, C.sample(P.clip, K.strike, B, false), smooth((frame - startup + 1) / EASE.strike)); return 1; }
      C.sample(P.clip, K.strike, A, false); C.blend(A, C.sample(P.clip, K.follow, B, false), smooth((frame - a1) / EASE.follow));
      return 1 - smooth((frame - (total - EASE.out)) / EASE.out);
    };
    if (st === 'attack' && F.m) { const m = moveOf(F.m, F); return seq(F.m, F.mf, m.startup, m.active[1], m.total); }
    if (st === 'throw' && F.m) { const m = moveOf(F.m, F); return seq(F.m, F.f, m.startup, m.active[1], m.total); }
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
}
