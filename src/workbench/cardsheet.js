// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S CARD SHEET (its CARDS tab): the choice card (ui/choicecard.js) laid out for judging, the way a type designer proofs
// a face: the seven mounts as the pier would show them (from Dovina's MOUNTS, through ui/mountcards.js: one equipped in each slot, one
// locked, the rest ready), the slot row for a sloop and a frigate, two compared pairs (better and worse both ways), the twelve keywords
// with their tips and a line marked with them, and every icon at 1x and 2x in each palette it is swapped to. A row of window colours
// above it repaints the sheet in each (ui/theme.js THEMES), scoped to the sheet so the player's own choice is never changed.
// Clicking a mount card takes it aboard or ashore as the pier would (two slots), so the cards, the slot row and the keys move together.
//
// Prior art: a type specimen sheet and a UI kit's component page (Storybook: every state of one component on one page), and the
// workbench's own stages (workbench/stages.js: a look shown with the game's own modules and data).
//
//   cardSheet() -> element (absolutely placed beside the workbench's panel; .remove() when the tab changes)
// ---------------------------------------------------------------------------------------
import { ChoiceCard, cardList, slotRow, installChoiceCards } from '../ui/choicecard.js';
import { KEYWORDS, keywordEl, keyworded } from '../ui/keywords.js';
import { mountRow } from '../ui/mountcards.js';
import { ICON_IDS, iconEl } from '../ui/icons/icons.js';
import { MOUNTS } from '../progress/rail/mounts.js';
import { THEMES } from '../ui/theme.js';

const CSS = `
#cardsheet { position: absolute; top: 12px; bottom: 12px; left: 364px; right: 12px; pointer-events: auto; overflow: auto; box-sizing: border-box; padding: 12px 16px 18px;
  background: linear-gradient(180deg, rgba(var(--jtop), .97), rgba(var(--jbot), .98)); border: 1px solid var(--jmid); border-radius: 8px; box-shadow: 0 0 0 3px rgba(0,0,0,.45), 0 10px 30px rgba(0,0,0,.55);
  color: #f6ead8; font: 500 12px/1.35 var(--f-ui, sans-serif); text-shadow: 1px 1px 0 rgba(8,3,1,.75); }
@media (max-width: 900px) { #cardsheet { left: 12px; top: 120px; } }
#cardsheet h3 { margin: 14px 0 7px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,230,200,.2); font: 600 11px var(--f-title, serif); letter-spacing: .26em; color: #ffd98a; }
#cardsheet h3:first-of-type { margin-top: 6px; }
#cardsheet .themes { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
#cardsheet .themes b { cursor: pointer; padding: 2px 8px; border-radius: 3px; border: 1px solid rgba(255,255,255,.25); font: 600 10px var(--f-title, serif); letter-spacing: .12em; }
#cardsheet .themes b.on { border-color: #ffd98a; color: #ffd98a; }
#cardsheet .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
#cardsheet .cap { font-size: 10px; letter-spacing: .14em; opacity: .7; margin: 0 0 3px; text-transform: uppercase; }
#cardsheet .kws { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 4px 14px; }
#cardsheet .kws div { display: flex; gap: 8px; align-items: baseline; }
#cardsheet .kws span { opacity: .8; font-size: 11px; }
#cardsheet .line { margin-top: 8px; padding: 6px 8px; background: rgba(0,0,0,.22); border-radius: 3px; }
#cardsheet .icons { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: flex-end; }
#cardsheet .icons figure { margin: 0; display: grid; justify-items: center; gap: 2px; font-size: 9px; opacity: .9; }
#cardsheet .icons .row { display: flex; gap: 3px; align-items: flex-end; }
#cardsheet .uicon { image-rendering: pixelated; }
`;

/** The sheet. */
export function cardSheet() {
  installChoiceCards();
  if (!document.getElementById('cardsheetcss')) { const st = document.createElement('style'); st.id = 'cardsheetcss'; st.textContent = CSS; document.head.appendChild(st); }
  const root = document.createElement('div'); root.id = 'cardsheet';
  const h = (text) => { const e = document.createElement('h3'); e.textContent = text; root.append(e); return e; };
  const div = (cls, text) => { const e = document.createElement('div'); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  // the window colours, scoped to the sheet
  h('WINDOW COLOUR (this sheet only)');
  const themes = div('themes'); root.append(themes);
  const paint = (id) => {
    const t = THEMES[id]; for (const [k, v] of [['--jtop', t.top], ['--jbot', t.bot], ['--jsel', t.sel], ['--jhi', t.hi], ['--jmid', t.mid]]) root.style.setProperty(k, v);
    themes.querySelectorAll('b').forEach((b) => b.classList.toggle('on', b.dataset.t === id));
  };
  for (const [id, T] of Object.entries(THEMES)) { const b = document.createElement('b'); b.dataset.t = id; b.textContent = T.name; b.onclick = () => paint(id); themes.append(b); }

  // the mounts, as the pier shows them: two slots, one card locked
  const tools = Object.keys(MOUNTS), LOCKED = { veritome: 'Opens at the second Firing' }; // (CLARITY.md section 4's own example line: a placeholder)
  let chosen = ['sondelass', 'soulbrush'];
  h('THE MOUNTS (progress/rail/mounts.js, as the pier would show them; click to take one aboard or ashore)');
  const slots = div(); root.append(slots);
  const cards = tools.map((t) => new ChoiceCard(null, { onPick: (row) => { chosen = chosen.includes(row.id) ? chosen.filter((x) => x !== row.id) : [...chosen, row.id].slice(-2); redraw(); } }));
  root.append(cardList(cards, { cols: 2 }));
  const redraw = () => {
    tools.forEach((t, i) => cards[i].set(mountRow(t, { slot: chosen.indexOf(t) + 1, opens: LOCKED[t] })));
    slots.innerHTML = '';
    slots.append(slotRow({ slots: 2, filled: chosen.map((t) => mountRow(t, { slot: chosen.indexOf(t) + 1 })), always: mountRow('psygun'), onPick: (i) => { chosen = chosen.filter((_, j) => j !== i); redraw(); } }));
    slots.style.marginBottom = '8px';
  };
  redraw();

  // the slot row on a bigger hull
  h('THE SLOT ROW: A FRIGATE (3 slots, one empty)');
  root.append(slotRow({ slots: 3, filled: [mountRow('crucibelle', { slot: 1 }), mountRow('lockheart', { slot: 2 }), null], always: mountRow('psygun') }));

  // compared: each card against what it would replace, both ways
  h('COMPARE (a card against the one it would replace: solid arrow better, hollow worse)');
  const pair = div('pair'); root.append(pair);
  for (const [a, b] of [['sondelass', 'lockheart'], ['lockheart', 'sondelass']]) {
    const col = div(); col.append(div('cap', `${MOUNTS[a].name}, replacing ${MOUNTS[b].name}`), new ChoiceCard(mountRow(a, { slot: 1 }), { base: mountRow(b, { slot: 1 }) }).el); pair.append(col);
  }

  // the keywords
  h('THE TWELVE KEYWORDS (hover or focus one for its tip)');
  const kws = div('kws'); root.append(kws);
  for (const [id, K] of Object.entries(KEYWORDS)) { const d = div(), m = document.createElement('span'); m.textContent = K.means; d.append(keywordEl(id), m); kws.append(d); }
  const line = div('line'); line.append(div('cap', "the mounts' card lines, marked (keyworded)"));
  for (const t of tools) { const p = div(); p.append(keyworded(MOUNTS[t].does)); line.append(p); }
  root.append(line);

  // every icon, at 1x and 2x, in each palette
  h('THE ICONS (1x and 2x; gold, grey for locked, the sea chart\'s line)');
  const icons = div('icons'); root.append(icons);
  for (const id of ICON_IDS) {
    const f = document.createElement('figure'), row = div('row');
    row.append(iconEl(id, { px: 1 }), iconEl(id, { px: 2 }), iconEl(id, { pal: 'grey', px: 2 }), iconEl(id, { pal: 'line', px: 2 }));
    f.append(row, div('', id)); icons.append(f);
  }
  paint('kiln');
  return root;
}
