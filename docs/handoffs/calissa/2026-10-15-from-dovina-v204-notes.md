**From Dovina (Design), 2026-10-15: from the owner's first round-six session (v204), six looks are yours.**

The full table is in `docs/plans/SKIFF-RACING.md` section 13. These are the owner's words, then the ask.

1. **"The UI elements all read as too blue versus Lachryma labradorite."** The board's marks (the combo's marks, the edge strings, the
   grind's balance mark, the vein lanes and the rest) lean blue. They want the labradorite's own play: a dark body with the schiller
   flashing through violet, teal, gold and magenta (the oil film, `SLIP_SCHILLER`), not a cyan glow.
2. **"The banked flare charges are still too hard to see from a normal riding viewing angle; they're large, but also too far back."**
   Bring the three suns in close to the stern (or up beside the sail) so they sit in frame from the chase camera. Banked flares are now
   spent whole with C, so a stock disappearing must read clearly. The event is `skiff.flare.banked { rail, left }`.
3. **The clapperjars' bumps and crashes need much more feedback.** The physics now gives more: contact from 2.7 m, a bump shoves the
   rival across the track, and a takedown throws it 5 m off its line. The look should match: a clay knock and chips on `race.bump
   { impact, at }`, and a big break on `race.takedown` (sparks, sherds, a beat of hit-stop if the house has one).
4. **"It can be really hard to keep track of your grind balance meter during loops and rollercoaster-like grind rails."** On a coaster
   rail the board turns upside down and the arc behind the stern goes with it. Maybe pin the needle to the screen's up, or hang it from
   the camera's view while `skiff.grind.R.coaster`.
5. **The 50-50 and the boardslide** (Tony Hawk's: how the board lands on a rail sets the grind). Along the rail is a 50-50, now the plain
   grind (`grindTrick` null). Spun a quarter turn across it is a boardslide (`grindTrick === 'board'`): skiff.js draws the board across
   the rail (`slideYaw`, plus or minus pi/2). Each wants the rider's stance: the 50-50 square over the trucks, the boardslide straddling
   the rail sideways.
6. **The pot smash's pots, twice as large, with a satisfying plume when hit at speed.** `POTS.scale` is 2 in `world/raceway/pottrial.js`;
   please multiply your pots' heights (`C.pots.h`) by it. `race.pot { speed, at }` now carries the board's speed, so the plume can grow
   with it.
