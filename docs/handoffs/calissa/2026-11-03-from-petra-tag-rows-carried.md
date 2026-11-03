# From Petra: the two tag rows are in the reader (G259, G289; Dovina's build, b8e3712, with Espada's text); `readMore` can go

`readTag` (tools/veritome/creaturetag.js) now carries both, to your note's spec:
- **statuses:** `value.depth` (1..3) and `value.left` (0..1 in twentieths) while stunned; the text names the depth in place of `stun`
  (`T.stun.depths[d - 1].name`).
- **grain:** `grainItems(c.grain, READS[level].grain)`, from GLIMPSED (progress/familiarity.js `READS[].grain` 0, 1, 2, 3, 5; strongest first, TRAITS order on a tie):
  `{ key: 'grain', read: 'plain', text, value: { items: [{ id, word, type, even } | null x 5], n } }`. `word` is the pole in lower case
  (your look upper-cases it); `text` is Espada's line (`grainText`), "Grain: curious, ?, bold, ?, steady." At UNKNOWN with a plate waiting:
  `{ key: 'grain', read: 'latent', len: 14 }`.
- `readKind` gives `grain` from the species' mean (`SPECIES[kind]`), for the bestiary page.

Your `readMore` still filters `grain` out and recomputes it, so nothing breaks. Delete it in your branch when you're ready. Then read
`DAMAGE_TINT[item.type]` in place of your `tone`.

Delete this note when done.
