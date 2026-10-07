**2026-10-07, from Calissa (Art): the Courier's own animation suite is in, and it crosses your lane**

The owner's order to me: "a massive animation overhaul ... implement them" (melee combos, air combos, specials, Solar Skiffing, the
busking words). Your files carry most of it. Every crossing is listed below for your review, and I'll take back anything you'd rather do
yourself.

**For publishing (needed, or the game does not boot):** three files now sit beside the bundle and are fetched, not inlined:
- `dist/assets/core-*.bin` (1.9 MB, at boot: only the 114 clips the code names; `node scripts/bake_suite.mjs --check` says whether it
  is current);
- `social-*.bin` (6.5 MB, on first use of an emote, the workbench or the ROM learner);
- `chess-*.bin` (0.4 MB, the title's pieces, fetched on its first frame and let go when it ends).
All three are application/octet-stream. game.js is unchanged in size.

**What others meet**
- `game.clipPack` (the pack; `.social` is a promise for the rest). 51 bones now: spine005 sits between spine004 and head (parent
  first, for mirrorPose). Old clips are widened and keep their names. 14 old names now play their suite twins (`ual:<name>` keeps the
  old).
- `tools/moveset.js`, one combo engine (its header is the contract). Every melee tool is on it, and it reads Dovina's
  `progress/combat/moves.js` (`rule`, `open`, `worth`, `struck`, `spec.sound`).
- `Launch.go` takes `drive(vel, dt)` and `poseFix(pose)`, and a `go` while a launch is on restarts in place (casebook 33).
- `melee.js` `measureSwing(ch, clip, { limb })`: 'R' (the default, as before), 'L', 'footR', 'footL', 'auto'.
- Events, all with `by`: `move.launch`, `move.air`, `move.special` (Dovina's rules); `skiff.summon / .mount / .park / .recall / .bail
  {why, speed}` and `skiff.ollie {geyser}`.
- Keys: R is every tool's special; F parks and mounts the skiff; Y summons and recalls it.

**The air hang (Dovina asked me to tell you):** an air string hangs the Courier at gravity x0.12 while a stroke plays, and each hit
holds the rise at 0.6 m/s. It lives in the engine (`HANG`), never in `core/config.js`. With the tool away the core movement is today's
(the replay test is exact).

**Files outside my lane** (each: why)
- `src/courier/anim/suite.js` (new) and `romdata.js` (relearned): the pipeline (CLAUDE.md gives me the animation pipeline).
- `src/courier/character.js`: spine005 in MASK_UPPER and MASK_ARM (one line).
- `src/main.js`: `loadClips` in place of `decodeAnims`; `game.clipPack`.
- `src/courier/moves/launch.js`: drive, poseFix and re-entry.
- `src/tools/moveset.js` (new), `src/tools/melee.js` (limb), `src/tools/sondelass/{cutlass,sondelass}.js`, `angling/angler.js`: the
  cutlass on the engine, and the rod's suite clips.
- `src/courier/skiff/{skiff,boat}.js`, `rider.js` (new): the phases, the rider, the telescoping mast.
- `src/feedback/tracking/skiff.js` (new), `heldstrikes.js` (new), `rules.js`, `tracking.js` (the skiff's first-arrival line and the
  set's word), `help/pages.js` (skiff keys).
- `src/title/board.js`: the owner's chess pieces (the title's art is mine).
- The builders' areas, each listed in its own merge commit: the Soul Brush, the Dreamvane, the Crucibelle and the busking body
  (`rhythmhold.js`), the Lockheart, the Veritome, `tools/heldclips.js` and `tools/toolbody.js` (to be made one), and still to come: the
  unarmed kick and the Psygun, locomotion/air/traversal, the emotes.

**Not done, and why:**
- The .blend skiff in place of `boat.js`: its hull texture is missing; the owner decides.
- The god hand's 32 actions and the Pneuka Jar's 17: the hand's finger curl writes the fingers absolutely, and the Jar's cracks are
  rigid ribbons, so a mixer would fight both. Yours to decide how they meet.
