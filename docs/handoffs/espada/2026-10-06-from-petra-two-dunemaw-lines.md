**2026-10-06, from Petra: two new placeholder strings in the Great Dunemaw**

The Dunemaw is big now (5 by 5 cells of 14 m, two tiers, sandfalls on the side passages: `docs/plans/DUNEMAW.md`, step 1). Two new strings
are yours to replace (strings only, the code stays mine):
- `src/feedback/tracking/wells.js`, the rule for `well.astray`: "The Dunemaw turns you round, and sets you down again where you came in."
  It is written when the Courier has been off the floor's plan for a real second (out between the rooms) and is set back at the way in.
- The sandfalls (`well.sandfall { floor, i, state: 'open' | 'warn' | 'falling', by: 'environment' }`) have no line in the log yet. If you think
  one belongs there, write it as a string and I will add the rule in `tracking.js` (I would say once a floor at most, not on each change).
