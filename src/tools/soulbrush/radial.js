// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S RADIAL: what the paint is, picked on a held key (docs/plans/LACHRYMA-LOOP.md section 2 and 5: the radial ships now).
// Hold 1 (the paint mode's key) with the brush in the hand and the wheel opens, each slot a picture of its own (ui/icons/paintart.js,
// Calissa's: never colour alone): the seven feelings in display order (most positive
// first: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread) and CLEAN (its lore name Fair: sprays clear, washing paint and crude off where
// it lands, at range, and gains nothing). Every feeling shows locked until it is drunk once (the owner, 2026-10-11; GALL-AND-FURY.md section 5). Flick toward one,
// let go: picked. A tap of 1 is the paint mode, as before; 2 the mop. THE WHEEL TURNS THE RING (OVERLAY.md 19.2): a notch a turn, the
// seven and CLEAN in that order round, a feeling not yet awakened a dark seat it passes over; 1 held stays the quick pick.
//
// Prior art: the weapon wheels of Grand Theft Auto V and Red Dead Redemption 2 (held, flicked, let go), Splatoon's special and sub
// picker, FLUDD's nozzle swap (one held tool, its behaviour picked).
//
//   const R = new PaintRadial(tool)   R.update(raw, inp) (while the brush is in the hand)   R.turn(d) (the wheel)   PICKS (the slots)
// ---------------------------------------------------------------------------------------
import { RadialWheel } from '../../feedback/wheel.js';
import { COLOR } from '../../progress/weather.js';
import { iconEl } from '../../ui/icons/icons.js';
import { sfx } from '../../audio/sfx.js';

const HOLD = 0.22; // (real seconds of 1 held before the wheel opens: shorter is a tap, the paint mode)
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
/** The radial's slots, in display order, and Clean. `learn`: a feeling not yet drunk shows locked (all seven: the owner, 2026-10-11). */
const HERE = 'Drink it to learn it: where its weather falls on Anagami.'; // (Espada's line for Anagami's five, kept as Petra drafted it)
export const PICKS = [
  { id: 'wonder', label: 'Wonder', learn: true, where: HERE }, { id: 'mirth', label: 'Mirth', learn: true, where: HERE }, { id: 'desire', label: 'Desire', learn: true, where: HERE },
  { id: 'fury', label: 'Fury', learn: true, where: 'Drink it to learn it: the sea near Entropolis.' }, { id: 'gall', label: 'Gall', learn: true, where: 'Drink it to learn it: the Great Dunemaw, deep.' }, // (Espada's lines, GALL-AND-FURY.md 0)
  { id: 'grief', label: 'Grief', learn: true, where: HERE }, { id: 'dread', label: 'Dread', learn: true, where: HERE },
  { id: 'clean', label: 'Clean', color: 0xf4efe6 },
];

/** A slot's picture (ui/icons/paintart.js: a silhouette a pick, in its feeling's colours); a locked one in grey under the lock. */
function pickIcon(id, locked) {
  const icon = iconEl(`paint.${id}`, { pal: locked ? 'grey' : `paint.${id}`, px: 2 });
  if (!locked) return icon;
  const box = document.createElement('div'), lock = iconEl('chip.lock', { pal: 'gold', px: 2 });
  box.style.cssText = 'position:absolute;line-height:0'; box.appendChild(icon);
  lock.style.cssText += ';position:absolute;right:-6px;bottom:-6px';
  box.appendChild(lock);
  return box;
}

export class PaintRadial {
  constructor(tool) { this.tool = tool; this.heldT = -1; this.wheel = null; }
  get game() { return this.tool.game; }
  /** Is a feeling learned? (by drinking it once: GALL-AND-FURY.md; Clean always is) */
  learned(p) { return !p.learn || !!this.game.lend?.has('feelings') || (this.game.ledger?.get?.(`feeling.known.${p.id}`) || 0) > 0; } // (drunk once: feeling.known.*, the ledger's; Acquired Taste and Seeing Red are its achievements)

  update(raw, inp) {
    const P = this.tool.P;
    if (inp.wasPressed('Digit1')) this.heldT = 0;
    if (this.heldT < 0) return;
    if (inp.isDown('Digit1')) {
      this.heldT += raw;
      if (this.heldT >= HOLD && !this.wheel?.isOpen) {
        this.wheel = new RadialWheel({ id: 'paintradial', items: PICKS.map((p) => { const locked = !this.learned(p); return { label: p.label, sub: locked ? p.where : '', color: hex(p.color ?? COLOR[p.id]), icon: pickIcon(p.id, locked), locked }; }) });
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

  /** The ring turned a notch by the wheel (`d` +1 or -1): the next seat round that is awakened (Clean always is). */
  turn(d) {
    const n = PICKS.length, at = Math.max(0, PICKS.findIndex((p) => p.id === (this.tool.load.pick ?? 'clean')));
    for (let k = 1; k < n; k++) { const p = PICKS[(at + d * k + n * k) % n]; if (this.learned(p)) { this.tool.load.setPick(p.id); return true; } }
    return false;
  }

  /** Put away with the brush: the wheel closes unpicked. */
  end() { if (this.wheel?.isOpen) { this.wheel.close(); this.wheel.el.remove(); this.tool.P.lookScale.wheel = 1; } this.wheel = null; this.heldT = -1; }
}
