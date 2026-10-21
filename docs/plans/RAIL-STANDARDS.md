# The crossing against the genre's standards

The owner, 2026-10-21: "evaluate where the rail crossing still needs improvements IAW industry standards, coordinate with your sisters,
and implement them". Dovina's plan. It follows RAIL-FLOW.md (the stream, the swarm, the boss law, the voxels), now built (v255, v256).

**Measured two ways (2026-10-21):**
- **An audit of the crossing as built**, file by file: what exists, with its numbers.
- **The genre's practice, sourced:**
  - Star Fox 64, Rez, Child of Eden, Panzer Dragoon Orta, Ikaruga.
  - Sin and Punishment: Star Successor, DoDonPachi, Battle Garegga.
  - Sakurai's hit-stop, Eiserloh's trauma, the Left 4 Dead director.
  - The Game Accessibility Guidelines.

  Sources are listed in section 10. Where a practice had no source, this plan says so.

## 0. The scorecard

| standard (who sets it) | ours before this round | verdict | who |
| --- | --- | --- | --- |
| Hit-stop scaled to the blow (Sakurai; Smash's hitlag 8 to 15 frames on a big hit) | 0.08 s on a heavy's down, 0.04 s on class 2 and up; none on a part broken, a ship hit or a boss's fall beyond that | **short**: section 1 | Petra |
| Shake as trauma squared, with a way to turn it down (Eiserloh; Gears 5's toggles) | trauma squared, decay 1.5/s; no part break; no setting | **short**: section 1 | Petra |
| Hit and kill confirmed by sound (Rez's quantised hits; Nuclear Throne's white frame) | a down's sound on the sixteenth, a lock's rising degree; no lock-drop sound, a hit plays the on-foot `sfx.damage` | **short**: section 1 | Wanda |
| A score you can see while you make it (every arcade shooter; Ikaruga's chain call) | **none on screen**: one log line at the end | **missing**: section 6 | Calissa, Petra |
| A results screen (Ikaruga's grade, Orta's kills, damage and boss time, Star Fox's hits and medal) | one log line | **missing**: section 6 | Calissa, Petra |
| A medal as a count of downs (Star Fox 64: Corneria 150, Zoness 250) | four in five of what came; the stream makes "what came" follow the player, so it measured nothing | **wrong: fixed**, section 3 | Dovina (done) |
| Rank against a par for the stage played (Ikaruga's thresholds a chapter) | three constants, the whole trip against the last set piece's, pirates 9% off, the model stale | **wrong: fixed**, section 3 | Dovina (done) |
| A chain that rewards order and is bounded (Ikaruga's three; Rez's eight; DoDonPachi's gauge) | Ikaruga's doubling to 25,600 a three: met 300 times a leg in the stream, an expert made 15 times a good player | **wrong: fixed**, section 3 | Dovina (done) |
| Obstacles that make where you fly matter (Star Fox 64's buildings, arches, pillars) | rings and slabs drawn, nothing to steer round | **missing: data done**, section 4 | Dovina (done), Petra, Calissa, Wanda |
| Rings that heal (Star Fox 64's gold rings) | rings lit when flown through, nothing paid | **missing: data done**, section 4 | Dovina (done), Petra |
| A branch earned by play (Star Fox 64: Corneria's arches open Sector Y) | between legs only (the chart), the Light Whale's follow | **short: data done**, section 4 | Dovina (done), Petra |
| A foe met alone before it is met in company (Star Fox 64's Corneria; Galaga's first stage) | the open's queue mixes four or five kinds at once | **missing: done**, section 5 | Dovina (done), Petra |
| Practice a stage (Star Fox 64's Training; Rez's Direct Assault; Ikaruga's Prototype) | DEBUG's showcase only | **missing: rule done**, section 5 | Dovina (done), Petra |
| An assist, offered plainly (the Guidelines' auto-aim; Celeste's Assist Mode; NSMB's Super Guide) | the foe snap at the reticle only | **missing: done**, section 7 | Dovina (done), Petra |
| Enemy shots never the player's colours (RAIL-MODULES.md 7; "bright, slow and deadly") | the Astral shot white-gold on a gold storm | **contradiction**, section 8 | Calissa |
| No hidden rank (Battle Garegga's rank hated, then shown and switchable in its 2016 port) | none hidden: the floor's pull follows the kill rate in plain sight | **holds**, section 9 | — |
| Telegraphs (a reaction of about 0.25 to 0.27 s: infil.net, critpoints) | a beat (0.375 s) for plain shots, half a bar for outlined, a bar for beams; edge marks; the fairness checker's 0.5 s | **holds** | — |
| A charge shot and boost/brake (Star Fox 64) | the lock-on is our homing charge; the scroll is the music's clock | **held on purpose**, section 9 | — |

## 1. Feel: hit-stop, shake, sound (Petra's numbers, Wanda's sounds)

Sakurai's rule: a freeze grows with the blow, both sides freeze alike, and projectiles freeze less. Smash's hitlag for a 15% blow is 8 to
15 frames (0.13 to 0.25 real s). Nuclear Throne freezes 10 to 20 ms on every hit. Sakurai describes a freeze, then a slow, on the defeat
of a powerful foe (no frame count found). In the stream a fodder kill comes four times a real second, so a freeze on each one would
stutter. The freeze belongs to what breaks.

| moment | freeze | then | trauma (adds) | now |
| --- | --- | --- | --- | --- |
| a fodder down (class 0, 1) | none | — | — | none |
| a down of class 2 and up | 0.04 s | — | — | 0.04 s |
| **a boss's part broken** (port, rigging, gill, tooth, eye, comb, gun) | **0.06 s** | — | **+0.25** | none (a gill 0.08 s) |
| **the ship hit** | **0.05 s** | — | +0.5 (kept) | none |
| a heavy's down | 0.08 s | — | +0.3 | as now |
| **a boss falls** (the director's end; a held boss's down) | **0.25 s** | **0.8 s at 0.35 speed** (`time.pulse` release) | **+0.8** | 0.08 s at most |

- **The setting `visual.shake`** (Off, Half, Full; Full by default). It scales every camera's trauma: the rail's, the on-foot camera's
  and the god hand's (the Guidelines). Petra.
- **Sounds** (Wanda):
  - A lock dropped: a falling tick, the lock's degree back down. RAIL-MODULES.md 1.5 asked for it; it was never built.
  - A part broken: a crack under the down's pop.
  - A hazard passed close: a whoosh in the stereo field on the side it passed.
  - A ring threaded: a chime up the scale, and all five a chord.
  - The results' count-up: a tick on the sixteenth.
  - The medal sting.

## 2. The swarm stands outside the chain (Petra)

A swarm's bodies are one body, as the shoal's fish are. `swarm.js` calls them "it pays and chains as a school's fish", but the fish are
`chain: false`. A swarm of 48 of one feeling is 16 threes for free. Please set the swarm's members `chain: false`; they still pay and
still count toward the medal. `par.js` already scores them so.

## 3. The score: chain, par, medal, rank (Dovina, done)

- **The chain** (`score.js`).
  - **Before:** Ikaruga's three of one feeling, each three doubling a bonus to 25,600. The stream brings about 300 threes a leg, and a
    wave is one feeling. An expert kept it capped all leg and scored fifteen times a good player. The rank's halving bands assume about
    four times.
  - **Now:** each three raises the chain's level by one, up to eight (Rez's eight, Child of Eden's x8). Every down while it stands pays
    its own worth again, times a quarter of the level: x1.25 to x3 (Sin and Punishment: Star Successor's multiplier, DoDonPachi's combo).
    A down of another feeling inside a three breaks it, and a hit breaks it. Order still matters, and the stream cannot run away with it.
  - **`chainDown(state, aspect, pay)`** takes the down's worth. Petra: please pass `pay` at `stage.down`. Without it, every down is
    reckoned at 100.
  - **The chain's best is now a level** (`state.best`). Petra: please put `chainLevel: r.chain.best` on the run. The Full Chain
    achievement reads it.
- **Par** (`par.js`, new): the expert's expected score **on the very leg sailed**, at its strength, storm and lesson.
  - The stream (`flow`) is played by three players: novice, good, expert. Their kill rates are KILL's; their habits are rail.mjs's.
  - Each down is paid by the score's rules, the chain kept in kill order, a volley every other bar where the lock-on works, and the
    boss fought out. Nothing goes stale when a number moves.
  - Measured, every leg: a good player scores 0.30 to 0.46 of par (rank B), a novice 0.08 to 0.16 (C or D), and the expert is par (S).
    That is the genre's order.
- **The medal**: Star Fox 64's, a count of downs on the leg. It sits a quarter of the way from what a good player downs to what an expert
  downs, so it asks for a strong run, not a clear (Corneria's 150). A shoal at strength 1: 660 downs (a good player 578, an expert 906).
  A continue on the leg takes it.
- **A leg's result**: `legResult({ plan, score, downed, continued })` gives `{ par, medalAt, rank, medal }`.
- **The trip's result**: `tripResult(legs)` gives `{ rank, medal }`. The rank is the legs' shares of par weighed by their bars
  (RAIL-OVERHAUL.md 9's plan, built). The medal is every fighting leg's medal. A continue or an adrift run still tops out at C.
  `voyage.stageResult({ legs })` uses it.
- **Asked of Petra**:
  - At each leg's end, call `legResult` and emit `rail.leg.end { type, k, score, par, rank, downed, medalAt, medal, hits, first,
    practice, by }`.
  - Keep the legs on the run and pass them to `stageResult({ legs })`.
  - `legPar` plays the stream three times: about 40 ms a leg. Ask for it as the trip is laid (it is cached by the plan), never at the
    leg's end.
- **Tracking** (`tracking/rail.js`, done):
  - A line a leg ("Leg 2 (the Wreckers): 412,300, rank A, a medal."; placeholder words, Espada's to word).
  - The counts `rail.leg.<type>` (what opens practice and ends the lesson), `rail.leg.medal`, `rail.leg.rank.<r>`, `rail.leg.clean`,
    `rail.broken`, and the record `rail.chain.level`.
- **Achievements** (done):
  - Full Chain is now eight threes unbroken.
  - Mission Accomplished is the crossing's medal.
  - New: **Medal Run** (ten leg medals) and **Clean Leg** (a leg without a hit).

## 4. Where you fly: hazards, rings, the arches' way (Dovina's data done; Petra, Calissa, Wanda)

Star Fox 64's Corneria is the model. Its buildings and pillars make where you fly matter, its seven arches flown under (with Falco saved)
open Sector Y, and its gold rings mend the shield. No source gives obstacles a minute, so ours are laid by eye and measured in play.

- **`HAZARDS`** (`legs.js`):
  - **Where:** a cue `{ phase, at, every, hazard }`, laid only where the view looks down the scroll (chase, free, astern) and never in a
    swing's clear. Each takes one lane of the frame's three (`lane` -1, 0, 1; never three running in one lane). No pattern is thrown in
    the bar a hazard passes: the ship is steering.
  - **pillar:** a monolith risen into the lane, or the graveyard's masts; radius 2.2 m. A scrape is 1 hit and breaks the chain, as a
    shot does. The roll does not pass through rock: Star Fox's roll turns shots, never terrain.
  - **arch:** span 6 m; flown through pays 500. Every arch of a leg threaded pays 2,000 more and is a find: the runtime opens the leg's
    hidden way, as the Light Whale's follow does (`encounters.js`).
  - **gate:** a wall across the lane with one gap of 5 m in the lane named; the wall is 1 hit.
- **Per leg (strength 1):**

  | leg | hazards | what |
  | --- | --- | --- |
  | shoal | 3 | pillars |
  | wreckers | 5 | pillars, then arches astern |
  | leviathan | 6 | arches, then pillars astern |
  | eyewall | 18 | the rollercoaster: gates, pillars, gates |
  | graveyard | 11 | pillars, its peak among masts |
  | maelstrom | 8 | arches, then pillars |
  | bounty | 3 | gates |
  | calm | 6 | arches only: a breath that still scores |

- **`RING_RUN`**: each ring of a turn (five a turn, hung by `crossinglook.js`) pays 100 and 4 Lachryma. All five of one turn threaded
  mend 1 hit and pay 1,000 more (Star Fox's gold rings).
- **Asked of Petra:**
  - Read the `hazard` events; place each in the rail's frame and collide it with the ship's hurtbox.
  - The arch-run find into the hidden way.
  - The ring run's pay and mend.
  - Emit `rail.hazard { kind, passed: 'clear' | 'hit' | 'through', near, by }` and `rail.ring { all, by }`, so the log can say a run of
    arches and the ledger can count.
- **Asked of Calissa:** the pillar, from the slab you already have (`railgeometry.js` monolith); the arch, a stone arch in the island's
  dress, lit while it can be threaded; the gate, a wall of crude-glass with its gap rimmed in gold. World marks, no words: an edge mark
  for each a bar ahead, as a wave has.
- **Asked of Wanda:** the sounds in section 1.

## 5. The first sailing teaches; practice opens (Dovina's data done; Petra)

- **The lesson** (`legs.js` `LESSON`, `lessonOf`; `schedule(type, { first: true })`).
  - **When:** the first time a leg's type is sailed (the ledger's `rail.leg.<type>` at 0).
  - **What:** its open meets each kind of foe in its queue once, alone, before the queue proper (school, then rammer, then darter, in
    the shoal). `alone`: nothing is pulled while it will still live when the next would enter; one at a time. The open's floor is held
    to 3 while it lasts.
  - **Measured:** never more than two beats' breath.
  - **The design law:** "every system teaches without saying so". No words, the foe itself.
  - **Petra:** pass `first: !(L.get('rail.leg.' + type) > 0)` to `schedule`, and honour `alone` in `stream` (no pull while it lives, and
    a pull that takes an alone wave takes nothing else).
- **Practice** (`practiceOf(ledger)`).
  - **Opens:** a leg's type sailed once is open at the pier to sail again alone, at a strength you pick (1 to 4).
  - **Counts nothing:** no cubes, no fuel, no ledger but its own `rail.practice` count, no cargo at risk. Its log line says
    "Practice:".
  - **Prior art:** Star Fox 64's Training mode, Rez's Direct Assault, Ikaruga's Prototype, the casino's practice (`session.play(true)`).
  - **Petra:** a PRACTICE row at the pier, as the SHOWCASE row is in DEBUG, a choice card a leg; `rail.leg.end` with `practice: true`.

## 6. The score seen while it is made, and a results window (Calissa's look, Petra's data)

The overlay reads what is (CLAUDE.md, OVERLAY.md): a rolling count is the overlay's. A banner, a kill-feed or a number for every down
is not.

- **The readout**, in the System's type, at the rail's corner (Calissa places it; the on-foot HUD is hidden aboard):
  - The score, rolling (`RollingNumber`, `ui/rollnum.js`).
  - The chain: three pips filling with the feeling of the three being counted, its level 0 to 8 beside it as x1.25 to x3; it flashes
    and falls to nothing on a break.
  - The surge's gauge (0 to 100). It has no readout today.
  - The hits the ship can still bear, as pips. Today only the hull's scars show them.
  - The leg's medal count, as downs over `medalAt`, which turns gold when reached.

  Two avenues each (CLAUDE.md): the body and the readout, and the log when a leg ends.
- **The results window**: a System window summoned at the trip's end, never a toast.
  - **What it holds:** a row a leg (its type, score, par, rank letter, downs over `medalAt`, the medal, hits, best chain level, parts
    broken), then the tally (the hits the ship could still bear x 1,000), then the trip's rank and medal.
  - **How:** the score ceremony's count-up (`ScoreCeremony`, Balatro's), as Raku's tables use it, ticking on the sixteenth. Skippable
    with any key.
  - **Data:** `emocean.stage` carries `legs` (`voyage.js`, done).
  - The log still says it, in one line.
- **Petra:**
  - Put on the run what the readout reads: `score`, `chain` (`aspect`, `of`, `links`), the surge, the hits and bears, the leg's
    `medalAt` and downs.
  - Call the window at the trip's end.

## 7. An assist, offered plainly (Dovina, done; Petra wires)

- **Wide Sights** (`knacks.js`, plain name until Espada's).
  - **What it does:** on a crossing the aim's foe snap reaches x1.75 and the lock-on's reach x1.5.
  - **How it opens:** two crossings the ship could not bear (Super Guide's offer after failing), or three leg medals (a veteran may
    choose it).
  - **How it works:** on until switched off, and off restores the game exactly. Assists are knacks: earned, optional, never gating the
    skill.
- **No hull assist.** The owner ruled out stat boosts in knacks (Last Straw, 2026-10-13).
- **Petra:** read `game.knacks.on('wideSights')` at the snap (`max(0.8, radius)`) and at `lock.reach` (0.14) in `courier/ship/ship.js`.

## 8. Readability: the shots' colours (Calissa)

- **The contradiction:** RAIL-MODULES.md 7 says a foe's shot is never yellow, never orange, never the player's colours. `railshots.js`
  draws the Astral shot with a white-gold core and a glow, against a storm of gold, and the needle in the ship's colour.
- **The ask:** keep the Astral shot white with a dark rim and no gold, and the Umbral black with its pale rim. Check them against the
  storm's gold and the crude's dark at 480 lines (a screenshot each view).
- **A follow-up for later:** the fairness checker could judge contrast as well as geometry, once the owner settles the crossing (it is
  in flux: no new checks).

## 9. Held on purpose

- **No hidden rank, no secret easing.** Battle Garegga's hidden rank is the genre's most hated rule; its 2016 port shows it and lets you
  switch it off. The Left 4 Dead director's pacing is ours in plain sight already: the floor pulls as fast as you kill, and the lull is
  the release.
- **No charge shot.** The lock-on is our Star Fox charge shot (homing, paid, a volley).
- **No scroll boost or brake.** The scroll is the music's clock (Rez: the stage is the song). Boost and brake move the ship's depth in
  the frame, which is what Star Fox's speed control buys you: room to dodge and a closer shot.
- **In-leg branching beyond the arches' way waits.** The chart already branches between legs (Slay the Spire's map); an arch run is the
  one in-leg branch this round.

## 10. Sources

**Hit-stop and shake:**
- Smash's hitlag: ssbwiki.com/Hitlag.
- Sakurai on hit-stop: sourcegaming.info, Famitsu column 490; nintendowire.com, "This Week in Sakurai", 2022-12-12.
- Nuclear Throne's numbers: infovore.org/?p=5275.
- The trauma model: Eiserloh, GDC 2016, "Juicing Your Cameras With Math", as implemented in bevy.org's screen-shake example.

**Hit confirmation and the chain:**
- Rez's quantisation: gamedeveloper.com's oral history of Rez.
- Ikaruga's chain and grades: shmups.wiki/library/Ikaruga.
- DoDonPachi DaiOuJou's gauge: shmups.wiki/library/DoDonPachi_3.
- Child of Eden's x8: trueachievements.com (secondary).
- Sin and Punishment: Star Successor's multiplier: nintendoworldreport.com review 23724 (secondary).

**Medals and routes:**
- Star Fox 64's medal counts: videogameschronicle.com's medal guide (one source; a conflicting snippet, unverified).
- Star Fox 64's routes: videogameschronicle.com's alternate routes guide.
- Panzer Dragoon Orta's scoring: wikipedia.

**Difficulty:**
- Battle Garegga's rank: shmups.wiki/library/Battle_Garegga/Advanced_Rank; its 2016 port's rank graph: m2stg.com.
- The Left 4 Dead director: Booth, Valve, 2009, "The AI Systems of Left 4 Dead".

**Readability and accessibility:**
- Reaction time: ki.infil.net/reaction.html; critpoints.net, 2017 (secondary).
- Shot readability: gamedeveloper.com, "Bright, slow and deadly".
- The Game Accessibility Guidelines: difficulty, assists, flicker, game speed.

**Unsourced, and so laid by eye:** obstacles a minute, a boss's length in the genre, a smart bomb's count a stage, and a results
screen's length.

## 11. Who builds what

| what | Dovina | Petra | Calissa | Wanda |
| --- | --- | --- | --- | --- |
| hit-stop, trauma, `visual.shake` (1) | numbers | build | — | — |
| sounds (1, 4) | — | emits | — | build |
| swarm outside the chain (2) | `par.js` | `swarm.js` | — | — |
| chain, par, medal, rank (3) | **done** | `pay` and `chainLevel`, `rail.leg.end`, `stageResult({ legs })` | — | — |
| hazards, rings, the arches' way (4) | **done** (data) | place, collide, pay, find | pillar, arch, gate, edge marks | whoosh, chime |
| the lesson, practice (5) | **done** | `first`, `alone`, the PRACTICE row | the row's card | — |
| the readout and the results window (6) | the fields | the data, the call | build | count-up ticks, medal sting |
| Wide Sights (7) | **done** | the snap and reach | — | — |
| the shots' colours (8) | — | — | build | — |
