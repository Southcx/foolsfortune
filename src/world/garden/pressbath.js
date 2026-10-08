// ---------------------------------------------------------------------------------------
// THE PRESS'S BATH, A STAND-IN (docs/plans/SOUL-ALCHEMY.md 4.4 to 4.10; the real look is Calissa's: vfx/alchemy/basin.js, bath.js,
// paths.js and vfx/wheelcolour.js, not built yet). Simple shapes that hold the geometry the station's logic needs, so the press can be
// played and tested now and every part swapped for hers without the logic changing:
//   the BASIN (5 m across, its grey centre), the KERB (a basalt ring 0.45 m wide), the WARE RING (a step outside it, a hand lower),
//   the seven TILES (each at its hue's bearing, its width its rank's radius, its SPREAD out to its radius now, its HEART a quarter of
//   the bare radius), the SOUL BEAD and the GHOST BEAD (a hollow ring), the GHOST PATHS (lines in the colours they pass through), the
//   LINE BLEND's droplets, and the LUMPS on the ware ring and carried by the hand.
// Every colour comes from `colourOf(h, s)` (a stand-in for her `wheelColour`), so a bead and its tile are the same function.
//
// Prior art: the section 4 labels (test tiles in a glaze bath, the tsukubai, Albers' neutral ground, Potion Craft's previewed path).
//
//   const B = new PressBath(frame, parent)   frame: { O, U, N, E, R (the bath's radius) }   B.at(h, s, out) -> world point
//   B.tiles(list)   B.bead(c)   B.ghost(trail, n)   B.queue(trail)   B.drop(c)   B.clearDrops()   B.lumps(list)   B.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export const NORTH_HUE = 354.5; // (the press stands over the gap between Resilience and Willpower: 4.4)
export const colourOf = (h, s, out = new THREE.Color()) => out.setHSL(h / 360, Math.min(1, s), 0.5 - 0.12 * (1 - Math.min(1, s))); // (stand-in for wheelColour)
const MAXDROPS = 64, MAXLUMPS = 96, _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();

export class PressBath {
  constructor(frame, parent) {
    this.f = frame; const { O, U, R } = frame;
    const g = this.group = new THREE.Group(); g.name = 'press-bath'; parent.add(g);
    g.position.copy(O); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(frame.E, U, frame.N.clone().negate())); // (local x east, y up, -z north)
    const flat = (r0, r1, color, y, seg = 64) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, seg).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, name: 'press-stand-in' })); m.position.y = y; g.add(m); return m; };
    flat(0.001, R, 0x101014, 0.005); flat(0.001, 0.125, 0x8a8682, 0.012); // (the dished bath, near black; the grey centre's bare clay)
    flat(R, R + 0.45, 0x2a2826, 0.04); flat(R + 0.45, R + 0.95, 0x4a4540, -0.06); // (the kerb; the ware ring, a hand lower)
    // the tiles: a disc in its glaze, a spread ring to its radius now, a heart ring
    this.tile = []; for (let i = 0; i < 7; i++) {
      const t = { disc: flat(0.001, 1, 0xffffff, 0.02, 40), spread: flat(0.97, 1, 0xffffff, 0.022, 48), heart: flat(0.86, 1, 0xffffff, 0.026, 32) };
      t.spread.material.transparent = true; t.spread.material.opacity = 0.55; this.tile.push(t);
    }
    const bead = this.beadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), new THREE.MeshBasicMaterial({ color: 0x888888 })); g.add(bead);
    this.ghostRing = flat(0.07, 0.1, 0xffffff, 0.05, 32);
    const line = (op) => { const L = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: op })); L.frustumCulled = false; g.add(L); return L; };
    this.queueLine = line(0.5); this.ghostLine = line(0.95);
    this.drops = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }), MAXDROPS); this.drops.count = 0; g.add(this.drops);
    this.lumpMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), MAXLUMPS); this.lumpMesh.count = 0; g.add(this.lumpMesh);
    this.nDrops = 0;
  }

  /** A colour's place on the bath, in the bath's own frame (y up): hue the bearing clockwise from north, saturation the distance out. */
  local(h, s, out = new THREE.Vector3()) { const b = ((h - NORTH_HUE) * Math.PI) / 180, r = Math.min(1, s) * this.f.R; return out.set(Math.sin(b) * r, 0.03, -Math.cos(b) * r); }
  at(h, s, out = new THREE.Vector3()) { return this.group.localToWorld(this.local(h, s, out)); }

  /** The tiles: [{ h, s, r (radius now, distance units), bare (the rank's radius), active }] (distance units: half the wheel's chord). */
  tiles(list) {
    list.forEach((t, i) => {
      const T = this.tile[i]; if (!T) return; const p = this.local(t.h, t.s), m = 2 * this.f.R; // (a radius r is r x 2 x R metres)
      colourOf(t.h, t.s, _c);
      for (const [mesh, rad] of [[T.disc, t.bare * m], [T.spread, t.r * m], [T.heart, (t.bare * m) / 4]]) { mesh.position.set(p.x, mesh.position.y, p.z); mesh.scale.setScalar(Math.max(0.01, rad)); }
      T.disc.material.color.copy(_c); T.spread.material.color.copy(_c).offsetHSL(0, 0, 0.25); T.heart.material.color.setRGB(1, 1, 1);
      T.spread.visible = t.r > t.bare * 1.01;
    });
  }
  bead(c) { this.local(c.h, c.s, this.beadMesh.position); this.beadMesh.position.y = 0.08; colourOf(c.h, c.s, this.beadMesh.material.color); if (c.s < 0.03) this.beadMesh.material.color.set(0x8a8682); }
  /** A path as a line in the colours it passes through. */
  setLine(L, trail) {
    const pos = new Float32Array(trail.length * 3), col = new Float32Array(trail.length * 3), v = new THREE.Vector3();
    trail.forEach((c, i) => { this.local(c.h, c.s, v); pos.set([v.x, 0.045, v.z], i * 3); colourOf(c.h, c.s, _c); col.set([_c.r, _c.g, _c.b], i * 3); });
    L.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); L.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); L.geometry.computeBoundingSphere(); L.visible = trail.length > 1;
  }
  /** The hovered lump's ghost path and its ghost bead (null: none). */
  ghost(trail) {
    if (!trail || trail.length < 2) { this.ghostLine.visible = false; this.ghostRing.visible = false; return; }
    this.setLine(this.ghostLine, trail); const e = trail[trail.length - 1]; this.local(e.h, e.s, this.ghostRing.position); this.ghostRing.position.y = 0.05;
    colourOf(e.h, e.s, this.ghostRing.material.color); this.ghostRing.visible = true;
  }
  queue(trail) { if (!trail || trail.length < 2) { this.queueLine.visible = false; return; } this.setLine(this.queueLine, trail); }
  /** The line blend: a droplet where the bead stood, in its colour then. */
  drop(c) {
    const i = this.nDrops++ % MAXDROPS, v = this.local(c.h, c.s); _m.compose(_s.set(v.x, 0.015, v.z), _q.identity(), new THREE.Vector3(1, 1, 1));
    this.drops.setMatrixAt(i, _m); this.drops.setColorAt(i, colourOf(c.h, c.s, _c)); this.drops.count = Math.min(MAXDROPS, this.nDrops);
    this.drops.instanceMatrix.needsUpdate = true; if (this.drops.instanceColor) this.drops.instanceColor.needsUpdate = true;
  }
  clearDrops() { this.nDrops = 0; this.drops.count = 0; }
  /** The lumps: [{ pos (world), h, s, big }]. */
  lumps(list) {
    const n = Math.min(MAXLUMPS, list.length), inv = this.group.matrixWorld.clone().invert();
    for (let i = 0; i < n; i++) { const L = list[i], v = L.pos.clone().applyMatrix4(inv); _m.compose(v, _q.identity(), _s.setScalar(L.big ? 1.4 : 1)); this.lumpMesh.setMatrixAt(i, _m); this.lumpMesh.setColorAt(i, colourOf(L.h, L.s, _c)); }
    this.lumpMesh.count = n; this.lumpMesh.instanceMatrix.needsUpdate = true; if (this.lumpMesh.instanceColor) this.lumpMesh.instanceColor.needsUpdate = true;
  }
  dispose() { this.group.removeFromParent(); this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
}
