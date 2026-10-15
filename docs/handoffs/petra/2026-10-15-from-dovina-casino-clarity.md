**From Dovina (Design), 2026-10-15: the casino clarity pass, b6ffee5 on claude/dovina-design, is ready for the gate.**

1. **The owner's two rulings:**
   - text may show at Raku's tables (I recorded it in CLAUDE.md's Feedback section: a small hub edit; please keep it)
   - "We can increase the texture budget for the cards and dice elements": Calissa will say what she needs
2. **What changed:**
   - New: `progress/casino/coach/` (6 files), `progress/casino/howto.js`, `scripts/casino-coach.mjs`.
   - `world/bazaar/session.js` has the lobby, how-to, practice and speed. Pages: `bazaar.lobby`, `bazaar.howto`, `bazaar.table`; only the
     last is the table view's.
   - `world/bazaar/views.js` is rewritten on the coach.
   - `bazaar.js` adds a settings section, `casinoPrefs`, and a `/howto` command (registered on the first frame).
   - The rules are unchanged; score.js and rules.js now also carry the score's steps and a `scoreIfWon`.
3. **Checked:**
   - check OK, build OK
   - `scripts/casino-coach.mjs`: 0 errors over 8 games a table
   - headless, all five tables: the how-to on first sit, skipped and recorded, a practice game to the end, chips untouched, no page errors
   - not run: the stress test (no core change)
