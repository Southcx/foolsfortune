// ---------------------------------------------------------------------------------------
// THE MYCELIUM IN THE INNER REALM: the world's side of the garden's fungi (docs/plans/MYCELIUM.md sections 3 to 5; the rules are
// progress/mycelium.js, the kept state progress/sporebeds.js, progress/myggdrasil.js and progress/keepsakes.js; Petra's split, 2026-10-08:
// "take the whole world side"). Four things:
//   MYGGDRASIL'S PLANETOID  given at the second Firing (Sinter: ECON.myggdrasil.firing), the largest in the garden (26 m), hung below and
//                           behind the ring so its crown rises toward the Dantian; linked by lotuses to its two nearest like a bought
//                           one (orbit.js's way), with plots of its own. The tree on its crown is BIG (the owner: 48 m), a stand-in here
//                           (a labradorite trunk, a gold cap lit in the tincture's colour, its ten fruiting bodies shown as they open)
//                           until Calissa's billboarded canopy comes. F at its roots: feed it, pick the crown, hang a card.
//   THE SPORE BEDS          a placed feature (`sporebed`, progress/realm.js FEATURES); a fairy ring of caps in its strain's colour, lit
//                           when what it works is ready. F at one: inoculate it, set what it eats, take it back, harvest. Its
//                           neighbours' strains pace it (sporebeds.js near), worked out from the plots whenever the garden changes.
//   THE KEEPSAKE POTS       every pot fired for a spirit let go stands in a ring at the Chimney's foot, in its feeling's colour.
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

/** Where Myggdrasil's planetoid hangs from the garden's heart (below the Dantian and behind the Chimney: clear of the ring's ten slots,
 *  ORBIT.radius 95 round the Dantian, and of every first planetoid by 60 m and more), the plots it gives, its roots' clearing, the
 *  trunk's foot, and how many keepsake pots the Chimney's ring shows. */
export const MYGG = { at: [0, -60, -160], plots: 6, roots: 6, trunk: 3.2, pots: 64 };
const GAME_HOUR = (calendar.DAY_MS ?? 3600000) / 24, UP = new THREE.Vector3(0, 1, 0);
const colorOf = (feeling) => new THREE.Color(COLOR[feeling] ?? 0xd8d0c8);
const hsl = (h, s) => new THREE.Color().setHSL((((h ?? 0) % 360) + 360) % 360 / 360, Math.max(0.05, Math.min(1, s ?? 0)), 0.5);

export class GardenMycelium {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.planet = null; this.tree = null; this.rings = new Map();
    const ev = this.game.events;
    ev?.on?.('garden.enter', () => { this.give(); this.sync(); });
    for (const n of ['garden.place', 'garden.move', 'spore.inoculate', 'spore.set', 'spore.back', 'spore.harvest', 'myggdrasil.feed', 'myggdrasil.fruit', 'myggdrasil.pick', 'myggdrasil.hang', 'keepsake.pot']) ev?.on?.(n, () => { if (this.R.active) this.sync(); });
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
    const foot = dirOf(78, 0), top = UP.clone();
    site.features.push({ kind: 'myggdrasil', planet: P, pos: P.c.clone().addScaledVector(foot, P.radiusAt(foot)) }); // (before adopt: no plot is laid on its roots)
    site.features.push({ kind: 'myggdrasilTrunk', planet: P, pos: P.c.clone().addScaledVector(top, P.radiusAt(top)), mesh: { visible: false } }); // (kept clear of plots; never offered)
    this.R.adopt(P, MYGG.plots);
    this.R.clays.myggdrasil?.keep(top.clone().multiplyScalar(P.r), MYGG.roots * 2); // (no stroke heaves the tree)
    this.planet = P; this.tree = this.buildTree(P); site.group.add(this.tree.group);
    g.events?.emit('garden.myggdrasil', { planetoid: P.id, by: 'courier' });
    return P;
  }

  /** The stand-in tree (Calissa's comes): a labradorite trunk 48 m tall on flared roots, a gold cap the width of a planetoid, the ten
   *  fruiting bodies hung on it in the Tree of Life's three pillars, the crop as lights under the cap's rim. */
  buildTree(P) {
    const H = ECON.myggdrasil.treeHeight, group = new THREE.Group(); group.name = 'myggdrasil-tree';
    group.position.copy(P.c).addScaledVector(UP, P.radiusAt(UP) - 0.6);
    const bark = new THREE.MeshStandardMaterial({ color: 0x2b3440, emissive: 0x1a2a3a, emissiveIntensity: 0.4, roughness: 0.55, metalness: 0.3, name: 'myggdrasil-bark' });
    const cap = new THREE.MeshStandardMaterial({ color: 0xc9a24a, emissive: 0x6a4a10, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.5, name: 'myggdrasil-cap' });
    const gill = new THREE.MeshStandardMaterial({ color: 0x8fa0c8, emissive: 0x405080, emissiveIntensity: 0.8, roughness: 0.6, side: THREE.DoubleSide, name: 'myggdrasil-gills' });
    const add = (geo, mat, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; group.add(m); return m; };
    add(new THREE.CylinderGeometry(MYGG.trunk * 0.55, MYGG.trunk, H, 14, 6), bark, H / 2);
    for (let k = 0; k < MYGG.roots; k++) { const r = add(new THREE.ConeGeometry(1.4, 9, 6), bark, 2); r.rotation.set(1.05, (k / MYGG.roots) * Math.PI * 2, 0, 'YXZ'); r.position.set(Math.sin((k / MYGG.roots) * Math.PI * 2) * 3.6, 1.2, Math.cos((k / MYGG.roots) * Math.PI * 2) * 3.6); }
    const dome = add(new THREE.SphereGeometry(20, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), cap, H - 4); dome.scale.y = 0.42;
    add(new THREE.RingGeometry(MYGG.trunk, 20, 36, 2).rotateX(Math.PI / 2), gill, H - 4.05);
    // the ten fruiting bodies (the sephiroth, CAPS): three pillars on the trunk's south face, the Kingdom lowest and the Crown on top
    const at = [[0, 0.12], [0, 0.3], [-1, 0.38], [1, 0.38], [0, 0.5], [-1, 0.6], [1, 0.6], [-1, 0.78], [1, 0.78], [0, 0.94]];
    const bodyGeo = new THREE.SphereGeometry(1.5, 12, 8); bodyGeo.scale(1, 0.5, 1);
    this.bodies = at.map(([x, y], i) => { const m = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0xf2e6c4, emissive: 0xffd88a, emissiveIntensity: 0.9, roughness: 0.5, name: `myggdrasil-body-${i}` })); m.position.set(x * 2.6, y * (H - 6), MYGG.trunk + 0.4); m.visible = false; group.add(m); return m; });
    this.crop = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.4, name: 'myggdrasil-crop' }), 12);
    this.crop.count = 0; this.crop.position.y = H - 6; group.add(this.crop);
    return { group, cap, gill, bark };
  }

  // ------------------------------------------------------------------ the garden as it is now
  /** Everything drawn again from the kept state: the beds' rings and places, their neighbours, the tree's colour, bodies and crop,
   *  the pots. Cheap: a few dozen objects, called on entering and when anything changes. */
  sync() {
    if (!this.R.site) return;
    this.syncBeds(); this.syncTree(); this.syncPots();
  }
  syncBeds() {
    const S = this.G, plots = this.R.plots?.plots || [], site = this.R.site; if (!S) return;
    site.features = site.features.filter((f) => f.kind !== 'sporebed');
    for (const p of plots) {
      if (p.placed?.feature !== 'sporebed') { this.dropRing(p); continue; }
      let i = S.bedOf(p.id); if (i < 0) i = S.grant(p.id); // (a bed placed before its colony was kept: a world from before this round)
      site.features.push({ kind: 'sporebed', plot: p.id, bed: i, planet: p.planet, pos: p.pos });
      const near = this.R.plots.neighbours(p).filter((q) => q.placed?.feature === 'sporebed').map((q) => S.beds[S.bedOf(q.id)]?.strain).filter(Boolean);
      if (JSON.stringify(near) !== JSON.stringify(S.beds[i].near)) S.near(i, near);
      this.ring(p, S.beds[i], S.ready(i));
    }
  }
  /** A bed's fairy ring of caps on its plot, in its strain's colour (grey while it has none), lit when it is ready. */
  ring(p, b, ready) {
    let r = this.rings.get(p.id);
    if (!r || r.group.parent !== p.group) {
      this.dropRing(p); if (!p.group) return;
      const mat = new THREE.MeshStandardMaterial({ color: 0xbbb4a8, emissive: 0x000000, roughness: 0.6, name: 'sporebed-ring' }), group = new THREE.Group(); group.name = 'sporebed-ring';
      const capGeo = new THREE.SphereGeometry(0.22, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), stemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.25, 6);
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, x = Math.sin(a) * 0.95, z = Math.cos(a) * 0.95, s = 0.8 + 0.4 * ((k * 37) % 7) / 7; const c = new THREE.Mesh(capGeo, mat); c.position.set(x, 0.24 * s, z); c.scale.setScalar(s); const st = new THREE.Mesh(stemGeo, mat); st.position.set(x, 0.12 * s, z); st.scale.setScalar(s); group.add(c, st); }
      p.group.add(group); r = { group, mat }; this.rings.set(p.id, r);
    }
    r.mat.color.copy(b?.strain ? colorOf(b.strain) : new THREE.Color(0xbbb4a8));
    r.mat.emissive.copy(ready && b?.strain ? colorOf(b.strain) : new THREE.Color(0x000000)); r.mat.emissiveIntensity = ready ? 0.9 : 0;
  }
  dropRing(p) { const r = this.rings.get(p.id); if (!r) return; r.group.parent?.remove(r.group); r.group.traverse((o) => o.geometry?.dispose?.()); r.mat.dispose(); this.rings.delete(p.id); }
  syncTree() {
    const T = this.T, t = this.tree; if (!T || !t) return;
    T.dawn?.();
    const sap = T.tincture, c = sap?.mass ? hsl(sap.h, sap.s) : new THREE.Color(0x6a4a10);
    t.cap.emissive.copy(c).multiplyScalar(0.6); t.gill.emissive.copy(c);
    this.bodies.forEach((m, i) => { m.visible = i < T.caps; });
    const crop = T.crown || [], mtx = new THREE.Matrix4();
    this.crop.count = Math.min(12, crop.length);
    for (let i = 0; i < this.crop.count; i++) { const a = (i / Math.max(1, this.crop.count)) * Math.PI * 2; mtx.makeTranslation(Math.sin(a) * 17, -0.4, Math.cos(a) * 17); this.crop.setMatrixAt(i, mtx); this.crop.setColorAt(i, hsl(crop[i].hue, crop[i].sat)); }
    this.crop.instanceMatrix.needsUpdate = true; if (this.crop.instanceColor) this.crop.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ the keepsake pots
  /** The pots in a ring (two, then three) at the Chimney's foot, each a white-ground lekythos banded in its spirit's feeling. */
  syncPots() {
    const pots = this.game.keepsakes?.pots || [], C = this.R.site.by.chimney; if (!C) return;
    if (!this.pots) {
      const pts = [[0, 0], [0.16, 0.02], [0.2, 0.25], [0.19, 0.55], [0.12, 0.62], [0.06, 0.66], [0.05, 0.82], [0.1, 0.86], [0, 0.88]].map(([x, y]) => new THREE.Vector2(x, y));
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, name: 'keepsake-pot' });
      this.pots = new THREE.InstancedMesh(new THREE.LatheGeometry(pts, 12), mat, MYGG.pots); this.pots.count = 0; this.pots.name = 'keepsake-pots';
      this.pots.castShadow = true; this.R.site.group.add(this.pots);
    }
    const n = Math.min(MYGG.pots, pots.length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 20), dir = dirOf(18 + row * 8, (i % 20) * 18 + row * 9), pos = C.c.clone().addScaledVector(dir, C.radiusAt(dir));
      q.setFromUnitVectors(UP, dir); m.compose(pos, q, new THREE.Vector3(1, 1, 1)); this.pots.setMatrixAt(i, m);
      this.pots.setColorAt(i, colorOf(pots[i].feeling).lerp(new THREE.Color(0xf4efe4), 0.55)); // (white ground, a wash of its feeling)
    }
    this.pots.count = n; this.pots.instanceMatrix.needsUpdate = true; if (this.pots.instanceColor) this.pots.instanceColor.needsUpdate = true;
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
        for (const f of held) row('✻', `Inoculate with ${STRAIN_NAMES[f]}`, `it ${STRAINS[f].verb}s: ${STRAINS[f].eats.join(', ')}`, () => done(S.inoculate(i, f)));
        if (!held.length) row('·', 'You hold no spores', 'the first bed brings the oyster and the inkcap; Myggdrasil seeds the rest');
      } else if (!b.set) {
        const St = STRAINS[b.strain], want = this.things((x) => St.eats.includes(x.kind) && signatureOf(x));
        if (St.pair) {
          if (first == null) for (const w of want) row('◇', w.name, 'the first of two curios to graft', () => this.bedPage(plot, w.k));
          else for (const w of want.filter((w) => w.k !== first)) row('◆', w.name, 'graft it with the first', () => done(S.set(i, [first, w.k])));
        } else for (const w of want) row('◇', w.name, `set it for ${STRAIN_NAMES[b.strain]} to ${St.verb}`, () => done(S.set(i, [w.k])));
        if (!want.length) row('·', 'Nothing it eats', `${STRAIN_NAMES[b.strain]} eats ${St.eats.join(', ')}, from your Pneuka Box`);
      } else if (S.ready(i)) {
        row('❀', 'Harvest', `what ${STRAIN_NAMES[b.strain]} has made`, () => done(S.harvest(i)));
      } else {
        const hrs = S.left(i) / GAME_HOUR, early = calendar.now() - b.at <= GAME_HOUR;
        row('◌', `${STRAIN_NAMES[b.strain][0].toUpperCase()}${STRAIN_NAMES[b.strain].slice(1)} is working`, `about ${hrs < 1 ? 'less than a game hour' : `${Math.ceil(hrs)} game hours`} left`);
        if (early) row('↶', 'Take it back', 'unchanged: the colony has not taken yet', () => done(S.back(i)));
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
      crown('❦', n ? `Pick the crown (${n})` : 'The crown is bare', n ? 'every fruit into your Pneuka Box' : `it fruits at dawn; fruiting bodies open: ${T.caps} of ${CAPS.length}`, n ? () => { T.pick(); again(); } : null, !n);
      const roots = mk('THE ROOTS');
      const food = this.things((x) => !!signatureOf(x));
      for (const w of food.slice(0, 24)) roots('◇', w.name, `feed it to the roots (worth ${signatureOf(w.x).worth})`, () => again(T.feed(w.k)));
      if (!food.length) roots('·', 'Nothing to feed it', 'it eats anything with a colour: a curio, a material, a fish');
      const branches = mk('THE BRANCHES'), cards = Object.keys(BRANCHES).filter((a) => !T.branches[a] && book?.has?.(`arcana.${a}`));
      for (const a of cards) branches('✦', `Hang ${a}`, `the card given to its branch, for good: ${BRANCHES[a].adds}`, () => again(T.hang(a)));
      branches('·', `${Object.keys(T.branches).length} of ${Object.keys(BRANCHES).length} branches hung`, cards.length ? 'a Major Arcana card from the Book hangs on its own branch' : 'a Major Arcana card in the Book can be hung here');
    }, { title: NAMES.myggdrasil?.name?.toUpperCase?.() || 'MYGGDRASIL', sub: 'click to choose · F closes' });
  }

  /** Once a frame while the garden is open: a bed coming ready lights its ring (checked once a real second). */
  update(raw) {
    if ((this.tick = (this.tick ?? 0) - raw) > 0) return;
    this.tick = 1;
    const S = this.G; if (!S) return;
    for (const [plot, r] of this.rings) { const i = S.bedOf(plot); if (i >= 0 && S.ready(i) && !(r.mat.emissiveIntensity > 0)) { this.syncBeds(); break; } }
  }
}
