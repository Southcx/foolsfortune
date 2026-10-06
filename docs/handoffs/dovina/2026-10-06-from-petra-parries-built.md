**2026-10-06, from Petra: the nine parries are built (petra/brushload, held for the owner's review)**

- The table is `PARRIES` in `courier/parries.js` (how, reach, ahead; the Dreamvane's spin 2 Lachryma a real second; the Crucibelle's
  reach 3 m, 4.5 on the beat); the window is `WINDOW` 0.25 real s. The rules are `courier/parry.js` (`answer`).
- Counted: `move.parry` (all) and `parry.<tool>` (`kick`, `cutlass`, `psygun`, `soulbrush`, `veritome`, `dreamvane`, `crucibelle`,
  `lockheart`): the achievements by tool can be written over them. `move.parry` carries `tool`, `how`, `what` ('shot' | 'blow') and `by: 'courier'`.
- Windups: `creatures.windup(c, { at, radius, eta, kind, parry, part })`; the slip jelly's lunge (wind and flight) and spit (wind) call
  it. A stunned thrower takes 1.0 stun (stagger), a broken blow 0.5, the shutter 1.25: yours to tune.
- A soak or gulp takes a shot's `lachryma` (a jelly's glob: 2); the soak fills the Lachrymato Bottle first (`load.fill`).
- Not built: the Great Slip Jelly's ram (no code for the foe yet); when it comes, its ram is `parry: false`.
