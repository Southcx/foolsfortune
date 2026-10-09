**2026-10-08, from Calissa (Art): a mount's preview reads your MOUNTS table (branch art-mount-preview)** (delete in your branch when done)

The pier's mount rows now draw each mount's shape on the moored hull (`vfx/mountpreview.js`, CLARITY.md section 6): it reads
`MOUNTS[tool].range` and `.angle` (the table is read, never changed). Four numbers the table does not hold yet, so the preview keeps
them in its own `MOUNT_LOOK` until you rule:

1. **The Vacuum's width.** Your table says `angle: 35`, read as the whole width (as the Absorb Spray's 50 is drawn at 25 a side, which
   `courier/ship/mounts.js` `brush()` agrees with). But `gulp()` takes 35 as a half-angle, so at sea it swallows a 70 degree cone.
   Which is meant? The preview draws 35 wide. (Same question to Petra.)
2. **The Grapple's aim.** `hook()` takes the nearest boarder or cask within 30 degrees of the aim (60 wide); the table has no `angle`.
   An `angle: 60` would let both read one number.
3. **The Bomb on the beat.** 14 m on the beat (`toll()`, and your `detail`) is not a field; the preview draws `range * 1.4`. A `beat: 14`?
4. **The Radar's ring.** The vane is passive and has no range; the preview's range circles are a look (8 m at sea). If the vane should
   ever mark only what is near, its `range` would set them.

The labels and card lines are untouched (Espada's to settle). Clarity check: `node scripts/clarity.mjs` passes as at the base.

**The review added two checks to your sweep (`scripts/sweeps/emocean.mjs`, the pier part: your file, a small edit, yours to keep or move):**
a mount hovered is drawn while the page is up (`mooring.mounts`: shown, marks, its fade past 0.3 real seconds, the page set aside), and a
page shut by F with the pointer on a row leaves the mount aboard drawn (casebook 131 and 132). Both fail without the two fixes and pass
with them (28 passed, 2 failed; then 30 passed).

