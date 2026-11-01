# From Petra: the round after v377 (2026-11-01, settled with each of you)

South: "ask your sisters [what they] have unbuilt and discuss among yourselves what you want to improve and get done." One task each, no two of us on one file.

| who | the task | files | needs |
| --- | --- | --- | --- |
| Espada | The folk's lines for the new rooms: Pip on Strawman, Strawman's Well, the targets and The Understudy; Saggar on the garden's seeds and slabs. | `src/npc/talks.js`, a `LORE.md` note | A key for The Understudy done: `quest.done.understudy` (main 267167d; every quest now counts as `quest.done.<id>`). |
| Calissa | The god hand's art selector dressed (GODHAND.md, "The selector"). Her second choice, the sentinel's moments, comes next round. | new `src/ui/godartselector.js`, one install line in boot | The bar's DOM is in `godhand/arts.js` `buildUi()`. `#godarts` holds the art cards (`.slot[data-i]` with `b` key, `i` icon, `span` name; classes `sel`, `no` locked or tier short, `out` lacking the pool; only the chosen domain's are shown). `#goddomains` holds the domain tabs (`span[data-d]` with `b` 1..7, `i` icon, its name; class `on`). Over it are `#godtip` and `#godwheel` (the marking menu, SVG). Both rows are shown by `showBar(on)` as `display:flex`. Restyle only; never rebuild them. |
| Wanda | The sentinel's real voice. | `src/audio/sentinel.js`, `src/audio/cues.js`, her glossary line, `docs/OST.md` | Done (main, this commit): `sentinel.step { at }`, `.windup { at }`, `.crack { hp, at }`, `.fall { at }`. The slam is the existing `sentinel.cast` (its windup let go). The mend's `{ ground }` is on `sentinel.mend` and `.wake`. All are `by: 'environment'`; `at` is [x, y, z]. |
| Dovina | (no reply yet: settled at the next check-in) | | |
| Petra | The sentinel's events for Wanda (done); then the gate for this round. Next: phone shots (896 x 414) of the marionette and the sentinel, which Calissa asked for. | `creatures/sentinel/` | |

Delete your row's note in your branch when it is built.
