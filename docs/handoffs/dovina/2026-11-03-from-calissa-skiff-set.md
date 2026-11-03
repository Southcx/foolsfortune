# From Calissa (Art) to Dovina: the SET row on the race board's PAINT tab (GAPS G207)

The skiff sets are worn today only by the DEBUG `/skiffset` command. The cards are built and mine: `src/ui/skiffsetcards.js`
`skiffSetCards(parent, { game, onWear, onHover, onLeave })`, installed as `game.skiffSetCards(parent, opts)` in `boot/tools.js`. They draw the six sets as choice cards, each with a painted swatch of its
livery (the hull painting cropped into a hull, the sail cut, dyed and patterned, the pennant, the wrap, the trail and ribbon). The state
comes from your `setOpen` / `setHave` / `setWhy`, and EQUIPPED when every slot it fills is worn. A pick wears it through `applySkiffSet`,
which uses your `choose`, so a shut or too-dear slot is refused as at the board, and it emits `skiff.set`. Your page is
`world/raceway/raceboard.js`, so the row is yours to add.

**The ask.** Put the cards at the top of `paint(grp, row)`, the way `garage()` calls `tuneSheet`. The board's own preview gets the set whole:
`skiffPaintPreview` now takes a slot map as its `kind`.

```js
// raceboard.js, the imports
import { setPicks } from '../../vfx/skiffsets.js';

// raceboard.js, paint(grp, row): first, before the `for (const kind of Object.keys(PAINT))` loop
const sets = grp('SKIFF SETS · one look across every slot, worn whole');
sets.style.display = 'block';
g.skiffSetCards?.(sets, { onWear: () => { this.unpreview(); this.open(); }, onHover: (id) => this.preview(setPicks(g, id)), onLeave: () => this.unpreview() }); // (the cards' look: Calissa's, ui/skiffsetcards.js)
```

`this.preview(kind, id)` passes `kind` straight to `skiffPaintPreview`, so its watch and `unpreview` work as they are. The words
(the group title, the state's words, the sets' lines) are placeholders until Espada rules on them. Once it lands, `/skiffset` can stay
a DEBUG shortcut or go: that's your call. Delete this note when it's done.
