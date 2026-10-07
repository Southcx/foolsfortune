// ---------------------------------------------------------------------------------------
// A SIBLING IN A FIGHT: what each does when there is something to fight (Dovina's rulings, docs/plans/COOP.md C6), by temperament:
//
//   petra    caution   keeps within 4 m of you, strikes what comes that close, and parries a blow aimed at you (the cutlass's guard)
//   dovina   nerve     goes for the biggest thing near and strikes it
//   calissa  an eye    stays back and stuns what threatens you (the Veritome's Flash, from up to 9 m), every six seconds
//   wanda    an ear    comes within 4 m and tolls on the beat (the music's, else every second): a ring that staggers what is near her
//   espada   curiosity scouts; strikes only what reaches her
//
// and, told to fight (`/sib fight`, the wheel's Help), all of them go for what you have locked on to, or the nearest thing in front of you.
// A blow is `creatures.strike` at 0.4 of the Courier's sustained damage (help, not a carry: the fight is yours), `by: 'sibling'` with the sibling as its
// `from`, so it never counts toward your records; a foe you struck at all that a sibling finishes is credited to you (FFXIV's credit by
// taking part: `creature.credit`, for the ledger to count). The blows are the Courier's own clips (`punchJab`, `punchCross`, `block`),
// empty-handed until the siblings carry their tools' models (Calissa's). Its pose is a layer over the walk, the way a tech's is.
//
// Prior art: Dragon's Dogma's pawns (each with its own inclination: Guardian, Challenger, Utilitarian, Scather), Final Fantasy XII's
// gambits (a condition and an act, in order), Kingdom Hearts' party AI (Goofy guards, Donald casts).
//
//   const F = new SiblingFight(sibling)   F.think(dt, { game, leader, order }) -> goal (where to stand) | null   F.animate(ch, base, dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { hasTag } from '../core/tags.js';
import { SUSTAINED } from '../progress/combat/greatjelly.js';

const SHARE = 0.4, COOL = 0.8, REACH = 1.5; // (Dovina's ruling: 0.4 of the Courier's sustained damage; seconds between blows; metres past the foe's radius)
const POWER = SHARE * SUSTAINED.perSecond * COOL; // (a blow's power: 0.83, so 1.04 a second, against the Courier's 2.6: progress/combat/greatjelly.js)
const TEMPER = {
  petra: { engage: (c, L) => c.pos.distanceTo(L.pos) < 4.5, leash: 4, parry: true },
  dovina: { engage: (c, L) => c.pos.distanceTo(L.pos) < 15, biggest: true, leash: 15 },
  calissa: { engage: (c, L) => c.pos.distanceTo(L.pos) < 6, flash: { r: 9, every: 6 }, leash: 9 },
  wanda: { engage: (c, L) => c.pos.distanceTo(L.pos) < 8, toll: { r: 5, stand: 4 }, leash: 8 },
  espada: { engage: (c, L, S) => c.pos.distanceTo(S.pos) < 3, leash: 3 },
};
const CLIPS = ['punchJab', 'punchCross'];
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _goal = new THREE.Vector3();

export class SiblingFight {
  constructor(S) { this.S = S; this.T = TEMPER[S.id] || TEMPER.espada; this.target = null; this.cool = 0; this.flashT = 0; this.tollBar = -1; this.act = null; this.w = 0; this.n = 0; }

  /** Who to fight now: the order's target, or what its temperament takes; null when there is nothing. */
  choose(game, leader, order) {
    const C = game.creatures; if (!C) return null;
    const foes = C.near(leader.pos, 18).filter((c) => c.alive && !c.ally && hasTag(c, 'hurtable'));
    if (order === 'fight') {
      const L = game.lock?.target; if (L?.alive && foes.includes(L)) return L;
      const f = _d.set(Math.sin(leader.yaw), 0, Math.cos(leader.yaw));
      return foes.find((c) => _p.subVectors(c.pos, leader.pos).setY(0).normalize().dot(f) > 0.5) || foes[0] || null;
    }
    const mine = foes.filter((c) => this.T.engage(c, leader, this.S));
    if (!mine.length) return null;
    return this.T.biggest ? mine.reduce((a, c) => ((c.radius || 0.5) * (c.height || 1) > (a.radius || 0.5) * (a.height || 1) ? c : a)) : mine[0];
  }

  /** The fight's step: returns where to stand (the follow mind goes there), or null to follow as told. */
  think(dt, { game, leader, order }) {
    const S = this.S, B = S.body;
    this.cool -= dt; this.flashT -= dt;
    if (this.act) { this.act.t += dt; if (!this.act.hit && this.act.t >= this.act.hitAt) this.land(game); if (this.act.t >= this.act.dur) this.act = null; }
    this.w += ((this.act ? 1 : 0) - this.w) * Math.min(1, dt * 12);
    // Petra: a blow aimed at you, parried when she stands near
    this.parryT = (this.parryT || 0) - dt;
    if (this.T.parry && this.parryT <= 0 && B.pos.distanceTo(leader.pos) < 4) for (const c of game.creatures?.windups?.(leader.pos, 2.5) || []) {
      if (c.windup.t > 0.65) continue; // (in its last 0.35 s: the windup's t runs down to 0.3 at the blow, creatures.js)
      game.creatures.parried(c); this.parryT = 2; this.start('block'); game.events.emit('sibling.parry', { sibling: S.id, kind: c.kind, by: 'sibling' }); break;
    }
    if (order === 'hold' || order === 'go') return null; // (told to stand: it fights only what reaches it, below)
    const c = this.target = this.choose(game, leader, order);
    if (!c) return null;
    const d = Math.hypot(c.pos.x - B.pos.x, c.pos.z - B.pos.z);
    // Calissa: stun what threatens you, from where she stands
    if (this.T.flash) { if (d < this.T.flash.r && this.flashT <= 0) { this.flashT = this.T.flash.every; game.stun?.add(c, 1, { by: 'sibling', cause: 'flash' }); this.face(c); this.start('punchJab'); game.glyphs?.pop('bang1', c.pos.clone().setY(c.pos.y + (c.height || 1) + 0.4), { color: 0xffffff, size: 0.4 }); game.events.emit('sibling.flash', { sibling: S.id, kind: c.kind, by: 'sibling' }); } return null; }
    // Wanda: within 4 m, a toll on each beat staggers everything near her
    if (this.T.toll) {
      if (d > this.T.toll.stand) return _goal.copy(c.pos);
      const M = game.music?.grid?.(), beat = M ? Math.floor((game.music.ctx.currentTime - M.t0) / M.spb) : Math.floor((game.events?.time || 0) / 1);
      if (beat !== this.tollBar) { this.tollBar = beat; for (const f of game.creatures.near(B.pos, this.T.toll.r)) if (!f.ally) game.creatures.build(f, 'impact', 0.35, 'sibling', 'toll'); game.fx?.toneBurst?.(B.pos.clone().setY(B.pos.y + 1), 0xffc070, 0.6, this.T.toll.r); this.start('punchCross'); game.events.emit('sibling.toll', { sibling: S.id, by: 'sibling' }); }
      return null;
    }
    // the rest: close in and strike
    if (d > (c.radius || 0.5) + REACH) return _goal.copy(c.pos);
    this.face(c);
    if (this.cool <= 0 && !this.act) { this.cool = COOL; this.start(CLIPS[this.n++ % CLIPS.length], c); }
    return B.pos; // (stand and strike)
  }

  face(c) { const B = this.S.body; B.yaw = Math.atan2(c.pos.x - B.pos.x, c.pos.z - B.pos.z); }

  start(clip, foe = null) {
    const C = this.S.rig.clips?.clips?.[clip]; const dur = Math.min(foe ? 1.2 : 0.5, C?.dur || 0.6); // (a parry or a toll is a beat, not a whole clip: she must be free to swing)
    this.act = { clip, t: 0, dur, hitAt: dur * 0.35, hit: !foe, foe };
  }

  /** The blow lands: 0.4 of a Courier's, the sibling's own (never the owner's records); a foe the owner touched, finished, is credited. */
  land(game) {
    const a = this.act; a.hit = true;
    const c = a.foe, B = this.S.body; if (!c?.alive) return;
    if (Math.hypot(c.pos.x - B.pos.x, c.pos.z - B.pos.z) > (c.radius || 0.5) + REACH + 0.5) return; // (it stepped away)
    const dir = _d.subVectors(c.pos, B.pos).setY(0).normalize().clone(), point = c.pos.clone().setY(c.pos.y + (c.height || 1) * 0.5);
    game.creatures.strike(c, point, dir, POWER, 'punch', 'sibling', B);
    if (!c.alive && c.touched) game.events.emit('creature.credit', { kind: c.kind, who: this.S.id, by: 'courier' });
  }

  afterPose() {} // (the rig asks every techs layer this after its pose: courier/character.js; a fight has nothing to add)
  /** The blow's pose over the walk (the rig asks this as it asks a tech: courier/character.js). */
  animate(ch, base) {
    if (this.w < 0.01 || !this.act) return;
    const C = ch.clips, clip = C.clips[this.act.clip]; if (!clip) return;
    C.blend(base, C.sample(this.act.clip, Math.min(this.act.t, clip.dur - 1e-3), ch.P.tmp, false), this.w, ch.MASK_UPPER);
  }
}
