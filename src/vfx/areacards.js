// ---------------------------------------------------------------------------------------
// THE AREA CARDS: the small painted vignette of where you are going, set on the area wipe's held cover (vfx/areawipe.js) above the
// destination's name. The painted cards come later (Calissa's, one an area, `art`: an image URL under assets/); until then each is drawn
// here, once a crossing, from its row's palette and motif onto the wipe's one small canvas: a sky, its sun or moon, a far silhouette in
// the motif's shape, a near ground, paper grain, and a ragged brushed edge (the card is a painting, not a screenshot).
//
// The rows' names are the plain ones of Dovina's plan (docs/plans/AREAS.md 4 and 5; src/progress/areas.js, DUNES_AREAS): placeholders
// until the owner calls the areas settled and Espada names them. `layer` is the line set small over the name; `dress` is the island's
// dress the wipe's frame is fired in (OVERLAY.md 15.4: Clay on Anagami, Brine on the Emocean; Nacre and Glass fall back to Clay until
// those dresses are built).
//
// Prior art: Final Fantasy XII's area name card over its zone change (Ivalice's Cinzel-like capitals, the region over the area), the
// painted location cards of Okami (Clover, 2006: sumi-e with a ragged brush edge, washi grain) and of the Ace Attorney "location" slates,
// Persona 5's calendar card (the place shown before it is entered), and the tarot's small vignette above a card's title.
//
//   AREA_CARDS[id] = { name, layer, dress, motif, sky: [top, horizon], sun, far, near, ink, art? }
//   cardOf(id) -> a row (an exact id, then its last part after '.', then its first; else the neutral row)
//   drawAreaCard(canvas, id, { name }?) -> the row drawn   (the canvas's own size; deterministic from the id)
// ---------------------------------------------------------------------------------------

const ROW = (name, layer, motif, sky, sun, far, near, extra = {}) => ({ name, layer, dress: 'clay', motif, sky, sun, far, near, ink: '#2a140c', ...extra });

export const AREA_CARDS = {
  // the Dunes (Dovina's five: AREAS.md 5)
  weir: ROW('the Weir', 'the Dunes', 'oasis', ['#7fb6c9', '#f2d2a2'], '#fff2c8', '#c9925e', '#a8683e'),
  shore: ROW('the shore', 'the Dunes', 'water', ['#5f9fc0', '#f4dcb4'], '#fff6dc', '#3f7f98', '#d8b07a'),
  ridges: ROW('the crystal ridges', 'the Dunes', 'ridge', ['#6a5aa0', '#e8b8a8'], '#ffe0f0', '#8a5ab0', '#b47a52'),
  flats: ROW('the Gnomon flats', 'the Dunes', 'flats', ['#d07a3a', '#f6d79a'], '#fff0b8', '#b8743e', '#e0aa66'),
  ruins: ROW('the ruins', 'the Dunes', 'ruins', ['#2a2650', '#c98a6a'], '#f3e2ff', '#5a3a4a', '#8a5a40'),
  // the rest of the map (AREAS.md 4)
  workshop: ROW('the workshop', 'Anagami Island', 'room', ['#3a1c12', '#9a5a32'], '#ffb46a', '#5c2e1c', '#2a140c'),
  hub: ROW('the hub', 'the basement', 'hoops', ['#1e1a2a', '#4a3a3a'], '#f1d2b0', '#6c9682', '#2a2420'),
  siege: ROW('the siege', 'the basement', 'room', ['#24141a', '#6a3030'], '#ff8a5a', '#40202a', '#1a0c10'),
  raceway: ROW('the Raceway park', 'the Raceway', 'track', ['#4a8ac0', '#f2cc8e'], '#fff4d0', '#c08048', '#d89c5a'),
  bazaar: ROW('Raku\'s Bazaar', 'Anagami Island', 'dome', ['#2a1440', '#b0503a'], '#ffd36a', '#6a2a50', '#3a1a20'),
  garden: ROW('the Spirit Garden', 'your Pneuka Jar', 'planet', ['#1a2a4a', '#6a8aa8'], '#fff2d8', '#4f7a4a', '#2f5c3e'),
  dunemaw: ROW('the Great Dunemaw', 'the Dunes', 'maw', ['#1a0e20', '#4a2a3a'], '#7fdcff', '#3a1a2a', '#0e0710'),
  crossing: ROW('a crossing', 'the Emocean', 'water', ['#1a2a40', '#7a6a8a'], '#d8f0ff', '#2a3a5a', '#17111f', { dress: 'brine' }),
  margarite: ROW('Margarite\'s dock', 'Margarite', 'water', ['#3a4a6a', '#e8d8e8'], '#fffaf0', '#8a8aa0', '#4a4a5a', { dress: 'brine' }),
  opensea: ROW('the open sea', 'the Emocean', 'water', ['#204a6a', '#a8c8d0'], '#ffffff', '#2a5a70', '#17111f', { dress: 'brine' }),
};
const NEUTRAL = ROW('', '', 'dunes', ['#4a3a5a', '#c89a7a'], '#fff0d8', '#8a5a4a', '#5a3428');

export function cardOf(id) {
  if (!id) return NEUTRAL;
  const s = String(id), parts = s.split('.');
  return AREA_CARDS[s] || AREA_CARDS[parts[parts.length - 1]] || AREA_CARDS[parts[0]] || NEUTRAL;
}

// a small seeded draw, so a card is the same every time it is drawn
function seeded(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

/** A silhouette across the card: y(x) from 0..1 (fractions of the height), filled to the bottom. */
function band(g, W, H, colour, yOf) {
  g.fillStyle = colour; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 2) g.lineTo(x, yOf(x / W) * H);
  g.lineTo(W, H); g.closePath(); g.fill();
}

const MOTIFS = {
  dunes(g, W, H, A, r) { const p = r() * 6; band(g, W, H, A.far, (u) => 0.62 + 0.05 * Math.sin(u * 7 + p) + 0.03 * Math.sin(u * 17 + p * 2)); },
  oasis(g, W, H, A, r) {
    MOTIFS.dunes(g, W, H, A, r);
    g.fillStyle = '#4f8fa0'; g.beginPath(); g.ellipse(W * 0.5, H * 0.78, W * 0.26, H * 0.06, 0, 0, Math.PI * 2); g.fill();
    for (const x of [0.3, 0.66, 0.74]) { // (palms: a trunk and four fronds)
      const bx = W * x, by = H * 0.74, top = H * (0.36 + r() * 0.08); g.strokeStyle = A.ink; g.lineWidth = Math.max(1.5, W / 160);
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + W * 0.02, (by + top) / 2, bx + W * 0.01, top); g.stroke();
      for (let k = 0; k < 4; k++) { const a = -Math.PI * (0.15 + k * 0.23); g.beginPath(); g.moveTo(bx + W * 0.01, top); g.quadraticCurveTo(bx + Math.cos(a) * W * 0.06, top + Math.sin(a) * H * 0.08, bx + Math.cos(a) * W * 0.09, top + H * 0.05); g.stroke(); }
    }
  },
  water(g, W, H, A, r) {
    g.fillStyle = A.far; g.fillRect(0, H * 0.6, W, H * 0.4);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const y = H * (0.64 + k * 0.05); g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin(x * 0.08 + k * 2 + r()) * 1.2); g.stroke(); }
    g.fillStyle = A.ink; g.fillRect(W * 0.08, H * 0.7, W * 0.34, H * 0.025); // (a jetty)
    for (let k = 0; k < 5; k++) g.fillRect(W * (0.1 + k * 0.075), H * 0.7, W * 0.008, H * 0.08);
  },
  ridge(g, W, H, A, r) {
    MOTIFS.dunes(g, W, H, { ...A, far: A.near }, r);
    for (let k = 0; k < 9; k++) { // (crystals: tall facets catching the light on one face)
      const x = W * (0.08 + r() * 0.84), w = W * (0.02 + r() * 0.03), h = H * (0.18 + r() * 0.25), y = H * 0.66;
      g.fillStyle = A.far; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x, y - h); g.lineTo(x + w, y); g.fill();
      g.fillStyle = 'rgba(255,230,255,.45)'; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x + w * 0.2, y); g.fill();
    }
  },
  flats(g, W, H, A) {
    band(g, W, H, A.far, (u) => 0.66 + 0.01 * Math.sin(u * 9));
    g.fillStyle = A.ink; g.beginPath(); g.moveTo(W * 0.6, H * 0.67); g.lineTo(W * 0.615, H * 0.12); g.lineTo(W * 0.63, H * 0.67); g.fill(); // (the Gnomon)
    g.fillStyle = 'rgba(42,20,12,.35)'; g.beginPath(); g.moveTo(W * 0.6, H * 0.67); g.lineTo(W * 0.05, H * 0.86); g.lineTo(W * 0.1, H * 0.9); g.lineTo(W * 0.63, H * 0.67); g.fill(); // (its shadow, the hour)
  },
  ruins(g, W, H, A, r) {
    MOTIFS.dunes(g, W, H, A, r);
    g.fillStyle = A.ink;
    const arch = (x, w, h) => { const y = H * 0.68; g.fillRect(x, y - h, w * 0.18, h); g.fillRect(x + w * 0.82, y - h, w * 0.18, h); g.fillRect(x, y - h - w * 0.12, w, w * 0.14); };
    arch(W * 0.18, W * 0.2, H * 0.3); arch(W * 0.62, W * 0.14, H * 0.22);
    for (let k = 0; k < 4; k++) { const x = W * (0.45 + k * 0.035), h = H * (0.1 + r() * 0.18); g.fillRect(x, H * 0.68 - h, W * 0.016, h); }
    for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,214,140,.85)'; g.beginPath(); g.arc(W * (0.3 + r() * 0.4), H * (0.3 + r() * 0.2), Math.max(1.5, W / 120), 0, Math.PI * 2); g.fill(); } // (Wisps)
  },
  room(g, W, H, A) {
    g.fillStyle = A.far; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W * 0.5, H * 0.62, 2, W * 0.5, H * 0.62, W * 0.4); gr.addColorStop(0, A.sun); gr.addColorStop(0.3, 'rgba(255,140,60,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = A.ink; g.beginPath(); g.moveTo(W * 0.3, H); g.lineTo(W * 0.3, H * 0.5); g.arc(W * 0.5, H * 0.5, W * 0.2, Math.PI, 0); g.lineTo(W * 0.7, H); g.fill(); // (a kiln's arch)
    g.fillStyle = gr; g.beginPath(); g.moveTo(W * 0.36, H); g.lineTo(W * 0.36, H * 0.55); g.arc(W * 0.5, H * 0.55, W * 0.14, Math.PI, 0); g.lineTo(W * 0.64, H); g.fill();
  },
  hoops(g, W, H, A) {
    g.fillStyle = A.near; g.fillRect(0, H * 0.75, W, H * 0.25);
    const C = ['#6c9682', '#ece2d2', '#2f5c3e']; g.lineWidth = Math.max(2, W / 90);
    C.forEach((c, k) => { g.strokeStyle = c; g.beginPath(); g.ellipse(W * 0.5, H * 0.45, W * (0.16 - k * 0.03), H * (0.08 + k * 0.08), k * 0.9, 0, Math.PI * 2); g.stroke(); });
    g.fillStyle = '#f1d2b0'; g.beginPath(); g.arc(W * 0.5, H * 0.45, W * 0.035, 0, Math.PI * 2); g.fill();
  },
  track(g, W, H, A, r) {
    MOTIFS.dunes(g, W, H, A, r);
    g.fillStyle = '#e8c890'; g.beginPath(); g.moveTo(W * 0.42, H); g.bezierCurveTo(W * 0.5, H * 0.8, W * 0.8, H * 0.72, W * 0.55, H * 0.62); g.lineTo(W * 0.58, H * 0.62); g.bezierCurveTo(W * 0.9, H * 0.74, W * 0.62, H * 0.84, W * 0.66, H); g.fill();
  },
  dome(g, W, H, A) {
    g.fillStyle = A.far; g.beginPath(); g.moveTo(W * 0.15, H * 0.7); g.arc(W * 0.5, H * 0.7, W * 0.35, Math.PI, 0); g.fill();
    for (let k = 0; k < 7; k++) { g.fillStyle = ['#ffd36a', '#d91a80', '#0a8cbf'][k % 3]; g.fillRect(W * (0.2 + k * 0.09), H * 0.6, W * 0.04, H * 0.02); } // (the neon bands)
  },
  planet(g, W, H, A) {
    g.fillStyle = A.far; g.beginPath(); g.arc(W * 0.5, H * 1.25, H * 0.75, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 3; k++) { g.fillStyle = A.near; g.beginPath(); g.arc(W * (0.18 + k * 0.32), H * (0.25 + (k % 2) * 0.1), H * (0.05 + k * 0.015), 0, Math.PI * 2); g.fill(); }
  },
  maw(g, W, H, A) {
    MOTIFS.dunes(g, W, H, { ...A, far: '#6a4a3a' }, () => 0.3);
    g.strokeStyle = 'rgba(127,220,255,.6)'; g.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) { const rr = a * W * 0.012; g.lineTo(W * 0.5 + Math.cos(a + k * 2.1) * rr, H * 0.76 + Math.sin(a + k * 2.1) * rr * 0.3); } g.stroke(); }
  },
};

/** The ragged brushed edge: everything outside a wobbling rounded rectangle is let go (destination-in). */
function brushEdge(g, W, H, r) {
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = '#000'; g.beginPath();
  const n = 72, cx = W / 2, cy = H / 2;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const sq = 1 / Math.pow(Math.pow(Math.abs(c), 6) + Math.pow(Math.abs(s), 6), 1 / 6); // (a superellipse: a card's corners, rounded)
    const k = 0.94 + 0.05 * r();
    g.lineTo(cx + c * sq * cx * k, cy + s * sq * cy * k);
  }
  g.fill(); g.globalCompositeOperation = 'source-over';
}

export function drawAreaCard(canvas, id, { name } = {}) {
  const A = cardOf(id), W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), r = seeded(id || name || 'area');
  if (!g) return A;
  g.clearRect(0, 0, W, H);
  const sky = g.createLinearGradient(0, 0, 0, H * 0.7); sky.addColorStop(0, A.sky[0]); sky.addColorStop(1, A.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sx = W * (0.25 + r() * 0.5), sy = H * (0.22 + r() * 0.18), sr = H * 0.08; // (its sun or moon, with a halo)
  const halo = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 4); halo.addColorStop(0, A.sun); halo.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalAlpha = 0.5; g.fillStyle = halo; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  g.fillStyle = A.sun; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
  (MOTIFS[A.motif] || MOTIFS.dunes)(g, W, H, A, r);
  band(g, W, H, A.near, (u) => 0.86 + 0.03 * Math.sin(u * 5 + 1.3));
  for (let i = 0; i < W * H / 60; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,220,.08)' : 'rgba(30,12,6,.09)'; g.fillRect(r() * W, r() * H, 1, 1); } // (the paper's grain)
  brushEdge(g, W, H, r);
  return A;
}
