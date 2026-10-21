// ---------------------------------------------------------------------------------------
// THE FOES' MOVES: how a foe of the crossing's roster moves when its row says how (progress/rail/showcase.js ROSTER `moves`, Dovina's:
// the plan's path column, RAIL-MODULES.md 6), in place of its formation's path (world/emocean/waves.js PATHS). A move is laid in the
// VIEW'S FRAME the foe entered in (legs.js CARRIER_AT[view].box: across, up and along, as that view's camera sees them), so "from an
// edge" and "the far edge" mean the screen's own: chase's far edge is ahead, the overhead view's is the top, the side view's the right.
// Each move is a path of its own: (t real s since it entered, out) -> false once it has gone, as the formations are.
//   arc       in from an edge on an arc through an apex near the ship and out the other side; never holds (swooper)
//   dash      dashes to a hold on a flank, holds, dashes out (darter)
//   charge    comes to range (never nearer the ship than `from` m), holds, glows `glow` beats (its windup: `glowing`), then charges
//             the point the ship was at, at `speed` m/s, and passes through; touching the ship it is a blow the roll can dodge (rammer)
//   hold      comes to its anchor (farEdge, edge, middle, broadside), holds `hold` bars (a sweep's three; `until: 'beaten'`, until downed),
//             leaves the way it came
//   overtake  waits `mark` beats unseen at an edge behind (the edge mark shown there), then crosses the frame and leaves ahead (ambusher)
//   fixed     scrolls with the world from the far edge to the near, `onScreen` bars in the frame (turret; a mine the same)
//   cross     crosses the frame once, side to side (mine-layer)
//   tether    flies `length` m off its charge, circling it a turn in `turn` real s in the view's play plane (escort)
//   drift     drifts into a third of the frame and holds it (blocker)
//   swing     swings in on a line from an edge toward the ship, where its mechanic latches it (grappler)
// What a role does beyond moving is its mechanic (world/emocean/foemechanics.js).
//
// Prior art: the shmup's enemy scripts (Cave's, Treasure's: an entry, a hold, an exit), Galaga's swoops, R-Type's overtakers from behind
// with their warning, Gradius's turrets on the scrolling ground, Ikaruga's and Radiant Silvergun's blocking walls.
//
//   foeMove(moves, { view, i, n, lane, W, f }) -> path(t, i, n, L, out) -> bool   scrollOf(view, onScreen) -> m/s (the world's scroll
//   in a view's frame: its span over onScreen bars)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BAR_S } from '../../progress/rail/crossing.js';
import { CARRIER_AT } from '../../progress/rail/legs.js';
import { CRUISE } from '../../courier/ship/views.js';

const BEAT = BAR_S / 4, RAM_R = 2.2; // (how near a charge is a ram, m)
/** How fast the world scrolls past in a view's frame (m/s): its span along the scroll (z in every frame) over `onScreen` bars, so a
 *  turret or a mine is in frame that long whatever the view (Dovina's `onScreen`, 2026-10-20). */
export const scrollOf = (view, onScreen = 3) => { const z = (CARRIER_AT[view] || CARRIER_AT.chase).box.z; return (z[1] - z[0]) / (onScreen * BAR_S); };
export const AXES = { above: { h: 'x', v: 'z', d: 'y' }, side: { h: 'z', v: 'y', d: 'x' } }; // (else chase's: across x, up y, along z)
const ease = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** A view's frame: a point at (h -1..1 across, v 0..1 up, d 0..1 along) in the rail frame, beyond 0..1 off the screen. Its (h, v) is
 *  the view's play plane (chase the screen, overhead the sea, side the wall); `AXES` names which rail axis each is. */
export function viewFrame(view) {
  const B = (CARRIER_AT[view] || CARRIER_AT.chase).box, A = AXES[view] || { h: 'x', v: 'y', d: 'z' };
  const span = (k) => (k === 'x' ? [-B.x, B.x] : B[k]);
  const H = span(A.h), V = span(A.v), D = span(A.d);
  return (h, v, d = 0.5, out = new THREE.Vector3()) => {
    out[A.h] = (H[0] + H[1]) / 2 + h * (H[1] - H[0]) / 2; out[A.v] = V[0] + v * (V[1] - V[0]);
    out[A.d] = view === 'above' ? CRUISE : view === 'side' ? 0 : D[0] + d * (D[1] - D[0]);
    return out;
  };
}
/** Where a hold's anchor is, and the point beyond the frame it comes in from. */
function anchorOf(at, P, side, view) {
  const A = { farEdge: [view === 'side' ? 0.85 : 0, view === 'above' ? 0.9 : 0.5, 0.9], edge: [side * 0.8, 0.55, 0.55], middle: [0, 0.5, 0.55],
    broadside: [side * 0.55, 0.45, 0.35] }[at] || [0, 0.5, 0.55];
  const from = at === 'edge' ? [side * 1.35, A[1], A[2]] : view === 'side' ? [1.3, A[1], A[2]] : view === 'above' ? [A[0], 1.2, A[2]] : [A[0], A[1], 1.35];
  return [P(...A), P(...from)];
}
const lerp3 = (a, b, k, out) => out.lerpVectors(a, b, k);

const MOVES = {
  hold(m, { P, side, view, W }) {
    const [A, F] = anchorOf(m.at, P, side, view), H = m.until === 'beaten' ? Infinity : m.hold === 'sweep' ? 3 : m.hold ?? 4; // (a mid-boss holds until it is downed: RAIL-FLOW.md 5)
    let off = null; // (the bar it began to leave: its hold done, or the view it was laid in turned, so nothing stays off its plane)
    return (t, out) => { const b = t / BAR_S;
      if (b < 1) return !!lerp3(F, A, ease(b), out);
      if (off == null && (b >= 1 + H || (W?.view && W.view !== view))) off = b;
      if (off == null) { out.copy(A); out.y += Math.sin(t * 1.3) * 0.3; return true; }
      lerp3(A, F, ease(b - off), out); return b < off + 1; };
  },
  arc(m, { P, side }) {
    const S = P(side * 1.25, 0.85, 0.8), Ap = P(side * 0.25, 0.3, 0.3), E = P(-side * 1.25, 0.85, 0.8), C = Ap.clone().multiplyScalar(2).addScaledVector(S, -0.5).addScaledVector(E, -0.5);
    return (t, out) => { const u = t / (3 * BAR_S); if (u > 1) return false; const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
      out.set(0, 0, 0).addScaledVector(S, a).addScaledVector(C, b).addScaledVector(E, c); return true; };
  },
  dash(m, { P, side, i }) {
    const O = P(side * 1.35, 0.55, 0.6), A = P(side * 0.65, 0.45 + 0.12 * (i % 3), 0.55), H = m.hold ?? 2;
    return (t, out) => { const b = t / BAR_S;
      if (b < 0.5) return !!lerp3(O, A, ease(b * 2), out);
      if (b < 0.5 + H) { out.copy(A); return true; }
      lerp3(A, O, ease((b - 0.5 - H) * 2), out); return b < 1 + H; };
  },
  charge(m, { P, side, W, f }) {
    const A = P(side * 0.3, 0.5, 0.75), F = P(side * 0.3, 0.5, 1.35), glow = (m.glow ?? 1) * BEAT, speed = m.speed ?? 34, aim = new THREE.Vector3(), dir = new THREE.Vector3();
    const keepOff = () => { const s = W.ship?.local; if (!s) return; const d = A.distanceTo(s), from = m.from ?? 5; if (d < from) A.sub(s).setLength(from).add(s); }; // (never nearer the ship than `from` m: the flight is the dodge's time)
    let hit = false, t0 = null;
    return (t, out) => { const b = t / BAR_S;
      if (b < 1) return !!lerp3(F, A, ease(b), out);
      if (b < 2) { keepOff(); out.copy(A); return true; }
      if (t < 2 * BAR_S + glow) { // (its glow: the windup the leg's shots do not have; downed in it, it pays the windup's share)
        if (!f.glowing) { f.glowing = true; aim.copy(W.ship?.local || out); dir.copy(aim).sub(A).normalize(); }
        out.copy(A); f.glow = (t - 2 * BAR_S) / glow; return true;
      }
      f.glowing = false; f.glow = 0; t0 ??= t;
      out.copy(A).addScaledVector(dir, (t - t0) * speed);
      if (!hit && W.ship && out.distanceTo(W.ship.local) < RAM_R + f.radius * 0.5) { hit = true; W.game.emocean?.blow?.(1, { by: 'creature', what: 'ram', rollable: true }); }
      return out.distanceTo(A) < 120; };
  },
  overtake(m, { P, side, view, W, f }) {
    const E = view === 'side' ? P(-1.25, 0.5) : view === 'above' ? P(side * 0.4, -0.2) : P(side * 0.8, 0.4, -0.45);
    const X = view === 'side' ? P(1.3, 0.55) : view === 'above' ? P(side * 0.4, 1.2) : P(side * 0.3, 0.5, 1.2);
    const mark = view === 'side' ? P(-0.92, 0.5) : view === 'above' ? P(side * 0.4, 0.04) : P(side * 0.92, 0.4, 0.05), wait = (m.mark ?? 4) * BEAT, w = new THREE.Vector3();
    let marked = false;
    return (t, out) => {
      if (t < wait) { // (unseen at the edge behind, its mark shown where it will come in)
        f.solid = false; if (f.mesh) f.mesh.visible = false; out.copy(E);
        if (!marked) { marked = true; if (!W.game.ambushMark?.show(mark, wait)) { W.rail.toWorld(mark, w); W.game.glyphs?.pop?.('bang1', w.clone(), { color: 0xffd36a, size: 1.6, life: wait, float: 0, burst: true }); } } // (Calissa's mark, carried in the frame: vfx/railfoemarks.js)
        return true;
      }
      f.solid = true; if (f.mesh) f.mesh.visible = true;
      const u = (t - wait) / (3 * BAR_S); lerp3(E, X, ease(u), out); return u < 1; };
  },
  fixed(m, { P, side, view }) {
    const scroll = scrollOf(view, m.onScreen ?? 3);
    const S = view === 'side' ? P(1.15, 0.3) : view === 'above' ? P(side * 0.45, 1.1) : P(side * 0.5, 0.25, 1.05); // (z is the scroll in every frame: across in side, up in overhead, along in chase)
    const end = (view === 'side' ? P(-1.3, 0.3) : view === 'above' ? P(0, -0.2) : P(0, 0, -0.2)).z;
    return (t, out) => { out.copy(S); out.z -= t * scroll; return out.z > end; };
  },
  cross(m, { P, side }) {
    const S = P(-side * 1.25, 0.62, 0.6), E = P(side * 1.25, 0.62, 0.6);
    return (t, out) => { const u = t / (4 * BAR_S); lerp3(S, E, u, out); return u < 1; };
  },
  tether(m, { P, side, i, f, view }) {
    const L = m.length ?? 6, w = (2 * Math.PI) / (m.turn ?? 2), idle = P(side * 0.4, 0.5, 0.55), A = AXES[view] || { h: 'x', v: 'y' };
    let lost = null;
    return (t, out) => { // (round its charge in the view's play plane, a turn in `turn` real s: RAIL-FLOW.md 6.2)
      const c = f.charge;
      if (!c?.alive) { lost ??= t; out.copy(idle); return t - lost < 1; } // (its charge gone: it is gone too)
      lost = null; const a = i * Math.PI + t * w; out.copy(c.local); out[A.h] += Math.cos(a) * L; out[A.v] += Math.sin(a) * L; return true; };
  },
  drift(m, { P, lane, view }) {
    const third = Math.max(-1, Math.min(1, Math.round(lane))) * 0.66, H = m.hold ?? 4;
    const A = view === 'side' ? P(0.35, 0.5 + third * 0.4) : view === 'above' ? P(third, 0.4) : P(third, 0.4, 0.3);
    const F = view === 'side' ? P(1.3, 0.5 + third * 0.4) : view === 'above' ? P(third, 1.2) : P(third, 0.4, 1.2);
    return (t, out) => { const b = t / BAR_S;
      if (b < 1) return !!lerp3(F, A, ease(b), out);
      if (b < 1 + H) { out.copy(A); return true; }
      lerp3(A, F, ease(b - 1 - H), out); return b < 2 + H; };
  },
  swing(m, { P, side, W }) {
    const S = P(side * 1.25, 0.85, 0.4), want = new THREE.Vector3();
    return (t, out) => { const u = t / (1.5 * BAR_S);
      want.copy(W.ship?.local || S); want.x += side * 2;
      lerp3(S, want, ease(u), out); out.y += Math.sin(Math.min(1, u) * Math.PI) * 3; // (the line's swing: up and over, then down onto the ship)
      return u < 2; };
  },
};

/** A foe's path from its row's `moves` (in the view it entered in), or null for a kind not written yet. */
export function foeMove(moves, { view = 'chase', i = 0, lane = 0, W, f }) {
  const make = MOVES[moves?.kind]; if (!make) return null;
  const side = (i % 2 ? 1 : -1) * (lane < 0 ? -1 : 1), path = make(moves, { P: viewFrame(view), side, view, i, lane, W, f });
  return (t, _i, _n, _L, out) => path(t, out);
}
