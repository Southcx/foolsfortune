# From Petra: the deep clean, your files (2026-10-19)

The owner asked for a deep clean: dead code, outdated comments and stale handoffs out, and genre words where house jargon crept in
(CLAUDE.md, "Plain names until settled"). The connectome (`node scripts/connectome.mjs --md=<path>`, on the default branch) mapped the
wiring. Below is what it found in your files. Each line is a lead to read, not a deletion to run: a name reached by a string (an event-keyed
table, `sfx[name]`, a chat command) looks dead to it. Grep before you delete.

Asks, in your branch:
1. Delete what is dead. Fix or drop the stale paths in comments and docs.
2. Read your own handoff folder and delete what is done or overtaken (the reader deletes).
3. Run the connectome again when done, and say the before and after counts in your report.

Exports used only in their own file are left out (cosmetic: drop the `export` if you touch the file anyway).

### Exports nothing imports, used by nothing (dead) (4)

- `src/progress/casino/querent/score.js:21` RANK
- `src/progress/casino/querent/score.js:23` cardName
- `src/progress/econ/economy.js:19` minutes
- `src/world/raceway/park.js:85` RW

### Top-level declarations never read (dead) (1)

- `src/progress/alchemy.js:95` const wrapH (1 lines)

### Methods nothing reads by name (dead, unless reached by a computed name) (4)

- `src/progress/duel/board.js:51` method backWall (1 lines)
- `src/progress/weather.js:171` method mindDrift (1 lines)
- `src/progress/weather.js:173` method fishPull (1 lines)
- `src/progress/weather.js:175` method signatureMult (1 lines)

### File paths named in comments or docs that no longer exist (stale) (39)

- `src/world/raceway/track.js:206` world/raceway/decks.js
- `src/world/raceway/tracks/gorge.js:7` world/raceway/decks.js
- `docs/plans/AGENT-INTERFACE.md:61` scripts/agent-mcp.mjs
- `docs/plans/APTITUDE.md:97` progress/aptitude.js
- `docs/plans/APTITUDE.md:154` progress/aptitude.js
- `docs/plans/COMBAT-LAB.md:291` docs/handoffs/petra/2026-10-10-from-calissa-combat-wing.md
- `docs/plans/DEBUG-MODE.md:115` src/debug/presets.js
- `docs/plans/DEBUG-MODE.md:137` src/debug/presets.js
- `docs/plans/DEBUG-MODE.md:152` tools/veritome/functions.js
- `docs/plans/DEBUG-MODE.md:159` feedback/codex/codexpage.js
- `docs/plans/MELEE-LOADOUT.md:189` docs/handoffs/petra/2026-10-11-from-calissa-blow-events.md
- `docs/plans/MELEE-LOADOUT.md:218` ui/cutlassstringrow.js
- `docs/plans/PARKED.md:20` vfx/garden/sporeling.js
- `docs/plans/RAIL.md:122` docs/handoffs/petra/2026-10-07-from-wanda-the-crossing-s-sound-contract.md
- `docs/plans/SOUL-ALCHEMY.md:68` docs/handoffs/dovina/2026-10-08-from-calissa-soul-alchemy-ux.md
- `docs/plans/SWEEPS.md:76` docs/handoffs/petra/2026-10-07-from-dovina-log.md
- `docs/plans/SWEEPS.md:118` progress/trials/solar.js
- `docs/plans/SWEEPS.md:119` world/dunes/weir.js
- `docs/plans/TEMPERAMENT.md:61` src/audio/creaturevoice.js
- `docs/plans/TRAINING.md:84` docs/handoffs/dovina/2026-10-08-from-wanda-training.md
- `docs/plans/TRAINING.md:109` docs/handoffs/dovina/2026-10-08-from-petra-training.md
- `docs/plans/WHEEL.md:60` creatures/ai/mood.js
- `docs/plans/WHEEL.md:101` creatures/anim/suite.js
- `docs/plans/research/DOCS-REVIEW-PLANS.md:48` docs/specs/RAIL.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:49` docs/specs/DUNEMAW.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:50` docs/specs/GARDEN.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:51` specs/SOUL-ALCHEMY-UX.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:54` docs/specs/TESTING.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:55` docs/specs/OVERLAY.md
- `docs/plans/research/DOCS-REVIEW-PLANS.md:56` specs/SOUL-BRUSH-LOAD.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:20` docs/LOOK.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:41` docs/TEAM.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:50` docs/casebook/YYYY-MM.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:59` docs/plans/AUDIT.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:61` wiki/creatures.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:67` docs/TEAM.md
- `docs/plans/research/DOCS-REVIEW-TOP.md:103` docs/PIPELINE.md
- `docs/plans/research/PAINTING.md:71` home/user/foolsfortune/src/tools/soulbrush/load.js
- `docs/plans/research/RAIL-PATTERNS.md:43` danmokou/blob/master/docs/articles/t06.md

### Imports never used (2)

- `src/progress/achievements.js:23` BY_ID from ./skills.js
- `src/world/raceway/park.js:14` RW from ./track.js
