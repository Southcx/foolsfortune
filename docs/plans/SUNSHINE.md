# Water and paint: what Super Mario Sunshine knew, on the Soul Brush (Petra, R46)

The owner, 2026-10-06: "Simple ripples and water wake trails when the Courier is swimming on the surface of water ... more visual
feedback when swimming around. Do analysis of implementation and execution in the game Super Mario Sunshine ... absorb their systems.
You can use the Soul Brush as the substrate ... Reference Splatoon for other painting crossovers" (games where painting and fluid
manipulation are major mechanics) "and talk with Dovina about making the mechanical systems create synergy with the existing ones."

This is the analysis and a plan in phases. Status: **phase 1 handed to Calissa; the rest is proposed**, with the open questions for
the owner at the end (they go into Dovina's digest).

---

## 1. Super Mario Sunshine (Nintendo EAD, 2002), taken apart

What it does, and why it works:

1. **One liquid, many verbs.** FLUDD sprays one thing, water, and nearly every system in the game answers it. Water:
   - cleans goop;
   - puts out fire;
   - pushes enemies and knocks them down;
   - turns wheels and fills tanks;
   - makes plants grow and sand rise into platforms;
   - wets floors, so Mario slides on them;
   - washes paint off Shadow Mario.

   One input, a dozen outcomes. The player learns the liquid once and then reads every level through it.
2. **The tank is the leash.** The water is a meter, not ammunition. You refill it in seconds by standing in any water, at a spout, or
   from a bottle. The levels are built so that water is near. The cost is felt only as a reason to go back to the sea, and it pulls
   the player toward the scenery the stage is about (the harbour, the beach, the hotel pool).
3. **Water as a body, not a hitscan.** Each spray is many particles flying ballistic arcs that land, bead, and leave a wet mark. The
   mark darkens the floor and dries in seconds. You can see where your water went, and it arcs, so aiming is a skill.
4. **Wet ground is movement.** Dive onto a wet floor and Mario belly-slides fast and far. A wet wall can't be held. Spraying ahead to
   make a slide lane is the speedrunner's verb, and the player discovers it alone. Spray and movement feed each other.
5. **Nozzles are movement modes.** Each costs water as it is used:
   - Hover: a few seconds of level flight with full steering, a safety net more than a power;
   - Rocket: a charged vertical launch;
   - Turbo: a sprint that skims across the water and breaks doors.

   They are swapped at boxes in the level. The base kit (spray, hover) is always there; the others are lent by the stage.
6. **Goop is a bitmap.** The decompilation (doldecomp/sms: `PollutionLayer`, `PollutionManager`) and the modding tools (Goopify) show
   it plainly:
   - Each stage's goop is a set of 2D bitmaps projected flat onto the floor's and walls' planes (pollution layers, each with its own
     model).
   - A spray stamps erasing circles into a bitmap.
   - The collision asks the bitmap whether Mario stands in goop.
   - Clearing a whole layer is a goal.

   Goop has kinds: brown (slows you, swallows you), electric (hurts), fire (burns), and graffiti (Shadow Mario's paint, a symbol to
   clean). Cleaning reveals what was under it: coins, a path, a Shine.
7. **The reveal is the reward.** The satisfaction is in watching the dirty layer give way. PowerWash Simulator later built a whole
   game on just this, with a percentage per object and a chime when one is done.
8. **The water surface talks back.** The details:
   - rings spread where you touch it;
   - a wake follows you, a V behind Blooper and behind Mario's swimming head;
   - a splash when you dive;
   - Mario drips and darkens after a swim;
   - the sea's surface carries scrolling, distorted layers and the sun's glitter.

   Cheap tricks, read at once. This is the owner's first ask.

## 2. The painting and fluid games beside it, and the one thing each has for us

| Game | The idea worth taking |
|---|---|
| **Splatoon** (2015) | Paint is territory and movement: swim fast in your own colour and refill there; the enemy's colour slows you; coverage is the score. Painted by stamping splats into a texture laid over the level (UV or world-projected; Splatoon's own is unpublished, the common reconstruction is a second UV set into a paint atlas). |
| **Okami** (2006) | Already ours: the Celestial Brush. The brush changes the world rather than striking it. |
| **Portal 2's gels** (2011) | Properties as liquids: blue bounces, orange speeds, white takes portals. They pour, splash and coat, and water washes them away. Our inscriptions (bounce, heavy, light, still) are this game's gels waiting to be poured. |
| **de Blob** (2008) | Painting is how the world comes back to life: the grey city fills with colour as you roll through it. Colours mix, and paint is refilled at paint bots. |
| **Epic Mickey** (2010) | A dualism: paint restores things, thinner erases them, and each choice leaves the world changed. |
| **PixelJunk Shooter** (2009) | A small chemistry: water and magma make rock, gas ignites, and ice melts. Every liquid meets every other. |
| **From Dust** (2011) | Liquids reshape the ground. Water carves it, lava hardens to rock, sand is carried. |
| **PowerWash Simulator** (2022) | Layers of dirt, nozzles by width and strength, a percentage per surface, and the reveal as the whole game. |
| **Chicory** (2021) | The brush as the way to explore: paint marks what you have touched, and a wall painted is a wall remembered. |
| **Jet Set Radio** (2000) | Painting while moving at speed: the tag as a flourish of the run, not a stop. |

## 3. What Fool's Fortune already has to build on

- **Slip** (liquid clay):
  - the slip field (`courier/moves/env.js` `SlipField`: rectangles and fading discs) and the slip dive (`courier/moves/slip.js`,
    Splatoon's ink swim, already shipped);
  - the Brush Slide paints slip behind it (`tools/soulbrush`);
  - the WASH technique lays slip from a drawing;
  - the SLIP shell sprays it.
- **The inscriptions** (`tools/soulbrush/inscribe.js`): properties written onto things. These are Portal 2's gels as writing.
- **Water** (`courier/moves/env.js` `Water`: volumes that are swum in, drawn by `vfx/water.js`), the Weir's tripled pond, the Shore,
  the Well's Lachryma.
- **Lachryma**, the game's own liquid with five feelings; the weather that falls as it; and **grief crude**, the sea that is sold by
  the cask.
- The ecology (`creatures/ai/`: water offers, stimuli), the stun and status services, the tags (`core/tags.js`), the ledger and the
  achievements (Dovina's).

So the substrate is mostly there. What is missing is Sunshine's core: **a liquid that is carried, flung, lands, and leaves a mark the
world reads**.

## 4. The proposal, in phases

### Phase 1: the water talks back (the owner's first ask; Calissa, with a hook from Petra)
- **Ripples** where anything touches a water surface: the Courier swimming (a ring every stroke), a dive, a landing, a thrown pot, a
  fish striking, rain.
- **A wake**: a V of two fading lines behind the swimming Courier, and behind the skiff and the surfer when they run on water.
- **A dive splash**, larger than today's; drips off the Courier for a few seconds after they leave the water (a darker, glossier
  material that dries).
- The seam (Petra's): `game.water.disturb(x, z, strength, kind)`. The swim, the skiff, thrown things and fish call it. Calissa's
  `vfx/water.js` turns the disturbances into a ripple map: a small world-anchored height texture round the camera, rings
  propagated by the wave equation on the GPU or CPU, sampled by the water's normal. This is the classic ripple tank (Hugo Elias's
  "2D water", the 1990s demoscene).
- Prior art: Sunshine's rings and wakes; Wind Waker's wake behind the boat; the ripple tank.

### Phase 2: the paint map (Petra; a shared part in `src/render/`)
- **The paint map** (`render/paintmap.js`): a world-anchored grid per zone, holding up to four channels:
  - **wet** (water: darkens and glosses, dries with the heat and the weather);
  - **slip** (it takes over the slip field's job);
  - **stain** (Sunshine's goop: see phase 4);
  - one spare.
- Its interface:
  - a CPU array, so movement and the tools ask `at(x, z)`;
  - a texture, so the ground's shaders show it: a top projection, the same patch as `render/triplanar.js`;
  - `stamp(x, z, r, channel, amount)`;
  - coverage per zone, for the ledger.
- Sunshine's pollution layer, made general. Walls come later, with the triplanar projection.

### Phase 3: the Soul Brush carries a liquid (Petra)
- **The load**: what the bristles hold. It is slip (as now), water, or Lachryma.
  - **Dip** the brush in any water to fill it, in a second, as FLUDD fills: the tank as a leash to the scenery.
  - Swings fling the load in arcs (Splatoon's Inkbrush flick, already half there).
  - A held **spray** sends a stream of droplets: pooled, ballistic, stamping the paint map where they land, and calling
    `creatures.strike` with a `wet` status and `water.disturb`.
- What water does, through the existing services:
  - it puts out an ember pot;
  - it washes slip and stains;
  - it wets the ground, so the core slide and the Brush Slide run longer on wet ground (Sunshine's belly slide, taken only as a
    property of the ground: the core movement is untouched on dry ground, and a tech switched off restores it exactly);
  - it soothes or angers creatures by their minds;
  - it offers water to the ecology (jellies come to drink at a wet patch).
- The inscriptions as liquids, later: a load of BOUNCE paint is Portal 2's blue gel; HEAVY, LIGHT and STILL likewise. The Brush
  already knows the properties; the load lets them be poured.

### Phase 4: stains, and the reveal (with Dovina)
- **Stains**: Sunshine's goop, in our world. They are spills of grief crude, or a jelly's slip gone bad. They take kinds, as goop
  does:
  - one slows;
  - one stings (electric);
  - one burns;
  - one is a mark left by something (the graffiti).
- Washing a stain with water reveals what it hid: cubes, a find, a way through.
- Coverage is counted: per room, per place, and in the ledger. The reveal is the reward (PowerWash).

### Phase 5: movement from the load (opt-in techs)
- Sunshine's nozzles as Movement Arts techs that spend the load: a short **hover** (the brush as a jet under the Courier), a charged
  **rocket**, and a **skim** across water at speed (Turbo).
- Each is a tech in the belt's sense: the core movement is the gold standard, and switching a tech off restores it exactly.

## 5. For Dovina: the synergies to weigh (the economy, the ledger, the loops)
- **Water as a place's resource**:
  - the Weir's pond, the Shore and the Dunemaw's pools as filling stations;
  - the Dunes' heat drying the load and the wet sand faster;
  - the weather filling it (rain), so the five feelings can colour a load of Lachryma.
- **Cleaning as income**: stains washed pay in what they hid (cubes, finds, materials). This needs a rate against the other loops
  (angling, the Well, busking), so it is not the best pay per real minute.
- **The ledger and the achievements**: coverage washed, stains by kind, fires put out, slides on wet ground (OSRS tiers, FFXIV
  categories).
- **Lachryma as a load**: a brush loaded with Lachryma could paint a feeling. Does that cost the pool, a cask of crude, or a drink?
  And does it feed draught?
- **The Well**: the Dunemaw's pools of Lachryma as a load, and sandfalls a spray could hold back.

## 6. Questions for the owner (to Dovina's digest)
1. **Controls.** With the Soul Brush out: LMB is the club, holding RMB opens the Celestial Brush, C at speed is the Brush Slide.
   Where does the spray go?
   - Proposed: holding LMB while the load is water sprays instead of charging. Or a new key.
2. **The hover, rocket and skim.** Are they wanted as techs (opt-in, off by default), or is the spray enough?
3. **The stains.** Are they grief crude (the sea's), slip gone bad, or something new for Espada to name?

Sources: [doldecomp/sms (PollutionLayer, PollutionManager)](https://github.com/doldecomp/sms/commit/0686c767bf80b698853d47f22e73c54b7b7eaf8e),
[Goopify](https://github.com/Halleester/Goopify), [TCRF: Sunshine's pollution maps](https://tcrf.net/Super_Mario_Sunshine/Unused_Pollution_Maps),
[VFX Mike, "Splatoon in Unity" (paint into a texture over the level)](https://vfxmike.blogspot.com/2017/04/splatoon-in-unity.html).
