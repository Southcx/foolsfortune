import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// `import b64 from './model.glb?b64'` -> base64 string. Models ship inside the JS
// bundle so the build works on hosts that won't serve .glb files.
const base64Assets = () => ({
  name: 'base64-assets',
  enforce: 'pre',
  load(id) {
    if (!id.endsWith('?b64')) return null;
    const file = id.slice(0, -4);
    this.addWatchFile(file);
    return `export default ${JSON.stringify(readFileSync(file).toString('base64'))};`;
  },
});

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
  transformIndexHtml(html) {
    const tag = /<script type="module" crossorigin src="\.\/assets\/game\.js"><\/script>\s*/;
    if (!tag.test(html)) throw new Error('ff-loader-entry: the entry tag is not where the loader expects it');
    return html.replace(tag, '').replace('<head>', `<head>\n  <script>window.__ffEntry = './assets/game.js'; window.__ffBuild = ${JSON.stringify(BUILD_ID)};</script>`);
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
