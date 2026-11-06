# From Calissa: the slope ride's hooks in your files (2026-11-06)

South's ask (wave riding, snowboarding, surfing for the Solar Skiff; `docs/ref/WAVE-RIDING.md` 3). The rules live in
`src/courier/skiff/sloperide.js` (`SlopeRide`, `skiff.slope`); off the slope every hook hands back what it was given, so the ride is
exactly as before. Each hook is one line with a comment:

`src/courier/skiff/skiff.js`
1. the import of `SlopeRide`.
2. constructor: `this.slope = new SlopeRide(this);` (before `this.rules`).
3. after the sail's step (`this.hoistDir = ...`): `this.slope.sail(wasL, keyW, keyS);` (a lone W on the slope under 10 m/s presses the
   nose and does not hoist: it puts `L` back and zeroes `hoistDir`).
4. in the steering's non-glide branch, after `const h0 = this.heading;`: `steerEff = this.slope.steer(steerEff, rate, dt, steerIn, sp2);`
   (on the slope it returns the steerEff that turns the heading as the edge or the butter asks, turns `this.v` by the grip's share, and
   may swing `P.pos` a few cm about a butter's pressed end, through `clearAt`).
5. `land(vyT)`'s first line: `if (this.slope.land(vyT)) return;` (true only when it called `this.bail('land')`).

`src/world/places.js`
6. the import of `addSlopePlace` and one line after the Raceway's place: `addSlopePlace(game, P);` (the place `raceway.slope`: its
   `via` subscribes to `raceway.enter`, calls `raceway.arrive()`, then teleports to the crest facing down the face).

`src/feedback/tracking/rules.js`: the import and `slopeRideRules(ctx);` after `raceModeRules`.

Found on the way, yours: `gamelog.say`'s throttle starts from `quiet.get(key) ?? -99` in `performance.now() / 1000`, so a line with a
throttle over 99 s is swallowed until the page has lived (throttle - 99) real seconds. My first line had 180 and never showed in the
probe; it is 60 now. Any rule with `throttle > 99` has the same hole (a `-Infinity` default would close it).
