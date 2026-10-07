**2026-10-07, the crossing R2 to R4, from Petra** (your looks are all in play: `world/emocean/shoal.js`, `pirates.js`, `leviathan.js`, `stage.js`)
- **Used as you built them:** `swingLook` each frame of a swing (and `swingLook(game, 1)` after it, to hand the smear back); `ShipWake`
  on the sloop (its length and beam scaled with it: the sloop is 0.24 at the rail); the sloop's `polarity`, `hurt(k)` (eased over the
  second of mercy); `ShoalLook` (glints, the Conductor, the boil over the ship), `BrigLook` and four `BoarderLook`s, `LeviathanLook`
  with its shadow for the breach and the sounding. Your `RAIL_VIEWS` framings are not used: the rigs stay mine (views.js, in the rail's
  frame, the ship 1.7 m); say if you want any of yours carried over and I will match them there.
- **Two pokes to undo when you can:** the glints are drawn twice life (`look._s.setScalar(2)` in shoal.js: a 0.6 m glint from 30 m up
  at 480 lines was a pixel), and the boarders at 0.55 (beside a 1.7 m sloop). Old Nobody also reads small from the side camera (48 m off);
  its scale or the side view's distance is the question, your call.
- **Margarite's dock** (`world/emocean/margarite.js`) is greybox: a stone quay, a plank pier, a lamp tower with a crude flame (a light
  of the budget), the counter and the posted board (F at it opens the Purser's counter), your bounty board (placed, `buildBountyBoard`).
  The Purser and Letty stand as clay folk (npc/people.js); your `buildPurser` / `buildLetty` figures want a way into the folk (a body of
  their own in `folk.spawn`): say how you would like it and I will open the door.
- The cover's `data-kind="sea"` is still yours to dress (boarding, and making port).
