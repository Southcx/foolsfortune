// ---------------------------------------------------------------------------------------
// AN ABERRANT'S DATA DRAIN (plain name; South, 2026-10-30: "make the Puzzle Duel aberrant death animations a little more of a spectacle.
// We have data-drain like animations that I think we should employ when it comes to absorbing/vanquishing an Aberrant. Right now the
// fights conclude quite abruptly"): a won PvE duel's end, between the aberrant's own death (duelview/aberrants/) and the hero shot
// (duelshow.js victory): the world's data drain (vfx/datadrain.js) turned on the duel and aimed at the Pneuka Jar's mouth instead of the
// Veritome's lens. In beats (ABERRANT_DRAIN, real s on its own clock from its start, which is its own death's `drainAt`):
//   THE HUSK    0.00  what it was made of left standing where it died: cubes laid on its body's surface (its meshes where they stand,
//                     shown or not: datadrain.js surfacePoints), in its feeling's colour with the data's cyan and white, a fifth of them
//                     flipped to its opposite colour at any moment (the Comb's cells, vfx/aberrantlook.js), stuttering in steps; an
//                     aberrant with no death of its own is husked as it stands, and stripped below
//   THE BREAK   0.00  its aberrance cracking off it: a shell of the Comb's hex cells (the crackle break, vfx/crackbreak.js, in the bubble's
//                     'hex' face) in its opposite colour, crazing where three blows land, a breath of swell, and burst into tiles
//   THE HOLD    0.40  the held beat as it bursts: a hit-stop (the world's clock and this look's own all but stopped), a jolt, the glitch's DROP
//   THE MOUTH   0.45  the Pneuka Jar lifts and tips its mouth up toward it, its lid opened (its clip `open`, held: formdive.js `posed`)
//   THE BEAM    0.62  the data drain's beam (vfx/ribbonlight.js 'beam') grown out of the mouth and arced over the tsuitate's top to it; the
//                     screen's DRAIN pulled toward the mouth
//   THE STRIP   0.80  the husk's cubes lifting off at their own moments and spiralling down the beam into the mouth (a body still standing
//                     blinking out in steps as they go); the tsuitate's own pieces on its half dissolving into the same stream in a wave
//                     from its wall, its figurine first and the junk it threw on your half last
//   THE GULP    2.00  the last of it in; the Jar swallows (its clip `gulp`, and a squash and stretch), its glaze flashed, a shell of light
//                     in the drained feeling round it, a ring out on the ground and one round it; at 2.5 the hero shot
// THE CAMERA  two of the stage's cutaways (stage.js cutAway, their shots asked of this through duelshow.js cineShot), each a hard cut:
//   `aberrantDrain` the two of them in one low wide shot, the arc over the board between, craning up as it pours; `jarGulp` close on the
//   Jar in profile as the last of the stream comes down into it; then the hero shot's.
// THE SKIP  a tap or a key (not the pause, Tab, an F key or the Codex) after the first real second of the ending goes straight to the hero
//   shot. The view's alone: the session is busy through the ending and spends every key it reads, so the page's own pointer and key
//   events are listened to while the ending plays, and let go with it.
// `visual.glitch` off (as datadrain.js): no DROP, no screen DRAIN, no stutter and no blinking; the break, the beam and the stream still play.
// Never in a practice duel (Strawman's: nothing is drained, duelview/aberrants/strawman.js). Looks only: the session's close kills it.
// Programs: the drain's cubes', its beam's (the ribbons' one program), its lens rings', the bubble's and the bursts': nothing new.
//
// Prior art: .hack//Infection's Data Drain (CyberConnect2, 2002: the Protect Break shattered first, the field frozen a beat, the beam,
// the target stripped to polygons and drawn into the bracelet), Kirby's inhale (a stream drawn into a mouth, the swallow's squash and the
// puff after), Luigi's Mansion's Poltergust (what is caught drawn down a curve into the nozzle), Pokemon's capture (the ball's gulp and
// shake before the fanfare), Final Fantasy's cut to the victory pose; the squash and stretch of the Disney animators' bouncing ball.
//
//   const D = new AberrantDrain(view)   D.can() (a PvE duel's Jar out, no practice)   D.ending(own) -> the view's death job { age, dur,
//   step(age), end(), skip() } (own: the aberrant's own death or null)   D.shot(kind, u, out) ('aberrantDrain' | 'jarGulp': duelshow.js)
//   D.keep() (its objects, for the duel's instance)   D.clear() (the view's close)   ABERRANT_DRAIN (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T } from '../../core/config.js';
import { sfx } from '../../audio/sfx.js';
import { ribbonLightMaterial } from '../ribbonlight.js';
import { CrackleBreak } from '../crackbreak.js';
import { Bubble } from '../caster/bubble.js';
import { surfacePoints } from '../datadrain.js';
import { filmColour } from '../oxidation.js';
import { gemColour } from './pieces.js';
import { DUEL_VIEW, cellLocal, feelColour, sm, clamp01, hash } from './layout.js';

/** The beats (real s on the drain's own clock): lead (an aberrant with no death of its own, circled first), break (the shell's craze to
 *  its burst), hold (the held beat: real s, and this clock's rate through it), mouth and rise (the Jar lifting and tipping), beam and
 *  reach (its growth), strip, spread (the husk's cubes' stagger), fly (each cube's flight), wave (the pieces' stagger from the wall),
 *  flyPiece, gulp, done; skipAfter (real s into the whole ending). Sizes (m): husk and pieces (cubes), lift, tip (the share of the way
 *  its mouth turns to the stream), over (the arc's height over the tsuitate's top), forward (its middle toward the camera), beamW,
 *  swirl (the spiral's radius), squash (the gulp's). */
export const ABERRANT_DRAIN = {
  lead: 0.5, break: 0.4, hold: { dur: 0.16, rate: 0.06 }, mouth: 0.45, rise: 0.3, beam: 0.62, reach: 0.22, strip: 0.8, spread: 0.6, fly: 0.6,
  wave: 0.5, flyPiece: 0.62, gulp: 2.0, done: 2.5, skipAfter: 1.0,
  husk: 220, pieces: 140, lift: 0.38, tip: 0.85, over: 0.45, forward: 0.35, beamW: 0.24, swirl: 0.2, squash: 0.12,
};
const A = ABERRANT_DRAIN, SEG = 48, CYAN = new THREE.Color(0x46f0ff), WHITE = new THREE.Color(0xffffff), GALL = feelColour('gall');
const KEPT = /^(Escape|Tab|F\d+|KeyB)$/; // (what never skips: the pause, the tuning panel, QAIS, the Codex: the session's own KEYS_KEPT)
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color(), _l = new THREE.Vector3();
const _s1 = new THREE.Vector3(), _s2 = new THREE.Vector3(), _s3 = new THREE.Vector3(), _s4 = new THREE.Vector3(), _s5 = new THREE.Vector3(), _s6 = new THREE.Vector3();

/** A colour's opposite as the aberrant's look draws it (its hue half the wheel round, its lightness kept); a near grey takes the data's cyan. */
function opposite(c, out) {
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  return mx - mn < 0.08 ? out.copy(CYAN) : out.setRGB(mx + mn - c.r, mx + mn - c.g, mx + mn - c.b);
}
/** A piece's colour as it goes into the stream. */
function pieceColour(v, feel, out) {
  if (v.kind === 'gem') return gemColour(v.colour, out);
  if (v.kind === 'body') return out.copy(feel);
  if (v.slime) return out.copy(GALL);
  if (v.kind === 'ember') return out.setHex(0xff6a2a);
  if (v.kind === 'orb') return filmColour(v.seed || 0, out);
  if (v.kind === 'stone') return out.setHex(0xa8a296);
  return out.setHex(0x8a6c58); // (junk: its clay)
}
const easeIn = (x) => { x = clamp01(x); return x * x * (1.6 - 0.6 * x); };
const easeOut = (x) => { x = clamp01(x); return 1 - (1 - x) * (1 - x) * (1 - x); };

export class AberrantDrain {
  constructor(view) {
    this.view = view; this.game = view.game; this.run = null; this.job = null; this.hidBody = null; this.onDown = null; this.onKey = null;
    const g = (this.group = new THREE.Group()); g.name = 'duel-aberrant-drain'; g.visible = false; g.userData.zoneFree = true;
    const N = A.husk + A.pieces;
    this.cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'duel-drain-cubes', toneMapped: false }), N); // (the drain's cubes' program: solid and unlit)
    this.cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    this.cubes.frustumCulled = false; this.cubes.count = 0;
    // the beam: a strip along the arc, turned to the camera at each of its points, its uv's x across and y along (the drain's beam look)
    const geo = new THREE.BufferGeometry(), idx = [];
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 6), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 4), 2).setUsage(THREE.DynamicDrawUsage));
    for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx);
    this.beamU = { uT: { value: 0 }, uK: { value: 0 } };
    this.beam = new THREE.Mesh(geo, ribbonLightMaterial('beam', this.beamU, { name: 'duel-drain-beam', toneMapped: false })); // (the ribbons' one program, as the drain's beam: vfx/ribbonlight.js)
    this.beam.frustumCulled = false; this.beam.renderOrder = 2;
    // the rings out at the gulp: the drain's lens rings' material (vfx/datadrain.js plain), so their program is that one
    const plain = () => new THREE.MeshBasicMaterial({ name: 'duel-drain-ring', color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide, forceSinglePass: true });
    this.floorRing = new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 64), plain()); this.floorRing.rotation.x = -Math.PI / 2;
    this.airRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), plain());
    g.add(this.cubes, this.beam, this.floorRing, this.airRing);
    this.game.scene?.add(g);
    // the aberrance's shell (the crackle break, its own: the world's drain keeps its own) and the gulp's shell of light round the Jar
    this.crackle = new CrackleBreak(this.game); this.crackle.make();
    for (const o of [this.crackle.bubble?.object, this.crackle.shards]) if (o) o.userData.zoneFree = true;
    this.glow = new Bubble({ shape: 'sphere', radius: 1, cell: 0.3, pattern: 'clear', tint: 0xffffff, rim: 0xffffff, film: 0.15, k: 0 });
    this.glow.object.visible = false; this.glow.object.userData.zoneFree = true; this.game.scene?.add(this.glow.object);
  }

  /** What the duel's instance must draw of this (render/duelinstance.js, through the view's instanceKeep). */
  keep() { return [this.group, this.glow.object, this.crackle.bubble?.object, this.crackle.shards].filter(Boolean); }

  /** Whether a won duel's end is drained: a PvE duel's (the show on, the Jar at your spot), the foe there, never a practice duel. */
  can() {
    const V = this.view, g = this.game, f = V.foe;
    if (!V.isOpen || !f?.pos || !V.show?.on || !V.show.jarShown?.() || !V.dive?.jar) return false;
    return !(g.duel?.practice || f.practice || V.state?.practice || f.kind === 'strawman');
  }

  /** The whole ending as the view's death job: its own death (`own`, or a short circling lead when it has none), the drain from its
   *  `drainAt` (its own tail still playing), then the hero shot; a tap or a key after skipAfter goes to the hero shot at once. */
  ending(own) {
    const V = this.view; this.clear();
    const at = own ? Math.min(own.dur, own.drainAt ?? own.dur) : A.lead;
    let ownEnded = !own, hero = false, last = 0, started = false;
    const endOwn = () => { if (!ownEnded) { ownEnded = true; own.end?.(); } };
    const job = { age: 0, dur: at + A.done + A.hold.dur + 3 }; // (set again when the hero shot starts)
    const toHero = () => { if (hero) return; hero = true; endOwn(); this.finish(); this.listen(null); job.dur = job.age + (V.show?.victory?.() || 0); };
    job.step = (age) => {
      const dt = Math.max(0, age - last); last = age;
      if (!ownEnded && age < own.dur) own.step?.(age); else endOwn();
      if (hero) return;
      if (age >= at) { if (!started) { started = true; this.begin(); } this.tick(dt); if (!this.run || this.run.done) toHero(); }
    };
    job.end = () => { endOwn(); this.finish(); this.listen(null); this.job = null; };
    job.skip = () => { if (!hero && job.age >= A.skipAfter) toHero(); };
    V.stage?.cutAway('death', at + 0.45); // (circled low round it as it goes: duelshow.js; the drain's cut comes before this eases out)
    this.job = job; this.listen(job);
    return job;
  }

  /** The page's own pointer and key presses heard while the ending plays (the session spends the game's): one skips. */
  listen(job) {
    if (this.onDown) { removeEventListener('pointerdown', this.onDown, true); removeEventListener('keydown', this.onKey, true); this.onDown = this.onKey = null; }
    if (!job) return;
    this.onDown = () => job.skip(); this.onKey = (e) => { if (!e.repeat && !KEPT.test(e.code)) job.skip(); };
    addEventListener('pointerdown', this.onDown, true); addEventListener('keydown', this.onKey, true);
  }

  /** The drain begun where its own death left it: the husk sampled, the shell set round it, the cut to the two of them. */
  begin() {
    const V = this.view, g = this.game, f = V.foe, J = V.dive?.jar || null, root = f?.root || f?.model?.group || null;
    if (!f?.pos) { this.run = null; return; }
    const feel = feelColour(V.aspect, new THREE.Color()), opp = opposite(feel, new THREE.Color());
    const pts = surfacePoints({ pos: f.pos, radius: f.radius, height: f.height, root }, A.husk);
    const centre = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, pts.length));
    const B = V.board3, top = V.frame.localToWorld(_a.set(0, DUEL_VIEW.base + B.h * DUEL_VIEW.cs + DUEL_VIEW.border, 0)).y;
    const R = (this.run = {
      t: 0, real: 0, holdTo: -1, done: false, flags: {}, glitch: T.visual?.glitch !== false, spin: Math.random() * 6.28,
      feel, opp, feelHex: feel.getHex(), pts, seed: pts.map(() => Math.random()), base: pts.map((_, i) => (i % 9 === 4 ? CYAN : i % 13 === 6 ? WHITE : feel)),
      centre, top, root, shown: !!root && root.visible !== false && f.model?.visible !== false,
      jar: J, mouth: new THREE.Vector3(), ctrl: new THREE.Vector3(), pieces: this.pieces(feel), used: 0,
    });
    if (J) {
      R.yaw = J.group.rotation.y; R.qYaw = new THREE.Quaternion().setFromAxisAngle(UP, R.yaw); R.scale0 = J.group.scale.clone();
      const s = R.scale0.y || 1; R.jarMid = 0.45 * s; R.jarR = 0.55 * s; // (by its scale, its head at 0.85 as duelshow.js frames it: a box of its group takes in the 2.4 m halo, godhand/jar.js)
      V.dive.mouth(R.mouth);
    } else R.mouth.copy(V.dive?.spot?.(_a) || centre).addScaledVector(UP, 1);
    this.arcControl();
    this.crackle.play(f, A.break, { pattern: 'hex', tint: opp.getHex(), rim: 0x46f0ff, film: 0.2, colours: [feel, opp, CYAN, WHITE] }); // (its aberrance, the Comb's cells in its opposite colour)
    this.glow.set({ tint: R.feelHex, rim: R.feelHex, k: 0 }); this.floorRing.material.color.copy(feel); this.airRing.material.color.copy(feel).lerp(WHITE, 0.3);
    this.group.visible = true; this.cubes.count = A.husk;
    V.stage?.cutAway('aberrantDrain', A.gulp + 0.6, { cut: true });
    sfx.duelDrainBreak?.(); // (the aberrance cracking off it: Wanda's, timed to ABERRANT_DRAIN.break)
  }

  /** The tsuitate's pieces the stream takes: on its half, its figurine, and the junk it threw on yours; a wave from its wall. */
  pieces(feel) {
    const V = this.view, B = V.board3, line = V.lineCol ?? B.line, out = [];
    for (const v of V.pieces?.list || []) {
      if (v.kind === 'body') { if (v.side === 1) out.push({ v, idol: true, delay: 0 }); continue; }
      const junk = v.kind === 'junk' || v.kind === 'ember' || v.kind === 'stone' || v.slime;
      if (v.cx >= line || junk) out.push({ v, delay: ((B.w - 1 - v.cx) / Math.max(1, B.w - 1)) * A.wave + 0.06 * hash(v.cx, v.cy) });
    }
    for (const p of out) p.col = pieceColour(p.v, feel, new THREE.Color());
    return out;
  }

  /** The arc's middle: over the tsuitate's top between the mouth and the husk, a little toward the camera. */
  arcControl() {
    const R = this.run, V = this.view;
    R.ctrl.copy(R.mouth).lerp(R.centre, 0.5).addScaledVector(V.face, A.forward);
    R.ctrl.y = 2 * (R.top + A.over) - 0.5 * (R.mouth.y + R.centre.y); // (a quadratic's peak is half its control's height and a quarter each end's)
  }
  arc(s, out) { const R = this.run, v = 1 - s; return out.copy(R.mouth).multiplyScalar(v * v).addScaledVector(R.ctrl, 2 * v * s).addScaledVector(R.centre, s * s); }
  tangent(s, out) { const R = this.run; return out.copy(R.ctrl).sub(R.mouth).multiplyScalar(2 * (1 - s)).addScaledVector(_b.copy(R.centre).sub(R.ctrl), 2 * s).normalize(); }
  /** A point on the stream at s, turned round the beam by angle a at radius r. */
  spiral(s, a, r, out) {
    this.arc(s, out); if (r <= 0) return out; this.tangent(s, _t);
    _n1.crossVectors(_t, UP); if (_n1.lengthSq() < 1e-4) _n1.crossVectors(_t, this.view.face); _n1.normalize(); _n2.crossVectors(_t, _n1);
    return out.addScaledVector(_n1, Math.cos(a) * r).addScaledVector(_n2, Math.sin(a) * r);
  }

  /** One frame of the drain (real dt). Its own clock runs slow through the held beat. */
  tick(dt) {
    const R = this.run; if (!R) return; const V = this.view, g = this.game;
    R.real += dt; const ldt = R.real < R.holdTo ? dt * A.hold.rate : dt; R.t += ldt; const t = R.t;
    const once = (k, fn) => { if (!R.flags[k]) { R.flags[k] = true; fn(); } };
    const vk = V.cutIn?.veilK; if (vk > 0.001) V.cutIn.veil(vk * (1 - sm(R.real / 0.3))); // (a death held in the dark gives the light back as the drain begins)
    this.crackle.update(ldt);
    if (t >= A.break) once('pop', () => { // (the held beat: the shell's tiles hang in the air)
      R.holdTo = R.real + A.hold.dur; g.time?.pulse?.('duel.drain', 0.05, A.hold.dur, { release: 0.1 }); V.stage?.jolt?.(0.7);
      if (V.juice) V.juice.hold = Math.max(V.juice.hold || 0, A.hold.dur);
      if (R.glitch) g.glitch?.drop?.(8);
    });
    if (t >= A.mouth) once('mouth', () => { V.dive.posed = true; V.dive.clips?.play('open', { again: true }); });
    this.poseJar(t);
    if (R.jar) V.dive.mouth(R.mouth);
    this.arcControl();
    if (t >= A.beam) once('beam', () => { sfx.duelDrainBeam?.(); if (R.glitch) g.glitch?.pulse?.({ drain: 1, split: 0.35, crush: 0.55, dur: A.gulp - A.beam, at: R.mouth.clone() }); }); // (the beam out of the mouth: Wanda's, held to the gulp)
    for (const p of R.pieces) if (!p.gone && t >= A.strip + p.delay) this.take(p, true);
    this.drawBeam(t); this.drawCubes(t); this.stripBody(t);
    if (t >= A.gulp - 0.15) once('gulpShot', () => V.stage?.cutAway('jarGulp', A.done - A.gulp + 0.75, { cut: true }));
    if (t >= A.gulp) once('gulp', () => this.gulp());
    this.drawGulp(t, ldt);
    if (t >= A.done) R.done = true;
  }

  /** The Jar lifted and tipped toward the stream's last stretch while it drinks; a squash and stretch at the gulp; its glaze flashed. */
  poseJar(t) {
    const R = this.run, J = R.jar, V = this.view; if (!J) return;
    const up = sm((t - A.mouth) / A.rise) * (1 - sm((t - A.gulp - 0.08) / 0.4));
    V.dive.spot(_p); J.group.position.copy(_p).addScaledVector(UP, A.lift * up);
    _a.copy(R.ctrl).sub(_p.addScaledVector(UP, R.jarMid * 2)).normalize();
    _q.setFromUnitVectors(UP, _b.copy(UP).lerp(_a, A.tip * up).normalize());
    J.group.quaternion.copy(_q).multiply(R.qYaw);
    const u = t - A.gulp, pre = u < 0 ? 0.6 * sm((u + 0.14) / 0.14) : 0, v = u >= 0 ? -Math.exp(-6 * u) * Math.cos(13 * u) : pre * 0.6; // (stretched toward the stream, then squashed and wobbling home)
    const k = A.squash * v; J.group.scale.copy(R.scale0).multiply(_s.set(1 - 0.5 * k, 1 + k, 1 - 0.5 * k));
    J.flash = u >= 0 ? Math.max(0, 1 - u / 0.5) : 0;
  }

  /** A piece taken off the board: a puff at its cell and, while there is room, a cube of its colour into the stream. */
  take(p, stream) {
    const V = this.view, R = this.run, P = V.pieces, v = p.v; p.gone = true;
    cellLocal(v.x, v.y, V.board3, _l);
    V.bursts?.burst?.(_l, p.col.getHex(), p.idol ? 10 : 3, { speed: p.idol ? 1 : 0.6, life: 0.35, fall: -1.2, size: 0.022, spread: 0.3 });
    P?.remove?.(v); // (its figurine too: the next duel's board is built afresh)
    if (!stream || !R || R.used >= A.pieces) return;
    p.i = A.husk + R.used++; p.t0 = R.t; p.from = V.frame.localToWorld(_l.clone());
    const ac = _a.copy(R.centre).sub(R.mouth), l2 = Math.max(1e-4, ac.lengthSq());
    p.sJ = THREE.MathUtils.clamp(_b.copy(p.from).sub(R.mouth).dot(ac) / l2, 0.08, 0.95); // (where it meets the stream: over its own column)
    this.cubes.count = A.husk + R.used;
  }

  /** The beam: out of the mouth along the arc as it reaches, held, gone with the last of the data. */
  drawBeam(t) {
    const R = this.run, cam = this.game.camera, reach = sm((t - A.beam) / A.reach), k = reach * (1 - sm((t - (A.gulp - 0.15)) / 0.25));
    this.beam.visible = k > 0.002 && !!cam; if (!this.beam.visible) return;
    const P = this.beam.geometry.attributes.position, U = this.beam.geometry.attributes.uv; let run = 0;
    for (let i = 0; i <= SEG; i++) {
      const s = (i / SEG) * reach; this.arc(s, _p); if (i) run += _p.distanceTo(_s1); _s1.copy(_p);
      this.tangent(s, _t); _n1.crossVectors(_t, _b.copy(cam.position).sub(_p)).normalize();
      const w = 0.5 * A.beamW * (0.45 + 0.55 * sm(i / 6)) * (0.92 + 0.08 * Math.sin(R.real * 40));
      P.setXYZ(i * 2, _p.x - _n1.x * w, _p.y - _n1.y * w, _p.z - _n1.z * w); P.setXYZ(i * 2 + 1, _p.x + _n1.x * w, _p.y + _n1.y * w, _p.z + _n1.z * w);
      U.setXY(i * 2, 0, run / 3); U.setXY(i * 2 + 1, 1, run / 3); // (its stripes run toward the mouth, about five a metre, as the drain's)
    }
    P.needsUpdate = true; U.needsUpdate = true; this.beam.geometry.computeBoundingSphere();
    this.beamU.uT.value = R.real; this.beamU.uK.value = k;
  }

  /** The cubes: the husk standing on its body, each lifting off at its moment down the stream; the pieces' after them. */
  drawCubes(t) {
    const R = this.run, M = this.cubes, step = Math.floor(R.real * 8), flip = Math.floor(R.real * 2.2);
    const shown = R.shown ? sm((t - A.beam) / 0.15) : sm(t / 0.12); // (a body still standing wears its cubes from the beam; one gone shows them at once)
    for (let i = 0; i < R.pts.length; i++) {
      const s = R.seed[i], e = clamp01((t - A.strip - s * A.spread) / A.fly);
      const along = 0.95 * (1 - easeIn(e)), r = A.swirl * Math.sin(Math.PI * Math.min(1, e * 1.15)) * (0.5 + 0.5 * s);
      this.spiral(along, R.spin + s * 40 + e * 9, r, _p).sub(R.pts[i]).multiplyScalar(sm(e / 0.3)).add(R.pts[i]);
      const flick = R.glitch && hash(i * 0.37, step) < (e > 0 ? 0.08 + 0.3 * (1 - e) : 0.16) ? 0 : 1; // (stuttering in the glitch's steps, never a frame's)
      const size = (0.05 + 0.07 * s) * (1 - 0.7 * e) * flick * shown * (e >= 0.999 ? 0 : 1);
      _q.setFromEuler(_e.set(s * 6 + R.real * 4, s * 9, 0)); M.setMatrixAt(i, _m.compose(_p, _q, _s.set(size, size, size)));
      const flipped = e <= 0 && hash(i * 1.7, flip + s * 7) < 0.2; // (a fifth of the Comb's cells flipped to its opposite while it stands)
      M.setColorAt(i, _c.copy(flipped ? R.opp : R.base[i]).multiplyScalar(1.25 + 0.5 * e));
    }
    for (const p of R.pieces) {
      if (p.i == null) continue;
      const e = clamp01((t - p.t0) / A.flyPiece), along = p.sJ * (1 - easeIn(e)), r = A.swirl * 0.8 * Math.sin(Math.PI * e);
      this.spiral(along, R.spin + p.i * 2.3 + e * 8, r, _p).sub(p.from).multiplyScalar(easeOut(e / 0.35)).add(p.from);
      const size = 0.065 * (1 - 0.65 * e) * (e >= 0.999 ? 0 : 1) * (p.idol ? 2.2 : 1);
      _q.setFromEuler(_e.set(p.i + R.real * 5, p.i * 0.7, 0)); M.setMatrixAt(p.i, _m.compose(_p, _q, _s.set(size, size, size)));
      M.setColorAt(p.i, _c.copy(p.col).multiplyScalar(1.3));
    }
    M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
  }

  /** A body still standing (an aberrant with no death of its own) blinks out in steps as its cubes go, and is gone. */
  stripBody(t) {
    const R = this.run; if (!R.shown || !R.root || t < A.strip) return;
    const keep = 0.8 - 0.75 * sm((t - A.strip) / 0.7), gone = t >= A.strip + 0.7;
    R.root.visible = gone ? false : R.glitch ? hash(Math.floor(R.real * 8), R.spin) < keep : true;
    if (gone) this.hidBody = R.root;
  }

  /** The gulp: its clip, a puff of the feeling from its mouth, a jolt. */
  gulp() {
    const R = this.run, V = this.view, F = V.frame;
    V.dive.clips?.play('gulp', { again: true, from: 7 }); // (in at its swallow: the lid already open, as a Figment's bind, pneukajarclips.js)
    sfx.duelGulp?.(); // (the Jar's gulp: Wanda's, at its swallow)
    V.stage?.jolt?.(0.35);
    const k = 1 / (F.scale.x || 1), at = F.worldToLocal(_l.copy(R.mouth)); // (the bursts stand in the board's frame, drawn in at the arena's scale)
    V.bursts?.burst?.(at, R.feelHex, 18, { speed: 1.5 * k, life: 0.55, fall: 1.5 * k, spread: 0.3 * k, size: 0.035 * k });
    V.bursts?.burst?.(at, 0xffffff, 6, { speed: 0.8 * k, life: 0.3, fall: 0, spread: 0.2 * k, size: 0.03 * k });
  }

  /** After the gulp: the shell of light in the drained feeling round the Jar, and the rings out. */
  drawGulp(t, ldt) {
    const R = this.run, J = R.jar, u = t - A.gulp, cam = this.game.camera;
    const k = u >= 0 ? sm(u / 0.05) * (1 - sm((u - 0.05) / 0.45)) : 0;
    this.glow.object.visible = k > 0.003 && !!J;
    if (this.glow.object.visible) { J.group.getWorldPosition(_p).addScaledVector(UP, R.jarMid); this.glow.set({ pos: _p, radius: R.jarR * (1 + 0.12 * sm(u / 0.3)), k: 0.9 * k }); this.glow.update(ldt); }
    const f = clamp01(u / 0.55), a = clamp01((u - 0.04) / 0.45);
    this.floorRing.visible = u >= 0 && f < 1; this.airRing.visible = u >= 0 && a < 1 && !!cam;
    if (this.floorRing.visible) { this.view.dive.spot(_p); this.floorRing.position.copy(_p).setY(_p.y + 0.04); this.floorRing.scale.setScalar(0.3 + 2.1 * easeOut(f)); this.floorRing.material.opacity = 0.85 * Math.pow(1 - f, 1.5); }
    if (this.airRing.visible && J) { J.group.getWorldPosition(_p).addScaledVector(UP, R.jarMid); this.airRing.position.copy(_p); this.airRing.lookAt(cam.position); this.airRing.scale.setScalar(R.jarR * (0.8 + 1.8 * easeOut(a))); this.airRing.material.opacity = 0.75 * Math.pow(1 - a, 1.3); }
  }

  /** The drain put away (its end, a skip, the view's close): the Jar as it stood, whatever pieces were left taken, the looks hidden. */
  finish() {
    const R = this.run; if (!R) return; const V = this.view;
    for (const p of R.pieces) if (!p.gone) this.take(p, false);
    if (R.shown && R.root && R.root.visible !== false) { R.root.visible = false; this.hidBody = R.root; }
    const J = R.jar; if (J) { J.group.quaternion.setFromAxisAngle(UP, R.yaw); J.group.scale.copy(R.scale0); J.group.position.copy(V.dive.spot(_p)); J.flash = 0; }
    if (V.dive) V.dive.posed = false;
    this.crackle.stop(); this.group.visible = false; this.glow.object.visible = false; this.glow.set({ k: 0 });
    this.beam.visible = false; this.floorRing.visible = this.airRing.visible = false; this.cubes.count = 0; this.beamU.uK.value = 0;
    this.run = null;
  }

  /** The view closed (or a new ending): everything put back, the body this hid shown again for the world's own end of it. */
  clear() {
    this.listen(null); this.job = null; this.finish();
    const f = this.view.foe, B = this.hidBody; this.hidBody = null;
    if (B && f?.alive !== false && (B === f?.root || B === f?.model?.group)) B.visible = true;
  }

  /** A cutaway's shot (stage.js through duelshow.js cineShot): `kind` at `u` (0..1 through it) into out.pos, out.look, out.fov, out.roll. */
  shot(kind, u, out) {
    const V = this.view, R = this.run, face = V.face, uu = _s1.copy(V.u).setY(0).normalize();
    const jar = V.dive?.spot?.(_s2) || _s2.copy(V.centre).addScaledVector(uu, -2.3), foe = V.foe?.pos ? _s3.copy(V.foe.pos).setY(jar.y) : _s3.copy(V.centre).addScaledVector(uu, 2.3);
    if (kind === 'aberrantDrain') { // (the two of them, low and wide, the arc over the board between: craning up a little as it pours)
      const mid = _s4.copy(jar).lerp(foe, 0.5), span = jar.distanceTo(foe), top = R?.top ?? jar.y + 2.4;
      out.look.copy(mid).setY(jar.y + 0.5 * (top - jar.y) + 0.15 * u).addScaledVector(uu, -0.08 * span * u);
      out.pos.copy(mid).addScaledVector(face, span * 0.68 + 1.25).addScaledVector(uu, -span * 0.1).setY(jar.y + 0.45 + 0.3 * u);
      out.fov = 6; out.roll = -0.035 + 0.02 * u; return out;
    }
    if (kind === 'jarGulp') { // (close on the Jar in profile from the board's side, the stream coming down into it from the upper right)
      const m = R?.jar ? V.dive.mouth(_s5) : _s5.copy(jar).setY(jar.y + 1), dir = _s6.copy(face).multiplyScalar(0.92).addScaledVector(uu, -0.4).normalize(), d = 2.1 - 0.35 * u;
      out.look.copy(m).addScaledVector(UP, -0.12); out.pos.copy(jar).addScaledVector(dir, d).setY(m.y + 0.1);
      out.fov = -6; out.roll = 0.03; return out;
    }
    return null;
  }
}
