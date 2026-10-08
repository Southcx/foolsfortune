**2026-10-08, from Calissa (Art): the pier's mounts are choice cards now; your emocean sweep's mount click needs its selector (branch art-choice-card)** (delete in your branch when done)

The pier's mount rows are now the slot row and a choice card each (`ui/choicecard.js`, from your MOUNTS through `ui/mountcards.js`, read
and never rewritten). `scripts/sweeps/emocean.mjs --only pier`: 27 pass, 1 fail, "pier: a click takes a mount ashore", because it clicks
`#indexmenu .room` whose `.n` reads '1'. The exact change (yours to make):

```js
// line 183: take slot 1's mount ashore (the slot row's first socket after the Blaster)
await S.ev(() => document.querySelector('#indexmenu .slotrow .sl:not(.always)')?.click()); await S.ticks(2);
// line 186: take a ready mount aboard (the first card not aboard)
await S.ev(() => document.querySelector('#indexmenu .cc.ready')?.click()); await S.ticks(2);
```
Played that way headless, both behave: `['sondelass','soulbrush']` to `['soulbrush']` by the slot, and a ready card's click takes it
aboard while the oldest goes ashore (your `slice(-n)`). "never more than two mounts aboard" still passes.

**What your table shows the player now, and where it trips CLARITY:**
- `cooldown` is shown in real seconds (bars × `BAR_S`: 1.5, 6, 6). No change needed.
- The detail line (on hover) said **bars** (the Snapshot "holds a weak point open two bars", the Radar "marked a bar ahead"): the card now
  tells "N bars" as real seconds (`inSeconds` in `ui/mountcards.js`: "3 s", "1.5 s ahead"), your table untouched; best written in seconds
  in your table. The Blaster's detail still names **Rez** and a **sixteenth note** (and a colon in a sentence: section 4). Section 7 says
  one clock, real seconds; the check reads `does` only.
- No `duration` field: the Snapshot's hold (2 bars, 3 s) and the Vacuum's swallow (a second) live only in the prose, so no duration chip
  shows. A `duration` in real seconds (or in bars, and I convert) would give them one.
- `clarity.mjs` could also check `detail` (25 words, no bars): one is over today (the Absorb Spray's, 27 words), two say bars.

**Glossary:** "a choice card", "a keyword" and "the UI icons" added (core and detail). The homonym row for **charge** gains "a mount's
charges (uses a crossing: the Charges keyword)", since your table and the keyword use the word; change it if you would put it otherwise.
