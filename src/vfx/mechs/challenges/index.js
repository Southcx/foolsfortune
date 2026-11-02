// ---------------------------------------------------------------------------------------
// THE SMASH CHALLENGES' DRESS (plain name; game.challengeLooks; docs/plans/MECHS.md 11.1; the runtime Dovina's, world/hangar/challenges.js):
// her lane's placeholders found by name in the proving ground and dressed over (vfx/mechs/challenges/lane.js the pieces), and her
// events played as the lane's moments (moments.js), stepped on the real clock in the `fx` phase after the hangar has moved things:
//   FOUND BY NAME   challenge.lectern, challenge.line, challenge.ring.<i> (the bull dressed as the whole target, the rest hidden),
//                   challenge.pin.<i>, challenge.ball (the rolling tower's pivot); and every water tower prop (the hangar's props list),
//                   her meshes hidden (visible false), the dress a child so her placing, pivots and clearing carry it
//   THE PINS        each tipped pin watched: knocked (its tilt past 0.15 rad) a spray of glazed chips and dust at its foot along its fall,
//                   down (past 1.3) a thud of dust where its head lands
//   THE BALL        the tower rolling: its legs hidden, dust where it meets the yard as it goes
//   THE LAMPS       the torii's three lamps dim gold until a challenge begins, then counted in red, red, gold and held lit
// Looks only: nothing here scores, moves a prop or touches a collider.
// Prior art: the house's split of rules from looks over a division's placeholders (vfx/strawmanwell/look.js over Dovina's Well,
// vfx/mechs/giants/index.js over her giants); Ultimate Destruction's minigame dressing (a lane laid in the city's own stuff).
//
//   game.challengeLooks = installChallengeLooks(game)   (from installGiantLooks: vfx/mechs/giants/index.js)   .update(rawDt)   .clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { laneKit, disposeDress } from './lane.js';
import { WordTag, tagWords } from './moments.js';
import { RINGS, PINS, pinSpots } from '../../../progress/mechs/challenges.js';
import { PROVING } from '../../../world/hangar/layout.js';

/** The moments' timings (real s): the lamps' count, the pins' knocked and down tilts (rad), the ball's dust every so many metres. */
export const CHALLENGE_LOOK = { lamp: 0.42, knocked: 0.15, down: 1.3, dustEvery: 3.5 };
const LK = CHALLENGE_LOOK, _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();

export class ChallengeLooks {
  constructor(game) {
    this.game = game; this.kit = null; this.into = null; this.dressed = new Map(); this.pins = new Map(); this.tags = [];
    this.lineObj = null; this.lampT = -1; this.lastAt = null; this.ball = null; this.offs = [];
    const ev = game.events, on = (n, f) => ev?.on && this.offs.push(ev.on(n, (e) => { try { f(e || {}); } catch (x) { console.warn('challenge look', x); } }));
    on('challenge.start', () => this.start());
    on('challenge.score', (e) => this.score(e));
    on('challenge.end', (e) => this.end(e));
    on('challenge.quit', () => { this.lampT = -1; });
    on('mech.prop.throw', (e) => { if (e.at) this.lastAt = new THREE.Vector3(...e.at); });
  }
  play(n, ctx) { try { this.game.vfx?.play(n, ctx); } catch { /* (headless) */ } }

  /** A placeholder dressed: its own meshes hidden, the dress hung on it. */
  wear(obj, dress, hide = (o) => o.children) {
    for (const c of hide(obj)) if (c.isMesh) c.visible = false;
    if (obj.isMesh && obj.material) this.hide(obj);
    obj.add(dress); this.dressed.set(obj, dress); return dress;
  }
  /** A placeholder mesh drawn with nothing (its own material kept to put back). */
  hide(o) { o.userData.own ??= o.material; o.material = this.hidden ||= new THREE.MeshBasicMaterial({ visible: false }); }
  dress(o) {
    const K = this.kit, n = o.name;
    if (n === 'challenge.lectern') this.wear(o, K.lectern());
    else if (n === 'challenge.line') { this.lineObj = o; const d = this.wear(o, K.line()); this.lamps = d.userData.lamps; this.paint = d.userData.paint; }
    else if (n === 'challenge.ring.0') this.wear(o, K.target(RINGS[RINGS.length - 1].r)).position.y = -(o.position.y - PROVING.at.y) + 0.0;
    else if (/^challenge\.ring\.\d+$/.test(n)) { this.hide(o); this.dressed.set(o, null); }
    else if (/^challenge\.pin\.\d+$/.test(n)) { this.wear(o, K.pin()); this.pins.set(o, { knocked: false, down: false }); }
    else return false;
    return true;
  }
  /** Every water tower prop wears the tower; the rolling one (in the ball's pivot) hides its legs. */
  towers() {
    for (const r of this.game.hangar?.props?.list || []) {
      if (r.prop !== 'tower' || !r.mesh || this.dressed.has(r.mesh)) continue;
      this.wear(r.mesh, this.kit.tower());
    }
  }

  update(dt) {
    const H = this.game.hangar, into = H?.built !== false && H?.field?.group ? H.field.group : null;
    if (into !== this.into) { this.clear(); this.into = into; }
    if (!into) return;
    this.kit ||= laneKit();
    for (const o of into.children) if (o.name.startsWith('challenge.') && !this.dressed.has(o) && o.name !== 'challenge.ball') this.dress(o);
    this.towers();
    for (const [o, d] of this.dressed) if (!o.parent) { if (d) disposeDress(d); this.dressed.delete(o); this.pins.delete(o); if (o === this.lineObj) { this.lineObj = null; this.lamps = null; } }
    this.watchPins(); this.roll(into); this.stepLamps(dt);
    for (let i = this.tags.length - 1; i >= 0; i--) { const T = this.tags[i]; if (!T.tag.update(dt, T.at)) { T.tag.dispose(); this.tags.splice(i, 1); } }
  }

  // ------------------------------------------------------------------ the pins and the ball
  watchPins() {
    for (const [g, s] of this.pins) {
      if (s.down || !g.visible) continue;
      const tilt = 2 * Math.acos(Math.min(1, Math.abs(g.quaternion.w)));
      if (!s.knocked && tilt > LK.knocked) {
        s.knocked = true; g.updateMatrixWorld(true); const foot = g.getWorldPosition(_a), top = _b.set(0, PINS.h, 0).applyMatrix4(g.matrixWorld);
        const dir = top.sub(foot).setY(0).normalize();
        this.play('challenge.pin.chips', { pos: foot.clone().setY(foot.y + 1), dir: dir.clone().setY(0.5).normalize(), floor: foot.y }); s.dir = dir.clone();
      }
      if (s.knocked && !s.down && tilt > LK.down) {
        s.down = true; const foot = g.getWorldPosition(_a);
        this.play('challenge.pin.thud', { pos: foot.clone().addScaledVector(s.dir, PINS.h * 0.6).setY(foot.y + 0.3), floor: foot.y });
      }
    }
  }
  roll(into) {
    const piv = into.children.find((o) => o.name === 'challenge.ball');
    if (!piv) { this.ball = null; return; }
    if (this.ball?.piv !== piv) {
      this.ball = { piv, last: piv.position.clone(), run: 0 };
      piv.traverse((o) => { if (o.userData?.legs) o.userData.legs.visible = false; }); // (a rolling tower has no legs)
    }
    const B = this.ball, d = piv.position.distanceTo(B.last); B.last.copy(piv.position); B.run += d;
    if (B.run > LK.dustEvery) { B.run = 0; this.play('challenge.ball.dust', { pos: _a.copy(piv.position).setY(PROVING.at.y + 0.4), floor: PROVING.at.y }); }
  }

  // ------------------------------------------------------------------ the lamps
  start() {
    this.lampT = 0;
    const L = this.lineObj; if (!L) return;
    L.updateMatrixWorld(true); const c = L.getWorldPosition(_a), w = 16;
    this.play('challenge.line.lit', { pos: c.clone(), from: c.clone().setZ(c.z - w), to: c.clone().setZ(c.z + w), floor: PROVING.at.y });
  }
  stepLamps(dt) {
    if (!this.lamps) return;
    const t = this.lampT >= 0 ? (this.lampT += dt) : -1;
    this.lamps.forEach((m, i) => {
      const on = t >= 0 && t >= i * LK.lamp, k = on ? (t < 3 * LK.lamp ? 1 : 0.85 + 0.15 * Math.sin(t * 3 + i)) : 0.22 + 0.06 * Math.sin(performance.now() / 600 + i);
      const col = on ? m.userData.lit : 0xffd36a; m.material.color.setHex(col).multiplyScalar(on ? 2.2 * k : k);
      if (on && !m.userData.said) { m.userData.said = true; m.updateMatrixWorld(true); this.play('challenge.lamp', { pos: m.getWorldPosition(_a).clone() }); }
      if (!on) m.userData.said = false;
    });
    if (this.paint) this.paint.emissiveIntensity = t >= 0 && t < 1.6 ? 0.9 * (1 - t / 1.6) : 0.05;
  }

  // ------------------------------------------------------------------ the score and the end
  /** Where a score happened: the pins' middle (bowling), the last throw's landing (the others). */
  hitAt(e) {
    const A = PROVING.at;
    if (e.id === 'bowling') { const S = pinSpots(); let x = 0, z = 0; for (const s of S) { x += s.x; z += s.z; } return new THREE.Vector3(A.x + x / S.length, A.y, A.z + z / S.length); }
    return this.lastAt ? this.lastAt.clone().setY(A.y) : null;
  }
  score(e) {
    const W = tagWords(e), at = this.hitAt(e); if (!W || !at || !this.into) return;
    if (W.big && e.id === 'bowling') this.play('challenge.strike', { pos: at.clone().setY(at.y + 6), floor: at.y });
    else if (e.add > 0) this.play('challenge.hit', { pos: at.clone().setY(at.y + 0.5), floor: at.y });
    const tag = new WordTag(W.text, W); this.into.add(tag.sprite);
    this.tags.push({ tag, at: at.clone().setY(at.y + (e.id === 'bowling' ? PINS.h + (W.big ? 18 : 3) : 4)) });
  }
  end(e) {
    const L = this.lineObj, A = PROVING.at; let at;
    if (L) { L.updateMatrixWorld(true); at = L.getWorldPosition(new THREE.Vector3()).add(_a.set(30, 0, 0)); } else at = new THREE.Vector3(A.x - 120, A.y, A.z - 155);
    if (e.medal > 0) this.play(`challenge.medal.${Math.min(3, e.medal)}`, { pos: at.setY(A.y + 2), floor: A.y });
    else this.play('challenge.ball.dust', { pos: at.setY(A.y + 0.4), scale: 2, floor: A.y });
    this.lampT = -1;
  }

  clear() {
    for (const [o, d] of this.dressed) { if (d) disposeDress(d); for (const c of o.children) if (c.isMesh) c.visible = true; if (o.userData.own) { o.material = o.userData.own; delete o.userData.own; } }
    this.dressed.clear(); this.pins.clear(); this.lineObj = null; this.lamps = null; this.paint = null; this.ball = null;
    for (const T of this.tags) T.tag.dispose(); this.tags = [];
    this.kit?.dispose(); this.kit = null; this.into = null;
  }
  dispose() { this.clear(); for (const o of this.offs) o?.(); this.offs = []; this.hidden?.dispose(); }
}

/** Installed and stepped in the `fx` phase on the real clock (core/systems.js). */
export function installChallengeLooks(game) {
  const L = game.challengeLooks = new ChallengeLooks(game);
  game.systems?.add('fx', L, { clock: 'raw', name: 'challengeLooks' });
  return L;
}
