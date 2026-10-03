# The plan: Round 39, "Tune It by Ear"

The owner's notes on v40 (2026-10-02), turned into one round. Kept by Petra. Each division's tasks are in `docs/HANDOFFS.md`; this page
holds the decisions and the reasons, so a task can be checked against them. Round 38's plan is in `docs/plans/R38.md`. The slips,
fittings and Saggar's and Pip's shops planned for R39 move to R40.

## The owner's answers (the lore; Espada folds them into `docs/LORE.md`)

1. **The world is a snowglobe.** The **Emocean** is the atmosphere of pure Lachryma outside it; the force of an owner's Will (Kaolin's,
   and other Islands of Ego's owners') is what holds an island apart from it. **The Dunes surround the rocky outcrop of Kaolin's main
   island.** **Anagami Island** (this Island of Ego) is laid out on a **5 x 5 chunk grid**, Kaolin's plateau (the concept art) in the
   centre cell. (Petra: the world layout for R40, with the town that was.)
2. **The folk know what they are.**
3. **Many Couriers.** Every player is a Courier. NPCs can become Couriers, but it is very risky: no one survives long in the open
   Emocean's unfiltered Lachryma without becoming a **Contractor** with a **Tulpa**.
4. **What the folk call him.** The lower folk use vague, reverent honorifics ("the Prince", "the Immaculate One"): they are the feeling
   of looking at an artist so much better than you that it hardly seems worth trying, and real wonder at it ("so good you throw up a
   stank face"). Up the tiers, the noble echelon and the **court** still respect him, but speak of him by his nature: his inventions
   and his tomfoolery. The court are the whispers of self-doubt that pull you down if you let them in too deep, but they are said out of
   concern and self-protection.
5. (Which part of Kaolin each folk is: answered by 4.)
6. **Cogitohazard** is the umbrella word for environmental Lachryma dangers and maliciously aligned Figments. **Figments** are entities
   hewn from an Island of Ego's own psyche; **Egregores** are spawned from the Emocean. Neither is good or bad by nature.
7. **Excess Lachryma**, to anyone not a Courier, drives them progressively mad and transfigures them into a figment monster if the
   exposure is too high: mercury poisoning meets the potion that makes Mr Hyde.
8. **The System** is the game's code made a voice: all of us making the game, keeping things running, for the sake of a fun experience.
   Call it a god if you like.
9. **The Prince is he, femboy-coded** (Lloyd de Saloum of *Dainana Ouji* meets Tet of *No Game No Life*). The fragments are unisex by
   construction and identify any way they like.
10. **Breaking pots**: a pseudo-hivemind. Losing fresh-baked clapperjars doesn't hurt him; off too many of the higher court and he gets
    (more than) a little annoyed ("Hey, that was my favourite cup!").
11. **The title is not a place.** It is a metaphorical marker of where the story has got to, and it should change a little as things
    happen. (A note for later: it waits on the story and on graphics work.)
12. **Pip's name and Saggar's old master**: Espada goes with the gut.

## The round

### Petra (Main)
_Landed, all ten (a to j), on the default branch; the art, sound and words each needs are in `docs/HANDOFFS.md`._
- **a. Keys.** R (reset) and H (to the hub) move into the Tab panel's DEBUG section (with T's room reset), freeing R and H.
- **b. The pause menu.** The Esc card's controls rewritten to what is true now, and **navigable help pages**: one for the core
  movement and one per tool (what it is, its keys, what it does), so a change can be looked up. The pages are data
  (`src/help/`), Espada's to word.
- **c. The Lockheart.** It is one thing: the Lockheart is the coffin, so the separate coffin slot goes (the coffins become Lockheart
  variants you wear, one at the neck). The keyring has **four** slots; **keys stack to 99** (the Pneuka Box learns stacks). The keys
  hang on the charm, either side of it.
- **d. The Psygun.** Psyguns as a kind: each has a number of **chambers** and a **capacity per caster-shell type**. Caster shells are
  numbered (**Type-00**, Type-01...) and are things with models (placeholders from me, real ones from Calissa).
- **e. The Dreamvane takes the Mind's instruments.** The survey ping (Mind Mapping's N) becomes a Dreamvane ability with its own
  motion, and the compass ring is part of its kit (shown while it is worn). Its hook and tuning fork are 2.5 times bigger.
- **f. The crystals, tuned by ear** (prior art: Skyward Sword's dowsing, the Zelda ocarina's relative pitch, Morrowind's lockpicking
  by feel, *Rhythm Heaven*'s ear training). Each formation has a **key** and a **sweet spot** on its surface. Ring it with the fork
  for the reference tone; each strike of the pick sounds a note: **height sets the pitch** (above the spot is sharp, below is flat, in
  steps of the key), and **the way round sets the beating** (a wobble that slows and goes pure as you face the spot). Find it and the
  yield is many times over. **Dense** formations take many strikes for a modest yield; **fragile** ones take only a few and pay out
  wildly. Every strike says how close it was in sound and in particles; nothing is written.
- **g. The god hand** turns so its wrist points back along the line to the Pneuka Jar.
- **h. The Crucibelle's notes** zip in from the same place off-screen: a spawn-at-origin bug, as the clapperjars had.
- **i. The vessel takes damage where it is struck.** Hit regions on the Courier (the mask, the torso, each arm and leg: a collider on
  each), and **cracks where the blow landed that heal fully in time**. (The gold kintsugi stays: it is what they have earned, and it is
  kept distinct from damage.)
- **j. "In combat"** as one signal (`game.combat`): what is after them, what they have struck lately. The HUD ring reads it.

### Calissa (Art)
The HUD ring and the ability charges stepping out of sight outside combat (and the ring growing into the place that shows status); the
Dreamvane's own animation suite (the left hand on the upper haft at rest, the swing, the fork, the survey ping); the Crucibelle's
playing (the body and hands making the notes, more visual feedback that they are jamming); the crystal formations' art pass (their albedo
the sand's, a Lachryma outline and sheen to show they are alive, varied and dynamic shapes, particles on a strike that say how close it
was); caster shell models; the damage cracks' look; how a glaze sits on a painting.

### Wanda (Audio)
The crystals' sound (each formation's key, the fork's reference tone, a strike's pitch and beating, the sweet spot's reward, a
fragile formation's last strikes); the survey ping's new sound on the Dreamvane; a crack and a mend for the vessel's damage.

### Espada (Lore)
The twelve answers into `docs/LORE.md`; the help pages' words; the folk's lines by tier (the lower folk's reverent vagueness, the
court's worried whispers); Pip's name and Saggar's master.

## Next rounds

- **R40**: Anagami Island laid out on its 5 x 5 chunks (Kaolin's plateau in the middle, the Dunes around), the town that was (the
  treadmill test), slips, fittings, Saggar's and Pip's shops, selling to all four folk, STORY's first steps.
- Later: the Internal Shrine Garden; the title changing with the story; the islands and the ship between them.
