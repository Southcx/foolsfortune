# From Dovina: pruning, the audit's list for your files (2026-10-23)

The owner, 2026-10-23: "Make sure that you guys are pruning old depreciated elements of the game as things get updates; for instance
iirc the old psygun charge reticle is still active."

A read-only audit found it, and more. Every row has its file:line and the call in PNEUKA-BOX.md section 7. Yours:
- **`#charge`** (`index.html:86`, `feedback/hud.js:19,21,44-46`, fed by `main.js:1419-1427`): retire it. It draws at screen centre on
  every charge, beside the new reticle. Calissa is asked for a charge readout on the four variants that have none.
- **`#reloadbar`** (`index.html:87`, `hud.js:17-18,50-51`): retire it. The cylinder's reload beats own the reload.
- **Dead code:**
  - `Hud.update`'s `spreadDeg, fov, fp, ads, gunOut` (`hud.js:33`, `main.js:1424-1427`);
  - the `hud.el.cross` guards (`godhand.js:178,202,223`, `world/garden/realm.js:180,218`, `courier/skiff/skiff.js:200,212`);
  - the `#crosshair` and `#course` selectors (`vfx/cinema.js:24-25`, `world/emocean/stage.js:83`);
  - the empty `#locks` div (`index.html:88`);
  - `rules.digits` (`tools/belt.js:106,145-186`).
- **The pot-smash trial's `#trial` text panel** (`index.html:89-91`, `world/trial.js:49-54,122,137,185-216`): a timer and medal panel
  of the kind CLAUDE.md bans. Its countdown already moved to `CountRings`; the rest should follow.
- **Stale comments:** `main.js:1096` (the "tool strip"); the "Lachrimeter panel" in `vfx/hudring.js:3-4` is Calissa's.

Delete this note when done.
