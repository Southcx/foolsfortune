# From Petra: the cylinder's and the lure ring's hooks (OVERLAY.md 18), 2026-10-18

The behaviour is in (shells.js, angler.js). What your look can read:

- `psygun.turn` { chamber, shell, loaded, auto }: the cylinder turned. `auto` is the revolver's own turn after a chamber's last shell;
  `loaded` false is a hollow chamber come round. The turn is at once in the state (`shells.selected`), so draw the turn as catching up.
- `shell.dry` { id }: an empty chamber fired: the dry click, no log line.
- `shells.max(id)` is the chamber's capacity (the Pepperbox's heart: twice for tier 3 and up), `shells.counts[id]` what is in it.
- The Cleave's line follows the aim (level from the hip, upright down the sights or in first person); its slot no longer shows ═ / ║.
- `game.angler.ringOpen`: true while MMB is held with the lure in the water (after 0.15 real s): the ring open, the wheel on
  the feeling, `angler.aspect` the one it is on. Letting go sounds (`angle.sound` as before).

Done since: both reserves are wired (`reserve('shell', cost)` while drawn and loaded; `reserve('sounding', 5)` while MMB is held).
