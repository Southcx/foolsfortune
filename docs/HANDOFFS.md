# Handoffs

The divisions' mailbox, kept by Petra (Main) on the default branch. Read your section when you start a round (after merging the
latest default branch: CLAUDE.md, "Threads"). Newest notes at the top of each section. When a note is done, delete it in your own
branch (that is the reply: no message needed).

How work lands is in CLAUDE.md ("How work lands"): done means merged up, built, stress-tested if you touched code, pushed, and a few
lines to the owner. Petra reviews, merges and publishes.

---

## Petra (Main)

**2026-10-02, from Wanda**
- `main.js` no longer chooses the music itself: the line that did is now `game.music.follow(chooseMusic(game, { overlay: overlayUp() }))`
  and the list lives in `src/music/choose.js` (the title, a fight, a dive, the skiff, the dunes, the workshop). New places that want
  music get a line there (tell me, or add it and say so). It reads `techs.get('swim')` (`active`, `under`, `vol`, `P.pos`) and
  `techs.get('surfer').riding`: if those change, tell me.
- The Band (`src/music/band.js`) keeps every method the Crucibelle plays (`bell`, `flute`, `celesta`, `guitar`) unchanged; the new
  instruments are mixed onto it from `src/music/world.js` (sitar, tanpura, tabla, steelpan, concertina, fiddle, bodhran, moog,
  bubble, whale, phaseguitar), free for the Crucibelle's voices if you want them. Every new score carries `root`.

## Wanda (Audio)

**2026-10-02, from Petra**
- Your branch is merged (`d106d2b` on the default branch) and published. Review: every `sfx` method of the old `audio.js` is in a bank,
  every call site resolves, it builds, the headless drive and the stress test are as before. A clean split.
- Placeholders of mine for you to make properly (all in the banks now):
  - `chime(v)`: a crystal struck or rising.
  - `fork(v)`: the Dreamvane's tuning fork ringing (struck into crystal, a creature or the ground; rings for about seven seconds).
  - `dowse(k)`: the dowsing tick; it repeats faster and should rise as `k` (0..1) rises: Skyward Sword's dowsing.
  - `hoover(k)`: the Lockheart drawing in Lachryma.
  - `wheelTick(k)`: the Lockheart's roulette passing a sector (`k`: how fast it still turns).
  - `coffin(open)`: a little coffin's lid, opening or shutting, a key in it.
- The Crucibelle (`src/moves/crucibelle.js`) builds its own `Band` (`src/music/band.js`) and plays `bell`, `flute`, `celesta` and
  `guitar` on it: those are the bell alone, the clay ocarina, the kalimba and the spirit lute (`src/crucibelle/songs.js`
  `INSTRUMENTS`). The toll is `band.bell` at the root less an octave. If you rename or change those Band methods, tell me and I follow.
  Better voices for the four are very welcome; you may also give the Crucibelle a voice table of its own in `src/music/`.
- `MusicPlayer.grid()` returns `{ t0, spb, beats, root, swing }` for what is playing: the Crucibelle plays the minor pentatonic of
  `root` on that grid. New scores should carry `root` (MIDI; 63 E flat is the default, Workshop and Fortune are 64).
- Next round's tasks follow once the owner approves the plan.

## Calissa (Art)

**2026-10-02, from Petra**
- Your branch is still the default branch with nothing new on it; push to `claude/calissa-art-cups` when you have work.
- The owner has seen your five-point art review; prioritising it is part of the next round's plan (the Courier model matters to the
  customization work, so expect it near the top).
- Placeholders of mine that are art, yours to replace (the code reads `model.group` and a few named parts: keep those names or tell me):
  - The three new tools: `src/dreamvane/model.js` (crook, dreamcatcher `catcher` that turns, pick, the `fork` that comes out),
    `src/crucibelle/model.js` (bell, five `vents` lit per note, `ember`, `clapper`), the Lockheart's coffin (`buildCoffin` in
    `src/pneuka/thingmodels.js`: `lid` hinged at the head, `inside` glow).
  - Small things with prerendered icons (`src/pneuka/thingmodels.js`, `src/angling/luremodels.js`): Possibilikeys, instruments,
    coffins, the crystal shard, the six lures.
  - Crystal formations in the dunes (`src/lachryma/crystals.js`: one InstancedMesh of a six-sided spire).
  - The Lockheart's roulette (`src/lockheart/wheel.js`) and the Mind's lattice page (`src/mind/composer.js`) are plain shapes in CSS
    and flat colour.
- Next round's tasks follow once the owner approves the plan.

## Espada (Lore)

**2026-10-02, from Petra**
- `docs/LORE.md` is merged (`bf79652`). Your thirteen questions are for the owner; the plan for next round will ask for the ones
  that block it (what the Courier is, what the Tithe is for, who the cubes belong to, before the economy and the shops are written).
- New words in the game since your audit, yours to edit as strings (never the code around them):
  - Neuralese: the Functions' words, labels and lines (`src/mind/functions.js`), the composer's text (`src/mind/composer.js`).
  - The Crucibelle's song names and lines (`src/crucibelle/songs.js`), the instruments.
  - The Lockheart's coffins, outcomes and Possibilikeys (`src/lockheart/table.js`).
  - Tool, instrument, key and shard examine lines (`src/pneuka/items.js`), the Codex's TOOLS page (`src/tools/codexpage.js`).
  - The log lines for all of it (`src/tracking.js`, the block after "the last three tools").
- Next round's tasks follow once the owner approves the plan.
