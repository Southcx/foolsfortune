// ---------------------------------------------------------------------------------------
// THE MECH'S KEPT STATE (docs/plans/MECHS.md 4.1, 4.7, 6): the frame chosen at the gantry (a part a slot) and the mech's cracks, kept as
// one save section (`mech`, scope player: state that must agree is one section), with the frame's numbers assembled from the rules
// (progress/mechs/frame.js) and the parts you own (the clay frame always; another once its `earn` achievement is done).
//
// Prior art: Armored Core's garage (the assembly kept between sorties, the damage carried until repaired), the kiln's MEND (a mend at
// one station, in gold).
//
//   const S = new MechState(game)   S.sel   S.stats (assemble(S.sel), cached)   S.vessel (newVessel('mech'))   S.keep(sel) -> stats
//   S.owns(partId)   S.owned(slot) -> [partId]   S.broken(region) -> bool   S.hurt(state)   S.mend()   (save section `mech`)
// ---------------------------------------------------------------------------------------
import { SLOTS, PARTS, CLAY_FRAME, partsIn } from '../../progress/mechs/parts.js';
import { assemble } from '../../progress/mechs/frame.js';
import { newVessel, REGION_BREAK } from '../../progress/combat/vessel.js';

export class MechState {
  constructor(game) {
    this.game = game; this.reset();
    game.save?.section('mech', { scope: 'player', version: 1,
      dump: () => ({ sel: { ...this.sel }, crack: { ...this.vessel.crack } }),
      load: (d) => {
        this.reset(); if (!d || typeof d !== 'object') return;
        const sel = { ...CLAY_FRAME };
        for (const s of SLOTS) if (d.sel && s in d.sel && (d.sel[s] === null || PARTS[d.sel[s]])) sel[s] = d.sel[s];
        this.sel = sel; this._stats = null;
        for (const r in this.vessel.crack) this.vessel.crack[r] = Math.max(0, Math.min(1, +d.crack?.[r] || 0));
      },
      reset: () => this.reset() });
  }
  reset() { this.sel = { ...CLAY_FRAME }; this.vessel = newVessel('mech'); this._stats = null; }
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
  /** Every crack mended at the gantry. TODO(Dovina): its price in cubes by the cracks, as the kiln's MEND (MECHS.md 6); free for now. */
  mend() { this.vessel = newVessel('mech'); this.dirty(); }
}
