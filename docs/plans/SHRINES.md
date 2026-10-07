# Shrines, the Spirit Garden's door, and the Wake Whistle (the owner, 2026-10-06)

Kept by Dovina. Petra builds the places and the acts, Calissa the look, Espada the names. Units: real seconds, minutes of play.

> "Shrines should be our de-facto Save Points and also allow you to access your Spirit Garden, which again is a pocket dimension within
> your Pneuka Jar, thematically adjacent to your Pneuka Box. The Pneuka Box is like the easy-access shed inside your Garden."
> "Yes to Shrines being official fast travel respawn points. I'd go so far as to say no Shrines in Wells. But we should give players an
> Escape Rope option, or like 'Smelling Salts' in Psychonauts."

Prior art: Resident Evil's save rooms (the item box beside the typewriter: the shed by the door), Hollow Knight's benches (rest and
come back here), Dark Souls' bonfires (rest, travel between the ones lit), Okami's origin mirrors (save, travel), Kingdom Hearts' save
points (rest), Pokemon's Escape Rope and Psychonauts' Smelling Salts (out of the dungeon, alive), and Escape from Tarkov's extracts (what
you keep depends on how you leave).

## 1. A Shrine

| it is | what that means |
|---|---|
| **where you are made whole** | after a shatter, you are made whole at the last Shrine you rested at (today: always the workshop, `courier/vessel/death.js`); the workshop's is the first |
| **a rest** | F at the Shrine: the pool full (and, once the Courier has a mental state in code, `COURIER_MIND` in `progress/stones.js`, it settles to Balanced); nothing else (no world reset, no creature respawn: the Souls bonfire's reset is not taken, because the world here turns by the game day) |
| **a fast-travel point** | at any Shrine, travel to any Shrine you have **found** (rested at once), free. Okami's mirrors: travel is a convenience, never a cost, because the long sea crossing (the voyage) is the journey that is meant to cost |
| **the Spirit Garden's door** | the Spirit Garden (the slots, the beds, the spirit press) is entered at a Shrine and nowhere else; the Pneuka Box (P) stays reachable anywhere, as the garden's shed |

**Not a save point.** The game keeps everything the moment it happens (`game.save`), so a Shrine never "saves": a player who believed
it did would fear quitting anywhere else, and lose nothing by it. The log says "You rest at the Shrine." never "Game saved."

**Where they stand** (the first set, one per place you can be made whole in):

1. **the Bisque Shrine**: the workshop (where the Courier was made; bisque is the first firing; found from the start),
2. **the Lamp Shrine**: the Dunes, at the Dunemaw's lip (outside the Well, never in it),
3. **the Float Shrine**: Old Grog's pier on Anagami (the crossing's start),
4. **the Pearl Shrine**: Margarite's dock (the crossing's end; Margarite means pearl).

Names are Espada's (`docs/LORE.md`, "Shrines and the Wake Whistle").

**No Shrines in the Wells** (the owner): a Well is a run, and its risk is that a shatter loses the run. A Shrine inside would end that.

## 2. The Wake Whistle (`whistle.wake`; Espada's name: a Well is rumination, and the way out is to wake)

A small clay whistle, a consumable that takes you out of a Well alive, to its mouth. What you keep depends on how you leave (Tarkov's extracts):

| how you leave the Well | the run's pay | the haul (materials) and the map (the Cogitomap) |
|---|---|---|
| walked up the way up | all | kept |
| **woken** (the Wake Whistle) | **75%** (`ECON.escape.keep`) | kept |
| shattered | nothing | lost |

- **Price: 8 minutes of play** (64 cubes, `ECON.goods['whistle.wake']`), placeholder until a measured run. Bailing costs the toll (a quarter of the pay) and the
  price: at 3 floors (pay 451 cubes) 177, about 0.39 of the run; at 8 floors (3,449) 926, about 0.27; deeper, toward the toll's 0.25.
  So the cost of bailing grows with what you have to lose and stays a choice at every depth (a flat price alone would be nothing at
  depth, where `wellPay` grows 1.25 times a floor).
- **One carried at a time** (`carry: 1`): one bail-out a run.
- **A channel of 1.5 real s, broken by a blow** (WoW's Hearthstone, Tarkov's extract timer): it is a way out when you have a breath,
  not a dodge in the middle of a blow. The owner's "without dying" holds whenever you find a breath; whether a FOE floor allows one
  is the FOE's design.
- Sold where crude is: Old Grog's pier, three in stock (with the Lachrymato Bottles). Blown from the Pneuka Box; it breaks. Works in any Well (the Great Dunemaw
  included); anywhere else it does nothing ("You are not in a Well.", at the point of use). The log (rule in `tracking/wells.js`): "You blow the Wake
  Whistle, and wake at the Dunemaw's mouth." A woken run is not a timed run (`well.run.*` skip it).

## 3. Events and counts (for the build; rules added when they are emitted)

| event | payload | counts |
|---|---|---|
| `shrine.find` | `{ shrine, by }` | `shrine.found`, `shrine.found.<id>` |
| `shrine.rest` | `{ shrine, by }` | `shrine.rest` |
| `shrine.travel` | `{ from, to, by }` | `shrine.travel` |
| `garden.enter` | `{ shrine, by }` | `garden.enter` |
| `well.leave` | gains `how: 'walk' | 'escape' | 'shatter'` (beside `shattered`) | `well.escape` |

Achievements (when built): THE SPIRIT GARDEN gains **The Shrines**: find every Shrine; travel a hundred times.
