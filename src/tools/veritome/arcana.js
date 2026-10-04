// ---------------------------------------------------------------------------------------
// THE MAJOR ARCANA: the first section of the Book's designated pages (cards.js). Twenty-two, numbered 0 to XXI as the tarot numbers
// them. They are not spells: the Veritome reads the world, it does not rewrite it, so an Arcana card is a picture of a truth the
// Courier has SEEN, earned by photographing its SITTING (what the tarot says the card is: the Fool is the one who leaps, the Hanged
// Man hangs, the Tower is struck) and appraising the photograph in the darkroom (darkroom.js). Each card has:
//
//   rank     SS S A B C D E F G H     Greed Island's card ranks (Hunter x Hunter): how hard the card is to come by
//   limit    copies the Book may hold (its page, and spares in the free slots)
//   sitting  the photograph that earns a copy: a subject (subjects.js) in a state, photographed well enough
//   hint     the sitting as a riddle, shown on the empty page
//   lore     what is written on the page once the card is bound: the reading, in the Courier's hand
//
// The emblems are drawn here (cards.js frames them): a gold line on deep indigo, no words (a card is a picture).
// ---------------------------------------------------------------------------------------
export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

// sitting: { subject, state?, stars (at least), n (at least that many of it in the frame) }; or a special: { sky } { sun } { kinds: n }
export const ARCANA = [
  { id: 'fool', name: 'The Fool', rank: 'C', limit: 3, sitting: { subject: 'clapper', state: 'air', stars: 1 }, hint: 'one who has leapt, caught in the air',
    lore: 'Every journey in this book begins with a step off something. The jars take it without looking; so, it seems, did I.' },
  { id: 'magician', name: 'The Magician', rank: 'B', limit: 3, sitting: { subject: 'clapper', state: 'mend', stars: 1 }, hint: 'hands at work, making a broken thing whole',
    lore: 'Will, made into gold along a crack. It mends what I break, and the mended thing is worth more than it was.' },
  { id: 'priestess', name: 'The High Priestess', rank: 'B', limit: 3, sitting: { subject: 'well', stars: 2 }, hint: 'the deep water that keeps its secrets',
    lore: 'What is known and not said. The Well goes further down than the dunes go up.' },
  { id: 'empress', name: 'The Empress', rank: 'C', limit: 3, sitting: { subject: 'palm', stars: 2 }, hint: 'what grows, green, where nothing should',
    lore: 'Abundance where there ought to be none. The palms drink from somewhere.' },
  { id: 'emperor', name: 'The Emperor', rank: 'B', limit: 2, sitting: { subject: 'chest', stars: 2 }, hint: 'a treasury, closed and kept',
    lore: 'Order, and the keeping of things. Everything worth having in this place is shut in something.' },
  { id: 'hierophant', name: 'The Hierophant', rank: 'B', limit: 2, sitting: { subject: 'gong', stars: 2 }, hint: 'the bell that calls the faithful',
    lore: 'The rite and the rule. Strike it and the room keeps time with you.' },
  { id: 'lovers', name: 'The Lovers', rank: 'C', limit: 3, sitting: { subject: 'clapper', n: 2, stars: 1 }, hint: 'two of a kind in one frame',
    lore: 'A choice made by two. They are never far from one another, and never quite together.' },
  { id: 'chariot', name: 'The Chariot', rank: 'B', limit: 3, sitting: { subject: 'skiff', stars: 1 }, hint: 'a vessel that rides the wind',
    lore: 'Will steering the wind. The skiff goes where the sail and I agree.' },
  { id: 'strength', name: 'Strength', rank: 'B', limit: 3, sitting: { subject: 'pot', state: 'heavy', stars: 1 }, hint: 'a weight that should not be lifted',
    lore: 'Not the lifting: the knowing what not to lift. A word made it heavy; a photograph made it honest again.' },
  { id: 'hermit', name: 'The Hermit', rank: 'C', limit: 3, sitting: { subject: 'lantern', stars: 1 }, hint: 'a light kept alone',
    lore: 'One light, carried inward. Every lantern here hangs where someone once needed to see.' },
  { id: 'wheel', name: 'Wheel of Fortune', rank: 'A', limit: 2, sitting: { subject: 'cog', stars: 2 }, hint: 'a wheel that turns of itself',
    lore: 'What goes round. Nobody winds the mill; it turns because it has always turned.' },
  { id: 'justice', name: 'Justice', rank: 'A', limit: 2, sitting: { subject: 'tally', stars: 2 }, hint: 'the stone where every catch is counted',
    lore: 'The account kept. The tally does not forget a fish, and neither, now, does the Book.' },
  { id: 'hanged', name: 'The Hanged Man', rank: 'B', limit: 3, sitting: { subject: 'hanging', stars: 1 }, hint: 'one who hangs by a cord',
    lore: 'A pause, upside down, that sees further than standing would.' },
  { id: 'death', name: 'Death', rank: 'A', limit: 2, sitting: { subject: 'shards', stars: 1 }, hint: 'a thing in the moment of its ending',
    lore: 'An ending caught in the act. Nothing here stays broken for long; the jars see to that.' },
  { id: 'temperance', name: 'Temperance', rank: 'B', limit: 3, sitting: { subject: 'water', stars: 2 }, hint: 'still water, poured from one vessel to another',
    lore: 'The middle way, poured. Water in this place is always on its way somewhere else.' },
  { id: 'devil', name: 'The Devil', rank: 'A', limit: 2, sitting: { subject: 'clapper', state: 'greed', stars: 2 }, hint: 'one who hoards more than it can carry',
    lore: 'Wanting, swallowed whole. The fat ones are fat with what I dropped.' },
  { id: 'tower', name: 'The Tower', rank: 'S', limit: 1, sitting: { subject: 'tower', stars: 2 }, hint: 'the tallest thing, from its foot',
    lore: 'The thing built too high, seen from where it will fall. The kiln is where the jars come from.' },
  { id: 'star', name: 'The Star', rank: 'S', limit: 1, sitting: { sky: true }, hint: 'nothing but the open sky',
    lore: 'Hope, with nothing in the way. The sky here is painted, and it is still the sky.' },
  { id: 'moon', name: 'The Moon', rank: 'A', limit: 2, sitting: { subject: 'pond', stars: 2 }, hint: 'a reflection in the oasis',
    lore: 'What is seen twice, once wrongly. The oasis shows a sky the Dunes do not have.' },
  { id: 'sun', name: 'The Sun', rank: 'S', limit: 1, sitting: { sun: true }, hint: 'the sun itself, in the Dunes',
    lore: 'The plain truth, too bright to look at for long. I looked anyway; the Book has it now.' },
  { id: 'judgement', name: 'Judgement', rank: 'A', limit: 2, sitting: { subject: 'wreck', stars: 1 }, hint: 'the place where something broke',
    lore: 'The call to rise again. Every wreck is waiting for a jar to come and say so.' },
  { id: 'world', name: 'The World', rank: 'SS', limit: 1, sitting: { kinds: 5 }, hint: 'five kinds of thing in a single frame',
    lore: 'Completion: the whole of it, held still at once. The last page of the first section, and the first proof the Book can hold a world.' },
].map((a, i) => ({ ...a, num: i, roman: ROMAN[i] }));
export const ARCANA_BY_ID = Object.fromEntries(ARCANA.map((a) => [a.id, a]));

// ---- the emblems: drawn in a unit square (0..1 across), gold line on the card's field ------------------
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const L = (g, ...p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
const C = (g, x, y, r, fill = false, a0 = 0, a1 = Math.PI * 2) => { g.beginPath(); g.arc(x, y, r, a0, a1); fill ? g.fill() : g.stroke(); };
const star = (g, x, y, r, n = 8, k = 0.4) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * k : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
export const EMBLEM = {
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
