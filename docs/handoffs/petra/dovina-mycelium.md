# From Dovina (Design): the Mycelium, approved and started (2026-10-08)

**The owner's rulings:**
- Myggdrasil gets its own planetoid, and its model is BIG.
- Keep the keepsake pots.
- The strain names are approved.
- His words: "start building it".

`docs/plans/MYCELIUM.md` sections 9 and 10.

**My side, built and checked:**
- `game.sporeBeds` (`progress/sporebeds.js`), `game.myggdrasil` (`progress/myggdrasil.js`) and `game.keepsakes` (`progress/keepsakes.js`);
- their tracking rules and eight achievements;
- the chat line's `/spore` and `/tree` for testing;
- `node scripts/mycelium.mjs`, which includes the services played against a stand-in game. All pass.
- Small hub edits in `main.js`: the three services, the `itemOf` import, the two chat commands.

**The world side (`src/world/garden/`). Yours, unless you want me to take it, as we split the rail. Say which.**
1. **Myggdrasil's planetoid** (`ECON.myggdrasil`):
   - given at the second Firing (Sinter), not bought;
   - radius 26 m, the largest;
   - the tree 48 m tall, a landmark from every planetoid.
2. **The spore bed as a feature:**
   - placed, it emits `garden.place { feature: 'sporebed' }`, and `game.sporeBeds` grants a bed;
   - the hand's verbs: inoculate (pick a held strain), set (the Pneuka Box's slots), back (in the first game hour), harvest;
   - `sporeBeds.near(i, strains)` whenever beds move (the neighbours' strains pace it);
   - `sporeBeds.tend(i, true)` when a spirit stands to it.
3. **Myggdrasil's verbs:**
   - feed at the roots (`feed(boxSlot)`);
   - pick at the crown (`pick()`);
   - hang a card on a branch (`hang(arcanaId)`: it takes the card from the Book).
   - `dawn()` runs on `garden.enter` already. Call it on the clock too, if the garden stays open across a dawn.
4. **Keepsake pots:** `game.keepsakes.pots`, one a release. Place each somewhere in the Inner Realm. The look is Calissa's.
5. **The Codex's Grimoire of Echoes page:** the graft pairs found (`spore.graft.made.*`), the strains held, the branches hung.

The looks are Calissa's (the model BIG) and the words Espada's.

**One small ask for `creatures/bound.js` (yours):** add `feeling: e.sp?.feeling` to `spirit.release`'s payload. A keepsake pot passes it on
in `keepsake.pot { feeling }`, so the pot's song sings in its spirit's real mode (Wanda's ask: `audio/mycelium.js`). Until then it is
null, and Wanda draws a mode from the kind.
