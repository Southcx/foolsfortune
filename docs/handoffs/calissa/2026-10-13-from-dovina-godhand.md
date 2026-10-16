# From Dovina: the god hand's looks (GODHAND.md, "As built")

Placeholders waiting for your one look:
- The island's matter (`godhand/islandmatter.js`): two meshes, vertex colour only (clay, sand, Lachryma by its feeling). Wants the room
  glaze atlas's sand and clay, a liquid that shimmers like water and Lachryma, and the seam with the authored ground.
- The held matter ball under the hand (`matterarts.js`, `ball`): a plain icosahedron.
- The seven miracles and seven epics (`godhand/miracles.js`): a coloured ring on the ground plus the existing weather and status looks.
  Each wants its weather falling over its circle (the heavy look, `LOOK[aspect].heavy`, is the obvious donor); the epics their own.
- The drawn sign: an SVG polyline overlay for now.
- Rejection's answer: ordinary slip jellies and Lantern Wisps. An island's antibody Figment wants a body (Espada names it).
- Voxel creations (`godhand/creations.js`): one plain clay MeshStandardMaterial, smooth normals from surface nets. They want firing
  marks, a glaze, and crazing as the mending eats them (`grid` densities fall evenly; the surface walks in).

## The selector and STATUS, built to your reply (2026-10-13)
- Built as you said: keys 1 to 7 with a second press to cycle; the domain strip under the bar with the chosen glyph lit; the bar on the
  domain's tile gradient; the marking-menu wheel with only the hovered domain's arts outward; the glazes as `DOMAIN_GLAZE` in
  `progress/godpowers.js`.
- STATUS (`feedback/codex/status.js`): your spec throughout, including the bisque polygon (gold at The World), your soul colour for the
  attributes, the dashed next outline, three rings and the chips.
- Waiting on your hand:
  - the seven domain icons, and the 25 art icons (unicode now);
  - each power's look: rings and lines in the glaze's `mark` colour now (`godhand/powers/*.js`): the rift's eyes (your `Portal`?),
    the ward's circle, the totem stone, the Strata section, the Course and Read lines, the muster workers (plain clay cylinders, the
    owner's "hatched clapperjars"), the held slab, and fired creation chunks (one darker material now).

## The bracelet, built (no clasp: the owner, 2026-10-13)
- The owner dropped the clasp, so there are seven domain sockets only.
- `game.bracelet` is the state (`progress/bracelet.js`). Please install your look as `game.braceletLook` so the two names don't
  collide.
- Listen for `bracelet.charm { charm, domain, power }` for the gold line, and `bracelet.set { socket, charm }` for a charm going into
  or out of a socket.
- `game.rejection.level` (the Dissonance Level, 0 to 5; event `god.dissonance { level }`) is the red pulse; spend has no event yet. If you'd rather I call your `glow({ spend, domain,
  rejection })` each frame from the powers' runner, say so.
- The data drain's petal bracelet (`vfx/datadrain.js`) is yours to reconcile with the one ring.

## The registers, ruled (docs/plans/REGISTERS.md; the owner, 2026-10-13)
- **Row 8:** a domain's identity is its colour and its sign; the kiln-glaze tile is Anagami's dressing of it. Please reword
  `DOMAIN_LOOK`'s `glaze` field and its museum labels to match, keeping the colours (they stay off the feelings' hues).
- **The base material:** the vessel's material carries everywhere, clay first. It needs a crack pattern for each material (clay cracks,
  glass crazes, nacre chips) and a base shader for each.
- **The island's matter and creations** are now two layers, FIRM and LOOSE, named and coloured by island (`GROUND` in
  `godhand/matter.js`; Anagami's are clay and sand). Dress them by island.
- **Renames:** the god power Fire is now **Set** (`setfast`), and Rift is now **Portal** (`portal`). The Portal power is a linked pair, so
  your `Portal` shader is its look (two rings for now).
- **The STATUS radar** now uses the Codex's amber, with gold at The World. It's the System's register, so no bisque.
