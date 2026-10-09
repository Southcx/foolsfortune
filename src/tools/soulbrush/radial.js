// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S RADIAL: what the paint is, picked on a held key (docs/plans/LACHRYMA-LOOP.md section 2 and 5: the radial ships now).
// Hold 1 (the paint mode's key) with the brush in the hand and the wheel opens: the seven feelings in display order (most positive
// first: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread) and CLEAN (its lore name Fair: sprays clear, washing paint and crude off where
// it lands, at range, and gains nothing). Gall and Fury show locked until they are learned (GALL-AND-FURY.md section 5). Flick toward one,
// let go: picked. A tap of 1 is the paint mode, as before; 2 the mop.
//
// Prior art: the weapon wheels of Grand Theft Auto V and Red Dead Redemption 2 (held, flicked, let go), Splatoon's special and sub
// picker, FLUDD's nozzle swap (one held tool, its behaviour picked).
//
//   const R = new PaintRadial(tool)   R.update(raw, inp) (while the brush is in the hand)   PICKS (the slots)
// ---------------------------------------------------------------------------------------
import { RadialWheel } from '../../feedback/wheel.js';
import { COLOR } from '../../progress/weather.js';
import { sfx } from '../../audio/sfx.js';

const HOLD = 0.22; // (real seconds of 1 held before the wheel opens: shorter is a tap, the paint mode)
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
/** The radial's slots, in display order, and Clean. `learn`: a feeling not yet learned shows locked (Gall and Fury, for now). */
export const PICKS = [
  { id: 'wonder', label: 'Wonder' }, { id: 'mirth', label: 'Mirth' }, { id: 'desire', label: 'Desire' },
  { id: 'fury', label: 'Fury', learn: true }, { id: 'gall', label: 'Gall', learn: true },
  { id: 'grief', label: 'Grief' }, { id: 'dread', label: 'Dread' },
  { id: 'clean', label: 'Clean', color: 0xf4efe6 },
];

export class PaintRadial {
  constructor(tool) { this.tool = tool; this.heldT = -1; this.wheel = null; }
  get game() { return this.tool.game; }
  /** Is a feeling learned? (Gall and Fury: by drinking them, GALL-AND-FURY.md; not yet in the game, so they show locked.) */
  learned(p) { return !p.learn || !!this.game.lend?.has('feelings') || (this.game.ledger?.get?.(`feeling.known.${p.id}`) || 0) > 0; } // (drunk once: feeling.known.*, the ledger's; Acquired Taste and Seeing Red are its achievements)

  update(raw, inp) {
    const P = this.tool.P;
    if (inp.wasPressed('Digit1')) this.heldT = 0;
    if (this.heldT < 0) return;
    if (inp.isDown('Digit1')) {
      this.heldT += raw;
      if (this.heldT >= HOLD && !this.wheel?.isOpen) {
        this.wheel = new RadialWheel({ id: 'paintradial', items: PICKS.map((p) => ({ label: p.label, color: hex(p.color ?? COLOR[p.id]), locked: !this.learned(p) })) });
        this.wheel.open(); P.lookScale.wheel = 0; sfx.click?.();
      }
      if (this.wheel?.isOpen) this.wheel.steer(inp.dx || 0, inp.dy || 0);
      return;
    }
    // let go: a tap was the paint mode (soulbrush.js); a hold picks what is pointed at
    this.heldT = -1;
    if (!this.wheel?.isOpen) return;
    const i = this.wheel.close(); P.lookScale.wheel = 1; this.wheel.el.remove(); this.wheel = null;
    if (i >= 0) this.tool.load.setPick(PICKS[i].id);
  }

  /** Put away with the brush: the wheel closes unpicked. */
  end() { if (this.wheel?.isOpen) { this.wheel.close(); this.wheel.el.remove(); this.tool.P.lookScale.wheel = 1; } this.wheel = null; this.heldT = -1; }
}
