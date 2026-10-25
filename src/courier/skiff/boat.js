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
//      luffing; the pennant streaming where the wind goes, quick and tight in a strong wind, drooping in a light one; in a glide the
//      oars swung out as wings (SKIFF_GLIDE, the Skiff_Glide pose, by `wings`)
//   3. the range of motion last (courier/anim/rom.js SKIFF_ROM)
//
// Built as one Group in its own frame (+Z bow, +X to the left, Y up, origin at the deck), so the whole skiff, and the rider standing on
// it, are moved and turned with one quaternion. The model is parsed the first time it is wanted (load: skiff.js asks on the way into
// the Dunes, or as the trailer begins), its bytes a chunk of their own until then, so a session that never goes there never holds
// them; until it is parsed and its materials compiled the boat is not drawn, and nothing else waits on it.
//   const skiff = new Skiff(scene);   skiff.load(game)  (a promise; again: the same one)   skiff.ready
//   skiff.set({ sail, side, fill, boom, glow, t, speed, wings })   // per frame: what the sail is doing (wings 0..1: the glide)
//   skiff.pulse(k)                                           // a short flash of the boost's Lachryma glow (a perfect pop, a bank)
//   skiff.placePennant(windDir, strength, t)                 // per frame, once the group is placed
//   skiff.pose(rider, s) or skiff.posePhase(clip, t)         // after the rider is posed (skiff.js animate)
//   skiff.group.position / .quaternion                       // where it is
//   skiff.stakes({ heat, luff, wear, tilt, roll })            // the board's rules worn on it (vfx/skiffboardlooks.js, each frame)
//   skiff.partsLook()                                       // the mast and the fins as worn (in own(): MAST and FIN, SKIFF_PARTS_LOOK)
//   skiff.flash(k, colour?, dur?)   skiff.broken = bool   skiff.setHullMap(tex | null)   skiff.cleanHull (the hull's unworn material)
//   skiff.setHullPainting(tex | null)  (a hull painting, vfx/skiffhulls.js; null the owner's)   skiff.hullBase (the painting under any wear)
//   skiff.paintLook (the paint worn: vfx/skiffpaintlook.js)   skiff.cleanCloth (the cloth as painted, unpainted and unfaded: the rivals')
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PALETTE } from '../../core/config.js';
import { addOutline, rigUniforms } from '../../render/outline.js';
import { JointLimits, SKIFF_ROM } from '../anim/rom.js';
import { BoatPose } from './boatpose.js';
import { vessoulPainted, PAINT_LIGHT } from '../../vfx/vessoulpaint.js';
import { featTint } from '../../vfx/oxidation.js';
import { LACHRYMA_TINT } from '../../vfx/racewayeffects.js';
import { glazeHull } from '../../vfx/hullglaze.js';
import { SkiffPaintLook } from '../../vfx/skiffpaintlook.js';
import { base64Buffer } from '../../core/base64.js';

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
// THE BOOST'S GLOW (round 3, the owner: the push is Lachryma's, so it glows in Lachryma's colour): the flare and every turbo (`glow`,
// skiff.boosting 0..1) turn the energy parts' warm light to Lachryma's and tint the cloth's own glow with it, the oil film walking
// through it (`film` of it, at `filmRate` loops a real second: vfx/oxidation.js featTint); `pulse()` a short flash of it (a perfect pop,
// a bank: real seconds `pulseDur`). Uniforms only: the hull's, the cloth's and the energy's programs are as they were.
export const SKIFF_BOOST_GLOW = { energy: 1.6, cloth: 0.9, tintCloth: 0.85, film: 0.25, filmRate: 0.3, pulse: { energy: 2.2, cloth: 1.2 }, pulseDur: 0.45 };
const WARM = new THREE.Color(PALETTE.glow ?? C.energy), LACH = new THREE.Color(LACHRYMA_TINT), WHITE = new THREE.Color(1, 1, 1), _lc = new THREE.Color(), _fc = new THREE.Color();
// THE BOARD'S STAKES (round 6, boardrules.js; their look is vfx/skiffboardlooks.js, which sets them): the scorch heats the cloth toward an
// ember (`heat`, its glow warmed and the cloth a little browned) and the luff flutters it (`luff`: the belly emptied, the bones shaking);
// a low pool wears the hull (`wear`: its glaze duller and rougher, its glow lower); a hit flashes it (`flash`); the manual stands the
// board on its tail (`tilt`, rad nose up, about the rider's feet, `roll` by the lean). On the body, never the group: the rider, the
// marks and the physics are as they were, and the model itself is never moved (a rival's or the ghost's clone of it stays whole).
export const SKIFF_STAKES = { ember: 0xff6a2a, scorched: 0x7a4a30, browned: 0.3, emberTint: 0.8, emberGlow: 1.1, dull: 0x7c7068, dulled: 0.45, rough: 0.25, dim: 0.4, flash: 2.4, flutter: { amp: 0.2, rate: 17 }, emptied: 0.6 };
const EMBER = new THREE.Color(SKIFF_STAKES.ember), SCORCHED = new THREE.Color(SKIFF_STAKES.scorched), DULL = new THREE.Color(SKIFF_STAKES.dull), _hc = new THREE.Color(), _bv = new THREE.Vector3();
const Zax = new THREE.Vector3(0, 0, 1), Xax = new THREE.Vector3(1, 0, 0);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3();
// SKIFF_GLIDE: the glide's pose of the boat (Space held in the air; the owner's R8: "a Skiff_Glide pose, oars out as wings"). The oars
// trail aft at rest (their local Y), hinged about the beam (local X: the clips' fold, Skiff_Summon's 1.37 rad) and turned about the
// boat's up (local Z); for the glide each is swung out over its own side (`spread`, from dead aft), lifted to a dihedral (`lift`: a
// glider's wings in a shallow V, steadier than flat) and its blade rolled flat to the air (`roll`). Judged from the Dunes, front and
// side, against the Ollie's 0.39 rad stand-in it replaces. Prior art: the King of Red Lions' and the Deku Leaf's spread in Wind
// Waker, a hang glider's dihedral, a gull's flexing primaries (`flex`, rad, at `flexRate` rad/s).
export const SKIFF_GLIDE = { spread: 1.22, lift: 0.3, roll: 0.5, flex: 0.045, flexRate: 3.1 };
/** An oar's Skiff_Glide rotation: its rest, swung out (side +1 the left oar, out to +X), lifted and rolled, in its own frame. */
function glideOar(rest, side) {
  const q = rest.clone();
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -side * SKIFF_GLIDE.spread));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), SKIFF_GLIDE.lift));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * SKIFF_GLIDE.roll));
  return q;
}
const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the maker's paintings take the game's light and glow back a share of themselves (as the Courier's do): the Vessoul's painted material,
// so the hull and the parts share the god hand's and the Pneuka Jar's shader program (vfx/vessoulpaint.js)
const painted = (map, o = {}, U) => vessoulPainted(map, o, U);
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
    this.side = 1; this.boomAngle = 0.5; this.L = 0; this.fill = 0; this.glow = 0; this.t = 0; this.folded = 1; this.pulseK = 0;
    this.wind = { yaw: 0, str: 0.6, t: 0 };
    this.ground = -0.6; // (the sand's height in the group's frame: skiff.js says, each frame)
    this.tip = new THREE.Vector3(); // the boom's end, in world space (for the sheet)
    this.st = { heat: 0, luff: 0, wear: 0, tilt: 0, roll: 0 }; this.flashK = 0; this.flashDur = 0.3; this.flashC = new THREE.Color(1, 1, 1);
    this.buildRope();
  }

  get ready() { return !!this.live; }

  /** The model, parsed and compiled the first time it is wanted; resolves when the boat can be drawn. */
  load(game) {
    this.loading ||= import('../../assets/solarskiff.glb?b64')
      .then(({ default: b64 }) => new GLTFLoader().parseAsync(base64Buffer(b64), ''))
      .then(async (gltf) => {
        this.build(gltf);
        this.hullGlaze(game); // (the glaze fired on the hull at the kiln: hullGlaze below)
        this.paintLook ||= new SkiffPaintLook(this, game); // (the sail's dye, pattern and seal, the pennant, the trail and the ribbon: vfx/skiffpaintlook.js)
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
  set visible(v) { this.group.visible = v && this.ready; this.rope.visible = v && this.ready; if (!v) this.paintLook?.clear(); }

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
      if (src.name === 'Skiff_Hull') { this.hullTex = filtered(tex, true); this.cleanHull = painted(this.hullTex); m.material = this.hullMat = painted(this.hullTex); } // (the board's own hull, worn and flashed by its stakes; `cleanHull` the same program unworn, for the rivals' boards: vfx/racewayrivals.js)
      else if (src.name === 'Skiff_Parts') m.material = painted(filtered(tex, false));
      else if (src.name === 'Skiff_Cloth') { m.material = this.clothMat = painted(filtered(tex, false), { side: THREE.DoubleSide, roughness: 0.9 }, this.sailFade = rigUniforms()); this.cleanCloth = painted(tex, { side: THREE.DoubleSide, roughness: 0.9 }); this.cleanCloth.name = src.name; } // (the screen-door fade, its own uniforms: the ride sees through the sail, skiff.js; painted is already withFade's, a second wrap declared uFade twice and the sail's program failed: nothing drawn)
      else if (src.name === 'CourierEnergy') m.material = this.energyMat = new THREE.MeshStandardMaterial({ color: src.color.clone(), roughness: 0.35, metalness: 0.2, emissive: PALETTE.glow ?? C.energy, emissiveIntensity: 0.3 });
      m.material.name = src.name;
      if (src.name === 'Skiff_Hull') this.cleanHull.name = src.name;
      src.dispose?.();
      m.castShadow = true;
      m.receiveShadow = src.name === 'Skiff_Hull';
      m.frustumCulled = false; // (the summon starts the hull 1.3 m down and the recall flies the root 1.5 m up: never culled by its rest box)
      // outlined but the cloth (as the old sail) and the Lachryma (as the Courier's own: courier/character/bodymaterials.js OUTLINED): the flare and the sigil are
      // opened by a bone scaled a thousandfold, and an inverted hull's offset is skinned with its bone (render/outline.js), so theirs would
      // open a thousandfold too (CASEBOOK, 2026-10-08)
      if (src.name === 'Skiff_Hull' || src.name === 'Skiff_Parts') addOutline(m);
    }
    // (no hover glow under the hull: the owner, 2026-10-13, it clipped into the sand; the glow lives on the cloth and the energy parts)
    this.P = new BoatPose(gltf.animations, bones);
    this.rest = (b) => this.P.rest.q.subarray(this.P.index[b] * 4, this.P.index[b] * 4 + 4);
    // the glide's wings: Skiff_Glide's oars, each its rest turned by the pose (SKIFF_GLIDE), held while gliding (skiff.js `wings`). The
    // bones by their names in three.js, which drops the dot of Blender's `oar_shoulder.L` (PropertyBinding.sanitizeNodeName, as `doorL`):
    // asked for with the dot, the stand-in found neither and the glide spread nothing (CASEBOOK, 2026-10-09; rule 168)
    this.glideQ = Object.fromEntries(['oar_shoulderL', 'oar_shoulderR'].filter((n) => this.P.index[n] != null).map((n) => [n, glideOar(_q.fromArray(this.rest(n)), n.endsWith('L') ? 1 : -1)]));
    this.rom = new JointLimits();
    for (const [name, spec] of Object.entries(SKIFF_ROM)) { const b = this.bone[name]; if (b) this.rom.add(b, _q.fromArray(this.rest(name)), spec); }
    this.body = new THREE.Group(); this.body.name = 'SolarSkiffBody'; // (the stakes' tilt and a wreck's hiding are the body's: the model is never moved)
    this.body.add(model); this.group.add(this.body);
    this.P.write(this.P.rest);
  }

  // ------------------------------------------------------------------ the hull's glaze (Calissa's: fired at the kiln, vfx/hullglaze.js)
  /** The hull in the glaze fired on it (Dovina's `game.skiffParts.glaze()`; none until it is there), and again whenever one is fired. */
  hullGlaze(game) {
    this.game = game; // (the parts worn are asked each frame: partsLook)
    this.model?.traverse((o) => { if (!this.hullMat && o.isMesh && !o.userData.isOutline && o.material?.name === 'Skiff_Hull') this.hullMat = o.material; });
    const apply = (id) => { // (and the hull at rest in it kept: applyStakes wears it from there each frame, never over it)
      glazeHull(this.hullMat, id ? (game?.vessel?.glaze?.(id) ?? id) : null);
      const H = this.hullMat; if (H) this.hullRest = { color: H.color.clone(), rough: H.roughness };
    };
    apply(game?.skiffParts?.glaze?.() ?? null);
    if (!this.hullGlazeOn) { this.hullGlazeOn = true; game?.events?.on?.('skiff.glaze', (e) => apply(e?.glaze ?? null)); }
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
    this.paintLook?.frame(t); // (the trail's colour and the ribbon, the board placed)
  }

  // ------------------------------------------------------------------ per frame
  /** sail 0..1 hoisted; side +-1; fill 0..1; boom = the boom's angle from dead aft (radians, + to the boat's right); glow 0..1 (a flare); t seconds. */
  set({ sail, side, fill, boom, glow, t, speed, wings = 0 }) {
    this.wings = wings;
    const dt = Math.min(0.1, Math.max(0, t - this.t)), G = SKIFF_BOOST_GLOW;
    this.L = sail; this.side = side; this.fill = fill; this.boomAngle = boom; this.glow = glow; this.t = t;
    this.pulseK = Math.max(0, this.pulseK - dt / G.pulseDur);
    if (!this.P) return;
    // the boost's glow: Lachryma's colour (the film walking through it) over the energy's warm light and the cloth's own, by the push
    const k = THREE.MathUtils.clamp(glow, 0, 1), p = this.pulseK * this.pulseK, tint = smooth(0, 0.4, Math.max(k, p));
    _lc.copy(LACH).lerp(featTint(t * G.filmRate, _fc, { bright: 1.1 }), G.film).lerp(WHITE, 0.35 * p);
    this.energyMat.emissive.copy(WARM).lerp(_lc, tint);
    this.clothMat.emissive.copy(WHITE).lerp(_lc, G.tintCloth * tint);
    this.clothMat.emissiveIntensity = PAINT_LIGHT + G.cloth * k + G.pulse.cloth * p;
    this.energyMat.emissiveIntensity = 0.3 + G.energy * k + G.pulse.energy * p;
    this.applyStakes(dt);
  }
  /** The board's stakes as they look (vfx/skiffboardlooks.js sets them each frame; SKIFF_STAKES): heat, luff, wear 0..1, tilt and roll rad. */
  stakes(o) { Object.assign(this.st, o); }
  /** A flash through the hull: a hit (white-hot), a mend (gold); fading in `dur` real seconds. */
  flash(k = 1, colour = 0xffffff, dur = 0.3) { if (k >= this.flashK) { this.flashK = Math.min(1.5, k); this.flashC.set(colour); this.flashDur = dur; } }
  /** Wrecked: the board's body hidden while its shards are out (vfx/skiffboardlooks.js), shown again as they fly home. */
  set broken(v) { if (this.body) this.body.visible = !v; }
  get broken() { return !!this.body && !this.body.visible; }
  /** The hull's painting worn over: a worn one (cracked, vfx/skiffboardlooks.js), or null for the painting under it. */
  setHullMap(tex) { this.hullWorn = tex || null; this.showHull(); }
  /** The hull painting chosen (vfx/skiffhulls.js), or null for the owner's: what the cracks are drawn over, still tinted by a hull glaze. */
  setHullPainting(tex) { this.hullPaint = tex || null; this.showHull(); }
  /** The painting under any wear: the chosen one, else the owner's. */
  get hullBase() { return this.hullPaint || this.hullTex; }
  showHull() { // (through the hull wrap worn, if any: vfx/skifftrims/wraps.js)
    const m = this.hullMat; if (!m) return; const t0 = this.hullWorn || this.hullBase, t = this.hullWrap?.(t0) ?? t0; if (m.map !== t) { m.map = m.emissiveMap = t; } }
  /** The stakes applied (set: each frame, after the boost's glow). */
  applyStakes(dt) {
    const S = this.st, K = SKIFF_STAKES, h = THREE.MathUtils.clamp(S.heat, 0, 1), w = THREE.MathUtils.clamp(S.wear, 0, 1);
    this.flashK = Math.max(0, this.flashK - dt / Math.max(0.05, this.flashDur));
    if (h > 0.001) { // (the cloth toward an ember: its own glow warmed, the cloth browned a little, flickering as it luffs)
      this.clothMat.emissive.lerp(EMBER, K.emberTint * h);
      this.clothMat.emissiveIntensity += K.emberGlow * h * h * (1 + 0.25 * S.luff * Math.sin(this.t * 23));
    }
    this.clothMat.color.setRGB(1, 1, 1).lerp(SCORCHED, K.browned * h * h);
    const H = this.hullMat; if (!H) return;
    const R = this.hullRest; // (the glaze fired on it, or the painting: worn from there)
    H.color.copy(R?.color ?? WHITE).lerp(DULL, K.dulled * w);
    H.roughness = (R?.rough ?? 0.7) + K.rough * w;
    const f = Math.min(1, this.flashK);
    H.emissive.copy(WHITE).lerp(_hc.copy(this.flashC), f);
    H.emissiveIntensity = PAINT_LIGHT * (1 - K.dim * w) + K.flash * f * f;
    // the tilt (the manual): about the rider's feet, so they stay on the deck and the tail drops to the sand
    const B = this.body; if (!B) return;
    if (Math.abs(S.tilt) + Math.abs(S.roll) < 1e-4) { if (B.position.lengthSq() || B.quaternion.w < 1) { B.position.set(0, 0, 0); B.quaternion.identity(); } return; }
    B.quaternion.setFromAxisAngle(Xax, -S.tilt).multiply(_q2.setFromAxisAngle(Zax, S.roll));
    _v.set(0, SKIFF.deck, SKIFF.rider.z);
    B.position.copy(_v).sub(_bv.copy(_v).applyQuaternion(B.quaternion));
  }
  /** A short flash of Lachryma's light through the boat (a perfect pop, a bank: vfx/racewaylooks.js), fading in SKIFF_BOOST_GLOW.pulseDur. */
  pulse(k = 1) { this.pulseK = Math.max(this.pulseK, Math.min(1, k)); }

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
      const flap = (1 - this.fill) * 0.05 * L, lf = this.st.luff * L, FL = SKIFF_STAKES.flutter; // (luffing from a scorch: the belly emptied, the cloth shaking)
      ['sail_1', 'sail_2', 'sail_3'].forEach((n, i) => {
        const x = this.side * this.fill * (1 - SKIFF_STAKES.emptied * lf) * BELLY[i] + flap * Math.sin(t * 3.2 + i * 1.7) * (i + 1) / 3
          + lf * FL.amp * (Math.sin(t * FL.rate + i * 2.3) * 0.7 + Math.sin(t * FL.rate * 1.9 + i) * 0.3) * (i + 1) / 3;
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
    // the glide (Skiff_Glide): the oars swung out as wings, by how far into the glide (this.wings 0..1, set by skiff.js), each tip
    // riding the air a little (a slow flex, the right a beat behind the left, as a gull's primaries do)
    if (this.wings > 0.001 && this.glideQ) {
      for (const n in this.glideQ) {
        const side = n.endsWith('L') ? 1 : -1, flex = SKIFF_GLIDE.flex * Math.sin(t * SKIFF_GLIDE.flexRate + (side > 0 ? 0 : 1.1));
        B[n].quaternion.slerp(_q.copy(this.glideQ[n]).multiply(_q2.setFromAxisAngle(Xax, flex)), this.wings);
      }
    }
    this.rom.apply();
    this.partsLook();
    this.paintLook?.pose(B); // (the pennant's length as worn)
  }

  /** The mast and the fins as worn (Dovina's MAST and FIN slots, progress/skiffparts.js): each mast section's rise lengthened or shortened,
   *  so the telescope folds the same in the summon and the recall; the stern's four fins drawn long and slim (Surf) or deep and broad
   *  (Race). Over the clip's pose, which writes every bone each frame, so nothing builds up. */
  partsLook() {
    const C = this.game?.skiffParts?.chosen, B = this.bone; if (!C || !B) return;
    const m = SKIFF_PARTS_LOOK.mast[C.mast], f = SKIFF_PARTS_LOOK.fin[C.fin];
    if (m) for (const n of ['mast_2', 'mast_3', 'mast_4', 'finial']) if (B[n]) B[n].position.y *= m;
    if (f) for (let i = 1; i <= 4; i++) { const b = B[`fin_${i}`]; if (b) b.scale.set(b.scale.x * f[0], b.scale.y * f[1], b.scale.z * f[2]); }
  }
}

/** The partner slots' looks: a mast section's rise (x), a fin's scale (its width, its length out of the stern, its depth). */
export const SKIFF_PARTS_LOOK = {
  mast: { 'mast.tall': 1.16, 'mast.short': 0.84 },
  fin: { 'fin.surf': [0.8, 1.4, 0.8], 'fin.race': [1.35, 1.12, 1.35] },
};
