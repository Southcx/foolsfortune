// ---------------------------------------------------------------------------------------
// THE FORM'S DIVE (plain name; South, 2026-10-27: "having the pneuka jar sitting in the spot where the courier is right now since the
// majority of action is godhand, and when transforming into the courier you get sucked into the board"): who stands where while a puzzle
// duel is open, and the beat between the two forms (PUZZLE-DUELS.md 4: the god hand and the Courier, a point to switch).
//   THE HAND'S FORM    the Courier's body is put away (character.setHidden) and the Pneuka Jar (god.jar, its own clips) stands at your
//                      spot facing the board: the Vessoul as the jar, the hand over the board. The board's Courier figurine sleeps
//                      (the stone glaze, no ring: pieces.js `dormant`).
//   TO THE COURIER     the Jar opens and shrinks away (its dismiss) as a stream of the film pours out of its mouth in an arc and down into
//                      the figurine's cell; where it lands the slab rings out and the figurine wakes, its ring turning. The stage's camera
//                      leans in after it (stage.js follow).
//   TO THE HAND        the figurine falls asleep, the stream rises out of its cell and arcs back to your spot, and the Jar is summoned
//                      where it lands.
// The body is put back at the duel's end (close), before anything else asks for it (a loss's shatter, duel.close).
//
// Prior art: Kingdom Hearts' Drive Forms (a body poured into another in a beat), Luigi's Mansion's Poltergust stream (a thing drawn
// down a curve into a mouth), Splatoon's squid dive into the ink (the splash ring where it enters), Persona's summon (the figure
// broken out of the card).
//
//   const D = new FormDive(view)   D.open()   D.close()   D.cast(at) (a skill: skillcast.js)   D.start(to) ('courier' | 'hand': beats.js at the form event)   D.update(dt)
//   DIVE (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { filmColour } from '../oxidation.js';
import { cellLocal, sm, clamp01 } from './layout.js';

/** dur: the pour (real s); open: the Jar's mouth before the stream leaves; beads: the stream's length; gap: its beads' spacing on the
 *  curve; arc: the curve's rise over its middle (m); size: a bead's radius (m). */
export const DIVE = { dur: 0.62, open: 0.12, beads: 26, gap: 0.028, arc: 1.1, size: 0.11 };
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color(), _p = new THREE.Vector3();

export class FormDive {
  constructor(view) {
    this.view = view; this.game = view.game; this.on = false; this.shown = null; this.job = null;
    const mat = new THREE.MeshBasicMaterial({ name: 'duel-dive', color: 0xffffff, toneMapped: false }); // (opaque, fogged, instanced: the board's glows' own program (pieces.js `duel-glow`), so nothing new compiles; the program census)
    this.beads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat, DIVE.beads); this.beads.name = 'duel-dive';
    this.beads.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DIVE.beads * 3), 3); this.beads.frustumCulled = false;
    this.beads.visible = false; this.beads.count = 0; this.beads.userData.zoneFree = true; this.game.scene?.add(this.beads);
    this.from = new THREE.Vector3(); this.to = new THREE.Vector3(); this.mid = new THREE.Vector3();
  }
  get jar() { const J = this.game.god?.jar; return J?.group && !this.game.god.active ? J : null; }
  get clips() { return this.jar?.clips?.R || null; }

  /** The duel opened: your body put away, the Jar or the figurine as the form says. */
  open() {
    this.on = true; this.job = null; this.shown = null;
    this.game.character?.setHidden?.(true);
    this.sync(true);
  }
  /** The duel over: the body back, the Jar put away, the stream gone. */
  close() {
    if (!this.on) return; this.on = false; this.job = null; this.beads.visible = false;
    const J = this.jar; if (J) J.group.visible = false;
    this.game.character?.setHidden?.(false);
    if (this.view.pieces) this.view.pieces.dormant = 0;
  }

  /** Your spot (the Jar's), and where the Jar's mouth is. */
  spot(out) { const P = this.game.player?.pos; return P ? out.copy(P) : out.copy(this.view.centre).addScaledVector(this.view.u, -1.4); }
  mouth(out) { const R = this.jar?.clips; return (R?.mouth?.(out)) || this.spot(out).add(_p.set(0, 0.85, 0)); }
  cell(out) { const V = this.view, b = V.pieces?.bodyAt(0); if (!b) return V.frame.localToWorld(out.set(0, 1, 0)); return V.frame.localToWorld(cellLocal(b.x, b.y, V.board3, out)); }

  /** The Jar stood at your spot, turned to the board (and summoned when `rise`). */
  standJar(rise) {
    const J = this.jar; if (!J) return;
    const P = this.spot(_a), toward = _b.copy(this.view.centre).sub(P).setY(0);
    J.group.position.copy(P); J.pos?.copy?.(P); J.group.rotation.set(0, Math.atan2(toward.x, toward.z), 0); J.group.visible = true;
    const R = this.clips; if (R) { if (rise) R.start?.('summon'); else if (R.move !== 'idle') R.play('idle'); }
  }

  /** Who stands where, at once (the open, an undo, a settle that changed the form without a beat). */
  sync(rise = false) {
    const hand = (this.view.forms?.[0] ?? 'hand') === 'hand'; this.shown = hand ? 'hand' : 'courier';
    if (hand) this.standJar(rise); else { const J = this.jar; if (J) J.group.visible = false; }
    if (this.view.pieces) this.view.pieces.dormant = hand ? 1 : 0;
  }

  /** The form event (beats.js): the pour one way or the other; the camera follows (stage.js). */
  start(to) {
    if (!this.on || to === this.shown) return;
    this.job = { to, t: 0, landed: false }; this.shown = to;
    if (to === 'courier') { this.mouth(this.from); this.cell(this.to); const R = this.clips; if (R) R.play('open', { again: true }); }
    else { this.cell(this.from); this.spot(this.to).add(_p.set(0, 0.6, 0)); if (this.view.pieces) this.view.pieces.dormant = 1; }
    this.mid.copy(this.from).lerp(this.to, 0.5).addScaledVector(UP, DIVE.arc);
    this.view.stage?.follow(to, DIVE.open + DIVE.dur + 0.25);
  }

  /** A skill's cast (the one-gesture duel, skillcast.js): the stream poured from the Jar's mouth (its spit) down into the cell `at`; the
   *  Jar stays where it stands. */
  cast(at) {
    if (!this.on) return;
    const V = this.view; this.mouth(this.from); V.frame.localToWorld(cellLocal(at[0], at[1], V.board3, this.to));
    this.mid.copy(this.from).lerp(this.to, 0.5).addScaledVector(UP, DIVE.arc * 0.8);
    this.job = { to: 'cast', t: 0, landed: false }; const R = this.clips; if (R) R.play('spit', { again: true });
    V.stage?.follow('courier', DIVE.dur + 0.2, this.to.clone());
  }

  /** A point on the stream's curve (a quadratic Bezier, 0..1). */
  at(u, out) { const v = 1 - u; return out.copy(this.from).multiplyScalar(v * v).addScaledVector(this.mid, 2 * v * u).addScaledVector(this.to, u * u); }

  update(dt) {
    if (!this.on) return;
    if (!this.job) { if ((this.view.forms?.[0] ?? 'hand') !== this.shown) this.sync(); if (this.shown === 'hand') this.keepJar(); return; }
    const J = this.job, V = this.view; J.t += dt;
    if (J.to === 'cast') { const u = J.t / DIVE.dur; this.draw(u, J.t); if (u >= 1.35) { this.job = null; this.beads.visible = false; } return; }
    const u = (J.t - (J.to === 'courier' ? DIVE.open : 0)) / DIVE.dur;
    if (J.to === 'courier' && J.t >= DIVE.open && !J.gone) { J.gone = true; const R = this.clips; if (R) R.play('dismiss', { again: true }); }
    if (J.to === 'courier' && J.gone && this.jar && J.t > DIVE.open + 0.42) this.jar.group.visible = false;
    this.draw(u, J.t);
    if (u >= 1 && !J.landed) {
      J.landed = true;
      const local = V.frame.worldToLocal(_b.copy(this.to)); // (the bursts stand in the board's frame)
      if (J.to === 'courier') { V.pieces.dormant = 0; const b = V.pieces.bodyAt(0); if (b) b.s = 1.45; V.bursts?.burst?.(local, filmColour(0.2, _c).getHex(), 16, { speed: 1.1, life: 0.5, fall: 0, spread: 0.25 }); V.bursts?.burst?.(local, 0xffffff, 4, { speed: 0.4, life: 0.2, fall: 0, size: 0.05 }); }
      else { this.standJar(true); V.bursts?.burst?.(V.frame.worldToLocal(this.spot(_a).add(_p.set(0, 0.15, 0))), filmColour(0.6, _c).getHex(), 14, { speed: 1.4, life: 0.5, fall: 3, spread: 0.3 }); }
    }
    if (J.landed) { const b = V.pieces.bodyAt(0); if (b && b.s > 1) b.s = Math.max(1, b.s - dt * 2.2); }
    if (u >= 1.35) { this.job = null; this.beads.visible = false; }
  }
  keepJar() { const J = this.jar; if (J && !J.group.visible) this.standJar(false); else if (J && this.clips && !this.clips.busy && this.clips.move !== 'idle') this.clips.play('idle'); }

  /** The stream: its head at the eased u, its beads trailing up the curve, tapering and walking the film's colours. */
  draw(u, t) {
    if (u <= 0) { this.beads.visible = false; return; }
    const M = this.beads, n = DIVE.beads, head = sm(clamp01(u)), tail = clamp01(u - 0.35) > 0 ? sm(clamp01((u - 0.35) / 1)) : 0; let k = 0;
    for (let i = 0; i < n; i++) {
      const w = head - i * DIVE.gap; if (w < tail || w < 0) break;
      this.at(clamp01(w), _a); const f = 1 - i / n, r = DIVE.size * (0.35 + 0.65 * f) * (1 + 0.15 * Math.sin(t * 30 + i));
      _q.identity(); M.setMatrixAt(k, _m.compose(_a, _q, _s.setScalar(r)));
      M.setColorAt(k++, filmColour(i * 0.04 + t * 0.6, _c).multiplyScalar(1.2 + 0.8 * f));
    }
    M.count = k; M.visible = k > 0; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
  }
}
