// ---------------------------------------------------------------------------------------
// THE BUILD PACKED FOR THE STORE (the owner's iPhone, 2026-10-25: on iOS the artifact host answers every supporting file 403, while the
// page and its database work; Dovina's probe, docs/handoffs/petra/2026-10-25-ios-loader.md): after `npm run build`, every file of
// dist/assets as gzip in base64, cut into chunks a database document holds, with a manifest, for index.html's loader to read when the
// files are refused. A script's relative imports ("./x.js") are made bare ("x.js"), since a blob: module has no base to resolve them
// against and the loader's import map names each script by its file name; the built assets' URLs are already asked of the page at run
// time (vite.config.js renderBuiltUrl, `__ffFile`). Petra publishes: the chunks are written to the artifact's database collection `pack`
// as `f.<the file's content hash>.<i>` (content-addressed since v284: a file unchanged since the last build is not written again, and the
// phone's cache of it is kept) and the manifest as `<build>.manifest`, a batch at a time from the plan written beside them.
//
// Prior art: Dovina's probe (rows 0 and 7 to 13 on the owner's XR); a CDN's chunked upload; the PWA's cache-first app shell.
//
//   npm run build && node scripts/pack.mjs [--out <dir>] [--have <last published manifest.json>]   -> <dir>/docs/<doc id>.json, <dir>/batches.json, <dir>/gone.json, a line of numbers
// ---------------------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist'), ASSETS = path.join(DIST, 'assets');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg('--out', path.join(ROOT, 'dist-pack')));
// (--have <a manifest already published>: the files whose content it names are in the store already, keyed by their hash, and only
//  the rest are written; `gone.json` lists the chunks of the old manifest's files this build no longer uses, to delete after publishing)
const HAVE = arg('--have', null), haveMan = HAVE ? JSON.parse(fs.readFileSync(HAVE, 'utf8')) : null;
const have = new Set(haveMan ? Object.values(haveMan.files).filter((f) => f.doc).map((f) => f.sha) : []);
/** chunk: base64 characters a document (its limit is 256 KiB serialized); batchBytes and batchDocs: a database batch's limits, with room. */
export const PACK = { chunk: 190000, batchBytes: 900000, batchDocs: 45, entry: 'game.js' };
const MIME = { js: 'text/javascript', txt: 'text/plain', bin: 'application/octet-stream', webp: 'image/webp', png: 'image/png', json: 'application/json', css: 'text/css' };

const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const build = (html.match(/__ffBuild = "([^"]+)"/) || [])[1];
if (!build) throw new Error('pack: dist/index.html carries no __ffBuild: build first (npm run build)');
const names = fs.readdirSync(ASSETS).filter((n) => fs.statSync(path.join(ASSETS, n)).isFile()).sort();
if (!names.includes(PACK.entry)) throw new Error(`pack: no ${PACK.entry} in dist/assets`);

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'docs'), { recursive: true });
const files = {}, docs = [];
let reused = 0;
let raw = 0, packed = 0;
names.forEach((name, id) => {
  let buf = fs.readFileSync(path.join(ASSETS, name));
  if (name.endsWith('.js')) {
    let src = buf.toString('utf8');
    for (const other of names) src = src.split(`"./${other}"`).join(`"${other}"`).split(`'./${other}'`).join(`'${other}'`);
    if (/(?:import\s*\(|from|import)\s*["']\.\/[\w.-]+\.js["']/.test(src)) throw new Error(`pack: ${name} still imports a relative script the import map cannot name`);
    buf = Buffer.from(src, 'utf8');
  }
  const b64 = zlib.gzipSync(buf, { level: 9 }).toString('base64');
  const n = Math.ceil(b64.length / PACK.chunk), sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16), doc = `f.${sha}`;
  const kept = have.has(sha); // (already in the store from an earlier build: its chunks are not written again)
  for (let i = 0; i < n; i++) {
    const docId = `${doc}.${i}`;
    if (kept) continue;
    fs.writeFileSync(path.join(OUT, 'docs', `${docId}.json`), JSON.stringify({ b: b64.slice(i * PACK.chunk, (i + 1) * PACK.chunk) }));
    docs.push({ docId, bytes: Math.min(PACK.chunk, b64.length - i * PACK.chunk) + 16 });
  }
  files[name] = { id, n, doc, mime: MIME[name.split('.').pop()] || 'application/octet-stream', len: buf.length, sha };
  if (kept) reused++;
  raw += buf.length; packed += b64.length;
});
const manifest = { build, entry: PACK.entry, files, at: new Date().toISOString() };
fs.writeFileSync(path.join(OUT, 'docs', `${build}.manifest.json`), JSON.stringify(manifest));

// the writes, a batch at a time within the limits; the manifest last, so a reader never finds it before its chunks
const batches = []; let cur = [], size = 0;
for (const d of docs) {
  if (cur.length && (size + d.bytes > PACK.batchBytes || cur.length >= PACK.batchDocs)) { batches.push(cur); cur = []; size = 0; }
  cur.push({ op: 'set', collection: 'pack', doc_id: d.docId, file_path: path.join(OUT, 'docs', `${d.docId}.json`) }); size += d.bytes;
}
if (cur.length) batches.push(cur);
batches.push([{ op: 'set', collection: 'pack', doc_id: `${build}.manifest`, file_path: path.join(OUT, 'docs', `${build}.manifest.json`) }]);
fs.writeFileSync(path.join(OUT, 'batches.json'), JSON.stringify(batches, null, 1));
const now = new Set(Object.values(files).map((f) => f.sha));
const gone = haveMan ? Object.values(haveMan.files).filter((f) => f.doc && !now.has(f.sha)).flatMap((f) => Array.from({ length: f.n }, (_, i) => `${f.doc}.${i}`)).concat([`${haveMan.build}.manifest`]) : [];
fs.writeFileSync(path.join(OUT, 'gone.json'), JSON.stringify(gone));
console.log(`pack: build ${build}, ${names.length} files, ${(raw / 1e6).toFixed(1)} MB raw -> ${(packed / 1e6).toFixed(1)} MB base64 in ${docs.length} chunks to write (${reused} files already in the store), ${batches.length} batches, ${gone.length} old docs to delete (${OUT})`);
