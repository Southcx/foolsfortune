# The mimicry puzzles (the god hand taught by copying)

South, 2026-10-30: "designing Godhand puzzles and working out creative and abstract ways to teach how to use the skills, like taking an
object, warping it IAW the godhand power suite, then making the player recreate the steps applied like a mimicry game ... Islands of
Insight (failed puzzle MMO) and Puzzle Pirates are good prior art reference."

Rules: `src/progress/mimicry.js` (the herd's `src/progress/mimicryherd.js`, the creations' `src/progress/mimicrysculpt.js`). World: `src/world/mimicry/mimicry.js`. Log and ledger: `src/feedback/tracking/mimicry.js`.
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

Seventeen puzzles, fifteen of them live today (`MIMIC_LIVE`: the two whose family the runtime does not run yet are stepped over, section 7).
The first is open, and each solved opens the next live one (`MIMIC_LADDER`). There is also the game day's puzzle, seeded and
the same for everyone (`dayPuzzle`), at the Gnomon flats' stone once its rungs are done.

| stone (area) | rungs | teaches |
|---|---|---|
| the Gnomon flats | One Mound, A Hollow, Two Mounds, The Ditch, Level It, Unmade | Shape (raise, lower, level), Carve, UNDO |
| the shore | Move the Heap, Fill the Hollow, The Flock, The Slab | Scoop and Pour, Herd (Possession), Lift Ground |
| the crystal ridges | Sand to Clay, Order of Things, The Moat, Below the Surface | Transmute, MATCH, Layer View (Divination) |
| the ruins | Swap, Pillar and Arch, Copy | Swap (Ouranurgy), Sculpt (Manifestation), Copy Terrain (Spellscription) |

The ladder: One Mound, A Hollow, Two Mounds, The Ditch, Move the Heap, Level It, Fill the Hollow, **The Flock**, Sand to Clay, Order of
Things, Unmade, The Slab, Swap, **Pillar and Arch**, Copy, The Moat, **Below the Surface**.

- **A puzzle's powers are lent while it is open.** `powerOpen` asks `game.mimicry.lends`, so Swap at Ouranurgy 1 is the puzzle's tool,
  never yours to keep.
- **A clean copy (two stars) of the puzzle for Transmute, Lift Ground, Swap, Copy Terrain, Herd, Sculpt or Layer View is that power's third way to be learned**
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

## 7. The three domains' puzzles (GAPS G141 to G143)

Every domain now has a rung. A puzzle's **family** says what is copied, and so how it is judged (`scoreOf`). A family the runtime does
not run yet (`MIMIC_RUNS`) is never open, and the ladder and the achievements count only the live rungs (`MIMIC_LIVE`). So a rung
waiting on the runtime never blocks the next one. The runtime's hooks are in `docs/handoffs/petra/2026-11-02-from-dovina-mimicry-puzzles.md`.

| puzzle (stone) | family | runs today | teaches |
|---|---|---|---|
| The Flock (the shore) | herd | no (the flock needs spawning) | Herd takes the nearest few within its reach |
| Pillar and Arch (the ruins) | creation | no (the demonstration and the snapshot need the creations) | a stroke's length decides what Sculpt raises |
| Below the Surface (the ridges) | matter, veiled | yes (without the veil until the ghost hides it) | read the ground before you copy it |

**The Flock** (Possession, MIMIC, tier 2, par 2; `progress/mimicryherd.js`):
- Six clapperjars stand in two knots of three, 8 m apart, and a hexagonal pen is drawn between them (2.4 m to a corner).
- Herd at the toolkit's numbers reaches 6 m and takes the nearest 4 (`MIMIC_TOOL.herd`, RAMP's level-open row). So each knot is out of
  reach of the other's drag, par is one drag a knot, and one drag from between the knots takes only four of the six.
- **Score:** the flock's share inside the pen's polygon. A body outside counts 1 - d / 0.75 within 0.75 m of the line (a shoulder over
  the line is not a miss), then nothing.
- Numbers: five of six in scores 0.83 (solved); all six 1.00 (clean); four of six 0.67 (not solved, so the drag from between fails).
- **What it teaches:** Herd's cap. The lesson is reading how many it takes and from how far, never a tutorial.

**Pillar and Arch** (Manifestation, MIMIC, tier 2, par 2; `progress/mimicrysculpt.js`):
- The System raises a pillar (a stroke under 1.5 m) and an arch over a 6 m span (1.8 m high: 0.3 of its span). Both are sized as the
  hand sizes them at the toolkit's scale 1 (`SCULPT`, godhand/matterarts.js `sculpt`).
- **Score:** voxel to voxel over the creations' own grid (godhand/voxels.js), never the field: a creation stands over the ground.
  - The solids are read at 0.5 m cells (each holding its eight voxels' solid share) and softened over half a metre (two box passes).
  - Then the same Dice of the two changes the matter uses, times the share of the asked volume raised, up to 80% (`VOX.enough`).
  - It works only inside the solids' bounds: about 1 ms a score on a desk, the matter's 1.3.
- The start is whatever already stands on the patch, so a creation of yours beside the stone is neither required nor wiped.
- Numbers: the System's 1.00; nothing 0; a hand's copy half a metre off 0.78; the pillar alone 0.22.
- **What it teaches:** what the stroke's length makes. The arch's span is read off its height.

**Below the Surface** (Divination, MATCH, tier 3, par 3; the veil, `veilOf`, `unveil`):
- A mound is shown. Two hollows are asked, each 0.8 m deep, hidden while the target lies more than 0.2 m under the start's ground
  (`MIMIC.veil`). A raise's ring sinks about 0.1 m and stays shown, a hint and no more.
- A Layer View read lifts the veil within 2 m of its line (`MIMIC.reveal`). Three reads across the patch see it all.
- Layer View is lent (`lend: ['strata']`) and is the power in hand as the puzzle opens. A read is not a stroke.
- Scored as any matter puzzle. Numbers: the veil hides 32 cells (8 m²); copying only what is shown scores 0.33; the System's 1.00; a
  hand's copy 0.77.
- **What it teaches:** that what you see is not all that was done. Until the ghost hides the veiled cells, it plays as a plain MATCH.

The solves pay their domains as the rest do (`domains.js`: Possession is in the list now; Divination already by MATCH).

## 8. Next (not built)

- **Looks:**
  - Calissa's ghost (in place of the gold wire);
  - the stone's dress;
  - the System's step marks during the demonstration;
  - the readout tag (MATCH, strokes, stars) on the stone while it is open;
  - the herd puzzle's pen on the ground, and the ghost's veil (`docs/handoffs/calissa/2026-11-02-from-dovina-mimicry-looks.md`).
- **Sounds:** Wanda's chime a step, the turn's call and the solve's stars.
- **Words:** Espada's labels and lines.
