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
