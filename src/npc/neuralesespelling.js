// ---------------------------------------------------------------------------------------
// NEURALESE, THE SPELLING: any neuralese word cut into its syllables, each syllable into the parts its letters are drawn from, by
// Espada's orthography (docs/LORE.md, "The neuralese script"; docs/NEURALESE.md). One answer serves both hands: the running hand
// (a consonant letter, its vowel marks round it) and the Comb (a hex cell, onset above, coda below). The glyphs are Calissa's; this
// says only what each glyph must show, so a drawn word spells a real one.
//
// Prior art: Hangul's featural letters (place and manner drawn), the Brahmi abugidas' syllable (a consonant carrying its vowel), and
// the maximal-onset rule of syllabification (a consonant run splits so the next syllable starts with the longest onset allowed).
//
//   syllables('DIPSA') -> ['DIP', 'SA']
//   cellsOf('STIL') -> [{ text, onset: [{ c, place, manner, voiced }], vowels: ['i'], coda: null | { c, place, manner, voiced } }]
//   Places: lips | tip | back. Manners: stop | fricative | nasal | liquid (a fricative's mark: tick | ticks | cross; a liquid's: in | out).
//   Vowels: a (inherent, unwritten in the running hand) | i (above) | u (below) | e (before) | o (after). Throws on a word the
//   orthography cannot spell, so a bad root is caught where it is written.
//   bendName('Wanda') -> 'VANDA'   (a name from outside bent until it spells, as loanwords are: NEURALESE.md 2, rule 12; 2a, names)
// ---------------------------------------------------------------------------------------

const CONSONANTS = {
  p: { place: 'lips', manner: 'stop', voiced: false },
  b: { place: 'lips', manner: 'stop', voiced: true }, // (2026-10-23: the voiced stop at the lips, beside d and g; both hands draw it from its features)
  f: { place: 'lips', manner: 'fricative', voiced: false, mark: 'tick' },
  v: { place: 'lips', manner: 'fricative', voiced: true, mark: 'tick' },
  m: { place: 'lips', manner: 'nasal', voiced: true },
  t: { place: 'tip', manner: 'stop', voiced: false },
  d: { place: 'tip', manner: 'stop', voiced: true },
  s: { place: 'tip', manner: 'fricative', voiced: false, mark: 'tick' },
  z: { place: 'tip', manner: 'fricative', voiced: true, mark: 'tick' },
  sh: { place: 'tip', manner: 'fricative', voiced: false, mark: 'ticks' },
  th: { place: 'tip', manner: 'fricative', voiced: false, mark: 'cross' },
  n: { place: 'tip', manner: 'nasal', voiced: true },
  l: { place: 'tip', manner: 'liquid', voiced: true, mark: 'in' },
  r: { place: 'tip', manner: 'liquid', voiced: true, mark: 'out' },
  k: { place: 'back', manner: 'stop', voiced: false },
  g: { place: 'back', manner: 'stop', voiced: true },
  h: { place: 'back', manner: 'fricative', voiced: false, mark: 'tick' },
};
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const DIPHTHONGS = { ai: ['a', 'i'], oy: ['o', 'i'] };

// an onset of two: a stop or fricative and a liquid (GRAV, KLAI, PLUVA), or s and a stop (STIL, SKOTA)
function onsetOk(cs) {
  if (cs.length <= 1) return true;
  if (cs.length > 2) return false;
  const [a, b] = cs.map((c) => CONSONANTS[c]);
  if (b.manner === 'liquid' && (a.manner === 'stop' || a.manner === 'fricative') && cs[0] !== 'h') return true;
  return cs[0] === 's' && b.manner === 'stop';
}

// letters to units: { c } for a consonant (sh, th as one; x as k and s), { v: [...] } for a vowel or diphthong
function units(word) {
  const w = String(word).toLowerCase();
  const out = [];
  for (let i = 0; i < w.length;) {
    const two = w.slice(i, i + 2);
    if (DIPHTHONGS[two]) { out.push({ v: DIPHTHONGS[two], text: two }); i += 2; continue; }
    if (two === 'sh' || two === 'th') { out.push({ c: two }); i += 2; continue; }
    const ch = w[i];
    if (ch === 'x') { out.push({ c: 'k' }, { c: 's' }); i += 1; continue; }
    if (VOWELS.has(ch)) { out.push({ v: [ch], text: ch }); i += 1; continue; }
    if (CONSONANTS[ch]) { out.push({ c: ch }); i += 1; continue; }
    throw new Error(`neuralese: "${word}" has a letter the orthography lacks (${ch})`);
  }
  return out;
}

const letterOf = (c) => (c ? { c, ...CONSONANTS[c] } : null);

// the word as syllables: { onset: [c], vowels: [v], coda: c | null }
function parse(word) {
  const us = units(word);
  const sylls = [];
  let run = [];
  for (const u of us) {
    if (u.c) { run.push(u.c); continue; }
    if (!sylls.length) {
      if (!onsetOk(run)) throw new Error(`neuralese: "${word}" cannot begin with ${run.join('')}`);
      sylls.push({ onset: run, vowels: u.v, coda: null });
    } else {
      // maximal onset: the longest allowed tail of the run starts this syllable; the rest (at most one) closes the last
      let k = Math.min(run.length, 2);
      while (k > 0 && !onsetOk(run.slice(run.length - k))) k--;
      const coda = run.slice(0, run.length - k);
      if (coda.length > 1) throw new Error(`neuralese: "${word}" has ${coda.join('')} where one consonant may close a syllable`);
      sylls[sylls.length - 1].coda = coda[0] ?? null;
      sylls.push({ onset: run.slice(run.length - k), vowels: u.v, coda: null });
    }
    run = [];
  }
  if (!sylls.length) throw new Error(`neuralese: "${word}" has no vowel`);
  if (run.length > 1) throw new Error(`neuralese: "${word}" ends on ${run.join('')}, where one consonant may close a syllable`);
  sylls[sylls.length - 1].coda = run[0] ?? null;
  return sylls;
}

const textOf = (s) => (s.onset.join('') + (s.vowels.join('') === 'oi' ? 'oy' : s.vowels.join('')) + (s.coda ?? '')).toUpperCase();

export const syllables = (word) => parse(word).map(textOf);

export const cellsOf = (word) => parse(word).map((s) => ({
  text: textOf(s),
  onset: s.onset.map(letterOf),
  vowels: s.vowels,
  coda: letterOf(s.coda),
}));

// a name from outside, bent until the orthography can spell it (docs/NEURALESE.md 2a): the missing letters swapped for the nearest
// (c k or s, ch k or sh, j z, q and qu k, w v, x ks (z first), y i, ph f, gh and a lone h after a consonant dropped, ng n), doubled letters made one, and a cluster the
// rules refuse opened with a: the inherent vowel, unwritten in the running hand, so the bent name still looks as close as the hand allows
// (Japanese loanwords open theirs with u: Christmas, kurisumasu).
const runOk = (run, at) => at === 'start' ? onsetOk(run) : at === 'end' ? run.length <= 1
  : (() => { let k = Math.min(run.length, 2); while (k > 0 && !onsetOk(run.slice(run.length - k))) k--; return run.length - k <= 1; })();
export function bendName(name) {
  let w = String(name).toLowerCase().replace(/[^a-z]/g, '');
  w = w.replace(/^x/, 'z').replace(/x/g, 'ks').replace(/gh/g, '').replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/ch(?=[rl])/g, 'k').replace(/ch/g, 'sh').replace(/qu/g, 'k')
    .replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k').replace(/q/g, 'k').replace(/j/g, 'z').replace(/w/g, 'v').replace(/y/g, 'i')
    .replace(/ng(?![aeiou])/g, 'n').replace(/([^aeioust])h/g, '$1').replace(/([a-z])\1+/g, '$1');
  if (!w) return '';
  if (!/[aeiou]/.test(w)) w += 'a';
  for (let tries = 0; tries < 12; tries++) {
    try { parse(w); return w.toUpperCase(); } catch { /* open the first cluster the rules refuse */ }
    const us = units(w), out = []; let run = [], fixed = false, at = 'start';
    const flush = () => {
      if (!fixed && run.length && !runOk(run, at)) {
        fixed = true;
        if (at === 'end') out.push(...run.slice(0, -1), 'a', run[run.length - 1]); else out.push(run[0], 'a', ...run.slice(1));
      } else out.push(...run);
      run = [];
    };
    for (const u of us) { if (u.c) { run.push(u.c); continue; } flush(); at = 'mid'; out.push(u.text); }
    at = 'end'; flush();
    w = out.join('');
  }
  return w.toUpperCase();
}
