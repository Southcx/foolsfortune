// ---------------------------------------------------------------------------------------
// THE MOVES' TREE (docs/plans/GAPS.md G139; MELEE-LOADOUT-EARNING.md section 2: "the Codex's Sondelass page shows the tree with the next
// row's two ways"): the melee loadout's catalogue drawn as the tree it grows in, under the loadout editor on the Codex's SONDELASS shelf.
// Each root (a move known from the start, or one with no parent) heads a branch; under it the moves that grow from it, indented on a
// gold stem, each a node with its label, its kind (a normal or a special) and its state (known, lent in DEBUG, or locked). A locked
// move whose parent is known is the next row: its two ways are shown with it, the count way's and the feat way's, each with the
// ledger's number of what it asks (loadoutopen.js moveWays, drawn by the choice card's `waysEl`). A locked move deeper than that says
// only what it grows from, so the tree reads as a road and not a wall. Words placeholders for Espada's.
//
// Prior art: Monster Hunter's weapon tree (a branch, what each next one asks), God Hand's Combo Tree beside its technique list, Path of
// Exile's passive tree read as a path (only the nodes next to what you have are reachable), Old School RuneScape's skill guides.
//
//   moveTree(game) -> element
// ---------------------------------------------------------------------------------------
import { SONDELASS_MOVES } from './sondelassloadout.js';
import { moveStatus, moveWays } from './loadoutopen.js';
import { labelOf } from './loadoutwords.js';
import { waysEl } from '../../ui/choicecard.js';
import { lentMark } from '../../ui/lendpanel.js';

const WORDS = { title: 'THE MOVES\' TREE', note: 'each move grows from the one above it · the next ones show their two ways', normal: 'normal', special: 'special', known: 'KNOWN', locked: 'LOCKED', after: (p) => `after ${p}` };
const CSS = `
.mt { margin: 14px 0 6px; font: 500 12px/1.3 var(--f-ui, sans-serif); color: #f3e2cc; }
.mt .mt-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 11px; letter-spacing: .26em; color: var(--accent, #ffb27a);
  margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,178,122,.2); }
.mt .mt-h small { letter-spacing: .06em; font-size: 10.5px; color: #f3e2cc; opacity: .8; text-align: right; }
.mt .mt-roots { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px 14px; align-items: start; }
.mt ul { list-style: none; margin: 0; padding: 0 0 0 16px; position: relative; }
.mt ul::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 10px; width: 1px; background: linear-gradient(180deg, rgba(255,211,106,.7), rgba(255,211,106,.25)); }
.mt li { position: relative; margin: 4px 0 0; }
.mt li::before { content: ''; position: absolute; left: -10px; top: 12px; width: 9px; height: 1px; background: rgba(255,211,106,.55); }
.mt .mt-root { padding: 6px 8px 7px; border-radius: 4px; background: linear-gradient(180deg, rgba(var(--jbot, 34,15,9), .5), rgba(var(--jbot, 34,15,9), .78)); box-shadow: inset 0 0 0 1px rgba(255,217,138,.22); }
.mt ul.mt-top::before, .mt ul.mt-top > li::before { display: none; }
.mt .mt-node { display: flex; align-items: center; gap: 6px; padding: 3px 7px; border-radius: 3px; border: 1px solid rgba(255,230,200,.18); background: rgba(0,0,0,.22); }
.mt .mt-node b { font: 700 12.5px/1.2 var(--f-title, serif); letter-spacing: .06em; text-transform: uppercase; color: #fff3df; }
.mt .mt-node small { font: 600 9.5px/1 var(--f-ui, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: #f3e2cc; opacity: .7; }
.mt .mt-node .mt-st { margin-left: auto; font: 800 9.5px/1 var(--f-ui, sans-serif); letter-spacing: .12em; white-space: nowrap; }
.mt .mt-node.known { border-color: rgba(255,217,138,.55); box-shadow: inset 0 0 0 1px rgba(255,217,138,.18); } .mt .mt-node.known .mt-st { color: #ffd98a; }
.mt .mt-node.locked { border-style: dashed; } .mt .mt-node.locked b { opacity: .7; } .mt .mt-node.locked .mt-st { color: #f3e2cc; opacity: .7; }
.mt .mt-node.next { border-color: rgba(255,217,138,.8); border-style: dashed; background: rgba(var(--jsel, 196,106,69), .14); } .mt .mt-node.next b { opacity: 1; }
.mt .mt-far { margin: 1px 0 0 8px; font-size: 10.5px; opacity: .65; }
.mt .cc-ways { margin: 3px 0 2px 2px; }
`;
let styled = false;
const style = () => { if (styled || typeof document === 'undefined') return; styled = true; const st = document.createElement('style'); st.id = 'movetreecss'; st.textContent = CSS; document.head.appendChild(st); };
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

/** The tree, as an element. */
export function moveTree(game) {
  style();
  const rows = Object.values(SONDELASS_MOVES).filter(Boolean), kids = new Map();
  for (const r of rows) if (r.parent && SONDELASS_MOVES[r.parent]) { if (!kids.has(r.parent)) kids.set(r.parent, []); kids.get(r.parent).push(r); }
  const roots = rows.filter((r) => !r.parent || !SONDELASS_MOVES[r.parent]);
  const box = make('div', 'mt'), h = make('div', 'mt-h', WORDS.title); h.append(make('small', '', WORDS.note)); box.append(h);
  const grid = make('div', 'mt-roots'); box.append(grid);
  const node = (r, parentKnown) => {
    const st = moveStatus(game, r), next = !st.known && parentKnown, li = make('li');
    const n = make('div', `mt-node ${st.known ? 'known' : 'locked'}${next ? ' next' : ''}`);
    n.append(make('b', '', labelOf(r)), make('small', '', WORDS[r.kind] || r.kind));
    const s = make('span', 'mt-st', st.known ? WORDS.known : WORDS.locked);
    if (st.known && game.mode === 'debug') s.insertAdjacentHTML('afterbegin', lentMark(st.lent ? 'lent' : 'earned'));
    n.append(s); li.append(n);
    if (next) { const w = moveWays(game, r, SONDELASS_MOVES); if (w.length) li.append(waysEl(w)); }
    else if (!st.known && r.parent && SONDELASS_MOVES[r.parent]) li.append(make('div', 'mt-far', WORDS.after(labelOf(SONDELASS_MOVES[r.parent]))));
    const k = kids.get(r.id); if (k?.length) { const ul = make('ul'); for (const c of k) ul.append(node(c, st.known)); li.append(ul); }
    return li;
  };
  for (const r of roots) {
    const card = make('div', 'mt-root'), ul = make('ul'); ul.style.paddingLeft = '0'; ul.classList.add('mt-top');
    const li = node(r, true); li.style.margin = '0'; ul.append(li); card.append(ul); grid.append(card);
  }
  return box;
}
