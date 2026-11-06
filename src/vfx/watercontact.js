// ---------------------------------------------------------------------------------------
// THE WATERLINE RIPPLE (plain name; South, 2026-11-06: "neither the courier nor the solar skiff have a clear ripple when idling in a
// liquid; I think a simple sdf shader that checks where the objects intercept the liquid surface should suffice"; and after the first
// firing: "the sdf used for the ripple around the objects in water needs to push out and off from the leading edge and lower its alpha
// as it trails off"): wherever the Courier's body or the Solar Skiff's hull cuts a liquid's surface, foam and ripples drawn on that
// surface. One quad a body laid on the water under it (the surface's height and its tilt: any game.water volume, the wave pool's probe
// and moving face, the Raceway's lakes and fords the board skims), turned to the body's motion through the water (its +x ahead, the
// footprint turned inside it to the body's own heading) and reaching far behind for the wake; its fragment shader takes the signed
// distance to the body's footprint at the waterline (a circle standing or treading, a capsule along the stroke for a crawl, a rounded
// box along the heading for the hull) and draws, by how fast it moves (k 0 at rest .. 1 under way):
//   THE LINE       froth at the contact, broken by noise; under way bright at the bow and the sides, thinned to nothing at the stern
//                  (the wake opens there: never a closed loop)
//   THE BOW WAVE   a bright crest pushed ahead of the leading edge, standing further off the faster it goes, peeling out along the sides
//   THE WAKE       two arms streaming back from just behind the bow at Kelvin's half-angle (19.47 degrees, any speed), feathered into
//                  short oblique crests running outward (the diverging waves), echoed by a crest or two inside each; thinner and fainter
//                  the further back, gone at the quad's end; a churned streak of foam on the centreline close behind the stern
//   AT REST        one soft ring breathing out from the contact, fading as it grows, faintest at its edge, and the froth at the line
// It only adds a mark on the water: the ripple tank's rings (vfx/ripples.js) still answer every stroke and keel dent as before.
// Two draws at most (one for the Courier, one for the hull), one program (the two materials are the same shader), transparent, one-sided,
// no depth write, parked hidden in the scene from boot (CASEBOOK 113: warmed with the scene, never added on first use).
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
 *  rings' strength (a hull's ring is a hem, never a halo), the lift over the surface (m: CASEBOOK 1), the speed a body is at rest under. */
export const WATER_CONTACT = {
  courier: { reach: [2.8, 9, 4.5], r: 0.24, crawl: [0.75, 0.22], full: 2.2, rings: 0.75 },
  skiff: { reach: [3.4, 18, 7.5], box: [1.75, 0.5, 0.35], full: 10, rings: 0.55 },
  lift: 0.03, rest: 0.4, kelvin: Math.tan(19.47 * Math.PI / 180),
};

const VERT = /* glsl */`
varying vec2 vL;
void main() { vL = position.xy; vec4 w = modelMatrix * vec4(position.x, 0.0, -position.y, 1.0); gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG = /* glsl */`
uniform vec4 uShape;  // x: kind (0 a capsule along the body's x, 1 a rounded box), y: half length, z: half width (capsule: its radius), w: corner radius
uniform vec4 uMove;   // xy: the body's heading in the quad's frame (cos, sin; the quad's +x is the motion), z: under way 0..1, w: the time
uniform vec4 uLook;   // x: the light (the day's), y: the rings' strength, z: the presence (eased in and out), w: the wake's tan
uniform vec3 uSize;   // the quad's reach: ahead, behind, to each side
varying vec2 vL;
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
  if (d < -0.02) discard; // (under the body: it is there)
  float t = uMove.w, k = uMove.z;
  // the footprint's reach along the motion and across it
  float ex = abs(hd.x) * uShape.y + abs(hd.y) * uShape.z, ey = abs(hd.y) * uShape.y + abs(hd.x) * uShape.z;
  float n = noiseC(p * 6.0 + vec2(t * 0.6, -t * 0.4)) * 0.6 + noiseC(p * 13.0 - vec2(t * 0.9, t * 0.5)) * 0.4;
  float nf = noiseC(p * vec2(2.2, 5.0) + vec2(t * 1.3, 0.0));
  // how far ahead this point lies of the body (1 straight ahead, -1 behind), read on the footprint's own ellipse
  float ahead = p.x / ex / (length(p / vec2(ex, ey)) + 1e-3);
  float fore = smoothstep(-0.55, 0.6, ahead); // (1 at the bow and its shoulders, 0 at the stern)
  // THE LINE: froth at the contact; under way thinned toward the stern so the wake opens there
  float lw = 0.05 + 0.1 * k * fore;
  float line = (1.0 - smoothstep(0.0, lw, d + (n - 0.5) * (0.05 + 0.1 * k))) * smoothstep(-0.02, 0.0, d) * (0.55 + 0.45 * n);
  line *= mix(1.0, 0.15 + 0.85 * fore, k);
  // AT REST: one ring breathing out of the contact, fading as it grows, faintest at its edge
  float R = 1.5 + 2.4 * uShape.z; // (how far it breathes out: a hull's further than a body's)
  float ph = fract(t * 0.33), r0 = ph * R, rd = d - r0;
  float ring = bandC(rd, 0.07 + 0.12 * ph) * pow(1.0 - ph, 1.6) * smoothstep(0.0, 0.12, ph);
  float ph2 = fract(t * 0.33 + 0.5), ring2 = bandC(d - ph2 * R, 0.07 + 0.12 * ph2) * pow(1.0 - ph2, 1.6) * smoothstep(0.0, 0.12, ph2);
  float halo = exp(-d / 0.35) * 0.35 * (0.75 + 0.25 * sin(t * 1.7));
  float rest = (max(ring, ring2 * 0.7) * (0.6 + 0.4 * n) + halo) * smoothstep(0.02, 0.1, d) * (1.0 - smoothstep(R * 0.7, R, d));
  rest *= (1.0 - k) * uLook.y;
  // THE BOW WAVE: a crest standing off the leading edge, further the faster, peeling out along the sides and gone by the stern
  float off = 0.1 + 0.45 * k + (1.0 - ahead) * 0.35 * k;
  float bow = bandC(d - off, 0.08 + 0.12 * k) * smoothstep(-0.3, 0.45, ahead) * (0.6 + 0.4 * nf);
  bow += bandC(d - off * 0.45, 0.06) * smoothstep(0.2, 0.9, ahead) * 0.5; // (the pile of water right on the bow)
  bow *= k;
  // THE WAKE: Kelvin's two arms from the apex just behind the bow, back at 19.47 degrees, feathered into oblique crests running out
  float xa = ex * 0.35, b = xa - p.x; // (metres behind the apex)
  float ay = ey + off * 0.9 + max(b, 0.0) * uLook.w, ey2 = abs(p.y);
  float trail = clamp(b / uSize.y, 0.0, 1.0), behind = smoothstep(0.0, 1.2, b);
  float aw = mix(0.22, 0.07, trail) + 0.1 * k * (1.0 - trail);
  float feather = 0.55 + 0.45 * sin(b * 3.1 - ey2 * 5.2 + t * 4.0 + nf * 2.0); // (the diverging crests: short, oblique, running outward)
  float arm = bandC(ey2 - ay, aw) * feather;
  float inner = ay - ey2; // (inside the V: an echo crest or two, moving out to the arm)
  float echo = bandC(fract(inner / 0.55 - t * 0.9) - 0.5, 0.13) * smoothstep(0.0, 0.3, inner) * exp(-inner / 0.7) * 0.6;
  float fade = exp(-b / (uSize.y * 0.45)) * (1.0 - smoothstep(0.7, 1.0, trail));
  float wake = (arm + echo) * fade * behind * (0.65 + 0.35 * n);
  // the churn: a frothy streak on the centreline close behind the stern, narrowing as it goes
  float bs = -ex - p.x; // (behind the stern)
  float churn = bandC(p.y, ey * (0.9 - 0.4 * clamp(bs / 4.0, 0.0, 1.0))) * exp(-max(bs, 0.0) / 2.2) * smoothstep(-0.4, 0.4, bs);
  churn *= smoothstep(0.42, 0.75, n * 0.7 + nf * 0.5) * 0.8;
  float moving = (bow + (wake + churn) * uLook.y) * k;
  // the quad's own edges eased off, so nothing ends on a line
  float edge = (1.0 - smoothstep(uSize.x * 0.75, uSize.x, p.x)) * (1.0 - smoothstep(uSize.y * 0.8, uSize.y, -p.x)) * (1.0 - smoothstep(uSize.z * 0.75, uSize.z, abs(p.y)));
  float foam = line + bow * 0.8; // (the white: the line and the bow; the rings and the wake a cooler water-light)
  float a = clamp(line * 0.9 + bow * 0.75 + (rest + (wake + churn) * uLook.y * k) * 0.5, 0.0, 1.0) * edge * uLook.z;
  if (a < 0.004) discard;
  vec3 col = mix(vec3(0.6, 0.8, 0.84), vec3(0.98, 0.99, 0.97), clamp(foam / max(foam + rest + moving * 0.5, 1e-3) + churn * 0.5, 0.0, 1.0)) * (0.45 + 0.55 * uLook.x);
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
      uniforms: { uShape: { value: new THREE.Vector4() }, uMove: { value: new THREE.Vector4(1, 0, 0, 0) }, uLook: { value: new THREE.Vector4(1, C.rings, 0, WATER_CONTACT.kelvin) }, uSize: { value: new THREE.Vector3(front, back, side) } },
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
    U.uLook.value.x = this.game.daylight?.k?.day ?? 1; U.uLook.value.z = ud.on;
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
