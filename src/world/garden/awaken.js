// ---------------------------------------------------------------------------------------
// NEW SPIRITS FROM OLD THINGS, AND TWO MADE ONE: the garden's other ways to a spirit (docs/plans/SPIRIT-GARDEN.md section 5, "where they
// come from"; Round 4). At the Athanor's shrine a Veritome PHOTOGRAPH of a creature awakens a spirit of its kind, its strength read from
// the plate's stars (Monster Rancher's disc stone); in the Mulberry Grove a LACHRYMITE FOSSIL dug in the Dunes wakes to the Awakening
// Song (Spectrobes; Wanda's song plays while `game.garden.awakening`); wild Figments VISIT when the garden meets their wants and SETTLE
// after enough visits (Viva Piñata; the wants are Dovina's, progress/realm.js VISITORS); and in the cocoon tree two spirits MERGE into
// one (Jade Cocoon; progress/spirits.js merge). Each new spirit is bound (creatures/bound.js add) and hops out into the Grove.
// A waking and a merging are shown, not told (Calissa's looks): the fossil lies by the tree and its crystal answers the song's beats until
// it breaks open (vfx/garden/fossil.js); the two to merge are wound into pods in the cocoon tree, drawn together and twined, and the pod
// opens on the child (vfx/garden/cocoontree.js). Nothing changes in the save until that moment (the fossil stays in the box, the two stay
// bound), so leaving the garden part way, or a save in the middle, loses nothing: the hatch is put off, not spent.
// Events (each with `by`): spirit.bind { from: 'plate' | 'fossil' | 'visit' | 'merge' }, spirit.visit { kind, settled }, spirit.merge.
//
// Prior art: Monster Rancher's shrine (a monster from a disc), Spectrobes Origins' fossils woken by sound, Viva Piñata's visitors who
// settle when the garden suits them, Jade Cocoon's merging (the child takes from both parents).
//
//   const A = new Awaken(game, realm)   A.plates() -> [{ kind, stars }]   A.plate(kind)   A.fossil()   A.merge(a, b)   A.visitors()
//   A.hatch (what is waking or merging, or null)   A.inTree(e)   A.cancel()   A.update(dt)   A.dump() / A.load(d)
//   (realm.js calls them from the Athanor's and the cocoon tree's pages)
// ---------------------------------------------------------------------------------------
import { fresh, merge as mergeSheets, STATS } from '../../progress/spirits.js';
import { VISITORS, wantsMet } from '../../progress/realm.js';
import { today, now as calNow } from '../../core/calendar.js';
import { Fossil } from '../../vfx/garden/fossil.js';
import { dirOf } from './place.js';

export const FOSSIL = 'fossil.lachrymite';
const SONG = 15; // (real seconds: the Awakening Song, Wanda's, plays once while the fossil wakes)
const MERGE = { wind: 2, twine: 3, open: 0.8 }; // (seconds: the silk winds round both, they are drawn together and twined, the pod opens)
const SHAPES = ['spiral', 'fish', 'claw'];
const FEELINGS = Object.keys(STATS);

export class Awaken {
  constructor(game, realm) { this.game = game; this.realm = realm; this.used = {}; this.visits = {}; this.woken = 0; this.hatch = null; }

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
  /** In the Grove: a fossil from the box wakes while the Awakening Song plays (it leaves the box when it breaks open). */
  fossil() {
    const g = this.game; if (this.hatch || !g.pneuka?.count(FOSSIL)) return false;
    const e = this.entry({ kind: 'spirit', cls: 1, name: 'Lachrymite' }, 'fossil'); // (what a fossil wakes as is Calissa's and Espada's to say: a spirit of set Lachryma)
    const look = new Fossil({ shape: SHAPES[this.woken % SHAPES.length], feeling: e.sp.feeling }), P = this.realm.place;
    look.group.applyMatrix4(P.stand(P.by.grove, dirOf(62, 35), 0)); P.group.add(look.group);
    this.hatch = { kind: 'fossil', e, look, t: 0, beat: -1 }; if (g.garden) g.garden.awakening = true;
    return true;
  }
  /** In the cocoon tree: two become one (the stronger of each stat at three quarters; the kind of the more bonded), once their pod opens. */
  merge(a, b) {
    if (this.hatch || !a?.sp || !b?.sp || a === b) return false;
    const R = this.realm;
    for (const s of [...R.spirits]) if (s.e === a || s.e === b) { R.place.group.remove(s.mesh); R.spirits.splice(R.spirits.indexOf(s), 1); } // (into the pods)
    this.hatch = { kind: 'merge', a, b, t: 0 };
    return true;
  }
  /** Is this spirit wound into a pod (the realm leaves it out of the Grove)? */
  inTree(e) { return !!this.hatch && (this.hatch.a === e || this.hatch.b === e); }
  /** Put off whatever is waking or merging (the garden left): nothing was spent. */
  cancel() {
    const H = this.hatch; if (!H) return;
    this.hatch = null; if (this.game.garden) this.game.garden.awakening = false;
    H.look?.dispose(); const T = this.realm.place.tree; T.cocoon(0, { k: 0 }); T.cocoon(1, { k: 0 }); T.merging = null;
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

  /** A new bound entry with its sheet (bind() adds it to the bound). */
  entry(entry, from) {
    const e = { name: null, cls: 0, at: calNow(), ...entry, from };
    e.sp ||= { ...fresh(e.kind, e.cls, FEELINGS[(e.kind.length + (e.cls || 0)) % FEELINGS.length]), fatigue: 0 };
    return e;
  }
  bind(entry, from) {
    this.game.bound?.add(entry.from ? entry : this.entry(entry, from));
    if (this.realm.active) this.realm.respawn();
  }

  update(dt) {
    const H = this.hatch; if (!H) return;
    const g = this.game, T = this.realm.place.tree; H.t += dt;
    if (H.kind === 'fossil') {
      // the crystal answers the song's beats (the music's grid, or every half second when nothing plays), and wakes as the song goes on
      const M = g.music?.grid?.(), b = M ? Math.floor((g.music.ctx.currentTime - M.t0) / M.spb) : Math.floor(H.t / 0.5);
      if (b !== H.beat) { H.beat = b; H.look.beat(); }
      H.look.awaken(H.t / SONG); H.look.update(dt);
      if (H.t >= SONG && !H.broke) { H.broke = true; H.look.burst(); }
      if (H.t < SONG + 1.2) return;
      const k = g.pneuka?.slots.findIndex((x) => x?.id === FOSSIL);
      this.hatch = null; if (g.garden) g.garden.awakening = false; H.look.dispose();
      if (k == null || k < 0) return; // (the fossil left the box while it sang: nothing wakes)
      g.pneuka.take(k); this.woken++; this.dirty();
      this.bind(H.e);
      return;
    }
    // a merging: the silk winds round both, they are drawn together and twined, and the pod opens on the child
    if (H.opened) { if (H.t >= MERGE.wind + MERGE.twine + MERGE.open) this.hatch = null; return; }
    const w = Math.min(1, H.t / MERGE.wind);
    if (!H.wound) { T.cocoon(0, { feeling: H.a.sp.feeling, k: w }); T.cocoon(1, { feeling: H.b.sp.feeling, k: w }); H.wound = w >= 1; return; }
    T.merge(0, 1, (H.t - MERGE.wind) / MERGE.twine);
    if (H.t < MERGE.wind + MERGE.twine) return;
    H.opened = true; T.open(0);
    const L = g.bound?.list || [], child = mergeSheets(H.a.sp, H.b.sp);
    for (const e of [H.a, H.b]) { const i = L.indexOf(e); if (i >= 0) L.splice(i, 1); }
    g.events?.emit('spirit.merge', { kinds: [H.a.kind, H.b.kind], kind: child.kind, by: 'courier' });
    this.bind({ kind: child.kind, cls: child.cls, sp: { ...child, fatigue: 0 } }, 'merge');
  }

  dump() { return { used: this.used, visits: this.visits, woken: this.woken }; }
  load(d) { this.used = d?.used || {}; this.visits = d?.visits || {}; this.woken = d?.woken || 0; }
  dirty() { this.game.save?.dirty('realm'); }
}
