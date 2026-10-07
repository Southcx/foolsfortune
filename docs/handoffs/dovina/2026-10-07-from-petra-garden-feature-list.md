**2026-10-07, from Petra (Main): the Spirit Garden's full feature list, a draft for you to plot** (the owner: "Coordinate with
Dovina to plot out a full feature list with everything that should be in the Spirit Garden from previous notes and your own future
considerations, and execute it"). Gathered from SPIRIT-GARDEN.md, GARDEN-SWEEP.md, the owner's quotes and my own engineering. Status:
**built**, **building** (this round, mine), **open**. Please fold it into SPIRIT-GARDEN.md as a numbered list with an order and owners;
I build in that order.

**A. Seeing and moving** (built v110 unless said)
1. Three views: behind the Jar, first person (Z, the same setting as the world's), overhead (`: the god hand's view in the garden,
   straight down, WASD pans, the Jar still).
2. The held Jar never goes under the ground; a followed view holds still while the Jar is held (the owner's bug, measured).
3. Open: the camera kept out of the ground and the Chimney's needle (a ray from the focus); a soft tether so the overhead view cannot
   wander past the last planetoid.

**B. Terraforming, the ground** (building)
4. A finer ground: 128 × 64 cells a planetoid (about 1 m at the Dantian's equator, from 2 m), and a deeper band (hills and hollows to a
   third of the radius, from 3 m).
5. Brushes: raise, lower, smooth, flatten (to the height where the stroke began: terraces), carve (a groove), roughen; brush size
   ([ and ]) and strength (held longer, harder); undo (Ctrl+Z, the last ten strokes).
6. Ground materials painted by the hand, one a phase (wood moss, fire ash, earth clay, metal stone, water silt): the look, and what grows
   or runs there. Your rule: does a material cost anything, and does it count toward a feature's formation?
7. What stands on the ground is held still round it (built); placed features can be picked up and moved by the hand (open).

**C. Terraforming, the water** (building)
8. A shallow-water simulation on each planetoid's grid (the virtual-pipes model): Lachryma pours from a source, runs downhill, pools,
   spills over rims and evaporates slowly. Sources: the Dantian's lake, a spring the hand places, rain; drains the hand places.
9. Hydraulic erosion: running water carries ground away and lays it down where it slows (rivers cut, deltas build); thermal erosion:
   slopes steeper than they can hold slump.
10. The Jar wades and floats; a spirit swims or avoids water by its grain; a pond feature fills from the simulation.
11. Water keeps its feeling (the draught it fell as, or the source's), and mixed water mixes; your rule: what a feeling's water does (a
    bed watered with grief grows grief's materials?).
12. Open: water between planetoids (a waterfall off a rim falls to the nearest planetoid by its gravity).

**D. The veins and formations**
13. Spirit veins between planetoids (built, look); formation bonuses for generating neighbours (built); sculpting moves a vein's course
    (open: your rule for what moves it).

**E. What grows**
14. Beds grow a planted material (built: `garden.beds`); the moonflower opens at night (open).
15. Open: plants that spread on wet, fertile ground by a cellular rule (Conway-like growth by water and material); trees on the Grove.

**F. The spirits**
16. Caught, bound, fed, drilled, aligned, merged, a form by feeling and side, at work, one out with you (built).
17. Open: races on a planetoid track (Chao Race), sparring at the Chimney, homes (the spirit house), visitors who settle when their
    wants are met (built: offers; open: settling).

**G. Features and planetoids**
18. Placed in plots, Firing-gated (built, your table), formation (built).
19. Open: new planetoids bought (the Moonflower Moon, the Koi Pond, the Drill Yard, the Bone Bed): where they sit, and the lotuses to them.

**H. The sky and time**
20. The draught's sky, the game clock's night (built); rain from the garden's own weather (open: whose weather is it, the draught's?).

**I. Co-op**
21. Open: a guest visits your garden over the room (their Jar on your planetoids, read-only hands, or a shared hand?). Your rule.

**J. Keeping it**
22. The ground, the water, the materials and the features go in the save (the ground is built; water and materials building). Budget: a
    planetoid's ground and water are 16 KB each at the new grid; six planetoids under 200 KB.

**K. Checking it**
23. Each of the above gets its check in your garden sweep (scripts/sweeps/garden.mjs); I'll send you the hooks as I build them.

Building now, mine: 4, 5, 8, 9, 10 (the Jar's part), 22 (water). Waiting on your rules: 6, 11, 13, 17, 19, 20, 21.
