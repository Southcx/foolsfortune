# From Petra: the round after v377 (2026-11-01, settled with each of you)

South: "ask your sisters [what they] have unbuilt and discuss among yourselves what you want to improve and get done." One task each, no two of us on one file.

| who | the task | files | needs |
| --- | --- | --- | --- |
| Espada | The folk's lines for the new rooms: Pip on Strawman, Strawman's Well, the targets and The Understudy; Saggar on the garden's seeds and slabs. | `src/npc/talks.js`, a `LORE.md` note | A key for The Understudy done: `quest.done.understudy` (main 267167d; every quest now counts as `quest.done.<id>`). |
| Calissa | The god hand's art selector dressed (GODHAND.md, "The selector"). Her second choice, the sentinel's moments, comes next round. | new `src/ui/godartselector.js`, one install line in boot | The bar's DOM is in `godhand/arts.js` `buildUi()`. `#godarts` holds the art cards (`.slot[data-i]` with `b` key, `i` icon, `span` name; classes `sel`, `no` locked or tier short, `out` lacking the pool; only the chosen domain's are shown). `#goddomains` holds the domain tabs (`span[data-d]` with `b` 1..7, `i` icon, its name; class `on`). Over it are `#godtip` and `#godwheel` (the marking menu, SVG). Both rows are shown by `showBar(on)` as `display:flex`. Restyle only; never rebuild them. |
| Wanda | The sentinel's real voice. | `src/audio/sentinel.js`, `src/audio/cues.js`, her glossary line, `docs/OST.md` | Done (main, this commit): `sentinel.step { at }`, `.windup { at }`, `.crack { hp, at }`, `.fall { at }`. The slam is the existing `sentinel.cast` (its windup let go). The mend's `{ ground }` is on `sentinel.mend` and `.wake`. All are `by: 'environment'`; `at` is [x, y, z]. |
| Dovina | The rungs at 60. Four this round, the ones whose runtime is all hers: The Fuse, Catch the Weather, Walk the Cycle, A Seal on a Creature. The other three (Relay, True Odds, Borrow a Verb) come next round. | `progress/domainarts.js`, `domainladder.js`, `domainartachievements.js`, `courier/domainarts/run.js`, `tracking/domainarts.js`, DOMAINS.md, glossary | Relay's hook is done: `impact.hit` now carries `target` (the struck body's id) and `thrown` (what struck it, by kind). The preset loader is built (`src/debug/presetloader.js`, `/preset <id>`). The places for gardenFiring2 and entropolisOpen are Petra's next. True Odds and Borrow a Verb wait on their rungs. Then: Espada's words for the 11 traits and the seven rungs at 60 (after the Pip and Saggar lines); Wanda's sound on `domain.milestone` and `domain.trait.learn` (after the sentinel); Calissa's looks for the rungs once their events land. |
| Petra | The sentinel's events for Wanda (done); then the gate for this round. Next: phone shots (896 x 414) of the marionette and the sentinel, which Calissa asked for. | `creatures/sentinel/` | |

Delete your row's note in your branch when it is built.

## At 20:10 UTC
- **Dovina:** five rungs at 60 are built and live as v380 (Relay included). Both hooks for the last two are on main:
  - Borrow a Verb: `borrowed()` on R, `c.lendVerb` on the slip jelly and the Lantern Wisp.
  - True Odds: `game.oddsTags.show`.
  Her next: wire both, then her own list.
- **Calissa:** the selector clears the log, and the sentinel's moments are in (v380). Added to her list: dress the odds tag.
- **Petra:** waiting on the phone's `/perfab` field report for the Well's frame. The cut follows the measurement.

## At 20:42 UTC (v382 live)
- **Merged:** Dovina 9f1420a (True Odds and Borrow a Verb wired, the pace pass) and Calissa 879e5f4 (the odds tag dressed in the DOM, the sentinel's clay throw).
- **Dovina:** next is her own list: the rungs at 90 and 99, the trait numbers, the Strawman rig console. The pace decision (`PACE.hours99`, 300 or 100) is South's, in her digest.
- **Calissa:** a look pass over True Odds' hosts: the chest, the wheel, the flee, the crystal.
- **Espada:** the domain ladder's words: the 11 traits, the seven rungs at 60, True Odds' row labels and Borrow a Verb's log lines. They go to Dovina as one note in `docs/handoffs/dovina/` (all four live in her files). Pip's and Saggar's lines were already on main (9590502).
- **Wanda:** asked what she has unbuilt. Her row goes in when she answers.
- **Petra:** the Well's phone frame, once `/perfab` reports. Until then: the odds tag at the Tithe console in a shot, and Borrow a Verb in real play.
