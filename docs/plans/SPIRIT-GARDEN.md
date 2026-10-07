# The Spirit Garden, as a place: a god game of your inner world (the owner, 2026-10-07)

Kept by Dovina. A spec for the owner's cut, before anything is built. **Petra builds the place, the Jar's controller and the hand's
new arts. Calissa the look, Wanda the sound, Espada the names and the conlang.** Units: metres, real seconds, game hours, minutes of
play.

> "It should be like the Chao Garden from Sonic had a baby with Super Mario Galaxy for the microplanet traversal mechanics and the
> dreaminess of Dual Hearts. Embrace Xianxia fantasy and cultivation as the major inspirations."
>
> "You're making the assumption that the form of the player HAS to be as the Courier within the Spirit Garden. It doesn't... Use the
> Pneuka Jar as the character controller and have it hopping around with WASD, grabbable with the Godhand... the Godhand also lets you
> interact with facilities, captured Figments, terraform the microplanets, and literally let you reshape your inner world like clay.
> The Spirit Garden is the true god game module mixed with monster raising like Monster Rancher, Jade Cocoon, Spectrobes Origins. We
> don't need to do flat islands into SMG, we'll do it SMG from the get-go."

**What exists today:**
- The garden's rules and state: `src/progress/garden.js` (the dividend's slots, the beds, the upgrades) and `alchemy.js` (the press
  and the firing). They open as a page at a Shrine.
- The **god hand** (`src/godhand/`, the ~ key): the Courier becomes the Pneuka Jar, and you are a hand over the world. Its god arts
  grab and throw, cut, swell, wring and **raise clay**, and its HATCH turns a clapperjar to your side.
- **The garden is built from these, once.**

## 1. Who you are in the garden: the Jar, and the hand over it

- **You are the Pneuka Jar.** In the garden there is no Courier. The Jar is your true form (the glossary: the Vessoul in every form one
  being), and this is your inner world.
  - It **hops** with WASD: a short, springy hop a press, a longer one held (Katamari's bounce, a Chao's waddle, Super Mario Galaxy's
    Mario on a small world).
  - Space jumps higher.
  - It rolls on its side down a slope.
- **You are also the god hand.** It is always over the garden (no ~ to switch).
  - **It can grab the Jar itself:** pick yourself up and set yourself down on another planetoid, or throw yourself across the gap (the
    hand's throw, with the Jar as the thing thrown).
  - **Everything you do to the garden, the hand does:** tending, placing, feeding, terraforming (section 4).
- **The core movement is never touched.** The Jar's hop is a controller of its own, made for the garden, so Super Mario Galaxy's
  gravity costs the gold standard nothing.
  - Petra ruled round-planet gravity out of the Courier's controller, and rightly (its wallrun, mantle, slide, ladders and camera all
    take world +Y as up).
  - The Jar was never that controller. It is a small one on small spheres, as the skiff is its own mode.
  - **So the garden is Galaxy from the start** (the owner).

## 2. Prior art: what is taken, and from where

| from | taken | where |
|---|---|---|
| **Black & White** | the god hand as your whole presence; a creature taught by the hand (petted for good, slapped for bad), its alignment from how you treat it | the hand; the spirits' alignment |
| **Populous, From Dust** | terraforming as the god's verb; land raised and lowered, water led | the hand's clay arts on the planetoids |
| **Super Mario Galaxy 1 and 2** | planetoids small enough to run round, gravity toward each one's heart, launch stars, a hub made of small worlds | the planetoids, the Jar's gravity, the launch lotuses |
| **Sonic Adventure's Chao Garden** | creatures raised by what you feed them; forms by stats and alignment; a home between adventures | the spirits' care |
| **Monster Rancher** | monsters **generated from discs** at the shrine; training drills that raise one stat and tire it; **combining** two into a new one | spirits awakened from the Veritome's plates; drills; merging |
| **Jade Cocoon** | Figments captured, **purified in a cocoon**, then **merged**, the child inheriting looks and powers from both | the cocoon tree; merging |
| **Spectrobes Origins** | fossils **excavated** and **awakened by sound**; evolved by feeding minerals; kept in an incubator | Lachrymite fossils dug in the Dunes, awakened by the Crucibelle's song |
| **Viva Piñata** | wild creatures **visit when the garden meets their wants**, then settle if you meet more | wild Figments drawn by what you build (the ecology's offers, `docs/AI.md`) |
| **Dual Hearts** | the dreamworld as floating islands in soft light; a world that is someone's sleeping mind | the look: this *is* the Courier's mind |
| **Xianxia and cultivation fiction** | the cave abode; the dantian; spirit veins; the pill furnace; formation arrays; spirit beasts **bound** to a cultivator; the heavenly tribulation | the place; Soul Alchemy; placement; binding; cultivation |
| **Wu Xing, the five phases** | the generating and overcoming cycles | the five feelings as the garden's elements |
| **Dark Cloud 2's Georama** | building a place piece by piece against its people's wishes | placement against the spirits' wants |

**The five feelings are the five phases.** They work as the garden's elements: the generating cycle feeds, the overcoming cycle
checks.

| feeling | phase |
|---|---|
| mirth | fire |
| wonder | wood |
| desire | earth |
| grief | water |
| dread | metal |

Espada should confirm the mapping against LORE.md.

## 3. The place (Galaxy, from the start)

The garden is entered at any Shrine (SHRINES.md). It is a small galaxy inside the Pneuka Jar, under a sky tinted by **your draught**
(the feeling you drink: the stones). It keeps the game's time: game hours and the day's phases; the moonflower opens at night.

| planetoid | radius | what it is | the system under it |
|---|---|---|---|
| **the Dantian** (the heart) | 20 m | where a Shrine lets you in; a lake of your own Lachryma; the **Pneuka Box's shed** | the box, the way in and out |
| **the Herb Terraces** | 12 m | spirit-herb fields round the planetoid | the beds |
| **the Furnace** | 10 m | the pill furnace on basalt: the spirit press and the firing | Soul Alchemy |
| **the Pavilions of Echoes** | 14 m | halls where echoes of the encounters you mastered keep working | the dividend's slots |
| **the Spirit Grove** | 16 m | the spirits' home, and the **cocoon tree** (section 5) | the spirits |
| **the Meditation Peak** | 8 m, tall | a needle of rock | the tribulation (section 6) |
| later planetoids, bought | 8–16 m | a moonflower moon, a koi planetoid, a training ground, the fossil bed | the long sink |

- **Gravity** pulls toward each planetoid's heart.
- **Launch lotuses** fling the Jar on an authored arc to a neighbour in about 2 real seconds. The hand can also throw the Jar.
- **Scale:** a planetoid of 8 to 20 m is hopped round in 5 to 15 real seconds; small is what makes it feel like a toy in your hand.
- **The look (Dual Hearts):** soft and floating, clouds below, spirit veins glowing between the planetoids like rivers of light.

## 4. The hand's verbs: a god game

The garden's god arts are the god hand's own (`godhand/arts.js`), built once, with a few added for the garden:

| verb | what it does | from |
|---|---|---|
| **grab and throw** | anything loose, a spirit, the Jar itself | the hand's grab |
| **sculpt** | press, pull, smooth and carve a planetoid's clay. Raise a hill, dig a pond, cut a terrace. The planetoid stays a planetoid: sculpting moves its surface within a band of its radius, never through its heart | the hand's raise-clay art, made a brush on a sphere (Populous, From Dust) |
| **lead water** | a pond's Lachryma flows downhill along what you carved | From Dust |
| **place** | a feature into a plot, from the catalogue | Animal Crossing, Georama |
| **tend** | water a bed, stoke the furnace, ring a pavilion's bell to collect | the garden's acts today, done by hand |
| **pet / flick** | a spirit, praised or scolded: its alignment and its bond move | Black & White |
| **feed** | drop a material, a cask, a curio into a spirit's hands | Chao, Monster Rancher |
| **cocoon / merge** | set a spirit in the cocoon tree; set two together to merge | Jade Cocoon, Monster Rancher |

**Features and their formation:**
- A feature placed in a plot has a phase (a feeling) and a job: a terrace grows, a pavilion works, a spirit house shelters, a lantern
  lights, an incense burner calms, a formation stone empowers.
- Neighbours that **generate** each other strengthen each other (+10%); neighbours that **overcome** weaken (−10%).
- A spirit vein under a plot doubles what stands there. **Sculpting can move a vein's course**, so the layout and the land are one
  puzzle.

## 5. The spirits: raising them

**Where they come from** (each a way you already play, made a way to find a spirit):

| source | how | from |
|---|---|---|
| **caught** | **by the Lockheart**: its summoning coffin opened on a Figment laid low, the catch wheel at its odds (`CATCH`, `tools/lockheart/table.js`). **Or by the god hand in battle**: ~ to the Jar and the hand, grab a stunned Figment and hold it over the Jar's mouth through its struggle (section 5a). Either way it is **bound** and sent to the garden. (The Veritome reprograms; it does not catch: the owner) | Pokemon, Jade Cocoon |
| **awakened from a plate** | a Veritome photograph of a creature, set in the Furnace's shrine, awakens a spirit of its kind; its stats are read from the plate's quality | Monster Rancher's disc stone |
| **dug** | **Lachrymite fossils** in the Dunes, found with the Dreamvane's pick, awakened in the Grove by the Crucibelle's song | Spectrobes Origins |
| **visitors** | wild Figments **visit when the garden meets their wants** (a pond of grief, a dread lantern, a terrace of desire herbs), and settle if you meet more. The ecology's offers (`docs/AI.md`) say what each wants | Viva Piñata |
| **bred** | two merged in the cocoon tree give one with traits of both | Jade Cocoon, Monster Rancher |

### 5a. The catch in battle (the owner, 2026-10-07: "something really fun about using the Pneuka Jar and Godhand form in battle to
capture them when stunned")

Two ways, one skill and one gamble, as the game likes its pairs (the slam and the ram; the reckoning and the dice):

| | the Lockheart (summoning coffin worn) | the god hand (~, the Jar and the hand) |
|---|---|---|
| when | a Figment critically stunned (`stun.vulnerable`) | a Figment stunned |
| how | open the coffin on it: the catch wheel spins at `catchOdds` (class, how cleanly it was laid low, its EmO; the Possibilikeys bend it) | grab it with the hand and hold it over the Jar's mouth: it **struggles** (a second a class: Guppy 1 s .. Leviathan 5 s), tugging the hand; keep it over the mouth until it is drawn in |
| the risk | the odds: a miss spends the keys | the Jar is still and the fight goes on: whatever is hitting the Jar while you hold (raiders, shots, the rest of the pack) can crack it, and a stun that ends mid-struggle frees it |
| the reward | at range, mid-fight, gambled | **certain** if held through: skill over luck |
| prior art | Pokemon's catch rate, the gacha's published rate | Black & White's hand, Luigi's Mansion's Poltergust tug, Pikmin's carry |

A Figment caught either way is bound (`spirit.bind { from: 'lockheart' | 'hand', kind, cls, by }`), and waits in the Jar until you
next enter the garden, where it hops out into the Grove.

**Bound until released** (the owner): a spirit is bound to you and never leaves, fades or dies. You may **release** one; Pokemon
never release themselves.

**Raising:**
- **Five stats, one a feeling:** mirth (speed), wonder (sight), desire (strength), grief (stamina), dread (will).
- **Feeding:** a Well's material raises the stat of its kind; a cask of crude shifts its feeling; a curio raises its bond.
- **Drills** (Monster Rancher's training): at the training ground a drill raises one stat and tires the spirit. Rest restores it.
- **Alignment** on the Law–Chaos line, by the hand's pet and flick (Black & White).
- **Forms:** at a bond and stat threshold a spirit matures into a form set by its strongest feeling and its alignment: 5 × 3 = 15
  forms a kind.
- **Merging** (Jade Cocoon): two spirits in the cocoon become one, which keeps the stronger of each stat at a share, and their looks
  mixed. Its form can be one neither parent could reach.

**What they do:**
- **Work** the garden (Palworld): a spirit at a pavilion or terrace raises its job by its matching stat.
- **Come out with you** as an ally (`creatures/spirits.js`), one at a time.
- **Later:** races on a planetoid track (Chao Race), sparring at the Peak.

## 6. Cultivation (the Firings), and your Inner Realm's name

- **Naming** (the owner): each player names their own Inner Realm, their garden. Espada offers pre-generated names in her conlang,
  the neuralese the Veritome's reprogramming speaks, so the naming is also where the language is first met.
- **The Firings** (the owner, 2026-10-07: "Very appropriate and can scale to any number"): the soul refired, as clay is, each Firing a
  harder heat. The first Firing, the second, and so on, with no ceiling:
  - They are read from the sum of the attributes' ranks from Soul Alchemy (70 in all).
  - They are crossed by the **heavenly tribulation** at the Meditation Peak: the Jar on the peak's mat, lightning from a darkening sky,
    each strike outlined, sent back by the hand's flick or dodged by a hop. Failing costs nothing but the try.
  - **Thresholds:** 7, 14, 24, 36, 50 (the second to the sixth Firing); a seventh and later when the attributes' ranks grow.
  - **What they open:** the Grove, the Pavilions, two spirits out at once, planetoid slots, and the last planetoid.
  - **Never a level:** they add no numbers to the Courier (DESIGN.md: no experience points, no levels). They open places and verbs.

## 7. The economy

- **Lachrymite cubes are the one currency** (the owner). Nothing in the garden adds another.
- **Planetoids** are the long sink, bought one after another: 60, 120, 240, 480 minutes of play. Their slots are gated by
  cultivation, so money alone never buys them.
- **Features** cost cubes and the materials of their phase. The Wells' materials finally have a home.
- **The dividend:** unchanged (0.6× the aim of the mastered encounter, up to 8 game days uncollected). Spirits at work add up to +25%
  to a slot (measured before final).
- **Spirits cost attention, not upkeep.**
- **Measured before built:** `scripts/economy.mjs` gains a gardener profile once the owner cuts the numbers.

## 8. The contract and the acceptance (the owner ticks these; each becomes a QAIS test)

**Events:**
- `garden.enter { shrine }`, `garden.leave`
- `garden.sculpt { planetoid }`, `garden.place { plot, feature }`, `garden.launch { from, to }`
- `spirit.bind { from }`, `spirit.feed { item }`, `spirit.drill { stat }`, `spirit.mature { form }`, `spirit.merge`,
  `spirit.release`, `spirit.visit { kind }`
- `realm.name { name }`, `cultivation.tribulation { tier, passed }`

Every event carries `by`. The log's rules and the counts are Dovina's.

**Acceptance:**
1. At a Shrine, Enter the garden: you are the Pneuka Jar on the Dantian, hopping with WASD round a round planetoid, the god hand above.
2. The hand picks up the Jar and throws it to the Herb Terraces; a launch lotus does the same.
3. The hand sculpts a hill and a pond on a planetoid, and the pond's Lachryma runs where the land was carved.
4. A Figment reprogrammed in the world appears bound in the Grove; feeding it a material raises its stat, and the log says so.
5. Two generating features side by side show their bonus.
6. The tribulation can be begun, failed, retried and passed.
7. The garden's name, chosen at the first entry, is shown where the garden is named.

## 9. The build

`docs/plans/BUILD.md`, gates G1 to G5 (the owner, 2026-10-07: "Plan out the full build").
