// ---------------------------------------------------------------------------------------
// STEALTH'S MARKS (STEALTH.md 5; GAPS G238, G239): what sneaking shows, on the body and on the ground, never a gauge.
//   THE WATCH ON THE BODY   a slip jelly's head up or down (`c.vigil.up`, stamped by progress/stealth.js `vigilAt`): up, it draws itself
//                           tall and leans back, turning its front slowly side to side as it scans; down, it settles low and forward
//                           over its business and nibbles (small quick dips of the squash, a ripple through it). Laid over the body
//                           after it has posed (the deformer's uniforms and the root's turn, creatures/jelly/deform.js, slipjelly.js),
//                           a frame's look only: the body's own springs and its mind are untouched, and the next pose writes them
//                           afresh. Only while it is about its own business (idle, walking, eating, resting, soaking): a jelly that
//                           has seen you, fights, sleeps or is stunned shows those instead. The Lantern Wisp's is in its own look
//                           (vfx/lanternwisplook.js `vigil`: the lantern lifted and the flame flaring as it scans), from VIGIL_TELL.
//   THE STEP'S RIPPLE       a footstep while crouched (`move.step`): a faint hoop of the film run out over the ground to the step's noise
//                           radius (stepNoise: the gait, the ground, the posture, the rain), fainter the quieter it is (`stealth.step`,
//                           vfx/library/tells.js). Prone steps are silent and draw none; standing steps are the sound's alone.
// The Watch's count over a head that is down stays the rung's (vfx/domainartmarks.js).
//
// Prior art: Mark of the Ninja's noise rings (the rule drawn at its true size); deer stalking and the vigilance bouts of foraging animals
// (a head up scanning, a head down feeding: move while it is down); Shadow of the Colossus's and Okami's animals grazing.
//
//   game.stealthMarks = new StealthMarks(game)   (boot/rooms.js; the `fx` phase)   .update(raw)   VIGIL_TELL
// ---------------------------------------------------------------------------------------
import { stepNoise } from '../progress/stealth.js';

/** The tell's numbers. jelly: up `sq` (the squash's lift) and `back` (the lean back), `scan` (radians the front turns, either side) at
 *  `scanHz`; down `sq` and `fwd`, its nibble `nib` (a dip of the squash) at `nibHz`; `ease` how fast it changes (/s); `calm` the poses it
 *  shows in. wisp: up `lift` (m the lantern rises), `tip` (radians the body tips back), `flare` (the flame's share brighter), `scan`,
 *  `scanHz`; down `sink` (m), `bow` (radians forward), `dim`. step: `minK`, `maxK` the hoop's strength, `fullAt` m of radius at its
 *  strongest. */
export const VIGIL_TELL = {
  jelly: { up: { sq: 0.12, back: 0.08, scan: 0.42, scanHz: 0.55 }, down: { sq: -0.1, fwd: 0.1, nib: 0.05, nibHz: 3.2 }, ease: 5, calm: ['idle', 'walk', 'eat', 'rest', 'soak'] },
  wisp: { up: { lift: 0.12, tip: -0.1, flare: 0.35, scan: 0.5, scanHz: 0.45 }, down: { sink: 0.06, bow: 0.14, dim: 0.85 }, ease: 4, calm: ['idle', 'drift', 'rest'] },
  step: { minK: 0.25, maxK: 0.9, fullAt: 5 },
};
const J = VIGIL_TELL.jelly;

/** A frame's offset laid on a value its owner writes each frame: when the owner did not write it this frame (the value still the one we
 *  wrote), the offset goes on the value it had before, so it never builds up. */
export function layered(store, key, cur, add) {
  const s = store[key] || (store[key] = { out: NaN, base: 0 });
  const base = cur === s.out ? s.base : cur;
  s.base = base; s.out = base + add;
  return s.out;
}

export class StealthMarks {
  constructor(game) {
    this.game = game; this.t = 0; this.tell = new WeakMap();
    game.events?.on?.('move.step', (e) => this.step(e));
  }

  /** A footstep: its ripple, while crouched. */
  step(e) {
    const g = this.game, P = g.player, S = g.stealth; if (!P || !g.vfx || g.god?.active) return;
    const posture = S?.posture?.() || P.posture || (P.crouching ? 'crouch' : 'stand');
    if (posture === 'stand') return;
    const r = stepNoise({ surface: e.surface, speed: S?.speed?.() ?? e.speed ?? 0, posture, ...(S?.sky?.() || {}) });
    if (!(r > 0.3)) return;
    const W = VIGIL_TELL.step, h = g.vfx.play('stealth.step', { pos: P.pos, scale: r });
    if (h) h.k = W.minK + (W.maxK - W.minK) * Math.min(1, r / W.fullAt);
  }

  update(raw = 1 / 60) {
    this.t += raw;
    const g = this.game, P = g.player; if (!P) return;
    for (const c of g.jellies?.list || []) {
      if (!c.alive || !c.vigil || c.driven || c.held || c.taking || !c.deform?.u || !c.root) continue;
      if (Math.abs(c.pos.x - P.pos.x) > 60 || Math.abs(c.pos.z - P.pos.z) > 60) continue;
      let T = this.tell.get(c); if (!T) { T = { k: 0, up: 0, ph: (c.id || 1) * 1.37 }; this.tell.set(c, T); }
      const calm = J.calm.includes(c.pose) && !c.attack && !c.air;
      const e = Math.min(1, raw * J.ease);
      T.k += ((calm ? 1 : 0) - T.k) * e; T.up += ((c.vigil.up ? 1 : 0) - T.up) * e;
      if (T.k < 0.01) continue;
      const u = c.deform.u, up = T.up * T.k, down = (1 - T.up) * T.k, t = this.t + T.ph;
      const nib = Math.max(0, Math.sin(t * J.down.nibHz * Math.PI * 2)) ** 3;
      u.uSq.value = layered(T, 'sq', u.uSq.value, J.up.sq * up + (J.down.sq - J.down.nib * nib) * down);
      u.uLean.value.set(u.uLean.value.x, layered(T, 'lean', u.uLean.value.y, -J.up.back * up + J.down.fwd * down));
      c.root.rotation.y = layered(T, 'yaw', c.root.rotation.y, Math.sin(t * J.up.scanHz * Math.PI * 2) * J.up.scan * up);
      if (nib > 0.6 && down > 0.5) c.deform.wob = Math.max(c.deform.wob || 0, 0.015);
    }
  }
}
