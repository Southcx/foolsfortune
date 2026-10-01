import * as THREE from 'three';
import { Tech } from './techs.js';
import { Track } from '../animator.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';
import { VeritomeModel } from '../veritome/model.js';
import { Book } from '../veritome/book.js';
import { ARCANA, cardArt } from '../veritome/arcana.js';
import { scorePhoto, sits } from '../veritome/photo.js';
import { Viewfinder, Hand } from '../veritome/viewfinder.js';
import { measureGrip } from '../tools/grip.js';
import { drawHands } from '../tools/draw.js';
import { unwrite, inscribed } from '../brush/inscribe.js';
import { TIDES, TIDE_LEN } from '../angling/species.js';

// ---------------------------------------------------------------------------------------
// THE VERITOME (Veritas, and a tome of knowledge): the fourth of the Courier's psychic tools. A grimoire with a clock set in its
// cover, worn on a chain at the right hip, which is two instruments at once:
//
//  - A CAMERA, to ground her against what is not real. RMB raises the lens (the view goes through the clock's glass, in first person,
//    the wheel zooms) and LMB takes a photograph. Every photograph is scored (Pokémon Snap: size, pose, technique) and the best of
//    each kind of thing goes into the Compendium (the Codex's VERITOME shelf, the Hyrule Compendium's way) and onto the map, where it
//    was taken (the Sheikah Slate's). A photograph is the truth of a thing: whatever the Soul Brush wrote on what it shows is undone.
//    And it is Fatal Frame's camera: hold a clapperjar in the capture circle and the ring fills; a shot at full charge holds it to
//    reality (it is stunned and marked), and a full shot at the SHUTTER CHANCE (while it is in the air, or rushing at her) takes it
//    whole.
//  - THE BOOK (veritome/book.js), Greed Island's binder of designated pages, filled by photographing each Major Arcana's sitting (the
//    Fool is one who has leapt, the Hanged Man one who hangs). With the lens down, LMB DRAWS a card the Book knows and LMB again PLAYS
//    it (its rule laid over the world for a while: veritome/effects.js); MMB redraws once. Spare copies are GAINED from the binder in
//    the Codex. Every card played leaves its seal in the clasp; three seals are an Astrodyne (Final Fantasy XIV's Astrologian).
//
//   J      draw / stow            RMB (hold)  the lens: LMB the shutter, wheel the zoom
//   LMB    (lens down) draw a card, then play it        MMB  redraw        B  the Codex's VERITOME shelf: the binder, Gain, the Compendium
// ---------------------------------------------------------------------------------------
const HOLD = T.weapon.drawGrab;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _m1 = new THREE.Matrix4(), _v = new THREE.Vector3();
const ZOOM = { wide: 64, tight: 16 };
const CAPTURE = { range: 18, time: 1.1 };

export class Veritome extends Tech {
  constructor(mgr) {
    super(mgr, 'veritome');
    this.passive = true; this.alwaysHands = true; this.overrides = 0;
    this.drawT = 0; this.drawTarget = 0; this.wasOut = false;
    const g = mgr.game;
    g.veritome = this;
    this.model = new VeritomeModel();
    this.model.group.visible = false;
    g.scene.add(this.model.group);
    this.book = new Book(g);
    this.vf = new Viewfinder();
    this.hand = new Hand();
    this.lens = false; this.lensK = 0; this.zoom = 0.25; this.prevView = null;
    this.charge = 0; this.target = null; this.chance = false;
    this.shotCool = 0; this.pending = null; this.previewT = 0; this.preview = null;
    this.playT = -1; this.drawClipT = -1; this.cards = [];
  }

  // ---------------------------------------------------------------- what the rest of the game asks
  get engaged() { return this.drawT > 0.001; }
  get toolOut() { return this.drawTarget > 0 || this.drawT > 0.02; }
  get held() { return this.drawT >= 1; }
  get blocksFire() { return this.toolOut; }
  get stance() { return this.toolOut && this.lens; }
  get slow() { return this.toolOut && this.lens ? 0.55 : 1; }
  /** Cards in play that change a step (the Chariot, an Astrodyne): read by the core through Techs.speedMult. */
  get speedMult() { return this.book.speedMult; }
  get luck() { return this.book.luck; }
  mult(what) { return this.book.mult(what); }
  /** Take one of the luck the Fool or the Wheel left (the Tithe's roll asks). */
  takeLuck() { if (this.book.luck > 0) { this.book.luck--; return true; } return false; }

  computeSocket(ch) {
    this.grip = measureGrip(ch);
    // on a chain at the right hip: the spine along the body (forward), the book hanging below it, its cover out
    const B = ch.bones, saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
    ch.root.position.set(0, 0, 0); ch.root.quaternion.identity(); ch.resetPose(); ch.root.updateMatrixWorld(true);
    const X = new THREE.Vector3(0, 0, -1), Y = new THREE.Vector3(0, -1, 0), Z = new THREE.Vector3().crossVectors(X, Y);
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(-0.25, 1.0, 0.02);
    this.holsterLocal = B.spine.matrixWorld.clone().invert().multiply(G);
    ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ); ch.root.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- per frame
  tick(dt) {
    this.dt = dt;
    const P = this.P, g = this.game, inp = P.input, ch = g.character, raw = g.rawDt || dt;
    if (!this.grip && ch) this.computeSocket(ch);
    if (this.enabled && inp.enabled) {
      const busy = !!this.mgr.active?.handsBusy || !!this.mgr.get?.('carry')?.item;
      if (inp.wasPressed('KeyJ') && !g.god?.controlling && !busy) { this.drawTarget = this.drawTarget > 0 ? 0 : 1; if (this.drawTarget) g.belt?.draw(g.belt.get('veritome')); }
      if (inp.wasPressed('KeyX') && this.drawTarget > 0) this.drawTarget = 0;
      if (busy && this.drawTarget > 0) { this.drawTarget = 0; this.resume = true; }
      else if (!busy && this.resume && !this.mgr.active) { this.resume = false; this.drawTarget = 1; }
    }
    if (!this.enabled || g.god?.controlling) this.drawTarget = 0;
    const free = g.belt ? g.belt.mayDraw(g.belt.get('veritome')) : true;
    const step = dt / (this.drawTarget > this.drawT ? T.weapon.drawTime : T.weapon.holsterTime);
    if (this.drawTarget > this.drawT && free) this.drawT = Math.min(this.drawTarget, this.drawT + step);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - step);
    if (this.drawT > 0.02 && !this.wasOut) { this.wasOut = true; sfx.toolDraw(); g.events?.emit('veritome.draw', {}); }
    if (this.drawT <= 0.02 && this.wasOut) { this.wasOut = false; sfx.holster?.(); this.lower(); g.events?.emit('veritome.stow', {}); }
    this.shotCool -= raw;
    if (this.held && inp.enabled && !g.codex?.open) {
      const wantLens = inp.isDown('Mouse2');
      if (wantLens && !this.lens) this.raise();
      else if (!wantLens && this.lens) this.lower();
      if (this.lens) this.lensUpdate(raw, inp);
      else {
        if (inp.wasPressed('Mouse0')) { const id = this.book.hand; if (id) { if (this.book.play()) { this.playT = 0; this.throwCard(id); } } else if (this.book.draw()) this.drawClipT = 0; }
        if (inp.wasPressed('Mouse1')) this.book.redraw();
      }
    } else if (this.lens) this.lower();
    this.lensK = THREE.MathUtils.damp(this.lensK, this.lens ? 1 : 0, 14, raw);
    P.lens = this.lensK > 0.001 ? { k: this.lensK, fov: THREE.MathUtils.lerp(ZOOM.wide, ZOOM.tight, this.zoom) } : null;
    P.lookScale.lens = this.lens ? THREE.MathUtils.lerp(0.9, 0.3, this.zoom) : 1;
    this.book.tick(dt);
    if (P.unseen > 0) P.unseen = Math.max(0, P.unseen - dt);
    // the book's own clock keeps the tide
    const W = g.weir;
    const tide = W ? (W.tide + (W.tideT || 0) / TIDE_LEN) / TIDES.length : (performance.now() / 320000) % 1;
    this.model.setTime(tide); this.tide = tide;
    this.model.setOpen(THREE.MathUtils.damp(this.model.open, this.playT >= 0 && this.playT < 0.6 ? 1 : this.drawClipT >= 0 && this.drawClipT < 0.5 ? 0.6 : 0, 10, dt));
    if (this.playT >= 0) this.playT += dt; if (this.playT > 0.9) this.playT = -1;
    if (this.drawClipT >= 0) this.drawClipT += dt; if (this.drawClipT > 0.7) this.drawClipT = -1;
    this.model.setGlow(this.lens ? 0.4 + 0.6 * this.charge : 0);
    this.vf.draw(raw, { heading: ((Math.PI - P.yaw) * 180) / Math.PI, pitch: P.pitch, tide, charge: this.charge, chance: this.chance, brackets: this.preview?.brackets, zoom: this.zoom, stars: this.preview?.stars });
    this.hand.show(this.drawT > 0.5 || this.book.active.length > 0);
    const shells = document.getElementById('shells'); // (the Psygun's shells are not the book's)
    if (shells && this.drawT > 0.02) shells.style.display = 'none';
    else if (shells && this.wasShellsHidden) shells.style.display = '';
    this.wasShellsHidden = this.drawT > 0.02;
    this.hand.render(this.book);
    this.tickCards(dt);
    const ch2 = g.character;
    this.model.group.visible = this.enabled && !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && !g.god?.active && this.lensK < 0.5;
  }

  // ---------------------------------------------------------------- the lens
  raise() {
    const P = this.P;
    this.lens = true; this.charge = 0; this.target = null;
    if (!P.fp) { this.prevView = P.view; P.view = 'fp'; }
    this.vf.show(true);
    sfx.lensUp?.();
    this.game.events?.emit('veritome.lens', { up: true });
  }
  lower() {
    if (!this.lens) return;
    const P = this.P;
    this.lens = false; this.charge = 0; this.target = null; this.chance = false;
    if (this.prevView) { P.view = this.prevView; this.prevView = null; }
    this.vf.show(false);
    P.lookScale.lens = 1;
  }

  lensUpdate(raw, inp) {
    const g = this.game, P = this.P;
    if (inp.wheel) { this.zoom = THREE.MathUtils.clamp(this.zoom - Math.sign(inp.wheel) * 0.12, 0, 1); inp.wheel = 0; }
    // a look at what is in frame a few times a second (the brackets and the stars)
    this.previewT -= raw;
    if (this.previewT <= 0) {
      this.previewT = 0.15;
      const r = scorePhoto(g, g.camera);
      this.preview = { stars: r.stars, brackets: r.subjects.slice(0, 8).map((s) => ({ x: s.ndc.x, y: s.ndc.y, h: s.frac, stars: s.stars })) };
    }
    // the capture circle: a clapperjar held in it charges the shot (Fatal Frame)
    const cam = g.camera, eye = cam.getWorldPosition(_v.set(0, 0, 0)).clone();
    let best = null, bd = Infinity;
    for (const c of g.clappers?.list || []) {
      if (!c.alive || c.ally) continue;
      const p = c.pos.clone().setY(c.pos.y + 0.35), d = p.distanceTo(eye);
      if (d > CAPTURE.range) continue;
      const n = p.clone().project(cam);
      if (n.z > 1) continue;
      const off = Math.hypot(n.x * (innerWidth / innerHeight), n.y);
      if (off < 0.32 && off < bd) { bd = off; best = c; }
    }
    if (best && best === this.target) this.charge = Math.min(1, this.charge + raw / CAPTURE.time);
    else { this.target = best; this.charge = best ? Math.max(0, this.charge - raw * 2) : Math.max(0, this.charge - raw * 2); }
    this.chance = !!(best && this.charge >= 1 && (!best.grounded || best.state === 'knocked' || best.state === 'raid' || (best.state === 'chase' || best.state === 'charge')));
    if (inp.wasPressed('Mouse0') && this.shotCool <= 0) this.shutter();
  }

  shutter() {
    const g = this.game, P = this.P;
    this.shotCool = 0.6;
    const report = scorePhoto(g, g.camera);
    // a full charge holds a clapperjar to reality; at the shutter chance it is taken whole
    let fatal = null;
    if (this.target && this.charge >= 1 && this.target.alive) {
      const c = this.target;
      if (this.chance) { g.clappers.hit(c, c.pos.clone().setY(c.pos.y + 0.35), P.lookDir(new THREE.Vector3()), 1, 'captured'); fatal = 'captured'; }
      else { g.clappers.stun(c, 4, g.shells.glowOutline, g.shells.xray); fatal = 'held'; }
      g.lachryma.gain(fatal === 'captured' ? 8 : 3, 'photo');
    }
    this.charge = 0; this.target = null;
    // the truth of a thing: what the brush wrote on what is in frame is undone
    let unwritten = 0;
    for (const s of report.subjects) if (s.kind === 'pot' && inscribed(s.ref).length) unwritten += unwrite(g, s.ref);
    sfx.shutter?.();
    this.pending = { report, fatal, unwritten, pos: P.pos.clone(), yaw: P.yaw };
  }

  /** Just after the frame is drawn: the photograph is that frame (its middle, through the glass). */
  afterRender(canvas) {
    const q = this.pending;
    if (!q) return;
    this.pending = null;
    let thumb = null;
    if (canvas) {
      try {
        const A = this.vf.aperture(canvas.width, canvas.height), c = document.createElement('canvas');
        c.width = 192; c.height = 120;
        const sw = A.w, sh = sw * (120 / 192), sy = A.y + (A.h - sh) / 2;
        c.getContext('2d').drawImage(canvas, A.x, sy, sw, sh, 0, 0, 192, 120);
        thumb = c.toDataURL('image/jpeg', 0.72);
      } catch { thumb = null; }
    }
    this.vf.flash(thumb);
    this.develop(q, thumb);
  }

  /** What a photograph adds: the Compendium, the map, the Book. */
  develop({ report, fatal, unwritten, pos, yaw }, thumb) {
    const g = this.game, B = this.book;
    const best = report.best;
    const kind = best?.kind || (report.sun ? 'sun' : report.sky ? 'sky' : null);
    if (kind) {
      const prev = B.photos[kind];
      const score = best?.score ?? 200;
      if (!prev || score > prev.score) B.photos[kind] = { score, stars: report.stars, thumb: thumb || prev?.thumb || null, at: Date.now() };
    }
    B.pins.push({ x: +pos.x.toFixed(1), y: +pos.y.toFixed(1), z: +pos.z.toFixed(1), yaw: +yaw.toFixed(2), kind, stars: report.stars });
    if (B.pins.length > 60) B.pins.shift();
    // what a photograph sees is charted
    const C = g.cartography;
    if (C) for (const s of report.subjects.slice(0, 12)) { const sp = this.posOf(s); if (sp) C.chartAt?.(sp); }
    // every card whose sitting this is
    const got = [];
    for (const A of ARCANA) if (sits(report, A.sitting) && B.give(A.id)) got.push(A.id);
    B.save();
    g.events?.emit('photo.take', { kind: kind || 'nothing', stars: report.stars, n: report.subjects.length, kinds: report.kinds, fatal, unwritten, cards: got.length });
  }
  posOf(s) { return s.ref?.pos?.isVector3 ? s.ref.pos : s.ref?.body?.translation ? new THREE.Vector3().copy(s.ref.body.translation()) : s.ref?.center?.isVector3 ? s.ref.center : null; }

  // ---------------------------------------------------------------- a card played: it flies from the book and is spent
  throwCard(id) {
    const g = this.game;
    const tex = new THREE.CanvasTexture(cardArt(id, 120, 200));
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    s.renderOrder = 27;
    const from = this.model.group.getWorldPosition(new THREE.Vector3());
    s.position.copy(from);
    g.scene.add(s);
    const P = this.P;
    this.cards.push({ s, t: 0, from, vel: P.lookDir(new THREE.Vector3()).multiplyScalar(2.5).setY(3) });
  }
  tickCards(dt) {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const q = this.cards[i];
      q.t += dt;
      const k = q.t / 0.8;
      if (k >= 1) { this.game.scene.remove(q.s); q.s.material.map.dispose(); q.s.material.dispose(); this.cards.splice(i, 1); continue; }
      q.s.position.copy(q.from).addScaledVector(q.vel, q.t);
      q.s.scale.set(0.3 * (1 + k), 0.5 * (1 + k), 1);
      q.s.material.opacity = 1 - k * k;
      q.s.material.rotation = Math.sin(q.t * 9) * 0.2 * (1 - k);
    }
  }

  // ---------------------------------------------------------------- animation and the hands
  animate(ch, base, dt) {
    const C = ch.clips;
    if (!this.track) { this.track = new Track(C, new Set(['torchIdle', 'idle'])); this.track.play('torchIdle', 0, 0.01); this.P1 = C.pose(); this.P2 = C.pose(); }
    const layerW = this.w * smooth(HOLD, 1, this.drawT) * (1 - this.mgr.override);
    if (layerW <= 0.001) return;
    this.track.update(dt);
    const layer = this.track.sample(this.P1);
    if (this.playT >= 0) C.blend(layer, C.sample('castShoot', Math.min(0.5, this.playT * 0.8), this.P2, false), Math.min(1, this.playT * 8) * (1 - smooth(0.6, 0.9, this.playT)));
    if (this.drawClipT >= 0) C.blend(layer, C.sample('interact', Math.min(1, this.drawClipT * 1.4), this.P2, false), Math.min(1, this.drawClipT * 8) * (1 - smooth(0.45, 0.7, this.drawClipT)));
    C.blend(base, layer, layerW, ch.MASK_UPPER, 0);
  }

  hands(ch) {
    if (!this.grip) return;
    const B = ch.bones, model = this.model;
    ch.root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const M = new THREE.Matrix4();
    drawHands(ch, this.grip, holster, this.drawT, { hold: HOLD, twist: -8, lean: 6, via: [-0.45, 1.1, 0.3], out: M });
    if (this.P.fp && this.drawT > 0.001) {
      // in first person: held low at the right of the view, the cover toward the eye (opened to play a card)
      const cam = this.game.camera;
      cam.updateMatrixWorld();
      const X = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0.25, 0, 1).normalize(), Y = new THREE.Vector3().crossVectors(Z, X);
      const local = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(0.2, -0.36 - 0.5 * (1 - Math.min(1, this.drawT / 0.6)) + (this.playT >= 0 ? 0.05 : 0), -0.5);
      M.multiplyMatrices(cam.matrixWorld, local);
    }
    if (!M.elements.every(Number.isFinite)) M.copy(holster);
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    model.group.updateMatrixWorld(true);
  }

  fixed() {}
  reset() { this.lower(); this.book.clearEffects(); }
}
