# Look and sound

The game looks and sounds like a game from the PlayStation 2 era, on purpose. The picture is soft and low-resolution, and every sound is
made live by the game. This page says what you will see and hear, and which settings change it.

## How it looks

The scene is drawn at **480 lines** and stretched up to your window with a soft filter, the way a television stretched a console's
picture. The log, the HUD and the windows stay sharp on top.

| Part of the look | What it is |
| --- | --- |
| Resolution | 480 lines by default. You can pick 540, 720 or native |
| Upscale | soft (bilinear) by default, or hard pixels |
| Shading | smooth, with a soft cel ramp on lit surfaces |
| Shadows | one sun shadow, at 1024 pixels |
| Outline | a thin Lachryma rim on you and the clapperjars |
| Glow | a PS2-style bloom (45% by default; 0 turns it off) |
| Colour grade | shadows lean indigo, light leans warm like the kiln |
| Glitch | the data shows through at big moments. Short, and set off by an event. Turn it off with the setting `visual.glitch` |
| Water | flat, banded and moved by shapes, never a scrolled shimmer |
| Weather | streaks, motes, halos, auroras and rainbows, only where the sky is open |

The look never flickers or crawls because of a bug. Liquids may shimmer. Marks in the world (glyphs, the interact chevron, the lock-on
reticle) sit on the thing and carry no words.

### Settings

Press **Tab** for the tuning panel. The look's settings are under `visual`:

| Setting | Choices |
| --- | --- |
| `visual.resolution` | 480 lines, 540, 720, native |
| `visual.upscale` | bilinear, pixel |
| `visual.toon` | 0 to 1 |
| `visual.glow` | 0 to 1.5 |
| `visual.grade` | 0 to 1 |
| `visual.glitch` | on, off |

### How it stays fast

Only the room the camera is in, and what it can see, is drawn. Eight real lights are lent to the lamps that matter most. Props that are
asleep are drawn in batches, and models that mostly rest are baked. `npm run perf` measures a frame.

### The windows

The windows wear one JRPG kit: a nine-slice frame, a white glove pointer and five window colours. The maker's pixel art is drawn at one
pixel to one pixel, then scaled by whole numbers.

## How it sounds

There are no sound files. Everything is made live while you play.

| Part | What it is |
| --- | --- |
| The music | scores written as data and played by synthesized bands. Each place calls for a cue |
| The System's voice | says the rare things aloud ("Notice. ..."). A formant speech synthesizer, on purpose a robot's voice but a clear one |
| Clayese | the folk's voice of bells and clay |
| The ambience | the weather and game hour, heard where you stand |

The pieces you can hear, and where:

| Piece | Where it plays |
| --- | --- |
| "Lachryma" | the main theme, on the black keys |
| "Fortune Favours the Fool" | the title's opening cue, handing on to the title theme |
| "The Workshop" | the workshop (a work song in twelve-bar blues, 75 bpm) |
| "Mirage of the Still Water" | the Dunes |
| "Five Against Fate" | a fight, while something is after you |
| "Fool's Fortune" | a five-movement draft of the main theme |

Other cues exist for the Emocean's crossings, the garden and the Lockheart's Opening. The rhythm mode plays any track as a game on keys
**1 to 0**, begun from a stage in a room.

## For the divisions

- `docs/OST.md`: the plan for the whole soundtrack. `docs/ARCHITECTURE.md`: the render budgets. `docs/ART.md`: the look (colour, materials, the precepts, motion).
- `src/render/present.js` (resolution, upscale, shading, shadow), `toon.js`, `glow.js`, `zones.js`, `propbatch.js`, `restbake.js`.
- `src/vfx/` (`glitch.js`, `weather.js`, `sky.js`, the effect library); `src/ui/` (the kit and pixel art, `pixel.js`).
- `src/music/` (scores, `arranger.js`, `choose.js`, `soundtest.js`); `src/audio/` and `src/audio/voice/` (the synthesizer).
