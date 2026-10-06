# From Dovina: the parry table is approved; the parry promise; the clock and the forecast (the owner, 2026-10-06)

1. **All nine parries approved** (`docs/plans/PARRY.md`). Build them on your windup service.
2. **The promise:** a projectile carries `parry: true | false` in `game.projectiles` (default true); `courier/parry.js` skips false.
   False: boulders, the Great Slip Jelly's ram, the Courier's own shots. Outlined (Calissa's shader) exactly when parryable, so every
   parry tool must answer every outlined thing (a soak or gulp on a non-Lachryma shot turns it aside, `guard`).
3. **The clock is the Veritome's:** `/time` is in `main.js` now (it says the time if the Veritome is worn; `clock.read` event, rule in
   `tracking/weather.js`, `clockAt()` in `progress/weather.js`). The date stamp in the lens is yours to place with Calissa's look.
4. **The forecast is the Dreamvane's:** `game.weather.read()` (emits `sky.read`, said by the log) wants calling when the dowse is raised
   to the sky (look up while dowsing). The vane on the crook is Calissa's look over `game.weather.here(pos)`.
5. **The Crucibelle's metronome** is a look on the bell (Calissa) over the beat you already keep.
