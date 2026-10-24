// ---------------------------------------------------------------------------------------
// INSTRUMENT SKINS: the overlay's instruments dressed as one set, a preference like the window colour (OVERLAY.md 15.3; the owner,
// 2026-10-24: "pull out all the stops ... on customization options, you can get weird with it"). A skin is the housing, never the
// readout: it repaints the Sight's discs, metal, clock hand and glass (vfx/sight.js), the Lachrimeter's tube's brass, scale plate,
// fittings and glass (vfx/lachrimetertube.js: the cube plate's plate and the Blink's pearls' rail are its brass), the spiritual link's
// halo (vfx/spirituallink.js), and puts small studs of its metal on the System windows' frames (ui/brineframe.js); some grow a garnish
// (vfx/instrumentskins/garnish.js: gears, roots and moss, coral, a mimic's teeth and eyes). What is never touched: the pool's
// Lachryma (the bulb, the column, the meniscus), the weather's liquid, the needle, every count and tick's legibility (a skin's scale
// plate keeps its ticks bright on a dark ground, or dark on a light one), the clock ring and the yoke (glazed in the window colour,
// the player's own), the windows' matter and line (the window colour and the island's dress, OVERLAY.md 15.4), and the studs on the yoke.
//
// How a skin is drawn: by the instruments' own materials' colours and maps (the discs' atlas gradient-mapped through the skin's ramp, a
// craze or a grain drawn over; the baked metal's palette texels rewritten; the brass's mottle and the plate's ground redrawn; one
// uniform each on the two glasses' kinds and the link's kind, in the overlay's one program). No new program: a garnish's parts are the
// lit parts' one set-up (`overlayStd`).
//
// Kept in the save's settings scope (section `instrumentSkin`, as the window colour is `windowColour`); `/instruments id` in DEBUG; a
// row for the settings window proposed to Petra (docs/handoffs/petra/2026-10-24-from-calissa-instrument-skins.md); opens, if any,
// Dovina's (docs/handoffs/dovina/...). Event `instruments.skin { id, by }` when the player picks one (tracking/instruments.js says it).
//
// Prior art: the Pip-Boy's and the watch world's case options (one movement, many cases: brass, steel, ceramic, carbon); Animal
// Crossing's NookPhone cases; Final Fantasy XIV's and Destiny's UI themes; a gradient map (Photoshop's, the palette swap of the 16-bit
// era: one picture, many ramps); the materials themselves: Victorian brass instruments, Qing bone and amber snuff bottles, Liangzhu
// jade and gold mounts, Aztec obsidian mirrors, Jingdezhen's blue-and-white, raku's post-firing reduction, coral grottoes, skeleton
// clocks, kokedama, the Mimic.
//
//   game.instrumentSkins = new InstrumentSkins(game)   .id   .skin   .set(id, by)   .apply()   .choices -> [[id, label]]
//   INSTRUMENT_SKINS[id] -> { label, line, sight, tube, glass, link, fit, garnish }   INSTRUMENT_SKIN_ORDER
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mottle, PLATE_STOCK } from './lachrimetertube.js';
import { buildGarnish } from './instrumentskins/garnish.js';

const LIN = THREE.LinearSRGBColorSpace;
const STOCK_BRASS = { base: '#a37c34', blobs: [['#c9a253', 0.5], ['#3f8a74', 0.45], ['#5b4218', 0.4]], specks: ['#0b1f1a', '#9fd3c0'], r: 0.38, m: 0.85 };
const STOCK_PLATE_ORM = [0.22, 0];
// a part of the Sight's baked metal by the colour it was built in (vfx/sight.js build: bronze, copper, the rods' dark, the gold joins,
// the anode's and the cathode's lips); the unlit studs (a readout's) are not listed, so they stay
const ROLE_OF = { 0x9a7440: 'metal', 0xc06a3a: 'accent', 0x3a2616: 'dark', 0xe8b84a: 'trim', 0xb06a3c: 'rimA', 0x3a2b26: 'rimC' };

/** The skins, in the settings' order. Colours are as seen (sRGB); a part is [colour, roughness, metalness, glow?]. `sight.ramp` the
 *  discs' gradient map (luminance stops), `sight.over` a layer drawn over it ('craze' raku's crackle and lustre, 'grain' wood); `tube.plate`
 *  the scale plate's ground and gilt; `glass` and `link` a tint (r, g, b, how much). Labels and lines are placeholders for Espada's. */
export const INSTRUMENT_SKINS = {
  brass: { label: 'Brass and glass', line: 'The instruments as they were made: brass, clay and blown glass.' },
  bone: {
    label: 'Bone and amber', line: 'Carved bone, set with amber that holds the light.',
    sight: { ramp: [[0, '#4a3a26'], [0.3, '#a89070'], [0.6, '#e2d4b4'], [1, '#fbf4e2']], disc: { rough: 0.55, clear: 0.2, bump: 0.03 },
      metal: [0xd88a22, 0.2, 0, 0x2a1000], accent: [0xb85a14, 0.25, 0], dark: [0x6a5236, 0.6, 0], trim: [0xffc860, 0.2, 0.3], rimA: [0xeee0c0, 0.55, 0], rimC: [0xd8c49a, 0.55, 0] },
    tube: { brass: { base: '#d9c9a4', blobs: [['#efe2c0', 0.5], ['#b89a68', 0.45], ['#c87a20', 0.35]], specks: ['#5a4228', '#fff4dc'], r: 0.45, m: 0 },
      plate: { ground: '#2a1a0c', streaks: ['#5a3a1a', '#8a5a2a', '#3a2410'], edge: '200,140,60', gilt: '#f4e8cc', minor: '#d8c8a4', cut: '#0a0602' } },
    glass: [1, 0.72, 0.32, 0.3], link: [1, 0.7, 0.3, 0.45], fit: ['#f0e2c0', '#c87a20'],
  },
  jade: {
    label: 'Jade and gold', line: 'Polished green jade, mounted in gold.',
    sight: { ramp: [[0, '#06180f'], [0.25, '#1f5a3c'], [0.55, '#5fa47c'], [0.85, '#b8e2c4'], [1, '#e8fff0']], disc: { rough: 0.12, clear: 1, cr: 0.05, bump: 0.006 },
      metal: [0xf2c24a, 0.2, 1], accent: [0xd8a838, 0.25, 1], dark: [0x184a32, 0.3, 0.1], trim: [0xfff0a0, 0.15, 1], rimA: [0xf2c24a, 0.2, 1], rimC: [0xe0b040, 0.2, 1] },
    tube: { brass: { base: '#c9982e', blobs: [['#f0c860', 0.5], ['#a87a1e', 0.4], ['#2f7a52', 0.25]], specks: ['#5a3a08', '#fff0b0'], r: 0.24, m: 1 },
      plate: { ground: '#0a2418', streaks: ['#1e5a3c', '#3a8a5c', '#08180f'], edge: '80,160,110', gilt: '#f2cf6a', minor: '#d0ac52', cut: '#03100a' } },
    glass: [0.7, 1, 0.82, 0.2], link: [0.4, 0.95, 0.6, 0.5], fit: ['#f2c24a', '#2f7a52'],
  },
  obsidian: {
    label: 'Obsidian and silver', line: 'Black volcanic glass, polished to a mirror, trimmed in silver.',
    sight: { ramp: [[0, '#000000'], [0.4, '#0c0a12'], [0.75, '#2a2636'], [1, '#7a7290']], disc: { rough: 0.08, clear: 1, cr: 0.02, bump: 0.004 },
      metal: [0xdfe3ea, 0.14, 1], accent: [0xa8aebc, 0.2, 1], dark: [0x101016, 0.2, 0.5], trim: [0xffffff, 0.1, 1], rimA: [0xd8dce4, 0.15, 1], rimC: [0xc0c4cc, 0.15, 1] },
    tube: { brass: { base: '#b4b8c2', blobs: [['#e2e6ee', 0.5], ['#7a7e8a', 0.45], ['#2a2a34', 0.3]], specks: ['#202028', '#ffffff'], r: 0.18, m: 1 },
      plate: { ground: '#050508', streaks: ['#2a2438', '#40385a', '#101018'], edge: '120,110,150', gilt: '#e8ecf4', minor: '#b8bcc8', cut: '#000000' } },
    glass: [0.72, 0.78, 1, 0.22], link: [0.85, 0.88, 1, 0.55], fit: ['#e4e8f0', '#121018'],
  },
  porcelain: {
    label: 'Blue and white', line: 'White porcelain painted in cobalt, fired glassy.',
    sight: { ramp: [[0, '#0e2470'], [0.07, '#1f48a8'], [0.1, '#f2f4f6'], [0.45, '#ffffff'], [0.6, '#5a7ccc'], [1, '#1f48a8']], disc: { rough: 0.1, clear: 1, cr: 0.05, bump: 0.01 },
      metal: [0xf6f4ee, 0.18, 0], accent: [0x2a58c0, 0.2, 0], dark: [0x1a307a, 0.25, 0], trim: [0xe8c064, 0.2, 1], rimA: [0x2a58c0, 0.2, 0], rimC: [0xf6f4ee, 0.2, 0], hand: [0x1f48a8, 0.2, 0] },
    tube: { brass: { base: '#eef0f0', blobs: [['#ffffff', 0.5], ['#2c56b8', 0.35], ['#c8d4ec', 0.4]], specks: ['#1f48a8', '#ffffff'], r: 0.14, m: 0 },
      plate: { ground: '#0f2a78', streaks: ['#2850b0', '#1a3a90', '#3a64c8'], edge: '230,236,248', gilt: '#f6f6f2', minor: '#dfe4ee', cut: '#06123a' } },
    glass: [0.85, 0.92, 1, 0.12], link: [0.25, 0.45, 1, 0.55], fit: ['#f6f4ee', '#1f48a8'],
  },
  raku: {
    label: 'Raku', line: 'Smoked black clay, crackled white, flashed with copper.',
    sight: { ramp: [[0, '#030202'], [0.3, '#120e0c'], [0.6, '#2e2622'], [1, '#d8c8b0']], over: 'craze', disc: { rough: 0.7, clear: 0.15, bump: 0.03 },
      metal: [0xc8703a, 0.32, 1], accent: [0xe0904c, 0.3, 1], dark: [0x0c0908, 0.7, 0], trim: [0x3ac8a8, 0.25, 1], rimA: [0x1a1412, 0.8, 0], rimC: [0x2a1a14, 0.7, 0.3] },
    tube: { brass: { base: '#1a1412', blobs: [['#c86a2a', 0.45], ['#2a9a8a', 0.3], ['#0a0806', 0.5]], specks: ['#000000', '#e8a060'], r: 0.35, m: 0.5 },
      plate: { ground: '#0a0807', streaks: ['#a85a2a', '#3a8a7a', '#1e1612'], edge: '200,110,50', gilt: '#f0a060', minor: '#c8804a', cut: '#000000' } },
    glass: [1, 0.72, 0.5, 0.12], link: [1, 0.55, 0.25, 0.45], fit: ['#c8703a', '#3ac8a8'],
  },
  coral: {
    label: 'Coral reef', line: 'Pink coral and mother-of-pearl, grown over in the shallows.', garnish: 'coral',
    sight: { ramp: [[0, '#5a1a2c'], [0.25, '#c04a62'], [0.5, '#f08c96'], [0.8, '#ffd2cc'], [1, '#fff4ee']], disc: { rough: 0.65, clear: 0.2, bump: 0.04 },
      metal: [0xf6eeea, 0.12, 0.35], accent: [0xff7a7a, 0.4, 0], dark: [0x8a3a4a, 0.5, 0], trim: [0xfff6f2, 0.08, 0.4], rimA: [0xf6eeea, 0.12, 0.35], rimC: [0xe8dcd8, 0.12, 0.35] },
    tube: { brass: { base: '#ecdcd8', blobs: [['#ffd0d8', 0.45], ['#a8e0e0', 0.35], ['#c8b0e8', 0.35]], specks: ['#c04a62', '#ffffff'], r: 0.12, m: 0.4 },
      plate: { ground: '#06303a', streaks: ['#0e5a64', '#1a7a7a', '#0a2028'], edge: '240,140,150', gilt: '#ffe8e0', minor: '#f4c0b8', cut: '#021014' } },
    glass: [0.55, 1, 0.92, 0.22], link: [0.5, 1, 0.9, 0.5], fit: ['#fff4f0', '#f08c96'],
  },
  clockwork: {
    label: 'Clockwork', line: 'An open movement: its gears turn behind the glass.', garnish: 'gears',
    sight: { ramp: [[0, '#1a1006'], [0.25, '#6a4a1c'], [0.55, '#c09040'], [1, '#fbe6a0']], disc: { rough: 0.3, clear: 0.5, bump: 0.02, metal: 0.85 },
      metal: [0xe0b448, 0.24, 1], accent: [0x9aa2b2, 0.22, 1], dark: [0x2a2a30, 0.3, 1], trim: [0xd02040, 0.1, 0.2, 0x300008], rimA: [0xd0a040, 0.25, 1], rimC: [0x8a9098, 0.25, 1] },
    tube: { brass: { base: '#c8a040', blobs: [['#f0d070', 0.5], ['#8a6a20', 0.4], ['#5a5a60', 0.3]], specks: ['#3a2a08', '#fff0c0'], r: 0.25, m: 1 },
      plate: { ground: '#1a1208', streaks: ['#5a4020', '#8a6a30', '#2a2018'], edge: '200,160,80', gilt: '#f4d070', minor: '#d0b060', cut: '#050300' } },
    glass: [1, 0.92, 0.75, 0.1], link: [1, 0.8, 0.4, 0.5], fit: ['#e0b448', '#d02040'],
  },
  living: {
    label: 'Overgrown', line: 'Old brass gone green, roots and moss growing over it.', garnish: 'moss',
    sight: { ramp: [[0, '#0a120a'], [0.25, '#2a3e1c'], [0.55, '#5c7a34'], [1, '#c8d898']], disc: { rough: 0.85, clear: 0.05, bump: 0.05 },
      metal: [0x8a7a40, 0.55, 0.7], accent: [0x5a8a3a, 0.7, 0.2], dark: [0x3a2a18, 0.85, 0], trim: [0xc8d870, 0.4, 0.5], rimA: [0x4a6a30, 0.8, 0], rimC: [0x3a5228, 0.8, 0] },
    tube: { brass: { base: '#7a6a34', blobs: [['#4a7a3a', 0.55], ['#2a4a20', 0.45], ['#a08a40', 0.35]], specks: ['#1a2a10', '#c8e0a0'], r: 0.55, m: 0.6 },
      plate: { ground: '#14100a', streaks: ['#3a2a18', '#5a4a24', '#2a3a18'], edge: '120,140,60', gilt: '#e0d890', minor: '#b8b070', cut: '#050402' } },
    glass: [0.8, 1, 0.7, 0.15], link: [0.6, 1, 0.4, 0.5], fit: ['#8a7a40', '#5c8a2e'],
  },
  mimic: {
    label: 'Mimic', line: 'It was a treasure chest. It is still hungry. It watches you.', garnish: 'mimic',
    sight: { ramp: [[0, '#120804'], [0.2, '#3a200e'], [0.45, '#7a4a22'], [0.75, '#b07a42'], [1, '#e0b07a']], over: 'grain', disc: { rough: 0.6, clear: 0.25, bump: 0.04 },
      metal: [0x4a4a52, 0.5, 1], accent: [0x6a3a22, 0.6, 0], dark: [0x1a1a1e, 0.5, 1], trim: [0xe8b440, 0.2, 1], rimA: [0x3a3a42, 0.5, 1], rimC: [0x3a3a42, 0.5, 1] },
    tube: { brass: { base: '#3a3a42', blobs: [['#5a5a64', 0.45], ['#6a3a20', 0.4], ['#1a1a1e', 0.5]], specks: ['#0a0a0c', '#a0a0aa'], r: 0.5, m: 0.9 },
      plate: { ground: '#2a1408', streaks: ['#5a3418', '#7a4a22', '#1a0c04'], edge: '170,110,50', gilt: '#f0c860', minor: '#d0a850', cut: '#080402' } },
    glass: [1, 0.55, 0.6, 0.16], link: [1, 0.35, 0.45, 0.45], fit: ['#e8b440', '#3a3a42'],
  },
};
export const INSTRUMENT_SKIN_ORDER = Object.keys(INSTRUMENT_SKINS);

/** A gradient map: each pixel's luminance looked up in the ramp (stops [pos, '#hex']), its alpha kept. */
function gradientMap(src, dst, ramp) {
  const w = src.width, h = src.height, x = dst.getContext('2d'), lut = new Uint8ClampedArray(256 * 3), hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  for (let i = 0; i < 256; i++) {
    const v = i / 255; let k = 0; while (k < ramp.length - 2 && v > ramp[k + 1][0]) k++;
    const [p0, c0] = ramp[k], [p1, c1] = ramp[k + 1], f = Math.min(1, Math.max(0, (v - p0) / (p1 - p0 || 1))), a = hex(c0), b = hex(c1);
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = a[j] + (b[j] - a[j]) * f;
  }
  const im = src.getContext('2d').getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const l = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * 3; d[i] = lut[l]; d[i + 1] = lut[l + 1]; d[i + 2] = lut[l + 2]; }
  x.putImageData(im, 0, 0);
}
/** A layer over the repainted discs: raku's crackle and copper lustre, or a wood's grain. */
function overlay(c, kind) {
  const x = c.getContext('2d'), w = c.width, h = c.height; let s = 97; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  if (kind === 'craze') {
    for (const [col, n] of [['rgba(210,110,40,.32)', 26], ['rgba(40,170,150,.22)', 18], ['rgba(150,60,170,.18)', 12]]) for (let i = 0; i < n; i++) { const px = R() * w, py = R() * h, r = 20 + R() * 70, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
    x.strokeStyle = 'rgba(232,220,200,.5)'; x.lineWidth = 1;
    for (let i = 0; i < 420; i++) { let px = R() * w, py = R() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (R() - 0.5) * 34; py += (R() - 0.5) * 34; x.lineTo(px, py); } x.stroke(); }
  } else if (kind === 'grain') {
    for (let i = 0; i < 700; i++) { const py = R() * h, px = R() * w, l = 40 + R() * 160; x.globalAlpha = 0.12 + R() * 0.2; x.strokeStyle = R() < 0.5 ? '#1a0c04' : '#c89058'; x.lineWidth = 0.6 + R() * 1.2; x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + l / 3, py + (R() - 0.5) * 6, px + 2 * l / 3, py + (R() - 0.5) * 6, px + l, py); x.stroke(); }
    x.globalAlpha = 1;
  }
}
const lin = (hex) => new THREE.Color().setHex(hex); // (as seen: taken to the working space, linear)
const b8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);

// the studs a skin puts on a System window's frame (four, on the keyline's straight runs, clear of the chamfers and the fold)
const FIT_CSS = `html[data-iskin] .bf::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;
  --s:calc(2.6*var(--d));background:
  radial-gradient(circle,var(--isk-a) 0 calc(.55*var(--s)),var(--isk-b) calc(.6*var(--s)) var(--s),transparent calc(1.1*var(--s))) calc(10*var(--d) - var(--s)) calc(-1*var(--s))/calc(2*var(--s)) calc(2*var(--s)) no-repeat,
  radial-gradient(circle,var(--isk-a) 0 calc(.55*var(--s)),var(--isk-b) calc(.6*var(--s)) var(--s),transparent calc(1.1*var(--s))) calc(100% - 12*var(--d) + var(--s)) calc(-1*var(--s))/calc(2*var(--s)) calc(2*var(--s)) no-repeat,
  radial-gradient(circle,var(--isk-a) 0 calc(.55*var(--s)),var(--isk-b) calc(.6*var(--s)) var(--s),transparent calc(1.1*var(--s))) calc(10*var(--d) - var(--s)) calc(100% + var(--s))/calc(2*var(--s)) calc(2*var(--s)) no-repeat,
  radial-gradient(circle,var(--isk-a) 0 calc(.55*var(--s)),var(--isk-b) calc(.6*var(--s)) var(--s),transparent calc(1.1*var(--s))) calc(100% - 12*var(--d) + var(--s)) calc(100% + var(--s))/calc(2*var(--s)) calc(2*var(--s)) no-repeat}`;

export class InstrumentSkins {
  constructor(game) {
    this.game = game; this.id = 'brass'; this.garnish = { sight: null, tube: null }; this.orig = {};
    const save = game.save;
    save?.section?.('instrumentSkin', { scope: 'settings', version: 1, dump: () => ({ id: this.id }), load: (s) => { if (s && INSTRUMENT_SKINS[s.id]) this.id = s.id; }, reset: () => { this.id = 'brass'; } });
    if (typeof document !== 'undefined') { const st = document.createElement('style'); st.id = 'instrumentskins'; st.textContent = FIT_CSS; document.head.appendChild(st); }
    this.apply();
  }
  get skin() { return INSTRUMENT_SKINS[this.id] || INSTRUMENT_SKINS.brass; }
  /** The skins as a settings choice's pairs. */
  get choices() { return INSTRUMENT_SKIN_ORDER.map((id) => [id, INSTRUMENT_SKINS[id].label]); }
  /** Put a skin on (kept in the save); false for an id that is not one. */
  set(id, by = 'courier') {
    if (!INSTRUMENT_SKINS[id]) return false;
    const changed = id !== this.id; this.id = id; this.game.save?.dirty?.('instrumentSkin'); this.apply();
    if (changed) this.game.events?.emit('instruments.skin', { id, label: this.skin.label, by });
    return true;
  }
  /** Every instrument dressed in the skin as it stands. */
  apply() {
    const K = this.skin, g = this.game;
    try { this.sight(g.sightLook, K); } catch (e) { console.warn('instrument skin: the Sight', e); }
    try { this.tube(g.lachrimeterTube, K); } catch (e) { console.warn('instrument skin: the tube', e); }
    const L = g.spiritualLink?.U?.uLinkSkin?.value; if (L) L.set(...(K.link || [0, 0, 0, 0]));
    if (typeof document !== 'undefined') {
      const r = document.documentElement;
      if (K.fit) { r.dataset.iskin = this.id; r.style.setProperty('--isk-a', K.fit[0]); r.style.setProperty('--isk-b', K.fit[1]); } else delete r.dataset.iskin;
    }
  }

  /** The Sight: its discs' atlas through the ramp, its baked metal's texels, the clock hand, the glass, a garnish on its tilt. */
  sight(S, K) {
    const P = S?.skinParts; if (!P) return;
    const o = this.orig.sight ||= { atlas: (() => { const c = document.createElement('canvas'); c.width = P.discAtlas.width; c.height = P.discAtlas.height; c.getContext('2d').drawImage(P.discAtlas, 0, 0); return c; })(),
      px: P.palette.px.slice(), hand: { c: P.handMat.color.clone(), r: P.handMat.roughness, m: P.handMat.metalness } };
    const k = K.sight, dm = P.discMat;
    if (k?.ramp) { gradientMap(o.atlas, P.discAtlas, k.ramp); if (k.over) overlay(P.discAtlas, k.over); } else P.discAtlas.getContext('2d').drawImage(o.atlas, 0, 0);
    P.discMap.needsUpdate = true;
    const d = k?.disc || {}; dm.roughness = d.rough ?? 0.6; dm.clearcoat = d.clear ?? 0.33; dm.clearcoatRoughness = d.cr ?? 0.4; dm.bumpScale = d.bump ?? 0.018; dm.metalness = d.metal ?? 0;
    // the metal's palette: each texel's part by the colour it was built in
    const { px, W, looks, tex } = P.palette; px.set(o.px);
    looks.forEach((b, i) => {
      const role = ROLE_OF[b.c.getHex(LIN)], p = k && role && k[role]; if (!p) return;
      const c = lin(p[0]), e = p[3] ? lin(p[3]) : null;
      px.set([b8(c.r), b8(c.g), b8(c.b), 255], i * 4); px.set([255, b8(p[1]), b8(p[2]), 255], W * 4 + i * 4); px.set(e ? [b8(e.r), b8(e.g), b8(e.b), 255] : [0, 0, 0, 255], W * 8 + i * 4);
    });
    tex.forEach((t) => { t.needsUpdate = true; });
    const h = k?.hand || k?.metal; if (h) { P.handMat.color.copy(lin(h[0])); P.handMat.roughness = h[1]; P.handMat.metalness = h[2]; } else { P.handMat.color.copy(o.hand.c); P.handMat.roughness = o.hand.r; P.handMat.metalness = o.hand.m; }
    P.glassTint.set(...(K.glass || [0, 0, 0, 0]));
    this.hang('sight', S, P.tilt, K, P);
  }

  /** The tube: its brass's mottle, the scale plate's ground and gilt, their roughness and metalness, the glass, a garnish on it. */
  tube(T, K) {
    const P = T?.skinParts; if (!P) return;
    const k = K.tube, B = k?.brass || STOCK_BRASS;
    mottle(P.brassC, B.base, B.blobs, 50, B.specks); P.orm('brass', B.r, B.m);
    const pl = k?.plate; P.orm('plate', pl?.r ?? STOCK_PLATE_ORM[0], pl?.m ?? STOCK_PLATE_ORM[1]);
    P.drawPlate(pl ? { ...PLATE_STOCK, ...pl } : PLATE_STOCK); // (redraws the atlas, the brass with it)
    P.glassTint.set(...(K.glass || [0, 0, 0, 0]));
    this.hang('tube', T, P.inst, K, P);
  }

  /** A skin's garnish on an instrument (the old one taken off), and its motion given to the instrument's frame. */
  hang(which, I, on, K, P) {
    this.garnish[which]?.dispose(); this.garnish[which] = null; I.skinTick = null;
    const G = K.garnish ? buildGarnish(K.garnish, which, P) : null; if (!G) return;
    on.add(G.group); this.garnish[which] = G; I.skinTick = (dt) => G.tick(dt);
  }
}
