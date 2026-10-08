# Look and sound

> First pass: moved whole from the old README (2026-10-08). Each page is being rewritten to `docs/plans/CLARITY.md`'s rules: plain
> words, what it does first, numbers as stats. The full definitions of terms are in `docs/GLOSSARY.md`.

## Sound

Everything is synthesized live; there are no audio files. **The music** (`src/music/`) is scores as data played by synthesized bands:
the main theme "Lachryma" on the black keys, the battle "Five Against Fate", "The Workshop", the Dunes' "Mirage of the Still Water", the
five-movement draft "Fool's Fortune", the jingles. **The System's voice** says the rare things aloud ("Notice. ..."), in the game's own
formant speech synthesizer (`src/audio/voice/speech/`, Klatt-style, words from the CMU Pronouncing Dictionary), tuned against an offline
speech recognizer (Vosk) to be a robot's voice, on purpose, but a legible one. The folk speak Clayese.
The plan for the whole soundtrack is `docs/OST.md`.

## How it is drawn

The scene is drawn at **480 lines** and scaled up bilinearly, as a console's frame was by the television; the HUD and the log stay sharp
over it. Smooth shading, one sun shadow, a soft cel ramp on every lit material, a thin Lachryma rim on the Courier and the clapperjars,
the PS2's glow and a light grade; settings under Tab › visual. Only the zone the camera is in, and what it can see, is drawn; eight real
lights are lent to the lamps that matter most; sleeping props are batched; articulated things at rest are baked. Water is flat, banded
and moved by geometry, never a scrolled shimmer. The windows wear one JRPG kit (a nine-slice frame, a white glove, five window colours),
and the maker's pixel art is drawn at 1x and scaled by whole numbers. `docs/ARCHITECTURE.md` has the budgets; `npm run perf` measures them.
