// ---------------------------------------------------------------------------------------
// THE MECH'S KEPT STATE (docs/plans/MECHS.md 4.1, 4.7, 6, 9.3): the frame chosen at the gantry (a part a slot), the mech's cracks and its joints, kept as
// one save section (`mech`, scope player: state that must agree is one section), with the frame's numbers assembled from the rules
// (progress/mechs/frame.js) and the parts you own (the clay frame always; another once its `earn` achievement is done).
//
// Prior art: Armored Core's garage (the assembly kept between sorties, the damage carried until repaired), the kiln's MEND (a mend at
// one station, in gold).
//
//   const S = new MechState(game)   S.sel   S.stats (assemble(S.sel), cached)   S.vessel (newVessel('mech'))   S.keep(sel) -> stats
//   S.owns(partId)   S.owned(slot) -> [partId]   S.broken(region) -> bool   S.hurt(state)   S.mend()   (save section `mech`, version 2)
//   S.joints (joints.js newJoints: the frame's nine, strained by pilot.hurt, mended with the cracks)   S.strained (any joint strained)
// ---------------------------------------------------------------------------------------
import { SLOTS, PARTS, CLAY_FRAME, partsIn } from '../../progress/mechs/parts.js';
import { assemble } from '../../progress/mechs/frame.js';
import { newVessel, REGION_BREAK } from '../../progress/combat/vessel.js';
import { newJoints, mendJoints, JOINT_IDS } from '../../progress/mechs/joints.js';

const JOINT_STATES = ['whole', 'fractured', 'snapped'];

export class MechState {
  constructor(game) {
    this.game = game; this.reset();
    game.save?.section('mech', { scope: 'player', version: 2, // (2: the joints kept beside the cracks, MECHS.md 9.3; a version 1 save loads with them whole)
      dump: () => ({ sel: { ...this.sel }, crack: { ...this.vessel.crack }, joints: JSON.parse(JSON.stringify(this.joints)) }),
      load: (d) => {
        this.reset(); if (!d || typeof d !== 'object') return;
        const sel = { ...CLAY_FRAME };
        for (const s of SLOTS) if (d.sel && s in d.sel && (d.sel[s] === null || PARTS[d.sel[s]])) sel[s] = d.sel[s];
        this.sel = sel; this._stats = null;
        for (const r in this.vessel.crack) this.vessel.crack[r] = Math.max(0, Math.min(1, +d.crack?.[r] || 0));
        for (const id of JOINT_IDS) { const j = d.joints?.[id]; if (!j || typeof j !== 'object') continue; // (each joint read on its own: a bad one stays whole)
          this.joints[id].strain = Math.max(0, Math.min(10, +j.strain || 0)); if (JOINT_STATES.includes(j.state)) this.joints[id].state = j.state; }
      },
      reset: () => this.reset() });
  }
  reset() { this.sel = { ...CLAY_FRAME }; this.vessel = newVessel('mech'); this.joints = newJoints(); this._stats = null; }
  dirty() { this.game.save?.dirty('mech'); }

  get stats() { return (this._stats ||= assemble(this.sel)); }
  /** The frame kept (the assembly page's DONE): its numbers, assembled again. */
  keep(sel) { this.sel = { ...CLAY_FRAME, ...sel }; this._stats = null; this.dirty(); return this.stats; }

  /** Do you own a part? The clay frame's always; another once its `earn` achievement is done (the DEBUG save's lend counts: the
   *  achievements' `done`); an `earn` not yet written as an achievement opens only in the DEBUG save. */
  owns(id) {
    if (id === null) return true;
    const P = PARTS[id]; if (!P) return false;
    if (!P.earn || Object.values(CLAY_FRAME).includes(id) || id === 'fist') return true;
    const A = this.game.achievements;
    return A?.by?.[P.earn] ? A.done(P.earn) : this.game.mode === 'debug';
  }
  /** The parts you own that fit a slot (the back slot also offers none). */
  owned(slot) { return [...(slot === 'back' ? [null] : []), ...partsIn(slot).filter((id) => this.owns(id))]; }

  broken(region) { return (this.vessel.crack[region] || 0) >= REGION_BREAK; }
  /** A blow's new vessel state laid in (vessel.js blowOn's `state`). */
  hurt(state) { this.vessel = state; this.dirty(); }
  /** Every crack mended at the gantry, and every joint with them (MECHS.md 9.3). TODO(Dovina): its price in cubes by the cracks, as the
   *  kiln's MEND (MECHS.md 6); free for now. */
  mend() { this.vessel = newVessel('mech'); this.joints = mendJoints(); this.dirty(); }
  /** Is any joint strained (the gantry's MEND offered for joints too)? */
  get strained() { return JOINT_IDS.some((id) => this.joints[id].strain > 0 || this.joints[id].state !== 'whole'); }
}
