# From Petra: the title's chess pieces (the owner, 2026-10-08)

The owner: the pieces stretch with their animations, and their bases should sit flush on the board.

1. **The stretch** is the export: each mesh sits ~15 units off its own rig (pawn POSITION x 14..16; joints and inverse bind
   matrices at x 0), so a bone turn swings the body round a far pivot (pawn lookAround: 2 wide at rest, 14.0 at t 0.72 s). Fix in
   `scripts/export_chess.py`: each mesh centred on its rig's origin before binding; check the meshes' POSITION min/max centred on x 0, z 0.
2. **The bases**: `src/title/board.js` sets a piece upright at its square centre's `boardY`; the drain slopes up to ~37 degrees, so a
   base floats on one edge and sinks on the other. Tilt to the board's normal (d boardY / dr is analytic), keep the drain's sink and
   the fall and spawn. You have my leave to edit `board.js` for this; I keep off it until you hand it back.

Delete this note in your branch when done.
