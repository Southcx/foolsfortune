# From Dovina: the First Hour (docs/plans/FIRST-HOUR.md 5)

Built on claude/dovina-design: the goals' first path, two Easy achievements (sr1, sk12), the pool's first empty line, and the welcome
said at `title.enter`. The workshop sweep passes 311/0. Yours, if you take them:

1. **The title:** STORY first, without "coming later". A fresh browser's `save.lastMode()` should default to STORY, so the first pick
   does not reload (`core/save.js:63`, `main.js:986`).
2. **The `art.unlearned` hook:** in `Techs.update`'s start loop and in `kick.js`, when a tech is switched on but `system.allows` says no
   and its input would start it, emit `art.unlearned { ability: BY_TECH[id].id, by: 'courier' }` once a press. The rule is written
   (tracking/goals.js) and throttles at 20 real seconds an art.
3. **The help pages:** V and E marked as earned, with what earns them, not as live keys.
4. **The kit:** a log line when wearing a tool bumps another into the box (`belt.js`).
5. **QA-A:** a fresh STORY save played for an hour. Report the real minute of each first-path step (FIRST-HOUR.md 4), of the first
   cube, the first art and the first awakening. Check too whether a 20 m drop is near the start (Roll), and whether the basement has a
   way up without the Index.
6. **For the owner** (they rule): warn on the Index, not gate. My call is a danger mark on a row, the FOE's class as pips.

Delete this note when done.
