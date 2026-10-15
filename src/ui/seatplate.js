// ---------------------------------------------------------------------------------------
// A SEAT PLATE: one seat of Raku's table as a poker client draws it (name, colour, stack): a lacquer plate with the seat colour on its rim
// and its second cue (a shape, so a colour-blind player tells seats apart) beside the name, and the seat's key numbers, coloured by what
// they are and sized by their tier. Draws what the coach gives and computes nothing (docs/handoffs/dovina/casino-clarity-art-brief.md 2b, 2c).
// Colours and shapes are vfx/seatlook.js's (SEAT_LOOK, shapeOutline); the film edge goes on the acting plate only (tablehud.css.js).
// Prior art: online poker seats (fold-dim for out, the acting seat lit), Balatro's numerals.
// Interface: `seatPlate({ seat, colour, name, stats:[{label,value,tier,kind}], state }) -> el`; `el.plate.set({ stats, state })`;
//   `cueSvg(colour)`, `seatInk(colour)`. tier: XL | L | M | S (or 1 to 4), default L. kind: score | money | lives | count.
//   state: idle | acting | out | winner.
// ---------------------------------------------------------------------------------------
import { injectTableHudCss } from './tablehud.css.js';
import { SEAT_LOOK, shapeOutline } from '../vfx/seatlook.js';

const lookOf = (colour) => SEAT_LOOK[colour] || SEAT_LOOK.White;
/** A seat colour as text or a rim on the dark lacquer: Black reads as a pale grey, the rest in their rim lift. */
export const seatInk = (colour) => { const l = lookOf(colour); return l.outline === 'pale' ? '#d8d8d8' : l.rim; };
/** The colour's cue as an inline SVG string: its shape (seatlook's outline) in the seat colour with a keyline (pale for Black). */
export function cueSvg(colour) {
  const l = lookOf(colour);
  const pts = shapeOutline(l.shape).map(([x, y]) => `${(12 + 10 * x).toFixed(2)},${(12 - 10 * y).toFixed(2)}`).join(' ');
  const key = l.outline === 'pale' ? '#cfcfcf' : '#17111f';
  return `<svg class="th-cue" viewBox="0 0 24 24" aria-hidden="true"><polygon points="${pts}" fill="${l.hex}" stroke="${key}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

const TAGS = { acting: 'YOUR MOVE', out: 'OUT', winner: 'WINNER' };
const KINDS = ['score', 'money', 'lives', 'count'];
const TIERS = ['XL', 'L', 'M', 'S'];
const tierOf = (t) => (typeof t === 'number' ? TIERS[t - 1] || 'L' : TIERS.includes(t) ? t : 'L');

/** Build a seat plate. `el.plate.set({ stats, state })` redraws what is given. */
export function seatPlate({ seat = 0, colour = 'White', name = '', stats = [], state = 'idle' } = {}) {
  injectTableHudCss();
  const el = document.createElement('div');
  el.className = 'th-plate';
  el.dataset.seat = String(seat);
  el.style.setProperty('--seat', seatInk(colour));
  el.innerHTML = `<div class="th-head">${cueSvg(colour)}<span class="th-name"></span><span class="th-tag"></span></div><div class="th-stats"></div>`;
  el.querySelector('.th-name').textContent = name;
  const tag = el.querySelector('.th-tag'), box = el.querySelector('.th-stats');
  const draw = (list) => {
    box.textContent = '';
    for (const s of list) {
      const d = document.createElement('div');
      d.className = `th-stat th-${KINDS.includes(s.kind) ? s.kind : 'count'} th-tier-${tierOf(s.tier)}`;
      const b = document.createElement('b'), i = document.createElement('i');
      b.textContent = String(s.value); i.textContent = s.label;
      d.append(b, i); box.appendChild(d);
    }
  };
  el.plate = {
    set({ stats: st, state: sx } = {}) {
      if (st) draw(st);
      if (sx) { el.dataset.state = sx; tag.textContent = TAGS[sx] || ''; }
    },
  };
  el.plate.set({ stats, state });
  return el;
}
