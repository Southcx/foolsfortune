import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

// `import b64 from './model.glb?b64'` -> base64 string. In the dev server the string is inlined. In the build each asset is a file of
// its own (`<name>.b64-<hash>.txt`, the base64 text) and the module awaits it from the page (`__ffText`, index.html's loader): the 7 MB
// of models and pictures that sat inside main.js as string literals (half its 14 MB: parsed, and its source held, by a phone at boot)
// now load beside it, those the boot needs fetched at once in parallel (`__ffEager`, laid in the page below), the rest (a dynamic
// import's: the skies, the hulls, the area cards, the Solar Skiff) only when asked. The text stays base64, so no caller changes.
const base64Assets = () => {
  let build = false;
  const refs = new Map(); // file -> the emitted asset's reference
  return {
    name: 'base64-assets',
    enforce: 'pre',
    configResolved(c) { build = c.command === 'build'; },
    load(id) {
      if (!id.endsWith('?b64')) return null;
      const file = id.slice(0, -4);
      this.addWatchFile(file);
      const b64 = readFileSync(file).toString('base64');
      if (!build) return `export default ${JSON.stringify(b64)};`;
      if (!refs.has(file)) refs.set(file, this.emitFile({ type: 'asset', name: `${basename(file)}.b64.txt`, source: b64 }));
      return `export default await globalThis.__ffText("__FF_B64:${refs.get(file)}:");`;
    },
    renderChunk(code) {
      if (!code.includes("__FF_B64:")) return null;
      return { code: code.replace(/__FF_B64:([^:"]+):/g, (_, ref) => this.getFileName(ref).replace(/^assets\//, '')), map: null };
    },
  };
};

// The bundles' last non-ASCII characters (esbuild's ascii charset leaves a regex literal's alone: ten of them, 92 bytes) as \u escapes,
// which mean the same in a string, a template and a regex (a surrogate pair as its two halves): WebKit holds a script's source as
// 16-bit text if one character needs it. A character already escaped (after a backslash) would change meaning, so it fails the build.
const asciiOnly = () => ({
  name: 'ascii-only',
  renderChunk(code) {
    if (!/[^\x00-\x7f]/.test(code)) return null;
    if (/\\[^\x00-\x7f]/.test(code)) this.error('ascii-only: a non-ASCII character after a backslash: escape it in the source');
    return { code: code.replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`), map: null };
  },
});

// The page's two ways in (the owner's iPhone, 2026-10-25: the host answers every supporting file 403 on iOS, the inline page runs; Dovina's
// probe): the built page keeps no module tag of its own, only a marker of its entry and build (`window.__ffEntry`, `__ffBuild`) for
// index.html's classic loader, which takes the files when they answer and the artifact's database when they do not (scripts/pack.mjs
// packs dist there). An import map is honoured only before any module loads, so the loader must choose first: no module tag may start.
const BUILD_ID = process.env.FF_BUILD || Date.now().toString(36);
const loaderEntry = () => ({
  name: 'ff-loader-entry',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html, ctx) {
    // (the base64 assets the boot's own chunks await, fetched as soon as the loader has chosen its way in: the entry and every chunk it
    //  imports statically; a dynamic import's are fetched when it is asked)
    const B = ctx.bundle || {}, seen = new Set(), eager = new Set();
    const walk = (f) => { const c = B[f]; if (!c || c.type !== 'chunk' || seen.has(f)) return; seen.add(f); for (const m of c.code.matchAll(/__ffText\("([^"]+\.txt)"\)/g)) eager.add(m[1]); c.imports.forEach(walk); };
    walk('assets/game.js'); (B['assets/game.js']?.dynamicImports || []).forEach(walk); // (the entry is a shim that imports main.js dynamically)
    const tag = /<script type="module" crossorigin src="\.\/assets\/game\.js"><\/script>\s*/;
    if (!tag.test(html)) throw new Error('ff-loader-entry: the entry tag is not where the loader expects it');
    return html.replace(tag, '').replace('<head>', `<head>\n  <script>window.__ffEntry = './assets/game.js'; window.__ffBuild = ${JSON.stringify(BUILD_ID)}; window.__ffEager = ${JSON.stringify([...eager].sort())};</script>`);
  },
});

export default defineConfig({
  base: './',
  // (the bundles in ASCII, every other character escaped: one non-ASCII byte made WebKit hold a script's whole source as 16-bit text,
  //  27 MB for game.js's 13.4; a phone's memory, 2026-10-24)
  esbuild: { charset: 'ascii' },
  // (each build's own id: progress belongs to the build it was earned in, src/core/progress.js)
  define: { __BUILD__: JSON.stringify(BUILD_ID) },
  plugins: [base64Assets(), asciiOnly(), loaderEntry()],
  // (a built asset's URL asked of the page at run time: the files' folder, or the blob the database route made; no preload helper, which
  //  resolves against import.meta.url and a blob: module has none to resolve against)
  experimental: { renderBuiltUrl: (file, { hostType }) => (hostType === 'js' ? { runtime: `globalThis.__ffFile(${JSON.stringify(file.replace(/^assets\//, ''))})` } : { relative: true }) },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 5000,
    modulePreload: false,
    // (the libraries in chunks of their own, leaves that import nothing of the game's: the host takes 16 MiB a file; game.js passed it at
    // v209 (16,786,559 bytes) and three.js went out; at v214 it stood 615 KB short, and Rapier (its wasm inlined, 4.3 MB) went out too)
    rollupOptions: { output: { entryFileNames: 'assets/game.js', manualChunks: (id) => (id.includes('/node_modules/three/') ? 'three' : id.includes('/node_modules/@dimforge/') ? 'rapier' : undefined) } },
  },
});
