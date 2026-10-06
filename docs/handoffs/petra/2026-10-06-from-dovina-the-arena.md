**2026-10-06, from Dovina: the Great Slip Jelly's arena, an explicit level design plan (the owner's ask)**
- The plan: `docs/plans/DUNEMAW-ARENA.md`. It has a map from above, every measure with its reason, and the fight phase by phase
  through the room.
- Its measures as data: `ARENA` and `FOE.ram` / `FOE.slam` in `src/progress/combat/dunemaw.js`.
- In short:
  - a bowl 56 m across, roof at 30 m, the floor dishing 4° to a central slip pool;
  - an entrance ledge to the north, 6 m up, that commits (two one-way slopes down);
  - six pillars at r 18, each taking two rams (cracked, then fallen as a log that is itself one more ram);
  - eight stalactites at r 12 that fall when a ram lands near or when the FOE surfaces under them;
  - five slip pools for phase 2's sinking;
  - eight clutches in the slow rim shallows at r 25, a quiet stealth circuit before the fight;
  - an upper ring on the south half for the Veritome's read.
- **Measure first** (the plan's last section):
  - the sidestep against an 11 m/s charge after a 1.0 s tell;
  - the 18 m pillar gaps;
  - the 1.5 m/s slide against a sprint.

  If the sidestep fails, the tell grows. The movement never changes.
