# Debug chests: what the owner needs to test a thing, left beside it (the owner, 2026-10-08)

Kept by Dovina (what each holds and why); the system is Petra's (`src/debug/`), the look Calissa's, the log's words Espada's.

> "You guys gotta start leaving me like a chest near the facility that you want me to test that gives me the requisite items for
> testing. Make sure they are CLEARLY identified as debug chests."

## 1. The rule (CLAUDE.md, "Scope")

A feature sent for a test session that needs things the owner would otherwise have to grind for ships with a **debug chest** standing
beside it: within a few metres of the thing under test, holding exactly what its QAIS tests need. The division that asks for the test
writes its **kit** (the contents) in the same commit as the QAIS test; the QAIS test names the chest, so its "take me there" goes to it.

Prior art: the dev rooms and debug crates every studio leaves in its test builds (Bethesda's QASmoke and its chests of everything,
Valve's prop_dynamic test crates, Nintendo's debug rooms); the Source engine's missing-texture checker as the universal "this is not
the game" mark.

## 2. Clearly a debug chest

- **The look (Calissa's):** the missing-texture checker, magenta and black, over a plain crate: the one pattern every player reads as
  "not part of the world". Never a glaze, a chest tier or any look the game uses; it is never mistaken for loot. Still a world mark with
  no words on it (CLAUDE.md, "Feedback").
- **The log (Espada's words; placeholder):** F at it says, once, "Debug chest: {kit}. What it gives is not counted." and then what it
  gave, in one line.
- **Its place id** is `debug.<kit>` in `game.places` (`/goto debug.press`), and it is listed under a DEBUG heading in the Index and in
  QAIS's Brief for the round.
- **Its code name** is `debug chest` everywhere (`DebugChest`, `DEBUG_KITS`), never "chest" alone (a chest is the Tithe's and the
  world's, with tiers).

## 3. What it does

- **F tops up**: each item up to the kit's count, never past it, so pressing F again refills what the test spent and spam never floods
  the Pneuka Box. Cubes the same (up to the kit's balance).
- **Nothing it gives is counted.** Items arrive with `from: 'debug'`; cubes are earned with source `'debug'`. The ledger's rules skip
  both (no `item.get` count, no `cube.earn`, no firsts, no achievements from the gift itself). What the owner then does with the things
  counts as play always does (progress resets every build anyway).
- **It goes when its feature is done**: a kit names the QAIS tests it serves (`tests`); once those pass, Petra takes the chest out at the
  next publish. A chest never outlives its feature by more than a round.

## 4. A kit (data: `DEBUG_KITS`, in `src/debug/kits.js`)

```js
DEBUG_KITS.press = {
  at: 'athanor',             // a place id: the chest stands beside it (offset so it never blocks the thing)
  for: 'Soul Alchemy: the press station (SOUL-ALCHEMY.md 4)', by: 'dovina', tests: ['T155', 'T156'],
  items: [['mat.edge', 3, { tier: 1 }], ['mat.art', 3, { tier: 1 }], ...], // id, count, its data (a material: makeMaterial's tier)
  cubes: 2000,
};
```

A kit holds items and cubes only. It never sets state (a rank, an art, seasoning, the ledger): that is the all-arts switch's job, or the
tuning panel's, and a test that needs state says so in its QAIS test.

## 5. The first kits (one per feature now waiting on the owner)

| kit | stands at | holds | for |
|---|---|---|---|
| `press` | the Athanor's bath (the garden) | two of each of the seven kinds of material at tier 1, one of each at tier 3 (bigger pulls), and 2,000 cubes | pressing, the pull, a complement greying, firing and refusing, one firing a press |
| `garden` | the Dantian's shed | three of each kind of material (the beds and features' materials) and 3,000 cubes | features, beds, a bought planetoid |
| `ostraca` | the Dunes' dig (by the ruins) | the Dreamvane (the pick and the fork) | digging an ostracon up, ringing the sealed room open |
| `crucibelle` | Old Grog's pier, by the busker's mat | the Crucibelle | the pendulum by sight with the sound off, busking |
| `dunemaw` | the Great Dunemaw's mouth | a Wake Whistle, 2 Lachrymato Bottles, 500 cubes | a run to the great cavern and the fight |
| `throwing` | the Throwing Room's Index | the psygun | the drills (Steady Hand and Wide Bore open by drill hits) |

Each division adds its own kits as its features go to test; the asking division writes the row.
