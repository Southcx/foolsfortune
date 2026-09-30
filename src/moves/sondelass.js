import * as THREE from 'three';
import { Tech } from './techs.js';
import { Track } from '../animator.js';
import { sfx } from '../audio.js';
import { T, DEG } from '../config.js';
import { SondelassModel } from '../sondelass/model.js';
import { Cutlass } from '../sondelass/cutlass.js';
import { Hookshot } from '../sondelass/hookshot.js';
import { Angler } from '../angling/angler.js';

// ---------------------------------------------------------------------------------------
// THE SONDELASS: a telescoping instrument that is a fishing rod, a cutlass and a grapple hook, worn on the Courier's back
// parallel to the Psygun and drawn the same way (the hand reaches back, grabs, whips it round). The first melee tool, and the way
// into angling (src/angling/). It is a passive tech: it doesn't take the step from the core movement, so you run, jump and slide
// with it out; it owns only the right arm's pose while it is drawn, and puts the Psygun away.
//
//   Q     draw / stow (the Psygun goes away first; X also stows it)           1 / 2 / 3   CUTLASS / ROD / HOOK
//   CUTLASS  LMB a three-stroke combo · RMB tap: the Stinger · RMB hold: Blade Mode · Z / MMB lock on · V hold: guard, in time: parry
//   ROD      hold LMB to charge a cast, release to throw · 4-8 / wheel: the lure's aspect · wheel (lure out): its depth · RMB sinks it · MMB sounds
//            a fish on: the movement keys are the rod's (A/D lean, S haul, W bow, C brace), LMB reels, RMB gives line
//   HOOK     LMB fires the grapnel: it bites, and the line stays. Hold LMB to reel (yourself to an anchor, a loose thing to you),
//            hold RMB to pay out, tap RMB to let go, Space to jump off it; A/D/W/S pump a swing (moves/grapple.js)
//
// Prior art, and what was taken:
//  - Animation: the tool is glued to the animated hand (a socket measured from the CC0 Universal Animation Library's own sword
//    pose, where the blade lies along the knuckle line), so every UAL sword clip (Sword_Regular_A/B/C, Sword_Attack, Sword_Idle,
//    baked in tools/bake_anims.mjs) carries it with no IK. The rod's cast is Sword_Regular_C re-timed: held at the raised frame
//    while a cast charges, played on release. IK is only the draw, the free hand closing on the reel, and the hook's aim.
//  - Zelda's Hookshot / Just Cause's grapple: the hook flies fast, then the line draws you in at a constant speed and lets go
//    with a hop; jump cancels and keeps the momentum.
//  - Monster Hunter's weapon-form switch: one instrument, three shapes, the sections sliding in and out between them.
// ---------------------------------------------------------------------------------------
const HOLD = T.weapon.drawGrab;
const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

export const FORMS = [
  { id: 'cutlass', name: 'CUTLASS', glyph: '⚔', ext: 0, blade: 1 },
  { id: 'rod', name: 'ROD', glyph: '≀', ext: 1, blade: 0 },
  { id: 'hook', name: 'HOOK', glyph: '⚓', ext: 0.32, blade: 0 },
];

const CSS = `
#toolstrip { position: absolute; right: 24px; bottom: 20px; display: none; gap: 6px; align-items: flex-end; }
#toolstrip.on { display: flex; }
#toolstrip .slot { width: 46px; height: 46px; box-sizing: border-box; border: 1px solid rgba(255,178,122,.3); background: rgba(28,13,8,.45); border-radius: 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; opacity: .7; }
#toolstrip .slot i { font-style: normal; font-size: 16px; line-height: 1; }
#toolstrip .slot span { font-size: 8px; letter-spacing: .08em; margin-top: 3px; }
#toolstrip .slot b { position: absolute; top: 2px; right: 4px; font-size: 9px; color: var(--accent); font-weight: normal; }
#toolstrip .slot.sel { opacity: 1; border-color: var(--accent); background: rgba(196,106,69,.35); transform: translateY(-4px); }
#toolstrip .gap { width: 14px; }
#toolstrip .slot.asp { width: 36px; height: 36px; }
`;

export class Sondelass extends Tech {
  constructor(mgr) {
    super(mgr, 'sondelass');
    this.passive = true;
    this.alwaysHands = true;
    this.overrides = 0;
    this.state = 'stowed'; // 'stowed' | 'held' (drawT says how far)
    this.form = 'cutlass';
    this.drawT = 0;
    this.drawTarget = 0;
    this.wasOut = false;
    this.model = new SondelassModel();
    this.model.group.visible = false;
    mgr.game.scene.add(this.model.group);
    this.aimW = 0; // the arm swinging to an aim (the hook)
    this.leftW = 0; // the free hand on the reel
    this.ext = 0; this.blade = 0;
    this.cutlass = new Cutlass(this);
    this.hookshot = new Hookshot(this);
    this.angler = new Angler(this);
    this.toolIn = null;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = (this.strip = document.createElement('div')); el.id = 'toolstrip';
    document.getElementById('hud')?.appendChild(el);
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
    this.renderStrip();
  }

  // ---------------------------------------------------------------- sockets (measured from the UAL sword pose)
  computeSocket(ch) {
    const B = ch.bones, C = ch.clips;
    const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
    ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
    const frame = (mirror) => {
      ch.resetPose();
      const pose = C.sample('torchIdle', 0, ch.P.tmp);
      ch.applyPose(mirror ? ch.mirrorPose(pose, ch.P.tmp2) : pose);
      ch.root.updateMatrixWorld(true);
      const s = mirror ? 'L' : 'R', arm = ch.arm[s];
      const hand = arm.hand, hm = hand.matrixWorld.clone();
      const hq = hand.getWorldQuaternion(new THREE.Quaternion()), hp = hand.getWorldPosition(new THREE.Vector3());
      const fing = B[`f_middle01${s}`].getWorldPosition(new THREE.Vector3()).sub(hp).normalize();
      const pn = arm.palmLocal.clone().applyQuaternion(hq);
      let X = new THREE.Vector3().crossVectors(fing, pn).normalize();
      if (X.z + X.y * 0.5 < 0) X.negate(); // (the blade lies forward and up in the ready stance, either hand)
      const Z = pn.clone().addScaledVector(X, -pn.dot(X)).normalize();
      if (mirror) Z.negate(); // (the left palm faces the tool from the other side)
      const Y = new THREE.Vector3().crossVectors(Z, X).normalize();
      const origin = arm.palmPt.clone().applyMatrix4(hm).addScaledVector(pn, 0.03);
      const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(origin);
      return hm.invert().multiply(G);
    };
    this.socketR = frame(false);
    this.socketRInv = this.socketR.clone().invert();
    this.socketL = frame(true);
    this.socketLInv = this.socketL.clone().invert();
    ch.resetPose();
    ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ);
    ch.root.updateMatrixWorld(true);
    // the stowed place: beside the Psygun on the back, above it and parallel (barrel and tip to the character's left, the reel out the back)
    if (!ch.holsterLocal) ch.computeHolster();
    const g = T.weapon.holster;
    const off = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
    off.setPosition(new THREE.Vector3(-0.34, -0.13, 0.04).multiplyScalar(T.weapon.gunScale).add(new THREE.Vector3(0.16, 0.115, -0.02)));
    this.holsterLocal = ch.holsterLocal.clone().multiply(off);
    void g;
  }

  /** A hand's world pose for the tool at world matrix M, the hand taking the tool at `x` along it (and `yo`/`zo` off it). */
  handFromTool(M, side, out, xo = 0, yo = 0, zo = 0, quatOut = null) {
    _m2.copy(side === 'R' ? this.socketRInv : this.socketLInv);
    _m1.makeTranslation(xo, yo, zo);
    _m1.premultiply(M).multiply(_m2);
    _m1.decompose(out, quatOut || _q2, _v3);
    return out;
  }

  // ---------------------------------------------------------------- per frame
  tick(dt) {
    super.tick?.(dt);
    this.dt = dt;
    const P = this.P, g = this.game, inp = P.input, ch = g.character;
    if (!this.socketR && ch) this.computeSocket(ch);
    const wpn = g.weapon;
    if (this.enabled && inp.enabled) {
      const busy = !!this.mgr.active?.handsBusy || !!this.mgr.get?.('carry')?.item; // (both hands are on what is being carried, too)
      if (inp.wasPressed('KeyQ') && !g.god?.controlling && !busy) { this.drawTarget = this.drawTarget > 0 ? 0 : 1; if (this.drawTarget) g.belt?.draw(g.belt.get('sondelass')); }
      if (inp.wasPressed('KeyX') && this.drawTarget > 0) this.drawTarget = 0;
      if (busy && this.drawTarget > 0) { this.drawTarget = 0; this.resume = true; } // (both hands taken: it goes away, and comes back)
      else if (!busy && this.resume && !this.mgr.active) { this.resume = false; this.drawTarget = 1; }
      if (this.drawTarget > 0 && this.held) {
        ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (inp.wasPressed(k)) this.setForm(FORMS[i].id); });
      }
    } else if (this.drawTarget > 0 && !inp.enabled) { /* paused: stay as we are */ }
    if (!this.enabled || g.god?.controlling) this.drawTarget = 0;
    // the Psygun holsters first, then this is drawn (and the reverse)
    const gunAway = g.belt ? g.belt.mayDraw(g.belt.get('sondelass')) : !wpn || wpn.drawT < 0.02; // (the belt: the hands are free of every other tool)
    const step = dt / (this.drawTarget > this.drawT ? T.weapon.drawTime : T.weapon.holsterTime);
    if (this.drawTarget > this.drawT && gunAway) this.drawT = Math.min(this.drawTarget, this.drawT + step);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - step);
    if (this.drawTarget === 0 && this.hookshot.att) this.hookshot.release('stow'); // (put away with a line out: it comes away)
    if (this.drawT > 0.02 && !this.wasOut) { sfx.toolDraw(); this.wasOut = true; this.game.events?.emit('sondelass.draw', {}); this.renderStrip(); }
    if (this.drawT <= 0.02 && this.wasOut) {
      this.wasOut = false; sfx.holster?.(); this.cutlass.cancel(); this.hookshot.cancel(); this.angler?.stow();
      this.game.events?.emit('sondelass.stow', {}); this.renderStrip();
    }
    if (this.drawT > 0.02 && P.fp) P.view = 'tp'; // (third person only while it is out)
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
    if (held) {
      if (this.form === 'cutlass') this.cutlass.update(dt, inp);
      else if (this.form === 'hook') this.hookshot.update(dt, inp);
    }
    this.hookshot.tickFlight?.(dt);
    if (this.form === 'rod' || this.angler?.lure) this.angler?.update(dt, inp, held && this.form === 'rod');
    this.strip.classList.toggle('on', this.drawT > 0.02);
    const shells = document.getElementById('shells');
    if (shells) shells.style.display = this.drawT > 0.02 ? 'none' : '';
    // (it is worn: when the body is not drawn, melted into slip, blinked, handed over to the god-hand, neither is the tool)
    const ch2 = this.game.character;
    this.model.group.visible = !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && (this.drawT > 0.001 || this.stowedVisible());
  }

  /** The tool is always on the back unless it is in the hand. */
  stowedVisible() { return this.enabled && !this.game.god?.active; }

  // ---------------------------------------------------------------- HUD
  renderStrip() {
    const s = this.strip;
    if (!s) return;
    const forms = FORMS.map((f, i) => `<div class="slot${f.id === this.form ? ' sel' : ''}"><i>${f.glyph}</i><span>${f.name}</span><b>${i + 1}</b></div>`).join('');
    s.innerHTML = forms + (this.angler ? this.angler.stripHtml(this.form === 'rod') : '');
  }

  // ---------------------------------------------------------------- animation: the right arm's clip layer
  animate(ch, base, dt) {
    const C = ch.clips, P = ch.P;
    if (!this.track) {
      this.track = new Track(C, new Set(['swordIdle', 'torchIdle', 'idle']));
      this.track.play('torchIdle', 0, 0.01);
      this.P1 = C.pose(); this.P2 = C.pose();
    }
    const layerW = this.w * smooth(HOLD, 1, this.drawT) * (1 - this.mgr.override); // (a move that poses the whole body, the stinger's lunge, takes the arm too)
    if (layerW <= 0.001) return;
    const tr = this.track;
    const want = this.form === 'cutlass' ? 'swordIdle' : 'torchIdle';
    if (!this.cutlass.playing && !this.angler?.castClip && tr.cur !== want) tr.play(want, 0, 0.25);
    tr.update(dt);
    const layer = tr.sample(this.P1);
    // a cutlass stroke, or the cast: a clip played over the ready stance
    const cl = this.cutlass.pose(C, this.P2);
    if (cl) C.blend(layer, cl.pose, cl.w);
    const cast = this.angler?.castPose(C, this.P2);
    if (cast) C.blend(layer, cast.pose, cast.w);
    C.blend(base, layer, layerW, ch.MASK_UPPER, 0);
  }

  // ---------------------------------------------------------------- hands: the draw, the hook's aim, the reel, and where the tool ends up
  hands(ch, o) {
    if (!this.socketR) return;
    const B = ch.bones, root = ch.root, model = this.model, drawT = this.drawT;
    const C = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(root.quaternion);
    root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(B.spine.matrixWorld, this.holsterLocal).clone();
    const inHand = drawT > HOLD;
    const reachW = inHand ? 0 : smooth(0, HOLD, drawT);
    const whipU = inHand ? smooth(HOLD, 1, drawT) : 0;
    const M = new THREE.Matrix4();
    const hp = new THREE.Vector3(), hq = new THREE.Quaternion();
    if (drawT > 0.001 && drawT < 1) {
      // the reach back (the shoulders turn back to help, as the Psygun's draw does)
      const twist = inHand ? Math.sin(Math.PI * Math.min(1, whipU * 1.3)) * 0.6 + (1 - whipU) * 0.4 : reachW;
      if (twist > 0.001) {
        const upW = _v1.set(0, 1, 0);
        ch.rotW(B.spine001, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
        ch.rotW(B.spine003, upW, -T.weapon.drawTwist * DEG * 0.5 * twist);
        ch.rotW(B.spine001, C(-1, 0, 0), -8 * DEG * twist);
        root.updateMatrixWorld(true);
      }
    }
    const shR = ch.shoulder('R', new THREE.Vector3());
    const drawPole = shR.clone().add(C(-0.5, -0.25, -0.35));
    if (reachW > 0.001) {
      this.handFromTool(holster, 'R', hp, 0, 0, 0, hq);
      ch.reachHand('R', hp, hq, reachW, 0, drawPole);
      M.copy(holster);
    } else if (inHand && whipU < 1) {
      const gpos = new THREE.Vector3(), gquat = new THREE.Quaternion();
      this.handFromTool(holster, 'R', gpos, 0, 0, 0, gquat);
      const apos = B.handR.getWorldPosition(new THREE.Vector3()), aquat = B.handR.getWorldQuaternion(new THREE.Quaternion());
      const side = root.position.clone().add(C(-0.5, 1.05, -0.05));
      const u = whipU, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
      const p = gpos.multiplyScalar(a).addScaledVector(side, b).addScaledVector(apos, c);
      const q = gquat.slerp(aquat, smooth(0.15, 0.85, u));
      ch.reachHand('R', p, q, 1, 0, drawPole.lerp(B.forearmR.getWorldPosition(new THREE.Vector3()).add(_v1.set(0, -0.12, 0)), u));
      M.multiplyMatrices(B.handR.matrixWorld, this.socketR);
    } else if (inHand) {
      // in the hand: the hook's aim swings the arm; otherwise the clip's own hand carries it
      const aimW = this.hookshot.aimBlend;
      if (aimW > 0.01 && this.hookshot.aimDir) {
        const sh = ch.shoulder('R', new THREE.Vector3());
        const dir = this.hookshot.aimDir;
        const pos = sh.clone().addScaledVector(dir, 0.5 + model.shaftLength() * 0.0).addScaledVector(_v2.set(0, 1, 0), -0.06);
        const X = dir.clone(), Zt = new THREE.Vector3().crossVectors(_v2.set(0, 1, 0), X).normalize();
        const Yt = new THREE.Vector3().crossVectors(Zt, X);
        const G = new THREE.Matrix4().makeBasis(X, Yt, Zt).setPosition(pos);
        this.handFromTool(G, 'R', hp, 0, 0, 0, hq);
        ch.reachHand('R', hp, hq, aimW);
      }
      // the free hand on the reel, cranking (or at the foregrip of the rod while it holds a fish)
      const hookLeft = this.form === 'hook' && this.hookshot.att ? 1 : 0; // (hanging or swinging: the free hand takes the shaft)
      this.leftW = THREE.MathUtils.damp(this.leftW, Math.max(this.angler?.leftHand ?? 0, hookLeft), 10, 1 / 60);
      M.multiplyMatrices(B.handR.matrixWorld, this.socketR);
      if (this.leftW > 0.01 && this.form === 'hook') {
        model.group.matrixWorld.copy(M);
        this.handFromTool(M, 'L', hp, 0.55, 0.0, 0.0, hq);
        ch.reachHand('L', hp, hq, this.leftW, 0, B.forearmL.getWorldPosition(new THREE.Vector3()).add(_v3.set(0.15, -0.3, 0.1)));
      }
      if (this.leftW > 0.01 && this.form === 'rod') {
        model.group.matrixWorld.copy(M); // (the crank's place in the world for the left hand)
        const a = model.spin;
        const knob = _v2.set(0.09 + Math.cos(a) * 0.07, 0.088 + Math.sin(a) * 0.07, 0.05);
        this.handFromTool(M, 'L', hp, knob.x, knob.y, knob.z, hq);
        ch.reachHand('L', hp, hq, this.leftW, 0, B.forearmL.getWorldPosition(new THREE.Vector3()).add(_v3.set(0.15, -0.3, 0.1)));
      }
    } else {
      M.copy(holster);
    }
    // place the tool
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    // a rod tip tremble / flick goes on top of the hand's own pose
    if (this.form === 'rod' && this.angler && inHand) {
      const off = this.angler.flick();
      if (off) model.group.quaternion.multiply(_q1.setFromAxisAngle(_v1.set(0, 0, 1), off));
    }
    model.group.updateMatrixWorld(true);
    ch.root.updateMatrixWorld(true);
    this.cutlass.afterHands(this.dt || 1 / 60); // (the blade is where it is for this frame: its ribbon and the afterimages)
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
