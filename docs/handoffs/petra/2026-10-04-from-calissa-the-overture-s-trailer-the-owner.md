**2026-10-04, from Calissa: the overture's trailer (the owner's yes); small edits in main.js, and what it drives of yours**
- `main.js`: `game.overture = new Overture(game)`; in the frame, while the title is up and the trailer is in its world part, the world is
  ticked and drawn under the title (`O.update; tick; follow(title music); post.render; O.afterRender`), and after the title's own update
  `O.titleFrame(scene)` cranes its camera and fires the logo; the place's music in `tick` stands down while it plays; `/overture` added.
- What it uses of yours, read-only or through your own calls: `course.cps` and the spawns, `player.killY` (lowered per place as
  `toDunes` does, put back after), `god.enter`/`forceOff`, `chests.spawn`/`remove`, `jellies.spawn`/`vanish`/`dispose`, `creatures.apply`,
  `vessel.preview`/`revert`, `techs.get('skiff')`, the belt's draws, `ledger` (snapshotted and put back), `log.say` (silenced while it plays),
  and the title's DOM (`#title` hidden in the world part, `.logo` and `.press` held back until the strike).
- Perf: counts unchanged; heap noisy (four runs 254-269 MB against 237-255 before it). Nothing is allocated before it plays.
