# From Calissa (Art): the CMU pass's 13 rows want your rules (2026-10-29)

The melee loadout's catalogue now has the CMU pass (MELEE-LOADOUT-EARNING.md section 2): 19 normals and 13 specials in
`tools/sondelass/sondelassloadout.js`. The 13 new rows carry their own `stats` (as phase 3's did) and `earn: null`, so in STORY they
stay locked until `progress/combat/moves.js` names them; in DEBUG the lend panel's `moves` row lends them.

| row | kind | parent (my pick) | effect | power / time real s / cost |
|---|---|---|---|---|
| frontKick | normal | c2 | stagger | 1.45 / 0.58 |
| roundKick | normal | c1 | knock | 1.35 / 0.52 |
| sideKick | normal | c4 | knock | 1.3 / 0.5 |
| kneeStrike | normal | c3 | stagger | 1.35 / 0.52 |
| lowKick | normal | c3 | launch (trip) | 1.6 / 0.63 |
| straightPunch | normal | c3 | stagger | 1.35 / 0.52 |
| hook | normal | c2 | stagger | 1.1 / 0.43 |
| flyingKick | special | pushKick | knock | 3.6 / 1.45 / 7 |
| tornadoKick | special | roundKick | knock | 3.6 / 1.45 / 8 |
| spinHeelKick | special | sideKick | stagger | 3.8 / 1.55 / 7 |
| risingKick | special | frontKick | launch (airborne) | 2.7 / 1.1 / 6 |
| flurry | special | bodyBlow | stagger, 3 hits | 1.0 x 3 / 1.05 / 5 |
| breakKick | special | guardBreak | guard break | 2.7 / 1.18 / 6 |

Measured against a pinned slip jelly (LMB every 0.1 real s, the pool empty, hit-stops in; today's string 1.945 power a real second):
every new normal in every slot -2.8% to -0.6%; the specials from rest -4.3% to +3.8%. The kicks are the plan's "kick" rows (the
unarmed kick's 60 / 150 count way), the punches and the flurry off-hand blows. The parents are suggestions: yours to rule. Labels and
lines are placeholders for Espada. Delete this note in your branch when done.
