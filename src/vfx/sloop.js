// ---------------------------------------------------------------------------------------
// THE SLOOP: the Vessoul's ship form for the Emocean (docs/GLOSSARY.md: the Vessoul, ship; docs/plans/SLICE.md, E4). One being with the
// god hand, the Pneuka Jar and the Courier, so it is made the way they are made: THE JAR LAID ON ITS SIDE. Its hull is the Pneuka Jar's
// own silhouette turned on a wheel (a lathe: foot, belly, shoulder, neck, lip) and cut at the waterline, so the throwing rings wrap the
// hull, the foot is the bow and the jar's open mouth is the stern, glowing with the Lachryma that drives it. Terracotta, fired, mended:
// the chest's kintsugi seams in its clay (vfx/chestglaze.js, at a ship's scale). A sloop's rig, true to the word: one mast, a mainsail
// on a boom and a jib to the bowsprit, the sails cream with the owner's wife's lotus in gold (src/assets/vfx/tex/circle_lotus); the
// Solar Skiff's green mast, gold fittings and swallowtail pennant (courier/skiff/boat.js), because the skiff is its limb.
//
// Prior art: the Pneuka Jar (the Courier's own vessel), Wind Waker's King of Red Lions (the skiff's model: a boat with a face and a
// cel-cream sail), the real sloop's rig (a fore-and-aft mainsail and one headsail on a single mast), Hokusai's and the Tang potters'
// boats-as-vessels, and kintsugi again. Built from primitives and merged (render/merge.js), no file loaded: a model for the slice that
// the owner's own can replace.
//
//   const s = new Sloop({ env })   scene.add(s.group)   s.set({ sail 0..1, heel rad, side -1|1, glow 0..1, t })   s.dispose()
//   (its own frame: +Z the bow, Y up, origin at the waterline amidships; about 7 m long)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { dressChestGlaze, chestGlazeUniforms } from './chestglaze.js';
import { vfxTexture } from './vfx.js';
import { mergeStatic } from '../render/merge.js';
import { addOutline } from '../render/outline.js';

export const SLOOP = { length: 7, beam: 2.4, draft: 0.9, mast: { z: 1.1, h: 7.6 }, boom: { y: 1.7, len: 4.2 }, bowsprit: 1.4 };
const C = { clay: 0xb5532d, bisque: 0xf1d9b6, gold: 0xf2c14e, mast: 0x3f7a58, sail: 0xf6e6c8, dark: 0x4a2a1e, lach: 0xffc65c };

// the Pneuka Jar's profile, foot to lip (fraction of the length, fraction of the belly's radius): the hull is this turned and laid down
const JAR = [[0, 0], [0.03, 0.34], [0.1, 0.66], [0.24, 0.93], [0.4, 1], [0.58, 0.95], [0.74, 0.78], [0.84, 0.6], [0.9, 0.5], [0.95, 0.54], [1, 0.6]];

/** The hull: the jar's silhouette turned (rings round the girth), laid along Z, squashed to a hull's depth and cut at the waterline. */
function hullGeometry() {
  const { length: L, beam, draft } = SLOOP, R = beam / 2;
  const pts = JAR.map(([u, r]) => new THREE.Vector2(Math.max(0.001, r * R), u * L - L * 0.5));
  // (the throwing rings: a small ripple in the profile, as a thrown pot keeps the marks of the fingers)
  const ringed = [];
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 4; k++) { const p = pts[i].clone().lerp(pts[i + 1], k / 4); p.x *= 1 + 0.018 * Math.sin((i * 4 + k) * 1.9); ringed.push(p); }
  ringed.push(pts[pts.length - 1]);
  const g = new THREE.LatheGeometry(ringed, 28);
  g.rotateX(Math.PI / 2); g.rotateY(Math.PI); // (the lathe's axis laid along Z: the foot at +Z, the bow)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i); const t = p.getZ(i) / (L * 0.5); // (t: -1 the stern's lip .. +1 the bow's foot)
    const sheer = 0.55 + 0.4 * Math.max(0, t) ** 2 + 0.18 * Math.max(0, -t) ** 2; // (the freeboard, rising to the bow and a little to the stern: a sheer line)
    y = y > 0 ? sheer * Math.pow(Math.min(1, y / R), 0.55) : (y / R) * draft;
    p.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

/** The deck: the hull's outline at the gunwale, filled. */
function deckGeometry() {
  const { length: L, beam } = SLOOP, R = beam / 2;
  const half = JAR.map(([u, r]) => [r * R * 0.92, L * 0.5 - u * L]);
  const s = new THREE.Shape();
  s.moveTo(0, half[0][1]);
  for (const [x, z] of half) s.lineTo(x, z);
  for (let i = half.length - 1; i >= 0; i--) s.lineTo(-half[i][0], half[i][1]);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(Math.PI / 2); g.translate(0, 0.42, 0);
  return g;
}

/** A sail: a grid between its corners (luff along the mast, foot along the boom), with a belly the vertex shader fills. */
function sailMaterial(lotus) {
  const u = { uFill: { value: 0.6 }, uSide: { value: 1 }, uLotus: { value: lotus }, uT: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ color: C.sail, roughness: 0.9, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uFill, uSide, uT; varying vec2 vSailUv;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vSailUv = uv;
float belly = sin(uv.x * 3.14159) * sin(uv.y * 3.14159 * 0.92 + 0.12); // (fullest a third of the way back, low: a real sail's draft)
transformed.x += uSide * uFill * belly * 0.55 + sin(uT * 3.0 + uv.y * 4.0) * 0.012 * uv.x;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uLotus; varying vec2 vSailUv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec2 q = (vSailUv - vec2(0.42, 0.5)) / vec2(0.62, 0.5) + 0.5; float a = all(greaterThan(q, vec2(0.0))) && all(lessThan(q, vec2(1.0))) ? texture2D(uLotus, q).a : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.89, 0.6, 0.18), a * 0.85); }`);
  };
  m.customProgramCacheKey = () => 'sloop-sail';
  m.userData.u = u;
  return m;
}

export class Sloop {
  constructor({ env = null } = {}) {
    const S = SLOOP;
    this.group = new THREE.Group();
    this.body = new THREE.Group(); this.group.add(this.body); // (the hull and everything fixed to it: heels as one)
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true, ...o }));
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => { track(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); if (outline) addOutline(m); return m; };

    // the hull: fired terracotta, mended with gold here and there (the chest's net, a ship's size)
    const clay = std(C.clay, { roughness: 0.55, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.25 });
    this.glaze = chestGlazeUniforms(0.22); this.glaze.uGlaze.value = 3.45;
    dressChestGlaze(clay, this.glaze, { goldOnly: true });
    add(this.body, hullGeometry(), clay);
    add(this.body, deckGeometry(), std(C.bisque, { roughness: 0.85 }), 0, 0, 0, false);
    // the jar's lip at the stern: a rim, and inside it the Lachryma that drives it, glowing
    const lipZ = -S.length * 0.5;
    const rim = new THREE.TorusGeometry(S.beam * 0.3, 0.07, 6, 24); add(this.body, rim, std(C.clay), 0, 0.25, lipZ + 0.05);
    this.mouth = new THREE.MeshBasicMaterial({ color: C.lach, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    add(this.body, new THREE.CircleGeometry(S.beam * 0.28, 24), track(this.mouth), 0, 0.25, lipZ + 0.06, false).rotation.y = Math.PI;
    // a gold band round the shoulder (the jar's), the figurehead: a little jar at the foot, its own lid gold
    const band = new THREE.TorusGeometry(1, 0.035, 5, 32); const b = add(this.body, band, std(C.gold, { metalness: 0.6, roughness: 0.35, envMap: env }), 0, 0.4, -S.length * 0.24, false); b.scale.set(S.beam * 0.47, 1, 1); b.rotation.x = Math.PI / 2;
    const jar = new THREE.LatheGeometry(JAR.map(([u, r]) => new THREE.Vector2(Math.max(0.001, r * 0.18), u * 0.5)), 12);
    add(this.body, jar, std(C.clay), 0, 0.85, S.length * 0.5 - 0.05).rotation.x = -0.5;
    add(this.body, new THREE.IcosahedronGeometry(0.1, 0), std(C.gold, { emissive: 0x4a3200, emissiveIntensity: 0.4 }), 0, 1.3, S.length * 0.5 + 0.18);
    // the deckhouse: a little kiln (the Courier's maker's), its mouth lit
    const dome = new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); add(this.body, dome, std(C.clay, { roughness: 0.7 }), 0, 0.42, -1.6);
    this.kiln = track(new THREE.MeshBasicMaterial({ color: 0xffa860 }));
    add(this.body, new THREE.CircleGeometry(0.2, 12, 0, Math.PI), this.kiln, 0, 0.44, -1.0, false);
    // the gun mount at the bow (the psygun is its gun: Petra's to fit)
    add(this.body, new THREE.CylinderGeometry(0.22, 0.28, 0.2, 8), std(C.dark), 0, 0.55, S.length * 0.3);
    this.gunAt = new THREE.Object3D(); this.gunAt.position.set(0, 0.75, S.length * 0.3); this.body.add(this.gunAt);
    // the rig: the skiff's green mast, a gold boom and bowsprit
    const mastMat = std(C.mast); add(this.body, new THREE.CylinderGeometry(0.06, 0.09, S.mast.h, 6), mastMat, 0, S.mast.h / 2, S.mast.z);
    add(this.body, new THREE.CylinderGeometry(0.04, 0.04, S.bowsprit, 6), std(C.gold), 0, 0.95, S.length * 0.5 + S.bowsprit * 0.4).rotation.x = Math.PI / 2 - 0.15;
    this.boom = new THREE.Group(); this.boom.position.set(0, S.boom.y, S.mast.z); this.body.add(this.boom);
    add(this.boom, new THREE.CylinderGeometry(0.04, 0.04, S.boom.len, 6), std(C.gold), 0, 0, -S.boom.len / 2).rotation.x = Math.PI / 2;
    // the sails, cream, the lotus on the main
    const lotus = vfxTexture('circle_lotus');
    this.sail = sailMaterial(lotus); track(this.sail);
    this.jibMat = sailMaterial(null); this.jibMat.userData.u.uLotus.value = new THREE.DataTexture(new Uint8Array(4), 1, 1); track(this.jibMat);
    const mainH = S.mast.h - S.boom.y - 0.5;
    const main = new THREE.PlaneGeometry(1, 1, 10, 12); main.translate(0.5, 0.5, 0);
    const mp = main.attributes.position;
    for (let i = 0; i < mp.count; i++) { const u = mp.getX(i), v = mp.getY(i); mp.setXYZ(i, 0, v * mainH, -u * S.boom.len * (1 - 0.72 * v)); } // (the luff up the mast, the foot along the boom, a roach that narrows to the head)
    main.computeVertexNormals();
    this.mainMesh = add(this.boom, main, this.sail, 0, 0.05, 0, false);
    const jib = new THREE.PlaneGeometry(1, 1, 8, 10); jib.translate(0.5, 0.5, 0);
    const jp = jib.attributes.position, jibTop = S.mast.h * 0.86, tackZ = S.length * 0.5 + S.bowsprit * 0.75 - S.mast.z;
    for (let i = 0; i < jp.count; i++) { const u = jp.getX(i), v = jp.getY(i); jp.setXYZ(i, 0, 0.4 + v * (jibTop - 0.4) * (1 - u * 0.0), tackZ * (1 - v) - u * (1 - v) * 1.6); }
    jib.computeVertexNormals();
    this.jibMesh = add(this.body, jib, this.jibMat, 0, 0, S.mast.z, false);
    // the pennant at the masthead: the skiff's red swallowtail
    const pen = new THREE.PlaneGeometry(1.4, 0.24, 12, 1); pen.translate(-0.7, 0, 0);
    this.pennant = add(this.body, pen, std(0xc2432b, { emissive: 0x6a1a10, emissiveIntensity: 0.25, side: THREE.DoubleSide, flatShading: false }), 0, S.mast.h - 0.1, S.mast.z, false);
    this.pennant.rotation.y = Math.PI / 2;
    // the Lachryma it rides on: a glow under the keel (the Emocean is an atmosphere of it)
    this.keelMat = track(new THREE.MeshBasicMaterial({ color: C.lach, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const keel = add(this.group, new THREE.CircleGeometry(1, 24), this.keelMat, 0, -S.draft - 0.05, 0, false); keel.rotation.x = -Math.PI / 2; keel.scale.set(S.beam * 0.6, S.length * 0.45, 1);
    // what never moves on its own is one mesh a material (the boom and the sails swing; the pennant streams)
    mergeStatic(this.body, { keep: new Set([this.boom, this.jibMesh, this.pennant, this.gunAt]) });
    this.set({});
  }

  /** Per frame: sail hoisted (0 furled .. 1 full), how far it heels, which side the wind fills it from, the drive's glow, and time. */
  set({ sail = 1, heel = 0, side = 1, glow = 0.6, t = 0 } = {}) {
    const S = SLOOP;
    this.body.rotation.z = heel;
    this.boom.rotation.y = side * (0.35 + 0.25 * sail);
    for (const m of [this.sail, this.jibMat]) { const u = m.userData.u; u.uFill.value = sail; u.uSide.value = side; u.uT.value = t; }
    this.mainMesh.scale.y = 0.08 + 0.92 * sail; this.jibMesh.scale.set(1, 0.08 + 0.92 * sail, 1); // (furled: a bundle on the boom)
    this.jibMesh.rotation.y = side * 0.18 * sail;
    this.pennant.rotation.y = Math.PI / 2 + side * 0.6 + Math.sin(t * 6) * 0.08;
    this.mouth.opacity = 0.35 + 0.6 * glow; this.keelMat.opacity = 0.12 + 0.35 * glow;
    this.kiln.color.setRGB(1, 0.55 + 0.2 * Math.sin(t * 3), 0.3).multiplyScalar(0.6 + 0.4 * glow);
    void S;
  }

  dispose() { this.group.parent?.remove(this.group); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.(); }
}
