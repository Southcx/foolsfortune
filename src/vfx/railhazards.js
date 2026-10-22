// ---------------------------------------------------------------------------------------
// A HAZARD'S LOOK: the crossing's hazards as drawn (Dovina's docs/plans/RAIL-STANDARDS.md section 4, legs.js HAZARDS). Petra's runtime
// places and collides them in the rail's frame; this draws them where she says, re-seated every frame from their local place through the
// rail's frame, and shows what became of each. Laid only where the view looks down the scroll (chase, free, astern), one lane of three.
//
//   THE PILLAR  the monolith of the ambient geometry (vfx/railgeometry.js: its slab program and its black labradorite, a box on its
//               base) risen out of the crude into a lane: 4.4 m across (radius 2.2), 18 m over the crude, wet where it has come up
//   THE ARCH    a stone arch in the same stone, laid as a ruin's masonry (piers, imposts, a ring of voussoirs and its keystone, each
//               block's joints in the slab's thin glowing edge), its opening 6 m across; while it can be threaded a thread of gold
//               (0xffd36a) runs round both edges of its opening, breathing; passed, it goes dim; a 'through' flashes it white-gold and
//               a ghost of the thread swells off it and fades
//   THE GATE    a wall of crude-glass across the frame's three lanes (vfx/railhazards/parts.js: ink, schiller, the oil film, crude
//               streaking down, panes, a pale teal outline), its ONE gap, 5 m, in the lane named, rimmed in gold jambs
//   A HIT       a crack star flashing ember on the face where the ship struck, stone chips off it (`game.voxels.chip`), and on the
//               gate the glass crazing hot and cooling
//   THE WARNING `place({ warn })` raises the edge mark (vfx/railfoemarks.js, kind 'hazard': a pale teal ring, no words) at the hazard's
//               entry, its local held to the view's far edge
// Everything is danger: kept true under the storm's veil (vfx/stormwarp.js keepTrue), never bent. All rise out of the crude (about a
// real second) when placed. Instanced: the pillars 1 draw, the arches 2 (stone, thread), the gates 2 (glass, jambs), the cracks 1;
// the stone shares the Mind's slab program, the threads, jambs and cracks the plain additive one (the edge marks'); the crude-glass is
// the one new program. Parked for the warm-up's compile (casebook 17).
//
// Prior art: Star Fox 64's Corneria (its arches flown under for Sector Y, its pillars and buildings in the lane, the gates of Sector X
// with their one way through), Panzer Dragoon's ruins rising out of the sea, F-Zero's lit gates, 2001's monolith (the pillar's stone).
//
//   const H = new RailHazards(game, stage, { global = true, voxels })   H.build(scene)   H.parked() -> [objects]   H.show(on)
//   H.update(raw) (once a frame, after the camera)   H.clear()   H.dispose()
//   game.railHazards.place({ kind: 'pillar' | 'arch' | 'gate', id, local, lane, span?, gap?, warn?, risen? }) -> handle
//     local: a Vector3 in the rail's frame (x across, y up, z along), KEPT BY REFERENCE: move it and the look follows. The look stands on
//     the crude (the frame's y 0, the sea's level) whatever local.y. Pillar and arch stand at local.x; the gate's wall spans the frame
//     round x 0 (`span`, 32 m) with its gap (`gap`, 5 m) at lane x 8 m (legrunner.js CARRIER.lanes). warn: real seconds of edge mark.
//     risen: true stands it at once (no rise)
//   handle.pass('clear' | 'hit' | 'through', at?)   (at: the blow's point, rail frame; default the ship's place on the hazard's face)
//   handle.remove()   handle.lit (an arch's 0..1)   game.railHazards.get(id)   game.railHazards.clear()
//   the event `rail.hazard { id, passed }` is the same as handle.pass(passed)
//   RAIL_HAZARD_LOOK   the numbers
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindGeoMaterial, mindGeoMesh } from './railgeometry.js';
import { keepTrue, deepMaterial } from './stormwarp.js';
import { archGeometry, archRimGeometry, crackGeometry, crudeGlassMaterial, crudeGlassMesh } from './railhazards/parts.js';
import { CRUISE } from '../courier/ship/views.js';

export const RAIL_HAZARD_LOOK = {
  lane: 8, // (m between lanes: legrunner.js CARRIER.lanes)
  gold: 0xffd36a, hot: 0xfff0c8, ember: 0xff8a3a,
  pillar: { radius: 2.2, depth: 2.2, top: 18, foot: -8, max: 12 },
  arch: { span: 6, spring: 4.5, ring: 1.6, pier: 1.6, depth: 2.0, foot: -6, stones: 9, max: 12, dim: 0.08, breathe: 0.12, flash: 0.7 },
  gate: { span: 32, gap: 5, top: 14, foot: -6, thick: 0.5, jamb: [0.26, 0.8], max: 8 },
  rise: 3, // (the ease toward stood, 1/s: about a real second out of the crude)
  crack: { time: 0.55, size: 2.2, max: 12 },
  warn: { far: 66, astern: -56, y: CRUISE + 1 }, // (where the edge mark is held: the chase view's far edge, the astern view's)
};
const L = RAIL_HAZARD_LOOK;
const _l = new THREE.Vector3(), _w = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _qf = new THREE.Quaternion();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _mb = new THREE.Matrix4(), _col = new THREE.Color();
const _flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0).setPosition(0, -1e4, 0);
const GOLD = new THREE.Color(L.gold), HOT = new THREE.Color(L.hot), EMBER = new THREE.Color(L.ember);
const ease = (x, to, rate, dt) => x + (to - x) * (1 - Math.exp(-rate * dt));
const smooth = (k) => k * k * (3 - 2 * k);

/** Additive plain light, kept true (the edge marks' program: vfx/railfoemarks.js). */
function additive() {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, forceSinglePass: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); // (fogged as the edge marks' are: the one program)
  return keepTrue(m);
}
/** A free list of an InstancedMesh's slots; `count` is the highest taken (a slot given back is hidden, never drawn). */
class Slots {
  constructor(mesh, max, color = false) {
    this.mesh = mesh; this.free = Array.from({ length: max }, (_, i) => max - 1 - i); this.used = new Set();
    if (color) mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < max; i++) mesh.setMatrixAt(i, ZERO);
  }
  take() { const i = this.free.pop(); if (i == null) return -1; this.used.add(i); this.recount(); return i; }
  give(i) { if (i < 0 || !this.used.delete(i)) return; this.mesh.setMatrixAt(i, ZERO); this.free.push(i); this.recount(); }
  recount() { let hi = 0; for (const i of this.used) hi = Math.max(hi, i + 1); this.mesh.count = hi; this.mesh.instanceMatrix.needsUpdate = true; }
}

export class RailHazards {
  constructor(game, stage, { global = true, voxels = null } = {}) {
    this.game = game; this.st = stage; this.voxelsOwn = voxels; this.live = new Map(); this.cracks = []; this.t = { value: 0 }; this.n = 0;
    if (global) {
      game.railHazards = this;
      game.events?.on?.('rail.hazard', (e) => { if (e?.id != null) this.live.get(e.id)?.pass(e.passed, e.at); });
    }
  }

  build(scene) {
    const seaY = this.st?.sea?.y ?? 0;
    this.group = new THREE.Group(); this.group.name = 'rail-hazards'; this.group.userData.zoneFree = true; scene.add(this.group);
    // the stone: the Mind's slab, kept true (one material, the program the silhouette's eye already compiled)
    this.stone = mindGeoMaterial('slab', { seaY, warped: false });
    this.pillars = mindGeoMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.stone, L.pillar.max);
    this.arches = mindGeoMesh(archGeometry(L.arch), this.stone, L.arch.max);
    this.glow = additive();
    this.threads = new THREE.InstancedMesh(archRimGeometry(L.arch), this.glow, L.arch.max * 2);
    this.glassMat = keepTrue(deepMaterial(crudeGlassMaterial({ T: this.t, seaY })));
    this.glass = crudeGlassMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.glassMat, L.gate.max * 2);
    this.jambs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.glow, L.gate.max * 2);
    this.crackMesh = new THREE.InstancedMesh(crackGeometry(), this.glow, L.crack.max);
    this.meshes = [this.pillars, this.arches, this.threads, this.glass, this.jambs, this.crackMesh];
    this.slots = new Map([
      [this.pillars, new Slots(this.pillars, L.pillar.max)], [this.arches, new Slots(this.arches, L.arch.max)],
      [this.threads, new Slots(this.threads, L.arch.max * 2, true)], [this.glass, new Slots(this.glass, L.gate.max * 2)],
      [this.jambs, new Slots(this.jambs, L.gate.max * 2, true)], [this.crackMesh, new Slots(this.crackMesh, L.crack.max, true)],
    ]);
    const order = [40, 40, 44, 43, 44, 46];
    this.meshes.forEach((m, i) => { m.frustumCulled = false; m.userData.zoneFree = true; m.renderOrder = order[i]; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.group.add(m); });
    // one of each parked far below for the warm-up's compile (put down when the first hazard is placed)
    for (const m of this.meshes) { m.setMatrixAt(0, _m.makeTranslation(0, -1e4, 0)); m.count = 1; m.instanceColor?.setXYZ(0, 1, 1, 1); }
    this.parkedOn = true;
    return this;
  }
  parked() { return [this.group, ...this.meshes]; }
  show(on) { if (this.group) this.group.visible = on; }

  /** A hazard laid in the rail's frame (see the header). */
  place({ kind, id = `hz${++this.n}`, local, lane = 0, span, gap, warn = 0, risen = false } = {}) {
    if (!this.group || !local) return null;
    if (this.parkedOn) this.unpark();
    this.live.get(id)?.remove();
    const self = this, h = {
      id, kind, local, lane, k: risen ? 1 : 0, lit: kind === 'arch' ? (risen ? 1 : 0) : 0, litTo: kind === 'arch' ? 1 : 0, flash: 0, passed: null, mark: null, parts: [],
      span: span ?? L.gate.span, gap: gap ?? L.gate.gap,
      pass(how = 'clear', at = null) { self.pass(this, how, at); },
      remove() { self.remove(this); },
    };
    const take = (mesh) => { const i = this.slots.get(mesh).take(); if (i >= 0) h.parts.push({ mesh, i }); return i; };
    if (kind === 'pillar') take(this.pillars);
    else if (kind === 'arch') { h.stone = take(this.arches); h.thread = take(this.threads); h.ghost = take(this.threads); }
    else if (kind === 'gate') { h.panes = [take(this.glass), take(this.glass)]; h.jambs = [take(this.jambs), take(this.jambs)]; }
    else return null;
    this.live.set(id, h);
    if (warn > 0 && this.game.edgeMark) {
      const W = L.warn, x = kind === 'gate' ? lane * L.lane : local.x, z = local.z >= 0 ? Math.min(local.z, W.far) : Math.max(local.z, W.astern);
      h.mark = this.game.edgeMark.show(new THREE.Vector3(x, W.y, z), warn, { kind: 'hazard' });
    }
    this.seat(h, 0);
    return h;
  }
  get(id) { return this.live.get(id) || null; }

  /** What became of it: cleared (an arch missed goes dim), hit (a crack and chips; the gate crazes), through (an arch's gold flash). */
  pass(h, how, at) {
    if (!this.live.has(h.id)) return;
    h.passed = how;
    if (h.kind === 'arch') { h.litTo = 0; if (how === 'through') h.flash = 1; }
    if (how !== 'hit') return;
    if (h.kind === 'gate') h.flash = 1;
    // where the blow landed, on the face toward the ship (rail frame, kept relative to the hazard so it rides with it)
    const ship = this.st?.ship?.local, sgn = ship && h.local.z < ship.z ? -1 : 1;
    const face = h.kind === 'pillar' ? L.pillar.depth / 2 : h.kind === 'arch' ? L.arch.depth / 2 : L.gate.thick / 2;
    const p = at ? _a.copy(at) : _a.set(ship?.x ?? h.local.x, ship?.y ?? CRUISE, h.local.z - sgn * (face + 0.05));
    if (!at && h.kind === 'pillar') p.x = THREE.MathUtils.clamp(p.x, h.local.x - L.pillar.radius + 0.4, h.local.x + L.pillar.radius - 0.4);
    const off = new THREE.Vector3(p.x - h.local.x, p.y, p.z - h.local.z);
    const i = this.slots.get(this.crackMesh).take();
    if (i >= 0) this.cracks.push({ i, h, off, t: 0, flip: sgn > 0 });
    else { const c = this.cracks.shift(); if (c) { c.h = h; c.off = off; c.t = 0; c.flip = sgn > 0; this.cracks.push(c); } }
    const V = this.voxelsOwn || this.game.voxels, R = this.st?.rail;
    if (V?.chip && R) { this.toWorld(h, off.x, off.y, off.z, _w); R.dirWorld(_d.set(0, 0, sgn), _b).normalize(); V.chip(_w.clone(), _b.clone(), 6); }
  }

  remove(h) {
    if (!this.live.has(h.id) || this.live.get(h.id) !== h) return;
    this.live.delete(h.id);
    for (const p of h.parts) this.slots.get(p.mesh).give(p.i);
    h.parts.length = 0;
    for (let j = this.cracks.length - 1; j >= 0; j--) if (this.cracks[j].h === h) { this.slots.get(this.crackMesh).give(this.cracks[j].i); this.cracks.splice(j, 1); }
    if (h.mark) { h.mark.stop?.(); h.mark = null; }
  }
  clear() { for (const h of [...this.live.values()]) this.remove(h); }

  unpark() { this.parkedOn = false; for (const m of this.meshes) { m.setMatrixAt(0, ZERO); this.slots.get(m).recount(); } }

  /** A point of a hazard (x across from it, y over the crude, z along from it) in the world, through the rail's frame. */
  toWorld(h, x, y, z, out) {
    const R = this.st.rail; R.toWorld(_l.set(h.local.x + x, 0, h.local.z + z), out);
    out.y = (this.st.sea?.y ?? 0) + y; // (it stands on the crude: the rail is level wherever a hazard is laid)
    return out;
  }

  /** Once a frame, after the camera is placed. */
  update(raw) {
    if (!this.group || !this.st?.rail) return;
    this.t.value += raw;
    const R = this.st.rail;
    // the rail's frame as a turn (its x is mirrored in toWorld: the turn's own x is the frame's -x)
    R.dirWorld(_a.set(-1, 0, 0), _b); R.dirWorld(_a.set(0, 1, 0), _c); R.dirWorld(_a.set(0, 0, 1), _d);
    _qf.setFromRotationMatrix(_mb.makeBasis(_b.normalize(), _c.normalize(), _d.normalize()));
    const seaY = this.st.sea?.y ?? 0; this.stone.uniforms.uSeaY.value = seaY; this.glassMat.uniforms.uSeaY.value = seaY;
    for (const h of this.live.values()) this.seat(h, raw);
    this.crackFrame(raw);
    for (const m of this.meshes) {
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.visible = this.slots.get(m).used.size > 0; // (the parked ones are drawn only by the warm-up, which shows them itself)
    }
    for (const m of [this.pillars, this.arches, this.glass]) m.geometry.attributes.aLit.needsUpdate = true;
    this.glass.geometry.attributes.aFlash.needsUpdate = true;
  }

  seat(h, raw) {
    h.k = h.k >= 0.999 ? 1 : ease(h.k, 1, L.rise, raw);
    const k = smooth(h.k), t = this.t.value;
    if (h.kind === 'pillar') {
      const P = L.pillar, sink = (1 - k) * (P.top + 1), i = h.parts[0]?.i; if (i == null) return;
      this.toWorld(h, 0, P.foot - sink, 0, _w);
      this.pillars.setMatrixAt(i, _m.compose(_w, _qf, _s.set(P.radius * 2, P.top - P.foot, P.depth))); this.pillars.userData.lit[i] = k;
    } else if (h.kind === 'arch') {
      const A = L.arch, sink = (1 - k) * (A.spring + A.span / 2 + A.ring + 1);
      h.lit = ease(h.lit, h.litTo, h.litTo > h.lit ? 2 : 1.5, raw); h.flash = Math.max(0, h.flash - raw / A.flash);
      this.toWorld(h, 0, -sink, 0, _w);
      if (h.stone >= 0) { this.arches.setMatrixAt(h.stone, _m.compose(_w, _qf, _s.set(1, 1, 1))); this.arches.userData.lit[h.stone] = k; }
      const breathe = 1 + A.breathe * Math.sin(t * 2.4 + h.local.x), f = h.flash * h.flash;
      if (h.thread >= 0) {
        this.threads.setMatrixAt(h.thread, _m.compose(_w, _qf, _s.set(1, 1, 1)));
        _col.copy(GOLD).multiplyScalar(2.2 * (A.dim + (1 - A.dim) * h.lit) * breathe * k).lerp(HOT.clone().multiplyScalar(3), f);
        this.threads.setColorAt(h.thread, _col);
      }
      if (h.ghost >= 0) { // (the through: a ghost of the thread swelling off the opening's centre and fading)
        if (h.flash > 0.01) {
          const s = 1 + 0.9 * (1 - h.flash) ** 0.6; this.toWorld(h, 0, A.spring * (1 - s) - sink, 0, _w);
          this.threads.setMatrixAt(h.ghost, _m.compose(_w, _qf, _s.set(s, s, 1)));
          this.threads.setColorAt(h.ghost, _col.copy(GOLD).multiplyScalar(1.6 * h.flash));
        } else this.threads.setMatrixAt(h.ghost, ZERO);
      }
    } else if (h.kind === 'gate') {
      const G = L.gate, sink = (1 - k) * (G.top + 1), half = h.span / 2, gx = h.lane * L.lane, H = G.top - G.foot;
      h.flash = Math.max(0, h.flash - raw * 1.6);
      const edges = [[-half, gx - h.gap / 2], [gx + h.gap / 2, half]];
      h.panes.forEach((i, j) => {
        if (i < 0) return; const [x0, x1] = edges[j], w = Math.max(0.01, x1 - x0);
        this.toWorld(h, (x0 + x1) / 2 - h.local.x, G.foot - sink, 0, _w); // (the wall spans the frame round x 0)
        this.glass.setMatrixAt(i, _m.compose(_w, _qf, _s.set(w, H, G.thick))); this.glass.userData.lit[i] = k; this.glass.userData.flash[i] = h.flash;
      });
      h.jambs.forEach((i, j) => {
        if (i < 0) return; const x = j ? gx + h.gap / 2 : gx - h.gap / 2;
        this.toWorld(h, x - h.local.x, G.foot - sink, 0, _w);
        this.jambs.setMatrixAt(i, _m.compose(_w, _qf, _s.set(G.jamb[0], H + 0.6, G.jamb[1])));
        this.jambs.setColorAt(i, _col.copy(GOLD).multiplyScalar((0.85 + 0.15 * Math.sin(t * 2.4)) * k + 1.5 * h.flash));
      });
    }
  }

  crackFrame(raw) {
    const C = L.crack;
    for (let j = this.cracks.length - 1; j >= 0; j--) {
      const c = this.cracks[j]; c.t += raw;
      if (c.t >= C.time || !this.live.has(c.h.id)) { this.slots.get(this.crackMesh).give(c.i); this.cracks.splice(j, 1); continue; }
      const u = c.t / C.time, s = C.size * (0.55 + 0.45 * (1 - (1 - Math.min(1, u * 3)) ** 3));
      this.toWorld(c.h, c.off.x, c.off.y, c.off.z, _w);
      _q.copy(_qf); if (c.flip) _q.multiply(_flip);
      this.crackMesh.setMatrixAt(c.i, _m.compose(_w, _q, _s.set(s, s, s)));
      this.crackMesh.setColorAt(c.i, _col.copy(HOT).lerp(EMBER, Math.min(1, u * 1.6)).multiplyScalar(2 * (1 - u) ** 1.3));
    }
  }

  dispose() {
    this.clear(); this.group?.parent?.remove(this.group);
    for (const m of this.meshes || []) m.geometry.dispose();
    for (const m of [this.stone, this.glow, this.glassMat]) m?.dispose();
  }
}
