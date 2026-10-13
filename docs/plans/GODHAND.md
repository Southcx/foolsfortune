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

A **miracle** is a feeling's weather called down onto one place, Spellscription's power (section 8). The hand **draws its sign** (the gesture reader the Soul Brush uses:
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

Seven, one a domain (section 8), the Caster's-own of the hand. Each is drawn as a larger sign (its sign ringed), takes 3 real s of
charge that cannot be cancelled, and is **paid in the jar** (the god hand's jar is cracked a quarter of its strength, the toll's rule
in the god hand's body); one a game hour.

| epic | domain | what it does | from |
|---|---|---|---|
| Stopped Hour | Ouranurgy | time stops in 40 m for 10 s for everything but the hand: rearrange a frozen battle, pour into a frozen river | Braid, The World |
| Volcano | Manifestation | a cone rises in 6 s and runs lava for 30 s: a new liquid layer that flows like crude, burns, and cools to clay (new ground, kept until the mending) | Populous, From Dust |
| Prophecy | Divination | the next game hour is shown: the weather spells to come, the raid's waves and where they will enter, where crude will well; you may strike one of them out | Majora's Mask's Bombers' notebook, a fortune told |
| Maelstrom | Psychokinesis | a vortex 25 m across for 12 s lifts creatures, props and liquids round and up, and flings them out at the end | Charybdis's look, the Hurricane |
| Stampede | Possession | every creature in 40 m obeys one stroke for 15 s: where the hand draws the line, they run | Populous's Armageddon, Pikmin's swarm |
| Earthquake | Alteration | for 8 s the ground in 30 m heaves: clay and sand thrown up and resettled, a fault opened across it | Populous |
| Deluge | Spellscription | a feeling's sign written the size of the valley: its Lachryma floods from the sky for 20 s, and a valley becomes a lake | Populous's flood, B&W's great miracles |

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

## 8. The seven domains' god powers

Every power of the hand belongs to one of the seven domains (`progress/domains.js`; no new domains, ever). Using it pays that domain's
experience, better done paying more (the design law), and the domain's level widens it (`WIDEN`: reach, size, capacity, never accuracy).
So the god hand trains the same psyche the Courier does, and a Courier strong in a domain is a god strong in it.

| domain | what it is (the owner's) | the powers (existing in bold) | its epic | its level widens | quality (what pays more) |
|---|---|---|---|---|---|
| **Ouranurgy** | the rules of the space around you: displacement, and time slowed or stopped | **Rift** pair (pour into one, it falls out of the other: an aqueduct through space); **Fold** (two patches of ground trade places, what stands on them included); **Hasten / Stay** (the matter's time over a patch runs 4x, or stops: a river frozen mid-flow, a flood settled in seconds) | Stopped Hour | a rift's span, a fold's size, Hasten's rate | what crossed or was changed in the slowed time |
| **Manifestation** | solidifying thought into structures | **Manifest** (the wall); **Sculpt** (a voxel creation: a ramp, an arch, a bridge, a pillar, drawn as a shape and raised; section 7); **Fire** (a creation fired hard: it stands until the mending, not a few minutes); **Totem** (a standing stone that holds a miracle's weather on its spot for a game hour) | Volcano | a creation's size, a totem's reach | how much of a creation is used (walked, stood behind) |
| **Divination** | perceiving the hidden: signatures, habits, the true pitch | **Strata** (see the matter's layers under the hand: crude under sand, a spring under clay); **Course** (a pour or a miracle shown before it falls: where the water will run, the From Dust prediction line); **Read** (from above, a creature's next intent drawn over it: the Figment telegraph from the sky) | Prophecy | how deep Strata sees, how far ahead Course runs | a hidden thing found and then used (a buried spring tapped) |
| **Psychokinesis** | moving things by will | **Telekinesis** (lift and throw, by the flick); **Scoop / Pour** (section 3); **Gust** (a stroke of wind: drifts sand, pushes liquids, knocks creatures down); **Slab** (lift a whole slab of ground, what stands on it with it, and set it down elsewhere) | Maelstrom | weight lifted, Scoop's capacity (20 m³ at level 1), Gust's reach | speed and distance moved |
| **Possession** | exerting will over other minds | **Herd** (draw a line: creatures near it walk it, a sheepdog's work); **Take** (the hand goes into one creature and you play it from above, Dungeon Keeper's possession; it costs Lachryma a second); **Muster** (hatched clapperjars carry matter where the hand points: the folk's labour, Godus's) | Stampede | how many Herd moves, how long Take holds, how much a Muster carries | creatures moved where they would not have gone |
| **Alteration** | reshaping what already is | **Sunder**, **Swell**, **Wring**; **Raise / Lower**, **Smooth**, **Carve** (section 3); **Transmute** (a patch of matter becomes another: sand to clay, clay to sand, one feeling's Lachryma to another's) | Earthquake | a brush's size, Transmute's patch | how much ground changed and then held (a channel that carries water) |
| **Spellscription** | transcribing a thing down: glyphs, macros, maps | **the seven miracles** (section 4: written as signs, so they are this domain's); **Ward** (a circle drawn on the ground: creatures cannot cross it for its time); **Stamp** (a patch of terrain copied as a rutter of the land and pressed down elsewhere: a blueprint, the Cogitomap's cousin) | Deluge | a sign's size, a ward's span, a stamp's area | how cleanly the sign is drawn (the gesture's fit, as the brush's glyphs are scored) |

- **Unlocked as the house does it** (arts only by achievement): the existing five stay as they are; each new power opens by its
  domain's level (a power at levels 1, 15, 35, 60 of its domain, in the order listed) or by a feat of the domain on foot. The epics open
  at 80 of their domain. The numbers are mine once the powers exist.
- **The ledger** gets `god.<power>` counts and each its `domain` source in `domains.js` (mine), as `god.manifest` and `god.sunder` are now.

## 10. Rejection: the island's immune response (the owner, 2026-10-13)

> "An almost GTA-like Wanted system where if you take too many hostile actions or attempt to warp someone's Island of Ego excessively,
> then the island itself has like a cognitive immune response to reject you by summoning stronger Figments."

**Prior art:** GTA's wanted stars (heat that climbs with crimes, decays out of sight, escalates the response). **Persona 5's Palace
security level** (a mind's cognition noticing an intruder and sending stronger Shadows, calmed by staying unseen): the nearest match
there is, an ego defending itself. Assassin's Creed's notoriety (fed by acts, eased by deeds). Noita's Stevari (strike in the holy
place and the place itself comes for you).

- **What feeds it: harm to the island's self-image, never use of the hand.** It is the mending read backward:
  - how far the ground stands from its authored shape (the matter's delta, section 3), weighted by how fast it was made (a flood in
    a second weighs more than a valley carved over an hour);
  - acts against the folk (a clapperjar thrown, one of the folk struck, the hand's slap on them);
  - epic miracles (each a big push).
  Building gently (a bridge, a ford, a channel) weighs little. The player who sculpts is left alone; the one who scars is not.
- **Five steps of rejection**, each calling a stronger answer, spawned at the edge of the hand's view and coming for the jar:
  1. strays: Figments of class 1 drift in;
  2. a pack, and the Figments wear the island's feeling;
  3. aberrants, and blotlings well up from the crude in the ZoI;
  4. a class 2, a FOE out of its Well;
  5. the island's own answer, a class 3 made of the ground you scarred (its body your clay and sand, Espada's to name, Calissa's to
     shape): beat it and the rejection resets to nothing.
- **Read without words:** the sky darkens a step at a time, the ground's grain stands up like hackles, and the music thickens (Wanda's
  stack, Rez's layers). No stars drawn on the screen.
- **How it cools:** stop scarring and it falls a step a real minute while the mending runs. A Shrine is sanctuary: no Figment of the
  rejection follows you into one, and resting there clears it. Leaving the god hand does not clear it; the Courier walks out into it.
- **The gamble** (the house's taste): a Figment of the rejection pays its yield at the rejection's step, ×1 to ×3, and its EmO starts
  high. So scarring the island on purpose to farm what it throws at you is a real strategy, and it can shatter you.
- Working name **rejection** (Espada's to name). The ledger: `god.rejection.<step>` firsts and the highest step reached; an achievement
  for beating the step-5 answer, and one for a day of terraforming that never passed step 1.

## 9. Order

1. **Matter** (Petra): the garden's simulation made shared and flat, over the ZoI's chunks; Scoop, Pour, Raise and Lower; the mending.
   Calissa: the layers' looks from above.
2. **Miracles** (Petra; Calissa's weathers at strength, the heavy looks exist): the seven signs on the gesture reader, the seven
   miracles, their effects on matter.
3. **The hand's body** (Petra): the flick, the swing, the slap, the shadow.
4. **The domains' powers** (section 8), a domain at a time, the ones that reuse built parts first: Herd and Take (the minds exist),
   Strata and Course (the matter's own data), Rift (the caster shells' portal), Ward (the gesture reader).
5. **Epic miracles**, then **voxel creations** (after the perf measure).
6. **Rejection** (section 10): it needs the matter's delta (1) and the epics (5) to have something to read.

Names (miracle, the seven, the epics) are working words for Espada's.

## As built (Dovina, 2026-10-13)

What is in, and what is not yet. Numbers live in the modules named; nothing here overrides them.

- **The island's matter** (`godhand/matter.js`, pure; `godhand/islandmatter.js`, the look and the collider; `game.matter`). A 144 x 144
  field of 0.5 m cells (72 m square) laid round your Pneuka Jar when the hand first touches matter, its bedrock sampled once by rays.
  Layers: clay, sand, Lachryma (water, with the seven feelings' shares). Virtual-pipe flow at 30 Hz, slump at the angle of repose (sand
  0.67, clay 1.19), the mending back to the authored shape (`mendTau` 1200 real seconds). Work is limited to a bounding box of touched
  cells and the water's rows; the collider (a Rapier heightfield over that box) is rebuilt at 3 Hz while the hand works and every 5 real
  seconds while it only mends. Measured headless: 0.6 ms a step at 144 squared.
- **The verbs** (`godhand/matterarts.js`): Scoop (keys 6), Shape (7, Shift levels), Carve (8). Made matter costs Lachryma
  (`GOD_POWERS[id].made` a cubic metre). Scoop's carry is widened by Psychokinesis (`WIDEN 'psychokinesis.carry'`, x2 at 99).
- **Miracles** (`godhand/miracles.js`): MMB held draws the sign (the Soul Brush's gesture reader); a sign's size on screen sets the
  miracle's size and cost. Needs the feeling awakened and the ground in the Zone of Influence. Shift turns the sign into its epic (one a
  game hour, paid in the jar). All seven of each run; their looks are placeholder rings and the existing weather/status looks.
- **Rejection** (`progress/rejection.js`, numbers; `godhand/rejection.js`, `game.rejection`): heat from matter moved (0.5 a m³, made 1),
  a miracle 8, an epic 60, a throw 2; steps at 25, 60, 110, 170, 240; ebbs 2 a real second after 12 quiet; an answer every 20 real
  seconds, at most 8 alive; the fifth step's answer is a size-2.2 class-2 slip jelly, and putting it down clears the heat
  (`god.rejection.beaten`). A Shrine's rest clears it. The answer carries cubes (`REJECTION.stash`) and arrives at EmO 0.8.
- **Experience** (`progress/domains.js`): scoop and pour Psychokinesis, shape and carve Alteration, a miracle Spellscription (quality:
  the sign's score, more for a bigger one), an epic its own domain.
- **The ledger and achievements**: `god.moved`, `god.made`, `god.miracle.<feeling>`, `god.epic.<id>`, `god.rejection.step`,
  `god.rejection.beaten`; the hand's new subs Matter, Miracles and Rejection (`gx1..3`, `gq1..3`, `gja`, `gjb`).
- **Creations** (`godhand/voxels.js`, pure; `godhand/creations.js`, `game.creations`): Sculpt (key 9, Manifestation 15) drags a line:
  a pillar for a short stroke, an arch (a bridge when long) for a long one, a ramp with Shift. Sparse 16-cube chunks of 0.25 m voxels,
  stamped from a signed distance with a 2 m ramp and meshed by naive surface nets; one mesh and one trimesh collider a chunk, remeshed
  only when touched, inside 1.5 ms a frame. Paid from the carried matter first, then 0.6 Lachryma a cubic metre. The mending ebbs
  every voxel evenly every 30 real seconds, so a creation goes from the outside in (a 1 m wall in about a game day); what it loses goes
  back into the island's matter as clay. Measured headless in the Dunes (v178 + this): a 10 m arch stamped in 8.8 ms, 11.6 m³, 19
  chunks, 5,532 triangles with a pillar and a ramp beside it; ticks 6.0 ms before, 5.9 ms with them standing; frames 7 to 24 ms
  while its chunks remeshed (about 17 frames), at the old 2.5 ms budget.
- **Not built yet** (`GOD_POWERS[id].built` false): the domains' other sixteen powers (section 8). The island's own antibody Figment
  (rejection's answer) is the ordinary Figments for now.
