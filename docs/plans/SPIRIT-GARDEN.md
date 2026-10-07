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
