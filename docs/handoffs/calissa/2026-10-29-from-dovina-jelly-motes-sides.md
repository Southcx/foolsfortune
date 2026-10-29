# From Dovina: the motes' bug, each side of the tsuitate its own, the slip jelly's looks (claude/dovina-design)

1. **A bug South saw** (in your `vfx/duelview/juice.js`): "the particles that fly out when gems break are going towards the old location
   of the lachrimeter (on the left side of the screen) instead of its current position." Measured headless:
   - `trickle()` aims every mote at one fixed point, the frame's lower right corner (`D.W / 2 + D.b * 0.5`). On the desk at 960 x 600
     that is (593, 386), while the Lachrimeter's tube stands at x 820 to 960.
   - `linkAt()` flips that corner for the phone's duel screen (`hudLayout.duelR`); the trickle doesn't.
   - So the motes land on the board's corner, never on the tube. On the phone they go to the side away from the link's end.
   - I couldn't reproduce South's left side exactly. The likely fix is to aim at the tube's live screen place (or at least at
     `linkAt`'s point). The case for the casebook is yours.
2. **Each side of the tsuitate shaped as its own** (South, 2026-10-29): "the sides tsuitate should take on the shape of the aesthetic of
   the courier or aberrant respectively. More thematic resonance doubled by the backgrounds."
   - Your half's frame: your garden's (`game.gardenBackdrop()`).
   - The aberrant's: its own (the Wisp's fen reeds and lantern iron, the jelly's slime).
3. **The slip jelly** (ABERRANTS.md 5): every blotling brings its board now.
   - **Slime.** A junk piece with `slime: true` (drawn as plain junk until yours).
   - **Transmute on slime.** The `transmute` event has `from: 'slime'`, and the pieces turn from junk to gems in place, same ids.
   - **Its foe skills.** Spew (a big Hurl of slime) and Harden (`foe.skill harden { cells }`: slime set into plain junk).
   - **Its Zone of Influence.** Gall.
   - **Its two deaths.** The Line's: it bursts into its slime. The secret's: its slime runs off your half back into it and it slumps flat.
   - **The secret's tell.** The jelly shrinks as `secret.k` (the pile) rises.
4. **Kindle, yours** (a learned skill: PUZZLE-DUELS.md 26.10): its tile glyph (`du.power.kindle`) and its cast. Event `kindle { cells }`:
   junk lit into embers in place, cooling at your turn's end.
5. **A lantern pendant for the Pneuka Jar** (`pendant.lantern`), if you like it. I'd open it by the Wisp's secret (cosmetics.js).
   Say yes and I add the row.
Still standing from before: the Wisp's Elite looks, your half as your garden, the turn's change.
