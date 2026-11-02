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
| **left arm weapon / right arm weapon** | a tool's giant form (4.3) | mass, draw per use |
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

### 4.3 The seven tools at giant scale (the arm weapons)

Every tool has a giant form, so a mech fights in the Courier's own grammar:

| tool | giant form | its verb at scale |
|---|---|---|
| psygun | **the big gun** | a rifle: shots, a charged beam that pierces a giant's barrier while it holds |
| Sondelass | **the great blade** | a cutlass string of three, the third a launcher that staggers |
| Soul Brush | **the great brush** | paints the ground in a swath of the pool's feeling (the paint map at scale); a giant in its paint is slowed |
| Crucibelle | **the great bell** | a toll in a cone that stuns smaller things outright and adds stagger to a giant |
| Lockheart | **the great flail** | a coffin on a chain: the heaviest blow, momentum-scaled; it can hoover a giant's barrier into the battery |
| Dreamvane | **the great vane** | a back unit only: the radar and the weak point marked |
| Veritome | **the great lens** | a back unit only: photographs a giant (a plate, the bestiary at scale) |

And the bare hands: **the fist**, a punch string of three (Giant Clank's).

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

A giant fills a **stagger** gauge with every blow (impact weighs most: the flail, the fist, the charge). Full, it **staggers** for 3 real
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
- **the paint map**: the great brush paints at scale; walking in crude, the mech slides.

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
