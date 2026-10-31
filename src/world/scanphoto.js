// ---------------------------------------------------------------------------------------
// THE SCANNER'S PHOTO (South, 2026-10-31, by Dovina: "lets try the photo button!"): where the browser has no BarcodeDetector (iOS), a
// still from the system camera sheet (an <input type="file" accept="image/*" capture="environment">, which asks no camera permission)
// read for a code in the page: drawn to a canvas, made grey, and handed to ZXing's readers (EAN-13/8, UPC-A/E, Code 128/39, QR); missed,
// it is tried again smoothed (a 3 x 3 box: a phone's sensor grain read as edges by the binarizer, measured: a QR under +-20 grain missed
// raw and read smoothed), turned a quarter at a time, and at half the size. The still never leaves the device and is let go once read; the
// text found goes to Scanner.read unchanged (world/scanner.js), so the rules are the code's own.
// The reader (@zxing/library, MIT) is loaded only when a photo is first read: its chunk never rides the boot.
//
// Prior art: ZXing ("zebra crossing", the reference barcode reader, its JavaScript port), every web scanner's still-image fallback.
//
//   readPhoto(file) -> Promise<text | null>   PHOTO (the sizes and turns tried)
// ---------------------------------------------------------------------------------------

/** The longest side the still is read at (CSS px of the canvas: a phone's 12 MP photo drawn smaller reads faster and as well), the
 *  smaller retry, raw then smoothed, and the quarter turns tried; the page yields between tries so a slow phone keeps drawing. */
export const PHOTO = { sizes: [1600, 800], smooth: [false, true], turns: [0, 1, 2, 3] };

let zx = null;
const reader = async () => {
  if (zx) return zx;
  const Z = await import('@zxing/library');
  const R = new Z.MultiFormatReader(), hints = new Map();
  const F = Z.BarcodeFormat;
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.QR_CODE]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  R.setHints(hints);
  zx = { Z, R };
  return zx;
};

/** The file as something a canvas can draw (an ImageBitmap, or an <img> where createImageBitmap is missing). */
async function picture(file) {
  if (typeof createImageBitmap === 'function') { try { return await createImageBitmap(file); } catch { /* (an old Safari: the <img> way) */ } }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

/** A 3 x 3 box blur of a grey image (the edges kept as they are). */
function smoothed(lum, w, h) {
  const out = new Uint8ClampedArray(lum);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    out[i] = (lum[i - w - 1] + lum[i - w] + lum[i - w + 1] + lum[i - 1] + lum[i] + lum[i + 1] + lum[i + w - 1] + lum[i + w] + lum[i + w + 1]) / 9;
  }
  return out;
}

/** One try: the picture drawn at `size` (its longest side), turned `turn` quarters, grey (smoothed if asked), and read. */
function tryRead({ Z, R }, pic, size, turn, smooth) {
  const w0 = pic.width, h0 = pic.height, k = Math.min(1, size / Math.max(w0, h0)), w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
  const side = turn % 2 === 1, cw = side ? h : w, ch = side ? w : h;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.translate(cw / 2, ch / 2); c.rotate((turn * Math.PI) / 2); c.drawImage(pic, -w / 2, -h / 2, w, h);
  const px = c.getImageData(0, 0, cw, ch).data; let lum = new Uint8ClampedArray(cw * ch);
  for (let i = 0, j = 0; j < lum.length; i += 4, j++) lum[j] = (px[i] * 77 + px[i + 1] * 150 + px[i + 2] * 29) >> 8;
  if (smooth) lum = smoothed(lum, cw, ch);
  cv.width = cv.height = 0; // (the canvas let go)
  try { return R.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.RGBLuminanceSource(lum, cw, ch))))?.getText() || null; }
  catch { return null; } finally { R.reset(); }
}

/** A photo read for a code: its text, or null when none was found. */
export async function readPhoto(file) {
  if (!file) return null;
  const [zxr, pic] = await Promise.all([reader(), picture(file)]);
  try {
    for (const size of PHOTO.sizes) for (const smooth of PHOTO.smooth) for (const turn of PHOTO.turns) { const t = tryRead(zxr, pic, size, turn, smooth); if (t) return t; await new Promise((r) => setTimeout(r, 0)); }
    return null;
  } finally { pic.close?.(); }
}
