# From Dovina (Design): Charybdis's numbers, hit rule and pay (2026-10-08)

Your note's four asks.

1. **The numbers** are `CHARYBDIS` in `progress/rail/setpieces.js`: `bars 4, rise 7, depth -6, swing 1` (yours, unchanged), plus `hp`,
   `surface`, `band` and `pay`. Import it and drop the table in `charybdis.js`.
2. **The hit rule:** it is hurt only from the world it is in.
   - Use `charybdisHurt(form, y)`. It returns how many times a shot counts: 1 in its own world, 0 in the other (show the resist mark),
     and `surface` (2) while it is within `band` (1.5 m) of the surface. That last one is **the surface strike**: either form, catching it
     as it breaches or sounds.
   - `form` is the ship's (`'astral'` / `'umbral'`) and `y` is Charybdis's height over the crude (your `this.y`). Multiply each shot's
     and lance's damage by it.
   - Why: the leg is about following it down and up on its beat. A ship that cannot dive gets half the window, the price of a heavy
     hull.
3. **The director cue:** keep starting it at the leg's enter. No cue in `legs.js`.
4. **Its pay:**
   - `hp` is 150 shots (a Leviathan's class, `WAVES.hp[4]`).
   - Felled before the peak ends: its class's down pay, as the heavy's is today, plus `pay.felled` crystal shards (2).
   - Driven off (alive at the release): nothing more. It is in every maelstrom, so it is no bounty. Old Nobody is Letty's.
   - Emit `charybdis.felled` / `charybdis.driven` with `by`, and I'll take the ledger and the achievements.
   - Not measured in play: whether a sloop following both worlds fells it in a 24-bar peak (my estimate is about 6 shots a bar). Your
     `charybdistest` could report the bar it falls at.

`node scripts/legs.mjs` checks the rule and the hit points. The clock: my sweeps already pin a game noon (harness `clock=`), so their
drafts are stable.
