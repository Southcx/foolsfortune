**Wanda's open list** (the notes it replaces are deleted; each line names who asked).

- **Placeholders that want real sounds** (Petra, 2026-10-06 and 07; each calls an existing method today):
  - the Soul Brush and the jets: `brushReady`, `glassCrack` (`bottle.crack`), `jetStart`, `jetCharge`, `jetLaunch`; a looped spray and
    mop under `load.working` (`brush.paint`, `brush.mop`, `move.hover`, `move.rocket`, `move.skim`, `stain.*`);
  - the parries: the Dreamvane's spin, a soak or gulp, the Veritome's shutter; the tools' answers (`parry.try { tool }`,
    `move.parry { tool, how, what }`);
  - the Shrines: `sfx.rest` (a rest), the Wake Whistle (`well.escape.start`: a 1.5 s breath), the wake (`well.leave { how: 'escape' }`);
  - at sea: the gun on the sixteenth (`sfx.tap(9)`), the volley (`seekers`), polarity, the roll, a hit, a ricochet, a shot drunk;
    `rail.broadside`, `rail.ram`, `rail.warn`, `rail.part`, `rail.bite`, `rail.toll { onBeat }`, `rail.end`;
  - the Dunemaw bowl: `bowl.spend`, `bowl.fall`, `bowl.shake`, `clutch.hatch`, `clutch.break`, `foe.*` (the fight's own blows).
- **The settings' save sections** (Petra, 2026-10-05): `foolsfortune.voice`, `.music`, `.rhythm` into `game.save` sections, scope
  `settings`, once the save can carry an adopted key's value.
- **The Dunemaw's places, the geysers and Strawman:** `docs/handoffs/everyone/2026-10-06-from-wanda-the-dunemaw-s-sound.md`.
- **The Spirit Garden's new parts** (Dovina, 2026-10-07): water running, the rain inside the Jar, the hand's brushes, a cue deepening a
  Firing: `docs/handoffs/wanda/2026-10-07-from-dovina-garden-sound.md`.
- **The crossing's maelstrom arena and a bounty's stray:** their own cues once their runtime exists (RAIL-OVERHAUL.md).
- **The tools' own UI** (Calissa's mock round 9, 2026-10-18, not signed off): the cylinder's turn, auto-turn, shot, open and home are
  wired (`audio/cues.js`); the draw, stow, Pepperbox and the Sondelass's form change and lure ring wait for their events. Still unsketched: the string's notch pop, the
  paid cut's glint, the hook's brackets and reel beads, the link's bead and count roll, the link's hum (the dry click's drop-out).
- **A puzzle duel** (Dovina, 2026-10-19): `sfx.duelEvent(e)` is built (`audio/puzzleduel.js`); when Calissa's view exists, it calls it
  for each event as it animates it (or the events go on the bus and a rule in `audio/cues.js` calls it). A duel cue then, too.
- **The puzzle duel's names** (Espada, 2026-10-19: the genre's words, by the owner's ruling): `audio/puzzleduel.js` answers both
  (break/buckle, orb/teardrop, run/glean); once Dovina's rename lands, drop the lore ones (and the depth check, if junk's break is renamed).
- **The Soul Brush rebuilt as FLUDD** (Dovina, 2026-10-09; `docs/plans/LACHRYMA-LOOP.md` 5a): the squirt, the hover's hiss running dry,
  the rocket's charge, the mop's slosh refilling, the cleaned ground's sparkle; once its verbs are on main. Gall and Fury's paint and
  their fish (phase 2 of `docs/plans/GALL-AND-FURY.md`) after it.
- **The caster shells' music moments** (CASTER-SHELLS.md, later batches): RYNO (92) jumping the cue to its climax, The Fool (99) the
  Lockheart's wheel and landing, Stop-Motion (58) the field on the beat, Thirteen (96) the silence after the bolt; once their runner exists.
