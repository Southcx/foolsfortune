# From Dovina: the mech night's placeholders (2026-11-02)

The runtime is on `claude/dovina-design` (MECHS.md 11). Everything below is a placeholder of boxes in the proving ground's group, for you to dress. Nothing reads these meshes' looks; swap them freely, keep the names.

**The smash challenges** (`world/hangar/challenges.js`; the lane on the yard's north strip, `LANE` in `progress/mechs/challenges.js`):
- `challenge.lectern`: pedestal, gold desk, a sign "SMASH CHALLENGES". F there opens the page (index page `smash`).
- `challenge.line`: the throw line across the lane (at `LANE.line`, or 70 m on for Bowling).
- `challenge.ring.<i>`: Bullseye's flat discs, 0 the bull (radii 4, 10, 18, 28 m), 70 m down the lane.
- `challenge.pin.<i>`: Bowling's ten clay pins, 8 m tall, each a group pivoted at its foot that tips over when it falls (`pinSpots()`).
- `challenge.ball`: the rolling water tower's pivot group (the tower mesh a child). Its legs poke through the ground while it rolls.
- Events to hang moments on: `challenge.start { id }`, `challenge.score { id, add, total, what }` (`what` is 'STRIKE' or 'SPARE' at those), `challenge.end { id, score, medal 0..3, best }`, `challenge.quit { id }`.

**The dune colossus** (`world/hangar/giant.js`, `giantbodies.js`, `giantmoves.js`; id `colossus`, 22 m, body 'sand'):
- Group `giant.colossus`, parts `colossus.*` (body, torso, chest, pelvis, ridge0..3, head, skull, eyeL/R, armL/R, shoulderL/R, upperArmL/R, forearmL/R, fistL/R, legL/R, barrier). `giantbodies.js` builds both giants' placeholders; your body can replace it the way the straw giant's would.
- Its moves' marks: `giant.burrow.ring` (the ring on the ground where it will erupt), `giant.clod` (the hurled clod), `giant.wave` (the sand cone). Events `giant.windup { id, move }` with move `sweep` | `burrow` | `hurl` | `wave`.
- `giant.post` (plinth, pillar, lamp, a floor label "GIANT POST"): F there calls the next open giant (`giant.call { id }`).

**Giant wrestling** (`world/hangar/giantgrapple.js`): a giant held over the mech's head, thrown or slammed: `giant.grab`, `giant.throw { id, hit, cells }`, `giant.slam`, `giant.slip { why }`. A strain on the frame while it holds would sell the weight.

**The ring's shadow frame** (`RIVALS.shadow`): `RIVAL_LOOK.shadow` falls back to the sparring frame's body: "a frame with no colours".

Delete this note in your branch when done.
