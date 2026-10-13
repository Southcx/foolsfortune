# The god hand as a god game (the owner, 2026-10-13)

Kept by Dovina (what makes it a god game: the verbs, the rules between them, the costs). The hand's code is Petra's (`src/godhand/`,
and the matter simulation, which grows out of the Spirit Garden's), the looks Calissa's, the sounds Wanda's, the names Espada's.

> "How about the Godhand Mode? I feel like we're missing a LOT of abilities you'd expect to have within a God-game like Black & White
> 2." ... "Don't worry about devotion systems right now, let's keep it to Zone of Influence, the seven feelings as miracles, and #5 with
> abilities that move matter aka terraforming. I also like #6. So yeah, just worry about specifying what the mechanical elements of a good
> 'God' game are." ... "What do you think about objects and creations associated with the Godhand being made out of Voxels instead of
> meshes?"

**Prior art, and what was taken:**
- **Black & White 1 and 2** (Lionhead): the hand as the whole interface; miracles cast by drawing their sign; a miracle's size by how
  long it is charged; influence as the border of your reach. Taken: the hand, the gestures, the reach.
- **From Dust** (Ubisoft, 2011): the god carries matter (sand, water, lava) and never makes it from nothing; the world is three layered
  fluids that flow, cool and erode. Taken: the matter rules, nearly whole.
- **Populous** (Bullfrog, 1989): raise and lower land as the basic verb; the earthquake, the volcano, the flood, the swamp as the big
  acts. Taken: the epic miracles.
- **Reus** (Abbey Games): a god's acts change what a place offers, and the world's creatures live in what you leave. Taken: miracles
  change the ecology's offers, not only damage.
- **Dungeon Keeper**: the hand's slap and its weight; dropping things where they will matter. Taken: the hand's feel (section 6).
- What exists: the hand and its five God Arts (`godhand/arts.js`: lift, cut, grow, twist, raise clay), already paid in Lachryma and
  already held to the Zone of Influence; the Spirit Garden's shallow-water and clay simulation (`world/garden/water.js`, `clay.js`:
  virtual pipes, erosion, slumping, water that keeps its feeling); the Soul Brush's gesture reader (`soulbrush/gesture.js`).

## 1. What makes a god game (the mechanical elements)

1. **Indirect control.** You never steer a unit. You change the world the units live in, and they answer it. Every verb below acts on
   the ground, the weather or the matter, and the creatures react through their own minds (the ecology's offers, stimuli, statuses).
2. **A world that is a simulation.** Matter flows, piles, pools, cools and wears away by rules the player can learn. The fun comes from
   chaining those rules: dig a channel, call rain, and the creek floods the camp.
3. **Conservation.** Matter is moved, not made. What the hand pours, it took from somewhere (From Dust). The exceptions cost Lachryma,
   and the biggest crack the jar. This one rule makes every act a choice.
4. **Verbs that combine.** Each miracle does something to creatures *and* to matter, so two used together make a third thing (section
   4's interactions). Seven feelings by five kinds of matter is the system's depth.
5. **A reach with a border.** The hand acts only inside the Zone of Influence, the ground explored on foot (section 2). Walking the
   island as the Courier is how the god's reach grows: the two modes feed each other.
6. **Escalation.** Small acts are cheap and many; epic acts are rare, slow to call, and change a place for a while (section 5).
7. **Consequences that last, then heal.** What you do stays long enough to matter (a game day), then the island's own ego mends it
   (section 3, the mending). The world remembers you without the save swelling.
8. **The hand is a body.** It has weight, momentum and feel: a throw flies at the speed of the flick, a slap lands, a held thing swings
   (section 6).
9. **Readable at a glance.** From above, the player reads matter by colour and texture, a miracle by its weather and a creature by its
   body. No numbers on screen, as the house rule says.

## 2. The reach: the Zone of Influence

- **The hand acts only over explored ground** (as now, `arts.js`). The ZoI's edge is drawn (`ZoiVeil`); past it the hand passes through
  and does nothing.
- **Matter and miracles stop at the edge.** Water does not flow out of the ZoI, and a miracle's area is clipped to it. The unexplored
  island stays as authored until the Courier walks it.
- **The jar's tether** stays the camera's leash: the hand ranges within its reach of the jar *and* inside the ZoI.

## 3. Matter: terraforming

**The island's matter** is a layered height field over the ZoI, the Spirit Garden's simulation laid flat. Each cell holds a column:

| layer | what | how it moves |
|---|---|---|
| bedrock | the authored island | never: the floor of every edit |
| clay | the folk's earth, what Manifest raises | stands where it is put; a slope steeper than 50° slumps |
| sand | the Dunes' | slumps past its angle of repose (34°, real sand's), and the wind drifts it |
| Lachryma | liquid, of a feeling (or fair) | flows by the garden's virtual pipes, pools, erodes sand and clay, evaporates slowly |
| crude | liquid, of a field | flows slower (viscous), floats on Lachryma, spills slicks and grows blots where it rests |
| paint | on any surface | the paint map's, unchanged: a pour of Lachryma onto ground paints it |

**The verbs** (God Arts; the five that exist stay):

| verb | does | from |
|---|---|---|
| Scoop | LMB held on matter: the hand takes a ball of the top layer (up to 20 m³; the hand shows it held, sloshing or trickling) | From Dust |
| Pour | release where you point: it falls and becomes matter there, flowing by its own rules | From Dust |
| Raise / Lower | drag up or down: the clay or sand under the hand rises or sinks, the matter taken from or given to the cells around it, conserved | Populous |
| Smooth | stroke: levels to the height where the stroke began (terraces) | the garden's clay brush |
| Carve | draw a line: cuts a channel the depth of the stroke's pressure (held time), its spoil heaped along the edges | From Dust, a ditch |
| Manifest | exists: raises a wall of clay; now it costs the clay it takes from beside it, or Lachryma if there is none | `arts.js` |

**Interactions** (each happens by the rules alone, nothing scripted):
- Water carves sand fast and clay slowly: a channel cut through a dune becomes a gully.
- Crude on water floats and travels downstream; set alight (Fury) it burns on the water.
- Sand poured into water is a ford; clay poured into it is a dam.
- Lachryma standing still for a game hour over clay soaks in: the clay there takes its feeling's ground (the garden's grounds).
- A creature on ground that floods swims or drowns by its body; a slip jelly in Lachryma swells (it is its food).

**The mending:** the island is an Island of Ego and keeps its self-image. Every edit to the ZoI relaxes back toward the authored shape
over one game day: clay and sand drift home, liquids dry. Only the deltas are kept in the save, a chunk at a time (16 m), and a chunk
that has healed is dropped. The world remembers you for a game day and then forgives you.

**Built on** the garden's simulation, made flat: `water.js` and `clay.js` lifted into one shared module (Petra's) that both the
planetoids and the island run, so the garden and the island obey the same physics.

## 4. Miracles: the seven feelings

A **miracle** is a feeling's weather called down onto one place. The hand **draws its sign** (the gesture reader the Soul Brush uses:
seven signs, one a feeling) and lets go over where it falls. It needs the feeling known (its awakening), as everything of a feeling
does.

- **Size by charge:** the hand holds the drawn sign, which grows for up to 3 real s: a small miracle (6 m, 10 s) to a great one (20 m,
  30 s).
- **Cost:** Lachryma from the pool, by size (10 to 40).
- **Opposites cancel:** a miracle cast into its opposite's weather clears both to fair (the agate rule).

| feeling | miracle | to creatures | to matter |
|---|---|---|---|
| Wonder | Aurora | halts them, staring up; shows every signature under it | standing Lachryma frosts over: a sheet that can be walked on until the miracle ends |
| Mirth | Fizz | they fall about laughing (stunned); loose things bounce | Lachryma fizzes and lifts: light things float on it, liquids froth up and overflow their basins |
| Desire | Pull | draws creatures and loose cubes to its heart | liquids flow uphill toward its heart: lead water where gravity will not |
| Fury | Storm | lightning strikes the most agitated creature, then the highest point | fire on dry ground; bolts into sand fuse glass; into Lachryma, the whole pool is struck |
| Gall | Blight | they retch, stopping over and over | corrodes: clay and sand lose height, paint curdles, crude thickens and stops |
| Grief | Rain | slows them, and they weep Lachryma | rain of Grief's Lachryma: basins fill, rivers rise, floods follow the channels you carved |
| Dread | Eclipse | the lights go out; they flee its heart | liquids go black and still (they stop flowing) for the miracle's length |

**Combinations to design for** (the depth):
- Rain then Storm: the flooded ground conducts, and the whole field is struck.
- Rain then Aurora: a frozen lake, a bridge across a gully.
- Storm on the Dunes: glass in the sand, kept until the mending.
- Pull on a river: water climbs to a dry basin uphill.
- Blight then Rain: the corroded ground washes away into a ravine.
- Eclipse on a flood: still water, a road to walk.

## 5. Epic miracles

Four, the Caster's-own of the hand. Each is drawn as a larger sign (the feeling's sign ringed), takes 3 real s of charge that cannot be
cancelled, and is **paid in the jar** (the god hand's jar is cracked a quarter of its strength, the toll's rule in the god hand's
body); one a game hour.

| epic | sign | what it does | from |
|---|---|---|---|
| Earthquake | Fury, ringed | for 8 s the ground in 30 m heaves: clay and sand thrown up and resettled at random, a fault opened across it | Populous |
| Volcano | Fury and Gall | a cone rises in 6 s and runs lava for 30 s: a new liquid layer that flows like crude, burns, and cools to clay (new ground, kept until the mending) | Populous, From Dust |
| Maelstrom | Desire, ringed | a vortex 25 m across for 12 s lifting creatures, props and liquids round and up, and flinging them out at the end | Charybdis's look, the Hurricane |
| Deluge | Grief, ringed | Lachryma of your draught's feeling floods from the sky for 20 s: a valley becomes a lake | Populous's flood |

## 6. The hand's body

- **Throwing is a flick:** a thing let go keeps the hand's velocity at the moment of release (no throw button).
- **A held thing swings** under the hand and knocks what it hits.
- **Slap** (RMB tap on a creature): a cuff that knocks it over and builds stun. The Dungeon Keeper verb.
- **The hand casts a shadow** on the ground under it, so the player always knows where it is over the terrain (From Dust, B&W).

## 7. Voxels, or meshes (the owner's question)

- **Not voxels for the island's ground.** A full voxel island at the sixth generation's budget is too much to remesh and too much to
  collide every frame, and blocky voxels fight the look. From Dust, the best terraforming game, used **layered height fields**, not
  voxels, for exactly this reason. That is section 3.
- **Yes, voxels for what the hand makes.** Manifest's walls, a Volcano's cone, glass in the sand and anything sculpted are small and
  local, and need what a height field cannot do: overhangs, arches, tunnels, things broken into chunks. Keep them as a sparse voxel grid
  (chunks of 16³ at 25 cm), meshed with **surface nets** so they read as smooth hand-pressed clay, not cubes. Re-mesh only the touched
  chunk, and build its collider from the same mesh.
- **So: a height field for the land, voxels for the creations.** Both write to the same mending: a creation crumbles back into clay
  over the game day.
- The risk is cost: measure a 10 m wall's remesh against the frame budget first (`npm run perf`). If it is too slow, fall back to
  Manifest's mesh walls, and voxels stay a later round.

## 8. Order

1. **Matter** (Petra): the garden's simulation made shared and flat, over the ZoI's chunks; Scoop, Pour, Raise and Lower; the mending.
   Calissa: the layers' looks from above.
2. **Miracles** (Petra; Calissa's weathers at strength, the heavy looks exist): the seven signs on the gesture reader, the seven
   miracles, their effects on matter.
3. **The hand's body** (Petra): the flick, the swing, the slap, the shadow.
4. **Epic miracles**, then **voxel creations** (after the perf measure).

Names (miracle, the seven, the epics) are working words for Espada's.
