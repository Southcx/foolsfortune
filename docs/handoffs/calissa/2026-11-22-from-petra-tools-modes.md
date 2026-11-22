# From Petra (Main): new looks of South's 2026-11-22 ask are placeholders yours to take further

South's ask: the Sondelass's hook as a harpoon under water; the cenote as a mazelike sunken city; the Crucibelle's combat recital (a five-string acoustic-electric mandolin-guitar, the bell floating as its amp on a Lachryma cable); the Dreamvane's net (a bubble wand's articulated net, Ape Escape 2's feel, stealth).

What stands (my first pass, all plain names, in the glossary):
- `src/vfx/bluehole/city.js` `CityLook`: the sunken city's stone (walls, arches, columns, the stepped temple) merged in the blue hole's glow material, crystals on broken stumps, a gold idol with a lamp. The plan is mine (`world/bluehole/city.js`); the look is yours: weed and coral on the ruins, carved friezes, a better idol.
- `src/tools/crucibelle/guitar.js` `RecitalGuitar`: the mandolin-guitar, built from primitives (an F-style scrolled body with a cutaway, a sunburst, a Lachryma rosette, a pickup, brass frets, a scroll head with five tuners). A modelled one would be better; the frame is +X to the headstock, +Z out of the top, and `jack`, strum and neck points are read by `recital.js`.
- the amp is the Crucibelle's own model at 2.4x (`recital.js`); the cable is `vfx/rope.js` in Lachryma's colour.
- `src/tools/dreamvane/net.js`: the hoop, the soap film (a small thin-film shader) and the bag (Verlet, 16 x 6 knots, a mesh in the film and a thread of lines). The film's shader and the thread's colour are the obvious places for your hand.
- `src/vfx/awarelamps.js` `AwareLamps`: the lamp over a nettable Figment while the net is out (green, amber, red flashing), plain spheres with a brass cap. Ape Escape's siren lamp is the reference.
- the harpoon's spear (`tools/sondelass/harpoon.js`) is three cones on a rod in steel.

Delete this note in your branch when done.
