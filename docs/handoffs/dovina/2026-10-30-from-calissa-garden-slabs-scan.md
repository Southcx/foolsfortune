# From Calissa: South's Spirit Garden asks, and my proposals for your rules (2026-10-30)

South asked this round, in their words:
- "the Spirit Garden doesn't have Myggdrasil active by default"
- "evaluate the module as far as how you could acquire more planetoids/their variance in size. Prior art was Super Mario Galaxy, but how
  can we take their systems and make them much more our own? Think hard about it and coordinate with your sisters to execute."
- "I don't think Dovina ever specc'd out the voxel destruction fossil carving section from Spectrobe Origins for us to use as part of
  our spirit summoning mechanic from captured plates."
- "it would be SO SO SO cool if we could use the phone camera and bar codes/QR codes as a vehicle for disseminating items/Figments like a
  modern version of Skannerz or Monster Rancher with their CDs."

The looks are mine and are being built now: Myggdrasil as alien fungus and coral, the launch lotuses, the facilities' silhouettes, and
the duel's spectacle. Everything below is a proposal for your rules and Petra's runtime. Every name is a plain placeholder for Espada.

## 1. Myggdrasil from the start
Today it is given at the second Firing (`ECON.myggdrasil.firing: 2`). South wants it there by default. The ask is `firing: 0` (given on
the first entry), with the planetoid (`gardenMycelium.give`) at the first build, Petra's side.

## 2. Planetoids: grown, not bought
Galaxy's systems, and what each becomes here:

| Galaxy | here |
| --- | --- |
| the Comet Observatory's domes, opened by Grand Stars | the ten slots of the ring stay; what fills them is earned in the world, never shopped |
| a Hungry Luma fed Star Bits turns into a planet | a **seed** is fed until it is a planetoid: its size is what it was fed |
| planets of every size and gravity (a ball you circle in two hops, a donut, a cube) | sizes as a real choice; shapes from the seed's kind |
| launch stars | launch lotuses (mine) |

- **A seed is earned by an act, never bought** (your laws: skill skips grind, grind closes the gap). The seed is the act's keepsake.
  Each would be a row in your table:
  - the first stand on an Island of Ego (Anagami gives a clay seed);
  - a FOE beaten (the Great Slip Jelly's core);
  - a spirit's wish answered (the Hungry Luma itself: it dreams a moon);
  - an awakening (each feeling's own moonlet, seven in all, tiny, set close round the Dantian);
  - a slab carved flawless (section 3);
  - a square of the open sea completed.
- **Fed, it grows** (the sink stays yours). The god hand carries the seed up into the ring, as now. Every Pour of the island's matter, or
  cube, or material onto it accretes it a step, the way planets form. It goes from moonlet (4 to 6 m: hopped round in seconds, Galaxy's
  tiny worlds) to small (8 to 10 m), medium (12 to 16 m) and large (20 m and up). The player chooses where it stops, so size variance is
  a choice made with the hand rather than a price list. What it was fed tints it: mostly Grief water gives a rain-moss moon, mostly
  crude an oil-sheen one.
- **The seed's kind gives the shape:**
  - a clay seed is round;
  - a crystal seed is faceted and can be split open like a geode, so you stand inside it;
  - a coral seed grows branching reef arms;
  - a ring seed is a torus, walked inside and out (Galaxy's donut);
  - a bowl seed is a hemisphere you live inside.

  Spheres first. Every other shape is Petra's to price, since `PlanetBody` is hers.
- **Moons of planetoids:** a large one keeps a moonlet in close orbit, so size reads at a glance and there is a hop for the joy of it.
- **What makes it ours:** the garden is the world inside your Pneuka Jar, so its cosmos is built out of what you lived and shaped with
  your own hand (the god hand's matter verbs already exist: Pour, Sculpt). Galaxy hands you planets; here they are made by you.

## 3. Carving a slab: Spectrobes' excavation, and Fossil Fighters' cleaning
A captured plate (a Veritome photograph of a creature) condenses into a **slab**: a block of the island's own layered stone with the
creature set inside it in Lachrymite. Carving the slab free summons the spirit. Today a plate is awakened at the Athanor's shrine in one
step, and the Dunes' fossils are woken by the Crucibelle. The carving would sit between the catch and the birth.

Prior art:
- Spectrobes (DS) and Spectrobes Origins: excavation with the drill and the blower, and in Origins with the Wii Remote;
- Fossil Fighters (DS): cleaning a rock with a hammer and a drill, an X-ray, and a damage meter where how cleanly it was cleaned decides
  the creature's strength;
- Pokemon Diamond's Underground: the wall that gives way.

Every tool is a carving verb, so the slab teaches the kit (the law: the mechanic is the lesson):

| tool | verb on the slab |
| --- | --- |
| the Dreamvane's pick | chips a chunk: fast, and it can crack the fossil |
| the Soul Brush | brushes off loose layers: slow, safe |
| the Crucibelle's toll | sonar: the fossil's outline glows through the stone for a beat, and each ring costs |
| the psygun | blasts the crust away: quick, wide, risky near the bone |
| the Sondelass's cutlass | slices one layer off flat |
| the Lockheart | hoovers the rubble, which counts toward a clean dig |
| the Veritome | holds the plate against the slab: the creature's silhouette is drawn faintly to aim by |

- **The score:** the share of the fossil bared against the share cracked, as Fossil Fighters' damage meter. It decides what the spirit
  comes out with (a starting bond, a stat's share, the rare look on a perfect dig: your numbers).
- **The runtime:** the slab is a voxel volume (Petra's `godhand/voxels.js` already meshes voxel matter smooth) of strata with the
  fossil's cells inside.
- **The look and the slabs themselves are mine:** I've drawn concept slabs for South this round, and they are the brief.

## 4. Scanning codes: Skannerz and Monster Rancher's CDs
- **Any real barcode or QR code becomes a slab.** The code is hashed. The hash's bits pick the slab's creature from what is open, its
  feeling, its tier and its grain, so the same code gives everyone the same slab (shareable, Monster Rancher's discs).
- **On a phone, the camera reads it** (`getUserMedia`, then the browser's `BarcodeDetector` where it exists; a small decoder where it does
  not, since iOS has none). **On the desk:** type the digits printed under any barcode (`/scan 0123456789012`), or drop in a photo.
  Camera frames never leave the device.
- **The game makes codes too:** a spirit, a card or a made track (whose share code `FF2-...` already exists) shown as a QR another player
  scans, drawn in the Comb's dress (the Comb is our in-world barcode script). A slab's face carries its seed's Comb.
- **Your rules to set:** a scan a game day, or so many; a code scanned twice gives cubes the second time; what is open to the hash (only
  kinds you have met?). Petra's: the camera and the decoder, and whether the decoder is a dependency she will take.

## Who does what (proposed)
- **Dovina:** Myggdrasil's `firing`; seeds and their table, growth, sizes and shapes; the carving's score and what it gives; the
  scanning's rules.
- **Petra:** the planetoid's growth in the ring and any shape beyond the sphere; the carving bench's voxels and tools; the camera and
  the decoder.
- **Espada:** the names (seed, moonlet, slab, carving, scan are all placeholders).
- **Calissa:** every look: the seeds and the planetoid's accretion, the slabs and their breaking, the carving bench, the scan's moment,
  the codes in the Comb's dress.

Delete this note in your branch when done.
