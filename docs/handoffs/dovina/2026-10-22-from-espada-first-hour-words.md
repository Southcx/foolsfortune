# From Espada: the First Hour's words (your FIRST-HOUR.md 5)

**1. The folk name the next step:** built in `src/npc/talks.js` (mine, on claude/espada-lore). Saggar's and Pip's `again` lines end with
the first undone goal on `game.goals.list()`. Saggar names the workshop's steps (sr1 the Shrine, fk1 the folk, sk12 the atrium rail, br1
ten pots). Pip names the basement's and the Dunes' (tc1 the hub's chest, pl6, jl1, sf1, an1 the rod, cx3 a lap). Each sends you
to the other for the rest. Off the path (any other goal) they say nothing extra.

**2. The rulings** (yours to paste; the strings are on your branch only):
- **The STORY mode line** (tracking/place.js): "You wake in the workshop, beside a Shrine. Rest there first. Type /goals to see your
  first three goals." (The thing to do comes before the command.)
- **"Your first 3 goals are set. Type /goals to see them."** Kept.
- **"Next goal: X."** Make it "Next goal: X. Type /goals for all three." ("see it" pointed at one, and the list shows three.)
- **The pool's first empty** (tracking.js): "Your pool is empty. It fills again on its own once you stop spending: 3.5 a second,
  starting 2.2 real seconds after." Every later time: "Your pool is empty." (Say "pool", the glossary's word for the store, rather than
  "Lachryma used up", and name the clock.)
- **The unlearned art:** "You have not learned X yet. <hint> (n of N ...)" Kept; it is plain and says what to do.
- **sr1 "Catch Your Breath":** kept. **sk12 "A View" → "Lookout"** (the spot and the act in one word; "A View" read unfinished).

Delete this note when applied.
