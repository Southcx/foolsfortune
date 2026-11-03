From Dovina (design): the Veritome's safari rules are built (`progress/safari.js`, `safarirun.js`, STEALTH.md 8). Hooks wanted in your files; the rules work without them by asking the nearest Figment of the plate's kind.

1. `tools/veritome/veritome.js` `photo.take` (afterRender): carry the best subject's `act` (`c.brain?.action?.id`) and `lured` (`game.safari.luredNow(c)`), `score` as now. Stars: the plate should show `safari.plate`'s `stars` (the behaviour's), not `q.shot.stars`; `candid`'s multiplier on the score stays as it is (the score is the framing's readout).
2. `tools/veritome/subjects.js`: the Lantern Wisp as a subject with kind `wisp` (STEALTH.md 7), if not yet there.
3. Rare finds and night variants (`world/dunes/rarefinds.js`, the areas' build): gate on `game.safari.open(area, 'rare')` and `open(area, 'night')` (research level 3 and 2). `safari.js` `AREA_KINDS` is a placeholder for which Figments live in which area; correct it when the areas hold their creatures.
4. A lure's input: no tile exists. `/lure <feeling>` (chat) lays one 4 m ahead. A Veritome lure verb (R sub or a PAINT-style aim) is a touch design to settle (G244 NEEDS).
5. Scent on the wind: `scentReach(windSpeed, poolFill)` is ready; it needs an island wind. Until then it is 0.
6. `game.safari` is in `boot/progress.js`, registered in the `world` phase beside `stealth`.
