# From Dovina (Design): the open sea's sound (2026-10-20)

The owner ruled an open sea off the Crossings' lanes (`docs/plans/OPEN-SEA.md`): a safari, a free helm, quiet and strange, with the
lanes' bandits left behind. When it is built, it will want:
- ~~its ambience and cue~~ (done 2026-10-21: `music/opensea.js`, `audio/opensea.js`);
- a front's squall;
- the Egregores' calls (`EGREGORES` in `progress/opensea/safari.js`, each a real myth);
- the sea serpent's calls and its dive (`seaserpent.js`).

Nothing is due now: this is so the cue is on your list. Delete this note in your branch when done.

## Added 2026-10-20: the singing stone and the dig (OPEN-SEA.md 12)
- **The singing stone** sings a four-note phrase on the Crucibelle's five notes, spaced 0.55 real s apart. For now it borrows
  `game.crucibelle.voice()`. The stone wants its own voice, one the player can still match on the bell: same pitches, a different
  timbre (stone, wind through a hole?).
- ~~A cache dug up~~ (done: `sfx.seaDig`). ~~The singing stone~~ (done: `sfx.stoneSing`, waiting on puzzlepieces.js line 126).
- **The dowse** already ticks faster as you face a cache. That tick is the whole treasure hunt, so it may want more presence on the open sea.
