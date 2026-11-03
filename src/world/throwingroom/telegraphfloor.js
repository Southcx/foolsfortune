// ---------------------------------------------------------------------------------------
// THE FIGMENT TELEGRAPH FLOOR'S CASTER (docs/plans/COMBAT-LAB.md section 3; GAPS G47): every Figment attack telegraph's shape thrown in
// turn, the drawn area being the hit area (FIGMENT-TELEGRAPHS.md section 3, rule 2). The screed, the mark and the caster's urn on its
// turntable are Calissa's (combatwing.js); this is the caster as a creature: it winds up a shape through the creatures' own windup
// (`creatures.windup` with an `area`, so Divination's mark is drawn by the house's path: vfx/figmenttelegraph.js), and when the windup
// runs out the Courier still inside the shape is shoved, harmlessly (Strawman's swing's push), so "the drawn area is the hit area" is
// felt, not said. Out of it, looked away (the gaze), guarding (a raidwide) or on high ground (the floor): answered. It is `training`:
// nothing here reaches the ledger (`foe.dodge` is skipped for a training creature; `windup.read` carries `training`).
//
// F at its lectern (a page set aside): the shape (FIGMENT_SHAPES, or ALL IN TURN), the windup's length (1, 2, 3 real s), and the step of
// what the mark says (the fidelity ladder: tells, where, when, kind, answer: a Divination level each, as the workbench's stage reads
// them); CAST starts it, a cast every few real seconds while you stand on the floor, until STOP. The adds and the split are drawn and
// answered by no shove (they ask for a body that is not here).
//
// Prior art: FFXIV's striking dummies and its mechanic tutorials (one telegraph at a time, felt), Monster Hunter's training area, the
// house's status bench and parry range (their lecterns and pages: statusbench.js, parryrange.js).
//
//   const F = new TelegraphFloor(game)   F.update(dt)   F.page(im, el)   F.set(key, value)   F.caster (the creature)   TELEGRAPH_FLOOR
//   events: telegraph.cast { shape, hit, answer, by: 'environment' }, telegraphfloor.set { shape, eta, step, on, key, by }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TR } from './layout.js';
import { FIGMENT_SHAPES, figmentMarkOf } from '../../progress/combat/figmenttelegraphs.js';

/** Each shape's windup as the caster throws it (sizes in metres, about the caster's facing toward the mark; `at: 'courier'` laid where
 *  the Courier stands as it begins), its damage type and status (shown at the kind step): the workbench's demo's (figmenttelegraphstage.js). */
export const CASTS = {
  circle: { area: { shape: 'circle', at: 'courier', radius: 3 }, type: 'impact', status: 'stun' },
  ring: { area: { shape: 'ring', inner: 2.4, outer: 6 }, type: 'ego', status: 'doubt' },
  'out-in': { area: { shape: 'out-in', inner: 2.2, outer: [2.2, 5.5] }, type: 'ego', status: 'doubt' },
  cone: { area: { shape: 'cone', degrees: 100, length: 6.5 }, type: 'influence', status: 'charm' },
  line: { area: { shape: 'line', width: 2.6, length: 9 }, type: 'illusion', status: 'blind' },
  lunge: { area: { shape: 'lunge', at: 'courier', reach: 7, width: 2 }, type: 'delirium', status: 'confusion' },
  baited: { area: { shape: 'baited', drops: 3, radius: 1.6, at: 'courier' }, type: 'impact', status: 'slow' },
  left: { area: { shape: 'left', radius: 1.3, at: 'courier' }, type: 'delirium', status: 'soaked' },
  tracked: { area: { shape: 'tracked', radius: 2.6, at: 'courier' }, type: 'illusion', status: 'sleep' },
  floor: { area: { shape: 'floor', radius: 6.5 }, type: 'ego', status: 'halt' },
  gaze: { area: { shape: 'gaze' }, type: 'ego', status: 'stun' },
  raidwide: { area: { shape: 'raidwide' }, type: 'impact', status: null },
  adds: { area: { shape: 'adds' }, type: null, status: null },
  split: { area: { shape: 'split' }, type: null, status: null },
};
/** etas (real s), the fidelity steps (a Divination level each: tells, where, when, kind, answer), the pause between casts (real s), the
 *  shove (m/s out, up), the lectern's reach (m), and the floor's margin (m) the Courier counts as on it within. Words: placeholders. */
export const TELEGRAPH_FLOOR = { etas: [1, 2, 3], steps: [['tells', 1], ['where', 2], ['when', 8], ['kind', 20], ['answer', 35]], rest: 2.2, shove: [6, 2.5], lectern: 1.8, margin: 1, high: 0.6 };
const _v = new THREE.Vector3(), _f = new THREE.Vector3();

export class TelegraphFloor {
  constructor(game) {
    this.game = game; this.on = false; this.t = 0; this.turn = 0; this.cast = null;
    this.pick = { shape: 'all', eta: 2, step: 'answer' };
    const F = TR.wing.telegraphFloor, [cx, cz] = F.caster, [mx, mz] = F.mark;
    this.caster = { type: 'creature', kind: 'caster', name: 'the caster', training: true, pos: new THREE.Vector3(cx, TR.strawman.y, cz), radius: 0.6, height: 1.8, yaw: Math.atan2(mx - cx, mz - cz), alive: true, tags: new Set(), center: (o = new THREE.Vector3()) => o.set(cx, TR.strawman.y + 1, cz) };
    game.creatures?.add(this.caster);
    const [lx, lz] = F.lectern;
    game.interact?.add('telegraphfloor.lectern', (P) => {
      const d = Math.hypot(P.pos.x - lx, P.pos.z - lz);
      return d < TELEGRAPH_FLOOR.lectern && Math.abs(P.pos.y - TR.strawman.y) < 1.2 ? { pos: new THREE.Vector3(lx, 1.45, lz), d } : null;
    });
  }

  set(key, value) {
    if (key === 'on') { this.on = !!value; this.t = 0.8; if (!this.on) this.stop(); } else this.pick[key] = value;
    this.game.events?.emit('telegraphfloor.set', { ...this.pick, on: this.on, key, by: 'courier' });
  }
  stop() { this.cast = null; this.game.creatures?.unwind(this.caster, 'stop'); }

  /** On the floor: the Courier on the screed (within its margin). */
  inside(P) { const F = TR.wing.telegraphFloor, m = TELEGRAPH_FLOOR.margin; return Math.abs(P.pos.y - TR.strawman.y) < 3 && P.pos.x > F.x0 - m && P.pos.x < F.x1 + m && P.pos.z > F.z0 - m && P.pos.z < F.z1 + m; }

  update(dt) {
    const g = this.game, P = g.player; if (!P) return;
    if (g.interact?.cur?.id === 'telegraphfloor.lectern' && P.peekLatch?.('KeyF')) { P.latch('KeyF'); this.open(); }
    if (!this.on || g.god?.active) return;
    if (!this.inside(P)) { if (this.cast) this.stop(); this.t = Math.max(this.t, 0.8); return; }
    if (this.cast) { if ((this.cast.t -= dt) <= 0) this.land(); return; }
    if ((this.t -= dt) <= 0) this.begin();
  }

  /** A windup of the chosen shape (or the next in turn), its mark at the chosen step. */
  begin() {
    const g = this.game, P = g.player, C = this.caster, ids = Object.keys(CASTS);
    const shape = this.pick.shape === 'all' ? ids[this.turn++ % ids.length] : this.pick.shape, S = CASTS[shape], eta = this.pick.eta;
    const area = { ...S.area }, at = area.at === 'courier' ? P.pos.clone().setY(TR.strawman.y) : C.pos.clone();
    const radius = area.radius ?? area.length ?? area.reach ?? (Array.isArray(area.outer) ? area.outer[1] : area.outer) ?? 6;
    g.creatures?.windup(C, { at, radius, eta, kind: shape, parry: false, area, type: S.type, status: S.status, answer: FIGMENT_SHAPES[shape]?.answer ?? null });
    const w = C.windup; if (w) { const lv = TELEGRAPH_FLOOR.steps.find(([s]) => s === this.pick.step)?.[1] ?? 35; w.figmentTelegraph = figmentMarkOf(w, lv, false); g.creatures.drawFigmentTelegraph(C, w); } // (the lectern's step, not the Courier's Divination)
    this.cast = { shape, area, at, t: eta, start: P.pos.clone() };
  }

  /** The windup runs out: the Courier still in the shape is shoved, harmlessly; out of it, answered. */
  land() {
    const g = this.game, P = g.player, K = this.cast; this.cast = null; this.t = TELEGRAPH_FLOOR.rest;
    const hit = this.holds(K, P), answer = FIGMENT_SHAPES[K.shape]?.answer ?? null;
    if (hit) {
      _v.set(P.pos.x - this.caster.pos.x, 0, P.pos.z - this.caster.pos.z); if (_v.lengthSq() < 1e-4) _v.set(0, 0, 1); _v.normalize();
      P.impulse(_v.multiplyScalar(TELEGRAPH_FLOOR.shove[0]).setY(TELEGRAPH_FLOOR.shove[1]), 'caster'); P.grounded = false;
    }
    g.creatures?.unwind(this.caster, hit ? 'end' : 'answered');
    g.events?.emit('telegraph.cast', { shape: K.shape, hit, answer, by: 'environment' }); // (no ledger rule counts it; it is the log's line)
  }

  /** Is the Courier in the cast's shape as it lands (the drawn area: FIGMENT-TELEGRAPHS.md 3, rule 2)? */
  holds(K, P) {
    const A = K.area, C = this.caster, s = A.shape, f = _f.set(Math.sin(C.yaw), 0, Math.cos(C.yaw));
    const dx = P.pos.x - K.at.x, dz = P.pos.z - K.at.z, d = Math.hypot(dx, dz);
    const along = dx * f.x + dz * f.z, side = Math.abs(dx * f.z - dz * f.x); // (from the cast's origin, along the caster's facing)
    switch (s) {
      case 'circle': case 'baited': case 'left': case 'tracked': return d <= A.radius;
      case 'ring': return d >= A.inner && d <= A.outer;
      case 'out-in': return d <= A.outer[1];
      case 'cone': return d <= A.length && d > 0.01 && along / d >= Math.cos((A.degrees * Math.PI) / 360);
      case 'line': return along >= 0 && along <= A.length && side <= A.width / 2;
      case 'lunge': { const sx = K.at.x - C.pos.x, sz = K.at.z - C.pos.z, L = Math.hypot(sx, sz) || 1, ux = sx / L, uz = sz / L, px = P.pos.x - C.pos.x, pz = P.pos.z - C.pos.z, a = px * ux + pz * uz;
        return a >= 0 && a <= Math.max(A.reach, L + 1) && Math.abs(px * uz - pz * ux) <= A.width / 2; }
      case 'floor': return d <= A.radius && P.pos.y - TR.strawman.y < TELEGRAPH_FLOOR.high;
      case 'gaze': { const cam = this.game.camera; if (!cam) return false; cam.getWorldDirection(_v); _f.copy(C.pos).setY(C.pos.y + 1).sub(cam.position).normalize(); return _v.dot(_f) > 0.5; }
      case 'raidwide': return !P.guarding;
      default: return false; // (adds and split: no body here to answer with)
    }
  }

  open() { this.game.course?.menu?.showPage?.('the telegraph floor', (im, el) => this.page(im, el), { title: 'THE TELEGRAPH FLOOR', sub: 'click to choose · F closes', aside: 'left' }); }
  /** The lectern's page: CAST or STOP, the shape, the windup's length, the mark's step. */
  page(im, el) {
    const menu = this.game.course?.menu, rows = (title, list, key) => {
      im.appendChild(el('div', 'grp', title)); const grid = el('div', 'rooms');
      for (const [v, label, line] of list) { const r = el('div', 'room', `<span class="n">${this.pick[key] === v ? '●' : '○'}</span><span><b>${label}</b><s>${line}</s></span>`); r.onclick = () => { this.set(key, v); this.open(); }; grid.appendChild(r); }
      im.appendChild(grid);
    };
    const head = el('div', 'rooms'), go = el('div', 'room', `<span class="n">${this.on ? '■' : '▶'}</span><span><b>${this.on ? 'Stop' : 'Cast'}</b><s>${this.on ? 'The caster rests.' : 'A cast every few seconds while you stand on the floor. Nothing here is counted.'}</s></span>`);
    go.onclick = () => { this.set('on', !this.on); menu?.close(); }; head.appendChild(go); im.appendChild(head);
    rows('SHAPE', [['all', 'All in turn', 'Every shape, one after another.'], ...Object.keys(CASTS).map((k) => [k, k[0].toUpperCase() + k.slice(1), `Answer: ${FIGMENT_SHAPES[k]?.answer ?? '-'}`])], 'shape');
    rows('WINDUP', TELEGRAPH_FLOOR.etas.map((e) => [e, `${e} s`, e === 1 ? 'Quick: read it fast.' : e === 3 ? 'Slow: time to read every part.' : 'Middling.']), 'eta');
    rows('THE MARK SAYS', TELEGRAPH_FLOOR.steps.map(([s, lv]) => [s, s[0].toUpperCase() + s.slice(1), `As Divination ${lv} draws it.`]), 'step');
  }
}
