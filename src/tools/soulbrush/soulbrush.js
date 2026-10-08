// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH: the third of the Courier's psychic tools, a calligrapher's brush the size of a club, worn at the left hip like a
// sword in a sash and drawn across the body. It is three things, each from a game that did it best:
//
//  - a CLUB (tools/soulbrush/club.js): heavy blows that bat what they meet, a spin after a pause, a dive at a sprint, a held charge and
//    a slam; every swing flicks slip off the bristles (Splatoon's Inkbrush). LMB, and hold LMB. Its body is the Courier's suite (Brush_*).
//  - the BRUSH SLIDE: with the brush out, the core slide (C at speed) is the same slide, as fast and as long, but they ride it
//    sideways, low, the brush trailing behind them on the ground, and it paints a stroke of slip in their wake that they can dive into once
//    it has settled (Splatoon's Inkbrush dash and ink-swim; Jet Set Radio's tag-as-you-go). The core movement is untouched: only the
//    picture and the paint are the brush's.
//  - the CELESTIAL BRUSH (tools/soulbrush/celestial.js): hold RMB and the world stops and turns to paper; what they draw on it is read as a
//    shape ($P, multi-stroke: tools/soulbrush/gesture.js) and done to the world (tools/soulbrush/techniques.js, after Okami), and the marks over the
//    clapperjars' heads are taken off by drawing them (tools/soulbrush/sigils.js, after Magic Cat Academy).
//
//   G      draw / stow (the tool in the hands goes away first; X, Q draw theirs instead)          Z / MMB   lock on
//   LMB    the club: three blows (a pause after the second: the spin; sprinting: the dive); held on the ground, the bristles SATURATE
//          and the mode works (tools/soulbrush/load.js: 1 PAINT, 2 MOP); held in the air, the charge and the slam   RMB tap  FLICK
//   RMB    held: the Celestial Brush (LMB draws; let go of RMB to let the painting take)          C at speed  the Brush Slide
//
// It is a passive tech (it doesn't take the step from the core movement): it owns the upper body's pose while drawn (the suite's
// Brush_Idle: the brush laid back over the shoulder, the free arm swinging with the run when they move), the slide's look while sliding
// with it (Brush_BrushSlide), and the mouse while it is out. The engine's whole-body moves and the slams take the step through Launch.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RestBake } from '../../render/restbake.js';
import { Tech } from '../../courier/moves/techs.js';
import { Track } from '../../courier/anim/animator.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { BrushModel, BRUSH } from './model.js';
import { Club } from './club.js';
import { Celestial } from './celestial.js';
import { BrushCanvas } from './canvas.js';
import { BrushTechniques } from './techniques.js';
import { Sigils } from './sigils.js';
import { PaintPath } from '../../vfx/paintpath.js';
import { measureGrip, handFromTool } from '../grip.js';
import { drawHands } from '../draw.js';
import { hipMirror, mirrorSide } from '../heldtool.js';
import { fpToolMatrix } from '../viewmodel.js';
import { tickInscriptions, clearInscriptions } from './inscribe.js';
import { stream, randDir } from '../../core/rng.js';
import { BrushLoad } from './load.js';
import { BRUSH as LOAD_BRUSH } from '../../progress/brushload.js';
import { Crossfade, standLegs, legsW, liftAbove, floorUnder, closeHand } from '../toolbody.js';
const LOAD_MODES = LOAD_BRUSH.modes;
const simRand = stream('tools/soulbrush/soulbrush'); // (the simulation's chance: core/rng.js, the same twice)

const HOLD = T.weapon.drawGrab;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const PAINT_GLIDE = 2.2; // (a second's worth of the slide's lost speed given back on painted ground)
const IDLE = 'Brush_Idle', SLIDE = 'Brush_BrushSlide'; // (the suite's own stance and slide; stance:soulbrush and the authored brushSlide stand in without them)
// what of the brush must stay out of the ground (tool frame: along the haft, and a radius): the bristles' point, the head, the butt
const OFF_GROUND = [{ x: BRUSH.tip, r: 0.03 }, { x: 1.0, r: BRUSH.radius }, { x: BRUSH.back, r: 0.03 }];
const TAP = 0.16, SLIDE_STEP = 0.32, TRAIL_W = 0.62, TRAIL_WET = 14, TRAIL_SETTLE = 0.55;
const _m1 = new THREE.Matrix4(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion();

export class SoulBrush extends Tech {
  constructor(mgr) {
    super(mgr, 'soulbrush');
    this.passive = true;
    this.alwaysHands = true;
    this.overrides = 0;
    this.drawT = 0; this.drawTarget = 0; this.wasOut = false;
    const g = mgr.game;
    this.model = new BrushModel();
    this.model.group.visible = false;
    this.rest = new RestBake(this.model.group); // (at rest on the hip, one mesh a material: render/restbake.js)
    g.scene.add(this.model.group);
    this.club = new Club(this);
    this.load = new BrushLoad(this);
    this.canvas = new BrushCanvas();
    this.techniques = new BrushTechniques(this);
    this.celestial = new Celestial(this);
    this.sigils = new Sigils(g);
    this.paint = new PaintPath(g.scene, { wet: 0xe8ab86, dry: 0xb4603f, life: TRAIL_WET });
    this.rmbT = -1;
    this.slideW = 0; this.slideYaw = 0; this.sliding = false; this.slideDist = 0; this.lastDab = null; this.slideT = 0;
    this.lagY = 0; this.lagZ = 0; this.lagVy = 0; this.lagVz = 0;
  }

  // ---------------------------------------------------------------- what the rest of the game asks
  get engaged() { return this.drawT > 0.001; }
  get toolOut() { return this.drawTarget > 0 || this.drawT > 0.02; }
  get held() { return this.drawT >= 1; }
  get blocksFire() { return this.toolOut; }
  get stance() { return this.toolOut && (this.club.busy || this.celestial.active || this.load.busy); }
  get slow() { return this.toolOut && this.club.charge >= 0 ? 0.6 : 1; }

  // ---------------------------------------------------------------- where it is worn, and the grip
  computeSocket(ch) {
    this.grip = measureGrip(ch);
    // worn at the left hip, the grip forward and the head back and down behind them, as a sword is worn in a sash (a cross-draw)
    const B = ch.bones;
    const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
    ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
    ch.resetPose(); ch.root.updateMatrixWorld(true);
    const X = new THREE.Vector3(0.2, -0.42, -1).normalize(); // (along the haft: back, down, a little out)
    const Z = new THREE.Vector3(1, 0, 0).addScaledVector(X, -X.x).normalize(); // (the palm's side faces out from the hip)
    const Y = new THREE.Vector3().crossVectors(Z, X).normalize();
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(0.24, 0.98, 0.14);
    const { side, mirror } = hipMirror(this.game, 'soulbrush', 'L'); this.socketSide = side; this.mirrored = mirror;
    if (mirror) mirrorSide(G); // (the right hip, when a tool that wants the left was worn first: belt.hipSide)
    this.holsterLocal = B.spine.matrixWorld.clone().invert().multiply(G);
    ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ); ch.root.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- per frame
  tick(dt) {
    this.dt = dt;
    const P = this.P, g = this.game, inp = P.input, ch = g.character;
    if (ch && (!this.grip || this.game.belt?.hipSide('soulbrush') !== this.socketSide)) this.computeSocket(ch);
    const raw = g.rawDt || dt;
    if (this.enabled && inp.enabled) {
      const busy = !!this.mgr.active?.handsBusy || !!this.mgr.get?.('carry')?.item;
      if (inp.wasPressed('KeyG') && !g.god?.controlling && !busy && (this.drawTarget > 0 || g.belt?.ready('soulbrush') !== false)) { this.drawTarget = this.drawTarget > 0 ? 0 : 1; if (this.drawTarget) g.belt?.draw(g.belt.get('soulbrush')); }
      if (inp.wasPressed('KeyX') && this.drawTarget > 0) this.drawTarget = 0;
      if (busy && this.drawTarget > 0) { this.drawTarget = 0; this.resume = true; }
      else if (!busy && this.resume && !this.mgr.active) { this.resume = false; this.drawTarget = 1; }
    }
    if (!this.enabled || g.god?.controlling) this.drawTarget = 0;
    const free = g.belt ? g.belt.mayDraw(g.belt.get('soulbrush')) : true;
    const step = dt * (this.game.belt?.hands ?? 1) / (this.drawTarget > this.drawT ? T.weapon.drawTime * 1.15 : T.weapon.holsterTime);
    if (this.drawTarget > this.drawT && free) this.drawT = Math.min(this.drawTarget, this.drawT + step);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - step);
    if (this.drawT > 0.02 && !this.wasOut) { this.wasOut = true; sfx.toolDraw(); g.events?.emit('brush.draw', {}); }
    if (this.drawT <= 0.02 && this.wasOut) {
      this.wasOut = false; sfx.holster?.();
      this.club.cancel(); this.load.end(); this.celestial.exit('stow'); this.rmbT = -1;
      g.events?.emit('brush.stow', {});
    }
    if (this.drawTarget === 0 && this.club.busy) this.club.cancel(); // (being put away: a blow or a slam ends now, not frozen through the holster)
    // the brush's own inputs, once it is in the hand
    if (this.held && inp.enabled) {
      if (this.celestial.active) this.celestial.update(raw, inp);
      else {
        if (inp.wasPressed('Mouse1')) g.lock?.toggle();
        // RMB: a tap flicks, a hold opens the canvas
        if (inp.wasPressed('Mouse2') && !this.club.busy) this.rmbT = 0;
        if (this.rmbT >= 0) {
          this.rmbT += raw;
          if (!inp.isDown('Mouse2')) { this.rmbT = -1; this.flick(); }
          else if (this.rmbT >= TAP) {
            this.rmbT = -1;
            if (this.celestial.canEnter()) this.celestial.enter();
            else { sfx.fizzle?.(); g.hud?.lachrymaPulse?.(false); g.log?.say('info', 'Your mind is too dry to paint.', { key: 'brushdry', throttle: 3 }); }
          }
        }
        ['Digit1', 'Digit2'].forEach((k, i) => { if (inp.wasPressed(k)) this.load.setMode(LOAD_MODES[i]); }); // (the modes, as the Sondelass's forms)
        if (this.load.busy) this.load.update(raw, inp);
        else if (!this.sliding) this.club.update(dt, inp);
      }
    } else if (this.celestial.active) this.celestial.exit('stow');
    if (!this.held && this.load.busy) this.load.end();
    this.club.tick(dt);
    this.load.tick(dt);
    this.canvas.update(raw);
    this.techniques.update(dt);
    tickInscriptions(g, dt);
    this.sigils.update(dt, this.drawT > 0.5);
    this.slideTick(dt);
    this.paint.update(dt);
    // the ink in the head: Lachryma gathers while the canvas is open or a slam gathers, and drains back after
    // (while the load is worked, its look inks the tuft: vfx/brushload.js, driven from load.js)
    const ink = this.celestial.active ? 1 : this.club.charge >= 0 ? Math.min(1, this.club.charge / 1.1) : 0;
    if (!this.load.busy) this.model.setInk(THREE.MathUtils.damp(this.model.ink, ink, ink > this.model.ink ? 8 : 2, raw));
    const ch2 = g.character;
    this.model.group.visible = this.enabled && g.belt?.isWorn('soulbrush') !== false && !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && !g.god?.active; // (in the box: not on them)
    { const m = this.model; this.rest.update(raw, this.drawT === 0 && !this.sliding, `${Math.round(m.bendY * 100)}|${Math.round(m.bendZ * 100)}|${Math.round(m.ink * 100)}`); }
    const shells = document.getElementById('shells');
    if (shells && this.drawT > 0.02) shells.style.display = 'none';
    else if (shells && this.wasShellsHidden) shells.style.display = '';
    this.wasShellsHidden = this.drawT > 0.02;
  }

  /** RMB tapped: a fan of slip flung ahead, where they are looking (Splatoon's brush flick, at range), at the top of the throw
   *  (Brush_Flick: the club plays it). */
  flick() {
    if (!this.game.lachryma.spend(1, 'brushflick')) { sfx.fizzle?.(); return; }
    this.club.startFlick(() => this.flickFan());
  }
  flickFan() {
    const g = this.game, P = this.P;
    const f = P.lookDir(_v1).clone();
    const from = this.model.tipWorld(_v2).clone();
    for (let i = 0; i < 14; i++) {
      const d = f.clone().add(randDir(simRand, _v3).multiplyScalar(0.18)).normalize().multiplyScalar(12 + simRand() * 5);
      d.y += 2.5;
      g.shells?.addDroplet(from.clone(), d, 0.035 + simRand() * 0.03, true);
    }
    sfx.brushSwing?.(0.8);
    g.events?.emit('brush.flick', { by: 'courier' });
  }

  // ---------------------------------------------------------------- the Brush Slide
  slideTick(dt) {
    const P = this.P, g = this.game;
    const on = this.held && P.sliding && P.grounded && !this.mgr.active && !this.celestial.active;
    if (on && !this.sliding) {
      this.sliding = true; this.slideDist = 0; this.lastDab = null; this.slideT = 0;
      this.slideYaw = P.bodyYaw; this.club.cancel();
      g.events?.emit('brush.slide', { phase: 'start' });
    }
    if (!on && this.sliding) {
      this.sliding = false; this.paint.gap();
      g.events?.emit('brush.slide', { phase: 'end', dist: +this.slideDist.toFixed(1), secs: +this.slideT.toFixed(2) });
    }
    // (in first person the body faces the view: the slide keeps its core look, and the brush paints just behind them)
    this.slideW = THREE.MathUtils.damp(this.slideW, this.sliding && !P.fp ? 1 : 0, this.sliding ? 14 : 9, dt);
    if (!this.sliding) return;
    this.slideT += dt;
    let hs = Math.hypot(P.vel.x, P.vel.z);
    if (this.slideT < 0.05) this.slideEntry = hs;
    // on painted ground the slide runs on (Sunshine's belly slide on wet ground): it keeps the speed it came in with, no more
    const painted = g.paintmap?.at(P.pos.x, P.pos.y, P.pos.z), W = g.water?.at(P.pos.x, P.pos.y + 0.1, P.pos.z);
    g.brushLoad?.slide(dt, { pos: P.pos, vel: P.vel, surface: W ? 'water' : painted ? 'paint' : null, feeling: painted?.aspect || this.load.aspect }); // (the rooster tails: vfx/brushload.js)
    if (painted && hs > 1 && hs < (this.slideEntry || 0)) {
      const k = Math.min(this.slideEntry / hs, 1 + PAINT_GLIDE * dt); P.vel.x *= k; P.vel.z *= k; hs *= k;
    }
    if (hs > 0.5) {
      // sideways to the slide: their left (the lead foot) toward where they are going, the brush hand trailing
      const want = Math.atan2(P.vel.x, P.vel.z) - Math.PI / 2;
      this.slideYaw += wrap(want - this.slideYaw) * (1 - Math.exp(-dt * 14));
    }
    // paint: under the bristles, every few tens of centimetres
    const tip = P.fp ? _v1.set(P.pos.x - P.vel.x / (hs || 1) * 0.9, P.pos.y + 0.3, P.pos.z - P.vel.z / (hs || 1) * 0.9) : this.model.tipWorld(_v1);
    const down = g.physics.raycast(_v2.copy(tip).setY(Math.max(tip.y, P.pos.y) + 0.5), _v3.set(0, -1, 0), 1.4, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (!down || down.normal.y < 0.5) { this.paint.gap(); this.lastDab = null; return; }
    const d = this.lastDab ? this.lastDab.distanceTo(down.point) : Infinity;
    if (d >= SLIDE_STEP) {
      const dir = this.lastDab && d < 2 ? down.point.clone().sub(this.lastDab).normalize() : _v3.set(P.vel.x, 0, P.vel.z).normalize().clone();
      if (d > 2) this.paint.gap();
      this.paint.add(down.point, down.normal, dir, TRAIL_W * (0.85 + 0.15 * Math.min(1, hs / 8)));
      g.slip?.addDisc(down.point, down.normal, TRAIL_W * 0.55, TRAIL_WET * 0.85, TRAIL_SETTLE);
      if (this.lastDab && d < 2) this.slideDist += d;
      this.lastDab = down.point.clone();
      if (simRand() < 0.35) sfx.inkDab?.(0.35);
      if (simRand() < 0.5) g.fx.alpha.emit({ pos: down.point.clone().setY(down.point.y + 0.05), vel: new THREE.Vector3(-P.vel.x * 0.1, 0.8, -P.vel.z * 0.1), life: 0.4, size: 0.08, sizeEnd: 0.25, color: new THREE.Color(0xe8ab86), alpha: 0.35, drag: 3 });
    }
  }

  /** The slide faces sideways while the brush slides it. */
  faceYaw() { return this.sliding || this.slideW > 0.5 ? this.slideYaw : null; }

  /** The slide's pose, while the brush slides it: the suite's Brush_BrushSlide (the authored brushSlide without it: soulbrush/clips.js). */
  slidePose(ch, dt) {
    if (this.slideW < 0.01) return null;
    this.slidePoseBuf ||= ch.clips.pose();
    this.slideClipT = (this.slideClipT || 0) + dt;
    return { pose: ch.clips.sample(ch.clips.clips[SLIDE] ? SLIDE : 'brushSlide', this.slideClipT, this.slidePoseBuf), w: this.slideW };
  }

  // ---------------------------------------------------------------- animation: the upper body's clip layer
  animate(ch, base, dt) {
    const C = ch.clips, P = this.P;
    if (!this.track) {
      const idle = C.clips[IDLE] ? IDLE : C.clips['stance:soulbrush'] ? 'stance:soulbrush' : 'swordIdle'; // (the brush over their shoulder)
      this.track = new Track(C, new Set([idle, 'swordIdle', 'torchIdle', 'idle']));
      this.track.play(idle, 0, 0.01);
      this.P1 = C.pose(); this.P2 = C.pose(); this.xf = new Crossfade(C); this.xfLegs = new Crossfade(C, 0.15); this.legState = {}; this.freeW = 0;
      this.lower = Float32Array.from(ch.MASK_UPPER, (v) => 1 - v);
      this.mask = Float32Array.from(ch.MASK_UPPER); this.leftArm = C.bones.map((b, i) => (/L$/.test(b) && /arm|hand|f_|thumb/.test(b) ? i : -1)).filter((i) => i >= 0);
    }
    const layerW = this.w * smooth(HOLD, 1, this.drawT) * (1 - this.mgr.override) * (1 - this.slideW);
    const cl = this.club.pose(C, this.P2, dt); // (its clocks run on while the layer is away)
    if (layerW <= 0.001) { this.xf.reset(); this.xfLegs.reset(); return; }
    const tr = this.track;
    tr.update(dt);
    const layer = tr.sample(this.P1);
    if (cl) C.blend(layer, cl.pose, cl.w);
    this.xf.keyed(layer, this.club.playKey, dt); // (one blow straight into the next: tools/toolbody.js)
    // moving with nothing playing, the free hand comes off the hip and swings with their run
    this.freeW = THREE.MathUtils.damp(this.freeW, !cl && !this.club.playing && P.grounded && Math.hypot(P.vel.x, P.vel.z) > 1.2 ? 1 : 0, 8, dt);
    for (const i of this.leftArm) this.mask[i] = ch.MASK_UPPER[i] * (1 - this.freeW);
    C.blend(base, layer, layerW, this.mask, 0);
    this.club.moves.legs(ch, base, layerW, dt); // (standing to strike, the legs are the blow's: tools/moveset.js)
    const lg = this.club.legs;
    standLegs(ch, P, base, lg?.clip ?? null, layerW, this.legState, dt, { t: lg?.t ?? 0, loop: !!lg?.loop });
    this.xfLegs.keyed(base, this.club.playKey || 'stand', dt, this.lower, legsW(this.club.moves, this.legState) * layerW); // (the legs and hips through a join, too)
  }

  // ---------------------------------------------------------------- hands: the draw, the brush on the ground in a slide, the hair
  hands(ch) {
    if (!this.grip) return;
    const B = ch.bones, model = this.model, dt = this.dt || 1 / 60;
    ch.root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const M = new THREE.Matrix4();
    const phase = drawHands(ch, this.grip, holster, this.drawT, { hold: HOLD, twist: 22, lean: 12, via: [-0.35, 1.2, 0.45], pole: [-0.15, -0.35, 0.3], out: M });
    if (phase === 'held' && this.slideW > 0.01) {
      // in the slide: the hand where the clip puts it, turned so the haft runs down to the ground behind them (a light correction)
      const P = this.P, hp = new THREE.Vector3(), hq = new THREE.Quaternion();
      const o = new THREE.Vector3().setFromMatrixPosition(M);
      const back = new THREE.Vector3(-Math.sin(this.slideYaw + Math.PI / 2), 0, -Math.cos(this.slideYaw + Math.PI / 2)); // (behind: against the slide)
      const target = P.renderPos.clone().addScaledVector(back, 1.05).addScaledVector(new THREE.Vector3(Math.sin(this.slideYaw), 0, Math.cos(this.slideYaw)), -0.15);
      const down = this.game.physics.raycast(target.clone().setY(P.renderPos.y + 0.6), new THREE.Vector3(0, -1, 0), 1.6, P.collider, undefined, (c) => !c.isSensor());
      target.y = (down ? down.point.y : P.renderPos.y) + 0.06;
      const X = target.sub(o);
      const Z = new THREE.Vector3().setFromMatrixColumn(M, 2);
      // (only when the haft has a direction and the palm is not along it: a degenerate frame is a NaN, and a NaN in a bone ends up in the world)
      if (X.lengthSq() > 1e-4) {
        X.normalize();
        Z.addScaledVector(X, -Z.dot(X));
        if (Z.lengthSq() > 1e-4) {
          Z.normalize();
          const Y = new THREE.Vector3().crossVectors(Z, X);
          const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(o);
          handFromTool(this.grip, G, 'R', hp, 0, 0, 0, hq);
          if (Number.isFinite(hp.x + hp.y + hp.z + hq.x + hq.w)) { ch.reachHand('R', hp, hq, this.slideW); M.multiplyMatrices(B.handR.matrixWorld, this.grip.R); }
        }
      }
    }
    if (phase === 'held' && this.slideW < 0.5 && !this.P.fp) this.offGround(ch, M);
    if (this.P.fp && this.drawT > 0.001) fpToolMatrix(this.game.camera, { draw: Math.min(1, this.drawT / 0.6), ...this.club.fpArc() }, M);
    if (!M.elements.every(Number.isFinite)) M.copy(holster); // (never a NaN placed in the world)
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    // the two-handed holds (the charge, the slams, the paint): the free hand closed on the haft where the clip already has it
    if (phase === 'held' && !this.P.fp && this.slideW < 0.5) closeHand(ch, this.grip, M, (this.leftHold ||= {}), dt, { from: -0.35, to: 0.8 });
    // the hair lags: a spring on the head's motion in the brush's own frame (and drags flat in the slide)
    model.group.updateMatrixWorld(true);
    const v = this.club.tipVel;
    _q1.copy(model.group.quaternion).invert();
    const lv = _v1.copy(v).applyQuaternion(_q1);
    const ty = THREE.MathUtils.clamp(lv.y * 0.05, -0.7, 0.7) + (this.sliding ? 0.45 : 0), tz = THREE.MathUtils.clamp(-lv.z * 0.05, -0.7, 0.7);
    // (a stiff spring: stepped in small pieces, semi-implicitly, so a long frame cannot make it ring up and blow out to NaN)
    for (let left = Math.min(dt, 0.1); left > 1e-5; left -= 1 / 120) {
      const h = Math.min(left, 1 / 120);
      this.lagVy += ((ty - this.lagY) * 160 - this.lagVy * 14) * h; this.lagY += this.lagVy * h;
      this.lagVz += ((tz - this.lagZ) * 160 - this.lagVz * 14) * h; this.lagZ += this.lagVz * h;
    }
    if (!Number.isFinite(this.lagY + this.lagZ + this.lagVy + this.lagVz)) this.lagY = this.lagZ = this.lagVy = this.lagVz = 0;
    model.setBend(this.lagY, this.lagZ);
    model.group.updateMatrixWorld(true);
    this.club.afterHands(dt);
  }

  /** The suite's blows were made with a shorter brush: where one would put the head through the floor (the low upswing, a slam, the
   *  paint's sweep), the brush is turned up about the hand until it rests on the ground, and the hand follows (tools/toolbody.js). */
  offGround(ch, M) {
    const P = this.P, a = _v1.set(BRUSH.tip, 0, 0).applyMatrix4(M), b = _v2.set(BRUSH.back, 0, 0).applyMatrix4(M), low = a.y < b.y ? a : b;
    if (low.y > P.renderPos.y + 0.5) return;
    const floor = floorUnder(this.game, P, low.x, low.z, P.renderPos.y);
    if (liftAbove(M, OFF_GROUND, floor) <= 0) return;
    const hp = _v3, hq = _q1;
    handFromTool(this.grip, M, 'R', hp, 0, 0, 0, hq);
    if (!Number.isFinite(hp.x + hp.y + hp.z + hq.x + hq.w)) return;
    ch.reachHand('R', hp, hq, 1);
    M.multiplyMatrices(ch.bones.handR.matrixWorld, this.grip.R);
  }

  fixed() {}
  reset() { this.club.cancel(); this.celestial.exit('reset'); this.techniques.clear(); this.paint.clear(); this.sigils.clear(); clearInscriptions(this.game); }
}
