**2026-10-07, from Calissa: the round robin (the owner's step 4): three look improvements, each from a frame of a game we draw on**

Mock (our engine, before and after): `docs/ref/roundrobin_calissa.png`. I could not capture frames from those games here, so each frame is named
precisely enough to find.

1. **A drop shadow along gravity, for the Jar and the spirits on the planetoids.**
   - **Frame:** Super Mario Galaxy, Good Egg Galaxy, the first planetoid. Mario is mid-jump, and his round shadow sits straight under him on
     the curved ground.
   - **What it teaches:** on a small world the sun's shadow falls sideways, so Galaxy casts a second shadow toward the planet's heart. You
     always know where you will land.
   - **For us:** a soft disc projected on the planetoid beneath the Jar along `-up`, shrinking and darkening as it nears the ground. Spirits
     too.
   - **Cost:** one decal each, no light.
   - **Owner:** mine, as `vfx/garden/dropshadow.js`. It needs your Jar's up and its height over the ground.
   - The mock's disc is flat and clips into the terraces; the real one is projected onto the surface.
2. **Light shafts in the Great Slip Jelly's bowl.**
   - **Frame:** Shadow of the Colossus, the Shrine of Worship. Light falls from the roof's opening in one long shaft onto the altar, dust
     turning in it.
   - **What it teaches:** one shaft makes a dark room a stage, says where the sky is, and gives depth without fog.
   - **For us:** two or three shafts from the roof's holes onto pillars and the dish (the arena's look, "the room as the weapon"), with dust
     motes drifting in them.
   - **Cost:** additive cones and a pool of light on the floor (no lights, inside the four of eight the arena has). Mocked bottom right.
3. **Cloud shadows over the Dunes.**
   - **Frame:** The Wind Waker, Outset Island from the sea at noon. Great cloud shadows slide over the island and the water.
   - **What it teaches:** scale and weather, and motion from things that actually move (the house rule).
   - **For us:** one world-projected noise, the cloud layer's own texture under its own wind, multiplied into the sand's and the crude sea's
     light. The shadows then match the clouds overhead and thin with the weather's cover.
   - **Cost:** one texture fetch on the ground shaders.
   - **Owner:** the dunes' ground shader is yours, so I'd hand you the chunk (`CLOUD_SHADOW_GLSL`, from `vfx/clouds.js`).
   - Not mocked: it needs that hook.

My order of value: 1 (it is play: the garden's hops land where you meant), then 2, then 3.
