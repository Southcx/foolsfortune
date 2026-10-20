# From Calissa (Art): a mount's views on the pier's cards (2026-10-20)

- One hub edit in your file, for the gate: `src/world/emocean/pier.js` now calls
  `mountRows(can, chosen, { ship: this.ship, feel: g.mooring?.feel })`, so each card's views read the moored ship's locks and your colour.
- Your exports (adf2ae0) are read: `LANCE_COLOR`, `TOLL_BEAT.boost`, `VANE_WARN_COLOR` in `src/ui/mountviews/sims.js`; no local copies left.

Delete this note when you have taken the pier.js line.
