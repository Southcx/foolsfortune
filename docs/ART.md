# The art bible (Calissa's, for the owner)

Fool's Fortune's art **teaches**: an ornate box around things that are true. Real glazes fired the way they are really fired, real
stones with their real optics, colour used the way the research says it works. Cohesion and coherence are the walls of the cup;
inside them, push. This file is the reasoning behind every look, and (at the end) the audit of what is ours, what is placeholder,
and what is a genre default, so the owner's own art goes where it pays most.

Companions: `docs/LOOK.md` (the precepts and the motion rules), `docs/VFX.md` (how effects are built and directed), `docs/GLOSSARY.md`.

## 1. What a colour means: three layers

1. **Feeling is carried by lightness, saturation and warmth**, not by hue. This is the research-solid layer, and it holds across
   cultures: bright and saturated reads as energetic and arousing, dark and desaturated as heavy and calm (Valdez & Mehrabian, 1994;
   the 30-nation study of Jonauskaite et al., 2020, which also found yellow-joy and red-anger/love among the few hue links that hold
   widely). So: a calm room is low in saturation, a fight's marks are bright, a death drains toward grey.
2. **Hue carries meaning the world teaches**, and then keeps. Envy-as-green and sadness-as-blue are largely English idioms, not
   perception, so we do not lean on them; we make our own meanings and never break them:
   - **labradorite** (the black iridescent flash): the **Mind**, mental energy and focus (the reticles, the wireframes, the ring's frame);
   - **gold and violet**: **Lachryma** (its glow, its tears, the Lockheart's opening);
   - **warm clay** (terracotta, bisque, ochre): the **made world**, the folk, the pots;
   - the **damage types** (below) each own one colour and one motif.
3. **Real materials carry authenticity.** A glaze appears as it really fires; a gem behaves as that gem does. The look is the lesson.

Never rely on hue alone: every distinction that matters also differs in **shape and lightness** (the damage looks, the attunement
sigils), so it reads without colour vision and in the 480-line image.

### Sound and colour agree (with Wanda)

The crossmodal correspondences are real and well measured (Spence, 2011): high pitch goes with light, small and bright; low pitch
with dark, big and heavy; rounded sounds with rounded shapes (the bouba/kiki effect). So a bright, small effect gets a high, short
sound, a heavy dark one a low, long one; the lawful damage types sound clean and short, the chaotic ones smeared and bent.

## 2. The damage types (plan B5; `damage.<type>` in the library)

| Type | Line | Colour | Motif | Why |
| --- | --- | --- | --- | --- |
| Impact | lawful, physical | bone and gold | crystal facets thrown straight, a square flash, a hard ring | fired clay struck: the dry crack |
| Ego | lawful, mental | lapis | a hexagonal lattice that opens and holds still | a mind made rigid, geometry |
| Influence | neutral, social | rose and warm gold | slow ripples, drifting petals | what spreads from one to many |
| Illusion | chaotic, perceptual | the labradorite's flash | curls that turn, glints that never hold | perception slipping |
| Delirium | chaotic, entropic | ink and violet-green | smoke rising, drips falling, bubbles | things coming apart |

The status each type builds wears the same colour and motif (`aura.<status>`): **doubt** a lapis hex lattice standing round the
head, **charm** rose ripples and petals, **blind** a band of labradorite glints turning across the face, **confusion** violet-green
bubbles wandering and drips falling.

Lawful is straight, crystalline, still; chaotic is curling, fluid, iridescent, never at rest.

## 3. Lachryma, in its three states

- **Liquid** (the baubles, slip): near-black with the oil-film sheen, cream-glowing when fresh, oxidising smoothly to black.
- **Solid** (the cubes, the crystal formations): **bismuth**. Stepped hopper crystals (edges grow faster than faces, so each face is a
  stair of square terraces), dark metal coloured face by face by an oxide film (gold, magenta, blue, green): `vfx/bismuth.js`.
- **Mental** (the Mind's marks): labradorite.

## 4. Shape language

- **Sacred geometry is grammar**, not ornament: circles of power are drawn (the owner's wife's two circles: `circle_lotus`,
  `circle_swirl`), layered at sizes, turning against each other. Hexagons and lattices are the lawful mind; spirals the chaotic.
- **The folk and the world are thrown and fired**: thrown pots (lathe forms), slips, glazes, kiln marks; nothing machined unless it
  is meant to be (the Psygun, the mill).
- **The Courier's tools are instruments**: each has a silhouette you can read at a glance and a stance of its own.

## 5. The glaze catalogue (`src/courier/vessel/glazes.js`)

| Glaze | What it is, really | Got |
| --- | --- | --- |
| Terracotta | red earthenware, unglazed | start |
| Bisque | once-fired clay, pale, waiting for its glaze | start |
| Shino | thick feldspar white, pitted, orange where thin (Japan, Momoyama) | start |
| Celadon | jade green from a little iron fired without air (Korea, China) | achievement |
| Tenmoku | iron black, rust at the rims (China, Song; Japan) | achievement |
| Raku | crackled white, pulled red-hot and smoked (Japan, 16th c.) | achievement |
| Oribe | copper green, pooled dark (Japan, Momoyama) | achievement |
| Oxblood | sang de boeuf, copper red, the hardest red (China, Qing) | achievement |
| Jun | moon blue, thick and opalescent (China, Song) | achievement |
| Nuka | rice-husk ash, milky white (Japan) | achievement |
| Copper lustre | a smoked metal film over the glaze (Persia, Spain) | achievement |
| Lachryma black | black with the oil film: the game's own | achievement |
| Hare's fur | tenmoku drawn into fine streaks (China, Song) | medal |
| Oil spot | black with silver spots (China, Song) | medal |
| Guan | the official ware, grey-green, crazed on purpose (China, Song) | medal |
| Kinrande | leaf gold over red enamel (Japan, from Ming) | medal |
| Ru | sky after rain; under a hundred pieces survive (China, Northern Song) | medal |
| Yohen tenmoku | blue stars haloed in black; three bowls in the world (China, Song) | medal |
| Natural ash | wood ash melted on the pot in the kiln | shop |
| Kaki | persimmon iron red (Japan) | shop |
| Ame | amber, glossy iron glaze (Japan) | shop |
| Cobalt | the blue of blue-and-white (Persia to China and the world) | shop |
| Majolica | opaque white tin glaze (Italy, Spain) | shop |
| Salt glaze | salt thrown into the kiln, orange-peel glass (Germany) | shop |

The rare glazes carry their **kiln patterns** (`vfx/finish.js` PATTERN), each drawn the way the real one forms: yohen's stars (iron
crystals ringed by a film that breaks the light blue), oil spot's silver blooms, hare's fur's streaks, the crackle nets of guan (two
sizes, "iron wire and gold thread"), raku and ru, and kinrande's torn gold leaf over red enamel. Each fades out as its cells shrink below
a pixel or two, so a far body never shimmers with them. Kinrande's ground is red enamel, as it really is.

The kiln also sets **gems** in the stones (ruby, sapphire, emerald, amethyst, citrine, diamond's fire, opal's play of colour,
moonstone's blue glow, onyx), and offers **hair finishes** and **skin tones** for the Lachryma (`vfx/finish.js`); porcelain's is translucent, with warm light through its thin edges.

## The slice: one being, two other states (R57)

- **The sloop is the Pneuka Jar laid on its side**: the jar's silhouette turned on a lathe for the hull (its throwing rings round the
  girth, its mouth the stern, lit with Lachryma), terracotta with kintsugi seams, the skiff's green mast and gold fittings, the lotus in
  gold on the main. The Vessoul's forms are one hand's work.
- **The crude sea is Lachryma liquid**: black, heavy, its swells real, its current a slow scroll, its film in bands, never water-blue.
- **The Great Dunemaw is Lachryma's own place**, as the island is the clay's: walls of bismuth's stair (solid), a floor of glass over the
  liquid (the labradorite moving under it), a mouth that is the Mind's stone swallowing the sand.

## The Shrine Garden: the spirit press and the soul colour (R58)

- **The press is a potter's machine**: a terracotta firebox (the kiln's own clay), a celadon crucible crazed with guan's crackle (the
  chest's glaze at its second stage), a bronze screw through oak, a copper hopper. The soul colour is shown twice and never written:
  the **bath** in the crucible and the **hue ring** round the plinth (the seven attributes at their hues, the one you are inside lit).
- **The soul colour is the vessel's Lachryma** (the skin's glow): grey gives none, so a new Courier looks exactly as the maker made them,
  and it comes in as the soul saturates, on any skin worn. Alchemy is dress-up as well as growth.

## Weather and the hour (R58)

- **A weather wears its damage type** (section 2): mirth bone and gold (a sunshower, a rainbow), wonder lapis and the hexagon (diamond
  dust and the 22-degree halo by day, the aurora by night), hunger rose and warm gold (the hungry wind's sand streaks, an amber haze),
  grief the labradorite's silver (the long rain, the sky drained), dread ink and violet-green (the pall, far bolts). A weather and the
  status it feeds read as kin.
- **What falls is in the world**: streaks and motes on world-anchored paths wrapped round the eye, each at a constant speed, so nothing
  swims or flickers; no heat shimmer, no screen flash. Thunder is a bolt a long way off and a slow glow in the cloud.
- **The painting is dusk.** The other hours are graded from it (day cooled and lifted with a day sky over the maroon zenith, dawn rose,
  night dark and cool with brighter stars); the clouds take the hour and the weather's cover. A night painting from the maker would
  replace the graded night (asked, via Dovina's digest).

## 6. The placeholder audit (what to replace first)

Verdicts: **OURS** (the owner's own, or made for this game and carrying its identity), **PLACEHOLDER** (stands in for art that should
be made), **GENRE DEFAULT** (works, but is the look every game has; ours to replace with an idea of our own).

| What | Where | Verdict | Note |
| --- | --- | --- | --- |
| The painted sky | `src/assets/sky.webp`, `vfx/sky.js` | OURS | the owner's own |
| The spell circles | `src/assets/vfx/tex/circle_*.png` | OURS | the owner's wife's |
| The Courier | `src/assets/courier.glb`, `src/assets/courier/*.png` | OURS | textured by the owner; the model is not to change |
| The maker's pixel art (cursors, UI) | `src/assets/ui/` | OURS | used at 1x, palette-swapped |
| Labradorite, filigree, damage looks, temper, bismuth, the kiln's finishes | `src/vfx/` | OURS | made for this game |
| The HUD ring, the compass, the vane | `vfx/hudring.js`, `wirecompass.js`, `vanehud.js` | OURS | diegetic, wordless |
| The clapperjars, the slip jelly, the god hand, the Pneuka Jar, the Psygun | `src/assets/*.glb` | OURS (origin to confirm) | GLB models; the owner to confirm which are theirs |
| **The five psychic tools** (Veritome, Dreamvane, Crucibelle, Sondelass, Soul Brush) | `src/tools/*/model.js` | **PLACEHOLDER** | built from code primitives; on screen almost all the time: **the first place for the owner's models** |
| **The clay folk** (Saggar, Raku, Old Grog, Pip) | `src/npc/folk.js` | **PLACEHOLDER** | primitive bodies; the second place |
| Chests and curios | `src/world/treasure/chestmodel.js`, `curiomodel.js` | PLACEHOLDER | primitives, but well-proportioned |
| Pots, jars, the pottery | `src/world/props/pottery.js`, `breakables.js` | PLACEHOLDER (good) | lathe forms; true to thrown pots; a glaze atlas would lift them |
| Things in the Pneuka Box, the lures | `src/pneuka/thingmodels.js`, `angling/luremodels.js` | PLACEHOLDER | small primitives |
| The rooms (workshop, basement, dunes, the Weir) | `src/world/` | PLACEHOLDER (greybox) | room glazes deferred by the owner: historically accurate, restrained, via a texture atlas |
| The Lockheart's wheel | `src/tools/lockheart/wheel.js` | PLACEHOLDER | plain shapes in CSS |
| Chest tiers | `vfx/chestglaze.js` | OURS (R45) | the chest is fired as it charges: celadon, crazing, raku, kintsugi gold; the beam per rarity is gone |
| Hit stars and sparks (the plain `hit`) | `vfx/library.js` | GENRE DEFAULT (half) | the material and the damage look now speak over it; the star itself could become a kiln spark |

**First, for the owner's own art:** the five tools, then the clay folk, then chests and curios, then the rooms' glaze atlas.
