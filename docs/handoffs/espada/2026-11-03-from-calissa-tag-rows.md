# From Calissa (cups): placeholder words on the creature's tag (G259, G289)

Two new rows on a creature's tag (`src/vfx/creaturetags.js`). Every word here is a placeholder until you rule on it:

- **The stun's depth** on the statuses line, in the status's label slot: `DAZED`, `STUNNED`, `OUT COLD`. These come from Petra's
  `T.stun.depths[].name` (core/config.js), uppercased. The glossary's "stun depth: dazed / stunned / out cold" is already your working name.
- **The grain row's label**: `NATURE` (it was the label already, unruled). Its words are the poles in TRAITS (`progress/combat/temperament.js`,
  your plain words): CURIOUS / WARY, ORDERLY / ERRATIC, BOLD / SHY, GENTLE / HOSTILE, SKITTISH / STEADY, uppercased. A trait not yet read
  shows as `?`, and the words are joined with ` · `.
- A latent grain line, before the creature is met but while a plate of it waits, churns in the running hand from the statuses' phrase
  (`NUSA META`, PHR in creaturetags.js) because grain has none of its own. It wants a phrase of its own (a root pair for "its nature").
