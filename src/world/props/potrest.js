// ---------------------------------------------------------------------------------------
// POT REST: a pot at rest is drawn with the others, not on its own. `settle` puts a pot that has nearly stopped to sleep (Rapier's own
// thresholds are tight, and a round-bottomed jar on a shelf can rock for ever); `rest` hands a still, sleeping pot to the prop batch,
// where it is drawn with the rest, and takes it back the moment anything happens to it; `restProp` does the same for a loose prop
// (a crate, a brick); `release` takes a pot that is gone out of the batch for good (render/propbatch.js).
//
// Laid onto Breakables (world/props/breakables.js) as methods of the class (`this` is the Breakables), the way tools/stringrun.js is
// laid onto the Moveset; split out of breakables.js to keep it under the module contract's 800 lines.
//
// Prior art: the sleep threshold every engine tunes (PhysX's, Havok's), made a little looser for props that only need to look still.
//
//   POT_REST: settle(ent, dt)   rest(ent)   restProp(ent)   release(ent)
// ---------------------------------------------------------------------------------------
import { zoneOf } from '../../render/zones.js';

export const POT_REST = {
  /** A pot at rest is drawn by the prop batch; anything that happens to it hands it back (render/propbatch.js). */
  rest(ent) {
    const b = ent.body, m = ent.mesh;
    const still = ent.alive && ent.popIn === undefined && !ent.rope && b.isValid() && b.isDynamic() && b.isSleeping() && m.parent === this.scene && m.children.length === 1;
    if (ent.parked) { if (!still || this.batch.stale(ent.parked)) { this.batch.unpark(ent.parked); ent.parked = null; ent.restT = 0; } return; }
    if (!still) { ent.restT = 0; return; }
    if ((ent.restT = (ent.restT || 0) + 1) > 20) ent.parked = this.batch.park(m, zoneOf(m.position));
  },

  /** A pot that has nearly stopped is put to sleep. Rapier's own thresholds are tight, and a round-bottomed jar on a shelf, or a stack
   *  of plates, can rock and shiver for ever: never asleep, so never batched (three draws a frame instead of none) and always simulated.
   *  Anything that touches it wakes it again, as before. (The "sleep threshold" every engine tunes, PhysX's and Havok's, made a little
   *  looser for props that only need to look still.) */
  settle(ent, dt) {
    const b = ent.body;
    if (!ent.alive || ent.rope || !b.isValid() || !b.isDynamic() || b.isSleeping()) { ent.slowT = 0; return; }
    const v = b.linvel(), w = b.angvel();
    const slow = v.x * v.x + v.y * v.y + v.z * v.z < 0.36 && w.x * w.x + w.y * w.y + w.z * w.z < 20;
    ent.slowT = slow ? (ent.slowT || 0) + dt : 0;
    if (ent.slowT > 1.2 && !ent.held && !ent.grabbed) { b.sleep(); ent.slowT = 0; }
  },

  /** A loose prop (a crate, a brick) at rest is drawn by the prop batch too, until something moves it. */
  restProp(ent) {
    const b = ent.body, m = ent.mesh;
    const still = b.isValid() && b.isDynamic() && b.isSleeping() && m.parent === this.scene && m.isMesh && m.children.length <= 1 && !ent.held;
    if (ent.parked) { if (!still || this.batch.stale(ent.parked)) { this.batch.unpark(ent.parked); ent.parked = null; ent.restT = 0; } return; }
    if (!still) { ent.restT = 0; return; }
    if ((ent.restT = (ent.restT || 0) + 1) > 20) ent.parked = this.batch.park(m, zoneOf(m.position));
  },

  /** The pot is gone: take it out of the batch for good. */
  release(ent) {
    if (ent.parked) { this.batch.unpark(ent.parked); ent.parked = null; }
    this.batch.forget(ent.mesh.geometry);
  },
};
