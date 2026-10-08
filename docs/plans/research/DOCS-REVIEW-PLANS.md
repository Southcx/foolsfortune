# Review of docs/plans/ (40 files, 64,174 words)

Method: word counts by wc; status from each file's header/"Built" lines plus skims. I did not read every file in full; the big ones (SOUL-ALCHEMY, PASSAGE, MYCELIUM, GARDEN-GENRES) I read by headings and samples only. Statuses marked (?) are less certain. docs/archive/ does not exist yet. Tags: LIVE = still being designed or built; BUILT = built, now history plus numbers; SUP = superseded.

| file | words | purpose | status | overlap | recommend |
|---|---|---|---|---|---|
| BUGREPORT | 589 | in-game bug report (F8) | BUILT | QAIS.md, glossary "bug report", "markup window" | merge into QAIS spec |
| BUILD | 289 | record of 4 build rounds; 0 unbuilt as of v98 | BUILT, history | none | archive |
| COOP | 1290 | siblings and guests co-op | partly LIVE; foundations C1-C3 built (?) | glossary has ~10 co-op entries | trim; keep as spec |
| CRUCIBELLE-UI | 1080 | pendulum and visual metronome | BUILT (mostly; "as built" table) | glossary pendulum/neume/wire compass | archive; fold the table into a Crucibelle wiki page |
| DEBUG-CHESTS | 804 | debug chest rule and kits | LIVE rule; also in CLAUDE.md | CLAUDE.md "Scope", glossary | trim to a kit list; rule stays in CLAUDE.md |
| DUNEMAW | 2706 | original round-robin spec for the Well | BUILT, history | DUNEMAW-SYSTEMS/ARENA/EXTREME, glossary | merge into DUNEMAW-SPEC; archive the draft |
| DUNEMAW-ARENA | 888 | the bowl level design | BUILT ("no map kept here") | glossary "great cavern" | merge into DUNEMAW-SPEC |
| DUNEMAW-EXTREME | 1205 | raid-style timeline for the Great Slip Jelly | BUILT | glossary Lip Stone/cast/wipe | merge into DUNEMAW-SPEC |
| DUNEMAW-SYSTEMS | 978 | crown, nursery, finds, Strawman | BUILT | STRAWMAN, DUNES, TESTROOM | merge into DUNEMAW-SPEC |
| DUNES | 126 | geysers, Solar Skiffing, "bigger" | geysers/trial BUILT; bigger NOT built | DUNEMAW-SYSTEMS | merge into DUNEMAW-SPEC (keep 1 line "bigger: open") |
| GARDEN-SWEEP | 1261 | garden sweep findings | BUILT (78 pass, 0 fail per SWEEPS) | SWEEPS.md | archive; keep checks in scripts/ |
| MYCELIUM | 3436 | fungi, World Mushroom, spore beds | BUILT as data (14 checks pass); look in glossary | glossary has ~2 paragraphs of it; GARDEN-GENRES | trim 50%; wiki page "The Mycelium"; spec merged into GARDEN-SPEC |
| OVERLAY | 812 | HUD/"overlay" rules, no words or numbers | LIVE (rules) (?) | CLAUDE.md Feedback; OVERLAY-LOOK | merge with OVERLAY-LOOK into UI-OVERLAY |
| OVERLAY-LOOK | 865 | Calissa's look section | LIVE (?) | OVERLAY | merge |
| PARRY | 583 | V parry per tool | BUILT | glossary "the parry" (near-complete table) | archive; wiki page |
| PARRY-CLIPS | 555 | which UAL/CMU clips each parry plays | BUILT; reference table | animation code | keep as spec (a table), merge into PARRY page |
| PASSAGE | 4955 | sea chart, portents, trip pressures | LIVE/partly built (?) | RAIL-OVERHAUL, ROUTE-MAP, ~10 glossary entries | merge into RAIL-SPEC; trim 50% |
| QAIS | 738 | the in-game test window | BUILT | BUGREPORT, glossary QAIS/Brief/round | merge with BUGREPORT; keep as spec |
| RAIL | 1953 | original rail shooter | "Built"; pacing SUP by RAIL-OVERHAUL | RAIL-OVERHAUL says it revises RAIL | merge into RAIL-SPEC, drop the superseded pacing |
| RAIL-OVERHAUL | 3385 | rollercoaster rework | LIVE; much built (pattern library "built") | RAIL, PASSAGE, glossary rail entries (very long) | merge into RAIL-SPEC |
| SHRINES | 444 | Shrines, Wake Whistle | BUILT | glossary Shrine/Wake Whistle | archive; wiki page |
| SLICE | 1257 | vertical slice: 1 Well, 1 fight, 1 hop | BUILT | SYSTEMS, DESIGN.md s11 | archive |
| SOUL-ALCHEMY | 10262 | system spec plus Calissa's UX (s4: 24 subsections) | LIVE; s3.1 built, UX partly (?) | glossary has a 300-word press entry, twice | split: wiki page (s1-3, 5-7a) and a lean UX spec; archive the rest |
| SPIRIT-GARDEN | 2963 | the garden as a place | mostly BUILT (28 "built" mentions), some not | glossary Inner Realm, MYCELIUM, GARDEN-SWEEP | merge into GARDEN-SPEC; wiki page |
| STRAWMAN | 232 | test dummy | BUILT | DUNEMAW-SYSTEMS, TESTROOM, glossary x3 | merge into TESTROOM, archive |
| SUNSHINE | 162 | water and paint, Petra's note | BUILT | SUNSHINE-SYSTEMS | merge into SUNSHINE-SYSTEMS |
| SUNSHINE-SYSTEMS | 818 | brush load, bottles, stains | BUILT except achievements, coated folk, water/slip loads (not built) | glossary brush entries | trim; keep "not built" list as a spec |
| SWEEPS | 1859 | room sweeps | LIVE, tool doc | GARDEN-SWEEP, CLAUDE.md, glossary | trim; keep as testing spec |
| SYSTEMS | 1044 | the backlog in dependency order | likely stale (?) | BUILD, SLICE, DESIGN.md | archive after checking the backlog |
| TEMPERAMENT | 858 | grain: five mind traits | data BUILT; minds reading it NOT built | AI.md, glossary grain | keep as spec |
| TESTROOM | 324 | Throwing Room | BUILT | glossary, STRAWMAN | archive (absorb STRAWMAN) |
| TRAINING | 2390 | how the Courier grows; knacks | LIVE; knacks built | DESIGN.md s22, CLAUDE.md design laws, glossary knack | trim; wiki page "Progression" |
| WEATHER | 399 | emotional weather and the day | BUILT | glossary weather/phases; WHEEL | merge with WHEEL |
| WHEEL | 1228 | Plutchik's wheel mapped to systems | PARTLY built (aspects/agates built; Faith/Gall/Fury not) | WEATHER, glossary "the wheel/five feelings/agate" | merge with WEATHER into FEELINGS wiki page |
| research/GARDEN-GENRES | 7510 | genre survey for the garden | research, "not a ruling" | MYCELIUM cites it | archive (docs/archive/research) |
| research/RAIL-PATTERNS | 1615 | bullet patterns, boids, warp | research, consumed (patterns.js built) | RAIL-OVERHAUL s7 | archive |
| research/RAIL-SETPIECES | 1521 | rail shooter set pieces | research, consumed | RAIL-OVERHAUL | archive |
| research/ROUTE-MAP | 790 | Slay the Spire map study | research, consumed | PASSAGE | archive |

## (1) Clusters to merge

- **Rail and the sea** -> `docs/specs/RAIL.md` (spec) plus wiki "The Crossing". Sources: RAIL, RAIL-OVERHAUL, PASSAGE (about 10,300 words). RAIL.md says OVERHAUL replaces its pacing, so RAIL's superseded half goes. Target spec about 4,000 words. Research files (4,300 words) go to archive/research, with one bibliography line each.
- **Great Dunemaw** -> `docs/specs/DUNEMAW.md`. Sources: DUNEMAW, -SYSTEMS, -ARENA, -EXTREME, DUNES, STRAWMAN (about 6,900 words). All built, and numbers live in `src/progress/combat/dunemaw.js`. Target about 2,000 words: what the fight must do, plus pointers to the data.
- **Spirit Garden** -> `docs/specs/GARDEN.md` plus wiki "The Spirit Garden". Sources: SPIRIT-GARDEN, MYCELIUM, GARDEN-SWEEP's still-open items, and research/GARDEN-GENRES as a bibliography only (about 15,000 words). Target about 4,500.
- **Soul Alchemy** -> keep its own page, but split: wiki "Soul Alchemy" (s1-3, 5-7a, about 2,500 words) and `specs/SOUL-ALCHEMY-UX.md` (s4, which is about 6,000 words of pixel-level spec for one station). Section 4.26 (prior art) can shrink to a list. Section 4.25 "Who builds what" is a task list, not a spec; delete once done (?).
- **Feelings** -> wiki "The Five Feelings": WEATHER, WHEEL, plus the glossary's weather, agate and wheel entries. Target about 1,200 words.
- **Parry** -> wiki "The Parry" (PARRY, PARRY-CLIPS table, glossary "parry" entry; about 1,000 words).
- **Testing** -> `docs/specs/TESTING.md`: SWEEPS, GARDEN-SWEEP, TESTROOM, DEBUG-CHESTS, QAIS, BUGREPORT (about 5,600 words -> about 2,000). Debug-chest rule already in CLAUDE.md, so it need not appear twice.
- **UI language** -> `docs/specs/OVERLAY.md`: OVERLAY + OVERLAY-LOOK + CRUCIBELLE-UI's lasting rules (about 2,700 -> 1,200).
- **Brush** -> SUNSHINE + SUNSHINE-SYSTEMS into `specs/SOUL-BRUSH-LOAD.md` (about 700 words).

## (2) Fully built, archive-ready (with a wiki page where the player-facing idea matters)

BUILD, SLICE, SHRINES, PARRY (PARRY-CLIPS stays as table), TESTROOM, STRAWMAN, DUNES (after logging "bigger: not built" somewhere), SUNSHINE, GARDEN-SWEEP, CRUCIBELLE-UI, BUGREPORT, QAIS (after merge), DUNEMAW-ARENA/-EXTREME/-SYSTEMS/DUNEMAW (after the lean spec exists), WEATHER, SYSTEMS (if its backlog is all done; I did not check item by item), and all four research/ files. Roughly 28,000 words move out of the live set. Caveat: "built" is each file's own claim; I did not verify the code. BUILD.md claims 0 unbuilt events as of v98, but PASSAGE, RAIL-OVERHAUL, MYCELIUM and SOUL-ALCHEMY are newer than v98.

Not archivable yet: TEMPERAMENT (minds reading grain not built), WHEEL (Faith, Gall, Fury not built), SUNSHINE-SYSTEMS (achievements, water/slip loads not built), COOP (guests/letters, status unclear), TRAINING, PASSAGE, RAIL-OVERHAUL, SOUL-ALCHEMY UX.

## (3) Worst readability offenders

Pattern: every sentence carries a code path, a glossary term, a person's name, an owner quote and a date. The cause is plans written as logs ("Kept by Dovina", "ruled 2026-10-08 on Calissa's eight", "(new)") that never get rewritten once built. The glossary itself has the same problem: its "press at the Athanor" entry is about 300 words in one bullet and appears twice with different text (once with "a stand-in", once with Calissa's look), against its own one-word-one-meaning rule.

1. SOUL-ALCHEMY s3.5, 'Where it stands':
   > "At **the Athanor**, the basin at the press's feet (section 4.2). **The press's formation** (its planetoid's features and ground in Wu Xing) **sets the fuel, never the radius**: the map the eye is learning keeps its size however the garden is laid out. It shows in the Athanor's vent and the price in the log, never on the bath."
   Plain: "How your garden is laid out changes how much a firing costs, but never how big the colour wheel is, so what you learn about the wheel always holds. You see the cost in the log and the Athanor's vent, not on the wheel."

2. SOUL-ALCHEMY s4.4 (typical of the whole of s4):
   > "So how grey the soul is reads as how pale and shallow the water under the bead is, for every eye."
   Plain: "The greyer your soul colour, the paler and shallower the water looks under the bead." (The same section spends three bullets on the dish before saying what the player sees.)

3. PASSAGE intro:
   > "a portent is what Divination tells of a waypoint: not 'forecast', which is the weather's... the survey is **the reckoning** (one word: `RECKON` already is it)"
   Plain: "At the pier you draw a route through a map of stops. Divination hints at what each stop holds; the further ahead you look, the vaguer the hint." (The owner's own quote in the file says it this simply.)

4. PASSAGE/RAIL: "Exists: three islands on a line (`NODES`), a hop's fuel, distance and danger (`hop()`), one to three legs (`legsOf`), the crossing as a pure function of route, game day, cargo, the Leviathan's deck and weather (`crossing.js` `script()`)"
   Plain: "Today there are three islands in a row. A crossing has one to three set pieces, and what happens in it is fixed by the route, the game day, your cargo and the weather." Code names belong in a spec footnote, not the sentence.

5. COOP: "C2, what was pressed: replays, `game.replay`; `/replay save`, `/replay load`."
   Plain: "Recording: any session can be saved and replayed exactly (/replay save, /replay load)." Item labels like "C1, the same twice" tell a reader nothing.

6. MYCELIUM intro buries what it is under quotes. Plain: "Mushrooms in the Spirit Garden turn one item into another. Plant an item in a bed and a fungus changes its colour or splits it into other materials. A big tree at the garden's centre eats anything you feed it." (The glossary's version of this is one 350-word bullet.)

Other heavy files: RAIL-OVERHAUL (glossary has about 12 long entries on the rail that duplicate it), TRAINING, GARDEN-GENRES (7,500 words of survey that nothing links to except MYCELIUM).

## Suggested layout

- `docs/wiki/`: ~10 plain-language pages (Crossing, Spirit Garden, Soul Alchemy, Feelings, Parry, Tools, Progression, Great Dunemaw, Shrines). 300-1,200 words each, no code paths, no division names, no dates.
- `docs/specs/`: the lean internal specs listed above, each with "what's built / not built" at the top.
- `docs/archive/`: history and research.
- Glossary: trim entries to one or two sentences plus code id; move the 300-word entries' detail into the specs. Fix the duplicated press entry first.
Total: 64,000 words -> roughly 25,000 live (wiki about 9,000, specs about 16,000).
