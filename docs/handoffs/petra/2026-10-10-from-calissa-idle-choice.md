**2026-10-10, from Calissa (Art): the idle chosen at the kiln (the owner's R21, v137), the half that is yours** (delete in your branch when done)

The owner asks for the choice of idle to move to the kiln. The rig's half is built: `ch.idles.choose(key)` is the one call (it crossfades
over 0.4 s and returns false for a key the table or the pack lacks), `ch.idles.stand` is the key standing in, and `IDLES`
(`src/courier/anim/idlebreak.js`) holds every choice with its clip, and its `name` and `does` in `IDLES.labels` (CLARITY's fields;
placeholders for Espada). The
kiln's window (`courier/vessel/kilnui.js`, wired in `main.js`) and the save are yours.

**The list** (key, clip, the placeholder words; measured in game over 10 real seconds, every tool off):

| key | clip | `name`, `does` (placeholders) | what to know |
| --- | --- | --- | --- |
| `upright` (default) | `idle:upright` (baked at load) | Upright: "Stand tall and still, arms at your sides." | straight (lean 0.2 degrees, pelvis 0) and the stillest (chest 1.1 cm/s) |
| `akimbo` | `Loco_IdleRelaxedMasc` | Akimbo: "Stand hands on hips, weight on one leg." | leans 11.3 degrees on purpose |
| `hipCocked` | `Loco_IdleRelaxedFem` | Hip Cocked: "Cock a hip, one hand resting on it." | leans 13.6 the other way |
| `handsBehind` | `Loco_IdleC` | At Ease: "Stand at ease, hands clasped behind you." | the hands sit on the tools worn at the back |
| `armsDown` | `Loco_IdleFem` | Loose: "Stand loose, arms down, breathing deep." | the head bobs 10 cm |
| `braced` | `Loco_IdleMasc` | Braced: "Brace wide, knees bent, fists ready." | the default before v133 |
| `weightShift` | `Loco_IdleD` | Shifting: "Rock your weight from hip to hip." | the right hand thrown out once a loop |
| `restless` | `Loco_IdleE` | Restless: "Fidget, hands never quite settling." | never still |

Every one of them is safe under a tool now: whatever is chosen, a tool's stance, the aim, a carried crate and the kick's blows stand on the
pack's `idle` (`IDLE.under`, casebook rule 173), so a leaning idle leans only with empty hands.

**The save field I propose:** a section of its own (the vessel's look is still an adopted key, `foolsfortune.vessel`, so it cannot share
its record yet):

```js
import { IDLES } from './courier/anim/idlebreak.js';
const idles = game.character.idles;
game.save?.section('courierIdle', { scope: 'player', version: 1,
  dump: () => ({ stand: idles.stand }),
  load: (d) => { if (!idles.choose(d?.stand)) idles.choose(IDLES.default); },
  reset: () => idles.choose(IDLES.default) });
```

Section `courierIdle`, scope `player` (it resets with the build, as the glazes do), key `stand`, default `IDLES.default` (`'upright'`).
At the kiln: a row of the eight (a choice card each, its `name` and `does` from `IDLES.labels`), a click is `idles.choose(key)` (tried on at
once, as a glaze swatch is), keeping it is `game.save.dirty('courierIdle')`, and LEAVE without keeping chooses back what was kept. Whether
it costs anything is Dovina's; I would make it free (a stance is not fired). An event for the ledger (`courier.idle`, `{ stand, by:
'courier' }`) is yours if Dovina wants one counted.
