// ---------------------------------------------------------------------------------------
// THE EGREGORES' BODIES (vfx/railfoes.js): the rail foes that are the Emocean's own beasts, from real human myth (Espada's canon), in
// the Brine dress: unglazed, a wet grey-blue hide over a pale belly (countershaded, as a sea animal is), barnacle and pearl, spots of
// bioluminescence lit in the feeling's colour. Each builder returns a body's spec (wreckers.js has the shape). Plain names (Dovina's).
//   swooper   a manta ray on its arc, its wings flexing; its tell the spots gathering at the mouth (`mouth`)
//   ambusher  a shark, coming from behind; its tell the gill slits lighting (`mouth`)
//   sweeper   an anglerfish whose lure is the beam's source; its tell the lure brightening (`lure`)
//   heavy     a sea turtle, an island on its back: barnacled shell, four vents that throw the rings and spirals (`vent0`..`vent3`)
//   spawner   a clam reef: a giant clam on a mound of rock and egg clusters; its tell the clam opening before each school (`hatch`)
//
// Prior art: the aspidochelone and the island-turtle (the Physiologus' whale mistaken for land, Sinbad's first voyage), the deep sea's
// anglerfish and its esca, the manta's flight, the tridacna clam; the Gummi ship's beasts (KH2) and Ecco's and Abzû's sea animals for the
// countershaded hide that reads from above and below.
//
//   EGREGORES[role]() -> { pieces, death, size, flex? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FoeKit, PAL, HALO_CH, slab, tube } from './kit.js';

const PI = Math.PI;
const ball = (r, w = 10, h = 7, ...arc) => new THREE.SphereGeometry(r, w, h, ...arc);
const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);
const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
/** Countershaded: the hide above, the belly below a line. */
const shade = (line = 0, top = PAL.hide, under = PAL.belly) => (x, y) => (y < line ? under : top);
/** A flat outline lying in XZ (points as [x, z]), thickness along Y. */
const flat = (pts, d) => slab(pts.map(([x, z]) => [x, -z]), d).rotateX(-PI / 2);
/** A flat outline standing in YZ (points as [z, y]), thickness along X. */
const fin = (pts, d) => slab(pts, d).rotateY(-PI / 2);
const spot = (k, at, r = 0.04) => k.add(ball(r, 5, 4), { c: PAL.pearl, fx: [1, 0, 0, 0], p: at, g: 'spots' });

export const EGREGORES = {
  swooper() {
    const k = new FoeKit();
    const span = 1.15, wing = [[0, 0.62], [0.5, 0.38], [span, -0.08], [0.62, -0.3], [0.2, -0.55], [-0.2, -0.55], [-0.62, -0.3], [-span, -0.08], [-0.5, 0.38]];
    const fl = (x) => Math.min(1, Math.abs(x) / span) ** 1.5;
    k.add(flat(wing, 0.06), { c: shade(0, PAL.hide, PAL.belly), g: 'wings', flex: fl });
    k.add(ball(0.4, 10, 6), { c: shade(-0.02), s: [0.85, 0.32, 1.45], p: [0, 0, 0.05], g: 'wings' });
    for (const s of [-1, 1]) k.add(cone(0.06, 0.3, 4), { c: PAL.hideD, p: [s * 0.17, 0, 0.7], r: [PI / 2, 0, s * 0.3], g: 'horns' }); // (the cephalic fins)
    k.add(tube([[0, 0, -0.5], [0, 0.05, -0.9], [0, 0.12, -1.35]], 0.02, 4, 3), { c: PAL.hideD, g: 'tail' });
    k.add(new THREE.BoxGeometry(0.2, 0.05, 0.05), { c: PAL.mouth, fx: [0, 1, 0, 0], p: [0, -0.04, 0.62], g: 'mouth' });
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k.add(new THREE.SphereGeometry(0.035, 5, 4), { c: PAL.pearl, fx: [1, 0, 0, 0], p: [s * (0.3 + i * 0.2), 0.04, 0.36 - i * 0.12], g: 'spots', flex: fl });
    k.muzzle('mouth', [0, -0.04, 0.68]).halo([0, -0.04, 0.7], 0.3, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'sink', size: 2.3, flex: { dir: [0, 1, 0], amp: 0.22, rate: 5, wave: 1.5 } };
  },

  ambusher() {
    const k = new FoeKit(), fl = (x, y, z) => Math.max(0, Math.min(1, -z / 1.1)) ** 2;
    k.add(ball(0.5, 12, 8), { c: shade(-0.08), s: [0.62, 0.68, 2.1], g: 'body', flex: fl });
    k.add(cone(0.2, 0.42, 8), { c: shade(-0.06), p: [0, -0.02, 1.2], r: [PI / 2, 0, 0], s: [1, 1, 0.75], g: 'body' });
    k.add(fin([[-0.15, 0.2], [0.25, 0.25], [-0.05, 0.75]], 0.05), { c: PAL.hideD, p: [0, 0.1, 0], g: 'dorsal', flex: fl });
    k.add(fin([[-0.9, 0], [-1.45, 0.62], [-1.25, 0.02], [-1.4, -0.38]], 0.04), { c: PAL.hideD, g: 'tail', flex: fl });
    for (const s of [-1, 1]) k.add(flat([[0, 0.25], [s * 0.62, -0.18], [s * 0.1, -0.1]], 0.04), { c: shade(-0.15), p: [s * 0.12, -0.18, 0.3], r: [0, 0, s * -0.3], g: 'pecs' });
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) k.add(new THREE.BoxGeometry(0.02, 0.16, 0.025), { c: PAL.mouth, fx: [0, 1, 0, 0], p: [s * 0.29, 0.02, 0.62 - i * 0.07], r: [0, 0, 0], g: `gill${s}` });
    for (const s of [-1, 1]) k.add(ball(0.04, 5, 4), { c: PAL.mouth, fx: [0.6, 0, 0, 0], p: [s * 0.2, 0.08, 1.02], g: 'eyes' });
    k.add(new THREE.BoxGeometry(0.3, 0.04, 0.14), { c: PAL.mouth, p: [0, -0.2, 1.0], g: 'mouth' });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) spot(k, [s * 0.28, -0.08, 0.2 - i * 0.22], 0.03);
    k.muzzle('mouth', [0, -0.15, 1.22]).halo([0.29, 0.02, 0.55], 0.22, HALO_CH.tell).halo([-0.29, 0.02, 0.55], 0.22, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'sink', size: 2.4, flex: { dir: [1, 0, 0], amp: 0.2, rate: 7, wave: 2.2 } };
  },

  sweeper() {
    const k = new FoeKit(), fl = (x, y, z) => Math.max(0, Math.min(1, (-z - 0.4) / 1.0)) ** 2, D = PAL.hideD;
    k.add(ball(0.72, 12, 8), { c: shade(-0.3, D, 0x56606a), s: [1, 0.86, 0.95], p: [0, 0, 0.2], g: 'head' });
    k.add(cone(0.55, 1.3, 9), { c: shade(-0.15, D, 0x56606a), p: [0, 0.05, -0.85], r: [-PI / 2, 0, 0], g: 'tail', flex: fl });
    k.add(fin([[-1.35, 0], [-1.85, 0.5], [-1.75, 0], [-1.85, -0.5]], 0.05), { c: D, g: 'tail', flex: fl });
    k.add(fin([[0, 0.55], [-0.9, 0.62], [-0.6, 0.38]], 0.04), { c: D, g: 'dorsal', flex: fl });
    // the jaw, under-slung, its teeth out over the lip
    k.add(ball(0.62, 10, 5, 0, PI * 2, PI / 2, PI / 2), { c: PAL.mouth, s: [1, 0.55, 1], p: [0, -0.18, 0.42], g: 'jaw' });
    k.add(new THREE.TorusGeometry(0.58, 0.05, 4, 12, PI), { c: D, p: [0, -0.18, 0.42], r: [PI / 2, 0, 0], s: [1, 1.02, 1], g: 'jaw' });
    for (let i = 0; i < 9; i++) { const a = (i / 8) * PI; k.add(cone(0.04, 0.2, 4), { c: PAL.tooth, p: [Math.cos(a) * 0.55, -0.1 + (i % 2) * 0.03, 0.42 + Math.sin(a) * 0.55], r: [0, 0, PI], g: 'teeth' }); }
    for (const s of [-1, 1]) k.add(ball(0.07, 6, 4), { c: PAL.pearl, fx: [0.5, 0, 0, 0], p: [s * 0.36, 0.35, 0.65], g: 'eyes' });
    for (const s of [-1, 1]) k.add(flat([[0, 0.15], [s * 0.45, -0.2], [s * 0.05, -0.2]], 0.04), { c: D, p: [s * 0.62, -0.2, -0.05], g: 'pecs' });
    // the illicium (the stalk) and the esca (the lure): the beam's source
    k.add(tube([[0, 0.6, 0.2], [0, 1.15, 0.45], [0, 1.15, 0.95], [0, 0.9, 1.35]], 0.025, 10, 4), { c: D, g: 'stalk' });
    k.add(ball(0.11, 8, 6), { c: PAL.pearl, fx: [0.5, 1.4, 0, 0], p: [0, 0.82, 1.38], g: 'lure' });
    k.muzzle('lure', [0, 0.82, 1.4]).halo([0, 0.82, 1.4], 0.35, HALO_CH.accent).halo([0, 0.82, 1.42], 0.6, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'sink', size: 3.2, flex: { dir: [1, 0, 0], amp: 0.2, rate: 4, wave: 1.8 } };
  },

  heavy() {
    const k = new FoeKit(), fl = (x) => Math.max(0, Math.abs(x) - 1.1) / 0.9;
    // the shell: a low faceted dome, an island's crags on it, barnacles; the plastron pale under it
    k.add(ball(1.6, 12, 5, 0, PI * 2, 0, PI / 2), { c: (x, y) => (y > 0.55 ? 0x56646e : PAL.hide), s: [1, 0.55, 1.3], g: 'shell' });
    k.add(new THREE.TorusGeometry(1.6, 0.08, 4, 16), { c: PAL.hideD, r: [PI / 2, 0, 0], s: [1, 1.3, 1], g: 'shell' });
    k.add(ball(1.5, 12, 4, 0, PI * 2, PI / 2, PI / 2), { c: PAL.belly, s: [0.95, 0.25, 1.22], g: 'plastron' });
    k.add(new THREE.IcosahedronGeometry(0.42, 0), { c: 0x5a5852, p: [-0.35, 0.95, -0.4], s: [1, 0.8, 1.3], g: 'crag' });
    k.add(ball(0.12, 8, 6), { c: PAL.pearl, fx: [0.8, 0, 0, 0], p: [-0.3, 1.25, -0.35], g: 'crag' });
    for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.5 + (i % 4) * 0.28; k.add(cone(0.07, 0.12, 5), { c: PAL.barn, p: [Math.cos(a) * r, 0.88 - r * r * 0.25, Math.sin(a) * r * 1.25], g: 'barnacles' }); }
    // the head and the four flippers
    k.add(ball(0.45, 10, 7), { c: shade(-0.15), s: [0.9, 0.75, 1.15], p: [0, 0.05, 2.25], g: 'head' });
    k.add(cone(0.18, 0.3, 6), { c: PAL.hideD, p: [0, -0.02, 2.75], r: [PI / 2, 0, 0], s: [1.3, 1, 0.7], g: 'head' });
    for (const s of [-1, 1]) k.add(ball(0.06, 5, 4), { c: PAL.mouth, fx: [0.5, 0, 0, 0], p: [s * 0.3, 0.17, 2.45], g: 'head' });
    for (const s of [-1, 1]) {
      k.add(flat([[0, 0.3], [s * 1.6, -0.25], [s * 1.5, -0.55], [0, -0.2]], 0.07), { c: shade(-0.02), p: [s * 1.0, -0.1, 1.0], r: [0, s * -0.15, s * -0.12], g: `fore${s}`, flex: fl });
      k.add(flat([[0, 0.2], [s * 0.8, -0.2], [s * 0.6, -0.42], [0, -0.2]], 0.06), { c: shade(-0.02), p: [s * 1.0, -0.12, -1.6], g: `hind${s}` });
    }
    // the vents: four chimneys on the shell, lit as the tell, each a muzzle
    [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]].forEach(([x, z], i) => {
      const y = 0.85 - (x * x + z * z) * 0.1;
      k.add(cyl(0.16, 0.22, 0.3, 8), { c: 0x3e4a54, p: [x, y, z * 1.25], g: `vent${i}` });
      k.add(new THREE.TorusGeometry(0.16, 0.04, 4, 8), { c: PAL.pearl, fx: [0.3, 1, 0, 0], p: [x, y + 0.15, z * 1.25], r: [PI / 2, 0, 0], g: `vent${i}` });
      k.muzzle(`vent${i}`, [x, y + 0.2, z * 1.25]).halo([x, y + 0.22, z * 1.25], 0.42, HALO_CH.tell);
    });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; spot(k, [Math.cos(a) * 1.62, 0.06, Math.sin(a) * 2.08], 0.06); }
    k.muzzle('mouth', [0, -0.02, 2.9]);
    return { pieces: [{ name: 'body', kit: k }], death: 'sink', size: 5.0, flex: { dir: [0, 1, 0], amp: 0.18, rate: 2.2, wave: 0.6 } };
  },

  spawner() {
    const k = new FoeKit(), lid = new FoeKit();
    k.add(new THREE.IcosahedronGeometry(1.0, 1), { c: (x, y) => (y > 0 ? 0x4e5a62 : 0x343e46), s: [1.35, 0.55, 1.15], p: [0, -0.55, 0], g: 'reef' });
    k.add(new THREE.IcosahedronGeometry(0.55, 0), { c: 0x46525a, p: [-0.95, -0.35, -0.5], s: [1, 0.9, 1.2], g: 'reef2' });
    for (let i = 0; i < 9; i++) { const a = i * 2.1, r = 0.8 + (i % 3) * 0.2; k.add(cone(0.06, 0.12, 5), { c: PAL.barn, p: [Math.cos(a) * r, -0.15 - (i % 3) * 0.08, Math.sin(a) * r * 0.9], g: 'barnacles' }); }
    // the egg clusters round the clam: pale and lit, Figments not yet out
    [[0.95, -0.2, 0.3], [-0.6, -0.05, 0.75], [0.7, -0.15, -0.65], [-1.05, 0.1, -0.35]].forEach(([x, y, z], j) => {
      for (let i = 0; i < 5; i++) k.add(ball(0.09 + (i % 2) * 0.03, 6, 4), { c: PAL.pearl, fx: [0.55, 0.3, 0, 0], p: [x + Math.cos(i * 1.3) * 0.12, y + (i % 3) * 0.07, z + Math.sin(i * 1.3) * 0.12], g: `eggs${j}` });
    });
    // the clam: its lower valve on the reef, wavy-ribbed; the upper valve the hatch (a part: railfoes.js opens it with the tell)
    const valve = () => ball(0.9, 10, 4, 0, PI * 2, 0, PI / 2);
    k.add(valve(), { c: (x, y, z) => (Math.sin(Math.atan2(x, z) * 5) > 0 ? 0x5e6a72 : 0x48545c), s: [1, 0.42, 0.75], r: [PI, 0, 0], p: [0, 0.12, 0], g: 'valve' });
    k.add(ball(0.55, 10, 4, 0, PI * 2, 0, PI / 2), { c: 0x2a3a48, fx: [0.45, 0.6, 0, 0], s: [1, 0.25, 0.7], r: [PI, 0, 0], p: [0, 0.14, 0.05], g: 'mantle' }); // (the mantle, lit)
    k.add(ball(0.16, 8, 6), { c: PAL.pearl, fx: [0.9, 0.6, 0, 0], p: [0, 0.16, 0.1], g: 'pearl' });
    lid.add(valve(), { c: (x, y, z) => (Math.sin(Math.atan2(x, z + 0.68) * 5) > 0 ? 0x5e6a72 : 0x48545c), s: [1, 0.42, 0.75], p: [0, 0, 0.68], g: 'lid' });
    k.muzzle('hatch', [0, 0.25, 0.7]).halo([0, 0.25, 0.3], 0.75, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }, { name: 'lid', kit: lid, at: [0, 0.12, -0.68], moves: true, tellOpen: ['x', -0.95] }], death: 'sink', size: 2.8 };
  },
};
