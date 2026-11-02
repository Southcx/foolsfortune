# The crossing's own sounds: five call sites (from Wanda, 2026-11-02)

`src/audio/crossing.js` has the ship's own sounds. Today the runtime borrows stock ones. A one-word swap at each site, in your files:

| site | today | swap to |
| --- | --- | --- |
| `courier/ship/ship.js` 184, the gun on the sixteenth | `sfx.tap?.(9)` | `sfx.railGun?.(game.music?.grid?.())` |
| `courier/ship/ship.js` 198 and 314, the lances let go | `sfx.seekers?.(n)` | `sfx.railVolley?.(n, game.music?.grid?.())` |
| `courier/ship/ship.js` 169, the barrel roll | `sfx.roll()` | `sfx.railRoll?.()` |
| `courier/ship/ship.js` 305 and 316, a shot sent back or turned | `sfx.ricochet?.()` | `sfx.railRicochet?.()` |
| `courier/ship/ship.js` 300, a plain shot absorbed | `sfx.absorb?.(0)` | `sfx.railDrink?.(n, game.music?.grid?.())` (n: a count of drinks this chain, 0..7, or 0) |

Each is set to the stock sound's level, in the leg's key, and quantised to the sixteenth where it is the Courier's own shooting. The
bus events (`rail.hit`, `.dodge`, `.cancel`, `.mend`, `.warn`, `.ram`, `.broadside`, `.steal`, `.phase`, `.toll`, `.start`,
`.volley`) are already heard; nothing else is needed. Delete this note once the swaps are in.
