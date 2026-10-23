// ---------------------------------------------------------------------------------------
// THE PSYGUN'S RETICLE: the crosshair, one for each of the five psyguns (Calissa's board v10, figure 06, ruled; OVERLAY.md 19), so the
// reticle says which gun is out before the gun does. It replaced the HUD's DOM crosshair, retired (the owner's rule: retire, not hide); the
// hitmarker stays the HUD's. Drawn in the overlay's scene (render/overlayscene.js) at the 480-line present, one
// canvas pixel a dot, in the System's labradorite light: a light shape keylined dark, one-dot lines.
//   THE PSYGUN      four ticks and a dot; the ticks open with the spread (the HUD's bloom) and with each tap; six pips round it, one lit
//                   a tap of a fanned run (taps within the fan's window, kinds.js `play.fanHammer`), the six-gun counting its six
//   THE BOMBARDIER  an open ring with a chevron dropping under it (it lobs: the real aim is the ring on the ground, vfx/lobarcmark.js);
//                   the chevron drops with each shot
//   THE CARBINE     at the hip a long T and a diamond at its heart; the full draw closes a ring on it (the charge, 1.6x as long: white at
//                   full); raised, the scope's lens has its own (vfx/psygunscope.js)
//   THE PENTAGUN    five points round a dot, each lit in its damage type's colour as its chamber fires (`play.pentacleLit`), the 4 s
//                   window draining round them; the fifth draws the pentacle through them (`psygun.pentacle`), then the circle
//   THE PEPPERBOX   the spread ring: the pellets' 12 degree cone as it falls on the screen at this field of view (`play.pellets`), the
//                   seven pellets inside it in the cylinder's pattern (six round a heart); the heart chosen, it closes to the slug's
//                   tight ring; both barrels (`psygun.barrels`) ring it out and flash the pellets
// Each but the Carbine wears the held charge (the weapon's `charge`) as an arc just outside its marks, filling from the top (the HUD's
// #charge arc, moved in); the Carbine's is its full draw's ring.
// No words, no numbers: the reticle is a world mark of the gun's own.
//
// Prior art: Ratchet & Clank's per-weapon reticles (the owner's model for the five), Halo's (each weapon's reticle its spread and its
// range), the shotgun's ring of pellets (Doom 2016), the revolver's six pips (Destiny's hand cannons), Splatoon's charger closing ring.
//
//   const R = new PsygunReticle(game)   game.psygunReticle   (main.js, after the cylinder; it registers itself with game.overlayScene
//   and listens on the bus: shot.fire, shell.fire, psygun.pentacle, psygun.barrels)   R.state { shown, kind } (a probe's)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { overlayFlat } from './lachrimetertube.js';
import { RedrawGate } from './redrawgate.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const TQ = 0.25;                // (real s: the film's slow drift steps this often; 1/66 of its cycle, no step to see)
const D = 160;                  // the canvas, in dots of the present (a square round the screen's middle)
const INK = '#17111f', PALE = '#f4ecff';
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
const film = (s, a = 1) => { s = (((s % 1) + 1) % 1) * 4; const i = Math.floor(s), f = s - i, m = f * f * (3 - 2 * f), A = FILM[i], B = FILM[(i + 1) % 4]; return `rgba(${A.map((v, k) => Math.round(v + (B[k] - v) * m)).join(',')},${a})`; };
const TYPE_COL = ['#e9c46a', '#7f9cff', '#f2a0b8', '#9ad8f0', '#c458d0']; // (the five damage types, types.js's order: the board's colours)
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const eioc = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const KIND = { 'psygun.first': 'psygun', 'psygun.bombardier': 'bombardier', 'psygun.carbine': 'carbine', 'psygun.pentagun': 'pentagun', 'psygun.pepperbox': 'pepperbox' };

export class PsygunReticle {
  constructor(game) {
    this.game = game; this.S = game.overlayScene;
    this.state = { shown: false, kind: null };
    this.clock = 0; this.fan = { run: 0, last: -9, lit: [] }; this.fireT = 9; this.flashT = 9; this.bothT = 9; this.starT = 9; this.slug = 0; this.hashKey = ''; this.gate = new RedrawGate(30);
    if (!this.S) return;
    this.c = document.createElement('canvas'); this.c.width = this.c.height = D; this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.generateMipmaps = false; this.tex.minFilter = this.tex.magFilter = THREE.NearestFilter;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), overlayFlat({ map: this.tex, depthTest: false, depthWrite: false })); this.mesh.renderOrder = 12; this.mesh.frustumCulled = false;
    this.root = new THREE.Group(); this.root.name = 'psygunReticle'; this.root.add(this.mesh);
    this.slot = this.S.add(this.root, { anchor: 'c', hud: true, update: (dt, slot) => this.update(dt, slot) });
    const on = (n, f) => game.events?.on(n, f);
    on('shot.fire', () => this.onShot());
    on('shell.fire', () => { this.fireT = 0; });
    on('psygun.pentacle', () => { this.starT = 0; });
    on('psygun.barrels', () => { this.bothT = 0; this.flashT = 0; });
  }

  get kind() { return KIND[this.game.shells?.gun?.id] || null; }
  get P() { return this.game.shells?.gun?.play || {}; }
  onShot() {
    this.fireT = 0; this.flashT = 0;
    const F = this.P.fanHammer; if (!F) return;
    if (this.clock - this.fan.last > F.window * 1.6) { this.fan.run = 0; this.fan.lit = []; } // (a pause longer than the fan's beat: the run starts over)
    this.fan.last = this.clock; this.fan.lit[this.fan.run % 6] = this.clock; this.fan.run++;
  }

  /** Shown: the psygun drawn (as the HUD's crosshair was), not looked down its sights in the first person, nor under the Carbine's lens. */
  wanted() {
    const g = this.game, W = g.weapon, P = g.player, B = document.body.classList;
    if (!W || !P || !this.kind || g.title?.active || g.god?.controlling) return false;
    if (B.contains('cine') || B.contains('aboard') || B.contains('bztable-seated')) return false;
    if (!(W.drawT > 0.05 || W.wantShell)) return false;
    if ((P.fpWeight > 0.5) && (W.adsEase ?? 0) > 0.5) return false;
    if (W.play?.scoped) return false;
    return true;
  }

  update(dt, slot) {
    this.clock += dt; this.fireT += dt; this.flashT += dt; this.bothT += dt; this.starT += dt;
    const show = this.wanted();
    this.state.shown = show; this.state.kind = show ? this.kind : null;
    if (!show) { this.root.userData.overlayHidden = true; this.gate.reset(); return; }
    this.root.userData.overlayHidden = false;
    const g = this.game, W = g.weapon, H = slot.view.h || innerHeight, lp = H / 480;
    const ads = W.adsEase ?? 0; this.mesh.material.opacity = 1 - ads * 0.3;
    this.mesh.scale.set(D * lp, D * lp, 1); this.mesh.position.set(0, 0, 300);
    const S = g.shells, heart = S?.gun?.heart != null && S.selected === S.gun.heart;
    this.slug = cl(this.slug + (heart ? dt : -dt) / 0.3);
    const fov = g.camera?.fov ?? 70, spread = W.spreadDeg?.(g.player) ?? 0;
    if (this.gate.sig(dt, this.signature(fov, spread))) { this.draw(this.kind, fov, spread); this.tex.needsUpdate = true; } // (only when the picture can differ: redrawgate.js)
  }

  /** What the draw reads, each number to what the eye can tell apart and each timer capped where its animation settles. */
  signature(fov, spread) {
    const q = (v, n) => Math.round(v * n), tq = (t, cap) => Math.floor(Math.min(t, cap) * 30), W = this.game.weapon, V = W.play, c = this.clock, F = this.fan;
    const lit = F.lit.map((t) => (t == null ? '-' : tq(c - t, 3))).join(','), pent = V?.pentacleLit || [];
    return `${this.kind}|${Math.floor(c / TQ)}|${q(fov, 10)}|${q(this.px(spread, fov), 4)}|${tq(this.fireT, 1)}|${tq(this.flashT, 0.8)}|${tq(this.bothT, 0.7)}|${tq(this.starT, 2.3)}|${q(this.slug, 100)}|${q(W.charge ?? 0, 100)}|${F.run}|${tq(c - F.last, 3)}|${lit}|${pent.join('')}|${pent.length ? q(V.clock ?? 0, 20) : 0}|${V?.points?.size || 0}`;
  }

  /** Dots across the screen's half-height for an angle off the aim (the 480-line present: 240 dots from the middle to the top). */
  px(deg, fov) { return (Math.tan(deg * DEG) / Math.tan((fov * DEG) / 2)) * 240; }

  draw(kind, fov, spread) {
    const x = this.x, T = Math.floor(this.clock / TQ) * TQ, col = film(T * 0.06), col2 = film(T * 0.06 + 0.3), c = D / 2 + 0.5;
    x.clearRect(0, 0, D, D); x.save(); x.lineCap = 'square'; x.lineJoin = 'miter';
    const seg = (ax, ay, bx, by) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); };
    const kstroke = (w, colr) => { x.lineWidth = w + 2; x.strokeStyle = INK; x.stroke(); x.lineWidth = w; x.strokeStyle = colr; x.stroke(); };
    const dot = (px, py, w, colr) => { px = Math.round(px - w / 2); py = Math.round(py - w / 2); x.fillStyle = INK; x.fillRect(px - 1, py - 1, w + 2, w + 2); x.fillStyle = colr; x.fillRect(px, py, w, w); };
    const P = this.P, W = this.game.weapon;
    let chR = 22; // (the held charge's arc: its radius, set by each reticle to sit just outside its own marks)
    if (kind === 'psygun') {
      const tap = Math.exp(-this.fireT / 0.1), g = 4 + this.px(spread, fov) + 4 * tap;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { seg(c + dx * g, c + dy * g, c + dx * (g + 6), c + dy * (g + 6)); kstroke(1, col); }
      dot(c, c, 2, PALE);
      const run = this.clock - this.fan.last <= (P.fanHammer?.window ?? 0.25) * 1.6 ? this.fan.run : 0, R = g + 12; chR = R + 6;
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + (k * TAU) / 6, lit = run > k ? Math.exp(-(this.clock - (this.fan.lit[k] ?? -9)) / 0.6) : 0;
        dot(c + Math.cos(a) * R, c + Math.sin(a) * R, 2, lit > 0.02 ? `rgba(255,250,235,${0.35 + 0.65 * lit})` : 'rgba(160,140,200,.45)');
      }
    } else if (kind === 'bombardier') {
      const dy = 4 * Math.exp(-this.fireT / 0.14);
      x.beginPath(); x.arc(c, c, 6, 0, TAU); kstroke(1, col); dot(c, c, 2, PALE);
      x.beginPath(); x.moveTo(c - 5, c + 11 + dy); x.lineTo(c, c + 16 + dy); x.lineTo(c + 5, c + 11 + dy); kstroke(1, col2);
      x.beginPath(); x.arc(c, c + 2, 14, -Math.PI * 0.82, -Math.PI * 0.18); kstroke(1, col); chR = 21;
      for (const sd of [-1, 1]) { seg(c + sd * 10, c, c + sd * 16, c); kstroke(1, col); }
    } else if (kind === 'carbine') {
      const g = 8 + this.px(spread, fov) * 0.5;
      for (const sd of [-1, 1]) { seg(c + sd * g, c, c + sd * (g + 18), c); kstroke(1, col); }
      seg(c, c + g, c, c + g + 14); kstroke(1, col);
      x.beginPath(); x.moveTo(c, c - 3); x.lineTo(c + 3, c); x.lineTo(c, c + 3); x.lineTo(c - 3, c); x.closePath(); kstroke(1, PALE);
      const draw = P.fullDraw ? W.charge ?? 0 : 0; chR = P.fullDraw ? 0 : 26; // (the full draw's closing ring is the Carbine's charge)
      if (draw > 0) { x.beginPath(); x.arc(c, c, lerp(30, 10, eioc(cl(draw))), 0, TAU); kstroke(draw >= 1 ? 2 : 1, draw >= 1 ? PALE : col2); }
    } else if (kind === 'pentagun') {
      const R = 12, Pt = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * TAU) / 5; Pt.push([c + Math.cos(a) * R, c + Math.sin(a) * R]); }
      const V = W.play, lit = new Set(V?.pentacleLit || []), win = P.pentacle?.window ?? 4;
      let first = Infinity; for (const t of V?.points?.values?.() || []) first = Math.min(first, t);
      const left = lit.size ? cl(1 - ((V.clock ?? 0) - first) / win) : 0;
      if (left > 0) { x.beginPath(); x.arc(c, c, 18, -Math.PI / 2, -Math.PI / 2 + TAU * left); kstroke(1, col2); }
      chR = 23;
      const st = this.starT; // (the pentacle: five strokes, 70 ms each, then the circle in 150, held 1.5 s, faded in 0.4)
      if (st < 2.2) {
        const star = cl(st / 0.35), circ = cl((st - 0.35) / 0.15), fade = 1 - cl((st - 1.8) / 0.4), ord = [0, 2, 4, 1, 3, 0];
        x.globalAlpha = fade;
        for (let j = 0; j < 5; j++) { const u = cl(star * 5 - j); if (u <= 0) break; const a = Pt[ord[j]], b = Pt[ord[j + 1]]; seg(a[0], a[1], lerp(a[0], b[0], u), lerp(a[1], b[1], u)); kstroke(1, PALE); }
        if (circ > 0) { x.beginPath(); x.arc(c, c, R, -Math.PI / 2, -Math.PI / 2 + TAU * circ); kstroke(1, PALE); }
        x.globalAlpha = 1;
      }
      Pt.forEach((p, k) => { const on = lit.has(k) || st < 1.8; dot(p[0], p[1], on ? 3 : 2, on ? TYPE_COL[k] : 'rgba(160,140,200,.5)'); });
      dot(c, c, 2, PALE);
    } else if (kind === 'pepperbox') {
      const L = P.pellets || { spread: 12 }, m = eioc(this.slug), ring = Math.min(D / 2 - 12, Math.max(10, this.px(L.spread / 2, fov)));
      const rr = lerp(ring, 7, m);
      x.beginPath(); x.arc(c, c, rr, 0, TAU); kstroke(m > 0.5 ? 2 : 1, col);
      if (m < 0.6) {
        const flash = Math.exp(-this.flashT / 0.12); x.globalAlpha = 1 - m / 0.6;
        for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * TAU) / 6; dot(c + Math.cos(a) * rr * 0.5, c + Math.sin(a) * rr * 0.5, 2, flash > 0.05 ? '#fffaf0' : PALE); }
        x.globalAlpha = 1;
      }
      dot(c, c, m > 0.5 ? 3 : 2, PALE);
      for (const sd of [-1, 1]) { seg(c + sd * (rr + 3), c, c + sd * (rr + 8), c); kstroke(1, col); }
      chR = Math.min(D / 2 - 3, rr + 12);
      const both = cl(1 - this.bothT / 0.6);
      if (both > 0) { x.globalAlpha = both; x.beginPath(); x.arc(c, c, Math.min(D / 2 - 2, rr + 6 + 14 * (1 - both)), 0, TAU); kstroke(1, PALE); x.globalAlpha = 1; }
    }
    // THE HELD CHARGE (the HUD's #charge arc moved into each gun's own reticle, PNEUKA-BOX.md 7): an arc filling clockwise from the top
    // just outside the reticle's marks, four quarter ticks to read it by, white and doubled when full (Splatoon's charger, Halo's
    // plasma pistol); the Carbine's is its full draw's closing ring above.
    const ch = cl(W?.charge ?? 0);
    if (chR > 0 && ch > 0) {
      const full = ch >= 1;
      for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k * TAU) / 4; dot(c + Math.cos(a) * chR, c + Math.sin(a) * chR, 1, ch * 4 > k ? PALE : 'rgba(160,140,200,.45)'); }
      x.beginPath(); x.arc(c, c, chR, -Math.PI / 2, -Math.PI / 2 + TAU * ch); kstroke(full ? 2 : 1, full ? PALE : col2);
    }
    x.restore();
  }
}
