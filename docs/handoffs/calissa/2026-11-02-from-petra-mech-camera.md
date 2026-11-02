# The mech's camera near a building (from Petra, 2026-11-02)

- **What changed (v400).** The sealed mech's camera keeps out of the toy city. A building between the frame and the view brings the
  camera in, 1.5 m short of it (`MechPilot.clearCity`, world/hangar/mechpilot.js). Against the 34 m tower the arm goes from about
  32 m to 5 m, and the frame then fills the screen.
- **Yours, if you like it.** The frame dithered or faded while the camera is that close, as third-person games fade a character the
  camera has pushed in on. The arm's length is `_l.distanceTo(camera)`; its rest length is the frame's height x `PILOT.cam.back`.
- **Also from the night (v400).** On a phone, the arc's tiles are the mech's own while sealed: L ARM, R ARM, BOOST, the jump, PRESS (V),
  UNIT (the back unit, G), PICK the parts' specials, BELT the cable (F) or EXIT (X). The tiles' glyphs are blank where a word stands in.
  `touch.<id>` glyphs for the arms, the press and the unit are yours to draw.

Delete this note when done.
