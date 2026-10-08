// ---------------------------------------------------------------------------------------
// THE ENCOUNTERS' CAMERAS: each encounter at sea filmed as a sequence (cine/sequence.js, played by game.cine; docs/plans/PASSAGE.md
// section 13), two camera shots over its tableau (vfx/encounters/tableaux.js) in about five and a half real seconds, the arrival's four bars
// of the cue (music/legs.js: 1.5 real s a bar), and then the choice (the cue `done`: world/emocean/triprun.js offers it, the game holds
// on the last frame). Every camera stands clear of the swell's crests (lower, a crest puts it under the crude, in the Umbral's
// look). No words on the screen: the log says the arrival, the dialogue box and the choice are Petra's and Espada's.
// Anchors: `ship` (the hull sailing), `tableau` (its origin, on the surface), `subject` (what the second shot closes on: Letty, Hap,
// the Purser, the bottle, the last ghost, your double, the whale). Offsets are the rail's frame (right, up, forward), as all sequences'; `ship` is
// where the hull flies, 3 m over the swell (courier/ship/views.js CRUISE), the others on the surface.
//
// Prior art: FTL's event (a picture, then the choice) and Sunless Sea's storylets; the shot grammar of an establishing shot then a
// close-up (every film's), Wind Waker's camera on its sea encounters (the ghost ship looming out of fog, the merchant's boat met on the
// water), Star Fox 64's mid-stage cutaways to an ally alongside (Letty's cutter), and Jaws' camera on the water's surface (the whale).
//
//   SEA_SEQUENCES (spread into cine/sequences.js SEQUENCES as 'sea.<encounter>')   SEA_FILM = { dur, done }
// ---------------------------------------------------------------------------------------
export const SEA_FILM = { dur: 5.6, done: 5.4 };

const seq = (preview, camera) => ({ anchors: ['ship', 'tableau', 'subject'], preview, clear: false, bars: 1, ease: 40, order: [['arrive', SEA_FILM.dur]], start: 'arrive',
  segments: { arrive: { camera, cue: [{ t: SEA_FILM.done, cue: 'done' }] } } });
const P = (at, off) => ({ at, off });

export const SEA_SEQUENCES = {
  // THE DEAD RECKONERS: over the ship's shoulder as the ghosts come out of the fog, then low on the crude as the last one goes by
  'sea.ghostConvoy': seq({ ship: [0, 3, 0], tableau: [10, 0, 22], subject: [10, 0, -6] }, [
    { t: 0, pos: P('ship', [-1.6, 1.3, -4.5]), look: P('tableau', [0, 1.6, -6]), fov: 2 },
    { t: 2.9, pos: P('ship', [-1.2, 1.5, -4]), look: P('tableau', [0, 1.8, -20]), fov: 2 },
    { t: 3.0, cut: true, pos: P('subject', [-3.4, 1.3, 7]), look: P('subject', [0, 1.5, 0]), fov: -4 },
    { t: SEA_FILM.dur, pos: P('subject', [-3.8, 1.4, 2.5]), look: P('subject', [0, 1.7, -1]), fov: -4 },
  ]),
  // THE LAST WORD: both ships from ahead as the cutter draws up alongside, then on Letty at her bow, Poll on her shoulder
  'sea.lettysCutter': seq({ ship: [0, 3, 0], tableau: [-4.2, 0, 0], subject: [-4.2, 0.4, 1] }, [
    { t: 0, pos: P('ship', [-10, 1.5, 5]), look: P('ship', [-2.6, -0.8, -1]), fov: -2 },
    { t: 2.7, pos: P('ship', [-9, 1.4, 3]), look: P('ship', [-2.6, -0.9, 0]), fov: -2 },
    { t: 2.8, cut: true, pos: P('subject', [1.5, 0.7, 1.4]), look: P('subject', [0, 0.38, 0]), fov: -14 },
    { t: SEA_FILM.dur, pos: P('subject', [1.1, 0.6, 0.95]), look: P('subject', [0, 0.4, 0]), fov: -14 },
  ]),
  // THE CANTOR: from over the ship down onto its light under the crude, then low on the water as its back breaks the surface
  'sea.lightWhale': seq({ ship: [0, 3, 0], tableau: [-2.6, 0, 8], subject: [-2.6, -1, 8] }, [
    { t: 0, pos: P('ship', [2.2, 4.2, -5.5]), look: P('tableau', [0, 0, 1]), fov: 8 },
    { t: 2.6, pos: P('ship', [1.6, 3.6, -3.5]), look: P('tableau', [0, 0, 3]), fov: 8 },
    { t: 2.7, cut: true, pos: P('tableau', [-10, 1.4, 5]), look: P('tableau', [0, 1.0, 1]), fov: 6 },
    { t: SEA_FILM.dur, pos: P('tableau', [-9, 1.6, -1]), look: P('tableau', [0, 1.4, 2]), fov: 6 },
  ]),
  // A RAFT ADRIFT: from beside the raft on the water, the ship coming up the rail toward it; then on Hap Lagan and Bob as it passes
  'sea.castaway': seq({ ship: [0, 3, -60], tableau: [-3.6, 0, 0], subject: [-3.7, 0.1, 0] }, [
    { t: 0, pos: P('tableau', [-1.6, 1.2, 3.2]), look: P('ship'), fov: -2 },
    { t: 3.3, pos: P('tableau', [-1.4, 1.2, 2.8]), look: P('ship'), fov: -2 },
    { t: 3.4, cut: true, pos: P('subject', [1.6, 1.0, 1.4]), look: P('subject', [-0.3, 0.32, 0.1]), fov: -10 },
    { t: SEA_FILM.dur, pos: P('subject', [1.25, 0.95, 1.05]), look: P('subject', [-0.3, 0.32, 0.1]), fov: -10 },
  ]),
  // THE BOURSE: past the barge's lanterns at the ship coming up, then in under the canopy on the Purser at the counter
  'sea.pursersBarge': seq({ ship: [0, 3, -60], tableau: [5.6, 0, 0], subject: [5.6, 0.36, 0.1] }, [
    { t: 0, pos: P('tableau', [4, 1.7, 6.5]), look: P('tableau', [-3, 1.2, -6]), fov: 6 },
    { t: 3.3, pos: P('tableau', [3.4, 1.5, 5.5]), look: P('tableau', [-3.5, 1.4, -4]), fov: 6 },
    { t: 3.4, cut: true, pos: P('subject', [-1.8, 1.1, 0.8]), look: P('subject', [0, 0.55, 0]), fov: -10 },
    { t: SEA_FILM.dur, pos: P('subject', [-1.4, 1.0, 0.5]), look: P('subject', [0, 0.58, 0]), fov: -10 },
  ]),
  // THE GLASS: both ships head on, the double beside you; then from past its silver at your own ship over the flat sea
  'sea.mirrorSea': seq({ ship: [0, 3, 0], tableau: [3.2, 0, 0], subject: [3.2, 3, 0] }, [
    { t: 0, pos: P('ship', [1.6, 0.7, 5.5]), look: P('ship', [1.6, 0, -1]), fov: -4 },
    { t: 2.9, pos: P('ship', [1.6, 0.4, 4.2]), look: P('ship', [1.6, 0, -1]), fov: -4 },
    { t: 3.0, cut: true, pos: P('subject', [2.4, 0.3, 1.2]), look: P('ship', [0, 0.1, 0]), fov: -6 },
    { t: SEA_FILM.dur, pos: P('subject', [2.6, 0.1, -0.6]), look: P('ship', [0, 0.1, 1]), fov: -6 },
  ]),
  // A DRIFT BOTTLE: high down the shaft of light onto it, then close on the bottle bobbing
  'sea.driftBottle': seq({ ship: [0, 3, -60], tableau: [-3, 0, 0], subject: [-3, 0.05, 0] }, [
    { t: 0, pos: P('tableau', [2.6, 4.5, -5.5]), look: P('tableau', [0, 0.2, 0]), fov: -4 },
    { t: 3.1, pos: P('tableau', [1.8, 3.2, -3.6]), look: P('tableau', [0, 0.2, 0]), fov: -4 },
    { t: 3.2, cut: true, pos: P('subject', [0.6, 0.45, -0.55]), look: P('subject'), fov: -20 },
    { t: SEA_FILM.dur, pos: P('subject', [0.45, 0.4, -0.4]), look: P('subject'), fov: -20 },
  ]),
};
