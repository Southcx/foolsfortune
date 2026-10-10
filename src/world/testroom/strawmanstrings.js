// ---------------------------------------------------------------------------------------
// STRAWMAN'S ATTACK STRINGS: the sparring circle's clock (docs/plans/COMBAT-LAB.md sections 2 and 6; the owner, 2026-10-10: every move
// animated, the four strings on the circle's lectern, the spin sweep answered by a jump as well as the parry). Calissa's (the owner put
// Strawman wholly in Calissa's hands: the room's wiring by the smallest edits in room.js). The moves are data (vfx/strawmanmoves.js), the
// body plays them (vfx/strawman.js); this runs them:
//
//   A MOVE    each blow a windup the parry answers (creatures.windup: the parry mark on its striking part, the window's glint, and an
//             `area` a Figment attack telegraph draws at the Courier's Divination, the drawn area the hit area), then the strike: harmless
//             (Strawman never hurts: a shove), counted as landed or not (`strawman.strike`). A parry breaks the blow off (the sleeve eases
//             back) and the punish is the move's recovery; a one-two's first blow parried, its second still comes.
//   A STRING  moves and pauses on a loop (STRAWMAN_STRINGS), picked at the circle's lectern (F: the page), run only while the Courier is
//             inside the circle (step out and it stops: the ring is the rule), Strawman turning on its ball to face them between moves.
//   THE TEMPO 0.25x, 0.5x or 1x (DEBUG only): the world slowed through game.time while a string runs, the Courier too (a study of the
//             shapes, not an easier test).
//
// Prior art: fighting games' training modes (Street Fighter's and Tekken's dummy recording: a string recorded once, played back on a
// loop; the playback speed), Punch-Out!!'s fixed patterns read by their tells, Sekiro's deflected combo (each blow its own deflect, the
// last one the opening), the sumo dohyo (step out of the ring and the bout is over).
//
//   const T = new StrawmanStrings(game, strawman)   T.attack(id)   T.parried()   T.update(dt)   T.pick(id | null)   T.setTempo(k)
//   T.page(im, el)   T.string   T.tempo   T.running   T.busy
//   events: strawman.windup { move, blow, eta }, strawman.strike { move, blow, landed, cleared }, strawman.parried { move },
//   strawman.string { string }, strawman.tempo { tempo }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { STRAWMAN_MOVES, STRAWMAN_STRINGS, KEEP_OUT, PUSH, reachOf, inArea } from '../../vfx/strawmanmoves.js';
import { stream } from '../../core/rng.js';
import { TR } from './layout.js';

const R = stream('strawman.strings');
const TEMPOS = [1, 0.5, 0.25];
const ENTER_BREATH = 1.0; // (real seconds at 1x after the Courier steps into the circle before a string begins)
const LECTERN_REACH = 1.8;
const _v = new THREE.Vector3();

export class StrawmanStrings {
  constructor(game, S) {
    this.game = game; this.S = S; this.model = S.model;
    this.string = null; this.tempo = 1; this.running = false;
    this.i = 0; this.wait = ENTER_BREATH; this.order = null; this.cur = null; this.rest = 0;
    const C = TR.wing.circle, [lx, lz] = C.lectern;
    game.interact?.add('sparring.lectern', (P) => {
      const d = Math.hypot(P.pos.x - lx, P.pos.z - lz);
      return d < LECTERN_REACH && Math.abs(P.pos.y - TR.strawman.y) < 1.2 ? { pos: new THREE.Vector3(lx, 1.45, lz), d } : null;
    });
  }

  /** Is the Courier inside the sparring circle (its clay disc, a step's grace)? */
  inCircle(p) { const C = TR.wing.circle; return Math.hypot(p.x - C.x, p.z - C.z) < C.r + 0.2 && Math.abs(p.y - TR.strawman.y) < 2.5; }
  /** Strawman busy with a move, or still in its punish. */
  get busy() { return !!this.cur || this.rest > 0; }

  /** One move, aimed where Strawman faces now: its first blow's windup at once, each next one's at the blow before it. */
  attack(id) {
    const M = STRAWMAN_MOVES[id]; if (!M || this.busy) return false;
    const yaw = this.model.yaw;
    this.cur = { id, M, aim: new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), blow: 0, landed: false, cleared: false, parried: new Set() };
    this.model.play(id, { onContact: (b, c) => this.contact(b, c), onEnd: () => { this.cur = null; } });
    this.windup(0, M.blows[0].at);
    return true;
  }

  windup(k, eta) {
    const g = this.game, S = this.S, B = this.cur.M.blows[k], A = B.area, r = reachOf(A), aim = this.cur.aim;
    const round = A.shape === 'circle', mid = S.pos.clone().addScaledVector(aim, round ? 0 : r * 0.5); // (where the parry's reach is measured from: the area's middle)
    this.cur.blow = k;
    g.creatures?.windup(S, { at: mid, radius: round ? r : r * 0.5, eta, kind: this.cur.id, part: this.model.parts[B.part], area: A, type: 'impact', answer: 'parry', read: false, draw: { facing: { x: aim.x, z: aim.z } } }); // (Strawman is never counted: no read)
    g.events?.emit('strawman.windup', { move: this.cur.id, blow: k, eta, by: 'creature' });
  }

  /** A blow's part meets the air in front: the strike (contact 0) unwinds its windup; any contact lands on the Courier in its area, as a
   *  shove and no harm, unless a jump clears a low one or a parry's breath covers them. The blow's last contact says how it went. */
  contact(k, c) {
    const g = this.game, cur = this.cur; if (!cur) return;
    const M = cur.M, B = M.blows[k], last = c === (B.also?.length || 0), next = () => { if (k + 1 < M.blows.length) this.windup(k + 1, +(M.blows[k + 1].at - (B.also?.at(-1) ?? B.at)).toFixed(3)); };
    if (cur.parried.has(k)) { if (last) next(); return; }
    if (c === 0) g.creatures?.unwind(this.S);
    const P = g.player, at = this.S.pos, dx = P.pos.x - at.x, dz = P.pos.z - at.z, dy = P.pos.y - at.y;
    const along = dx * cur.aim.x + dz * cur.aim.z, across = dx * cur.aim.z - dz * cur.aim.x;
    if (inArea(B.area, along, across) && Math.abs(dy) < 1.5) {
      if (M.clear != null && dy > M.clear) cur.cleared = true; // (a jump over a low blow: it passes under the feet)
      else if (!(P.invuln > 0) && !cur.landed) {
        cur.landed = true;
        P.impulse?.(_v.set(dx, 0, dz).setLength(PUSH).setY(1.5), 'strawman'); P.shake = Math.max(P.shake || 0, 0.35);
      }
    }
    if (!last) return;
    g.events?.emit('strawman.strike', { move: cur.id, blow: k, landed: cur.landed, cleared: cur.cleared && !cur.landed, by: 'creature' });
    cur.landed = false; cur.cleared = false;
    next();
  }

  /** A parry broke the blow off (creatures.parried calls Strawman's onParried): its part eases back. A move's last blow parried ends the
   *  move, and Strawman stands in its punish for the move's recovery; an earlier one (the one-two's jab) lets the next still come. */
  parried() {
    const g = this.game, cur = this.cur, S = this.S; if (!cur) return;
    const M = cur.M, k = cur.blow, B = M.blows[k];
    this.model.hit(S.center(), _v.set(-cur.aim.x, 0, -cur.aim.z), 1.2); // (it rocks back)
    g.events?.emit('strawman.parried', { move: cur.id, blow: k, by: 'courier' });
    if (k + 1 < M.blows.length && B.owns) { cur.parried.add(k); this.model.breakOff(B.owns); return; }
    this.model.breakOff(); this.cur = null;
    this.rest = M.end - B.at; // (the punish: what was left of the move, from the strike to rest)
  }

  /** The string the lectern picked (null: none). */
  pick(id) {
    this.string = id && STRAWMAN_STRINGS[id] ? id : null; this.i = 0; this.wait = ENTER_BREATH; this.order = null;
    this.game.events?.emit('strawman.string', { string: this.string, by: 'courier' });
  }
  /** The tempo (DEBUG only): 1, 0.5 or 0.25 of the world's speed while a string runs. */
  setTempo(k) {
    if (this.game.mode !== 'debug' || !TEMPOS.includes(k) || k === this.tempo) return;
    this.tempo = k; this.game.events?.emit('strawman.tempo', { tempo: k, by: 'courier' });
  }

  /** Once a frame, in sim seconds (the clock the windups count in). */
  update(dt) {
    const g = this.game, P = g.player, S = this.S, model = this.model;
    if (g.interact?.cur?.id === 'sparring.lectern' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      g.course?.menu?.showPage?.('the sparring circle', (im, el) => this.page(im, el), { title: 'THE SPARRING CIRCLE', sub: 'click a string · F closes', aside: 'left' });
    }
    if (this.rest > 0) this.rest -= dt;
    const was = this.running;
    this.running = !!this.string && this.inCircle(P.pos);
    model.engaged = this.running;
    if (this.running && this.tempo < 1 && g.mode === 'debug') g.time?.slow('sparring.tempo', this.tempo); else g.time?.free('sparring.tempo');
    if (!this.running) { // (out of the circle, or no string: it stops after the move under way, and faces home)
      if (was) { this.i = 0; this.wait = ENTER_BREATH; this.order = null; }
      model.yawTo = 0;
      return;
    }
    if (g.stun?.vulnerable?.(S)) { if (this.cur) { g.creatures?.unwind(S); model.breakOff(); this.cur = null; } return; } // (stunned, asleep, halted: it does nothing)
    if (this.busy) return;
    model.yawTo = Math.atan2(P.pos.x - S.pos.x, P.pos.z - S.pos.z); // (between moves it turns to face the Courier)
    if ((this.wait -= dt) > 0) return;
    const Q = STRAWMAN_STRINGS[this.string];
    if (this.i === 0 && Q.shuffle) { const ids = Q.steps.filter((s) => s.move).map((s) => s.move); for (let n = ids.length - 1; n > 0; n--) { const j = R.int(n + 1); [ids[n], ids[j]] = [ids[j], ids[n]]; } this.order = ids; }
    const step = Q.steps[this.i], nth = Q.steps.slice(0, this.i).filter((s) => s.move).length;
    this.i = (this.i + 1) % Q.steps.length;
    if (step.pause) this.wait = step.pause;
    else if (step.keepOut) this.attack(Math.hypot(P.pos.x - S.pos.x, P.pos.z - S.pos.z) < step.keepOut ? KEEP_OUT.near : KEEP_OUT.far);
    else this.attack(this.order?.[nth] ?? step.move);
  }

  /** The lectern's page: the four strings and none; in DEBUG, the tempo. */
  page(im, el) {
    const g = this.game, menu = g.course?.menu;
    im.appendChild(el('div', 'grp', 'STRINGS · Pick one, then step into the circle'));
    const grid = el('div', 'rooms');
    const row = (id, label, line) => {
      const r = el('div', 'room', `<span class="n">${id === this.string ? '●' : '○'}</span><span><b>${label}</b><s>${line}</s></span>`);
      r.onclick = () => { menu?.close(); this.pick(id); };
      grid.appendChild(r);
    };
    for (const [id, Q] of Object.entries(STRAWMAN_STRINGS)) row(id, Q.label, Q.line);
    row(null, 'None', 'Strawman stands still.');
    im.appendChild(grid);
    if (g.mode !== 'debug') return;
    im.appendChild(el('div', 'grp', 'TEMPO · DEBUG · the world slowed while a string runs'));
    const tg = el('div', 'rooms');
    for (const k of TEMPOS) {
      const r = el('div', 'room', `<span class="n">${k === this.tempo ? '●' : '○'}</span><span><b>${k}x</b><s>${k === 1 ? 'full speed: the test' : `every number x${1 / k} in real seconds`}</s></span>`);
      r.onclick = () => { this.setTempo(k); menu?.showPage?.('the sparring circle', (i2, e2) => this.page(i2, e2), { title: 'THE SPARRING CIRCLE', sub: 'click a string · F closes', aside: 'left' }); };
      tg.appendChild(r);
    }
    im.appendChild(tg);
  }
}
