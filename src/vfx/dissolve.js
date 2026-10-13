// ---------------------------------------------------------------------------------------
// DISSOLVE: what a zandatsu leaves of a creature. Its body is cut along the blade's planes into pieces (the mesh slicer: slicing.js),
// the pieces fly apart in the slow air, and in under a second each comes undone into Lachryma: LIQUID (baubles, already turned:
// the drops that refill the Courier) and SOLID (cubes: their money), thrown out of it as it shrinks and darkens to nothing, and drawn to
// them. Nothing of it is left lying about. As they fly, each piece first shows what it is made of (a Figment's scatter, its first
// beats: vfx/figmentscatter.js): two steps through a coarser grid and one beat of its wire; where it ends, its motes of Lachryma in its
// feeling's colour go into the air and the ground. `visual.glitch` off: no steps and no wire.
//
// Prior art: Kingdom Hearts' Heartless (a defeated one comes apart into dark mist and a fountain of HP and MP orbs and munny that fly
// to Sora), Metal Gear Rising's zandatsu (the pieces in the slowed air), and the sixth generation's way of making a death a reward you
// can see and hear.
//
//   game.dissolve.cut(geometry (world space; position, and colour if it has one), planes, { centre, color, worth, mp })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { splitTriangles, toGeometry } from '../tools/slicing.js';
import { sfx } from '../audio/sfx.js';
import { T } from '../core/config.js';
import { SCATTER, snapGeometry, figmentColour } from './figmentscatter.js';

const LIFE = 0.85;
const _v = new THREE.Vector3(), _o = new THREE.Vector3();
const MIND_LINE = 0x5087fa; // (the Mind's line colour, as the scatter's wire)

export class Dissolve {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x2a1450, emissiveIntensity: 0 });
  }

  /** Cut `geo` (world space) by every plane in turn, and let the pieces go. */
  cut(geo, planes, { centre, color = 0xd9b48a, worth = 6, mp = 8 } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.color) { const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
    // the pieces, each a list of triangles in world space; each plane splits every piece it passes through, and the cut face is closed
    let pieces = [{ pos: Array.from(g.attributes.position.array), col: Array.from(g.attributes.color.array) }];
    const inner = new THREE.Color(color).multiplyScalar(0.55);
    for (const pl of planes) {
      const next = [];
      for (const p of pieces) {
        const tmp = new THREE.BufferGeometry();
        tmp.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3)); tmp.setAttribute('color', new THREE.Float32BufferAttribute(p.col, 3));
        const s = splitTriangles(tmp, pl);
        for (const side of [s.a, s.b]) { if (side.pos.length < 9) continue; capFan(side, inner); next.push(side); }
      }
      if (next.length) pieces = next;
    }
    const share = pieces.length, feel = figmentColour(centre), steps = T.visual?.glitch !== false;
    for (const p of pieces) {
      const { geometry, center } = toGeometry(p);
      const m = new THREE.Mesh(geometry, this.mat.clone());
      m.position.copy(center); m.castShadow = false;
      this.game.scene.add(m);
      const out = _v.copy(center).sub(centre); out.y = 0; if (out.lengthSq() < 1e-4) out.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      const vel = out.normalize().multiplyScalar(2 + Math.random() * 1.5).add(new THREE.Vector3(0, 2.2 + Math.random() * 1.5, 0));
      const spin = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(9);
      this.list.push({ m, vel, spin, t: 0, mp: Math.max(1, Math.round(mp / share)), worth: Math.max(1, Math.round(worth / share)), let: 0, feel, motes: Math.ceil(SCATTER.motes / share), stage: steps ? -1 : 3, geo: m.geometry });
    }
    sfx.rainstick?.(this.game.listenerDistance(centre), 0.9);
  }

  update(dt) {
    const g = this.game;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i]; q.t += dt;
      const k = q.t / LIFE;
      q.vel.y -= 6 * dt; q.vel.multiplyScalar(Math.exp(-1.5 * dt));
      q.m.position.addScaledVector(q.vel, dt);
      q.m.rotation.x += q.spin.x * dt; q.m.rotation.y += q.spin.y * dt; q.m.rotation.z += q.spin.z * dt;
      // undone from the outside in: it shrinks and darkens, and lets its Lachryma out as it goes
      const s = Math.max(0.001, 1 - k * k);
      q.m.scale.setScalar(s);
      q.m.material.emissiveIntensity = 1.6 * k; q.m.material.color.setScalar(1 - 0.8 * k);
      if (q.stage < 3) this.scatterStep(q);
      if (Math.random() < dt * 30) g.fx?.alpha?.emit?.({ pos: q.m.position.clone(), vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.8, (Math.random() - 0.5) * 0.6), life: 0.6, size: 0.08, sizeEnd: 0.02, color: new THREE.Color(0x3a2466), alpha: 0.7, drag: 1.5 });
      if (q.let === 0 && k > 0.35) { q.let = 1; g.baubles?.spawn(q.m.position.clone(), q.mp, { ox: 1, up: 2.2, spread: 0.5 }); }
      if (k >= 1) {
        g.cubes?.burst?.(q.m.position.clone(), q.worth, { count: Math.min(4, q.worth), up: 3, from: 'zandatsu' });
        g.figmentScatter?.motes(q.m.position.clone(), q.feel, q.motes);
        g.scene.remove(q.m); q.m.geometry.dispose(); if (q.geo !== q.m.geometry) q.geo.dispose(); q.m.material.dispose();
        this.list.splice(i, 1);
      }
    }
  }

  /** A piece's first beats (a Figment's scatter): snapped twice, coarser each time, then its wire for a beat, then itself again. */
  scatterStep(q) {
    const S = SCATTER, M = q.m.material, stage = q.t < S.snap ? 0 : q.t < 2 * S.snap ? 1 : q.t < 2 * S.snap + S.wire ? 2 : 3;
    if (stage === 2) { M.color.setScalar(0); M.emissiveIntensity = 1.6; } // (the wire's colour holds over the fade above)
    if (stage === q.stage) return;
    if (q.m.geometry !== q.geo) q.m.geometry.dispose();
    q.m.geometry = q.geo; M.wireframe = false; M.emissive.setHex(0x2a1450);
    if (stage <= 1) {
      if (!q.geo.boundingBox) q.geo.computeBoundingBox();
      const s = q.geo.boundingBox.getSize(_o).length() * S.steps[stage] * 1.5, j = s * S.jitter; // (a piece is smaller than a body: its grid a little coarser for it)
      q.m.geometry = snapGeometry(q.geo, s, _o.set((Math.random() - 0.5) * j, (Math.random() - 0.5) * j, (Math.random() - 0.5) * j));
    } else if (stage === 2) { M.wireframe = true; M.emissive.setHex(MIND_LINE); M.color.setScalar(0); M.emissiveIntensity = 1.6; }
    q.stage = stage;
  }
}

/** Close a cut piece: a fan of triangles from the middle of its cut edges (good enough for a body that is near convex). */
function capFan(side, color) {
  if (!side.segs.length) return;
  const c = new THREE.Vector3();
  for (const s of side.segs) c.add(s.p).add(s.q);
  c.multiplyScalar(1 / (side.segs.length * 2));
  for (const s of side.segs) for (const p of [c, s.p, s.q]) { side.pos.push(p.x, p.y, p.z); side.col.push(color.r, color.g, color.b); }
}
