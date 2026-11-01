// ---------------------------------------------------------------------------------------
// A SENTINEL'S BODY (Espada's note, 2026-10-30; GLOSSARY "a sentinel"; its mind Petra's, creatures/ai/): rejection's antibody, the
// island's own Figment, drawn of the island's own matter. On Anagami that is clay and sand: a kiln-fired guardian, whole, where an
// aberrant is broken. It reads as the island working as meant (its white blood cell), never a monster: no data bug, no inversion, no
// wrongness. A shield-bearer haniwa (the tate haniwa), the tube body and hollow eyes of the tomb guardians, risen out of a mound of
// the island's sand that pours off its hem as it glides; a band of ash glaze on its shoulders where the kiln's flame licked it; in its
// hollow eyes and mouth a calm warm light (the kiln's, never the film's violet nor an aberrant's opposite colour).
//
//   POSES    pose: 'idle' (a slow breath, the shield held), 'watch' (the head turning, the eyes brighter), 'walk' (a glide: the sand
//            hem streaming behind, a sway), 'stun' (tipped and still, the eyes dimmed). Any other pose reads as idle.
//   MOVES    move: 'slam' (the shield raised over the head k 0..0.6, brought down to the ground by 1) or 'sweep' (the club arm drawn
//            back, swung across by 1) over its windup's k; a Figment telegraph is Divination's, drawn over this by the runtime.
//   RISE     rise 0..1: out of the ground (0 under the sand, a mound and a puff; 1 stood). The arrival's moment, said by the runtime
//            ("A sentinel rises from the island's clay.") as it drives rise up.
//   A BLOW   hit(k): the clay flashed warm white a fifth of a real second, k = 1 - hp / hpMax opening hairline cracks (the vessel's
//            words: clay cracks; it stays whole until down).
//   DOWN     down(): it slumps and crumbles back into the island's sand over DOWN real s (a sand mound sinking flat), then `done`.
//
//   game.makeSentinelBody({ scale }) (installSentinelBody, boot/world.js) or new SentinelBody(game, { scale }) -> s;   s.root (a Group, its feet at the origin, facing +Z: the runtime places and turns it)
//   s.drive({ pose, move, k, rise })   s.hit(k)   s.down()   s.update(dt)   s.done   s.dispose()
//   s.center(out) (its chest, world)   s.head(out) (over its head, world)   SENTINEL_BODY { height, radius } (m, at scale 1: the capsule)
//
// Prior art: the haniwa of the Kofun period (Japan, 3rd-6th c.: unglazed terracotta figures set round a tomb to guard it, the shield-
// bearers, warriors and their hollow eyes; the Tokyo National Museum's); the clay golem of the Prague tale (the city's own clay made to
// guard it); Shadow of the Colossus and Ico's stone guardians (a keeper, not a predator); the house's sea beasts' body interface
// (vfx/opensea/beasts/akhlut.js: drive, hit, down, update, dispose). Plain THREE geometry, vertex-coloured: six meshes, one material a
// kind (clay, glaze, light, sand), shared by every sentinel.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Its size (m, at scale 1) for the runtime's capsule, and the look's knobs. */
export const SENTINEL_BODY = { height: 2.4, radius: 0.55 };
export const SENTINEL_LOOK = {
  clay: 0xb5653a, clayDark: 0x7a3e22, slip: 0xd99a6c, ash: 0x9aa36a, sand: 0xd9b98a, light: 0xffd38a,
  breath: 0.6, flash: 0.2, down: 1.8, sway: 0.06,
};
const L = SENTINEL_LOOK;

const tint = (geo, hex, dark = null, y0 = 0, y1 = 1) => { // (vertex colour: hex, darkening toward `dark` below y0..y1)
  const n = geo.attributes.position.count, c = new Float32Array(n * 3), a = new THREE.Color(hex), b = new THREE.Color(dark ?? hex), t = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const y = geo.attributes.position.getY(i), k = THREE.MathUtils.clamp((y - y0) / (y1 - y0 || 1), 0, 1);
    t.copy(b).lerp(a, k); c.set([t.r, t.g, t.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
};
const at = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => geo.rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z);
const plain = (geo) => { geo.deleteAttribute('uv'); return geo.index ? geo.toNonIndexed() : geo; };

let KIT = null; // (geometry and materials shared by every sentinel, built once)
function kit() {
  if (KIT) return KIT;
  // the body: a haniwa's tube on a flared hem, a waist band of applied clay, its shoulders rounded
  const prof = [[0.6, 0], [0.58, 0.08], [0.46, 0.3], [0.4, 0.7], [0.42, 1.05], [0.46, 1.4], [0.44, 1.62], [0.3, 1.75], [0.16, 1.8]].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = plain(new THREE.LatheGeometry(prof, 14)); tint(torso, L.clay, L.clayDark, 0, 0.9);
  const band = plain(at(new THREE.TorusGeometry(0.42, 0.045, 5, 16), 0, 0.92, 0, Math.PI / 2)); tint(band, L.slip);
  const collar = plain(at(new THREE.TorusGeometry(0.4, 0.05, 5, 16), 0, 1.5, 0, Math.PI / 2)); tint(collar, L.slip);
  const ash = plain(at(new THREE.SphereGeometry(0.47, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), 0, 1.33, 0)); tint(ash, L.ash, 0x6d7a48, 1.62, 1.8);
  // the head: round, a hollow face (eyes and mouth are the light's), a tall crest (the haniwa warrior's helmet) and ear-bobs
  const skull = plain(at(new THREE.SphereGeometry(0.32, 14, 10), 0, 0, 0)); tint(skull, L.clay, L.clayDark, -0.3, 0.2);
  const crest = plain(at(new THREE.ConeGeometry(0.2, 0.46, 8), 0, 0.42, -0.02)); tint(crest, L.ash, L.clay, 0.2, 0.62);
  const brim = plain(at(new THREE.CylinderGeometry(0.36, 0.38, 0.06, 14), 0, 0.2, 0)); tint(brim, L.slip);
  const bobs = [-1, 1].map((s) => tint(plain(at(new THREE.SphereGeometry(0.09, 8, 6).scale(1, 1.6, 1), s * 0.33, -0.12, 0)), L.slip));
  const head = mergeGeometries([skull, crest, brim, ...bobs]);
  // an arm: a short tube with a mitten hand (the left holds the shield, the right the club)
  const arm = mergeGeometries([plain(at(new THREE.CylinderGeometry(0.11, 0.12, 0.62, 8), 0, -0.31, 0)), plain(at(new THREE.SphereGeometry(0.14, 8, 6), 0, -0.64, 0))]);
  tint(arm, L.clay, L.clayDark, -0.7, 0);
  const club = mergeGeometries([plain(at(new THREE.CylinderGeometry(0.07, 0.11, 0.9, 7), 0, -0.9, 0.3, Math.PI * 0.42)), plain(at(new THREE.SphereGeometry(0.15, 8, 6), 0, -1.0, 0.72))]);
  tint(club, L.clayDark);
  // the shield: a tall clay board, its face incised with the haniwa's chevrons (raised slip strips) and a boss
  const board = plain(new THREE.BoxGeometry(0.72, 1.1, 0.07)); tint(board, L.clay, L.clayDark, -0.55, 0.55);
  const strips = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) strips.push(tint(plain(at(new THREE.BoxGeometry(0.34, 0.04, 0.03), s * 0.16, 0.36 - i * 0.24, 0.05, 0, 0, s * 0.6)), L.slip));
  const boss = tint(plain(at(new THREE.SphereGeometry(0.1, 8, 6).scale(1, 1, 0.5), 0, 0, 0.05)), L.ash);
  const shield = mergeGeometries([board, ...strips, boss]);
  // the light: two hollow eyes and the open mouth, set into the face (discs a hair proud, so the clay reads as hollow round them)
  const eye = (x, y, w, h) => plain(at(new THREE.CircleGeometry(1, 10).scale(w, h, 1), x, y, 0.312));
  const light = mergeGeometries([eye(-0.11, 0.03, 0.06, 0.035), eye(0.11, 0.03, 0.06, 0.035), eye(0, -0.13, 0.05, 0.03)]);
  // the sand: a mound it stands in, its hem
  const sand = plain(new THREE.LatheGeometry([[1.05, 0], [0.9, 0.06], [0.68, 0.14], [0.5, 0.2], [0.001, 0.22]].map(([r, y]) => new THREE.Vector2(r, y)), 18));
  tint(sand, L.sand, 0xb89466, 0, 0.22);
  const solid = { vertexColors: true, roughness: 0.82, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0 };
  KIT = {
    body: mergeGeometries([torso, band, collar, ash]), head, arm, club, shield, light, sand,
    clay: new THREE.MeshStandardMaterial({ ...solid, flatShading: false }),
    glow: new THREE.MeshBasicMaterial({ color: L.light, side: THREE.DoubleSide, toneMapped: false }),
    sandMat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
  };
  return KIT;
}

const _p = new THREE.Vector3();
const ease = (x) => x * x * (3 - 2 * x), clamp01 = (x) => Math.min(1, Math.max(0, x));

export class SentinelBody {
  constructor(game, { scale = 1 } = {}) {
    const K = kit();
    this.game = game; this.scale = scale; this.t = Math.random() * 10;
    this.root = new THREE.Group(); this.root.name = 'sentinel';
    this.rig = new THREE.Group(); this.root.add(this.rig); this.rig.scale.setScalar(scale);
    // its own materials (a flash and its cracks are its own), the geometry shared
    this.mat = K.clay.clone(); this.eyes = K.glow.clone();
    this.crackK = { value: 0 };
    this.mat.onBeforeCompile = (sh) => { // (hairline cracks in the clay as it is hurt: a cellular net, dark lines, opened by uCrack)
      sh.uniforms.uCrack = this.crackK;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSp = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vSp; uniform float uCrack;
vec3 h3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453); }
float crackNet(vec3 p){ vec3 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int z=-1; z<=1; z++) for (int y=-1; y<=1; y++) for (int x=-1; x<=1; x++){ vec3 g = vec3(float(x),float(y),float(z)); vec3 o = h3(i+g); float d = length(g+o-f); if (d<d1){ d2=d1; d1=d; } else if (d<d2) d2=d; }
  return d2 - d1; }`).replace('#include <color_fragment>', `#include <color_fragment>
if (uCrack > 0.01) { float e = crackNet(vSp * 5.0); float w = 0.02 + 0.05 * uCrack; float m = (1.0 - smoothstep(0.0, w, e)) * smoothstep(0.0, 0.25, uCrack - h3(floor(vSp*5.0)).x * 0.6); diffuseColor.rgb *= 1.0 - 0.75 * m; }`);
    };
    this.mat.customProgramCacheKey = () => 'sentinelClay';
    const mesh = (geo, mat, parent = this.rig) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; parent.add(m); return m; };
    this.body = mesh(K.body, this.mat);
    this.headG = new THREE.Group(); this.headG.position.set(0, 2.06, 0); this.rig.add(this.headG);
    mesh(K.head, this.mat, this.headG); const face = new THREE.Mesh(K.light, this.eyes); this.headG.add(face);
    this.armL = new THREE.Group(); this.armL.position.set(0.47, 1.52, 0); this.rig.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(-0.47, 1.52, 0); this.rig.add(this.armR);
    mesh(K.arm, this.mat, this.armL); mesh(K.arm, this.mat, this.armR); mesh(K.club, this.mat, this.armR);
    this.shield = mesh(K.shield, this.mat, this.armL); this.shield.position.set(0.08, -0.5, 0.32); this.shield.rotation.y = -0.15;
    this.sand = new THREE.Mesh(K.sand, K.sandMat); this.sand.receiveShadow = true; this.root.add(this.sand);
    this.pose = 'idle'; this.move = null; this.k = 0; this.rise = 1; this.flash = 0; this.dead = -1; this.done = false; this.look = 0; this.walk = 0;
  }

  drive({ pose = this.pose, move = null, k = 0, rise = this.rise } = {}) { this.pose = pose; this.move = move; this.k = clamp01(k); this.rise = clamp01(rise); }
  hit(k = 0) { this.flash = L.flash; this.crackK.value = Math.max(this.crackK.value, clamp01(k)); }
  down() { if (this.dead < 0) { this.dead = 0; this.puff(14); } }
  center(out = new THREE.Vector3()) { return this.root.localToWorld(out.set(0, 1.25 * this.scale, 0)); }
  head(out = new THREE.Vector3()) { return this.root.localToWorld(out.set(0, 2.75 * this.scale, 0)); }

  /** A puff of the island's sand at its foot (the arrival, the crumble), through the shared particle pools when there are any. */
  puff(n) {
    const fx = this.game?.fx?.alpha; if (!fx?.emit) return;
    this.root.updateMatrixWorld(true); const c = this.root.getWorldPosition(_p);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, r = 0.3 + Math.random() * 0.7;
      fx.emit({ pos: c.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.1, Math.sin(a) * r)), vel: new THREE.Vector3(Math.cos(a) * 1.4, 0.8 + Math.random() * 1.6, Math.sin(a) * 1.4),
        life: 0.9 + Math.random() * 0.6, size: 0.22, sizeEnd: 0.7, color: new THREE.Color(L.sand), alpha: 0.55, drag: 1.6, gravity: 1.5 });
    }
  }

  update(dt) {
    dt = Math.min(0.1, dt || 0); this.t += dt;
    const P = this.pose, t = this.t, walking = P === 'walk', stun = P === 'stun';
    this.walk += ((walking ? 1 : 0) - this.walk) * Math.min(1, dt * 5);
    // the rise and the crumble: the rig sinks into the mound; the mound itself flattens away once down
    let sink = 1 - ease(this.rise), mound = 1;
    if (this.dead >= 0) {
      this.dead += dt; const d = clamp01(this.dead / L.down);
      sink = Math.max(sink, ease(d)); mound = 1 - ease(clamp01((d - 0.55) / 0.45));
      if (d >= 1 && !this.done) { this.done = true; this.root.visible = false; }
    }
    const H = SENTINEL_BODY.height + 0.3;
    this.rig.position.y = -sink * H * this.scale;
    this.rig.visible = sink < 0.999;
    if (this.prevRise !== undefined && this.prevRise < 0.05 && this.rise >= 0.05) this.puff(10);
    this.prevRise = this.rise;
    this.sand.scale.set(1 + 0.25 * this.walk, mound * (1 + 0.6 * (1 - this.rise) + 0.3 * this.walk), 1 + 0.25 * this.walk).multiplyScalar(this.scale);
    this.sand.position.z = -0.18 * this.walk * this.scale;
    // the breath and the sway; a stun tips it and holds it
    const br = Math.sin(t * Math.PI * 2 * L.breath / 2) * 0.012;
    this.body.scale.set(1 + br, 1 - br * 0.5, 1 + br);
    const tip = stun ? 0.22 : 0;
    this.rig.rotation.x += ((walking ? 0.1 : 0) + tip - this.rig.rotation.x) * Math.min(1, dt * 6);
    this.rig.rotation.z = (walking ? Math.sin(t * 3.2) * L.sway : Math.sin(t * 0.9) * 0.012) + (stun ? 0.12 : 0);
    // the head: a watch turns it side to side
    const lookTo = P === 'watch' ? Math.sin(t * 0.8) * 0.7 : 0;
    this.headG.rotation.y += (lookTo - this.headG.rotation.y) * Math.min(1, dt * 3);
    this.headG.rotation.x = stun ? 0.35 : Math.sin(t * 0.5) * 0.03;
    // the arms: the shield held before it, the club at its side, a move's swing over its k
    let lx = -0.55, lz = 0.15, rx = -0.1, rz = 0;
    if (this.move === 'slam') { const up = ease(clamp01(this.k / 0.6)), dn = ease(clamp01((this.k - 0.6) / 0.4)); lx = -0.55 - 2.3 * up + 2.6 * dn; rx = -0.1 - 2.2 * up + 2.4 * dn; lz = 0.15 - 0.4 * up; }
    else if (this.move === 'sweep') { const back = ease(clamp01(this.k / 0.65)), swing = ease(clamp01((this.k - 0.65) / 0.35)); rx = -0.1 - 1.4 * back; rz = -1.2 * back + 2.6 * swing; this.rig.rotation.y = 0.5 * back - 0.9 * swing; }
    if (this.move !== 'sweep') this.rig.rotation.y *= Math.max(0, 1 - dt * 6);
    if (walking) { rx += Math.sin(t * 3.2) * 0.25; lx += Math.sin(t * 3.2 + Math.PI) * 0.08; }
    if (stun) { lx = 0.1; lz = 0.4; rx = 0.2; rz = -0.3; }
    const f = Math.min(1, dt * (this.move ? 14 : 6));
    this.armL.rotation.x += (lx - this.armL.rotation.x) * f; this.armL.rotation.z += (lz - this.armL.rotation.z) * f;
    this.armR.rotation.x += (rx - this.armR.rotation.x) * f; this.armR.rotation.z += (rz - this.armR.rotation.z) * f;
    // the light in its eyes: calm, brighter on watch and through a windup, dim in a stun and going out as it crumbles
    const want = this.dead >= 0 ? 0 : stun ? 0.25 : this.move ? 1.4 : P === 'watch' ? 1.15 : 0.9;
    this.look += (want - this.look) * Math.min(1, dt * 4);
    const g = this.look * (0.92 + 0.08 * Math.sin(t * 2.1));
    this.eyes.color.setHex(L.light).multiplyScalar(g);
    // a blow's flash on the clay
    this.flash = Math.max(0, this.flash - dt);
    this.mat.emissiveIntensity = (this.flash / L.flash) * 0.55;
  }

  dispose() { this.root.removeFromParent(); this.mat.dispose(); this.eyes.dispose(); }
}

/** The factory the runtime asks for a body by (as `game.makeSeaBeast` for the sea beasts): `game.makeSentinelBody({ scale })`. */
export function installSentinelBody(game) { game.makeSentinelBody = (o) => new SentinelBody(game, o); return game.makeSentinelBody; }
