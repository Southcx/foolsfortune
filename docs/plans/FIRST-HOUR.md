# The First Hour

The owner's first theme of the "get ambitious" round (2026-10-22): a fresh STORY save, from the title to the end of its first real hour,
should always have a next thing in view and a reason to go there. Dovina's plan. Progress resets on every build, so every build's first
session is a first hour, the owner's included.

The player's goal at each scale:
- **The next thirty seconds:** the thing in view (a Shrine, a pot, a rail, a hole in the floor).
- **The session:** the goals' first path (section 4): ten steps, three in view at once, walked outward from where you wake.
- **The week:** the first awakening, the first art and the first cubes, which point at the Dunes, the Weir and the sea.

## 1. Prior art

- **Breath of the Wild's Great Plateau:** a walled first region where the next shrine is always in view. The tower shows them all, and
  the paraglider is the reward for walking it. From it we take the "always in view" rule.
- **Hollow Knight's King's Pass and Celeste's first screens:** the level teaches the move (a spike pit, a gap) with no words. Ours is the
  same law (CLAUDE.md: "every system teaches something real without saying so").
- **Animal Crossing: New Horizons' first day:** the Nook Miles starter list is fixed and introductory. Nook Miles+ refills a task the
  moment one is done. From it we take the first path and its refill.
- **Hades' first prophecies:** the first entries on the Fated List are the easiest. Our goals already did that, but only for the near slot.
- **What to avoid: OSRS's Tutorial Island and the MMO tutorial zone.** A guide who stops you until you click the right thing. The first
  path points; it never blocks, and every step is something the game already counts.
- **Dark Souls' Undead Asylum:** the first boss is reachable at once and is a lesson, not a wall. That is the question about the Great
  Dunemaw at minute 3 (section 6).

## 2. The first hour as it is (build v259, read from the code)

A subagent read the code on 2026-10-22; nothing was run in a browser. The minutes are estimates for a new player.

| real minute | what happens | what points onward |
|---|---|---|
| 0 | The overture, PRESS START, then the menu: DEBUG, SETTINGS, SOUND TEST, then STORY (labelled "coming later") | nothing |
| 0-1 | Picking STORY on a first boot reloads the page (`save.lastMode()` defaults to `debug`); you press start and pick STORY again | nothing |
| 1 | The seal picker, once a browser (kept in settings) | nothing |
| 1 | You wake on the workshop ground floor. The welcome said at `session.open` scrolled past under the title. The mode line says "STORY is not written yet" | nothing |
| 1 | The goals: near is a first step; elsewhere is "Know Thyself" (the domains start at level 1, so they count as begun); stretch is "Five Fingers" (Elite) | one goal of three |
| 1-5 | Pots, clapperjars and the god hand (~). V (kick) and E (Blink) do nothing until earned (15 pots, 20 air dashes), and nothing says so | nothing |
| 2-4 | The hole to the basement, about 6 m from where you wake, unmarked. In the hub: the Index (every room open) and the common chest (4 to 9 cubes, the first cubes) | Pip, beside the Index, talks of fear and the clapperjars |
| 3-6 | Wonder, from the atrium rail's vantage point: the first feeling. The other six are far off | nothing |
| 4-15 | The Dunes, the Weir and the slip jellies (cubes), the skiff, the lure. The Great Dunemaw is open | nothing |

Where you start: 0 cubes, a 100 pool (regen 3.5 a second after 2.2 s), five tools worn, the Dreamvane and the Crucibelle in the Pneuka
Box, no Movement Arts, all seven feelings locked.

## 3. What goes wrong

1. **Dead air.** Nothing points to the Shrine at your feet, the hole, the Index, the hub's chest or the Dunes. The folk never name a next step.
2. **The welcome is unseen.** It was said at `session.open`, under the title. *Fixed (Dovina): it is said at `title.enter`, welcome first.*
3. **The mode line apologises.** "STORY is not written yet". *Fixed: it points at the first step (placeholder words, Espada's to rule).*
4. **The title.** STORY comes last, labelled "coming later", and on a first boot it costs a reload. (Petra's.)
5. **Silent keys.** The help pages list V and E from minute 1, but they are inert until earned, with no word why. *Rule written (Dovina):
   `art.unlearned` says what earns the art and how near you are; the hook is Petra's.*
6. **The pool is never taught.** The first line about it is "used up". *Fixed: the first time, it also says how the pool comes back
   (the live regen and delay as numbers).*
7. **The goals' first steps fill only one slot**, and the other two are a domain level and an Elite. *Fixed: the first path (section 4).*
8. **No warning on the Index.** Every room is open, the Great Dunemaw (class-2 FOE, three floors) included, at minute 3. (A question, section 6.)
9. **The first cubes are invisible.** The workshop pays Lachryma, not cubes. The hub's chest is the first cube, and nothing points to it.
   *The first path's fifth step is that chest.*
10. **The kit swap is silent.** Wearing the Dreamvane or the Crucibelle bumps a worn tool into the box without a line. (Petra's: `belt.js`.)
11. **Unverified:** whether a 20 m drop exists near the start for Roll, and whether the basement has a way back up without the Index.
    For QA-A.

## 4. The first path (built, `progress/goals.js` FIRST)

A new STORY save's three goals are the first three undone steps of the path, in its order. A step done gives its place to the next at
once (`goal.next`, Nook Miles+'s refill). The path ends when it is walked, or once 40 achievements off the path are done (you found
your own way). Each step says where it is (`FIRST.where`), after the achievement's words in the goals' window and in the "Next goal" line.
DEBUG never walks it. Every step is an existing Easy achievement or one of the two added for it, so the path is a pointer over the
ledger and pays nothing of its own (the design laws).

| step | achievement | where | what it teaches without saying so |
|---|---|---|---|
| 1 | sr1 Catch Your Breath *(new)*: rest at a Shrine | the Bisque Shrine, beside where you wake | the Shrine refills the pool and is where you come back |
| 2 | fk1 Small Talk | Saggar, in the workshop | the folk and F |
| 3 | sk12 Lookout *(new)*: awaken to Wonder | the atrium rail's vantage point | feelings are learned by doing what they are |
| 4 | br1 First Casualties: break 10 pots | the workshop | the pots feed the pool; 15 opens the kick, 25 Stomp |
| 5 | tc1 First Hinge: open a chest | the hub, through the hole | cubes, the currency |
| 6 | pl6 Reached the Dunes | the Index | the Index sends you to rooms |
| 7 | jl1 Pop!: burst a slip jelly | the Weir | creatures pay cubes |
| 8 | sf1 Board Rider | the Dunes | the Solar Skiff |
| 9 | an1 First Cast | the Weir | the Sondelass's rod, angling |
| 10 | cx3 On the Course: a lap of the basement ring | the basement | the course, and the core movement as a skill |

The goals' window shows each as FIRST STEP. The log says "Your first 3 goals are set" at the start, and "Next goal: ..." at each refill.

## 5. Who does what

**Dovina (built this round):**
- the first path;
- sr1 and sk12;
- the pool's first empty line;
- the welcome's timing;
- the mode line;
- the `art.unlearned` rule.

**Next for Dovina:** measure the first cube's minute and the first hour's cubes against the aim, once QA-A has a run.

**Petra:**
- **The title:** STORY first, with the "coming later" label gone. A fresh browser's `lastMode` should default to STORY, so the first
  pick does not reload.
- **The `art.unlearned` hook:** in `Techs.update`'s start loop (and `kick.js`), emit it when a tech is switched on but not allowed and
  its input would start it: `{ ability, by: 'courier' }`, once a press. The rule throttles at 20 real seconds an art.
- **The help pages:** V and E marked as earned, not live.
- **The kit:** a log line when wearing a tool bumps another into the box.
- **QA-A:** the playtester plays a fresh STORY save for an hour of play and reports the minute of each path step, and of the first
  cube, the first art and the first awakening.

**Espada:**
- The folk name the next step. Saggar points to the Shrine and the rail; Pip, beside the Index, to the Dunes and the hub's chest. A
  line a step, keyed by the path's next goal (`game.goals.list()`).
- The placeholder words: the mode line, "Next goal", the pool's first empty, `art.unlearned`, sr1 and sk12.

**Calissa:**
- The vantage frame on the atrium rail is lit until reached. Is it seen from where you wake? If not, a sightline.
- The goals' window takes a beat on `goal.next`, as it does on `goal.done`.

**Wanda:** a small sound for `goal.next`, if the house wants one (it may be the same as `goal.done`'s).

## 6. For the owner

- **The Index at minute 3:** warn, or gate? Dovina's call: **warn**. A danger mark on the Index's row (the FOE's class as pips), never a
  lock, as in the Undead Asylum, where the first boss is open and teaches. A gate would be a base change the sandbox does not need.
- **Ruled (the owner, 2026-10-23): "we should give Wells a mark or something."** Warn, never gate. The Index's row for a Well (today
  the Great Dunemaw) carries a danger mark: the FOE's class as pips, a world mark with no words (Calissa's look, Petra's row).
- **The seal picker** stays a ceremony with no skip: it is once a browser, and settings survive builds.

## 7. Targets (QA-A measures)

| moment | target (real minutes from control) |
|---|---|
| first goal done (sr1) | under 1 |
| the first awakening (Wonder) | by 6 |
| the first cube (the hub's chest) | by 8 |
| the first Movement Art (the kick, 15 pots) | by 10 |
| the Dunes | by 12 |
| the path walked | by 45 |
| a minute with no goal in reach | never |

## 8. QA-C's hour (Petra, 2026-10-22) and what changed

QA-C, a playtester agent, played a fresh STORY save for 3,600 real seconds of play time (seed 1, build fb895af). It used the agent
bridge's `travel` after about minute 12, a shortcut a player lacks, so its later minutes are faster than a person's. The minutes are
the ledger's own.

| moment | target | QA-C | verdict |
|---|---|---|---|
| step 1, sr1 | under 1 | 0.3 | met |
| step 2, fk1 | | 0.6 | |
| step 3, sk12 (the first awakening) | by 6 | 15.1, at the Weir's pier, not the atrium rail | missed: nothing said where a vantage was |
| step 4, br1 | | 3.0 | |
| the first Movement Art (the kick) | by 10 | 3.6 | met |
| step 5, tc1 (the first cube) | by 8 | 7.6, after falling through the hole by accident | met by luck |
| step 6, pl6 | by 12 | never: the ledger wrote `time.area.Dunes`, the achievement read `dunes` (Petra's, fixed; casebook 269) | a bug |
| steps 7 to 9 | | 13.1, 13.4, 15.1 | |
| step 10, cx3 | | not reached: the bot got no push off the zigzag's wall jump | the bot's, likely |
| the path walked | by 45 | no | the cutoff ended it at minute 13 |

**What changed (Dovina):**
- **The cutoff counts only achievements off the path, and is 40.** At 15 counting all, the 15th (gl3) came at minute 13.1, and the
  "Next goal" lines stopped with three steps left. At QA-C's pace (about 10 off the path in 13 real minutes) 40 is past the first
  hour, so the path ends early only for a player plainly playing their own game.
- **Every step says where it is** (`FIRST.where`, placeholder words for Espada): the Shrine beside you, Saggar on the floor, the
  atrium rail upstairs, F and LMB for the pots, the hub's chest down the hole, the Index, the jellies past the Weir, Y for the board,
  the Weir's pier for the rod, the course round the hub. The three gaps QA-C stood in (the pots, the hole, the vantage) are each a line.
- **Roll's feat stays 20 m.** No drop that tall is near the start (the workshop's hole is 14 m), so Roll is a Dunes art. Its hint now
  says the number and that the hole is too short. The count way (`roll.end`, the Tumble's) is unchanged.

**Still open:**
- The vantage frame on the atrium rail: seen from where you wake? (Calissa's, asked in section 5.)
- The hole is unmarked. The step's words now point at it; whether the hole wants a world mark is Calissa's call.
- Item 6 (the Index at minute 3: warn or gate) is the owner's.
- The Great Dunemaw ate 25 real minutes of QA-C's hour (four shatters). It is in flux, so it gets no check; noted for the warning above.
