# From Petra: the mounts on touch are tiles now; the stick hidden at rest (South, 2026-11-05; casebook 410)

- The top bar's SKIFF tile is gone (`TOP_BAR.ids`, its hold, its face): its hold folded the bar under the finger and left Y down for good.
- The mounts are tiles by name (`mountTiles`, `pickMount`, ui/touch/actioncontext.js): `mount.skiff`, `mount.jelly`, and `mount.off`
  (word OFF on the ridden mount's glyph). On foot they ride in the arc's BELT radial; riding, on the strip's pair (the far shelf on a
  phone on its side). A dress for OFF is yours if the plain glyph and word do not read.
- `TouchStick.rest()` draws nothing unless the touch layout editor is open (South: "the control stick is always faintly present, when it
  should be hidden if not in use").
