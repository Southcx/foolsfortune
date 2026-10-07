# The systems plan

Kept by Dovina. The backlog the owner and Dovina settled on 2026-10-04, in dependency order; Petra plans each round from it and is the
gate. The reasons are in `docs/DESIGN.md` (sections 8 to 11) and `docs/ECONOMY.md` ("The livelihoods"); the words in `docs/GLOSSARY.md`.

**The rules every item keeps:** the core movement is the gold standard; the log is the only text feedback (events, and rules in
`tracking.js`); achievements are predicates over the ledger; the skill is the verb (no number does a skill for the player); one Courier,
one purse, one ledger, the same seven tools in every layer; every item handed over draws from a deck (a 1-in-N item is certain within N
tries); prior art is named in each module's header; every livelihood gets a simulator row (`node scripts/economy.mjs`) before it is
built, and pays by quality, not time. STORY stays off the title menu until the owner says otherwise.

## Phase A: the numbers made true

Built, all twelve: unique achievement ids and the check's rule (`achievements.js`, `scripts/check.mjs`); the deck
(`src/progress/econ/deck.js`); the curio decks (`ECON.curioDeck`, `world/treasure/ceremony.js`); consolidated odds (`econ/odds.js`,
the Codex's CURIOS shelf); one Tithe key; the Lockheart's jackpot cap (`ECON.lockheart.jackpotCap`, 25%); the starting kit
(`pneuka/box.js` `seed`); titles and glazes for mastery; Saggar's glazes (`SHOPS.saggar`); STORY off the title menu.

## Phase B: the foundations of a fight

Built: five damage types and the closed trump cycle Impact > Illusion > Ego > Influence > Delirium > Impact, with annihilation
(`progress/combat/types.js`, `creatures.strike(..., type)`); the mental state (`combat/mind.js`); statuses built by type
(`creatures.js`); Emotional Output (`combat/emo.js`: yield band 0.35 to 0.75, enrage at 0.85); Luck (`progress/luck.js`); achievements
unlock arts (`system.js`, `skills.js`); the seven domains to 99 (`progress/domains.js`).

**Ruled by the owner (2026-10-04):** the trump cycle and the tools' types are approved. The domains' pace stands in principle (about
2,100 hours of middling play to "The World"), but skill must count for much more than repetition: `SKILL` gives a rote act 0.4 of the
base and a masterful one 5, so "The World" is about 5,100 hours rote, 2,100 middling, 875 good, 410 masterful. Glaze prices follow
desirability (ECONOMY.md, "The worth of a look").

Still open in B: **B5**, how each type, state and status looks and sounds (Calissa, Wanda): one colour and motif, one sound language
per type, so a player can tell the type of a blow with the HUD hidden. **B9**, the words for statuses, mental states and domains
(Espada).

## Phase C: the Lockheart as the magic system

Built: C1, the coffin worn sets the mode (`HEARTS[id].mode`, `MODES` in `tools/lockheart/table.js`); C2, catching: the catch wheel on a
critically stunned Figment at `catchOdds` (by class, the stun's hold, the EmO band, the keys; capped at 95%; a deck), the caught kept
in the Pneuka Jar (`creatures/bound.js`; also by the god hand, `godhand/catch.js`). To build:

| # | Item | Owner | Files | Done when |
|---|---|---|---|---|
| C3 | **Summoning**: a caught Figment comes out as an ally (as `spirits.js` does), and a key burned on its release adds an effect. With several inside, which one comes out is a gamble, with a favourite slot so a rare catch is not lost to chance | Dovina (rules); Petra (`spirits.js` generalised to any caught Figment) | `src/creatures/spirits.js`, `src/tools/lockheart/` | a caught jelly fights beside the Courier and goes back in |
| C4 | **Conversion**: baubles into cubes; the keys set the yield and the risk. A faucet: its expected return per key stays under the key's price unless played well. Data in (`CONVERT`: a full coffin 12 cubes, a brimming one 24), unwired | Dovina | `econ/table.js`, `scripts/economy.mjs`, `tools/lockheart/outcomes.js` | the simulator's row is under 1.5x the aim |
| C5 | The look and sound of the three modes, the catch wheel, a Figment inside the coffin | Calissa, Wanda | `src/vfx/`, `src/audio/` | |

**Open for the owner (C4):** conversion pays only with a brass key and a brimming coffin (LOADED and ECHO cost 93 and 139 cubes for
about 31 back: the keys are priced for casting), so either conversion keys are cheaper or a conversion does not use up its key. And EVEN
is the big-game catch key (a Leviathan 5% to 28%), LOADED the small-game one.

## Phase D: the livelihoods

Built: D1 materials (`econ/materials.js`); D2 the spirit press, Soul Alchemy (`progress/alchemy.js`); D5 busking and the rhythm mode
(`world/busk.js`, `music/rhythm/`, `rhythm.score`); D7 ranching and the mastery dividend (`progress/garden.js`, `ECON.dividend`). To build (pay data for D4 to D6 is in `econ/livelihoods.js`):

| # | Livelihood | Owner | Notes |
|---|---|---|---|
| D3 | **Caster shell crafting** from materials | Dovina (recipes); Petra (the bench) | shells are spells: no spell scrolls |
| D4 | **Commissions** by Figment class (Guppy to Leviathan), with streaks (OSRS Slayer) | Dovina (rules); Espada (who gives them, the words); Petra (the board) | |
| D6 | **Throwing pots**: a shape pulled on the wheel (the Soul Brush's skill), glazed at the kiln, sold to the folk | Dovina (rules, prices); Petra (the wheel); Calissa (the pots) | |
| D8 | **Foraging and the garden**: fodder materials on timers (OSRS herb runs) | Dovina; Petra | |

## Phase E: the layers

Built: E1 a Well (the Great Dunemaw, `world/well/`); E3 the Spirit Garden (`world/garden/`, `progress/garden.js`); E4 the Emocean
(`docs/plans/SLICE.md`, `docs/plans/RAIL.md`); E5's crude trade by island demand on a slow clock, with gluts (`econ/islands.js`,
`progress/voyage.js`). The Cogitomap is an item with a worth (`cogitomapWorth`). To build:

| # | Item | Owner | Notes |
|---|---|---|---|
| E1+ | The Well's later layer: shortcuts opened on later runs; FOEs as Etrian Odyssey's (visible, patrolling, routed round) | Petra; Dovina | after the deep dive with the owner (SLICE.md) |
| E2 | **Cogitomaps as tickets**: a charted map is a ticket to a seeded run of its Well; Spellscription copies a good one; traded and hauled | Dovina (item, value); Petra (the run from a seed) | |
| E5 | **Island demand beyond crude**: each island wants different kinds of material, classes of Figment, particular Wells | Dovina (the model, simulated first) | |
| E6 | Contractors, Gambits, the grid and the Metronome | held | a Well's tactical layer, later |
