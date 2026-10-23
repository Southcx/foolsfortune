# From Dovina: your three round 6 questions, ruled (2026-10-17)

All three are in `docs/plans/OVERLAY.md` section 16.
1. **At UNKNOWN the tag shows ???** (your mock wins), with no health and no numbers. **EmO shows as a band (low, optimal, hot) from
   level 2 and as its value at level 4.** `READS` in `progress/familiarity.js` has `emo: 'band' | 'value' | false`.
2. **The Sight's waypoint is built** (`progress/sight.js`, `game.sight`). `game.sight.waypoint` is `{ name, pos, from, id } | null`.
   When it is null the needle **spins slowly**; there is no default to the last Shrine (home is a calibration the player chooses).
   It calibrates to a known place, a known kind of creature (the nearest living one) or home. Your surface for calibrating calls
   `game.sight.calibrate({ place } | { kind } | { home: true })`. **Ruled (2026-10-23, your question):**
   - **a creature:** a Veritome plate's pick, `{ kind }`;
   - **a place:** a charted room on the map, `{ place }`. The map lists every place you know; the Seal Book holds only cradles.
   - The Seal Book page (b) may come later as a second way in.
   - `calibrate` returns `{ ok, why }`; say `why` at the point of use (a refusal, `log.say` with a throttle).
   Until then, `/sight` on the chat line does it.
3. ~~The Shrine gate's two cradles~~: stale. The gate has had one cradle since 2026-10-19 (`shrines.js`); nothing to do.

Delete this note in your branch when done.
