# The duel's show: cut-ins, stingers, auras and each half its actor's

Calissa's, from South's asks of 2026-10-29 ("Get very JRPG with it. Campy"; "each half's side of the puzzle duel is a representation of
the actor"; "simple textures, radial cylinders with scrolling UVs and alpha blending ... the classic cheap retro look"). What is built,
where, and why it looks the way it does. Names: docs/GLOSSARY.md (the Jar's cut-in, a duel's stamp, the duel's show, the board's
seeding, the fighters' auras, each half its actor's).

## 1. Reference (what the genre does, and what we took)

| reference | what it does | taken as |
| --- | --- | --- |
| Pokemon Stadium (N64, 1999); StadiumBattleFX's catalogue of its move programs | a move is a few small textures on cylinders, discs and screen washes, scrolled and blended; flashes and screen washes on the big ones | the auras (auras.js): open cylinders of rising rays, a counter-turning inner one, a rune disc on the ground; the cut-in's white impact frame |
| Dragon Ball Budokai; Diablo III's aura talk (scrolling noise through a mask) | the power-up: a column of light shot up from the feet, embers lifting | the aura's rise (its height grown over 0.18 s), embers off its base |
| Fire Emblem's phases | PLAYER PHASE blue, ENEMY PHASE red, a band across the screen at each change | the side colours (fxkit.js `SIDE`): yours lapis and the film, the aberrant's cinnabar and ember; the turn's band |
| Persona 5's All-Out Attack, Super Robot Wars' and Fire Emblem's eye-strip cut-ins | a slanted slab, the attacker's face live in a strip, the name slammed, speed lines | the cut-in (cutin.js) and the Jar's mirrored one |
| Street Fighter's VS screen, Puyo Puyo's "n Rensa!" | the two fighters named at the open; the chain called on screen | the VS open and the stamps (stamps.js) |
| Final Fantasy's summon circles; Kingdom Hearts' Drive | a rune circle under the caster; a body poured into another | the aura's heptagram ring; the form's dive |

Search notes: no source documents how Stadium scrolls its cylinders (it is reverse-engineered by fans); the look above is made from
the effect, not a decompile.

## 2. Who is who (the palette)

The duel was coded by feeling: the aberrant's feeling on its side, the film on yours. On a muted, earthy clay world under a prismatic
Lachryma film, that made a Gall (green) or Dread (violet) aberrant read no "hotter" than you. Now every UI element that says whose a
thing is wears the side's glaze first and the feeling inside it:

| | base | light | deep | rim | where |
| --- | --- | --- | --- | --- | --- |
| you (lapis, a cobalt glaze) | 0x2f6fd6 | the film's cyan 0x9ee6ff | 0x0e1c40 | 0x6fb8ff | your bands' ground and rims, the auras, the chant, the push meter (the film) |
| the aberrant (cinnabar, a red lacquer) | 0xc8352a | ember 0xffa060 | 0x30080a | 0xff5a40 | its bands (its feeling pulled 35% toward cinnabar), its auras, its push meter (feeling 45% cinnabar) |

Kept as they were: the gems' own feeling colours (the board's language), gold for reward (a chain's stamp, the finisher's), a domain's
glaze for its power (your Miracle stays Spellscription's cobalt inside a lapis rim).

## 3. Each half its actor's

| actor | in the cut-in's band | in the instance (sidedress.js) |
| --- | --- | --- |
| you (the Pneuka Jar) | the clay's craze in kintsugi gold, the feelings' names chanted in neuralese along both edges | an armillary of three clay rings turning behind the Jar, a band of neuralese running inside each; two kiln-coil pillars breathing gold crackle; sherds orbiting |
| the slip jelly | streams of sand pouring down through the band | sandfalls out of the dark (two sheets each, near fast and far slow), a dust plume and a mound where each lands |
| the Lantern Wisp | black briars across the band, lanterns hung off them flickering | wiry thorned briars climbing out of the ground, a lantern at each tip and some forks, guttering as its own lantern dims |

All from the house's programs (the clay's, the basic with a map, the glow's): nothing new compiles in a duel.

## 4. Layers of action (a cast, read from front to back)

1. **Primary**: the board's beat (the cast on the tsuitate), the cut-in's band and its slammed label.
2. **Secondary**: the fighter's aura (rays, the rune ring), its body acting (lunge, flinch, hop), the camera's cutaway.
3. **Tertiary**: the chant bands circling the body, the embers, the side's set pieces answering (the lanterns, the sand).
