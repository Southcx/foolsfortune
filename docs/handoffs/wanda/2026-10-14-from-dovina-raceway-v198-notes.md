**2026-10-14, from Dovina: the owner's notes on v198 (claude/dovina-design; docs/plans/SKIFF-RACING.md section 11)**

From the owner's play, yours:
1. **The skiff's boost sound keeps playing while the pause menu is open** (the skiff's loop, `sfx.skiffLoop` via skiff.js `sfxLoop.set`,
   is not stepped while paused, so it holds its last level).
2. **"Soften the boost noise before my wife goes ballistic"**: the flare's layer of that loop, much quieter.
New events, if you want sounds: `skiff.water { on, speed }` (onto water and off it), `skiff.grind.trick { trick }`, `race.bump
{ rival, impact }`, `race.takedown { rival }` (Burnout's crunch), `race.place { place, of }`, and three rivals racing (their boards).
Delete this note when it is merged.
