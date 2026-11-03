// ---------------------------------------------------------------------------------------
// THE PARRY RANGE'S PITCHING (docs/plans/COMBAT-LAB.md section 4; GAPS G48): the combat wing's station where a shot is parried, at set
// speeds and angles. Its place, the lane, the stand marks and the pitcher (a clay jug on a plinth) are Calissa's (combatwing.js); this is
// the pitching. F at its lectern (a page set aside) chooses the ball (PLAIN: the guard or the parry answers it; OUTLINED: it wears the
// parry mark and goes through the guard, only the parry answers it), the speed (slow, middling, fast), how many (one, a pair, a volley
// of three) and from where (the pitcher down the line, or from the side, ACROSS); PITCH starts it, and it pitches again every few real
// seconds while you stand in the range, until STOP. The balls are the lobbers' (creatures/lobber.js `launch`), each `training`, so a
// parry, a block or a hit here reaches no ledger (tracking.js skips `training`); the parry answers them as it answers any shot.
//
// Prior art: a batting cage's pitching machine (speed and count dialled in, a steady rhythm), Sekiro's and Monster Hunter's training
// areas (one move, repeated on demand, nothing at stake), the house's status bench (its lectern and page: statusbench.js).
//
//   const R = new ParryRange(game)   R.update(dt)   R.page(im, el)   R.set(key, value)   R.on (pitching)   PARRY_RANGE
//   events: parryrange.set { ball, speed, count, from, on, key, by }   (the balls' own: lob.fire, lob.hit, lob.dodged, move.parry, with `training`)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { TR } from './layout.js';

/** speeds (m/s along the line), counts and their gaps (real s), the pause between rounds (real s), the reach of the lectern and of the
 *  range (m from the lane's middle), the mouth's height over the floor and how far out the spout is (combatwingkit.js parryPitcher's),
 *  and how far to the side a ball from ACROSS is thrown from (m). Words: placeholders for Espada's. */
export const PARRY_RANGE = {
  speed: { slow: 9, middling: 14, fast: 20 }, count: { one: 1, pair: 2, volley: 3 }, gap: 0.45, rest: 3.2,
  lectern: 1.8, reach: 9, mouth: { y: 1.8, out: 0.36 }, across: 8,
};
const CHOICES = {
  ball: [['plain', 'Plain', 'The guard or the parry answers it.'], ['outlined', 'Outlined', 'Wears the parry mark: only the parry answers it.']],
  speed: [['slow', 'Slow', `${PARRY_RANGE.speed.slow} m/s`], ['middling', 'Middling', `${PARRY_RANGE.speed.middling} m/s`], ['fast', 'Fast', `${PARRY_RANGE.speed.fast} m/s: a shorter window`]],
  count: [['one', 'One', 'One ball a round.'], ['pair', 'A pair', 'Two, close together.'], ['volley', 'A volley', 'Three, close together.']],
  from: [['line', 'Down the line', 'From the pitcher, ahead of you.'], ['across', 'Across', 'From the side: read later than one from the front.']],
};
const _v = new THREE.Vector3();

export class ParryRange {
  constructor(game) {
    this.game = game; this.on = false; this.t = 0; this.queue = [];
    this.pick = { ball: 'plain', speed: 'middling', count: 'one', from: 'line' };
    const [lx, lz] = TR.wing.parryRange.lectern;
    game.interact?.add('parryrange.lectern', (P) => {
      const d = Math.hypot(P.pos.x - lx, P.pos.z - lz);
      return d < PARRY_RANGE.lectern && Math.abs(P.pos.y - TR.strawman.y) < 1.2 ? { pos: new THREE.Vector3(lx, 1.45, lz), d } : null;
    });
  }

  set(key, value) {
    if (key === 'on') { this.on = !!value; this.t = 0.6; this.queue.length = 0; } else if (CHOICES[key]?.some(([k]) => k === value)) this.pick[key] = value;
    this.game.events?.emit('parryrange.set', { ...this.pick, on: this.on, key, by: 'courier' }); // (key: what changed; the log says the start, the stop and a change while pitching)
  }

  /** In the range: the Courier near the lane and on its floor. */
  inside(P) {
    const R = TR.wing.parryRange, [px, pz] = R.pitcher, far = Math.max(...R.marks.map((m) => m[1]));
    return Math.abs(P.pos.y - TR.strawman.y) < 2 && Math.abs(P.pos.x - px) < PARRY_RANGE.reach && P.pos.z > pz + 1 && P.pos.z < far + 4;
  }

  update(dt) {
    const g = this.game, P = g.player; if (!P) return;
    if (g.interact?.cur?.id === 'parryrange.lectern' && P.peekLatch?.('KeyF')) {
      P.latch('KeyF');
      g.course?.menu?.showPage?.('the parry range', (im, el) => this.page(im, el), { title: 'THE PARRY RANGE', sub: 'click to choose · F closes', aside: 'left' });
    }
    if (!this.on || g.god?.active) return;
    if (!this.inside(P)) { this.t = Math.max(this.t, 0.6); this.queue.length = 0; return; } // (out of the range it waits; back in, a beat, then a round)
    for (let i = this.queue.length - 1; i >= 0; i--) if ((this.queue[i] -= dt) <= 0) { this.queue.splice(i, 1); this.pitch(); }
    if (!this.queue.length && (this.t -= dt) <= 0) {
      const n = PARRY_RANGE.count[this.pick.count] || 1;
      for (let k = 0; k < n; k++) this.queue.push(k * PARRY_RANGE.gap);
      this.t = PARRY_RANGE.rest + (n - 1) * PARRY_RANGE.gap;
    }
  }

  /** One ball: from the pitcher's spout down the line, or from the side of where you stand. */
  pitch() {
    const g = this.game, P = g.player, L = g.lobbers, R = TR.wing.parryRange, M = PARRY_RANGE.mouth, y0 = TR.strawman.y + M.y - 0.3; // (launch adds 0.3 to its mouth)
    if (!L?.launch) return;
    const from = this.pick.from === 'across' ? _v.set(Math.max(TR.wing.inner + 1, P.pos.x - PARRY_RANGE.across), y0, P.pos.z) : _v.set(R.pitcher[0], y0, R.pitcher[1] + M.out);
    L.launch(from.clone(), PARRY_RANGE.speed[this.pick.speed] || 14, { training: true, outlined: this.pick.ball === 'outlined', low: true });
  }

  /** The lectern's page: the ball, the speed, how many, from where; PITCH or STOP. */
  page(im, el) {
    const menu = this.game.course?.menu, again = () => menu?.showPage?.('the parry range', (i2, e2) => this.page(i2, e2), { title: 'THE PARRY RANGE', sub: 'click to choose · F closes', aside: 'left' });
    const head = el('div', 'rooms'), go = el('div', 'room', `<span class="n">${this.on ? '■' : '▶'}</span><span><b>${this.on ? 'Stop' : 'Pitch'}</b><s>${this.on ? 'The pitcher rests.' : 'A round every few seconds while you stand in the range. Nothing here is counted.'}</s></span>`);
    go.onclick = () => { this.set('on', !this.on); menu?.close(); }; head.appendChild(go); im.appendChild(head);
    for (const [key, rows] of Object.entries(CHOICES)) {
      im.appendChild(el('div', 'grp', key.toUpperCase()));
      const grid = el('div', 'rooms');
      for (const [k, label, line] of rows) {
        const r = el('div', 'room', `<span class="n">${this.pick[key] === k ? '●' : '○'}</span><span><b>${label}</b><s>${line}</s></span>`);
        r.onclick = () => { this.set(key, k); again(); }; grid.appendChild(r);
      }
      im.appendChild(grid);
    }
  }
}
