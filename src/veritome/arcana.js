// ---------------------------------------------------------------------------------------
// THE MAJOR ARCANA: the cards of the Veritome, its first deck. Twenty-two, numbered 0 to XXI as the tarot numbers them, each with:
//
//   seal     sun | moon | star       Final Fantasy XIV's Astrologian: what playing it adds to the clasp (three seals, an Astrodyne)
//   rank     SS S A B C D E F G H     Greed Island's card ranks (Hunter x Hunter): how hard the card is to come by
//   limit    copies the Book can hold (its page, and spares in the free slots)
//   sitting  the photograph that earns a copy: a subject (veritome/subjects.js) in a state, photographed well enough
//   effect   what playing it does to the rules of the Courier's reality (veritome/effects.js), and for how long
//
// The sittings are what the tarot says each card is (the Fool is the one who leaps; the Hanged Man hangs; the Tower is struck), found
// in what the world already has, so the camera is a way of reading the world and the Book is what was read.
// The art is drawn here, on a canvas: a gold line emblem on deep indigo, the numeral at the head, no words (a card is a picture).
// ---------------------------------------------------------------------------------------
export const SEALS = { sun: { glyph: '☉', color: '#ffcf6a' }, moon: { glyph: '☾', color: '#bfd2ff' }, star: { glyph: '✶', color: '#f6b8ff' } };
export const RANKS = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

// sitting: { subject, state?, stars (at least), n (at least that many of it in the frame) }; or a special: { sky } { sun } { kinds: n }
export const ARCANA = [
  { id: 'fool', name: 'THE FOOL', seal: 'star', rank: 'C', limit: 3, sitting: { subject: 'clapper', state: 'air', stars: 1 }, hint: 'one who has leapt, caught in the air',
    effect: 'Fortune favours the next chest you summon: it comes up a tier higher.', dur: 0 },
  { id: 'magician', name: 'THE MAGICIAN', seal: 'sun', rank: 'B', limit: 3, sitting: { subject: 'clapper', state: 'mend', stars: 1 }, hint: 'hands at work, making a broken thing whole',
    effect: 'For ten seconds nothing you do costs Lachryma.', dur: 10 },
  { id: 'priestess', name: 'THE HIGH PRIESTESS', seal: 'moon', rank: 'B', limit: 3, sitting: { subject: 'well', stars: 2 }, hint: 'the deep water that keeps its secrets',
    effect: 'A survey pulse that costs nothing, and every pot and clapperjar near you seen through the walls.', dur: 20 },
  { id: 'empress', name: 'THE EMPRESS', seal: 'star', rank: 'C', limit: 3, sitting: { subject: 'palm', stars: 2 }, hint: 'what grows, green, where nothing should',
    effect: 'The mind refills four times as fast for thirty seconds.', dur: 30 },
  { id: 'emperor', name: 'THE EMPEROR', seal: 'sun', rank: 'B', limit: 2, sitting: { subject: 'chest', stars: 2 }, hint: 'a treasury, closed and kept',
    effect: 'Order: every loose thing near you is held still, and the clapperjars stand to attention.', dur: 10 },
  { id: 'hierophant', name: 'THE HIEROPHANT', seal: 'moon', rank: 'B', limit: 2, sitting: { subject: 'gong', stars: 2 }, hint: 'the bell that calls the faithful',
    effect: 'The two clapperjars nearest you are converted: they follow you.', dur: 0 },
  { id: 'lovers', name: 'THE LOVERS', seal: 'star', rank: 'C', limit: 3, sitting: { subject: 'clapper', n: 2, stars: 1 }, hint: 'two of a kind in one frame',
    effect: 'Every clapperjar near you dances, and the mind is a little refilled.', dur: 8 },
  { id: 'chariot', name: 'THE CHARIOT', seal: 'sun', rank: 'B', limit: 3, sitting: { subject: 'skiff', stars: 1 }, hint: 'a vessel that rides the wind',
    effect: 'You run a quarter faster for twenty seconds.', dur: 20 },
  { id: 'strength', name: 'STRENGTH', seal: 'sun', rank: 'B', limit: 3, sitting: { subject: 'pot', state: 'heavy', stars: 1 }, hint: 'a weight that should not be lifted',
    effect: 'Your blows (blade, brush, boot) land twice as hard for twenty seconds.', dur: 20 },
  { id: 'hermit', name: 'THE HERMIT', seal: 'moon', rank: 'C', limit: 3, sitting: { subject: 'lantern', stars: 1 }, hint: 'a light kept alone',
    effect: 'A lantern goes with you for forty-five seconds, and the ground near you is charted.', dur: 45 },
  { id: 'wheel', name: 'WHEEL OF FORTUNE', seal: 'star', rank: 'A', limit: 2, sitting: { subject: 'cog', stars: 2 }, hint: 'a wheel that turns of itself',
    effect: 'Spin: the effect of another card, chosen by the wheel; and the next chest comes up a tier higher.', dur: 0 },
  { id: 'justice', name: 'JUSTICE', seal: 'moon', rank: 'A', limit: 2, sitting: { subject: 'tally', stars: 2 }, hint: 'the stone where every catch is counted',
    effect: 'For fifteen seconds whatever is thrown at you is sent back the way it came.', dur: 15 },
  { id: 'hanged', name: 'THE HANGED MAN', seal: 'moon', rank: 'B', limit: 3, sitting: { subject: 'hanging', stars: 1 }, hint: 'one who hangs by a cord',
    effect: 'For four seconds the loose things near you fall upward.', dur: 4 },
  { id: 'death', name: 'DEATH', seal: 'moon', rank: 'A', limit: 2, sitting: { subject: 'shards', stars: 1 }, hint: 'a thing in the moment of its ending',
    effect: 'Every cracked pot near you comes apart, and every clapperjar near you loses a sigil.', dur: 0 },
  { id: 'temperance', name: 'TEMPERANCE', seal: 'star', rank: 'B', limit: 3, sitting: { subject: 'water', stars: 2 }, hint: 'still water, poured from one vessel to another',
    effect: 'The world goes at two thirds of its pace for eight seconds, and the mind costs half.', dur: 8 },
  { id: 'devil', name: 'THE DEVIL', seal: 'sun', rank: 'A', limit: 2, sitting: { subject: 'clapper', state: 'greed', stars: 2 }, hint: 'one who hoards more than it can carry',
    effect: 'Every loose bauble comes to you, and the clapperjars near you are drawn in.', dur: 3 },
  { id: 'tower', name: 'THE TOWER', seal: 'sun', rank: 'S', limit: 1, sitting: { subject: 'tower', stars: 2 }, hint: 'the tallest thing, from its foot',
    effect: 'Lightning strikes where you look, and everything near it is thrown up.', dur: 0 },
  { id: 'star', name: 'THE STAR', seal: 'star', rank: 'S', limit: 1, sitting: { sky: true }, hint: 'nothing but the open sky',
    effect: 'Hope: the mind is filled, and refills half again as fast for thirty seconds.', dur: 30 },
  { id: 'moon', name: 'THE MOON', seal: 'moon', rank: 'A', limit: 2, sitting: { subject: 'pond', stars: 2 }, hint: 'a reflection in the oasis',
    effect: 'For fifteen seconds the clapperjars cannot see you, and the room goes dark.', dur: 15 },
  { id: 'sun', name: 'THE SUN', seal: 'sun', rank: 'S', limit: 1, sitting: { sun: true }, hint: 'the sun itself, in the dunes',
    effect: 'Radiance: every clapperjar in sight is dazzled, all slip dries at once, and the mind is warmed.', dur: 0 },
  { id: 'judgement', name: 'JUDGEMENT', seal: 'star', rank: 'A', limit: 2, sitting: { subject: 'wreck', stars: 1 }, hint: 'the place where something broke',
    effect: 'Every wreck near you rises again, and every raider near you is unwritten.', dur: 0 },
  { id: 'world', name: 'THE WORLD', seal: 'star', rank: 'SS', limit: 1, sitting: { kinds: 5 }, hint: 'five kinds of thing in a single frame',
    effect: 'Completion: every card in play begins again, a free survey, the mind refilled, and the clasp filled with every seal.', dur: 0 },
].map((a, i) => ({ ...a, num: i, roman: ROMAN[i] }));
export const ARCANA_BY_ID = Object.fromEntries(ARCANA.map((a) => [a.id, a]));

// ---- the art ------------------------------------------------------------------------------------
const CACHE = new Map();
/** A card face (a canvas, w x h), drawn once and kept. `back`: the card's back instead. */
export function cardArt(id, w = 120, h = 200, back = false) {
  const key = `${id}|${w}|${h}|${back}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), A = ARCANA_BY_ID[id];
  const gold = '#e7c46a', ink = '#1b1430';
  // the field and the border
  const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#2b2050'); grad.addColorStop(1, '#14102a');
  g.fillStyle = grad; roundRect(g, 1, 1, w - 2, h - 2, w * 0.07); g.fill();
  g.strokeStyle = gold; g.lineWidth = Math.max(1.5, w * 0.025); roundRect(g, w * 0.05, w * 0.05, w * 0.9, h - w * 0.1, w * 0.05); g.stroke();
  g.lineWidth = 1; roundRect(g, w * 0.09, w * 0.09, w * 0.82, h - w * 0.18, w * 0.04); g.stroke();
  if (back || !A) {
    // the back: a clock face and a lens, the Veritome's own cover
    const cx = w / 2, cy = h / 2, R = w * 0.3;
    g.strokeStyle = gold; g.lineWidth = w * 0.02;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, R * 0.35, 0, Math.PI * 2); g.fillStyle = 'rgba(160,190,255,.35)'; g.fill(); g.stroke();
    for (const [a, l] of [[-1.2, 0.6], [0.4, 0.8]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R * l, cy + Math.sin(a) * R * l); g.stroke(); }
    CACHE.set(key, c); return c;
  }
  // the numeral at the head
  g.fillStyle = gold; g.font = `${Math.round(w * 0.13)}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(A.roman, w / 2, w * 0.2);
  // the emblem, in a square in the middle (unit coordinates: 0..1 across that square)
  const S = w * 0.7, ox = (w - S) / 2, oy = h * 0.3;
  g.save(); g.translate(ox, oy); g.scale(S, S);
  g.strokeStyle = gold; g.fillStyle = gold; g.lineWidth = 0.035; g.lineCap = 'round'; g.lineJoin = 'round';
  (EMBLEM[id] || (() => {}))(g);
  g.restore();
  // the seal at the foot
  const se = SEALS[A.seal];
  g.fillStyle = se.color; g.font = `${Math.round(w * 0.16)}px serif`;
  g.fillText(se.glyph, w / 2, h - w * 0.2);
  g.fillStyle = ink;
  CACHE.set(key, c);
  return c;
}

function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const L = (g, ...p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
const C = (g, x, y, r, fill = false, a0 = 0, a1 = Math.PI * 2) => { g.beginPath(); g.arc(x, y, r, a0, a1); fill ? g.fill() : g.stroke(); };
const star = (g, x, y, r, n = 8, k = 0.4) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * k : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
const EMBLEM = {
  fool: (g) => { L(g, 0.05, 0.85, 0.55, 0.85); C(g, 0.68, 0.45, 0.14); L(g, 0.68, 0.59, 0.62, 0.85); L(g, 0.55, 0.62, 0.85, 0.7); star(g, 0.25, 0.25, 0.08, 5); },
  magician: (g) => { g.beginPath(); for (let i = 0; i <= 60; i++) { const t = (i / 60) * Math.PI * 2; g.lineTo(0.5 + 0.28 * Math.sin(t), 0.3 + 0.12 * Math.sin(t) * Math.cos(t)); } g.stroke(); L(g, 0.5, 0.45, 0.5, 0.95); C(g, 0.5, 0.45, 0.05, true); },
  priestess: (g) => { L(g, 0.2, 0.1, 0.2, 0.95); L(g, 0.8, 0.1, 0.8, 0.95); C(g, 0.5, 0.45, 0.17, false, 0.6, 5.7); C(g, 0.56, 0.45, 0.13, false, 0.9, 5.4); },
  empress: (g) => { C(g, 0.5, 0.35, 0.18); L(g, 0.5, 0.53, 0.5, 0.92); L(g, 0.35, 0.75, 0.65, 0.75); for (const x of [0.15, 0.85]) L(g, x, 0.95, x, 0.55, x - 0.06, 0.65, x, 0.55, x + 0.06, 0.65); },
  emperor: (g) => { L(g, 0.25, 0.95, 0.25, 0.45, 0.75, 0.45, 0.75, 0.95); L(g, 0.25, 0.65, 0.75, 0.65); for (const s of [-1, 1]) { g.beginPath(); for (let i = 0; i <= 30; i++) { const t = (i / 30) * Math.PI * 1.6, r = 0.12 * (1 - i / 40); g.lineTo(0.5 + s * 0.13 + s * r * Math.cos(t), 0.25 - r * Math.sin(t)); } g.stroke(); } },
  hierophant: (g) => { L(g, 0.5, 0.05, 0.5, 0.95); for (const [y, w] of [[0.25, 0.14], [0.4, 0.22], [0.55, 0.3]]) L(g, 0.5 - w, y, 0.5 + w, y); },
  lovers: (g) => { C(g, 0.38, 0.5, 0.2); C(g, 0.62, 0.5, 0.2); g.beginPath(); g.moveTo(0.5, 0.92); g.bezierCurveTo(0.1, 0.7, 0.3, 0.55, 0.5, 0.72); g.bezierCurveTo(0.7, 0.55, 0.9, 0.7, 0.5, 0.92); g.fill(); },
  chariot: (g) => { L(g, 0.15, 0.3, 0.5, 0.12, 0.85, 0.3); L(g, 0.2, 0.3, 0.2, 0.62, 0.8, 0.62, 0.8, 0.3); C(g, 0.3, 0.78, 0.13); C(g, 0.7, 0.78, 0.13); },
  strength: (g) => { C(g, 0.5, 0.6, 0.2); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; L(g, 0.5 + Math.cos(a) * 0.24, 0.6 + Math.sin(a) * 0.24, 0.5 + Math.cos(a) * 0.32, 0.6 + Math.sin(a) * 0.32); } g.beginPath(); for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; g.lineTo(0.5 + 0.18 * Math.sin(t), 0.15 + 0.07 * Math.sin(t) * Math.cos(t)); } g.stroke(); },
  hermit: (g) => { L(g, 0.3, 0.05, 0.3, 0.95); L(g, 0.3, 0.2, 0.6, 0.2); g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.lineTo(0.62 + Math.cos(a) * 0.14, 0.42 + Math.sin(a) * 0.14); } g.closePath(); g.stroke(); star(g, 0.62, 0.42, 0.07, 6); },
  wheel: (g) => { C(g, 0.5, 0.5, 0.4); C(g, 0.5, 0.5, 0.1); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; L(g, 0.5 + Math.cos(a) * 0.1, 0.5 + Math.sin(a) * 0.1, 0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4); } },
  justice: (g) => { L(g, 0.5, 0.1, 0.5, 0.92); L(g, 0.15, 0.3, 0.85, 0.3); for (const x of [0.2, 0.8]) { L(g, x, 0.3, x - 0.1, 0.55); L(g, x, 0.3, x + 0.1, 0.55); C(g, x, 0.55, 0.1, false, 0, Math.PI); } },
  hanged: (g) => { L(g, 0.1, 0.08, 0.9, 0.08); L(g, 0.5, 0.08, 0.5, 0.3); L(g, 0.5, 0.3, 0.5, 0.65); L(g, 0.5, 0.42, 0.35, 0.55); L(g, 0.5, 0.42, 0.65, 0.55); L(g, 0.5, 0.3, 0.3, 0.2); C(g, 0.5, 0.75, 0.1); },
  death: (g) => { L(g, 0.25, 0.95, 0.65, 0.1); g.beginPath(); g.moveTo(0.65, 0.1); g.quadraticCurveTo(0.95, 0.2, 0.85, 0.45); g.stroke(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; C(g, 0.3 + Math.cos(a) * 0.07, 0.6 + Math.sin(a) * 0.07, 0.06); } },
  temperance: (g) => { for (const [x, y] of [[0.25, 0.25], [0.75, 0.7]]) { L(g, x - 0.12, y, x - 0.08, y + 0.2, x + 0.08, y + 0.2, x + 0.12, y); } g.beginPath(); g.moveTo(0.35, 0.3); g.bezierCurveTo(0.55, 0.3, 0.6, 0.5, 0.68, 0.7); g.stroke(); },
  devil: (g) => { C(g, 0.5, 0.5, 0.2); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0.5 + s * 0.12, 0.35); g.quadraticCurveTo(0.5 + s * 0.3, 0.2, 0.5 + s * 0.22, 0.05); g.stroke(); } L(g, 0.3, 0.85, 0.7, 0.85); for (const x of [0.38, 0.62]) C(g, x, 0.85, 0.05); },
  tower: (g) => { L(g, 0.35, 0.95, 0.38, 0.2, 0.62, 0.2, 0.65, 0.95); L(g, 0.33, 0.2, 0.67, 0.2, 0.6, 0.08, 0.4, 0.08, 0.33, 0.2); g.lineWidth = 0.045; L(g, 0.85, 0.02, 0.62, 0.22, 0.75, 0.25, 0.55, 0.45); },
  star: (g) => { star(g, 0.5, 0.4, 0.3, 8, 0.35); for (const [x, y] of [[0.15, 0.8], [0.35, 0.88], [0.65, 0.88], [0.85, 0.8], [0.12, 0.15], [0.88, 0.15]]) star(g, x, y, 0.05, 8, 0.4); },
  moon: (g) => { g.beginPath(); g.arc(0.5, 0.35, 0.25, 0, Math.PI * 2); g.fill(); g.save(); g.fillStyle = '#211a40'; g.beginPath(); g.arc(0.6, 0.3, 0.22, 0, Math.PI * 2); g.fill(); g.restore(); for (const x of [0.15, 0.85]) L(g, x - 0.06, 0.95, x - 0.06, 0.65, x + 0.06, 0.65, x + 0.06, 0.95); },
  sun: (g) => { C(g, 0.5, 0.5, 0.2, true); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r1 = i % 2 ? 0.32 : 0.42; L(g, 0.5 + Math.cos(a) * 0.26, 0.5 + Math.sin(a) * 0.26, 0.5 + Math.cos(a) * r1, 0.5 + Math.sin(a) * r1); } },
  judgement: (g) => { L(g, 0.2, 0.12, 0.75, 0.35); L(g, 0.75, 0.35, 0.85, 0.22, 0.88, 0.48, 0.75, 0.35); for (const x of [0.25, 0.5, 0.75]) { C(g, x, 0.75, 0.06); L(g, x, 0.81, x, 0.95); } },
  world: (g) => { g.beginPath(); g.ellipse(0.5, 0.5, 0.3, 0.45, 0, 0, Math.PI * 2); g.stroke(); C(g, 0.5, 0.35, 0.05, true); L(g, 0.5, 0.4, 0.5, 0.6); L(g, 0.5, 0.6, 0.42, 0.72); L(g, 0.5, 0.6, 0.58, 0.7); L(g, 0.38, 0.45, 0.62, 0.5); },
};
