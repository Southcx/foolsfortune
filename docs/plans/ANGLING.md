# Angling: the rod, finished (the owner, 2026-10-11)

Kept by Dovina (the vision, the numbers, the species and what a catch is worth). The rod's code and the line's look are Calissa's,
the sounds Wanda's, the names Espada's. **Starts after Calissa's melee phases.** It finishes what exists
(`src/tools/sondelass/angling/`); nothing is replaced.

> "...the Courier is rooted to one spot once a fish bites, that should free up 'WASD' for use in fighting the fish, right? Also we need a
> quicker reel-in option... Maybe Shift+LMB? ... the Sondelass's fishing line being visually loose and sagging even when hanging from a
> grapnel overhead, I feel like tautness and tension are things that we need to get a real (heh) handle on." ... "a chef's kiss
> masterpiece." ... "Interpretability is for those of us with cognitive capabilities of a ten year old, we yearn for ELEGANCE."

## 0. The idea

**One quantity, one instrument.** The fight is tension, and the rod and line *are* tension. They are drawn and sounded as the physics
says they would be. No gauge bar, no prompt; one mark on the reticle (section 2). The player who learns to read a bending rod has
learned to fish, here and at a real river.

What fails today is not that the fight is unexplained; it is that the instrument is false. The line sags when it should sing, the rod
never bends, and the tension has no voice. So the player looks for a UI to tell them what the rod should have. Make the rod true and the
question goes away.

**Prior art, and what was taken:**
- **Sega Bass Fishing:** the rod's bend and the reel as the whole readout.
- **Reel Fishing:** restraint; the waiting is the atmosphere.
- **Animal Crossing:** the catch held up to the camera, every time, and it never gets old.
- **Zelda: Twilight Princess's** fishing hole: side pressure, the close camera.
- **Shadow of the Colossus:** the creature's body is the telegraph; a grip you hold and lose by feel.
- **Real angling:** the pump, the bow, the drag, Mersenne's law (a string's pitch rises with the root of its tension).

## 1. The hands are the rod

Rooted once a fish bites, so the movement keys become the rod's tip. What you press is what the rod does; the fish's body tells you what
to press. That is the whole grammar.

| input | the tip | against |
|---|---|---|
| A / D | swings left / right | a run (side pressure turns its head) |
| S | pulls back; held, it braces | a heave or a dive; a thrash |
| W | drops | a leap (it lands on slack) |
| LMB | reels | a rest |
| RMB | gives line | a run too big to stop |
| Shift + LMB | cranks: 2.5x take-up, 1.8x load | nothing; speed bought with risk |

- **The pump, the one technique:** S, then W while reeling. The haul wins line under load; the drop takes it up *free*. In the model, S
  builds `gained`; W + LMB takes it up at 3x with no load; it decays over 1.5 real seconds, so it must be done in rhythm. A good pumper
  lands a heavy fish in about half the time. Nothing teaches it but the rod: pumping is visibly the fastest thing the line can do.
- **Brace moves into S held** (C is the posture cycle now).
- **Before a bite:** Shift + LMB is the fast retrieve, 3x (10.8 m/s). The dead time between casts goes. All else as now.
- The rod owns WASD only while a fish is on. Landed, lost or cut, the keys are the body's again, exactly.

## 2. The instrument

**The line: slack is the only curve** (the owner's bug; `vfx/rope.js` and `angling/line.js`, the grapnel's line too).
- Told slack 0, a rope is drawn as the straight segment it is. It is simulated as a chain only while there is real slack; between,
  `straightness = smoothstep(slack, 0.3, 0)`, so a line drawing taut snaps straight.
- The grapnel hanging: dead straight, hand to hook.
- The fishing line: its slack is the fight's own. Loaded, straight. Bowed, it sags, and you see the leap land on it.

**The rod bends with the load** (Calissa). Straight at 0; a healthy curve, about 30°, in the band; about 70° and shuddering at 1.0.
The eye reads it first; the line's colour (exists) stays beside it.

**The line sings** (Wanda). Pitch follows the root of tension, as a real string's does: a thrum low, a tone in the band, a whine near
the snap. In the band it sits in the fish's aspect mode, so a fight held well is in key. A run pays out against the drag's click.

**The fish shows its intent with its body**, a beat ahead: it turns before it runs, rises before it leaps, shudders before it thrashes,
rolls and shows its flank when tired. That is the coarse read, at the water.

**Fatigue: the body and the line's core** (the owner, 2026-10-11: "a line drawn within the fishing line's filament").
- **The body:** the tail beats slower as stamina falls (its swim clip's rate is `0.5 + 0.5 x stamina`); under a third it rides higher
  and rolls; at the end it lies on its flank at the surface. That is when to land it.
- **The core:** while a fish is on, the line is drawn as a sheath with a bright thread inside it. The sheath keeps the tension's colour;
  the thread is the fish's stamina. Full, it runs the whole length from rod to hook; as the fish tires it draws back down the line
  toward the fish, the fight running out of it. Spent, it is a bead at the hook. It pulses with each tail beat, so it slows as the body
  does, and the two reads are one.
- **At 480 lines** a 1-pixel line can't hold a thread, so while a fish is on the line is drawn at least 3 pixels wide in screen space
  (sheath 3, core 1), thinning back to a hair when the fight ends. Calissa's, in `angling/line.js`.
- Two quantities, one filament: the sheath says the danger now (tension), the core says how far there is to go (stamina).

**The reticle stays, and carries the fine read** (the owner, 2026-10-11: "it's not always easy to watch both sides of the screen").
The rod is at one side of the view and the fish at the other, so the reticle, where the eye already is, says what the body only hints:
the next move's kind, its direction, its weight, and how long until it lands (the fill). One mark, drawn plainly; redundancy is the
point here, not clutter.

**Divination** lengthens the beat (`LOOK` 1.4 s x widening, to 2.1 s): the fish's tell comes earlier, nothing is added.

## 3. The moments

- **The hook set:** 4 frames of hit-stop, the line snaps straight, the rod loads, one low thump.
- **The leap:** a quarter-second held at its apex. Bowed, the line hangs slack; not, it strains.
- **The snap:** the line whips loose, the rod springs up, then a beat of silence. No jingle.
- **The catch** (the owner: "a proper 'I CAUGHT A FISH' short cinematic, much like in Animal Crossing"): about 2.5 real seconds, skippable
  with any key after the first half-second, and never on the second catch of a species in a row (then a 0.8 s quick lift).
  1. The fish leaves the water on the line, a splash and a spray of its feeling's Lachryma.
  2. The camera cuts close and low; the Courier holds it up in both hands, the fish wriggling, facing the camera. Animal Crossing's lift.
  3. A short sting in the fish's aspect mode (Wanda); bigger for a new species, a record or a legend.
  4. One line in the log, in the catch's voice: species, size, "a new record" if it is one. Espada writes the lines.
  5. Back to the rod: it goes back in the water, or into the Pneuka Box if you press the keep key (the owner, 2026-10-11).
  - A first of a species also offers the Veritome's plate before it goes.
- **The fish, made worth holding up** (Calissa): the catch puts a fish a metre from the camera, so each species needs a body that
  survives it: a silhouette that reads at a glance, its feeling in its colour and fins, a wet sheen, an eye, and a wriggle clip.
  Sixteen bodies at the end; the ten that exist are refired first.

## 4. Numbers (mine; the targets are judged in the owner's play, no sim)

| what | today | new |
|---|---|---|
| empty retrieve | 3.6 m/s | Shift: 10.8 m/s |
| crank | n/a | take-up 2.5x, load 1.8x |
| pump | n/a | `gained` from S; W + LMB takes it 3x, no load; decays 1.5 s |
| answered pull | relief to 55%, +90% stamina wear | relief unchanged, +40% wear (the pump carries the rest) |
| `LOOK` | 1.4 s | 1.4 s x widening (to 2.1 s) |
| snap / slip | over 1.0 for 0.42 s / under 0.06 for 1.5 s | unchanged |

**Targets:**
- A common fish: a novice (answers half, never pumps) 60 to 90 real seconds; an expert 30 to 45.
- A legend: a novice 5 to 7 real minutes; an expert 2.5 to 3.5. A novice can always land it.
- No snap within 0.6 s of a pull whose tell was not shown.
- An hour fishing well earns about the aim (480).

## 5. Depth (after the instrument is right)

- **Seven aspects:** Gall and Fury join every `aff`, each locked until awakened (MELEE-LOADOUT-EARNING.md section 4). Gall's fish
  anchors and sulks; Fury's thrashes and burns out.
- **Two more waters, where the island already is:** the shore (the Emocean's edge, half-Egregore fish, one legend that rises only in a
  strong spell of one weather) and the sumps (the Great Dunemaw's bowl pools: still water, blind things). Three species each: 16 in
  all. Styles spread so each water holds every answer.
- **Release is Possession** (the owner, 2026-10-11: "the Sondelass has always been about linking minds"). A fight is two minds on
  one line, so a released fish pays Possession experience and nothing else: `angle.release { species, tier, secs, answered, by }`
  (Calissa's to emit), a source in `progress/domains.js` (mine) paid in `acts` as the big acts are, one act per 10 real seconds of
  fight (`PACE`, 6 acts a real minute), its quality the share of pulls answered. A kept fish pays its worth in cubes and no
  experience: the choice is cubes or growth.
- **Size kept:** `fish.size.<id>` (a ledger `hi`); the Codex's bestiary shows your biggest. Size ladders per species as achievements.
- **Bite Sense** (a knack; Espada names it): the !!! window 30% wider; opens at 200 bites set or 25 set in the window's first third.

## 6. Order

1. **The instrument** (the owner's three): the rope rule, Shift + LMB, brace in S, the rod's bend. Calissa. Numbers: Dovina.
2. **The voice and the moments:** the line's song and the drag (Wanda); the hook set, the leap, the snap, the landing, the pump in the
   model (Calissa).
3. **The catch and the fish:** the cinematic, the ten bodies refired, the bodies' tells; the reticle carries the intent (Calissa;
   the sting Wanda's, the lines Espada's).
4. **Depth:** the waters' shapes and the seven aspect keys (Petra); species rows, sizes, achievements, Bite Sense (Dovina); names
   (Espada); bodies (Calissa).

## 7. Open, for the owner

1. ~~Retire the reticle?~~ No (the owner, 2026-10-11): it stays and carries the intent.
2. ~~Release or keep?~~ Released by default, kept on a key (the owner, 2026-10-11). A release pays no cubes, only Possession
   experience (section 5).
