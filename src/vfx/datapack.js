// ---------------------------------------------------------------------------------------
// A DATA PACK READ BACK EXACT (the owner's iPhone XR, 2026-10-26, Petra's handoff: WebKit drew the liquid packs black when they were
// decoded as an ImageBitmap with premultiplyAlpha 'none', colorSpaceConversion 'none' and the decoder's own resize): four grey channels
// of data (the liquid's packs, the garden's ground pack) saved as one OPAQUE image twice as wide, the first three channels on its left
// half and the fourth on its right (scripts/datapack.py). Opaque, a browser has nothing to premultiply; drawn into a canvas and read back,
// the bytes are the baked ones; joined here into one RGBA data texture, every consumer still reads .rgba as before. A phone's smaller
// copy is averaged here, two by two, never by the decoder. The canvas is let go as soon as its bytes are read.
//
// Prior art: the channel packing every engine bakes (Unreal's packed masks, Unity's mask maps), stored opaque where an alpha would be
// premultiplied on its way in; three.js's DataTexture.
//
//   dataPackTexture(src, { size }) -> THREE.DataTexture   src a URL or a data: URL; size the most texels a side (a phone's tier), null:
//   as baked. Mid-grey until it has loaded; repeat-wrapped, mipmapped, data (no colour space), never flipped (as the ImageBitmap was).
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

/** One step down: each texel the average of four (the pack tiles, so the halves stay seamless). */
function halve(a, w, h) {
  const W = w >> 1, H = h >> 1, out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, i0 = ((2 * y) * w + 2 * x) * 4, i1 = i0 + w * 4;
    for (let c = 0; c < 4; c++) out[o + c] = (a[i0 + c] + a[i0 + 4 + c] + a[i1 + c] + a[i1 + 4 + c] + 2) >> 2;
  }
  return { data: out, width: W, height: H };
}

export function dataPackTexture(src, { size = null, onError = null } = {}) {
  const t = new THREE.DataTexture(new Uint8Array([128, 128, 128, 128]), 1, 1, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.anisotropy = 4;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  if (typeof Image === 'undefined') return t;
  const im = new Image();
  im.onload = () => {
    const W2 = im.naturalWidth, H = im.naturalHeight, W = W2 >> 1;
    const c = document.createElement('canvas'); c.width = W2; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const px = g.getImageData(0, 0, W2, H).data; c.width = c.height = 0; // (its bytes read: the canvas let go)
    let img = { data: new Uint8Array(W * H * 4), width: W, height: H };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, i = (y * W2 + x) * 4, j = i + W * 4;
      img.data[o] = px[i]; img.data[o + 1] = px[i + 1]; img.data[o + 2] = px[i + 2]; img.data[o + 3] = px[j];
    }
    while (size && img.width > size && img.width > 1) img = halve(img.data, img.width, img.height);
    t.dispose(); t.image = img; t.needsUpdate = true; // (the 1x1 stand-in's storage let go first: three allocates a DataTexture's storage once (texStorage2D), so a stand-in drawn before the load would hold it at 1x1 for good, Petra's probe, GL error 1281)
  };
  im.onerror = (e) => (onError ? onError(e) : console.warn('dataPackTexture: did not load', e));
  im.src = src;
  return t;
}
