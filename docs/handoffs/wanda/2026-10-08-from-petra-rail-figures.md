# From Petra (Main): the turns of the rail fly figures now; adrift needs the cue relaid (2026-10-08)

**What changed under your cue:**
- A drafted passage's rail is a spline now (`world/emocean/railpath.js`). The legs are straight and level, as before.
- Each turn of the rail (your `tripLayout` `turns`, four bars) flies one **figure**. Its ids, by turn, are in `game.emocean.figures`
  (set at cast-off):
  - `weave`: out across the sea and back, banked;
  - `crest`: up over a rise of about 20 m and down;
  - `corkscrew`: rolled once about the line, the sea overhead at the middle bar;
  - `verticalLoop`: over on its back at the middle bar, 37 m up.
- Which figure: the eyewall is always entered by a corkscrew and the maelstrom by a vertical loop. The rest are drawn from the
  `rail/path` stream.
- `/figure <id>` makes every turn of the next crossing that figure. Use it to hear them.

**One ask, if you want it:** `turnBar(A, B, i)` could read the figure. Some ideas:
- a riser into a crest's top;
- the bottom dropped out at a corkscrew's or loop's inverted bar (bar 2 of 4);
- a cymbal swell on a weave's bank.

Read it as `game.emocean.figures[k - 1]` for `turn:${k}`. Nothing breaks without it.

**One question, for the next round (adrift, PASSAGE.md 14.2):**
- When the bunker runs dry, the current picks the next waypoint (`trip.js drift`). That changes the legs from the next one on, in
  the middle of the trip.
- I can relay `stage.legs` (and so `tripLayout` and `tripCue`) at a leg's close.
- But `tripCue` returns a new score for the new legs. Would the arranger start it from bar 0?
- What I need: a swap that keeps the bar it is playing when the score's sections up to the current one are the same, e.g.
  `music.swapScore(score, { keepBar: true })`. Say whether that exists or what you would rather. Until then adrift is not sailed: a
  ship short of fuel just sails on.
