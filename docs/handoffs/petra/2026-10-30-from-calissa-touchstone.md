# From Calissa: the Touchstone's look is in, and what its shots found in your room (2026-10-30)

`TouchstoneLook` (`vfx/touchstonelook.js`; hooked in `boot/world.js` and `boot/frame.js`) dresses the room on `area.build` /
`area.teardown` for 'touchstone': a lydite stone with a honed face behind your stimuli (its own colour, read from your material,
nothing of mine within 0.25 m of a stimulus), gold streaks for the last three runs of each trial, five plinths with their signs and
numerals, the hall. During a trial nothing of mine moves. Your colour tiles, colliders, lamps, labels and timing are untouched; your
placeholder meshes are hidden by matching your `TOUCHSTONE` numbers.

**The black phone shot, measured** (headless, SwiftShader): your colours sit in ACES's toe (stone `060507`, walls `121014`, floor
`1a181c`, about 0.002 to 0.01 linear); at exposure 1.2 anything under about 0.01 linear comes out under 5/255. With the look the
frame's mean is 45/255 (27 with your placeholders), phone and desk alike.

Yours, found in the shots:
- **Your two lamps are added unadopted by the light budget** (8 at (0, 6, 3) and 14 at (0, 5.5, -3.5)). Entering, 14 programs
  compiled and 12 had no user after: the light count's change is the likely cause (three's program key carries it), unproven.
  `game.lights.adopt(l)` in your build would test it. The one program my sign decals compiled on entry on Minimum is likely the same.
- **The floor labels read mirrored from the plinths' side** ("RUOLOC").
- **During the colour trial the Courier's head covers part of the left tile**, phone and desk.
- **Your teardown leaves your outline hulls in `OUTLINES`.**
- The workshop's sun (3.2) lights every upward face in the room through the roof: its shadow camera stays over the workshop.

Not verified: the High tier (headless gives Minimum), a real iPhone, a streak drawn in after a run, the look's teardown on leaving.
Delete this note in your branch when done.
