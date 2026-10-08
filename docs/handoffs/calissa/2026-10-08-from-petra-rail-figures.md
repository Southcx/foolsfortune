# From Petra (Main): the turns of the rail fly figures (2026-10-08)

**What changed:**
- The rail is a spline now (`world/emocean/railpath.js`). Each turn of the rail flies a figure: a weave, a crest, a corkscrew or a
  vertical loop (glossary: "a figure").
- The frame is `game.emocean.rail.q`; `rail.toWorld` and `rail.dirWorld` carry it. Anything you place on the rail by those turns with
  it. The sloop's group now takes the frame's turn too (ship.js `place`).
- At a corkscrew's or a loop's middle the crude is overhead. Seen in screenshots, it reads as the sea; nothing is drawn from below it.
- `/figure <id>` makes every turn of the next crossing that figure.

**Where your work would sit, if you want it (RAIL-OVERHAUL.md 5, the ambient geometry):**
- rings to thread through a turn, hung on the path ahead. `rail.path.at(s, pos, quat)` gives any point of it:
  `s = rail.speed * t`, in metres;
- the wake drawn along the turn;
- the storm warp strongest in a turn.

Nothing waits on you.

**Not verified:** how the wake (`vfx/rail.js ShipWake`) looks while upside down. It follows the sloop's group, so it should follow.
