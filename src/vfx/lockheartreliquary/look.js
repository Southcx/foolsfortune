// ---------------------------------------------------------------------------------------
// THE LOCKHEART'S RELIQUARY: its look as data and its small helpers (part of vfx/lockheartreliquary.js). The coffins' lacquer, trim and
// lid emblem, the outcomes' and the Possibilikeys' colours (read from tools/lockheart/table.js, so the piece never says other than the
// table), the System's film (vfx/oxidation.js FILM), the keyline, the verdigris of the plates, and the faces: Jersey 15 for a number,
// Cinzel for a name (ui/theme.js). Everything is drawn in dots (a line of the 480-line present), as the mock (board v10, r10-lockheart)
// draws it.
//
// Prior art: the mock's own tables and helpers (r10-lockheart.src.html: HEARTS' emblems, OUT, KEYS, filmArr, shade), ported.
//
//   EMBLEM[heartId]  OUT(id) -> { l, c, r }  heartLook(id) -> { col, trim, emb, fill, summon }  keyLook(id) -> { s, c }
//   film(s, a) -> css   rgba(hex, a)   mixH(a, b, t)   shade(hex, f)   hsh(i, s)   rng(seed)   KEY   VERD   J15(n)   CZ(n)
// ---------------------------------------------------------------------------------------
import { OUTCOMES, HEARTS, KEYS } from '../../tools/lockheart/table.js';
import { FONT } from '../../ui/theme.js';

export const TAU = Math.PI * 2, D = Math.PI / 180;
export const C01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const sm = (t) => { t = C01(t); return t * t * (3 - 2 * t); };
export const oB = (t, s = 1.70158) => { t = C01(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const KEY = '#0b0710'; // (the keyline: a light shape keylined dark)
export const VERD = { top: '32,96,88', bot: '7,28,28', hi: '#e2f3e6', mid: '#6fa596', lo: '#031210' }; // (the plates' verdigris)
export const J15 = (n) => `${n}px 'Jersey 15', ${FONT.sys}`;
export const CZ = (n) => `600 ${n}px ${FONT.title}`;

const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
const _f = [0, 0, 0];
/** The labradorite film at phase s (a turn is 1), as css with alpha a. */
export function film(s, a = 1) {
  s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, A = FILM[i], B = FILM[(i + 1) % 4], m = f * f * (3 - 2 * f);
  for (let k = 0; k < 3; k++) _f[k] = Math.round(A[k] + (B[k] - A[k]) * m);
  return `rgba(${_f[0]},${_f[1]},${_f[2]},${a})`;
}
export const hexOf = (n) => `#${(n >>> 0).toString(16).padStart(6, '0')}`;
const hexA = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgba = (h, a) => { const c = hexA(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
export const mixH = (a, b, t) => { const A = hexA(a), B = hexA(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * C01(t)).toString(16).padStart(2, '0')).join(''); };
export const shade = (h, f) => (f > 0 ? mixH(h, '#ffffff', f) : mixH(h, '#000000', -f));
export const hsh = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

/** The lid's emblem, a coffin a sign: the plain one a brass boss, the gambler's an ace, the shepherd's a crook, the Warden's a mouth. */
export const EMBLEM = { 'heart.plain': 'boss', 'heart.gambler': 'ace', 'heart.shepherd': 'crook', 'heart.summoning': 'mouth' };
const LOOKS = new Map();
export function heartLook(id) {
  let L = LOOKS.get(id);
  if (!L) { const H = HEARTS[id] || HEARTS['heart.plain']; L = { col: hexOf(H.color), trim: hexOf(H.trim), emb: EMBLEM[id] || 'boss', fill: H.fill, summon: H.mode === 'summoning' }; LOOKS.set(id, L); }
  return L;
}

/** An outcome's label, colour and rank (table.js), and the catch's two sectors (wheel.js's colours). */
const CATCH = { free: { l: 'FREE', c: '#5a4a62', r: 0 }, caught: { l: 'CAUGHT', c: '#b49be6', r: 1 } };
const OUTS = new Map();
export function OUT(id) {
  let o = OUTS.get(id);
  if (!o) { const T = OUTCOMES[id]; o = CATCH[id] || (T ? { l: T.label, c: hexOf(T.color), r: T.rank } : { l: String(id).toUpperCase(), c: '#9a8ea6', r: 0 }); OUTS.set(id, o); }
  return o;
}

/** A Possibilikey's look: its bow's shape (the id's short name: brass, invert, even, loaded, twin, wide, echo) and its colour. */
export function keyLook(id) { const K = KEYS[id]; return { s: String(id).replace(/^key\./, ''), c: hexOf(K?.color ?? 0xd9b048) }; }
