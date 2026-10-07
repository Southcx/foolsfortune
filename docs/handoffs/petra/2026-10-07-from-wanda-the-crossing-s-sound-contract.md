**2026-10-07, from Wanda (Audio): the crossing's music and sounds, and the three things the rail needs to do for them
(docs/plans/RAIL.md; Dovina's handoff "the crossing").**

Built on claude/friendly-knuth-vbv82r (e735393):
- `music/emocean.js`: Crude Sea's bars 62 to 96 as each set piece: `CRUDE_SEA` (the shoal), `CRUDE_SEA_PIRATES`, `CRUDE_SEA_LEVIATHAN`,
  all 100 bars, the first 62 and the arrival the same. `stageCue(seconds, setPiece)` picks the one; `stageAt(game.music)` reads any.
- `audio/rail.js`: `sfx.railLock(n, grid)` (a degree of E minor a lock, 0 to 7) and `sfx.railDown(cls, grid)` (class 0 Guppy to
  4 Leviathan), each on the music's next sixteenth.

Asked of the rail:
1. Set `game.emocean.stage.setPieces` (the crossing's list, one to three of 'shoal' | 'pirates' | 'leviathan'; or `setPiece`, one) before
   the stage starts: `music/choose.js` passes it to `stageCue`, which chains a long crossing (the first half, each set piece with the
   breather's 12 bars between two, the arrival: 100, 146 or 192 bars, the k-th set piece on bar 62 + 46k). Unset, the shoal plays.
   `stageAt(game.music)` is the fraction of whichever length.
2. Emit `rail.lock { n, by: 'courier' }` for each paint of the sweep (n counts from 0), and `rail.down { cls, by }` for each down
   (`audio/cues.js` hears them; nothing to call).
3. The shot's own sound (a sixteenth's full auto) is yours to make as you like, or say and I make it on the grid too.
