# From Calissa: the mimicry puzzles' and the Sandbox's looks are in (your placeholders hidden, not removed)

Your note of 2026-10-30, built. The looks draw over your runtime and hide your stand-ins. I changed none of your files. Two lines
were added to hubs (boot/rooms.js and boot/frame.js), plus one in boot/warmup.js.

**Hidden by my looks. Please remove them when you agree:**
- `world/mimicry/mimicry.js` `dress()`: the clay cylinders and gold bands (`this.group`). The stones are now `vfx/mimicry/stones.js`.
  I hide your group each frame, so once you remove it that line does nothing.
- `world/mimicry/mimicry.js` `ghost()` / `clearGhost()`: the gold wire net (`this.wire`). The ghost is now `vfx/mimicry/ghost.js`.
- `world/sandbox/sandbox.js`: the lecterns' boxes and gold tops (colour `lectern`, `gold`), only their looks. Keep the colliders.
- `world/sandbox/yard.js` `penPosts`: the posts' look. Keep the colliders.
- `world/sandbox/pitch.js`: the goal's square posts (`C.post`) and the net boxes (`C.net`), only their looks. Keep the colliders.
- Your floor, walls, band and the pitch's low walls stay as geometry. My look draws that same geometry again in room glazes and hides
  your copy, so you can keep these as they are.

**What my looks read from your runtime (all read-only, please keep these working):**
- `game.mimicry.stones`, `.group`, `.wire`, `.pick(st)`.
- `game.mimicry.S`: `.at`, `.F`, `.fr.start`, `.fr.target`, `.P.steps`, `.st`, `.demo`. This is read at `mimic.open` and as the
  ghost refreshes. If you would rather hand these out through a getter (`view()`), name it and I will switch to it.
- `game.sandbox.room` and `.built`, and `game.sandbox.pitch.ball` (its `mesh` and its `body`).
- My look swaps your ball's geometry for a temari. It keeps your material, your body and your outline.

**Panic** (`vfx/panic.js`) works anywhere. `impact.hit` names only the creature's kind, so I find the creature itself through a note
`vfx.hit` keeps when `cause === 'thrown'` (`game.vfx.lastThrown`). That note is set in the same call that emits your event. If you
would rather put a position or an id on the payload, tell me and I will read that instead.

**Questions for you:**
1. Kemari's four trees stand in pots on the pitch's corner piers. They have no colliders. In kemari the trees were part of play: the
   ball bounced off their branches. Adding colliders would make them part of play here too. Your call.
2. Your note says five stones. `MIMIC_SITES` has four (flats, shore, ridges, ruins), and the look draws whatever the runtime places.
3. The glossary's "a strike" says three or more creatures. `IMPACT.strike` is 2.
4. Not built: MIMICRY.md 7's readout tag on the stone while a puzzle is open (MATCH, strokes, stars). It would be the overlay's (a
   tag), not a world mark. Ask if you want it.

Delete once read.
