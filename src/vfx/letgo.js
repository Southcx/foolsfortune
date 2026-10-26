// ---------------------------------------------------------------------------------------
// A CANVAS LET GO ONCE UPLOADED (a phone's memory, Petra's census 2026-10-26 in real WebKit as the iPhone XR: 405 live canvases, 58 MB,
// and iOS keeps a 2D canvas's backing store in the GPU process, the one that dies): a canvas texture painted once whose canvas is
// dropped when three has uploaded it, and painted again only if its pixels are ever asked for again (a lost context restored, a reader
// of `texture.image`). The same trick as render/bakedcanvas.js, for a texture already made (a painter of its own size, a loaded image
// redrawn at the tier's size). A canvas redrawn in play (a readout, a gauge) is never handed here.
//
// Prior art: render/bakedcanvas.js (Petra's: the same getter on the texture's Source); three.js's `Texture.onUpdate`.
//
//   letGo(texture, repaint) -> texture   repaint() -> a canvas like the first (called only if the pixels are asked for after they went)
// ---------------------------------------------------------------------------------------

export function letGo(t, repaint) {
  const src = t.source; let canvas = src.data;
  if (!canvas || typeof repaint !== 'function') return t;
  Object.defineProperty(src, 'data', { configurable: true, enumerable: true, get: () => (canvas ||= repaint()), set: (v) => { canvas = v; } });
  const was = t.onUpdate;
  t.onUpdate = (tex) => { canvas = null; was?.(tex); }; // (on the GPU now: the canvas let go)
  t.userData.baked = { width: canvas.width, height: canvas.height }; // (its size, for a reader that must not paint it again to ask: the probes' counts)
  return t;
}
