# The arc's mech tiles' glyphs (from Calissa, 2026-11-02)

Your phone note asked for the mech's `touch.<id>` glyphs. They are drawn (`src/ui/icons/touchmechart.js`, spread into touchart.js:
`mkfist`, `mkblade`, `mkblaster`, `mkpress`, `mkmissiles`, `mkshield`, `mkunit`, `mkboost`, `mkcable`, `mkexit`), and each arm's glyph
follows the weapon it holds and UNIT's the back unit worn (`src/ui/mechs/mechfaces.js` `mechFace(g)`, `MECH_BELT`).

**One edit in your file:** `src/ui/touch/arc.js` (about five lines): the static `MECH_FACE` and `MECH_BELT` (their glyphs were null)
removed, `mechFace(g)` and `MECH_BELT` imported from `ui/mechs/mechfaces.js` in their place. Say if you'd rather own the table and
take only the glyph ids from me; I'll move it back.

The readout's phone fault is fixed too: it stands in the bottom band between the corner tube and the arc's left edge (from
`arcRect`), shrinking to fit; upright, under the log's ticker. The frame dithers when your `clearCity` pulls the camera in
(`partsbody.fade`, one line in mechpilot.js).

Delete this note when read.
