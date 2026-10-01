// ---------------------------------------------------------------------------------------
// THE SYNTHESIZER: text to a waveform, from first principles. No samples, no voices from anywhere: a source (the glottis: a train of
// pulses at the pitch, and noise for breath and hiss) shaped by a vocal tract (resonators at the formant frequencies), which is how
// speech was made by machine before it was recorded (DECtalk, MITalk, the Votrax, SAM). It is the System's own voice.
//
//  - PHONEMES: each ARPAbet phoneme has its formant targets (F1 F2 F3, after Klatt's 1980 table, raised a little for a lighter
//    voice), its inherent and minimum durations (Klatt's duration model), and how it is sounded: voiced, aspirated, fricated (the hiss
//    of S or SH has its own resonances, in parallel), stopped (a closure, a burst, then aspiration), or nasal (a pole and a zero).
//  - PROSODY: durations stretch for stress and at the end of a phrase and shrink in clusters and unstressed syllables; the pitch falls
//    through each phrase (declination), rises on the stressed syllable of each content word, and falls at the end. Commas and stops
//    are pauses.
//  - RENDERING: parameters every 5 ms, interpolated (formants glide between targets, so consonants colour their vowels); per sample, a
//    KLGLOTT88 glottal pulse and noise through a cascade of five resonators (with a nasal pole-zero pair), plus the fricative branch.
//
// Prior art: Dennis Klatt, "Software for a cascade/parallel formant synthesizer" (JASA 1980) and Klatt & Klatt's KLGLOTT88 voicing
// source (1990); Klatt's duration rules (1979); Allen, Hunnicutt & Klatt, "From Text to Speech: the MITalk system" (1987); the
// "hat pattern" of English intonation ('t Hart, Collier & Cohen). The lexicon is lexicon.js.
//
//   synthesize(text, { f0, rate, brightness }) -> { samples: Float32Array, fs }
// ---------------------------------------------------------------------------------------
import { phonesOf } from './lexicon.js';

export const FS = 22050;
const FRAME = 0.005;
export const TUNE = { tilt: 0.6, hh: 0.2, fric: 1.0, asp: 0.035, shelf: 2, b4: 200, b5: 260, avRamp: 0.8, gap: 0, burst: 1.0, aspAmp: 0.5, oq: 0.7, b1: 90, nonFinal: 0.45 }; // (tuned against an offline recognizer: see the README)
let TILT = 0.8;

// t: v vowel, d diphthong, n nasal, l liquid, g glide, f voiceless fricative, z voiced fricative, s voiceless stop, b voiced stop,
//    c voiceless affricate, j voiced affricate, h aspirate, x flap
// f: formant targets (F1 F2 F3); f2: a diphthong's second target; d: [inherent, minimum] ms; fr: fricative resonances [fc, bw, gain]
const P = {
  IY: { t: 'v', f: [310, 2020, 2960], d: [155, 55] }, IH: { t: 'v', f: [400, 1800, 2570], d: [135, 40] },
  EH: { t: 'v', f: [530, 1680, 2500], d: [150, 70] }, AE: { t: 'v', f: [620, 1660, 2430], d: [230, 80] },
  AA: { t: 'v', f: [700, 1220, 2600], d: [240, 100] }, AO: { t: 'v', f: [600, 990, 2570], d: [240, 100] },
  AH: { t: 'v', f: [620, 1220, 2550], d: [140, 60] }, UH: { t: 'v', f: [450, 1100, 2350], d: [160, 60] },
  UW: { t: 'v', f: [330, 1000, 2250], d: [210, 70] }, ER: { t: 'v', f: [470, 1270, 1540], d: [180, 80] },
  AX: { t: 'v', f: [550, 1360, 2470], d: [120, 60] }, AXR: { t: 'v', f: [480, 1340, 1600], d: [120, 60] }, IX: { t: 'v', f: [420, 1720, 2550], d: [110, 40] },
  EY: { t: 'd', f: [480, 1720, 2520], f2: [330, 2200, 2700], d: [190, 100] }, AY: { t: 'd', f: [660, 1200, 2550], f2: [400, 1880, 2500], d: [250, 150] },
  AW: { t: 'd', f: [640, 1230, 2550], f2: [420, 940, 2350], d: [260, 100] }, OW: { t: 'd', f: [540, 1100, 2300], f2: [450, 900, 2300], d: [220, 80] },
  OY: { t: 'd', f: [550, 960, 2400], f2: [360, 1820, 2450], d: [280, 150] },
  L: { t: 'l', f: [330, 1050, 2800], d: [80, 40] }, R: { t: 'l', f: [310, 1060, 1380], d: [80, 30] },
  W: { t: 'g', f: [290, 610, 2150], d: [80, 60] }, Y: { t: 'g', f: [260, 2070, 3020], d: [80, 40] },
  M: { t: 'n', f: [280, 1100, 2150], d: [70, 50] }, N: { t: 'n', f: [280, 1650, 2600], d: [60, 30] }, NG: { t: 'n', f: [280, 2200, 2700], d: [95, 60] },
  HH: { t: 'h', d: [80, 20] },
  F: { t: 'f', f: [300, 1100, 2150], d: [100, 80], fr: [[6500, 4000, 0.25]] }, TH: { t: 'f', f: [300, 1400, 2700], d: [90, 60], fr: [[5500, 3500, 0.22]] },
  S: { t: 'f', f: [300, 1700, 2600], d: [105, 60], fr: [[5800, 1400, 1.0], [7800, 2200, 0.6]] }, SH: { t: 'f', f: [300, 1840, 2750], d: [105, 80], fr: [[2800, 700, 0.9], [4200, 1600, 0.6]] },
  V: { t: 'z', f: [300, 1100, 2150], d: [60, 40], fr: [[6500, 4000, 0.18]] }, DH: { t: 'z', f: [300, 1400, 2700], d: [50, 30], fr: [[5500, 3500, 0.15]] },
  Z: { t: 'z', f: [300, 1700, 2600], d: [75, 40], fr: [[5800, 1400, 0.6], [7800, 2200, 0.35]] }, ZH: { t: 'z', f: [300, 1840, 2750], d: [70, 40], fr: [[2800, 700, 0.6], [4200, 1600, 0.4]] },
  P: { t: 's', f: [250, 1000, 2150], d: [90, 50], fr: [[1200, 2500, 0.35]] }, T: { t: 's', f: [250, 1700, 2600], d: [75, 50], fr: [[4200, 2000, 0.8]] },
  K: { t: 's', f: [280, 1900, 2600], d: [80, 60], fr: [[2200, 900, 0.8]] },
  B: { t: 'b', f: [250, 1000, 2150], d: [85, 60], fr: [[1200, 2500, 0.2]] }, D: { t: 'b', f: [250, 1700, 2600], d: [75, 50], fr: [[4200, 2000, 0.45]] },
  G: { t: 'b', f: [280, 1900, 2600], d: [80, 60], fr: [[2200, 900, 0.45]] },
  CH: { t: 'c', f: [300, 1840, 2750], d: [120, 70], fr: [[2800, 700, 0.9], [4200, 1600, 0.6]] }, JH: { t: 'j', f: [300, 1840, 2750], d: [95, 60], fr: [[2800, 700, 0.55], [4200, 1600, 0.35]] },
  DX: { t: 'x', f: [300, 1700, 2600], d: [22, 20] },
};
const FRONT = new Set(['IY', 'IH', 'EY', 'EH', 'AE', 'Y', 'IX']);
const SONORANT = new Set(['v', 'd', 'l', 'g', 'n']);
const FUNCTION = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'your', 'you', 'it', 'its', 'as', 'and', 'or', 'but', 'will', 'this', 'that', 'by', 'from', 'so', 'than', 'into']);
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function spellNumber(n) {
  if (n < 20) return NUM[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${NUM[n % 10]}` : ''}`;
  if (n < 1000) return `${NUM[Math.floor(n / 100)]} hundred${n % 100 ? ` ${spellNumber(n % 100)}` : ''}`;
  if (n < 1e6) return `${spellNumber(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${spellNumber(n % 1000)}` : ''}`;
  return String(n).split('').map((d) => NUM[+d]).join(' ');
}

// ---------------------------------------------------------------- text -> segments (phonemes with durations, stress, accents)
function plan(text, rate) {
  const toks = text.replace(/(\d+)/g, (m) => ` ${spellNumber(+m)} `).split(/(\s+|[,;:.!?]|-)/).filter((x) => x && x.trim() && x !== '-');
  const segs = [];
  let phraseStart = 0;
  const endPhrase = (pause) => {
    // phrase-final lengthening: the last syllable (its vowel and what follows it)
    let lastV = -1;
    for (let i = segs.length - 1; i >= phraseStart; i--) if (segs[i].vowel) { lastV = i; break; }
    if (lastV >= 0) for (let i = lastV; i < segs.length; i++) { segs[i].dur *= 1.35; segs[i].final = true; }
    segs.push({ ph: '_', t: 'p', dur: pause, phraseEnd: true });
    phraseStart = segs.length;
  };
  let wi = 0;
  for (const tok of toks) {
    if (/^[.!?]$/.test(tok)) { endPhrase(380); continue; }
    if (/^[,;:]$/.test(tok)) { endPhrase(220); continue; }
    const word = tok.toLowerCase();
    const fn = FUNCTION.has(word);
    const ph = phonesOf(word);
    const w = wi++;
    ph.forEach((sym, k) => {
      const m = sym.match(/^([A-Z]+)(\d)?$/);
      if (!m) return;
      let base = m[1], st = m[2] === undefined ? -1 : +m[2];
      if (fn && st > 0) st = 0;
      if (base === 'AH' && st === 0) base = 'AX';
      if (base === 'ER' && st === 0) base = 'AXR';
      if (base === 'IH' && st === 0) base = 'IX';
      const d = P[base];
      if (!d) return;
      const vowel = st >= 0;
      let pct = 1;
      if (vowel) pct = st === 1 ? 1 : st === 2 ? 0.75 : 0.5;
      else {
        const prevC = k > 0 && !/\d$/.test(ph[k - 1]), nextC = k < ph.length - 1 && !/\d$/.test(ph[k + 1]);
        if (prevC || nextC) pct = 0.7;
        if (k > 0 && !(k === 0)) pct *= 0.85;
      }
      const dur = (d.d[1] + (d.d[0] - d.d[1]) * pct) * (fn ? 0.85 : 1) / rate;
      segs.push({ ph: base, t: d.t, def: d, dur, stress: st, vowel, accent: vowel && st === 1 && !fn, word: w, initial: k === 0 });
    });
    if (TUNE.gap > 0) segs.push({ ph: '_', t: 'p', dur: TUNE.gap, gap: true }); // (space between words: none, as speech runs on)
  }
  if (segs.length && !segs[segs.length - 1].phraseEnd) endPhrase(250);
  // Klatt's non-final shortening: a vowel that is not in the last syllable of its phrase keeps only part of its length
  for (const s of segs) if (s.vowel && !s.final) s.dur = s.def.d[1] + (s.dur - s.def.d[1]) * TUNE.nonFinal;
  // a voiceless stop before a vowel is aspirated (its voice onset waits); before a stressed one, longer
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s.t !== 's' && s.t !== 'c') continue;
    let n = i + 1; while (segs[n]?.gap) n++;
    const nx = segs[n];
    s.asp = nx && SONORANT.has(nx.t) ? (nx.stress === 1 ? 55 : 30) : 0;
    s.dur += s.asp;
  }
  // a front vowel pulls a velar's locus forward
  for (let i = 0; i < segs.length; i++) if (segs[i].ph === 'K' || segs[i].ph === 'G' || segs[i].ph === 'NG') { const nx = segs[i + 1]; if (nx && FRONT.has(nx.ph)) segs[i].f = [280, 2300, 2900]; }
  let t = 0;
  for (const s of segs) { s.start = t; t += s.dur; }
  return { segs, total: t };
}

// ---------------------------------------------------------------- segments -> parameters every 5 ms
function tracks({ segs, total }, { f0 = 190, brightness = 1.1, rate = 1 } = {}) {
  const N = Math.ceil(total / 1000 / FRAME) + 2;
  const F = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  const AV = new Float32Array(N), AH = new Float32Array(N), AF = new Float32Array(N), NAS = new Float32Array(N), F0 = new Float32Array(N);
  const FR = new Array(N).fill(null);
  // formant keypoints
  const kp = [];
  const tgt = (s) => (s.f || s.def?.f);
  // how long a vowel's formants take to arrive from (or leave for) a neighbour: quick from a stop, a nasal or a fricative (the
  // abrupt cues that tell a P from a W), slow from a glide or a liquid (whose glide IS the cue)
  const near = (i, d) => { let j = i + d; while (segs[j] && segs[j].gap) j += d; return segs[j]; };
  const ease = (o) => (!o || o.t === 'p' ? 25 : o.t === 'g' || o.t === 'l' ? 60 : o.t === 'v' || o.t === 'd' ? 999 : 30);
  segs.forEach((s, i) => {
    if (s.t === 'p') return;
    if (s.t === 'h') { // the breath takes the colour of what comes next
      let n = i + 1; while (segs[n] && segs[n].t === 'p') n++;
      const f = segs[n] && tgt(segs[n]) ? tgt(segs[n]) : [500, 1500, 2500];
      kp.push([s.start, f], [s.start + s.dur, f]); return;
    }
    const f = tgt(s), e = s.start + s.dur;
    if (s.t === 'v' || s.t === 'd') {
      const tin = Math.min(ease(near(i, -1)), s.dur * 0.35), tout = Math.min(ease(near(i, 1)), s.dur * 0.35);
      if (s.t === 'd') kp.push([s.start + tin, f], [e - tout, s.def.f2]);
      else kp.push([s.start + tin, f], [e - tout, f]);
      return;
    }
    if (s.t === 'g' || s.t === 'l') { kp.push([s.start + s.dur * 0.5, f]); return; }
    const rel = s.asp ? e - s.asp : e;
    kp.push([s.start + Math.min(10, s.dur * 0.2), f], [rel - Math.min(5, s.dur * 0.1), f]);
  });
  kp.sort((a, b) => a[0] - b[0]);
  let k = 0;
  for (let n = 0; n < N; n++) {
    const tm = n * FRAME * 1000;
    while (k < kp.length - 2 && kp[k + 1][0] <= tm) k++;
    const a = kp[k], b = kp[Math.min(k + 1, kp.length - 1)];
    const u = !a || !b || b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (tm - a[0]) / (b[0] - a[0])));
    for (let j = 0; j < 3; j++) F[j][n] = (a ? a[1][j] + (b[1][j] - a[1][j]) * u : 500 * (j * 2 + 1)) * brightness;
  }
  // sources: what each segment sounds like, frame by frame
  let si = 0;
  for (let n = 0; n < N; n++) {
    const tm = n * FRAME * 1000;
    while (si < segs.length - 1 && segs[si].start + segs[si].dur <= tm) si++;
    const s = segs[si], u = (tm - s.start) / s.dur;
    let av = 0, ah = 0, af = 0, fr = null, nas = 0;
    switch (s.t) {
      case 'v': case 'd': av = 1; ah = 0.035; break;
      case 'l': av = 0.8; ah = 0.02; break;
      case 'g': av = 0.75; break;
      case 'n': av = 0.6; nas = 1; break;
      case 'h': ah = TUNE.hh; break;
      case 'x': av = 0.45; break;
      case 'f': af = 1; fr = s.def.fr; break;
      case 'z': av = 0.45; af = 0.8; fr = s.def.fr; break;
      case 's': case 'b': {
        const asp = (s.asp || 0) / s.dur, close = Math.max(0.15, 0.62 - asp), burst = close + Math.min(0.15, 12 / s.dur);
        if (u < close) av = s.t === 'b' ? 0.12 : 0;
        else if (u < burst) { af = TUNE.burst; fr = s.def.fr; av = s.t === 'b' ? 0.3 : 0; }
        else if (s.t === 's') ah = s.asp ? TUNE.aspAmp : 0.08;
        else av = 0.7;
        break;
      }
      case 'c': case 'j': {
        const asp = (s.asp || 0) / s.dur, close = 0.35;
        if (u < close) av = s.t === 'j' ? 0.12 : 0;
        else if (u < 1 - asp) { af = 1; fr = s.def.fr; av = s.t === 'j' ? 0.4 : 0; }
        else ah = 0.4;
        break;
      }
      default: break;
    }
    AV[n] = av; AH[n] = ah; AF[n] = af; FR[n] = fr; NAS[n] = nas;
  }
  // amplitudes change quickly but not instantly (no clicks)
  // (voice and breath come on fast but not instantly; a burst or a hiss is as sudden as it is)
  for (const [A, k] of [[AV, TUNE.avRamp], [AH, 0.8], [NAS, 0.9]]) { let y = 0; for (let n = 0; n < N; n++) { y += (A[n] - y) * k; A[n] = y; } }
  // pitch: a declining baseline per phrase, a rise on each accent, a fall at the end
  const phrases = [];
  let p0 = 0;
  segs.forEach((s, i) => { if (s.phraseEnd) { phrases.push([p0, i]); p0 = i + 1; } });
  const fx = new Float32Array(N).fill(-1);
  for (const [a, b] of phrases) {
    const t0 = segs[a]?.start ?? 0, t1 = segs[b].start;
    const acc = segs.slice(a, b).filter((s) => s.accent);
    for (let n = Math.floor(t0 / 5); n <= Math.min(N - 1, Math.ceil((t1 + segs[b].dur) / 5)); n++) {
      const tm = n * 5, x = Math.min(1, Math.max(0, (tm - t0) / Math.max(1, t1 - t0)));
      let f = f0 * (1.08 - 0.2 * x); // (declination)
      acc.forEach((s, j) => {
        const last = j === acc.length - 1, peak = (j === 0 ? 0.2 : 0.12) * f0;
        const c = s.start + s.dur * 0.35, w = s.dur * 0.5 + 60;
        if (last) { // the final accent: up, then all the way down
          if (tm >= s.start - 40) f += tm < c ? peak * Math.min(1, (tm - s.start + 40) / (c - s.start + 40)) : peak - (peak + 0.18 * f0) * Math.min(1, (tm - c) / Math.max(40, t1 - c));
        } else f += peak * Math.exp(-(((tm - c) / w) ** 2));
      });
      fx[n] = f;
    }
  }
  let last = f0;
  for (let n = 0; n < N; n++) { if (fx[n] > 0) last = fx[n]; F0[n] = last * (1 + 0.006 * Math.sin(n * 0.7) + 0.003 * Math.sin(n * 2.3)); }
  return { N, F, AV, AH, AF, FR, NAS, F0 };
}

// ---------------------------------------------------------------- parameters -> samples
class Res { // a Klatt resonator (or, inverted, an antiresonator)
  constructor() { this.y1 = 0; this.y2 = 0; this.a = 1; this.b = 0; this.c = 0; }
  set(f, bw, fs) {
    const T = 1 / fs, r = Math.exp(-Math.PI * bw * T);
    this.c = -r * r; this.b = 2 * r * Math.cos(2 * Math.PI * f * T); this.a = 1 - this.b - this.c;
  }
  run(x) { const y = this.a * x + this.b * this.y1 + this.c * this.y2; this.y2 = this.y1; this.y1 = y; return y; }
  /** A band-pass with zeros at DC and Nyquist and unity gain at its centre (the hiss of a fricative has no bass). */
  setBand(f, bw, fs) { const T = 1 / fs, r = Math.exp(-Math.PI * bw * T); this.c = -r * r; this.b = 2 * r * Math.cos(2 * Math.PI * f * T); this.a = (1 - r * r) / 2; this.x1 = this.x1 || 0; this.x2 = this.x2 || 0; }
  band(x) { const y = this.a * (x - this.x2) + this.b * this.y1 + this.c * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
  anti(x) { // (the zero: the resonator's inverse)
    const a = 1 / this.a, b = -this.b / this.a, c = -this.c / this.a;
    const y = a * x + b * this.y1 + c * this.y2; this.y2 = this.y1; this.y1 = x; return y;
  }
}

function render(T, fs) {
  TILT = TUNE.tilt;
  let seed = 0x9e3779b9; const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296); }; // (deterministic noise: a line always sounds the same)
  const spf = Math.round(FRAME * fs), n = T.N * spf, out = new Float32Array(n);
  const R = [new Res(), new Res(), new Res(), new Res(), new Res()], NP = new Res(), NZ = new Res();
  const FP = [new Res(), new Res()], FQ = [new Res(), new Res()]; // (two stages each: a hiss has steep sides)
  let phase = 0, tilt = 0, noiseLP = 0, dc0 = 0, dc1 = 0, shLP = 0;
  const B = [TUNE.b1, 95, 160, TUNE.b4, TUNE.b5], OQ = TUNE.oq;
  const shA = 1 - Math.exp(-2 * Math.PI * 2500 / fs); // (the high-pole correction: a shelf above 2.5 kHz)
  for (let f = 0; f < T.N; f++) {
    const nas = T.NAS[f];
    R[0].set(nas > 0.5 ? 280 : T.F[0][f], nas > 0.5 ? 120 : B[0], fs);
    R[1].set(T.F[1][f], B[1] + nas * 150, fs); R[2].set(T.F[2][f], B[2] + nas * 120, fs);
    R[3].set(3700, B[3], fs); R[4].set(4400, B[4], fs);
    NP.set(270, 100, fs); NZ.set(270 + 200 * nas, 100, fs);
    const fr = T.FR[f];
    if (fr) for (let j = 0; j < 2; j++) if (fr[j]) { FP[j].setBand(fr[j][0], fr[j][1], fs); FQ[j].setBand(fr[j][0], fr[j][1] * 1.3, fs); }
    const f0a = T.F0[f], f0b = T.F0[Math.min(T.N - 1, f + 1)];
    for (let s = 0; s < spf; s++) {
      const u = s / spf, f0 = f0a + (f0b - f0a) * u;
      const av = T.AV[f], ah = T.AH[f], af = T.AF[f];
      // the glottal pulse (KLGLOTT88: flow x^2 - x^3 over the open phase; its derivative is what radiates)
      phase += f0 / fs; if (phase >= 1) phase -= 1;
      const x = phase / OQ, open = x < 1;
      let g = open ? 2 * x - 3 * x * x : 0;
      tilt += (g - tilt) * TILT; // (the spectral tilt of a soft voice)
      const white = rnd() * 2 - 1;
      noiseLP += (white - noiseLP) * 0.7;
      const asp = noiseLP * ah * (av > 0.1 ? (open ? 1 : 0.4) : 1);
      let v = tilt * av * 1.2 + asp;
      v = NZ.anti(NP.run(v));
      let y = v;
      for (let r = 0; r < 5; r++) y = R[r].run(y);
      // the hiss, in parallel
      let z = 0;
      if (af > 0.001 && fr) { const nz = white * af; z += FQ[0].band(FP[0].band(nz)) * fr[0][2]; if (fr[1]) z += FQ[1].band(FP[1].band(nz)) * fr[1][2]; }
      shLP += (y - shLP) * shA;
      const o = y + (y - shLP) * TUNE.shelf + z * TUNE.fric;
      const hp = o - dc0 + 0.995 * dc1; dc0 = o; dc1 = hp; // (no DC)
      out[f * spf + s] = hp;
    }
  }
  // level: a steady peak, and a short fade at each end
  let pk = 1e-6; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(out[i]));
  const g = 0.85 / pk, fade = Math.round(0.01 * fs);
  for (let i = 0; i < n; i++) out[i] *= g * Math.min(1, i / fade, (n - 1 - i) / fade);
  return out;
}

/** Text to speech: { samples, fs }. f0: the voice's middle pitch (Hz); rate: speed (1 normal); brightness: formant scaling. */
export function synthesize(text, { f0 = 190, rate = 1, brightness = 1.1, fs = FS } = {}) {
  const p = plan(text, rate);
  const T = tracks(p, { f0, brightness, rate });
  return { samples: render(T, fs), fs, phones: p.segs.filter((s) => s.t !== 'p').map((s) => s.ph), segs: p.segs };
}
