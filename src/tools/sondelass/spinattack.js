// ---------------------------------------------------------------------------------------
// THE SPIN ATTACK (plain name; South, 2026-11-22: "RMB's charge: a Legend of Zelda style horizontal spin attack"; docs/plans/
// SONDELASS-FEEL.md 14): RMB held standing with the cutlass drawn charges a cut all round; let go, the Courier whirls and everything within
// its reach is struck at once. Beside the iaido (crouched RMB, cutlass.js), never in the engine's LMB charge (tools/moveset.js).
//
//   the press     only the free, standing press of the tap's slot (no W or S unlocked; neutral or sideways on the lock): it waits, and
//                 nothing begins on it (a hold read before anything can land: casebook NEW:hold-reads-before-the-strike). Let go within
//                 SPIN.gate real s, it is the tap's special as it always was (the Stinger, fired on the release now); the paid cut, the
//                 directional specials and the crouch are as they were
//   the charge    held past SPIN.gate: the blade drawn back (the suite's Sond_ChargeHold, looped, as the LMB charge's), a glint at its tip
//                 brightening as it fills (SPIN.full real s to full); `cut.spin { beat: 'charge' }`, `{ beat: 'full' }`
//   the turn      let go: the cutlass's `whirl` row (cutlass.js MOVES: Sond_SpinSlash, its two whole turns, the body ending where it
//                 began: measured, 0 to 720 degrees of the spine over the clip) played as the engine's charge kind (its power from half
//                 to all with the charge, `moves.charge` set to this one's); at its `at` (the first turn's middle) a ring cuts all round
//                 at the hips out to SPIN.reach (moveset.js ring(): once a thing, on the ground's plane), the library's cut.spin.ring at
//                 its size; `cut.spin { beat: 'release', k }`
//   off the ground, a blink, a stow: let go with nothing drawn
//   Opened from the start for now (Dovina's to give it a count way and a feat way: docs/handoffs/dovina/2026-11-22-from-calissa-
//   sondelass-charges.md). Sounds: Wanda's (the handoff in docs/handoffs/wanda/); sfx.guardUp and sfx.slash stand in.
//
// Prior art: The Legend of Zelda: A Link to the Past and Ocarina of Time (B held: the blade glows, sparks gather at its tip; let go, the
// spin attack all round; a tap is the plain swing), Twilight Princess's Great Spin, Devil May Cry's Round Trip (a charged whirl).
//
//   SPIN   new SpinAttack(cutlass)   .press(want) -> bool (taken)   .update(inp, raw)   .ring(c)   .cancel()   .on   .w (the hold pose's weight)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { DAMAGE_TINT } from '../../vfx/library.js';
import { typeOf } from '../../progress/combat/types.js';

/** gate: real s held before the press becomes the charge; full: real s from there to a full charge; reach: m at none and at full;
 *  in, out: real s the hold's pose eases in and out. */
export const SPIN = { gate: 0.2, full: 1.0, reach: [2.6, 4.2], in: 0.12, out: 0.1, ring: { power: 1.4, dmg: 1.6, push: 7, away: 1 } };
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class SpinAttack {
  constructor(cutlass) { this.cut = cutlass; this.pend = null; this.hold = null; this.w = 0; this.k = 0; }
  get game() { return this.cut.game; }
  /** RMB pressed or held (the press waiting, or the charge): the cutlass's hands are this one's. */
  get on() { return !!(this.pend || this.hold); }

  /** An RMB press with `want` (the tap's, or a direction's): taken (to wait for the hold) only on the free, standing tap. */
  press(want) {
    const P = this.cut.tool.P;
    if (want !== 'tap' || !P.grounded || P.crouching || this.cut.busy || this.cut.stCool > 0) return false;
    this.pend = { t: 0 };
    return true;
  }

  update(inp, raw) {
    const P = this.cut.tool.P, g = this.game;
    this.w = this.hold ? Math.min(1, this.w + raw / SPIN.in) : Math.max(0, this.w - raw / SPIN.out);
    if (!this.on) return;
    if (!P.grounded) { this.cancel(); return; }
    const down = inp.isDown('Mouse2');
    if (this.pend) {
      this.pend.t += raw;
      if (!down) { this.pend = null; this.cut.go('tap', false); return; } // (a tap: the tap's special, as it always was)
      if (this.pend.t < SPIN.gate) return;
      this.pend = null; this.hold = { t: 0, full: false }; this.k = 0;
      this.glint = g.vfx?.play('cut.spin.charge', { pos: P.pos.clone(), tint: this.tint(), follow: (h) => { if (!this.hold) return false; this.cut.tool.model.bladeSegment(_a, _b); h.pos.copy(_b); h.k = 0.4 + 0.6 * this.k; return true; } });
      sfx.guardUp?.(); // (a placeholder: the charge's sound is Wanda's)
      g.events?.emit('cut.spin', { beat: 'charge', by: 'courier' });
      return;
    }
    const H = this.hold;
    H.t += raw; this.k = Math.min(1, H.t / SPIN.full);
    this.cut.moves.holding(H.t); // (a held charge: the string's window waits, for at most 2 real s of it: tools/moveset.js)
    P.bodyYaw = P.yaw; // (squared to where they look, or the lock: the charge is aimed all round, but the stance faces the view)
    if (this.k >= 1 && !H.full) {
      H.full = true; this.cut.tool.model.bladeSegment(_a, _b);
      g.vfx?.play('cut.spin.full', { pos: _b.clone(), tint: this.tint() });
      g.events?.emit('cut.spin', { beat: 'full', by: 'courier' });
    }
    if (down) return;
    const k = this.k; this.hold = null;
    const M = this.cut.moves; M.charge = k;
    if (M.begin('whirl', 'charge') === false) return;
    g.events?.emit('cut.spin', { beat: 'release', k, by: 'courier' });
  }

  /** The whirl `c` at its `at`: the ring all round at the hips, its reach by the charge. */
  ring(c) {
    const g = this.game, P = this.cut.tool.P, M = this.cut.moves, k = THREE.MathUtils.clamp(M.charge || 0, 0, 1);
    const R = SPIN.reach[0] + (SPIN.reach[1] - SPIN.reach[0]) * k;
    M.ring(R, { ...SPIN.ring, cause: c.def.hit?.cause });
    g.vfx?.play('cut.spin.ring', { pos: P.pos.clone(), dir: new THREE.Vector3(Math.sin(c.yaw ?? P.bodyYaw), 0, Math.cos(c.yaw ?? P.bodyYaw)), tint: this.tint(), scale: R / 3.5, power: 0.8 + 0.5 * k });
  }

  tint() { return DAMAGE_TINT[typeOf('sliced')] ?? DAMAGE_TINT.impact; } // (the cutlass's cut: its trail's colour, vfx/cutlasstrail.js)

  cancel() { this.pend = null; this.hold = null; this.k = 0; }
}
