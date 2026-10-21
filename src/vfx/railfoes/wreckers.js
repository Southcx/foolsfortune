// ---------------------------------------------------------------------------------------
// THE WRECKERS' BODIES (vfx/railfoes.js): the rail foes that are the Wreckers' craft (Espada's canon: coast thieves who hung false
// lights, Contractors under no marque; their ships the player's ship types gone wrong: dark iron and tar, rust, false-light lanterns
// lit in the feeling's colour, and on every hull its cradle in sight with a FORGED SEAL in it: a counterfeit name, cracked, livid red,
// flickering, never the window colour or gold; the owner's ruling, through Espada). Each builder returns a body's spec:
// its pieces (kit.js builds), where they sit, its muzzles, its death and its length. Plain names (Dovina's role ids).
//   darter      a cutter: a small fast hull under a lateen sail, a bow gun (the muzzle `bow`)
//   rammer      a fireship: a broad hulk with an iron ram, embers on deck; its tell a beat's glow aft (`aft`), then it is the shot (`ram`)
//   sniper      a false-light spar: a tall lantern mast on a float, the lens heating (`lens`): the warning line and the beam come from it
//   turret      a gun on a wreck's rock (`gun` a part that turns; `barrel`)
//   mine-layer  a cask barge, casks stacked, a chute astern that lets a cask go (`drop`)
//   mine        a crude cask with a fuse (`fuse`, `burst`)
//   escort      a shield tender: a small boat under a great lantern (`lantern`) whose tether and bubble go to its charge (railfoes.js link)
//   gunship     a gun-brig: two masts, two gun turrets (parts gunL, gunR) and the forged cradle midships (part core), its shutters
//               sliding open once both guns are down (`gunL`, `gunR`, `core`); one draw for all of it (the units: railfoes/materials.js)
//   blocker     a capsized ironclad drifting keel up, armour plates; its weak point a seam along the keel, lit only when revealed
//   grappler    a hook-boat: a winch at the bow, a grapnel on a line (parts hook, line; poses swing, attached, thrown)
//
// Prior art: the Gummi ship's foes (KH2: one shape a behaviour, Hex Ring, Bomb Bell), Star Fox 64's Venom fighters read at 48 px, a
// fireship (the Armada's at Gravelines), the brig and the lateen cutter as the age of sail built them, the ironclad (Monitor's raft hull),
// and the wreckers' false light (the Cornish tale: a lantern on a mast to lure ships onto the rocks).
//
//   WRECKERS[role]() -> { pieces: [{ name, kit, at, parent?, own? (a unit: hit and downed alone), slide? (a shutter: -1 | 1), moves?
//                         (a mesh of its own: it turns or travels), tellOpen? }], death, size, flex? }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { FoeKit, PAL, HALO_CH, hull, slab, tube } from './kit.js';

const PI = Math.PI;
const cyl = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const ball = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
/** The Wreckers' hull colours: tar above, rust where the keel's red paint has gone to rot. */
const tarHull = (D) => (x, y) => (y < -D * 0.72 ? PAL.rust : PAL.tar);

/** A false-light lantern: an iron cage round glass lit in the feeling's colour (fx accent), its glow a halo. */
function lantern(k, at, s = 1, g = 'lantern', glow = true) {
  const [x, y, z] = at;
  k.add(box(0.16 * s, 0.2 * s, 0.16 * s), { c: PAL.lens, fx: [1, 0, 0, 0], p: at, g });
  k.add(cyl(0.13 * s, 0.13 * s, 0.03 * s, 6), { c: PAL.iron, p: [x, y + 0.11 * s, z], g });
  k.add(cone(0.12 * s, 0.1 * s), { c: PAL.iron, p: [x, y + 0.17 * s, z], g });
  k.add(cyl(0.12 * s, 0.12 * s, 0.03 * s, 6), { c: PAL.iron, p: [x, y - 0.11 * s, z], g });
  if (glow) k.halo(at, 0.32 * s, HALO_CH.accent);
}
const cone = (r, h, n = 6) => new THREE.ConeGeometry(r, h, n);

/** The cradle and its FORGED SEAL (the owner's ruling, through Espada: every Wreckers' hull runs on a counterfeit name in its heart,
 *  and the forgery reads at the cradle): an octagonal iron well, four tines, and in its socket a seal plate that is wrong: a livid red
 *  (never the window colour, never gold), in three uneven shards with the cracks between them dark, lit in a stutter (fx ember 2: the
 *  body program's forged flicker). `weak` lights the socket gold when the gunship's core is opened. */
function cradle(k, at, s = 1, g = 'cradle', weak = 0, glow = true) {
  const [x, y, z] = at;
  k.add(cyl(0.3 * s, 0.34 * s, 0.16 * s, 8), { c: PAL.ironL, p: at, g });
  k.add(cyl(0.22 * s, 0.22 * s, 0.02 * s, 8), { c: PAL.socket, fx: [0, 0, weak, 0.4], p: [x, y + 0.07 * s, z], g });
  [[0, 0.07, 0.12, 0.11, 0.05], [2.15, 0.065, 0.1, 0.09, -0.08], [4.2, 0.075, 0.11, 0.12, 0.1]].forEach(([a, r, w, d, tilt]) => {
    k.add(box(w * s, 0.022 * s, d * s), { c: 0x5a1020, fx: [0, 0, 0, 2], p: [x + Math.cos(a) * r * s, y + (0.085 + tilt * 0.12) * s, z + Math.sin(a) * r * s], r: [tilt, a, tilt * 0.6], g });
  });
  k.add(new THREE.TorusGeometry(0.31 * s, 0.03 * s, 4, 8), { c: PAL.rustL, p: [x, y + 0.08 * s, z], r: [PI / 2, 0, PI / 8], g });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 + PI / 4; k.add(cone(0.05 * s, 0.22 * s, 4), { c: PAL.rust, p: [x + Math.cos(a) * 0.28 * s, y + 0.17 * s, z + Math.sin(a) * 0.28 * s], r: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], g }); }
  if (glow) k.halo([x, y + 0.1 * s, z], 0.3 * s, HALO_CH.ember);
}

/** A gun on a drum: barrels along +Z, its muzzle ring the tell (fx tell). */
function gun(k, at, { s = 1, barrels = 1, len = 0.55, g = 'gun', muzzle = 'barrel' } = {}) {
  const [x, y, z] = at;
  k.add(cyl(0.2 * s, 0.24 * s, 0.16 * s, 8), { c: PAL.iron, p: at, g });
  k.add(box(0.36 * s, 0.18 * s, 0.08 * s), { c: PAL.ironL, p: [x, y + 0.14 * s, z + 0.08 * s], r: [-0.25, 0, 0], g }); // (the shield)
  for (let b = 0; b < barrels; b++) {
    const bx = x + (barrels > 1 ? (b - (barrels - 1) / 2) * 0.12 * s : 0);
    k.add(cyl(0.045 * s, 0.055 * s, len * s, 6), { c: PAL.iron, p: [bx, y + 0.08 * s, z + len * s / 2], r: [PI / 2, 0, 0], g });
    k.add(cyl(0.065 * s, 0.065 * s, 0.06 * s, 6), { c: PAL.rust, fx: [0, 1, 0, 0], p: [bx, y + 0.08 * s, z + len * s], r: [PI / 2, 0, 0], g });
  }
  const m = [x, y + 0.08 * s, z + len * s + 0.04];
  k.muzzle(muzzle, m).halo(m, 0.28 * s, HALO_CH.tell);
}

export const WRECKERS = {
  darter() {
    const k = new FoeKit(), D = 0.26;
    k.add(hull({ L: 1.8, B: 0.48, D, bow: 0.5, stern: 0.45, sheer: 0.1 }), { c: tarHull(D), g: 'hull' });
    k.add(cyl(0.025, 0.035, 1.2, 5), { c: PAL.wood, p: [0, 0.6, 0.25], r: [0.12, 0, 0], g: 'mast' });
    k.add(tube([[0, 0.12, -0.75], [0, 0.7, 0.2], [0, 1.35, 0.95]], 0.018, 4, 4), { c: PAL.wood, g: 'sail' }); // (the lateen yard)
    k.add(slab([[-0.72, 0.14], [0.92, 1.3], [0.38, 0.14]], 0.02), { c: (x, y) => (y < 0.35 ? PAL.sailD : PAL.sail), r: [0, -PI / 2, 0], p: [0.02, 0, 0], g: 'sail' });
    k.add(cyl(0.035, 0.045, 0.32, 6), { c: PAL.iron, p: [0, 0.1, 0.78], r: [PI / 2, 0, 0], g: 'gun' });
    k.add(cyl(0.055, 0.055, 0.05, 6), { c: PAL.rust, fx: [0, 1, 0, 0], p: [0, 0.1, 0.95], r: [PI / 2, 0, 0], g: 'gun' });
    k.muzzle('bow', [0, 0.1, 1.0]).halo([0, 0.1, 1.0], 0.25, HALO_CH.tell);
    lantern(k, [0, 0.22, -0.82], 0.7);
    cradle(k, [0, 0.03, -0.38], 0.45);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 1.8 };
  },

  rammer() {
    const k = new FoeKit(), D = 0.46;
    k.add(hull({ L: 2.3, B: 0.95, D, bow: 0.28, stern: 0.8, sheer: 0.16, ring: 8, segs: 10 }), { c: tarHull(D), g: 'hull' });
    k.add(cone(0.14, 0.7, 6), { c: PAL.rustL, p: [0, -0.2, 1.38], r: [PI / 2, 0, 0], g: 'ram' }); // (the iron ram, at the waterline)
    k.add(box(0.5, 0.12, 0.12), { c: PAL.iron, p: [0, -0.2, 1.05], g: 'ram' });
    for (let i = 0; i < 3; i++) k.add(box(0.98, 0.05, 0.05), { c: PAL.iron, p: [0, -0.1, 0.6 - i * 0.6], g: `band${i}` });
    // the deck heaped with what burns: casks and crates, embers between
    const heap = [[0.2, 0.12, 0.4, 0.22], [-0.18, 0.12, 0.2, 0.2], [0.05, 0.12, -0.25, 0.24], [-0.2, 0.3, 0.05, 0.16], [0.18, 0.3, -0.1, 0.15]];
    heap.forEach(([x, y, z, s], i) => k.add(i % 2 ? box(s, s, s) : cyl(s * 0.5, s * 0.5, s * 1.1, 6), { c: i % 2 ? PAL.wood : PAL.tar, p: [x, y, z], r: [0.2 * i, i, 0.1], g: `heap${i}` }));
    for (let i = 0; i < 6; i++) k.add(box(0.06, 0.06, 0.06), { c: PAL.rust, fx: [0, 0, 0, 1], p: [Math.sin(i * 2.3) * 0.3, 0.06, 0.5 - i * 0.2], g: `ember${i}` });
    k.add(cyl(0.04, 0.05, 0.6, 5), { c: PAL.wood, p: [0, 0.3, 0.5], r: [0.4, 0, 0.3], g: 'stump' }); // (a burnt mast's stump)
    // the stern's furnace: the beat's glow aft before it charges
    k.add(box(0.5, 0.3, 0.12), { c: PAL.iron, p: [0, 0.05, -1.17], g: 'furnace' });
    k.add(box(0.36, 0.18, 0.04), { c: PAL.socket, fx: [0, 1, 0, 0.3], p: [0, 0.05, -1.24], g: 'furnace' });
    k.halo([0, 0.06, -1.28], 0.6, HALO_CH.tell);
    for (let i = 0; i < 4; i++) k.halo([Math.sin(i * 2.3) * 0.3, 0.1, 0.5 - i * 0.3], 0.12, HALO_CH.ember);
    cradle(k, [0, 0.05, -0.8], 0.6);
    k.muzzle('ram', [0, -0.2, 1.75]).muzzle('aft', [0, 0.06, -1.28]);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 2.4 };
  },

  sniper() {
    const k = new FoeKit();
    k.add(cyl(0.48, 0.42, 0.26, 10), { c: (x, y) => (y < -1.3 ? PAL.rust : PAL.tar), p: [0, -1.25, 0], g: 'float' });
    k.add(new THREE.TorusGeometry(0.48, 0.05, 4, 10), { c: PAL.iron, p: [0, -1.13, 0], r: [PI / 2, 0, 0], g: 'float' });
    k.add(cyl(0.04, 0.07, 2.3, 6), { c: PAL.iron, p: [0, -0.05, 0], g: 'mast' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 + PI / 2; k.add(box(0.07, 0.06, 0.75), { c: PAL.wood, p: [Math.cos(a) * 0.75, -1.2, Math.sin(a) * 0.75], r: [0, -a + PI / 2, 0], g: `outrigger${i}` }); k.add(cyl(0.12, 0.12, 0.16, 6), { c: PAL.tar, p: [Math.cos(a) * 1.15, -1.22, Math.sin(a) * 1.15], g: `outrigger${i}` }); } // (three outriggers: a tri-star from above, never the mine's dot)
    for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; k.add(tube([[Math.cos(a) * 0.42, -1.1, Math.sin(a) * 0.42], [0, 0.95, 0]], 0.012, 2, 3), { c: PAL.ironL, g: `stay${i}` }); }
    // the lamp house: an octagonal iron house, its lens the muzzle (heats with the tell), a false light above
    k.add(cyl(0.2, 0.22, 0.34, 8), { c: PAL.iron, p: [0, 1.15, 0], g: 'house' });
    k.add(cone(0.24, 0.2, 8), { c: PAL.rust, p: [0, 1.42, 0], g: 'house' });
    k.add(cyl(0.15, 0.15, 0.06, 12), { c: PAL.brass, p: [0, 1.15, 0.22], r: [PI / 2, 0, 0], g: 'house' });
    k.add(cyl(0.12, 0.12, 0.04, 12), { c: PAL.lens, fx: [0.15, 1.3, 0, 0], p: [0, 1.15, 0.25], r: [PI / 2, 0, 0], g: 'house' });
    lantern(k, [0, 1.62, 0], 0.6, 'house');
    cradle(k, [0.24, -1.07, 0.18], 0.4, 'float');
    k.muzzle('lens', [0, 1.15, 0.28]).halo([0, 1.15, 0.3], 0.55, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 3.0 };
  },

  turret() {
    const k = new FoeKit(), G = new FoeKit();
    k.add(new THREE.IcosahedronGeometry(0.85, 0), { c: (x, y) => (y > 0.1 ? 0x56504a : 0x3a3530), s: [1.25, 0.5, 1], p: [0, -0.2, 0], g: 'rock' });
    k.add(new THREE.IcosahedronGeometry(0.5, 0), { c: 0x46403a, s: [1, 0.6, 1.2], p: [0.7, -0.35, -0.35], g: 'rock2' });
    for (let i = 0; i < 5; i++) k.add(box(0.07, 0.07, 0.9 - i * 0.08), { c: i % 2 ? PAL.wood : PAL.rust, p: [-0.5 + i * 0.22, 0.05 + (i % 2) * 0.1, -0.4], r: [0.9 - i * 0.15, 0.2 * i, 0.3], g: `rib${i}` }); // (a wreck's ribs)
    k.add(cyl(0.34, 0.4, 0.14, 8), { c: PAL.iron, p: [0, 0.12, 0], g: 'ring' });
    lantern(k, [-0.8, 0.15, -0.5], 0.6);
    cradle(k, [0.5, 0.17, 0.3], 0.5, 'rock');
    gun(G, [0, 0, 0], { s: 1.2, barrels: 2, len: 0.6 });
    return { pieces: [{ name: 'body', kit: k }, { name: 'gun', kit: G, at: [0, 0.27, 0], moves: true }], death: 'break', size: 2.2 };
  },

  'mine-layer'() {
    const k = new FoeKit(), D = 0.3;
    k.add(hull({ L: 2.6, B: 1.15, D, bow: 0.16, stern: 0.92, sheer: 0.04, ring: 6 }), { c: tarHull(D), g: 'hull' });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const x = (r - 0.5) * 0.42, z = 0.75 - i * 0.42;
      k.add(cyl(0.16, 0.16, 0.36, 8), { c: PAL.wood, p: [x, 0.17, z], r: [0, 0, PI / 2], g: `cask${r}${i}` });
      k.add(cyl(0.165, 0.165, 0.04, 8), { c: PAL.rust, p: [x, 0.17, z], r: [0, 0, PI / 2], g: `cask${r}${i}` });
    }
    k.add(cyl(0.16, 0.16, 0.36, 8), { c: PAL.wood, p: [0, 0.48, 0.55], r: [0, 0, PI / 2], g: 'top' });
    // the chute astern under an A-frame, a cask hung ready
    k.add(box(0.36, 0.06, 0.6), { c: PAL.iron, p: [0, -0.05, -1.35], r: [0.45, 0, 0], g: 'chute' });
    for (const s of [-1, 1]) k.add(cyl(0.025, 0.025, 0.9, 4), { c: PAL.iron, p: [s * 0.3, 0.35, -1.1], r: [0.35, 0, -s * 0.25], g: 'frame' });
    k.add(cyl(0.025, 0.025, 0.66, 4), { c: PAL.iron, p: [0, 0.76, -1.24], r: [0, 0, PI / 2], g: 'frame' });
    k.add(box(0.12, 0.12, 0.06), { c: PAL.socket, fx: [0, 1, 0, 0], p: [0, 0.62, -1.26], g: 'frame' }); // (the drop lamp)
    k.halo([0, 0.62, -1.3], 0.4, HALO_CH.tell);
    lantern(k, [0, 0.35, 1.15], 0.7);
    cradle(k, [0, 0.03, -0.95], 0.55);
    k.muzzle('drop', [0, -0.25, -1.62]);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 2.6 };
  },

  mine() {
    const k = new FoeKit();
    k.add(cyl(0.24, 0.24, 0.52, 10), { c: (x, y) => (Math.abs(y) < 0.2 ? PAL.wood : PAL.tar), g: 'cask' });
    k.add(cyl(0.29, 0.29, 0.3, 10), { c: PAL.wood, g: 'cask' }); // (the cask's belly)
    for (const y of [-0.2, 0.2]) k.add(new THREE.TorusGeometry(0.27, 0.025, 4, 10), { c: PAL.rust, p: [0, y, 0], r: [PI / 2, 0, 0], g: 'cask' });
    k.add(cyl(0.025, 0.03, 0.22, 5), { c: PAL.iron, p: [0.06, 0.36, 0], r: [0, 0, -0.25], g: 'fuse' });
    k.add(ball(0.045, 6, 4), { c: PAL.rustL, fx: [0, 1.4, 0, 0.4], p: [0.12, 0.47, 0], g: 'fuse' });
    k.muzzle('fuse', [0.12, 0.47, 0]).muzzle('burst', [0, 0, 0]).halo([0.12, 0.48, 0], 0.32, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'burst', size: 0.7 };
  },

  escort() {
    const k = new FoeKit(), D = 0.22;
    k.add(hull({ L: 1.35, B: 0.55, D, bow: 0.4, stern: 0.6, sheer: 0.08 }), { c: tarHull(D), g: 'hull' });
    k.add(cyl(0.03, 0.04, 0.9, 5), { c: PAL.iron, p: [0, 0.45, 0.15], g: 'post' });
    // the great lantern: a reflector bowl round a lens facing ahead
    k.add(new THREE.SphereGeometry(0.26, 10, 6, 0, PI * 2, 0, PI / 2), { c: PAL.brass, p: [0, 0.95, 0.12], r: [PI / 2, 0, 0], g: 'lamp' });
    k.add(cyl(0.2, 0.2, 0.03, 10), { c: PAL.lens, fx: [0.9, 1, 0, 0], p: [0, 0.95, 0.13], r: [PI / 2, 0, 0], g: 'lamp' });
    k.add(new THREE.TorusGeometry(0.26, 0.03, 4, 10), { c: PAL.rust, p: [0, 0.95, 0.13], g: 'lamp' });
    k.add(cyl(0.18, 0.2, 0.08, 6), { c: PAL.iron, p: [0, 0.2, -0.35], g: 'cabin' });
    cradle(k, [0, 0.03, 0.42], 0.42);
    k.muzzle('lantern', [0, 0.95, 0.18]).halo([0, 0.95, 0.2], 0.45, HALO_CH.accent).halo([0, 0.95, 0.22], 0.35, HALO_CH.tell);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 1.4 };
  },

  gunship() {
    const k = new FoeKit(), D = 0.6, L = new FoeKit(), R = new FoeKit(), C = new FoeKit(), SL = new FoeKit(), SR = new FoeKit();
    k.add(hull({ L: 5, B: 1.45, D, bow: 0.34, stern: 0.6, sheer: 0.22, segs: 12, ring: 10 }), { c: tarHull(D), g: 'hull' });
    k.add(box(1.3, 0.22, 0.9), { c: PAL.wood, p: [0, 0.18, -1.95], g: 'aftcastle' });
    k.add(tube([[0, 0.12, 2.3], [0, 0.35, 2.9], [0, 0.55, 3.25]], 0.035, 3, 4), { c: PAL.wood, g: 'bowsprit' });
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k.add(box(0.04, 0.09, 0.14), { c: PAL.socket, fx: [0, 0.6, 0, 0], p: [s * 0.71, -0.1, 1.3 - i * 0.75], g: `port${i}${s}` }); // (gunports)
    for (const [z, h] of [[1.25, 2.9], [-1.15, 2.6]]) {
      const gm = `mast${z}`;
      k.add(cyl(0.05, 0.07, h, 6), { c: PAL.wood, p: [0, h / 2, z], g: gm });
      for (let j = 0; j < 2; j++) {
        const y = h * (0.45 + j * 0.33), w = 1.3 - j * 0.35;
        k.add(cyl(0.025, 0.025, w + 0.2, 4), { c: PAL.wood, p: [0, y + 0.42 - j * 0.05, z], r: [0, 0, PI / 2], g: gm });
        k.add(slab([[-w / 2, 0], [w / 2, 0], [w / 2 * 0.85, 0.75 - j * 0.15], [-w / 2 * 0.85, 0.75 - j * 0.15]], 0.025), { c: (x, yy) => (yy < y - 0.2 ? PAL.sailD : PAL.sail), p: [0, y - 0.33, z], g: gm });
      }
    }
    lantern(k, [0, 0.55, -2.45], 0.8);
    lantern(k, [0, 0.62, 3.2], 0.6);
    gun(L, [0, 0, 0], { s: 1.25, barrels: 2, len: 0.7, muzzle: 'gunL' });
    gun(R, [0, 0, 0], { s: 1.25, barrels: 2, len: 0.7, muzzle: 'gunR' });
    // the core: the forged cradle midships, shuttered (two leaves that slide apart: railfoes.js openCore)
    cradle(C, [0, 0, 0], 1.5, 'cradle', 1);
    C.muzzle('core', [0, 0.2, 0]).halo([0, 0.2, 0], 0.5, HALO_CH.weak);
    for (const [K, s] of [[SL, 1], [SR, -1]]) K.add(box(0.5, 0.05, 0.92), { c: PAL.ironL, p: [-s * 0.25, 0, 0], g: 'leaf' }).add(box(0.06, 0.08, 0.9), { c: PAL.rust, p: [-s * 0.47, 0.04, 0], g: 'leaf' });
    return {
      pieces: [
        { name: 'body', kit: k },
        { name: 'gunL', kit: L, at: [0.5, 0.2, 0.55], own: true }, { name: 'gunR', kit: R, at: [-0.5, 0.2, 0.55], own: true },
        { name: 'core', kit: C, at: [0, 0.12, -0.4], own: true },
        { name: 'leafL', kit: SL, at: [0.5, 0.28, 0], parent: 'core', slide: 1 }, { name: 'leafR', kit: SR, at: [-0.5, 0.28, 0], parent: 'core', slide: -1 },
      ],
      death: 'break', size: 5.2,
    };
  },

  blocker() {
    const k = new FoeKit(), D = 0.95;
    // keel up: the hull turned over, the rust of its bottom now its top
    k.add(hull({ L: 5.4, B: 1.9, D, bow: 0.3, stern: 0.7, sheer: 0.12, segs: 12, ring: 10 }), { c: (x, y) => (y > D * 0.7 ? PAL.rust : y > D * 0.35 ? 0x4a3226 : PAL.iron), r: [0, 0, PI], p: [0, 0.1, 0], g: 'hull' });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) k.add(box(0.08, 0.5, 0.95), { c: i % 2 ? PAL.ironL : PAL.iron, p: [s * 0.93, 0.35, 1.9 - i * 0.95], r: [0, s * 0.05 * (i - 2), s * -0.18], g: `plate${i}${s}` });
    k.add(box(0.14, 0.1, 4.2), { c: PAL.iron, p: [0, D + 0.15, 0], g: 'keel' });
    k.add(box(0.06, 0.04, 3.4), { c: 0xbca070, fx: [0, 0, 1.6, 0], p: [0, D + 0.215, 0], g: 'seam' }); // (the weak point: a seam along the keel)
    k.add(box(0.06, 0.6, 0.45), { c: PAL.rust, p: [0, D - 0.05, -2.65], g: 'rudder' });
    for (const [z, l, a] of [[1.0, 1.2, 0.3], [-0.9, 0.9, -0.4]]) k.add(cyl(0.05, 0.07, l, 5), { c: PAL.wood, p: [0, -0.4 - l / 2 + 0.2, z], r: [a, 0, 0.2], g: `stub${z}` }); // (masts snapped, hanging under)
    for (let i = 0; i < 3; i++) k.halo([0, D + 0.25, -1.2 + i * 1.2], 0.6, HALO_CH.weak);
    cradle(k, [0, D + 0.2, -1.95], 0.6, 'keel');
    k.weak([0, D + 0.22, 0]);
    return { pieces: [{ name: 'body', kit: k }], death: 'break', size: 5.4 };
  },

  grappler() {
    const k = new FoeKit(), H = new FoeKit(), Ln = new FoeKit(), D = 0.2;
    k.add(hull({ L: 1.15, B: 0.5, D, bow: 0.45, stern: 0.65, sheer: 0.08 }), { c: tarHull(D), g: 'hull' });
    k.add(cyl(0.1, 0.1, 0.34, 8), { c: PAL.iron, p: [0, 0.12, 0.25], r: [0, 0, PI / 2], g: 'winch' });
    k.add(cyl(0.11, 0.11, 0.06, 8), { c: PAL.rust, p: [0, 0.12, 0.25], r: [0, 0, PI / 2], g: 'winch' });
    k.add(cyl(0.025, 0.03, 0.55, 4), { c: PAL.iron, p: [0, 0.32, 0.42], r: [0.9, 0, 0], g: 'arm' });
    k.add(box(0.3, 0.16, 0.3), { c: PAL.wood, p: [0, 0.1, -0.3], g: 'cabin' });
    lantern(k, [0, 0.3, -0.45], 0.55, 'lantern', false); // (no halo: the grappler's draws are four)
    cradle(k, [0, 0.03, -0.02], 0.4, 'cradle', 0, false);
    k.muzzle('winch', [0, 0.5, 0.62]);
    // the grapnel: a shank and four flukes, its eye at its origin (the line's end)
    H.add(cyl(0.025, 0.025, 0.32, 5), { c: PAL.iron, p: [0, 0, 0.16], r: [PI / 2, 0, 0], g: 'hook' });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2; H.add(new THREE.TorusGeometry(0.11, 0.02, 3, 6, PI * 0.75), { c: PAL.rustL, p: [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.3], r: [0, PI / 2, a], s: 1, g: 'hook' }); }
    H.add(ball(0.04, 6, 4), { c: PAL.rustL, fx: [0, 1, 0, 0], p: [0, 0, 0.34], g: 'hook' });
    H.muzzle('hook', [0, 0, 0.34]).halo([0, 0, 0.34], 0.2, HALO_CH.tell);
    // the line: a unit length along +Z, stretched to the hook (railfoes.js)
    Ln.add(box(0.025, 0.025, 1).translate(0, 0, 0.5), { c: PAL.ironL, g: 'line' });
    return {
      pieces: [{ name: 'body', kit: k }, { name: 'line', kit: Ln, at: [0, 0.5, 0.62], moves: true }, { name: 'hook', kit: H, at: [0, 0.2, 1.4], moves: true }],
      death: 'break', size: 1.2,
    };
  },
};
