# Shrines, the Spirit Garden's door, and the Wake Whistle (the owner, 2026-10-06)

Kept by Dovina. **Built:** `src/world/shrines.js` (`game.shrines`; its header holds the design), the Wake Whistle's `ECON.escape` and
price (`src/progress/econ/table.js`), the log's rules (`src/feedback/tracking.js`, `tracking/wells.js`).

> "Shrines should be our de-facto Save Points and also allow you to access your Spirit Garden ... The Pneuka Box is like the
> easy-access shed inside your Garden." "Yes to Shrines being official fast travel respawn points. I'd go so far as to say no Shrines
> in Wells. But we should give players an Escape Rope option, or like 'Smelling Salts' in Psychonauts." (the owner, 2026-10-06)

## Rulings

- A Shrine is where you are made whole after a shatter (the last rested at), a rest (pool full, mind to Balanced; no world reset), free
  fast travel to any Shrine found (the voyage is the journey meant to cost), and **the Spirit Garden's only door** (the Pneuka Box
  stays reachable anywhere as its shed).
- **Not a save point**: the game keeps everything as it happens; the log says "You rest at the Shrine.", never "Game saved."
- **No Shrines in the Wells** (the owner): a Well is a run, and its risk is that a shatter loses the run.
- The first set (Espada's names): **Bisque** (the workshop, found from the start), **Lamp** (the Dunemaw's lip, outside the Well),
  **Float** (Old Grog's pier, Anagami), **Pearl** (Margarite's dock).
- **The Wake Whistle** (`whistle.wake`; a Well is rumination, the way out is to wake): out of any Well alive, to its mouth. Walked up:
  all the pay; **woken: 75%** (`ECON.escape.keep`); shattered: nothing. The haul and the Cogitomap are kept unless shattered.
  - **8 minutes of play** (64 cubes), a placeholder: with the toll, bailing costs about 0.39 of the run at 3 floors, 0.27 at 8, toward
    0.25 deeper (a flat price alone would be nothing at depth, where `wellPay` grows 1.25 times a floor).
  - **One carried** (`carry: 1`). **A channel of 1.5 real seconds, broken by a blow** (the owner, 2026-10-07): a way out when you have
    a breath, not a dodge. Sold at Old Grog's pier (three in stock). A woken run is not a timed run.

## Events and counts

| event | payload | counts |
|---|---|---|
| `shrine.find` / `shrine.rest` | `{ shrine, by }` | `shrine.found`, `shrine.found.<id>` / `shrine.rest` |
| `shrine.travel` | `{ from, to, by }` | `shrine.travel` |
| `garden.enter` | `{ shrine, by }` | `garden.enter` |
| `well.leave` | gains `how: 'walk' \| 'escape' \| 'shatter'` | `well.escape` |

**Open:** THE SPIRIT GARDEN gains **The Shrines** achievements: find every Shrine; travel a hundred times.
