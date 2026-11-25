# Brief 04: the Spirit Garden (the Inner Realm)

The pocket world inside your Pneuka Jar, entered at a Shrine. A small galaxy far over the world (its own zone). **You are the Pneuka Jar**,
hopping round small planetoids under Super Mario Galaxy's gravity, **and you are the god hand** over it at once (no ~ needed): the cursor is
the hand. Calm, cozy, a place you shape like clay. Dark Cloud 2's Georama, Viva Piñata, the Chao Garden, From Dust's water, Animal Crossing.

Source (`src/world/garden/`, 4,700 lines): `realm.js` (612: enter, leave, the Jar's control, F at places, the shed's pages, naming),
`place.js` (the six planetoids, lotuses, the gate, the shed), `planetbody.js` (the spherical-gravity body: the Jar and every spirit),
`hand.js` (the hand's ten arts), `clay.js` (each planetoid's height grid), `water.js` + `waterworks.js` + `cascades.js` (shallow water on
the sphere, springs, drains, falls between planetoids), `plants.js` (green that spreads), `plots.js` (features placed, Wu Xing formation,
spirit veins), `decorgrid.js` + `decorlayer.js` (decor on a cube-sphere grid), `orbit.js` (planetoids grown from seeds), `raising.js`
(spirits: pet, flick, feed, drill, out, release), `awaken.js` (new spirits: slabs, fossils, visitors, merging), `bench.js` (carving a spirit
slab), `press.js` + `pressbath.js` (Soul Alchemy's press at the Athanor), `hearth.js` + `kitchen*.js` (Spirit Cooking), `tribulation.js`
(the Heavenly Kiln), `races.js`, `mycelium.js` (Myggdrasil's planetoid, spore beds), `spiritwalk.js`, `thornpatches.js`, `gardencam.js`,
`tapgo.js` (touch), `howto.js`.
Rules (pure, all in `PORT/data/progress/`): `realm.js` (planetoids, plots, FEATURES, Wu Xing, drills, visitors, tribulation, ORBIT),
`garden.js` (dividend slots, beds, upgrades), `harmony.js`, `seeds.js`, `decor.js` (47 pieces), `spirits.js`, `spiritlife.js`,
`seasons.js`, `gardenweather.js`, `mycelium.js`, `alchemy.js`, `cooking/*`, `slabs.js`, `gardenhowto.js`.
Looks: `src/vfx/garden/*` (planetoids, water, plants, decor pieces, Myggdrasil, lotuses, the mood table `gardenmood.js`).
Plans: `docs/plans/SPIRIT-GARDEN.md`, `GARDEN-COZY.md`, `SEEDS-SLABS-SCANS.md`, `SOUL-ALCHEMY.md`, `MYCELIUM.md`, `SPIRIT-COOKING.md`.

## 1. The place (`place.js`)

Six planetoids (radius, centre; the Dantian at the origin of the garden's frame):

| id | r (m) | at | what stands there |
| --- | --- | --- | --- |
| `dantian` | 20 | 0, 0, 0 | the gate (back to the Shrine), the Pneuka Box's shed, the lake (lake lotuses show the garden's rating), 7 berths for the feelings' moonlets round its waist |
| `terraces` | 12 | −50, 12, −22 | the herb beds |
| `athanor` | 10 | −34, −8, 44 | the spirit press (Soul Alchemy) on its crown, the hearth (cooking), the plate shrine and the carving bench |
| `pavilions` | 14 | 46, 8, 36 | the dividend slots (mastered encounters pay while you are away) |
| `mulberryGrove` | 16 | 48, −6, −38 | the cocoon tree (merging spirits), where bound spirits live |
| `chimney` | 8 | 0, 40, −66 | the needle: the Heavenly Kiln (the tribulation) |

Plus **Myggdrasil's planetoid** (26 m, given on first entry, a 48 m reef-and-fungus tree on it) and up to ten grown from **seeds** in **the
ring** round the Dantian (`orbit.js`). **Launch lotuses** on each planetoid face each neighbour and fly the Jar there on an authored arc
(about 2 s). Each planetoid is a hop round in 5 to 15 real s.

## 2. The Pneuka Jar's body (`planetbody.js`: port it as is)

- **Gravity toward the heart of the nearest planetoid**, where "nearest" means nearest *surface* (the sculpted ground, `radiusAt(dir)`),
  so a body thrown between two is caught by the one it comes closer to. `GRAVITY` 20 m/s² (twice the world's: Galaxy's floatiness is in
  the hop, not the fall).
- `up` is the planet's normal at the body; the body stands on the sculpted surface.
- **The hop** (a Chao's waddle): each step a hop; the longer a direction is held, the longer each hop: from `short` [up 3.0, along 2.6]
  to `long` [4.4, 4.6] m/s over `growth` 0.7 s held; a new hop every 0.06 s on landing. Space: a high jump 8.5. Air steering 7,
  friction 10; in the air a drag of 0.06/s per m/s over 8 (a throw is slowed, a hop never).
- **Wading**: felt past 0.05 m of the garden's water, afloat past 1.2 × its radius (0.45), drag 3, riding 0.35 of its radius up.
- `held` (in the hand), `release(vel)` (a throw), `launch(to, seconds, toPlanet)` (a lotus's flight).
- Interface: `new PlanetBody({ planets: [{ c, r, radiusAt }], pos, radius, hop })`, `step(dt, { move: Vector3 (world, length 0..1), jump })`.
- It is **not** the Courier's controller (the core movement takes world +Y as up and is never touched). In Godot: a plain script on a
  `CharacterBody3D` with `UpDirection` set each step, or simpler, a kinematic body moved by this code with a sphere cast for the ground.
- Every spirit is a PlanetBody too, driven by a wander or its routine (`spiritwalk.js`).

## 3. The views (`gardencam.js`)

`behind` (over and behind the Jar, up the planetoid's: Galaxy's camera, the heading carried over the curve; Q/E turn, wheel zooms),
`first` (from the Jar's mouth, Z), `overhead` (\` in the garden: straight down; WASD pans over the surface and on to the next planetoid,
the Jar stays put), `press` (Soul Alchemy's: 44° lens, 12.6 m out, pitched 68° down, north locked).

## 4. The hand's ten arts (`hand.js`; keys 1..9, 0)

`grab` (pick up the Jar or a spirit and throw it, ≤ 26 m/s; a tap under 0.22 s **pets** a spirit, RMB **flicks** it), `pull` and `press`
(raise and lower clay), `smooth`, `flatten` (to the height where the stroke began: terraces), `carve` (a narrow groove water runs in),
`roughen`, `water` (LMB pour 2 m³/s of your draught's feeling, RMB drink 4; Shift+LMB a spring 0.4 m³/s for good; Ctrl+LMB a drain 0.8),
`place` (a feature in a plot), `paint` (a ground material: moss, ash, loam, slate, silt). R turns the choice (paint's ground, water's
feeling). A stroke is a soft brush 1..12 m wide (default 3), ticking every 0.05 s, rates `pull/press/carve 0.12` m a tick, `smooth/
flatten 0.5` eased, `roughen 0.25`. The last ten strokes undo (Ctrl+Z). Grab also lifts a placed feature into another free plot (free).
Holding grab over a seed's planetoid pours the island's matter carried from the world onto it (feeding it).

## 5. The ground and the water

- **Clay** (`clay.js`): each planetoid keeps a 128 × 64 grid of heights over latitude and longitude (about a metre a cell at the
  Dantian's equator), read bilinearly in any direction, held within a third of the radius (a hill or a hollow, never through the heart),
  held still round what stands on it. Each cell also keeps its ground material. `radiusAt(dir)` is what the bodies stand on.
- **Water** (`water.js`): shallow water by virtual pipes on that same grid (as the god hand's matter, brief 03, but on a sphere): depth a
  cell, fluxes to four neighbours sped by height difference (`g` 20, damp 0.985), limited by the cell's water; runs downhill, pools,
  spills, sloshes. **Hydraulic erosion** (erode 0.02, deposit 0.06, capacity 0.05: rivers cut, deltas build) and **thermal** slump
  (talus 1.1) on the sculpted heights only. Each cell's water carries the mix of the seven feelings. Sources: springs, the hand's pour;
  sinks: drains, the hand, slow drying. 60 steps a real second where there is water; a dry planetoid sleeps.
- **Cascades** (`cascades.js`): water deep in a basin on the side facing a linked planetoid spills over and falls to it on the other's
  gravity (so a lake on the Dantian's rim waters the Terraces).
- **Plants** (`plants.js`): a cellular rule on the clay grid. A cell grows 0 bare .. 3 full; every game hour a growing cell on fertile
  ground (moss, loam, silt) that is wet grows a stage, and a full one seeds its wet fertile neighbours. Dry holds; ash, slate or none
  wilt a stage a game hour. Thorn patches block spreading.

## 6. Features, plots and the formation (`plots.js`, data `realm.json` `FEATURES`, `PLANETOID_PLOTS`, `PHASE`, `GENERATES`, `OVERCOMES`)

Plots spread evenly over each planetoid (a golden spiral). A **feature** (nine kinds: terrace, pavilion, spiritHouse, pond, lantern, incense, stone,
drillYard, sporebed; each `{ size, job, does, firing }`) is placed with a feeling, for cubes and one material of that feeling's kind (`costOf`). **Wu Xing on
five feelings**: neighbours that GENERATE it strengthen it, those that OVERCOME it weaken it; the ground under it and the water reaching
it count as one neighbour each; a **spirit vein** (a dragon vein: between linked planetoids, ending at the highest ground within 35° of the
way to the other) under the plot doubles the lot. The pull between neighbours is shown as a bright thread or a dark crack, never text.
Event `garden.place { mult }`.

**Decor** (`decorgrid.js`, `decor.js`): 47 pieces for looks only, placed on a cube-sphere grid (each face N × N cells of about a metre,
equal-angle mapping, half-cell points, 15° turns). The garden's **rating** (variety, region by region, never shown as a number) opens up to
five lotuses on the Dantian's lake.

## 7. Spirits (`raising.js`, `awaken.js`, `spiritwalk.js`; rules `progress/spirits.js`, `spiritlife.js`)

- Figments you catch in the world (the Dreamvane's net, the Lockheart) are **bound** (`creatures/bound.js`) and hop about the Grove.
- Each has a sheet: five stats, a feeling, bond, alignment (Law ↔ Chaos). **Pet** (toward Law, a little bond), **flick** (toward Chaos).
  F at it opens its page: **feed** from the Pneuka Box (a Well's material raises its stat, a curio its bond, a cask leans its feeling),
  **drill** at a drill yard (one stat up, fatigue up; rest takes it away), take it **out** (one walks the world as an ally), **release**.
  At thresholds it **matures** into a form. A matured spirit at full bond may ask once to go home (the farewell; it leaves a statue).
- New spirits: a Veritome photograph condensed into a **spirit slab** at the plate shrine and carved free on the **bench** with the seven
  tools' verbs (Fossil Fighters'), a Lachrymite fossil woken by the Awakening Song (Spectrobes), wild Figments **visiting** when the
  garden meets their wants and **settling** after enough visits (Viva Piñata), two **merged** in the cocoon tree (Jade Cocoon).
- **Routines** (`routineOf`): where a spirit likes to be by the day's phase and the rain; **wishes** (one thing a trusting spirit asks for).
- **Races** (`races.js`): a groove carved in one closed stroke is a track; spirits race it by their feelings (flat by Mirth, climbs by
  Desire, water by Dread ...).

## 8. The garden's state

- **Harmony** (`harmony.js`): each planetoid 0 (briar) .. 1 (calm), resting at 0.5. What you carry in from the world and spirits left
  waiting push it toward briar; quiet tending settles it. Below 0.35 **thorns** grow where the cause is (the arrival lotus, the Grove);
  the hand prunes them (a briar cutting). Over 0.75 the planetoid **blooms**. Nothing is lost.
- **Seasons** (`seasons.js`): spring, summer, autumn, winter, 7 game days each; growth by season.
- **The garden's weather** (`gardenweather.js`): Gall rain sours water (plants wilt until washed), Fury rain halves strokes and scorches moss.
- **Seeds** (`seeds.js`, `orbit.js`): a seed is earned once by an act; carried by the hand into the open sky and let go, it takes the
  nearest free slot of the ring (10 slots, 95 m round the Dantian) as a moonlet; **fed** (cubes, a material, the island's matter poured on), it grows a size at a
  time (moonlet r 5, small 9, medium 14, large 20 with a moon of its own), its shape by its kind (clay, crystal, coral, bowl, ring, bone), its tint by what it was fed most. The seven
  feelings' moonlets (one at each awakening) hang on the inner ring and are never fed.
- **Dividends and beds** (`garden.js`): a mastered encounter (all its achievements done) set in a pavilion slot pays a share of what
  farming it pays an hour, in real time, to a cap of game days. Beds grow materials over game hours (a herb run).
- **Soul Alchemy** at the press (`press.js`, rules `alchemy.js`): materials walk your soul colour across a colour wheel (the bath: hue
  the bearing, saturation the distance out); **firing** inside an attribute's target raises that attribute a rank (seven attributes).
- **The Heavenly Kiln** (`tribulation.js`): lightning on the Jar at the Chimney, each strike outlined where it will land before it does;
  hop out of the ring or flick the bolt back. All struck through: a Firing crossed (opens places and verbs, never numbers).
- **Spirit Cooking** (`hearth.js`, `progress/cooking/*`): dishes as real techniques (knead, proof, bake ...), each a timed move; serves a
  draught of a feeling. Calissa's 3D stage with a soft-body dough: `vfx/cooking/*`.
- Saved as sections `garden`, `spiritLife`, `sporebeds`, `treeDiary`, `decor`, the realm's own (the clay and water grids as runs).

## 9. Port notes

- One scene a planetoid (a mesh rebuilt from the clay grid where a stroke touched; a `ConcavePolygonShape3D` or a sphere plus height test).
  The water and plants as a vertex-coloured overlay mesh or a shader reading a 128×64 texture.
- The hand is the god hand's hand (brief 03), the same model and clips; the Jar the same Jar. In the garden the hand has these ten arts,
  not the world's god powers.
- The look's mood (`vfx/garden/gardenmood.js`): one table every garden look reads: the game hour's light, the season's palette, the
  briar's grade, eased together. Port that table first; everything reads it.
- Events: group `garden` in EVENTS.md (`garden.enter { shrine }`, `garden.leave`, `garden.launch { from, to }`, `garden.place`,
  `garden.cascade`, `garden.howto`, ...), and `seed.*`, `slab.*`, `spirit.*`, `cook.*`, `realm.name`.
- Check: enter at a Shrine; hop round the Dantian in about 10 s; carve a groove downhill from a poured pool and watch it run and cut;
  launch by lotus to the Terraces; throw the Jar between two planetoids and see the nearer catch it.
