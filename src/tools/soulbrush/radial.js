// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S RING: what the paint is refined into, picked (docs/plans/LACHRYMA-LOOP.md sections 2 and 5; OVERLAY.md 19.2). The
// seats are the seven feelings in display order (most positive first: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread) and CLEAN (its
// lore name Fair: sprays clear, washing paint and crude off where it lands, at range, and gains nothing). Every feeling is a dark seat
// until it is drunk once (the owner, 2026-10-11; GALL-AND-FURY.md section 5). THE WHEEL TURNS THE RING: a notch a seat, passing over a
// dark one. 1 HELD STAYS THE QUICK PICK: past 0.22 real s the mouse walks a ghost along the seats (a flick left toward Dread and CLEAN,
// right toward Wonder, as the desk's range lies), and the let go picks where it stands; a tap of 1 is the paint mode, as before; 2 the mop.
// What it looks like is the Soul Brush's desk (vfx/soulbrushdesk.js: the brush walks the range, the ghost brush walks with the flick),
// which reads `open` and `ghost`; the old DOM wheel and its paint icons were retired with board v11 (the owner, 2026-10-19).
//
// Prior art: the weapon wheels of Grand Theft Auto V and Red Dead Redemption 2 (held, flicked, let go), Splatoon's special and sub
// picker, FLUDD's nozzle swap (one held tool, its behaviour picked); a scholar's brush walked along its rest for the quick pick.
//
//   const R = new PaintRadial(tool)   R.update(raw, inp) (while the brush is in the hand)   R.turn(d) (the wheel)   R.end()
//   R.open (1 held past the tap)   R.ghost (the seat the quick pick stands on, or -1)   PICKS (the seats, in order)
// ---------------------------------------------------------------------------------------
import { sfx } from '../../audio/sfx.js';

const HOLD = 0.22; // (real seconds of 1 held before the quick pick opens: shorter is a tap, the paint mode)
const STEP = 40;   // (pixels of mouse movement a seat walked)
/** The ring's seats, in display order, and Clean. `learn`: a feeling not yet drunk is a dark seat (all seven: the owner, 2026-10-11). */
export const PICKS = [
  { id: 'wonder', label: 'Wonder', learn: true }, { id: 'mirth', label: 'Mirth', learn: true }, { id: 'desire', label: 'Desire', learn: true },
  { id: 'fury', label: 'Fury', learn: true }, { id: 'gall', label: 'Gall', learn: true },
  { id: 'grief', label: 'Grief', learn: true }, { id: 'dread', label: 'Dread', learn: true },
  { id: 'clean', label: 'Clean' },
];

export class PaintRadial {
  constructor(tool) { this.tool = tool; this.heldT = -1; this.open = false; this.ghost = -1; this.from = -1; this.acc = 0; }
  get game() { return this.tool.game; }
  /** Is a feeling learned? (by drinking it once: GALL-AND-FURY.md; Clean always is) */
  learned(p) { return !p.learn || !!this.game.lend?.has('feelings') || (this.game.ledger?.get?.(`feeling.known.${p.id}`) || 0) > 0; } // (drunk once: feeling.known.*, the ledger's; Acquired Taste and Seeing Red are its achievements)
  /** The seat the paint is on now: the pick, else what the load lays, else CLEAN. */
  at() { const L = this.tool.load, id = L.cleaning ? 'clean' : (L.pick ?? L.aspect); return Math.max(0, PICKS.findIndex((p) => p.id === id)); }

  update(raw, inp) {
    const P = this.tool.P;
    if (inp.wasPressed('Digit1')) this.heldT = 0;
    if (this.heldT < 0) return;
    if (inp.isDown('Digit1')) {
      this.heldT += raw;
      if (this.heldT >= HOLD && !this.open) { this.open = true; this.from = this.ghost = this.at(); this.acc = 0; P.lookScale.wheel = 0; sfx.click?.(); }
      if (this.open) { this.acc += inp.dx || 0; while (Math.abs(this.acc) >= STEP) { const d = this.acc < 0 ? 1 : -1; this.acc += d * STEP; this.walk(d); } }
      return;
    }
    // let go: a tap was the paint mode (soulbrush.js); a hold picks where the ghost stands
    this.heldT = -1;
    if (!this.open) return;
    const i = this.ghost, moved = i !== this.from; this.end();
    if (moved && i >= 0) this.tool.load.setPick(PICKS[i].id);
  }

  /** The quick pick's ghost a seat along the line (`d` +1 toward CLEAN, -1 toward Wonder), over the dark seats; it stops at the ends. */
  walk(d) {
    for (let k = this.ghost + d; k >= 0 && k < PICKS.length; k += d) if (this.learned(PICKS[k])) { this.ghost = k; sfx.click?.(); return; }
  }

  /** The ring turned a notch by the wheel (`d` +1 or -1): the next seat round that is awakened (Clean always is). */
  turn(d) {
    const n = PICKS.length, at = Math.max(0, PICKS.findIndex((p) => p.id === (this.tool.load.pick ?? 'clean')));
    for (let k = 1; k < n; k++) { const p = PICKS[(at + d * k + n * k) % n]; if (this.learned(p)) { this.tool.load.setPick(p.id); return true; } }
    return false;
  }

  /** Put away with the brush, or let go: the quick pick closes. */
  end() { if (this.open) this.tool.P.lookScale.wheel = 1; this.open = false; this.ghost = -1; this.heldT = -1; }
}
