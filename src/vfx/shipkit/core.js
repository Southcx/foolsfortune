// ---------------------------------------------------------------------------------------
// THE SHIP'S CORE: the helm's cradle (vfx/cradlelook.js, the Pneuka Jar's seat: the one thread kept from the old hulls, Espada's canon)
// set into the deck as a ship's cockpit, with Lachrymite grown round it in a ring of faceted crystals lit in the ship's feeling (the
// mesher's feeling code: `feeling(hex)` and the form's colour reach it through the hull's material), a collar plate, and a canopy of ribs
// over it, open between them so the core is seen from above (the chase camera's view). Written into the ship's one static mesh: no
// draw of its own. The cradle itself is placed by the ship's look (shipkit/shiplook.js).
// Prior art: Tenchi Muyo's treeships (a living tree in the core, its light spreading out through the hull), Ryo-Ohki's central gem, a
// fighter's canopy frame, Outlaw Star's cockpit set into a clean hull.
//
//   writeCore(M, { at: [x, y, z], r, crystal, collar, frame, ribs, apex, seed, canopy, plate, ring, crystals, k })   (r: the cradle's foot
//   radius, metres; plate: the collar's width; a galleon's twin helms grow their crystals each and share one canopy; k: the crystals', the
//   ribs' and the crown's sizes grown, the cradle kept at the Pneuka Jar's own: a big hull's core is a bigger cockpit round the same seat)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

export function writeCore(M, { at, r = 0.61, crystal = 0xffffff, collar = 0x2a2f3a, frame = 0x2a2f3a, ribs = 6, apex = 1.0, seed = 1, canopy = true, plate = 0.22, ring = true, crystals = true, k = 1 }) {
  const [x, y, z] = at, R = r + 0.06;
  // the collar: an octagonal plate a little proud of the deck round the cradle's foot, its rim lit in the feeling
  if (ring) for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8, o = R + plate;
    const p = (a, rr, yy) => [x + Math.cos(a) * rr, y + yy, z + Math.sin(a) * rr];
    M.quad(p(a0, R, 0.05), p(a1, R, 0.05), p(a1, o, 0.05), p(a0, o, 0.05), collar, 0.1, [x, y - 1, z]);
    M.quad(p(a0, o, 0.05), p(a1, o, 0.05), p(a1, o + 0.03, -0.06), p(a0, o + 0.03, -0.06), collar, 0, [x, y, z]);
    M.quad(p(a0, R - 0.005, 0.052), p(a1, R - 0.005, 0.052), p(a1, R + 0.035, 0.052), p(a0, R + 0.035, 0.052), crystal, 0.8, [x, y - 1, z]); // (the lit rim)
  }
  // the Lachrymite: a ring of crystals leaning out from the cradle, tall and short in turn, grown at the collar's edge
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const n = crystals ? 11 : 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3, rr = R + (0.08 + rnd() * 0.06) * k, h = ((i % 2 ? 0.22 : 0.42) + rnd() * 0.14) * k;
    const c = new THREE.Vector3(x + Math.cos(a) * rr, y + 0.06, z + Math.sin(a) * rr), axis = new THREE.Vector3(Math.cos(a) * 0.45, 1, Math.sin(a) * 0.45);
    M.gem(c, (0.05 + rnd() * 0.03) * k, h, 0.04 * k, 5, crystal, 0.92, { axis, twist: rnd() * 3 });
  }
  if (!canopy) return;
  // the canopy: ribs from the collar's edge to a crown ring over the cradle (open between: the core seen from above)
  const crown = 0.16 * k, ry = y + apex, rib = 0.035 * k;
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), pts = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4, rr = THREE.MathUtils.lerp(R + plate * 0.9, crown, t * t), yy = y + 0.05 + (apex - 0.05) * Math.sin((t * Math.PI) / 2); pts.push([x + ca * rr, yy, z + sa * rr]); }
    for (let k = 0; k < 4; k++) M.cyl(pts[k], pts[k + 1], rib, rib * 0.9, 4, frame, 0, { caps: false, smooth: false });
  }
  M.cyl([x, ry - 0.03 * k, z], [x, ry + 0.03 * k, z], crown + 0.03 * k, crown + 0.02 * k, 8, frame, 0);
  M.gem([x, ry + 0.05 * k, z], crown * 0.7, 0.12 * k, 0.02 * k, 6, crystal, 0.9); // (the crown's own crystal: the core's light at the top of the cage)
}
