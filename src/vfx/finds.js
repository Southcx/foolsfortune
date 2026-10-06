// ---------------------------------------------------------------------------------------
// THE FINDS: what the town that was left under the sand (docs/plans/DUNEMAW.md; Espada: the artifacts are what the boom bought; Dovina:
// 2, 3 and 4 a floor, and one warped artifact a floor worth three times as much). The look of the artifacts and of the warp round the
// one that changes things.
//
//   ARTIFACTS   gilded things set in the walls and half buried, each glinting now and then so the eye finds it across a cavern: the
//               LAMP (an oil lamp: the Cave of Wonders' one rule, "touch nothing but the lamp"), the EWER, the MASK, the COINS
//   THE WARP    round a warped artifact the place shows its data (Dovina: "give the warped pocket a look that says 'this changes
//               things'"): the artifact is doubled in the code's cyan and magenta, jumping in steps (the glitch's tear, in the world);
//               grains of sand fall UP round it; a ring on the ground turns slowly. It reads before it is touched (the Dreamvane hears
//               it, Divination names it: Dovina's)
//
// Prior art: the Cave of Wonders' treasure and its lamp (Aladdin, 1992), Zelda's and Uncharted's glint on a pickup (a sparkle that says
// "take me"), .hack's corrupted objects (a thing doubled and torn in colour), and Inception's "a totem": the one thing in a place that
// says the rules are different here.
//
//   artifact(kind: 'lamp' | 'ewer' | 'mask' | 'coins') -> { group, update(t) }        new WarpPocket(target: Object3D)   .update(t)   .dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const GOLD = () => new THREE.MeshStandardMaterial({ name: 'find-gold', color: 0xd8a640, metalness: 0.9, roughness: 0.28 });
const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/** A glint: two crossed quads that flash for a moment every few seconds, at the artifact's brightest point. */
function glint() {
  const m = new THREE.MeshBasicMaterial({ name: 'find-glint', color: 0xfff2c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const g = new THREE.PlaneGeometry(0.02, 0.36), a = new THREE.Mesh(g, m), b = new THREE.Mesh(g, m); b.rotation.z = Math.PI / 2;
  const s = new THREE.Group(); s.add(a, b); s.name = 'find-glint';
  return { s, m };
}

export function artifact(kind = 'lamp') {
  const group = new THREE.Group(); group.name = `artifact-${kind}`;
  const gold = GOLD();
  let top = 0.15;
  if (kind === 'lamp') { // (an oil lamp: a low belly, a long spout, a ring handle, a lid)
    group.add(new THREE.Mesh(lathe([[0.001, 0], [0.09, 0.02], [0.12, 0.06], [0.09, 0.1], [0.04, 0.12], [0.03, 0.14], [0.001, 0.16]]), gold));
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22, 10), gold); spout.rotation.z = Math.PI / 2 + 0.35; spout.position.set(0.17, 0.08, 0); group.add(spout);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16), gold); handle.position.set(-0.13, 0.08, 0); group.add(handle);
    top = 0.16;
  } else if (kind === 'ewer') { // (a tall gilded ewer: a pear body, a neck, a lip, a handle)
    group.add(new THREE.Mesh(lathe([[0.001, 0], [0.07, 0.01], [0.11, 0.08], [0.09, 0.18], [0.04, 0.26], [0.035, 0.34], [0.06, 0.38], [0.05, 0.39]]), gold));
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI), gold); h.rotation.z = -Math.PI / 2; h.position.set(-0.08, 0.24, 0); group.add(h);
    top = 0.39;
  } else if (kind === 'mask') { // (a gilded face, its eyes dark)
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), gold); face.rotation.x = -Math.PI / 2; face.scale.set(1, 1, 0.5); face.position.y = 0.16; group.add(face);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), new THREE.MeshBasicMaterial({ color: 0x0a0608 })); e.position.set(s * 0.05, 0.19, 0.072); group.add(e); }
    top = 0.3;
  } else { // coins: a few stacks, one fallen
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012 * (5 + i * 3), 14), gold); c.position.set(Math.cos(i * 2) * 0.07, 0.006 * (5 + i * 3), Math.sin(i * 2) * 0.07); group.add(c); }
    top = 0.12;
  }
  const G = glint(); G.s.position.set(0.02, top, 0.03); group.add(G.s);
  const phase = Math.random() * 5;
  return {
    group,
    update(t, camera) {
      const k = ((t + phase) % 4.5) / 4.5, flash = k < 0.06 ? Math.sin((k / 0.06) * Math.PI) : 0; // (a glint every 4.5 real seconds)
      G.m.opacity = flash; G.s.visible = flash > 0.01;
      if (camera && G.s.visible) G.s.quaternion.copy(camera.quaternion); G.s.rotation.z += 0.0; G.s.scale.setScalar(0.5 + flash);
    },
  };
}

const SAND_UP = 40;
export class WarpPocket {
  /** The warp round `target` (the warped artifact's group): its double in cyan and magenta, sand falling up, a ring turning. */
  constructor(target, { radius = 1.4 } = {}) {
    this.target = target; this.r = radius;
    const ghost = (color) => {
      const m = new THREE.MeshBasicMaterial({ name: 'warp-ghost', color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
      const c = target.clone(true); c.traverse((o) => { if (o.isMesh) o.material = m; if (o.name === 'find-glint') o.visible = false; }); c.name = 'warp-ghost';
      return c;
    };
    this.cyan = ghost(0x2ee8ff); this.mag = ghost(0xff3fd2);
    target.add(this.cyan, this.mag);
    // grains of sand falling up round it
    const pos = new Float32Array(SAND_UP * 3); this.seeds = Array.from({ length: SAND_UP }, () => [Math.random() * Math.PI * 2, 0.3 + Math.random() * radius, Math.random()]);
    this.sand = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ name: 'warp-sand', color: 0xe8c890, size: 0.05 }));
    this.sand.frustumCulled = false; target.add(this.sand);
    // a ring on the ground, turning: the place is not still here
    const rg = new THREE.RingGeometry(radius * 0.9, radius, 48, 1, 0, Math.PI * 1.6); rg.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ name: 'warp-ring', color: 0xb58cff, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.ring.position.y = 0.02; target.add(this.ring);
    this.step = -1;
  }

  update(t) {
    const s = Math.floor(t * 7); // (the tear jumps in steps, 7 a second: the glitch's stutter)
    if (s !== this.step) {
      this.step = s; const h = (n) => (Math.sin(s * 12.9898 + n * 78.233) * 43758.5453) % 1;
      const k = Math.abs(h(1)) < 0.25 ? 0.12 : 0.035; // (now and then a bigger jump)
      this.cyan.position.set(h(2) * k, h(3) * k * 0.5, h(4) * k); this.mag.position.set(-h(2) * k, -h(5) * k * 0.5, -h(4) * k);
    }
    const p = this.sand.geometry.attributes.position;
    this.seeds.forEach(([a, r, ph], i) => { const y = ((t * 0.5 + ph) % 1) * 2.2; p.setXYZ(i, Math.cos(a + t * 0.2) * r, y, Math.sin(a + t * 0.2) * r); });
    p.needsUpdate = true;
    this.ring.rotation.y = t * 0.4;
  }

  dispose() { for (const o of [this.cyan, this.mag, this.sand, this.ring]) { this.target.remove(o); o.traverse?.((q) => { q.geometry?.dispose?.(); q.material?.dispose?.(); }); } }
}
