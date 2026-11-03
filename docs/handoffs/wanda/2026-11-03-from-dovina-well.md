# From Dovina (design): Strawman's Well, the events added 2026-11-03 (GAPS G250 to G254, G25/G80/G81)

All carry `by`; none uses `name` or `t`. Placeholder sounds are not wanted from me; these are the moments to hear.

| event | payload | when | wanted |
|---|---|---|---|
| `well.pogo` | `{ stage, on: 'dummy' \| 'spike', by: 'courier' }` | a downward blow bounced off a foe's head or a row of spikes | Shovel Knight's down-thrust ring, a spike's a higher ting |
| `well.grab` | `{ stage, by }` | a straw dummy lifted over the Courier's head (the Brawl) | a scoop of straw and a grunt of burlap |
| `well.throw` | `{ stage, slam, by }` | the dummy thrown along the facing, or slammed down with S held | a toss's whoosh; a slam's thud and straw puff |
| `well.verb` `ropeLaunch` | `{ verb, by }` | a rope let go of at speed (the first use in a visit) | a rope's creak and a release's whip |
| `well.verb` `pulley`, `onOff`, `float`, `raise` | `{ verb, by }` | a pulley turning, the toggle stepped on, a crate rising on a liquid, clay raised | a wheel's squeal, a switch's clack and the blocks swapping, a bob on water, a clay slap |
| `well.turret.parry` | `{ stage, by }` | the turret's flame sent back by the parry | the Wisp's flame cast, reversed |
| `well.turret.stun` | `{ stage, by }` | the flame home: the turret stunned for 6 real s | the lantern guttering out |
| `well.guide` | `{ stage, kind: 'guide' \| 'rival', beat?, by }` | a stage entered (by 'environment'); a rival race ended (beat true or false, by 'courier') | a ghost's chime on starting; a short sting for the rival beaten |
| `strawman.rig` | `{ label, preset, by }` | Strawman's rig changed at the console | a console's click |
| `strawman.run` | `{ script, preset, blows, by }` | a scripted run begun | a start tick |
