// ---------------------------------------------------------------------------------------
// THE SKILLS' GAUGES (plain name; the one-gesture duel, PUZZLE-DUELS.md 22): your worn pair's charge drawn on the tsuitate itself, so the
// desk sees it as the phone does (the phone's skill tiles carry it on their rims too, ui/touch/actioncontext.js): two troughs let into
// the frame's top member over your half, each filling in the film's teal as your clears charge it (`skillsOf`), struck gold and breathing
// once full, a burst of the film off it the moment it fills, and a white flash as it empties when fired. No words.
// Materials: the emo bars' unlit basic program (board.js `duel-emo`), so nothing new compiles.
// Prior art: Puzzle & Dragons' skill-ready glow on the leader's portrait, Puzzle Quest's mana troughs beside the board, the tsuitate's own
// emo columns (board.js).
//
//   const G = new SkillGauges(view)   G.layout(board3)   G.update(dt, state)   G.clear()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { skillsOf } from '../../progress/duel/skills.js';
import { oneGesture } from '../../progress/duel/duel.js';
import { DUEL_VIEW } from './layout.js';

const FILL = new THREE.Color(0x7fdcff), READY = new THREE.Color(0xffd76a), WHITE = new THREE.Color(1, 1, 1), TROUGH = 0x1c1018, _c = new THREE.Color(), _p = new THREE.Vector3();

export class SkillGauges {
  constructor(view) {
    this.view = view; this.group = new THREE.Group(); this.group.name = 'duel-skillgauges'; this.group.visible = false; view.frame.add(this.group);
    const bar = new THREE.BoxGeometry(1, 1, 1); bar.translate(0.5, 0, 0); // (grows from its left end)
    this.slots = [0, 1].map(() => {
      const trough = new THREE.Mesh(bar, new THREE.MeshBasicMaterial({ name: 'duel-emo', color: TROUGH, toneMapped: false }));
      const fill = new THREE.Mesh(bar, new THREE.MeshBasicMaterial({ name: 'duel-emo', color: 0xffffff, toneMapped: false }));
      this.group.add(trough, fill); return { trough, fill, k: 0, ready: false, flash: 0, x: 0, w: 0 };
    });
    this.t = 0;
  }

  /** Two troughs on the top member over your half, left of the Line's head. */
  layout(B) {
    const { cs, base, border: b, lip } = DUEL_VIEW, W = B.w * cs, H = B.h * cs, x0 = -W / 2 + cs * 0.4, x1 = ((B.line ?? B.w / 2) - B.w / 2) * cs - cs * 0.9;
    const span = Math.max(cs * 2, x1 - x0), gap = cs * 0.3, w = (span - gap) / 2, y = base + H + b * 0.5, h = b * 0.36;
    this.slots.forEach((S, i) => { S.x = x0 + i * (w + gap); S.w = w;
      S.trough.position.set(S.x, y, lip + 0.004); S.trough.scale.set(w, h, 0.012);
      S.fill.position.set(S.x, y, lip + 0.011); S.fill.scale.set(0.001, h * 0.72, 0.012); });
  }

  clear() { this.group.visible = false; for (const S of this.slots) { S.k = 0; S.ready = false; S.flash = 0; } }

  update(dt, s) {
    const K = s && oneGesture(s) ? skillsOf(s, 0) : [];
    this.group.visible = K.length > 0; if (!K.length) return;
    this.t += dt;
    this.slots.forEach((S, i) => {
      const k = K[i]; S.trough.visible = S.fill.visible = !!k; if (!k) return;
      const want = Math.min(1, k.charge / k.need);
      if (want < S.k - 0.5) S.flash = 1; // (fired: it empties in a white flash)
      S.k += (want - S.k) * Math.min(1, dt * 8);
      if (k.ready && !S.ready) { _p.set(S.x + S.w / 2, S.trough.position.y, S.trough.position.z + 0.03); this.view.bursts?.burst?.(_p, 0x9fd8ff, 14, { speed: 0.9, life: 0.5, fall: 0, spread: 0.3 }); this.view.bursts?.burst?.(_p, 0xffd76a, 6, { speed: 0.5, life: 0.35, fall: 0, size: 0.04 }); }
      S.ready = k.ready; S.flash = Math.max(0, S.flash - dt * 3);
      S.fill.scale.x = Math.max(0.001, S.w * Math.max(S.k, S.flash));
      if (S.ready) _c.copy(READY).multiplyScalar(1.1 + 0.35 * Math.sin(this.t * 4 + i)); else _c.copy(FILL).multiplyScalar(0.8 + 0.4 * S.k);
      S.fill.material.color.copy(_c).lerp(WHITE, S.flash);
    });
  }
}
