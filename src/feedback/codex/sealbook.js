// ---------------------------------------------------------------------------------------
// The Codex's SEAL BOOK shelf (docs/plans/HANKO.md 5: "a pilgrim's goshuincho": your seal presses an imprint into the cradle, and the
// cradle stamps its own seal back into your book). A page a place whose cradles share one (`book`: a Shrine's threshold, a pier's helm),
// stamped once you have sealed there (the ledger's first `seal.book.<page>`, tracking/seals.js): the place's own seal (its number in the
// Comb, vfx/cradlelook.js CRADLE_NUMBERS) beside your seal's imprint (vfx/sealface.js), in vermilion on the page; a page not yet sealed is
// blank, named, so you know where there is to go (CLARITY.md: shown, then said). Drawn on demand from the ledger, never kept in step by
// hand. The look follows the COLLECTIONS shelf's (codex/collections.js); Calissa's to dress, by island.
//
// Prior art: the goshuincho (a temple's vermilion seal and the date brushed into your book), the Shikoku pilgrimage's nokyocho, the
// Wind Waker's and Okami's stamp collections, OSRS's collection log (the empty slot named).
//
//   renderSealBook(codex, host)   SEAL_PAGES -> [{ page, name, island, number }]
// ---------------------------------------------------------------------------------------
import { SHRINES } from '../../world/shrines.js';
import { CRADLE_NUMBERS } from '../../vfx/cradlelook.js';
import { drawSealFace, drawCombNumber } from '../../vfx/sealface.js';

/** The pages, in the order a journey meets them: Anagami's Shrines, its pier, then Margarite's. */
export const SEAL_PAGES = [
  ...SHRINES.filter((s) => s.id !== 'pearl').map((s) => ({ page: `shrine.${s.id}`, name: s.name, island: 'Anagami', number: CRADLE_NUMBERS.shrine[s.id] ?? null })),
  { page: 'pier.anagami', name: "Anagami's pier", island: 'Anagami', number: CRADLE_NUMBERS.helm.sloop },
  ...SHRINES.filter((s) => s.id === 'pearl').map((s) => ({ page: `shrine.${s.id}`, name: s.name, island: 'Margarite', number: CRADLE_NUMBERS.shrine[s.id] ?? null })),
  { page: 'pier.margarite', name: "Margarite's pier", island: 'Margarite', number: CRADLE_NUMBERS.helm.sloop },
];
const CSS = `
#codex .sb-head { display: flex; gap: 22px; align-items: baseline; margin-bottom: 12px; font-size: 11px; letter-spacing: .12em; opacity: .9; }
#codex .sb-head b { font: 600 22px var(--f-title); color: #fff1dc; margin-right: 6px; letter-spacing: .04em; }
#codex .sb-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
#codex .sb-page { border: 1px solid rgba(251,227,207,.12); border-radius: 5px; padding: 8px; background: rgba(240,228,206,.05); text-align: center; }
#codex .sb-page.got { border-color: rgba(214,72,52,.55); background: rgba(240,228,206,.1); }
#codex .sb-page canvas { width: 128px; height: 128px; display: block; margin: 0 auto 6px; }
#codex .sb-page b { display: block; font: 600 11px var(--f-title); letter-spacing: .12em; color: #fff1dc; }
#codex .sb-page s { text-decoration: none; font-size: 10px; letter-spacing: .06em; opacity: .6; }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const VERMILION = '#d64834';

/** One page's stamps: the place's seal (its number in the Comb, in a ring) above, your imprint below. */
function stamp(canvas, P, mine) {
  const c = canvas.getContext('2d'), S = canvas.width; c.clearRect(0, 0, S, S);
  c.save(); c.globalAlpha = 0.92; c.strokeStyle = VERMILION; c.lineWidth = 3;
  c.beginPath(); c.arc(S * 0.5, S * 0.3, S * 0.22, 0, Math.PI * 2); c.stroke();
  if (P.number != null) { const z = S * 0.2, m = drawCombNumber(null, P.number, { size: z }); drawCombNumber(c, P.number, { x: S * 0.5 + z / 2 - m.width / 2, y: S * 0.3 + Math.sqrt(3) * z / 4 - m.height / 2, size: z, ink: VERMILION }); } // (centred in the ring: its first cell is drawn at x, y)
  c.restore();
  if (mine) { c.save(); c.translate(S * 0.32, S * 0.56); drawSealFace(c, mine, { size: S * 0.36, ink: VERMILION }); c.restore(); }
}

export function renderSealBook(codex, host) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, L = g.ledger, mine = g.cradles?.mine || null;
  const got = SEAL_PAGES.filter((P) => L?.firsts?.[`seal.book.${P.page}`] != null);
  host.appendChild(el('div', 'sb-head', `<div><b>${got.length}</b>OF ${SEAL_PAGES.length} PAGES STAMPED</div>${mine ? `<div><b>${esc(mine.name)}</b>YOUR SEAL</div>` : '<div>NO SEAL CARVED YET</div>'}`));
  const wrap = el('div', 'sb-wrap');
  for (const P of SEAL_PAGES) {
    const has = got.includes(P), card = el('div', `sb-page${has ? ' got' : ''}`);
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    if (has) stamp(cv, P, mine);
    card.appendChild(cv);
    card.appendChild(el('b', '', esc(P.name.toUpperCase())));
    card.appendChild(el('s', '', has ? `${P.island} · sealed` : `${P.island} · not yet sealed`));
    wrap.appendChild(card);
  }
  host.appendChild(wrap);
}
