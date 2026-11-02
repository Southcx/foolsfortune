// ---------------------------------------------------------------------------------------
// THE PILOT'S READOUT (docs/plans/MECHS.md 4.4, 8.2 item 5): what is, while the Pneuka Jar is sealed in a piloted mech, as an entry plug's
// HUD in the Clay dress (a Brine frame under the Clay, ui/brineframe.js and ui/goalswindow.js clayDress; the labradorite keylines, the
// counts face). It draws the state readout.js reads (world/hangar/readout.js) and never narrates (the log says a cable plugged, a region
// broken, berserk begun: Dovina's rules). DOM, CSS and two small canvases; 0 shader programs. Its classes are `mkp-*` on the `mk-readout` host.
//   SYNC      a 270-degree ratio dial: the sync's arc in the film's colours, the ceiling (your mental state's calm) a gold tick, the berserk
//             line an ember tick, the percent large in its middle (Evangelion's synchronisation ratio)
//   BATTERY   the internal battery's countdown in Nixie tubes, M:SS and its hundredths (Eva's 5:00 clock), its segments under it; ember and
//             blinking under ENERGY.low; on the cable EXTERNAL lights and the tubes say FILLING
//   CABLE     the umbilical's plug: CABLE lit in the film's cyan, OFF CABLE dark with its plug hanging free
//   THE DOLL  the frame seen from behind (Front Mission's part damage doll): the six regions each tinted by its crack (celadon whole, amber,
//             ember), a crack stroke a third; a broken region flashing with its cross and BROKE under the doll
//   BERSERK   the whole panel run ember, the dial gone red, BERSERK stamped over it, its seconds left
//   THE GIANT when near: its state word (WAITING, AWAKE, DOWN and its seconds), the barrier as a bar of hexes in the film (DOWN and its
//             seconds once pressed open), the stagger as a gold bar, ember while staggered
//   WHERE     the desk: bottom right, left of the Lachrimeter's tube. Touch on its side: the bottom band, right of the tube in the bottom-left
//             corner and left of the arc (the right thumb's corner, progress/toucharc.js), sized down to fit; upright, under the log's ticker.
//
// Prior art: Neon Genesis Evangelion's entry-plug displays (the sync ratio, INTERNAL / EXTERNAL and the battery's 5:00 countdown, the
// umbilical's state), Armored Core's AP and EN gauges, Front Mission's part damage doll, the house's in-play readouts (ui/railreadout.js,
// ui/jarplate.js) and the Lachrimeter's Nixie cube plate.
//
//   const V = new PilotReadout(game)   V.draw(state)   V.hide()   PILOT_READOUT (the numbers)
//   state { sync, ceiling, berserkAt, berserk, battery, capacity, low, net, left, cable, regions: [{ id, k, broke }], giant: null | { word, barrier, barrierDown, stagger, staggered } }
// ---------------------------------------------------------------------------------------
import { brineFrame, dot, GOLD, SALT, INK, FILM, LACHRYMA_TINT, COUNT_FACE } from '../brineframe.js';
import { clayDress } from '../goalswindow.js';
import { FONT } from '../theme.js';
import { ARC_CELLS, TOUCH_ARC, arcRect } from '../../progress/toucharc.js';

/** The numbers: the panel's size in dots (its body, for the fit), the dot on the desk (x the present's), the most and least on touch, the
 *  tallest it stands in the bottom band (CSS px), the dial and the doll (dots), the battery's segments, the colours. */
export const PILOT_READOUT = {
  w: 244, wNoGiant: 176, h: 62, deskDot: 0.85, touchDot: [0.9, 1.4], band: 96, gap: 8, dial: 46, doll: [26, 40], segs: 12,
  ember: '#ff5a3a', amber: '#f2b82e', celadon: '#9fd1b0', nixie: '#ffb05a', dark: '#1c0d08',
};
const P = PILOT_READOUT;

const CSS = `
.mk-readout.mkp{position:fixed;z-index:3;pointer-events:none;opacity:0;transition:opacity .25s}
.mk-readout.mkp.on{opacity:1}
${clayDress('.mk-readout.mkp.clay')}
.mkp .bf-body{padding:calc(5*var(--d)) calc(6*var(--d)) calc(5*var(--d))}
.mkp-row{display:flex;align-items:stretch;gap:calc(5*var(--d))}
.mkp-dial,.mkp-doll{display:block;flex:none}
.mkp-col{display:flex;flex-direction:column;justify-content:space-between;gap:calc(2*var(--d))}
.mkp-bat{width:calc(72*var(--d))}
.mkp-lab{display:flex;justify-content:space-between;gap:calc(3*var(--d));font:400 calc(7*var(--d))/1 ${FONT.sys};letter-spacing:.08em;color:${SALT};opacity:.55}
.mkp-lab b{font-weight:700}.mkp-lab .on{opacity:1;color:${LACHRYMA_TINT};text-shadow:0 0 calc(2*var(--d)) ${LACHRYMA_TINT}}
.mkp-lab .lit{opacity:1;color:${P.nixie}}
.mkp-nix{display:flex;align-items:flex-end;gap:calc(1*var(--d))}
.mkp-tube{width:calc(10*var(--d));height:calc(17*var(--d));display:flex;align-items:center;justify-content:center;border-radius:calc(4*var(--d)) calc(4*var(--d)) calc(2*var(--d)) calc(2*var(--d));
  background:radial-gradient(80% 60% at 50% 40%,rgba(255,150,70,.12),transparent 70%),linear-gradient(180deg,#2b1a14,#120a07);
  box-shadow:inset 0 0 0 calc(.5*var(--d)) rgba(255,220,180,.18),inset 0 calc(1*var(--d)) 0 rgba(255,240,220,.12),0 0 0 calc(.5*var(--d)) ${INK};
  font:400 calc(16*var(--d))/1 ${COUNT_FACE};color:${P.nixie};text-shadow:0 0 calc(2*var(--d)) #ff7a2a,0 0 calc(5*var(--d)) rgba(255,122,42,.6)}
.mkp-tube.sep{width:calc(4*var(--d));background:none;box-shadow:none}
.mkp-tube.cs{width:calc(7*var(--d));height:calc(11*var(--d));font-size:calc(10*var(--d))}
.mkp-nix.word .mkp-tube{width:auto;padding:0 calc(3*var(--d));font-size:calc(11*var(--d));letter-spacing:.08em}
.mkp-nix.fill .mkp-tube{color:${LACHRYMA_TINT};text-shadow:0 0 calc(2*var(--d)) ${LACHRYMA_TINT},0 0 calc(5*var(--d)) rgba(127,220,255,.5)}
.mkp-nix.low .mkp-tube{color:${P.ember};text-shadow:0 0 calc(2*var(--d)) ${P.ember},0 0 calc(6*var(--d)) rgba(255,70,40,.7);animation:mkp-blink .5s steps(2) infinite}
@keyframes mkp-blink{50%{opacity:.35}}
.mkp-seg{display:flex;gap:calc(.6*var(--d));height:calc(4*var(--d))}
.mkp-seg i{flex:1;background:rgba(10,6,4,.7);box-shadow:inset 0 0 0 calc(.5*var(--d)) rgba(255,220,180,.15)}
.mkp-seg i.on{background:linear-gradient(180deg,#ffe0a8,${P.nixie});box-shadow:0 0 calc(2*var(--d)) rgba(255,160,80,.6)}
.mkp-seg.low i.on{background:${P.ember};box-shadow:0 0 calc(2*var(--d)) ${P.ember}}
.mkp-seg.fill i.on{background:linear-gradient(180deg,#d8f6ff,${LACHRYMA_TINT})}
.mkp-cab{display:flex;align-items:center;gap:calc(2*var(--d));font:700 calc(8*var(--d))/1 ${FONT.sys};letter-spacing:.12em}
.mkp-cab canvas{width:calc(14*var(--d));height:calc(8*var(--d))}
.mkp-cab.on{color:${LACHRYMA_TINT};text-shadow:0 0 calc(2*var(--d)) rgba(127,220,255,.6)}.mkp-cab.off{color:${P.ember};opacity:.9}
.mkp-dollcol{align-items:center}
.mkp-broke{font:700 calc(7*var(--d))/1 ${FONT.sys};letter-spacing:.12em;color:${P.ember};min-height:calc(7*var(--d));text-align:center}
.mkp-broke:not(:empty){animation:mkp-blink .4s steps(2) infinite}
.mkp-giant{width:calc(62*var(--d));padding-left:calc(5*var(--d));border-left:calc(.5*var(--d)) solid rgba(30,12,6,.6);box-shadow:inset calc(.5*var(--d)) 0 0 rgba(255,226,196,.1)}
.mkp-giant[hidden]{display:none}
.mkp-gw{font:400 calc(13*var(--d))/1 ${COUNT_FACE};color:${SALT};letter-spacing:.06em}
.mkp-gw.awake{color:${P.amber}}.mkp-gw.down{color:${GOLD}}
.mkp-bar{position:relative;height:calc(6*var(--d));background:rgba(10,6,4,.7);box-shadow:inset 0 0 0 calc(.5*var(--d)) rgba(255,220,180,.15),0 0 0 calc(.5*var(--d)) ${INK}}
.mkp-bar i{position:absolute;left:0;top:0;bottom:0;width:0;transition:width .1s}
.mkp-bar.hex i{background:
  radial-gradient(circle at 50% 50%,transparent 45%,rgba(23,17,31,.55) 47% 55%,transparent 57%) 0 0/calc(4*var(--d)) calc(4*var(--d)),
  linear-gradient(90deg,${FILM.join(',')});background-size:calc(4*var(--d)) calc(4*var(--d)),100% 100%;box-shadow:0 0 calc(3*var(--d)) rgba(10,140,191,.5)}
.mkp-bar.st i{background:linear-gradient(180deg,#fff0c0,${GOLD})}
.mkp-bar.st.hot i{background:${P.ember};animation:mkp-blink .4s steps(2) infinite}
.mkp-bar.down{box-shadow:inset 0 0 0 calc(.5*var(--d)) ${GOLD},0 0 0 calc(.5*var(--d)) ${INK}}
.mkp-stamp{position:absolute;left:calc(-2*var(--d));right:calc(-2*var(--d));top:50%;transform:translateY(-50%) rotate(-4deg);text-align:center;display:none;padding:calc(2*var(--d)) 0;
  background:linear-gradient(180deg,transparent,rgba(120,10,0,.85) 20% 80%,transparent);
  font:400 calc(22*var(--d))/1 ${COUNT_FACE};letter-spacing:.18em;color:#fff2e0;text-shadow:0 0 calc(3*var(--d)) ${P.ember},0 0 calc(8*var(--d)) ${P.ember}}
.mkp.berserk .mkp-stamp{display:block;animation:mkp-throb .6s ease-in-out infinite alternate}
.mkp.berserk .bf-body{background:radial-gradient(120% 140% at 50% 50%,rgba(255,60,30,.25),rgba(120,10,0,.55)),linear-gradient(180deg,#7a2a1a,#3e0e08);
  box-shadow:inset 0 0 calc(8*var(--d)) rgba(255,70,30,.8)}
.mkp.berserk .mkp-row{filter:sepia(.6) saturate(2.2) hue-rotate(-25deg)}
@keyframes mkp-throb{from{opacity:.75;transform:translateY(-50%) rotate(-4deg) scale(.98)}to{opacity:1;transform:translateY(-50%) rotate(-4deg) scale(1.04)}}
`;
let styled = false;
function style() { if (styled || typeof document === 'undefined') return; styled = true; const s = document.createElement('style'); s.setAttribute('data-pilotreadout', ''); s.textContent = CSS; document.head.appendChild(s); }

const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const lerpC = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
/** A region's tint by its crack: celadon whole, amber at half, ember near broken. */
const crackTint = (k) => (k < 0.5 ? lerpC(P.celadon, P.amber, k / 0.5) : lerpC(P.amber, P.ember, Math.min(1, (k - 0.5) / 0.5)));

/** The doll's regions, seen from behind in a 26 x 40 dot box: [x, y, w, h, round] each (dots); `back` drawn over the core. */
const DOLL = {
  head: [[9, 1, 8, 7, 2]], core: [[6, 9, 14, 13, 2]], back: [[8, 10, 4, 8, 1], [14, 10, 4, 8, 1]],
  armL: [[0, 9, 5, 15, 2]], armR: [[21, 9, 5, 15, 2]], legs: [[6, 23, 6, 16, 1], [14, 23, 6, 16, 1]],
};
const ORDER = ['legs', 'armL', 'armR', 'core', 'back', 'head'];

export class PilotReadout {
  constructor(game) { this.game = game; this.el = null; this.last = ''; this.flash = 0; }

  ensure() {
    if (this.el || typeof document === 'undefined') return;
    style();
    const el = (this.el = mk('div', 'mk-readout mkp clay')), F = brineFrame(el, { tab: 'MECH' }), b = F.body; this.frame = F;
    const row = mk('div', 'mkp-row'); b.appendChild(row);
    this.dial = mk('canvas', 'mkp-dial'); row.appendChild(this.dial);
    const bat = mk('div', 'mkp-col mkp-bat'); row.appendChild(bat);
    this.src = mk('div', 'mkp-lab'); this.src.innerHTML = '<span class="i">INTERNAL</span><span class="e">EXTERNAL</span>';
    this.nix = mk('div', 'mkp-nix'); this.seg = mk('div', 'mkp-seg'); for (let i = 0; i < P.segs; i++) this.seg.appendChild(mk('i'));
    this.cab = mk('div', 'mkp-cab'); this.plug = mk('canvas'); this.cabWord = mk('span'); this.cab.append(this.plug, this.cabWord);
    bat.append(this.src, this.nix, this.seg, this.cab);
    const dc = mk('div', 'mkp-col mkp-dollcol'); row.appendChild(dc);
    this.doll = mk('canvas', 'mkp-doll'); this.broke = mk('div', 'mkp-broke'); dc.append(this.doll, this.broke);
    const gi = (this.gcol = mk('div', 'mkp-col mkp-giant')); row.appendChild(gi);
    this.gword = mk('div', 'mkp-gw');
    const bar = (cls) => { const o = mk('div', `mkp-bar ${cls}`); o.appendChild(mk('i')); return o; };
    this.glab1 = mk('div', 'mkp-lab'); this.gbar = bar('hex'); this.glab2 = mk('div', 'mkp-lab'); this.sbar = bar('st');
    gi.append(mk('div', 'mkp-lab', 'GIANT'), this.gword, this.glab1, this.gbar, this.glab2, this.sbar);
    this.stamp = mk('div', 'mkp-stamp', 'BERSERK'); b.appendChild(this.stamp);
    document.body.appendChild(el);
  }

  hide() { if (this.el) this.el.classList.remove('on'); }

  /** Where it stands and its dot, every draw (cheap): see the header's WHERE. */
  place(wide) {
    const g = this.game, L = g.hudLayout, el = this.el, W = (wide ? P.w : P.wNoGiant) + 12, H = P.h + 10; // (the body and its padding, dots)
    let d = dot() * P.deskDot, css = { right: `${(g.lachrimeterTube?.pubW || 122) + P.gap}px`, bottom: '12px', left: 'auto', top: 'auto' };
    if (L?.touch && !L.portrait) {
      const S = L.safe, safe = { right: L.view.w - S.r, bottom: L.view.h - S.b };
      const arcX = Math.min(...Object.keys(ARC_CELLS).filter((k) => TOUCH_ARC.mech[k]).map((k) => arcRect(k, safe).x));
      const tube = L.place('lachrimeterTube'), x0 = tube ? tube.x + tube.w + P.gap : L.bounds.x, room = arcX - P.gap - x0;
      d = Math.max(P.touchDot[0], Math.min(P.touchDot[1], room / W, P.band / H));
      const real = el.getBoundingClientRect().width, d0 = +el.dataset.d || 0, wd = real > 0 && d0 ? real / d0 : W; // (its width in dots as last measured)
      d = Math.min(d, room / wd); // (never past the room: the arc's corner stays the thumb's)
      css = { left: `${Math.round(x0 + Math.max(0, (room - wd * d) / 2))}px`, bottom: `${Math.round(L.view.h - L.bounds.y - L.bounds.h)}px`, right: 'auto', top: 'auto' };
    } else if (L?.touch) {
      d = P.touchDot[0];
      css = { left: 'var(--hud-log-x,12px)', top: 'calc(var(--hud-log-y,60px) + var(--hud-log-h,36px) + 24px)', right: 'auto', bottom: 'auto' };
    }
    el.style.setProperty('--d', `${d.toFixed(3)}px`); el.dataset.d = d.toFixed(3); Object.assign(el.style, css);
    return d;
  }

  draw(s) {
    this.ensure(); if (!this.el) return;
    const el = this.el; el.classList.add('on');
    const d = this.place(!!s.giant), dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    el.classList.toggle('berserk', s.berserk > 0);
    this.stamp.textContent = s.berserk > 0 ? `BERSERK ${Math.ceil(s.berserk)}` : 'BERSERK';
    this.flash = (this.flash + 1) % 4;
    this.drawDial(s, d, dpr);
    // the battery: INTERNAL or EXTERNAL lit, the tubes' count (or FILLING), its segments, the plug
    const [li, le] = this.src.children; li.className = s.cable ? '' : 'lit'; le.className = s.cable ? 'on' : '';
    const fill = s.net <= 0 && s.cable, frac = s.capacity > 0 ? s.battery / s.capacity : 0;
    const key = fill ? 'FILL' : Number.isFinite(s.left) ? clock(s.left) : '--:--';
    if (key !== this.last) {
      this.last = key; this.nix.replaceChildren();
      if (fill) { this.nix.className = 'mkp-nix word fill'; this.nix.appendChild(mk('div', 'mkp-tube', 'FILLING')); }
      else {
        this.nix.className = 'mkp-nix';
        const [mm, cs] = key.split('.');
        for (const ch of mm) this.nix.appendChild(mk('div', `mkp-tube${ch === ':' ? ' sep' : ''}`, ch));
        if (cs) for (const ch of cs) this.nix.appendChild(mk('div', 'mkp-tube cs', ch));
      }
    }
    this.nix.classList.toggle('low', !fill && s.low);
    const lit = Math.ceil(frac * P.segs - 1e-6);
    [...this.seg.children].forEach((e, i) => e.classList.toggle('on', i < lit));
    this.seg.className = `mkp-seg${fill ? ' fill' : s.low ? ' low' : ''}`;
    this.cab.className = `mkp-cab ${s.cable ? 'on' : 'off'}`; this.cabWord.textContent = s.cable ? 'CABLE' : 'OFF CABLE';
    this.drawPlug(s.cable, d, dpr);
    this.drawDoll(s.regions, d, dpr);
    const broke = s.regions.filter((r) => r.broke).map((r) => r.id);
    this.broke.textContent = broke.length ? `${broke.length > 1 ? `${broke.length} ` : ''}BROKE` : '';
    // the giant's line
    const G = s.giant; this.gcol.hidden = !G;
    if (G) {
      this.gword.textContent = G.word; this.gword.className = `mkp-gw ${/^DOWN/.test(G.word) ? 'down' : G.word === 'AWAKE' ? 'awake' : ''}`;
      this.glab1.innerHTML = `<b>BARRIER</b><span>${G.barrierDown > 0 ? `DOWN ${Math.ceil(G.barrierDown)}` : `${Math.round(G.barrier * 100)}`}</span>`;
      this.gbar.firstChild.style.width = `${Math.round(G.barrier * 100)}%`; this.gbar.classList.toggle('down', G.barrierDown > 0);
      this.glab2.innerHTML = `<b>STAGGER</b><span>${G.staggered ? 'STAGGERED' : Math.round(G.stagger * 100)}</span>`;
      this.sbar.firstChild.style.width = `${Math.round((G.staggered ? 1 : G.stagger) * 100)}%`; this.sbar.classList.toggle('hot', !!G.staggered);
    }
  }

  /** A canvas sized to `w` x `h` dots at the device's pixels; its 2d context scaled to dots. */
  sized(c, w, h, d, dpr) {
    const W = Math.round(w * d * dpr), H = Math.round(h * d * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; c.style.width = `${(w * d).toFixed(1)}px`; c.style.height = `${(h * d).toFixed(1)}px`; }
    const x = c.getContext('2d'); x.setTransform(d * dpr, 0, 0, d * dpr, 0, 0); x.clearRect(0, 0, w, h); return x;
  }

  drawDial(s, d, dpr) {
    const n = P.dial, x = this.sized(this.dial, n, n, d, dpr), c = n / 2, R = n / 2 - 3, a0 = Math.PI * 0.75, span = Math.PI * 1.5;
    const at = (v) => a0 + span * Math.max(0, Math.min(1, v)), berserk = s.berserk > 0;
    x.lineCap = 'butt';
    x.lineWidth = 6; x.strokeStyle = P.dark; x.beginPath(); x.arc(c, c, R, a0, a0 + span); x.stroke(); // the trough
    x.lineWidth = 4; x.strokeStyle = 'rgba(120,80,60,.55)'; x.beginPath(); x.arc(c, c, R, a0, a0 + span); x.stroke();
    if (s.ceiling < 1) { x.strokeStyle = 'rgba(10,6,4,.85)'; x.beginPath(); x.arc(c, c, R, at(s.ceiling), a0 + span); x.stroke(); } // (past the ceiling: shut)
    const gr = x.createConicGradient ? x.createConicGradient(a0, c, c) : null;
    if (gr) FILM.concat(FILM[0]).forEach((col, i) => gr.addColorStop(Math.min(1, (i / 4) * 0.75), col));
    x.strokeStyle = berserk ? P.ember : gr || FILM[1]; x.lineWidth = 4; x.shadowColor = berserk ? P.ember : FILM[1]; x.shadowBlur = 3;
    x.beginPath(); x.arc(c, c, R, a0, at(s.sync)); x.stroke(); x.shadowBlur = 0;
    // ticks: a tenth each, the ceiling gold, the berserk line ember
    for (let i = 0; i <= 10; i++) { const a = at(i / 10), r0 = R - 4.5, r1 = R - (i % 5 ? 6 : 7.5); x.strokeStyle = 'rgba(239,230,210,.45)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); x.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); x.stroke(); }
    const tick = (v, col, w) => { const a = at(v); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(c + Math.cos(a) * (R - 3.5), c + Math.sin(a) * (R - 3.5)); x.lineTo(c + Math.cos(a) * (R + 3.5), c + Math.sin(a) * (R + 3.5)); x.stroke(); };
    tick(s.berserkAt, P.ember, 1.2); tick(s.ceiling, GOLD, 1.6);
    // the needle's head on the arc
    const a = at(s.sync); x.fillStyle = '#fff6e6'; x.beginPath(); x.arc(c + Math.cos(a) * R, c + Math.sin(a) * R, 1.6, 0, Math.PI * 2); x.fill();
    // the percent and its label
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = berserk ? '#ffd2c0' : SALT;
    x.font = `400 17px ${COUNT_FACE}`; x.fillText(`${(s.sync * 100).toFixed(1)}`, c, c + 5);
    x.font = `700 6px ${FONT.sys}`; x.globalAlpha = 0.6; x.fillText('SYNC %', c, c - 8); x.fillText('RATIO', c, c + 13); x.globalAlpha = 1;
  }

  /** The umbilical's plug: on the cable seated with its line running off; off it hanging free, a gap before its socket. */
  drawPlug(on, d, dpr) {
    const x = this.sized(this.plug, 14, 8, d, dpr), col = on ? LACHRYMA_TINT : P.ember;
    x.strokeStyle = col; x.lineWidth = 1; x.beginPath(); x.moveTo(0, on ? 4 : 6); x.bezierCurveTo(3, on ? 4 : 8, 4, on ? 4 : 1, on ? 8 : 6, 4); x.stroke();
    x.fillStyle = col; x.fillRect(on ? 8 : 6, 2, 3, 4); x.fillRect(on ? 11 : 9, 2.5, 1.5, 0.8); x.fillRect(on ? 11 : 9, 4.7, 1.5, 0.8);
    x.fillStyle = 'rgba(239,230,210,.5)'; x.fillRect(13, 1.5, 1, 5); // (the socket)
  }

  drawDoll(regions, d, dpr) {
    const [w, h] = P.doll, x = this.sized(this.doll, w, h, d, dpr), by = Object.fromEntries(regions.map((r) => [r.id, r]));
    const rr = (bx, by2, bw, bh, r) => { x.beginPath(); x.roundRect ? x.roundRect(bx, by2, bw, bh, r) : x.rect(bx, by2, bw, bh); };
    for (const id of ORDER) {
      const R = by[id] || { k: 0, broke: false };
      for (const [bx, by2, bw, bh, r] of DOLL[id] || []) {
        rr(bx, by2, bw, bh, r);
        x.fillStyle = R.broke ? (this.flash < 2 ? P.ember : P.dark) : crackTint(R.k); x.fill();
        x.lineWidth = 1; x.strokeStyle = INK; x.stroke();
        x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(bx + 1, by2 + 1, bw - 2, 1); // (the glaze's catch)
        const n = R.broke ? 0 : Math.min(3, Math.floor(R.k * 3 + 0.0001)); // (a crack stroke a third)
        x.strokeStyle = 'rgba(23,17,31,.85)'; x.lineWidth = 0.7;
        for (let i = 0; i < n; i++) { const t = (i + 1) / (n + 1); x.beginPath(); x.moveTo(bx + bw * t, by2 + 1); x.lineTo(bx + bw * (t + 0.15), by2 + bh * 0.45); x.lineTo(bx + bw * (t - 0.1), by2 + bh - 1); x.stroke(); }
        if (R.broke) { x.strokeStyle = '#fff2e0'; x.lineWidth = 1; x.beginPath(); x.moveTo(bx + 1, by2 + 1); x.lineTo(bx + bw - 1, by2 + bh - 1); x.moveTo(bx + bw - 1, by2 + 1); x.lineTo(bx + 1, by2 + bh - 1); x.stroke(); }
      }
    }
  }
}

/** Seconds as the tubes say them: M:SS and two figures of hundredths (99:59 at most). */
export const clock = (sec) => { const t = Math.max(0, Math.min(5999.99, sec)), m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t % 1) * 100); return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`; };
