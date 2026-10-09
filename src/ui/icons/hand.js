// ---------------------------------------------------------------------------------------
// THE ICONS' HAND: the one way every icon of a choice card is drawn (ui/choicecard.js, ui/keywords.js), as pure rules over rows of
// characters, so the art reads in a text editor and a Node script can paint it (the icons are checked headless that way). An icon is
// AUTHORED as its light shape only, on the twelve-grey ramp of the maker's pixel kit (ui/pixel.js: tone 0 the darkest grey, 11 the
// lightest), and the hand adds the rest:
//   '#'  body: bevelled from the top left (the edge facing the light at tone 11, the inside 9, the edge away from it 7)
//   '+'  bright body (11, 10, 8): the part that does the thing (the shot, the burst, the fuel)
//   '-'  dim body (8, 7, 5): the part that waits (the glass of an empty bottle, the clock's time still to run)
//   '0'..'9', 'a', 'b'  a tone, kept as written;  'x'  a dark line inside a shape (tone 1: a crack, a pupil, a clock's hand)
//   '.'  nothing
// and then THE KEYLINE: one pixel of tone 0 round every drawn pixel (its eight neighbours), so every icon carries a light part and a
// dark part and reads on any window colour, the pale and the dark alike (casebook rule 105).
//
// Prior art: the enamel of cloisonne (a colour held inside a dark wire), the 8- and 16-bit consoles' sprite keylines (a dark outline
// round a lit shape, read on any background: Mega Man's, Kirby's), and the pixel kit's own twelve greys and palette swaps
// (ui/pixel.js), which this hand keeps: an icon is drawn once in greys and coloured by a palette, never redrawn for a state.
//
//   grid(w, h, (x, y) -> char) -> rows      a shape drawn by a rule (a ring, a drop, a wedge), as rows the hand reads
//   toneGrid(rows, { pad = 1, keyline = 0 }) -> { w, h, tones: Int8Array (-1 nothing, else 0..11) }
// ---------------------------------------------------------------------------------------

/** Rows of characters from a rule (a character a pixel; anything falsy is nothing). */
export const grid = (w, h, fn) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => fn(x, y) || '.').join(''));

const BODY = { '#': [11, 9, 7], '+': [11, 10, 8], '-': [8, 7, 5] };
const TONE = (c) => (c === 'x' ? 1 : c >= '0' && c <= '9' ? c.charCodeAt(0) - 48 : c === 'a' ? 10 : c === 'b' ? 11 : -1);

/** The hand: the authored rows bevelled and keylined, `pad` pixels of room round them for the keyline. */
export function toneGrid(rows, { pad = 1, keyline = 0 } = {}) {
  const w0 = Math.max(...rows.map((r) => r.length)), h0 = rows.length, w = w0 + pad * 2, h = h0 + pad * 2;
  const at = (x, y) => rows[y]?.[x] ?? '.';
  const tones = new Int8Array(w * h).fill(-1);
  for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) {
    const c = at(x, y); if (c === '.' || c === ' ') continue;
    let t = TONE(c);
    if (BODY[c]) {
      const [lit, mid, shade] = BODY[c], same = (cx, cy) => BODY[at(cx, cy)] !== undefined;
      t = !same(x, y - 1) || !same(x - 1, y) ? lit : !same(x, y + 1) || !same(x + 1, y) ? shade : mid;
    }
    if (t >= 0) tones[(y + pad) * w + x + pad] = t;
  }
  const drawn = Uint8Array.from(tones, (t) => (t >= 0 ? 1 : 0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (drawn[y * w + x]) continue;
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < w && yy < h && drawn[yy * w + xx]) { near = true; break; } }
    if (near) tones[y * w + x] = keyline;
  }
  return { w, h, tones };
}
