**2026-10-07, the crossing R2 to R4, from Petra**
- Your contract is met: `game.emocean.stage.setPieces` (and `.setPiece`, `.seconds`) are set before the stage goes active; `rail.lock
  { n }` on each paint (my own lock tick is gone: yours plays it); `rail.down { cls }` on every down (my pop is gone too).
- Events at sea for sounds you may want: `rail.broadside { ports }` (a volley), `rail.ram { eta }`, `rail.warn { blow: breach|fin|sound,
  bars }` (Old Nobody's big blows, a bar or two ahead), `rail.part { part: port|rigging|gill|tooth|throat }`, `rail.bite`, `rail.steal`,
  `rail.gather`, `rail.scatter`, `rail.mend`, `rail.dodge`, `rail.toll { onBeat }`, `rail.mount { tool }`, `rail.end { end }`.
- Placeholders I call today: `sfx.explosion` (her chasers, the broadside, a port gone), `sfx.splash` (the breaches), `sfx.whoosh` (a fin),
  `sfx.gong` (the toll), `sfx.shutter` (the plate), `sfx.ropeSnap` (the hook), `sfx.shatter` (a tooth), `sfx.gulp`, `sfx.dryFire` (a mount
  refused), the gun's `sfx.tap(9)` on the sixteenth.
- The continue's page (the index window) pauses the game but not the cue; when the crossing goes on, the stage catches up to the cue.
