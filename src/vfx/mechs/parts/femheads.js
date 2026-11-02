// ---------------------------------------------------------------------------------------
// A FEMININE MECH'S HEADS (the part library's heads for the forms with `fem`, kit.js FORMS; asked for by heads.js `headLookOf`): no
// head and no neck (South, 2026-11-02: "remember we're going with floating helmets for heads"). The head slot of a feminine form is
// only where a helm floats over the collar (vfx/mechs/helms.js `wearHelm`; the form's own `helm` worn while none is chosen, the parts
// body's `wearDefaultHelm`): its shell is the void a helm's fit is measured from and hides, a faceted dark with one faint light deep in
// it (lit with the cradle), seen only if no helm is worn. The collar it floats over is the core's (femcores.js: Haydee's collar ring).
// The head part's special (Divination's scan) is the part's, not its look's.
//   clayHead     the void at the doll's size
//   watcherHead  the same, a little taller (the helm floats higher)
// Prior art: FFXI's automatons (the Puppetmaster's: a head floating over the frame on no neck, a mask with nothing behind it); the
// helms' void (vfx/mechs/helms.js); Haydee (Haydee Interactive, 2016), whose head gave way to the helm.
//
//   femHeadLook(id, F) -> { neck, ball, neckSeg(S), build(S) }   (heads.js's contract)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L } from './kit.js';

/** The void a helm is fitted to: an icosahedron's dark (its half-width sets the helm's size, wearHelm's fit), the one light in it. */
function voidOf(S, r, cy) {
  const g = new THREE.IcosahedronGeometry(r, 0); g.computeVertexNormals();
  S.core.geo(g, { at: [0, cy, 0], sc: [1, 0.92, 1], c: L.hollow });
  S.e.box(r * 0.5, 0.03, 0.03, { at: [0, cy - r * 0.1, r * 0.55], c: 0xffffff }, 0.01);
}

export function femHeadLook(id, F) {
  const W = id === 'watcherHead', r = 1.3 * F.head;
  return {
    neck: 0.1, ball: 0.3,
    neckSeg() {}, // (no neck: the helm floats over the collar)
    build(S) { voidOf(S, r, 0.36 + 0.147 * r + (W ? 0.2 : 0)); }, // (wearHelm sets the helm's rim at the void's foot + 0.42 of its height: about 0.4 m over the collar)
  };
}
