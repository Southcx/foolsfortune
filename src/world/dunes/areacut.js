// ---------------------------------------------------------------------------------------
// THE DUNES CUT INTO AREAS, ON THE GROUND (docs/plans/AREAS.md 5; the cut and the counts are Dovina's data, progress/areas.js DUNES_AREAS
// and AREA_CONTENTS): where a thing of an area may be laid, and which area the Courier is in. The seeds' scatters (the crystals, the
// geysers, the buried ostraca, the ruins' pieces) are laid inside the cut, each area its own count, uniform over its ground (the Weir's
// ring inside the hub, a field area's sector out to the barrier); the area entered and left is said on the bus, once it has held.
//
// Prior art: Final Fantasy XII's regions cut into areas (each its own scatter, its name said on entry), the house's seeded scatters
// (world/dunes/crystals.js and the rest: the same seeds, laid inside a sector), Animal Crossing's clock running while you are away (`away`).
//
//   spotIn(id, rnd, { inner, outer, pad }) -> { lx, lz, area }   (the Dunes' frame: the oasis at the origin, metres; `pad` degrees off a
//   sector's edges)   layOut(counts, rnd, { inner, outer, gap, ok }) -> [{ lx, lz, area }]   (`counts`: { area: n }; `gap` the least
//   distance between two; `ok(spot)` a test of its own)   DUNES_AREA_ORDER
//   countsOf(kind) -> { area: n } (AREA_CONTENTS's)   RUIN_PIECES   crestOf(game, id) -> [x, y, z] (its highest sand)   archOf(game, id) -> [x, y, z]
//   game.dunesAreas = new DunesAreas(game)   .update(raw) (boot/frame.js)   .here   events area.enter { area, from, away, by },
//   area.leave { area, to, by }   (`away`: real s since that area was last left, or null the first time)
// ---------------------------------------------------------------------------------------
import { DUNES_AREAS, AREA_CONTENTS, areaAt } from '../../progress/areas.js';
import { DUNE } from './dunes.js';

export const DUNES_AREA_ORDER = Object.keys(DUNES_AREAS);
/** Petra's: degrees kept off a sector's edges (nothing laid on a seam); the real seconds a new area must hold before it is said (a walk
 *  along an edge says nothing); how many draws a spot may take before its rule is let go of. */
const PAD = 4, HOLD = 0.75, TRIES = 60;

/** Each area's count of a kind (AREA_CONTENTS: crystals, geysers, ostraca, columns). */
export const countsOf = (kind) => Object.fromEntries(Object.entries(AREA_CONTENTS).map(([id, c]) => [id, c[kind] || 0]));
/** The ruins' standing pieces (Petra's, AREAS.md 5: "the ruins' 91 pieces gather in the ruins, with a few left as landmarks elsewhere"):
 *  the obelisks and the arches; the columns are AREA_CONTENTS's. A landmark in each other field area, none in the Weir (the oasis). */
export const RUIN_PIECES = { obelisks: { ruins: 24, shore: 2, ridges: 2, flats: 2 }, arches: { ruins: 10, shore: 1, ridges: 1, flats: 1 } };

const crests = new Map();
/** An area's highest sand, sampled every 2 degrees and 8 m over its ground (once a session: the dunes' heights never move). */
export function crestOf(game, id) {
  if (crests.has(id)) return crests.get(id);
  const D = game.dunes, A = DUNES_AREAS[id]; if (!D?.heightAt || !A) return null;
  const [from, to] = A.bearing || [-180, 180], span = ((to - from) % 360 + 360) % 360 || 360;
  let best = null;
  for (let d = PAD; d <= span - PAD; d += 2) for (let r = A.r[0] + 20; r <= A.r[1] - 20; r += 8) {
    const a = ((from + d) * Math.PI) / 180, x = DUNE.x + Math.cos(a) * r, z = DUNE.z + Math.sin(a) * r, y = D.heightAt(x, z);
    if (!best || y > best[1]) best = [x, y, z];
  }
  crests.set(id, best);
  return best;
}
/** The lintel's top of the tallest arch in an area (world/dunes/dunes.js `arches`), where one stands. */
export function archOf(game, id) {
  let best = null;
  for (const a of game.dunes?.arches || []) if (a.area === id && (!best || a.top > best.top)) best = a;
  return best ? [best.x, best.top, best.z] : null;
}

export function spotIn(id, rnd, { inner = 0, outer = Infinity, pad = PAD } = {}) {
  const A = DUNES_AREAS[id], r0 = Math.max(A.r[0], inner), r1 = Math.max(r0, Math.min(A.r[1], outer));
  let deg;
  if (!A.bearing) deg = rnd() * 360;
  else { const [from, to] = A.bearing, span = ((to - from) % 360 + 360) % 360 || 360; deg = from + pad + rnd() * Math.max(0, span - 2 * pad); }
  const a = (deg * Math.PI) / 180, r = Math.sqrt(r0 * r0 + rnd() * (r1 * r1 - r0 * r0)); // (uniform over the ground, not crowded at the inner edge)
  return { lx: Math.cos(a) * r, lz: Math.sin(a) * r, area: id };
}

export function layOut(counts, rnd, { inner = 0, outer = Infinity, gap = 0, ok = null } = {}) {
  const out = [];
  for (const id of DUNES_AREA_ORDER) {
    for (let n = 0; n < (counts[id] || 0); n++) {
      let s = null;
      for (let k = 0; k < TRIES; k++) {
        const c = spotIn(id, rnd, { inner, outer });
        if (gap && out.some((p) => Math.hypot(p.lx - c.lx, p.lz - c.lz) < gap)) continue;
        if (ok && !ok(c)) continue;
        s = c; break;
      }
      out.push(s || spotIn(id, rnd, { inner, outer })); // (crowded: laid anyway, the count kept)
    }
  }
  return out;
}

export class DunesAreas {
  constructor(game) { this.game = game; this.here = null; this.next = null; this.heldT = 0; this.t = 0; this.left = {}; }
  /** Each frame: the area under the Courier, said once it has held HOLD real s. */
  update(raw) {
    this.t += raw;
    const g = this.game, P = g.player, D = g.dunes;
    const id = D?.active && P ? areaAt(P.pos.x - DUNE.x, P.pos.z - DUNE.z) : null;
    if (id === this.here) { this.next = null; return; }
    if (id !== this.next) { this.next = id; this.heldT = 0; return; }
    if ((this.heldT += raw) < HOLD && id) return;
    const was = this.here; this.here = id; this.next = null;
    if (was) { this.left[was] = this.t; g.events?.emit('area.leave', { area: was, to: id, by: 'courier' }); }
    if (id) g.events?.emit('area.enter', { area: id, from: was, away: this.left[id] != null ? Math.round(this.t - this.left[id]) : null, by: 'courier' });
  }
}
