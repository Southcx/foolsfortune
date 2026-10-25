// ---------------------------------------------------------------------------------------
// THE COURIER'S MATERIALS (part of courier/character.js): what the Courier's meshes are drawn with (three.js's materials, not Soul
// Alchemy's), and the tag the body's meshes are given as it is dressed. The maker's paintings of the armour and the mask, lit as the game
// lights them (PAINT_LIGHT); `MATS` makes a material by the name the glTF gave it (the energy, the energy's shell, the armour's
// painting, the mask's), `OUTLINED` is the set of names that get an outline, `regionOf` says which glaze region a mesh is (the kiln's:
// courier/vessel/glazes.js REGIONS), and `tagFpHide` gives a mesh the per-vertex weight the first-person hide reads (render/outline.js
// applyFpHide).
//
// Prior art: hand-painted textures over a lit toon base, as in The Wind Waker (vfx/vessoulpaint.js takes the same).
//
//   MATS[name]() -> a material     OUTLINED (a Set of names)     regionOf(mesh, materialName, isArmor) -> a region | null
//   tagFpHide(mesh, isArmor)       (the paintings are loaded on the first MATS call that needs them, once for every Character)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { PALETTE } from '../../core/config.js';
import armorB64 from '../../assets/courier/courier_armor.png?b64';
import maskB64 from '../../assets/courier/courier_mask.png?b64';

// The maker's paintings of the armour and the mask (source_assets/courier_armor.png, courier_mask.png). In Blender they were drawn
// unlit (an emission shader), the light painted in; here they take the game's light, and the same painting glows back a share of
// itself (PAINT_LIGHT) so its painted values hold in the shadowed side of the cel ramp instead of sinking to black.
const PAINT_LIGHT = 0.45;
function painting(b64) {
  const t = new THREE.TextureLoader().load(`data:image/png;base64,${b64}`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // (glTF's UV convention)
  t.anisotropy = 4;
  return t;
}
let PAINT = null;
const paint = () => (PAINT ||= { armor: painting(armorB64), mask: painting(maskB64) });
const painted = (map) => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: PAINT_LIGHT, roughness: 0.7, metalness: 0.0 });

export const MATS = {
  Courier_Armor: () => painted(paint().armor),
  CourierEnergy: () => new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.4, emissive: PALETTE.glow, emissiveIntensity: 0.18 }),
  CourierEnergyShell: () => new THREE.MeshStandardMaterial({ color: PALETTE.pale, roughness: 0.3, transparent: true, opacity: 0.22, depthWrite: false }),
  CourierMask: () => painted(paint().mask),
};
export const OUTLINED = new Set(['Courier_Armor', 'CourierMask', 'Kiritohair']);
/** Which glaze region a mesh of the Courier is (courier/vessel/glazes.js REGIONS), or null (the Lachryma of their body is never glazed). */
export function regionOf(o, matName, isArmor) {
  if (isArmor) return matName === 'Courier_Armor' ? 'body' : 'trim';
  if (o.name === 'Courier_Mask') return 'mask';
  if (o.name === 'Kiritohair') return 'hair';
  if (o.name === 'Courier_Stones') return 'stones'; // (gems, not trim: the kiln sets stones in them, vfx/finish.js)
  if (o.name === 'Courier_Skin_Core') return 'skin'; // (the Lachryma of the body: the kiln gives it tones, never a glaze)
  return null;
}

// First person shows only the hands on the gun: every other vertex of the body is
// discarded (per vertex, by skin weight) so the camera never sees the torso from inside.
const HAND_BONE = /^(hand|f_|thumb)/;
export function tagFpHide(mesh, isArmor) {
  const g = mesh.geometry;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bones = mesh.skeleton?.bones;
  const out = new Float32Array(g.attributes.position.count).fill(1);
  if (!isArmor && si && bones) {
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (HAND_BONE.test(bones[si.getComponent(i, k)]?.name || '')) w += sw.getComponent(i, k);
      out[i] = 1 - w;
    }
  }
  g.setAttribute('fpHide', new THREE.BufferAttribute(out, 1));
}
