// ---------------------------------------------------------------------------------------
// THE BRACELET'S CHARMS, AS PIECES (working name, Espada's and the owner's to rule; docs/plans/BRACELET.md section 3): each charm a small
// fired piece set in a socket of the bracelet (vfx/bracelet.js), porcelain with a touch of kintsugi gold, told apart by its shape alone
// (never a letter or a number on it: a world mark):
//
//   TWIN     two beads side by side                 (the power acts twice)
//   WIDE     a broad flat lens with a gold rim       (reach and size)
//   ECHO     a gold ring with a bead inside it      (the act repeats where it ended)
//   QUIET    a smooth low pebble, matte              (half of rejection's heat)
//   THRIFT   a cube stood on its point (a Lachryma cube's shape: the currency) (half the made matter's Lachryma)
//   LINGER   a drop hanging along the band           (twice as long)
//   GENTLE   five petals round a gold heart          (no harm to creatures)
//
// Each piece is modelled in its socket's frame: +Z out from the ring, +Y along the ring's axis, +X along the band; about 0.2 across at the
// ring's unit radius. One merged geometry a charm (cached), two materials (porcelain, gold) as groups.
//
// Prior art: Hollow Knight's charms (each read by its silhouette at a glance), Vagrant Story's gems set in a weapon's sockets, FFVII's
// materia (a bead in a slot); the shapes themselves are bead-maker's shapes (a twin bead, a lentil, a rondelle, a drop, a flower bead).
//
//   CHARM_IDS   charmGeometry(id) -> BufferGeometry (groups: 0 porcelain, 1 gold)   charmMaterials() -> [porcelain, gold]
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THE_WORLD_GOLD } from '../ui/domainlook.js';

export const CHARM_IDS = ['TWIN', 'WIDE', 'ECHO', 'QUIET', 'THRIFT', 'LINGER', 'GENTLE'];

let MATS = null;
/** The two glazes every charm is fired in: a white porcelain and kintsugi gold (shared, never disposed). */
export function charmMaterials() {
  MATS ||= [
    new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.32, metalness: 0, emissive: 0x2a2620, emissiveIntensity: 0.4 }),
    new THREE.MeshStandardMaterial({ color: THE_WORLD_GOLD, roughness: 0.35, metalness: 0.65, emissive: THE_WORLD_GOLD, emissiveIntensity: 0.18 }),
  ];
  return MATS;
}

const sphere = (r, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, 14, 10).scale(sx, sy, sz);
const at = (g, x = 0, y = 0, z = 0) => g.translate(x, y, z);
/** A cylinder facing out of the ring (its axis +Z). */
const disc = (r, h) => new THREE.CylinderGeometry(r, r, h, 20).rotateX(Math.PI / 2);
const ring = (r, tube) => new THREE.TorusGeometry(r, tube, 8, 24); // (in XY: facing out of the ring)

/** Each charm as [porcelain parts, gold parts]. */
const SHAPES = {
  TWIN: () => [[at(sphere(0.062), -0.068, 0, 0.04), at(sphere(0.062), 0.068, 0, 0.04)], [at(sphere(0.022), 0, 0, 0.03)]],
  WIDE: () => [[at(disc(0.115, 0.04).scale(1.25, 0.8, 1), 0, 0, 0.03), at(sphere(0.1, 1.25, 0.8, 0.28), 0, 0, 0.05)], [at(ring(0.115, 0.014).scale(1.25, 0.8, 1), 0, 0, 0.035)]],
  ECHO: () => [[at(sphere(0.045), 0, 0, 0.05)], [at(ring(0.092, 0.017), 0, 0, 0.035), at(ring(0.06, 0.008), 0, 0, 0.03)]],
  QUIET: () => [[at(sphere(0.085, 1.25, 0.85, 0.42), 0, 0, 0.03)], []],
  THRIFT: () => [[at(new THREE.BoxGeometry(0.1, 0.1, 0.1).rotateZ(Math.PI / 4).rotateX(0.35), 0, 0, 0.065)], [at(sphere(0.018), 0, 0, 0.015)]],
  LINGER: () => [[at(sphere(0.05), 0, -0.045, 0.045), at(new THREE.ConeGeometry(0.049, 0.11, 14), 0, 0.035, 0.045)], [at(sphere(0.016), 0, 0.1, 0.035)]],
  GENTLE: () => {
    const petals = [];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; petals.push(at(sphere(0.038, 1, 1, 0.6), Math.cos(a) * 0.052, Math.sin(a) * 0.052, 0.035)); }
    return [petals, [at(sphere(0.026), 0, 0, 0.05)]];
  },
};

const GEOS = new Map();
/** A charm's piece (cached: one geometry for every bracelet that holds it); null for an id it does not know. */
export function charmGeometry(id) {
  if (GEOS.has(id)) return GEOS.get(id);
  const make = SHAPES[id];
  if (!make) return null;
  const parts = make().map((list) => (list.length ? mergeGeometries(list.map((g) => g.toNonIndexed()), false) : null));
  const geo = mergeGeometries(parts.map((p) => p || new THREE.SphereGeometry(0.001, 3, 2).toNonIndexed()), true); // (two groups always: a charm with no gold keeps a speck, so the materials line up)
  geo.computeBoundingSphere();
  GEOS.set(id, geo);
  return geo;
}
