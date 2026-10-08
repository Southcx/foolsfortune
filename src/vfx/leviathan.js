// ---------------------------------------------------------------------------------------
// OLD NOBODY: the rogue Leviathan, as a space (the crossing's set piece; the owner, 2026-10-07; docs/plans/RAIL.md section 7 and
// RAIL-OVERHAUL.md section 6, "Old Nobody": "the boss is a place"; docs/GLOSSARY.md: an Egregore, a thought-form spawned from the
// Emocean, authored by no one and fed by everyone; Leviathan, the largest class; a boss part). Petra swims it and counts its parts;
// this is how it looks, how each part answers (vfx/bossparts.js: intact, damaged, broken; line and glow; a telegraph anchor), and
// where the rail may circle it.
//
//   THE HIDE      crude itself: near-black glass with the oil film walking along its length (world/treasure/cubes.js oilMaterial, the
//                 slick's own colours), so it looks like the sea standing up. Forty metres; it swims by a slow wave down its body
//   ITS BARNACLES Lachrymite gone to labradorite, the Mind's black iridescence (vfx/labradorite.js's palette): dark facets, each throwing
//                 one flash of violet, ultramarine, peacock, gold or copper as it turns; crusted on its head and chin as a humpback's
//                 are, and scattered down its back, so its size reads as ground does
//   NO FACE       a blunt, blank head, and on its brow one great eye, milky and blind, a scar across it (Nobody, and the Cyclops whom
//                 Nobody blinded: the name's own story). The EYE ('eye') is seen from above
//   THE GILLS     four slits a flank ('gill.left.0'..3, 'gill.right.0'..3), wrapping from the flank down under its chin as a basking
//                 shark's do, so they are a weak point seen from below (the Umbral): dark lips that part as it breathes over red flesh
//                 with a glow in it. Damaged, the flesh darkens and a lip hangs; broken, the slit is shut, a pale scar over it. As its
//                 gills shut it QUICKENS (Ikaruga's Uzura): its wave runs faster and deeper, its film creeps faster, what is left of
//                 its gills and its eye burn hotter
//   THE TEETH     six tusks of old ivory along the lip of its snout ('tooth.0'..5: 0..2 its left, front to back), rising past its brow
//                 and leaning out, so they are seen from above and ahead; damaged, chipped; broken, a stump. The jaw drops for the MAW, and deep in the throat ('throat') a
//                 light swells before it spits
//   THE FINS      two long pectorals that sweep (Petra's blow; the fin's raise is the bar's warning)
//   THE WAKE      where its back runs near the surface, a slick of disturbed crude lies over it and trails astern, its edges bright
//                 with the oil film and streaming aft: a wake the size of a place. The breach throws crude off its back in sheets
//   THE SHADOW    when it sounds: a dark shape on the sea that grows under you, its barnacles glinting through (draped on the swells)
//   THE VANTAGES  where a rail circling it sees each part best: 'above' (over the eye and the tusks), 'below' (under the gills),
//                 'flank' (abeam of the chest) and 'ahead' (before the maw)
//
// Prior art: Panzer Dragoon Saga (a boss is a space you move round to reach its weak points), Orta's manta (a beast with a back you
// fly over), Moby-Dick (the white whale's scarred brow; the beast you survive), the basking shark's gill slits (nearly round its head),
// Shadow of the Colossus (a body as the arena, its weak points glowing), Ikaruga's Uzura (it spins faster as its turrets fall), Jaws's
// and Ecco's shadows under the boat, Spirited Away's No-Face (a blank face as the most frightening thing), and the Odyssey.
//
//   const L = new LeviathanLook({ env, fx })   L.group (its own frame: +Z the head, Y up, origin on the spine amidships; 40 m long)
//   L.part(name) -> BossPart { object, state, hit(power), damage(), break(), set(state), seal(on), windup(k), world(out), telegraphAnchor }
//     names: 'gill.left.0'..'gill.left.3' (side 1, its left: +X), 'gill.right.0'..'gill.right.3' (side -1), 'tooth.0'..'tooth.5',
//     'eye', 'throat'
//   L.parts   L.reset()   L.quicken (0..1: the gills shut, or `set({ quicken })` to hold it)   L.vantage(name, out)
//   (the crossing's runtime as it stands: world/emocean/leviathan.js)
//   L.set({ swim 0..1, bend rad, t, quicken })   L.gill(i 0..3, { side 1|-1, open 0..1, gone })   L.breathe(k)   L.maw(k)   L.tooth(i, gone)
//   L.throat(k)   L.fin(side, k -1..1)   L.shadow(pos, yaw, k 0..1, sea)   L.wake(k 0..1)   L.update(rawDt, sea)
//   L.gillWorld(i, side, out) (the slit's upper end, at the flank)   L.toothWorld(i, out)   L.throatWorld(out)   L.eyeWorld(out)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { oilMaterial } from '../world/treasure/cubes.js';
import { BossPart, BossParts } from './bossparts.js';
import { haloTexture } from './lighthouselamp.js';

export const LEVIATHAN = { length: 40, girth: 3.6 };
const NR = 40, NA = 18; // (rings down its length, points round each)
const IVORY = 0xd8ccb0, FLESH = 0xc8382c, SCAR = 0x8a8078;
const LAB = [0x6638d1, 0x384cf2, 0x2480fa, 0x1ab3db, 0x38c78c, 0xebc252, 0xe07542]; // (labradorite's flash: violet .. copper, vfx/labradorite.js)
const GILL = { u0: 0.15, du: 0.035, th0: 0.28, th1: -1.38, n: 10 };

/** Its radius at u (0 the snout .. 1 the tail): a blunt head, a great chest, a long taper to the flukes. */
const radius = (u) => LEVIATHAN.girth * (u < 0.1 ? 0.55 + 0.45 * Math.sin((u / 0.1) * Math.PI / 2) : 1 - 0.88 * THREE.MathUtils.smootherstep(u, 0.22, 0.95)); // (a whale's: the tail stock slim)
/** A point on its cross-section at angle th (0 its left flank, PI/2 its back), in the ring's frame (x along b, y along n). */
const section = (th, R) => [Math.cos(th) * R, Math.sin(th) * R * (Math.sin(th) < 0 ? 0.62 : 0.85)];

let _slick = null;
/** The wake's crude: across it (u) a dark glossy middle and edges bright with the oil film, along it (v) streaks of the film's colours,
 *  repeating so they can stream aft. Drawn by the game's own basic map program (no program of its own: casebook 89). */
function slickTexture() {
  if (_slick) return _slick;
  const W = 64, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), img = g.createImageData(W, H);
  const film = [[77, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = Math.abs(x / (W - 1) - 0.5) * 2, v = y / H, edge = Math.max(0, 1 - Math.abs(u - 0.78) / 0.16), streak = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 3 + Math.sin(u * 7) * 1.2);
    const f = film[Math.floor(v * 4) % 4], k = edge * (0.35 + 0.65 * streak), i = (y * W + x) * 4, body = u < 0.95 ? 0.5 : 0.5 * (1 - (u - 0.95) / 0.05);
    img.data[i] = f[0] * k; img.data[i + 1] = f[1] * k; img.data[i + 2] = f[2] * k; img.data[i + 3] = Math.round(255 * Math.min(1, body + 0.45 * k));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; // (no crawl along a wake seen edge on)
  return (_slick = t);
}
const WAKE_N = 30; // (its points along the slick)

export class LeviathanLook {
  constructor({ env = null, fx = null } = {}) {
    this.fx = fx; this.t = 0; this.ph = 0; this.p = { swim: 0.6, bend: 0, quicken: null }; this.quicken = 0;
    this.group = new THREE.Group(); this.group.name = 'leviathan';
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    this.parts = new BossParts(); const look = (p, what) => this.look(p, what);
    // the hide: a tube of rings, bent each frame by its swim
    const n = (NR + 1) * NA, idx = [];
    for (let r = 0; r < NR; r++) for (let a = 0; a < NA; a++) { const i = r * NA + a, j = r * NA + ((a + 1) % NA); idx.push(i, i + NA, j, j, i + NA, j + NA); }
    const tip = n, tail = n + 1; // (the snout's and the tail's caps)
    for (let a = 0; a < NA; a++) { idx.push(tip, a, (a + 1) % NA); idx.push(tail, NR * NA + ((a + 1) % NA), NR * NA + a); }
    const S = new Float32Array(n + 2); for (let r = 0; r <= NR; r++) S.fill((r / NR) * 0.7, r * NA, r * NA + NA);
    this.hideG = track(new THREE.BufferGeometry());
    this.hideG.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 2) * 3), 3).setUsage(THREE.DynamicDrawUsage)); this.hideG.setAttribute('aSeed', new THREE.BufferAttribute(S, 1)); this.hideG.setIndex(idx);
    this.oil = oilMaterial({ env, envIntensity: 0.1, uni: { uOil: { value: 0.22 }, uOilPow: { value: 3.4 }, uHue: { value: 0 } } }); track(this.oil.mat);
    this.hide = new THREE.Mesh(this.hideG, this.oil.mat); this.hide.frustumCulled = false; this.hide.castShadow = true; this.group.add(this.hide);
    this.frames = Array.from({ length: NR + 1 }, () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3() }));
    const seeded = (g, v) => { g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(v), 1)); return g; };
    // the flukes: a wide flat fin at the tail; the pectoral fins (a humpback's: long, broad, the tip rounded)
    const flukeShape = new THREE.Shape(); flukeShape.moveTo(0, 0.6); flukeShape.quadraticCurveTo(4, 1.6, 6.5, -1.6); flukeShape.quadraticCurveTo(3.5, -0.4, 0, -1.4); flukeShape.quadraticCurveTo(-3.5, -0.4, -6.5, -1.6); flukeShape.quadraticCurveTo(-4, 1.6, 0, 0.6);
    const flukeG = seeded(track(new THREE.ShapeGeometry(flukeShape, 6)).rotateX(Math.PI / 2), 0.7);
    this.flukes = new THREE.Mesh(flukeG, this.oil.mat); this.group.add(this.flukes);
    const finShape = new THREE.Shape(); finShape.moveTo(0, -1.0); finShape.quadraticCurveTo(4, -1.6, 9, -3.2); finShape.quadraticCurveTo(9.6, -2.2, 8.6, -1.6); finShape.quadraticCurveTo(4.5, 0.9, 0, 1.1); finShape.lineTo(0, -1.0);
    const finG = seeded(track(new THREE.ShapeGeometry(finShape, 6)).rotateX(Math.PI / 2), 0.35);
    this.fins = [1, -1].map((side) => { const pivot = new THREE.Group(), m = new THREE.Mesh(finG, this.oil.mat); m.scale.x = side; pivot.add(m); this.group.add(pivot); return { side, pivot, k: 0, to: 0 }; });
    this.oil.mat.side = THREE.DoubleSide; for (const o of [this.flukes, ...this.fins.map((f) => f.pivot.children[0])]) o.castShadow = true;
    // the barnacles: Lachrymite gone to labradorite, a facet's flash each (one instanced draw)
    const NB = 150;
    this.barn = new THREE.InstancedMesh(track(new THREE.OctahedronGeometry(0.22, 0)), track(new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.85, flatShading: true, emissive: 0x120e16 })), NB);
    this.barnAt = []; const rnd = mulberry(7);
    for (let i = 0; i < NB; i++) { // (crusted thickest on its head and chin, the crown kept clear for the eye; a scatter down its back)
      const head = i < NB * 0.55, side = rnd() < 0.5 ? -1 : 1, u = head ? 0.02 + rnd() * 0.11 : 0.28 + rnd() * 0.45;
      const ang = head ? Math.PI / 2 + side * (0.45 + rnd() * 1.3) : Math.PI / 2 + (rnd() - 0.5) * 1.5;
      this.barnAt.push({ u, ang, s: (0.5 + rnd() * 1.1) * (rnd() < 0.15 ? 1.6 : 1), spin: rnd() * 6 });
      this.barn.setColorAt(i, _c.setHex(LAB[Math.floor(rnd() * LAB.length)]).multiplyScalar(0.55));
    }
    this.barn.frustumCulled = false; this.group.add(this.barn);
    // the head's furniture rides the first rings' frame: the eye, the jaw, the tusks, the throat
    this.head = new THREE.Group(); this.group.add(this.head);
    const G0 = LEVIATHAN.girth;
    this.eyeMat = track(new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.35, emissive: 0x8a96a0, emissiveIntensity: 0.45 }));
    this.eyeRoot = new THREE.Group(); this.eyeRoot.position.set(0, G0 * 0.66, G0 * 0.17); this.eyeRoot.rotation.x = -1.15; this.head.add(this.eyeRoot); // (on the crown of its blunt head, looking up and ahead)
    this.eye = new THREE.Mesh(track(new THREE.SphereGeometry(0.75, 14, 10)), this.eyeMat); this.eye.scale.set(1.35, 0.95, 0.42); this.eyeRoot.add(this.eye);
    this.scar = new THREE.Mesh(track(new THREE.BoxGeometry(0.11, 1.5, 0.1)), track(new THREE.MeshStandardMaterial({ color: 0x3e3533, roughness: 0.9 })));
    this.scar.position.set(0, 0, 0.33); this.scar.rotation.z = 0.7; this.eyeRoot.add(this.scar);
    this.socket = new THREE.Mesh(track(new THREE.CircleGeometry(0.85, 14)), track(new THREE.MeshBasicMaterial({ color: 0x050306 }))); this.socket.scale.set(1.3, 0.95, 1); this.socket.position.z = 0.05; this.socket.visible = false; this.eyeRoot.add(this.socket);
    this.tear = new THREE.Mesh(track(new THREE.BoxGeometry(0.16, 1.4, 0.06)), this.socket.material); this.tear.position.set(0.55, -0.9, 0.12); this.tear.rotation.z = 0.2; this.tear.visible = false; this.eyeRoot.add(this.tear);
    const eyePart = this.parts.add(new BossPart({ name: 'eye', object: this.eyeRoot, radius: 1.4, at: new THREE.Vector3(0, 0, 0.4), facing: new THREE.Vector3(0, 0, 1), look }));
    eyePart.wire(track(new THREE.CircleGeometry(1.08, 20)).scale(1.3, 0.95, 1).translate(0, 0, 0.08), { threshold: 10 });
    // the lower jaw: a hinged shell under the snout, dark flesh inside, the tusks on its rim
    this.jaw = new THREE.Group(); this.jaw.position.set(0, -G0 * 0.25, -G0 * 1.15); this.head.add(this.jaw);
    const jawG = seeded(track(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), 0.05); jawG.scale(G0 * 0.85, G0 * 0.45, G0 * 1.0); jawG.translate(0, 0, G0 * 1.0);
    this.jaw.add(new THREE.Mesh(jawG, this.oil.mat));
    const mouth = track(new THREE.MeshStandardMaterial({ color: 0x2a0b10, roughness: 0.6, side: THREE.DoubleSide }));
    const tongue = new THREE.Mesh(track(new THREE.CircleGeometry(1, 20)), mouth); tongue.rotation.x = -Math.PI / 2; tongue.scale.set(G0 * 0.8, G0 * 0.95, 1); tongue.position.set(0, 0.02, G0 * 1.0); this.jaw.add(tongue);
    const palate = new THREE.Mesh(track(new THREE.CircleGeometry(1, 20)), mouth); palate.rotation.x = Math.PI / 2; palate.scale.set(G0 * 0.78, G0 * 0.9, 1); palate.position.set(0, -G0 * 0.25, -G0 * 0.25); this.head.add(palate);
    this.throatMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    this.throatM = new THREE.Mesh(track(new THREE.CircleGeometry(G0 * 0.26, 18)), this.throatMat); this.throatM.position.set(0, -G0 * 0.3, -G0 * 0.55); this.head.add(this.throatM);
    this.parts.add(new BossPart({ name: 'throat', object: this.throatM, radius: 1.2, facing: new THREE.Vector3(0, 0, 1), look }));
    this.ivory = track(new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.5, flatShading: true }));
    this.teeth = []; const toothG = track(new THREE.ConeGeometry(0.42, 3.8, 5)).translate(0, 1.9, 0);
    for (let i = 0; i < 6; i++) { // (three a side along the lip of its snout, rising past its brow and leaning out: seen from above, beside the eye)
      const sd = i < 3 ? 1 : -1, j = i % 3, z = [1.25, 0.25, -0.75][j], u = THREE.MathUtils.clamp((2.3 - z) / NR, 0, 1), R = radius(u);
      const root = new THREE.Group(); root.position.set(sd * (R + 0.02), -0.35, z); root.rotation.set(0.42 - j * 0.12, 0, -sd * (0.5 + j * 0.08)); this.head.add(root);
      const m = new THREE.Mesh(toothG, this.ivory), base = [1.1, 1, 0.85][j]; m.scale.setScalar(base); root.add(m);
      const part = this.parts.add(new BossPart({ name: `tooth.${i}`, object: root, radius: 0.9, at: new THREE.Vector3(0, 2.4 * base, 0), facing: new THREE.Vector3(sd, 1, 0), look }));
      part.wire(m, { threshold: 40 }); part.index = i;
      this.teeth.push({ root, m, part, base, gone: false });
    }
    // the gills: four slits a flank, from the flank down under the chin; lips over red flesh, and the scar of a shut one
    this.gills = { 1: [], [-1]: [] };
    const scarM = track(new THREE.MeshBasicMaterial({ color: SCAR }));
    for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
      const u = GILL.u0 + i * GILL.du, R = radius(u), root = new THREE.Group(); this.group.add(root);
      const fleshM = track(new THREE.MeshBasicMaterial({ color: FLESH })), flesh = new THREE.Mesh(this.slit(side, R, 0.34, 1.006, 0), fleshM); root.add(flesh);
      const lips = [-1, 1].map((s) => { const l = new THREE.Mesh(this.slit(side, R, 0.16, 1.02, 0.07), this.oil.mat); l.position.z = s * 0.17; root.add(l); return l; });
      const scar = new THREE.Mesh(this.slit(side, R, 0.09, 1.03, 0), scarM); scar.visible = false; root.add(scar);
      const upper = new THREE.Object3D(); const [ux, uy] = section(GILL.th0 - 0.12, R); upper.position.set(side * ux, uy, 0); root.add(upper);
      const [mx, my] = section((GILL.th0 + GILL.th1) * 0.5, R), part = this.parts.add(new BossPart({ name: `gill.${side > 0 ? 'left' : 'right'}.${i}`, object: root, radius: 1.5, at: new THREE.Vector3(side * mx * 1.04, my * 1.04, 0), facing: new THREE.Vector3(side * Math.cos(0.6), -Math.sin(0.6), 0), look }));
      part.wire(flesh.geometry, { threshold: 25, parent: flesh }); part.side = side; part.index = i;
      this.gills[side].push({ root, flesh, fleshM, lips, scar, upper, part, u, open: 0, k: 0, gone: false, hurt: 0 });
    }
    // the vantages a rail may circle it by (in its own frame, on its head's ring)
    this.vantages = { above: new THREE.Object3D(), below: new THREE.Object3D(), flank: new THREE.Object3D(), ahead: new THREE.Object3D() };
    this.vantages.above.position.set(0, 16, 0); this.vantages.below.position.set(0, -14, -4); this.vantages.flank.position.set(-24, 0, -6); this.vantages.ahead.position.set(0, 2, 28);
    for (const s of Object.values(this.vantages)) this.head.add(s);
    // the shadow on the sea when it sounds, and its wake: one program, two marks draped on the swells
    this.shadowMat = track(new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0x050308, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.shadowM = new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2, 12, 24).rotateX(-Math.PI / 2)), this.shadowMat);
    this.slick = slickTexture().clone(); this.slick.needsUpdate = true; // (its own offset, so it streams with this beast)
    this.wakeMat = track(new THREE.MeshBasicMaterial({ map: this.slick, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    const wg = track(new THREE.BufferGeometry()), wp = new Float32Array(WAKE_N * 2 * 3), wuv = new Float32Array(WAKE_N * 4), wi = [];
    for (let i = 0; i < WAKE_N; i++) { wuv.set([0, i / (WAKE_N - 1) * 3, 1, i / (WAKE_N - 1) * 3], i * 4); if (i < WAKE_N - 1) { const a = i * 2; wi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    wg.setAttribute('position', new THREE.BufferAttribute(wp, 3).setUsage(THREE.DynamicDrawUsage)); wg.setAttribute('uv', new THREE.BufferAttribute(wuv, 2)); wg.setIndex(wi);
    this.wakeM = new THREE.Mesh(wg, this.wakeMat);
    for (const M of [this.shadowM, this.wakeM]) { M.frustumCulled = false; M.renderOrder = 2; M.matrixAutoUpdate = false; M.visible = false; this.group.add(M); } // (in its group, so they hide with it and are warmed with it; drawn in the world's frame: `unframe`)
    this.k = { maw: 0, mawTo: 0, throat: 0, throatTo: 0, wake: 0.8 }; this.prev = null; this.sprayAcc = 0;
    this.reset();
    this.update(0);
  }

  /** A gill slit's strip along its arc on the section at radius R: `w` wide along the body, stood off by `out`, raised `crest` at its middle. */
  slit(side, R, w, out, crest) {
    const N = GILL.n, pos = [], idx = [], seed = [];
    for (let j = 0; j <= N; j++) {
      const th = GILL.th0 + (GILL.th1 - GILL.th0) * (j / N), [x, y] = section(th, R), nx = Math.cos(th), ny = Math.sin(th);
      for (const [k, z] of [[0, -w / 2], [crest, 0], [0, w / 2]]) { pos.push(side * (x * out + nx * k), y * out + ny * k, z); seed.push(0.2); }
      if (j < N) { const a = j * 3, q = [a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5]; for (let k = 0; k < q.length; k += 3) side < 0 ? idx.push(q[k], q[k + 1], q[k + 2]) : idx.push(q[k], q[k + 2], q[k + 1]); } // (the rows run down the arc: on its left flank (+X) the winding is turned so the faces look out, as the mirrored right's already do)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1)); g.setIndex(idx); g.computeVertexNormals();
    this.geos.push(g); return g;
  }

  /** A part's look as its state, its windup or a hit say (vfx/bossparts.js calls this). */
  look(p, what) {
    const n = p.name;
    if (n.startsWith('gill.')) {
      const g = this.gills[p.side][p.index];
      if (what === 'state') { g.gone = p.state === 'broken'; g.hurt = p.state === 'damaged' ? 1 : 0; g.scar.visible = g.gone; if (g.gone) g.open = 0; }
      if (what === 'windup') g.open = Math.max(g.open, p.windupK);
    } else if (n.startsWith('tooth.')) {
      const T = this.teeth[p.index];
      if (what === 'state') { T.gone = p.state === 'broken'; T.m.scale.y = T.base * (p.state === 'intact' ? 1 : p.state === 'damaged' ? 0.66 : 0.22); T.m.rotation.z = p.state === 'damaged' ? 0.12 : 0; } // (chipped, then a stump)
    } else if (n === 'eye') {
      if (what === 'state') { const b = p.state === 'broken'; this.eye.visible = !b; this.scar.visible = !b; this.socket.visible = b; this.tear.visible = p.state !== 'intact'; }
    }
  }

  part(name) { return this.parts.part(name); }
  reset() { this.parts.reset(); for (const s of [1, -1]) for (const g of this.gills[s]) { g.open = 0; g.k = 0; } }

  set({ swim = this.p.swim, bend = this.p.bend, t, quicken } = {}) { this.p.swim = swim; this.p.bend = bend; if (t != null) this.t = t; if (quicken !== undefined) this.p.quicken = quicken; }
  gill(i, { side = 1, open = 0, gone } = {}) {
    const g = this.gills[side]?.[i]; if (!g) return;
    if (gone === true) g.part.break(); else if (gone === false) g.part.set('intact');
    g.open = g.gone ? 0 : open;
  }
  breathe(k) { for (const s of [1, -1]) for (const g of this.gills[s]) if (!g.gone) g.open = k; }
  maw(k) { this.k.mawTo = THREE.MathUtils.clamp(k, 0, 1); }
  tooth(i, gone = true) { const t = this.teeth[i]; if (t) t.part.set(gone ? 'broken' : 'intact'); }
  throat(k) { this.k.throatTo = THREE.MathUtils.clamp(k, 0, 1); }
  fin(side, k) { const f = this.fins.find((x) => x.side === side); if (f) f.to = THREE.MathUtils.clamp(k, -1, 1); }
  /** How strong its wake is (0 .. 1): the slick over its back where it runs near the surface. */
  wake(k) { this.k.wake = THREE.MathUtils.clamp(k, 0, 1); }
  /** The shape on the sea when it sounds: where (its head's way, `yaw`), how near the surface (k), on the swells of `sea`. */
  shadow(pos, yaw, k, sea = null) {
    const M = this.shadowM; this.shadowMat.opacity = k * 0.85; M.visible = k > 0.01;
    if (!M.visible) return;
    const L = LEVIATHAN.length * (0.6 + 0.4 * k), W = LEVIATHAN.girth * 2.8 * (0.6 + 0.4 * k), c = Math.cos(yaw), s = Math.sin(yaw);
    M.position.set(0, 0, 0); M.rotation.set(0, 0, 0); M.scale.set(1, 1, 1);
    const P = M.geometry.attributes.position, B = (this._sb ||= Float32Array.from(P.array));
    for (let i = 0; i < P.count; i++) { const lx = B[i * 3] * W / 2, lz = -B[i * 3 + 2] * L / 2, x = pos.x + lx * c + lz * s, z = pos.z - lx * s + lz * c; P.setXYZ(i, x, (sea?.heightAt?.(x, z) ?? pos.y) + 0.08, z); }
    P.needsUpdate = true;
  }
  /** A sea mark is parked in the group for the warm-up; once the group is in a scene it lies in the scene's own frame. */
  /** A sea mark lies in the world's frame though it rides in the group (so it hides with it): its matrix undoes the group's. */
  unframe(M) { this.group.updateWorldMatrix(true, false); M.matrix.copy(this.group.matrixWorld).invert(); M.matrixWorldNeedsUpdate = true; }
  vantage(name, out = new THREE.Vector3()) { return this.vantages[name]?.getWorldPosition(out) ?? out.set(0, 0, 0); }

  gillWorld(i, side = 1, out = new THREE.Vector3()) { return this.gills[side][i].upper.getWorldPosition(out); }
  toothWorld(i, out = new THREE.Vector3()) { return this.teeth[i].part.world(out); }
  throatWorld(out = new THREE.Vector3()) { return this.throatM.getWorldPosition(out); }
  eyeWorld(out = new THREE.Vector3()) { return this.eye.getWorldPosition(out); }

  update(raw = 1 / 60, sea = null) {
    this.t += raw; const t = this.t, Lh = LEVIATHAN.length, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    this.slick.offset.y = -t * 0.35; this.parts.update(raw); // (the film's streaks stream aft)
    // it quickens as its gills shut (or as it is told)
    const shut = [...this.gills[1], ...this.gills[-1]].filter((g) => g.gone).length / 8, q = (this.quicken = ease(this.quicken, this.p.quicken ?? shut, 2));
    this.ph += raw * 1.4 * (1 + 1.3 * q);
    // the spine: a slow wave down the body, growing toward the tail, and a bend to turn
    const F = this.frames, sw = this.p.swim * (1 + 0.45 * q), bend = this.p.bend, ph = this.ph;
    for (let r = 0; r <= NR; r++) { const u = r / NR, z = Lh * (0.5 - u); F[r].p.set(Math.sin(u * u * 2.2) * bend * Lh * 0.25, sw * (0.15 + 1.6 * u * u) * Math.sin(u * 5.5 - ph), z); }
    for (let r = 0; r <= NR; r++) {
      const a = F[Math.max(0, r - 1)].p, b = F[Math.min(NR, r + 1)].p, f = F[r];
      f.t.subVectors(a, b).normalize(); f.b.crossVectors(_up, f.t).normalize(); f.n.crossVectors(f.t, f.b).normalize(); // (t toward the head; b to its left, +X; n up)
    }
    const P = this.hideG.attributes.position;
    for (let r = 0; r <= NR; r++) {
      const u = r / NR, f = F[r], R = radius(u);
      const chin = THREE.MathUtils.smoothstep(u, 0.08, 0.14); // (the head's underside is its palate, flat: the jaw hangs below it)
      for (let a = 0; a < NA; a++) { const th = (a / NA) * Math.PI * 2, cx = Math.cos(th) * R; let cy = Math.sin(th) * R * (Math.sin(th) < 0 ? 0.62 : 0.85) + R * 0.22 * Math.exp(-(((th - Math.PI / 2) / 0.3) ** 2)) * THREE.MathUtils.smoothstep(u, 0.25, 0.4) * (1 - THREE.MathUtils.smoothstep(u, 0.75, 0.95)); if (cy < 0) cy = THREE.MathUtils.lerp(Math.max(cy, -LEVIATHAN.girth * 0.25), cy, chin); P.setXYZ(r * NA + a, f.p.x + f.b.x * cx + f.n.x * cy, f.p.y + f.b.y * cx + f.n.y * cy, f.p.z + f.b.z * cx + f.n.z * cy); }
    }
    const tipF = F[0], tailF = F[NR]; P.setXYZ(NR * NA + NA, tipF.p.x + tipF.t.x * 0.35, tipF.p.y + tipF.t.y * 0.35 - 0.3, tipF.p.z + tipF.t.z * 0.35); P.setXYZ(NR * NA + NA + 1, tailF.p.x, tailF.p.y, tailF.p.z); // (a blunt, flat face; the tail's tip)
    P.needsUpdate = true; this.hideG.computeVertexNormals();
    const place = (o, f) => { o.position.copy(f.p); _m.makeBasis(f.b, f.n, f.t); o.quaternion.setFromRotationMatrix(_m); };
    // the head's furniture on ring 2, the flukes past the tail, the fins at the chest
    place(this.head, F[2]); this.head.position.addScaledVector(F[2].t, -0.3);
    place(this.flukes, tailF); this.flukes.position.addScaledVector(tailF.t, -0.6); this.flukes.rotateX(Math.sin(5.5 - ph) * 0.3 * sw);
    for (const fn of this.fins) {
      const f = F[Math.round(NR * 0.27)], R = radius(0.27); place(fn.pivot, f); fn.pivot.position.addScaledVector(f.b, fn.side * R * 0.95).addScaledVector(f.n, -R * 0.35);
      fn.k = ease(fn.k, fn.to, 4); fn.pivot.rotateZ(fn.side * (-0.4 + 1.0 * fn.k + 0.08 * Math.sin(t * 1.1))); fn.pivot.rotateY(fn.side * -0.5 * Math.abs(fn.k)); // (at rest they hang; raised, the sweep is coming)
    }
    // the barnacles, ridden on the hide
    for (const [i, b] of this.barnAt.entries()) {
      const f = F[Math.floor(b.u * NR)], [cx, cy] = section(b.ang, radius(b.u) * 0.97);
      _v.copy(f.p).addScaledVector(f.b, cx).addScaledVector(f.n, cy); _q.setFromEuler(_e.set(b.spin, b.spin * 1.3 + t * 0.02, 0)); _s.setScalar(b.s);
      this.barn.setMatrixAt(i, _m.compose(_v, _q, _s));
    }
    this.barn.instanceMatrix.needsUpdate = true;
    // the gills: the lips part, the flesh glows with the breath, hotter as it quickens; damaged, darker and a lip hangs; shut, a scar
    for (const side of [1, -1]) for (const g of this.gills[side]) {
      place(g.root, F[Math.round(g.u * NR)]);
      g.k = ease(g.k, g.gone ? 0 : g.open, 5);
      g.lips[0].position.z = -0.12 - g.k * 0.32 - g.hurt * 0.1; g.lips[1].position.z = 0.12 + g.k * 0.32; g.lips[0].rotation.x = g.hurt * 0.12;
      g.flesh.scale.z = g.gone ? 0.15 : 0.3 + 1.6 * g.k; g.flesh.visible = !g.gone;
      const glow = (0.35 + 0.85 * g.k * (0.8 + 0.2 * Math.sin(t * (4 + 4 * q) + g.u * 50))) * (1 + 0.6 * q);
      g.fleshM.color.setHex(FLESH).multiplyScalar(g.hurt ? glow * 0.45 : glow);
    }
    // the eye: milky and blind, burning hotter as it quickens and as its windup comes
    const ep = this.parts.part('eye'), ew = ep.windupK;
    this.eyeMat.emissiveIntensity = (ep.state === 'damaged' ? 0.25 : 0.45) * (1 + 0.8 * q) + 1.4 * ew + 0.8 * Math.min(1, ep.pulse);
    this.eyeMat.emissive.setHex(0x8a96a0).lerp(_c.setHex(0xffd27a), Math.max(ew, q * 0.4));
    // the maw, and the light in its throat
    this.k.maw = ease(this.k.maw, this.k.mawTo, 3); this.jaw.rotation.x = this.k.maw * 0.75;
    const tp = this.parts.part('throat'); this.k.throat = ease(this.k.throat, tp.alive ? Math.max(this.k.throatTo, tp.windupK) : 0, 5); const th = this.k.throat * (0.85 + 0.15 * Math.sin(t * 12));
    this.throatMat.color.setRGB(1, 0.3, 0.12).multiplyScalar(0.06 + 0.8 * th); this.throatM.scale.setScalar(0.7 + 0.6 * this.k.throat);
    this.oil.uni.uHue.value += raw * 0.01 * (1 + 2 * q); // (the film creeps along it, faster as it quickens)
    this.group.updateMatrixWorld(true); this.unframe(this.shadowM); this.unframe(this.wakeM);
    this.wakeAt(sea);
    // the breach: where its body crosses the surface fast, the crude sheets and sprays off it
    const fx = this.fx; if (!fx || !sea || raw <= 0) return;
    const now = (this._now ||= F.map(() => new THREE.Vector3())), was = this.prev;
    for (let r = 0; r <= NR; r += 2) now[r].copy(F[r].p).applyMatrix4(this.group.matrixWorld);
    if (was) for (let r = 0; r <= NR; r += 2) {
      const p = now[r], h = sea.heightAt?.(p.x, p.z) ?? 0, vy = (p.y - was[r].y) / raw, R = radius(r / NR);
      if (Math.abs(p.y - h) > R * 0.9 || Math.abs(vy) < 2) continue; // (only where its back is breaking the surface, and fast)
      this.sprayAcc += raw * Math.abs(vy) * 2;
      while (this.sprayAcc >= 1) {
        this.sprayAcc -= 1; const a = Math.random() * Math.PI * 2, at = _v.set(p.x + Math.cos(a) * R, h + 0.2, p.z + Math.sin(a) * R);
        fx.alpha.emit({ pos: at.clone(), vel: _d.set(Math.cos(a) * 3, Math.abs(vy) * (0.5 + Math.random() * 0.6), Math.sin(a) * 3).clone(), life: 1.4, size: 0.35, sizeEnd: 0.1, color: new THREE.Color(0x120e16), alpha: 0.9, drag: 0.6, gravity: 9.8 });
        if (Math.random() < 0.35) fx.alpha.emit({ pos: at.clone(), vel: _d.set(Math.cos(a) * 1.5, Math.abs(vy) * 0.3, Math.sin(a) * 1.5).clone(), life: 1.8, size: 0.8, sizeEnd: 2.4, color: new THREE.Color(0x4a4252), alpha: 0.35, drag: 1.5, gravity: 0.5 });
      }
    }
    this.prev = (this._was ||= F.map(() => new THREE.Vector3())); for (let r = 0; r <= NR; r += 2) this.prev[r].copy(now[r]);
  }

  /** The wake: the spine laid on the sea's surface (the head's ring to past the tail), as wide as the body there and spreading astern,
   *  each point as wide as the back is near the surface. In the world's frame, on the swells; with no sea, on the group's parent's y 0. */
  wakeAt(sea) {
    const M = this.wakeM, F = this.frames, Mw = this.group.matrixWorld;
    this.wakeMat.opacity = 0.85 * this.k.wake; M.visible = this.k.wake > 0.01; if (!M.visible) return;
    const P = M.geometry.attributes.position, y0 = this.group.parent ? _w.setFromMatrixPosition(this.group.parent.matrixWorld).y : 0; // (no sea: the waterline is the group's parent's y 0)
    for (let i = 0; i < WAKE_N; i++) {
      const s = i / (WAKE_N - 1), r = Math.min(NR, Math.round(s * NR * 1.3)), f = F[r], past = Math.max(0, s * 1.3 - 1) * LEVIATHAN.length;
      _v.copy(f.p).addScaledVector(f.t, -past).applyMatrix4(Mw); _d.copy(f.b).transformDirection(Mw); _d.y = 0; _d.normalize();
      const h = sea?.heightAt?.(_v.x, _v.z) ?? y0, depth = Math.abs(_v.y - h);
      const near = 1 - THREE.MathUtils.smoothstep(depth, LEVIATHAN.girth * 0.8, LEVIATHAN.girth * 2.6), fade = (1 - s) ** 0.6 * Math.min(1, s * 8);
      const w = (radius(Math.min(1, s * 1.3)) * 1.4 + 2 + past * 0.35) * (1 + 0.3 * this.quicken) * near * fade; // (as wide as its body, spreading astern; none where its back is deep)
      for (const [j, sx] of [[0, -1], [1, 1]]) P.setXYZ(i * 2 + j, _v.x + _d.x * w * sx, h + 0.06, _v.z + _d.z * w * sx);
    }
    P.needsUpdate = true;
  }

  dispose() { this.group.parent?.remove(this.group); this.parts.dispose(); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.(); this.barn.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _c = new THREE.Color();
