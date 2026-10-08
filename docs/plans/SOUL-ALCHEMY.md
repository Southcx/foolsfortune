# Soul Alchemy at the Athanor: the system spec (the owner, 2026-10-08)

Kept by Dovina; the UX is Calissa's (section 4, hers to amend); Petra builds it. Numbers are in `src/progress/alchemy.js` and
`ECON.alchemy`; the new ones below are marked **(new)** and land in my files before Petra starts. Units: real seconds, cubes, the
wheel's distance (0 .. 1: the grey centre to the rim).

> "Soul alchemy is about Color theory, color matching, navigating around the color wheel. It indirectly trains the artist's eye."
> "High skill skips grind, but long grind closes the gap in skill."

## 1. Why it is the next round

Built already: the seven attributes, the soul colour, pressing (`press`), the targets that narrow with each rank, firing for cubes, the
ledger's counts and Calissa's spirit press model (`vfx/spiritpress.js`). **Missing: a press in the game.** Nothing presses or fires,
so no attribute ever ranks, so the Firings (read from the ranks' sum) never pass the first, so half the garden stays locked (the
features of the second Firing and up, the bought planetoids, the Heavenly Kiln). And six of the seven attributes' widenings are read by
nothing. Soul Alchemy is the garden's keystone and the vessel's whole growth.

## 2. The loop, at three scales

- **The moment (a minute at the press):** choose materials and their order, watch the colour walk each one's path across the wheel,
  stop inside an attribute's swatch, fire. The closer to the swatch's heart, the cheaper and the prouder the firing.
- **The session:** gather what the press eats: materials from every livelihood (the Wells' finds, angling, crystals, the beds,
  a spirit's work, the Wreckers' cargo), and **seasoning** (below) from simply doing each attribute's thing.
- **The long run:** ten ranks an attribute, seventy in all; the Firings they open (7, 14, 24, 36, 50, then every 20); each rank widens
  the vessel (section 6). The press is the long sink for cubes.

## 3. The rules

### 3.1 Pressing (built; one change)
The hopper takes up to five materials from the Pneuka Box, in order; each walks the colour along its own path (`materials.js`). They
are used up. **(new) The complement greys:** a material whose hue is within 30° of the colour's opposite also pulls the saturation
toward the grey centre, by `ECON.alchemy.complement` (0.5 of its own saturation step). This is the painter's rule (mixing complements
makes grey), and it gives the player a brake: the way back to the centre is the opposite colour, not a reset.

### 3.2 Seasoning: the grind that closes the gap (new)
Each attribute has **seasoning**, 0 .. 100, filled by doing that attribute's thing anywhere in the game (the table in section 6), at
most `ECON.alchemy.seasonPerHour` (10) a game hour from any one source, so it is earned by playing and never by idling. Seasoning
**widens that attribute's swatch**: radius x (1 + 1.5 x seasoning / 100), so a full one is two and a half times as easy to land in.
Firing an attribute spends its seasoning. The grinder's way: play, fill, and fire into a big swatch. The skilled way: fire into the
bare swatch, season or not.

### 3.3 Firing: the skill that skips the grind (one change)
Fired with the colour inside a swatch, the attribute rises a rank, as built. **(new) The cost follows the aim:** fuel x (0.5 + 0.5 x
d / r), d the colour's distance from the swatch's heart and r its radius now, so a dead-centre firing costs half. **(new) A true
firing** (within a quarter of the radius) is said in the log and counted (`alchemy.true`); achievements read it. Fired outside every
swatch: refused, as built, with the why in the log.

### 3.4 The draught tints the bath (new, small)
While you are brimming (`game.courierMind.brimming`), each material pressed takes one extra step of 0.02 toward your draught's hue
(each feeling's hue in `ECON.alchemy.feelingHue`: wonder 200, mirth 50, desire 10, grief 230, dread 280). Drinking Lachryma before
pressing becomes a choice: a nudge for the one who knows where they are going, a drift for the one who does not.

### 3.5 Where it stands
At **the Athanor** (the garden's furnace planetoid), the press as a fixed feature in the middle of its plots. Entered as the Pneuka
Jar, used with the god hand. **(new) The press's own plot formation:** the press counts its planetoid's features and ground in the
Wu Xing formation (`formation()`), and the swatch radius is x formation (0.5 .. 2): lay out a fire-generating Athanor (wood-moss
ground, wonder features beside it) and the press is kinder. The garden's layout and the vessel's growth become one puzzle.

## 4. The UX (Calissa's to amend; my draft)

**One look:** a potter's colour, not a spreadsheet. **No numbers on the wheel:** no degrees, no percentages, no radius in metres. The
eye must do the reading, which is the whole lesson.

- **The wheel is the bath** (the spirit press's pool): seen from above in the overhead view, its rim the hue ring, its grey centre
  the drum. The **seven swatches** sit on it as glazed tiles at their hues, each sized by its radius now (seasoning visibly swells
  it: the tile's glaze pools wider).
- **The soul colour** is a drop of glaze floating in the bath, in its own colour. Before a press, the materials in the hopper draw
  their **paths as faint trails** ahead of the drop (Potion Craft's preview): what you will do is shown, not told.
- **Pressing:** the hand drops a material into the crown's spiral mouth; the drop walks its path over about a second a material; a
  complement visibly greys the drop as it slides toward the centre.
- **Firing:** the lever with its ball. A true firing: the hue ring's light for that attribute comes close and burns, the glaze sets,
  the soul glow brightens on the Courier when you leave. Refused: the ball does not drop, the log says why.
- **Readability for every eye:** each swatch has a shape as well as a colour (seven glyphs, Calissa's), so a colour-blind player
  navigates by shape and position; the hues are spaced 51° apart, never close enough to need fine colour vision to tell apart.
- **The log says** each firing and each refusal in words (Espada's, 2026-10-08): "You press {material} into the bath." / "The colour
  greys." / "True firing. {Attribute}: rank {n}. Half the fuel." / "The press does not fire: the colour is outside every swatch." /
  "The press does not fire: it needs {n} cubes." Nothing else on the screen.
- **The sound is the same geometry (Wanda, 2026-10-08):** each 30° of hue is a fifth, so a material's path is a melody of fifths; a
  complement is the tritone (180°, six fifths), and greying is that tritone resolving into the drone: the painter's rule and the
  musician's are one move. Saturation is how far the note rises from the drone; a swatch beats against the drop until it is still at
  the heart; a true firing plays the Answer. The press emits `alchemy.step { hue, sat, by }` at each step of a path and
  `alchemy.fire { attribute, rank, true, d, by }`; Wanda builds the sound in `src/audio/`.

## 5. Teaching without saying (the owner's commandment)

What the player learns, never told: **hue as an angle; saturation as distance from grey; complements cancel to grey; analogous
colours are neighbours; a colour is reached by a path, not a jump.** The swatches carry no names on the wheel, only their colour and
glyph, so in a week of play the eye learns to see "a little too warm, a little too grey" and steer for it. That is the artist's eye.

## 6. The seven attributes: what they widen, how they season (each widening now read by something)

| attribute | widens (at rank 10) | read by (Petra wires) | seasoned by doing | what doing it trains |
|---|---|---|---|---|
| Willpower | the shield's pool x1.5 | `courier/lachryma.js` max | a blow taken on the shield; brimming and settling | composure under pressure |
| Focus | statuses you build hold x1.3 | `creatures.apply` hold | a status built on a creature; a rhythm combo of 25 | sustained attention |
| Charisma | what the folk pay and ask x1.15 | shops (built) | a talk, a sale, a busking tip | reading people |
| Perception | a creature's windup shows x1.5 sooner | `creatures.windup` lead | a parry in its window; a plate appraised 3 stars or more | anticipation |
| Dexterity | draw and stow x1.3 faster | `tools/belt.js` | a tool swapped mid-fight; a Throwing Room drill finished | hand speed |
| Visualization | the Soul Brush's and the hand's canvas x1.4 | Celestial mode, the garden's brush size | a sigil drawn clean; a terraforming stroke | holding a shape in mind |
| Resilience | the clay mends x1.5 faster; +2 hits a ship bears | `courier/vessel/`, the rail | a crack mended at the kiln; a crossing survived | recovering, persisting |

## 7. Synergies (what it ties together)

- **Every livelihood feeds it:** materials are the press's food; a Well run, a fish, a crystal, a bed's harvest each mean a step on the
  wheel. (The economy: materials have a press value, not only a cube value: ECONOMY.md gets the line.)
- **The garden:** the Athanor's layout sets the press's kindness (3.5); the ranks open the Firings, the Firings open the garden.
- **Lachryma and mood:** the draught tints the bath (3.4); the mental state's keeper is now built (`courier/mind.js`).
- **The spirits:** a spirit of a feeling at work on the Athanor gives that feeling's materials one extra step (`workBonus`, as the
  beds and slots).
- **The look:** the soul glow (the vessel lit in the soul colour) shows where you stand on the wheel to anyone who sees you; a
  glaze matched to your soul colour is said by the folk (Espada).
- **Achievements and Arts:** true firings, a rank in all seven, the first Firing each opens (section 3 of TRAINING.md).

## 7a. What it means (the owner, 2026-10-08)

> "Enemy drops are like remnants of an 'experience' and much like in real life we take in 'experiences' and process them mentally,
> which then changes our personality over time."

So the press is **processing**. A material is an experience kept; pressing is thinking it through, in an order (the same experiences
in another order make another person); the soul colour is who you are becoming; a firing is a trait settling. It holds together:
an experience at odds with where you stand (the complement) brings you back toward grey, the calm centre; brimming tints what you
take in with your mood (3.4); seasoning is practice. **Proposed, to make the drop remember its experience:** a material's hue leans
toward the feeling of the moment it was won (the weather where it fell, or the creature's own feeling), by `ECON.alchemy.memory`
(proposed 0.3 of the way from its kind's hue): a drop won in a storm of grief pulls toward grief. Weather, fights and the soul colour
become one line. Owner to rule.

## 8. Acceptance (each a check in the garden sweep, section 14)

1. At the Athanor the press stands; the hand drops a material in and the drop walks its path; the material leaves the Pneuka Box.
2. A complement greys the colour.
3. Fired inside a swatch, the attribute ranks, cubes are spent at the aimed price, the log says it; outside, refused with why.
4. Seasoning from playing (a parry, a crack mended...) widens the matching swatch, and firing spends it.
5. Seven ranks summed past 7 pass the second Firing; the garden's second-Firing features appear on the PLACE page.
6. Each attribute's widening changes what it names (the shield's pool, a windup's lead, draw time...), measured.
7. No number on the wheel; every swatch has a glyph.

## Asked of the sisters
- **Calissa:** section 4 (the UX) is a draft for you to rewrite, and the seven glyphs.
- **Espada:** answered (section 4's lines); the folk noticing the soul glow read `game.alchemy.colour` (`s`, 0 .. 1, is the glow's strength; `h` its hue).
- **Wanda:** answered (section 4: the sound); builds it on `alchemy.step` and `alchemy.fire`.
- **Petra:** sections 3 and 6 to build, 8 to pass.
