import * as THREE from 'three';
import { Tech } from './techs.js';
import { Track } from '../animator.js';
import { sfx } from '../audio.js';
import { T } from '../config.js';
import { VeritomeModel } from '../veritome/model.js';
import { Book } from '../veritome/book.js';
import { ROLL } from '../veritome/film.js';
import { scorePhoto, serial } from '../veritome/photo.js';
import { kindOf, appraise } from '../veritome/darkroom.js';
import { ENGAGED } from '../veritome/subjects.js';
import { Viewfinder } from '../veritome/viewfinder.js';
import { bookFrame, holdBook } from '../veritome/hold.js';
import { measureGrip } from '../tools/grip.js';
import { drawHands } from '../tools/draw.js';
import { unwrite, inscribed } from '../brush/inscribe.js';
import { TIDES, TIDE_LEN } from '../angling/species.js';

// ---------------------------------------------------------------------------------------
// THE VERITOME (Veritas, and a tome of knowledge): the fourth of the Courier's psychic tools, and her inventory. A grimoire worn shut
// at the right hip, drawn and held OPEN in both hands (veritome/hold.js), the lens in its spine and its measuring instruments on the
// cover. It is how she grounds herself against what is not real: it gathers information, it does not rewrite anything.
//
//  - THE LENS. RMB raises the open book before the eyes (first person; the wheel zooms) and LMB exposes a plate. A photograph is
//    a PLATE on the film (veritome/film.js, twenty-four to a roll), stored as it was taken; nothing is judged at the shutter.
//    The plates are APPRAISED later, as many at once as you like, in the darkroom (the Codex's VERITOME shelf: veritome/darkroom.js),
//    where they become Compendium entries, bestiary facts (veritome/bestiary.js) and cards (the Arcana's sittings, creature portraits).
//    That is Wind Waker's Picto Box and Dark Cloud 2's camera: go and look, then sit down with what you saw.
//  - THE CAPTURE. A creature that is AWARE of her and ENGAGED with her (a clapperjar clapping at her, fleeing her, cowering, knocked
//    about: veritome/subjects.js) and held in the capture circle charges the shot; a shot at full charge holds it to what is real
//    (it is stunned), longer at the SHUTTER CHANCE (it is in the air, or clapping at her). An unaware creature cannot be held: it is
//    photographed candidly, which is how its habits are learned. (Fatal Frame's Camera Obscura, made gentler: it never kills.)
//  - THE TRUTH. A photograph undoes whatever the Soul Brush wrote on what it shows (the photograph is of the thing as it is).
//  - THE BOOK (veritome/book.js), the Courier's bank. While it is held open, the Pneuka Box (P: pneuka/box.js) opens beside it, and
//    things are stored in it as cards or taken out as things. The binder, the film, the bestiary and the Compendium are the Codex's
//    VERITOME shelf (B): the Codex is the Veritome's own pages.
//  - THE READ. The Survey (N, cartography.js) borrows the same open hold for a moment in third person: she reads the ground off it.
//
//   J      draw / stow     RMB (hold)  the lens: LMB the shutter, wheel the zoom     P (while it is out)  the box and the bank
//   B      the Codex: the binder (Take out, Condense), the film (appraise), the bestiary, the Compendium
// ---------------------------------------------------------------------------------------
const HOLD = T.weapon.drawGrab;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _v = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _s = new THREE.Vector3();
const ZOOM = { wide: 64, tight: 16 };
const CAPTURE = { range: 18, time: 1.1, hold: 4, chance: 6.5 };
// (the grip measures a tool along +X; the book's spine is its +Y)
const SPINE_TO_GRIP = new THREE.Matrix4().makeRotationZ(-Math.PI / 2);

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
    this.lens = false; this.lensK = 0; this.zoom = 0.25; this.prevView = null;
    this.charge = 0; this.target = null; this.chance = false;
    this.shotCool = 0; this.pending = null; this.previewT = 0; this.preview = null;
    this.readT = 0; this.readW = 0; this.holdW = 0; this.tide = 0;
    const last = this.book.film.plates[this.book.film.plates.length - 1];
    if (last?.thumb) this.model.setPhoto(last.thumb);
    // the Survey reads the ground off the open book (the same hold, in third person)
    g.events?.on('map.pulse', (e) => { if (!e.god) this.read(1.5); });
  }

  // ---------------------------------------------------------------- what the rest of the game asks
  get engaged() { return this.drawT > 0.001 || this.readW > 0.001; }
  get toolOut() { return this.drawTarget > 0 || this.drawT > 0.02; }
  get held() { return this.drawT >= 1; }
  get blocksFire() { return this.toolOut; }
  get stance() { return this.toolOut && this.lens; }
  get slow() { return this.toolOut && this.lens ? 0.55 : 1; }
  get film() { return this.book.film; }

  /** Hold the book open for a moment and read from it (the Survey), if the hands are free. */
  read(dur = 1.5) {
    if (this.toolOut || this.mgr.active?.handsBusy || this.mgr.get?.('carry')?.item || this.game.belt?.inHand) return;
    this.readT = Math.max(this.readT, dur);
  }

  computeSocket(ch) {
    this.grip = measureGrip(ch);
    // shut, on a chain at the right hip: the spine forward along the body, the book hanging below it, the front cover out
    const B = ch.bones, saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
    ch.root.position.set(0, 0, 0); ch.root.quaternion.identity(); ch.resetPose(); ch.root.updateMatrixWorld(true);
    const X = new THREE.Vector3(0, -1, 0), Y = new THREE.Vector3(0, 0, 1), Z = new THREE.Vector3().crossVectors(X, Y);
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(-0.25, 1.02, 0.02);
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
    } else if (this.lens) this.lower();
    this.lensK = THREE.MathUtils.damp(this.lensK, this.lens ? 1 : 0, 14, raw);
    P.lens = this.lensK > 0.001 ? { k: this.lensK, fov: THREE.MathUtils.lerp(ZOOM.wide, ZOOM.tight, this.zoom) } : null;
    P.lookScale.lens = this.lens ? THREE.MathUtils.lerp(0.9, 0.3, this.zoom) : 1;
    // the Survey's read: the same open hold, for a moment
    this.readT = Math.max(0, this.readT - dt);
    this.readW = THREE.MathUtils.damp(this.readW, this.readT > 0 && !this.toolOut && !P.fp ? 1 : 0, this.readT > 0 ? 9 : 6, dt);
    if (this.readW < 0.002) this.readW = 0;
    this.book.tick();
    // the cover's instruments keep the tide and the heading
    const W = g.weir;
    const tide = W ? (W.tide + (W.tideT || 0) / TIDE_LEN) / TIDES.length : (performance.now() / 320000) % 1;
    this.model.setTime(tide); this.tide = tide;
    this.model.setHeading(P.yaw);
    this.model.setOpen(Math.max(smooth(HOLD, 1, this.drawT), smooth(0.2, 0.9, this.readW)));
    this.model.setGlow(this.lens ? 0.4 + 0.6 * this.charge : 0);
    this.vf.draw(raw, { heading: ((Math.PI - P.yaw) * 180) / Math.PI, pitch: P.pitch, tide, charge: this.charge, chance: this.chance, brackets: this.preview?.brackets, zoom: this.zoom, stars: this.preview?.stars, film: { left: this.film.left, roll: ROLL } });
    const shells = document.getElementById('shells'); // (the Psygun's shells are not the book's)
    if (shells && this.drawT > 0.02) shells.style.display = 'none';
    else if (shells && this.wasShellsHidden) shells.style.display = '';
    this.wasShellsHidden = this.drawT > 0.02;
    const ch2 = g.character;
    this.model.group.visible = this.enabled && !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && !g.god?.active && this.lensK < 0.6;
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

  /** Can a charged shot hold this clapperjar? Only one aware of her and in the thick of it with her. */
  holdable(c) { return c.alive && !c.ally && ENGAGED.has(c.state) && !!this.game.clappers?.canSeePlayer?.(c); }

  lensUpdate(raw, inp) {
    const g = this.game;
    if (inp.wheel) { this.zoom = THREE.MathUtils.clamp(this.zoom - Math.sign(inp.wheel) * 0.12, 0, 1); inp.wheel = 0; }
    // a look at what is in frame a few times a second (the brackets and the stars)
    this.previewT -= raw;
    if (this.previewT <= 0) {
      this.previewT = 0.15;
      const r = scorePhoto(g, g.camera);
      this.preview = { stars: r.stars, brackets: r.subjects.slice(0, 8).map((s) => ({ x: s.ndc.x, y: s.ndc.y, h: s.frac, stars: s.stars, engaged: s.engaged })) };
    }
    // the capture circle: an engaged creature held in it charges the shot (Fatal Frame)
    const cam = g.camera, eye = cam.getWorldPosition(_v.set(0, 0, 0)).clone();
    let best = null, bd = Infinity;
    for (const c of g.clappers?.list || []) {
      if (!c.alive || c.ally) continue;
      const p = c.pos.clone().setY(c.pos.y + 0.35), d = p.distanceTo(eye);
      if (d > CAPTURE.range) continue;
      const n = p.clone().project(cam);
      if (n.z > 1) continue;
      const off = Math.hypot(n.x * (innerWidth / innerHeight), n.y);
      if (off < 0.32 && off < bd && this.holdable(c)) { bd = off; best = c; }
    }
    if (best && best === this.target) this.charge = Math.min(1, this.charge + raw / CAPTURE.time);
    else { this.target = best; this.charge = Math.max(0, this.charge - raw * 2); }
    this.chance = !!(best && this.charge >= 1 && (!best.grounded || best.state === 'knocked' || best.state === 'taunt' || best.state === 'raid'));
    if (inp.wasPressed('Mouse0') && this.shotCool <= 0) this.shutter();
  }

  shutter() {
    const g = this.game, P = this.P;
    if (this.film.full) { sfx.fizzle?.(); g.log?.say('info', 'The roll is full. Appraise it in the Book (B).', { key: 'filmfull', throttle: 3 }); this.shotCool = 0.4; return; }
    this.shotCool = 0.6;
    const report = scorePhoto(g, g.camera);
    // a full charge holds an engaged creature to what is real; at the shutter chance, longer
    let held = null;
    if (this.target && this.charge >= 1 && this.holdable(this.target)) {
      const c = this.target;
      g.clappers.stun(c, this.chance ? CAPTURE.chance : CAPTURE.hold, g.shells.glowOutline, g.shells.xray);
      held = this.chance ? 'chance' : 'held';
      g.lachryma.gain(this.chance ? 5 : 3, 'photo');
    }
    this.charge = 0; this.target = null;
    // the truth of a thing: what the brush wrote on what is in frame is undone
    let unwritten = 0;
    for (const s of report.subjects) if (s.kind === 'pot' && inscribed(s.ref).length) unwritten += unwrite(g, s.ref);
    // what a photograph sees is charted, and where it was taken goes on the map
    const C = g.cartography;
    if (C) for (const s of report.subjects.slice(0, 12)) { const sp = this.posOf(s); if (sp) C.chartAt?.(sp); }
    const B = this.book, kind = kindOf(report);
    B.pins.push({ x: +P.pos.x.toFixed(1), y: +P.pos.y.toFixed(1), z: +P.pos.z.toFixed(1), yaw: +P.yaw.toFixed(2), kind, stars: report.stars });
    if (B.pins.length > 60) B.pins.shift();
    sfx.shutter?.();
    this.pending = { shot: serial(report), held, unwritten, kind, pos: [+P.pos.x.toFixed(1), +P.pos.y.toFixed(1), +P.pos.z.toFixed(1)], yaw: +P.yaw.toFixed(2), tide: +this.tide.toFixed(3), zone: g.zones?.current?.id ?? null };
  }

  /** Just after the frame is drawn: the plate is that frame (the picture inside the pages' margins). */
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
    const { held, unwritten, kind, ...plate } = q;
    this.film.expose({ ...plate, thumb, held });
    this.book.save();
    if (thumb) this.model.setPhoto(thumb);
    this.game.events?.emit('photo.take', { kind: kind || 'nothing', stars: q.shot.stars, n: q.shot.subjects.length, kinds: q.shot.kinds, held, unwritten, left: this.film.left });
  }
  /** Appraise plates off the roll (all of them, or those ids): the darkroom's batch (the Codex calls it). */
  appraise(ids = null) { return appraise(this.game, this.book, this.film.take(ids)); }
  posOf(s) { return s.ref?.pos?.isVector3 ? s.ref.pos : s.ref?.body?.translation ? new THREE.Vector3().copy(s.ref.body.translation()) : s.ref?.center?.isVector3 ? s.ref.center : null; }

  // ---------------------------------------------------------------- animation and the hands
  animate(ch, base, dt) {
    const C = ch.clips;
    if (!this.track) { this.track = new Track(C, new Set(['castIdle'])); this.track.play('castIdle', 0, 0.01); this.P1 = C.pose(); }
    const layerW = Math.max(this.w * smooth(HOLD, 1, this.drawT), this.readW) * (1 - this.mgr.override);
    if (layerW <= 0.001) return;
    this.track.update(dt);
    C.blend(base, this.track.sample(this.P1), layerW, ch.MASK_UPPER, 0);
  }

  hands(ch) {
    if (!this.grip) return;
    const B = ch.bones, model = this.model, P = this.P, cam = this.game.camera;
    ch.root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const M = new THREE.Matrix4();
    const fp = P.fp;
    if (fp && this.drawT > 0.001) {
      // first person: the open book before the eye, rising from below the view as it is drawn; raised for the lens
      bookFrame(ch, P, cam, { mode: 'raise', k: this.lensK, fp: true }, M);
      M.multiply(_m2.makeTranslation(0, -0.45 * (1 - smooth(0, 0.7, this.drawT)), 0));
      this.holdW = smooth(0.4, 1, this.drawT);
    } else if (this.drawT > 0.001) {
      // third person: reached for at the hip, swung up in the right hand, opened and taken in both
      const phase = drawHands(ch, this.grip, holster, this.drawT, { hold: HOLD, twist: -8, lean: 6, via: [-0.3, 1.15, 0.35], out: M });
      if (phase !== 'reach' && phase !== 'worn') {
        M.multiply(SPINE_TO_GRIP);
        const k = smooth(0.55, 1, this.drawT);
        bookFrame(ch, P, cam, { mode: 'read' }, _m2);
        M.decompose(_p1, _q1, _s); _m2.decompose(_p2, _q2, _s);
        M.compose(_p1.lerp(_p2, k), _q1.slerp(_q2, k), _s.set(1, 1, 1));
        this.holdW = smooth(0.7, 1, this.drawT);
      } else this.holdW = 0;
    } else if (this.readW > 0) {
      // the Survey's read: out of the hip and open before her for a moment
      bookFrame(ch, P, cam, { mode: 'read' }, _m2);
      holster.decompose(_p1, _q1, _s); _m2.decompose(_p2, _q2, _s);
      const k = smooth(0, 0.6, this.readW);
      M.compose(_p1.lerp(_p2, k), _q1.slerp(_q2, k), _s.set(1, 1, 1));
      this.holdW = smooth(0.5, 1, this.readW);
    } else { M.copy(holster); this.holdW = 0; }
    if (!M.elements.every(Number.isFinite)) M.copy(holster);
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    model.group.updateMatrixWorld(true);
    if (this.holdW > 0.001 && !(fp && this.lensK > 0.6)) holdBook(ch, model, this.holdW, { fp });
  }

  fixed() {}
  reset() { this.lower(); this.readT = 0; }
}
