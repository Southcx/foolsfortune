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

export default defineConfig({
  base: './',
  // (each build's own id: progress belongs to the build it was earned in, src/core/progress.js)
  define: { __BUILD__: JSON.stringify(Date.now().toString(36)) },
  plugins: [base64Assets()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 5000,
    // (three.js in a chunk of its own: the host takes 16 MiB a file, and game.js passed it at v209, 16,786,559 bytes)
    rollupOptions: { output: { entryFileNames: 'assets/game.js', manualChunks: (id) => (id.includes('/node_modules/three/') ? 'three' : undefined) } },
  },
});
