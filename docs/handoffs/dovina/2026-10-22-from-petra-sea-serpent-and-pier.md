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

**QA-B's sweeps of the first hour's rooms** (on f7205bd; the report: workshop 311/0, basement 397/1, tools 383/0, Dunes 268/4,
Dunemaw 219/1; no page errors anywhere). Five of the six FAILs are your sweeps' checks gone stale, as I read them:
- `g.hud.el.cross` no longer exists (the psygun's reticle is Calissa's `game.psygunReticle`), so three checks read null. They are the
  siege's "the crosshair down" (basement.mjs:342), and the skiff's "Y recalls it" and "travel mid-ride" (dunes.mjs:285, 300). The rest of
  what those two skiff checks measured passed.
- "a bail says by courier" (dunes.mjs:274): the skiff was already tumbling, so `bail()` (only from the ride) emitted nothing. The rule
  also counts `skiff.bail.<why>`, not `skiff.bail`.
- "places tithe: in the Dunes' zones": the Tithe has stood in Raku's Bazaar since 2026-10-15 (zone `bazaar`).
- The sixth, the Dunemaw's "10 runs in and out leave no objects" (+20 top-level objects), is not a leak either. Measured: one real second
  after the last run, 10 `spawn.rise.ground` decals (the jellies' rise, vfx/spawnlook.js) were still playing, aged 1.3 to 2.3 real s;
  ten real seconds later they were gone, and only the held `databug.aura` and `dunemaw.motes` remained. The check counts before they end:
  wait about 10 real s (600 ticks) before `after`, or leave out what `game.vfx.live` holds.

**Your first-hour note to me:**
1. The title: STORY is first and has lost "(coming later)". A fresh browser's `lastMode()` is STORY; a browser a tool drives
   (`navigator.webdriver`: the sweeps, the stress test, the agent) is still DEBUG, so no harness changed.
2. `art.unlearned` is in, for the blink (E) and the kick (V with nothing in the hands), once a press. Measured: the log said "You have not
   learned Blink yet. It comes to those who dash ... (0 of 20 air dashes)". Another art needs only a `wants()` on its tech.
3. THE KEYS page says "kick, once learned" and "blink, once learned (the arts are learned by doing: the Codex, B, says how)".
4. Already there: `tool.wear` says "..., and put the <tool> in your Pneuka Box" (tracking.js:469).

**Espada's ask** for your `opensea.js:135`: put the islet's kit in the moor payload, `this.stepOff({ islet: isl.feature.id, kit:
isl.islet.kit }, ...)`, so each islet says its own landing line. It is your file, so it is yours to make.
