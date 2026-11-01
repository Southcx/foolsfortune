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
- **Wanda:** the domain ladder heard: `domain.milestone`, `domain.trait.learn`, `borrow.use { kind }` (`slipjelly` or `wisp`), and the depth rungs' moments if cheap. Files: new `src/audio/domainladder.js`, `cues.js`, `sfx.js`, two lines in `worldmoments.js`, her glossary line, OST.md.
- **Petra:** the Well's phone frame, once `/perfab` reports. Until then: the odds tag at the Tithe console in a shot, and Borrow a Verb in real play.

## At 21:45 UTC (v383 live)
- **Merged:** Dovina 6213972 (Espada's ladder words in), Wanda 014e4b8 and 07d18ba (the domain ladder heard), Espada 0a3a6d8 and 1c6eb09 (her note to Dovina, now built: Dovina deletes it). Casebook rule 391 numbered.
- **Done this round:** Espada's row and Wanda's row. Dovina's own list goes on. Calissa's look pass has not landed.
- **Petra:** the phone's v375 field report puts Strawman's Well at 24 to 29 fps against the workshop's 29 to 30 (Minimum tier, 4 to 8 ms a frame more). Which family of draws costs that waits on `/perfab`.
- **Next rows (21:50):** Wanda: the Shrines heard and the Well's way out (new `audio/shrines.js`, `cues.js`, `sfx.js`, `dunemaw.js`). Espada: the folk's lines on candid photographs, Fieldcraft, True Odds, the Tithe, sentinels and the Dissonance Level (`talks.js`, LORE.md); then the first path's step lines, for Dovina.

## At 22:50 UTC (v384 live)
- **Merged:** Wanda a478e24 (the Shrines heard, the Well's way out) and Espada 295eec8 (the folk notice the newest systems). Espada's Tithe pull line is in `tracking/treasure.js`, and her note to me is deleted.
- **The Well on the phone:** two loads on v383 hold the phone's 30 fps cap there (29 to 30 a sample, median 33 to 34 ms, one sample at 25). v375 ran 24 to 29. No cut is made until a measurement says one is needed.
- **Open rows:** Dovina, her list. Calissa, the True Odds look pass. Wanda and Espada are asked for their next.
- **South asked (22:55):** did the Arena's movekit animation reach main? Yes: the cutlass's string, the bare set, the brawler with the three airs, the Sondelass's jabs and the Lockheart's full set are hand-keyed. Still unbuilt:
  - five tools' Arena slots are clips with times measured automatically, not keyed: the psygun, the Soul Brush, the Veritome, the Dreamvane and the Crucibelle;
  - three stand-ins: the psygun's jab2 and the Veritome's jab2 are Fist_Combo2, and the Veritome's side special is Fist_Shove;
  - KEY-POSES.md 7 items 2 to 4 (the kick, the jump, the dash and its turnaround);
  - smears;
  - FIGHTER.md 10 (the touch controls and the flick, the kit outside the Arena, a second stage).

  Calissa takes the first four after the True Odds pass. FIGHTER.md 10 waits on South.
- **Wanda (22:53):** the Great Slip Jelly's bowl and the nursery heard (`bowl.spend`, `.fall`, `.shake`, `.pool`, `clutch.break`, `.hatch`, all on main). Files: a new `audio/bowl.js`, `cues.js`, `sfx.js`.
- **Espada (22:53):** the first path's step lines (`FIRST.where`, `progress/goals.js`) in the System's voice, sent to Dovina as a note; then LORE.md.
