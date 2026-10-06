**2026-10-06, from Petra: the arena's three measures (docs/plans/DUNEMAW-ARENA.md, "Things to measure first", at ea7d16a)**

Method: the Courier driven headless in the game (seed 1, the oasis flat, level open sand, from a standstill), one sample a tick, with
three escapes: a side sprint (D and Shift), the roll (crouch, then Shift and D) and a jump with the air dash (Space, then Shift and D). Those
measured paths were then played against your ram (`FOE.ram`: 11 m/s, 24 m, turning 20 degrees a sim second) in a small simulation, from 6 m.
The FOE's body is a circle; its half-width is not in `FOE` yet, so each result is given as the largest half-width it clears (the Courier's own
0.35 m taken off). Nothing here changes the movement.

**Measured, metres from the start (0.25 / 0.5 / 0.75 / 1.0 sim s):**
- side sprint: 1.24 / 2.77 / 4.30 / 5.83 (6.1 m/s once up to speed: `strafeSprintMult` 0.9)
- roll: 1.81 / 3.58 / 4.85 / 5.90 (it also has 0.32 s of i-frames, not counted below)
- jump and air dash: 2.62 / 5.78 / 8.79 / 11.55 (costs 12 Lachryma)
- forward sprint: 1.33 / 3.03 / 4.73 / 6.43

**1. The sidestep: it depends on when the ram takes its aim.** The plan says it "charges straight at where the Courier stood". Measured both ways:
- **Aim taken when the charge starts** (after the 1.0 s scrape): from 6 m the Courier has 0.55 s. Reacting 0.25 s into the charge (a quick
  human), the side sprint clears a half-width of 0.79 m, the roll 1.25 m, the jump and dash 1.56 m. Reacting at 0.35 s: 0.31 / 0.61 /
  0.73 m. A crowned Great Slip Jelly is wider than that, so **this fails**: from 6 m it is a hit unless the reaction is near zero.
- **Aim taken when the scrape begins:** the Courier moves on the scrape. Reacting 0.75 s into the 1.0 s scrape, the side sprint still clears
  3.29 m, the roll 3.95 m, the jump and dash 5.75 m; reacting at 0.25 s, 6 m or more. **This passes** with room to spare, by about the
  0.4 s you expected.
- Proposed: the aim is taken when the scrape begins (or at most halfway through it), and the turn of 20 degrees a second stays. The
  movement does not change; your rule ("if it fails, the tell grows") is met by when the aim is taken, without growing the tell. Your call.

**2. The pillars:** two at r 18 and 60 degrees apart are 18.0 m centre to centre and 15.0 m stone to stone (3 m wide). A charge down the
middle misses both while the FOE's half-width is under 7.5 m (computed, not run). It holds.

**3. The slide:** the forward sprint is 6.4 m/s at 1 sim s (6.8 once at speed), so against 1.5 m/s the Courier still climbs at about
5.3 m/s, and walking (4.2) at 2.7. One edge: aiming (`adsSpeedMult` 0.55) walks at 2.3, which nets 0.8 m/s against 1.5. It is escapable
(stop aiming and run), never a trap. The 4 degrees of the dish is not measured: the bowl does not exist yet. These are arithmetic on the
measured sprint, not a run on a sliding floor; the slide field is not built.

What I still need from you: the FOE's half-width (the body, crown included), so the ram's test runs against a real number.
