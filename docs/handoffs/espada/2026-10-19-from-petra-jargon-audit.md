# From Petra: the jargon audit (the deep clean, 2026-10-19)

The owner asked to clean up "excessive jargon proliferation where standard genre verbiage already exists". This is the audit, read-only,
ranked by how much a new player would be confused. The words are yours and the owner's (CLAUDE.md, Threads); you may change them in any
division's files as strings. Petra has already applied the ruled ones in Petra's files (the Paint Dive, the Veritome's memory, boost pad,
the lend panel): see the commit "The deep clean: ruled words in the player's text". What is left: propose plain or genre names for the
UNRULED and WORKING rows under "Plain names until settled", apply them as strings, and put the owner's calls (the Pneuka Box, Mind
Mapping, EmO) in one question to Dovina's digest.

---

For Petra (Main), the owner's deep clean. Nothing in the repo was edited. Read-only audit of `/home/user/foolsfortune` at `7ffdd20`, 2026-10-19.
Rule applied: CLAUDE.md "Plain names until settled" (owner, 2026-10-19) and `docs/plans/CLARITY.md` (a genre-word label, one line of effect, lore in the world and the Codex).

## How to read this

- **P** = player-facing (a string the player reads: log, window, help page, achievement, item text). **C** = code identifier or comment. **D** = docs only.
- Counts are string literals found by a tokenizer over `src/**/*.js` (53,950 literals; comments and identifiers excluded), minus `workbench/`, `music/`, `debug/` and the voice lexicon. They are counts of strings, not of screens, and are good to about +/- 2.
- **Status** (from the glossary and the docs the glossary points to; a name is *ruled* only where a doc says the owner ruled it, with a quote or a date):
  - `RULED` the owner ruled it. Keep.
  - `RETIRED-LEAK` glossary section 12 or the duel plan retires the word; it is still shown or still in code.
  - `WORKING` the glossary says working name, proposed or "to rule". Rename under the rule.
  - `UNRULED` the glossary is silent on a ruling. Treated as not ruled, as briefed.
  - `LORE-KEEP` a lore name for a settled thing. Keep in the world and the Codex; the UI shows a label.
- **Change by**: *words* are Espada and the owner (CLAUDE.md, Threads: "Espada proposes the lore names and the owner rules"). *Files* are the division that owns the file: Petra (`feedback/`, `world/`, `tools/`, `pneuka/`, `godhand/`, `courier/`, `render/`), Dovina (`progress/`, balance tables, achievements), Calissa (`vfx/`, `ui/`). Another division's file is changed by asking it.
- Ranked by how much a new player would be confused: exposure (first hour, how many strings, how many windows) times opacity (could the player guess it) times whether a standard word exists.

## Top 15

1. **RECKON THE SEA / REDRAFT / CAST OFF, "draft your passage", rutter, portent, "bears 6"** -> *Scout route / Reset route / Set sail* (Sid Meier's Pirates!, Sea of Thieves; Wind Waker's Sea Chart), *Route map*, *Hull 6* (FTL; the Hull keyword exists). P: about 36 strings in 16 files (`world/emocean/seachart.js:110-112`, `pier.js:28,82,90`, `triprun.js:41-50`, `progress/rail/encounters.js`). `UNRULED` (the files call them Espada's placeholders). The 2026-10-08 UI audit scored this window 5 of 5; it has not changed. Words: Espada + owner; files: Petra, Dovina.
2. **EMO and GRAIN on every creature's tag** -> *Agitation (or Rage: Monster Hunter's enraged state)* and *Nature (Pokémon) or Personality (Dragon Quest Monsters)*. P: `vfx/creaturetags.js:67,256,271`; the bestiary says "Grain: curious, bold, steady". EmO is the owner's design-doc term ("keep, central", `DESIGN.md:213`), so it stays in the Codex; GRAIN is `UNRULED` (Espada's). Words: Espada + owner; files: Calissa, Dovina.
3. **"slip" for the Soul Brush's paint, and the "Slip Dive" art** -> *paint* (Splatoon, Okami) and *Paint Dive* (the glossary's own replacement). P: 17 strings in 6 files (`feedback/help/pages.js:65,120,122,125`, `progress/skills.js:77-83`, `tracking.js:70,563`, `achievements.js:319,321`, `pneuka/items.js:40`). `RETIRED-LEAK` (glossary section 12), and `scripts/check.mjs` has no pattern for it. `techwing.js:127` already says "PAINT DIVE", so the game contradicts itself. Words: Espada; files: Dovina (skills, achievements), Petra (help, log).
4. **Veritome window: plate / film / roll / darkroom / memory** -> *photo* (Pokémon Snap). P: `tools/veritome/ui.js:109` ("appraise the film"), `:140` ("The roll is empty"), `:136,148` ("PLATE n", "N plates"), `tracking.js:353` ("24 plates"), `help/pages.js:137`; the same window says "photograph" 6 times. "film" is `RETIRED-LEAK` (glossary section 12); "plate" is `UNRULED`. Words: Espada; files: Petra.
5. **Lockheart: hoover, coffin, Possibilikey, "the Opening", wheel of odds** -> *Vacuum* (Luigi's Mansion; the mount label already says Vacuum), *Lockheart key* (qualified, which satisfies the "key" homonym rule), *roulette wheel / spin*. P: hoover `help/pages.js:170`, `tools/codexpage.js:69`, `achievements.js:502`; Possibilikey 8 strings (`items.js:56`, `tracking.js:512`, `help/pages.js:171`); coffin 8. `UNRULED` ("always so called" is a house rule, not a ruling). Words: Espada + owner; files: Petra.
6. **crossing / stage / leg / hop / rail / set piece / passage** (six words for the Emocean run) -> *Stage* (Star Fox, Gradius) for the rail run, *Voyage* for island to island, *Section* for a leg. P: "crossing" 15 strings, "stage" 2 (`achievements.js:562-563`), "leg" 5, "The Rail" is an achievement category (`achievements.js:51,573-585`, 16 strings). `UNRULED`. Words: Espada + owner; files: Dovina, Petra.
7. **brimming / draught / mental state (Stoic..Prismatic)** -> *Overflow* (or Overcharge), *Elixir effect / buff* (Breath of the Wild, which `progress/stones.js` cites), *Stress* (Darkest Dungeon, also cited there). P: `tracking/place.js:24-26`, `achievements.js:255`, `help/pages.js:229`. "brimming" is Espada's word (the owner changed its numbers on 2026-10-09, not its name): `UNRULED`. Words: Espada + owner; files: Petra, Dovina.
8. **Item names for mechanics: Wake Whistle, Cogitomap, Rutter, ostracon / stele, bauble** -> *Homeward Bone (Dark Souls) / Escape Rope (Pokémon)*, *Well map* (Path of Exile's Maps are the seeded-run ticket), *Route map*, *potsherd / word tablet*, *drop / orb* (Diablo). P: `pneuka/items.js:67-110`, `tracking/wells.js:37,56`, `tracking/passage.js:21-22`, `tracking/ostraca.js:16,22`. `LORE-KEEP` for the object; the UI needs a label beside it (CLARITY section 3). Items carry a `name` only, no label/lore split. Words: Espada + owner; files: Petra.
9. **Pneuka Box** -> *Inventory* (OSRS, Diablo). P: 43 strings in 18 files (window title `pneuka/ui.js:149`, `help/pages.js` x9, `tracking.js` x8, the System voice). `UNRULED`, and probably the owner's word, so ask. Keep the name in the world ("Pneuka Jar" stays); the window title and the full-box line could read Inventory. Words: owner; files: Petra.
10. **Mind Mapping** -> *Map*. P: `feedback/cartography.js:425` (window title), `help/pages.js:37,240`. `UNRULED` (glossary: "called Mind Mapping in the game"). Words: Espada + owner; files: Petra.
11. **Codex tabs LEDGER / RECORDS / GRIMOIRE** -> *Stats* (OSRS), *Personal bests* (already the subhead at `codex/ledger.js:168`), *Garden log* (the GRIMOIRE tab holds spore strains, grafts, Myggdrasil and keepsake pots; it has no spells). P: `codex/codex.js:158`, `ledger.js:197,200` ("ERASE THE LEDGER"; a RESET PROGRESS button already exists). `UNRULED`. Words: Espada; files: Petra.
12. **"sun plate" in the log; the ruled UI label "Boost pad" was never applied** -> *Boost pad* (Mario Kart 8's boost panel; F-Zero's dash plate). P: `tracking/race.js:22,24,63`, `progress/raceachievements.js:23,33` (5 strings). Espada ruled "boost pad in the UI and the log" on 2026-10-13 (`LORE.md:715`); no player string says it. Also "plate" now has five meanings (see cluster S4). Words: done; files: Petra, Dovina.
13. **bunker / high water** -> *Fuel* (keyword exists, `ui/keywords.js`), *High score*. P: `tracking/passage.js:26` ("Your bunker is dry.", 2 strings), `tracking/voyage.js:33` ("High water on this sea today"). `UNRULED`. Words: Espada; files: Petra.
14. **hook / grapnel / grapple** (the Sondelass's third form, 3 words) -> *Grapple* / *grappling hook* (Just Cause, Batman: Arkham). P: grapnel 24 strings (16 in achievements), hook 17, grapple 3 (`progress/rail/mounts.js` label, `skills.js`). `UNRULED`. Words: Espada; files: Dovina, Petra.
15. **BUCKLE** on the duel's flee plate -> *BREAK*. P: `vfx/duelview/flee.js:33` (and the header comment `:11`). The owner's own example: "buckle" was retired in `PUZZLE-DUELS.md:7`. `RETIRED-LEAK`. A one-line fix. Words: done; files: Calissa.

## Full table

Rows 1 to 15 are the top 15 above (same numbers). Rows 16 on follow in rank order. Counts and lines are given there; this table does not repeat them for 1-15 except the sub-items the top-15 leaves out.

### A. What the player reads

| # | Current word | Standard word (prior game) | Where | Status | Change by |
|---|---|---|---|---|---|
| 1 | sea chart verbs and nouns (above) | Scout route, Reset route, Set sail, Route map, Hull | see top 15. Also `triprun.js:41` "Reckon the sea." as a choice; `achievements.js:564` "Reckon a crossing in full" (keep the pun "Dead Reckoning") | UNRULED | Espada + owner; Petra, Dovina |
| 2 | EMO, GRAIN (and NOW, WEAK on the same tag are fine) | Agitation / Rage; Nature / Personality | top 15 | EmO owner's term (Codex keeps it); GRAIN UNRULED | Espada + owner; Calissa, Dovina |
| 3 | slip (paint), Slip Dive, "C on slip", "seconds under the slip" | paint; Paint Dive | top 15. Keep "slip" in slip jelly, slip geyser and the folk's pottery lines (`npc/talks.js`, `bestiary.js`): those are the creature and the clay | RETIRED-LEAK | Espada; Dovina, Petra |
| 4 | plate, film, roll, darkroom | photo, photos in memory | top 15. The window's other words (binder, bank, bound, page, rank SS..H) are Greed Island's Book, cited in `cards.js`; keep, and let the tab say "Collection" | film RETIRED-LEAK; plate UNRULED | Espada; Petra |
| 5 | hoover, Possibilikey, coffin, Opening, wheel of odds | Vacuum, Lockheart key, roulette wheel | top 15. Also `LOCK_CUES` "the Lockheart's cue" (music) is fine | UNRULED | Espada + owner; Petra |
| 6 | crossing, stage, leg, hop, rail, set piece, passage | Stage, Voyage, Section | top 15. "hop" is also the skiff's hop and the Jar's hop (glossary homonym row) | UNRULED | Espada + owner; Dovina, Petra |
| 7 | brimming, draught, mental state, "You settle." | Overflow, buff, Stress | top 15 | UNRULED | Espada + owner; Petra, Dovina |
| 8 | Wake Whistle, Cogitomap, Rutter, ostracon, stele, bauble | Homeward Bone, Well map, Route map, potsherd, drop | top 15. `bauble` is in `GLOSSARY-DETAIL.md` only (not the short glossary); 5 player strings, 46 code lines (`game.baubles`) | LORE-KEEP (object); label missing | Espada + owner; Petra |
| 9 | Pneuka Box | Inventory | top 15 | UNRULED | owner; Petra |
| 10 | Mind Mapping | Map | top 15 | UNRULED | Espada + owner; Petra |
| 11 | LEDGER, RECORDS, GRIMOIRE | Stats, Personal bests, Garden log | top 15 | UNRULED | Espada; Petra |
| 12 | sun plate | Boost pad | top 15 | ruled by Espada, not applied | Petra, Dovina |
| 13 | bunker, high water | Fuel, High score | top 15 | UNRULED | Espada; Petra |
| 14 | hook, grapnel, grapple | Grapple | top 15 | UNRULED | Espada; Dovina, Petra |
| 15 | BUCKLE | BREAK | top 15 | RETIRED-LEAK | Calissa |
| 16 | unwrite, unwritten (the Soul Brush's defeat verb) | Erase / erased (plain English) | P: 7 strings: `tracking.js:56,58,352,582,583`, `achievements.js:328,331`. C: `soulbrush/inscribe.js` `unwrite()` | UNRULED | Espada; Petra, Dovina |
| 17 | God Art one-word labels that do not name the verb: Course, Read, Take, Set, Strata, Slab, Muster, Totem, Fold, Ward, Stamp | Flow preview, Scan intent, Possess (the domain is Possession), Lock, Layer view, Lift ground, Rally, Marker, Swap, Barrier, Copy | P: `progress/godpowers.js:21-49` and `godhand/arts.js`; each has a `does` gloss already, so the fix is the label or showing the gloss first | UNRULED | Espada; Dovina, Petra |
| 18 | combo, string, combination, stroke (one chain of blows) | Combo (every action game) or String (Tekken, Devil May Cry); pick one | P: help says "the combo: four strokes" (`help/pages.js`, 2), the log "three-stroke combination" (`tracking.js:594`, 3 strings with achievements), the editor "BUILD YOUR STRING" (`loadouteditor.js`, 4). Glossary says "string, Not a combo" | UNRULED | Espada + owner; Petra |
| 19 | the seven domains' names: Ouranurgy, Spellscription (and Divination, Possession, Alteration, Manifestation) | Skill names: add a gloss, e.g. "Ouranurgy (space and time)", "Spellscription (inscribing)" | P: Codex STATUS shelf, `achievements.js` category "THE DOMAINS". `domains.js` already carries a `does` line for each | RULED ("No new domains, ever"; the owner's design document) | none; show the `does` line beside the name (Petra, `codex/status.js`) |
| 20 | the Raceway's pool words: vein lane, siphon, scorch | Recharge strip (F-Zero's Pit Area), Drain gate, Overheat | P: `tracking/racemodes.js:18,62,64,65`, `world/raceway/licences.js:23`, `raceachievements.js:56`. "Pit lane" (the licence) is already F-Zero's idea | siphon WORKING (Espada's); vein lane, scorch Espada's 2026-10-13/14 ("stand as genre words"), not owner-ruled | Espada; Petra, Dovina |
| 21 | Tithe, "TITHES PAID", sealed chest | Gacha pull / Loot box; "pity" is already the gacha word | P: 22 strings (13 in achievements), `codex/ledger.js:264,289`, `tracking.js:710`. The log line itself is plain | LORE-KEEP (a machine in Raku's Bazaar) | Espada; keep the name, let the Codex line say "pulls" |
| 22 | garden formation, spirit vein, seasoned / swatch, bond | Adjacency bonus (Civilization VI), Mastery progress (Skyrim skill XP), target range | P: `tracking/place.js:33` ("Its formation there: x1.5"), `help/pages.js:228`, `tracking/garden.js:58` ("seasoned: its swatch is as wide as practice makes it"), `alchemy.js:173`, `raising.js:150` | UNRULED | Espada; Petra, Dovina |
| 23 | Zone of Influence | Explored area (fog of war: Civilization, StarCraft) | P: 2 strings (`help/pages.js:190,240`); C: 14 lines. "Influence" is Black & White's word for a god's reach, which is close to how it is used for the hand | UNRULED ("Always named in full") | Espada + owner; Petra |
| 24 | agate (two feelings at once) | Blend (or Plutchik's "dyad") | P: 2 (`castershells.js:147` TYPE-88 "Agate", `achievements.js:662`). The weather log prints the blend's name (pride, zeal), not "agate". C: `AGATES`, `agateOf`, 48 lines | UNRULED | Espada; Dovina, Petra |
| 25 | sounding ("MMB sounds the water", "You send a sounding") | Ping (sonar) | P: `tracking/angling.js:21`, `help/pages.js`, `achievements.js` x2 | UNRULED | Espada; Petra |
| 26 | awaken (used for a creature at the Plate Shrine and a fossil, as well as a feeling) | Hatch / Summon (Pokémon eggs) for creatures; keep "awaken to" for feelings | P: `world/garden/realm.js:467-470,480-481`, `tracking/garden.js:65` ("A plate awakens"). The owner ruled "awaken to" for feelings only (LORE.md, 2026-10-11) | feelings RULED; creatures UNRULED | Espada; Petra |
| 27 | iaido | Quick draw | P: 1 (`help/pages.js`, Sondelass rows). Blade Mode, Stinger and zandatsu are genre words (Metal Gear Rising, Devil May Cry) and stay | UNRULED | Espada; Petra (low) |
| 28 | the Brush Slide, FLICK, "bristles saturate", wash | Brush slide is fine; FLICK is fine | listed to say they are *not* a finding: Okami's Celestial Brush techniques are the prior art | GENRE-OK | none |

### B. Glossary entries marked working, proposed or "to rule" (33 of 340)

Mostly names of UI parts and modules, not words the player reads. Under the rule each takes the plain or genre name until the owner calls the thing finalized.

| # | Current name | Plain / genre name (prior game) | Where | Status | Change by |
|---|---|---|---|---|---|
| 29 | the paid cut (`paidCut`, `move.cut`, `move.cut.paid`) | **recovery cancel** (Guilty Gear's Roman Cancel, SF6's Drive Rush; `tools/moveset.js:98` cites both) | C/D: 39 lines in 9 files. The one player line is plain ("You cut the recovery short for 5 Lachryma", `tracking/moves.js:23`). Qualify as "a recovery cancel": "cancel" is a glossary homonym | WORKING | Petra (code), Espada (glossary) |
| 30 | the duel's view / the tsuitate | **duel board** (drop the Japanese loanword) | C: 15 lines, 5 files (`vfx/duelview.js`) | WORKING | Calissa |
| 31 | the domains' clash | **arena backdrop** | C: `vfx/duelview/domains.js` | WORKING | Calissa |
| 32 | the flee's look | **flee roll** (D&D saving throw; Baldur's Gate 3's dice window, both cited in the module) | C: `vfx/duelview/flee.js` | WORKING | Calissa |
| 33 | the crackle break | **break flash** (FFXIII break; .hack//G.U. Protect Break, cited) | C: `vfx/crackbreak.js`; "break" has four homonym rows already | WORKING | Calissa |
| 34 | the Sondelass's guard / the lure ring | **Sondelass HUD** / **lure wheel** (GTA V weapon wheel; the radial menu) | C: `vfx/sondelassguard.js` and folder; "guard" is a homonym | WORKING | Calissa |
| 35 | the Soul Brush's desk | **brush HUD** or **brush palette** (Okami) | C: `vfx/soulbrushdesk.js` and folder | WORKING | Calissa |
| 36 | the Lockheart's reliquary / the hoover's reach | **Lockheart HUD** / **vacuum cone** | C: `vfx/lockheartreliquary.js`. Conflict: the retired table (glossary section 12) says the owner chose "reliquary" on 2026-10-19 while the entry still says "to rule". Ask before touching | RULED or WORKING (the glossary disagrees with itself) | owner to say |
| 37 | the lob's arc mark / a flare's reveal outline | **trajectory preview** (Worms, Angry Birds) / **reveal outline** | C: `vfx/lobarcmark.js`, `vfx/flarereveal.js` | WORKING | Calissa |
| 38 | a variant's play: quick taps, flare, scope, full draw, dart, **pentacle**, slug, both barrels | all genre words (fan the hammer, archery's full draw, a shotgun slug) except *pentacle* -> **five-type volley** | P: `tracking.js:679` ("Your pentacle closes"); C: `variantplay.js`, kinds.js `play` | WORKING | Espada; Petra |
| 39 | the psygun's reticle / the scope's lens ring | **crosshair** / **scope reticle**. "Reticle" is already plain; only "lens ring" is coined | C: `vfx/psygunreticle.js`, `psygunscope.js` | WORKING | Calissa |
| 40 | the Sight; the Lachrimeter's tube | **compass** (Skyrim) / **pool gauge**. "Lachrimeter" itself is the owner's word (CLAUDE.md quote): keep | C: `vfx/sight.js`, `lachrimetertube.js` | WORKING | Calissa |
| 41 | a Veritome / its sight | **scan mode** (Metroid Prime's scan visor). The setting is already `visual.creatureTags: scan` | D: `docs/plans/VERITOMES.md` | WORKING | Espada |
| 42 | rejection | **backlash** or **alert level** (GTA wanted level, Metal Gear alert). The log lines are plain ("The island pushes back") | C: `game.rejection`; "Dissonance Level" is the owner's, keep | WORKING | Petra, Espada |
| 43 | a miracle / an epic miracle; the island's matter | *miracle* is Black & White's own word: keep. "island's matter" -> **terrain layers** | P: `godpowers.js` (Miracles), 20 strings; C: `godhand/matter.js` | WORKING | Espada |
| 44 | the bracelet / a charm | keep: charm is Hollow Knight's word; the seven charms (TWIN, WIDE, ECHO, QUIET, THRIFT, LINGER, GENTLE) are Path of Exile support-gem style. Note TWIN, WIDE, ECHO also name three Lockheart keys | P: `status.js` THE BRACELET, `progress/bracelet.js:29-35`; also "charm" = the Lockheart's chain, and a status | WORKING | Espada |
| 45 | a grind / a rail / a sun ring | **grind rail** / **boost ring** (Sonic's dash ring) | P: "rail" in `tracking/race.js:77-78`; C: `railsrings.js` | WORKING | Espada |
| 46 | a cap on the pool / a siphon | **pool cap** (plain); siphon -> **drain gate** | see row 20 | WORKING | Espada |
| 47 | the cavern; the Gorge Run; the Coaster; antlion pit; rival; rubber banding; takedown | track and creature names are world nouns: keep. Rival, rubber banding, takedown are already Mario Kart / Burnout words | P: `tracking/race.js` | WORKING (names) | none |
| 48 | stun depth: dazed / stunned / out cold | already genre words; LORE.md:849 keeps them as labels | P: `core/config.js` | WORKING but done | none |
| 49 | the neuralese script / the Comb | **stamp script** (keep "neuralese"; the orthography was ruled by the owner 2026-10-16, only "the Comb" is proposed) | D: OVERLAY.md 15.5 | WORKING | Espada |
| 50 | the storm warp (tuning label, "a placeholder for Espada's word") | **screen warp** | C: `debug/tuning.js:76` | WORKING | Petra |
| 51 | base material; aptitude; the overlay; a tag / System window; familiarity; data bug; the System's interface | all plain English or genre already (overlay, tag, aptitude, data bug). No change. "the Assay" and "title placard" are RULED | | WORKING but plain | none |

### C. Code names (worst offenders only: a reader would not guess what the thing is)

| # | Name | What it is -> plain name | Where | Status | Change by |
|---|---|---|---|---|---|
| 52 | `labradorite`, `schiller`, `schillerInk`, `featTint`, `SLIP_SCHILLER`, "the film" (oil film), `oxidation` | one iridescent thin-film look -> **iridescence**, `iridescentTint` (the module's own prior art says "thin-film shaders") | `labradorite` 309 lines / 100 files; `schiller` 102 / 38; `featTint` 50 / 18. "the film" also collides with the Veritome's retired film and the score ceremony's `film` tier | the owner's art direction names labradorite (`vfx/labradorite.js` header): keep it in `ART.md`; rename identifiers | Petra, Calissa |
| 53 | `game.ledger` / "the ledger" in `progress/stats.js` | the stats store -> **stats** (the file already says stats) | 281 lines / 133 files | UNRULED; the owner's CLAUDE.md uses "ledger" | Petra (large change; do last) |
| 54 | `game.seam`, "seam" | a scene transition -> **transition**. Three meanings: `render/seam.js`; a puzzle duel's "seam" (`kind aberrant`); the domains' clash "seam" | 36 uses of `game.seam`; 163 lines / 64 files for the word | glossary notes "not a texture seam" | Petra |
| 55 | `stones.js`: `heady`, `gulp`, `aperture`, `tint` | `heady` -> **mindPush**; `gulp` (83 lines / 31 files, shared with the Lockheart's gulp) -> **intakeCap**; `aperture` -> **releaseWidth**. Keep `stones`: it is the owner's word (`stones.js` header quotes him, 2026-10-06) | `heady` 21 lines / 2 files; `aperture` 25 / 7 | `stones` RULED; the rest UNRULED | Dovina, Petra |
| 56 | `tag` (three meanings) | `core/tags.js` capability tags -> **traits**; the overlay's readout tag; the Lockheart key's break-chance "tag" (`GLOSSARY-DETAIL.md:1235`) | `core/tags.js` and callers | glossary lists two as separate entries, no homonym row | Petra |
| 57 | `signatures` (`core/signatures.js`) | where Lachryma is, and how strongly -> **detection field** (a Witcher-sense style scent) | 28 lines / 16 files | UNRULED | Petra |
| 58 | `psyche` (`game.psyche`) | domain levels and widening -> **skills** (OSRS) | 44 lines / 21 files | UNRULED | Petra, Dovina |
| 59 | `nimbus` (`ui/seachart/nimbus.js`), `standoff` (`courier/anim/standoff.js`) | a waypoint's feeling halo -> **feelingHalo**; limb clearance offset -> **limbClearance** | 8 and 22 lines | UNRULED | Calissa |
| 60 | "ember" in four senses; "pull" in three; "plate" in five | Ember: Soul Brush technique EMBER, glaze EMBER, shell family Ember, duel junk that burns. Pull: shell family, Desire's miracle, god power. Plate: sun plate, photo, Plate Shrine, seat plate, odds plate. Add homonym rows, or rename one sense each | glossary homonym table lacks all three | UNRULED | Espada (glossary), Petra |
| 61 | leftover retired duel words in comments | "grog chips", "the March", "glean", "coup" | `vfx/duelview/beats.js:7,10,210`, `bursts.js:3`, `piecemodels.js:6`, `layout.js:38`, `debug/kits.js:30` | RETIRED-LEAK (`PUZZLE-DUELS.md:7`, `LORE.md:902`) | Calissa, Petra |
| 62 | glossary entries that name a vfx module's look: "the buoys' dress", "the siphons' look", "the park's dress", "the Raceway's props", "the combo's marks" and 16 more (21 in all) | one suffix (`look`) and demote to `GLOSSARY-DETAIL.md`, per the short-glossary rule | `docs/GLOSSARY.md` | the rule is the owner's (2026-10-08) | Petra, Calissa |
| 63 | `scripts/connectome.mjs` (new, `7ffdd20`) | the codebase's wiring map -> **depmap** or **wiring map** | 6 doc lines | Petra's own | Petra (optional) |

## Keep list (do not rename)

- **Genre words already in use**: the twelve keywords and the loadout's four (`ui/keywords.js`); mount labels (Blaster, Absorb, Bomb, Vacuum, Flash, Grapple, Radar); Movement Art names (Blink, Slam, Roll, Stomp, Wall Latch, Kick & Parry, Counter, Recoil Jump); the garden's features (Planter, Trophy Hall, Spirit House, Pond, Lantern, Incense, Booster Stone, Training Yard, Spore Bed) and the spore bed and Myggdrasil pages, which are now plain verbs; the attributes (Willpower, Focus, Charisma, Perception, Dexterity, Visualization, Resilience); achievement tiers and standings (OSRS); knack names (idioms with a `does` line); Raceway modes (hot lap, licence, cup, wager, takedown, rewind, nemesis); Blade Mode, Stinger, zandatsu, FEVER, FOE, pity, stun depth.
- **Ruled by the owner**: awaken to / vantage point; the Astral and Umbral forms and the surge; Dissonance Level; the Vessoul; Lachrymite; Spirit Garden; Great Dunemaw; Firing (and the Heavenly Kiln, the Dantian: xianxia words); the Crib Sheet; the Assay; cradle; the title placard; the spiritual link; the five psygun variants (Bombardier, Carbine, Pentagun, Pepperbox); Lachrimeter and the Lachrymato Bottles; the knack and the Arts (design laws); the puzzle duel's words (Line, junk, match, kick, run, break, orb, finisher, Flee, Hold, Send, and the rest of that entry).
- **Raku's tables**: Querent, Zodiac, Event Horizon, Supernova Run, Nebula Bluff carry no genre label (owner, 2026-10-15; CLAUDE.md).
- **World nouns** (outside the ask): places, folk, creatures, tools' proper names, Lachryma, cubes, the vessel register (glaze, crack, shatter, made whole).
- **One question for the owner on a ruled set**: "the drip" (the pieces each side is given a turn) and "orb" are in the ruled duel entry but are not genre words (genre: *draw*, *pickup*). Not recommended to touch unless the owner asks.

## One thing, many words (clusters; each needs one word)

| Cluster | Words now | Suggest |
|---|---|---|
| S1 the Emocean run | hop, stage, crossing, rail, leg, set piece, passage, voyage, trip | Stage; Voyage; Section (row 6) |
| S2 the hook | hook, grapnel, grapple, line | Grapple (row 14) |
| S3 a photo | plate, photograph, photo, snapshot, film, roll | Photo (rows 4) |
| S4 "plate" | sun plate, photo plate, Plate Shrine, seat plate, odds plate, cube plate | Boost pad; Photo; keep Plate Shrine and seat plate as world UI names |
| S5 a chain of blows | combo, string, combination, stroke, blow, swing, cut | one word each for the chain and the single hit (row 18) |
| S6 an ability | art, skill, ability, power, tech, trick, knack | Art in the UI. The System says "Skill acquired" for a Movement Art (`audio/voice/voice.js:119`) and "God art" for the hand's; use "Art" for both |
| S7 getting a creature | awaken, wake, hatch, bind, catch, summon | Hatch (plate), Catch (Lockheart) |
| S8 a charm | the Lockheart's chain charm, the bracelet's charm, the status charm | rename the Lockheart's to "keyring" (the box already says KEYRING) |
| S9 the same word on two mechanics | TWIN, WIDE, ECHO name Lockheart keys and bracelet charms; "toll" names the Crucibelle's ring and the Caster's cost | disambiguate the keys |
| S10 returning from defeat | made whole (Courier), re-formed, reforged (the Pneuka Jar, owner R43), refire (the kiln mends) | keep: the Jar's "reforged" is the owner's; the Courier's "made whole" is the glossary's |

## Also noticed, outside the ask

- `lachryma` in lower case in player text: `tracking.js:171` ("Your lachryma is depleted."), `achievements.js` `gl1`-`gl3` ("Spend 500 lachryma."). The glossary says "Lachryma" is always capitalised.
- Process words the divisions use (casebook, sweep, the gate, QAIS, handoff, round, board v11, connectome) are not player-facing. The owner asked for game words; flag only.
- The glossary entries marked working are 33 of 340. Entries credited to Espada alone ("Espada's, ruled 2026-10-13") count as unruled here, because CLAUDE.md says the owner rules.
- The 2026-10-08 UI audit (`docs/plans/research/UI-AUDIT.md`) scored the sea chart, the pier, the encounter choices, the Shed and the Plate Shrine. The mounts, the garden's features, the spore bed and Myggdrasil were redone since; the sea chart, the pier and the Shed were not.

## Verified and not verified

Verified by reading the source: every file:line above was opened or matched with grep on this checkout; the word counts come from the tokenizer, not by eye; the status of each row comes from `docs/GLOSSARY.md`, `docs/LORE.md`, `docs/plans/CLARITY.md`, `docs/plans/PUZZLE-DUELS.md` and the file headers named.

Not verified: no build was run and no window was opened, so "the player sees it" means "a string in a file the game loads"; some counts include dev-only windows I could not tell apart from a string alone (they are mostly excluded by directory). `GLOSSARY-DETAIL.md` was grepped, not read whole. The folk's lines (`npc/talks.js`, Espada's) and `docs/wiki/` were not audited. Prior-art names are the ones I know; where a module header already cites a game I used that one. No row assumes a spelling in the owner's head: where the owner's word is likely (Pneuka Box, EmO), the row says ask.
