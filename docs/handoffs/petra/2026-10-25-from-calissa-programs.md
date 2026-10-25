# From Calissa: the program audit's asks in your files (2026-10-25)

The owner asked for the shader programs to be audited and the redundant ones combined or culled, lean for mobile. The census is
`scripts/programcensus.mjs`. It walks every program over perf's route and attributes it to its materials and their makers, with the
shader bodies hashed so near-duplicates group.

Measured on f3185e18:
- 212 programs, 192 of them at boot.
- 149 distinct shader bodies.
- 133 bodies used by one program only.

My folds are on claude/calissa-art-cups. Numbers after the second census are in my report to the owner.

Five asks are in your files. Each is a program or a boot compile, and none changes a look.

1. **Outline keys** (`render/outline.js`):
   - 'outline', 'glow-outline' and 'glow-xray' are one patch (the smooth-normal push, a plain MeshBasic fragment). Blending, depthFunc,
     side and opacity are not program parameters, so one key would serve all three. Up to 2 programs.
   - Callers: world/trial.js:43,46 and vfx/flarereveal.js:22.
   - 'outline-fphide' and the rig's 'fphide-rig' carry their own geometry patches and stay.
2. **The ricochet's preview line** (`tools/psygun/specials.js:50`):
   - It is the only LineDashedMaterial in the game, so it compiles one program for itself.
   - Fix: give it LineSegments with the dashes laid as segment pairs in `updatePreview`, drawn in a LineBasicMaterial.
   - Lines now share MeshBasicMaterial's programs (`vfx/programkeys.js`), so that is 1 program fewer.
3. **The Dunes' terrain** (`world/dunes/dunes.js:170`):
   - It is 99 KB of Standard GLSL, the largest single program after the Courier's.
   - Its patch writes colour and the ripple normal only, never roughness. It is rough 0.92 with metal 0.
   - Lambert through `vfx/matte.js` keeps the look, at half the GLSL and 0.5 to 0.7 of the lit cost a pixel. It is the biggest area on
     screen in the Dunes.
   - The one thing to eyeball is Standard's faint broad sheen at grazing sun (dawn, dusk).
   - It is not a program fewer: it is the cost of the most pixels.
   - I moved my own matte sands the same way: the Great Dunemaw's, the bowl's, the cave's stone and the ship's sails.
4. **Boot compiles for the rare** (your warm-up policy, a call for you):
   - Six caster looks are warmed at boot and seen seldom: lensing, time grade, portal, molten, heat haze and part crazing.
   - The aberrant look's four copies are warmed in vfx/databug.js, about 290 KB of GLSL.
   - On an iPhone XR each costs boot time.
   - The aberrant has the pull's 1.5 real s of notice before its duel, so `compileAsync` on `pull > 0` would hide it.
   - The caster looks could compile on first sight on Low and Minimum only.
   - Your call: hitch versus boot. I have not moved them.
5. **A per-pixel branch to watch** (not yours to fix, mine, for your perf eye):
   - `vfx/ribbonlight.js` carries 8 looks behind a `uRibbon` mode, and its 40-line slick branch ships in every jet ring, shine and paint
     reticle pixel.
   - That is the +127% shape.
   - If perf on a phone shows those rings, I will split the slick out: +1 program, less cost a pixel.

Delete this note in your branch when done.
