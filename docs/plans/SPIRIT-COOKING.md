# Spirit Cooking (a plan; bread built 2026-11-01)

South, 2026-11-01: "Cooking is something worth looking at too. Call it 'Spirit Cooking' and do extensive design research on other
cooking games like cooking mama, battle chef brigade, fantasy life i, and so forth for how the minigames should play and techniques you
can adopt. Use real cooking techniques as this is a great opportunity to slip in some real world details on processes, even if the
implementation is fantasy or unrealistic. Your intuition is very correct that this is VERY much associated with Soul Alchemy."

The research, every number with its source, is `research/SPIRIT-COOKING.md`. It covers about 25 games, 21 real techniques with their
numbers, the flavour-to-feeling traditions, and a pitfall table. This plan is the design drawn from it. Section 12 has South's rulings
(2026-11-01).

## 1. What it is, in one breath

You cook a dish in two to four short moves, each a real technique:
- sear until the surface is dry and brown;
- take syrup off at the soft ball;
- never let the kombu boil.

Each move is judged by how near you held its heart. The dish served is a **held draught**: a feeling, its strength and how long it
lasts, which bends the next presses at the Athanor. Cooking is the hand and the clock; Soul Alchemy is the eye. One feeds the other.

## 2. Why this shape (the decisions, each with its prior art)

1. **The hand-and-clock craft, so the press stays the eye's.** Soul Alchemy is already a map craft: a soul colour walked on the colour
   wheel, Potion Craft's marker. A second map craft (Atelier's grids) would be a re-skin. Cooking trains *time and temperature*
   instead: hold a value in a band, lift at the tune, stop at the colour. It is a different skill feeding the same substrate.
2. **A dish is two to four moves, graded as their average** (Cooking Mama: under 10 s a step, the dish the average of its steps). A
   clean run is quick: skill skips grind.
3. **Skill is holding a value inside a band, and the band is Soul Alchemy's swatch.**
   - Each move has a heart and a width.
   - Practice widens the width toward a ceiling, and never the heart: SOUL-ALCHEMY.md 3.2's `r = r_rank + (ceiling - r_rank) x
     practice / 100`, and its true firing.
   - A **true cook** is the heart of every move.
   - Grind closes the gap; skill skips it.
4. **The tell is the interface, never a thermometer.** Real cooks judge by what the food does, and so does the game. A thermometer is a
   late-earned knack (assists are knacks: `KNACKS.thermometer`, opened at 150 dishes served or 20 True cooks, shows the move's value and its
   heart beside the tells; built 2026-11-02, its switch in the cooking window Petra's). The tells:
   - the cold-water test (a spoon of syrup dropped in: a thread, a soft ball, a brittle crack);
   - the roux's colour;
   - the rinse water clearing;
   - a sauce coating the back of a spoon;
   - the steam's first wisp.
5. **"Critical" is a skill state, never a die.** Breath of the Wild rolls 5% per material; here the true cook is the critical. A time
   window, like the Blood Moon's, is a flourish (a longer hold), never the only way to the best dish.
6. **One trade-off a dish, neither end best.** A darker roux has more flavour and a quarter of the thickening. A harder sear has more
   Maillard and more risk. A longer ferment has more depth and less bite. This is MYCELIUM.md's refusal of dominant choices.
7. **Failure is comedy, cheaply fixed** (Mama will fix it). A failed dish is a "dubious dish": a little pool back, no draught. It feeds
   the World Mushroom, the garden's sink, or is rotted back to materials. Nothing spoils, there is no hunger meter, nothing perishes.
8. **Never a chore** (Fantasy Life's Auto Mode, Cook, Serve, Delicious's parallel clock):
   - Long steps (a simmer, a ferment, a proof, a bake) run on the game clock while you do other things.
   - A mastered dish can be batched, up to ten.
   - **Auto-cook is a knack**, earned by true cooks of that dish, at one grade below your best.

## 3. Where you cook

- **The hearth in the Spirit Garden.** A plain cooking station beside the Athanor, a feature the hand places. The garden is cozy, and
  the press is a few steps away, which is where a draught is spent.
- **A portable clay pot later** (Tears of the Kingdom's), for cooking at a Shrine.
- **The pot is a part you chose.** It is made and glazed at the kiln (a sink), and its wall decides its heat:
  - a thick wall answers the dial late and holds steady, so its bands are wider and slower;
  - a thin one is quick and narrow.
  - That is how real clay pots behave (a donabe is even and slow, heavier is steadier) and it is base change bad, modifiers good.
- **A new pot must be seasoned with rice porridge before its first use**, as a real donabe is (medome: rice at about a fifth of the
  water, an hour's simmer, cooled overnight). It is a slow, nearly free ritual and a natural first-hour step. It is called "medome" or
  "sealing the pot", never "seasoning" (section 10).
- **Never thermal shock.** A hot pot set down cold cracks (tagines and donabes do). A cracked pot goes back to the kiln.

## 4. The moves (one real technique each, its heart, its tell)

Each move is one gesture, chosen so no two moves feel the same. The research's main complaint about Fantasy Life i was copy-paste
minigames. Every gesture is touch-first: a thumb with a wide good zone.

| move | the real process (research B) | gesture | heart and band | tell | trade-off |
|---|---|---|---|---|---|
| **cut** | knife cuts by size: brunoise 3 mm, small dice 5 mm, julienne 3 x 3 x 30-50 mm, chiffonade 4-10 mm | strokes across, in time | the target size | the pieces as they fall | a finer cut cooks faster, a coarser one keeps bite |
| **sear** | Maillard 140-165 C; water holds a surface at 100 C, so dry it first | hold, then lift | lift in the brown, before black | the sizzle quietens as the surface dries; the colour | harder is more flavour and more risk |
| **simmer** (dashi) | kombu goes bitter if boiled; take it out at the first steam (about 60-80 C); katsuobushi steeps 3 min off the heat | do nothing correctly: keep the dial down | under the boil | the first wisp of steam; a bubble is too far | a longer steep is deeper and more bitter |
| **sugar** | the stages by the cold-water test: soft ball 112-116 C, hard crack 146-154 C, burnt 177 C | drop a spoon in water to read it | the asked stage | the drop in the water: thread, ball, crack | a harder stage keeps longer and is less tender |
| **roux** | equal flour and fat by weight, cooked white, blond, brown, dark; a chocolate roux has a quarter of white's thickening | stir, and stop | the asked colour | the colour; a scorched smell is too far | darker is more flavour and less body |
| **emulsion** | oil into yolk slowly; hollandaise butter at 60-63 C, eggs curdle at 71-76 C; rescue with a fresh yolk and a spoon of water | pour rate against whisk rate (a drag against a ring) | a pour the whisk can take | glossy and thick; split and greasy | the one rhythm move; a rescue costs a yolk |
| **rice** | wash until the water runs almost clear; soak 20-30 min; water 1 : 1.1-1.2 | rinse, pour off, until clear; then the ratio | clear water; the line on the pot | the rinse water's cloudiness | none: rice is the honest move |
| **knead** | the windowpane test: stretched thin, light through it without a tear | fold and push in a rhythm | the windowpane | a stretched piece against the light | over-kneaded is tight |
| **proof** | bulk proof warm, about 21-23 C over hours; too warm races to overproof | patience on the game clock | the dough doubled | it springs back slowly when pressed | longer is more flavour, risks collapse |
| **ferment** | koji (Aspergillus oryzae) at about 30 C for about 48 h; it heats itself; harvest before it spores | tend a thermostat, now and then, on the game clock | about 30 C, never 36 | its smell and its white bloom | longer is deeper and sweeter, less bite |
| **steep** (tea) | green 70-80 C for 1-3 min, oolong 85-95 C, black near boiling 3-5 min | wait for the water's own tell, then pour | the leaf's band | the bubbles ("shrimp eyes", "crab eyes", "fish eyes") | hotter is stronger and more bitter |
| **smoke** | cold smoking under 30 C (never past 43 C, so the fish does not cook); hot smoking 52-93 C | keep the fire low and fed | the asked band | the smoke's colour: thin blue good, white heavy bad | longer is stronger and drier |
| **bleed** (ikejime) | a fish spiked, its spine wired and bled stays out of rigor for hours and tastes cleaner | two calm presses, at the fish's stillness | the stillness | the fish going still | a better fish, a slower catch |
| **serve** | setting it out | one placing gesture | none: a look, never a power | none | none |

Fourteen moves. A dish uses two to four of them, from its family (section 5).

## 5. The dishes (families and first dishes)

A dish is a short list of moves and its ingredients. Families keep the moves from repeating in a row:

- **Bread** (knead, proof, the oven): the first dish. The kiln's bread, the clay world's own. Bread scoring and steam give oven spring
  in the first ten minutes.
- **Rice** in a donabe (rice, simmer): the second. It seals the new pot's lesson.
- **Broth** (simmer, steep): dashi first. Umami's dish (section 6).
- **Sear** (cut, sear, serve): fish from the Weir, bled or not.
- **Sauce** (roux or emulsion, simmer): the mother sauces as five dishes to find.
- **Sweet** (sugar): candy by its stage. Desire's dish.
- **Ferment** (ferment): koji from the mycelium's koji bed (MYCELIUM.md 3). Its long clock is the game's.
- **Tea** (steep): the quickest dish. A leaf's band is a swatch ring.
- **Smoke** (smoke): fish and the Wells' haul.

**Recipes are found three ways**, and never by blind failure (Rune Factory's hidden gates are the pitfall):
- **By experiment.** The pot recognises a combination and keeps it (Breath of the Wild's compendium, Tears of the Kingdom's recipe
  log). The Codex keeps every one from the start: the wiki problem is refused.
- **By tasting.** A dish one of the folk or a spirit gives you teaches its recipe (Final Fantasy XV's Ignis).
- **By repair.** A recipe handed over with lines missing, where the order of moves is the puzzle (Venba). It comes on a cracked clay
  slab, called a recipe slab, never an ostracon.

## 6. Flavour and feeling (ruled by South, 2026-11-01)

Each ingredient adds to a taste vector. The dish's **dominant** taste picks its feeling. Its **balance** sets the grade, as Salt Fat
Acid Heat teaches: a dish with one loud flavour and nothing to answer it is flat or harsh.

South's rulings shaped the map:
- "Mirth and Wonder are positive feelings, why would they be associated with bitter? Bitter is like, poison."
- "Fury is chili, spicy is mad, steaming."

So a feeling's taste is what it feels like to eat. The pleasant feelings get the pleasant tastes. Bitter, the body's poison alarm, is
Gall's alone.

The map leaves the garden's Wu Xing pairing where the two disagree. That pairing (SPIRIT-GARDEN.md) still holds for the garden's
planting; it is not the kitchen's.

| feeling | taste | ingredients | what it teaches |
|---|---|---|---|
| Wonder | cool and fizzy | mint, citrus zest, a sparkling spring | cooling is a real sensation (TRPM8, menthol's receptor), and so is a fizz's prickle: tastes that aren't tastes |
| Mirth | sweet | fruit, honey, candy, syrup | sweet is the body's "energy here" signal, the taste of a party |
| Desire | rich | butter, cream, oil, marrow | fat is a candidate sixth basic taste (oleogustus), the one a craving reaches for |
| Fury | chilli heat | chilli, mustard, ginger, pepper | capsaicin is pain, not taste (TRPV1), and you sweat and steam as if angry |
| Gall | bitter, and astringent | bile-bitter leaves, unripe fruit, over-steeped tea | bitter is the body's poison alarm (about 25 receptors for it); astringency warns off the unripe |
| Grief | salt, and the onion's tears | salt, brine, onion, leek, horseradish | tears are salt water, and an onion's tear compound is literally the lachrymatory factor |
| Dread | sour | vinegar, ferments on the turn, sour milk | sour is the body's spoilage warning: the taste that says "this may have gone" |

Dread's sour is the warning, not the kitchen's whole sour: a squeeze of acid at the taste-and-adjust (section 8) is balance, not Dread.
A dish turns toward Dread only when sour dominates it.

Three tastes are not feelings:
- **Umami** sets how long the draught holds. Dashi's kombu and katsuobushi together multiply it, the real synergy Ikeda found in 1907.
- **Kokumi** (body, from ferments: soy, miso) sets its strength.
- **Salt as seasoning** at the last move lifts every taste. It counts toward Grief only when it dominates.

## 7. What a dish gives

- **A held draught**, one at a time (Stardew's one food buff: eating another replaces it):
  - its feeling: the dish's dominant taste;
  - its strength: the grade, times kokumi;
  - its hold: the grade, times umami.
  - It feeds the press through the existing `draughtPull`: each material pressed is pulled a further 0.08 x the strength toward the
    feeling (SOUL-ALCHEMY.md 3.4).
  - It shows on the Lachrimeter and the Sight, as a draught already does (two avenues).
  - A draught today fades over a real minute. A cooked one holds longer by its grade (section 9's numbers).
- **Seasoning**, to the attributes whose skill cooking is, at most 10 a game hour from cooking, as every source (SOUL-ALCHEMY.md 6):
  - **Focus**: a move's band held (sustained attention).
  - **Dexterity**: a cut to its size (hand speed).
  - **Perception**: a taste read right before the last adjustment (anticipation).
  - So: cook well, a swatch widens, the press gets kinder. That is the loop South named.
- **Bonds.** A spirit's favourite dish raises its bond faster. Spirits already like one feeling's fruit and dislike the one that
  overcomes it (MYCELIUM.md 5). The folk have orders (Dave the Diver's sushi bar). A sibling at the pot adds half or a quarter of its
  skill (Fantasy Life i's buddies).
- **The grade:** four steps, Good, Great, Perfect, True. Each is a visible threshold on the dish's average, and True is a true cook. No
  999 cap (Atelier's).

## 8. The last move: taste and adjust

Every dish ends with up to two tastings, a spoon each, and one adjustment:
- a pinch of salt;
- a squeeze of acid;
- fat;
- heat.

The tasting reads the dish's balance in the dish's own tells (too flat, too sharp, too heavy), never as a number. A right adjustment
lifts the grade one step. This is Salt Fat Acid Heat's lesson, the one move every real cook makes. Reading the dish right is
Perception's seasoning.

## 9. The numbers (first guesses, to be priced in `scripts/economy.mjs`)

| thing | number | why |
|---|---|---|
| a move's length | 3 to 10 real s (patience moves on the game clock) | Cooking Mama's under 10 s |
| a move's band | its heart plus or minus a width; the width grows by practice to a ceiling | Soul Alchemy's swatch rule |
| the grade's steps | average of the moves at 0.6 Good, 0.75 Great, 0.9 Perfect; True a heart in every move | four visible steps |
| a draught's hold | 1 real minute (today's) x (1 + umami) x the grade's 1, 1.5, 2, 3 | a cooked draught outlasts a drunk one |
| a draught's strength | the grade's 0.4, 0.6, 0.8, 1, x (1 + kokumi x 0.25) | `draughtPull` x strength is the press's lever |
| batch | up to 10, once a dish is cooked True three times | Fantasy Life's batch after mastery |
| auto-cook | a knack, by True cooks of that dish; one grade below your best | assists are knacks |
| seasoning from cooking | at most 10 a game hour, shared across the three attributes | SOUL-ALCHEMY.md 6's cap |
| a pot | a kiln's firing price; thick or thin wall | a sink you choose |

**What it is worth.** A dish is not a faucet of cubes: it pays in draughts, seasoning and bonds. The economy check is that a draught's
lift to the press does not out-earn the press's own tiers. That is the same test as the graft's x1.62 (ECONOMY.md).

## 10. Words (glossary collisions to avoid)

Several words are already taken:
- **Seasoning** is Soul Alchemy's meter. Food is "salted" or "adjusted to taste".
- **Plate** is the Veritome's photograph. A dish is "served", never "plated".
- **Station** is the course's and the kiln's. Say "the cooking station".
- **Firing** is the kiln's and the press's. Cooking verbs are cook, simmer, bake.
- **Kiln** is the workshop's. A bread oven is "the oven".
- **Ostracon** is taken. A broken recipe comes on "a recipe slab".
- **Recipe** is also decor's and the caster shells'. Say "a dish's recipe".
- **Provision** is a material kind. A dish is not one unless ruled so.

Plain names throughout until South calls it settled: the cooking station, a dish, a move, the taste-and-adjust, a held draught.

## 11. Build order (when South says go)

1. **The rules** (Dovina, `progress/cooking/`): moves as data (heart, width, gesture, tell, trade-off), dishes, the grade, the taste
   vector and the flavour map, the draught it serves, seasoning. Plus `scripts/cooking.mjs`, which prices it against the aim.
2. **The station and the moves' runtime** (Petra): the hearth as a garden feature; each move a small minigame on the input layer; the
   game-clock moves; the draught laid as the existing one.
3. **The looks** (Calissa): the pots and their glazes, each move's tell drawn honestly (the syrup in the cold water, the roux's ramp,
   the rinse water, the steam), the served dish, the hearth.
4. **The sounds** (Wanda): the sizzle quietening as a surface dries, the boil's first bubble, the kettle's stages of bubbles, the whisk.
   Each tell has two avenues.
5. **The words** (Espada): dish names, recipe slabs, a folk's broken family recipe.
6. **Bread first, then rice, then broth.** Each family lands as its own round, and South plays each before the next.

## 12. Ruled (South, 2026-11-01)

1. **A dish is a held draught,** one at a time, feeding the press (section 7). South: "yes".
2. **Bitter is Gall's alone.** The pleasant feelings take the pleasant tastes (section 6).
3. **Fury is chilli.**
4. **The hearth is in the Spirit Garden.** South: "The Spirit garden is our facility hotspot where all the slice-of-life activities
   occur currently. Let's keep that trend." A portable pot comes later, if ever.
5. **A sibling at the pot comes later.** South is still making the avatars.

Open: none for South before the build. The seasoning sources (Focus, Dexterity, Perception) and the numbers in section 9 are Dovina's,
priced with `scripts/economy.mjs` when the rules are written.

## 13. Built (2026-11-01: South, "did spirit cooking ever get implemented along with custom minigame UI? If not please start working on it")

Bread, the first family, is playable at the hearth. Everything else in this plan is data waiting for its round.

| part | where | what it does |
|---|---|---|
| the flavour map | `progress/cooking/flavour.js` | `INGREDIENTS` (the pantry's six staples and nine add-ins, one a feeling plus kombu and miso), `tasteOf`, `leadOf` (the first 0.4 of salt is seasoning, not Grief), `balanceOf` (flat, heavy, sharp, one-note, balanced, each with its fix), `ADJUST` |
| the moves | `progress/cooking/moves.js` | all fourteen moves as data, plus **bake** (the oven: section 5 named it and section 4's table did not); knead, proof and bake are played. `widthOf` (practice widens, never moves the heart), `scoreOf`, `tellAt`, `practiceFrom` |
| the dishes | `progress/cooking/dishes.js` | `FAMILIES` (bread built; rice, broth and tea as data), `dishFor`, `GRADES`, `serve` (the draught: feeling, strength, hold) |
| what is kept | `progress/cooking/cooking.js` | practice, recipes and best grades, the proof on the game clock, the held draught (`fadeK`, asked by `courier/mind.js`) |
| the hearth | `world/garden/hearth.js` | a placeholder clay fire bowl on the Athanor's west shoulder (latitude 38, longitude 270); F opens the window |
| the window | `world/garden/kitchen.js` | choose an add-in; KNEAD (a beat every 0.75 s: on it builds three times as fast; STRETCH A PIECE reads the windowpane); PROOF (on the game clock, POKE IT reads the dent, LEAVE IT closes); BAKE (STEAM in the first quarter, KNOCK, TAKE IT OUT); TASTE and ADJUST; served |
| the log and the ledger | `feedback/tracking/cooking.js` | `cook.serve`, `cook.serve.<grade>`, `cook.dish.<id>`, `cook.true`, `cook.learn`, `cook.move.<move>`, `cook.hit.<move>`, hi `cook.grade` |
| achievements | `progress/cookingachievements.js` | The Hearth (the Spirit Garden's new sub): Bread and Water, Perfect Crumb, A True Loaf, Seven Loaves, Daily Bread |

Where the build differs from the plan, with the reason:

1. **A fifth grade, FAIR (0.3 to 0.6), below GOOD.** It serves a weak draught (strength 0.25, three quarters of a drink's hold), so a
   clumsy loaf still pays. That is the design law ("grind closes the gap"). DUBIOUS is kept for a ruined move or an average under 0.3.
2. **The draught's strength is also how loud its feeling is.** It is multiplied by the dominant taste over 0.8, an add-in's full
   measure, with a floor of 0.2. A plain loaf's starch is a whisper of Mirth (0.12 at GREAT), and a honey loaf is Mirth's full voice.
3. **Each move scores 0.6 to 1 inside its band, falling outside it to a floor of 0.15 while not ruined.** A move's heart is a third of
   its narrowest width.
4. **The add-ins come from creatures.** A creature of a feeling drops that feeling's add-in (`progress/creaturedrops.js`, below), so
   the weather decides what you can cook. The pantry's staples are free, so a dish can always be cooked.

Measured headless (2026-11-01): a honey loaf kneaded to 0.84, proofed to 0.5 and baked to 0.72 with steam, tasted one-note and given heat,
served PERFECT, holding Mirth at 0.83 for 120 real s; the mind's fade slowed to 0.415 while it held. Priced (`node scripts/cooking.mjs`): the largest lift any loaf gives one material at the press is 0.67 of a tier's step (a TRUE
loaf: 0.08 of the way toward its feeling, against a common material's own 0.3), so a dish leans the press and never buys a tier.
Still to come: the looks (Calissa's),
the sounds (Wanda's: the knead's thump on the beat, the oven, the knock), the words (Espada's: dish names, the tells), bonds with spirits,
the other families (batch and auto-cook: section 15).

## 14. Pasta, noodles and seafood on a 3D stage (South, 2026-11-02, by way of Calissa)

> "really beautify the Spirit Cooking module, It's effectively a whole minigame. Make it fully fleshed out minigame featuring the
> Godhand working the dough, in 3d. Use softbody physics for the doughy material. We can make the whole thing Pasta themed!
> Italian-Japanese cooking ... Spirit Pasta, Soul Noodles ... SOULSEAFOOD BECAUSE THEY FISH IN LACHRYMA"

**Who builds what.**
- **Calissa:** the stage, in her files. A 3D cooking stage opened at the hearth, where the god hand works a soft dough (a position-based
  soft body with plastic shape matching, so it keeps what you do to it).
- **Dovina:** the rules, in `progress/cooking/`. The stage plays them through `scoreOf`, `tellAt` and `serve`.
- **Espada:** the names and the lore.

**The new moves** (`MOVES`, each a real technique, each tell what a cook really reads):

| move | gesture | its value | its heart, and the tell there |
|---|---|---|---|
| roll | a pass a stroke | thinness, 1 torn | 0.72: you can see your hand through the sheet (a pasta machine's 7th of 9, about 0.8 mm) |
| laminate | a fold a press | folds over 8 (layers 2^folds) | 0.5, 4 folds: smooth as satin, square at the edges |
| cut | strokes | ribbon width against the asked | 0.5: even ribbons, a finger wide (tagliatelle, about 6 mm) |
| pull | a doubling a pull | doublings over 8 (strands 2^pulls) | 0.75: 64 strands, thin as string |
| boil | held | doneness by the bite | 0.78: a thin white thread at the heart, **l'anima** (Italian for "the soul": the al dente core) |
| sear | held | Maillard browning | 0.65: golden, and it lets go of the pan by itself |
| bleed | a press in the fish's rhythm | the moment between thrashes | 0.5: still. Ikejime: a calm end keeps the flesh sweet |

**The pull snaps on short gluten.** `pullOver(gluten)`: the knead's value sets where the pull snaps. A dough kneaded to the windowpane
takes all eight doublings; a dough kneaded to half snaps at six.

**The families** (`FAMILIES`, `stage: '3d'`). All four take a landed fish as their add-in.

| family | moves | base | a dish |
|---|---|---|---|
| pasta | knead, roll, cut, boil | flour, egg, salt | MISO TAGLIATELLE, or a fish's (PALE REGRET TAGLIATELLE) |
| sheets | knead, laminate, roll, boil | flour, egg, salt | LASAGNE |
| noodles | knead, pull, boil | flour, water, salt, kansui | the hand-pulled; KELP NOODLES |
| seafood | bleed, sear | salt, oil, and a fish (needed) | SEARED TIN MIRTH |

The Italian-Japanese way is wafu pasta: any family's add-in can be miso, kombu or a fish, alongside the creatures' add-ins.

**SOULSEAFOOD.** A fish landed at the Weir is an ingredient as it lies in the Box (`fish.<species>`).
- **Its feeling** is the one the species is drawn to most (`fishFeeling`: Pale Regret, Grief; Tin Mirth, Mirth).
- **Its taste** is that feeling's taste, with a fish's umami and body.
- **Umami's synergy:** kombu or miso with a fish doubles the dish's umami, and with it the draught's hold. This is dashi's real
  chemistry: glutamate and inosinate together (Ikeda; Yamaguchi, 1967).

Angling now feeds the hearth: a reason to fish for a feeling.

**New pantry staples:** egg, for fresh pasta; kansui, alkaline water that makes noodles springy and yellow.

**The ledger and achievements:** `cook.family.<family>`. **Al Dente** (`cook.hit.boil`) and **Soul Seafood** (`cook.family.seafood`).

## 15. Batch and auto-cook (built 2026-11-02, G228)

The two conveniences a dish earns once the hand knows it (section 2.8). The rules are `progress/cooking/batch.js`; the hearth's window
plays them through a small marked hook (`world/garden/kitchen.js`, "G228 hook"). Neither is ever a better dish than the hand's.

| thing | the rule | why |
|---|---|---|
| batch | up to 10 of one dish, opened for that dish by 3 TRUE cooks of it (`cook.true.<dish>`) | a dish mastered, not lucked; Fantasy Life's batch, Atelier's yield |
| its grade | the one cook you played: every serving is that grade | it is a hand cook, so it can only equal one |
| its cost | the add-in times n (n fish for a fish dish); the pantry free | OSRS's make-X: n of a thing costs n of what it is made of |
| its servings | one served at once (its draught laid); the rest into the Pneuka Box as `dish.<dish>.<grade>`, ten to a slot | a whole batch's rest fits one slot |
| the draught | never stacks: eating a serving replaces the draught held, a drink's or a dish's | Stardew's one buff (section 7) |
| on the ledger | one cook: one `cook.serve`, one `cook.true` at most, whatever n; `cook.batch`, `cook.batch.servings`, hi `cook.batch.size`, `cook.eat` | batching never grinds a count or an achievement faster |
| auto-cook | a knack (`autoCook`): the dish with no minigame, at one grade below your best for it (hi `cook.best.<dish>`), never above PERFECT, never DUBIOUS | the plan's line; Monster Hunter's auto gives the plain steak |
| auto per dish | opened by 5 cooks of it (`cook.dish.<dish>`) or one TRUE of it | a count way and a feat way (DESIGN.md 22) |
| an auto cook | takes the add-in; instant (the proof's game hour skipped); no practice, no seasoning; may be batched where the batch is open; counts `cook.serve` and `cook.auto` | the hand did not cook, so the hand's attributes are not seasoned |

A serving carries its dish and grade in its id; its draught is worked out again when eaten (`serveAt`: the dish's base and add-in at that
grade, no adjustment, since the adjustment's lift is already in the grade). The other families (rice, broth, tea) and their long steps
on the game clock are still to come; the batch and auto-cook are family-blind.

Achievement: **Ten at Once** (hi `cook.batch.size` 10).


## 16. The other families, played in the window (built 2026-11-03, G222 to G225, G229)

South, 2026-11-03: "build any outstanding unbuilt features". Rice, broth and tea (G222 to G224), the other moves played with the sear, sauce,
emulsion, sweet, ferment and smoke families (G225), and recipes found by tasting and repair (G229) are playable in the hearth's window, in
plain placeholder drawing. Rules in `progress/cooking/`; the window's side in `world/garden/kitchenfamily.js` (kitchen.js hooks it: a
family row on the choose page, `begin` handing on, `finish` stepping to the family's next move). Proved headless by `node scripts/cookingfamilies.mjs`.

**The plays** (`progress/cooking/plays.js`, pure: the window only draws them and wires buttons, so a script can cook a dish). One gesture each:

| move | gesture | what you do | ruined by |
|---|---|---|---|
| simmer | dial (a range: a thumb drag) | the pot starts too hot (0.75): turn the dial to the heart (0.6) and hold it; the wall answers late; scored on the mean heat after a 3 s warm-up of 12 s | a boil (heat 0.8) for 1.5 s |
| rice | rinse taps, then a drag | RINSE until the water clears (heart 0.85), pour off, then drag the water to the line (1 : 1.15); 3/5 the rinse, 2/5 the line | never |
| steep | wait, then a tap | the water heats by itself with bubble tells (shrimp, crab, fish eyes); POUR at the leaf's heat | the boil |
| sugar | taps | the syrup climbs unseen; DROP A SPOON IN WATER reads its stage; TAKE IT OFF at the stage asked | burnt (0.95) |
| roux | taps | STIR or the bottom scorches at 2.2x; STOP at the colour | scorched |
| emulsion | a range and a tap rhythm | POUR (drag) against WHISK (taps): a pour past what the whisk takes (cap 0.1 + 1.1 x whisk) splits it; A FRESH YOLK rescues for 0.08 of the score | a full split |
| smoke | taps | FEED THE FIRE a little at a time, 14 s; thin blue smoke good | white smoke (fire 0.8) for 2 s |
| sear, cut, bleed | a tap; a range and taps; a tap on a beat | as the 3D moves' rules, now also in the window: sear lifts at the crust, cut draws a width and cuts at least 3 even ribbons (spread costs 2x), bleed presses in the fish's stillness | black; never; never |
| ferment | the game clock (`Cooking.long`) | set the warmth (cooler 0.6, steady 1, warmer 1.6 x 0.25 a game hour), leave, return, SMELL IT, TAKE IT OUT before 0.85 | sporing |

A move's heart moves with the leaf or the family where the real one does (`moveFor`): the broth's steep 0.4 (kombu out at the first wisp), a mint tea
0.45, a bitter leaf 0.7, honey candy 0.7 (the hard crack). `MOVES` itself is never changed.

**The families** (`FAMILIES`, all `built`): rice (rice, simmer), broth (simmer, steep; a fish is the katsuobushi and doubles the umami with kombu), tea (steep),
sear (cut, sear), sauce (roux, simmer), emulsion (emulsion, simmer), sweet (sugar), ferment (ferment), smoke (smoke); a fish may be the add-in of broth, sear and smoke. The
3D stage's seafood (bleed, sear) is also playable here, a fish needed. New pantry staples: sugar and tea leaf. Pasta, sheets and noodles (roll, laminate, pull, boil) stay on
Calissa's stage only. `serve` is not a scored move: the taste-and-adjust and the serve page are it.

**Recipes found** (`progress/cooking/recipes.js`, kept in `Cooking`):
- **By tasting:** `Cooking.receive(giver)` keeps the recipe of a dish a folk or a spirit gave (`GIFTS`: five placeholder givers); `cook.taste`.
- **By repair:** `SLABS` (six): a slab turns up at the hearth by a ledger predicate (`cook.checkSlabs`, never a flag); the window's RECIPE SLABS page shows each line hinted
  and blank lines you fill by tapping through the choices (the hidden moves and two decoys); MEND says how many fit, costs nothing, and a whole slab keeps the recipe (`cook.slab`).
- A recipe known gates nothing today (any combination can be cooked); it fills the list. A taught or mended dish is a known dish with no best and `via`.

**Ledger:** `cook.family.<family>` as before, `cook.taste`, `cook.taste.new`, `cook.slab.found`, `cook.slab.tried`, `cook.slab.mend`. Achievements: Every Pot, Taste and Learn, Whole Again.

**Left, and why:** nothing calls `receive` yet (the folk's lines that hand over a dish are Espada's: `docs/handoffs/espada/2026-11-03-from-dovina-cooking-gifts.md`); the long steps for the broth's
and rice's own waits on the game clock (only the ferment is); a sibling at the pot and bonds (G227); a pot's wall (thick or thin) as a modifier on the dial's lag; the rice's medome ritual.
Not priced: `scripts/cooking.mjs` still prices only the bread lifts; the new draughts use the same `dishDraught`, so the same ceiling holds.

### 16.x Rulings on the families (Dovina, 2026-11-03)
- **The emulsion's numbers stand.** The rescue's 0.08 a yolk, the split rate, the whisk cap and the 0.09 oil rate stay until South plays
  them. A careful hand passes; that is the bar.
- **A recipe slab's hints stay easy.** The first slabs teach the form: a move's own line hints its blank. A later slab may hint by its
  effect alone ("the water clears") once there are more than six.
- **A pantry-only dish lays no draught.** A grade, no feeling: the add-in is what gives a dish its feeling (section 1). Bread's starch
  whisper is bread's own and stays its own. The window saying so is the lesson.

### The named dishes (Espada, 2026-11-02; to be built as dish rows once a recipe gates something) (grain, feeling by its taste: SPIRIT-COOKING.md 6)

| dish (plain name) | grain | feeling | why (a real fact each) |
|---|---|---|---|
| cold soba with mint and shiso | buckwheat | Wonder (cool) | zaru soba is served cold; menthol reads as cold (TRPM8) |
| honey toast | wheat (shokupan) | Mirth (sweet) | Tokyo's café dessert: a hollowed loaf, buttered, honeyed |
| ramen carbonara | wheat (alkaline noodles) | Desire (rich) | egg yolk and fat emulsified off the heat, as Roman carbonara is |
| mentaiko spaghetti | wheat (pasta) | Fury (heat) | the first wafu pasta (Tokyo, 1960s), spicy cod roe |
| orecchiette with bitter greens | wheat (durum) | Gall (bitter) | Puglia's dish with cime di rapa, a bitter brassica |
| onion soup in a bread bowl | wheat (a round loaf) | Grief (salt, tears) | the onion's lachrymatory factor; salt is tears |
| squid-ink udon with sudachi | wheat (udon) | Dread (sour) | sudachi is a sour Japanese citrus; ink is the dark |
| pulled noodles in broth | wheat (lamian) | none (the add-in picks it) | the folds double the strands; umami holds the draught |
| the catch over rice | rice | the fish's own | kaisendon; the seafood course, its feeling the catch's |
| crazy-water fish | (bread to mop it) | the fish's own | aquapazza, Naples' fish poached in seawater |

The tells are Espada's words since 2026-11-03 (`progress/cooking/moves.js`), the pull's two moments and the fish's freshness (`FISH_TELLS`) beside them. No lore names on the dishes until South rules the module final.
