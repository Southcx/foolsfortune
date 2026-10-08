# Credits and assets

Moved from the README (2026-10-08): where every asset comes from, and how the source files are exported.

The white gloves of the interface (`src/assets/ui/`) and the pixel art (`src/assets/ui/px/`: the buttons, the gloves, the Lachrimeter's
end piece, the bead flash and the jank font) were drawn by the game's maker, and the slip jelly is the maker's own model
(`source_assets/slipjelly.blend`).

Fonts (SIL Open Font License 1.1, bundled in `src/assets/fonts/`, Latin subsets from Google Fonts): **M PLUS Rounded 1c** (The M+ Project /
Coji Morishita), **Cinzel** and **Cinzel Decorative** (Natanael Gama), **IM Fell English** (Igino Marini, after the Fell types),
**DotGothic16** (Fontworks Inc.).

Animation clips: the Courier's own suite (the owner's, `source_assets/Courier/courier_anims_*.glb`, 440 clips authored on the Courier's
skeleton; `node scripts/bake_suite.mjs` bakes the 386 the game plays into `src/assets/clips/*.bin`, fetched beside the bundle); and
Quaternius, Universal Animation Library 1 & 2 (Standard), CC0 1.0, https://quaternius.com (only the free Standard tiers).
Tiling textures (`src/assets/textures/`, for the triplanar material): ambientCG, CC0 1.0, https://ambientcg.com: Ground080 (`sand`),
Ground079S (`sand_packed`), Rock061 (`rock`), Tiles144 (`clay_floor`), Plaster001 (`plaster`), PavingStones128 (`stone_flags`); graded to
the game's palette and taken to 256 px by `scripts/bake_textures.py`.
Motion capture: CMU Graphics Lab Motion Capture Database, free for research and games, no resale of the data itself
(http://mocap.cs.cmu.edu); `src/assets/anims_cmu.bin` is that pack.

Pronunciations: the CMU Pronouncing Dictionary, Copyright (C) 1993-2015 Carnegie Mellon University, BSD licence (its notice is kept in
`src/audio/voice/speech/lexicon.data.js`; `node scripts/build_lexicon.mjs` rebuilds it).

The models are exported from `source_assets/` with Blender as a Python module (`pip install bpy==4.5.*`, Python 3.11):

- `scripts/export_courier.py path/to/courier_base_rigged.blend` → `src/assets/courier.glb`, `psygun.glb` (the Solidify outline shells
  stripped: outlines are rebuilt in-engine; the rig in rest pose)
- `scripts/export_godmode.py` → `src/assets/godhand.glb`, `pneuka.glb`
- `scripts/export_slipjelly.py` → `src/assets/slipjelly.glb` (one mesh, no rig)
- `scripts/export_clapperjar.py` → the clapperjar with its idle, sprint and stumble clips
- `scripts/export_chess.py` → `src/assets/clips/chess.bin` (GLB bytes), the title's six chess pieces on their rigs with their 79 clips
- `node scripts/posesheet.mjs out.png Clip@t,t ...` → a contact sheet of the Courier's poses, front and side, on the workbench's stage
