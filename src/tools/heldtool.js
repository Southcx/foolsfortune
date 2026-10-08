// ---------------------------------------------------------------------------------------
// HELD TOOL: what every worn tool does the same way, once. The Sondelass, the Soul Brush and the Veritome each grew their own draw, stow,
// key, visibility and rest bake; the tools after them (the Dreamvane, the Crucibelle, the Lockheart) are this class and their own
// mechanics only. A subclass gives:
//
//   super(mgr, id, { key, worn: { at: [x, y, z], along: [x, y, z], out: [x, y, z], bone }, draw: { twist, lean, via, pole }, idle, grip })
//     key     the key that draws and stows it (the belt's contract: tools/belt.js)
//     worn    where it hangs, in body space at rest (+X their left, +Z forward): `at` the grip, `along` the haft, `out` the palm side;
//             `side` ('L' | 'R') for a hip tool: the hip it was measured at (belt.hipSide may send it to the other, mirrored);
//             `bone` the bone it rides (default the spine: a hip; 'spine003' the chest, for something on a chain at the neck)
//     draw    the draw's reach and whip (tools/draw.js), the clip it is held in (`idle`, a UAL one-handed idle) and its grip clip
//   this.model (with .group, in the tool frame of tools/grip.js), and any of:
//     use(dt, raw, inp)       once a frame while it is in the hand and the input is live (its own mouse and keys)
//     always(dt, raw)         once a frame, out or not (a passive: the Lockheart drinks overflow while it is only worn)
//     onDraw() / onStow()     as it comes out / is put away (cancel what was going on)
//     pose(clips, buf)        -> { pose, w } | null: an action clip over the idle (a swing, a strike, a throw)
//     second(ch, M)           -> { x, y, z } | null: a point along the tool (tool frame) where the LEFT hand closes (a two-handed hold:
//                             a light IK, a hand set on a handle, as CLAUDE.md allows)
//     fpArc()                 -> { arc, u, lift } for first person (tools/viewmodel.js)
//     restSig()               the numbers of its pose that, unchanged, let it be baked at rest (render/restbake.js)
//     placed(M)               after the model is placed this frame (a fork that flies on its own, a wheel that spins)
//
// Prior art: the belt's own contract (one draw, one stow, the hands freed first) and Unreal's weapon base class (Lyra's equipment
// instance: a shared draw/holster/fire scaffold, the weapon its fire and its look).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RestBake } from '../render/restbake.js';
import { Tech } from '../courier/moves/techs.js';
import { Track } from '../courier/anim/animator.js';
import { sfx } from '../audio/sfx.js';
import { T } from '../core/config.js';
import { measureGrip, handFromTool } from './grip.js';
import { drawHands } from './draw.js';
import { fpToolMatrix } from './viewmodel.js';

const smooth = (a, b, t) => { const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const _m1 = new THREE.Matrix4(), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion();
const _mx = new THREE.Matrix4().makeScale(-1, 1, 1), _my = new THREE.Matrix4().makeScale(1, -1, 1);
/** A placing in body space moved to the other side of the body (a hip tool sent to the other hip: belt.hipSide): its place and its haft
 *  (local X) and outward face (local Z) mirrored across their middle; a mirror cannot be a turn, so the tool's own Y turns over instead
 *  (a bell or a haft is the same either way; a book's spine faces the other way), and the mesh is never inside out. */
export const mirrorSide = (G) => G.premultiply(_mx).multiply(_my);
/** The hip a tool hangs at now, and whether that is the other side from the one its holster was measured for. */
export const hipMirror = (game, id, own) => { const s = game.belt?.hipSide?.(id) || own; return { side: s, mirror: s !== own }; };

export class HeldTool extends Tech {
  constructor(mgr, id, { key, worn, draw = {}, idle = 'swordIdle', idles = null, grip = 'torchIdle', drawK = 1 } = {}) {
    super(mgr, id);
    this.passive = true; this.alwaysHands = true; this.overrides = 0;
    this.key = key; this.wornSpec = worn; this.drawSpec = draw; this.idle = idle; this.idles = idles; this.gripClip = grip; this.drawK = drawK;
    this.drawT = 0; this.drawTarget = 0; this.wasOut = false; this.leftW = 0;
  }
  /** After the subclass has made `this.model`: into the scene, hidden, with its rest bake. */
  mount() {
    this.model.group.visible = false;
    this.rest = new RestBake(this.model.group);
    this.game.scene.add(this.model.group);
  }

  // ---------------------------------------------------------------- what the rest of the game asks
  get engaged() { return this.drawT > 0.001; }
  get toolOut() { return this.drawTarget > 0 || this.drawT > 0.02; }
  get held() { return this.drawT >= 1; }
  get blocksFire() { return this.toolOut; }
  get stance() { return this.toolOut && !!this.busy; }
  get worn() { return this.game.belt ? this.game.belt.isWorn(this.id) : true; }

  computeSocket(ch) {
    this.grip = measureGrip(ch, this.gripClip);
    const W = this.wornSpec, B = ch.bones, bone = B[W.bone || 'spine'] || B.spine;
    const saveP = ch.root.position.clone(), saveQ = ch.root.quaternion.clone();
    ch.root.position.set(0, 0, 0); ch.root.quaternion.identity();
    ch.resetPose(); ch.root.updateMatrixWorld(true);
    const X = new THREE.Vector3(...W.along).normalize();
    const Z = new THREE.Vector3(...W.out).addScaledVector(X, -new THREE.Vector3(...W.out).dot(X)).normalize();
    const Y = new THREE.Vector3().crossVectors(Z, X).normalize();
    const G = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(...W.at);
    const { side, mirror } = hipMirror(this.game, this.id, W.side || 'R'); this.socketSide = side; this.mirrored = mirror;
    if (W.side && mirror) mirrorSide(G); // (a hip tool sent to the other hip: belt.hipSide)
    this.holsterLocal = bone.matrixWorld.clone().invert().multiply(G);
    this.holsterBone = bone;
    ch.root.position.copy(saveP); ch.root.quaternion.copy(saveQ); ch.root.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- per frame
  tick(dt) {
    this.dt = dt;
    const P = this.P, g = this.game, inp = P.input, ch = g.character, raw = g.rawDt || dt;
    if (ch && (!this.grip || (this.wornSpec.side && g.belt?.hipSide(this.id) !== this.socketSide))) this.computeSocket(ch);
    if (this.enabled && inp.enabled) {
      const busy = !!this.mgr.active?.handsBusy || !!this.mgr.get?.('carry')?.item;
      if (inp.wasPressed(this.key) && !g.god?.controlling && !busy && (this.drawTarget > 0 || g.belt?.ready(this.id) !== false)) {
        this.drawTarget = this.drawTarget > 0 ? 0 : 1;
        if (this.drawTarget) g.belt?.draw(g.belt.get(this.id));
      }
      if (inp.wasPressed('KeyX') && this.drawTarget > 0) this.drawTarget = 0;
      if (busy && this.drawTarget > 0) { this.drawTarget = 0; this.resume = true; }
      else if (!busy && this.resume && !this.mgr.active) { this.resume = false; this.drawTarget = 1; }
    }
    if (!this.enabled || g.god?.controlling) this.drawTarget = 0;
    const free = g.belt ? g.belt.mayDraw(g.belt.get(this.id)) : true;
    const step = dt * (this.game.belt?.hands ?? 1) / (this.drawTarget > this.drawT ? T.weapon.drawTime * this.drawK : T.weapon.holsterTime);
    if (this.drawTarget > this.drawT && free) this.drawT = Math.min(this.drawTarget, this.drawT + step);
    else if (this.drawTarget < this.drawT) this.drawT = Math.max(this.drawTarget, this.drawT - step);
    if (this.drawT > 0.02 && !this.wasOut) { this.wasOut = true; sfx.toolDraw(); this.onDraw?.(); g.events?.emit(`${this.id}.draw`, {}); }
    if (this.drawT <= 0.02 && this.wasOut) { this.wasOut = false; sfx.holster?.(); this.onStow?.(); g.events?.emit(`${this.id}.stow`, {}); }
    if (this.held && inp.enabled && !g.codex?.open) this.use?.(dt, raw, inp);
    this.always?.(dt, raw);
    const ch2 = g.character;
    this.model.group.visible = this.enabled && this.worn && !ch2?.hidden && (ch2?.dissolve ?? 0) < 0.3 && !g.god?.active;
    this.rest.update(raw, this.drawT === 0 && !this.busy, this.restSig?.() ?? '');
    const shells = document.getElementById('shells'); // (the Psygun's shells are not this tool's)
    if (shells && this.drawT > 0.02) shells.style.display = 'none';
    else if (shells && this.wasShellsHidden) shells.style.display = '';
    this.wasShellsHidden = this.drawT > 0.02;
  }

  // ---------------------------------------------------------------- animation: the upper body's clip layer
  animate(ch, base, dt) {
    const C = ch.clips;
    if (!this.track) {
      this.track = new Track(C, new Set(this.idles || [this.idle, 'idle']));
      this.track.play(this.idle, 0, 0.01);
      this.P1 = C.pose(); this.P2 = C.pose();
    }
    const layerW = this.w * smooth(T.weapon.drawGrab, 1, this.drawT) * (1 - this.mgr.override);
    if (layerW <= 0.001) return;
    this.track.update(dt);
    const layer = this.track.sample(this.P1);
    const a = this.pose?.(C, this.P2);
    if (a) C.blend(layer, a.pose, a.w);
    C.blend(base, layer, layerW, ch.MASK_UPPER, 0);
  }

  // ---------------------------------------------------------------- the hands: the draw, the hold, the second hand
  hands(ch) {
    if (!this.grip) return;
    const D = this.drawSpec, model = this.model, P = this.P;
    ch.root.updateMatrixWorld(true);
    const holster = _m1.multiplyMatrices(this.holsterBone.matrixWorld, this.holsterLocal).clone();
    const M = new THREE.Matrix4();
    const phase = drawHands(ch, this.grip, holster, this.drawT, { hold: T.weapon.drawGrab, twist: D.twist ?? -10, lean: D.lean ?? 8, via: this.mirrored && D.via ? [-D.via[0], D.via[1], D.via[2]] : D.via || [-0.35, 1.15, 0.4], pole: D.pole, out: M });
    if (P.fp && this.drawT > 0.001) fpToolMatrix(this.game.camera, { draw: Math.min(1, this.drawT / 0.6), ...(this.fpArc?.() || {}) }, M);
    if (!M.elements.every(Number.isFinite)) M.copy(holster); // (never a NaN placed in the world)
    M.decompose(model.group.position, model.group.quaternion, model.group.scale);
    model.group.updateMatrixWorld(true);
    // the second hand closes on the tool where the tool says (a light correction; the clip has the arm near already)
    const s = phase === 'held' && !P.fp ? this.second?.(ch, M) : null;
    this.leftW = THREE.MathUtils.damp(this.leftW, s ? 1 : 0, 12, this.dt || 1 / 60);
    if (this.leftW > 0.01 && (s || this.lastSecond)) {
      const at = s || this.lastSecond; this.lastSecond = at;
      handFromTool(this.grip, M, 'L', _p, at.x, at.y || 0, at.z || 0, _q);
      if (Number.isFinite(_p.x + _p.y + _p.z + _q.w)) ch.reachHand('L', _p, _q, this.leftW);
    }
    this.placed?.(M);
  }

  /** A point on the tool (tool frame) in the world, now. */
  toolPoint(x, y = 0, z = 0, out = new THREE.Vector3()) { return out.set(x, y, z).applyMatrix4(this.model.group.matrixWorld); }
  /** Where they are looking, flat. */
  aimFlat(out = _v) { const P = this.P; return out.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)); }

  fixed() {}
  reset() { this.onStow?.(); }
}
