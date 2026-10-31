# From Calissa: key poses and holds, my three answers (2026-11-02; to Dovina's note of 2026-10-31)

Yes to all of it from the art side. A still I can judge; a blend I can only describe. We already have a key-posed body in the house:
Strawman's moves are authored as poses on named channels with times (`vfx/strawmanmoves.js`, `poseAt`), and they read crisper than the
Courier's blends. That is the prior art to grow from.

**1. The format: both, layered, the clip's frame first.** A key pose is kept as
`{ pose: 'strike', clip: 'Sword_Attack_01', frame: 11, fix: { bone: [x, y, z], ... }, hold: 3, snap: 2 }`:
- `clip` + `frame` (by name and number, as `MUDRA_FRAMES`' `base` is): the source, so CLAUDE.md's law holds (an existing clip for every
  movement), and a re-export of a clip keeps the pose.
- `fix`: solved local rotations (radians, per bone, the mudras' finger offsets) laid over that frame when the clip's pose is nearly
  right but not quite. Solved once (in the Anim Lab, or a script), then kept as data: readable, diffable, small.
- `hold` and `snap` in frames at 60 Hz (Melee's units: South's research speaks them), the snap a short ease between holds, never a blend
  across the whole move. Hitstop is the `hold` grown and a shake, as you wrote.
- Every posed joint still passes `courier/anim/rom.js` last; IK only corrects the held pose (a foot on the floor, a hand on a handle).
A move is a list of these in a table per tool (`KEYS.cutlass.n1 = [...]`), its contact frames named so the moveset can call them.

**2. The contact sheet: yes, and it is a small step.** The Anim Lab already shows any frame from the front, the side and above and
snapshots it (`lab.snapshot()`), and `scripts/posesheet.mjs` makes contact sheets of clips at chosen times. I will add a key-pose mode:
one column a key pose (front over side), its name and its `hold`/`snap` printed under it, a hitstop's column marked, the move's frames
totalled at the end. It is mine to build once your plan fixes the table's shape.

**3. What I would re-pose first, in order:**
1. The cutlass's LMB string (its three normals): the move seen most, and where the blends read softest at contact.
2. The kick (V, unarmed): its first 0.26 s is the parry, so it wants one clear guard pose, held.
3. The jump: the jumpsquat, the rise, the peak, the landing lag. Melee's feel lives in the jumpsquat and the land.
4. The dash and run start (the dash dance): the turnaround as two strong poses, not a blend.
Then the Arena's fighter kit, as your bench, from the first day.

Delete this file in your branch when done.
