# Wave riding: the wave pool, surfing, wave riding's chop, the slope ride, the barrel

Calissa's build note for South's ask (2026-11-06): "expand the solar skiff racing module to encapsulate wave rider, snowboarding and
surfing mechanics, and especially the feeling of going through a wave barrel. Use performant and fancy techniques for wave rendering."
Plain names throughout (CLAUDE.md, "Plain names until settled"); lore names are Espada's once South calls it settled. Every new rule is
a **modifier** on the Solar Skiff's own ride (DESIGN.md 22, "base change bad, modifiers good"): off the water and off the slope, the board
rides exactly as before.

## 1. The water: one function, ridden and drawn

`src/world/raceway/surf/wavepool.js` is the one source of truth (pure numbers, as park.js): `wavePool()` gives the surface (`surfaceY`,
`normalAt`), the water's own velocity (`carry`), the wave's power (`push`), where you are on it (`frameAt`: s along the crest, d across
it, its zone), the barrel test (`barrelAt`: depth k, cover), the foam mask (`foamAt`) and the bed (`bedAt`). The look draws the same
surface on the GPU from `WAVEPOOL_GLSL` fed by `uniformsOf` (seven vec4s). Change one, change the other.

The model: a foil-driven pool (Surf Ranch), 600 x 150 m, the beach along v = 0, the machine's wall along v = W. Each pass raises one
solitary wave whose crest travels to the beach at cw = 7.5 m/s, oblique to the reef line so its break point peels down the pool at
c = 15 m/s (the board cruises at 24). Zones along the crest: the shoulder (unbroken, ahead), the pocket (just ahead of the break: the most
power), the barrel (26 m behind the break: the face standing, the lip thrown over it, `lipCurve`), the whitewater (the bore behind). The wave is Hokusai's
scale (South, 2026-11-06: "great wave of hokusai scale and roughness, probably about 3x magnitude"): 17 m to the crest and 34 m to the top of the curl, the tube a near
circle 34 m across (one ellipse about (F, H): the face its lower quarter, the lip the rest, landing ahead of and outside the rider; South,
2026-11-06 night: "the bore ... isn't anywhere close to a cylinder"), the tube 60 m long, its crest clawing into fingers of foam (vfx/waves/lip.js). A
pass runs about 45 real s, then a 16 s lull of swell; the next pass peels the other way. Between and beyond, the swell (sharpened sines,
bigger toward the deep wall) is wave riding's chop.

## 2. Riding it (the surf ride; `courier/skiff/surf.js`)

- **On the water the speed is relative to it**: the water on the wave moves with the wave (`carry`), so a board held on the face is
  carried. The board's own slope code does the drop: on the pool the ride's normal is the wave's (`raceway.waterNormal`), no longer UP.
- **The pocket's push**: the wave's power along the crest toward the shoulder, strongest just ahead of the break, on the face.
- **The pump**: the sail furled, W pressed in rhythm on a steep face (each press in its window after the last) gives a push scaled by the
  face's steepness (Surf World Series, Barton Lynch: "use the wave's power"). Off the wave W is the sail again.
- **Turns read as tricks**: a bottom turn (a hard carve in the trough converting the drop into a climb), a top turn or snap (redirected
  at the lip, spray thrown), a cutback (turned back toward the pocket), a floater (ridden over the falling lip); each a link in the trick
  combo. An air: off the lip with the vertical speed it has.
- **The barrel**: S held is the stall (a hand dragged in the face: the board slows and falls back under the lip). Covered (`cover`), the
  tube's clock runs and a balance needle (Treyarch's Kelly Slater game's, 2002) wobbles with how far you are off the ideal height and line and how
  near the foam ball is; A / D hold it. Out of the mouth with the spit = made (a push, the combo's big link). Too high under the lip: it
  lands on you (a wipeout, the bail's `lip`). Too deep: the foam ball takes you (`closeout`).
- **Wave riding's chop** (Wave Race 64's): the swell's crests launch the board; a trick off a crest gives a little push (Mario Kart);
  landing nose down at speed, or S held as you land, dives the board under (the submarine) and it bursts out with a push; buoys passed on
  their side fill a meter that a miss resets.

## 3. The slope ride (`courier/skiff/sloperide.js`)

The sail furled on a downslope, the board rides as a snowboard: A / D set the edge (turn radius from the sidecut over the edge's sine);
past the grip's limit it skids (spray, speed lost); W / S at low speed butter (a nose or tail press, pivoting); A / D held while the hop
charges pre-winds the spin; a landing is graded clean / sketchy / bail by its yaw and pitch off the slope. The park gains **the slope**, a
long steep dune face with rollers and a kicker line (`world/raceway/surf/slope.js`), reached up its gentle back with the sail.

## 4. The barrel's feel (`courier/skiff/barrelcam.js`, `vfx/waves/barrelscreen.js`)

A camera modifier only, reverting exactly on exit: the camera dropped low and pulled toward the open side, looking down the tube at the
mouth, the lip arcing over the top third of the frame; FOV up 8 to 15 degrees over 0.4 real s; a short ease of game time as the lip
passes over (if the house has one); the vignette tinted by the light through the lip and tightened with depth; the spit bursting past the
camera with lens drops, then the frame clearing. Sound (Wanda's, placeholders asked): the world low-passed, the music ducked, a roar rising
with depth, the spit's hiss.

## 5. The look (`vfx/waves/`)

- The pool's water: a grid dense round the break point (moved with it) and coarse elsewhere, displaced by `WAVEPOOL_GLSL`; the bed is
  analytic, so the depth colour is Beer-Lambert on the water's own column (no depth texture); Fresnel to the sky; the swell's crests and
  the wave's face thinned toward the crest for translucency.
- The lip: a strip swept along the crest from the break point back through the tube, its cross-section `lipCurve` (Horizon Forbidden
  West's baked cross-section swept along the wavefront, done here as a function); its inside lit by light through the lip (DICE's
  translucency approximation, thickness from the curve's parameter), its edge feathering into spray.
- The fingers: the lip's strip run on past its tip, cut by a fractal mask along the crest (Hokusai's claws); the face streaked with foam
  bands down its fall line and roughened (water.js).
- The waterline ripple (`vfx/watercontact.js`): a foam line and rings round the Courier and the hull wherever they cut any liquid.
- Foam: cartoon, thresholded scrolling noise against the `foamAt` mask (Wind Waker, Sea of Thieves): the whitewater bore, the lip's
  landing line, the trail behind the board.
- Spray: two-tone opaque blobs that shrink out (Breath of the Wild, Sonic Riders): the lip's sheet, the rail's spray on a carve, the
  foam ball's churn, the spit's cone; sand spray on the slope.
- The machine: the foil's car on its rail along the deep wall, the pool's coping, the beach; in the Raceway's clay and gold.

Desk first; a phone gets the same look on a coarser grid and fewer particles (`machine.mobile`), never a simpler shader by default.

## Prior art (sourced in the research pass, 2026-11-06)

Treyarch's Kelly Slater game, 2002 (the tube's balance meter), TransWorld Surf (tube time as a goal), Surf World Series and Barton Lynch Pro
Surfing (pump, pocket, foam ball, the spit), Wave Race 64 (buoys fill a meter, a miss resets it; water's momentum), Riptide GP (readable,
deterministic swell), SSX Tricky (tricks fill boost, repeats score less), Shaun White Snowboarding and the sidecut model (edge carving),
Alto's Odyssey (landing angle), Horizon Forbidden West's SIGGRAPH 2022 water talk (one cross-section swept along the wavefront, the peel
as a rising phase), GPU Gems ch. 1 (sums of sines, Gerstner), Tessendorf and the Jacobian foam, DICE's GDC 2011 translucency, Sea of
Thieves' SIGGRAPH 2018 talk (foam at peaks, the peak-mask subsurface), Wind Waker (crisp line foam).
