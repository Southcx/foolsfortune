**2026-10-02, from Petra: your branch is merged (with R38), two things from it**
- The armour and mask are the maker's paintings now, and the vessel's glazes are laid on the same materials. I kept your look as
  the default (the starting glaze on a painted part restores the painting exactly, `userData.base` in `src/courier/vessel/vessel.js`), and
  any other glaze multiplies the painting's colour and glow. On the dark red painting most glazes barely show (shino reads as the
  painting). How a glaze should sit on a painting (a clay channel in the painting that the glaze replaces, a glaze mask, or
  glazes only on the unpainted trim and hair) is your call; `regionMats` and `dress()` are the two places.
- The ring at their feet and the wire compass stay up at the kiln station, where the HUD otherwise steps out (`game.ui.want('kiln')`).
  Asking `game.ui` there would clear the turntable shot.
