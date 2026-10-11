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
says they would be, and nothing else is added. No gauge, no glyph, no prompt. The player who learns to read a bending rod has learned to
fish, here and at a real river.

What fails today is not that the fight is unexplained; it is that the instrument is false. The line sags when it should sing, the rod
never bends, and the tension has no voice. So the player looks for a UI to tell them what the rod should have. Make the rod true and the
question goes away.

**Prior art, and what was taken:**
- **Sega Bass Fishing:** the rod's bend and the reel as the whole readout.
- **Reel Fishing:** restraint; the waiting is the atmosphere.
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
This is the readout. The line's colour cue is retired with it: one signal, read first and only.

**The line sings** (Wanda). Pitch follows the root of tension, as a real string's does: a thrum low, a tone in the band, a whine near
the snap. In the band it sits in the fish's aspect mode, so a fight held well is in key. A run pays out against the drag's click.

**The fish shows its intent with its body**, a beat ahead: it turns before it runs, rises before it leaps, shudders before it thrashes,
rolls and shows its flank when tired. The reticle's segment preview is retired once the bodies carry it (Calissa's call when the clips
land); until then it stays as it is, plain.

**Divination** lengthens the beat (`LOOK` 1.4 s x widening, to 2.1 s): the fish's tell comes earlier, nothing is added.

## 3. The moments

- **The hook set:** 4 frames of hit-stop, the line snaps straight, the rod loads, one low thump.
- **The leap:** a quarter-second held at its apex. Bowed, the line hangs slack; not, it strains.
- **The snap:** the line whips loose, the rod springs up, then a beat of silence. No jingle.
- **The landing:** the fish held up from the water; one line in the log (species, size, a record if it is one).

## 4. Numbers (mine; checked by `scripts/fishsim.mjs`)

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
- **Size kept:** `fish.size.<id>` (a ledger `hi`); the Codex's bestiary shows your biggest. Size ladders per species as achievements.
- **Bite Sense** (a knack; Espada names it): the !!! window 30% wider; opens at 200 bites set or 25 set in the window's first third.

## 6. Order

1. **The instrument** (the owner's three): the rope rule, Shift + LMB, brace in S, the rod's bend. Calissa. Numbers and the sim: Dovina.
2. **The voice and the moments:** the line's song and the drag (Wanda); the hook set, the leap, the snap, the landing, the pump in the
   model (Calissa).
3. **The bodies' tells,** then the reticle retired (Calissa).
4. **Depth:** the waters' shapes and the seven aspect keys (Petra); species rows, sizes, achievements, Bite Sense (Dovina); names
   (Espada); bodies (Calissa).

## 7. Open, for the owner

1. **Retire the reticle** once the bodies tell? My call: yes. It is a gauge the rod makes redundant.
2. **Release or keep** a landed fish? My call: release by default, a key to keep. The Pneuka Box stays light and the loop stays gentle.
