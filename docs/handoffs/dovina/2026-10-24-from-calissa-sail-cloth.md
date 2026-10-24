# From Calissa (Art): the sail's cloth, eight patterns and four cuts (2026-10-24)

The owner: "more sails, new paintjobs for the skiff ... build, build, build". The looks are built and wait on your rows. Until a row is
in `PAINT`, nothing changes: an id the catalogue lacks is never worn (your `rowOf` refuses it), and the look falls back to the stock
pattern and the stock cut. The race board's PAINT tab walks `Object.keys(PAINT)`, so a new `cut` kind shows up there by itself, and its
preview already works (`skiffPaintPreview(game, 'cut', id)`). Contact sheet: `docs/plans/art/sail-cloth.jpg`.

## 1. Eight `pattern` rows (the ids the look knows: `SAIL_PATTERNS`, vfx/skiffsailpatterns.js)

Labels are plain for now; Espada names them later. The `opens` are suggestions from counts the ledger already keeps. Change them freely,
the look only reads the id.

| id | label | line | opens (suggested) | hint |
| --- | --- | --- | --- | --- |
| `waves` | Waves | Rows of overlapping wave fans across the sail (seigaiha). | `did('race.raceway.win', 3)` | Win 3 races. |
| `sunburst` | Sunburst | Gold rays fanned from a sun rising over the boom. | `did('skiff.pop.perfect', 10)` | Land 10 perfect pops. |
| `diamonds` | Diamonds | A diamond lattice, keylined in gold (harlequin). | `did('skiff.combo.longest', 5)` | Link 5 tricks into one combo and bank it. |
| `checker` | Checker | A racing checker down the leech. | `did('race.raceway.gold', 3)` | Take gold at the Raceway 3 times. |
| `kintsugi` | Kintsugi | The cloth crazed, its seams mended in gold. | `did('skiff.wreck', 5)` | Wreck the skiff 5 times. |
| `constellations` | Constellations | A night sky: the Plough, Orion and Cassiopeia. | a race won at night (a `race.condition` count if you keep one), else `did('race.raceway.win', 20)` | Win a race at night. |
| `flames` | Flames | Flames licking up from the foot. | `did('skiff.combo.best', 6000)` | Bank a combo worth 6,000. |
| `split` | Two-tone | The sail halved on the diagonal, a gold seam between. | `did('cup.clay.win')` (beside the stripe) or from the start | Win the Clay Cup. |

Each pattern uses the worn dye as its ground and picks its own second colour (the accent, gold, the dye darkened, or cream). With the cloth
undyed it works on the cream. The constellations replace the ground with the dye darkened toward a night sky.

## 2. A new kind, `cut` (the sail's silhouette; `SAIL_CUT_IDS`, vfx/skiffsailcut.js)

A look only. The sail's numbers stay its part's (`PARTS`, SAIL slot). Please add `cut` to `PAINT` with the stock row first (it becomes
the default for old saves through your `STOCK`):

| id | label | line | opens (suggested) | hint |
| --- | --- | --- | --- | --- |
| `stock` | The lug | The sail as it was made. | none | |
| `lateen` | Lateen | A long yard raised aft, the cloth a triangle under it. | `did('cup.sibling.win')` | Win the Sibling Cup. |
| `junk` | Junk | Battened panels, the leech bowed out. | `did('race.raceway.win', 10)` | Win 10 races. |
| `crabclaw` | Crab-claw | Two spars from the tack, the cloth hollowed between them. | `did('skiff.grab.best', 3)` | Hold a grab for 3 real seconds. |

One naming flag: the glossary already has "a cut" (the Raceway's stretch between walls) and "the paid cut". I added "a sail's cut" with a
row in the homonyms table. The kind key is `cut` as asked. If the gate would rather have `sailCut`, tell me and I'll read that instead
(one line in `skiffpaintlook.js apply`).

## What I did not check
- The cuts were seen side on and still, and the patterns flat. I did not ride them at speed or watch a summon or recall (the yard's
  move is scaled by the hoist, so a furled sail comes down as before).
- The rivals and the ghost always wear the stock cut (their yard is not moved).
