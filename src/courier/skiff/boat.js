// ---------------------------------------------------------------------------------------
// THE SKIFF: the Solar Skiff's body, the owner's model (source_assets/Courier/courier_solarskiff.blend, its hull painted by the owner:
// courier_solarskiff_hull.png, 2026-10-08; exported by scripts/export_solarskiff.py to src/assets/solarskiff.glb). A small hovering
// boat with a lug sail after the King of Red Lions in The Wind Waker: a carved prow with an eye, a domed stern with its engine and fins,
// two oars, doors in the deck the mast rises through, a telescoping mast, a boom that swings out to leeward of the wind, a cream sail
// with its terracotta spiral, and a red pennant at the masthead that shows which way the wind goes. The rider holds a sheet (a rope)
// from the boom's end, so the hands never have to follow a moving boom.
//
// What moves it, in order, every frame (pose):
//   1. its own clips (boatpose.js): each the partner of the rider's clip of the same name, played with it at the same time and weight
//      (the summon's rise out of the sand and its doors, mast and boom; the recall's fold and flight into the raised right hand; the
//      ride's bob, carve, flare and Ollie)
//   2. the code's word, absolute (what Wind Waker's boat showed, from its screenshots and write-ups): the boom to leeward, wider with
//      the wind behind; the sail hoisted as far as L (always L's: the summon ends furled, as the ride starts); its belly, full or
//      luffing; the pennant streaming where the wind goes, quick and tight in a strong wind, drooping in a light one
//   3. the range of motion last (courier/anim/rom.js SKIFF_ROM)
//
// Built as one Group in its own frame (+Z bow, +X to the left, Y up, origin at the deck), so the whole skiff, and the rider standing on
// it, are moved and turned with one quaternion. The model is parsed the first time it is wanted (load: skiff.js asks on the way into
// the Dunes, or as the trailer begins), its bytes a chunk of their own until then, so a session that never goes there never holds
// them; until it is parsed and its materials compiled the boat is not drawn, and nothing else waits on it.
//   const skiff = new Skiff(scene);   skiff.load(game)  (a promise; again: the same one)   skiff.ready
//   skiff.set({ sail, side, fill, boom, glow, t, speed })   // per frame: what the sail is doing
//   skiff.placePennant(windDir, strength, t)                 // per frame, once the group is placed
//   skiff.pose(rider, s) or skiff.posePhase(clip, t)         // after the rider is posed (skiff.js animate)
//   skiff.group.position / .quaternion                       // where it is
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PALETTE } from '../../core/config.js';
import { addOutline } from '../../render/outline.js';
import { JointLimits, SKIFF_ROM } from '../anim/rom.js';
import { BoatPose } from './boatpose.js';
import { vessoulPainted, PAINT_LIGHT } from '../../vfx/vessoulpaint.js';

// how far the model stands up in the group (m): the deck is this far over the group's origin, and the rider with it. At 0 the deck
// rides where the old boat's did (the hover, 0.6 over the sand: core/config.js), the hull's belly 0.27 over it and its forefoot fin
// (0.77 under the deck) 0.17 into it on the flat: a sand keel, cutting the sand at the bow where the wake's bubbles start (judged
// from the Dunes, front, side and close at the waterline of the sand; lift it here, never the hover, if it ever reads as clipping)
const LIFT = 0;
export const SKIFF = {
  half: 1.82, beam: 0.52, deck: LIFT, // half length (the bow's tip), half width, height of the deck surface over the origin
  mast: { z: 0.45, h: 4.378 },        // (the pennant's root)
  boom: { y: 2.156, len: 2.05 },
  sailH: 1.914,                        // (the yard's rise over the boom, hoisted)
  rider: { z: -0.42 },                 // where the rider's feet are on the deck (along the boat): the model's `rider` bone
};
// the hoist (the yard's height over the boom, the sail's scale up its luff) furled and full, from the clips' own Furl and Unfurl
const FURLED = { yard: 0.055, sail: 0.06 };
// the belly at full fill: each sail bone out to the side of the one below (m), from Skiff_RideCruise; Skiff_RideIdle is a third of it
const BELLY = [0.27, 0.22, -0.14];
const C = { rope: 0xe9d4a4, energy: 0xffc65c };
const Zax = new THREE.Vector3(0, 0, 1), Xax = new THREE.Vector3(1, 0, 0);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3();
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the maker's paintings take the game's light and glow back a share of themselves (as the Courier's do): the Vessoul's painted material,
// so the hull and the parts share the god hand's and the Pneuka Jar's shader program (vfx/vessoulpaint.js)
const painted = (map, o = {}) => vessoulPainted(map, o);
/** A texture the glTF brought, filtered so it never crawls: mipmapped down, and `near` (Blender's Closest) kept only up close. */
function filtered(tex, near) {
  if (!tex) return null;
  tex.magFilter = near ? THREE.NearestFilter : THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class Skiff {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'SolarSkiff';
    this.group.visible = false;
    this.group.userData.zoneFree = true; // (shown and hidden by the tech, in the Dunes only: the zones placed it, waiting at the origin, in the workshop, and hid the first summon a quarter second: CASEBOOK, 2026-10-08)
    scene.add(this.group);
    this.side = 1; this.boomAngle = 0.5; this.L = 0; this.fill = 0; this.glow = 0; this.t = 0; this.folded = 1;
    this.wind = { yaw: 0, str: 0.6, t: 0 };
    this.ground = -0.6; // (the sand's height in the group's frame: skiff.js says, each frame)
    this.tip = new THREE.Vector3(); // the boom's end, in world space (for the sheet)
    this.buildRope();
  }

  get ready() { return !!this.live; }

  /** The model, parsed and compiled the first time it is wanted; resolves when the boat can be drawn. */
  load(game) {
    this.loading ||= import('../../assets/solarskiff.glb?b64')
      .then(({ default: b64 }) => new GLTFLoader().parseAsync(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer, ''))
      .then(async (gltf) => {
        this.build(gltf);
        // (its programs built off the main thread before its first frame, as the warm-up builds the rest, and for the buffer the frame is
        // drawn into, as it does: nothing compiles in play. compileAsync compiles at the call and only waits after, so the target is put back
        // at once. An empty frame first, as main.js's warm-up does: compile reads the clipping state the last render left, and the trail
        // map's offscreen pass leaves none until the next draw (a tick with no draw after it: the manual mode the sweeps, the stress test
        // and perf run in), so the hull and the cloth were built for no planes here and again, for the God Hand's one, at their first
        // draw: CASEBOOK, 2026-10-08)
        const r = game?.renderer;
        if (r?.compileAsync) {
          const prev = r.getRenderTarget();
          let done;
          try { r.setRenderTarget(game.post?.target ?? prev); r.render(new THREE.Scene(), game.camera); done = r.compileAsync(this.group, game.camera, game.scene); } catch (e) { console.warn('the skiff\'s shaders', e); }
          r.setRenderTarget(prev);
          await done?.catch?.(() => {});
        }
        this.live = true;
      })
      .catch((e) => console.warn('the skiff\'s model', e));
    return this.loading;
  }
  set visible(v) { this.group.visible = v && this.ready; this.rope.visible = v && this.ready; }

  // ------------------------------------------------------------------ the model
  build(gltf) {
    const model = this.model = gltf.scene;
    model.position.y = LIFT;
    model.updateMatrixWorld(true);
    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const skinned = meshes.find((m) => m.isSkinnedMesh);
    const bones = skinned.skeleton.bones;
    this.bone = Object.fromEntries(bones.map((b) => [b.name, b]));
    const riderBone = model.getObjectByName('rider');
    if (riderBone) SKIFF.rider.z = +riderBone.getWorldPosition(_v).z.toFixed(3);
    // the sheet's end on the boom: where the old boom's sheet was (0.92 of the boom out from the mast), riding the boom's last segment
    const tipAt = new THREE.Vector3(0, SKIFF.boom.y + LIFT, SKIFF.mast.z - SKIFF.boom.len * 0.92);
    this.tipNode = new THREE.Object3D();
    this.tipNode.position.copy(this.bone.boom_3.worldToLocal(tipAt));
    this.bone.boom_3.add(this.tipNode);
    // the materials, by name (each painted, Emission in the .blend: here lit by the game and glowing back a share of itself)
    for (const m of meshes) {
      const src = m.material, tex = src.emissiveMap || src.map;
      if (src.name === 'Skiff_Hull') m.material = painted(filtered(tex, true));
      else if (src.name === 'Skiff_Parts') m.material = painted(filtered(tex, false));
      else if (src.name === 'Skiff_Cloth') { m.material = this.clothMat = painted(filtered(tex, false), { side: THREE.DoubleSide, roughness: 0.9 }); }
      else if (src.name === 'CourierEnergy') m.material = this.energyMat = new THREE.MeshStandardMaterial({ color: src.color.clone(), roughness: 0.35, metalness: 0.2, emissive: PALETTE.glow ?? C.energy, emissiveIntensity: 0.3 });
      m.material.name = src.name;
      src.dispose?.();
      m.castShadow = true;
      m.receiveShadow = src.name === 'Skiff_Hull';
      m.frustumCulled = false; // (the summon starts the hull 1.3 m down and the recall flies the root 1.5 m up: never culled by its rest box)
      // outlined but the cloth (as the old sail) and the Lachryma (as the Courier's own: character.js OUTLINED): the flare and the sigil are
      // opened by a bone scaled a thousandfold, and an inverted hull's offset is skinned with its bone (render/outline.js), so theirs would
      // open a thousandfold too (CASEBOOK, 2026-10-08)
      if (src.name === 'Skiff_Hull' || src.name === 'Skiff_Parts') addOutline(m);
    }
    // the hover glow under the hull, riding the hull bone (it bobs, pitches and rises out of the sand with it): steady, warm, no flicker
    const emitMat = new THREE.MeshBasicMaterial({ color: C.energy, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.emit = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), emitMat);
    this.emit.rotation.x = -Math.PI / 2; this.emit.position.y = -0.36; this.emit.scale.set(0.9, 3.4, 1);
    this.emit.frustumCulled = false;
    this.bone.hull.add(this.emit);
    this.P = new BoatPose(gltf.animations, bones);
    // the glide's wings: the oars as the Ollie clip spreads them widest (0.58 s in), held while gliding (skiff.js; Calissa's own glide
    // clip, when there is one, takes its place)
    const f = this.P.sample('Skiff_Ollie', 0.58, this.P.A, false);
    this.wingQ = Object.fromEntries(['oar_shoulder.L', 'oar_shoulder.R'].filter((n) => this.P.index[n] != null).map((n) => [n, new THREE.Quaternion().fromArray(f.q, this.P.index[n] * 4)]));
    this.rest = (b) => this.P.rest.q.subarray(this.P.index[b] * 4, this.P.index[b] * 4 + 4);
    this.rom = new JointLimits();
    for (const [name, spec] of Object.entries(SKIFF_ROM)) { const b = this.bone[name]; if (b) this.rom.add(b, _q.fromArray(this.rest(name)), spec); }
    this.group.add(model);
    this.P.write(this.P.rest);
  }

  // ------------------------------------------------------------------ the sheet (a rope to the rider's hands)
  buildRope() {
    const pts = new Float32Array(3 * 14);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    this.rope = new THREE.Line(g, new THREE.LineBasicMaterial({ color: C.rope }));
    this.rope.frustumCulled = false;
    this.rope.visible = false;
    this.ropeGeo = g;
  }

  /** Draw the sheet from the boom's end to a hand (both in world space), with a little sag. */
  drawRope(scene, hand) {
    if (!this.P) return;
    if (!this.rope.parent) scene.add(this.rope);
    this.tipNode.updateWorldMatrix(true, false);
    this.tipNode.getWorldPosition(this.tip);
    const P = this.ropeGeo.attributes.position;
    const n = 14, sag = 0.12;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      P.setXYZ(i, this.tip.x + (hand.x - this.tip.x) * k, this.tip.y + (hand.y - this.tip.y) * k - Math.sin(Math.PI * k) * sag, this.tip.z + (hand.z - this.tip.z) * k);
    }
    P.needsUpdate = true;
  }

  /** Kept for its callers: the mast's telescoping is the clips' now (the summon's and the recall's). */
  fold(k) { this.folded = k; }

  /** The pennant streams where the wind goes (dir: unit vector in x, z; strength 0..1+), t seconds. Called once the group is placed. */
  placePennant(dir, strength, t) {
    _v.set(dir.x, 0, dir.y).applyQuaternion(_q.copy(this.group.quaternion).invert());
    this.wind.yaw = Math.atan2(-_v.x, -_v.z); // (at rest the pennant streams aft, -Z: turned about the mast to where the wind goes)
    this.wind.str = THREE.MathUtils.clamp(strength, 0, 1.2);
    this.wind.t = t;
  }

  // ------------------------------------------------------------------ per frame
  /** sail 0..1 hoisted; side +-1; fill 0..1; boom = the boom's angle from dead aft (radians, + to the boat's right); glow 0..1 (a flare); t seconds. */
  set({ sail, side, fill, boom, glow, t, speed, wings = 0 }) {
    this.wings = wings;
    this.L = sail; this.side = side; this.fill = fill; this.boomAngle = boom; this.glow = glow; this.t = t;
    if (!this.P) return;
    this.clothMat.emissiveIntensity = PAINT_LIGHT + 0.7 * glow;
    this.energyMat.emissiveIntensity = 0.3 + 1.4 * glow;
    this.emit.material.opacity = 0.38 + 0.22 * Math.min(1, (speed || 0) / 24) + 0.3 * glow;
  }

  /** The ride: the boat's clips with the rider's weights (R: the Rider, after it posed the body; s: { t, speed, steer, L }), then the code's. */
  pose(R, s) {
    if (!this.P) return;
    this.P.write(this.P.ride(R, s));
    this.own(1);
  }

  /** A phase's clip (Skiff_Summon, Mount, Dismount, Recall, Bail; Skiff_RideIdle parked), then the code's where the clip lets go. */
  posePhase(clip, t) {
    if (!this.P) return;
    this.P.write(clip === 'Skiff_RideIdle' ? this.P.sample(clip, t, this.P.A, true) : this.P.phase(clip, t));
    // the summon stands the mast, grows the boom and shows the pennant (to f58); the recall folds them (from f5): the clip has them till then
    const w = clip === 'Skiff_Summon' ? smooth(1.8, 2.1, t) : clip === 'Skiff_Recall' ? 1 - smooth(0, 0.15, t) : 1;
    // the summon's sigil (opened by the clip, f4 to f25) is laid on the sand the boat rises out of: the .blend draws it 0.79 under the deck,
    // under the sand here, where the boat hovers and the summon begins with its deck at the rider's feet
    if (clip === 'Skiff_Summon' && this.bone.sigil) this.bone.sigil.position.z = this.ground - LIFT + 0.03;
    // (the sigil is the energy's cream, which noon sand takes back: it burns brighter while the ring is out, f4 to f25)
    if (clip === 'Skiff_Summon') this.energyMat.emissiveIntensity = 0.3 + 1.4 * this.glow + 1.4 * (1 - smooth(0.6, 0.9, t));
    this.own(w);
  }

  /** The code's word on the boat, over the clip by w: the boom, the belly and the pennant; the hoist is always L's. Then the range of motion. */
  own(w) {
    const B = this.bone, t = this.t;
    // the hoist: the yard up the mast and the sail up its luff as far as L (Skiff_Unfurl's ends; a straight line between, never past full)
    const L = THREE.MathUtils.clamp(this.L, 0, 1);
    B.yard.position.z = FURLED.yard + (this.P.rest.p[this.P.index.yard * 3 + 2] - FURLED.yard) * L;
    B.sail_1.scale.y = FURLED.sail + (1 - FURLED.sail) * L;
    if (w > 0.001) {
      // the boom about the mast (its local Z is the boat's up), to leeward
      _q.fromArray(this.rest('boom')).multiply(_q2.setFromAxisAngle(Zax, this.boomAngle));
      B.boom.quaternion.slerp(_q, w);
      // the belly: each sail bone out to the side it fills to, and a small flap when it luffs
      const flap = (1 - this.fill) * 0.05 * L;
      ['sail_1', 'sail_2', 'sail_3'].forEach((n, i) => {
        const x = this.side * this.fill * BELLY[i] + flap * Math.sin(t * 3.2 + i * 1.7) * (i + 1) / 3;
        B[n].position.x += (x - B[n].position.x) * w;
      });
      // the pennant: its root turned about the mast to where the wind goes; the five links ripple down it, quick and tight in a strong
      // wind, slow and drooping in a light one (the old pennant's vertex shader, as rotations: a wave's slope from link to link)
      const { yaw, str } = this.wind, wt = this.wind.t;
      B.pennant_root.quaternion.slerp(_q.fromArray(this.rest('pennant_root')).multiply(_q2.setFromAxisAngle(Zax, yaw)), w);
      const kx = 2.6 + 1.6 * str, om = 3 + 7 * str, amp = 0.07 + 0.16 * str, len = 1.9, droop = 0.58 * (1 - Math.min(1, str));
      let prev = 0, prevD = 0;
      for (let i = 1; i <= 5; i++) {
        const x = i * 0.374, u = x / len, ph = x * kx - wt * om;
        const slope = amp * u * kx * Math.cos(ph) + amp * u * 0.5 * kx * 0.53 * Math.cos(ph * 0.53 + 1.7);
        const d = -droop * u; // (the droop's slope at this link: down toward the tail)
        const b = B[`pennant_${i}`];
        _q.fromArray(this.rest(`pennant_${i}`)).multiply(_q2.setFromAxisAngle(Zax, THREE.MathUtils.clamp(slope - prev, -0.6, 0.6))).multiply(_q2.setFromAxisAngle(Xax, d - prevD));
        b.quaternion.slerp(_q, w);
        prev = slope; prevD = d;
      }
    }
    // the glide: the oars spread as wings, by how far into the glide (this.wings 0..1, set by skiff.js)
    if (this.wings > 0.001 && this.wingQ) for (const n in this.wingQ) B[n].quaternion.slerp(this.wingQ[n], this.wings);
    this.rom.apply();
  }
}
