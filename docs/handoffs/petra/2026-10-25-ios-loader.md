# The build on iOS: load it from the artifact's database (Dovina, 2026-10-25)

**What fails.** On the owner's iPhone XR (iOS 18.7: Safari, Chrome and the Claude app alike), the artifact host refuses every
supporting file. Files published through `files` get 403 and the asset store's `/_blob/<id>` gets 404. That holds for a 23-byte script
as much as for a 13 MB one, and all of them fail at 0.1 s. The inline page itself runs. So "Could not start (html, 0.1 s): could not
load .../assets/game.js" is not size, memory or the contract: the host never serves the files. The likely cause is Safari blocking
cookies in the claudeusercontent frame. That is not proven, and it is not ours to fix.

**What works on the phone** (the probe, https://claude.ai/artifact/Gro6i8YTcqNpovZtB8K9py, contract 0.2.90, rows 7 to 13):
- code made in the page as `blob:` URLs, as a classic script (4 MB in 0.4 s) and as a module (`import()`);
- `DecompressionStream('gzip')`;
- **the artifact's database** (`claude.use('db')`): 0.7 MB of base64 in 4 docs read in 0.2 s, unzipped, every byte matching
  (sha-256). Database reads go through claude.ai itself, not through the frame's own server.
- **Row 0, pending the owner's run:** an import map laid before any module, with a page-made module importing another by a bare
  name.

**The route.** The game ships its bytes in the database, and the page builds the module graph from blob URLs.
- **Limits:** a doc is 256 KiB serialized, so a chunk is about 190 KB of base64. The database holds 100 MB and 25,000 docs. An
  `ArtifactData` batch is at most 50 writes and 1 MiB, so about 5 chunks a batch.
- **Size:** dist is about 33 MB raw and about 17 MB at gzip -9, so about 23 MB of base64 in about 125 docs. At the probe's rate that
  is about 7 s to read.
- **Packing (after `vite build`):** for each file in `dist/assets`, gzip -9, then base64, then split into chunks of about 190 KB.
  Write them to a collection keyed by the build (e.g. `build`, doc ids `<file>.<i>`). Add a manifest doc listing each file's chunk
  count, mime type, raw length and sha. Republishing a build overwrites the docs. Progress resets on every build anyway, so stale
  chunks can simply be deleted.
- **Loader (inline in `index.html`):** try the normal path first. When `fetch('./assets/game.js', { method: 'HEAD' })` is not 200,
  fall back:
  1. read the manifest, then read the chunks in parallel;
  2. unzip each file and make a blob URL;
  3. lay one `<script type="importmap">` (bare name to blob URL) **before any module loads**;
  4. `import('game')`.
- **The two catches:**
  - **Relative imports.** A chunk's `"./three-B_ukX5Bo.js"` cannot resolve against a `blob:` base, and an import map cannot match
    it. The pack step must rewrite each chunk's `"./<file>.js"` specifiers (static imports, `import()` and Vite's preload deps
    arrays) to the bare `"<file>.js"`, mapped in the import map.
  - **`new URL('./x', import.meta.url)`.** It throws under a `blob:` base. game.js has 8 of these (the .bin packs, the
    ground_pack .webp), and workbench has 3. The pack step must rewrite them to a lookup the loader fills (e.g.
    `globalThis.__ffFile('x')`, which returns the blob URL).
- **Who may read:** the database's default rules let anyone who can open the artifact read shared docs, so the build stays as
  shared as the page is. A signed-out visitor gets `null` from `use('db')` and would see the same refusal as today.

**Not tested:** a single chunk read by a cold phone over cellular, memory with 33 MB of blobs plus the game on the XR (the probe held
1000 MB or more before Safari reset it), workers (the game makes none today).

Delete this note once the loader is in, or once you rule it out.
