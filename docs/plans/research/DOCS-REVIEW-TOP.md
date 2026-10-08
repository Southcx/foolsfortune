# Review: top-level docs (README, CLAUDE, docs/*.md)

Method: read headings/openings of every file, sampled bodies (not every line). Word counts from `wc -w`. "Unsure" flagged. No repo files edited.

## Per-file table

| File | Owner | Audience | Words (lines) | What it is | Status |
|---|---|---|---|---|---|
| README.md | Petra (default) | player/owner + code readers, mixed | 6,904 (462) | Run commands + a full player manual (keys, moves, 7 tools, god hand, places, creatures, economy, log, sound, look) + testing + asset credits | partly stale; wrong job |
| CLAUDE.md | Petra/owner | Claude sessions | 2,331 (154) | Working rules + thread/ownership table + division voices + glossary import | live (dense) |
| docs/GLOSSARY.md | all (Espada words, Petra code names) | Claude sessions, divisions | 22,569 (1,203) | Binding dictionary; also doubles as a system encyclopedia | live; oversized |
| docs/CASEBOOK.md | all | divisions | 30,505 (1,801) | Bug log: 18+ short rules, then ~1,450 lines of dated cases | live; 33% of all words |
| docs/LORE.md | Espada | owner, divisions | 9,870 (613) | Series bible + §11 "Open" holding dated proposals | live; §11 is changelog-like |
| docs/DESIGN.md | Dovina | owner, divisions | 4,575 (385) | Design bible; §1-5 timeless, §7-8 audit/proposals, §10-22 dated rulings | partly stale |
| docs/AI.md | Petra (creatures) | divisions, Claude | 2,408 (196) | Creature mind parts + how to make a creature | live |
| docs/ART.md | Calissa | divisions | 2,355 (144) | Art bible: colour meanings, damage looks, glazes, placeholder audit | live; §7 audit goes stale |
| docs/OST.md | Wanda | owner, Wanda | 2,452 (135) | Soundtrack plan, leitmotifs, cues | live |
| docs/ARCHITECTURE.md | Petra | divisions | 2,190 (176) | Layout, module contract, budgets, gate, handover | live |
| docs/ECONOMY.md | Dovina | owner, Dovina | 1,757 (149) | Faucets/sinks per minute of play, shops, glamour, livelihoods | live (numbers drift) |
| docs/LOOK.md | Calissa | divisions | 628 (51) | Visual precepts | live; overlaps ART/VFX |
| docs/VFX.md | Calissa | coders | 658 (59) | How to call `game.vfx.play`, data-driven effects | live |
| docs/voice_recording.md | Wanda | owner | 438 (41) | Plan for owner recording voice; "nothing recorded yet" | live, minor |
| docs/CIRCUITS.md | Dovina/Petra | owner | 260 (20) | Lap circuit design + runner contract | live; tiny |
| docs/HANDOFFS.md | Petra | divisions | 168 (13) | Mailbox protocol | live; fold into CLAUDE/ARCH |

Total ~90k words; GLOSSARY + CASEBOOK = 59% of it.

## Problems and recommendations, by file

**README.md** (see the dedicated section below).
- It says "This page is the manual" yet is 462 lines; ~line 36-405 is gameplay manual (Keys 49, Moving 79, Tools 117-225, god hand 225, Places 248-341 = 93 lines, Creatures 341, Things/money 360, Log/Codex 380).
- Duplicates GLOSSARY (tool and place definitions), DESIGN §2 ("What each thing is for"), ECONOMY (Things and money), ARCHITECTURE (look/perf paragraph at ~402-410, "Engineering notes").
- "Progress belongs to the build" and STORY-off notes are dated residue (owner 2026-10-04).
- Credits/asset-export recipes (~432-462) are tooling docs, not README.
- Document index table (20-34) omits plans/, CASEBOOK in the table (mentioned only in prose), ART.md, HANDOFFS partly.
- Rec: rewrite short (~100-150 lines); move manual into docs/wiki/.

**CLAUDE.md** (154 lines, 2.3k words; plus 22k imported glossary = ~25k words loaded every session).
- Mixes four things: design laws (Design laws, Animation, Feel), code rules (Feedback, Performance), org chart (Threads), and character voices (the five "Voices" bullets ~25 lines). Voices and branch/session ids are useful to few tasks.
- Several rules dated "(the owner, 2026-10-07)" - rationale residue; fine, but long.
- Rec: keep as the agent rulebook, trim to ~1,200 words: move Voices + session ids + "How work lands" to docs/TEAM.md (or HANDOFFS.md merged); keep rules. The bigger context cost is the GLOSSARY import (see below). Unsure whether the owner wants the glossary always-loaded; it was an explicit ruling (2026-10-07), so any change is the owner's call.

**GLOSSARY.md** (22.5k words).
- Contains encyclopedic entries of whole subsystems (e.g. the press at the Athanor appears twice, the second a stale duplicate paragraph of the first; "Great Dunemaw", "Strawman", "the Gnomon", "ostracon", "sibling" each defined 2-3 times in different sections). Single entries run 200-400 words with file paths and numbers (the Myggdrasil, Spirit Press, Rail entries).
- Mixes definitions with specs/lore/art (Calissa's looks, hex values, pixel sizes).
- Rec: keep binding, but cap entries at ~2 sentences + code id + "Not:"; move the descriptive depth to wiki pages; dedupe repeated entries. Target ~8-10k words. Split option: GLOSSARY.md (terms) + docs/wiki/*.

**CASEBOOK.md** (30.5k words).
- Lines 1-354: ~50 numbered rules (good, valuable). Lines 355-1801: ~100+ dated cases, each 10-30 lines; 2026-10-08 alone is dozens (many "found in review" shader/perf fixes).
- Rec: keep rules file as `docs/CASEBOOK.md` (rules only, grouped by area: rendering, physics, animation, save, perf, headless testing); move cases to `docs/casebook/YYYY-MM.md` archive (still grep-able). CLAUDE.md requires "every bug gets a case" - keep that, just in the archive.

**LORE.md** (9.9k).
- §1-10 are a real bible. §11 "Open" (lines ~378-590, >200 lines) is a pile of dated proposal sections ("proposed, 2026-10-08"): knacks, seals, ostraca, round robin, passage, encounters, trip pressures, mycelium - names for features, i.e. a changelog of naming proposals.
- Rec: keep §1-10; fold §11 sub-sections into per-system lore on the wiki pages (or LORE-names.md) once ruled; leave only truly open questions under "Open". Marked "proposed" vs "canon" inconsistently.

**DESIGN.md** (4.6k, "section numbers are cited by code: keep them stable").
- §1-5 (goals, what each thing is for, progression, economy brief, ledger) are the nucleus of the wiki. §7-8 (audit, proposals "Still open", "Numbers with no reason yet") are a snapshot, partly fixed. §10-22 are dated rulings ("Rulings of 2026-10-04, evening"), a chronological changelog, overlapping ECONOMY (§4), LORE (§20 stones), plans/RAIL (§21), plans/WEATHER (§18-19), SPIRIT-GARDEN (§16).
- Constraint: code cites section numbers, so do not renumber; replace moved sections with a one-line pointer.
- Rec: split: keep DESIGN.md as laws+rulings log; extract the timeless parts into wiki pages; move §7-8 audit to docs/plans/AUDIT.md.

**AI.md** (2.4k): good structure (picture, parts, example, how-to, prior art). Minor: §5 "Next" is a to-do. Rec: keep; it is already wiki-shaped; move to wiki/creatures.md or link.

**ART.md** (2.4k): §7 audit table and the top-of-file note about the "E-ink mask rolled back (d4872d0)" (appears misplaced under §6 Courier's face) are change residue. Overlaps LOOK.md (both start with "what things look like") and VFX.md. Rec: merge LOOK into ART as "Precepts" section (628 words), keep VFX separate (it's a coder how-to); move audit to plans.

**OST.md** (2.4k): §6 "The owner's ear" (Spotify, dated reads) and §7 "Open" are residue; rest live. Cue list will rot as music changes (the code is `src/music/`). Rec: keep, trim §6 to a few lines. Wiki page: sound/music summary only.

**ARCHITECTURE.md** (2.2k): live and binding. "Open restructuring" (line 172) and "The handover" belong to process. Rec: keep; maybe move gate/handover into docs/TEAM.md with HANDOFFS.

**ECONOMY.md** (1.8k): live but numbers duplicate output of `scripts/economy.mjs` (§"What each profile earns" lines 20-36 will drift). Rec: keep; replace the table with "run the script" and a dated snapshot; livelihoods (83-142) is wiki-worthy.

**LOOK.md / VFX.md / voice_recording.md / CIRCUITS.md / HANDOFFS.md**: small and fine. CIRCUITS duplicates README's "Lap circuits"; voice_recording is a task brief for the owner (archive after recording). HANDOFFS: merge into CLAUDE.md or ARCHITECTURE.md ("The handover").

## docs/handoffs (49 notes; judged by names/dates only, contents not read - unsure)
Likely stale/done (completed round tasks, past-tense subjects): everyone/ round-robin notes (2026-10-07 petra/wanda round-robin, haiku-subagents, letters, the-owners-order, your-sibling); espada/ garden-sweep and room-sweeps (10-07); petra/ garden-sweep, loco, the-suite (10-07) and petra-open (a backlog, may stay). Likely live (10-08, in-flight rail/passage work): dovina/ trip-pressures, passage-words, encounter-names; calissa/charybdis; petra/ boss-parts, rail-overhaul, swarm-geometry; wanda/ silhouette-sounds. Un-dated files (espada/dovina-*.md, petra/dovina-*.md) break the naming rule in HANDOFFS.md and look like long-lived duplicates of the dated trip-pressures notes (dovina-trip-pressures exists in both espada/ and petra/, plus dated variants). HANDOFFS.md says the reader deletes a done note, so every note still present should be either live or forgotten; only today (2026-10-08) is within a day of all of them, so little is provably stale.

## Duplications to fix (summary)
- Tool/place/creature descriptions: README vs GLOSSARY vs DESIGN §2 (three copies).
- Economy: README "Things and money" vs ECONOMY vs DESIGN §4.
- Look/perf spec: README "How it is drawn" vs ARCHITECTURE Budgets vs CLAUDE.md Performance vs LOOK.
- Lap circuits: README vs CIRCUITS.
- Process: CLAUDE.md Threads/How work lands vs HANDOFFS vs ARCHITECTURE gate/handover.
- Pronouns/Courier rule stated in CLAUDE.md and GLOSSARY.
- Spirit press: two stacked "the press at the Athanor" glossary entries (stale pair).

## README.md in depth

Now (a manual of ~6.9k words): intro; run commands; doc table; starting; keys; moving; Lachryma/shield; 7 tools; god hand; places (93 lines); creatures; things & money; log/Codex; sound; how drawn; testing; engineering notes; credits + Blender export commands.

Owner reading fresh needs: what the game is in a paragraph, what state it is in (the slice that exists), how to play it now (link to artifact/build + keys cheat-sheet), what to try, where the docs are, and which doc to open for which question. Does not need engine/module details.
New Claude session needs: one-paragraph orientation, how to run/check/test (the commands exist), the repo map (src/ top-level dirs; ARCHITECTURE has it), the read-first list (CLAUDE.md, GLOSSARY, ARCHITECTURE, CASEBOOK rules), where plans live and the "how work lands" pointer. Mostly already in CLAUDE.md/ARCHITECTURE; README should only point.

Proposed outline (headings only):
1. What Fool's Fortune is (3-4 sentences + one screenshot)
2. Where it stands (what is playable now; build/version; what is missing)
3. Play it (published link, `npm run dev`, DEBUG vs STORY, keys cheat-sheet in a 12-row table)
4. The game in one page (the loops: moment/session/long run; links to the wiki)
5. Game systems wiki (index table linking docs/wiki/*)
6. For contributors and Claude sessions: read first (CLAUDE.md, GLOSSARY, ARCHITECTURE, CASEBOOK rules)
7. Commands (dev, build, check, perf, stress, qais, sweeps, agent bridge)
8. Repo map (src/ dirs, docs/ dirs, source_assets, scripts)
9. How the team works (five divisions, branches, handoffs: one paragraph + link)
10. Design records (DESIGN, plans, casebook, handoffs: what each is)
11. Credits and licences (move the export recipes to docs/PIPELINE.md)

## Proposed docs/wiki/ structure

Rule: wiki pages are player-/owner-facing explanations of what the system is and does, 300-900 words, one "How it plays", one "Why it is built so" (the lesson/law), one "Where the details are" link list. Internal specs stay in docs/plans/, DESIGN.md, ARCHITECTURE.md, AI.md, CASEBOOK.

| Page | Draws from | Stays internal |
|---|---|---|
| index.md | README outline + glossary heads | |
| the-courier.md (vessel, shield, cracks, stones, mental state, draught) | README Lachryma/shield; GLOSSARY Courier block; DESIGN §20; LORE §4 | plans/SYSTEMS |
| movement.md (core moves, Movement Arts, parry, skiff, emotes) | README Moving; GLOSSARY Moving; DESIGN §9, §22 | plans/PARRY, PARRY-CLIPS, SUNSHINE* |
| tools.md (+ one short section per tool, or 7 sub-pages) | README Tools; GLOSSARY tools block; DESIGN §2 | moveset specs, CRUCIBELLE-UI |
| combat.md (damage types, status, mental state, EmO, grain, friendly fire) | GLOSSARY creatures/records; DESIGN §12-13; AI.md summary | plans/TEMPERAMENT, WHEEL |
| creatures-and-ai.md | AI.md §1-3 | AI.md §4 how-to stays |
| wells-dunemaw.md | README Places; GLOSSARY Great Dunemaw entries; DESIGN §13 | plans/DUNEMAW*, SLICE |
| the-dunes-and-workshop.md (places, Shrines, rooms, basement, circuits) | README Places; CIRCUITS; GLOSSARY Places | plans/DUNES, SHRINES, TESTROOM |
| emocean-and-the-rail.md (ships, crossing, legs, passage, trip pressures, encounters) | GLOSSARY rail block; DESIGN §21; LORE §11 passage/encounters | plans/RAIL, RAIL-OVERHAUL, PASSAGE |
| spirit-garden.md (planetoids, god hand, mycelium) | README god hand; GLOSSARY Inner Realm; DESIGN §16 | plans/SPIRIT-GARDEN, MYCELIUM |
| soul-alchemy.md | GLOSSARY Soul Alchemy/press; DESIGN §16 | plans/SOUL-ALCHEMY |
| weather-and-feelings.md (five feelings, agates, weather, day) | GLOSSARY feelings; DESIGN §17-19 | plans/WEATHER |
| economy.md (cubes, shops, Tithe, livelihoods, glamour sink) | ECONOMY; README Things and money; DESIGN §4 | scripts output, tables |
| progression-and-ledger.md (arts, knacks, achievements, standing, Luck, laws of progression) | DESIGN §3, §5, §22; GLOSSARY records; plans/TRAINING | audit |
| folk-and-lore.md (world, Prince, Courier, tiers, people, tone) | LORE §1-10 (digest) | LORE.md stays the canon |
| the-log-and-codex.md (feedback rules, QAIS for the player's eye) | README log/Codex; CLAUDE Feedback | plans/QAIS, BUGREPORT |
| look-and-sound.md | LOOK, ART digest, OST digest | ART, OST, VFX stay |
| co-op.md (siblings, party, letters) | GLOSSARY co-op block | plans/COOP |

Stays as internal docs: CLAUDE.md, GLOSSARY.md (trimmed), ARCHITECTURE.md, AI.md, CASEBOOK.md (rules) + casebook/ archive, DESIGN.md (laws/rulings log), ECONOMY.md (numbers), ART/LOOK/VFX/OST/LORE (canon bibles), plans/, handoffs/.

Suggested order of work: (1) README rewrite + wiki index; (2) move CASEBOOK cases to archive (mechanical, biggest word cut: ~25k); (3) dedupe/shorten GLOSSARY (~12k cut, needs owner OK as it is binding and auto-imported); (4) write wiki pages from README's manual text before deleting it; (5) tidy DESIGN/LORE dated sections, leaving pointers because code cites DESIGN section numbers.
