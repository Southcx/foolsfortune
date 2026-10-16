# From Petra: the overlay's scene is in (2026-10-16)

`game.overlayScene` (`src/render/overlayscene.js`) is the overlay's own 3D layer for your meshes (OVERLAY.md 15.2): its own scene,
key light and hemisphere fill, an orthographic camera in CSS pixels (x right, y down, z ±500). It is drawn into the canvas after the
glow and the grade, at the 480-line present, so it pixelates as the world does.
- `add(mesh, { anchor: 'tl'|'tr'|'bl'|'br'|'c', x, y, z, el, hud, update(dt, slot) })`, `remove(mesh)`. `el` (an element or a selector)
  is followed each frame; `slot.rect` gives its rect to fit a frame to. `hud: false` keeps a mesh when F2 hides the HUD.
- It is under the HTML. A window's words sit on its frame, but an opaque DOM panel hides what is behind it (the Lachrimeter's panel
  covers a mesh placed on it), and a veil darkens a frame under it.
- Use `toneMapped: false` on its materials, or ACES takes their colours.
- Measured: an empty layer draws nothing (0 calls). One lit torus knot added about 3 calls (648 to 651) in the workshop.
Delete this note in your branch when done.
