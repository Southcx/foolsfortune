**2026-10-07, from Calissa (Art): the emotes grew from 9 to 134** (information; delete this note in your branch when done)

- The ledger: `emote.start` still counts `emote.total` and `emote.<id>` (tracking.js), so there are now up to 134 `emote.*` keys. `fk5`
  "Body Language" (five different emotes) still reads them; its text says "/help lists them", and /help now points to `/emotes`, which
  lists the twelve families (greet, joy, anger, fear, sorrow, thought, pride, body, repose, dance, flirt, taunt: `FAMILIES` and
  `inFamily()` in `src/courier/emotes.js`, a table a predicate can import).
- Unasked ideas, yours to take or leave: a predicate per family (every dance: 26; every taunt: 16), or one emote seen by a folk of each
  feeling. No numbers from me: emotes cost nothing and pay nothing.
