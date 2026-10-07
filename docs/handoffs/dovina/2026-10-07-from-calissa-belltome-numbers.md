# From Calissa (Art): the numbers in the toll string, the flail and the book bash (proposals, yours to rule on)

The animation overhaul put three held tools on the combo engine (`src/tools/moveset.js`). Every number below sits in the tool's own
table with a one-line reason; none is tuned against play yet. Delete this note in your branch when ruled.

## The Crucibelle's toll string (`src/tools/crucibelle/crucibelle.js`, `MOVES`)
- Four tolls on LMB pressed in time: toll, t1, t2, t3. Each is the old toll (stun `0.22 * k` s, knock `2.5 * k`, clapperjar knock
  `5 * k`; `k` as before: x1.4 on the beat, x(1 + fever)) times the move's own `k`: **1, 1.15, 1.3, 1.8**. Reason: the string should pay
  for keeping time, and the last is the one the player works for.
- t3 rings all round them: cone **pi** (was 1.1 rad), reach **5.2 m** (was 4.2). Reason: the overhead slam reads as a ring, not a cone.
- The old cooldown (0.4 s between tolls) is now the chain window: the next toll may begin **0.3 s** after the last (`chain[0]` minus
  `from`). Reason: eighth notes up to about 100 bpm, quarter notes at any tempo. Spamming is no faster than before in practice (a
  single toll lasts 0.57 s if the string is not continued).
- Unknown: whether four stuns stack too long on one creature at full fever (0.22 x 1.4 x 2 x 1.8 = 1.1 s for t3 alone).

## The Lockheart's flail (`src/tools/lockheart/lockheart.js`, `MOVES`)
- Tap LMB (released inside **0.16 s**, the cutlass's RMB tap) for the flail; held, the hoover as it was (it now begins 0.16 s later).
- Three blows: power **1.0 / 1.3 / 1.8**, damage **0.8 / 1.1 / 1.5**, push **3 / 2 / 7**, lift on the second **2.5**; `k` 1.2 (the club's
  is 1.2 too), pot damage **40** a unit (the cutlass 62, the club 30). Reason: a coffin is heavier than it is sharp; the third is the
  whirl that throws them off.
- Unknown: whether the flail should feed the coffin (a hit drinking Lachryma) or cost it. Today it does neither.

## The Veritome's book bash (`src/tools/veritome/veritome.js`, `MOVES`)
- Two blows on LMB with the lens down: power **0.9 / 1.2**, damage **0.7 / 1.0**, push **2.5 / 5**; `k` 1.0, pot damage **30** a unit.
  Reason: a book is a poor club; it is there so the scholar is not helpless, not to replace the Flash.

## New ledger keys (`src/feedback/tracking/heldstrikes.js`)
`bell.string.<move>`, `lockheart.swing`, `lockheart.swing.<move>`, `lockheart.hit`, `lockheart.hit.<what>`, `veritome.swing`,
`veritome.swing.<move>`, `veritome.hit`, `veritome.hit.<what>`; firsts `bell.string`, `lockheart.flail`, `veritome.bash`. No
achievements were made of them.
