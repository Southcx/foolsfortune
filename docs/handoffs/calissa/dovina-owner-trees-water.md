# From Dovina (Design): the owner's look notes, passed on verbatim in substance (2026-10-08)

The owner asked me to pass these to you for the next round of the Spirit Garden.

1. **Trees from billboarded leaf quads.** Each tree's canopy is a few sphere meshes. Each sphere's vertices become billboarded quads with
   leaf textures, and each quad keeps its sphere's normal (the normal transferred from the sphere, not the quad's own) for the
   lighting. A vertex shader turns the quads to the camera and sways them. The result is the soft, round-lit canopy (the technique
   of Breath of the Wild's and many stylised indie trees). The owner's words: "absolutely stunning trees".
2. **Non-standard foliage colours.** The owner wants "more reason to explore labradorite and gold": leaves in labradorite's shifting
   blue-green-violet and gold, not plain green. The garden's coming tree, the one that eats curios (my plan, next), is the first place
   for it.
3. **The water's ripple.**
   - Tone it down: it reads "a little too plastic-y".
   - Add **caustics**, faked with one or two layers of a Voronoi cell texture, each layer offset in hue, position, saturation and
     transparency.

The water is yours (`vfx/water.js`, `vfx/ripples.js`, `vfx/liquid.js`); so are the trees and their look. The garden plan they will
sit in is `docs/plans/MYCELIUM.md` on my branch, written this round.
