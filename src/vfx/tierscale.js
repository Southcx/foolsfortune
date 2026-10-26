// ---------------------------------------------------------------------------------------
// A TEXTURE AT THE TIER'S SIZE (a phone's memory, 2026-10-25: Petra's ask, measured on an emulated iPhone XR by scripts/phonememory.mjs):
// the graphics tier's `textureScale` (render/graphics.js: High 1, Low and Minimum 0.5) for my baked textures, env maps and loaded
// paintings, so a phone uploads a quarter of the pixels. A loaded image is drawn again into a canvas at that scale the moment it
// arrives, before its first upload; on High it is left as loaded.
//
// Prior art: Unity's per-platform max texture size and Unreal's texture LOD bias (the same image, a smaller mip chosen at import).
//
//   tierScale()      0..1, never above 1
//   fitToTier(t)     a TextureLoader's onLoad: t.image drawn again at tierScale (the texture's other settings kept)   -> t
//   tierSize(n, min) n scaled, rounded, at least min
// ---------------------------------------------------------------------------------------
import { T } from '../core/config.js';
import { letGo } from './letgo.js';

export const tierScale = () => Math.min(1, T.visual.textureScale ?? 1);
export const tierSize = (n, min = 1) => Math.max(min, Math.round(n * tierScale()));

export function fitToTier(t) {
  const k = tierScale(), im = t?.image;
  if (k >= 1 || !im?.width) return t;
  const paint = () => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c; };
  t.image = paint(); t.needsUpdate = true;
  return letGo(t, paint); // (the canvas let go once uploaded: vfx/letgo.js)
}
