// ---------------------------------------------------------------------------------------
// THE MOVE'S WORTH (the duel's view: vfx/duelview.js; PUZZLE-DUELS.md 17 and 18: "a chain's doubling is easier to learn shown than
// told"): the action under the finger or the pointer before it is chosen (the session's `pendingAction`: a swap or drag as the press
// builds, a run on hover), tried on a quiet copy (Dovina's `preview`, duel.js, handed a stream of its own so a hover never changes the
// duel's chances). The cells it would clear glow (a rim of the film's light, breathing) and beside the finger's cell, in the System's
// type (the count face, marks.js), what it would send: "+N", and under it "xS" when the clear would chain (S its steps). No words; nothing
// when it would clear nothing or is not legal. Cleared on null.
//
// Prior art: Puyo Puyo's chain counter (the steps shown as they come), Puzzle Quest's match preview (the gems that would go lit as you
// drag), Into the Breach's damage preview on the tiles before a move is confirmed.
//
//   const W = new DuelWorth(view)   W.show(state, action | null) -> { junk, steps, cleared } | null   W.clear()   W.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { act, cloneState, preview } from '../../progress/duel/duel.js';
import { mindLineMaterial } from '../labradorite.js';
import { DUEL_VIEW, cellLocal } from './layout.js';

export class DuelWorth {
  constructor(view) {
    const V = (this.view = view); this.group = new THREE.Group(); this.group.name = 'duel-worth'; V.frame.add(this.group);
    this.mat = mindLineMaterial({ opacity: 0.9, depthTest: true, bright: 2.2 }); this.rims = []; this.t = 0; this.shown = 0;
    this.plus = V.marks.label(); this.steps = V.marks.label(); for (const L of [this.plus, this.steps]) { L.group.visible = false; this.group.add(L.group); }
  }
  clear() { for (const r of this.rims) r.visible = false; this.plus.group.visible = this.steps.group.visible = false; this.shown = 0; }

  show(s, a) {
    this.clear(); if (!s || !a || s.toMove !== 0) return null;
    const p = preview(s, a); if (!p || (!p.cleared && !p.junk)) return p;
    const c = cloneState(s), ev = act(c, a) || [], cells = ev.filter((e) => e.type === 'clear' && e.side === 0).map((e) => e.at); // (the cells: the same try, its events kept)
    const B = this.view.board3, cs = DUEL_VIEW.cs;
    cells.forEach((at, i) => { let r = this.rims[i]; if (!r) { r = this.rims[i] = new THREE.Mesh(this.view.marks.rimGeo, this.mat); r.renderOrder = 6; this.group.add(r); }
      r.visible = true; cellLocal(at[0], at[1], B, r.position); r.position.z += 0.02; r.scale.setScalar(cs * 0.94); r.userData.k = i; });
    this.shown = cells.length;
    const end = a.kind === 'swap' ? [a.at[0] + ({ E: 1, W: -1 }[a.dir] || 0), a.at[1] + ({ S: 1, N: -1 }[a.dir] || 0)] : a.path?.[a.path.length - 1] || a.at || [B.w / 4, B.h / 2];
    const hex = this.view.sideHex(0), x = Math.min(end[0] + 1.3, B.w - 1), y = Math.max(end[1] - 1.1, 0.4);
    this.plus.set('+' + p.junk, hex); this.plus.group.visible = true; cellLocal(x, y, B, this.plus.group.position); this.plus.group.position.z += 0.08; this.plus.group.scale.setScalar(cs * 1.25);
    if (p.steps >= 2) { this.steps.set('x' + p.steps, hex); this.steps.group.visible = true; cellLocal(x, y + 0.85, B, this.steps.group.position); this.steps.group.position.z += 0.08; this.steps.group.scale.setScalar(cs * 0.95); }
    return p;
  }

  update(dt) {
    if (!this.shown) return; this.t += dt;
    for (let i = 0; i < this.shown; i++) this.rims[i].scale.setScalar(DUEL_VIEW.cs * (0.9 + 0.06 * Math.sin(this.t * 7 - i * 0.6)));
  }
}
