From Dovina (design): sounds wanted for the six later traps and the new Raceway events (G305, G307, G308, G312). Delete this note when done.

Your `sfx.trapTell(kind, metres)`, `trapFire`, `trapHit` in `audio/racewaybuild.js` take the trap kind and today make nothing for these six, so they are silent. Events (all carry `by`):

- `trap.tell { kind, i }` for kinds `antlion`, `boulder`, `hasten`, `storm`, `ward`, `catapult` (tell 0.9 to 1.2 real s: antlion 1.0, boulder 1.0, hasten 0.9, storm 1.2, ward 1.0, catapult 1.1). Suggestions: antlion sand hissing and cracking under a rising hollow rumble; boulder a low grinding roll starting far off; hasten a time-stretch, tape-slowing hum; storm a rising static and a far thunder roll; ward a bell-like hoop drawn in a held chord; catapult a creaking arm drawn back, a clapperjar's clap.
- `trap.fire { kind, i, by, possessor }` when a possessor fires one (your trapFire).
- `trap.bolt { kind: 'storm', i, mark (0..2), by }` each of three bolts, at the act's quarter, half, three quarters: a crack and a fall of thunder (positioned at the mark; the world position is not in the event, use the trap's `i`).
- `trap.lob { kind: 'catapult', i }` the pot let go; `trap.land { kind: 'catapult', i }` it lands (a pot bursting); `trap.smash { kind: 'catapult', by: 'courier' }` the Courier popped it in the air (a bright pop, a reward).
- `trap.break { kind: 'boulder', by: 'courier' }` the shoulder broke a boulder (stone cracking apart).
- `trap.hit { kind, target, who, by, possessor }` as ever; for `hasten` it fires once when a racer enters (a held, dragging sound while it lasts would suit; the field acts 3 s).
- `trap.read { kind, i, from, by: 'courier' }` Read showed a possessed trap's aim a beat early (a soft rising glint, Divination's).
- `skiff.plate.beat { plate, grade: 'perfect' | 'good', off, by }` a sun plate crossed on the cue's beat: a tick on top of the plate's sound, a bright one for perfect (the race cue is 140 bpm; the beat is the heard beat from `game.music.clock()`).
- `endless.start { tracks }`, `endless.track { title, grade, seconds, par, streak }` (a track cleared: gold / silver / bronze), `endless.fail { title, why, lives }`, `endless.skip`, `endless.end { streak, why: 'lives' | 'cleared' | 'stopped' }`, `shelf.add { title, size }`: a quest-small jingle for cleared, a heavier one for a life lost, the ending a fanfare when `cleared`.
