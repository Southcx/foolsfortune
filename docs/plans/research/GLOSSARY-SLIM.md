# Glossary split report

Files (all in the scratchpad): GLOSSARY.md (core), GLOSSARY-DETAIL.md (reference), build.py + core_src.txt + tables_src.txt + demote.txt (the build, rerunnable).
Detail file name assumed to land at docs/GLOSSARY-DETAIL.md (the core's intro points there).

## Numbers
- Original: 1203 lines, 22,569 words, 345 entries.
- Core: 5947 words (whitespace tokens, tables included), 171 entries, plus 33 homonym rows (34 originally, two rank rows merged) and 5 retired rows, 12 sections (10 content + the two tables). Intro + rules: 120 words. Every entry wraps to at most 2 lines at ~146 chars; one entry is 42 words (the sea chart cluster), a few are 36-40 because they merge two terms.
- Detail: 21085 words, 331 entries (345 minus 14 merged-away copies), same 10 content sections, sorted by term ignoring a leading the/a/an.
- Verification by script: 1,075 distinct bold terms in the original (per entry, tables included); 0 missing from core+detail combined (whitespace-normalised).
- Core entries ending "→ detail": those whose original had materially more.

## Where it differs from your brief
- Section count: 10 content sections + "Homonyms" + "Retired" = 12. Music is folded into "What the game shows and sounds"; money into "Lachryma, feelings, weather and money"; tools and moves are one section.
- The detail file is NOT verbatim for entries in the merged groups (below) and for nothing else: every other entry is the original text byte for byte (continuation lines kept).
- The core's rank row merges the two original "rank" rows into one (five meanings). Nothing dropped; say if you want two rows back.
- Homonym and retired rows are tightened, not quoted. I dropped dates and "the owner" attributions from retired rows ("the owner, 2026-10-06", "R42" kept where it is a place). Retired "where it still is" cells kept.
- Core-only wording changes of substance (tell me if wrong): "the Vessoul" lost "Solar Skiff is a limb" (kept in detail); Anagami Island and Kaolin Anagami folded into the "an Island of Ego" line; "asking a sibling" and "letter" share one line; "Figment" and "Egregore" share one line; "commission/bounty" is one line (the original has it twice).

## Duplicates merged (in detail; core has one line each)
1. the press at the Athanor (2 copies; the first is cut off at "counting the Athanor's"): first copy's full text + the second copy's ending (features, ground, water; fuel divided by it, Dovina's ruling 3; Not: the plate shrine). The old copy's "its look a stand-in, pressbath.js" is kept as a bracketed note.
2. the Great Dunemaw (3: Creatures, Records, World): the game.well entry as base + the look copy (mouth as a spinning black labradorite pool, the kit) + the lore copy (a Well, so it drifts; Not: the Weir's Well).
3. Strawman (3): one hand-merged entry (Pip stitched it; never falls; ledger never counts; bout; sack doll look; no article).
4. sibling (2): base is the code entry; the lore copy is appended as "Also, second copy".
5. cask (2), the Purser (2), the Pithos (2), the Gnomon (2): hand-merged.
6. ostracon (2: Records and World): base + appended second copy (which adds stele/STELAE wording and Not: sherd, plate). "an ostracon's look" stays its own entry.
7. commission / bounty (2): base + appended lore copy (Seger, Letty Marque, Poll).
8. mental state (2, same word two meanings: the Courier's and the creatures'): joined in one entry, as the first copy already says "one word for both".
9. the overture (2: the trailer/music one and Wanda's cue one): joined, both kept.
Charybdis appears once, but it carries "the Drowned Light", which is also its own entry (kept in both places, not merged).

## Disagreements between copies (kept both in detail; core follows the more specific)
- blot: the Soul Brush entry (settled by the owner, 2026-10-06) makes "blot" the player's word (code id stain), while the World section's blot entry calls it Espada's proposal, "pending Dovina's rename; until then 'stain' holds". The core uses blot (the Soul Brush's, later and settled). Needs a ruling; the lore copy is stale or the Soul Brush one premature.
- the Pithos: urn ("broken urn it grew in", vfx/urncrown) vs "broken crude jar" (lore). Probably the same pot in two words; I kept both.
- the Great Dunemaw's mouth: "spinning black pool of the Mind's labradorite in the sand" (vfx) vs "dark turning pool ringed in stones" (world). Compatible, both kept.
- the Gnomon's file: `world/dunes/solar.js` vs `dunes.js`. Core uses solar.js.
- the Great Dunemaw: Places has "the owner's name, R57; not 'the Swallow'"; the World copy says only "the slice's Well". Compatible.
- sibling: code copy says "a mind of its own"; lore copy adds "temperament and a tool of its own, steered through the game's db".
- the press at the Athanor: the early copy says its look is a stand-in; the long copy says Calissa's look (PressLook). Core follows the long one.
- A stray sentence ends the lore "sibling" entry: "They go out across the Emocean and resist excess Lachryma best." It belongs to the "Couriers" entry (line 1117) and looks like a merge accident. Kept in place in detail; not in core.
- "the checklist" is marked retired in its own entry (Engine section) but is missing from the Retired table. "polarity" is superseded by the Astral/Umbral entry but not in the Retired table either. Not changed.
- "the crown" is used for the Great Slip Jelly's urn, for the ripple tank's splash (waterfx) and in "the urn crown"; no homonym row. Not changed.
- Two original "rank" homonym rows (merged in core, see above).

## Demoted to detail-only (no core line of their own)
Deliberately cut from the first 241-line draft: 68 core candidates, plus everything below that I judged look jargon, single-module or one-division. Complete list of terms with no core entry:
the co-op meter; Couriers; God Arts; the hand's clips; the Jar's clips; kintsugi; region; a rig's clips; shield; voice card; amethyst; aqua regia; bauble; converter; deck; dupe; fret; livelihood; pity; prestige; profile; the stave; the wheel; worth; friendly fire; the hands; hard landing; idle break; the jet arts; kick-off; outcome; projectile; the skiff's clips; the skiff's model; stance; ultimate; clutch; cogitohazard; Contractor; enrage; the Lantern Wisp; Magnus Ibrahim Manus; the ram; stimulus; an arch; the daylight; a drift tide; fill; the flythrough; the great cavern; the ground's drift; the Index; a lane; lap circuit; the Lip Stone; the maw wipe; the movement lab; a plaster patch's look; rock; a sandfall; a slip geyser; the socket; the Solar Skiffing trial; sparkle; the spout; a stele's look; the stele's sandstone, laid; the time trial; the twist; the Wake Whistle; warped artifact; a cascade; a garden tree; the garden's rain; the garden's views; the garden's water; the keepsake pot's look; the leaf canopy; moonflower; Myggdrasil's look; the plants; the press's marks; a sporeling's look; the strains' looks; terraforming; a track; the ambient geometry; a boss part; a continue; the drawn surface; the Drowned Light; an encounter's film; a figure; a glint's spark; the hurtbox; an Itano ribbon; lane mark; a laser's warning thread; a leg's schedule; a lighthouse lamp; the lock-on; the mooring; polarity; the rutter's model; the sea chart's look; the shoal's silhouette; the storm warp; the telegraph mark; a vantage; the veil; voyage; the wreck field; the Crib Sheet; the loops; mastery dividend; the arranger; the art bible; the black; a busker's mat; the data drain; the grey tint; ground marks; the ground pack; the liquid pack; neume; the night alive; the overhead map; the ribbon of light; a ripple; the ripple tank; sequence; a skirt; the stack; triplanar; the wire compass; the bridge; the Brief; bug report; the checklist; the markup window; rest bake; service; the workbench.
Some of these are still mentioned inside a core line (the Index, the movement lab's wings are in "the basement"/"the hub"; Couriers is covered by "the Courier"; the stave/fret by "crystal"). The sea chart cluster, boss parts and the trip's pressures were shortened to one line each, with the sub-terms in detail.

## Things I was unsure about
- "player sees or does it" is generous in places; I cut mostly on that basis: ledger-facing numbers (pity, worth, the aim kept), small rooms of the basement, the garden's sculpt/water/rain, the rail's drawing words. Restore any you want; they cost about 25 words each.
- The core line for "the Courier" gives two code names (`player`, `character`) and one path; "the shore", "the tuning panel" etc. keep one path where the original had several.
- Some "Not:" clauses in the original were folded in sub-parts; the core keeps only the main one.
- Tightening the intro: rule 2 drops "Espada's (and the owner's)" wording to "player words: Espada and the owner; code names: Petra at the gate". Rule 3 text is shorter. Say if that changes what you meant.
- I did not touch the repository, CLAUDE.md or docs/ (CLAUDE.md imports `@docs/GLOSSARY.md`, which will keep working when the core replaces it; its "ARCHITECTURE" line count rules are untouched; nothing checks the glossary's line count that I saw, but `npm run check` refuses retired words, so verify it still passes with GLOSSARY-DETAIL.md in docs/).
