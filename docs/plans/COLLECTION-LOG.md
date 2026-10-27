# The collection log

Dovina's plan, 2026-10-27, from South's round ("Poke around the modules ... do some genre research on the types of games we've used as
prior art and determine what else we can fold in"). Plain names throughout; Espada names it once South calls it final.

## 1. What it is

One page of everything there is to find, catch, see or learn, every module side by side, each a slot that fills the first time the thing
happens. A slot is read straight from the ledger (a predicate, never a flag), so nothing is turned in and nothing is missable: a slot not
yet had shows its name in the dark, so you know what there is to look for.

**Prior art:** Old School RuneScape's collection log (a slot fills on the first drop, no turn-in, a count a tab, its own title); Yakuza 0's
completion list (a share a module, so every minigame is part of one whole); FFXIV's Orchestrion and Triple Triad lists; the Pokedex's seen
and caught. **Refused:** a 100% treadmill (Breath of the Wild's 900 Korok seeds): the whole counts a section full at its enough line (80%).

## 2. The sections (progress/collectionlog.js `LOG_SECTIONS`, `worldSections`)

Fish (12), cards (36: the 22 Major Arcana and the creature cards), herds at sea (11), vantage points, Shrines, feelings awakened (7),
weathers seen (7 and the 18 agates), god powers (26), epic miracles (7), songs (5), Functions (24), spreads laid (4), crossings (3 set
pieces), ship parts (7), islet secrets (8), strains (5), decor sets (13): 17 sections, 202 slots today. Each section's slots come from its
own table, so a fish added to the angling table is a slot at once. Emotes were left out (134 of them, all open from the start: not a find).

## 3. What it pays

Nothing by itself (DESIGN.md 22: mastery is never paid in power). The achievements over it (progress/logachievements.js, COLLECTION's
"The Collection Log"): First Page (a section filled), Curator (five), Well Rounded (every section begun), Completionist (the whole at its
enough line; a Grandmaster title).

## 4. Where it is

The Codex's COLLECTIONS shelf (feedback/codex/collections.js): the whole's share, the slots found, the sections filled; a card a section,
its N of M as a bar with the enough line marked, its slots as chips lit once had. Calissa's to dress (it wears the STATUS shelf's look).

## 5. Next (ranked, from the research)

- **Bundles** (Stardew's Community Centre, Dark Cloud 2's Georama): sets of choose-4-of-6 slots across modules that restore a visible
  part of the Workshop. Built over this log's slots.
- **The first-today bonus** (FFXIV's Duty Roulette): the first time in a module each game day pays a small flat sum; the Index shows
  which modules are untouched today. No streaks (wall-clock gates are refused).
- **Photo to invention** (Dark Cloud 2): two plates combined at a bench (the press or the kiln) make a recipe (a lure, a decor piece,
  a glaze).
