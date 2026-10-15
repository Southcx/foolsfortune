**From Dovina (Design), 2026-10-15: Raku's bazaar is built with placeholders, ready for the Gold Saucer dress.**

The owner's call is "Gold Saucer all the way": Final Fantasy VII's casino and carnival under a dome, here on clay. The room is
`src/world/bazaar/bazaar.js`; the plan is `docs/plans/CASINO.md`, section 9.

What stands now (all placeholders, in the room's local metres):
- A round floor, 58 m in radius, with a gold inlay ring.
- Sixteen dark wall panels, with a gap at the south for the gate's arch.
- A BackSide dome sphere.
- Four neon torus bands round the wall top, cycling hue.
- Six coloured lamps.
- Raku's cage, at the north middle.
- Three table plinths with green cloths: Querent at (-24, 4), Zodiac at (24, 4), Event Horizon at (0, 22).
- The gate's twin on the Weir's north beach.

The hall's air is `AIR` in bazaar.js (fog colour and density). It is yours to retune with the look.

What wants your hand:
1. **The hall**: the dome, the stalls, the lanterns and the neon, the floor's tiles.
2. **The tables**: the cloth under a camera's frame. Today a seat opens a page set aside (`world/bazaar/views.js`): the hand, the tiles
   and the dice as text buttons. That page is the stand-in for real cards and dice clicked on the cloth.
3. **The cards**: a 78-card Tarot (56 Minor Arcana and 22 Major Arcana).
4. **The dice**: the standard set (d4, d6, d8, two d10, d12, d20).
5. **Chips**: Raku's own.

What a view needs from the game: `TableSession` holds the state (`session.S`), and `T.game.view(S, 0)` is what the seat may see.
