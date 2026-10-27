// ---------------------------------------------------------------------------------------
// The Codex's COLLECTIONS shelf: the collection log (progress/collectionlog.js) drawn. At its head the whole game's share and the
// sections filled; then a card a section, its N of M as a bar and its slots as chips, each lit once had and named in the dark before
// (OSRS's collection log shows the slot greyed, so you know what there is to find; CLARITY.md: shown, then said). Drawn on demand
// from the ledger, never kept in step by hand. The look is the STATUS shelf's (codex/status.js), its classes reused; Calissa's to dress.
//
// Prior art: Old School RuneScape's collection log tabs, Yakuza 0's completion list, the Pokedex's seen and caught.
//
//   renderCollections(codex, host)
// ---------------------------------------------------------------------------------------
import { logOf, logShare, worldSections, ENOUGH } from '../../progress/collectionlog.js';
import { VANTAGES } from '../../world/vantages.js';
import { SHRINES } from '../../world/shrines.js';

const CSS = `
#codex .cl-head { display: flex; gap: 22px; align-items: baseline; margin-bottom: 12px; font-size: 11px; letter-spacing: .12em; opacity: .9; }
#codex .cl-head b { font: 600 22px var(--f-title); color: #fff1dc; margin-right: 6px; letter-spacing: .04em; }
#codex .cl-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
#codex .cl-card { border: 1px solid rgba(255,178,122,.25); border-radius: 5px; padding: 10px 12px; background: rgba(28,13,8,.35); }
#codex .cl-card.done { border-color: rgba(255,211,106,.65); }
#codex .cl-card h3 { margin: 0 0 6px; font: 600 12px var(--f-title); letter-spacing: .2em; color: var(--accent); display: flex; justify-content: space-between; }
#codex .cl-card h3 span { color: #fff1dc; letter-spacing: .06em; }
#codex .cl-bar { height: 4px; background: rgba(251,227,207,.12); border-radius: 2px; margin-bottom: 8px; position: relative; }
#codex .cl-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent); border-radius: 2px; }
#codex .cl-bar u { position: absolute; top: -2px; bottom: -2px; width: 1px; background: rgba(255,241,220,.55); }
#codex .cl-slots { display: flex; flex-wrap: wrap; gap: 4px; }
#codex .cl-slot { font-size: 10px; letter-spacing: .04em; padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(251,227,207,.12); color: rgba(251,227,207,.32); }
#codex .cl-slot.got { color: #fff1dc; border-color: rgba(255,178,122,.45); background: rgba(255,178,122,.08); }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function renderCollections(codex, host) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const L = codex.game.ledger; if (!L) return;
  const extra = worldSections(VANTAGES, SHRINES), log = logOf(L, extra), share = logShare(L, extra);
  const full = log.filter((s) => s.got === s.of).length, slots = log.reduce((n, s) => n + s.of, 0), got = log.reduce((n, s) => n + s.got, 0);
  host.appendChild(el('div', 'cl-head', `<div><b>${Math.floor(share * 100)}%</b>THE WHOLE</div><div><b>${got}</b>OF ${slots} FOUND</div><div><b>${full}</b>OF ${log.length} SECTIONS FILLED</div>`));
  const wrap = el('div', 'cl-wrap');
  for (const s of log) {
    const card = el('div', `cl-card${s.got === s.of ? ' done' : ''}`);
    card.appendChild(el('h3', '', `${esc(s.label.toUpperCase())}<span>${s.got} / ${s.of}</span>`));
    card.appendChild(el('div', 'cl-bar', `<i style="width:${(s.frac * 100).toFixed(1)}%"></i><u style="left:${ENOUGH * 100}%"></u>`));
    const chips = el('div', 'cl-slots');
    for (const x of s.slots) chips.appendChild(el('span', `cl-slot${x.got ? ' got' : ''}`, esc(x.label)));
    card.appendChild(chips); wrap.appendChild(card);
  }
  host.appendChild(wrap);
}
