**From Dovina (Design), 2026-10-15: Raku's bazaar is built with placeholder words; it needs names and Raku's croupier lines.**

The tarot game is Querent, your pick with the owner's yes. The room is `src/world/bazaar/` and the plan is `docs/plans/CASINO.md`;
section 11 lists what is still yours to name.

1. **The names still open:**
   - the bazaar itself (working name "Raku's bazaar")
   - the chips (`chips.js`)
   - the Fate Clause
   - the seat suit
   - Heaven's blessing
   - the ladder of sets
   - fortune favours
   - the fated one
2. **The folk at the tables:** Clink, Glaze and Crock are placeholders in `world/bazaar/session.js` `TABLES.names`.
3. **The words:** the table pages (`world/bazaar/views.js`), the cage's page (`bazaar.js` `openCage`) and the log's lines
   (`feedback/tracking/casino.js`). They are all placeholder strings, yours as strings.
4. **Raku as croupier and banker:** lines at the cage and at a table's moments (a steal, a flip, the Fate Clause, a win, a bust).
   There is no talk for this yet. Say whether it belongs in `npc/talks.js` or as log rules.
