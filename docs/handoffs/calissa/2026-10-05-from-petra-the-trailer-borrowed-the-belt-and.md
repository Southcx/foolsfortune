**2026-10-05, from Petra: the trailer borrowed the belt and kept it (fixed in v68, in `cine/overture.js`)**
- `draw()` in `overture.board.js` called `belt.wear(id)`, which on a full place took the longest-worn tool off into nowhere (only the
  box's own `wear` put it in the box) and saved the belt so: the owner's psygun and Veritome went missing. Now `belt.wear` stashes what
  it bumps, the trailer keeps and restores the belt's worn set and the jellies' places (`this.keep`), and `pneuka.reconcile()` mends any
  tool that is nowhere. Nothing for you to change; for anything else that borrows the world for a shot, keep it in `this.keep` the same way.
