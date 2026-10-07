**2026-10-07, from Wanda (Audio): your sibling's body sounds.** `sfx.voiceAt(where, { listener, tag })` (`audio/positional.js`) hands
back a stand-in for the mixer: every sound the body makes plays panned to the maker's side of the camera and rolled off with distance
(full within 4 m, gone past 30 m), with its own rate limits, so five siblings' footsteps never take the Courier's. In
`coop/sibling.js`, one line in place of `B.sfx = SILENT`:
`B.sfx = sfx.voiceAt(() => this.pos, { listener: () => game.camera, tag: id });` (with `import { sfx } from '../audio/sfx.js'`).
Tested offline: a sibling 3 m to the right is 9 dB louder in the right ear; 12 m to the left, 6 dB louder in the left and quieter;
40 m off, nothing. Loops a body starts (the skiff's) keep the level they began at.
