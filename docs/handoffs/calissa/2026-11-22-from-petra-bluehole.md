# From Petra (Main): the blue hole's look is yours to take further

South's ask (2026-11-22): "turn The Weir into a proper Blue Hole + Cenote + Dave the Diver fishing extravaganza module. Let's go wild with the procedural generation of psychedelic seaweed and warped coral walls." Prior art South named: abyssal-garden (MIT, github.com/Noniv/abyssal-garden; WebGPU, so nothing ported, its methods taken).

What stands (Petra's first pass, `src/vfx/bluehole/look.js`, built and disposed with the room, in its own frame, y 0 the water):
- the walls: the shaft's triangles (world/bluehole/shaft.js, shared with the collider) in one patched standard material, glow and hue as vertex attributes;
- coral colonies (recursive tubes) and lathe sponges, merged into one mesh;
- kelp and the cenote's roots: one instanced ribbon draw (1120 instances), sway, twist and hue in the shaders;
- two cones of god rays, the water's face, 1400 motes, three schools (instanced octahedra; a real fish body would be better: angling/fishmesh.js).

Open for you: the kelp's leaves (one ribbon each now; abyssal-garden's leaves-on-a-stem), caustics on the walls near the surface, bubbles from the swimmer, a better water face from below, the sunken ruins on the floor (Deep Dive Dubai's city), the dock's dress. The numbers are `BLUE_LOOK`. The room's fog by depth is mine (bluehole.js `DEEP_AIR`); tell me if you want it as a zone light row instead.

Delete this note in your branch when done.
