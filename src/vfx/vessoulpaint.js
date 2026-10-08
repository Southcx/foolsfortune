// ---------------------------------------------------------------------------------------
// THE VESSOUL'S PAINTINGS: the owner's textures for two of the Vessoul's forms, the god hand (courier_godhand_base.png: maroon clay
// with gears, braided rope round the fingers, the porthole ring on its back, the brass gear plate at the wrist) and the Pneuka Jar
// (courier_pneukajar_base.png: three bands round it, the face with its eyes and the crown's dot, the ornate middle with its circle,
// the arches below), as the house's painted material: the painting as the colour and, at the same strength the Courier's armour and
// mask take (character.js PAINT_LIGHT), as a share of its own glow, so its painted values hold on the shadowed side instead of
// sinking to black. Mipmapped, so the rope's braid and the gears never crawl at a distance. The Jar's five gems are not painted:
// they stay the core's light (godhand/jar.js coreMat). Both fit their meshes' UVs (checked: each UV wireframe laid over its image).
//
// Prior art: the Courier's paintings (courier/character.js painted()), hand-painted textures over a lit toon base as in Wind Waker
// and Okami's sumi-e ink, which glow a little of their own colour back so the paint reads in shade.
//
//   const m = godHandPainting()   const j = pneukaJarPainting()   paintFlash(j, flash)  (a blow's flash, a mend's warmth: -1 .. 1)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import handB64 from '../assets/courier/courier_godhand_base.png?b64';
import jarB64 from '../assets/courier/courier_pneukajar_base.png?b64';

export const PAINT_LIGHT = 0.45; // (the share of itself a painting glows back: the Courier's, character.js)

function painting(b64) {
  const t = new THREE.TextureLoader().load(`data:image/png;base64,${b64}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // (glTF's UV convention)
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  return t;
}
const painted = (map, o = {}) => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: PAINT_LIGHT, roughness: 0.7, metalness: 0, ...o });

/** The god hand's painted clay (one material: godhand.js sets its glow's pulse). */
export function godHandPainting() { const m = painted(painting(handB64)); m.name = 'Courier_Godhand'; return m; }
/** The Pneuka Jar's painted clay (its body; the gems keep the core's light). */
export function pneukaJarPainting() { const m = painted(painting(jarB64), { roughness: 0.6 }); m.name = 'Courier_PneukaJar'; return m; }

/** A blow's flash (flash > 0, hot) or a mend's warmth (flash < 0) on a painted material: its own painting glowing brighter, warmer. */
export function paintFlash(m, flash) {
  const hot = Math.max(0, flash), warm = Math.max(0, -flash);
  m.emissiveIntensity = PAINT_LIGHT * (1 + 2.2 * hot + 0.8 * warm);
  m.emissive.setRGB(1, 1 - 0.25 * hot, 1 - 0.45 * hot);
}
