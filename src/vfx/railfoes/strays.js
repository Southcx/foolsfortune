// ---------------------------------------------------------------------------------------
// THE STRAYS' BODY AND THE CARRIER (vfx/railfoes.js): the two rail foes that are neither the Wreckers' craft nor an Egregore.
//   school   a stray Figment fish (Espada's canon: made-up creatures wandered off their islands; the koi-like glints of the shoal):
//            a small koi in a bright porcelain glaze, its patches lit in the feeling's colour; shown many at once, so its geometry is
//            the one the instanced swap would draw (`mouth`)
//   carrier  a Lachrymite lantern: a cluster of crystal in a clay-and-brass cage under a carrying ring. An object, never a ship or a
//            beast (Dovina: it must share no foe's silhouette): it brings a pattern where nothing else throws it (`heart`)
//
// Prior art: the koi of the shoal (vfx/shoal.js's glints, after Abzû's schools), Nishikigoi's patterning (kohaku, sanke: white with
// patches), the Gummi ship's treasure blocks that carry and do not fight, and a paper lantern's frame (the cage, the ring to carry it).
//
//   STRAYS[role]() -> { pieces, death, size, flex? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FoeKit, PAL, HALO_CH, slab } from './kit.js';

const PI = Math.PI;
/** A koi's patches: where a slow pattern over the body is up, the glaze is the feeling's (fx accent) over a warm porcelain. */
const patch = (x, y, z) => Math.sin(z * 9 + 1.3) * Math.cos(x * 7 - y * 5) > 0.15;

export const STRAYS = {
  school() {
    const k = new FoeKit(), fl = (x, y, z) => Math.max(0, Math.min(1, -z / 0.5)) ** 2;
    k.add(new THREE.SphereGeometry(0.25, 10, 7), { c: (x, y, z) => (patch(x, y, z) ? 0xf8e8d0 : PAL.porc), fx: (x, y, z) => [patch(x, y, z) ? 1 : 0, 0, 0, 0], s: [0.75, 0.85, 1.9], g: 'body', flex: fl });
    k.add(slab([[-0.3, 0], [-0.62, 0.22], [-0.56, 0], [-0.62, -0.22]], 0.02).rotateY(-PI / 2), { c: PAL.porcD, fx: [0.6, 0, 0, 0], g: 'tail', flex: fl });
    k.add(slab([[0.1, 0.17], [-0.25, 0.2], [-0.2, 0.12]], 0.02).rotateY(-PI / 2), { c: PAL.porcD, g: 'dorsal', flex: fl });
    for (const s of [-1, 1]) k.add(new THREE.SphereGeometry(0.035, 5, 4), { c: 0x101010, p: [s * 0.13, 0.06, 0.34], g: 'eyes' });
    k.add(new THREE.SphereGeometry(0.04, 5, 4), { c: PAL.porcD, fx: [0, 1, 0, 0], p: [0, -0.02, 0.47], g: 'mouth' });
    k.muzzle('mouth', [0, -0.02, 0.5]).halo([0, -0.02, 0.5], 0.2, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'burst', size: 1.1, flex: { dir: [1, 0, 0], amp: 0.12, rate: 11, wave: 4 } };
  },

  carrier() {
    const k = new FoeKit();
    // the Lachrymite: five crystals from one heart, lit in the feeling's colour
    [[0, 0, 0, 1.1], [0.16, -0.05, 0.08, 0.7], [-0.15, -0.02, -0.1, 0.75], [0.05, -0.08, -0.17, 0.6], [-0.08, -0.1, 0.17, 0.55]].forEach(([x, y, z, h], i) => {
      k.add(new THREE.OctahedronGeometry(0.16, 0), { c: PAL.crystal, fx: [0.9, 0.7, 0, 0], s: [1, h * 2.4, 1], p: [x, y + h * 0.12, z], r: [x * 2, i, -z * 2], g: `crystal${i}` });
    });
    // the cage: two clay rings, four brass bars, a clay roof and its carrying ring, a foot
    for (const y of [-0.55, 0.55]) k.add(new THREE.TorusGeometry(0.42, 0.045, 5, 12), { c: PAL.clay, p: [0, y, 0], r: [PI / 2, 0, 0], g: 'cage' });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; k.add(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5), { c: PAL.brass, p: [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], g: 'cage' }); }
    k.add(new THREE.ConeGeometry(0.5, 0.32, 12), { c: PAL.clay, p: [0, 0.74, 0], g: 'roof' });
    k.add(new THREE.TorusGeometry(0.14, 0.035, 5, 10), { c: PAL.brass, p: [0, 1.0, 0], g: 'roof' });
    k.add(new THREE.CylinderGeometry(0.22, 0.3, 0.14, 12), { c: PAL.clayD, p: [0, -0.64, 0], g: 'foot' });
    k.add(new THREE.ConeGeometry(0.14, 0.24, 8), { c: PAL.clayD, p: [0, -0.83, 0], r: [PI, 0, 0], g: 'foot' });
    k.muzzle('heart', [0, 0.05, 0]).halo([0, 0.05, 0], 0.85, HALO_CH.accent).halo([0, 0.05, 0], 0.6, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'burst', size: 1.9 };
  },
};
