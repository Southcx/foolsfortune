// ---------------------------------------------------------------------------------------
// THE DUEL'S GLOWS (the duel's view: vfx/duelview.js): what lies on a puzzle duel's pieces between the beats, set each frame and eased:
//   A GEM'S HUM     a Tune's colour on its singer's half striking in time like the bell (pieces.js `hum`: a swell and a whitening each
//                   0.6 real s, run across the half as a wave), held from `tune` to `tune.end` (toolbeats2.js sets `view.tune`)
//   PAINT'S REACH   while a Paint is legal in the Courier's form on your turn, the cells it reaches (4 walking, couriertools.js
//                   TOOL_RULES) outlined faint in the film; armed (a Paint under the finger, `pendingAction`, or `armPaint(true)`) the
//                   outline bright, and every gem of your half whose colour has none in reach greyed (it cannot be repainted from there)
//   THE ASKED VERB  the first duel's lesson (lesson.js, PUZZLE-DUELS.md 18.3): the step asked lit on the board, no words: move, your
//                   gems breathing; clear and chain, the two cells of a swap that would make one humming; run, form and tool, the
//                   Courier's figurine humming (on touch the verb's tile is lit too: ui/touch/actioncontext.js). Nothing is locked
// Prior art: Puzzle Quest's idle hint (a move that would match shimmers when you wait), Into the Breach's tutorial (the one verb lit),
// the Crucibelle's toll's reach (vfx/tollreach.js: a reach drawn on the ground while it can be used), the crystals' frets (a note a colour).
//
//   THE WEAK COLOUR AND THE FORESIGHT ON THE GEMS: the weak colour (weaknessOf) and the Line handed to the pieces each frame (pieces.js:
//                   a gold keyline and a glint on that colour's gems on your half), and the foe's planned clears (the foresight's
//                   `cells`, read as foresight.js is handed them) as a Set the pieces draw with a bold keyline and their colour through the fog
//   const G = new DuelGlows(view)   G.update(dt)   G.armPaint(on)   G.lessonBeat(event)   G.clear()   G.asked -> lesson step id | null
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial } from '../labradorite.js';
import { hasTag } from '../../progress/duel/board.js';
import { legalActions, preview, weaknessOf } from '../../progress/duel/duel.js';
import { stepsOf } from '../../progress/duel/lesson.js';
import { TOOL_RULES } from '../../progress/duel/couriertools.js';
import { DUEL_VIEW, cellLocal } from './layout.js';
import { Strokes } from './intent.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class DuelGlows {
  constructor(view) {
    this.view = view; this.armed = false; this.reachKey = null; this.hint = null; this.hintKey = null;
    this.reachMat = mindLineMaterial({ opacity: 0.35, depthTest: true, bright: 1 }); this.reach = null;
  }
  armPaint(on) { this.armed = !!on; }
  clear() { this.dropReach(); this.hint = null; this.hintKey = null; this.armed = false; }
  dropReach() { if (this.reach) { this.view.frame.remove(this.reach); this.reach.geometry.dispose(); this.reach = null; } this.reachKey = null; }

  /** The lesson's step asked now (its id), or null. */
  get asked() { const s = this.view.state, L = s?.lesson, steps = s ? stepsOf(s) : []; return L && L.step < steps.length ? steps[L.step].id : null; }
  lessonBeat() { this.hintKey = null; } // (a step done: the hint found again once the board is still)

  update(dt) {
    const V = this.view, s = V.state; if (!s || !V.isOpen) return;
    const P = V.pieces, L = V.lineCol ?? s.board.line, S = s.sides[0], body = P.bodyAt(0), idle = !V.busy, mine = s.toMove === 0 && s.winner === null;
    this.watchForesight(); P.weak = weaknessOf(s)?.weak || null; P.dim = s.dim || null; P.line = L; P.fore = idle ? this.fore : null;
    const hum = new Map(), grey = new Set();
    for (const side of [0, 1]) { const c = V.tune[side]; if (c) for (const v of P.list) if (v.kind === 'gem' && v.colour === c && (side === 0 ? v.cx < L : v.cx >= L)) hum.set(v, 1); }
    // Paint's reach
    const canPaint = idle && mine && S.form === 'courier' && S.at && (!S.tools || S.tools.includes('soulbrush')) && S.pool >= 10;
    const armed = canPaint && (this.armed || V.pendingKind === 'paint');
    if (canPaint) {
      const [cx, cy] = S.at, R = TOOL_RULES.paintReach, key = cx + ',' + cy + ',' + Math.round(L);
      if (key !== this.reachKey) this.buildReach(cx, cy, R, Math.round(L));
      this.reachMat.uniforms.uOpacity.value = armed ? 0.95 : 0.3;
      if (armed) { const near = new Set(); s.board.each((p, x, y) => { if (x < L && hasTag(p, 'matches') && Math.abs(x - cx) + Math.abs(y - cy) <= R) near.add(p.colour); });
        for (const v of P.list) if (v.kind === 'gem' && v.cx < L && !near.has(v.colour)) grey.add(v); }
    } else if (this.reach) this.dropReach();
    // the lesson's asked verb
    const ask = mine && idle ? this.asked : null;
    if (ask === 'move' && S.form === 'hand') for (const v of P.list) if (v.kind === 'gem' && v.cx < L && !hum.has(v)) hum.set(v, 0.35);
    if ((ask === 'clear' || ask === 'chain') && S.form === 'hand') { for (const c of this.hintFor(s, ask)) { const v = P.at(c[0], c[1]); if (v) hum.set(v, 1); } }
    if ((ask === 'run' || ask === 'form' || ask === 'tool') && body) hum.set(body, 1);
    const k = Math.min(1, dt * 5);
    for (const v of P.list) { v.hum += ((hum.get(v) || 0) - v.hum) * k; if (v.hum < 1e-3) v.hum = 0; v.grey += ((grey.has(v) ? 1 : 0) - v.grey) * k; if (v.grey < 1e-3) v.grey = 0; }
  }

  /** The foresight's cells as it is handed them (its show and clear wrapped once: foresight.js keeps none of its own). */
  watchForesight() {
    const F = this.view.foresight; if (!F || F.watched) return; F.watched = true; this.fore = null;
    const show = F.show.bind(F), clear = F.clear.bind(F);
    F.show = (s, I, a) => { this.fore = I?.cells?.length ? new Set(I.cells.map((c) => c[0] + ',' + c[1])) : null; return show(s, I, a); };
    F.clear = () => { this.fore = null; return clear(); };
  }

  /** The cells of your half a Paint reaches, outlined: an edge where a reached cell meets one that is not. */
  buildReach(cx, cy, R, L) {
    this.dropReach(); const B = this.view.board3, cs = DUEL_VIEW.cs, z = DUEL_VIEW.front + 0.045, w = cs * 0.07, S = new Strokes();
    const inR = (x, y) => x >= 0 && y >= 0 && x < L && y < B.h && Math.abs(x - cx) + Math.abs(y - cy) <= R;
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) { if (!inR(x, y)) continue;
      for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 0.5, -0.5, 0.5, 0.5], [-1, 0, -0.5, -0.5, -0.5, 0.5], [0, 1, -0.5, 0.5, 0.5, 0.5], [0, -1, -0.5, -0.5, 0.5, -0.5]]) {
        if (inR(x + dx, y + dy)) continue; cellLocal(x + ax, y + ay, B, _a).setZ(z); cellLocal(x + bx, y + by, B, _b).setZ(z); S.seg(_a.clone(), _b.clone(), w); } }
    if (!S.p.length) return;
    const g = S.geometry(); g.computeVertexNormals(); this.reach = new THREE.Mesh(g, this.reachMat); this.reach.renderOrder = 5; this.reach.frustumCulled = false; this.view.frame.add(this.reach);
    this.reachKey = cx + ',' + cy + ',' + L;
  }

  /** A swap that would clear (for `chain`, one that chains if any does), found once a board: its two cells, or none. */
  hintFor(s, ask) {
    const key = ask + '|' + s.board.hash() + '|' + s.apLeft; if (key === this.hintKey) return this.hint || [];
    this.hintKey = key; this.hint = null; let best = null, bestV = 0;
    const tries = legalActions(s, 0, { drags: 0 }).filter((a) => a.kind === 'swap').slice(0, 260); // (no drags sampled: only the swaps are tried here)
    for (const a of tries) { const p = preview(s, a); if (!p || !p.cleared) continue; const v = (ask === 'chain' && p.steps >= 2 ? 100 : 0) + p.steps * 10 + p.cleared; if (v > bestV) { bestV = v; best = a; } }
    if (best) { const d = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[best.dir]; this.hint = [best.at, [best.at[0] + d[0], best.at[1] + d[1]]]; }
    return this.hint || [];
  }
}
