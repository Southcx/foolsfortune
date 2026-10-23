// ---------------------------------------------------------------------------------------
// THE ARCANA, a shelf of the Codex (B): the 22 Major Arcana as the collection keeps them (progress/collection.js; docs/plans/SPREADS.md 6).
// Each is face down until bound. A bound card shows its face, its reading and what it brings to a spread (its suit, by the Golden Dawn's
// attributions, and how many cells its footprint lights: progress/spreads.js). An unbound one shows only its sitting's riddle: the
// photograph that binds it. The Fool is you, bound from the start.
//
// Prior art: Persona's Compendium (the arcana kept, each a face and a reading), Greed Island's binder (numbered places, face down until
// earned), the Golden Dawn's Book T for the suits.
//
//   renderArcana(codex, cx)   (codex.js's ARCANA shelf; its styles are the VERITOME shelf's, tools/veritome/ui.js vtStyle)
// ---------------------------------------------------------------------------------------
import { CARDS, CARD, cardArt } from '../../tools/veritome/cards.js';
import { vtStyle } from '../../tools/veritome/ui.js';
import { MAJOR_SUIT, RANK_CELLS } from '../../progress/spreads.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const SUIT_NAME = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles', wild: 'wild (a planet: any suit, at 0.75)' };
const art = (id, back) => { const c = document.createElement('canvas'); c.width = 120; c.height = 200; c.getContext('2d').drawImage(cardArt(id, 120, 200, { back }), 0, 0); return c; };

export function renderArcana(codex, cx) {
  vtStyle();
  const C = codex.game.collection, majors = CARDS.filter((c) => c.section === 'arcana');
  cx.appendChild(el('div', 'sum', `<span>THE MAJOR ARCANA · ${C?.filledIn('arcana') ?? 0} / ${majors.length} bound</span><span>bound ones are laid in a spread, on the Pneuka Box's underside (P)</span>`));
  const wrap = el('div', 'vt'), left = el('div'), grid = el('div', 'binder');
  codex.arcSel ||= majors[0].id;
  for (const A of majors) {
    const bound = !!C?.has(A.id), slot = el('div', `slot${bound ? '' : ' empty'}${codex.arcSel === A.id ? ' sel' : ''}`);
    slot.appendChild(art(A.id, !bound));
    slot.appendChild(el('b', '', A.roman));
    slot.onclick = () => { codex.arcSel = A.id; codex.render(); };
    grid.appendChild(slot);
  }
  left.appendChild(grid);
  wrap.appendChild(left);
  // the card picked
  const A = CARD[codex.arcSel] || majors[0], bound = !!C?.has(A.id), det = el('div', 'card detail');
  det.appendChild(el('div', 'in', `${A.roman} · RANK ${A.rank} · ${bound ? 'BOUND' : 'FACE DOWN'}`));
  det.appendChild(art(A.id, !bound));
  det.appendChild(el('h3', '', bound ? A.name.toUpperCase() : '· · ·'));
  if (bound) det.appendChild(el('p', '', A.lore));
  det.appendChild(el('p', 'hint', A.key === 'fool' ? 'The Fool is you: bound from the start, and the heart of the Celtic Cross.' : `Sitting: ${A.hint}.`));
  if (!bound && A.key !== 'fool') det.appendChild(el('p', 'hint', 'Photograph its sitting with the Veritome, then appraise the photograph (VERITOME, THE MEMORY).'));
  det.appendChild(el('p', '', `In a spread: ${SUIT_NAME[MAJOR_SUIT[A.key]] || '—'} · ${RANK_CELLS[A.rank] ?? 1} cells lit`));
  wrap.appendChild(det);
  cx.appendChild(wrap);
}
