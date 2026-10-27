// ---------------------------------------------------------------------------------------
// THE SHIP KIT'S FIGUREHEADS: a carved figure on each class's bow under its bowsprit or on its beak (the owner, 2026-10-27: "more
// sailing-ship like presence with figureheads"), written into the ship's one static mesh (shipkit/hullkit.js), each of Lachryma or the
// clay folk's, one a class:
//   jar      the sloop's: a gilded Pneuka Jar with a herald's gold wings, a letter held across its belly (the courier's trade), its band
//            of Lachrymite lit in the ship's feeling
//   spirit   the frigate's: a feeling's spirit, a robed figure in cream glaze whose robe flows back into the stem, arms swept back, its
//            wings Lachrymite shards lit in the ship's feeling, a gold circlet
//   clapper  the destroyer's: a glazed clapperjar (the clay folk's lowest tier) leaning out, its hands clapped forward over the water,
//            its mask's eyes lit: the hunter's hound
//   court    the galleon's: a gilded figure of the clay folk's Court, crowned, holding a Lachryma cube aloft (the treasure it carries),
//            its mantle in the hull's red flowing back
//   drop     the tanker's: a great teardrop of Lachryma held in two cupped gold hands, lit in the ship's feeling (the crude it carries)
// Codes as the mesher's (0.6 .. 1: lit in the ship's feeling, the look's `feeling`). The figure's own frame: its foot at the origin,
// rising along +Y, facing +Z; placed at the stem's head and leaned out over the water.
// Prior art: the age of sail's figureheads (HMS Victory's, the Cutty Sark's Nannie leaning out with an arm forward, the Vasa's lion,
// a ship's billethead scroll), Rogue Galaxy's Dorgenark and Skies of Arcadia's Delphinus (sky ships that keep the figurehead).
//
//   figurehead(M, kind, { at: [x, y, z], lean, k, cols: { gold, glaze, body, dark, white, glow } })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const JAR = [[0, 0], [0.03, 0.34], [0.1, 0.66], [0.24, 0.93], [0.4, 1], [0.58, 0.95], [0.74, 0.78], [0.84, 0.6], [0.9, 0.5], [0.95, 0.54], [1, 0.6]]; // (the Pneuka Jar's profile, foot to lip: vfx/sloop.js JAR)
const POT = [[0, 0.5], [0.2, 0.82], [0.5, 1], [0.78, 0.82], [0.92, 0.55], [1, 0.6]]; // (a clapperjar's squat belly)

/** A pot turned from a profile ([u, r] foot to lip) along +Y: `H` tall, `R` round. */
function turned(M, prof, H, R, col, code = 0, n = 10, y0 = 0) {
  for (let i = 0; i < prof.length - 1; i++) M.cyl([0, y0 + prof[i][0] * H, 0], [0, y0 + prof[i + 1][0] * H, 0], Math.max(0.02, prof[i][1] * R), Math.max(0.02, prof[i + 1][1] * R), n, col, code, { caps: i === 0 || i === prof.length - 2 });
}

/** The scrolled gold bracket a figure stands on, curling back into the stem. */
function bracket(M, gold) {
  M.cyl([0, 0.35, 0.15], [0, -0.2, -0.7], 0.32, 0.22, 6, gold, 0);
  M.cyl([0, -0.2, -0.7], [0, -0.75, -0.9], 0.22, 0.12, 6, gold, 0);
  M.gem([0, -0.85, -0.95], 0.16, 0.12, 0.12, 6, gold, 0);
}

export function figurehead(M, kind, { at, lean = 0.5, k = 1, cols = {} }) {
  const C = { gold: 0xf2c14e, glaze: 0xeee3c8, body: 0xc8322b, dark: 0x1f2a4a, white: 0xf6f2ea, glow: 0xcfe8ff, ...cols };
  const m = new THREE.Matrix4().makeTranslation(...at).multiply(new THREE.Matrix4().makeRotationX(lean)).multiply(new THREE.Matrix4().makeScale(k, k, k));
  M.xf(m, (G) => {
    bracket(G, C.gold);
    if (kind === 'jar') {
      const H = 2.4, R = 0.95; turned(G, JAR, H, R, C.gold, 0, 10, 0.2);
      G.cyl([0, 0.2 + H * 0.56, 0], [0, 0.2 + H * 0.62, 0], R * 0.97, R * 0.92, 10, C.glow, 0.85, { caps: false }); // (its band of Lachrymite)
      G.gem([0, 0.2 + H + 0.1, 0], R * 0.45, 0.5, 0.05, 8, C.glow, 0.8); // (the lid's crystal)
      G.cyl([-0.9, 0.2 + H * 0.38, R * 0.98], [0.9, 0.2 + H * 0.38, R * 0.98], 0.2, 0.2, 8, C.white, 0); // (the letter it carries)
      for (const s of [1, -1]) {
        G.cyl([s * 0.98, 0.2 + H * 0.38, R * 0.98], [s * 1.08, 0.2 + H * 0.38, R * 0.98], 0.25, 0.25, 8, C.gold, 0);
        const w0 = [s * R * 0.85, 0.2 + H * 0.7, -0.1]; // (a herald's wing: three gold feathers swept back and up)
        for (let f = 0; f < 3; f++) G.tri(w0, [s * (R + 0.9 - f * 0.25), 0.2 + H * (0.95 + f * 0.12), -0.6 - f * 0.45], [s * (R + 0.4 - f * 0.1), 0.2 + H * (0.62 + f * 0.05), -0.9 - f * 0.5], C.gold, 0, [0, H * 0.7, 0]);
      }
    } else if (kind === 'spirit') {
      G.cyl([0, 0, 0], [0, 1.6, 0.1], 0.6, 0.34, 8, C.glaze, 0); // (the robe)
      G.cyl([0, 0.4, -0.1], [0, -0.5, -1.4], 0.5, 0.12, 8, C.glaze, 0); // (flowing back into the stem)
      G.cyl([0, 1.6, 0.1], [0, 2.3, 0.18], 0.34, 0.28, 8, C.glaze, 0);
      G.gem([0, 2.62, 0.22], 0.26, 0.32, 0.26, 7, C.white, 0); // (the face, upturned)
      G.cyl([0, 2.72, 0.2], [0, 2.8, 0.2], 0.29, 0.29, 8, C.gold, 0, { caps: false }); // (a gold circlet)
      for (const s of [1, -1]) {
        G.cyl([s * 0.3, 2.2, 0.16], [s * 0.85, 1.75, -0.7], 0.11, 0.08, 5, C.glaze, 0); // (arms swept back)
        for (let i = 0; i < 4; i++) G.gem([s * (0.35 + 0.28 * i), 2.15 + 0.3 * i, -0.35 - 0.22 * i], 0.13, 1.25 - 0.22 * i, 0.15, 5, C.glow, 0.85 - 0.04 * i, { axis: [s * (0.5 + 0.2 * i), 0.7, -0.9] }); // (its wings: Lachrymite shards)
      }
    } else if (kind === 'clapper') {
      turned(G, POT, 1.7, 0.85, C.body, 0.1, 10, 0.25);
      G.cyl([0, 1.95, 0], [0, 2.05, 0], 0.55, 0.52, 10, C.gold, 0, { caps: false });
      G.gem([0, 2.1, 0], 0.32, 0.45, 0.05, 6, C.white, 0); // (its topknot)
      const fy = 1.2, fz = 0.8; G.poly(Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return [Math.cos(a) * 0.45, fy + Math.sin(a) * 0.4, fz + 0.06]; }), C.white, 0, [0, fy, 0]); // (the mask)
      for (const s of [1, -1]) {
        G.quad([s * 0.08, fy + 0.06, fz + 0.09], [s * 0.3, fy + 0.1, fz + 0.07], [s * 0.3, fy + 0.18, fz + 0.07], [s * 0.08, fy + 0.15, fz + 0.09], C.glow, 0.5, [0, fy, 0]); // (its eyes, lit)
        G.cyl([s * 0.72, 1.1, 0.25], [s * 0.2, 1.4, 1.35], 0.17, 0.12, 6, C.dark, 0);
        G.gem([s * 0.1, 1.42, 1.45], 0.17, 0.2, 0.2, 6, C.white, 0, { axis: [s, 0, 0] }); // (the hands, clapped)
      }
    } else if (kind === 'court') {
      G.cyl([0, 0, 0], [0, 1.8, 0.1], 0.72, 0.38, 8, C.gold, 0);
      G.cyl([0, 1.1, -0.25], [0, -0.4, -1.5], 0.6, 0.18, 8, C.body, 0); // (its mantle flowing back)
      G.cyl([0, 1.8, 0.1], [0, 2.5, 0.14], 0.38, 0.32, 8, C.gold, 0);
      G.gem([0, 2.85, 0.16], 0.27, 0.32, 0.26, 7, C.white, 0); // (the porcelain face)
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; G.gem([Math.cos(a) * 0.22, 3.1, 0.16 + Math.sin(a) * 0.22], 0.07, 0.24, 0.02, 4, C.gold, 0); } // (its crown)
      G.cyl([0.33, 2.4, 0.12], [0.55, 3.3, 0.45], 0.13, 0.1, 5, C.gold, 0); // (the arm raised)
      G.xf(new THREE.Matrix4().makeTranslation(0.6, 3.62, 0.5).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.6, 0.78, 0.6))), (H) => H.box([0, 0, 0], [0.5, 0.5, 0.5], C.glow, 0.85)); // (the cube it holds aloft, lit)
      G.cyl([-0.33, 2.4, 0.12], [0.05, 2.05, 0.5], 0.13, 0.1, 5, C.gold, 0);
    } else if (kind === 'drop') {
      G.gem([0, 1.25, 0.3], 0.85, 1.5, 0.75, 10, C.glow, 0.9, { axis: [0, 1, 0.2] }); // (the drop of Lachryma)
      for (const s of [1, -1]) for (let f = 0; f < 4; f++) {
        const z = -0.3 + f * 0.32, a = [s * 0.25, 0.25, z], b = [s * 0.95, 0.75, z + 0.1], c = [s * 0.8, 1.35, z + 0.15]; // (a gold finger curling up round it)
        G.cyl(a, b, 0.13, 0.12, 5, C.gold, 0); G.cyl(b, c, 0.12, 0.08, 5, C.gold, 0);
      }
      G.box([0, 0.2, 0.0], [0.9, 0.25, 1.3], C.gold, 0); // (the palms)
    }
  });
}
