// ---------------------------------------------------------------------------------------
// RUNES: how neuralese is written. Every letter is a stroke between two of the nine points of a three-by-three lattice, and a word's rune
// is all its letters' strokes drawn at once, so a word has one glyph, always the same, and words that share letters share strokes (SIVA
// and VOYD meet in the V). Drawn as pixel art at 1x (11 x 11, a pixel line between the points) in the mind's indigo, for the pixel kit to
// scale by a whole number (ui/pixel.js).
//
// Prior art: Tunic's runes (a language made of strokes on one fixed lattice, learned by seeing it used), the Gallifreyan circles and the
// D'ni of Riven (a constructed script that looks like it means something because it is regular), and the Futhark's straight strokes (cut
// in wood: no curves).
//
//   runeCanvas(word, { ink, glow }) -> canvas (11 x 11)        runeStrip(words) -> canvas (the runes in a row, a pixel apart)
// ---------------------------------------------------------------------------------------
const P = [[1, 1], [5, 1], [9, 1], [1, 5], [5, 5], [9, 5], [1, 9], [5, 9], [9, 9]];
// a stroke for each letter: two of the nine points (chosen so that no two letters share a stroke)
const STROKES = (() => {
  const pairs = [];
  for (let a = 0; a < 9; a++) for (let b = a + 1; b < 9; b++) {
    const [ax, ay] = P[a], [bx, by] = P[b];
    if (Math.abs(ax - bx) <= 4 && Math.abs(ay - by) <= 4) pairs.push([a, b]); // (neighbours only: short strokes read better)
  }
  const out = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => { out[ch] = pairs[(i * 7) % pairs.length]; });
  return out;
})();

function line(g, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function runeCanvas(word, { ink = '#d2c3f4', glow = '#563889' } = {}) {
  const c = document.createElement('canvas'); c.width = 11; c.height = 11;
  const g = c.getContext('2d');
  const strokes = [...String(word).toUpperCase()].map((ch) => STROKES[ch]).filter(Boolean);
  // a dark halo a pixel round the strokes, then the strokes
  g.fillStyle = glow;
  for (const [a, b] of strokes) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) line(g, P[a][0] + ox, P[a][1] + oy, P[b][0] + ox, P[b][1] + oy);
  g.fillStyle = ink;
  for (const [a, b] of strokes) line(g, P[a][0], P[a][1], P[b][0], P[b][1]);
  return c;
}

export function runeStrip(words, o) {
  const list = words.filter(Boolean);
  const c = document.createElement('canvas'); c.width = Math.max(1, list.length * 12 - 1); c.height = 11;
  const g = c.getContext('2d');
  list.forEach((w, i) => g.drawImage(runeCanvas(w, o), i * 12, 0));
  return c;
}
