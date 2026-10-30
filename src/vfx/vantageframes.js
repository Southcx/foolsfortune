// ---------------------------------------------------------------------------------------
// THE VANTAGE FRAMES: each of Wonder's seven vantages (world/vantages.js, Petra's spots; docs/plans/FEELINGS-AWAKENING.md section 2)
// built as a lookout in the island's own language, and its view framed. Every one has the same two parts, made of what it stands on:
//   - THE STAND: a round stone let into the ground on the very spot, a thin ring of Wonder's colour inlaid in it (a world mark, no
//     words): lit until the vantage is reached, then settled to a faint glint (a collection kept). The body wants to stand on it.
//   - THE FRAME: a threshold the view is seen through from behind the Courier (two posts and a lintel, a shrine gate's bones), set on
//     the vantage's look so the vista sits in its window; the camera is left alone (Petra's), the world is composed round it.
//   - A SIGHTLINE (where the stand cannot be seen from where it is first wanted): a Lachrymite drop on a cord hung off the vantage's
//     edge into the view below, its halo breathing in Wonder's colour and a star's glint flashing on it every few real seconds, so the
//     eye goes up to it (a world mark, no words); it dims with the ring once the vantage is reached. The atrium's: the first path's
//     third step (FIRST-HOUR.md), and its stand sits on the slab 7 m over where the Courier wakes, behind the slab's edge from below.
// The seven:
//   workshop.atrium  a shino gate on the atrium rail, an ash-glazed lintel (the kiln mouth's own), the hall, the mobile and the kiln below.
//   weir.pier        a gate standing in the pond off the pier's end, celadon posts and a tenmoku kasagi: the pillar and pergola in it.
//   shore.horizon    a Dunes trilithon at the jetty's end (the ruins' clay and dark lintel): the land's last gate, the Emocean in it.
//   bowl.ledge       a gate of the Great Dunemaw's own stone on the ledge's lip (its kit), the sleeping Great Slip Jelly framed below.
//   gnomon.crown     a sundial's face at the crown (a tin-glazed dial, tenmoku hour lines), a kerb, three trilithons: the oasis, east
//                    over the sea, west over the dunes.
//   ridges.crest     an old trilithon half sunk in the crest's sand, leaning, its window outward over the ridges to the barrier, two of
//                    its blocks fallen beside it; the stand behind it.
//   ruins.arch       the tallest ruin arch is its own frame: the stand let into its lintel's top, and a sightline hung from the lintel's
//                    underside in the arch's opening (the stand is 8 to 11 m up, out of sight from the sand below).
// Static: each frame's parts merged by look (render/merge.js), its own zone by where it stands (the bowl's in the bowl's group, built
// and taken down with it); colliders on simple boxes; the materials are the level's own (room glazes, vfx/roomglazes.js) and shared.
// No lamps: the frames take the light that is there.
//
// Prior art: Breath of the Wild's and Ghost of Tsushima's lookouts (a ledge and a framing tree or gate that compose the vista for a
// camera the game does not take), Itsukushima's great torii standing in the sea (the Weir's gate in the pond), the torii as a threshold
// (two posts, a nuki tie, a kasagi lintel), Stonehenge's trilithons and the Dunes' own ruin gates (dunes.js), Chinese and Roman
// sundials (the gnomon and its hour lines on a dial), Ansel Adams' and the Japanese garden's shakkei, borrowed scenery framed by what
// is near. The sightline: Breath of the Wild's shrine glow and the Sheikah Tower's beacon (a light that reads from far below and says
// "up there" with no word), Ghost of Tsushima's guiding wind and golden birds (the world pointing), and a crystal hung in a window.
//
//   game.vantageFrames = new VantageFrames(game)   .update(rawDt)   (builds each frame once what it stands on exists)
//   VANTAGE_FRAMES (the numbers)   .frames { [vantageId]: { group, ring } }   .sightlines { [vantageId]: group }   SIGHTLINES (where)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RAPIER, GROUPS } from '../core/physics.js';
import { addOutline } from '../render/outline.js';
import { mergeStatic } from '../render/merge.js';
import { zoneOf } from '../render/zones.js';
import { VANTAGES } from '../world/vantages.js';
import { COLOR } from '../progress/weather.js';
import { ROOM_GLAZES } from './roomglazes.js';
import { DUNE, OASIS } from '../world/dunes/dunes.js';

/** `every` how often the frames are asked after (real s); the ring's light unreached / reached (of Wonder's colour); the Dunes' ruin
 *  colours (dunes.js: its trilithons' clay and dark lintels). */
export const VANTAGE_FRAMES = { every: 0.5, ringLit: 1.0, ringKept: 0.32, ruinClay: 0xd9906a, ruinDark: 0x8a4a3a };
/** A vantage's sightline, in its frame's space (origin the stand, +z the view): the cord's top (on the balustrade's rail), its drop (m),
 *  the drop's size (m), the halo's and the glint's size (m), the breath's and the glint's period (real s), the light kept once reached.
 *  The atrium's hangs off the balustrade's rail 1.1 m out (world/level.js: the rail at z -6, its top F2 + 1.0), 1.9 m down past the
 *  slab's edge, 1.6 m to the stand's left (on the stand's line, the ground floor's middle joist hid it from the spawn): from the spawn
 *  (0, 0, -11.5) it sits in the view's top sixth, where the stand itself is 7 m up behind the slab and out of the view. */
export const SIGHTLINES = {
  'workshop.atrium': { top: [-1.6, 1.0, 1.1], drop: 1.9, size: 0.16, halo: 1.1, glint: 0.9, breath: 3.2, every: 2.6, kept: 0.25 },
  // the ruins' arch: from the lintel's underside (its 1.3 m slab under the stand), 1.6 m down into the opening, sized to read across the sand;
  // `day`: under the open sky its halo is laid over, not added (an added glow is lost against noon's sky)
  'ruins.arch': { top: [0, -1.3, 0], drop: 1.6, size: 1.05, halo: 4.2, glint: 3.4, breath: 3.6, every: 3.0, kept: 0.25, day: true },
};
const G = (k) => ROOM_GLAZES[k].body; // (a room glaze's colour id: Level.mat dresses it)
const _p = new THREE.Vector3(), _q = new THREE.Quaternion();
let TEX = null;
/** The halo's soft disc and the glint's four-pointed star, drawn once on canvases (no image files). */
function sightTextures() {
  if (TEX) return TEX;
  const disc = document.createElement('canvas'); disc.width = disc.height = 64;
  let c = disc.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  const star = document.createElement('canvas'); star.width = star.height = 64; c = star.getContext('2d');
  for (const [w, h] of [[3, 30], [30, 3]]) { gr = c.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(32, 32, w, h, 0, 0, Math.PI * 2); c.fill(); }
  TEX = { disc: new THREE.CanvasTexture(disc), star: new THREE.CanvasTexture(star) };
  return TEX;
}
/** A vantage's sightline (SIGHTLINES): the cord, the drop, its halo and glint, added to the frame's group after its merge. */
function buildSightline(group, S) {
  const g = new THREE.Group(); g.name = 'vantage-sightline';
  const [x, y, z] = S.top, wonder = new THREE.Color(COLOR.wonder);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, S.drop, 4), new THREE.MeshBasicMaterial({ color: 0x3a2a20 }));
  cord.position.set(x, y - S.drop / 2, z); g.add(cord);
  const drop = new THREE.Mesh(new THREE.OctahedronGeometry(S.size / 2, 0), new THREE.MeshBasicMaterial({ color: wonder }));
  drop.scale.set(0.7, 1.4, 0.7); drop.position.set(x, y - S.drop - S.size * 0.6, z); g.add(drop);
  const T = sightTextures(), spr = (map, size) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: wonder, blending: S.day ? THREE.NormalBlending : THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); m.scale.setScalar(size); m.position.copy(drop.position); m.renderOrder = 5; g.add(m); return m; };
  const halo = spr(T.disc, S.halo), glint = spr(T.star, S.glint);
  for (const o of [cord, drop, halo, glint]) { o.name = 'vantage-sightline-part'; o.castShadow = false; }
  group.add(g);
  g.userData = { S, drop, halo, glint, k: 1, haloK: S.day ? 0.5 : 1 };
  return g;
}

/** A frame's kit: parts placed in the frame's own space (origin on the spot's floor, +z the way the view looks), drawn and collided. */
class Kit {
  constructor(vf, group, collide) { this.vf = vf; this.group = group; this.collide = collide; }
  /** A box at local (x, y0..y1, z), w across and d deep; `rotY` / `rotZ` its own turn; `outline`, `collide`. */
  box(x, y0, y1, z, w, d, color, { rotY = 0, rotZ = 0, outline = true, collide = true } = {}) {
    const h = y1 - y0, m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.vf.mat(color));
    m.position.set(x, (y0 + y1) / 2, z); m.rotation.set(0, rotY, rotZ); return this.add(m, [w / 2, h / 2, d / 2], outline, collide);
  }
  /** A round drum (a post, a capital), r0 at its foot and r1 at its top. */
  drum(x, y0, y1, z, r0, r1, color, { segs = 10, outline = true, collide = true } = {}) {
    const h = y1 - y0, m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, segs), this.vf.mat(color));
    m.position.set(x, (y0 + y1) / 2, z); return this.add(m, collide ? { cyl: [h / 2, Math.max(r0, r1)] } : null, outline, collide);
  }
  add(m, half, outline, collide) {
    m.castShadow = m.receiveShadow = true; if (outline) addOutline(m); this.group.add(m);
    if (collide && half) {
      this.group.updateMatrixWorld(true); m.updateMatrixWorld(true); m.getWorldPosition(_p); m.getWorldQuaternion(_q);
      const d = half.cyl ? RAPIER.ColliderDesc.cylinder(half.cyl[0], half.cyl[1]) : RAPIER.ColliderDesc.cuboid(half[0], half[1], half[2]);
      this.collide(d.setTranslation(_p.x, _p.y, _p.z).setRotation(_q).setCollisionGroups(GROUPS.static).setFriction(0.9));
    }
    return m;
  }
  /** A shrine gate: two posts `gap` apart (inside), a nuki tie, a kasagi lintel overhanging with its ends lifted. */
  gate(z, { gap, h, post = 0.34, round = false, y0 = 0, postColor, tieColor, capColor, over = 0.7, tie = true, collideCap = true }) {
    const px = gap / 2 + post / 2;
    for (const s of [-1, 1]) {
      if (round) this.drum(s * px, y0, h, z, post * 0.62, post * 0.5, postColor, { segs: 8 });
      else this.box(s * px, y0, h, z, post, post, postColor);
    }
    const span = gap + post * 2;
    if (tie) this.box(0, h - 1.05, h - 0.8, z, span + 0.3, post * 0.6, tieColor ?? postColor, { collide: collideCap });
    this.box(0, h, h + 0.32, z, span + over, post * 1.2, capColor, { collide: collideCap }); // (the kasagi)
    for (const s of [-1, 1]) this.box(s * (span + over) / 2, h + 0.18, h + 0.5, z, 0.5, post * 1.25, capColor, { rotZ: s * -0.32, collide: false }); // (its ends lifted)
  }
  /** A trilithon: two square posts and a slab across them, the Dunes' ruin gate, `z` out along the bearing `rotY` (its own group), leant
   *  `lean` rad in its own plane. */
  trilithon(z, { gap, h, post = 0.9, postColor, capColor, rotY = 0, y0 = 0, lean = 0 }) {
    const g = new THREE.Group(); g.rotation.set(0, rotY, lean); this.group.add(g); // (turned and leant before its parts: their colliders are laid as drawn)
    const was = this.group; this.group = g;
    for (const s of [-1, 1]) this.box(s * (gap / 2 + post / 2), y0, h, z, post, post, postColor);
    this.box(0, h, h + 0.8, z, gap + post * 2.6, post * 1.15, capColor);
    this.group = was; return g;
  }
  /** The stand: a round stone let into the floor, Wonder's ring inlaid in it (lit until the vantage is reached). */
  stand(r, color) {
    this.drum(0, 0, 0.05, 0, r, r, color, { segs: 20, outline: false, collide: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, 0.035, 4, 40), new THREE.MeshBasicMaterial({ color: COLOR.wonder }));
    ring.rotation.x = Math.PI / 2; ring.scale.z = 0.4; ring.position.y = 0.055; ring.name = 'vantage-ring'; // (named: never merged, its light changes)
    this.group.add(ring); return ring;
  }
}

/** The seven frames, keyed by vantage id: (kit, game, V) -> the stand's ring. Each in its own space (+z the view). */
const BUILD = {
  // The atrium rail: the posts stand on the slab's edge and rise through the balustrade (newels of a gate), the lintel high over it;
  // from behind the Courier, the hall, the mobile's lanterns and the kiln are seen through it, down the atrium.
  'workshop.atrium': (k) => {
    k.gate(1.0, { gap: 3.8, h: 3.3, post: 0.3, postColor: G('shino'), tieColor: G('shino'), capColor: G('ash'), tie: false, over: 0.9 });
    for (const s of [-1, 1]) k.box(s * 2.05, 0, 0.12, 0.9, 0.56, 0.4, G('ash'), { collide: false }); // (the posts' feet)
    return k.stand(0.85, G('bisque'));
  },
  // The Weir's pier: a gate in the pond a little off the pier's end, standing from the pond's bed (Itsukushima's), the pond's stone
  // pillar in its window and the pergola beyond; its lintel kept clear of a hook's line to the pillar's ledge (it does not collide).
  'weir.pier': (k) => {
    k.gate(1.8, { gap: 4.6, h: 5.1, y0: -7, post: 0.36, round: true, postColor: G('celadon'), tieColor: G('celadon'), capColor: G('tenmoku'), collideCap: false, over: 1.1 });
    return k.stand(0.8, G('salt'));
  },
  // The jetty's end: a Dunes trilithon over the last planks, its posts standing in the crude just past the deck's edges (as the
  // jetty's own piles), wide enough that the Emocean's horizon fills its window from behind the Courier.
  'shore.horizon': (k) => {
    k.trilithon(1.7, { gap: 4.3, h: 5.0, y0: -6, post: 0.55, postColor: VANTAGE_FRAMES.ruinClay, capColor: VANTAGE_FRAMES.ruinDark });
    return k.stand(0.9, VANTAGE_FRAMES.ruinClay);
  },
  // The bowl's ledge: a gate of the cave's own stone past the Lip Stone, near the lip, the sleeping Great Slip Jelly framed below it.
  'bowl.ledge': (k, g) => {
    const K = g.bowl?.K, wall = K?.wall, trim = K?.trim ?? wall;
    const post = (x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.2, 0.9), wall); m.position.set(x, 2.6, 2.6); return k.add(m, [0.45, 2.6, 0.45], true, true); };
    if (wall) {
      post(-3.4); post(3.4);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.8, 1.2), trim); cap.position.set(0, 5.6, 2.6); k.add(cap, [4.7, 0.4, 0.6], true, true);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.4, 0.6), trim); tie.position.set(0, 4.4, 2.6); k.add(tie, [3.7, 0.2, 0.3], true, true);
    }
    return k.stand(1.0, G('tenmoku'));
  },
  // The Gnomon's crown: the spire's top flared into a capital and laid as a sundial's face (the Gnomon is the Dunes' shadow-stick:
  // here its own dial), a kerb round its edge, three trilithons on it: toward the oasis, east over the sea, west over the dunes.
  'gnomon.crown': (k, g) => {
    const R = 9, dial = G('majolica'), line = G('tenmoku');
    k.drum(0, -4.2, -0.6, 0, 3.2, R, dial, { segs: 18, collide: false }); // (the capital: the cone's 3 m top flared to the collider's 9)
    k.drum(0, -0.6, 0.02, 0, R, R, dial, { segs: 24, collide: false }); // (the dial: the crown's own collider is its floor)
    for (let i = 0; i < 12; i++) k.box(0, 0.02, 0.05, 0, 0.12, R - 2.4, line, { rotY: (i / 12) * Math.PI * 2, outline: false, collide: false }); // (the hour lines)
    const s = g.dunes?.gnomon, oasis = s ? Math.atan2(DUNE.x + OASIS.x - s.x, DUNE.z + OASIS.z - s.z) : Math.PI / 4;
    const gates = [oasis, Math.PI / 2, -Math.PI / 2], half = 0.5; // (bearings in the frame's space, which is the world's: the crown's frame is not turned)
    for (const b of gates) k.trilithon(R - 0.7, { gap: 4, h: 4.6, post: 0.9, postColor: VANTAGE_FRAMES.ruinClay, capColor: VANTAGE_FRAMES.ruinDark, rotY: b });
    for (let i = 0; i < 24; i++) { // (the kerb: low blocks round the edge, broken where a gate stands)
      const a = (i + 0.5) / 24 * Math.PI * 2;
      if (gates.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < half)) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.6), k.vf.mat(VANTAGE_FRAMES.ruinClay));
      m.position.set(Math.sin(a) * (R - 0.4), 0.25, Math.cos(a) * (R - 0.4)); m.rotation.y = a; k.add(m, [1.0, 0.25, 0.3], true, true);
    }
    return k.stand(1.4, line);
  },
  // The ridges' crest: the highest sand in the ridges. An old trilithon half sunk in it and leaning a little, its window turned outward
  // (away from the oasis) so the ridges fall away through it to the barrier; two of its blocks fallen in the sand beside it; the stand
  // behind it on the crest. Bearings in the world's space, as the Gnomon's: a crest has no look, so its frame is not turned.
  'ridges.crest': (k) => {
    const p = k.group.position, out = Math.atan2(p.x - DUNE.x, p.z - DUNE.z), clay = VANTAGE_FRAMES.ruinClay, dark = VANTAGE_FRAMES.ruinDark;
    k.trilithon(3.2, { gap: 3.6, h: 3.6, y0: -1.4, post: 0.85, postColor: clay, capColor: dark, rotY: out, lean: 0.06 }); // (leaning: the crest's sand gave under one post)
    const side = (a, r) => [Math.sin(out + a) * r, Math.cos(out + a) * r];
    const [x1, z1] = side(0.9, 4.2), [x2, z2] = side(-1.2, 3.4);
    k.box(x1, -0.4, 0.45, z1, 2.4, 1.0, dark, { rotY: out + 0.5, rotZ: 0.12 }); // (the fallen cap's half)
    k.box(x2, -0.5, 0.35, z2, 0.85, 1.9, clay, { rotY: out - 0.3, rotZ: -0.2 }); // (a post's drum, toppled)
    k.drum(0, -0.6, 0.0, 0, 1.15, 1.05, clay, { segs: 18, collide: false }); // (the stand's bed, so it sits flush on a slope)
    return k.stand(1.05, clay);
  },
  // The ruins' arch: the tallest arch is the frame already; its lintel's top takes the stand (the lintel is 1.9 m deep: dunes.js w x 1.2),
  // and its sightline hangs under the lintel in the opening (SIGHTLINES).
  'ruins.arch': (k) => k.stand(0.78, VANTAGE_FRAMES.ruinClay),
};

export class VantageFrames {
  constructor(game) {
    this.game = game; this.t = VANTAGE_FRAMES.every; this.frames = {}; this.mats = new Map(); this.bowl = null; this.sightlines = {}; this.clock = 0;
    this.body = game.physics?.world.createRigidBody(RAPIER.RigidBodyDesc.fixed()) ?? null;
  }

  /** One shared material per colour, the level's own (dressed as its room glaze); `shared`, so a group's dispose leaves it. */
  mat(color) {
    if (!this.mats.has(color)) { const m = this.game.level?.mat(color) ?? new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }); m.userData.shared = true; this.mats.set(color, m); }
    return this.mats.get(color);
  }

  update(raw = 1 / 60) {
    this.clock += raw;
    for (const id in this.sightlines) this.breathe(this.sightlines[id]);
    if ((this.t += raw) < VANTAGE_FRAMES.every) return;
    this.t = 0;
    const g = this.game;
    if (g.bowl !== this.bowl) { delete this.frames['bowl.ledge']; this.bowl = g.bowl ?? null; } // (a new run's bowl: its frame goes with it)
    for (const V of VANTAGES) {
      if (!this.frames[V.id]) { try { this.build(V); } catch (err) { this.frames[V.id] = { failed: true }; console.warn('vantage frame', V.id, err); } }
      const ring = this.frames[V.id]?.ring; if (!ring) continue;
      const k = g.vantages?.reached(V.id) ? VANTAGE_FRAMES.ringKept : VANTAGE_FRAMES.ringLit;
      if (ring.userData.k !== k) { ring.userData.k = k; ring.material.color.setHex(COLOR.wonder).multiplyScalar(k); }
      const sl = this.sightlines[V.id]; if (sl) sl.userData.k = k === VANTAGE_FRAMES.ringLit ? 1 : sl.userData.S.kept;
    }
  }

  /** A sightline's breath (the halo swelling and fading over S.breath real s) and its glint (a star's flash every S.every real s), by its
   *  light (1 until the vantage is reached, then S.kept: a faint glint, the collection kept). */
  breathe(sl) {
    if (!sl.parent?.visible && sl.parent) return;
    const { S, drop, halo, glint, k, haloK } = sl.userData, t = this.clock;
    const b = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / S.breath);
    halo.material.opacity = k * (0.55 + 0.45 * b) * haloK; halo.scale.setScalar(S.halo * (0.85 + 0.25 * b));
    const ph = (t % S.every) / S.every, flash = ph < 0.18 ? Math.sin(ph / 0.18 * Math.PI) : 0;
    glint.material.opacity = k * flash; glint.scale.setScalar(S.glint * (0.4 + 0.8 * flash)); glint.material.rotation = t * 0.6;
    drop.rotation.y = t * 0.5; drop.material.color.setHex(COLOR.wonder).multiplyScalar(0.55 + 0.45 * k * (0.6 + 0.4 * b));
  }

  /** Build a vantage's frame once its spot exists (the jetty, the Gnomon, the bowl are built later than the boot, or per run). */
  build(V) {
    const g = this.game, at = V.at(g), make = BUILD[V.id];
    if (!at || !make) return;
    const p = at.isVector3 ? at.clone() : new THREE.Vector3(at[0], at[1], at[2]);
    const inBowl = V.id === 'bowl.ledge';
    if (inBowl && !g.bowl?.group) return;
    if (inBowl) p.y -= 0.05; // (the ledge stand is 5 cm over the ledge: bowl.js lipStand)
    const look = V.look(g); let yaw = 0;
    if (look) { const lx = (look.isVector3 ? look.x : look[0]) - p.x, lz = (look.isVector3 ? look.z : look[2]) - p.z; yaw = Math.atan2(lx, lz); }
    const group = new THREE.Group(); group.name = `vantage-frame-${V.id}`;
    const parent = inBowl ? g.bowl.group : g.scene;
    if (inBowl) { parent.updateMatrixWorld(true); group.position.copy(parent.worldToLocal(p.clone())); } else { group.position.copy(p); group.userData.zone = zoneOf(p); }
    group.rotation.y = yaw; parent.add(group); group.updateMatrixWorld(true);
    const collide = inBowl ? (d) => g.bowl.collide(d) : (d) => g.physics.world.createCollider(d, this.body);
    const ring = make(new Kit(this, group, collide), g, V);
    group.traverse((o) => { if (o.isGroup && o !== group) mergeStatic(o); }); mergeStatic(group);
    if (SIGHTLINES[V.id]) this.sightlines[V.id] = buildSightline(group, SIGHTLINES[V.id]); // (after the merge: it moves)
    this.frames[V.id] = { group, ring };
  }
}
