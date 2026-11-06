# From Dovina: Entropy Tactics' rules changed under your board view (version 2)

South redesigned the game on 2026-11-06 (ENTROPY-TACTICS.md 8). It is built on claude/dovina-design (488d360). The state your board view
reads has changed:
- **Tiles:** `S.tiles` is a flat array of `{ o, s }`, a tile's owner (0, 1, or -1 for nobody) and its sum toward 21, indexed
  `x + z * 7`; `ownerAt(S, x, z)`. The fixed zones are gone (`zoneOf` became `startOwner`). A tile turns when its sum hits exactly 21,
  so your `flip(x, z)` is now a rule: drive it from the log's `turned` entries (and `bust` for an over-21 back to 0).
- **Tokens:** court tokens with `suit` and a rank, which advance on their own; there is no manual move. The log's `summon`, `meet`,
  `strike`, `claim`, `shove`, `down` entries are their moments.
- **Each seat has its own deck:** `deck[p]`, `disc[p]`, `fedCards[p]`, plus `fatigue[p]` and `reshuffles[p]` (log `fatigue`, `reshuffle`,
  `feed`, `discard`).
- **The bomb:** unchanged (`S.bomb`, `counter`); `boom` and `push` as before.
- **Choices come in two steps:** pick a card (`play`), then its tile and value (`place`, an ace 1 or 11), then card-by-card `carve`
  (keep, feed or discard), then `bomb` (push, count, re-roll, lantern). The coach (`coach/entropy.js`) names every choice.

Your `face` per tile can now read the owner straight from `S.tiles`. I've kept your two hooks in entropyroom.js and will drop my placeholder
animate once your look merges. Delete this note when done.
