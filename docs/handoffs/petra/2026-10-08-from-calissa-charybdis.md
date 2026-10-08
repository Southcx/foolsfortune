**2026-10-08, from Calissa (Art): Charybdis and the whirlpool have their look (branch art-charybdis)** (delete in your branch when done)

**Built (mine):** `vfx/whirlpool.js` (the whirlpool, a disc on the crude sea's own program), `vfx/charybdis.js` (`CharybdisLook`),
both driven by `vfx/crossinglook.js` from your director (read, never changed), and the workbench stage `crossing:charybdis`.
Programs per scene unchanged (161 / 163 / 163 / 163), late programs 2 (was 2), dev heap 371 MB (base 369).

**CROSSING (your `world/emocean/charybdis.js`, `take()` only):**
- The stand-in heavy's mesh is hidden (`f.mesh.visible = false`): its look is mine now.
- The foe is held at the whirlpool's heart in the world (`whirlHeart`, vfx/whirlpool.js), then `rail.toLocal`. `arenaCentre` with
  `foe.local.y` put it 15.1 m under the crude and 3.5 to 4 m off the laps' centre, the arena's bank tilting the frame (casebook,
  2026-10-08, rule 127). Your `charybdistest.mjs` passes all nine; the ship circles 44.4 to 44.9 m from it.

**One ask (the camera, yours):** at the peak the view is `free`, looking along the lap's tangent. Charybdis is 45 m across on the
turning side, about 77 degrees off the view's axis, so in play it is off screen for the whole arena (`risen_game.png` against
`risen_rail.png` in my report). A view that looks in (the camera behind and outside the ship, looking at the heart, as
`stage.looks.mael.heart` gives it; or the free view's look turned toward the heart) puts the maw, the baleen and the whirlpool in frame.

**Its parts, for your director (the `BossPart` shape, `stage.looks.beast`):**
- `'baleen.0'..'baleen.7'` (eight combs round its lip; from above and the side; `windup` flares them), `'eye.0'..'eye.5'` (round its
  head under the lip; from the side, and from under the surface as it dives; `windup` widens and burns them), `'throat'` (the
  gullet's light, from above; `windup` swells it). `look.part(name)`, `look.hit(power)` (every open part lifts: what I call on the
  foe's own `hitT` today), `look.vantage('above' | 'flank' | 'below', out)`.
- Your foe's hit sphere sits at the lip's middle (the maw), where the look's origin is; risen, the look leans its maw toward the ship
  about that point, so what is struck stays where it is drawn. Its anchors are where the marks sit, not hurtboxes.
- Beaten (`foe.alive` false) it sinks and the whirlpool goes still on its own; at the release the same. The lines "Charybdis dives."
  (first dive) and "Charybdis sinks into the maelstrom. The sea goes still." (beaten) are Espada's (LORE.md) for your director to say.

**Under the surface:** while it is shown, the Umbral's murk is drawn off (`game.umbral.set({ clear })`, vfx/umbral.js: density 0.034
to 0.014), so it is seen across the arena from below; at 0.034 a thing 45 m off kept a tenth of its light; at 0.014, two thirds.

**Which way it turns (the review, casebook 129):** the whirlpool and Charybdis turn the way the ship laps, `looks.mael.sense = -arena.sign`
(measured on both signs: the ship, the beast's eye and sheath and the bands all fall in `atan2(z, x)` at sign +1, all rise at -1). If you
change what `arena.sign` means, the look follows it from that one line (`vfx/crossinglook.js`, `maelstrom`).
