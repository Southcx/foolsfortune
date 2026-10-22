// ---------------------------------------------------------------------------------------
// A GUEST'S PNEUKA JAR (Petra's round, 2026-10-22: co-op as our chatroom; SPIRIT-GARDEN.md item 21): a guest visiting your Spirit
// Garden drawn as their own Pneuka Jar on your planetoids, in their glazes. Petra's runtime carries where it is over the room's presence
// (coop/guests.js) and calls `show` each time it hears; this is only how it looks.
//
//   THE BODY    the owner's Jar (godhand/jar.js's model, cloned with its skeleton) in the guest's BODY glaze: the owner's painting kept as
//               its value (the brush's light and dark), its hue the glaze's colour, with the glaze's own roughness and sheen, so the
//               same Jar reads as fired in their glaze, not dyed. The core keeps the Vessoul's light, in their TRIM glaze.
//   THE HOP     the Jar's own spring (vfx/garden/jarhop.js, a Jar with no clips of its own): it hops when they hop and squashes when
//               they land, its halo and foot ring in their trim's colour, and a trail in a long arc.
//   THE LEAVE   unheard for `GUEST_JAR.stale` real seconds it shrinks away; `drop` takes it at once.
//
// One material program for every guest (their colours are uniforms of the same program). Plain names: the garden is in flux.
//
// Prior art: Journey's other traveller (the same body as yours, told apart by its glow), Animal Crossing's visitors (their own outfit on
// the same villager body), the glaze test tile (one form, many glazes: a potter's way of seeing what a glaze does on the same clay).
//
//   game.guestJars = new GuestJars(game)
//   .show(id, { foot: Vector3, up: Vector3, fwd: Vector3, look: { body, trim }, hops?: n, grounded?: bool, vel?: Vector3 })   .drop(id)
//   .update(rawDt)   (each frame while the Inner Realm is active)   .list (ids drawn)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { GLAZES, DEFAULT_LOOK } from '../../courier/vessel/glazes.js';
import { addOutline } from '../../render/outline.js';
import { JarHop } from './jarhop.js';

export const GUEST_JAR = { stale: 6, leave: 0.6, follow: 14 }; // (real s unheard before it goes; real s it shrinks away; 1/s it closes on where it was said to be)

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _x = new THREE.Vector3(), _f = new THREE.Vector3(), _c = new THREE.Color();
const glazeOf = (id, fall) => GLAZES[id]?.kind === 'glaze' ? GLAZES[id] : GLAZES[fall];

/** The Jar's clay in a glaze: the painting's value carries the brush, the glaze gives the hue (one program for all). */
function glazedJar(map) {
  const m = new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.4, metalness: 0.05, emissiveMap: map, emissive: 0x000000 });
  m.name = 'guest-jar-glaze';
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 texelColor = texture2D( map, vMapUv );
  float val = dot( texelColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
  diffuseColor.rgb *= mix( 0.35, 1.45, smoothstep( 0.04, 0.75, val ) ); // (the painting's value: the brush's light and dark under the glaze)
#endif`)
      .replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP
  totalEmissiveRadiance *= smoothstep( 0.55, 1.0, dot( texture2D( emissiveMap, vEmissiveMapUv ).rgb, vec3( 0.299, 0.587, 0.114 ) ) );
#endif`);
  };
  m.customProgramCacheKey = () => 'guest-jar-glaze';
  return m;
}

class GuestJar {
  constructor(owner, id, src) {
    this.id = id; this.heardAt = performance.now() / 1000; this.k = 0; this.leaving = false; this.hops = null; this.grounded = true; this.fallV = 0;
    this.foot = new THREE.Vector3(); this.to = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0); this.fwd = new THREE.Vector3(0, 0, 1); this.placed = false;
    const model = cloneSkinned(src);
    const drop = []; model.traverse((o) => { if (o.isSprite || (o.isMesh && o.material !== owner.srcBody && o.material !== owner.srcCore)) drop.push(o); });
    for (const o of drop) o.parent?.remove(o); // (only the clay and its core: the god hand's halo and cracks are its own)
    this.body = owner.base.clone(); this.core = owner.core.clone();
    model.traverse((o) => { if (!o.isMesh) return; const core = o.material === owner.srcCore; o.material = core ? this.core : this.body; o.castShadow = true; o.receiveShadow = true; if (!core) addOutline(o); });
    this.group = new THREE.Group(); this.group.name = `GuestJar:${id}`; this.group.add(model); this.group.visible = false;
    owner.game.scene.add(this.group);
    this.hop = new JarHop(model, { fx: owner.game.fx });
    this.look = null;
  }
  dress(look = {}) {
    const key = `${look.body}|${look.trim}`; if (key === this.look) return; this.look = key;
    const B = glazeOf(look.body, DEFAULT_LOOK.body), T = glazeOf(look.trim, DEFAULT_LOOK.trim);
    this.body.color.setHex(B.color); this.body.roughness = B.rough; this.body.metalness = B.metal;
    this.body.emissive.copy(_c.setHex(B.color)).multiplyScalar(0.38 + (B.glow || 0)); // (a little of its own light, as the painted Jar has, so the glaze carries through the garden's haze)
    this.core.color.setHex(T.color); this.core.emissive.setHex(T.color);
    this.hop.color.setHex(T.color); this.hop.halo.material.color.setHex(T.color); this.hop.foot.material.color.setHex(T.color);
  }
  dispose() { this.group.parent?.remove(this.group); this.hop.dispose(); this.body.dispose(); this.core.dispose(); }
}

export class GuestJars {
  constructor(game) { this.game = game; this.jars = new Map(); this.base = null; }
  get list() { return [...this.jars.keys()]; }

  /** The owner's Jar to clone, once it is loaded (the god hand's: godhand/jar.js). */
  ready() {
    if (this.base) return true;
    const V = this.game.god?.jar || this.game.realm?.god?.jar; if (!V?.group?.children[0] || !V.jarMat) return false;
    this.src = V.group.children[0]; this.srcBody = V.jarMat; this.srcCore = V.coreMat;
    this.base = glazedJar(V.jarMat.map); this.core = V.coreMat.clone();
    return true;
  }

  /** Heard of again: where its foot is on the planetoid, which way is up and ahead, its glazes, its hop count and footing. */
  show(id, { foot, up, fwd, look = null, hops = null, grounded = true, vel = null } = {}) {
    if (!foot || !this.ready()) return null;
    let J = this.jars.get(id);
    if (!J) { J = new GuestJar(this, id, this.src); this.jars.set(id, J); }
    J.heardAt = performance.now() / 1000; J.leaving = false;
    if (look || !J.look) J.dress(look || DEFAULT_LOOK); // (no look said: keep the one it wears)
    J.to.copy(foot); if (up) J.up.copy(up).normalize(); if (fwd) J.fwd.copy(fwd);
    if (!J.placed) { J.foot.copy(foot); J.placed = true; }
    if (hops != null && J.hops != null && hops !== J.hops) J.hop.hop();
    if (grounded && !J.grounded) J.hop.land(J.fallV || 4);
    J.fallV = vel && up ? Math.max(0, -vel.dot(J.up)) : J.fallV;
    J.hop.trail(!grounded && (vel?.length?.() ?? 0) > 9);
    J.hops = hops; J.grounded = grounded;
    return J;
  }

  /** Gone (left the garden, left the room): at once. */
  drop(id) { const J = this.jars.get(id); if (!J) return; J.dispose(); this.jars.delete(id); }

  update(raw = 1 / 60) {
    if (!this.jars.size) return;
    const now = performance.now() / 1000, here = !!this.game.realm?.active;
    for (const [id, J] of this.jars) {
      if (!here) { J.group.visible = false; continue; }
      if (now - J.heardAt > GUEST_JAR.stale) J.leaving = true;
      J.k = THREE.MathUtils.clamp(J.k + (J.leaving ? -raw : raw) / GUEST_JAR.leave, 0, 1);
      if (J.leaving && J.k <= 0) { this.drop(id); continue; }
      J.foot.lerp(J.to, 1 - Math.exp(-GUEST_JAR.follow * raw));
      _f.copy(J.fwd).projectOnPlane(J.up); if (_f.lengthSq() < 1e-4) _f.set(0, 0, 1).projectOnPlane(J.up); _f.normalize();
      _m.makeBasis(_x.crossVectors(J.up, _f).normalize(), J.up, _f); _q.setFromRotationMatrix(_m);
      J.group.quaternion.slerp(_q, Math.min(1, raw * 12)); J.group.position.copy(J.foot);
      const s = THREE.MathUtils.smootherstep(J.k, 0, 1); J.hop.base.setScalar(Math.max(0.001, s)); J.group.visible = true;
      J.hop.update(raw);
    }
  }
}
