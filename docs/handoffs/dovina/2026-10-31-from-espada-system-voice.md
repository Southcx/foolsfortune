# From Espada: the first quest's words, the quest lines, and a read on CLARITY.md 14 (2026-10-31)

Your files (`src/progress/quests.js`, `src/feedback/tracking/quests.js`) are on your branch only, so here are the strings to paste.
Delete this note in your branch when it's done.

## 1. The Understudy (`QUESTS[0]`)

An understudy learns the lead's part and never gets to play it. A straw man is the argument set up to be knocked down (LORE.md, the
folk). So the name already says the trouble, and it stays.

| field | words |
|---|---|
| `name` | `The Understudy` |
| `trouble` | `Strawman has been everyone's practice dummy for so long that it only knows one part: getting knocked down. The show in its head never gets past rehearsal.` |
| `begin` | `Strawman's in the Throwing Room, off the Workshop. For now, the way into its head is on the Index: STRAWMAN'S WELL.` |

| step | `say` | `did` |
|---|---|---|
| 0 | `Get inside Strawman's head.` | `You're in. It's a whole theatre in there!` |
| 1 | `Clear any stage. Pick whichever looks fun.` | `First stage cleared. Each one tests a different set of moves.` |
| 2 | `In The Brawl, knock a dummy past the blast line. The more damage it's taken, the further it flies.` | `KO. That dummy's off the stage for good.` |
| 3 | `` `Clear all ${WAVE1.length} open stages.` `` | `Every open stage, cleared. Strawman's starting to learn some new lines.` |
| 4 | `Get an A or better on any 3 stages, then take a bow.` | `Curtain call! For once, Strawman got to play the lead.` |

Step 4 counts `stars >= 2` as "an A". If 2 stars is a different letter, change the words and not the rule. ("Rank" on its own is a
homonym; "an A" is clear enough on the screen.)

## 2. The quest lines and the recap (`tracking/quests.js`)

- **`quest.start`**: `` `New quest: ${e.quest}! Type /quests for your first step.` ``
- **`quest.step`**: please add `did` to the event's payload (`quests.js` `update`: `did: q.steps[n].did`). Then the line can use it:
  ```
  `${e.quest}: ${e.did || bare(e.say) + '. Done.'} Next: ${e.next}`
  ```
  Today it says "Get inside Strawman's head. Done." The step's own `did` line reads better, and it's why the lines exist.
- **`quest.done`**: `` `Quest complete: ${e.quest}! +${e.points} quest point${e.points === 1 ? '' : 's'}.` ``
- **`quests.ask`**:
  - With none: `No quests yet. They turn up when someone has a problem you can fix.`
  - Done: `` `${q.name}: done.` ``
  - Started: `` `${q.name} (for ${q.who}). Next: ${q.next}` ``
  - Not started: `` `${q.name}: not started yet. ${q.begin}` ``
  - Drop the `Quest: ` prefix. The log's system colour already says who's talking, and "Quest: The Understudy (for Strawman)" stutters.
  - Points stay `` `Quest points: ${e.points || 0}.` ``
- **`recap.show`**:
  - With nothing: `Nothing to recap yet. Go do something!` (already in the voice; keep it).
  - The head: `` `Last time, ${e.minutes} real minutes of play:` `` or `Last time:`.
  - Then `Quests in progress:` and `Still up for grabs today:`.

## 3. Where CLARITY.md 14 is wrong about my craft

1. **Rule 3's example breaks the cut list.** `Lachryma (feeling turned into stuff: everything magic runs on it)` is a bracket with a
   colon inside it, in a line the player reads. Gloss a lore noun in a short sentence of its own instead: `This is Lachryma. It's
   feeling turned into stuff, and everything magic runs on it.` And keep **one** gloss a noun, so five divisions don't invent five.
   I'll write that list, `docs/plans/FIRST-GLOSSES.md`, one line a lore noun the player meets, if you point the brief at it.
2. **Say what the voice covers.** It's the System's voice: the log's system lines, help, how-tos, item and art lines, quests. It
   isn't the folk's (talks.js keeps each voice: Saggar is loud, Grog is slow, Raku haggles), the world's (ostraca, steles), or the
   Codex's lore pages. The cut list's "poetic stand-ins" would flatten Grog if someone took it as house-wide. One sentence in the brief
   saves that.
3. **"Once a screen" doesn't fit the log.** The log has no screens. Say once per event's lines, and never on two lines in a row.
4. **Rule 7's joke is fine; let names pun.** QUESTS.md 4 already lets a quest's name be playful. A pun in a *name* doesn't count
   against the one joke, because nobody reads a name as a sentence.
5. **On "I"**: it's South's call, but my vote is no. The veteran comes through in the imperative and the opinion: `Grab this first.`
   and `Most people skip this. Don't.` already sound like a guildmate, and neither says I. The System is the game's code made a voice
   (GLOSSARY 8). An "I" makes it a character, and then it needs a name, a face and a want, which is a bigger ruling than the voice.

## 4. The toy theatre against LORE.md

It fits. Pip stitched Strawman out of fear of breaking things (LORE.md, the folk), so its head being made from Pip's sewing kit is the
right source. Two notes:

- **Canon now:** the stage's foes are Strawman's fellow dummies. I'd make them Pip's earlier tries, the ones that didn't stand back up.
  That's a reason in the world for why there are many of them and why only Strawman never falls. If you agree, I'll put it in LORE.md.
- **Left blank on purpose:** whose distortion makes a Well inside a straw dummy. A Well is a pocket of distortion (GLOSSARY 5), and
  Strawman is neither folk nor Figment. Don't explain it on screen. I'll leave it open until South rules what Strawman *is*.
- **For later, not now:** the quest is a straw man learning to be a steel man (the argument made as strong as it can be). That's the
  lore name waiting for the Well once South calls it finished, by the plain-names rule.
