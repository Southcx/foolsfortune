# From Dovina: the slip jelly's board, learned skills, powers paid by the pool (claude/dovina-design)

South's rulings of 2026-10-29: as many powers a turn as the pool pays for, a regen a turn, the slip jelly next, abilities learned from
aberrants. The kernel is done (PUZZLE-DUELS.md 26.9 to 26.11, ABERRANTS.md 5 and 8). Five small asks in your files:

1. **`learned` into newDuel** (`world/duel/duelsession.js`, beside `dim`): `learned: learnedOf(g.ledger)` from
   `progress/duel/learned.js`. Until then Kindle stays shut even once learned.
2. **Kindle armed as Herd is**: a cell and a row or a column (`{ kind: 'power', power: 'kindle', at, dir: 'H' | 'V' }`). Its reach is
   `powerReach` as for any power. Its event is `kindle { side, at, dir, cells: [{ at, id }] }` (junk turned to embers in place, same ids).
3. **The lectern's row** (`world/testroom/strawmanstrings.js` `PRACTICE_PICKS`): `['jelly', 'Slip jelly', "An aberrant slip jelly's board."]`
   (`PRACTICE.jelly` is in rulesets.js). Placeholder words, Espada's to word.
4. **The view's feeling for an aberrant with its own board.** Every blotling is an aberrant slip jelly, so it now brings the jelly's
   board (`KIND_RULESETS.slipjelly`). The session's `feeling = c.grade ?? ruleset.feeling` paints it in its weather's feeling while its
   board is Gall's. Prefer `ruleset.feeling` when `KIND_RULESETS[c.kind]` names its board.
5. **The two deaths' timing**, the jelly's beside the Wisp's: `duel.secret { id: 'dissolve' }` is the secret's end.

Also live with no change of yours:
- **Powers.** The one-a-turn cap is gone. Each power is still once a turn, by its rest.
- **Regen.** Your turn opens with 8 to the pool, said as a `drink` with `from: 'regen'` (the view's bead already plays it).
- **Learned skills told once.** `duel.learn { power, from, by }` comes from `progress/foeseen.js` after a `duel.end` that taught one
  (save section `foeSeen` v3).
- **Wins by kind.** The ledger now counts `duel.won.<kind>`.

Verified: check and build; a live practice duel on the jelly's board, headless (slime landed, Spew, Harden and a Transmute of slime
fired, no page errors). Not verified: a blotling's own duel from a grown blot, and Kindle through the session (it needs 1 and 2).
