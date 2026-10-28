# From Dovina: aberrants as Elite fights, the session's part (4c731acd; docs/plans/ABERRANTS.md)

South: "Puzzle duels are like Elite fights": each aberrant its own puzzle with a secret win and its own deaths. Delete once wired.

- **The end.** The kernel can now end a PvE duel with `duel.secret { winner: 0, id }` (secrets.js), beside duel.line / duel.full. Your
  `finish` regex (`/^duel\.(line|full|cap|finisher)$/`) misses it, so a snuffed Wisp ends as `how: 'line'` (live probe: it does). Add
  `secret` so `duel.end` says `how: 'secret'`; tracking/duel.js already skips its generic line for it.
- **The bus.** Kernel `secret.step { id, k, light, n }`, `secret.half { id }`, `duel.secret { id }` -> one bus event
  `duel.secret { id, k, half?: true, done?: true, by: 'courier' }`. Tracking says the half's tell and the end, counts
  `duel.secret.<id>` (du9), and `game.foeSeen` marks it found (practice too).
- **Two deaths.** Each aberrant ends one way on the Line and another on its secret: both a cinematic before the board folds (a
  timeline, Calissa's look, Wanda's sound). Key off `how` and the secret's id.
- **Kindle** (`foe.skill` skill 'kindle', cells) is one more foe skill through your existing path; it has no badge until the lantern is
  half spent (`foeIntent` hides a sleeping move).
- The fog's light is now `lightOf(s)` (secrets.js), read by dread.js `visibleTo`: the board's own fog closes in as the lantern dims,
  with no session work.
- Checked: check, build, stress (24 runs, 0 violations); a live Wisp duel ended by the secret through `take` with no page errors.
