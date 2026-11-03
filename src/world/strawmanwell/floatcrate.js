// ---------------------------------------------------------------------------------------
// STRAWMAN'S WELL'S FLOATING CRATES (docs/plans/STRAWMANS-WELL.md 3.7 and 3.8; GAPS G251): the Flood's liquids are not solid to props (the
// grid's colliders are its solids only, gridbody.js), so a crate sinks through them to the basin's floor. This is the modifier that lets
// it rise: a crate in a liquid is lifted by the share of its height under it (five samples up its side, `GridBody.liquidAt`), PUSHED UP by
// FLOAT.lift of gravity at full depth, so it settles about half under, and its fall through the liquid is damped (FLOAT.damp 1/s). Fill a
// basin and the crate you pushed in rises to the walkway (Inside's and Limbo's floating crates, Where's My Water?).
//
// Prior art: Inside's and Limbo's crates that float, Where's My Water? (fill a basin to lift a thing), Archimedes.
//
//   const F = new FloatCrates(well)   F.update(dt, body, crates, floorY, z)   verb 'float' once a crate has risen on the liquid
// ---------------------------------------------------------------------------------------
import { FLOAT } from '../../progress/strawmanwell.js';

const N = 5, HALF = 0.45;

export class FloatCrates {
  constructor(well) { this.well = well; }

  /** `body` the grid's GridBody, `crates` the machine's `{ e }` list, `floorY` the basin floor (world y) a crate must rise above to count, `z` the grid's lane (a crate of another lane is not in it). */
  update(dt, body, crates, floorY, z) {
    if (!body) return;
    const g = Math.abs(this.well.game.physics?.world?.gravity?.y ?? 21); // (the world's own gravity: 21 m/s^2)
    for (const c of crates) {
      const rb = c.e.body; if (!rb?.isValid?.()) continue;
      const t = rb.translation(); let wet = 0;
      if (Math.abs(t.z - z) > 2) continue;
      for (let i = 0; i < N; i++) if (body.liquidAt(t.x, t.y - HALF + (i + 0.5) * (2 * HALF) / N)) wet++;
      if (!wet) continue;
      const frac = wet / N, v = rb.linvel();
      const k = Math.exp(-FLOAT.damp * frac * dt); // (the water's drag, then its lift, in one velocity: an impulse beside a setLinvel would be wiped by it)
      rb.setLinvel({ x: v.x * (1 - (1 - k) * 0.5), y: v.y * k + g * FLOAT.lift * frac * dt, z: 0 }, true);
      if (frac >= 0.4 && t.y > floorY + 1.0) this.well.verb('float');
    }
  }
}
