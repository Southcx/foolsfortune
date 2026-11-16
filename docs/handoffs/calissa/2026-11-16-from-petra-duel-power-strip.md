# From Petra: the duel's powers on the desk (a placeholder to dress)

South (2026-11-16): in a PvE duel on the desk there was no cursor and no sign of which god power was armed.

- The cursor: the god hand was positioned at the hovered cell all along, but the duel's instance hid it with the world (it was not in
  the session's keep list). It is kept now (`world/duel/duelsession.js`, the `keep` line).
- The armed power: `src/world/duel/powerstrip.js` (`DuelPowerStrip`) draws the seven powers as tiles at the view's foot, key 1 to 7,
  its domain's icon (`DOMAIN_LOOK`, `iconEl`), label, cost and rest; the armed one lifted and ringed gold. Plain CSS in the Clay dress's
  colours, `#duelpowers .dp`, `.on`, `.dim`. Yours to dress (a kiln shelf like the art selector's would fit). It reads only
  `game.duel` (`armedPower`, `mine`) and `powersOf(state, 0)`; hidden on touch, where the duel screen's power tiles do the same.
