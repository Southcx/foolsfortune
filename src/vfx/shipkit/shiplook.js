// ---------------------------------------------------------------------------------------
// A SHIP'S LOOK: what every class of the Vessoul's ship form is built on (the sloop: vfx/sloop.js; the frigate, destroyer, galleon and
// tanker: vfx/shipclasses.js). A class is a SPEC (its numbers, its static parts written into the mesher, its rig as data); this turns
// it into the look the game drives, the API every caller already has (courier/ship/ship.js, vfx/mooring.js, world/opensea/helm.js,
// vfx/encounters/tableaux.js, the workbench): one static mesh in the hull's material (shipkit/hullmaterial.js, outlined, the only
// shadow caster with the vanes), the rig and its vanes (shipkit/rig.js), the helm's cradles in their cores (shipkit/core.js,
// vfx/cradlelook.js), the engines' glow and the keel's light (additive: their program the game's own), the pennant the tally is
// hoisted on. The look Calissa named for it: SEA-GOING STARSHIPS OF THE AGE OF SAIL.
// THE MAST FOLD (RAIL-SHIPS-SCIFI.md 4): `set({ form, roll })` each frame (form 'astral' | 'umbral', roll 0..1 through the barrel roll,
// 0 when not rolling) or `fold(u)` to force it (null lets go). Not given a form, the rig stays out: nothing changes until it is wired.
// The core's crystals and the keel take the ship's feeling: `feeling(hex)` (the rail's older name for it is the classes' alias), and every frame the keel's colour as the rail tints it.
// Prior art: as each part's module says; the shared-kit way of every console-era vehicle roster (one material, one rig, data a class).
//
//   new ShipLook(spec, { env })   .group .body .length .beam .keelMat .mouth .gunAt .helmCradles .helmCradle .rig .hullMat .sail
//   .set({ sail, heel, side, glow, t, form, roll })   .fold(u | null)   .feeling(hex)   .hurt(k)   .scars({ open, gilt })   .hoist(medal)
//   .helmCradleSpots()   .helmWake(on, i)   .helmTick(t)   .dispose()   .stats() -> { tris, draws }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Mesher } from './hullkit.js';
import { hullMaterial } from './hullmaterial.js';
import { sailMaterial, FURL } from './vane.js';
import { Rig, FoldDrive } from './rig.js';
import { writeCore } from './core.js';
import { vfxTexture } from '../vfx.js';
import { addOutline } from '../../render/outline.js';
import { keepTrue } from '../stormwarp.js';
import { causticsOn } from '../umbral.js';
import { CradleLook, cradleFoot } from '../cradlelook.js';

let blank = null; // (a 1x1 clear texture: the vanes with no lotus; made once, never disposed)
const blankTex = () => (blank ||= new THREE.DataTexture(new Uint8Array(4), 1, 1));

export class ShipLook {
  constructor(spec, { env = null } = {}) {
    this.spec = spec; this.id = spec.id; this.length = spec.length; this.beam = spec.beam;
    this.group = new THREE.Group(); this.body = new THREE.Group(); this.group.add(this.body);
    this.group.name = `ship-${spec.id}`;
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    // the hull and all that is bolted to it: one mesh
    this.hullMat = track(hullMaterial({ env, panel: spec.panel ?? 0.9 }));
    const M = new Mesher(), wrote = spec.write(M, this) || {}, engines = wrote.engines ?? spec.engines ?? [];
    const foot = cradleFoot();
    for (const [i, h] of (spec.helm || []).entries()) writeCore(M, { at: h, r: foot, seed: i + 1, ...spec.core });
    const hull = this.hullMesh = new THREE.Mesh(track(M.geometry()), this.hullMat); hull.name = 'ship-hull'; hull.castShadow = true; hull.receiveShadow = true;
    this.body.add(hull); addOutline(hull);
    // the rig and its vanes
    const V = spec.vane || {};
    this.sail = spec.rig?.vanes?.length ? track(sailMaterial(V.lotus ? vfxTexture('circle_lotus') : blankTex(), { vane: true, fill: V.fill, edge: V.edge, fillA: V.fillA })) : null;
    if (spec.rig?.masts?.length) {
      this.rig = new Rig({ ...spec.rig, hull: this.hullMat, sail: this.sail });
      this.body.add(this.rig.mesh); addOutline(this.rig.mesh); track(this.rig.mesh.geometry);
      if (this.rig.vaneMesh) { this.body.add(this.rig.vaneMesh); track(this.rig.vaneMesh.geometry); }
    } else this.rig = null;
    // the helm: the cradle (the galleon's two) sat in its core, sealed into at the pier (HANKO.md 4)
    this.helmCradles = (spec.helm || []).map(([x, y, z]) => { const c = new CradleLook(); c.group.position.set(x, y, z); this.body.add(c.group); return c; });
    this.helmCradle = this.helmCradles[0];
    // the engines' glow: discs facing aft (the class's own colour; `mouth` for the API's old name), the keel's light under it all
    this.mouth = track(new THREE.MeshBasicMaterial({ color: spec.engineGlow ?? 0xcfe8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true }));
    const discs = engines.map(({ at, r, face = -1 }) => { const g = new THREE.CircleGeometry(r, 16); g.rotateY(face < 0 ? Math.PI : 0); g.translate(at[0], at[1], at[2] + face * 0.012); return g; });
    if (discs.length) {
      const all = new THREE.BufferGeometry(); const n = discs.reduce((k, g) => k + g.index.count, 0), p = new Float32Array(n * 3); let o = 0;
      for (const g of discs) { const q = g.toNonIndexed(); p.set(q.attributes.position.array, o); o += q.attributes.position.array.length; q.dispose(); g.dispose(); }
      all.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const m = new THREE.Mesh(track(all), this.mouth); m.name = 'ship-engines'; this.body.add(m);
    }
    this.keelMat = track(new THREE.MeshBasicMaterial({ color: 0xffc65c, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const keel = new THREE.Mesh(track(new THREE.CircleGeometry(1, 24)), this.keelMat); keel.name = 'ship-keel';
    keel.position.y = -(spec.draft ?? 0.6) - 0.05; keel.rotation.x = -Math.PI / 2; keel.scale.set(spec.beam * 0.6, spec.length * 0.45, 1); this.group.add(keel);
    // the pennant: a red streamer at the masthead (the tally's: `hoist`)
    const pen = track(new THREE.PlaneGeometry(1.4, 0.24, 12, 1)); pen.translate(-0.7, 0, 0);
    this.pennant = new THREE.Mesh(pen, track(new THREE.MeshStandardMaterial({ color: 0xc2432b, emissive: 0x6a1a10, emissiveIntensity: 0.25, side: THREE.DoubleSide, roughness: 0.6 })));
    this.pennant.name = 'ship-pennant'; this.pennant.scale.setScalar(spec.pennantScale ?? 1); this.body.add(this.pennant);
    // the gun (the psygun's mount: the rail fires from here)
    this.gunAt = new THREE.Object3D(); this.gunAt.position.set(...(spec.gun || [0, 0.8, spec.length * 0.3])); this.body.add(this.gunAt);
    // the Umbral's caustics over the hull (their overlay lies only on an opaque host: the hull is turned transparent after)
    this.hullMat.transparent = false; causticsOn(this.hullMesh); this.hullMat.transparent = true;
    for (const m of this.mats) keepTrue(m); // (the storm's veil leaves the ship's glows where they are drawn: vfx/stormwarp.js)
    for (const c of this.helmCradles) for (const m of c.lit) keepTrue(m);
    this.drive = new FoldDrive({ dives: !!spec.dives });
    this.set({});
  }

  /** Per frame: sail hoisted (0 .. FURL stowed: the vanes go out like a lamp, the masts stand bare), heel, the wind's side, the drive's
   *  glow, time; and the fold's inputs, `form` and `roll` (see the header). */
  set({ sail = 1, heel = 0, side = 1, glow = 0.6, t = 0, form, roll = 0 } = {}) {
    this.body.rotation.z = heel;
    const furled = sail <= FURL, st = this.drive.step({ form, roll, t });
    this.foldU = st.u;
    if (this.rig) {
      this.rig.pose({ u: st.u, hatch: st.hatch, sail: furled ? 1 : sail, side: side < 0 ? -1 : 1 });
      if (this.rig.vaneMesh) this.rig.vaneMesh.visible = !furled && st.u < 0.995;
      const P = this.spec.pennant ?? { mast: 0 }; this.rig.topOf(P.mast, this.pennant.position); this.pennant.position.y += 0.05;
    } else if (this.spec.pennant?.at) this.pennant.position.set(...this.spec.pennant.at);
    this.pennant.visible = st.u < 0.6 || !!this.spec.pennant?.at;
    this.pennant.rotation.y = Math.PI / 2 + (side < 0 ? -1 : 1) * 0.6 + Math.sin(t * 6) * 0.08;
    if (this.sail) { const u = this.sail.userData.u; u.uFill.value = furled ? 0 : sail; u.uSide.value = 1; u.uT.value = t; }
    this.mouth.opacity = 0.35 + 0.6 * glow; this.keelMat.opacity = 0.12 + 0.35 * glow;
    const hu = this.hullMat.userData.u; hu.uFeel.value.copy(this.keelMat.color); hu.uFeelK.value = 0.55 + 0.6 * glow; // (the core lit in the ship's feeling, as the rail tints the keel)
    this.helmTick(t);
  }

  /** The mast fold forced to u (0 out .. 1 stowed; the hatch follows on a hull that dives), or let go (null) to the form and the roll. */
  fold(u) { this.drive.forced = u == null ? null : THREE.MathUtils.clamp(u, 0, 1); return this; }

  /** The helm's cradles eased on by the time `set` is given. */
  helmTick(t) {
    const raw = this.helmT == null ? 0 : THREE.MathUtils.clamp(t - this.helmT, 0, 0.1); this.helmT = t;
    for (const c of this.helmCradles) c.update(raw);
  }
  /** Each helm cradle's well floor, world space (where the Pneuka Jar sits). */
  helmCradleSpots() { return this.helmCradles.map((c) => c.seat()); }
  /** The helm's cradle `i` sealed (the tines close, it lights in the window colour) or unsealed (false). */
  helmWake(on = true, i = 0) { this.helmCradles[i]?.wake(on); }

  /** The ship's feeling (the crossing: your draught or its opposite, by form): the keel's light and the core's crystals take it. */
  feeling(hex) { _pc.setHex(hex); this.keelMat.color.copy(_pc); this.hullMat.userData.u.uFeel.value.copy(_pc); }

  /** After a hit: k 0..1; the whole ship half-clear and lit from within, at 0 exactly as it was. */
  hurt(k) {
    if (Math.abs(k - (this.hurtK ?? 0)) < 1e-3) return; this.hurtK = k;
    for (const m of this.mats) {
      if (!m.isMeshStandardMaterial && !m.isMeshLambertMaterial) continue; // (the sails and vanes are Lambert: vfx/matte.js)
      const b = (m.userData.hurtBase ||= { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, em: m.emissive.clone(), emI: m.emissiveIntensity });
      m.transparent = b.transparent || k > 0.01; m.opacity = b.opacity * (1 - 0.45 * k); m.depthWrite = k > 0.01 ? false : b.depthWrite;
      m.emissive.copy(b.em).lerp(_pc.setRGB(0.85, 0.9, 1.0), 0.5 * k); m.emissiveIntensity = b.emI + 0.6 * k;
    }
  }

  /** The hull's scars carried leg to leg (PASSAGE.md 14.1): `open` 0..1 the seams widened dark with the crude's violet, `gilt` 0..1
   *  the seams caulked gold. At 0 and 0 the hull is as it was. */
  scars({ open = 0, gilt = 0 } = {}) { const u = this.hullMat.userData.u; u.uOpen.value = THREE.MathUtils.clamp(open, 0, 1); u.uGilt.value = THREE.MathUtils.clamp(gilt, 0, 1); }

  /** The tally: the medal run up the masthead as the pennant's colour. */
  hoist(medal) {
    const col = { none: 0xc2432b, bronze: 0xb0703a, silver: 0xd8dde6, gold: 0xf2c84a, platinum: 0xe8f4ff }[medal] ?? 0xc2432b;
    const m = this.pennant.material; m.color.setHex(col); m.emissive.setHex(col).multiplyScalar(0.35); m.emissiveIntensity = medal && medal !== 'none' ? 0.8 : 0.25;
    this.pennant.scale.setScalar((this.spec.pennantScale ?? 1) * (medal && medal !== 'none' ? 1.6 : 1));
  }

  /** Its cost as drawn now: triangles and draws (outlines counted; the caustics' overlay is the Umbral's only). */
  stats() {
    let tris = 0, draws = 0;
    this.group.traverseVisible((o) => { if (!o.isMesh || o.userData.caustics) return; draws++; const g = o.geometry; tris += ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1); });
    return { tris: Math.round(tris), draws };
  }

  dispose() {
    this.group.parent?.remove(this.group);
    for (const g of this.geos) g.dispose?.(); for (const m of this.mats) m.dispose?.();
    for (const c of this.helmCradles) c.dispose(); // (the cradles' shared materials stay)
  }
}
const _pc = new THREE.Color();
