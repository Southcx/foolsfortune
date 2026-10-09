# Round v132 from QAIS, routed, with the threshold hitch measured (from Dovina, 2026-10-09)

## The hitch at thresholds (R4, R5; the owner also feels it on the lap circuits)

The owner: a lag spike of the same length every time a threshold is crossed (the Throwing Room's door, the calibration room). Read
from the F4 diagnostics attached to R4 and R5 (Firefox 152, a GTX 980, 1003x480 drawn):

- **The big spikes are 316 to 363 ms with only 14 to 24 ms of CPU.** About 300 ms of each happens outside our JS: the GPU, the driver
  or the compositor. The same size every time is the owner's "same length".
  - R4 (the Throwing Room's door): 363, 334 and 320 ms (CPU 17, 14, 14), "nothing counted changed".
  - R5 (the calibration room): 316, 362 and 340 ms (CPU 20, 24, 18), **each with "+7 geometries; +1 textures"**. Something builds 7
    geometries and a texture on each crossing and uploads them. That is a leak as well as a stall: count it.
- **A second, smaller pattern:** 35 to 64 ms spikes about once a real second with 27 to 55 ms of CPU, mostly `sim` (18 to 43 ms).
  That is a periodic sim job, not the threshold. Headless, I measured the same periodic 7 to 12 ms CPU frames walking the room, away from
  any door.
- **Headless (SwiftShader) it does not reproduce.** CPU at the zone flip is 5 to 6.5 ms. No program, geometry or texture change, no
  shader compile and no light-count change. `zones.update` is 0.3 to 3 ms. The calibration room's door doesn't even change the zone
  (basement on both sides). So it is a GPU-side cost on the owner's machine, not the zone switch's JS.

Suspects, in order:
1. whatever creates the 7 geometries and 1 texture per crossing (R5);
2. a synchronous GPU readback or flush on the way in;
3. the first draw of the newly visible room's materials on Firefox (a driver-side compile three.js doesn't count);
4. the sun shadow pass changing its casters.

A Chrome run of the same crossing on the owner's machine would split driver from game.

## The rest
- **T10 (failed): Pip.** Talking to Pip sometimes brings up the pause menu while the dialogue is open. Probably the same family as
  T136's fix: a talk now frees the mouse, so the pointer-lock change may read as a pause.
- **T51 (failed again on v132): Strawman's guard** still does not block. The arms' pose is with Calissa.
- **R6 (wrong): the core movement.** The Courier stalls walking into a 0.25 m ledge instead of stepping up it; 0.4 and 0.5 m walls
  mantle. `/goto -16.3 -13.98 -0.3 6.29`.
- **Passed:** T136 (Esc ends a talk; your v132 fix) and T45.

Each report is marked "seen" in QAIS and taken by you. Delete this note when done.
