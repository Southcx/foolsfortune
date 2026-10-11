**2026-10-11, from Calissa (Art): the melee loadout's catalogue is in; here are the parents, yours to write the earn predicates (branch art-p3-moves)** (delete in your branch when done)

`SONDELASS_MOVES` (`src/tools/sondelass/sondelassloadout.js`) holds your slice: 12 normals, 6 specials. Every row has `earn: null` and its
`parent`. **How your earning lands:** `loadoutopen.js` `moveStatus` asks your `unlocked('sondelass', id, L)` (progress/combat/moves.js)
for any row your `MOVES.sondelass` holds under the catalogue's id (below) with an `unlock`; until then every move not in `STARTERS` stays
locked in STORY, and its card says only "Locked. Learned from <parent> (to come)." (NEW:say-only-what-happens). A row renamed: Guard
Break's id is `guardBreak` (was `shove`, the kick's move's id; a save holding 'shove' is read as it). The parents:

| move (id) | label | kind | parent | effect (status) | the feat its effect names, if you want one |
|---|---|---|---|---|---|
| quickSlash | Quick Slash | normal | c1 | stagger | |
| bodyBlow | Body Blow | normal | c1 | stagger | |
| backhand | Backhand | normal | c2 | stagger | |
| guardBreak | Guard Break | normal | c2 | guard break (stagger) | a blow through a guard |
| lungeSlash | Lunge Slash | normal | c3 | stagger | |
| lowSweep | Low Sweep | normal | c3 | launch (trip) | a trip |
| heavyChop | Heavy Chop | normal | c4 | knock (stagger) | |
| pushKick | Push Kick | normal | c4 | knock | a knock-away |
| spinSlash | Spin Slash | special | backhand | knock, all round | three struck by one |
| powerSlash | Power Slash | special | heavyChop | knock | |
| risingCut | Rising Cut | special | quickSlash | launch (airborne) | a launch |
| guardCrush | Guard Crush | special | stinger | guard break (stagger) | a blow through a guard |
| backstepSlash | Backstep Slash | special | c3 | stagger | |

What the ledger can already hear: `cut.hit { what, combo, move, by }` names the move (a normal's id, a special's id), so "60 landed hits
of its parent" is a count over `cut.hit` by `move` (the stinger's own hits carry `combo: 'stinger'` and no `move`); `move.special { tool, special, by }` names a special by id. Nothing new is emitted
for a guard broken, a trip or a knock-away: if a feat wants one, say which event and I add it at the blow (`tools/moveset.js` `blow()`).

**The numbers are in the rows' own `stats`** (the same shape as your `MOVES.sondelass` rows: power, hits, time, cost, status, plus
`range` for the card), read by the engine where no `rule` names a row of yours; take them into `progress/combat/moves.js` when you like
and give each a `rule` (the row wins). Your row rule holds, measured (SONDELASS-STRINGS.md section 7b): against today's string, 1.956
power a real second with a slip jelly (hit-stops in), every new normal in every slot is within -2.9% to +2.2%, the four slowest together
-7.7%, each blow alone -8.8% to +6.7%, and every new special -8.5% to +6.0% of its own time (a special is a burst for its Lachryma,
never more a second, as your Tidecutter's 2.66).

**One for you to rule:** the stinger is outside the band and was before phase 3. Its lunge strikes a creature at 2.2 x its row's 3.0
(`cutlass.js` `stingStep`: 6.6 in 0.38 real s, 17.2 a second measured), where its row says 3.0 in 0.7 s (4.29, +57% on paper). Left as
it is, since the default loadout must play as today's; if it should be its row's 3.0, it is one number in `stingStep`, Calissa's.
