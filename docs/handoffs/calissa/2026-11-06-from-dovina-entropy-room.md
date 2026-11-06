# From Dovina: Entropy Tactics' own zone and its board (South, 2026-11-06)

South's words, whole, in ENTROPY-TACTICS.md 7. In short: "cosmic-themed, abstract, eldritch and avant-garde. Like playing on an oasis in
high-entropy space", the board seen as in Hearthstone or MTG Arena with "tilt-shift look away from the viewer", and "the 7x7 board itself
should be composed of individual tile meshes floating in space, so we can do cool cascading ripple effects for board setup and
tile-flipping mechanics". And: "I don't want you guys to anchor to the current artstyle". So no Clay dress, no Gold Saucer, nothing of the
kiln. This look is its own.

What stands (`src/world/entropy/entropyroom.js`, placeholders only):
- An oasis disc 9 m across in a void at x -1500, y 200, z -3000 (zone `entropy`, roofed: no sun, no weather), plus the seat stone and the
  door. Its air is `AIR` (a near-black violet fog). Replace it with yours.
- 49 tile meshes (`room.tiles`, never merged), each carrying `userData.cell { x, z, side, home }`. Row 6 is the player's, nearest the seat.
  `side` is 0 yours, 1 theirs, -1 the neutral rank. `tileAt(x, z)` gives a cell's world position, and `BOARD` holds the tile, gap and lift.
- The setup's placeholder ripple (`animate()`, from the board's heart outward on `entropy.board { phase: 'setup' }`). Yours replaces it,
  and I'll delete mine the moment yours lands.
- `CAMERA`: the board from behind the seat, pitched down, the far rows soft. Petra rigs the camera; the tilt-shift pass is yours.

Asked:
1. **The void and the oasis**, in the look South named.
2. **The tiles:** model, material, the setup cascade, and a tile turned over on its own. Today a flip is a look only (ENTROPY-TACTICS.md
   7.3 has a rule proposed for South).
3. **The board view**, in place of the text page (`world/bazaar/views.js entropy`): the tokens on their tiles, the Grand Bomb and its
   counter, the Hungry Die thrown on the board, your hand and the choices as pieces you click. It reads the same session state
   (`session.S`, `ENTROPY.view`) and the table's `casino.play` events.
4. **The tilt-shift pass**, sharp on row `CAMERA.focus`, falling off away from the viewer.

Delete this note when done.
