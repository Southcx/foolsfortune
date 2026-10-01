// ---------------------------------------------------------------------------------------
// "FOOL'S FORTUNE": the main theme, in five movements. Everything about it is five.
//
//   THE NOTES. E and G: E the fifth letter, G the fifth degree (of C, the plain hexachord's ut). E minor and G major are one key
//   seen from two sides, and the two worlds of the game live in them:
//     EAST  the minyo pentatonic, E G A B D: five notes, Japan's folk scale. The shakuhachi and the koto.
//     WEST  the hard hexachord, G A B C D E (ut re mi fa sol la): it starts on G and ends on E. Strings, flute, brass, harmonica.
//   THE FIVE (the leitmotif, after Kondo: short enough to hum, shaped to be re-voiced anywhere): E D B A G, the pentatonic
//   falling five steps; its answer climbs G A B D E. Played East (no D#, no F#: a B7sus4 under it) or West (the leading tones
//   D# and F#, a B7 that pulls home), as a fanfare, as a jingle (music/jingles.js), as a lullaby.
//   THE BARS. Phrases of five bars and ten; a movement in 5/4 (three and two, the way Take Five walks); a five-chord cycle
//   (Em C G D B7: i, VI, III, VII and the V that turns it round); the run up five notes to the octave.
//
// THE MOVEMENTS (about 3:45 a time round, then again from II):
//   I    WIND      75 bpm. A piano alone, arpeggios under the melody: the A phrase (Em Em/D Cmaj7 B7 ...: a falling bass, the
//                  lament). To Zanarkand's room: one instrument, the tune and its harmony, nothing else.
//   II   PATH      100 bpm in 5/4. A koto ostinato in threes and twos; the shakuhachi takes the A phrase (East: minyo), then the
//                  flute and the strings the B phrase (West: G major, the hexachord). Path of the Wind's walk: an ostinato that
//                  never stops under a melody that is in no hurry.
//   III  WILD      125 bpm. The five-chord cycle; a 16th-note koto, taiko under a light kit (the kick is round and short: it sits
//                  under the drums of the world, it does not lead), the shakuhachi calls the Five and the brass answers it,
//                  then the harmonica; Wozwald's forest, wood and air and a pulse. Then a BUILD of ten bars: the strings climb the
//                  hexachord, a snare and a taiko roll, everything opening through a filter, a breath.
//   IV   FORTUNE   the climax. The B phrase and the A phrase in the whole band (strings, brass, flute, guitar, the shakuhachi in
//                  the counter-line), and the tag that ends it climbs to E5 and LEAPS THE OCTAVE to E6, everything striking
//                  with it: the slam. The E6 sings over the last bars as they fall.
//   V    RETURN    75 bpm. The piano again, the flute; the last chord is E major (the Picardy third), and the celesta plays the
//                  Five's answer up to the octave.
//
// Prior art: Joe Hisaishi (Path of the Wind's ostinato and its patience, the falling-bass lament of his minor themes, the piano
// as the voice), Nobuo Uematsu's To Zanarkand (the solo piano, a melody that says everything in eight bars), Koji Kondo (the
// leitmotif: a few notes that come back as a fanfare, a jingle, a lullaby, in every arrangement), Yuu Miyashita's Wozwald
// (acoustic and ethnic colour over a modern pulse, the build), Guido of Arezzo (the hexachords), Dave Brubeck (5/4).
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

// the chords: a voicing (strings, pads), the bass, an arpeggio (the piano's eighths)
const CH = {
  Em: { r: 40, v: [52, 59, 64, 67], arp: [40, 47, 52, 55, 59, 55, 52, 47] },
  EmD: { r: 38, v: [50, 59, 64, 67], arp: [38, 47, 52, 55, 59, 55, 52, 47] },
  Cmaj7: { r: 36, v: [48, 55, 59, 64], arp: [36, 43, 48, 52, 55, 59, 55, 52] },
  B7: { r: 35, v: [47, 54, 57, 63], arp: [35, 42, 47, 51, 54, 57, 54, 51] },
  Bsus: { r: 35, v: [47, 52, 57, 59], arp: [35, 42, 47, 52, 54, 57, 54, 52] }, // (B7sus4: no D#, the East's dominant)
  Am7: { r: 33, v: [45, 52, 55, 60], arp: [33, 40, 45, 48, 52, 55, 52, 48] },
  G: { r: 31, v: [43, 50, 55, 59], arp: [31, 38, 43, 47, 50, 55, 50, 47] },
  DFs: { r: 42, v: [50, 54, 57, 62], arp: [42, 50, 54, 57, 62, 57, 54, 50] },
  C: { r: 36, v: [48, 52, 55, 60], arp: [36, 43, 48, 52, 55, 60, 55, 52] },
  GB: { r: 35, v: [47, 50, 55, 59], arp: [35, 43, 47, 50, 55, 59, 55, 50] },
  Am: { r: 33, v: [45, 52, 57, 60], arp: [33, 40, 45, 48, 52, 57, 52, 48] },
  D: { r: 38, v: [50, 54, 57, 62], arp: [38, 45, 50, 54, 57, 62, 57, 54] },
  Dsus: { r: 38, v: [50, 55, 57, 62], arp: [38, 45, 50, 55, 57, 62, 57, 55] },
  EM: { r: 40, v: [52, 59, 64, 68], arp: [40, 47, 52, 56, 59, 64, 59, 56] }, // (E major: the Picardy third)
};

// THE A PHRASE (E minor; it opens with the Five: E D B .. G) and THE B PHRASE (G major, up the hexachord): per bar, [beat, beats, midi]
const A = [
  [[0, 1.5, 76], [1.5, 0.5, 74], [2, 1, 71], [3, 1, 67]],
  [[0, 3, 69], [3, 1, 71]],
  [[0, 1.5, 67], [1.5, 0.5, 69], [2, 1, 71], [3, 1, 76]],
  [[0, 2, 75], [2, 2, 71]],
  [[0, 1.5, 76], [1.5, 0.5, 74], [2, 1, 71], [3, 1, 67]],
  [[0, 1, 69], [1, 1, 71], [2, 1, 74], [3, 1, 76]],
  [[0, 2, 79], [2, 1, 78], [3, 1, 76]],
  [[0, 2, 78], [2, 1, 75], [3, 1, 71]],
];
const A_CH = ['Em', 'EmD', 'Cmaj7', 'B7', 'Em', 'EmD', 'Am7', 'B7'];
// (the same phrase in the East: the minyo pentatonic, no leading tones, a suspended dominant)
const A_EAST = A.map((b, i) => (i === 3 ? [[0, 2, 74], [2, 2, 71]] : i === 6 ? [[0, 2, 79], [2, 1, 76], [3, 1, 74]] : i === 7 ? [[0, 2, 76], [2, 1, 74], [3, 1, 71]] : b));
const A_CH_EAST = ['Em', 'EmD', 'Cmaj7', 'Bsus', 'Em', 'EmD', 'Am7', 'Bsus'];
const B = [
  [[0, 1, 71], [1, 1, 74], [2, 2, 79]],
  [[0, 1.5, 78], [1.5, 0.5, 76], [2, 2, 74]],
  [[0, 1, 76], [1, 1, 79], [2, 2, 83]],
  [[0, 2, 81], [2, 1, 79], [3, 1, 76]],
  [[0, 1, 74], [1, 1, 76], [2, 1, 79], [3, 1, 81]],
  [[0, 2, 83], [2, 1, 81], [3, 1, 79]],
  [[0, 3, 81], [3, 1, 74]],
  [[0, 2, 78], [2, 2, 81]],
];
const B_CH = ['G', 'DFs', 'Em', 'C', 'GB', 'Am', 'Dsus', 'D'];
// the Five and its answer, as a motif to call and answer with
const FIVE = [[0, 1.5, 76], [1.5, 0.5, 74], [2, 1, 71], [3, 0.5, 69], [3.5, 0.5, 67]];
const ANSWER = [[0, 0.5, 67], [0.5, 0.5, 69], [1, 0.5, 71], [1.5, 0.5, 74], [2, 2, 76]];
// the climax's tag: up to E5, and the octave leap to E6 (the slam)
const TAG = [[[0, 1, 76], [1, 1, 79], [2, 2, 83]], [[0, 1, 81], [1, 1, 78], [2, 2, 74]], [[0, 1, 75], [1, 1, 78], [2, 1, 83], [3, 1, 81]], [[0, 1, 76], [1, 3, 88]]];
const TAG_CH = ['C', 'D', 'B7', 'Em'];
const FALL = [[[0, 4, 88]], [[0, 2, 84], [2, 2, 83]], [[0, 2, 81], [2, 2, 78]], [[0, 4, 76]], [[0, 4, 76]]];
const FALL_CH = ['Em', 'C', 'D', 'Em', 'Em'];
const CYCLE = ['Em', 'C', 'G', 'D', 'B7']; // (the five-chord cycle of the WILD)

// helpers: a tune as events; a 4/4 bar stretched to 5/4 (its last note held a beat longer); the piano's arpeggio
const tune = (inst, bar, v, o = {}, shift = 0) => (bar || []).map(([b, d, n, oo]) => E(inst, b, d, n + shift, v, { ...o, ...oo }));
const five = (bar) => (bar || []).map((x, k, a) => (k === a.length - 1 ? [x[0], x[1] + 1, x[2], x[3]] : x));
const arp = (c, v, beats = 4) => CH[c].arp.slice(0, beats * 2).map((n, k) => E('piano', k * 0.5, 1.2, n, v * (k === 0 ? 1.2 : k % 2 ? 0.75 : 0.9), { pedal: 0.4 }));
const pad = (c, v, d = 4, o = {}) => [E('strings', 0, d, CH[c].v, v, { attack: 0.6, bright: 1800, ...o })];

export const FORTUNE = {
  title: "Fool's Fortune", bpm: 125, arrange: true, loopFrom: 1, pumpDepth: 0.55,
  sections: [
    // I. WIND: the piano alone
    { id: 'wind', bars: 10, bpm: 75, bar: (i) => {
      if (i < 8) return [...arp(A_CH[i], 0.3), ...tune('piano', A[i], 0.5, { pedal: 0.3 }, 12), ...(i >= 4 ? pad(A_CH[i], 0.06) : [])];
      if (i === 8) return [...arp('Em', 0.28), E('piano', 0, 4, 88, 0.45, { pedal: 1 }), E('celesta', 2, 1, 88, 0.25), ...pad('Em', 0.07)];
      return [E('breath', 0, 4, null, 0.06), ...pad('Em', 0.08, 5, { attack: 2 }), ...[76, 79, 81, 83, 88].map((n, k) => E('celesta', 2 + k * 0.4, 1, n, 0.28))];
    } },
    // II. PATH, in 5/4: the koto's three-and-two; the shakuhachi takes A (East), the flute and strings take B (West)
    { id: 'path', bars: 15, bpm: 100, beats: 5, bar: (i) => {
      const c = i < 2 ? 'Em' : i < 10 ? A_CH_EAST[i - 2] : B_CH[i - 10], t = CH[c].v.map((n) => n + 12);
      const pat = [t[0], t[1], t[2], t[1], t[2], t[3], t[0], t[2], t[1], t[2]];
      const ev = pat.map((n, k) => E(i < 10 ? 'koto' : 'marimba', k * 0.5, 0.5, n, (k === 0 || k === 6 ? 0.3 : 0.2), { pan: k < 6 ? 0.25 : -0.25, press: false }));
      if (i >= 10) ev.push(...pat.filter((_, k) => k % 2 === 0).map((n, k) => E('pizz', k, 0.5, n - 12, 0.2)));
      ev.push(E('strings', 0, 5, CH[c].r + 12, 0.12, { attack: 0.4, bright: 1200 }), E('taiko', 0, 1, null, 0.36), E('taiko', 3, 1, null, 0.22, { size: 0.8 }));
      for (let b = 0.5; b < 5; b += 1) ev.push(E('shaker', b, 0.5, null, 0.08));
      if (i >= 2 && i < 10) ev.push(...tune('shakuhachi', five(A_EAST[i - 2]), 0.55));
      if (i >= 10) ev.push(...tune('flute', five(B[i - 10]), 0.5), ...tune('strings', five(B[i - 10]), 0.12, { attack: 0.15, bright: 2400 }, -12), ...pad(c, 0.07, 5));
      if (i === 14) for (let b = 3; b < 5; b += 0.25) ev.push(E('taiko', b, 0.25, null, 0.15 + (b - 3) * 0.15, { size: 0.9 }));
      return ev;
    } },
    // III. WILD: the five-chord cycle, wood and air and a pulse; the Five called and answered
    { id: 'wild', bars: 25, bpm: 125, gain: 1.5, bar: (i) => {
      const p = Math.floor(i / 5), c = CYCLE[i % 5], C = CH[c], t = (c === 'B7' ? [59, 66, 71, 75] : C.v.map((n) => n + 12));
      const ev = [];
      [0, 1, 2, 1, 3, 2, 1, 2, 0, 1, 2, 1, 3, 2, 3, 2].forEach((k, j) => ev.push(E('koto', j * 0.25, 0.25, t[k], j % 4 === 0 ? 0.2 : 0.12, { press: false, pan: j % 2 ? 0.3 : -0.1 })));
      for (let b = 0; b < 4; b += 0.5) ev.push(E('pizz', b, 0.5, C.r + 12, b % 1 ? 0.14 : 0.22));
      for (let b = 0.5; b < 4; b += 1) ev.push(E('shaker', b, 0.5, null, 0.08));
      ev.push(E('taiko', 0, 1, null, 0.42), E('taiko', 3.5, 0.5, null, 0.22, { size: 0.8 }));
      if (p >= 1) ev.push(E('strings', 0, 4, C.r + 12, 0.12, { attack: 0.12, bright: 900 }), E('sub', 0, 4, C.r, 0.16), E('kick', 0, 1, null, 0.3), E('kick', 2.5, 1, null, 0.2));
      if (p >= 2) { ev.push(E('clap', 1, 1, null, 0.28), E('clap', 3, 1, null, 0.32)); for (let b = 0; b < 4; b += 0.25) ev.push(E('hat', b, 0.25, null, b % 1 ? 0.04 : 0.08)); }
      if (p >= 3) for (let b = 0; b < 4; b += 1) ev.push(E('marimba', b + 0.5, 0.5, t[(b + i) % 4] + 12, 0.14));
      // the Five, called (East) and answered (West)
      if (p === 1) { if (i % 2 === 1) ev.push(...tune('shakuhachi', FIVE, 0.55)); else if (i !== 5) ev.push(...tune('brass', ANSWER, 0.3)); if (i === 9) ev.push(...tune('brass', ANSWER, 0.3)); }
      if (p === 2) ev.push(...tune('strings', [A[0], A[2], B[0], B[1], A[3]][i % 5], 0.2, { attack: 0.08, bright: 3000 }), ...tune('flute', [A[0], A[2], B[0], B[1], A[3]][i % 5], 0.35));
      if (p === 3) { if (i % 2 === 1) ev.push(...tune('shakuhachi', FIVE, 0.55)); else ev.push(...tune('harmonica', [B[0], B[2], B[4]][(i - 15) / 2 | 0] || B[0], 0.5)); if (i === 19) ev.push(E('harmonica', 0, 4, 78, 0.35, { bend: -1 })); }
      if (p === 4) ev.push(...tune('strings', [A[4], A[5], A[6], B[6], A[3]][i % 5], 0.22, { attack: 0.06, bright: 3400 }), ...tune('shakuhachi', [A_EAST[4], A_EAST[5], A_EAST[6], B[6], A_EAST[3]][i % 5], 0.4), ...pad(c, 0.08));
      return ev;
    } },
    // the BUILD: ten bars; the strings climb the hexachord (ut re mi fa sol la on G), the rolls, the filter opening, a breath
    { id: 'build', bars: 10, bpm: 125, gain: 1.5, sweep: [900, 16000], bar: (i) => {
      const c = ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'D', 'B7', 'B7'][i], C = CH[c], ev = [];
      const step = i < 2 ? 1 : i < 5 ? 0.5 : i < 8 ? 0.25 : 0.125;
      for (let b = 0; b < (i === 9 ? 2 : 4); b += step) ev.push(E('snare', b, step, null, 0.12 + (i * 4 + b) / 40 * 0.5, { tone: 180 + i * 18 + b * 5 }));
      if (i >= 7) for (let b = 0; b < (i === 9 ? 2 : 4); b += i >= 8 ? 0.25 : 0.5) ev.push(E('taiko', b, 0.5, null, 0.22 + (i - 7) * 0.08, { size: 0.9 }));
      if (i < 9) { ev.push(E('strings', 0, 4, C.r + 12, 0.12, { attack: 0.1, bright: 900 }), E('sub', 0, 4, C.r, 0.16), E('kick', 0, 1, null, 0.28)); for (let b = 0; b < 4; b += 0.5) ev.push(E('pizz', b, 0.5, C.r + 12, 0.18)); }
      if (i === 0) ev.push(E('riser', 0, 38, null, 0.3));
      // the hexachord climbing, a note a beat, octave after octave
      const HEX = [67, 69, 71, 72, 74, 76];
      if (i < 8) for (let b = 0; b < 4; b++) { const k = i * 4 + b; ev.push(E('strings', b, 1, HEX[k % 6] + 12 * Math.floor(k / 6) - 12, 0.16 + i * 0.015, { attack: 0.05, bright: 3200 })); }
      if (i >= 8) ev.push(...C.v.map((n) => E('brass', 0, i === 9 ? 2 : 4, n + 12, 0.3)), E('strings', 0, i === 9 ? 2 : 4, [75, 78, 83], 0.2, { attack: 0.3 }));
      if (i === 6) ev.push(E('shakuhachi', 0, 12, 76, 0.5, { bend: 2 }));
      if (i === 9) ev.push(E('breath', 2, 2, null, 0.4));
      return ev;
    } },
    // IV. FORTUNE: B, then A, in the whole band; the tag climbs and leaps the octave; the E6 sings over the fall
    { id: 'fortune', bars: 25, bpm: 125, pump: true, gain: 1.6, bar: (i) => {
      const part = i < 8 ? 'B' : i < 16 ? 'A' : i < 20 ? 'TAG' : 'FALL', k = part === 'B' ? i : part === 'A' ? i - 8 : part === 'TAG' ? i - 16 : i - 20;
      const c = part === 'B' ? B_CH[k] : part === 'A' ? A_CH[k] : part === 'TAG' ? TAG_CH[k] : FALL_CH[k], C = CH[c];
      const mel = part === 'B' ? B[k] : part === 'A' ? A[k] : part === 'TAG' ? TAG[k] : FALL[k];
      const ev = [];
      if (i === 0 || i === 8 || i === 16) ev.push(E('impact', 0, 1, null, i === 0 ? 0.6 : 0.4));
      // the slam: E5 to E6 on beat two of the last tag bar, everything at once
      if (part === 'TAG' && k === 3) ev.push(E('impact', 1, 1, null, 0.8), E('crash', 1, 1, null, 0.6), ...CH.Em.v.map((n) => E('brass', 1, 3, n + 12, 0.42)), E('taiko', 1, 1, null, 0.8));
      // the melody: strings in octaves, flute above, brass below, the guitar singing it, the shakuhachi in the counter-line
      ev.push(...tune('strings', mel, 0.24, { attack: 0.05, bright: 3800 }), ...tune('strings', mel, 0.16, { attack: 0.05, bright: 2600 }, -12));
      ev.push(...tune('flute', mel, 0.32), ...tune('brass', mel, 0.2, {}, -12), ...tune('guitar', mel, 0.42, { vib: 0.025 }));
      if (part !== 'FALL') ev.push(E('shakuhachi', 0, 4, C.v[3] + 12, 0.28, { scoop: 0 }));
      // the harmony and the ground
      ev.push(...pad(c, 0.16), E('supersaw', 0, 4, C.v.slice(1).map((n) => n + 12), 0.12, { cutoff: 3600 }), E('strings', 0, 4, [C.r + 12, C.r + 24], 0.14, { attack: 0.08, bright: 1100 }), E('sub', 0, 4, C.r, 0.22));
      if (part !== 'FALL' || k === 0) {
        ev.push(E('kick', 0, 1, null, 0.34), E('kick', 2, 1, null, 0.28), E('snare', 1, 1, null, 0.36), E('snare', 3, 1, null, 0.4), E('taiko', 0, 1, null, 0.45), E('taiko', 1.5, 0.5, null, 0.26, { size: 0.8 }), E('taiko', 3.5, 0.5, null, 0.26, { size: 0.8 }));
        for (let b = 0; b < 4; b += 0.5) ev.push(E('hat', b, 0.25, null, b % 1 ? 0.07 : 0.11));
        if (i >= 8) ev.push(...C.v.slice(1).map((n) => E('brass', 0, 0.5, n + 12, 0.24, { stab: true })), ...C.v.slice(1).map((n) => E('brass', 2.5, 0.5, n + 12, 0.2, { stab: true })));
      } else { ev.push(E('taiko', 0, 1, null, 0.35 - k * 0.05)); for (let b = 0; b < 4; b++) ev.push(E('piano', b, 1, C.arp[b * 2] + 12, 0.25)); }
      return ev;
    } },
    // V. RETURN: the piano and the flute; E major at the end, and the Five's answer up to the octave on the celesta
    { id: 'return', bars: 10, bpm: 75, bar: (i) => {
      if (i < 8) return [...arp(A_CH[i], 0.26), ...tune(i < 4 ? 'flute' : 'piano', A[i], i < 4 ? 0.42 : 0.45, { pedal: 0.3 }, i < 4 ? 0 : 12), ...(i >= 4 ? pad(A_CH[i], 0.05) : [])];
      if (i === 8) return [...arp('EM', 0.28), E('flute', 0, 4, 76, 0.4), ...pad('EM', 0.08)];
      return [E('piano', 0, 4, 28, 0.35, { pedal: 2 }), E('piano', 0, 4, 40, 0.3, { pedal: 2 }), ...[76, 80, 81, 83, 88].map((n, k) => E('celesta', k * 0.5, 1, n, 0.28)), E('bell', 3, 1, 76, 0.3), ...pad('EM', 0.06, 4, { attack: 1 })];
    } },
  ],
};
