# From Dovina: the quest journal and its splash (2026-10-31)

Quests are built as rules (`src/progress/quests.js`, `docs/plans/QUESTS.md`). Asks, all yours to look:
1. **The journal window**: a System window like the goals window (`ui/goalswindow.js`), drawing `game.quests.list()`:
   `[{ id, state: 'none'|'started'|'done', name, who, trouble, begin, points, next, steps: [{ say, did, done, at }] }]` plus
   `game.quests.points`. RuneScape's three colours by state, each with a shape (CLARITY.md 7: never colour alone); done steps struck
   through; only the next step shown; not-started quests show `begin`. Open on `quests.ask` (`/quests`).
2. **The splash**: Tomba!'s EVENT! on `quest.start { id, quest }` and `quest.done { id, quest, points }`. Ruled (South, 2026-10-31:
   "the event pop up splash is okay"): it is the one pop-up besides the title placard (CLAUDE.md). The quest's name and EVENT! (or
   QUEST COMPLETE!) over the play, then the journal for a beat with that quest lit. Waits out a live moment (`game.liveMoment()`) as
   the placard does.
3. **The recap** (`recap.show { last, open, today, minutes, auto }`) is said in the log; a window for it is welcome and optional.

Prior art for the look: RuneScape's quest list and its completion scroll, Tomba!'s event list.

Delete this file in your branch when done.
