# The Great Dunemaw: a cave of wonders under the sand (the owner, 2026-10-06, second ask)

A round-robin spec: Calissa drafted it, and each division owns its section and answers its questions in it. Petra builds the layout,
the colliders and the creatures' bodies; Dovina the FOE's numbers, the breeding and the finds; Wanda the sound; Espada the lore and the
names; Calissa the look. Units: metres; **real seconds**, or **sim seconds** (the game's own clock, which stops when the game pauses and
which a replay sees the same) where it says.

## The owner's ask

> "Why would it be spouting like a fountain instead of a sinkhole like an antlion trap? Think of the Cave of Wonders from Aladdin,
> subterranean desert caverns with slip rivers and sand slopes, forgotten pots and artifacts beneath the surface and touched by warp
> from Lachryma. Rooms should have multiple scales, greater than 5x5. Up to 25x25. Stalactite jumping puzzles. We must think in
> complex terms. Could this be the breeding ground of the slip jellies? How are we gonna turn the Great slipjelly into a proper
> bossfight/ FOE? I feel like it should have a broken urn stuck on its head like a weird crown, and breaking off the urn reveals a
> weakpoint or something."

The first draft (a mind full of sand, a spout pouring up) is withdrawn. The owner is right: a maw swallows. The spout leaves the
mouth and goes up to the Dunes as the slip geysers (`docs/plans/DUNES.md`).

## One look, named plainly: THE PIT AND THE NURSERY

On the sand, the Dunemaw is an **antlion pit**: a cone of sand sliding down to a black eye. Under it is a **cave of wonders**: caverns
of every size, rivers of slip (sand carried by liquid Lachryma) running through them, the town's forgotten pots half buried, and
artifacts glinting in the walls. Where the Lachryma runs thick, the place warps. At the bottom, in the largest cavern, is the
**nursery**: the slip jellies breed in the slip, and the Great Slip Jelly broods over them, crowned with the urn it grew up in.

## Prior art

- **The antlion's pit** (*Myrmeleon*: a cone dug at the angle of repose, so the sand gives way under anything at its lip) and the
  Sarlacc's pit: the mouth.
- **The Cave of Wonders** (Disney's *Aladdin*, 1992): a mouth that rises from the sand; inside, treasure caverns. The rule "touch
  nothing but the lamp" gives the warp its sense: what you take changes the place.
- **Spelunky's caves**, **Terraria's underground desert**, **Dark Souls' Blighttown and Ash Lake**: one space at many scales, vertical,
  read from inside.
- **Journey's sunken city and its sand slopes, Uncharted 3's Iram**: sand that flows like water, the slide down as a one-way door.
- **Prince of Persia: The Sands of Time, Mario's crumbling platforms, Ori's Ginso tree**: the stalactites to jump between, some of
  which fall.
- **Metroid's Kraid and the Kirby boss rule** (armour first, then the weak point), **Monster Hunter's part breaks**, **Zelda's Dodongo**:
  the urn crown that breaks off to reveal the core.
- **Etrian Odyssey's FOEs**: the creature of the floor you can see coming and choose to face.

## The mouth: an antlion pit (Calissa's look; Petra's ground)

- **On the sand:** a cone **32 m across and 8 m deep**, its slope at the angle of repose (about 34 degrees). The sand slides toward
  the eye in streaks that spiral inward. Stepping over the lip, the Courier is pulled down at **1.5 m/s** and can climb out against it.
  The eye at the bottom (the labradorite pool, 3 m) is the way in.
- **Petra:** carve the pit into the Dunes' `heightAt` (a cone with a soft lip), and give it a slip current. **Calissa:** the cone's
  sliding sand (a material over the pit's ground) and the eye.
- **Landmark:** from the oasis, the pit is seen by what stands round it: three leaning stone horns, the points of a chimney-crown.
  **Espada (LORE.md, "The cave of wonders and Strawman", a proposal for the owner):** it is the Prince's head. The town raised a
  statue to him in the boom, and when the town fell he went in face first; Kaolin swallows what hurts, and this is his own face under
  the sand. Whether it is only a statue stays blank. **Calissa:** the horns read as his crown's silhouette from the oasis.

## The caverns (Petra's layout)

- **The grid** is **25 by 25 cells of 8 m a floor** (200 m square), carved, not boxed: a cave generator (cellular automata over
  the cells, then rooms stamped in at scale). That makes room for spaces of every scale:
  - **pockets**: 1 to 2 cells (8 to 16 m), a pot, a find, a jelly;
  - **chambers**: 3 to 6 cells (24 to 48 m), the ordinary room;
  - **halls**: 8 to 12 cells (64 to 96 m), a slip river through them, two or three tiers;
  - **the great cavern** (the last floor's): up to the whole floor (200 m), the nursery and the FOE's arena, 30 m to its roof.
- **Three floors** stay (Dovina's pay and the FOE count), each larger.
- **Sand slopes:** one-way descents between tiers (20 to 35 degrees), walked or ridden (the skiff works on them).
- **Slip rivers:** channels of moving slip, 3 to 8 m wide, flowing at **3 to 6 m/s** (a current: they carry the Courier and the
  skiff). Ridden downstream, they are the quick way. They pour off ledges as **slipfalls**.
- **Stalactite runs:** over a pit of slip, stalactites and the stumps of broken ones to jump between, 3 to 4.5 m apart (a dash and
  a jump within the core movement's reach: Petra measures the gaps against `config.js`). Three kinds:
  - **stone**: solid;
  - **brittle**: shakes for **0.8 sim seconds** after it is landed on, then falls (it regrows after 20 sim seconds);
  - **warped**: phases in and out on the Dunemaw's beat (2 sim seconds solid, 1 gone), shown by the glitch's tear on it. **Wanda:**
    the runs' cues are 60 bpm in 3/4, one bar a cycle, restarted on the bar line after a pause; she asks Petra for one
    `dunemaw.beat { phase: 'solid' | 'gone' }` a cycle (not one per stalactite). Brittle ones creak with rising grit over the 0.8 s,
    then snap, whistle and splash.
- **The way down** of each floor is at the bottom of its deepest slope.
- **Budgets** (the gate's): one `well` zone, but a floor this size needs **sub-zones** (a hall at a time drawn, Petra's call; Wanda
  asks that each carries its size, for the reverb); at most
  60 draw calls and 150k triangles in view; the sand surfaces are heightfields, at most 32 by 32 samples each.

## The finds and the warp (Dovina's numbers; Calissa's look; Espada's history)

- **Forgotten pots:** half buried in the sand. They are breakables (`hasTag(breakable)`); some hold a find. **Espada:** they are
  the town that was: the boomtown dug for crude deeper than the Weir's Well, the shaft gave way and the sand came in (Old Grog's
  "before the sand came"). The Great Dunemaw is that collapse. The pots are folk who did not become jellies, empty now; the artifacts
  are what the boom bought.
- **Artifacts:** set in the walls, glinting (the Dreamvane hears them), taken home with the haul. **Dovina:** how many a floor, and
  their worth (`econ/islands.js`).
- **The warp:** near thick Lachryma, the place shows its data (the glitch's tear, on the objects themselves); sand falls upward;
  a pot floats. **"Touch nothing but the lamp":** taking an artifact from a warped pocket shifts the floor round it (a sandfall opens,
  a slope turns). **Espada:** a rule of every Well: a memory changes each time it is handled ("Take what you came for, and nothing
  that is looking at you," says Grog). **Dovina:** is it a risk that pays, or only a trick?

## The nursery: where the slip jellies breed (Dovina's ecology; Petra's creatures; Calissa's look)

- **The slip** is where they breed: clutches of eggs (soft spheres, 0.4 m) in the shallows of the slip rivers, and **brood**
  (young jellies a third of the size) round them. The deeper the floor, the more.
- **The ecology** (`src/creatures/ai/`): the slip is an ecology offer (`nest`). Jellies near a clutch guard it (a drive); a broken
  clutch draws them. **Dovina:** the rates, and whether clutches respawn by game day.
- **Espada:** canon. The first jellies were townsfolk; the brood are born of the slip and were never folk.

## The FOE: the Pithos, the Great Slip Jelly crowned (Dovina's fight; Petra's body; Calissa's look; Wanda's sound; Espada's name)

It grew in an urn as a brood jelly and outgrew it; the urn split and stayed on its head, a broken crown. It broods in the great
cavern over the nursery. **Espada:** the folk call it **the Pithos** (the log keeps "the Great Slip Jelly"). A pithos is the great
storage jar; Pandora's "box" was one, and when everything flew out, hope stayed at the bottom. The urn was the town's crude jar, and
breaking the crown reveals the bright thing at the bottom of the jar: the core.

- **Phase 1, the crown.** The urn on its head takes every blow to the top (blows bounce off, a ring of sparks: the resist mark).
  It rams and slams. The urn cracks in **three stages** (Monster Hunter's part break): from heavy impacts, or when its own ram meets
  a pillar or a stalactite. **Dovina:** the urn's toughness, and which damage types crack it.
- **The break.** At the third crack the urn bursts off (the glitch's cut and slam). Underneath is its **core**, a lens of bright
  Lachryma that pulses: the weak point. It reels for **4 sim seconds**.
- **Phase 2, bare.** Hits to the core land hard. It sinks into the slip and surfaces elsewhere; it calls the brood out of the clutches;
  the arena's sand starts sliding toward its centre (an antlion's own pit, round it). **Dovina:** the core's multiplier and the brood's
  number.
- **The end.** Burst, or **reprogrammed** at low health (the data drain), which ends the fight and leaves the nursery to the Courier.
  **Dovina:** what each pays.
- **The look (Calissa, built: `src/vfx/urncrown.js`, in the workbench):** the urn is a cracked ru ware piece (sky-blue celadon,
  crazed), its crack lines glowing with the Lachryma at each stage; at the burst it flies off in shards; the core is labradorite turned
  to light, pulsing.
- **The sound (Wanda, `docs/handoffs/everyone/2026-10-06-from-wanda-the-dunemaw-s-sound.md`):** each crack a cascade of crazing
  ticks; phase 1 quiet and held, a layer per crack; the burst is the drop (a beat of silence on the glitch's cut, the wall on its
  slam); the 4 s reel is one bar at 60 bpm, phase 2 starting on the next bar line; the core hums and rises as it weakens.
- **Events (Wanda's ask, for Petra):** `well.crown { stage: 1 | 2 | 3, by }` at each crack, stage 3 the burst (the glitch slams on
  it too: Calissa adds it to MOMENTS).

## The look (Calissa)

The verse into the wall stays (the floors' colours by depth, the FOE's slam: `vfx/dunemawkit.js` MOOD). The caverns are the Dunes'
sand turned to stone where it is old: terraces of bismuth only where the Lachryma runs. The slip is sand and labradorite flowing together.
The flythrough previews each floor (`src/cine/flythrough.js`).

## Order of work (to be settled in the round)

1. **Petra:** the pit in the Dunes; the cave generator at 25 by 25; slopes, slip rivers, stalactite runs; sub-zones.
2. **Dovina:** the FOE's fight, the nursery's ecology, the finds' worth.
3. **Espada:** the town under the sand, the buried head, the FOE's name, Strawman.
4. **Wanda:** the pit's hiss, the slip rivers, the stalactites' beat, the FOE's drop.
5. **Calissa:** the pit's sand, the slip's material, the stalactites, the pots and artifacts, the urn crown and the core, the brood
   and the clutches.
