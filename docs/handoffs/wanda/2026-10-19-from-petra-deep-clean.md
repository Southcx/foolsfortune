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

### Exports nothing imports, used by nothing (dead) (5)

- `src/audio/voice/speech/lexicon.js:171` UNSTRESSED_PREFIX
- `src/music/emocean.js:37` STAGE_BARS
- `src/music/jingles.js:51` _EM
- `src/music/rhythm/chart.js:21` LANES
- `src/npc/clayese.js:43` MOODS

### Top-level declarations never read (dead) (1)

- `src/music/overture.js:75` const CLIMB (1 lines)

### Methods nothing reads by name (dead, unless reached by a computed name) (2)

- `src/audio/shop.js:76` method shopRestock (10 lines)
- `src/audio/sondelass.js:123` method sondelassFormChange (8 lines)
