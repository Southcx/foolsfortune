// ---------------------------------------------------------------------------------------
// A SHRINE GATE (docs/plans/SHRINES.md, Dovina's; docs/plans/HANKO.md 6.6; OVERLAY.md 10.5c, the owner on round six's mock: "chef's
// kiss"). A torii of glazed clay in the Clay dress (Anagami: kintsugi gold in its mends) with TWO CRADLES for the Pneuka Jar (the
// owner: "one ... which opens up access to your Spirit Garden, and the other ... the teleportation option between shrine gates"):
//   THE THRESHOLD'S  an octagonal clay socket sunk in a glazed sill between the pillars, four bronze tines round its well: onward,
//                    travel. Sealed (`wake()`), its seam and pad ring light in the window colour, the tines close on the Jar's foot,
//                    and the light leaves the sill both ways along carved traces in the oil film, climbs both pillars past their
//                    chevrons (the Stargate's), crosses the nuki and lights the kasagi last; then the film's veil rises in the opening.
//                    Unsealed (`wake(false)`), the traces go dark.
//   THE ARCH'S       a round bronze collar upright in the tablet under the shimaki, three leaf springs: inward, the Spirit Garden.
//                    Its light runs in from the sigils at the shimaki's ends, in Lachryma's blue, to the tablet's chevrons and the
//                    socket, and falls through: the door fills from its centre with your Spirit Garden. The two circuits never meet.
//   UNFOUND          the clay dull, every trace carved and dead      FOUND   the shimaki's two sigils glow, a slow breath
//   RESTING          the threshold's pad ring breathes               OPEN    the arch's run, then the door onto the Spirit Garden
// Your imprint in either cradle is the imprint's look's (vfx/sealimprint.js, on seal.set), not this model's.
//
// Its size: the pillars stand where world/shrines.js puts their colliders (centres 0.94 m either side), so the gate is round six's at
// 0.36 (GATE); the threshold's cradle is at the Pneuka Jar's own scale (its foot is 0.27 m round: the well is 0.28), so it fills the sill.
//
// Prior art: round six's gate (Calissa's mock, overlay/r6-gate, ported: the torii, both cradles, the circuits, the door); torii anatomy
// (kasagi, shimaki, nuki, gakuzuka the tablet, hashira; a shimenawa with shide) and a temple gate's shikii (the sill you step over);
// round and square hanko (the arch's ring upright, the threshold's octagon lying as a seal is set); the Sheikah Slate's pedestals and
// Metroid's Chozo statues (the one thing you carry wakes the machine); gates that wake from the ground up (Breath of the Wild's shrines,
// Majora's Mask's owl statues, the Stargate's chevrons locking); a die's Manhattan routing, carved dead and lit along its length.
//
//   const S = new ShrineModel({ ground })   S.group (stands on its origin, its front toward +z)   S.set({ found, resting, open })
//   S.update(rawDt)   S.wake(on = true) (the threshold sealed / unsealed)   S.cradleSpots() -> { threshold, arch } (world: the well's
//   floor, the socket's face; correct whenever it is asked, the group placed or not)   S.doorWorld(out) (the opening's middle)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from '../render/merge.js';
import { THEMES, theme } from '../ui/theme.js';

/** Where a gate's pillars stand, metres either side of its middle: world/shrines.js puts its colliders here (read it, don't copy it). */
export const SHRINE_PILLAR_X = 0.94;
const GATE = SHRINE_PILLAR_X / 2.6; // (round six's gate, its pillars at 2.6, brought to where the pillars stand)
const CRADLE = 0.28 / 0.37; // (round six's cradle, its well 0.37, brought to the Pneuka Jar's foot)
const CR = { R: 0.78, h: 0.5, rs: 0.37, dep: 0.13 }; // (the cradle in its own units: radius, height, the well's radius and depth)
const CS = CRADLE / GATE; // (the cradle in the gate's units)
const PX = 2.6, TZ = 0.655, TY = 6.1; // (the gate's units: a pillar's x; the tablet's face and its socket's height)
const CLIMB = 2.6, RUN = 1.6, DOOR = 1.2; // (real seconds: the threshold's light up the gate; the arch's run in; the door opening)
const LACH = new THREE.Color(0x7fdcff);
const V3 = THREE.Vector3, P = (x, y, z) => new V3(x, y, z);
const kas = (x) => Math.pow(Math.abs(x) / 4.1, 3) * 0.55; // (the kasagi's lift toward its ends)
const pr = (y) => 0.34 - 0.05 * y / 7.3; // (a pillar's radius at y: it tapers)

// ---- the look's shared bits: the oil film, a seeded draw, the clay glazes (drawn once for every gate)
const FILM = [[76, 15, 179], [10, 140, 191], [242, 184, 46], [217, 26, 128]];
function filmCol(s, out = new THREE.Color()) {
  s = ((s % 1) + 1) % 1 * 4; const i = Math.floor(s), f = s - i, A = FILM[i], B = FILM[(i + 1) % 4], m = f * f * (3 - 2 * f);
  return out.setRGB(...A.map((v, k) => (v + (B[k] - v) * m) / 255), THREE.SRGBColorSpace);
}
const filmRGB = (s, a) => { const c = filmCol(s).getRGB({}, THREE.SRGBColorSpace); return `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`; };
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const colour = (c, wrap) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
function clayGlaze(base, pool, brk, speck, seed) {
  const c = canvas(512, 512), x = c.getContext('2d'), R = rng(seed);
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const px = R() * 512, py = R() * 512, r = 20 + R() * 90, g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, R() < 0.5 ? pool : brk); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.25 + R() * 0.35; x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  x.globalAlpha = 1; for (let i = 0; i < 900; i++) { x.fillStyle = R() < 0.7 ? speck : 'rgba(240,235,220,.5)'; x.fillRect(R() * 512, R() * 512, 1 + R() * 1.5, 1 + R() * 1.5); }
  return colour(c, true);
}
function ropeTex() {
  const c = canvas(256, 32), x = c.getContext('2d'); x.fillStyle = '#b8a070'; x.fillRect(0, 0, 256, 32); x.strokeStyle = '#6e5a34'; x.lineWidth = 3;
  for (let i = -32; i < 256; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 32, 32); x.stroke(); }
  const t = colour(c, true); t.repeat.set(14, 1); return t;
}
/** Your Spirit Garden through the door: its light, three planetoids with their rings, motes. */
function gardenTex() {
  const S = 256, c = canvas(S, S), x = c.getContext('2d'), R = rng(5);
  const g = x.createRadialGradient(S / 2, S * 0.62, 4, S / 2, S * 0.6, S * 0.62);
  g.addColorStop(0, 'rgba(240,255,246,1)'); g.addColorStop(0.3, 'rgba(150,230,200,.85)'); g.addColorStop(0.7, 'rgba(70,110,170,.5)'); g.addColorStop(1, 'rgba(40,30,90,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (const [px, py, r] of [[70, 70, 16], [190, 96, 10], [128, 40, 7]]) { x.fillStyle = 'rgba(40,70,60,.7)'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.strokeStyle = 'rgba(240,230,170,.7)'; x.beginPath(); x.ellipse(px, py, r * 1.8, r * 0.45, -0.3, 0, 7); x.stroke(); }
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(255,255,230,${R() * 0.9})`; x.fillRect(R() * S, R() * S, 1.5, 1.5); }
  return colour(c);
}
/** The onward veil: the film rising in the opening (the System's network, seen through the gate). */
function veilTex() {
  const S = 256, c = canvas(S, S), x = c.getContext('2d'), R = rng(23);
  const g = x.createLinearGradient(0, S, 0, 0); g.addColorStop(0, 'rgba(60,30,120,.55)'); g.addColorStop(0.6, 'rgba(20,60,90,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 90; i++) {
    const xx = R() * S, y0 = S * (0.2 + R() * 0.9), l = 20 + R() * 80, q = x.createLinearGradient(0, y0, 0, y0 - l);
    q.addColorStop(0, filmRGB(R(), 0)); q.addColorStop(0.5, filmRGB(xx / S, 0.5 * R() + 0.15)); q.addColorStop(1, filmRGB(R(), 0)); x.fillStyle = q; x.fillRect(xx | 0, y0 - l, 1 + (R() < 0.2), l);
  }
  const e = x.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S * 0.72); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = e; x.fillRect(0, 0, S, S);
  return colour(c);
}
let LOOK = null; // (the textures, drawn at the first gate built and shared by every gate)
const look = () => LOOK || (LOOK = {
  clay: clayGlaze('#6e3220', '#4e1e12', '#9a5434', '#22100a', 17), sill: clayGlaze('#5a2818', '#3a160c', '#8a4a2c', '#1a0a06', 53),
  cradle: clayGlaze('#7a3a22', '#5a2414', '#b06a3e', '#22100a', 37), rope: ropeTex(), garden: gardenTex(), veil: veilTex(),
});

// ---- the lit traces: every lit piece of a circuit in one mesh, each vertex carrying the distance along the circuit where it lights
// (aD) and its colour; uD is how far the light has come, so a segment grows along its length and a node lights when the light reaches it
const LIT_V = /* glsl */`attribute float aD; attribute vec3 aCol; varying float vD; varying vec3 vC;
#include <fog_pars_vertex>
void main() { vD = aD; vC = aCol; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const LIT_F = /* glsl */`uniform float uD, uOn; varying float vD; varying vec3 vC;
#include <fog_pars_fragment>
void main() {
  if (vD > uD || uOn <= 0.0) discard;
  float front = smoothstep(0.45, 0.0, uD - vD);                                  // (the sparks at the front of the light)
  gl_FragColor = vec4(mix(vC * 2.6, vec3(3.2, 3.0, 2.7), front * 0.7) * uOn, 1.0);
#include <fog_fragment>
}`;
const litMaterial = () => new THREE.ShaderMaterial({ name: 'shrine-trace', vertexShader: LIT_V, fragmentShader: LIT_F, fog: true, toneMapped: false,
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uD: { value: -1 }, uOn: { value: 0 } }]) });

/** A circuit: carved dead grooves (static, merged with the gate) and their lit twins (one mesh, `mesh()`). Round six's makeCircuit. */
function circuit(gate, dead, w, colourOf) {
  const parts = [], box = new THREE.BoxGeometry(1, 1, 1), Z = new V3(0, 0, 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3();
  let dmax = 0;
  const bake = (geo, matrix, dOf, col) => {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); for (const n of Object.keys(g.attributes)) if (n !== 'position') g.deleteAttribute(n);
    const p = g.attributes.position, d = new Float32Array(p.count), c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { d[i] = dOf(p.getZ(i)); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    g.applyMatrix4(matrix); g.setAttribute('aD', new THREE.BufferAttribute(d, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(c, 3));
    parts.push(g);
  };
  const groove = (geo, matrix) => { const m = new THREE.Mesh(geo, dead); matrix.decompose(m.position, m.quaternion, m.scale); gate.add(m); };
  function seg(a, b, d0, col) {
    const len = a.distanceTo(b), dir = b.clone().sub(a).normalize(); q.setFromUnitVectors(Z, dir);
    const mid = a.clone().lerp(b, 0.5);
    groove(box, new THREE.Matrix4().compose(mid, q, sc.set(w * 0.85, w * 0.85, len + w * 0.5)));
    const L = len + w * 0.4;
    bake(box, m4.compose(mid, q, sc.set(w, w, L)), (z) => d0 + (z + 0.5) * L - w * 0.2, col);
    dmax = Math.max(dmax, d0 + len); return d0 + len;
  }
  function path(pts, d0, col) { let d = d0; for (let i = 0; i < pts.length - 1; i++) d = seg(pts[i], pts[i + 1], d, typeof col === 'function' ? col(d) : col); return d; }
  const _o = new THREE.Object3D();
  function via(p, d, r, normal, col) {
    _o.position.copy(p); _o.rotation.set(0, 0, 0); if (normal) _o.lookAt(p.clone().add(normal)); _o.updateMatrix();
    groove(new THREE.TorusGeometry(r, w * 0.4, 6, 24), _o.matrix.clone());
    bake(new THREE.TorusGeometry(r, w * 0.5, 6, 24), _o.matrix, () => d, col); bake(new THREE.SphereGeometry(r * 0.4, 10, 8), _o.matrix, () => d, col);
    dmax = Math.max(dmax, d);
  }
  /** A lit piece of its own (a chevron's bar, a pad): lit when the light reaches d. */
  function lit(geo, matrix, d, col) { bake(geo, matrix, () => d, col); dmax = Math.max(dmax, d); }
  function mesh() { const m = new THREE.Mesh(mergeGeometries(parts, false), litMaterial()); m.name = 'shrine-traces'; for (const g of parts) g.dispose(); return m; }
  return { seg, path, via, lit, mesh, get dmax() { return dmax; } };
}

export class ShrineModel {
  constructor({ ground = 'stone_flags' } = {}) {
    const L = look(), root = (this.group = new THREE.Group()); root.name = 'shrine'; this.ground = ground; // (the ground it stands on: the old skirt's; unused by the torii)
    const gate = (this.gate = new THREE.Group()); gate.scale.setScalar(GATE); root.add(gate);
    const clay = (this.clay = new THREE.MeshStandardMaterial({ name: 'shrine-clay', map: L.clay, roughness: 0.92 }));
    const sill = new THREE.MeshStandardMaterial({ name: 'shrine-sill', map: L.sill, roughness: 0.8 });
    const gold = new THREE.MeshStandardMaterial({ name: 'shrine-gold', color: 0xd9a441, metalness: 1, roughness: 0.3 });
    const bronze = new THREE.MeshStandardMaterial({ name: 'shrine-bronze', color: 0x9a6a2a, metalness: 1, roughness: 0.38 });
    const dead = new THREE.MeshStandardMaterial({ name: 'shrine-groove', color: 0x160a06, roughness: 0.95 });
    const add = (geo, pos, m = clay, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.castShadow = shadow; o.receiveShadow = true; gate.add(o); return o; };
    const placed = (geo, m, pos, rot) => { const o = new THREE.Mesh(geo, m); o.position.copy(pos); if (rot) o.rotation.copy(rot); gate.add(o); return o; };

    // ---- the torii: two tapering pillars on their feet, the nuki, the shimaki, the kasagi lifting at its ends, the tablet
    for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.29, 0.34, 7.3, 24), [s * PX, 3.65, 0]); add(new THREE.CylinderGeometry(0.42, 0.44, 0.42, 24), [s * PX, 0.21, 0]); }
    add(new THREE.BoxGeometry(6.6, 0.5, 0.45), [0, 5.05, 0]);
    add(new THREE.BoxGeometry(7.2, 0.4, 0.5), [0, 7.1, 0]);
    { const g = new THREE.BoxGeometry(8.2, 0.55, 0.75, 40, 1, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + kas(p.getX(i))); g.computeVertexNormals(); add(g, [0, 7.57, 0]); }
    add(new THREE.BoxGeometry(1.8, 1.5, 0.9), [0, TY, 0.2]);
    // the sill: a glazed threshold between the pillar feet, deep enough for the cradle sunk in its middle
    const SD = 3.6, zF = SD / 2 + 0.012, yS = 0.304;
    add(new THREE.BoxGeometry(6.1, 0.3, SD), [0, 0.15, 0], sill);
    // kintsugi: the Clay dress's mends (up a pillar, across the sill, along the kasagi)
    const mend = (pts, r = 0.024) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 5, false), [0, 0, 0], gold, false);
    { const R = rng(4), pts = []; let a = 0.5; for (let y = 0.5; y < 3.4; y += 0.15) { a += (R() - 0.5) * 0.25; const r = pr(y) + 0.006; pts.push(P(-PX + Math.sin(a) * r, y, Math.cos(a) * r)); } mend(pts); }
    { const R = rng(6), pts = []; let a = -0.6; for (let y = 2.2; y < 4.6; y += 0.15) { a += (R() - 0.5) * 0.25; const r = pr(y) + 0.006; pts.push(P(PX + Math.sin(a) * r, y, Math.cos(a) * r)); } mend(pts); }
    { const R = rng(8), pts = []; let x = -2.05; for (let z = 0.55; z < 1.75; z += 0.1) { x += (R() - 0.5) * 0.12; pts.push(P(x, 0.304, z)); } mend(pts, 0.018); }
    { const R = rng(10), pts = []; let y = 7.6; for (let x = 1.0; x < 3.6; x += 0.12) { y += (R() - 0.5) * 0.06; pts.push(P(x, y + kas(x) - 0.02, 0.385)); } mend(pts, 0.018); }

    // ---- the threshold's cradle (onward): a round well in an octagonal body, lying in the sill, four tines; built at the Jar's scale
    const cr = new THREE.Group(); cr.scale.setScalar(CS); gate.add(cr);
    const cm = new THREE.MeshStandardMaterial({ name: 'shrine-cradle', map: L.cradle, roughness: 0.55, side: THREE.DoubleSide });
    const { R, h, rs, dep } = CR, fl = h - dep, v2 = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
    const pin = v2([[0, fl], [rs, fl], [rs, h - 0.005], [rs + 0.05, h + 0.035], [rs + 0.1, h + 0.036]]);
    const pout = v2([[rs + 0.075, h + 0.03], [R - 0.06, h + 0.03], [R - 0.01, h - 0.02], [R, h - 0.08], [R * 0.97, 0.12], [R * 1.02, 0.04], [R * 1.03, 0]]);
    for (const [pp, seg, ph] of [[pin, 48, 0], [pout, 8, Math.PI / 8]]) { const m = new THREE.Mesh(new THREE.LatheGeometry(pp, seg, ph), cm); m.castShadow = m.receiveShadow = true; cr.add(m); }
    for (const [a0, seed] of [[0.5, 3], [2.5, 9], [4.3, 5]]) { // (kintsugi on the octagon's top: radial mends from the lip to the edge)
      const Rn = rng(seed), pts = []; let a = a0; for (let r = rs + 0.11; r < R * 0.88; r += 0.04) { a += (Rn() - 0.5) * 0.22; pts.push(P(Math.cos(a) * r, h + 0.036, Math.sin(a) * r)); }
      cr.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.011, 5, false), gold));
    }
    { const c = new THREE.Mesh(new THREE.TorusGeometry(rs + 0.035, 0.03, 8, 48), gold); c.rotation.x = Math.PI / 2; c.position.y = h + 0.03; c.castShadow = true; cr.add(c); } // (the collar)
    const padGeo = [];
    for (let i = 0; i < 32; i++) { // (the pad ring on its top face: carved dark, and their lit twins)
      const a = i / 32 * Math.PI * 2, r = (rs + R) / 2 + 0.03, d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.075), dead);
      d.position.set(Math.cos(a) * r, h + 0.036, Math.sin(a) * r); d.rotation.y = -a + Math.PI / 2; cr.add(d);
      d.updateMatrix(); padGeo.push(new THREE.BoxGeometry(0.035, 0.016, 0.083).applyMatrix4(d.matrix));
    }
    this.pads = new THREE.Mesh(mergeGeometries(padGeo, false), new THREE.MeshBasicMaterial({ name: 'shrine-pads', color: 0xffffff, toneMapped: false, transparent: true, depthWrite: false }));
    this.pads.name = 'shrine-pads'; cr.add(this.pads); padGeo.forEach((g) => g.dispose());
    this.seam = new THREE.Mesh(new THREE.TorusGeometry(rs - 0.01, 0.022, 6, 48), new THREE.MeshBasicMaterial({ name: 'shrine-seam', color: 0xffffff, toneMapped: false }));
    this.seam.name = 'shrine-seam'; this.seam.rotation.x = -Math.PI / 2; this.seam.position.y = h + 0.005; cr.add(this.seam);
    this.halo = new THREE.Mesh(new THREE.CylinderGeometry(rs - 0.005, rs - 0.005, dep + 0.01, 48, 1, true), new THREE.MeshBasicMaterial({ name: 'shrine-halo', color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
    this.halo.name = 'shrine-halo'; this.halo.position.y = fl + dep / 2; cr.add(this.halo);
    // the four bronze tines round the well, leaning in over it while it is empty, closing on the Jar's foot when it is sealed
    { const b = new THREE.BoxGeometry(0.035, 0.26, 0.07), tip = new THREE.SphereGeometry(0.03, 8, 6).translate(-0.04, 0.13, 0), tg = mergeGeometries([b.toNonIndexed(), tip.toNonIndexed()], false);
      this.tines = new THREE.InstancedMesh(tg, gold, 4); this.tines.name = 'shrine-tines'; this.tines.castShadow = true; cr.add(this.tines); b.dispose(); tip.dispose(); }
    this.tineAt = []; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; this.tineAt.push({ p: P(Math.cos(a) * (rs + 0.07), h + 0.03 + 0.12, Math.sin(a) * (rs + 0.07)), a }); }

    // ---- the threshold's circuit: out of the sill both ways, up the pillars past their chevrons, over the nuki, the kasagi last
    const sc = circuit(gate, dead, 0.06, null), film = (k) => (d) => filmCol(d * 0.09 + k), F = new THREE.Color();
    const out = R * CS * 1.03 * Math.cos(Math.PI / 8) + 0.05; // (the octagon's flat side, in the gate's units)
    const climb = [];
    for (const s of [-1, 1]) {
      let d = sc.path([P(s * out, yS, 0), P(s * 1.95, yS, 0), P(s * 1.95, yS, 0.3), P(s * 2.15, yS, 0.3)], 0, film(0));
      sc.path([P(s * 1.15, yS, -1.3), P(s * 1.85, yS, -1.3), P(s * 1.85, yS, -1.6)], 0.05, film(0.5)); sc.via(P(s * 1.85, yS + 0.005, -1.6), 0.05 + 1.0 + 0.2, 0.045, P(0, 1, 0), filmCol(0.6, F).clone());
      sc.path([P(s * 1.15, yS, 1.3), P(s * 2.0, yS, 1.3), P(s * 2.0, yS, 1.62)], 0.08, film(0.5)); sc.via(P(s * 2.0, yS + 0.005, 1.62), 0.08 + 1.17 + 0.2, 0.045, P(0, 1, 0), filmCol(0.7, F).clone());
      sc.path([P(s * 0.3, 0.2, zF), P(s * 1.15, 0.2, zF), P(s * 1.15, 0.1, zF), P(s * 2.3, 0.1, zF)], 0.1, film(0.5)); sc.via(P(s * 2.3, 0.1, zF + 0.005), 0.1 + 1.95, 0.04, null, filmCol(0.8, F).clone());
      d = sc.path([P(s * 2.15, yS, 0.3), P(s * PX, yS + 0.01, 0.43)], d, film(0)); // (up the foot and the pillar's front)
      const y0 = 0.44, y1 = 4.78;
      d = sc.path([P(s * PX, y0, pr(y0) + 0.105), P(s * PX, y0 + 0.06, pr(y0) + 0.01), P(s * PX, y1, pr(y1) + 0.01)], d, film(0));
      climb.push({ s, d0: d - (y1 - y0 - 0.06), y0: y0 + 0.06 });
      for (const th of [-0.4, 0.4]) { const a = P(s * PX + Math.sin(th) * (pr(0.6) + 0.01), 0.6, Math.cos(th) * (pr(0.6) + 0.01)), b = P(s * PX + Math.sin(th) * (pr(4.7) + 0.01), 4.7, Math.cos(th) * (pr(4.7) + 0.01)); sc.path([a, b], d - (y1 - 0.6), film(0.5)); }
      sc.path([P(s * PX * 0.88, 5.05, 0.235), P(s * 0.12, 5.05, 0.235)], d + 0.1, film(0)); sc.via(P(s * 0.6, 5.05, 0.245), d + 0.1 + PX * 0.88 - 0.6, 0.05, null, filmCol(0.4, F).clone());
      d = sc.path([P(s * PX, 5.32, pr(5.32) + 0.01), P(s * PX, 7.26, pr(7.26) + 0.01), P(s * PX, 7.42 + kas(PX), 0.395)], d + 0.05, film(0));
      const dk = sc.path([P(s * PX, 7.42 + kas(PX), 0.395), P(s * 3.85, 7.42 + kas(3.85), 0.395)], d, film(0));
      sc.via(P(s * 3.97, 7.45 + kas(3.97), 0.4), dk, 0.11, null, filmCol(dk * 0.09, F).clone());
      const dc = sc.path([P(s * PX, 7.42 + kas(PX), 0.395), P(s * 0.15, 7.42, 0.395)], d, film(0)); sc.via(P(0, 7.42, 0.4), dc, 0.09, null, filmCol(dc * 0.09, F).clone());
    }
    // the chevrons on the pillars, pointing up: each lights as the climbing light reaches it (the Stargate's)
    const chevMat = new THREE.Matrix4(), _c = new THREE.Object3D();
    for (const c of climb) for (const y of [1.3, 2.3, 3.3, 4.3]) for (const k of [-1, 1]) {
      _c.position.set(c.s * PX + k * 0.075, y - 0.05, pr(y) + 0.02); _c.rotation.set(0, 0, -k * 0.6); _c.updateMatrix();
      placed(new THREE.BoxGeometry(0.2, 0.035, 0.02), dead, _c.position, _c.rotation);
      _c.position.z += 0.008; _c.updateMatrix(); chevMat.copy(_c.matrix);
      sc.lit(new THREE.BoxGeometry(0.21, 0.045, 0.03), chevMat, c.d0 + (y - c.y0), filmCol(y * 0.11 + 0.2, F).clone());
    }
    this.sc = sc; this.scDmax = sc.dmax;

    // ---- the arch's cradle (inward): round, upright in the tablet, three leaf springs; Lachryma's light runs in to it
    const hole = add(new THREE.CircleGeometry(0.47, 32), [0, TY, TZ + 0.002], new THREE.MeshBasicMaterial({ name: 'shrine-socket', color: 0x050203 }), false); hole.receiveShadow = false;
    add(new THREE.TorusGeometry(0.5, 0.065, 10, 48), [0, TY, TZ + 0.02], bronze);
    for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + k * Math.PI * 2 / 3; _c.position.set(Math.cos(a) * 0.5, TY + Math.sin(a) * 0.5, TZ + 0.06); _c.rotation.set(0, 0, a); _c.updateMatrix(); const m = placed(new THREE.BoxGeometry(0.05, 0.07, 0.42), bronze, _c.position, _c.rotation); m.position.add(P(0, 0, 0.2)); }
    const ac = circuit(gate, dead, 0.055, null), zT = TZ + 0.01, zS = 0.26; let dA = 0;
    for (const s of [-1, 1]) { // from the shimaki's ends inward: the sigil at each end is where it starts
      ac.via(P(s * 3.35, 7.12, zS + 0.01), 0, 0.13, null, LACH);
      for (const rz of [0, Math.PI / 2]) { _c.position.set(s * 3.35, 7.12, zS + 0.02); _c.rotation.set(0, 0, rz); _c.scale.set(rz ? 0.6 : 1, 1, 1); _c.updateMatrix(); ac.lit(new THREE.BoxGeometry(0.34, 0.025, 0.02), _c.matrix, 0, LACH); _c.scale.set(1, 1, 1); }
      const d = ac.path([P(s * 3.22, 7.12, zS), P(s * 2.2, 7.12, zS), P(s * 2.2, 7.0, zS), P(s * 1.1, 7.0, zS), P(s * 1.1, 7.1, zS), P(s * 0.12, 7.1, zS)], 0, LACH);
      ac.via(P(s * 2.2, 7.0, zS + 0.01), 1.15, 0.05, null, LACH); ac.via(P(s * 1.1, 7.1, zS + 0.01), 2.35, 0.05, null, LACH);
      ac.path([P(s * 0.86, TY, zT), P(s * 0.62, TY, zT)], d - 0.3, LACH); ac.via(P(s * 0.8, TY, zT + 0.01), d - 0.3, 0.04, null, LACH);
      ac.path([P(s * 0.82, 6.76, zT), P(s * 0.36, 6.76, zT), P(s * 0.36, 6.62, zT)], d - 0.4, LACH); ac.path([P(s * 0.82, 5.44, zT), P(s * 0.36, 5.44, zT), P(s * 0.36, 5.58, zT)], d - 0.4, LACH);
      dA = Math.max(dA, d);
    }
    dA = ac.path([P(0, 7.05, zS), P(0, 6.9, zS)], dA, LACH); ac.via(P(0, 7.05, zS + 0.01), dA - 0.15, 0.07, null, LACH); dA = ac.path([P(0, 6.86, zT), P(0, 6.66, zT)], dA, LACH);
    for (const [cx, cy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) for (const k of [-1, 1]) { // (the tablet's corner chevrons, pointing in)
      const base = new THREE.Object3D(); base.position.set(cx * 0.7, TY + cy * 0.56, zT + 0.005); base.rotation.z = Math.atan2(-cy, -cx);
      const bar = new THREE.Object3D(); bar.position.set(-0.05, k * 0.05, 0); bar.rotation.z = k * 0.75; base.add(bar); base.updateMatrixWorld(true);
      const dm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.02), dead); bar.matrixWorld.decompose(dm.position, dm.quaternion, dm.scale); gate.add(dm);
      bar.position.z = 0.008; base.updateMatrixWorld(true); ac.lit(new THREE.BoxGeometry(0.17, 0.04, 0.03), bar.matrixWorld, dA * 0.55, LACH);
    }
    for (let i = 0; i < 28; i++) { // the pad ring round the socket and its circle light last, from outside in
      const a = i / 28 * Math.PI * 2; _c.position.set(Math.cos(a) * 0.66, TY + Math.sin(a) * 0.66, TZ + 0.005); _c.rotation.set(0, 0, a + Math.PI / 2); _c.updateMatrix();
      placed(new THREE.BoxGeometry(0.05, 0.11, 0.02), dead, _c.position, _c.rotation); ac.lit(new THREE.BoxGeometry(0.055, 0.115, 0.032), _c.matrix, dA + 0.05, LACH);
    }
    _c.position.set(0, TY, TZ + 0.008); _c.rotation.set(0, 0, 0); _c.updateMatrix(); ac.lit(new THREE.TorusGeometry(0.6, 0.016, 6, 48), _c.matrix, dA + 0.12, LACH);
    this.ac = ac; this.acDmax = ac.dmax;

    // ---- the shimenawa and its shide
    { const curve = new THREE.CatmullRomCurve3([P(-2.4, 4.68, 0.42), P(-1.2, 4.42, 0.46), P(0, 4.36, 0.48), P(1.2, 4.42, 0.46), P(2.4, 4.68, 0.42)]);
      add(new THREE.TubeGeometry(curve, 48, 0.085, 8, false), [0, 0, 0], new THREE.MeshStandardMaterial({ name: 'shrine-rope', map: L.rope, roughness: 1 }));
      const zz = new THREE.Shape(), zw = 0.11; zz.moveTo(0, 0);
      [[zw, 0], [zw, -0.12], [0, -0.12], [0, -0.24], [zw, -0.24], [zw, -0.36], [0, -0.36], [0, -0.48], [-zw * 0.3, -0.48], [-zw * 0.3, -0.39], [zw * 0.7, -0.39], [zw * 0.7, -0.27], [-zw * 0.3, -0.27], [-zw * 0.3, -0.15], [zw * 0.7, -0.15], [zw * 0.7, -0.03], [0, -0.03]].forEach((p) => zz.lineTo(...p));
      const paper = new THREE.MeshStandardMaterial({ name: 'shrine-shide', color: 0xf2ece0, roughness: 0.9, side: THREE.DoubleSide });
      for (const t of [0.2, 0.4, 0.6, 0.8]) add(new THREE.ShapeGeometry(zz), curve.getPoint(t).add(P(-0.05, -0.06, 0.06)).toArray(), paper, false); }

    // every static part into the gate's own frame, then one draw a look (render/merge.js); the lit traces one mesh each circuit
    gate.updateMatrixWorld(true);
    const loose = []; gate.traverse((o) => { if (o.isMesh && o.parent !== gate && !o.name) loose.push(o); });
    for (const o of loose) gate.attach(o);
    mergeStatic(gate);
    this.scMesh = sc.mesh(); this.acMesh = ac.mesh(); gate.add(this.scMesh, this.acMesh);

    // ---- what the opening shows: the onward veil (the film) and the door onto your Spirit Garden (from its centre outward)
    this.du = { uMap: { value: L.garden }, uR: { value: 0 }, uOpen: { value: 0 } };
    this.door = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 4.5), new THREE.ShaderMaterial({ name: 'shrine-door', uniforms: this.du, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: 'varying vec2 vU; void main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D uMap; uniform float uR, uOpen; varying vec2 vU;
        void main() { vec4 c = texture2D(uMap, vU); float d = length((vU - vec2(0.5, 0.4)) * vec2(1.0, 1.0)), r = 0.62 * uR;
          float m = 1.0 - smoothstep(r * 0.7, r + 0.004, d); gl_FragColor = vec4(c.rgb * 1.2, c.a * m * uOpen); }` }));
    this.door.name = 'shrine-door'; this.door.position.set(0, 2.55, -0.05); this.door.visible = false; gate.add(this.door);
    this.veil = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 4.5), new THREE.MeshBasicMaterial({ name: 'shrine-veil', map: L.veil, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.veil.name = 'shrine-veil'; this.veil.position.set(0, 2.55, -0.08); this.veil.visible = false; gate.add(this.veil);

    this.state = { found: false, resting: false, open: false };
    this.k = { found: 0, rest: 0, lit: 0, tine: 0, run: 0, door: 0, on: 0 }; this.awake = false; this.t = 0; this.wakeT = 0; this.ink = null;
    this.tinePose(0); this.colours();
  }

  set(s) { Object.assign(this.state, s); }

  /** The threshold sealed: the gate wakes from the sill up (world/shrines.js calls it at seal.set). false: unsealed, it goes dark. */
  wake(on = true) { if (on && !this.awake) this.wakeT = 0; this.awake = !!on; }

  /** The cradles where the Jar seals: the threshold's well floor, the arch's socket face. World space, from the group as it now stands. */
  cradleSpots() {
    this.group.updateWorldMatrix(true, true);
    const th = P(0, (CR.h - CR.dep) * CS, 0), arch = P(0, TY, TZ + 0.004);
    return { threshold: this.gate.localToWorld(th), arch: this.gate.localToWorld(arch) };
  }

  /** The window colour on the threshold's lit parts (its seam, its pads, the well's halo), set again when it changes. */
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
    const S = this.state, K = this.k, ease = (k, to, r) => k + (to - k) * (1 - Math.exp(-raw * r)), breath = 0.75 + 0.25 * Math.sin(this.t * 1.3);
    K.found = ease(K.found, S.found ? 1 : 0, 1.5); K.rest = ease(K.rest, S.resting ? 1 : 0, 2);
    this.clay.color.setScalar(0.55 + 0.45 * K.found); // (unfound: the clay dull, a ruin you might walk past)
    // the threshold: sealed, its cradle lights at once, then the light climbs; unsealed, it all goes dark
    if (this.awake) this.wakeT += raw;
    K.lit = ease(K.lit, this.awake ? 1 : 0, this.awake ? 9 : 3); const tine = ease(K.tine, this.awake ? 1 : 0, 6);
    if (Math.abs(tine - K.tine) > 1e-4) { K.tine = tine; this.tinePose(tine); }
    K.on = ease(K.on, this.awake ? 1 : 0, this.awake ? 20 : 2.5);
    const su = this.scMesh.material.uniforms;
    su.uOn.value = K.on; su.uD.value = this.awake ? Math.max(-1, (this.wakeT - 0.3) / CLIMB * this.scDmax) : K.on > 0.01 ? su.uD.value : -1;
    const pads = Math.max(K.lit, 0.35 * K.rest * breath);
    this.pads.visible = pads > 0.01; this.pads.material.color.copy(this.inkSel).multiplyScalar(0.5 + 1.8 * pads); this.pads.material.opacity = Math.min(1, pads * 1.4);
    this.seam.visible = this.halo.visible = K.lit > 0.01 || K.rest > 0.05; this.halo.material.opacity = 0.75 * Math.max(K.lit, 0.3 * K.rest * breath);
    this.seam.material.color.copy(this.inkHi).multiplyScalar(0.4 + 1.8 * Math.max(K.lit, 0.3 * K.rest * breath));
    const veil = this.awake ? Math.min(1, Math.max(0, (this.wakeT - 0.3 - CLIMB) / 1.0)) : 0; // (once the kasagi is lit: the film's veil in the opening)
    this.veil.material.opacity = ease(this.veil.material.opacity, veil * 0.85, 3); this.veil.visible = this.veil.material.opacity > 0.01;
    // the arch: found, its two sigils breathe; open, its light runs in, then the door fills with your Spirit Garden
    K.run = S.open ? Math.min(1, K.run + raw / RUN) : Math.max(0, K.run - raw / 0.6);
    K.door = S.open && K.run >= 1 ? Math.min(1, K.door + raw / DOOR) : Math.max(0, K.door - raw / 0.6);
    const au = this.acMesh.material.uniforms;
    au.uD.value = K.run > 0 ? K.run * (this.acDmax + 0.2) : K.found > 0.05 ? 0 : -1;
    au.uOn.value = K.run > 0 ? 1 : 0.35 * K.found * breath; // (closing, the light draws back out to the sigils)
    this.du.uR.value = K.door; this.du.uOpen.value = Math.min(1, K.door * 3); this.door.visible = K.door > 0.001;
  }

  doorWorld(out = new THREE.Vector3()) { return this.door.getWorldPosition(out); }
}
