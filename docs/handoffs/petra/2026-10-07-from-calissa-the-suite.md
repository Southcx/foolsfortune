**2026-10-07, from Calissa (Art): the Courier's own animation suite is in, and it crosses your lane**

The owner's order to me: "a massive animation overhaul ... implement them" (melee combos, air combos, specials, Solar Skiffing, the
busking words). Your files carry most of it. I asked first (send_message, this morning) and built while waiting. Every crossing is listed
below for your review, and I'll take back anything you'd rather do yourself.

**For publishing (needed, or the game does not boot):** three files now sit beside the bundle and are fetched, not inlined:
`dist/assets/core-*.bin`, `combat-*.bin`, `social-*.bin` (the clip packs, application/octet-stream, 1.7 / 1.9 / 4.9 MB). (The chess
pieces, 0.4 MB, are inlined like every model.) The suite inlined would have taken game.js to about 25.6 MB, past the 16 MB a text file, and
kept about 13 MB of base64 string in the heap. game.js is unchanged at 13.9 MB.

**What others meet**
- `game.clipPack` (the pack; `.social` resolves when the emotes are in). 51 bones now: spine005 sits between spine004 and head (parent
  first, for mirrorPose). Old clips are widened and keep their names. 14 old names now play their suite twins (`ual:<name>` keeps the old).
- `tools/moveset.js`, one combo engine (its header is the contract). `Launch.go` takes `drive(vel, dt)` and `poseFix(pose)`, and a `go`
  while a launch is on restarts in place (casebook 32).
- `melee.js` `measureSwing(ch, clip, { limb })`: 'R' (the default, as before), 'L', 'footR', 'footL', 'auto'.
- Events: `combo.move {tool, move, kind, by}`, `combo.juggle {tool, hits, by}` (feedback/tracking/combo.js); `skiff.summon / .mount /
  .park / .recall / .bail {why, speed}` (feedback/tracking/skiff.js). Every one has a rule and carries `by`.
- Keys: R is every tool's special; F parks and mounts the skiff; Y summons and recalls it.

**Files outside my lane** (each: why)
- `src/courier/anim/suite.js` (new) and `romdata.js` (relearned): the pipeline (CLAUDE.md gives me the animation pipeline).
- `src/courier/character.js`: spine005 in MASK_UPPER and MASK_ARM (one line).
- `src/main.js`: `loadClips` in place of `decodeAnims`; `game.clipPack`.
- `src/courier/moves/launch.js`: drive / poseFix / re-entry.
- `src/tools/moveset.js` (new), `src/tools/melee.js` (limb), `src/tools/sondelass/{cutlass,sondelass}.js`, `angling/angler.js`: the
  cutlass on the engine, and the rod's suite clips.
- `src/courier/skiff/{skiff,boat}.js`, `rider.js` (new): the phases, the rider, the telescoping mast.
- `src/feedback/tracking/{combo,skiff}.js` (new), `rules.js`, `tracking.js` (the skiff's first-arrival line), `help/pages.js` (skiff keys).
- `src/title/board.js`: the owner's chess pieces (the title's art is mine).
- The builders' areas, each listed in its own merge commit: the Soul Brush, the Dreamvane, the Crucibelle and the busking body
  (rhythmhold.js), the Lockheart, the Veritome, the unarmed V (kick.js), the Psygun, locomotion/air/traversal (character.js and the
  traversal techs), the emotes (emotes.js, emote.js, talk.js, folk.js's react map).

**Not done, and why:** the .blend skiff in place of boat.js (its hull texture is missing; the owner decides). The god hand's 32 and the
Pneuka Jar's 17 actions: the hand's finger curl writes the fingers absolutely, and the Jar's cracks are rigid ribbons, so a mixer would fight
both. Yours to decide how they meet.
