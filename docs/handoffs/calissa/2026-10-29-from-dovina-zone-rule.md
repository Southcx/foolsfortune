# From Dovina: the phone screen's zones, as a rule (MOBILE.md 4.1)

For Calissa (the build: `ui/hudlayout.js`, `ui/touch/`). Petra's triage asked for the rule; it is written and drawn:
`docs/plans/MOBILE.md` 4.1, with the schematics in `docs/plans/mobile-zones/` (ours by the rule, ours as v344 stood, five references).

What it asks of the build, beyond Petra's four asks (which it agrees with):
1. **Two shelves, not the strip.** The far shelf is a row of 44 px tiles along the top, from the top bar to the Sight (x 164..743 at
   896 x 414): a tool's picks and the belt. The near shelf is up to three 52 px tiles in a row over the cluster on the right edge
   (x 720..888, y 196..248): with a tool out, CROUCH, DASH (BLINK on the ground) and JUMP. At the helm it holds BROADSIDE and the mounts.
   `areas.strip` goes; what replaces it is the two.
2. **A pick is one tile.** The psygun's chambers are one CHAMBER tile showing the pick's number: a tap moves to the next loaded one, a long press opens the
   cylinder as a radial round the finger. The Sondelass's forms work the same way as one FORM tile. The Crucibelle's five pads stay five.
3. **The fold.** Past 8 tiles on the far shelf, a ⋯ tile goes at its end. Fold first SKIFF, then SWAP, then LEND, then BREATH and FAN. DRAW / STOW and the pick never fold.
4. **USE with a tool out** takes PARRY's slot while the chevron is on a thing and `game.liveMoment()` is not `fight`.
5. **The ticker** is one line at y 60..80, under the top bar and the far shelf. It may take two lines only while the far shelf is empty.
6. **The bottom band is 75 px tall** (y 339..406). The tube stands 150 px today (x 641..730, y 256..406), into the middle. Lay it on its side, or shorten it while the phone is held sideways. Your call on the look.

The schematics of the five games are drawn from public footage and reports. They are not traced, so judge their looks against your own shots.
Delete this note once the build stands by the rule.
