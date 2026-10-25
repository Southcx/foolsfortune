// ---------------------------------------------------------------------------------------
// THE CRADLE'S LOOK (docs/plans/HANKO.md 3, 4; docs/GLOSSARY.md: a cradle, the cradle's look, a helm cradle). A cradle's body as built,
// one model for every cradle that takes the Pneuka Jar: the Shrine's threshold (vfx/shrine.js) and each ship's helm (vfx/sloop.js,
// vfx/shipclasses.js: "every crossing begins by sealing into the helm, the sloop too"). An octagonal clay body turned on the lathe, a
// round well in it at the Jar's own size (its foot is 0.27 m round: the well is 0.28), kintsugi mends across its top, a gold collar
// round the well's lip, a ring of carved pads on its top face with their lit twins, the well's seam and its halo, and four bronze
// tines round the well:
//   RESTING   the pads breathe, slow (`rest()`: you are near)
//   SEALED    (`wake()`) the seam and the pads light in the window colour (ui/theme.js), the halo fills the well, the tines close on
//             the Jar's foot; unsealed (`wake(false)`), they ease back open and go dark
// What wakes round it (a gate's circuits, a ship's drive) is its holder's; your imprint in the well is the imprint's look's
// (vfx/sealimprint.js).
//
// Lifted out of the Shrine's gate (round six's mock, Calissa's: the threshold's cradle), so the gate and the ships share one body.
// Prior art: the octagonal and round hanko (the seal lying as it is set), the Sheikah Slate's pedestals and Metroid's Chozo statues
// (the one thing you carry wakes the machine), kintsugi. Its static parts are merged (render/merge.js); its materials and its glaze
// texture are made once for every cradle, so a second cradle adds no program and no texture (its lit parts are its own materials of
// one program, since each lights alone; a shared material is never changed by one of its users: casebook rule 242).
//
//   const c = new CradleLook({ scale })   c.group (its own frame: Y up, the origin at the cradle's foot, the well's floor at seat())
//   c.wake(on = true)   c.rest(on = true)   c.update(rawDt)   c.seat() -> world point (the well's floor, where the Jar sits)
//   c.lit (its own lit materials)   c.dispose() (its geometry and lit materials; never the shared ones)
//   CRADLE_JAR (the scale at which the well is the Jar's: the default)   CRADLE_FORM (its own units)   cradleFoot(scale) (its foot's
//   radius in metres, a corner)   clayGlaze(...), rng(seed) (the gate's glaze and draw, shared with vfx/shrine.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from '../render/merge.js';
import { bakedCanvasTexture } from '../render/bakedcanvas.js';
import { THEMES, theme } from '../ui/theme.js';

/** The cradle in its own units: radius, height, the well's radius and depth (round six's). */
export const CRADLE_FORM = { R: 0.78, h: 0.5, rs: 0.37, dep: 0.13 };
/** The scale at which the well is the Pneuka Jar's (round six's well, 0.37, brought to the Jar's foot). */
export const CRADLE_JAR = 0.28 / 0.37;
/** The foot's radius at a scale, metres (a corner of the octagon: what a plinth under it must hold). */
export const cradleFoot = (scale = CRADLE_JAR) => CRADLE_FORM.R * 1.03 * scale;

export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
/** A clay glaze drawn on a canvas: its base, pools and breaks of colour, specks (the gate's clay and sill, and the cradle's). */
export function clayGlaze(base, pool, brk, speck, seed) {
  // (a baked canvas at half its 512 units, the resolution pass, 2026-10-25: a gate's clay and a cradle's well are a metre or two, and the
  // pools and specks read the same at 256; drawn again the same, from its seed, if ever asked for)
  const t = bakedCanvasTexture((x) => { const R = rng(seed);
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const px = R() * 512, py = R() * 512, r = 20 + R() * 90, g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, R() < 0.5 ? pool : brk); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.25 + R() * 0.35; x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  x.globalAlpha = 1; for (let i = 0; i < 900; i++) { x.fillStyle = R() < 0.7 ? speck : 'rgba(240,235,220,.5)'; x.fillRect(R() * 512, R() * 512, 1 + R() * 1.5, 1 + R() * 1.5); }
  }, 512, 512, { scale: 0.5 });
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

let SHARED = null; // (the static parts' materials and the glaze: made at the first cradle, shared by every one, never disposed)
const shared = () => SHARED || (SHARED = {
  body: new THREE.MeshStandardMaterial({ name: 'cradle-body', map: clayGlaze('#7a3a22', '#5a2414', '#b06a3e', '#22100a', 37), roughness: 0.55, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ name: 'cradle-gold', color: 0xd9a441, metalness: 1, roughness: 0.3 }), // (the gate's gold and groove, by look: merged with them)
  dead: new THREE.MeshStandardMaterial({ name: 'cradle-groove', color: 0x160a06, roughness: 0.95 }),
});
const V3 = THREE.Vector3, P = (x, y, z) => new V3(x, y, z);

export class CradleLook {
  constructor({ scale = CRADLE_JAR } = {}) {
    const M = shared(), g = (this.group = new THREE.Group()); g.name = 'cradle'; g.scale.setScalar(scale);
    const { R, h, rs, dep } = CRADLE_FORM, fl = h - dep, v2 = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
    // the body: the round well turned inside the octagon, its foot flared
    const pin = v2([[0, fl], [rs, fl], [rs, h - 0.005], [rs + 0.05, h + 0.035], [rs + 0.1, h + 0.036]]);
    const pout = v2([[rs + 0.075, h + 0.03], [R - 0.06, h + 0.03], [R - 0.01, h - 0.02], [R, h - 0.08], [R * 0.97, 0.12], [R * 1.02, 0.04], [R * 1.03, 0]]);
    for (const [pp, seg, ph] of [[pin, 32, 0], [pout, 8, Math.PI / 8]]) { const m = new THREE.Mesh(new THREE.LatheGeometry(pp, seg, ph), M.body); m.receiveShadow = true; g.add(m); } // (sunk in what holds it: no shadow of its own)
    for (const [a0, seed] of [[0.5, 3], [2.5, 9], [4.3, 5]]) { // (kintsugi on the octagon's top: radial mends from the lip to the edge)
      const Rn = rng(seed), pts = []; let a = a0; for (let r = rs + 0.11; r < R * 0.88; r += 0.04) { a += (Rn() - 0.5) * 0.22; pts.push(P(Math.cos(a) * r, h + 0.036, Math.sin(a) * r)); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.011, 4, false), M.gold));
    }
    { const c = new THREE.Mesh(new THREE.TorusGeometry(rs + 0.035, 0.03, 8, 48), M.gold); c.rotation.x = Math.PI / 2; c.position.y = h + 0.03; g.add(c); } // (the collar)
    const padGeo = [];
    for (let i = 0; i < 32; i++) { // (the pad ring on its top face: carved dark, and their lit twins)
      const a = i / 32 * Math.PI * 2, r = (rs + R) / 2 + 0.03, d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.075), M.dead);
      d.position.set(Math.cos(a) * r, h + 0.036, Math.sin(a) * r); d.rotation.y = -a + Math.PI / 2; g.add(d);
      d.updateMatrix(); padGeo.push(new THREE.BoxGeometry(0.035, 0.016, 0.083).applyMatrix4(d.matrix));
    }
    // the lit parts: each cradle's own materials (one program: it lights alone)
    this.pads = new THREE.Mesh(mergeGeometries(padGeo, false), new THREE.MeshBasicMaterial({ name: 'cradle-pads', color: 0xffffff, toneMapped: false, transparent: true, depthWrite: false }));
    this.pads.name = 'cradle-pads'; g.add(this.pads); padGeo.forEach((q) => q.dispose());
    this.seam = new THREE.Mesh(new THREE.TorusGeometry(rs - 0.01, 0.022, 6, 48), new THREE.MeshBasicMaterial({ name: 'cradle-seam', color: 0xffffff, toneMapped: false }));
    this.seam.name = 'cradle-seam'; this.seam.rotation.x = -Math.PI / 2; this.seam.position.y = h + 0.005; g.add(this.seam);
    this.halo = new THREE.Mesh(new THREE.CylinderGeometry(rs - 0.005, rs - 0.005, dep + 0.01, 48, 1, true), new THREE.MeshBasicMaterial({ name: 'cradle-halo', color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false, depthWrite: false }));
    this.halo.name = 'cradle-halo'; this.halo.position.y = fl + dep / 2; g.add(this.halo);
    this.lit = [this.pads.material, this.seam.material, this.halo.material];
    // the four bronze tines round the well, leaning in over it while it is empty, closing on the Jar's foot when it is sealed
    { const b = new THREE.BoxGeometry(0.035, 0.26, 0.07), tip = new THREE.SphereGeometry(0.03, 8, 6).translate(-0.04, 0.13, 0), tg = mergeGeometries([b.toNonIndexed(), tip.toNonIndexed()], false);
      this.tines = new THREE.InstancedMesh(tg, M.gold, 4); this.tines.name = 'cradle-tines'; g.add(this.tines); b.dispose(); tip.dispose(); }
    this.tineAt = []; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; this.tineAt.push({ p: P(Math.cos(a) * (rs + 0.07), h + 0.03 + 0.12, Math.sin(a) * (rs + 0.07)), a }); }
    mergeStatic(g); // (the body, the gold, the carved pads: one draw each; the lit parts are named, so kept)

    this.k = { rest: 0, lit: 0, tine: 0 }; this.awake = false; this.resting = false; this.t = 0; this.ink = null;
    this.tinePose(0); this.colours(); this.update(0);
  }

  /** Sealed (the tines close, the seam, pads and halo light), or unsealed (`false`: they open and go dark). */
  wake(on = true) { this.awake = !!on; }
  /** You are near (a Shrine's rest): the pads breathe. */
  rest(on = true) { this.resting = !!on; }

  /** The well's floor, where the Jar sits: world space, from the group as it now stands. */
  seat() { this.group.updateWorldMatrix(true, false); return this.group.localToWorld(P(0, CRADLE_FORM.h - CRADLE_FORM.dep, 0)); }

  /** The window colour on the lit parts, set again when it changes. */
  colours() {
    if (this.ink === theme.id) return; this.ink = theme.id;
    const T = THEMES[theme.id] || THEMES.kiln;
    this.inkSel = new THREE.Color(`rgb(${T.sel})`); this.inkHi = new THREE.Color(T.hi); this.seam.material.color.copy(this.inkHi).multiplyScalar(2.2); this.halo.material.color.copy(this.inkSel);
  }

  tinePose(k) { // k: 0 open (leaning in over the empty well), 1 closed on the Jar's foot
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new V3(1, 1, 1);
    this.tineAt.forEach(({ p, a }, i) => { e.set(0, -a, 0.85 + (0.32 - 0.85) * k, 'YXZ'); q.setFromEuler(e); this.tines.setMatrixAt(i, m.compose(p, q, one)); });
    this.tines.instanceMatrix.needsUpdate = true;
  }

  update(raw = 1 / 60) {
    this.t += raw; this.colours();
    const K = this.k, ease = (k, to, r) => k + (to - k) * (1 - Math.exp(-raw * r)), breath = 0.75 + 0.25 * Math.sin(this.t * 1.3);
    K.rest = ease(K.rest, this.resting ? 1 : 0, 2);
    K.lit = ease(K.lit, this.awake ? 1 : 0, this.awake ? 9 : 3); const tine = ease(K.tine, this.awake ? 1 : 0, 6);
    if (Math.abs(tine - K.tine) > 1e-4) { K.tine = tine; this.tinePose(tine); }
    const pads = Math.max(K.lit, 0.35 * K.rest * breath);
    this.pads.visible = pads > 0.01; this.pads.material.color.copy(this.inkSel).multiplyScalar(0.5 + 1.8 * pads); this.pads.material.opacity = Math.min(1, pads * 1.4);
    this.seam.visible = this.halo.visible = K.lit > 0.01 || K.rest > 0.05; this.halo.material.opacity = 0.75 * Math.max(K.lit, 0.3 * K.rest * breath);
    this.seam.material.color.copy(this.inkHi).multiplyScalar(0.4 + 1.8 * Math.max(K.lit, 0.3 * K.rest * breath));
  }

  dispose() {
    this.group.removeFromParent();
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const m of this.lit) m.dispose();
    this.tines.dispose();
  }
}
