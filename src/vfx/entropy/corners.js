// ---------------------------------------------------------------------------------------
// YOUR SEAT'S CORNERS (plain names; South, 2026-11-06: "There's still a lot of negative space on the bottom left and right corners of the
// entropy tactics module, fill the left corner with the card portrait and the right corner with the hungry die at approximately 4x size.
// Also please give the hungry die an animation for feasting on cards you drag on to it, and for evolving denominations"). Looks only, for
// the board view (boardview.js), on the overlay's scene (render/overlayscene.js: after the post pass, so the tilt-shift never blurs them,
// in CSS px, anchored bottom-left; local x right from the left edge, y up from the bottom):
//   your Arcana     its living card (portraits.js) stood upright in the bottom-left corner, beside the hand, its health bar and number
//   your Hungry Die the die (pieces.js makeDie) big in the bottom-right corner, slowly turning, its d-number, its fed count and the
//                   count its next size wants written over it; the whole die a drop target for a feed (an invisible disc round it)
//   the feast       a card dragged over it: it leans toward the card, breathes fast and glows, hungry (hunger(k)); a card fed: it flies
//                   in from where it was let go, crumbles into motes drawn into the die, which gulps (a squash, then a bulge), chews
//                   (quick wobbles), flashes and ticks its fed count up
//   the growth      fed past a step (rules.js sidesOf, d4 > d6 > d8 > d10 > d12 > d20): cracks of light run its edges and it shudders, it
//                   bursts into motes with a flash and a shock ring, and re-forms as the next polyhedron, larger, its new d-number shown
//                   big a moment
// DieFeast is the same timeline for any die (the other seat's, in the world, plays it too: boardview.js).
//
// Prior art: Hearthstone's hero portrait and its mana crystals in the board's corners, Balatro's jokers eating cards (the crumble and the
// pop), Pokemon's evolution (the light, the burst, the new form), Katamari's gulp, cartoon squash and stretch (Thomas and Johnston).
//
//   new SeatCorners(view)   .attach(kit)   .detach()   .tick(dt, t, S)   .feast(card, fromLocal)   .feed(seat0LogEntry)   .hunger(k)
//   .pickables() -> [Object3D]   .dieScreen() -> { x, y, r } (page px)   .flying
//   new DieFeast(sides, fed)   .gulp(fed, sides)   .tick(dt) -> pose { squash, bulge, wob, glow, crack, reform, label, hunger }   .onBurst(sides)   .hunger
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sidesOf, ENTROPY_RULES as R } from '../../progress/casino/entropy/rules.js';
import { DIE_STEPS } from '../../progress/casino/table.js';
import { HEALTH } from '../../progress/casino/entropy/classes.js';
import { LOOK, makeDie, cardTexture, strokeText } from './pieces.js';
import { ArcanaPortrait, PORTRAIT } from './portraits.js';

/** The corners' numbers: shares of the screen's height (the portrait, the die's radius), CSS px margins, the feast's beats (real s), a
 *  step's growth of the die. */
export const CORNERS = {
  portrait: 0.5, die: 0.14, pad: 18, fly: 0.34, squash: 0.16, bulge: 0.2, chew: 0.55, crack: 0.85, reform: 0.5, label: 1.5, motes: 400,
  grow: [1, 1.06, 1.12, 1.18, 1.24, 1.32], // (the die's size a step, d4 .. d20)
};
const C = CORNERS, WHITE = new THREE.Color(1, 1, 1), _v = new THREE.Vector3();
const backOut = (u) => 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;

/** The feast's and the growth's timeline for one die (no meshes: a pose a frame, applied by whoever draws the die). */
export class DieFeast {
  constructor(sides = 4, fed = 0) { this.sides = sides; this.fed = fed; this.g = -1; this.e = -1; this.next = null; this.hunger = 0; this.hk = 0; this.glow = 0; this.labelT = 0; this.queue = []; this.onBurst = null; }
  /** A card eaten (the fed count and the die's size after it): a gulp, then a growth if it grew. */
  gulp(fed, sides) { this.queue.push({ fed, sides }); if (this.g < 0 && this.e < 0) this.start(); }
  start() { const q = this.queue.shift(); if (!q) return; this.g = 0; this.pend = q; }
  tick(dt) {
    this.hk += (this.hunger - this.hk) * Math.min(1, dt * 7); this.glow = Math.max(0, this.glow - dt * 1.6); this.labelT = Math.max(0, this.labelT - dt);
    const p = { squash: 0, bulge: 0, wob: 0, glow: this.glow + this.hk * 0.5, crack: 0, reform: 1, hunger: this.hk };
    if (this.g >= 0) {
      this.g += dt; const g = this.g, a = C.squash, b = a + C.bulge, c = b + C.chew;
      if (g < a) p.squash = Math.sin((g / a) * Math.PI * 0.5);
      else if (g < b) { p.squash = 1 - (g - a) / C.bulge; p.bulge = Math.sin(((g - a) / C.bulge) * Math.PI); if (this.pend) { this.fed = this.pend.fed; this.glow = 1; } }
      else if (g < c) { const u = (g - b) / C.chew; p.wob = Math.sin(u * Math.PI * 7) * (1 - u); }
      else { this.g = -1; const q = this.pend; this.pend = null; if (q && q.sides !== this.sides) { this.e = 0; this.next = q.sides; } else this.start(); }
    }
    if (this.e >= 0) {
      this.e += dt; const e = this.e;
      if (e < C.crack) { p.crack = e / C.crack; p.wob = Math.sin(e * 60) * 0.04 * p.crack; }
      else {
        if (this.next != null) { this.sides = this.next; this.next = null; this.glow = 1.4; this.labelT = C.label; this.onBurst?.(this.sides); }
        const u = (e - C.crack) / C.reform; p.reform = Math.max(0, backOut(Math.min(1, u))); p.glow = Math.max(p.glow, 1 - u);
        if (u >= 1) { this.e = -1; this.start(); }
      }
    }
    p.label = this.labelT / C.label; return p;
  }
  get busy() { return this.g >= 0 || this.e >= 0 || this.queue.length > 0; }
}

/** Motes in the overlay's px: a burst, or a stream drawn into a point. */
class OverlayMotes {
  constructor(kit) {
    const n = C.motes; this.n = n; this.i = 0; this.p = new Float32Array(n * 3).fill(-1e5); this.v = new Float32Array(n * 3); this.c = new Float32Array(n * 3); this.base = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.to = new Float32Array(n * 2); this.pull = new Float32Array(n);
    const g = kit.own(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.c, 3));
    this.points = new THREE.Points(g, kit.own(new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false })));
    this.points.frustumCulled = false; this.points.renderOrder = 60;
  }
  burst(x, y, k, color, { speed = 220, life = 0.9, to = null, pull = 0, radius = 0 } = {}) {
    const col = color.isColor ? color : new THREE.Color(color);
    for (let q = 0; q < k; q++) {
      const i = (this.i = (this.i + 1) % this.n), j = i * 3, a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.p[j] = x + Math.cos(a) * radius * Math.random(); this.p[j + 1] = y + Math.sin(a) * radius * Math.random(); this.p[j + 2] = 40;
      this.v[j] = Math.cos(a) * s; this.v[j + 1] = Math.sin(a) * s; this.base[j] = col.r; this.base[j + 1] = col.g; this.base[j + 2] = col.b;
      this.life[i] = this.max[i] = life * (0.6 + Math.random() * 0.5); this.pull[i] = pull; if (to) { this.to[i * 2] = to.x; this.to[i * 2 + 1] = to.y; }
    }
  }
  tick(dt) {
    const drag = Math.exp(-3 * dt);
    for (let i = 0; i < this.n; i++) {
      const j = i * 3; if (this.life[i] <= 0) { if (this.p[j + 1] > -1e4) { this.p[j + 1] = -1e5; this.c[j] = this.c[j + 1] = this.c[j + 2] = 0; } continue; }
      this.life[i] -= dt; const k = Math.max(0, this.life[i] / this.max[i]);
      if (this.pull[i]) { const f = this.pull[i] * dt; this.v[j] += (this.to[i * 2] - this.p[j]) * f; this.v[j + 1] += (this.to[i * 2 + 1] - this.p[j + 1]) * f; }
      this.v[j] *= drag; this.v[j + 1] *= drag; this.p[j] += this.v[j] * dt; this.p[j + 1] += this.v[j + 1] * dt;
      this.c[j] = this.base[j] * k; this.c[j + 1] = this.base[j + 1] * k; this.c[j + 2] = this.base[j + 2] * k;
    }
    const g = this.points.geometry; g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
  }
}

export class SeatCorners {
  constructor(view) { this.view = view; this.on = false; this.flying = 0; this.pending = []; }
  attach(kit) {
    const g = this.view.game, OS = g.overlayScene; this.kit = kit; if (!OS) return;
    const root = (this.root = new THREE.Group()); root.name = 'entropy-corners';
    OS.add(root, { anchor: 'bl', hud: false });
    // the die: its body, a glow behind it, a shock ring, the hit disc, its words
    const die = (this.die = makeDie(kit)); die.num.sprite.visible = false; die.body.color.multiplyScalar(0.55); root.add(die.group); // (darker bone: the overlay's own key light is strong)
    this.glow = new THREE.Mesh(kit.own(new THREE.CircleGeometry(1, 40)), kit.own(new THREE.MeshBasicMaterial({ color: LOOK.ours, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }))); this.glow.renderOrder = 50; root.add(this.glow);
    this.ring = new THREE.Mesh(kit.own(new THREE.RingGeometry(0.92, 1, 64)), kit.own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }))); this.ring.renderOrder = 61; root.add(this.ring);
    this.hit = new THREE.Mesh(kit.own(new THREE.CircleGeometry(1, 24)), kit.own(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false }))); this.hit.userData.pid = 'die:0'; root.add(this.hit);
    const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; this.wc = cv.getContext('2d'); this.wTex = kit.own(new THREE.CanvasTexture(cv)); this.wTex.colorSpace = THREE.SRGBColorSpace;
    this.words = new THREE.Mesh(kit.own(new THREE.PlaneGeometry(1, 0.5)), kit.own(new THREE.MeshBasicMaterial({ map: this.wTex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))); this.words.renderOrder = 62; root.add(this.words);
    this.edgeBase = new THREE.Color();
    this.motes = new OverlayMotes(kit); root.add(this.motes.points);
    this.flights = []; this.feastAnim = null; this.portrait = null; this.cls = null; this.on = true;
  }
  detach() { if (!this.root) return; this.view.game.overlayScene?.remove(this.root); this.portrait?.dispose(); this.root = this.portrait = this.die = null; this.on = false; this.flights = []; }
  pickables() { return this.on ? [this.hit, ...(this.portrait ? [this.portrait.group] : [])] : []; }
  /** The die's middle on the page (px from the top-left) and its radius. */
  dieScreen() { const d = this.dieLocal || { x: innerWidth - 100, y: 100, r: 60 }; return { x: d.x, y: innerHeight - d.y, r: d.r }; }
  hunger(k) { if (this.feastAnim) this.feastAnim.hunger = k; }
  /** A card let go over the die (local px where it was): it flies in and crumbles; the log's feed then lands as its gulp. */
  feast(card, from) {
    if (!this.on) return; const m = new THREE.Mesh(this.view.cardGeo, this.kit.shared(`cardmat.${card}`, () => new THREE.MeshBasicMaterial({ map: cardTexture(this.kit, card), toneMapped: false })));
    m.renderOrder = 63; this.root.add(m); this.flying++; this.flights.push({ m, from: { ...from }, u: 0, spin: (Math.random() - 0.5) * 6 });
  }
  /** The table's log said seat 0 fed: a gulp when no card is in flight (else when the flying one lands). */
  feed(x) { if (this.flying > 0) this.pending.push(x); else this.feastAnim?.gulp(x.fed, x.die); }
  layout() {
    const h = innerHeight, w = innerWidth, safe = this.view.game.hudLayout?.safe || {}, pad = C.pad;
    const unit = (h * C.portrait) / (PORTRAIT.h + 0.62); // (px a metre: the card and its bar and number under it)
    this.pLocal = { x: (safe.l || 0) + pad + (PORTRAIT.w / 2) * unit, y: (safe.b || 0) + pad + (PORTRAIT.h / 2 + 0.6) * unit, s: unit };
    const r = h * C.die; this.dieLocal = { x: w - (safe.r || 0) - pad - r * 1.25, y: (safe.b || 0) + pad + r * 1.45, r }; // (room under it for its growth and its gulp)
  }
  tick(dt, t, S) {
    if (!this.on || !S) return; this.layout();
    // your Arcana in the bottom-left
    if (this.cls !== S.cls[0]) { this.portrait?.dispose(); this.cls = S.cls[0]; this.portrait = new ArcanaPortrait(this.kit, this.cls, 0); this.portrait.group.userData.pid = 'arcana:0'; this.root.add(this.portrait.group); this.hp = null; }
    const P = this.portrait, pl = this.pLocal; P.group.position.set(pl.x, pl.y, 0); P.group.scale.setScalar(pl.s);
    if (this.hp !== S.hp[0]) { if (this.hp != null && S.hp[0] < this.hp) P.hit(); this.hp = S.hp[0]; P.set({ hp: this.hp, max: HEALTH }); }
    P.light?.(this.view.lit?.get('arcana:0') || 0); P.tick(dt, t);
    // your Hungry Die in the bottom-right
    const F = (this.feastAnim ||= Object.assign(new DieFeast(sidesOf(S.fed[0]), S.fed[0]), { onBurst: (n) => this.burst(n) }));
    if (!F.busy && !this.flying && F.fed !== S.fed[0]) { F.fed = S.fed[0]; F.sides = sidesOf(S.fed[0]); } // (a new game, or a feed the log never said)
    const pose = F.tick(dt), d = this.dieLocal, D = this.die, hue = this.view.hue;
    D.setSides(F.sides);
    const size = d.r / 0.36 * C.grow[Math.max(0, DIE_STEPS.indexOf(F.sides))] * pose.reform * (1 + pose.bulge * 0.22 + pose.hunger * 0.1 + Math.sin(t * (2 + pose.hunger * 10)) * 0.02 * (1 + pose.hunger * 3));
    D.group.position.set(d.x, d.y, 0); D.spinner.visible = pose.reform > 0.01;
    D.spinner.scale.set(size * (1 + pose.squash * 0.25), size * (1 - pose.squash * 0.32), size * (1 + pose.squash * 0.25));
    const lean = this.view.drag?.on ? Math.max(-0.5, Math.min(0.5, (this.view.drag.p.x - d.x) / 600)) * pose.hunger : 0;
    D.spinner.rotation.y += dt * (0.35 + pose.hunger * 2.2); D.spinner.rotation.x = Math.sin(t * 0.4) * 0.35 + pose.hunger * 0.4; D.spinner.rotation.z = pose.wob * 0.35 - lean;
    D.group.position.x += (Math.random() - 0.5) * pose.crack * 6 + lean * -30;
    D.edges.color.copy(hue).lerp(WHITE, Math.min(1, pose.crack * (0.6 + 0.4 * Math.sin(t * 50)) + pose.glow * 0.6));
    D.body.emissive.copy(hue).multiplyScalar(0.06 + pose.glow * 0.3 + pose.hunger * 0.1).lerp(WHITE, pose.crack * 0.2); // (hungry glows in its hue, never washed out white)
    if (pose.crack > 0 && Math.random() < pose.crack) this.motes.burst(d.x, d.y, 2, WHITE, { speed: 60 + 120 * pose.crack, life: 0.4, radius: d.r * 0.8 });
    this.glow.position.set(d.x, d.y, -5); this.glow.scale.setScalar(d.r * (1.35 + pose.hunger * 0.25 + pose.glow * 0.3)); this.glow.material.color.copy(hue); this.glow.material.opacity = Math.min(0.55, 0.12 + pose.hunger * 0.22 + pose.glow * 0.3);
    this.hit.position.set(d.x, d.y, 0); this.hit.scale.setScalar(d.r * 1.3);
    const rk = this.ringK = Math.max(0, (this.ringK || 0) - dt / 0.7); this.ring.position.set(d.x, d.y, 10); this.ring.scale.setScalar(d.r * (1 + (1 - rk) * 2.6)); this.ring.material.opacity = rk; this.ring.material.color.copy(WHITE).lerp(hue, 1 - rk);
    this.drawWords(F, pose); const ws = d.r * 2.4; this.words.position.set(d.x, d.y + d.r * 1.25 + ws * 0.25 + pose.label * d.r * 0.2, 0); this.words.scale.set(ws * (1 + pose.label * 0.35), ws * (1 + pose.label * 0.35), 1);
    this.layFlights(dt); this.motes.tick(dt);
  }
  /** The die's words: its d-number (big a moment after it grows), its fed count and what its next size wants. */
  drawWords(F, pose) {
    const nx = R.feedAt.find((n) => n > F.fed), key = `${F.sides}|${F.fed}|${nx}|${Math.round(pose.label * 10)}`; if (key === this.wKey) return; this.wKey = key;
    const c = this.wc, W = 512, H = 256, big = `d${F.sides}`, col = pose.label > 0 ? '#ffffff' : LOOK.sideCss(0);
    c.clearRect(0, 0, W, H);
    const h = 96 + pose.label * 30; c.lineJoin = 'round'; c.strokeStyle = c.fillStyle = 'rgba(3,2,6,0.85)'; strokeText(c, big, W / 2, 70, h, { lw: 22 }); c.strokeStyle = c.fillStyle = col; strokeText(c, big, W / 2, 70, h, { lw: 9 });
    c.font = '400 34px "Helvetica Neue", Helvetica, Arial, sans-serif'; c.letterSpacing = '6px'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const line = nx == null ? `FED ${F.fed} · LARGEST` : `FED ${F.fed} · d${sidesOf(nx)} AT ${nx}`, tw = c.measureText(line).width + 40;
    c.fillStyle = 'rgba(4,3,8,0.78)'; c.fillRect((W - tw) / 2, 160, tw, 58); c.strokeStyle = 'rgba(236,230,214,0.5)'; c.lineWidth = 2; c.strokeRect((W - tw) / 2 + 1, 161, tw - 2, 56);
    c.fillStyle = LOOK.ink; c.fillText(line, W / 2 + 3, 190); c.letterSpacing = '0px'; this.wTex.needsUpdate = true;
  }
  layFlights(dt) {
    const d = this.dieLocal;
    this.flights = this.flights.filter((f) => {
      f.u = Math.min(1, f.u + dt / C.fly); const u = f.u, e = u * u, ch = this.view.handCh || 120, s = 1 - u * 0.85;
      f.m.position.set(f.from.x + (d.x - f.from.x) * e, f.from.y + (d.y - f.from.y) * e + Math.sin(u * Math.PI) * 60, 300); f.m.rotation.z += f.spin * dt; f.m.scale.set(ch * 0.7 * s, ch * s, 1);
      if (u > 0.35) this.motes.burst(f.m.position.x, f.m.position.y, 5, Math.random() < 0.5 ? LOOK.bone : this.view.hue, { speed: 140, life: 0.6, to: d, pull: 30, radius: ch * 0.3 * s });
      if (u < 1) return true;
      this.root.remove(f.m); this.flying--; this.motes.burst(d.x, d.y, 30, this.view.hue, { speed: 90, life: 0.5, to: d, pull: 40, radius: d.r });
      const x = this.pending.shift(); if (x) this.feastAnim.gulp(x.fed, x.die); else this.feastAnim.gulp(this.feastAnim.fed + 1, sidesOf(this.feastAnim.fed + 1));
      return false;
    });
  }
  /** The growth's burst: motes, a flash, a shock ring. */
  burst() {
    const d = this.dieLocal; this.ringK = 1;
    this.motes.burst(d.x, d.y, 140, WHITE, { speed: 420, life: 1.0, radius: d.r * 0.6 }); this.motes.burst(d.x, d.y, 90, this.view.hue, { speed: 300, life: 1.3, radius: d.r * 0.4 });
  }
}
