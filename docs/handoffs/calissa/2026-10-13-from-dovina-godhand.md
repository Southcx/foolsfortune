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
