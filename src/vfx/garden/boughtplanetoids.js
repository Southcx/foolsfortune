// ---------------------------------------------------------------------------------------
// THE BOUGHT PLANETOIDS' LOOKS (the glossary: the ring, a bought planetoid; world/garden/orbit.js BOUGHT, Espada's names in
// npc/realmnames.js): the four planetoids bought at the shed and set in the ring round the Dantian each get a skin, a shape and a
// dressing of their own (until now they wore the Mulberry Grove's colours with nothing on them). Read by vfx/garden/planetoid.js
// through BOUGHT_LOOKS: `palette` (its skin's top, low and rock), `shape(x, y, z, r)` (its unsculpted radius in units of R, from the
// common hills `r`) and `dress(look, at, std)` (its props: `at(obj, x, y, z, lift)` stands one on the surface; `std(color, o)` makes a
// standard material; all of it merged as the first six are):
//
//   moon     the Moonflower Moon, 9 m: pale lilac regolith pocked with craters, moonstones in their rims (the moonflower bed opens by
//            night on its own plot: progress/realm.js, Petra's)
//   koi      the Koi Pond, 12 m: a clear teal pond in its crown's hollow, lily pads and a few pink lotus on it, a ring of stones
//   drills   the Drill Yard, 14 m: packed sandy earth, its crown flattened to a sparring floor ringed with wooden posts and two
//            banners
//   fossils  the Bone Bed, 16 m: bone-white stone, a fossil spine of ribs breaking the ground along a meridian
//
// Prior art: Super Mario Galaxy's themed planetoids (one readable idea each), the Comet Observatory's domes added as the game opens,
// Dual Hearts' pastel isles, and the fossil beds of Dinosaur Provincial Park (ribs weathering out of the ground).
//
//   import { BOUGHT_LOOKS } from './boughtplanetoids.js'   BOUGHT_LOOKS[kind] -> { palette, shape, dress } | undefined
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const CRATERS = [[0.3, 0.8, 0.5, 0.24], [-0.7, 0.4, 0.3, 0.18], [0.2, -0.1, -0.95, 0.3], [-0.4, 0.6, -0.7, 0.16], [0.85, 0.1, 0.45, 0.2]].map(([x, y, z, s]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l, s]; });

export const BOUGHT_LOOKS = {
  moon: {
    palette: { top: 0xe0dcef, low: 0xc4bcd8, rock: 0x8e86a6 },
    shape(x, y, z, r) {
      for (const [cx, cy, cz, s] of CRATERS) { const a = Math.acos(Math.max(-1, Math.min(1, x * cx + y * cy + z * cz))); r += -0.045 * Math.exp(-((a / s) ** 2) * 2.2) + 0.02 * Math.exp(-(((a - s) / (s * 0.3)) ** 2)); } // (a bowl and its rim)
      return r;
    },
    dress(look, at, std) {
      const stone = std(0xdcd2f0, { roughness: 0.35, emissive: 0x3a2f5a, emissiveIntensity: 0.4, flatShading: true });
      for (const [cx, cy, cz, s] of CRATERS) for (let k = 0; k < 2; k++) { const a = look.rnd() * 6.28, t = new THREE.Vector3(cx, cy, cz), u = t.clone().cross(new THREE.Vector3(0, 1, 0.1)).normalize(), v = t.clone().cross(u); const d = t.clone().addScaledVector(u, Math.cos(a) * s).addScaledVector(v, Math.sin(a) * s).normalize(); at(new THREE.Mesh(new THREE.OctahedronGeometry(0.28 + look.rnd() * 0.2, 0).scale(0.7, 1.4, 0.7), stone), d.x, d.y, d.z, 0.15); }
    },
  },
  koi: {
    palette: { top: 0x96d6a4, low: 0x74b48c, rock: 0x7f8aa0 },
    shape(x, y, z, r) { return y > 0.86 ? Math.min(r, 1.0 - 0.02 * THREE.MathUtils.smoothstep(y, 0.86, 0.95)) : r; }, // (the crown's hollow the pond lies in)
    dress(look, at, std) {
      const R = look.R, pond = std(0x7fd8d0, { roughness: 0.08, metalness: 0.1, emissive: 0x1f6a6a, emissiveIntensity: 0.35 }); pond.userData.noMerge = true; // (opaque, as the Dantian's lake: no program the warm-up lacks)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 32, 8, 0, Math.PI * 2, 0, 0.5), pond); cap.name = 'koi-pond'; look.props.add(cap); look.lakeCos = Math.cos(0.5); // (0.012 R over the hollow's floor: never one plane with it; no plant grows under it)
      const pad = std(0x4f9a5a, { roughness: 0.6 }), lotus = std(0xffc6dc, { emissive: 0xff8fb8, emissiveIntensity: 0.3 });
      for (let i = 0; i < 9; i++) { const a = look.rnd() * 6.28, y = 0.9 + look.rnd() * 0.08, s = Math.sqrt(1 - y * y), d = new THREE.Vector3(Math.cos(a) * s, y, Math.sin(a) * s); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45 + look.rnd() * 0.25, 0.45, 0.04, 9, 1, false, 0.3, 5.9), pad); m.position.copy(d).multiplyScalar(R * 0.992 + 0.03); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); look.props.add(m); if (i % 3 === 0) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 6).translate(0, 0.14, 0), lotus); f.position.copy(m.position).addScaledVector(d, 0.03); f.quaternion.copy(m.quaternion); look.props.add(f); } }
      const stone = std(0xd8d0c8, { flatShading: true });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28 + look.rnd() * 0.2; at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + look.rnd() * 0.3, 0), stone), Math.cos(a) * 0.5, 0.86, Math.sin(a) * 0.5, 0.05); }
    },
  },
  drills: {
    palette: { top: 0xe0c49a, low: 0xc4a47a, rock: 0x8e7a6a },
    shape(x, y, z, r) { return y > 0.78 ? Math.min(r, 1.0) : r; }, // (its crown flattened to a sparring floor)
    dress(look, at, std) {
      const wood = std(0x8a5a3c), cloth = [std(0xc9443a), std(0x3a6ac9)]; // (a banner is a thin box: both its faces are drawn without a double-sided program)
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28; at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.3, 6).translate(0, 0.65, 0), wood), Math.cos(a) * 0.6, 0.8, Math.sin(a) * 0.6, -0.05); }
      for (const [k, a] of [[0, 0.4], [1, 3.54]]) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.2, 6).translate(0, 1.6, 0), wood), new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.03).translate(0.48, 2.4, 0), cloth[k])); g.updateMatrix(); look.place(g, new THREE.Vector3(Math.cos(a) * 0.7, 0.72, Math.sin(a) * 0.7), -0.05); g.updateMatrix(); for (const c of [...g.children]) { c.applyMatrix4(g.matrix); look.props.add(c); } }
    },
  },
  fossils: {
    palette: { top: 0xece4d2, low: 0xd0c4a8, rock: 0x9c8e7a },
    shape(x, y, z, r) { return r + 0.012 * Math.sin(x * 11 + z * 7) * Math.sin(y * 9); }, // (weathered into low ridges)
    dress(look, at, std) {
      const bone = std(0xf2ead8, { roughness: 0.7 }), R = look.R;
      for (let i = 0; i < 7; i++) { // (the ribs, standing across a meridian over the crown, shortest at the ends)
        const t = (i - 3) / 3.5, d = new THREE.Vector3(Math.sin(t * 0.6), Math.cos(t * 0.6), 0.05).normalize(), w = R * (0.13 - 0.05 * t * t);
        const rib = new THREE.Mesh(new THREE.TorusGeometry(w, 0.1 + 0.04 * (1 - t * t), 5, 14, Math.PI).rotateY(Math.PI / 2), bone);
        look.place(rib, d, -0.3); look.props.add(rib);
      }
      for (let i = 0; i < 9; i++) { const t = (i - 4) / 4.5, d = new THREE.Vector3(Math.sin(t * 0.62), Math.cos(t * 0.62), 0.05).normalize(); at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.5), bone), d.x, d.y, d.z, 0.0); } // (the spine)
    },
  },
};
