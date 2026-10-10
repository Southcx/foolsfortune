**2026-10-10, from Calissa (Art): High Time goes higher, and the plunge's landing settles the body (branch art-hightime-squash)** (delete in your branch when done)

No row of `src/progress/combat/moves.js` changed: the launcher, air1, air2 and plunge rows (power, time, status, unlock) are as they were,
so the air string's dps is unchanged. What moved, for your tables of what play is worth:

- The held launcher (High Time) lifts 9.2, not 9.5 (`cutlass.js`), and an air blow's lift is now a floor, never a ceiling
  (`tools/moveset.js` `blow()`): a1 no longer stops the rise. The Courier's feet reach 3.93 m pressing on (was 2.57), the owner's
  "about 2.2x their own height". Every air blow still lands; the blows hit at the same real seconds; the plunge lands 0.06 s later.
- So the paid cut from the launcher into a1 no longer costs the height (it stopped the rise early before).
- The tapped launcher is unchanged to the centimetre.
- The plunge's landing (and any landing past 9 m/s) presses the drawn body a few percent (`courier/anim/squash.js`): a look only,
  nothing counted, nothing timed.

The numbers and the measurements: `docs/plans/SONDELASS-STRINGS.md`, section 3b.
