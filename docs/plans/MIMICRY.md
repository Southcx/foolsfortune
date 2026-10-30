# The mimicry puzzles (the god hand taught by copying)

South, 2026-10-30: "designing Godhand puzzles and working out creative and abstract ways to teach how to use the skills, like taking an
object, warping it IAW the godhand power suite, then making the player recreate the steps applied like a mimicry game ... Islands of
Insight (failed puzzle MMO) and Puzzle Pirates are good prior art reference."

Rules: `src/progress/mimicry.js`. World: `src/world/mimicry/mimicry.js`. Log and ledger: `src/feedback/tracking/mimicry.js`.
Achievements: `src/progress/mimicryachievements.js`. Check: `node scripts/mimicry.mjs`.

## 1. What it is

A puzzle stone stands in each Dunes area. Press F at it and the god hand opens over a 12 m patch of the island's real matter beside
the stone.

- **MIMIC**: the System works the patch with the god hand's powers, one step every 1.6 real seconds. Then it puts the patch back and
  says "Your turn."
- **MATCH**: only the before and the after are shown. The steps are yours to read.
- **UNDO**: you start from the after and must put the patch back to the before.

The target stands over the patch as a gold wire outline while you work, and the patch is scored as you go. The puzzle ends one of two
ways:
- a copy left alone for 2 real seconds at 85% or better ends it, and the hand is put away for you;
- putting the hand away judges the patch as it stands.

## 2. Prior art: what was taken, and from where

| from | what |
|---|---|
| Islands of Insight (Lunarch, 2024) | puzzles laid in the world, one stone an area, each enclave teaching one mechanic before mixing them; its Matchbox (two things made alike) is MATCH |
| Puzzle Pirates (Three Rings, 2003) | the duty puzzles' fixed toolkit (`MIMIC_TOOL`: every player copies with the level-1 numbers, so the puzzle is the same at any level) and the graded result (stars, as its Incredible-to-Poor) |
| Simon (1978) | the sequence shown, then repeated: MIMIC |
| golf | par: three stars ask for the steps in no more strokes than the System's |
| Picross, Sokoban's undo | UNDO: the before asked of the after |
| From Dust (2011) | the matter itself (godhand/matter.js), the same physics for the System's demonstration and your copy |

## 3. What it teaches without saying so (DESIGN.md 22)

- **Matter is moved, never made.** Three stars want nothing made from nowhere beyond what the System's own steps needed. A copy that
  conjured its clay loses its third star, and the log says why.
- **Order matters.** In "Order of Things", carving then pouring leaves the water in the channel; pouring then carving does not.
- **Reading a result back to its cause.** MATCH and UNDO pay Divination, for perceiving the hidden steps.

## 4. The score (`matchOf`, `gradeOf`)

- Both grounds, the target and yours, are softened over about a metre (two box passes, 3 cells). This means a stroke half a metre off
  still lies over its target.
- The score is the Dice coefficient of the two changes, start to target and start to now: 1 - |now - target| / (|target - start| +
  |now - start|).
- It is times how much of the asked change was made, up to 80% of it. Half the steps of two do not solve it.
- Solved at 0.68. Two stars at 0.85. Three stars at 0.85, with the strokes at par and nothing made from nowhere.

Measured by `scripts/mimicry.mjs` on every puzzle and on two game days' puzzles:
- the System's steps score 1.00 (three stars);
- doing nothing scores 0;
- a hand's copy, 0.5 m off and 15% short, scores 0.70 to 0.92;
- half the steps of a two-step puzzle score under 0.68.

## 5. The ladder, the stones and the lending

Fourteen puzzles. The first is open, and each solved opens the next (`MIMIC_LADDER`). There is also the game day's puzzle, seeded and
the same for everyone (`dayPuzzle`), at the Gnomon flats' stone once its rungs are done.

| stone (area) | rungs | teaches |
|---|---|---|
| the Gnomon flats | One Mound, A Hollow, Two Mounds, The Ditch, Level It, Unmade | Shape (raise, lower, level), Carve, UNDO |
| the shore | Move the Heap, Fill the Hollow, The Slab | Scoop and Pour, Lift Ground |
| the crystal ridges | Sand to Clay, Order of Things, The Moat | Transmute, MATCH |
| the ruins | Swap, Copy | Swap (Ouranurgy), Copy Terrain (Spellscription) |

- **A puzzle's powers are lent while it is open.** `powerOpen` asks `game.mimicry.lends`, so Swap at Ouranurgy 1 is the puzzle's tool,
  never yours to keep.
- **A clean copy (two stars) of the puzzle for Transmute, Lift Ground, Swap or Copy Terrain is that power's third way to be learned**
  (`progress/skills.js` MIMIC_WAY), beside its count way and its feat way. This is the domain gaps' answer:
  - Ouranurgy and Spellscription had no power below level 15. Their powers can now be learned by copying the System. The System teaches
    the God Arts the way it teaches the Movement Arts.
  - DOMAIN-SOURCES.md and the 2026-10-30 audit name Manifestation, Spellscription and Ouranurgy as the most under-fed. A solve pays its
    powers' domains as a big act, its quality the stars (`domains.js`, `mimic.solve`). It also pays Spellscription a little every time
    (the ground transcribed from what was shown), and Divination for MATCH and UNDO.

## 6. Pay

- A puzzle's first solve pays cubes at the stone: 2, 3 or 4 minutes of play by tier (`MIMIC.pay`).
- The game day's puzzle pays 3 minutes of play, once a game day.
- A rung is a few minutes' thought, so it pays about the aim; it is never a farm.

## 7. Next (not built)

- **Possession:** a herding puzzle (Herd a flock of clapperjars into a pen drawn on the ground). It is a different family: creatures,
  not matter.
- **Manifestation:** Sculpt's creations copied (a pillar, an arch). It needs the creations compared voxel to voxel, not the field.
- **Divination:** a Layer View puzzle (the start's lower layers hidden; read them before you copy).
- **Looks:**
  - Calissa's ghost (in place of the gold wire);
  - the stone's dress;
  - the System's step marks during the demonstration;
  - the readout tag (MATCH, strokes, stars) on the stone while it is open.
- **Sounds:** Wanda's chime a step, the turn's call and the solve's stars.
- **Words:** Espada's labels and lines.
