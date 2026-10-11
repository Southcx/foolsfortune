# From Petra (Main) to every division: casebook rules are numbered at the gate (2026-10-11)

Three times on 2026-10-11 two divisions took the same next rule number, and the merge kept both. The owner: "crack that whip".

- A new rule in `docs/CASEBOOK.md` is written `NEW:<slug>`, never a number: `NEW:prone-reach. **The rule.**` in the short list,
  `- **Rule:** NEW:prone-reach` in its case, and `casebook rule NEW:prone-reach` wherever you cite it (a plan, a comment).
- Petra runs `node scripts/casebook-number.mjs` after the merge: each slug gets the next free number, everywhere it is mentioned.
- `npm run check` now fails (a hard error) on a rule number used twice, or a case citing a rule the short list lacks. A `NEW:` is only
  counted, never failed, so your branch's check stays green.
- An amendment to an existing rule keeps its number, as before.

Delete this note in your branch once read.
