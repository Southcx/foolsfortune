# The Spirit Garden, made cozy: a plan for the owner to prune (the garden round, 2026-10-22)

Kept by Dovina. The owner, 2026-10-22: "take another look at the Spirit Garden and go wild making it look really pretty and be much
more customizable... slice-of-life comfy cozy games, that sort of rustic, warm feeling of Harvest Moon: A Wonderful Life" and "the
ultimate garden of comfort and tranquility... or perhaps a bristly briar patch of dissonance and chaos?"

How to read it: section 1 is what the garden is today, section 2 what the genre does, section 3 the plan as items. Each item has its
owner, what it costs and a box. **The owner strikes what they don't want; everything left is built in the order of section 4.** Every
number is a default to be measured once built. The Spirit Garden is in flux (CLAUDE.md), so nothing here gets a check. It gets MEASURE
lines and the garden sweep's existing checks only. Plain names throughout, until the owner calls a part final.

The lanes' full reports: Petra's placement (`docs/handoffs/dovina/2026-10-22-from-petra-garden-placement.md` on main), Wanda's sound
(`docs/handoffs/dovina/2026-10-22-from-wanda-garden-sound.md` on her branch), Espada's life and words (LORE.md "The Inner Realm", her
2d965bc3, proposed), Calissa's look (section 2.6), and the cozy research (section 2).

## 1. What the garden is today (the audit, 2026-10-22)

- **Strong:** sculpting the clay, painting five grounds, shallow water with erosion, veins that follow ridges, the press, the
  mycelium and Myggdrasil, the spirits' raising (stats, drills, forms, merging, races, sparring), the Firings, visitors that settle.
  The cue (Wanda's "A Garden in the Jar") follows the day's phase and your draught.
- **Missing for cozy:**
  - **No decor.** Features go in fixed plots laid on a golden spiral (6 on the Dantian, 6 on the Herb Terraces, 3 on the Athanor,
    5 on the Pavilions, 8 on the Mulberry Grove, 2 on the Chimney). Nothing is placed for its looks.
  - **No seasons.** The garden has the day's phases and nothing longer.
  - **It barely reacts.** Only your mental state (rain) and draught (the sky's tint and the cue's mode) reach it. Tending changes
    nothing you can see beyond the bed itself.
  - **The spirits are stats, not neighbours.** They have no routines, no wishes, no remarks.
  - **Half the tending is silent** (Wanda: watering, planting, harvesting, placing, painting, entering and leaving have no sound), and
    the garden has no ambience of its own.
  - **Two features do nothing:** Incense and the Booster Stone are placed but unwired.
  - **Economy:** the dividend is the only cube faucet. The sinks are planetoids (7,200 cubes for the four), features, and the glazes
    outside.
  - **Still open from SPIRIT-GARDEN.md section 7:** 21 (guests), 27 (the gardener in `scripts/economy.mjs`), 28 (sound), 29 (look).
    Item 26 (the ledger and achievements) is mostly built.

## 2. What the genre does (sourced; the research's full notes are in the round's agent report, summarised here)

### 2.1 What cozy is

- **The Project Horseshoe report.** Cook et al., "Coziness in Games", lostgarden.com, 2018. Three needs:
  - **Safety:** nothing high-risk, no loss, everything opt-in.
  - **Abundance:** needs met, so play turns to beauty, relationships and self-expression.
  - **Softness:** gentle senses, slow pace, small scope.
- **What breaks it:**
  - transactional pressure;
  - threat;
  - obligations and needy companions;
  - notifications;
  - intense stimulus;
  - vast unknowable space;
  - deception;
  - opulence.
- **Negatives belong outside the nook as contrast** ("rain outside a warm nook"), never through the window. The same report warns that
  cozy mechanics decay under min-maxing, scarcity and social comparison.

### 2.2 Loops

- **Animal Crossing: New Horizons.**
  - The day resets at 5 AM. Fossils, tree-shaking and flower-watering are once a day: a soft daily cap that rewards visits over
    marathons.
  - Nook Miles+ keeps five small tasks live.
- **Stardew Valley.**
  - Watering is daily. Quality has four tiers (×1, 1.25, 1.5, 2).
  - The Community Center's 30 bundles each restore something you can see (the greenhouse, the bridge, the minecarts), with no
    deadline.
- **Spiritfarer.**
  - Request, craft, build, and the building opens the next request.
  - Its farming was cut down from Stardew's size to keep chores short.
  - Every chore serves a person, and every person ends in a farewell.
- **Unpacking.** Contemplation, discovery, expression: no score, no failure, one verb.
- **Harvest Moon: A Wonderful Life.**
  - Chapters across a life.
  - Seasons of 10 days (a guide's claim, unverified).
  - Villagers with routines and likes that take effort to learn.

### 2.3 Decor

- **Animal Crossing's island rating.** Data-mined; Nintendo publishes no formula.
  - It scores **variety in each 8×8 cell** over raw count: under 5 kinds, 1 a piece; at 10+ kinds, 0.25 a piece plus 0.75 a kind.
  - A cell more than 45 of 64 tiles full is "cluttered".
  - Trees count 1 each up to 190.
  - Isabelle says the rating aloud. The number is never shown.
- **The Happy Home Academy.** A matched set doubles; lucky items add; furniture facing the wall loses points.
- **The catalogue.** Thousands of pieces, up to 8 colour variants each, and a catalogue to reorder from.

### 2.4 Neglect and the "bad" garden

- **Animal Crossing.** Neglect costs chores (weeds, cockroaches) and nothing permanent.
- **Stardew.** Out-of-season crops die on the 1st, but the tilled soil stays.
- **Viva Piñata.** Sours are a tameable visitor class with their own look (red and black), not corruption of your land; tamed, they
  become helpers. Its own designer says the interlocked wants made it too hard: "if you had one missing then it basically just
  didn't work".
- **Black & White.** Both alignments change the land, the hand and the music, and you may stay neutral by mixing. Good isn't the only
  ending.
- **Okami.** Restoring blighted ground is the brush's most satisfying use: the lifting of the bad state is the reward.
- **Gris.** The palette carries the grief, and the levels loop rather than march.

### 2.5 Sound (Wanda)

- **Stardew.** Songs rotate rather than loop, and seasonal ambience fills the gaps. Players complain about the silences.
- **Animal Crossing.**
  - A tune each real hour.
  - Rain strips the percussion.
  - Every island has its own bed of sound.
  - Placed music players are heard where they stand.
- **Spiritfarer.** Piano as the domestic instrument, "a warm, cozy blanket", with one theme coloured per place.

### 2.6 Look (Calissa)

- **What reads as cozy, ten levers** (the Horseshoe report's softness and abundance, in light and form):
  1. One warm key light, low and golden (about 2,700 to 3,500 K), against cool blue-violet shadows, low contrast.
  2. Pools of light in a cool dusk (lanterns, a window, fireflies): a light left on makes night safe.
  3. Soft forms: round, chunky, bevelled.
  4. Movement that breathes: gusts across grass, steam, a ripple, slow and out of phase.
  5. Small life that ignores you: bees, butterflies, dragonflies, fireflies.
  6. Abundance you made: full beds, baskets, paths worn where you walk.
  7. A painted sky (Ghibli's cumulus, Spiritfarer's Yoshida woodblocks).
  8. Handled materials: wood, linen, clay, moss, worn stone.
  9. Seasons: the biggest lever after the hour.
  10. Weather watched from shelter.
- **The briar, cozy's shadow: every lever run backwards.** The warm key fails to flat overcast, shadows go green-black, colour drains
  to olive and rust, forms go spiky, the wind gusts and the thorns twitch, the bees leave and moths and crows come, the briar climbs
  over what you built. The halfway point is an abandoned moss garden, still beautiful: **the middle of the dial is never ugly.**
  Prior art: Sleeping Beauty's briar wall, Hollow Knight's Queen's Gardens, Ori's decay.
- **Our garden today** (her 12 headless shots at four game hours and in rain): a pastel dream, not a warm home.
  - It reuses the Dunes' lights: a pink haze and rose fog flatten the depth.
  - Dawn, midday and dusk look nearly alike: no golden hour, no long shadows.
  - The ground is flat lime with little breakup, and the features read as tiny pastel cubes.
  - The default canopies read from afar as cold blue-violet noise.
  - No small life, no seasons, and the rain barely reads.
- **Her order of warmth:** the garden's own light by the hour; grass and wildflowers that move; small life; warm green default
  canopies; seasons as one palette table; the briar's forms and grade behind one scalar.
- **Her ask:** one scalar, 0 comfort to 1 briar, that every lever reads at once. **Given:** `game.harmony.briarK(planetoid)`
  (`briarOf`, `progress/harmony.js`): 0 at bloom and over, about 0.33 at rest (the moss garden), 0.53 at the briar's edge, 1 at the
  bottom.

### 2.7 What we take

1. **Opt-in everything; no loss.** Neglect makes chores and contrast, never takes anything away.
2. **A soft daily cap on the game clock.** The first tend of a kind each game day counts. A visit is worth more than a marathon.
3. **Visible, lasting gains.** What you do changes the ground you see.
4. **Variety over quantity.** Animal Crossing's per-cell rating.
5. **Residents with their own lives.** They are not your responsibility; their gifts are personal.
6. **Readable conditions.** Viva Piñata's ladder, with one want at a time, never its interlock.
7. **The bad state is a creature and a choice,** tameable, with its own life (the sours), and lifting it is the satisfying part
   (Okami).

## 3. The plan, item by item (the owner strikes what they don't want)

### A. Harmony and briar: the garden mirrors you (the owner's two gardens as one gauge)

The garden is the Courier's own psyche made ground (Espada's read, LORE.md, proposed). Calm or briar follows the law that already
governs the mental state: pushed up by what is drunk, settled by quiet. It is **a modifier with a source you can see** (DESIGN.md 22,
"base change bad"): no rule of the garden changes. Thorns grow at the place the cause is, and the cue's tuning drifts.

- [ ] **A1. One gauge a planetoid: harmony, 0 (briar) to 1 (calm), resting at 0.5.** Plain name "harmony". The owner's word
  "dissonance" is the god hand's island gauge (the Dissonance Level), so the two stay apart unless the owner wants them joined
  (question Q1). One number a planetoid, not one for the garden, so the briar sits where its cause is and a calm Dantian can sit
  beside a briar Chimney. *Dovina: `progress/harmony.js`, rules and the save.*
- [ ] **A2. What raises it (tending), each the first of its kind on that planetoid a game day (the soft cap, Animal Crossing's):**
  - a bed watered or harvested;
  - a spirit fed or petted;
  - a wish met (C2);
  - a thorn pruned (A4);
  - a quiet rest at the meditation mat or by Incense, which finally gets its job: Incense doubles the rest's settle rate within 4 m.
  Each is +0.05, up to +0.25 a planetoid a game day.
- [ ] **A3. What lowers it (what you carry in, and what waits), each with its place:**
  - **Carried in.** Entering the garden above Balanced (mental state over 0.5) lays briar at the Dantian's arrival lotus:
    −(state − 0.5) × 0.4, so −0.2 from Prismatic. Overflow on entering lays −0.1 more. The most carried in counts once a game day, so
    going in and out is no deeper.
  - **Waiting.** While a spirit goes unvisited (fed, petted, drilled or raced) past 3 game days, the Mulberry Grove's rest is held 0.06
    lower, 0.3 at most. It is a modifier held while its cause stands: the Grove drifts toward it 0.02 a game day, and back the moment
    the spirit is visited. Measured: two forgotten spirits are a nudge (0.42 after a week of game days), four overgrow the Grove in
    about 10.
  - **What it never is.** Sculpting, painting and the god hand's work never lower it: shaping your own ground is play (From Dust,
    SPIRIT-GARDEN.md's ruling on GROUND).
- [ ] **A4. Thorns.**
  - **Where.** Below 0.35 a planetoid grows a thorn patch each game day at the place of its newest cause (the lotus, the spirit's
    house), up to 6 a planetoid.
  - **What a patch does.** It is a modifier on the ground under it: plants don't spread onto it, and the Jar's hop is slowed there
    (Petra rules whether movement may be touched). The Jar's controller is the garden's own, not the core movement.
  - **Pruning.** A patch is pruned by the god hand in one stroke (GRAB held and drawn across), raising its planetoid's harmony by 0.03
    and dropping a briar cutting (a material, E3).
  - **No loss.** Nothing is ever destroyed, killed or taken.
- [ ] **A5. Bloom.** Above 0.75 a planetoid blooms: flowers come up on its moss and loam, the light warms, and the spirits there hum
  the tune (B4). Okami's restoration, the reward you see.
- [ ] **A6. The briar garden as a choice, not a fail state.**
  - Briar has its own life. Fury, Gall and Dread spirits like it (+1 bond a game day while their planetoid is under 0.35).
  - Briar fruit grows only on thorns: a material of Gall's kind, the one way to get it in the garden.
  - Briar visitors come to it (C4).
  - A player who wants a bristly garden keeps one. Viva Piñata's sours and Black & White's evil land, both playable.
- [ ] **A7. Shown, never said as a number.** Two avenues or more (CLAUDE.md):
  - **The ground:** thorns, blooms and the light.
  - **The sound:** Wanda's tuning, B3.
  - **The overlay:** a tag on the planetoid in the overhead view (CALM, BRIAR, between them nothing) and an arc on the Sight's dial
    while in the garden.
  - **The log** when a planetoid crosses into briar or bloom ("Briar on the Chimney." / "Bloom on the Herb Terraces." Placeholders for Espada's
    words).
  *Calissa the look, Wanda the sound, Espada the words, Petra the thorns' place in the world.*

The lesson, unsaid (DESIGN.md 22, "every system teaches something real"): feelings carried in and left untended overgrow; tended, they
make a garden.

### B. Sound (Wanda's proposals, as she wrote them; hers to build)

- [ ] **B1. The garden's own ambience, made of what you placed:** a pond adds water, moonflowers add crickets, the tree adds leaves.
  The cue may rest now and then and let it play, but never for long.
- [ ] **B2. Tending as music:** each act on the cue's beat and in its key. A watering is a run down the scale, a planting a knock and a
  note, a harvest a step up a crop, and a whole bed harvested plays the Answer.
- [ ] **B3. Harmony you can hear** (Plomp and Levelt's roughness). A calm planetoid's voices are tuned (fifths, just intonation). A
  briar one's are a few cents to a quarter of a critical band apart, so they beat and grate, with thorny plucks and a cicada rasp.
  Pruning pulls them back into tune, and you hear the beating slow and stop. The tune itself never changes, only its tuning.
- [ ] **B4. Spirits hum the tune when happy, and go out of tune when not.**
- [ ] **B5. Placeable sound:** a wind chime, a music box, a gramophone that plays a cue you own, heard where it stands. These are decor
  (D).
- [ ] **B6. Seasons as arrangements of one tune** (if E is kept): spring flute and harp, summer steel pan and brushes, autumn fiddle and
  accordion, winter music box and bells. Rain strips the percussion.

### C. The spirits as neighbours, visitors and letters (Espada's proposals; the words hers, the rules Dovina's)

- [ ] **C1. Routines.** Each spirit has a place by game hour and weather: morning at the pond, rain under the pavilion, night by the
  lantern. They are shaped by grain (curious wanders, steady keeps a spot). *Rules: Dovina (`progress/spirits.js` ROUTINE). The walk:
  Petra.*
- [ ] **C2. Wishes** (Spiritfarer). From bond 30, a spirit asks for one thing at a time: a feature or piece near its spot, a food, a
  plate of its kind in the wild, or a visit at an hour. Met, it gives +10 bond, +0.05 harmony (A2) and a thank-you letter (C5). Only
  one wish a spirit is open at a time, it never expires, and nothing is lost by ignoring it (no needy companions, Horseshoe).
- [ ] **C3. A spirit notices.** It comments on the decor nearest its spot or on what you just moved, in its grain's register. These
  are words in the dialogue box when you talk to it (F over it with the hand); the rest of the time, glyphs and body.
- [ ] **C4. Folk visitors, drawn by what the garden shows** (the existing VISITORS are the wild ones). The opinion is the island
  rating said in a voice, never a number:
  - Pip at high harmony;
  - Saggar for glazes and pots;
  - Raku to appraise the garden's worth;
  - briar visitors (Gall, Fury and Dread Figments) to a briar garden;
  - siblings and guests in co-op.
- [ ] **C5. The mailbox at the Pneuka Box's shed.**
  - **Letters:**
    - spirits' thanks;
    - the folk's notes (Saggar's glaze tip, Grog's fishing spot);
    - **postcards from released spirits** (Espada: "it makes a release feel like a beginning").
  - **Gifts:** at dawn, a small thing on the doorstep now and then (Animal Crossing's "for you!"): a decor piece, a curio, a material.
- [ ] **C6. The farewell** (Spiritfarer's Everdoor). A matured spirit at bond 100 may ask to go home. The release becomes a small
  ceremony and it is never forced: you may say "not yet", for ever. After it, postcards (C5). Release is canon already; this gives it
  its weight.
- [ ] **C7. The dawn digest.** Myggdrasil's diary grows into the morning's log lines: who woke where, who wants what, the weather, a
  letter waiting. A Wonderful Life's morning TV, Stardew's notice board. One block of at most four lines, said on entering the garden
  for the first time each game day.

### D. Decor: the garden made yours (Petra's placement, Dovina's catalogue and prices, Calissa's pieces)

- [ ] **D1. Free placement on a grid of its own** (Petra).
  - **The grid:** a cube-sphere a planetoid, cells of about 1 m (16 to 31 along a face), half-cell steps, yaw in four turns or 15°.
    Shift places freely and stops at alignments (snap-and-go).
  - **The plots stay** for the features that work (beds, the press). Decor is a layer above them.
- [ ] **D2. Placing.**
  - **Where it lives:** PLACE's second mode (plots or decor on R) opens the catalogue window. The wheel turns a held piece.
  - **The view:** the overhead view, tilted about 50° to see heights.
  - **The cursor:** a ghost of the piece, lit where free and red where blocked, with a sound on each snap.
  - **Undo:** one Ctrl+Z, 50 deep, for decor and clay alike.
- [ ] **D3. The catalogue** (Dovina: `progress/decor.js`).
  - **First set:** about 40 pieces in five sets, one a feeling:
    - Wonder: stone lanterns and moss;
    - Mirth: paper lanterns and a drum;
    - Desire: a tea table and cushions;
    - Grief: a rain chain and a willow;
    - Dread: a koi bridge and a mist stone.
    Plus the plain things every garden wants: paths, fences, benches, a gate, a mailbox, planters and stepping stones.
  - **Tints:** each piece in up to 4 tints, any tint free once the piece is owned (Animal Crossing's remake).
  - **Once owned, always in the catalogue:** a piece once owned can be bought again there at its price (more copies).
- [ ] **D4. Prices** (the minute of play, `ECON.perMinute` 8; a sink that never fills, so it may be generous):
  - small 1 minute (8 cubes);
  - medium 3 minutes;
  - large 8 minutes;
  - a set's centrepiece 20 minutes.
  - **Picking up a piece:** it goes back to the shed's storage whole, to be placed again (Animal Crossing's storage: no tax on
    rearranging; the cozy rule against transactional pressure). A piece bought is one copy; a second copy is bought again.
  - **The whole catalogue, one of each:** 1,744 cubes, 3.6 real hours of play at the aim (measured, `scripts/garden-cozy.mjs`). A
    feeling's set is about half a real hour; the dividend with every slot working pays the catalogue in about 24 real hours away.
  - **Why it is affordable:** decor pays nothing back, ever. It is beauty, not income: the Horseshoe report's opulence and
    transactional-pressure warnings, and the design law that mastery is never paid in cubes.
- [ ] **D5. Where pieces come from.** Every piece has two ways or more to get it:
  - bought at the shed's catalogue (the plain ones);
  - a spirit's gift at dawn (C5);
  - a wish's thanks (C2);
  - a visitor's gift (C4, the existing VISITORS' "leave a gift");
  - an achievement, for the set centrepieces;
  - briar pieces from briar fruit (A6).
- [ ] **D6. The garden's rating** (Animal Crossing's island rating, adapted).
  - **Scored by variety in each grid region** (a cube face's quarter): half a point a piece, counted up to 3 of a kind, plus 0.75
    a kind. A set finished (every piece within 8 m of its centrepiece) adds 15, about a lake lotus (the Happy Home Academy's sets).
  - **Clutter:** a region more than 70% full scores half.
  - **Kept quiet:** the rating is never shown as a number. It shows as the lotuses blooming on the Dantian's lake (0 to 5, a world
    mark), in the folk visitors' remarks (C4), and in the log when a lotus opens.
  - **What it opens:** visitors (Raku at 3, Saggar at 2), a decor set's recipe at each lotus, and Pip's visit when both the rating
    and harmony are high.
- [ ] **D7. Collision.** Large pieces get a keep-out circle; the Jar and the spirits' wander read it (Petra: today they walk through
  features).
- [ ] **D8. Sharing a layout as a text code** to a sibling or a guest, later, with co-op (Petra's note: about 25 bytes a piece).

### E. Seasons (the garden's own clock)

- [ ] **E1. Four seasons of 7 game days each** (7 real hours of play a season, a garden year in 28 game days). A Wonderful Life's
  10-day seasons (unverified) and Stardew's 28 days are the bounds. 7 means a player at an hour or two a day sees a season a week:
  the week's scale. **Question Q2:** the garden's own, or the whole island's?
- [ ] **E2. What a season changes:**
  - **The look:** leaf colour, blossom in spring, snow on the poles in winter; Calissa's.
  - **The cue's arrangement:** Wanda's, B6.
  - **The plants that spread:** the existing cellular rule, but by season.
  - **Visitors:** some wild kinds come only in their season.
  - **Seasonal pieces:** a pumpkin lantern, a snow lantern.
  - **What it never does:** kill a plant or a bed (Stardew's season death is struck). An out-of-season bed rests, and resumes.
- [ ] **E3. Seasonal materials:**
  - a briar cutting (any season);
  - spring blossom, summer reed, autumn leaf, winter frost;
  - each a material of a feeling's kind, for the press, the spore beds and a set's recipe.
  More things to press, not a new currency.

### H. The look: warmth (Calissa's proposals, as she ordered them; hers to build)

- [ ] **H1. The garden's own light by the hour:** a golden key with a cool fill, a real golden hour at dawn and dusk, the pink fog
  thinned so the planetoids get depth, lamps that come on at dusk. (Petra: the light's hookup in `realm.js`.)
- [ ] **H2. Grass and wildflowers that move:** instanced tufts with gusts travelling across, in each ground's own hand.
- [ ] **H3. Small life:** bees and butterflies over flowers, dragonflies over water, fireflies at dusk; later steam and smoke from
  features. (Wanda's pair: bees, birdsong, rain on leaves.)
- [ ] **H4. Warm green default canopies;** labradorite stays for Lachryma's own trees.
- [ ] **H5. Seasons as one palette table** the whole realm reads (E's calendar: `seasonOf`).
- [ ] **H6. The briar's forms and grade** behind the one scalar (`game.harmony.briarK`): the key fails to overcast, olive and rust,
  spiky forms, moths for bees, the middle of the dial a moss garden, never ugly.

### F. The goals at each scale (the systems designer's check)

| scale | the player's goal | what answers it |
|---|---|---|
| the next 30 seconds | place a piece, prune a thorn, meet a wish | D2, A4, C2: each with a sound (B2) and a change on the ground |
| the session (an hour, a game day) | tend each planetoid once, read the digest, answer a letter | A2's soft cap, C7, C5; the day's goals (`progress/goals.js`) may pick a garden achievement |
| the week (a season) | a set finished, a lotus opened, a spirit's wishes through, the garden in bloom (or in briar) | D6, C2, A5/A6, E |
| the long arc | the Firings, every spirit's farewell, the full catalogue | existing, plus C6 and D3 |

### G. The ledger, achievements and the economy (Dovina; items 26 and 27 closed)

- [ ] **G1. Counts:**
  - `garden.tend.<kind>`, `garden.prune`, `garden.bloom`, `garden.briar`;
  - `decor.place`, `decor.own.<id>`, `decor.set.<set>`, `garden.rating` (a record);
  - `spirit.wish`, `spirit.letter`, `spirit.farewell`;
  - `garden.season`.
- [ ] **G2. Achievements, in THE SPIRIT GARDEN's subs plus a new one, "The Garden's Life". The names are placeholders for Espada's:**
  - First Bloom, In Full Bloom (every planetoid at once), Pruner (50 thorns), Bramble Keeper (a planetoid held in briar for a season,
    the briar way counted equal);
  - Collector (a set), Catalogue (every piece), Five Lotuses;
  - Wishmaker (25 wishes), Pen Pal (10 letters), Bon Voyage (a farewell), A Year in the Jar (four seasons).
  Each kept as a predicate over the ledger, a count way and a feat way for each worth having (the design laws).
- [ ] **G3. The gardener in `scripts/economy.mjs`** (item 27): an hour in the garden priced. It counts the beds' materials, the
  dividend, and the decor sink's draw, and checks that the dividend still pays a cozy player's catalogue within the first real week.

## 4. The build order (when the owner has pruned; each step lands on its own)

1. **Dovina:**
   - **built this round** (2026-10-22): `progress/harmony.js` (A1 to A6's rules, the gauge in the save, `/harmony`, `briarK`),
     `progress/decor.js` (D3 to D6: the catalogue of 47 pieces, prices, the shed's storage, the rating), `progress/seasons.js` (E1),
     the ledger and ten achievements in "The Garden's Life" (G1, G2), and `scripts/garden-cozy.mjs` (MEASURE lines). Waiting on the
     world: thorns placed and pruned, decor placed, the rating reported (`garden.rating`).
   - **built second (the same night, the owner asleep and trusting):** `progress/spiritlife.js` (C1 routines, C2 wishes, C7 the digest),
     the gardener in `scripts/economy.mjs` (G3), and, offered to Petra and taken off her plate, the world side as new files:
     `world/garden/decorgrid.js` (D1: the cube-sphere, measured within 1.09 : 1), `world/garden/decorlayer.js` (D2: placing, moving,
     turning, storage, the catalogue page, the ghost, the rating reported), `world/garden/thorns.js` (A4: patches at their cause, GRAB
     prunes for a briar cutting), with four one-line hooks in `realm.js` and `hand.js`. Placeholder shapes; Calissa dresses them.
   - **built third, to Petra's conditions:**
     - one BatchedMesh for decor and one for thorns, on one material;
     - the clay held under each piece;
     - collision (D7) for the Jar and the spirits;
     - thorns slow the Jar's hop (×0.6, the owner's to feel);
     - decor's own undo;
     - `harmony.settleK` for Incense (A2: Petra adds the line in `courier/mind.js`);
     - letters, postcards and dawn gifts (C5).
     Measured (`npm run perf` against the last published build): the garden's draw calls 196, unchanged; its programs 194, was 192; its
     tick 3.1 ms, was 4.6. The stress test is clean, the garden sweep 145 of 145.
   - **next:** the spirits walking their routines (C1's world side, Petra's walk), the farewell (C6), seasons in the look and the cue
     (Calissa's, Wanda's).
   No world code; MEASURE lines in a script.
2. **Petra:**
   - the decor layer (D1, D2, D7);
   - the thorns' place and the pruning stroke (A4);
   - the spirits' walk to their routines (C1);
   - the mailbox's place.
3. **Calissa:** H1 to H6 first (the warmth), then the decor pieces (five sets and the plain things), thorns and blooms, the harmony
   arc and tags, the lake lotuses.
4. **Wanda:** B1 to B6.
5. **Espada:** the spirits' lines, wishes, letters, postcards, the visitors' remarks, the digest's words, and the achievements' names.
6. **Dovina:** the garden sweep's existing checks rerun, MEASURE lines for harmony and the rating, and the QAIS tests for the owner,
   each with a debug chest of decor, materials and briar cuttings.

## 5. Questions for the owner (Dovina batches them)

- **Q1.** Harmony and briar are a gauge of the garden's own, apart from the god hand's Dissonance Level. Join them, or keep them
  apart? (Dovina and Espada: keep them apart.)
- **Q2.** Seasons: the garden's own clock (7 game days a season), or the whole island's?
- **Q3.** A briar garden kept on purpose, with its own spirits, fruit and visitors: in or out? (Dovina: in. Without it, briar is only
  a scolding.)
- **Q4.** May a spirit at bond 100 ask to go home (the farewell, C6), never forced?
- **Q5.** A piece picked up goes back to storage whole, so rearranging is free. Fine, or should it cost something?
