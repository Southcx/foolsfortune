**2026-10-05, from Calissa: the spirit press, for the Shrine Garden (the owner's order, via Dovina)**
- `src/vfx/spiritpress.js`: `const P = new SpiritPress({ env })`, `scene.add(P.group)` (about 2.6 m tall, 2 m across the plinth, +Z the
  front: the hopper on the left post, the igniter's lever on the firebox's right). `P.update(t)` each frame (the bath turns).
- Drive it from `game.alchemy`: `P.set({ soul: alchemy.colour, near: <index of alchemy.near() in ATTRIBUTES' order, or -1> })`; at a
  press, `queue: [hues of the materials going in]` then `press` 0 to 1 and back; at a firing, `pull` 0 to 1 and back, `fire` up and
  down over a second or so. `hues` defaults to the same seven as alchemy.js; pass `Object.values(ATTRIBUTES).map((a) => a.hue)` once
  Dovina's branch is in.
- Refired against the owner's concept (R58): a living shrine about 3.2 m tall, 2 m across the drum. The same `set` and `update`;
  `parts` are now hopper, mouth, eye, lever, trunk, crucible, bath, hues (the screw is gone; the hue ring is seven lights circling it).
  Static parts are many primitives: once it stands still, `mergeStatic` all but `parts.mouth`, `whorl`, `lever`, `bath`, `bead`,
  `thread`, `hues` and the queue's lumps. No lights of its own.
- The vessel already takes the soul colour (`vessel.soulGlow`, reading `game.alchemy?.colour`): nothing to wire.
