// ---------------------------------------------------------------------------------------
// The Codex's CLASS ARTS shelf (GAPS G40; CLASS-ARTS.md, DOMAINS.md 16): the worn action and reaction chosen by a tap, so wearing
// another art needs no chat line (`/art <id>` still works) and a phone can do it. Two columns, the ACTION and the REACTION: the one
// worn first, then every other art you have opened (a class's, and in the action's column a domain's rung that is an action), each a
// row of its label, its class or domain, and its one line; a tap wears it (`game.classArts.wear`, which says it through `art.wear`).
// Under them, your class's two arts while either is still closed, with how far each way to open it is (the count and the feat).
// Drawn on demand from the ledger and `game.classArts`, never kept in step; its own plain cards (Calissa's to dress). Words are placeholders for Espada.
//
// Prior art: Final Fantasy Tactics' ability screen (an action set and a reaction worn from any job learned), Hades' boon list.
//
//   renderClassArts(codex, host)
// ---------------------------------------------------------------------------------------
import { CLASS_ARTS, FEAT_WORDS, classWords, openArts, artsOf, artOpen } from '../../progress/classarts.js';
import { DOMAIN_ARTS, domainArtOpen } from '../../progress/domainarts.js';
import { DOMAINS } from '../../progress/domains.js';

const CSS = `
#codex .ca-head { font-size: 11px; letter-spacing: .16em; opacity: .85; margin: 0 0 10px; }
#codex .ca-head b { font: 600 16px var(--f-title); color: #fff1dc; letter-spacing: .06em; margin-left: 8px; }
#codex .ca-card { border: 1px solid rgba(255,178,122,.25); border-radius: 5px; padding: 10px 12px; background: rgba(28,13,8,.35); }
#codex .ca-card h3 { margin: 0 0 8px; font: 600 12px var(--f-title); letter-spacing: .2em; color: var(--accent); display: flex; justify-content: space-between; gap: 12px; }
#codex .ca-card h3 span { color: rgba(251,227,207,.6); font-size: 10px; letter-spacing: .12em; }
#codex .ca-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
#codex .ca-row { display: block; width: 100%; text-align: left; margin: 0 0 6px; padding: 7px 10px; border-radius: 4px; border: 1px solid rgba(255,178,122,.18); background: rgba(28,13,8,.3); color: inherit; font: inherit; cursor: var(--jcur-pointer, pointer); }
#codex .ca-row:hover { border-color: rgba(255,178,122,.55); }
#codex .ca-row.worn { border-color: rgba(255,211,106,.75); background: rgba(255,211,106,.08); cursor: default; }
#codex .ca-row b { font: 600 12px var(--f-title); letter-spacing: .1em; color: #fff1dc; }
#codex .ca-row i { font-style: normal; font-size: 10px; letter-spacing: .12em; opacity: .6; margin-left: 8px; }
#codex .ca-row s { display: block; text-decoration: none; font-size: 11px; opacity: .8; margin-top: 2px; }
#codex .ca-none { font-size: 11px; opacity: .55; padding: 4px 2px; }
`;
let styled = false;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const domainName = (d) => (DOMAINS?.[d]?.name || d || '').toUpperCase();

export function renderClassArts(codex, host) {
  if (!styled) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const g = codex.game, A = g.classArts, L = g.ledger; if (!A || !L) return;
  const cls = g.laidSpread?.class?.id ?? 'arcana.fool';
  host.appendChild(el('div', 'ca-head', `YOUR CLASS<b>${esc(classWords(cls))}</b>`));
  const open = openArts(L, g);
  const rows = { action: [], reaction: [] };
  for (const id of open) rows[CLASS_ARTS[id].kind].push({ id, label: CLASS_ARTS[id].label, from: classWords(CLASS_ARTS[id].cls).toUpperCase(), line: CLASS_ARTS[id].line });
  for (const [id, D] of Object.entries(DOMAIN_ARTS)) if (D.kind === 'action' && domainArtOpen(id, L, g)) rows.action.push({ id, label: D.label, from: domainName(D.domain), line: D.line });
  const cols = el('div', 'ca-cols');
  for (const slot of ['action', 'reaction']) {
    const card = el('div', 'ca-card'), worn = A.worn?.[slot];
    card.appendChild(el('h3', '', `${slot === 'action' ? 'ACTION' : 'REACTION'}<span>${slot === 'action' ? 'the art key' : 'fires itself'}</span>`));
    const list = rows[slot].sort((a, b) => (a.id === worn ? -1 : b.id === worn ? 1 : a.label.localeCompare(b.label)));
    if (!list.length) card.appendChild(el('div', 'ca-none', slot === 'action' ? 'None open yet. Play as a class to open its action.' : 'None open yet. Play as a class to open its reaction.'));
    for (const r of list) {
      const b = el('button', `ca-row${r.id === worn ? ' worn' : ''}`, `<b>${esc(r.label)}</b><i>${esc(r.from)}${r.id === worn ? ' · WORN' : ''}</i><s>${esc(r.line)}</s>`);
      if (r.id !== worn) b.onclick = () => { if (A.wear(r.id)) codex.render(); };
      card.appendChild(b);
    }
    cols.appendChild(card);
  }
  // your class's arts still closed: how far each way is (the count way and the feat way)
  const closed = artsOf(cls).filter((id) => !artOpen(id, L, g));
  if (closed.length) {
    const card = el('div', 'ca-card');
    card.appendChild(el('h3', '', `TO OPEN<span>as ${esc(classWords(cls))}</span>`));
    for (const id of closed) {
      const R = CLASS_ARTS[id], P = A.progress?.(id);
      const how = P ? `${P.minutes} of ${P.of} real minutes as this class, or ${P.done} of ${P.n} ${esc(FEAT_WORDS[P.feat] || P.feat)}.` : '';
      card.appendChild(el('div', 'ca-row worn', `<b>${esc(R.label)}</b><i>${R.kind.toUpperCase()}</i><s>${esc(R.line)}</s><s>${how}</s>`));
    }
    cols.appendChild(card);
  }
  host.appendChild(cols);
}
