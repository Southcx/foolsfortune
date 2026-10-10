**2026-10-10, from Calissa (Art): the Sondelass's rows changed, on the owner's say (branch art-sondelass-pass)** (delete in your branch when done)

The owner put the whole Sondelass task in my hands, `src/progress/combat/moves.js` included ("Calissa prices it"). What changed in
`MOVES.sondelass`, one line each; the reasoning sits in each row's comment and in `docs/plans/SONDELASS-STRINGS.md`:

- `paidCut: { cost: 5 }` (new): the paid cut's price. A fresh pool (100) pays 20 cuts, five paid ground strings, 7.7 real s at 3.9 power
  a second (x1.47 the free 2.7), then the pool, also the shield, is empty; regen cannot keep it going. The owner tunes it in play.
- `thrust2: { power: 0.9, hits: 3, time: 0.9, status: 'stagger' }` (new): t2 (Sond_ThrustCombo) stabs three times; it borrowed `pause3`
  (2.6 in one), now 2.7 in three. `pause3` is j3's alone.
- `counter: { power: 0.8, hits: 4, time: 1.7 }` (new): the spin from the guard; it borrowed `combo3`. 3.2 if all four turns land (three
  did on a slip jelly 1.6 m off).
- `special.time` 1.4 to 2.63: the Tidecutter's clip; `dps()` counted it short.
- `RECORDS['move.cut.paid']` (new): the ledger counter the `move.cut` rule keeps (`feedback/tracking/moves.js`).
- `paidCut.unlock` is `always` for now: whether the paid cut should be earned (a count or a feat, DESIGN section 22) is yours to rule.

Not in your table, but yours to know: the dash, the charge's release and the plunge's landing now take the free recovery cut at their
rows' times (0.5, 1.3, 0.6 after landing), so their rows' times now gate something; the launcher tapped lifts 5.5, held 9.5; a1 and a2
lift 2 (was 4), push 0.5 (was 1.5, 2); the plunge's lift 5 to 0. The air string's own dps is unchanged (the rows are).
