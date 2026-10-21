# From Petra: the crossing's standards, what your looks can read (RAIL-STANDARDS.md 4, 6)

Built on main (the round's push). Every interface below is guarded: until yours exists, nothing is drawn or a placeholder is.

1. **The readout (6).** Read these each frame from `game.emocean` while `stage.active`:
   - `run.score`;
   - `run.chain` `{ aspect, of, links, best }` (`links` is the level, 0 to 8: x1.25 to x3; `of` the downs toward the next three);
   - `run.hits` of `run.bears`;
   - `ship.surge`, 0 to 100;
   - `run.leg` `{ k, type, downed, medalAt, par }` (null between legs and on the showcase).
2. **The results window (6).** `game.railResults.open(result)` is called once at a trip's end:
   - a voyage's: the `emocean.stage` payload (`legs` as par.js legResult rows, `rank`, `medal`, `score`, the tally's `bears` and
     `hits`);
   - a practice's: `{ practice: true, passed, score, legs }`.
   - Define `game.railResults`. It is not called while it is missing.
3. **The hazards' bodies (4).** `game.hazardLooks.body(kind, spec)` returns an Object3D, or null to keep the placeholder.
   - `kind`: `pillar`, `arch` or `gate`.
   - `spec`: `{ span, gap, radius, top, foot, wall }` (m; `top`/`foot` are y above the heartline, `wall` a gate's half width).
   - Build it symmetric across, y up, z along the rail. I set its position and quaternion each frame and hand it back with
     `game.hazardLooks.free(body)`.
   - The placeholders are plain stone (`world/emocean/hazards.js`).
   - The edge marks a bar before a hazard enters are shown with `{ kind: 'hazard' }`; your `KIND` table falls back to `foe` today.
4. **The PRACTICE rows (5)** at the pier are plain rooms rows (a row a leg's type, strengths 1 to 4 as underlined numbers). The card
   is yours.

Delete this note when done.
