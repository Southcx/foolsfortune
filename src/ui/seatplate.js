// ---------------------------------------------------------------------------------------
// A SEAT PLATE: one seat of Raku's table as a poker client draws it (name, colour, stack): a lacquer plate with the seat colour on its rim
// and its second cue (a shape, so a colour-blind player tells seats apart) beside the name, and the seat's key numbers, coloured by what
// they are. Draws what the coach gives and computes nothing (docs/handoffs/dovina/casino-clarity-art-brief.md 2b, 2c).
// Prior art: online poker seats (fold-dim for out, the acting seat lit), Balatro's numerals. The film edge is CSS (tablehud.css.js).
// Interface: `seatPlate({ seat, colour, name, stats:[{label,value,kind}], state }) -> el`; `el.plate.set({ stats, state })`;
//   `SEAT_COLOURS`, `cueSvg(colour)`.
// TODO: take SEAT_COLOURS from vfx/seatlook.js (builder A's, SEAT_LOOK) at merge; this local table is the brief's section 2a.
// ---------------------------------------------------------------------------------------
import { injectTableHudCss } from './tablehud.css.js';

/** The eight seat colours: hex and the shape that goes with it (the brief's 2a; seatlook.js owns the real one). */
export const SEAT_COLOURS = {
  Red: { hex: '#D55E00', shape: 'circle' }, Yellow: { hex: '#F0E442', shape: 'triangle' }, Green: { hex: '#009E73', shape: 'square' },
  Blue: { hex: '#0072B2', shape: 'diamond' }, Purple: { hex: '#7B4FA6', shape: 'hexagon' }, Pink: { hex: '#CC79A7', shape: 'star' },
  Black: { hex: '#1A1A1A', shape: 'cross', rim: '#cfcfcf' }, White: { hex: '#F2F2F2', shape: 'ring' },
};
const PATHS = {
  circle: '<circle cx="12" cy="12" r="9"/>', triangle: '<path d="M12 3 22 21H2z"/>', square: '<rect x="4" y="4" width="16" height="16"/>',
  diamond: '<path d="M12 2 22 12 12 22 2 12z"/>', hexagon: '<path d="M12 2 21 7v10l-9 5-9-5V7z"/>',
  star: '<path d="m12 2 2.9 6.6 7.1.7-5.3 4.8 1.5 7-6.2-3.6L5.8 21l1.5-7L2 9.3l7.1-.7z"/>',
  cross: '<path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z"/>', ring: '<circle cx="12" cy="12" r="8" fill="none" stroke-width="5"/>',
};
/** The colour's cue as an inline SVG string: the shape in the seat colour with a dark keyline (a pale one for Black). */
export function cueSvg(colour) {
  const c = SEAT_COLOURS[colour] || SEAT_COLOURS.White, key = c.rim || '#17111f', ring = c.shape === 'ring';
  return `<svg class="th-cue" viewBox="0 0 24 24" fill="${ring ? 'none' : c.hex}" stroke="${ring ? c.hex : key}" stroke-width="${ring ? 5 : 1.6}" stroke-linejoin="round" aria-hidden="true">${PATHS[c.shape]}</svg>`;
}

const TAGS = { acting: 'YOUR MOVE', out: 'OUT', winner: 'WINNER' };
const KINDS = ['score', 'money', 'lives', 'count'];

/** Build a seat plate. `el.plate.set({ stats, state })` redraws what is given. */
export function seatPlate({ seat = 0, colour = 'White', name = '', stats = [], state = 'idle' } = {}) {
  injectTableHudCss();
  const c = SEAT_COLOURS[colour] || SEAT_COLOURS.White;
  const el = document.createElement('div');
  el.className = 'th-plate';
  el.dataset.seat = String(seat);
  el.style.setProperty('--seat', c.rim || c.hex);
  el.innerHTML = `<div class="th-head">${cueSvg(colour)}<span class="th-name"></span><span class="th-tag"></span></div><div class="th-stats"></div>`;
  el.querySelector('.th-name').textContent = name;
  const tag = el.querySelector('.th-tag'), box = el.querySelector('.th-stats');
  const draw = (list) => {
    box.textContent = '';
    for (const s of list) {
      const d = document.createElement('div');
      d.className = `th-stat th-${KINDS.includes(s.kind) ? s.kind : 'count'}`;
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
