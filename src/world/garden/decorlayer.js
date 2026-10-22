// ---------------------------------------------------------------------------------------
// THE DECOR LAYER: garden pieces placed in the Spirit Garden by the god hand (docs/plans/GARDEN-COZY.md D1, D2, D7; built by Dovina for
// Petra on the owner's ask of 2026-10-22, to her conditions). PLACE (9) with R turned to decor: the left button sets the piece held on
// the half-cell under the hand (a ghost shows it, gold where it may stand, red where it may not), picks up a placed piece to move it,
// or, with nothing held and nothing under the hand, opens the shed's catalogue (what waits in storage, and what may be bought); the
// wheel turns the piece held a step (15 degrees); the right button puts the piece under the hand back in storage, or lets go of the one
// held; Ctrl+Z takes back the last of these. The layout and storage are one section (progress/decor.js: a piece is either placed or
// stored, never both); the grid is world/garden/decorgrid.js; the rating is reported as `garden.rating` after every change. Each piece
// holds the clay under it still (clay.keep, as a feature does), and a medium piece or larger keeps the Pneuka Jar and the spirits out
// (keepOut). Drawn in one BatchedMesh on one material (one draw call, one program, made before the realm's warm-up compile), casting
// no shadow. THE LOOK IS A PLACEHOLDER, one shape a size in its set's colour, until Calissa builds the pieces.
//
// Prior art: Animal Crossing: New Horizons' decorating (half-tile steps, a piece picked up kept whole, the catalogue), Unpacking's
// placement (a ghost and a sound on each snap), Townscaper's grid on a curved world, Black & White's hand as the only cursor, three.js's
// BatchedMesh (many geometries, one draw), as render/propbatch.js uses it.
//
//   const L = new DecorLayer(realm)  (game.decorLayer)   L.on   L.toggle()   L.handle(dt, hand)   L.update()   L.redraw()   L.report()
//   L.undo()   L.keepOut(planet, pos, radius) -> push (Vector3) | null   L.mat (shared with the thorns: one program)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { DECOR, SETS, priceOf, rating } from '../../progress/decor.js';
import { seasonOf } from '../../progress/seasons.js';
import { DECOR_GRID, cellsOf, cellAt, dirAt, tangentAt, regionOf, regionCells } from './decorgrid.js';

/** A piece's footprint (metres round its point) by size; how near a site's fixed thing (the gate, the shed, a bed, the press) or a plot
 *  a piece may stand; how near the hand must come to pick one; the sizes that keep the Jar and the spirits out (the small are walked
 *  over); the batch's first capacity (it grows as pieces are placed). */
export const FOOT = { small: 0.45, medium: 0.95, large: 1.45, centre: 1.95, fixed: 2.2, plot: 1.6, pick: 1.2, solid: ['medium', 'large', 'centre'], cap: 32 };
/** Each set's placeholder colour (the looks are Calissa's): the five feelings' sets in their feelings' warmth, the plain in stone. */
export const SET_COLOR = { plain: 0xa89a86, wonder: 0x7fa86a, mirth: 0xd8794e, desire: 0xc9a356, grief: 0x7f93ad, dread: 0x5b8f8c, sound: 0xc8a050, season: 0xe0a2b4, briar: 0x5d5a32 };
export const TINT = [1, 0.8, 1.2, 0.62]; // (a piece's four tints: as it is, darker, paler, deep)
const UNDO = 50; // (decor's undo stack, Petra's depth: GARDEN-COZY.md D2)
const SIZES = ['small', 'medium', 'large', 'centre'];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _push = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);

/** Geometry the batch can hold together: unindexed, position and normal only. */
const plain = (g) => { const q = g.index ? g.toNonIndexed() : g, o = new THREE.BufferGeometry(); o.setAttribute('position', q.attributes.position); o.setAttribute('normal', q.attributes.normal); return o; };
export const mergeParts = (parts) => { const pos = [], nor = []; for (const p of parts.map(plain)) { pos.push(...p.attributes.position.array); nor.push(...p.attributes.normal.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; };
/** The placeholder shapes, one a size: a stone, a block, a tall cone on a stem, a pavilion. */
export function decorShapes() {
  return {
    small: mergeParts([new THREE.CylinderGeometry(0.32, 0.42, 0.5, 7).translate(0, 0.25, 0)]),
    medium: mergeParts([new THREE.BoxGeometry(1.4, 0.7, 1.4).translate(0, 0.35, 0), new THREE.BoxGeometry(0.9, 0.35, 0.9).translate(0, 0.88, 0)]),
    large: mergeParts([new THREE.CylinderGeometry(0.16, 0.22, 1.2, 6).translate(0, 0.6, 0), new THREE.ConeGeometry(1.3, 2.2, 7).translate(0, 2.1, 0)]),
    centre: mergeParts([new THREE.BoxGeometry(3.4, 0.3, 3.4).translate(0, 0.15, 0), ...[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z]) => new THREE.CylinderGeometry(0.12, 0.12, 2, 6).translate(x, 1.3, z)), new THREE.ConeGeometry(2.7, 1.2, 4).rotateY(Math.PI / 4).translate(0, 2.9, 0)]),
  };
}

export class DecorLayer {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.on = false; this.held = null; this.blocked = false; this.at = null; this.last = null; this.undos = []; this.spots = [];
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, name: 'garden-decor' });
    this.shapes = decorShapes(); this.cap = FOOT.cap;
    this.batch = this.makeBatch(this.cap); realm.site.group.add(this.batch);
    this.baseKept = {}; // (each clay's own keeps, before any piece's: features and lotuses, kept at build)
    for (const [id, c] of Object.entries(realm.clays || {})) this.baseKept[id] = c.kept.slice();
    const E = this.game.events;
    for (const n of ['garden.sculpt', 'garden.undo', 'garden.reset']) E?.on(n, () => this.redraw()); // (a planetoid reshaped: its pieces stand on the new ground)
    this.redraw(); this.keepAll(); this.report(true);
  }
  get decor() { return this.game.decor; }
  planet(id) { return this.R.site.by?.[id] || this.R.site.planets.find((P) => P.id === id); }
  N(P) { return cellsOf(P.r); }
  /** The batch: the four shapes, its instances (one a piece, and the ghost's), one draw. */
  makeBatch(cap) {
    const verts = SIZES.reduce((n, k) => n + this.shapes[k].attributes.position.count, 0);
    const B = new THREE.BatchedMesh(cap + 1, verts, 0, this.mat); B.name = 'garden-decor'; B.frustumCulled = false; B.castShadow = false; B.receiveShadow = true;
    this.geoId = Object.fromEntries(SIZES.map((k) => [k, B.addGeometry(this.shapes[k])]));
    this.ghostId = B.addInstance(this.geoId.small); B.setColorAt(this.ghostId, _c.set(0xffd36a)); B.setVisibleAt(this.ghostId, false);
    this.ids = []; return B;
  }
  /** Room for `n` pieces: the batch grows (doubling) when full. */
  room(n) {
    if (n <= this.cap) return;
    while (this.cap < n) this.cap *= 2;
    this.R.site.group.remove(this.batch); this.batch.dispose(); this.batch = this.makeBatch(this.cap); this.R.site.group.add(this.batch);
  }
  /** Where a placed piece stands: its matrix on the ground as shaped. */
  frame(P, face, iu, iv, yaw, out = new THREE.Matrix4()) {
    const N = this.N(P), d = dirAt(face, iu, iv, N), t = tangentAt(face, iu, iv, N);
    _n.fromArray(d); _t.fromArray(t); _b.crossVectors(_t, _n);
    const r = P.radiusAt ? P.radiusAt(_n) : P.r;
    _m.makeBasis(_b, _n, _t); _q.setFromRotationMatrix(_m).multiply(new THREE.Quaternion().setFromAxisAngle(_Y, (yaw * 2 * Math.PI) / DECOR_GRID.yaw));
    _p.copy(P.c).addScaledVector(_n, r - 0.05);
    return out.compose(_p, _q, _s);
  }
  /** Every placed piece drawn again, and where each stands kept (after a load, a placing, a move, a removal, a reshaping). */
  redraw() {
    const placed = this.decor?.s?.placed || [];
    this.room(placed.length); this.spots = []; const B = this.batch;
    placed.forEach((p, i) => {
      const D = DECOR[p[0]], P = this.planet(p[1]); if (!D || !P) return;
      if (this.ids[i] == null) this.ids[i] = B.addInstance(this.geoId[D.size]); else B.setGeometryIdAt(this.ids[i], this.geoId[D.size]);
      const m = this.frame(P, p[2], p[3], p[4], p[5]);
      B.setMatrixAt(this.ids[i], m); B.setColorAt(this.ids[i], _c.set(D.color ?? SET_COLOR[D.set] ?? 0xffffff).multiplyScalar(TINT[p[6] || 0] || 1)); B.setVisibleAt(this.ids[i], true);
      const N = this.N(P);
      this.spots.push({ i, id: p[0], planet: P, size: D.size, pos: new THREE.Vector3().setFromMatrixPosition(m), dir: new THREE.Vector3().fromArray(dirAt(p[2], p[3], p[4], N)), region: `${p[1]}|${regionOf(p[2], p[3], p[4], N)}`, N });
    });
    for (let i = placed.length; i < this.ids.length; i++) if (this.ids[i] != null) B.setVisibleAt(this.ids[i], false);
  }
  /** The clay under every piece held still, planetoid by planetoid: its own keeps and the pieces' (clay.keep works the cells out). */
  keepAll(only = null) {
    for (const [id, c] of Object.entries(this.R.clays || {})) {
      if (only && id !== only) continue;
      const base = (this.baseKept[id] ||= c.kept.slice()), all = base.concat(this.spots.filter((s) => s.planet.id === id).map((s) => ({ d: s.dir.clone(), r: FOOT[s.size] + 0.5 })));
      if (!all.length) { c.kept = []; c.hold?.fill(1); continue; }
      const last = all.pop(); c.kept = all; c.keep(last.d, last.r);
    }
  }
  /** The rating said when it changes (the lake lotuses, the sets, the ledger: feedback/tracking/garden.js). */
  report(quiet = false) {
    const Ns = Object.fromEntries(this.spots.map((x) => [x.region, x.N]));
    const r = rating(this.spots.map((x) => ({ id: x.id, planet: x.planet.id, region: x.region, pos: x.pos.toArray() })), { cellsOf: (k) => regionCells(Ns[k] || 16) });
    const key = `${r.points}|${r.sets.join(',')}`; if (key === this.last) return r; this.last = key;
    if (!quiet) this.game.events?.emit('garden.rating', { points: r.points, lotuses: r.lotuses, sets: r.sets, by: 'courier' });
    return r;
  }
  /** A change made: drawn, the clay held, the rating said. */
  changed(planetoid) { this.redraw(); this.keepAll(planetoid); this.report(); }
  /** D7: the push that keeps a body (the Pneuka Jar, a spirit) out of the medium and larger pieces on its planetoid, or null. */
  keepOut(P, pos, radius = 0.4) {
    if (!P || !this.spots.length) return null;
    _push.set(0, 0, 0);
    for (const s of this.spots) {
      if (s.planet !== P || !FOOT.solid.includes(s.size)) continue;
      const reach = FOOT[s.size] + radius, up = _n.copy(pos).sub(P.c).normalize(); _b.copy(pos).sub(s.pos); _b.addScaledVector(up, -_b.dot(up));
      const d = _b.length(); if (d < reach) _push.addScaledVector(d > 1e-4 ? _b.divideScalar(d) : _t.set(1, 0, 0).cross(up).normalize(), reach - d);
    }
    return _push.lengthSq() > 0 ? _push : null;
  }
  /** R in PLACE: plots or decor. */
  toggle() {
    this.on = !this.on; this.held = null; this.ghost(false); this.R.plots?.show(!this.on);
    this.game.events?.emit('garden.art', { art: 'place', mode: this.on ? 'decor' : 'plots', by: 'courier' });
  }
  ghost(show, size, m, blocked) {
    const B = this.batch; if (!show) { B.setVisibleAt(this.ghostId, false); return; }
    B.setGeometryIdAt(this.ghostId, this.geoId[size]); B.setMatrixAt(this.ghostId, m.multiply(_m.makeScale(1.04, 1.04, 1.04)));
    B.setColorAt(this.ghostId, _c.set(blocked ? 0xd04040 : 0xffd36a)); B.setVisibleAt(this.ghostId, true);
  }
  /** The placed piece nearest a ground point, within reach, as its index in the layout (or -1). */
  near(point) {
    let best = -1, bd = FOOT.pick;
    for (const s of this.spots) { const d = point.distanceTo(s.pos) - FOOT[s.size] * 0.5; if (d < bd) { bd = d; best = s.i; } }
    return best;
  }
  /** May a piece of this size stand at this point? Not over another piece, a site's fixed thing or a plot. */
  free(P, point, size, skip = -1) {
    const f = FOOT[size];
    for (const F of this.R.site.features) if (F.planet === P && F.pos.distanceTo(point) < f + FOOT.fixed) return false;
    for (const L of this.R.site.lotuses) if (L.planet === P && L.pos.distanceTo(point) < f + FOOT.fixed) return false;
    for (const p of this.R.plots?.plots || []) if (p.planet === P && p.pos && p.pos.distanceTo(point) < f + FOOT.plot) return false;
    return !this.spots.some((s) => s.i !== skip && s.planet === P && point.distanceTo(s.pos) < f + FOOT[s.size]);
  }
  /** The hand in PLACE with decor turned on (world/garden/hand.js calls it each frame). */
  handle(dt, hand) {
    const I = this.game.input, hit = hand.hit;
    if (this.held && I.wheel) { this.held.yaw = (this.held.yaw + Math.sign(I.wheel) + DECOR_GRID.yaw) % DECOR_GRID.yaw; I.wheel = 0; sfx.click?.(); }
    this.at = null;
    if (hit) { const P = hit.planet, c = cellAt(_n.copy(hit.point).sub(P.c).normalize().toArray(), this.N(P)); this.at = { planetoid: P.id, P, ...c }; }
    if (this.held && this.at) {
      const D = DECOR[this.held.id], m = this.frame(this.at.P, this.at.face, this.at.iu, this.at.iv, this.held.yaw);
      this.blocked = !this.free(this.at.P, _p.setFromMatrixPosition(m), D.size, this.held.from ?? -1);
      this.ghost(true, D.size, m, this.blocked);
      const key = `${this.at.face}.${this.at.iu}.${this.at.iv}`; if (key !== this.snapKey) { this.snapKey = key; sfx.click?.(); } // (a sound on each snap: Unpacking's)
    } else this.ghost(false);
    if (I.wasPressed('Mouse2')) { if (this.held) { this.held = null; return; } if (hit) { const i = this.near(hit.point); if (i >= 0) { const p = this.decor.s.placed[i]; this.push({ op: 'remove', p: p.slice() }); this.decor.remove(i); this.changed(p[1]); sfx.toss?.(); } } return; }
    if (!I.wasPressed('Mouse0')) return;
    if (this.held) {
      if (!this.at || this.blocked) { this.game.log?.say('warn', 'Something is in the way.', { key: 'decor.blocked', throttle: 1 }); return; }
      const at = { planetoid: this.at.planetoid, face: this.at.face, iu: this.at.iu, iv: this.at.iv };
      if (this.held.from != null) { const p = this.decor.s.placed[this.held.from], was = { planetoid: p[1], face: p[2], iu: p[3], iv: p[4] }; this.push({ op: 'move', id: p[0], now: { ...at }, was, yaw: p[5] }); this.decor.move(this.held.from, at, this.held.yaw); this.held = null; if (was.planetoid !== at.planetoid) this.keepAll(was.planetoid); }
      else { const i = this.decor.place(this.held.id, at, { yaw: this.held.yaw, tint: this.held.tint }); if (i >= 0) this.push({ op: 'place', id: this.held.id, now: { ...at } }); if (!this.decor.stored(this.held.id)) this.held = null; } // (more of it in storage: keep placing, Animal Crossing's)
      sfx.grab?.(); this.changed(at.planetoid); return;
    }
    const i = hit ? this.near(hit.point) : -1;
    if (i >= 0) { const p = this.decor.s.placed[i]; this.held = { id: p[0], yaw: p[5], tint: p[6], from: i }; sfx.grab?.(); return; }
    this.catalogue();
  }
  push(u) { this.undos.push(u); if (this.undos.length > UNDO) this.undos.shift(); }
  /** Ctrl+Z in decor: the last placing, move or putting back taken back, found by what and where (a removal shifts indexes). */
  undo() {
    const U = this.undos.pop(), D = this.decor; if (!U || !D) return false;
    const find = (id, a) => D.s.placed.findIndex((q) => q[0] === id && q[1] === a.planetoid && q[2] === a.face && q[3] === a.iu && q[4] === a.iv);
    if (U.op === 'place') { const i = find(U.id, U.now); if (i >= 0) D.remove(i); }
    else if (U.op === 'move') { const i = find(U.id, U.now); if (i >= 0) D.move(i, U.was, U.yaw); }
    else if (U.op === 'remove') { const [id, planetoid, face, iu, iv, yaw, tint] = U.p; D.place(id, { planetoid, face, iu, iv }, { yaw, tint }); }
    this.held = null; this.redraw(); this.keepAll(); this.report(); return true;
  }
  /** The shed's catalogue: what waits in storage (to place), what may be bought (its price). */
  catalogue() {
    const g = this.game, menu = g.indexMenu || g.course?.menu; if (!menu?.showPage || !this.decor) return;
    const season = seasonOf().id, open = this.decor.catalogue(season);
    menu.showPage('garden.decor', (im, el) => {
      const stored = Object.keys(DECOR).filter((id) => this.decor.stored(id) > 0);
      im.appendChild(el('div', 'grp', 'IN THE SHED'));
      const a = el('div', 'rooms');
      if (!stored.length) a.appendChild(el('div', 'room', '<span class="n">·</span><span><s>Nothing waits in the shed. Buy a piece below.</s></span>'));
      for (const id of stored) {
        const D = DECOR[id], d = el('div', 'room', `<span class="n">◇</span><span><b>${D.name}</b><s>${SETS[D.set]?.name} · ${D.size} · ${this.decor.stored(id)} in the shed</s></span>`), tints = el('span', 'feel');
        for (let t = 0; t < (D.tints || 1); t++) { const b = el('span', '', '◆'); b.style.cssText = `color:#${_c.set(D.color ?? SET_COLOR[D.set]).multiplyScalar(TINT[t]).getHexString()};margin-right:.8em;cursor:pointer`; b.title = `tint ${t + 1}`; b.onclick = (e) => { e.stopPropagation(); this.held = { id, yaw: 0, tint: t, from: null }; menu.close(); }; tints.appendChild(b); }
        d.onclick = () => { this.held = { id, yaw: 0, tint: 0, from: null }; menu.close(); };
        d.lastChild.appendChild(tints); a.appendChild(d);
      }
      im.appendChild(a);
      im.appendChild(el('div', 'grp', 'THE CATALOGUE'));
      const b = el('div', 'rooms'), cubes = g.cubes?.balance ?? Infinity;
      for (const id of open) {
        const D = DECOR[id], c = priceOf(id), d = el('div', 'room', `<span class="n">${cubes >= c ? '◆' : '◇'}</span><span><b>${D.name}</b><s>${SETS[D.set]?.name} · ${D.size} · ${c} cubes</s></span>`);
        d.style.opacity = cubes >= c ? 1 : 0.4; // (what you cannot afford is shown dim, never hidden)
        d.onclick = () => { const r = this.decor.buy(id, { season }); menu.close(); if (r.ok) this.held = { id, yaw: 0, tint: 0, from: null }; };
        b.appendChild(d);
      }
      im.appendChild(b);
    }, { title: 'DECORATE', sub: 'click a piece to hold it · the wheel turns it · right button puts it back · Ctrl+Z undoes · F closes' });
  }
  update() { if (this.held && this.R.hand?.art !== 'place') { this.held = null; this.ghost(false); } }
}
