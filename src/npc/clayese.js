// ---------------------------------------------------------------------------------------
// CLAYESE: how the clay folk sound when they talk. Not words: a little struck note for each letter as it appears in the dialogue
// box, so a line is heard as a run of bells and lid-clinks with the shape of speech (it rises at a question, falls at a full stop,
// leaps where a word is shouted). Every voice is tuned to its speaker's own scale, so a conversation is faintly musical: the folk of
// the East speak in the Japanese pentatonics (In, Yo), the folk of the West in the Guidonian hexachord (ut re mi fa sol la).
//
// A letter's note: vowels ring (a bell: three inharmonic partials, struck and left to decay), consonants are clipped and carry the
// clay (a fired-clay lid set down on its jar: a short band of noise with two stiff modes in it), the hissing ones (s, f, h, z, x) a
// breath of noise, the humming ones (m, n) a soft low tone. Which degree of the scale a letter gets is fixed per letter (the same
// word sounds the same twice); its height is moved by where it falls in the sentence and by the speaker's mood:
//   fear     higher, quick, a fast tremble (vibrato), more clay (the lid rattling)     anger  lower, louder, clanking
//   sad      lower, slow, long soft decays, falling                                     joy    higher, brighter, rising
//   surprise a leap up                     awe    bell, long, a shimmer                   whisper  quiet, breath, no bell
//
// Prior art: Animal Crossing's Animalese (each letter a sped-up, pitched syllable, the speaker's own register; the shape of a
// sentence carried by pitch), Undertale's per-character voice blips, and the bells and the gamelan-like pentatonic chimes of the
// era's JRPG text boxes. The partials of a bell (1, 2.76, 5.40) are a struck bar's / handbell's, the clay modes measured by ear.
//
//   const v = new Clayese(sfx)    v.blip(letter, voice, { mood, emph, end, pos })    (voice: { base: midi, scale: 'in'|'yo'|'hexa'|..., bell, clay })
//   v.gesture(text, voice, { mood, end })   a short sound with no box (a chuckle, a huff), spoken a letter at a time
//   v.haggle(mood, voice)                   a shopkeeper's reaction: pleased, greedy, insulted, sulking, sold (HAGGLE)
//   hearHaggling(game, v, voice)            Raku answers every 'shop.haggle' event (its step, from shop/shops.js) in his own voice
// ---------------------------------------------------------------------------------------
export const SCALES = {
  in: [0, 1, 5, 7, 8], // Miyako-bushi / In: the sombre Japanese pentatonic
  yo: [0, 2, 5, 7, 9], // Yo: the bright one (min7 without its third... the folk-song scale)
  ritsu: [0, 2, 5, 7, 9, 10],
  hexa: [0, 2, 4, 5, 7, 9], // the Guidonian hexachord: ut re mi fa sol la
  hexaMolle: [0, 2, 4, 5, 7, 9].map((x) => x + 5), // (the soft hexachord, on F)
};
const MOOD = {
  calm: { st: 0, speed: 1, vib: 0, clay: 0, bell: 0, decay: 1, gain: 1, glide: -0.02 },
  joy: { st: 3, speed: 1.08, vib: 0, clay: -0.2, bell: 0.2, decay: 1.1, gain: 1.05, glide: 0.04 },
  fear: { st: 2, speed: 1.3, vib: 0.035, vibHz: 13, clay: 0.45, bell: -0.2, decay: 0.6, gain: 0.85, glide: 0.01 },
  anger: { st: -3, speed: 1.15, vib: 0, clay: 0.6, bell: -0.1, decay: 0.7, gain: 1.35, glide: -0.05 },
  sad: { st: -4, speed: 0.7, vib: 0.01, vibHz: 4, clay: -0.3, bell: 0.1, decay: 1.8, gain: 0.7, glide: -0.07 },
  surprise: { st: 5, speed: 1.1, vib: 0, clay: 0.1, bell: 0.2, decay: 0.9, gain: 1.15, glide: 0.08 },
  awe: { st: 1, speed: 0.8, vib: 0.012, vibHz: 5, clay: -0.4, bell: 0.4, decay: 2.2, gain: 0.9, glide: 0.02 },
  confused: { st: 1, speed: 0.95, vib: 0.02, vibHz: 3, clay: 0.1, bell: 0, decay: 1, gain: 0.95, glide: 0.05 },
  sly: { st: -1, speed: 0.9, vib: 0, clay: 0.1, bell: 0, decay: 1.2, gain: 0.9, glide: 0.06 },
  whisper: { st: 0, speed: 0.85, vib: 0, clay: -0.2, bell: -0.8, decay: 0.8, gain: 0.45, glide: 0, breath: 1 },
};
export const MOODS = Object.keys(MOOD);
export const moodOf = (m) => MOOD[m] || MOOD.calm;

const VOWEL = { a: 2, e: 1, i: 3, o: 0, u: 4, y: 3 };
const HISS = new Set(['s', 'f', 'h', 'z', 'x', 'c']);
const HUM = new Set(['m', 'n']);
const deg = (ch) => (VOWEL[ch] ?? ((ch.charCodeAt(0) * 7) % 11)); // (a consonant's degree: fixed, and spread)

export class Clayese {
  constructor(sfx) { this.sfx = sfx; this.n = 0; }

  /**
   * One letter's note. `pos` (0..1 through the sentence) and `end` ('?' | '!' | '.' | null: how the sentence ends) shape the line;
   * `emph` (a shouted or stressed word) lifts and loudens it; `dist` is how far the listener is.
   */
  blip(letter, voice, { mood = 'calm', emph = 0, pos = 0.5, end = null, dist = 3, gain = 1, at = null } = {}) {
    const S = this.sfx;
    if (!S.ok?.() || !letter) return;
    const ch = letter.toLowerCase();
    if (!/[a-z0-9]/.test(ch)) return;
    const M = moodOf(mood), ctx = S.ctx, t = at ?? ctx.currentTime + 0.005; // (at: a time of its own, for rendering a line offline)
    const sc = SCALES[voice.scale] || SCALES.yo;
    const d = deg(ch), oct = Math.floor(d / sc.length);
    // the sentence's contour: a question rises over its last third, an exclamation sits high, a statement falls
    let contour = 0;
    if (end === '?') contour = Math.max(0, pos - 0.6) * 12;
    else if (end === '!') contour = 2;
    else contour = -Math.max(0, pos - 0.7) * 6;
    const midi = voice.base + sc[d % sc.length] + oct * 12 + M.st + emph * 3 + contour;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const out = ctx.createGain();
    out.gain.value = 0.11 * M.gain * (1 + emph * 0.5) * gain / (0.6 + dist * 0.12);
    out.connect(S.master); const send = ctx.createGain(); send.gain.value = voice.verb ?? 0.35; out.connect(send).connect(S.verbSend);
    const vowel = ch in VOWEL, dur = (vowel ? 0.16 : 0.08) * M.decay * (voice.decay || 1);
    const bell = Math.max(0, Math.min(1.4, (voice.bell ?? 0.7) + M.bell)) * (vowel ? 1 : 0.55);
    const clay = Math.max(0, Math.min(1.4, (voice.clay ?? 0.5) + M.clay)) * (vowel ? 0.45 : 1);
    // the bell
    if (bell > 0.02 && !HISS.has(ch)) {
      for (const [r, a] of [[1, 1], [2.76, 0.32], [5.4, 0.12]]) {
        const o = ctx.createOscillator(), e = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * r, t);
        o.frequency.exponentialRampToValueAtTime(f * r * (1 + M.glide), t + dur);
        if (M.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = M.vibHz; lg.gain.value = f * r * M.vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur * (1.6 + r * 0.2) + 0.05); }
        e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(a * bell, t + 0.004);
        e.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1.6 / r + 0.3));
        o.connect(e).connect(out); o.start(t); o.stop(t + dur * 2 + 0.05);
      }
    }
    // the clay: a lid set down on its jar (a band of noise, and two stiff modes)
    if (clay > 0.02) {
      S.noise(t, 0.03, { type: 'bandpass', f0: 2600 + (f % 900), f1: 1900, q: 9, gain: 0.35 * clay, attack: 0.002, dest: out });
      for (const [r, a] of [[1.62, 0.42], [2.94, 0.2]]) {
        const o = ctx.createOscillator(), e = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r;
        e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(a * clay, t + 0.002); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.connect(e).connect(out); o.start(t); o.stop(t + 0.06);
      }
    }
    if (HISS.has(ch) || M.breath) S.noise(t, 0.05, { type: 'highpass', f0: 4200, f1: 5200, q: 0.7, gain: (M.breath ? 0.5 : 0.3), attack: 0.004, dest: out });
    if (HUM.has(ch)) {
      const o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.setValueAtTime(f / 2, t); o.frequency.exponentialRampToValueAtTime(f / 2 * 0.98, t + 0.08);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.5, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(e).connect(out); o.start(t); o.stop(t + 0.1);
    }
    this.n++;
  }

  /** A sound with no words in a box: `text` spoken a letter at a time (a chuckle, a huff, a sigh), shaped as a sentence is. */
  gesture(text, voice, { mood = 'calm', end = null, emph = 0, gap = 0.075, dist = 3, gain = 1 } = {}) {
    const S = this.sfx;
    if (!S.ok?.()) return;
    const M = moodOf(mood), letters = [...text].filter((ch) => /[a-z]/i.test(ch)), t0 = S.ctx.currentTime + 0.01;
    let t = t0;
    [...text].forEach((ch) => {
      if (ch === '-' || ch === ' ') { t += gap * 1.6 / M.speed; return; } // (a breath between the parts: heh - heh)
      if (!/[a-z]/i.test(ch)) return;
      const k = letters.indexOf(ch);
      this.blip(ch, voice, { mood, end, emph: ch === ch.toUpperCase() ? 1 : emph, pos: letters.length > 1 ? k / (letters.length - 1) : 1, dist, gain, at: t });
      t += gap / M.speed;
    });
  }
  /** A shopkeeper haggling: a gesture for each turn of the bargain (HAGGLE), with the counter's coins where they belong. */
  haggle(mood, voice, { dist = 3, gain = 0.8 } = {}) {
    const H = HAGGLE[mood];
    if (!H) return;
    this.gesture(H.text, voice, { mood: H.mood, end: H.end, gap: H.gap ?? 0.075, dist, gain }); // (under the line he then says in the box)
    if (mood === 'greedy') this.sfx.cubeClack?.(1, dist);
  }
}

// the turns of a bargain, as the clay folk's moods (MOOD) say them: the letters are only sounds
export const HAGGLE = {
  pleased: { text: 'oh-ooh', mood: 'joy', end: '!' }, // (a rising "ooh": the offer is good)
  greedy: { text: 'heh-heh-heh', mood: 'sly', end: null, gap: 0.06 }, // (the sly chuckle, a coin turned over)
  insulted: { text: 'HMPH', mood: 'anger', end: '!' }, // (low, loud, clanking)
  sulking: { text: 'mmm-nnh', mood: 'sad', end: '.', gap: 0.11 }, // (falling, slow)
  sold: { text: 'da-DONE', mood: 'surprise', end: '!' }, // (a leap up, and the deal's bell)
};

// the haggle's steps (shop/haggle.js) as the turns above: what his body says before his line does
const STEP = { open: 'greedy', counter: 'greedy', last: 'greedy', insult: 'insulted', flatter: 'pleased', clink: 'pleased', callback: 'pleased', bored: 'sulking', gone: 'sulking', deal: 'sold' };

/** Raku answers the shop's bargaining: each 'shop.haggle' event ({ step } from shop/shops.js, or { mood } as HAGGLE's names), a
 *  gesture in his voice as his line begins (the purchase's own sound is the deal's bell). */
export function hearHaggling(game, clayese, voice) {
  return game.events.on('shop.haggle', (e) => {
    const turn = HAGGLE[e.mood] ? e.mood : STEP[e.step] ?? (e.mood === 'anger' ? 'insulted' : e.mood === 'sad' ? 'sulking' : null);
    if (turn) clayese.haggle(turn, voice, { dist: e.dist ?? 3 });
    if (e.step === 'insult') clayese.sfx.shopRefuse?.(); // (the sting)
    if (e.step === 'clink') clayese.sfx.shopCubes?.(3); // (her cubes on his counter)
  });
}
