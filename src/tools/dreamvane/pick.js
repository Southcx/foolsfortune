// ---------------------------------------------------------------------------------------
// THE DREAMVANE'S BLOWS: the pick and the staff, in the Courier's own suite (Vane_*), run by the shared combo engine (tools/moveset.js,
// the grammar every tool keeps). The vane is two-handed: the clips have the left hand on the haft themselves (the hand IK only closes
// the last few centimetres: dreamvane.js).
//
//   LMB              the PICK (Vane_PickStrike: raised over the head and driven into the ground; where it meets nothing it strikes the
//                    sand, and what is veiled there rises), then the staff's three: a sweep, a rising backhand, and the overhead that
//                    strikes the ground (Vane_Combo1-3)
//   hold LMB         the pick held up over the head (the charge), driven down on release: the heavy blow
//   LMB, pause, LMB  after the pick: the SPIN SWEEP (Vane_SpinSweep), low and all the way round; after the first sweep: the three wide
//                    arcs of the JRPG string (Vane_JrpgCombo1-3)
//   S + LMB          the LAUNCHER (Vane_Thrust): the heel jabbed up under what is in front of them, which goes up; they stay down,
//                    so LMB in its window goes on into the staff's sweeps (Vane_Combo1-3), not the air string
//   LMB in the air   the two sweeps
//   sprinting LMB    the VAULT (Vane_Vault): the staff planted and swung over, its own 1.6 m, carried; a shove, never a blow (its
//                    row is worth nothing: what it meets is knocked aside, not broken, stunned or counted)
//   R                the DREAMQUAKE (Vane_SpecialDreamquake): up with the staff and down on it; the ground rings round them
//                    (its row's 5 m, else 4), and what is veiled in it rises (10 Lachryma)
//   after a parry    LMB: the spin sweep as the COUNTER (the twirl turned something aside: courier/parries.js)
//
// Prior art: the pickaxe of every mining game (one heavy committed blow into the ground), the quarterstaff of the action games (Sun
// Wukong's staff in Black Myth and Warriors Orochi: sweeps, a spin, a vault on the planted staff), Devil May Cry's launcher and pause
// combos and Bayonetta's Wicked Weaves for the grammar, and Kingdom Hearts' ground-slam finishers for the Dreamquake.
//
//   const M = new VaneMoves(tool, spec)   (a Moveset with the pick's rules for what a blow does, a shove, and what follows the
//   launcher)   VANE_MOVES   VANE_STRINGS
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { Moveset } from '../moveset.js';
import { hasTag } from '../../core/tags.js';

// The table, in clip seconds (tools/moveset.js); when a blow can hurt is measured from the clip (melee.js). `ground`: when the head
// meets the ground (a blow that met nothing strikes the sand there: dreamvane.js); `holdAt`: where the raised pick is held.
// Numbers for Dovina (proposals): the pick keeps its blow (1.5 power: pots shatter, creatures are struck 1.6 x power `picked`); the
// sweeps a little under it (1.2, 1.3), the overhead over it (1.9, with a 4 m/s shove); held, the pick's blow is 2.0 and charges to
// double (the engine's charge); the launcher lifts at 9 m/s (the cutlass's 9.5, a little less for a blunt jab); the vault 1.8 with a
// 7 m/s shove; the Dreamquake 10 Lachryma (the cutlass's Tidecutter is 12 and wider) for a 4 m ring of 2.6 power that throws at 9 m/s
// and lifts at 6, and reveals what is veiled within it (as the pick does in 3.2 m).
export const VANE_MOVES = {
  pick: { rule: 'pick', clip: 'Vane_PickStrike', from: 0.12, rate: 1.1, chain: [0.68, 1.1], to: 1.2, fade: 0.35, hit: { power: 1.5, dmg: 1.4 }, lunge: 1.4, ground: 0.64, heat: 0.4, arc: 'over' },
  c1: { rule: 'combo1', clip: 'Vane_Combo1', rate: 1.05, chain: [0.5, 0.85], to: 0.92, fade: 0.3, hit: { power: 1.2, dmg: 1.0 }, lunge: 2.4, arc: 'r2l' },
  c2: { rule: 'combo2', clip: 'Vane_Combo2', rate: 1.05, chain: [0.32, 0.88], to: 0.95, fade: 0.3, hit: { power: 1.3, dmg: 1.1 }, lunge: 2.4, arc: 'l2r' },
  c3: { rule: 'combo3', clip: 'Vane_Combo3', rate: 1.05, to: 1.55, fade: 0.45, hit: { power: 1.9, dmg: 1.7, push: 4 }, lunge: 3, ground: 0.84, heat: 0.8, arc: 'over' },
  // held: the pick stays up (the same clip, held at its top), and comes down on release
  raise: { clip: 'Vane_PickStrike', from: 0.42, holdAt: 0.47, arc: 'raise' },
  drive: { clip: 'Vane_PickStrike', from: 0.47, rate: 1.2, to: 1.25, fade: 0.35, hit: { power: 2.0, dmg: 2.0, push: 3 }, ground: 0.64, heat: 1, arc: 'over' },
  // the pause strings and the counter
  spin: { rule: 'pause1', clip: 'Vane_SpinSweep', body: 'whole', hit: { power: 1.6, dmg: 1.4, push: 5, lift: 2 }, heat: 0.6, arc: 'r2l' },
  j1: { rule: 'pause1', clip: 'Vane_JrpgCombo1', rate: 1.1, chain: [0.45, 1.0], to: 1.08, fade: 0.3, hit: { power: 1.3, dmg: 1.2 }, lunge: 2.2, arc: 'r2l' },
  j2: { rule: 'pause2', clip: 'Vane_JrpgCombo2', rate: 1.1, chain: [0.62, 1.1], to: 1.18, fade: 0.3, hit: { power: 1.4, dmg: 1.3 }, lunge: 2.2, arc: 'l2r' },
  j3: { rule: 'pause3', clip: 'Vane_JrpgCombo3', rate: 1.05, to: 1.6, fade: 0.4, hit: { power: 2.0, dmg: 1.9, push: 6, lift: 3 }, lunge: 2.6, heat: 1, arc: 'r2l' },
  // S + LMB, sprinting, and R
  up: { clip: 'Vane_Thrust', rate: 1.1, chain: [0.36, 0.72], to: 0.78, fade: 0.25, hit: { power: 1.4, dmg: 1.1, lift: 9, push: 1 }, lunge: 2.6, arc: 'raise' },
  vault: { rule: 'vault', clip: 'Vane_Vault', body: 'whole', root: 'xz', rate: 1.2, carry: 4, carryTo: 0.3, hit: { power: 1.8, dmg: 1.6, push: 7 }, heat: 0.7, arc: 'over' },
  quake: { rule: 'special', clip: 'Vane_SpecialDreamquake', body: 'whole', cost: 10, ringAt: 1.7, ring: 4, hit: { power: 2.6, dmg: 2.6, push: 9, lift: 6 }, heat: 1, arc: 'over' },
};
export const VANE_STRINGS = {
  ground: ['pick', 'c1', 'c2', 'c3'], air: ['c1', 'c2'], launcher: 'up', dash: 'vault', special: 'quake',
  pause: [{ at: 0, to: ['spin'] }, { at: 1, to: ['j1', 'j2', 'j3'] }],
  charge: { hold: 'raise', release: 'drive', after: 0.45 }, // (held a third of a second into the pick: it stays up)
};

const _k = new THREE.Vector3();

/** The engine with the pick's rules: what it strikes breaks (a pot shatters, `picked`), a clapperjar is knocked reeling, a creature is
 *  struck `picked`, a crystal is struck as a crystal. */
export class VaneMoves extends Moveset {
  blow(kind, ent, at, dir, h, c) {
    const g = this.game, power = (h.power ?? 1) * (c?.kind === 'charge' ? 1 + this.charge : 1);
    if (kind === 'clapper' && ent.ally) return; // (an ally's: the Courier's blows pass through it)
    const flat = _k.copy(dir).setY(0).normalize();
    if (this.rule(c?.def)?.power === 0) { this.shove(kind, ent, flat, h); return; } // (a row worth nothing, the vault's: Dovina's "never a weapon")
    this.landed = true;
    if (kind === 'thing') ent.struck?.(at, dir, power, 'courier', 'dreamvane');
    else if (kind === 'pot') g.breakables.shatter(ent, at, dir, power * 0.93, 'picked', 'courier');
    else if (kind === 'clapper') { g.clappers.knock(ent, flat.multiplyScalar(8 + (h.push ?? 0)).setY(5 + (h.lift ?? 0) * 0.5).clone()); g.clappers.stun(ent, 2, g.shells.glowOutline, g.shells.xray); if (h.lift) this.lifted(c); }
    else if (kind === 'creature') { const w = this.worth(h, c); if (w > 0) g.creatures.strike(ent, at, dir, w, 'picked'); if (h.push || h.lift) ent.knock?.(flat.multiplyScalar(h.push ?? 0).setY(h.lift ?? 0).clone()); this.struck(ent, c); } // (the row's power: a vault's is none, a shove)
    if (c && (c.kind === 'air' || c.kind === 'launcher')) { this.airHits++; this.P.vel.y = Math.max(this.P.vel.y, 0.6); } // (a hit in the air holds them up a beat)
    g.events?.emit(this.S.events.hit, { what: kind === 'creature' ? ent.kind : kind, combo: this.combo, move: c?.id, by: 'courier' });
  }

  /** A move whose row is worth nothing only shoves what it meets: knocked aside, never broken, stunned or counted as struck. */
  shove(kind, ent, flat, h) {
    const g = this.game, v = flat.multiplyScalar(h.push ?? 0).setY(h.lift ?? 0);
    if (kind === 'clapper') g.clappers.knock(ent, v.clone());
    else if (kind === 'creature') ent.knock?.(v.clone());
    else if (kind === 'pot' && hasTag(ent, 'pushable')) g.physics.kick(ent.body, v.clone().setY(Math.max(1.5, v.y)).multiplyScalar(ent.body.mass() * 0.6));
  }

  /** The launcher is a jab from the ground and they stay there (an upper-body move): what follows it on the ground is the staff's
   *  string from its first sweep, not the air string the engine would play standing (its count, its hold-up beat). */
  nextOf(c) {
    const g = this.S.strings.ground;
    if (c.kind === 'launcher' && this.P.grounded) return g.length > 1 ? { id: g[1], kind: 'ground', n: 1 } : null;
    return super.nextOf(c);
  }

  /** It lands: the knock, the shake, the stop. */
  impact(dmg, c) {
    if (!this.landed) return;
    this.landed = false;
    const g = this.game, P = this.P;
    sfx.cutHit?.(1.2 * dmg);
    P.shake = Math.max(P.shake || 0, 0.14 * dmg);
    g.time?.pulse?.('hit', 0.06, 0.03 + 0.025 * dmg * (c?.def.stop ?? 1), { release: 0.1 });
  }

  /** A held pick and its release continue the clip they came from: no fade in from the stance. */
  pose(C, out) {
    const r = super.pose(C, out), c = this.cur;
    if (r && c && (c.kind === 'charge-hold' || c.kind === 'charge')) r.w = 1;
    return r;
  }
}
