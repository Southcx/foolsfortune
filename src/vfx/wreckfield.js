// ---------------------------------------------------------------------------------------
// THE WRECK FIELD: what is left of the False Light on the crude when she goes down (docs/plans/RAIL-OVERHAUL.md section 6, the Wreckers:
// "a chase through her own wreck field"; docs/GLOSSARY.md: the wreck field). Her planks and spars, her casks, her gratings, rags of her
// canvas, her figurehead face down, a few pieces still burning: strewn along the line she sank on, with a way through them that wanders
// as wreckage drifts, so the chase after her hold has a way through and a reason to weave.
//
//   THE PIECES   four kinds drawn as instances (planks, spars, casks, gratings: one draw a kind), five rags of canvas and the figurehead
//                as meshes; each rides the swells (the sea's own `heightAt`), turns slowly and rolls with the sea
//   THE WAY THROUGH  a clear way along the field, swinging side to side (a sine of the field's length): the pieces keep out of it
//   SPILL        0 .. 1: how much of her is in the water, the pieces surfacing along the field in order, as she breaks up going down
//   BURNING      a few pieces still alight: an ember glow on them (a halo, never a flash), dying as the field ages
//
// Prior art: Assassin's Creed IV (a sunk ship's flotsam to sail through and pick from), Sid Meier's Pirates! (the hold spilling), the
// R-Type and Gradius debris corridors (wreckage as a route), and Phantom Storm's chase back past the Pirate Ship's place.
//
//   const W = new WreckField({ length, width, count, seed })   W.group (its own frame: +Z along the field from z 0 to `length`, the
//   waterline at y 0)   W.spill(k)   W.update(rawDt, sea)   W.count   W.pieceWorld(i, out)   W.way(z) (the way through's x at z)   W.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { haloTexture } from './lighthouselamp.js';

const KINDS = ['plank', 'spar', 'cask', 'grating'];
const TINT = { plank: [0x2a2019, 0x3a2c22, 0x1d1715], spar: [0x2b211b, 0x3a2c22], cask: [0x4a2f1c, 0x3a2414], grating: [0x2f241c, 0x241b15] };

export class WreckField {
  constructor({ length = 120, width = 26, count = 64, seed = 5 } = {}) {
    this.length = length; this.width = width; this.t = 0; this.k = 0;
    this.group = new THREE.Group(); this.group.name = 'wreck-field';
    this.geos = []; this.mats = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const rnd = mulberry(seed);
    const geo = {
      plank: track(new THREE.BoxGeometry(0.32, 0.08, 3.2)),
      spar: track(new THREE.CylinderGeometry(0.1, 0.13, 7, 6).rotateX(Math.PI / 2)),
      cask: track(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10).rotateZ(Math.PI / 2)),
      grating: track(new THREE.BoxGeometry(1.6, 0.12, 1.6)),
    };
    const mat = track(new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.4, flatShading: true, emissive: 0x120e16 })); // (shares its program with Old Nobody's barnacles)
    // the pieces: kept out of the way through, thickest near the line she sank on
    this.pieces = [];
    for (let i = 0; i < count; i++) {
      const kind = KINDS[i % 7 < 3 ? 0 : i % 7 < 5 ? 1 : i % 7 < 6 ? 2 : 3], z = rnd() * length;
      let x = (rnd() - 0.5) * width * (0.4 + 0.6 * rnd()); const lx = this.way(z);
      if (Math.abs(x - lx) < 3.2) x = lx + Math.sign(x - lx || 1) * (3.2 + rnd() * 2);
      this.pieces.push({ kind, x, z, yaw: rnd() * 6.28, spin: (rnd() - 0.5) * 0.3, roll: rnd() * 6.28, s: 0.7 + rnd() * 0.6, at: z / length, burn: rnd() < 0.08, y: -3 });
    }
    this.inst = {};
    for (const kind of KINDS) {
      const list = this.pieces.filter((p) => p.kind === kind); if (!list.length) continue;
      const m = new THREE.InstancedMesh(geo[kind], mat, list.length); m.name = `wreck-${kind}`; m.frustumCulled = false; m.castShadow = true;
      list.forEach((p, j) => { p.slot = j; m.setColorAt(j, _c.setHex(TINT[kind][j % TINT[kind].length])); });
      this.group.add(m); this.inst[kind] = { m, list };
    }
    // the rags of her canvas, and her figurehead face down
    const sail = track(new THREE.MeshStandardMaterial({ color: 0x6f6862, roughness: 0.95, flatShading: true, side: THREE.DoubleSide })); // (the deck's program: flat, both sides)
    this.rags = [];
    for (let i = 0; i < 5; i++) {
      const g = track(new THREE.PlaneGeometry(2.6 + rnd() * 1.6, 1.8 + rnd(), 4, 3).rotateX(-Math.PI / 2)), P = g.attributes.position;
      for (let v = 0; v < P.count; v++) P.setY(v, (rnd() - 0.5) * 0.25);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, sail), z = (i + 0.5) / 5 * length; m.name = 'wreck-rag'; this.group.add(m);
      this.rags.push({ m, x: this.way(z) + (i % 2 ? 1 : -1) * (4 + rnd() * 5), z, yaw: rnd() * 6.28, at: z / length, roll: rnd() * 6.28, y: -3 });
    }
    const tar = track(new THREE.MeshStandardMaterial({ color: 0x1d1715, roughness: 0.6, flatShading: true }));
    this.fig = new THREE.Group(); this.fig.name = 'wreck-figurehead'; this.group.add(this.fig);
    const robe = new THREE.Mesh(track(new THREE.CylinderGeometry(0.34, 0.2, 1.7, 7)), tar); robe.rotation.x = Math.PI / 2; this.fig.add(robe);
    const hood = new THREE.Mesh(track(new THREE.SphereGeometry(0.34, 8, 6)), tar); hood.position.z = 1.05; this.fig.add(hood);
    const fz = length * 0.38; this.figAt = { x: this.way(fz) + 5.5, z: fz, at: 0.38, roll: 1, y: -3 };
    // the embers on the burning pieces
    this.emberMat = track(new THREE.SpriteMaterial({ color: 0xff8a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: haloTexture() }));
    this.embers = this.pieces.filter((p) => p.burn).slice(0, 6).map((p) => { const s = new THREE.Sprite(this.emberMat); s.scale.setScalar(2.4); this.group.add(s); return { s, p }; });
    this.count = this.pieces.length;
    this.spill(0); this.update(0);
  }

  /** The way through's x at z (field frame): it swings side to side as wreckage drifts. */
  way(z) { return Math.sin((z / this.length) * Math.PI * 2.5) * this.width * 0.18; }
  /** How much of her is in the water (0 .. 1): the pieces surface along the field in order. */
  spill(k) { this.k = THREE.MathUtils.clamp(k, 0, 1); }
  pieceWorld(i, out = new THREE.Vector3()) { const p = this.pieces[i]; return this.group.localToWorld(out.set(p.x, p.y, p.z)); }

  update(raw = 1 / 60, sea = null) {
    this.t += raw; const t = this.t, G = this.group; G.updateMatrixWorld(true);
    const gy = _g.setFromMatrixPosition(G.matrixWorld).y, wave = (x, z) => { if (!sea?.heightAt) return 0; _w.set(x, 0, z).applyMatrix4(G.matrixWorld); return sea.heightAt(_w.x, _w.z) - gy; }; // (the sea's height in the world, as the field's own y)
    const float = (p, sink) => { const due = this.k * 1.15 - p.at, up = THREE.MathUtils.clamp(due / 0.15, 0, 1); p.y = THREE.MathUtils.lerp(-3, wave(p.x, p.z) - sink, up * up * (3 - 2 * up)); return up; };
    for (const { m, list } of Object.values(this.inst)) {
      for (const p of list) {
        const up = float(p, p.kind === 'cask' ? 0.1 : 0.02); p.yaw += p.spin * raw;
        _q.setFromEuler(_e.set(Math.sin(t * 0.7 + p.roll) * 0.12, p.yaw, Math.sin(t * 0.9 + p.roll * 1.3) * 0.15));
        m.setMatrixAt(p.slot, _m.compose(_v.set(p.x, p.y, p.z), _q, _s.setScalar(p.s * (up > 0.01 ? 1 : 0.0001))));
      }
      m.instanceMatrix.needsUpdate = true;
    }
    for (const r of this.rags) { const up = float(r, -0.02); r.m.visible = up > 0.01; r.m.position.set(r.x, r.y, r.z); r.m.rotation.set(Math.sin(t * 0.6 + r.roll) * 0.06, r.yaw, Math.sin(t * 0.8 + r.roll) * 0.05); }
    const fu = float(this.figAt, 0.15); this.fig.visible = fu > 0.01; this.fig.position.set(this.figAt.x, this.figAt.y, this.figAt.z); this.fig.rotation.set(Math.sin(t * 0.5) * 0.1, 0.8, Math.PI * 0.85 + Math.sin(t * 0.7) * 0.08); // (face down)
    const glow = Math.max(0, 1 - Math.max(0, this.k - 0.6) * 0.8);
    for (const e of this.embers) { e.s.visible = e.p.y > -0.5; e.s.position.set(e.p.x, e.p.y + 0.5, e.p.z); }
    this.emberMat.opacity = 0.55 * glow * (0.85 + 0.15 * Math.sin(t * 2.3));
  }

  dispose() { this.group.parent?.remove(this.group); for (const g of this.geos) g.dispose(); for (const m of this.mats) m.dispose(); for (const { m } of Object.values(this.inst)) m.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _g = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _c = new THREE.Color();
