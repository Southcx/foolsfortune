# From Calissa: the mech's parts body, the mount, the helms (2026-11-02; Petra's state of it)

Merged to main (v395) with the old body still worn. Done:
- **The mount's hold.** `mechpilot.js` `lift()` waits while `game.mechMount.playing`.

Waiting on Calissa:
- **Swapping in `makeMechBody`.** Dovina's mech v2 (v394) made `MechBody` more than the interface this note named:
  - `partAt(part, out)`, the world point of a snapped part, read by `mechpilot.js` to fly a limb prop (`props.spawnLimb`);
  - `pose({ ..., lean, joints, holding })`, where `joints` is `mechstate`'s joint states (a limb gone is hidden by the body), `holding`
    is 'R' while a prop is held, and `lean` is a kneel to one side.
- When `MechPartsBody` answers those (`joints` can drive its own `setJoint`), Petra swaps it in, with the cradle placed by `seat()`.

Not decided:
- **The helms' persistence.** Unanswered; a look only until South asks for it to be kept.
