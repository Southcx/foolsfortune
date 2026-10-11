# The melee loadout: how moves and string slots are earned, and Gall and Fury on the rod (Dovina, 2026-10-11)

Dovina's parts of Calissa's `docs/plans/MELEE-LOADOUT.md` (the owner, 2026-10-11: "the Sondelass built out like God Hand"): phase 3's
earning (section 1 to 3 here) and phase 5's species and prices (section 4). The engine, the editor and the moves' looks are Calissa's;
the names Espada's; the angler's keys Petra's. The numbers live in `progress/combat/moves.js` (`MOVES`, `unlock`) once the catalogue
lands; until then this is the rule each row follows.

**Prior art:**
- **God Hand** (Clover, 2006): the Combo Tree, a chain of slots filled from a catalogue of about a hundred techniques, the chain growing
  as you go. Taken: the slots, the catalogue, the chain that grows. **Not taken:** buying techniques with the money you earn, because the
  house's law is arts only by achievement.
- **Old School RuneScape's skills and Combat Achievements:** a thing unlocks at a count anyone reaches by doing it, or sooner by a feat
  that proves the skill. Taken: the count way and the feat way for every row.
- **Devil May Cry 3's styles,** levelled by using them: a move is learned by using the moves beside it. Taken: a normal's count way is
  its neighbour's use.
- **Monster Hunter's weapon trees:** a branch opens from the one before it. Taken: every move names a parent.

## 1. String slots (LMB)

- **Start with 4** (today's c1 to c4), **at most 8** (God Hand's chain at its longest). Both are questions for the owner (section 5).
- Each slot past the fourth opens by either way. The **count way** is cutlass blows landed (`cut.hit`). The **feat way** is the longest
  run of string blows landed without a miss or a hit taken (`sond.string.best`, a record), twice the slots you have, so a player who
  uses what they have well earns the next slot in minutes.

| slot | count way: `cut.hit` | feat way: `sond.string.best` | about (a real hour of Sondelass play lands ~600 blows) |
|---|---|---|---|
| 5 | 300 | 8 | half a real hour, or one clean double loop |
| 6 | 1,000 | 10 | 1.7 real hours |
| 7 | 3,000 | 12 | 5 real hours |
| 8 | 8,000 | 14 | 13 real hours |

- The ledger needs one new record: `sond.string.best`, the longest unbroken run of LMB string blows. It breaks on a miss, a blow taken
  or a pause past the string's window. Built (Petra, fb1a85d: `move.string.end`'s `run`, `feedback/tracking/moves.js`).
- **The run's edges** (Dovina, 2026-10-11; Calissa's to build):
  1. **A press that cuts a whiffing blow** (R, or any cut): if the blow's strike has passed without a hit, it was a miss and the run
     ends. Cut before the strike, no blow was thrown, so nothing ends. A cancel never launders a miss.
  2. **A held charge** freezes the string's window, for up to 2 real seconds held (a full charge is 1.3); past that the run ends. Its
     release is a blow like any other: it lands or it ends the run.
  3. **A move across space** carries the run only if it is the Courier's own (a dash, a Movement Art, the hook's pull) inside the window.
     A seam, a rescue or a place change ends it: the body left play.
  4. **Blade Mode's cuts** count nothing toward the run or `sond.move.*`, and neither break it: Blade Mode is stopped time, paid in
     Ouranurgy (`blade.exit`), not a string. The run resumes from where it was when time runs again.

## 2. Moves (normals in the string, specials on RMB)

Every move in `SONDELASS_MOVES` names a **parent** (the move it grows from) and opens by either way:

| kind | count way (the patient) | feat way (the skilled) |
|---|---|---|
| a **normal** | its parent landed 60 times (`sond.move.<parent>.hit`) | its parent finishing a string on a creature 5 times (`sond.move.<parent>.finish`), or the feat its effect names (below) |
| a **special** | its parent landed 30 times (`sond.move.<parent>.hit`) | the feat its effect names, once |

**The feat a move's effect names** (what the move does is how you prove you are ready for it):

| effect | feat | ledger |
|---|---|---|
| stagger | stagger 3 creatures in one fight | `chain.stagger3` |
| knock | knock a creature into a wall or pillar | `sond.knock.wall` |
| launch | juggle a creature through a whole air string | `move.juggle` |
| guard break | break a guard 3 times | `sond.guard.break` |
| a parry follow-up | parry and land it in the parry's counter window, 5 times | `sond.counter.<move>` |

- **Start known:** the four normals of today's string, the stinger (RMB tap), the launcher, the air string, the pause string, the dash.
  Nothing anyone has today is taken away.
- **The slice's catalogue,** a target for Calissa's list: **about 18 normals and 12 specials** (widened 2026-10-11 for the CMU
  mocap pass: 7 kicks and off-hand blows as normals, 6 as specials, added beside the 12 and 6 from UAL and the suite, none replaced).
  God Hand's tree is a hundred deep; breadth is the point, and the loadout's slots, not the catalogue, keep a string short.
- **The CMU rows' count way is the kick:** their parent is the nearest Sondelass move, but a kick normal also opens at 60 blows of the
  unarmed kick landed (`kick.hit`), a kick special at 150. Feet trained bare carry over to the blade.
- **Pacing:** in the first 3 real hours of Sondelass play, a new move about every 20 real minutes; after that, the deeper rows come
  slower (the counts above double along the tree). With 24 rows to earn, the whole tree is about 12 real hours by counts alone, and
  about half that for a player who takes the feat ways.
- **One move, one parent.** No row needs two others. A loadout never asks a player to grind a move they don't want for one they do.
- Each opening is said in the log once (`move.learn { tool, move, by }`, as the Movement Arts are), and the Codex's Sondelass page shows
  the tree with the next row's two ways. Espada names the moves and the log line.
- **Lent** in DEBUG by the lend panel's `moves` row, as today's moveset unlocks are.

**As written** (`progress/combat/moves.js`, 2026-10-11, on Calissa's phase 3 catalogue):

| move | parent | count way | feat way |
|---|---|---|---|
| Quick Slash, Body Blow | c1 | c1 landed 60 | c1 finishes 5 strings |
| Backhand | c2 | c2 landed 60 | c2 finishes 5 |
| Guard Break | c2 | c2 landed 60 | c2 finishes 5, or 3 guards broken |
| Lunge Slash | c3 | c3 landed 60 | c3 finishes 5 |
| Low Sweep | c3 | c3 landed 60 | c3 finishes 5, or 3 trips |
| Heavy Chop | c4 | c4 landed 60 | c4 finishes 5 |
| Push Kick | c4 | c4 landed 60, or 60 unarmed kicks landed | c4 finishes 5, or 5 knocked away |
| Spin Slash (special) | Backhand | Backhand landed 60 | three struck by one blow |
| Power Slash (special) | Heavy Chop | Heavy Chop landed 60 | Heavy Chop finishes 5 |
| Rising Cut (special) | Quick Slash | Quick Slash landed 60 | 10 launches |
| Guard Crush (special) | the stinger | 30 stingers | one guard broken |
| Backstep Slash (special) | c3 | c3 landed 30 | 10 parries with the Sondelass |

- The guard-broken, trip, knock-away and struck-by-one feats read `move.blow`'s `effect` and `struck` (rules in
  `feedback/tracking/moves.js`); Calissa adds the two fields at the blow. Until then those rows open by their count way only.
- **The stinger** (Calissa's flag): its lunge strikes at 2.2x its row (6.6 in 0.38 real s, 17.2 power a second measured), against the
  band's 2.6. Ruled: its row's 3.0 a strike. It is a gap-closer that pierces a line and costs 6 Lachryma; it should not out-damage the
  string. One number in `cutlass.js` `stingStep` (Calissa's). The owner will feel it; said in the round's report.

## 3. What a move is worth (so the editor's choice is a choice)

- **The rule:** the string's damage a real second (`dps`, `moves.js`) stays within ±15% whatever the four-to-eight slots hold. A
  loadout changes what a string *does* (stagger, knock, launch, break), never how hard it hits. God Hand's lesson: when one technique
  out-damages the rest, the tree collapses to it.
- A move that does more to a body pays for it in time or power (a guard break is slow; a launch hits light). Calissa's rows give power
  and time; `dps()` checks the band.

## 4. Gall and Fury on the rod (phase 5)

Today the lure's aspects are five (`tools/sondelass/angling/species.js` `ASPECTS`, keys 4 to 8), and every species' `aff` is five long.

- **Seven aspects.** Gall and Fury are appended at indices 5 and 6, so every existing `aff` keeps its meaning. `SHOWN` (the display
  order) becomes the glossary's seven: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread.
- **Locked until known.** A lure can carry Gall or Fury only once that feeling is known (`feeling.known.gall` / `.fury`, as the
  radial). A locked aspect shows locked, never hidden. That gives you a reason to drink Gall in the Dunemaw: it opens a new fish.
- **Every existing species** gets `aff` 0.05 for both (they barely notice them).
- **Two new species** (names Espada's, looks Calissa's):

| | Gall's | Fury's |
|---|---|---|
| tier | 2 | 3 |
| aff (dread, wonder, grief, desire, mirth, gall, fury) | 0.2, 0, 0.3, 0, 0, 1.0, 0 | 0, 0, 0, 0.3, 0.2, 0, 1.0 |
| style | `anchor` (it sulks on the bottom and will not come up) | `thrash` (it fights the line and burns out) |
| tides | low, falling | high |
| depth | deep (2.4 to 3.6 m) | shallow (0.2 to 1.2 m) |
| bite | `nibble`, `nibble`, `tug` (it tastes first) | `gulp` (no warning) |
| worth | `ECON.fish[2]` = 18 cubes | `ECON.fish[3]` = 40 cubes |

- **Prices:** none new. A fish's worth is its tier's (`ECON.fish`), and the lure aspect is free once the feeling is known. No new item
  and no new faucet, so the economy map is unchanged.
- **Who does what:** I write the species rows and the seven-long `aff` when phase 5 starts. Petra does the angler's seven keys (or the
  wheel) and the lock. Espada names the two fish; Calissa makes their bodies and the two lures' looks.
- **A bug in my rows, fixed then:** the Pale Regret's row carries `mooch` three times, and only the last counts.

## 5. For the owner

1. **String slots:** start at 4, at most 8? (My call: yes. Eight is God Hand's, and more than eight blows in a row stops reading as a
   string.)
2. **The launcher:** stay on S + LMB, or become a special you place (RMB with back)? (My call: stay. It's the grammar every air string
   starts from, and making it a special would cost a special slot for a move everyone needs.)
