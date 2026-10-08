// ---------------------------------------------------------------------------------------
// THE SHIP CLASSES: the frigate, the destroyer, the galleon and the tanker as the Vessoul's ships (docs/GLOSSARY.md: the Vessoul,
// ship; progress/rail/ships.js: each hull's size, role and verbs). One being with the sloop (vfx/sloop.js, the keeper: the owner's
// flying submarine), so they are made by its rules, THE HULL CLASS'S SILHOUETTE RULES:
//   1  the hull is a pot thrown on the wheel and laid on its side: the foot is the bow, the open mouth the stern, glowing with the
//      Lachryma that drives it (in the ship's feeling's colour: `polarity`); its throwing rings wrap the hull
//   2  each class is a different pot, and climbs the folk's clay ladder with its worth (earthenware < stoneware < porcelain):
//        frigate    the MEIPING (the plum vase: a slim foot, a broad high shoulder, a small neck), in grey-green ash-glazed stoneware
//        destroyer  the KINUTA MALLET VASE (Longquan celadon: a straight body, a sharp shoulder, a long neck with phoenix ears): the
//                   long neck is a submarine's tail, the phoenix ears its tail fins, and a raked fin amidships its sail; no canvas
//        galleon    the GINGER JAR in blue-and-white porcelain with its domed LID as the stern castle; three masts, square-rigged
//        tanker     the ONGGI (the Korean storage jar for what must keep: broad, heavy, iron-brown), riding low; on its deck a row
//                   of little lidded onggi, the hold's domes (an LNG carrier's spheres, and the casks themselves); it never dives
//   3  fired and mended: the chest's kintsugi gold in the body (vfx/chestglaze.js), at a ship's scale
//   4  the figurehead is a little Pneuka Jar at the foot, its lid gold; the deckhouse the maker's kiln, its mouth lit
//   5  the Solar Skiff's green spars and red swallowtail pennant (the skiff is the Vessoul's limb)
//   6  the Mind's labradorite line along the gunwale (vfx/labradorite.js: the line every Mind thing is drawn in), so a hull reads as
//      the Vessoul's at a glance on a sea of other ships; the sloop keeps the look the owner approved
// Size from ships.js's hurtbox (the sloop's 7 m times it); role in the silhouette: the frigate's third mount a gun ring each side,
// the destroyer low and long, the galleon tall, the tanker long and low.
//
// Prior art: the four pots (the Song meiping, Longquan's kinuta celadon, Kangxi blue-and-white ginger jars, Korean onggi), the real
// classes' silhouettes (a frigate's three square-rigged masts, a destroyer's low long hull, a galleon's high stern castle, a tanker's
// long low deck and its LNG cousins' domes), Wind Waker's ships (few big shapes), and the sloop's own build (primitives and lathes,
// merged: no file loaded). Every material is one of the sloop's (flat standard, the chest glaze, the sail's, the additive mouth) or the
// Mind's line, so a class sailed adds no shader program (measured: docs in the report).
//
//   shipLook(id, { env }) -> a Sloop or a ShipClassLook (the same API: group, set, polarity, hurt, hoist, keelMat, mouth, gunAt,
//   length, beam, dispose)   SHIP_FORMS[id] (the numbers)   new ShipClassLook(id, { env })
//   (its own frame: +Z the bow, Y up, origin at the waterline amidships)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sloop, SLOOP, JAR, jarHull, jarDeck, sailMaterial } from './sloop.js';
import { dressChestGlaze, chestGlazeUniforms } from './chestglaze.js';
import { vfxTexture } from './vfx.js';
import { mindLineMaterial } from './labradorite.js';
import { mergeStatic } from '../render/merge.js';
import { addOutline } from '../render/outline.js';
import { keepTrue } from './stormwarp.js';
import { causticsOn } from './umbral.js';

const C = { gold: 0xf2c14e, mast: 0x3f7a58, dark: 0x4a2a1e, lach: 0xffc65c, cobalt: 0x23408e, bisque: 0xf1d9b6 };

/** Each class: its pot's profile (foot to lip: fraction of the length, fraction of the belly's radius), size, sheer, clay, rig. */
export const SHIP_FORMS = {
  frigate: {
    pot: 'meiping', length: 7.7, beam: 2.3, draft: 0.9, sheer: [0.62, 0.4, 0.34], body: 0x8f9a86, deck: 0xd9cdb4, net: 0.24,
    profile: [[0, 0], [0.03, 0.3], [0.14, 0.52], [0.32, 0.7], [0.5, 0.87], [0.66, 1], [0.78, 0.97], [0.86, 0.66], [0.91, 0.4], [0.95, 0.38], [1, 0.46]],
    masts: [{ z: 2.0, h: 6.4, sails: 2 }, { z: -0.2, h: 7.4, sails: 2 }, { z: -2.2, h: 5.6, sails: 1 }], jib: true, guns: 3, kiln: -2.9,
  },
  destroyer: {
    pot: 'kinuta', length: 7.6, beam: 1.6, draft: 0.75, sheer: [0.42, 0.22, 0.05], body: 0x8fbfa6, deck: 0xcfe0d2, net: 0.26,
    profile: [[0, 0], [0.02, 0.4], [0.07, 0.72], [0.14, 0.9], [0.3, 0.97], [0.5, 1], [0.6, 0.98], [0.66, 0.6], [0.7, 0.34], [0.86, 0.3], [0.95, 0.33], [1, 0.42]],
    masts: [], fin: { z: 0.2, h: 1.7, len: 1.9 }, ears: true, kiln: null,
  },
  galleon: {
    pot: 'ginger jar', length: 10.2, beam: 3.4, draft: 1.1, sheer: [0.7, 0.45, 0.2], body: 0xf2f0ea, deck: 0xe6dcc6, net: 0.2,
    profile: [[0, 0], [0.03, 0.42], [0.1, 0.7], [0.24, 0.94], [0.44, 1], [0.62, 0.95], [0.76, 0.8], [0.86, 0.58], [0.91, 0.44], [0.96, 0.44], [1, 0.48]],
    masts: [{ z: 3.0, h: 7.6, sails: 2 }, { z: 0.6, h: 9.0, sails: 3 }, { z: -1.8, h: 6.6, sails: 2 }], jib: true, lid: true, bands: true, kiln: null,
  },
  tanker: {
    pot: 'onggi', length: 11.2, beam: 3.6, draft: 1.2, sheer: [0.38, 0.22, 0.12], body: 0x4a2c1c, deck: 0x8a6a4c, net: 0.18,
    profile: [[0, 0], [0.03, 0.46], [0.1, 0.76], [0.22, 0.95], [0.4, 1], [0.62, 1], [0.78, 0.95], [0.88, 0.82], [0.94, 0.74], [1, 0.78]],
    masts: [{ z: -3.6, h: 3.4, sails: 0 }], domes: 5, kiln: -4.0,
  },
};

/** A square sail: a grid hung from its yard (u across, v down from the head), its belly the sail material's (a sloop's). */
function squareGeometry(w, h) {
  const g = new THREE.PlaneGeometry(1, 1, 8, 8); g.translate(0.5, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setXYZ(i, 0, -v * h, (u - 0.5) * w * (1 + 0.12 * v)); } // (the foot a little wider than the head: a course's cut)
  g.computeVertexNormals();
  return g;
}

export class ShipClassLook {
  constructor(id, { env = null } = {}) {
    const F = SHIP_FORMS[id]; if (!F) throw new Error(`no ship form ${id}`);
    this.id = id; this.form = F; this.length = F.length; this.beam = F.beam;
    const dims = { length: F.length, beam: F.beam, draft: F.draft, sheer: F.sheer }, L = F.length, R = F.beam / 2;
    this.group = new THREE.Group(); this.body = new THREE.Group(); this.group.add(this.body);
    this.mats = []; this.geos = []; this.sails = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true, ...o }));
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => { track(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); if (outline) addOutline(m); return m; };
    const gold = std(C.gold, { metalness: 0.6, roughness: 0.35, envMap: env }), plain = std(F.body), spar = std(C.mast), dark = std(C.dark);
    // the hull: the pot's clay, mended with gold (the sloop's own glaze, its program)
    const clay = std(F.body, { roughness: id === 'galleon' || id === 'destroyer' ? 0.35 : 0.6, side: THREE.DoubleSide, envMap: env, envMapIntensity: id === 'galleon' || id === 'destroyer' ? 0.6 : 0.25 });
    this.glaze = chestGlazeUniforms(F.net); this.glaze.uGlaze.value = 3.45;
    dressChestGlaze(clay, this.glaze, { goldOnly: true }); clay.userData.causticSafe = true;
    add(this.body, jarHull(F.profile, dims), clay);
    const deckY = Math.min(0.42, F.sheer[0] * 0.75);
    add(this.body, jarDeck(F.profile, dims, deckY), std(F.deck, { roughness: 0.85 }), 0, 0, 0, false);
    // the mouth at the stern: a rim, and the Lachryma inside it
    const lip = F.profile[F.profile.length - 1][1] * R, lipZ = -L * 0.5;
    add(this.body, new THREE.TorusGeometry(lip * 0.92, 0.07, 6, 24), plain, 0, 0.22, lipZ + 0.05);
    this.mouth = track(new THREE.MeshBasicMaterial({ color: C.lach, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    add(this.body, new THREE.CircleGeometry(lip * 0.86, 24), this.mouth, 0, 0.22, lipZ + 0.06, false).rotation.y = Math.PI;
    // the figurehead: the little Pneuka Jar at the foot, its lid gold
    add(this.body, new THREE.LatheGeometry(JAR.map(([u, r]) => new THREE.Vector2(Math.max(0.001, r * 0.18), u * 0.5)), 12), plain, 0, (F.sheer[0] + F.sheer[1]) * 0.8, L * 0.5 - 0.05).rotation.x = -0.5;
    add(this.body, new THREE.IcosahedronGeometry(0.1, 0), std(C.gold, { emissive: 0x4a3200, emissiveIntensity: 0.4 }), 0, (F.sheer[0] + F.sheer[1]) * 0.8 + 0.45, L * 0.5 + 0.18);
    // the kiln deckhouse, its mouth lit
    this.kiln = track(new THREE.MeshBasicMaterial({ color: 0xffa860 }));
    if (F.kiln != null) {
      add(this.body, new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), plain, 0, deckY, F.kiln);
      add(this.body, new THREE.CircleGeometry(0.2, 12, 0, Math.PI), this.kiln, 0, deckY + 0.02, F.kiln + 0.6, false);
    }
    // the gun at the bow (Petra's to fit), and the frigate's guns in rings down each side (its third mount)
    add(this.body, new THREE.CylinderGeometry(0.22, 0.28, 0.2, 8), dark, 0, deckY + 0.12, L * 0.3);
    this.gunAt = new THREE.Object3D(); this.gunAt.position.set(0, deckY + 0.32, L * 0.3); this.body.add(this.gunAt);
    for (let i = 0; i < (F.guns || 0); i++) for (const s of [-1, 1]) {
      const z = L * (0.18 - i * 0.16), p = this.surfaceAt(z, 0.5, 1.01), x = s * p.x;
      const ring = add(this.body, new THREE.TorusGeometry(0.15, 0.04, 5, 12), gold, x, p.y, z, false); ring.rotation.y = Math.PI / 2;
      add(this.body, new THREE.CircleGeometry(0.12, 10), dark, x + s * 0.01, p.y, z, false).rotation.y = s * Math.PI / 2;
    }
    // the galleon: cobalt bands round the girth (blue-and-white), and the lid as its stern castle
    if (F.bands) for (const u of [0.2, 0.5, 0.8]) {
      const z = L * 0.5 - u * L, curve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => this.surfaceAt(z, (i / 12) * Math.PI, 1.012)));
      add(this.body, new THREE.TubeGeometry(curve, 24, 0.07, 4), std(C.cobalt), 0, 0, 0, false);
    }
    if (F.lid) { // (the jar's neck a collar, the lid on it: the stern castle, its windows lit astern)
      const lz = -L * 0.3, lr = this.radiusAt(lz) * 0.78, top = this.sheerAt(lz) + 0.15, ch = 0.75;
      add(this.body, new THREE.CylinderGeometry(lr * 0.86, lr * 0.92, ch + top - deckY, 18), clay, 0, (deckY + top + ch) / 2, lz);
      add(this.body, new THREE.TorusGeometry(lr * 0.9, 0.06, 5, 24), std(C.cobalt), 0, top + ch * 0.5, lz, false).rotation.x = Math.PI / 2;
      const lid = add(this.body, new THREE.SphereGeometry(lr, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay, 0, top + ch, lz); lid.scale.y = 0.7;
      add(this.body, new THREE.TorusGeometry(lr * 0.99, 0.07, 5, 24), std(C.cobalt), 0, top + ch + 0.04, lz, false).rotation.x = Math.PI / 2;
      add(this.body, new THREE.SphereGeometry(0.24, 10, 6), gold, 0, top + ch + lr * 0.7 + 0.14, lz);
      for (const x of [-0.45, 0, 0.45]) add(this.body, new THREE.CircleGeometry(0.16, 10), this.kiln, x * lr, top + ch * 0.45, lz - lr * 0.865, false).rotation.y = Math.PI;
    }
    // the tanker's hold: a row of little lidded onggi down the deck, each banded in the Mind's line below
    this.domes = [];
    for (let i = 0; i < (F.domes || 0); i++) {
      const z = L * (0.3 - i * 0.14), r = Math.min(0.7, this.radiusAt(z) * 0.55);
      const pot = add(this.body, new THREE.LatheGeometry(F.profile.map(([u, rr]) => new THREE.Vector2(Math.max(0.001, rr * r), u * r * 1.5)), 14), clay, 0, deckY, z);
      pot.rotation.x = Math.PI; pot.position.y = deckY + r * 1.5; // (stood on its mouth, the foot up: a lid)
      add(this.body, new THREE.SphereGeometry(r * 0.32, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, deckY + r * 1.5, z);
      this.domes.push({ z, r, y: deckY });
    }
    // the destroyer: a raked fin amidships (the sail of a submarine), the phoenix ears on its neck as tail fins
    if (F.fin) {
      const s = new THREE.Shape(); const { len, h } = F.fin;
      s.moveTo(-len * 0.5, 0); s.lineTo(len * 0.5, 0); s.lineTo(len * 0.18, h); s.lineTo(-len * 0.32, h * 0.92); s.lineTo(-len * 0.5, 0);
      const fg = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false }); fg.translate(0, 0, -0.11); fg.rotateY(-Math.PI / 2);
      add(this.body, fg, clay, 0, deckY - 0.02, F.fin.z);
      add(this.body, new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), spar, 0, deckY + h + 0.4, F.fin.z - 0.1);
    }
    if (F.ears) for (let k = 0; k < 4; k++) {
      const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.35, 0.15, 0.62, 0.5); s.lineTo(0.75, 0.15); s.quadraticCurveTo(0.5, -0.05, 0.2, -0.12); s.lineTo(0, 0); // (a phoenix's ear: a crest swept back)
      const eg = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }); eg.translate(0, 0, -0.03);
      const z = -L * 0.32, ear = new THREE.Group(); ear.position.set(0, 0.05, z); ear.rotation.z = (k * Math.PI) / 2 + Math.PI / 4; this.body.add(ear);
      const m = add(ear, eg, gold, 0, this.radiusAt(z) * 0.9, 0); m.rotation.y = Math.PI / 2;
    }
    // the rig: the skiff's green masts and gold yards, the sails cream (the lotus on the biggest), a jib to the bowsprit
    const lotus = vfxTexture('circle_lotus'), blank = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    let top = 0;
    for (const M of F.masts) {
      add(this.body, new THREE.CylinderGeometry(0.06, 0.1, M.h, 6), spar, 0, deckY + M.h / 2, M.z);
      top = Math.max(top, M.h);
      for (let k = 0; k < M.sails; k++) {
        const y1 = deckY + M.h * (0.95 - k * 0.3), y0 = y1 - M.h * 0.27, w = F.beam * (1.25 - k * 0.22);
        add(this.body, new THREE.CylinderGeometry(0.035, 0.035, w + 0.3, 5), gold, 0, y1, M.z).rotation.z = Math.PI / 2;
        const mat = track(sailMaterial(M.h === Math.max(...F.masts.map((x) => x.h)) && k === M.sails - 1 ? lotus : blank));
        const sail = add(this.body, squareGeometry(w, y1 - y0), mat, 0, y1 - 0.04, M.z + 0.05, false); sail.rotation.y = Math.PI / 2;
        this.sails.push({ mesh: sail, mat });
      }
    }
    if (F.jib && F.masts.length) {
      const M = F.masts[0], tack = L * 0.5 + 1.1, jib = new THREE.PlaneGeometry(1, 1, 6, 8); jib.translate(0.5, 0.5, 0);
      const jp = jib.attributes.position, head = deckY + M.h * 0.8;
      for (let i = 0; i < jp.count; i++) { const u = jp.getX(i), v = jp.getY(i); jp.setXYZ(i, 0, deckY + 0.4 + v * (head - deckY - 0.4), (tack - M.z) * (1 - v) - u * (1 - v) * 1.4); }
      jib.computeVertexNormals();
      const mat = track(sailMaterial(blank)); this.sails.push({ mesh: add(this.body, jib, mat, 0, 0, M.z, false), mat, jib: true });
      add(this.body, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), gold, 0, F.sheer[0] + F.sheer[1] * 0.7, L * 0.5 + 0.6).rotation.x = Math.PI / 2 - 0.15;
    }
    // the pennant: the skiff's red swallowtail at the highest masthead (or the fin's staff)
    const penY = F.fin ? deckY + F.fin.h + 0.8 : deckY + top - 0.1, penZ = F.fin ? F.fin.z - 0.1 : (F.masts.find((m) => m.h === top)?.z ?? 0);
    const pen = new THREE.PlaneGeometry(1.4, 0.24, 12, 1); pen.translate(-0.7, 0, 0);
    this.pennant = add(this.body, pen, std(0xc2432b, { emissive: 0x6a1a10, emissiveIntensity: 0.25, side: THREE.DoubleSide, flatShading: false }), 0, penY, penZ, false);
    this.pennant.rotation.y = Math.PI / 2;
    // the Mind's line along the gunwale, both sides and round the stern: the Vessoul's mark (rule 6)
    const pts = [];
    for (let i = 1; i <= 40; i++) { const z = L * 0.5 - (i / 40) * L; pts.push(this.surfaceAt(z, 0.62, 1.01)); }
    const line = [...pts, ...pts.slice().reverse().map((p) => new THREE.Vector3(-p.x, p.y, p.z))];
    this.lineMat = track(mindLineMaterial({ opacity: 0.95, depthTest: true, bright: 1.1 }));
    const lg = track(new THREE.BufferGeometry().setFromPoints(line)); this.line = new THREE.LineLoop(lg, this.lineMat); this.body.add(this.line);
    // the Lachryma it rides on
    this.keelMat = track(new THREE.MeshBasicMaterial({ color: C.lach, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const keel = add(this.group, new THREE.CircleGeometry(1, 24), this.keelMat, 0, -F.draft - 0.05, 0, false); keel.rotation.x = -Math.PI / 2; keel.scale.set(F.beam * 0.6, L * 0.45, 1);
    mergeStatic(this.body, { keep: new Set([this.pennant, this.gunAt, this.line, ...this.sails.map((s) => s.mesh)]) });
    causticsOn(this.body);
    for (const m of this.mats) keepTrue(m);
    this.set({});
  }

  /** The hull's half-beam at z (its frame), from the pot's profile. */
  radiusAt(z) {
    const F = this.form, u = THREE.MathUtils.clamp(0.5 - z / F.length, 0, 1), P = F.profile;
    for (let i = 0; i < P.length - 1; i++) if (u <= P[i + 1][0]) return (F.beam / 2) * THREE.MathUtils.lerp(P[i][1], P[i + 1][1], (u - P[i][0]) / Math.max(1e-6, P[i + 1][0] - P[i][0]));
    return (F.beam / 2) * P[P.length - 1][1];
  }
  /** A point on the hull's skin at z, `a` radians up from the beam's line (0 the side at the waterline, pi/2 the top), pushed out by
   *  `out` (jarHull's mapping: the lathe's ring, its upper half squashed to the sheer). */
  surfaceAt(z, a, out = 1) {
    const r = this.radiusAt(z) * out, R = this.form.beam / 2, y = r * Math.sin(a);
    return new THREE.Vector3(r * Math.cos(a), y > 0 ? this.sheerAt(z) * Math.pow(Math.min(1, y / R), 0.55) * out : (y / R) * this.form.draft, z);
  }
  /** The gunwale's height at z (the hull's sheer line). */
  sheerAt(z) { const s = this.form.sheer, t = z / (this.form.length * 0.5); return s[0] + s[1] * Math.max(0, t) ** 2 + s[2] * Math.max(0, -t) ** 2; }

  /** Per frame, as the sloop's: sail hoisted, heel, the wind's side, the drive's glow, time. */
  set({ sail = 1, heel = 0, side = 1, glow = 0.6, t = 0 } = {}) {
    this.body.rotation.z = heel;
    for (const s of this.sails) {
      const u = s.mat.userData.u; u.uFill.value = sail; u.uSide.value = s.jib ? side : -1; u.uT.value = t;
      s.mesh.scale.y = 0.08 + 0.92 * sail;
      if (!s.jib) s.mesh.rotation.y = Math.PI / 2 + side * 0.22 * sail; // (the yards braced round to the wind)
    }
    this.pennant.rotation.y = Math.PI / 2 + side * 0.6 + Math.sin(t * 6) * 0.08;
    this.mouth.opacity = 0.35 + 0.6 * glow; this.keelMat.opacity = 0.12 + 0.35 * glow;
    this.kiln.color.setRGB(1, 0.55 + 0.2 * Math.sin(t * 3), 0.3).multiplyScalar(0.6 + 0.4 * glow);
  }
  polarity(hex) { _pc.setHex(hex); this.mouth.color.copy(_pc); this.keelMat.color.copy(_pc); }
  hurt(k) { Sloop.prototype.hurt.call(this, k); }
  hoist(medal) { Sloop.prototype.hoist.call(this, medal); }
  dispose() { this.group.parent?.remove(this.group); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.(); }
}
const _pc = new THREE.Color();

/** The look of a hull by its class: the sloop's own, or one of the four here. */
export function shipLook(id, opts = {}) {
  if (SHIP_FORMS[id]) { const s = new ShipClassLook(id, opts); return s; }
  const s = new Sloop(opts); s.length = SLOOP.length; s.beam = SLOOP.beam; return s;
}
