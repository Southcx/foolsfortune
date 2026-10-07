// ---------------------------------------------------------------------------------------
// THE PLOTS: where the god hand places a feature on a planetoid, and how the features strengthen and weaken one another
// (docs/plans/SPIRIT-GARDEN.md section 4; the numbers are Dovina's, progress/realm.js: each planetoid's plots, the eight FEATURES and
// their costs, the formation on Wu Xing's two cycles). A planetoid's plots are spread over it evenly (a golden spiral), away from what is
// fixed there. A feature is placed with a feeling, for cubes and one material of that feeling's kind; neighbours that GENERATE it
// strengthen it, those that OVERCOME it weaken it, and a spirit vein under its plot doubles the lot. The pull between two neighbours is
// shown, not written: a bright thread for one that feeds the other, a dark crack for one that checks it (marks in the world are not text);
// the log has the number (garden.place carries `mult`). The ground a feature stands on and the water that reaches it count as one
// neighbour each (SPIRIT-GARDEN.md items 6 and 11). A spirit vein ends, on each planetoid it joins, at the highest ground within 35
// degrees of the way to the other (item 13: dragon veins run along ridges), worked out again when a stroke ends; a plot within 3 m of an
// end is on the vein. A placed feature can be lifted by the hand and set in another free plot (item 7: free). The features are
// Calissa's (vfx/garden/features.js).
//
// Prior art: Dark Cloud 2's Georama (a place built piece by piece), feng shui and the Wu Xing cycles (generating and overcoming), the
// xianxia formation array (stones that empower their neighbours), and Animal Crossing's plots marked where a house may stand.
//
//   const T = new Plots(game, place, clays)   T.plots [{ id, planet, i, dir, pos, placed }]   T.near(point, r) -> plot   T.place(plot, feature, feeling)
//   T.show(on)   T.mult(plot) -> n   T.dump() -> [{ planet, i, feature, feeling }]   T.load(list)   T.counts() -> { features, feelings }
//   T.move(from, to)   T.settle(plot)   T.veins(planet?)   T.wet (a hook: (plot) -> a feeling or null, the realm's waterworks)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PLANETOID_PLOTS as PLOTS, FEATURES, costOf, formation, GENERATES, OVERCOMES, VEIN as VEIN_RULE, veinEnd } from '../../progress/realm.js';
import { NX, NY, CELL_DIRS } from './clay.js';
import { SpiritVein } from '../../vfx/garden/veins.js';
import { seeded } from '../../core/rng.js';
import { buildFeature } from '../../vfx/garden/features.js';

/** The five feelings' colours (the garden's tints for a feature placed with one: Calissa's to refine). */
export const FEELING_COLOR = { mirth: 0xffb35c, wonder: 0x7fd6a0, desire: 0xe0705a, grief: 0x9fb0d8, dread: 0x7a62b8 };
const NEAR = 1.75; // (two plots are neighbours within this many plot spacings)
const UP = new THREE.Vector3(0, 1, 0);

export class Plots {
  constructor(game, place, clays) {
    this.game = game; this.site = place; this.clays = clays; // (`site`: `place` is the verb)
    this.group = new THREE.Group(); this.group.name = 'garden-plots'; place.group.add(this.group);
    this.markMat = new THREE.MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.45, depthWrite: false, name: 'garden-plot' });
    this.markGeo = new THREE.RingGeometry(0.9, 1.15, 20).rotateX(-Math.PI / 2);
    this.threadMat = { gen: new THREE.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9, name: 'garden-thread' }), over: new THREE.LineBasicMaterial({ color: 0x5a2238, transparent: true, opacity: 0.9, name: 'garden-crack' }) };
    this.plots = [];
    for (const P of place.planets) {
      const n = PLOTS[P.id]?.plots || 0, fixed = place.features.filter((f) => f.planet === P).map((f) => f.pos.clone().sub(P.c).normalize());
      const r = seeded(P.id.split('').reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261));
      // a golden spiral over the sphere, keeping clear of what is fixed there and of the lotuses
      const lotus = place.lotuses.filter((l) => l.planet === P).map((l) => l.pos.clone().sub(P.c).normalize());
      const avoid = [...fixed, ...lotus], spacing = Math.sqrt((4 * Math.PI) / Math.max(1, n * 2.2));
      P.spacing = spacing;
      for (let k = 0, made = 0; made < n && k < n * 8; k++) {
        const y = 1 - (k + 0.5) / (n * 8) * 1.6, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = k * 2.39996 + r() * 0.3;
        const dir = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).normalize();
        if (avoid.some((a) => a.angleTo(dir) < spacing * 0.9) || this.plots.some((q) => q.planet === P && q.dir.angleTo(dir) < spacing)) continue;
        const pos = P.c.clone().addScaledVector(dir, P.radiusAt ? P.radiusAt(dir) : P.r);
        const mark = new THREE.Mesh(this.markGeo, this.markMat); mark.position.copy(pos).addScaledVector(dir, 0.06); mark.quaternion.setFromUnitVectors(UP, dir); mark.visible = false; this.group.add(mark);
        this.plots.push({ id: `${P.id}.${made}`, planet: P, i: made, dir, pos, mark, placed: null });
        clays[P.id]?.keep(dir, 2.5);
        made++;
      }
    }
    this.threads = new THREE.Group(); this.group.add(this.threads);
    this.wet = null;
    this.veins();
  }

  /** Where each spirit vein touching `planet` (or every vein) ends, worked out from the ground as it is now; the veins redrawn to them. */
  veins(planet = null) {
    const S = this.site; S.links ||= S.veins.map((V, i) => ({ V, a: S.by[S.LINKS[i][0]], b: S.by[S.LINKS[i][1]], ends: {} }));
    for (const L of S.links) {
      if (planet && L.a !== planet && L.b !== planet) continue;
      for (const [P, Q] of [[L.a, L.b], [L.b, L.a]]) L.ends[P.id] = this.veinEnd(P, Q);
      const A = L.a.c.clone().addScaledVector(L.ends[L.a.id], L.a.radiusAt(L.ends[L.a.id])), B = L.b.c.clone().addScaledVector(L.ends[L.b.id], L.b.radiusAt(L.ends[L.b.id]));
      const i = S.veins.indexOf(L.V), V = new SpiritVein(A, B); V.set({ k: L.V.u.uK.value }); V.u.uT.value = L.V.u.uT.value;
      const parent = L.V.mesh.parent || S.group; L.V.dispose(); parent.add(V.mesh); S.veins[i] = V; L.V = V;
    }
    if (planet) this.links();
  }
  /** The direction on P where its vein to Q ends: the highest ground within VEIN_RULE.cone degrees of the way to Q (progress/realm.js). */
  veinEnd(P, Q) {
    const clay = this.clays[P.id], to = Q.c.clone().sub(P.c).normalize(), cosC = Math.cos(VEIN_RULE.cone * Math.PI / 180), cells = [], ks = [];
    for (let k = 0; k < NX * NY; k++) {
      const dot = CELL_DIRS[k * 3] * to.x + CELL_DIRS[k * 3 + 1] * to.y + CELL_DIRS[k * 3 + 2] * to.z; if (dot < cosC) continue;
      cells.push({ height: clay ? clay.groundAt(k) : P.r, angle: Math.acos(Math.min(1, dot)) * 180 / Math.PI }); ks.push(k);
    }
    const i = veinEnd(cells); return i < 0 ? to : new THREE.Vector3().fromArray(CELL_DIRS, ks[i] * 3);
  }

  near(point, r = 2.2) {
    let best = null, bd = r;
    for (const p of this.plots) { const d = p.pos.distanceTo(point); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  show(on) { for (const p of this.plots) p.mark.visible = on && !p.placed; }
  onVein(p) { return (this.site.links || []).some((L) => { const e = L.ends[p.planet.id]; return e && p.planet.r * e.angleTo(p.dir) <= VEIN_RULE.reach; }); }
  neighbours(p) { return this.plots.filter((q) => q !== p && q.planet === p.planet && q.placed && q.dir.angleTo(p.dir) < p.planet.spacing * NEAR); }
  /** A feature's multiplier where it stands (progress/realm.js formation). */
  mult(p) { return p.placed ? formation(p.placed.feeling, this.neighbours(p).map((q) => q.placed.feeling), this.onVein(p), { ground: this.clays[p.planet.id]?.groundOf(p.dir) ?? null, water: this.wet?.(p) ?? null }) : 1; }

  /** A feature lifted by the hand set in another free plot (free: item 7), its formation worked out where it lands. */
  move(from, to) {
    if (!from?.placed || !to || to.placed) return false;
    to.placed = from.placed; from.placed = null;
    const G = from.group, look = from.look; from.group = null; from.look = null;
    to.group = G; to.look = look; this.settle(to); from.mark.visible = false;
    this.links();
    this.game.events?.emit('garden.move', { from: from.id, to: to.id, planetoid: to.planet.id, feature: to.placed.feature, mult: +this.mult(to).toFixed(2), vein: this.onVein(to), by: 'courier' });
    return true;
  }
  /** A feature back on its own plot (let go over nothing, or just moved there). */
  settle(p) {
    const G = p.group; if (!G) return;
    if (G.parent !== this.group) this.group.add(G);
    G.position.copy(p.pos); G.quaternion.setFromUnitVectors(UP, p.dir); p.mark.visible = false;
  }

  /** The hand places `feature` with `feeling` in a plot: paid in cubes and a material of the feeling's kind (from the Pneuka Box). */
  place(p, feature, feeling, { free = false } = {}) {
    const g = this.game;
    if (!p || p.placed || !FEATURES[feature] || !FEELING_COLOR[feeling]) return { ok: false, why: 'That cannot stand there.' };
    if (!free) {
      const cost = costOf(feature, feeling), box = g.pneuka, k = cost.material ? box?.slots.findIndex((x) => x?.id === `mat.${cost.material}`) : -1;
      if (cost.material && k < 0) return { ok: false, why: `It needs ${/^[aeiou]/.test(cost.material) ? 'an' : 'a'} ${cost.material} material from your Pneuka Box.` };
      if (cost.cubes > 0 && !g.cubes?.spend(cost.cubes, 'garden')) return { ok: false, why: `It costs ${cost.cubes} cubes.` };
      if (k >= 0) box.take(k);
    }
    p.placed = { feature, feeling };
    this.build(p);
    this.links();
    const mult = +this.mult(p).toFixed(2);
    if (!free) g.events?.emit('garden.place', { plot: p.id, planetoid: p.planet.id, feature, feeling, mult, vein: this.onVein(p), by: 'courier' });
    return { ok: true, mult };
  }

  /** A feature on its plot: Calissa's (vfx/garden/features.js), wearing its feeling's colour, lit and at work. */
  build(p) {
    const f = p.placed, F = buildFeature(f.feature, { feeling: f.feeling });
    F.group.position.copy(p.pos); F.group.quaternion.setFromUnitVectors(UP, p.dir); F.group.name = `feature-${f.feature}`;
    F.set?.({ lit: true, active: true });
    this.group.add(F.group); p.group = F.group; p.look = F; p.mark.visible = false;
  }
  update(raw) { for (const p of this.plots) p.look?.update?.(raw); }

  /** The threads between neighbours: bright where one generates the other, dark where one overcomes it. */
  links() {
    for (const o of [...this.threads.children]) { this.threads.remove(o); o.geometry.dispose(); }
    const seen = new Set();
    for (const p of this.plots) for (const q of this.neighbours(p)) {
      const key = [p.id, q.id].sort().join('|'); if (seen.has(key) || !p.placed) continue; seen.add(key);
      const a = p.placed.feeling, b = q.placed.feeling, kind = GENERATES[a] === b || GENERATES[b] === a ? 'gen' : OVERCOMES[a] === b || OVERCOMES[b] === a ? 'over' : null;
      if (!kind) continue;
      const P = p.planet, pts = [];
      for (let s = 0; s <= 12; s++) { const d = p.dir.clone().lerp(q.dir, s / 12).normalize(); pts.push(P.c.clone().addScaledVector(d, P.r + 0.35 + Math.sin((s / 12) * Math.PI) * 0.6)); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.threadMat[kind]); line.name = `thread-${kind}`; this.threads.add(line);
    }
  }

  /** What the garden has placed, for the visitors' wants (progress/realm.js wantsMet): features and feelings counted. */
  counts() {
    const out = { features: {}, feelings: {} };
    for (const p of this.plots) if (p.placed) { out.features[p.placed.feature] = (out.features[p.placed.feature] || 0) + 1; out.feelings[p.placed.feeling] = (out.feelings[p.placed.feeling] || 0) + 1; }
    return out;
  }
  dump() { return this.plots.filter((p) => p.placed).map((p) => ({ planet: p.planet.id, i: p.i, feature: p.placed.feature, feeling: p.placed.feeling })); }
  load(list = []) {
    for (const e of list || []) { const p = this.plots.find((q) => q.planet.id === e.planet && q.i === e.i); if (p && !p.placed) { p.placed = { feature: e.feature, feeling: e.feeling }; this.build(p); } }
    this.links();
  }
}
