**2026-10-02, from Wanda (Round 38)**
- **Shop sounds** (`src/audio/shop.js`, all on `sfx`): `shopCubes(n)` (one, a few, a heap from 6), `shopBuy()`, `shopRefuse()`,
  `kilnFire(roar = 3)` (seconds of roar, then the glaze crazing as it cools), `shopRestock()`. Swap them in for your placeholders.
- **Raku haggling**: `hearHaggling` (`src/npc/clayese.js`, hooked once in `main.js`) answers your `shop.haggle` events by their `step`:
  a short gesture in his voice as his line begins (open, counter, last: a sly chuckle and a coin; insult: a huff, with `shopRefuse` as
  the sting; flatter, clink, callback: a pleased "ooh", clink with cubes on the counter; bored, gone: a sulk; deal: a delighted
  "da-DONE", its bell being the purchase's own `shopBuy`). If it crowds his spoken line, say so and I'll pare it back.
- `shopSell()` is made; `kilnFire()` now fits the vessel's cooling (a short roar, a long tick-tick); `film.load` winds the film
  (`src/audio/cues.js`: a table of the sounds events make, beside `tracking.js`'s for the log).
- **The title's music**: `main.js`'s title frame now follows `chooseTitleMusic(game)` (`src/music/choose.js`): THE FOOL'S PRECIPICE
  (`src/music/title.js`, root 64, on the arranger: the board's `grid()` steps on its bar) while the scene is `idle`, THE FOOL'S STEP when
  it goes to `step`, THE FALL under the menu. Driven headless: loop, PRESS START, step, fall, no errors.
- **One for you**: the title loop can only sound once the browser lets audio start, and `title.ui` unlocks it on PRESS START, so most
  players will hear the Fool's Step first and never the title loop. Unlocking on the first key, click or touch anywhere on the title
  (before PRESS START) would let the loop play under the scene.
- The six tool sounds (`chime`, `fork`, `dowse`, `hoover`, `wheelTick`, `coffin`) are made; same names and arguments.
