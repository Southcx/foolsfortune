// ---------------------------------------------------------------------------------------
// "THE WORKSHOP" (Toil): what the clay workshop sounds like while the work goes on. A work song: slow (75, the ladder's resting
// step), a hammer on one and a foot on three, a breath drawn before each blow ("huh"), a washboard scraping the time between, and
// over it voices that hum a line and voices that answer it, in the twelve bars of the blues in E, with the flat five (B flat) for
// the blue note. A harmonica takes the second chorus and a slide guitar fills the gaps; the third, everyone. Nothing hurries.
//
//   DAWN       4 bars: the hammer and the foot alone, a hum on E, the day starting
//   CHORUS 1   12 bars: a lead voice hums the call, the others answer ("aah") on the chord
//   CHORUS 2   12 bars: the harmonica calls, the voices answer, the slide guitar between
//   CHORUS 3   12 bars: all of it, the upright walking, the answers fuller
// It loops from the first chorus. About two minutes a time round.
//
// Prior art: the work songs of the American South, sung to keep a gang's hammers together, where the blues began (the field hollers
// and gang songs Alan Lomax recorded, "Take This Hammer", "Rosie"): call and response, the tool as the drum, the breath on the
// stroke; and the country blues that grew from them (the slide guitar, the harmonica, the twelve-bar form). Taken here as a sound for
// labour, made with care: the weariness and the steadiness, not a costume.
// ---------------------------------------------------------------------------------------
const E = (i, b, d, n, v, o) => ({ i, b, d, n, v, o });

// the twelve bars: E7, A7, B7 (the voicings for the answers: three voices; the bass root)
const CH = { E: { r: 40, v: [56, 59, 62], ans: [64, 67, 71] }, A: { r: 45, v: [55, 61, 64], ans: [64, 69, 72] }, B: { r: 47, v: [57, 63, 66], ans: [63, 66, 71] } };
const BLUES = ['E', 'E', 'E', 'E', 'A', 'A', 'E', 'E', 'B', 'A', 'E', 'B'];
// the call (bars 1-2, 5-6, 9-10, 12): a line in E minor pentatonic, the blue note B flat leaning down to A
const CALL = {
  0: [[0, 1.5, 76], [1.5, 0.5, 74], [2, 2, 71]],
  1: [[0, 1, 69], [1, 1, 67], [2, 2, 64]],
  4: [[0, 1.5, 76], [1.5, 0.5, 74], [2, 1, 72], [3, 1, 69]],
  5: [[0, 2, 67], [2, 2, 69]],
  8: [[0, 2, 71], [2, 2, 70]],
  9: [[0, 2, 69], [2, 2, 67]],
  11: [[0, 1, 71], [1, 1, 70], [2, 1, 69], [3, 1, 67]],
};
const ANSWER = new Set([2, 3, 6, 7, 10]); // (the bars the voices answer in)

const tune = (inst, notes, v, o = {}, shift = 0) => notes.map(([b, d, n]) => E(inst, b, d, n + shift, v, o));
/** The work itself: the hammer on one, the foot on three, a breath before each blow, the washboard between (swung). */
const work = (v, scrape = true) => {
  const ev = [E('huh', -0.12 + 0.0001, 0.2, null, 0.18 * v), E('hammer', 0, 1, null, 0.55 * v), E('stomp', 2, 0.5, null, 0.55 * v)];
  if (scrape) for (const b of [0.66, 1, 1.66, 2.66, 3, 3.66]) ev.push(E('scrape', b, 0.1, null, (b % 1 ? 0.12 : 0.18) * v));
  return ev;
};

export const WORKSHOP = {
  title: 'The Workshop', bpm: 75, arrange: true, loopFrom: 1, pumpDepth: 1,
  sections: [
    { id: 'dawn', bars: 4, gain: 1, bar: (i) => {
      const ev = work(0.6 + i * 0.1, i >= 2);
      ev.push(E('hum', 0, 4, [52, 59], 0.1 + i * 0.03, { attack: 1.5 }), E('upright', 0, 3.8, 40, 0.3));
      return ev;
    } },
    ...[1, 2, 3].map((n) => ({ id: `chorus${n}`, bars: 12, gain: 0.95 + n * 0.08, bar: (i) => {
      const k = BLUES[i], C = CH[k], ev = work(1, true);
      // the bass: a drone in the first chorus, walking after
      if (n === 1) ev.push(E('upright', 0, 1.9, C.r, 0.45), E('upright', 2, 1.9, C.r, 0.38));
      else { const next = CH[BLUES[(i + 1) % 12]].r; ev.push(...[C.r, C.r + 4, C.r + 7, next + (next > C.r ? -1 : 1)].map((m, j) => E('upright', j, 0.9, m, j ? 0.36 : 0.46))); }
      // the call: a voice (1), the harmonica (2), the harmonica and the voice together (3)
      const call = CALL[i];
      if (call) {
        if (n === 1 || n === 3) ev.push(...tune('hum', call.map(([b, d, m]) => [b, d, m]), n === 3 ? 0.28 : 0.32, { attack: 0.08 }));
        if (n >= 2) ev.push(...tune('harmonica', call, n === 3 ? 0.36 : 0.42, { blue: true }, -12));
      }
      // the answer: the voices on the chord, open; in the third chorus, an octave of them
      if (ANSWER.has(i)) {
        ev.push(E('hum', 0, 3.6, C.ans, 0.2 + n * 0.03, { open: true, attack: 0.15 }));
        if (n === 3) ev.push(E('hum', 0, 3.6, C.ans.map((m) => m - 12), 0.12, { open: true, attack: 0.15 }));
      }
      // the slide guitar between the lines
      if (n >= 2 && ANSWER.has(i)) ev.push(E('guitar', 2.5, 1.5, [71, 69, 67, 64, 71][i % 5], 0.22, { from: -2, bendAt: 0.05, vib: 0.012 }));
      // the turnaround's last breath
      if (i === 11) ev.push(E('huh', 3.5, 0.2, null, 0.12));
      return ev;
    } })),
  ],
};
