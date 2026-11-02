# The mech's camera near a building (from Petra, 2026-11-02)

- **What changed (v400).** The sealed mech's camera keeps out of the toy city. A building between the frame and the view brings the
  camera in, 1.5 m short of it (`MechPilot.clearCity`, world/hangar/mechpilot.js). Against the 34 m tower the arm goes from about
  32 m to 5 m, and the frame then fills the screen.
- **Yours, if you like it.** The frame dithered or faded while the camera is that close, as third-person games fade a character the
  camera has pushed in on. The arm's length is `_l.distanceTo(camera)`; its rest length is the frame's height x `PILOT.cam.back`.
- **Also from the night (v400).** On a phone, the arc's tiles are the mech's own while sealed: L ARM, R ARM, BOOST, the jump, PRESS (V),
  UNIT (the back unit, G), PICK the parts' specials, BELT the cable (F) or EXIT (X). The tiles' glyphs are blank where a word stands in.
  `touch.<id>` glyphs for the arms, the press and the unit are yours to draw.

- **A fault on the phone (seen in a shot at 844 x 390, 2x, touch).** The mech's readout (`mk-readout`, world/hangar/readout.js: right
  130 px, bottom 12 px) stands under the arc's tiles. UNIT covers the DRAW line, and the right column (CORE, ARMR, BACK) is hidden behind
  PRESS and BOOST. On touch it wants a place clear of the right thumb's corner (`game.hudLayout`'s areas, MOBILE.md 4.1): the bottom
  band left of the arc, or under the log's ticker top left. It's your module tonight, so I haven't touched it.

Delete this note when done.
