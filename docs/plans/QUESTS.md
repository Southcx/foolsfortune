# Quests and the recap

South, 2026-10-31:
- "thinking about tomba was how much I loved their "quest" system that gives not only that adorable and charming jingle/splash, but
  also has really nice tracking of goals and quest status. Runescape is very similar in that regard."
- "Fool's Fortune has a major element of helping people and fixing psyches a la Psychonauts in it so we should take some time to work
  that out too!"
- "The best JRPGs have really good "this is what you were doing" recap functionality."

Built: the kernel (`src/progress/quests.js`), the recap (`src/progress/recap.js`), the log's lines (`src/feedback/tracking/quests.js`),
`/quests` and `/recap`. Not built: the journal window, the splash and the jingle (section 5).

## 1. Prior art, and what we took

| game | what it does | what we took |
|---|---|---|
| Tomba! | 130 "events": found by bumping into someone's trouble in the world, a jingle and a big **EVENT!** splash when one starts and when it clears; an event list menu, open and cleared | quests found in the world; the start and the end are moments (the splash and the jingle, section 5); one list |
| RuneScape | the quest journal: every quest listed **red** (not started, with where to begin), **yellow** (started), **green** (done); a started quest's diary with the done steps struck through and only the next step written; quest points; the completion scroll | the three states; the start hint; the next step only; quest points |
| Psychonauts | each level is someone's mind, and its trouble is the person's (their baggage, their censors, their fear); fixing the mind fixes the person | every quest names **who** it is for and **what is wrong** with them, plainly, up front |
| Xenoblade, Trails | "The Story So Far" on load: a few lines of what happened last | the recap's LAST TIME |
| Dragon Quest | the priest tells you where you were headed | the recap's IN PROGRESS: each quest's next step |
| Hades, Animal Crossing | a short list of small goals in front of you | already ours: the goals (`progress/goals.js`); the recap says the open ones |

## 2. The rules

- **A quest is data:** its id, name, who it is for (`who`), what is wrong with them (`trouble`), where it begins (`begin`), its quest
  points, and its steps. Each step is a line to do (`say`), a line done (`did`, for the recap) and a predicate over the ledger.
- **Its state is read, never stored** (CLAUDE.md: achievements are predicates over the ledger, never flags; quests are the same). NOT
  STARTED until its first step is done, STARTED, DONE when every step is.
- **Steps go in order.** A later step done early waits until the ones before it are (RuneScape's diary never skips ahead), so the next
  step is always the first undone one.
- **The System never spoils past the next step.** The journal shows the trouble, the done steps, and the next one. Nothing after it.
- **What is written** is only when: the play time each step and the quest were first seen done (`quest.<id>.<n>`, `quest.<id>` in the
  ledger's firsts), which the recap reads. Progress resets on a new build, as all of it does.
- **The reward is quest points** (RuneScape's), plus whatever the quest's own place gives. Quest points are a count for now; what they
  buy (a cape, a standing, a door) is section 6.
- **Only the Courier's acts count**, since every step reads the ledger and the ledger counts only the Courier's.

## 3. The recap

Said once a session, 4 real seconds into the world when there was a session before, and on `/recap`. Three parts:

1. **LAST TIME** (with how many real minutes the last session ran): the quest steps done and the achievements earned in your last
   session, newest first, five at most. The ledger already kept the play time of each (`L.done`, `L.firsts`); the only new thing kept
   is when each session began (`L.began`, `L.lastBegan`, in the ledger's save section).
2. **QUESTS GOING:** each started quest, who it is for, and its next step.
3. **STILL OPEN TODAY:** the game day's goals not yet done.

The log says it today. A window for it is Calissa's (section 5).

## 4. Words

Every line is a placeholder until Espada words it, in the System's voice (CLARITY.md 14: the strategy guide's, plain and casual, never
cryptic). A quest's name may be a little playful ("The Understudy"); its trouble is one plain sentence a ten-year-old gets.

## 5. Not built, and who builds it

| piece | what | who |
|---|---|---|
| the journal window | a System window (the goals window's sibling): quests by state in RuneScape's three colours with a shape beside each (CLARITY.md 7: never colour alone), the trouble, the done steps struck through, the next step, the quest points | Calissa (`ui/`) |
| the splash | Tomba!'s EVENT! on `quest.start` and `quest.done`: the journal window shown for a beat, as the goals window is at `goal.done`. South to rule whether it may be bigger (a second pop-up beside a title's: CLAUDE.md, "One toast: a title") | Calissa; South rules |
| the jingle | a short sting on `quest.start`, a longer fanfare on `quest.done` | Wanda (`audio/`) |
| the words | the names, the troubles, every step's two lines | Espada |
| more quests | the folk's troubles, island by island: who has baggage, and what fixing it looks like | Espada writes, Dovina makes each a predicate |

## 6. The first quest, and what comes next

**The Understudy, for Strawman.** Strawman has been everyone's practice dummy so long that the shows inside its head never get past
rehearsal. Five steps through Strawman's Well (STRAWMANS-WELL.md): get in, clear a stage, knock a dummy off, clear every open stage,
rank A on three. It proves the frame on a room that exists.

Open:
- What quest points buy (RuneScape's Quest Cape at all of them; a door that needs some).
- Whether a quest can be failed or missed (Tomba!'s can't; RuneScape's can't; keep it so).
- The psyche side at scale: whether every Well is someone's head (Psychonauts), which would make the Wells and the quests one system.
