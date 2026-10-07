**Petra's open items** (the folder's done notes cleared 2026-10-07; what was still open in them is here)
- **The draught**: nothing sets `game.draught` (Dovina's stones, `progress/stones.js`, are the Courier's Lachryma intake; the intake itself
  belongs in `courier/lachryma.js`). Wanda's garden cue and Calissa's garden sky read it; both default to wonder until it exists.
- **The Crucibelle's scale**: wire the Crucibelle to `game.music.scale()` (Wanda's: the bar's five notes, agate and torn skies included).
- **The trailer's weather**: reset `game.weather.last` when the trailer ends, so the first `weather.now` fires at play start.
- **The Dunes made bigger** (`docs/plans/DUNES.md`): waits on the owner (it moves the shore, the jetty and the crossing's start).
- **The stress test's rare `embedded` / `guard:nudge` at cp T1** (about 1 run in 10, fresh page only, after a grapple swing): not seen
  since R57; reopen if it returns.
- **The heap**: 322 MB at 6d900d1, budget raised to 330. 44 MB of geometry hangs on meshes with no zone (35 MB unnamed `Mesh`), 7.8 MB in
  `shards`; find what they are (the crossing's parked sea and ship?) and whether they need to live from boot. The garden is 1 MB.
- **The belt's draw calls**: about 30 in every zone (the Veritome's rest bake 10 draws, the Sondelass's 6, the Soul Brush's 6 at rest and
  11 awake, the psygun's 2). `render/restbake.js` should merge a tool's meshes by material (vertex colours for the rest): the Veritome's 10
  to 2. The Dunemaw floor's budget went 80 to 88 for it.
- **Dovina's unwired data** (her note, 2026-10-07): the weather's `mindDrift`, `fishPull`, `signatureMult` have no callers and
  `buildMult` reaches `friendly.js` only; Grain (`progress/combat/temperament.js`) is imported by nothing; `voyage.reckon` and
  `reckonLead` are never called (Divination does not chart a crossing, the owner's R57 ruling). For the next round.
- **Wanda's asks** (round robin): the ground's material under a step (`move.step { surface }`), and an `acoustic` on each zone.
- **Co-op's room (waits on the owner)**: guests (coop/guests.js) need the build's capabilities to add `room` (and `user` scopes
  `profile` for names); the publish that adds it was refused as a permission grant: the owner's OK first. Until then guests are dormant.
- **Co-op, next (waits on Dovina's COOP.md rulings)**: what siblings may do (strike, gather, open), how the party is called in play, the
  shared errand for guests (the host's quest), what a session may write. The siblings' draw calls: five in view +58 (the workshop 483,
  over 450); rest-bake merging is the cut (above).
- **Perf's draw times are noise on the software renderer** (the Dunes' draw 13.6 to 21.6 ms between runs of one build, today): a
  median of three runs before the gate compares, or the draw row read with a wider tolerance; the baseline at v102 is a high one.
- **Co-op built so far** (v103): siblings met, called at Shrines, two out, /sib, beside you, the channel at Dovina's cadence, fighting by temperament
  at 0.4 of the sustained damage, the order wheel (T), pointing at what lies loose. **Still to build:** the tools in their hands (Calissa's
  models; Dovina's coffin, Espada's dowsing of Lachryma), the god hand's art wheel onto feedback/wheel.js, siblings that can be struck and shatter, the
  guests' shared errand (the Dunemaw run, host-owned; waits on the room).

