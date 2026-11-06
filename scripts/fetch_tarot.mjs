// ---------------------------------------------------------------------------------------
// THE TAROT ART, FETCHED: the five Arcana classes' cards of Entropy Tactics (the Fool, the Empress, the Chariot, the Hermit, the Tower) from the
// Rider-Waite-Smith deck (Pamela Colman Smith's drawings for A. E. Waite, Rider & Son, 1909: public domain), as Wikimedia Commons hosts
// its scans (File:RWS_Tarot_NN_Name.jpg). Each is taken as Commons' own 330 px wide thumbnail (its path the file name's md5, the
// Commons layout), then cut to 512 px tall WebP with ffmpeg into src/assets/tarot/<cls>.webp, the art the Arcana's portraits
// (src/vfx/entropy/portraits.js) animate. Run once; the files are kept in the repo (credited in docs/CREDITS.md).
//
// Prior art: scripts/areacards/paint.py (an asset baked once into src/assets/, kept), Wikimedia's upload path scheme.
//
//   node scripts/fetch_tarot.mjs [cls ...]   (needs curl and ffmpeg; polite: a User-Agent and a pause between files, retried on 429)
// ---------------------------------------------------------------------------------------
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src/assets/tarot');
const CARDS = { fool: 'RWS_Tarot_00_Fool.jpg', empress: 'RWS_Tarot_03_Empress.jpg', chariot: 'RWS_Tarot_07_Chariot.jpg', hermit: 'RWS_Tarot_09_Hermit.jpg', tower: 'RWS_Tarot_16_Tower.jpg' };
const UA = 'FoolsFortuneAssetFetch/1.0 (a game in development; public-domain tarot scans)';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tarot-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const only = process.argv.slice(2); // (names given: only those cards, e.g. `node scripts/fetch_tarot.mjs tower`)
for (const [cls, file] of Object.entries(CARDS)) {
  if (only.length && !only.includes(cls)) continue;
  const h = crypto.createHash('md5').update(file).digest('hex');
  const url = `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}/${file}/330px-${file}`;
  const jpg = path.join(tmp, file);
  for (let tries = 0; ; tries++) {
    const code = execFileSync('curl', ['-sS', '-A', UA, '-o', jpg, '-w', '%{http_code}', url]).toString().trim();
    if (code === '200') break;
    if (tries >= 6) throw new Error(`${file}: HTTP ${code}`);
    await sleep(4000 * (tries + 1));
  }
  const webp = path.join(OUT, `${cls}.webp`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', jpg, '-vf', 'scale=-2:512:flags=lanczos', '-c:v', 'libwebp', '-quality', '82', webp]);
  console.log(`${cls}: ${(fs.statSync(webp).size / 1024).toFixed(1)} KB  <- ${url}`);
  await sleep(2500);
}
fs.rmSync(tmp, { recursive: true, force: true });
