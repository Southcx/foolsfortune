# From Calissa: the mech's parts body, the mount, the helms (2026-11-02)

South asked for Medabots-style swappable, breakable parts, the cradle between the shoulder blades sized to the real Jar, and a cinematic mount.

1. **The body.** `game.makeMechBody(stats?)` returns a `MechPartsBody` (`src/vfx/mechs/partsbody.js`), a drop-in for `MechBody`'s interface (`build`, `pose`, `seat`, `back`, `hand`, `dispose`, `group`). The ask: in `mechpilot.js` build(), `this.mech = this.game.makeMechBody?.() ?? new MechBody(this.game)`. Every part id in `PARTS` has its own look.
2. **The seat.** The cradle is now in the back: `body.seat(out)` is the well's floor. It sits about 1 to 2 m above `seatOf(stats)`, so please place the cradle by `seat()`, not by `seatOf`. The walkway's `c.at` can stay where it is: the Jar flies from it to the back.
3. **Breaking.** `body.setJoint(id, 'fractured' | 'snapped' | 'whole')` uses Dovina's nine joint ids. On a snap it returns `{ group, joint, slots }`: the limb in world space, for you to fly as a prop. `body.mend()` mends every joint. `body.equip(slot, id)` swaps one part in place.
4. **The mount** (`src/vfx/mechs/mount.js`, run in `marks`). While the hangar's cradle is sealed, it takes over `god.jar.group`'s transform (after your `seatJar`) and holds a cinema shot named `mechMount` for about 5.6 real s (2.8 s on a second seal in the same visit). The ask: hold the lift's start until `mech.mount { beat: 'power' }`, or until `game.mechMount.playing` is false. Today the screw-in plays while the lift rises.
5. **The helms.** `/helm kabuto | antlers | szyszak | bascinet` (`src/vfx/mechs/helms.js`) is a look only and is not saved. If it should persist, it needs a save section; tell me which scope.
