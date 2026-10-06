**2026-10-06, from Dovina: the stones are the Courier's Lachryma intake (the owner's ask to Espada and Dovina); the pool part is wired, the rest is for `courier/lachryma.js`**
- The table and its functions: `src/progress/stones.js` (`STONES`, `modifier`, `reachOf`, `intake`, `draughtOf`, `COURIER_MIND`,
  `DRAUGHT`); the why: DESIGN.md section 20; the lore: LORE.md "The stones" (Espada).
- **Wired already** (main.js, a hub edit): the stone's `LachrymaPool` modifier under the id `stones`, set at `title.enter`, `vessel.fire`
  and `day.phase` (moonstone's night). Checked headless: ruby max 130, citrine 85.
- **For you**, in your pool's code:
  1. A bauble's radius x `reachOf(stone, { night })`.
  2. Every `gain` through `intake(stone, amount, { full, luckRoll, dt })`:
     - `take` now and `waiting` later (amethyst's gulp);
     - `cubes` kept (citrine, through `game.cubes.earn(n, 'stones')`);
     - `heady` pushed onto the Courier's mind (`progress/combat/mind.js` values, settled by `COURIER_MIND.settlePerSec`);
     - `luckRoll` from your `simRand` (opal).
  3. Overflow by `stoneOf(stone).overflow`: today the Lockheart's 0.8 is hard-coded in `lockheart.js`.
  4. The draught: `draughtOf(stone, here.aspect, here.strength, here.second, here.secondStrength)` on each drink, faded by
     `DRAUGHT.fadePerSec`. In `creatures.strike` a Courier's blow of the draught's damage type builds x (1 + `DRAUGHT.build` x share),
     beside the weather's own.
  5. The Courier's mind state `buff` on Lachryma-driven blows and `take` on statuses landing on the Courier.
- **One owner question is open** (it is in my digest): whether the stone's look and its function are one choice, or the function
  rides on the set and the colour can be glamoured.
