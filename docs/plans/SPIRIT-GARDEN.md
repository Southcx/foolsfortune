# The Spirit Garden as a place: a god game of your inner world, the Inner Realm (the owner, 2026-10-07)

Kept by Dovina. **Built:** the place is `src/world/garden/` (`realm.js` entered, `planetbody.js` the Jar's gravity, `hand.js`, `clay.js`,
`plots.js`, `place.js`, `raising.js`, `awaken.js` plates, fossils and visitors, `kiln.js` the tribulation); the catch is `tools/lockheart/lockheart.js`, `godhand/catch.js`
and `creatures/bound.js`. The numbers: `src/progress/spirits.js` (stats, feeding, forms, merging, the Firings, the struggle),
`src/progress/realm.js` (planetoids and plots, features, the formation, drills, visitors, the tribulation's pace), `ECON.place`
(prices); the dividend, beds and upgrades stay `src/progress/garden.js`. Units: metres, real seconds, game hours, minutes of play.

> "It should be like the Chao Garden from Sonic had a baby with Super Mario Galaxy for the microplanet traversal mechanics and the
> dreaminess of Dual Hearts. Embrace Xianxia fantasy and cultivation as the major inspirations."
>
> "You're making the assumption that the form of the player HAS to be as the Courier within the Spirit Garden. It doesn't... Use the
> Pneuka Jar as the character controller and have it hopping around with WASD, grabbable with the Godhand... the Godhand also lets you
> interact with facilities, captured Figments, terraform the microplanets, and literally let you reshape your inner world like clay.
> The Spirit Garden is the true god game module mixed with monster raising like Monster Rancher, Jade Cocoon, Spectrobes Origins. We
> don't need to do flat islands into SMG, we'll do it SMG from the get-go."

Prior art: Black & White, Populous, From Dust, Super Mario Galaxy, Chao Garden, Monster Rancher, Jade Cocoon, Spectrobes, Viva Piñata.

## The owner's rulings (2026-10-07)

- **In the garden you are the Pneuka Jar, never the Courier** (the Jar is the Vessoul's true form), and **the god hand is always over
  it** (no ~). The hand can grab the Jar itself and set it down or throw it to another planetoid; everything done to the garden, the
  hand does.
- **Galaxy from the start**, no flat islands. The core movement is untouched: the Jar's hop is a controller of its own on small
  spheres (Petra ruled round-planet gravity out of the Courier's controller, whose wallrun, mantle, slide, ladders and camera take
  world +Y as up), as the skiff is its own mode.
- **The catch** (the owner: "something really fun about using the Pneuka Jar and Godhand form in battle to capture them when
  stunned"): two ways, a gamble and a skill (section 2). The Veritome reprograms; it does not catch.
- **Bound until released:** a spirit never leaves, fades or dies; you may release one ("Pokemon don't release themselves").
- **Each player names their own Inner Realm**, from Espada's names in her conlang or their own.
- **The Firings** ("Very appropriate and can scale to any number"): no ceiling.
- **Lachrymite cubes are the one currency**; nothing in the garden adds another.

## 1. The place

Entered at any Shrine (SHRINES.md): a small galaxy inside the Pneuka Jar, under a sky tinted by your draught, on the game's clock (the
moonflower opens at night). Six planetoids: **the Dantian** (the heart: the way in, a lake of your own Lachryma, the Pneuka Box's
shed), **the Herb Terraces** (the beds), **the Athanor** (the furnace: Soul Alchemy's press and firing), **the Pavilions of Echoes** (the dividend's
slots), **the Mulberry Grove** (the spirits and the cocoon tree), **the Chimney** (the Heavenly Kiln's tribulation); later ones bought. Radii 8 to
20 m: hopped round in 5 to 15 real seconds, small enough to feel like a toy in your hand. Launch lotuses fling the Jar to a neighbour in
about 2 real seconds. The look (Dual Hearts): soft and floating, clouds below, spirit veins glowing between the planetoids.

**The hand's verbs:** grab and throw; **sculpt** (the planetoid stays a planetoid: its surface moves within a band of its radius, never
through its heart); lead water (a pond's Lachryma flows where you carved); place a feature in a plot; tend; pet and flick (alignment and
bond, Black & White); feed; cocoon and merge. Sculpting can move a spirit vein's course, so the layout and the land are one puzzle.

**The five feelings are the five phases** (Espada's correction, 2026-10-07: the tradition's own pairing, grief with the lungs and
metal, fear with the kidneys and water): mirth fire, wonder wood, desire earth, grief metal, dread water. **Generating** runs in the
game's shown order, wonder → mirth → desire → grief → dread → wonder (the last step is awe, already canon as that pair's dyad).
**Overcoming:** wonder checks desire, desire checks dread, dread checks mirth, mirth checks grief, grief checks wonder.

## 2. The spirits

**Where they come from:** caught (below); awakened from a Veritome plate at the Athanor's shrine (Monster Rancher's disc stone);
Lachrymite fossils dug in the Dunes and awakened by the Crucibelle's song (Spectrobes); visitors drawn by what the garden offers, who
settle if you meet more (Viva Piñata; the ecology's offers, `docs/AI.md`); bred by merging in the cocoon tree (Jade Cocoon).

**The catch in battle:**

| | the Lockheart (summoning coffin worn) | the god hand (~, the Jar and the hand) |
|---|---|---|
| when | a Figment critically stunned (`stun.vulnerable`) | a Figment stunned |
| how | the catch wheel at `catchOdds` (class, how cleanly it was laid low, its EmO; the Possibilikeys bend it) | hold it over the Jar's mouth through its struggle (a second a class: Guppy 1 s .. Leviathan 5 s) |
| the risk | a miss spends the keys | the Jar is still while the fight goes on, and a stun that ends mid-struggle frees it |
| the reward | at range, gambled | certain if held through: skill over luck |

Either way it is bound and waits in the Jar until you next enter the garden, where it hops out into the Grove.
**Raising:** five stats, one a feeling; fed by what the game drops; drills that raise one stat and tire it; alignment on the
Law–Chaos line; 5 × 3 = 15 forms a kind (strongest feeling by alignment); merging keeps the stronger of each stat at a share. They
work the garden (Palworld), and one comes out with you as an ally (`creatures/spirits.js`). **Later (not built):** races on a planetoid
track (Chao Race), sparring at the Chimney.

## 3. The Firings and the Inner Realm's name (Espada's words, 2026-10-07, `docs/LORE.md`)

The soul refired, as clay is, each Firing a harder heat: read from the sum of Soul Alchemy's attribute ranks (thresholds 7, 14, 24, 36,
50 for the second to the sixth), crossed by the tribulation at the Chimney (lightning, each strike outlined, flicked back by the
hand or dodged by a hop; failing costs nothing but the try). They open places and verbs (the Grove, the Pavilions, two spirits out,
planetoid slots), **never a level**: no numbers on the Courier (DESIGN.md).

- **The first six Firings:** Candling, Sinter, Lustre, Salt, Reduction, Anagama. After the sixth they go by number.
- **The tribulation** is the Heavenly Kiln: "The Heavenly Kiln opens." / "Second Firing: Sinter. Complete." / "The Heavenly Kiln
  closes. Try again when you are ready."
- **Inner Realm names** on offer, built from neuralese Functions the player will learn: HEMA-LUNO, KITH-HEMA, LUNO-DEO, STIL-DEO,
  EZA-LON, ROMI-LON, SIVA-LUNO, HUSA-HEMA, AMI-HEMA, MOR-LUNO. `/realmname` writes your own.

## 4. The economy

Planetoids are the long sink (`ECON.place.planetoids`), their slots gated by the Firings so money alone never buys them. Features cost
cubes and the materials of their phase: the Wells' materials finally have a home. Spirits cost attention, not upkeep. Spirits at work
add up to +25% to a slot (measured before final). **Open:** a gardener profile in `scripts/economy.mjs`.

## 5. The events (as emitted; each carries `by`)

- `garden.enter { shrine }`, `garden.leave`, `garden.launch { from, to }`, `garden.sculpt { planetoid, how }`,
  `garden.place { plot, planetoid, feature, feeling, mult, vein }`, `garden.art { art }`
- `spirit.bind { from: 'lockheart' | 'hand', kind, cls, spirit }`, `spirit.feed`, `spirit.drill`, `spirit.mature`,
  `spirit.merge { kinds, kind }`, `spirit.out { kind, spirit }`, `spirit.release`, `spirit.visit`
- `realm.name { realm }`, `cultivation.kiln { firing }`, `cultivation.tribulation { firing, passed, hits, parried }`

## 6. Acceptance (the owner ticks these; each becomes a QAIS test)

1. At a Shrine, enter the garden: you are the Pneuka Jar on the Dantian, hopping with WASD round a round planetoid, the god hand above.
2. The hand picks up the Jar and throws it to the Herb Terraces; a launch lotus does the same.
3. The hand sculpts a hill and a pond on a planetoid, and the pond's Lachryma runs where the land was carved.
4. A Figment caught in the world appears bound in the Grove; feeding it a material raises its stat, and the log says so.
5. Two generating features side by side show their bonus.
6. The tribulation can be begun, failed, retried and passed.
7. The garden's name, chosen at the first entry, is shown where the garden is named.

## 7. The feature list (the owner, 2026-10-07, through Petra: "plot out a full feature list with everything that should be in the Spirit Garden from previous notes and your own future considerations, and execute it")

Also asked: terraforming with "fluid sims, mesh deformation, the works"; the god hand's view straight down on the Jar; first person.
Petra's draft (23 items) folded in, with Dovina's rules and what was missing (24 to 31). **The order is the build order**; a step
starts when the one before it runs clean in the garden sweep (`scripts/sweeps/garden.mjs`), and each item lands with its check there
(item 23). Rules with numbers are in `src/progress/realm.js` (named beside each). Status: **built**, **building**, **open**.

| order | # | item | status | owner | the rule |
|---|---|---|---|---|---|
| 1 | 1, 2 | Three views (behind the Jar; first person, Z; overhead, the god hand's view straight down, WASD pans); the held Jar never under the ground | built | Petra | |
| 1 | 3 | The camera kept out of the ground and the Chimney's needle; the overhead view tethered to the planetoids | built | Petra | |
| 2 | 4, 5 | A finer ground (128 × 64 cells, a band to a third of the radius); brushes raise, lower, smooth, flatten, carve, roughen; size, strength, undo (ten strokes) | built | Petra | |
| 2 | 8, 9 | Shallow water (virtual pipes): sources, drains, pooling, spilling, evaporation; hydraulic and thermal erosion | built | Petra | |
| 2 | 10 | The Jar wades and floats; a spirit swims or avoids water by its grain; a pond fills from the water | built | Petra | |
| 2 | 22 | The ground, the water, the materials and the features in the save (under 200 KB for six planetoids) | built (110 KB for six sculpted) | Petra | |
| 2 | 31 | **Added:** a frame budget for the garden: the water and erosion together under 2 ms a frame on the Dantian, measured with `npm run perf`; past it the simulation steps less often, never the frame | built (1.29 ms measured pouring on the Dantian) | Petra | |
| 3 | 6 | Ground materials painted by the hand: moss (wood, wonder), ash (fire, mirth), loam (earth, desire), slate (metal, grief), silt (water, dread) | built | Petra; the look Calissa | `GROUND`, `GROWTH`: **free** (sculpting is play, not a sink; From Dust); a feature counts its ground as **one neighbour** in its formation; a bed on its own feeling's ground grows 1.25× |
| 3 | 11 | Water keeps a feeling and mixes | built (not yet: GROWTH on the beds, a spirit drinking its feeling) | Petra | `WATERS`, `mixWater`: the lake is the draught you entered with, a spring the feeling chosen when placed, rain the garden's weather; water reaching a feature is **one neighbour**; a bed watered with its own feeling grows 1.25×; a spirit drinking its stat's feeling gains 1 a game hour; opposites mixed cancel to fair water |
| 3 | 13 | Sculpting moves a vein | built | Petra | `VEIN`, `veinEnd`: a vein ends at the **highest ground within 35°** of the direction to the other planetoid (dragon veins run along ridges); raise a ridge and it follows; water never moves it; within 3 m of its end is on the vein |
| 3 | 20 | Rain from the garden's own weather | built, dry until the mental state's keeper (below) | Petra; the look Calissa; the sound Wanda | `RAIN`, `rainOf`: **the weather is you**: the draught falls as rain as hard as your mental state is liquid (Stoic and Resolved dry, Balanced 0.2, Fluid 0.5, Prismatic 0.9, brimming +0.1). Drinking Lachryma in the world waters the garden; meditating at the Chimney clears it |
| 3 | 7 | Placed features picked up and moved by the hand | built | Petra | moved free; the formation recomputed where it lands |
| 3 | 30 | **Added:** reset a planetoid to its rest shape (free, asked twice) | built | Petra | |
| 4 | 14 | The moonflower opens at night | built | Petra | by the game hour (`phaseAt` night) |
| 4 | 15 | Plants spread on wet, fertile ground by a cellular rule; trees on the Mulberry Grove | built | Petra; the look Calissa | spread only onto ground that `spreads` (moss, loam, silt) and is wet |
| 4 | 17a | Visitors settle | built | Petra | `SETTLE`: after `VISITORS[kind].settle` visits with its wants met it is bound, free, if a spirit house has room; a missed visit keeps the count, a want lost for 3 game days resets it |
| 4 | 17b | Sparring at the Chimney | built | Petra | `SPAR`: no one is hurt; each gains 6 in its strongest stat and 25 fatigue, alignment toward Chaos; at most 45 real seconds |
| 4 | 17c | Races on a planetoid track | built | Petra | `RACE`, `raceSpeed`: a track is a carved groove that closes on itself (40 m or more), up to four runners; flat by mirth, climbs by desire, water by dread, the last third by grief, the inside line by wonder. **Pays no cubes**: records, achievements and bond |
| 4 | 25 | **Added:** name a spirit (the Chao Garden's) | built | Petra; words Espada | shown where the spirit is named, in the log |
| 5 | 19 | New planetoids bought and placed | built | Petra | `ORBIT`, `orbitSlot`: a ring of 10 slots 95 m round the Dantian, 12° above and below its equator by turn (Galaxy's observatory); the hand carries the seed up and lets go; it takes the nearest free slot and grows lotuses and veins to its two nearest |
| 5 | 12 | Water between planetoids (a fall off a rim drops to the nearest by its gravity) | built | Petra | |
| 6 | 21 | A guest in your garden | open | Petra (after COOP.md C5) | `GUEST`: their Jar hops and looks; their hand may pet your spirits, spar at the Chimney, and leave one material a visit in the shed's gift slot; it never sculpts, paints, places, waters, catches, releases or takes (Animal Crossing's visitors do not dig) |
| all | 23 | Each item's check in the garden sweep | built for steps 1 to 5 (section 13 of the sweep; the whole garden sweep 128 pass, 0 fail on v113) | Dovina | Petra sends the hooks |
| all | 24 | **Added:** the garden's help page (the keys, the brushes, the views) | built | Petra; words Espada | |
| all | 26 | **Added:** the garden's ledger and achievements (strokes, water led, rivers cut, races won and records, visitors settled, sparring) | open | Dovina | predicates over the ledger, as every achievement |
| all | 27 | **Added:** the gardener in `scripts/economy.mjs` (what an hour in the garden costs and earns: beds, the dividend, the sinks) | open | Dovina | |
| all | 28 | **Added:** the garden's sound (water by its feeling, rain, the brushes, a cue per Firing) | open | Wanda | |
| all | 29 | **Added:** the garden's look for the new parts (the five grounds, the water's surface, rain, plants) | open | Calissa | Lachryma water may shimmer (CLAUDE.md) |

**Status, v110 (Petra, 2026-10-07):** steps 1 to 5 built. Open: 21 (guests, after COOP.md C5), 26 and 27 (Dovina), 28 (Wanda), 29
(Calissa), GROWTH's two 1.25s on the beds and a spirit drinking its feeling (Petra, with the beds' and spirits' growth).

**The Courier's mental state, kept (Dovina's ruling, for 20: Petra wires it).** `game.courierMind`, one number from 0 (Stoic) to 1
(Prismatic), resting at 0.5 (Balanced), read as a band by `progress/combat/mind.js` (one word for both, the glossary). Lachryma drunk
pushes it up by `COURIER_MIND.perDrink` x the stones' `heady` x the amount (`progress/stones.js`); a drink past full by `perOverflow`
(and `brimming` is true for 2 real seconds after); quiet settles it toward 0.5 at `settlePerSec` a real second once no Lachryma has been
drunk for 5 real seconds. `game.draught` beside it: the feeling of the Lachryma last drunk (`draughtOf`), fading at `DRAUGHT.fadePerSec`.
Kept in the save with the pool (state that must agree is one section). The log says "You are brimming." and "You settle." (Espada's).

Asked of the owner: none; every rule above is a default the owner may overturn.
