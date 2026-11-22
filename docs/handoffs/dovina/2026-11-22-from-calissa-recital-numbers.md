# From Calissa (cups): the combat recital's numbers, for your ruling

South asked (2026-11-22) for the Crucibelle's combat recital to fight like a live set. The moves are built in
`src/tools/crucibelle/recitalplay.js`; every number is in one table, `RECITAL_PLAY`, and the strum's base stays in `RECITAL`
(`recital.js`). All are proposals. Distances in metres, times in real seconds, power in `creatures.strike`'s units (the strum's
`RECITAL.power` 0.9 is the yardstick).

## A lick (a note on the beat throws a homing ball of sound from the amp)
| key | value | why |
|---|---|---|
| `lick.reach` | 14 | past the strum's 8 m: the lick is the ranged poke, the strum the close blow |
| `lick.cone` | 0.75 rad | about 43 degrees each side of the aim, wide enough to find a foe without aiming, so the keys stay musical |
| `lick.speed` / `speedHigh` | 24 / 32 m/s | lands inside a beat at 120 bpm from 12 m; the upper register (6 to 0) quicker |
| `lick.power` / `powerHigh` | 0.35 / 0.25 | five licks to a bar come to about two strums: a melody line should not out-hit the chord |
| `lick.stun` | 0.08 | a flinch, never a stun-lock on its own |
| `lick.life` | 1.1 | a bolt whose foe died or ran fades out |
| `lick.land` | 0.45 | landing radius past the creature's own |

Off the beat no bolt flies; the note still sounds (the fever's penalty is the judgement, unchanged).

## The strum chain (LMB on the beat, a beat apart)
| key | value | why |
|---|---|---|
| `chain.range0`, `cone0`, `stun0` | 8, 0.9 rad, 0.25 | the strum as it stood before this round |
| `chain.gap` + `slack` | 1 beat + 0.17 s | quarter notes chain at any tempo; the slack is twice the bell's WINDOW |
| `chain.cone` / `range` / `power` | +0.16 rad, +1 m, +22% a step | step 3 is about 1.44x and 10 m: a clear, felt growth |
| `chain.max` | 4 | a bar of four, so the windmill lands on the bar's last beat |
| `windmill.range` / `power` / `stun` | 7 m all round, 1.9x, 0.5 | the payoff: a ring that clears what closed in, the chain starts over |

An off-beat strum drops the chain to 0. RECITAL.cool (0.28 s) still limits presses.

## The feedback (LMB held past a strum)
| key | value | why |
|---|---|---|
| `feedback.after` | 0.35 s | longer than a tap, shorter than a beat at 96 bpm |
| `feedback.range` / `width` | 10 m / 1.3 m | a lane, short: it holds a corridor, it does not snipe |
| `feedback.power` / `stun` | 0.3 / 0.06 a beat | about a lick a beat with no keys pressed, paid for by the drain |
| `feedback.drain` | 4 Lachryma a real s | through `lachryma.drain`, tag `feedback`; dry, it stops and the log says so |

## The rockstar moment (the fever's peak while plugged in)
| key | value | why |
|---|---|---|
| `rockstar.dur` | 1.5 s | the body's kneel and the lights; the blow itself is still your `feverPeak` row (`crucibelle.js peak()`), unchanged |

Ledger counts added (feedback/tracking/crucibelle.js): `bell.lick`, `bell.lick.hit`, `bell.windmill`, `bell.feedback`, `bell.rockstar`,
the record `bell.strum.chain`. The log says "Rockstar!" at the moment (a placeholder for Espada). Nothing is unlocked by achievement yet:
your call whether the windmill, the feedback or the rockstar moment should be Arts opened by play.
