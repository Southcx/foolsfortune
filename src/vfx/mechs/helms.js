// ---------------------------------------------------------------------------------------
// A MECH'S HELM / A PLUME (plain names; South, 2026-11-02: "a fusion of sengoku samurai army leaders with incredibly ornate features,
// and eastern european medieval knight helms with extravagant feather plumes (with physics bones to sway)", and on review: "a stronger
// silhouette, more stylized with juxtaposed elements, animalistic and primal variants like power rangers. If you're doing honda's
// antlers, make it a beefy af stag"): a helm worn over any mech head (vfx/mechs/partsbody.js `joints.head`), the head's own shell set
// aside while it is worn, its plumes a chain of bones each, sprung toward their rest shape and swung by the frame's own motion (verlet,
// as hair and capes are). Each is one animal's spirit on a sengoku bowl and a knight's crest, told from 40 m by its silhouette alone:
// big confident shapes at a head's proportion (South, 2026-11-02, on the first set: "WAY too big and wide ... Maintain normal head
// proportions"; then "still too wide and about 20% too large ... a little too round, please make them icosahedron derived ... Chunky,
// battle ready, not dainty and fragile"): every bowl an icosahedron's dome, flat-shaded so each facet is a plate; the lames flat; horns,
// antlers and tusks thick five-sided beams ending in cut points; every bar and spar heavy; the plumes few and broad. FACELESS AND FLOATING (South: "it was much cooler when the mech didnt have a face and was just a floating helmet, kind
// of like the automatons from FFXI puppetmaster job"): under every brim only the dark of the empty shell and one faint light deep in it
// (lit with the cradle); the neck is hidden and the helm hangs over the collar with a gap, bobbing slowly. Eight:
//   stag         Honda Tadakatsu's antlers made heavy: thick branching beams about two heads across, a gold burr at each root, a
//                heavy brow, a tuft of rust between the beams
//   tyrant       a tyrannosaur's skull: its snout a short peak over the void, teeth hanging from the brim, a brow ridge with
//                hornlets, a short fan of feathers off the back
//   mammoth      a high double dome, ear flaps for fukigaeshi, tusks curling forward and up off the brim's cheeks, shaggy hair
//   sabretooth   a big cat's head: ears up, a frowning brow, two fangs hanging from the brim, a mane of plumes round the back and sides
//   pterosaur    a crest blade swept back from the brow, fukigaeshi as wings with their finger spars, two streamers off the crest
//   triceratops  a frill fanned behind the neck (its edge knobbed in gold), two horns over the brow
//   kabuto       the daimyo's: a ribbed dark bowl with a gold tehen, the shikoro flared, fukigaeshi turned back, Date Masamune's
//                crescent maedate tapering to points; a horsehair tuft off the back
//   szyszak      the winged hussar's: a fluted bowl with a spike, a peak, the sliding nasal over the void, cheek plates, the
//                lobster-tail, a bunch of ostrich plumes out of a crest of eagle's wings
// Built in the parts body's own programs: its porcelain for the shells (vertex-coloured in neutral bone, ivory and grey, so it takes
// the Courier's glaze as light and shade), its trim for the crests, horns, antlers, frills and accents (`mats.trim`; while the body has
// none, the porcelain tinted terracotta), its gold for edges, its own unlit dark for the void, its glow for the light inside. A plume is one ribbon mesh in the world (two crossed strips a feather on a feather card's alpha), rewritten each frame
// from its bones.
// Prior art: FFXI's automatons (the Puppetmaster's: a head floating over the frame on no neck, a mask with nothing behind it); the
// zords' helmets of Power Rangers (Mighty Morphin's Tyrannosaurus, Mastodon, Sabre-toothed Tiger, Pterodactyl and
// Triceratops: one animal read whole from the helm's outline, the visor in its mouth); the kawari-kabuto, the sengoku's "strange
// helmets" of animal and object crests (Honda Tadakatsu's antlers, Date Masamune's crescent, Kuroda's and Kato's tall hats, the
// rabbit-eared, the catfish-tailed); the suji-bachi, shikoro, fukigaeshi and menpo; the European crest helms of the tournament (the
// German and Burgundian great crests of beasts and horns, the Zürich armorial's), the szyszak and the hussars' plumes and wings; the
// verlet chains of hair and capes (Jakobsen, "Advanced Character Physics", 2001), and the tie in a skinned bone chain (VRM's spring bones).
//
//   HELMS[id] = { label }   wearHelm(body, id | null, scene) -> handle | null (the helm worn, the head's shell set aside; null takes it
//   off)   handle.update(rawDt)   handle.dispose()   installMechHelms(game) -> game.mechHelm(id) (the hangar's mech; `/helm id`)   HELM_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Piece } from '../garden/decorpieces/kit.js';
import { plate } from './parts/kit.js';

/** The colours: the shells' neutrals (bone, ivory, a warm grey, a dark lacquer), the trim's relative tones (the glaze is the colour),
 *  the terracotta the trim takes while the body has no trim program, the core's dark (and the neutral it is authored in where the core program carries its own colour), the gold; the plumes' earth tones. */
export const HELM_LOOK = {
  bone: 0xe6dccb, ivory: 0xd2c3a6, grey: 0x9a938a, dark: 0x3e3834, cord: 0x6a4a3a,
  trim: 0xffffff, trimD: 0xa8a8a8, trimDD: 0x6a6a6a, terracotta: 0xa45a3a, core: 0x1c1411, coreTone: 0x6a6662, gold: 0xd9ab4c,
  plume: { ivory: 0xece2cf, ochre: 0xc89a52, rust: 0xa45c3c, slate: 0x6c7076, umber: 0x5a4030 },
  fit: 0.58, narrow: 0.86, float: 0.42, bob: [0.06, 1.6], detail: 1, facets: 5, chunk: 1.4, // (a head's size; floated over the collar; the bob's height in the head's frame and its rate)
  gravity: 9.8, damping: 0.94, stiff: [0.32, 0.05],
};
const L = HELM_LOOK, PI = Math.PI, V = THREE.Vector3;

export const HELMS = {
  stag: { label: 'Stag helm' },
  tyrant: { label: 'Tyrant helm' },
  mammoth: { label: 'Mammoth helm' },
  sabretooth: { label: 'Sabretooth helm' },
  pterosaur: { label: 'Pterosaur helm' },
  triceratops: { label: 'Triceratops helm' },
  kabuto: { label: "Daimyo's kabuto" },
  szyszak: { label: "Hussar's szyszak" },
};

// ------------------------------------------------------------------ shapes, in head units (the bowl's radius R, its rim at y 0, the face +Z)
const R = 1.55;
const _Y = new V(0, 1, 0), _q = new THREE.Quaternion(), _eu = new THREE.Euler();
/** Points along a Bezier curve through control points (de Casteljau), n + 1 of them. */
function bez(ctrl, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; let P = ctrl.map((c) => new V(...c)); while (P.length > 1) P = P.slice(1).map((b, j) => P[j].clone().lerp(b, t)); out.push(P[0].toArray()); }
  return out;
}
/** A tube tapering from r0 to r1 along points (a horn, a beam, a tusk), balls at its knees and a rounded tip. */
function taper(P, pts, r0, r1, o = {}, seg = HELM_LOOK.facets) {
  const n = pts.length - 1; r0 *= HELM_LOOK.chunk; r1 *= HELM_LOOK.chunk; // (battle-ready: thick, few sides)
  for (let i = 0; i < n; i++) {
    const a = new V(...pts[i]), b = new V(...pts[i + 1]), d = b.clone().sub(a), len = d.length(); if (len < 1e-4) continue;
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    _q.setFromUnitVectors(_Y, d.normalize()); _eu.setFromQuaternion(_q, 'YXZ');
    P.geo(new THREE.CylinderGeometry(rb, ra, len * 1.02, seg, 1), { ...o, at: a.clone().add(b).multiplyScalar(0.5).toArray(), rot: [_eu.x, _eu.y, _eu.z] });
    if (i > 0) P.geo(gem(ra), { ...o, at: pts[i] });
  }
  P.geo(new THREE.ConeGeometry(r1 * 1.15, r1 * 3, seg, 1).translate(0, r1 * 1.5, 0), { ...o, at: pts[n], rot: (() => { const d = new V(...pts[n]).sub(new V(...pts[n - 1])).normalize(); _q.setFromUnitVectors(_Y, d); _eu.setFromQuaternion(_q, 'YXZ'); return [_eu.x, _eu.y, _eu.z]; })() }); // (a cut point, not a bead)
}
/** A point a share t along a polyline. */
const along = (pts, t) => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i; return new V(...pts[i]).lerp(new V(...pts[i + 1]), k).toArray(); };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A faceted knuckle (a knee of a horn, a boss): an icosahedron, flat-shaded. */
const gem = (r) => { const g = new THREE.IcosahedronGeometry(r, 0); g.computeVertexNormals(); return g; };
/** The helm's shell from an icosahedron (South, 2026-11-02: "a little too round, please make them icosahedron derived"): its upper
 *  half (the faces whose middles stand over the rim), stretched to radius r and height h, flat-shaded so every facet is a plate. */
function icoDome(r, h, detail = HELM_LOOK.detail) {
  const g = new THREE.IcosahedronGeometry(1, detail), P = g.attributes.position.array, keep = [];
  for (let i = 0; i < P.length; i += 9) if ((P[i + 1] + P[i + 4] + P[i + 7]) / 3 > -0.12) for (let k = 0; k < 9; k += 3) keep.push(P[i + k] * r, Math.max(P[i + k + 1], -0.12) * h, P[i + k + 2] * r);
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); out.computeVertexNormals(); g.dispose();
  return out;
}
/** A bowl, radius r, height h, its rim at y 0: the icosahedron's dome; `ribs` lays every other facet in `ribC` (a suji-bachi's
 *  plates, here the facets themselves); `sc` stretches it. */
function bowl(p, r, h, c, { ribs = 0, ribC = L.grey, sc = [1, 1, 1] } = {}) {
  const d = icoDome(r, h);
  if (!ribs) { p.geo(d, { c, sc }); return; }
  const P = d.attributes.position.array, A = [], B2 = []; // (every other facet in the second tone: the plates of a suji-bachi read as facets)
  for (let i = 0; i < P.length; i += 9) (((i / 9) % 2) ? B2 : A).push(...P.slice(i, i + 9));
  for (const [arr, col] of [[A, c], [B2, ribC]]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); p.geo(g, { c: col, sc }); }
  d.dispose();
}
/** The shikoro: `n` lames hanging from the rim, each wider and lower, open at the face (from -gap to gap round +Z). */
function shikoro(p, r, n, drop, flare, cs, cord, gap = 1.05) {
  for (let i = 0; i < n; i++) {
    const Rr = r * (1.0 + i * flare), y = -i * drop, len = PI * 2 - gap * 2;
    p.geo(new THREE.CylinderGeometry(Rr, Rr + flare * r * 0.9, drop * 1.06, 10, 1, true, gap, len), { at: [0, y - drop / 2, 0], c: cs[i % cs.length] });
    p.geo(new THREE.TorusGeometry(Rr + flare * r * 0.9, 0.06, 4, 10, len).rotateX(PI / 2).rotateY(-(PI / 2 + gap)), { at: [0, y - drop, 0], c: cord });
  }
}
/** A flat outline (x, y) extruded thin and placed: a wing, an ear, a fukigaeshi. Mirrored for the right side by s. */
function flat(P, pts, s, o, depth = 0.08) {
  const q = s < 0 ? pts.map(([x, y]) => [-x, y]).reverse() : pts;
  P.geo(plate(q, depth, 0.025), o);
}
/** The fukigaeshi: the top lames turned back at the temples, a wing each side, gold-rimmed. */
function fukigaeshi(p, g, r, size = 1, c = L.dark) {
  for (const s of [-1, 1]) {
    const pts = [[0, 0.1], [0.7 * size, 0.35 * size], [0.85 * size, -0.25 * size], [0.1, -0.5 * size]];
    flat(p, pts, s, { at: [s * r * 0.9, 0.0, r * 0.38], rot: [0, s * 0.95, 0], c });
    g.rod([s * r * 0.9, 0.1, r * 0.38], [s * (r * 0.9 + 0.7 * size * Math.cos(0.95)), 0.35 * size, r * 0.38 - 0.7 * size * Math.sin(0.95)], 0.04, {}, 5);
  }
}
/** Teeth along a jaw's U: cones pointing up (dir 1) or down (-1). */
function teeth(P, Rr, cz, y, arc, n, len, dir, o, sc = [1, 1]) {
  for (let i = 0; i < n; i++) {
    const a = PI / 2 - arc / 2 + (arc * (i + 0.5)) / n, big = Math.abs(i - (n - 1) / 2) > (n - 1) * 0.3 ? 1.35 : 1;
    P.cone(0.075 * big, len * big, { ...o, at: [Math.cos(a) * Rr * sc[0], y + dir * len * big * 0.5, cz + Math.sin(a) * Rr * sc[1]], rot: [dir > 0 ? 0 : PI, 0, 0] }, 6);
  }
}

// ------------------------------------------------------------------ the helms
function stag(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 0.92, L.bone, { sc: [1, 1, 1.05] });
  p.arc(R * 0.9, 0.12, { rot: [0, PI / 2, 0], sc: [1, 1.02, 1.1], c: L.grey }, PI, 18); // (a ridge over the crown)
  g.ring(R, 0.06, { at: [0, 0.03, 0], sc: [1, 1, 1.05] }, 32);
  shikoro(p, R, 4, 0.3, 0.12, [L.bone, L.grey], L.cord);
  fukigaeshi(p, g, R, 1.15, L.grey);
  // the brow: heavy, its ridge over each eye, a gold mon between
  for (const s of [-1, 1]) t.box(1.25, 0.38, 0.7, { at: [s * 0.6, 0.0, R * 0.86], rot: [-0.2, s * 0.3, s * -0.22], c: L.trimD }, 0.14);
  g.cyl(0.22, 0.22, 0.08, { at: [0, 0.22, R * 1.06], rot: [PI / 2 - 0.3, 0, 0] }, 14);
  // the antlers: a beam each side, thick and branching, a head's own antlers (about two heads across)
  for (const s of [-1, 1]) {
    const beam = bez([[s * 0.75, 0.7, 0.35], [s * 1.5, 1.0, 0.55], [s * 1.95, 1.9, 0.0], [s * 1.9, 2.7, -0.55]], 10);
    taper(t, beam, 0.26, 0.09, { c: L.trim });
    g.ball(0.32, { at: beam[0], sc: [1, 0.75, 1] }, 14, 8); // (the burr)
    for (const [k, d, r0] of [[0.12, [s * 0.3, 0.55, 0.9], 0.16], [0.38, [-s * 0.2, 1.0, 0.35], 0.16], [0.62, [-s * 0.35, 0.9, 0.1], 0.13], [0.82, [s * 0.4, 0.7, -0.2], 0.11]]) {
      const a = along(beam, k), m = add(a, [d[0] * 0.55, d[1] * 0.45, d[2] * 0.55]), e = add(a, d);
      taper(t, bez([a, m, add(e, [0, 0.15, 0])], 5), r0, 0.05, { c: L.trim });
    }
  }
  B.plumes.push({ at: [0, R * 0.85, -R * 0.25], dir: [0, 1, -0.55], len: 2.4, n: 6, w: 0.6, c: L.plume.rust, kind: 'tuft', count: 5, spread: 0.3, tint: [L.plume.ochre, L.plume.rust, L.plume.umber, L.plume.rust, L.plume.ochre] });
}

function tyrant(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 0.78, L.bone, { sc: [1, 1, 1.15] });
  shikoro(p, R, 3, 0.3, 0.1, [L.grey, L.bone], L.cord, 1.25);
  // the upper jaw: the skull's snout as a short peak over the void, its teeth hanging from the brim
  p.box(R * 1.5, 0.4, 1.1, { at: [0, -0.02, R * 0.85], rot: [-0.06, 0, 0], c: L.bone }, 0.18);
  teeth(p, 1.08, R * 0.82, -0.32, PI * 0.95, 9, 0.38, -1, { c: L.ivory }, [1, 0.95]);
  // the brow ridge: a heavy ledge over each eye, its hornlets
  for (const s of [-1, 1]) {
    t.box(0.95, 0.36, 0.7, { at: [s * 0.62, 0.28, R * 0.72], rot: [-0.15, s * 0.3, s * -0.25], c: L.trimD }, 0.15);
    taper(t, bez([[s * 0.8, 0.42, R * 0.6], [s * 1.0, 0.8, R * 0.45], [s * 0.95, 1.05, R * 0.15]], 4), 0.14, 0.03, { c: L.trim });
    t.box(0.12, 0.12, 1.6, { at: [s * 0.95, 0.35, -0.2], rot: [0.25, 0, 0], c: L.trimDD }, 0.05); // (a ridge back over the skull)
  }
  B.plumes.push({ at: [0, R * 0.55, -R * 0.95], dir: [0, 0.55, -1], len: 1.7, n: 5, w: 0.75, c: L.plume.ochre, kind: 'feather', count: 7, spread: 0.36, droop: 0.35,
    tint: [L.plume.rust, L.plume.ochre, L.plume.slate, L.plume.ivory, L.plume.slate, L.plume.ochre, L.plume.rust] });
}

function mammoth(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 1.15, L.ivory);
  p.geo(icoDome(R * 0.62, R * 0.62), { at: [0, R * 0.8, -0.35], sc: [1.05, 0.9, 1], c: L.ivory }); // (the high cranium's second dome, faceted)
  p.ring(R * 0.62, 0.06, { at: [0, R * 0.95, -0.35], c: L.grey }, 24);
  g.ring(R, 0.07, { at: [0, 0.03, 0] }, 32);
  shikoro(p, R, 4, 0.3, 0.1, [L.grey, L.ivory], L.cord);
  // the ears: great flaps for fukigaeshi
  for (const s of [-1, 1]) {
    const ear = []; for (let i = 0; i <= 12; i++) { const a = -PI * 0.55 + (i / 12) * PI * 1.3; ear.push([0.95 + Math.cos(a) * 0.95 * (1 + 0.06 * Math.sin(a * 5)), -0.45 + Math.sin(a) * 1.15]); }
    ear.push([0.05, -0.2], [0.05, 0.3]);
    flat(p, ear, s, { at: [s * R * 0.85, 0.05, R * 0.15], rot: [0, s * 0.55, s * -0.12], c: L.grey });
    g.rod([s * R * 0.85, 0.5, R * 0.15], [s * R * 0.85, -0.9, R * 0.15], 0.04, {}, 5);
  }
  t.box(R * 1.5, 0.26, 0.5, { at: [0, 0.12, R * 0.88], rot: [-0.2, 0, 0], c: L.trimD }, 0.1); // (the brow)
  // the tusks: off the brim's cheeks, curling forward and up (the face under them left empty)
  for (const s of [-1, 1]) {
    const tusk = bez([[s * 0.9, -0.15, R * 0.75], [s * 1.5, -0.9, R * 1.05], [s * 1.6, -0.6, R * 1.7], [s * 1.2, 0.2, R * 1.9]], 10);
    taper(t, tusk, 0.24, 0.05, { c: L.trim });
    g.cyl(0.3, 0.32, 0.22, { at: along(tusk, 0.04), rot: [0.6, 0, s * 0.7] }, 14);
  }
  B.plumes.push({ at: [0, R * 1.0, -R * 0.75], dir: [0, -0.1, -1], len: 3.0, n: 7, w: 0.7, c: L.plume.umber, kind: 'tuft', count: 7, spread: 0.32, droop: 1,
    tint: [L.plume.umber, L.plume.rust, L.plume.umber, L.plume.ochre, L.plume.umber, L.plume.rust, L.plume.umber] });
}

function sabretooth(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 0.85, L.bone, { sc: [1.05, 1, 1] });
  shikoro(p, R, 3, 0.3, 0.12, [L.bone, L.grey], L.cord);
  // the ears: tall, laid back a little, their insides dark
  for (const s of [-1, 1]) {
    flat(t, [[-0.6, 0], [0.6, 0], [0.15, 1.5], [-0.06, 1.55]], 1, { at: [s * 0.95, R * 0.58, -0.15], rot: [-0.35, s * 0.35, s * -0.4], c: L.trim }, 0.14);
    flat(c, [[-0.36, 0.12], [0.36, 0.12], [0.07, 1.15]], 1, { at: [s * 0.98, R * 0.6, -0.04], rot: [-0.35, s * 0.35, s * -0.4] }, 0.05);
  }
  // the brow, a cat's frown
  for (const s of [-1, 1]) t.box(1.0, 0.3, 0.6, { at: [s * 0.55, 0.05, R * 0.86], rot: [-0.2, s * 0.35, s * -0.32], c: L.trimD }, 0.12);
  // the fangs: two down from the brim over the empty face (the cat's mark kept, the face not)
  for (const s of [-1, 1]) taper(p, bez([[s * 0.42, -0.05, R * 0.9], [s * 0.46, -0.55, R * 0.98], [s * 0.4, -1.0, R * 0.9]], 5), 0.12, 0.02, { c: L.ivory });
  // the mane: plumes round the back and the cheeks
  const mane = [L.plume.ochre, L.plume.rust, L.plume.umber, L.plume.ochre, L.plume.rust];
  B.plumes.push({ at: [0, R * 0.7, -R * 0.75], dir: [0, 0.35, -1], len: 2.2, n: 6, w: 0.7, c: L.plume.ochre, kind: 'tuft', count: 5, spread: 0.42, droop: 0.7, tint: mane });
  for (const s of [-1, 1]) B.plumes.push({ at: [s * R * 0.85, R * 0.2, -R * 0.35], dir: [s * 1, 0.1, -0.7], len: 1.8, n: 5, w: 0.6, c: L.plume.rust, kind: 'tuft', count: 3, spread: 0.35, droop: 0.8, tint: [L.plume.rust, L.plume.ochre, L.plume.umber] });
}

function pterosaur(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 0.8, L.bone, { sc: [1, 1, 1.1] });
  shikoro(p, R, 3, 0.28, 0.1, [L.grey, L.bone], L.cord);
  // the crest: a blade swept far back from the brow, its leading edge gold
  t.geo(plate([[R * 0.6, R * 0.6], [-0.2, R * 0.95], [-2.7, 2.2], [-3.1, 2.1], [-2.2, 1.5], [-0.8, 0.5]], 0.18, 0.05).rotateY(-PI / 2), { c: L.trim });
  g.rod([0, R * 0.95 + 0.02, -0.2], [0, 2.25, -2.7], 0.05, {}, 5);
  // the wings: fukigaeshi as membranes swept back, their finger spars gold
  for (const s of [-1, 1]) {
    const wing = [[0, 0.25], [0.9, 0.5], [2.0, 0.85], [1.85, 0.5], [1.5, 0.0], [1.15, 0.18], [0.85, -0.3], [0.5, -0.12], [0.15, -0.38]];
    const o = { at: [s * R * 0.92, -0.05, R * 0.25], rot: [0, s * 0.85, s * 0.3] };
    flat(t, wing, s, { ...o, c: L.trimD }, 0.06);
    const M = new THREE.Matrix4().compose(new V(...o.at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rot, 'YXZ')), new V(1, 1, 1));
    const w = (x, y) => new V(s * x, y, 0.05).applyMatrix4(M).toArray();
    g.rod(w(0, 0.25), w(0.9, 0.5), 0.04, {}, 5); g.rod(w(0.9, 0.5), w(2.0, 0.85), 0.03, {}, 5); g.rod(w(0.9, 0.5), w(1.5, 0.0), 0.025, {}, 4); g.rod(w(0.9, 0.5), w(0.85, -0.3), 0.025, {}, 4);
  }
  B.plumes.push({ at: [0, 2.15, -3.0], dir: [0, -0.2, -1], len: 1.6, n: 6, w: 0.45, c: L.plume.slate, kind: 'feather', count: 2, spread: 0.3, droop: 0.9, tint: [L.plume.slate, L.plume.rust] });
}

function triceratops(B) {
  const { p, t, g, c } = B;
  bowl(p, R, R * 0.85, L.bone);
  g.ring(R, 0.06, { at: [0, 0.03, 0] }, 32);
  shikoro(p, R, 3, 0.3, 0.1, [L.grey, L.bone], L.cord);
  // the frill: a great fan behind the neck, scalloped, its edge knobbed in gold
  const fr = [], N = 40, A0 = -0.2, A1 = PI + 0.2;
  for (let i = 0; i <= N; i++) { const a = A0 + ((A1 - A0) * i) / N, k = 1 + 0.07 * Math.cos(a * 14); fr.push([Math.cos(a) * 2.1 * k, Math.sin(a) * 1.85 * k]); }
  fr.push([-1.4, -0.6], [1.4, -0.6]);
  const shape = new THREE.Shape(fr.map(([x, y]) => new THREE.Vector2(x, y)));
  const frill = { at: [0, 0.35, -R * 0.55], rot: [-0.55, 0, 0] };
  t.geo(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 10 }).translate(0, 0, -0.07), { ...frill, c: L.trim });
  const FM = new THREE.Matrix4().compose(new V(...frill.at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...frill.rot)), new V(1, 1, 1));
  for (let i = 0; i < 15; i++) { const a = A0 + 0.12 + ((A1 - A0 - 0.24) * i) / 14; g.cone(0.1, 0.26, { at: new V(Math.cos(a) * 2.28, Math.sin(a) * 2.02, 0).applyMatrix4(FM).toArray(), rot: [-0.55, 0, a - PI / 2] }, 6); }
  // the brow the horns stand on
  t.box(R * 1.45, 0.24, 0.45, { at: [0, 0.14, R * 0.9], rot: [-0.25, 0, 0], c: L.trimD }, 0.1);
  // the horns: two over the brow (the nose's horn went with the face)
  for (const s of [-1, 1]) taper(t, bez([[s * 0.5, 0.3, R * 0.85], [s * 0.65, 0.8, R * 1.25], [s * 0.58, 1.2, R * 1.8]], 8), 0.2, 0.03, { c: L.trim });
}

function kabuto(B) {
  const { p, t, g, lab } = B;
  bowl(p, R, R * 0.95, L.dark, { ribs: 24, ribC: L.grey });
  g.ring(0.24, 0.07, { at: [0, R * 0.95, 0] }, 16); g.ball(0.15, { at: [0, R * 0.97, 0] }, 12, 8); // (the tehen)
  g.box(R * 2.04, 0.12, 0.2, { at: [0, 0.02, R * 0.9], rot: [0.2, 0, 0] }, 0.04);
  p.box(R * 2.1, 0.06, 0.8, { at: [0, 0.06, R * 0.95], rot: [-0.32, 0, 0], c: L.dark }, 0.02); // (the peak)
  shikoro(p, R, 5, 0.27, 0.15, [L.dark, L.grey], L.cord);
  fukigaeshi(p, g, R, 1.35, L.dark);
  for (const s of [-1, 1]) t.box(0.45, 0.45, 0.06, { at: [s * (R * 0.9 + 0.55), 0.05, R * 0.38 - 0.45], rot: [0, s * 0.95, 0], c: L.trimD }, 0.05); // (the mon on each)
  // the crescent maedate: a thin moon tapering to its points, horns up
  const Rc = 1.7, cy = 0.55 + Rc;
  for (const s of [-1, 1]) { const arc = []; for (let i = 0; i <= 12; i++) { const a = -PI / 2 + s * (i / 12) * 1.25; arc.push([Math.cos(a) * Rc, cy + Math.sin(a) * Rc, R * 1.0 - (i / 12) * 0.35]); } taper(g, arc, 0.17, 0.025); }
  lab.box(0.3, 0.38, 0.1, { at: [0, 0.45, R * 1.02] }, 0.05); // (its mount: a plate of the stone)
  B.plumes.push({ at: [0, R * 0.6, -R * 0.82], dir: [0, 0.3, -1], len: 2.6, n: 7, w: 0.55, c: L.plume.ivory, kind: 'tuft', count: 5, spread: 0.35 });
}

function szyszak(B) {
  const { p, t, g } = B;
  bowl(p, R, R * 1.0, L.grey, { ribs: 16, ribC: L.bone });
  p.box(0.12, R * 0.25, R * 1.6, { at: [0, R * 0.98, 0], c: L.grey }, 0.04); // (the crest ridge)
  g.cone(0.09, 0.8, { at: [0, R * 1.28, 0.2] }, 8); g.ball(0.12, { at: [0, R * 1.0, 0.2] }, 10, 6); // (the spike)
  p.box(R * 2.0, 0.06, 0.9, { at: [0, 0.0, R * 0.98], rot: [-0.18, 0, 0], c: L.grey }, 0.02); // (the peak)
  g.box(R * 2.0, 0.06, 0.1, { at: [0, 0.03, R * 1.38] }, 0.02);
  g.box(0.14, 1.45, 0.09, { at: [0, -0.36, R * 1.1] }, 0.03); g.ball(0.15, { at: [0, 0.36, R * 1.1] }, 10, 6); g.cone(0.14, 0.3, { at: [0, -1.15, R * 1.1], rot: [PI, 0, 0] }, 4); // (the sliding nasal)
  for (const s of [-1, 1]) { p.box(0.1, 1.05, 0.85, { at: [s * R * 0.92, -0.55, R * 0.42], rot: [0, 0, s * 0.12], c: L.grey }, 0.04); g.ball(0.08, { at: [s * R * 0.98, -0.28, R * 0.6] }, 8, 6); }
  for (let i = 0; i < 5; i++) p.geo(new THREE.CylinderGeometry(R * (0.95 + i * 0.05), R * (1.0 + i * 0.06), 0.26, 8, 1, true, PI / 2 + 0.3, PI * 1.0 - 0.6), { at: [0, -0.08 - i * 0.22, -0.05 * i], rot: [0.12 * i, 0, 0], c: i % 2 ? L.grey : L.bone }); // (the lobster-tail)
  // the crest: an eagle's two wings either side of the plume holder
  for (const s of [-1, 1]) {
    const wing = []; for (let i = 0; i <= 7; i++) { const a = i / 7; wing.push([0.2 + a * 1.5, 0.1 + a * 2.0 + Math.sin(a * PI) * 0.3]); }
    for (let i = 7; i >= 0; i--) { const a = i / 7; wing.push([0.2 + a * 1.5 - 0.35 - (i % 2) * 0.12, a * 2.0 - 0.05]); }
    flat(t, wing, s, { at: [0, R * 0.95, -R * 0.55], rot: [-0.5, s * 0.25, s * -0.25], c: L.trim }, 0.08);
  }
  g.cyl(0.18, 0.12, 0.5, { at: [0, R * 0.95, -R * 0.55], rot: [-0.5, 0, 0] }, 10); // (the plume holder)
  B.plumes.push({ at: [0, R * 1.15, -R * 0.68], dir: [0, 1, -0.4], len: 3.0, n: 8, w: 0.85, c: L.plume.ivory, kind: 'ostrich', count: 7, spread: 0.36,
    tint: [L.plume.ivory, L.plume.rust, L.plume.ivory, L.plume.slate, L.plume.ivory, L.plume.ochre, L.plume.ivory] });
}

const BUILD = { stag, tyrant, mammoth, sabretooth, pterosaur, triceratops, kabuto, szyszak };
function build(id) {
  const B = { p: new Piece(), t: new Piece(), g: new Piece(), lab: new Piece(), c: new Piece(), e: new Piece(), plumes: [] };
  for (const P of [B.g, B.t, B.p]) { const rod = P.rod.bind(P); P.rod = (a, b, r, o, seg) => rod(a, b, r * HELM_LOOK.chunk * 1.2, o, 5); } // (every bar and spar chunky)
  BUILD[id](B);
  for (const pl of B.plumes) { pl.w *= 1.45; pl.count = Math.max(2, Math.round((pl.count || 1) * 0.6)); pl.spread = (pl.spread || 0) * 1.25; if (pl.tint) pl.tint = pl.tint.filter((_, i) => i % 2 === 0 || pl.tint.length <= 3); } // (broad and few: battle-ready, not dainty)
  B.c.geo(gem(R * 0.86), { at: [0, -0.1, -0.1], sc: [1, 0.7, 1] }); // (the void under every helm: no face, the dark inside the shell, FFXI's automatons)
  B.e.ball(0.16, { at: [0, -0.3, R * 0.35] }, 10, 8); // (a faint light deep in it, lit with the cradle: the only sign something is inside)
  return B;
}


// ------------------------------------------------------------------ the plume: bones sprung to their rest, one ribbon mesh
let CARD = null;
/** The feather card: a rachis, barbs swept up it, the edge ragged (alpha); `ostrich` rows of long drooping barbs. One canvas, two columns. */
function featherCard() {
  if (CARD || typeof document === 'undefined') return CARD;
  const W = 128, H = 512, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H;
  const x = cv.getContext('2d'); x.clearRect(0, 0, W * 2, H);
  for (const [col, fluffy] of [[0, false], [1, true]]) {
    const cx = col * W + W / 2; let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 6; y < H - 4; y += fluffy ? 2 : 1.5) {
      const v = y / H, half = (W / 2 - 4) * Math.sin(Math.min(1, v * 1.15) * PI * 0.9 + 0.12) * (fluffy ? 1 : 0.8);
      for (const d of [-1, 1]) { const len = half * (0.7 + rnd() * 0.3); x.strokeStyle = `rgba(255,255,255,${0.55 + rnd() * 0.45})`; x.lineWidth = fluffy ? 1.4 : 1;
        x.beginPath(); x.moveTo(cx, y); x.quadraticCurveTo(cx + d * len * 0.6, y - (fluffy ? -4 : 8), cx + d * len, y + (fluffy ? 14 : -10)); x.stroke(); }
    }
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, H); x.stroke();
  }
  CARD = new THREE.CanvasTexture(cv); CARD.colorSpace = THREE.SRGBColorSpace; return CARD;
}

class Plume {
  /** specs in head units (this.k metres a unit), rooted in `head` (an Object3D the helm sits in). */
  constructor(specs, head, k, scene) {
    this.head = head; this.k = k; this.feathers = [];
    const C = new THREE.Color();
    for (const S of specs) for (let f = 0; f < (S.count || 1); f++) {
      const n = S.n, seg = (S.len * k) / n, off = ((f - ((S.count || 1) - 1) / 2) * (S.spread || 0));
      const dir = new V(...S.dir).normalize(), side = new V(1, 0, 0);
      const rest = [], at = new V(S.at[0] + off * 0.6, S.at[1], S.at[2]).multiplyScalar(k);
      const d = dir.clone().applyAxisAngle(new V(0, 0, 1), -off * 0.9).applyAxisAngle(new V(1, 0, 0), Math.abs(off) * 0.25);
      for (let i = 0; i <= n; i++) { rest.push(at.clone()); const bend = (S.droop ?? 0.55) * (i / n) ** 1.5; at.addScaledVector(d.clone().lerp(new V(0, -0.4, -1).normalize(), bend).normalize(), seg); }
      C.set((S.tint || [])[f] ?? S.c);
      this.feathers.push({ n, seg, rest, w: (S.w * k) * (1 - Math.abs(off) * 0.2), col: C.clone(), fluffy: S.kind === 'ostrich' || S.kind === 'tuft', p: rest.map((v) => v.clone()), q: rest.map((v) => v.clone()), side });
    }
    const verts = this.feathers.reduce((a, F) => a + (F.n + 1) * 4, 0);
    const pos = new Float32Array(verts * 3), uv = new Float32Array(verts * 2), col = new Float32Array(verts * 3), idx = [];
    let v = 0;
    for (const F of this.feathers) {
      F.v0 = v; const u0 = F.fluffy ? 0.5 : 0;
      for (let i = 0; i <= F.n; i++) for (let s = 0; s < 4; s++) { uv[(v + i * 4 + s) * 2] = u0 + ((s & 1) ? 0.5 : 0); uv[(v + i * 4 + s) * 2 + 1] = i / F.n; F.col.toArray(col, (v + i * 4 + s) * 3); }
      for (let i = 0; i < F.n; i++) for (const strip of [0, 2]) { const a = v + i * 4 + strip, b = a + 1, c2 = a + 4, d2 = a + 5; idx.push(a, b, c2, b, d2, c2); }
      v += (F.n + 1) * 4;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: 'mech-plume', map: featherCard(), vertexColors: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9 }));
    this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.name = 'mech-plume';
    scene.add(this.mesh); this.primed = false;
  }
  update(dt) {
    if (!this.feathers.length) { this.mesh.visible = false; return; }
    const H = this.head; H.updateWorldMatrix(true, false);
    const M = H.matrixWorld, pos = this.mesh.geometry.attributes.position, A = pos.array;
    const dt2 = Math.min(dt, 1 / 30) ** 2, gy = -L.gravity * dt2, t = (this._t ||= new V()), dv = (this._d ||= new V());
    const right = (this._r ||= new V()).set(1, 0, 0).transformDirection(M), s1 = (this._s1 ||= new V()), s2 = (this._s2 ||= new V());
    this.mesh.visible = !!this.visible;
    for (const F of this.feathers) {
      if (!this.primed) { const sc = dv.setFromMatrixScale(M).x; F.segW = F.seg * sc; F.wW = F.w * sc; for (let i = 0; i <= F.n; i++) { F.p[i].copy(F.rest[i]).applyMatrix4(M); F.q[i].copy(F.p[i]); } }
      F.p[0].copy(F.rest[0]).applyMatrix4(M); F.q[0].copy(F.p[0]);
      for (let i = 1; i <= F.n; i++) {
        const P = F.p[i], Q = F.q[i]; dv.subVectors(P, Q).multiplyScalar(L.damping); Q.copy(P); P.add(dv); P.y += gy;
        const st = THREE.MathUtils.lerp(L.stiff[0], L.stiff[1], i / F.n);
        t.copy(F.rest[i]).sub(F.rest[i - 1]).transformDirection(M).multiplyScalar(F.segW).add(F.p[i - 1]); P.lerp(t, st); // (sprung toward its rest bend)
        dv.subVectors(P, F.p[i - 1]); const len = dv.length() || 1; P.copy(F.p[i - 1]).addScaledVector(dv, F.segW / len); // (each bone its length)
      }
      for (let i = 0; i <= F.n; i++) {
        const a = F.p[Math.max(0, i - 1)], b = F.p[Math.min(F.n, i + 1)]; dv.subVectors(b, a).normalize();
        const w = F.wW * 0.5 * (F.fluffy ? 1 : Math.sin(Math.min(1, i / F.n * 1.15) * PI * 0.92 + 0.15)) + F.wW * 0.04;
        s1.crossVectors(dv, right).normalize(); s2.crossVectors(dv, s1).normalize();
        const o = (F.v0 + i * 4) * 3, P = F.p[i];
        A[o] = P.x - s2.x * w; A[o + 1] = P.y - s2.y * w; A[o + 2] = P.z - s2.z * w; A[o + 3] = P.x + s2.x * w; A[o + 4] = P.y + s2.y * w; A[o + 5] = P.z + s2.z * w;
        A[o + 6] = P.x - s1.x * w * 0.7; A[o + 7] = P.y - s1.y * w * 0.7; A[o + 8] = P.z - s1.z * w * 0.7; A[o + 9] = P.x + s1.x * w * 0.7; A[o + 10] = P.y + s1.y * w * 0.7; A[o + 11] = P.z + s1.z * w * 0.7;
      }
    }
    this.primed = true; pos.needsUpdate = true; this.mesh.geometry.computeVertexNormals(); this.mesh.geometry.computeBoundingSphere();
  }
  dispose() { this.mesh.parent?.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// ------------------------------------------------------------------ wearing one
const _b = new THREE.Box3(), _m = new THREE.Matrix4(), _c = new THREE.Color();
/** A vertex-coloured program whose own colour is white: the vertices carry the hue (the parts body's way). */
const neutral = (m) => !!m?.vertexColors && (m.color ? m.color.r + m.color.g + m.color.b > 2.6 : true);
/** Each vertex colour multiplied by (or set to) a tone. */
function tone(geo, hex, mul) {
  const a = geo.attributes.color; if (!a) return; _c.set(hex);
  for (let i = 0; i < a.count; i++) mul ? a.setXYZ(i, a.getX(i) * _c.r, a.getY(i) * _c.g, a.getZ(i) * _c.b) : a.setXYZ(i, _c.r, _c.g, _c.b);
}

/** The helm `id` worn over `body`'s head (its shell set aside, kept for taking it off); null takes the worn one off. */
export function wearHelm(body, id, scene) {
  body.helm?.dispose(); body.helm = null;
  const head = body.joints?.head || body.joints?.neck; if (!head || !id || !HELMS[id]) return null;
  // fit: the head shell's box in the head's own frame (its meshes only, not a joint below it)
  head.updateWorldMatrix(true, true); _m.copy(head.matrixWorld).invert(); _b.makeEmpty();
  const shell = [];
  for (const o of head.children) if (o.isMesh) { shell.push(o); const g = o.geometry; g.computeBoundingBox(); _b.union(g.boundingBox.clone().applyMatrix4(o.matrix)); }
  if (_b.isEmpty()) _b.set(new V(-0.6, 0, -0.6), new V(0.6, 1.2, 0.6));
  const half = Math.max(_b.max.x - _b.min.x, _b.max.z - _b.min.z) / 2, tall = _b.max.y - _b.min.y;
  const k = Math.max(half, tall * 0.42) * HELM_LOOK.fit; // (metres a head unit: the bowl a head's size, a tall narrow head given its due)
  const root = new THREE.Group(); root.name = 'mech-helm';
  const y0 = _b.min.y + tall * HELM_LOOK.float; root.position.set((_b.min.x + _b.max.x) / 2, y0, (_b.min.z + _b.max.z) / 2); root.scale.set(k * HELM_LOOK.narrow, k, k); // (floating: a gap over the collar, the neck gone)
  const B = build(id), mats = body.mats || {}, own = [];
  const mk = (m) => { own.push(m); return m; };
  const P = mats.porcelain || mats.p || mk(new THREE.MeshPhysicalMaterial({ name: 'mech-helm-porcelain', vertexColors: true, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide }));
  const trim = mats.trim || null;
  const parts = [
    [B.p, P, null],
    [B.t, trim || P, trim ? (neutral(trim) ? [L.terracotta, true] : null) : [L.terracotta, true]],
    [B.g, mats.gold || mats.g || mk(new THREE.MeshStandardMaterial({ name: 'mech-helm-gold', color: L.gold, metalness: 0.85, roughness: 0.3 })), [L.gold, false]],
    [B.lab, mats.labradorite || mats.lab || mats.l || mk(new THREE.MeshStandardMaterial({ name: 'mech-helm-lab', color: 0x2a3441, metalness: 0.3, roughness: 0.25 })), [0x2a3441, false]],
    [B.c, mk(new THREE.MeshBasicMaterial({ name: 'mech-helm-void', color: L.core })), null], // (the void: its own unlit dark, never the core's skin, so nothing shows inside but the one light)
    [B.e, mats.glow || mats.e || mk(new THREE.MeshBasicMaterial({ name: 'mech-helm-glow', color: 0xd8ccff, toneMapped: false })), [0xffffff, false]],
  ];
  for (const [Pc, m, tn] of parts) {
    if (!Pc.pos.length) continue; const geo = Pc.done();
    if (tn && m.vertexColors) tone(geo, tn[0], tn[1]);
    const mesh = new THREE.Mesh(geo, m); mesh.castShadow = Pc !== B.e; mesh.receiveShadow = Pc !== B.e; mesh.name = `mech-helm.${id}`; root.add(mesh);
  }
  head.add(root);
  for (const o of shell) o.visible = false;
  const neck = body.joints?.neck, neckShell = neck && neck !== head ? neck.children.filter((o) => o.isMesh && o.visible) : [];
  for (const o of neckShell) o.visible = false; // (no neck: the helm floats, FFXI's automaton heads)
  let bobT = 0;
  const plume = new Plume(B.plumes, root, 1, scene || body.group.parent || body.group); // (its bones in the helm's frame: k is the root's scale)
  const handle = {
    id, root, plume,
    update(rawDt) {
      bobT += rawDt; root.position.y = y0 + Math.sin(bobT * HELM_LOOK.bob[1]) * HELM_LOOK.bob[0]; // (a slow bob, a puppet's head on no strings; head units of the head's own frame)
      plume.visible = root.visible && !!body.group.parent && body.group.visible !== false; let o = body.group; while (o && plume.visible) { if (o.visible === false) plume.visible = false; o = o.parent; }
      plume.update(rawDt);
    },
    dispose() {
      root.parent?.remove(root); root.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      for (const m of own) m.dispose(); plume.dispose(); for (const o of shell) o.visible = true; for (const o of neckShell) o.visible = true;
    },
  };
  body.helm = handle;
  return handle;
}

/** The hangar's mech wearing a helm (its plumes stepped in the marks); `/helm id` to try one. The choice is a look for now (not kept). */
export function installMechHelms(game) {
  let want = null;
  const mech = () => game.hangar?.pilot?.mech || null;
  game.mechHelm = (id) => { want = id && HELMS[id] ? id : null; const B = mech(); if (B) wearHelm(B, want, game.scene); return want; };
  game.systems?.add?.('marks', (dt, raw) => {
    const B = mech(); if (!B) return;
    if ((B.helm?.id ?? null) !== want || (B.helm && B.helm.root.parent == null)) wearHelm(B, want, game.scene);
    B.helm?.update(raw ?? dt);
  }, { clock: 'raw', name: 'mechHelms' });
  game.chat?.add?.('helm', { help: `a helm on the hangar's mech: /helm ${Object.keys(HELMS).join(' | ')} (none: the head's own)`, run: ([id]) => {
    const got = game.mechHelm(id || null); game.events?.emit('mech.helm', { helm: got, by: 'courier' }); } });
  return game.mechHelm;
}
