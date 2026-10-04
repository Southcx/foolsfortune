// ---------------------------------------------------------------------------------------
// THE NOTE CHART: what the rhythm mode asks you to play, drawn from a score's own notes (src/music/), never authored by hand, so every
// cue in the soundtrack is playable the day it is written. A score is baked once (every bar's events, called once, in order, played
// straight through with no loop); in each section the LEAD is found (the instrument with the most single notes, high and varied: the
// sax in Kindling, the sitar in The Edge of the Word, the shakuhachi, the steel pan); its notes become the note chart, one at a time
// (no chords: cheap keyboards jam on some three-key combinations), each on the LANE of its nearest degree of the Crucibelle's scale
// (the minor pentatonic of the score's root, tools/crucibelle/songs.js): lanes 1 to 5 the lower octave, 6 to 0 the upper. The same
// note is always the same key, and a climbing tune climbs the keys. The charted notes are taken out of the backing (the player
// plays them: a miss leaves a hole in the tune); the notes a lighter level leaves out stay in the backing.
//
// LEVELS thin the chart without rewriting it: LIGHT keeps notes on the beat, a beat apart; STEADY keeps the eighths, half a beat
// apart; FULL keeps every note a quarter of a beat apart or more.
//
// Prior art: StepMania's and DDR's charts and their difficulty ladder (the same song, fewer steps), Guitar Hero and Rock Band (the
// lead is the player's, and a miss drops it out of the mix), the auto-charters of osu! and Beat Saber's mappers' tools (notes drawn
// from the music's onsets), and the Crucibelle's own pentatonic (on which nothing is wrong).
//
//   const C = noteChart(score, { level: 'steady' })   C.notes: [{ t, lane, midi, i, d, v, o, g }]   C.backing (a score to play)
//   C.length (seconds)   C.countIn (seconds before the first bar)   LANES (10)   KEYS: lane -> key code
// ---------------------------------------------------------------------------------------
export const LANES = 10;
export const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
const SCALE = [0, 3, 5, 7, 10]; // (the Crucibelle's: tools/crucibelle/songs.js SCALE)
const PERC = new Set(['kick', 'snare', 'clap', 'hat', 'shaker', 'crash', 'impact', 'taiko', 'ride', 'brush', 'hammer', 'stomp', 'huh', 'scrape',
  'bongo', 'timbale', 'tabla', 'bodhran', 'bubble', 'riser', 'breath', 'bigkick', 'bigsnare', 'tom', 'gang']);
const BED = new Set(['pad', 'strings', 'hum', 'sub', 'tanpura', 'supersaw', 'upright', 'moog', 'pizz', 'growl', 'chug', 'pick']); // (beds and basses: never the lead)
export const LEVELS = { light: { grid: 1, gap: 1 }, steady: { grid: 0.5, gap: 0.5 }, full: { grid: 0, gap: 0.25 } };
const COUNT_IN = 1; // (bars of count-in before the music: four clicks to find the beat)

/** Every bar of the score, its events called once, with each bar's start in seconds; the score played straight through. */
function bake(score) {
  const bars = []; let t = 0;
  score.sections.forEach((sec, si) => {
    const spb = 60 / (sec.bpm || score.bpm), beats = sec.beats || score.beats || 4;
    for (let i = 0; i < sec.bars; i++) { bars.push({ si, i, t, spb, beats, events: sec.bar(i) || [] }); t += spb * beats; }
  });
  return { bars, length: t };
}

/** The section's lead: the instrument that sings, not the one that keeps time. Only its single notes count (a chord's notes start
 *  together); the tune is the high one, with the most pitches, whose bars differ from each other (an ostinato repeats its bar). */
function leadOf(bars) {
  const by = new Map();
  for (const B of bars) {
    const at = new Map(); // (instrument -> beat -> notes starting there)
    for (const e of B.events) {
      if (PERC.has(e.i) || BED.has(e.i) || typeof e.n !== 'number') continue;
      const m = at.get(e.i) || new Map(); m.set(e.b, (m.get(e.b) || []).concat(e)); at.set(e.i, m);
    }
    for (const [i, m] of at) {
      const r = by.get(i) || { n: 0, sum: 0, pitches: new Set(), shapes: new Set() };
      const solo = [...m.values()].filter((l) => l.length === 1).map((l) => l[0]);
      for (const e of solo) { r.n++; r.sum += e.n; r.pitches.add(e.n); }
      if (solo.length) r.shapes.add(solo.map((e) => `${e.b}:${e.n}`).join(' '));
      by.set(i, r);
    }
  }
  let best = null, bestScore = 0;
  for (const [i, r] of by) {
    if (r.n < 3) continue;
    const s = Math.sqrt(r.n) * r.pitches.size * r.shapes.size * (r.sum / r.n >= 62 ? 1 : 0.4);
    if (s > bestScore) { bestScore = s; best = i; }
  }
  return best;
}

/** A note's degree of the Crucibelle's scale (0..4) and its octave, from the score's root. */
function degreeOf(midi, root) {
  const rel = Math.round(midi) - root; let o = Math.floor(rel / 12), r = rel - 12 * o;
  let deg = 0, best = 99;
  [...SCALE, 12].forEach((s, k) => { if (Math.abs(r - s) < best) { best = Math.abs(r - s); deg = k; } });
  if (deg === 5) { deg = 0; o++; }
  return { deg, o };
}

export function noteChart(score, { level = 'steady' } = {}) {
  const L = LEVELS[level] || LEVELS.steady, root = score.root ?? 63, { bars, length } = bake(score);
  // the lead of each section, and its notes (one at a time: of two that start together, the higher)
  const picked = [];
  score.sections.forEach((sec, si) => {
    const mine = bars.filter((B) => B.si === si), lead = sec.lead ?? leadOf(mine); // (a score may name its lead; it is found if not)
    if (!lead) return;
    for (const B of mine) for (const e of B.events) if (e.i === lead && typeof e.n === 'number') picked.push({ B, e, t: B.t + e.b * B.spb, g: sec.gain ?? 1 });
  });
  picked.sort((a, b) => a.t - b.t || b.e.n - a.e.n);
  // the level's thinning: on its grid, and a gap apart
  const kept = []; let last = -99;
  for (const p of picked) {
    const beat = p.e.b, spb = p.B.spb;
    if (kept.length && Math.abs(p.t - kept[kept.length - 1].t) < 1e-4) continue; // (no chords)
    if (L.grid && Math.abs(beat / L.grid - Math.round(beat / L.grid)) > 1e-3) continue;
    if (p.t - last < L.gap * spb - 1e-4) continue;
    kept.push(p); last = p.t;
  }
  // the lanes: degrees of the scale, the lower octave of the line on 1-5 and the upper on 6-0
  const octs = kept.map((p) => degreeOf(p.e.n, root).o).sort((a, b) => a - b);
  const base = octs.length ? octs[Math.floor(octs.length * 0.25)] : 0;
  const countIn = (bars[0]?.spb ?? 0.5) * (bars[0]?.beats ?? 4) * COUNT_IN;
  const notes = kept.map((p) => {
    const { deg, o } = degreeOf(p.e.n, root);
    return { t: countIn + p.t, lane: deg + (o > base ? 5 : 0), midi: p.e.n, i: p.e.i, d: (p.e.d || 1) * p.B.spb, v: p.e.v ?? 0.5, o: p.e.o || {}, g: p.g };
  });
  // the backing: the score as baked, a count-in first, the charted notes taken out (the player plays them)
  const charted = new Set(kept.map((p) => p.e));
  const first = bars[0] || { spb: 0.5, beats: 4 };
  const backing = {
    title: score.title, root, bpm: score.bpm, beats: score.beats, arrange: true, loopFrom: null, tail: score.tail ?? 3,
    sections: [
      { id: 'count', bars: COUNT_IN, bpm: 60 / first.spb, beats: first.beats, gain: 1, bar: () => Array.from({ length: first.beats }, (_, k) => ({ i: 'hat', b: k, d: 1, v: k ? 0.18 : 0.3 })) },
      ...score.sections.map((sec, si) => {
        const mine = bars.filter((B) => B.si === si);
        return { ...sec, bar: (i) => mine[i].events.filter((e) => !charted.has(e)) };
      }),
    ],
  };
  return { notes, backing, length: countIn + length, countIn, level };
}
