// ---------------------------------------------------------------------------------------
// THE CARD BACK SET: twelve more backs a deck may wear, drawn as canvas 2D in the 64 x 104 frame of vfx/cardbacks.js (fired at 2x into the
// atlas's foot by vfx/bazaarfaces.js, one cell each: no material, no program), and the choice of which back each deck wears.
//   - THE FOUR SUITS': Wands (ember and vine), Cups (wave and a double chalice), Swords (four blades from a pommel, clouds), Pentacles
//     (a coin lattice, a wheat wreath round a ten-point star); each in its suit's colour (the reading view's SUIT_LOOK).
//   - THE FOUR ISLANDS' DRESSES (OVERLAY.md 15.4): Clay (Anagami: glazed earth, hidasuki bands, a kiln's flame stamp), Nacre (Margarite:
//     pearl, lamp brass, scallop shells), Glass (Entropolis: an etched prism lattice, amethyst), Brine (the Emocean: tarred ground, rope, salt).
//   - THE FOUR SEASONS': spring blossom, summer sun, autumn leaves, winter frost.
// Every back is the same upside down (tarot reversals show): what a drawing lays in the top half is laid again by its half-turn (`half`),
// or it is round or a lattice about the card's middle.
// THE CHOICE: `chosenBack(deck)` / `chooseBack(deck, id)` for the two decks, `house` (Raku's tables) and `arcana` (the Major Arcana face down),
// each wearing its own default or any of the set; a plain module-level store, so the atlas and the pieces read it with no `game`. `backCell`
// says which atlas card index a deck's back is now (78 the house's own, 80 the Arcana's own, 81 .. 92 the set); `onBackChange(fn)` hears
// a change. The save, the options and the chat command are ui/cardbackchoice.js (`game.cardBacks`).
// Prior art: a Bicycle deck's back (a symmetric field in a border), the Rider-Waite suits' elements, Japanese hidasuki firing marks, seigaiha,
// a banknote's guilloche, a snowflake's Bentley photographs.
//   BACK_SET [{ id, label, line, group, draw(g, W, H) }]   BACK_DEFAULT   backCell(deck)   backCellOf(id)   chosenBack(deck)   chooseBack(deck, id)
//   onBackChange(fn)   drawBackSet(g, id, W, H)   BACK_FIRST   BACK_DECKS
// ---------------------------------------------------------------------------------------
import { sym, path, star, TAU } from './cardbacks.js';

/** The suits' colours (the reading view's SUIT_LOOK, vfx/readingview.js: Wands fire, Cups water, Swords air, Pentacles earth and its gold). */
const SUIT = { wands: '#ff6a2a', cups: '#3fa8d8', swords: '#cfd8ff', pentacles: '#e0b040' };

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** `fn` drawn in the top half and its half-turn in the bottom: the back reads the same upside down. */
const half = (g, W, H, fn) => sym(g, W, H, () => { g.save(); g.beginPath(); g.rect(0, 0, W, H / 2); g.clip(); fn(); g.restore(); });
/** `fn` inside the card's printed area. */
const inner = (g, W, H, fn) => { g.save(); g.beginPath(); g.rect(4, 4, W - 8, H - 8); g.clip(); fn(); g.restore(); };
const disc = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
const ringAt = (g, x, y, r, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); };
const grad = (g, cx, cy, r0, r1, a, b) => { const q = g.createRadialGradient(cx, cy, r0, cx, cy, r1); q.addColorStop(0, a); q.addColorStop(1, b); return q; };
/** The card's cream edge, a rim, and a ground that darkens toward the edges. */
function frame(g, W, H, rim, c0, c1) {
  g.fillStyle = '#e8d7b6'; g.fillRect(0, 0, W, H); g.fillStyle = rim; g.fillRect(2, 2, W - 4, H - 4);
  g.fillStyle = grad(g, W / 2, H / 2, 4, H * 0.62, c0, c1); g.fillRect(3, 3, W - 6, H - 6);
}
const border = (g, W, H, a, b = a) => { g.strokeStyle = a; g.lineWidth = 0.9; g.strokeRect(5.5, 5.5, W - 11, H - 11); g.strokeStyle = b; g.lineWidth = 0.45; g.strokeRect(9, 9, W - 18, H - 18); };
/** Something along an axis: from (x, y) at `rot`, its drawing in a frame whose +y runs along the axis. */
const at = (g, x, y, rot, fn) => { g.save(); g.translate(x, y); g.rotate(rot); fn(); g.restore(); };

// ------------------------------------------------------------------ the suits'
function wands(g, W, H) {
  const C = SUIT.wands, cx = W / 2, cy = H / 2;
  frame(g, W, H, '#7a2a10', '#4a1a0e', '#190806');
  inner(g, W, H, () => half(g, W, H, () => {
    const r = rng(11);
    for (let i = 0; i < 30; i++) { const x = 8 + r() * (W - 16), y = 8 + r() * (cy - 6), s = 0.5 + r() * 1.1; g.globalAlpha = 0.25 + r() * 0.5; g.fillStyle = r() < 0.3 ? '#ffd36a' : C; path(g, [[x, y - s * 1.4], [x + s, y], [x, y + s * 1.4], [x - s, y]]); g.fill(); }
    g.globalAlpha = 1;
    for (const side of [0, 1]) { // a vine each side with leaves, sprouting down from the top
      const vx = (y) => (side ? W - 10.5 : 10.5) + (side ? -1 : 1) * 2.6 * Math.sin(y * 0.42 + side * Math.PI);
      g.strokeStyle = '#4f8a34'; g.lineWidth = 0.9; g.beginPath(); for (let y = 8; y <= cy; y += 0.5) y === 8 ? g.moveTo(vx(y), y) : g.lineTo(vx(y), y); g.stroke();
      for (let y = 12, k = 0; y < cy - 2; y += 5.2, k++) { const dir = (k % 2 ? 1 : -1), ax = vx(y); at(g, ax, y, dir * 1.0, () => { g.fillStyle = k % 3 ? '#6aa84a' : '#8cc860'; g.beginPath(); g.ellipse(0, 3, 1.5, 3.4, 0, 0, TAU); g.fill(); }); }
    }
    g.strokeStyle = '#6a3e1c'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy - 36); g.lineTo(cx, cy); g.stroke(); // the wand, budding at both ends (the turn)
    for (const dir of [-1, 1]) at(g, cx, cy - 32, dir * 0.9, () => { g.fillStyle = '#6aa84a'; g.beginPath(); g.ellipse(0, -3, 1.6, 4, 0, 0, TAU); g.fill(); });
    at(g, cx, cy - 38, 0, () => { g.fillStyle = '#ffd36a'; path(g, star(0, 0, 2.6, 1, 6)); g.fill(); });
  }));
  border(g, W, H, C, '#a8481c');
  g.fillStyle = '#12060a'; path(g, [[cx, cy - 21], [cx + 13, cy], [cx, cy + 21], [cx - 13, cy]]); g.fill(); g.strokeStyle = C; g.lineWidth = 0.8; g.stroke();
  sym(g, W, H, () => { g.fillStyle = '#ff9a3a'; path(g, star(cx, cy - 7, 9, 3.5, 8)); g.fill(); });
  disc(g, cx, cy, 7.2, grad(g, cx, cy, 0, 7.2, '#fff0a0', '#e0501a')); ringAt(g, cx, cy, 7.2, 0.7, '#ffd36a');
}
function cups(g, W, H) {
  const C = SUIT.cups, cx = W / 2, cy = H / 2;
  frame(g, W, H, '#0e4a66', '#14506c', '#06182a');
  inner(g, W, H, () => half(g, W, H, () => {
    for (let k = 0; k < 7; k++) for (const [a, w] of [[0.5, 0.5], [1.2, 0.3]]) { g.strokeStyle = C; g.globalAlpha = 0.17 + 0.05 * ((k + a * 4) % 3); g.lineWidth = w; g.beginPath(); for (let x = 4; x <= W - 4; x += 0.6) { const y = 9 + k * 6.6 + 1.3 * Math.sin(x * 0.55 + k * 1.3 + a * 2); x === 4 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    g.globalAlpha = 1;
    const r = rng(5); for (let i = 0; i < 12; i++) { ringAt(g, 8 + r() * (W - 16), 10 + r() * (cy - 12), 0.5 + r() * 1.1, 0.3, 'rgba(190,240,255,0.55)'); } // (bubbles)
    // a chalice, its foot at the middle and its bowl up
    g.fillStyle = '#d8c070'; g.beginPath(); g.ellipse(cx, cy - 3, 6.5, 1.7, 0, 0, TAU); g.fill();
    g.strokeStyle = '#d8c070'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy - 3); g.lineTo(cx, cy - 13); g.stroke(); disc(g, cx, cy - 8, 2.3, '#e8d488');
    g.beginPath(); g.moveTo(cx - 9, cy - 28); g.bezierCurveTo(cx - 9, cy - 17, cx - 3, cy - 14, cx, cy - 13); g.bezierCurveTo(cx + 3, cy - 14, cx + 9, cy - 17, cx + 9, cy - 28); g.closePath();
    const bowl = g.createLinearGradient(cx - 9, 0, cx + 9, 0); ['#1e6a8c', '#5cc0e8', '#5cc0e8', '#1e6a8c'].forEach((c, i) => bowl.addColorStop(i / 3, c)); g.fillStyle = bowl; g.fill();
    g.strokeStyle = '#d8c070'; g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = '#e8faff'; g.lineWidth = 0.7; g.beginPath(); for (let x = -8.4; x <= 8.4; x += 0.4) { const y = cy - 26 + Math.sin(x * 0.9) * 0.9; x === -8.4 ? g.moveTo(cx + x, y) : g.lineTo(cx + x, y); } g.stroke();
    g.fillStyle = '#bfeaff'; g.beginPath(); g.moveTo(cx, cy - 36); g.quadraticCurveTo(cx + 2.4, cy - 32, cx, cy - 30.5); g.quadraticCurveTo(cx - 2.4, cy - 32, cx, cy - 36); g.fill(); // a drop over it
  }));
  border(g, W, H, '#8fd8f2', C);
  disc(g, cx, cy, 4.6, grad(g, cx, cy, 0, 4.6, '#e8faff', '#2a88b0')); ringAt(g, cx, cy, 4.6, 0.7, '#d8c070');
}
function swords(g, W, H) {
  const C = SUIT.swords, cx = W / 2, cy = H / 2;
  frame(g, W, H, '#8fa0c8', '#303a5a', '#0e1228');
  inner(g, W, H, () => half(g, W, H, () => {
    const cloud = (x, y, s, a) => { g.fillStyle = `rgba(207,216,255,${a})`; g.strokeStyle = 'rgba(230,236,255,0.35)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x - 4 * s, y + 2 * s); g.arc(x - 3 * s, y, 2 * s, Math.PI * 0.6, Math.PI * 1.4); g.arc(x - 0.5 * s, y - 1.6 * s, 3 * s, Math.PI * 1.1, Math.PI * 1.85); g.arc(x + 3 * s, y, 2.4 * s, Math.PI * 1.35, Math.PI * 0.45); g.closePath(); g.fill(); g.stroke(); };
    cloud(16, 14, 1.5, 0.14); cloud(46, 24, 1.2, 0.12); cloud(20, 38, 1.1, 0.09); cloud(50, 9, 0.9, 0.1);
    g.strokeStyle = 'rgba(207,216,255,0.28)'; g.lineWidth = 0.4; [[10, 30], [52, 40], [32, 8]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 5, y - 2, x + 9, y + 2, x + 12, y); g.bezierCurveTo(x + 14, y - 2, x + 11, y - 4, x + 9, y - 2); g.stroke(); });
    for (const dir of [-1, 1]) at(g, cx, cy, dir * 0.43, () => { // a blade from the pommel up, its crossguard, its fuller
      const bl = g.createLinearGradient(-2, 0, 2, 0); bl.addColorStop(0, '#8e9cc4'); bl.addColorStop(0.5, '#f4f7ff'); bl.addColorStop(1, '#8e9cc4');
      g.fillStyle = bl; path(g, [[-2.1, -9], [2.1, -9], [0.5, -41], [0, -43], [-0.5, -41]]); g.fill(); g.strokeStyle = '#4a5478'; g.lineWidth = 0.3; g.stroke();
      g.strokeStyle = '#6a7498'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, -11); g.lineTo(0, -34); g.stroke();
      g.fillStyle = '#b8c4e8'; g.fillRect(-4.6, -9.8, 9.2, 1.7); g.fillStyle = '#6a7498'; g.fillRect(-1, -8.1, 2, 6);
    });
  }));
  border(g, W, H, '#cfd8ff', '#6a7aa8');
  disc(g, cx, cy, 4.4, grad(g, cx, cy, 0, 4.4, '#ffffff', '#8e9cc4')); ringAt(g, cx, cy, 4.4, 0.6, '#4a5478');
}
function pentacles(g, W, H) {
  const C = SUIT.pentacles, cx = W / 2, cy = H / 2;
  frame(g, W, H, '#a87a22', '#4e3c14', '#1a1407');
  inner(g, W, H, () => {
    for (let j = -5; j <= 5; j++) for (let i = -3; i <= 3; i++) { // coins on a grid about the middle (a round coin turns onto itself)
      const x = cx + i * 11.5, y = cy + j * 9; if (Math.hypot(x - cx, (y - cy) * 0.8) < 21 || x < 12 || x > W - 12 || y < 8 || y > H - 8) continue;
      ringAt(g, x, y, 3.6, 0.5, 'rgba(224,176,64,0.5)'); g.strokeStyle = 'rgba(224,176,64,0.4)'; g.lineWidth = 0.35; g.strokeRect(x - 1, y - 1, 2, 2);
    }
    half(g, W, H, () => { // a wheat ear each side, tip up, the turn tip down
      for (const side of [0, 1]) {
        const x = side ? W - 8.5 : 8.5; g.strokeStyle = '#b8902c'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, 12); g.lineTo(x, cy - 3); g.stroke();
        for (let k = 0; k < 7; k++) for (const s of [-1, 1]) at(g, x, 12 + k * 4.4 + 2, s * 0.6, () => { g.fillStyle = k % 2 ? '#e0b040' : '#f0c858'; g.beginPath(); g.ellipse(0, -1.2, 0.95, 2.2, 0, 0, TAU); g.fill(); });
        g.strokeStyle = '#e0b040'; g.lineWidth = 0.35; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x + s * 1.6, 5.5); g.stroke(); }
      }
    });
  });
  border(g, W, H, C, '#8a6420');
  disc(g, cx, cy, 20.2, '#1a1407'); // the wreath: grains all turning the one way (sixteen: the half-turn is itself)
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; at(g, cx + Math.cos(a) * 18.4, cy + Math.sin(a) * 18.4, a, () => { g.fillStyle = i % 2 ? '#e0b040' : '#f0c858'; g.beginPath(); g.ellipse(0, 0, 3.1, 1.25, 0, 0, TAU); g.fill(); }); }
  disc(g, cx, cy, 15.2, grad(g, cx, cy, 0, 15.2, '#f6dc80', '#b88a24')); ringAt(g, cx, cy, 15.2, 0.9, '#7a5a14'); ringAt(g, cx, cy, 12.6, 0.4, '#7a5a14');
  g.fillStyle = '#7a5a14'; path(g, star(cx, cy, 11.6, 4.6, 10)); g.fill(); g.fillStyle = '#e8c458'; path(g, star(cx, cy, 10.2, 4.4, 10)); g.fill(); // (a ten-point star: a pentagram and its turn)
  disc(g, cx, cy, 2, '#7a5a14');
}

// ------------------------------------------------------------------ the islands' dresses
function clay(g, W, H) {
  const cx = W / 2, cy = H / 2;
  frame(g, W, H, '#4a2214', '#a25a34', '#52281a');
  inner(g, W, H, () => {
    half(g, W, H, () => { const r = rng(21); for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,18,10,0.5)' : 'rgba(240,210,160,0.35)'; g.fillRect(4 + r() * (W - 8), 4 + r() * (cy - 4), 0.5 + r() * 0.7, 0.5 + r() * 0.7); } });
    g.save(); g.translate(cx, cy); g.rotate(-0.95); // the hidasuki: three straw-fire bands (scarlet, the scorch fading to ash at their edges)
    for (const d of [-21, 0, 21]) { g.fillStyle = 'rgba(200,68,42,0.3)'; g.fillRect(-90, d - 3.4, 180, 6.8); g.fillStyle = 'rgba(200,68,42,0.62)'; g.fillRect(-90, d - 1.7, 180, 3.4); g.fillStyle = 'rgba(60,24,16,0.35)'; g.fillRect(-90, d - 0.4, 180, 0.8); }
    g.restore();
    half(g, W, H, () => { // the glaze run down from the rim in drips, and a gold-mended crack
      const r = rng(7); for (let x = 7; x < W - 6; x += 3 + r() * 5) { const w = 2 + r() * 2.4, l = 5 + r() * 14; g.fillStyle = '#d8c288'; g.beginPath(); g.rect(x, 3, w, l); g.arc(x + w / 2, 3 + l, w / 2, 0, Math.PI); g.fill(); g.fillStyle = 'rgba(255,248,220,0.45)'; g.fillRect(x + 0.3, 3, 0.5, l); }
      g.strokeStyle = '#e8c35a'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(4, 36); g.lineTo(11, 40); g.lineTo(14, 36); g.lineTo(22, 41); g.stroke();
    });
  });
  border(g, W, H, '#e8c35a', '#c8442a');
  disc(g, cx, cy, 15.2, '#2a1410'); disc(g, cx, cy, 14, grad(g, cx, cy, 0, 14, '#b8542c', '#7a3218')); ringAt(g, cx, cy, 12.6, 0.6, '#e8c35a'); // the kiln's fire mark: the potter's chop with a flame each way
  sym(g, W, H, () => {
    g.fillStyle = '#f0b04a'; g.beginPath(); g.moveTo(cx, cy - 11); g.bezierCurveTo(cx + 2, cy - 7, cx + 6.5, cy - 4.5, cx + 4.6, cy); g.bezierCurveTo(cx + 3.4, cy + 2, cx - 3.4, cy + 2, cx - 4.6, cy); g.bezierCurveTo(cx - 6, cy - 4.5, cx - 1.6, cy - 7, cx, cy - 11); g.fill();
    g.fillStyle = '#c8442a'; g.beginPath(); g.moveTo(cx, cy - 6.5); g.bezierCurveTo(cx + 1.2, cy - 4, cx + 3, cy - 2.4, cx + 2, cy); g.bezierCurveTo(cx + 1, cy + 1, cx - 1, cy + 1, cx - 2, cy); g.bezierCurveTo(cx - 3, cy - 2.4, cx - 1, cy - 4, cx, cy - 6.5); g.fill();
  });
}
function nacre(g, W, H) {
  const cx = W / 2, cy = H / 2, BR = '#c79a44';
  frame(g, W, H, '#d6c298', '#fbf4ea', '#cdbfdc');
  inner(g, W, H, () => {
    for (let j = -16; j <= 16; j++) for (let i = -8; i <= 8; i++) { const x = cx + (i + (j & 1 ? 0.5 : 0)) * 6, y = cy + j * 3.2; if (x < 0 || x > W) continue; // seigaiha: full circles, in rows, tinted by parity
      g.fillStyle = ((Math.abs(2 * i + (j & 1)) + Math.abs(j)) >> 1) & 1 ? 'rgba(170,205,235,0.2)' : 'rgba(240,184,208,0.2)'; g.beginPath(); g.arc(x, y, 3.3, 0, TAU); g.fill(); ringAt(g, x, y, 3.3, 0.3, 'rgba(120,98,150,0.3)'); }
  });
  border(g, W, H, BR, '#a8782a');
  half(g, W, H, () => { // strands of pearls inside the border, brass at the corners, the King's hallmark (a diamond in a ring) at the head
    const pearl = (x, y) => disc(g, x, y, 1.15, grad(g, x, y, 0, 1.2, '#ffffff', '#c8c0d0'));
    for (let x = 13; x <= W - 13; x += 3.2) pearl(x, 7.3); for (let y = 12; y <= cy; y += 3.2) { pearl(7.3, y); pearl(W - 7.3, y); }
    for (const x of [7.3, W - 7.3]) { disc(g, x, 7.3, 2.5, BR); g.fillStyle = '#fff6e0'; path(g, [[x, 5.4], [x + 1.4, 7.3], [x, 9.2], [x - 1.4, 7.3]]); g.fill(); }
    ringAt(g, cx, 15, 3.4, 0.6, BR); g.fillStyle = BR; path(g, [[cx, 12.6], [cx + 2, 15], [cx, 17.4], [cx - 2, 15]]); g.fill();
    at(g, cx, cy - 3, 0, () => { // a scallop shell, hinge to the middle, its fan up
      const sh = g.createLinearGradient(-14, 0, 14, 0); sh.addColorStop(0, '#e6c070'); sh.addColorStop(0.5, '#fff0c8'); sh.addColorStop(1, '#e6c070');
      g.beginPath(); g.moveTo(0, 0); for (let k = 0; k <= 9; k++) { const a0 = Math.PI * 1.1 + (k / 9) * Math.PI * 0.8, a1 = Math.PI * 1.1 + ((k + 0.5) / 9) * Math.PI * 0.8; g.lineTo(Math.cos(a0) * 15, Math.sin(a0) * 15 * 1.3); g.lineTo(Math.cos(a1) * 17, Math.sin(a1) * 17 * 1.3); } g.closePath(); g.fillStyle = sh; g.fill();
      g.strokeStyle = '#a8782a'; g.lineWidth = 0.4; g.stroke(); for (let k = 0; k <= 8; k++) { const a = Math.PI * 1.1 + ((k + 0.5) / 9) * Math.PI * 0.8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16 * 1.3); g.stroke(); }
    });
  });
  disc(g, cx, cy, 6.2, '#a8782a'); disc(g, cx, cy, 5.5, grad(g, cx, cy, 0, 5.5, '#ffffff', '#cdbfdc')); ringAt(g, cx, cy, 5.5, 0.4, '#c8b8d8');
}
function glass(g, W, H) {
  const cx = W / 2, cy = H / 2, s = 8, h = s * Math.sqrt(3) / 2;
  frame(g, W, H, '#b8a6e0', '#34206a', '#0c0820');
  const tint = ['rgba(150,110,230,0.34)', 'rgba(110,170,240,0.26)', 'rgba(220,150,240,0.24)', 'rgba(200,225,255,0.14)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)'];
  const hash = (a, b) => { let x = Math.imul(a * 73856093 ^ b * 19349663, 2246822519); x ^= x >>> 15; return (x >>> 0) % tint.length; };
  const P = (a, b) => [cx + (a + b / 2) * s, cy + b * h];
  inner(g, W, H, () => {
    for (let b = -14; b <= 14; b++) for (let a = -14; a <= 14; a++) { // the triangular lattice about the middle; a triangle and its half-turn share a tint
      g.fillStyle = tint[hash(a, b)]; path(g, [P(a, b), P(a + 1, b), P(a, b + 1)]); g.fill();
      g.fillStyle = tint[hash(-a - 1, -b - 1)]; path(g, [P(a + 1, b), P(a, b + 1), P(a + 1, b + 1)]); g.fill();
    }
    g.strokeStyle = 'rgba(200,215,255,0.38)'; g.lineWidth = 0.3;
    for (let k = -14; k <= 14; k++) { const [x0, y0] = P(-30, k), [x1, y1] = P(30, k); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const [a0, b0] = P(k, -30), [a1, b1] = P(k, 30); g.beginPath(); g.moveTo(a0, b0); g.lineTo(a1, b1); g.stroke(); const [c0, d0] = P(k + 30, -30), [c1, d1] = P(k - 30, 30); g.beginPath(); g.moveTo(c0, d0); g.lineTo(c1, d1); g.stroke(); }
  });
  border(g, W, H, '#d8cdf8', '#7a62c0');
  half(g, W, H, () => { for (const [x, y] of [[7, 7], [W - 7, 7]]) { g.fillStyle = '#d8cdf8'; path(g, [[x, y - 3], [x + 3, y], [x, y + 3], [x - 3, y]]); g.fill(); g.fillStyle = '#5a40a8'; path(g, [[x, y - 1.6], [x + 1.6, y], [x, y + 1.6], [x - 1.6, y]]); g.fill(); } });
  const R = 15, cols = ['#9a6af0', '#5ab0f4', '#f0a0f0']; // the prism: a hexagon of six facets, opposite facets alike
  disc(g, cx, cy, R + 2.2, '#0c0820');
  for (let k = 0; k < 6; k++) { const a0 = Math.PI / 6 + (k * Math.PI) / 3, a1 = a0 + Math.PI / 3; const f = g.createLinearGradient(cx, cy, cx + Math.cos(a0 + 0.52) * R, cy + Math.sin(a0 + 0.52) * R); f.addColorStop(0, '#f4f0ff'); f.addColorStop(1, cols[k % 3]); g.fillStyle = f; path(g, [[cx, cy], [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R]]); g.fill(); }
  g.strokeStyle = '#e8e2ff'; g.lineWidth = 0.6; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
  g.lineWidth = 0.9; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; k ? g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R) : g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } g.closePath(); g.stroke();
}
function brine(g, W, H) {
  const cx = W / 2, cy = H / 2, TAN = '#c9ae7a', DARK = '#4a3a20';
  frame(g, W, H, '#6d5a3a', '#1a2e36', '#060c10');
  inner(g, W, H, () => {
    g.strokeStyle = 'rgba(201,174,122,0.14)'; g.lineWidth = 0.4; // a net: a diamond mesh about the middle
    for (let k = -14; k <= 14; k++) for (const d of [-1, 1]) { g.beginPath(); g.moveTo(cx + k * 9 - d * 60, cy - 60); g.lineTo(cx + k * 9 + d * 60, cy + 60); g.stroke(); }
    half(g, W, H, () => { const r = rng(33); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(240,246,240,${0.18 + r() * 0.5})`; const x = 4 + r() * (W - 8), y = 4 + r() * (cy - 4), z = 0.3 + r() * 0.5; g.fillRect(x, y, z, z); } // salt
      for (let i = 0; i < 9; i++) { const a = 0.3 + r() * 2.5, rr = 17 + r() * 13; disc(g, cx + Math.cos(a) * rr * 1.1, cy - Math.abs(Math.sin(a)) * rr * 1.3 - 4, 0.5 + r() * 0.6, 'rgba(111,224,232,0.6)'); } }); // Lachryma spray
  });
  half(g, W, H, () => { // the rope round the card: a dark lay and the strands' slanted bright
    const run = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L; g.strokeStyle = DARK; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = TAN; g.lineWidth = 1.2; for (let d = 0; d < L - 1; d += 2) { g.beginPath(); g.moveTo(x0 + ux * d - uy * 1.1, y0 + uy * d + ux * 1.1); g.lineTo(x0 + ux * (d + 1.6) + uy * 1.1, y0 + uy * (d + 1.6) - ux * 1.1); g.stroke(); } };
    run(6.5, 6.5, W - 6.5, 6.5); run(6.5, 6.5, 6.5, cy); run(W - 6.5, 6.5, W - 6.5, cy);
  });
  g.strokeStyle = 'rgba(201,174,122,0.5)'; g.lineWidth = 0.4; g.strokeRect(10, 10, W - 20, H - 20);
  disc(g, cx, cy, 19.2, '#0a1418'); ringAt(g, cx, cy, 18, 2.6, DARK); // the knot in a rope ring
  g.save(); g.setLineDash([1.5, 0.856]); ringAt(g, cx, cy, 18, 1.2, TAN); g.restore(); // (48 dashes: the ring's half-turn lays them on themselves)
  const knot = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); for (let i = 0; i <= 360; i++) { const t = (i / 360) * TAU, x = cx + 3 * 3.1 * Math.cos(t) + 4.9 * Math.cos(3 * t), y = cy + 3 * 3.1 * Math.sin(t) - 4.9 * Math.sin(3 * t); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
  knot(3, DARK); knot(2, TAN);
  disc(g, cx, cy, 1.8, '#6fe0e8');
}

// ------------------------------------------------------------------ the seasons'
function blossom(g, x, y, s, rot, a = '#f7b6cb', b = '#d9708f') {
  at(g, x, y, rot, () => {
    for (let k = 0; k < 5; k++) at(g, 0, 0, (k * TAU) / 5, () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-0.55 * s, -0.3 * s, -0.62 * s, -0.95 * s, -0.16 * s, -1.0 * s); g.lineTo(0, -0.86 * s); g.lineTo(0.16 * s, -1.0 * s); g.bezierCurveTo(0.62 * s, -0.95 * s, 0.55 * s, -0.3 * s, 0, 0); g.fillStyle = a; g.fill(); g.strokeStyle = b; g.lineWidth = 0.25; g.stroke(); });
    disc(g, 0, 0, 0.16 * s, '#e8c35a');
  });
}
function spring(g, W, H) {
  const cx = W / 2, cy = H / 2;
  frame(g, W, H, '#d98aa8', '#4a7a58', '#1a3426');
  inner(g, W, H, () => half(g, W, H, () => {
    const r = rng(41); for (let i = 0; i < 26; i++) at(g, 6 + r() * (W - 12), 6 + r() * (cy - 4), r() * TAU, () => { g.fillStyle = `rgba(247,182,203,${0.3 + r() * 0.45})`; g.beginPath(); g.ellipse(0, 0, 0.7 + r() * 0.8, 1.2 + r() * 1.2, 0, 0, TAU); g.fill(); }); // petals falling
    for (const side of [0, 1]) { // a bough from each side, in bloom
      const sx = side ? W - 4 : 4, d = side ? -1 : 1; g.strokeStyle = '#3a2418'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx, 34); g.bezierCurveTo(sx + d * 8, 28, sx + d * 6, 18, sx + d * 14, 10); g.stroke();
      g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx + d * 6, 27); g.lineTo(sx + d * 14, 30); g.stroke();
      [[sx + d * 14, 10, 3.6, 0.3], [sx + d * 14, 30, 3, 1], [sx + d * 7, 21, 3.2, 2], [sx + d * 9, 33, 2.6, 0.6]].forEach(([x, y, z, q]) => blossom(g, x, y, z, q));
    }
  }));
  border(g, W, H, '#f7b6cb', '#7aa86a');
  sym(g, W, H, () => blossom(g, cx, cy - 7, 13, 0.1, '#fbc8d8')); // two blossoms, one the other's turn: a double flower
  disc(g, cx, cy, 2, '#e8c35a');
}
function summer(g, W, H) {
  const cx = W / 2, cy = H / 2;
  frame(g, W, H, '#f2b82e', '#3a86d8', '#10306e');
  inner(g, W, H, () => half(g, W, H, () => {
    const r = rng(51); for (let i = 0; i < 34; i++) { g.fillStyle = `rgba(255,244,200,${0.18 + r() * 0.4})`; g.fillRect(6 + r() * (W - 20), 6 + r() * (cy - 4), 1.5 + r() * 3.5, 0.45); } // sun glints on water
    for (let i = 0; i < 17; i++) { const x = 10 + i * 2.7; disc(g, x, 7.6, 0.75, '#f2b82e'); } // a row of seeds
  }));
  border(g, W, H, '#f6d060', '#f2b82e');
  for (let i = 0; i < 16; i++) at(g, cx, cy, (i * TAU) / 16, () => { // sixteen rays: straight gold and wavy orange in turn
    if (i % 2 === 0) { g.fillStyle = '#f6c83a'; path(g, [[-2.3, -11], [0, -23.5], [2.3, -11]]); g.fill(); }
    else { g.strokeStyle = '#f08a2a'; g.lineWidth = 1.3; g.beginPath(); for (let d = 11; d <= 20; d += 0.5) { const x = Math.sin(d * 1.1) * 1.4; d === 11 ? g.moveTo(x, -d) : g.lineTo(x, -d); } g.stroke(); }
  });
  disc(g, cx, cy, 11.4, '#f08a2a'); disc(g, cx, cy, 10.4, grad(g, cx, cy, 0, 10.4, '#fff6b0', '#f4b92e')); ringAt(g, cx, cy, 7, 0.4, 'rgba(180,100,20,0.5)');
}
function mapleLeaf(g, x, y, s, rot, col) {
  at(g, x, y, rot, () => {
    const pts = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * TAU) / 5; pts.push([Math.cos(a) * s * (k ? 0.92 : 1), Math.sin(a) * s * (k ? 0.92 : 1)]); const b = a + TAU / 10; pts.push([Math.cos(b) * s * 0.42, Math.sin(b) * s * 0.42 + s * 0.06]); }
    path(g, pts); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,12,6,0.6)'; g.lineWidth = 0.3; g.stroke();
    g.lineWidth = 0.3; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(0, s * 0.1); g.lineTo(pts[k * 2][0] * 0.8, pts[k * 2][1] * 0.8); g.stroke(); }
    g.strokeStyle = 'rgba(40,12,6,0.7)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(0, s * 0.1); g.lineTo(0, s * 1.35); g.stroke();
  });
}
function autumn(g, W, H) {
  const cx = W / 2, cy = H / 2, COLS = ['#c8501e', '#e09a2a', '#9a2a2a', '#d4741e'];
  frame(g, W, H, '#7a3a14', '#6a2a1a', '#241008');
  inner(g, W, H, () => half(g, W, H, () => {
    const r = rng(61); for (let i = 0; i < 12; i++) mapleLeaf(g, 9 + r() * (W - 18), 9 + r() * (cy - 18), 2.4 + r() * 2.6, r() * TAU, COLS[(r() * 4) | 0]);
    g.strokeStyle = 'rgba(217,164,65,0.5)'; g.lineWidth = 0.5; g.beginPath(); for (let x = 9; x <= W - 9; x += 0.5) { const y = 7.5 + Math.sin(x * 0.7) * 0.8; x === 9 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  }));
  border(g, W, H, '#d9a441', '#9a4a1e');
  sym(g, W, H, () => mapleLeaf(g, cx, cy - 12, 14, 0, '#d4601e'));
  disc(g, cx, cy, 2.2, '#e8c35a');
}
function flake(g, x, y, s, rot, c, w) {
  at(g, x, y, rot, () => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round';
    for (let k = 0; k < 6; k++) at(g, 0, 0, (k * Math.PI) / 3, () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s); g.stroke(); for (const [d, l] of [[0.42, 0.34], [0.7, 0.24]]) for (const q of [-1, 1]) { g.beginPath(); g.moveTo(0, -s * d); g.lineTo(q * s * l * 0.87, -s * (d + l * 0.5)); g.stroke(); } }); });
}
function winter(g, W, H) {
  const cx = W / 2, cy = H / 2;
  frame(g, W, H, '#cfe8ff', '#2c4e7c', '#091830');
  inner(g, W, H, () => half(g, W, H, () => {
    const r = rng(71); for (let i = 0; i < 9; i++) flake(g, 8 + r() * (W - 16), 10 + r() * (cy - 22), 2 + r() * 3, r() * 1.0, 'rgba(207,232,255,0.7)', 0.4);
    for (let i = 0; i < 40; i++) disc(g, 5 + r() * (W - 10), 5 + r() * (cy - 5), 0.25 + r() * 0.4, 'rgba(235,245,255,0.7)');
    g.strokeStyle = 'rgba(220,240,255,0.55)'; g.lineWidth = 0.4; // hoarfrost creeping in from the edges: ferns of short spikes
    for (const [x0, y0, a] of [[4, 6, 0.9], [W - 4, 6, Math.PI - 0.9], [4, 30, 0.2], [W - 4, 34, Math.PI - 0.2], [30, 4, Math.PI / 2 - 0.4]]) { const L = 14; at(g, x0, y0, a, () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke(); for (let d = 2; d < L; d += 2) for (const q of [-1, 1]) { g.beginPath(); g.moveTo(d, 0); g.lineTo(d + 1.8, q * (3 - d / L * 2)); g.stroke(); } }); }
  }));
  border(g, W, H, '#cfe8ff', '#5a8ac0');
  disc(g, cx, cy, 20, 'rgba(8,20,44,0.78)'); ringAt(g, cx, cy, 20, 0.6, '#9ac4f0');
  flake(g, cx, cy, 17, 0, '#e8f4ff', 1.1); disc(g, cx, cy, 2.6, '#e8f4ff'); ringAt(g, cx, cy, 6, 0.4, '#9ac4f0');
}

// ------------------------------------------------------------------ the set and the choice
export const BACK_SET = [
  { id: 'wands', label: 'Wands', group: 'suit', line: 'Ember and vine in the Wands\' orange.', draw: wands },
  { id: 'cups', label: 'Cups', group: 'suit', line: 'Waves and a double chalice in the Cups\' blue.', draw: cups },
  { id: 'swords', label: 'Swords', group: 'suit', line: 'Four blades from one pommel, under clouds.', draw: swords },
  { id: 'pentacles', label: 'Pentacles', group: 'suit', line: 'A coin lattice and a wheat wreath in gold.', draw: pentacles },
  { id: 'clay', label: 'Clay', group: 'island', line: 'Anagami: glazed earth, scarlet fire bands, a kiln\'s flame.', draw: clay },
  { id: 'nacre', label: 'Nacre', group: 'island', line: 'Margarite: pearl, lamp brass and scallop shells.', draw: nacre },
  { id: 'glass', label: 'Glass', group: 'island', line: 'Entropolis: an etched prism lattice in amethyst.', draw: glass },
  { id: 'brine', label: 'Brine', group: 'island', line: 'The Emocean: tarred ground, rope and salt.', draw: brine },
  { id: 'spring', label: 'Spring', group: 'season', line: 'Blossom boughs and falling petals.', draw: spring },
  { id: 'summer', label: 'Summer', group: 'season', line: 'A sixteen-ray sun over glinting water.', draw: summer },
  { id: 'autumn', label: 'Autumn', group: 'season', line: 'Maple leaves in rust, amber and crimson.', draw: autumn },
  { id: 'winter', label: 'Winter', group: 'season', line: 'A snowflake in frost on deep blue.', draw: winter },
];
/** The two decks and the back each has of its own (`house`: the lapis chip, atlas card 78; `arcana`: the plum eye, 80). */
export const BACK_DECKS = ['house', 'arcana'];
export const BACK_DEFAULT = { house: 'house', arcana: 'arcana' };
const OWN_CELL = { house: 78, arcana: 80 };
/** The atlas card index of the first set back (81; the set's k-th is 81 + k, in the atlas's foot after the Arcana's own at 80). */
export const BACK_FIRST = 81;

/** The atlas card index of a back by id (`house`, `arcana` or one of the set); null for an id that is none. */
export function backCellOf(id) {
  if (OWN_CELL[id] != null) return OWN_CELL[id];
  const k = BACK_SET.findIndex((b) => b.id === id); return k < 0 ? null : BACK_FIRST + k;
}
/** One set back drawn in the frame `W` x `H` (64 x 104 for the atlas's cell, the card's own aspect elsewhere). */
export function drawBackSet(g, id, W = 64, H = 104) { const b = BACK_SET.find((x) => x.id === id); if (b) { g.save(); b.draw(g, W, H); g.restore(); } }

const CHOSEN = { ...BACK_DEFAULT }, HEARERS = new Set();
/** The back a deck wears now (an id). */
export const chosenBack = (deck) => CHOSEN[deck] || BACK_DEFAULT[deck];
/** The atlas card index a deck's back is now. */
export const backCell = (deck) => backCellOf(chosenBack(deck)) ?? OWN_CELL[deck];
/** A deck wears the back `id` (`house`/`arcana` the deck's own, or one of the set); true if it changed. */
export function chooseBack(deck, id) {
  if (!BACK_DECKS.includes(deck) || backCellOf(id) == null || CHOSEN[deck] === id) return false;
  CHOSEN[deck] = id; for (const fn of HEARERS) fn(deck, id); return true;
}
/** `fn(deck, id)` is told each change; returns the way to stop hearing. */
export function onBackChange(fn) { HEARERS.add(fn); return () => HEARERS.delete(fn); }
