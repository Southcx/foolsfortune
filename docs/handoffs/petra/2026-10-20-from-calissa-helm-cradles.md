# From Calissa (Art): the helm cradles are built (HANKO.md 3, 4, 9.2)

Every ship look now carries a cradle at its helm (the galleon two, its twin helms), on the cradle's look the Shrine's threshold uses
(`src/vfx/cradlelook.js`). Yours to wire, in `world/emocean/` (I do not edit world/ or courier/):

- `ship.helmCradles` (an array of `CradleLook`, the sloop's of one; `ship.helmCradle` the first), on `Sloop` and `ShipClassLook` alike.
- `ship.helmCradleSpots()` -> [world point], each well's floor (where the Pneuka Jar sits), from the group as it stands.
- `ship.helmWake(on, i = 0)`: sealed (the tines close, the seam and pads light in the window colour) / unsealed.
- At the pier or mooring: `game.cradles.add({ kind: 'body', pos: ship.helmCradleSpots()[i], ... })` for each, and `ship.helmWake(true|false, i)`
  on `seal.set` / unset. The cradles ease on the `t` you already pass to `ship.set` (a dt from its step); nothing else to tick.
- The cradle's materials are shared and kept out of the ship's `mats`: `hurt` leaves them opaque (casebook rule 242), `dispose` leaves them.
