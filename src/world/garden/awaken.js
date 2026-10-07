// ---------------------------------------------------------------------------------------
// NEW SPIRITS FROM OLD THINGS, AND TWO MADE ONE: the garden's other ways to a spirit (docs/plans/SPIRIT-GARDEN.md section 5, "where they
// come from"; Round 4). At the Athanor's shrine a Veritome PHOTOGRAPH of a creature awakens a spirit of its kind, its strength read from
// the plate's stars (Monster Rancher's disc stone); in the Mulberry Grove a LACHRYMITE FOSSIL dug in the Dunes wakes to the Awakening
// Song (Spectrobes; Wanda's song plays while `game.garden.awakening`); wild Figments VISIT when the garden meets their wants and SETTLE
// after enough visits (Viva Piñata; the wants are Dovina's, progress/realm.js VISITORS); and in the cocoon tree two spirits MERGE into
// one (Jade Cocoon; progress/spirits.js merge). Each new spirit is bound (creatures/bound.js add) and hops out into the Grove.
// Events (each with `by`): spirit.bind { from: 'plate' | 'fossil' | 'visit' | 'merge' }, spirit.visit { kind, settled }, spirit.merge.
//
// Prior art: Monster Rancher's shrine (a monster from a disc), Spectrobes Origins' fossils woken by sound, Viva Piñata's visitors who
// settle when the garden suits them, Jade Cocoon's merging (the child takes from both parents).
//
//   const A = new Awaken(game, realm)   A.plates() -> [{ kind, stars }]   A.plate(kind)   A.fossil()   A.merge(a, b)   A.visitors()
//   A.update(dt)   A.dump() / A.load(d)   (realm.js calls them from the Athanor's and the cocoon tree's pages)
// ---------------------------------------------------------------------------------------
import { fresh, merge as mergeSheets, STATS } from '../../progress/spirits.js';
import { VISITORS, wantsMet } from '../../progress/realm.js';
import { today, now as calNow } from '../../core/calendar.js';

export const FOSSIL = 'fossil.lachrymite';
const SONG = 15; // (real seconds: the Awakening Song, Wanda's, plays once while the fossil wakes)
const FEELINGS = Object.keys(STATS);

export class Awaken {
  constructor(game, realm) { this.game = game; this.realm = realm; this.used = {}; this.visits = {}; this.waking = null; }

  /** The photographs that could wake a spirit: creatures in the Compendium (tools/veritome/book.js photos), not yet awakened. */
  plates() {
    const P = this.game.veritome?.book?.photos || {}, kinds = new Set(Object.keys(VISITORS).concat(['slipjelly', 'clapperjar', 'glint', 'lobber', 'spirit']));
    return Object.entries(P).filter(([k, p]) => kinds.has(k) && p?.stars > 0 && !this.used[k]).map(([k, p]) => ({ kind: k, stars: p.stars }));
  }
  /** At the Athanor: the plate of `kind` awakens a spirit of its kind (its class from the plate's stars). */
  plate(kind) {
    const p = this.plates().find((x) => x.kind === kind); if (!p) return false;
    this.used[kind] = true; this.dirty();
    this.bind({ kind, cls: Math.min(4, Math.max(0, p.stars - 1)) }, 'plate');
    return true;
  }
  /** In the Grove: a fossil from the box wakes while the Awakening Song plays. */
  fossil() {
    const g = this.game, k = g.pneuka?.slots.findIndex((x) => x?.id === FOSSIL);
    if (k == null || k < 0 || this.waking) return false;
    g.pneuka.take(k);
    this.waking = { t: SONG }; if (g.garden) g.garden.awakening = true;
    return true;
  }
  /** In the cocoon tree: two become one (the stronger of each stat at three quarters; the kind of the more bonded). */
  merge(a, b) {
    const g = this.game, L = g.bound?.list || [];
    if (!a?.sp || !b?.sp || a === b) return false;
    const child = mergeSheets(a.sp, b.sp);
    for (const e of [a, b]) { const i = L.indexOf(e); if (i >= 0) L.splice(i, 1); }
    g.events?.emit('spirit.merge', { kinds: [a.kind, b.kind], kind: child.kind, by: 'courier' });
    this.bind({ kind: child.kind, cls: child.cls, sp: { ...child, fatigue: 0 } }, 'merge');
    this.realm.respawn();
    return true;
  }

  /** The wild ones the garden draws: once a game day each kind whose wants it meets visits, and settles after enough visits. */
  visitors() {
    const day = today(), counts = this.realm.plots.counts();
    for (const kind of Object.keys(VISITORS)) {
      const v = this.visits[kind] ||= { n: 0, day: -1 };
      if (v.day === day || wantsMet(kind, counts) < 1) continue;
      v.day = day; v.n++;
      const settled = v.n >= VISITORS[kind].settle;
      this.game.events?.emit('spirit.visit', { kind, settled, by: 'courier' });
      if (settled) { v.n = 0; this.bind({ kind, cls: 0 }, 'visit'); }
      this.dirty();
    }
  }

  bind(entry, from) {
    const g = this.game, e = { name: null, cls: 0, at: calNow(), ...entry, from };
    e.sp ||= { ...fresh(e.kind, e.cls, FEELINGS[(e.kind.length + (e.cls || 0)) % FEELINGS.length]), fatigue: 0 };
    g.bound?.add(e);
    if (this.realm.active) this.realm.respawn();
  }

  update(dt) {
    const W = this.waking; if (!W) return;
    if ((W.t -= dt) > 0) return;
    this.waking = null; if (this.game.garden) this.game.garden.awakening = false;
    this.bind({ kind: 'spirit', cls: 1, name: 'Lachrymite' }, 'fossil'); // (what a fossil wakes as is Calissa's and Espada's to say: a spirit of set Lachryma)
  }

  dump() { return { used: this.used, visits: this.visits }; }
  load(d) { this.used = d?.used || {}; this.visits = d?.visits || {}; }
  dirty() { this.game.save?.dirty('realm'); }
}
