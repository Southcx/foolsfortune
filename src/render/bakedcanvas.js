// ---------------------------------------------------------------------------------------
// A BAKED CANVAS TEXTURE (a phone's memory, 2026-10-24: the build would not open on the owner's iPhone; measured as a phone, 252 canvas
// textures held 137 MB of canvas beside their GPU copies, 51 MB of it the basement's 162 labels): a canvas drawn once and never again
// lets its pixels go once the GPU has them, and is drawn again only if they are ever asked for again (a lost context restored, a
// reader of `texture.image`): the canvas was the page's second copy of every baked label and atlas, kept for nothing. Its size can be
// scaled by the graphics tier (`labelScale`): the same drawing at a fraction of the pixels, its painter drawing in the full size's
// units. A canvas redrawn in play (a readout, a gauge) is a plain CanvasTexture, never this.
//
// Prior art: three.js's own `Texture.onUpdate` (called once the upload is done) and its Source (the image a texture's upload reads);
// the GPU-only static texture of every engine (Unity's Texture2D.Apply(makeNoLongerReadable), Unreal's discarded CPU copy).
//
//   bakedCanvasTexture(paint, w, h, { scale })  -> THREE.CanvasTexture   paint(ctx2d, w, h) draws in w x h units, called on the first read
//                                                of its pixels (the upload, as a rule), and again only if they are asked for after they went)
//                                                .userData.baked { width, height }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** The canvas drawn at `scale` of w x h, its painter drawing in w x h units. */
function drawn(paint, w, h, scale) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
  const g = c.getContext('2d');
  if (scale !== 1) g.scale(c.width / w, c.height / h);
  paint(g, w, h);
  return c;
}

export function bakedCanvasTexture(paint, w, h, { scale = 1 } = {}) {
  const t = new THREE.CanvasTexture();
  const src = t.source;
  let canvas = null; // (not painted until first asked for: a label of a place not yet seen holds no pixels, v289's census as the XR: 171 canvases, 27 MB, painted at boot for rooms never drawn)
  Object.defineProperty(src, 'data', { configurable: true, enumerable: true, get: () => (canvas ||= drawn(paint, w, h, scale)), set: (v) => { canvas = v; } });
  t.onUpdate = () => { canvas = null; }; // (on the GPU now: the canvas let go; asked for again, it is drawn again)
  t.userData.baked = { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }; // (its size, for a reader that must not draw it to ask: the perf's and a probe's counts)
  return t;
}
