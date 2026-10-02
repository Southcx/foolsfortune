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
- **Raku haggling**: `hearHaggling` (`src/npc/clayese.js`, hooked once in `main.js`) answers your `shop.haggle` events by their `step`:
  a short gesture in his voice as his line begins (open, counter, last: a sly chuckle and a coin; insult: a huff, with `shopRefuse` as
  the sting; flatter, clink, callback: a pleased "ooh", clink with cubes on the counter; bored, gone: a sulk; deal: a delighted
  "da-DONE", its bell being the purchase's own `shopBuy`). If it crowds his spoken line, say so and I'll pare it back.
- `shopSell()` is made; `kilnFire()` now fits the vessel's cooling (a short roar, a long tick-tick); `film.load` winds the film
  (`src/audio/cues.js`: a table of the sounds events make, beside `tracking.js`'s for the log).
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

**2026-10-02 (later), from Petra: Round 39's hooks are in**
- The crystals call `sfx.crystalRef(midi)`, `sfx.crystalStrike(midi, beat, { dense, last })` and `sfx.crystalSweet(midi)` exactly as
  asked (`src/lachryma/crystals.js`; `src/lachryma/tuning.js` says how the notes are chosen: the key's major scale, a step per seventh of
  the formation's height, `beat` 0..8 Hz). Until yours land, a placeholder pair of triangle tones `beat` Hz apart plays.
- The vessel calls `sfx.vesselCrack(k, region)` and `sfx.vesselMend(region)` (`src/vessel/damage.js`; region is one of `mask`,
  `torso`, `armL`, `armR`, `legL`, `legR`).
- The survey is the Dreamvane's (MMB): it emits `dreamvane.survey` as the heel goes up, and the old survey sounds still play at the
  blow (`cartography.survey`). The swing's sound is yours, from your cues table.
- New events you may want in the cues: `crystal.ref`, `combat.start` / `combat.end` (`src/combat.js`: one signal for "in a fight",
  e.g. for the battle music), `psygun.change`, `psygun.chamber`.

**2026-10-02, Round 39 tasks, from Petra** (the plan: `docs/PLAN.md`, from the owner's notes on v40)
1. **The crystals, tuned by ear** (PLAN.md f, the heart of the round). Each formation gets a **key** (a chromatic root, MIDI) and a
   **sweet spot** on its surface. I will call, from `src/lachryma/crystals.js`:
   - `sfx.crystalRef(midi)`: the tuning fork rung against it, the reference tone (the sweet spot's own note), rings a few seconds.
   - `sfx.crystalStrike(midi, beat, { dense, last })`: a pick strike. `midi` is the note it sounds (above the spot is sharp, below is
     flat, in steps of the formation's key: `midi` may be fractional only if you want glide); `beat` is the beating in Hz (0 = pure,
     up to ~8 = a fast wobble) that tells how far round the formation she is from the spot; `dense` (a stony formation, many strikes)
     or not (fragile, glassy, few); `last` when it is the formation's final strike before it breaks.
   - `sfx.crystalSweet(midi)`: the spot found, a big consonant bloom (the yield is many times over).
   Placeholders of mine will play `chime`/`tone` until yours land; tell me if you want the arguments shaped differently.
2. **The survey ping** moves from N to the Dreamvane (an ability of the tool, with its own motion): the old `sfx.survey*` sounds are
   kept; a new swing-and-sound for it (a struck fork thrown into the ground, the Mind's ring going out) is welcome.
3. **The vessel's damage**: a crack when a blow lands (by region: the mask, the body, a limb) and a slow mend as it heals. I will call
   `sfx.vesselCrack(k, region)` and `sfx.vesselMend(region)`.
4. Your note on the title loop: I am unlocking audio on the first key, click or touch anywhere on the title this round.

(Round 38's tasks, the six placeholder sounds and the later notes (the kiln's timing, `shopSell`, the haggle's stings and the
counter clink, the film winding on `film.load`) are done: notes deleted. The Crucibelle's voices stay open: the wider band in
`src/music/world.js` has a harp, a sitar, a steel pan and more if you want them for its instruments. Leaning the workshop's music in
at the kiln (`kiln.open`, `kiln.close`) is for a later round.)

## Calissa (Art)

**2026-10-02 (later), from Petra: Round 39's hooks are in**
- `game.combat` (`src/combat.js`): `engaged`, `heat` (0..1), events `combat.start` / `combat.end`. For the ring and the beads.
- `crystal.strike` carries `{ by, tool, ringing, pos, near, pitchOff, beat, sweet, nature: 'dense' | 'fragile' }`; `crystal.harvest`
  adds `sweet` and `nature`. Each formation's nature is `e.tune.kind` (lachryma/tuning.js) if the art wants dense and fragile to look
  different (they should: dense stony, fragile glassy).
- The survey motion: `SURVEY` in `src/moves/dreamvane.js` samples the pick's clip (`swordC`) as a placeholder; give me a clip name
  and its strike time and I will swap it in.
- Placeholder shell casings: `shell(id)` in `src/pneuka/thingmodels.js` (a casing, a band of the type's colour). The kinds of psygun
  are `src/psygun/kinds.js`.
- The damage cracks: `uDmg[6]` and the `aRegion` attribute in `src/vessel/kintsugi.js` (dark seams with a Lachryma core, on the
  kintsugi net); refine the look there or tell me what you want changed.
- The keys on the charm: `charmKeys()` in `src/moves/lockheart.js` (one `buildThing` per fitted key, alternating sides).

**2026-10-02, Round 39 tasks, from Petra** (the plan: `docs/PLAN.md`, from the owner's notes on v40). Merge the latest default branch
first: R38 and my resolution of `character.js` are in it.
1. **The HUD ring and the ability charges step out of sight outside combat**, and come back for it. I am adding `game.combat`
   (`engaged` true/false, `heat` 0..1 easing down after the last blow or the last hunter's notice); read it in `vfx/hudring.js` and the
   bead charges. The owner likes the ring as the place for status: think of what else it could carry (the vessel's damage, a held
   breath, a status like slow or sleep) and propose it.
2. **The Dreamvane's own animation suite** (the owner: "the idle is broken, the left arm should be on the upper portion of the haft"):
   idle with the left hand high on the haft, the swing and the pick strike, the fork throw, and a motion for the **survey ping**, which
   becomes a Dreamvane ability this round (I wire the ability; its motion is yours: tell me the clip name). Its hook and fork become
   2.5 times bigger (I am scaling `src/dreamvane/model.js`; pose the hands to the new size).
3. **The Crucibelle's playing**: the body and hands making each note, and more visual feedback that she is jamming (the owner loved the
   effect the Fool's Fortune leitmotif made). I am fixing the notes that zip in from off-screen.
4. **The crystal formations' art pass**: their base colour the sand's, a Lachryma outline and sheen to show they are active, much more
   varied and dynamic shapes (one InstancedMesh today in `src/lachryma/crystals.js`: variants are fine), and **particles on a strike
   that back up the tone-seeking** (I will emit `crystal.strike` with `{ pos, near (0..1, how close to the sweet spot), pitchOff, beat,
   sweet }`).
5. **Caster shell models**, numbered Type-00, Type-01... (the five shells now; `src/shells.js`'s list). Placeholders of mine come first.
6. **The keys on the Lockheart's charm**, strung either side of it, and the **damage cracks** on the vessel (I build the regions and the
   healing; the crack's look is yours to refine).
7. The compass ring moves into the Dreamvane's kit (shown while it is worn); `vfx/wirecompass.js` stays yours, I will only gate it.

**2026-10-02, from Petra: your branch is merged (with R38), two things from it**
- The armour and mask are the maker's paintings now, and the vessel's glazes are laid on the same materials. I kept your look as
  the default (the starting glaze on a painted part restores the painting exactly, `userData.base` in `src/vessel/vessel.js`), and
  any other glaze multiplies the painting's colour and glow. On the dark red painting most glazes barely show (shino reads as the
  painting). How a glaze should sit on a painting (a clay channel in the painting that the glaze replaces, a glaze mask, or
  glazes only on the unpainted trim and hair) is your call; `regionMats` and `dress()` are the two places.
- The ring at her feet and the wire compass stay up at the kiln station, where the HUD otherwise steps out (`game.ui.want('kiln')`).
  Asking `game.ui` there would clear the turntable shot.

**2026-10-02 (later still), from Petra: the vessel is in (R38d)**
- I split the Courier's materials into the four glaze regions myself (`regionOf` in `src/character.js`: the armour, the armour's
  energy inlays and the stones as TRIM, the mask, the hair; the Lachryma core is untouched). If your region work cuts them
  differently, `regionMats` is the one place to change.
- The twelve glazes' colours are in `src/vessel/glazes.js`. Please look them over on her (the kiln, in the workshop). A crackle
  texture for raku, oribe's pooling and jun's opalescence would make them more than flat colours.
- Kintsugi is a shader patch (`src/vessel/kintsugi.js`, Worley cracks in bind-pose space). The gold is subtle on white glazes, and
  the crack scale (`uKinScale`) and width are yours to tune.
- The kiln station's shot is fixed in front of the kiln's mouth (`SPOT`, `CAM` in `src/moves/kiln.js`). The plate stands that flank
  the mouth were the reason for the high angle.

**2026-10-02 (later), from Petra: the shops are in (R38c)**
- New things with prerendered icons: the ROLL OF FILM (`film()` in `src/pneuka/thingmodels.js`), and the fourteen fish as box items
  (their icon is the fish's own ghost mesh, `buildFish`, which reads a little faint in a slot; an icon pose or a solid variant is yours).
- The shop window (`src/shop/ui.js`, `#shop .px`) copies the Pneuka Box window's look and is in the window kit's `WINDOWS`.
- The plan wants the goods **on shelves in the world**. Raku has no counter yet (he stands by the Tithe) and Grog none on the pier. A
  counter and a shelf for each, with the goods on it, as one prop batch per shop (`src/render/propbatch.js`), would make them real;
  tell me where they stand and I will hang the F on them.

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

**2026-10-02, Espada's state after Round 39** (the rest of what was here is done and deleted)
- Done: the owner's answers in `docs/LORE.md`; the tiers named (earthenware, stoneware, porcelain, the Court) and the four folk
  rewritten by tier, with new topics (each on the Prince; Grog on buying fish; Raku on curios); Raku's haggle lines (`RAKU_HAGGLE`,
  now any number per move, taken in turn: `pick` already did this); the glaze blurbs; the title's tagline, menu subs and STORY line;
  two help leads (the keys, the god hand).
- Still mine, not started: a full pass on the log's lines (shops, the vessel, crystals, psyguns, the last three tools), the
  neuralese / Crucibelle / Lockheart strings, the shops' blurbs, the achievements' names, the rest of the help pages (they read well
  already). No kintsugi string exists yet to write; when the kintsugi has a line in the game, send it my way.
