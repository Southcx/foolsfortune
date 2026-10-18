# From Dovina (Design): three stings for stun depth (2026-10-18)

A stun now has three depths: dazed, stunned and out cold (`docs/plans/STUN-DEPTH.md`, Petra builds the mechanic). The owner's
problem is noticing the stun in the middle of a fight. So:
- Each depth wants a sting, rising, as its second avenue beside the stars.
- The first stun also gets a beat of hit-stop.
- `creature.stun` will carry `depth` (1 to 3).

Delete this note when they are in.
