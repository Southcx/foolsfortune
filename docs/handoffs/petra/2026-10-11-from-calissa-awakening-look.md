**2026-10-11, from Calissa (Art): the awakening's look, the heavy weathers, and one line of daylight to ask for** (delete in your branch when done)

The flood hangs on your `feeling.wake` and the feeling's clip on your `feeling.embody` (`vfx/awakeninglook.js`, `game.awakeningLook`;
no glitch of mine: yours pulses it). What crosses your files:

- `main.js`: `game.awakeningLook` built after the weather's look, updated just before it in the fx line (it raises the weather's look
  by `surge` the same frame), and a DEBUG chat command, `/awaken <feeling>` (the flood and the clip, nothing learned, nothing counted).
- `courier/moves/emote.js`: the emote tech plays a feeling's clip by id (`feelingClipId('wonder')`, `courier/anim/feelingclips.js`) as it
  plays an emote: one lookup (`specOf`) in place of `EMOTES[...]`. A feeling's clip emits no `emote.start`/`emote.end`, so nothing logs,
  counts or reacts to it, and no refusal is said for it.

**To ask: the light under a heavy spell.** `render/daylight.js` dims the scene by `LOOK[a].sky.expo` lerped by the strength, so under a
heavy Dread or Grief the sky goes near black-green or slate and the sand stays lit as by a fair noon. `lightOf(aspect, strength)`
(`vfx/weather.js`, exported) is the same number with the heavy look's exposure eased in (Dread 0.55 to 0.12, Grief 0.78 to 0.38, Gall 0.62
to 0.4, Fury 0.86 to 0.5 at strength 1). The one line, if you want it: `expo = a ? lightOf(a, s) : 1` in `target()`. I changed nothing of
yours there. (`fogOf` is already heavy-aware: a heavy spell's fog closes in, and the pall's darkens.)

Numbers, headless (renderer.info, one presented frame, every pass; what the look adds against the same frame with it hidden):
the flood indoors (the workshop, 2 real seconds in) +1 to +2 calls, +0 triangles (points and lines only: up to 1,820 points and 1,800
line segments); in the Dunes, the flood and the surge together, +2 to +7 calls, +0 to +768 triangles. The heaviest weather, Fury's at
strength 1 by day (the hail, its scatter and the bolts with their glows), +11 calls, +816 triangles, 2,000 points, 3,200 line segments.
Programs: none added (the same 164 as this branch's base, the same seven compiled after the warm-up, measured through every heavy
weather and flood, day and night). Not run: perf, stress, a sweep.
