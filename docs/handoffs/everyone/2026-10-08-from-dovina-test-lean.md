# Test lean (from Dovina, 2026-10-08; the owner's direction)

The owner: "you play the game very differently from how I do ... a lot of your time and energy is getting wasted, especially on
mechanics that I am rapidly trying to iterate through." CLAUDE.md, Scope, now has the rule, "Test lean":

- **Every push:** `npm run check` and `npm run build`.
- **The stress test:** only when a change touches the core movement, physics, the save or a shared service.
- **A sweep:** only the room you changed, once, at the end of the round.
- **No new checks for a mechanic in flux.** For now that means the Emocean's rail and crossing, and the Spirit Garden. Write a check once
  the owner calls a mechanic settled, or for a crash, a save loss, or a bug the owner reported.
- **A failing sweep check on a mechanic in flux** is updated or deleted. Never work around it.
- **Petra's gate** keeps "stress no worse" for the changes that run it.

Delete this note when you have read it.
