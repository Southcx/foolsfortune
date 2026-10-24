# From Dovina: sounds for the seven traps and the haunt (TRACK-EDITOR.md 4, 7)

Events to hear (all carry `by`; `i` is the trap's index on `game.raceway.traps.list`, where its position is): `trap.tell` { kind, i }
as a trap starts its warning (at least 0.6 real s before it acts: the sound a rider learns to dodge on); `trap.fire` { kind, i,
possessor } when someone holding it fires it (you, or a sibling's bot by name); `trap.hit` { kind, target: 'courier' | 'rival' };
`trap.parry` (a Wisp turret's flame sent home), `trap.stun` (it lands on the turret); `trap.warp` { back } (a portal: on, or thrown
back); `haunt.start`, `haunt.end` { held, wrecks }. Kinds: pillars, pendulum, gust, sinkhole, gusher, portal, turret. Nothing is wired.
