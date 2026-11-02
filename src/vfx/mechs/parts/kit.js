// ---------------------------------------------------------------------------------------
// A MECH PART'S KIT: the shapes, the palette and the programs every mech part's look is built with (the part library, vfx/mechs/parts/;
// assembled by the parts body, vfx/mechs/partsbody.js). A part fills one segment (`seg()`: four pieces, one a program) in its joint's
// frame (+Y up a limb, -Y down it, +Z the body's front, +X the frame's left), six pieces a segment, one a program:
//   p      the porcelain plates (the Courier's body glaze goes on them: their vertex tones only light and shade, bone to grey)
//   core   the interstitial under the shell: the core inside a barrel, a groove's floor, the waist, a limb between its plates (the
//          Courier's skin goes on it: Lachryma's soft lit body showing through the gaps)
//   trim   the pauldrons and the accent bands and rims (the Courier's trim glaze); authored in neutral tones, never a hue of its own
//   g      the gold and bronze (the ball joints, the kintsugi seams, a road wheel)
//   l      the labradorite: a small lens or gem only (Lachryma's dark stone, its schiller baked in, vfx/oxidation.js `schillerInk`)
//   e      the glow (the eyes, a lens, a nozzle's throat: lit while sealed)
// Porcelain, core and trim are plain MeshStandardMaterials (vertex coloured, no program of their own), so the Courier's finish can
// be chained onto them after the build. Hard surface the house's way: a groove is a real gap between two plates over the core, a
// chamfer an extrusion's bevel, a socket a cup the ball sits in, so any part's ball fits any part's cup.
// A FORM (FORMS): the proportions a whole frame is built in: `hero` (the clay warrior, a top-heavy inverted triangle; its gauntlets
// 12% larger, `gauntlet`, South, 2026-11-02) or `doll` (Haydee's white android, Elemental Gearbolt's mechanical girls). The doll is the
// hero's complement (South, 2026-11-02: "pear shape over hourglass ... almost fertility idol vibes, which is all in the hips and
// thighs"): the triangle the other way, a narrow top over a broad pelvis and thick tapering thighs, the weight low; it wears a floating
// helm over the collar, never a head (`helm`, the one worn when none is chosen: vfx/mechs/helms.js), and its ball joints are the
// Courier's skin (`jointBall`: the core program, South, 2026-11-02: "accentuate the ball joints on the female mecha with the courier
// skin color"), the hero's gold. Drossel's form was folded into the doll as modular pieces (South, 2026-11-02): her crinoline a hip
// piece (parts/hips.js), her puffed sleeve a pauldron (parts/pauldrons.js `puff`). Every part reads `S.F`; a form with `fem` set is
// built by the feminine library (femcores.js, femlegs.js, femlimbs.js, femheads.js).
// Prior art: the decor kit's Piece (vfx/garden/decorpieces/kit.js); Gundam's real-robot panel lines cut as gaps (Okawara's "realistic
// joints, panels"); the ball-jointed doll's ball in its cup; kintsugi's gold line on a mend; Elemental Gearbolt (Alfa System, 1997)
// and Haydee (Haydee Interactive, 2016) for the doll form; the ball-jointed doll's skin-toned balls (Volks' Super Dollfie).
//
//   MECH_LOOK (the palette and the shared sizes)   FORMS   formOf(id)   seg(F)   band(prof, y0, y1, k, n)   profAt(prof, y)   panel(prof, a0, a1, seg)
//   plate(pts, depth, bev)   sidePlate   mirror   shell(prof, seg, start, len)   sculpt(geo, fn)   curved(prof, th, a0, a1, seg)
//   cup(r)   limb(p, prof, c, foot, cupR, sc, core)   seam(P, pts, r, c)   labTone(ph, k)   ball(P, r, at)   jointBall(S, r, at) (the form's)   threadGeometry(r, turns, pitch, tube)
//   crackNet(r, seed, c) -> Piece   aimOf(dy, dz) -> rotation.x pointing a joint's -Y along (dy, dz)   mechMaterials() -> mats
//   bake(joint, S, mats, owned) -> the meshes added (one a program)   tube(P, pts, r, c) (a smooth rod through points)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../../garden/decorpieces/kit.js';
import { schillerInk } from '../../oxidation.js';

/** The palette (sRGB): porcelain bone and ivory; the earth tones (warm grey, sand, umber, a muted terracotta, ochre, slate, the kiln's
 *  tenmoku and ash); gold and bronze for joints and seams only; the labradorite's dark base; a hollow's dark; the film's light; the
 *  glass. And the shared sizes (m): the waist over the pelvis, the chest's base over the waist, the cradle over the chest's base
 *  (so the seat stands 3 m over the hip: world/hangar/mech.js seatOf), the bore and its depth, the boss's stand-off. */
export const MECH_LOOK = {
  bone: 0xece4d4, ivory: 0xdacfb8, grey: 0x8f857b, sand: 0xc4b294, umber: 0x3b2e26, terracotta: 0x96634c, ochre: 0xa98d5f,
  slate: 0x585d63, tenmoku: 0x4b3529, ash: 0x7f776a, gold: 0xd4a94e, bronze: 0x93683a, lab: 0x2b333d, hollow: 0x140a08,
  film: 0xd8ccff, glass: 0x9fc4ff, ember: 0xffa04a,
  // the shell's tonal range (multiplied by the body glaze), the interstitial's (by the skin) and the trim's (by the trim glaze)
  pale: 0xf4efe6, mid: 0xc9c2b6, dark: 0x9a9286, core: 0xc8c4be, coreD: 0x8c8780, trimL: 0xf0ebe2, trimM: 0xcfc8bc, trimD: 0x9d958a,
  waist: 0.45, chestBase: 0.75, cradleY: 1.8, bore: 0.78, depth: 1.0, boss: 0.42,
};
const L = MECH_LOOK, PI = Math.PI;

/** A frame's proportions: limb radii, hand size, the ribcage's [width, -, depth], the hips' width, the head's size (a feminine form's:
 *  the floating helm's), the pauldron's scale, the joints' balls, a heel (a raised ankle), the grooves' count (1 all, 0 the fewest),
 *  the gauntlets' scale (forearms and hands), `fem` (which feminine build) and `helm` (the helm a feminine form wears while none is
 *  chosen). The doll's balls 0.70 (0.62 before South asked them shown, 2026-11-02). */
export const FORMS = {
  hero: { id: 'hero', fem: null, limb: 1, hand: 1, chest: [1, 1, 1], hips: 1, head: 1, pauldron: 1, joint: 1, heel: 0, grooves: 1, gauntlet: 1.12 },
  doll: { id: 'doll', fem: 'haydee', limb: 0.62, hand: 0.82, chest: [0.66, 1, 0.8], hips: 1.45, head: 0.84, pauldron: 0.7, joint: 0.7, heel: 1, grooves: 0, gauntlet: 1, helm: 'negroli' },
};
export const formOf = (id) => FORMS[id?.id || id] || FORMS.hero;
/** One segment's pieces (porcelain, core, trim, gold, labradorite, glow) and the form it is built in. */
export const seg = (F = FORMS.hero) => ({ p: new Piece(), core: new Piece(), trim: new Piece(), g: new Piece(), l: new Piece(), e: new Piece(), F });
/** A geometry's every vertex moved by fn(x, y, z) -> [x, y, z], its normals made again (a lathe pressed into a plan's shape). */
export function sculpt(geo, fn) {
  const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { const [x, y, z] = fn(P.getX(i), P.getY(i), P.getZ(i)); P.setXYZ(i, x, y, z); }
  geo.computeVertexNormals(); return geo;
}

/** A hard-surface plate: an outline [[x, y], ...] extruded `depth` along Z (centred on z 0), its edges chamfered by `bev`. */
export function plate(pts, depth, bev = 0.06) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 }).translate(0, 0, -depth / 2);
}
/** The same plate drawn side-on: an outline [[z, y], ...] extruded `width` across X (a foot, a beak, a crest). */
export const sidePlate = (pts, width, bev) => plate(pts, width, bev).rotateY(-PI / 2);
/** An outline mirrored across x 0 (the frame's right of its left). */
export const mirror = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
/** A lathed shell: profile [[radius, y], ...] round Y, all the way or a part of the way round. Smooth at 480 lines: 28 round. */
export const shell = (pts, seg = 28, start = 0, len = PI * 2) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, start, len);
/** A profile's stretch between heights y0 and y1, its radii x k, in n steps (a panel cut from a barrel). */
export function profAt(prof, y) {
  for (let i = 1; i < prof.length; i++) { const [r0, a] = prof[i - 1], [r1, b] = prof[i]; if (y <= b || i === prof.length - 1) { const t = Math.min(1, Math.max(0, (y - a) / (b - a || 1))); return r0 + (r1 - r0) * t; } }
  return prof[0][0];
}
export function band(prof, y0, y1, k = 1, n = 6) {
  const out = []; for (let i = 0; i <= n; i++) { const y = y0 + ((y1 - y0) * i) / n; out.push([profAt(prof, y) * k, y]); } return out;
}
/** A curved plate of thickness th: a profile [[r, y], ...] (its outer face) lathed between phi a0 and a1 with its inner face th in,
 *  closed at its top and foot (a tasset, a greave, a lame: curved both ways when the profile bows). */
export function curved(prof, th, a0, a1, seg = 14) {
  const loop = [...prof, ...[...prof].reverse().map(([r, y]) => [Math.max(0.001, r - th), y])]; loop.push(prof[0]);
  return shell(loop, Math.max(4, Math.round(seg * (a1 - a0))), a0, a1 - a0);
}
/** A curved panel: the stretch of a barrel between phi a0 and a1 (0 the front, +X the left), so the gap to the next is a real groove. */
export const panel = (prof, a0, a1, seg = 10) => shell(prof, Math.max(3, Math.round(seg * (a1 - a0))), a0, a1 - a0);
/** A socket cup for a ball of radius r at the origin: a thick dome over its +Y half, its lip just past the equator. */
export const cup = (r) => shell([[r * 1.18, -r * 0.24], [r * 1.3, r * 0.1], [r * 1.18, r * 0.6], [r * 0.74, r * 0.97], [0.001, r * 1.1]], 24);
/** A limb's lathed shell down -Y, a cup at its foot (`foot` down, over the top of the next joint's ball of `cupR`); with `core`, the
 *  interstitial's thinner column inside it running the whole length (seen in its grooves). */
export function limb(p, prof, c, foot, cupR, sc = [1, 1, 1], core = null) {
  p.lathe(prof, { c, sc }, 28); if (cupR) p.geo(cup(cupR), { at: [0, -foot, 0], c: L.ivory });
  if (core) { const r = Math.min(...prof.map(([x]) => x)) * 0.92; core.lathe([[r, prof[0][1]], [r, prof[prof.length - 1][1]]], { c: L.core, sc }, 18); }
}
/** A smooth tube through points (a panel's raised line, a lace, a hem), in `P`. */
export function tube(P, pts, r = 0.04, c = L.gold, seg = 24) {
  P.geo(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), seg, r, 6, false), { c });
}
/** A kintsugi seam: a gold line run along points (a crack mended), in `P`. */
export function seam(P, pts, r = 0.035, c = L.gold) { for (let i = 1; i < pts.length; i++) P.rod(pts[i - 1], pts[i], r, { c }, 4); }
const _s = new THREE.Color();
/** A labradorite plate's colour: the stone's dark base with the film's schiller coming up through it at phase `ph` (restrained: k). */
export const labTone = (ph, k = 0.14) => new THREE.Color(L.lab).lerp(schillerInk(ph, _s), Math.min(k, 0.2));
/** A ball joint in gold (the Courier's own make, at giant scale). */
export const ball = (P, r, at = [0, 0, 0], c = L.gold) => P.ball(r, { at, c }, 24, 16);
/** A frame's ball joint in its form's material: the doll's in the core program (the Courier's skin, lit; vertex white so the skin
 *  reads at full strength), the hero's gold. */
export const jointBall = (S, r, at = [0, 0, 0]) => (S.F?.fem ? S.core.ball(r, { at, c: 0xffffff }, 24, 16) : ball(S.g, r, at));
/** The rotation.x that points a joint's -Y along (0, dy, dz). */
export const aimOf = (dy, dz) => Math.atan2(-dz, -dy);

/** A helix of `turns` round +Z, radius r, advancing `pitch` a turn into -Z: the cradle's screw thread. */
export function threadGeometry(r, turns, pitch, tube) {
  const pts = []; for (let i = 0; i <= 64 * turns; i++) { const a = (i / 64) * PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -(i / 64) * pitch)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64 * turns, tube, 6, false);
}

/** A net of cracks over a ball of radius r (a fractured joint's crazing, or its kintsugi once mended): five branching zigzags run
 *  over the sphere from seeded points. */
export function crackNet(r, seed = 1, c = L.gold, tube = 0.035) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const P = new Piece(), v = new THREE.Vector3(), t = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let k = 0; k < 5; k++) {
    v.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(); t.crossVectors(v, up).normalize(); if (t.lengthSq() < 0.1) t.set(1, 0, 0);
    const pts = []; const p = v.clone();
    for (let i = 0; i < 7; i++) {
      pts.push(p.clone().multiplyScalar(r * 1.015).toArray());
      t.applyAxisAngle(p, (rnd() - 0.5) * 1.6); p.addScaledVector(t, 0.22 + rnd() * 0.1).normalize();
    }
    seam(P, pts, tube, c);
  }
  return P;
}

/** The programs every part shares (a mech is a few draws a segment): porcelain, core and trim (plain standard materials, vertex
 *  coloured: the Courier's glaze, skin and trim are chained onto them after the build; their own colours until then are the earth
 *  tones of the first pass), gold, labradorite, the glow, the glass, the bore's dark, the crazing's lit gold. */
export function mechMaterials() {
  return {
    p: new THREE.MeshStandardMaterial({ name: 'mech-porcelain', vertexColors: true, color: 0xf2ece0, roughness: 0.3, metalness: 0, side: THREE.DoubleSide }),
    core: new THREE.MeshStandardMaterial({ name: 'mech-core', vertexColors: true, color: 0x5e4a3e, roughness: 0.6, metalness: 0, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ name: 'mech-trim', vertexColors: true, color: 0xa87c64, roughness: 0.34, metalness: 0.05, side: THREE.DoubleSide }),
    g: new THREE.MeshStandardMaterial({ name: 'mech-gold', vertexColors: true, roughness: 0.3, metalness: 0.7, emissive: 0x1a1106 }),
    l: new THREE.MeshPhysicalMaterial({ name: 'mech-labradorite', vertexColors: true, roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12,
      iridescence: 0.25, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 760], side: THREE.DoubleSide }),
    e: new THREE.MeshBasicMaterial({ name: 'mech-glow', color: L.hollow, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ name: 'mech-glass', color: L.glass, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }),
    bore: new THREE.MeshStandardMaterial({ name: 'mech-bore', color: L.hollow, roughness: 0.95, side: THREE.BackSide }),
    crack: new THREE.MeshBasicMaterial({ name: 'mech-crack', color: L.ember, toneMapped: false }),
  };
}

/** A segment's pieces merged one a program and hung on its joint; each mesh pushed to `owned` (what its slot takes down). */
export function bake(joint, S, mats, owned) {
  const out = {};
  for (const k of ['p', 'core', 'trim', 'g', 'l', 'e']) {
    if (!S[k].pos.length) continue;
    const m = new THREE.Mesh(S[k].done(), mats[k]); m.castShadow = k !== 'e'; m.receiveShadow = k !== 'e'; m.name = `mech.${joint.name}.${k}`;
    joint.add(m); owned.push(m); out[k] = m;
  }
  return out;
}
