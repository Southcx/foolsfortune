// ---------------------------------------------------------------------------------------
// THE WATERLINE RIPPLE (plain name; South, 2026-11-06: "neither the courier nor the solar skiff have a clear ripple when idling in a
// liquid; I think a simple sdf shader that checks where the objects intercept the liquid surface should suffice"; and after the first
// firing: "the sdf used for the ripple around the objects in water needs to push out and off from the leading edge and lower its alpha
// as it trails off"): wherever the Courier's body or the Solar Skiff's hull cuts a liquid's surface, foam and ripples drawn on that
// surface. One quad a body laid on the water under it (the surface's height and its tilt: any game.water volume, the wave pool's probe
// and moving face, the Raceway's lakes and fords the board skims), turned to the body's motion through the water (its +x ahead, the
// footprint turned inside it to the body's own heading) and reaching far behind for the wake; its fragment shader takes the signed
// distance to the body's footprint at the waterline (a circle standing or treading, a capsule along the stroke for a crawl, a rounded
// box along the heading for the hull) and draws, by how fast it moves through the water (k 0 at rest .. 1 under way; its speed `sp`):
//   THE LINE       froth at the contact, broken by noise; under way bright at the stem and along the sides, gone at the stern
//                  (the wake opens there: never a closed loop)
//   THE BOW WAVE   the water heaped on the stem, splitting there into two crests that peel off along the sides, standing further off
//                  toward the stern (South, 2026-11-06, on the second firing: "there's no wake off of the bow")
//   THE ARMS       Kelvin's cusp lines from an apex at the stem, 19.47 degrees either side whatever the speed, running into the bow
//                  wave beside the hull and on behind it, feathered into short oblique crests (the diverging waves), a few more just
//                  inside each
//   THE TRANSVERSE crests across the V, their length the speed's (2 pi v^2 / g, held to what reads), bowed back toward the hull
//   THE CHURN      the stern's broken water on the centreline, narrowing and settling
//                  The wake fades with its age (metres behind the stem over the speed) and is gone well before the quad's edges.
//   A SWIMMER      the water over the body broken and foamy, never a hole in the footprint's shape; its foam and wake lighter than a hull's
//   AT REST        one soft ring breathing out from the contact, fading as it grows, faintest at its edge, and the froth at the line
// The one wake on any liquid (South: "we don't need to double up on the ripple"): the ripple tank (vfx/ripples.js) no longer takes the
// Solar Skiff's keel dents (vfx/skiffwaterlook.js) nor the swimming Courier's running wake dents (vfx/waterfx.js drawnWake); it still
// rings for strokes, dives, splashes and rain.
// Two draws at most (one for the Courier, one for the hull), one program (the two materials are the same shader), transparent, one-sided,
// no depth write, its depth drawn 0.45 m toward the eye along its own ray (the water grid's straight cells cut under the true surface), parked hidden in the scene from boot (CASEBOOK 113: warmed with the scene, never added on first use).
//
// Prior art: Lord Kelvin's ship-wave pattern (1887: the wake's cusp lines at 19.47 degrees whatever the speed, the transverse and
// diverging waves), Sea of Thieves' (Rare, SIGGRAPH 2018) and Breath of the Wild's contact foam round what stands in water and the bow
// wave off a hull, the signed-distance footprint of a body at a plane (Inigo Quilez's 2D distance functions: the capsule, the rounded
// box), Super Mario Sunshine's rings round Mario idling in water, the house's ripple tank (vfx/ripples.js) and the skiff on water
// (vfx/skiffwaterlook.js), whose gating this follows.
//
//   game.waterContact = new WaterContact(game)   (boot/tools.js: a 'marks' system on the raw clock)   .update(raw)   WATER_CONTACT
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The quads' reach (m: ahead, behind, to each side of the body), the Courier's footprint (its radius standing, the crawl's half length
 *  and radius), the hull's (half length, half width, corner radius), the speed (m/s through the water) each is fully under way at, the
 *  rings' and the wake's strength (a hull's ring is a hem, never a halo), the foam's (a swimmer's lighter than a hull's), the lift over the surface (m: CASEBOOK 1), the speed a body is at rest under,
 *  the depth bias toward the eye (m). */
export const WATER_CONTACT = {
  courier: { reach: [2.8, 9, 4.5], r: 0.24, crawl: [0.75, 0.22], full: 2.2, rings: 0.25, foam: 0.5 },
  skiff: { reach: [3.4, 20, 8.5], box: [1.75, 0.5, 0.35], full: 10, rings: 0.55, foam: 1 },
  lift: 0.03, rest: 0.4, bias: 0.45, // (bias: m its depth is drawn toward the eye, over the water grid's straight cells)
};

const VERT = /* glsl */`
varying vec2 vL;
uniform float uBias;
void main() {
  vL = position.xy; vec4 w = modelMatrix * vec4(position.x, 0.0, -position.y, 1.0), v = viewMatrix * w;
  // drawn a little toward the eye along its own ray (where it lands on the screen unchanged, only its depth): the water it lies on is a
  // grid whose straight cells cut under the true surface by a hand or more (vfx/waves/water.js: 3 m cells far off the break), and would bury it
  v.xyz *= max(0.0, 1.0 - uBias / max(length(v.xyz), 1e-3));
  gl_Position = projectionMatrix * v;
}`;

const FRAG = /* glsl */`
uniform vec4 uShape;  // x: kind (0 a capsule along the body's x, 1 a rounded box), y: half length, z: half width (capsule: its radius), w: corner radius
uniform vec4 uMove;   // xy: the body's heading in the quad's frame (cos, sin; the quad's +x is the motion through the water), z: under way 0..1, w: the time
uniform vec4 uLook;   // x: the light (the day's), y: the rings' strength, z: the presence (eased in and out), w: the speed through the water (m/s)
uniform vec3 uSize;   // the quad's reach: ahead, behind, to each side
uniform float uFoam;  // the foam's strength (the line, the bow wave): a hull's 1, a swimmer's less
varying vec2 vL;
const float KELVIN = ${Math.tan(19.47 * Math.PI / 180).toFixed(5)}; // (the cusp lines' half-angle, any speed)
float hashC(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noiseC(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hashC(i), hashC(i + vec2(1, 0)), f.x), mix(hashC(i + vec2(0, 1)), hashC(i + vec2(1, 1)), f.x), f.y); }
float footprint(vec2 p) {
  if (uShape.x < 0.5) { float h = max(uShape.y - uShape.z, 0.0); vec2 q = vec2(p.x - clamp(p.x, -h, h), p.y); return length(q) - uShape.z; }
  vec2 b = uShape.yz - uShape.w, q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uShape.w;
}
float bandC(float x, float w) { return exp(-(x * x) / (w * w)); }
void main() {
  vec2 p = vL, hd = uMove.xy;
  vec2 q = vec2(dot(p, hd), dot(p, vec2(-hd.y, hd.x))); // (the body's own frame)
  float d = footprint(q);
  if (d < -0.02 && uShape.x > 0.5) discard; // (under the hull: it is there)
  float t = uMove.w, k = uMove.z, sp = max(uLook.w, 0.05);
  // the footprint's reach along the motion (its stem at +ex) and across it
  float ex = abs(hd.x) * uShape.y + abs(hd.y) * uShape.z, ey = abs(hd.y) * uShape.y + abs(hd.x) * uShape.z;
  float n = noiseC(p * 6.0 + vec2(t * 0.6, -t * 0.4)) * 0.6 + noiseC(p * 13.0 - vec2(t * 0.9, t * 0.5)) * 0.4;
  float nf = noiseC(p * vec2(1.6, 4.0) + vec2(t * 0.7, 0.0));
  float ey2 = abs(p.y);
  // where along the body this point lies: 1 at the stem, 0 at the stern (and behind it)
  float along = clamp((p.x + ex) / (2.0 * ex), 0.0, 1.0);
  // THE LINE: froth at the contact; under way bright at the stem and along the sides, gone at the stern (the wake opens there)
  float lw = 0.04 + 0.08 * k * along;
  float line = (1.0 - smoothstep(0.0, lw, d + (n - 0.5) * (0.04 + 0.08 * k))) * smoothstep(-0.02, 0.0, d) * (0.55 + 0.45 * n);
  line *= mix(1.0, smoothstep(0.05, 0.45, along), k);
  // a swimmer's body just under the surface: the water over it broken and foamy, never a hole in the shape of the footprint
  float over = uShape.x < 0.5 ? smoothstep(0.0, -0.06, d) * (0.12 + 0.25 * k) * smoothstep(0.3, 0.7, n) : 0.0;
  line = max(line * step(-0.02, d), over);
  // AT REST: one ring breathing out of the contact, fading as it grows, faintest at its edge
  float R = 1.5 + 2.4 * uShape.z;
  float ph = fract(t * 0.33), ph2 = fract(t * 0.33 + 0.5);
  float ring = bandC(d - ph * R, 0.07 + 0.12 * ph) * pow(1.0 - ph, 1.6) * smoothstep(0.0, 0.12, ph);
  float ring2 = bandC(d - ph2 * R, 0.07 + 0.12 * ph2) * pow(1.0 - ph2, 1.6) * smoothstep(0.0, 0.12, ph2);
  float halo = exp(-d / 0.35) * 0.3 * (0.75 + 0.25 * sin(t * 1.7));
  float rest = (max(ring, ring2 * 0.7) * (0.6 + 0.4 * n) + halo) * smoothstep(0.02, 0.1, d) * (1.0 - smoothstep(R * 0.6, R, d)) * (1.0 - k);
  // the wake's frame: b metres behind the stem (its apex a hand ahead of it), its age (real s since the stem passed)
  float xa = ex + 0.06 + 0.12 * k, b = xa - p.x, age = max(b, 0.0) / sp;
  float fade = exp(-age / 2.4) * (1.0 - smoothstep(0.4, 0.68, b / uSize.y)); // (fainter with age, gone well before the quad's end)
  // THE BOW WAVE: the stem splits the water; two crests peel off it hugging the sides, standing further off toward the stern
  float off = (0.05 + 0.3 * k) * (0.35 + 0.65 * (1.0 - along));
  float hug = bandC(d - off, 0.05 + 0.1 * k * (1.0 - along)) * smoothstep(0.0, 0.3, along + 0.15) * (0.7 + 0.3 * nf);
  float pile = bandC(length(p - vec2(ex + 0.04, 0.0)), 0.12 + 0.18 * k) * 0.8; // (the water heaped on the stem itself)
  // THE ARMS: Kelvin's cusp lines from the apex at the stem, 19.47 degrees either side; beside the hull they run into the bow wave
  float ay = max(b, 0.0) * KELVIN;
  float aw = (0.06 + 0.05 * k) * (1.0 + 0.6 * clamp(b / 6.0, 0.0, 1.0)) * (1.0 - 0.5 * clamp(b / uSize.y, 0.0, 1.0));
  float feather = 0.6 + 0.4 * sin((b * 2.6 - ey2 * 6.0) / (0.5 + 0.12 * sp) + t * 2.0 + nf * 2.0); // (the diverging waves: short oblique crests along the cusp)
  float arm = bandC(ey2 - ay, aw) * feather * smoothstep(-0.05, 0.25, b) * step(-0.02, d);
  // the diverging crests just inside each arm, stationary in the hull's frame, a little shimmer
  float inside = ay - ey2;
  float div = bandC(fract((inside * 2.2 + b * 0.35) / (0.4 + 0.05 * sp)) - 0.5, 0.12) * smoothstep(0.0, 0.15, inside) * exp(-inside / 0.6) * 0.55;
  // THE TRANSVERSE WAVES: crests across the V, their length the speed's (2 pi v^2 / g, held to what reads), bowed back toward the hull
  float lam = clamp(6.2832 * sp * sp / 9.81, 0.6, 3.5);
  float tb = b + 0.5 * ey2 * ey2 / (b + 1.0);
  float trans = (0.5 + 0.5 * cos(6.2832 * tb / lam)) * smoothstep(0.0, 0.25, inside) * smoothstep(0.3, 1.5, b) * 0.32;
  // THE CHURN: the stern's broken water on the centreline, narrowing and settling as it ages
  float bs = -ex - p.x;
  float churn = bandC(p.y, ey * (0.85 - 0.35 * clamp(bs / 4.0, 0.0, 1.0))) * exp(-max(bs, 0.0) / (1.2 + 0.25 * sp)) * smoothstep(-0.3, 0.3, bs);
  churn *= smoothstep(0.35, 0.7, n * 0.7 + nf * 0.5);
  float wake = (arm + div + trans + churn * 0.9) * fade * uLook.y;
  line *= uFoam; hug *= uFoam; pile *= uFoam;
  float white = line + (hug + pile) * k; // (the foam-white: the line, the bow wave)
  // nothing ends on the quad's edges: everything eased off well inside them
  float edge = (1.0 - smoothstep(uSize.x * 0.55, uSize.x * 0.9, p.x)) * (1.0 - smoothstep(uSize.y * 0.7, uSize.y * 0.92, -p.x)) * (1.0 - smoothstep(uSize.z * 0.6, uSize.z * 0.9, ey2));
  float a = clamp(line * 0.85 + (hug + pile) * 0.8 * k + wake * 0.55 * k + rest * 0.5 * uLook.y, 0.0, 1.0) * edge * uLook.z;
  if (a < 0.004) discard;
  float wf = clamp((white + churn * fade * 0.6 * k) / max(white + wake * k + rest + 1e-3, 1e-3), 0.0, 1.0);
  vec3 col = mix(vec3(0.62, 0.82, 0.86), vec3(0.98, 0.99, 0.97), wf) * (0.45 + 0.55 * uLook.x); // (the wake's crests a cool water-light, the foam white)
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const _shape = new THREE.Vector4(), _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0), _n = new THREE.Vector3(), _q = new THREE.Quaternion(), _y = new THREE.Quaternion(), _v = new THREE.Vector3();

export class WaterContact {
  constructor(game) {
    this.game = game; this.t = 0;
    this.courier = this.quad('watercontact-courier', WATER_CONTACT.courier);
    this.skiff = this.quad('watercontact-skiff', WATER_CONTACT.skiff);
  }
  quad(name, C) {
    const [front, back, side] = C.reach;
    const g = new THREE.PlaneGeometry(front + back, side * 2).translate((front - back) / 2, 0, 0); // (its own 2D coordinates are the wake's: +x ahead; the vertex lays it flat, facing up)
    const m = new THREE.ShaderMaterial({
      name: 'water-contact', vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uShape: { value: new THREE.Vector4() }, uMove: { value: new THREE.Vector4(1, 0, 0, 0) }, uLook: { value: new THREE.Vector4(1, C.rings, 0, 0) }, uSize: { value: new THREE.Vector3(front, back, side) }, uBias: { value: WATER_CONTACT.bias }, uFoam: { value: C.foam } },
      transparent: true, depthWrite: false, side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(g, m); mesh.name = name; mesh.renderOrder = 3; mesh.frustumCulled = false; mesh.userData.zoneFree = true; mesh.visible = false;
    mesh.position.set(0, -50, 0); this.game.scene?.add(mesh); // (parked hidden from boot: warmed with the scene)
    Object.assign(mesh.userData, { on: 0, k: 0, yaw: 0, full: C.full });
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

  /** Lay one quad on the surface at (x, y, z), turned to the motion through the water `vel` (held where it was at rest), the footprint
   *  turned inside it to the body's heading `yaw`; or ease it out. */
  lay(mesh, at, yaw, shape, vel, raw) {
    const U = mesh.material.uniforms, C = WATER_CONTACT, ud = mesh.userData;
    ud.on += ((at ? 1 : 0) - ud.on) * (1 - Math.exp(-6 * raw));
    if (!at) { if (ud.on < 0.02) mesh.visible = false; return; }
    mesh.visible = true;
    mesh.position.set(at.x, at.y + C.lift, at.z);
    const sp = Math.hypot(vel.x, vel.z), k = Math.min(1, Math.max(0, (sp - C.rest) / (ud.full - C.rest)));
    if (sp > C.rest) ud.yaw = Math.atan2(vel.x, vel.z) - Math.PI / 2; // (the quad's +x along the motion; the same yaw convention as the body's)
    else if (ud.k < 0.02) ud.yaw = yaw;
    _q.setFromUnitVectors(UP, _n); _y.setFromAxisAngle(UP, ud.yaw); mesh.quaternion.copy(_q).multiply(_y);
    U.uShape.value.copy(shape);
    ud.k += (k - ud.k) * (1 - Math.exp(-4 * raw));
    const rel = yaw - ud.yaw; // (the body's heading in the quad's frame)
    U.uMove.value.set(Math.cos(rel), Math.sin(rel), ud.k, this.t);
    U.uLook.value.x = this.game.daylight?.k?.day ?? 1; U.uLook.value.z = ud.on; U.uLook.value.w = sp;
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
