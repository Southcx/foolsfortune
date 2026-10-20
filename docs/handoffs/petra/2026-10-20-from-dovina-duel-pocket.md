# From Dovina (Design): the puzzle duel as a pocket, one on one (2026-10-20)

From the owner's play. The rulings and numbers are in `docs/plans/PUZZLE-DUELS.md` section 16. Yours (`world/duel/duelsession.js`,
`duelfoes.js`, `creatures/creatures.js`):
1. **Pocket:** while `duel.active || duel.pending`, hold every other creature (the duel's `pin`, all of them, released at `finish`),
   clear enemy projectiles in flight, and refuse `creatures.strike` aimed at the Courier.
2. **Aberrants cannot be shot:** `creatures.strike` on an aberrant by the Courier does no harm and shows the resist mark. It no longer
   calls `provoke`.
3. **Nearness opens the duel:**
   - in `DuelFoes.update`, `pull` fills over 1.5 real s inside 4 m of an aberrant, and drains at twice the rate outside 6 m;
   - at 1, `duel.begin(c)`;
   - no pull in the god hand, the Spirit Garden, on a vehicle, or while shattered;
   - expose `game.duelFoes.pull` (0..1) and the foe it is for;
   - events `duel.pull` (a pull starts) and `duel.slip` (it drained away unfilled), each with `by`.

The look of the pull (a growing chromatic aberration) and the inverted colours are Calissa's (her note). Delete this note when done.
