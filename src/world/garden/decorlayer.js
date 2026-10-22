// ---------------------------------------------------------------------------------------
// THE DECOR LAYER: garden pieces placed in the Spirit Garden by the god hand (docs/plans/GARDEN-COZY.md D1, D2; built by Dovina for
// Petra, the owner's ask of 2026-10-22). PLACE (9) with R turned to decor: the left button sets the piece held on the half-cell under
// the hand (a ghost shows it, gold where it may stand, red where it may not), picks up a placed piece to move it, or, with nothing held
// and nothing under the hand, opens the shed's catalogue (what waits in storage, and what may be bought); the wheel turns the piece
// held a step (15 degrees); the right button puts the piece under the hand back in storage, or lets go of the one held. The layout and
// storage are one section (progress/decor.js); the grid is world/garden/decorgrid.js; the rating is reported as `garden.rating` after
// every change. The pieces are placeholders, one shape a size in its set's colour, drawn as instances of one material (one program,
// warmed with the garden); their looks are Calissa's.
//
// Prior art: Animal Crossing: New Horizons' decorating (half-tile steps, a piece picked up kept whole, the catalogue), Unpacking's
// placement (a ghost and a sound on each snap), Townscaper's grid on a curved world, Black & White's hand as the only cursor.
//
//   const L = new DecorLayer(realm)   L.on   L.toggle()   L.handle(dt, hand)   L.update(dt)   L.reseat(planetoid?)   L.report()   L.undo() (Ctrl+Z in decor)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { DECOR, SETS, priceOf, rating } from '../../progress/decor.js';
import { seasonOf } from '../../progress/seasons.js';
import { DECOR_GRID, cellsOf, cellAt, dirAt, tangentAt, regionOf, regionCells } from './decorgrid.js';

/** A piece's footprint (metres round its point, for what it blocks) by size; how near a site's fixed thing (the gate, the shed, a bed,
 *  the press) or a plot a piece may stand. */
export const FOOT = { small: 0.45, medium: 0.95, large: 1.45, centre: 1.95, fixed: 2.2, plot: 1.6, pick: 1.2, cap: 32 };
/** Each set's placeholder colour (the looks are Calissa's): the five feelings' sets in their feelings' warmth, the plain in stone. */
const SET_COLOR = { plain: 0xa89a86, wonder: 0x7fa86a, mirth: 0xd8794e, desire: 0xc9a356, grief: 0x7f93ad, dread: 0x5b8f8c, sound: 0xc8a050, season: 0xe0a2b4, briar: 0x5d5a32 };
const TINT = [1, 0.8, 1.2, 0.62]; // (a piece's four tints: as it is, darker, paler, deep)
const UNDO = 50; // (decor's undo stack, Petra's depth: GARDEN-COZY.md D2)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();

/** The placeholder shapes, one a size: a stone, a block, a tall tree-like cone on a stem, a pavilion. */
function shapes() {
  const merge = (parts) => { const g = new THREE.BufferGeometry(), pos = [], nor = []; for (const p of parts) { const q = p.index ? p.toNonIndexed() : p; pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); } g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; };
  return {
    small: new THREE.CylinderGeometry(0.32, 0.42, 0.5, 7).translate(0, 0.25, 0),
    medium: merge([new THREE.BoxGeometry(1.4, 0.7, 1.4).translate(0, 0.35, 0), new THREE.BoxGeometry(0.9, 0.35, 0.9).translate(0, 0.88, 0)]),
    large: merge([new THREE.CylinderGeometry(0.16, 0.22, 1.2, 6).translate(0, 0.6, 0), new THREE.ConeGeometry(1.3, 2.2, 7).translate(0, 2.1, 0)]),
    centre: merge([new THREE.BoxGeometry(3.4, 0.3, 3.4).translate(0, 0.15, 0), ...[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z]) => new THREE.CylinderGeometry(0.12, 0.12, 2, 6).translate(x, 1.3, z)), new THREE.ConeGeometry(2.7, 1.2, 4).rotateY(Math.PI / 4).translate(0, 2.9, 0)]),
  };
}

export class DecorLayer {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.on = false; this.held = null; this.blocked = false; this.at = null; this.last = null; this.undos = [];
    this.mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, name: 'garden-decor' });
    this.geo = shapes(); this.meshes = {}; this.group = new THREE.Group(); this.group.name = 'garden-decor'; realm.site.group.add(this.group);
    for (const size of Object.keys(this.geo)) this.mesh(size, FOOT.cap); // (all four built at once: warmed with the garden, no program met first in play)
    this.ghost = new THREE.InstancedMesh(this.geo.small, this.mat, 1); this.ghost.name = 'garden-decor-ghost'; this.ghost.visible = false; this.ghost.frustumCulled = false; this.ghost.setColorAt(0, _c.set(0xffd36a)); this.group.add(this.ghost);
    const E = this.game.events;
    E?.on('garden.sculpt', (e) => this.reseat(e.planetoid)); E?.on('garden.undo', (e) => this.reseat(e.planetoid)); E?.on('garden.reset', (e) => this.reseat(e.planetoid));
    this.redraw(); this.report(true);
  }
  get decor() { return this.game.decor; }
  planet(id) { return this.R.site.by?.[id] || this.R.site.planets.find((P) => P.id === id); }
  N(P) { return cellsOf(P.r); }
  /** One instanced mesh a size, grown when full. */
  mesh(size, need) {
    const M = this.meshes[size];
    if (M && M.instanceMatrix.count >= need) return M;
    const cap = Math.max(FOOT.cap, need * 2), I = new THREE.InstancedMesh(this.geo[size], this.mat, cap);
    I.name = `garden-decor-${size}`; I.count = 0; I.castShadow = false; I.frustumCulled = false; I.setColorAt(0, _c.set(0xffffff));
    if (M) { this.group.remove(M); M.dispose(); }
    this.meshes[size] = I; this.group.add(I); return I;
  }
  /** Where a placed piece stands: its matrix on the ground as shaped. */
  frame(P, face, iu, iv, yaw, out = _m) {
    const N = this.N(P), d = dirAt(face, iu, iv, N), t = tangentAt(face, iu, iv, N);
    _n.fromArray(d); _t.fromArray(t); _b.crossVectors(_t, _n);
    const r = P.radiusAt ? P.radiusAt(_n) : P.r;
    _m.makeBasis(_b, _n, _t); _q.setFromRotationMatrix(_m).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (yaw * 2 * Math.PI) / DECOR_GRID.yaw));
    _p.copy(P.c).addScaledVector(_n, r - 0.05);
    return out.compose(_p, _q, _s);
  }
  /** Every placed piece drawn again (after a load, a placing, a move, a removal). */
  redraw() {
    const placed = this.decor?.s?.placed || [], by = { small: [], medium: [], large: [], centre: [] };
    for (const p of placed) { const D = DECOR[p[0]], P = this.planet(p[1]); if (D && P) by[D.size].push(p); }
    for (const [size, list] of Object.entries(by)) {
      const M = this.mesh(size, list.length); M.count = list.length;
      list.forEach((p, i) => { const P = this.planet(p[1]); M.setMatrixAt(i, this.frame(P, p[2], p[3], p[4], p[5], new THREE.Matrix4())); M.setColorAt(i, _c.set(SET_COLOR[DECOR[p[0]].set] || 0xffffff).multiplyScalar(TINT[p[6] || 0] || 1)); });
      M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
    }
  }
  /** A planetoid reshaped: its pieces stand on the new ground. */
  reseat() { this.redraw(); }
  /** The pieces as the rating reads them (progress/decor.js rating). */
  pieces() {
    return (this.decor?.s?.placed || []).map((p) => { const P = this.planet(p[1]); if (!P) return null; const N = this.N(P), d = dirAt(p[2], p[3], p[4], N), r = P.radiusAt ? P.radiusAt(_n.fromArray(d)) : P.r;
      return { id: p[0], planet: p[1], region: `${p[1]}|${regionOf(p[2], p[3], p[4], N)}`, pos: [P.c.x + d[0] * r, P.c.y + d[1] * r, P.c.z + d[2] * r], N }; }).filter(Boolean);
  }
  /** The rating said when it changes (the lake lotuses, the sets, the ledger: feedback/tracking/garden.js). */
  report(quiet = false) {
    const list = this.pieces(), Ns = Object.fromEntries(list.map((x) => [x.region, x.N]));
    const r = rating(list, { cellsOf: (k) => regionCells(Ns[k] || 16) });
    const key = `${r.points}|${r.sets.join(',')}`; if (key === this.last) return r; this.last = key;
    if (!quiet) this.game.events?.emit('garden.rating', { points: r.points, lotuses: r.lotuses, sets: r.sets, by: 'courier' });
    return r;
  }
  /** R in PLACE: plots or decor. */
  toggle() {
    this.on = !this.on; this.held = null; this.ghost.visible = false; this.R.plots?.show(!this.on);
    this.game.events?.emit('garden.art', { art: 'place', mode: this.on ? 'decor' : 'plots', by: 'courier' });
  }
  /** The placed piece nearest a ground point, within reach. */
  near(point) {
    let best = -1, bd = FOOT.pick;
    (this.decor?.s?.placed || []).forEach((p, i) => { const P = this.planet(p[1]); if (!P) return; const N = this.N(P), d = dirAt(p[2], p[3], p[4], N), r = P.radiusAt ? P.radiusAt(_n.fromArray(d)) : P.r;
      const dd = point.distanceTo(_p.set(P.c.x + d[0] * r, P.c.y + d[1] * r, P.c.z + d[2] * r)) - FOOT[DECOR[p[0]]?.size || 'small'] * 0.5; if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  /** May a piece of this size stand at this point? Not over another piece, a site's fixed thing or a plot. */
  free(P, point, size, skip = -1) {
    const f = FOOT[size];
    for (const F of this.R.site.features) if (F.planet === P && F.pos.distanceTo(point) < f + FOOT.fixed) return false;
    for (const L of this.R.site.lotuses) if (L.planet === P && L.pos.distanceTo(point) < f + FOOT.fixed) return false;
    for (const p of this.R.plots?.plots || []) if (p.planet === P && p.pos && p.pos.distanceTo(point) < f + FOOT.plot) return false;
    let ok = true;
    (this.decor?.s?.placed || []).forEach((q, i) => { if (!ok || i === skip || q[1] !== P.id) return; const N = this.N(P), d = dirAt(q[2], q[3], q[4], N), r = P.radiusAt ? P.radiusAt(_n.fromArray(d)) : P.r;
      if (point.distanceTo(_b.set(P.c.x + d[0] * r, P.c.y + d[1] * r, P.c.z + d[2] * r)) < f + FOOT[DECOR[q[0]]?.size || 'small']) ok = false; });
    return ok;
  }
  /** The hand in PLACE with decor turned on (world/garden/hand.js calls it each frame). */
  handle(dt, hand) {
    const I = this.game.input, hit = hand.hit;
    if (this.held && I.wheel) { this.held.yaw = (this.held.yaw + Math.sign(I.wheel) + DECOR_GRID.yaw) % DECOR_GRID.yaw; I.wheel = 0; sfx.click?.(); }
    this.at = null;
    if (hit) { const P = hit.planet, N = this.N(P), c = cellAt(_n.copy(hit.point).sub(P.c).normalize().toArray(), N); this.at = { planetoid: P.id, P, ...c }; }
    if (this.held && this.at) {
      const D = DECOR[this.held.id], m = this.frame(this.at.P, this.at.face, this.at.iu, this.at.iv, this.held.yaw, new THREE.Matrix4());
      _p.setFromMatrixPosition(m); this.blocked = !this.free(this.at.P, _p, D.size, this.held.from ?? -1);
      if (this.ghost.geometry !== this.geo[D.size]) this.ghost.geometry = this.geo[D.size];
      this.ghost.setMatrixAt(0, m.multiply(new THREE.Matrix4().makeScale(1.04, 1.04, 1.04))); this.ghost.instanceMatrix.needsUpdate = true;
      this.ghost.setColorAt(0, _c.set(this.blocked ? 0xd04040 : 0xffd36a)); this.ghost.instanceColor.needsUpdate = true; this.ghost.visible = true;
      const key = `${this.at.face}.${this.at.iu}.${this.at.iv}`; if (key !== this.snapKey) { this.snapKey = key; sfx.click?.(); } // (a sound on each snap: Unpacking's)
    } else this.ghost.visible = false;
    if (I.wasPressed('Mouse2')) { if (this.held) { this.held = null; return; } if (hit) { const i = this.near(hit.point); if (i >= 0) { this.push({ op: 'remove', p: this.decor.s.placed[i].slice() }); this.decor.remove(i); this.redraw(); this.report(); sfx.toss?.(); } } return; }
    if (!I.wasPressed('Mouse0')) return;
    if (this.held) {
      if (!this.at || this.blocked) { this.game.log?.say('warn', 'Something is in the way.', { key: 'decor.blocked', throttle: 1 }); return; }
      const at = { planetoid: this.at.planetoid, face: this.at.face, iu: this.at.iu, iv: this.at.iv };
      if (this.held.from != null) { const p = this.decor.s.placed[this.held.from]; this.push({ op: 'move', id: p[0], now: { ...at }, was: { planetoid: p[1], face: p[2], iu: p[3], iv: p[4] }, yaw: p[5] }); this.decor.move(this.held.from, at, this.held.yaw); this.held = null; }
      else { const i = this.decor.place(this.held.id, at, { yaw: this.held.yaw, tint: this.held.tint }); if (i >= 0) this.push({ op: 'place', id: this.held.id, now: { ...at } }); if (!this.decor.stored(this.held.id)) this.held = null; } // (more of it in storage: keep placing, Animal Crossing's)
      sfx.grab?.(); this.redraw(); this.report(); return;
    }
    const i = hit ? this.near(hit.point) : -1;
    if (i >= 0) { const p = this.decor.s.placed[i]; this.held = { id: p[0], yaw: p[5], tint: p[6], from: i }; sfx.grab?.(); return; }
    this.catalogue();
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
        for (let t = 0; t < (D.tints || 1); t++) { const b = el('span', '', '◆'); b.style.cssText = `color:#${_c.set(SET_COLOR[D.set]).multiplyScalar(TINT[t]).getHexString()};margin-right:.8em;cursor:pointer`; b.title = `tint ${t + 1}`; b.onclick = (e) => { e.stopPropagation(); this.held = { id, yaw: 0, tint: t, from: null }; menu.close(); }; tints.appendChild(b); }
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
    }, { title: 'DECORATE', sub: 'click a piece to hold it · the wheel turns it · right button puts it back · F closes' });
  }
  push(u) { this.undos.push(u); if (this.undos.length > UNDO) this.undos.shift(); }
  /** Ctrl+Z in decor: the last placing, move or putting back taken back (the hand's own undo is the clay's). */
  undo() {
    const U = this.undos.pop(), D = this.decor; if (!U || !D) return false;
    const find = (id, a) => D.s.placed.findIndex((q) => q[0] === id && q[1] === a.planetoid && q[2] === a.face && q[3] === a.iu && q[4] === a.iv); // (by what and where, never by index: a removal shifts them)
    if (U.op === 'place') { const i = find(U.id, U.now); if (i >= 0) D.remove(i); }
    else if (U.op === 'move') { const i = find(U.id, U.now); if (i >= 0) D.move(i, U.was, U.yaw); }
    else if (U.op === 'remove') { const [id, planetoid, face, iu, iv, yaw, tint] = U.p; D.place(id, { planetoid, face, iu, iv }, { yaw, tint }); }
    this.held = null; this.redraw(); this.report(); return true;
  }
  update() { if (this.held && this.R.hand?.art !== 'place') { this.held = null; this.ghost.visible = false; } }
}
