# The Spirit Garden, as a place (the owner, 2026-10-07)

Kept by Dovina. A spec for the owner's cut, before anything is built. **Petra builds the place and the movement, Calissa the look,
Wanda the sound, Espada the names and the cultivation's words.** Units: metres, real minutes, game hours, minutes of play.

> "The Spirit Garden is supposed to be like an actual location. Base building and where we conduct Soul Alchemy and all that. I think
> it should be like the Chao Garden from Sonic had a baby with Super Mario Galaxy for the microplanet traversal mechanics and the
> dreaminess of Dual Hearts. Embrace Xianxia fantasy and cultivation as the major inspirations."

**What exists today** (`src/progress/garden.js`, `alchemy.js`, DESIGN.md section 16): the rules and state are built, but there is no
place yet. They are:
- the dividend's slots (worked by mastered encounters);
- the beds (a material planted grows more of its kind);
- the upgrades (the long sink);
- Soul Alchemy's press and firing (the soul colour walked to an attribute's target, raising its rank).

Today the garden opens as a page at a Shrine. This spec makes it a world.

## 1. In one line

**Your cave abode inside the Pneuka Jar:** a small dream galaxy of floating planetoids round your dantian. Play done well keeps working
there, Soul Alchemy is refined there, spirits are raised there, and you cultivate.

## 2. Prior art: what is taken, and from where

| from | taken | where it lives |
|---|---|---|
| **Sonic Adventure 1 and 2's Chao Garden** | creatures you raise by what you feed them; stats from food, alignment from how you treat them (Hero, Dark, Neutral), forms on maturing, rebirth instead of death, a place you return to between levels | the spirits (section 6) |
| **Super Mario Galaxy 1 and 2** | planetoids small enough to run round, gravity toward each one's heart, launch stars between them, a hub made of small worlds (the Comet Observatory) | the layout and the traversal (sections 3, 4) |
| **Dual Hearts** | the dreamworld as floating islands in soft light; a world that is someone's sleeping mind | the look; the garden *is* the Courier's inner world |
| **Xianxia and cultivation fiction** (Coiling Dragon, I Shall Seal the Heavens, Cultivation Chat Group; the genre's furniture) | the **cave abode** (洞府, a cultivator's own pocket dwelling); the **dantian** at its heart; **spirit veins** under the land; **spirit herb fields**; the **pill furnace** (alchemy as refinement); **formation arrays** (placement that empowers); **spirit beasts**; **realms** of cultivation and the **heavenly tribulation** at each breakthrough; **flying on a sword**; **spirit stones** as money | the dantian, the beds, the Furnace, placement (section 5), the spirits, the realms (section 7) |
| **Wu Xing, the five phases** | the generating cycle (each phase feeds the next) and the overcoming cycle (each checks another) | the five feelings as the garden's elements (section 5) |
| **Dark Cloud 2's Georama** | building a place piece by piece against requests, each piece with conditions; the place as a puzzle | placement (section 5) |
| **Animal Crossing, Palworld** | a home that keeps time while you are away; creatures that work it | the dividend, the beds, the spirits' work |
| **Okami's Celestial Plain, Ni no Kuni II's kingdom** | a dwelling that grows with the hero | the planetoids bought one by one |

**The five feelings are the five phases.** The game already has five of everything, so Wu Xing lands on them without a new list:

| feeling | phase |
|---|---|
| mirth | fire |
| wonder | wood |
| desire | earth |
| grief | water |
| dread | metal |

**Generating** (wood feeds fire feeds earth feeds metal feeds water feeds wood) reads as wonder → mirth → desire → dread → grief →
wonder. **Overcoming** is each phase checking the second one along. Espada should confirm the mapping against LORE.md; it is a
proposal.

**Spirit stones are Lachrymite.** The genre's money is the game's money already (cubes are Lachrymite), so nothing new is added.

## 3. The place

The garden is entered at any Shrine (SHRINES.md: the door). It is a galaxy inside the Pneuka Jar, under a sky that is **your draught**:
the feeling you drink (the stones, `progress/stones.js`) tints the garden's weather. Its time is the game's (game hours, the day's
phases); the moonflower bed opens at night.

| planetoid | radius | what it is | the system under it |
|---|---|---|---|
| **the Dantian** (the heart) | 20 m | the arrival lotus where a Shrine lets you in; a lake of your own Lachryma (your pool made place); **the Pneuka Box's shed** | the box (P), the way in and out |
| **the Herb Terraces** | 12 m | stepped spirit-herb fields round the planetoid | the beds (`garden.beds`) |
| **the Furnace** | 10 m | the pill furnace on a basalt planetoid: the spirit press and the firing | Soul Alchemy (`alchemy.js`) |
| **the Pavilions of Echoes** | 14 m | open halls where echoes of the encounters you mastered keep working | the dividend slots (`garden.slots`) |
| **the Spirit Grove** | 16 m | the spirits' nursery: water, trees, a cocoon tree | the spirits (section 6) |
| **the Meditation Peak** | 8 m, tall | a needle of rock with a mat at the top | the realms and the tribulation (section 7) |
| later planetoids, bought | 8–16 m | a moonflower moon, a koi planetoid, a sparring ground, a bigger furnace | the long sink (section 8) |

- **Scale (Galaxy's lesson):** a planetoid of 8 to 20 m can be run round in 5 to 15 real seconds. Small is what makes Galaxy feel
  like a toy you can hold. Planetoids sit 30 to 80 m apart.
- **The look (Dual Hearts):** soft, dreamy, floating. Clouds below, the Jar's glaze as the far sky, spirit veins glowing between the
  planetoids like rivers of light. Calissa's.

## 4. Traversal

1. **Launch lotuses** (Galaxy's launch stars): stand on one and press Space, and you are flung on an authored arc to the next
   planetoid in about 2 real seconds, the camera following. Every planetoid has one to each neighbour.
2. **Sword flight** (unlocked at the second realm, section 7): the Sondelass carries you between planetoids freely, the xianxia
   staple. Only in the garden, where it costs nothing and breaks nothing.
3. **On a planetoid: gravity toward its heart** (Galaxy).
   - **The hole, said plainly:** today the core movement assumes the world's up. Running round a sphere means the controller, the
     camera and the ground checks working to an up that changes. That is a large engine change, and the core movement is the gold
     standard.
   - **Proposal:** two phases.
     - **Phase 1:** the planetoids are floating islands with flat tops and rounded undersides (Dual Hearts). The core movement is
       untouched, and launch lotuses join them.
     - **Phase 2**, only if Petra judges it sound: a gravity field (up = away from the planetoid's heart). With up set to the world's
       up it must measure exactly the same as today (the stress test, compared tick for tick), so the gold standard holds.

## 5. Base building: placement as a formation array

- Each planetoid has **plots** (sockets: 4 to 10 a planetoid), not a free grid. Sockets are easier to build, easier to read, and keep
  the planetoid's silhouette authored (Animal Crossing's house exterior, Dark Cloud 2's slots).
- **Features** go in plots, from a catalogue: pavilions, herb terraces, ponds, lantern posts, spirit houses, incense burners,
  formation stones. Each has a **phase** (one of the five feelings) and a job.
- **Formation bonuses** (xianxia formations, Wu Xing):
  - Neighbouring features that **generate** each other strengthen each other (+10% each to their job).
  - Neighbours that **overcome** weaken (−10%).
  - A spirit vein under a plot doubles whatever stands on it.
  - So the layout is a puzzle with an answer that changes with what you grow. Dark Cloud 2's Georama scores a town against its
    people's requests; here the garden's spirits ask (section 6).
- **What jobs mean:**
  - a herb terrace grows (the beds' yield);
  - a pavilion works (a dividend slot);
  - a spirit house shelters (more spirits);
  - a lantern lights (the moonflower blooms in its light);
  - an incense burner calms (the draught settles faster when you rest);
  - a formation stone empowers its neighbours.
- **Cost:** cubes and materials (the Wells' materials finally have a home), priced as the long sink (section 8).

## 6. The spirits (the Chao)

**Where they come from:**
- **Reprogrammed Figments.** Reprogramming already exists (the Veritome). A reprogrammed Figment can be **offered to the garden**
  instead of released, and becomes a spirit. The ally creatures in `creatures/spirits.js` are already the game's word for this.
- **The Great Slip Jelly's brood.** If you reprogram the FOE (DUNEMAW-SYSTEMS.md), its brood hatch in the Grove.
- **Eggs** from the Wells' clutches, carried home.

**Raising them (Chao):**
- **Feeding** shapes them. A Well's material raises the stat of its kind. A cask of crude shifts their **feeling**. A curio raises
  their **bond**. Petting, carrying and speaking to them raises bond too (Chao).
- **Alignment** on the Law–Chaos line follows how you treat them: tending them gently is Law, sparring them is Chaos (Chao's Hero and
  Dark, on the game's own axis).
- **Stats:** five, one a feeling (the game's fives): mirth (speed), wonder (sight), desire (strength), grief (stamina), dread (will).
  They grow by feeding, by work, and by sparring at the Peak.

**Maturing and rebirth:**
- At a bond and stat threshold a spirit **matures into a form** set by its strongest feeling and its alignment: 5 × 3 = 15 forms
  (Chao's 3 × 5 types).
- After a long life (a few game weeks) a well-loved spirit **ascends** (cultivation's word). It is reborn as an egg that keeps a
  share of its stats. One left neglected fades back into the Emocean. There is no death on screen (Chao's cocoon).

**Their work (Palworld):**
- A spirit assigned to a pavilion or a terrace raises its job by its matching stat.
- A spirit can come out with you as an ally (`creatures/spirits.js`), one at a time.

**Later:** spirit races on a planetoid track (Chao Race), and contests.

## 7. Cultivation: the realms

The game has **no experience points and no levels**, and that rule stands (DESIGN.md: everything is learned by doing). A **realm** is
not a level: it is a name for how far your soul has been refined, read from what you have already done.
- **What it is read from:** the sum of your attributes' ranks from Soul Alchemy (seven attributes, ten ranks each, 70 in all).
- **How it is counted:** a ledger predicate, so it is retroactive like the achievements.
- **How you cross into it:** at the Meditation Peak, by the **heavenly tribulation**.

| realm (Espada names them) | ranks summed | what it opens |
|---|---|---|
| 1. Qi Condensation | 0 | the garden: the Dantian, the Terraces, the Furnace |
| 2. Foundation Establishment | 7 | **sword flight** in the garden; the Spirit Grove |
| 3. Core Formation | 14 | the Pavilions (more dividend slots); a second spirit can come out |
| 4. Nascent Soul | 24 | a planetoid slot; the spirits' forms visible on the Grove |
| 5. Spirit Severing | 36 | a planetoid slot; the moonflower moon |
| 6. Ascension | 50 | the garden's last planetoid; a title |

- **The tribulation** (xianxia's heavenly tribulation): a short trial at the Peak, begun by sitting on the mat (a trial is begun in its
  own room: CLAUDE.md).
  - **Length:** about 60 real seconds of lightning from a darkening sky.
  - **Telegraphs:** each strike is outlined where it will land (the parry outline: PARRY.md). Parry it with V, or step out.
  - **Escalation:** strikes come faster with each realm.
  - **Failing:** costs nothing but the try. Passing names the realm and opens what it opens.
- **Why not a level:** the realm rewards ranks already fired; it never adds numbers to the Courier. What it opens is places and
  verbs, not power.

## 8. The economy

- **Planetoids** are the long sink, bought one after another: 60, 120, 240, 480 minutes of play.
  - The first is one hour's earnings; the fourth is a committed player's week of surplus.
  - Their slots are gated by realm (section 7), so money alone never buys them.
- **Features** cost 5 to 30 minutes of play and the materials of their phase.
- **The dividend** is unchanged: 0.6x the aim of the mastered encounter, up to 8 game days uncollected. Spirits at work add up to
  +25% to a slot (measured before it is final).
- **Spirits cost nothing to keep.** They cost attention (Chao), not upkeep.
- **Measured before built:** `scripts/economy.mjs` gains a gardener profile once the numbers are cut.

## 9. The contract, and acceptance (what the owner can tick)

**Events:**
- `garden.enter { shrine }`, `garden.leave`
- `garden.place { plot, feature, by }`
- `garden.launch { from, to }`
- `spirit.adopt { from }`, `spirit.feed { item }`, `spirit.mature { form }`, `spirit.ascend`
- `realm.tribulation { realm, passed }`, `realm.reach { realm }`

**The log's rules and the counts are mine** (`tracking/garden.js`).

**Acceptance** (each a QAIS test when built):
1. From any Shrine, F, the garden page, Enter: you stand on the Dantian's lotus, and the Pneuka Box is in the shed.
2. A launch lotus flings you to the Herb Terraces in about 2 seconds; planting a material there works as the beds do today.
3. The Furnace runs Soul Alchemy as the page does today.
4. A reprogrammed Figment can be offered and appears in the Grove; feeding it a material moves its stat (the log says so).
5. Placing two generating features side by side shows their bonus; overcoming ones show the malus.
6. The Peak's tribulation can be begun, failed, retried and passed; passing names the realm and opens sword flight.

## 10. Who builds what, in phases (one gate each)

- **G1:** the place.
  - The Dantian and four planetoids as floating islands, the launch lotuses, the door from the Shrines, the shed.
  - The beds, the Furnace and the slots moved from the page onto the planetoids.
  - Petra; Calissa's look; Wanda's garden cue.
- **G2:** placement.
  - Plots, features, the Wu Xing bonuses.
  - Dovina's numbers; Petra's placing; Calissa's features.
- **G3:** spirits (the Chao).
  - Adoption, feeding, stats, bond, maturing; their work.
  - A spirit mind built from the AI parts.
- **G4:** cultivation.
  - The realms (a ledger predicate, mine), the Peak, the tribulation, sword flight.
- **G5, if Petra judges it sound:** Galaxy's gravity on the planetoids, proven equal to today's movement when up is the world's.

## 11. Open for the owner

1. **Galaxy's gravity:** phase 1 as floating flat-topped islands, round-planet gravity only if the engine change proves safe. Agree?
2. **Spirits' death:** Chao never die on screen; neglected ones leave. Same here?
3. **Realm count and names:** six realms on the classic ladder, named by Espada in the game's own idiom (clay and glaze?), or the
   genre's own names kept as they are?
