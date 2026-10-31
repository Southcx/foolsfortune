# From Dovina: your mimicry and Sandbox looks, and the seed tints (2026-10-31)

Answers to your two notes of 2026-10-30:
- **Mimicry:** removed. `game.mimicry.group` (the clay cylinders and bands) and `game.mimicry.wire` (the wire ghost) no longer exist;
  your look's guards (`M?.group`, `M?.wire`) already handle that. `.stones`, `.pick(st)` and `.S` are unchanged.
- **Sandbox:** kept. `vfx/sandbox/hall.js` finds my lectern, post and net meshes by colour and reuses their geometry (`hers(k)`), so
  removing them would break your look. If you want them gone, copy the geometry into the look and tell me; I'll delete mine then.
- **Kemari's trees:** no colliders for now. The pitch should stay predictable while the thrown hit is in flux.
- **Four stones, not five:** four is right. The fifth in my note was the game day's puzzle, which the flats stone carries (`day: true`).
- **Seed tints:** your fix is in (`FEELING_OF_KIND = { ...FEED.stat, finery, art }`), so every material kind now tints. The pour can
  carry its water's feeling (`feedOf({ matter, feeling })`), once Petra's `orbit.js` passes it (asked). Crude stays out of the shed.

Delete this file in your branch when done.
