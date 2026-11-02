# The aberrant clapperjar, and the mech's v2 (from Dovina, 2026-11-02)

South picked both today. The rules are on claude/dovina-design. Placeholders are boxes until you dress them.

## 1. The aberrant clapperjar (ABERRANTS.md 5.2; `RULESETS.clapperjar`, `secrets.js` `clapback`)
- **Its body must clap on the duel cue's beat.** That is the whole tell. The secret is letting your drag go on its clap three turns
  running.
  - Read the beat from `game.music.clock()` (music/clock.js: `beat`, `spb`, heard after latency).
  - Once Syncopate has fired (`foe.skill { skill: 'syncopate', off }`), its clap moves to the off-beat (the "and"), and back with
    the next one.
  - The claps must be readable on the body alone: two hands meeting, a puff, the sides' colours. Never a gauge.
- **Its own foe skills' casts:**
  - Shuffle (`foe.skill { skill: 'shuffle', cells: [{ at, id, from, colour }] }`): gems' colours turned one along; a clapperjar's
    mischief, a juggler's toss.
  - Syncopate: its clap jumping to the off-beat.
- **Its elite format** (ABERRANTS.md 2), as you did for the Wisp and the jelly:
  - its ground: a stage? a busker's square? yours;
  - its two deaths: the Line's, and the secret's (`duel.secret { id: 'clapback' }`: it loses its time and claps itself to pieces);
  - the cut-in motif.
- **Encore**, its learned skill (`powers.js` `encore`, Ouranurgy, a second drag this turn): a power tile and a cast.
- **The aberrant inversion's** shiny roll holds as for any aberrant.

## 2. The mech, v2: everything breaks (MECHS.md 9)
- **The toy city** (`world/hangar/city.js`, the builder's; rules `progress/mechs/destruction.js`):
  - 1 m cells by material: glass, timber, brick, stone, steel. The materials should read as the clay city's.
  - The chunks and their debris; a building coming down whole (its foot gives way).
  - The voxel batch is yours: tell me if the city's debris should go through it or something of its own.
- **Props** (`world/hangar/props.js`): a lamp post, a girder, a chunk, a torn-off limb, a water tower. Each in the mech's hand, and
  thrown.
- **Joints** (`progress/mechs/joints.js`):
  - a fractured joint's sparks;
  - a limb tearing off;
  - the head popping up on its spring when a neck snaps (Rock 'Em Sock 'Em's KO).
  - Events: `mech.joint { who, joint, to }`.
- **The boxing ring and its three rival frames** (`world/hangar/ringbout.js`, `rival.js`; rules `progress/mechs/ring.js`):
  - the ring's dress: ropes, posts, the corner;
  - three boxers, each with its tells drawn on its body as Punch-Out's are:
    - the sparring frame's twitch and taunt;
    - the heavy frame's crouch and three hops before its charge;
    - the champion frame's blink;
  - the bout's readout: the stamina bars, hearts, three star pips, the round's clock, the count;
  - Punch-Out's star flash when you earn one (`bout.star`).

Delete this note when done.
