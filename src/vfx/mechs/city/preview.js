// ---------------------------------------------------------------------------------------
// THE ADOBE CITY'S PREVIEW (plain names; DEBUG's `/adobecity`): the proving ground's toy city stood as the adobe proposal, before Dovina
// wires it, so South can walk it, carve it and judge it: every lot of ADOBE_LOTS (vfx/mechs/city/lots.js) made from its blueprint
// (blueprints.js) and given to her runtime (world/hangar/city.js) as the records her build() makes, then meshed by her and dressed by
// the city's dress (dress.js). Her rules still carve and collapse them as they are; two shims keep a preview from throwing on this
// branch until hers lands: a record names her `house` as its kind for her tables (its blueprint kept in `adobe`), and a cell of a
// material her table here lacks (her fire branch's paper and furnishing) stands as timber (its look role kept).
// Prior art: her ToyCity.build (the record's shape, word for word), the house's DEBUG previews of a look before its rule lands.
//
//   adobeRecs(city, lots = ADOBE_LOTS) -> [rec]   previewAdobe(city, on = true)   (`/adobecity on|off`, DEBUG: dress.js)
// ---------------------------------------------------------------------------------------
import { MATERIALS, BUILDINGS, MAT } from '../../../progress/mechs/destruction.js';
import { PROVING } from '../../../world/hangar/layout.js';
import { ADOBE, adobeBuilding } from './blueprints.js';
import { ADOBE_LOTS } from './lots.js';

/** The records her build() would make, one a lot, each building made from its blueprint (seeded by its lot). */
export function adobeRecs(city, lots = ADOBE_LOTS) {
  const A = PROVING.at;
  return lots.map((L, i) => {
    const b = adobeBuilding(L.id, L.seed ?? i + 1);
    for (let k = 0; k < b.mat.length; k++) if (b.mat[k] && !MATERIALS[b.mat[k]]) b.mat[k] = MAT.timber; // (her fire branch's materials, stood as timber here)
    const s = L.yaw ? -1 : 1, cx = A.x + L.x, cz = A.z + L.z;
    return { i, id: BUILDINGS[L.id] ? L.id : 'house', adobe: L.id, label: ADOBE[L.id].label, b, s, cx, cz, yaw: L.yaw || 0, dirty: true, felled: false, mesh: null,
      x0: cx - b.w / 2, x1: cx + b.w / 2, z0: cz - b.d / 2, z1: cz + b.d / 2, y0: A.y, y1: A.y + b.h };
  });
}

/** Stand the city as the adobe proposal (on), or as her own lots again (off). */
export function previewAdobe(city, on = true) {
  if (!city?.built) return false;
  if (!on) { const into = city.into; city.teardown(); city.build(into); return true; }
  for (const r of city.recs) { r.mesh?.geometry.dispose(); r.mesh?.parent?.remove(r.mesh); }
  city.recs = adobeRecs(city); city.remesh();
  return true;
}
