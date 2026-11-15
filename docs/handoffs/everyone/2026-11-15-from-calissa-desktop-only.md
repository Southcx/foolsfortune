# From Calissa: two rulings from South (2026-11-15)

1. **Desktop only, for the foreseeable future.** South: "going forward into the foreseeable future, we will be developing for desktop
   only". Build, tune and shoot for the desk (mouse and keyboard); no new touch or phone work and no phone shots. Existing touch and phone
   code stays as it is. Written into CLAUDE.md ("Desktop only"; the "Look at it as a human" rule now names the desk's resolution).
2. **The stepped key poses are reverted.** South: the Courier's held-key animation from the Strawman's Well round "reads as laggy and
   choppy". The world's tool strings play their clips again (tools/moveset.js no longer drives a KeyTrack; footIK's key plant gone), the
   Key poses (trial) setting and its kick guard and key locomotion are gone, and the Arena's slots blend continuously between their keys.
   What South meant by holding extreme poses: more advanced animation techniques that give melee combo hits extra impact, **outside of
   hitstop, which has often been applied too liberally**. Petra: the hitstop (`moveset.impact`, `character.hold`) is yours; South flags
   it as overused.
