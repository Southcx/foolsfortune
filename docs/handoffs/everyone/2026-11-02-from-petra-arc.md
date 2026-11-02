# From Petra: the arc is in, on foot and a tool drawn (2026-11-02)

Built on Dovina's `TOUCH_ARC` (`ui/touch/arc.js`, `ui/touch/radial.js`; TOUCH-REBUILD.md 3.1, 3.4, 7):
- **Placement from cells.** Measured at 896 x 414, every tile stands where 3.1.1's table says (A 776,294 at 104 px; F 664,238). An empty
  cell stays empty.
- **Faces** as the cluster read them: USE named, FIRE / AIM in the tool's words, BLINK on DASH, the art's glyph on F.
  - F's word shows only if it is 6 letters or fewer; a longer art name fell to about 9 px in one cell.
- **PICK**: a tap is the next pick, a hold is the radial.
  - The radial holds the tool's picks plus its third verb, which had no slot: SHELL, LOCK, PING, REPROGRAM, SURVEY.
  - The Crucibelle's notes open as a radial that stays open while played.
- **BELT**: a tap is DRAW / STOW; a hold is SWAP, the lend, the Solar Skiff and the art.
- **The fold** (default FOLDED): F is a stack.
  - A tap is the art, cast on the lift so that a pull doesn't cast it.
  - A pull down cascades the column out. It folds back after a choice, or after 3 real s untouched.
  - Each cascade and refold emits `touch.fold { state, tiles, by }`.
- **The setting** `touch.controls` (FOLDED, SHOWN, HIDDEN), kept across builds.
- **The top bar's fold tile** (`top.fold`, glyph `more` for now): it folds the whole arc to one stack in A's cell. Under HIDDEN it stands
  faint and brings the arc back.
- **One radial for all**: the strip's CHAMBER and FORM radial now use the same `openRadial`.
  - Past five choices it lays two rings, fanned from left to up-left of PICK.
  - Measured with the psygun's eight choices: nothing overlaps a tile or another choice, and the leftmost edge is x 487.
- **Retired where the arc holds the moment**: the cluster, the far shelf, its ⋯ fold and the near shelf.

Still on the old cluster until South has played these: the Arena, the Solar Skiff, the crossing, the helm, carrying and pushing (`arcContext`
is null there).

Verified: the stress test 0 violations, the touch sweep 10/0, `npm run check` OK, page errors none. Headless phone probe (DEBUG save):
- the fold pulled open;
- BELT drew the psygun;
- A fired a shot;
- PICK's hold opened all eight.

Not verified: a real phone (South's), the layout editor (it still keeps the old cluster's slots).

Yours:
- **Calissa:** the arc's look.
  - The tiles on the grid in the Clay dress.
  - The stack's stepped rim: mine is a CSS placeholder, `.tt.arc-stack`.
  - A glyph for `top.fold`.
  - The radials' look.
  - The touch layout editor snapping to whole cells (3.1.1).
- **Dovina:** the next contexts' order, and two rulings:
  - On foot with nothing to use, A stays empty. Is that what you want, or should the kick take it?
  - With a tool drawn, USE has no slot (the double tap does it). Keep, or give it one?
- **Wanda:** `touch.fold` is live for the clack.
- **Espada:** the setting's three words and its line (placeholders in `core/settings.js` row `touchControls`).
