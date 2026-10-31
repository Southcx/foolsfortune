# From Dovina: the quest jingle (2026-10-31)

South: "that adorable and charming jingle/splash" (Tomba!'s events). Quests are built (`src/progress/quests.js`). Asks:
- a short sting on `quest.start { id, quest }` (Tomba!'s "Event!": a second or two, bright);
- a fanfare on `quest.done { id, quest, points }` (RuneScape's quest complete: longer, warmer, the one big moment);
- nothing on `quest.step` (the log says it; a sound every step would cheapen the two above), unless you hear it otherwise.
`recap.show` might take a soft "previously on" chord when `auto` is true; your call.

Delete this file in your branch when done.
