// ---------------------------------------------------------------------------------------
// THE JAR'S LOOK (plain name; the owner, 2026-10-24): the Pneuka Jar, the Courier's true form, dressed as the Courier is and then some.
// One Jar model serves the god hand and the Spirit Garden (godhand/jar.js `god.jar.group`; world/garden/realm.js shows it while
// `realm.jarBody` moves it), so dressing it once dresses both; a guest's Pneuka Jar takes the same materials (vfx/garden/guestjars.js).
//
//   THE VESSEL'S LOOKS  the kiln's glazes, region to part (vfx/pneukajar/dress.js), read live: a firing at the kiln shows on the Jar the
//                       next time it is drawn; the kintsugi's cracks and gold on the vessel's own uniforms; the soul colour as its light
//   THE JAR'S OWN       its lid, handles, shape, foot, a pendant off the choker and what bursts from its foot when it hops
//                       (vfx/pneukajar/table.js JAR_LOOK; geometry vfx/pneukajar/parts.js; the shape a morph of the owner's own
//                       vertices, vfx/pneukajar/shape.js), the bracelet's choker moved to where the neck went (vfx/braceletwear.js)
//   YOUR SEAL           on its base (HANKO.md 5: the Jar's base is your seal), drawn by vfx/sealface.js, mirrored as a carving is
//
// Kept with the player's progress (save section `jarLook`, scope player: like the vessel's look, a look chosen from what play opens, and
// play's opens reset with each build; the seal, carved once ever, stays in settings, world/cradles.js). DEBUG wears any with `/jar`.
// Nothing here emits: a look changes nothing that happened (the command's own line is the reply).
//
// Prior art: the guest's Pneuka Jar (fired in a glaze: this repo), the glaze test tile, Animal Crossing's and Splatoon's parts on one
// body, FFXIV's glamour (a look apart from power), a pendant's swing as a damped pendulum (Hooke's spring on two angles).
//
//   game.pneukaJarLook = new PneukaJarLook(game)   .update(rawDt)   .look (JAR_LOOK ids by slot)   .set(slot, id)   .wear(look)
//   .materials (dress.js JarMaterials)   .prewarm() -> park()   (built in main.js after the bracelets)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { JAR_LOOK, JAR_SLOTS, DEFAULT_JAR, validJar } from './table.js';
import { jarMorph, morphGeometry, partition, seamPhase, regionAt, JAR_ANATOMY as A } from './shape.js';
import { jarParts, pendantParts } from './parts.js';
import { JarMaterials } from './dress.js';
import { jarBurst } from './burst.js';
import { DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { addOutline } from '../../render/outline.js';
import { drawSealFace } from '../sealface.js';

const SWING = { k: 60, damp: 5, push: 0.06, max: 0.6 }; // (the pendant's pendulum: 1/s² spring, 1/s damping, rad a m/s² of the Jar's acceleration, rad at most)

export class PneukaJarLook {
  constructor(game) {
    this.game = game; this.look = { ...DEFAULT_JAR }; this.key = null; this.parts = []; this.pendant = []; this.swing = { x: 0, z: 0, vx: 0, vz: 0 };
    this.vel = new THREE.Vector3(); this.lastPos = null; this.burst = (kind, k, obj) => jarBurst(game, this, kind, k, obj);
    game.save?.section('jarLook', { scope: 'player', version: 1, dump: () => ({ ...this.look }), load: (s) => { this.look = validJar(s); this.key = null; }, reset: () => { this.look = { ...DEFAULT_JAR }; this.key = null; } });
    game.chat?.add('jar', { debug: true, help: `the Pneuka Jar's own look (DEBUG): /jar lists; /jar <slot> <id> (${JAR_SLOTS.join(', ')}); /jar random; /jar reset`, run: (args) => this.command(args) });
    this.attach(game.god?.jar);
  }

  /** Take the god hand's Jar over: its body cut into the kiln's regions, its gems the stones, the materials the vessel's. */
  attach(jar) {
    if (!jar?.jarBody || this.jar) return;
    this.jar = jar; const body = jar.jarBody;
    jar.group.traverse((o) => { if (o.isSkinnedMesh && o.material === jar.coreMat) this.core = o; });
    partition(body.geometry); regions(body.geometry); if (this.core) regions(this.core.geometry);
    this.phase = seamPhase(body.geometry);
    this.materials = new JarMaterials(jar.jarMat.map, this.game.vessel?.kinU, this.game.vessel?.soul);
    const M = this.materials.m;
    body.material = [M.body, M.trim, M.mask];
    if (this.core) this.core.material = M.stones;
  }

  /** The warm-up: the look applied once and the Jar shown 50 m down for the compile, so its program is never built in play. */
  prewarm() {
    const grp = this.jar?.group; if (!grp) return () => {};
    this.update(0);
    const was = { v: grp.visible, p: grp.position.clone(), z: grp.userData.zoneFree };
    grp.visible = true; grp.position.set(0, -50, 0); grp.userData.zoneFree = true;
    return () => { grp.visible = was.v; grp.position.copy(was.p); grp.userData.zoneFree = was.z; };
  }

  /** Open to wear: the owner's Jar as made, anything in the DEBUG save, or what Dovina's rule opens (progress/cosmetics.js, through main.js's game.cosmeticOpen). */
  isOpen(slot, id) {
    return id === DEFAULT_JAR[slot] || this.game.mode === 'debug' || this.game.cosmeticOpen?.('jar', `${slot}.${id}`) === true;
  }
  /** One slot set (an id the table knows, and open); false if not. */
  set(slot, id) {
    if (!JAR_LOOK[slot]?.options[id] || !this.isOpen(slot, id)) return false;
    this.look[slot] = id; this.game.save?.dirty('jarLook'); return true;
  }
  /** A whole look worn at once (unknown ids fall back to the owner's). */
  wear(look) { this.look = validJar({ ...this.look, ...look }); this.game.save?.dirty('jarLook'); }

  command(args) {
    const g = this.game, say = (t) => g.log?.say('info', t, { key: 'jar.cmd', throttle: 0 });
    const [slot, id] = args.map((a) => String(a).toLowerCase());
    if (!slot) { say(`The Pneuka Jar wears: ${JAR_SLOTS.map((s) => `${s} ${this.look[s]}`).join(', ')}.`); return; }
    if (slot === 'reset') { this.wear(DEFAULT_JAR); say('The Pneuka Jar is as the Prince made it.'); return; }
    if (slot === 'random') { const ids = (s) => Object.keys(JAR_LOOK[s].options); this.wear(Object.fromEntries(JAR_SLOTS.map((s) => [s, ids(s)[Math.floor(Math.random() * ids(s).length)]]))); say(`The Pneuka Jar wears: ${JAR_SLOTS.map((s) => `${s} ${this.look[s]}`).join(', ')}.`); return; }
    if (!JAR_LOOK[slot]) { say(`No slot ${slot}: ${JAR_SLOTS.join(', ')}.`); return; }
    if (!id || !this.set(slot, id)) { say(`${JAR_LOOK[slot].label}: ${Object.keys(JAR_LOOK[slot].options).join(', ')}.`); return; }
    say(`${JAR_LOOK[slot].label}: ${JAR_LOOK[slot].options[id].label}.`);
  }

  // ---------------------------------------------------------------- each frame
  update(raw = 1 / 60) {
    const jar = this.jar || (this.attach(this.game.god?.jar), this.jar); if (!jar) return;
    const V = this.game.vessel, seal = this.game.cradles?.mine;
    const key = `${JSON.stringify(V?.look || DEFAULT_LOOK)}|${JSON.stringify(this.look)}|${seal ? `${seal.name}.${seal.outline}.${seal.carving}` : ''}|${V?.learned?.length || 0}`;
    if (key !== this.key) { this.key = key; this.apply(); }
    const M = this.materials, inner = M.innerLight();
    M.flash(jar.flash || 0);
    // the stones keep the Jar's wholeness in their light (godhand/jar.js sets it on its core), in the inner light's colour
    const C = jar.coreMat, S = M.m.stones, red = C.emissive.r > 0.9 && C.emissive.g < 0.5;
    S.emissive.copy(red ? C.emissive : inner); S.emissiveIntensity = C.emissiveIntensity * (M.gem ? 0.35 : 1);
    if (jar.halo && !red) jar.halo.material.color.copy(inner);
    const L = this.game.realm?.jarLook; // (the garden's hop: vfx/garden/jarhop.js)
    if (L) { L.burst = this.burst; if (!this.materials.skinRow?.keep || (V?.soul?.w || 0) > 0.02) { L.color.copy(inner); L.halo.material.color.copy(inner); L.foot.material.color.copy(inner); } }
    if (this.pendant.length && jar.group.visible) this.sway(raw);
  }

  /** Everything rebuilt for the look as it is now: the shape, the parts, the pendant, the seal, the choker, the materials. */
  apply() {
    const jar = this.jar, body = jar.jarBody, look = this.look, V = this.game.vessel;
    const f = jarMorph(look.shape, look.foot, this.phase), identity = look.shape === 'owner' && look.foot !== 'scallop';
    morphGeometry(body.geometry, f, identity); if (this.core) morphGeometry(this.core.geometry, f, identity);
    this.materials.dress(V?.look || DEFAULT_LOOK, (id) => V?.glaze?.(id));
    for (const m of [...this.parts, ...this.pendant]) this.drop(m);
    this.parts = Object.entries(jarParts(look, f)).map(([mat, geo]) => this.mesh(geo, this.materials.forPart(mat)));
    const P = pendantParts(look.pendant, f); this.hang = P.hang;
    this.pendant = Object.entries(P.geos).map(([mat, geo]) => { geo.userData.rest = geo.attributes.position.array.slice(); return this.mesh(geo, this.materials.forPart(mat)); });
    this.sealFace(f);
    this.choker(f);
  }
  mesh(geo, mat) {
    const body = this.jar.jarBody, m = new THREE.SkinnedMesh(geo, mat);
    m.bind(body.skeleton, body.bindMatrix); m.bindMode = body.bindMode; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
    m.name = 'PneukaJarPart'; body.parent.add(m); addOutline(m);
    return m;
  }
  drop(m) { m.userData.outline?.removeFromParent(); m.removeFromParent(); m.geometry.dispose(); }

  /** Your seal on the Jar's base, as a carving (mirrored), skinned to the base. */
  sealFace(f) {
    const seal = this.game.cradles?.mine;
    if (this.seal) { this.drop(this.seal); this.seal = null; }
    if (!seal) return;
    const c = (this.sealCanvas ||= document.createElement('canvas')); c.width = c.height = 256;
    // (the base's bare clay under the carving: a clear canvas read black)
    const ctx = c.getContext('2d'); ctx.fillStyle = '#b8936f'; ctx.fillRect(0, 0, 256, 256); ctx.save(); ctx.translate(256, 0); ctx.scale(-1, 1);
    try { drawSealFace(ctx, seal, { size: 256, ink: '#3a1a14' }); } catch { /* a face that cannot be drawn: the bare base */ }
    ctx.restore();
    const M = this.materials.m.seal; if (M.map?.isCanvasTexture) M.map.needsUpdate = true; else { M.map?.dispose?.(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; M.map = M.emissiveMap = t; M.needsUpdate = true; }
    M.emissive?.setRGB(0.32, 0.3, 0.28); // (a little light of its own: the base faces the ground, where no lamp reaches)
    const g = new THREE.CircleGeometry(0.148, 32).rotateX(Math.PI / 2).translate(0, 0.034, 0);
    const P = g.attributes.position, v = new THREE.Vector3();
    const e = f(new THREE.Vector3(0.148, 0.034, 0)), k = Math.hypot(e.x, e.z) / 0.148; // (the base widened or narrowed with the shape)
    // (laid just under the base's own floor, found on the body as morphed: its lowest vertex near the axis, and skinned as that vertex is;
    //  a disc at a guessed height sat inside the recess and never showed: the sheet's from-below cell, 2026-10-24)
    const B = this.jar.jarBody.geometry, BP = B.attributes.position, SI = B.attributes.skinIndex, SW = B.attributes.skinWeight;
    let floor = Infinity, at = -1;
    for (let i = 0; i < BP.count; i++) { const x = BP.getX(i), z = BP.getZ(i), y = BP.getY(i); if (Math.hypot(x, z) < 0.6 * 0.148 * k && y < floor) { floor = y; at = i; } }
    const y0 = at < 0 ? e.y : floor - 0.0015;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); P.setXYZ(i, v.x * k, y0, v.z * k); }
    const n = P.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { si[i * 4 + j] = at < 0 || !SI ? (j ? 0 : 1) : SI.getComponent(at, j); sw[i * 4 + j] = at < 0 || !SW ? (j ? 0 : 1) : SW.getComponent(at, j); }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); g.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array(n).fill(4), 1));
    this.seal = this.mesh(g, M); this.seal.castShadow = false;
  }

  /** The bracelet's choker (vfx/braceletwear.js, on the chest bone) moved to where the neck went, and widened with it. */
  choker(f) {
    const B = this.game.bracelets?.jar?.object; if (!B) return;
    const base = (this.chokerBase ||= { y: B.position.y, s: B.scale.x }), n = f(new THREE.Vector3(A.neckR, A.neckY, 0));
    B.position.y = base.y + (n.y - A.neckY); B.scale.setScalar(base.s * Math.hypot(n.x, n.z) / A.neckR);
  }

  /** The pendant swung by the Jar's own motion (a damped pendulum about the choker's point), its few vertices turned on the CPU. */
  sway(raw) {
    const dt = Math.min(0.05, raw || 0), grp = this.jar.group; if (dt <= 0) return;
    const p = grp.getWorldPosition(_p);
    if (!this.lastPos) this.lastPos = p.clone();
    const vel = _v.copy(p).sub(this.lastPos).divideScalar(dt), acc = _a.copy(vel).sub(this.vel).divideScalar(dt); this.vel.copy(vel); this.lastPos.copy(p);
    acc.applyQuaternion(_q.copy(grp.getWorldQuaternion(_q)).invert()); // (in the Jar's own frame)
    const S = this.swing;
    S.vx += (-SWING.k * S.x - SWING.damp * S.vx + acc.z * SWING.push * SWING.k * 0.05) * dt; S.vz += (-SWING.k * S.z - SWING.damp * S.vz - acc.x * SWING.push * SWING.k * 0.05) * dt;
    S.x = THREE.MathUtils.clamp(S.x + S.vx * dt, -SWING.max, SWING.max); S.z = THREE.MathUtils.clamp(S.z + S.vz * dt, -SWING.max, SWING.max);
    if (Math.abs(S.x) + Math.abs(S.z) < 1e-4 && this.still) return;
    this.still = Math.abs(S.x) + Math.abs(S.z) < 1e-4;
    _e.set(S.x, 0, S.z); _q.setFromEuler(_e);
    for (const m of this.pendant) {
      const Pa = m.geometry.attributes.position, R = m.geometry.userData.rest;
      for (let i = 0; i < Pa.count; i++) { _p.fromArray(R, i * 3).sub(this.hang).applyQuaternion(_q).add(this.hang); Pa.setXYZ(i, _p.x, _p.y, _p.z); }
      Pa.needsUpdate = true;
    }
  }
}
const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

/** The crack region of each vertex (kintsugi.js reads `aRegion`): the face the mask's, the foot a leg's, the rest the torso's. */
function regions(geo) {
  if (geo.attributes.aRegion) return;
  const P = geo.attributes.position, a = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) a[i] = regionAt(P.getY(i));
  geo.setAttribute('aRegion', new THREE.BufferAttribute(a, 1));
}
