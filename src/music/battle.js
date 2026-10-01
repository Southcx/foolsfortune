// ---------------------------------------------------------------------------------------
// "FIVE AGAINST FATE": the battle. Big-band jazz with hands on skins, on the black keys (E flat minor, the main theme's key:
// music/lachryma.js), at 150 (the ladder's danger step). The bass riff is the Five falling in eighth notes (E flat, D flat, B flat,
// A flat, G flat) and climbing back, and never stops; the brass stabs on the off-beats, the bongos and a timbale talk over the ride,
// the taiko marks each fifth bar; the soprano sax solos the pentatonic over A flat minor and B flat seven; then the brass shout
// the Five in sixteenths, and a two-bar break with only the drums before it goes round again.
//
//   INTRO   2 bars: the bongos and the riff     A  8 bars: the riff, stabs, backbeat     B  8 bars: the sax over Abm7 | Bb7#9
//   C       8 bars: the brass shout (the Five in diminution)                              BREAK  2 bars: drums alone, a crash
// It loops from A. About forty-five seconds a time round: a fight is short, and the music should be over before it is old.
//
// Prior art: Yoko Kanno's "Tank!" (Cowboy Bebop: a walking bass ostinato, brass shouts, bongos, a sax), the big-band battle themes
// of Persona and of Hiroki Kikuta (a jazz rhythm section under a fight), and Koji Kondo's rule that the battle plays the main
// motif faster (here the Five, in eighths and sixteenths).
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

// the riff: the Five falling in the bass, and back up
const RIFF = [[0, 39], [0.5, 51], [1, 49], [1.5, 46], [2, 44], [2.5, 42], [3, 46], [3.5, 49]];
const RIFF_AB = [[0, 44], [0.5, 56], [1, 54], [1.5, 51], [2, 46], [2.5, 46 + 12], [3, 44 + 12], [3.5, 41]];
const STAB = { Ebm7: [63, 66, 70, 73], Abm7: [63, 66, 68, 71], Bb7: [62, 66, 68, 73], Gb: [66, 70, 73, 77] };
// the shout: the Five in sixteenths, falling, then the answer climbing
const FIVE = [87, 85, 82, 80, 78], ANS = [78, 80, 82, 85, 87];

const drums = (v, bar, busy = true) => {
  const ev = [E('ride', 0, 0.2, null, 0.3 * v), E('ride', 1, 0.2, null, 0.3 * v), E('ride', 1.66, 0.2, null, 0.2 * v), E('ride', 2, 0.2, null, 0.3 * v), E('ride', 3, 0.2, null, 0.3 * v), E('ride', 3.66, 0.2, null, 0.2 * v),
    E('snare', 1, 0.5, null, 0.32 * v), E('snare', 3, 0.5, null, 0.36 * v), E('kick', 0, 0.5, null, 0.3 * v), E('kick', 2.5, 0.5, null, 0.22 * v), E('hat', 1, 0.1, null, 0.08 * v), E('hat', 3, 0.1, null, 0.08 * v)];
  if (busy) for (const [b, hi] of [[0.5, 1], [0.75, 0], [1.5, 1], [2.5, 1], [2.75, 0], [3.25, 1], [3.5, 0]]) ev.push(E('bongo', b, 0.2, null, (hi ? 0.32 : 0.36) * v, { hi: !!hi }));
  if (bar % 5 === 0) ev.push(E('taiko', 0, 1, null, 0.45 * v));
  if (bar % 4 === 3) ev.push(E('timbale', 3.5, 0.3, null, 0.3 * v), E('timbale', 3.75, 0.3, null, 0.26 * v));
  return ev;
};
const riff = (line, v) => line.map(([b, n]) => E('upright', b, 0.45, n, b % 1 ? v * 0.8 : v));
const stabs = (c, v) => [1.5, 3.5].flatMap((b) => STAB[c].map((n) => E('brass', b, 0.4, n, v, { stab: true })));

export const BATTLE = {
  title: 'Five Against Fate', bpm: 150, arrange: true, loopFrom: 1, pumpDepth: 0.85,
  sections: [
    { id: 'intro', bars: 2, gain: 0.8, bar: (i) => [...riff(RIFF, 0.5), ...[0, 0.5, 0.75, 1.5, 2, 2.5, 2.75, 3.25, 3.5].map((b, k) => E('bongo', b, 0.2, null, 0.3 + (k % 3) * 0.05, { hi: k % 2 === 0 })), ...(i === 1 ? [E('timbale', 3, 0.3, null, 0.35), E('timbale', 3.5, 0.3, null, 0.35)] : [])] },
    { id: 'a', bars: 8, gain: 1.3, bar: (i) => {
      const ev = [...drums(1, i), ...riff(RIFF, 0.52), ...stabs(i % 4 === 3 ? 'Gb' : 'Ebm7', 0.24)];
      if (i === 0) ev.push(E('crash', 0, 1, null, 0.35), E('impact', 0, 1, null, 0.35));
      if (i % 2 === 1) ev.push(E('rhodes', 0, 1.5, 61, 0.15), E('rhodes', 0, 1.5, 65, 0.15), E('rhodes', 0, 1.5, 66, 0.15));
      return ev;
    } },
    { id: 'b', bars: 8, gain: 1.3, bar: (i) => {
      const ab = i % 2 === 0, ev = [...drums(1, i), ...riff(ab ? RIFF_AB : RIFF, 0.5), ...stabs(ab ? 'Abm7' : 'Bb7', 0.2)];
      // the sax: pentatonic phrases, a long note bent at the end of each pair of bars
      const P = [[[0, 0.5, 78], [0.5, 0.5, 80], [1, 0.5, 82], [1.5, 1, 85], [2.5, 0.5, 82], [3, 1, 80]], [[0, 1, 78], [1, 0.5, 75], [1.5, 0.5, 73], [2, 2, 75, 1]],
        [[0, 0.5, 85], [0.5, 0.5, 87], [1, 1, 85], [2, 0.5, 82], [2.5, 0.5, 80], [3, 1, 78]], [[0, 0.5, 80], [0.5, 0.5, 78], [1, 0.5, 75], [1.5, 0.5, 73], [2, 2, 70, -1]]][i % 4];
      ev.push(...P.map(([b, d, n, bend]) => E('sax', b, d, n, 0.48, bend ? { bend } : {})));
      return ev;
    } },
    { id: 'c', bars: 8, gain: 1.4, bar: (i) => {
      const ev = [...drums(1.1, i), ...riff(RIFF, 0.55)];
      // the shout: the Five, falling in sixteenths, the answer climbing; in the brass in octaves, the guitar doubling the last bars
      const line = i % 2 === 0 ? FIVE : ANS, start = i % 4 < 2 ? 0 : 2;
      line.forEach((n, k) => { ev.push(E('brass', start + k * 0.25, 0.3, n, 0.36, { stab: true }), E('brass', start + k * 0.25, 0.3, n - 12, 0.28, { stab: true })); });
      ev.push(E('brass', start + 1.25, start ? 0.7 : 2.7, line[4], 0.4), ...STAB[i % 4 === 3 ? 'Bb7' : 'Ebm7'].map((n) => E('brass', start ? 0 : 3, 0.5, n, 0.22, { stab: true })));
      if (i >= 6) ev.push(E('guitar', start, 2, line[4] - 12, 0.3, { vib: 0.03 }));
      return ev;
    } },
    { id: 'break', bars: 2, gain: 2.2, bar: (i) => {
      const ev = [E('kick', 0, 0.5, null, 0.35), E('snare', 0.5, 0.3, null, 0.3), E('kick', 1.5, 0.5, null, 0.3), E('snare', 2, 0.3, null, 0.34), E('taiko', 3, 1, null, 0.5)];
      for (let b = 0; b < 4; b += 0.25) ev.push(E('bongo', b, 0.15, null, 0.2 + (b % 1) * 0.15, { hi: (b * 4) % 2 === 0 }));
      if (i === 1) ev.push(...[3, 3.25, 3.5, 3.75].map((b) => E('snare', b, 0.2, null, 0.25 + (b - 3) * 0.4)), E('timbale', 3.75, 0.2, null, 0.4));
      return ev;
    } },
  ],
};
