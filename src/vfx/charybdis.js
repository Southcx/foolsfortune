// ---------------------------------------------------------------------------------------
// CHARYBDIS: the maelstrom's Egregore, a mouth that drinks the sea (docs/LORE.md "The passage": Espada's, the owner's rule, Homer's
// whirlpool that swallows the sea and spits it out; one name for its five moods, its feeling the waypoint's weather; docs/GLOSSARY.md:
// Charybdis's look, a boss part). Petra holds it at the whirlpool's heart (world/emocean/charybdis.js: it rises 7 m out of the
// maelstrom, the Astral, and dives 6 m back in, the Umbral, by turns of four bars); this is how it looks and how each part answers
// (vfx/bossparts.js: intact, damaged, broken; line and glow; a closing ring's anchor). Not a whale copied from Old Nobody: a whale's body
// stood on end in the crude, as a sperm whale sleeps, with only its mouth at the top, round as a lamprey's, that the sea pours into.
//
//   THE MAW      a round gape on top, its LIP a thick rim of crude hide; inside, the GULLET (dark flesh) going down, ringed with rows of
//                labradorite teeth turned inward (a lamprey's oral disc); at its bottom THE THROAT ('throat'), the gullet's light in
//                the feeling's colour, seen from above down the maw: it swells before it swallows
//   THE BALEEN   eight combs of baleen standing round the lip, five plates each, leaning out ('baleen.0'..'baleen.7'): dark horn edged
//                in the Mind's line, seen from above and from the side as it rises. They flare out as their windup; damaged, two
//                plates of five are snapped; broken, stubs
//   THE EYES     six round its head under the lip ('eye.0'..'eye.5'), each burning in the feeling's colour in a ring of labradorite
//                TUBERCLES (the humpback's knobs, Lachrymite gone to labradorite), looking out and a little down: seen from the side,
//                and from below as it dives. Damaged, clouded and scarred; broken, the lid shut over it
//   THE THROAT POUCH  one side of its head ballooned and pleated as a lunging humpback's; its THROAT PLEATS (the ventral grooves) wound
//                down its neck into a spiral as the whirlpool winds; opposite, its ROSTRUM, a ridge up to the lip with the tubercles in rows.
//                Not round, so it reads as a beast and not a vessel as it turns
//   THE SHEATH   a column of crude whirling round its neck, faster than the beast turns: where the whirlpool's surface meets it when
//                it spits; and the whole beast turns slowly with the vortex
//   THE BODY     below the crude, hanging head up: a chest, two long humpback flippers that scull, the flukes at the bottom; the hide
//                crude itself (world/treasure/cubes.js oilMaterial, the slick's colours, as Old Nobody's), seen from the Umbral
//   THE RISE     breaching up the whirlpool's middle: a crown of crude thrown off its lip (the Umbral's splash, scaled), crude sheeting
//                off its head; risen, it LEANS its maw toward the ship (about its lip's middle, so what is struck stays where it is
//                drawn), the gape and the throat's light turned to the rail. THE DIVE: sinking back down, the sea pouring in after it
//   ITS MOODS    the feeling (COLOR) in its eyes, its throat and the whirlpool's film; the feeling in how it moves: wonder slow and open,
//                mirth quick and bobbing, desire its baleen splayed wide, grief bowed with its combs drooping, dread still with a shiver
//
// Prior art: Homer, Odyssey XII; the humpback whale (its lunge up through a bubble net, its throat pleats, its knobbed head and long
// flippers) and the sperm whale's vertical sleep (Miller et al. 2008); the lamprey's oral disc; Herbert's sandworm (a mouth that is
// the beast); Sin & Punishment's and Panzer Dragoon's arena bosses (circled, struck part by part); Elemental Gearbolt's telegraphs
// (vfx/closingring.js closes on a part's anchor); Shadow of the Colossus (weak points that glow on a body that is a place).
//
//   const C = new CharybdisLook({ env, fx })   C.group (its own frame: the lip's middle at the origin, Y up, the body hanging below)
//   C.set({ y (m over the crude: how high it stands, Petra's charybdis.y), feel, sense (which way it turns, the whirlpool's) })   C.place(heart (world, on the sea), sea?)
//   C.part(name) -> BossPart (names: 'baleen.0'..'baleen.7', 'eye.0'..'eye.5', 'throat')   C.parts   C.reset()   C.hit(power)
//   C.whirlFor(y, lift) -> { swallow, apex, inner } (what the whirlpool's middle is: vfx/whirlpool.js set)   C.vantage(name, out)
//   C.crossing(yW, out) (where its leaning axis crosses a height: the whirlpool's middle follows it)
//   C.update(rawDt, { sea, umbral, toward (a world point: the ship, which it leans to) })   C.dispose()   CHARYBDIS_LOOK (its numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { oilMaterial } from '../world/treasure/cubes.js';
import { BossPart, BossParts } from './bossparts.js';
import { haloTexture } from './lighthouselamp.js';
import { COLOR } from '../progress/weather.js';

export const CHARYBDIS_LOOK = {
  lip: 6, sheath: 7.3, length: 38, combs: 8, plates: 5, eyes: 6, eyeR: 7.08,
  /** Where the whirlpool meets its sheath when it spits (m from the crude), and how fast it sinks when it is beaten (m a real second). */
  spitApex: -3.6, sink: 8,
  /** Risen, it leans its maw toward the ship (radians at the top of its rise), so the gape and its throat face the rail. */
  lean: 0.32,
};
const K = CHARYBDIS_LOOK;
const LAB = [0x6638d1, 0x384cf2, 0x2480fa, 0x1ab3db, 0x38c78c, 0xebc252, 0xe07542]; // (labradorite's flash, vfx/labradorite.js)
const HORN = 0x2a2430, FLESH = 0x2a0b10, CRUDE = new THREE.Color(0x120e16), GLINT = new THREE.Color(1.0, 0.78, 0.4);
/** The five moods in its body: how fast it turns, how its baleen flares, how it breathes and bobs, a droop, a shiver. */
const MOOD = {
  wonder: { spin: 1, flare: 0.22, breath: 0.6, bob: 0.4, droop: 0, shiver: 0 },
  mirth: { spin: 1.4, flare: 0.3, breath: 1.5, bob: 0.9, droop: 0, shiver: 0 },
  desire: { spin: 1.2, flare: 0.45, breath: 1, bob: 0.5, droop: 0, shiver: 0 },
  grief: { spin: 0.55, flare: -0.18, breath: 0.4, bob: 0.25, droop: 0.1, shiver: 0 },
  dread: { spin: 0.85, flare: 0.05, breath: 0.7, bob: 0.2, droop: 0, shiver: 1 },
};
const MOOD0 = { spin: 1, flare: 0.15, breath: 0.8, bob: 0.4, droop: 0, shiver: 0 };

/** The beast's profile from the lip's inside down to the tail (radius, height in its frame): the lip, the head's bulb, the long neck,
 *  the chest, the tail stock. Read as a smooth curve. */
const PROFILE = [[5.25, -1.3], [5.55, 0.05], [6.05, 0.4], [6.65, 0.05], [7.0, -1.3], [7.1, -3.4], [6.85, -6], [6.7, -9], [7.1, -12.5],
  [8.0, -16.5], [8.2, -20.5], [7.2, -25], [5.0, -30], [2.8, -34], [1.5, -37], [0.7, -38.4]]; // (its head and neck one mass, as a whale's head is)
const PLEATS = 22, TWIST = 0.09; // (the throat pleats round the neck, and their spiral: radians a metre)

/** The hide: a lathe of the profile, its pleats spiralling down the neck (no seam: the ring is indexed round), and not round: on one
 *  side the THROAT POUCH ballooned and pleated as a lunging humpback's (bearing 0), on the other its ROSTRUM, a ridge up to the lip where the
 *  tubercles run in rows (its rostrum's). */
const POUCH = { bear: 0, out: 0.32, wide: 0.85, top: 1.6, peak: 5, bottom: 9.5 }, ROSTRUM = { out: 0.07, wide: 0.22, bottom: 8 };
const bearing = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function hideGeometry() {
  const curve = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y))), pts = curve.getSpacedPoints(54), NA = 96;
  const n = pts.length * NA + 1, pos = new Float32Array(n * 3), seed = new Float32Array(n), idx = [], S = THREE.MathUtils.smoothstep;
  pts.forEach((p, i) => {
    const d = -p.y, pl = S(d, 2.8, 4.5) * (1 - S(d, 19, 23)), pouch = S(d, POUCH.top, POUCH.peak) * (1 - S(d, POUCH.peak, POUCH.bottom)), ridge = S(d, 0.2, 1.2) * (1 - S(d, 3, ROSTRUM.bottom));
    for (let j = 0; j < NA; j++) {
      const th = (j / NA) * Math.PI * 2, bp = bearing(th, POUCH.bear), bk = bearing(th, POUCH.bear + Math.PI);
      const sack = Math.exp(-((bp / POUCH.wide) ** 2)), g = Math.pow(Math.abs(Math.sin((PLEATS / 2) * (th + TWIST * p.y))), 0.35);
      const r = p.x * (1 + 0.055 * Math.max(pl, pouch) * (1 + 1.4 * sack) * (g - 0.8) + POUCH.out * pouch * sack + ROSTRUM.out * ridge * Math.exp(-((bk / ROSTRUM.wide) ** 2)));
      pos.set([Math.cos(th) * r, p.y, Math.sin(th) * r], (i * NA + j) * 3); seed[i * NA + j] = (i / pts.length) * 0.8;
      if (i < pts.length - 1) { const a = i * NA + j, b = i * NA + ((j + 1) % NA); idx.push(a, b, a + NA, b, b + NA, a + NA); }
    }
  });
  const tip = n - 1, last = (pts.length - 1) * NA; pos.set([0, -38.7, 0], tip * 3); seed[tip] = 0.8;
  for (let j = 0; j < NA; j++) idx.push(last + j, last + ((j + 1) % NA), tip);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

/** One baleen plate: a thin blade 3.4 m tall, tapering and curving outward to its tip (in the comb's frame: x round, y up, z out). */
function plateGeometry(h = 3.4) {
  const g = new THREE.BoxGeometry(0.62, h, 0.09, 1, 6, 1).translate(0, h / 2, 0), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i), k = y / h; P.setX(i, P.getX(i) * (1 - 0.55 * k)); P.setZ(i, P.getZ(i) + 0.9 * k * k); }
  g.computeVertexNormals(); return g;
}
/** A comb of five plates in three states: whole, two snapped (damaged), all stubs (broken). Shared by the eight. */
function combGeometries() {
  const at = (i) => (i - (K.plates - 1) / 2) * 0.68;
  const make = (hOf) => mergeGeometries(Array.from({ length: K.plates }, (_, i) => plateGeometry(hOf(i)).rotateY(-at(i) * 0.08).translate(at(i), 0, 0)));
  return { intact: make(() => 3.4), damaged: make((i) => (i === 1 || i === 3 ? 0.45 : 2.6)), broken: make(() => 0.4) };
}

const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color(), _e = new THREE.Euler();
const _w = new THREE.Vector3();

export class CharybdisLook {
  constructor({ env = null, fx = null } = {}) {
    this.fx = fx; this.t = 0; this.y = 0; this.yWas = null; this.feel = null; this.mood = MOOD0; this.turn = 0; this.sheathTurn = 0; this.sheet = 0; this.sense = 1;
    this.leanK = 0; this.leanA = 0;
    this.group = new THREE.Group(); this.group.name = 'charybdis';
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    this.parts = new BossParts(); const look = (p, what) => this.look(p, what);
    this.tilt = new THREE.Group(); this.group.add(this.tilt); // (its lean toward the ship, about its lip's middle)
    this.body = new THREE.Group(); this.tilt.add(this.body); // (what turns with the vortex)
    // the hide: crude standing up, as Old Nobody's (the same program: the oil slick, both faces)
    this.oil = oilMaterial({ env, envIntensity: 0.1, uni: { uOil: { value: 0.24 }, uOilPow: { value: 3.2 }, uHue: { value: 0.3 } } }); track(this.oil.mat);
    this.oil.mat.side = THREE.DoubleSide;
    this.hide = new THREE.Mesh(track(hideGeometry()), this.oil.mat); this.hide.castShadow = true; this.body.add(this.hide);
    const seeded = (g, v) => { g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(v), 1)); return g; };
    // the gullet: dark flesh going down from the lip to the throat
    const gul = track(new THREE.LatheGeometry([[1.3, -8.7], [2.6, -6.4], [4.1, -3.6], [5.0, -1.9], [5.3, -1.25]].map(([r, y]) => new THREE.Vector2(r, y)), 40));
    this.mouthMat = track(new THREE.MeshStandardMaterial({ color: FLESH, roughness: 0.6, side: THREE.DoubleSide }));
    this.body.add(new THREE.Mesh(gul, this.mouthMat));
    // the sheath: crude whirling round its neck, its ridges helical (turned faster than the beast: update)
    const sh = track(new THREE.CylinderGeometry(K.sheath, K.sheath + 0.4, 6.5, 48, 8, true).translate(0, -10.6, 0)), SP = sh.attributes.position; // (under the pouch: where the whirlpool meets it when it spits)
    for (let i = 0; i < SP.count; i++) { const x = SP.getX(i), z = SP.getZ(i), y = SP.getY(i), a = Math.atan2(z, x), k = 1 + 0.05 * Math.sin(6 * (a - 0.32 * y)) + 0.03 * Math.sin(13 * (a + 0.2 * y)); SP.setX(i, x * k); SP.setZ(i, z * k); }
    sh.computeVertexNormals(); seeded(sh, 0.5);
    this.sheath = new THREE.Mesh(sh, this.oil.mat); this.sheath.castShadow = true; this.tilt.add(this.sheath);
    // the flippers (a humpback's: a third of its length, the leading edge scalloped) and the flukes, lying flat at the bottom
    const fin = new THREE.Shape(); fin.moveTo(0, -1.2); fin.quadraticCurveTo(5, -1.9, 12.5, -1.1); fin.quadraticCurveTo(13.3, -0.2, 12.2, 0.4);
    for (let i = 0; i < 6; i++) { const x = 11 - i * 1.8; fin.quadraticCurveTo(x + 0.4, 1.25 - i * 0.02, x - 0.9, 0.95 + i * 0.03); } // (the tubercles' scallops)
    fin.quadraticCurveTo(0.5, 1.4, 0, 1.2); fin.lineTo(0, -1.2);
    const finG = seeded(track(new THREE.ShapeGeometry(fin, 4)).rotateX(Math.PI / 2), 0.55);
    this.fins = [0, Math.PI].map((a, i) => { // (bearing out from the chest, drooping, rolled so the broad face shows from the side)
      const p = new THREE.Group(); p.position.set(Math.cos(a) * 7.9, -17, Math.sin(a) * 7.9); p.rotation.y = -a; this.body.add(p);
      const droop = new THREE.Group(); p.add(droop); const m = new THREE.Mesh(finG, this.oil.mat); m.rotation.x = 1.25; m.castShadow = true; droop.add(m);
      return { p, droop, a, k: i * 1.7 };
    });
    const fl = new THREE.Shape(); fl.moveTo(0, 0.6); fl.quadraticCurveTo(4, 1.6, 6.5, -1.6); fl.quadraticCurveTo(3.5, -0.4, 0, -1.4); fl.quadraticCurveTo(-3.5, -0.4, -6.5, -1.6); fl.quadraticCurveTo(-4, 1.6, 0, 0.6);
    this.flukes = new THREE.Mesh(seeded(track(new THREE.ShapeGeometry(fl, 6)).rotateX(Math.PI / 2), 0.8), this.oil.mat); this.flukes.scale.setScalar(1.5); this.flukes.position.y = -38.2; this.body.add(this.flukes);
    // the labradorite: the teeth in the gullet and the tubercles on its head and round its eyes (one instanced draw, Old Nobody's program)
    this.lab = track(new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.85, flatShading: true, emissive: 0x120e16 }));
    const knobs = this.knobs(), knob = track(new THREE.OctahedronGeometry(0.22, 0));
    this.labM = new THREE.InstancedMesh(knob, this.lab, knobs.length); this.labM.frustumCulled = false;
    knobs.forEach((k, i) => { this.labM.setMatrixAt(i, _m.compose(k.p, _q.setFromEuler(_e.set(k.rx, k.ry, k.rz)), k.s)); this.labM.setColorAt(i, _c.setHex(LAB[i % LAB.length]).multiplyScalar(k.tooth ? 0.8 : 0.36)); });
    this.labM.instanceMatrix.needsUpdate = true; this.body.add(this.labM);
    // the baleen: eight combs round the lip (boss parts), flaring out with their windup
    const combs = this.combG = combGeometries(); for (const g of Object.values(combs)) track(g);
    this.combEdges = Object.fromEntries(Object.entries(combs).map(([s, g]) => [s, track(new THREE.EdgesGeometry(g, 30))]));
    this.combs = [];
    for (let k = 0; k < K.combs; k++) {
      const a = (k / K.combs) * Math.PI * 2, root = new THREE.Group(); root.position.set(Math.cos(a) * 6.1, 0.25, Math.sin(a) * 6.1); root.rotation.y = Math.PI / 2 - a; this.body.add(root);
      const lean = new THREE.Group(); root.add(lean);
      const horn = track(new THREE.MeshStandardMaterial({ color: HORN, roughness: 0.4, metalness: 0.35, flatShading: true, emissive: 0x0b0712 })); // (each its own, for its own windup: one program, Old Nobody's tusks')
      const m = new THREE.Mesh(combs.intact, horn); m.castShadow = true; lean.add(m);
      const part = this.parts.add(new BossPart({ name: `baleen.${k}`, object: lean, radius: 2.2, at: new THREE.Vector3(0, 2.8, 0.7), facing: new THREE.Vector3(0, 0.6, 1), look }));
      const wire = part.wire(this.combEdges.intact, { lines: true, parent: m, bright: 0.55 }); part.index = k; // (five plates' edges: dimmer than a tusk's, or the comb is a bar of light)
      this.combs.push({ root, lean, m, horn, wire, part, flare: 0, k: 0 });
    }
    // the eyes: six round its head under the lip, in rings of tubercles (boss parts)
    this.eyes = [];
    const eyeG = track(new THREE.SphereGeometry(0.62, 14, 10)), lidG = seeded(track(new THREE.SphereGeometry(0.72, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)).rotateX(Math.PI / 2), 0.2);
    const scarG = track(new THREE.BoxGeometry(0.09, 1.3, 0.08)), ringG = track(new THREE.CircleGeometry(0.8, 20)).translate(0, 0, 0.42), pupilG = track(new THREE.BoxGeometry(0.17, 0.78, 0.06));
    this.scarMat = track(new THREE.MeshBasicMaterial({ color: 0x0a0608 }));
    for (let k = 0; k < K.eyes; k++) {
      const a = ((k + 0.5) / K.eyes) * Math.PI * 2, root = new THREE.Group(); root.position.set(Math.cos(a) * K.eyeR, -2.2, Math.sin(a) * K.eyeR);
      root.lookAt(_v.set(Math.cos(a) * 20, -2.2 - 5, Math.sin(a) * 20)); this.body.add(root); // (out, and a little down)
      const mat = track(new THREE.MeshStandardMaterial({ color: 0x2a2232, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.6 })); // (dark glass lit from inside by its feeling)
      const eye = new THREE.Mesh(eyeG, mat); eye.scale.set(1, 0.82, 0.55); root.add(eye);
      const pupil = new THREE.Mesh(pupilG, this.scarMat); pupil.position.z = 0.33; eye.add(pupil); // (a slit, a goat's or an octopus's: not a whale's)
      const lid = new THREE.Mesh(lidG, this.oil.mat); lid.position.z = 0.05; lid.visible = false; root.add(lid);
      const scar = new THREE.Mesh(scarG, this.scarMat); scar.position.z = 0.36; scar.rotation.z = 0.6 + k; scar.visible = false; root.add(scar);
      const part = this.parts.add(new BossPart({ name: `eye.${k}`, object: root, radius: 1.0, at: new THREE.Vector3(0, 0, 0.5), facing: new THREE.Vector3(0, 0, 1), look }));
      part.wire(ringG, { threshold: 10 }); part.index = k;
      this.eyes.push({ root, eye, pupil, mat, lid, scar, part, w: 0 });
    }
    // the throat: the gullet's light at its bottom, and its glow up the maw (a boss part, seen from above)
    this.throatMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.throatM = new THREE.Mesh(track(new THREE.CircleGeometry(1.45, 24).rotateX(-Math.PI / 2)), this.throatMat); this.throatM.position.y = -8.55; this.body.add(this.throatM);
    this.haloMat = track(new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.halo = new THREE.Mesh(track(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2)), this.haloMat); this.halo.position.y = -7.6; this.halo.renderOrder = 3; this.body.add(this.halo);
    const tp = this.parts.add(new BossPart({ name: 'throat', object: this.throatM, radius: 1.6, at: new THREE.Vector3(0, 0.4, 0), facing: new THREE.Vector3(0, 1, 0), look }));
    tp.wire(track(new THREE.CircleGeometry(1.6, 24).rotateX(-Math.PI / 2).translate(0, 0.05, 0)), { threshold: 10 });
    // the vantages a rail circling it sees its parts best by (its frame)
    this.vantages = { above: new THREE.Vector3(0, 22, 0), flank: new THREE.Vector3(0, -2, 26), below: new THREE.Vector3(0, -22, 18) };
    this.glow = { throat: 0, eyes: 0, floor: 0.25 }; // (the throat's disc never goes black while it lives; broken, its light is out)
    this.set({ feel: 'grief' });
    this.reset();
  }

  /** Where the labradorite goes: rows of teeth down the gullet (turned in and down), tubercles round the lip and each eye, a scatter on
   *  the chest. Static in its frame (the whole beast turns). */
  knobs() {
    const out = [], rnd = mulberry(11), put = (p, s, rx, ry, rz, tooth = false) => out.push({ p: p.clone(), s: new THREE.Vector3().copy(s), rx, ry, rz, tooth });
    [[0.2, 20], [0.45, 16], [0.7, 12]].forEach(([t, n]) => { // (a lamprey's rows: fangs from the gullet's wall, toward its middle and down)
      const r = THREE.MathUtils.lerp(5.0, 1.6, t), y = THREE.MathUtils.lerp(-1.6, -8.3, t);
      for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + t * 3; put(_v.set(Math.cos(a) * r * 0.97, y, Math.sin(a) * r * 0.97), _s.set(1, 3.2 - t * 1.4, 1), 0, -a, Math.PI / 2 + 0.6, true); }
    });
    for (const [r, y, n] of [[6.6, -0.3, 26], [7.0, -1.2, 22]]) for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + y; put(_v.set(Math.cos(a) * r, y, Math.sin(a) * r), _s.setScalar(1.1 + rnd() * 1.1), rnd() * 6, rnd() * 6, 0); }
    for (const sd of [-1, 0, 1]) for (let j = 0; j < 9; j++) { const y = -0.6 - j * 0.85, a = POUCH.bear + Math.PI + sd * 0.16, r = this.radiusAt(y) * (1 + ROSTRUM.out * (sd ? 0.6 : 1)) + 0.05; put(_v.set(Math.cos(a) * r, y, Math.sin(a) * r), _s.setScalar(1.6 - j * 0.08 + rnd() * 0.4), rnd() * 6, rnd() * 6, 0); } // (the rostrum's rows of knobs)
    for (let k = 0; k < K.eyes; k++) { const a = ((k + 0.5) / K.eyes) * Math.PI * 2; for (let j = 0; j < 7; j++) { const b = (j / 7) * Math.PI * 2, u = 0.98; _d.set(-Math.sin(a), 0, Math.cos(a)); put(_v.set(Math.cos(a) * K.eyeR, -2.2 + Math.sin(b) * u, Math.sin(a) * K.eyeR).addScaledVector(_d, Math.cos(b) * u), _s.setScalar(1.3 + rnd() * 0.6), rnd() * 6, rnd() * 6, 0); } }
    for (let j = 0; j < 46; j++) { const y = -13 - rnd() * 14, a = rnd() * Math.PI * 2, r = this.radiusAt(y) * 0.98; put(_v.set(Math.cos(a) * r, y, Math.sin(a) * r), _s.setScalar(0.9 + rnd() * 1.8), rnd() * 6, rnd() * 6, 0); }
    return out;
  }
  radiusAt(y) { for (let i = 1; i < PROFILE.length; i++) { const [r1, y1] = PROFILE[i - 1], [r2, y2] = PROFILE[i]; if (y <= y1 && y >= y2) return THREE.MathUtils.lerp(r1, r2, (y1 - y) / (y1 - y2)); } return 1; }

  /** A part's look as its state, its windup or a hit say (vfx/bossparts.js calls this). */
  look(p, what) {
    const n = p.name;
    if (n.startsWith('baleen.')) {
      const C = this.combs[p.index]; if (what !== 'state') return;
      C.m.geometry = this.combG[p.state]; C.wire.geometry = this.combEdges[p.state];
    } else if (n.startsWith('eye.')) {
      const E = this.eyes[p.index]; if (what !== 'state') return;
      const b = p.state === 'broken'; E.eye.visible = !b; E.lid.visible = b; E.scar.visible = p.state !== 'intact'; E.pupil.visible = p.state === 'intact';
    }
  }

  part(name) { return this.parts.part(name); }
  reset() { this.parts.reset(); for (const C of this.combs) C.flare = 0; this.yWas = null; this.sheet = 0; } // (a beast shown again is not seen to cross the surface from where it was last)
  /** A blow on its body (the foe the runtime strikes): every open part's line and glow lifts a little. */
  hit(power = 1) { for (const p of this.parts.map.values()) if (p.open) p.hit(0.35 * power); }

  /** How high it stands (m over the crude), the feeling it wears (COLOR: its eyes, its throat, the whirlpool's film) and which way it
   *  turns with the whirlpool (`sense`, vfx/whirlpool.js: +1 toward atan2(z, x) rising, -1 the other way). */
  set({ y, feel, sense } = {}) {
    if (y !== undefined) this.y = y;
    if (sense !== undefined) this.sense = sense < 0 ? -1 : 1;
    if (feel !== undefined && feel !== this.feel) { this.feel = feel; this.mood = MOOD[feel] || MOOD0; this.color = new THREE.Color(COLOR[feel] ?? 0xffc65c); }
  }
  /** Its place: the lip's middle over the whirlpool's heart (world), at its height over the crude the logic rides. */
  place(heart, sea = null) { this.group.position.set(heart.x, (sea?.y ?? heart.y) + this.y, heart.z); }

  /** The whirlpool's middle as it stands: swallowing (the lip at or under the crude's level), the surface meets its lip and pours in;
   *  risen, it spits, the surface wrapped round its sheath. `lift` is the drawn sea's (the Umbral form's): the surface is drawn higher,
   *  the beast is where it is. */
  whirlFor(y = this.y, lift = 0) {
    const k = THREE.MathUtils.smoothstep(y, -3.5, 2.5), apex = THREE.MathUtils.lerp(Math.min(y - 0.1, -0.6), K.spitApex, k);
    return { swallow: 1 - k, apex: apex - lift, inner: THREE.MathUtils.lerp(K.lip - 0.55, (K.sheath + 0.25) / Math.cos(this.leanK), k) }; // (leaning, its sheath meets the crude in an ellipse)
  }
  /** Where its axis (the lip's middle down its neck, as it leans) crosses a height (world): the whirlpool's middle follows it. */
  crossing(yW, out = new THREE.Vector3()) {
    const P = this.group.position; _d.set(0, -1, 0).applyQuaternion(this.tilt.quaternion);
    return out.copy(P).addScaledVector(_d, (P.y - yW) / Math.max(0.2, -_d.y)).setY(yW);
  }

  vantage(name, out = new THREE.Vector3()) { const v = this.vantages[name]; return v ? out.copy(v).applyMatrix4(this.group.matrixWorld) : out.copy(this.group.position); }

  update(raw = 1 / 60, { sea = null, umbral = null, toward = null } = {}) {
    this.t += raw; const t = this.t, M = this.mood, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    this.parts.update(raw);
    // risen, it leans its maw toward the ship (the bearing eased the short way round, so it tracks without snapping)
    const P = this.group.position, kr = THREE.MathUtils.smoothstep(this.y, 0, 6);
    if (toward) { const a = Math.atan2(toward.z - P.z, toward.x - P.x); let d = a - this.leanA; d = Math.atan2(Math.sin(d), Math.cos(d)); this.leanA += d * (1 - Math.exp(-raw * 3)); }
    this.leanK = ease(this.leanK, toward ? K.lean * kr : 0, 2);
    // it turns with the vortex, its sheath faster; it bobs and breathes in its mood; a dread one shivers
    this.turn += raw * 0.12 * M.spin * this.sense; this.sheathTurn += raw * 0.55 * M.spin * this.sense; // (angles as the world's atan2(z, x) reads them, as the whirlpool's: three's rotation about y turns that angle the other way, so the minus below)
    this.body.rotation.set(M.droop + 0.02 * Math.sin(t * 0.5), -this.turn, 0.02 * Math.cos(t * 0.43) + (M.shiver ? 0.006 * Math.sin(t * 37) : 0));
    this.body.position.y = 0.25 * M.bob * Math.sin(t * 1.1 * M.breath);
    const sw = 1 + 0.025 * Math.sin(t * 1.6 * M.breath + 0.6); this.body.scale.set(sw, 1, sw); // (it swells and draws in as it swallows)
    this.sheath.rotation.y = -this.sheathTurn;
    for (const f of this.fins) f.droop.rotation.z = -0.95 + 0.22 * Math.sin(t * 0.7 + f.k); // (a slow scull)
    this.flukes.rotation.x = 0.12 * Math.sin(t * 0.6);
    // the baleen: its mood's flare, its windup's (wide), a damaged comb hanging
    const inhale = 0.5 + 0.5 * Math.sin(t * 1.6 * M.breath);
    _v.set(Math.sin(this.leanA), 0, -Math.cos(this.leanA)); this.tilt.quaternion.setFromAxisAngle(_v, this.leanK * (0.92 + 0.16 * inhale)); // (up turned toward the bearing: about up x bearing; a nod with each breath)
    for (const C of this.combs) {
      const p = C.part, want = M.flare + 0.12 * inhale + 0.55 * p.windupK + (p.state === 'damaged' ? -0.2 : 0);
      C.k = ease(C.k, want, 5); C.lean.rotation.x = C.k; // (out: the comb's z is out from the lip)
      this.hornGlow(C);
    }
    // the eyes: the feeling's colour, burning with their windup, clouded when damaged
    const col = this.color;
    for (const E of this.eyes) {
      const p = E.part; E.w = ease(E.w, p.windupK, 6);
      E.eye.scale.set(1 + 0.25 * E.w, 0.82 + 0.25 * E.w, 0.55);
      E.mat.emissive.copy(col).lerp(_c.setRGB(1, 0.94, 0.8), 0.5 * E.w);
      E.mat.emissiveIntensity = (p.state === 'damaged' ? 0.18 : 0.75) * (0.85 + 0.15 * Math.sin(t * 2.3 + p.index)) + 1.6 * E.w + 0.9 * Math.min(1, p.pulse);
      if (p.state === 'damaged') E.mat.emissive.lerp(_c.setRGB(0.5, 0.5, 0.52), 0.6);
    }
    // the throat: its light swells before it swallows (its windup), flickers damaged, is out broken
    const tp = this.parts.part('throat'), th = (this.glow.throat = ease(this.glow.throat, tp.alive ? 0.45 + 0.3 * inhale + 0.9 * tp.windupK : 0.04, 4));
    const fl = tp.state === 'damaged' ? 0.6 + 0.4 * Math.sin(t * 23) * Math.sin(t * 7) : 1;
    const floor = (this.glow.floor = ease(this.glow.floor, tp.alive ? 0.25 : 0.02, 4));
    this.throatMat.color.copy(col).multiplyScalar(floor + 1.1 * th * fl); this.throatM.scale.setScalar(0.8 + 0.6 * th);
    this.haloMat.color.copy(col); this.haloMat.opacity = Math.min(1, 0.85 * th * fl); this.halo.scale.setScalar(0.7 + 0.7 * th);
    this.mouthMat.emissive.copy(col).multiplyScalar((0.02 + 0.12 * th) * fl); // (the gullet lit by it, so the throat's light shows from the side, over the lip)
    this.oil.uni.uHue.value += raw * 0.012 * M.spin; // (the film creeps along it as it turns)
    this.group.updateMatrixWorld(true);
    this.splashes(raw, sea, umbral);
  }

  /** A comb's horn catching the feeling at its windup. */
  hornGlow(C) { const k = C.part.windupK + 0.6 * Math.min(1, C.part.pulse); C.horn.emissive.setHex(0x0b0712); if (k > 0.01) C.horn.emissive.lerp(this.color, Math.min(0.5, k * 0.35)); }

  /** The breach and the dive at the crude's level: the crown thrown off its lip, crude sheeting off its head; the sea pouring in. */
  splashes(raw, sea, umbral) {
    const fx = this.fx, y = this.y, was = this.yWas; this.yWas = y;
    if (was == null || raw <= 0) return;
    const P = this.group.position, base = P.y - y; // (the crude's level the logic rides, under its lip)
    if (was < 0 && y >= 0) { this.sheet = 1; this.crown(_v.set(P.x, base, P.z), umbral, false); }
    else if (was >= 0 && y < 0) this.crown(_v.set(P.x, base, P.z), umbral, true);
    if (!fx?.alpha) return;
    this.sheet = Math.max(0, this.sheet - raw * 0.35);
    const pour = y > 0.5 ? this.sheet : y < -0.5 ? 0.6 : 0, n = Math.floor(pour * 40 * raw + Math.random());
    for (let i = 0; i < n; i++) { // (risen: crude sheeting off its head; under: the sea pouring over the lip into the maw)
      const a = Math.random() * Math.PI * 2, out = y > 0, r = out ? K.lip + 0.6 : K.lip - 0.3;
      _w.set(P.x + Math.cos(a) * r, P.y + (out ? 0.2 : 0.4), P.z + Math.sin(a) * r);
      _d.set(Math.cos(a) * (out ? 1.6 : -1.2), out ? 0.5 : -0.5, Math.sin(a) * (out ? 1.6 : -1.2));
      fx.alpha.emit({ pos: _w, vel: _d, life: 1.4, size: 0.4, sizeEnd: 0.12, color: CRUDE, alpha: 0.85, drag: 0.4, gravity: 9.8 });
    }
  }
  crown(at, umbral, dive) {
    umbral?.splash?.(at, { power: 2, dive });
    const fx = this.fx; if (!fx?.alpha) return;
    for (let i = 0; i < (dive ? 40 : 90); i++) {
      const a = (i / (dive ? 40 : 90)) * Math.PI * 2 + Math.random() * 0.2, r = K.lip + 0.3 + Math.random() * 1.2, up = dive ? 4 + Math.random() * 4 : 9 + Math.random() * 6;
      _w.set(at.x + Math.cos(a) * r, at.y + 0.2, at.z + Math.sin(a) * r); _d.set(Math.cos(a) * (2.5 + Math.random() * 3.5), up, Math.sin(a) * (2.5 + Math.random() * 3.5));
      const glint = i % 6 === 0;
      (glint && fx.add ? fx.add : fx.alpha).emit({ pos: _w, vel: _d, life: dive ? 1.2 : 2.2, size: glint ? 0.18 : 0.55, sizeEnd: 0.14, color: glint ? GLINT : CRUDE, alpha: 0.9, drag: 0.3, gravity: 9.8 });
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.parts.dispose(); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.(); this.labM.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
