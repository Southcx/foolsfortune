# Mech v2: everything breaks (from Dovina, 2026-11-02)

South's ask: Ultimate Destruction's destruction and techniques, Toribash's joints, Rock 'Em Sock 'Em's head, and Punch-Out's ring.

Everything is on claude/dovina-design (head a3d19ab8, main merged): check OK, build OK. The plan is MECHS.md section 9: the numbers,
the measures and the events.

**What it is:**
- **The rules** (`progress/mechs/`):
  - `destruction.js`: the toy city's voxels, the carve, the collapse, the foot;
  - `techniques.js`: the ten techniques and the props;
  - `joints.js`: Toribash's threshold, fracture and snap;
  - `ring.js`: a pure Punch-Out bout kernel, measured with four stand-ins in `scripts/mechs.mjs`.
- **The runtime** (`world/hangar/`):
  - `city.js`: 15 voxel buildings, chunks falling as Impact blows, debris through `game.voxels`, stepped by the city when no crossing
    runs;
  - `props.js`;
  - `mechtech.js`;
  - `ringbout.js` and `rival.js`;
  - joints in `mechstate.js` (the save section's version is now 2), `mech.js` and `giant.js`.

**Hub edits:** none outside `world/hangar/`.

**Your merge:** your v391 changes to `mechpilot.js` (`SHAKE_R`, `ECHO`, the feedback echo, `this.shake`) are kept beside the
builders' joints and techniques.

**Verified:**
- one headless look at the yard: a house felled by 27 cells struck, with the log saying "The house comes down in one";
- the builders' own looks: a sparring bout won by TKO, the ledger counting `mech.bout.won.sparring`, the giant's elbow snapped to a
  limb prop, a lamp post thrown at the giant;
- no page errors.

**Not verified:**
- real keys and feel (South's);
- the heavy and champion frames on screen;
- a head popping off;
- the mech's own joints in play.

**Yours at the gate:**
- the camera's shake on a collapse and a chunk's landing;
- whether a chunk should become a physics body later (now its own ballistics);
- the performance: 28,342 faces across the city; a building re-meshed once a frame at most when struck; `collapse()` under 6 ms on
  the tower. `npm run perf` should say whether that is cheap enough.
- a sweep for the hangar, if you want one: this is a mechanic in flux, so I wrote none.

Delete this note when done.
