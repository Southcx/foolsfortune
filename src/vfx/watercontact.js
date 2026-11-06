// ---------------------------------------------------------------------------------------
// THE WATERLINE RIPPLE (plain name; South, 2026-11-06: "neither the courier nor the solar skiff have a clear ripple when idling in a
// liquid; I think a simple sdf shader that checks where the objects intercept the liquid surface should suffice"): wherever the Courier's
// body or the Solar Skiff's hull cuts a liquid's surface, a soft ring of foam and ripples hugging the line where they meet, drawn on the
// surface. One small quad a body, laid on the water under it (the surface's height and its tilt: any game.water volume, the wave pool's
// probe and moving face, the Raceway's lakes and fords the board skims), its fragment shader taking the signed distance to the body's
// footprint at the waterline (a circle for a body standing or treading, a capsule along the stroke for a crawl, a rounded box along the
// heading for the hull) and drawing:
//   THE LINE     a thin bright foam line right at the contact, broken by a slow noise so it reads as froth, not paint
//   THE RINGS    rings radiating outward from the footprint, slow and few at rest (one calm breathing ring), quicker and more while it
//                moves, crowded ahead of the motion and drawn out behind it, faded with the distance
// It only adds a mark on the water: the ripple tank's rings (vfx/ripples.js) still answer every stroke and keel dent as before.
// Two draws at most (one for the Courier, one for the hull), one program (the two materials are the same shader), transparent, one-sided,
// no depth write, parked hidden in the scene from boot (CASEBOOK 113: warmed with the scene, never added on first use).
//
// Prior art: Sea of Thieves' (Rare, SIGGRAPH 2018) and Breath of the Wild's contact foam round what stands in water, the signed-distance
// footprint of a body at a plane (Inigo Quilez's 2D distance functions: the capsule, the rounded box), Super Mario Sunshine's rings round
// Mario idling in water, the house's ripple tank (vfx/ripples.js) and the skiff on water (vfx/skiffwaterlook.js), whose gating this follows.
//
//   game.waterContact = new WaterContact(game)   (boot/tools.js: a 'marks' system on the raw clock)   .update(raw)   WATER_CONTACT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The quads' half sizes (m), the Courier's footprint (its radius standing, the crawl's half length and radius), the hull's (half length,
 *  half width, corner radius), the lift over the surface (m: CASEBOOK 1), the speeds (m/s) a ring is at rest under and full over. */
export const WATER_CONTACT = {
  courier: { half: 2.6, r: 0.24, crawl: [0.75, 0.22] },
  skiff: { half: 3.0, box: [1.75, 0.5, 0.35], rings: 0.55 }, // (rings: their strength against the Courier's: a hull's ring is a hem, never a halo)
  lift: 0.03, rest: 0.4, full: 8,
};

const VERT = /* glsl */`
varying vec2 vL; varying vec3 vW;
void main() { vL = position.xy; vec4 w = modelMatrix * vec4(position.x, 0.0, -position.y, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG = /* glsl */`
uniform vec4 uShape;  // x: kind (0 a capsule along local x, 1 a rounded box), y: half length, z: half width (capsule: its radius), w: corner radius
uniform vec4 uMove;   // xy: the motion's way in local space (unit), z: its strength 0..1, w: the time
uniform vec3 uLook;   // x: the light (the day's), y: the quad's half size, z: the rings' strength
varying vec2 vL; varying vec3 vW;
float hashC(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noiseC(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hashC(i), hashC(i + vec2(1, 0)), f.x), mix(hashC(i + vec2(0, 1)), hashC(i + vec2(1, 1)), f.x), f.y); }
float footprint(vec2 p) {
  if (uShape.x < 0.5) { float h = max(uShape.y - uShape.z, 0.0); vec2 q = vec2(p.x - clamp(p.x, -h, h), p.y); return length(q) - uShape.z; }
  vec2 b = uShape.yz - uShape.w, q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uShape.w;
}
void main() {
  vec2 p = vL; float d = footprint(p);
  if (d < -0.02) discard; // (under the body: it is there)
  float t = uMove.w, k = uMove.z;
  // the motion: rings crowded ahead and drawn out behind (the distance read shorter ahead, longer behind)
  float ahead = dot(normalize(p + 1e-4), uMove.xy) * k;
  float dd = d * (1.0 + 0.45 * ahead);
  float n = noiseC(p * 6.0 + vec2(t * 0.6, -t * 0.4)) * 0.6 + noiseC(p * 13.0 - vec2(t * 0.9, t * 0.5)) * 0.4;
  // the line at the contact: thin, bright, broken into froth
  float line = (1.0 - smoothstep(0.0, 0.06 + 0.08 * k, dd + (n - 0.5) * 0.05)) * smoothstep(-0.02, 0.0, d) * (0.65 + 0.35 * n);
  // the rings: one calm breathing ring at rest, more and quicker while it moves
  float speed = mix(0.32, 1.1, k), spacing = mix(0.9, 0.5, k);
  float ph = (dd - t * speed) / spacing;
  float band = abs(fract(ph) - 0.5) * 2.0; // (1 between rings, 0 on one)
  float ring = pow(1.0 - smoothstep(0.0, 0.32, band), 1.5) * (0.6 + 0.4 * n);
  float fall = exp(-dd / mix(0.7, 1.2, k)) * (1.0 - smoothstep(uLook.y * 0.6, uLook.y, length(p)));
  float breathe = 0.65 + 0.35 * sin(t * 1.7);
  ring *= fall * mix(0.55 * breathe, 0.85, k) * smoothstep(0.03, 0.16, dd);
  ring *= uLook.z;
  float a = clamp(line * 0.9 + ring * 0.45, 0.0, 1.0);
  if (a < 0.004) discard;
  vec3 col = mix(vec3(0.6, 0.8, 0.84), vec3(0.98, 0.99, 0.97), clamp(line / max(line + ring, 1e-3), 0.0, 1.0)) * (0.45 + 0.55 * uLook.x); // (the rings a cooler water-light, the line foam-white)
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const _shape = new THREE.Vector4(), _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0), _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _y = new THREE.Quaternion(), _v = new THREE.Vector3();

export class WaterContact {
  constructor(game) {
    this.game = game; this.t = 0;
    this.courier = this.quad('watercontact-courier', WATER_CONTACT.courier.half);
    this.skiff = this.quad('watercontact-skiff', WATER_CONTACT.skiff.half); this.skiff.material.uniforms.uLook.value.z = WATER_CONTACT.skiff.rings;
  }
  quad(name, half) {
    const g = new THREE.PlaneGeometry(half * 2, half * 2); // (its own 2D coordinates are the footprint's; the vertex lays it flat, facing up)
    const m = new THREE.ShaderMaterial({
      name: 'water-contact', vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uShape: { value: new THREE.Vector4() }, uMove: { value: new THREE.Vector4() }, uLook: { value: new THREE.Vector3(1, half, 1) } },
      transparent: true, depthWrite: false, side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(g, m); mesh.name = name; mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.userData.zoneFree = true; mesh.visible = false;
    mesh.position.set(0, -50, 0); this.game.scene?.add(mesh); // (parked hidden from boot: warmed with the scene)
    mesh.userData.on = 0; mesh.userData.k = 0;
    return mesh;
  }

  /** The liquid's surface under (x, z) near height y, its normal into `n`: a water volume (the boxes, the wave pool's probe), else the
   *  Raceway's water the board skims; null when there is none there. */
  surfaceAt(x, y, z, n) {
    const g = this.game, W = g.water, v = W?.at?.(x, y, z);
    n.copy(UP);
    if (v) {
      const s = v.surfaceAt ? v.surfaceAt(x, z) : v.surface;
      if (v.wavePool) g.raceway?.waterNormal?.(x, z, n);
      return s;
    }
    const R = g.raceway;
    if (R?.active && R.rideHeight) {
      const h = R.rideHeight(x, z), ground = R.heightAt(x, z);
      if (h > ground + 0.05) { R.waterNormal?.(x, z, n) || n.copy(UP); return h; }
    }
    return null;
  }

  /** Lay one quad on the surface at (x, y, z) facing `yaw`, its footprint and motion; or ease it out. */
  lay(mesh, at, yaw, shape, vel, raw) {
    const U = mesh.material.uniforms, C = WATER_CONTACT;
    mesh.userData.on += ((at ? 1 : 0) - mesh.userData.on) * (1 - Math.exp(-6 * raw));
    if (!at) { if (mesh.userData.on < 0.02) mesh.visible = false; return; }
    mesh.visible = true;
    mesh.position.set(at.x, at.y + C.lift, at.z);
    _q.setFromUnitVectors(UP, _n); _y.setFromAxisAngle(UP, yaw); mesh.quaternion.copy(_q).multiply(_y);
    U.uShape.value.copy(shape);
    const sp = Math.hypot(vel.x, vel.z), k = Math.min(1, Math.max(0, (sp - C.rest) / (C.full - C.rest)));
    mesh.userData.k += (k - mesh.userData.k) * (1 - Math.exp(-4 * raw));
    // the motion's way in the quad's own 2D frame (its x the world's (cos yaw, -sin yaw), its y the world's (-sin yaw, -cos yaw))
    const c = Math.cos(yaw), s = Math.sin(yaw), lx = sp > 0.05 ? (vel.x * c - vel.z * s) / sp : 1, lz = sp > 0.05 ? (-vel.x * s - vel.z * c) / sp : 0;
    U.uMove.value.set(lx, lz, mesh.userData.k * mesh.userData.on, this.t);
    U.uLook.value.x = this.game.daylight?.k?.day ?? 1;
  }

  update(raw) {
    this.t = (this.t + raw) % 628.3185; // (wrapped at whole periods of every sine it feeds: CASEBOOK 119)
    const g = this.game, P = g.player, C = WATER_CONTACT;
    if (!P) return;
    const sk = P.techs?.get?.('skiff'), riding = !!(sk?.active && sk.phase === 'ride' && sk.skiff?.group);
    // the hull: on the water, not in the air
    let hullAt = null;
    if (riding && sk.onWater && !sk.air) {
      const G = sk.skiff.group.position, y = this.surfaceAt(G.x, G.y, G.z, _n);
      if (y != null && Math.abs(G.y - y) < 1.5) hullAt = _v.set(G.x, y, G.z);
    }
    const B = C.skiff.box;
    this.lay(this.skiff, hullAt, (sk?.heading ?? 0) - Math.PI / 2, _shape.set(1, B[0], B[1], B[2]), sk?.v || P.vel, raw);
    // the body: where its height crosses the surface (feet under it, head over it), off the board
    let bodyAt = null, yaw = 0, sw = null;
    if (!riding) {
      const p = P.renderPos || P.pos, y = this.surfaceAt(p.x, p.y + 0.6, p.z, _n);
      sw = P.techs?.active?.id === 'swim' ? P.techs.active : null;
      if (y != null && p.y < y + 0.05 && p.y + 1.75 > y && !(sw?.under && p.y + 1.3 < y)) { // (a dive under: no line on the surface)
        bodyAt = _w.set(p.x, y, p.z);
        const hs = Math.hypot(P.vel.x, P.vel.z); yaw = hs > 0.3 ? Math.atan2(P.vel.x, P.vel.z) - Math.PI / 2 : (this.yawC ?? 0);
        this.yawC = yaw;
      }
    }
    const crawl = sw && !sw.under ? Math.min(1, sw.crawl || 0) : 0, Cc = C.courier;
    this.lay(this.courier, bodyAt, yaw, _shape.set(0, Cc.r + (Cc.crawl[0] - Cc.r) * crawl, Cc.r + (Cc.crawl[1] - Cc.r) * crawl, 0), P.vel, raw);
  }

  dispose() { for (const m of [this.courier, this.skiff]) { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); } }
}
