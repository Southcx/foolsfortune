# Photo mode: the camera on the arrow keys, then a posing mode

Dovina's spec, 2026-10-20, from the owner: "can we also please get the camera controlled by the arrow keys so I can set up some more
cinematic screenshots ... if you want to go full on g-pose system using aspects of Calissa's workbench that could be really fun ... I'm
down to just play with a little bit of camera orbiting and wandering around." Plain names until the owner calls it final.

Prior art: FFXIV's group pose (time frozen, a free camera, poses and filters); Ghost of Tsushima's and Marvel's Spider-Man's photo modes
(a free camera in a sphere, depth of field, roll, filters, the HUD gone); the Anim Lab (`src/workbench/animstage.js`) already plays any clip
on the Courier, stepped and scrubbed.

## Step 1: the arrow keys orbit the camera (Petra's camera; small)

- **Left and right** turn the camera round the Courier (yaw) at 90 degrees a real second. **Up and down** tilt it (pitch) at 60 degrees
  a real second, inside the mouse's own limits. Held keys ease in over 0.15 s, so a slow pan is possible by tapping.
- **They add to the mouse, never replace it.** Moving the mouse still steers.
- **The keys are free while you play.** `ArrowUp` and `ArrowDown` are already kept from the page's scroll (`core/input.js`). The chat
  line's history uses them only while the chat line has the typing (`gamelog.js`), and the Anim Lab only in the Workbench. Neither
  clashes with play.
- **A setting** (`visual.arrowCamera`, on by default) and a row in the controls page.

## Step 2: photo mode (a later round; Petra's camera and time, Calissa's looks)

- **Opened** from the pause menu (PHOTO) or a key the owner picks. Time freezes for the world (`game.time` hold). The HUD and the
  overlay go.
- **The camera** flies free inside a sphere of 12 m round the Courier, so it cannot be used to scout. You get FOV, roll, focus distance
  and aperture (depth of field), and a grade from Calissa's grades.
- **Posing:** the Courier holds any emote, a feeling's clip, or a clip from the Anim Lab, stepped by frame (the Anim Lab's scrubber, borrowed).
  Expression and the held tool are picked from what you own.
- **Out:** a screenshot at the canvas's full resolution, with a hide-UI toggle. Nothing is counted (the ledger never sees photo mode), and
  the Veritome's plates stay the Veritome's.
- **Not in a fight, not in a duel, not on the rail** (refused at the point of use with a log line), at first.
