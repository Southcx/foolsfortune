// ---------------------------------------------------------------------------------------
// AN AREA'S CHECKLIST, KEPT (docs/plans/AREAS.md 6): how much of each Dunes area's checklist is done, written to the ledger as a record so
// the achievements can read it ("the achievements are predicates over those counters: for each area half its checklist (Easy) and all of
// it (Hard); for each layer every area whole (Elite)"). The checklist is the map's (`game.cartography.screen.rowsOf`, Petra's: the world
// counted against the ledger); this only measures it at the moments it can change (an area entered or left, a room charted, a find),
// and keeps the best share an area has reached (`area.<id>.share`, 0..1, a `hi`), never a flag.
//
// Prior art: Spyro's and Banjo-Kazooie's N-of-M with the total shown, Xenoblade's Collectopedia (an area done), the house's ledger records.
//
//   game.areaChecklist = new AreaChecklist(game)   .measure(id?)   AREA_IDS   events: area.done { area, by } (once, the first time whole)
// ---------------------------------------------------------------------------------------
import { DUNES_AREAS } from './areas.js';

export const AREA_IDS = Object.keys(DUNES_AREAS);
/** The moments a checklist can change. */
const MOMENTS = ['area.enter', 'area.leave', 'map.room', 'chest.open', 'vantage.reach', 'shrine.found', 'ostracon.read', 'angle.catch', 'trial.solar.end'];

export class AreaChecklist {
  constructor(game) {
    this.game = game; this.t = 0;
    for (const ev of MOMENTS) game.events?.on?.(ev, () => queueMicrotask(() => this.measure())); // (after the moment's own counts)
  }
  /** Measure one area's checklist (or every area entered), keeping the best share in the ledger. */
  measure(only = null) {
    const S = this.game.cartography?.screen, L = this.game.ledger; if (!S?.rowsOf || !L) return;
    for (const id of only ? [only] : AREA_IDS) {
      let rows = null; try { rows = S.rowsOf(id); } catch { rows = null; }
      if (!rows?.length) continue;
      const n = rows.reduce((s, r) => s + r.n, 0), m = rows.reduce((s, r) => s + r.m, 0); if (!m) continue;
      const share = Math.round((n / m) * 1000) / 1000, was = L.best?.(`area.${id}.share`) || 0;
      if (share > was) { L.hi(`area.${id}.share`, share); if (share >= 1) this.game.events?.emit('area.done', { area: id, by: 'courier' }); }
    }
  }
}
