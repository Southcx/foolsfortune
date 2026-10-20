# From Petra: the low-spec round, your files (2026-10-20)

The owner asked for the game to run seamlessly on a junk laptop. Two measurements were made, both in `docs/plans/research/`:
`RENDER-INVENTORY.md` (every shader program, the frame's passes, the levers) and `TICK-PROFILE.md` (the CPU of one tick and of the
draw). Both are headless SwiftShader: read the ratios, not the milliseconds. Landed on the default branch, in Petra's files:

- **Graphics tiers** (`src/render/graphics.js`, the glossary's "graphics"): auto, High, Low, Minimum, Custom. A tier sets the lines
  (480/400/360), MSAA (4/2/0), light slots (8/4/2), the sun's shadow (PCF every frame / Basic every 2nd / off), the glow's bloom chain
  (Minimum skips it; the grade stays) and the props' outline reach (all / 30 m / 15 m). Measured in the workshop: Low 38% and Minimum
  67% under High's draw. Dynamic resolution steps the lines down while frames miss the refresh.
- **The warm-up**: the scene compiled in parallel before `prewarmShellLooks`, whose Portal draw linked 72 programs one at a time.

Asks, ranked by what they save. Each is measured in the reports; take them as your look allows.

1. **`forceSinglePass: true` on transparent DoubleSide stock materials.** three r170 draws each twice and re-resolves its program twice
   (ShaderMaterial is exempt). 8 twin program pairs, about 170 materials. The Weir fish's fins were the worst case (55 calls a frame);
   Petra's `fishmesh.js` is done. Where a body is closed and its back faces show through, keep the two passes.
2. **Toggle-flag twins** (RENDER-INVENTORY 2.4, move 1): up to 36 programs differ only by fog, vertex colours, a map or `transparent`.
   A white map and white vertex colour by default, one fog setting, and the outline hulls' `transparent` never flipped.
3. **Standard to Lambert for matte surfaces** (2.5): Lambert costs 0.5 to 0.7 of Standard a lit pixel; 28 plain-family programs first.
   `surfaces.js`, `paintmap.js` and `finish.js` read `roughnessFactor`, so those stay or get a shim. This is a look call: yours.
4. **The Courier's six finish kinds as one program** (`finish.js`, `filigree.js`; Petra's `kintsugi.js`): -5 programs.
5. **Physical down to Standard** for curios, cubes, the Lantern Wisp, overlay bodies: Physical with clearcoat, iridescence and env
   map is 4.5x Standard a pixel. Petra's `world/treasure` follows your call.
6. **The tool instruments' canvases** redraw and re-upload every update while shown (the psygun's reticle, the Carbine's scope, the
   Soul Brush's desk, the Lockheart's reliquary; 0.1 to 1.15 MB each). Redraw only when something changed, at 30 Hz at most.
7. **`SpawnLook.blocksUpdate`** (`vfx/spawnlook.js:301`) rewrites 192 blocks a tick with nothing spawning, plus two instance uploads a
   draw: `if (!B.length && this.clean) return;`. 0.4 to 0.5 ms a tick.
8. **The trail map** runs every frame in the Dunes even with nothing stamped: skip when empty, 30 Hz otherwise.
9. **`Sky.windowMaterial`** (`vfx/sky.js:211`): the inventory found no use of it in play; yours to delete.

When you've landed any of these, say the programs and draw before and after (`npm run perf` measures High; `GRAPHICS=low` or
`GRAPHICS=minimum` measures a tier).
