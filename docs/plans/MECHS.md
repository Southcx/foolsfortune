# Mechs: giant robots the Pneuka Jar pilots (Dovina's plan; South's ask, 2026-11-02)

> South, 2026-11-02: "Giant robots. Pilotable. They should have a cradle for the Pneuka Jar to screw into. I'm thinking... Neon Genesis
> Evangelion mixed with armored core, mixed with the giant robot sections from Ratchet and clank. This is a request for a fun,
> experimental module, so don't hold back on the design." And the ruling with it: "moving forward I vote we have the Pneuka Jar in a
> cradle/saddle riding stuff instead of the Courier model, with the exception being the Solar Skiffing module where we want to see the
> Courier."

Plain names throughout (CLAUDE.md, "Plain names until settled"): a **mech**, its **frame**, a **part**, **sync**, **the cable**, **the
barrier**, **the hangar**, **the proving ground**, **a giant**. Espada proposes the lore names when South calls the module finalized.

## 0. The ruling on riding (South, 2026-11-02)

**What rides is the Pneuka Jar, sealed in a cradle or set in a saddle; the Courier rides only the Solar Skiff.** The slip jelly mount
carries the Jar in a saddle on its crown (today it carries the Courier cross-legged). A mech carries it sealed in its chest's cradle. The
ships already do: the helm's cradle (HANKO.md). Every mount to come does the same. Petra's to change on the jelly mount (its seat, its
rider), Calissa's to draw (a saddle that fits the Jar's foot ring).

Why it is right, not only cute: one being in several forms (the glossary's Vessoul). The Courier is the body that walks and holds tools; the
Jar is the soul that drives other bodies. A mount is another body. The skiff is the exception because it is a board under the Courier's
own feet, ridden with the core movement's balance, not a body the Jar drives.

## 1. Prior art: what is taken, and from where

| from | what is taken | what is left |
|---|---|---|
| **Neon Genesis Evangelion** (1995) | The entry plug: the pilot's capsule screwed into the unit's spine, the unit dead until it seats (here: the Jar sealed into the chest's cradle with a quarter turn). **Sync ratio**: how far pilot and unit move as one, the unit's output scaling with it, and the pilot feeling the unit's wounds. **The umbilical cable**: unlimited power while plugged, five minutes of internal battery when cut. **The AT Field**: a barrier the unit can **neutralise** in the enemy at close range. **The berserk**: an unit that moves on its own when the pilot cannot. The launch: catapulted up a shaft to the surface. | Angels, the plot, mothers in the cores. Our giants are Figments, our pilot is you. |
| **Armored Core** (1997 to AC6, 2023) | **Assembly** from parts per slot (head, core, arms, legs, back units, booster, generator, arm weapons), each a trade: weight, energy load, armour. **Load limits** (the legs carry, the arms hold) and the **energy budget** (generator output against the parts' draw). **Leg types** that change how it moves (biped, reverse joint, tetrapod, tank). **Quick boost and assault boost** costing energy. AC6's **stagger** (ACS): pressure until the enemy staggers, then a heavy blow lands double. The garage and the **test**. | Mercenary missions, the corporate plot, arena ranks for now. |
| **Ratchet & Clank** (2002) and **Going Commando** (2003): Giant Clank | **Scale as a change of game**: the small hero made huge, the camera pulled far out, a city become a toy table, a **short moveset** (a punch string, a charge, thrown bombs) against a **kaiju** in a set-piece arena. It is fun because it is simple and loud. | Its menus. |
| Gundam's Mobile Fighter G, Pacific Rim (2013) | The pilot's own motion read into the giant (here, read as rhythm: sync from moving with the frame's own stride). Kaiju fights in a city at night. | Drift-compatibility as a story beat. |
| Front Mission, MechWarrior | Parts broken off by region (an arm gone, its weapon gone; legs damaged, slower). | Heat as a meter: our energy is the meter. |

## 2. The loop at three scales

- **The next thirty seconds:** walk the mech in step with its stride to lift sync, close on a giant, drop its barrier with yours, stagger
  it with blows, hit it while staggered. Watch the battery when off the cable.
- **The session:** assemble a frame at the hangar's gantry for a giant's habits (a heavy tank frame to stand in its swipes, a light biped
  to dance round it), launch, win, bring home parts and materials, rebuild.
- **The week:** a hangar of parts earned by achievement and bought, a frame of each leg type, every giant beaten, the berserk survived, the
  sync records.

## 3. What it teaches without saying so (DESIGN.md 22: "Every system teaches something real")

**Mass and power.** Every number is a real physical quantity, so the way the mech moves is physics, felt:
- **a = F / m**: the booster's thrust in kilonewtons over the frame's mass in tonnes is its acceleration. A heavy frame is slow to start
  and slow to stop; the same thrust on a light frame darts.
- **Momentum, p = m v**: a charge's blow is the frame's momentum. The heavy frame hits hardest moving fast.
- **The power budget, P = E / t**: the generator's output (kW) against the parts' draw; the battery holds kJ. Boosting draws power in
  proportion to thrust; off the cable, energy is time.
- **The pendulum gait**: a walking leg is a pendulum, its natural stride period T = 2π √(L / g) for a leg of length L. Bigger legs stride
  slower (a 6 m leg: about 4.9 real s a full swing, a step in half that). Sync rises when you move **with** the stride (walk on its
  beat, turn between steps), falls when you fight it. A player learns why giants look slow in films and why that is right, and what
  Froude's walking limit (v ≈ √(g L)) means: the mech's walk tops out there, and only boosters break it.

## 4. The mech

### 4.1 Parts and slots (Armored Core's assembly)

Nine slots. Each part is a row of honest numbers (`PARTS`, `src/progress/mechs/parts.js`):

| slot | what it gives | what it costs |
|---|---|---|
| **head** | sight (the lock range), the radar's reach | mass, draw |
| **core** | the cradle (every core has one), armour for its region, the generator's mount | mass |
| **arms** | the arm load limit (what the hands can hold), the punch's force | mass, draw |
| **legs** | the load limit, the leg length (the stride and the walk's top speed), the leg type | mass |
| **booster** | thrust (kN): the dash, the jump, the hover | draw while firing |
| **generator** | output (kW) and capacity (kJ, the battery while off the cable) | mass |
| **left arm weapon / right arm weapon** | the blade, the blaster or the fist (4.3) | mass, draw per use |
| **back unit** | one more: missiles, a shield, a radar, a camera | mass, draw |

**Leg types** (each its own movement, AC's four):
- **biped**: the all-round frame, the pendulum stride, a jump.
- **reverse joint**: the jump twice as high (a spring in the joint), a lighter load.
- **tetrapod**: hovers on its booster without draining while still (a stable platform), slow to walk.
- **tank**: treads, no stride (sync from steady aim instead), the most load, no jump, turns on the spot.

**The assembly's checks** (the gantry shows each in red, saying why, and lets the frame go out with its penalty: refused, an overweight frame's penalty could never be played; Armored Core 6 lets an overweight frame sortie too):
- **overweight**: the total mass past the legs' load limit: the mech can stand but not boost, and walks at half.
- **over the arm load**: the weapons' mass past the arms' limit: the arm weapons aim slowly (half turn rate).
- **under-powered**: the parts' draw past the generator's output: the battery drains even standing on the cable.

### 4.2 Sync (Evangelion's ratio, read from play)

Sync is 0 to 1, shown as a percent. It **multiplies the mech's output** (0.5 + sync: half at none, x1.5 at full) and **how much of the
mech's cracks echo into your Pneuka Jar** (feedback: 0.3 x sync of each crack). High sync is strong and it hurts.

What moves it:
- **+** stepping on the frame's stride beat (a step started within its window), turning between steps, a blow landed on a staggered giant;
- **−** a step fought (started mid-swing), a blow taken, the battery low;
- **its ceiling** is your mental state's calm (`game.courierMind`): a Courier pushed to overflow cannot sync past 0.6. A dish served at
  the hearth before a launch (Spirit Cooking's draught) settles it. That is a cross-module reason to cook.

Sync starts at 0.3 on sealing and settles toward 0.4 at rest.

### 4.3 The arm weapons: a blade and a blaster (South, 2026-11-02)

> "the mechs don't need access to all the lachryma tools. A blade and a blaster is more than enough for now, we can bake special moves
> into a per-part basis, and amplify/modify existing God Art abilities." (passed on by Calissa)

| weapon | what it does |
|---|---|
| **the big gun** (the blaster) | a rifle: shots, and a charged beam that pierces a giant's barrier while it holds |
| **the great blade** | a cutlass string of three, the third a launcher that staggers |
| **the fist** | the bare hands: a punch string of three (Giant Clank's) |

**Retired** with the ruling: the great brush, bell and flail (arm weapons), and the great vane and lens (back units). A saved frame
wearing one falls back to the clay frame's part in that slot.

**Next, not yet designed** (South's direction):
- special moves carried by a part, each part its own;
- the God Arts amplified or modified when cast from the frame.

The back units that stay are the missiles and the shield.

### 4.4 Energy and the cable (Evangelion's five minutes)

- **On the cable** (plugged at a socket in the proving ground): the battery refills at the generator's output, and the mech can go
  as far as the cable's 60 m. Past it, the plug pulls free with a jolt.
- **Off the cable**: the battery (the generator's capacity) is all there is. **The pool backs it**: once the battery is dry the mech
  drinks your pool at the generator's draw. The pool empty, the mech fails: it kneels, the Jar is thrown clear, cracked (the cradle's
  `body` rule, as written).
- The battery's seconds left are on the mech's own readout (Calissa's), and the generator's whine falls as it empties (Wanda's): two
  avenues and a third, the pool's tube draining once it backs the battery.

### 4.5 The barrier (the AT Field)

- **Yours**: the pool's shield, as for every vessel with a pool (the vessel's rule): a blow drains `SHIELD` of the pool before it cracks.
- **A giant's**: blows on it do nothing while it holds, but a gold shimmer. **Neutralise** it: hold V within 40 m and your barrier
  presses on its barrier; it falls over 2 real s of pressing. While you press, your own shield is down (your blows land on its body, its
  blows land on yours). Then you have 12 real s before it rises again.
- The big gun's charged beam pierces a barrier (it lands at a third), so a frame built for range has its own answer.

### 4.6 Stagger and the heavy blow (Armored Core 6's ACS)

A giant fills a **stagger** gauge with every blow (impact weighs most: the fist and the charge). Full, it **staggers** for 3 real
s: every blow lands x2, and a charge or a heavy blow on it then is a **critical** (x3, its region broken).

### 4.7 Damage by region (the vessel's rule, Front Mission's parts)

The mech is a vessel of form `mech` (`FORMS.mech`, `progress/combat/vessel.js`): regions head, core, armL, armR, legs, back. Thick
armour: a full blow cracks it 0.18 (a heavy frame's armour lowers that). A region broken:
- an **arm**: its weapon is gone until the mech is mended;
- the **legs**: half speed, no jump;
- the **head**: the lock range halves;
- the **back**: the back unit is gone;
- the **core**: the mech fails, as when the pool empties.

Mended at the hangar's gantry, in gold.

### 4.8 The berserk (Unit-01)

When the mech would fail (the pool empty or the core broken) **with sync at 0.8 or more**, it may instead go berserk (one chance in
three, rolled on your dice): for 12 real s it moves on its own, at full output and no draw, toward the nearest giant, striking. You can
only steer it a little. Then it kneels, and the Jar is thrown clear, uncracked. It is a reward for high sync, never a plan.

### 4.9 The moveset (Giant Clank's simplicity)

| input (desk) | does |
|---|---|
| W A S D | walk (the stride), from the camera |
| Shift | boost: a quick boost (a dash, AC's) tapped; held, the assault boost (a charge: momentum) |
| Space | jump (biped, reverse joint); hover (tetrapod); held on a booster, rise |
| LMB / RMB | the left / right arm weapon |
| G | the back unit (the art key: the arc's meter slot on touch) |
| V | the barrier: press on a giant's barrier at close range |
| F | the cable: plug or unplug at a socket |
| X | unseal (the Jar lifts out; the mech kneels where it stands) |

On touch: the arc's `mech` context (TOUCH_ARC, `progress/toucharc.js`): A the left arm, D the right, B boost, C jump, E the barrier, F
the back unit; BELT the cable and unseal.

## 5. Where it is played

### 5.1 The hangar (a room off the Index)

THE HAND group, beside the Sandbox. A tall hall:
- **the gantry**: the mech stands in it, its chest open. F at the gantry's lectern opens **the assembly page** (AC's garage: the slots as
  a slot row, the parts as choice cards, the frame's numbers with compare arrows, the checks' refusals said in red). Mending happens
  here.
- **the cradle**: at the mech's chest, a cradle of kind `body`. F at its ladder top seals the Jar (the fold, the drop, the **screw**: the
  quarter turn becomes a full thread turned home, two turns, clacking: South's "screw into").
- **the launch**: sealed, the gantry's clamps let go and the mech rides the lift up the shaft (Evangelion's launch), and the seam opens
  on **the proving ground**.

### 5.2 The proving ground (Giant Clank's toy city, Pacific Rim's night)

A yard at the mech's scale: clay buildings to knee height (things to step round, or through), the workshop's pots at giant size, two
**sockets** for the cable, and **the arena's giant**. The camera is pulled out to the mech's scale.

### 5.3 The giants

A **giant** is a creature of the island's psyche at the mech's scale, built as every creature is (a body module and a mind of data from
`creatures/ai/`), with a barrier, a stagger gauge and a vessel (form `giant`).
- **The straw giant** (training): Pip's biggest try at Strawman, stitched on a scaffold; it never fights back until you have staggered it
  once, then swipes. Its barrier is a quilted sheet.
- **The first wild giant**: a **dune colossus**, a Figment of the Dunes' sand risen in Fury's weather (later: the Dunes at scale, met in
  the world by a mech walked out of the hangar's door). Not in v1.

### 5.4 The world, later (v2)

The hangar's door opens on the Dunes: a mech walked in the world. Cross-module from day one, because the substrate already answers:
- **its footsteps** are noise stimuli (stealth.js `stepNoise`), the loudest thing on the island: Figments hear it a kilometre off and
  flee or panic (`panicOf`: their yield band);
- **its stomps** dent the island's matter (`godhand/matter.js`), and the dents are **warp marks**: the Dissonance Level rises and the
  island sends **sentinels** (rejection) at it. Pilot a mech carelessly and the island fights back at scale;
- **Fury's lightning** strikes the tallest thing in reach: a mech standing in Fury's weather is struck, and a bolt fills its battery
  (a lightning rod). Real, and a reason to stand tall in a storm;
- **thrown things**: its hands pick up a boulder or a pot of the island's size and throw it, an Impact blow by its energy
  (`world/impacts.js`): the mass is huge, so is the blow;
- **the paint map**: walking in crude, the mech slides.

## 6. Economy

- **Parts** (`PARTS`): the clay frame (one of each slot) is given at the hangar's first visit. The rest are earned:
  - a **count way and a feat way each** (DESIGN.md 22) for the special ones (a leg type for winning with it, a weapon for beating a
    giant with its tool);
  - **bought at the gantry** once earned, a second copy for a second frame, at `worth` (a sink: parts never resell for more than a
    tenth).
- **Giants drop** materials by body (`DROP_TABLES.giant`): straw, sand, clay at scale, a rare core.
- **Mending** at the gantry costs cubes by the cracks, as the kiln's MEND does (a sink).
- **No cubes for a win**: the win is its drop, its first today (`FIRST_TODAY`), and the achievement.

## 7. The ledger and achievements (predicates over the ledger, never flags)

Events (each with `by`): `mech.seal`, `mech.unseal { why }`, `mech.launch`, `mech.assemble { frame }`, `mech.step { beat }`,
`mech.boost { kind }`, `mech.hit { weapon, part, staggered }`, `mech.hurt { region, broke }`, `mech.cable { plugged }`,
`mech.barrier { neutralised }`, `mech.berserk`, `mech.fail { why }`, `giant.stagger`, `giant.down { id, weapon, leg }`.

Counters: `mech.seal`, `mech.launch`, `mech.step.beat`, `giant.down`, `giant.down.<id>`, `giant.down.weapon.<w>`, `giant.down.leg.<type>`,
`mech.berserk`, `giant.stagger`; records: `hi mech.sync`, `lo giant.time.<id>`, `hi mech.offcable` (real s off the cable in one run).

Achievements (a first wave, under "The Hangar"):
- **First Sync**: seal the Jar into a mech (Easy).
- **Launch**: ride the lift up (Easy).
- **Straw Giant**: down the straw giant (Medium).
- **In Step**: hold sync at 0.9 for 30 real s (Hard: the feat way to the reverse joint legs).
- **Five Minutes**: win off the cable (Hard).
- **Every Leg**: down a giant on each leg type (Elite).
- **Unit Zero**: survive a berserk (Elite, hidden).

Domain experience: sealing and sync time feed **Possession** (a body driven is possession's own question); assembling a frame feeds
**Manifestation**; a neutralised barrier feeds **Alteration** (DOMAINS.md's sources table; `domains.js` SOURCES).

## 8. Who builds what

1. **Dovina** (this round): this plan; the rules (`src/progress/mechs/`: the parts, the assembly and its checks, sync, energy, the
   barrier, stagger, the giants' numbers), `FORMS.mech` and `FORMS.giant`, the touch arc's `mech` context, the simulator
   (`scripts/mechs.mjs`), the glossary, the ledger and achievements; **the hangar room and a pilotable placeholder** (`src/world/hangar/`:
   boxes and cylinders, every rule live) so play can be judged before it is dressed.
2. **Calissa**: the mech's look by part (the clay frame first: a haniwa warrior at 14 m, glazed armour plates, the cradle in its chest
   with a screw thread and gold collar; then a look per leg type), the straw giant, the hangar and the proving ground's dress, the battery
   and sync readout (an Eva-style plug-suit HUD in the Clay dress), the barrier's hexes and its neutralising.
3. **Wanda**: the stride's footfalls by leg type (the camera shake is Petra's), the generator's whine with the battery, the screw's
   thread, the launch's lift and the giant's voice; the hangar's cue (a brass march, Eva's "Decisive Battle" by way of a clay band).
4. **Espada**: the lore names when called final; the log lines (`mech.*`), the parts' one-line effects.
5. **Petra**: the gate; the jelly mount's rider swapped to the Jar in a saddle (section 0); the camera's scale (the mech's camera pulled
   out by its height) and the shake; the area's registration.

Order: the hangar and the straw giant first (v1, this round). The world (5.4) once South has played v1.

## 9. v2: everything breaks (South, 2026-11-02)

> "make the giant robot module include a strong showcase of environmental destruction elements and technique capabilities, think
> incredible hulk's ultimate destruction for Ps2, or even the voxel carving mechanic we've already shown for fossils. Also do you know
> the game Toribash? ... dismembered mechanical joints like rock em sock em robots would be sick, also, how about we spice things up
> with some of the mechanics from Punch-Out!! Since ostensibly you're testing against another giant robot opponent."

One idea runs under all four: **at a mech's scale, everything breaks, and whatever breaks off is a weapon.** A building chipped by your
fists drops a chunk you throw at the giant. A rival's arm torn off at the elbow becomes the club you hit the giant with. Rules are in
`src/progress/mechs/`. The runtime is in `src/world/hangar/`. Every number below was measured (scratchpad `ring.mjs`, the node probes in
the commit).

### 9.1 The toy city (`destruction.js`; Teardown's voxels, Red Faction's collapse, Ultimate Destruction's integrity)
- **Buildings as voxels.** Fifteen buildings of 1 m cells stand in the proving ground: houses, shop rows, blocks, glass towers on steel,
  and bottle kilns.
- **Materials.** Each cell is glass, timber, brick, stone or steel. Each has the hits it takes to break (in full blows), a density, and
  a span.
- **Carving.** A blow carves a shape out of the building, as the slab's verbs do at the bench: a fist a ball, the assault boost a
  capsule along its path, the clap a cone, the beam a ray.
- **Collapse.** Every carve then runs `collapse()`. A cell stands on what is under it. It may reach sideways over air only as far as
  its material's span (brick 2 cells, steel 6).
- **The foot.** Once a building's foot (its lowest 3 or more cells) has lost 3 in 10 of its cells, everything above it comes down at
  once (Ultimate Destruction's integrity).
- **Chunks.** What comes away falls as chunks. Each has a mass and lands as an Impact blow (`fallBlow`: m g h over 900 kJ, capped at
  3). Chunks can be picked up.
- **Measured** (clay fist 0.6 on one wall's foot):
  - a house falls in 16 or 17 blows, a shop row 20 to 22, a kiln 36 to 39, a block 43 to 93 (by where along its wall they land:
    `node scripts/mechs.mjs`);
  - a glass tower stands on steel: fists cannot fell it, so it takes the Ground Pound or the beam;
  - one charge cuts a tunnel through anything;
  - a collapse costs under 6 ms on the tower.
- **Counts:** cells broken (`mech.destroy.cells`), chunks, buildings felled, and felled in one blow (topple).
- **Resets** every visit. No cubes: the toy city is a toy.

### 9.2 Techniques and props (`techniques.js`; Ultimate Destruction's moves and weaponizing)
- **The ten techniques.** Each is paid from the battery, carves where it lands, and strikes what is in reach.
  - Grab and Throw are known from the start.
  - Thunderclap (LMB+RMB): a cone that staggers and breaks glass.
  - Ground Pound (C on the ground).
  - Elbow Drop (C in the air, harder for each metre fallen).
  - Super Jump (Space held, ×2.5).
  - Battering Ram (the assault boost carving its path through a building).
  - Uppercut (W+LMB).
  - Wrecking Spin (LMB held with a club).
  - Javelin (a post or girder thrown point first, piercing 3).
  - Slab Shield (V holding a slab).
- **Opening them.** Each Art past grab and throw has a count way and a feat way in the ledger (`techniqueOpen`). The DEBUG save's lend
  opens them all.
- **Props**, each with a mass, a club's k, reach and hits, and a throw's k from its energy (½mv² over 900 kJ, capped):
  - a lamp post pulled from the street;
  - a girder from a broken building;
  - a chunk (a slab of 8 t or more is also a shield);
  - a torn-off limb;
  - a water tower.
- **Weight.** A prop held adds its mass to the frame's load, so a girder slows a light frame. The plain moveset is unchanged: a prop is
  a modifier in your hand.

### 9.3 Joints (`joints.js`; Toribash, Rock 'Em Sock 'Em)
- **Nine joints.** Every frame (yours, the rivals', a giant's) has nine: neck, shoulders, elbows, waist, hips and back mount.
- **Strain.** A blow on a region strains its joints, but only by what it carries past a force threshold (k 0.8, Toribash's rule).
  Plain blows never strain; heavies do.
- **Fracture and snap.**
  - A joint fractures at strain 1.4: its limb works at 60%, a leg at 70% of the stride.
  - It snaps at 2.6, or with one blow of 0.9 more once fractured: the limb comes off.
  - The limb is a prop anyone can swing. A rival with an arm gone loses that arm's moves.
- **Guarding costs the arms.** A blocked blow strains the blocker's arms with no threshold.
- **The head.** The neck snapped is Rock 'Em Sock 'Em's KO in the ring. Outside it, the frame loses its lock-on.
- Joints mend at the gantry with the cracks.

### 9.4 The ring (`ring.js`; Punch-Out!!)
- **The ring** is in the proving ground. A rival frame boxes you there: the camera behind you, no walking.
- **Controls.** A/D tapped dodges left or right. S tapped ducks; S held blocks. LMB and RMB punch to the body, or to the head with W
  held. Space throws the star punch. Mash to get up.
- **The rivals' tells.** Each rival is a pattern of moves, each shown first by a tell: a shoulder twitch, an arm cocked, a crouch,
  three hops, a blink.
- **Counters and stars.** A move answered right leaves the rival open, and punches then land ×1.5. Starred moves and taunts give a
  star (up to 3). The star punch spends them all for ×2.2, ×3.4 or ×4.8.
- **Hearts.** 20 at a round's start. A blocked punch costs 1 and a hit costs 3. At none you are winded until a clean dodge.
- **Stamina** is the bout's shield: down at zero.
  - The count runs to 10. You rise by mashing; a rival rises at its own count.
  - Three downs in a round is a TKO.
  - A snapped neck ends the bout ("head"), and so do both arms off ("arms").
  - Three rounds of 3 real minutes, then a decision.
- **The circuit**, each rival open once the one before it is beaten:
  - **the sparring frame** (Glass Joe's place: guards its body, taunts);
  - **the heavy frame** (Bald Bull's: covers up between blows; its charge is put down by one body blow in its last 0.35 s);
  - **the champion frame** (Tyson's: 90 real s of dynamite uppercuts that take your head in a few, its blink the tell, a feint).
- **Measured** (12 bouts each, four stand-ins: an expert who reads at 0.15 s and 95%, a decent one at 0.3 s and 75%, a novice at
  0.45 s and 50%, a masher who never answers):

  | rival | expert | decent | novice | masher |
  | --- | --- | --- | --- | --- |
  | sparring | 12 of 12, 30 s | 12, 29 s | 12, 30 s | 12, 24 s |
  | heavy | 12, 64 s | 12, 89 s | 10, 113 s | 0 |
  | champion | 12, 106 s | 8, 97 s | 0 (loses its head in 38 s) | 0 (19 s) |

- **Tuning steps.**
  - Joints first strained on every blow: necks snapped in 3 s, so the threshold came in.
  - At neck tough 2, the champion fell in 26 s to cheap star punches, so the neck went to 3 and star punches were guarded outside an
    opening.
  - Arms torn off by blocked punches decided every champion bout, so the block strain went from 0.5 to 0.2.

### 9.5 Events, the ledger, achievements
- **Events (the runtime's):**
  - `city.break { building, cells, chunks }`, `city.felled { building, label, topple }`, `city.land { mass, height, k, on }`;
  - `mech.technique { id, through?, fell?, height? }`, `mech.roof`, `mech.jump`;
  - `mech.hit { ..., arm, crit }`;
  - `mech.grab { prop }`, `mech.prop.hit { prop, n, own? }`, `mech.prop.throw { prop, hit, javelin?, own? }`,
    `mech.prop.break { prop, shield? }`;
  - `mech.joint { who: 'mech' | 'giant' | 'rival', joint, to, label }`;
  - the boxing ring's `bout.*` (ring.js) with `rival` and `label`, plus `bout.enter`;
  - `giant.down { weapon: 'rubble' }` when a chunk fells it.
- Every event carries `by`.
- **Ledger:** `tracking/mechs.js` (its header lists the keys).
- **Achievements:** mk8 First Bout, mk9 Charge Breaker, mk10 Knock Its Block Off, mk11 Champion, mk12 Perfect Bout, mk13 Wrecking Crew,
  mk14 Bring It Down, mk15 Under the Rubble, mk16 Spare Parts, mk17 Every Technique.

### 9.6 Who builds what (v2)
- **Dovina:** the rules (`destruction.js`, `techniques.js`, `joints.js`, `ring.js`), tracking, achievements, this section, and the
  runtime by builders in `src/world/hangar/`:
  - `city.js`: the voxel buildings meshed by material, chunks and debris;
  - `props.js` and `techniques` in the pilot: grab, throw, the ten;
  - `ring.js` and `rival.js`: the ring, the rival's placeholder body, and Punch-Out's camera and keys;
  - joints laid on the mech, the giant and the rival, with limbs coming off as props.
- **Calissa:**
  - the materials' cells (brick, glass and steel as the clay city's);
  - the chunks' and the debris' look (the voxel batch);
  - the rivals' bodies (three frames with their tells drawn on their bodies);
  - the joints' sparks and a limb's tearing;
  - the head's spring;
  - the ring's dress (ropes, posts, the corner).
- **Wanda:** brick, glass and steel breaking; a building coming down; the bell between rounds; the count; the crowd; each rival's tell
  as a sound (Punch-Out's cues: every tell has one); a joint snapping.
- **Espada:** the techniques', props' and rivals' words, and the log lines.
- **Petra:** the gate; the camera's shake on a collapse; whether a building's chunk may enter the ammo.js physics later (for now a chunk
  is flown by its own ballistics).
