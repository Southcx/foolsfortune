// ---------------------------------------------------------------------------------------
// THE FOE'S FORESIGHT (the duel's view: vfx/duelview.js; PUZZLE-DUELS.md 18.2): the foe's intent whole, as the kernel's `intentOf`
// (bot.js) hands it after each of your actions: { actions, junk, cells, hits }. The actions are drawn by the forecast (intent.js, its
// steps numbered); this draws the rest, over Dread's fog (Divination sees intent, not ground):
//   cells   what the foe would clear on its half, outlined in its feeling's colour, faint, the outline round each group (an edge where a
//           cell to clear meets one that is not) over a breath of fill
//   hits    where it would swap, rotate, drop or drag from: a ring on each, in its colour over the ink
//   junk    what it would send, a count at the Line's foot on the frame's clay ("<N", toward you), in the System's type (marks.js)
// A forecast, never a promise: redrawn on every intent, gone on null.
//
// Prior art: Into the Breach (the enemy's telegraphed tiles and the damage they will take, drawn before your turn), Slay the Spire's intents
// (the number the foe will hit you for, over it), Tetris 99's incoming garbage meter (the count beside the well, before it lands).
//
//   const F = new DuelForesight(view)   F.show(state, intent, foeAspect)   F.clear()   F.update(dt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DUEL_VIEW, cellLocal, feelColour } from './layout.js';
import { Strokes } from './intent.js';

const INK = 0x17111f, _a = new THREE.Vector3(), _b = new THREE.Vector3();

export class DuelForesight {
  constructor(view) {
    const V = (this.view = view); this.group = new THREE.Group(); this.group.name = 'duel-foresight'; V.frame.add(this.group); this.meshes = []; this.t = 0;
    const mat = (color, opacity) => new THREE.MeshBasicMaterial({ name: 'duel-foresight', color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false });
    this.mats = { line: mat(0xffffff, 0.75), fill: mat(0xffffff, 0.14), ink: mat(INK, 0.7), ring: mat(0xffffff, 0.95) };
    this.junkL = V.marks.label(); this.junkL.group.visible = false; this.group.add(this.junkL.group);
  }
  clear() { for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); } this.meshes = []; this.junkL.group.visible = false; }

  show(s, I, aspect = 'fury') {
    this.clear(); if (!s || !I) return;
    const B = this.view.board3, cs = DUEL_VIEW.cs, z = DUEL_VIEW.front + 0.06, col = feelColour(aspect);
    for (const k of ['line', 'fill', 'ring']) this.mats[k].color.copy(col);
    const key = (x, y) => x + ',' + y, set = new Set((I.cells || []).map((c) => key(c[0], c[1])));
    const line = new Strokes(), fill = new Strokes(), ink = new Strokes(), ring = new Strokes();
    for (const c of I.cells || []) { const [x, y] = c;
      const q = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([dx, dy]) => cellLocal(x + dx * 0.96, y + dy * 0.96, B, new THREE.Vector3()).setZ(z - 0.004));
      fill.tri(q[0], q[1], q[2]); fill.tri(q[0], q[2], q[3]);
      for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 0.5, -0.5, 0.5, 0.5], [-1, 0, -0.5, -0.5, -0.5, 0.5], [0, 1, -0.5, 0.5, 0.5, 0.5], [0, -1, -0.5, -0.5, 0.5, -0.5]]) {
        if (set.has(key(x + dx, y + dy))) continue; cellLocal(x + ax * 0.92, y + ay * 0.92, B, _a).setZ(z); cellLocal(x + bx * 0.92, y + by * 0.92, B, _b).setZ(z); line.seg(_a.clone(), _b.clone(), cs * 0.08); } }
    for (const h of I.hits || []) { if (!h) continue; cellLocal(h[0], h[1], B, _a).setZ(z + 0.004); ink.ring(_a.clone(), cs * 0.36, cs * 0.16, 0, Math.PI * 2, 20); _a.z += 0.004; ring.ring(_a.clone(), cs * 0.36, cs * 0.07, 0, Math.PI * 2, 20); }
    for (const [S, m, o] of [[fill, this.mats.fill, 3], [line, this.mats.line, 4], [ink, this.mats.ink, 4], [ring, this.mats.ring, 5]]) {
      if (!S.p.length) continue; const mesh = new THREE.Mesh(S.geometry(), m); mesh.renderOrder = o; mesh.frustumCulled = false; this.group.add(mesh); this.meshes.push(mesh); }
    if (I.junk > 0) { const { base, border: b, lip } = DUEL_VIEW, L = this.view.lineCol ?? B.line;
      this.junkL.set('<' + I.junk, '#' + col.getHexString()); this.junkL.group.visible = true;
      this.junkL.group.position.set((L - B.w / 2) * cs - cs * (0.4 + 0.3 * String(I.junk).length), base - b * 0.5, lip + 0.02); this.junkL.group.scale.setScalar(cs * 1.15); }
  }

  update(dt) { this.t += dt; const k = 0.5 + 0.5 * Math.sin(this.t * 2.4); this.mats.line.opacity = 0.55 + 0.3 * k; this.mats.fill.opacity = 0.08 + 0.1 * k; }
}
