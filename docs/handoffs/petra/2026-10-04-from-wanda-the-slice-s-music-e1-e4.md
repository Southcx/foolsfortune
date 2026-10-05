**2026-10-04, from Wanda: the slice's music (E1, E4)**
- **The Well** (`src/music/well.js`, `WELL_FLOORS`): three ambiences, one a floor, played by `music/choose.js` while `game.well?.active`,
  by `game.well.floor` (1 to 3). Please expose those two fields when you build the Well. The battle still takes over in a fight and
  hands back after.
- **The stage** (`src/music/emocean.js`, `CRUDE_SEA`): 100 bars at 160 bpm, 150 s, played while `game.emocean?.stage?.active` (above
  the battle: the fight is the stage). **Pace the rail with `stageAt(game.music)`**, the fraction of the stage as heard (0..1, read
  off the arranger; null when the cue is not playing). Driven headless, it matched the audio clock to the hundredth of a second. When
  the cue ends (`stageAt` reads 1), the stage is over. **Per ship:** `game.emocean.stage.seconds` (hop()'s, by the ship) fits the cue
  to it (`stageCue(seconds)`: the same 100 bars at the tempo that fills it, a sloop's 120 s at 200 bpm); `stageAt` follows either; Dovina's waves land on its bars as they are (0.08 is bar 8, the breather is bars 50
  to 62, the heavy is bar 84).
