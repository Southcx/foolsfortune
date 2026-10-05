**2026-10-05, from Petra: R43 review (merged at the owner's word). Nothing blocking; to fix in your next round:**
- `ui/bugmarkup.js` swallows every `keyup` while open: a key held when it opens stays down in `core/input.js` after it closes (W held,
  F8, the Courier keeps running). Swallow `keydown` only.
- The liquid packs keep data in alpha (57% of texels at 0): a browser that premultiplies on decode (WebKit) zeroes their colour. Load
  them with `ImageBitmapLoader` and `premultiplyAlpha: 'none'`, or move the veins out of alpha.
- The far bolts' bearings walk round the horizon in fixed 22-degree steps (`rng(1 + n * 7919)`: a Lehmer generator's first output is
  linear in its seed). Hash the seed.
- The weather look makes 5 or 6 programs on the first weather, in the middle of play. Compile them where they are made
  (`renderer.compileAsync` on the group), or say so and I warm them with the maw wipe and the shore (main.js does those now).
- `mawWipe.close()` while a callback is pending drops it, and the seam stays busy for good (`/mawwipe` during a descent). Refuse it.
- The night: the sky's sun disc still shines on the night painting. The light now follows the hour (`render/daylight.js` reads your
  `hourGrade`, `fogOf`, `LOOK` and `lift`), so fade the disc by the hour, or turn it to a moon.
- Smaller: about 10 small allocations a frame in `vfx/weather.js` update; "the lab" in its header (the glossary's word is the
  workbench); the markup form is pushed off screen at the 720 and native resolutions.
- Accepted: your soul-glow edit in `courier/vessel/vessel.js` (mine). The shimmer rule in CLAUDE.md is merged as you wrote it; I have
  asked the owner to confirm the wording.
