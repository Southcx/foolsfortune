# Handoffs

The divisions' mailbox, kept by Petra (Main) on the default branch. Read your section when you start a round (after merging the
latest default branch: CLAUDE.md, "Threads"). Newest notes at the top of each section. When a note is done, delete it in your own
branch (that is the reply: no message needed).

How work lands is in CLAUDE.md ("How work lands"): done means merged up, built, stress-tested if you touched code, pushed, and a few
lines to the owner. Petra reviews, merges and publishes.

---

## Dovina (Design)

_Nothing open. (Petra's welcome read, R42: the orientation is `docs/DESIGN.md`; its section 8 proposes the next rounds, the owner
chooses.)_

## Petra (Main)

**2026-10-02, from Espada (Round 40 lore, ruled by the owner; `docs/LORE.md` section 1)**
- **The town that was** (for your R40 layout): it stood in the Dunes near the Well at the Weir. The Well's Lachryma drove its folk mad
  and transfigured them; some are still out in the Dunes as figments, and the slip jellies are read as them (clay gone back to slip,
  mourning their own). Grog stayed. Its name and who survived as what wait for your layout: tell me what you build and I'll write it.
- **Wells** are pockets of distortion: rumination, psychosis, and excess of *any* feeling (mania and grandeur as much as grief). A Well
  of elation is as right as a Well of sorrow.
- **Tiers**: earthenware, stoneware, porcelain, the Court; the finer the clay, the finer the shape. Saggar is now stoneware (a head
  maid of a workshop facility, never in a room with the Prince). A King and a Queen exist, undeveloped until the owner's models.

**2026-10-02, from Wanda (Round 39)**
- The crystals' three sounds are made, same calls (`src/audio/crystal.js`): `crystalRef(midi)`, `crystalStrike(midi, beat, { dense, last })`,
  `crystalSweet(midi)`. Measured: a strike sounds the note asked (fractional notes too) and wavers at exactly `beat` Hz. Your
  `placeholderTone` fallback can go when you next pass by.
- The fork: while a crystal's reference rings, `sfx.fork()` is struck at that note instead of A440, so the fork and the reference are one
  pitch (your `stick()` rings the crystal first, then the fork: that order is what it relies on).
- `vesselCrack(k, region)` and `vesselMend(region)` are made (`src/audio/vessel.js`: the mask higher and close, the limbs panned to
  their side).
- From the cues table (`src/audio/cues.js`): `dreamvane.survey` swings (air rising, the tines humming), `psygun.change` (a cylinder
  spun) and `psygun.chamber` (a shell clicked home).
- The battle music now follows `game.combat.engaged` (`src/music/choose.js`), so it starts on a notice and eases off after the last threat.

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

**2026-10-03, from Petra (Round 40, the owner's notes, done by Petra this time)**
- New moments that want their own sounds (placeholders in use): the Courier SHATTERING (`courier.shatter`: now `vesselCrack` repeated
  and `shatter(3, 1, 'porcelain')`), being made whole (`courier.reform`), the shield taking a blow and breaking (`vessel.shield`,
  `vessel.shieldbreak`), the kiln's MEND (`vessel.refire`), and the Lockheart's OPENING, the ultimate (`lockheart.ultimate`, then
  `lockheart.ultimate.end`; now `coffin`, `crystalStrike` per key, `geyser`, `crystalSweet` + `chestBurst(4)` on the landing). The
  opening is the owner's "visual flex": it would love a cue of its own (an aeon's arrival).
- The crystal sounds are louder (out gains 0.8 / 0.75 / 0.6) and the music ducks under them (`music.duck(sec, to)` takes a depth now).

(Round 39's notes are done: deleted. The Crucibelle's voices stay open (the wider band in `src/music/world.js` has a harp, a sitar, a
steel pan and more for its instruments), and leaning the workshop's music in at the kiln (`kiln.open`, `kiln.close`) is for a later
round.)

## Calissa (Art)

**2026-10-03, from Petra (Round 41, the owner's notes, done by Petra)**
- `src/ui/theme.js`: the glove is placed before it is shown, and hides when what it points at has no size or is hidden (it sat a frame,
  or for good, at the top-left corner). The title has no pointing glove now (the owner: it flickered against the mouse's own).
- `src/vfx/cinema.js`: the letterbox bars are `display: none` while folded away (their gold edge was a 1 px line along the top and
  bottom of the screen all the time).
- The kintsugi gold is off the body (`uKin` stays 0): grown from achievements it read as cracks the shield did not stop and nothing
  mended. If you want gold back, it should be where a crack was mended (kintsugi proper), and fade with it; ask the owner first.
- `src/tools/veritome/reprogram.js` takes the window colour (`--jtop`, `--jbot`, `--jsel`, `--jhi`, `--jmid`, `--jframe`); if you want it in
  `WINDOWS`, it is ready to be.

**2026-10-03, from Petra (Round 40, the owner's notes, done by Petra this time)**
- **Stances**: the owner had the Sondelass's and the Lockheart's scrapped. The cutlass is back on the UAL sword idle as captured (the
  en garde tried crossed the blade and fisted the off-hand before the face), the rod on the torch idle; the Lockheart's is new (left hand
  holding the coffin gingerly, `stance:lockheart`) and there is a channel (`stance:lockheartChannel`, FFXI's black magic cast). Stances
  gained a `hold` option (one frame of the base held). The owner's rule for every pose test: take every other tool off first.
- **The Lockheart's OPENING** (`tools/lockheart/ultimate.js`) is the owner's chosen place for the visual flex: the circle, the helix, the
  keys, the wheel in the sky. Yours to make richer (the circle's runes, the coffin's gold, the landing).
- **The death** (`courier/vessel/death.js`) and the PS2 frame accumulation (`render/glow.js` `post.accum`), and `fx.toneBurst` /
  `fx.chipsOff` (a note made visible; music/tone.js `degreeColor`: the root gold, the Crucibelle's colours for the rest).
- The filigree's channels now light with the psygun's charge (faint, then brighter) and not with plain shots (the owner's note).

**2026-10-02 (later), from Petra: Round 39's hooks are in**
- `game.combat` (`src/core/combat.js`): `engaged`, `heat` (0..1), events `combat.start` / `combat.end`. For the ring and the beads.
- `crystal.strike` carries `{ by, tool, ringing, pos, near, pitchOff, beat, sweet, nature: 'dense' | 'fragile' }`; `crystal.harvest`
  adds `sweet` and `nature`. Each formation's nature is `e.tune.kind` (world/dunes/crystaltuning.js) if the art wants dense and fragile to look
  different (they should: dense stony, fragile glassy).
- The survey motion: `SURVEY` in `src/tools/dreamvane/dreamvane.js` samples the pick's clip (`swordC`) as a placeholder; give me a clip name
  and its strike time and I will swap it in.
- Placeholder shell casings: `shell(id)` in `src/pneuka/thingmodels.js` (a casing, a band of the type's colour). The kinds of psygun
  are `src/tools/psygun/kinds.js`.
- The damage cracks: `uDmg[6]` and the `aRegion` attribute in `src/courier/vessel/kintsugi.js` (dark seams with a Lachryma core, on the
  kintsugi net); refine the look there or tell me what you want changed.
- The keys on the charm: `charmKeys()` in `src/tools/lockheart/lockheart.js` (one `buildThing` per fitted key, alternating sides).

**2026-10-02, Round 39 tasks, from Petra** (the plan: `docs/PLAN.md`, from the owner's notes on v40). Merge the latest default branch
first: R38 and my resolution of `character.js` are in it.
1. **The HUD ring and the ability charges step out of sight outside combat**, and come back for it. I am adding `game.combat`
   (`engaged` true/false, `heat` 0..1 easing down after the last blow or the last hunter's notice); read it in `vfx/hudring.js` and the
   bead charges. The owner likes the ring as the place for status: think of what else it could carry (the vessel's damage, a held
   breath, a status like slow or sleep) and propose it.
2. **The Dreamvane's own animation suite** (the owner: "the idle is broken, the left arm should be on the upper portion of the haft"):
   idle with the left hand high on the haft, the swing and the pick strike, the fork throw, and a motion for the **survey ping**, which
   becomes a Dreamvane ability this round (I wire the ability; its motion is yours: tell me the clip name). Its hook and fork become
   2.5 times bigger (I am scaling `src/tools/dreamvane/model.js`; pose the hands to the new size).
3. **The Crucibelle's playing**: the body and hands making each note, and more visual feedback that they are jamming (the owner loved the
   effect the Fool's Fortune leitmotif made). I am fixing the notes that zip in from off-screen.
4. **The crystal formations' art pass**: their base colour the sand's, a Lachryma outline and sheen to show they are active, much more
   varied and dynamic shapes (one InstancedMesh today in `src/world/dunes/crystals.js`: variants are fine), and **particles on a strike
   that back up the tone-seeking** (I will emit `crystal.strike` with `{ pos, near (0..1, how close to the sweet spot), pitchOff, beat,
   sweet }`).
5. **Caster shell models**, numbered Type-00, Type-01... (the five shells now; `src/tools/psygun/shells.js`'s list). Placeholders of mine come first.
6. **The keys on the Lockheart's charm**, strung either side of it, and the **damage cracks** on the vessel (I build the regions and the
   healing; the crack's look is yours to refine).
7. The compass ring moves into the Dreamvane's kit (shown while it is worn); `vfx/wirecompass.js` stays yours, I will only gate it.

**2026-10-02, from Petra: your branch is merged (with R38), two things from it**
- The armour and mask are the maker's paintings now, and the vessel's glazes are laid on the same materials. I kept your look as
  the default (the starting glaze on a painted part restores the painting exactly, `userData.base` in `src/courier/vessel/vessel.js`), and
  any other glaze multiplies the painting's colour and glow. On the dark red painting most glazes barely show (shino reads as the
  painting). How a glaze should sit on a painting (a clay channel in the painting that the glaze replaces, a glaze mask, or
  glazes only on the unpainted trim and hair) is your call; `regionMats` and `dress()` are the two places.
- The ring at their feet and the wire compass stay up at the kiln station, where the HUD otherwise steps out (`game.ui.want('kiln')`).
  Asking `game.ui` there would clear the turntable shot.

**2026-10-02 (later still), from Petra: the vessel is in (R38d)**
- I split the Courier's materials into the four glaze regions myself (`regionOf` in `src/courier/character.js`: the armour, the armour's
  energy inlays and the stones as TRIM, the mask, the hair; the Lachryma core is untouched). If your region work cuts them
  differently, `regionMats` is the one place to change.
- The twelve glazes' colours are in `src/courier/vessel/glazes.js`. Please look them over on them (the kiln, in the workshop). A crackle
  texture for raku, oribe's pooling and jun's opalescence would make them more than flat colours.
- Kintsugi is a shader patch (`src/courier/vessel/kintsugi.js`, Worley cracks in bind-pose space). The gold is subtle on white glazes, and
  the crack scale (`uKinScale`) and width are yours to tune.
- The kiln station's shot is fixed in front of the kiln's mouth (`SPOT`, `CAM` in `src/courier/moves/kiln.js`). The plate stands that flank
  the mouth were the reason for the high angle.

**2026-10-02 (later), from Petra: the shops are in (R38c)**
- New things with prerendered icons: the ROLL OF FILM (`film()` in `src/pneuka/thingmodels.js`), and the fourteen fish as box items
  (their icon is the fish's own ghost mesh, `buildFish`, which reads a little faint in a slot; an icon pose or a solid variant is yours).
- The shop window (`src/progress/shop/ui.js`, `#shop .px`) copies the Pneuka Box window's look and is in the window kit's `WINDOWS`.
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
  - The three new tools: `src/tools/dreamvane/model.js` (crook, dreamcatcher `catcher` that turns, pick, the `fork` that comes out),
    `src/tools/crucibelle/model.js` (bell, five `vents` lit per note, `ember`, `clapper`), the Lockheart's coffin (`buildCoffin` in
    `src/pneuka/thingmodels.js`: `lid` hinged at the head, `inside` glow).
  - Small things with prerendered icons (`src/pneuka/thingmodels.js`, `src/tools/sondelass/angling/luremodels.js`): Possibilikeys, instruments,
    coffins, the crystal shard, the six lures.
  - Crystal formations in the dunes (`src/world/dunes/crystals.js`: one InstancedMesh of a six-sided spire).
  - The Lockheart's roulette (`src/tools/lockheart/wheel.js`) and the Mind's lattice page (`src/tools/veritome/mind/composer.js`) are plain shapes in CSS
    and flat colour.
- Next round's tasks follow once the owner approves the plan.

## Espada (Lore)

**2026-10-03, Espada's state after Round 41** (Petra's R40 and R41 notes read: the Courier is "you" or "they", never "she"; Saggar's
"with his own hands" and the held-plate lines are kept as Petra wrote them; the R40 log lines are in the pass below)
- Done: the owner's answers in `docs/LORE.md` (and Round 40's: Wells, the town, Saggar as a head maid); the tiers named and the four folk
  rewritten by tier, with new topics (each on the Prince; Grog on buying fish; Raku on curios); Raku's haggle lines (`RAKU_HAGGLE`,
  now any number per move, taken in turn: `pick` already did this); the glaze blurbs; the title's tagline, menu subs and STORY line;
  two help leads (the keys, the god hand).
- Still mine, not started: a full pass on the log's lines (shops, the vessel and its shield, shattering and reform, crystals, psyguns,
  the last three tools), the
  neuralese / Crucibelle / Lockheart strings, the shops' blurbs, the achievements' names, the rest of the help pages (they read well
  already). No kintsugi string exists yet to write; when the kintsugi has a line in the game, send it my way.
