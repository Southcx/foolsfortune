// ---------------------------------------------------------------------------------------
// A HULL PAINTING (the owner, 2026-10-24: "what about the base skiff texture, do you have alternate designs for that?"): the Solar Skiff's
// hull repainted whole. The owner's painting (courier_solarskiff_hull.png, in solarskiff.glb) is the default and is never changed; six
// alternates are painted on its own UV islands at its size by scripts/skiffpaint/hulls.py, each keeping the owner's linework and panel
// reading (its darks laid over), so each reads as the same board repainted: urushi lacquer, driftwood, celadon crackle, racing teak and
// brass, bone and obsidian, festival lacquer. Worn as `game.skiffPaint.worn.hull` (a paint kind, `hull`; the owner's when Dovina's
// catalogue lacks the kind or the id), applied by vfx/skiffpaintlook.js through the board's `setHullPainting(tex)`: the hull's map
// swapped, the same program (vfx/vessoulpaint.js), so a hull glaze (vfx/hullglaze.js: the material's colour) still tints it, and the
// worn hull's cracks (vfx/skiffboardlooks.js) are drawn over whichever painting is worn.
//
// Each painting is a chunk of its own, loaded the first time it is wanted (as a feeling's sky is: vfx/sky.js FEELING_SKIES), decoded
// once and kept; a session that never wears one never holds its bytes.
//
// Prior art: Mario Kart 8's and Forza's liveries (the body's own paint replaced, the model never new); a palette swap over a painting's
// tone layers (src/ui/pixel.js); the crafts each is after (scripts/skiffpaint/hulls.py's header names them).
//
//   SKIFF_HULLS { id: { label, line, load } }   HULL_IDS   hullPainting(id, like) -> Promise<Texture | null>   (like: the owner's texture,
//   its sampler copied)   wearHull(skiff, id)  (null or 'own': the owner's; the last call wins)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The paintings (the owner's is `own`, the default, and has no row). Labels plain: a craft's name, as the race board shows it. */
export const SKIFF_HULLS = {
  urushi: { label: 'Urushi lacquer', line: 'Black lacquer, the panels worn through to red, gold waves sprinkled over it.', load: () => import('../assets/skiff_hull_urushi.webp?b64') },
  driftwood: { label: 'Driftwood', line: 'Wood silvered by sun and salt, its grain raised, salt dried white where the spray sat.', load: () => import('../assets/skiff_hull_driftwood.webp?b64') },
  celadon: { label: 'Celadon crackle', line: 'A pale green glaze, pooled deeper in the panels, crazed all over.', load: () => import('../assets/skiff_hull_celadon.webp?b64') },
  teak: { label: 'Racing teak and brass', line: 'Varnished planks, brass fittings and rivets, a number band round the stern.', load: () => import('../assets/skiff_hull_teak.webp?b64') },
  obsidian: { label: 'Bone and obsidian', line: 'Black volcanic glass with a cold sheen, ivory bone for the ribs and the oars.', load: () => import('../assets/skiff_hull_obsidian.webp?b64') },
  festival: { label: 'Festival lacquer', line: 'A festival float\'s vermilion lacquer, gold clouds drifting over it.', load: () => import('../assets/skiff_hull_festival.webp?b64') },
};
export const HULL_IDS = ['own', ...Object.keys(SKIFF_HULLS)];

const cache = new Map(); // id -> Promise<Texture | null>

/** A painting's texture, decoded once; sampled as the owner's is (glTF's UVs: no flip; its filters, wrap and colour space). */
export function hullPainting(id, like) {
  const row = SKIFF_HULLS[id]; if (!row) return Promise.resolve(null);
  if (!cache.has(id)) {
    cache.set(id, row.load()
      .then(({ default: b64 }) => new THREE.TextureLoader().loadAsync(`data:image/webp;base64,${b64}`))
      .then((t) => {
        t.name = `skiff-hull-${id}`; t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = like?.magFilter ?? THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
        t.anisotropy = like?.anisotropy ?? 4; t.wrapS = like?.wrapS ?? THREE.RepeatWrapping; t.wrapT = like?.wrapT ?? THREE.RepeatWrapping;
        t.needsUpdate = true;
        return t;
      })
      .catch((e) => { console.warn('the hull painting', id, e); cache.delete(id); return null; }));
  }
  return cache.get(id);
}

/** Wear a painting on a board (its `setHullPainting`): null, 'own' or an unknown id the owner's. Asynchronous; the last call wins. */
export function wearHull(skiff, id) {
  if (!skiff?.setHullPainting) return;
  const want = SKIFF_HULLS[id] ? id : null;
  skiff.hullWant = want;
  if (!want) { skiff.setHullPainting(null); return; }
  hullPainting(want, skiff.hullTex).then((t) => { if (skiff.hullWant === want) skiff.setHullPainting(t); });
}
