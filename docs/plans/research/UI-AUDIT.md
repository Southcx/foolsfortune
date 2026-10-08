# UI jargon audit (player-facing text in windows, menus, pages)

Method: read the code that builds each window and the data tables that feed it. Nothing was edited. Scores: 1 clear .. 5 opaque.

## 0. The shared window and why it matters
Almost every page below is built with one helper pattern: `menu.showPage(name, render, {title, sub})` (src/feedback/indexmenu.js:78) and rows of `<span class="n">GLYPH</span><span><b>TITLE</b><s>SUBTITLE</s></span>` (indexmenu.js:111; copy-pasted as a local `btn`/`row`/`act` helper in pier.js, seachart.js, shrines.js, realm.js, mycelium.js, raising.js, hand.js, stage.js, triprun.js). A row has exactly three slots: a one-character text glyph, a bold title, a grey sentence. There is no slot for an icon image, a stat, a bar, a key prompt, a diagram or a cost chip. So every mechanic is forced into the grey sentence. This is the structural cause; fixing it once (a row with icon + title + 2-3 stat chips + optional picture) fixes all of the pages.
Windows that already do it better (use as the model): the shop (src/progress/shop/ui.js: item icon, price chip with "CUBES", stock beads, hover line), the Pneuka Box (src/pneuka/ui.js: icon grid, taste bars at :200, odds as coloured percentages at :225), the Codex card (progress bar plus "blinks: 12/30" at codex.js:206-258), the kiln (swatches, FIRE · N CUBES button, kilnui.js:77-104).

## 1. Window catalogue

| Window | file:line | Shows | Jargon |
|---|---|---|---|
| The pier (islands, ship, mounts) | src/world/emocean/pier.js:72-100 | Title "THE PIER", sub "click to choose · F closes". Groups "FROM <ISLAND>", "THE SHIP", "MOUNTS: KEYS 1 TO 2 AT SEA". Island row: "THE SEA CHART: <island>" / "fuel: N cubes · draft your passage, and reckon the sea, before you sail". Ship row: "SLOOP" / "bears 6 · 2 mounts · a charted passage only · cannot dive". Mount row: "the wake brush" / "aboard: <does>" | 5 |
| The sea chart | src/world/emocean/seachart.js:69-113 | Rows "RECKON THE SEA" ("hold the needle on the mark for four beats (today 40% reckoned)"), "REDRAFT", "CAST OFF" ("sails as: shoal, pirates" / "draft one waypoint in each of the 4 columns first"), "BACK". Hover text from WAYPOINT words (seachart.js:29-32): "the shoal", "the Wreckers", "the eyewall", "a sighting" | 5 |
| Encounter / heaving-to choice | src/world/emocean/triprun.js:44-52, 201-205 | Titles "THE DEAD RECKONERS", "THE LAST WORD", "THE CANTOR", "A RAFT ADRIFT", "THE BOURSE", "THE GLASS", "A DRIFT BOTTLE". Rows are ONLY the verb: "Follow them." / "Board the last ship." / "Take her bounty." / "Listen." / "Follow it down." / "Race your double." / "Let it pass." / "Caulk the hull." / "Reckon the sea." / "Take on fuel." The real consequence (encounters.js `does:`, e.g. "a hidden Umbral leg, richer") is never displayed; no cost, no risk, no reward shown | 4 (fine as flavour, but hides every consequence) |
| Continue? | src/world/emocean/stage.js:377-389 | "Continue" / "N cubes. The ship is mended and sails on."; "Let it break" / "Your Pneuka Jar is made whole at your last Shrine. You lose a quarter of the cargo." Header "THE SHIP CAN TAKE NO MORE HITS" | 2 (best page in the batch; arcade convention) |
| Shrine (rest, travel, party) | src/world/shrines.js:133-152 | "YOU REST HERE"; rows "The Spirit Garden / go in, as your Pneuka Jar", "<Shrine> / travel there", "THE PARTY (1 OF 2)", sibling "call" / "with you: dismiss" | 3 |
| Garden stand-in page | shrines.js:160-176 | "Slot 1" / "<enc>: N cubes waiting", "Bed 1" / "<kind>: ripe", "empty: plant a material from the box" | 3 |
| The Shed | src/world/garden/realm.js:350-358 | "The Pneuka Box / P opens it anywhere", "A new planetoid: <name> / N cubes · opens with the Second Firing · its seed goes in your hand..." | 4 |
| Name your Inner Realm | realm.js:194-200 | "NAME YOUR INNER REALM"; rows are two neuralese words with a gloss | 4 |
| Place a feature (garden) | src/world/garden/hand.js:222-246 | Rows "<feature> / a bed: a material planted grows more of its kind · 120 cubes and a material of its feeling" with five clickable coloured words "◆ wonder ◆ mirth ..."; sub "click a feeling beside a feature". Footer "3 more open with the Firings to come". FEATURES[].does at src/progress/realm.js:57-65 ("a formation stone: its neighbours count it twice in their formation", "a spore bed: a strain of fungus works what you set in it (progress/sporebeds.js); placed in a feeling..." leaks a file path into the string) | 5 |
| Plate Shrine (athanor) | realm.js:439-446 | "Awaken: <kind>" / "a plate of 3 stars"; empty: "photograph a creature with the Veritome, and its plate can wake one here" | 4 |
| Cocoon Tree | realm.js:449-462 | "Wake a fossil / the Awakening Song wakes what the Lachryma kept"; "choose two to merge into one"; "Two spirits make one here" | 3 |
| Spirit page | src/world/garden/raising.js:145-170 | One row: "<name>, mirth law" / "wonder 12 · mirth 30 ... · bond 40 · law · tired 22". Then "Feed: <mat>" / "raises mirth", "Drill: <name>" / "mirth", "Spar:", "Race: the 80 m track", "Come out with me", "Release it" | 4 |
| Spore bed | src/world/garden/mycelium.js:205-228 | "Inoculate with the oyster" / "it rots: material, curio, fish"; "Take it back / unchanged: the colony has not taken yet"; "about 3 game hours left" | 4 |
| Myggdrasil | mycelium.js:233-250 | Groups "THE CROWN / THE ROOTS / THE BRANCHES". "Pick the crown (3)", "feed it to the roots (worth 80)", "Hang <arcana> / the card given to its branch, for good: sporeling/sharp/fruit/seed" (the raw `adds:` code word shown to the player), "it fruits at dawn; fruiting bodies open: 2 of 10" | 5 |
| Shop | src/progress/shop/ui.js:68-115 | Icon + name + kind ("possibilikey", `it.kind` raw at :88) + stock beads + price in CUBES; hover "Buy X for N cubes"; footer "prices climb as the shelf empties and fall back in time · what a keeper has bought plenty of, it pays less for" | 2 |
| Kiln | src/courier/vessel/kilnui.js:77-120 | Tabs by region, swatches, "FIRE · N CUBES", hint "drag on the scene or A / D to turn the vessel... more glazes come from achievements and from good photographs". Glaze blurbs are the maker's pottery terms (kintsugi, yohen, kairagi) but shown as colour swatches | 2 |
| Pneuka Box | src/pneuka/ui.js:153-275 | Icon grid; footer "left click: the first action · right click: all of them · drag..."; WORN pane "the line · the fittings · the tools"; "THE LURE · ON THE SONDELASS' LINE / tie one on from the box"; "S.gun.name · N CHAMBERS" with "00 · 03 · 07" shell numbers (SHELL_TYPES `TYPE-00..10` with names CLEAVE, WELL, MARK, BANK, SEEK, ANCHOR, HATCH, glyph only); Lockheart odds as "%" list | 3 |
| Codex (arts) | src/feedback/codex/codex.js:149-258 | Tabs MOVEMENT ARTS, GOD ARTS, ANGLING, CURIOS, VERITOME, TOOLS, LEDGER, RECORDS, GRIMOIRE, SOUND TEST. Locked card: "· · · / NOT YET LEARNED / <hint> / bar / blinks: 12/30". Learned: "INPUT · <keys>", blurb, "FOLLOW-UPS", "VARIANTS" with "STANDARD / As it comes." | 2-3 (the progress bar and counter are the right idea) |
| Art hints | src/progress/skills.js:25-165 | Locked-card riddles: "It comes to those who dash", "Something about a great height, and a target that will not hold still", "Turn something back on whatever threw it" (a parry), "Spend a long while under" | 3 (riddles are deliberate, but the bar shows nothing until progress > 0 at codex.js:219-221) |
| Help pages | src/feedback/help/pages.js:22-247 | Per tool: lead sentence, [keys, effect] rows. Good key-first layout. Leads: "CASTER SHELLS: each a numbered type (TYPE-00 the Cleave to TYPE-10 the Hatch) held in a chamber", "the Celestial Brush: the world stops and turns to paper", "PAINT: spray Lachryma, laying its feeling on the ground · MOP: drink stains and paint into your Lachrymato Bottle" | 3 |
| Crucibelle songs | src/tools/crucibelle/songs.js:28-32 (shown in help and fittings) | "THE SONG OF SEEMING: A Courier of smoke where you stand: what hunts you hunts it" ; "THE RALLY"; "THE CALL"; "school: sight/heart/call" | 3 |
| Index rooms | src/world/basement/basement.js:466-474 | "THE COURSE / one loop, eight stations: run · mantle · gaps · wallrun · zigzag · climb · speed · low · splits and laps", "THE SIEGE / the hand's arena: raids come here", group names THE HUB, LAP CIRCUITS, THE HAND, THE OPEN | 3 |
| God Arts bar | src/godhand/arts.js:32-36 | TELEKINESIS "lift and throw", SUNDER "draw a blade", SWELL "grow or shrink", WRING "twist the clay", MANIFEST "raise clay" with a glyph | 2 (good: verb plus plain gloss) |
| Tuning panel | src/debug/tuning.js | Developer-facing sliders; out of scope | n/a |

## 2. The 15 worst rows, with fixes

Convention used below: icon + name + one plain sentence <= 8 words + stat chips (cost, cooldown, range as a number with a unit icon). Costs in Lachryma are the pool bar, so show them as a bar segment, not the word.

### 1. Mount: the wake brush (src/progress/rail/mounts.js:26, shown pier.js:95)
Now: "aboard: a fan of your feeling over the water ahead (50 degrees, 9 m): it drinks enemy shots of your feeling in it and cuts fish three to a stroke". Score 5: "your feeling", "drinks", a degree and a metre count, two effects in one sentence.
(a) "Shield Spray: soaks up shots that match your colour. Slices small fish."
(b) A top-down mini-diagram: ship icon with a 50 degree wedge, 9 m tick, little shots of the ship's colour turning into a Lachryma droplet. Key prompt chip [2] (the key is the slot number; show the real number next to the icon).
(c) Chips: COST 4 (pool), RANGE 9 m, ARC 50°, no cooldown. Hold-to-spray.

### 2. Mount: the gulp (mounts.js:28)
Now: "the coffin swallows a cone ahead for a second (35 degrees, 8 m): shots and Guppy-class fish, each 2 Lachryma to the pool". Score 5: "coffin", "cone", "Guppy-class".
(a) "Vacuum: sucks in shots and small fish for 1 second. Each one refills your energy."
(b) Cone wedge with arrows pointing in; shots sliding into a mouth; a +2 pool icon per item eaten.
(c) COOLDOWN 4 bars (show as seconds or a recharge ring), RANGE 8 m, ARC 35°, GAIN +2 each.

### 3. Mount: the toll (mounts.js:27)
Now: "the bomb: a ring that clears every shot within 10 m (14 on the beat), scatters a shoal, staggers boarders". Score 4.
(a) "Smart Bomb: wipes nearby shots, scares fish, stuns boarders."
(b) Expanding ring around the ship; a second larger ring flashing on the beat; three pips for the three charges.
(c) CHARGES 3 per crossing, RADIUS 10 m (14 m on the beat).

### 4. Mount: the plate (mounts.js:29)
Now: "a photograph of what is in frame (a set piece goes in the Compendium), and its Flash holds a weak point open two bars". Score 4.
(a) "Camera Flash: freezes a boss weak point open for 2 bars; photo goes in your collection."
(b) Camera-frame icon with a target ring; a "weak point" glyph held open with a timer ring.
(c) COST 6, COOLDOWN 4 bars, EFFECT TIME 2 bars. (Also: "snap" verb is fine.)

### 5. Mount: the hook (mounts.js:30) and the vane (mounts.js:31)
Now hook: "grapples what it is aimed at within 16 m: a cask or flotsam reeled aboard, a boarder yanked into the sea". Vane: "passive: the reckoning marks half again as early, the shoal's caller is shown, the Leviathan's breach is marked a bar ahead". Score 4/5.
(a) Hook: "Grapple: reels in loot and pulls enemies overboard." Vane: "Radar: shows threats earlier." (and list the three things as three small icon+line bullets).
(b) Hook: line from ship to a cask icon, range ring 16 m. Vane: a dotted "early warning" arc ahead of the ship.
(c) Hook RANGE 16 m, COOLDOWN 1 bar. Vane: PASSIVE badge, no key.

### 6. Mount row frame itself (pier.js:95-97)
Problem: the prefix "aboard:" / "ashore:" is a word for loaded/unloaded, and the left glyph is just a number or a dot. The name is the lore name of the tool in a role ("the gulp") while the tool is the Lockheart. A player who owns "the Lockheart" cannot tell it is "the gulp".
(a) Two-line card: "[Lockheart icon] Vacuum (Lockheart)". Slot checkbox "Slot 1/2".
(b) Slot sockets drawn as 2 empty circles that the tool icons drag/click into, with the fire key printed on each socket. Header "SLOTS 1 / 2" instead of "MOUNTS: KEYS 1 TO 2 AT SEA".

### 7. Pier ship row (pier.js:87)
Now: "SLOOP / bears 6 · 2 mounts · a charted passage only · cannot dive". Score 4: "bears" (hits), "charted passage" (needs a rutter), "dive".
(a) "Sloop: 6 hits, 2 weapon slots, can dive." For a heavy hull: "Tanker: 12 hits, 1 slot, needs a route map (Rutter)."
(b) Silhouette of each hull; hit-point hearts or pips; slot sockets; a dive/no-dive icon; a lock icon with the map when a rutter is needed. Stats as bars compared across hulls (hits, slots, cargo).
(c) HITS, SLOTS, CARGO (hold), CAN DIVE y/n.

### 8. Pier island row and the "uncharted" refusal (pier.js:79, UNCHARTED at pier.js:26)
Now: "THE SEA CHART: Margarite / fuel: 40 cubes · draft your passage, and reckon the sea, before you sail"; refusal "Your tanker sails only a passage set down in a rutter." Score 5.
(a) "Sail to Margarite - fuel 40 cubes. Plan your route first." Refusal: "Tanker needs a route map. Buy or make one."
(b) A mini node map line (this island to that island) with distance and a fuel-can icon with the number; locked islands shown as a padlock silhouette, not the words "Not yet found".
(c) FUEL 40 cubes, DISTANCE (legs 1-3), DANGER skulls.

### 9. Sea chart actions (seachart.js:110-113)
Now: "RECKON THE SEA / hold the needle on the mark for four beats (today 40% reckoned)", "CAST OFF / sails as: shoal, pirates", "draft one waypoint in each of the 4 columns first". Score 5: "reckon", "draft", "waypoint", "columns", "sails as".
(a) "Scout the route: keep the cursor on the needle for 4 beats. Reveals what is ahead (40% so far)." "Set sail" with "Pick one stop in each of the 4 columns." "Reset route".
(b) A progress bar for the scouting percent; columns already filled shown as ticks (2/4); a pre-flight checklist; the legend of waypoint icons (the chart already draws them: show their names under the icon on hover, plus a legend strip). The needle minigame needs a key/mouse prompt icon, not a sentence.
(c) SCOUTED 40%, ROUTE 2/4, ENEMY ICONS on the chosen stops. Hover words (WAYPOINT, seachart.js:29): "the eyewall", "the maelstrom", "a sighting" should become "Storm", "Whirlpool", "Event" plus the existing icon.

### 10. Encounter choices (triprun.js:44-52, 182, 201)
Now: "Follow them." / "Board the last ship." (no outcome shown). Score 4 for hidden consequence.
(a) Rows get a reward line and a risk line from the table that already exists (encounters.js `does:`, `gain:`, `risk:`, `cost:`, `needs:`). e.g. "Board the last ship: +2 crude casks. 15% chance pirates come after you." "Follow them: reveals the next 2 stops exactly."
(b) Icons: cask, skull (risk %), fuel can (cost), padlock when `needs` is not met (show why it is greyed). Use the existing portrait/tableau as the header image.
(c) +2 casks, risk 15%, cost 1 fuel, requires "can dive".

### 11. Garden place-a-feature (hand.js:233, FEATURES.does realm.js:57-65)
Now: "a formation stone: its neighbours count it twice in their formation · 120 cubes and a material of its feeling" and five coloured words wonder/mirth/desire/grief/dread to click. Score 5: "formation", "feeling", "spore bed: a strain of fungus works what you set in it (progress/sporebeds.js)".
(a) "Boost Stone: makes nearby buildings work twice as hard." "Bed: grows more of whatever you plant." "Spore bed: fungus turns items into new ones." Remove the file path from the string.
(b) A grid of buildable icons with a price chip (cubes) and a small padlock showing the level that opens it ("opens at Firing 2"). The five feelings should be five coloured gem buttons, with the matching material icon on hover, not words. A ghost preview of the building on the ground is the genre standard.
(c) COST 120 cubes + 1 material, SIZE small/medium/large, UNLOCK level.

### 12. Myggdrasil page (mycelium.js:233-250)
Now: "Hang death / the card given to its branch, for good: seed"; "THE CROWN / fruiting bodies open: 2 of 10"; "feed it to the roots (worth 80)". Score 5: the `adds:` key (`sharp`, `fruit`, `seed`, `sporeling`) is printed raw.
(a) "Hang card: permanently gives +1 seed type" with the real effect (e.g. "Unlocks the Grief fungus"). "Feed: gives 80 growth." "Harvest fruit (3)".
(b) A picture of the tree with ten glowing caps (2 lit) and card slots on branches (a Tarot card thumbnail in the slot); the card list shown as card images.
(c) CAPS 2/10, CARDS 4/22, GROWTH bar.

### 13. Spore bed (mycelium.js:205-228)
Now: "Inoculate with the oyster / it rots: material, curio, fish". Score 4: "inoculate", verb "rots/ferments/prints/dissolves/grafts" as strain names.
(a) "Plant oyster mushroom: turns an item into smaller loot." Per strain one plain job: Graft = "combine two curios", Ferment = "make a material stronger", Print = "copy an item's colour into a material", Rot = "break an item into materials", Dissolve = "make a material paler".
(b) Before/after chips: [item] -> [result], with the colour swatch shifting; a timer ring with game hours left as a clock face; the held spores as seed packets.
(c) TIME 4-12 game hours (STRAINS[].hours), INPUT types (icons: material, curio, fish), OUTPUT.

### 14. Spirit page (raising.js:145-170)
Now: "<name>, mirth law" / "wonder 12 · mirth 30 · grief 5 · bond 40 · law · tired 22". Score 4: a raw line of five feelings, "bond", "law/chaos", "tired" as text.
(a) A character sheet: the five feelings as five coloured stat bars, a heart bar for bond, a battery/zzz bar for tiredness; "Law/Chaos" shown as a slider with a pointer (or a tendency icon).
(b) Replace "Feed: <mat> / raises mirth" with item icon + "+Mirth" with the matching colour; "Drill: sprint / mirth" with a training icon + "+18 Mirth, +20 tired". Use "Too tired" as a greyed state with a zzz icon.
(c) Gains from DRILLS (gain 18), FATIGUE (+20 per drill, fails at 80), SPAR gain.

### 15. Plate Shrine and awakening (realm.js:439-446), plus Shed planetoid row (realm.js:355)
Now: "Awaken: <kind> / a plate of 3 stars". Shed: "A new planetoid: <name> / N cubes · opens with the Second Firing · its seed goes in your hand...". Score 4: "plate", "Firing", "seed in your hand".
(a) "Bring a creature to life: use a photo (3 stars) to get a pet." "Buy a new island - 800 cubes. Unlocks at level 2."
(b) Thumbnail of the photo with star icons (3 of 5 filled) and the creature silhouette that would wake; a padlock + level badge for the locked planetoid with a preview image; a price chip.
(c) PHOTO QUALITY stars, COST, UNLOCK level.

## 3. Recurring patterns that cause the problem

1. **One row template, three text slots.** No place for an image, number chip, bar, key glyph or diagram, so each page writes the stats into prose. The shop, Box, Codex and kiln prove the codebase can do better.
2. **Lore names as button labels, and the function hidden.** The tool is named for what its role is in lore ("the gulp", "the wake brush", "the plate", "the toll", "the hook", "the vane"), and the real tool name ("Lockheart", "Soul Brush") is not shown beside it. A kid sees neither the function ("Vacuum", "Spray") nor the item they own.
3. **Game-internal nouns used raw as UI words.** Reckon, reckoning, draft, passage, waypoint, rutter, portent, bears (hits), hold, mend, draught, brimming, formation, Firing, bond, strain, inoculate, ferment, rot, dissolve, graft, print, plume, squall, leg. Each has a glossary entry, but the glossary defines them for developers; none is taught by an icon or a first-use hover.
4. **Prose instead of stats.** Numbers are buried mid-sentence ("50 degrees, 9 m", "within 10 m (14 on the beat)", "a quarter of the cargo", "half again as early"). Genre convention is a labelled stat chip (RANGE 9 m, COOLDOWN 4, COST 4) that can be compared across rows.
5. **Raw data leaking into text.** `it.kind` ("possibilikey") at shop/ui.js:88, `BRANCHES[a].adds` ("sharp", "fruit", "seed") at mycelium.js:243, a file path "(progress/sporebeds.js)" inside FEATURES.sporebed.does (realm.js:65), "(DRILLS)" in drillYard.does, `c.does` used as a fallback label (triprun.js:182). `does:` strings written for developers are reused as UI copy.
6. **Locked and refused states explained in words.** "Not yet found", "a charted passage only", "NOT YET LEARNED", "opens with the Second Firing". Convention: a padlock plus the unlock condition as a chip, greyed row, tooltip on hover.
7. **Choices without consequences.** Encounter and heaving-to rows show only the verb; the reward, risk and cost are in the table (encounters.js) but not on screen.
8. **Mixing flavour and function in the same line.** "a Courier of smoke where you stand: what hunts you hunts it, and forgets you" (Song of Seeming) is lovely, but a decoy chip ("DECOY, 8 Lachryma") should come first, flavour second as an italic tooltip.
9. **Colour-coded feelings shown as words.** The five feelings are "wonder / mirth / desire / grief / dread" in text on the place and spirit pages; they already have fixed colours (FEELING_COLOR) and glyphs. Use coloured gems or faces consistently.
10. **Instructional footers as paragraphs.** Shop footer, Box footer ("left click: the first action · right click: all of them · drag a thing onto another slot to swap · F picks up what lies on the ground"), kiln hint. Convention: a bar of key-cap glyphs with 2-3 word labels.
11. **Titles that name the system, not the action.** "THE PIER", "THE SHED", "THE SEA CHART", "THE PLATE SHRINE", "THE COCOON TREE", "GRIMOIRE", "THE CROWN / THE ROOTS / THE BRANCHES". A verb title ("Choose weapons", "Plan route", "Shop for planets") is understood without the lore.

## 4. Worst log lines (brief; separate concern)
- src/feedback/tracking/garden.js:57 "A true firing. Willpower: rank 3, for 120 cubes." (true firing, rank, attribute)
- tracking/place.js:33 "Moved. Its formation there: x1.5, on a spirit vein." (formation, vein)
- tracking/place.js:24 "You are brimming." (reasonable in tone but has no icon cue; the glossary marks it Espada's word)
- tracking/place.js:21 "Your hand: <art>. Ground: <x>. Water: your draught." (draught)
- Refusals at the pier: "Your tanker sails only a passage set down in a rutter." (pier.js:26).

## 5. What is already right (keep, copy)
- Continue? page (stage.js:377): cost and consequence in plain English, arcade convention.
- Shop (icon, price chip, stock beads, hover sentence).
- Codex locked card: a progress bar plus "label: n/N" counters.
- God Arts bar: single-verb names with a 2-3 word gloss and a glyph.
- Help pages: [keys | effect] row layout is key-first.

## 6. Not verified
I did not run the game or screenshot these windows; the catalogue is from reading the render code and data tables. Values in the proposed stat chips come from the tables cited (mounts.js, STRAINS, DRILLS, FATIGUE, FEATURES); the "800 cubes" and "120 cubes" figures in examples are illustrative. The kiln and tuning panel were sampled, not exhaustively read; the Codex tabs for the ledger, records, curios and grimoire, the Veritome pages and the fishing UI were not read.
