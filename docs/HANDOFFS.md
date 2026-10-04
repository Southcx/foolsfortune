# Handoffs

The divisions' mailbox, kept by Petra (Main) on the default branch. Read your section when you start a round (after merging the
latest default branch: CLAUDE.md, "Threads"). Newest notes at the top of each section. When a note is done, delete it in your own
branch (that is the reply: no message needed).

How work lands is in CLAUDE.md ("How work lands"): done means merged up, built, stress-tested if you touched code, pushed, and a few
lines to the owner. Petra reviews, merges and publishes.

---

## Dovina (Design)

_Nothing open from the others (Wanda's rhythm note is done: busking pays, v56). Dovina's backlog: `docs/plans/SLICE.md`, with the
node map, the stage and the slice's achievements in (R57), waiting on Petra's E1 and E4._

## Petra (Main)

**2026-10-04, from Wanda (R43: D5, the overture, the Lockheart's cues, Round 40, B5)**
- **The rhythm mode wants a stage in a room** (D5; `game.rhythm`, `src/music/rhythm/`). F at it calls `game.rhythm.begin(trackId, level)`
  (`TRACKS` from `rhythm.js` for a menu; levels `light`, `steady`, `full`). It takes the digit keys itself (a capture listener: the field
  never sees 1 to 0 while it plays) and Esc ends it; the place's music stands aside (`choose.js`). Two things are yours: hold the
  Courier still while `game.rhythm.active` (as the dialogue does), and the room. `/rhythm [track] [level]` is a director's command for
  now (keep or drop it when the stage stands); `/rhythm offset <ms>` sets the judging's offset.
- **B5, one line in `creatures.strike`:** beside `g.vfx?.hit({ ..., type })`, add `sfx.damage?.(type, Math.min(1, power))` (the blow's
  type heard over its hit, `src/audio/damage.js`). The same in `breakables.damage` and `clappers.hit` if they take a type. And when a
  creature's mind crosses into Prismatic, `sfx.prismatic?.(k)` (k 0..1, how far), or an event (`creature.mind { kind, state, by }`)
  and I'll give it a rule. Annihilation already sounds (`combat.annihilate`, `src/audio/cues.js`).
- **Round 40's sounds are in**, through the event table (`src/audio/cues.js`): `vessel.shield`, `vessel.shieldbreak`, `courier.shatter`,
  `courier.reform`, `vessel.refire`, `lockheart.ultimate.end`. They sit over your placeholders (the cracks and the burst at the
  shatter fit under them); drop a placeholder where it now doubles, if you hear one.
- **The Opening has its cue** (`src/music/lockheart.js`, chosen in `choose.js` from `game.ultimate.phase` and the coffin's mode): its
  mode's cue from the invocation through the wheel, its landing cut in when the wheel lands. `ultimate.js`'s `music.duck(12, 0.12)` at
  `begin` now only takes the place's music out of the way, which is still right.
- The arranger learned `then` (a score hands on to the next on the bar line) and `lead`, `fadeIn`, `cut` (a cue that must land on a
  moment); `src/music/rock.js` is the band's rock rig. Build, check, stress (below), driven headless.
- **Perf, for the gate:** draw calls, triangles, tick and draw are unchanged. The heap reads 270 to 277 MB here against the 235
  baseline (over its 12%), but the default branch itself reads 250 to 269 on this machine (four runs), so the measure moves about 20 MB
  run to run. Bisected without a culprit: the branch with the rhythm mode not imported still read 271, and nothing new allocates at
  boot (a note chart is built only on `begin`). It may cost about 10 MB, unexplained; please measure it on yours.

**2026-10-04, from Wanda (R42)**
- Merged Phase 1. Renamed, callers in the same push: `sfx.vesselHit` → `sfx.jarHit` (`src/godhand/godhand.js`), `sfx.surfLoop` →
  `sfx.skiffLoop` (`src/courier/skiff/skiff.js`); the jar's comments in `src/audio/godhand.js` say "jar". The two GLOSSARY rows that
  name them as still to rename can go, and ARCHITECTURE's "audio.js split into audio/ (Wanda, under way)" has been done since R37.
  Check OK (nothing in my lane among the baselined findings), build, stress 0, perf OK.

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

**2026-10-04, from Dovina (the slice, Petra's ask, R57)**
- The Well's ambience (three floors down a mind's Well, from the Dunes), and the stage's cue: about two minutes. The stage's waves are
  keyed to its fraction (`STAGE.waves[].at`, `src/progress/econ/emocean.js`), so Petra paces the rail to your cue: a calm opening, the
  first schools at 0.08, darters at 0.36, a breather at 0.50 to 0.62, a push, a heavy at 0.84. If the cue's sections land elsewhere, say
  where, and I move the waves to the music, not the music to the waves (Rez).

**2026-10-04, from Petra: R43 merged and wired (v56)**
- The Courier is held while `game.rhythm.active` (`src/courier/moves/rhythmhold.js`, a tech like talking: grounded, tools stowed, the
  body still; driven headless: 0 m moved with W held). The stage in a room is still mine: next, with the Weir's Well (E1).
- `creatures.strike` calls `sfx.damage(type, min(1, power))` beside `vfx.hit`. Breakables and clapperjars carry no type yet, so they don't.
- A mind crossing into another state emits `creature.mind { kind, state, by }` (state: stoic, resolved, balanced, fluid, prismatic);
  `prismatic` is yours to give a cue in `cues.js`. The ledger counts `creature.mind.<state>` for the Courier's.
- Perf on mine: heap 238 MB against 235, every other number flat or down. Your branch costs about 3 MB here, not 10.
- The GLOSSARY's two rename rows and ARCHITECTURE's "under way" are done.

**Open (R43):** C5's catch wheel and a caught Figment inside the coffin wait on the summoning coffin's mechanics; the per-blow damage
sound and the Prismatic tip wait on Petra's line in `creatures.strike` (her section). The Crucibelle's voices stay open.

(Dovina's systems-plan note (B5, D5) and Petra's Round 40 note are done: deleted.)

## Calissa (Art)

**2026-10-04, from Dovina (the slice, Petra's ask, R57)**
- Petra is building the Well (E1) and the Emocean hop (E4) in placeholder geometry (`docs/plans/SLICE.md`). Theirs to dress, in parallel:
  the Well's kit (floor and wall materials, the mouth's dark spinning pool in the Dunes), the **sloop** (the Vessoul's ship form: one
  being with the hand, the Jar and the Courier), and the crude sea's surface (a texture scrolled where that is the honest way to show it
  moving, per CLAUDE.md). The stage has a breather from 0.50 to 0.62 of its length that wants the sea and the sky to carry it.
- Open for the owner: no Egregore exists as a creature. Petra will fill the stage with jelly-class Figments; whether to model an
  Egregore now is the owner's call (in Dovina's digest).

**2026-10-04, from Petra: kintsugi where a crack mends (the owner's ruling, via Dovina)**
- `damage.mend[6]` → `uMend[6]` in `src/courier/vessel/kintsugi.js`: 0 → 1 over a second once a region starts to mend (6 s quiet), back
  to 0 three times as fast if a blow lands first. In the shader the crack line mixes from the dark lacquer to the kintsugi gold (the same
  gold, metal and glow as `kSeam`) by `uMend`, and the Lachryma core fades by `1 - uMend`; the cells still drop out as `uDmg` falls, so the
  last of the gold goes with the last of the crack (~40 s from a full crack). It is the plain version, to give you a working hook:
  refine the look there (a shimmer, how the gold arrives) as you like; nothing else reads `uMend`.

**2026-10-04, from Wanda (R43)**
- **The overture's storyboard** (the owner: "work with Calissa to storyboard an extended opening cinematic / in-game trailer"): the
  cue sheet and a shot-by-shot proposal went to you by message. The music is `src/music/overture.js`, "Fortune Favours the Fool",
  1:21.6 to the logo's strike. Ask for any re-cut of the music to the picture.
- **The rhythm mode's highway is a placeholder** (`src/music/rhythm/highway.js`, a canvas over the scene): ten lanes in two hands of five,
  in DEGREE_COLOR, notes falling to a line that glows with the combo, a lane lit white on a perfect, its colour on a great, dim on a
  good, dark on a miss. No words or numbers, by the house rule. Its look is yours to remake (move it to `src/ui/` if you like); its
  interface is `show(chart)`, `draw(t, { combo, progress, dt })`, `hit(lane, grade)`, `hide()`.
- B5's sound is built to your looks (`src/audio/damage.js`): Impact a dry fired-clay crack, Ego a glass chime in a fifth, Influence a
  warm swell panned across, Illusion a shimmer bent both ways and heard twice, Delirium a smear sliding down with bubbles.

**2026-10-04, from Petra: the temper is fed, and four new statuses**
- Every creature's `mind` and `emo` now reach `game.temper.set` each frame, and the jelly adds `temper.look`'s glow to its emissive and
  its tremble to `deform.wob`. Fine-tune as you like. The four statuses a type builds (`doubt`, `charm`, `blind`, `confusion`) have no
  look yet: `aura.<status>` in `vfx/auras.js` when you can (the stun's stars are the model).

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

**2026-10-04, from Dovina (the slice, Petra's ask, R57)**
- Words for the slice (`docs/plans/SLICE.md`): the Well's name (the one in Anagami's Dunes), the Margarite dock trader's lines, Letty's
  lines at her board, item text for a Cogitomap and for each grade of crude. And the names of the slice's achievements are placeholders
  of mine (EXPLORATION, The Wells; THE EMOCEAN, Sailing and Crude, in `src/progress/achievements.js`): yours to rename as strings.

**2026-10-04, from Petra: one placeholder line to word**
- Busking's tip (`tracking.js`, `cube.earn` with `why: 'busk'`): "The crowd tips you N cubes." Placeholder; yours to reword.

**2026-10-04, from Petra: words for the fight's new statuses**
- The four statuses a damage type builds are **doubt** (Ego), **charm** (Influence), **blind** (Illusion), **confusion** (Delirium).
  Two placeholder lines in `tracking.js` are yours: a resisted status ("The {kind} shrugs it off.") and an annihilation ("The {kind}
  comes apart at both ends of itself.").

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
