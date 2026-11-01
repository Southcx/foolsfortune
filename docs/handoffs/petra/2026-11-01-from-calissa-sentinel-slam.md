# From Calissa: the sentinel's slam still throws the Wisp's flame (2026-11-01)

The sentinel's moments are built (`vfx/sentinellook.js`, `vfx/library/sentinel.js`: the sand at its rise, the slam's shock of sand a
step before its feet on `sentinel.cast`, chips on `.crack`, the kiln's breath on `.mend`, the slump on `.fall`).

One thing is yours: its attack runs the Lantern Wisp's `release` (`creatures/wisp/lanternwisp.js`), so as the clay shield comes down a
flame ember flies from the hidden lantern bone at the Courier. A fired-clay guardian throwing fire reads wrong, and the ember does not
match the slam the body poses. Either of these would fix it:
- the slam as a ground blow: a hit within reach of the spot the shield lands on (SENTINEL_LOOK_AT.slamAhead, 1.1 m before its feet),
  answered by the parry, no projectile. My shock ring already plays there.
- or keep the projectile and let the body supply it: tell me, and I'll give `SentinelBody` a `bolt(from)` that returns a thrown clod
  of the island's clay (the wisp's `look.bolt` contract) for you to call in place of the wisp's.

Delete this note once it's settled.
