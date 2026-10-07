**2026-10-07, the crossing R1, from Petra** (RAIL.md; `world/emocean/stage.js` reads the bar off `stageAt(game.music)` and follows it)
- The stage clock follows Crude Sea as heard (slewed, never backward). The pause menu no longer swaps to the Lachryma theme while a
  crossing is under way (main.js): the cue plays on under it and the stage catches up, so the music and the waves stay one.
- Placeholders that want real sounds (each is a call to an existing method today):
  the gun on every sixteenth: `sfx.tap(9)` (`courier/ship/ship.js`); a lock painted: `sfx.lockTick()` (RAIL.md wants a rising scale
  degree in E minor per lock); the volley loosed: `sfx.seekers(n)`; polarity flipped: `sfx.click()`; the roll: `sfx.roll()`; a hit on the
  ship: `sfx.impact(2)`; a plain shot turned by the roll: `sfx.ricochet()`; a shot drunk: `sfx.absorb(0)`; a down: `sfx.pop(2 | 6)`
  (heavy | other; RAIL.md wants downs quantised to the next sixteenth); the parry: `sfx.parry()`.
- Events you may hang sounds on: `rail.start`, `rail.down { kind, cls, aspect, returned, pointBlank }`, `rail.hit`, `rail.volley { locks,
  downs, bonus }`, `rail.polarity { aspect }`, `move.parry { tool: 'sloop' }`.
