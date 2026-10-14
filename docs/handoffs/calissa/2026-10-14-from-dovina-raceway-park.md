**2026-10-14, from Dovina: the Raceway as a park of tracks (claude/dovina-design; docs/plans/SKIFF-RACING.md section 10)**

The owner asked for two of these by name:
1. **The flares' indicator on the board's BACK** (the owner: "everything on the front end gets occluded by the skiff itself"): your
   banked-flare marks (`skiffcombomarks.js`) moved aft, where the camera sees them.
2. **A balance mark for the grind** (no words): `techs.get('skiff').grind` has `on`, `lean` (-1..1: past 1 the board falls off that
   side; + is the right), `R.coaster` (a coaster rail: the drift is gentle and does not grow), `up` (the rail's up). Tony Hawk's arrow is
   the prior art; a needle or a tilt on the board, your call.

What the park changed that your looks read:
- **Raceway moved to x 6000**, 2.6 km across (RW in track.js). `R.T` is still the Sun Circuit (turned 180 degrees to face the hub, so its
  frames moved); `R.tracks` has all three, `R.track` the one the Courier is on.
- **Edge strings:** `R.edgeLines(step, line, trackId)` now gives each line a `hide` array (1 = the point lies on the other line's
  running surface: the cavern's fork and merge, where the owner saw the strings cut across the road). Please break the string there.
  The Gorge (`'gorge'`) and the Coaster (`'coaster'`) want strings too.
- **Gates' marks and lamps**: the new tracks have their own start arches, gate pillars and start pillars (kit.js; `R.pillars`), so far
  undressed.
- **Sandfalls**: `R.sandfalls` (each `{ track, top, dir, width, height, foot, look }`), five now: the Sun Circuit's lip, the Gorge's
  Break and Step, and the cavern's skylight fall (hung from the roof, `curve` 0.8, `lean` 1.2: a near-vertical curtain).
- **New placeholders to dress**: the water (`R.waterMesh`, flat ellipses: the Mirror lake, the cavern's pool), the bridge decks
  (`R.deckMesh`, stone on piers), the antlion's maw (`R.pits[i].group`, two jaws that snap on `raceway.pit`), the coaster rail (in
  `R.railMesh`, purple lintels; its points `R.rails.find(r => r.coaster)` with `ups`; a helix tower), the cavern's crystal pillars.
- **The cavern**: the floor is 6 to 8 m lower and wider (walls 22 to 32 m), the roof only where the walls stand 11 m (`BRANCH.roof`), the
  stalactites 10 m clear (`ROOF.CLEAR`); a pool (water) at 162 to 208 m, four pillars (`BRANCH.pillars`), a skylight fall at 186 m.
Delete this note when it is merged.
