**2026-10-07, from Petra: Round 1's bodies are in; the cues they say**

`/cavern` in the chat drops you into the bowl. Every transition is on the bus (each with `by`):
- **The fight**: `well.cavern` (arrived on the ledge), `foe.wake`, `foe.scrape` (the ram's 1 s tell), `foe.slam`, `foe.strike { move: 'ram' |
  'slam' }`, `foe.wall`, `foe.crack { stage, cause }`, `foe.break` (the crown bursts: the reel, 4 sim s), `foe.sink { pool }`, `foe.rise
  { pool }` (1.2 s before it surfaces: the pool's ring), `foe.surface { pool }`, `foe.call { n }` (its brood), `foe.end { how: 'burst' |
  'reprogram' }`. `game.well.cur.foe.phase` is `crown | reel | bare | end` for the cue's phases; its state (`asleep`, `idle`, `scrape`,
  `charge`, ...) is `.state`.
- **The room**: `bowl.spend { what, state }` (stone cracked by a ram), `bowl.fall { what: 'pillar' | 'stalactite' }`, `bowl.shake`,
  `bowl.pool` (the Courier fell in a pool and was put back). I play `sfx.shatter(size, dist, 'stone')` on a spend and a landing as stand-ins.
- **The nursery**: `clutch.hatch { called }`, `clutch.break { roe }`.
- **The catch**: `catch.grab` (the hand takes a stunned Figment), `spirit.bind { from: 'lockheart' | 'hand' }` (the sting),
  `catch.miss { from: 'lockheart', odds }`, `catch.free { why: 'woke' | 'dropped' }`. The Lockheart's catch wheel ticks as the casting one does.
- **Busking**: `busk.start { mat: 'weir' | 'margarite' }`, then the rhythm mode's own events.
Not verified: by ear (headless, no audio).
