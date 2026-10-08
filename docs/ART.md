# The art bible (Calissa's)

The art **teaches**: an ornate box round things that are true (real glazes as they really fire, real stones with their real optics).
Cohesion is the cup's wall; inside it, push. Companions: `LOOK.md` (precepts, motion), `VFX.md` (how effects are built), `GLOSSARY.md`.

## 1. What a colour means

1. **Feeling rides lightness, saturation and warmth, not hue** (Valdez & Mehrabian 1994; Jonauskaite et al. 2020): calm is low
   saturation, a fight's marks are bright, a death drains to grey.
2. **Hue means what the world teaches, and keeps it:** labradorite = the **Mind** (reticles, wireframes); gold and violet = **Lachryma**;
   warm clay = the **made world**; each damage type owns one colour and one motif.
3. **Real materials carry authenticity:** a glaze as it fires, a gem as it behaves.

Every distinction that matters also differs in **shape and lightness**, so it reads without colour vision and at 480 lines. Sound
agrees with colour (Spence 2011, with Wanda): high and short for light and small, low and long for dark and heavy.

## 2. The damage types (`damage.<type>`, its status `aura.<status>` wears the same)

| type | line | colour | motif |
|---|---|---|---|
| Impact | lawful, physical | bone and gold | facets thrown straight, a square flash |
| Ego | lawful, mental | lapis | a hex lattice that opens and holds (doubt) |
| Influence | neutral, social | rose, warm gold | slow ripples, drifting petals (charm) |
| Illusion | chaotic, perceptual | labradorite | curls that turn, glints that never hold (blind) |
| Delirium | chaotic, entropic | ink, violet-green | smoke up, drips down, bubbles (confusion) |

Lawful is straight, crystalline, still; chaotic curls, flows, never rests. **A weather wears its feeling's damage type** (mirth sunshower
and rainbow, wonder diamond dust and halo, desire sand streaks and amber haze, grief long rain, dread the pall).

## 3. Materials and shapes

- **Lachryma:** liquid near-black with the oil film (fresh: cream glow, oxidising to black); solid is **bismuth** (stepped hoppers, oxide
  colours face by face: `vfx/bismuth.js`); mental is labradorite. **Crude is not water:** no white foam, never water-blue.
- **Liquids are drawn by one library** (`vfx/liquid.js`; packs baked by `scripts/bake_liquid.py` from the owner's noise photographs).
  Water paints its floor (ripples, caustics, depth colour, Fresnel short of a mirror, sparkle welcome); Lachryma is ink with the film in
  its cells and veins. Prior art: Sunshine's crossed waves, Portal 2's flow maps, Sea of Thieves' crest glow.
- **Sacred geometry is grammar:** the owner's wife's circles (`circle_lotus`, `circle_swirl`) layered and counter-turning; hexagons are the
  lawful mind, spirals the chaotic.
- **The world is thrown and fired** (lathe forms, slips, glazes, kiln marks); the tools are instruments with a silhouette and a stance.
- **The Vessoul's forms are one hand's work:** the sloop is the Pneuka Jar on its side, the garden is inside the Jar.
- **Skirts:** a model on the ground declares its foot (`render/triplanar.js` `foot: { tex, height }`), so no hard line shows where it
  stands. Left to skirt: cave pillars and stalactites, finds, clutches, datura stems, solar rings and geyser vents, the crown chimneys.

## 4. The glazes (`courier/vessel/glazes.js`; patterns `vfx/finish.js`)

Start: terracotta, bisque, shino. Achievements: celadon, tenmoku, raku, oribe, oxblood, jun, nuka, copper lustre, Lachryma black.
Medals: hare's fur, oil spot, guan, kinrande, ru, yohen tenmoku. Shop: natural ash, kaki, ame, cobalt, majolica, salt glaze. Each rare
glaze carries its kiln pattern drawn as the real one forms, fading as its cells shrink below two pixels (no shimmer at range). The kiln
also sets gems with their real optics, hair finishes and skin tones.

## 5. The rules each place keeps

- **The glitch** (`vfx/glitch.js`, the owner: "lean into it"): an event's pulse with an end (the FOE showing itself, an ultimate, a mind
  rewritten), stepped at 6 to 10 a second, under the WCAG flash line, off by `visual.glitch`. Never ambient, never decoration.
- **The data drain** (`vfx/datadrain.js`): polygons streaming into the bracelet, unlit, so it reads on white sand and in the dark.
- **The night sky** lives in the dome's shader (`vfx/sky.js` NIGHT_GLSL): our own stars, each at least 1.5 px, turning once a game day;
  meteors every 25 to 70 s; the aurora at the Shore. No draw call, no program.
- **The spirit press:** the soul colour is its only bright thing, shown as the bath, the bead and the hue ring, never written; it is the
  vessel's Lachryma, so a new Courier looks exactly as made.
- **The crossing:** the sea is ink; everything you can shoot carries the one warm or pale thing on it. Parryable things wear only the
  Lachryma outline (`vfx/parrymark.js`).
- **The Great Slip Jelly's bowl:** stone is ammunition (seam, log, rubble); the sand streams toward the pool it is in; the slip ripples
  where it will rise, never a painted ring; **the body is the telegraph** (`vfx/foelook.js`, one shape per cast).
- **The catch:** one look for the Jar and the coffin: a mouth drinking a mind (`vfx/catch.js`).
- **The garden** (Dual Hearts): pastel air tinted by your draught, a cloud sea below, toy planetoids (`vfx/garden/`); a feature wears its
  feeling's colour; a form is its element plus a halo (Law) or horns (Chaos).

## 6. The Courier's face

The E-ink mask was rolled back (`d4872d0`). For the next try: **pupils much bigger** (15 px in a 116 px eye was too small); **sleepy read
well**; **no shadow rim** round a changed eye shape. **The owner makes the atlas**; the runtime (the swap after `map_fragment`, the stepped
blink and look, the event map) comes back from `d4872d0` to drive it.

## 7. What to replace first (the audit)

| what | verdict |
|---|---|
| the Courier, the painted sky, the spell circles, the maker's pixel art, the Lantern Wisp, the god hand and the Pneuka Jar (their rigs, clips and paintings: `vfx/vessoulpaint.js`) | **ours** (the owner's) |
| labradorite, filigree, damage looks, temper, bismuth, finishes, HUD ring, compass, vane, chest glazes | **ours** (made for the game) |
| clapperjars, slip jelly, Psygun (GLBs) | ours, origin to confirm |
| **the five tools' models** (`tools/*/model.js`) | **placeholder: first for the owner's models** |
| **the clay folk** (`npc/folk.js`) | **placeholder: second** |
| chests and curios, Box things and lures, the Lockheart's wheel | placeholder |
| pots and jars | placeholder (good): a glaze atlas lifts them |
| the rooms | greybox: the room glaze atlas (restrained, historical) is deferred |
| the plain hit star | genre default: could become a kiln spark |
