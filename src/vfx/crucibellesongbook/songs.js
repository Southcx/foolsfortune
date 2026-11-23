// ---------------------------------------------------------------------------------------
// THE CRUCIBELLE'S SONGBOOK: its page (part of vfx/crucibellesongbook.js). A leaf of paper on a walnut board, the songs written on it,
// one line a song: its name (the Codex's, SONGS.name), its notes as neumes in their degrees' colours (the same shapes the tines wear,
// so a song is read off the page and played off the tines), its cost in Lachryma now (less in fever: the bell's own sum), red while the
// pool cannot pay it. Over the lines, the head rule: the motif being played, heighted by pitch (the phrase written out).
// The motif is matched against each line as a prefix: the notes already played inked solid, the NEXT note standing proud on a gold
// ring and bobbing (motion, never a flash), the rest hollow; a line the motif no longer fits greys back, so the one still open reads.
// A pause long enough for the bell to begin again (four beats) lets the motif go: every line opens again. A song cast: its line's ink
// brightens and settles, a gold rule drawn under it.
//
// Prior art, as on a museum label: Ocarina of Time's song staff (the notes of a song shown as its buttons, played off them); shape-note
// tunebooks (The Sacred Harp's oblong page, a tune a line, read by the heads' shapes); the chant's neumes on one ruled line; Guitar
// Hero's highway (the next note the one that stands out); a fighting game's command list (the input to cast, its cost beside it).
//
//   pageDraw(x, S, t, X0, Y0, W, H)
// ---------------------------------------------------------------------------------------
import { C01, sm, J15, CZ, PAPER, PAPER_LO, INK, VERM, BRASS, BRASS_HI, WALNUT, WALNUT_LO, DEG, KEY, rgba, neumePath } from './look.js';

const HEAD = 12; // (dots: the head rule's band)
const fitCache = new Map();
/** A name fitted to `w` dots at up to 9 dots tall (measured once a face). */
function fit(x, s, w) {
  const k = `${s}|${w}`; let n = fitCache.get(k);
  if (!n) { n = 9; x.font = J15(n); while (n > 6 && x.measureText(s).width > w) { n -= 0.5; x.font = J15(n); } fitCache.set(k, n); }
  return n;
}
export const pageRemeasure = () => fitCache.clear();

/** `S.songs[i]`: { id, name, notes, k (notes matched), open (fits the motif), cost, afford, castAge }; `S.motif`: degrees, newest last. */
export function pageDraw(x, S, t, X0, Y0, W, H) {
  x.save(); x.globalAlpha = S.a;
  // the board and its leaf
  x.beginPath(); x.roundRect(X0 - 3, Y0 - 3, W + 6, H + 6, 4); x.fillStyle = WALNUT_LO; x.fill(); x.lineWidth = 1.2; x.strokeStyle = KEY; x.stroke();
  x.beginPath(); x.roundRect(X0 - 2, Y0 - 2, W + 4, H + 4, 3.5); x.fillStyle = WALNUT; x.fill();
  const pg = x.createLinearGradient(X0, Y0, X0, Y0 + H); pg.addColorStop(0, PAPER); pg.addColorStop(1, PAPER_LO);
  x.beginPath(); x.rect(X0, Y0, W, H); x.fillStyle = pg; x.fill();
  x.strokeStyle = rgba(INK, 0.15); x.lineWidth = 0.5; for (let i = 0; i < 9; i++) { const yy = Y0 + 3 + i * (H / 9); x.beginPath(); x.moveTo(X0 + 1, yy); x.lineTo(X0 + W - 1, yy + 0.4); x.stroke(); } // (the paper's laid lines)
  // the head rule: the motif played, heighted by degree over one ruled line
  const hy = Y0 + HEAD - 3;
  x.beginPath(); x.moveTo(X0 + 4, hy); x.lineTo(X0 + W - 4, hy); x.lineWidth = 0.8; x.strokeStyle = rgba(INK, 0.55); x.stroke();
  x.font = CZ(7); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = rgba(INK, 0.6); x.fillText('SONGS', X0 + 4, hy - 1.6);
  const mot = S.motif, mx0 = X0 + 40;
  mot.forEach((m, i) => {
    const px = mx0 + i * 9, py = hy - 1 - (m.d - 1) * 1.4, k = S.motifA;
    x.save(); x.translate(px, py); x.globalAlpha *= k; neumePath(x, m.d, 2.6); x.lineWidth = 1.8; x.strokeStyle = KEY; x.stroke();
    if (m.on) { x.fillStyle = DEG[m.d - 1]; x.fill(); } else { x.lineWidth = 0.9; x.strokeStyle = DEG[m.d - 1]; x.stroke(); }
    x.restore();
  });
  // the songs, a line each
  const rows = S.songs, rh = (H - HEAD) / rows.length, nameW = Math.round(W * 0.5), nx0 = X0 + nameW + 4, ns = 3.4, gap = 10;
  rows.forEach((R, i) => {
    const y = Y0 + HEAD + rh * i, cy = y + rh / 2, dim = R.open ? 1 : 0.32, cast = R.castAge >= 0 && R.castAge < 1.4 ? 1 - sm(R.castAge / 1.4) : 0;
    if (cast > 0) { x.fillStyle = rgba(BRASS_HI, 0.35 * cast); x.fillRect(X0 + 1, y + 0.5, W - 2, rh - 1); }
    if (i) { x.beginPath(); x.moveTo(X0 + 3, y); x.lineTo(X0 + W - 3, y); x.lineWidth = 0.5; x.strokeStyle = rgba(INK, 0.22); x.stroke(); }
    x.globalAlpha = S.a * dim;
    // the name
    const fs = fit(x, R.name, nameW); x.font = J15(fs); x.textAlign = 'left';
    x.fillStyle = R.k > 0 && R.open ? INK : rgba(INK, 0.78); x.fillText(R.name, X0 + 4, cy + fs * 0.34);
    // the notes: played inked, the next standing proud, the rest hollow
    R.notes.forEach((d, j) => {
      const px = nx0 + j * gap, played = j < R.k, next = R.open && j === R.k && S.alive, bob = next ? Math.sin(t * 5) * 0.9 : 0, py = cy + bob - (next ? 0.6 : 0), col = DEG[d - 1];
      x.save(); x.translate(px, py);
      if (next) { x.beginPath(); x.arc(0, 0, ns + 2.6, 0, Math.PI * 2); x.lineWidth = 1.2; x.strokeStyle = BRASS; x.stroke(); x.fillStyle = rgba(BRASS_HI, 0.3); x.fill(); }
      neumePath(x, d, next ? ns * 1.15 : ns); x.lineWidth = 2; x.strokeStyle = KEY; x.stroke();
      if (played || next || cast > 0) { x.fillStyle = col; x.fill(); }
      else { x.fillStyle = rgba(PAPER, 0.9); x.fill(); x.lineWidth = 1.1; x.strokeStyle = col; x.stroke(); }
      x.restore();
    });
    // a song cast: a gold rule drawn under its notes as its ink settles
    if (cast > 0) { const u = C01(R.castAge / 0.35); x.beginPath(); x.moveTo(nx0 - 4, cy + ns + 2.2); x.lineTo(nx0 - 4 + (R.notes.length * gap) * u, cy + ns + 2.2); x.lineWidth = 1.2; x.strokeStyle = BRASS; x.stroke(); }
    // the cost now, red while the pool cannot pay it
    x.font = J15(9); x.textAlign = 'right';
    x.fillStyle = R.afford ? rgba(INK, 0.85) : VERM; x.fillText(String(R.cost), X0 + W - 4, cy + 3);
    x.globalAlpha = S.a;
  });
  x.restore();
}
