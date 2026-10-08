// ---------------------------------------------------------------------------------------
// THE SPIRIT PRESS AT THE ATHANOR, THE STATION (docs/plans/SOUL-ALCHEMY.md section 4, Calissa's UX; the rules are progress/alchemy.js,
// Dovina's; the press's model is Calissa's vfx/spiritpress.js; the bath's look a stand-in, world/garden/pressbath.js, until hers).
// On the Athanor's crown: a BATH 5 m across sunk level into it (the colour wheel: hue the bearing clockwise from north, saturation the
// distance out), its KERB, the WARE RING outside it, and the press 4.35 m north facing it, pouring in. F within reach of the kerb opens
// the PRESS VIEW (the garden camera's fourth view: world/garden/gardencam.js); F, Esc or W A S D leaves it. Inside it the hand is the
// whole control (Black & White's): HOVER a lump on the ware ring and its ghost path draws from where the bead would be; PINCH it (left
// button), carry it and RELEASE it over the crown's spiral mouth to load it (five at most, in order: the order is the craft); FLICK a
// lump circling the mouth (right button) and it goes back; HOLD the left button on the mouth to PRESS (one material at a time, the bead
// gliding its path, Shift twice as fast, a click finishing the one walking); DRAG the lever's ball down to FIRE. The lumps are a view of
// the Pneuka Box: one leaves the Box only when it is pressed. The ghost path and the press are the one walk (`alchemy.walk`), so the
// preview never lies. The press's FORMATION is the Athanor's own, on Wu Xing's cycles (fire's, with the Athanor's features, the ground
// under the press and the water at it), and divides a firing's fuel.
// Events (4.19): alchemy.open, alchemy.close, alchemy.load { count }, alchemy.unload { count }, alchemy.step { hue, sat },
// alchemy.enter { attribute, heart }, alchemy.refuse { why }, each `by: 'courier'`; alchemy.press and alchemy.fire are progress/alchemy.js's.
//
// Prior art: Potion Craft (a path previewed before the ingredient goes in), Black & White's hand (pinch, release, flick, press, pull),
// the glaze line blend and test tiles (Ian Currie), the tsukubai and its kakei (the press as the basin's spout), Townscaper (every act
// answered by a small reaction, no fail screen), and Calissa's section 4 for the rest.
//
//   const P = new GardenPress(realm, feature)   P.formation()   P.extra()   P.enter()   P.leave(why)   P.viewing   P.handle(dt, hand)
//   P.update(raw)   P.hopper [{ slot, m }]   P.frame { O, U, N, E, R }   P.lumps() -> [{ slot, m, pos, h, s }]   P.inReach(pos)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SpiritPress } from '../../vfx/spiritpress.js';
import { ATTRIBUTES, targetOf, heartRadius, radiusAt } from '../../progress/alchemy.js';
import { formation } from '../../progress/realm.js';
import { ECON } from '../../progress/econ/table.js';
import { PressBath, NORTH_HUE } from './pressbath.js';
import { PressLook } from '../../vfx/alchemy/presslook.js';
import { FOOTING } from '../../vfx/alchemy/basin.js';

const IDS = Object.keys(ATTRIBUTES);
const BATH = { r: 2.5, kerb: 0.45, ware: 0.5, press: 4.35, reach: 3.6, hopper: 5 }; // (metres; the hopper's queue)
const GLIDE = { steps: [3, 5], secs: [0.2, 0.33], beat: 0.15 }; // (a material's walk: 3 to 5 glides of 0.2 to 0.33 s, a beat between materials)
const LEVER = { px: 110, fire: 0.85 }; // (the ball dragged this many pixels down is fully pulled; pulled past this share, it fires)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix4();

export class GardenPress {
  constructor(realm, feature) {
    this.R = realm; this.game = realm.game; this.feature = feature;
    const P = feature.planet, at = feature.pos.clone(), U = at.clone().sub(P.c).normalize();
    const N = new THREE.Vector3(0, 0, -1).projectOnPlane(U); if (N.lengthSq() < 1e-4) N.set(1, 0, 0).projectOnPlane(U); N.normalize();
    const E = new THREE.Vector3().crossVectors(N, U).normalize();
    // the bath lies level over the highest ground under its footprint (the Athanor's basalt columns stand up to 0.4 m: sampled, not assumed)
    let lift = 0; const ground0 = at.distanceTo(P.c);
    for (let k = 0; k < 64; k++) { const a = k * 2.39996, r = (BATH.r + BATH.kerb + BATH.ware) * Math.sqrt((k + 0.5) / 64), q = _v.copy(at).addScaledVector(N, Math.cos(a) * r).addScaledVector(E, Math.sin(a) * r).sub(P.c);
      const along = q.dot(U), h = (P.radiusAt ? P.radiusAt(q.normalize()) : P.r) * Math.max(0, q.dot(U)) - ground0; if (along > 0) lift = Math.max(lift, h); }
    this.frame = { O: at.clone().addScaledVector(U, lift + 0.05), U, N, E, R: BATH.r, planet: P };
    this.bath = new PressBath(this.frame, realm.site.group);
    // the press: 4.35 m north, its front (+Z) toward the bath, level with it on the basin's footing (vfx/alchemy/basin.js: the ground
    // falls a metre from the bath to the press on a planetoid this small, and a spout has to pour down into its basin)
    this.model = new SpiritPress({ hues: IDS.map((id) => ATTRIBUTES[id].hue) }); this.model.group.name = 'garden-press';
    const front = N.clone().negate();
    this.model.group.position.copy(this.frame.O).addScaledVector(N, BATH.press).addScaledVector(U, FOOTING.top);
    this.model.group.quaternion.setFromRotationMatrix(_m.makeBasis(new THREE.Vector3().crossVectors(U, front).normalize(), U, front));
    realm.site.group.add(this.model.group);
    this.look = new PressLook(this); // (Calissa's: the press, the bath, the sky, the HUD and the hand as they answer the station, vfx/alchemy/presslook.js)
    this.hopper = []; this.viewing = false; this.walk = null; this.carry = null; this.lever = null; this.hover = null; this.inside = null;
    this.fire = 0; this.pull = 0; this.pressT = 0; this.openedAt = -1; this.frameN = 0; this.beatT = null; this.walked = false;
  }

  // ---------------------------------------------------------------- the rules' hooks
  /** The press's formation: fire, with the Athanor's features, the ground under it and the water at it as neighbours (clamped). */
  formation() {
    const P = this.feature?.planet; if (!P) return 1;
    const R = this.R, near = R.plots.plots.filter((p) => p.planet === P && p.placed).map((p) => p.placed.feeling);
    const dir = this.feature.pos.clone().sub(P.c).normalize();
    const ground = R.clays?.[P.id]?.groundOf?.(dir) ?? null, water = R.waterworks?.feelingAt?.(P, dir) ?? null;
    const [lo, hi] = ECON.alchemy.formationClamp;
    return Math.max(lo, Math.min(hi, formation('mirth', near, false, { ground, water })));
  }
  /** A spirit at work on the Athanor: extra steps of each pull (section 7; none yet). */
  extra() { return 0; }

  // ---------------------------------------------------------------- the materials, laid out
  /** The Box's materials as lumps on the ware ring, at their hues' bearings (a heap of up to five; near hues in a short row outward). */
  lumps() {
    const box = this.game.pneuka, out = [], F = this.frame, rows = [];
    const slots = (box?.slots || []).map((s, i) => (s?.data?.path ? { i, s, m: s.data } : null)).filter(Boolean).sort((a, b) => a.m.hue - b.m.hue);
    for (const { i, s, m } of slots) {
      const left = (s.n || 1) - this.hopper.filter((q) => q.slot === i).length - (this.carry?.slot === i ? 1 : 0); if (left <= 0) continue;
      let row = 0; for (const r of rows) if (Math.abs(((r - m.hue + 540) % 360) - 180) < 6) row++; rows.push(m.hue); row = Math.min(2, row);
      const b = ((m.hue - NORTH_HUE) * Math.PI) / 180, n = Math.min(5, left);
      for (let k = 0; k < n; k++) {
        const rr = F.R + BATH.kerb + 0.18 + row * 0.2 + (k % 2) * 0.08, bb = b + (k - (n - 1) / 2) * 0.05;
        const pos = F.O.clone().addScaledVector(F.E, Math.sin(bb) * rr).addScaledVector(F.N, Math.cos(bb) * rr).addScaledVector(F.U, 0.02 + (k > 2 ? 0.1 : 0));
        out.push({ slot: i, m, pos, h: m.hue, s: m.sat, big: (m.tier || 0) >= 2 });
      }
    }
    return out;
  }
  queued() { return this.hopper.map((q) => q.m); }

  // ---------------------------------------------------------------- the press view
  enter() {
    if (this.viewing || !this.game.alchemy) return;
    this.viewing = true; this.openedAt = this.frameN; this.R.camera.enterPress?.(this.frame);
    this.game.events?.emit('alchemy.open', { by: 'courier' });
  }
  /** F, Esc or W A S D: the camera goes back; the lumps waiting in the mouth go back to the ring (they never left the Box). */
  leave(why = 'f') {
    if (!this.viewing) return;
    if (this.walk) this.finish(true);
    if (this.hopper.length) this.game.events?.emit('alchemy.unload', { count: this.hopper.length, by: 'courier' });
    this.hopper = []; this.carry = null; this.lever = null; this.hover = null; this.beatT = null; this.walked = false;
    this.viewing = false; this.R.camera.leavePress?.(); this.bath.clearDrops(); this.bath.ghost(null);
    this.game.events?.emit('alchemy.close', { why, by: 'courier' });
  }

  /** Where the cursor's ray meets the bath's plane. */
  onBath(o, d) { const F = this.frame, den = d.dot(F.U); if (Math.abs(den) < 1e-4) return null; const t = _w.copy(F.O).sub(o).dot(F.U) / den; return t > 0 ? o.clone().addScaledVector(d, t) : null; }
  /** How near the ray passes a point. */
  static miss(o, d, p) { const t = Math.max(0, _w.copy(p).sub(o).dot(d)); return _w.copy(o).addScaledVector(d, t).distanceTo(p); }
  mouthAt() { return this.model.parts.mouth.getWorldPosition(new THREE.Vector3()); }
  ballAt() { return this.model.parts.lever.localToWorld(new THREE.Vector3(0.4, 0.95, 0)); }

  /** The hand, in the press view: everything it can do here, each frame (hand.js hands the mouse over while the view is up). */
  handle(dt, hand) {
    const g = this.game, I = g.input, typing = g.log?.typing;
    if (!typing && this.frameN > this.openedAt + 1) {
      if (I.wasPressed('KeyF')) return this.leave('f');
      for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) if (I.wasPressed(k)) return this.leave('walk');
    }
    const { o, d } = hand.ray(), at = this.onBath(o, d), shift = I.isDown('ShiftLeft') || I.isDown('ShiftRight');
    this.lean = at;
    const mouth = this.mouthAt(), ball = this.ballAt();
    const overMouth = GardenPress.miss(o, d, mouth) < 0.5, overBall = GardenPress.miss(o, d, ball) < 0.35;
    const hp = this.look.handPoint(at, overMouth, overBall); if (hp) hand.point.copy(hp); // (the hand on the ball, before the mouth, or over the bath: the look's)
    if (this.lever) { // the ball pinched and dragged down: let go past the mark and it fires, short of it and it springs back
      this.pull = THREE.MathUtils.clamp((I.my - this.lever.y0) / LEVER.px, 0, 1);
      if (!I.isDown('Mouse0')) { const fired = this.pull >= LEVER.fire; this.lever = null; if (fired) this.fireLever(); }
    } else if (this.carry) { // a lump carried: released over the mouth it loads; anywhere else it goes back to the ring
      this.carry.pos = (at || o.clone().addScaledVector(d, 10)).clone().addScaledVector(this.frame.U, 0.5);
      if (!I.isDown('Mouse0')) {
        if (overMouth && this.hopper.length < BATH.hopper) { this.hopper.push({ slot: this.carry.slot, m: this.carry.m }); g.events?.emit('alchemy.load', { count: this.hopper.length, by: 'courier' }); }
        else if (overMouth) g.log?.say('info', 'The mouth holds five.', { key: 'alchemy.full', throttle: 1 }); // (a placeholder for Espada's words)
        this.carry = null;
      }
    } else if (this.walk || this.beatT != null) { // pressing: a click off the mouth finishes the one walking; the press goes on while the button is held on the mouth
      if (this.walk && I.wasPressed('Mouse0') && !overMouth) this.walk.t = this.walk.dur;
      if (this.walk) { this.walk.hold = I.isDown('Mouse0'); this.walk.fast = shift; }
      if (!I.isDown('Mouse0') && this.beatT != null) { this.beatT = null; this.walked = false; }
    } else {
      this.hover = this.nearLump(o, d);
      if (I.wasPressed('Mouse0')) {
        if (overBall) this.lever = { y0: I.my };
        else if (this.hover) { this.carry = { ...this.hover }; this.hover = null; }
        else if (overMouth && this.hopper.length) this.startWalk(shift);
      }
      if (I.wasPressed('Mouse2') && this.hopper.length) this.flick(o, d, overMouth);
    }
  }
  nearLump(o, d) { let best = null, bd = 0.3; for (const L of this.lumps()) { const m = GardenPress.miss(o, d, L.pos); if (m < bd) { bd = m; best = L; } } return best; }
  /** A flick: the lump circling the mouth nearest the ray springs back to the ring (the last loaded, if none is near). */
  flick(o, d, overMouth) {
    let k = -1, bd = 0.3;
    this.model.lumps.forEach((l, i) => { if (i >= this.hopper.length || !l.visible) return; const m = GardenPress.miss(o, d, l.getWorldPosition(_v)); if (m < bd) { bd = m; k = i; } });
    if (k < 0 && overMouth) k = this.hopper.length - 1;
    if (k >= 0) { this.hopper.splice(k, 1); this.game.events?.emit('alchemy.unload', { count: 1, by: 'courier' }); }
  }

  // ---------------------------------------------------------------- pressing
  /** The next material in the mouth begins its walk: its path is `walk()`'s, from where the bead is. */
  startWalk(fast) {
    const q = this.hopper[0]; if (!q) return;
    const A = this.game.alchemy, trail = A.walk([q.m]).trail, n = Math.max(GLIDE.steps[0], Math.min(GLIDE.steps[1], trail.length - 1));
    const per = THREE.MathUtils.lerp(GLIDE.secs[0], GLIDE.secs[1], Math.min(1, (trail.length - 1) / 8));
    if (!this.walked) this.bath.clearDrops(); this.walked = true; // (the line blend: kept through a run, wiped when the next run begins)
    this.walk = { q, trail, t: 0, dur: per * n, hold: true, fast, lastStep: 0 };
    this.pressT = 1;
  }
  /** The material walked: pressed for real (one at a time: the Box and the colour never disagree), then the next if the hand stays. */
  finish(leaving = false) {
    const W = this.walk; if (!W) return;
    const A = this.game.alchemy, box = this.game.pneuka; this.hopper.shift();
    if (box?.slots[W.q.slot]?.data === W.q.m) A.press([W.q.slot]);
    for (const c of W.trail.slice(1)) this.bath.drop(c);
    this.walk = null;
    this.hopper = this.hopper.filter((q) => box?.slots[q.slot]?.data?.path); // (a slot the press emptied: what was queued from it goes)
    if (!leaving && W.hold && this.hopper.length) { this.beatT = GLIDE.beat; this.next = W.fast; } else this.walked = false;
  }
  /** The lever: fire, or the refusal said where it was refused (alchemy.refuse; the crawl and the gutter are Calissa's). */
  fireLever() {
    const r = this.game.alchemy.fire();
    if (r.ok) { this.fire = 1; this.pull = 1; }
    else { this.game.events?.emit('alchemy.refuse', { why: r.code, by: 'courier' }); this.game.log?.say?.('info', r.why, { key: 'alchemy.refuse', throttle: 1 }); }
  }

  // ---------------------------------------------------------------- each frame
  update(raw) {
    this.frameN++;
    const A = this.game.alchemy; if (!A) return;
    if (this.beatT != null && (this.beatT -= raw) <= 0) { this.beatT = null; this.startWalk(this.next); }
    const W = this.walk;
    let bead = A.colour;
    if (W) {
      W.t += raw * (W.fast ? 2 : 1);
      const u = Math.min(1, W.t / W.dur) * (W.trail.length - 1), i = Math.floor(u), f = u - i, a = W.trail[i], b = W.trail[Math.min(W.trail.length - 1, i + 1)];
      const e = f * f * (3 - 2 * f); bead = { h: a.h + ((((b.h - a.h) % 360) + 540) % 360 - 180) * e, s: a.s + (b.s - a.s) * e };
      if (i > W.lastStep) { W.lastStep = i; this.game.events?.emit('alchemy.step', { hue: +a.h.toFixed(1), sat: +a.s.toFixed(3), by: 'courier' }); }
      if (W.t >= W.dur) this.finish();
    }
    // the tiles (their radius now, their bare radius), the bead, the ghost paths, the lumps
    this.bath.tiles(IDS.map((id) => { const t = targetOf(id); return { ...t, r: A.radius(id), bare: radiusAt(A.rank(id)), rank: A.rank(id), stars: A.stars?.(id) ?? 0 }; })); // (rank: 9 and 10 share a radius; stars: the true firings, when kept)
    this.bath.bead(bead, { viewing: this.viewing, draught: this.game.draught, walking: !!W }); // (the bead wells up in the press view; the draught's current; the stir)
    const queued = this.queued(), from = A.colour;
    this.bath.queue(this.viewing && queued.length ? A.walk(queued, from).trail : null, queued.map((_, i) => A.walk(queued.slice(0, i + 1), from).trail.length - 1)); // (ends: where each material's walk ends, for its ring)
    const hov = this.carry || this.hover;
    this.bath.ghost(this.viewing && hov ? A.walk([...queued, hov.m], from).trail : null);
    const lumps = this.lumps(); if (this.carry) lumps.push({ ...this.carry }); this.bath.lumps(lumps);
    // the bead entering a spread or a tile's heart (once a change: alchemy.enter)
    const near = A.nearest(), now = near ? `${near.id}${near.d <= heartRadius(A.rank(near.id)) ? ':heart' : ''}` : null;
    if (now !== this.inside) { this.inside = now; this.game.events?.emit('alchemy.enter', { attribute: near?.id ?? null, heart: !!now?.endsWith(':heart'), by: 'courier' }); }
    // the model: the queue in the mouth, the soul in the bath, the light the bead is inside, the press and the pull
    this.fire = Math.max(0, this.fire - raw * 0.5); if (!this.lever) this.pull = Math.max(0, this.pull - raw * 1.5); this.pressT = W ? 1 : Math.max(0, this.pressT - raw * 0.5);
    this.look.update(raw, { soul: bead, walking: !!W }); // (the model, the lights, the firing's look, the sky, the HUD, the hand)
  }

  /** The Jar within reach of the kerb (F opens the press view there). */
  inReach(pos) { return pos.distanceTo(this.frame.O) < BATH.reach + 0.6; }
  dispose() { this.look.dispose(); this.model.group.removeFromParent(); this.model.dispose?.(); this.bath.dispose(); }
}
