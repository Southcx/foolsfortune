# Seeds, slabs and scans: the Spirit Garden's growth

South, 2026-10-30, by Calissa:
- "the Spirit Garden doesn't have Myggdrasil active by default"
- "evaluate the module as far as how you could acquire more planetoids/their variance in size. Prior art was Super Mario Galaxy, but
  how can we take their systems and make them much more our own?"
- "the voxel destruction fossil carving section from Spectrobe Origins ... as part of our spirit summoning mechanic from captured
  plates"
- "use the phone camera and bar codes/QR codes as a vehicle for disseminating items/Figments like a modern version of Skannerz or
  Monster Rancher with their CDs"

Calissa's proposal (`docs/handoffs/dovina/2026-10-30-from-calissa-garden-slabs-scan.md` on her branch) is taken almost whole. What
follows are my rulings and numbers.

| part | where |
|---|---|
| rules | `src/progress/seeds.js`, `src/progress/slabs.js`, `src/progress/scans.js` |
| ledger | `src/feedback/tracking/gardengrowth.js` |
| check | `node scripts/gardengrowth.mjs` |
| world side (Petra's) | the ring's seeds, the carving bench, the scanner |
| looks (Calissa's) | every look |
| words (Espada's) | every word: all names below are placeholders |

## 0. Myggdrasil from the start

`ECON.myggdrasil.firing` goes from 2 to 0. Its planetoid and tree are given on the first visit to the Spirit Garden.

Why: the tree is the garden's landmark and its transmutation. Hiding it behind the second Firing hid the garden's best thing for hours.

## 1. Seeds: planetoids grown, never bought

**What Galaxy did, and what we keep:**
- The Comet Observatory opened domes with Grand Stars. Here the ring's ten slots stay, and what fills them is earned by an act.
- A Hungry Luma fed Star Bits became a planet. Here a seed fed is a planetoid, and how much it was fed is its size.
- Galaxy's planets came in every size and shape. Here sizes are a choice, and shapes come from the seed's kind.

**What makes it ours:** the garden is the world inside your Pneuka Jar. Its cosmos is built from what you lived (the acts) and shaped
by your own hand (the feeding). Galaxy hands you planets; here you grow them.

### 1.1 The seeds, and the act that earns each (`SEEDS`, once each)

| seed | shape | earned by |
|---|---|---|
| clay | round | the first entry to the garden (Anagami's) |
| crystal | faceted; past medium it splits open like a geode | a FOE beaten in a Well (`well.foe`) |
| coral | reef arms | the first square of the open sea completed |
| bowl | a hemisphere lived in from inside | the fifth spirit's wish answered (Galaxy's Luma: a spirit dreams a home) |
| ring | a torus, walked inside and out | five mimicry puzzles copied for three stars (the System's own) |
| bone | round, full of fossils to dig | the first slab carved flawless (section 2) |
| seven moonlets | tiny, in their feeling's colour | each feeling's awakening (`feeling.known.<f>`) |

- Each act is a different part of the game. The garden's sky ends up as a record of where you have been.
- The moonlets stand on an inner ring close round the Dantian. They are never fed. Each is a keepsake you can hop onto.
- A seed is a predicate over the ledger (`seedsEarned`). Tracking writes `seed.earn.<id>` once, and the ring's runtime gives the seeds so
  written that it has not yet placed.

### 1.2 Feeding and sizes (`SIZES`, `feedOf`, `MATTER_FEED`)

Growth is measured in minutes of play fed. The steps are 60, 120 and 240 more, the old planetoid price ladder, so the sink is the same
size as before.

| size | radius | plots | fed (minutes) |
|---|---|---|---|
| moonlet | 5 m | 1 | 0 |
| small | 9 m | 4 | 60 |
| medium | 14 m | 6 | 180 |
| large | 20 m | 8 | 420 (and it keeps a moonlet of its own in orbit) |

**What can be fed:**
- **Cubes**: a minute of play's worth is a minute.
- **A material**: its worth in minutes. It tints the planetoid toward its kind's feeling.
- **The island's matter, poured on by the god hand**: 0.25 minutes a cubic metre, so a full scoop is 5 minutes. This is capped at 30
  minutes a game day so free matter never outruns the sink.

**Size is the player's choice.** Stop feeding where you like. A small planetoid is a world you hop round in seconds, as Galaxy's tiny
ones were.

**Tint** (`tintOf`): the feeling fed most, once it is a third of all that was fed. Fed mostly on Grief, you get a rain-moss moon.

### 1.3 What it replaces

The four bought planetoids are replaced: the shed's page, `ECON.place.planetoids` and `ECON.place.planetoidFiring`, and `BOUGHT` in
`world/garden/orbit.js`. Gone (Petra's v352: the ring takes seeds; the ECON rows dropped).

## 2. Slabs: carving a plate free to summon its spirit

A captured plate (a Veritome photograph of a creature) condenses into a **slab**: a block of the island's layered stone with the
creature set in it as a Lachrymite **fossil**. You carve it free at a bench, which takes the place of today's one-step awakening at the
Athanor. How cleanly you carve decides what the spirit comes out with.

**Prior art:**
- Spectrobes and Spectrobes: Origins: excavation, the silhouette and the timer.
- Fossil Fighters: the cleaning meter against the damage meter.
- Pokemon Diamond's Underground: the hammer against the pick.

### 2.1 The kernel (`progress/slabs.js`)

**The slab:**
- 10 by 7 by 5 cells, a cell 5 cm.
- Three strata from the top: loose (1 hit), firm (2) and hard (3). A plate of more stars is a harder slab.

**The fossil:**
- A spine, a head and four limbs, drawn from a seed of its kind, so a kind always lies the same way.
- 12 to 13 cells, each with an integrity of 2 (two cracks break it).

**What can be struck:** only stone open to the air (the top, the sides, or beside a cleared cell). It lifts off its bed, so the stone
under the fossil never counts.

**The time:** the slab sets after 90 real s, plus 30 a star (`secondsOf`). The Lachrymite hardens.

### 2.2 Every tool is a carving verb

The slab teaches the kit without saying so: the mechanic is the lesson.

| verb | tool | does | real s a use |
|---|---|---|---|
| brush | the Soul Brush | clears loose stone; never cracks | 0.35 |
| pick | the Dreamvane's pick | 2 to a cell and 1 behind it; cracks the fossil it reaches | 0.5 |
| blast | the psygun | 1 to a ball 1.8 cells round; cracks any fossil in it | 0.8 |
| slice | the Sondelass | 1 to a whole layer; cracks where the layer crosses the fossil | 1.5 |
| hoover | the Lockheart | clears loose stone in a ball 1.2 round; never cracks | 0.6 |
| toll | the Crucibelle | the fossil's outline rings through the stone for 1.5 real s; three a slab | 1.2 |
| silhouette | the Veritome | the creature's shape drawn faintly on the face, to aim by | 1 |

### 2.3 The score and the spirit (`scoreOf`, `spiritOf`)

**The score:**
- **bared** is the share of the stone over and beside the fossil that has been cleared.
- **cracked** is the share of the fossil's integrity lost.
- **score** is bared minus twice cracked. A careless pick costs more than it saves.
- **flawless** is 97% bared with no crack.

**The spirit:**
- Its class comes from the plate's stars, as before.
- Its starting bond is 30 × score. A flawless dig starts at 30, which is trust, so its first wish comes at once.
- Each stat starts at a share of 100 equal to the score.
- A flawless dig gives the rare look (Calissa's: the shiny's inversion).
- A dig of nothing still summons the spirit: grind closes the gap.

### 2.4 Measured (`scripts/gardengrowth.mjs`)

- **A careful dig** (the silhouette, then the blast far from the fossil, the brush or an aimed pick near it) is flawless:

  | plate | time taken | time allowed |
  |---|---|---|
  | 1 star | 78 real s | 120 |
  | 2 stars | 103 real s | 150 |
  | 3 stars | 120 real s | 180 |

  That is about two thirds of the time, for a bot that knows where the bone is.
- **The blast everywhere** cracks the whole fossil (score 0).
- **The brush alone** bares nothing near it.

## 3. Scans: any code is a slab, the same for everyone

**The hash:** any real barcode or QR code is hashed (`readCode`). The hash picks what it holds (`holdOf`), so the same code gives
everyone the same thing. A cereal box becomes a shared secret, as Monster Rancher's discs were.

**What a code holds:**
- A quarter of codes hold a material: a kind and a tier.
- The rest hold a slab: a creature from the plates' roster, a feeling, a class, and its grain's seed.
- Classes run 50, 25, 13, 8 and 4%, so a class-4 code is a find worth sharing.

**A sealed slab:** a slab of a kind you have never photographed comes sealed. It is kept, but cannot be carved until you meet that kind
in the world. The code points you at the world, never past it.

**Limits:**
- Three new codes a game day (`SCAN.perDay`, Pokemon Sun's scanner), so a supermarket aisle never replaces the world.
- A code read again gives a minute of play in cubes once, then nothing.

**The game's own codes** (a made track's `FF2-`, a spirit's `FFS-`) are read as what they are, never hashed.

**Privacy:** only the hash is kept, never the code, and camera frames never leave the device.

**How a code is read:**
- On a phone, the camera (`BarcodeDetector` where the browser has it, a small decoder where it does not; iOS has none).
- On the desk, the digits typed (`/scan 5012345678900`) or a photo dropped in.

That side is Petra's, and so is the choice of decoder library.

## 4. Who does what

- **Dovina:** the rules above, with their check and the ledger.
- **Petra:**
  - the ring taking seeds (the shed's sale and `BOUGHT` retired), growth by feeding, the inner ring of moonlets, shapes beyond the
    sphere;
  - the carving bench (`godhand/voxels.js` meshes the slab), with plates becoming slabs in the Pneuka Box;
  - the scanner.
- **Calissa:**
  - the seeds and their accretion;
  - the slabs (her concept sheet of six is the brief) and their breaking;
  - the bench, and the scan's moment;
  - our codes drawn in the Comb's dress.
- **Espada:** the names: seed, moonlet, slab, fossil, carving, scan.
- **Wanda:** the carving's sounds by verb and stratum, a crack, the flawless ring, the scan's chirp.

## 5. Events for the world side

- `seed.plant { seed, slot }`, `seed.grow { seed, size }`
- `slab.make { kind, stars, from: 'plate' | 'scan' }`, `slab.carve { kind, score, bared, cracked, flawless }`
- `scan.read { what, kind, cls, sealed, again, own }`

Every event carries `by`.

## 6. Teaching it: the garden's how-to and the first path

South, 2026-10-30, by Petra: "The Spirit garden is a notorious culprit of lacking any form of tutorialization." Measured by Petra: a
first entry showed the realm-naming page and nothing after it.

**The how-to** (`progress/gardenhowto.js` `GARDEN_HOWTO`), in Raku's tables' way (`progress/casino/howto.js`):
- Seven steps, one thing each, in the order of the first visit: you are the Jar; you are the hand (1 to 0); the shed; the ring; a
  lotus; the plate shrine; the bench.
- Each step's `show` names the spot the camera turns to and rings.
- It plays after the realm is named on the first entry, and again on `/howto` in the garden. Finished or skipped once, it plays no more
  on entry: the ledger's `garden.howto`, from the event of that name.
- `card` is the garden on one card, a click away.

**The starter slab** (`GIFT`: a clapperjar, one star). A new save has no appraised photo, so the plate shrine had nothing to teach.
- The first entry gives one slab, so the shrine and the bench are learned on the first visit with nothing to fetch.
- Prior art: Spectrobes: Origins hands you the first fossil; Pokemon hands you the starter.
- A clapperjar because it is the clay folk's lowest tier, Anagami's own. One star because it sets in 120 real s, time enough to learn the
  brush and the pick. A clean dig is flawless, which earns the bone seed.
- Given, never made: `slab.make { from: 'gift', by: 'environment' }` counts nothing. Carving it is the Courier's.

**The first path** (`progress/goals.js` `FIRST`): three Easy steps after the Shrine's rest (sr1), each with its where:

| step | achievement | what it teaches without saying so |
|---|---|---|
| gw1 | Through the Arch: enter your Spirit Garden | the Shrine's arch; the garden is yours |
| gw2 | Seedling: let a planetoid's seed go in the ring | the shed, the hand's GRAB, the sky as a place you build in |
| gw3 | Unearthed: carve a spirit slab free | the plate shrine, the bench, every tool as a verb |

The garden's other achievements (Seeds and Slabs): gw4 Set in Stone (a photo set into a slab), gw5 Read the Code (a scan), gw6 Not a
Scratch (a flawless carving), gw7 Full Grown (a planetoid fed to large), gw8 A Sky of Your Own (all six seeds of the ring let go).
`seed.plant.ring` counts only the ring's seeds, since a moonlet sets itself at an awakening.
