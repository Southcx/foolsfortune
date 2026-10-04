# The systems plan

Everything the owner and Dovina settled on 2026-10-04, turned into work: what is built, in what order, by whom, through which files and
interfaces, and how each piece is measured. Kept by Dovina (Game Design Systems). The reasons are in `docs/DESIGN.md` (sections 8 to 11)
and `docs/ECONOMY.md` ("The livelihoods"); the words in `docs/GLOSSARY.md`.

**How this plan relates to the rounds.** Petra plans each round and is the gate for every push to main (CLAUDE.md). This page is the
backlog the rounds draw from, in dependency order. A phase starts when the one before it has landed, except where an item says it can
run alongside. Each division's items are also written in its section of `docs/HANDOFFS.md`.

**The rules every item keeps** (from CLAUDE.md, DESIGN.md and ECONOMY.md):
- The core movement is the gold standard: nothing here changes it.
- The log is the only text feedback: a new system emits events, and `tracking.js` has the rules.
- Achievements are predicates over the ledger.
- The skill is the verb: no number may do a skill for the player.
- One Courier, one purse, one ledger, the same seven tools in every layer.
- Every item that hands over an item draws from a deck: a 1-in-N item is certain within N tries.
- Prior art is named in each new module's header.

STORY stays off the title menu until the owner says otherwise. Nothing in phases A to C needs it.

---

## Phase A: the numbers made true (now; mostly Dovina's)

The four DESIGN.md proposals the owner approved (1, 2, 3, 5), and the deck. Small changes, each measured by `node scripts/economy.mjs`.

| # | Item | Owner | Files | Done when |
|---|---|---|---|---|
| A1 | The six duplicate achievement ids renamed (the movement ones, so the glazes' references stay right), and a guard that reports a duplicate | Dovina | `src/progress/achievements.js` | `buildAchievements` has 366 unique ids; reaching 16 m/s no longer grants tenmoku |
| A2 | A rule in `npm run check`: achievement ids are unique | Petra | `scripts/check.mjs` | the check fails on a duplicate id |
| A3 | **The deck** as one small module: a 1-in-N chance whose state is one ledger counter (draws since the last hit); `chance(n, drawn) = 1 / (n − drawn)` | Dovina | `src/progress/econ/deck.js` (new) | the simulator shows "certain by N, mean (N+1)/2" for every deck in the table |
| A4 | The curio curve turned the right way up: each chest tier's curio is a deck (`ECON.curioDeck`), and *which* curio is a deck of the four (each before any repeat). This replaces `curioP` and the 85% bias | Dovina (numbers, deck); Petra (wiring in `ceremony.js` and `treasure.js`) | `src/progress/econ/table.js`; `src/world/treasure/ceremony.js`, `treasure.js` | the simulator's curio curve: sets complete in rising order of rarity (targets: about 20 / 40 / 80 / 150 / 300 Tithe pulls) |
| A5 | Consolidated odds: the rates a player meets, pity counted, computed once from `rollTier` | Dovina (`consolidated()`); Petra (the Codex's CURIOS shelf shows them, and names the 12% prismatic at epic pity) | `src/progress/econ/odds.js` (new); `src/feedback/codex/ledger.js` | the shelf shows about 56.5 / 24.5 / 13.8 / 3.8 / 1.3% |
| A6 | One ledger key for a Tithe pull (`tithe.count`, not `tithe.pulls` as well); the stale headers (the Tithe "costs 25", "up to three keys") | Petra (`chests.js`); Dovina (`lockheart/table.js`) | as named | one key; the headers true |
| A7 | **The Lockheart's jackpot ceiling**: after the keys have done their work, no rank-4 outcome may be likelier than `ECON.lockheart.jackpotCap` (25%) | Dovina | `src/tools/lockheart/table.js`, `src/progress/econ/table.js` | the simulator's Lockheart section: Gambler + INVERTED gives a nuke 25% of the time, not 99% |
| A8 | The Gambler's and the Shepherd's coffins and the INVERTED key leave the starting kit (bought from Raku, or found) | Petra | `src/pneuka/box.js` (`seed`) | a new Courier holds the plain coffin and two brass keys |
| A9 | The simulator learns: mixed profiles (angler plus treasury, miner plus fighter), the Lockheart's value per opening, the curio curve under the deck, achievement points by tier | Dovina | `scripts/economy.mjs` | each prints, with the numbers DESIGN.md section 7 quoted |
| A10 | Mastery worth something: gold on every circuit and the trial, a full Siege, a Course record each give a title (achievements) and a glaze (Petra maps the glazes) | Dovina (achievements, titles); Petra (`glazes.js` `got.ach`) | `src/progress/achievements.js`; `src/courier/vessel/glazes.js` | each medal achievement names a title; the glaze list maps to them |
| A11 | Saggar sells glazes at the kiln, about 15 minutes' play each (the cube sink beside the earned ones; what is bought is never what is earned) | Dovina (prices, `SHOPS.saggar`); Petra (the counter at the kiln, `vessel.bought`) | `src/progress/shop/catalogue.js`, `src/progress/econ/table.js`; `src/courier/vessel/vessel.js`, `src/npc/` | a glaze can be bought, fired, and the F3 econ line shows `cube.use.shop.saggar` |
| A12 | STORY off the title menu | Petra | `src/title/ui.js`, `src/main.js` | only DEBUG, SETTINGS and SOUND TEST |

---

## Phase B: the foundations of a fight (next; Dovina's data, Petra's wiring, Calissa's and Wanda's language)

What every later system reads: damage types, the mental state, Emotional Output, the statuses they build, Luck, and progression that
comes from achievements and from playing well. **Nothing here may change the core movement or a tool's feel**: these are numbers on the
target, and what the target shows.

| # | Item | Owner | Files and interface | Done when |
|---|---|---|---|---|
| B1 | **Five damage types** on the Law–Chaos line: Impact, Ego, Influence, Illusion, Delirium. Each tool's blow carries one (proposed: Psygun and Sondelass, Impact; Veritome, Ego; Crucibelle, Influence; Soul Brush and Dreamvane, Illusion; Lockheart, Delirium). `creatures.strike(c, point, dir, power, cause, by, from)` gains a `type` (default Impact), and `cause → type` is one table | Dovina (the table, the closed trump cycle, the numbers); Petra (`strike` passes it, each tool sets it) | `src/progress/combat/types.js` (new, data); `src/creatures/creatures.js` | the trump graph is a closed cycle (no type unbeaten, none beaten twice); every `strike` call names a type or takes the default; stress test no worse |
| B2 | **The mental state**: Stoic, Resolved, Balanced, Fluid, Prismatic, a number per creature (−2 to +2) that sets how readily it takes statuses (and buffs). Steady hits push it toward Prismatic; resisting pushes toward Stoic | Dovina (the rules, the numbers); Petra (on the creature, read by `apply`) | `src/progress/combat/mind.js` (new); `src/creatures/creatures.js` | `creatures.apply` scales by state; the bestiary can name a creature's state |
| B3 | **Statuses built by type**: enough of one type applies its status (Impact: stun through `stun.js`; Ego: doubt; Influence: charm or taunt; Illusion: blind; Delirium: confusion), and **annihilation** (Impact on a Delirium-afflicted target, or Delirium on an Impact-afflicted one, hits much harder) | Dovina (the table); Petra (the new statuses in `STATUSES`; each creature's mind decides what each means, as today) | `src/progress/combat/types.js`; `src/creatures/creatures.js`, the minds | each type applies its status in the stress test's runs; annihilation is counted in the ledger |
| B4 | **Emotional Output (EmO)**: a creature's agitation (0 to 1), rising as it is fought and falling as it is soothed. Its Lachryma yield peaks in an optimal band and it enrages past it. The bridge to catching and conversion | Dovina (curve, bands, yields); Petra (on the creature; the AI's drives read it: `docs/AI.md`) | `src/progress/combat/emo.js` (new); `src/creatures/ai/` | the jelly's yield follows the curve; the enrage shows in its body (Calissa), never in text |
| B5 | How each type, state and status **looks and sounds**: one colour and motif per type (from the Law–Chaos palette: geometric and crystalline to fluid and iridescent), one sound language per type | Calissa (look); Wanda (sound) | `src/vfx/`; `src/audio/` | a player can tell the type of a blow with the HUD hidden |
| B6 | **Luck** rises from statistically unlikely events, good or bad: a ledger predicate (prismatics, near misses, jackpots, a deck drawn on its last card), so it is retroactive. It sways chance (crits, deck sizes on the margin), never a skill | Dovina | `src/progress/luck.js` (new), `src/progress/stats.js` | Luck reads the same after a reload; the simulator shows its range |
| B7 | **Achievements unlock skills** (the owner's rule): the System's arts and variants become rewards of achievements, one unlock system, not two. The `chain` and `feat` goals become ledger keys first (written by `tracking.js`) so they can be predicates | Dovina (`system.js`, `skills.js`, `achievements.js`); Petra (the ledger keys in `tracking.js`) | the art's goals move into achievements with `unlocks: 'blink'` | every art unlocks exactly as before, the stress test no worse, and an art's unlock is retroactive |
| B8 | **The six (+1) domains and skill levels to 99**: Ouranurgy, Manifestation, Divination, Psychokinesis, Possession, Alteration, Spellscription. EXP comes from doing a skill *well* (a clean strike, a true pitch, a typed macro: quality weights the EXP). OSRS's curve; "The World" at all seven maxed. Levels widen what a domain can do and never do the skill | Dovina | `src/progress/domains.js` (new), the ledger | each domain's EXP comes from named events with a quality; the levels show in the Codex (Petra) |
| B9 | Words: the statuses' names and lines, the mental states, the domains' blurbs | Espada | `src/feedback/tracking.js` (strings), `docs/LORE.md` | every new event has a line in the log |

---

## Phase C: the Lockheart as the magic system (after B4)

| # | Item | Owner | Files | Done when |
|---|---|---|---|---|
| C1 | **The coffin worn sets the mode**: casting (today's wheel), summoning, conversion. `HEARTS[id].mode` | Dovina | `src/tools/lockheart/table.js` | each coffin names its mode |
| C2 | **Catching**: a third choice on a critically stunned Figment, beside zandatsu and reprogramming. **The wheel is the catch**: its odds are set by how cleanly the creature was stunned and where its EmO sits, and the Possibilikeys augment them. Ledger: `lockheart.catch.*` | Dovina (odds, table); Petra (the act on the stunned body: `tools/lockheart/lockheart.js`, `stun.vulnerable`) | `src/tools/lockheart/` | a jelly can be caught; the odds shown on the wheel are the odds |
| C3 | **Summoning**: a caught Figment comes out as an ally (as `spirits.js` does), and a key burned on its release adds an effect. With several inside, which one comes out is a gamble (with a favourite slot, so a rare catch is not lost to chance) | Dovina (the rules); Petra (`spirits.js` generalised to any caught Figment) | `src/creatures/spirits.js`, `src/tools/lockheart/` | a caught jelly fights beside the Courier and goes back in |
| C4 | **Conversion**: baubles into cubes; the keys set the yield and the risk. A faucet, so it is simulated before it is built, and its expected return per key stays under the key's price unless played well | Dovina | `src/progress/econ/table.js`, `scripts/economy.mjs`, `src/tools/lockheart/outcomes.js` | the simulator's row is under 1.5× the aim |
| C5 | The look and sound of the three modes, the catch wheel, a Figment inside the coffin | Calissa, Wanda | `src/vfx/`, `src/audio/` | |

---

## Phase D: the livelihoods (after C; each can be built on its own)

Each is a row in `docs/ECONOMY.md` and gets a simulator row before it is built. Each pays by quality, not time.

| # | Livelihood | Owner | Notes |
|---|---|---|---|
| D1 | **Materials**: broad kinds (from the v0.1 document's categories), each material with a hue, a saturation and a **path** (a short polyline on the colour map, Potion Craft) | Dovina (data, `src/progress/materials.js`); Calissa (icons by kind) | combat drops them; the deck rule applies |
| D2 | **The spirit press (Soul Alchemy)**: hopper, igniter, crucible (the owner's concept art). Pressing materials moves the Courier's colour along their paths; reaching a target colour changes a characteristic. Attributes widen and never do a skill (no "Perception: ranged accuracy") | Dovina (rules); Calissa (the press); Petra (the station, in the Shrine Garden) | a station like the kiln (`moves/kiln.js` is the pattern) |
| D3 | **Caster shell crafting** from materials | Dovina (recipes); Petra (the bench) | shells are spells: no spell scrolls |
| D4 | **Commissions** by Figment class (Guppy to Leviathan), with streaks (OSRS Slayer) | Dovina (rules); Espada (who gives them, and the words); Petra (the board) | |
| D5 | **Busking and the rhythm mode**: the Crucibelle's ten colour-coded notes (1–5 low, 6–0 high; no chords). In the field it is improvisation (the pentatonic, nothing wrong); at a stage it is a charted, scored mode, with **the charts drawn from the music's own note grid**, not authored by hand. Tips by score | Wanda (the charts from `src/music/`, the stage); Dovina (the scoring and the pay) | begun from a stage in its own room (CLAUDE.md) |
| D6 | **Throwing pots**: a shape pulled on the wheel (the Soul Brush's skill), glazed at the kiln (colour), sold to the folk | Dovina (rules, prices); Petra (the wheel); Calissa (the pots) | |
| D7 | **Ranching** caught Figments in the Shrine Garden, and the **mastery dividend** (3 slots, 5%, fills in 8 h: `ECON.dividend`) | Dovina | after E3 |
| D8 | **Foraging and the garden**: fodder materials on timers (OSRS herb runs) | Dovina; Petra | after E3 |

---

## Phase E: the layers (the vertical slice of all three)

The slice proves the seams: **one Well dive, one island fight and one Emocean hop that pay into the same purse and the same skill
EXP**. If that loop feels good small, the rest stacks.

| # | Item | Owner | Notes |
|---|---|---|---|
| E1 | **A Well**: a spontaneous dungeon on Anagami Island, a Lachryma distortion that changes over time. Seeded rooms, shortcuts opened on later runs, FOEs (Etrian Odyssey), mapped by the Dreamvane and the Veritome | Petra (the dungeon); Dovina (rewards, the seed); Espada (what a Well is) | a zone in `render/zones.js`, as every room |
| E2 | **Cogitomaps**: a map of a Well as charted is a ticket to a seeded run of it; Spellscription copies a good one; sold, traded and hauled | Dovina (item, value); Petra (the run from a seed) | after E1 |
| E3 | **The Shrine Garden**: the long sink, a pocket inside the vessel; the press, the slots, the garden | Petra (the place); Dovina (what it costs and pays) | |
| E4 | **The Emocean**: travel between Islands of Ego as a node map (FTL) with rail-shooter stages (KH2's gummy ship, but with no parts or progression of its own: the same tools, the same purse) | Petra; Dovina (fuel as a drain, rewards) | a second island is needed for E5 |
| E5 | **Island demand and hauling**: each island wants different kinds of material, classes of Figment, particular Wells. Demand moves on a slow clock (days) and a glut lowers it (as Grog's prices do). Cargo can be lost on the Emocean leg | Dovina (the model, simulated first) | |
| E6 | Contractors, Gambits, the grid and the Metronome | held | a Well's tactical layer, later |

---

## Messages sent with this plan (2026-10-04)

Each division has its items in its section of `docs/HANDOFFS.md`: Petra (A2, A4, A5, A6, A8, A10, A11, A12, and B's wiring), Calissa
(B5, C5, D1, D2, D6), Wanda (B5, C5, D5), Espada (B9, D4, E1's words). Dovina's half of phase A landed the same night on `claude/dovina-design`: A1, A3, A4 (the numbers), A5 (`consolidated()`), A6 (the
Lockheart header), A7, A9, A10 (the titles) and A11 (the prices and `SHOPS.saggar`). Petra's wiring is what remains of phase A.

**Phase B, Dovina's data (same night):** `src/progress/combat/types.js` (the five types, the closed trump cycle Impact > Illusion > Ego >
Influence > Delirium > Impact, annihilation, the cause → type table as a proposal), `mind.js` (the mental states), `emo.js` (EmO: yield
band 0.35 to 0.75, enrage at 0.85, the catch factor), `src/progress/luck.js`. None is wired: `node scripts/combat.mjs` prints them all.
The owner rules on the cycle and on which tool deals which type before Petra wires B1 to B4.
`src/progress/domains.js` (B8's data): the seven domains, their EXP sources from today's events with a quality each (a crystal strike's
nearness, a macro's misses, a photograph's stars, a throw's speed), v0.1's curve, and one PACE (99 in 300 hours of middling play in any
domain; perfect play 200, sloppy 600). "The World" at that pace is about 2,100 hours: the owner sets the pace.

**Phase C, Dovina's data (same night, unwired):** in `src/tools/lockheart/table.js`, `MODES` and `mode: 'casting'` on the three coffins
(no new coffins until their mechanics exist: every HEARTS entry becomes an item); `CATCH` and `catchOdds()` (by Figment class, the
stun's hold, the EmO band, the keys; capped at 95%; drawn from a deck); `CONVERT` (a full coffin is 12 cubes, a brimming one 24). The
simulator prints both. **Two rulings for the owner:** conversion pays only with a brass key and a brimming coffin (LOADED and ECHO cost
93 and 139 cubes for about 31 back: the keys are priced for casting), so either conversion keys are cheaper or a conversion does not use
up its key. And EVEN is the big-game catch key (a Leviathan 5% → 28%), LOADED the small-game one.

**Ruled by the owner (2026-10-04, later):**
- The trump cycle and the tools' types are approved, so B1 to B4 can be wired.
- The domains' pace stands in principle (about 2,100 hours of grind to "The World"), but skill must count for much more than repetition.
  `SKILL` in `domains.js` gives a rote act 0.4 of the base and a masterful one 5. "The World" is about 5,100 hours rote, 2,100 middling,
  875 good and 410 masterful.
- Glaze prices follow desirability: the principles and a first placement are in ECONOMY.md, "The worth of a look". Calissa is expanding
  the kiln, and Espada and Calissa weigh in on what is most valuable.
