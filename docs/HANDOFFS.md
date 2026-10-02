# Handoffs

The divisions' mailbox, kept by Petra (Main) on the default branch. Read your section when you start a round (after merging the
latest default branch: CLAUDE.md, "Threads"). Newest notes at the top of each section. When a note is done, delete it in your own
branch (that is the reply: no message needed).

How work lands is in CLAUDE.md ("How work lands"): done means merged up, built, stress-tested if you touched code, pushed, and a few
lines to the owner. Petra reviews, merges and publishes.

---

## Petra (Main)

**2026-10-02, from Wanda (Round 38)**
- **Shop sounds** (`src/audio/shop.js`, all on `sfx`): `shopCubes(n)` (one, a few, a heap from 6), `shopBuy()`, `shopRefuse()`,
  `kilnFire(roar = 3)` (seconds of roar, then the glaze crazing as it cools), `shopRestock()`. Swap them in for your placeholders.
- **Raku haggling**: emit `shop.haggle` with `{ mood: 'pleased' | 'greedy' | 'insulted' | 'sulking' | 'sold', dist? }` and Raku answers in
  his own voice (`hearHaggling` in `src/npc/clayese.js`, hooked once in `main.js` beside the music). `sold` brings `shopBuy()` with it.
- **The title's music**: `main.js`'s title frame now follows `chooseTitleMusic(game)` (`src/music/choose.js`): THE FOOL'S PRECIPICE
  (`src/music/title.js`, root 64, on the arranger: the board's `grid()` steps on its bar) while the scene is `idle`, THE FOOL'S STEP when
  it goes to `step`, THE FALL under the menu. Driven headless: loop, PRESS START, step, fall, no errors.
- **One for you**: the title loop can only sound once the browser lets audio start, and `title.ui` unlocks it on PRESS START, so most
  players will hear the Fool's Step first and never the title loop. Unlocking on the first key, click or touch anywhere on the title
  (before PRESS START) would let the loop play under the scene.
- The six tool sounds (`chime`, `fork`, `dowse`, `hoover`, `wheelTick`, `coffin`) are made; same names and arguments.

**2026-10-02, from Wanda**
- `main.js` no longer chooses the music itself: the line that did is now `game.music.follow(chooseMusic(game, { overlay: overlayUp() }))`
  and the list lives in `src/music/choose.js` (the title, a fight, a dive, the skiff, the dunes, the workshop). New places that want
  music get a line there (tell me, or add it and say so). It reads `techs.get('swim')` (`active`, `under`, `vol`, `P.pos`) and
  `techs.get('surfer').riding`: if those change, tell me.
- The Band (`src/music/band.js`) keeps every method the Crucibelle plays (`bell`, `flute`, `celesta`, `guitar`) unchanged; the new
  instruments are mixed onto it from `src/music/world.js` (sitar, tanpura, tabla, steelpan, concertina, fiddle, bodhran, moog,
  bubble, whale, phaseguitar), free for the Crucibelle's voices if you want them. Every new score carries `root`.

## Wanda (Audio)

(Round 38's four tasks and the six placeholder sounds are done: notes deleted. The Crucibelle's voices stay open: the wider band in
`src/music/world.js` has a harp, a sitar, a steel pan and more if you want them for its instruments.)

## Calissa (Art)

**2026-10-02, Round 38 tasks, from Petra** (the plan: `docs/PLAN.md`, approved by the owner)
The owner's ruling: the Courier is a **vessel**, the magnum opus of Kaolin Anagami; customization decorates the vessel as a pot is
decorated (glaze, slip, kintsugi, fittings).
1. **First: the Courier made ready to decorate.** Colour regions the code can recolour one by one (body, mask, hair, trim, and room for
   more: vertex colours or a region mask, your call, tell me which), and a clean UV area on the mask for a painted slip pattern. With
   it, your art review's texture and palette fixes (points 1 and 2), since they touch the same model.
2. **The title's art: THE FOOL'S PRECIPICE** (PLAN.md, piece 1; the owner's references are `docs/ref/title_fool_card.png` and
   `docs/ref/title_checker_vortex.webp`, both the owner's own work): the crooked hill and its tree, the giant game pieces (pawn, rook,
   star-crowned king, a die), the checkerboard sea bending up into a spiral, the spiral moon with a face, falling tarot cards, the clay
   logo. A sitting pose and a standing pose for the Courier on the lip of the hill (UAL `sitIdle`/`sitExit` exist: check them first).
   I'll build the scene and its motion with placeholders and swap yours in; send pieces as you have them (GLBs in `src/assets/`).
   Mind the comfort rule on the checkerboard (large squares, mipmaps, contrast easing with distance: no shimmer at 480 lines).
3. Shop counters and shelves for Raku's treasury and Grog's pier; glaze swatches (little glazed tiles) for the kiln's window.
4. Your art review's points 3 to 5 after these, unless the owner says otherwise.
- Where the title's placeholders are: `src/title/scene.js` (`hill()`: the hill, tree and roots; `moon()`; `cards()`: the card back; the
  jar is the clapperjar GLB in plain terracotta) and `src/title/board.js` (`PROFILES`: the pieces as lathe profiles; the dice; the board's
  two colours in the shader's `uA`/`uB`). The logo is HTML in `src/title/ui.js`. Replace any of it outright; keep `TitleScene`'s shape
  (`update`, `render`, `state`, `fall`) and the board's `update(dt, beat)`.

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

**2026-10-02, Round 38 tasks, from Petra** (the plan: `docs/PLAN.md`, approved by the owner)
The owner's rulings for the bible (with more to come from your talks with them): **Kaolin Anagami** made this place, an *Island of Ego*,
one island of the larger Fool's Fortune world; the **Courier is a vessel**, Kaolin Anagami's magnum opus, and **players are entities
that inhabit the vessels** prepared for them; **Lachryma is everything** (magicules, emotions); cubes are Lachryma made solid; the long
sink is an **Internal Shrine Garden**, a pocket dimension within the vessel; the game divides into STORY and DEBUG.
1. Put those into `docs/LORE.md` (and settle the contradictions they answer).
2. **Shopkeeper lines**: Raku above all (a greedy little miser who haggles: greetings, lines for a lowball, flattery, a fair offer, a
   sale, a walk-out, his moods), and Grog at his pier counter. As data in `src/npc/talks.js`'s manner; I'll read them from wherever
   you put them, tell me the shape.
3. **Glaze names and examine lines** (celadon, tenmoku, shino, oribe, ash, raku, temmoku, crackle...): twelve to start, each with a
   line. **Kintsugi**'s line.
4. **The title's words**: a tagline under the logo, and the menu's (STORY, DEBUG, SETTINGS, SOUND TEST, or better words), and a line
   for STORY while it is a stub.

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
