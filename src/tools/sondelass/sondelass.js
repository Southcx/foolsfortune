// ---------------------------------------------------------------------------------------
// THE SONDELASS: a telescoping instrument that is a fishing rod, a cutlass and a grapple hook, worn on the Courier's back
// parallel to the Psygun and drawn the same way (the hand reaches back, grabs, whips it round). The first melee tool, and the way
// into angling (src/tools/sondelass/angling/). It is a passive tech: it doesn't take the step from the core movement, so you run, jump and slide
// with it out; it owns only the right arm's pose while it is drawn, and puts the Psygun away.
//
//   Q     draw / stow (the Psygun goes away first; X also stows it)           1 / 2 / 3   CUTLASS / ROD / HOOK
//   CUTLASS  LMB the loadout's string · RMB the special (the Stinger) · crouched, hold RMB: the iaido into Blade Mode · MMB lock on · V hold:
//            guard, in time: parry · E (the blink) cancels any move
//   ROD      hold LMB to charge a cast, release to throw · 4-0 / wheel: the lure's aspect (each once known) · - / =: the lure tied on ·
//            wheel (lure out): its depth · RMB sinks it · MMB sounds
//            a fish on: the movement keys are the rod's (A/D lean, S haul, W bow, C brace), LMB reels, RMB gives line
//   HOOK     LMB fires the grapnel: it bites, and the line stays. Hold LMB to reel (yourself to an anchor, a loose thing to you),
//            hold RMB to pay out, tap RMB to let go, Space to jump off it; A/D/W/S pump a swing (tools/sondelass/grapple.js)
//
// Prior art, and what was taken:
//  - Animation: the tool is glued to the animated hand (a socket measured from the CC0 Universal Animation Library's own sword
//    pose, where the blade lies along the knuckle line), so every UAL sword clip (Sword_Regular_A/B/C, Sword_Attack, Sword_Idle,
//    baked in scripts/bake_anims.mjs) carries it with no IK. The rod's cast is Sword_Regular_C re-timed: held at the raised frame
//    while a cast charges, played on release. IK is only the draw, the free hand closing on the reel, and the hook's aim.
//  - Zelda's Hookshot / Just Cause's grapple: the hook flies fast, then the line draws you in at a constant speed and lets go
//    with a hop; jump cancels and keeps the momentum.
//  - Monster Hunter's weapon-form switch: one instrument, three shapes, the sections sliding in and out between them.
//  - The drawn run (drawnRun): Ghost of Tsushima's and Sekiro's run with the blade out, Monster Hunter's sword-and-shield run with the
//    weapon drawn: the run's own body, the blade carried low and back (a stance baked over the run, courier/anim/stances.js).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RestBake } from '../../render/restbake.js';
import { Tech } from '../../courier/moves/techs.js';
import { Track } from '../../courier/anim/animator.js';
import { sfx } from '../../audio/sfx.js';
import { T } from '../../core/config.js';
import { SondelassModel } from './model.js';
import { Cutlass } from './cutlass.js';
import { Hookshot } from './hookshot.js';
import { Angler } from './angling/angler.js';
import { measureGrip, handFromTool, easeGrip } from '../grip.js';
import { drawHands } from '../draw.js';
import { fpToolMatrix } from '../viewmodel.js';
import { buildLure } from './angling/luremodels.js';

const HOLD = T.weapon.drawGrab;
/** The hook's aim (hands()): the forearm `fore` degrees below the shaft's line, the hand `reach` m along it from the shoulder and `out` m to
 *  the aim's right. */
const AIM = { fore: 60, reach: 0.46, out: 0.06 };
const AXIS_X = new THREE.Vector3(1, 0, 0), AXIS_Z = new THREE.Vector3(0, 0, 1); // (a handle's axis in the tool's frame: the haft; the crank knob's stem)
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4(), _m4 = new THREE.Matrix4();
const _m1 = new THREE.Matrix4(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion();

export const FORMS = [
  { id: 'cutlass', name: 'CUTLASS', glyph: '⚔', ext: 0, blade: 1 },
  { id: 'rod', name: 'ROD', glyph: '≀', ext: 1, blade: 0 },
  { id: 'hook', name: 'HOOK', glyph: '⚓', ext: 0.32, blade: 0 },
];


export class Sondelass extends Tech {
  constructor(mgr) {
    super(mgr, 'sondelass');
    this.passive = true;
    this.alwaysHands = true;
    this.hingedArms = true; // (its set is hinge-repaired, Sond_ in courier/anim/hinges.js HINGED, so the posed arms are squared too: character.js)
    this.overrides = 0;
    this.state = 'stowed'; // 'stowed' | 'held' (drawT says how far)
    this.form = 'cutlass';
    this.drawT = 0;
    this.drawTarget = 0;
    this.wasOut = false;
    this.model = new SondelassModel();
    this.model.group.visible = false;
    this.rest = new RestBake(this.model.group); // (on the back, its forty parts are drawn as a handful: render/restbake.js)
    mgr.game.scene.add(this.model.group);
    this.aimW = 0; // the arm swinging to an aim (the hook)
    this.leftW = 0; // the free hand on the reel
    this.ext = 0; this.blade = 0;
    this.cutlass = new Cutlass(this);
    this.hookshot = new Hookshot(this);
    this.angler = new Angler(this);
    this.toolIn = null;
  }

  // ---------------------------------------------------------------- what the rest of the game asks
  get enabled() { return !!T.tech.sondelass?.enabled; }
  get engaged() { return this.drawT > 0.001; }
  /** The Psygun is put away (and its inputs ignored) while this is out or coming out. */
  get toolOut() { return this.drawTarget > 0 || this.drawT > 0.02; }
  get held() { return this.drawT >= 1; }
  get blocksFire() { return this.toolOut; }
  /** The movement keys are the rod's while a fish is on the line (Angler.locksMove): the body stays, the keys fight the fish. */
  get moveLock() { return this.toolOut && !!this.angler?.locksMove; }
  /** Facing the aim (a swing, a cast, the fight, the hook). */
  get stance() { return this.toolOut && (this.cutlass.busy || this.hookshot.aiming || !!this.angler?.stance); }
  get slow() { return this.toolOut && (this.angler?.casting ? 0.5 : this.cutlass.guardOn ? 0.55 : 1); }
  get formDef() { return FORMS.find((f) => f.id === this.form); }
  get game() { return this.mgr.game; }

  setForm(id) {
    if (id === this.form) return;
    if (this.angler?.busy || this.cutlass.busy || this.hookshot.busy) return; // (not mid-fight, mid-swing or mid-flight)
    this.form = id;
    sfx.telescope(id === 'rod');
    this.game.events?.emit('sondelass.form', { form: id });
  }

  /** Every tech reset (course.teleport, a fall out of the world: courier/moves/techs.js reset()): the Courier set down by no move of their
   *  own, so a string run ends ('pause': tools/moveset.js leave(), Dovina's ruling); nothing else of the tool's changes. */
  reset() { this.cutlass.moves.leave(); }

  // ---------------------------------------------------------------- sockets (measured from the UAL sword pose: tools/grip.js)
  computeSocket(ch) {
    const g = (this.grip = measureGrip(ch));
    this.socketR = g.R; this.socketRInv = g.RInv; this.socketL = g.L; this.socketLInv = g.LInv;
    // the stowed place: beside the Psygun on the back, above it and parallel (barrel and tip to the character's left, the reel out the back)
    if (!ch.holsterLocal) ch.computeHolster();
    const off = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
    off.setPosition(new THREE.Vector3(-0.34, -0.13, 0.04).multiplyScalar(T.weapon.gunScale).add(new THREE.Vector3(0.16, 0.115, -0.02)));
    this.holsterLocal = ch.holsterLocal.clone().multiply(off);
  }

  /** A hand's world pose for the tool at world matrix M, the hand taking the tool at `x` along it (and `yo`/`zo` off it). */
  handFromTool(M, side, out, xo = 0, yo = 0, zo = 0, quatOut = null) { return handFromTool(this.grip, M, side, out, xo, yo, zo, quatOut); }

  // ---------------------------------------------------------------- per frame
  tick(dt) {
    super.tick?.(dt);
    this.dt = dt;
    const P = this.P, g = this.game, inp = P.input, ch = g.character;
    if (!this.socketR && ch) this.computeSocket(ch);
    const wpn = g.weapon;
    if (this.enabled && inp.enabled) {
      const busy = !!this.mgr.active?.handsBusy || !!this.mgr.get?.('carry')?.item; // (both hands are on what is being carried, too)
      if (busy && this.drawTarget > 0) { this.drawTarget = 0; this.resume = true; } // (both hands taken: it goes away, and comes back)
      else if (!busy && this.resume && !this.mgr.active) { this.resume = false; this.drawTarget = 1; }
      if (this.drawTarget > 0 && this.held) {
        ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (inp.wasPressed(k)) this.setForm(FORMS[i].id); });
        if (inp.wasPressed('KeyV') && this.form !== 'cutlass' && !this.hookshot.busy) this.setForm('cutlass'); // (V is the parry: the blade snaps out for it, docs/plans/PARRY.md)
      }
    } else if (this.drawTarget > 0 && !inp.enabled) { /* paused: stay as we are */ }
    if (!this.enabled || g.god?.controlling) this.drawTarget = 0;
    if (this.drawTarget === 0 && this.cutlass.blade?.active) this.cutlass.blade.exit('stow'); // (put away is out of Blade Mode at once: the holster ran on its 5% time, six real seconds, SWEEPS group 4)
    // the Psygun holsters first, then this is drawn (and the reverse)
    const gunAway = g.belt ? g.belt.mayDraw(g.belt.get('sondelass')) : !wpn || wpn.drawT < 0.02; // (the belt: the hands are free of every other tool)
    const step = dt * (this.game.belt?.hands ?? 1) / (this.drawTarget > this.drawT ? T.weapon.drawTime : T.weapon.holsterTime);
    if (this.drawTarget > this.drawT && gunAway) this.drawT = Math.min(this.drawTarget, this.drawT + step);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - step);
    if (this.drawTarget === 0 && this.hookshot.att) this.hookshot.release('stow'); // (put away with a line out: it comes away)
    if (this.drawTarget === 0 && this.cutlass.moves.cur) this.cutlass.cancel(); // (put away mid-stroke: the stroke ends now, not frozen until the holster)
    if (this.drawT > 0.02 && !this.wasOut) { sfx.toolDraw(); this.wasOut = true; this.game.events?.emit('sondelass.draw', {}); }
    if (this.drawT <= 0.02 && this.wasOut) {
      this.wasOut = false; sfx.holster?.(); this.cutlass.cancel(); this.hookshot.cancel(); this.angler?.stow();
      this.game.events?.emit('sondelass.stow', {});
    }
    const held = this.held;
    // the forms: the sections slide, the blade comes out
    const fd = this.formDef;
    const m = this.model;
    const eT = this.drawT > 0.02 ? fd.ext : 0, bT = this.drawT > 0.02 ? fd.blade : 0;
    const e0 = this.ext;
    this.ext = THREE.MathUtils.damp(this.ext, eT, 9, dt);
    this.blade = THREE.MathUtils.damp(this.blade, bT, 11, dt);
    if (Math.abs(this.ext - e0) > 0.02 && Math.abs(this.ext - eT) > 0.05) sfx.telescope(this.ext > e0);
    m.setExtension(this.ext);
    m.setBlade(this.blade);
    m.setHook(this.form === 'hook' && this.drawT > 0.02 && !this.hookshot.flying);
    if (this.angler && this.form === 'rod') m.setBend(this.angler.bend());
    else m.setBend(THREE.MathUtils.damp(m.bend, 0, 10, dt));
    // the sub-systems
    if (held && this.form === 'cutlass') this.cutlass.update(dt, inp);
    else this.cutlass.moves.idle(dt); // (the cutlass not in the hand: its string's window still runs out, tools/moveset.js idle())
    if (held && this.form === 'hook') this.hookshot.update(dt, inp);
    this.hookshot.tickFlight?.(dt);
    if (this.form === 'rod' || this.angler?.lure) this.angler?.update(dt, inp, held && this.form === 'rod');
    // (it is worn: when the body is not drawn, melted into slip, blinked, handed over to the god-hand, neither is the tool)
    const ch2 = this.game.character;
    this.model.group.visible = g.belt?.isWorn('sondelass') !== false && !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && (this.drawT > 0.001 || this.stowedVisible()); // (in the box: not on them)
    this.rest.update(dt, this.drawT === 0, `${Math.round(m.ext * 1e3)}|${Math.round(m.bend * 1e3)}|${Math.round(m.bladeOut * 1e3)}|${m.hookOn}|${Math.round(m.spin * 100)}`);
  }

  /** The tool is always on the back unless it is in the hand. */
  stowedVisible() { return this.enabled && !this.game.god?.active; }

  // ---------------------------------------------------------------- animation: the right arm's clip layer
  animate(ch, base, dt) {
    const C = ch.clips, P = ch.P;
    if (!this.track) {
      this.track = new Track(C, new Set(['stance:cutlass', 'stance:hookHeld', 'Sond_Idle', 'Sond_CastIdle', 'torchIdle', 'idle']));
      this.track.play('torchIdle', 0, 0.01);
      this.P1 = C.pose(); this.P2 = C.pose();
    }
    const layerW = this.w * smooth(HOLD, 1, this.drawT) * (1 - this.mgr.override); // (a move that poses the whole body, the stinger's lunge, takes the arm too)
    if (layerW <= 0.001) return;
    const tr = this.track;
    const want = this.form === 'cutlass' ? this.idleClip : this.form === 'rod' ? 'Sond_CastIdle' : C.clips['stance:hookHeld'] ? 'stance:hookHeld' : 'torchIdle'; // (the cutlass en garde: the suite's Sond_Idle turned side-on, courier/anim/stances.js; the rod held out: the suite's own idle; the hook as the UAL torch idle holds it, the hand clear of the running thigh)
    if (!this.cutlass.playing && !this.angler?.castClip && tr.cur !== want) tr.play(want, 0, 0.25);
    tr.update(dt);
    const layer = tr.sample(this.P1);
    if (this.form === 'cutlass') this.drawnRun(ch, layer, dt); // (running, the run's own upper body with the blade held low and back)
    // a cutlass stroke, or the cast: a clip played over the ready stance
    const cl = this.cutlass.pose(C, this.P2);
    if (cl) C.blend(layer, cl.pose, cl.w);
    const cast = this.angler?.castPose(C, this.P2);
    if (cast) C.blend(layer, cast.pose, cast.w);
    // (the grapnel is a one-handed thing: in hook form the stance is the right arm's, and the left hangs with their walk, unless it is on the
    // line; the rod and the cutlass take both)
    if (!this.MASK_HOOK) { this.MASK_HOOK = Float32Array.from(ch.MASK_UPPER); C.bones.forEach((b, i) => { if (/L$/.test(b) && /arm|hand|f_|thumb/.test(b)) this.MASK_HOOK[i] = 0; }); }
    C.blend(base, layer, layerW, this.form === 'hook' && !this.hookshot.att ? this.MASK_HOOK : ch.MASK_UPPER, 0);
    if (this.form === 'cutlass') this.cutlass.moves.legs(ch, base, layerW, dt); // (standing to strike, the legs are the stroke's: tools/moveset.js)
  }

  /** The cutlass's en garde (stances.js `cutlass`: Sond_Idle, the chest turned side-on and the blade on the centre line), or the suite's
   *  own if the stance was not baked. */
  get idleClip() { return this.game.character?.clips?.clips['stance:cutlass'] ? 'stance:cutlass' : 'Sond_Idle'; }

  /** THE DRAWN RUN (the owner, 2026-10-11: "The Sondelass needs an animation for running while the Sondelass is drawn"): running or
   *  sprinting with the cutlass out, the upper body is the run's own (its chest and free arm, on the gait's shared phase) and the blade
   *  arm holds the cutlass low and back (stances.js: cutlassRun over the jog, cutlassSprint over the sprint), in place of the en garde
   *  idle laid over the running legs, which held both arms out still. By the gait's running share (character.js `st.run`); a stroke, the
   *  guard or the stinger is laid over it as over the idle. */
  drawnRun(ch, layer, dt) {
    const C = ch.clips, st = ch.st, g = ch.gait;
    this.runW = THREE.MathUtils.damp(this.runW || 0, st.run || 0, 12, dt);
    if (this.runW < 0.001 || !C.clips['stance:cutlassRun'] || !g?.jog) return;
    const at = (n, clip) => ((st.phi + g[n].off) % 1) * C.clips[clip].dur; // (the loop the stance was baked over: its own frames, the same phase)
    const pose = C.sample('stance:cutlassRun', at('jog', 'stance:cutlassRun'), (this.P3 ||= C.pose()));
    if ((st.sprint || 0) > 0.001 && C.clips['stance:cutlassSprint'] && g.sprint) C.blend(pose, C.sample('stance:cutlassSprint', at('sprint', 'stance:cutlassSprint'), (this.P4 ||= C.pose())), st.sprint);
    C.blend(layer, pose, this.runW);
  }

  // ---------------------------------------------------------------- hands: the draw, the hook's aim, the reel, and where the tool ends up
  hands(ch, o) {
    if (!this.socketR) return;
    const B = ch.bones, root = ch.root, model = this.model, drawT = this.drawT;
    root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const M = new THREE.Matrix4();
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion();
    // the reach back, the grab and the whip round (tools/draw.js); once it is in the hand, the clip's own hand carries it
    const phase = drawHands(ch, this.grip, holster, drawT, { hold: HOLD, twist: -T.weapon.drawTwist * 0.5, lean: 8, out: M });
    if (phase === 'held') {
      // in the hand: the hook's aim swings the arm; otherwise the clip's own hand carries it
      const aimW = this.hookshot.aimBlend;
      if (aimW > 0.01 && this.hookshot.aimDir) {
        // (the shaft along the aim, held as a rod is pointed: the forearm AIM.fore degrees below the aim, the wrist turned the rest of the
        //  way toward the little finger, the hand a little out from the body. It was held 0.5 m out along the aim from the shoulder, the
        //  forearm along the shaft, and the wrist folded 116 to 129 degrees to lay the shaft across the knuckles: the pose audit)
        const sh = ch.shoulder('R', new THREE.Vector3());
        // (with a line out, on the anchor from this frame's shoulder: the hook's own aimDir is the last frame's, and on the line the body
        //  under the hand has moved since)
        const att = this.hookshot.att, dir = att ? new THREE.Vector3().subVectors(att.point, sh).normalize() : this.hookshot.aimDir, up = _v2.set(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(dir, up);
        // (on the line in the air, the grapple's: the body's right, square to the line. The aim's own right is the anchor's bearing from
        //  the shoulder turned a quarter, and it turns 180 degrees as the shoulder passes under the anchor: in a swing it swept the hand
        //  0.4 m across the face in 8 frames at each pass, the hand turning over on the shaft with it)
        if ((att && (this.mgr.get('grapple')?.w ?? 0) > 0.5) || side.lengthSq() < 1e-6) {
          const y = this.P.bodyYaw ?? 0;
          side.set(-Math.cos(y), 0, Math.sin(y));
          side.addScaledVector(dir, -side.dot(dir));
        }
        side.normalize();
        const down = new THREE.Vector3().crossVectors(dir, side).normalize(); // (side: the aim's right; down: square to the aim, toward the ground)
        const fore = dir.clone().multiplyScalar(Math.cos(AIM.fore * Math.PI / 180)).addScaledVector(down, Math.sin(AIM.fore * Math.PI / 180));
        const pos = sh.clone().addScaledVector(fore, AIM.reach).addScaledVector(side, AIM.out);
        const X = dir.clone(), Zt = side.clone().negate(); // (the tool's Z: the aim's left, up x the aim where that is defined)
        const Yt = new THREE.Vector3().crossVectors(Zt, X);
        const G = new THREE.Matrix4().makeBasis(X, Yt, Zt).setPosition(pos);
        this.handFromTool(G, 'R', hp, 0, 0, 0, hq);
        const pole = sh.clone().addScaledVector(fore, 0.2).addScaledVector(dir, -0.35).addScaledVector(side, 0.15); // (the elbow behind the hand and out)
        ch.reachHand('R', hp, hq, aimW, 0, pole);
      }
      // the free hand on the reel, cranking (or at the foregrip of the rod while it holds a fish)
      const hookLeft = this.form === 'hook' && this.hookshot.att ? 1 : 0; // (hanging or swinging: the free hand takes the shaft)
      const iaido = this.form === 'cutlass' ? this.cutlass.leftHand : 0; // (the iaido's charge: the off hand at the guard)
      this.leftW = this.form === 'cutlass' ? iaido : THREE.MathUtils.damp(this.leftW, Math.max(this.angler?.leftHand ?? 0, hookLeft), 10, 1 / 60); // (the cutlass's eases with the pose's own weight)
      M.multiplyMatrices(B.handR.matrixWorld, this.socketR);
      if (this.leftW > 0.01 && this.form === 'cutlass') {
        const yaw = this.P.bodyYaw ?? this.P.yaw, pole = new THREE.Vector3(0.55 * Math.cos(yaw) + 0.22 * Math.sin(yaw), 0.77, -0.55 * Math.sin(yaw) + 0.22 * Math.cos(yaw)).add(this.P.renderPos); // (the elbow out to their left and a little ahead: the forearm across to the blade square to its line, the pose audit)
        this.offHand(ch, M, this.cutlass.leftAt, 0, 0, AXIS_X, this.leftW, pole, true); // (the thumb toward the hilt, as on a scabbard's mouth: iaido's koiguchi)
      }
      if (this.leftW > 0.01 && this.form === 'hook') this.offHand(ch, M, 0.55, 0, 0, AXIS_X, this.leftW, B.forearmL.getWorldPosition(new THREE.Vector3()).add(_v3.set(0.15, -0.3, 0.1)));
      if (this.leftW > 0.01 && this.form === 'rod') {
        const a = model.spin; // (the crank's knob, turning about the reel's axle: the fingers turn about the knob's own stem, the tool's Z)
        this.offHand(ch, M, 0.09 + Math.cos(a) * 0.07, 0.088 + Math.sin(a) * 0.07, 0.05, AXIS_Z, this.leftW, B.forearmL.getWorldPosition(new THREE.Vector3()).add(_v3.set(0.15, -0.3, 0.1)));
      }
    }
    // the rod out and nothing cast: the free hand holds what is tied on (luremodels.js), the way an angler holds the lure before a cast
    this.heldLurePose(ch, phase === 'held' && this.form === 'rod' && !this.angler?.lure?.active && this.leftW < 0.3 && !this.P.fp);
    // in first person: in the view, swung along the stroke's arc (tools/viewmodel.js)
    if (this.P.fp && drawT > 0.001) fpToolMatrix(this.game.camera, { draw: Math.min(1, drawT / 0.6), ...(this.form === 'cutlass' ? this.cutlass.fpArc() : this.angler?.casting ? { arc: 'raise', u: 0.6 } : null) }, M);
    // place the tool
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    // a rod tip tremble / flick goes on top of the hand's own pose
    if (this.form === 'rod' && this.angler && drawT > HOLD) {
      const off = this.angler.flick();
      if (off) model.group.quaternion.multiply(_q1.setFromAxisAngle(_v1.set(0, 0, 1), off));
    }
    model.group.updateMatrixWorld(true);
    ch.root.updateMatrixWorld(true);
    this.cutlass.afterHands(this.dt || 1 / 60); // (the blade is where it is for this frame: its ribbon and the afterimages)
  }

  /** THE OFF HAND on the tool at (x, y, z) in its frame (M: the tool's world matrix), by weight w, its elbow toward `pole`: the hand turned
   *  about the handle's axis (`axis`, tool frame) to meet the forearm it comes on (tools/grip.js easeGrip), the arm reached once to learn
   *  that way and put back, then reached for good. `flip`: the hand the other way round on the handle (its thumb toward the tool's butt). */
  offHand(ch, M, x, y, z, axis, w, pole, flip = false) {
    const arm = ch.arm.L, hp = new THREE.Vector3(), hq = new THREE.Quaternion();
    this.model.group.matrixWorld.copy(M);
    this.handFromTool(flip ? _m2.copy(M).multiply(_m3.makeTranslation(x, y, z)).multiply(_m4.makeRotationZ(Math.PI)).multiply(_m3.makeTranslation(-x, -y, -z)) : M, 'L', hp, x, y, z, hq);
    const bones = [arm.upper, arm.fore, arm.hand], keep = bones.map((b) => b.quaternion.clone()), keepP = arm.upper.position.clone();
    const from = arm.hand.getWorldPosition(new THREE.Vector3()), fromQ = arm.hand.getWorldQuaternion(new THREE.Quaternion()), elbow = arm.fore.getWorldPosition(new THREE.Vector3());
    ch.reachHand('L', hp, hq, 1, 0, pole.clone());
    const fore = arm.hand.getWorldPosition(new THREE.Vector3()).sub(arm.fore.getWorldPosition(_v1)).normalize();
    bones.forEach((b, i) => b.quaternion.copy(keep[i])); arm.upper.position.copy(keepP); arm.upper.updateMatrixWorld(true);
    easeGrip(hp, hq, _v1.set(x, y, z).applyMatrix4(M), _v2.copy(axis).transformDirection(M), fore);
    // (by its weight, the hand carried from where the clip has it to the handle, turning on the way, and the elbow from the clip's toward
    //  the pole: a reach at part weight solved the elbow whole toward the pole for a target part of the way there, and the iaido's first
    //  frames folded the wrist 155 degrees and the elbow back: the pose audit)
    ch.reachHand('L', from.lerp(hp, w), fromQ.slerp(hq, w), 1, 0, elbow.lerp(pole, w));
    // (on the way, the hand kept in line with its forearm, its turn about its length free: the slerp alone swung the wrist 70 to 140
    //  degrees mid-reach; let go over the last of the reach, where the grip's own turn takes over)
    const keepLine = 1 - THREE.MathUtils.smoothstep(w, 0.7, 1);
    if (keepLine > 0.001) {
      const f = arm.hand.getWorldPosition(_v1).sub(arm.fore.getWorldPosition(_v2)).normalize(), q = arm.hand.getWorldQuaternion(_q1);
      const turn = new THREE.Quaternion().setFromUnitVectors(_v3.set(0, 1, 0).applyQuaternion(q), f);
      ch.setWorldQuat(arm.hand, new THREE.Quaternion().slerp(turn, keepLine).multiply(q));
      arm.hand.updateMatrixWorld(true);
    }
  }

  /** The lure on the line, in their left hand (rod out, nothing cast): rebuilt when another is tied on. */
  heldLurePose(ch, on) {
    const id = this.game.pneuka?.lure ?? 'lure.bob';
    const want = on && id && !id.startsWith('curio.') ? id : null;
    if (want !== this.heldLureId) {
      if (this.heldLure) { this.heldLure.group.removeFromParent(); this.heldLure.dispose(); this.heldLure = null; }
      this.heldLureId = want;
      if (want) { this.heldLure = buildLure(want); this.game.scene.add(this.heldLure.group); }
    }
    if (!this.heldLure) return;
    const B = ch.bones, g = this.heldLure.group;
    B.handL.updateWorldMatrix(true, false);
    g.position.set(0.02, 0.09, 0.03).applyMatrix4(B.handL.matrixWorld); // (between the fingers and the thumb)
    B.handL.getWorldQuaternion(g.quaternion);
    g.scale.setScalar(1.6); // (a little larger than life: it has to read at a third-person distance)
  }

  // ---------------------------------------------------------------- the world's side of it
  fixed(dt) {
    this.angler?.fixed(dt);
    this.hookshot.fixed(dt);
  }

  /** Where the tool's tip is (world). */
  tip(out) { return this.model.tipWorld(out); }
  /** The camera's aim: a ray from the eye through the crosshair, as the Psygun's own aim reads it. */
  aim(dirOut, originOut) {
    const cam = this.game.camera;
    cam.getWorldDirection(dirOut);
    if (originOut) cam.getWorldPosition(originOut);
    return dirOut;
  }
}
