// ---------------------------------------------------------------------------------------
// THE RACEWAY'S RAILS AND SUN RINGS (docs/plans/SKIFF-RACING.md sections 7 and 8): what the track's FEATURES lay out (world/raceway/
// track.js), built in the world. A RAIL is a ruin's lintel on its columns between two points of the line, its top the line the skiff's
// keel locks to (courier/skiff/grind.js: the skiff alone, no tool); it never sinks under the ground it crosses. Most follow the line's own
// curve (`along`: the owner, 2026-10-14, "racing is all about curves"), some weave across it; the cavern's runs along its branch. Its look is the Dunes'
// clay, with no collider: the board passes a rail it is not on, as it passes a sun plate. A SUN RING is the Gnomon's ring hung in the
// air (vfx/solarring.js, Calissa's look reused): flown through, it gives a push free of Lachryma (stronger under the aurora: conditions.js)
// and a link in the trick combo (courier/skiff/combo.js), once every few real seconds; the drop's rings hang on a glide's line from the lip, so a glide flown well takes them and a dive does not.
// Events: skiff.ring { ring, by }.
//
// Prior art: Sonic Riders' and Jet Set Radio's rails as a line through a course; Pilotwings' and Wave Race's rings; the house's own
// Solar Skiffing trial (world/dunes/solar.js), whose ring this is.
//
//   railPath(raceway, def) -> [Vector3] (its top, before the lift: where it runs)   buildRails(raceway) -> [{ pts, cum, len }]   buildRings(raceway) -> [ring]   flyRings(raceway, dt)   RING (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { addOutline } from '../../render/outline.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SolarRing } from '../../vfx/solarring.js';
import { FEATURES } from './track.js';
import { COMBO } from '../../courier/skiff/combo.js';

/** A ring: its radius (m); its push (m/s on the aim for s real seconds, and a kick now); real seconds before it can be taken again. */
export const RING = { r: 3.2, add: 8, dur: 1.0, kick: 3, again: 6 };
const STEP = 2, POST = 8; // (metres between a rail's points; between its columns)

const paint = (geo, color) => {
  const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g;
};
/** The world point at a place on the line, `lat` metres to its right. */
const sidePoint = (R, cp, at, lat) => { const s = R.T.sOf(cp, at), F = R.T.frame(s); return R.local(F.x - F.fz * lat, F.z + F.fx * lat); };
/** Where a rail runs, on the ground (world points every STEP metres): a chord between its ends, or along the line's curve (or the
 *  cavern's) with its lat eased from one end's to the other's and a weave of `wave` metres across. */
export function railPath(R, def) {
  if (!def.along && !def.line) { const a = sidePoint(R, ...def.from), b = sidePoint(R, ...def.to), n = Math.max(2, Math.ceil(a.distanceTo(b.clone().setY(a.y)) / STEP)); return Array.from({ length: n + 1 }, (_, i) => a.clone().lerp(b, i / n)); }
  const T = R.T, Bn = def.line === 'cavern' ? T.branch : null;
  const s0 = Bn ? def.from[0] : T.sOf(def.from[0], def.from[1]), s1r = Bn ? def.to[0] : T.sOf(def.to[0], def.to[1]), s1 = Bn || s1r >= s0 ? s1r : s1r + T.length;
  const lat0 = Bn ? def.from[1] : def.from[2], lat1 = Bn ? def.to[1] : def.to[2], n = Math.max(2, Math.ceil((s1 - s0) / STEP)), out = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n, F = Bn ? Bn.frame(s0 + (s1 - s0) * k) : T.frame(s0 + (s1 - s0) * k), lat = lat0 + (lat1 - lat0) * k + (def.wave || 0) * Math.sin(Math.PI * 2 * k * Math.max(1, Math.round((s1 - s0) / 40)));
    out.push(R.local(F.x - F.fz * lat, F.z + F.fx * lat));
  }
  return out;
}

export function buildRails(R) {
  const g = R.game, geos = [], rails = [];
  for (const def of FEATURES.rails) {
    const path = railPath(R, def), n = path.length - 1, a = path[0], b = path[n];
    const ya = a.y + def.lift, yb = b.y + def.lift, pts = [];
    const run = [0]; for (let i = 1; i <= n; i++) run.push(run[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z));
    for (let i = 0; i <= n; i++) { const p = path[i].clone(); p.y = Math.max(ya + (yb - ya) * (run[i] / run[n]), R.heightAt(p.x, p.z) + def.clear); pts.push(p); }
    for (let k = 0; k < 2; k++) for (let i = 1; i < n; i++) pts[i].y = Math.max(pts[i].y, (pts[i - 1].y + pts[i + 1].y) / 2); // (no dips between: a lintel sags nowhere)
    const cum = [0]; for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    rails.push({ pts, cum, len: cum[n] });
    // the look: a lintel along it, columns under it
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[i + 1], len = p.distanceTo(q), m = new THREE.Matrix4().lookAt(p, q, new THREE.Vector3(0, 1, 0)).setPosition(p.clone().lerp(q, 0.5));
      geos.push(paint(new THREE.BoxGeometry(0.5, 0.32, len + 0.05).applyMatrix4(m), 0x8a4a3a));
    }
    for (let d = 0; d <= cum[n]; d += POST) {
      let i = 0; while (i < n - 1 && cum[i + 1] < d) i++;
      const p = pts[i].clone().lerp(pts[i + 1], (d - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i])), foot = R.heightAt(p.x, p.z) - 0.4, h = p.y - 0.16 - foot;
      if (h > 0.2) geos.push(paint(new THREE.CylinderGeometry(0.22, 0.3, h, 6).translate(p.x, foot + h / 2, p.z), 0xd9906a));
    }
  }
  if (geos.length) {
    const mesh = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, flatShading: true }));
    mesh.castShadow = mesh.receiveShadow = true; mesh.userData.zone = 'raceway'; addOutline(mesh); g.scene.add(mesh); R.railMesh = mesh;
  }
  return rails;
}

export function buildRings(R) {
  const g = R.game, T = R.T, lipS = T.sOf(FEATURES.glideLip.cp, 0), lipY = T.frame(lipS).y;
  return FEATURES.rings.map(([cp, at, lat, over], i) => {
    const s = T.sOf(cp, at), F = T.frame(s), p = sidePoint(R, cp, at, lat), dir = new THREE.Vector3(F.fx, 0, F.fz);
    p.y = over > 0 ? p.y + over : R.center.y + lipY - (((s - lipS) % T.length + T.length) % T.length) / FEATURES.ringGlide; // (the drop's: on a glide's line from the lip)
    const look = new SolarRing({ radius: RING.r }); look.group.position.copy(p); look.group.lookAt(p.clone().add(dir)); look.group.userData.zone = 'raceway'; look.set({ lit: true });
    g.scene.add(look.group);
    return { i, pos: p, dir, look, wait: 0 };
  });
}

/** Each frame: the rings turn, and one flown through (the step since the last crossing its plane inside it, on the skiff) pushes. */
export function flyRings(R, dt, prev) {
  const g = R.game, P = g.player.pos, S = g.techs?.active?.id === 'skiff' ? g.techs.active : null;
  for (const Rg of R.rings) {
    Rg.look.update(dt); Rg.wait = Math.max(0, Rg.wait - dt);
    if (!S || Rg.wait > 0 || !prev) continue;
    const a = prev.clone().sub(Rg.pos).dot(Rg.dir), b = P.clone().sub(Rg.pos).dot(Rg.dir);
    if (!(a <= 0 && b >= 0 && a !== b)) continue;
    if (prev.clone().lerp(P, a / (a - b)).distanceTo(Rg.pos) > RING.r) continue;
    Rg.wait = RING.again; Rg.look.pass();
    const k = R.condition?.ring ?? 1; S.kick?.(RING.add * k, RING.dur, RING.kick * k); S.combo?.add('ring', COMBO.points.ring);
    g.events?.emit('skiff.ring', { ring: Rg.i, by: 'courier' });
  }
}
