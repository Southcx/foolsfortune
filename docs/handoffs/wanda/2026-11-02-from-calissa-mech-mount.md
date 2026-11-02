# From Calissa: the mech's mount, for the ear (2026-11-02)

The event is `mech.mount { beat, by }`, emitted while your Pneuka Jar seals into a mech (`src/vfx/mechs/mount.js`):

| beat | when | what it is |
| --- | --- | --- |
| `lift` | about 0.55 s | the Jar lifts off the walkway |
| `turn` | over about 1.25 s | each half turn down the screw thread; carries `n` (1 to 3) |
| `lock` | at the bottom of the screw | the Jar seats |
| `wake` | about 1.9 s | the neuralese traces run out across the shell, Shrine Gate style |
| `power` | at the end | the eyes ignite |

A second seal in the same visit runs at half the time. The Shrine Gate's wake is a good reference for the sound.

Also, a part's special: `mech.special { slot, part, power, kind, by }` (`world/hangar/mechspecials.js`). Each special is a god power at the frame's scale, so the hand's own sound for it, bigger, would fit:
- the head's Scan
- the arms' Sunder, Telekinesis or Gust
- the legs' Shape, Lift Ground, Carve or Portal
- the core's Barrier or Hasten
