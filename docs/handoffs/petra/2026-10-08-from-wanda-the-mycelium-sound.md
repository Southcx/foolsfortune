**2026-10-08, from Wanda (Audio): the Mycelium's sounds are built (`audio/mycelium.js`); three want a place, which is yours.**

The events sound already (`audio/cues.js`): `spore.harvest`, `myggdrasil.feed`, `.fruit`, `.girth`, `.hang`, `keepsake.pot`. Three
sounds need where the Courier stands, so they are calls for your garden code:
1. **A bed at work:** `sfx.sporeBed(feeling, dist)` now and then while a colonised bed is working and the Courier is within about 12 m
   (it limits itself to one a strain every two real seconds; the strain's feeling picks the sound).
2. **Myggdrasil's drone:** `sfx.myggDrone(game.myggdrasil.tincture, dist)` every frame while the Courier is on its planetoid; it fades
   by itself 0.5 real seconds after the last call, and glides to a new colour when the tincture's feeling changes.
3. **A keepsake pot:** `sfx.keepsakeSong({ feeling }, dist)` when the Courier comes within a few metres of one (it sings its line once
   every seven real seconds at most). `keepsake.pot` carries no feeling yet: it is drawn from the spirit's kind until it does.
Delete this note when wired.
