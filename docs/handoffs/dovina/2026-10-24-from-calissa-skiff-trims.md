# From Calissa (Art): the skiff's trims, rows for the PAINT catalogue

The owner, 2026-10-24: "more customization options for the racing module ... new paintjobs for the skiff ... build, build, build".
The looks are built (`src/vfx/skifftrims/`, owned by the skiff's paint look). Each one is keyed by a row id below. Until your catalogue
(`progress/skiffpaint.js` PAINT) has the row, nothing changes for the player: `SkiffPaint.load` and `choose` turn down an id they do not
know, so what is worn stays as it is, and the look falls back to what stands. The labels are plain (Espada names them later). The
`opens` are suggestions built from ledger counts that already exist; the counts are yours to set.

None of these touches the handling. They all go through `skiff.paint` and the race board's PAINT tab as they are. The tab needs a TITLE
for the new kind (`wrap`); I suggest renaming `length` to show that it is the pennant's shape now.

## trail (the wake on the sand): five rows after `own`, `lachryma`, `glaze`

| id | label | line | suggested opens | hint |
| --- | --- | --- | --- | --- |
| `petals` | Petals | Blossom drifting off the wake. | `did('race.raceway.finish', 25)` | Finish 25 races at the Raceway. |
| `embers` | Embers | A smouldering line that glows and cools. | `did('skiff.scorch', 10)` | Scorch the sail 10 times. |
| `ink` | Ink | A brush stroke left on the sand, drying. | `did('race.made.win')` | Win a race on a track you made. |
| `starlight` | Starlight | Tiny glints that twinkle out across the wake. | `did('skiff.pop.perfect', 25)` | Land 25 perfect pops. |
| `frost` | Frost | Rime that sublimates as you pass. | `did('skiff.nearmiss', 50)` | Shave 50 near misses. |

## ribbon (the trail in the air): three rows after `off`, `on`

| id | label | line | suggested opens | hint |
| --- | --- | --- | --- | --- |
| `helix` | Double helix | Two strands wound round your flight, rungs between them. | `did('skiff.grab.best', 4)` | Hold a grab for 4 real seconds. |
| `comet` | Comet | A bright head, a dust tail and an ion tail. | `did('skiff.combo.best', 10000)` | Bank a combo worth 10,000. |
| `suits` | Paper chain | A streamer of the house deck's cards, a suit at a time. | `did('wager.won', 5)` | Win 5 wagers on your own races. |

## length (the pennant's shape): three rows after `short` (the tab) and `long` (the streamer)

The tab and the streamer are shapes already, so the new shapes are rows of the same kind, not a new kind. A new shape takes its colour
from `pennant` as the tab does. While one of these is worn, `length` is no longer `long`, so the paint look's lengthening is off and
the shape is the length it is drawn at.

| id | label | line | suggested opens | hint |
| --- | --- | --- | --- | --- |
| `swallowtail` | Swallowtail | The pennant cut with a V into its fly, a regatta's burgee. | `(L) => G(L, 'cup.clay.win') > 0 && G(L, 'cup.sibling.win') > 0` | Win both cups. |
| `carp` | Carp windsock | A koinobori carp that fills as the wind rises. | `did('skiff.glide', 50)` | Glide 50 times. |
| `prayer` | Prayer flags | Seven little flags, the seven feelings from Wonder to Dread. | ``(L) => ASPECTS.every((f) => G(L, `feeling.known.${f}`) > 0)`` | Awaken to all seven feelings. |

## wrap (NEW kind, plain name: a hull wrap laid over the hull glaze, never replacing it)

Its first row is the bare hull, so a new save wears nothing. Suggested TITLE: `THE HULL WRAP · over your hull glaze`.

| id | label | line | suggested opens | hint |
| --- | --- | --- | --- | --- |
| `none` | Bare hull | The hull glaze alone. | (from the start) | |
| `pinstripes` | Pinstripes | Two coach lines down the flanks, meeting at the bow. | `did('race.raceway.win', 3)` | Win 3 races. |
| `roundel` | Roundel | A racing roundel on each flank: your number, 0, or your seal when you wear it on the sail. | `did('race.hotlap', 10)` | Run 10 hot laps. |
| `flames` | Flames | Hot-rod flames licking aft from the bow. | `did('race.raceway.solarstart', 20)` | Make 20 solar starts. |
| `kintsugi` | Kintsugi | A seam of gold down the flanks and across the deck: the board's mends worn proudly. | `did('skiff.wreck', 10)` | Wreck the board 10 times and ride on. |

## What I need from you, and what is open

- The rows above, in `PAINT` (`wrap` a new key: STOCK takes `none` from its first row, and the save section's `load` keeps it as it
  keeps the others). Two TITLEs in the race board's PAINT tab (`world/raceway/raceboard.js`): `wrap`, and `length` renamed.
- The roundel shows your seal only while `worn.seal === 'on'` (and `cradles.mine` is there); otherwise it shows the number 0 (the
  Fool's: the Courier's card). If you want the number to be something else (wins, a chosen number), it is `WRAP_LOOK.number` in
  `vfx/skifftrims/wraps.js`. Say so and I will read it from wherever you keep it.
- Prices: none of these is a dye, so I assumed they are free once open, like the trail and the pennant. A wrap could cost a firing
  (it is an overglaze) if you want another sink. That is your call.
