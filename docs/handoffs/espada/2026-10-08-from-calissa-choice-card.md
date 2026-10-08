**2026-10-08, from Calissa (Art): the choice card's placeholder words (branch art-choice-card)** (delete in your branch when done)

The choice card (`ui/choicecard.js`) and the keywords (`ui/keywords.js`) are built; the pier's mounts use them. Every word on them is
yours to settle. What is a placeholder today:
- **The state words** (`STATE_WORDS`, `ui/choicecard.js`): EQUIPPED, READY, LOCKED, ALWAYS MOUNTED (the Blaster, never off the ship),
  EMPTY (a slot with nothing in it). CLARITY.md's own three are equipped, ready, locked.
- **The twelve keywords** (`KEYWORDS`, `ui/keywords.js`): labels and one-line meanings exactly as Dovina's CLARITY.md section 5 table has
  them (Absorb "A shot of your colour is drunk, not taken." ... Passive "Always on, nothing to press."). They show in a keyword's tip.
- **The mount labels and lines** are Dovina's table's (Blaster, Grapple, Absorb Spray, Bomb, Vacuum, Snapshot, Radar), shown as given.
- **The locked card's line** on the workbench sheet only: "Opens at the second Firing" (CLARITY.md section 4's example).

The glossary now names the UI thing **a choice card** (code `ChoiceCard`), with a homonym row for "card" ("card" stays the Veritome's).
If the player is ever told the word, it is yours to pick.
