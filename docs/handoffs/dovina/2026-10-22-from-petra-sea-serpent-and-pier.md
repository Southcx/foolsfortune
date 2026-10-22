# From Petra (Main): the sea serpent fought, the pier's open sea, the arrow keys (2026-10-22)

Your numbers stand (`SEA_SERPENT`); where I needed numbers of my own they are mine to tune and named here.

**The serpent** (`src/creatures/seaserpent/`: the body and its mind on `creatures/ai/`):
- Hostile by nature. It watches the hull (the Courier is sealed in), and how loud the hull is is the sail: stop 0.35, slow 0.7, cruise 1,
  full 1.4 (`SERPENT_MIND.loud`). Inside 120 m it notices you in a few seconds at cruise.
- While hunting it circles at 30 to 48 m with its humps and head on the water, the head raised about a third of the time. Between moves
  it takes a breath of 1.6 to 3.4 real s, then one of your four moves by its gate: coil (within 26 m, the ship below full sail), ram (22 to
  90 m, the ship under way), spit (12 to 80 m), dive (within 70 m). It seldom takes the same move twice running.
- **The ram** rises through a 4 m ring laid on the bow's path. A hard rudder at its first sight clears it: the helm's turn is now 0.6 rad
  a real s (was 0.42), which is my helm-feel change.
- **The coil** is a chase: during its 2 s windup it matches the ship's way and closes, at most 1.45 x its speed (13 m/s). A ship at full
  sail (15) outruns it; one at cruise does not. Wrapped, the helm turns and makes way at half (a modifier, `helm.mods`, its source the
  coil). Hits to the head add up, and 6 damage shoots it loose (two head shots).
- **The spit** is an outlined shot: V within 7 m of the hull sends it back at the head for 3 x 3 = 9.
- **The hull** bears the ship's `bears` (the sloop 6). The last hit breaks it, and a tug tows you to the lane for the tow's fee (`tow`),
  mended. A dock mends it. It is kept by the save (`seaFight`).
- **Lairs**: one in four of the squares `sightings` gives the serpent, with at least one. It rises within 380 m of its lair. It goes if
  the ship is 900 m off and it is not hunting. A lair whose serpent went down is empty until the next game day.
- DEBUG: `/serpent` (one risen 120 m off the bow, sure of you).

**Yours, if you want them:**
- `seaserpent.down { cause, by, lair, give }` pays nothing yet. `SEA_SERPENT.give` (the material and the bounty) is your rule to wire.
- The ledger keys I count are in `feedback/tracking/seaserpent.js`, for the achievements:
  - `seaserpent.rise`, `seaserpent.hit`, `seaserpent.hit.head`, `seaserpent.coil`, `seaserpent.free.shot`, `seaserpent.down`;
  - `sea.hull.hit`, `sea.hull.broken`;
  - `parry.sloop`, from `move.parry`.
- OPEN-SEA.md 11's "Not yet" can drop the sea serpent and the pier's choice.

**The pier** (`world/emocean/pier.js`) now heads its islands "SET SAIL FROM ANAGAMI: A CROSSING", and under "OR SAIL FREE" has a row,
THE OPEN SEA, which goes there under the seam. It always lands at Anagami's quay, because `OpenSea.arrive()` (yours) takes no island. An
`arrive(island)` that sets you at that island's quay would let Margarite's pier land you at Margarite's.

**The arrow keys** turn and tilt the camera everywhere the Courier's camera runs: left and right 90 degrees a real second, up and down
60, eased in over 0.15 s, added to the mouse (PHOTO-MODE.md step 1). The setting is `visual.arrowCamera` (on), and THE KEYS page has its row.
The helm swings back astern after 3 real s untouched, but not while a serpent lives (the gun aims with the camera).

Delete this note when done.
