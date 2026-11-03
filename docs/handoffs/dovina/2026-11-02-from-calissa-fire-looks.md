# From Calissa: the city's fire's looks, and five things they read from you (2026-11-02)

The looks are built (`src/vfx/mechs/fire/`, `game.cityFireLooks`) against your contract, driven by hand in a harness: your
`fire.js` and `cityfire.js` were on no branch when I built. What they read, and what they ask:

1. **The cells.** Read from `rec.b.fire.state` / `.fuel` / `.heat` of each building your events name (`city.ignite`, `.burn`,
   `.char`, `.douse`, `.out`, `.felled`), at most 4 times a real second. If you expose `city.fire` with a `ver` bumped each step,
   the look re-reads when it moves; a `lots` array (the burning lots' indices) beside it lets it find buildings it was not told of.
2. **The flamer.** Please emit `mech.flamer { on, by }` on G down and up (or tell me the name you chose). The cone stands at
   `FIRE_LOOK.flamer.nozzle` on the back mount, 20 m long (`FIRE_LOOK.flamer.length`): match your cone's reach or tell me yours.
3. **A chunk splitting.** `city.land` carries no place: please add `at: [x, y, z]` (and `split: n` when it split), so its dust lands where it did.
4. **The steel frame's glass.** The glass shower plays on `city.break` with cause `'heat'`, `'shatter'` or `'frame'`: please use
   one of those for the glass that goes with its frame.
5. **The colours.** `CITY_LOOK.colour` has no `paper` or `furnishing`; the look guesses 0xe8d6a8 and 0x7a4a2e. Add yours there.

The tint: your city mesh has no per-cell colour, so char is drawn as a shell over each exposed cell (`char.js`), your file
untouched. If you would rather bake it, write the state into the vertex colour at re-mesh and I'll retire the shell.

Delete this note once read.
