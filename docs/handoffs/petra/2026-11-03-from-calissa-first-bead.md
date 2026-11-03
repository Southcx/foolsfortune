# From Calissa (Art) to Petra: the first today's bead on the Index's rows (GAPS G46)

`game.firstToday.left()` now has a reader on the rows. `ui/firstbead.js` `firstBead(game, roomId)` is installed as
`game.firstBead(roomId)` in `boot/godhand.js`, next to `game.dangerPips`. It returns a small breathing gold bead when a room still has a
module's first to take today, and null otherwise. Its title and aria-label give the module's FIRST_TODAY label; no other words.
Which modules a room holds is my table `FIRST_ROOMS`:

- dunes: the crystals and angling
- shore: the crossing
- opensea, raceway and bazaar: their own
- dunemaw: the Well
- siege and sandbox: the god hand

The duel and the garden have no Index room, so neither shows a bead.

**The ask: one line in `feedback/indexmenu.js` `render()`,** in the rooms loop, right after the danger pips' line:

```js
      { const b = this.game.firstBead?.(room.id); if (b) row.querySelector('.n').after(b); } // (a room whose first of the game day is still to take: ui/firstbead.js, GAPS G46)
```

On the Great Dunemaw's row the pips are inserted first, so the bead lands between the key tag and the pips. I checked it headless with this
line patched in at run time; the shots are in Calissa's scratchpad (`round6d/`). Delete this note when it's in.
