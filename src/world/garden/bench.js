// ---------------------------------------------------------------------------------------
// THE CARVING BENCH: a plate carved free of its stone to summon its spirit (docs/plans/SEEDS-SLABS-SCANS.md 2; Dovina's kernel in
// progress/slabs.js: newSlab, carve, VERBS, secondsOf, scoreOf, spiritOf). At the plate shrine (the hokora on the Athanor's east
// shoulder) a plate (a Veritome photograph of a creature, one a kind) is condensed into a SPIRIT SLAB in the Pneuka Box (item `slab`,
// its kind, stars and seed in its data); F there with a slab in the Box carves it on the bench below the shrine. The camera closes on
// the slab (the garden camera's station view, as the press's: gardencam.js enterPress), the god hand's model steps aside and the cursor
// is the tool: 1 to 7 the verbs, a tool's each (the brush, the pick, the blast, the slice, the hoover, the toll, the silhouette), the
// left button one use of the verb up on the cell under the cursor, through the face it meets, held to repeat at the verb's own pace.
// The Lachrymite sets when its real seconds are out (secondsOf), or at once with Enter, and the spirit steps out with what the dig
// earned (scoreOf, spiritOf: its class from the stars, its bond, a share over each stat, the rare look on a flawless dig). F or Esc
// before it sets puts the dig off: the slab goes back as it was (a kind's slab always lies the same way). A sealed slab (a scan's, of a
// kind never photographed: progress/scans.js) waits in the Box until its kind is met.
// The slab is drawn as cubes (a cell 5 cm: its strata the island's clay, sand and sandstone, the fossil Lachrymite, a crack darker),
// one mesh made again on each change; a cube of light on the cell under the cursor; the toll shows the fossil through the stone for its
// moment, the silhouette its outline on the top face: stand-ins for Calissa's slabs and their breaking. Its window (the Clay dress)
// says the time left, the share bared and cracked, the verbs as the slot row, and SET IT NOW and PUT IT OFF (a phone has no Enter or
// F; Esc puts it off too, boot/title.js); the HUD and the log step out meanwhile (game.ui.want).
// Events (each with `by`): slab.make { kind, stars, from }, slab.use { kind, verb, broke, cracked, stratum } (the looks' and sounds'),
// slab.carve { kind, score, bared, cracked, flawless }, and spirit.bind { from: 'plate' | 'scan' } as the spirit steps out.
//
// Prior art: Spectrobes and Spectrobes: Origins (excavation with the tools, the silhouette, the timer), Fossil Fighters (the cleaning
// meter against the damage meter), Pokemon Diamond's Underground (the hammer against the pick), Minecraft's block hardness by stratum,
// Amanatides and Woo's voxel walk (1987: the cell a ray meets).
//
//   realm.bench = new CarvingBench(realm)   .slabs() -> [{ slot, kind, stars, sealed, from }]   .condense(kind) -> bool   .begin(slot) -> why | null
//   .viewing   .handle(dt, hand)   .end(set, why)   .slab (the kernel's, while carving)   .spot { pos, up }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { newSlab, carve, VERBS, secondsOf, scoreOf, spiritOf, SLAB } from '../../progress/slabs.js';
import { fresh, STATS } from '../../progress/spirits.js';
import { slotRow } from '../../ui/choicecard.js';
import { brineFrame, dot, GOLD } from '../../ui/brineframe.js';
import { clayDress } from '../../ui/goalswindow.js';
import { now as calNow } from '../../core/calendar.js';
import { stream } from '../../core/rng.js';
import { dirOf, BENCH_AT } from './place.js';

/** The bench: where it stands on the Athanor (latitude, longitude: below the shrine), its top's height, a cell's size (SLAB's 5 cm),
 *  and the camera's station over it (degrees, metres, real seconds in and out: gardencam.js). */
export const BENCH = { at: BENCH_AT, top: 0.55, cell: 0.05, view: { fov: 40, dist: 1.3, pitch: 52, north: 0, in: 0.6, out: 0.4, zoom: 2 }, aim: 0.2 }; // (aim: metres under the slab's heart the view looks at, so the slab stands above its window)
/** The verbs in their keys' order (1 to 7). */
export const BENCH_VERBS = ['brush', 'pick', 'blast', 'slice', 'hoover', 'toll', 'silhouette'];
const VERB_NAME = { brush: 'Brush', pick: 'Pick', blast: 'Blast', slice: 'Slice', hoover: 'Hoover', toll: 'Toll', silhouette: 'Outline' }; // (plain words, Espada's to rule; the silhouette's label shorter, to fit a phone's slot)
const slabRand = stream('world/garden/bench'); // (a slab's seed: core/rng.js, the same twice)
const STONE = { 1: 0xc89a72, 2: 0xd8bf8a, 3: 0x8e7058 }; // (the strata from the top: Anagami's clay, sand, sandstone)
const BONE = [0x3c2f58, 0x8a72c4, 0xc4b2f2]; // (the fossil by its integrity: broken, cracked, whole)
const _m = new THREE.Matrix4(), _o = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color(), _w = new THREE.Color(0xf2e6d2);

export class CarvingBench {
  constructor(realm) {
    this.R = realm; this.game = realm.game; this.slab = null; this.verb = 'brush'; this.cool = 0; this.t = 0; this.hover = null; this.tollT = 0;
    const site = realm.site, A = site.by.athanor, d = dirOf(...BENCH.at), U = d.clone(), N = new THREE.Vector3(0, 1, 0).projectOnPlane(U).normalize(), E = new THREE.Vector3().crossVectors(U, N);
    this.spot = { pos: A.c.clone().addScaledVector(d, A.radiusAt(d)), up: U, N, E };
    const G = (this.group = new THREE.Group()); G.name = 'carving-bench'; G.matrixAutoUpdate = false;
    G.matrix.makeBasis(E, U, N).setPosition(this.spot.pos); G.matrixWorldNeedsUpdate = true; site.group.add(G);
    this.stone = new THREE.MeshStandardMaterial({ color: 0x9a9088, roughness: 0.95, name: 'bench-stone' });
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.9, BENCH.top, 0.6).translate(0, BENCH.top / 2, 0), this.stone); table.name = 'bench-table'; table.castShadow = table.receiveShadow = true; G.add(table);
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, name: 'slab-cells' });
    this.ghostMat = new THREE.MeshBasicMaterial({ color: 0xe8dcff, transparent: true, opacity: 0.3, depthWrite: false, name: 'slab-ghost' });
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, name: 'slab-toll' });
    this.cursor = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BENCH.cell, BENCH.cell, BENCH.cell)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, depthTest: false, name: 'slab-cursor' }));
    this.cursor.visible = false; this.cursor.renderOrder = 3; G.add(this.cursor);
    this.mesh = null; this.ghost = null; this.ring = null;
  }
  get viewing() { return !!this.slab; }
  get box() { return this.game.pneuka; }

  // ------------------------------------------------------------------ plates to slabs
  /** The slabs in the Pneuka Box, and whether each is sealed (a scan's, its kind never photographed). */
  slabs() {
    const met = this.met(), out = [];
    (this.box?.slots || []).forEach((sl, slot) => { if (sl?.id === 'slab' && sl.data?.kind) out.push({ slot, kind: sl.data.kind, stars: sl.data.stars || 1, from: sl.data.from || 'plate', sealed: !!sl.data.sealed && !met.has(sl.data.kind) }); });
    return out;
  }
  /** The kinds photographed (the Veritome's Book): what opens a sealed slab. */
  met() { return new Set(Object.entries(this.game.veritome?.book?.photos || {}).filter(([, p]) => p?.stars > 0).map(([k]) => k)); }
  /** A plate condensed into a spirit slab in the Pneuka Box (the plate is used: one slab a kind photographed). */
  condense(kind) {
    const A = this.R.awaken, p = A.plates().find((x) => x.kind === kind); if (!p) return false;
    if (this.box?.add('slab', 'garden', 0, { kind, stars: p.stars, seed: Math.floor(slabRand() * 2 ** 31), from: 'plate' }) < 0) { this.game.log?.say('warn', 'Your Pneuka Box is full.', { key: 'slab.full', throttle: 1 }); return false; }
    A.used[kind] = true; A.dirty();
    this.game.events?.emit('slab.make', { kind, stars: p.stars, from: 'plate', by: 'courier' });
    return true;
  }

  // ------------------------------------------------------------------ the dig
  /** A slab from the Box set on the bench and the view closed on it. A reason why not, else null. */
  begin(slot) {
    if (this.slab) return 'A slab is already on the bench.';
    const sl = this.box?.slots[slot]; if (sl?.id !== 'slab' || !sl.data?.kind) return 'That is not a spirit slab.';
    const D = sl.data; if (D.sealed && !this.met().has(D.kind)) return `It is sealed. Photograph a ${D.kind} in the world to open it.`;
    this.slab = newSlab({ kind: D.kind, stars: D.stars || 1, seed: D.seed | 0 }); this.orig = this.slab.cells.slice();
    this.slot = slot; this.data = D; this.t = 0; this.limit = secondsOf(D.stars || 1); this.cool = 0; this.tollT = 0; this.verb = 'brush';
    this.redraw();
    const O = new THREE.Vector3(0, BENCH.top + (SLAB.h * BENCH.cell) / 2 - BENCH.aim, 0).applyMatrix4(this.group.matrix);
    this.R.camera.enterPress?.({ O, N: this.spot.N, U: this.spot.up }, BENCH.view, 'bench');
    const H = this.R.god?.hand; if (H?.root) H.root.visible = false; // (the cursor is the tool: the god hand's model steps aside)
    this.game.ui?.want?.('bench', true); this.window(true); // (the HUD and the log step out for the slab's own window: feedback/hideui.js)
    return null;
  }
  /** The dig over: set (the spirit steps out, the slab leaves the Box) or put off (the slab goes back as it was). */
  end(set = false, why = 'leave') {
    const S = this.slab; if (!S) return null;
    const g = this.game; let out = null;
    if (set) {
      const sc = scoreOf(S), sp = spiritOf(sc, S.stars), D = this.data, slots = this.box?.slots || [];
      let k = slots.findIndex((x) => x?.id === 'slab' && x.data === D); if (k < 0) k = slots.findIndex((x) => x?.id === 'slab' && x.data?.kind === D.kind && (x.data.seed | 0) === (D.seed | 0));
      if (k < 0) g.log?.say('warn', 'The slab is gone from your Pneuka Box.', { key: 'slab.gone', throttle: 1 }); // (nothing is summoned from a slab no longer there)
      else {
        this.box.take(k);
        g.events?.emit('slab.carve', { kind: S.kind, score: sc.score, bared: sc.bared, cracked: sc.cracked, flawless: sc.flawless, by: 'courier' });
        const F = Object.keys(STATS), sheet = fresh(S.kind, sp.cls, D.feeling || F[(S.kind.length + sp.cls) % F.length]); // (a plate's feeling as awaken.js's entry gives it; a scan's its own)
        for (const f of Object.keys(sheet.stats)) sheet.stats[f] += Math.round(100 * sp.statShare); // (a share of a hundred over each stat: the dig's own, Monster Rancher's disc stats)
        sheet.bond = sp.bond; sheet.fatigue = 0;
        this.R.awaken.bind({ kind: S.kind, cls: sp.cls, rare: sp.rare, sp: sheet, from: D.from === 'scan' ? 'scan' : 'plate', at: calNow(), name: null });
        out = { ...sc, ...sp };
      }
    }
    this.slab = null; this.hover = null; this.cursor.visible = false;
    for (const m of [this.mesh, this.ghost, this.ring]) if (m) { this.group.remove(m); m.geometry.dispose(); }
    this.mesh = this.ghost = this.ring = null;
    this.R.camera.leavePress?.();
    const H = this.R.god?.hand; if (H?.root) H.root.visible = true;
    this.game.ui?.want?.('bench', false); this.window(false);
    return out;
  }

  /** The hand's step while the bench has it (world/garden/hand.js): the verb chosen, used on the cell under the cursor, the clock. */
  handle(dt, hand) {
    const g = this.game, I = g.input, S = this.slab, raw = g.rawDt ?? dt, typing = g.log?.typing; if (!S) return;
    if (!typing && I.wasPressed('KeyF')) { I.spend?.('KeyF'); this.end(false, 'leave'); return; } // (spent: the shrine's F does not open its page under it; Esc is boot/title.js's, as the press view's)
    if (!typing && (I.wasPressed('Enter') || I.wasPressed('NumpadEnter'))) { I.spend?.('Enter', 'NumpadEnter'); this.end(true, 'set'); return; }
    for (let k = 0; k < BENCH_VERBS.length; k++) if (!typing && I.wasPressed(`Digit${k + 1}`)) this.pick(BENCH_VERBS[k]);
    this.t += raw; this.cool -= raw; this.tollT = Math.max(0, this.tollT - raw);
    if (this.t >= this.limit) { this.end(true, 'time'); return; }
    // the cell under the cursor: the hand's ray into the slab's grid
    const { o, d } = hand.ray(); this.hover = this.cast(o, d);
    if (this.hover) { const { x, y, z } = this.hover; this.cursor.position.copy(this.local(x + 0.5, y + 0.5, z + 0.5)); }
    this.cursor.visible = !!this.hover;
    const free = VERBS[this.verb]?.reveal || VERBS[this.verb]?.ghost; // (the toll and the silhouette need no cell)
    if (I.isDown('Mouse0') && this.cool <= 0 && (this.hover || free) && !(g.indexMenu?.open || g.course?.menu?.open)) this.use();
    if (this.ring) { this.ringMat.opacity = Math.min(0.6, this.tollT * 0.8); this.ring.visible = this.tollT > 0; }
    this.draw();
  }
  pick(verb) { if (!VERBS[verb] || verb === this.verb) return; this.verb = verb; this.draw(true); }
  /** One use of the verb up: the kernel's carve, the slab drawn again, the use said for the looks and sounds. */
  use() {
    const S = this.slab, V = VERBS[this.verb], h = this.hover || { x: 0, y: 0, z: 0, dir: { x: 0, y: 1, z: 0 } };
    const i = h.x + S.w * (h.y + S.h * h.z), stratum = this.orig[i] < 0 ? 0 : this.orig[i];
    const r = carve(S, this.verb, { x: h.x, y: h.y, z: h.z }, h.dir);
    this.cool = V.secs || 0.3;
    if (r.revealed) { this.tollT = r.revealed; this.showRing(); }
    if (V.ghost) this.showGhost();
    if (r.broke || r.cracked) this.redraw();
    this.game.events?.emit('slab.use', { kind: S.kind, verb: this.verb, broke: r.broke, cracked: r.cracked, stratum, by: 'courier' });
    this.draw(true);
  }

  // ------------------------------------------------------------------ the slab's grid in the world
  /** A point of the grid (x right, y down from the top, z north; a cell a unit) in the bench's frame. */
  local(gx, gy, gz, out = new THREE.Vector3()) { const S = this.slab, c = BENCH.cell; return out.set((gx - S.w / 2) * c, BENCH.top + (S.h - gy) * c, (gz - S.d / 2) * c); }
  /** The first cell a world ray meets in the slab, and the way into it (the face it came through), or null (Amanatides and Woo). */
  cast(o, d) {
    const S = this.slab, c = BENCH.cell; _m.copy(this.group.matrix).invert();
    _o.copy(o).applyMatrix4(_m); _d.copy(d).transformDirection(_m);
    const O = [_o.x / c + S.w / 2, S.h - (_o.y - BENCH.top) / c, _o.z / c + S.d / 2], D = [_d.x, -_d.y, _d.z], hi = [S.w, S.h, S.d];
    let t0 = 0, t1 = Infinity, axis = -1;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(D[a]) < 1e-9) { if (O[a] < 0 || O[a] > hi[a]) return null; continue; }
      let ta = (0 - O[a]) / D[a], tb = (hi[a] - O[a]) / D[a]; if (ta > tb) [ta, tb] = [tb, ta];
      if (ta > t0) { t0 = ta; axis = a; } t1 = Math.min(t1, tb); if (t0 > t1) return null;
    }
    const cell = [0, 1, 2].map((a) => Math.min(hi[a] - 1, Math.max(0, Math.floor(O[a] + D[a] * (t0 + 1e-6)))));
    const step = D.map((v) => Math.sign(v)), tD = D.map((v) => (v ? Math.abs(1 / v) : Infinity)), tN = D.map((v, a) => (v > 0 ? (cell[a] + 1 - O[a]) / v : v < 0 ? (cell[a] - O[a]) / v : Infinity));
    for (let k = 0; k < S.w + S.h + S.d + 3; k++) {
      if (S.cells[cell[0] + S.w * (cell[1] + S.h * cell[2])] !== 0) { const dir = { x: 0, y: 0, z: 0 }; if (axis >= 0) dir['xyz'[axis]] = step[axis] || 1; else dir.y = 1; return { x: cell[0], y: cell[1], z: cell[2], dir }; }
      const a = tN[0] < tN[1] ? (tN[0] < tN[2] ? 0 : 2) : tN[1] < tN[2] ? 1 : 2;
      cell[a] += step[a]; if (cell[a] < 0 || cell[a] >= hi[a]) return null; tN[a] += tD[a]; axis = a;
    }
    return null;
  }
  /** The slab drawn again: a face where a cell meets air, coloured by its stratum (lighter as it is worn) or the fossil's integrity. */
  redraw() {
    const S = this.slab, pos = [], col = [], nor = [], c = BENCH.cell, I = (x, y, z) => x + S.w * (y + S.h * z);
    const solid = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < S.w && y < S.h && z < S.d && S.cells[I(x, y, z)] !== 0;
    const FACES = [[1, 0, 0], [-1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]]; // (grid y runs down: [0,-1,0] is the face up)
    for (let z = 0; z < S.d; z++) for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
      const i = I(x, y, z), v = S.cells[i]; if (v === 0) continue;
      if (v < 0) _c.setHex(BONE[Math.max(0, Math.min(2, S.bone[i]))]); else { _c.setHex(STONE[this.orig[i]] ?? STONE[3]); _c.lerp(_w, 0.35 * (1 - v / Math.max(1, this.orig[i]))); }
      for (const [a, b, e] of FACES) {
        if (solid(x + a, y + b, z + e)) continue;
        const shade = b === -1 ? 1 : b === 1 ? 0.6 : 0.82, n = [a, -b, e];
        const L = faceOf(x, y, z, a, b, e).map(([gx, gy, gz]) => this.local(gx, gy, gz)), out = _n.crossVectors(_a.subVectors(L[1], L[0]), _b.subVectors(L[2], L[0])).dot(_o.set(...n)) > 0;
        for (const p of out ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]) { pos.push(L[p].x, L[p].y, L[p].z); nor.push(...n); col.push(_c.r * shade, _c.g * shade, _c.b * shade); }
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (this.mesh) { this.mesh.geometry.dispose(); this.mesh.geometry = geo; } else { this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.name = 'slab'; this.mesh.castShadow = this.mesh.receiveShadow = true; this.group.add(this.mesh); }
  }
  /** The fossil's cells as cubes (its own geometry). */
  boneGeo(flat = false) {
    const S = this.slab, geos = [], c = BENCH.cell;
    for (let z = 0; z < S.d; z++) for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
      const i = x + S.w * (y + S.h * z); if (this.orig[i] >= 0) continue;
      const p = flat ? this.local(x + 0.5, -0.04, z + 0.5) : this.local(x + 0.5, y + 0.5, z + 0.5);
      geos.push(flat ? new THREE.PlaneGeometry(c, c).rotateX(-Math.PI / 2).translate(p.x, p.y, p.z) : new THREE.BoxGeometry(c * 0.9, c * 0.9, c * 0.9).translate(p.x, p.y, p.z));
    }
    const g = geos.length ? mergeAll(geos) : new THREE.BufferGeometry(); geos.forEach((x) => x.dispose()); return g;
  }
  /** The toll: the fossil rings through the stone for its moment. */
  showRing() { if (!this.ring) { this.ring = new THREE.Mesh(this.boneGeo(), this.ringMat); this.ring.name = 'slab-toll'; this.ring.renderOrder = 2; this.group.add(this.ring); } }
  /** The silhouette: the creature's outline drawn faintly on the top face, to aim by. */
  showGhost() { if (!this.ghost) { this.ghost = new THREE.Mesh(this.boneGeo(true), this.ghostMat); this.ghost.name = 'slab-silhouette'; this.ghost.renderOrder = 1; this.group.add(this.ghost); } }

  // ------------------------------------------------------------------ its window
  window(on) {
    if (typeof document === 'undefined') return;
    if (!this.root && on) {
      style();
      const root = (this.root = document.createElement('div')); root.className = 'cb clay'; root.style.setProperty('--d', `${dot()}px`);
      const f = (this.frame = brineFrame(root, { tab: 'CARVING' }));
      const rope = document.createElement('div'); rope.className = 'bf-rope'; f.body.append(rope);
      this.readout = document.createElement('div'); this.readout.className = 'cb-read'; f.body.append(this.readout);
      this.row = document.createElement('div'); this.row.className = 'cb-row'; f.body.append(this.row);
      const acts = document.createElement('div'); acts.className = 'cb-acts'; // (the keys' two acts as buttons too: a phone has no Enter or F)
      for (const [label, key, set] of [['SET IT NOW', 'ENTER', true], ['PUT IT OFF', 'F', false]]) { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `${label} <kbd>${key}</kbd>`; b.addEventListener('click', (e) => { e.stopPropagation(); this.end(set, set ? 'set' : 'leave'); }); acts.append(b); }
      f.body.append(acts);
      for (const ev of ['mousedown', 'pointerdown', 'touchstart']) root.addEventListener(ev, (e) => e.stopPropagation()); // (a press on the window is the window's, never a use on the slab under it)
      document.body.appendChild(root);
      addEventListener('resize', () => { root.style.setProperty('--d', `${dot()}px`); f.layout(); });
    }
    if (!this.root) return;
    this.root.classList.toggle('on', !!on);
    if (on) { this.frame.layout(); this.draw(true); }
  }
  /** The window's numbers each step; the slot row of verbs when `all` (the verb changed, a use, the tolls). */
  draw(all = false) {
    if (!this.root || !this.slab) return;
    const S = this.slab, sc = scoreOf(S), left = Math.max(0, this.limit - this.t), m = Math.floor(left / 60), s = Math.floor(left % 60);
    const text = `<div class="cb-time"><i style="--f:${(100 * left / this.limit).toFixed(1)}%"></i></div><div class="cb-nums"><b>SETS IN ${m}:${String(s).padStart(2, '0')}</b><span>BARED ${Math.round(100 * sc.bared)}%</span><span>CRACKED ${Math.round(100 * sc.cracked)}%</span><span>TOLLS ${S.tolls}</span></div>`;
    if (text !== this.lastText) { this.readout.innerHTML = text; this.lastText = text; }
    if (!all) return;
    const rows = BENCH_VERBS.map((v) => ({ id: `slab.${v}`, name: VERB_NAME[v], does: VERBS[v].line, icon: `mount.${VERBS[v].tool}`, cooldown: VERBS[v].secs, state: v === this.verb ? 'equipped' : 'ready' }));
    this.row.replaceChildren(slotRow({ slots: rows.length, filled: rows, keys: rows.map((_, i) => String(i + 1)), sel: BENCH_VERBS.indexOf(this.verb), onPick: (i) => this.pick(BENCH_VERBS[i]), id: 'bench' }));
  }
}

/** A cell's face as its four grid corners in order round it (`a, b, e`: the face's direction in the grid; the winding is set by its
 *  normal where it is drawn, the grid's y running down). */
function faceOf(x, y, z, a, b, e) {
  const X = [x, x + 1], Y = [y, y + 1], Z = [z, z + 1];
  if (a) { const f = a > 0 ? X[1] : X[0]; return [[f, Y[0], Z[0]], [f, Y[1], Z[0]], [f, Y[1], Z[1]], [f, Y[0], Z[1]]]; }
  if (b) { const f = b > 0 ? Y[1] : Y[0]; return [[X[0], f, Z[0]], [X[1], f, Z[0]], [X[1], f, Z[1]], [X[0], f, Z[1]]]; }
  const f = e > 0 ? Z[1] : Z[0]; return [[X[0], Y[0], f], [X[1], Y[0], f], [X[1], Y[1], f], [X[0], Y[1], f]];
}
/** Geometries merged into one (positions and normals only: the bone's own). */
function mergeAll(geos) {
  const pos = [], nor = [];
  for (const g of geos) { const G = g.index ? g.toNonIndexed() : g; pos.push(...G.attributes.position.array); nor.push(...G.attributes.normal.array); if (G !== g) G.dispose(); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out;
}

let styled = false;
function style() {
  if (styled || typeof document === 'undefined') return; styled = true;
  const st = document.createElement('style'); st.id = 'carving-bench';
  st.textContent = `
.cb{position:fixed;left:50%;bottom:calc(10*var(--d));z-index:3;width:calc(360*var(--d));max-width:calc(100vw - 24px);transform:translateX(-50%);pointer-events:none;opacity:0;transition:opacity .3s}
.cb.on{opacity:1;pointer-events:auto}
${clayDress('.cb.clay')}
.cb-time{position:relative;height:calc(4*var(--d));margin:calc(3*var(--d)) 0;background:#2a140c;box-shadow:inset 0 var(--d) 0 rgba(0,0,0,.6),0 var(--d) 0 rgba(255,226,196,.12)}
.cb-time i{position:absolute;left:0;top:0;bottom:0;width:var(--f,100%);background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 50%),rgb(var(--jtop,104,50,32));filter:brightness(2.1) saturate(1.2)}
.cb-nums{display:flex;gap:calc(8*var(--d));align-items:baseline;font-size:calc(9*var(--d));letter-spacing:.08em}
.cb-nums b{color:${GOLD};letter-spacing:.12em}
.cb-acts{display:flex;gap:calc(4*var(--d));justify-content:flex-end;margin-top:calc(3*var(--d))}
.cb-acts button{font:inherit;font-size:calc(8*var(--d));letter-spacing:.1em;color:#f3e2cc;background:rgba(0,0,0,.3);border:1px solid rgba(255,230,200,.35);border-radius:3px;padding:calc(2*var(--d)) calc(5*var(--d));cursor:pointer}
.cb-acts button:hover{border-color:${GOLD}}
.cb-acts kbd{font:inherit;opacity:.6;margin-left:calc(2*var(--d))}
.cb .slotrow{flex-wrap:nowrap}.cb .slotrow .sl{min-width:0;flex:1 1 0}.cb .slotrow .sl>span{letter-spacing:.02em;font-size:calc(7*var(--d));max-width:100%;overflow:hidden}`;
  document.head.appendChild(st);
}
