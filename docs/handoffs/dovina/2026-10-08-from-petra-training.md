# TRAINING.md section 5: Petra's rows (from Petra, 2026-10-08)

## 1. What each system teaches, and the mechanic that teaches it
- **The psygun and its drills (aim).** Right. Taught by the Throwing Room: the drills are shot from the firing mark (10 m), the spray
  wall keeps every dent so a recoil pattern is read off the clay, and the pattern is the gun's own and fixed, so it can be learned.
  Nothing to add.
- **Reprogramming (sequence, condition, loop).** Sequence: yes (a macro's Functions run in the order on the lattice). Condition and
  loop: only as far as THE MIND shelf has Functions for them; not verified this round. If it has none, that is the gap.
- **The garden's water and ground (watersheds, erosion).** Right. The shallow-water sim runs where the clay sends it: a lake stays only
  in a basin you dug, a stroke that breaks the rim drains it, standing water wears the ground, and a basin facing a linked planetoid
  spills over to it (a cascade).
- **Mind Mapping (spatial memory).** Right. The map holds only the ground charted (a survey pulse; walking alone does not), and a
  Cogitomap needs four fifths of the floors walked charted.
- **The parry, the rail (telegraphs, timing).** Right. A windup's Lachryma outline thickens over the 0.8 real seconds before its window
  and is fullest in the last 0.25 s; nothing else wears it. Perception's widening now draws that ramp out (x1.5 at rank 10), the window
  never moved.
- **Angling (patience, tension).** Right as far as the line's tension is felt; not re-measured this round.

## 2. Events that should earn EXP, and the quality each already carries
- `drill.end { id, run: { hits, shots, times, group? }, tuned }`: quality hits / shots (Flick, Track, Recover), the spray group's
  tightness for Spray; `tuned` non-empty earns nothing (a tuned game is never recorded). Psychokinesis.
- `reprogram.run { q, misses, chars, secs, refused }`: `q` is the macro's own quality; typed clean is `misses === 0`; held is
  `!refused`. Use those names (`misses` is the typos Espada asked for). Possession or Spellscription as you rule.
- `map.surveyed { gained, layer }`: quality `gained` (the share newly charted). Divination.
- `garden.sculpt { planetoid, how }`: no quality yet. Proposed: `pooled` (the water held in basins after the stroke, minus before),
  so leading water where it pools is the masterful stroke. Alteration. Mine to add when you confirm.
- `move.parry { tool, how, what }`: no timing in it yet. Proposed: `lead` (real seconds before the strike, from the windup), quality
  higher the later and still in the window. Mine to add when you confirm.

## 3. Knacks (mine to build once their achievements are in)
- **Steady Hand**, **Wide Bore**, **Thick Walls**, **Early Tell**: buildable as listed. Early Tell multiplies the same lead Perception
  draws out (`creatures.shownEta`); Thick Walls is the shield's cost in `vessel/damage.js`.
- Proposed, for Mind Mapping: the map shows the way back to the last Shrine you rested at (count: 50 rooms charted; feat: a Cogitomap
  drawn on a first run of the Great Dunemaw). Names are Espada's.

## 4. Trained, with no home
- **Patience** (angling): no domain or attribute takes it. Proposed: a fish landed without the line breaking seasons Focus.
- **Orientation** (Mind Mapping): Divination already takes the survey; nothing more needed.

Built this round, for your section 6: the seven widenings are read where they act (SOUL-ALCHEMY.md section 6), measured headless
(`scripts/soulalchemytest.mjs`, 18 checks). The ostraca are next, after Soul Alchemy, as your note asks.

Delete this note in your branch when folded in.
