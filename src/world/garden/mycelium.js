// ---------------------------------------------------------------------------------------
// THE MYCELIUM IN THE INNER REALM: the world's side of the garden's fungi (docs/plans/MYCELIUM.md sections 3 to 5; the rules are
// progress/mycelium.js, the kept state progress/sporebeds.js, progress/myggdrasil.js and progress/keepsakes.js; Petra's split, 2026-10-08:
// "take the whole world side"). Four things:
//   MYGGDRASIL'S PLANETOID  given at the second Firing (Sinter: ECON.myggdrasil.firing), the largest in the garden (26 m), hung below and
//                           behind the ring so its crown rises toward the Dantian; linked by lotuses to its two nearest like a bought
//                           one (orbit.js's way), with plots of its own. The tree on its crown is BIG (the owner: 48 m): Calissa's
//                           World Mushroom (vfx/garden/myggdrasil.js, grown by the planetoid's look and reading game.myggdrasil
//                           itself), its threads sent to the spore beds here. F at its roots' mouth: feed it, pick the crown, hang a card.
//   THE SPORE BEDS          a placed feature (`sporebed`, progress/realm.js FEATURES); Calissa's strain bed (vfx/garden/strains.js) in its
//                           strain, its colony grown as what it works comes ready, its foxfire by night. F at one: inoculate it, set what it eats, take it back, harvest. Its
//                           neighbours' strains pace it (sporebeds.js near), worked out from the plots whenever the garden changes.
//   THE KEEPSAKE POTS       every pot fired for a spirit let go stands in a ring at the Chimney's foot: the newest as Calissa's painted
//                           lekythos (vfx/garden/lekythos.js), the older as plain pots washed in their feeling.
//   THE SPORELINGS          the tree's sporelings (Calissa's, vfx/garden/sporeling.js) round its roots, in the tincture's colour.
//   (THE GRIMOIRE OF ECHOES the Codex page: feedback/codex/grimoire.js.)
// The pages are the Index's window (the garden's shed, the plate shrine): no other window of words.
//
// Prior art: Legend of Mana's Trent and its orchard (one tree you feed and pick, the centre of home), Stardew Valley's mushroom cave and
// its kegs (set it, leave it, it waits), Animal Crossing's fairy rings, Super Mario Galaxy's planetoid given as the story opens, and the
// white-ground lekythoi of Athens for the pots.
//
//   game.gardenMycelium = new GardenMycelium(game.realm)   .give() -> planetoid | null   .sync()   .use(feature) -> bool   .update(raw)
//   (made in main.js; the realm's two hooks are Petra's: `use` tried in realm.use()'s default, `update` in its update: docs/handoffs/petra/)
// events: garden.myggdrasil { planetoid } (the planetoid given), with `by`
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { firingOf, ranksOf } from '../../progress/spirits.js';
import { ECON } from '../../progress/econ/table.js';
import { PLANETOIDS as NAMES } from '../../npc/realmnames.js';
import { STRAINS, STRAIN_NAMES, CAPS, BRANCHES, signatureOf } from '../../progress/mycelium.js';
import { thingOf } from '../../progress/sporebeds.js';
import { COLOR } from '../../progress/weather.js';
import * as calendar from '../../core/calendar.js';
import { GARDEN_AT, dirOf } from './place.js';
import { phaseAt } from '../../progress/weather.js';
import { strainBed, strainsParked } from '../../vfx/garden/strains.js';
import * as Lekythos from '../../vfx/garden/lekythos.js'; // (a namespace: lekythosShared is read when it lands, Calissa's cdd5ccd)
const { lekythos, lekythosParked } = Lekythos;
import { sporeling, sporelingParked } from '../../vfx/garden/sporeling.js';

/** Where Myggdrasil's planetoid hangs from the garden's heart (below the Dantian and behind the Chimney: clear of the ring's ten slots,
 *  ORBIT.radius 95 round the Dantian, and of every first planetoid by 60 m and more), the plots it gives, its roots' clearing, the
 *  trunk's foot, and how many keepsake pots the Chimney's ring shows. */
export const MYGG = { at: [0, -60, -160], plots: 6, roots: 6, trunk: 3.2, pots: 64, painted: 6, sporelings: 6 };
// (painted: the newest pots drawn as Calissa's lekythos while each painting is its own, about 5 MB; once pots of one kind and feeling
//  share a painting (Calissa's lekythosShared) every pot is painted. sporelings: as many of the tree's sporelings stand round its roots.)
const PAINTED = () => (Lekythos.lekythosShared ? MYGG.pots : MYGG.painted);
const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24, UP = new THREE.Vector3(0, 1, 0);
/** What a strain does and what a branch gives, in plain words (docs/plans/CLARITY.md; the words Espada's to settle). */
const VERB_LINE = { graft: 'Fuses two curios into one', ferment: 'Makes a material more vivid', print: 'Copies anything as a material of its colour', rot: 'Breaks anything down into materials', dissolve: 'Makes a material paler' };
const ADDS_LINE = { fruit: 'one more fruit each dawn', sharp: 'its fruit closer to its colour', seed: 'a new kind of spores', sporeling: 'sporelings come more often' };
const colorOf = (feeling) => new THREE.Color(COLOR[feeling] ?? 0xd8d0c8);
/** The garden's night, 0 day .. 1 night, as the realm's sky reads it (dusk and dawn half). */
const nightNow = () => { const ph = phaseAt(); return ph === 'night' ? 1 : ph === 'dusk' || ph === 'dawn' ? 0.45 : 0; };
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3();
/** The ground's own normal on planetoid P at direction `dir` (three samples of its radiusAt: Calissa's rule 64), and the point there. */
function groundAt(P, dir) {
  const d = dir.clone().normalize(), at = P.c.clone().addScaledVector(d, P.radiusAt(d)), e = 0.6 / P.r;
  _t1.set(0, 1, 0).cross(d); if (_t1.lengthSq() < 1e-6) _t1.set(1, 0, 0).cross(d); _t1.normalize(); _t2.crossVectors(d, _t1).normalize();
  const da = d.clone().addScaledVector(_t1, e).normalize(), db = d.clone().addScaledVector(_t2, e).normalize();
  _a.copy(P.c).addScaledVector(da, P.radiusAt(da)).sub(at); _b.copy(P.c).addScaledVector(db, P.radiusAt(db)).sub(at);
  const n = new THREE.Vector3().crossVectors(_a, _b).normalize(); if (n.dot(d) < 0) n.negate();
  return { at, n };
}
/** Stand a group on the ground at `dir` of P, its +Y the ground's normal. */
function stand(group, P, dir, yaw = 0) { const { at, n } = groundAt(P, dir); group.position.copy(at); group.quaternion.setFromUnitVectors(UP, n).multiply(new THREE.Quaternion().setFromAxisAngle(UP, yaw)); }

export class GardenMycelium {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.planet = null; this.tree = null; this.beds = new Map(); this.painted = []; this.sporelings = [];
    const ev = this.game.events;
    ev?.on?.('garden.enter', () => { for (const o of this.parkedLooks || []) o.visible = false; this.give(); this.sync(); });
    for (const n of ['garden.place', 'garden.move', 'spore.inoculate', 'spore.set', 'spore.back', 'spore.harvest', 'myggdrasil.feed', 'myggdrasil.fruit', 'myggdrasil.pick', 'myggdrasil.hang', 'myggdrasil.sporeling', 'keepsake.pot']) ev?.on?.(n, () => { if (this.R.active) this.sync(); });
  }
  get G() { return this.game.sporeBeds; }
  get T() { return this.game.myggdrasil; }
  say(s) { this.game.log?.say('warn', s, { key: 'garden.mycelium', throttle: 1 }); } // (a refusal at the point of use)

  // ------------------------------------------------------------------ Myggdrasil's planetoid
  /** Given at Sinter (the second Firing), once: the planetoid, its plots and lotuses, the tree on its crown, the place at its roots. */
  give() {
    const g = this.game, site = this.R.site, E = ECON.myggdrasil;
    if (this.planet || site.by.myggdrasil) return this.planet;
    const fired = g.ledger ? firingOf(ranksOf(g.ledger)) : 0;
    if (fired < E.firing) return null;
    const P = site.addPlanet({ id: 'myggdrasil', r: E.radius, c: GARDEN_AT.clone().add(new THREE.Vector3(...MYGG.at)), name: NAMES.myggdrasil?.name || 'Myggdrasil' });
    P.look.game = g; this.tree = P.look.growMushroom(); // (the tree reads game.myggdrasil each frame: Calissa's)
    const foot = this.tree ? this.tree.mouthAt.clone().normalize() : dirOf(78, 0), top = UP.clone(); // (F where its mouth is drawn)
    site.features.push({ kind: 'myggdrasil', planet: P, pos: P.c.clone().addScaledVector(foot, P.radiusAt(foot)) }); // (before adopt: no plot is laid on its roots)
    site.features.push({ kind: 'myggdrasilTrunk', planet: P, pos: P.c.clone().addScaledVector(top, P.radiusAt(top)), mesh: { visible: false } }); // (kept clear of plots; never offered)
    this.R.adopt(P, MYGG.plots);
    this.R.clays.myggdrasil?.keep(top.clone().multiplyScalar(P.r), MYGG.roots * 2); // (no stroke heaves the tree)
    this.planet = P;
    g.events?.emit('garden.myggdrasil', { planetoid: P.id, by: 'courier' });
    return P;
  }

  // ------------------------------------------------------------------ the garden as it is now
  /** Everything drawn again from the kept state: the beds' rings and places, their neighbours, the tree's threads to the beds,
   *  the pots. Cheap: a few dozen objects, called on entering and when anything changes. */
  sync() {
    if (!this.R.site) return;
    this.syncBeds(); this.syncTree(); this.syncPots(); this.syncSporelings();
  }
  syncBeds() {
    const S = this.G, plots = this.R.plots?.plots || [], site = this.R.site; if (!S) return;
    site.features = site.features.filter((f) => f.kind !== 'sporebed');
    for (const p of plots) {
      if (p.placed?.feature !== 'sporebed') { this.dropBed(p.id); continue; }
      let i = S.bedOf(p.id); if (i < 0) i = S.grant(p.id); // (a bed placed before its colony was kept: a world from before this round)
      site.features.push({ kind: 'sporebed', plot: p.id, bed: i, planet: p.planet, pos: p.pos });
      const near = this.R.plots.neighbours(p).filter((q) => q.placed?.feature === 'sporebed').map((q) => S.beds[S.bedOf(q.id)]?.strain).filter(Boolean);
      if (JSON.stringify(near) !== JSON.stringify(S.beds[i].near)) S.near(i, near);
      this.bed(p, S.beds[i], this.growthOf(i));
    }
  }
  /** How grown a bed's colony looks, 0..1: bare 0, colonised and idle 0.35, working toward 1, ready 1 (Calissa's `growth`). */
  growthOf(i) {
    const S = this.G, b = S.beds[i]; if (!b?.strain) return 0;
    if (!b.set) return 0.35;
    if (S.ready(i)) return 1;
    const total = b.hours * GAME_HOUR; return 0.35 + 0.6 * (1 - S.left(i) / Math.max(1, total));
  }
  /** A bed's look: Calissa's strain bed (vfx/garden/strains.js) in its strain, or in the feeling it was placed in while it has none, stood
   *  on the ground's own normal at its plot; its growth and the night set each time. */
  bed(p, b, growth) {
    const strain = b?.strain || p.placed?.feeling || 'wonder';
    let r = this.beds.get(p.id);
    if (r && (r.strain !== strain || r.planet !== p.planet || !r.at.equals(p.pos))) { this.dropBed(p.id); r = null; }
    if (!r) {
      const B = strainBed(strain, { radius: 1.2, growth, night: nightNow(), seed: (p.i ?? 0) + 1, curve: p.planet.r });
      stand(B.group, p.planet, p.pos.clone().sub(p.planet.c)); this.R.site.group.add(B.group);
      r = { B, strain, planet: p.planet, at: p.pos.clone(), growth }; this.beds.set(p.id, r);
    }
    r.growth = growth; r.B.set({ growth, night: nightNow() });
  }
  dropBed(plot) { const r = this.beds.get(plot); if (!r) return; r.B.dispose(); this.beds.delete(plot); }
  syncTree() {
    const T = this.T, t = this.tree; if (!T || !t) return;
    T.dawn?.();
    const site = this.R.site, beds = site.features.filter((f) => f.kind === 'sporebed' && f.planet === this.planet).map((f) => site.group.localToWorld(f.pos.clone()));
    t.threadsTo(beds); t.update(0, T); // (its threads run from its roots to each spore bed on its planetoid; its caps, tincture, branches and crop it reads itself, and now)
  }

  // ------------------------------------------------------------------ the keepsake pots
  /** The pots in a ring (two, then three) at the Chimney's foot: the newest MYGG.painted as Calissa's white-ground lekythos (its painting
   *  its spirit's), the older as plain pots washed in their feeling (one instanced mesh), each stood on the ground's normal. */
  syncPots() {
    const pots = this.game.keepsakes?.pots || [], C = this.R.site.by.chimney; if (!C) return;
    if (!this.pots) {
      const pts = [[0, 0], [0.16, 0.02], [0.2, 0.25], [0.19, 0.55], [0.12, 0.62], [0.06, 0.66], [0.05, 0.82], [0.1, 0.86], [0, 0.88]].map(([x, y]) => new THREE.Vector2(x, y));
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, name: 'keepsake-pot' });
      this.pots = new THREE.InstancedMesh(new THREE.LatheGeometry(pts, 12), mat, MYGG.pots); this.pots.count = 0; this.pots.name = 'keepsake-pots';
      this.pots.castShadow = true; this.R.site.group.add(this.pots);
    }
    const n = Math.min(MYGG.pots, pots.length), first = Math.max(0, n - PAINTED()), dirOfPot = (i) => { const row = Math.floor(i / 20); return dirOf(18 + row * 8, (i % 20) * 18 + row * 9); };
    // the painted: one lekythos a pot, kept while it stays among the newest
    const want = new Set(); for (let i = first; i < n; i++) want.add(i);
    this.painted = this.painted.filter((x) => { if (want.has(x.i) && x.pot === pots[x.i]) return true; x.P.dispose(); return false; });
    for (const i of want) if (!this.painted.some((x) => x.i === i)) { const P = lekythos({ spirit: pots[i], seed: i + 1 }); stand(P.group, C, dirOfPot(i)); this.R.site.group.add(P.group); this.painted.push({ i, pot: pots[i], P }); }
    // the plain ones
    const m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), g = new THREE.Group();
    for (let i = 0; i < first; i++) {
      stand(g, C, dirOfPot(i)); m.compose(g.position, g.quaternion, one); this.pots.setMatrixAt(i, m);
      this.pots.setColorAt(i, colorOf(pots[i].feeling).lerp(new THREE.Color(0xf4efe4), 0.55)); // (white ground, a wash of its feeling)
    }
    this.pots.count = first; this.pots.instanceMatrix.needsUpdate = true; if (this.pots.instanceColor) this.pots.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the sporelings
  /** The tree's sporelings (game.myggdrasil.s.sporeling, one each time its crown gives one) stand round its roots, swaying, in the
   *  tincture's colour, a few at most; each hops now and then (Calissa's sporeling: a look without a body, so it lifts itself). */
  syncSporelings() {
    const T = this.T, P = this.planet; if (!T || !P) return;
    const n = Math.min(MYGG.sporelings, T.s?.sporeling || 0), sap = T.tincture, colour = sap?.mass ? new THREE.Color().setHSL((((sap.h % 360) + 360) % 360) / 360, Math.max(0.2, sap.s), 0.5).getHex() : 0xd8584a;
    while (this.sporelings.length > n) this.sporelings.pop().S.dispose();
    for (let i = this.sporelings.length; i < n; i++) { const S = sporeling({ colour, seed: i + 1 }); stand(S.group, P, dirOf(62 - (i % 2) * 8, i * 61 + 20), i * 1.3); this.R.site.group.add(S.group); this.sporelings.push({ S, next: 2 + i }); }
    for (const x of this.sporelings) x.S.set({ colour, night: nightNow(), sway: 1 });
  }

  /** The looks parked for the warm-up (main.js compiles them with the garden's; hidden on the first entry, never disposed: Calissa's). */
  parked() {
    const g = this.R.site.group, D = this.R.site.by.dantian, L = [strainsParked(), lekythosParked(), sporelingParked()];
    for (const o of L) { o.position.copy(D.c); g.add(o); }
    this.parkedLooks = L; return L;
  }

  // ------------------------------------------------------------------ F at one of its places
  /** The realm's use() hands a feature here first; true when it was the mycelium's. */
  use(f) {
    if (f?.kind === 'sporebed') { this.bedPage(f.plot); return true; }
    if (f?.kind === 'myggdrasil') { this.treePage(); return true; }
    return false;
  }
  menu() { const g = this.game; return g.indexMenu || g.course?.menu; }
  /** The box's things a test accepts, as rows: { k (slot), name, x (the thing) }. */
  things(test) {
    const box = this.game.pneuka, out = [];
    (box?.slots || []).forEach((sl, k) => { const x = thingOf(sl, this.G?.itemOf); if (x && test(x)) out.push({ k, x, name: this.G.itemOf(sl.id)?.name || sl.id }); });
    return out;
  }

  /** A spore bed's page: what it is doing, and the one thing to do next. */
  bedPage(plot, first = null) {
    const S = this.G, M = this.menu(), i = S?.bedOf(plot); if (!M?.showPage || i < 0) return;
    const b = S.beds[i], done = (r) => { if (r && !r.ok) this.say(r.why); this.sync(); this.bedPage(plot); };
    M.showPage('garden.sporebed', (im, el) => {
      const rows = el('div', 'rooms'), row = (glyph, t, sub, run, dim = false) => { const d = el('div', 'room', `<span class="n">${glyph}</span><span><b>${t}</b><s>${sub}</s></span>`); if (dim) d.style.opacity = 0.45; if (run && !dim) d.onclick = run; rows.appendChild(d); };
      if (!b.strain) {
        const held = Object.keys(S.strains).filter((f) => S.strains[f]);
        for (const f of held) row('✻', `Plant ${STRAIN_NAMES[f].replace(/^the /, '')} spores`, VERB_LINE[STRAINS[f].verb], () => done(S.inoculate(i, f)));
        if (!held.length) row('·', 'No spores yet', 'Your first bed gives two kinds; Myggdrasil gives the rest');
      } else if (!b.set) {
        const St = STRAINS[b.strain], want = this.things((x) => St.eats.includes(x.kind) && signatureOf(x));
        if (St.pair) {
          if (first == null) for (const w of want) row('◇', w.name, 'Pick the first of two curios to fuse', () => this.bedPage(plot, w.k));
          else for (const w of want.filter((w) => w.k !== first)) row('◆', w.name, 'Fuse it with the first', () => done(S.set(i, [first, w.k])));
        } else for (const w of want) row('◇', w.name, `Put it in: ${VERB_LINE[St.verb].toLowerCase()}`, () => done(S.set(i, [w.k])));
        if (!want.length) row('·', 'Nothing it can use', `It takes: ${St.eats.join(', ')}s from your Pneuka Box`);
      } else if (S.ready(i)) {
        row('❀', 'Harvest', 'Take what it made', () => done(S.harvest(i)));
      } else {
        const hrs = S.left(i) / GAME_HOUR, early = calendar.now() - b.at <= GAME_HOUR;
        row('◌', 'Working', `Ready in about ${Math.max(1, Math.ceil(hrs * 2.5))} min`); // (a game hour is 2.5 real minutes: CLARITY.md, one clock)
        if (early) row('↶', 'Take it back', 'Still unchanged: you can take it out', () => done(S.back(i)));
      }
      im.appendChild(el('div', 'grp', `A SPORE BED${b.strain ? `: ${STRAIN_NAMES[b.strain].toUpperCase()}` : ''}`)); im.appendChild(rows);
    }, { title: 'A SPORE BED', sub: 'click to choose · F closes' });
  }

  /** Myggdrasil's page at its roots: pick the crown, feed it, hang a card on a branch. */
  treePage() {
    const T = this.T, M = this.menu(), book = this.game.veritome?.book; if (!M?.showPage || !T) return;
    const again = (r) => { if (r && r.ok === false) this.say(r.why); this.sync(); this.treePage(); };
    M.showPage('garden.myggdrasil', (im, el) => {
      const mk = (title) => { im.appendChild(el('div', 'grp', title)); const rows = el('div', 'rooms'); im.appendChild(rows); return (glyph, t, sub, run, dim = false) => { const d = el('div', 'room', `<span class="n">${glyph}</span><span><b>${t}</b><s>${sub}</s></span>`); if (dim) d.style.opacity = 0.45; if (run && !dim) d.onclick = run; rows.appendChild(d); }; };
      const crown = mk('THE CROWN'), n = T.crown.length;
      crown('❦', n ? `Pick the fruit (${n})` : 'No fruit yet', n ? 'All fruit into your Pneuka Box' : `Fruits every dawn; ${T.caps} of ${CAPS.length} caps grown`, n ? () => { T.pick(); again(); } : null, !n);
      const roots = mk('THE ROOTS');
      const food = this.things((x) => !!signatureOf(x));
      for (const w of food.slice(0, 24)) roots('◇', w.name, `Feed it: the tree grows and takes its colour`, () => again(T.feed(w.k)));
      if (!food.length) roots('·', 'Nothing to feed it', 'It eats curios, materials and fish');
      const branches = mk('THE BRANCHES'), cards = Object.keys(BRANCHES).filter((a) => !T.branches[a] && book?.has?.(`arcana.${a}`));
      for (const a of cards) branches('✦', `Hang ${a[0].toUpperCase()}${a.slice(1)}`, `Uses up the card: ${ADDS_LINE[BRANCHES[a].adds] || BRANCHES[a].adds}`, () => again(T.hang(a)));
      branches('·', `${Object.keys(T.branches).length} of ${Object.keys(BRANCHES).length} branches hung`, 'Hang a Major Arcana card from your Book for a lasting bonus');
    }, { title: NAMES.myggdrasil?.name?.toUpperCase?.() || 'MYGGDRASIL', sub: 'click to choose · F closes' });
  }

  /** Once a frame while the garden is open: a bed coming ready lights its ring (checked once a real second). */
  update(raw) {
    for (const r of this.beds.values()) r.B.update(raw);
    for (const x of this.sporelings) { x.S.update(raw); if ((x.next -= raw) <= 0) { x.S.hop(0.35); x.k = (x.k || 0) + 1; x.next = 3 + ((x.k * 37) % 5); } } // (a hop every 3 to 7 real seconds, each its own)
    if ((this.tick = (this.tick ?? 0) - raw) > 0) return;
    this.tick = 1;
    const S = this.G; if (!S) return;
    const night = nightNow(); for (const x of this.sporelings) x.S.set({ night });
    for (const [plot, r] of this.beds) { const i = S.bedOf(plot); if (i >= 0) { const gw = this.growthOf(i); if (Math.abs(gw - r.growth) > 0.01 || night !== r.night) { r.growth = gw; r.night = night; r.B.set({ growth: gw, night }); } } }
  }
}
