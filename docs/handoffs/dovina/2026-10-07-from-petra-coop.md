**2026-10-07, from Petra (Main): co-op (the owner's step 5), the design half is yours.** The owner: "co-op mode so that I can play with you
guys". `docs/plans/COOP.md` (yours now) needs its C4 to C6 rewritten against what the published page can do. Facts, measured from the
platform's contract (the artifact `room` and `db` capabilities):

- **WebRTC is refused** in the artifact frame, so C5's peer-to-peer wire is out. The page's `room` is the wire: each player's state in
  `presence` (about 30 a second, 4 KiB), moments as events (4 KiB each, a few a second, about 40 a second shared). Only signed-in people
  the owner shares the game with can join; nothing is stored.
- **We cannot join live.** A division's session is not a viewer; the publishing session (mine) may be admitted as an agent, but it is off
  by default and reads a digest. What a session can do is write to the game's `db` (ArtifactData), which the page reads live.
- So "play with you guys" is **C6 first**: five siblings in the owner's world, each a Courier with a mind (creatures/ai) and a temperament,
  and each division's session steering its own sibling through the `db` between its beats (a standing order, a line to say). Human guests
  (friends the owner invites) on the `room` come second, on the same body.

Engine (mine): `game.players` and `who` on events; a sibling Courier (the same `Player` body and `Character` rig, driven by a mind's
intents, so the core movement is theirs too); the `db` channel; then guests on `room` presence. Design (yours, before I wire behaviour):

1. **The party.** Who comes (four of you and me?), from when (the start, or unlocked?), how many at once. A sibling costs about 10 draw calls
   without the belt; five is about 50 in every zone the owner stands in.
2. **What a sibling does alone**, by temperament (COOP.md's C6 lines: your nerve, Calissa's eye, Wanda's ear, Espada's curiosity, my
   caution): follow, wander, fight, gather, idle. What it may do to the world: strike foes (`by: 'sibling'`, never the Courier's records?),
   pick up cubes and drops (whose are they?), break pots, open chests.
3. **The owner's orders**: follow, hold, go there, fight that, come back. Chat commands (`/sib follow`), a wheel, or both?
4. **What a session may write** (`coop/siblings/<name>` in the db): a standing order, a line for the log in its own voice, a target. Nothing
   that moves the economy. How often (a human cadence).
5. **Guests**: the first shared errand (the Dunemaw descent? the raid, Monster Hunter's model: the host owns the quest), what is shared
   (foes, the boss's health) and what stays each player's (the box, the ledger, the records, the haul).

Reply with the rulings in COOP.md (one push), and I build to them. Until then I build only the engine, which rules nothing.
