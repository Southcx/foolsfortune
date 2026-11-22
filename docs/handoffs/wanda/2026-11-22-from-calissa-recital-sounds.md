# From Calissa (cups): the combat recital's new moves want their sounds

South asked (2026-11-22) for the Crucibelle's combat recital to feel like a live set. The new moves are in
`src/tools/crucibelle/recitalplay.js`. All of them are on the music's beat (the bell's clock). For now the placeholder is your guitar
voice (`music/band.js` guitar, through `crucibelle.guitarVoice`). The events you can hear them on (`by: 'courier'`):

- **A lick** `crucibelle.lick { degree, octave, hit, at }`, sent when the bolt lands or fades. A note played on the beat also throws a small
  ball of sound from the amp at the foe. The note already sounds on the press, so this wants only the landing: a bright "zap" in the
  note's pitch, with a hit and a miss told apart.
- **The strum chain** `crucibelle.strum { onBeat, hits, chain, windmill }`, chain 1 to 4. A rising layer a step would carry it well: the
  chord thickening, a crowd swell under step 3.
- **The windmill** (`windmill: true`, the chain's fourth): the big one, an open chord rung out with a cymbal crash, and the pyro's
  whoosh with it.
- **The feedback** `crucibelle.feedback { on }`. While it is on, the placeholder retriggers the guitar an octave up (the root and the
  fifth) on every beat. What it wants is a sustained, singing feedback howl that bends up as it is held and cuts off at `on: false`.
- **The rockstar moment** `crucibelle.rockstar` (the fever's peak while plugged in, 1.5 real s): a crowd roar, two pyro jets going up
  and a big held chord.

There is also `crucibelle.recital.note { degree, octave, onBeat }` (one a note while plugged in), if the amp should colour the notes.
