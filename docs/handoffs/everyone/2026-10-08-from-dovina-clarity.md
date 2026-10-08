# From Dovina (Design): clarity, a slim glossary, a wiki (2026-10-08)

The owner, looking at the pier's mount list: "None of those entries tells me jack diddly about what they do mechanically." His order: the game
must be readable at a glance, by genre convention, and shown more than said. The docs too.

**Landed on `claude/dovina-design`:**
- **`docs/plans/CLARITY.md`**, the rules for anything the player reads:
  - a genre-word label in the UI; the lore name only in the world and the Codex;
  - the card in place of the row: an icon, a label, one line of 8 words, stat chips, the key, the state;
  - keywords with icons; real seconds as the only clock;
  - a preview in the world before text.
  - **`scripts/clarity.mjs` checks it.** It covers my tables so far: the mounts and the garden's features.
- **The UI audit**, `docs/plans/research/UI-AUDIT.md`: every window's rows, scored for jargon, and the 15 worst with rewrites. Its root cause
  is that every page is one row template (`indexmenu.js` `showPage`: a glyph, a title, a grey sentence), so everything becomes prose. The card
  is the fix.
- **The glossary** is now 5,900 words, one line a term. The full text is in `docs/GLOSSARY-DETAIL.md`, not loaded. Read your section and
  tell me what I cut wrong. The report is `docs/plans/research/GLOSSARY-SLIM.md`.
- **The README** is one screen. Its manual moved whole into `docs/wiki/`, which becomes one page a system in plain words.
- **`docs/plans/DOCS-CLEANUP.md`** lists the doc work by owner.

**Asks, by owner:**
- **Petra:**
  - `indexmenu.js` grows the card (CLARITY section 4) beside the row, and the pier's mounts and sea chart move to it first.
  - `hand.js`'s place page shows `FEATURES[id].name` (a label now, in my table) in place of `FEATURE_NAME`.
  - The casebook split and the merges in DOCS-CLEANUP.
- **Calissa:**
  - the card's look;
  - icons for the keywords (CLARITY section 5) and the seven mounts;
  - the world preview at the mooring (a mount's cone or ring drawn on the moored ship);
  - LOOK into ART, the overlay and sunshine merges.
- **Espada:**
  - settle the labels (CLARITY section 9: Blaster, Grapple, Absorb Spray, Bomb, Vacuum, Snapshot, Radar; the garden's features);
  - the plain-words rule for the log;
  - LORE section 11 folding into the wiki as names settle.
  - Note: "blot" is now ruled the player's word, and the code keeps `stain`.
- **Wanda:** OST sections 6 and 7 and `voice_recording.md` to the archive when you're ready.
