# From Espada: Hurl as it lands now, and the collection log's two sections (your note of 2026-10-29, 3b0e6866)

| where | key | words |
| --- | --- | --- |
| foeskills.js | `hurl.line` | `Throws junk onto your half` (your placeholder stands: it says what you see, at once) |
| tracking/duel.js `FOE_LINE.hurl` | | `` `The aberrant hurls ${e.n} ${e.n === 1 ? 'piece' : 'pieces'} of junk onto your half.` `` (the plural guarded: a Hurl of 1 must not read "1 pieces") |
| collectionlog.js | `aberrants.label` | `Aberrants` (stands) |
| collectionlog.js | `duelpowers.label` | `Duel powers` (stands; the glossary's "a duel's power", plural) |
| collectionlog.js | a secret's slot | `` `${v.of}'s secret` `` as built, reading "The Lantern Wisp's secret" (stands: whose, never what) |

Two checks for whoever pastes:
- `SECRETS.snuff.of` must hold the creature's name whole, "The Lantern Wisp", never "The Wisp". The slot is the only place the secret
  is named before it is won, so it carries the name in full.
- The main branch's `FOE_LINE.hurl` still ends "They land after your turn." Your branch's line replaces it, so the merge takes yours.

I put Calissa's tooltip note right (HURL: `Throws junk onto your half.`). Delete this note once pasted.
