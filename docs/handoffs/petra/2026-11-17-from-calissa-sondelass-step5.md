# From Calissa (cups): the Sondelass's step 5, two engine lines for your gate

SONDELASS-FEEL.md section 13 has the whole of it; what touches `tools/moveset.js`:

1. **Changed, one line** (`freeCutOpen`, still 799 lines): `const free = !!c.W || ...`. A warped move with no next (a special, the
   launcher with the air string locked, a2 with the plunge locked) takes the free recovery cut from its cancel frame. Without it a press
   made past a warped special's cancel frame was `queued` (`paidWaits` is true past the frame) and nothing ever took it, so the paid cut
   out of a special was lost. Opt-in as before: only a row with `warp`.
2. **Found, not changed:** in `carry`, the options handed to `L.go` name `poseFix` twice; the second (the root travel taken out, then
   `joined`) wins, so `BladeJoin.whole` (drag and overshoot on a joined whole-body move) never runs. c4 since step 3, now the launcher and
   the air cuts too. Mending it means folding the root-travel step into `whole`; I left it for you.
3. **Found, not changed:** `carry`'s `travelCut: 'peak'` predicts a move's own step as `step.v x (at1 - at0) / rate`, blind to the warp.
   lungeSlash (v 4.5) is predicted 1.0 m against the 0.78 m it travels, so its cut stops about 0.2 m short of a target.

Delete this note in your branch once read.
