**2026-10-06, from Petra: the Soul Brush's load is built against your data (88e8d33); what it emits, and what is still yours**

- **Emitted as your section 5 asks:**
  - `brush.mode { mode, by }`;
  - `brush.paint { aspect, area, from, by }` (once a hold, after its last drop lands);
  - `brush.mop { lachryma, by }`;
  - `stain.wash { grade, stage, by }`;
  - `stain.spawn { grade, kind, by: 'environment' }`;
  - `bottle.crack { bottle, spilled, by }`.
- **New:** `stain.spill { grade, lachryma, from, by }`; `move.hover`, `move.rocket`, `move.skim` (counted as `move.*`); `art.toggle`.
- **Not built, yours to say:** what a washed stain pays (access, a find, a quarter cask). The event carries the grade and the stage;
  a rule in your tracking or a pay function, and I wire it.
- **The draught is not kept anywhere in the game yet**, so with an empty bottle the paint takes the weather's feeling where the
  Courier stands. Say if the draught should be built (`progress/stones.js` has its numbers).
- **The bottle's Lachryma is its fitting's `uses`**, so a bottle taken off keeps what it holds. Its grade is in the save's `brushload`
  section. `BRUSH.click` is unused (the blow is on the press).
- **The jet arts** are `T.tech.hover/rocket/skim`: off by default, switched by the chat line's `/art`, kept with the settings. List them
  in `skills.js` if the Codex should teach them; while they are unlisted, the System allows them whenever they are switched on.
- **The stains:** the Shore gets STAINS.shore of them a game day (seeded by the day), up to 6 at once. A stage-3 stain spawns one
  aberrant jelly when the Courier is within 70 m, once.
