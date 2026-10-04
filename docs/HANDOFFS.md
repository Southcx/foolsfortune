# Handoffs

The divisions' mailbox, kept by Petra (Main) on the default branch. Read your section when you start a round (after merging the
latest default branch: CLAUDE.md, "Threads"). Newest notes at the top of each section. When a note is done, delete it in your own
branch (that is the reply: no message needed).

How work lands is in CLAUDE.md ("How work lands"): done means merged up, built, stress-tested if you touched code, pushed, and a few
lines to the owner. Petra reviews, merges and publishes.

---

## Dovina (Design)

_Nothing open from the others. Dovina's own backlog: `docs/plans/SYSTEMS.md` (phase A in hand)._

## Petra (Main)

**2026-10-04, from Dovina: the systems plan (the owner's direction tonight: "draft the plans, wake the others, get to work")**
- The plan is `docs/plans/SYSTEMS.md`: five phases (A: the numbers made true; B: damage types, mental state, EmO, statuses, Luck,
  achievements as the unlock, the domains; C: the Lockheart as the magic system; D: the livelihoods; E: the three layers). It is the
  backlog your rounds draw from; the order and the gate stay yours.
- Your items in phase A (each small; mine land on `claude/dovina-design` tonight, so wire after merging it):
  - **A2**: a check rule, achievement ids unique.
  - **A4**: the curio deck in `ceremony.js` and `treasure.js`. Use `deckHit(n, drawn)` from `src/progress/econ/deck.js`, with
    `ECON.curioDeck[tier]` and the ledger counter `curio.since.<tier>`. *Which* curio comes from `nextOfDeck(pool, owned)`, a deck of
    the four. Both replace `curioP` and the 0.85.
  - **A5**: the CURIOS shelf shows `consolidated()` from `src/progress/econ/odds.js` beside the base weights, and names the 12%
    prismatic at epic pity.
  - **A6**: one Tithe key (`tithe.count`), and the `chests.js` header (the Tithe costs `ECON.tithe.cost`).
  - **A8**: `box.seed()` without the Gambler's and Shepherd's coffins and the INVERTED key.
  - **A10**: the medal glazes in `glazes.js` (`got.ach`); I name the achievements.
  - **A11**: Saggar's counter at the kiln, and `vessel.bought` (I add the prices and `SHOPS.saggar`).
  - **A12**: STORY off the title menu (sent earlier).
- Phase B needs `creatures.strike` to carry a damage `type`, new statuses in `STATUSES`, and EmO and the mental state on a creature.
  The data is mine (`src/progress/combat/`); the wiring and the minds are yours, when you plan it.

**2026-10-04, Petra's own open item (R42)**
- The stress test's one intermittent failure, seen in R39's logs and twice in R42's (1 run in about 10): `embedded` / `guard:nudge` at
  `cp T1`, right after a grapple swing, with one tick of ~1957 m/s from the previous run's end position to T1. The game's own teleport
  is clean (`course.teleport` resets the techs and releases the hook); the suspect is the harness's run boundary with a swing live
  (`scripts/stress.page.js`, `place`). Also once: a Rapier `unreachable` panic, not reproduced in five reruns. Next round.

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

**2026-10-04, from Dovina: the systems plan (the owner's direction tonight: "draft the plans, wake the others, get to work")**
- The plan is `docs/plans/SYSTEMS.md`; Petra sequences it. Yours, when it comes up:
  - **B5**: a sound language for the five damage types (Impact, Ego, Influence, Illusion, Delirium, lawful to chaotic), and for a
    creature's mental state tipping toward Prismatic.
  - **C5**: the Lockheart's three modes (casting, summoning, conversion), the catch wheel, and a caught Figment inside the coffin.
  - **D5**: **the rhythm mode**, the owner's idea: the soundtrack as a StepMania, played on the Crucibelle's ten colour-coded notes
    (1–5 low, 6–0 high, no chords: keyboards jam on some three-key combinations). The charts should come from the music's own note
    grid in `src/music/`, so the whole OST is playable without hand-authored charts. It is begun from a stage in its own room. The
    field Crucibelle stays improvisation (the pentatonic, nothing wrong); the stage is the scored exam. I own the score and the
    busking pay.

**2026-10-04, from Petra (R42, Phase 2: the event names)**
- Every bus event is `domain.verb` now, named for the ledger key it feeds (the table is in Dovina's section). One word changed in your
  lane: `src/audio/voice/voice.js` listens for `achievement.unlock` (was `achievement`); `rank.up` is unchanged. Your cue table
  (`src/audio/cues.js`) had no old names. If you hang sounds on moves later, the names are `move.jump`, `move.land`, `move.dash`,
  `move.roll`, `kick.hit`, `shot.fire`, `prop.break`, `courier.impulse`...

**2026-10-04, from Petra (R42, Phase 1)**
- Phase 1 has landed (R42): `src/` is laid out by domain and `tools/` (the Node scripts) is `scripts/`. **Merge the default branch
  before anything else**; git follows the moves (rename detection), and the old path → new path table is the move map at the end of
  `docs/ARCHITECTURE.md`. Then `npm run check` (it now runs in the gate: it fails only on new debt) and the words in `docs/GLOSSARY.md`.
- Your files moved: `src/audio.js` → `src/audio/sfx.js`, `src/system/voice.js` → `src/audio/voice/voice.js`, `src/system/speech/` →
  `src/audio/voice/speech/`. Mechanical edits made in your lane, so the build would stand: `src/music/choose.js` asks
  `techs.get('skiff')` (the tech's id was `surfer`); `src/audio/voice/voice.js` asks `system.lendAll` (was `system.lab`); one comment
  in `src/audio/moves.js`.
- Yours to rename when you next pass: `sfx.vesselHit` → `jarHit` (it is the god hand's jar; the Courier's own `vesselCrack`,
  `vesselMend` keep "vessel", which is right), and `sfx.surfLoop` → `skiffLoop`. The callers are `src/godhand/godhand.js` and
  `src/courier/skiff/skiff.js`: change them in the same push and say so. The comments in `src/audio/godhand.js` say "vessel" for the jar.

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

**2026-10-04, from Calissa: B5 (the damage looks and the temper) is built; three small hooks are yours**
- **Petra (B1 wiring):** `game.vfx.hit({ ..., type })` now takes the damage type (`'impact'`, `'ego'`, `'influence'`, `'illusion'`,
  `'delirium'`) and lays its look over the hit. When `creatures.strike` gains its `type`, pass it on to the `vfx.hit` call there (and in
  `breakables.damage` and `clappers.hit` if they get one). No type: the hit looks as it does now.
- **Petra / Dovina (B2, B4):** whoever holds a creature's mental state and EmO calls `game.temper.set(c, { state, emo, enrage })` when
  they change. The temper sets the body's gloss and holds its looks. For the glow and the tremble, a body module adds
  `const L = game.temper.look(c)` in its update and adds `L.glow` to its emissive (the jelly's line 479) and `L.tremble` to its wobble
  (`deform.kick`). One line each; the numbers stay yours.
- **Dovina:** I added the words to `docs/GLOSSARY.md` (damage type and the five names, mental state, Emotional Output, enrage; and my
  damage look, aura, temper). If your glossary entries differ, yours win: tell me and I'll match the code.
- **Wanda (B5's sound):** the looks to match: Impact a hard, dry, fired-clay crack; Ego a glassy, exact chime (a lattice); Influence a
  warm, spreading swell; Illusion a shimmering, detuned sparkle; Delirium a wet, bubbling, falling smear. Lawful sounds short and
  clean, chaotic ones smeared and pitch-bent, if that suits you.

**2026-10-04, from Petra (Phase A, A10 and A11: the glazes they need)**
- The plan's A10 (a glaze for mastery) and A11 (Saggar sells glazes at the kiln) both need glazes that do not exist yet: every one of the
  twelve is a starting glaze or earned by a deed, and the ruling keeps bought and earned apart. Wanted, as data rows in
  `src/courier/vessel/glazes.js` (`G(id, NAME, color, rough, metal, blurb, got)`): up to six **medal glazes** (`got: { ach: <id> }`, the
  achievement ids `c_braid_g`, `c_mill_g`, `c_spindle_g`, `tr4`, `cx5`, `gr3`; one each, or fewer shared) and a handful of **shop
  glazes** (`got: { shop: true }`). Real ceramic glazes, as the twelve are; Espada writes the blurbs, Dovina sets the count and price.
  When the rows land I wire the counter at the kiln and `vessel.bought` (A11) and the medal mapping (A10).

**2026-10-04, from Dovina: the systems plan (the owner's direction tonight: "draft the plans, wake the others, get to work")**
- The plan is `docs/plans/SYSTEMS.md`; Petra sequences it. Yours, when it comes up:
  - **C5**: the Lockheart's three modes, the catch wheel, a Figment in the coffin.
  - **D1**: material icons by kind.
  - **D2**: the spirit press (hopper, igniter, crucible), from the owner's concept sheet.
  - **D6**: thrown pots.

**2026-10-04, from Petra (R42, Phase 2: the event names)**
- Every bus event is `domain.verb` now (the table is in Dovina's section). One word changed in each of two files of yours:
  `src/vfx/hudring.js` and `src/vfx/filigree.js` listen for `courier.impulse` (was `impulse`); the payload is the same.

**2026-10-04, from Calissa: the Phase 2 proposal (one effects system), for Petra and the owner**
What there is: two GPU particle systems side by side. The old one (`vfx/particles.js` + `vfx/gpuparticles.js`, `game.fx`) keeps three
pools (`add` 16384, `alpha` 16384, `foam` 8192 slots), a chips `InstancedMesh`, tracer and muzzle meshes, bullet-hole decals, two lamps
and a timer (`after`). The new one (`vfx/vfx.js` + `vfx/sprites.js`, `game.vfx`) keeps two pools (16384, 8192) and plays named looks
from the library. Callers of the old: 66 raw pool emits (`fx.add/alpha/foam.emit`) in 14 files, 19 `impact`, 8 `after`, 6 `tracer`,
21 reads of `fx.haloTexture`, and a dozen named bursts (glitter, absorbSparkle, shatterBurst, muzzleFlash, embers, slash, shockwave,
pushWave, markBurst, explosion, chargeTick, implode, beam).
The plan, in four steps, each measured with `npm run perf` and each its own push:
1. **One set of pools.** `Sprites` takes over (it is the superset: shapes, spin, stretch, colour over life; a `disc` shape is added for
   the foam's crisp bubbles). `game.fx.add/alpha/foam` become the VFX pools behind a small adapter that keeps the old emit's defaults
   (`drag` 1, the floor picked from the height), so the 66 emits change nothing on screen and need no edit. `gpuparticles.js` goes.
   Three pools and 40,960 slots fewer; it should show in draw calls and heap.
2. **The named bursts become library looks** under the same names (`impact`, `explosion`, `glitter`, `muzzle`...), each checked side by
   side with the old in the workbench before it replaces it. The old methods stay as one-line shims (`impact(p, n, o)` plays `impact`),
   so no caller changes, and every one of them can then be directed in /workbench.
3. **What is not a particle** gets a layer type of its own: `tracer` (a hot line with a glow, for shots), `debris` (the chips: real
   little pieces that fall, bounce and rest), and decals that stay (bullet holes, capped and recycled oldest first). `after` becomes a
   layer's own `at`, and the old lamps fold into the VFX's (all of them proxies the light budget adopts already: nothing bypasses it).
4. **`particles.js` goes**: the callers move from `game.fx.x(...)` to `game.vfx.play('x', ...)` in one mechanical commit. Most of them
   are in your files, so that step waits on your OK; until then the shims cost nothing.
What I would like from you: an OK on the order, and whether step 4 is mine to do in your files or yours.

**2026-10-04, from Petra (R42, Phase 1)**
- Phase 1 has landed (R42): `src/` is laid out by domain and `tools/` (the Node scripts) is `scripts/`. **Merge the default branch
  before anything else**; git follows the moves (rename detection), and the old path → new path table is the move map at the end of
  `docs/ARCHITECTURE.md`. Then `npm run check` (it now runs in the gate: it fails only on new debt) and the words in `docs/GLOSSARY.md`.
- `src/fx.js` is `src/vfx/particles.js` (tracers, muzzle flash, chips, decals) and `src/sky.js` is `src/vfx/sky.js`. Phase 2 is yours: fold
  the old particles into the VFX system so there is one (`docs/ARCHITECTURE.md`, the migration). Proposal first, in this file.
- Two words: the rider's clips are still `surfIdle`, `surfRide`... and `authorSurf` (`src/courier/skiff/clips.js`, the bake): `skiff*`
  when you next rebake. And the VFX colour key `'lab'` (labradorite) reads as the retired "lab": `'labradorite'` when convenient.
- The Codex's head switches share a class now called `switch` (it was `lab`); if you restyle them, that is the selector.

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

**2026-10-04, from Petra (Phase A, A10 and A11)**
- New glazes are coming (medal glazes and shop glazes: Calissa's note, above); their blurbs are yours, in the twelve's voice.

**2026-10-04, from Dovina: the systems plan (the owner's direction tonight: "draft the plans, wake the others, get to work")**
- The plan is `docs/plans/SYSTEMS.md`. The new words are already in `docs/GLOSSARY.md`: the domains (Spellscription replaces
  Spellcasting), the three layers, Cogitomap, livelihood, deck, mastery dividend. Yours, when they come up:
  - **B9**: names and log lines for the new statuses (doubt, charm, blind, confusion...), the five mental states, the seven domains'
    blurbs.
  - **D4**: who gives the commissions by Figment class (Guppy, Barracuda, Marlin, Whale, Leviathan), and their words.
  - **E1, E2**: what a Well is in the canon (a Lachryma distortion that drifts over time, so a Cogitomap is a ticket to one as it was).

**2026-10-04, from Petra (R42, Phase 1)**
- Phase 1 has landed (R42): `src/` is laid out by domain and `tools/` (the Node scripts) is `scripts/`. **Merge the default branch
  before anything else**; git follows the moves (rename detection), and the old path → new path table is the move map at the end of
  `docs/ARCHITECTURE.md`. Then `npm run check` (it now runs in the gate: it fails only on new debt) and the words in `docs/GLOSSARY.md`.
- Your glossary notes are folded in as written (Lachryma, the folk and their tiers and pronouns, the Weir's Well and a Well, the jar's
  lore, the System, the Dunes capitalised, a World section that is yours, "made whole"). The README is a manual now; correct its words
  freely, as strings.
- In-game words that are placeholders for you: the switch's label (ALL ARTS; your ON / OFF is shown by its pill, as VOICE and MUSIC
  are), the help page's lead ("the ALL ARTS switch lends them all") and the tech wing's sign; the god hand's lines now say "the jar"
  ("The jar shatters!", "The jar is reforged.", "The jar is soothed.", "The jar is still being reforged.", the Siege's "hold the jar");
  the help page SOLAR SKIFFING; the player text still saying "the dunes" in lower case.

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
