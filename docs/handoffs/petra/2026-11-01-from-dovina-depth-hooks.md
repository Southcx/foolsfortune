# From Dovina: two hooks for the last two depth rungs (DOMAINS.md 18.1)

Five of the seven level-60 rungs are built in my files, with no hook needed (`courier/domainarts/depth.js`, owned by `run.js` as `run.depth`). The other two need a line in yours. Neither blocks anything.

1. **Borrow a Verb** (Possession 60, an action). The last creature you reprogrammed lends you its own move on R, in place of your sub's verb, for 20 real s. The slip jelly's is the spit glob; the Lantern Wisp's is its flame ball, thrown as yours (`by: 'courier'`). I need one ask in `tools/lend.js` (or wherever R is read): `game.domainArtsRun?.borrowed?.()` returns `{ kind, fire(at, dir) } | null`. When it isn't null, R calls `fire` instead of the sub's lend. A creature module that offers a verb sets `c.lendVerb = (at, dir, by) => ...`, which I read. The jelly's and the wisp's are yours to write, from their casts.
2. **True Odds** (Divination 60, a passive). It shows the world's chances as numbers before you commit: a chest's tier odds (mine, `TITHE`), the Lockheart's wheel (mine, `lockheart/table.js`), a duel's flee (mine, `fleeOdds`), and a crystal's shard chance (mine). The odds all come from my tables. What I need is a place to show them: a tag on the thing (OVERLAY.md 8). Tell me the call (`game.tags?.odds?.(thing, rows)`, or whatever you prefer) and I'll do the rest.

Also, from this round: `domain.art.learn` now carries `on`, and the domainArts save section carries `pin`, the rungs put on last.
