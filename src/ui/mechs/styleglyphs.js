// ---------------------------------------------------------------------------------------
// THE MECH'S STYLE WINDOW'S GLYPHS (plain name): the small picture on each option of the style window (ui/mechs/stylewindow.js), drawn
// once on a canvas in the icons' hand (ui/icons/: a light shape keylined dark, bevelled from the top left, the gold its accent): what
// the option puts on the mech, read at 40 px. A silhouette a slot (a frame, a torso, a shoulder, a hip's belt, a helm's bowl, a back,
// a cradle's well, a blade) with what the option changes drawn on it in gold. A helm of the Major Arcana carries its card's number.
// Looks only. Drawn at 2x (`S`), cached by slot and id.
//
// Prior art: the house's UI icons (ui/icons/icons.js, its keyline and bevel), Armored Core's part silhouettes on its garage list,
// Monster Hunter's equipment icons (one silhouette a slot, its tier's colour).
//
//   styleGlyph({ slot, id, card? }) -> HTMLCanvasElement (80 x 80, shown at 40)
// ---------------------------------------------------------------------------------------
const S = 2, N = 40; // (the scale, the logical side)
const INK = '#1c0d08', BIS = '#efdcc0', BIS2 = '#c9a882', GOLD = '#ffd36a', VOID = '#3a2018';
const cache = new Map();

/** A path filled light and keylined dark, a bevel's light along its top left. */
function shape(c, draw, { fill = BIS, line = INK, w = 1.6, glint = true } = {}) {
  c.save(); c.beginPath(); draw(c); c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = w * 2; c.strokeStyle = line; c.stroke();
  const g = c.createLinearGradient(0, 0, N, N); g.addColorStop(0, glint ? '#fff4e0' : fill); g.addColorStop(0.35, fill); g.addColorStop(1, fill === BIS ? BIS2 : fill);
  c.fillStyle = g; c.fill(); c.restore();
}
/** A gold line (or dots) over a shape, keylined. */
function gold(c, draw, w = 1.2, fill = false) {
  c.save(); c.beginPath(); draw(c); c.lineCap = 'round'; c.lineJoin = 'round';
  if (fill) { c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); c.fillStyle = GOLD; c.fill(); }
  else { c.lineWidth = w + 1.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = GOLD; c.stroke(); }
  c.restore();
}
const ell = (c, x, y, rx, ry, r = 0) => { c.moveTo(x + rx * Math.cos(r), y + ry * Math.sin(r)); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); };
const poly = (c, pts, close = true) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (close) c.closePath(); };
const dot = (c, x, y, r = 1.2) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); };

// ------------------------------------------------------------------ the frame
function frame(c, id, fig = null) {
  const doll = id === 'doll' || fig;
  const F = { a: [9, 15, 13], b: [8, 12, 15], c: [8, 16, 14], d: [9, 14, 14] }[fig || 'd'], [sh, hip, hipY] = doll ? [F[0], F[1], 20 + F[2] * 0.4] : [15, 8, 24];
  shape(c, (c) => poly(c, [[20 - sh, 12], [20 + sh, 12], [20 + sh * 0.7, 18], [20 + 4, 21], [20 + hip, hipY], [20 + hip * 0.55, 30], [20 + 3, 37], [20 + 0.8, 37], [20, 29], [20 - 0.8, 37], [20 - 3, 37], [20 - hip * 0.55, 30], [20 - hip, hipY], [20 - 4, 21], [20 - sh * 0.7, 18]]));
  if (doll) { shape(c, (c) => ell(c, 20, 6, 4.2, 3.4)); gold(c, (c) => { c.moveTo(16, 9); c.lineTo(24, 9); }); if (fig) gold(c, (c) => { ell(c, 17, 15, 2.2, 2); ell(c, 23, 15, 2.2, 2); }, 1); }
  else { shape(c, (c) => poly(c, [[17, 4], [23, 4], [24, 10], [16, 10]])); gold(c, (c) => { ell(c, 20 - sh, 13, 2.6, 2.6); ell(c, 20 + sh, 13, 2.6, 2.6); }, 1.2, true); }
  gold(c, (c) => { c.moveTo(20, 13); c.lineTo(20, 20); }, 0.9);
}
// ------------------------------------------------------------------ a torso and the harness's lines on it
function torso(c) { shape(c, (c) => poly(c, [[12, 4], [28, 4], [30, 10], [25, 18], [33, 26], [30, 36], [24, 37], [20, 32], [16, 37], [10, 36], [7, 26], [15, 18], [10, 10]])); }
const HARN = {
  halter: (c) => { c.moveTo(20, 3); c.lineTo(14, 12); c.moveTo(20, 3); c.lineTo(26, 12); c.moveTo(13, 12); c.quadraticCurveTo(16, 16, 19, 12); c.moveTo(21, 12); c.quadraticCurveTo(24, 16, 27, 12); c.moveTo(16, 24); c.lineTo(18, 34); c.moveTo(24, 24); c.lineTo(22, 34); },
  highcut: (c) => { c.moveTo(9, 22); c.quadraticCurveTo(20, 40, 31, 22); c.moveTo(20, 4); c.lineTo(20, 18); },
  coins: (c) => { c.moveTo(9, 24); c.quadraticCurveTo(20, 32, 31, 24); for (let i = 0; i < 7; i++) dot(c, 11 + i * 3, 26 + Math.sin(i / 6 * Math.PI) * 3.5, 1); },
  cords: (c) => { for (let i = 0; i < 4; i++) { c.moveTo(11 + i * 5, 22); c.lineTo(16 + i * 5, 32); c.moveTo(29 - i * 5, 22); c.lineTo(24 - i * 5, 32); } },
  nouveau: (c) => { c.moveTo(10, 22); c.bezierCurveTo(18, 22, 12, 32, 18, 31); c.arc(18, 29, 2, Math.PI / 2, -Math.PI); c.moveTo(30, 22); c.bezierCurveTo(22, 22, 28, 32, 22, 31); c.arc(22, 29, 2, Math.PI / 2, 0, true); },
  garters: (c) => { c.moveTo(9, 22); c.lineTo(31, 30); c.moveTo(11, 34); c.lineTo(17, 35); c.moveTo(23, 35); c.lineTo(29, 34); },
  bows: (c) => { c.moveTo(9, 24); c.quadraticCurveTo(20, 36, 31, 24); poly(c, [[7, 22], [11, 25], [7, 28]]); poly(c, [[33, 22], [29, 25], [33, 28]]); },
  corset: (c) => { for (let i = 0; i < 4; i++) { const y = 14 + i * 3.5; c.moveTo(17, y); c.lineTo(23, y + 3.5); c.moveTo(23, y); c.lineTo(17, y + 3.5); } c.moveTo(12, 26); c.lineTo(20, 31); c.lineTo(28, 26); },
  sling: (c) => { c.moveTo(13, 4); c.lineTo(19, 33); c.moveTo(27, 4); c.lineTo(21, 33); },
  rope: (c) => { c.moveTo(20, 4); c.lineTo(20, 30); poly(c, [[20, 12], [26, 18], [20, 24], [14, 18]]); dot(c, 20, 12, 1.4); dot(c, 20, 24, 1.4); },
  mucha: (c) => { c.moveTo(8, 21); c.bezierCurveTo(16, 30, 26, 18, 32, 30); c.moveTo(9, 24); c.bezierCurveTo(17, 32, 26, 21, 31, 33); },
  crisscross: (c) => { c.moveTo(13, 14); c.lineTo(27, 26); c.moveTo(27, 14); c.lineTo(13, 26); c.moveTo(15, 26); c.lineTo(19, 34); c.moveTo(25, 26); c.lineTo(21, 34); },
  swag: (c) => { c.moveTo(9, 22); c.lineTo(31, 22); for (const [a, b] of [[9, 20], [20, 31]]) for (let k = 0; k < 6; k++) { const t = k / 5, x = a + (b - a) * t; dot(c, x, 23 + Math.sin(t * Math.PI) * 5, 0.9); } },
  obi: (c) => { c.moveTo(10, 16); c.lineTo(30, 16); c.moveTo(9, 22); c.lineTo(31, 22); c.moveTo(10, 19); c.lineTo(30, 19); },
};
// ------------------------------------------------------------------ the shoulder and its pauldron
function shoulder(c, id) {
  shape(c, (c) => poly(c, [[4, 36], [4, 24], [14, 18], [22, 22], [24, 36]]), { fill: BIS2, glint: false }); // (the chest's edge)
  shape(c, (c) => poly(c, [[24, 36], [27, 26], [33, 26], [35, 38]]), { fill: BIS2, glint: false }); // (the upper arm)
  const P = {
    null: () => shape(c, (c) => { c.moveTo(20, 24); c.quadraticCurveTo(30, 12, 38, 24); c.lineTo(36, 28); c.quadraticCurveTo(29, 20, 22, 27); c.closePath(); }),
    osode: () => { for (let i = 0; i < 4; i++) shape(c, (c) => poly(c, [[24, 14 + i * 5], [38, 16 + i * 5], [38, 21 + i * 5], [24, 19 + i * 5]]), { glint: i === 0 }); gold(c, (c) => { for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) dot(c, 27 + k * 4, 18 + i * 5 + k * 0.4, 0.8); }); },
    zaku: () => { shape(c, (c) => { c.moveTo(20, 26); c.arc(29, 26, 9, Math.PI, 0); c.closePath(); }); gold(c, (c) => { poly(c, [[24, 19], [22, 12], [27, 17]]); poly(c, [[29, 17], [29, 9], [32, 17]]); poly(c, [[34, 19], [37, 12], [36, 21]]); }, 1, true); },
    wing: () => { for (let i = 0; i < 4; i++) shape(c, (c) => poly(c, [[24, 26], [36 - i * 3, 4 + i * 4], [38 - i * 2, 7 + i * 4], [28, 27]]), { glint: i === 0 }); gold(c, (c) => { c.moveTo(25, 25); c.lineTo(36, 4); }); },
    spaulder: () => { shape(c, (c) => { c.moveTo(20, 24); c.arc(29, 24, 9, Math.PI, 0); c.closePath(); }); for (let i = 0; i < 2; i++) shape(c, (c) => poly(c, [[21, 26 + i * 4], [38, 26 + i * 4], [37, 30 + i * 4], [22, 30 + i * 4]]), { glint: false }); shape(c, (c) => poly(c, [[20, 22], [21, 12], [24, 18]])); },
    disc: () => { shape(c, (c) => ell(c, 30, 22, 9, 10)); gold(c, (c) => { ell(c, 30, 22, 6, 7); }); gold(c, (c) => dot(c, 30, 22, 2.4), 1, true); },
    horn: () => { shape(c, (c) => { c.moveTo(21, 26); c.arc(29, 26, 8, Math.PI, 0); c.closePath(); }); shape(c, (c) => { c.moveTo(27, 19); c.bezierCurveTo(26, 8, 32, 3, 38, 4); c.bezierCurveTo(34, 7, 31, 12, 32, 20); c.closePath(); }); },
    puff: () => { shape(c, (c) => ell(c, 30, 23, 9, 9)); gold(c, (c) => { for (const k of [-5, 0, 5]) { c.moveTo(30 + k, 14.5); c.quadraticCurveTo(30 + k * 1.5, 23, 30 + k, 31.5); } }, 0.8); gold(c, (c) => { c.moveTo(22, 30); c.lineTo(38, 30); }); },
  };
  (P[id ?? 'null'] || P.null)();
}
// ------------------------------------------------------------------ the hips and the belt's plates
function hips(c, id) {
  shape(c, (c) => poly(c, [[12, 6], [28, 6], [32, 14], [28, 20], [24, 37], [21, 37], [20, 24], [19, 37], [16, 37], [12, 20], [8, 14]]), { fill: BIS2, glint: false });
  gold(c, (c) => { c.moveTo(9, 11); c.lineTo(31, 11); });
  const plate = (pts, gl = true) => shape(c, (c) => poly(c, pts), { glint: gl });
  if (id === 'crinoline') { shape(c, (c) => { c.moveTo(10, 11); c.lineTo(30, 11); c.quadraticCurveTo(36, 26, 38, 33); c.lineTo(25, 33); c.lineTo(20, 20); c.lineTo(15, 33); c.lineTo(2, 33); c.quadraticCurveTo(4, 26, 10, 11); }); gold(c, (c) => { c.moveTo(2, 33); c.lineTo(15, 33); c.moveTo(25, 33); c.lineTo(38, 33); }); }
  else if (id === 'tassets') { plate([[10, 12], [19, 12], [18, 28], [9, 27]]); plate([[21, 12], [30, 12], [31, 27], [22, 28]]); gold(c, (c) => { for (const x of [11, 16, 24, 29]) for (const y of [16, 21]) dot(c, x, y, 0.8); }); }
  else if (id === 'kusazuri') { for (let i = 0; i < 5; i++) plate([[7 + i * 5.4, 12], [12.4 + i * 5.4, 12], [12.8 + i * 5.6, 26], [6.6 + i * 5.6, 26]], i === 0); gold(c, (c) => { for (let i = 0; i < 5; i++) { c.moveTo(7 + i * 5.6, 18); c.lineTo(12.6 + i * 5.6, 18); } }, 0.8); }
  else if (id === 'pteruges') { for (let i = 0; i < 8; i++) plate([[7 + i * 3.3, 12], [9.6 + i * 3.3, 12], [10 + i * 3.4, 25], [7.2 + i * 3.4, 25]], false); gold(c, (c) => { for (let i = 0; i < 8; i++) dot(c, 8.6 + i * 3.4, 24, 0.9); }, 1, true); }
}
// ------------------------------------------------------------------ the helm: an icosahedron's bowl and the ornament that names it
function helm(c, id, card) {
  shape(c, (c) => poly(c, [[9, 26], [11, 17], [20, 12], [29, 17], [31, 26], [27, 30], [13, 30]])); // (the faceted bowl)
  gold(c, (c) => { c.moveTo(9, 26); c.lineTo(31, 26); }, 1.1);
  c.save(); c.fillStyle = VOID; c.beginPath(); poly(c, [[14, 27], [26, 27], [24, 31], [16, 31]]); c.fill(); c.fillStyle = '#ffb35a'; c.beginPath(); dot(c, 20, 29, 0.9); c.fill(); c.restore(); // (the empty dark under the brim, one faint light)
  const O = {
    null: () => {},
    stag: () => gold(c, (c) => { for (const s of [-1, 1]) { c.moveTo(20 + s * 5, 14); c.lineTo(20 + s * 14, 4); c.moveTo(20 + s * 9, 9); c.lineTo(20 + s * 7, 2); c.moveTo(20 + s * 12, 6); c.lineTo(20 + s * 17, 8); } }, 2),
    tyrant: () => { shape(c, (c) => poly(c, [[11, 18], [20, 10], [29, 18], [33, 23], [26, 22]])); gold(c, (c) => { for (let i = 0; i < 5; i++) poly(c, [[14 + i * 3, 30], [15.5 + i * 3, 34], [17 + i * 3, 30]]); }, 1, true); },
    mammoth: () => { shape(c, (c) => { ell(c, 15, 14, 6, 5); ell(c, 25, 14, 6, 5); }); gold(c, (c) => { for (const s of [-1, 1]) { c.moveTo(20 + s * 9, 28); c.bezierCurveTo(20 + s * 15, 36, 20 + s * 19, 30, 20 + s * 16, 22); } }, 2); },
    sabretooth: () => { shape(c, (c) => { poly(c, [[11, 18], [12, 8], [17, 14]]); poly(c, [[29, 18], [28, 8], [23, 14]]); }); gold(c, (c) => { poly(c, [[16, 30], [17.5, 38], [19, 30]]); poly(c, [[21, 30], [22.5, 38], [24, 30]]); }, 1, true); },
    pterosaur: () => { shape(c, (c) => poly(c, [[18, 13], [36, 4], [24, 16]])); shape(c, (c) => { poly(c, [[9, 22], [1, 14], [6, 26]]); poly(c, [[31, 22], [39, 14], [34, 26]]); }, { glint: false }); },
    triceratops: () => { shape(c, (c) => { c.moveTo(6, 24); c.quadraticCurveTo(20, -4, 34, 24); c.lineTo(29, 17); c.quadraticCurveTo(20, 8, 11, 17); c.closePath(); }); gold(c, (c) => { poly(c, [[15, 16], [12, 6], [18, 14]]); poly(c, [[25, 16], [28, 6], [22, 14]]); }, 1, true); },
    kabuto: () => gold(c, (c) => { c.moveTo(8, 6); c.quadraticCurveTo(20, 22, 32, 6); c.quadraticCurveTo(20, 17, 8, 6); }, 1.4, true),
    szyszak: () => { gold(c, (c) => { poly(c, [[19, 12], [20, 4], [21, 12]]); c.moveTo(20, 26); c.lineTo(20, 33); }, 1.4); shape(c, (c) => { c.moveTo(29, 18); c.bezierCurveTo(34, 8, 38, 6, 39, 2); c.bezierCurveTo(36, 10, 34, 16, 31, 21); c.closePath(); }); },
    nagaEboshi: () => shape(c, (c) => poly(c, [[14, 14], [16, 0], [24, 0], [26, 14]])),
    ichiNoTani: () => shape(c, (c) => poly(c, [[20, 13], [8, 3], [12, 1], [20, 9], [28, 1], [32, 3]])),
    namazuO: () => shape(c, (c) => { c.moveTo(16, 14); c.bezierCurveTo(14, 4, 22, 0, 30, 1); c.bezierCurveTo(24, 4, 22, 8, 24, 14); c.closePath(); }),
    shida: () => gold(c, (c) => { c.moveTo(20, 13); c.lineTo(20, 2); for (let i = 0; i < 4; i++) { c.moveTo(20, 4 + i * 2.5); c.lineTo(15, 2 + i * 2.5); c.moveTo(20, 4 + i * 2.5); c.lineTo(25, 2 + i * 2.5); } }, 1.2),
    horned: () => gold(c, (c) => { for (const s of [-1, 1]) { c.moveTo(20 + s * 7, 15); c.bezierCurveTo(20 + s * 16, 4, 20 + s * 18, 18, 20 + s * 13, 18); } }, 2.2),
    negroli: () => { shape(c, (c) => { c.moveTo(12, 15); c.quadraticCurveTo(20, 4, 30, 14); c.quadraticCurveTo(22, 10, 12, 15); }); gold(c, (c) => ell(c, 21, 10, 1.6, 1.6), 1, true); },
    suttonHoo: () => { gold(c, (c) => { c.moveTo(20, 12); c.lineTo(20, 26); c.moveTo(14, 22); c.lineTo(26, 22); }, 1.4); },
    turban: () => shape(c, (c) => { c.moveTo(12, 17); c.quadraticCurveTo(14, 6, 20, 2); c.quadraticCurveTo(26, 6, 28, 17); c.closePath(); }),
  };
  if (card != null) { // (a crown of the Major Arcana: a circlet of points and the card's number on the bowl)
    shape(c, (c) => poly(c, [[10, 17], [12, 9], [15, 14], [20, 6], [25, 14], [28, 9], [30, 17]]), { fill: GOLD });
    const R = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'][card] || '';
    c.save(); c.font = `700 ${R.length > 3 ? 5 : 7}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 2; c.strokeStyle = BIS; c.strokeText(R, 20, 21); c.fillStyle = INK; c.fillText(R, 20, 21); c.restore();
  } else (O[id ?? 'null'] || O.null)();
}
// ------------------------------------------------------------------ the back and its piece
function back(c, id) {
  shape(c, (c) => poly(c, [[10, 14], [30, 14], [27, 30], [13, 30]]), { fill: BIS2, glint: false });
  shape(c, (c) => ell(c, 20, 9, 4, 3.4), { fill: BIS2, glint: false });
  const B = {
    null: () => {},
    renko: () => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; shape(c, (c) => ell(c, 20 + Math.cos(a) * 15, 17 + Math.sin(a) * 13, 3.2, 3.2), { glint: false }); } gold(c, (c) => ell(c, 20, 17, 15, 13), 0.8); },
    kohai: () => { gold(c, (c) => ell(c, 20, 17, 12, 12), 1.4); for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI * 1.0 - 0.1; gold(c, (c) => { const x = 20 + Math.cos(a) * 12, y = 17 + Math.sin(a) * 12; c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 6 + 2, y + Math.sin(a) * 6, x + Math.cos(a + 0.4) * 7, y + Math.sin(a + 0.4) * 7); }, 1.6); } },
    kazebukuro: () => shape(c, (c) => { c.moveTo(6, 18); c.bezierCurveTo(4, 0, 36, 0, 34, 18); c.lineTo(30, 17); c.bezierCurveTo(30, 6, 10, 6, 10, 17); c.closePath(); }),
    tenne: () => gold(c, (c) => { c.moveTo(11, 15); c.bezierCurveTo(8, 0, 32, 0, 29, 15); c.moveTo(11, 15); c.bezierCurveTo(6, 24, 10, 32, 7, 38); c.moveTo(29, 15); c.bezierCurveTo(34, 24, 30, 32, 33, 38); }, 2),
    knight: () => { shape(c, (c) => poly(c, [[11, 14], [29, 14], [36, 38], [4, 38]])); gold(c, (c) => { c.moveTo(11, 14); c.lineTo(29, 14); c.moveTo(4, 38); c.lineTo(36, 38); }, 1.4); },
  };
  (B[id ?? 'null'] || B.null)();
  c.save(); c.beginPath(); ell(c, 20, 21, 3.4, 3.4); c.fillStyle = VOID; c.fill(); c.lineWidth = 1.2; c.strokeStyle = GOLD; c.stroke(); c.restore(); // (the cradle's well)
}
// ------------------------------------------------------------------ the cradle's mount
function cradle(c, id) {
  shape(c, (c) => poly(c, [[4, 6], [36, 6], [32, 36], [8, 36]]), { fill: BIS2, glint: false });
  const M = {
    boss: () => shape(c, (c) => { const p = []; for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; p.push([20 + Math.cos(a) * 11, 21 + Math.sin(a) * 11]); } poly(c, p); }),
    sunk: () => { c.save(); c.beginPath(); ell(c, 20, 21, 13, 11); c.fillStyle = '#7a5a40'; c.fill(); c.restore(); gold(c, (c) => ell(c, 20, 21, 13, 11), 1); },
    kiln: () => { gold(c, (c) => { for (const [x, y] of [[9, 10], [31, 10], [9, 32], [31, 32]]) { c.moveTo(x, y); c.lineTo(20 + (x - 20) * 0.45, 21 + (y - 21) * 0.45); } }, 1.4); shape(c, (c) => ell(c, 20, 21, 8, 8)); },
    yoke: () => { shape(c, (c) => poly(c, [[3, 16], [37, 16], [35, 26], [5, 26]])); gold(c, (c) => { c.moveTo(9, 16); c.lineTo(11, 4); c.moveTo(31, 16); c.lineTo(29, 4); }, 1.6); },
    halo: () => { gold(c, (c) => { for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; c.moveTo(20 + Math.cos(a) * 9, 21 + Math.sin(a) * 9); c.lineTo(20 + Math.cos(a) * 15, 21 + Math.sin(a) * 15); } }, 0.9); gold(c, (c) => ell(c, 20, 21, 9, 9), 1.6); },
  };
  (M[id] || M.boss)();
  c.save(); c.beginPath(); ell(c, 20, 21, 4.4, 4.4); c.fillStyle = VOID; c.fill(); c.lineWidth = 1.4; c.strokeStyle = GOLD; c.stroke(); c.restore();
  gold(c, (c) => { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; c.moveTo(20 + Math.cos(a) * 4.4, 21 + Math.sin(a) * 4.4); c.lineTo(20 + Math.cos(a) * 6.4, 21 + Math.sin(a) * 6.4); } }, 1);
}
// ------------------------------------------------------------------ the blade and its gun
function gunblade(c, id) {
  const curve = id === 'gatling' || id === 'saya' ? 4 : 1.5;
  shape(c, (c) => { c.moveTo(9, 31); c.quadraticCurveTo(22, 18 + curve, 37, 3); c.quadraticCurveTo(25, 22 - curve, 12, 34); c.closePath(); }); // (the blade, its edge down)
  shape(c, (c) => poly(c, [[3, 37], [7, 33], [9, 35], [5, 39]]), { fill: '#6b4a36', glint: false }); // (the grip)
  const G = {
    gunblade: () => { shape(c, (c) => ell(c, 11, 27, 4, 3.2)); gold(c, (c) => { c.moveTo(13, 26); c.quadraticCurveTo(24, 15, 33, 4); }, 1.2); },
    pepperbox: () => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; gold(c, (c) => dot(c, 11 + Math.cos(a) * 4.2, 30 + Math.sin(a) * 4.2, 1.4), 1, true); } },
    bayonet: () => gold(c, (c) => { c.moveTo(9, 28); c.lineTo(31, 6); c.moveTo(14, 33); c.lineTo(35, 11); }, 1.4),
    wheellock: () => { shape(c, (c) => ell(c, 12, 29, 4.4, 4.4)); gold(c, (c) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.moveTo(12, 29); c.lineTo(12 + Math.cos(a) * 4, 29 + Math.sin(a) * 4); } }, 0.6); gold(c, (c) => poly(c, [[30, 5], [36, 2], [34, 9]]), 1, true); },
    gatling: () => { gold(c, (c) => { for (const k of [0, 2, 4]) { c.moveTo(12 + k, 24 - k * 0.4); c.quadraticCurveTo(22 + k, 13, 31 + k * 0.5, 3); } }, 1); gold(c, (c) => { for (const t of [0.25, 0.55, 0.85]) ell(c, 12 + t * 20, 24 - t * 20, 2.6, 2.6); }, 0.9); },
    saya: () => { shape(c, (c) => { c.moveTo(13, 25); c.quadraticCurveTo(24, 12, 38, 1); c.lineTo(39, 4); c.quadraticCurveTo(26, 16, 15, 28); c.closePath(); }, { fill: '#8a3a26', glint: false }); gold(c, (c) => ell(c, 10, 31, 3.4, 3.4), 1.2); },
  };
  (G[id] || G.gunblade)();
}

/** The glyph of one option. */
export function styleGlyph({ slot, id, card = null }) {
  const key = `${slot}:${id}:${card}`; if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = N * S; const c = cv.getContext('2d'); c.scale(S, S);
  if (slot === 'form') frame(c, id);
  else if (slot === 'figure') frame(c, 'doll', id);
  else if (slot === 'harness') { torso(c); gold(c, HARN[id] || HARN.halter, 1.1); }
  else if (slot === 'pauldron') shoulder(c, id);
  else if (slot === 'hip') hips(c, id);
  else if (slot === 'helm') helm(c, id, card);
  else if (slot === 'cape') back(c, id);
  else if (slot === 'cradle') cradle(c, id);
  else if (slot === 'gunblade') gunblade(c, id);
  cache.set(key, cv); return cv;
}
/** A copy of a cached glyph (a canvas element lives in one place in the page). */
export function glyphEl(o) { const src = styleGlyph(o), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); return cv; }
