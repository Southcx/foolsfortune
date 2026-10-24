// ---------------------------------------------------------------------------------------
// THE CARD BACKS: the two backs the game draws face down, as canvas 2D in a 64 x 104 frame (the house deck's cell, fired at 2x by
// vfx/bazaarfaces.js; any other size by `drawBackOn`). Drawn once into an atlas cell or a cached canvas: no material, no program.
//   - THE HOUSE DECK'S BACK (Raku's tables; Gold Saucer on clay): a lapis ground under a fine guilloche (a hypotrochoid lace), a gold
//     border with an interlaced wave and a rosette in each corner, and at the middle a chip seen from above: its edge spots in the
//     chips' colours (ivory, cinnabar, lapis), rings of cinnabar and ivory, a gold eight-point star.
//   - THE ARCANA'S BACK (the collection's Major Arcana, the reading table's and reading view's face-down cards): deep plum velvet
//     (the underside's), the Comb's hex cells as a faint field, a thin keyline walking through the labradorite film's four colours,
//     two heptagrams (one the other turned over) with a tip in each of the seven feelings' colours, and the eye in the middle:
//     a vesica, an iris in the film, a pupil, no highlight (the game's eye motif).
// Both read the same upside down (tarot reversals show): everything is drawn through `sym`, a drawing and its half-turn, or is round.
// Prior art: a Bicycle deck's back (a symmetric field in a border), Golden Dawn / Rider-Waite backs (one pattern that survives a
// reversal), a casino chip's edge spots (Paulson's), the guilloche on a banknote (a hypotrochoid lace).
//   drawHouseBack(g, W, H)   drawArcanaBack(g, W, H)   drawBackOn(g, kind, w, h)   FILM   HEX_R
// ---------------------------------------------------------------------------------------
import { COLOR, DISPLAY_ORDER } from '../progress/weather.js';

/** The labradorite film's four stops (OVERLAY.md 10.4). */
export const FILM = ['#4c0fb3', '#0a8cbf', '#f2b82e', '#d91a80'];
const CHIP = { ivory: '#efe6d2', cinnabar: '#b8322a', lapis: '#2f5aa8', gold: '#e8c35a', goldDeep: '#a87a22' };
const TAU = Math.PI * 2;
const hex = (n) => '#' + n.toString(16).padStart(6, '0');

/** A drawing and its half-turn about the frame's middle: whatever `fn` draws, the back looks the same upside down. */
const sym = (g, W, H, fn) => { fn(); g.save(); g.translate(W, H); g.rotate(Math.PI); fn(); g.restore(); };
const path = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
const star = (cx, cy, r1, r2, n, rot = -Math.PI / 2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n; p.push([cx + Math.cos(a) * (i % 2 ? r2 : r1), cy + Math.sin(a) * (i % 2 ? r2 : r1)]); } return p; };

// ------------------------------------------------------------------ the house deck's back
export function drawHouseBack(g, W = 64, H = 104) {
  const cx = W / 2, cy = H / 2;
  g.save();
  g.fillStyle = '#e8d7b6'; g.fillRect(0, 0, W, H); // (the deck's cream edge, as the faces)
  g.fillStyle = CHIP.goldDeep; g.fillRect(2, 2, W - 4, H - 4);
  const ground = g.createRadialGradient(cx, cy, 4, cx, cy, H * 0.62); ground.addColorStop(0, '#2a4f9a'); ground.addColorStop(1, '#122a62');
  g.fillStyle = ground; g.fillRect(3, 3, W - 6, H - 6);
  g.save(); g.beginPath(); g.rect(4, 4, W - 8, H - 8); g.clip();
  // the guilloche: three hypotrochoids (R 32, r 8: four lobes, so a half-turn leaves them be) stretched to the card, a thread each
  g.translate(cx, cy); g.scale(0.95, 1.5); g.lineWidth = 0.3;
  [[11, 0.5, CHIP.gold], [8, 0.34, CHIP.gold], [5, 0.3, CHIP.ivory]].forEach(([d, a, c]) => {
    g.globalAlpha = a; g.strokeStyle = c; g.beginPath();
    for (let i = 0; i <= 480; i++) { const t = (i / 480) * TAU * 1, k = 3, x = 24 * Math.cos(t) + d * Math.cos(k * t), y = 24 * Math.sin(t) - d * Math.sin(k * t); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  });
  g.restore();
  // the border: two gold lines with two interlaced waves between (the top and the left drawn, the bottom and the right their half-turn)
  g.strokeStyle = CHIP.gold; g.lineWidth = 0.9; g.strokeRect(5.5, 5.5, W - 11, H - 11);
  g.lineWidth = 0.5; g.strokeRect(9.5, 9.5, W - 19, H - 19);
  sym(g, W, H, () => {
    g.lineWidth = 0.45;
    [0, Math.PI].forEach((ph, j) => {
      g.strokeStyle = j ? CHIP.ivory : CHIP.gold; g.globalAlpha = j ? 0.55 : 0.9;
      g.beginPath(); for (let x = 9.5; x <= W - 9.5; x += 0.5) { const y = 7.5 + Math.sin((x - 9.5) * 0.9 + ph) * 1.3; x === 9.5 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.beginPath(); for (let y = 9.5; y <= H / 2; y += 0.5) { const x = 7.5 + Math.sin((y - 9.5) * 0.9 + ph) * 1.3; y === 9.5 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    });
    g.globalAlpha = 1;
    for (const x of [7.5, W - 7.5]) { // (a rosette at the top corners, so all four)
      g.fillStyle = CHIP.cinnabar; g.beginPath(); g.arc(x, 7.5, 3.2, 0, TAU); g.fill();
      g.fillStyle = CHIP.gold; g.beginPath(); path(g, star(x, 7.5, 3.2, 1.4, 8)); g.fill();
    }
  });
  // the medallion: a chip from above
  g.fillStyle = '#0c1c48'; g.beginPath(); g.arc(cx, cy, 17.2, 0, TAU); g.fill();
  g.fillStyle = CHIP.gold; g.beginPath(); g.arc(cx, cy, 16.4, 0, TAU); g.fill();
  const spots = 12; // (the edge spots: ivory and cinnabar in turn, an even count, so the half-turn matches)
  for (let i = 0; i < spots; i++) {
    const a = (i / spots) * TAU; g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = i % 2 ? CHIP.cinnabar : CHIP.ivory; g.fillRect(-2.1, -15.9, 4.2, 4.4); g.restore();
  }
  g.fillStyle = CHIP.lapis; g.beginPath(); g.arc(cx, cy, 11.6, 0, TAU); g.fill();
  g.lineWidth = 1.4; g.strokeStyle = CHIP.ivory; g.beginPath(); g.arc(cx, cy, 10.2, 0, TAU); g.stroke();
  g.strokeStyle = CHIP.cinnabar; g.beginPath(); g.arc(cx, cy, 8.4, 0, TAU); g.stroke();
  g.fillStyle = '#17317a'; g.beginPath(); g.arc(cx, cy, 7.4, 0, TAU); g.fill();
  g.fillStyle = CHIP.gold; g.beginPath(); path(g, star(cx, cy, 6.6, 2.7, 8)); g.fill();
  g.fillStyle = CHIP.cinnabar; g.beginPath(); g.arc(cx, cy, 1.7, 0, TAU); g.fill();
  g.restore();
}

// ------------------------------------------------------------------ the Arcana's back
/** The Comb's cells' radius in the frame (a pointy hex; the field's lattice is centred on a cell, so it turns over onto itself). */
export const HEX_R = 3.6;
export function drawArcanaBack(g, W = 64, H = 104) {
  const cx = W / 2, cy = H / 2;
  g.save();
  g.fillStyle = '#e8d7b6'; g.fillRect(0, 0, W, H);
  const velvet = g.createRadialGradient(cx, cy, 3, cx, cy, H * 0.62); velvet.addColorStop(0, '#4d2a63'); velvet.addColorStop(1, '#1d0d2a');
  g.fillStyle = velvet; g.fillRect(2, 2, W - 4, H - 4);
  g.save(); g.beginPath(); g.rect(3, 3, W - 6, H - 6); g.clip();
  // the Comb: hex cells, faint
  g.translate(cx, cy); g.strokeStyle = 'rgba(255,226,200,0.085)'; g.lineWidth = 0.4;
  const dx = Math.sqrt(3) * HEX_R, dy = 1.5 * HEX_R;
  for (let r = -40; r <= 40; r++) for (let q = -40; q <= 40; q++) {
    const x = dx * (q + r / 2), y = dy * r; if (Math.abs(x) > W * 0.6 || Math.abs(y) > H * 0.6) continue;
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; g.lineTo(x + Math.cos(a) * HEX_R, y + Math.sin(a) * HEX_R); } g.closePath(); g.stroke();
  }
  g.restore();
  // the keyline: the film's four colours walking round, drawn from the left middle over the top to the right middle, then its half-turn
  const x0 = 4.5, y0 = 4.5, x1 = W - 4.5, y1 = H - 4.5, top = [[x0, cy], [x0, y0], [x1, y0], [x1, cy]];
  const seg = []; for (let s = 0; s < 3; s++) { const [ax, ay] = top[s], [bx, by] = top[s + 1], L = Math.hypot(bx - ax, by - ay); for (let d = 0; d < L; d += 2.6) { const e = Math.min(L, d + 2.6); seg.push([ax + ((bx - ax) * d) / L, ay + ((by - ay) * d) / L, ax + ((bx - ax) * e) / L, ay + ((by - ay) * e) / L]); } }
  sym(g, W, H, () => { g.lineWidth = 1; g.lineCap = 'butt'; seg.forEach(([ax, ay, bx, by], i) => { g.strokeStyle = FILM[i % 4]; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }); });
  g.strokeStyle = 'rgba(232,195,90,0.4)'; g.lineWidth = 0.5; g.strokeRect(7, 7, W - 14, H - 14);
  // the seven feelings: a heptagram tip up and its half-turn tip down, a tip in each feeling's colour, most positive first
  const R1 = Math.min(25, H * 0.24), R2 = 11.5;
  sym(g, W, H, () => {
    const pts = star(cx, cy, R1, R2, 7);
    g.fillStyle = 'rgba(86,48,112,0.62)'; g.beginPath(); path(g, pts); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(232,195,90,0.75)'; g.lineWidth = 0.5; g.stroke();
    DISPLAY_ORDER.forEach((a, i) => { const t = pts[i * 2], u = 0.86; g.fillStyle = hex(COLOR[a]); g.beginPath(); g.arc(cx + (t[0] - cx) * u, cy + (t[1] - cy) * u, 1.7, 0, TAU); g.fill(); });
  });
  // the eye: a vesica, its iris in the film (rings of its four colours), a pupil, no glint
  const ew = 15.5, eh = 8.6;
  g.beginPath(); g.moveTo(cx - ew, cy); g.quadraticCurveTo(cx, cy - eh * 2, cx + ew, cy); g.quadraticCurveTo(cx, cy + eh * 2, cx - ew, cy); g.closePath();
  g.fillStyle = '#12081c'; g.fill();
  const lid = g.createLinearGradient(cx - ew, 0, cx + ew, 0); [...FILM, ...[...FILM].reverse()].forEach((c, i) => lid.addColorStop(i / 7, c)); // (a palindrome: the half-turn is the same)
  g.strokeStyle = lid; g.lineWidth = 1.3; g.stroke();
  g.save(); g.beginPath(); g.moveTo(cx - ew, cy); g.quadraticCurveTo(cx, cy - eh * 2, cx + ew, cy); g.quadraticCurveTo(cx, cy + eh * 2, cx - ew, cy); g.closePath(); g.clip();
  [[6.2, FILM[0]], [5.2, FILM[1]], [4.2, FILM[2]], [3.2, FILM[3]]].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); });
  g.fillStyle = '#0a0410'; g.beginPath(); g.arc(cx, cy, 2.1, 0, TAU); g.fill();
  g.restore();
  g.restore();
}

/** Either back drawn on a canvas context of `w` x `h` pixels (a card of any size: the frame is 64 wide and as tall as the card is). */
export function drawBackOn(g, kind, w, h) {
  const s = w / 64; g.save(); g.scale(s, s);
  (kind === 'house' ? drawHouseBack : drawArcanaBack)(g, 64, h / s);
  g.restore();
}
