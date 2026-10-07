# The look: precepts (Calissa's)

What each kind of thing looks like, so a new feature knows how to draw itself. CLAUDE.md's rules (the log is the only text, marks are
not text, no aliasing crawl, the PS2 target) hold throughout. Three materials of meaning, each with one language, never borrowing:

1. **Clay is solid, warm and outlined:** the world, the folk, the pots. The cel ramp (`render/toon.js`), an ink outline, the terracotta
   palette; built surfaces are one modest tiling texture times a palette colour (`vfx/surfaces.js`). Clay squashes, wobbles, settles,
   breaks into shards; it never glows except where it holds Lachryma or a kiln's heat.
2. **Lachryma is matter, never line:** near-black with the thin-film sheen; cream when fresh, through amber to black. How much is shown by
   **volume, fill and brightness**, never a digit (the tube, the beads, the rim, the filigree lit with its load).
3. **The Mind is black labradorite, drawn in lines** (`vfx/labradorite.js`): lines are the schiller, softly rainbow toward pale
   ultraviolet, additive, a pixel wide at 480 lines; surfaces are ink with the schiller rising at the turn. A wireframe bursts in once,
   then holds or turns at a constant rate; nothing blinks at a variable rate; low-poly on purpose (under ~40 segments). Prior art:
   Vagrant Story's sphere, Parasite Eve's dome, Gearbolt's closing frames, Rez's lock squares, ZoE's ring radar.

## The precepts

- **Gold is yours:** a reward, an achievement, a rarity, kintsugi. Kept off passive marks.
- **Reach is a volume on the body; state is a frame on the target** (a dome round the Courier, a closing frame or glyph on the thing).
- **Magnitude is hue, size and closure:** a ring's radius, a frame closing, an arc's fill, cool (far, safe) to hot (near, now). No numerals.
- **Words live in windows** (the log, the dialogue box, menus); the world gets punctuation: a glyph, a chevron, a frame, a bar. Key help
  belongs in the Codex or is said once by the log.
- **Comfort:** large wire volumes are low alpha, depth-tested, shown only while choosing; nothing large changes brightness at a variable
  rate; motion is things actually moving.

## Motion: exaggerated, whimsical, grounded (the owner: Monster Hunter's way)

- **A silhouette per tool**, its idle stance known across a room (`courier/anim/stances.js`).
- **Captured motion, pushed:** UAL and CMU clips, their swing from their own average exaggerated 1.3 to 1.5 times, a pose laid over;
  the capture's weight and timing kept.
- **Clear poses, clean arcs:** one strong line through body and tool; no limb through the face or body.
- **Anticipation and follow-through**, time-warped onto the game's own beats (a move's timings are its feel and never change).

## Effect meshes: made in Blender

One file, `source_assets/vfx/effects.blend`: one object per mesh in its **FX** collection, named as the game asks for it
(`vfx/library.js`). Its flow is on the object's Custom Properties: `fx_speedU`, `fx_speedV` (tiles a second), `fx_blend`
(`additive` | `alpha`), `fx_side` (`double` | `front`). Export with `python3 -I scripts/export_vfx.py`. Any GLB in `src/assets/vfx/` is in
the game by its file name; any PNG in `src/assets/vfx/tex/` is a texture a `decal` layer can wear. `node scripts/meshflow.mjs --author`
roughs a shape out headless; `export_vfx.py --import <glb>` brings it into the .blend to finish.

## Room palettes (proposed, waiting on the room glaze atlas)

| room | clay | accent |
|---|---|---|
| the workshop | red earthenware | kiln orange |
| the hub and the index | grey stoneware | celadon |
| the movement lab | buff bisque, a test grid | ochre |
| the mill and kiln stack | iron-red and soot | ember |
| the siege | black basalt, raku white | oxblood |
| the circuits | porcelain, blue underglaze | cobalt |
