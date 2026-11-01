# Spirit Cooking: design research (for South, via Dovina)

Research note, 2026-11-01. Nothing in the repo was edited. Every mechanic and number below carries a URL. Where a page was only seen as a search-result summary (not opened), I say "(snippet)". Where sources disagree I give both. Where something is my own reasoning or background knowledge and not sourced, it is marked **(mine)**.

Plain names throughout (CLAUDE.md, "Plain names until settled"): station, pot, pan, dish, recipe, draught. No lore names proposed.

---

## 0. What the repo already gives Spirit Cooking to hang on

Read first: `CLAUDE.md`, `docs/GLOSSARY.md`, `docs/plans/SOUL-ALCHEMY.md`, `docs/plans/MYCELIUM.md`, `src/progress/econ/materials.js`.

- **The press is spatial.** Materials are a hue, a saturation and a winding path; pressing walks the soul colour a share of the way toward each (`materials.js` `makeMaterial`, `pullStep`, `press`; share 0.3 at tier 0 plus 0.12 a tier, `ECON.alchemy.pull`). Skill is colour sense: "the closer to the swatch's heart, the cheaper and the prouder the firing" (SOUL-ALCHEMY.md 2, 3.3).
- **The draught already feeds the press.** "While a draught lasts, each material pressed pulls a further `draughtPull` (0.08) x its strength toward the draught's feeling"; the draught fades over a real minute and is in the preview (SOUL-ALCHEMY.md 3.4; `alchemy.js` lines about `draughtPull`). Feeling hues come from `weather.js` `COLOR` (wonder 191, mirth 45, desire 16, grief 222, dread 135 in `FEELING_HUE`).
- **Skill skips grind; grind closes the gap** is already built as seasoning: `r = r_rank + (0.13 - r_rank) x seasoning / 100`, at most 10 a game hour from one source, spent by firing; a **true firing** is inside a quarter of the bare radius and seasoning never widens it (SOUL-ALCHEMY.md 3.2, 3.3). This is the template Spirit Cooking should copy for "temperature held in a band".
- **Seasoning is filled by doing an attribute's thing** (table in SOUL-ALCHEMY.md 6): Focus is "sustained attention" (a status built, a rhythm combo of 25, a fish landed); Dexterity is "hand speed"; Perception is "anticipation". Cooking is a natural new source for these (see D14).
- **The mycelium already supplies the fermentation verbs** (koji = ferment, +0.25 saturation, 8 game hours; rot; print; graft; dissolve) and refuses chores, decay, inventory bloat, the wiki problem and dominant choices (MYCELIUM.md 1, 3). Failed things are "comedy, cheaply fixed" (a botched graft you rot back). The World Mushroom is "the garden's universal sink" for what you do not want (MYCELIUM.md 4.1). A burnt dish belongs there.
- **The five feelings are already the five phases** (Espada, 2026-10-07): mirth fire, wonder wood, desire earth, grief metal, dread water; generating order wonder, mirth, desire, grief, dread; overcoming: wonder checks desire, desire checks dread, dread checks mirth, mirth checks grief, grief checks wonder (`docs/plans/SPIRIT-GARDEN.md`, "The five feelings are the five phases"). Gall ("bile: bitterness you can taste", LORE.md; "Acquired Taste" is Gall's knack name) and Fury (anger) are the two outside the five (GALL-AND-FURY.md; `weather.js` `VALENCE`, `OPPOSITE`: gall has no opposite).
- **The clay world is the setting.** The Courier is clay; the workshop has a kiln (MEND, FIRE) and pots; the Spirit Garden has the Herb Terraces (beds), the shed, the Athanor, the Chimney's climbing kiln. Fishing exists (fish have a feeling's Lachryma, `docs/plans/ANGLING.md`).

**Glossary collisions to avoid before anyone builds** (GLOSSARY.md rule 3 and the homonym table):
- **seasoning** is Soul Alchemy's 0..100 meter. Do not also call salting food "seasoning" in code, UI or log; say "salt a dish" or "adjust to taste".
- **plate** is the Veritome's one photograph. Do not call the serving step "plating" or the served dish "the plate"; say "serve" / "the dish set out".
- **station** is already the course station and the kiln station; always "cooking station".
- **firing** is Soul Alchemy's and the kiln's; cooking verbs are cook, simmer, bake. **Kiln** is the workshop's (the Heavenly Kiln is the other); a bread oven is "the oven".
- **ostracon** is a potsherd with one neuralese word (GLOSSARY section 5); do not reuse it for recipe fragments. **recipe** is already used for decor sets and caster shells; qualify "a dish's recipe".
- **provision** is a material kind (`KINDS.provision`, hue 120-180). A dish is not a provision unless Dovina rules it so.

---

## A. How cooking games play

### A1. Cooking Mama (DS 2006 onward)

- **Inputs and shape.** A compilation of minigames on the touch screen: chopping, slicing, flipping in pans, plating. "Each minigame usually lasts under 10 seconds." Chopping is quickly drawing parallel lines; frying is rhythm-style timing to add ingredients or adjust heat. A dish is one to about a dozen minigames. https://en.wikipedia.org/wiki/Cooking_Mama_(video_game)
- **Scoring.** The dish is rated at the end "based on the average result of its minigames"; bronze, silver or gold; the best medal per dish shows on the selection screen. 96 dishes; you start with a few and unlock more by mastering earlier ones. https://en.wikipedia.org/wiki/Cooking_Mama_(video_game)
- **Failure.** A serious mistake or running out of time is a failure, and an angry Mama appears with "Don't worry, Mama will fix it!" (same page). Failure costs the medal, not the dish; nothing is lost.
- **What skill means.** Gesture accuracy within a short window. One user review says gold needs a score of 100 (user opinion, snippet). https://www.gamespot.com/cooking-mama/user-reviews/2200-154443/
- **Reception and pitfalls.**
  - Mixed (Metacritic 67 on DS). https://en.wikipedia.org/wiki/Cooking_Mama_(video_game)
  - Input is the enemy: on Wii, motion controls were "not reliably responsive" and "less defined" than the DS (snippets). https://www.gamespot.com/wii/action/cookingmamacookoff/review.html and https://www.engadget.com/2007-04-02-cooking-mama-cook-off-highlights-wii-remote-issues.html
  - Repetition: "gets repetitive too quickly" (GamesRadar, snippet) https://gamesradar.com/cooking-mama-cook-off-review ; "mini-games get repetitive" (Nintendo World Report on World Kitchen, snippet) https://worthplaying.com/article/2008/12/10/reviews/57260-wii-review-cooking-mama-world-kitchen/ (search surfaced as part of the same result set).
  - The grading problem runs both ways: Cooking Mama 5's main mode grading was called "extremely generous", forgiving all but egregious errors, while the Dojo grades on time and accuracy (snippet). https://nintendolife.com/reviews/3ds/cooking_mama_5_bon_appetit . Touch input failing to register gave undeserved bronzes (snippet). https://www.nintendoworldreport.com/review/11902
- **Take for us:** the "average of short steps" and the "fix it" are the two reusable ideas. The input is a hazard on a phone (touch is a first-class platform here, MOBILE.md), so each gesture must tolerate a thumb.

### A2. Battle Chef Brigade (2017)

- **Loop.** Hunt monsters and gather in a short window, then cook in a match-three on a 4 x 4 grid; juggling several dishes at once is "chaotic and just challenging enough". Combat is "more of a race against the clock than a struggle"; side quests are "little more than diversions". https://www.destructoid.com/reviews/review-battle-chef-brigade/
- **Elemental flavours and judges.** Each cook-off has one to three judges, each with taste preferences, plus a theme ingredient. A dish needs the theme ingredient; matching judges' favoured tastes earns extra points. Gems upgrade by matching; a judge's taste bonus needs more level-3 gems of the required profile; some want two profiles tied, or a rainbow. Sauces convert gems to another element. https://battlechefbrigade.fandom.com/wiki/Food_properties (snippet; the page itself returned HTTP 402 to me) and https://www.magicgameworld.com/battle-chef-brigade-cooking-match-guide/ (opened: flavours named EARTH, FIRE, WATER, RAINBOW; two-flavour judges need both level-3 types tied for most in the dish).
- **Pitfall.** You choose your loadout before learning the judges' tastes, "which can make a first attempt frustrating" (snippet). https://www.destructoid.com/reviews/review-battle-chef-brigade/
- **Take for us:** a customer/judge with a taste is the cleanest way to give a dish a *target* (like a swatch). Tell the player the target first (Soul Alchemy's rule: shown before it is said, CLARITY.md); do not repeat BCB's blind loadout.

### A3. Fantasy Life (2012/2014) and Fantasy Life i (2025)

- **Original.** Five craft Lives including Cook. Every craft is three workspaces, each one of three inputs: **Mash A**, **Hold A**, **Time A** (press when the cursor is over the symbol). A completion gauge must reach 100% before a timer runs out; if it runs out the item fails and materials are returned. Quality (normal, Good, Great, Top; food and potions can be "Super") "depends on your skill level and speed". Recipes come automatically with rank-ups or from colleagues. https://www.gamerguides.com/fantasy-life/intro-and-gameplay/exploring-reveria/crafting-your-future
- **Auto Mode and bulk.** Pressing Y has the character do the actions: "Auto Mode items are lower quality, and experience drops sharply"; quality improves after enough crafts unlock Auto Mode+. Once familiar with an item you can craft up to 10 at once, "less experience". Same page.
- **Fantasy Life i.** Each craft has a set number of turns, each turn three activities with a depleting timer; faster completion fills the gauge toward 100%; fewer turns to reach 100% raises quality; button once, hold (green), mash, or rotate a stick; two Buddies of the same Life add half and one-quarter of their crafting stat. https://www.gamerguides.com/fantasy-life-i-the-girl-who-steals-time/guide/getting-started/introduction/crafting-system-explained . Players say cooking and alchemy differ by stirring a pot with the left stick, and call the crafting "speed-based rather than precision-based" with grades Good, Great, Perfect. https://steamcommunity.com/app/2993780/discussions/0/596275749770557768 is the thread the search surfaced; the opened thread is https://steamcommunity.com/app/2993780/discussions/0/596276591945850009 (a Perfect gives a 150% material bonus, per one player; bulk crafting loses materials, per another; complaint: the series' repetitiveness persists). A Cook life challenge: craft without dropping below Great 10 times (snippet). https://nightlygamingbinge.com/the-cooks-story-questline-walkthrough-fantasy-life-i/
- **Take for us:** (1) three input types is a good minimum vocabulary (mash / hold / time), but the series is faulted as copy-pasted across crafts; (2) auto mode as a *lesser* quality, an earned unlock, is the working answer to busywork; (3) the Buddy 1/2 and 1/4 contribution is a ready model for a spirit at the pot (compare Soul Alchemy's `workBonus` / `press.extra()`).

### A4. Cook, Serve, Delicious! (2012)

- Up to eight prep stations run at once; you step through each order's steps as keyboard prompts; each meal is graded on how well it was cooked, missing steps or wrong ingredients lower grade and income; some meals need cooking time so you work other orders; between days you spend on menu, recipes, equipment. Serving too many unhealthy foods drives customers away; repeating dishes makes them less appealing. https://en.wikipedia.org/wiki/Cook,_Serve,_Delicious!
- Reception: "Dark Souls of cooking games" for difficulty; also "repetitive" (7.4/10). Same page.
- **Take:** the *parallel clock* (one thing cooks while you do another) is what makes CSD's skill. Cooking in our game has long passive stretches (simmer, ferment, bake) so the same trick is free: start the pot, go press at the Athanor.

### A5. Overcooked (2016)

- Stations (ingredients, prep, stove, serving, dishes) are generally separated so moving takes time; "the vast majority of its challenge comes from its level design" (PC Gamer, snippet). https://pcgamer.com/overcooked-review ; developer account: simple controls on purpose because teaching four players at once is hard, shared real-world cooking knowledge helps entry (snippet). https://gamedeveloper.com/design/road-to-the-igf-ghost-town-games-i-overcooked-i-
- Orders have a short window; wrong orders earn nothing; bonuses for speed; three-star ranks by coins; lives were replaced with a scoring system "to reduce pressure"; icons show task status so no one has to remember what others did. https://en.wikipedia.org/wiki/Overcooked
- Pitfalls: solo play is weaker (you control two chefs and chopping takes longer, snippet) https://pcgamer.com/overcooked-review ; Switch frame rate below 30 fps (Wikipedia, same page).
- **Take:** state is shown on the thing (icons on stations, the overlay reads what is). Cooking is the one module here that can be co-op for free: the siblings are cooks (Fantasy Life i's Buddies are the same idea).

### A6. Breath of the Wild / Tears of the Kingdom: cooking by throwing things in a pot

Opened page: https://zeldawiki.wiki/wiki/Cooking_in_Breath_of_the_Wild and https://zeldawiki.wiki/wiki/Cooking_in_Tears_of_the_Kingdom

- Up to five materials into a lit pot. Meals: fruit, mushroom, vegetable, meat, seafood plus supplements; elixirs need a critter and a monster part. Failed mixes become **Dubious Food** (restores at least one heart, no added effects) or **Rock-Hard Food** (a quarter heart; takes precedence; sells for 2 rupees in TotK).
- **Effects by ingredient:** each added-effect material gives points (stars) toward its effect; thresholds raise the level; "mixing materials from different effect types removes all added effects". Duration: neutral materials add full duration once per unique material, duplicates only 0:30; monster parts add duration only (low 1:10, mid 1:50, high 3:10); in TotK Dragon Horn 30:00.
- **Potency:** cooking doubles life recovery of raw-edible items; roasting adds half.
- **Critical cook:** base 5% per unique material, only the highest chance counts, caps at 100%, one bonus a dish; 100% for dragon parts and star fragments; 30% for cane sugar and high-grade monster parts; 10% for bird egg, goat butter, goron spice, mid-grade parts; no crit with Monster Extract or a failed dish; bonus is extra hearts, +5:00 duration, or one effect level; cooking between 11:30 and 12:15 on a Blood Moon night guarantees one.
- TotK sell price = sum of material prices times 1.2 / 1.3 / 1.4 / 1.6 / 1.8 for one to five ingredients.
- **Recipe discovery.** No recipe book in BotW; the game recognises recipes by combination and records them in the compendium; TotK added a **recipe log** that stores successful attempts and a "cook from recipe" option listing recipes made with an ingredient, because finding recipes was a chore (snippets). https://www.nintendolife.com/news/2023/04/it-looks-like-cooking-recipes-are-a-thing-in-zelda-tears-of-the-kingdom and https://press-start.com.au/news/nintendo/2023/05/08/zelda-tears-of-the-kingdom-will-include-two-handy-features-to-make-cooking-easier/ . Portable Pots in TotK let Link cook anywhere (Zelda Wiki TotK page above).
- **Pitfalls:** the critical is dice, and the only way to raise it is to spend a rare material (a 100% dragon part on a cheap dish); sources disagree on the base crit rate (5% vs 10% across sites, snippet) https://www.zeldadungeon.net/wiki/Spicy ; "cooking can sometimes be tedious" is the stated reason for the log (snippet).
- **Take for us:** the *experiment-and-the-world-remembers* discovery loop; a mixed-effect penalty that forces a decision; durations that stack with diminishing returns for repeats. Do not copy the crit die: make "critical" a skill state (D5).

### A7. Monster Hunter World: the BBQ spit and the canteen

- Roast raw meat on the spit: pull it off just after the tune plays for well-done; too early gives rare steak; too late, burnt; well-done gives a stamina boost over rations. https://www.gamespew.com/2018/01/how-to-cook-well-done-steak-in-monster-hunter-world/ (snippet; "watch the colour of the meat and use the tune"). In Rise, counting ~4 full turns of the spit works (snippet, a different game).
- The canteen at camp handles full meals; the portable grill only does steaks (snippet). https://www.gamerguides.com/monster-hunter-world/guide/walkthrough/astera-and-the-ancient-forest/rebuild-the-ancient-forest-camp . I could not find the meal-buff list in this pass.
- **Take:** the *tune* is the timing window, audible and visual at once: two avenues for the same state (CLAUDE.md: "every number that matters has two avenues or more"). It is also the cleanest "do nothing correctly" minigame: the skill is the early lift.

### A8. Final Fantasy XV: Ignis

- At a haven you choose which dish Ignis cooks from recipes he knows, limited by ingredients carried; dishes give different buffs; recipes are learned from cooking, eating at restaurants, gathering, and reading material (flyers); a starred food unlocks a recipe for Ignis when eaten; a party member's favourite doubles the tech-bar fill rate; sources disagree on the count (46 recipes from 53 ingredients vs 103 learnable). https://www.windowscentral.com/final-fantasy-xv-food-guide-eos-delicious , https://samurai-gamers.com/final-fantasy-15-ffxv/cooking-skill-guide-final-fantasy-15-ffxv/ , https://www.gamerguides.com/final-fantasy-xv/guide/the-basics/skills/cooking (all snippets; none mention photos, so I could not confirm the photo-learning detail you asked about).
- **Take:** *learn a dish by eating it somewhere*, and "a favourite food" as a modifier. The cook is a character (a sibling or a spirit), not a minigame.

### A9. Stardew Valley

- Most of 81 recipes (1.6) come from the Queen of Sauce TV show (Sundays), friendship hearts, skill levels, purchase; reading a cookbook teaches immediately. Food restores energy and health and can carry buffs; **only one food's buffs at a time**, eating a food with buffs wipes the old; drink buffs stack with food; quality of ingredients does not affect the product. https://stardewvalleywiki.com/Recipes and https://stardewvalleywiki.com/Food (snippet; the sources conflict on some per-recipe numbers).
- **Take:** one-active-buff keeps a dish a modifier and not a stack (design law: base change bad, modifiers good). The "ingredient quality does not matter" is the thing to *not* copy if ingredients carry colour.

### A10. Atelier (Ryza 2/3 as the current form)

- Synthesis: choose a recipe, fill material loops, each material has elements, an Elemental value, quality and traits; up to 3 traits carry into the item; a trait only activates after its loop is levelled; quantity cap per material; "Auto-Add Materials" picks high or low quality for you. Element value changes with the quality and traits of what you add. https://www.koeitecmoamerica.com/manual/ryza2/en/4200.html . In Ryza 2 the grid is node-based: adding more of an element unlocks new effect slots (snippet). https://progameguides.com/guides/synthesis-guide-in-atelier-ryza-2/
- **Pitfalls:** the 999 quality cap is called trivially reachable with Duplication and "inflated" by some, defended by others (snippet); "So many vague traits" is a thread title. https://steamcommunity.com/app/1999770/discussions/0/3807281160967405827 and https://www.thegamer.com/atelier-ryza-3-alchemist-of-the-end-and-the-secret-key-best-core-items-guide/
- **Take:** Atelier is the closest prior art to Soul Alchemy already; Spirit Cooking should not be a second element grid. See the "complementary craft" argument in D1.

### A11. Potion Craft (2021)

- Crafting plots a course on a map; the ingredient sets the direction; grinding in a mortar changes how far; mixing in the cauldron changes how far; closer alignment to an effect's location, the stronger the potion. https://en.wikipedia.org/wiki/Potion_Craft . Water moves you backward; heating coals; "if the cauldron runs too hot for too long, the water turns red and quality degrades"; over-stirring wastes time (snippet). https://www.switchbladegaming.com/cozy-games/potion-craft-guide/
- Player voice: a 2021 Steam thread asked for an auto-stir; one player says stirring is "a precision task and part of the fun"; a "one-click full grind" was proposed as a middle road (snippet). https://steamcommunity.com/app/1210320/discussions/0/3102392990146116631
- **Take:** Soul Alchemy already *is* this map. The lesson is the physical pair (grind, heat) are the hand skills in a map game. Spirit Cooking should own those hand skills, so the two crafts feed each other (D1).

### A12. Venba (2023)

- Each dish is a puzzle from a damaged family cookbook; smudged lines and eventually pages with only diagrams; you reconstruct steps by reading around the gap and by Venba's memories; it is about *order of steps*; trial and error; replay by cooking past dishes without mistakes; very short (Destructoid 7/10 "all so brief"). https://en.wikipedia.org/wiki/Venba_(video_game) ; Polygon's description via https://www.shacknews.com/article/134708/venba-preview-gdc-2023 (snippet).
- **Take:** a recipe you are *given incomplete* (by a folk member or a spirit) is a great discovery mode: it respects "every system teaches something real without saying so" (you learn that order matters: sear before sauce).

### A13. Others, briefly

- **Cooking Simulator.** Physics for everything; 80+ recipes, 140+ ingredients; mixed reception, cons listed as difficult controls, repetitiveness, lack of difficulty levels, physics bugs; knife cutting is "a real lack of precision". https://en.wikipedia.org/wiki/Cooking_Simulator (and snippets via opencritic). **Lesson:** physical realism in the input is not the same as fidelity in the *rule*; keep the rule honest and the input forgiving.
- **Like a Dragon: Ishin.** Cooking is a timed-button chop; recipes rated 1 to 5 stars by difficulty; finished dishes go to customers and give virtue and reputation. https://primagames.com/gaming/how-does-the-cooking-mini-game-work-in-like-a-dragon-ishin
- **Dave the Diver.** The restaurant half runs on the day cycle; good service raises reputation, which unlocks recipes and upgrades; VIP guests request specific ingredients. https://en.wikipedia.org/wiki/Dave_the_Diver . Complaint: "enough complexity... that I put it down because I didn't want to think too hard", and "poorly explained" elements (snippets). https://www.gamingonlinux.com/2023/07/dave-the-diver-is-a-big-beautiful-blue-gem/comment_id=246806 and https://www.destructoid.com/review-dave-the-diver/ . **Lesson:** the diving half funds the cooking half; cooking should be the sink of the fishing and the Wells, not a separate economy.
- **Rune Factory 4.** Recipes learned by experimenting at the stove; cooking a recipe 10+ levels above your cooking level always fails; no cookbook means you cannot know the level, "cooking up failures using completely valid recipes"; dishes last 30 to 240 minutes (snippets). https://progameguides.com/rune-factory/rune-factory-4-cooking-guide-best-dishes-for-dungeons/ . **Pitfall:** hidden gating that wastes materials. Our version must never fail silently.
- **Ooblets.** Recipes start, are bought with Wishies, or assembled from four **recipe pieces** into a random full recipe (no duplicates). https://www.thegamer.com/ooblets-unlock-recipe-guide/ and https://commonsensegamer.com/ooblets-recipe-pieces-guide-how-to-use/
- **Spiritfarer.** The kitchen takes up to five of an item; basic kitchen: one ingredient, upgrade: two; recipes hidden until found in a chest or cooked; a timer; leave it too long and it burns and is inedible; dishes fed to spirits improve mood and stop hunger. https://spiritfarer.fandom.com/wiki/Kitchen and https://guidestrats.com/spiritfarer-kitchen/ . **Take:** the closest game to our Spirit Garden's relation to spirits (garden spirits "like" feelings; MYCELIUM.md 5).
- **Sakuna: Of Rice and Ruin.** Meals give temporary stat buffs for the next day; rice quality drives both combat power and food quality; you sort grain in salted or muddy water (heavier water floats the good grain); you choose how far to polish: white rice for growth, brown for food buffs (a trade-off, not a ladder). https://en.wikipedia.org/wiki/Sakuna:_Of_Rice_and_Ruin ; https://pcgamer.com/sakuna-rice-guide-walkthrough-tips ; https://primagames.com/gaming/sakuna-of-rice-and-ruin-farming-guide . **Take:** polishing as a real trade (brown rice keeps the bran: more, rougher).
- **Disney Dreamlight Valley.** The star rating of a dish is its ingredient count, "not skill" (snippet). https://commonsensegamer.com/disney-dreamlight-valley-how-to-make-3-star-meals . **Pitfall:** stars that do not reward doing it well.
- **Order Up! / Ratatouille.** Wii Order Up! is speed and multitasking; "cooking for the same motley assortment can get old" (snippet). https://www.honestgamers.com/34012/wii/order-up/game.html . Ratatouille's cooking minigames were called "a bit lame", DDR-style button mashing (snippet). https://gamesradar.com/ratatouille-12/2
- **Delicious in Dungeon** (manga, not a game). A party eats the dungeon's monsters because supplies are lost; the dungeon is treated as an ecology. https://en.wikipedia.org/wiki/Delicious_in_Dungeon . Right shape for a Well's haul as ingredients; I found no official game, and several results claiming one were spam.

### A14. What the pitfalls add up to (list for the brief)

1. Input that fails on the platform (Cooking Mama Wii/touch, Cooking Simulator knives).
2. Copy-paste minigames across crafts (Fantasy Life i).
3. Dice where skill should be (BotW crit, Ooblets recipe pieces).
4. Stars/grades that do not reward skill (Dreamlight Valley).
5. Hidden gates that waste materials (Rune Factory 4).
6. A blind choice before the target is known (Battle Chef Brigade loadout).
7. Cap inflation (Atelier 999).
8. Restaurant management that demands attention you did not budget (Dave the Diver complaints; Order Up repetition).
9. Chores that never end (Cooking Mama "repetitive", Dreamlight loop).

---

## B. Real cooking: the truths a minigame can be honest about

Confidence: **H** a standard or reference page; **M** consistent across reputable sources; **L** one blog or sources disagree.

### B1. Mise en place
French for putting everything in place: preparing and organising ingredients and equipment before cooking; tied to the brigade system, formalised and popularised by Escoffier (secondhand; dates in some sources are wrong). **M** https://online.jwu.edu/blog/what-is-mise-en-place-the-key-to-culinary-organization/ and https://guide.michelin.com/us/en/article/features/mise-en-place-cooking

### B2. Knife cuts (dimensions)
From the list page: brunoise about 3 mm cube (1/8 in); small dice (macedoine) about 5 mm (1/4 in); medium dice (Parmentier) about 13 mm (1/2 in); large dice (carre) about 20 mm (3/4 in); julienne 3 x 3 x 30-50 mm; batonnet about 6 x 6 x 50-60 mm; paysanne about 10 x 10 x 3 mm; tourne about 50 mm long, seven faces with a belly; chiffonade strips 4-10 mm wide. **H** https://en.wikipedia.org/wiki/List_of_culinary_knife_cuts . Rouxbe and others call 6 mm "small dice" and 12 mm "medium"; schools differ. **M** https://rouxbe.com/tips-techniques/495 . Brunoise is cut from julienne. **M** (same). A game should pick one school and say so; the *rule* (a brunoise is a finer julienne cut across) is what teaches.

### B3. Browning: Maillard vs caramelisation
- Maillard "typically proceeds rapidly from around 140 to 165 C (280 to 330 F)"; accelerated in alkaline conditions (pretzel lye); needs amino acids and sugars; caramelisation is a distinct pyrolysis of sugars, at higher temperatures. **H** https://en.wikipedia.org/wiki/Maillard_reaction
- Caramelisation temperatures (McGee): fructose 105 C, glucose 150 C, galactose 160 C, sucrose 170 C, maltose 180 C; impurities (molasses in brown sugar) speed it; rate slowest near pH 7. **H** https://en.wikipedia.org/wiki/Caramelization
- Water caps a surface at 100 C: a crust needs the surface above about 150 C, so surface water must go first (hence pat the steak dry). The Wikipedia mirror says "citation needed" for the figure; Serious Eats is cited generally. **L-M** https://en.wikipedia.org/wiki/Searing and https://www.tastingtable.com/845923/the-reason-you-should-pat-steak-dry-before-cooking-it
- Searing does not "seal in juices"; it adds flavour. **M** (same Searing page, snippet).
- Wok: the bottom of a wok "can exceed 750 degrees" over a gas burner (F); tossing mixes at that heat; the "breath of the wok" is browning reactions at the surface. **M** https://www.americastestkitchen.com/articles/2189-the-science-of-stir-frying-in-a-wok and https://thetakeout.com/til-perfect-fried-rice-is-all-about-wok-hei-the-breat-1845850792 . Culinary Lore argues it is plain Maillard plus caramelisation, no magic (**L**). https://culinarylore.com/food-science:wok-hei-is-not-magic/

### B4. Sugar stages (candy making)
| stage | C | sugar | cold-water test |
|---|---|---|---|
| thread (syrup) | 110-112 | 80% | a thread between thumb and finger |
| soft ball (fudge) | 112-116 | 85% | soft smooth lump |
| firm ball (soft caramel) | 118-120 | 87% | smooth lump |
| hard ball (nougat) | 121-130 | 90% | hard smooth lump |
| soft crack (taffy) | 132-143 | 95% | pliable threads |
| hard crack (toffee) | 146-154 | 99% | brittle threads |
| clear liquid | 160 | 100% | - |
| brown liquid / caramel | 170 | 100% | - |
| burnt | 177 | 100% | - |
**H** https://en.wikipedia.org/wiki/Candy_making . The teaching device is the *test*, not the thermometer: a spoon of syrup into cold water and what it does.

### B5. Roux and the five mother sauces
- Roux is equal parts flour and fat by weight; colours white, blond, brown, dark ("peanut-butter", "chocolate", "brick" just shy of burning); "the darker the roux, the less thickening power"; a chocolate roux has about one-fourth the thickening power by weight of white; dark roux for gumbo is often made with oil (higher smoke point). **H** https://en.wikipedia.org/wiki/Roux
- Times (blogs, wide): white 2-5 min; blond 5-10; brown 12-25; dark chocolate 30-60 (gumbo roux "35-60 min"). **L** https://laurenfromscratch.com/how-to-make-a-roux-light-to-dark/ and https://www.chowhound.com/2090758/how-long-to-cook-roux-for-gumbo . Color is the real endpoint, not the clock (same page).
- Five mother sauces (Escoffier added hollandaise and tomate to Carême's set): bechamel (milk, white roux), veloute (white stock, blond roux), espagnole (brown stock, brown roux), tomate, hollandaise (egg yolk and butter emulsion, no roux). **M** https://en.wikipedia.org/wiki/French_mother_sauces and snippet summary of thickeners.

### B6. Emulsions: mayonnaise, hollandaise, beurre blanc
- Hollandaise butter warmed to about 60-63 C (140-145 F) keeps yolks warm without cooking; eggs curdle around 71-76 C (160-170 F); too hot and too-fast butter are the common breaks; fix: a fresh yolk and a spoon of water over gentle heat, whisk the broken sauce in slowly; one ice cube if overheated; scrambled cannot be saved. **M** https://www.foodrepublic.com/1755791/how-fix-broken-hollandaise-sauce/ and https://wp.eatyourbooks.com/blog/2025/02/23/how-to-fix-a-broken-emulsion
- Oil added too quickly is the usual reason mayonnaise breaks; an intact emulsion can rescue a broken one (same pages). The beurre blanc temperature I was asked about did not appear in any source; omit it.

### B7. Deglazing, fond, reduction, nappe
Fond is the browned residue; add liquid to dissolve it, reduce by about half, until the sauce coats the back of a spoon; season after reducing; over-reduction turns syrupy and salty "within a minute". **M** https://food52.com/blog/9234-how-to-deglaze-a-pan and https://thetakeout.com/1735430/what-is-deglazing . Professionals often reduce by two-thirds (snippet, reluctantgourmet.com). Perfect for a "do not leave" step.

### B8. Doneness, resting, carryover
- USDA minimums: steaks, roasts, chops 145 F (63 C) with a 3-minute rest; ground red meat 160 F; all poultry 165 F (74 C). These are safety, not preference. **H** https://www.fsis.usda.gov/es/node/3293
- Doneness is preference: a meat guide pulls rare at 120-125 F and medium at 130-135 F, rests 10 min to finish at 140-145 F (secondary source, **L-M**). https://cheatsheets.davidveksler.com/meat-temperature-chart.html
- Carryover: temperature keeps rising after the heat is off; small steak 3-4 F up to 5+ F for a seared steak, larger masses more (5-10 F on a roast); resting's value is mostly temperature control rather than "redistributing juices" (Serious Eats, via Wikipedia). **M** https://en.wikipedia.org/wiki/Carryover_cooking and https://blog.thermoworks.com/give-your-meat-a-rest/

### B9. Brining and salt percentages
Wet brine strengths vary: Kenji's standard cited as 6% by weight (Food52 secondhand); ranges 3-8% for turkey; about 4.5% elsewhere. **L** https://food52.com/hotline/30094 and https://destination-bbq.com/brining-math-explained/ . Dry brine about 1% of meat weight (10 g per kg), several sources, no authoritative page opened. **L** (same). Lacto-fermentation: 2-3% salt by weight of vegetable (UC extension: 2-2.5% for sauerkraut), at 18-22 C, 2-3 weeks (sources 3-6 days to 3 weeks; weight lower-quality ones). **M** https://elavegan.com/how-to-make-sauerkraut/ and https://www.makesauerkraut.com/how-much-salt-use-to-make-sauerkraut . Miso salt rises with age: 4.5-6% for 2 weeks to 2 months, 10% for 6 months, 12% for 12, 16% for 24; ratio recipe 10:7:3 koji:beans:salt for 6 months; "by weight". **M** https://www.preservedgoods.com/amp/miso-recipe-formulas . Soy sauce mash about 17-19% salt, months to years. **M** https://itdi.dost.gov.ph/images/LivelihoodTechnologyBrochures/30-Soy_Sauce_Manufacture.pdf (snippet).

### B10. Dashi
- Kombu soaked or gently heated, "becomes bitter and unpalatable when boiled". **H** https://en.wikipedia.org/wiki/Dashi . Katsuobushi is high in sodium inosinate, kombu in glutamic acid; combined, synergistic umami. Same page.
- America's Test Kitchen method: cold-steep kombu 1-8 hours (longer goes slimy); heat slowly to 150 F until it steams, remove kombu; bring liquid to 200 F, take off heat, add katsuobushi, steep 3 minutes, strain; about 1 oz each per 4 cups; reuse for niban (milder). **M** https://www.americastestkitchen.com/articles/8034-how-to-make-dashi
- Gourmet Traveller: kombu dashi to 80 C, 30 g katsuobushi, 3 minutes. **M** https://www.gourmettraveller.com.au//recipes/explainers/dashi-18595/
- Taste history: Ikeda isolated umami from dashi in 1907 (the Wikipedia taste page; some sources 1908/1909). **H** https://en.wikipedia.org/wiki/Taste

### B11. Rice
Short-grain white rice: wash until the water is "almost clear" (Japanese emphasis is how clean, not how many washes; hard washing damages grain), soak 20-30 minutes (30+ in cold seasons), water 1 : 1.1-1.2 by volume at room temperature. **M** https://www.justonecookbook.com/how-to-cook-rice/ and https://www.tastingtable.com/1956363/japanese-rice-washing-method/ . In a donabe one chef used about 20% more water than rice with no soak, which contradicts the soak advice (**L**, contested). Same pages. The cloudiness of the rinse water is a free, real, *visual* saturation readout.

### B12. Clay-pot cooking (the game's own medium)
- **Donabe:** clay gives even heat; heavier pots retain heat better; cook on medium or lower; a new pot is porous and is sealed with **medome**, simmering rice porridge (rice about a fifth of the water, pot 70-80% full) over low heat 30-60 minutes, cooled overnight; never plunge a hot pot into cold water. **M** https://www.justonecookbook.com/how-to-season-your-donabe and https://minimaru.com/blogs/how-to/how-to-prepare-and-care-for-your-donabe-japanese-clay-pot
- **Tagine:** conical lid returns condensation; low-temperature simmering; soak the clay (one guide 6 hours) or bring up slowly in a cold oven to about 150 C for two hours; oven not above 160 C; thermal shock (hot pot on a cold surface, cold pot into a hot oven) cracks it. **M** https://www.souschef.co.uk/blogs/the-bureau-of-taste/how-to-cook-with-a-tagine and https://www.britannica.com/topic/tagine
- A tandoor's ~480 C did not come up in any source; omit the number.

### B13. Fermentation and koji
Koji (Aspergillus oryzae) grows at about 30 C and 70-90% humidity, ~48 hours; the grain heats itself (industrial practice lets it climb to ~38 C and cools it; keep below 36 C; a soy-sauce study found 30 C for 24 h then 25 C for 32 h best); harvest before it sporulates for max enzymes. **M** https://ovendriedtomatoes.com/koji-growing-the-mold/ ; https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2023.1139406/pdf ; https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4808419 (patent, snippet). "Koji can and will heat itself to death" (Reddit, snippet, **L**) is the best one-line rule for a minigame: it is a thermostat you tend, not a timer you wait out.

### B14. Bread
- Windowpane test: stretch a piece thin enough to see light through without tearing; a long-bulk dough "won't (and shouldn't)" pass at the kneading stage; bulk target 78-82 F in one guide, 21-23 C over 6-8 hours in another; above 82 F you race overproofing. **M** https://www.busbysbakery.com/the-windowpane-test/ and the freshloaf threads in the same search.
- Steam keeps the surface extensible in the first minutes (oven spring happens "primarily in the first ten minutes"), then venting lets the crust dry, firm and brown; scoring "prepares the loaf for the rapid expansion" and shapes the burst but does not cause the spring. **M** https://www.kingarthurbaking.com/blog/2017/02/28/steam-in-bread-baking and https://www.thefreshloaf.com/node/20359/why-need-properly-score . The specific 230 C / 450 F figure was not confirmed by these pages.

### B15. Chocolate tempering
Four-step tempering: heat to 40 C, cool to 32 C to start crystallisation, crystallise at 27 C, reheat to 29-31 C to melt unstable crystals. Six cocoa-butter forms; only Form V is glossy with snap (melts ~34 C, below body temperature 37 C). Seeding: grate set chocolate into liquid at ~30 C. The lip test is a physical tell. Bloom is the failure. **H** https://en.wikipedia.org/wiki/Tempered_chocolate . Your dark chocolate figures (melt 45-50 C, cool to 27-28 C, work 31-32 C) appeared only on a low-quality page; working temperature 31-32 C is consistent across sources, and one says hold within +/- 0.5 C because 1 C affects snap and gloss (**L**). https://tenina.com/chocolate/good-chocolate-tempering

### B16. Smoking
Cold smoking is customarily below 30 C and generally not above 43 C so the fish is not cooked; smoked salmon often cold-smoked at ~37 C (Wikipedia cited by a snippet); hot smoking ranges 52-93 C depending on source. **M-L** http://oc4h.ucanr.edu/sites/default/files/2020-09/335819.pdf (snippet) and https://www.sbs.com.au/food/article/cold-smoking-versus-hot-smoking-whats-the-difference/tnym5ekhz

### B17. Nixtamalisation
Corn cooked in alkaline water: calcium hydroxide 0.5-1.5% of corn weight (study uses 2%); steeped 1-2 hours to overnight until hulls loosen; rinse several times; niacin made bioavailable; calcium up almost ten-fold. **M** https://bakerpedia.com/processes/nixtamalization/ and https://masienda.com/blogs/learn/nixtamal-guide . A clay pot, lime from the ground: very on-theme for the Dunes' pottery culture (mine).

### B18. Ikejime (the game has fishing)
Spike the brain, wire the spinal cord, bleed: a thrashing fish burns ATP; once ATP is gone the muscle goes into rigor; spinal wiring delays rigor; bleeding slows spoilage and reduces the "fishy" taste; fish only bled enter rigor in four to ten hours; chilling too hard (near 0 C) paradoxically speeds rigor; 5-10 C is advised in one source. **M** https://cookingissues.com/2012/06/26/the-practical-philosophy-of-fish-killing-and-the-ike-jime-man/ and https://www.sushi-pedia.com/en/glossary/shinkeijime . Product page claims "up to 24 hours" are unverified. Note: killing a fish is something the log narrates plainly; a minigame is two quick, calm gestures, not gore.

### B19. Tea
Common ranges: green 70-80 C, 1-3 min (some 2-3); oolong 85-95 C, 3-5 min; black 95-100 C (or ~94 C), 3-5 min; white 75-85 C, 1-3 min (sources disagree, some 4-5). **M** https://artoftea.com/blogs/tea-101/recommended-steep-times and https://www.teabloom.com/blog/how-to-steep-tea-times-and-temperature/ . The numbers are a ladder of temperature bands: easy to turn into a swatch ring.

### B20. Salt Fat Acid Heat, tastes, kokumi
- Samin Nosrat: good cooking rests on four elements: salt (boosts flavour), fat (mouthfeel, texture), acid (brightens, balance), heat (texture and flavour via browning). Central theme is balance. **M** https://www.npr.org/transcripts/529977231 (interview; no quantities in sources).
- The five basic tastes and their signals: sweet = energy, salty = sodium, sour = acid (spoilage), bitter = toxins (about 25 TAS2R receptors, over 670 bitter compounds), umami = L-glutamate. Umami is boosted by inosinic and guanylic acid. Kokumi has no taste of its own; it enhances the others via calcium-sensing receptors ("mouthfulness"). Trigeminal sensations (not tastes): pungency (capsaicin, piperine, gingerol, allyl isothiocyanate via TRPV1 and TRPA1), coolness (menthol via TRPM8), astringency (tannins). **H** https://en.wikipedia.org/wiki/Taste
- Kokumi: CaSR agonists including gamma-glutamyl peptides enhanced taste intensity; kokumi enhances salty, sweet and umami intensities; found in soy sauce, fish sauce, miso, mirin; correlation of CaSR activity and kokumi intensity r = 0.81. **M** https://flavourjournal.biomedcentral.com/track/pdf/10.1186/2044-7248-4-11 and https://www.tastingtable.com/1841720/what-is-kokumi-sixth-taste/
- Capsaicin: binds TRPV1 on pain nerves; a pain/irritation, not a taste; pure capsaicin 16,000,000 Scoville. **H** https://en.wikipedia.org/wiki/Capsaicin
- Astringency: tannins bind salivary proteins; a tactile sensation (people still feel it with taste nerves numbed); tea, red wine, unripe persimmon; it "discourages eating unripe fruit". **H** https://en.wikipedia.org/wiki/Astringent
- Onion tears: syn-propanethial-S-oxide, formed by alliinase then lachrymatory-factor synthase; garlic has alliinase but is tear-free; a 2015 low-LFS onion made 7.5x less. **M** https://en.wikipedia.org/wiki/Syn-Propanethial-S-oxide

### B21. Plating (named "serving" here per the glossary)
No numbers needed; Cooking Mama and Dave the Diver both end on a placing gesture. Keep it a look, not a power (D13).

---

## C. Flavours and feelings

### C1. What the traditions and the research say

**Wu Xing (the tradition our garden already uses).** Wood: sour, anger, liver, spring. Fire: bitter, joy (frenzy), heart, summer. Earth: sweet, anxiety/planning (worry, pensiveness), spleen, late summer. Metal: pungent (and umami in this table), grief, lung, autumn. Water: salty, fear, kidney, winter. Generating: wood to fire to earth to metal to water to wood. Overcoming: wood grasps earth, earth contains water, water dampens fire, fire melts metal, metal chops wood. https://en.wikipedia.org/wiki/Wuxing_(Chinese_philosophy) (opened; the page's flavour-emotion pairs are inferred from column alignment, which it states). The organ-emotion pairings are confirmed independently: anger-liver, joy-heart, worry-spleen, sadness-lungs, fear-kidneys. https://www.newworldencyclopedia.org/entry/Wu_xing (snippet) and https://sbrc2017.ufpa.br/trip/meridians-five-elements-a2 (snippet). The flavour column is standard Neijing doctrine; the search results did not state the flavour-organ pairing outright, so I relied on the opened Wikipedia page.

**Ayurveda's six rasas.** Sweet, sour, salty, pungent, bitter, astringent; each taste affects doshas by aggravating or alleviating them. https://www.carakasamhitaonline.com/index.php/Rasa (snippet). Sivananda's page gives mental effects: sweet "cools hot-headedness, clears senses and emotions", in excess anxiety, fear, insomnia; bitter "diminishes cravings", in excess anxiety, fear, insomnia (reads as the first listed taste in the snippet; I cannot be sure which). https://articles.sivananda.org/?p=1194 . Rajasic foods spicy, salty, stimulating; tamasic stale, heavy (a wellness blog, **L**). https://www.hotelcaesiusterme.com/en/blog/balancing-body-and-mind-with-ayurveda

**Modern taste-emotion psychology.**
- Chan et al. (2013, Emotion): free association "love" to sweet (about 80%, 82 of 102), "jealousy" to sour (about 61%), "sadness" to bitter (about 49%); a 2020 replication gave about 84% sweet-love, 49% sour-jealousy, 75% bitter-sadness; people writing about love rated samples as sweeter, but jealousy primes did not make samples taste more sour or bitter. https://medicaldaily.com/sweet-kisses-bitter-tears-how-love-changes-way-we-taste-food-259690 and https://pmc.ncbi.nlm.nih.gov/articles/PMC7290244/table/T6 . Author list and details differ between sources (snippet).
- Bitter and moral disgust: bitter drinkers judged moral transgressions more harshly; the reverse also holds (reading moral transgressions evoked gustatory disgust, Eskine, Kacinik & Webster 2012). https://www.psychologicalscience.org/publications/observer/obsonline/meaningful-meals.html (snippet). Sweet and prosocial: Meier et al. 2012, later work mixed; one replication outcome not found. https://link.springer.com/article/10.1007/s12144-022-02710-1 (snippet).
- Comfort food as a social surrogate: Troisi and Gabriel 2011 (chicken soup, belonging; securely attached participants felt less lonely after writing about comfort food); a replication exists and I did not establish its result. https://www.psychologicalscience.org/news/releases/chicken-soup-for-the-soul-comfort-food-fights-loneliness.html
- Spicy food: liking correlates with sensation seeking and reward sensitivity (Byrnes and Hayes 2013), "chili-heads like the burn more, not just perceive it less"; the author cautions against calling all lovers risk-takers; a linked paper associates spicy liking with trait anger (not that capsaicin causes anger). https://pmc.ncbi.nlm.nih.gov/articles/PMC3607321/ and https://www.popsci.com/science/article/2012-12/love-spicy-food-built-your-personality/
- Acquired tastes: infants prefer sweet and reject bitter; liking for bitter (coffee, dark chocolate) is learned through repeated exposure (around 8 to 15 tries) and flavour-flavour pairing with sugar, fat, or caffeine's reward ("evaluative conditioning"). https://www.mentalfloss.com/food/how-do-you-acquire-taste and https://hhd.psu.edu/sites/default/files/media/nutrition/childrens-eating-lab/files/2014repeatedexposure.pdf (snippets).
- Anxiety and taste perception exists as a literature (PMC10668578, snippet); I did not read it.

**Not found:** sour's link to any emotion other than jealousy; the Japanese go-mi as a framework (the searches returned umami and kokumi but no go-mi page).

### C2. A mapping, with the reasoning

Rule I applied: the five native feelings follow the garden's canon (Wu Xing, Espada's ruling) because that is already taught, and the tradition's emotion for fire, metal and water matches ours directly (mirth/joy, grief/grief, dread/fear). The mismatches (wood = anger vs our Wonder; earth = worry vs our Desire) are flagged. Gall and Fury take the two sensations the tradition does not place and the research does.

| feeling | primary flavour | also | why (source) | tension |
|---|---|---|---|---|
| **Wonder** (wood) | sour | cooling (menthol, mint, citrus zest) | Wu Xing wood = sour; the hue 191 is cyan, and cooling is a real chemesthetic sensation (TRPM8) https://en.wikipedia.org/wiki/Taste | tradition's wood emotion is anger, ours is awe; sour-as-awe is a design reading (mine) |
| **Mirth** (fire) | bitter at low dose | roast, char, caramel brown | Wu Xing fire = bitter = joy; coffee, cocoa, hops are social, festive; bitter is learned into pleasure https://www.mentalfloss.com/food/how-do-you-acquire-taste | players expect Mirth = sweet; keep sweet for Desire; the "bittersweet" lesson is the real thing taught |
| **Desire** (earth) | sweet | fat, richness, honey | Wu Xing earth = sweet; Chan et al. love = sweet (80%+); sweet = energy-rich (Taste page) | tradition's earth emotion is worry/planning; "wanting" fits sweet better |
| **Grief** (metal) | pungent of the allium kind: onion, garlic, leek, horseradish | tears | Wu Xing metal = pungent = grief = lungs; onions literally make you cry (propanethial S-oxide) https://en.wikipedia.org/wiki/Syn-Propanethial-S-oxide | Chan et al. link sadness to bitter; resolved by giving bitter's high dose to Gall |
| **Dread** (water) | salty | brine, the sea, preserved things | Wu Xing water = salty = fear = kidneys; salt is also what keeps things from rotting (mine) | no psychology source for salt-fear; the tradition carries it |
| **Gall** (outside the five) | bitter at high dose and astringency | funky ferment, offal, unripe fruit | Eskine: bitter and moral disgust; the lore: "bitterness you can taste" and Acquired Taste; astringency discourages eating unripe fruit https://en.wikipedia.org/wiki/Astringent | same bitterness as Mirth: that is the point (below) |
| **Fury** (outside the five) | capsaicin heat | mustard, ginger, pepper burn | capsaicin is pain through TRPV1, "burn", sought by sensation seekers https://en.wikipedia.org/wiki/Capsaicin ; Wu Xing wood's anger is sour, so there is a counter-claim (see below) | pungent = metal in the tradition; I split pungent into tears (alliums) and burn (chilli) |

**Two decisions for South to rule** (Dovina's digest):
1. **One flavour, two feelings by dose.** Bitter is Mirth in a pinch and Gall in a heap. This teaches something true (bitter is the toxin alarm, humans have ~25 bitter receptors; learned pleasure in small doses: Taste page and the acquired-taste pages) and means Gall is never a "bad" ingredient, only an overdose: the ingredient itself stays a modifier. It is also the cleanest use of "base change bad, modifiers good": the dose is the modifier you can see.
2. **Fury: heat or sour?** Tradition puts anger with sour/wood; common speech puts it with heat. The chilli route is stronger for a game (a burn you feel on the way down), and sour is already Wonder's under our canon. If South prefers fidelity to the tradition, swap and put Wonder on something else (mint-cool).

**Non-feeling axes (do not map to a feeling).**
- **Umami = depth, the hold.** Dashi's synergy (kombu glutamate + katsuobushi inosinate) is a real multiplier; umami as the draught's *duration* (BotW makes duration the thing neutral and monster-part ingredients add). Kokumi (body) as intensity: "enhances the intensity of salty, sweet and umami" and arises in the fermented things the garden's koji bed makes. So: kokumi raises the draught's strength, umami lengthens it. Both are sourced above; the assignment to strength/duration is mine.
- **Fat** (Samin Nosrat): carrier and mouthfeel; could be the "carrier" that decides whether two feelings are felt at once (an agate: the stronger is what happens, the weaker its colour) (mine; agate rule in GLOSSARY section 2).
- **Astringency** doubles as a texture check, not a taste; keep it under Gall.
- **Six tastes**: Ayurveda's list includes astringent; it gives a six-slot "complete meal" idea (mine; the claim that Ayurveda advises all six in each meal is common but I did not verify it here).

---

## D. Synthesis: eighteen techniques for Spirit Cooking

Each: what it is, source, how it lands, the law it serves, and the risk. Dovina's to number, Petra's to build; none of this presumes a build.

**D1. Make cooking the hand-and-clock craft, so the press stays the eye's.** Soul Alchemy trains colour sense: *position* on a map (Potion Craft's marker). Cooking should train *time and temperature*: hold a value in a band, lift at the tune, stop stirring at the right colour. Atelier and Potion Craft are both map/grid crafts; a second map craft would be a re-skin. Source: Potion Craft (A11), Atelier (A10), SOUL-ALCHEMY.md 5 ("hue as an angle"). Law: every system teaches something real (this one teaches *process*: heat, time, order). Risk: none technical; keep the two crafts' UI distinct.

**D2. A dish is two to four short moves, graded as an average, with the weakest move never ruining the dish.** Cooking Mama: under 10 seconds a step, dish graded as the average, up to about a dozen steps; Fantasy Life i: three activities a turn. Keep to four. Source: A1, A3. Law: skill skips grind (a clean run is quick). Risk: repetition; see D10 and D12.

**D3. Skill is holding a value inside a band whose width is the Soul Alchemy swatch.** Temperature, stir rate, time-to-lift are each a value with a heart; the band narrows with the dish's difficulty (soft ball is 4 C wide, hard crack 8 C wide: sugar table B4; tempering holds +/- 0.5 C: B15); a "true" cook is the heart; practice widens the band toward a ceiling but never the heart: reuse `r = r_rank + (ceiling - r_rank) x practice / 100` and the true-firing rule (SOUL-ALCHEMY.md 3.2, 3.3). Source: SOUL-ALCHEMY.md; B4, B15. Law: skill skips grind, grind closes the gap (exactly). Risk: copying the maths is easy; copying the *feel* is not; decide whether the band is shown (a gauge) or felt (tune, steam, colour) and keep two avenues for it.

**D4. The cold-water test and the colour of the water are the interface, not a thermometer.** Candy making's stage names are defined by what the syrup does in cold water (thread, soft ball, hard crack); chocolate has the lip test; roux has colour ("brick" just shy of burning); rice has a clearing rinse; reduction has "coats the back of a spoon". Show *that*. A thermometer is a late-unlocked assist (a knack; Law: assists are knacks). Source: B4, B5, B7, B11, B15. Risk: tells must be readable at 896 x 414 on a phone; test the shots at full resolution (CLAUDE.md "Look at it as a human").

**D5. "Critical" is a skill state, never a die.** BotW rolls 5% per unique material and a 100% item is a rare material; Blood Moon guarantees one in a 45-minute window (A6). Replace: a *true* cook (heart of every band) earns the critical (one level up, longer hold), and a *time* bonus exists as a window the player can see and plan for (a golden-hour bake at dawn, a moonflower-night brew), sourced like the Blood Moon one. Source: A6; SOUL-ALCHEMY.md 3.3. Law: skill skips grind. Risk: if the time window gates the best dish it becomes a chore; make it a flourish (extra duration), never the only way.

**D6. Heat has lag; clay is the lesson.** Donabe heat is even and slow, heavier is steadier, medium or lower, never thermal shock (B12); tagine low-temperature, soaked, not above 160 C; carryover keeps cooking after you pull (B8). So the pot's heat *answers the dial a moment later*. Pots are chosen parts (a thick clay pot: wider band, slower; a thin one: faster, narrower), which makes equipment a modifier you chose (design law: modifiers with a visible source). Source: B8, B12, Zelda's portable pot for cooking anywhere (A6). Law: base change bad, modifiers good. Risk: lag + a phone thumb is a recipe for "the game ignored me"; make the lag a fixed, shown delay with a ghost (the way the press shows its ghost path, SOUL-ALCHEMY.md 4.9).

**D7. One teaching trade-off a dish.** Darker roux = more flavour but a quarter the thickening (B5); brown rice = food buffs, white = growth (Sakuna); sear harder = more Maillard, more risk; ferment longer = more depth, less crunch (mine). Every dish has two ends of one slider and neither is "best" (MYCELIUM.md refuses dominant choices). Source: B5; A13 (Sakuna). Law: every system teaches something real; no dominant choice. Risk: cheap to state, easy to make one end strictly better: check with the economy script (`scripts/economy.mjs`) the way Dovina checked the graft's x1.62.

**D8. Emulsion is the one "rhythm" step: pour rate against whisk rate.** A rising-and-falling pair (oil slow, whisk steady) with a visible turning point where it breaks (hollandaise: keep butter warm at about 60-63 C, curdles at 71-76 C; oil too fast breaks mayonnaise). It is the one place a continuous rate gesture beats a button (and a thumb can do it: drag speed against a ring). Rescue costs a yolk and a spoon of water (B6) and is shown as a recovery. Source: B6; A1 (Mama will fix it). Law: failure as comedy, cheaply fixed. Risk: a continuous gesture is the thing that most often fails on a platform (A14.1); give it a wide, forgiving "good" zone and a narrow "true".

**D9. The patient step is "do nothing correctly".** Dashi: don't boil the kombu (B10); fermentation: tend a thermostat (B13); the BBQ spit: lift on the tune (A7); Maillard: wait for the surface to dry (B3). Each is a minigame whose skill is *restraint*, rare in action games and exactly what Soul Alchemy's "high skill skips grind" rewards as a skip (a skilled cook starts the dish at the right moment and walks away). Source: A7, B10, B13. Risk: a step with no input reads as broken; give it a soft, audible tell (the tune; kombu's steam) and a visible "ready" window that runs out.

**D10. Never a chore: the cook-at-the-parallel-clock, a batch, an auto-cook knack.** Cook, Serve, Delicious's skill is parallelism (A4); Fantasy Life offers batch crafting up to 10 and Auto Mode at lower quality with experience cut sharply, improving as you craft (A3). So: (a) long steps (simmer, ferment, bake) run on the game clock while the player does other things (a game hour is 150 real seconds); (b) batch up to ten once a dish is mastered; (c) **auto-cook is a knack** (CLAUDE.md: "Assists are knacks: earned, optional, switched on or off, never gating the skill"), earned by true cooks of that dish, producing a Good-grade dish and a smaller practice gain than a manual cook. Source: A3, A4; CLAUDE.md. Law: skill skips grind, grind closes the gap (the grinder reaches Good, only a cook reaches Perfect). Risk: a knack that outperforms manual play on cost collapses the whole station; price it.

**D11. Recipes are found by doing, remembered by the world, and sometimes handed over broken.**
- *By experiment:* the pot recognises a combination and logs it (BotW compendium; TotK recipe log; Spiritfarer hides recipes until cooked; Rune Factory teaches bread by cooking bread).
- *By tasting:* eating a dish at a folk's stall or a spirit's gift teaches its recipe (FFXV: a starred food unlocks the recipe).
- *By repair:* a folk member or a spirit gives a recipe with lines missing, and the order of steps is the puzzle (Venba). Use clay for the medium (a cracked slab) but do **not** call it an ostracon (taken).
- *Never by blind failure* (Rune Factory's "completely valid recipes" that fail because of a hidden level), and never a random piece (Ooblets).
Source: A6, A8, A12, A13. Law: every system teaches without saying (the player learns the order of operations by being short two lines of it). Risk: the "wiki problem" (MYCELIUM.md 1): the Codex must keep what was learned, as the Grimoire of Echoes does for the press.

**D12. A dish is a draught: a modifier with a visible source, one at a time.** Stardew: one food's buffs at a time, eating another wipes the old (A9); BotW: mixed effect types strip the added effects, forcing a choice; Sakuna: next-day buffs. Land it on what exists: a served dish gives a **held draught** of the dish's dominant feeling (C2), its **strength** by the dish's grade (and kokumi), its **hold** by umami (and the grade), shown on the Lachrimeter and the Sight (two avenues), and it feeds the press through the existing `draughtPull` (0.08 x strength per material). One dish at a time. A second dish replaces. That keeps the base rule (the draught still fades), changes only its *rate of fade* for a visible reason, and gives Soul Alchemy a deliberate second road to a hue, as the mycelium's print is (MYCELIUM.md 3.3). Source: A6, A9; SOUL-ALCHEMY.md 3.4; MYCELIUM.md. Law: base change bad, modifiers good. Risk: the draught's pull means a six-minute dish could out-pull the materials themselves; cap the dish's strength so it nudges rather than steers (Dovina's call; 0.08 per material is the existing nudge).

**D13. Flavour as a taste vector, balanced by a final "taste and adjust" move.** Each ingredient contributes to a vector over the C2 flavours (and fat, kokumi, umami). The dish's *dominant* feeling picks the draught; its *balance* (Salt Fat Acid Heat; Newton's centre of gravity, as the press) sets the grade: a dish with one loud flavour and nothing to answer it is flat or harsh; a pair at the wheel's opposites cancels toward grey, the calm centre. The final move is a limited number of tastings (a spoon) and one adjustment: salt a pinch, acid a squeeze, fat, or heat. Source: B20 (SFAH, Taste), SOUL-ALCHEMY.md 3.1, 7a ("complements grey"). Law: every system teaches (balance); base change bad (the vector is the dish, not a stat). Risk: "balance" as a hidden score is the wiki problem; draw it as a radar (the STATUS shelf already has two) and show before and after for each adjustment.

**D14. Cooking seasons the attributes the right way (and says so only in the log).** Add cooking sources to SEASONING (SOUL-ALCHEMY.md 6), each at most 10 a game hour: **Focus** (a band held; sustained attention), **Dexterity** (a knife-cut dish at the target size; hand speed), **Perception** (a tasting that reads a dish right; anticipation). This closes the loop with Soul Alchemy: cook well, a swatch widens, the press gets kinder. Source: SOUL-ALCHEMY.md 3.2, 6. Law: grind closes the gap. Risk: seasoning is Dovina's economy; ask, not assume.

**D15. The clay world is the kitchen: pots from the kiln, ovens that are kilns, a bread that is the Courier's.** Pots are made and glazed at the kiln (the workshop's), their wall thickness and glaze a modifier you chose (D6); a donabe must be seasoned with rice porridge before first use (B12), which is a real, slow, nearly-free ritual and a nice first-hour step; a tagine's lid returns condensation (a visible loop of steam); a bread oven or a hearth bakes in game hours (B14). Bread is the best first dish: kneading (windowpane), proof (a patience step), score and steam (a single gesture and a vent), pull (the sound). The Courier is clay and the kiln MENDs them; a cooking pot that cracks from thermal shock (B12) is the same word the vessel uses, so be careful with the word crack (GLOSSARY: "crack" is the vessel's damage; a pot's is "a crazed pot" or "a split pot"). Source: B12, B14; GLOSSARY. Law: modifiers with a visible source (the pot you chose). Risk: the glossary word.

**D16. Ingredients come from what the other loops already give; failures go to the tree.** Fish (angling) with an optional ikejime pair of calm gestures that raises a fish's quality (B18); herbs from the Herb Terraces' beds; the Wells' haul (Dungeon Meshi's premise, A13); koji-bed output from the mycelium (MYCELIUM.md 3). A failed dish is the BotW "Dubious Food": it restores a little, has no effect, and is fed to the World Mushroom or rotted back into materials by the oyster strain (MYCELIUM.md 3, 4.1). No spoilage, no hunger meter, nothing perishes (MYCELIUM.md refuses decay). Source: A6, A13; MYCELIUM.md. Law: the world already has a sink for it. Risk: ingredient bloat; give dishes the *kinds* the press uses (materials/fish/curios), no new item families (MYCELIUM.md pitfall).

**D17. Cooking for others is the reward that cannot be farmed.** Spiritfarer feeds dishes to spirits to raise mood; FFXV's party favourites; Rune Factory gifts. Spirits in the garden already like one feeling's fruit and dislike its overcoming one (MYCELIUM.md 5); the siblings can be buddies at the pot (Fantasy Life i: 1/2 and 1/4 of the buddy's stat); the folk have orders (Dave the Diver, Ishin: dishes delivered to customers for reputation). A spirit's favourite is a modifier (its bond grows faster) and a visible mark, not a number (world marks carry no words). Source: A3, A8, A13. Law: base change bad. Risk: scope; ship the player's own draught first.

**D18. Sink, reward, and how not to break the economy.**
- *Sinks (a drain the player chooses and never fills):* the pot at the kiln and its glaze; spices and the rare ingredients; the fuel for the hearth. Nothing the Courier needs for progress.
- *Rewards:* a draught that nudges the press (D12), seasoning (D14), a collection (recipes learned in the Codex; achievements as predicates over the ledger: dishes true-cooked, recipes found, a six-taste meal), folk and spirit bonds (D17).
- *Pace:* Fantasy Life gates by life rank; Stardew by friendship and show; we gate by what the player has done (the first true cook of a dish type unlocks the next, as Cooking Mama unlocks by mastering earlier dishes: 96 dishes, A1). The Summit/DEBUG lend panel should carry a `cooking` lend (CLAUDE.md DEBUG mode).
- *The cap:* no inflated top number (Atelier 999). Grade in four steps (Fantasy Life's Good, Great, Perfect; A3), each a visible threshold.

### D19. Pitfall checklist, by game, to hold the build to

| game | complaint | the guard |
|---|---|---|
| Cooking Mama | unresponsive input; repetitive; generous grading in one mode | touch-first gestures with wide good zones; grade by a visible threshold; rotate dish families so no step repeats in a row |
| Battle Chef Brigade | pick loadout before the judge's taste is known | show the target (a customer's or spirit's taste) before the first move |
| Fantasy Life i | copy-paste minigames across crafts; speed over precision | one distinct gesture per real technique (D2, D8, D9), not one mash-bar |
| Potion Craft | requests for auto-stir | an earned assist knack (D10), not a bypass |
| Cook, Serve, Delicious | punishing difficulty | no lives; a bad dish is a worse draught, never a lost run |
| Overcooked | solo play weaker; level design as difficulty | no timer pressure on the long steps; siblings as buddies |
| BotW/TotK | crit dice; tedium without a log | skill-state crits; a recipe log from day one |
| Atelier | vague traits; 999 cap | named, short list of effects; four grades |
| Rune Factory 4 | hidden level gates that waste ingredients | tell the player what a recipe needs before they start |
| Cooking Simulator | imprecise knife controls, physics bugs | the rule is the brain, the input forgiving; no real physics |
| Dave the Diver | complexity and poor explanations | the first dish teaches by doing in a clear order; tutorials are mechanics, never text (CLAUDE.md) |
| Dreamlight Valley | stars from ingredient count, not skill | grades from the cook, not the recipe |
| Order Up | repetition | no rush mode in the base game |
| Spiritfarer | food burns if left | leaving a pot for a long time cools it, never spoils it (MYCELIUM: nothing decays) |

---

## E. What I could not verify, and what South should rule

**Unverified or conflicting:**
- Battle Chef Brigade numbers (gem upgrade thresholds, scoring): the fandom page returned HTTP 402; the guide I opened had no formulas.
- Fantasy Life i Cook life specifics (stations, recipe ranks, "Perfect" thresholds): the guide I opened lists five crafting Lives and omits Cook; the trailer page names only one stew; player threads and a fandom table of quality thresholds (Normal 54, Good 60, Great 66, Top 73, Divine 79) were for a Frymaster 2000 pan on a different title page and cannot be confirmed to be Fantasy Life i's.
- Monster Hunter World's meat timing and canteen buffs: only snippets; no meal-buff list.
- FFXV's photo detail: not found.
- Stardew's per-recipe numbers: sources disagree.
- Tempering melt/cool/work for dark chocolate: only the working temperature 31-32 C is multi-sourced; Wikipedia gives a different generic sequence (40 / 32 / 27 / 29-31).
- Brine percentages: Serious Eats wording not retrieved; 6% via Food52.
- Beurre blanc 49 C and tandoor 480 C: not found.
- Go-mi framework and Sivananda's full six-taste mental effects: not found.
- Ayurveda's "all six tastes in every meal" advice: not verified.

**For South (batch them through Dovina):**
1. Is a dish a *held draught* (D12), or a separate kind of buff?
2. Bitter: Mirth at low dose, Gall at high (C2)? Fury as chilli heat or as sour?
3. Does cooking need a place of its own (the Herb Terraces' hearth; a stall in the workshop) and is a portable pot wanted (TotK's)?
4. Which attributes may cooking season (D14)?
5. Is a sibling at the pot wanted from the start or later (D17)?
6. Plain names stay: "cooking station", "dish", "serve", "adjust to taste"; no lore names until South calls it finalized.

**Tests per Test Lean:** none requested; this is research. Nothing was run, built, or edited.
