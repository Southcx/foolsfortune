// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGS: five notes, and what playing them in a certain order does. The five are the MINOR PENTATONIC of whatever is
// playing (music/player.js grid(): E flat in the sea, E in the workshop): the scale with no wrong notes, so anything played on it sounds
// like music, and a song is a shape, not a test of fingers. Keys 1 to 5 are its degrees (1 the root, 2 the minor third, 3 the fourth,
// 4 the fifth, 5 the minor seventh); held RMB plays them an octave up.
//
// A SONG is a short motif of degrees (Ocarina of Time's songs: a few notes, a fixed order, learned and then played anywhere). Played on
// the beat (each note within a small window of the music's eighth notes), the notes build FEVER (Patapon: keep the rhythm and the army
// burns brighter), and fever makes every song stronger. The bell takes what is played into it and makes it MORE (it is a crucible: the
// note goes in, smoke and light come out): a song done costs Lachryma, less in fever.
//
// The INSTRUMENT fitted to the bell (the Pneuka Box, one slot, as the Sondelass has one lure) is its voice and its school: the bell
// alone is even-handed; the ocarina's songs of seeing and seeming are stronger, the kalimba's of rallying and lulling, the lute's of
// summoning (a rockstar's guitar: every spirit called up is a roadie of smoke).
//
// Prior art: Ocarina of Time (songs as motifs), Patapon (rhythm commands, fever), Crypt of the NecroDancer and Hi-Fi Rush (everything
// on the beat, leniently), the bard of every tabletop game (inspire, fascinate, summon), and the pentatonic scale itself: the black
// keys of the piano, the scale of the blues, of the shakuhachi and of a child's first tune, which is why nothing played on it is wrong.
//
//   SCALE (semitones)   SONGS[id] = { name, notes: [1..5], cost, school, does }   INSTRUMENTS[id] = { name, voice, school, does }
//   match(history) -> songId | null   (history: the degrees just played, newest last)
// ---------------------------------------------------------------------------------------
export const SCALE = [0, 3, 5, 7, 10];
/** The colour of each degree: the bell's vents and its smoke. */
export const DEGREE_COLOR = [0xffd76a, 0xff9ad5, 0x9be36a, 0x7fb2ff, 0xb49be6];

export const SONGS = {
  reveal: { name: 'THE SONG OF SEEING', notes: [5, 3, 1], cost: 8, school: 'sight', does: 'What is hidden near is shown: veiled crystal rises, and every Lachryma signature lights.' },
  mirage: { name: 'THE SONG OF SEEMING', notes: [2, 4, 2, 4], cost: 12, school: 'sight', does: 'A Courier of smoke where you stand: what hunts you hunts it, and forgets you.' },
  rally:  { name: 'THE RALLY', notes: [1, 3, 5], cost: 14, school: 'heart', does: 'Your spirits and your kin quicker and harder; your Lachryma quick to come back.' },
  lull:   { name: 'THE LULLABY', notes: [5, 4, 3, 2, 1], cost: 14, school: 'heart', does: 'What is near and against you falls asleep.' },
  summon: { name: 'THE CALL', notes: [1, 1, 5, 5], cost: 24, school: 'call', does: 'A smoke spirit stands up out of the bell, on your side.' },
};

/** The bell's voices (band.js instruments), and the school each favours (its songs half as strong again). */
export const INSTRUMENTS = {
  bell:            { name: 'THE BELL ALONE', voice: 'bell', school: null, does: 'The Crucibelle with nothing fitted: its own voice, even-handed.' },
  'inst.ocarina':  { name: 'CLAY OCARINA', voice: 'flute', school: 'sight', color: 0xc8805a, does: 'A breathy clay whistle. Songs of seeing and seeming are stronger.' },
  'inst.kalimba':  { name: 'THUMB KALIMBA', voice: 'celesta', school: 'heart', color: 0xd9b48a, does: 'Tines on a little box. Songs of rallying and lulling are stronger.' },
  'inst.lute':     { name: 'SPIRIT LUTE', voice: 'guitar', school: 'call', color: 0x8a4a2a, does: 'Strings that bend and wail. Songs that call are stronger.' },
};

/** The song the last notes played make, if any (the longest that fits, so a lullaby is not taken for its own last three notes). */
export function match(history) {
  let best = null;
  for (const [id, S] of Object.entries(SONGS)) {
    const n = S.notes.length;
    if (history.length < n) continue;
    let ok = true;
    for (let i = 0; i < n; i++) if (history[history.length - n + i] !== S.notes[i]) { ok = false; break; }
    if (ok && (!best || n > SONGS[best].notes.length)) best = id;
  }
  return best;
}
