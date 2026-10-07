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

## The Spirit Garden: the spirit press and the soul colour (R58)

- **The press grew** (the owner's concept, `docs/ref/concept_spirit_press.png`, a value study we coloured): a garden shrine of moss,
  deep teal leaf and plum-dark root over a carved stone drum, dull bronze at its rims, lights about it. The soul colour is the only
  bright thing on it, shown three ways and never written: the **bath** (the pool), the bead in the hourglass and the eye's lens, and
  the **hue ring** (seven lights, the one you are inside drawn close and lit).
- **The soul colour is the vessel's Lachryma** (the skin's glow): grey gives none, so a new Courier looks exactly as the maker made them,
  and it comes in as the soul saturates, on any skin worn. Alchemy is dress-up as well as growth.

## Weather and the hour (R58)

- **A weather wears its damage type** (section 2): mirth bone and gold (a sunshower, a rainbow), wonder lapis and the hexagon (diamond
  dust and the 22-degree halo by day, the aurora by night), desire rose and warm gold (the wanting wind's sand streaks, an amber haze),
  grief the labradorite's silver (the long rain, the sky drained), dread ink and violet-green (the pall, far bolts). A weather and the
  status it feeds read as kin.
- **What falls is in the world**: streaks and motes on world-anchored paths wrapped round the eye, each at a constant speed, so nothing
  swims or flickers; no heat shimmer, no screen flash. Thunder is a bolt a long way off and a slow glow in the cloud.
- **Three paintings make the day**: the maker's dusk (untouched at its hour), the owner's day (clouds and floating soap bubbles) and
  night (violet and green swirls over a dark crown, held a little below its full cry), blended by the hour; dawn is the dusk turned
  rose. The cloud layer thins under the day's and the night's own painted clouds and takes the weather's cover.
- **The maw wipe**: the way into a Well is covered by the Dunemaw's pool itself, drawn in the frame (inside the 480 lines, over the world,
  under the HUD), never a loading screen with words.

## The shore (R58)

- **Crude is not water**: the shore has no white foam. The crude comes up the sand and draws back on two slow waves along the shore,
  its oil film bright in a thin band at the lip, and leaves the sand dark and glossy behind it. The sea from the sand is the same crude
  the ships sail, quieter near land, and the island's weather stops at the waterline (the Emocean has no mood).

## Liquid: water and Lachryma (the owner, R58)

Water and Lachryma are among the most important things the game draws. Every liquid is drawn with one library (`src/vfx/liquid.js`)
and one texture: the owner's noise photographs (`source_assets/liquid/`), baked tileable by `scripts/bake_liquid.py` into the four
channels of `src/assets/liquid_pack.webp` (R marbling, G bubbles, B sand ripples, A the marbling's veins); and a second pack from the
owner's noise gradients (`source_assets/vfx/Noise_Gradients/`, tileable already), `liquid_pack2.webp`: R and G caustic nets
(T_Random_53, 48), B wind-streaked ripples (45, the water's fine chop), A soft glowing cells (23, light pooled inside Lachryma). Drop a
new photograph in the folder, name it for its channel, and run the script. Of the other gradients, 66 (a cel web, Wind Waker's foam)
and 19, 22, 44 (cells) are kept in reserve.

- **Water paints its own floor**: sand ripples where the eye meets the bottom, lit by caustics, seen through the water by the depth
  the eye looks through (shallows clear and sandy, deeps teal to marine); the painted sky by Fresnel, short of a mirror; a tight sun
  highlight and glints (sparkle is welcome on liquid); the crest glow toward the sun; foam made of bubbles at the shore. The far water
  calms. (`src/vfx/water.js`)
- **Lachryma liquid is ink with the oil film in its cells and veins**: slow, glossy, the film's colours where the marbling's veins run
  and at the grazing angle, an iridescent meniscus. The crude sea (`src/vfx/crudesea.js`) takes the same cells and veins close up, and
  its current's bands far off.

What was taken, and from where (researched for the owner's ask; sources as found):
- Super Mario Sunshine: two wave textures scrolled at different rates, bubbling where they cross; the water changing with distance (its
  mip levels held different pictures). https://blog.mecheye.net/2018/03/deconstructing-the-water-effect-in-super-mario-sunshine/
- Valve, "Water Flow in Portal 2" (Vlachos, SIGGRAPH 2010): crossing normal layers; flow maps for rivers and ooze (next: the Dunemaw's
  pool, the crude's currents). https://cdn.akamai.steamstatic.com/apps/valve/2010/siggraph2010_vlachos_waterflow.pdf
- Sea of Thieves (SIGGRAPH 2018 talk): the sub-surface colour at a wave's peak toward the sun; foam where the water meets things, masked
  by painted foam textures. https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf
- Roystan's toon water: depth colour, foam from a threshold that falls toward the shore. https://roystan.net/articles/toon-water/
- Alan Zucconi on caustics (two samples of one texture at different scales and speeds). https://www.alanzucconi.com/2019/09/13/believable-caustics-reflections/
- GPU Gems 1, ch. 1 (Finch): summed waves in world space. https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
- Subnautica: absorption broken on purpose for colour (water as a photographer sees it).
  https://www.gamedeveloper.com/design/how-i-subnautica-i-plunges-deeper-into-rendering-realistic-water
- Wind Waker, Final Fantasy X, RiME: a chosen palette and a painted sky over simulation.
Not taken (yet): screen-space refraction (a copy of the scene: fair at 480 lines, a later step), planar reflections (a second render).

## The data showing through, and the owner's ear (the owner, 2026-10-06)

The owner's playlist (`docs/OST.md` §6, Wanda's reading) asked for the look's *structure* more than a palette: the soft verse that drops
into a wall, silence used as a hit, sad words over a groove, alchemy and water everywhere. And then, of the glitch I had held back: "I
fucking love dot hack… why not lean into it?" So it leans in, at the moments that earn it, and nowhere else.

- **The glitch** (`src/vfx/glitch.js`): one screen pass on the light-linear frame, before the glow (so the bloom tears with it). Chromatic
  split, slice tear, datamosh (blocks of the frame before, dragged), crush (cyan and magenta in broken lines of signal), the data drain
  (blocks pulled to a point), the drop-out (a dark beat). It stutters at 6 to 10 steps a second, never glides. It is always an event's
  pulse with an end: the FOE showing itself (the cut, then the slam), an ultimate, a shattering, a mind rewritten, a hard slam. Never
  ambient; under the WCAG flash line; `visual.glitch` turns it off. Prior art: .hack's Data Drain and Lost Ground, MGS2's colonel
  breaking down, Rez, the datamosh videos (Takeshi Murata's Monster Movie).
- **The data drain** (`src/vfx/datadrain.js`): a reprogrammed creature broken into polygons streaming down a beam into the bracelet's
  petals at the Courier's hand: the Orca moment. Solid, unlit colours, so it reads on white sand as in a dark Well.
- **The frame accumulation, used more** (`post.accum`): the flythrough of a Dunemaw floor (`src/cine/flythrough.js`), the trailer's
  dive. A smear is a speed, a dream or a death; it lets go as the camera lands.
- **The Great Dunemaw** (`docs/plans/DUNEMAW.md`): a mind full of sand. The spout pours up out of the mouth and falls back round it (the
  landmark, seen from the oasis); down below, the verse into the wall: the floors' colours at a third on floor 1 and at full cry on the
  last, a light climbing the terraces like an equalizer, slammed to full when the FOE shows itself; sand with the Lachryma in its
  troughs; sandfalls as the shifting doors.
- **The playlist, literally**: DATURA (sacred datura at the oasis, furled by day, open at dusk: `src/vfx/datura.js`); AQUA REGIA (the
  spirit press's bath fuming gold when something gilded goes in); the clean tapped guitar (the filigree's arpeggio: a band of light up
  the armour's lines per Crucibelle note); a peach golden hour and a plum night in the hour's grade.
- **Where it stops**: no glitch as decoration, no chromatic aberration at rest, no ambient datamosh. The PS2's frame and the console's
  480 lines stay the canvas; the seventh generation is reached for in what is drawn on it, never in what it costs (the owner: "We're
  6th-7th generation, I'm just a performance hardass").

## The Courier's face (the owner, 2026-10-06)

The first try at the mask as an E-ink face (eight faces painted from the maker's eyes, a refresh, a blink, pupils) was rolled back
(reverted at `d4872d0`). What the owner said, for the next try:
- **The pupils were too small**: a 15 px dot in a 116 px eye on the 512 px mask. Next time, go much bigger.
- **Sleepy read well.**
- **The rim round the eyes was wrong.** The bake kept a mid-brown shadow outline round each changed shape, and on a lidded or cut eye
  it showed as the ghost of the full eye.
- **The owner will make the atlas** for Calissa to puppeteer. The runtime (the shader swap after `map_fragment`, the stepped blink and
  look, the event map) can come back from the reverted commit to drive the owner's cells.

## The night sky (the owner, R46: "evaluate using a shader to make the night sky feel more alive")

**The evaluation.** The night is the owner's painting (violet and green swirls over a dark crown) under a moon. What would make it
alive, and what each costs at 480 lines:

| what | why it reads as alive | cost | verdict |
|---|---|---|---|
| **twinkle** | starlight scintillates, more near the horizon (more air) | a few ALU a sky pixel, in the dome's own shader | **built**, slow (0.13 to 0.35 Hz) and only on our own stars, never a field flicker |
| **the wheel** | the stars turn about a tilted pole: the sky is a clock | one rotation a pixel | **built**, one turn a game day (too slow to see except over a stay) |
| **meteors** | a rare event the sky gives you | one segment test a pixel while one falls | **built**, one every 25 to 70 real seconds of night, 0.6 s each |
| **a milky band** | the galaxy's bright river | a noise band | **not built**: the painting's swirls already are the galaxy, and a second one would fight them |
| **the aurora** | the owner's ask at the Shore | a curtain in the same shader | **built**, at the Shore only, low over the sea |

All of it is in the dome's fragment shader (`vfx/sky.js` NIGHT_GLSL, driven by `vfx/nightsky.js`): **no draw call and no new program**
(the dome's own). The stars are our own, each at least a pixel and a half across (sized by the field's own `fwidth`), so the turning field
never crawls (CLAUDE.md, aliasing). Prior art: Ōkami's and Outer Wilds' turning skies, Breath of the Wild's shooting stars, and the aurora
as seen from a northern shore.

## Skirts where a model meets the ground (the owner, R46; shared with Petra)

"Meshes that interact with the ground need mesh skirts to blend textures between materials." From now on a model that stands on the
ground declares its **foot** (the height of its base, and how far up the blend runs), and the shared ground blend (`render/triplanar.js`,
Petra's: `triplanar(material, { side, strength: 0, foot: { tex, height } })` for a foot alone) fades its material into the ground's by
height, so no hard line shows where it stands. Done: the Index's lectern (0.16 m of the floor's clay up its plinth). The level's geometry is
Petra's; the models are Calissa's. Mine to skirt once the blend lands: the Index's lectern's foot (`vfx/testroomkit.js`), the cave kit's
pillars and stalactite bases (`vfx/cavekit.js`), the half-buried finds (`vfx/finds.js`), the clutches (`vfx/cavekit.js` Clutch), the
datura's stems (`vfx/datura.js`), the solar rings' plinth and the slip geysers' vents (`vfx/solarring.js`, `vfx/slipgeyser.js`), the
Dunemaw's crown chimneys (`vfx/dunemaw.js` PrinceCrown). Not Strawman: its ball foot rocks, and a skirt would rock with it.

## The crossing (the owner, 2026-10-07: "a love letter to the genre... placeholders, but feeling polished to a mirror shine")

One rule for all of the rail shooter's art: **the sea is ink, and everything you can shoot carries the one warm or pale thing on it**. Nothing on the crude is lit
from within except what matters: the sloop's Lachryma (its polarity), the Conductor's glow, the False Light's lure and her open ports' matches, Old Nobody's
open gills and throat. The parryable things wear only the Lachryma outline (`vfx/parrymark.js`).
- **The shoal** (`vfx/shoal.js`): glints are slivers of ink seen from above. The silver turn rolls them on their side so the flank faces the sky. A sardine
  run's flicker as a motion, never a light.
- **The False Light** (`vfx/brig.js`): a tarred brig whose one friendly light, a lantern at her bowsprit, is the lie the Wreckers are named for. Lids red
  inside, as a man-of-war's were, so a port opening reads a bar ahead.
- **Old Nobody** (`vfx/leviathan.js`): crude standing up (the oil film's colours on black glass). Crusted with Lachryma in every feeling's colour, fed by
  everyone. A blank face with one milky blind eye: Nobody, and the Cyclops whom Nobody blinded.

## The Great Slip Jelly's bowl and the catch (the full build, Round 1, 2026-10-07)

The bowl is read from the ground up. **The stone is ammunition** (seams that glow, then a felled log, then rubble: the room is spent as
it is fought). **The sand says which way it is going**: streaks combed toward the pool the FOE is in, still at rest and streaming as it
slides. **The slip says where it will rise**: thin ripples and a glow from under, never a painted ring. **The body is the telegraph**: the urn crown's broken
edge and cracks brighten through the ram's scrape. The brood wear their eggshell caps.

The catch is one look for both ways of catching, because both are a mouth drinking a mind. Two strands of Lachryma twist from the mouth to
the Figment, and a vortex turns over the mouth. The Figment strains in jerks, then is drawn in down the tether, or snaps it (Luigi's
Mansion's tug, Pokemon's ball).

## 6. The placeholder audit (what to replace first)

Verdicts: **OURS** (the owner's own, or made for this game and carrying its identity), **PLACEHOLDER** (stands in for art that should
be made), **GENRE DEFAULT** (works, but is the look every game has; ours to replace with an idea of our own).

| What | Where | Verdict | Note |
| --- | --- | --- | --- |
| The Lantern Wisp | `src/assets/lantern_wisp.glb` | OURS | The owner's: the baseline creature rig and its 18 clips (moods, emotes, floats); one 256 atlas, 1692 triangles. Its flame carries a feeling's strength. |
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
