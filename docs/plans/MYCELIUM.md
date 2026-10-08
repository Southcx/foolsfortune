# The Mycelium: fungi, the World Mushroom, and the spirits who live with them (a plan for the Spirit Garden's next round)

Dovina's plan, 2026-10-08. The owner's brief: "a deep dive on the monster raising, monster collection and slice of life cozy farming
genres (Rune Factory 4, Harvest Moon: A Wonderful Life), a distillation of the very specific themes, mechanics and visuals echoed
throughout, and a plan of what systems and modules we can add to the Spirit Garden that would be suitable and fun".

The owner's wife asked for "mushrooms and fungal entities as 'master transmutators', like being able to put curios in a plot bed and
have them break down or transform into new curios". The owner: "go outside the box with our esoteric and mystical themes, not 'lol I
planted wheat and potatoes'"; "the orchard in Legend of Mana"; "Garden of Eden / Yggdrasil as a mushroom type"; "a tree that you feed
curios and drops to recycle items"; "synergy with the Soul Alchemy system so we have more routes to procure specific colour items".

- **The research:** `docs/plans/research/GARDEN-GENRES.md`, with its distillation (mechanics, themes, visuals, pitfalls) and its
  sources. Each claim there is marked by how it was sourced (searched, from memory, or a fan guide).
- **The rules here are built and checked as data:** `src/progress/mycelium.js` and `node scripts/mycelium.mjs`, 14 checks, all pass.
- **Nothing is in the garden yet:** the places, the hand's verbs and the looks are the next round's (section 8).

## 1. What the genres teach, in one page (distilled from the research)

**The shared skeleton:** a small place on a clock slower than your attention, where effort becomes a visible thing that stays.

**The patterns we take, and from where:**

| # | pattern | taken from | where it lands here |
|---|---|---|---|
| 2 | **Time as an ingredient** | Stardew's casks, koji, the peach garden | the spore beds' game hours; the tree's dawn |
| 4 | **Adjacency makes a bigger thing** | giant crops, Animal Crossing's checkerboard | spore beds speed each other in the generating cycle (3.2) |
| 5 | **Two combine, a third emerges, by a chart you learn** | SMT fusion, Dragon Quest Monsters, lichen | the graft (3.1) |
| 7 | **The hidden revealed** | Pokemon natures, hybrid flowers | a curio's colour signature, read only by what the fungi make of it |
| 10 | **Stat = what was done** | the Chao Garden, Rune Factory | spirits fed fruit take their colour (5) |
| 11 | **A closed loop between two halves** | Rune Factory's farm and dungeon | the Wells feed the tree, the tree feeds the press, the press widens the Courier for the Wells |
| 13 | **A collection that opens the world** | Stardew's bundles | the Major Arcana open the tree's branches (4.3) |
| 15 | **Letting go as a gift** | Spiritfarer's Everdoor, Chao reincarnation | a spirit released through the kiln into a keepsake pot (5) |
| 16 | **A tree as the hub, with a mouth** | Trent, the Kalpavriksha, Yggdrasil | the World Mushroom (4) |
| 17 | **The place's mood as a hidden multiplier** | Legend of Mana's weekdays, Rune Factory's Runeys | the tree's fruit leaned by the game day's feeling (4.2) |
| 18 | **Helpers** | Rune Factory's monsters, Junimos | spirits tend the beds by their grain (5) |
| 19 | **Failure as comedy, cheaply fixed** | Slime Rancher's tarr | a botched graft gives a dud you can rot back (3.1) |
| 20 | **Craft as a map** | Potion Craft, Atelier | the colour signature and the sap (3, 4), on Soul Alchemy's own wheel |

**The pitfalls we refuse** (research section 8):
- **Chores:** nothing must be done every game day.
- **Punishing decay:** nothing wilts, spoils or dies; a bed's yield waits.
- **Inventory bloat:** everything is a material or a curio we already have; no new item families.
- **The wiki problem:** every rule is a picture you can read; the Codex keeps what you have found (the Grimoire of Echoes, design
  document v0.1).
- **Dominant choices:** each strain does a different job; none is "best".

**The themes, from the research:**
- slowness as care;
- strangeness accepted;
- cleansing and renewal (decomposition);
- hidden networks under the visible field;
- grief as a form of love (our Grief feeling is the rot: letting go that feeds what comes next);
- gentle awe as scale and glow.

## 2. The idea in one line

**The fungi are the garden's alchemists.** Everything you can hold has a colour on Soul Alchemy's wheel (its **colour signature**).
The fungi break things down and build them up by that colour, and the World Mushroom drinks it as sap and fruits it back. The Wells
give you the colours chance gives; the mycelium gives you the colour you choose. That is the synergy with Soul Alchemy: a second road to
any tile's heart.

## 3. The spore beds (the wife's "master transmutators")

A **spore bed** is a garden bed a **strain** has colonised (its fairy ring drawn round it). You set a thing in it with the hand; in
game hours it is changed; what it gives waits there for you, never spoiling. Each of the five strains works one verb, by the five
phases (SPIRIT-GARDEN.md section 1). The verbs are real fungal behaviours:

| strain (its feeling, its phase) | verb | what it does | eats | game hours | the real thing |
|---|---|---|---|---|---|
| wonder (wood: growth) | **graft** | two curios become one: the curio nearest their mixed colour; **a tier up** when they are of one tier and near complements, else the higher tier of the two | two curios | 12 | lichen (two lives become a third), the alchemists' coniunctio |
| mirth (fire: heat) | **ferment** | a material's colour deepens (+0.25 saturation) | a material | 8 | koji, a culture's slow heat |
| desire (earth: keeping) | **print** | anything becomes **one spore print**: a material of exactly its colour, whose path is one straight pull | a material, curio or fish | 4 | the spore print, which names a mushroom by its colour |
| grief (metal: letting go) | **rot** | anything breaks down into materials of its colour, worth six tenths of it | a material, curio or fish | 6 | decomposition, mycoremediation |
| dread (water: dissolving) | **dissolve** | a material's colour washes toward grey (-0.3 saturation) | a material | 6 | the fog |

**3.1 The graft is a chart, never a die** (SMT's fusion: learnable).
- The same two curios always graft into the same one. It is the curio nearest their mixed colour, each weighed by its worth (Newton's
  centre of gravity, as the press mixes).
- **A tier up only for equals and opposites:** two of one tier, at least 0.55 apart on the wheel. 12 of the 400 pairs rise. The
  first draft let any near-complement pair rise, and the check measured a x1.62 mint (a tier-0 married to a tier-3 made a tier-4); now
  the best is x1.09, about 12 cubes a real hour a bed.
- **A botched graft** gives the higher tier's nearest curio, which you rot back into its colour: failure as comedy, cheaply undone.

**3.2 Neighbours** (giant crops' adjacency, the five phases taught by their effect):
- a bed beside the strain that **generates** it (the one before it in wonder, mirth, desire, grief, dread) works ×1.25 as fast;
- a bed beside the strain that **overcomes** it works ×0.75 as fast.

So a row of beds in the generating order is a fast line, and the garden's layout is a decision without a button.

**3.3 The colour road (the synergy):**
- **A print is a precision tool:** one straight pull to an exact colour, so a spore print of the right thing walks the soul colour
  straight into a tile's heart (a **true firing**).
- **Rot** turns an unwanted curio into materials of its colour.
- **Ferment and dissolve** tune a material's saturation, which is the press's distance from grey.
- **Every attribute's hue has a curio or a fish within 30 degrees** to print from (checked).

**3.4 Where strains come from:**
- spore prints of wild mushrooms in the Wells and the Dunes (a new find in the Great Dunemaw's damp floors);
- the World Mushroom's seventh body (4.3);
- a spirit of a feeling, tending a bare bed, seeds its own strain there in time (5).

## 4. Myggdrasil, the World Mushroom (Espada's name, proposed: myco, my, Yggdrasil)

Espada's words (LORE.md "The mycelium"):
- the sap is **the tincture**;
- the fruiting bodies are **the caps**, named for the sephiroth from the root up (the Kingdom to the Crown);
- the strains are the **lichen** (graft), **koji** (ferment), the **inkcap** (print), the **oyster** (rot: real oyster mushrooms eat
  oil spills, so it cleans the crude) and **witches' butter** (dissolve);
- the twenty-two branches follow the Golden Dawn's paths 11 to 32 (`BRANCHES`): eight add a fruit, five a sharper tincture, five a
  strain's seed (the Lovers the lichen, the Hanged Man witches' butter, Death the oyster, Judgement koji, the World the inkcap) and
  four a sporeling;
- the keepsake pot is a white-ground lekythos (Calissa's look).


Legend of Mana's Trent and its orchard; Yggdrasil the world-ash; Eden's two trees, Knowledge and Life; the Siberian shamans' world
tree, under whose birch the fly agaric grows; the Kabbalists' Tree of Life.

**One tree, a mushroom the size of a tree, on a planetoid of its own** (bought, the ring's next slot: the Moonflower Moon's neighbour).
Its look: the owner's billboarded leaf-quad canopy (Calissa's) as gills and caps, in **labradorite and gold** (the owner: "more reason
to explore labradorite and gold").

**4.1 Feeding (the recycling the owner asked for).** The hand drops anything at its roots: a curio, a drop, a material, a fish. It
eats it. Its **sap** becomes the colour of everything it has eaten, each meal weighed by its worth (Newton's centre of gravity again),
and the canopy shows the sap's colour. So the tree is the garden's universal sink for what you do not want, and feeding it is
**steering a colour**, Potion Craft's map in a living thing.

**4.2 Fruiting (Legend of Mana's orchard).** At each dawn the tree fruits:
- one fruit per **fruiting body** open (4.3);
- each fruit is a material of the sap's colour, **leaned toward the game day's feeling**: wonder, mirth, desire, grief, dread, then a
  **fair day** (the sap unleaned) and a **prismatic day** (one fruit at full saturation). That is Legend of Mana's weekdays, on our
  calendar (`clockAt().weekday`; a game day is a real hour, so the week turns in seven real hours).
- Each fruit drinks a little sap (12%), so old meals fade and the colour stays steerable.
- **Checked:** for each of the seven attributes, a fresh tree fed at most twelve things you can hold bears fair-day fruit within 0.12
  of that attribute's tile.

**4.3 Growing: girth, ten bodies, twenty-two branches** (the Kabbalists' tree: ten sephiroth, twenty-two paths; the Golden Dawn put the
twenty-two Major Arcana on those paths, and the Veritome holds twenty-two).
- **Girth** grows a step each time its meals double (64, 192, 448, 960, 1984 cubes of worth).
- **Each step opens a fruiting body**, ten at most. The bodies bear higher tiers as they open (two each of tier 0 to 4).
- **The twenty-two branches** between the bodies open when you hang a Major Arcana card on each, from the Book. **A collection grows
  the tree**: Stardew's bundles, where completion is a door.
- **Each branch hung adds one thing:** a fruit a dawn, a strain's seed, a sharper sap (less lean), or a sporeling's visit (5). The
  twenty-two are listed with Espada (who knows the Golden Dawn's correspondences) and Petra (who hangs them).

**4.4 Three layers, as every world tree has** (the research's section 4: a guardian at the root, a messenger on the trunk, a bird in
the crown):
- **the roots**, where you feed it;
- **the trunk**, where the mycelium's threads run out to every spore bed (the hidden network, drawn when the hand digs: the folk
  believe the tree hears every bed);
- **the crown**, where the fruit hangs and the sporelings perch.

## 5. The spirits (monster raising, taken further)

The spirits are already caught, bound, fed, drilled, raced, sparred and merged (SPIRIT-GARDEN.md section 2). The genre adds:
- **They tend the spore beds** (Rune Factory's helpers):
  - a spirit set to a bed works it a quarter faster;
  - its **grain** bends the work: an orderly spirit's prints run truer, a curious one's grafts may try the pair the other way round.
- **They take the colour of what they eat** (the Chao Garden: stat = what was done). Fed the tree's fruit, a spirit's body drifts
  toward the fruit's colour (Calissa's look), and its strongest stat follows the colour's feeling.
- **Likes and dislikes** (Monster Rancher, Rune Factory's gifts): each kind of spirit likes one feeling's fruit and dislikes its
  overcoming one, shown only by its body (a world mark, no numbers).
- **Sporelings** (Legend of Mana's eggs): the tree's crown now and then holds a sporeling, a fungal spirit that hops down and settles
  as a visitor does (`SETTLE`). They are Figments the garden made: strays of your own (the owner's ruling on creatures).
- **Letting go, as a gift** (Spiritfarer's Everdoor): a released spirit may be fired at the Chimney into a **keepsake pot** that
  stands in the garden for good, holding its colour and a line of its song (Wanda). "Bound until released" stays literal: release is
  yours, and it leaves something behind.

## 6. The slice of life

- **The garden's clock:**
  - the tree fruits at dawn;
  - the spore beds glow at night: the foxfire, bioluminescence, in their strain's colour;
  - the moonflower opens at night (kept).
- **Nothing is a chore:** a bed's yield and the tree's fruit wait (a cap of what one game day would give), never spoil.
- **The tree keeps a diary** (Legend of Mana's Lil' Cactus): the log says, once a game day you visit, what it ate and how its colour
  moved. Espada's lines. It is not one of the folk, so it never speaks in the dialogue box.

## 7. What it teaches without saying so (the design law)

- **Decomposition and the cycle of matter:** rot feeds the press.
- **Colour mixing as a centre of gravity:** the graft, the sap.
- **The spore print as a real identification technique.**
- **The five phases' generating and overcoming cycles:** the neighbours.
- **The Tree of Life and its tarot:** the branches.
- **Patience:** the dawn.

## 8. The modules, and who builds what

| module | what | owner | status |
|---|---|---|---|
| `src/progress/mycelium.js` | colour signatures, strains, `digest`, `graftOf`, `bedHours`, the tree's sap, girth, bodies and fruit | Dovina | **built, checked** |
| `scripts/mycelium.mjs` | 14 checks (rot's share, the print's exactness, the graft's chart and its mint, the neighbours, the sap's reach of every tile, the colour road) | Dovina | **built, passes** |
| `src/progress/garden.js` (beds) | a bed may hold a strain; `inoculate(i, strain)`, `set(i, things)`, the yield waiting; a tended bed's pace | Dovina | next |
| the World Mushroom's state | the sap, girth, the bodies open and the branches hung, in the save (the garden's section) | Dovina | next |
| ledger and achievements | prints made, grafts by tier, the chart's pairs found, the tree's girth, every branch hung, a true firing from a print | Dovina | next |
| `src/world/garden/` | the spore bed as a placeable feature, the hand's set and take verbs, the World Mushroom's planetoid, its feeding at the roots and fruit in the crown | Petra | next round |
| the looks | the strains' caps and rings and night glow; the World Mushroom (the billboarded leaf-quad canopy as gills, labradorite and gold, its sap's colour); sporelings; keepsake pots | Calissa | next round |
| the sound | a bed working, the dawn's fruiting, the tree's sap as a drone in its colour's mode, a keepsake pot's song | Wanda | next round |
| the words | the strains' names, the World Mushroom's name, the twenty-two branches, the tree's diary, the sporelings | Espada | next round |
| the Codex page | the Grimoire of Echoes: the graft pairs found, the strains, the tree's branches | Petra (page), Dovina (contents) | next round |
| the garden sweep | every verb's check (a bed set, waiting, yielding; the tree fed, fruiting; a branch hung) | Dovina | with each step |

**The build order:**
1. spore beds and print and rot (the colour road first);
2. the World Mushroom's feeding and fruit;
3. ferment, dissolve and the graft;
4. girth, bodies and branches;
5. spirits tending, taking colour, sporelings;
6. keepsake pots.

Each step lands when the one before runs clean in the garden sweep.

## 9. The owner's rulings (2026-10-08)

- **Myggdrasil has its own planetoid**, the largest in the garden (radius 26 m against the others' 8 to 20), given, not bought, at the
  second Firing (Sinter), and **its model is BIG** (the owner): 48 m tall, a landmark seen from every planetoid (`ECON.myggdrasil`).
- **The keepsake pots stay:** a spirit let go is fired into one (`src/progress/keepsakes.js`).
- **The strains grounded in real fungi** ("I love the strain functions being grounded in reality"); Myggdrasil's name approved ("so
  cute").
- **Fungi change both:** rot and print change what a thing is; ferment and dissolve its colour (my default, unchallenged).

## 10. Built this round (Dovina's side)

- **The services:**
  - `src/progress/sporebeds.js` (`game.sporeBeds`): grant, inoculate, set, back, near, tend, ready, harvest;
  - `src/progress/myggdrasil.js` (`game.myggdrasil`): feed, dawn, pick, hang;
  - `src/progress/keepsakes.js` (`game.keepsakes`): a pot on every release.
  - Each keeps its own save section.
- **Their events, log lines and ledger counts:** `feedback/tracking/garden.js`, the lines placeholders for Espada's.
- **Achievements:** eight new, in the Spirit Garden's new sub "The Mycelium" and in "The Spirits"; two give titles, Mycologist and
  Hierophant of Spores.
- **The chat line, for testing until the world's features exist:**
  - `/spore bed | inoculate | set | back | harvest`;
  - `/tree feed | pick | hang | dawn`.
- **`node scripts/mycelium.mjs`:** the rules, plus the services played against a stand-in game (a bed's whole life, the tree's
  feeding, dawn, picking and hanging, a pot on release). All pass.
