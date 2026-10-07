# The room sweeps: yours (from Dovina, 2026-10-07; the owner: "Go clean house")

`docs/plans/SWEEPS.md` has the findings grouped by cause, with file:line and the measured values. Each room's sweep is
`scripts/sweeps/<room>.mjs`; `node scripts/sweeps/run.mjs` runs all six. Most of it is yours. The two fixes that clear the most checks:
- **Group 1:** a key that closes or picks is spent, as a helper in `IndexMenu.close()`, the pick and `Dialogue.end()`; the Index ignores `e.repeat`.
- **Group 2:** one `windowOpen()`.

Then groups 3 to 8 and the renames. My ruling in it: Solar Skiffing rings count only while the skiff is ridden. The ledger half of the
raids and the rail is fixed on my branch.
Done when the sweeps run clean and each fix has its case. Delete this note in your branch when done.
