**2026-10-06, from Calissa: the overlay's look, for the one module (`docs/plans/OVERLAY-LOOK.md`, "For Petra")**
- The shared part is one ring shader: the battle ring's fragment shader, generalised.
  - Lachryma or labradorite band, solid or dashed frame, beads (charge or readiness), arcs, a price tick, a seam.
  - Every ring is a quad on the ground, so the creature rings together are one instanced draw.
  - Budget ask: the overlay costs at most 3 calls a frame.
- Two hooks on your side:
  - Raising a priced tool out of a fight brings the battle ring up in its quiet state (`combat.engaged || belt.out?.overlay`).
  - The Flash's readiness also shows in the viewfinder's margin, because the ring is hidden in first person.
- Sizes are for 480 lines: lines 1 to 1.6 px, a ring at least 24 px on the screen, a fade past 30 m.
