// ---------------------------------------------------------------------------------------
// THE PLOTS: where the god hand places a feature on a planetoid, and how the features strengthen and weaken one another
// (docs/plans/SPIRIT-GARDEN.md section 4; the numbers are Dovina's, progress/realm.js: each planetoid's plots, the eight FEATURES and
// their costs, the formation on Wu Xing's two cycles). A planetoid's plots are spread over it evenly (a golden spiral), away from what is
// fixed there. A feature is placed with a feeling, for cubes and one material of that feeling's kind; neighbours that GENERATE it
// strengthen it, those that OVERCOME it weaken it, and a spirit vein under its plot doubles the lot. The pull between two neighbours is
// shown, not written: a bright thread for one that feeds the other, a dark crack for one that checks it (marks in the world are not text);
// the log has the number (garden.place carries `mult`). The features are Calissa's (vfx/garden/features.js).
//
// Prior art: Dark Cloud 2's Georama (a place built piece by piece), feng shui and the Wu Xing cycles (generating and overcoming), the
// xianxia formation array (stones that empower their neighbours), and Animal Crossing's plots marked where a house may stand.
//
//   const T = new Plots(game, place, clays)   T.plots [{ id, planet, i, dir, pos, placed }]   T.near(point, r) -> plot   T.place(plot, feature, feeling)
//   T.show(on)   T.mult(plot) -> n   T.dump() -> [{ planet, i, feature, feeling }]   T.load(list)   T.counts() -> { features, feelings }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PLANETOIDS as PLOTS, FEATURES, costOf, formation, GENERATES, OVERCOMES } from '../../progress/realm.js';
import { seeded } from '../../core/rng.js';
import { buildFeature } from '../../vfx/garden/features.js';

/** The five feelings' colours (the garden's tints for a feature placed with one: Calissa's to refine). */
export const FEELING_COLOR = { mirth: 0xffb35c, wonder: 0x7fd6a0, desire: 0xe0705a, grief: 0x9fb0d8, dread: 0x7a62b8 };
const NEAR = 1.75; // (two plots are neighbours within this many plot spacings)
const VEIN = 8 * (Math.PI / 180); // (a plot within 8 degrees of a planetoid's vein sits on it)
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
      // the planetoid's spirit vein: a great circle through two seeded directions (sculpting will bend it: later)
      const a = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), b = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      P.vein = a.clone().cross(b).normalize(); // (the circle's axis)
    }
    this.threads = new THREE.Group(); this.group.add(this.threads);
  }

  near(point, r = 2.2) {
    let best = null, bd = r;
    for (const p of this.plots) { const d = p.pos.distanceTo(point); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  show(on) { for (const p of this.plots) p.mark.visible = on && !p.placed; }
  onVein(p) { return Math.abs(p.dir.dot(p.planet.vein)) < Math.sin(VEIN); }
  neighbours(p) { return this.plots.filter((q) => q !== p && q.planet === p.planet && q.placed && q.dir.angleTo(p.dir) < p.planet.spacing * NEAR); }
  /** A feature's multiplier where it stands (progress/realm.js formation). */
  mult(p) { return p.placed ? formation(p.placed.feeling, this.neighbours(p).map((q) => q.placed.feeling), this.onVein(p)) : 1; }

  /** The hand places `feature` with `feeling` in a plot: paid in cubes and a material of the feeling's kind (from the Pneuka Box). */
  place(p, feature, feeling, { free = false } = {}) {
    const g = this.game;
    if (!p || p.placed || !FEATURES[feature] || !FEELING_COLOR[feeling]) return { ok: false, why: 'That cannot stand there.' };
    if (!free) {
      const cost = costOf(feature, feeling), box = g.pneuka, k = cost.material ? box?.slots.findIndex((x) => x?.id === `mat.${cost.material}`) : -1;
      if (cost.material && k < 0) return { ok: false, why: `It wants ${/^[aeiou]/.test(cost.material) ? 'an' : 'a'} ${cost.material} material from your box.` };
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
