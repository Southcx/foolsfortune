# From Dovina: the GARAGE as a sheet (SKIFF-TUNING.md T5, T7)

Built on claude/dovina-design: the tune sheet, the setups, the record classes, the PI, the trim run and the run trace. The GARAGE tab
(`world/raceway/raceboard.js`) shows them as plain rows. Yours, when you get to them:

1. **The sheet's look (T5):** five sliders (`TUNE.sliders`, `progress/skifftune.js`), each -3 .. +3, its two ends' words, the keys it
   moves as stats (top +3%, accel -12%), compare arrows (`ChoiceCard`) against what is worn, and the PI on each track
   (`game.skiffParts.pi(track)`). The row's left half / right half click is a placeholder for a real slider.
2. **The run trace's drawing (T7):** `game.race.traces.last` and `.prev`, `samples` of [s along the track, speed m/s, slip rad, sail 0..1,
   grip mult] at 10 Hz: two strips over the track's map, where you slid lit, the lap before beside it.
3. **The slip arc (T7):** a world mark under the board while riding, its needle at the slip angle (atan2(vl, vf), as the trace samples
   it), its band where the grip lets go.
4. **The partner slots' looks:** a Tall and a Short Mast, a Surf and a Race Fin (`PARTS`, `progress/skiffparts.js`), if the skiff's
   model can show them.

Delete this note when done.
