// ---------------------------------------------------------------------------------------
// THE LEND PANEL'S LOOK (docs/plans/DEBUG-MODE.md section 4; the data, the setting and the gates are Dovina's, src/progress/lend.js:
// LENDS, game.lend.has / set / all / state). One switch a row, a row a category (its label and its one line, from LENDS: Espada's
// words), shown only in the DEBUG save; mounted in the Codex (its LENDS shelf) and in QAIS (its Lends tab), each the same element.
// Also the two marks the rule "a lent thing is never shown as earned" asks for, and the name of the save you are in.
//
// One look, named plainly: A BREAKER PANEL. Each row a switch thrown left (STORY's rules: earn it) or right (lent); the knob's place
// says which, the state word under the label says it again, and a lent row wears the hollow mark: never the colour alone.
//
//   THE ROW      the switch (a pill, its knob left or right) | the label, bold, and its one line | the state: the hollow mark and LENT,
//                or STORY RULES with no mark. A click anywhere on the row throws it. ALL and NONE above the rows, with the count lent.
//   THE MARKS    lentMark('earned') a solid disc; lentMark('lent') a hollow ring (the same size and ink): an art or a knack the ledger
//                gave you, and one only lent. A shape, so it reads in greyscale and to every eye.
//   THE SAVE     saveName(game) 'DEBUG save' | 'STORY save' (DEBUG-MODE.md section 2: the Codex says which save you are in)
//
// Prior art: Celeste's Assist Mode and Hades' God Mode (each switch honest about what it changes), the iOS switch (state by the knob's
// place first, its fill second), a breaker panel's labelled rows, and the hollow vs filled marks of a checklist (ticked for done, an
// outline for "given, not done": Steam's achievement greyed vs lit, here as shape rather than shade).
//
//   import { lendPanel, lentMark, saveName } from '../../ui/lendpanel.js'
//   host.append(lendPanel(game, { onChange }))   (an element; null outside DEBUG: STORY has no panel)
//   `${lentMark(lent ? 'lent' : 'earned')}`      (an inline mark, HTML)
// ---------------------------------------------------------------------------------------
import { LENDS } from '../progress/lend.js';

const CSS = `
.lendp { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.lendp .lp-head { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; font-size: 11px; letter-spacing: .12em; }
.lendp .lp-head .lp-save { flex: 1; color: #fff1dc; }
.lendp .lp-head button { all: unset; cursor: var(--jcur-pointer, pointer); padding: 3px 10px; border: 1px solid rgba(255,241,220,.45); border-radius: 3px; letter-spacing: .12em; }
.lendp .lp-head button:hover, .lendp .lp-row:hover { background: rgba(var(--jsel, 120,60,40), .35); }
.lendp .lp-rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 6px; }
.lendp .lp-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 10px; align-items: center; padding: 7px 10px; border: 1px solid rgba(255,241,220,.22);
  border-radius: 4px; background: rgba(28,13,8,.35); cursor: var(--jcur-pointer, pointer); }
.lendp .lp-row.on { border-color: rgba(255,241,220,.6); }
.lendp .lp-sw { position: relative; width: 36px; height: 16px; border-radius: 8px; border: 1px solid rgba(255,241,220,.6); background: rgba(10,4,2,.7); box-sizing: border-box; }
.lendp .lp-sw::after { content: ''; position: absolute; top: 2px; left: 2px; width: 10px; height: 10px; border-radius: 50%; background: rgba(255,241,220,.55); transition: left .12s; }
.lendp .lp-row.on .lp-sw { background: rgba(var(--jsel, 120,60,40), .9); }
.lendp .lp-row.on .lp-sw::after { left: 22px; background: #fff1dc; box-shadow: 0 0 5px rgba(255,241,220,.7); }
.lendp .lp-t b { display: block; font-weight: normal; letter-spacing: .08em; color: #fff1dc; }
.lendp .lp-t s { display: block; text-decoration: none; font-size: 11px; opacity: .7; line-height: 1.35; }
.lendp .lp-st { font-size: 10px; letter-spacing: .14em; display: flex; align-items: center; gap: 5px; white-space: nowrap; opacity: .9; }
.lendp .lp-row:not(.on) .lp-st { opacity: .55; }
.lendp .lp-note { font-size: 11px; opacity: .65; line-height: 1.45; margin-top: 4px; }
.lentmark { display: inline-block; width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; vertical-align: middle; flex: none; border: 2px solid currentColor; }
.lentmark.earned { background: currentColor; }
.lentmark.lent { background: transparent; }
`;
let styled = false;
const style = () => { if (styled || typeof document === 'undefined') return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Which save you are in, as the Codex names it. */
export const saveName = (game) => (game?.mode === 'story' ? 'STORY save' : 'DEBUG save');

/** The mark beside an art or a knack: 'earned' (solid, the ledger gave it) or 'lent' (hollow, the lend panel did). HTML. */
export function lentMark(kind) {
  style();
  return `<i class="lentmark ${kind === 'lent' ? 'lent' : 'earned'}" title="${kind === 'lent' ? 'lent' : 'earned'}"></i>`;
}

/** The panel: an element, or null where there is none (the STORY save, or no lend service). onChange() after any switch is thrown. */
export function lendPanel(game, { onChange } = {}) {
  const N = game?.lend;
  if (!N || game.mode !== 'debug') return null;
  style();
  const root = el('div', 'lendp');
  const draw = () => {
    root.replaceChildren();
    const ids = Object.keys(LENDS), lent = ids.filter((id) => N.state[id]).length;
    const head = el('div', 'lp-head', `<span class="lp-save">${saveName(game)} · ${lent} of ${ids.length} lent</span>`);
    const all = el('button', '', 'ALL'), none = el('button', '', 'NONE');
    all.title = 'Lend every category'; none.title = 'Every category by STORY\'s rules';
    all.onclick = () => { N.all(true); draw(); onChange?.(); };
    none.onclick = () => { N.all(false); draw(); onChange?.(); };
    head.append(all, none);
    root.appendChild(head);
    const rows = el('div', 'lp-rows');
    for (const id of ids) {
      const on = !!N.state[id], L = LENDS[id];
      const row = el('div', `lp-row${on ? ' on' : ''}`,
        `<span class="lp-sw"></span><span class="lp-t"><b>${esc(L.label)}</b><s>${esc(L.opens)}</s></span><span class="lp-st">${on ? `${lentMark('lent')}LENT` : 'STORY RULES'}</span>`);
      row.dataset.lend = id;
      row.setAttribute('role', 'switch'); row.setAttribute('aria-checked', String(on));
      row.onclick = () => { N.set(id, !N.state[id]); draw(); onChange?.(); };
      rows.appendChild(row);
    }
    root.appendChild(rows);
    root.appendChild(el('div', 'lp-note', `A lent category opens without the ledger and is never counted. Switched off, it plays by STORY's rules here in the ${saveName(game)}: that is how an unlock is tested. A lent art shows ${lentMark('lent')}, an earned one ${lentMark('earned')}.`));
  };
  draw();
  return root;
}
