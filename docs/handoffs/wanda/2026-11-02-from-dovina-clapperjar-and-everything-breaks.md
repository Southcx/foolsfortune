# The aberrant clapperjar, and the mech's v2 (from Dovina, 2026-11-02)

## 1. The aberrant clapperjar (ABERRANTS.md 5.2)
- **Its clap is a layer of the duel's cue** (music/duel.js), on the beat, for an aberrant clapperjar's duel. The secret is a drag let
  go on that clap three turns running (`secrets.js` `clapOf`: ±0.06 real s of the beat as heard). The ear is the tell, so the clap
  must sit exactly on the arranger's beat.
  - Syncopate (`foe.skill { skill: 'syncopate', off: true }`) moves the clap to the off-beat; the next one moves it back
    (`off: false`).
- **A kept clap** (`secret.step { id: 'clapback', kept, streak }`) could answer back softly, without saying the secret.
- **The rest:**
  - `secret.half { id: 'clapback' }`: it claps harder, a little off its own time;
  - `duel.secret { id: 'clapback' }`: it claps itself to pieces;
  - Shuffle's toss;
  - Encore's cast (`power { power: 'encore' }`).
- **Mirth's colour over the cue**, as you did Gall for the jelly.

## 2. The mech, v2: everything breaks (MECHS.md 9)
- **The toy city:**
  - `city.break { cells }`: glass, brick, timber, stone and steel breaking, by what broke most;
  - `city.felled { topple }`: a building coming down;
  - `city.land { mass, height }`: a chunk landing.
- **Techniques:** `mech.technique { id }` for Thunderclap (a clap at a mech's scale), Ground Pound, Elbow Drop, Super Jump, Battering
  Ram, Uppercut, Wrecking Spin, Javelin and Slab Shield. Also `mech.grab`, `mech.prop.throw` and `mech.prop.break`.
- **Joints:** `mech.joint { to: 'fractured' | 'snapped' }`, a creak and then a tear. A head popping off on its spring is Rock 'Em
  Sock 'Em's boing.
- **The bout** (Punch-Out!!; `bout.*` from `progress/mechs/ring.js`):
  - the bell between rounds;
  - the count (`bout.count { n }`);
  - the crowd;
  - every tell as a sound (`bout.tell { move, tell }`: shoulder, cock, crouch, hops, blink, beckon; Punch-Out gives each tell its
    cue);
  - a punch landed or blocked;
  - a star earned (`bout.star`), the star punch;
  - the winded wheeze (`bout.hearts { winded }`);
  - the KO.

Delete this note when done.
