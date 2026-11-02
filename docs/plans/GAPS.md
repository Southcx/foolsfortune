# GAPS: every unbuilt item across the plans, with its touch path (Dovina, 2026-11-01)

**Asked:** South, 2026-11-01: "If there are any plans left unbuilt, build them, coordinate to ensure the new features are supported on
mobile." Petra handed the ledger to Dovina (docs/handoffs/everyone/2026-11-01-from-petra-solid.md): one row per item, its owner, its
status, and a **mobile** column naming how it is played on a phone.

**How it was read.** Four readers each took a quarter of `docs/plans/` (96 plans; GAPS, SOLID and TOUCH-REBUILD by hand). Each
checked every planned item against `src/` with grep: a named file, export or event present means built. Nothing was played, so a
row can be wrong where the code names a thing differently. The soft spots are in section 4.

**Done** for any row now also means it works on touch:
- its verbs are reachable on a phone (MOBILE.md 4.1, TOUCH-REBUILD.md);
- one screenshot at 896 x 414 is read as a human would read it.

**The status words:**
- not started;
- partly built (the missing part is named);
- designed, not built;
- waits on South;
- parked (the plan parks or cuts it; listed so nothing is lost).

**The mobile column:** the touch path in the house's words (the cluster, the arc's slots A to G, PICK and BELT, the far and near
shelves, the bottom band, a window, the god strip, the art bar, the duel screen), "no input (passive)", or **NEEDS:** for a touch
path that does not exist yet.

## 1. The count

327 items. By status: not started 141, partly built 67, designed, not built 57, waits on South 37, parked 25.

By owner (an item with two owners counts for both): Dovina 204, Petra 190, Calissa 109, Espada 46, Wanda 19, South 6.

**53 items need a touch path that does not exist.** Their ids: G3, G4, G15, G26, G29, G40, G45, G64, G65, G66, G70, G71, G81, G85, G87, G89, G99, G100, G114, G116, G122, G126, G145, G146, G147, G148, G149, G150, G151, G159, G160, G166, G182, G187, G188, G198, G212, G214, G217, G225, G244, G246, G250, G255, G256, G278, G287, G294, G296, G297, G304, G305, G306. Most fold into the touch rebuild (TOUCH-REBUILD.md)
once South rules it.

## 2. The order each division builds hers in

Each division takes her rows in this order:
1. what breaks or blocks play;
2. what has another division's rules or looks waiting on her;
3. what is not started.

Rows that are parked or wait on South are not built until South rules.

**Dovina's, this round and the next** (rows she owns alone, not parked):
1. Spirit Cooking (G226): `scripts/cooking.mjs`, pricing a dish's draught against the press.
2. The achievements that need only predicates over counts already kept: the Shrines (G205: find every Shrine, travel a hundred times),
   the parry by tool (G176), the Soul Brush's Load (G270), the passage's storms and adrift (G180).
3. The domain sources still missing (G62, G63): the Raceway's Divination and Spellscription, and the open sea's Manifestation and Alteration.
4. The Assay's passive readings whose events already exist (G14) (tracking, visual search, navigation).
5. The crude picture in ECONOMY.md (G136: by field, not by feeling), and the melee loadout's numbers (G215) folded into `combat/moves.js`.
6. The rest of hers, in table order.

## 3. The ledger

| id | plan | item | owner | status | mobile |
| --- | --- | --- | --- | --- | --- |
| G1 | ABERRANTS | The clapperjar as the next aberrant (Mirth): rules built (ruleset `clapperjar`, secret `clapback`, Shuffle, Syncopate, Encore, drops, du14); the drag's `beat` and where it goes wrong are Petra's; its look Calissa's, its clap in the cue Wanda's | Dovina + Petra + Calissa + Wanda | rules built 2026-11-02 (plan 5.2) | duel screen: the drag; the beat is read from the drag's release, no new input |
| G2 | ABERRANTS | Strawman's plain teaching secret ("clear every colour once", shown from the start); `secrets.js` has no Strawman entry (only the practice end's look exists) | Dovina | parked (plan 5.2) | duel screen: the drag; no new input |
| G3 | ABERRANTS | A bound spirit lending a hand in a duel (garden changing a duel's rules) | Dovina + Petra | parked (base change bad; the garden is in flux) | NEEDS: a spirit-help tile on the duel screen's left column |
| G4 | ABERRANTS | A learned skill that acts on the aberrant's half (the jelly's Spew turned round); its half is frozen in the PvE duel | Dovina | parked (plan 8) | NEEDS: a power tile on the duel screen (same as the other learned powers' tiles) |
| G5 | AGENT-INTERFACE | The readout table and the intent table (`readout(id, viewer)`, `intent(name, schema, run)`): no such registry in `src/agent/agent.js`, which has ten fixed intents | Petra (core) + Dovina (shape) | designed, not built (plan only; "when South says go") | no input (passive): an agent skin, not a player path |
| G6 | AGENT-INTERFACE | `observe()` read from the readout table and gated by familiarity, fog and privacy | Petra | not started | no input (passive) |
| G7 | AGENT-INTERFACE | Raku's tables as the first legible system: the coach as a readout, sit / take / leave as intents (the coach exists as data, the agent cannot sit) | Dovina | not started | no input (passive) |
| G8 | AGENT-INTERFACE | The time layer's `until(event)` with a cap (manual stepping exists) | Petra | not started | no input (passive) |
| G9 | AGENT-INTERFACE | An MCP server skin over `scripts/agent.mjs` (look, act, step, until) | Petra | not started | no input (passive) |
| G10 | AGENT-INTERFACE | Resources for agents: the glossary, plans, ledger and achievements as text, the chat line's commands with help | Dovina | not started | no input (passive) |
| G11 | AGENT-INTERFACE | A name in the world for a connected agent (a Tulpa?) | Espada | waits on South | no input (passive) |
| G12 | ANGLING | Two more waters: the shore (half-Egregore fish, a legend that rises only in one weather's strong spell) and the sumps (the Great Dunemaw's bowl pools); 6 new species to make 16 (12 exist, all Weir) | Petra (waters) + Dovina (species rows) + Calissa (bodies) + Espada (names) | not started | rod hands on the movement keys: cluster / arc slots (A reel, B give line, C pump); no new input |
| G13 | ANGLING | Bite Sense knack (the !!! window 30% wider; opens at 200 hooks set or 25 set perfect): the row is in `progress/knacks.js`; the window's switch in `angler.js` is Petra's | Dovina + Petra (switch) + Espada (name) | rules built 2026-11-02 | no input (passive): a knack, toggled in the window |
| G14 | APTITUDE | Passive readings whose events already exist but are not in `APTITUDES`: tracking (the lock-on's eight), visual search (Veritome), navigation (Well floors, the Sight), planning (macro lattice), language learning (ostraca, stele), category learning (familiarity) | Dovina | partly built (tracking from `rail.volley`, 2026-11-01); visual search and navigation have no event that measures them | no input (passive) |
| G15 | APTITUDE | Gap aptitudes with no source yet: working memory (Corsi / n-back; a call and answer in the rhythm mode), task switching (after a stun), explore or exploit, model-based planning | Dovina + Petra (a trial for working memory) | designed, not built | NEEDS: a tap-the-blocks trial path in the Touchstone (the rhythm lanes' tap exists) |
| G16 | APTITUDE | The god hand's puzzles in the Touchstone (qualitative physics: matter over par; mental rotation via the puzzle fights); Touchstone has only the 5 standard trials | Dovina + Petra | designed, not built | god strip: the seven domain tiles plus SIGN; no new input |
| G17 | AREAS | The Dunes as five areas built and torn down (stage 2): only `DunesAreas` events and the cut exist; the Dunes are still one resident area (`dunes`, boot, evict) | Petra | partly built (cut, events, checklist done; per-area build and teardown missing) | no input (passive); the area wipe covers the seam |
| G18 | AREAS | The catch-up hook for blots and crystals while an area is away (A4); stage 1 only evicts the GPU copies so everything still ticks | Petra + Dovina | not started | no input (passive) |
| G19 | AREAS | Margarite and the parked crossing built on entry and disposed on exit (`margarite` is registered with no build) | Petra | not started | no input (passive) |
| G20 | AREAS | Creatures do not follow across an edge (A6, FFXII's rule): a hunter waits where it was | Petra | not started (no code found) | no input (passive) |
| G21 | AREAS | Three condition-bound finds still to make (`RARE_FINDS` built:false): Grief's rain filling a basin in the Gnomon flats, the shore's tide walker at dusk, the Weir's last star at dawn; a bounty Letty Marque can post once seen | Dovina + Petra + Calissa | not started | no input (passive): found by walking up; F on the chevron or the lens tap |
| G22 | BRACELET | The look of the Overload's recoil (pressure, cracks) on `lockheart.recoil`; the rule is built, no vfx or ui listens | Calissa | not started | no input (passive) |
| G23 | BRACELET | TWIN's second act replaces the first under a power's count cap (one rift pair at its open level); pays off only when counts ramp | Petra + Dovina | partly built (known issue) | no input (passive) |
| G24 | BUGREPORT | Splitting a public build off the organization-internal one (`db` and `assets` make the build org-internal, ruled yes "for now") | Petra | waits on South | n/a (publishing) |
| G25 | BUILD | The tunable Strawman (a rig of presets and settings); only the attack strings picked at the lectern exist (`STRAWMAN_STRINGS`) | Dovina + Calissa | partly built (strings built; presets and settings rig missing) | window: tap (the lectern's page) |
| G26 | CASINO | Gravity Well: crokinole with real flicked dice on the house's physics (Rapier), a long lane in the hall; no `gravitywell` game | Dovina (rules) + Petra (physics) + Calissa | designed, not built (waits for South to play the tables) | NEEDS: a flick-throw on the cloth (drag-and-release) |
| G27 | CASINO | Charity Gamble: 4 to 6 seats, hidden deposits (1, 5, 10) as the bluff | Dovina | designed, not built (phase 3) | table view: tap pieces; no new input |
| G28 | CASINO | Celestial Skirmish: chess with dice, a move generator and a search bot (the heaviest) | Dovina | designed, not built (phase 3) | table view: tap a die, tap a square |
| G29 | CASINO | Entropy Tactics (7 x 7 tactics, 22 characters, Fatelink merged); its design pass is `ENTROPY-TACTICS.md` with six questions for South | Dovina | waits on South (six questions) | table view: tap; NEEDS: a hand of five dealt cards to tap |
| G30 | CASINO | Event Horizon's interference (swap, steal, reroll another's dice) and Asteroid Belt (grab for duplicate faces) | Dovina | parked (later; one sentence) | table view: tap |
| G31 | CASINO | The folk and the siblings in the seats with a style each (Petra folds tight, Calissa bluffs pretty, Espada counts cards), guests later; seats are Raku, Clink, Crock, Celadon bots only | Dovina + Espada (lines) | not started | window: tap |
| G32 | CASINO-CLARITY | The labradorite all-out: the whole hall's neon going labradorite on a tier 3 hand (the count-up's film and the shake exist; `bazaarhall.js` does not listen) | Calissa | partly built | no input (passive) |
| G33 | CASINO-CLARITY | The tell's riffle on the folk's bodies if they come to sit (it exists as chips on the cloth) | Calissa | parked (depends on the folk sitting) | no input (passive) |
| G34 | CASTER-SHELLS | Flamer's baking of paint, Bloom's growing (mending exists), Twelve's lamps, Shrinker's carry; none found in `src/tools/psygun/` | Petra | not started (the plan's "not built yet" list) | the chamber strip: FAN and the chambers on the far shelf; no new input |
| G35 | CASTER-SHELLS | The "ludicrous ten" feel pass (Meteor's mega is built; the other nine: Mallet, Hailstorm, Thunderhead, Slingshot, Volcano, Zodiac, RYNO, Inside Out, Thirteen, each wanting 2 to 5 times scale, hit-stop, camera punch, a shockwave) | Calissa (looks) + Petra (hit-stop, camera) | partly built (Meteor only; the rest unverified) | no input (passive) |
| G36 | CASTER-SHELLS | Measure `stain.wash.grown` and move `DUE_EVERY`: measured 2 full-grown blots a real hour at most (the Shore's steady state), `DUE_EVERY` 12 to 3, a row in `scripts/economy.mjs` | Dovina | built 2026-11-02 | no input (passive) |
| G37 | CLARITY | `scripts/clarity.mjs` joining `npm run check` (it exists, not wired into the gate) | Dovina + Petra | partly built | n/a (gate) |
| G38 | CLARITY | Each window redone as cards in traffic order, one a round: the pier and the sea chart as cards with the world preview, then the rest; `indexmenu.js` still has the row template | Petra + Calissa + Dovina | partly built (the card exists; pier practice cards done) | window: tap |
| G39 | CLARITY | Espada words every line in the System's voice (section 14: say what to do, then why; the before-and-after table) | Espada | partly built (a brief, lines pending) | no input (passive) |
| G40 | CLASS-ARTS | The Pneuka Box's loadout page for wearing another art (today only `/art <id>` on the chat line) | Petra + Calissa | not started | window: tap (the Box tab); NEEDS: the chat line is not a path |
| G41 | CLASSES | The other eight Majors' class read: the six planets by the wild light (40% of counted points), the Hanged Man (an all-reversed spread), Judgement (the Celtic Cross complete); `classOf` reads 30 classes | Dovina + Petra | designed, not built (proposals, South to rule) | no input (passive) |
| G42 | CLASSES | One kit, two games: a class's arts are its Entropy Tactics actives | Dovina | waits on South (and Entropy Tactics) | no input (passive) |
| G43 | CLASSES | Palmistry's readings: the four great lines as ledger readings, the god hand's shape by your suit, a domain's level shown on its mount | Dovina + Calissa | designed, not built (Espada's proposals) | window: tap (the STATUS shelf); the hand's shape passive |
| G44 | COLLECTION-LOG | Bundles: choose-4-of-6 slots across modules that restore a visible part of the Workshop | Dovina + Calissa | designed, not built | window: tap (the Codex's COLLECTIONS shelf) |
| G45 | COLLECTION-LOG | Photo to invention: two plates combined at a bench make a recipe (a lure, a decor piece, a glaze) | Dovina + Petra | designed, not built | window: tap at the press or the kiln; NEEDS: a plate picker there |
| G46 | COLLECTION-LOG | The Index showing which modules are untouched today (`game.firstToday.left()` exists, nothing reads it) | Petra + Calissa | partly built | window: tap (the Index page) |
| G47 | COMBAT-LAB | The Figment telegraph floor's mechanics: the caster as a creature winding up with an `area` that lands a harmless shove; the lectern's page (shape, type, fidelity step, windup length, "all in turn"); the pillars and islands for baited, floor, adds, split | Petra (creature, page) + Calissa (stand-ins) | not started (place and stand-ins built) | lectern F: window: tap; the answer moves on the stick and E (parry) |
| G48 | COMBAT-LAB | The parry range's mechanics: the pitcher throwing plain and outlined shots (reuse `creatures/lobber.js`), balls flagged `training` so a parry here reaches no ledger, the outlined shot on foot (exists only at sea), the lectern page | Petra + Calissa (the pitcher's heave) | not started (place built) | lectern F: window: tap; E parry in the cluster |
| G49 | COOP | The shared FOE tested with two real players (C5 is built; the test is the open item) | Petra | waits on South (a second player) | the same cluster and duel screens; no new input |
| G50 | COOP | The siblings' words (the log's lines, meeting scenes) | Espada | partly built (`coop/meeting.js` exists) | no input (passive) |
| G51 | DEBUG-MODE | A preset per QAIS round (the Brief names one): this round's four written (`clapperjarDuel`, `encoreLearned`, `hangarOpen`, `biteSense`); a round's Brief naming its preset is Petra's | Dovina + Petra | rows built 2026-11-02 (one a round from here) | window: tap (QAIS) |
| G52 | DICE | The rolls on your own set, not the house's: Raku's tables throw the player's seven stones (house dice today), Luck's re-roll at tables | Petra + Calissa + Dovina | not started (only the Flee throws your d20) | table view: tap; no new input |
| G53 | DICE | Opal's game (a drink doubled or lost): your stones turning in the vessel; no Opal code | Dovina + Espada | designed, not built | window: tap |
| G54 | DICE | The palm die as the Hungry Die at Entropy Tactics' table | Dovina | waits on South (Entropy Tactics' questions) | no input (passive) |
| G55 | DICE | The d% has no suit and no finger yet | Espada + Dovina | waits on South | no input (passive) |
| G56 | DOCS-CLEANUP | Fold DESIGN.md's dated rulings (sections 10 to 22) into the wiki and specs, leaving one-line pointers (the file is 566 lines) | Dovina | not started | n/a (docs) |
| G57 | DOCS-CLEANUP | Merge plan clusters into one spec each (the Emocean: RAIL, RAIL-OVERHAUL, PASSAGE; the garden: SPIRIT-GARDEN, MYCELIUM; testing: SWEEPS, GARDEN-SWEEP, DEBUG-CHESTS) and archive the superseded | Dovina | not started (all still in `docs/plans/`) | n/a (docs) |
| G58 | DOCS-CLEANUP | Archive built plans (SLICE, BUILD, SHRINES, TESTROOM, STRAWMAN, DUNES, the DUNEMAW family into one spec, PARRY and PARRY-CLIPS into a wiki page); `docs/archive/` holds two files | Petra | not started | n/a (docs) |
| G59 | DOCS-CLEANUP | Move the casebook's dated cases to `docs/archive/casebook/`, one file a month (CASEBOOK-CASES.md is 4,883 lines) | Petra | not started | n/a (docs) |
| G60 | DOCS-CLEANUP | LORE.md section 11 ("Open") folded into the wiki pages as names settle, and CLARITY section 9's labels settled | Espada | not started (LORE.md section 11 still stands) | n/a (docs) |
| G61 | DOCS-CLEANUP | `voice_recording.md` to the archive once the recording is done (OST sections 6 and 7 are archived) | Wanda | waits on South (the recording) | n/a (docs) |
| G62 | DOMAIN-SOURCES | The Raceway's Divination and Spellscription sources (reading a race's condition; riding a line to the music) | Dovina | built 2026-11-01 (`race.finish` under a condition: Divination; `skiff.grind.end` to the rail's end: Spellscription) | no input (passive) |
| G63 | DOMAIN-SOURCES | The open sea's Manifestation and Alteration sources (forging a part, `FORGE`; the garden's look from the sea) | Dovina | built 2026-11-01 (`ship.part` forged: Manifestation; worn: Alteration) | no input (passive) |
| G64 | DOMAINS | The 90 rungs, seven designs, each only a `PLANNED` row in `domainladder.js`: Stasis, Made of a Feeling, Call It (Brier-scored), Heft, Ride, The Exchange, Rewrite a Tag | Dovina (rules) + Petra (runtime) + Calissa + Wanda + Espada | designed, not built | art key (F meter/art slot) for actions; Ride NEEDS: the stick driving a creature's body, Call It NEEDS: a pick-a-move tile |
| G65 | DOMAINS | The 99 summits, seven designs: The Rewind (also needs the ledger's 6 real s journal so a rewound count is taken back), A Second Vessel, See the Next Roll, Banked Motion, No Border, Re-make a Body, A Place's Law | Dovina + Petra + Calissa + Wanda | designed, not built | art key; passive otherwise; A Second Vessel NEEDS: a command path for the double |
| G66 | DOMAINS | The 21 pairings: two questions in one move, open at 60 in both domains and paying both prices (Amber, Precognition, Stored force, The echo's body ...) | Dovina + Petra + Calissa | designed, not built (open at depth) | NEEDS: a pairing's art slot (the art bar lists one domain's arts at a time) |
| G67 | DOMAINS | Overreach (a power cast with the pool short: the shortfall drawn from the vessel, the power doubled, blows on you crack double for 6 real s); only a mention in `godhandclips.js` | Dovina + Petra + Calissa | designed, not built | no new input: the cast itself; the bulb shows it |
| G68 | DOMAINS | The aberrance line: a creature with its rules rewritten by you goes aberrant (a duel; drops at half, a Dissonance step, never shiny) and a made-aberrant faucet row in `scripts/economy.mjs` | Dovina + Petra | designed, not built | no new input (the duel screen takes over) |
| G69 | DOMAINS | True Odds for the crystals' chances (a key, a fossil) once their numbers are a table in `world/dunes/crystals.js`; only the Tithe's console reads | Petra + Dovina | partly built (the Tithe only) | no input (passive): a tag |
| G70 | DOMAINS | The stake as a price (cubes, a crack or a day's Luck re-roll put up openly against an outcome) | Dovina + Petra + Calissa | designed, not built | NEEDS: a confirm-the-stake tap on the act |
| G71 | DUEL-DESIGN-SPACE | A PvP duel mode returning to the classic rules: the classic duel against a guest, co-op on one side, best of three | Dovina + Petra | parked (waits on South's PvP) | duel screen; NEEDS: the classic forms' tiles (tabled) |
| G72 | DUEL-DESIGN-SPACE | Powers opened by the bracelet's charms, by domain level, or made cheaper by the worn pair's domains | Dovina | parked (bracelet charms now exist, so its reason has lapsed; South to rule) | duel screen: the power tiles; no new input |
| G73 | DUNEMAW | The antlion pit carved into the Dunes' ground: a 39 m cone 8 m deep at the angle of repose, sand sliding the Courier in at 1.5 m/s, a slip current, the labradorite eye as the way in (`PIT`, `pitDepth`) | Petra (ground) + Calissa (the sliding sand) | partly built: the mouth pool and the Prince's crown horns exist (`DunemawMouth`, `world/well/dunemaw.js`); the code comment says the carve still waits on `heightAt` | no input (passive; climb out with the stick and cluster C jump) |
| G74 | DUNEMAW | A carved cave generator: 25 x 25 cells of 8 m (cellular automata, rooms stamped at pocket/chamber/hall/great-cavern scale), instead of today's 13/19/25 rooms of 18 m cells chained from twelve prefab designs | Petra | designed, not built (`welllayout.js`, `prefabs.js` are the prefab chain, not the carved cave) | no input (passive) |
| G75 | DUNEMAW | Stalactite jumping runs over slip pits (stone, brittle that falls 0.8 s after a landing, warped that phases on the Dunemaw's beat); `dunemaw.beat { phase }` event for Wanda's 3/4 cue | Petra (runs in the floors) + Calissa (bodies exist: `vfx/cavekit.js` `Stalactite`) + Wanda (the beat's cue) | partly built: the bodies and the warped shader exist and the bowl uses stalactites as ram targets; no run is laid in a floor and nothing emits `dunemaw.beat` | cluster C jump and the double jump, A/D steering; no new input |
| G76 | DUNEMAW | Slip rivers (3 to 8 m wide, 3 to 6 m/s currents carrying the Courier and the skiff) and slipfalls over ledges | Petra + Calissa (the slip's material) + Wanda (river sound) | not started (no current in `world/well/`) | no input (passive; the skiff's auto-sail rides them) |
| G77 | DUNEMAW | The warp's look on the objects themselves (sand falls upward, a pot floats, the glitch's tear) for a warped pocket | Calissa | partly built: warped artifact and floor shift work (`finds.js`, `wellshift.js`); the glitch tear is on the warped stalactite only | no input (passive) |
| G78 | DUNEMAW-EXTREME | Re-base the fight's numbers on real clears: `HEALTH` (900, a model sized from `SUSTAINED`), the 8:00 expert time against the 9:30 enrage, first clear in 10 to 30 pulls | Dovina | waits on South (needs real clears and Strawman's bout line) | no input (data); the fight itself is cluster A primary, B evade, E parry |
| G79 | DUNEMAW-EXTREME | Acceptance list items 1 to 8 ticked by South, each as a QAIS test with a debug chest | Dovina (kit) | waits on South (the Great Dunemaw's fight is in flux, so no sweep check is written) | QAIS REPORT tile; the fight on the cluster; no new input |
| G80 | DUNEMAW-SYSTEMS | A tunable Strawman: a console beside it setting its grain dials, mental state, each damage type's affinity, poise, status build-up, friendly-fire tolerance, guard arc and behaviour; presets mirroring a slip jelly, a bold jelly, the Great Slip Jelly crowned and bare; the bout line naming the setting; a QAIS report carrying the rig | Dovina (rules, presets) + Petra (the room's console) + Calissa (console dress) | designed, not built (the room has only still/guard modes and Strawman's attack strings, `throwingroom/room.js`, `strawmanstrings.js`) | window: tap (a console window of rows and pickers, as the loadout editor) |
| G81 | DUNEMAW-SYSTEMS | Scripted `/strawman` runs: a preset plus a fixed blow sequence so a division measures a change against the same bout | Dovina + Petra | not started (no `/strawman` command found) | NEEDS: the log sheet's chat line (opens from the touch log's tab) or a lectern row for the same runs |
| G82 | DUNEMAW-SYSTEMS | Solar Skiffing rings hung over geysers, lit only at an eruption's top (the line's timing as the skill) | Dovina (rules) + Petra (`world/dunes/solar.js`) + Calissa (ring look) | not started (named "Open" in the plan; no geyser link in `solar.js`) | skiff on touch as now (auto-sail, tilt or stick steer, jump for the pop); no new input |
| G83 | DUNEMAW-SYSTEMS | Re-base the floors' pay (`ECON.well.perFloor` 2.5 minutes of play, the FOE two floors' worth) once a player's run is measured | Dovina | waits on South (needs the owner's run; the ledger already records `well.run.*`) | no input (data) |
| G84 | DUNES | Bigger Dunes (1,600 m across, `DUNE.half` 520 to 800): withdrawn 2026-10-25; more Dunes come as more areas past the barrier (AREAS.md 5) | Dovina (plan) + Petra | parked (withdrawn) | no input (passive) |
| G85 | ENDGAME | The Well's board: a run as a board of spaces moved on your own dice (the stones), a floor a space, the FOE at the end, the haul carried and lost on a fall | Dovina (board, spaces' table) + Petra (runtime) + Calissa (look) | designed, not built (no board code in `src/`) | NEEDS: a roll tile (the palm die roll) and a tap-a-space pick on the board; a window: tap |
| G86 | ENDGAME | The genre floor contract (avatar, frame, lent verbs, win/loss, haul, prior art in the header) and the first floor, the sidescroller, as a Well space | Petra + Dovina | partly built: Strawman's Well has the side-on frame, stages and a plane reticle (`world/strawmanwell/`); no contract table and no space on a board | move stick + cluster A/B/C/D/E as now; the plane reticle's aim on touch needs a check |
| G87 | ENDGAME | The other genre floors: twin-stick arena, bullet hell (the Jar), rhythm, block puzzle (the hand), stealth, racing, fishing, card game, tower defence, five-second minigame spaces | Petra + Dovina | not started | each reuses its own touch path (lanes, skiff, rod, table view, god strip); bullet hell and twin-stick NEEDS: a twin-stick aim on the look area |
| G88 | ENDGAME | Endless Wells at the top: a Well past the story's floors, seeded by the game day, best depth a record (Greater Rift style) | Dovina + Petra | not started (the Well is seeded daily by `core/calendar.js` but is three floors) | no new input |
| G89 | ENDGAME | Author and share a Well floor (Mario Maker style): a made floor goes into the daily Well's pool, with a share code like the track editor's and the layout code | Dovina + Petra + Calissa | not started | NEEDS: touch placement editing (tap to place, as the garden's decor) and a code box |
| G90 | ENDGAME | Co-op Well run: four Couriers, one board | Petra | partly built: `SharedFoe` covers guests on the Great Dunemaw errand only (COOP.md) | no new input |
| G91 | ENDGAME | Work the curve back from the summit: each track's ramp on `t^1.6`, STORY's first 40 hours given a known end | Dovina | not started (only the god powers' `RAMP` and the lend panel's Summit row exist) | no input (data) |
| G92 | ENDGAME | Fold the garden's seeds grown to large into the Summit lend | Petra (ring runtime) | partly built (the Summit lend covers the domains, attributes and palm die) | no input |
| G93 | ENDGAME | Whether every Well has a board or only some; how many players share one board | South | waits on South | no input |
| G94 | ENTROPY-TACTICS | The rules engine on the casino table engine: 7 x 7 board, zones, tokens by suit, poker hands as a spell grammar, Hungry Die, Grand Bomb, push formula, win conditions, Royal Straight Flush | Dovina | designed, not built; waits on South (6 questions, section 6 empty; nothing in `src/progress/casino/`) | table view as Raku's tables: tap a piece, then the action bar's buttons |
| G95 | ENTROPY-TACTICS | The opponent bot (information-set Monte Carlo tree search over hidden hands) and the simulator pass to measure the classes | Dovina | not started | no input (passive) |
| G96 | ENTROPY-TACTICS | The first four classes (Fool, Chariot, Empress, Hermit): a passive, three actives and an ultimate each, actives woken by the bomb's zone | Dovina + Espada (names, plain until settled) | designed, not built; waits on South (question 3) | window: tap (a seat plate and action bar buttons) |
| G97 | ENTROPY-TACTICS | The game's view: a board on the table view, seat plates, coach and how-to, turn banner | Calissa + Dovina (coach) | not started | the table HUD and action bar (existing); a 7 x 7 board needs a tap-pick check at 896 x 414 |
| G98 | FEELINGS-AWAKENING | Grief by a casino loss: staking Lachrymite cubes (now Raku chips) and losing it all as a feat way, beside the Lockheart duds and a lost haul | Dovina | waits on South (parked until the owner wants a room; Raku's Bazaar now stands but `FEELING_WAKE.grief` reads no chips) | no input (passive) |
| G99 | FIGHTER | Touch controls for the fighter kit: attack, special, shield, grab, dodges, DI and SDI, smash, tech (touch audit: bare-handed attacks, smash and grab have no touch path today) | Calissa (tiles) + Petra (driver) + Dovina (kit) | not started (`fighter/keys.js` masks keyboard and mouse only) | NEEDS: a fighter cluster in the Arena: A attack, D special, E shield, B roll/air dodge, F grab, C jump, stick for DI; smash needs a stick flick |
| G100 | FIGHTER | The Arena's flick on touch: the stick from under 0.3 to past 0.8 inside 3 frames handed to the kit (tap jump, double flick, smash with attack) | Petra (touch driver) | not started | NEEDS: the stick axis handed to the kit (a flick on the move stick) |
| G101 | FIGHTER | Whether the kit leaves the Arena (the Brawl's dummies, the 3D game's blows) | Dovina | waits on South | no input |
| G102 | FIGHTER | A second stage: Final Destination's flat layout for 1v1 | Dovina + Petra + Calissa | built (`stages/flatstage.js` on `stages/fighterstage.js`, sw15; looks and music keyed on `arena`: handoffs to Calissa and Wanda) | no input |
| G103 | FIGMENT-TELEGRAPHS | A tracked (homing) windup in a creature, with its caution edge: the shape and edge are drawn but no creature fires one | Petra + Dovina (a homing spit) | partly built (`tracked` shape and `uCaution` exist; no windup uses it) | no input (passive) |
| G104 | FIGMENT-TELEGRAPHS | Windup shapes on the other creatures as each is next touched (clapperjars: lunge; the lobber) | Petra | partly built: slip jelly, Great Slip Jelly, Wisp and sea serpent carry areas; `clappers.js` and `lobber.js` have no windup | no input (passive) |
| G105 | FIGMENT-TELEGRAPHS | The rail's closing ring joins the ladder when the Emocean's crossing settles | Dovina + Calissa | parked (the plan: the rail keeps its own for now) | no input |
| G106 | FIRST-GLOSSES | The first-gloss mechanism: say each lore word's one plain sentence once, at the first moment it matters (first `log.say`, how-to step or tooltip), kept as a ledger first | Espada (sentences exist in the doc) + Dovina (rule) + Petra (hook) | not started (no `src/` reads the gloss table; only the neuralese ostraca have glosses) | no input (passive; the log's ticker shows two lines, a tap opens the sheet) |
| G107 | FIRST-HOUR | A small sound for `goal.next` (or reuse `goal.done`'s) | Wanda | not started (`audio/cues.js` has `goal.done` only) | no input (passive) |
| G108 | FIRST-HOUR | Whether the hole to the basement wants a world mark | Calissa | waits on South (Calissa's call; the step's words point at it today) | no input (passive) |
| G109 | FIRST-HOUR | QA-A measurement of the targets (first goal under 1 min, Wonder by 6, first cube by 8, kick by 10, Dunes by 12, path by 45) on a fresh STORY save | Dovina | not started (needs a playtest run; QA-C's cutoff-ended hour is the only data) | no input (data) |
| G110 | GALL-AND-FURY | Paint acts on minds: Fury enrages (EmO up past the band), Gall paint a wall no mind crosses, Wonder lures, Mirth calms, Desire draws, Grief slows, Dread flees, read through a painted cell's stimulus | Petra + Dovina | not started (phase 2; no paint stimulus in `creatures/ai/`) | no input (passive; paint with the cluster's brush tiles as now) |
| G111 | GALL-AND-FURY | The garden's weather: Gall rain wilts plants and sours water until washed, Fury rain bakes clay (strokes half as strong) and scorches moss, Gall lingers in water at a third of the decay | Dovina + Petra | rules built (`progress/gardenweather.js`: souring, the baked stroke, the scorch, Gall lingering); the plants, the hand and the water read them: Petra (handoff 2026-11-02-from-dovina-round) | no input (passive) |
| G112 | GALL-AND-FURY | Entropolis's plumes carrying Fury and Gall out to sea, and a Fury plume against a Dread plume cancelling at a front | Dovina + Petra | not started (`progress/econ/passage.js` carries a "phase 2" comment) | no input (sail) |
| G113 | GARDEN-COZY | A7 overlay avenue: a CALM / BRIAR tag on a planetoid in the overhead view and an arc on the Sight's dial while in the garden | Calissa | not started (the ground, sound and log avenues exist) | no input (passive; the Sight and tags are world marks) |
| G114 | GARDEN-COZY | C3 a spirit notices: it comments on the decor nearest its spot or on what you just moved, in its grain's register, in the dialogue box | Espada (words) + Dovina (rule) | not started | NEEDS: a touch way to talk to a spirit (F with the hand over it; the garden's art bar has no talk tile) |
| G115 | GARDEN-COZY | C4 folk visitors drawn by what the garden shows (Pip at high harmony, Saggar for glazes, Raku appraising, briar visitors, siblings in co-op) | Dovina + Espada + Petra | not started (only the wild `VISITORS` settle) | dialogue box: tap |
| G116 | GARDEN-COZY | C5 the mailbox as a thing at the shed: letters, postcards and dawn gifts exist but are read by typing `/letters` | Petra (place) + Calissa (model) | partly built (`progress/spiritlife.js`; `feedback/tracking/garden.js`) | NEEDS: a tappable mailbox or USE tile in the garden (typing is the only path today) |
| G117 | GARDEN-COZY | The three no-feeling sets' `gift`, `wish` and `visitor` ways (Tea Path, Kiln Yard, Stargazer): the draw in `spiritlife.js` goes by the spirit's feeling | Dovina | partly built (the lake-lotus way works) | no input (passive) |
| G118 | GARDEN-COZY | E2 seasons beyond look, cue, pieces and materials: plants that spread by season, wild visitors that come only in their season | Dovina + Petra | partly built (`seasons.js`, `gardenseason.js`, `gardenmood.js`; no season in `plants.js`) | no input (passive) |
| G119 | GARDEN-COZY | The set centrepieces by achievement (D5), and the briar visitors (A6) | Dovina | built (`CENTRE_FEATS`, progress/decor.js; briar visitors in `realm.js` VISITORS, gy22; the briar count into the visit check is Petra's) | no input (passive) |
| G120 | GARDEN-SWEEP | Name renames still open: the `PLANETOIDS` exports (`vfx/garden/planetoid.js`, `npc/realmnames.js`) to `PLANETOID_NAMES` and the like; `IndexMenu` as a general page window to a `PageWindow` | Petra + Espada + Calissa | partly built (Kiln to Tribulation, `s.hop` to `s.body`, `PLANETOID_SITES`, `PLANETOID_PLOTS`, `tribulationMat`, `jarBody` are done) | no input (code naming) |
| G121 | GARDEN-SWEEP | Unverified on a real device: a second black-screen cause behind SwiftShader, the published build, the garden's music, real-browser pointer-lock timing | Dovina (sweep) + Petra | waits on South (needs a real-GPU run) | touch: no pointer lock; check tap-to-go and the art bar on a phone |
| G122 | GODHAND | The hand's body: the slap (RMB tap on a creature: knocks it over, builds stun), a held thing swinging and knocking what it hits, the hand's shadow on the ground | Petra + Calissa (shadow) | not started (a `slap` clip exists in `godhandclips.js`; no verb, no shadow in `godhand/`) | NEEDS: slap on the god strip (ALT or a two-finger tap); shadow passive |
| G123 | GODHAND | Miracle and matter combinations by rule: Rain then Storm conducts across flooded ground, Rain then Aurora a frozen bridge, Pull on a river carries water uphill, Blight then Rain washes the ground, Eclipse stills a flood | Petra | partly built: `freeze`, `fuse`, `corrode`, `hold`, `pull` exist in `godhand/matter.js`; no conduction rule found | god strip and sign drawing as now; no new input |
| G124 | GODHAND | Reus's rule: miracles change what a place offers to the ecology (an ecology offer), not only damage | Petra + Dovina | not started (miracles apply statuses; `godhand/miracles.js` emits no offer) | no input (passive) |
| G125 | HANKO | Engine cradles beyond the Shrine gate: the Weir's sluice, a lift, a pump, a kiln, a forge, a drawbridge, running on the pool while sealed, plus more thresholds (a sealed door, a ruin's lock) | Petra + Dovina + Calissa | partly built: `engine` is a cradle kind in `world/cradles.js` with `drain`; only Shrine thresholds, the ships' helms and the basement course use cradles | USE (F) tile seals and unseals; no new input |
| G126 | HANKO | Found bodies: a clay golem in a ruin, a dredge, a diving bell at the Weir (a body cradle other than a ship) | Petra + Calissa + Dovina | not started | NEEDS: each body's own touch controls |
| G127 | HANKO | Two-seal cradles (a great gate, a galleon's twin helms) opened by a guest or sibling sealing beside you | Petra | not started (waits on real co-op) | USE tile for each seal; no new input |
| G128 | HANKO | At a Shrine, sealing into the island as the ceremonial way into the god hand (`~` stays the quick way) | Petra + Calissa | not started (the gate's page lists the Spirit Garden and travel only) | the Shrine page: tap a row |
| G129 | KEY-POSES | The stepped stage: hold a pose N frames then jump (ones, twos, threes by intent), after the pose tree and before IK, with the capsule, camera, hair and cloth at full rate, behind a setting | Petra | not started (no hold stage in `courier/anim/`) | no input (a settings row) |
| G130 | KEY-POSES | Re-pose the core movement as key tables: the kick's guard pose, the jump (jumpsquat, rise, peak, landing lag), the dash and run-start turnaround; tables exist only for the cutlass, Lockheart and the fighter | Calissa | not started | no input (passive) |
| G131 | KEY-POSES | Locomotion: a run from two poses a leg (pass, reach) with critically damped interpolation, compared in play with the mocap run | Petra + Calissa | not started | no input (passive) |
| G132 | KEY-POSES | Smears of one or two frames on the heaviest blows only | Calissa | not started (no smear code found outside the fighter's looks) | no input (passive) |
| G133 | KEY-POSES | The step rate's setting: one switch or per category (attacks, landings, everything) | South | waits on South | a settings row: tap |
| G134 | LACHRYMA-LOOP | Facility refining at scale: Margarite's Stillhouse (crude to refined Lachryma and aqua regia), priced so refining adds the value | Dovina (price) + Petra (building) + Calissa | not started (the Stillhouse is named in `econ/table.js` and the glossary only) | window: tap, or the USE tile at the station, as the Purser |
| G135 | LACHRYMA-LOOP | The graffiti hook: a blot hiding something (an ostracon, a cache) that cleaning reveals | Petra + Dovina | not started (`world/ground/stains.js` hides nothing) | the brush's MOP and CLEAN tiles as now |
| G136 | LACHRYMA-LOOP | The crude picture: `docs/ECONOMY.md` still says crude is graded by aspect (line 131) while `ECON.crude` is by field; re-simulate and draw what goes in and what comes out as a diagram (the owner's ask) | Dovina | partly built (ECONOMY.md by field, 2026-11-01); the passage block not re-simulated by field | no input (docs) |
| G137 | MAP | Per-thing ledger keys for the crystals-sung and geysers-ridden checklist rows (`crystal.sweet.at.<id>`, `geyser.ride.<id>`), still marked `needs` in `CHECKLIST_ROWS` | Petra (ids on `crystal.harvest` and `geyser.launch`) + Dovina | partly built (the rows and totals exist; the keys are unwritten) | no input (passive) |
| G138 | MAP | Checklists for the non-Dunes nodes: the Raceway park's gold medals N of M, and rows for the workshop, basement and bazaar (only the five Dunes areas have an `AREA_PAGE`; others default to rooms, vantage, Shrine) | Dovina + Espada (labels) | partly built | map window: tap a node, long press on a page calibrates the Sight (built) |
| G139 | MELEE-LOADOUT | Show a locked move's two ways (count and feat): cards say "Locked. Learned from X (to come)" and the Codex's Sondelass shelf has no tree of the next row's ways | Calissa (look) + Dovina (the rows' words) | partly built (`move.learn` and the earning are built; the tree view and the ways' words are not) | window: tap |
| G140 | MELEE-LOADOUT | Phase 6 feel items for South: the Crucibelle's toll reach and the hoover's reach are faint on noon sand; window sizes past 960 px | Calissa | waits on South (feel in play) | no input (passive) |
| G141 | MIMICRY | Possession puzzle: herd a flock of clapperjars into a pen drawn on the ground (a creature family, not matter) | Dovina + Petra | not started | god strip: Herd power on the domain arc; drag the hand; no new input |
| G142 | MIMICRY | Manifestation puzzle: a Sculpt creation (pillar, arch) copied, compared voxel to voxel, not by the field | Dovina + Petra | not started | god strip: Sculpt drag; no new input |
| G143 | MIMICRY | Divination puzzle: Layer View (the start's lower layers hidden; read them before copying) | Dovina + Petra | not started | god strip: Layer View power; no new input |
| G144 | MIMICRY | Espada's labels and lines for the stones, rungs and log (placeholders today) | Espada | waits on South (plain names until the mechanic is called final) | no input (passive) |
| G145 | MOBILE | The crossing's tiles: FIRE (held), LOCK (held, lift looses lances), ROLL, FORM, SURGE (lit when full), BOOST and BRAKE; the bindings (`raFire` .. `raBrake`) and the look-area lock sweep exist, no tiles are drawn (8.10) | Calissa + Petra | partly built (bindings and sweep exist; tiles missing) | NEEDS: crossing tiles (arc A FIRE, B ROLL, C FORM, D LOCK, F SURGE; stick forward/back = BOOST/BRAKE) |
| G146 | MOBILE | TOUCH-REBUILD's one arc (A to F fixed slots, G crouch in 3D), PICK and BELT radials (tap = next, hold 400 ms = radial), a press reading the stick on landing, the stick flick, one 400 ms hold, two-finger-tap undo, left-hand mirror | Dovina (slot table as data) + Calissa (look) + Petra (driver) | designed, not built (plan awaits South's ruling; South ruled crouch, F and one skeleton on 2026-11-01) | NEEDS: arc tiles, PICK/BELT radials, stick-reading press, flick, two-finger tap |
| G147 | MOBILE | The Arena's whole kit on touch: jab, four tilts, smash, five specials, grab, shield (bare hands have no LMB/RMB tile; CROUCH, PARRY, DRAW, SWAP, ART, BLINK show as dead tiles there) | Petra + Calissa | not started | NEEDS: A with stick direction (flick = smash), D specials by stick, E GRAB, B SHIELD, mask dead tiles |
| G148 | MOBILE | Strawman's Well stages on touch: the jar throw (LMB held bare-handed), the script line (RMB held), the troupe's jobs (keys 1 to 6) | Petra + Calissa | not started | NEEDS: A held = throw, D held = script line, troupe jobs on the PICK radial |
| G149 | MOBILE | The slip jelly mount can never be chosen on touch (the SKIFF tile taps Y 60 ms, the choice needs Y held 0.35 s) | Petra + Calissa | partly built (jelly face shown once chosen; choosing impossible) | NEEDS: BELT hold radial of mounts, or a long press (400 ms) on the SKIFF tile |
| G150 | MOBILE | Blink in the air or crouched has no tile | Calissa + Petra | not started | NEEDS: B tile = BLINK in the air; crouch on the stick's down in side-on modes |
| G151 | MOBILE | Layout editor keeps one layout; per-context offsets and a left-handed mirror switch (M5 parity) | Petra + Calissa | partly built (editor and keep exist, one layout) | window: tap in the layout editor; NEEDS per-context keep |
| G152 | MOBILE | Home-screen web app manifest (fullscreen, lifts Safari's 7-day storage eviction); whether the claude.ai frame allows it is open | Petra | not started (no manifest in index.html) | no input (passive) |
| G153 | MYCELIUM | Spirits tend spore beds: a quarter faster (`SporeBeds.tend` exists, no spirit ever sets it) and their grain bends the work (orderly truer prints, curious grafts the pair reversed) | Dovina + Petra | partly built (rule only, unwired) | window: tap (the bed's page: assign a spirit) |
| G154 | MYCELIUM | Spirits take the colour of the fruit they eat (strongest stat follows its feeling) and like one feeling's fruit, dislike its overcoming one (shown by body only) | Dovina + Calissa | not started | no input (passive) |
| G155 | MYCELIUM | A spirit of a feeling tending a bare bed seeds its own strain there in time; wild spore prints found in the Wells and Dunes (damp Great Dunemaw floors) | Dovina + Petra | not started | no input (passive); a found print is a pickup (USE) |
| G156 | MYCELIUM | The tree's diary: once a game day you visit, the log says what it ate and how its colour moved (Espada's lines) | Espada + Dovina | not started | no input (passive) |
| G157 | OPEN-SEA | Small tells on the water: gulls over a wreck or a herd, bubbles over a shoal (a rod spot at sea), a light under the water | Calissa | not started (15.6) | no input (passive) |
| G158 | OPEN-SEA | Fragments: salvage gives part fragments, a quay makes the part from enough (Subnautica); the beasts' half (forge) is built | Dovina | not started (15.6) | window: tap (the pier's parts page) |
| G159 | OPEN-SEA | Capture or slay: a harpooned, stunned beast towed home for a live fee, or its statue in the Spirit Garden | Dovina + Petra | not started (15.6) | helm: MOUNT radial (harpoon); NEEDS a tow/hold verb |
| G160 | OPEN-SEA | A song for the wind: the Crucibelle sets the wind for a game hour at a Lachryma cost (Wind's Requiem) | Dovina + Petra | not started (15.6) | NEEDS: the Crucibelle's five note pads at the helm (MOUNT radial) |
| G161 | OPEN-SEA | Tall tales: a few authored chains through riddles, islets, a herd and a beast, their reward a look or a title | Espada + Dovina | not started (15.6) | window: tap; the helm's existing tiles |
| G162 | OPEN-SEA | Fog that hides the herds (a look first, then a rule); weather that matters beyond gales | Calissa + Dovina | parked (14.8: held for later) | no input (passive) |
| G163 | OPEN-SEA | A bounty board so the charted safari keeps paying (the rumour is a one-beast version) | Dovina | parked (bounties stay parked, section 9.1) | window: tap (the dock's board) |
| G164 | OPEN-SEA | A sandbar islet that comes and goes with the hour (the kit is drawn; no tide in `seaprops.js`) | Petra + Calissa | partly built (kit drawn, tide missing) | helm: USE (moor) only while it is up |
| G165 | OPEN-SEA | The Egregores', islets', beasts' and parts' names and the log lines | Espada | waits on South (plain names until the owner calls it final) | no input (passive) |
| G166 | OVERLAY | Tags on things that are not creatures: a crystal's fret, a shop good's price, one of the folk's name (only creature tags and odds tags exist) | Calissa + Petra | not started | NEEDS: long press (400 ms) on the thing, or the lock-on tap, to show its tag |
| G167 | OVERLAY | Section 9's two-avenue gaps: a tag on a cracked region, a tag when the Dreamvane reads the weather, the hour outside the lens, a sound for a low pool, a world avenue for cubes | Calissa + Wanda | partly built (cube plate, Sight clock exist) | no input (passive) |
| G168 | OVERLAY | The Codex (B) and the Pneuka Box (P) as System windows summoned into the air before the Courier, and the Veritome's Book as a held object that opens (Greed Island); today DOM pages in the Clay dress, only the Assay's window and the reading table are the new kind | Calissa + Petra | partly built | window: tap; top bar icons already open them |
| G169 | OVERLAY | The Lantern Wisp's bestiary facts (so it has a habit line); clapperjars made real members of `game.creatures` so `creatures.strike` and the tag reach them | Dovina + Petra | half built (the Wisp's eleven facts, `bestiary.js`; the clapperjars as creatures and an `aberrant` state on the Wisp's subject are Petra's: handoff 2026-11-02-from-dovina-round) | the Veritome's lens tap |
| G170 | OVERLAY | The windows are private; letting a guest or sibling see yours | Petra (COOP.md) | waits on South ("later", multiplayer) | no input (passive) |
| G171 | PAINT | Imported meshes as paint charts (only where a room needs it; needs a second UV set from the exporter) | Calissa, then Petra | not started (phase 4) | no input (passive) |
| G172 | PAINT | Cell mixing: paint into paint mixes by the agate (opposites cancel), paint into crude takes the oil film (`paintmap.js` says a cell "never mixes by running") | Petra + Dovina (numbers) | not started | no input (passive) |
| G173 | PARKED | Reading a creature's temperament (the Veritome shows grain; the bestiary's "Weak to"), until a much expanded Bestiary on Calissa's Workbench viewer | Dovina + Calissa + Petra | parked | Veritome lens tap / window: tap |
| G174 | PARKED | A spirit at work on the Athanor (an extra step a press) | Dovina | parked (until South tests the press) | window: tap |
| G175 | PARKED | The weather reaching fish and creatures (bite by weather, the Fish Guide's column, moods drifting) | Dovina | parked (until the fishing rework) | rod: the existing cast/reel tiles |
| G176 | PARRY | Achievements by tool: a sub "The Parry" under THE ARTS, one with each tool, a hundred in total (only pa1, pa2, cu15 exist) | Dovina | built 2026-11-01 (pt1 to pt10: each tool 25, every tool, 1000); the plan's hundred in total not reached | no input (passive) |
| G177 | PARRY | One log line for each parry kind in Espada's words (`PARRY_SAY` lines are placeholders) | Espada | partly built (placeholders) | no input (passive) |
| G178 | PARRY-CLIPS | Found clips for the other tools' parries: psygun snap (`castShoot`), brush bat and soak, Veritome shutter (`punchJab`), Dreamvane twirl, Crucibelle toll, Lockheart gulp (`parry.try` is emitted, nothing listens; the kick's and cutlass's exist) | Calissa | partly built (kick and cutlass only) | arc E PARRY (existing tile) |
| G179 | PARRY-CLIPS | The Dreamvane twirl's spin: procedural today, an authored two-key hand loop only if it reads wrong | Calissa | not started (optional) | no input (passive) |
| G180 | PASSAGE | Ledger and achievements for storms, adrift and the day's best (`passage.adrift` is counted, no achievement reads it) | Dovina | partly built (ps1 Adrift, 2026-11-01); storms and the day's best need a count | no input (passive) |
| G181 | PASSAGE | The ship shows its tank as a gauge on the model, the draught's trump as a mark on a lane, the current's drift | Calissa | not started | no input (passive) |
| G182 | PHOTO-MODE | Step 2: photo mode from the pause menu (PHOTO), time frozen, HUD gone, free camera in a 12 m sphere with FOV, roll, focus and aperture, a grade, hide-UI full-resolution screenshot; refused in a fight, duel or on the rail; counts nothing | Petra (camera, time) + Calissa (looks) | not started (step 1, arrow keys, is built) | NEEDS: PHOTO in the pause menu's verbs row; two-finger pan/pinch/twist for the camera; window: tap for sliders and a shutter |
| G183 | PHOTO-MODE | Posing in photo mode: hold any emote, feeling clip or Anim Lab clip stepped by frame; expression and held tool from what you own | Calissa + Petra | not started | window: tap (pose list, scrubber) |
| G184 | PUZZLE-DUELS | More rule modules: diagonal runs, crash gem, rainbow; line clears, Lumines sweep, Qix, drilling; ice and conveyors, Magical Drop grab-throw, Meteos launch; timer junk, hard junk, patterned junk, viruses (section 5 "to come") | Dovina | not started | duel screen: drag; no new input |
| G185 | PUZZLE-DUELS | Rules as tiles: an aberrant's rules spelled on its side as neuralese sentences, pushing a tile rewrites the rule, familiarity reads them over its board | Dovina + Calissa + Espada | designed, not built | duel screen: drag a tile (the one-gesture drag) |
| G186 | PUZZLE-DUELS | A ruleset per feeling's families (Wonder tiles/rainbow, Mirth chains/ice, Desire magnets, Fury bombs/kicks, Gall hard junk, Grief sinking, Dread fog/timer); only the Wisp, slip jelly and Strawman boards exist | Dovina | partly built | no input (passive) |
| G187 | PUZZLE-DUELS | Co-op on the board: a side holds the party (up to 4), each with own form, AP and pool, a finisher paid together, siblings play by their division's weights; only per-side AP is built | Dovina + Petra | designed, not built | duel screen: NEEDS a guest's own device; a sibling needs no input |
| G188 | PUZZLE-DUELS | The Wake Whistle as a sure way out of a duel (ends it whole, unrolled) | Dovina + Petra | designed, not built | duel screen: NEEDS a whistle tile or the Box use on the duel screen |
| G189 | PUZZLE-DUELS | Best of three and a PvP mode (the classic forms path is kept behind `style`), enemy assists | Dovina | parked | duel screen: drag |
| G190 | QUESTS | More quests: the folk's troubles island by island (only The Understudy exists) | Espada (writes) + Dovina (predicates) | not started | window: tap (the journal) |
| G191 | QUESTS | What quest points buy (a cape at all of them, a door that needs some) | Dovina | waits on South | window: tap |
| G192 | QUESTS | Whether every Well is someone's head (Psychonauts), making Wells and quests one system | Dovina + Espada | waits on South | no input (passive) |
| G193 | QUESTS | Espada's words: quest names, troubles and each step's two lines (placeholders today) | Espada | partly built (placeholders) | no input (passive) |
| G194 | RAIL-FLOW | `scripts/rail.mjs` still models the pre-stretch 34-bar pieces; par is to be re-measured once the stream plays | Dovina | partly built | no input (passive) |
| G195 | RAIL-FLOW | The flock on the GPU (three.js GPGPU birds) past 800 boids, only if South wants more; the batch's home in `render/` is an open question | Petra + Calissa | designed, not built | no input (passive) |
| G196 | RAIL-MODULES | The shot budgets (plain 192, outlined 24; 600 glints and 400 shots at the peak) measured by `npm run perf`, not guessed | Petra | designed, not built (the plan's "still open") | no input (passive); crossing tiles per MOBILE |
| G197 | RAIL-STANDARDS | The fairness checker also judging contrast, once the crossing is settled | Dovina + Calissa | parked (crossing in flux: no new checks) | no input (passive) |
| G198 | RAIL-STANDARDS | In-leg branching beyond the arches' way | Dovina + Petra | parked ("waits") | NEEDS: crossing tiles first (MOBILE) |
| G199 | REGISTERS | A second base material (glass first): its spec (what earns it, what it costs, a sink and unlock track), its base shader and its crack pattern (clay cracks, glass crazes, nacre chips); only clay exists | Dovina (spec) + Calissa (shader, cracks) + Petra | not started | window: tap (the finishing station's page) |
| G200 | REGISTERS | The base material's player name and the Heavenly Kiln's neutral name | Espada + South | waits on South | no input (passive) |
| G201 | REGISTERS | A second island's finishing station, its ground layers as data (`matter.js GROUND`) and its folk's tiers (Margarite's, Entropolis's) | Dovina + Petra + Espada | parked (until a second island is built) | no input (passive) |
| G202 | REGISTERS | A domain's look as colour and sign without "kiln glaze" as identity; `DOMAIN_GLAZE` removed when `DOMAIN_LOOK` lands (still imported by `progress/skills.js`) | Dovina + Calissa | partly built | no input (passive) |
| G203 | SANDBOX | Pots and bricks thrown by creatures at the Courier (the thrown hit runs one way, by the Courier or the environment) | Petra + Dovina | not started | arc E PARRY (existing tile) |
| G204 | SANDBOX | Espada's lectern lines and log lines (placeholders) | Espada | waits on South (plain names until final) | no input (passive) |
| G205 | SHRINES | The Shrines achievements: find every Shrine; travel a hundred times (only sr1 exists) | Dovina | built 2026-11-01 (`progress/countachievements.js` shr1 to shr3) | no input (passive) |
| G206 | SKIFF-RACING | Slipstream (skipped by South until rivals existed; rivals now exist) | Dovina | parked | no input (passive) |
| G207 | SKIFF-TUNING | The SET button on the race board's PAINT tab (a skiff set is worn only by the DEBUG `/skiffset` command) | Calissa + Petra | partly built (set data and look exist, no button) | window: tap (the PAINT tab) |
| G208 | SKIFF-TUNING | T10: a sound for the sail's trim (the sheet in the wind) | Wanda | not started (optional, "if she wants one") | no input (passive) |
| G209 | SKIFF-TUNING | T9: the parts' and sliders' player names | Espada | waits on South (plain names until settled) | no input (passive) |
| G210 | SLICE | The reckoning's lane marks on the rail: each wave's lane glyph-popped `reckonLead(r)` real s early (the survey verb is wired at the sea chart, `world/emocean/seachart.js`; nothing on the rail reads `reckonLead`) | Petra + Calissa | partly built (data, survey and heave-to scouting in; lane marks not) | no input (passive) |
| G211 | SLICE | The FOE as Etrian Odyssey's: visible, patrolling, routed round, its route shown by Divination (the Great Slip Jelly is a timeline today) | Petra + Dovina | waits on South (parked for the Wells deep dive) | no input (passive); route shown as a world mark |
| G212 | SLICE | Wells of radically different types (an action Well beside, say, a JRPG board-game Well; ENDGAME.md genre floors) | Dovina + Petra | waits on South (parked) | NEEDS: a board-game screen (the duel screen is the nearest model) |
| G213 | SLICE | Placeholder achievement names: Cartographer's Cut, Dead Reckoning (R57) | Espada | partly built (placeholders in `achievements.js`) | no input (passive) |
| G214 | SONDELASS-STRINGS | Sond_Flourish (1.97 s show clip) is unused: a flourish/emote for the cutlass | Calissa + Petra | not started | no input if an emote (chat line / emote wheel); NEEDS a slot if on a key |
| G215 | SONDELASS-STRINGS | The 12 normals and 6 specials of the melee loadout carry their own `stats` in `sondelassloadout.js` until Dovina folds them into `progress/combat/moves.js` | Dovina | partly built (moves play; rows not taken into her table) | no input (passive); loadout editor is a window: tap |
| G216 | SONDELASS-STRINGS | The paid cut's player word (working name; the log line on first use is a placeholder) | Espada + South | waits on South (the word is Espada's and the owner's) | A tapped again in the recovery (cluster A); no new input |
| G217 | SONDELASS-STRINGS | Watch it at speed: hit-stop in the tables, a clapperjar juggle, a paid cut out of the launcher and the air string, W+RMB and S+RMB while running (only stills and a pinned jelly were read) | Calissa (Petra for runtime) | not started | cutlass special = flick up or down on the look area (exists); NEEDS check that a flick works while the stick runs |
| G218 | SOUL-ALCHEMY | The two assists: `alchemy.spokes` (seven faint spokes) and `alchemy.seals2x` (seals at 32 px), off by default | Calissa + Petra (setting) | designed, not built (no setting found) | window: tap (a settings row) |
| G219 | SOUL-ALCHEMY | A spirit at work on the Athanor gives that feeling's materials one extra step (`GardenPress.extra()` returns 0; `workBonus` knows only 'slot' and 'bed') | Petra + Dovina | partly built (hook in the walk, always 0) | no input (passive) |
| G220 | SOUL-ALCHEMY | The press view measured with `npm run perf` before and after | Petra | not started | no input (passive) |
| G221 | SOUL-ALCHEMY | The seals' names to confirm and the folk saying a glaze matched to the soul colour (the soul glow is noticed past 0.3; the glaze line is not) | Espada | partly built | no input (passive) |
| G222 | SPIRIT-COOKING | Rice family at a donabe (rice, simmer): the second family, `FAMILIES.rice built:false`, its moves data only | Dovina (rules) + Petra (minigame) + Calissa + Wanda + Espada | designed, not built | window: tap and drag; the rinse and the water line are a thumb drag with a wide good zone (the plan says every gesture is touch-first) |
| G223 | SPIRIT-COOKING | Broth family (simmer, steep; dashi, kombu and katsuobushi, umami x) | Dovina + Petra + Calissa + Wanda | designed, not built | window: tap; "do nothing correctly" = a held dial, thumb drag |
| G224 | SPIRIT-COOKING | Tea family (steep; the leaf's band, bubble tells) | Dovina + Petra + Calissa + Wanda | designed, not built | window: tap and hold |
| G225 | SPIRIT-COOKING | The other moves played: cut, sear, sugar, roux, emulsion, ferment, smoke, bleed, serve (all fourteen are data in `progress/cooking/moves.js`; only knead, proof, bake are played) and the sear, sauce, sweet, ferment, smoke families built on them | Dovina + Petra | designed, not built | window: tap, drag, hold; NEEDS a distinct gesture each (hold-lift, stir circle, dual pour and whisk drag, tilt-free) |
| G226 | SPIRIT-COOKING | The cooking rules priced: `scripts/cooking.mjs` against the aim (a draught's lift must not out-earn the press) | Dovina | built 2026-11-01 (`scripts/cooking.mjs`: a TRUE loaf lifts one material 0.67 of a tier's step, never a tier) | no input (passive) |
| G227 | SPIRIT-COOKING | Bonds: a spirit's favourite dish raises its bond faster; the folk's orders (Dave the Diver); a sibling at the pot at half or a quarter skill | Dovina + Petra + Espada | not started (sibling waits on South: avatars not done) | window: tap (give a dish) |
| G228 | SPIRIT-COOKING | Batch (up to ten, after three True cooks) and auto-cook as a knack (one grade below your best); long steps on the game clock for the other families | Dovina + Petra | built (`progress/cooking/batch.js`, the Eat action, knack `autoCook`; its hooks in Petra's `world/garden/kitchen.js`, marked G228, for her review) | window: tap ("cook x N"); auto-cook no input (passive) |
| G229 | SPIRIT-COOKING | Recipes found by tasting (a dish from a folk or spirit teaches it) and by repair (a recipe slab with lines missing, Venba); by experiment is built | Dovina + Espada + Petra | partly built (experiment only) | window: tap and drag the slab's lines |
| G230 | SPIRIT-COOKING | The pot as a part: made and glazed at the kiln, wall thickness sets the bands, medome seasoning with rice porridge, thermal shock cracks; a portable clay pot at a Shrine | Dovina + Petra + Calissa | designed, not built (portable pot: waits on South, "later, if ever") | window: tap |
| G231 | SPIRIT-COOKING | The thermometer: a late-earned knack, never needed: `KNACKS.thermometer` (150 served or 20 True cooks; the value and its heart shown), its switch in the cooking window Petra's | Dovina + Petra (switch) | rules built 2026-11-02 | window: tap (a knack toggle) |
| G232 | SPIRIT-COOKING | The looks: the hearth is a placeholder clay fire bowl (`world/garden/hearth.js`); pots and glazes, each tell drawn honestly (syrup in water, roux ramp, rinse water, steam), the served dish | Calissa | not started | no input (passive) |
| G233 | SPIRIT-COOKING | The sounds: the knead's thump on the beat, the oven, the knock, the sizzle quietening, the boil's first bubble, the kettle's stages, the whisk (two avenues per tell) | Wanda | not started (nothing in `src/audio`) | no input (passive) |
| G234 | SPIRIT-COOKING | The words: dish names (placeholders), the tells, recipe slabs, a folk's broken family recipe | Espada | partly built (placeholder names) | no input (passive) |
| G235 | SPIRIT-GARDEN | GROWTH x1.25 on beds (own-feeling ground, own-feeling water) and a spirit drinking its stat's feeling (+1 a game hour): `GROWTH` and `WATERS` are defined and read by nothing outside `realm.js` | Petra (Dovina's numbers) | partly built (constants only) | no input (passive) |
| G236 | SPIRIT-GARDEN | A guest in your garden does more than hop and look: pet your spirits, spar at the Chimney, leave a material in the shed's gift slot (`GUEST`; `coop/guests.js` waits on Dovina's transfer) | Petra + Dovina | partly built (guest Jar drawn, visit rule only) | garden art bar / window: tap |
| G237 | SPREADS | A court class's look: a court's crest on the bracelet, or nothing beyond the name (section 9.4) | Calissa + South | waits on South | no input (passive) |
| G238 | STEALTH | The head-up and head-down tell on the slip jelly and the Lantern Wisp from `c.vigil.up` | Calissa | not started (no vfx reads `vigil.up`) | no input (passive) |
| G239 | STEALTH | The footstep ripple on the ground at the step's radius while sneaking, and whether your own exposure wants a world mark | Calissa | not started | no input (passive) |
| G240 | STEALTH | An optional small sound when a creature's head comes up (sniff, turn) as the watch's second avenue | Wanda | not started (optional) | no input (passive) |
| G241 | STEALTH | Safari 1: two readouts a plate, stars rate the behaviour caught and the score rates the framing (stars are still cut from the score) | Dovina + Petra | designed, not built | lens: A taps the shutter (exists) |
| G242 | STEALTH | Safari 2: four behaviours a Figment (anywhere, conditional, candid-only, lured), read from the mind's current action, not guessed from the hour | Petra + Dovina | designed, not built | no input (passive) |
| G243 | STEALTH | Safari 3: research by area, a level opening the area's night variant and rare finds | Dovina | designed, not built | window: tap (Codex) |
| G244 | STEALTH | Safari 4: Lachryma lures as the provocation, thrown or painted, costed in the pool | Petra + Dovina | designed, not built | NEEDS: a lure throw (R sub verb or PAINT tile aiming; no lure tile for the Veritome) |
| G245 | STEALTH | Safari 5: the darkroom as Professor Oak, the day's best plate of each Figment judged and the log saying why | Dovina + Petra + Espada | designed, not built | window: tap |
| G246 | STEALTH | Safari 6: the Veritome's lens reworked as a safari camera (frame, focus, shutter beat), the plate's stars drawn as the behaviour's, the candid mark | Calissa | designed, not built | lens: A shutter; NEEDS check of a focus control on the phone |
| G247 | STEALTH | Safari 7: what it pays (a research level as the sea's discoveries do; a behaviour's first plate a `FirstToday`) | Dovina | designed, not built | no input (passive) |
| G248 | STEALTH | Flight rings (an unaware Figment approached inside its flight distance bolts), habituation, a Lachryma scent on the wind | Petra + Dovina | designed, not built (scent waits on an island wind) | no input (passive) |
| G249 | STEALTH | Open: stealth into the Great Dunemaw floors (the FOE has no mind) and the clapperjars' own 8 m check joining the minds' parts | Petra | not started | no input (passive) |
| G250 | STRAWMANS-WELL | The rope's swing launch (the rope is climb-only), pogo off foes and spikes with a downward blow, grab and throw a dummy in the Brawl | Dovina | not started (no code under `world/strawmanwell`) | jump = C; pogo = down blow (C then S, NEEDS check); grab: NEEDS a grab tile (the Arena's grab has no touch path) |
| G251 | STRAWMANS-WELL | The Machine's pulley and on/off blocks; a crate that floats on the Flood's liquids (liquids are not solid to props) | Dovina | not started | no input (passive) |
| G252 | STRAWMANS-WELL | Raising clay at a lectern (only the hand's Sculpt raises) | Dovina | partly built (`god.sculpt` raises) | god strip: SCULPT; lectern = F / USE |
| G253 | STRAWMANS-WELL | Strawman's ghost guide (runs each stage first as a ghost of straw) and the rival on the gauntlet's ghost line | Dovina + Calissa | not started | no input (passive) |
| G254 | STRAWMANS-WELL | The cannon is a placeholder, not the Wisp turret; the key is a plain key, not a Possibilikey | Dovina + Petra | partly built (placeholders) | no input (passive) |
| G255 | STRAWMANS-WELL | Touch paths for the side-on stages: the Jar's throw (LMB held bare-handed), the Script's line (RMB held), the Troupe's jobs (keys 1 to 6) | Petra (input) + Calissa (tiles) | not started (found by the touch audit) | NEEDS: a held drag-aim on A for the throw, a finger drag on the stage for the script line, a job picker (PICK radial) plus a tap on a dummy for the troupe |
| G256 | STRAWMANS-WELL | The Fez turn: the whole stage turned a quarter round (a stretch, later) | Dovina + Petra | parked ("a stretch, later") | stick (move) and a flick; NEEDS: nothing yet designed |
| G257 | STRAWMANS-WELL | The Wall in the open world: the Paint Dive into any painted wall of the 3D world, out as a 2D stage on its face (the stage version is built) | Petra | partly built (stage only; "later, Petra's") | C held in paint (G crouch slot); no new input |
| G258 | STRAWMANS-WELL | Strawman's quest finished (QUESTS.md): it rehearses being struck; the quest helps it play a different part (only the get-in and clear-a-stage steps exist) and the stage and verb names (all placeholders) | Espada + Dovina | partly built | window: tap (quest journal) |
| G259 | STUN-DEPTH | The tag's statuses line names the depth from STUDIED (OVERLAY.md 17) | Calissa + Petra | not started (`creaturetag.js` has no depth) | no input (passive); lock-on or raised lens |
| G260 | STUN-DEPTH | A beat of hit-stop on the first stun, the moment to notice | Petra | not started | no input (passive) |
| G261 | STUN-DEPTH | The three names (dazed, stunned, out cold) are working names, to rule | Espada + South | waits on South | no input (passive) |
| G262 | SUBSTRATE | F2: a plain shot draws on the ambient Lachryma round you (free at sea, cheaper in weather, on paint or crude, full under a roof) instead of 4 from the pool on foot | Petra + Dovina | waits on South (it changes how the psygun feels on foot) | FIRE on A, unchanged |
| G263 | SUBSTRATE | F2: one cost per tool in every mode (the flash is 6 on foot and the rail, 8 plus 12 s at sea), the Surge filling only from absorb past a full pool, the open sea's fuel becoming the Lachrymato Bottle | Petra + Dovina | designed, not built | no input (passive) |
| G264 | SUBSTRATE | F4: one unit of damage, the blow (a pot's hp in blows, one move-power table, one LANCE, one flash cost, `FOE.hp`) | Dovina + Petra | partly built (the vessel's rule is one door; the duplicate tables are not all gone) | no input (passive) |
| G265 | SUBSTRATE | F5: the Arena's percent drawn from the vessel's cracks (crack sum / 3.6 x 100), the 60-point shield bubble as the pool | Dovina + Petra | waits on South (once FIGHTER is called settled) | Arena tiles: A attack, B shield (held) |
| G266 | SUBSTRATE | F6: the duel reads the real pool, frozen while the board is up (no regen, no copy, no write-back) | Petra + Dovina | partly built (the real pool is read at the open) | the duel screen (exists) |
| G267 | SUBSTRATE | F7: every cost, regen, max and intake multiplier through one modifier stack with a source, the tube showing cost and regen modifiers as it shows caps, the god hand's regen x1.6 given a source, use tags separate from harm tags | Petra + Calissa | partly built (`addModifier` with source and secs; the tube shows caps only) | no input (passive); tube mirrored bottom-left |
| G268 | SUBSTRATE | F8: the skiff drinks the sun (a regen modifier by hoist, sail parts trade a flare's cost), a brimming pool is loud (overflow raises the signature `exposureOf` reads), a Dissonance Level holds off a share of the pool as the held stretch | Petra + Dovina | designed, not built | skiff auto-sail (exists); the rest no input (passive) |
| G269 | SUBSTRATE | F3's type chart tells: a trump's flash, so the chart is read in play | Calissa | designed, not built | no input (passive) |
| G270 | SUNSHINE-SYSTEMS | The Soul Brush "The Load" achievements (wash 100 m2, a stain of each grade, put out ten fires, a creature down on your own paint, slide 500 m on wet ground) | Dovina | built 2026-11-01 (ld1 to ld4: paint, mop, grown blots, the slide); a fire put out and a creature down on your paint not counted yet | no input (passive) |
| G271 | SUNSHINE-SYSTEMS | The coated folk: a folk in a spill is coated and the mop cleans them, `folk.clean` counted | Calissa (look) + Dovina + Petra | not started | MOP tile (exists) |
| G272 | SUNSHINE-SYSTEMS | The water load (free at a water offer: washes, puts out fires, wets ground) and the slip load (slide lanes), with `fire.out` and `slide.wet` events | Dovina + Petra | not started | PAINT or MOP tile pick (strip) |
| G273 | SUNSHINE-SYSTEMS | The weather fills and dries a load by a rate (rain refills, Dunes day dries, roofs neither) | Dovina + Petra | not started | no input (passive) |
| G274 | SUNSHINE-SYSTEMS | Painted ground gives off a signature the Dreamvane hears (no paint entry in `core/signatures.js`); a brush profile in `scripts/economy.mjs` to price the bottles | Petra + Dovina | not started | no input (passive) |
| G275 | SWEEPS | The cast ids are placeholders (`crownBash`, `brineLine`, `slipNova` ...) to become Espada's names (`lidfall`, `shoulderCharge`, `blowout`), table first, then `raid.js` and the sweep in one pass | Dovina + Espada | not started | no input (passive) |
| G276 | SWEEPS | Glossary renames still owed: the `lab` place id to `movementLab`, the Weir, treasury and Tithe moved out of `tools/sondelass/angling/weir.js`, `trial.jars` and `brush.draw`, "The Board" and "Board Rider" to the Solar Skiff | Petra + Dovina + Espada | partly built (rank.up, testroom, SOLAR, shrine ids done) | no input (passive) |
| G277 | SWEEPS | Sweeps for rooms with none (Raceway, Raku's Bazaar, Touchstone, Sandbox, mimicry, puzzle duels) | Dovina | parked (CLAUDE.md "Test lean": a check once the owner calls a room settled) | touch.mjs sweep exists for the phone |
| G278 | SYSTEMS | C3 Summoning: a caught Figment comes out of the Lockheart as an ally and fights beside you, a key burned on release adds an effect, a favourite slot among several (`bound.js` holds them; only the garden lets one out) | Dovina (rules) + Petra | not started | NEEDS: a pick from the bound list (PICK radial) on the Lockheart's tiles |
| G279 | SYSTEMS | C4 Conversion: baubles into cubes, the keys setting yield and risk (`CONVERT` is data in `tools/lockheart/table.js`, unwired; its key pricing is open for South) | Dovina + Petra | designed, not built (waits on South for the key pricing) | Lockheart coffin tiles (exist) |
| G280 | SYSTEMS | C5 The look and sound of the three Lockheart modes, the catch wheel, a Figment inside the coffin | Calissa + Wanda | partly built (reliquary and cues exist; per-mode look not confirmed) | the reliquary is the bottom band |
| G281 | SYSTEMS | D3 Caster shell crafting from materials (recipes, materials, domain level as a tier's ceiling; the ruling replacing K2: "shells are crafted by Spellscription") | Dovina (recipes) + Petra (bench) | not started | window: tap |
| G282 | SYSTEMS | D8 Foraging and the garden: fodder materials on timers (OSRS herb runs) | Dovina + Petra | not started | window: tap |
| G283 | SYSTEMS | D4 Commissions by Figment class and D6 Throwing pots for pay (both cut by the owner, 2026-10-09; the bounty board stays) | Dovina | parked (cut) | n/a |
| G284 | SYSTEMS | E1+ Wells' later layer: shortcuts opened on later runs | Petra + Dovina | waits on South (the Wells deep dive) | no input (passive) |
| G285 | SYSTEMS | E2 Cogitomaps as tickets: a charted map is a ticket to a seeded run of its Well, Spellscription copies a good one, traded and hauled (the item carries `seed`, `day` and `worth`; no run from a map exists) | Dovina (item) + Petra (run from a seed) | partly built (item, worth, widening `spellscription.copy`) | window: tap (Pneuka Box item) |
| G286 | SYSTEMS | E5 Island demand beyond crude: each island wants other materials, classes of Figment, particular Wells (`demand()` knows only crude and Cogitomaps) | Dovina | not started (model first, simulated) | window: tap (shops) |
| G287 | SYSTEMS | E6 Contractors, Gambits, the grid and the Metronome: a Well's tactical layer | Dovina | parked (held) | NEEDS: a tactical screen |
| G288 | TEMPERAMENT | The minds read grain: weights in the Brain and reasoner by `traitsOf`, susceptibility in `creatures.build`, fear through a pack (an 'alarm' stimulus on fear onset) | Petra | not started (data only: no creature sets `c.grain`) | no input (passive) |
| G289 | TEMPERAMENT | The Veritome reads `c.grain` (one trait at 1 star, all five at 4) and writes it through a status `nudge { trait, by, dur }`; the bestiary line "Grain: curious, bold, steady. Weak to: ..." | Petra + Calissa + Espada | not started (`creaturetag.js` reads `c.grain`, never set) | raised lens / reprogram macro screen (exist) |
| G290 | TEMPERAMENT | The body's six dials on every body (lean, amplitude, regularity, tempo, softness, startle), grain owning movement and posture only | Calissa | not started | no input (passive) |
| G291 | TEMPERAMENT | The voice: one creature voice module, one trait one dimension (contour, rhythm, reach, timbre, stability) and the `creature.call { kind, by }` event | Wanda + Petra | not started | no input (passive) |
| G292 | TEMPERAMENT | A caught Figment keeps its grain in the garden slot; the ledger and achievements (every trait read, a mind cracked by its weakness) | Dovina | blocked: no creature is given a grain yet (`drawGrain` is called nowhere; `c.grain` is read only by the tag), so there is nothing to keep or count; Petra first (handoff 2026-11-02-from-dovina-round) | no input (passive) |
| G293 | TESTROOM | A tunable Strawman: grain, mental state, affinities and presets mirroring real creatures (DUNEMAW-SYSTEMS.md 5), a console beside it | Dovina + Petra | designed, not built | window: tap (a console) |
| G294 | TOOLS-TOGETHER | The 17 pair specials still to build (21 pairs; built: 19 The Mark, 6 The Lovers' rung line, 17 The Star's painted lure, 3 The Empress's coffin's mop), in waves of four | Petra (verbs) + Calissa (looks) + Dovina (rules done) | partly built (4 of 21) | R is the sub's verb (LEND tile); NEEDS: a pair-special slot (F meter or art slot) |
| G295 | TOOLS-TOGETHER | Shells crafted by Spellscription (same as SYSTEMS D3; the ruling that replaced K2's `borrows`) | Dovina + Petra | not started | window: tap |
| G296 | TOOLS-TOGETHER | Kintsugi: the Soul Brush mends one cracked region of the vessel in gold (Bottle cost, a still brush stroke held; the MEND circle only mends pots and wrecks) | Petra + Calissa + Espada | not started | NEEDS: a held-still mend stroke on the brush tile |
| G297 | TOOLS-TOGETHER | The Dreamvane on the rail: a survey ping that shows the next wave's edge marks a bar sooner | Petra | not started | NEEDS: a rail tile for the Dreamvane (the crossing has no tool tiles) |
| G298 | TOOLS-TOGETHER | The Lockheart's conversion mode (same as SYSTEMS C4); the first-path step "wear the Dreamvane and strike a crystal" (not found in the goals) | Dovina + Petra | designed, not built | coffin tiles (exist) |
| G299 | TOOLS-TOGETHER | K3, each string a rhythm (beat-doubling, the bell earning its place) and the Veritome's macro hints written for any creature (they name slip jellies) | Dovina + Petra | waits on South (K3 not ruled) | no input (passive) |
| G300 | TOOLS-TOGETHER | K1's six keys that wait for their feature (macro length, macros kept, the hand's lift weight, the Lockheart's hold, a sunder's cuts, a map's copies) | Petra + Dovina | partly built (`spellscription.slots` and `.copy` rows read or waiting) | no input (passive) |
| G301 | TOUCH-REBUILD | The arc as data: `TOUCH_ARC`, one row a context (A to G, PICK, BELT), the masks read so a masked slot is not drawn | Dovina | designed, not built (waits on South's yes to the whole plan) | the plan itself |
| G302 | TOUCH-REBUILD | The touch driver: a press reads the stick as it lands, the stick flick, one 400 ms hold, the two-finger undo, per-context layouts | Petra | designed, not built (waits on South) | the plan itself |
| G303 | TOUCH-REBUILD | The arc's tiles in the Clay dress (two rings round A, Calissa's geometry), PICK and BELT radials, the stick's crouch notch | Calissa | designed, not built (mock-ups made; waits on South) | the plan itself |
| G304 | TOUCH-REBUILD | Three touch bugs before the rebuild: the jelly mount cannot be chosen (Y tapped 60 ms, needs 0.35 s held); the crossing has no tiles; the Arena's bare hands have no attack and six dead tiles | Petra | not started (found by the 2026-11-01 audit) | NEEDS: a held SKIFF for the mounts; rail tiles; the Arena's cluster |
| G305 | TRACK-EDITOR | The other seven traps: the antlion out of its pit, a boulder, a hasten field, a storm cell, a ward gate, a pot catapult (seven built: pillars, pendulum, gust gate, sinkhole, gusher, portal pair, Wisp turret; the siphon is the licence's) | Dovina (rules) + Petra + Calissa | designed, not built | possessing a trap needs a tap (the haunt uses LMB or Space on a trap): NEEDS a touch path |
| G306 | TRACK-EDITOR | The party mode (Ultimate Chicken Horse: each round each picks a trap from a box of three) with siblings and guests | Dovina + Petra | waits on South (live guests were ruled out for now; bots only) | NEEDS: a trap picker and a place tap |
| G307 | TRACK-EDITOR | W5 sharing beyond a code: a guest riding the host's track, a shelf of tracks, "endless" of shared tracks | Petra + Dovina | not started (share codes and kept haunts are built) | window: tap |
| G308 | TRACK-EDITOR | Read (Divination) shows a possessed trap's next intent a beat early, the possessor's aim as a ghost line | Dovina + Petra + Calissa | not started | no input (passive) |
| G309 | TRACK-EDITOR | Trap kinds opened by achievement (count way or feat way) instead of by their god powers' level: `TRAP_OPEN`, `trapOpen` (traps.js), the editor's box reads it | Dovina | built 2026-11-02 | no input (passive) |
| G310 | TRACK-EDITOR | Fords and bridges on a made track (the lot's ground is only raised, never cut) | Petra | not started | no input (passive) |
| G311 | TRACK-EDITOR | Tuning `HAUNT.parK` (0.9) per track once the owner has played it | Dovina | waits on South (his play) | no input (passive) |
| G312 | TRACK-EDITOR | Section 9: plates on the beat (a plate crossed on the beat pays more) and paint the line (the Soul Brush paints a feeling on the track, a sibling paints against you); steal a flare is half built (a takedown gives a third of a banked flare) | Dovina + Wanda + Petra | designed, not built | plates: no input (passive); paint: PAINT tile |
| G313 | TRACK-EDITOR | The names of the traps, pieces and editor, and their sounds beyond placeholders | Espada + Wanda | not started | no input (passive) |
| G314 | TRAINING | The Two-Tone knack (both of an agate's colours on a creature's body) and the agate guess at appraisal (`appraise.mood { guessed, actual }`, never emitted) which also seasons Charisma | Espada + Calissa + Petra + Dovina | designed, not built | window: tap (Veritome appraisal choice) |
| G315 | TRAINING | A cast avoided (`foe.dodge`, never emitted) seasoning Perception | Petra + Dovina | not started | no input (passive) |
| G316 | TRAINING | The Veritome's light term (the hour, front-lit) beside the placement term, so light reading trains Divination | Petra + Calissa | not started (no light term in `photo.js`) | lens: A shutter (exists) |
| G317 | VERITOMES | The Veritome as a variant: a book id worn on the belt like the Lockheart's coffins (Plain, Empath's, Augur's, Skeptic's) | Petra | not started | BELT radial / reading table (window: tap) |
| G318 | VERITOMES | The three sights behind the raised lens: Mood (a creature's mental state and EmO glowing), Intent (a Brain's next action, what the Soul Brush wrote), Reveal (decoys, mirages, a Figment in another's shape) | Petra (modules) + Calissa (looks, overlay not a filter) | designed, not built | lens raised (exists); no new input |
| G319 | VERITOMES | The Dreamvane's two sights: Thermal on the dowse (buried cubes and Lachrymite glow as heat) and Reveal on the survey (a false wall's seam) | Petra + Calissa | designed, not built | dowse and survey (existing Dreamvane picks on the far shelf) |
| G320 | VERITOMES | How each book is found: a place's thing or an achievement, never bought, and the books' names and lore | Dovina + Espada | designed, not built (places to pick) | no input (passive) |
| G321 | WEATHER | A rare weather (a dread fog over Margarite, hidden achievement sk4) counting toward Luck and being reachable (no weather zone maps Margarite yet) | Petra + Dovina | partly built (achievement exists; Margarite zone exists, weather island mapping unconfirmed) | no input (passive) |
| G322 | WEATHER | Later: the player's acts sway an island's mood | Dovina | parked ("later, not now") | no input (passive) |
| G323 | WHEEL | Rings as adjectives on the strengths we have (mild, basic, intense) in each channel: sky, body, sound, voices at half to one and a half | Dovina + Calissa + Wanda | not started | no input (passive) |
| G324 | WHEEL | Opposites cancel in the press (an opposite aspect's material pulls the soul colour back) and in angling (an opposite lure repels a fish); the music's opposites are built | Dovina + Petra | not started | window: tap (press); LURE ring (exists) |
| G325 | WHEEL | A creature's mood module: an intensity per feeling with its own decay, `shown() -> { a, b?, k }`, the Stoic-to-Prismatic axis kept as its projection | Petra | not started | no input (passive) |
| G326 | WHEEL | The agate on a body: the clip shows the strongest feeling, the flame's height its strength, the flame's colour the second | Calissa | not started | no input (passive) |
| G327 | WHEEL | A creature clip suite beyond the Wisp: floats blended by velocity, the mood loop from `shown().a`, an emote at an onset, the grain's dials on playback, the rig specced in `rom.js` | Calissa + Petra | partly built (the Wisp has its own pose-to-clip map) | no input (passive) |

## 4. Where the reading is thin (check before building)

- **ABERRANTS:** the Strawman secret and a few items rest on a grep that found nothing.
- **CASTER-SHELLS:** the "ludicrous ten" feel pass is only partly checked. Meteor's mega is built.
- **AREAS:** for A6 (creatures not following across an edge), no code was found.
- **CASINO-CLARITY:** the hall's neon flourish on a tier 3 hand.
- **OVERLAY:** it is a style bible, so only concrete gaps are listed. The rows on tags for things that aren't creatures and on the System
  windows are the shakiest.
- **MOBILE:** taken mainly from TOUCH-REBUILD and the bindings. Not every tile was walked.
- **SUBSTRATE:** the statuses of F2, F4, F7 and F8 are best guesses.
- **SWEEPS:** a dated October list, spot-checked only.
- **STRAWMANS-WELL:** pogo, pulley, on/off blocks, grab and throw, the floating crate and the ghost guide are unbuilt by grep. The stages
  were not played.
- **GODHAND:** the combinations row (no conduction rule was found by that name), the slap, and the hand's shadow.
- **FIGMENT-TELEGRAPHS:** clapperjars and lobbers have no `windup(` call.
- **Some FIGHTER, GODHAND and HANKO "NEEDS:" cells** are a reader's suggestion, not MOBILE.md's.
- **Plans with no rows** (everything built, or the header is stale): BUGREPORT, CRUCIBELLE-UI, DEBUG-CHESTS, DUNEMAW-ARENA,
  MELEE-LOADOUT-EARNING, PNEUKA-BOX, QAIS, RAIL, RAIL-OVERHAUL, SEEDS-SLABS-SCANS, SPINE and STRAWMAN. The same holds for the looks and
  sounds of MIMICRY, QUESTS and SANDBOX. Their headers can say so.


## Before: the open design gaps, closed with the systems we have (Dovina, 2026-10-29)

**Asked:** South, 2026-10-29: "what we can do to address all of our open design gaps. We should have more than enough fundamental
systems to work with."

**The thesis.** South is right. Every gap below closes by connecting systems that already run; none needs a new system. The sweep
read every plan (`docs/plans/`), DESIGN.md, the glossary and the handoffs, and checked the plans against `src/`. Several plan headers
were stale:
- built already: the bracelet, the cloud save, the class read, the track editor, the garden's letters and farewell, the reckoning;
- fixed by Calissa: angling's release.

Status: **(a)** waits on South, **(b)** decided, not built, **(c)** not designed.

### 1. Closed this round

| gap | what closed it | where |
| --- | --- | --- |
| Fishing paid no Possession for a kept fish | every landing pays; a release half again | `domains.js`, ANGLING.md 5 |
| Whole modes paid no domain (a fight on foot, the Raceway, the sea, the garden, paint) | 30 sources on existing events | DOMAIN-SOURCES.md |
| The Assay had no code (APTITUDE.md 9, step 1) | six passive readings from events already on the bus: parry timing (ms), pitch by ear (the beating), timing (ms of spread round the notes, Wanda's `asyncSd`), colour (% of a tile), aim (%), reading a pull (%); `/assay` says them | `progress/aptitude.js` |
| A secret's material drop "parked" against "drops are on" | recorded as built (drops.js rolls the richer table) | DUEL-DESIGN-SPACE.md |
| Two trap placeholders mirrored | fixed, with a casebook rule | `world/raceway/traps.js` |

### 2. The folds (ranked by how much of the long loop rests on them)

1. **What a class gives: 76 arts. Ruled and its rules built** (South, 2026-10-29: "We need new arts for the classes").
   - 76 new arts, an action and a reaction a class, opened by playing as it, kept in every class, accented in its own:
     `progress/classarts.js`, CLASS-ARTS.md. Built in play a wave at a time (the Fool and the four Knights first), Petra's runtime.
2. **The 21 pair specials (b).**
   - The fold: **a pair's special is its sub's lent verb fed through its main's own verb**, so one press does both. For example, the
     psygun and the Veritome: the Flash marks, and every chamber homes on the mark.
   - Each special is a combination of two verbs the code already has. Petra builds one wave of four at a time; the first four are
     named (TOOLS-TOGETHER.md 8).
   - Opening: an achievement counted with the pair worn. The ledger needs `pair.<n>.<act>` (a down, a lend landed). Dovina writes
     those keys in tracking next round.
3. **The Assay's next steps (b).**
   - The readings are built, and the bot check (`scripts/assaybot.mjs`: all PASS) and the Touchstone's trials as data
     (`progress/assaytrials.js`). Still to do:
     - the window, Calissa's (the data is `game.aptitude.all()`);
     - the Touchstone room, Petra's (its trials are data now).
   - Three more readings wait only on a field in an event:
     - inhibition: the rail's plain or outlined shot, on `rail.hit`;
     - risk: the Lockheart's wheel, cashed or pushed;
     - reading others: Nebula Bluff's tells called;
4. **Why come back once a place is done. Ruled** (South, 2026-10-29: "go with your intuition on the open sea").
   - The respawning hunt, already built: the lairs restock each game day and the dock posts one with a bounty. Measured at 0.40x,
     0.72x and 1.30x the aim by skill (OPEN-SEA.md 9.1). No bounty board.
   - The areas already have their checklists on the map. Their half and whole achievements are Dovina's, next.
5. **Pace, measured. Built** (2026-10-29).
   - The ledger keeps the play time each achievement was earned at (`L.done`), and a thing's first time is an Easy "do it once" (the
     `first()` stamp is used by only eight keys). So `progress/pace.js` names 15 milestones by their achievements, each with the
     design's target in real minutes (FIRST-HOUR.md's steps first). `node scripts/pace.mjs <ledger.json>` reads a playtest's or a QAIS
     session's ledger; the field report can carry `paceOf(L)` from a phone (Petra's).
6. **The weather's readers. Ruled back** (South, 2026-10-29: "bring back the weather effects").
   - The rules are in `progress/weather.js` (`moodRest`, `biteMult`, `senseMult`; WEATHER.md). Each is a one-line read in its
     owner's module: creatures' settle, a fish's interest in a lure, a signature's range (asked of Petra).
7. **Numbers with no reason yet (c).**
   - These are: the prismatic 12% at epic pity, the near-miss rates, the chest ranges, the coffin fills, the standing thresholds.
   - The fold: `scripts/economy.mjs` already prices a source against the aim. Each number gets its line there and a reason in
     ECONOMY.md (Dovina, next).
8. **The garden's last items (b).**
   - Incense and the Booster Stone do nothing yet.
   - The fold: Incense becomes a modifier on the spirits' visit rate (`spiritlife.js`). The Booster Stone becomes a modifier on a
     planetoid's harmony rest point (`harmony.js`).
   - Spirit notices are a log rule on the routine's events.
   - The shareable layout code reuses the track editor's share code (`FF2-...`).
   - All Dovina's, next.

### 3. Waiting on South (batched; the digest has them)

- The STORY save: tabled for a long while (South, 2026-10-29), while each system is worked to its ceiling in DEBUG.
- Querent's and Entropy Tactics' open questions (CASINO.md 3.8, ENTROPY-TACTICS.md 5).
- Parked by South until the bestiary's overhaul: the Veritome variants, and minds reading grain.

### 4. Not Dovina's (handed over)

| who | what |
| --- | --- |
| Petra | the class arts in play, a wave at a time, and the input action `art`; the weather's three reads; the pair specials, a wave of four at a time; the Touchstone room |
| Calissa | the Assay window from `game.aptitude.all()` (??? to five readings, the number to twenty, then the curve) |
| Espada | the Assay's words (`/assay`'s lines are placeholders) |

### 5. The round robin (2026-10-29): every division's open threads

**Built by Dovina this round**, from the threads that were hers:
- the game day's race and the skiff sets' achievements (SKIFF-RACING.md 9, SKIFF-TUNING.md);
- the class arts' words pasted (Espada's 76 labels and lines, the log's lines, `FEAT_WORDS`) and CLASS-ARTS.md regenerated;
- each pair special's two verbs named (`PAIR_SPECIALS[n].main`, `specialVerbs`; Petra's ask);
- the Touchstone's standard trials as data and the Assay's bot check (APTITUDE.md 9);
- pace, read from the ledger (item 5 above);
- Espada's older word notes checked: the duel words were already in; the spreads' wild-card tip pasted; the rest routed to their owners.

**Open, by owner** (as each reported it):

| who | open |
| --- | --- |
| Petra | class arts wave 1 in play and the input action `art`; the pair specials, four at a time; the Touchstone room; the field report carrying `paceOf`; areas stage 2 (build and teardown); `npm run perf` on the numeral decals; 43 casebook rules to number; a Seal Book shelf in the Codex (Espada's and Calissa's ask); the LOAD confirm and the OTHER SAVE row's words (Espada's, `docs/handoffs/petra/`); the shoal silhouette's events for Wanda |
| Calissa | (fixed on her branch, 6124d27f, off this list once merged: the CMU spinning kicks' knees, every kick's now 9 degrees or more forward; the drawn slide's blade, its lowest point now +6.8 cm); the far shelf's words shrinking to glyphs; `CRADLE_NUMBERS` and the numerals on the dice and six other surfaces; the Assay's window; each class art's look; the Lachrimeter's tube mirrored bottom-left (Petra's ask); the ALT tile's word and the domain tile's long press (Espada's, `docs/handoffs/calissa/`); `hudring.js`'s stale header |
| Wanda | the open sea's moments (building now), the safari Egregores' calls, a front's squall, the god hand's matter sounds, each class art's sound, the turn change's sound |
| Espada | lore names once South calls each system finished; the touch help page; the spirits' farewell lines (waiting on Dovina: below); the antibody Figment's name (Calissa's ask) |

**Dovina's, closed 2026-10-30:** the farewell lines (Espada's, in `FAREWELL_LINES`); numbers with no reason (item 7: each now has its
line in `scripts/economy.mjs` and its reason in ECONOMY.md); the ridges' fulgurite as the second condition-bound find (`RARE_FINDS`); the
three aptitude readings (holding back, pushing your luck, reading others: `progress/aptitude.js`, its tallies; `scripts/assaybot.mjs` PASS).
