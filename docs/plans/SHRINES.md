# Shrines, the Spirit Garden's door, and the Wake Whistle (the owner, 2026-10-06)

Kept by Dovina. **Built:** `src/world/shrines.js` (`game.shrines`), the Wake Whistle's numbers `ECON.escape` and
`ECON.goods['whistle.wake']` (`src/progress/econ/table.js`), the log's rules in `src/feedback/tracking.js` and
`src/feedback/tracking/wells.js`. **Not built:** the achievements (below). Units: real seconds, minutes of play.

> "Shrines should be our de-facto Save Points and also allow you to access your Spirit Garden, which again is a pocket dimension within
> your Pneuka Jar, thematically adjacent to your Pneuka Box. The Pneuka Box is like the easy-access shed inside your Garden."
> "Yes to Shrines being official fast travel respawn points. I'd go so far as to say no Shrines in Wells. But we should give players an
> Escape Rope option, or like 'Smelling Salts' in Psychonauts." (the owner, 2026-10-06)

Prior art: Resident Evil's save rooms, Hollow Knight's benches, Dark Souls' bonfires, Okami's origin mirrors, Pokemon's Escape Rope,
Psychonauts' Smelling Salts, Escape from Tarkov's extracts.

## Shrines

- **Where you are made whole** after a shatter: the last Shrine rested at.
- **A rest** (F): the pool full, the mind settled to Balanced; no world reset or creature respawn (the world turns by the game day).
- **Fast travel**, free, to any Shrine found: travel is a convenience; the voyage is the journey meant to cost.
- **The Spirit Garden's door**, and nowhere else; the Pneuka Box (P) stays reachable anywhere as the garden's shed.
- **Not a save point**: the game keeps everything the moment it happens, so a player who believed a Shrine saved would fear quitting
  elsewhere. The log says "You rest at the Shrine.", never "Game saved."
- **No Shrines in the Wells** (the owner): a Well is a run, and its risk is that a shatter loses the run.
- The first set (Espada's names, `docs/LORE.md`): the **Bisque Shrine** (the workshop, found from the start), the **Lamp Shrine** (the
  Dunemaw's lip, outside the Well), the **Float Shrine** (Old Grog's pier, Anagami), the **Pearl Shrine** (Margarite's dock).

## The Wake Whistle (`whistle.wake`; a Well is rumination, and the way out is to wake)

A consumable clay whistle: out of a Well alive, to its mouth. What you keep depends on how you leave (Tarkov's extracts):

| how you leave the Well | the run's pay | the haul and the Cogitomap |
|---|---|---|
| walked up | all | kept |
| **woken** | **75%** (`ECON.escape.keep`) | kept |
| shattered | nothing | lost |

- **Price: 8 minutes of play** (64 cubes), a placeholder until a measured run. With the toll, bailing costs about 0.39 of the run at
  3 floors, 0.27 at 8, toward 0.25 deeper: the cost grows with what you have to lose (a flat price alone would be nothing at depth,
  where `wellPay` grows 1.25 times a floor).
- **One carried at a time** (`carry: 1`): one bail-out a run.
- **A channel of 1.5 real seconds, broken by a blow** (settled by the owner, 2026-10-07): a way out when you have a breath, not a
  dodge. Whether a FOE floor allows one is the FOE's design.
- Sold at Old Grog's pier, three in stock; blown from the Pneuka Box; works in any Well (the Great Dunemaw included), elsewhere "You
  are not in a Well." A woken run is not a timed run (`well.run.*` skip it).

## Events and counts

| event | payload | counts |
|---|---|---|
| `shrine.find` | `{ shrine, by }` | `shrine.found`, `shrine.found.<id>` |
| `shrine.rest` | `{ shrine, by }` | `shrine.rest` |
| `shrine.travel` | `{ from, to, by }` | `shrine.travel` |
| `garden.enter` | `{ shrine, by }` | `garden.enter` |
| `well.leave` | gains `how: 'walk' \| 'escape' \| 'shatter'` | `well.escape` |

**Open:** THE SPIRIT GARDEN gains **The Shrines** achievements: find every Shrine; travel a hundred times.
