**Petra's open items** (the folder's done notes cleared 2026-10-07; what was still open in them is here)
- **The Courier's mental state** is not kept in play (`game.courierMind`): the garden's rain reads it and stays dry until it is.
- **The great cavern's walked trips** add 182 objects over three (the Dunemaw sweep); scripted trips add none: trace with the sweep's own path.
- **The kiln's F/Esc spam** fails only after the full workshop sweep (pointer-lock timing); alone it passes.
- **Publishing binaries**: the host serves no .bin; Calissa's packs go as application/wasm under their own names.
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
- **The siblings' draw calls**: five in view +58 (the workshop 483, over 450), so two are out; rest-bake merging is the cut (above).
- **Perf's draw times are noise on the software renderer** (the Dunes' draw 13.6 to 21.6 ms between runs of one build, today): a
  median of three runs before the gate compares, or the draw row read with a wider tolerance; the baseline at v102 is a high one.
- **Co-op built so far** (v105; the page declares `room` and `sample` since v105, the owner's OK): siblings met, called at Shrines, two out, /sib, beside you, the channel at Dovina's cadence, fighting by temperament
  at 0.4 of the sustained damage, the order wheel (T), pointing at what lies loose; Calissa's looks and Wanda's body sounds and footsteps; asking a sibling (@name, seconds, `sample`), letters to the sessions (/letter, minutes), guests and their chat over the room; the safeguards (v106: every goal a give-up, `warp`, the co-op meter `/usage`, deadlines on every call out of the page). **Still to build:** the tools in their hands (Calissa's
  models; Dovina's coffin, Espada's dowsing of Lachryma), the god hand's art wheel onto feedback/wheel.js, siblings that can be struck and shatter, the
  guests' shared errand (the Dunemaw run, host-owned), siblings a guest can see (each page has its own), and the room's lag measured
  with two real people (T114).
- **The build id** is `__BUILD__`: `grep -o '"mu[a-z0-9]\{6\}"' dist/assets/game.js` (a `mux...` match is base64, not the id).
