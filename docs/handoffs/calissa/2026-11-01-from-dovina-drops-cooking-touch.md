# From Dovina: drop sprites, the hearth's look, and the touch rebuild (2026-11-01)

South asked for three things this round. Each one is in your hands next.

## 1. Drop sprites: 48 x 48 placeholders, one for each broader kind of thing

South: "have Calissa draft placeholder graphics for item drops. We'll have them drop out of enemies as a 2d billboard sprite. Her
placeholders should be of the generic version of the broader item category. 48x48 sprite icons."

- **The list.** It is `DROP_CATEGORIES` in `src/progress/creaturedrops.js`: 23 kinds. Each row has an id, a label, the generic thing to
  draw (`generic`) and the items that wear it.
- **The order they're wanted in:**
  1. the seven material kinds (`mat.provision` .. `mat.eldritch`);
  2. the nine ingredient tastes (`ing.cool` .. `ing.body`);
  3. then shard, roe, key, curio, shell, fish and slab.
- **The contract.** Install `game.dropSprites` with `texture(cat) -> THREE.Texture | null` (48 x 48, nearest filter). The runtime
  (`src/world/drops/creaturedrops.js`, `textureOf`) asks it first. Until yours stands, it draws a placeholder disc with the item's
  glyph.
- **Your call:** a file (`src/vfx/dropsprites.js`, say), an atlas, and the maker's pixel hand.
- **Optional.** A glint for a rare drop (`drop.fall { rare: true }`) and a little burst as one reaches the Box (`drop.take`).
- **What I could not check.** The world renders black in my headless shots, so I have not seen the sprites on the sand.

## 2. The hearth and its window: dress them

These are both mine, built as placeholders.

- **The hearth** (`src/world/garden/hearth.js`): a clay fire bowl with coals and a pot, on the Athanor's west shoulder (latitude 38,
  longitude 270). It is lit by its own colour and has no lamp. It may sit on a plot: move it if it does.
- **The window** (`src/world/garden/kitchen.js`, classes `ck-*`): the index window's page with a 560 x 234 canvas beside its controls.
  - **What the canvas draws:** the dough, the windowpane when stretched, the proofing bowl and the poke's dent, and the loaf browning
    with its steam.
  - **The rule for the dress:** the tell is the interface. Draw what the food does, never a number.
  - **Checked:** at 896 x 414 the controls sit beside the canvas, not below it. My shot is in this round's report.

## 3. The touch rebuild: please look, and mock it up

South: "come up with a plan for a better mobile UI with Calissa ... if you were to rebuild the UI from scratch, how would you do so".

My draft is `docs/plans/TOUCH-REBUILD.md`.
- **The arc.** Six fixed slots round the right thumb's corner, relabelled by context and never moved.
- **The rest:** directional presses (Brawlhalla's), PICK and BELT radials in place of the shelves, and no dead tiles.

What I'd like from you:
1. **Your view on it, before anything is built.** Especially the arc's shape and sizes, and whether the meter slot sits at the far end
   or the top.
2. **Mock-ups at 896 x 414** of three contexts: on foot, a tool drawn, and the Arena. South judges a layout in a picture first.

Delete this note in your branch once it's built or answered.
