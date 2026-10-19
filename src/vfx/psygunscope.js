// ---------------------------------------------------------------------------------------
// THE SCOPE'S LENS RING: the Carbine's scope raised (OVERLAY.md 19; Calissa's board v10, figure 01, ruled), the lens the world is seen
// through at 2.5x (the view's own narrowing is the player's: `player.scopeZoom`, tools/psygun/variantplay.js). Drawn in the overlay's
// scene (render/overlayscene.js) at the 480-line present; no pass of its own, no program of its own (the overlay's `flat` kind).
//   THE GROWTH    the lens grows from small to whole with the sights' ease, landing with an overshoot (Disney's follow-through)
//   THE HOUSING   brass, knurled round its outer band, an engraved scale in the System's light on its bezel, two turrets standing out of
//                 it (top and right): a made object, a toy's proportions (Ratchet & Clank's sniper: big, readable, a little silly)
//   THE GLASS     inside, the edge falling to black as a real scope's does, a soft glare upper left, the rim walking the schiller; the
//                 world outside the lens darkened (the hip view, kept so the room stays present)
//   THE RETICLE   fine labradorite lines from the rim, heavy posts at three, six and nine o'clock, two drop ticks, a diamond at the
//                 heart and a faint home ring (24 dots)
//   THE BREATH    an arc on the lens's left: full while you breathe, draining while Shift holds it (`play.breath`, 3 real s), refilling
//   THE FULL DRAW a ring closing from the rim onto the home ring as the charge winds (1.6x as long, kinds.js `play.fullDraw`), three gaps
//                 turning slower as it tightens; at full it locks, solid white, and x2.5 (its damage) stands beside it; let go, it bursts out
//
// Prior art: Ratchet & Clank's sniper scopes (the housing as a toy), Call of Duty's held breath and its scope's black edge, Sniper Elite's
// steadied sway, Splatoon's charger (the ring closing to full), the mil-dot reticle's posts and drop ticks; the mock (scratchpad
// r10-psyguns, cbScene's lens).
//
//   const S = new PsygunScope(game)   game.psygunScope   (main.js, beside the reticle; it registers itself with game.overlayScene)
//   S.state { shown, u, breath, draw }   (a probe's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { FONT } from '../ui/theme.js';

const TAU = Math.PI * 2;
const R1 = 206, HB = 24, TUR = 34; // (the lens's radius whole, its brass band, the turrets past it: dots of the present)
const D = 2 * (R1 + HB + TUR) + 8; // (the canvas, in dots)
const INK = '#17111f', PALE = '#f4ecff', COUNT_FONT = `'Jersey 15', ${FONT.sys}`;
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
const film = (s, a = 1) => { s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, m = f * f * (3 - 2 * f), A = FILM[i], B = FILM[(i + 1) % 4]; return `rgba(${A.map((v, k) => Math.round(v + (B[k] - v) * m)).join(',')},${a})`; };
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const eob = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const eioc = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export class PsygunScope {
  constructor(game) {
    this.game = game; this.S = game.overlayScene;
    this.state = { shown: false, u: 0, breath: 1, draw: 0 };
    this.clock = 0; this.lastBreath = 1; this.holding = false; this.prevDraw = 0; this.lockT = -1; this.burstT = 9;
    if (!this.S) return;
    this.c = document.createElement('canvas'); this.c.width = this.c.height = D; this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.generateMipmaps = false; this.tex.minFilter = THREE.LinearFilter;
    this.lens = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.tex, depthTest: false, depthWrite: false })); this.lens.renderOrder = 11;
    this.dark = new THREE.Mesh(new THREE.RingGeometry(0.995, 40, 72, 1), overlayFlat({ color: 0x0d0a12, opacity: 0.6, depthTest: false, depthWrite: false })); this.dark.renderOrder = 10; // (the world outside the lens, darkened)
    this.root = new THREE.Group(); this.root.name = 'psygunScope'; this.root.add(this.dark, this.lens);
    for (const m of [this.lens, this.dark]) m.frustumCulled = false;
    this.slot = this.S.add(this.root, { anchor: 'c', hud: true, update: (dt, slot) => this.update(dt, slot) });
  }

  /** The scope's ease (0 down, 1 raised): the Carbine's sights. */
  ease() {
    const g = this.game, W = g.weapon, P = g.shells?.gun?.play;
    if (!W || !P?.scope || g.title?.active || g.god?.controlling || !W.drawn) return 0;
    const B = document.body.classList; if (B.contains('cine') || B.contains('aboard') || B.contains('bztable-seated')) return 0;
    return cl(W.adsEase ?? 0);
  }

  update(dt, slot) {
    this.clock += dt;
    const u = this.ease(), W = this.game.weapon, V = W?.play;
    this.state.u = u; this.state.shown = u > 0.02;
    if (!this.state.shown) { this.root.userData.overlayHidden = true; this.prevDraw = 0; this.lockT = -1; return; }
    this.root.userData.overlayHidden = false;
    const breath = V?.breath ?? 1; this.holding = breath < this.lastBreath - 1e-5; this.lastBreath = breath; this.state.breath = breath;
    const draw = V?.P?.fullDraw ? W.charge ?? 0 : 0; this.state.draw = draw;
    if (draw >= 1 && this.prevDraw < 1) this.lockT = 0; else if (draw >= 1) this.lockT += dt; else if (draw <= 0) this.lockT = -1;
    if (this.prevDraw > 0.25 && draw === 0) this.burstT = 0; else this.burstT += dt;
    this.prevDraw = draw;
    const H = slot.view.h || innerHeight, lp = H / 480, e = eob(cl(u / 0.85)), R = lerp(14, R1, e);
    this.lens.scale.set(D * lp, D * lp, 1); this.lens.position.set(0, 0, 250);
    const outer = (R + HB * e) * lp; this.dark.scale.set(outer, outer, 1); this.dark.position.set(0, 0, 240); this.dark.material.opacity = 0.62 * cl(u * 1.4);
    this.draw(R, e, draw);
    this.tex.needsUpdate = true;
  }

  draw(R, e, draw) {
    const x = this.x, T = this.clock, c = D / 2, col = film(T * 0.06), cc = film(T * 0.06 + 0.35);
    x.clearRect(0, 0, D, D); x.save();
    const seg = (ax, ay, bx, by) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); };
    const kstroke = (w, colr) => { x.lineWidth = w + 2; x.strokeStyle = INK; x.stroke(); x.lineWidth = w; x.strokeStyle = colr; x.stroke(); };
    // the glass: the edge falling to black, a soft glare upper left
    x.save(); x.beginPath(); x.arc(c, c, R, 0, TAU); x.clip();
    let g = x.createRadialGradient(c, c, R * 0.62, c, c, R); g.addColorStop(0, 'rgba(8,5,12,0)'); g.addColorStop(0.75, 'rgba(8,5,12,.35)'); g.addColorStop(1, 'rgba(8,5,12,.92)');
    x.fillStyle = g; x.fillRect(0, 0, D, D);
    x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.ellipse(c - R * 0.38, c - R * 0.5, R * 0.42, R * 0.16, -0.6, 0, TAU); x.fill();
    if (R > 40) {
      // the reticle: fine lines from the rim, heavy posts at three, six and nine, drop ticks, the diamond, the home ring
      x.lineCap = 'butt'; const p = Math.round(c) + 0.5;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        seg(p + dx * 12, p + dy * 12, p + dx * (R - 2), p + dy * (R - 2)); kstroke(1, col);
        if (dy !== -1) { seg(p + dx * R * 0.56, p + dy * R * 0.56, p + dx * (R - 2), p + dy * (R - 2)); kstroke(3, cc); }
      }
      for (const yy of [34, 50]) { seg(p - 4, p + yy, p + 4, p + yy); kstroke(1, col); }
      x.beginPath(); x.moveTo(p, p - 4); x.lineTo(p + 4, p); x.lineTo(p, p + 4); x.lineTo(p - 4, p); x.closePath(); kstroke(1, PALE);
      x.globalAlpha = 0.55; x.beginPath(); x.arc(p, p, 24, 0, TAU); kstroke(1, cc); x.globalAlpha = 1;
      // the full draw: the ring closing from the rim, three gaps turning slower as it tightens; locked, solid white and x2.5; let go, it bursts out
      const bt = this.burstT;
      if (draw > 0 || bt < 0.35) {
        const rr = bt < 0.35 ? 24 + bt * 700 : lerp(R * 0.86, 24, eioc(cl(draw))), a = bt < 0.35 ? 1 - bt / 0.35 : 1;
        x.globalAlpha = a;
        if (draw < 1 && bt >= 0.35) { const rot = T * 2.2 * (1 - draw * 0.7); for (let s = 0; s < 3; s++) { x.beginPath(); x.arc(p, p, rr, rot + (s * TAU) / 3 + 0.16, rot + ((s + 1) * TAU) / 3 - 0.16); kstroke(2, film(T * 0.06 + 0.2 + s * 0.1)); } }
        else {
          const lu = Math.max(0, this.lockT); x.beginPath(); x.arc(p, p, rr, 0, TAU); kstroke(2 + 2 * Math.exp(-lu / 0.08), '#fff6e2');
          if (draw >= 1) {
            x.globalAlpha = 0.5 * Math.exp(-lu / 0.25); x.beginPath(); x.arc(p, p, rr + 3 + 30 * (1 - Math.exp(-lu / 0.12)), 0, TAU); kstroke(1, film(T * 0.06 + 0.6));
            const mult = this.game.shells?.gun?.play?.fullDraw?.dmgMult ?? 2.5;
            x.globalAlpha = cl(lu / 0.12); x.font = `16px ${COUNT_FONT}`; x.textAlign = 'left'; x.textBaseline = 'middle';
            x.lineWidth = 3; x.strokeStyle = INK; x.lineJoin = 'round'; x.strokeText(`×${mult}`, p + rr + 8, p - rr + 2); x.fillStyle = '#fff6e2'; x.fillText(`×${mult}`, p + rr + 8, p - rr + 2);
          }
        }
        x.globalAlpha = 1;
      }
      // the breath: an arc on the lens's left, draining while it is held, refilling after
      const a0 = Math.PI - 0.62, a1 = Math.PI + 0.62, rb = R - 13; x.lineCap = 'round';
      x.strokeStyle = 'rgba(23,17,31,.8)'; x.lineWidth = 6; x.beginPath(); x.arc(c, c, rb, a0, a1); x.stroke();
      x.strokeStyle = this.holding ? film(T * 0.06 + 0.15, 0.95) : 'rgba(207,232,255,.75)'; x.lineWidth = 3; x.beginPath(); x.arc(c, c, rb, a1 - (a1 - a0) * cl(this.state.breath), a1); x.stroke();
      for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4); x.fillStyle = INK; x.fillRect(c + Math.cos(a) * rb - 1, c + Math.sin(a) * rb - 1, 2, 2); }
    }
    x.restore();
    // the glass's rim walks the schiller; the housing: brass, knurled, an engraved scale, two turrets
    for (let i = 0; i < 72; i++) { x.strokeStyle = film(i / 36 + T * 0.05, 0.7); x.lineWidth = 2; x.beginPath(); x.arc(c, c, R - 1, (i / 72) * TAU, ((i + 1) / 72) * TAU + 0.01); x.stroke(); }
    const H = HB * e;
    g = x.createRadialGradient(c, c, R, c, c, R + H); g.addColorStop(0, '#3a2a12'); g.addColorStop(0.12, '#c9a04a'); g.addColorStop(0.45, '#f0d088'); g.addColorStop(0.8, '#8a6420'); g.addColorStop(1, '#2a1c0c');
    x.fillStyle = g; x.beginPath(); x.arc(c, c, R + H, 0, TAU); x.arc(c, c, R, 0, TAU, true); x.fill();
    if (H > 4) {
      x.strokeStyle = 'rgba(42,28,12,.55)'; x.lineWidth = 1;
      for (let i = 0; i < 120; i++) { const a = (i * TAU) / 120; seg(c + Math.cos(a) * (R + H * 0.62), c + Math.sin(a) * (R + H * 0.62), c + Math.cos(a) * (R + H * 0.95), c + Math.sin(a) * (R + H * 0.95)); x.stroke(); }
      for (let i = 0; i < 36; i++) { const a = (i * TAU) / 36, l = i % 3 ? 0.26 : 0.38; x.strokeStyle = film(i / 36 + T * 0.04, 0.85); seg(c + Math.cos(a) * (R + H * 0.12), c + Math.sin(a) * (R + H * 0.12), c + Math.cos(a) * (R + H * l), c + Math.sin(a) * (R + H * l)); x.stroke(); }
      for (const [top, w, h] of [[true, 30, 14], [false, 14, 30]]) { // (the turrets: elevation on top, windage on the right)
        const qx = top ? c : c + R + H + w / 2 - 2, qy = top ? c - (R + H + h / 2 - 2) : c;
        const gg = x.createLinearGradient(qx - w / 2, qy, qx + w / 2, qy); gg.addColorStop(0, '#6a4a18'); gg.addColorStop(0.4, '#f0d088'); gg.addColorStop(1, '#5a3c10');
        x.fillStyle = gg; x.fillRect(qx - w / 2, qy - h / 2, w, h); x.strokeStyle = INK; x.lineWidth = 1; x.strokeRect(qx - w / 2 + 0.5, qy - h / 2 + 0.5, w - 1, h - 1);
        x.strokeStyle = 'rgba(42,28,12,.6)';
        for (let q = 3; q < (w > h ? w : h) - 2; q += 3) { if (w > h) seg(qx - w / 2 + q, qy - h / 2 + 2, qx - w / 2 + q, qy + h / 2 - 2); else seg(qx - w / 2 + 2, qy - h / 2 + q, qx + w / 2 - 2, qy - h / 2 + q); x.stroke(); }
      }
    }
    x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath(); x.arc(c, c, R + H, 0, TAU); x.stroke();
    x.restore();
  }
}
