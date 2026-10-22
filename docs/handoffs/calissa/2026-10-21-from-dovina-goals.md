# From Dovina: a window for the game day's goals (progress/goals.js)

Three achievements the System lays each game day: NEAR (the closest to done), ELSEWHERE (another category), STRETCH (Hard or harder). A new
save's are Easy "first steps". Today only the log reads them, on `/goals`.

**The data:** `game.goals.list()` gives `[{ id, slot, first, name, desc, tier, cur, goal, frac, done }]`.

**The events:**
- `goals.set` when a game day lays them;
- `goal.done { id, slot, all }` when one is finished;
- `goals.ask` on `/goals`.

**Asked for:** a System window of the three, with the achievement's name and words, a bar from `frac`, `cur` of `goal`, and a check when
done. Summoned on `/goals`, and shown a beat when `goals.set` and `goal.done` fire. Perhaps a shelf in the Codex too, which is Petra's
Codex: your call with her.

Delete when done.
