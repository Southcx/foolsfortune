# From Dovina: the Arena's hooks (2026-11-01; Petra, Calissa, Wanda)

Strawman's Well's fighter kit and Arena are on `claude/dovina-design` (FIGHTER.md; the kit in `src/world/strawmanwell/fighter/`, its
rules in `progress/platformfighter.js`). Waves 2 and 3 are there too: eleven stages, one module a stage (`strawmanwell/stagemods.js`).
Each hook below is done for now inside the kit's own files, by wrapping or setting fields. Each ask is the sanctioned way, so the
wrapper can go. Delete this file in your branch when your part is taken.

## Petra
1. **An input claim** (`core/input.js`): `input.claim(owner, codes)` / `release(owner)`. For now `fighter/keys.js` wraps the instance's
   `isDown` and `wasPressed` while in the Arena, hiding Mouse0 to 2, Shift, E, R, Q, X, V, G, C, H, Y and T, and deletes the wrappers
   on leaving.
2. **Modifier switches on the body** (`courier/player.js`): `player.mods = { ownJumps, noCoyote, noSlide, noWallrun, noRisingMantle }`,
   read by `fixedUpdate`. For now `fighter/courierbody.js` writes `jumpBuf`, `jumpHeldLast`, `coyote`, `landT`, `slideBuf` and `wallCd`
   every step. Known leak: the core's mantle can still climb a ledge the Courier rises past while pushing toward it.
3. **The pose.** For now `fighter/pose.js` adds a passive tech whose `animate` blends clip samples into `base`, and freezes hitlag by
   copying the last pose. It moves onto your key track once Calissa's fighter keys exist: `registerKeys('fighter', KEYS, fillKeys)`,
   with `fillKeys` in platformfighter.js. Your ask from KEY-POSES.md stands: a freeze and shake for hitlag (`character.hold(frames)`,
   a shake laid after posing).

## Calissa
1. **`StrawmanModel.hold(moveId, t)`** (`vfx/strawman.js`). For now `fighter/foebody.js` writes `model.mv.t` to step the doll's moves.
2. **The fighter's key poses**: `courier/anim/keys/fighter.js`, keys named `lead`, `strike` and `follow` a move (KEY-POSES.md 7), for
   the moves in platformfighter.js `MOVES`. The timing is filled from the frame data.
3. **Looks**, all placeholders now: the straw fighters, the percent tag over each head, shield bubbles, the respawn plate, the shots,
   the training lectern's frame-data tag, and the blast-line pins.

## Wanda
- A hit's sound by its weight, on the impact frame, so hitlag lands on it: `well.fighter.hit { move, damage, percent, on }`. The
  placeholder is `sfx.damage('impact', k)`.
- The KO's roar: `well.fighter.ko`. A stock lost: `well.fighter.stock`.
- The Arena's cue, if you want one.
