// ---------------------------------------------------------------------------------------
// THE SCAN'S MOMENT (docs/plans/SEEDS-SLABS-SCANS.md 3; Petra's scanner, world/scanner.js, says `scan.read { what, kind, cls, sealed,
// again, own, how }`): scanning a code shown as a short reveal at the scanner's page, the code read and turned into what it held. A System
// window in the Clay dress, its picture one canvas (0 shader programs), about three real seconds, then it stands until the next read:
//   THE CODE      its bars drawn in from the left: a real EAN-13 when the digits typed are one (twelve or thirteen of them), else bars
//                 drawn from the digits; the digits under them. Only what the page's field still holds as the read is said is drawn,
//                 on this device, and nothing of it is kept (the scanner keeps the hash alone)
//   THE LASER     a red line swept across them (Barcode Battler's, Skannerz'), the bars it has passed lit gold
//   THE FOLD      the bars dropping and gathering into what the code held: A SPIRIT SLAB as a block of the island's strata with its
//                 fossil's glint of the film in its face, its class as stars; A MATERIAL as a cut stone in its kind's hue, its tier as
//                 stars; a code read before as cubes; one of our own codes (a made track's) as the Comb's hex cell
//   THE SEAL      a sealed slab (its creature never photographed) stamped SEALED in vermilion, the stamp landing hard and a little askew
// A made track's code read back opens its card too (ui/combcode.js), so it can be shown on to another phone.
//
// Prior art: Barcode Battler (Epoch, 1991: the card swiped, the bars become a warrior), Skannerz (Radica, 2000: the red line, the monster
// out of a UPC), Monster Rancher's shrine (the disc read, the monster unsealed from its stone), the hanko pressed on a goshuinchō.
//
//   game.scanMoment = new ScanMoment(game)   (on `scan.read`; it runs on its own frames, the page's: the scanner's page pauses the world)   SCAN_MOMENT
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, GOLD, FILM, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';
import { KINDS } from '../progress/econ/materials.js';
import { SCAN } from '../progress/scans.js';
import { ECON } from '../progress/econ/table.js';
import { spiritName } from '../world/garden/raising.js';
import { STRATA_LOOK } from '../vfx/garden/slabmesh.js';

/** Its beats (real seconds): the bars in, the laser's sweep, the fold, the stamp; the canvas's size in dots. */
export const SCAN_MOMENT = { bars: 0.5, laser: [0.35, 1.15], fold: [1.15, 1.75], stamp: 1.85, w: 230, h: 92, vermilion: '#c8402a', laserCol: '#ff3a2a' };
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
// EAN-13's three digit sets and the first digit's parity (the standard's own tables)
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLG', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

/** The code's modules: an EAN-13 (or a UPC-A, a 0 before it) as 95 modules, else bars of 1 to 3 modules drawn from the text. */
export function barsOf(text) {
  const d = String(text || '').replace(/\D/g, '');
  if (/^\d+$/.test(String(text || '').replace(/[\s-]/g, '')) && (d.length === 12 || d.length === 13)) {
    const D = (d.length === 12 ? '0' + d : d).split('').map(Number), P = PARITY[D[0]];
    let s = '101'; for (let i = 1; i <= 6; i++) s += (P[i - 1] === 'L' ? EAN_L : EAN_G)[D[i]]; s += '01010'; for (let i = 7; i <= 12; i++) s += EAN_R[D[i]]; s += '101';
    return { mods: s.split('').map(Number), ean: true, digits: D.join('') };
  }
  const t = String(text || 'FFS'); let h = 2166136261, s = '11010';
  for (let i = 0; i < Math.max(14, t.length); i++) { h ^= t.charCodeAt(i % t.length); h = Math.imul(h, 16777619) >>> 0; s += '1'.repeat(1 + (h & 1) + ((h >>> 3) & 1)) + '0'.repeat(1 + ((h >>> 5) & 1)); }
  return { mods: (s + '1011').slice(0, 120).split('').map(Number), ean: false, digits: t.length > 18 ? `${t.slice(0, 9)}…${t.slice(-6)}` : t };
}

const CSS = `
.sm{position:fixed;left:50%;top:calc(30*var(--d));z-index:7;width:calc(250*var(--d));max-width:calc(100vw - 24px);transform:translateX(-50%);opacity:0;pointer-events:none;transition:opacity .25s}
.sm.on{opacity:1}
.sm.inpage{position:relative;left:auto;top:auto;transform:none;width:auto;max-width:none;margin:calc(10*var(--d)) 0 calc(4*var(--d))}
${clayDress('.sm.clay')}
.sm canvas{display:block;width:100%;height:auto;background:#f3ead8;border-radius:calc(2*var(--d));box-shadow:inset 0 0 0 var(--d) rgba(120,86,52,.5),0 0 0 var(--d) #2a140c}
.sm-head{font-family:${FONT.title};font-weight:700;font-size:calc(10*var(--d));letter-spacing:.14em;color:${GOLD};margin-top:calc(3*var(--d));opacity:0;transition:opacity .3s}
.sm-line{font-size:calc(9*var(--d));opacity:0;transition:opacity .3s}
.sm.told .sm-head,.sm.told .sm-line{opacity:1}
.sm-line b{font-family:${COUNT_FACE};font-weight:400;color:${GOLD}}
`;

export class ScanMoment {
  constructor(game) { this.game = game; this.root = null; this.cur = null; game.events?.on('scan.read', (e) => this.read(e)); }
  /** A read said: what the field still holds is drawn (never kept), and the moment set up under the page the scanner draws again. */
  read(e) {
    if (typeof document === 'undefined') return;
    const field = document.querySelector('#indexmenu .scan-field'), typed = (field?.value || '').trim();
    this.cur = { e, bars: barsOf(typed || `${e.what}|${e.kind || ''}|${e.cls ?? ''}`), t: 0, told: false, own: e.own ? typed : '' };
    this.build(); this.words(); this.root.classList.remove('told'); this.root.classList.add('on');
    setTimeout(() => this.place(), 0); // (the scanner draws its page again just after it says the read: the moment goes in after)
    this.loop(); // (its own clock: the scanner's page is a modal, and the world's frame does not run under it)
    if (e.own && /^FF[2S]-/i.test(typed)) setTimeout(() => this.game.codeCard?.show(typed), 2200);
  }
  build() {
    if (this.root) return;
    const st = document.createElement('style'); st.setAttribute('data-scanmoment', ''); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = document.createElement('div')); root.className = 'sm clay'; root.style.setProperty('--d', `${dot()}px`);
    this.frame = brineFrame(root, { tab: 'SCAN' });
    this.cv = document.createElement('canvas'); this.head = document.createElement('div'); this.head.className = 'sm-head'; this.line = document.createElement('div'); this.line.className = 'sm-line';
    this.frame.body.append(this.cv, this.head, this.line);
  }
  /** In the scanner's page under its title when it is open, else standing over the view. */
  place() {
    const R = this.root, im = document.querySelector('#indexmenu .im'), menu = this.game.indexMenu || this.game.course?.menu, page = menu?.open && menu.page?.name === 'scan';
    R.style.setProperty('--d', `${dot()}px`);
    if (page && im) { R.classList.add('inpage'); const head = im.querySelector('header'); if (head) head.after(R); else im.prepend(R); setTimeout(() => R.scrollIntoView?.({ block: 'nearest' }), 80); } // (after the page's field takes the focus and scrolls to itself: on a phone the page is taller than the screen)
    else { R.classList.remove('inpage'); if (R.parentNode !== document.body) document.body.appendChild(R); clearTimeout(this.away); this.away = setTimeout(() => R.classList.remove('on'), 4500); } // (standing over the view, with no page under it: gone after a few real seconds)
    this.frame.layout();
  }
  words() {
    const e = this.cur.e, stars = (n) => '★'.repeat(Math.max(1, n));
    let head = '', line = '';
    if (e.own) { head = e.what === 'spirit' ? "A SPIRIT'S CODE" : "A MADE TRACK'S CODE"; line = e.what === 'spirit' ? 'Spirits cannot be shared yet.' : 'It waits in the track editor at the Raceway.'; }
    else if (e.again) { head = 'READ BEFORE'; line = `It gives <b>${Math.round(SCAN.again * ECON.perMinute)}</b> cubes, once.`; }
    else if (e.what === 'material') { head = 'A MATERIAL'; line = `${KINDS[e.kind]?.name || e.kind} <b>${stars((e.cls || 0) + 1)}</b>`; }
    else { head = e.sealed ? 'A SPIRIT SLAB, SEALED' : 'A SPIRIT SLAB'; line = `${spiritName({ kind: e.kind })} <b>${stars((e.cls || 0) + 1)}</b>${e.sealed ? ` · photograph a ${spiritName({ kind: e.kind })} to open it` : ' · carve it at the bench'}`; }
    this.head.textContent = head; this.line.innerHTML = line; // (plain words, Espada's to rule)
  }
  /** The moment's own frames (requestAnimationFrame), real seconds, until it has drawn its last. */
  loop() {
    if (this.raf || typeof requestAnimationFrame !== 'function') return;
    let last = performance.now();
    const step = (now) => { const dt = Math.min(0.25, (now - last) / 1000); last = now; this.update(dt); this.raf = this.cur && this.cur.t < SCAN_MOMENT.stamp + 0.6 ? requestAnimationFrame(step) : 0; };
    this.raf = requestAnimationFrame(step);
  }
  update(raw = 1 / 60) {
    const C = this.cur; if (!C || !this.root) return;
    C.t += raw;
    if (!C.told && C.t >= SCAN_MOMENT.stamp) { C.told = true; this.root.classList.add('told'); }
    if (C.t < SCAN_MOMENT.stamp + 0.6) this.draw(C);
  }

  // ------------------------------------------------------------------ the picture
  draw(C) {
    const M = SCAN_MOMENT, d = dot(), dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, W = Math.round(M.w * d * dpr), H = Math.round(M.h * d * dpr);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    const x = this.cv.getContext('2d'), t = C.t, mods = C.bars.mods, n = mods.length, bw = (W * 0.86) / n, x0 = W * 0.07, by = H * 0.12, bh = H * 0.56;
    x.clearRect(0, 0, W, H);
    const fold = Math.min(1, Math.max(0, (t - M.fold[0]) / (M.fold[1] - M.fold[0]))), f2 = fold * fold * (3 - 2 * fold), laser = (t - M.laser[0]) / (M.laser[1] - M.laser[0]), lx = x0 + Math.max(0, Math.min(1, laser)) * n * bw;
    // the bars: in from the left, lit gold where the laser has passed, then dropping and gathering into the block
    const shown = Math.min(n, Math.floor((t / M.bars) * n)), cx = W / 2, gw = W * 0.24;
    for (let i = 0; i < shown; i++) {
      if (!mods[i]) continue;
      const px = x0 + i * bw, tx = cx - gw / 2 + (i / n) * gw, X = px + (tx - px) * f2, h = bh * (1 - 0.7 * f2), Y = by + (bh - h) * 0.5 + f2 * H * 0.12;
      x.globalAlpha = 1 - f2 * 0.9; x.fillStyle = laser > 0 && px < lx ? '#3a2410' : '#1f1611'; x.fillRect(X, Y, Math.max(1, bw * (1 - 0.5 * f2)), h);
      if (laser > 0 && px < lx && laser < 1.2) { x.globalAlpha = 0.35 * (1 - f2); x.fillStyle = GOLD; x.fillRect(X, Y, bw, h); }
    }
    x.globalAlpha = 1 - f2;
    if (shown >= n) { x.fillStyle = '#1f1611'; x.font = `${Math.round(H * 0.13)}px ${COUNT_FACE}`; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(C.bars.digits.replace(/\D/g, '').length === 13 ? C.bars.digits.replace(/(\d)(\d{6})(\d{6})/, '$1 $2 $3') : C.bars.digits, W / 2, by + bh + H * 0.03); }
    // the laser: a red line swept across, glowing
    if (laser > 0 && laser < 1) { x.globalAlpha = 1; const g = x.createLinearGradient(lx - W * 0.03, 0, lx + W * 0.03, 0); g.addColorStop(0, 'rgba(255,58,42,0)'); g.addColorStop(0.5, 'rgba(255,58,42,.55)'); g.addColorStop(1, 'rgba(255,58,42,0)'); x.fillStyle = g; x.fillRect(lx - W * 0.03, by - H * 0.05, W * 0.06, bh + H * 0.1); x.fillStyle = M.laserCol; x.fillRect(lx - 1, by - H * 0.06, Math.max(2, dpr * 1.5), bh + H * 0.12); }
    x.globalAlpha = 1;
    if (fold > 0) this.held(x, C.e, W, H, f2, t);
  }
  /** What the code held, drawn as the bars gather into it. */
  held(x, e, W, H, k, t) {
    const cx = W / 2, cy = H * 0.5, s = H * 0.36 * (0.6 + 0.4 * k);
    x.save(); x.globalAlpha = k; x.translate(cx, cy);
    if (e.own) this.comb(x, s);
    else if (e.again) for (let i = 0; i < 3; i++) this.cube(x, (i - 1) * s * 0.75, (i % 2) * s * 0.18, s * 0.42, '#c9b4ff');
    else if (e.what === 'material') this.gem(x, s, (KINDS[e.kind]?.hue?.[0] ?? 200) + 15);
    else this.slab(x, s, t);
    if (!e.own && !e.again) this.stars(x, s, (e.cls || 0) + 1, k);
    x.restore();
    if (e.sealed && t >= SCAN_MOMENT.stamp) this.stamp(x, W, H, Math.min(1, (t - SCAN_MOMENT.stamp) / 0.18));
  }
  /** A block of the strata, its fossil glinting in its face (an isometric view). */
  slab(x, s, t) {
    const w = s * 1.5, h = s * 0.8, dpt = s * 0.5, L = STRATA_LOOK;
    x.fillStyle = hex(L[1][1]); x.beginPath(); x.moveTo(-w / 2, -h / 2); x.lineTo(-w / 2 + dpt, -h / 2 - dpt * 0.55); x.lineTo(w / 2 + dpt, -h / 2 - dpt * 0.55); x.lineTo(w / 2, -h / 2); x.closePath(); x.fill();
    x.fillStyle = hex(L[3][1]); x.beginPath(); x.moveTo(w / 2, -h / 2); x.lineTo(w / 2 + dpt, -h / 2 - dpt * 0.55); x.lineTo(w / 2 + dpt, h / 2 - dpt * 0.55); x.lineTo(w / 2, h / 2); x.closePath(); x.fill();
    [[L[1][0], 0, 0.3], [L[2][0], 0.3, 0.68], [L[3][0], 0.68, 1]].forEach(([c, a, b]) => { x.fillStyle = hex(c); x.fillRect(-w / 2, -h / 2 + a * h, w, (b - a) * h + 0.5); });
    x.strokeStyle = '#2a140c'; x.lineWidth = Math.max(1, s * 0.03); x.strokeRect(-w / 2, -h / 2, w, h);
    const ph = (t * 0.6) % 1, g = x.createLinearGradient(-w * 0.3, 0, w * 0.3, 0); FILM.forEach((c, i) => g.addColorStop((i / 4 + ph) % 1, c));
    x.strokeStyle = g; x.lineWidth = Math.max(1.5, s * 0.07); x.lineCap = 'round'; x.beginPath(); x.moveTo(-w * 0.32, h * 0.12); x.quadraticCurveTo(0, -h * 0.05, w * 0.3, h * 0.1); x.moveTo(-w * 0.12, h * 0.05); x.lineTo(-w * 0.18, h * 0.3); x.moveTo(w * 0.12, h * 0.06); x.lineTo(w * 0.18, h * 0.3); x.stroke();
    x.fillStyle = '#ffffff'; x.globalAlpha *= 0.8 + 0.2 * Math.sin(t * 9); x.beginPath(); x.arc(w * 0.3, h * 0.1, s * 0.05, 0, 7); x.fill();
  }
  gem(x, s, hue) {
    const P = [[0, -s * 0.6], [s * 0.55, -s * 0.15], [s * 0.35, s * 0.55], [-s * 0.35, s * 0.55], [-s * 0.55, -s * 0.15]];
    P.forEach((p, i) => { const q = P[(i + 1) % P.length]; x.fillStyle = `hsl(${hue},55%,${38 + i * 9}%)`; x.beginPath(); x.moveTo(0, 0); x.lineTo(...p); x.lineTo(...q); x.closePath(); x.fill(); });
    x.strokeStyle = '#2a140c'; x.lineWidth = Math.max(1, s * 0.03); x.beginPath(); P.forEach((p, i) => (i ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.stroke();
  }
  cube(x, ox, oy, s, col) {
    x.fillStyle = col; x.fillRect(ox - s / 2, oy - s / 2, s, s); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(ox - s / 2, oy - s / 2, s, s * 0.25);
    x.strokeStyle = '#2a140c'; x.lineWidth = Math.max(1, s * 0.06); x.strokeRect(ox - s / 2, oy - s / 2, s, s);
  }
  comb(x, s) {
    x.strokeStyle = SCAN_MOMENT.vermilion; x.fillStyle = SCAN_MOMENT.vermilion; x.lineWidth = Math.max(1.5, s * 0.08);
    for (const r of [s * 0.6, s * 0.44]) { x.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; k ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(r, 0); } x.stroke(); }
    x.beginPath(); x.arc(0, 0, s * 0.14, 0, 7); x.fill();
  }
  stars(x, s, n, k) {
    x.fillStyle = GOLD; x.strokeStyle = '#2a140c'; x.lineWidth = Math.max(1, s * 0.025);
    for (let i = 0; i < n; i++) {
      const ox = (i - (n - 1) / 2) * s * 0.34, oy = s * 0.9, r = s * 0.14 * k;
      x.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j * Math.PI) / 5, rr = j % 2 ? r * 0.45 : r; x.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } x.closePath(); x.fill(); x.stroke();
    }
  }
  /** SEALED in vermilion, landing hard and a little askew (a hanko). */
  stamp(x, W, H, k) {
    const sc = 1 + (1 - k) * 1.6;
    x.save(); x.translate(W * 0.74, H * 0.36); x.rotate(-0.18); x.scale(sc, sc); x.globalAlpha = 0.9 * k;
    x.strokeStyle = SCAN_MOMENT.vermilion; x.fillStyle = SCAN_MOMENT.vermilion; x.lineWidth = Math.max(2, H * 0.03);
    const w = W * 0.2, h = H * 0.2; x.strokeRect(-w / 2, -h / 2, w, h); x.strokeRect(-w / 2 + h * 0.12, -h / 2 + h * 0.12, w - h * 0.24, h - h * 0.24);
    x.font = `700 ${Math.round(h * 0.42)}px ${FONT.title}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SEALED', 0, h * 0.04); // (plain words, Espada's to rule)
    x.restore();
  }
}
