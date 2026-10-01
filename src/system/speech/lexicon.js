// ---------------------------------------------------------------------------------------
// THE LEXICON: how a written word is said, as ARPAbet phonemes with stress (1 primary, 2 secondary, 0 none on the vowels).
//
//  1. The dictionary (lexicon.data.js, built from the CMU Pronouncing Dictionary by tools/build_lexicon.mjs): every word the game's
//     lines and names use.
//  2. The game's own words, given here by hand (Pneuka, Veritome, clapperjar, kintsugi, zandatsu...).
//  3. Anything else goes through LETTER-TO-SOUND RULES: the Naval Research Laboratory's rules (Elovitz, Johnson, McHugh and Shore,
//     "Automatic translation of English text to phonetics by means of letter-to-sound rules", NRL Report 7948, 1976; a US government
//     work), a few hundred context rules of the form left[match]right = phonemes, here in a trimmed form, then a stress guess.
//
//   phonesOf(word) -> ['N', 'OW1', 'T', 'IH0', 'S']
// ---------------------------------------------------------------------------------------
import { LEXICON_DATA } from './lexicon.data.js';

const HAND = {
  pneuka: 'N UW1 K AH0', veritome: 'V EH1 R IH0 T OW2 M', clapperjar: 'K L AE1 P ER0 JH AA2 R', clapperjars: 'K L AE1 P ER0 JH AA2 R Z',
  kintsugi: 'K IH0 N T S UW1 G IY0', zandatsu: 'Z AA0 N D AA1 T S UW0', lachryma: 'L AE1 K R IH0 M AH0', sondelass: 'S AA1 N D AH0 L AE2 S',
  astrolabe: 'AE1 S T R AH0 L EY2 B', bestiary: 'B EH1 S T IY0 EH2 R IY0', blacklight: 'B L AE1 K L AY2 T', blinker: 'B L IH1 NG K ER0',
  "bosun's": 'B OW1 S AH0 N Z', cartographer: 'K AA0 R T AA1 G R AH0 F ER0', completionist: 'K AH0 M P L IY1 SH AH0 N IH0 S T',
  footsore: 'F UH1 T S AO2 R', hierophant: 'HH AY1 R AH0 F AE2 N T', hoarder: 'HH AO1 R D ER0', koi: 'K OY1', lapper: 'L AE1 P ER0',
  mandoline: 'M AE1 N D AH0 L IY2 N', mooching: 'M UW1 CH IH0 NG', portraitist: 'P AO1 R T R AH0 T IH0 S T', sandsailor: 'S AE1 N D S EY2 L ER0',
  shatterer: 'SH AE1 T ER0 ER0', shutterbug: 'SH AH1 T ER0 B AH2 G', springheel: 'S P R IH1 NG HH IY2 L', stompy: 'S T AA1 M P IY0',
  stoppered: 'S T AA1 P ER0 D', stormrider: 'S T AO1 R M R AY2 D ER0', sunderer: 'S AH1 N D ER0 ER0', swordsmanship: 'S AO1 R D Z M AH0 N SH IH2 P',
  telekinesis: 'T EH2 L AH0 K IH0 N IY1 S IH0 S', ultramarathon: 'AH2 L T R AH0 M EH1 R AH0 TH AA2 N', vapour: 'V EY1 P ER0',
  wayfarer: 'W EY1 F EH2 R ER0', whelk: 'W EH1 L K', wunderkammer: 'V UH1 N D ER0 K AA2 M ER0', psygun: 'S AY1 G AH2 N',
  courier: 'K UH1 R IY0 ER0', tithe: 'T AY1 DH', skiffing: 'S K IH1 F IH0 NG', clapper: 'K L AE1 P ER0',
};

let LEX = null;
function load() {
  LEX = new Map();
  for (const e of LEXICON_DATA.split('|')) { const i = e.indexOf(':'); if (i > 0) LEX.set(e.slice(0, i), e.slice(i + 1)); }
  for (const [w, p] of Object.entries(HAND)) LEX.set(w, p);
}

/** A word's phonemes (an array of ARPAbet symbols, vowels with a stress digit). */
export function phonesOf(word) {
  if (!LEX) load();
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return [];
  const hit = LEX.get(w) || LEX.get(w.replace(/'s$/, ''))?.concat(' Z');
  if (hit) return hit.split(' ');
  // a plural or possessive of a known word
  if (/s$/.test(w) && LEX.get(w.slice(0, -1))) return [...LEX.get(w.slice(0, -1)).split(' '), /[ptkf]$/.test(w.slice(0, -1)) ? 'S' : 'Z'];
  return stress(rules(w));
}

// ---------------------------------------------------------------- letter-to-sound (the NRL rules, trimmed)
// contexts: # one or more vowels, : zero or more consonants, ^ one consonant, . a voiced consonant, + a front vowel (E I Y),
// % a suffix (ER E ES ED ING ELY), & a sibilant, @ a consonant that makes a following long U say "oo", ' ' the word's edge
const R = {
  a: [[' ', 'A', ' ', 'AX'], [' ', 'ARE', ' ', 'AA R'], [' ', 'AR', 'O', 'AX R'], ['', 'AR', '#', 'EH R'], ['^', 'AS', '#', 'EY S'], ['', 'A', 'WA', 'AX'],
    ['', 'AW', '', 'AO'], [' :', 'ANY', '', 'EH N IY'], ['', 'A', '^+#', 'EY'], ['#:', 'ALLY', '', 'AX L IY'], [' ', 'AL', '#', 'AX L'], ['', 'AGAIN', '', 'AX G EH N'],
    ['#:', 'AG', 'E', 'IH JH'], ['', 'A', '^+:#', 'AE'], [' :', 'A', '^+ ', 'EY'], ['', 'A', '^%', 'EY'], [' ', 'ARR', '', 'AX R'], ['', 'ARR', '', 'AE R'],
    [' :', 'AR', ' ', 'AA R'], ['', 'AR', ' ', 'ER'], ['', 'AR', '', 'AA R'], ['', 'AIR', '', 'EH R'], ['', 'AI', '', 'EY'], ['', 'AY', '', 'EY'], ['', 'AU', '', 'AO'],
    ['#:', 'AL', ' ', 'AX L'], ['#:', 'ALS', ' ', 'AX L Z'], ['', 'ALK', '', 'AO K'], ['', 'AL', '^', 'AO L'], [' :', 'ABLE', '', 'EY B AX L'], ['', 'ABLE', '', 'AX B AX L'],
    ['', 'ANG', '+', 'EY N JH'], ['', 'A', '', 'AE']],
  b: [[' ', 'BE', '^#', 'B IH'], ['', 'BEING', '', 'B IY IH NG'], [' ', 'BOTH', ' ', 'B OW TH'], [' ', 'BUS', '#', 'B IH Z'], ['', 'BUIL', '', 'B IH L'], ['', 'B', '', 'B']],
  c: [[' ', 'CH', '^', 'K'], ['^E', 'CH', '', 'K'], ['', 'CH', '', 'CH'], [' S', 'CI', '#', 'S AY'], ['', 'CI', 'A', 'SH'], ['', 'CI', 'O', 'SH'], ['', 'CI', 'EN', 'SH'],
    ['', 'C', '+', 'S'], ['', 'CK', '', 'K'], ['', 'COM', '%', 'K AH M'], ['', 'C', '', 'K']],
  d: [['#:', 'DED', ' ', 'D IH D'], ['.E', 'D', ' ', 'D'], ['#:^E', 'D', ' ', 'T'], [' ', 'DE', '^#', 'D IH'], [' ', 'DO', ' ', 'D UW'], [' ', 'DOES', '', 'D AH Z'],
    [' ', 'DOING', '', 'D UW IH NG'], [' ', 'DOW', '', 'D AW'], ['', 'DU', 'A', 'JH UW'], ['', 'D', '', 'D']],
  e: [['#:', 'E', ' ', ''], ["'^", 'E', ' ', ''], [' :', 'E', ' ', 'IY'], ['#', 'ED', ' ', 'D'], ['#:', 'E', 'D ', ''], ['', 'EV', 'ER', 'EH V'], ['', 'E', '^%', 'IY'],
    ['', 'ERI', '#', 'IY R IY'], ['', 'ERI', '', 'EH R IH'], ['#:', 'ER', '#', 'ER'], ['', 'ER', '#', 'EH R'], ['', 'ER', '', 'ER'], [' ', 'EVEN', '', 'IY V EH N'],
    ['#:', 'E', 'W', ''], ['@', 'EW', '', 'UW'], ['', 'EW', '', 'Y UW'], ['', 'E', 'O', 'IY'], ['#:&', 'ES', ' ', 'IH Z'], ['#:', 'E', 'S ', ''], ['#:', 'ELY', ' ', 'L IY'],
    ['#:', 'EMENT', '', 'M EH N T'], ['', 'EFUL', '', 'F UH L'], ['', 'EE', '', 'IY'], ['', 'EARN', '', 'ER N'], [' ', 'EAR', '^', 'ER'], ['', 'EAD', '', 'EH D'],
    ['#:', 'EA', ' ', 'IY AX'], ['', 'EA', 'SU', 'EH'], ['', 'EA', '', 'IY'], ['', 'EIGH', '', 'EY'], ['', 'EI', '', 'IY'], [' ', 'EYE', '', 'AY'], ['', 'EY', '', 'IY'],
    ['', 'EU', '', 'Y UW'], ['', 'E', '', 'EH']],
  f: [['', 'FUL', '', 'F UH L'], ['', 'F', '', 'F']],
  g: [['', 'GIV', '', 'G IH V'], [' ', 'G', 'I^', 'G'], ['', 'GE', 'T', 'G EH'], ['SU', 'GGES', '', 'G JH EH S'], ['', 'GG', '', 'G'], [' B#', 'G', '', 'G'], ['', 'G', '+', 'JH'],
    ['', 'GREAT', '', 'G R EY T'], ['#', 'GH', '', ''], ['', 'G', '', 'G']],
  h: [[' ', 'HAV', '', 'HH AE V'], [' ', 'HERE', '', 'HH IY R'], [' ', 'HOUR', '', 'AW ER'], ['', 'HOW', '', 'HH AW'], ['', 'H', '#', 'HH'], ['', 'H', '', '']],
  i: [[' ', 'IN', '', 'IH N'], [' ', 'I', ' ', 'AY'], ['', 'IN', 'D', 'AY N'], ['', 'IER', '', 'IY ER'], ['#:R', 'IED', '', 'IY D'], ['', 'IED', ' ', 'AY D'], ['', 'IEN', '', 'IY EH N'],
    ['', 'IE', 'T', 'AY EH'], [' :', 'I', '%', 'AY'], ['', 'I', '%', 'IY'], ['', 'IE', '', 'IY'], ['', 'I', '^+:#', 'IH'], ['', 'IR', '#', 'AY R'], ['', 'IZ', '%', 'AY Z'],
    ['', 'IS', '%', 'AY Z'], ['', 'I', 'D%', 'AY'], ['+^', 'I', '^+', 'IH'], ['', 'I', 'T%', 'AY'], ['#:^', 'I', '^+', 'IH'], ['', 'IR', '', 'ER'], ['', 'IGH', '', 'AY'],
    ['', 'ILD', '', 'AY L D'], ['', 'IGN', ' ', 'AY N'], ['', 'IGN', '^', 'AY N'], ['', 'IGN', '%', 'AY N'], ['', 'IQUE', '', 'IY K'], ['', 'I', '', 'IH']],
  j: [['', 'J', '', 'JH']],
  k: [[' ', 'K', 'N', ''], ['', 'K', '', 'K']],
  l: [['', 'LO', 'C#', 'L OW'], ['L', 'L', '', ''], ['#:^', 'L', '%', 'AX L'], ['', 'LEAD', '', 'L IY D'], ['', 'L', '', 'L']],
  m: [['', 'MOV', '', 'M UW V'], ['', 'M', '', 'M']],
  n: [['E', 'NG', '+', 'N JH'], ['', 'NG', 'R', 'NG G'], ['', 'NG', '#', 'NG G'], ['', 'NGL', '%', 'NG G AX L'], ['', 'NG', '', 'NG'], ['', 'NK', '', 'NG K'],
    [' ', 'NOW', ' ', 'N AW'], ['', 'N', '', 'N']],
  o: [['', 'OF', ' ', 'AX V'], ['', 'OROUGH', '', 'ER OW'], ['#:', 'OR', ' ', 'ER'], ['#:', 'ORS', ' ', 'ER Z'], ['', 'OR', '', 'AO R'], [' ', 'ONE', '', 'W AH N'],
    ['', 'OW', '', 'OW'], [' ', 'OVER', '', 'OW V ER'], ['', 'OV', '', 'AH V'], ['', 'O', '^%', 'OW'], ['', 'O', '^EN', 'OW'], ['', 'O', '^I#', 'OW'], ['', 'OL', 'D', 'OW L'],
    ['', 'OUGHT', '', 'AO T'], ['', 'OUGH', '', 'AH F'], [' ', 'OU', '', 'AW'], ['H', 'OU', 'S#', 'AW'], ['', 'OUS', '', 'AX S'], ['', 'OUR', '', 'AO R'], ['', 'OULD', '', 'UH D'],
    ['^', 'OU', '^L', 'AH'], ['', 'OUP', '', 'UW P'], ['', 'OU', '', 'AW'], ['', 'OY', '', 'OY'], ['', 'OING', '', 'OW IH NG'], ['', 'OI', '', 'OY'], ['', 'OOR', '', 'AO R'],
    ['', 'OOK', '', 'UH K'], ['', 'OOD', '', 'UH D'], ['', 'OO', '', 'UW'], ['', 'O', 'E', 'OW'], ['', 'O', ' ', 'OW'], ['', 'OA', '', 'OW'], [' ', 'ONLY', '', 'OW N L IY'],
    [' ', 'ONCE', '', 'W AH N S'], ["", "ON'T", '', 'OW N T'], ['C', 'O', 'N', 'AA'], ['', 'O', 'NG', 'AO'], [' :^', 'O', 'N', 'AH'], ['I', 'ON', '', 'AX N'],
    ['#:', 'ON', ' ', 'AX N'], ['#^', 'ON', '', 'AX N'], ['', 'O', 'ST ', 'OW'], ['', 'OF', '^', 'AO F'], ['', 'OTHER', '', 'AH DH ER'], ['', 'OSS', ' ', 'AO S'],
    ['#:^', 'OM', '', 'AH M'], ['', 'O', '', 'AA']],
  p: [['', 'PH', '', 'F'], ['', 'PEOP', '', 'P IY P'], ['', 'POW', '', 'P AW'], ['', 'PUT', ' ', 'P UH T'], ['', 'P', '', 'P']],
  q: [['', 'QUAR', '', 'K W AO R'], ['', 'QU', '', 'K W'], ['', 'Q', '', 'K']],
  r: [[' ', 'RE', '^#', 'R IY'], ['', 'R', '', 'R']],
  s: [['', 'SH', '', 'SH'], ['#', 'SION', '', 'ZH AX N'], ['', 'SOME', '', 'S AH M'], ['#', 'SUR', '#', 'ZH ER'], ['', 'SUR', '#', 'SH ER'], ['#', 'SU', '#', 'ZH UW'],
    ['#', 'SSU', '#', 'SH UW'], ['#', 'SED', ' ', 'Z D'], ['#', 'S', '#', 'Z'], ['', 'SAID', '', 'S EH D'], ['^', 'SION', '', 'SH AX N'], ['', 'S', 'S', ''], ['.', 'S', ' ', 'Z'],
    ['#:.E', 'S', ' ', 'Z'], ['#:^##', 'S', ' ', 'Z'], ['#:^#', 'S', ' ', 'S'], ['U', 'S', ' ', 'S'], [' :#', 'S', ' ', 'Z'], [' ', 'SCH', '', 'S K'], ['', 'S', 'C+', ''],
    ['#', 'SM', '', 'Z M'], ['', 'S', '', 'S']],
  t: [[' ', 'THE', ' ', 'DH AX'], ['', 'TO', ' ', 'T UW'], ['', 'THAT', ' ', 'DH AE T'], [' ', 'THIS', ' ', 'DH IH S'], [' ', 'THEY', '', 'DH EY'], [' ', 'THERE', '', 'DH EH R'],
    ['', 'THER', '', 'DH ER'], ['', 'THEIR', '', 'DH EH R'], [' ', 'THAN', ' ', 'DH AE N'], [' ', 'THEM', ' ', 'DH EH M'], ['', 'THESE', ' ', 'DH IY Z'], [' ', 'THEN', '', 'DH EH N'],
    ['', 'THROUGH', '', 'TH R UW'], ['', 'THOSE', '', 'DH OW Z'], ['', 'THOUGH', ' ', 'DH OW'], [' ', 'THUS', '', 'DH AH S'], ['', 'TH', '', 'TH'], ['#:', 'TED', ' ', 'T IH D'],
    ['S', 'TI', '#N', 'CH'], ['', 'TI', 'O', 'SH'], ['', 'TI', 'A', 'SH'], ['', 'TIEN', '', 'SH AX N'], ['', 'TUR', '#', 'CH ER'], ['', 'TU', 'A', 'CH UW'], [' ', 'TWO', '', 'T UW'],
    ['', 'T', '', 'T']],
  u: [[' ', 'UN', 'I', 'Y UW N'], [' ', 'UN', '', 'AH N'], [' ', 'UPON', '', 'AX P AO N'], ['@', 'UR', '#', 'UH R'], ['', 'UR', '#', 'Y UH R'], ['', 'UR', '', 'ER'],
    ['', 'U', '^ ', 'AH'], ['', 'U', '^^', 'AH'], ['', 'UY', '', 'AY'], [' G', 'U', '#', ''], ['G', 'U', '%', ''], ['G', 'U', '#', 'W'], ['#N', 'U', '', 'Y UW'], ['@', 'U', '', 'UW'],
    ['', 'U', '', 'Y UW']],
  v: [['', 'VIEW', '', 'V Y UW'], ['', 'V', '', 'V']],
  w: [[' ', 'WERE', '', 'W ER'], ['', 'WA', 'S', 'W AA'], ['', 'WA', 'T', 'W AA'], ['', 'WHERE', '', 'W EH R'], ['', 'WHAT', '', 'W AA T'], ['', 'WHOL', '', 'HH OW L'],
    ['', 'WHO', '', 'HH UW'], ['', 'WH', '', 'W'], ['', 'WAR', '', 'W AO R'], ['', 'WOR', '^', 'W ER'], ['', 'WR', '', 'R'], ['', 'W', '', 'W']],
  x: [['', 'X', '', 'K S']],
  y: [['', 'YOUNG', '', 'Y AH NG'], [' ', 'YOU', '', 'Y UW'], [' ', 'YES', '', 'Y EH S'], [' ', 'Y', '', 'Y'], ['#:^', 'Y', ' ', 'IY'], ['#:^', 'Y', 'I', 'IY'], [' :', 'Y', ' ', 'AY'],
    [' :', 'Y', '#', 'AY'], [' :', 'Y', '^+:#', 'IH'], [' :', 'Y', '^#', 'AY'], ['', 'Y', '', 'IH']],
  z: [['', 'Z', '', 'Z']],
  "'": [['', "'", '', '']],
};
const VOW = 'AEIOUY', VOICED = 'BDVGJLMNRWZ', FRONT = 'EIY', SIB = ['S', 'C', 'G', 'Z', 'X', 'J', 'CH', 'SH'], LONGU = ['T', 'S', 'R', 'D', 'L', 'Z', 'N', 'J', 'TH', 'CH', 'SH'];
const isV = (c) => !!c && VOW.includes(c), isC = (c) => !!c && /[A-Z]/.test(c) && !isV(c);

/** Does the pattern match the letters before position i (read backward) or after it (forward)? */
function ctx(pat, s, i, dir) {
  const P = dir < 0 ? [...pat].reverse() : [...pat];
  let j = i;
  for (const p of P) {
    const c = s[j];
    if (p === ' ') { if (c !== undefined && c !== ' ') return false; j += dir; continue; }
    if (p === '#') { if (!isV(c)) return false; while (isV(s[j + dir])) j += dir; j += dir; continue; }
    if (p === ':') { while (isC(s[j])) j += dir; continue; }
    if (p === '^') { if (!isC(c)) return false; j += dir; continue; }
    if (p === '.') { if (!c || !VOICED.includes(c)) return false; j += dir; continue; }
    if (p === '+') { if (!c || !FRONT.includes(c)) return false; j += dir; continue; }
    if (p === '&') { const two = dir > 0 ? s.slice(j, j + 2) : s.slice(j - 1, j + 1); if (SIB.includes(two)) { j += 2 * dir; continue; } if (!SIB.includes(c)) return false; j += dir; continue; }
    if (p === '@') { const two = dir > 0 ? s.slice(j, j + 2) : s.slice(j - 1, j + 1); if (LONGU.includes(two)) { j += 2 * dir; continue; } if (!LONGU.includes(c)) return false; j += dir; continue; }
    if (p === '%') { // (right only) a suffix: ER, E, ES, ED, ING, ELY, or the end
      const rest = s.slice(j);
      const m = ['ING', 'ELY', 'ER', 'ES', 'ED', 'E'].find((x) => rest.startsWith(x));
      if (!m) return false; j += m.length; continue;
    }
    if (c !== p) return false;
    j += dir;
  }
  return true;
}

function rules(word) {
  const s = word.toUpperCase().replace(/[^A-Z']/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const list = R[s[i].toLowerCase()] || [];
    let done = false;
    for (const [L, M, Rt, P] of list) {
      if (!s.startsWith(M, i)) continue;
      if (L && !ctx(L, s, i - 1, -1)) continue;
      if (Rt && !ctx(Rt, s, i + M.length, 1)) continue;
      if (P) out.push(...P.split(' ').map((p) => (p === 'AX' ? 'AH' : p)));
      i += M.length; done = true; break;
    }
    if (!done) i++;
  }
  return out;
}

const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);
const UNSTRESSED_PREFIX = /^(a|be|de|re|con|com|pro|ex|en|em|un|in|im|dis|mis|ob|per|pre|sub|sur|trans)/;
/** Stress for a word that came from the rules: the first vowel, or the second after an unstressed prefix. */
function stress(ph) {
  const v = ph.map((p, i) => (VOWELS.has(p) ? i : -1)).filter((i) => i >= 0);
  if (!v.length) return ph;
  const k = v.length > 1 && /^(AH|IH)$/.test(ph[v[0]]) ? 1 : 0;
  return ph.map((p, i) => (VOWELS.has(p) ? `${p}${i === v[k] ? 1 : 0}` : p));
}
export { UNSTRESSED_PREFIX };
