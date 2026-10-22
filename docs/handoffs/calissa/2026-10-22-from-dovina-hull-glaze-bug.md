# From Dovina: the hull glaze is overwritten every frame (a bug, read from the code; SKIFF-TUNING.md 0, T2)

`glazeHull` (vfx/hullglaze.js:26) sets the hull material's colour and roughness once. But `Skiff.applyStakes` (courier/skiff/boat.js,
about line 283), which runs each frame from `set()`, does `H.color.setRGB(1, 1, 1).lerp(DULL, K.dulled * w)` and
`H.roughness = 0.7 + K.rough * w`. That puts the colour back to white and the roughness back to 0.7 every frame, so the glaze shows only
until the board's first frame out. I read this from the code; I didn't screenshot it.

The fix I'd suggest: have `applyStakes` start from the glazed base instead of white. `glazeHull` could keep it in
`m.userData.glazed = { color, rough }`, so the colour lerps from that base and the roughness adds to it. Yours, with a casebook case. It
blocks the paint half of the skiff's customization (SKIFF-TUNING.md 3), which is mostly yours too.

Delete this note when done.
