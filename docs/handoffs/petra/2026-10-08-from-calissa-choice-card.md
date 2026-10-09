**2026-10-08, from Calissa (Art): the choice card, its icons and the keywords (branch art-choice-card)** (delete in your branch when done)

CLARITY.md sections 4, 5 and 8, built as a DOM component any window can use in place of the index's row (a glyph, a title, a grey
sentence). No WebGL: no program, no draw call. About 22.9 KB minified (8.2 KB gzip) joins `game.js`; the workbench's card sheet is its
own lazy chunk (4.79 KB).

**Built (mine):** `ui/choicecard.js` (`ChoiceCard`, `choiceCard`, `cardList`, `slotRow`), `ui/keywords.js` (`KEYWORDS`, `keywordEl`,
`keyworded`), `ui/icons/` (`hand.js` the icons' hand, `keywordart.js`, `mountart.js`, `chipart.js`, `icons.js` `uiIcon` / `iconEl`),
`ui/mountcards.js` (Dovina's MOUNTS as card rows, bars turned to real seconds by `BAR_S`), and the workbench's CARDS tab
(`workbench/cardsheet.js`).

**CROSSING, `world/emocean/pier.js` (yours), 10 lines in, 11 out (the review added two, the scroll):** the mount rows are now the slot
row and a choice card each. Same `this.chosen`, same `slice(-n)`, same `this.open(at)` redraw; the group title and every other row
untouched. `MOUNTS` is no longer imported there. `open` also keeps the page's scroll when it draws the pier page again (a pick used to
send it to the top: 259 to 0 at 854 x 480, the mounts off the screen). Played headless: a click on a ready card takes it aboard, a click
on a slot takes its mount ashore, and the keyboard does the same: the first arrow enters the cards (Tab is the game's), arrows move,
Enter or Space picks and the card keeps its focus across the redraw; no page errors. The emocean sweep's pier part: 27 pass, 1 fail,
the fail being Dovina's click by the old `.room` / `.n` selector (her handoff has the two-line fix).

**The recipe for every other window** (the traffic order in CLARITY.md section 9; the sea chart is next):
```js
import { ChoiceCard, cardList } from '../../ui/choicecard.js';
// a row: { name, does, lore?, detail?, cost?, charges?, cooldown? (real s), duration? (real s), range? (m), angle? (deg), always?,
//          icon ('kw.<id>' | 'mount.<tool>' | 'chip.<id>'), key ('1' | ['LMB','RMB'] | 'passive' | null), state ('equipped'|'ready'|'locked'), opens? }
im.appendChild(cardList(rows.map((r) => new ChoiceCard(r, { onPick: (row) => act(row.id) })), { cols: 2 }));
```
- `card.compareTo(baseRow)` for anything that replaces something (arrows on the chips that change).
- `slotRow({ slots, filled: [row|null], always: row, onPick(i) })` for a loadout.
- `keyworded(text)` for any line that should explain its keywords on hover (returns a fragment).
- A table kept in bars or game hours is turned to real seconds before it reaches a card (see `ui/mountcards.js`).
- A window with no icon of its own yet: leave `icon` out and the card keeps its slot empty; ask me for the picture.

**Open, for you:** the pier's other rows (the islands, the ships) are still mouse-only `.room` divs: a keyboard player reaches the
cards and the slot row and not those. The world preview at the mooring (a mount's cone or ring drawn on the moored hull, CLARITY section 6)
is not in this branch. A card's compare arrows are built (`compareTo`) and shown on the workbench's sheet but not in the pier: a pick
there silently bumps the oldest mount (`slice(-n)`), so an arrow needs to say which one it replaces; your call before it is wired.
