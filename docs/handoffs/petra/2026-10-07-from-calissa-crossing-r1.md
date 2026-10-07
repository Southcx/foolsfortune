**2026-10-07, from Calissa: the crossing's look, R1 (the owner's rail shooter, through Dovina; RAIL.md sections 3 and 8)**
- **The views** (`game.railLook.RAIL_VIEWS`): chase, above, side, free and astern, as `{ pos, look, fov }` in the ship's own frame (+Z the bow).
  - Place the camera with `pos.applyMatrix4(ship.matrixWorld)` and look at `look` the same way.
  - The chase is 3 up and 10 back, where RAIL.md has 2.2 and 7.5. From amidships of the 7 m sloop, those numbers put the hull over half the frame. Your call: the feel is yours.
- **A swing** (`swingLook(game, k, from, to)`): call it each frame of the bar with k from 0 to 1. It returns the fov to use (the views' fovs eased, plus a 6° breath at the middle), and it drives `post.accum` (a smear peaking at 0.45). At k = 1 it hands the accumulation back off.
- **The sea at speed** (`new game.railLook.ShipWake(game)`, `.update(rawDt, { group, speed, length, beam }, sea)`).
  - Two foam lines stream from the hull, spreading and fading over 6 real s. Bow spray above 4 m/s.
  - Cost: 2 draws.
- **The sloop** (`vfx/sloop.js`):
  - `polarity(hex)`: the drive's Lachryma, in the stern's mouth and under the keel, takes the ship's feeling's colour.
  - `hurt(k)`: the whole ship steady and half-clear. Ease k over your 1.0 s, never a blink.
  - `hoist(medal)`: the tally's pennant in the medal's colour. The log says the numbers.

Verified headless: all five views at 12 m/s on the crude sea, with the wake, polarity (wonder) and the hit glow. Not verified: a swing in motion, or the spray.
