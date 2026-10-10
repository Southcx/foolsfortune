// ---------------------------------------------------------------------------------------
// THE COMBAT WING'S LOOK: what the Throwing Room's combat wing wears (docs/plans/COMBAT-LAB.md; the place and its measures are
// world/testroom/combatwing.js and layout.js TR.wing). The wing is the Workshop's practice yard under a roof, so it is the potters' too:
// tamped clay, straw, cream slip, oxblood, the Workshop's dark wood, and the paint range's quarry tiles (vfx/testroomkit.js) for every
// mark the feet stand on. One look: a potter's yard where a scarecrow is sparred with.
//
//   THE SPARRING CIRCLE  a disc of tamped clay ringed by straw bales sunk to their middles, the four at the quarters set out a hand
//                    (a sumo dohyo's tawara and tokudawara: a clay ring bounded by straw, and Strawman is straw), each bale bound
//                    with two cords. Set in its clay between Strawman and the striker, crosswise, the FRAME METER: twenty dark tiles, a
//                    tenth of a second each (two seconds: the longest blow charted, the delayed swing, start to rest), time running
//                    left to right as the striker sees it, dark until the mechanic lights them (fighting games' frame meter, Street
//                    Fighter 6's). (Behind Strawman first, its body hid the strip from the striker's place.)
//   THE MIRROR       a long glass on the west wall in a dark wood frame, a dance studio's (a stand-in: silvered grey with the cartoon
//                    mirror's glints, no reflection yet)
//   THE LECTERNS     each station's reading desk, the Index's lectern's shape (vfx/testroomkit.js) with its book shut: a stand-in until
//                    its page is built (no projection, no glow: nothing promised that does not answer)
//   THE STATUS PLAQUES fired tiles hung on the status bench's front under each roly-poly, as labels on a shelf, each with its
//                    status's glyph (the Figment attack telegraphs' own pictures, ui/icons/figmenttelegraphart.js STATUS_ART, in the icons'
//                    hand): no words. (Laid flat on the floor first, they were unreadable at the striker's grazing angle.)
//   THE STAND-INS    the parry range's pitcher (a big clay jug on a plinth, its spout toward the marks), the Figment telegraph floor's
//                    caster (a tall urn on a turntable), the status bench's eleven little roly-polies (Strawman's kin, a Daruma's
//                    shape in burlap): static bodies where the mechanic is not built
//
// Prior art: the sumo dohyo (clay and straw, the ring as the rule), the dance studio's mirror wall and the fencing salle's strip, the
// fighting games' training stage (Tekken's and Street Fighter's grid floors, a frame meter under the fight), the batting cage's pitching
// machine (the pitcher), the okiagari-koboshi and the Daruma (the roly-polies), the paint range's tiles and tallies (testroomkit.js).
//
//   WING_COLOR   the wing's colours (the level merges by colour: world/testroom/combatwing.js builds with these)
//   lecternParts() strawRoly() parryPitcher() telegraphCaster() -> [{ geo, color, outline }]   (local frames; the place sets them down)
//   markTiles(list [{ x, z, yaw, y }]) -> Mesh   (the quarry tiles, one draw; chevron toward local +x turned by yaw)
//   statusPlaques(list [{ x, y, z, yaw, status }]) -> Mesh   (one draw; a glyph a plaque, standing, its face toward local +z turned by yaw)
//   mirrorGlass(w, h) -> Mesh   STATUS_BENCH_ORDER
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE } from '../core/config.js';
import { quarryTile } from './testroomkit.js';
import { uiIcon } from '../ui/icons/icons.js';

/** The wing's colours (each colour a batch of the level's, a draw call or two: so the cords, the books and the meter's tiles are the
 *  palette's own, already batched in the room, and only what has no palette colour is new). */
export const WING_COLOR = { straw: 0xbf9746, cord: PALETTE.dark, slip: 0xcdb895, screed: 0x5e5850, oxblood: 0x7a2a1e, sand: 0xd2b07c, burlap: 0xcdb48c, cover: PALETTE.deep, slate: PALETTE.deep };

/** The status bench's order (the owner's list, 2026-10-10): the five a blow or a tool lays on, the two of the press, the four a damage
 *  type builds, and soaked. calm and melt have no glyph yet (FIGMENT-TELEGRAPHS.md section 4 drew nine): their tiles are plain. */
export const STATUS_BENCH_ORDER = ['stun', 'halt', 'slow', 'sleep', 'calm', 'melt', 'doubt', 'charm', 'blind', 'confusion', 'soaked'];

const T = (geo, m) => geo.applyMatrix4(m);
const M = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
const lathe = (pts, n = 12) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n);

/** A station's lectern, built facing local +z (the reader there), the Index's lectern's measures: a foot, a turned post, a desk sloped
 *  to the reader and its ledge, and a shut book (a stand-in: the station's page is not built). About 0.56 by 0.46 m, 1.15 m high. */
export function lecternParts() {
  const C = PALETTE, tilt = 0.42, out = [];
  out.push({ geo: T(new THREE.BoxGeometry(0.56, 0.06, 0.46), M(0, 0.03, 0)), color: C.dark, outline: true });
  out.push({ geo: T(lathe([[0.11, 0], [0.08, 0.06], [0.06, 0.12], [0.07, 0.5], [0.055, 0.82], [0.09, 0.9], [0.11, 0.95]], 10), M(0, 0.06, 0)), color: C.dark, outline: true });
  out.push({ geo: T(new THREE.BoxGeometry(0.66, 0.05, 0.48), M(0, 1.1, 0, tilt)), color: C.dark, outline: true });
  out.push({ geo: T(new THREE.BoxGeometry(0.66, 0.06, 0.03), M(0, 1.0, 0.235, tilt)), color: C.dark, outline: true });
  out.push({ geo: T(new THREE.BoxGeometry(0.5, 0.05, 0.36), new THREE.Matrix4().makeRotationX(tilt).premultiply(new THREE.Matrix4().makeTranslation(0, 1.145, 0))), color: WING_COLOR.cover, outline: false }); // (the book, shut)
  return out;
}

/** One of the status bench's little roly-polies (Strawman's kin): a burlap body on a black ball foot, a round head, a stitched band;
 *  about 0.55 m high, standing on its origin. A stand-in for a creature that takes statuses (the mechanic: COMBAT-LAB.md section 5). */
export function strawRoly() {
  const C = PALETTE;
  return [
    { geo: T(new THREE.SphereGeometry(0.08, 10, 6), M(0, 0.08, 0)), color: C.outline, outline: false },
    { geo: T(new THREE.SphereGeometry(0.17, 12, 8), M(0, 0.24, 0, 0, 0, 0, 1)).scale(1, 1.15, 1).translate(0, -0.035, 0), color: WING_COLOR.burlap, outline: true },
    { geo: T(new THREE.SphereGeometry(0.11, 12, 8), M(0, 0.47, 0)), color: WING_COLOR.burlap, outline: true },
    { geo: T(new THREE.CylinderGeometry(0.115, 0.13, 0.04, 12), M(0, 0.395, 0)), color: WING_COLOR.oxblood, outline: false }, // (the neck's cord)
  ];
}

/** The parry range's pitcher, a stand-in for the thing that lobs: a big clay jug on a plinth, about 1.9 m high to its lip, its spout
 *  toward local +z (the marks) and its handle behind. The pitching (plain and outlined shots, speeds, angles) is not built. */
export function parryPitcher() {
  const C = PALETTE, out = [];
  out.push({ geo: T(new THREE.BoxGeometry(1.2, 0.5, 1.2), M(0, 0.25, 0)), color: C.dark, outline: true });
  out.push({ geo: T(lathe([[0.001, 0], [0.32, 0], [0.42, 0.12], [0.5, 0.42], [0.48, 0.7], [0.36, 0.95], [0.27, 1.12], [0.28, 1.3], [0.33, 1.38], [0.31, 1.4]], 16), M(0, 0.5, 0)), color: C.pot, outline: true });
  out.push({ geo: T(new THREE.ConeGeometry(0.1, 0.3, 8, 1, true), M(0, 1.78, 0.33, Math.PI / 2 + 0.5)), color: C.pot, outline: false }); // (the spout, lipped forward)
  out.push({ geo: T(new THREE.TorusGeometry(0.2, 0.045, 6, 12, Math.PI), M(0, 1.45, -0.36, 0, Math.PI / 2, -Math.PI / 2)), color: C.pot, outline: true }); // (the handle)
  out.push({ geo: T(new THREE.TorusGeometry(0.47, 0.02, 4, 24), M(0, 1.05, 0, Math.PI / 2)), color: WING_COLOR.oxblood, outline: false }); // (a band of oxblood round the belly)
  return out;
}

/** The Figment telegraph floor's caster, a stand-in for whatever throws the shapes: a tall urn on a low turntable, about 1.9 m high,
 *  its front local +z. Which creature casts, and how it turns to face, is the mechanic's (COMBAT-LAB.md section 3). */
export function telegraphCaster() {
  const C = PALETTE;
  return [
    { geo: T(new THREE.CylinderGeometry(0.75, 0.8, 0.22, 20), M(0, 0.11, 0)), color: C.dark, outline: true },
    { geo: T(lathe([[0.001, 0], [0.22, 0], [0.3, 0.1], [0.42, 0.55], [0.44, 0.9], [0.34, 1.25], [0.2, 1.42], [0.21, 1.55], [0.27, 1.62], [0.25, 1.65]], 16), M(0, 0.22, 0)), color: PALETTE.potLight ?? C.pale, outline: true },
    { geo: T(new THREE.TorusGeometry(0.43, 0.025, 4, 24), M(0, 0.95, 0, Math.PI / 2)), color: WING_COLOR.oxblood, outline: false },
    { geo: T(new THREE.SphereGeometry(0.07, 8, 6), M(0, 1.45, 0.36)), color: WING_COLOR.oxblood, outline: false }, // (a boss on its front: where it faces)
  ];
}

let TILE_M = null, STATUS_M = null;
/** The quarry tiles the feet stand on (the paint range's stand, testroomkit.js quarryTile: terracotta, a slip chevron along local +x),
 *  merged into one mesh. `yaw` turns the chevron (0: toward +x). */
export function markTiles(list, size = 0.7) {
  TILE_M ||= new THREE.MeshStandardMaterial({ name: 'wing-tile', map: quarryTile(), roughness: 0.8 });
  const geos = list.map(({ x, z, yaw = 0, y = 0.036 }) => new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2).rotateY(yaw).translate(x, y, z));
  const m = new THREE.Mesh(mergeGeometries(geos), TILE_M); m.name = 'combat-wing-tiles'; m.receiveShadow = true;
  return m;
}

/** The status tiles' atlas: a fired tile per status (the quarry tile's terracotta and kiln edge), its glyph at 3x in the middle, cream
 *  in the icons' hand; a 4 x 4 grid of 64 px cells. Painted once. */
function statusAtlas() {
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N * 4;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  STATUS_BENCH_ORDER.forEach((id, i) => {
    const u = (i % 4) * N, v = Math.floor(i / 4) * N;
    x.fillStyle = '#6a3018'; x.fillRect(u, v, N, N);
    const g = x.createRadialGradient(u + N / 2, v + N / 2, N * 0.1, u + N / 2, v + N / 2, N * 0.7); g.addColorStop(0, '#b4643c'); g.addColorStop(1, '#8a4428');
    x.fillStyle = g; x.fillRect(u + 3, v + 3, N - 6, N - 6);
    const icon = uiIcon(`status.${id}`, 'clay');
    if (icon.width > 1) x.drawImage(icon, u + (N - icon.width * 3) / 2, v + (N - icon.height * 3) / 2, icon.width * 3, icon.height * 3);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.anisotropy = 4; // (crisp up close, mipmapped far off: no crawl)
  return t;
}
/** The status plaques, merged into one mesh: each a `size` m tile with its status's glyph, standing, its face toward local +z turned by
 *  `yaw` (pi / 2: facing +x). */
export function statusPlaques(list, size = 0.26) {
  STATUS_M ||= new THREE.MeshStandardMaterial({ name: 'wing-status-plaque', map: statusAtlas(), roughness: 0.6 });
  const geos = list.map(({ x, z, yaw = 0, y = 0.5, status }) => {
    const i = Math.max(0, STATUS_BENCH_ORDER.indexOf(status)), u0 = (i % 4) / 4, v0 = 1 - (Math.floor(i / 4) + 1) / 4;
    const g = new THREE.PlaneGeometry(size, size), uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / 4, v0 + uv.getY(k) / 4);
    return g.rotateY(yaw).translate(x, y, z);
  });
  const m = new THREE.Mesh(mergeGeometries(geos), STATUS_M); m.name = 'combat-wing-status-plaques'; m.receiveShadow = true;
  return m;
}

let GLINT = null;
/** The glass's face, painted once: a cool grey-blue lighter toward the top, and the cartoon mirror's two glints (diagonal streaks of
 *  light, a wide one and a thin one), so it reads as a mirror before it reflects anything. */
function glassFace() {
  if (GLINT) return GLINT;
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#7d8f9c'); g.addColorStop(1, '#3c4a56'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  x.fillStyle = 'rgba(235,244,250,0.55)';
  for (const [u, w] of [[70, 22], [104, 8], [180, 14]]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u + w, 0); x.lineTo(u + w - 60, 128); x.lineTo(u - 60, 128); x.fill(); }
  GLINT = new THREE.CanvasTexture(c); GLINT.colorSpace = THREE.SRGBColorSpace; GLINT.anisotropy = 4;
  return GLINT;
}
/** The mirror's glass, a stand-in: silvered grey with its glints, no reflection yet (the reflection is a second render: COMBAT-LAB.md
 *  section 6). A thin box `w` long (local z) and `h` high, its face toward local +x. */
export function mirrorGlass(w, h) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, w), new THREE.MeshStandardMaterial({ name: 'wing-mirror-glass', map: glassFace(), roughness: 0.2 }));
  m.name = 'combat-wing-mirror'; m.receiveShadow = true;
  return m;
}
