// ---------------------------------------------------------------------------------------
// THE VANTAGE FRAMES: each of Wonder's five vantages (world/vantages.js, Petra's spots; docs/plans/FEELINGS-AWAKENING.md section 2)
// built as a lookout in the island's own language, and its view framed. Every one has the same two parts, made of what it stands on:
//   - THE STAND: a round stone let into the ground on the very spot, a thin ring of Wonder's colour inlaid in it (a world mark, no
//     words): lit until the vantage is reached, then settled to a faint glint (a collection kept). The body wants to stand on it.
//   - THE FRAME: a threshold the view is seen through from behind the Courier (two posts and a lintel, a shrine gate's bones), set on
//     the vantage's look so the vista sits in its window; the camera is left alone (Petra's), the world is composed round it.
// The five:
//   workshop.atrium  a shino gate on the atrium rail, an ash-glazed lintel (the kiln mouth's own), the hall, the mobile and the kiln below.
//   weir.pier        a gate standing in the pond off the pier's end, celadon posts and a tenmoku kasagi: the pillar and pergola in it.
//   shore.horizon    a Dunes trilithon at the jetty's end (the ruins' clay and dark lintel): the land's last gate, the Emocean in it.
//   bowl.ledge       a gate of the Great Dunemaw's own stone on the ledge's lip (its kit), the sleeping Great Slip Jelly framed below.
//   gnomon.crown     a sundial's face at the crown (a tin-glazed dial, tenmoku hour lines), a kerb, three trilithons: the oasis, east
//                    over the sea, west over the dunes.
// Static: each frame's parts merged by look (render/merge.js), its own zone by where it stands (the bowl's in the bowl's group, built
// and taken down with it); colliders on simple boxes; the materials are the level's own (room glazes, vfx/roomglazes.js) and shared.
// No lamps: the frames take the light that is there.
//
// Prior art: Breath of the Wild's and Ghost of Tsushima's lookouts (a ledge and a framing tree or gate that compose the vista for a
// camera the game does not take), Itsukushima's great torii standing in the sea (the Weir's gate in the pond), the torii as a threshold
// (two posts, a nuki tie, a kasagi lintel), Stonehenge's trilithons and the Dunes' own ruin gates (dunes.js), Chinese and Roman
// sundials (the gnomon and its hour lines on a dial), Ansel Adams' and the Japanese garden's shakkei, borrowed scenery framed by what
// is near.
//
//   game.vantageFrames = new VantageFrames(game)   .update(rawDt)   (builds each frame once what it stands on exists)
//   VANTAGE_FRAMES (the numbers)   .frames { [vantageId]: { group, ring } }
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
const G = (k) => ROOM_GLAZES[k].body; // (a room glaze's colour id: Level.mat dresses it)
const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();

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
  /** A trilithon: two square posts and a slab across them, the Dunes' ruin gate, `z` out along the bearing `rotY` (its own group). */
  trilithon(z, { gap, h, post = 0.9, postColor, capColor, rotY = 0, y0 = 0 }) {
    const g = new THREE.Group(); g.rotation.y = rotY; this.group.add(g);
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

/** The five frames, keyed by vantage id: (kit, game, V) -> the stand's ring. Each in its own space (+z the view). */
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
};

export class VantageFrames {
  constructor(game) {
    this.game = game; this.t = VANTAGE_FRAMES.every; this.frames = {}; this.mats = new Map(); this.bowl = null;
    this.body = game.physics?.world.createRigidBody(RAPIER.RigidBodyDesc.fixed()) ?? null;
  }

  /** One shared material per colour, the level's own (dressed as its room glaze); `shared`, so a group's dispose leaves it. */
  mat(color) {
    if (!this.mats.has(color)) { const m = this.game.level?.mat(color) ?? new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }); m.userData.shared = true; this.mats.set(color, m); }
    return this.mats.get(color);
  }

  update(raw = 1 / 60) {
    if ((this.t += raw) < VANTAGE_FRAMES.every) return;
    this.t = 0;
    const g = this.game;
    if (g.bowl !== this.bowl) { delete this.frames['bowl.ledge']; this.bowl = g.bowl ?? null; } // (a new run's bowl: its frame goes with it)
    for (const V of VANTAGES) {
      if (!this.frames[V.id]) { try { this.build(V); } catch (err) { this.frames[V.id] = { failed: true }; console.warn('vantage frame', V.id, err); } }
      const ring = this.frames[V.id]?.ring; if (!ring) continue;
      const k = g.vantages?.reached(V.id) ? VANTAGE_FRAMES.ringKept : VANTAGE_FRAMES.ringLit;
      if (ring.userData.k !== k) { ring.userData.k = k; ring.material.color.setHex(COLOR.wonder).multiplyScalar(k); }
    }
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
    this.frames[V.id] = { group, ring };
  }
}
