// ---------------------------------------------------------------------------------------
// LURE MODELS: the six made lures as things (placeholders until the maker draws them): each a few primitives, flat-shaded like the rest
// of the workshop, a hand's width long at most, with the ring a line is tied to. The same model is the slot's picture
// (pneuka/icons.js renders it once), what the Courier holds in them free hand with the rod out (tools/sondelass/sondelass.js), and what is on
// the line.
//
//   bob    a pellet of the workshop's clay, banded, on a wire eye            eye    a black glazed bead with a pale ring: it looks back
//   fly    gold thread on a hook, two wings of feather                       tear   a teardrop of grey-blue glaze, fired from a kept jar
//   spoon  a bent spoon, still warm (its bowl glows faintly)                 bell   a fingernail chime, its clapper hanging
//
// Prior art: the fly and the spoon and the bobber of every fishing game's tackle box (Animal Crossing's, Stardew Valley's, Final
// Fantasy XIV's baits), modelled the PS2 way: a dozen faces each, the colour in the material.
//
//   buildLure(id) -> { group, dispose() }     (id 'bob' | 'eye' | ... or 'lure.bob' ...)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: true, ...o });

/** The wire eye the line is tied to: a small ring on top. */
function eyeRing(g, y, m) {
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0035, 5, 10), m);
  r.position.y = y; g.add(r);
  return r;
}

const BUILD = {
  bob(g) {
    const clay = mat(0xc9774e), band = mat(0xe8c9a0), wire = mat(0x8a8f96, { metalness: 0.6, roughness: 0.4 });
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1), clay); g.add(b);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0365, 0.0365, 0.012, 12), band); g.add(s);
    eyeRing(g, 0.045, wire);
  },
  eye(g) {
    const glaze = mat(0x141018, { roughness: 0.15, metalness: 0.2 }), iris = mat(0xe8dcc8, { roughness: 0.3 }), wire = mat(0x8a8f96, { metalness: 0.6, roughness: 0.4 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), glaze); b.scale.set(1, 0.9, 1); g.add(b);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 5, 14), iris); ring.position.z = 0.03; g.add(ring);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), mat(0x050308)); pupil.position.z = 0.0335; g.add(pupil);
    eyeRing(g, 0.04, wire);
  },
  fly(g) {
    const gold = mat(0xd9a63c, { metalness: 0.5, roughness: 0.35 }), feather = mat(0xf2e3c4, { side: THREE.DoubleSide }), steel = mat(0x9aa0a8, { metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.013, 0.06, 8), gold); g.add(body);
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 4), feather);
      w.scale.set(1, 1, 0.25); w.position.set(s * 0.016, 0.022, -0.004); w.rotation.z = -s * 0.5; g.add(w);
    }
    // the hook under it: a bent wire
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0025, 4, 10, Math.PI * 1.3), steel);
    hook.position.set(0, -0.04, 0); hook.rotation.z = Math.PI * 0.85; g.add(hook);
    eyeRing(g, 0.038, steel);
  },
  tear(g) {
    const glaze = mat(0x6f8aa0, { roughness: 0.2, metalness: 0.1 }), wire = mat(0x8a8f96, { metalness: 0.6, roughness: 0.4 });
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.03 * (1 - t * 0.55) + 0.0005, -0.035 + t * 0.075 + (t > 0.85 ? (t - 0.85) * 0.06 : 0))); }
    const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 10), glaze); g.add(b);
    eyeRing(g, 0.05, wire);
  },
  spoon(g) {
    const brass = mat(0xb87333, { metalness: 0.65, roughness: 0.35, emissive: 0x5a1c08, emissiveIntensity: 0.5 }), wire = mat(0x8a8f96, { metalness: 0.6, roughness: 0.4 });
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), brass);
    bowl.scale.set(0.8, 0.5, 1.3); bowl.rotation.x = Math.PI; bowl.position.y = -0.02; g.add(bowl);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.06, 0.003), brass);
    handle.position.y = 0.022; handle.rotation.x = 0.35; g.add(handle);
    eyeRing(g, 0.056, wire);
  },
  bell(g) {
    const tin = mat(0xc8ccd2, { metalness: 0.7, roughness: 0.3 }), dark = mat(0x3a3530, { metalness: 0.4 });
    const pts = [new THREE.Vector2(0.001, 0.03), new THREE.Vector2(0.012, 0.028), new THREE.Vector2(0.018, 0.012), new THREE.Vector2(0.022, -0.012), new THREE.Vector2(0.03, -0.024), new THREE.Vector2(0.026, -0.026)];
    const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), tin); b.material.side = THREE.DoubleSide; g.add(b);
    const clap = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 5), dark); clap.position.y = -0.026; g.add(clap);
    eyeRing(g, 0.04, tin);
  },
};

export function buildLure(id) {
  const key = String(id).replace(/^lure\./, '');
  const group = new THREE.Group();
  (BUILD[key] || BUILD.bob)(group);
  // (no outline: the inverted hull is a fixed width in the world, a lure is three centimetres across, and it would be all outline)
  return {
    group,
    dispose() { group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose?.(); } }); },
  };
}
