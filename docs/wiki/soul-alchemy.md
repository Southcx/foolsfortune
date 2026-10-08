# Soul Alchemy

Soul Alchemy is how you raise your seven attributes. You press materials at a furnace in the Spirit Garden. Each one pulls your soul
colour across a colour wheel. When the colour sits on an attribute's target, you fire the press and that attribute rises a rank. The
skill is steering a colour, so a good eye saves a lot of grinding. An attribute makes your clay body better at something, and the
sum of your ranks opens the garden's Firings (see [The Spirit Garden](spirit-garden.md)).

## The seven attributes

Each attribute has up to 10 ranks. At rank 10 it gives the full widening below. In between, the widening grows evenly with the rank.
Nothing here is a skill: it widens what your body or your tools can do, never your aim.

| Attribute | Target hue | Widens, at rank 10 |
| --- | --- | --- |
| **Willpower** | 20 | Shield pool x1.5 |
| **Focus** | 71 | How long statuses you build hold, x1.3 |
| **Charisma** | 123 | What the folk pay and ask, x1.15 |
| **Perception** | 174 | How far ahead a creature's attack shows, x1.5 |
| **Dexterity** | 226 | Drawing and stowing a tool, x1.3 faster |
| **Visualization** | 277 | The canvas the Soul Brush and the god hand work on, x1.4 |
| **Resilience** | 329 | Clay mends x1.5 faster, and a ship bears 2 more hits |

The seven sit a seventh of the wheel apart. Luck is separate and is not raised here.

## Your soul colour

You start grey, at the wheel's centre. Your soul colour has two parts:

* **Hue** is the angle round the wheel (0 to 360 degrees).
* **Saturation** is the distance out from grey (0 at the centre, 1 at the rim).

Each attribute's target is a spot on the wheel at its hue, at saturation 0.65. Colours on opposite sides of the wheel cancel to grey,
as paints do. That is the lesson: a hue is an angle, a complement greys, and a colour is reached by a path, not a jump.

## Materials

A material is what fights, Wells and gardens give you for the press. It comes in one of seven kinds, each living in one stretch of
the wheel, so you do not hunt for a single item.

| Kind | Hue range | Path shape |
| --- | --- | --- |
| Edges and tools | 0 to 30 | straight line |
| Mechanisms | 30 to 60 | zigzag |
| Art | 60 to 120 | arc |
| Provisions | 120 to 180 | spiral |
| Arcane relics | 190 to 240 | zigzag |
| Eldritch artefacts | 250 to 300 | spiral |
| Finery | 310 to 360 | arc |

Each material has its own hue, its own saturation and a **path** of 3 to 5 steps. Pressing it pulls your colour toward the
material's colour, a share of the way at each step. The share grows with tier.

| Tier | Total pull toward the material's colour |
| --- | --- |
| 0 (common) | 30% |
| 1 | 42% |
| 2 | 54% |
| 3 | 66% |
| 4 (rarest) | 78% |

The shape bends the walk sideways. A line runs straight, an arc leans one way, a zigzag alternates, a spiral swings both ways. A
material's saturation also leans 30% toward the strength of the weather it was won in: a storm's drop is more vivid, a fair day's
greyer.

**The order matters.** Each pull is a share of what is left. **Opposites grey themselves**: pulling toward the opposite colour runs
through the grey centre. In a test, a tier 1 opposite took a Willpower colour from saturation 0.65 to 0.10.

**The draught** adds a pull. While a draught lasts (it fades over a real minute), each material also pulls an extra 8% times the
draught's strength toward the draught's feeling. The preview shows it.

## Pressing

Use the press on the Athanor, the garden's furnace planetoid.

| Step | How |
| --- | --- |
| Open the press view | **F** near the bath's kerb (within 3.6 m) |
| Look at a material | Hover a lump on the ware ring: its ghost path draws from where your colour is |
| Load it | Pinch it (left button), carry it, let go over the spiral mouth. Up to **5** at once, in order |
| Unload it | Flick a lump circling the mouth (right button) |
| Press | Hold the left button on the mouth. One material at a time. Shift is twice as fast; a click finishes the one walking |
| Leave | **F**, **Esc** or **W A S D** |

The lumps are a view of your Pneuka Box. A material leaves the Box only when it is pressed. The ghost path and the real walk are the
same calculation, so the preview never lies.

The bath is the colour wheel, 5 m across. Hue is the bearing clockwise from north, and saturation is how far from the centre. The
seven attribute tiles lie in it. Nothing is labelled with numbers or names. The log says "You press ... into the bath." once for the
whole press. It says "The colour greys." if an opposite greyed you.

## Firing

Pressing cocks the lever. Drag the lever's ball down to fire. The press fires the attribute whose tile your colour is inside. The
attribute rises one rank, its seasoning (below) is spent, and the cubes are taken.

**What the target looks like.** A tile's radius narrows with each rank, so higher ranks need a finer aim. Radius is distance on the
wheel (0 to 1).

| Rank now | Tile radius (no seasoning) | True firing needs within |
| --- | --- | --- |
| 0 | 0.12 | 0.030 |
| 3 | about 0.093 | about 0.023 |
| 6 | about 0.067 | about 0.017 |
| 9 | 0.04 | 0.010 |

**What it costs.** Cubes, called refined Lachryma. The base cost at rank r is (4 + 2 x r) x 8 cubes, which is 32 at rank 0 and 176 at
rank 9. The cost follows your aim:

| Where the colour sits | Share of the base cost |
| --- | --- |
| Dead centre of the tile | 50% |
| Halfway to the rim | 75% |
| At the rim | 100% |

The press's **formation** then divides the cost. A hotter furnace burns fewer cubes: the divisor is between 0.5 and 2, so a dead
centre firing at the best press costs a quarter of base. At rank 0 the whole range is 8 to 64 cubes. At rank 9 it is 44 to 352. The
log names the exact cubes taken.

**True firings and yohen stars.** A firing inside a tile's heart, a quarter of the bare rank radius, is a **true firing**. The log
marks it, it is counted, and a yohen star (a small fleck) is left on the tile. A tile keeps up to 10 stars, one for each true
firing. Afterward the Pneuka Jar's mouth breathes your soul colour for a few real seconds. Seasoning never makes a firing true.

## Seasoning

Every attribute has **seasoning**, from 0 to 100. You fill it by doing that attribute's thing anywhere in the game. It widens the
tile toward a ceiling of 0.13, so the grind helps most where the skill gap is widest.

radius = rank radius + (0.13 - rank radius) x seasoning / 100

A rank 0 tile (0.12) barely grows. A rank 9 tile (0.04) grows to 0.13, over three times as wide. No tile ever reaches a neighbour's
heart or the grey centre (the nearest is 0.141 away), so a dark seam always shows between tiles. Each source gives at most 10
seasoning points per game hour (2.5 real minutes each), so it is played, never idled. A firing spends the attribute's seasoning. The
log says "Your Attribute is seasoned." once, when it fills.

| Attribute | Seasoned by (points) |
| --- | --- |
| Willpower | A blow taken on the shield (1); brimming then settling (2) |
| Focus | A status built on a creature (1); a rhythm combo of 25 or more (3); a fish caught (2) |
| Charisma | Talking to the folk (1); a sale (1); a haggle struck (2) |
| Perception | A parry that answered something (2); a photograph rated 3 stars or more (2) |
| Dexterity | A Throwing Room drill finished with no tuning (3); a Zandatsu (2) |
| Visualization | A sigil drawn (2); a terraforming stroke in the garden (1) |
| Resilience | A crack mended (2); a crossing survived (4) |

## One firing a press

You can fire only once after pressing. Press again to cock the lever. Without this, a colour sitting at a tile's heart would raise one
attribute ten ranks off a single press.

## The refusals

When the press will not fire, the lever springs back and the log says why.

| Refusal | Why | What you see |
| --- | --- | --- |
| Outside | The colour is not inside any tile | The bead crawls (beads up tight), and the nearest tile's edge glints, showing the way |
| Too few cubes | You cannot pay the price | The lantern gutters out in smoke. The log gives the price |
| Full | The attribute is at rank 10 | The lever will not move |
| Spent | Nothing pressed since the last firing | Nothing happens but a log line |

## The formation dividing fuel

The Athanor is fire's planetoid. The press's formation counts the features placed on the Athanor, the ground under the press and the
water reaching it, by the five feelings' cycles (see the formation rules in [The Spirit Garden](spirit-garden.md)). A neighbour whose
feeling generates fire adds 0.1. One that overcomes fire takes 0.1 away. The strength is held between 0.5 and 2. It divides the
cost of a firing and **never changes a tile's size**, so the map your eye learns always stays the same.

A spirit at work on the Athanor is meant to give each pull an extra step. That is not built yet.

## Where the colour can come from

The mycelium is a second road to a colour (see [The Spirit Garden](spirit-garden.md)). Print copies anything as a material of its
exact colour. Ferment and dissolve make a material more or less saturated. Rot and Myggdrasil's fruit give materials of a colour you
chose by what you fed them.

## For the divisions

* `docs/plans/SOUL-ALCHEMY.md`: the rules (section 3), Calissa's UX (section 4), the attributes' table (section 6).
* `src/progress/alchemy.js`: the attributes, seasoning, the walk, firing and its cost. Numbers in `ECON.alchemy` (`src/progress/econ/table.js`).
* `src/progress/econ/materials.js`: the kinds, a material's path, `press`, `pullStep`, `distance`.
* `src/world/garden/press.js`, `pressbath.js`: the station, the hopper, the lever, the formation. Looks: `src/vfx/alchemy/`.
* `src/progress/spirits.js`: the Firings that the rank sum opens.
