// ---------------------------------------------------------------------------------------
// THE FIRE LAMPS (plain name; the city's fire's look, vfx/mechs/fire/): the light a burning building throws on the street, as plain
// PointLights the light budget scores like any other (render/lightbudget.js: adopted once, never lent by hand). Petra's budget
// (docs/handoffs/calissa/2026-11-02-from-petra-fire-budget.md): two on High, for the two biggest fires; one on Low, Minimum or a
// phone (`machine.mobile`), so the yard's five floodlights keep their slots; every other fire is emissive (its flames and its char).
// Each set over its fire's middle, its strength by the cells burning, flickering on the real clock.
// Prior art: Far Cry 2's fire light (one light a fire, flickered), the Godzilla films' city fires lighting the street from below.
//
//   const L = new FireLamps(game, parent)   L.place(tracks) (the burning buildings: n, cx, cy, cz)   L.update(dt)   L.dispose()   L.count()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FIRE_LOOK } from './table.js';

const LK = FIRE_LOOK.lamps;

export class FireLamps {
  constructor(game, parent) {
    this.game = game; this.t = 0;
    this.lamps = Array.from({ length: LK.high }, (_, i) => {
      const l = new THREE.PointLight(LK.colour, 0, LK.distance, LK.decay); l.name = `fire.lamp.${i}`; l.visible = false;
      l.userData.base = 0; l.userData.seed = i * 3.7; parent.add(l); game.lights?.adopt?.(l); return l;
    });
  }
  /** How many may burn now: two on High, one on a lesser tier or a phone. */
  count() {
    const G = this.game.graphics, lesser = (G?.tier && G.tier !== 'high') || G?.machine?.mobile;
    return lesser ? LK.low : LK.high;
  }
  /** The biggest fires lit (`tracks` an array of burning tracks; read, never kept). */
  place(tracks) {
    const n = this.count();
    for (let i = 0; i < this.lamps.length; i++) {
      let best = null;
      for (const T of tracks) if (T.n > 0 && T.lamp !== -1 && (!best || T.n > best.n) && !this.taken(T, i)) best = T;
      const l = this.lamps[i];
      if (i < n && best) { l.position.set(best.cx, best.cy + LK.lift, best.cz); l.userData.base = Math.min(LK.most, LK.intensity + LK.perCell * best.n); l.userData.of = best; l.visible = true; }
      else { l.userData.base = 0; l.userData.of = null; l.intensity = 0; l.visible = false; }
    }
  }
  taken(T, i) { for (let j = 0; j < i; j++) if (this.lamps[j].userData.of === T) return true; return false; }
  update(dt) {
    this.t += dt;
    for (const l of this.lamps) {
      if (!l.visible) continue;
      const s = l.userData.seed, f = 1 + LK.flicker * (0.6 * Math.sin(this.t * 9.1 + s) + 0.4 * Math.sin(this.t * 23.7 + s * 2.3));
      l.intensity = l.userData.base * f;
    }
  }
  dispose() { for (const l of this.lamps) l.removeFromParent(); this.lamps = []; }
}
