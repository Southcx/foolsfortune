// ---------------------------------------------------------------------------------------
// A CODE'S CARD: the game's own codes (a made track's FF2-, a spirit's FFS-: docs/plans/SEEDS-SLABS-SCANS.md 3) shown in the Comb's
// dress, so a code shared can be scanned off the screen by a friend's phone (world/scanner.js reads QR codes; the made track's code goes
// to the track editor's Load code). A System window in the Clay dress (ui/goalswindow.js clayDress over ui/brineframe.js):
//   THE CODE       a real QR code of the text (ui/qrcode.js), sumi on washi, its quiet zone kept, every module square and whole, so any
//                  camera reads it: it must scan, so it is never dressed
//   THE COMB       beside it, the same code in our own stamp script: a honeycomb of the Comb's hex cells (OVERLAY.md 15.5) seven across
//                  and five down, each inked or left by the code's bits, its three corners doubled cells in vermilion as a QR code's
//                  finders are, and under it the code's check in the Comb's numerals (vfx/sealface.js drawCombNumber); a picture of
//                  the same thing, never read by a machine
//   THE WORDS      what it is (a made track's code, a spirit's code), its name, the code's ends, COPY and CLOSE
// Shown on `track.share` (the track editor's Share code: the slot's code from `game.trackEditor.codeOf()`), and by the scan's moment
// for one of our own read back in (ui/scanmoment.js). It closes by its button, or after a real minute and a half.
//
// Prior art: Denso Wave's QR code (its three finder squares), the hanko and the goshuinchō's vermilion, Skannerz' and Barcode Battler's
// codes printed on a card to trade, Yo-kai Watch's QR medals, the Comb's own honeycomb (vfx/sealface.js, ui/runninghand.js).
//
//   game.codeCard = new CodeCard(game)   .show(text, { name })   .hide()   drawCombCode(ctx, text, { size, ink, mark })   COMB_CODE
// ---------------------------------------------------------------------------------------
import { qrMatrix } from './qrcode.js';
import { drawCombNumber } from '../vfx/sealface.js';
import { brineFrame, dot, GOLD, SALT, COUNT_FACE } from './brineframe.js';
import { clayDress } from './goalswindow.js';
import { FONT } from './theme.js';

/** The card's inks and numbers: the honeycomb's columns and rows, the QR's quiet zone (modules), how long it stands (real seconds). */
export const COMB_CODE = { sumi: '#1f1611', vermilion: '#c8402a', washi: '#f3ead8', cols: 7, rows: 5, quiet: 4, stand: 90 };
const WORD = { track: "A MADE TRACK'S CODE", spirit: "A SPIRIT'S CODE" }; // (plain words, Espada's to rule)

const fnv = (s, seed = 2166136261) => { let h = seed >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); return (h ^ (h >>> 15)) >>> 0; };

/** The code in the Comb: a honeycomb of hex cells, inked by its bits, three doubled corner cells; its check in the Comb's numerals. */
export function drawCombCode(ctx, text, { size = 256, ink = COMB_CODE.sumi, mark = COMB_CODE.vermilion } = {}) {
  const { cols, rows } = COMB_CODE, S3 = Math.sqrt(3), R = Math.min(size / ((cols - 1) * 1.5 + 2), (size * 0.76) / (rows * S3 + S3 / 2)), ox = (size - ((cols - 1) * 1.5 + 2) * R) / 2 + R, oy = R * S3 / 2 + size * 0.03;
  const bits = []; for (let k = 0; k < 4; k++) { const h = fnv(text, 2166136261 + k * 0x9e3779b9); for (let i = 0; i < 32; i++) bits.push((h >>> i) & 1); }
  const hex = (cx, cy, r) => { ctx.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; k ? ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
  const finder = (c, r) => (c === 0 && r === 0) || (c === cols - 1 && r === 0) || (c === 0 && r === rows - 1);
  ctx.save(); ctx.lineJoin = 'round';
  let b = 0;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const cx = ox + c * 1.5 * R, cy = oy + r * S3 * R + (c % 2) * S3 * R / 2;
    if (finder(c, r)) { // (a finder: the doubled cell, inked, a dot at its heart, in vermilion)
      ctx.strokeStyle = ctx.fillStyle = mark; ctx.lineWidth = R * 0.12; hex(cx, cy, R * 0.9); ctx.stroke(); hex(cx, cy, R * 0.66); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.26, 0, 7); ctx.fill(); continue;
    }
    const on = bits[b++ % bits.length];
    ctx.strokeStyle = ctx.fillStyle = ink; ctx.lineWidth = R * 0.08;
    hex(cx, cy, R * 0.86); if (on) ctx.fill(); else ctx.stroke();
    if (on) { ctx.strokeStyle = COMB_CODE.washi; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.moveTo(cx - R * 0.4, cy); ctx.lineTo(cx + R * 0.4, cy); if (bits[(b * 7) % bits.length]) { ctx.moveTo(cx, cy - R * 0.35); ctx.lineTo(cx, cy + R * 0.35); } ctx.stroke(); } // (an inked cell's stroke: the Comb's waist, and its spoke where the next bit says)
  }
  const m = /-([0-9a-z]{4})$/i.exec(text), n = m ? parseInt(m[1], 36) % 10000 : fnv(text) % 10000;
  drawCombNumber(ctx, n, { x: size * 0.2, y: size * 0.9, size: size * 0.1, ink: mark });
  ctx.restore();
}

const CSS = `
.ccd{position:fixed;left:50%;top:50%;z-index:6;width:calc(330*var(--d));max-width:calc(100vw - 24px);transform:translate(-50%,-50%);opacity:0;pointer-events:none;transition:opacity .25s}
.ccd.on{opacity:1;pointer-events:auto}
${clayDress('.ccd.clay')}
.ccd-head{font-family:${FONT.title};font-weight:700;font-size:calc(10*var(--d));letter-spacing:.14em;color:${GOLD}}
.ccd-name{font-size:calc(9*var(--d));opacity:.85;margin-bottom:calc(3*var(--d))}
.ccd-art{display:flex;gap:calc(4*var(--d));align-items:stretch;justify-content:center;padding:calc(4*var(--d));background:${COMB_CODE.washi};border-radius:calc(2*var(--d));
  box-shadow:inset 0 0 0 var(--d) rgba(120,86,52,.5),0 0 0 var(--d) #2a140c}
.ccd-art canvas{display:block;image-rendering:pixelated;flex:none}
.ccd-code{font-family:${COUNT_FACE};font-size:calc(9*var(--d));letter-spacing:.04em;margin-top:calc(3*var(--d));word-break:break-all;opacity:.85}
.ccd-acts{display:flex;gap:calc(4*var(--d));justify-content:flex-end;margin-top:calc(3*var(--d))}
.ccd-acts button{font-family:${COUNT_FACE};font-size:calc(10*var(--d));letter-spacing:.08em;color:#3a1c10;background:linear-gradient(180deg,#e9d6bc,#c9a882);border:0;border-radius:calc(2*var(--d));
  padding:calc(3*var(--d)) calc(7*var(--d));cursor:pointer;box-shadow:inset 0 var(--d) 0 rgba(255,255,255,.4),inset 0 calc(-1*var(--d)) 0 rgba(0,0,0,.22),0 0 0 var(--d) #2a140c}
.ccd-acts button:hover{box-shadow:inset 0 var(--d) 0 rgba(255,255,255,.4),0 0 0 var(--d) ${GOLD}}
.ccd-hint{font-size:calc(8*var(--d));opacity:.7;margin-top:calc(2*var(--d));color:${SALT}}
`;

export class CodeCard {
  constructor(game) {
    this.game = game; this.root = null; this.timer = 0;
    game.events?.on('track.share', () => { const code = game.trackEditor?.codeOf?.(); if (code) this.show(code, { name: game.trackEditor?.slots?.[game.trackEditor.slot]?.name }); });
  }
  build() {
    if (this.root || typeof document === 'undefined') return;
    const st = document.createElement('style'); st.setAttribute('data-combcode', ''); st.textContent = CSS; document.head.appendChild(st);
    const root = (this.root = document.createElement('div')); root.className = 'ccd clay'; root.style.setProperty('--d', `${dot()}px`);
    this.frame = brineFrame(root, { tab: 'CODE' });
    const f = this.frame.body, el = (tag, cls) => { const e = document.createElement(tag); e.className = cls; f.append(e); return e; };
    this.head = el('div', 'ccd-head'); this.name = el('div', 'ccd-name'); this.art = el('div', 'ccd-art'); this.code = el('div', 'ccd-code'); this.hint = el('div', 'ccd-hint');
    const acts = el('div', 'ccd-acts');
    for (const [label, run] of [['COPY', () => navigator.clipboard?.writeText?.(this.text).catch?.(() => {})], ['CLOSE', () => this.hide()]]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', (e) => { e.stopPropagation(); run(); }); acts.append(b); }
    for (const ev of ['mousedown', 'pointerdown', 'touchstart']) root.addEventListener(ev, (e) => e.stopPropagation());
    document.body.appendChild(root);
    addEventListener('resize', () => { root.style.setProperty('--d', `${dot()}px`); this.frame.layout(); if (this.text) this.draw(); });
  }
  /** The card for `text` (one of our codes): its QR code and its Comb, its words. */
  show(text, { name = '' } = {}) {
    this.build(); if (!this.root) return;
    this.text = String(text || ''); this.nameText = name || '';
    const own = /^FFS-/i.test(this.text) ? 'spirit' : 'track';
    this.head.textContent = WORD[own]; this.name.textContent = this.nameText;
    this.code.textContent = this.text.length > 44 ? `${this.text.slice(0, 22)}…${this.text.slice(-14)}` : this.text;
    this.draw(); this.root.classList.add('on'); this.frame.layout();
    clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), COMB_CODE.stand * 1000); // (real seconds, on the page's clock: it may stand over a paused world)
  }
  draw() {
    const d = dot(), dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, Q = qrMatrix(this.text, { ecl: this.text.length > 1200 ? 'L' : 'M' }), side = Math.round(150 * d);
    this.art.replaceChildren();
    if (Q) { // (the code itself: whole device pixels a module, so it stays crisp and readable)
      const n = Q.size + COMB_CODE.quiet * 2, px = Math.max(1, Math.floor((side * dpr) / n)), cv = document.createElement('canvas'); cv.width = cv.height = n * px;
      const x = cv.getContext('2d'); x.fillStyle = COMB_CODE.washi; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = COMB_CODE.sumi;
      for (let j = 0; j < Q.size; j++) for (let i = 0; i < Q.size; i++) if (Q.at(i, j)) x.fillRect((i + COMB_CODE.quiet) * px, (j + COMB_CODE.quiet) * px, px, px);
      cv.style.width = cv.style.height = `${(n * px) / dpr}px`; this.art.append(cv);
    }
    const cs = Math.round(side * 0.82), cv = document.createElement('canvas'); cv.width = cv.height = Math.round(cs * dpr); cv.style.width = cv.style.height = `${cs}px`; cv.style.alignSelf = 'center';
    const x = cv.getContext('2d'); x.scale(dpr, dpr); drawCombCode(x, this.text, { size: cs }); this.art.append(cv);
    this.hint.textContent = Q ? 'A phone\'s scanner reads it off the screen.' : 'Too long for one code: COPY it instead.'; // (plain words, Espada's to rule)
  }
  hide() { this.root?.classList.remove('on'); clearTimeout(this.timer); }
}
